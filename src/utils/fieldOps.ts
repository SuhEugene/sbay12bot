import { ActionRowBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export const fieldsToRows = (fields: TextInputBuilder[]) =>
  fields.map(f => new ActionRowBuilder<TextInputBuilder>().addComponents(f));