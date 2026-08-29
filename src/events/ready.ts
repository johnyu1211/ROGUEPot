import { Events, Client, ActivityType } from "discord.js";
import { BotEvent } from "../types/index.js";

export const readyEvent: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    if (!client.user) return;

    console.log("==========================================");
    console.log(`[READY] ROGUEPot logged in as ${client.user.tag}!`);
    console.log(`[READY] Bot ID: ${client.user.id}`);
    
    // Auto-generated invite URL
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=277025778752&scope=bot%20applications.commands`;
    console.log(`[INVITE] Server Invite URL:\n${inviteUrl}`);
    console.log("==========================================");

    client.user.setActivity("PokeRogue | ROGUEPot", { type: ActivityType.Playing });
  },
};
