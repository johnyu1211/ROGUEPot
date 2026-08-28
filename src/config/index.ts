import dotenv from "dotenv";

dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN || "",
  clientId: process.env.CLIENT_ID || "",
  guildId: process.env.GUILD_ID || "",
  nodeEnv: process.env.NODE_ENV || "development",
};

export function validateConfig(): void {
  const missing: string[] = [];
  if (!config.discordToken || config.discordToken === "your_discord_bot_token_here") {
    missing.push("DISCORD_TOKEN");
  }
  if (!config.clientId || config.clientId === "your_discord_client_id_here") {
    missing.push("CLIENT_ID");
  }

  if (missing.length > 0) {
    console.warn(`[CONFIG WARNING] Missing or default environment variables: ${missing.join(", ")}`);
    console.warn("Please update your .env file with your Discord Bot credentials.");
  }
}
