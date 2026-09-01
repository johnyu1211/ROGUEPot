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
import { renderTitleScreen, renderBagScreen, renderMultiplayerScreen, renderPokedexScreen, renderStarterSelectScreen, renderGenSelectScreen, renderEggGachaScreen, renderSaveSlotsScreen, renderBattleScreen, StarterSelectPartyItem, PartyViewTab, InGameMessage, getPokemonSprite, isSpriteCached, TYPE_NAMES_KO } from "../utils/canvasRenderer.js";
import { renderBattleMoveGif, renderBattleFaintGif, renderBattleEntryGif } from "../utils/battleGifRenderer.js";
import { MOVES_DATA } from "../data/movesKo.js";
import { MOVES_EN_DESC } from "../data/movesEn.js";
import { saveService, PartyPokemon } from "../services/saveService.js";
import { battleService, BattleState } from "../services/battleService.js";
import { getPokemonByQuery, getPokemonByDexNumber, getPokemonPage, getAbilityKoreanName, getAbilityDetail, ABILITY_DETAILED_DESC_KO, ABILITY_DETAILED_DESC_EN, KOREAN_POKEMON_DICT } from "../services/pokeApiService.js";
import { STARTER_DATABASE, GENERATION_INFO, getStartersByGen, getStarterByDexNumber, DEFAULT_MAX_COST, StarterEntry } from "../data/starterCosts.js";
import { getUserStarters, getUserStarter, unlockPassiveAbility, reduceStarterCost } from "../services/starterService.js";
import { pullEggs, getUserEggs, advanceEggHatching } from "../services/eggService.js";

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

export async function renderSlotsScreenData(
  userId: string,
  selectedSlotNum?: number,
  deleteMode: boolean = false,
  inGameMsg?: InGameMessage
) {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";

  const imageBuffer = await renderSaveSlotsScreen({
    slots: profile.slots,
    selectedSlotId: selectedSlotNum,
    deleteMode,
    lang: profile.language,
    inGameMessage: inGameMsg,
  });

  const attachment = new AttachmentBuilder(imageBuffer, { name: "save_slots.png" });
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  if (deleteMode) {
    // Delete Mode Buttons
    const deleteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`slot_delete_confirm_1_${userId}`)
        .setLabel(isKo ? "1번 삭제 🗑️" : "Delete 1 🗑️")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!profile.slots[1]),
      new ButtonBuilder()
        .setCustomId(`slot_delete_confirm_2_${userId}`)
        .setLabel(isKo ? "2번 삭제 🗑️" : "Delete 2 🗑️")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!profile.slots[2]),
      new ButtonBuilder()
        .setCustomId(`slot_delete_confirm_3_${userId}`)
        .setLabel(isKo ? "3번 삭제 🗑️" : "Delete 3 🗑️")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!profile.slots[3]),
      new ButtonBuilder()
        .setCustomId(`menu_loadgame_${userId}`)
        .setLabel(isKo ? "↩️ 취소" : "↩️ Cancel")
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(deleteRow);
  } else {
    // Main Slot Selection Row
    const slotButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`slot_select_1_${userId}`)
        .setLabel(isKo ? (profile.slots[1] ? "1. 슬롯 1 🎮" : "1. 빈 슬롯 ➕") : (profile.slots[1] ? "1. Slot 1 🎮" : "1. Empty ➕"))
        .setStyle(profile.slots[1] ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`slot_select_2_${userId}`)
        .setLabel(isKo ? (profile.slots[2] ? "2. 슬롯 2 🎮" : "2. 빈 슬롯 ➕") : (profile.slots[2] ? "2. Slot 2 🎮" : "2. Empty ➕"))
        .setStyle(profile.slots[2] ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`slot_select_3_${userId}`)
        .setLabel(isKo ? (profile.slots[3] ? "3. 슬롯 3 🎮" : "3. 빈 슬롯 ➕") : (profile.slots[3] ? "3. Slot 3 🎮" : "3. Empty ➕"))
        .setStyle(profile.slots[3] ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`menu_delete_mode_${userId}`)
        .setLabel("🗑️")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`menu_back_to_title_${userId}`)
        .setLabel("↩️")
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(slotButtons);
  }

  return { embeds: [], files: [attachment], attachments: [], components };
}

export async function safeInteractionUpdate(interaction: any, data: any) {
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(data);
    } else {
      await interaction.update(data);
    }
  } catch (err: any) {
    if (err.code === 40060 || err.code === 10062) {
      // 40060: Interaction has already been acknowledged (double-click / rapid response)
      // 10062: Unknown interaction (expired token)
      return;
    }
    throw err;
  }
}

export async function renderBattleMessageData(
  userId: string,
  slotId: number,
  overridePhase?: "MAIN" | "FIGHT" | "BAG" | "PARTY",
  isEntryTransition?: boolean
) {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";
  const battle = battleService.getOrCreateBattle(userId, slotId);

  if (overridePhase) {
    battle.phase = overridePhase;
  }

  let imageBuffer: Buffer;
  let fileName = "battle.png";

  if (isEntryTransition) {
    imageBuffer = await renderBattleEntryGif({
      battle,
      lang: profile.language,
    });
    fileName = "battle.gif";
  } else if (battle.phase === "VICTORY" && battle.lastMoveEffect) {
    imageBuffer = await renderBattleFaintGif({
      battle,
      lang: profile.language,
    });
    fileName = "battle.gif";
  } else if (battle.lastMoveEffect && battle.phase === "MAIN") {
    imageBuffer = await renderBattleMoveGif({
      battle,
      lang: profile.language,
    });
    fileName = "battle.gif";
  } else {
    imageBuffer = await renderBattleScreen({
      battle,
      lang: profile.language,
    });
  }

  const attachment = new AttachmentBuilder(imageBuffer, { name: fileName });
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  const combatMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex] || battle.playerParty[0];
  const playerMon = combatMon;

  if (battle.phase === "VICTORY") {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_nextwave_${slotId}_${userId}`)
        .setLabel(isKo ? "⏩ 다음 웨이브로 (Next Wave)" : "⏩ Next Wave")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`menu_back_to_title_${userId}`)
        .setLabel(isKo ? "↩️ 타이틀 화면" : "↩️ Title")
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(row);
  } else if (battle.phase === "DEFEAT") {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_retry_${slotId}_${userId}`)
        .setLabel(isKo ? "🔄 이어하기 (Continue)" : "🔄 Continue")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`menu_newgame_${userId}`)
        .setLabel(isKo ? "➕ 새 게임 시작" : "➕ New Game")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`menu_back_to_title_${userId}`)
        .setLabel(isKo ? "↩️ 타이틀 화면" : "↩️ Title")
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(row);
  } else if (battle.phase === "FIGHT") {
    const moves = (combatMon?.moves && combatMon.moves.length > 0)
      ? combatMon.moves
      : ["Tackle", "Scratch", "Growl", "Quick Attack"];

    // Row 1: Moves 1, 2
    const row1 = new ActionRowBuilder<ButtonBuilder>();
    for (let i = 0; i < Math.min(2, moves.length); i++) {
      const mKey = moves[i];
      const cleanKey = mKey.toLowerCase().replace(/[\s_]+/g, "-");
      const mData = MOVES_DATA[cleanKey] || { nameKo: mKey, name: mKey, type: "normal", pp: 35 };
      const mName = isKo ? mData.nameKo : mData.name;
      const typeName = isKo ? (TYPE_NAMES_KO[mData.type.toLowerCase()] || mData.type) : mData.type.toUpperCase();
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId(`battle_move_${i}_${encodeURIComponent(cleanKey)}_${slotId}_${userId}`)
          .setLabel(`${i + 1}. ${mName} [${typeName}]`)
          .setStyle(ButtonStyle.Primary)
      );
    }
    components.push(row1);

    // Row 2: Moves 3, 4 + Back
    const row2 = new ActionRowBuilder<ButtonBuilder>();
    for (let i = 2; i < Math.min(4, moves.length); i++) {
      const mKey = moves[i];
      const cleanKey = mKey.toLowerCase().replace(/[\s_]+/g, "-");
      const mData = MOVES_DATA[cleanKey] || { nameKo: mKey, name: mKey, type: "normal", pp: 35 };
      const mName = isKo ? mData.nameKo : mData.name;
      const typeName = isKo ? (TYPE_NAMES_KO[mData.type.toLowerCase()] || mData.type) : mData.type.toUpperCase();
      row2.addComponents(
        new ButtonBuilder()
          .setCustomId(`battle_move_${i}_${encodeURIComponent(cleanKey)}_${slotId}_${userId}`)
          .setLabel(`${i + 1}. ${mName} [${typeName}]`)
          .setStyle(ButtonStyle.Primary)
      );
    }
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_cancel_${slotId}_${userId}`)
        .setLabel(isKo ? "↩️ 뒤로" : "↩️ Back")
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(row2);
  } else if (battle.phase === "BAG") {
    const profile = saveService.getProfile(userId);
    const slot = profile.slots[slotId];
    const items = slot?.items || { "poke-ball": 5 };
    if (items["poke-ball"] === undefined && Object.keys(items).length === 0) {
      items["poke-ball"] = 5;
    }

    const ballDefs = [
      { id: "poke-ball", labelKo: "🔴 몬스터볼", labelEn: "🔴 Poké Ball", style: ButtonStyle.Success },
      { id: "great-ball", labelKo: "🔵 수퍼볼", labelEn: "🔵 Great Ball", style: ButtonStyle.Primary },
      { id: "ultra-ball", labelKo: "🟡 하이퍼볼", labelEn: "🟡 Ultra Ball", style: ButtonStyle.Primary },
      { id: "rogue-ball", labelKo: "🟣 로그볼", labelEn: "🟣 Rogue Ball", style: ButtonStyle.Primary },
      { id: "master-ball", labelKo: "🟣 마스터볼", labelEn: "🟣 Master Ball", style: ButtonStyle.Danger },
    ];

    const ownedBalls = ballDefs.filter((b) => (items[b.id] || 0) > 0);
    const bagRow = new ActionRowBuilder<ButtonBuilder>();

    if (ownedBalls.length > 0) {
      ownedBalls.forEach((b) => {
        const count = items[b.id] || 0;
        const label = `${isKo ? b.labelKo : b.labelEn} x${count}`;
        bagRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`battle_throwball_${b.id}_${slotId}_${userId}`)
            .setLabel(label)
            .setStyle(b.style)
        );
      });
    } else {
      bagRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`battle_no_balls_${slotId}_${userId}`)
          .setLabel(isKo ? "❌ 몬스터볼 없음" : "❌ No Poké Balls")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    }

    bagRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_cancel_${slotId}_${userId}`)
        .setLabel(isKo ? "↩️ 뒤로" : "↩️ Back")
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(bagRow);
  } else if (battle.phase === "PARTY") {
    const partyRow = new ActionRowBuilder<ButtonBuilder>();
    battle.playerParty.slice(0, 4).forEach((p, idx) => {
      const hpPct = Math.round((p.hp / p.maxHp) * 100);
      const isCurrent = idx === battle.playerActiveIndex;
      partyRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`battle_switch_${idx}_${slotId}_${userId}`)
          .setLabel(`${idx + 1}. ${p.name} (${hpPct}%)`)
          .setStyle(isCurrent ? ButtonStyle.Success : (p.hp > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary))
          .setDisabled(p.hp <= 0 || isCurrent)
      );
    });
    partyRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_cancel_${slotId}_${userId}`)
        .setLabel("↩️")
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(partyRow);
  } else {
    // MAIN Action Row
    const mainRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_menu_fight_${slotId}_${userId}`)
        .setLabel(isKo ? "⚔️ 싸운다 (Fight)" : "⚔️ Fight")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`battle_menu_bag_${slotId}_${userId}`)
        .setLabel(isKo ? "⚪ 몬스터볼 (Ball)" : "⚪ PokéBall")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`battle_menu_party_${slotId}_${userId}`)
        .setLabel(isKo ? "🔄 교체 (Party)" : "🔄 Party")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(battle.playerParty.length <= 1),
      new ButtonBuilder()
        .setCustomId(`battle_menu_run_${slotId}_${userId}`)
        .setLabel(isKo ? "🏃 도망치기 (Run)" : "🏃 Run")
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(mainRow);
  }

  return { embeds: [], files: [attachment], attachments: [], components };
}

