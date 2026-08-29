import {
  Events,
  Interaction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder
} from "discord.js";
import { BotEvent, ExtendedClient } from "../types/index.js";
import { createBaseEmbed, COLORS } from "../utils/embed.js";
import { renderTitleScreen } from "../utils/canvasRenderer.js";
import { saveService } from "../services/saveService.js";

function createStarterSelectMenu(slotId: number, userId: string) {
  const starterEmbed = createBaseEmbed(
    `[Slot ${slotId}] Choose Your Starter Pokémon`,
    "Select your starter Pokémon to begin your PokéRogue adventure!\n\n" +
    "🌱 **Bulbasaur (#0001)** - Grass/Poison | Cost: 3 | Balanced & Status Moves\n" +
    "🔥 **Charmander (#0004)** - Fire | Cost: 3 | High Firepower & Offense\n" +
    "💧 **Squirtle (#0007)** - Water | Cost: 3 | High Defense & Tanky"
  )
    .setColor(COLORS.POKEROGUE_GOLD)
    .setImage("https://play.pokemonshowdown.com/sprites/ani/charmander.gif");

  const starterSelectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`starter_select_${slotId}_${userId}`)
      .setPlaceholder("Select a starter Pokémon...")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Bulbasaur (이상해씨)")
          .setDescription("Cost: 3 | Grass/Poison | Overgrow")
          .setValue("bulbasaur")
          .setEmoji("🌱"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Charmander (파이리)")
          .setDescription("Cost: 3 | Fire | Blaze")
          .setValue("charmander")
          .setEmoji("🔥"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Squirtle (꼬부기)")
          .setDescription("Cost: 3 | Water | Torrent")
          .setValue("squirtle")
          .setEmoji("💧")
      )
  );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`menu_loadgame_${userId}`)
      .setLabel("◀️ Back to Slots")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [starterEmbed], components: [starterSelectMenu, backRow] };
}

async function renderTitleMessageData(userId: string) {
  const hasSavedSlots = saveService.hasAnySavedSlot(userId);
  const userProfile = saveService.getProfile(userId);

  const imageBuffer = await renderTitleScreen({
    hasSavedSlots,
    unlockedCount: userProfile.unlockedStartersCount,
  });
  const attachment = new AttachmentBuilder(imageBuffer, { name: "title.png" });

  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  if (hasSavedSlots) {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`menu_continue_${userId}`)
        .setLabel("Continue")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`menu_newgame_${userId}`)
        .setLabel("New Game")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`menu_loadgame_${userId}`)
        .setLabel("Load Game")
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`menu_newgame_${userId}`)
        .setLabel("New Game")
        .setStyle(ButtonStyle.Success)
    );
  }

  return { embeds: [], files: [attachment], components: [actionRow] };
}

