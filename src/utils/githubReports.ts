import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { cwd } from "process";


const filePath = path.join(cwd(), "src", "data", "reports.json");

export const reportsMap = new Map<number, string>();

export async function readReports() {
  let reportsString = "";
  try {
    reportsString = String(readFileSync(filePath));
  } catch (e) {
    reportsString = "{}";
  }

  let reportsJson: {[index: string]: string} = {};
  try { reportsJson = JSON.parse(reportsString); }
  catch (e) { console.error("CANNOT PARSE", e); }
  for (const reportId in reportsJson)
    reportsMap.set(Number(reportId), reportsJson[reportId]);

  return reportsMap;
}

export async function writeReports() {
  let reportsJson: {[index: string]: string} = {};
  for (const [key, value] of reportsMap)
    reportsJson[String(key)] = value;

  writeFileSync(filePath, JSON.stringify(reportsJson));  
}