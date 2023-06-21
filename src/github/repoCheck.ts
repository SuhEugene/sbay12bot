import { promises as fs } from "fs";
import { EMBED_COLOR_WARNING, GithubLabel, acceptOrVoteMirrorRow, getAcceptOrVoteMirrorRow, githubLabels, mirrorPRs, shared } from "../shared.js";
import path from "path";
import { cwd } from "process";
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import simpleGit, { ResetMode } from "simple-git";
import { RequestError } from "@octokit/request-error";
import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageActionRowComponentBuilder, TextChannel } from "discord.js";
import { bot } from "../main.js";

const filePath = path.join(cwd(), "src", "data", "lastFetch.txt");
const repoPath = path.join(cwd(), "repo");
const git = simpleGit(repoPath);


async function getSinceDate() {
  let sinceDate = new Date(1680383635141);
  try {
    const got = await fs.readFile(filePath, "utf-8");
    if (got) sinceDate = new Date(got);
  } catch (e) {}

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
      if (new Date(pr.updated_at) <= sinceDate)  { end = true; break; }
      if (pr.number == 33625) continue;

      if (!pr.merged_at)
        continue;
      if (new Date(pr.merged_at) <= sinceDate)
        continue;
      if(pr.title.startsWith("Bump actions/"))
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


async function sendToMirrorDiscord(prResponse: RestEndpointMethodTypes["pulls"]["create"]["response"]) {
  const pr = prResponse.data;
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
    embeds: [ embed ],
    components: [ row ]
  });

  await mirrorPRs.push({ pr_number: pr.number, message: msg.id });
}


