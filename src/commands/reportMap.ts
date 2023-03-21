import { NotBot } from "@discordx/utilities";
import { CommandInteraction, ModalSubmitInteraction } from "discord.js";
import { Discord, Guard, ModalComponent, Slash, SlashGroup } from "discordx";
import { CommandWithFields } from "../commandWithFields.js";
import { HasMinionRole } from "../guards/hasMinionRole.js";
import { HasNoSession } from "../guards/sessionGuard.js";
import { ModalId, ReportFieldId, ReportFieldOptions, ReportType } from "../shared.js";

@Discord()
@Guard(
  NotBot,
  HasNoSession,
  HasMinionRole
)
@SlashGroup("репорт")
export class ReportMapCommand extends CommandWithFields {

  static commandType: ReportType = ReportType.Map;
  static fields: { [index: string]: ReportFieldOptions; } = {
    [ReportFieldId.Title]: {
      label: "Проблема вкратце",
      placeholder: "Звук взятия стакана слишком громкий",
      min: 3, max: 100
    },
    [ReportFieldId.Object]: {
      label: "Названия связанных предметов (в игре)",
      placeholder: "half-pint glass",
      min: 3, max: 100
    },
    [ReportFieldId.AdditionalInfo]: {
      label: "Проблема подробно",
      placeholder: "Звук очень громкий и бьёт по ушам. Его громкость нужно вполовину уменьшить.",
      max: 1500, long: true, optional: true
    }
  }

  @Slash({ name: "карта", description: "Проблема, связанная с картой и/или размещением предметов на ней" })
  async onCommand(interaction: CommandInteraction) {
    return super.onCommand(interaction);
  }

  @ModalComponent({ id: ModalId.ReportMap })
  async onModal(interaction: ModalSubmitInteraction) {
    return super.onModal(interaction);
  }
}
