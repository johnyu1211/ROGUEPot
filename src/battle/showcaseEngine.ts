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
  "swift",
  "skull-bash",
  "spike-cannon",
  "constrict",
  "amnesia",
  "kinesis",
  "soft-boiled",
  "high-jump-kick",
  "glare",
  "dream-eater",
  "poison-gas",
  "barrage",
];

export interface ShowcaseTurnSnapshot {
  turnIndex: number;
  kind?: "entry" | "turn" | "switch";
  turnNumber?: number;
  turnLabel: string;
  buffer: Buffer;
  commentary: string;
}

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
  viewingTurnIndex?: number;
  history?: ShowcaseTurnSnapshot[];
  pendingSwitch?: "enemy" | "player" | "both" | null;
  updatedAt: number;
  enduredMons?: string[];
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
  // 4 vs 4 막상막하 정통 포켓몬 라인업 (129~140번 100% 공식 합법 습득자 배정)
  const playerParty: PartyPokemon[] = [
    {
      speciesId: "blastoise",
      name: "거북왕",
      level: 50,
      hp: 180,
      maxHp: 180,
      moves: ["skull-bash", "swift", "surf", "hydro-pump"],
      movePps: [10, 20, 15, 5],
    },
    {
      speciesId: "alakazam",
      name: "후딘",
      level: 50,
      hp: 150,
      maxHp: 150,
      moves: ["kinesis", "psybeam", "psychic", "reflect"],
      movePps: [15, 20, 10, 20],
    },
    {
      speciesId: "chansey",
      name: "럭키",
      level: 50,
      hp: 220,
      maxHp: 220,
      moves: ["soft-boiled", "seismic-toss", "thunder-wave", "light-screen"],
      movePps: [10, 20, 20, 30],
    },
    {
      speciesId: "hitmonlee",
      name: "시라소몬",
      level: 50,
      hp: 160,
      maxHp: 160,
      moves: ["high-jump-kick", "jump-kick", "rolling-kick", "mega-kick"],
      movePps: [10, 10, 15, 5],
    },
  ];

  const enemyTeam: PartyPokemon[] = [
    {
      speciesId: "arbok",
      name: "아보크",
      level: 50,
      hp: 170,
      maxHp: 170,
      moves: ["constrict", "glare", "sludge", "earthquake"],
      movePps: [30, 35, 20, 10],
    },
    {
      speciesId: "cloyster",
      name: "파르셀",
      level: 50,
      hp: 160,
      maxHp: 160,
      moves: ["spike-cannon", "aurora-beam", "blizzard", "clamp"],
      movePps: [15, 20, 5, 15],
    },
    {
      speciesId: "exeggutor",
      name: "나시",
      level: 50,
      hp: 180,
      maxHp: 180,
      moves: ["sleep-powder", "dream-eater", "barrage", "mega-drain"],
      movePps: [15, 15, 20, 15],
    },
    {
      speciesId: "muk",
      name: "질뻐기",
      level: 50,
      hp: 190,
      maxHp: 190,
      moves: ["poison-gas", "amnesia", "sludge", "minimize"],
      movePps: [40, 20, 20, 10],
    },
  ];

  const playerBattleMon = createPlayerBattleMon(playerParty[0], playerParty);
  const enemyMon = spawnWildPokemon(1, "Town", enemyTeam[0].speciesId, enemyTeam[0].level);
  enemyMon.moves = [...(enemyTeam[0].moves || [])];
  enemyMon.movePps = [...(enemyTeam[0].movePps || [])];
  if (enemyTeam[0].hp) {
    enemyMon.hp = enemyTeam[0].hp;
    enemyMon.maxHp = enemyTeam[0].maxHp || enemyTeam[0].hp;
  }

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
      viewingTurnIndex: 0,
      history: [],
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
  const eName = session.battle.enemy.nameKo || session.battle.enemy.name;
  const pName = session.battle.playerBattleMon.nameKo || session.battle.playerBattleMon.name;
  session.battle.dialogueText = `상대로 ${withSubjectMarker(eName)} 등장했다!\n가랏, ${pName}!`;
  const { buffer } = await renderBattleEntryGif({
    battle: session.battle,
    lang: "ko",
    entryType: "both",
  });
  session.lastGifBuffer = buffer;
  session.updatedAt = Date.now();

  const snapshot: ShowcaseTurnSnapshot = {
    turnIndex: 0,
    kind: "entry",
    turnNumber: 0,
    turnLabel: "등장 연출",
    buffer,
    commentary: session.battle.dialogueText,
  };
  session.history = [snapshot];
  session.viewingTurnIndex = 0;

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

    // Preserve previous battler before replacing with new one
    const prevEnemy = (switchType === "enemy" || switchType === "both") ? battle.enemy : undefined;
    const prevPlayer = (switchType === "player" || switchType === "both") ? battle.playerBattleMon : undefined;

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
      if (nextE.hp) {
        nextEMon.hp = nextE.hp;
        nextEMon.maxHp = nextE.maxHp || nextE.hp;
      }
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
      isSwitch: true,
      prevEnemy,
      prevPlayer,
    });

    session.lastGifBuffer = buffer;
    session.updatedAt = Date.now();

    const isEnemyRetreating = Boolean(prevEnemy && prevEnemy.hp > 0);
    const isPlayerRetreating = Boolean(prevPlayer && prevPlayer.hp > 0);

    let retreatCommentary = "";
    if (switchType === "both") {
      if (isEnemyRetreating && isPlayerRetreating) {
        retreatCommentary = `[${prevPlayer?.nameKo || prevPlayer?.name || "아군 포켓몬"}]과(와) 상대 [${prevEnemy?.nameKo || prevEnemy?.name || "상대 포켓몬"}]이(가) 물러났다!`;
      } else if (isEnemyRetreating) {
        retreatCommentary = `상대는 [${prevEnemy?.nameKo || prevEnemy?.name}]을(를) 불러들였다!`;
      } else if (isPlayerRetreating) {
        retreatCommentary = `돌아와, ${prevPlayer?.nameKo || prevPlayer?.name}!`;
      }
    } else if (switchType === "enemy" && isEnemyRetreating) {
      retreatCommentary = `상대는 [${prevEnemy?.nameKo || prevEnemy?.name}]을(를) 불러들였다!`;
    } else if (switchType === "player" && isPlayerRetreating) {
      retreatCommentary = `돌아와, ${prevPlayer?.nameKo || prevPlayer?.name}!`;
    }

    const fullCommentary = retreatCommentary
      ? `${retreatCommentary}\n${battle.dialogueText || ""}`
      : (battle.dialogueText || "");

    const prevTurn = Math.max(1, session.turnNumber - 1);
    const snapshot: ShowcaseTurnSnapshot = {
      turnIndex: session.history?.length || 0,
      kind: "switch",
      turnNumber: prevTurn,
      turnLabel: `교체 (${prevTurn}턴 직후)`,
      buffer,
      commentary: fullCommentary,
    };
    if (!session.history) session.history = [];
    session.history.push(snapshot);
    session.viewingTurnIndex = session.history.length - 1;

    return {
      session,
      buffer,
      turnCommentary: fullCommentary,
      switches: retreatCommentary ? [retreatCommentary, battle.dialogueText || ""] : [battle.dialogueText || ""],
    };
  }

  // 2. Normal Turn Execution
  const currentActiveIdx = battle.playerActiveIndex;
  const currentActiveMon = battle.playerBattleMon;
  const pMon = currentActiveMon;
  const eMon = battle.enemy;

  // Major status moves that should never be used if target is already afflicted with a status
  const MAJOR_STATUS_MOVES = new Set([
    "glare", "thunder-wave", "stun-spore", "nuzzle",
    "spore", "sleep-powder", "hypnosis", "sing",
    "toxic", "poison-gas", "poison-powder", "will-o-wisp"
  ]);

  // Healing moves that should never be used at high HP
  const HEALING_MOVES = new Set([
    "soft-boiled", "recover", "rest", "roost", "synthesis", "morning-sun", "moonlight"
  ]);

  const selectSmartShowcaseMove = (
    mon: any,
    target: any,
    usedNewMoves: string[]
  ): string => {
    const moves: string[] = mon.moves || [];
    if (moves.length === 0) return "tackle";

    // If charging move is active, must execute it!
    if (mon.chargingMove) return mon.chargingMove;

    // Helper to filter out invalid / anti-pattern moves
    const isMoveValid = (mKey: string): boolean => {
      const k = mKey.toLowerCase();
      // 1. Never use redundant major status moves if target already has any major status condition
      if (MAJOR_STATUS_MOVES.has(k) && Boolean(target.status)) {
        return false;
      }
      // 2. Never use healing moves if user is above 65% HP ("풀피 알낳기" 방지!)
      if (HEALING_MOVES.has(k) && mon.hp >= mon.maxHp * 0.65) {
        return false;
      }
      // 3. Never use dream-eater if target is not asleep! ("안 자는데 꿈먹기" 방지!)
      if (k === "dream-eater") {
        const isTargetAsleep = target.status === "slp" || ((target.sleepTurns ?? 0) > 0);
        if (!isTargetAsleep) return false;
      }
      return true;
    };

    // If user has sleep-powder and dream-eater combo:
    // If target is NOT asleep, prioritize sleep-powder!
    // If target IS asleep, prioritize dream-eater!
    if (moves.includes("dream-eater") && moves.includes("sleep-powder")) {
      const isTargetAsleep = target.status === "slp" || ((target.sleepTurns ?? 0) > 0);
      if (!isTargetAsleep && !target.status) {
        return "sleep-powder";
      }
      if (isTargetAsleep) {
        return "dream-eater";
      }
    }

    // If healing move is needed (HP <= 50%) and available, prioritize healing!
    const healingMove = moves.find(m => HEALING_MOVES.has(m.toLowerCase()));
    if (healingMove && mon.hp <= mon.maxHp * 0.50) {
      return healingMove;
    }

    // 1st Priority: Unused new moves that are valid in current battle state
    const unusedValid = moves.filter(
      m => NEW_MOVES_KEYS.includes(m.toLowerCase()) && !usedNewMoves.includes(m.toLowerCase()) && isMoveValid(m)
    );
    if (unusedValid.length > 0) {
      return unusedValid[0];
    }

    // 2nd Priority: Any move that is valid
    const validCandidates = moves.filter(isMoveValid);
    if (validCandidates.length > 0) {
      // Prefer damaging attack moves
      const damaging = validCandidates.filter(m => !MAJOR_STATUS_MOVES.has(m.toLowerCase()) && !HEALING_MOVES.has(m.toLowerCase()));
      if (damaging.length > 0) {
        return damaging[Math.floor(Math.random() * damaging.length)];
      }
      return validCandidates[0];
    }

    // Fallback: Pick any move
    return moves[0];
  };

  // Pick player move using Smart AI
  let playerMoveKey: string;
  if (pMon.chargingMove) {
    playerMoveKey = pMon.chargingMove;
  } else {
    playerMoveKey = selectSmartShowcaseMove(pMon, eMon, session.usedNewMoves);
  }

  // Pick enemy move using Smart AI
  const origEnemyMoves = [...eMon.moves];
  let enemyMoveKey: string;
  if (eMon.chargingMove) {
    enemyMoveKey = eMon.chargingMove;
  } else {
    enemyMoveKey = selectSmartShowcaseMove(eMon, pMon, session.usedNewMoves);
  }
  eMon.moves = [enemyMoveKey];

  // Clear dialogueText so BattleEngine logs are used
  battle.dialogueText = "";

  // Delegate turn execution to official BattleEngine!
  BattleEngine.executeTurn(battle, playerMoveKey, "ko", true);
  eMon.moves = origEnemyMoves;

  // Record used new moves (including attempted ones to avoid infinite loops)
  if (NEW_MOVES_KEYS.includes(playerMoveKey) && !session.usedNewMoves.includes(playerMoveKey)) {
    session.usedNewMoves.push(playerMoveKey);
  }
  if (NEW_MOVES_KEYS.includes(enemyMoveKey) && !session.usedNewMoves.includes(enemyMoveKey)) {
    session.usedNewMoves.push(enemyMoveKey);
  }
  for (const act of battle.turnActions || []) {
    const key = (act.moveKey || "").toLowerCase();
    if (act.isTurn1Launch || act.chargingMove) {
      continue;
    }
    if (NEW_MOVES_KEYS.includes(key) && !session.usedNewMoves.includes(key)) {
      session.usedNewMoves.push(key);
    }
  }

  // 🌟 Showcase Endurance: Allow at most 1 clutch endurance per Pokémon, only before turn 12 (Prevents 35-turn drag!)
  session.enduredMons = session.enduredMons || [];
  const canEndure = session.turnNumber < 12;

  const pMonKey = currentActiveMon.speciesId || currentActiveMon.name;
  const pHasUnused = canEndure && !session.enduredMons.includes(`p_${pMonKey}`) && (currentActiveMon.moves || []).some(
    (m) => NEW_MOVES_KEYS.includes(m.toLowerCase()) && !session.usedNewMoves.includes(m.toLowerCase())
  );
  if (pHasUnused && currentActiveMon.hp <= 0) {
    currentActiveMon.hp = 1;
    if (battle.playerParty[currentActiveIdx]) {
      battle.playerParty[currentActiveIdx].hp = 1;
    }
    session.enduredMons.push(`p_${pMonKey}`);
  }

  const eMonKey = battle.enemy.speciesId || battle.enemy.name;
  const eHasUnused = canEndure && !session.enduredMons.includes(`e_${eMonKey}`) && (battle.enemy.moves || []).some(
    (m) => NEW_MOVES_KEYS.includes(m.toLowerCase()) && !session.usedNewMoves.includes(m.toLowerCase())
  );
  if (eHasUnused && battle.enemy.hp <= 0) {
    battle.enemy.hp = 1;
    session.enduredMons.push(`e_${eMonKey}`);
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

  const currentTurn = session.turnNumber;
  session.turnNumber++;
  session.updatedAt = Date.now();

  const commentary = (battle.turnActions || []).map((a) => a.log).filter(Boolean).join("\n");

  const snapshot: ShowcaseTurnSnapshot = {
    turnIndex: session.history?.length || 0,
    kind: "turn",
    turnNumber: currentTurn,
    turnLabel: `${currentTurn}턴`,
    buffer,
    commentary,
  };
  if (!session.history) session.history = [];
  session.history.push(snapshot);
  session.viewingTurnIndex = session.history.length - 1;

  return {
    session,
    buffer,
    turnCommentary: commentary,
    switches,
  };
}

