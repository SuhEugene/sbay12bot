import { config } from "dotenv";
import { Octokit } from "@octokit/rest";
import { MINUTES, shared } from "./shared.js";
import { checkRepo } from "./github/repoCheck.js";

config();

async function run() {

  const envsToCheck = [
    "BOT_TOKEN", "GIT_TOKEN", "REPORT_GUILD", "REPORT_CHANNEL",
    "MIRROR_CHANNEL", "REPORT_REPO", "GET_REPO", "ALLOWED_ROLES",
    "BASE_BRANCH", "GIT_EMAIL", "GIT_NAME"] as const;
  for (const env of envsToCheck)
    if (!process.env[env])
      throw Error(`Could not find ${env} in your environment`);

  shared.octokit = new Octokit({
    auth: process.env["GIT_TOKEN"]
  });

  const mstone = process.env["REPORT_MILESTONE"];

  console.log(
    "=============\n"+
    " Bot started\n"+
    "============="
  );
  console.log(` Report GitHub:  ${process.env["REPORT_REPO"]}:${process.env["BASE_BRANCH"]}${mstone && (', Milestone: '+ mstone)}`);
  console.log(` Fetch GitHub:   ${process.env["GET_REPO"]}`);

  console.log("=============");

  setInterval(checkRepo, 5*MINUTES);
  checkRepo();
}

run();
