import { Events, Client, ActivityType } from "discord.js";
import { BotEvent } from "../types/index.js";

export const readyEvent: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    console.log(`[READY] Logged in as ${client.user?.tag}!`);
    client.user?.setActivity("PokeRogue", { type: ActivityType.Playing });
  },
};
