import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";
import { BattleEngine } from "./engine/BattleEngine.js";
import { BattleState } from "./engine/types.js";
import { createPlayerBattleMon, spawnWildPokemon } from "./entities/pokemonFactory.js";
import { renderBattleMoveGif, renderBattleEntryGif } from "../utils/battleGifRenderer.js";
import { PartyPokemon } from "../services/saveService.js";

export const NEW_MOVES_KEYS = [
  "self-destruct",
  "egg-bomb",
  "lick",
  "smog",
  "sludge",
  "bone-club",
  "fire-blast",
  "waterfall",
  "clamp",
  "seismic-toss",
  "mega-punch",
];

export interface ShowcaseSession {
  userId: string;
  battle: BattleState;
  enemyTeam: PartyPokemon[];
  enemyActiveIdx: number;
  usedNewMoves: string[];
  lastGifBuffer?: Buffer;
  battleEnded: boolean;
  winner?: "player" | "enemy" | "draw";
  turnNumber: number;
  pendingSwitch?: "enemy" | "player" | "both" | null;
  updatedAt: number;
}

const activeShowcaseSessions = new Map<string, ShowcaseSession>();

function withSubjectMarker(name: string): string {
  if (!name) return "";
  const lastChar = name.charCodeAt(name.length - 1);
  if (lastChar >= 0xac00 && lastChar <= 0xd7a3) {
    const hasBatchim = (lastChar - 0xac00) % 28 > 0;
    return `${name}${hasBatchim ? "이" : "가"}`;
  }
  return `${name}이(가)`;
}

function createShowcaseBattle(userId: string): { battle: BattleState; enemyTeam: PartyPokemon[] } {
  const playerParty: PartyPokemon[] = [
    {
      speciesId: "chansey",
      name: "럭키",
      level: 50,
      hp: 300,
      maxHp: 300,
      moves: ["egg-bomb", "pound", "double-slap", "defense-curl"],
      movePps: [10, 35, 10, 40],
    },
    {
      speciesId: "marowak",
      name: "텅구리",
      level: 50,
      hp: 140,
      maxHp: 140,
      moves: ["bone-club", "fire-blast", "earthquake", "focus-energy"],
      movePps: [20, 5, 10, 30],
    },
    {
      speciesId: "cloyster",
      name: "파르셀",
      level: 50,
      hp: 220,
      maxHp: 220,
      moves: ["waterfall", "clamp", "ice-beam", "aurora-beam"],
      movePps: [15, 15, 10, 20],
    },
  ];

  const enemyTeam: PartyPokemon[] = [
    {
      speciesId: "weezing",
      name: "또도가스",
      level: 50,
      hp: 175,
      maxHp: 175,
      moves: ["smog", "self-destruct", "toxic", "haze"],
      movePps: [20, 5, 10, 30],
    },
    {
      speciesId: "gengar",
      name: "팬텀",
      level: 50,
      hp: 140,
      maxHp: 140,
      moves: ["lick", "sludge", "night-shade", "confuse-ray"],
      movePps: [30, 20, 15, 10],
    },
    {
      speciesId: "throh",
      name: "던지미",
      level: 50,
      hp: 260,
      maxHp: 260,
      moves: ["seismic-toss", "mega-punch", "body-slam", "focus-energy"],
      movePps: [20, 20, 15, 30],
    },
  ];

  const playerBattleMon = createPlayerBattleMon(playerParty[0], playerParty);
  const enemyMon = spawnWildPokemon(1, "Town", enemyTeam[0].speciesId, enemyTeam[0].level);
  enemyMon.moves = [...(enemyTeam[0].moves || [])];
  enemyMon.movePps = [...(enemyTeam[0].movePps || [])];

  const battle: BattleState = {
    userId,
    slotId: 1,
    wave: 1,
    biome: "Town",
    gameMode: "showcase",
    phase: "MAIN",
    turnCount: 1,
    money: 1000,
    score: 100,
    playerExp: 0,
    playerMaxExp: 999999,
    playerActiveIndex: 0,
    dialogueText: "",
    playerParty,
    playerBattleMon,
    enemy: enemyMon,
  };

  return { battle, enemyTeam };
}

export function getOrCreateShowcaseSession(userId: string, forceReset: boolean = false): ShowcaseSession {
  if (forceReset || !activeShowcaseSessions.has(userId)) {
    const { battle, enemyTeam } = createShowcaseBattle(userId);
    const session: ShowcaseSession = {
      userId,
      battle,
      enemyTeam,
      enemyActiveIdx: 0,
      usedNewMoves: [],
      battleEnded: false,
      turnNumber: 1,
      pendingSwitch: null,
      updatedAt: Date.now(),
    };
    activeShowcaseSessions.set(userId, session);
    return session;
  }
  const session = activeShowcaseSessions.get(userId)!;
  session.battle.gameMode = "showcase";
  return session;
}