export function renderSettingsMessageData(userId: string) {
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
        "• **개발자 (Developer)**: John\n" +
        "• **PokéRogue**: PageFaultGames\n" +
        "• **Sprites**: [Showdown](https://pokemonshowdown.com/) & [PMD SpriteCollab](https://sprites.pmdcollab.org/)\n" +
        "• **Data**: [PokéAPI](https://pokeapi.co/)"
      : "Configure your game preferences and interface language.\n\n" +
        `• **Current Language**: 🌐 **English**\n` +
        `• **Engine Version**: v1.12.1.0\n` +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "**Credits & Sources**\n" +
        "• **Developer**: John\n" +
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

export async function renderBagMessageData(
  client: ExtendedClient,
  userId: string,
  tab: "pokemon" | "pokedex" | "records" = "pokemon"
) {
  const profile = saveService.getProfile(userId);
  const activeRun = profile.activeSlotId ? profile.slots[profile.activeSlotId] : null;
  const isKo = profile.language === "ko";

  const user = client?.users?.cache?.get(userId) || (await client?.users?.fetch(userId).catch(() => null));
  const username = user?.username || "Trainer";
  const avatarUrl = user?.displayAvatarURL?.({ extension: "png", size: 64 });

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

export async function renderMultiplayerMessageData(client: ExtendedClient, userId: string) {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";

  const user = client?.users?.cache?.get(userId) || (await client?.users?.fetch(userId).catch(() => null));
  const username = user?.username || "Trainer";
  const avatarUrl = user?.displayAvatarURL?.({ extension: "png", size: 64 });

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

export async function renderPokedexMessageData(
  client: ExtendedClient,
  userId: string,
  selectedDexNo: number = 1,
  page: number = 1,
  fromScreen: "multiplay" | "inventory" | "title" = "title",
  activeAbility?: string,
  allowFetchSprites: boolean = true
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
    allowFetchSprites,
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
          .setStyle(isSelectedAbility ? ButtonStyle.Danger : ButtonStyle.Primary)
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
          .setStyle(isSelectedHa ? ButtonStyle.Danger : ButtonStyle.Primary)
      );
    }
  }

  // ROW 1: Abilities (1~3)
  if (abilityButtons.length > 0) {
    components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(abilityButtons.slice(0, 5)));
  }

  // Helper to create pokemon button (Empty slots are rendered as disabled buttons)
  const createPokeBtn = (p: typeof items[0], idx: number) => {
    if (!p) {
      return new ButtonBuilder()
        .setCustomId(`pokedex_empty_${idx}_${page}_${userId}`)
        .setLabel(`${idx + 1}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    }
    const isSelected = selectedPokemon && selectedPokemon.dexNumber === p.dexNumber;
    return new ButtonBuilder()
      .setCustomId(`pokedex_select_${p.dexNumber}_${page}_${fromScreen}_${userId}`)
      .setLabel(`${idx + 1}`)
      .setStyle(isSelected ? ButtonStyle.Primary : ButtonStyle.Secondary);
  };

  // ROW 2: Pokemon 1, 2 + [+📦] + [+💼]
  const row2Btns = [createPokeBtn(items[0], 0), createPokeBtn(items[1], 1)];
  if (selectedPokemon) {
    row2Btns.push(
      new ButtonBuilder()
        .setCustomId(`pokedex_add_multi_${selectedPokemon.dexNumber}_${page}_${fromScreen}_${userId}`)
        .setLabel("+📦")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`pokedex_add_bag_${selectedPokemon.dexNumber}_${page}_${fromScreen}_${userId}`)
        .setLabel("+💼")
        .setStyle(ButtonStyle.Success)
    );
  }
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row2Btns));

  // ROW 3: Pokemon 3, 4 + Blue Region Jump [`🗺️`] + Blue Search [`🔍`]
  const row3Btns = [
    createPokeBtn(items[2], 2),
    createPokeBtn(items[3], 3),
    new ButtonBuilder()
      .setCustomId(`pokedex_region_btn_${fromScreen}_${userId}`)
      .setLabel("`🗺️`")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`pokedex_search_btn_${fromScreen}_${userId}`)
      .setLabel("`🔍`")
      .setStyle(ButtonStyle.Primary)
  ];
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row3Btns));

  // ROW 4: Pokemon 5, 6 + Fast Backward 3 Pages [ <<< ] + Fast Forward 3 Pages [ >>> ]
  const row4Btns = [
    createPokeBtn(items[4], 4),
    createPokeBtn(items[5], 5),
    new ButtonBuilder()
      .setCustomId(`pokedex_jumpback_${Math.max(1, page - 3)}_${selectedDexNo}_${fromScreen}_${userId}`)
      .setLabel("<<<")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`pokedex_jumpfwd_${Math.min(totalPages, page + 3)}_${selectedDexNo}_${fromScreen}_${userId}`)
      .setLabel(">>>")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= totalPages)
  ];
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row4Btns));

  // ROW 5: Pokemon 7, 8 + [ < ] + [ > ] + [ ↩️ ]
  const lastRowBtns: ButtonBuilder[] = [
    createPokeBtn(items[6], 6),
    createPokeBtn(items[7], 7),
    new ButtonBuilder()
      .setCustomId(`pokedex_pageprev_${Math.max(1, page - 1)}_${selectedDexNo}_${fromScreen}_${userId}`)
      .setLabel("<")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`pokedex_pagenext_${Math.min(totalPages, page + 1)}_${selectedDexNo}_${fromScreen}_${userId}`)
      .setLabel(">")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= totalPages),
    new ButtonBuilder()
      .setCustomId(`pokedex_back_${fromScreen}_${userId}`)
      .setLabel("↩️")
      .setStyle(ButtonStyle.Danger)
  ];
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(lastRowBtns));

  // Background Prefetch next & previous pages for instantaneous 0ms page navigation
  setTimeout(async () => {
    try {
      const nextPage = page + 1;
      const prevPage = page - 1;
      if (nextPage <= totalPages) {
        const nextData = await getPokemonPage(nextPage);
        nextData.items.forEach((p) => getPokemonSprite(p.speciesId));
      }
      if (prevPage >= 1) {
        const prevData = await getPokemonPage(prevPage);
        prevData.items.forEach((p) => getPokemonSprite(p.speciesId));
      }
    } catch {
      // Silent catch for background prefetch
    }
  }, 100);

  return { embeds: [], files: [attachment], attachments: [], components };
}

async function handlePokedexInteractionUpdate(
  interaction: any,
  client: ExtendedClient,
  userId: string,
  dexNo: number,
  page: number,
  fromScreen: "multiplay" | "inventory" | "title",
  activeAbility?: string
) {
  try {
    const { items } = await getPokemonPage(page, 8);
    const selected = items.find((p) => p.dexNumber === dexNo) || (await getPokemonByDexNumber(dexNo)) || items[0];
    const hasUncached = items.some((p) => !isSpriteCached(p.speciesId)) || (selected && !isSpriteCached(selected.speciesId));

    if (hasUncached) {
      // Phase 1: 0.01s Instant Progressive UI Response
      const quickData = await renderPokedexMessageData(client, userId, dexNo, page, fromScreen, activeAbility, false);
      await interaction.update(quickData);

      // Phase 2: Smooth Image Resolution Update
      const fullData = await renderPokedexMessageData(client, userId, dexNo, page, fromScreen, activeAbility, true);
      await interaction.editReply(fullData).catch(() => null);
    } else {
      // 0ms Instant In-Memory Update
      const fullData = await renderPokedexMessageData(client, userId, dexNo, page, fromScreen, activeAbility, true);
      await interaction.update(fullData);
    }
  } catch (err) {
    console.error("[POKEDEX] Error in handlePokedexInteractionUpdate:", err);
  }
}

export async function renderGenSelectMessageData(
  client: ExtendedClient,
  userId: string,
  currentGen: number = 1,
  slotId: number = 1,
  partyParam: string = "empty",
  flagsParam: string = "0_0_0"
) {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";

  const imageBuffer = await renderGenSelectScreen({
    currentGen,
    lang: profile.language,
  });

  const attachment = new AttachmentBuilder(imageBuffer, { name: "gen_select.png" });

  const createGenBtn = (g: number) => {
    const info = GENERATION_INFO[g - 1];
    const isSelected = g === currentGen;
    return new ButtonBuilder()
      .setCustomId(`starter_pickgen_${g}_${currentGen}_${slotId}_${partyParam}_${flagsParam}_${userId}`)
      .setLabel(isKo ? info.nameKo : info.nameEn)
      .setStyle(isSelected ? ButtonStyle.Primary : ButtonStyle.Secondary);
  };

  const components: ActionRowBuilder<ButtonBuilder>[] = [
    // Row 1: Gen 1, 2, 3
    new ActionRowBuilder<ButtonBuilder>().addComponents(createGenBtn(1), createGenBtn(2), createGenBtn(3)),
    // Row 2: Gen 4, 5, 6
    new ActionRowBuilder<ButtonBuilder>().addComponents(createGenBtn(4), createGenBtn(5), createGenBtn(6)),
    // Row 3: Gen 7, 8, 9
    new ActionRowBuilder<ButtonBuilder>().addComponents(createGenBtn(7), createGenBtn(8), createGenBtn(9)),
    // Row 4: Back to Starter Select
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`starter_genback_${currentGen}_${currentGen}_${slotId}_${partyParam}_${flagsParam}_${userId}`)
        .setLabel(isKo ? "↩️ 스타팅 선택으로 돌아가기" : "↩️ Back to Starter Select")
        .setStyle(ButtonStyle.Danger)
    ),
  ];

  return { embeds: [], files: [attachment], attachments: [], components };
}

// In-Memory Draft Starter Party Cache per user (Keeps customId ultra short & prevents Discord 100-char limit)
export const starterDraftParties = new Map<string, PartyItemState[]>();

export interface PartyItemState {
  dexNumber: number;
  shinyTier: number; // 0, 1, 2, 3
  useHiddenAbility: boolean;
  usePassive: boolean;
  moves?: string[];
}

export function parseDexParam(param: string | undefined, defaultVal: number = 1): number {
  if (param === undefined || param === "") return defaultVal;
  const num = parseInt(param, 10);
  return isNaN(num) ? defaultVal : num;
}

export function getLearnableMoves(speciesId: string | undefined, starterMoves: string[], eggMoves: string[]): string[] {
  if (speciesId === "testsubject12" || speciesId === "testsubject") {
    const list: string[] = [];
    // 1. Put starter moves first
    starterMoves.forEach((m) => {
      if (!list.includes(m)) list.push(m);
    });
    // 2. Add all remaining moves from MOVES_DATA
    for (const key of Object.keys(MOVES_DATA)) {
      const m = MOVES_DATA[key];
      const formatted = m.name.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      if (!list.includes(formatted)) {
        list.push(formatted);
      }
    }
    return list;
  }
  return [...starterMoves, ...eggMoves.filter((m: string) => !starterMoves.includes(m))];
}

export function parsePartyParam(param: string | number[] | undefined, userStarters?: Map<string, any>, userId?: string): PartyItemState[] {
  if (userId && (param === "d" || param === "draft")) {
    return starterDraftParties.get(userId) || [];
  }
  if (!param || param === "empty") {
    if (userId) starterDraftParties.set(userId, []);
    return [];
  }
  if (Array.isArray(param)) {
    const res = param.map((dex) => {
      const s = getStarterByDexNumber(dex);
      const prog = s && userStarters ? userStarters.get(s.speciesId) : null;
      return {
        dexNumber: dex,
        shinyTier: prog?.shinyTier || 0,
        useHiddenAbility: prog?.hasHiddenAbility || false,
        usePassive: prog?.passiveUnlocked || false,
        moves: s ? [...s.starterMoves] : undefined,
      };
    });
    if (userId) starterDraftParties.set(userId, res);
    return res;
  }

  // Fallback / legacy parsing
  const res = String(param)
    .split("-")
    .map((chunk) => {
      const atParts = chunk.split("@");
      const parts = atParts[0].split(":");
      const dexNumber = parseInt(parts[0], 10);
      if (isNaN(dexNumber) || dexNumber < 0) return null;
      const s = getStarterByDexNumber(dexNumber);
      if (!s) return null;
      const prog = userStarters ? userStarters.get(s.speciesId) : null;
      const defShinyTier = prog?.shinyTier || 0;
      const defHa = prog?.hasHiddenAbility || false;
      const defPassive = prog?.passiveUnlocked || false;

      const shinyTier = parts[1] !== undefined ? parseInt(parts[1], 10) : defShinyTier;
      const useHiddenAbility = parts[2] !== undefined ? parts[2] === "1" : defHa;
      const usePassive = parts[3] !== undefined ? parts[3] === "1" : defPassive;
      const moves = atParts[1] ? atParts[1].split(",") : (s ? [...s.starterMoves] : undefined);

      return {
        dexNumber,
        shinyTier,
        useHiddenAbility,
        usePassive,
        moves,
      };
    })
    .filter(Boolean) as PartyItemState[];

  if (userId) starterDraftParties.set(userId, res);
  return res;
}

export function serializePartyParam(states: PartyItemState[], userId?: string): string {
  if (userId) {
    starterDraftParties.set(userId, states || []);
    return states && states.length > 0 ? "d" : "empty";
  }
  return states && states.length > 0 ? "d" : "empty";
}

function findMatchingStarters(query: string, allUnlockedStarters: StarterEntry[]): StarterEntry[] {
  const cleanQ = query.trim().toLowerCase().replace(/[\s_\-]+/g, "");
  if (!cleanQ) return allUnlockedStarters;
  const numQ = parseInt(cleanQ, 10);

  // 1. Direct matches in STARTER_DATABASE
  const directMatches = allUnlockedStarters.filter(s => {
    if (!isNaN(numQ) && s.dexNumber === numQ) return true;
    return (
      s.nameKo.toLowerCase().replace(/[\s_\-]+/g, "").includes(cleanQ) ||
      s.name.toLowerCase().replace(/[\s_\-]+/g, "").includes(cleanQ) ||
      s.speciesId.toLowerCase().replace(/[\s_\-]+/g, "").includes(cleanQ)
    );
  });

  if (directMatches.length > 0) {
    return directMatches;
  }

  // 2. If not matched directly, check KOREAN_POKEMON_DICT for evolution lines (e.g. 나무돌이 -> 나무지기)
  const dexFromDict = KOREAN_POKEMON_DICT[query.trim()];
  if (dexFromDict) {
    for (const s of allUnlockedStarters) {
      if (dexFromDict >= s.dexNumber && dexFromDict <= s.dexNumber + 2) {
        return [s];
      }
    }
  }

  return [];
}

export async function renderStarterSelectMessageData(
  client: ExtendedClient,
  userId: string,
  slotId: number = 1,
  gen: number = 0,
  page: number = 1,
  selectedDexNo: number = 1,
  partyParamInput: string | number[] = "empty",
  isShinyFilter: boolean = false,
  isHaFilter: boolean = false,
  isPassiveFilter: boolean = false,
  searchQuery: string = "",
  inGameMsg?: InGameMessage
) {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";
  const userStarters = getUserStarters(userId);
  const partyStates = parsePartyParam(partyParamInput, userStarters, userId);
  const partyDexList = partyStates.map((p) => p.dexNumber);

  // 1. Filter Starters List based on generation and ONLY UNLOCKED starters owned by user
  // If search is active, ALWAYS search across ALL generations (gen = 0) without region/generation restrictions!
  const hasSearch = Boolean(searchQuery && searchQuery.trim() !== "" && searchQuery !== "none");
  const effectiveGen = hasSearch ? 0 : gen;
  let allStarters = getStartersByGen(effectiveGen).filter((s) => userStarters.get(s.speciesId)?.isUnlocked);
  if (isShinyFilter) {
    allStarters = allStarters.filter((s) => (userStarters.get(s.speciesId)?.shinyTier || 0) > 0);
  }
  if (isHaFilter) {
    allStarters = allStarters.filter((s) => userStarters.get(s.speciesId)?.hasHiddenAbility);
  }
  if (isPassiveFilter) {
    allStarters = allStarters.filter((s) => userStarters.get(s.speciesId)?.passiveUnlocked);
  }

  // 1-B. Search Filter (Only matching starters displayed in the list!)
  let activeInGameMsg = inGameMsg;

  if (hasSearch) {
    const matched = findMatchingStarters(searchQuery, allStarters);
    if (matched.length > 0) {
      allStarters = matched;
    } else {
      if (!activeInGameMsg) {
        activeInGameMsg = {
          title: isKo ? "검색 결과 없음" : "No Results Found",
          text: isKo
            ? `'${searchQuery}'에 해당하는 스타팅 포켓몬을 찾을 수 없습니다.`
            : `No starter Pokémon found matching '${searchQuery}'.`,
          type: "info",
        };
      }
    }
  }

  // 2. Sort: Shiny Tier desc, then Dex Number asc (Custom Dex <= 0 placed at the end of region!)
  allStarters.sort((a, b) => {
    const progA = userStarters.get(a.speciesId);
    const progB = userStarters.get(b.speciesId);

    const shinyA = progA?.shinyTier || 0;
    const shinyB = progB?.shinyTier || 0;
    if (shinyA !== shinyB) return shinyB - shinyA; // Shiny tier desc!

    const orderA = a.dexNumber <= 0 ? 9999 : a.dexNumber;
    const orderB = b.dexNumber <= 0 ? 9999 : b.dexNumber;
    return orderA - orderB;
  });

  // 3. Pagination (8 Starters per page)
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(allStarters.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageStarters = allStarters.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectedStarter =
    allStarters.find((s) => s.dexNumber === selectedDexNo) ||
    pageStarters[0] ||
    allStarters[0] ||
    STARTER_DATABASE[0];

  const selProgress = userStarters.get(selectedStarter.speciesId);
  const selIsUnlocked = selProgress ? selProgress.isUnlocked : true;
  const selHasPassive = selProgress?.passiveUnlocked || false;

  const selectedParty: StarterSelectPartyItem[] = partyStates
    .map((st) => {
      const s = getStarterByDexNumber(st.dexNumber);
      if (!s) return null;
      return {
        dexNumber: s.dexNumber,
        speciesId: s.speciesId,
        name: isKo ? s.nameKo : s.name,
        cost: st.usePassive ? s.reducedCost : s.cost,
        isShiny: st.shinyTier > 0,
        shinyTier: st.shinyTier,
        useHiddenAbility: st.useHiddenAbility,
        usePassive: st.usePassive,
        moves: st.moves,
      };
    })
    .filter(Boolean) as StarterSelectPartyItem[];

  const currentCost = selectedParty.reduce((sum, p) => sum + p.cost, 0);
  const isAlreadyInParty = partyDexList.includes(selectedStarter.dexNumber);
  const effectiveSelCost = selHasPassive ? selectedStarter.reducedCost : selectedStarter.cost;
  const canAdd = selIsUnlocked && !isAlreadyInParty && selectedParty.length < 6 && (currentCost + effectiveSelCost <= DEFAULT_MAX_COST);
  const canStart = selectedParty.length >= 1 && currentCost <= DEFAULT_MAX_COST;

  const imageBuffer = await renderStarterSelectScreen({
    selectedStarter,
    currentGen: gen,
    currentPage: safePage,
    totalPages,
    startersList: pageStarters,
    selectedParty,
    userStarters,
    isShinyFilter,
    isHaFilter,
    isPassiveFilter,
    maxCost: DEFAULT_MAX_COST,
    lang: profile.language,
    inGameMessage: activeInGameMsg,
  });

  const attachment = new AttachmentBuilder(imageBuffer, { name: "starter_select.png" });
  const partyParam = serializePartyParam(partyStates, userId);
  const flagsParam = `${isShinyFilter ? 1 : 0}_${isHaFilter ? 1 : 0}_${isPassiveFilter ? 1 : 0}`;
  const searchParam = hasSearch ? encodeURIComponent(searchQuery) : "none";

  // Helper to create slot button
  const createSlotBtn = (idx: number) => {
    const s = pageStarters[idx];
    if (!s) {
      return new ButtonBuilder()
        .setCustomId(`starter_empty_${idx}_${gen}_${safePage}_${slotId}_${userId}`)
        .setLabel(`${idx + 1}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    }
    const isInParty = partyStates.some((p) => p.dexNumber === s.dexNumber);
    const isSelected = selectedStarter.dexNumber === s.dexNumber;

    let btnStyle = ButtonStyle.Secondary;
    if (isInParty) {
      btnStyle = ButtonStyle.Success;
    } else if (isSelected) {
      btnStyle = ButtonStyle.Primary;
    }

    return new ButtonBuilder()
      .setCustomId(`starter_sel_${s.dexNumber}_${gen}_${safePage}_${slotId}_${partyParam}_${flagsParam}_${searchParam}_${userId}`)
      .setLabel(`${idx + 1}`)
      .setStyle(btnStyle);
  };

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  // ROW 1: [Generation Pick] + [✨ Shiny] + [🔓 Passive] + [🌟 HA] + [🔍 Search]
  const genLabel = gen <= 0 ? (isKo ? "📁 전체" : "📁 ALL") : (isKo ? `📁 ${gen}세대` : `📁 Gen ${gen}`);
  const searchBtn = hasSearch
    ? new ButtonBuilder()
        .setCustomId(`starter_clearsearch_top_${gen}_${safePage}_${selectedStarter.dexNumber}_${slotId}_${partyParam}_${flagsParam}_${userId}`)
        .setLabel(isKo ? `🔍 "${searchQuery.slice(0, 3)}" ✕` : `🔍 "${searchQuery.slice(0, 3)}" ✕`)
        .setStyle(ButtonStyle.Primary)
    : new ButtonBuilder()
        .setCustomId(`starter_opensearch_${gen}_${safePage}_${selectedStarter.dexNumber}_${slotId}_${partyParam}_${flagsParam}_${userId}`)
        .setLabel("🔍")
        .setStyle(ButtonStyle.Secondary);

  const row1Btns: ButtonBuilder[] = [
    new ButtonBuilder()
      .setCustomId(`starter_genmenu_${gen}_${slotId}_${partyParam}_${flagsParam}_${searchParam}_${userId}`)
      .setLabel(genLabel)
      .setStyle(gen > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`starter_toggleshiny_${gen}_${safePage}_${selectedStarter.dexNumber}_${slotId}_${partyParam}_${flagsParam}_${searchParam}_${userId}`)
      .setLabel(isKo ? (isShinyFilter ? "✨ 이로치 ON" : "✨ 이로치") : (isShinyFilter ? "✨ Shiny ON" : "✨ Shiny"))
      .setStyle(isShinyFilter ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`starter_togglepass_${gen}_${safePage}_${selectedStarter.dexNumber}_${slotId}_${partyParam}_${flagsParam}_${searchParam}_${userId}`)
      .setLabel(isKo ? (isPassiveFilter ? "🔓 패시브 ON" : "🔓 패시브") : (isPassiveFilter ? "🔓 Passive ON" : "🔓 Passive"))
      .setStyle(isPassiveFilter ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`starter_toggleha_${gen}_${safePage}_${selectedStarter.dexNumber}_${slotId}_${partyParam}_${flagsParam}_${searchParam}_${userId}`)
      .setLabel(isKo ? (isHaFilter ? "🌟 숨특 ON" : "🌟 숨특") : (isHaFilter ? "🌟 HA ON" : "🌟 HA"))
      .setStyle(isHaFilter ? ButtonStyle.Primary : ButtonStyle.Secondary),
    searchBtn
  ];
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row1Btns));

  // ROW 2: Starters 1, 2 + [+⚪] + [Party]
  const row2Btns: ButtonBuilder[] = [
    createSlotBtn(0),
    createSlotBtn(1),
    new ButtonBuilder()
      .setCustomId(`starter_add_${selectedStarter.dexNumber}_${gen}_${safePage}_${slotId}_${partyParam}_${flagsParam}_${searchParam}_${userId}`)
      .setLabel("+⚪")
      .setStyle(ButtonStyle.Success)
      .setDisabled(!canAdd),
    new ButtonBuilder()
      .setCustomId(`starter_openparty_${selectedStarter.dexNumber}_${gen}_${safePage}_${slotId}_${partyParam}_${flagsParam}_${userId}`)
      .setLabel("Party")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(partyStates.length === 0)
  ];
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row2Btns));

  // ROW 3: Starters 3, 4 + Page Jump [ <<< ] + [ >>> ]
  const row3Btns: ButtonBuilder[] = [
    createSlotBtn(2),
    createSlotBtn(3),
    new ButtonBuilder()
      .setCustomId(`starter_page_jumpfirst_${gen}_${safePage}_${selectedStarter.dexNumber}_${slotId}_${partyParam}_${flagsParam}_${searchParam}_${userId}`)
      .setLabel("<<<")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(safePage <= 1),
    new ButtonBuilder()
      .setCustomId(`starter_page_jumplast_${gen}_${safePage}_${selectedStarter.dexNumber}_${slotId}_${partyParam}_${flagsParam}_${searchParam}_${userId}`)
      .setLabel(">>>")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(safePage >= totalPages)
  ];
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row3Btns));

  // ROW 4: Starters 5, 6 + Prev Page [ < ] + Next Page [ > ]
  const row4Btns: ButtonBuilder[] = [
    createSlotBtn(4),
    createSlotBtn(5),
    new ButtonBuilder()
      .setCustomId(`starter_page_prev_${gen}_${safePage}_${selectedStarter.dexNumber}_${slotId}_${partyParam}_${flagsParam}_${searchParam}_${userId}`)
      .setLabel("<")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(safePage <= 1),
    new ButtonBuilder()
      .setCustomId(`starter_page_next_${gen}_${safePage}_${selectedStarter.dexNumber}_${slotId}_${partyParam}_${flagsParam}_${searchParam}_${userId}`)
      .setLabel(">")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(safePage >= totalPages)
  ];
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row4Btns));

  // ROW 5: Starters 7, 8 + 🚀 모험 시작 + ↩️ 뒤로가기
  const backBtn = hasSearch
    ? new ButtonBuilder()
        .setCustomId(`starter_clearsearch_back_${gen}_${safePage}_${selectedStarter.dexNumber}_${slotId}_${partyParam}_${flagsParam}_${userId}`)
        .setLabel("↩️")
        .setStyle(ButtonStyle.Danger)
    : new ButtonBuilder()
        .setCustomId(`starter_back_title_${userId}`)
        .setLabel("↩️")
        .setStyle(ButtonStyle.Danger);

  const row5Btns: ButtonBuilder[] = [
    createSlotBtn(6),
    createSlotBtn(7),
    new ButtonBuilder()
      .setCustomId(`starter_start_${slotId}_${partyParam}_${flagsParam}_${userId}`)
      .setLabel("START")
      .setStyle(ButtonStyle.Success)
      .setDisabled(!canStart),
    backBtn
  ];
  components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row5Btns));

  return { embeds: [], files: [attachment], attachments: [], components };
}

