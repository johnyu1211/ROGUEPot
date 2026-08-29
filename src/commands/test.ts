import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder
} from "discord.js";
import { Command } from "../types/index.js";
import { createBaseEmbed, COLORS } from "../utils/embed.js";
import { renderDotTestCard } from "../utils/canvasRenderer.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test pixel art rendering quality and sharpness with sample Pokémon."),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const buffer = await renderDotTestCard();
      const attachment = new AttachmentBuilder(buffer, { name: "test_pixel.png" });

      const embed = createBaseEmbed(
        "Pixel Art Rendering Quality Test",
        "Displaying sample Pokémon sprites (Darkrai, Charizard, Mega Gengar) with **Nearest-Neighbor pixel-perfect scaling** (Anti-aliasing disabled)."
      )
        .setColor(COLORS.SUCCESS)
        .setImage("attachment://test_pixel.png");

      await interaction.editReply({
        embeds: [embed],
        files: [attachment],
      });
    } catch (error) {
      console.error("[ERROR] Failed to run /test command:", error);
      await interaction.editReply({
        content: "An error occurred during pixel art test rendering.",
      });
    }
  },
};
