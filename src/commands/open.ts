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

      const imageBuffer = await renderTitleScreen({
        username: interaction.user.username,
        avatarUrl: interaction.user.displayAvatarURL({ extension: "png", size: 64 }),
        hasSavedSlots,
        party: activeRun?.party,
      });
      const attachment = new AttachmentBuilder(imageBuffer, { name: "title.png" });

      const actionRow = new ActionRowBuilder<ButtonBuilder>();

      if (hasSavedSlots) {
        actionRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`menu_continue_${userId}`)
            .setLabel("Continue")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`menu_newgame_${userId}`)
            .setLabel("New Game")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`menu_loadgame_${userId}`)
            .setLabel("Load Game")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`menu_inventory_${userId}`)
            .setLabel("💼")
            .setStyle(ButtonStyle.Secondary)
        );
      } else {
        actionRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`menu_newgame_${userId}`)
            .setLabel("New Game")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`menu_inventory_${userId}`)
            .setLabel("💼")
            .setStyle(ButtonStyle.Secondary)
        );
      }

      await thread.send({
        files: [attachment],
        components: [actionRow],
      });

      const sessionNoticeEmbed = new EmbedBuilder()
        .setColor(COLORS.POKEROGUE_BLUE)
        .setTitle("PokeRogue Session Created")
        .setDescription(
          `<#${thread.id}>\n\n` +
          "━━━━━━━━━━━━━━━━━━━━━━\n" +
          "**Open Source & Attribution**\n" +
          "• Unofficial fan bot built referencing **[PokéRogue](https://github.com/pagefaultgames/pokerogue)** (GNU AGPL-3.0).\n\n" +
          "**Legal Disclaimer**\n" +
          "• Pokémon © Nintendo / Creatures Inc. / GAME FREAK inc.\n" +
          "• Non-profit fan-made project with no commercial intent."
        )
        .setFooter({
          text: `PokéRogue version : ${POKEROGUE_VERSION}`,
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
