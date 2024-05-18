import { Octokit } from "@octokit/rest";
import { ArrayIO } from "./utils/arrayIO.js";
import { cwd } from "process";
import path from "path";

type sharedType = { octokit: Octokit | null }
export const shared: sharedType = { octokit: null }

export const githubBodyFooter = "\n<hr>\n\n*Репорт сгенерирован автоматически*\n*Автор: `${user}` / `${id}`*";

export enum GithubLabel { Mirror }

export const githubLabels = { [GithubLabel.Mirror]: ":mirror: MIR ЯОЯ" }

export const SECONDS = 1000;
export const MINUTES = SECONDS*60;
export const HOURS = MINUTES*60;
export const DAYS = HOURS*24;

type MirrorPrData = {
  message: string,
  pr_number: number,
  started_at?: number
}

type UnmergedPrData = {
  message: string,
  pr_number: number
}

export const mirrorPRs = new ArrayIO<MirrorPrData>(path.join(cwd(), "src", "data", "mirrors.json"));
export const unmergedPRs = new ArrayIO<UnmergedPrData>(path.join(cwd(), "src", "data", "everything_unmerged.json"));