/**
 * Renders the authentic battle encounter/entry GIF for showcase start or reset.
 */
export async function renderShowcaseInitialEntry(session: ShowcaseSession): Promise<{ buffer: Buffer; commentary: string }> {
  session.battle.dialogueText = `야생의 ${session.battle.enemy.nameKo}(이)가 나타났다!\n가랏, ${session.battle.playerBattleMon.nameKo}!`;
  const { buffer } = await renderBattleEntryGif({
    battle: session.battle,
    lang: "ko",
    entryType: "both",
  });
  session.lastGifBuffer = buffer;
  session.updatedAt = Date.now();
  return { buffer, commentary: session.battle.dialogueText };
}

export async function executeShowcaseTurn(
  session: ShowcaseSession
): Promise<{
  session: ShowcaseSession;
  buffer: Buffer;
  turnCommentary: string;
  switches: string[];
}> {
  if (session.battleEnded) {
    session = getOrCreateShowcaseSession(session.userId, true);
    const { buffer, commentary } = await renderShowcaseInitialEntry(session);
    return {
      session,
      buffer,
      turnCommentary: commentary,
      switches: [],
    };
  }

  const battle = session.battle;

  // 1. If there is a pending switch from a previous knockout, render the replacement Pokemon's entry animation!
  if (session.pendingSwitch) {
    const switchType = session.pendingSwitch;
    session.pendingSwitch = null;

    if (switchType === "player" || switchType === "both") {
      const nextAliveIdx = battle.playerParty.findIndex((p) => p.hp > 0);
      if (nextAliveIdx >= 0) {
        battle.playerActiveIndex = nextAliveIdx;
        battle.playerBattleMon = createPlayerBattleMon(battle.playerParty[nextAliveIdx], battle.playerParty);
        battle.phase = "MAIN";
      }
    }

    if (switchType === "enemy" || switchType === "both") {
      session.enemyActiveIdx++;
      const nextE = session.enemyTeam[session.enemyActiveIdx];
      const nextEMon = spawnWildPokemon(1, "Town", nextE.speciesId, nextE.level);
      nextEMon.moves = [...(nextE.moves || [])];
      nextEMon.movePps = [...(nextE.movePps || [])];
      battle.enemy = nextEMon;
      battle.phase = "MAIN";
    }

    if (switchType === "both") {
      battle.dialogueText = `상대는 [${battle.enemy.nameKo}]을(를) 내보냈다!\n가랏, ${battle.playerBattleMon.nameKo}!`;
    } else if (switchType === "enemy") {
      battle.dialogueText = `상대는 [${battle.enemy.nameKo}]을(를) 내보냈다!`;
    } else {
      battle.dialogueText = `가랏, ${battle.playerBattleMon.nameKo}!`;
    }

    const { buffer } = await renderBattleEntryGif({
      battle,
      lang: "ko",
      entryType: switchType,
    });

    session.lastGifBuffer = buffer;
    session.updatedAt = Date.now();

    return {
      session,
      buffer,
      turnCommentary: battle.dialogueText || "",
      switches: [battle.dialogueText || ""],
    };
  }

  // 2. Normal Turn Execution
  const currentActiveIdx = battle.playerActiveIndex;
  const currentActiveMon = battle.playerBattleMon;
  const pMon = currentActiveMon;
  const eMon = battle.enemy;

  // Pick player move (prioritizes unused new moves)
  const unusedPNew = (pMon.moves || []).filter(
    (m) => NEW_MOVES_KEYS.includes(m.toLowerCase()) && !session.usedNewMoves.includes(m.toLowerCase())
  );
  let playerMoveKey = unusedPNew.length > 0 ? unusedPNew[0] : pMon.moves[Math.floor(Math.random() * pMon.moves.length)];

  // Pick enemy move (prioritizes unused new moves)
  const origEnemyMoves = [...eMon.moves];
  const unusedENew = (eMon.moves || []).filter(
    (m) => NEW_MOVES_KEYS.includes(m.toLowerCase()) && !session.usedNewMoves.includes(m.toLowerCase())
  );
  if (unusedENew.length > 0) {
    const nonSelfDestruct = unusedENew.filter((m) => m.toLowerCase() !== "self-destruct");
    if (nonSelfDestruct.length > 0 && eMon.hp > eMon.maxHp * 0.45) {
      eMon.moves = [nonSelfDestruct[0]];
    } else {
      eMon.moves = [unusedENew[0]];
    }
  }

  // Clear dialogueText so BattleEngine logs are used
  battle.dialogueText = "";

  // Delegate turn execution to official BattleEngine!
  BattleEngine.executeTurn(battle, playerMoveKey, "ko", true);
  eMon.moves = origEnemyMoves;

  // Record used new moves
  for (const act of battle.turnActions || []) {
    const key = (act.moveKey || "").toLowerCase();
    if (NEW_MOVES_KEYS.includes(key) && !session.usedNewMoves.includes(key)) {
      session.usedNewMoves.push(key);
    }
  }

  // Detect whether player's active pokemon fainted during this turn
  const playerFainted = currentActiveMon.hp <= 0 || (battle.playerParty[currentActiveIdx]?.hp ?? 1) <= 0;
  const enemyFainted = battle.enemy.hp <= 0;

  if (playerFainted) {
    currentActiveMon.hp = 0;
    if (battle.playerParty[currentActiveIdx]) {
      battle.playerParty[currentActiveIdx].hp = 0;
    }
    // REVERT to the fainted Pokémon so the faint animation renders IT, not the next Pokémon!
    battle.playerActiveIndex = currentActiveIdx;
    battle.playerBattleMon = currentActiveMon;

    const pName = currentActiveMon.nameKo || currentActiveMon.name;
    const faintLine = `${withSubjectMarker(pName)} 쓰러졌다!`;
    if (battle.turnActions && battle.turnActions.length > 0) {
      const lastAct = battle.turnActions[battle.turnActions.length - 1];
      if (!lastAct.log.includes("쓰러졌다")) {
        lastAct.log += `\n${faintLine}`;
      }
    }
  }

  if (enemyFainted) {
    const eName = battle.enemy.nameKo || battle.enemy.name;
    const faintLine = `상대 ${withSubjectMarker(eName)} 쓰러졌다!`;
    if (battle.turnActions && battle.turnActions.length > 0) {
      const lastAct = battle.turnActions[battle.turnActions.length - 1];
      if (!lastAct.log.includes("쓰러졌다")) {
        lastAct.log += `\n${faintLine}`;
      }
    }
  }

  // OVERWRITE battle.dialogueText so BattleEngine's premature "가랏, OOO!" is removed.
  // In showcase, the replacement Pokemon only enters on the NEXT turn with its own entry animation.
  battle.dialogueText = (battle.turnActions || []).map((a) => a.log).filter(Boolean).join("\n");

  // Render battle GIF (includes 4-step sinking faint animation if either pokemon faints!)
  const { buffer } = await renderBattleMoveGif({
    battle,
    lang: "ko",
  });

  session.lastGifBuffer = buffer;
  session.turnNumber++;
  session.updatedAt = Date.now();

  const switches: string[] = [];
  const enemyHasNext = session.enemyActiveIdx + 1 < session.enemyTeam.length;
  const playerHasNext = battle.playerParty.some((p) => p.hp > 0);

  if (enemyFainted && !enemyHasNext) {
    session.battleEnded = true;
    session.winner = "player";
  } else if (playerFainted && !playerHasNext) {
    session.battleEnded = true;
    session.winner = "enemy";
  } else if (enemyFainted && playerFainted) {
    session.pendingSwitch = "both";
    switches.push(`[${currentActiveMon.nameKo || currentActiveMon.name}]과(와) 상대 [${battle.enemy.nameKo}]이(가) 모두 쓰러졌다!`);
  } else if (enemyFainted) {
    session.pendingSwitch = "enemy";
    switches.push(`상대 [${battle.enemy.nameKo}]이(가) 쓰러졌다!`);
  } else if (playerFainted) {
    session.pendingSwitch = "player";
    switches.push(`아군 [${currentActiveMon.nameKo || currentActiveMon.name}]이(가) 쓰러졌다!`);
  }

  const commentary = (battle.turnActions || []).map((a) => a.log).filter(Boolean).join("\n");

  return {
    session,
    buffer,
    turnCommentary: commentary,
    switches,
  };
}

/**
 * Builds Discord message payload.
 * Outputs ONLY the battle GIF and a single [⏩ 다음 턴] (or [🔄 다시 시작]) button.
 * Absolutely NO embeds, NO extra text boxes, NO debug status lists.
 */
export function buildShowcaseMessageData(
  session: ShowcaseSession,
  userId: string,
  turnCommentary?: string,
  gifBuffer?: Buffer
) {
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  if (session.battleEnded) {
    const endRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`battleact_reset_${userId}`)
        .setLabel("🔄 다시 시작")
        .setStyle(ButtonStyle.Success)
    );
    components.push(endRow);
  } else {
    const nextTurnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`battleact_auto_${userId}`)
        .setLabel("⏩ 다음 턴")
        .setStyle(ButtonStyle.Primary)
    );
    components.push(nextTurnRow);
  }

  const files: AttachmentBuilder[] = [];
  if (gifBuffer && gifBuffer.length > 0) {
    const fileName = `battle_${session.turnNumber}_${Date.now()}.gif`;
    const attachment = new AttachmentBuilder(gifBuffer, { name: fileName });
    files.push(attachment);
  }

  return {
    content: "",
    embeds: [],
    attachments: [],
    components,
    files,
  };
}
