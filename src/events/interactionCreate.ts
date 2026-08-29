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
import { renderTitleScreen, renderBagScreen } from "../utils/canvasRenderer.js";
import { saveService } from "../services/saveService.js";

function createStarterSelectMenu(userId: string) {
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
      .setCustomId(`starter_select_${userId}`)
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
      .setCustomId(`menu_back_to_title_${userId}`)
      .setLabel("◀️ Back to Title")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [starterEmbed], components: [starterSelectMenu, backRow] };
}

async function renderBagMessageData(
  client: ExtendedClient,
  userId: string,
  tab: "pokedex" | "starters" | "items" | "records" = "items"
) {
  const profile = saveService.getProfile(userId);
  const user = client.users.cache.get(userId) || (await client.users.fetch(userId).catch(() => null));
  const username = user?.username || "Trainer";

  const imageBuffer = await renderBagScreen({
    username,
    tab,
    unlockedCount: profile.unlockedStartersCount,
    vouchers: profile.vouchers as any,
    stats: { totalRuns: profile.totalRuns, highestWave: profile.highestWave },
  });
  const attachment = new AttachmentBuilder(imageBuffer, { name: "bag.png" });

  const tabRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`bag_tab_items_${userId}`)
      .setLabel("Items 🎟️")
      .setStyle(tab === "items" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bag_tab_starters_${userId}`)
      .setLabel("Pokémon 👾")
      .setStyle(tab === "starters" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bag_tab_pokedex_${userId}`)
      .setLabel("Pokédex 📖")
      .setStyle(tab === "pokedex" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bag_tab_records_${userId}`)
      .setLabel("Records 🏆")
      .setStyle(tab === "records" ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`menu_back_to_title_${userId}`)
      .setLabel("◀️ Back to Title")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [], files: [attachment], components: [tabRow, backRow] };
}

async function renderTitleMessageData(client: ExtendedClient, userId: string) {
  const hasActiveRun = saveService.hasActiveRun(userId);
  const userProfile = saveService.getProfile(userId);

  const user = client.users.cache.get(userId) || (await client.users.fetch(userId).catch(() => null));
  const avatarUrl = user?.displayAvatarURL({ extension: "png", size: 64 });
  const username = user?.username || "Trainer";

  const imageBuffer = await renderTitleScreen({
    username,
    avatarUrl,
    hasActiveRun,
    party: userProfile.activeRun?.party,
  });
  const attachment = new AttachmentBuilder(imageBuffer, { name: "title.png" });

  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  if (hasActiveRun) {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`menu_continue_${userId}`)
        .setLabel("Continue")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`menu_newgame_${userId}`)
        .setLabel("New Game")
        .setStyle(ButtonStyle.Success),
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
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`menu_inventory_${userId}`)
        .setLabel("💼")
        .setStyle(ButtonStyle.Secondary)
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

      const client = interaction.client as ExtendedClient;

      // 2-0. Back to Title Menu
      if (customId.startsWith("menu_back_to_title_")) {
        const titleData = await renderTitleMessageData(client, interaction.user.id);
        await interaction.update(titleData);
        return;
      }

      // 2-0-1. Inventory Bag Button Clicked
      if (customId.startsWith("menu_inventory_")) {
        const bagData = await renderBagMessageData(client, interaction.user.id, "items");
        await interaction.update(bagData);
        return;
      }

      // 2-0-2. Bag Tab Switching
      if (customId.startsWith("bag_tab_")) {
        const tabType = parts[2] as "pokedex" | "starters" | "items" | "records";
        const bagData = await renderBagMessageData(client, interaction.user.id, tabType);
        await interaction.update(bagData);
        return;
      }

      // 2-1. New Game Button Clicked
      if (customId.startsWith("menu_newgame_")) {
        const hasRun = saveService.hasActiveRun(interaction.user.id);
        if (hasRun) {
          // Warning before overwriting active run
          const overwriteEmbed = createBaseEmbed(
            "⚠️ Overwrite Active Run?",
            "You currently have a saved run in progress.\nStarting a new game will **overwrite your current run**.\n\nDo you want to proceed?"
          ).setColor(COLORS.POKEROGUE_RED);

          const overwriteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`newgame_confirmed_${interaction.user.id}`)
              .setLabel("Yes, Start New Game ⚔️")
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`menu_back_to_title_${interaction.user.id}`)
              .setLabel("◀️ Cancel")
              .setStyle(ButtonStyle.Secondary)
          );

          await interaction.update({
            embeds: [overwriteEmbed],
            components: [overwriteRow],
          });
          return;
        }

        const responseData = createStarterSelectMenu(interaction.user.id);
        await interaction.update(responseData);
        return;
      }

      // 2-1-1. New Game Confirmed (Overwrote existing run)
      if (customId.startsWith("newgame_confirmed_")) {
        const responseData = createStarterSelectMenu(interaction.user.id);
        await interaction.update(responseData);
        return;
      }

      // 2-2. Continue Button Clicked -> Directly enter active battle wave!
      if (customId.startsWith("menu_continue_")) {
        const profile = saveService.getProfile(interaction.user.id);
        const activeRun = profile.activeRun;

        if (!activeRun) {
          await interaction.reply({
            content: "No active save data found to continue. Please select 'New Game'.",
            ephemeral: true,
          });
          return;
        }

        const continueEmbed = createBaseEmbed(
          "Resumed Run",
          `• **Biome**: ${activeRun.biome}\n` +
          `• **Current Wave**: Wave ${activeRun.wave}\n` +
          `• **Starter / Lead**: ${activeRun.party[0]?.name || activeRun.starter}\n` +
          `• **Money**: ₩${activeRun.money}\n\n` +
          "Ready for the next battle wave!"
        ).setColor(COLORS.SUCCESS);

        const resumeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`wave_battle_${activeRun.wave}_${interaction.user.id}`)
            .setLabel(`Enter Wave ${activeRun.wave} ⚔️`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`menu_back_to_title_${interaction.user.id}`)
            .setLabel("◀️ Back to Title")
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.update({
          embeds: [continueEmbed],
          components: [resumeRow],
        });
        return;
      }
    }

    // 3. String Select Menu Interactions (Starter Picked)
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;
      if (customId.startsWith("starter_select_")) {
        const selectedSpecies = interaction.values[0];

        // Start new single-session run!
        const newRun = saveService.startNewRun(interaction.user.id, selectedSpecies);

        const runStartedEmbed = createBaseEmbed(
          "🎮 Adventure Begins!",
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
            .setCustomId(`wave_battle_1_${interaction.user.id}`)
            .setLabel("Enter Wave 1 Battle ⚔️")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`menu_back_to_title_${interaction.user.id}`)
            .setLabel("◀️ Title Menu")
            .setStyle(ButtonStyle.Danger)
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
