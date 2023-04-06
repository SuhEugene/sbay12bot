import { promises as fs } from "fs";
import { shared } from "../shared.js";
import path from "path";
import { cwd } from "process";
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import simpleGit, { ResetMode } from "simple-git";
import { RequestError } from "@octokit/request-error";

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

      if (!pr.merged_at)
        continue;
      if (new Date(pr.merged_at) <= sinceDate)
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

  const prs = await getPRsToMerge(octo, getOwner, getRepo, sinceDate);

  for (const pr of prs) {
    console.log("\n\n>>> PR NUMBER "+ pr.number)
    const branchName = `upstream-pr-${pr.number}`;
    const patchFileName = path.join(repoPath, branchName+".patch");
    await git.fetch("origin");
    await git.fetch("upstream");
    await git.checkout("dev220");
    await git.pull("origin", "dev220");
    try {
      await git.checkoutBranch(branchName, "dev220");
    } catch (e) {
      await git.deleteLocalBranch(branchName, true);
      await git.checkoutBranch(branchName, "dev220");
    }

    const patch = await octo.request(pr.patch_url);
    await fs.writeFile(patchFileName, patch.data as string, "utf-8");

    try {
      await git.applyPatch(patchFileName, ["--3way"], log);
  } catch (e: any) {

      const fails = (e.message as string).split("error: patch failed").length-1;
      const successes = (e.message as string).split("Applied patch to").length-1;
      if (fails !== successes || !fails || !successes) {
        await git.reset(ResetMode.HARD, log);
        console.error("Patch couldn't be applied!\n\n", e);
        console.error(`(Fails: ${fails}) != (Successes: ${successes})`);
        return;
      }
    }
    await fs.unlink(patchFileName);

    await git.add(".");
    await git.raw("commit", "-m", `[MIRROR] ${pr.title}`, /*"--author", `${pr.user}`,*/ log);
    try {
      await git.push("origin", branchName, undefined, log);
    } catch (e) {
      console.error("CANNOT PUSH, FORCING!!!", e);
      await git.push("origin", branchName, ["-f"], log);
    }
    try {
      await octo.pulls.create({
        owner, repo,
        head: branchName,
        base: "dev220",
        title: `[MIRROR] ${pr.title}`,
        body:
          `# Оригинальный PR: ${pr.base.repo.owner.login}/${pr.base.repo.name}#${pr.number}\n`+
          pr.body
      });
    } catch (e: any) {
      const re = e as RequestError;
      if (!re.message.includes("pull request already exists"))
        throw e;
    }
    await writeSinceDate(new Date(pr.updated_at));
  }
  console.log("Check successful!")
}
