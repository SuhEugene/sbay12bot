import { NotBot } from "@discordx/utilities";
import { Discord, Guard, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, SimpleCommandOptionType } from "discordx";
import { shared } from "../shared.js";
import { mergePr } from "../github/repoCheck.js";
import { RestEndpointMethodTypes } from "@octokit/rest";

@Discord()
@Guard(NotBot)
export class MergeCommand {

  @SimpleCommand({ name: "merge" })
  async ping(
    @SimpleCommandOption({ name: "prNumber", type: SimpleCommandOptionType.Number })
    prNumber: number | undefined,
    command: SimpleCommandMessage
  ) {
    if (command.message.author.id !== "200682967775969280")
      return;
    if (!prNumber)
      return;
    if (!process.env["BASE_BRANCH"])
      throw Error("Could not find BASE_BRANCH in your environment")
    if (!process.env["GET_REPO"])
      throw Error("Could not find GET_REPO in your environment")
    if (!process.env["REPORT_REPO"])
      throw Error("Could not find REPORT_REPO in your environment")

    const octo = shared.octokit;
    if (!octo) return;
    
    const [ owner, repo ] = process.env["GET_REPO"].split("/");

    let pr;
    try {
      pr = await octo.pulls.get({ owner, repo, pull_number: prNumber });
    } catch (e) {
      if (e instanceof Error)
        command.message.reply(`Невозможно найти PR:\`\`\`\n${e.message}\n\`\`\``);
    }

    if (!pr) return;

    command.message.react("<a:MYAA:1151536020194594907>");

    const [ realOwner, realRepo ] = process.env["REPORT_REPO"].split("/");

    // "as" because someone coded labels через жопу блять
    try {
      const myPr = await mergePr(octo, realOwner, realRepo, process.env["BASE_BRANCH"], pr.data as RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][0])
      if (!myPr) throw Error("Неизвестная ошибка! PR не существует!");
      command.message.reply(`PR успешно создан: ${Date.now() - command.message.createdTimestamp}ms\n<${myPr.html_url}>`);
    } catch (e) {
      if (e instanceof Error)
        command.message.reply(`Невозможно создать PR:\`\`\`\n${e.message}\n\`\`\``);
      throw e;
    }

  }
}

