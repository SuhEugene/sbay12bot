import { EMBED_COLOR_CLOSED, EMBED_COLOR_DANGER, EMBED_COLOR_DISMISSED, EMBED_COLOR_OPEN } from "../shared";
import type { User } from "@octokit/webhooks-types";
import { EmbedBuilder } from "discord.js";

const commentRegexp = /<!--.*?-->/g;
const checkRegexp = /(^|\n)(?<everything>(?<prefix>-\s)(?<box>\[(x|\s)\])(?<suffix>\s[^\[\(\)\]]))/g;

const colorsByStatus = {
  "open": EMBED_COLOR_OPEN,
  "closed": EMBED_COLOR_DANGER,
  "merged": EMBED_COLOR_CLOSED,
  "draft": EMBED_COLOR_DISMISSED
}

export default function generatePrEmbed(title: string, description: string, status: keyof typeof colorsByStatus, author: User) {
  
  description = description.replaceAll(commentRegexp, "");

  const checkMatches = description.matchAll(checkRegexp);
  for (const match of checkMatches) {
    if (!match.groups) continue;
    const { everything, prefix, box, suffix } = match.groups;
    description = description.replace(everything, `${prefix}\`${box}\`${suffix}`);
  }

  return new EmbedBuilder()
    .setTitle(title.length > 100 ? title.slice(0, 97) + "..." : title)
    .setDescription(description.length > 1000 ? description.substring(0, 997) + "..." : description)
    .setColor(colorsByStatus[status])
    .setAuthor({
      iconURL: author.avatar_url,
      name: author.name || author.login
    });
}