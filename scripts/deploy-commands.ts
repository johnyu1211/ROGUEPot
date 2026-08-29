import { REST, Routes } from "discord.js";
import { config, validateConfig } from "../src/config/index.js";
import { commandList } from "../src/commands/index.js";

async function deployCommands() {
  validateConfig();

  if (!config.discordToken || config.discordToken === "your_discord_bot_token_here") {
    console.error("[ERROR] DISCORD_TOKEN is missing in .env. Cannot deploy commands.");
    process.exit(1);
  }

  const rest = new REST({ version: "10" }).setToken(config.discordToken);

  try {
    let clientId = config.clientId;

    // CLIENT_ID가 없으면 토큰을 통해 Discord API에서 본인 ID 자동 획득
    if (!clientId || clientId === "your_discord_client_id_here") {
      console.log("[INFO] CLIENT_ID not provided. Fetching Application ID automatically from token...");
      const currentUser: any = await rest.get(Routes.user("@me"));
      clientId = currentUser.id;
      console.log(`[INFO] Identified Application ID: ${clientId} (${currentUser.username}#${currentUser.discriminator})`);
    }

    const commands = commandList.map((cmd) => cmd.data.toJSON());
    console.log(`[INFO] Started refreshing ${commands.length} application (/) commands.`);

    if (config.guildId && config.guildId !== "your_development_guild_id_here_optional") {
      // Guild-specific commands (Instant update)
      const data: any = await rest.put(
        Routes.applicationGuildCommands(clientId, config.guildId),
        { body: commands }
      );
      console.log(`[SUCCESS] Successfully reloaded ${data.length} guild (/) commands for guild ${config.guildId}.`);
    } else {
      // Global commands
      const data: any = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`[SUCCESS] Successfully reloaded ${data.length} global (/) commands.`);
    }
  } catch (error) {
    console.error("[ERROR] Failed to deploy commands:", error);
    process.exit(1);
  }
}

deployCommands();
