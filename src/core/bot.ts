import { Client, GatewayIntentBits, Partials } from "discord.js";
import { ExtendedClient } from "../types/index.js";
import { getCommandsCollection } from "../commands/index.js";
import { readyEvent } from "../events/ready.js";
import { interactionCreateEvent } from "../events/interactionCreate.js";
import { messageReactionAddEvent } from "../events/messageReactionAdd.js";

export function createBotClient(): ExtendedClient {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.Reaction,
      Partials.User,
    ],
  }) as ExtendedClient;

  // Initialize commands collection
  client.commands = getCommandsCollection();

  // Register events
  const events = [readyEvent, interactionCreateEvent, messageReactionAddEvent];
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args: any[]) => (event.execute as any)(...args));
    } else {
      client.on(event.name, (...args: any[]) => (event.execute as any)(...args));
    }
  }

  return client;
}
