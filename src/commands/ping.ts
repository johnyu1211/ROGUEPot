import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types/index.js";
import { createBaseEmbed, COLORS } from "../utils/embed.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("봇의 응답 속도 및 상태를 확인합니다."),
  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({
      content: "🏓 퐁 측정 중...",
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    const embed = createBaseEmbed("🏓 Pong!", "봇 상태가 정상입니다.")
      .setColor(COLORS.SUCCESS)
      .addFields(
        { name: "왕복 지연 시간 (Latency)", value: `${latency}ms`, inline: true },
        { name: "WebSocket Ping", value: `${wsPing}ms`, inline: true }
      );

    await interaction.editReply({ content: "", embeds: [embed] });
  },
};
