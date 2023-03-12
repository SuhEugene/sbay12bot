import { Octokit } from "@octokit/rest";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from "discord.js";

export enum ReportType {
  Bug, Mechanics, Object, Sprite
}
export enum ReportFieldId {
  Ckey = "r-ckey",
  Title = "r-title",
  Steps = "r-steps",
  Reality = "r-reality",
  Expectations = "r-expect",
  Object = "r-object",
  AdditionalInfo = "r-more"
}

interface ReportDataBase {
  [ReportFieldId.Ckey]?: string,
  [ReportFieldId.Steps]?: string,
  [ReportFieldId.Reality]?: string,
  [ReportFieldId.Expectations]?: string,
  [ReportFieldId.Object]?: string,
}

export interface ReportData extends ReportDataBase {
  readonly [index: string]: string | undefined,
}

export interface ReportTypedData extends ReportDataBase {
  readonly [index: string]: ReportType | string | undefined,
  type: ReportType,
  [ReportFieldId.Title]: string
  [ReportFieldId.AdditionalInfo]?: string
}

export type ReportFieldOptions = {
  label: string,
  placeholder: string,
  min?: number,
  max: number,
  long?: boolean,
  optional?: boolean
}

export enum ButtonId {
  ReportSend = "report-send",
  ReportCancel = "report-cancel"
}

const sendReportButton = new ButtonBuilder()
  .setLabel("Отправить")
  .setEmoji("<:paperplane:1084269772172181545>")
  .setStyle(ButtonStyle.Primary)
  .setCustomId(ButtonId.ReportSend);

  const addAdditionalInfo = new ButtonBuilder()
  .setLabel("Отмена")
  .setEmoji("❌")
  .setStyle(ButtonStyle.Secondary)
  .setCustomId(ButtonId.ReportCancel);

export const sendOrAddInfoReportRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
  addAdditionalInfo, sendReportButton
);

type sharedType = {
  reportSessions: {[index: string]: ReportTypedData};
  octokit: Octokit | null;
}

export const shared: sharedType = {
  reportSessions: {},
  octokit: null
}

export const githubBodyFooter = "\n<hr>\n\n*Репорт сгенерирован автоматически*\n*Автор: `${user}` / `${id}`*";
export const reportAddInfoPresentTypes = [ ReportType.Mechanics, ReportType.Object, ReportType.Sprite ];
export const EMBED_COLOR = "#305183";

export enum ModalId {
  ReportObject = "modal-report-object",
  ReportBug = "modal-report-bug",
  ReportMech = "modal-report-mech",
  ReportSprite = "modal-report-sprite"
}

export const reportTypeToModalId = {
  [ReportType.Bug]:       ModalId.ReportBug,
  [ReportType.Object]:    ModalId.ReportObject,
  [ReportType.Sprite]:    ModalId.ReportSprite,
  [ReportType.Mechanics]: ModalId.ReportMech
}

export const reportTitlePrefixes = {
  [ReportType.Bug]: "Баг",
  [ReportType.Mechanics]: "Механ",
  [ReportType.Object]: "Объект",
  [ReportType.Sprite]: "Старый спрайт"
}

export const reportTitleSuffixes = {
  [ReportType.Bug]: "Баг-репорт",
  [ReportType.Mechanics]: "Механ-репорт",
  [ReportType.Object]: "Объект-репорт",
  [ReportType.Sprite]: "Спрайт-репорт"
}