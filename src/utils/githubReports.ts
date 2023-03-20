import { readFileSync, writeFileSync } from "fs";
import path from "path";

export const reportsMap = new Map<number, string>();

export async function readReports() {
  const there = import.meta.url;
  const filePath = path.resolve(path.dirname(there), "..", "data", "reports.json");

  let reportsString = "";
  try {
    reportsString = String(readFileSync(filePath));
  } catch (e) {
    reportsString = "{}";
  }

  const reportsJson = JSON.parse(reportsString);
  for (const reportId in reportsJson)
    reportsMap.set(Number(reportId), reportsJson[reportId]);

  return reportsMap;
}

export async function writeReports() {
  const there = import.meta.url;
  const filePath = path.resolve(path.dirname(there), "..", "data", "reports.json");

  let reportsJson: {[index: string]: string} = {};
  for (const [key, value] of reportsMap)
    reportsJson[String(key)] = value;

  writeFileSync(filePath, JSON.stringify(reportsJson));  
}