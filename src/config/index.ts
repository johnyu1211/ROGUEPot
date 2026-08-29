import dotenv from "dotenv";

dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN || "",
  clientId: process.env.CLIENT_ID || "",
  guildId: process.env.GUILD_ID || "",
  nodeEnv: process.env.NODE_ENV || "development",
};

export function validateConfig(): void {
  if (!config.discordToken || config.discordToken === "your_discord_bot_token_here") {
    console.warn("[CONFIG WARNING] DISCORD_TOKEN is missing or not set in .env.");
    console.warn("Please add your bot token to the .env file.");
  }
}
