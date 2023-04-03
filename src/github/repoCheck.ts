import { promises as fs } from "fs";
import { shared } from "../shared.js";
import path from "path";
import { cwd } from "process";
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import simpleGit, { ResetMode } from "simple-git";

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
      if (new Date(pr.updated_at) < sinceDate)  { end = true; break; }
      if (!pr.merged_at) continue;
      PRs.push(pr);
    }
    if (end) break;
  }

  return PRs.reverse();
}


export async function checkRepo() {
  const octo = shared.octokit;
  if (!octo) return;

  if (!process.env["GET_REPO"])
      throw Error("Could not find GET_REPO in your environment")
  if (!process.env["REPORT_REPO"])
      throw Error("Could not find REPORT_REPO in your environment")

  const [ getOwner, getRepo ] = process.env["GET_REPO"].split("/");
  const [ owner, repo ] = process.env["REPORT_REPO"].split("/");
  
  const currentTime = new Date();
  const sinceDate = await getSinceDate();
  console.log("Checking repo "+process.env["GET_REPO"]+". Since: ", sinceDate);

  const repoExists = await git.checkIsRepo();
  if (!repoExists) {
    await git.clone(`https://github.com/${owner}/${repo}.git`, repoPath);
  }

  const prs = await getPRsToMerge(octo, getOwner, getRepo, sinceDate);

  for (const pr of prs) {
    const branchName = `bay12-pr-${pr.number}`;
    const patchFileName = path.join(repoPath, branchName+".patch");
    await git.fetch("origin");
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
      await git.applyPatch(patchFileName, ["--3way"]);
      await fs.unlink(patchFileName);
  } catch (e: any) {
      await git.reset(ResetMode.HARD);
      const fails = (e as string).split("error: patch failed").length-1;
      const successes = (e as string).split("Applied patch to").length-1;
      if (fails !== successes || !fails || !successes) {
        console.error("Patch couldn't be applied!\n\n", e);
        console.error(`(Fails: ${fails}) != (Successes: ${successes})`)
        return;
      }
    }

    await git.add(".");
    await git.raw("commit", "-m", `Apply patch for PR #${pr.number}`);
    await git.push("origin", branchName);

    await octo.pulls.create({
      owner, repo,
      head: branchName,
      base: "dev220",
      title: `[MIRROR] ${pr.title}`,
      body:
        `# Оригинальный PR: ${pr.base.repo.owner.login}/${pr.base.repo.name}#${pr.number}\n`+
        pr.body
    });
  }

  await writeSinceDate(currentTime);
  
}