function scheduleStarterSelectInGameMessageDismiss(
  client: ExtendedClient,
  interaction: any,
  slotId: number,
  gen: number,
  page: number,
  dexNo: number,
  partyParam: string,
  isShiny: boolean,
  isHa: boolean,
  isPassive: boolean,
  searchQuery: string = "",
  inGameMsg?: InGameMessage
) {
  if (!inGameMsg || !interaction.message) return;

  const totalLen = (inGameMsg.title?.length || 0) + (inGameMsg.text?.length || 0);
  const duration = Math.min(6500, Math.max(2500, 1800 + totalLen * 45));

  const token = Date.now();
  const userKey = `${interaction.user.id}_${interaction.message.id}`;
  activeDismissTokens.set(userKey, token);

  setTimeout(async () => {
    try {
      if (activeDismissTokens.get(userKey) !== token) {
        return;
      }
      const refreshedData = await renderStarterSelectMessageData(
        client,
        interaction.user.id,
        slotId,
        gen,
        page,
        dexNo,
        partyParam,
        isShiny,
        isHa,
        isPassive,
        searchQuery
      );
      if (activeDismissTokens.get(userKey) !== token) {
        return;
      }
      await interaction.editReply(refreshedData);
      activeDismissTokens.delete(userKey);
    } catch {}
  }, duration);
}

// Track active in-game message auto-dismiss timers per user/message
const activeDismissTokens = new Map<string, number>();

function scheduleInGameMessageDismiss(
  client: ExtendedClient,
  interaction: any,
  slotId: number,
  gen: number,
  page: number,
  dexNo: number,
  partyParam: string,
  isShiny: boolean,
  isHa: boolean,
  isPassive: boolean,
  currentIdx: number,
  tab: PartyViewTab,
  moveIdx: number,
  inGameMsg?: InGameMessage,
  targetMoveSlot: number = 0
) {
  if (!inGameMsg || !interaction.message) return;

  const totalLen = (inGameMsg.title?.length || 0) + (inGameMsg.text?.length || 0);
  // Base 2500ms minimum, +45ms per character for natural reading speed, capped at 7500ms max
  const duration = Math.min(7500, Math.max(2500, 1800 + totalLen * 45));

  const token = Date.now();
  const userKey = `${interaction.user.id}_${interaction.message.id}`;
  activeDismissTokens.set(userKey, token);

  setTimeout(async () => {
    try {
      if (activeDismissTokens.get(userKey) === token) {
        activeDismissTokens.delete(userKey);
        const cleanPartyData = await renderPartyViewMessageData(
          client,
          interaction.user.id,
          slotId,
          gen,
          page,
          dexNo,
          partyParam,
          isShiny,
          isHa,
          isPassive,
          currentIdx,
          tab,
          moveIdx,
          undefined, // Auto-dismiss message box
          targetMoveSlot
        );
        await interaction.message.edit(cleanPartyData);
      }
    } catch {
      // Message deleted or expired, gracefully ignore
    }
  }, duration);
}

