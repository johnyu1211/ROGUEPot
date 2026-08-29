import {
  Events,
  Interaction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from "discord.js";
import { BotEvent, ExtendedClient } from "../types/index.js";
import { createBaseEmbed, COLORS } from "../utils/embed.js";
import { saveService } from "../services/saveService.js";

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

      // Ownership Verification
      const parts = customId.split("_");
      const ownerId = parts[parts.length - 1];

      if (ownerId && ownerId !== interaction.user.id && ownerId.length > 15) {
        await interaction.reply({
          content: "❌ You are not the owner of this game session! Use `/open` to start your own run.",
          ephemeral: true,
        });
        return;
      }

      // 2-1. New Game Button Clicked
      if (customId.startsWith("menu_newgame_")) {
        const starterEmbed = createBaseEmbed(
          "Choose Your Starter Pokémon",
          "Select your starter Pokémon to begin your PokéRogue adventure!\n\n" +
          "🌱 **Bulbasaur (#0001)** - Grass/Poison | Cost: 3 | Balanced & Status Moves\n" +
          "🔥 **Charmander (#0004)** - Fire | Cost: 3 | High Firepower & Offense\n" +
          "💧 **Squirtle (#0007)** - Water | Cost: 3 | High Defense & Tanky"
        )
          .setColor(COLORS.POKEROGUE_GOLD)
          .setImage("https://play.pokemonshowdown.com/sprites/ani/charmander.gif");

        const starterSelectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`starter_select_${interaction.user.id}`)
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

        await interaction.reply({
          embeds: [starterEmbed],
          components: [starterSelectMenu],
        });
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

        await interaction.reply({
          content: `Resuming Run from Slot #${profile.activeSlotId} (Wave ${activeRun.wave})...`,
        });
        return;
      }

      // 2-3. Load Game Button Clicked (3 Slots)
      if (customId.startsWith("menu_loadgame_")) {
        const profile = saveService.getProfile(interaction.user.id);

        const slotEmbed = createBaseEmbed(
          "Load Game Slots (3 Slots)",
          "Select a save slot to load or overwrite:\n\n" +
          `• **Slot 1**: ${profile.slots[1] ? `Wave ${profile.slots[1]!.wave} - ${profile.slots[1]!.biome}` : "*Empty Slot*"}\n` +
          `• **Slot 2**: ${profile.slots[2] ? `Wave ${profile.slots[2]!.wave} - ${profile.slots[2]!.biome}` : "*Empty Slot*"}\n` +
          `• **Slot 3**: ${profile.slots[3] ? `Wave ${profile.slots[3]!.wave} - ${profile.slots[3]!.biome}` : "*Empty Slot*"}`
        ).setColor(COLORS.PRIMARY);

        const slotButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`slot_select_1_${interaction.user.id}`)
            .setLabel("Slot 1")
            .setStyle(profile.slots[1] ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`slot_select_2_${interaction.user.id}`)
            .setLabel("Slot 2")
            .setStyle(profile.slots[2] ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`slot_select_3_${interaction.user.id}`)
            .setLabel("Slot 3")
            .setStyle(profile.slots[3] ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );

        await interaction.reply({
          embeds: [slotEmbed],
          components: [slotButtons],
          ephemeral: true,
        });
        return;
      }
    }
  },
};
