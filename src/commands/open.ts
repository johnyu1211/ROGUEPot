import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
  NewsChannel
} from "discord.js";
import { Command } from "../types/index.js";
import { COLORS, POKEROGUE_VERSION } from "../utils/embed.js";
import { renderTitleScreen } from "../utils/canvasRenderer.js";
import { saveService } from "../services/saveService.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("open")
    .setDescription("Open a dedicated PokéRogue game thread and title screen."),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.channel) {
      await interaction.reply({
        content: "You can only open a game thread within a server text channel.",
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.channel;
    if (channel.isThread()) {
      await interaction.reply({
        content: "You are already inside a thread! Please use /open in a standard text channel.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const threadName = `${interaction.user.username}'s PokéRogue`;

      let thread;
      if (channel instanceof TextChannel || channel instanceof NewsChannel) {
        thread = await channel.threads.create({
          name: threadName,
          autoArchiveDuration: 60,
          reason: `${interaction.user.tag} PokéRogue Game Session`,
        });
      } else {
        await interaction.editReply({
          content: "Cannot create a thread in this channel type.",
        });
        return;
      }

      const userId = interaction.user.id;
      const hasSavedSlots = saveService.hasAnySavedSlot(userId);
      const userProfile = saveService.getProfile(userId);
      const activeRun = userProfile.activeSlotId ? userProfile.slots[userProfile.activeSlotId] : null;
      const isKo = userProfile.language === "ko";

      const imageBuffer = await renderTitleScreen({
        username: interaction.user.username,
        avatarUrl: interaction.user.displayAvatarURL({ extension: "png", size: 64 }),
        hasSavedSlots,
        party: activeRun?.party,
        lang: userProfile.language,
      });
      const attachment = new AttachmentBuilder(imageBuffer, { name: "title.png" });

      // ROW 1: Main Game Actions (1. Load Game / 2. New Game / 3. Multiplay)
      const mainActionRow = new ActionRowBuilder<ButtonBuilder>();
      if (hasSavedSlots) {
        mainActionRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`menu_loadgame_${userId}`)
            .setLabel(isKo ? "불러오기" : "Load Game")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`menu_newgame_${userId}`)
            .setLabel(isKo ? "새 게임" : "New Game")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`menu_multiplay_${userId}`)
            .setLabel(isKo ? "멀티플레이" : "Multiplay")
            .setStyle(ButtonStyle.Secondary)
        );
      } else {
        mainActionRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`menu_newgame_${userId}`)
            .setLabel(isKo ? "새 게임" : "New Game")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`menu_multiplay_${userId}`)
            .setLabel(isKo ? "멀티플레이" : "Multiplay")
            .setStyle(ButtonStyle.Secondary)
        );
      }

      // ROW 2: Utility & Settings Actions
      const subActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`menu_inventory_${userId}`)
          .setLabel("💼")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`menu_settings_${userId}`)
          .setLabel("⚙️")
          .setStyle(ButtonStyle.Secondary)
      );

      await thread.send({
        files: [attachment],
        components: [mainActionRow, subActionRow],
      });

      const sessionNoticeEmbed = new EmbedBuilder()
        .setColor(COLORS.POKEROGUE_BLUE)
        .setTitle(isKo ? "🎮 PokéRogue 게임 세션 생성 완료" : "🎮 PokéRogue Game Session Created")
        .setDescription(
          `<#${thread.id}>\n\n` +
          "━━━━━━━━━━━━━━━━━━━━━━\n" +
          (isKo
            ? "⚠️ **데이터 및 세션 유실 면책 고지**\n" +
              "• 봇 업데이트/재부팅, 디스코드 상호작용 세션 만료(15분) 및 서버 점검 등으로 인해 진행 중이던 게임 데이터나 배틀 세션이 유실될 수 있으며, 이에 대해 개발팀은 일절 책임을 지지 않습니다.\n" +
              "• 중요 진행 상황은 슬롯에 안전하게 자주 저장해 주시기 바랍니다.\n\n" +
              "**📜 오픈소스 & 크레딧**\n" +
              "• **게임 엔진**: [PokéRogue](https://github.com/pagefaultgames/pokerogue) (PageFaultGames)\n" +
              "• **배틀 스프라이트**: [Pokémon Showdown](https://pokemonshowdown.com/)\n" +
              "• **PMD 도트/포트레이트**: [PMD SpriteCollab](https://sprites.pmdcollab.org/) (CC BY-NC 4.0)\n" +
              "• **포켓몬 데이터**: [PokéAPI](https://pokeapi.co/)\n\n" +
              "**⚖️ 법적 면책 조항**\n" +
              "• Pokémon © Nintendo / Creatures Inc. / GAME FREAK inc.\n" +
              "• 비상업적 팬메이드 봇 (GNU AGPL-3.0 라이선스 적용)."
            : "⚠️ **Data & Session Loss Disclaimer**\n" +
              "• The developers assume NO responsibility for any loss of game progress or active battle sessions caused by bot updates, restarts, Discord session timeouts (15m), or server downtime.\n" +
              "• Please save your important game progress to save slots regularly.\n\n" +
              "**📜 Open Source & Credits**\n" +
              "• **Game Engine**: [PokéRogue](https://github.com/pagefaultgames/pokerogue) (PageFaultGames)\n" +
              "• **Battle Sprites**: [Pokémon Showdown](https://pokemonshowdown.com/)\n" +
              "• **PMD Sprites & Portraits**: [PMD SpriteCollab](https://sprites.pmdcollab.org/) (CC BY-NC 4.0)\n" +
              "• **Pokémon Data**: [PokéAPI](https://pokeapi.co/)\n\n" +
              "**⚖️ Legal Disclaimer**\n" +
              "• Pokémon © Nintendo / Creatures Inc. / GAME FREAK inc.\n" +
              "• Non-profit fan-made companion bot under GNU AGPL-3.0.")
        )
        .setFooter({
          text: `PokéRogue Engine Version : ${POKEROGUE_VERSION}`,
        });

      await interaction.editReply({
        content: "",
        embeds: [sessionNoticeEmbed],
      });
    } catch (error) {
      console.error("[ERROR] Failed to create thread:", error);
      await interaction.editReply({
        content: "An error occurred while creating the thread. Please check the bot's 'Create Public/Private Threads' permissions.",
      });
    }
  },
};
