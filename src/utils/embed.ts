import { EmbedBuilder } from "discord.js";

// PokeRogue theme colors
export const COLORS = {
  PRIMARY: 0x5865f2,
  SUCCESS: 0x57f287,
  WARNING: 0xfee75c,
  ERROR: 0xed4245,
  POKEROGUE_RED: 0xe63946,
  POKEROGUE_BLUE: 0x1d3557,
  POKEROGUE_GOLD: 0xf4a261,
} as const;

export const POKEROGUE_VERSION = "v1.12.1.0";
export const POKEROGUE_LOGO_URL = "https://raw.githubusercontent.com/pagefaultgames/pokerogue/main/public/images/logo.png";

export function createBaseEmbed(title?: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.POKEROGUE_RED)
    .setTimestamp()
    .setFooter({
      text: `PokéRogue version : ${POKEROGUE_VERSION}`,
    });

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);

  return embed;
}
