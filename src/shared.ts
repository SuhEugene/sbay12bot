import { Octokit } from "@octokit/rest";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from "discord.js";
import { ArrayIO } from "./utils/arrayIO.js";
import { cwd } from "process";
import path from "path";

export enum ReportType {
  Bug, Mechanics, Object, Sprite, Request, Map, Sound
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
  ReportCancel = "report-cancel",
  MirrorAccept = "mirror-accept",
  MirrorVote = "mirror-vote"
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


const acceptMirrorButton = new ButtonBuilder()
  .setLabel("Принять")
  .setEmoji("<:Chad:988503823733620756>")
  .setStyle(ButtonStyle.Success)
  .setCustomId(ButtonId.MirrorAccept);

  const voteMirrorButton = new ButtonBuilder()
  .setLabel("Голосование")
  .setEmoji("<a:GachiHere:837703420071903243>")
  .setStyle(ButtonStyle.Secondary)
  .setCustomId(ButtonId.MirrorVote);

export const acceptOrVoteMirrorRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
  voteMirrorButton, acceptMirrorButton
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

export const EMBED_COLOR_DEFAULT = 0x305183;

export const EMBED_COLOR_OPEN = 0x305183;
export const EMBED_COLOR_CLOSED = 0x8957e5;
export const EMBED_COLOR_DISMISSED = 0x808080;

export const EMBED_COLOR_SUCCESS = 0x238636;
export const EMBED_COLOR_WARNING = 0xffaa00;
export const EMBED_COLOR_DANGER = 0xda3633;

export enum ModalId {
  ReportObject = "modal-report-object",
  ReportBug = "modal-report-bug",
  ReportMech = "modal-report-mech",
  ReportSprite = "modal-report-sprite",
  ReportRequest = "modal-report-request",
  ReportMap = "modal-report-map",
  ReportSound = "modal-report-sound"
}

export const reportTypeToModalId = {
  [ReportType.Bug]:       ModalId.ReportBug,
  [ReportType.Object]:    ModalId.ReportObject,
  [ReportType.Sprite]:    ModalId.ReportSprite,
  [ReportType.Mechanics]: ModalId.ReportMech,
  [ReportType.Request]:   ModalId.ReportRequest,
  [ReportType.Map]:       ModalId.ReportMap,
  [ReportType.Sound]:     ModalId.ReportSound
}

export const reportTitlePrefixes = {
  [ReportType.Bug]: "Баг",
  [ReportType.Mechanics]: "Механ",
  [ReportType.Object]: "Объект",
  [ReportType.Sprite]: "Старый спрайт",
  [ReportType.Request]: "Запрос",
  [ReportType.Map]: "Карта",
  [ReportType.Sound]: "Звук"
}

export const reportTitleSuffixes = {
  [ReportType.Bug]: "Баг-репорт",
  [ReportType.Mechanics]: "Механ-репорт",
  [ReportType.Object]: "Объект-репорт",
  [ReportType.Sprite]: "Спрайт-репорт",
  [ReportType.Request]: "Запрос",
  [ReportType.Map]: "Карта-репорт",
  [ReportType.Sound]: "Звук-репорт"
}

export const reportLabels = {
  [ReportType.Bug]: ":bug: Баг",
  [ReportType.Mechanics]: ":infinity: Механ",
  [ReportType.Object]: ":detective: Объект",
  [ReportType.Sprite]: ":lady_beetle: Старый спрайт",
  [ReportType.Request]: ":hand: Запрос",
  [ReportType.Map]: ":world_map: Карты",
  [ReportType.Sound]: ":sound: Звуки"
}

export enum GithubLabel {
  Vote, Accepted, Mirror
}

export const githubLabels = {
  [GithubLabel.Vote]: ":hourglass: Ожидание голосования",
  [GithubLabel.Accepted]: ":white_check_mark: Принято",
  [GithubLabel.Mirror]: ":mirror: MIR ЯОЯ"
}

export const SECONDS = 1000;
export const MINUTES = SECONDS*60;
export const HOURS = MINUTES*60;
export const DAYS = HOURS*24;

type PrData = {
  message: string,
  pr_number: number,
  started_at?: number
}

export const mirrorPRs = new ArrayIO<PrData>(path.join(cwd(), "src", "data", "mirrors.json"));