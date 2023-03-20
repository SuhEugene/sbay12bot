import { readFileSync, writeFileSync } from "fs";

export const reportsMap = new Map<number, string>();

export async function readReports() {
  let reportsString = "";
  try {
    reportsString = String(readFileSync("../data/reports.json"));
  } catch (e) {
    reportsString = "{}";
  }

  const reportsJson = JSON.parse(reportsString);
  for (const reportId in reportsJson)
    reportsMap.set(Number(reportId), reportsJson[reportId]);

  return reportsMap;
}

export async function writeReports() {
  let reportsJson: {[index: string]: string} = {};
  for (const [key, value] of reportsMap)
    reportsJson[String(key)] = value;

  writeFileSync("../data/reports.json", JSON.stringify(reportsJson));  
}