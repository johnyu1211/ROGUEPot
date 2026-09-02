import { Collection } from "discord.js";
import { Command } from "../types/index.js";
import { command as pingCommand } from "./ping.js";
import { command as openCommand } from "./open.js";
import { command as testCommand } from "./test.js";
import { command as setmovesCommand } from "./setmoves.js";

export const commandList: Command[] = [
  openCommand,
  testCommand,
  pingCommand,
  setmovesCommand,
];

export function getCommandsCollection(): Collection<string, Command> {
  const commands = new Collection<string, Command>();
  for (const cmd of commandList) {
    commands.set(cmd.data.name, cmd);
  }
  return commands;
}
