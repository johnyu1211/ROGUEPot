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

function createStarterSelectMenu(slotId: number, userId: string) {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";

  const starterEmbed = createBaseEmbed(
    isKo ? `[슬롯 ${slotId}] 스타팅 포켓몬 선택` : `[Slot ${slotId}] Choose Your Starter Pokémon`,
    isKo
      ? "포켓로그 모험을 함께할 첫 번째 파트너 포켓몬을 선택하세요!\n\n" +
        "🌱 **이상해씨 (#0001)** - 풀/독 | 코스트: 3 | 밸런스 & 상태이상\n" +
        "🔥 **파이리 (#0004)** - 불꽃 | 코스트: 3 | 강력한 화력 & 공격형\n" +
        "💧 **꼬부기 (#0007)** - 물 | 코스트: 3 | 높은 방어력 & 탱커"
      : "Select your starter Pokémon to begin your PokéRogue adventure!\n\n" +
        "🌱 **Bulbasaur (#0001)** - Grass/Poison | Cost: 3 | Balanced & Status Moves\n" +
        "🔥 **Charmander (#0004)** - Fire | Cost: 3 | High Firepower & Offense\n" +
        "💧 **Squirtle (#0007)** - Water | Cost: 3 | High Defense & Tanky"
  )
    .setColor(COLORS.POKEROGUE_GOLD)
    .setImage("https://play.pokemonshowdown.com/sprites/ani/charmander.gif");

  const starterSelectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`starter_select_${slotId}_${userId}`)
      .setPlaceholder(isKo ? "스타팅 포켓몬을 선택하세요..." : "Select a starter Pokémon...")
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
      .setLabel(isKo ? "◀️ 슬롯 목록으로" : "◀️ Back to Slots")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [starterEmbed], components: [starterSelectMenu, backRow] };
}

function renderSlotsScreenData(userId: string) {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";

  const emptyText = isKo ? "*[ 빈 슬롯 ]*" : "*[ Empty Slot ]*";

  const slotEmbed = createBaseEmbed(
    isKo ? "세이브 슬롯 (3개)" : "Save Slots (3 Slots)",
    (isKo
      ? "플레이할 슬롯을 선택하세요. 빈 슬롯은 새 게임이 시작됩니다.\n\n"
      : "Select a slot below. If empty, you can start a new game in that slot.\n\n") +
      `• **Slot 1**: ${profile.slots[1] ? `Wave ${profile.slots[1]!.wave} (${profile.slots[1]!.starter})` : emptyText}\n` +
      `• **Slot 2**: ${profile.slots[2] ? `Wave ${profile.slots[2]!.wave} (${profile.slots[2]!.starter})` : emptyText}\n` +
      `• **Slot 3**: ${profile.slots[3] ? `Wave ${profile.slots[3]!.wave} (${profile.slots[3]!.starter})` : emptyText}`
  ).setColor(COLORS.POKEROGUE_RED);

  const slotButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`slot_select_1_${userId}`)
      .setLabel("Slot 1 🎮")
      .setStyle(profile.slots[1] ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`slot_select_2_${userId}`)
      .setLabel("Slot 2 🎮")
      .setStyle(profile.slots[2] ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`slot_select_3_${userId}`)
      .setLabel("Slot 3 🎮")
      .setStyle(profile.slots[3] ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`menu_delete_mode_${userId}`)
      .setLabel("🗑️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`menu_back_to_title_${userId}`)
      .setLabel(isKo ? "◀️ 뒤로" : "◀️ Back")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [slotEmbed], components: [slotButtons] };
}

function renderSettingsMessageData(userId: string) {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";

  const settingsEmbed = createBaseEmbed(
    isKo ? "⚙️ 환경 설정 (Settings)" : "⚙️ Game Settings",
    isKo
      ? "게임 플레이 환경과 언어를 설정하세요.\n\n" +
        `• **현재 언어 (Language)**: 🇰🇷 **한국어 (Korean)**\n` +
        `• **버전**: v1.12.1.0\n` +
        "━━━━━━━━━━━━━━━━━━━━━━"
      : "Configure your game preferences and interface language.\n\n" +
        `• **Current Language**: 🌐 **English**\n` +
        `• **Engine Version**: v1.12.1.0\n` +
        "━━━━━━━━━━━━━━━━━━━━━━"
  ).setColor(COLORS.POKEROGUE_GOLD);

  const langRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`settings_lang_en_${userId}`)
      .setLabel("English 🌐")
      .setStyle(!isKo ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`settings_lang_ko_${userId}`)
      .setLabel("한국어 🇰🇷")
      .setStyle(isKo ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`menu_back_to_title_${userId}`)
      .setLabel(isKo ? "◀️ 메인 메뉴로" : "◀️ Back to Title")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [settingsEmbed], components: [langRow, backRow] };
}

