import { Octokit } from "@octokit/rest";

type sharedType = { octokit: Octokit | null }
export const shared: sharedType = { octokit: null }

export enum GithubLabel { Mirror }
export const githubLabels = { [GithubLabel.Mirror]: "☠️Слияние с ОФАМИ☠️" }

export const SECONDS = 1000;
export const MINUTES = SECONDS*60;
export const HOURS = MINUTES*60;
export const DAYS = HOURS*24;
