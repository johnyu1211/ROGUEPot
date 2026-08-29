import {
  Events,
  Interaction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import { BotEvent, ExtendedClient } from "../types/index.js";
import { createBaseEmbed, COLORS } from "../utils/embed.js";
import { renderTitleScreen, renderBagScreen, renderMultiplayerScreen, renderPokedexScreen } from "../utils/canvasRenderer.js";
import { saveService, PartyPokemon } from "../services/saveService.js";
import { getPokemonByQuery, getPokemonByDexNumber, getPokemonPage, getAbilityKoreanName, getAbilityDetail } from "../services/pokeApiService.js";

function createStarterSelectMenu(slotId: number, userId: string, fromSource: "title" | "slots" = "title") {
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

  const backCustomId = fromSource === "title" ? `menu_back_to_title_${userId}` : `menu_loadgame_${userId}`;

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(backCustomId)
      .setLabel("↩️")
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
      .setLabel("↩️")
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
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "**출처 및 크레딧 (Credits & Sources)**\n" +
        "• **PokéRogue**: PageFaultGames\n" +
        "• **Sprites**: [Showdown](https://pokemonshowdown.com/) & [PMD SpriteCollab](https://sprites.pmdcollab.org/)\n" +
        "• **Data**: [PokéAPI](https://pokeapi.co/)"
      : "Configure your game preferences and interface language.\n\n" +
        `• **Current Language**: 🌐 **English**\n` +
        `• **Engine Version**: v1.12.1.0\n` +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "**Credits & Sources**\n" +
        "• **PokéRogue**: PageFaultGames\n" +
        "• **Sprites**: [Showdown](https://pokemonshowdown.com/) & [PMD SpriteCollab](https://sprites.pmdcollab.org/)\n" +
        "• **Data**: [PokéAPI](https://pokeapi.co/)"
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
      .setLabel("↩️")
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

  // When POKÉMON tab is selected, render 2x3 Slot buttons matching the canvas grid!
  if (tab === "pokemon") {
    const party = activeRun?.party || [];

    // ROW 1: Slots 1 & 2
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
        .setDisabled(!party[1])
    );

    // ROW 2: Slots 3 & 4
    const slotRow2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`bag_slot_3_${userId}`)
        .setLabel(party[2] ? `3. ${party[2].name.split(" ")[0]}` : "3. Empty")
        .setStyle(party[2] ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(!party[2]),
      new ButtonBuilder()
        .setCustomId(`bag_slot_4_${userId}`)
        .setLabel(party[3] ? `4. ${party[3].name.split(" ")[0]}` : "4. Empty")
        .setStyle(party[3] ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(!party[3])
    );

    // ROW 3: Slots 5 & 6
    const slotRow3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

    components.push(slotRow1, slotRow2, slotRow3);
  }

  // ROW 4 (or Row 1 on other tabs): Tab Navigation
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

  // ROW 5 (or Row 2 on other tabs): Back to Title
  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`menu_back_to_title_${userId}`)
      .setLabel("↩️")
      .setStyle(ButtonStyle.Danger)
  );

  components.push(tabRow, backRow);

  return { embeds: [], files: [attachment], components };
}

async function renderMultiplayerMessageData(client: ExtendedClient, userId: string) {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";

  const user = client.users.cache.get(userId) || (await client.users.fetch(userId).catch(() => null));
  const username = user?.username || "Trainer";
  const avatarUrl = user?.displayAvatarURL({ extension: "png", size: 64 });

  const imageBuffer = await renderMultiplayerScreen({
    username,
    avatarUrl,
    party: profile.multiplayerTeam,
    lang: profile.language,
  });
  const attachment = new AttachmentBuilder(imageBuffer, { name: "multiplay.png" });

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`multi_register_btn_${userId}`)
      .setLabel(isKo ? "포켓몬 등록" : "Register Pokémon")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`multi_pokedex_btn_${userId}`)
      .setLabel(isKo ? "도감" : "Pokédex")
      .setStyle(ButtonStyle.Primary)
  );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`menu_back_to_title_${userId}`)
      .setLabel("↩️")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [], files: [attachment], components: [actionRow, backRow] };
}