export async function renderPartyViewMessageData(
  client: ExtendedClient,
  userId: string,
  slotId: number = 1,
  gen: number = 0,
  page: number = 1,
  selectedDexNo: number = 1,
  partyParamInput: string | number[] = "empty",
  isShinyFilter: boolean = false,
  isHaFilter: boolean = false,
  isPassiveFilter: boolean = false,
  selectedPartyIdx: number = -1,
  partyTab: PartyViewTab = "moves",
  selectedMoveIdx: number = 0,
  inGameMessage?: InGameMessage,
  targetMoveSlot: number = 0
) {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";
  const userStarters = getUserStarters(userId);
  const partyStates = parsePartyParam(partyParamInput, userStarters, userId);

  const selectedParty: StarterSelectPartyItem[] = partyStates
    .map((st) => {
      const s = getStarterByDexNumber(st.dexNumber);
      if (!s) return null;
      return {
        dexNumber: s.dexNumber,
        speciesId: s.speciesId,
        name: isKo ? s.nameKo : s.name,
        cost: st.usePassive ? s.reducedCost : s.cost,
        isShiny: st.shinyTier > 0,
        shinyTier: st.shinyTier,
        useHiddenAbility: st.useHiddenAbility,
        usePassive: st.usePassive,
        moves: st.moves,
      };
    })
    .filter(Boolean) as StarterSelectPartyItem[];

  const currentCost = selectedParty.reduce((sum, p) => sum + p.cost, 0);
  const canStart = selectedParty.length >= 1 && currentCost <= DEFAULT_MAX_COST;

  const safePartyIdx = (selectedPartyIdx !== undefined && selectedPartyIdx >= 0 && selectedParty[selectedPartyIdx])
    ? selectedPartyIdx
    : (selectedParty.length > 0 ? 0 : -1);
  const activePartyMember = safePartyIdx >= 0 ? selectedParty[safePartyIdx] : undefined;
  const inspectedStarter = activePartyMember ? getStarterByDexNumber(activePartyMember.dexNumber) : undefined;

  const imageBuffer = await renderStarterSelectScreen({
    selectedStarter: inspectedStarter || STARTER_DATABASE[0],
    currentGen: gen,
    currentPage: page,
    totalPages: 1,
    startersList: [],
    selectedParty,
    userStarters,
    isShinyFilter,
    isHaFilter,
    isPassiveFilter,
    maxCost: DEFAULT_MAX_COST,
    lang: profile.language,
    isPartyView: true,
    selectedPartyIdx: safePartyIdx,
    partyTab,
    selectedMoveIdx,
    targetMoveSlot: partyTab === "learnable" ? targetMoveSlot : selectedMoveIdx,
    inGameMessage,
  });

  const attachment = new AttachmentBuilder(imageBuffer, { name: "party_view.png" });
  const partyParam = serializePartyParam(partyStates, userId);
  const flagsParam = `${isShinyFilter ? 1 : 0}_${isHaFilter ? 1 : 0}_${isPassiveFilter ? 1 : 0}`;

  // Helper to create Party Slot Selector Button (P1, P2, P3, P4, P5, P6)
  // Selected slot is highlighted in Primary and disabled!
  const createPartySlotBtn = (idx: number) => {
    const member = selectedParty[idx];
    if (!member) {
      return new ButtonBuilder()
        .setCustomId(`party_slot_empty_${idx}_${userId}`)
        .setLabel(`P${idx + 1}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    }
    const isSelected = safePartyIdx === idx;
    return new ButtonBuilder()
      .setCustomId(`party_pick_${idx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_0_${userId}`)
      .setLabel(`P${idx + 1}`)
      .setStyle(isSelected ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(isSelected);
  };

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  // ROW 1 (TOP): Tab Switchers (⚔️ Moves / ✨ Shiny) + Ability/Passive Toggles
  const inspectedProg = inspectedStarter ? userStarters.get(inspectedStarter.speciesId) : null;
  const maxShinyTier = inspectedProg?.shinyTier || 0;
  const curShinyTier = activePartyMember?.shinyTier || 0;
  const hasHa = inspectedProg?.hasHiddenAbility || false;
  const curUseHa = activePartyMember?.useHiddenAbility || false;
  const hasPassive = inspectedProg?.passiveUnlocked || false;
  const curUsePassive = activePartyMember?.usePassive || false;

  // ROW 1 (TOP): Ability, Hidden Ability, and Passive Information
  // Active ability/passive shown on the UI is highlighted in Primary (Blue), others in Secondary (Grey)
  const abilityName = inspectedStarter
    ? (isKo ? inspectedStarter.abilityKo : inspectedStarter.ability)
    : "-";
  const haName = inspectedStarter && inspectedStarter.hiddenAbility
    ? (isKo ? inspectedStarter.hiddenAbilityKo : inspectedStarter.hiddenAbility)
    : "-";
  const passName = inspectedStarter && inspectedStarter.passiveAbility
    ? (isKo ? inspectedStarter.passiveAbilityKo : inspectedStarter.passiveAbility)
    : "-";

  // Active states
  const isNormalAbActive = Boolean(inspectedStarter && !curUseHa);
  const isHaActive = Boolean(inspectedStarter && hasHa && curUseHa);
  const isPassiveActive = Boolean(inspectedStarter && hasPassive && curUsePassive);

  let abBtnLabel = isKo ? `🌟 특성: ${abilityName}` : `🌟 Ab: ${abilityName}`;
  let haBtnLabel = isKo ? "🔒 숨특: -" : "🔒 HA: -";
  if (inspectedStarter) {
    haBtnLabel = hasHa
      ? (isKo ? `🌟 숨특: ${haName}` : `🌟 HA: ${haName}`)
      : (isKo ? `🔒 숨특 (${haName})` : `🔒 HA (${haName})`);
  }

  let passBtnLabel = isKo ? "🔒 패시브: -" : "🔒 Pass: -";
  if (inspectedStarter) {
    passBtnLabel = hasPassive
      ? (isKo ? `🔓 패시브: ${passName}` : `🔓 Pass: ${passName}`)
      : (isKo ? `🔒 패시브 (${passName})` : `🔒 Pass (${passName})`);
  }

  // Ability Button Styles:
  // - 활성화 상태 (Active / Equipped): Primary (Blue)
  // - 비활성화/기본 상태 (Inactive / Default): Secondary (Grey)
  const normalAbStyle = isNormalAbActive ? ButtonStyle.Primary : ButtonStyle.Secondary;
  const haStyle = isHaActive ? ButtonStyle.Primary : ButtonStyle.Secondary;
  const passStyle = isPassiveActive ? ButtonStyle.Primary : ButtonStyle.Secondary;

  if (partyTab !== "learnable") {
    // ROW 1 (TOP): Ability, Hidden Ability, and Passive Information
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`party_setha_0_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${selectedMoveIdx}_${userId}`)
          .setLabel(abBtnLabel.slice(0, 20))
          .setStyle(normalAbStyle)
          .setDisabled(false),
        new ButtonBuilder()
          .setCustomId(`party_setha_1_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${selectedMoveIdx}_${userId}`)
          .setLabel(haBtnLabel.slice(0, 20))
          .setStyle(haStyle)
          .setDisabled(false),
        new ButtonBuilder()
          .setCustomId(`party_togglepass_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${selectedMoveIdx}_${userId}`)
          .setLabel(passBtnLabel.slice(0, 20))
          .setStyle(passStyle)
          .setDisabled(false)
      )
    );

    // ROW 2: Party 1, 2 + Tabs [⚔️ 기술] + [✨ 이로치 폼] + [🍬 코스트]
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        createPartySlotBtn(0),
        createPartySlotBtn(1),
        new ButtonBuilder()
          .setCustomId(`party_tab_moves_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${selectedMoveIdx}_${userId}`)
          .setLabel(isKo ? "⚔️ 기술" : "⚔️ Moves")
          .setStyle(partyTab === "moves" ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`party_tab_shiny_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${selectedMoveIdx}_${userId}`)
          .setLabel(isKo ? "✨ 이로치" : "✨ Shiny")
          .setStyle(partyTab === "shiny" ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`party_tab_cost_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${selectedMoveIdx}_${userId}`)
          .setLabel(isKo ? "🍬 코스트" : "🍬 Cost")
          .setStyle(partyTab === "cost" ? ButtonStyle.Primary : ButtonStyle.Secondary)
      )
    );
  }

  // Helper to create Move Slot Buttons (1, 2, 3, 4) - All slots clickable (even if empty)
  const starterMoves = inspectedStarter?.starterMoves || [];
  const createMoveSlotBtn = (mIdx: number) => {
    const isSelected = partyTab === "moves" && selectedMoveIdx === mIdx;
    const label = isKo ? `기술 ${mIdx + 1}` : `Move ${mIdx + 1}`;

    return new ButtonBuilder()
      .setCustomId(`party_pickmove_${mIdx}_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${userId}`)
      .setLabel(label)
      .setStyle(isSelected ? ButtonStyle.Primary : ButtonStyle.Secondary);
  };

  // Helper to create Shiny Tier Buttons (⚪, 🟡, 🔵, 🔴)
  const createShinyTierBtn = (t: number) => {
    const maxShinyTier = inspectedProg?.shinyTier || 0;
    const curShinyTier = activePartyMember?.shinyTier || 0;
    const isUnlocked = t === 0 || t <= maxShinyTier;
    const isCurrent = curShinyTier === t;
    const circleLabels = ["⚪", "🟡", "🔵", "🔴"];
    return new ButtonBuilder()
      .setCustomId(`party_setshiny_${t}_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${selectedMoveIdx}_${userId}`)
      .setLabel(circleLabels[t] || "⚪")
      .setStyle(isCurrent ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(!isUnlocked);
  };

  // Helper for Move Change Button (💿)
  const moveChangeBtn = new ButtonBuilder()
    .setCustomId(`party_move_change_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${selectedMoveIdx}_${userId}`)
    .setLabel(isKo ? "💿 교체" : "💿 Change")
    .setStyle(ButtonStyle.Success)
    .setDisabled(!inspectedStarter);

  if (partyTab === "learnable") {
    const starterMoves = inspectedStarter?.starterMoves || [];
    const equippedMoves = (activePartyMember?.moves && activePartyMember.moves.length > 0) ? activePartyMember.moves : starterMoves;
    const eggMoves: string[] = inspectedProg?.eggMoves || [];
    const allMoves = getLearnableMoves(inspectedStarter?.speciesId, starterMoves, eggMoves);

    // The slot being replaced (0..3):
    const moveBeingReplaced = equippedMoves[targetMoveSlot];

    const itemsPerPage = 6;
    const totalPages = Math.max(1, Math.ceil(allMoves.length / itemsPerPage));
    const selectedLearnableIdx = Math.min(Math.max(0, selectedMoveIdx || 0), allMoves.length - 1);
    const currentLearnablePage = Math.floor(selectedLearnableIdx / itemsPerPage) + 1;
    const startIdx = (currentLearnablePage - 1) * itemsPerPage;
    const pageMoves = allMoves.slice(startIdx, startIdx + itemsPerPage);

    // Up to 6 Move selection buttons for current page (split into rows of 3)
    const moveButtons = pageMoves.map((mName, i) => {
      const gIdx = startIdx + i;
      const moveKey = mName.toLowerCase().replace(/[\s_]+/g, "-");
      const mInfo = MOVES_DATA[moveKey];
      const mDisplay = isKo ? (mInfo?.nameKo || mName) : mName;
      const isBeingReplaced = mName === moveBeingReplaced;
      const isSelected = selectedLearnableIdx === gIdx;
      const isEquipped = equippedMoves.includes(mName);

      let style = ButtonStyle.Secondary;
      if (isBeingReplaced) {
        style = ButtonStyle.Danger; // Red button for the move that will be replaced!
      } else if (isSelected) {
        style = ButtonStyle.Primary; // Blue button for currently selected move!
      } else if (isEquipped) {
        style = ButtonStyle.Success; // Green button for other equipped moves!
      }

      return new ButtonBuilder()
        .setCustomId(`party_learnpick_${gIdx}_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${targetMoveSlot}_${userId}`)
        .setLabel(`${gIdx + 1}. ${mDisplay}`.slice(0, 20))
        .setStyle(style);
    });

    if (moveButtons.length === 0) {
      moveButtons.push(
        new ButtonBuilder()
          .setCustomId(`party_nomoves_${userId}`)
          .setLabel(isKo ? "배울 수 있는 기술 없음" : "No Moves Available")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    }

    if (moveButtons.length <= 3) {
      components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(moveButtons));
    } else {
      components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(moveButtons.slice(0, 3)));
      components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(moveButtons.slice(3, 6)));
    }

    // ROW 4: Navigation [< Prev], [> Next], [✅ 장착 / 🔄 Swap]
    const prevPageIdx = Math.max(0, (currentLearnablePage - 2) * itemsPerPage);
    const nextPageIdx = Math.min(allMoves.length - 1, currentLearnablePage * itemsPerPage);
    const selectedMoveName = allMoves[selectedLearnableIdx] || "";
    const chosenMoveKey = selectedMoveName.toLowerCase().replace(/[\s_]+/g, "-");
    const chosenMoveInfo = MOVES_DATA[chosenMoveKey];
    const chosenDisplayName = isKo ? (chosenMoveInfo?.nameKo || selectedMoveName) : selectedMoveName;

    const isOtherEquipped = equippedMoves.includes(selectedMoveName) && selectedMoveName !== moveBeingReplaced;
    const equipBtnLabel = isOtherEquipped
      ? (isKo ? "🔄 Swap" : "🔄 Swap")
      : (isKo ? "✅ 장착" : "✅ Equip");

    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`party_learnprev_${prevPageIdx}_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${targetMoveSlot}_${userId}`)
          .setLabel("◀")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentLearnablePage <= 1),
        new ButtonBuilder()
          .setCustomId(`party_learnnext_${nextPageIdx}_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${targetMoveSlot}_${userId}`)
          .setLabel("▶")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentLearnablePage >= totalPages),
        new ButtonBuilder()
          .setCustomId(`party_learnequip_${selectedLearnableIdx}_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${targetMoveSlot}_${userId}`)
          .setLabel(equipBtnLabel)
          .setStyle(ButtonStyle.Success)
          .setDisabled(!selectedMoveName)
      )
    );

    // ROW 3: [↩️ 돌아가기 / Back] (Returns to 4-slot Moves screen)
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`party_learnback_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${targetMoveSlot}_${userId}`)
          .setLabel(isKo ? "↩️ 돌아가기" : "↩️ Back")
          .setStyle(ButtonStyle.Danger)
      )
    );
  } else if (partyTab === "shiny") {
    // ROW 3: Party 3, 4 + [ ⚪ 일반 폼 ] + [ ★1 옐로 ]
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        createPartySlotBtn(2),
        createPartySlotBtn(3),
        createShinyTierBtn(0),
        createShinyTierBtn(1)
      )
    );

    // ROW 4: Party 5, 6 + [ ★★2 블루 ] + [ ★★★3 레드 ]
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        createPartySlotBtn(4),
        createPartySlotBtn(5),
        createShinyTierBtn(2),
        createShinyTierBtn(3)
      )
    );

    // ROW 5: Remove [-⚪] + Back [↩️]
    const removeTargetDex = activePartyMember ? activePartyMember.dexNumber : 0;
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`party_remove_${safePartyIdx}_${removeTargetDex}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${selectedMoveIdx}_${userId}`)
          .setLabel(isKo ? "-⚪ 파티 제외" : "-⚪ Remove")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!activePartyMember || safePartyIdx === -1),
        new ButtonBuilder()
          .setCustomId(`party_back_starter_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${userId}`)
          .setLabel(isKo ? "↩️ 스타팅 목록" : "↩️ Back")
          .setStyle(ButtonStyle.Danger)
      )
    );
  } else if (partyTab === "cost") {
    // Candy and Cost variables
    const userCandies = inspectedProg?.candies || 0;
    const passiveCost = inspectedStarter ? Math.max(5, inspectedStarter.cost * 3) : 10;
    const hasPassiveUnlocked = Boolean(inspectedProg?.passiveUnlocked);
    const canUnlockPassive = !hasPassiveUnlocked && userCandies >= passiveCost;

    const reductionCount = activePartyMember?.cost !== undefined && inspectedStarter && activePartyMember.cost < inspectedStarter.cost
      ? (inspectedStarter.cost - activePartyMember.cost)
      : (inspectedProg?.costReductionCount || 0);
    const nextReductionCost = Math.max(10, (reductionCount + 1) * 15);
    const maxReductionReached = reductionCount >= 2;
    const canReduceCost = !maxReductionReached && userCandies >= nextReductionCost;

    // Passive button in Row 3
    let passiveBtn: ButtonBuilder;
    if (hasPassiveUnlocked) {
      const isPassActive = Boolean(activePartyMember?.usePassive);
      passiveBtn = new ButtonBuilder()
        .setCustomId(`party_cost_togglepass_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${selectedMoveIdx}_${userId}`)
        .setLabel(isPassActive ? (isKo ? "🔓 패시브 ON" : "🔓 Pass ON") : (isKo ? "🔒 패시브 OFF" : "🔒 Pass OFF"))
        .setStyle(isPassActive ? ButtonStyle.Primary : ButtonStyle.Secondary);
    } else {
      passiveBtn = new ButtonBuilder()
        .setCustomId(`party_unlockpass_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${selectedMoveIdx}_${userId}`)
        .setLabel(isKo ? `🔓 패시브 해금 (${passiveCost}🍬)` : `🔓 Unlock (${passiveCost}🍬)`)
        .setStyle(canUnlockPassive ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!canUnlockPassive);
    }

    // Cost Reduction button in Row 4
    let costBtn: ButtonBuilder;
    if (maxReductionReached) {
      costBtn = new ButtonBuilder()
        .setCustomId(`party_costmax_${userId}`)
        .setLabel(isKo ? "MAX 코스트 (-2C)" : "MAX Cost (-2C)")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    } else {
      costBtn = new ButtonBuilder()
        .setCustomId(`party_reducecost_${safePartyIdx}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${selectedMoveIdx}_${userId}`)
        .setLabel(isKo ? `📉 코스트 감소 (${nextReductionCost}🍬)` : `📉 Reduce Cost (${nextReductionCost}🍬)`)
        .setStyle(canReduceCost ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!canReduceCost);
    }

    // ROW 3: Party 3, 4 + Passive Action Button
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        createPartySlotBtn(2),
        createPartySlotBtn(3),
        passiveBtn
      )
    );

    // ROW 4: Party 5, 6 + Cost Reduction Action Button
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        createPartySlotBtn(4),
        createPartySlotBtn(5),
        costBtn
      )
    );

    // ROW 5: Remove [-⚪] + Back [↩️]
    const removeTargetDex = activePartyMember ? activePartyMember.dexNumber : 0;
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`party_remove_${safePartyIdx}_${removeTargetDex}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${selectedMoveIdx}_${userId}`)
          .setLabel(isKo ? "-⚪ 파티 제외" : "-⚪ Remove")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!activePartyMember || safePartyIdx === -1),
        new ButtonBuilder()
          .setCustomId(`party_back_starter_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${userId}`)
          .setLabel(isKo ? "↩️ 스타팅 목록" : "↩️ Back")
          .setStyle(ButtonStyle.Danger)
      )
    );
  } else {
    // ROW 3: Party 3, 4 + [ 1: 기술1 ] + [ 2: 기술2 ] + [ 💿 Change ]
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        createPartySlotBtn(2),
        createPartySlotBtn(3),
        createMoveSlotBtn(0),
        createMoveSlotBtn(1),
        moveChangeBtn
      )
    );

    // ROW 4: Party 5, 6 + [ 3: 기술3 ] + [ 4: 기술4 ]
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        createPartySlotBtn(4),
        createPartySlotBtn(5),
        createMoveSlotBtn(2),
        createMoveSlotBtn(3)
      )
    );

    // ROW 5: Remove [-⚪] + Back [↩️]
    const removeTargetDex = activePartyMember ? activePartyMember.dexNumber : 0;
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`party_remove_${safePartyIdx}_${removeTargetDex}_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${partyTab}_${selectedMoveIdx}_${userId}`)
          .setLabel(isKo ? "-⚪ 파티 제외" : "-⚪ Remove")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!activePartyMember || safePartyIdx === -1),
        new ButtonBuilder()
          .setCustomId(`party_back_starter_${gen}_${page}_${selectedDexNo}_${slotId}_${partyParam}_${flagsParam}_${userId}`)
          .setLabel(isKo ? "↩️ 스타팅 목록" : "↩️ Back")
          .setStyle(ButtonStyle.Danger)
      )
    );
  }

  const validComponents = components.filter((row) => row.components.length >= 1 && row.components.length <= 5);
  return { embeds: [], files: [attachment], attachments: [], components: validComponents };
}

async function renderEggGachaMessageData(client: ExtendedClient, userId: string, selectedMachine: "shiny" | "move" | "legendary" = "shiny") {
  const profile = saveService.getProfile(userId);
  const isKo = profile.language === "ko";
  const userEggs = getUserEggs(userId);

  const imageBuffer = await renderEggGachaScreen({
    selectedMachine,
    eggs: userEggs.map((e) => ({
      id: e.id,
      tier: e.tier,
      stepsRequired: e.stepsRequired,
      stepsProgress: e.stepsProgress,
      shinyTier: e.shinyTier,
    })),
    lang: profile.language,
  });

  const attachment = new AttachmentBuilder(imageBuffer, { name: "egg_gacha.png" });

  // ROW 1: Machine Selection Buttons
  const machineRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`egg_select_shiny_${userId}`)
      .setLabel(isKo ? "✨ 이로치 UP" : "✨ Shiny UP")
      .setStyle(selectedMachine === "shiny" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`egg_select_move_${userId}`)
      .setLabel(isKo ? "💥 알기술 UP" : "💥 Move UP")
      .setStyle(selectedMachine === "move" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`egg_select_legendary_${userId}`)
      .setLabel(isKo ? "👑 전설 픽업" : "👑 Legendary UP")
      .setStyle(selectedMachine === "legendary" ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  // ROW 2: Pull Buttons (1 Pull / 5 Pulls / Title Back)
  const pullRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`egg_pull_1_${selectedMachine}_${userId}`)
      .setLabel(isKo ? "🥚 1회 뽑기" : "🥚 Pull 1")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`egg_pull_5_${selectedMachine}_${userId}`)
      .setLabel(isKo ? "🥚 5회 연속 뽑기" : "🥚 Pull 5")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`starter_back_title_${userId}`)
      .setLabel("↩️")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [], files: [attachment], components: [machineRow, pullRow] };
}

export async function renderTitleMessageData(client: ExtendedClient, userId: string) {
  const hasSavedSlots = saveService.hasAnySavedSlot(userId);
  const userProfile = saveService.getProfile(userId);
  const activeRun = userProfile.activeSlotId ? userProfile.slots[userProfile.activeSlotId] : null;
  const isKo = userProfile.language === "ko";

  const user = client?.users?.cache?.get(userId) || (await client?.users?.fetch(userId).catch(() => null));
  const avatarUrl = user?.displayAvatarURL?.({ extension: "png", size: 64 });
  const username = user?.username || "Trainer";

  const imageBuffer = await renderTitleScreen({
    username,
    avatarUrl,
    hasSavedSlots,
    party: activeRun?.party,
    lang: userProfile.language,
  });
  const attachment = new AttachmentBuilder(imageBuffer, { name: "title.png" });

  // ROW 1: Main Game Actions (1. Continue / 2. New Game / 3. Load Game / 4. Multiplay)
  const mainActionRow = new ActionRowBuilder<ButtonBuilder>();
  if (hasSavedSlots) {
    const activeSlotId = userProfile.activeSlotId || 1;
    mainActionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`menu_continue_${activeSlotId}_${userId}`)
        .setLabel(isKo ? "이어하기" : "Continue")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`menu_newgame_${userId}`)
        .setLabel(isKo ? "새 게임" : "New Game")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`menu_loadgame_${userId}`)
        .setLabel(isKo ? "불러오기" : "Load Game")
        .setStyle(ButtonStyle.Secondary),
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

  // ROW 2: Utility & Settings Actions (Bag, Egg Gacha, Settings)
  const subActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`menu_inventory_${userId}`)
      .setLabel("💼")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`menu_egg_gacha_${userId}`)
      .setLabel("🥚")
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
    try {
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

    // 2. Modal Submits
    if (interaction.isModalSubmit()) {
      // 2-A. Starter Pokemon Search Modal Submit (🔍)
      if (interaction.customId.startsWith("modal_starter_search_")) {
        const parts = interaction.customId.split("_");
        const currentGen = parseInt(parts[3], 10) || 0;
        const currentPage = parseInt(parts[4], 10) || 1;
        const currentDexNo = parseInt(parts[5], 10) || 1;
        const slotId = parseInt(parts[6], 10) || 1;
        const partyRaw = parts[7] || "empty";
        const isShiny = parts[8] === "1";
        const isHa = parts[9] === "1";
        const isPassive = parts[10] === "1";

        const rawQuery = interaction.fields.getTextInputValue("starter_search_query")?.trim() || "";
        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        if (!rawQuery) {
          await (interaction as any).deferUpdate();
          return;
        }

        const client = interaction.client as ExtendedClient;
        const userStarters = getUserStarters(interaction.user.id);
        let allUnlockedStarters = getStartersByGen(0).filter((s) => userStarters.get(s.speciesId)?.isUnlocked);
        if (isShiny) allUnlockedStarters = allUnlockedStarters.filter((s) => (userStarters.get(s.speciesId)?.shinyTier || 0) > 0);
        if (isHa) allUnlockedStarters = allUnlockedStarters.filter((s) => userStarters.get(s.speciesId)?.hasHiddenAbility);
        if (isPassive) allUnlockedStarters = allUnlockedStarters.filter((s) => userStarters.get(s.speciesId)?.passiveUnlocked);

        const matches = findMatchingStarters(rawQuery, allUnlockedStarters);

        let inGameMsg: InGameMessage | undefined = undefined;
        let finalSearchQuery = rawQuery;
        let targetDex = currentDexNo;

        if (matches.length === 0) {
          inGameMsg = {
            title: isKo ? "검색 결과 없음" : "No Results Found",
            text: isKo
              ? `'${rawQuery}'에 해당하는 스타팅 포켓몬을 찾을 수 없습니다.`
              : `No starter Pokémon found matching '${rawQuery}'.`,
            type: "info",
          };
          finalSearchQuery = "";
        } else {
          targetDex = matches[0].dexNumber;
        }

        const starterData = await renderStarterSelectMessageData(
          client,
          interaction.user.id,
          slotId,
          0,
          1,
          targetDex,
          partyRaw,
          isShiny,
          isHa,
          isPassive,
          finalSearchQuery,
          inGameMsg
        );
        await (interaction as any).update(starterData);

        if (inGameMsg) {
          scheduleStarterSelectInGameMessageDismiss(
            client,
            interaction,
            slotId,
            0,
            1,
            targetDex,
            partyRaw,
            isShiny,
            isHa,
            isPassive,
            "",
            inGameMsg
          );
        }
        return;
      }

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
      if (interaction.message) {
        const userKey = `${interaction.user.id}_${interaction.message.id}`;
        activeDismissTokens.set(userKey, Date.now()); // Invalidate pending dismiss timer immediately!
      }

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
        await handlePokedexInteractionUpdate(interaction, client, interaction.user.id, 1, 1, "multiplay");
        return;
      }

      // 3-0-6-B. Pokédex Ability Info Button Clicked (Switch Active Ability Dialog on Canvas / Toggle)
      if (customId.startsWith("pokedex_ability_")) {
        const rawAbilityParam = parts[3] || "none";
        const rawAbility = rawAbilityParam === "none" ? undefined : decodeURIComponent(rawAbilityParam);
        const dexNo = parseInt(parts[4], 10) || 1;
        const page = parseInt(parts[5], 10) || 1;
        const fromScreen = (parts[6] || "title") as "multiplay" | "inventory" | "title";

        await handlePokedexInteractionUpdate(interaction, client, interaction.user.id, dexNo, page, fromScreen, rawAbility);
        return;
      }

      // 3-0-7. Pokédex Select Pokémon (Resets ability to idle/unselected)
      if (customId.startsWith("pokedex_select_")) {
        const dexNo = parseInt(parts[2], 10) || 1;
        const page = parseInt(parts[3], 10) || 1;
        const fromScreen = (parts[4] || "title") as "multiplay" | "inventory" | "title";

        await handlePokedexInteractionUpdate(interaction, client, interaction.user.id, dexNo, page, fromScreen, undefined);
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
        const targetPage = parseInt(parts[2], 10) || 1;
        const currentDexNo = parseInt(parts[3], 10) || ((targetPage - 1) * 8 + 1);
        const fromScreen = (parts[4] || "title") as "multiplay" | "inventory" | "title";

        await handlePokedexInteractionUpdate(interaction, client, interaction.user.id, currentDexNo, targetPage, fromScreen, undefined);
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

      // 2-1. New Game Button Clicked from Title (Pure Canvas Starter Select Screen - Defaults to All Gens 0)
      if (customId.startsWith("menu_newgame_")) {
        const targetSlot = saveService.getFirstAvailableSlot(interaction.user.id);
        const starterData = await renderStarterSelectMessageData(client, interaction.user.id, targetSlot, 0, 1, 1, [], false, false, false);
        await interaction.update(starterData);
        return;
      }

      // 2-1-G. Open Generation Selection Menu
      if (customId.startsWith("starter_genmenu_") || customId.startsWith("starter_open_gen_menu_")) {
        const isMenu = customId.startsWith("starter_genmenu_");
        const currentGen = parseInt(parts[isMenu ? 2 : 4], 10) || 0;
        const slotId = parseInt(parts[isMenu ? 3 : 7], 10) || 1;
        const partyParam = parts[isMenu ? 4 : 8] || "empty";
        const flagsParam = isMenu
          ? `${parts[5] || 0}_${parts[6] || 0}_${parts[7] || 0}`
          : `${parts[9] || 0}_${parts[10] || 0}_${parts[11] || 0}`;

        const genData = await renderGenSelectMessageData(client, interaction.user.id, currentGen, slotId, partyParam, flagsParam);
        await interaction.update(genData);
        return;
      }

      // 2-1-H. Pick Specific Generation from Gen Menu or Back Button (Toggle cancel if re-selected)
      if (customId.startsWith("starter_pickgen_") || customId.startsWith("starter_genback_")) {
        const isBack = customId.startsWith("starter_genback_");
        const chosenGen = parseInt(parts[2], 10) || 0;
        const prevGen = parseInt(parts[3], 10) || 0;
        const slotId = parseInt(parts[4], 10) || 1;
        const partyRaw = parts[5] || "empty";
        const isShiny = parts[6] === "1";
        const isHa = parts[7] === "1";
        const isPassive = parts[8] === "1";

        // Toggle generation: If re-selecting the currently active gen, cancel selection (resets to 0 / all gens)
        const nextGen = isBack ? chosenGen : (chosenGen === prevGen ? 0 : chosenGen);

        const genStarters = getStartersByGen(nextGen);
        const firstStarterDex = genStarters[0]?.dexNumber || 1;

        const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotId, nextGen, 1, firstStarterDex, partyRaw, isShiny, isHa, isPassive);
        await interaction.update(starterData);
        return;
      }

      // 2-1-A. Starter Select Pokemon Item Clicked
      if (customId.startsWith("starter_sel_")) {
        const dexNo = parseDexParam(parts[2], 1);
        const gen = parseInt(parts[3], 10) || 0;
        const page = parseInt(parts[4], 10) || 1;
        const slotId = parseInt(parts[5], 10) || 1;
        const partyRaw = parts[6] || "empty";
        const isShiny = parts[7] === "1";
        const isHa = parts[8] === "1";
        const isPassive = parts[9] === "1";
        const searchRaw = parts[10] || "none";
        const searchQ = searchRaw !== "none" ? decodeURIComponent(searchRaw) : "";

        const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, searchQ);
        await interaction.update(starterData);
        return;
      }

      // 2-1-B. Starter Page Navigation (< / > / <<< / >>>)
      if (
        customId.startsWith("starter_page_prev_") ||
        customId.startsWith("starter_page_next_") ||
        customId.startsWith("starter_page_jumpfirst_") ||
        customId.startsWith("starter_page_jumplast_")
      ) {
        const action = parts[2]; // 'prev' | 'next' | 'jumpfirst' | 'jumplast'
        const gen = parseInt(parts[3], 10) || 0;
        const curPage = parseInt(parts[4], 10) || 1;
        const currentDexNo = parseDexParam(parts[5], 1);
        const slotId = parseInt(parts[6], 10) || 1;
        const partyRaw = parts[7] || "empty";
        const isShiny = parts[8] === "1";
        const isHa = parts[9] === "1";
        const isPassive = parts[10] === "1";
        const searchRaw = parts[11] || "none";
        const searchQ = searchRaw !== "none" ? decodeURIComponent(searchRaw) : "";

        const userStarters = getUserStarters(interaction.user.id);
        let allStarters = getStartersByGen(gen).filter((s) => userStarters.get(s.speciesId)?.isUnlocked);
        if (isShiny) allStarters = allStarters.filter((s) => (userStarters.get(s.speciesId)?.shinyTier || 0) > 0);
        if (isHa) allStarters = allStarters.filter((s) => userStarters.get(s.speciesId)?.hasHiddenAbility);
        if (isPassive) allStarters = allStarters.filter((s) => userStarters.get(s.speciesId)?.passiveUnlocked);
        if (searchQ) allStarters = findMatchingStarters(searchQ, allStarters);

        const totalPages = Math.max(1, Math.ceil(allStarters.length / 8));
        let targetPage = curPage;

        if (action === "prev") targetPage = Math.max(1, curPage - 1);
        else if (action === "next") targetPage = Math.min(totalPages, curPage + 1);
        else if (action === "jumpfirst") targetPage = 1;
        else if (action === "jumplast") targetPage = totalPages;

        const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotId, gen, targetPage, currentDexNo, partyRaw, isShiny, isHa, isPassive, searchQ);
        await interaction.update(starterData);
        return;
      }

      // 2-1-T1. Starter Toggle Shiny (✨ 이로치)
      if (customId.startsWith("starter_toggleshiny_")) {
        const gen = parseInt(parts[2], 10) || 0;
        const page = parseInt(parts[3], 10) || 1;
        const dexNo = parseDexParam(parts[4], 1);
        const slotId = parseInt(parts[5], 10) || 1;
        const partyRaw = parts[6] || "empty";
        const isShiny = parts[7] === "1";
        const isHa = parts[8] === "1";
        const isPassive = parts[9] === "1";
        const searchRaw = parts[10] || "none";
        const searchQ = searchRaw !== "none" ? decodeURIComponent(searchRaw) : "";

        const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, !isShiny, isHa, isPassive, searchQ);
        await interaction.update(starterData);
        return;
      }

      // 2-1-T2. Starter Toggle Passive / Reduced Cost (🔓 패시브)
      if (customId.startsWith("starter_togglepass_")) {
        const gen = parseInt(parts[2], 10) || 0;
        const page = parseInt(parts[3], 10) || 1;
        const dexNo = parseDexParam(parts[4], 1);
        const slotId = parseInt(parts[5], 10) || 1;
        const partyRaw = parts[6] || "empty";
        const isShiny = parts[7] === "1";
        const isHa = parts[8] === "1";
        const isPassive = parts[9] === "1";
        const searchRaw = parts[10] || "none";
        const searchQ = searchRaw !== "none" ? decodeURIComponent(searchRaw) : "";

        const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, !isPassive, searchQ);
        await interaction.update(starterData);
        return;
      }

      // 2-1-SEARCH. Starter Open Search Modal (🔍)
      if (customId.startsWith("starter_opensearch_")) {
        const gen = parseInt(parts[2], 10) || 0;
        const page = parseInt(parts[3], 10) || 1;
        const dexNo = parseDexParam(parts[4], 1);
        const slotId = parseInt(parts[5], 10) || 1;
        const partyRaw = parts[6] || "empty";
        const isShiny = parts[7] === "1";
        const isHa = parts[8] === "1";
        const isPassive = parts[9] === "1";

        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        const modal = new ModalBuilder()
          .setCustomId(`modal_starter_search_${gen}_${page}_${dexNo}_${slotId}_${partyRaw}_${isShiny ? "1" : "0"}_${isHa ? "1" : "0"}_${isPassive ? "1" : "0"}_${interaction.user.id}`)
          .setTitle(isKo ? "🔍 포켓몬 검색" : "🔍 Pokémon Search");

        const searchInput = new TextInputBuilder()
          .setCustomId("starter_search_query")
          .setLabel(isKo ? "포켓몬 이름 또는 도감 번호" : "Pokémon Name or Dex Number")
          .setPlaceholder(isKo ? "예: 피카츄, 리자몽, 25, pikachu..." : "e.g. Pikachu, Charizard, 25...")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(30);

        const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(searchInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
        return;
      }

      // 2-1-CLEARSEARCH. Starter Clear Search Filter (🔍 ✕ or ↩️)
      if (customId.startsWith("starter_clearsearch_")) {
        const isPrefixed = parts[2] === "top" || parts[2] === "back";
        const offset = isPrefixed ? 1 : 0;
        const gen = parseInt(parts[2 + offset], 10) || 0;
        const page = parseInt(parts[3 + offset], 10) || 1;
        const dexNo = parseDexParam(parts[4 + offset], 1);
        const slotId = parseInt(parts[5 + offset], 10) || 1;
        const partyRaw = parts[6 + offset] || "empty";
        const isShiny = parts[7 + offset] === "1";
        const isHa = parts[8 + offset] === "1";
        const isPassive = parts[9 + offset] === "1";

        const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotId, gen, 1, dexNo, partyRaw, isShiny, isHa, isPassive, "");
        await interaction.update(starterData);
        return;
      }

      // 2-1-T3. Starter Toggle Hidden Ability (🌟 숨특)
      if (customId.startsWith("starter_toggleha_")) {
        const gen = parseInt(parts[2], 10) || 0;
        const page = parseInt(parts[3], 10) || 1;
        const dexNo = parseDexParam(parts[4], 1);
        const slotId = parseInt(parts[5], 10) || 1;
        const partyRaw = parts[6] || "empty";
        const isShiny = parts[7] === "1";
        const isHa = parts[8] === "1";
        const isPassive = parts[9] === "1";
        const searchRaw = parts[10] || "none";
        const searchQ = searchRaw !== "none" ? decodeURIComponent(searchRaw) : "";

        const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, isShiny, !isHa, isPassive, searchQ);
        await interaction.update(starterData);
        return;
      }

      // 2-1-C. Starter Add to Party (+파티추가)
      if (customId.startsWith("starter_add_")) {
        const dexNo = parseDexParam(parts[2], 1);
        const gen = parseInt(parts[3], 10) || 0;
        const page = parseInt(parts[4], 10) || 1;
        const slotId = parseInt(parts[5], 10) || 1;
        const partyRaw = parts[6] || "empty";
        const isShiny = parts[7] === "1";
        const isHa = parts[8] === "1";
        const isPassive = parts[9] === "1";
        const searchRaw = parts[10] || "none";
        const searchQ = searchRaw !== "none" ? decodeURIComponent(searchRaw) : "";

        const userStarters = getUserStarters(interaction.user.id);
        const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);

        if (!partyStates.some((p) => p.dexNumber === dexNo) && partyStates.length < 6) {
          const s = getStarterByDexNumber(dexNo);
          const prog = s ? userStarters.get(s.speciesId) : null;
          partyStates.push({
            dexNumber: dexNo,
            shinyTier: prog?.shinyTier || 0,
            useHiddenAbility: prog?.hasHiddenAbility || false,
            usePassive: prog?.passiveUnlocked || false,
            moves: s ? [...s.starterMoves] : undefined,
          });
        }

        const newPartyParam = serializePartyParam(partyStates, interaction.user.id);
        const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, searchQ);
        await interaction.update(starterData);
        return;
      }

      // 2-1-P1. Open Party View Screen (Party 버튼 클릭)
      if (customId.startsWith("starter_openparty_")) {
        const dexNo = parseDexParam(parts[2], 1);
        const gen = parseInt(parts[3], 10) || 0;
        const page = parseInt(parts[4], 10) || 1;
        const slotId = parseInt(parts[5], 10) || 1;
        const partyRaw = parts[6] || "empty";
        const isShiny = parts[7] === "1";
        const isHa = parts[8] === "1";
        const isPassive = parts[9] === "1";

        const userStarters = getUserStarters(interaction.user.id);
        const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);
        if (partyStates.length === 0) {
          return;
        }

        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, 0, "moves", 0);
        await interaction.update(partyData);
        return;
      }

      // 2-1-P2. Pick Party Member in Party View Screen (With Deselect Toggle)
      if (customId.startsWith("party_pick_")) {
        const rawIdx = parseInt(parts[2], 10);
        const targetIdx = isNaN(rawIdx) ? -1 : rawIdx;
        const gen = parseInt(parts[3], 10) || 0;
        const page = parseInt(parts[4], 10) || 1;
        const dexNo = parseDexParam(parts[5], 1);
        const slotId = parseInt(parts[6], 10) || 1;
        const partyRaw = parts[7] || "empty";
        const isShiny = parts[8] === "1";
        const isHa = parts[9] === "1";
        const isPassive = parts[10] === "1";
        const tab = (parts[11] || "moves") as PartyViewTab;
        const moveIdx = 0; // Always reset to 1st move (slot 0) on switching party member!

        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, targetIdx, tab, moveIdx);
        await interaction.update(partyData);
        return;
      }

      // 2-1-P2-TAB. Switch Tab in Party View (⚔️ moves / ✨ shiny)
      if (customId.startsWith("party_tab_")) {
        const targetTab = parts[2] as PartyViewTab;
        const currentIdx = parseInt(parts[3], 10) || 0;
        const gen = parseInt(parts[4], 10) || 0;
        const page = parseInt(parts[5], 10) || 1;
        const dexNo = parseDexParam(parts[6], 1);
        const slotId = parseInt(parts[7], 10) || 1;
        const partyRaw = parts[8] || "empty";
        const isShiny = parts[9] === "1";
        const isHa = parts[10] === "1";
        const isPassive = parts[11] === "1";
        const moveIdx = parseInt(parts[12], 10) || 0;

        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, currentIdx, targetTab, moveIdx);
        await interaction.update(partyData);
        return;
      }

      // 2-1-P2-CHANGE. Move Change button (💿) -> Switch to learnable moves list!
      if (customId.startsWith("party_move_change_")) {
        const currentIdx = parseInt(parts[3], 10) || 0;
        const gen = parseInt(parts[4], 10) || 0;
        const page = parseInt(parts[5], 10) || 1;
        const dexNo = parseDexParam(parts[6], 1);
        const slotId = parseInt(parts[7], 10) || 1;
        const partyRaw = parts[8] || "empty";
        const isShiny = parts[9] === "1";
        const isHa = parts[10] === "1";
        const isPassive = parts[11] === "1";
        const targetMoveSlot = parseInt(parts[13], 10) || 0;

        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        const inGameMsg: InGameMessage = {
          title: isKo ? `기술 교체 (슬롯 ${targetMoveSlot + 1}번)` : `Move Change (Slot ${targetMoveSlot + 1})`,
          text: isKo
            ? `목록에서 원하는 기술을 선택한 뒤 [장착]을 누르세요.`
            : `Select a move from the list and press [Equip].`,
          type: "info",
        };

        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, currentIdx, "learnable", 0, inGameMsg, targetMoveSlot);
        await interaction.update(partyData);
        scheduleInGameMessageDismiss(client, interaction, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, currentIdx, "learnable", 0, inGameMsg, targetMoveSlot);
        return;
      }

      // 2-1-P2-LEARNPICK. Pick / Inspect Move or Switch Page in Learnable Moves List
      if (
        customId.startsWith("party_learnpick_") ||
        customId.startsWith("party_learnprev_") ||
        customId.startsWith("party_learnnext_") ||
        customId.startsWith("party_learnpage_")
      ) {
        const targetLearnIdx = parseInt(parts[2], 10) || 0;
        const currentIdx = parseInt(parts[3], 10) || 0;
        const gen = parseInt(parts[4], 10) || 0;
        const page = parseInt(parts[5], 10) || 1;
        const dexNo = parseDexParam(parts[6], 1);
        const slotId = parseInt(parts[7], 10) || 1;
        const partyRaw = parts[8] || "empty";
        const isShiny = parts[9] === "1";
        const isHa = parts[10] === "1";
        const isPassive = parts[11] === "1";
        const targetMoveSlot = parseInt(parts[12], 10) || 0;

        let inGameMsg: InGameMessage | undefined = undefined;
        if (customId.startsWith("party_learnpick_")) {
          const userStarters = getUserStarters(interaction.user.id);
          const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);
          const targetMember = partyStates[currentIdx];
          if (targetMember) {
            const s = getStarterByDexNumber(targetMember.dexNumber);
            const prog = s ? userStarters.get(s.speciesId) : null;
            const starterMoves = s?.starterMoves || [];
            const eggMoves: string[] = prog?.eggMoves || [];
            const allMoves = getLearnableMoves(s?.speciesId, starterMoves, eggMoves);
            const chosenMove = allMoves[targetLearnIdx];
            if (chosenMove) {
              const profile = saveService.getProfile(interaction.user.id);
              const isKo = profile.language === "ko";
              const moveKey = chosenMove.toLowerCase().replace(/[\s_]+/g, "-");
              const moveInfo = MOVES_DATA[moveKey];
              const moveName = isKo ? (moveInfo?.nameKo || chosenMove) : chosenMove.toUpperCase();
              const pwrStr = moveInfo?.power ? String(moveInfo.power) : "-";
              const accStr = moveInfo?.accuracy ? `${moveInfo.accuracy}%` : "-";
              const ppStr = `${moveInfo?.pp || 35}`;
              const tDisplay = moveInfo ? (isKo ? (TYPE_NAMES_KO[moveInfo.type.toLowerCase()] || moveInfo.type) : moveInfo.type.toUpperCase()) : "NORMAL";
              const catStr = moveInfo
                ? (isKo ? (moveInfo.category === "physical" ? "물리" : moveInfo.category === "special" ? "특수" : "변화") : moveInfo.category.toUpperCase())
                : "STATUS";
              const desc = isKo
                ? (moveInfo?.description || "효과 설명이 없습니다.")
                : (moveInfo?.descriptionEn || MOVES_EN_DESC[moveKey] || "No description available.");

              inGameMsg = {
                title: moveName,
                text: desc,
                type: "info",
                moveType: moveInfo?.type,
                moveCategory: moveInfo?.category as any,
                movePower: pwrStr,
                moveAccuracy: accStr,
                movePp: ppStr,
              };
            }
          }
        }

        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, currentIdx, "learnable", targetLearnIdx, inGameMsg, targetMoveSlot);
        await interaction.update(partyData);
        if (inGameMsg) {
          scheduleInGameMessageDismiss(client, interaction, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, currentIdx, "learnable", targetLearnIdx, inGameMsg, targetMoveSlot);
        }
        return;
      }

      // 2-1-P2-LEARNBACK. Back from Learnable tab to Moves tab
      if (customId.startsWith("party_learnback_")) {
        const currentIdx = parseInt(parts[2], 10) || 0;
        const gen = parseInt(parts[3], 10) || 0;
        const page = parseInt(parts[4], 10) || 1;
        const dexNo = parseDexParam(parts[5], 1);
        const slotId = parseInt(parts[6], 10) || 1;
        const partyRaw = parts[7] || "empty";
        const isShiny = parts[8] === "1";
        const isHa = parts[9] === "1";
        const isPassive = parts[10] === "1";
        const targetMoveSlot = parseInt(parts[11], 10) || 0;

        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, currentIdx, "moves", targetMoveSlot);
        await interaction.update(partyData);
        return;
      }

      // 2-1-P2-LEARNEQUIP. Equip chosen move from list into party member
      if (customId.startsWith("party_learnequip_")) {
        const targetLearnIdx = parseInt(parts[2], 10) || 0;
        const currentIdx = parseInt(parts[3], 10) || 0;
        const gen = parseInt(parts[4], 10) || 0;
        const page = parseInt(parts[5], 10) || 1;
        const dexNo = parseDexParam(parts[6], 1);
        const slotId = parseInt(parts[7], 10) || 1;
        const partyRaw = parts[8] || "empty";
        const isShiny = parts[9] === "1";
        const isHa = parts[10] === "1";
        const isPassive = parts[11] === "1";
        const targetMoveSlot = Math.min(3, Math.max(0, parseInt(parts[12], 10) || 0));

        const userStarters = getUserStarters(interaction.user.id);
        const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);
        const targetMember = partyStates[currentIdx];

        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";

        if (targetMember) {
          const s = getStarterByDexNumber(targetMember.dexNumber);
          const prog = s ? userStarters.get(s.speciesId) : null;
          const starterMoves = s?.starterMoves || [];
          const eggMoves: string[] = prog?.eggMoves || [];
          const allMoves = getLearnableMoves(s?.speciesId, starterMoves, eggMoves);
          const chosenMove = allMoves[targetLearnIdx];

          if (chosenMove) {
            if (!targetMember.moves || targetMember.moves.length === 0) {
              targetMember.moves = [...starterMoves];
            }
            while (targetMember.moves.length < 4) {
              targetMember.moves.push("---");
            }

            const existingSlotIdx = targetMember.moves.indexOf(chosenMove);
            const isSwap = existingSlotIdx !== -1 && existingSlotIdx !== targetMoveSlot;

            if (isSwap) {
              const oldTargetMove = targetMember.moves[targetMoveSlot];
              targetMember.moves[targetMoveSlot] = chosenMove;
              targetMember.moves[existingSlotIdx] = oldTargetMove;
            } else {
              targetMember.moves[targetMoveSlot] = chosenMove;
            }

            const moveKey = chosenMove.toLowerCase().replace(/[\s_]+/g, "-");
            const mInfo = MOVES_DATA[moveKey];
            const moveName = isKo ? (mInfo?.nameKo || chosenMove) : chosenMove;

            const inGameMsg: InGameMessage = {
              title: isSwap
                ? (isKo ? `기술 맞교체 완료` : `Moves Swapped`)
                : (isKo ? `기술 장착 완료` : `Move Equipped`),
              text: isSwap
                ? (isKo
                    ? `[${moveName}] 기술과 슬롯 ${targetMoveSlot + 1}번의 기술이 서로 맞교체되었습니다!`
                    : `Swapped [${moveName}] with Slot ${targetMoveSlot + 1}!`)
                : (isKo
                    ? `[${moveName}] 기술이 슬롯 ${targetMoveSlot + 1}번에 장착되었습니다!`
                    : `[${moveName}] equipped to Slot ${targetMoveSlot + 1}!`),
              type: "success",
            };

            const newPartyParam = serializePartyParam(partyStates, interaction.user.id);
            const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, "moves", targetMoveSlot, inGameMsg);
            await interaction.update(partyData);
            scheduleInGameMessageDismiss(client, interaction, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, "moves", targetMoveSlot, inGameMsg);
            return;
          }
        }
      }

      // 2-1-P2-MOVE. Pick Move in Moves Tab (1, 2, 3, 4)
      if (customId.startsWith("party_movepick_") || customId.startsWith("party_pickmove_")) {
        const targetMoveIdx = parseInt(parts[2], 10) || 0;
        const currentIdx = parseInt(parts[3], 10) || 0;
        const gen = parseInt(parts[4], 10) || 0;
        const page = parseInt(parts[5], 10) || 1;
        const dexNo = parseDexParam(parts[6], 1);
        const slotId = parseInt(parts[7], 10) || 1;
        const partyRaw = parts[8] || "empty";
        const isShiny = parts[9] === "1";
        const isHa = parts[10] === "1";
        const isPassive = parts[11] === "1";
        const tab: PartyViewTab = "moves";

        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, currentIdx, tab, targetMoveIdx);
        await interaction.update(partyData);
        return;
      }

      // 2-1-P2-SHINY. Direct Set Shiny Tier in Shiny Tab (T0, T1, T2, T3)
      if (customId.startsWith("party_setshiny_")) {
        const targetShinyTier = parseInt(parts[2], 10) || 0;
        const currentIdx = parseInt(parts[3], 10) || 0;
        const gen = parseInt(parts[4], 10) || 0;
        const page = parseInt(parts[5], 10) || 1;
        const dexNo = parseDexParam(parts[6], 1);
        const slotId = parseInt(parts[7], 10) || 1;
        const partyRaw = parts[8] || "empty";
        const isShiny = parts[9] === "1";
        const isHa = parts[10] === "1";
        const isPassive = parts[11] === "1";
        const tab = (parts[12] || "shiny") as PartyViewTab;
        const moveIdx = parseInt(parts[13], 10) || 0;

        const userStarters = getUserStarters(interaction.user.id);
        const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);
        const targetMember = partyStates[currentIdx];

        if (targetMember) {
          targetMember.shinyTier = targetShinyTier;
        }

        const newPartyParam = serializePartyParam(partyStates, interaction.user.id);
        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx);
        await interaction.update(partyData);
        return;
      }

      // 2-1-P2-A. Set or Toggle Hidden Ability (HA) for inspected party member (🌟)
      if (customId.startsWith("party_setha_") || customId.startsWith("party_toggleha_")) {
        const isSet = customId.startsWith("party_setha_");
        const targetUseHa = isSet ? parts[2] === "1" : undefined;
        const currentIdx = parseInt(parts[isSet ? 3 : 2], 10) || 0;
        const gen = parseInt(parts[isSet ? 4 : 3], 10) || 0;
        const page = parseInt(parts[isSet ? 5 : 4], 10) || 1;
        const dexNo = parseDexParam(parts[isSet ? 6 : 5], 1);
        const slotId = parseInt(parts[isSet ? 7 : 6], 10) || 1;
        const partyRaw = parts[isSet ? 8 : 7] || "empty";
        const isShiny = parts[isSet ? 9 : 8] === "1";
        const isHa = parts[isSet ? 10 : 9] === "1";
        const isPassive = parts[isSet ? 11 : 10] === "1";
        const tab = (parts[isSet ? 12 : 11] || "moves") as PartyViewTab;
        const moveIdx = parseInt(parts[isSet ? 13 : 12], 10) || 0;

        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";
        const userStarters = getUserStarters(interaction.user.id);
        const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);
        const targetMember = partyStates[currentIdx];
        let inGameMsg: InGameMessage | undefined = undefined;

        if (targetMember) {
          const s = getStarterByDexNumber(targetMember.dexNumber);
          const prog = s ? userStarters.get(s.speciesId) : null;
          if (isSet && targetUseHa) {
            // Clicked Hidden Ability button
            const haName = isKo ? s?.hiddenAbilityKo : s?.hiddenAbility;
            const haKey = (s?.hiddenAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
            const haDesc = isKo
              ? (ABILITY_DETAILED_DESC_KO[haKey] || "포켓몬의 숨겨진 특성입니다.")
              : (ABILITY_DETAILED_DESC_EN[haKey] || "Hidden ability of this Pokémon.");

            if (prog?.hasHiddenAbility) {
              targetMember.useHiddenAbility = true;
              inGameMsg = {
                title: isKo ? `[숨특] ${haName} (적용 완료)` : `[HA] ${haName} (Active)`,
                text: isKo
                  ? `${haDesc}\n[적용] 숨겨진 특성 [${haName}]이 활성화되었습니다.`
                  : `${haDesc}\n[Equipped] Hidden ability [${haName}] is now active.`,
                type: "success",
              };
            } else {
              inGameMsg = {
                title: isKo ? `[숨특] ${haName} (잠김)` : `[HA] ${haName} (Locked)`,
                text: isKo
                  ? `${haDesc}\n[잠김] 아직 해금되지 않은 특성입니다. (사탕/알 부화 필요)`
                  : `${haDesc}\n[Locked] Not unlocked yet. (Requires candies or egg hatching)`,
                type: "lock",
              };
            }
          } else {
            // Clicked Regular Ability button
            targetMember.useHiddenAbility = false;
            const abName = isKo ? s?.abilityKo : s?.ability;
            const abKey = (s?.ability || "").toLowerCase().replace(/[\s_]+/g, "-");
            const abDesc = isKo
              ? (ABILITY_DETAILED_DESC_KO[abKey] || "포켓몬의 일반 특성입니다.")
              : (ABILITY_DETAILED_DESC_EN[abKey] || "Regular ability of this Pokémon.");

            inGameMsg = {
              title: isKo ? `[일반 특성] ${abName} (적용 완료)` : `[Ability] ${abName} (Active)`,
              text: isKo
                ? `${abDesc}\n[적용] 일반 특성 [${abName}]이 활성화되었습니다.`
                : `${abDesc}\n[Equipped] Regular ability [${abName}] is now active.`,
              type: "info",
            };
          }
        }

        const newPartyParam = serializePartyParam(partyStates, interaction.user.id);
        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx, inGameMsg);
        await interaction.update(partyData);
        scheduleInGameMessageDismiss(client, interaction, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx, inGameMsg);
        return;
      }

      // 2-1-P2-B. Toggle Passive for inspected party member (🔓)
      if (customId.startsWith("party_togglepass_") || customId.startsWith("party_cost_togglepass_")) {
        const currentIdx = parseInt(parts[2], 10) || 0;
        const gen = parseInt(parts[3], 10) || 0;
        const page = parseInt(parts[4], 10) || 1;
        const dexNo = parseDexParam(parts[5], 1);
        const slotId = parseInt(parts[6], 10) || 1;
        const partyRaw = parts[7] || "empty";
        const isShiny = parts[8] === "1";
        const isHa = parts[9] === "1";
        const isPassive = parts[10] === "1";
        const tab = (parts[11] || "moves") as PartyViewTab;
        const moveIdx = parseInt(parts[12], 10) || 0;

        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";
        const userStarters = getUserStarters(interaction.user.id);
        const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);
        const targetMember = partyStates[currentIdx];
        let inGameMsg: InGameMessage | undefined = undefined;

        if (targetMember) {
          const s = getStarterByDexNumber(targetMember.dexNumber);
          const prog = s ? userStarters.get(s.speciesId) : null;
          const passName = isKo ? s?.passiveAbilityKo : s?.passiveAbility;
          const passKey = (s?.passiveAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
          const passDesc = isKo
            ? (ABILITY_DETAILED_DESC_KO[passKey] || "포케로그 스타팅 고유의 강력한 패시브 특성입니다.")
            : (ABILITY_DETAILED_DESC_EN[passKey] || "A unique PokéRogue starter passive ability.");

          if (prog?.passiveUnlocked) {
            targetMember.usePassive = !targetMember.usePassive;
            inGameMsg = {
              title: isKo ? `[패시브] ${passName} (${targetMember.usePassive ? "ON" : "OFF"})` : `[Passive] ${passName} (${targetMember.usePassive ? "ON" : "OFF"})`,
              text: isKo
                ? `${passDesc}\n[적용] 패시브 상태가 [${targetMember.usePassive ? "ON / 출전 코스트 1C 할인" : "OFF"}] 로 변경되었습니다.`
                : `${passDesc}\n[Equipped] Passive [${passName}] toggled ${targetMember.usePassive ? "ON (-1C Cost)" : "OFF"}.`,
              type: targetMember.usePassive ? "success" : "info",
            };
          } else {
            inGameMsg = {
              title: isKo ? `[패시브] ${passName} (잠김)` : `[Passive] ${passName} (Locked)`,
              text: isKo
                ? `${passDesc}\n[잠김] 사탕을 모아 코스트 관리 탭에서 패시브를 해금할 수 있습니다.`
                : `${passDesc}\n[Locked] Collect candies to unlock passive in Cost tab.`,
              type: "lock",
            };
          }
        }

        const newPartyParam = serializePartyParam(partyStates, interaction.user.id);
        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx, inGameMsg);
        await interaction.update(partyData);
        scheduleInGameMessageDismiss(client, interaction, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx, inGameMsg);
        return;
      }

      // 2-1-P2-C1. Unlock Passive using Candies in Party View (Cost Tab)
      if (customId.startsWith("party_unlockpass_")) {
        const currentIdx = parseInt(parts[2], 10) || 0;
        const gen = parseInt(parts[3], 10) || 0;
        const page = parseInt(parts[4], 10) || 1;
        const dexNo = parseDexParam(parts[5], 1);
        const slotId = parseInt(parts[6], 10) || 1;
        const partyRaw = parts[7] || "empty";
        const isShiny = parts[8] === "1";
        const isHa = parts[9] === "1";
        const isPassive = parts[10] === "1";
        const tab = (parts[11] || "cost") as PartyViewTab;
        const moveIdx = parseInt(parts[12], 10) || 0;

        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";
        const userStarters = getUserStarters(interaction.user.id);
        const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);
        const targetMember = partyStates[currentIdx];
        let inGameMsg: InGameMessage | undefined = undefined;

        if (targetMember) {
          const s = getStarterByDexNumber(targetMember.dexNumber);
          if (s) {
            const passiveCost = Math.max(5, s.cost * 3);
            const success = unlockPassiveAbility(interaction.user.id, s.speciesId, passiveCost);
            const passName = isKo ? (s.passiveAbilityKo || s.passiveAbility) : s.passiveAbility;
            if (success) {
              targetMember.usePassive = true;
              inGameMsg = {
                title: isKo ? `[패시브 해금 완료] ${passName}` : `[Passive Unlocked] ${passName}`,
                text: isKo
                  ? `사탕 ${passiveCost}개를 소모하여 [${passName}] 패시브 특성을 영구 해금했습니다!\n(파티 적용: ON)`
                  : `Consumed ${passiveCost} candies to unlock [${passName}] passive ability!\n(Equipped: ON)`,
                type: "success",
              };
            } else {
              inGameMsg = {
                title: isKo ? "해금 실패" : "Unlock Failed",
                text: isKo ? "사탕이 부족하거나 이미 해금된 패시브입니다." : "Not enough candies or already unlocked.",
                type: "lock",
              };
            }
          }
        }

        const newPartyParam = serializePartyParam(partyStates, interaction.user.id);
        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx, inGameMsg);
        await interaction.update(partyData);
        scheduleInGameMessageDismiss(client, interaction, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx, inGameMsg);
        return;
      }

      // 2-1-P2-C2. Permanently Reduce Starter Cost using Candies in Party View (Cost Tab)
      if (customId.startsWith("party_reducecost_")) {
        const currentIdx = parseInt(parts[2], 10) || 0;
        const gen = parseInt(parts[3], 10) || 0;
        const page = parseInt(parts[4], 10) || 1;
        const dexNo = parseDexParam(parts[5], 1);
        const slotId = parseInt(parts[6], 10) || 1;
        const partyRaw = parts[7] || "empty";
        const isShiny = parts[8] === "1";
        const isHa = parts[9] === "1";
        const isPassive = parts[10] === "1";
        const tab = (parts[11] || "cost") as PartyViewTab;
        const moveIdx = parseInt(parts[12], 10) || 0;

        const profile = saveService.getProfile(interaction.user.id);
        const isKo = profile.language === "ko";
        const userStarters = getUserStarters(interaction.user.id);
        const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);
        const targetMember = partyStates[currentIdx];
        let inGameMsg: InGameMessage | undefined = undefined;

        if (targetMember) {
          const s = getStarterByDexNumber(targetMember.dexNumber);
          const prog = s ? userStarters.get(s.speciesId) : null;
          if (s && prog) {
            const reductionCount = prog.costReductionCount || 0;
            const nextReductionCost = Math.max(10, (reductionCount + 1) * 15);
            const success = reduceStarterCost(interaction.user.id, s.speciesId, nextReductionCost);
            if (success) {
              const newCost = Math.max(1, s.cost - (reductionCount + 1));
              inGameMsg = {
                title: isKo ? `[코스트 영구 감소] ${s.nameKo}` : `[Cost Reduced] ${s.name}`,
                text: isKo
                  ? `사탕 ${nextReductionCost}개를 소모하여 기본 출전 코스트가 [${newCost}C] (-${reductionCount + 1}C) 로 영구 감소했습니다!`
                  : `Consumed ${nextReductionCost} candies! Starter base cost permanently reduced to [${newCost}C] (-${reductionCount + 1}C).`,
                type: "success",
              };
            } else {
              inGameMsg = {
                title: isKo ? "감소 실패" : "Reduction Failed",
                text: isKo ? "사탕이 부족하거나 이미 최대 한도(2회)까지 감소되었습니다." : "Not enough candies or max reduction reached.",
                type: "lock",
              };
            }
          }
        }

        const newPartyParam = serializePartyParam(partyStates, interaction.user.id);
        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx, inGameMsg);
        await interaction.update(partyData);
        scheduleInGameMessageDismiss(client, interaction, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx, inGameMsg);
        return;
      }

      // 2-1-P3. Remove Party Member from Party View Screen (-⚪)
      if (customId.startsWith("party_remove_")) {
        const currentIdx = parseInt(parts[2], 10) || 0;
        const targetDex = parseDexParam(parts[3], 0);
        const gen = parseInt(parts[4], 10) || 0;
        const page = parseInt(parts[5], 10) || 1;
        const dexNo = parseDexParam(parts[6], 1);
        const slotId = parseInt(parts[7], 10) || 1;
        const partyRaw = parts[8] || "empty";
        const isShiny = parts[9] === "1";
        const isHa = parts[10] === "1";
        const isPassive = parts[11] === "1";
        const tab = (parts[12] || "moves") as PartyViewTab;
        const moveIdx = parseInt(parts[13], 10) || 0;

        const userStarters = getUserStarters(interaction.user.id);
        const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);
        const updatedList = partyStates.filter((p) => p.dexNumber !== targetDex);

        if (updatedList.length === 0) {
          // If no party members left, go back to starter selection screen!
          const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotId, gen, page, dexNo, "empty", isShiny, isHa, isPassive);
          await interaction.update(starterData);
          return;
        }

        const nextIdx = Math.min(currentIdx, updatedList.length - 1);
        const newPartyParam = serializePartyParam(updatedList, interaction.user.id);
        const partyData = await renderPartyViewMessageData(client, interaction.user.id, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, nextIdx, tab, moveIdx);
        await interaction.update(partyData);
        return;
      }

      // 2-1-P4. Back from Party View to Starter Selection Screen (↩️)
      if (customId.startsWith("party_back_starter_")) {
        const gen = parseInt(parts[3], 10) || 0;
        const page = parseInt(parts[4], 10) || 1;
        const dexNo = parseDexParam(parts[5], 1);
        const slotId = parseInt(parts[6], 10) || 1;
        const partyRaw = parts[7] || "empty";
        const isShiny = parts[8] === "1";
        const isHa = parts[9] === "1";
        const isPassive = parts[10] === "1";

        const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive);
        await interaction.update(starterData);
        return;
      }

      // 2-1-D. Starter Remove from Party (-제거) (Legacy fallback)
      if (customId.startsWith("starter_rem_")) {
        const dexNo = parseInt(parts[2], 10) || 1;
        const gen = parseInt(parts[3], 10) || 0;
        const page = parseInt(parts[4], 10) || 1;
        const slotId = parseInt(parts[5], 10) || 1;
        const partyRaw = parts[6] || "empty";
        const isShiny = parts[7] === "1";
        const isHa = parts[8] === "1";
        const isPassive = parts[9] === "1";

        const userStarters = getUserStarters(interaction.user.id);
        const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);
        const updatedList = partyStates.filter((d) => d.dexNumber !== dexNo);
        const newPartyParam = serializePartyParam(updatedList, interaction.user.id);

        const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive);
        await interaction.update(starterData);
        return;
      }

      // 2-1-E. Starter Launch Adventure (🚀 모험 시작!)
      if (customId.startsWith("starter_start_")) {
        await interaction.deferUpdate().catch(() => null);

        const slotId = parseInt(parts[2], 10) || 1;
        const partyRaw = parts[3] || "empty";
        const userStarters = getUserStarters(interaction.user.id);
        const partyStates = parsePartyParam(partyRaw, userStarters, interaction.user.id);

        if (partyStates.length === 0) {
          const profile = saveService.getProfile(interaction.user.id);
          const isKo = profile.language === "ko";
          const inGameMsg: InGameMessage = {
            title: isKo ? "파티 비어있음" : "Empty Party",
            text: isKo
              ? "파티에 최소 1마리 이상의 포켓몬을 추가해주세요!"
              : "Please add at least 1 Pokémon to your party!",
            type: "info",
          };
          const starterData = await renderStarterSelectMessageData(
            client,
            interaction.user.id,
            slotId,
            0,
            1,
            1,
            partyRaw,
            false,
            false,
            false,
            "",
            inGameMsg
          );
          await interaction.editReply(starterData);
          return;
        }

        const profile = saveService.getProfile(interaction.user.id);
        const isKo = (profile?.language || "ko") === "ko";

        const starterParty: PartyPokemon[] = partyStates.map((st) => {
          const s = getStarterByDexNumber(st.dexNumber)!;
          const chosenAbility = (st.useHiddenAbility && (isKo ? s.hiddenAbilityKo : s.hiddenAbility))
            ? (isKo ? s.hiddenAbilityKo : s.hiddenAbility)
            : (isKo ? s.abilityKo : s.ability);
          return {
            speciesId: s.speciesId,
            name: isKo ? s.nameKo : s.name,
            nameKo: s.nameKo,
            nameEn: s.name,
            level: 5,
            hp: 20,
            maxHp: 20,
            ability: chosenAbility,
            passiveAbility: st.usePassive ? (isKo ? s.passiveAbilityKo : s.passiveAbility) : undefined,
            useHiddenAbility: st.useHiddenAbility,
            usePassive: st.usePassive,
            isShiny: st.shinyTier > 0,
            shinyTier: st.shinyTier,
            moves: st.moves && st.moves.length > 0 ? st.moves : s.starterMoves,
          };
        });

        saveService.createNewRunWithParty(interaction.user.id, slotId, starterParty);
        saveService.setActiveSlot(interaction.user.id, slotId);

        const battleData = await renderBattleMessageData(interaction.user.id, slotId);
        await interaction.editReply(battleData);
        return;
      }

      // 2-1-F. Starter Back to Title (↩️)
      if (customId.startsWith("starter_back_title_")) {
        const titleData = await renderTitleMessageData(client, interaction.user.id);
        await interaction.update(titleData);
        return;
      }

      // 2-1-G. Open Egg Gacha Screen (🥚)
      if (customId.startsWith("menu_egg_gacha_")) {
        const gachaData = await renderEggGachaMessageData(client, interaction.user.id, "shiny");
        await interaction.update(gachaData);
        return;
      }

      // 2-1-H. Egg Gacha Machine Select
      if (customId.startsWith("egg_select_")) {
        const machineType = parts[2] as "shiny" | "move" | "legendary";
        const gachaData = await renderEggGachaMessageData(client, interaction.user.id, machineType);
        await interaction.update(gachaData);
        return;
      }

      // 2-1-I. Egg Gacha Pull (1 or 5 pulls)
      if (customId.startsWith("egg_pull_")) {
        const count = parseInt(parts[2], 10) || 1;
        const machineType = (parts[3] || "shiny") as "shiny" | "move" | "legendary";

        // Pull eggs into incubator
        pullEggs(interaction.user.id, machineType, count);

        const gachaData = await renderEggGachaMessageData(client, interaction.user.id, machineType);
        await interaction.update(gachaData);
        return;
      }

      // 2-2. Continue / Resume Game Directly into Battle (1st Button on Title!)
      if (customId.startsWith("menu_continue_")) {
        const slotId = parseInt(parts[2], 10) || 1;
        const profile = saveService.getProfile(interaction.user.id);
        const slotData = profile.slots[slotId];

        if (slotData) {
          saveService.setActiveSlot(interaction.user.id, slotId);
          const battle = battleService.getOrCreateBattle(interaction.user.id, slotId);
          if (battle.phase === "DEFEAT") {
            battleService.restartRunFromDefeat(interaction.user.id, slotId, profile.language);
          }
          const battleData = await renderBattleMessageData(interaction.user.id, slotId);
          await interaction.update(battleData);
        } else {
          // If specified slot doesn't exist, find first existing slot or open slots screen
          const firstExisting = Object.values(profile.slots).find((s) => s !== null);
          if (firstExisting) {
            saveService.setActiveSlot(interaction.user.id, firstExisting.slotId);
            const battleData = await renderBattleMessageData(interaction.user.id, firstExisting.slotId);
            await interaction.update(battleData);
          } else {
            const screenData = await renderSlotsScreenData(interaction.user.id);
            await interaction.update(screenData);
          }
        }
        return;
      }

      // 2-3. Load Game Button Clicked (3rd Button on Title!)
      if (customId.startsWith("menu_loadgame_")) {
        const screenData = await renderSlotsScreenData(interaction.user.id);
        await interaction.update(screenData);
        return;
      }

      // 2-4. Trash / Delete Mode Clicked
      if (customId.startsWith("menu_delete_mode_")) {
        const screenData = await renderSlotsScreenData(interaction.user.id, undefined, true);
        await interaction.update(screenData);
        return;
      }

      // 2-5. Slot Delete Confirmed
      if (customId.startsWith("slot_delete_confirm_")) {
        const slotNum = parseInt(parts[3], 10) || 1;
        saveService.deleteSlot(interaction.user.id, slotNum);

        const screenData = await renderSlotsScreenData(interaction.user.id);
        await interaction.update(screenData);
        return;
      }

      // 2-6. Specific Slot Selected (Slot 1, 2, 3) / Resume
      if (customId.startsWith("slot_select_") || customId.startsWith("slot_resume_") || customId.startsWith("wave_battle_")) {
        const slotNum = parseInt(parts[2], 10) || 1;
        const profile = saveService.getProfile(interaction.user.id);
        const slotData = profile.slots[slotNum];

        if (!slotData) {
          const starterData = await renderStarterSelectMessageData(client, interaction.user.id, slotNum, 0, 1, 1, []);
          await interaction.update(starterData);
        } else {
          saveService.setActiveSlot(interaction.user.id, slotNum);
          const battleData = await renderBattleMessageData(interaction.user.id, slotNum, undefined, true);
          await interaction.update(battleData);

          // 🎬 Auto-Transition: After encounter entry GIF completes (~1.2s), convert message to true static PNG!
          setTimeout(async () => {
            try {
              const staticData = await renderBattleMessageData(interaction.user.id, slotNum);
              await safeInteractionUpdate(interaction, staticData).catch(() => null);
            } catch {}
          }, 1200);
        }
        return;
      }

      // 2-7. Battle Actions (⚔️ Fight, 🎒 Bag, 🔄 Party, 🏃 Run, Moves, Balls, Next Wave)
      if (customId.startsWith("battle_")) {
        // Instantly acknowledge the button interaction to prevent Discord 3-second timeout!
        await interaction.deferUpdate().catch(() => null);

        // 2-7-A. Fight Menu Selected
        if (customId.startsWith("battle_menu_fight_")) {
          const slotId = parseInt(parts[3], 10) || 1;
          const battleData = await renderBattleMessageData(interaction.user.id, slotId, "FIGHT");
          await safeInteractionUpdate(interaction, battleData);
          return;
        }

        // 2-7-B. Bag Menu Selected
        if (customId.startsWith("battle_menu_bag_")) {
          const slotId = parseInt(parts[3], 10) || 1;
          const battleData = await renderBattleMessageData(interaction.user.id, slotId, "BAG");
          await safeInteractionUpdate(interaction, battleData);
          return;
        }

        // 2-7-C. Party Menu Selected
        if (customId.startsWith("battle_menu_party_")) {
          const slotId = parseInt(parts[3], 10) || 1;
          const battleData = await renderBattleMessageData(interaction.user.id, slotId, "PARTY");
          await safeInteractionUpdate(interaction, battleData);
          return;
        }

        // 2-7-D. Run Away (Back to Title)
        if (customId.startsWith("battle_menu_run_")) {
          const titleData = await renderTitleMessageData(client, interaction.user.id);
          await safeInteractionUpdate(interaction, titleData);
          return;
        }

        // 2-7-E. Cancel / Back to Main Battle Menu
        if (customId.startsWith("battle_cancel_")) {
          const slotId = parseInt(parts[2], 10) || 1;
          const battleData = await renderBattleMessageData(interaction.user.id, slotId, "MAIN");
          await safeInteractionUpdate(interaction, battleData);
          return;
        }

        // 2-7-F. Move Selected (Attack)
        if (customId.startsWith("battle_move_")) {
          const moveKey = decodeURIComponent(parts[3] || "tackle");
          const slotId = parseInt(parts[4], 10) || 1;
          const profile = saveService.getProfile(interaction.user.id);
          battleService.executePlayerMove(interaction.user.id, slotId, moveKey, profile.language);
          const battleData = await renderBattleMessageData(interaction.user.id, slotId);
          await safeInteractionUpdate(interaction, battleData);

          // 🎬 Auto-Transition: After attack GIF completes (~1.2s), convert message to true static PNG!
          const battle = battleService.getOrCreateBattle(interaction.user.id, slotId);
          if (battle.lastMoveEffect) {
            setTimeout(async () => {
              try {
                battle.lastMoveEffect = null;
                const staticData = await renderBattleMessageData(interaction.user.id, slotId);
                await safeInteractionUpdate(interaction, staticData).catch(() => null);
              } catch (e) {
                // Ignore transient timeout errors
              }
            }, 1200);
          }
          return;
        }

        // 2-7-G. Throw Ball
        if (customId.startsWith("battle_throwball_")) {
          const ballType = parts[2] || "poke-ball";
          const slotId = parseInt(parts[3], 10) || 1;
          const profile = saveService.getProfile(interaction.user.id);
          battleService.attemptCatch(interaction.user.id, slotId, ballType, profile.language);
          const battleData = await renderBattleMessageData(interaction.user.id, slotId);
          await safeInteractionUpdate(interaction, battleData);
          return;
        }

        // 2-7-H. Switch Active Pokémon
        if (customId.startsWith("battle_switch_")) {
          const targetIdx = parseInt(parts[2], 10) || 0;
          const slotId = parseInt(parts[3], 10) || 1;
          const profile = saveService.getProfile(interaction.user.id);
          battleService.switchPlayerPokemon(interaction.user.id, slotId, targetIdx, profile.language);
          const battleData = await renderBattleMessageData(interaction.user.id, slotId);
          await safeInteractionUpdate(interaction, battleData);
          return;
        }

        // 2-7-I. Next Wave
        if (customId.startsWith("battle_nextwave_")) {
          const slotId = parseInt(parts[2], 10) || 1;
          battleService.advanceToNextWave(interaction.user.id, slotId);
          const battleData = await renderBattleMessageData(interaction.user.id, slotId, undefined, true);
          await safeInteractionUpdate(interaction, battleData);

          // 🎬 Auto-Transition: After encounter entry GIF completes (~1.2s), convert message to true static PNG!
          setTimeout(async () => {
            try {
              const staticData = await renderBattleMessageData(interaction.user.id, slotId);
              await safeInteractionUpdate(interaction, staticData).catch(() => null);
            } catch {}
          }, 1200);
          return;
        }

        // 2-7-J. Retry / Continue After Defeat
        if (customId.startsWith("battle_retry_")) {
          const slotId = parseInt(parts[2], 10) || 1;
          const profile = saveService.getProfile(interaction.user.id);
          battleService.restartRunFromDefeat(interaction.user.id, slotId, profile.language);
          const battleData = await renderBattleMessageData(interaction.user.id, slotId);
          await safeInteractionUpdate(interaction, battleData);
          return;
        }
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
              `• **초기 자금**: P ${newRun.money}\n\n` +
              "지금 포켓로그의 여정을 시작하세요!"
            : `You chose **${newRun.party[0].name}** as your starter!\n\n` +
              `• **Current Biome**: ${newRun.biome}\n` +
              `• **Starting Wave**: Wave 1\n` +
              `• **Starting Balance**: P ${newRun.money}\n\n` +
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
    } catch (err: any) {
      if (err?.code === 40060 || err?.code === 10062) {
        // Ignored safe Discord race condition (e.g. user rapid double-click or token timeout)
        return;
      }
      console.error("[ERROR] Unhandled error during interaction handling:", err);
    }
  },
};
