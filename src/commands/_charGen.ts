import { NotBot } from "@discordx/utilities";
import { ActionRowBuilder, MessageActionRowComponentBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";
import { Discord, Guard, SelectMenuComponent, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, SimpleCommandOptionType } from "discordx";
import { access, readFile, readdir } from "fs/promises";
import path from "path";
import type { Message } from 'discord.js';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
let dataDirContents: string[];

const emojiByMap: Record<string, string> = {
  'torch': '<:Torch:1154427453318647888>',
  'sierra': '<:SBay12:1098182414485954601>'
};
const emojiBySpecies: Record<string, string> = {
  'Human': ':adult:',
  'Tajara': ':cat:',
  'Giant Armoured Serpenthid': ':bug:',
  'Adherent': ':octopus:'
}

interface PlayerData {
  real_name: string,
  map: string,
  species: string,
  age: string
}

const playersCache = new Map<string, PlayerData[]>();

async function getPlayersByName(gameDir: string, rawName: string): Promise<PlayerData[]> {
  const playerName = rawName.toLowerCase();
  const dataDir = path.join(gameDir, 'data/player_saves');

  try { await access(gameDir); }
  catch (e) { console.error(e); throw Error("Game wasn't found"); }

  try { dataDirContents = await readdir(dataDir, { recursive: true }); }
  catch (e) { console.error(e); throw Error("Error reading data"); }

  if (!dataDirContents || !dataDirContents.length)
    throw Error("No data");

  const playerData: PlayerData[] = [];
  for (const filename of dataDirContents) {
    const expr = /character_(?<map>\w+)_\d+.json/.exec(filename);
    if (!expr?.groups?.map) continue;
    const fileToRead = path.join(dataDir, filename);
    try {
      const fileData = JSON.parse(String(await readFile(fileToRead)));
      if (!fileData.real_name.toLowerCase().includes(playerName)) continue;
      playerData.push({
        map: capitalize(expr.groups.map),
        real_name: fileData.real_name,
        species: fileData.species,
        age: fileData.age
      });
    } catch (e) { throw e; }
  }

  return playerData;
}

async function generatePlayer(player: PlayerData) {
  
}

async function showPlayer(reply: Message["reply"], player: PlayerData) {
  reply({
    content: "got ya"
  });
}

@Discord()
@Guard(NotBot)
export class CharGenCommand {

  @SimpleCommand({ name: "chargen" })
  async chargen(
    @SimpleCommandOption({ name: "name", type: SimpleCommandOptionType.String })
    rawPlayerName: string | undefined,
    command: SimpleCommandMessage
  ) {
    if (command.message.author.id !== "706124306660458507")
      return;
    if (!rawPlayerName)
      return;

    if (!process.env["GAME_DIR"])
      return command.message.reply("No `GAME_DIR` set");


    const gameDir = path.resolve(path.dirname(import.meta.url), process.env["GAME_DIR"]);

    let players: PlayerData[];
    try { players = await getPlayersByName(gameDir, rawPlayerName) }
    catch (e) {
      if (e instanceof Error)
        return await command.message.reply(e.message);
      throw e;
    }

    if (!players) return;
    if (!players.length)
      return await command.message.reply("Персонаж не найден");

    if (players.length === 1) {
      showPlayer(command.message.reply, players[0]);
    } else if (players.length <= 25) {
      playersCache.set(command.message.author.id, players);
      let index = 0;
      const charSelectMenu = new StringSelectMenuBuilder()
        .setCustomId("chargen-char")
        .setPlaceholder("Персонаж")
        .addOptions(players.map(p => ({
          label: `${p.real_name} - ${p.age}`, value: String(index++),
          emoji: emojiBySpecies[p.species] || ':space_invader:'
        })));
      const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(charSelectMenu);
      return await command.message.reply({
        content: "Выберите персонажа:",
        components: [ row ]
      })
    }
    return await command.message.reply("Найдено слишком много персонажей (> 25)");

    // const maps: string[] = [];
    // for (const filename of dataDirContents) {
    //   const fileData = /character_(?<map>\w+)_\d+\.json/.exec(filename);
    //   if (!fileData || !fileData.groups) continue;
    // }

    

    
    await command.message.reply({
      content: "```\n"+JSON.stringify(players, null, 2)+"\n```",
      // components: [ row ]
    });
  }

  @SelectMenuComponent({ id: "chargen-map" })
  async selectMap(interaction: StringSelectMenuInteraction) {
    
  }

  @SelectMenuComponent({ id: "chargen-char" })
  async selectCharacter(interaction: StringSelectMenuInteraction) {
    
  }
}
