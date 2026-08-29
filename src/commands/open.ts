import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  NewsChannel
} from "discord.js";
import { Command } from "../types/index.js";
import { createBaseEmbed, COLORS } from "../utils/embed.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("open")
    .setDescription("포켓로그 전용 개인 게임 스레드를 열고 게임을 시작합니다."),
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

    // Defer reply as thread creation may take a moment
    await interaction.deferReply({ ephemeral: true });

    try {
      const threadName = `🎮 ${interaction.user.username}의 PokéRogue`;

      // Create a thread
      let thread;
      if (channel instanceof TextChannel || channel instanceof NewsChannel) {
        thread = await channel.threads.create({
          name: threadName,
          autoArchiveDuration: 60, // 1 hour auto-archive
          reason: `${interaction.user.tag} PokeRogue Game Session`,
        });
      } else {
        await interaction.editReply({
          content: "❌ 현재 채널에서는 스레드를 생성할 수 없습니다.",
        });
        return;
      }

      // Initial Welcome & Game Start Embed inside the thread
      const welcomeEmbed = createBaseEmbed(
        "🎮 PokéRogue 게임 세션이 준비되었습니다!",
        `${interaction.user}님, 환영합니다!\n\n` +
        "**[ROGUEPot]**은 디스코드에서 즐기는 로그라이크 포켓몬 게임입니다.\n\n" +
        "• **웨이브 배틀**: 야생 포켓몬을 격파하고 포획하세요!\n" +
        "• **상점 & 보상**: 웨이브를 넘길 때마다 도구와 아이템을 선택하세요.\n" +
        "• **바이옴 탐험**: 다양한 지역을 돌파하며 정상을 향해 나아가세요.\n\n" +
        "아래 **[새로운 런 시작]** 버튼을 눌러 스타팅 포켓몬을 선택하세요!"
      )
        .setColor(COLORS.POKEROGUE_RED)
        .setImage("https://play.pokemonshowdown.com/sprites/gen5/pikachu.png");

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
        content: `${interaction.user} 님의 게임 방이 생성되었습니다!`,
        embeds: [welcomeEmbed],
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
