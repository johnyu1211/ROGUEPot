import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  NewsChannel
} from "discord.js";
import { Command } from "../types/index.js";
import { createBaseEmbed, COLORS, POKEROGUE_LOGO_URL } from "../utils/embed.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("open")
    .setDescription("포켓로그 전용 개인 게임 스레드를 열고 타이틀 화면을 엽니다."),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.channel) {
      await interaction.reply({
        content: "❌ 서버 내의 텍스트 채널에서만 게임 스레드를 열 수 있습니다.",
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.channel;
    if (channel.isThread()) {
      await interaction.reply({
        content: "❌ 이미 스레드 안에 있습니다! 새로운 스레드는 일반 텍스트 채널에서 열어주세요.",
        ephemeral: true,
      });
      return;
    }

    // Defer reply
    await interaction.deferReply({ ephemeral: true });

    try {
      const threadName = `🎮 ${interaction.user.username}의 PokéRogue`;

      // Create thread
      let thread;
      if (channel instanceof TextChannel || channel instanceof NewsChannel) {
        thread = await channel.threads.create({
          name: threadName,
          autoArchiveDuration: 60,
          reason: `${interaction.user.tag} PokeRogue Game Session`,
        });
      } else {
        await interaction.editReply({
          content: "❌ 현재 채널에서는 스레드를 생성할 수 없습니다.",
        });
        return;
      }

      // Title Screen Embed (Clean title, logo, no greeting)
      const titleEmbed = createBaseEmbed()
        .setColor(COLORS.POKEROGUE_RED)
        .setImage(POKEROGUE_LOGO_URL);

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`game_start_${interaction.user.id}`)
          .setLabel("새로운 런 시작 🚀")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`game_help_${interaction.user.id}`)
          .setLabel("게임 방법 📖")
          .setStyle(ButtonStyle.Secondary)
      );

      await thread.send({
        embeds: [titleEmbed],
        components: [actionRow],
      });

      // Ephemeral confirmation to user
      await interaction.editReply({
        content: `✅ 게임 스레드가 생성되었습니다! 👉 <#${thread.id}> 채널로 이동하여 플레이를 시작하세요.`,
      });
    } catch (error) {
      console.error("[ERROR] Failed to create thread:", error);
      await interaction.editReply({
        content: "❌ 스레드를 생성하는 도중 오류가 발생했습니다. 봇의 '스레드 생성(Create Threads)' 권한을 확인해주세요.",
      });
    }
  },
};
