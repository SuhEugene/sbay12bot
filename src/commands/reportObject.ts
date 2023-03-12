import { NotBot } from "@discordx/utilities";
import { CommandInteraction, ModalSubmitInteraction } from "discord.js";
import { Discord, Guard, ModalComponent, Slash, SlashGroup } from "discordx";
import { CommandWithFields } from "../commandWithFields.js";
import { HasNoSession } from "../sessionGuard.js";
import { ModalId, ReportFieldId, ReportFieldOptions, ReportType } from "../shared.js";

@Discord()
@SlashGroup({ description: "Различного рода репорты по SierraBay12", name: "репорт" })
@SlashGroup("репорт")
@Guard(
  NotBot,
  HasNoSession
)
export class ReportObjectCommand extends CommandWithFields {

  static commandType: ReportType = ReportType.Object;
  static fields: { [index: string]: ReportFieldOptions; } = {
    [ReportFieldId.Title]: {
      label: "Отсутствующий объект",
      placeholder: "Жёлтый кислородный баллон",
      min: 3, max: 100
    },
    [ReportFieldId.Object]: {
      label: "Название объекта в игре",
      placeholder: "yellow oxygen tank",
      min: 3, max: 100
    },
    [ReportFieldId.AdditionalInfo]: {
      label: "Дополнительная информация",
      placeholder: "Здесь можно указать любую информацию, которую считаете полезной в контексте проблемы",
      max: 1500,
      optional: true,
      long: true
    }
  }

  @Slash({ name: "объект", description: "Что-то исчезло из игры, а должно быть" })
  async onCommand(interaction: CommandInteraction) {
    return super.onCommand(interaction);
  }

  @ModalComponent({ id: ModalId.ReportObject })
  async onModal(interaction: ModalSubmitInteraction) {
    return super.onModal(interaction);
  }
}
