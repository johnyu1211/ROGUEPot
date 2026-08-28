import { Client, GatewayIntentBits } from "discord.js";
import { ExtendedClient } from "../types/index.js";
import { getCommandsCollection } from "../commands/index.js";
import { readyEvent } from "../events/ready.js";
import { interactionCreateEvent } from "../events/interactionCreate.js";

export function createBotClient(): ExtendedClient {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ],
  }) as ExtendedClient;

  // Initialize commands collection
  client.commands = getCommandsCollection();

  // Register events
  const events = [readyEvent, interactionCreateEvent];
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }

  return client;
}
