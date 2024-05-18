import { config } from "dotenv";
import { Octokit } from "@octokit/rest";
import { MINUTES, shared } from "./shared.js";
import { checkRepo } from "./github/repoCheck.js";

config();

async function run() {

  const envsToCheck = [
    "GITHUB_TOKEN", "BASE_REPO", "GET_REPO",
    "BASE_BRANCH", "GIT_EMAIL", "GIT_NAME"] as const;
  for (const env of envsToCheck)
    if (!process.env[env])
      throw Error(`Could not find ${env} in your environment`);

  shared.octokit = new Octokit({
    auth: process.env["GITHUB_TOKEN"]
  });

  console.log(
    "=============\n"+
    " Bot started\n"+
    "============="
  );
  console.log(` Report GitHub:  ${process.env["BASE_REPO"]}:${process.env["BASE_BRANCH"]}`);
  console.log(` Fetch GitHub:   ${process.env["GET_REPO"]}`);

  console.log("=============");

  setInterval(checkRepo, 5*MINUTES);
  checkRepo();
}

run();
