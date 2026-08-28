import { REST, Routes } from "discord.js";
import { config, validateConfig } from "../src/config/index.js";
import { commandList } from "../src/commands/index.js";

async function deployCommands() {
  validateConfig();

  if (!config.discordToken || config.discordToken === "your_discord_bot_token_here" || !config.clientId || config.clientId === "your_discord_client_id_here") {
    console.error("[ERROR] DISCORD_TOKEN or CLIENT_ID is missing in .env. Cannot deploy commands.");
    process.exit(1);
  }

  const commands = commandList.map((cmd) => cmd.data.toJSON());
  const rest = new REST({ version: "10" }).setToken(config.discordToken);

  console.log(`[INFO] Started refreshing ${commands.length} application (/) commands.`);

  try {
    if (config.guildId && config.guildId !== "your_development_guild_id_here_optional") {
      const data: any = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log(`[SUCCESS] Successfully reloaded ${data.length} guild (/) commands for guild ${config.guildId}.`);
    } else {
      const data: any = await rest.put(
        Routes.applicationCommands(config.clientId),
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