export async function checkRepo() {
  const octo = shared.octokit;
  if (!octo) return;

  if (!process.env["GET_REPO"])
    throw Error("Could not find GET_REPO in your environment")
  if (!process.env["REPORT_REPO"])
    throw Error("Could not find REPORT_REPO in your environment")
  if (!process.env["GIT_EMAIL"])
    throw Error("Could not find GIT_EMAIL in your environment")
  if (!process.env["GIT_NAME"])
    throw Error("Could not find GIT_NAME in your environment")

  const [ getOwner, getRepo ] = process.env["GET_REPO"].split("/");
  const [ owner, repo ] = process.env["REPORT_REPO"].split("/");
  
  const sinceDate = await getSinceDate();
  console.log("Checking repo "+process.env["GET_REPO"]);
  console.log("Since:", sinceDate);
  console.log("At:", new Date());

  const repoExists = await git.checkIsRepo();
  if (!repoExists) {
    await git.clone(`https://github.com/${owner}/${repo}.git`, repoPath);
    await git.addRemote("upstream", `https://github.com/${getOwner}/${getRepo}.git`);
  }
  await git.addConfig("user.email", process.env["GIT_EMAIL"]);
  await git.addConfig("user.name",  process.env["GIT_NAME"]);

  console.log(`[PRMERGE] Getting PRs to merge...`);
  const prs = await getPRsToMerge(octo, getOwner, getRepo, sinceDate);

  for (const pr of prs) {
    console.log("\n\n>>> PR NUMBER "+ pr.number)
    const branchName = `upstream-pr-${pr.number}`;
    const patchFileName = path.join(repoPath, branchName+".patch");
    console.log("[PRMERGE] Fetching everything...");
    await git.fetch("", ["--all"], log);

    console.log(`[PRMERGE] Resetting everythong...`);
    await git.reset(["HEAD", "--hard"], log);

    console.log("[PRMERGE] Checking out dev220...")
    await git.checkout("dev220");
    
    console.log("[PRMERGE] Pulling origin dev220...")
    await git.pull("origin", "dev220");
    try {
      console.log(`[PRMERGE] Checking out ${branchName} from dev220...`);
      await git.checkoutBranch(branchName, "dev220");
    } catch (e) {
      console.log(`[PRMERGE] Deleting branch ${branchName}...`);
      await git.deleteLocalBranch(branchName, true);

      console.log(`[PRMERGE] Checking out ${branchName} from dev220 again...`);
      await git.checkoutBranch(branchName, "dev220");
    }

    console.log(`[PRMERGE] Requesting patch for PR #${pr.number}...`);
    const patch = await octo.request(pr.patch_url);

    console.log(`[PRMERGE] Writing patch for PR #${pr.number}...`);
    await fs.writeFile(patchFileName, patch.data as string, "utf-8");

    try {
      console.log(`[PRMERGE] Applying patch for PR #${pr.number}...`);
      await git.applyPatch(patchFileName, ["--3way"], log);
  } catch (e: any) {

      console.log(`[PRMERGE] Counting fails and successes...`);
      const fails = 0
        + (e.message as string).split("error: patch failed").length-1
        + (e.message as string).split("error: the patch applies to").length-1;
      const successes = (e.message as string).split("Applied patch to").length-1;

      let scssc = 0; // additional successes for binaries;
      const test = (e.message as string).matchAll(/warning: Cannot merge binary files: ([^(]+)\(ours vs. theirs\)/g);
      for (const el of test) {
        const path = el[1].trim();
        console.log(`[PRMERGE] Checking out theirs binary ${path}...`);
        await git.checkout(path, ["--theirs"]);
        scssc++;
      }

      if (fails > successes || !fails || !successes) {
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
      await git.raw("commit", "-m", `[MIRROR] ${pr.title}`, "--author", `${u.name||u.login} <${u.id}+${u.login}@users.noreply.github.com>`, log);
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
      await git.push("origin", branchName, ["-f"], log);
    }
    try {
      console.log(`[PRMERGE] Creating pull request...`);
      let myPr;
      try {
        myPr = await octo.pulls.create({
          owner, repo, head: branchName, base: "dev220",
          title: `[MIRROR] ${pr.title}`,
          body:
            `# Оригинальный PR: ${pr.base.repo.owner.login}/${pr.base.repo.name}#${pr.number}\n`+
            pr.body
        });
      } catch (e) {
        try {
          console.log(`[PRMERGE] Failed to create PR! Creating failed PR...`);
          console.log(`[PRMERGE][FAIL] Resetting to dev220...`);
          await git.reset(["dev220", "--hard"], log);
          console.log(`[PRMERGE][FAIL] Requesting patch for PR #${pr.number}...`);
          const patch = await octo.request(pr.patch_url);
          console.log(`[PRMERGE][FAIL] Writing patch for PR #${pr.number}...`);
          await fs.writeFile(patchFileName, patch.data as string, "utf-8");
          console.log(`[PRMERGE][FAIL] Applying REJ patch for PR #${pr.number}...`);
          await git.applyPatch(patchFileName, ["--reject",  "--whitespace=fix"], log);
          console.log(`[PRMERGE][FAIL] Deleting patch file...`);
          await fs.unlink(patchFileName);
          console.log(`[PRMERGE][FAIL] Adding everything to commit...`);
          await git.add(".", log);
          console.log(`[PRMERGE][FAIL] Commiting without author...`);
          await git.raw("commit", "-m", `[MIRROR][FAILED] ${pr.title}`, log);
          console.log(`[PRMERGE][FAIL] Pushing to origin/${branchName}...`);
          await git.push("origin", branchName, undefined, log);
          myPr = await octo.pulls.create({
            owner, repo, head: branchName, base: "dev220",
            title: `[MIRROR] ${pr.title}`,
            body:
              `# Оригинальный PR: ${pr.base.repo.owner.login}/${pr.base.repo.name}#${pr.number}\n`+
              pr.body
          });
          try {
            await shared.octokit?.issues.addLabels({
              owner, repo, issue_number: myPr.data.number,
              labels: [ githubLabels[GithubLabel.Mirror] ]
            });
          } catch {}
        } catch (e) {
          console.error("FATAL FATAL FATAL FATAL FATAL");
          console.error(e);
          process.exit(0);  
        }
      }

      /////////////////////////////////
      try {
        await shared.octokit?.issues.addLabels({
          owner, repo, issue_number: myPr.data.number,
          labels: [ githubLabels[GithubLabel.Mirror] ]
        });
      } catch (e) {console.error("Epic fail", e);}
      /////////////////////////////////
      
      await sendToMirrorDiscord(myPr);
    } catch (e: any) {
      const re = e as RequestError;
      if (!re.message.includes("pull request already exists"))
        throw e;
    }
    console.log(`[PRMERGE] Writing since date...`);
    await writeSinceDate(new Date(pr.updated_at));
  }
  console.log("Check successful!")
}
