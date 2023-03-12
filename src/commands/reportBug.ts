import { NotBot } from '@discordx/utilities'
import { CommandInteraction, ModalSubmitInteraction } from "discord.js";
import { Discord, Guard, ModalComponent, Slash, SlashGroup } from "discordx";
import { CommandWithFields } from "../commandWithFields.js";
import { HasMinionRole } from '../guards/hasMinionRole.js';
import { HasNoSession } from "../guards/sessionGuard.js";
import { ModalId, ReportFieldId, ReportFieldOptions, ReportType } from "../shared.js";

@Discord()
@Guard(
  NotBot,
  HasNoSession,
  HasMinionRole
)
@SlashGroup("репорт")
export class ReportBugCommand extends CommandWithFields {

  static commandType: ReportType = ReportType.Bug;
  static fields: { [index: string]: ReportFieldOptions; } = {
    [ReportFieldId.Ckey]: {
      label: "Ваш ckey",
      placeholder: "SuhEugene",
      min: 3, max: 50
    },
    [ReportFieldId.Title]: {
      label: "Описание бага вкратце",
      placeholder: "Не работает кнопка в РнД",
      min: 10, max: 80
    },
    [ReportFieldId.Steps]: {
      label: "Шаги",
      placeholder: "1. Прийти в ксенобиологию на второй палубе\n2. Нажать кнопку у самой правой клетки",
      min: 40, max: 1200,
      long: true
    },
    [ReportFieldId.Reality]: {
      label: "Что происходит?",
      placeholder: "Кнопка не нажимается",
      min: 10, max: 200
    },
    [ReportFieldId.Expectations]: {
      label: "Что должно было произойти?",
      placeholder: "Кнопка мигает и происходит действие",
      min: 10, max: 200
    }
  }

  @Slash({ name: "баг", description: "Баг-репорт по SierraBay12" })
  async onCommand(interaction: CommandInteraction) {
    return super.onCommand(interaction);
  }

  @ModalComponent({ id: ModalId.ReportBug })
  async onModal(interaction: ModalSubmitInteraction) {
    return super.onModal(interaction);
  }
}
