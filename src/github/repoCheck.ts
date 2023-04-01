import { promises as fs } from "fs";
import { shared } from "../shared.js";
import path from "path";
import { cwd } from "process";

const filePath = path.join(cwd(), "src", "data", "lastFetch.txt");

export async function checkRepo() {
  const octo = shared.octokit;
  if (!octo) return;

  if (!process.env["GET_REPO"])
      throw Error("Could not find GET_REPO in your environment")
  if (!process.env["REPORT_REPO"])
      throw Error("Could not find REPORT_REPO in your environment")

  const [ getOwner, getRepo ] = process.env["GET_REPO"].split("/");
  const [ owner, repo ] = process.env["REPORT_REPO"].split("/");

  
  let sinceDate = new Date(1680383635141);
  try {
    const got = await fs.readFile(filePath, "utf-8");
    if (got) sinceDate = new Date(got);
  } catch (e) {}

  const { data: mergedPullRequests } = await octo.rest.pulls.list({
    owner, repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
    since: sinceDate.toISOString()
  });
  

  for (const pullRequest of mergedPullRequests) {
    if (pullRequest.merged_at) {
      try {
        await octo.rest.pulls.create({
          owner, repo,
          title: "[MIRROR] "+pullRequest.title,
          head: pullRequest.head.ref,
          base: "dev220",
          body:
            (pullRequest.body || "Описание отсутствует") +
            "\n<hr />\n\n*PR сгенерирован автоматически*"
        });
      } catch (error) {
        console.error('Error creating pull request:', error);
      }
    }
  }

  const currentTime = new Date();
  await fs.writeFile(filePath, currentTime.toISOString(), "utf-8");
  
}
