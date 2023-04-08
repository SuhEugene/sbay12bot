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
export class ReportSoundCommand extends CommandWithFields {

  static commandType: ReportType = ReportType.Sound;
  static fields: { [index: string]: ReportFieldOptions; } = {
    [ReportFieldId.Title]: {
      label: "Какой звук и для какого предмета - вкратце",
      placeholder: "Звук взятия стакана",
      min: 3, max: 100
    },
    [ReportFieldId.Object]: {
      label: "Названия связанных предметов (в игре)",
      placeholder: "half-pint glass",
      min: 3, max: 100
    },
    [ReportFieldId.AdditionalInfo]: {
      label: "Проблема подробно",
      placeholder: "Звук очень громкий и бьёт по ушам. Его громкость нужно вполовину уменьшить или заменить на какой-то другой.",
      max: 1500, long: true, optional: true
    }
  }

  @Slash({ name: "звук", description: "Звука нет или звук не подходит, звучит плохо." })
  async onCommand(interaction: CommandInteraction) {
    return super.onCommand(interaction);
  }

  @ModalComponent({ id: ModalId.ReportSound })
  async onModal(interaction: ModalSubmitInteraction) {
    return super.onModal(interaction);
  }
}