const POKEDEX_REGIONS = [
  { id: "kanto", nameKo: "🌱 1세대 관동 (Kanto)", nameEn: "🌱 Gen 1: Kanto", startDex: 1, page: 1, descKo: "#001 ~ #151 (이상해씨 ~ 뮤)", descEn: "#001 ~ #151 (Bulbasaur ~ Mew)" },
  { id: "johto", nameKo: "🏯 2세대 성도 (Johto)", nameEn: "🏯 Gen 2: Johto", startDex: 152, page: 20, descKo: "#152 ~ #251 (치코리타 ~ 세레비)", descEn: "#152 ~ #251 (Chikorita ~ Celebi)" },
  { id: "hoenn", nameKo: "☄️ 3세대 호연 (Hoenn)", nameEn: "☄️ Gen 3: Hoenn", startDex: 252, page: 33, descKo: "#252 ~ #386 (나무지기 ~ 테오키스)", descEn: "#252 ~ #386 (Treecko ~ Deoxys)" },
  { id: "sinnoh", nameKo: "🏛️ 4세대 신오 (Sinnoh)", nameEn: "🏛️ Gen 4: Sinnoh", startDex: 387, page: 50, descKo: "#387 ~ #493 (모부기 ~ 아르세우스)", descEn: "#387 ~ #493 (Turtwig ~ Arceus)" },
  { id: "unova", nameKo: "☯︎ 5세대 하나 (Unova)", nameEn: "☯︎ Gen 5: Unova", startDex: 494, page: 63, descKo: "#494 ~ #649 (비크티니 ~ 게노세크트)", descEn: "#494 ~ #649 (Victini ~ Genesect)" },
  { id: "kalos", nameKo: "✨ 6세대 칼로스 (Kalos)", nameEn: "✨ Gen 6: Kalos", startDex: 650, page: 82, descKo: "#650 ~ #721 (도치마론 ~ 볼케니온)", descEn: "#650 ~ #721 (Chespin ~ Volcanion)" },
  { id: "alola", nameKo: "🏝️ 7세대 알로라 (Alola)", nameEn: "🏝️ Gen 7: Alola", startDex: 722, page: 91, descKo: "#722 ~ #809 (나몰빼미 ~ 멜메탈)", descEn: "#722 ~ #809 (Rowlet ~ Melmetal)" },
  { id: "galar", nameKo: "⚔️ 8세대 가라르/히스이 (Galar)", nameEn: "⚔️ Gen 8: Galar/Hisui", startDex: 810, page: 102, descKo: "#810 ~ #905 (흥나숭 ~ 러브로스)", descEn: "#810 ~ #905 (Grookey ~ Enamorus)" },
  { id: "paldea", nameKo: "💎 9세대 팔데아 (Paldea)", nameEn: "💎 Gen 9: Paldea", startDex: 906, page: 114, descKo: "#906 ~ #1025 (나오하 ~ 복숭악귀)", descEn: "#906 ~ #1025 (Sprigatito ~ Pecharunt)" },
];

function createPokedexRegionSelectMenu(fromScreen: "multiplay" | "inventory" | "title", userId: string, isKo: boolean) {
  const embed = createBaseEmbed(
    isKo ? "🗺️ 탐색할 지방(세대)을 선택하세요" : "🗺️ Select a Pokémon Region (Generation)",
    isKo
      ? "이동하고 싶은 포켓몬 세대 / 지방을 선택하면 해당 도감 페이지로 즉시 점프합니다!"
      : "Choose a Generation / Region to jump directly to its Pokédex section!"
  ).setColor(COLORS.POKEROGUE_GOLD);

  const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`pokedex_region_select_${fromScreen}_${userId}`)
      .setPlaceholder(isKo ? "탐색할 지방을 선택하세요..." : "Select a region...")
      .addOptions(
        POKEDEX_REGIONS.map((reg) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(isKo ? reg.nameKo : reg.nameEn)
            .setDescription(isKo ? reg.descKo : reg.descEn)
            .setValue(`${reg.startDex}_${reg.page}`)
        )
      )
  );

  const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`pokedex_page_1_1_${fromScreen}_${userId}`)
      .setLabel("↩️")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], files: [], components: [selectMenu, cancelRow] };
}

