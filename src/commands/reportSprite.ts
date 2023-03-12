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
export class ReportSpriteCommand extends CommandWithFields {

  static commandType: ReportType = ReportType.Sprite;
  static fields: { [index: string]: ReportFieldOptions; } = {
    [ReportFieldId.Title]: {
      label: "Объект со старым спрайтом",
      placeholder: "Шкаф с огнетушителем",
      min: 3, max: 100
    },
    [ReportFieldId.Object]: {
      label: "Название объекта в игре",
      placeholder: "extinguisher cabinet",
      min: 3, max: 100
    },
    [ReportFieldId.AdditionalInfo]: {
      label: "Дополнительная информация",
      placeholder: "Здесь можно указать любую информацию, которую считаете полезной в контексте проблемы",
      max: 1500, long: true, optional: true
    }
  }

  @Slash({ name: "спрайт", description: "На Сьерре может этот спрайт выглядел и не так, а здесь он старый, протухший и уже плесенью покрылся" })
  async onCommand(interaction: CommandInteraction) {
    return super.onCommand(interaction);
  }

  @ModalComponent({ id: ModalId.ReportSprite })
  async onModal(interaction: ModalSubmitInteraction) {
    return super.onModal(interaction);
  }
}
