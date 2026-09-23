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

  // Global safety error handlers to prevent bot process from terminating on transient errors
  process.on("unhandledRejection", (reason: any) => {
    console.error("[GLOBAL UNHANDLED REJECTION]", reason);
  });
  process.on("uncaughtException", (error: Error) => {
    console.error("[GLOBAL UNCAUGHT EXCEPTION]", error);
  });

  // Create and login Discord client with retry handling for temporary 503 / network blips
  const client = createBotClient();

  let loggedIn = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!loggedIn && attempts < maxAttempts) {
    attempts++;
    try {
      await client.login(config.discordToken);
      loggedIn = true;
    } catch (error: any) {
      console.warn(`[LOGIN WARNING] Login attempt ${attempts}/${maxAttempts} failed:`, error?.message || error);
      if (attempts >= maxAttempts) {
        console.error("[FATAL] Failed to login to Discord after maximum attempts:", error);
        process.exit(1);
      }
      console.log(`[RETRY] Waiting 3 seconds before retrying Discord login...`);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
}

main();