async function renderBagMessageData(
  client: ExtendedClient,
  userId: string,
  tab: "pokemon" | "pokedex" | "records" = "pokemon"
) {
  const profile = saveService.getProfile(userId);
  const activeRun = profile.activeSlotId ? profile.slots[profile.activeSlotId] : null;
  const isKo = profile.language === "ko";

  const user = client.users.cache.get(userId) || (await client.users.fetch(userId).catch(() => null));
  const username = user?.username || "Trainer";
  const avatarUrl = user?.displayAvatarURL({ extension: "png", size: 64 });

  const imageBuffer = await renderBagScreen({
    username,
    avatarUrl,
    tab,
    party: activeRun?.party,
    unlockedCount: profile.unlockedStartersCount,
    stats: { totalRuns: profile.totalRuns, highestWave: profile.highestWave },
    lang: profile.language,
  });
  const attachment = new AttachmentBuilder(imageBuffer, { name: "bag.png" });

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  // When POKÉMON tab is selected, render 1~6 Slot selection buttons!
  if (tab === "pokemon") {
    const party = activeRun?.party || [];

    const slotRow1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`bag_slot_1_${userId}`)
        .setLabel(party[0] ? `1. ${party[0].name.split(" ")[0]}` : "1. Empty")
        .setStyle(party[0] ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(!party[0]),
      new ButtonBuilder()
        .setCustomId(`bag_slot_2_${userId}`)
        .setLabel(party[1] ? `2. ${party[1].name.split(" ")[0]}` : "2. Empty")
        .setStyle(party[1] ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(!party[1]),
      new ButtonBuilder()
        .setCustomId(`bag_slot_3_${userId}`)
        .setLabel(party[2] ? `3. ${party[2].name.split(" ")[0]}` : "3. Empty")
        .setStyle(party[2] ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(!party[2])
    );

    const slotRow2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`bag_slot_4_${userId}`)
        .setLabel(party[3] ? `4. ${party[3].name.split(" ")[0]}` : "4. Empty")
        .setStyle(party[3] ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(!party[3]),
      new ButtonBuilder()
        .setCustomId(`bag_slot_5_${userId}`)
        .setLabel(party[4] ? `5. ${party[4].name.split(" ")[0]}` : "5. Empty")
        .setStyle(party[4] ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(!party[4]),
      new ButtonBuilder()
        .setCustomId(`bag_slot_6_${userId}`)
        .setLabel(party[5] ? `6. ${party[5].name.split(" ")[0]}` : "6. Empty")
        .setStyle(party[5] ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(!party[5])
    );

    components.push(slotRow1, slotRow2);
  }

  // Tab navigation row
  const tabRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`bag_tab_pokemon_${userId}`)
      .setLabel(isKo ? "출전 포켓몬 👾" : "Pokémon 👾")
      .setStyle(tab === "pokemon" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bag_tab_pokedex_${userId}`)
      .setLabel(isKo ? "도감 📖" : "Pokédex 📖")
      .setStyle(tab === "pokedex" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bag_tab_records_${userId}`)
      .setLabel(isKo ? "기록 🏆" : "Records 🏆")
      .setStyle(tab === "records" ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`menu_back_to_title_${userId}`)
      .setLabel(isKo ? "◀️ 메인 메뉴로" : "◀️ Back to Title")
      .setStyle(ButtonStyle.Danger)
  );

  components.push(tabRow, backRow);

  return { embeds: [], files: [attachment], components };
}