async function renderPokedexMessageData(
  client: ExtendedClient,
  userId: string,
  selectedDexNo: number = 1,
  page: number = 1,
  fromScreen: "multiplay" | "inventory" | "title" = "title",
  activeAbility?: string
) {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";

  // Full 8 Pokémon per page (2 Columns x 4 Rows)
  const { total, totalPages, items } = await getPokemonPage(page, 8);

  let selectedPokemon = items.find((p) => p.dexNumber === selectedDexNo);
  if (!selectedPokemon) {
    selectedPokemon = (await getPokemonByDexNumber(selectedDexNo)) || items[0] || null;
  }

  const imageBuffer = await renderPokedexScreen({
    selectedPokemon,
    pageList: items,
    currentPage: page,
    totalPages,
    activeAbility,
    lang: profile.language,
  });
  const attachment = new AttachmentBuilder(imageBuffer, { name: "pokedex.png" });

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  // ROW 1: Ability Buttons (선택된 특성은 Primary 파란색, 다른 특성은 Secondary 회색)
  const abilityButtons: ButtonBuilder[] = [];
  if (selectedPokemon) {
    const regularEn = selectedPokemon.regularAbilities || (selectedPokemon.primaryAbility ? [selectedPokemon.primaryAbility] : []);
    const regularKo = selectedPokemon.regularAbilitiesKo || [];

    regularEn.forEach((ab, idx) => {
      const abName = isKo ? (regularKo[idx] || getAbilityKoreanName(ab)) : ab;
      const isSelectedAbility = !!activeAbility && activeAbility.toLowerCase() === ab.toLowerCase();
      // Pass encoded activeAbility or 'none' in action for toggling
      const nextAbilityParam = isSelectedAbility ? "none" : encodeURIComponent(ab);
      abilityButtons.push(
        new ButtonBuilder()
          .setCustomId(`pokedex_ability_reg_${nextAbilityParam}_${selectedPokemon.dexNumber}_${page}_${fromScreen}_${userId}`)
          .setLabel(isKo ? `특성: ${abName}` : `Ability: ${abName}`)
          .setStyle(isSelectedAbility ? ButtonStyle.Primary : ButtonStyle.Secondary)
      );
    });

    if (selectedPokemon.hiddenAbility) {
      const haName = isKo
        ? (selectedPokemon.hiddenAbilityKo || getAbilityKoreanName(selectedPokemon.hiddenAbility))
        : selectedPokemon.hiddenAbility;
      const isSelectedHa = !!activeAbility && activeAbility.toLowerCase() === selectedPokemon.hiddenAbility.toLowerCase();
      const nextHaParam = isSelectedHa ? "none" : encodeURIComponent(selectedPokemon.hiddenAbility);
      abilityButtons.push(
        new ButtonBuilder()
          .setCustomId(`pokedex_ability_ha_${nextHaParam}_${selectedPokemon.dexNumber}_${page}_${fromScreen}_${userId}`)
          .setLabel(isKo ? `숨특: ${haName}` : `HA: ${haName}`)
          .setStyle(isSelectedHa ? ButtonStyle.Primary : ButtonStyle.Secondary)
      );
    }
  }

  // ROW 1: Abilities (1~3)
  if (abilityButtons.length > 0) {
    components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(abilityButtons.slice(0, 5)));
  }

  // Helper to create pokemon button
  const createPokeBtn = (p: typeof items[0], idx: number) => {
    if (!p) return null;
    const isSelected = selectedPokemon && selectedPokemon.dexNumber === p.dexNumber;
    return new ButtonBuilder()
      .setCustomId(`pokedex_select_${p.dexNumber}_${page}_${fromScreen}_${userId}`)
      .setLabel(`${idx + 1}`)
      .setStyle(isSelected ? ButtonStyle.Primary : ButtonStyle.Secondary);
  };

  // ROW 2: Pokemon 1, 2 + [+📦] + [+💼]
  const row2Btns = [createPokeBtn(items[0], 0), createPokeBtn(items[1], 1)].filter(Boolean) as ButtonBuilder[];
  if (selectedPokemon) {
    row2Btns.push(
      new ButtonBuilder()
        .setCustomId(`pokedex_add_multi_${selectedPokemon.dexNumber}_${page}_${fromScreen}_${userId}`)
        .setLabel("\u2800+📦\u2800")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`pokedex_add_bag_${selectedPokemon.dexNumber}_${page}_${fromScreen}_${userId}`)
        .setLabel("\u2800+💼\u2800")
        .setStyle(ButtonStyle.Success)
    );
  }
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row2Btns));

  // ROW 3: Pokemon 3, 4 + Blue Region Jump [🗺️] + Blue Search [🔍]
  const row3Btns = [createPokeBtn(items[2], 2), createPokeBtn(items[3], 3)].filter(Boolean) as ButtonBuilder[];
  row3Btns.push(
    new ButtonBuilder()
      .setCustomId(`pokedex_region_btn_${fromScreen}_${userId}`)
      .setLabel("\u3000🗺️\u3000")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`pokedex_search_btn_${fromScreen}_${userId}`)
      .setLabel("\u3000🔍\u3000")
      .setStyle(ButtonStyle.Primary)
  );
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row3Btns));

  // ROW 4: Pokemon 5, 6 + Fast Backward 3 Pages [ ◀◀◀ ] + Fast Forward 3 Pages [ ▶▶▶ ]
  const row4Btns = [createPokeBtn(items[4], 4), createPokeBtn(items[5], 5)].filter(Boolean) as ButtonBuilder[];
  row4Btns.push(
    new ButtonBuilder()
      .setCustomId(`pokedex_jumpback_${Math.max(1, page - 3)}_${selectedDexNo}_${fromScreen}_${userId}`)
      .setLabel("\u2800◀◀◀\u2800")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`pokedex_jumpfwd_${Math.min(totalPages, page + 3)}_${selectedDexNo}_${fromScreen}_${userId}`)
      .setLabel("\u2800▶▶▶\u2800")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row4Btns));

  // ROW 5: Pokemon 7, 8 + [ \u3000◀ ] + [ ▶\u3000 ] + [ ↩️ ]
  const lastRowBtns: ButtonBuilder[] = [];
  const btn7 = createPokeBtn(items[6], 6);
  const btn8 = createPokeBtn(items[7], 7);
  if (btn7) lastRowBtns.push(btn7);
  if (btn8) lastRowBtns.push(btn8);

  lastRowBtns.push(
    new ButtonBuilder()
      .setCustomId(`pokedex_pageprev_${Math.max(1, page - 1)}_${selectedDexNo}_${fromScreen}_${userId}`)
      .setLabel("\u3000\u3000◀")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`pokedex_pagenext_${Math.min(totalPages, page + 1)}_${selectedDexNo}_${fromScreen}_${userId}`)
      .setLabel("▶\u3000\u3000")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages),
    new ButtonBuilder()
      .setCustomId(`pokedex_back_${fromScreen}_${userId}`)
      .setLabel("↩️")
      .setStyle(ButtonStyle.Danger)
  );
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(lastRowBtns.slice(0, 5)));

  return { embeds: [], files: [attachment], attachments: [], components };
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

    // 2. Modal Submits (Multiplayer Pokemon Registration - Auto Sequential Slots)
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("multi_reg_modal_")) {
        const dexInput = interaction.fields.getTextInputValue("dex_no_input");
        const nicknameInput = interaction.fields.getTextInputValue("nickname_input")?.trim();

        const query = dexInput.trim();
        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        if (!query) {
          await interaction.reply({
            content: isKo ? "❌ 포켓몬 도감 번호 또는 이름을 입력해주세요." : "❌ Please enter a Pokémon Dex number or name.",
            ephemeral: true,
          });
          return;
        }

        await interaction.deferUpdate();

        const pokeInfo = await getPokemonByQuery(query);
        if (!pokeInfo) {
          await interaction.followUp({
            content: isKo ? `❌ '${query}'에 해당하는 포켓몬을 찾을 수 없습니다.` : `❌ Could not find Pokémon for '${query}'.`,
            ephemeral: true,
          });
          return;
        }

        const newPokemon: PartyPokemon = {
          speciesId: pokeInfo.speciesId,
          name: nicknameInput || pokeInfo.name,
          nickname: nicknameInput || undefined,
          level: 50,
          hp: pokeInfo.hp,
          maxHp: pokeInfo.hp,
          ivs: {
            hp: 31,
            atk: 31,
            def: 31,
            spa: 31,
            spd: 31,
            spe: 31,
          },
          moves: ["Tackle", "Signature Move"],
        };

        const result = saveService.addMultiplayerPokemon(interaction.user.id, newPokemon);
        if (!result.success) {
          await interaction.followUp({
            content: isKo
              ? "❌ 멀티플레이 6개 엔트리가 이미 꽉 찼습니다! (전체 6마리 완성)"
              : "❌ All 6 Battle Roster slots are already filled!",
            ephemeral: true,
          });
          return;
        }

        const client = interaction.client as ExtendedClient;
        const updatedData = await renderMultiplayerMessageData(client, interaction.user.id);
        await interaction.editReply(updatedData);
        return;
      }

      // 1-2. Pokédex Search Modal Submit
      if (interaction.customId.startsWith("pokedex_search_modal_")) {
        const query = interaction.fields.getTextInputValue("pokedex_search_input")?.trim();
        const parts = interaction.customId.split("_");
        const fromScreen = (parts[3] || "title") as "multiplay" | "inventory" | "title";
        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        if (!query) {
          await interaction.reply({
            content: isKo ? "❌ 검색할 포켓몬 도감 번호 또는 이름을 입력해주세요." : "❌ Please enter a Pokémon Dex number or name.",
            ephemeral: true,
          });
          return;
        }

        await interaction.deferUpdate().catch(() => null);

        const pokeInfo = await getPokemonByQuery(query);
        if (!pokeInfo) {
          await interaction.followUp({
            content: isKo ? `❌ '${query}'에 해당하는 포켓몬을 찾을 수 없습니다.` : `❌ Could not find Pokémon for '${query}'.`,
            ephemeral: true,
          });
          return;
        }

        const targetDexNo = pokeInfo.dexNumber;
        const targetPage = Math.ceil(targetDexNo / 8);
        const client = interaction.client as ExtendedClient;

        const dexData = await renderPokedexMessageData(client, interaction.user.id, targetDexNo, targetPage, fromScreen);
        await interaction.editReply(dexData).catch(async () => {
          await interaction.followUp(dexData).catch(() => null);
        });
        return;
      }
    }

    // 3. Button Interactions
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

      // 3-0. Back to Title Menu
      if (customId.startsWith("menu_back_to_title_")) {
        const titleData = await renderTitleMessageData(client, interaction.user.id);
        await interaction.update(titleData);
        return;
      }

      // 3-0-1. Inventory Bag Button Clicked
      if (customId.startsWith("menu_inventory_")) {
        const bagData = await renderBagMessageData(client, interaction.user.id, "pokemon");
        await interaction.update(bagData);
        return;
      }

      // 3-0-2. Settings Button Clicked (⚙️)
      if (customId.startsWith("menu_settings_")) {
        const settingsData = renderSettingsMessageData(interaction.user.id);
        await interaction.update(settingsData);
        return;
      }

      // 3-0-3. Switch Language (English / 한국어)
      if (customId.startsWith("settings_lang_")) {
        const lang = parts[2] as "en" | "ko";
        saveService.setLanguage(interaction.user.id, lang);

        const settingsData = renderSettingsMessageData(interaction.user.id);
        await interaction.update(settingsData);
        return;
      }

      // 3-0-4. Multiplay Button Clicked
      if (customId.startsWith("menu_multiplay_")) {
        const multiData = await renderMultiplayerMessageData(client, interaction.user.id);
        await interaction.update(multiData);
        return;
      }

      // 3-0-5. Multiplayer Register Pokemon Button (Open Modal)
      if (customId.startsWith("multi_register_btn_")) {
        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        const modal = new ModalBuilder()
          .setCustomId(`multi_reg_modal_${interaction.user.id}`)
          .setTitle(isKo ? "포켓몬 엔트리 등록" : "Register Battle Pokémon");

        const dexInput = new TextInputBuilder()
          .setCustomId("dex_no_input")
          .setLabel(isKo ? "포켓몬 이름 또는 도감 번호" : "Pokémon Name or Dex Number")
          .setPlaceholder(isKo ? "예: 샤미드, 루카리오, 피카츄, 25, 491" : "e.g. Vaporeon, Lucario, Pikachu, 25, 491")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(20);

        const nicknameInput = new TextInputBuilder()
          .setCustomId("nickname_input")
          .setLabel(isKo ? "포켓몬 별명 (선택)" : "Nickname (Optional)")
          .setPlaceholder(isKo ? "예: 메가뿅, 에비뿅, 파라뿅" : "e.g. Megaree, Hitmee, Parasee")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(12);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(dexInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(nicknameInput)
        );

        await interaction.showModal(modal);
        return;
      }

      // 3-0-6. Multiplayer Pokédex Button Clicked (Opens Unified Pokédex with fromScreen='multiplay')
      if (customId.startsWith("multi_pokedex_btn_")) {
        await interaction.deferUpdate().catch(() => null);
        try {
          const dexData = await renderPokedexMessageData(client, interaction.user.id, 1, 1, "multiplay");
          await interaction.editReply(dexData);
        } catch (err) {
          console.error("[POKEDEX] Error rendering pokedex from multiplay:", err);
        }
        return;
      }

      // 3-0-6-B. Pokédex Ability Info Button Clicked (Switch Active Ability Dialog on Canvas / Toggle)
      if (customId.startsWith("pokedex_ability_")) {
        await interaction.deferUpdate().catch(() => null);
        try {
          const rawAbilityParam = parts[3] || "none";
          const rawAbility = rawAbilityParam === "none" ? undefined : decodeURIComponent(rawAbilityParam);
          const dexNo = parseInt(parts[4], 10) || 1;
          const page = parseInt(parts[5], 10) || 1;
          const fromScreen = (parts[6] || "title") as "multiplay" | "inventory" | "title";

          const dexData = await renderPokedexMessageData(client, interaction.user.id, dexNo, page, fromScreen, rawAbility);
          await interaction.editReply(dexData);
        } catch (err) {
          console.error("[POKEDEX] Error switching ability on canvas:", err);
        }
        return;
      }

      // 3-0-7. Pokédex Select Pokémon (Resets ability to idle/unselected)
      if (customId.startsWith("pokedex_select_")) {
        await interaction.deferUpdate().catch(() => null);
        try {
          const dexNo = parseInt(parts[2], 10) || 1;
          const page = parseInt(parts[3], 10) || 1;
          const fromScreen = (parts[4] || "title") as "multiplay" | "inventory" | "title";

          const dexData = await renderPokedexMessageData(client, interaction.user.id, dexNo, page, fromScreen, undefined);
          await interaction.editReply(dexData);
        } catch (err) {
          console.error("[POKEDEX] Error selecting pokemon in pokedex:", err);
        }
        return;
      }

      // 3-0-8. Pokédex Page Switch (Prev / Next / Jump) (Resets ability to idle/unselected)
      if (
        customId.startsWith("pokedex_page_") ||
        customId.startsWith("pokedex_pageprev_") ||
        customId.startsWith("pokedex_pagenext_") ||
        customId.startsWith("pokedex_jumpback_") ||
        customId.startsWith("pokedex_jumpfwd_")
      ) {
        await interaction.deferUpdate().catch(() => null);
        try {
          const targetPage = parseInt(parts[2], 10) || 1;
          const currentDexNo = parseInt(parts[3], 10) || ((targetPage - 1) * 8 + 1);
          const fromScreen = (parts[4] || "title") as "multiplay" | "inventory" | "title";

          const dexData = await renderPokedexMessageData(client, interaction.user.id, currentDexNo, targetPage, fromScreen, undefined);
          await interaction.editReply(dexData);
        } catch (err) {
          console.error("[POKEDEX] Error switching page in pokedex:", err);
        }
        return;
      }

      // 3-0-8-A. Pokédex Add to Multiplayer Team (+박스)
      if (customId.startsWith("pokedex_add_multi_")) {
        const dexNo = parseInt(parts[3], 10) || 1;
        const poke = await getPokemonByDexNumber(dexNo);
        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        if (poke) {
          const pokeName = (isKo && poke.koreanName) ? poke.koreanName : poke.name;
          const partyPoke: PartyPokemon = {
            speciesId: poke.speciesId,
            name: pokeName,
            level: 50,
            hp: poke.hp * 2 + 110,
            maxHp: poke.hp * 2 + 110,
            moves: ["Tackle", "Quick Attack"],
          };
          const result = saveService.addMultiplayerPokemon(interaction.user.id, partyPoke);
          if (result.success) {
            await interaction.reply({
              content: isKo
                ? `✅ **${pokeName}**(을)를 멀티플레이 박스(슬롯 ${result.slotIndex + 1})에 등록했습니다!`
                : `✅ Added **${pokeName}** to Multiplayer Box (Slot ${result.slotIndex + 1})!`,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: isKo
                ? "❌ 멀티플레이 박스 6마리 엔트리가 이미 가득 찼습니다!"
                : "❌ Multiplayer box is already full (6/6)!",
              ephemeral: true,
            });
          }
        }
        return;
      }

      // 3-0-8-B. Pokédex Add to Adventure Party (+가방)
      if (customId.startsWith("pokedex_add_bag_")) {
        const dexNo = parseInt(parts[3], 10) || 1;
        const poke = await getPokemonByDexNumber(dexNo);
        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        if (poke) {
          const pokeName = (isKo && poke.koreanName) ? poke.koreanName : poke.name;
          const partyPoke: PartyPokemon = {
            speciesId: poke.speciesId,
            name: pokeName,
            level: 25,
            hp: poke.hp + 50,
            maxHp: poke.hp + 50,
            moves: ["Tackle", "Growl"],
          };
          const result = saveService.addBagPokemon(interaction.user.id, partyPoke);
          await interaction.reply({
            content: isKo ? result.messageKo : result.messageEn,
            ephemeral: true,
          });
        }
        return;
      }

      // 3-0-8-1. Pokédex Region Select Button Clicked (🗺️)
      if (customId.startsWith("pokedex_region_btn_")) {
        const fromScreen = (parts[3] || "title") as "multiplay" | "inventory" | "title";
        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";
        const regionMenuData = createPokedexRegionSelectMenu(fromScreen, interaction.user.id, isKo);
        await interaction.update(regionMenuData);
        return;
      }

      // 3-0-8-2. Pokédex Search Button Clicked (🔍)
      if (customId.startsWith("pokedex_search_btn_")) {
        const fromScreen = (parts[3] || "title") as "multiplay" | "inventory" | "title";
        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        const modal = new ModalBuilder()
          .setCustomId(`pokedex_search_modal_${fromScreen}_${interaction.user.id}`)
          .setTitle(isKo ? "🔍 포켓몬 도감 검색" : "🔍 Search Pokédex");

        const searchInput = new TextInputBuilder()
          .setCustomId("pokedex_search_input")
          .setLabel(isKo ? "포켓몬 이름 또는 도감 번호" : "Pokémon Name or Dex Number")
          .setPlaceholder(isKo ? "예: 681, 킬가르도, aegislash, pikachu" : "e.g. 681, Aegislash, Pikachu, 25")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(30);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(searchInput)
        );

        await interaction.showModal(modal);
        return;
      }

      // 3-0-9. Pokédex Back Button (Context-Aware Back Navigation)
      if (customId.startsWith("pokedex_back_")) {
        await interaction.deferUpdate().catch(() => null);
        const fromScreen = (parts[2] || "title") as "multiplay" | "inventory" | "title";

        if (fromScreen === "multiplay") {
          const multiData = await renderMultiplayerMessageData(client, interaction.user.id);
          await interaction.editReply(multiData).catch(() => null);
          return;
        } else if (fromScreen === "inventory") {
          const bagData = await renderBagMessageData(client, interaction.user.id, "pokemon");
          await interaction.editReply(bagData).catch(() => null);
          return;
        } else {
          const titleData = await renderTitleMessageData(client, interaction.user.id);
          await interaction.editReply(titleData).catch(() => null);
          return;
        }
      }

      // 2-0-5. Bag Tab Switching
      if (customId.startsWith("bag_tab_")) {
        const tabType = parts[2] as "pokemon" | "pokedex" | "records";
        if (tabType === "pokedex") {
          await interaction.deferUpdate().catch(() => null);
          const dexData = await renderPokedexMessageData(client, interaction.user.id, 1, 1, "inventory");
          await interaction.editReply(dexData).catch(() => null);
          return;
        }
        const bagData = await renderBagMessageData(client, interaction.user.id, tabType);
        await interaction.update(bagData);
        return;
      }

      // 2-0-6. Bag Specific Pokemon Slot Inspected (Slot 1~6)
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

      // 2-1. New Game Button Clicked from Title (Back destination: TITLE)
      if (customId.startsWith("menu_newgame_")) {
        const targetSlot = saveService.getFirstAvailableSlot(interaction.user.id);
        const responseData = createStarterSelectMenu(targetSlot, interaction.user.id, "title");
        await interaction.update(responseData);
        return;
      }

      // 2-2. Load Game Button Clicked (1st Button on Title!)
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
            .setLabel("↩️")
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

      // 2-6. Specific Slot Selected (Slot 1, 2, 3) (Empty Slot -> Back to Slots)
      if (customId.startsWith("slot_select_")) {
        const slotNum = parseInt(parts[2], 10) || 1;
        const profile = saveService.getProfile(interaction.user.id);
        const slotData = profile.slots[slotNum];
        const isKo = profile.language === "ko";

        if (!slotData) {
          const responseData = createStarterSelectMenu(slotNum, interaction.user.id, "slots");
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
              .setLabel("↩️")
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
            .setLabel("↩️")
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.update({
          embeds: [resumedEmbed],
          components: [resumeActionRow],
        });
        return;
      }

      // 2-8. Overwrite Slot (Back destination: SLOTS)
      if (customId.startsWith("slot_overwrite_")) {
        const slotNum = parseInt(parts[2], 10) || 1;
        const responseData = createStarterSelectMenu(slotNum, interaction.user.id, "slots");
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
            .setLabel("↩️")
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.update({
          embeds: [runStartedEmbed],
          components: [battleStartRow],
        });
        return;
      }

      // 4-2. Pokédex Region Jump Selection (1~9 Gen National Dex Jump)
      if (interaction.customId.startsWith("pokedex_region_select_")) {
        await interaction.deferUpdate().catch(() => null);
        const parts = interaction.customId.split("_");
        const fromScreen = (parts[3] || "title") as "multiplay" | "inventory" | "title";
        const [startDexStr, pageStr] = interaction.values[0].split("_");
        const targetStartDex = parseInt(startDexStr, 10) || 1;
        const targetPage = parseInt(pageStr, 10) || 1;

        const client = interaction.client as ExtendedClient;
        const dexData = await renderPokedexMessageData(client, interaction.user.id, targetStartDex, targetPage, fromScreen);
        await interaction.editReply(dexData).catch(async () => {
          await interaction.followUp(dexData).catch(() => null);
        });
        return;
      }
    }
  },
};