export const interactionCreateEvent: BotEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    // 1. Slash Commands
    if (interaction.isChatInputCommand()) {
      const client = interaction.client as ExtendedClient;
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`[ERROR] Error executing command ${interaction.commandName}:`, error);
        const errorMessage = {
          content: "An error occurred while executing this command.",
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
      return;
    }

    // 2. Button Interactions
    if (interaction.isButton()) {
      const customId = interaction.customId;
      const parts = customId.split("_");
      const ownerId = parts[parts.length - 1];

      if (ownerId && ownerId !== interaction.user.id && ownerId.length > 15) {
        await interaction.reply({
          content: "❌ You are not the owner of this game session! Use `/open` to start your own run.",
          ephemeral: true,
        });
        return;
      }

      // 2-0. Back to Title Menu (Pure Image + Buttons)
      if (customId.startsWith("menu_back_to_title_")) {
        const titleData = await renderTitleMessageData(interaction.user.id);
        await interaction.update(titleData);
        return;
      }

      // 2-1. New Game Button Clicked -> Use first available slot
      if (customId.startsWith("menu_newgame_")) {
        const targetSlot = saveService.getFirstAvailableSlot(interaction.user.id);
        const responseData = createStarterSelectMenu(targetSlot, interaction.user.id);
        await interaction.update(responseData);
        return;
      }

      // 2-2. Continue Button Clicked
      if (customId.startsWith("menu_continue_")) {
        const profile = saveService.getProfile(interaction.user.id);
        const activeRun = profile.activeSlotId ? profile.slots[profile.activeSlotId] : null;

        if (!activeRun) {
          await interaction.reply({
            content: "No active save data found to continue. Please select 'New Game'.",
            ephemeral: true,
          });
          return;
        }

        const continueEmbed = createBaseEmbed(
          `Resumed Run - Slot #${profile.activeSlotId}`,
          `• **Biome**: ${activeRun.biome}\n` +
          `• **Current Wave**: Wave ${activeRun.wave}\n` +
          `• **Starter / Lead**: ${activeRun.party[0]?.name || activeRun.starter}\n` +
          `• **Money**: ₩${activeRun.money}\n\n` +
          "Ready for the next battle wave!"
        ).setColor(COLORS.SUCCESS);

        const resumeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`wave_battle_${profile.activeSlotId}_${activeRun.wave}_${interaction.user.id}`)
            .setLabel(`Enter Wave ${activeRun.wave} ⚔️`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`menu_back_to_title_${interaction.user.id}`)
            .setLabel("◀️ Back to Title")
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.update({
          embeds: [continueEmbed],
          components: [resumeRow],
        });
        return;
      }

      // 2-3. Load Game Button Clicked -> List 3 Slots + Back Button!
      if (customId.startsWith("menu_loadgame_")) {
        const profile = saveService.getProfile(interaction.user.id);

        const slotEmbed = createBaseEmbed(
          "Save Slots (3 Slots)",
          "Select a slot below. If empty, you can start a new game in that slot.\n\n" +
          `• **Slot 1**: ${profile.slots[1] ? `Wave ${profile.slots[1]!.wave} (${profile.slots[1]!.starter})` : "*[ Empty Slot ]*"}\n` +
          `• **Slot 2**: ${profile.slots[2] ? `Wave ${profile.slots[2]!.wave} (${profile.slots[2]!.starter})` : "*[ Empty Slot ]*"}\n` +
          `• **Slot 3**: ${profile.slots[3] ? `Wave ${profile.slots[3]!.wave} (${profile.slots[3]!.starter})` : "*[ Empty Slot ]*"}`
        ).setColor(COLORS.PRIMARY);

        const slotButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`slot_select_1_${interaction.user.id}`)
            .setLabel("Slot 1 🎮")
            .setStyle(profile.slots[1] ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`slot_select_2_${interaction.user.id}`)
            .setLabel("Slot 2 🎮")
            .setStyle(profile.slots[2] ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`slot_select_3_${interaction.user.id}`)
            .setLabel("Slot 3 🎮")
            .setStyle(profile.slots[3] ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`menu_back_to_title_${interaction.user.id}`)
            .setLabel("◀️ Back")
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.update({
          embeds: [slotEmbed],
          components: [slotButtons],
        });
        return;
      }

      // 2-4. Specific Slot Selected (Slot 1, 2, 3)
      if (customId.startsWith("slot_select_")) {
        const slotNum = parseInt(parts[2], 10) || 1;
        const profile = saveService.getProfile(interaction.user.id);
        const slotData = profile.slots[slotNum];

        if (!slotData) {
          // EMPTY SLOT -> Apply New Game starter selection logic!
          const responseData = createStarterSelectMenu(slotNum, interaction.user.id);
          await interaction.update(responseData);
        } else {
          // EXISTING SAVE DATA -> Options to resume or overwrite
          const existingSlotEmbed = createBaseEmbed(
            `Slot #${slotNum} Details`,
            `• **Starter**: ${slotData.party[0]?.name || slotData.starter}\n` +
            `• **Wave**: Wave ${slotData.wave}\n` +
            `• **Biome**: ${slotData.biome}\n` +
            `• **Saved At**: ${new Date(slotData.updatedAt).toLocaleString()}\n\n` +
            "Would you like to resume this run or overwrite it with a new game?"
          ).setColor(COLORS.PRIMARY);

          const slotActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`slot_resume_${slotNum}_${interaction.user.id}`)
              .setLabel(`Resume Slot #${slotNum} ▶️`)
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`slot_overwrite_${slotNum}_${interaction.user.id}`)
              .setLabel(`Overwrite (New Game) ⚠️`)
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`menu_loadgame_${interaction.user.id}`)
              .setLabel("◀️ Back")
              .setStyle(ButtonStyle.Secondary)
          );

          await interaction.update({
            embeds: [existingSlotEmbed],
            components: [slotActionRow],
          });
        }
        return;
      }

      // 2-5. Resume Existing Slot
      if (customId.startsWith("slot_resume_")) {
        const slotNum = parseInt(parts[2], 10) || 1;
        saveService.setActiveSlot(interaction.user.id, slotNum);
        const profile = saveService.getProfile(interaction.user.id);
        const activeRun = profile.slots[slotNum]!;

        const resumedEmbed = createBaseEmbed(
          `Resumed Slot #${slotNum}`,
          `Resumed your run on Wave ${activeRun.wave} (${activeRun.biome})!\n\n` +
          `• **Leader**: ${activeRun.party[0]?.name || activeRun.starter}\n` +
          `• **Money**: ₩${activeRun.money}`
        ).setColor(COLORS.SUCCESS);

        const resumeActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`wave_battle_${slotNum}_${activeRun.wave}_${interaction.user.id}`)
            .setLabel(`Enter Wave ${activeRun.wave} ⚔️`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`menu_back_to_title_${interaction.user.id}`)
            .setLabel("◀️ Back to Title")
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.update({
          embeds: [resumedEmbed],
          components: [resumeActionRow],
        });
        return;
      }

      // 2-6. Overwrite Slot -> Open starter selection for that slot
      if (customId.startsWith("slot_overwrite_")) {
        const slotNum = parseInt(parts[2], 10) || 1;
        const responseData = createStarterSelectMenu(slotNum, interaction.user.id);
        await interaction.update(responseData);
        return;
      }
    }

    // 3. String Select Menu Interactions (Starter Picked)
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;
      if (customId.startsWith("starter_select_")) {
        const parts = customId.split("_");
        const slotNum = parseInt(parts[2], 10) || 1;
        const selectedSpecies = interaction.values[0];

        // Start new run in this slot!
        const newRun = saveService.startNewRun(interaction.user.id, slotNum, selectedSpecies);

        const runStartedEmbed = createBaseEmbed(
          `🎮 Adventure Begins in Slot #${slotNum}!`,
          `You chose **${newRun.party[0].name}** as your starter!\n\n` +
          `• **Current Biome**: ${newRun.biome}\n` +
          `• **Starting Wave**: Wave 1\n` +
          `• **Starting Balance**: ₩${newRun.money}\n\n` +
          "Your journey into PokéRogue starts now!"
        )
          .setColor(COLORS.SUCCESS)
          .setImage(`https://play.pokemonshowdown.com/sprites/ani/${selectedSpecies}.gif`);

        const battleStartRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`wave_battle_${slotNum}_1_${interaction.user.id}`)
            .setLabel("Enter Wave 1 Battle ⚔️")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`menu_back_to_title_${interaction.user.id}`)
            .setLabel("◀️ Title Menu")
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.update({
          embeds: [runStartedEmbed],
          components: [battleStartRow],
        });
        return;
      }
    }
  },
};
