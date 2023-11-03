import { dirname, importx } from "@discordx/importer";
import type { Interaction, Message } from "discord.js";
import { IntentsBitField } from "discord.js";
import { Client } from "discordx";
import { config } from "dotenv";
import { Octokit } from "@octokit/rest";
import { MINUTES, shared } from "./shared.js";
import { readReports } from "./utils/githubReports.js";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { createServer } from "http";
import { checkRepo } from "./github/repoCheck.js";
import path, { normalize } from "path";

config();

export const webhooks = new Webhooks({
  secret: process.env["GITHUB_SECRET"] as string
})

export const bot = new Client({
  // To use only guild command
  botGuilds: process.env["REPORT_GUILD"] ? [process.env["REPORT_GUILD"] as string, "946712507874152488"] : ["946712507874152488"],

  // Discord intents
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.MessageContent,
  ],

  // Debug logs are disabled in silent mode
  silent: process.env["NODE_ENV"] == "production",

  // Configuration for @SimpleCommand
  simpleCommand: {
    prefix: "sb-",
    argSplitter: / +/
  },
});

bot.once("ready", async () => {
  // Make sure all guilds are cached
  await bot.guilds.fetch();

  // Synchronize applications commands with Discord
  await bot.initApplicationCommands();

  // To clear all guild commands, uncomment this line,
  // This is useful when moving from guild commands to global commands
  // It must only be executed once
  //
  //  await bot.clearApplicationCommands(
  //    ...bot.guilds.cache.map((g) => g.id)
  //  );
  if (!bot.user || !bot.user.id)
    throw Error("Who am i?")

  const guild = await bot.guilds.fetch(process.env["REPORT_GUILD"] as string);
  if (!guild || !guild.id)
    throw Error(`Environment guild REPORT_GUILD (${process.env["REPORT_GUILD"]}) does not exist!`)

  const reportChannel = await guild.channels.fetch(process.env["REPORT_CHANNEL"] as string);
  if (!reportChannel || !reportChannel.id)
    throw Error(`Environment channel REPORT_CHANNEL (${process.env["REPORT_CHANNEL"]}) does not exist!`)

  const mirrorChannel = await guild.channels.fetch(process.env["MIRROR_CHANNEL"] as string);
    if (!mirrorChannel || !mirrorChannel.id)
      throw Error(`Environment channel MIRROR_CHANNEL (${process.env["MIRROR_CHANNEL"]}) does not exist!`)
  
  if (!process.env["ALLOWED_ROLES"])
    throw Error(`Environment role ALLOWED_ROLES (${process.env["ALLOWED_ROLES"]}) does not exist!`)

  const allowedRoles = process.env["ALLOWED_ROLES"].split(/; */);
  if (!allowedRoles.length)
    throw Error(`Environment role ALLOWED_ROLES (${process.env["ALLOWED_ROLES"]}) is empty!`)

  const mstone = process.env["REPORT_MILESTONE"];

  console.log("Reading reports...");
  readReports();

  console.log(
    "=============\n"+
    " Bot started\n"+
    "============="
  );
  console.log(` Logged in as:   ${bot.user.tag} [${bot.user.id}]`);
  console.log(` Report guild:   ${guild.name} [${guild.id}]`);
  console.log(` Report channel: #${reportChannel.name} [${reportChannel.id}]`);
  console.log(` Report GitHub:  ${process.env["REPORT_REPO"]}${mstone && (', Milestone: '+ mstone)}`);
  console.log(` Fetch GitHub:   ${process.env["GET_REPO"]}`);

  console.log(` Allowed roles:`);
  for (const roleId of allowedRoles) {
    const role = await guild.roles.fetch(roleId);
    if (!role)
      throw Error(`Role ${roleId} does not exist on this guild`);
    console.log(` - ${role.name} [${role.id}]`);
  }

  console.log("=============");

  setInterval(checkRepo, 5*MINUTES);
  checkRepo();
});

bot.on("interactionCreate", (interaction: Interaction) => {
  bot.executeInteraction(interaction);
});

bot.on("messageCreate", (message) => {
  if (message.channel.id === '903343634412359691')
    try { message.react("<:PepeList:772558440803336192>"); } catch (e) {}
  bot.executeCommand(message);
})

async function run() {
  await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);

  const envsToCheck = [
    "BOT_TOKEN", "GIT_TOKEN", "REPORT_GUILD", "REPORT_CHANNEL",
    "MIRROR_CHANNEL", "REPORT_REPO", "GET_REPO", "ALLOWED_ROLES",
    "GIT_EMAIL", "GIT_NAME"] as const;
  for (const env of envsToCheck)
    if (!process.env[env])
      throw Error(`Could not find ${env} in your environment`);

  shared.octokit = new Octokit({
    auth: process.env["GIT_TOKEN"]
  });

  // Log in with your bot token
  await bot.login(process.env["BOT_TOKEN"]);

  // Import github hooks
  await import(`${dirname(import.meta.url)}/github/catcher.js`)

  // Create webhook server
  createServer(createNodeMiddleware(webhooks, { path: "/" })).listen(Number(process.env["PORT"] || 51528), "0.0.0.0", () => console.log("Listening port", process.env["PORT"] || 51528));
}

run();