/**
 * Builds Discord message payload.
 * Outputs battle GIF and pagination navigation: [◀️ 이전] [📍 현재 턴 (X/Y)] [▶️ 다음 턴] [🔄 다시 시작].
 * Absolutely NO embeds, NO extra text boxes, NO debug status lists.
 */
export function buildShowcaseMessageData(
  session: ShowcaseSession,
  userId: string,
  turnCommentary?: string,
  gifBuffer?: Buffer
) {
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  const history = session.history || [];
  const currentViewIdx = session.viewingTurnIndex ?? Math.max(0, history.length - 1);
  const currentSnapshot = history[currentViewIdx];

  // 실제 배틀 턴(kind === "turn") 중 가장 높은 턴 번호 = 지금까지 진행된 전체 턴 수!
  const totalBattleTurns = history.reduce(
    (max, s) => Math.max(max, s.kind === "turn" ? (s.turnNumber ?? 0) : 0),
    0
  );

  let pageDisplay = "";
  if (!currentSnapshot || currentSnapshot.kind === "entry" || currentViewIdx === 0) {
    pageDisplay = totalBattleTurns > 0
      ? `등장 연출 (전체 ${totalBattleTurns}턴 중)`
      : `등장 연출 (배틀 시작)`;
  } else if (currentSnapshot.kind === "switch") {
    const swTurn = currentSnapshot.turnNumber ?? 1;
    pageDisplay = totalBattleTurns > 0
      ? `교체 연출 (${swTurn}턴 직후 / 전체 ${totalBattleTurns}턴)`
      : `교체 연출 (${swTurn}턴 직후)`;
  } else {
    // kind === "turn"
    const turnNum = currentSnapshot.turnNumber ?? currentViewIdx;
    pageDisplay = totalBattleTurns > 0
      ? `${turnNum}턴 (${turnNum}/${totalBattleTurns}턴)`
      : `${turnNum}턴`;
  }

  const row = new ActionRowBuilder<ButtonBuilder>();

  // 1. [◀️ 이전 장면] 버튼
  const canGoBack = currentViewIdx > 0;
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`battleact_prev_${userId}`)
      .setLabel("◀️ 이전 장면")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!canGoBack)
  );

  // 2. [📍 현재 턴/진행 표시] 버튼 (비활성화 상태의 직관적 인디케이터)
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`battleact_page_${userId}`)
      .setLabel(`📍 ${pageDisplay}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );

  // 3. [▶️ 이후 장면] 버튼
  const isAtEnd = currentViewIdx >= history.length - 1;
  const isFinished = session.battleEnded && isAtEnd;

  if (isFinished) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`battleact_done_${userId}`)
        .setLabel("🏁 배틀 종료")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`battleact_next_${userId}`)
        .setLabel("▶️ 이후 장면")
        .setStyle(ButtonStyle.Primary)
    );
  }

  // 4. [🔄 다시 시작] 버튼
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`battleact_reset_${userId}`)
      .setLabel("🔄 다시 시작")
      .setStyle(session.battleEnded ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  components.push(row);

  const files: AttachmentBuilder[] = [];
  const bufferToSend = gifBuffer || currentSnapshot?.buffer || session.lastGifBuffer;
  if (bufferToSend && bufferToSend.length > 0) {
    const fileName = `battle_${currentViewIdx}_${Date.now()}.gif`;
    const attachment = new AttachmentBuilder(bufferToSend, { name: fileName });
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
