import { ReportTypedData, ReportType, ReportData, ReportFieldId } from "../shared.js";

const fieldPrefixes: Required<ReportData> = {
  [ReportFieldId.Ckey]: "**Ckey**:\n`${}`",
  [ReportFieldId.Object]: "**Название:**\n`${}`",
  [ReportFieldId.Steps]: "**Шаги:**\n${}",
  [ReportFieldId.Reality]: "**Реальное поведение:**\n${}",
  [ReportFieldId.Expectations]: "**Ожидаемое поведение:**\n${}"
}

const uniquePrefixes: Partial<ReportTypedData> = {
  [ReportFieldId.AdditionalInfo]: "**Дополнительная информация:**\n${}",
  [ReportFieldId.Title]: "**Объект:**\n${}"
}

const getReplaced = (session: ReportTypedData, field: ReportFieldId, unique: boolean = false) =>
  unique
  ? uniquePrefixes[field]?.replace("${}", session[field] as string)
  : fieldPrefixes[field]?.replace("${}", session[field] as string);

export function sessionToText(session: ReportTypedData): string {
  const textArr = [];

  if ([ReportType.Object, ReportType.Sprite].includes(session.type))
    textArr.push(getReplaced(session, ReportFieldId.Title, true));

  for (const arg in fieldPrefixes) {
    if (!session[arg]) continue;
    textArr.push(getReplaced(session, arg as ReportFieldId))
  }

  if (session.type != ReportType.Bug) {
    const r = getReplaced(session, ReportFieldId.AdditionalInfo, true);
    r && textArr.push(r);
  }

  return textArr.join("\n\n");
}