async function renderTitleMessageData(client: ExtendedClient, userId: string) {
  const hasSavedSlots = saveService.hasAnySavedSlot(userId);
  const userProfile = saveService.getProfile(userId);
  const activeRun = userProfile.activeSlotId ? userProfile.slots[userProfile.activeSlotId] : null;
  const isKo = userProfile.language === "ko";

  const user = client.users.cache.get(userId) || (await client.users.fetch(userId).catch(() => null));
  const avatarUrl = user?.displayAvatarURL({ extension: "png", size: 64 });
  const username = user?.username || "Trainer";

  const imageBuffer = await renderTitleScreen({
    username,
    avatarUrl,
    hasSavedSlots,
    party: activeRun?.party,
    lang: userProfile.language,
  });
  const attachment = new AttachmentBuilder(imageBuffer, { name: "title.png" });

  // ROW 1: Main Game Actions
  const mainActionRow = new ActionRowBuilder<ButtonBuilder>();
  if (hasSavedSlots) {
    mainActionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`menu_continue_${userId}`)
        .setLabel(isKo ? "이어하기" : "Continue")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`menu_newgame_${userId}`)
        .setLabel(isKo ? "새 게임" : "New Game")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`menu_loadgame_${userId}`)
        .setLabel(isKo ? "불러오기" : "Load Game")
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    mainActionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`menu_newgame_${userId}`)
        .setLabel(isKo ? "새 게임" : "New Game")
        .setStyle(ButtonStyle.Success)
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

  return { embeds: [], files: [attachment], components: [mainActionRow, subActionRow] };
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
        const bagData = await renderBagMessageData(client, interaction.user.id, "pokemon");
        await interaction.update(bagData);
        return;
      }

      // 2-0-2. Settings Button Clicked (⚙️)
      if (customId.startsWith("menu_settings_")) {
        const settingsData = renderSettingsMessageData(interaction.user.id);
        await interaction.update(settingsData);
        return;
      }

      // 2-0-3. Switch Language (English / 한국어)
      if (customId.startsWith("settings_lang_")) {
        const lang = parts[2] as "en" | "ko";
        saveService.setLanguage(interaction.user.id, lang);

        const settingsData = renderSettingsMessageData(interaction.user.id);
        await interaction.update(settingsData);
        return;
      }

      // 2-0-4. Bag Tab Switching
      if (customId.startsWith("bag_tab_")) {
        const tabType = parts[2] as "pokemon" | "pokedex" | "records";
        const bagData = await renderBagMessageData(client, interaction.user.id, tabType);
        await interaction.update(bagData);
        return;
      }

      // 2-0-5. Bag Specific Pokemon Slot Inspected (Slot 1~6)
      if (customId.startsWith("bag_slot_")) {
        const slotIdx = parseInt(parts[2], 10) - 1;
        const profile = saveService.getProfile(interaction.user.id);
        const activeRun = profile.activeSlotId ? profile.slots[profile.activeSlotId] : null;
        const isKo = profile.language === "ko";

        const pokemon = activeRun?.party[slotIdx];
        if (!pokemon) {
          await interaction.reply({
            content: isKo ? "해당 슬롯은 비어있습니다." : "This slot is empty.",
            ephemeral: true,
          });
          return;
        }

        const detailEmbed = createBaseEmbed(
          isKo ? `[슬롯 ${slotIdx + 1}] ${pokemon.name} 상세 정보` : `[Slot ${slotIdx + 1}] ${pokemon.name} Details`,
          isKo
            ? `• **레벨**: Lv.${pokemon.level}\n` +
              `• **체력 (HP)**: ${pokemon.hp} / ${pokemon.maxHp}\n` +
              `• **보유 기술**: ${pokemon.moves?.join(", ") || "몸통박치기, 울음소리"}\n` +
              `• **특성**: 심록 / 맹화 / 급류\n`
            : `• **Level**: Lv.${pokemon.level}\n` +
              `• **HP**: ${pokemon.hp} / ${pokemon.maxHp}\n` +
              `• **Moves**: ${pokemon.moves?.join(", ") || "Tackle, Growl"}\n` +
              `• **Ability**: Standard Starter Ability\n`
        )
          .setColor(COLORS.POKEROGUE_GOLD)
          .setImage(`https://play.pokemonshowdown.com/sprites/ani/${pokemon.speciesId}.gif`);

        await interaction.reply({
          embeds: [detailEmbed],
          ephemeral: true,
        });
        return;
      }

      // 2-1. New Game Button Clicked
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

        const isKo = profile.language === "ko";

        const continueEmbed = createBaseEmbed(
          isKo ? `이어서 하기 - 슬롯 #${profile.activeSlotId}` : `Resumed Run - Slot #${profile.activeSlotId}`,
          isKo
            ? `• **바이옴**: ${activeRun.biome}\n` +
              `• **현재 웨이브**: Wave ${activeRun.wave}\n` +
              `• **선두 포켓몬**: ${activeRun.party[0]?.name || activeRun.starter}\n` +
              `• **소지금**: ₩${activeRun.money}\n\n` +
              "다음 전투 웨이브로 진입할 준비가 되었습니다!"
            : `• **Biome**: ${activeRun.biome}\n` +
              `• **Current Wave**: Wave ${activeRun.wave}\n` +
              `• **Starter / Lead**: ${activeRun.party[0]?.name || activeRun.starter}\n` +
              `• **Money**: ₩${activeRun.money}\n\n` +
              "Ready for the next battle wave!"
        ).setColor(COLORS.SUCCESS);

        const resumeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`wave_battle_${profile.activeSlotId}_${activeRun.wave}_${interaction.user.id}`)
            .setLabel(isKo ? `Wave ${activeRun.wave} 진입 ⚔️` : `Enter Wave ${activeRun.wave} ⚔️`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`menu_back_to_title_${interaction.user.id}`)
            .setLabel(isKo ? "◀️ 메인 메뉴로" : "◀️ Back to Title")
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.update({
          embeds: [continueEmbed],
          components: [resumeRow],
        });
        return;
      }

      // 2-3. Load Game Button Clicked
      if (customId.startsWith("menu_loadgame_")) {
        const screenData = renderSlotsScreenData(interaction.user.id);
        await interaction.update(screenData);
        return;
      }

      // 2-4. Trash / Delete Mode Clicked
      if (customId.startsWith("menu_delete_mode_")) {
        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        const deleteEmbed = createBaseEmbed(
          isKo ? "🗑️ 세이브 슬롯 삭제" : "🗑️ Delete Save Slot",
          (isKo
            ? "영구적으로 **삭제할 슬롯을 선택**하세요.\n*(주의: 삭제 후 복구할 수 없습니다)*\n\n"
            : "Select the slot you want to **permanently delete**.\n*(Note: This action cannot be undone)*\n\n") +
            `• **Slot 1**: ${profile.slots[1] ? `Wave ${profile.slots[1]!.wave} (${profile.slots[1]!.starter})` : "*[ Empty ]*"}\n` +
            `• **Slot 2**: ${profile.slots[2] ? `Wave ${profile.slots[2]!.wave} (${profile.slots[2]!.starter})` : "*[ Empty ]*"}\n` +
            `• **Slot 3**: ${profile.slots[3] ? `Wave ${profile.slots[3]!.wave} (${profile.slots[3]!.starter})` : "*[ Empty ]*"}`
        ).setColor(COLORS.POKEROGUE_RED);

        const deleteButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`slot_delete_confirm_1_${interaction.user.id}`)
            .setLabel(isKo ? "슬롯 1 삭제 🗑️" : "Delete Slot 1 🗑️")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!profile.slots[1]),
          new ButtonBuilder()
            .setCustomId(`slot_delete_confirm_2_${interaction.user.id}`)
            .setLabel(isKo ? "슬롯 2 삭제 🗑️" : "Delete Slot 2 🗑️")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!profile.slots[2]),
          new ButtonBuilder()
            .setCustomId(`slot_delete_confirm_3_${interaction.user.id}`)
            .setLabel(isKo ? "슬롯 3 삭제 🗑️" : "Delete Slot 3 🗑️")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!profile.slots[3]),
          new ButtonBuilder()
            .setCustomId(`menu_loadgame_${interaction.user.id}`)
            .setLabel(isKo ? "◀️ 취소" : "◀️ Cancel")
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.update({
          embeds: [deleteEmbed],
          components: [deleteButtons],
        });
        return;
      }

      // 2-5. Slot Delete Confirmed
      if (customId.startsWith("slot_delete_confirm_")) {
        const slotNum = parseInt(parts[3], 10) || 1;
        saveService.deleteSlot(interaction.user.id, slotNum);

        const screenData = renderSlotsScreenData(interaction.user.id);
        await interaction.update(screenData);
        return;
      }

      // 2-6. Specific Slot Selected (Slot 1, 2, 3)
      if (customId.startsWith("slot_select_")) {
        const slotNum = parseInt(parts[2], 10) || 1;
        const profile = saveService.getProfile(interaction.user.id);
        const slotData = profile.slots[slotNum];
        const isKo = profile.language === "ko";

        if (!slotData) {
          const responseData = createStarterSelectMenu(slotNum, interaction.user.id);
          await interaction.update(responseData);
        } else {
          const existingSlotEmbed = createBaseEmbed(
            isKo ? `슬롯 #${slotNum} 상세 정보` : `Slot #${slotNum} Details`,
            (isKo
              ? `• **스타팅**: ${slotData.party[0]?.name || slotData.starter}\n` +
                `• **웨이브**: Wave ${slotData.wave}\n` +
                `• **바이옴**: ${slotData.biome}\n` +
                `• **저장 시간**: ${new Date(slotData.updatedAt).toLocaleString()}\n\n` +
                "이 슬롯을 이어서 플레이하시겠습니까, 아니면 덮어쓰고 새로 시작하시겠습니까?"
              : `• **Starter**: ${slotData.party[0]?.name || slotData.starter}\n` +
                `• **Wave**: Wave ${slotData.wave}\n` +
                `• **Biome**: ${slotData.biome}\n` +
                `• **Saved At**: ${new Date(slotData.updatedAt).toLocaleString()}\n\n` +
                "Would you like to resume this run or overwrite it with a new game?")
          ).setColor(COLORS.POKEROGUE_RED);

          const slotActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`slot_resume_${slotNum}_${interaction.user.id}`)
              .setLabel(isKo ? `슬롯 #${slotNum} 이어하기 ▶️` : `Resume Slot #${slotNum} ▶️`)
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`slot_overwrite_${slotNum}_${interaction.user.id}`)
              .setLabel(isKo ? `덮어쓰기 (새 게임) ⚠️` : `Overwrite (New Game) ⚠️`)
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`menu_loadgame_${interaction.user.id}`)
              .setLabel(isKo ? "◀️ 뒤로" : "◀️ Back")
              .setStyle(ButtonStyle.Secondary)
          );

          await interaction.update({
            embeds: [existingSlotEmbed],
            components: [slotActionRow],
          });
        }
        return;
      }

      // 2-7. Resume Existing Slot
      if (customId.startsWith("slot_resume_")) {
        const slotNum = parseInt(parts[2], 10) || 1;
        saveService.setActiveSlot(interaction.user.id, slotNum);
        const profile = saveService.getProfile(interaction.user.id);
        const activeRun = profile.slots[slotNum]!;
        const isKo = profile.language === "ko";

        const resumedEmbed = createBaseEmbed(
          isKo ? `슬롯 #${slotNum} 이어하기` : `Resumed Slot #${slotNum}`,
          isKo
            ? `Wave ${activeRun.wave} (${activeRun.biome}) 모험을 재개합니다!\n\n` +
              `• **선두 포켓몬**: ${activeRun.party[0]?.name || activeRun.starter}\n` +
              `• **소지금**: ₩${activeRun.money}`
            : `Resumed your run on Wave ${activeRun.wave} (${activeRun.biome})!\n\n` +
              `• **Leader**: ${activeRun.party[0]?.name || activeRun.starter}\n` +
              `• **Money**: ₩${activeRun.money}`
        ).setColor(COLORS.SUCCESS);

        const resumeActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`wave_battle_${slotNum}_${activeRun.wave}_${interaction.user.id}`)
            .setLabel(isKo ? `Wave ${activeRun.wave} 진입 ⚔️` : `Enter Wave ${activeRun.wave} ⚔️`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`menu_back_to_title_${interaction.user.id}`)
            .setLabel(isKo ? "◀️ 메인 메뉴로" : "◀️ Back to Title")
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.update({
          embeds: [resumedEmbed],
          components: [resumeActionRow],
        });
        return;
      }

      // 2-8. Overwrite Slot
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

        const newRun = saveService.startNewRun(interaction.user.id, slotNum, selectedSpecies);
        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        const runStartedEmbed = createBaseEmbed(
          isKo ? `🎮 슬롯 #${slotNum}에서 모험 시작!` : `🎮 Adventure Begins in Slot #${slotNum}!`,
          isKo
            ? `첫 파트너로 **${newRun.party[0].name}**을(를) 선택하셨습니다!\n\n` +
              `• **출발 바이옴**: ${newRun.biome}\n` +
              `• **시작 웨이브**: Wave 1\n` +
              `• **초기 자금**: ₩${newRun.money}\n\n` +
              "지금 포켓로그의 여정을 시작하세요!"
            : `You chose **${newRun.party[0].name}** as your starter!\n\n` +
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
            .setLabel(isKo ? "Wave 1 배틀 시작 ⚔️" : "Enter Wave 1 Battle ⚔️")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`menu_back_to_title_${interaction.user.id}`)
            .setLabel(isKo ? "◀️ 메인 메뉴" : "◀️ Title Menu")
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
