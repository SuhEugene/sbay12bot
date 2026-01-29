export function sanitOut(outString: string) {
  return outString
    .replaceAll(process.env["GITHUB_SECRET"]!, "[REDACTED GITHUB SECRET]")
    .replaceAll(process.env["BOT_TOKEN"]!, "[REDACTED BOT TOKEN]")
    .replaceAll(process.env["GITHUB_TOKEN"]!, "[REDACTED GITHUB TOKEN]")
    .replaceAll("/ghp_[a-zA-Z0-9]+", "[REDACTED GITHUB PAT]")
}
