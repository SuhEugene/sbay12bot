import { ButtonInteraction, CommandInteraction } from "discord.js";
import { replyToInteraction } from "./reply.js";

export async function sendError(interaction: CommandInteraction | ButtonInteraction, e: any) {
  const r = Math.floor(Math.random()*1000000);
  console.error(new Date(), `#${r}`, "ERROR CATCHED!\n", e);
  
  return await replyToInteraction(interaction, {
    content: `Произошла ошибка!\nНомер ошибки:\`#${r}\`\n<@!706124306660458507>`
  })
}