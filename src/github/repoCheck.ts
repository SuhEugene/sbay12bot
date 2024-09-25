import { promises as fs } from "fs";
import { EMBED_COLOR_WARNING, GithubLabel, getAcceptOrVoteMirrorRow, githubLabels, mirrorPRs, shared } from "../shared.js";
import path from "path";
import { cwd } from "process";
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import simpleGit, { CleanOptions, ResetMode } from "simple-git";
import type { RequestError } from "@octokit/request-error";
import { ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from "discord.js";
import { bot } from "../main.js";
import fetch from "node-fetch";

const filePath = path.join(cwd(), "src", "data", "lastFetch.txt");
const repoPath = path.join(cwd(), "repo");
const git = simpleGit(repoPath);

function customFetch(url: string, options: Record<string, string>) {
  return fetch(url, options);
}

async function getSinceDate() {
  let sinceDate = new Date(parseInt(process.env["DEFAULT_SINCE_TIMESTAMP"] as string, 10));
  try {
    const got = await fs.readFile(filePath, "utf-8");
    if (got) sinceDate = new Date(got);
  } catch (e) { }

  return sinceDate;
}

async function writeSinceDate(currentTime: Date) {
  await fs.writeFile(filePath, currentTime.toISOString(), "utf-8");
}

async function getPRsToMerge(octo: Octokit, owner: string, repo: string, sinceDate: Date) {
  const PRs: RestEndpointMethodTypes["pulls"]["list"]["response"]["data"] = [];

  const prPaginator = octo.paginate.iterator(octo.pulls.list, {
    owner, repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
  });

  let end = false;
  for await (const page of prPaginator) {
    for (const pr of page.data) {
      if (new Date(pr.updated_at) <= sinceDate) { end = true; break; }
      if (pr.number == 33625) continue;

      if (!pr.merged_at)
        continue;
      if (new Date(pr.merged_at) <= sinceDate)
        continue;
      if (pr.title.startsWith("Bump actions/"))
        continue;

      PRs.push(pr);
    }
    if (end) break;
  }

  return PRs.reverse();
}

function log(...args: any[]) {
  return console.log("=== GIT ===\n", ...args, "\n--- GIT ---")
}

type PRData = {
  title: string,
  body: null | string,
  html_url: string,
  number: number
};

async function sendToMirrorDiscord(pr: PRData) {
  const embed = new EmbedBuilder()
    .setTitle(
      pr.title.length > 100
        ? pr.title.substring(0, 97) + "..."
        : pr.title
    )
    .setDescription(
      pr.body
        ? (
          pr.body.length > 1000
            ? pr.body.substring(0, 997) + "..."
            : pr.body
        )
        : "No description provided"
    )
    .setColor(EMBED_COLOR_WARNING)
    .setURL(pr.html_url);

  const guild = await bot.guilds.fetch(process.env["REPORT_GUILD"] as string);
  const channel: TextChannel = await guild.channels.fetch(process.env["MIRROR_CHANNEL"] as string) as TextChannel;

  const githubButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setURL(pr.html_url)
    .setLabel(`GitHub PR #${pr.number}`);

  const row = getAcceptOrVoteMirrorRow(githubButton);

  const msg = await channel.send({
    embeds: [embed],
    components: [row]
  });

  await mirrorPRs.push({ pr_number: pr.number, message: msg.id });
}

function checkForCl(body = '', username = '') {
  if (!body || !username) return body;

  const CL_BODY = /(?<cl1>:cl:|🆑)(?<author>.+)?(?<rest>\r?\n(.|\n|\r)+?\r?\n\/(:cl:|🆑))/;
  const match = body.match(CL_BODY);

  if (!match || !match.groups?.cl1) return body;
  if (match.groups.author?.trim()) return body;

  console.log(">>> INSERTING AUTHOR " + username);

  return body.replace(match[0], `${match.groups.cl1}${username}${match.groups.rest}`);
}


export async function checkRepo() {
  const octo = shared.octokit;
  if (!octo) return;

  if (!process.env["GET_REPO"])
    throw Error("Could not find GET_REPO in your environment")
  if (!process.env["BASE_BRANCH"])
    throw Error("Could not find BASE_BRANCH in your environment")
  if (!process.env["REPORT_REPO"])
    throw Error("Could not find REPORT_REPO in your environment")
  if (!process.env["GIT_EMAIL"])
    throw Error("Could not find GIT_EMAIL in your environment")
  if (!process.env["GIT_NAME"])
    throw Error("Could not find GIT_NAME in your environment")

  const [getOwner, getRepo] = process.env["GET_REPO"].split("/");
  const [owner, repo] = process.env["REPORT_REPO"].split("/");

  const sinceDate = await getSinceDate();
  console.log("Checking repo " + process.env["GET_REPO"]);
  console.log("Since:", sinceDate);
  console.log("At:", new Date());

  const repoExists = await git.checkIsRepo();
  console.log(`[PRMERGE] Repo ${repoExists ? "exists" : "does not exist"}`);
  if (!repoExists) {
    console.log("[PRMERGE] Cloning repo...");
    await git.clone(`https://github.com/${owner}/${repo}.git`, repoPath, [], console.log);
    await git.addRemote("upstream", `https://github.com/${getOwner}/${getRepo}.git`, log);
  }
  console.log("[PRMERGE] Setting git user...");
  await git.addConfig("user.email", process.env["GIT_EMAIL"]);
  await git.addConfig("user.name", process.env["GIT_NAME"]);

  console.log(`[PRMERGE] Getting PRs to merge...`);
  const prs = await getPRsToMerge(octo, getOwner, getRepo, sinceDate);

  for (const pr of prs) {
    try {
      await mergePr(octo, owner, repo, process.env["BASE_BRANCH"], pr);
    } catch (e: any) {
      console.error("Check failed!");
      console.error(e);
      return;
    }
    console.log(`[PRMERGE] Writing since date...`);
    await writeSinceDate(new Date(pr.updated_at));
  }
  console.log("Check successful!")
}

const ERROR_SKIPLIST: string[] = [];
export async function mergePr(octo: Octokit, owner: string, repo: string, baseBranch: string, pr: RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][0]) {
  console.log("\n\n[PRMERGE] >>> PR NUMBER " + pr.number)

  const branchName = `upstream-pr-${pr.number}`;
  const patchFileName = path.join(repoPath, branchName + ".patch");

  console.log(`[PRMERGE] Resetting everything...`);
  await git.reset(ResetMode.HARD, log);
  await git.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE, log);

  console.log(`[PRMERGE] Checking out ${baseBranch}...`)
  await git.checkout(baseBranch);

  console.log(`[PRMERGE] Pulling origin ${baseBranch}...`)
  await git.pull("origin", baseBranch);
  try {
    console.log(`[PRMERGE] Checking out ${branchName} from ${baseBranch}...`);
    await git.checkoutBranch(branchName, baseBranch);
  } catch (e) {
    console.log(`[PRMERGE] Deleting branch ${branchName}...`);
    await git.deleteLocalBranch(branchName, true);

    console.log(`[PRMERGE] Checking out ${branchName} from ${baseBranch} again...`);
    await git.checkoutBranch(branchName, baseBranch);
  }

  console.log(`[PRMERGE] Requesting patch for PR #${pr.number}...`);
  const patch = await octo.request(pr.patch_url, {
    request: { fetch: customFetch }
  }).catch(async (e: any) => {
    const guild = await bot.guilds.fetch(process.env["REPORT_GUILD"] as string);
    const channel: TextChannel = await guild.channels.fetch(process.env["MIRROR_CHANNEL"] as string) as TextChannel;
    await channel.send(
      '## Ошибка получения патча\n' +
      `<@${process.env.HEAD_USER_MENTION}>\n` +
      `Копирование [Pull Request ${pr.base.repo.name}#${pr.number}](<${pr.html_url}>) невозможно.\n` +
      'Ошибка:\n```\n' + e.message + '\n```\n' +
      `-# Для повторной попытки копирования PR'а введи команду: \`${bot.prefix}merge ${pr.number}\``
    );
    process.exit(14);
  });
  if (!patch)
    throw new Error("Патч отсутствует");

  console.log(`[PRMERGE] Writing patch for PR #${pr.number}...`);
  await fs.writeFile(patchFileName, patch.data as string, "utf-8");

  try {
    console.log(`[PRMERGE] Applying patch for PR #${pr.number}...`);
    await git.raw("apply", "--3way", "--binary", "--apply", patchFileName, log)
  } catch (e: any) {

    console.log(`[PRMERGE] Counting fails and successes...`);
    const fails = 0
      + (e.message as string).split("error: patch failed").length - 1
      + (e.message as string).split("error: the patch applies to").length - 1;
    const successes = (e.message as string).split("Applied patch to").length - 1;

    let scssc = 0; // additional successes for binaries;
    const test = (e.message as string).matchAll(/warning: Cannot merge binary files: ([^(]+)\(ours vs. theirs\)/g);
    for (const el of test) {
      const path = el[1].trim();
      console.log(`[PRMERGE] Checking out theirs binary ${path}...`);
      await git.checkout(path, ["--theirs"]);
      scssc++;
    }

    if (fails > successes || !successes) {
      await git.reset(ResetMode.HARD, log);
      console.error("Patch couldn't be applied!\n\n", e);
      console.error(`(Fails: ${fails}) > (Successes: ${successes})`);
      return;
    }
  }
  console.log(`[PRMERGE] Deleting patch file...`);
  await fs.unlink(patchFileName);

  console.log(`[PRMERGE] Adding everything to commit...`);
  await git.add(".");
  if (pr.user) {
    console.log(`[PRMERGE] Commiting with author...`);
    const u = pr.user;
    await git.raw("commit", "-m", `[MIRROR] ${pr.title}`, "--author", `${u.name || u.login} <${u.id}+${u.login}@users.noreply.github.com>`, log);
  } else {
    console.log(`[PRMERGE] Commiting without author...`);
    await git.raw("commit", "-m", `[MIRROR] ${pr.title}`, log);
  }
  try {
    console.log(`[PRMERGE] Pushing to origin/${branchName}...`);
    await git.push("origin", branchName, undefined, log);
  } catch (e) {
    console.log(`[PRMERGE] Force pushing to origin/${branchName}...`);
    console.error("CANNOT PUSH, FORCING!!!", e);
    await git.raw(["push", "origin", branchName, "--force"], log);
  }
  let myPr;
  try {
    console.log(`[PRMERGE] Creating pull request...`);
    try {
      myPr = (await octo.pulls.create({
        owner, repo, head: branchName, base: baseBranch,
        title: `[MIRROR] ${pr.title}`,
        body:
          `# Оригинальный PR: ${pr.base.repo.owner.login}/${pr.base.repo.name}#${pr.number}\n` +
          checkForCl(pr.body || '', pr.user?.login)
      })).data;
    } catch (e: any) {
      if (!e.message.includes("A pull request already exists")) {
        const guild = await bot.guilds.fetch(process.env["REPORT_GUILD"] as string);
        const channel: TextChannel = await guild.channels.fetch(process.env["MIRROR_CHANNEL"] as string) as TextChannel;
        if (e.message) {
          if (e.message.includes("No commits between")) {
            await channel.send(
              '## Ошибка создания PR\n' +
              `<@${process.env.HEAD_USER_MENTION}>\n` +
              `Изменения [Pull Request ${pr.base.repo.name}#${pr.number}](<${pr.html_url}>) полностью совпадают с текущей активной веткой.\n` +
              'PR проигнорирован и требует ручной проверки.\n' +
              `Вполне вероятно, что изменения \`${pr.base.repo.owner.login}/${pr.base.repo.name}#${pr.number}\` имеют слишком много конфликтов при слиянии с ${owner}/${repo}-${baseBranch}\n` +
              `-# Для повторной попытки копирования PR'а введи команду: \`${bot.prefix}merge ${pr.number}\``
            );
            return;
          }
          await channel.send(
            '## Ошибка создания PR\n' +
            `<@${process.env.HEAD_USER_MENTION}>\n` +
            `Копирование [Pull Request ${pr.base.repo.name}#${pr.number}](<${pr.html_url}>) невозможно.\n` +
            'Ошибка:\n```\n' + e.message + '\n```\n' +
            `-# Для повторной попытки копирования PR'а введи команду: \`${bot.prefix}merge ${pr.number}\``
          );
        }
        console.error("FATAL FATAL FATAL FATAL FATAL");
        console.error(e);
        if (e.message)
          for (const errMsg of ERROR_SKIPLIST)
            if (e.message.includes(errMsg))
              return;
        process.exit(14);
      } else {
        myPr = (await octo.pulls.list({
          owner, repo, head: branchName, base: baseBranch
        })).data[0];
      }
    }

    /////////////////////////////////
    try {
      await shared.octokit?.issues.addLabels({
        owner, repo, issue_number: myPr.number,
        labels: [githubLabels[GithubLabel.Mirror]]
      });
    } catch (e) { console.error("Epic fail", e); }
    /////////////////////////////////

    return myPr;
    // await sendToMirrorDiscord(myPr);
  } catch (e: any) {
    const re = e as RequestError;
    if (!re.message.includes("pull request already exists"))
      throw e;
  }
}
