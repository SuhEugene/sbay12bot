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
export class ReportRequestCommand extends CommandWithFields {

  static commandType: ReportType = ReportType.Request;
  static fields: { [index: string]: ReportFieldOptions; } = {
    [ReportFieldId.Title]: {
      label: "Проблема вкратце",
      placeholder: "Тусклые лампочки",
      min: 3, max: 100
    },
    [ReportFieldId.Object]: {
      label: "Названия связанных предметов (в игре)",
      placeholder: "light fixture",
      min: 3, max: 100
    },
    [ReportFieldId.AdditionalInfo]: {
      label: "Проблема подробно",
      placeholder: "В кабинках дормиториев не видно совершенно ничего. На инфинити лампочки были ярче.",
      max: 1500, long: true, optional: true
    }
  }

  @Slash({ name: "запрос", description: "В игре что-то ощущается совсем не так, шероховато. Запрос модификации." })
  async onCommand(interaction: CommandInteraction) {
    return super.onCommand(interaction);
  }

  @ModalComponent({ id: ModalId.ReportRequest })
  async onModal(interaction: ModalSubmitInteraction) {
    return super.onModal(interaction);
  }
}
