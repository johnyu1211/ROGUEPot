import { Collection } from "discord.js";
import { Command } from "../types/index.js";
import { command as pingCommand } from "./ping.js";
import { command as openCommand } from "./open.js";
import { command as testCommand } from "./test.js";

export const commandList: Command[] = [
  openCommand,
  testCommand,
  pingCommand,
];

export function getCommandsCollection(): Collection<string, Command> {
  const commands = new Collection<string, Command>();
  for (const cmd of commandList) {
    commands.set(cmd.data.name, cmd);
  }
  return commands;
}
