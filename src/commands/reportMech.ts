import { NotBot } from "@discordx/utilities";
import { CommandInteraction, ModalSubmitInteraction } from "discord.js";
import { Discord, Guard, ModalComponent, Slash, SlashGroup } from "discordx";
import { CommandWithFields } from "../commandWithFields.js";
import { HasNoSession } from "../sessionGuard.js";
import { ModalId, ReportFieldId, ReportFieldOptions, ReportType } from "../shared.js";

@Discord()
@Guard(
  NotBot,
  HasNoSession
)
@SlashGroup("репорт")
export class ReportMechCommand extends CommandWithFields {

  static commandType: ReportType = ReportType.Mechanics;
  static fields: { [index: string]: ReportFieldOptions; } = {
    [ReportFieldId.Title]: {
      label: "Отсутствующий механ",
      placeholder: "Групповой звонок на голопаде",
      min: 3, max: 100
    },
    [ReportFieldId.Object]: {
      label: "Названия ключевых предметов механики (в игре)",
      placeholder: "holopad",
      min: 3, max: 100
    },
    [ReportFieldId.AdditionalInfo]: {
      label: "Подробнее о механе",
      placeholder: "На Сьерре можно было позвонить в несколько лиц, кликнув по голопаду и выбрав соответствующий пункт",
      max: 1500, long: true, optional: true
    }
  }

  @Slash({ name: "механ", description: "Что-то исчезло из игры, а должно быть" })
  async onCommand(interaction: CommandInteraction) {
    return super.onCommand(interaction);
  }

  @ModalComponent({ id: ModalId.ReportMech })
  async onModal(interaction: ModalSubmitInteraction) {
    return super.onModal(interaction);
  }
}
