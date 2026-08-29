import { config, validateConfig } from "./config/index.js";
import { createBotClient } from "./core/bot.js";
import { pokerogueService } from "./services/pokerogueService.js";

async function main() {
  console.log("==========================================");
  console.log("          🎮 ROGUEPot Bot Starting        ");
  console.log("       PokeRogue Discord Companion        ");
  console.log("==========================================");

  validateConfig();

  if (!config.discordToken || config.discordToken === "your_discord_bot_token_here") {
    console.error("[FATAL] DISCORD_TOKEN is not defined in .env! Please set your bot token.");
    process.exit(1);
  }

  // Initialize Services
  if (pokerogueService.isReady()) {
    console.log("[SERVICE] PokeRogue Service initialized.");
  }

  // Create and login Discord client
  const client = createBotClient();

  try {
    await client.login(config.discordToken);
  } catch (error) {
    console.error("[FATAL] Failed to login to Discord:", error);
    process.exit(1);
  }
}

main();
