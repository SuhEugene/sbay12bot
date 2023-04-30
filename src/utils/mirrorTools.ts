import { APIEmbed, EmbedBuilder, Message, User } from "discord.js";
import { EMBED_COLOR_SUCCESS, GithubLabel, githubLabels, mirrorPRs, shared } from "../shared.js";

export async function mirrorAccept(message: Message, user: User): Promise<string | undefined> {
  const mirrors = await mirrorPRs.read();
  const mirror = mirrors.find(e => e.message == message.id);

  if (!mirror) return "PR не найден!";

  const [ owner, repo ] = (process.env["REPORT_REPO"] as string).split("/");

  try {
    await shared.octokit?.issues.removeLabel({
      owner, repo,
      issue_number: mirror.pr_number,
      name: githubLabels[GithubLabel.Vote]
    });
  } catch (e) { console.warn(e); }

  await shared.octokit?.issues.addLabels({
    owner, repo,
    issue_number: mirror.pr_number,
    labels: [ githubLabels[GithubLabel.Accepted] ]
  });

  const embed = new EmbedBuilder(message.embeds[0] as APIEmbed)
    .setColor(EMBED_COLOR_SUCCESS)
    .setFooter({
      text: user.tag,
      iconURL: user.avatarURL() || undefined
    })
    .setAuthor({ name: "Принято" })
    .setTimestamp();
  
  await message.edit({
    embeds: [ embed ],
    components: []
  });

  mirrorPRs.data = (await mirrorPRs.read()).filter(el => el.message != message.id);
  await mirrorPRs.write();
}