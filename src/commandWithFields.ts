import { CommandInteraction, InteractionResponse, Message, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import { onReportModal } from "./events/onReportModal.js";
import { ReportFieldOptions, reportTitleSuffixes, ReportType, reportTypeToModalId } from "./shared.js";
import { fieldsToRows } from "./utils/fieldOps.js";

export class CommandWithFields {

  static fields: { [index: string]: ReportFieldOptions; } = {};
  static commandType: ReportType | null = null;
  
  static createFields(fieldsValues?: { [index: string]: string }) {
    const arr = [];
    for (let id in this.fields) {
      const field = this.fields[id];
      const tb = new TextInputBuilder()
        .setCustomId(id)
        .setLabel(field.label)
        .setPlaceholder(field.placeholder)
        .setMaxLength(field.max)
        .setRequired(!field.optional)
        .setStyle(field.long ? TextInputStyle.Paragraph : TextInputStyle.Short)
      
      field.min && tb.setMinLength(field.min);

      if (fieldsValues && fieldsValues[id])
        tb.setValue(fieldsValues[id]);

      arr.push(tb);
    }
    return arr;
  }

  async onCommand(interaction: CommandInteraction) {
    const self = (this.constructor as unknown) as typeof CommandWithFields;

    if (self.commandType === null)
      throw Error("Command type not specified");

    const modalId = reportTypeToModalId[self.commandType];

    const modal = new ModalBuilder()
      .setTitle("SBay12 - "+reportTitleSuffixes[self.commandType])
      .setCustomId(modalId);
    
    modal.addComponents(...fieldsToRows(self.createFields()));

    return await interaction.showModal(modal);
  }

  async onModal(interaction: ModalSubmitInteraction) {
    const self = (this.constructor as unknown) as typeof CommandWithFields;

    if (self.commandType === null)
      throw Error("Command type not specified");
      
    return onReportModal(interaction, self.commandType);
  }
}