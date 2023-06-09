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

config();

export const webhooks = new Webhooks({
  secret: process.env["GITHUB_SECRET"] as string
})

export const bot = new Client({
  // To use only guild command
  botGuilds: [process.env["REPORT_GUILD"] as string, "946712507874152488"],

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

  setInterval(checkRepo, 30*MINUTES);
  checkRepo();
});

bot.on("interactionCreate", (interaction: Interaction) => {
  bot.executeInteraction(interaction);
});

bot.on("messageCreate", async (message: Message) => {
  if (message.channelId == "1113779558844469269") {
    // const maeko = await bot.users.fetch("258962443441537024");
    const maeko = await bot.users.fetch("706124306660458507");
    const msgtext = message.content.slice(0, 1700);
    const msgauthor = `${message.author.id} (${message.author.username}${(message.author.discriminator != "0") ? '#'+message.author.discriminator : '@'})`;
    await maeko.send({
      content: `**WIKI-MISTAKE** - ${message.url}\nАвтор: <@!${msgauthor}>\n=====\n${msgtext}${message.content.length > 1700 ? ' \\[...\\]' : ''}`
    });
    return;
  }
  bot.executeCommand(message);
});

async function run() {
  await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);

  // Let's start the bot
  if (!process.env["BOT_TOKEN"])
    throw Error("Could not find BOT_TOKEN in your environment");
  
  if (!process.env["GIT_TOKEN"])
    throw Error("Could not find GIT_TOKEN in your environment");

  if (!process.env["REPORT_GUILD"])
    throw Error("Could not find REPORT_GUILD in your environment")

  if (!process.env["REPORT_CHANNEL"])
    throw Error("Could not find REPORT_CHANNEL in your environment")

  if (!process.env["MIRROR_CHANNEL"])
    throw Error("Could not find MIRROR_CHANNEL in your environment")
    
  if (!process.env["REPORT_REPO"])
    throw Error("Could not find REPORT_REPO in your environment")
  
  if (!process.env["GET_REPO"])
    throw Error("Could not find GET_REPO in your environment")

  if (!process.env["ALLOWED_ROLES"])
    throw Error("Could not find ALLOWED_ROLES in your environment")

  if (!process.env["GIT_EMAIL"])
    throw Error("Could not find GIT_EMAIL in your environment")
  
  if (!process.env["GIT_NAME"])
    throw Error("Could not find GIT_NAME in your environment")

  shared.octokit = new Octokit({
    auth: process.env["GIT_TOKEN"]
  });

  // Log in with your bot token
  await bot.login(process.env["BOT_TOKEN"]);

  // Import github hooks
  await import(`${dirname(import.meta.url)}/github/catcher.js`)

  // Create webhook server
  createServer(createNodeMiddleware(webhooks, { path: "/" })).listen(process.env["PORT"] || 51528);
}

run();
