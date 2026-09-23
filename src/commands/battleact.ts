import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../types/index.js";
import {
  getOrCreateShowcaseSession,
  renderShowcaseInitialEntry,
  buildShowcaseMessageData,
} from "../battle/showcaseEngine.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("battleact")
    .setDescription("3 vs 3 포켓몬 배틀을 진행합니다."),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const session = getOrCreateShowcaseSession(interaction.user.id, true);
      const { buffer, commentary } = await renderShowcaseInitialEntry(session);
      const msgData = buildShowcaseMessageData(session, interaction.user.id, commentary, buffer);
      await interaction.editReply(msgData);
    } catch (error: any) {
      console.error("[ERROR] /battleact error:", error);
      await interaction.editReply({
        content: `❌ 배틀 진행 중 오류가 발생했습니다: ${error?.message || error}`,
      });
    }
  },
};
