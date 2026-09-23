// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// 코드 수정 -> 증분 빌드(npm run build) -> 뷰어 캐시 갱신 후 즉시 보고할 것.
// ============================================================================

import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import {
  renderTitleMessageData,
  renderSlotsScreenData,
  renderBagMessageData,
  renderMultiplayerMessageData,
  renderPokedexMessageData,
  renderSettingsMessageData,
  renderGenSelectMessageData,
  renderStarterSelectMessageData,
  renderPartyViewMessageData,
  parsePartyParam,
  serializePartyParam,
} from "../src/events/interactionCreate.js";
import { saveService, PartyPokemon } from "../src/services/saveService.js";
import { db } from "../src/services/db.js";
import { PartyViewTab } from "../src/utils/canvasRenderer.js";
import { getStartersByGen } from "../src/data/starterCosts.js";
import { getUserStarters } from "../src/services/starterService.js";
import { getPokemonByDexNumber } from "../src/services/pokeApiService.js";
import { VERIFIED_MOVES } from "./movesData.js";
import { renderBattleMoveGif, renderBattleEntryGif } from "../src/utils/battleGifRenderer.js";
import { getMoveData } from "../src/data/movesKo.js";
import { POKEMON_SPECIES_DATA } from "../src/data/pokemonStats.js";
import { POKEMON_NAMES_KO } from "../src/data/pokemonNamesKo.js";
import { getTypeEffectiveness } from "../src/battle/mechanics/typeChart.js";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3456;
const SIMULATED_USER_ID = "viewer_simulator_user";

// Initialize a realistic mock profile in SQLite
function initSimulatedUser() {
  saveService.getProfile(SIMULATED_USER_ID);
  saveService.setLanguage(SIMULATED_USER_ID, "ko");

  const starterData: Record<string, any> = {
    "bulbasaur": { isUnlocked: true, shinyTier: 2, hasHiddenAbility: true, passiveUnlocked: true, candies: 50, eggMoves: ["Earth Power"] },
    "charmander": { isUnlocked: true, shinyTier: 1, hasHiddenAbility: false, passiveUnlocked: true, candies: 20, eggMoves: [] },
    "squirtle": { isUnlocked: true, shinyTier: 0, hasHiddenAbility: true, passiveUnlocked: false, candies: 15, eggMoves: [] },
    "piplup": { isUnlocked: true, shinyTier: 0, hasHiddenAbility: false, passiveUnlocked: false, candies: 12, eggMoves: [] },
    "pikachu": { isUnlocked: true, shinyTier: 3, hasHiddenAbility: true, passiveUnlocked: true, candies: 99, eggMoves: [] },
    "lucario": { isUnlocked: true, shinyTier: 2, hasHiddenAbility: true, passiveUnlocked: true, candies: 50, eggMoves: ["Meteor Mash"] },
    "cinderace": { isUnlocked: true, shinyTier: 2, hasHiddenAbility: true, passiveUnlocked: true, candies: 50, eggMoves: ["High Jump Kick"] },
  };

  db.prepare("UPDATE users SET starter_data = ? WHERE user_id = ?").run(
    JSON.stringify(starterData),
    SIMULATED_USER_ID
  );
}
initSimulatedUser();

// ============================================================================
// 🏟️ 배틀 중계 전용 일반 포켓몬 4마리 (+1 팬텀) 로드아웃 사양
// ============================================================================
export interface BattleLoadoutMove {
  key: string;
  nameKo: string;
  type: string;
  category: "physical" | "special" | "status";
  power: number | null;
  accuracy: number;
  pp: number;
  desc: string;
}

export interface BattleLoadoutPokemon {
  id: string;
  dexNumber: number;
  nameKo: string;
  nameEn: string;
  types: string[];
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
  moves: BattleLoadoutMove[];
}

export const BATTLE_LOADOUTS: Record<string, BattleLoadoutPokemon> = {
  cloyster: {
    id: "cloyster",
    dexNumber: 91,
    nameKo: "파르셀",
    nameEn: "Cloyster",
    types: ["water", "ice"],
    hp: 160,
    maxHp: 160,
    attack: 115,
    defense: 180,
    spAtk: 95,
    spDef: 60,
    speed: 70,
    moves: [
      { key: "clamp", nameKo: "껍질에끼우기", type: "water", category: "physical", power: 35, accuracy: 85, pp: 15, desc: "4~5턴간 대상을 조개 껍질 속에 가두어 조인다." },
      { key: "waterfall", nameKo: "폭포오르기", type: "water", category: "physical", power: 80, accuracy: 100, pp: 15, desc: "세찬 폭포수를 거슬러 솟구쳐 들이받는다. (20% 풀죽음)" },
      { key: "withdraw", nameKo: "껍질에숨기", type: "water", category: "status", power: null, accuracy: 100, pp: 40, desc: "단단한 조개 껍질에 몸을 숨겨 방어를 1랭크 올린다." },
      { key: "ice-beam", nameKo: "냉동빔", type: "ice", category: "special", power: 90, accuracy: 100, pp: 10, desc: "얼어붙는 맹렬한 냉기 빔을 발사한다. (10% 얼음)" },
    ],
  },
  marowak: {
    id: "marowak",
    dexNumber: 105,
    nameKo: "텅구리",
    nameEn: "Marowak",
    types: ["ground"],
    hp: 170,
    maxHp: 170,
    attack: 130,
    defense: 120,
    spAtk: 70,
    spDef: 85,
    speed: 65,
    moves: [
      { key: "bone-club", nameKo: "뼈다귀치기", type: "ground", category: "physical", power: 65, accuracy: 85, pp: 20, desc: "손에 쥔 뼈다귀를 휘둘러 내려친다. (10% 풀죽음)" },
      { key: "fire-blast", nameKo: "불대문자", type: "fire", category: "special", power: 110, accuracy: 85, pp: 5, desc: "대(大) 자 화염을 날려 대상을 불태운다. (10% 화상)" },
      { key: "earthquake", nameKo: "지진", type: "ground", category: "physical", power: 100, accuracy: 100, pp: 10, desc: "대지진을 일으켜 전장의 모든 대상을 강타한다." },
      { key: "focus-energy", nameKo: "기충전", type: "normal", category: "status", power: null, accuracy: 100, pp: 30, desc: "기를 집중하여 급소율을 2랭크 올린다." },
    ],
  },
  weezing: {
    id: "weezing",
    dexNumber: 110,
    nameKo: "또도가스",
    nameEn: "Weezing",
    types: ["poison"],
    hp: 175,
    maxHp: 175,
    attack: 100,
    defense: 130,
    spAtk: 95,
    spDef: 80,
    speed: 60,
    moves: [
      { key: "smog", nameKo: "스모그", type: "poison", category: "special", power: 30, accuracy: 70, pp: 20, desc: "자욱한 유독가스를 뿜어 공격한다. (40% 독)" },
      { key: "sludge", nameKo: "오물공격", type: "poison", category: "special", power: 65, accuracy: 100, pp: 20, desc: "더러운 오물을 세차게 투척한다. (30% 독)" },
      { key: "self-destruct", nameKo: "자폭", type: "normal", category: "physical", power: 200, accuracy: 100, pp: 5, desc: "자신을 희생하여 전장을 뒤흔드는 괴멸적 대폭발을 일으킨다." },
      { key: "toxic", nameKo: "맹독", type: "poison", category: "status", power: null, accuracy: 90, pp: 10, desc: "상대를 치명적인 맹독 상태에 빠뜨린다." },
    ],
  },
  chansey: {
    id: "chansey",
    dexNumber: 113,
    nameKo: "럭키",
    nameEn: "Chansey",
    types: ["normal"],
    hp: 250,
    maxHp: 250,
    attack: 45,
    defense: 50,
    spAtk: 80,
    spDef: 140,
    speed: 55,
    moves: [
      { key: "egg-bomb", nameKo: "알폭탄", type: "normal", category: "physical", power: 100, accuracy: 75, pp: 10, desc: "단단한 알을 힘껏 던져 상대에게 큰 충격을 준다." },
      { key: "recover", nameKo: "HP회복", type: "normal", category: "status", power: null, accuracy: 100, pp: 10, desc: "상처를 치유하여 최대 HP의 절반을 회복한다." },
      { key: "minimize", nameKo: "작아지기", type: "normal", category: "status", power: null, accuracy: 100, pp: 10, desc: "몸을 축소시켜 회피율을 2랭크 올린다." },
      { key: "light-screen", nameKo: "빛의장막", type: "psychic", category: "status", power: null, accuracy: 100, pp: 30, desc: "빛의 벽을 세워 5턴간 특수 공격 데미지를 반감한다." },
    ],
  },
  gengar: {
    id: "gengar",
    dexNumber: 94,
    nameKo: "팬텀",
    nameEn: "Gengar",
    types: ["ghost", "poison"],
    hp: 160,
    maxHp: 160,
    attack: 85,
    defense: 80,
    spAtk: 135,
    spDef: 95,
    speed: 110,
    moves: [
      { key: "lick", nameKo: "핥기", type: "ghost", category: "physical", power: 30, accuracy: 100, pp: 30, desc: "긴 혀로 대상을 핥아 공격한다. (30% 마비)" },
      { key: "sludge", nameKo: "오물공격", type: "poison", category: "special", power: 65, accuracy: 100, pp: 20, desc: "더러운 오물을 세차게 투척한다. (30% 독)" },
      { key: "night-shade", nameKo: "나이트헤드", type: "ghost", category: "special", power: null, accuracy: 100, pp: 15, desc: "거대한 환영으로 상대에게 레벨 수치만큼의 고정 피해를 준다." },
      { key: "confuse-ray", nameKo: "이상한빛", type: "ghost", category: "status", power: null, accuracy: 100, pp: 10, desc: "요사스러운 도깨비불로 상대를 100% 혼란에 빠뜨린다." },
    ],
  },
};

export const NEW_MOVES_KEYS = [
  "self-destruct", // 120
  "egg-bomb",      // 121
  "lick",          // 122
  "smog",          // 123
  "sludge",        // 124
  "bone-club",     // 125
  "fire-blast",    // 126
  "waterfall",     // 127
  "clamp",         // 128
];

export const BATTLE_DEFAULT_TEAMS = {
  player: ["cloyster", "marowak", "chansey"],
  enemy: ["weezing", "gengar", "marowak"],
};

function calculateBattleAction(
  attackerRole: "player" | "enemy",
  attackerMon: BattleLoadoutPokemon,
  defenderMon: BattleLoadoutPokemon,
  moveKey: string,
  attackerCurrentHp: number,
  defenderCurrentHp: number
) {
  const moveObj = attackerMon.moves.find(m => m.key === moveKey) || {
    key: moveKey,
    nameKo: moveKey,
    type: "normal",
    category: "physical" as const,
    power: 40,
    accuracy: 100,
    pp: 20,
    desc: "",
  };

  const isHit = Math.random() * 100 < moveObj.accuracy;
  let damage = 0;
  let typeMod = 1.0;
  let commentary = "";
  const aName = attackerMon.nameKo;
  const dName = defenderMon.nameKo;

  if (!isHit) {
    commentary = `💨 ${aName}의 ${moveObj.nameKo}! 그러나 빗나갔다!`;
    return {
      attacker: attackerRole,
      moveKey,
      moveName: moveObj.nameKo,
      isHit: false,
      damage: 0,
      typeMod: 1.0,
      attackerHpAfter: attackerCurrentHp,
      defenderHpAfter: defenderCurrentHp,
      commentary,
    };
  }

  // 변화기 (Status)
  if (moveObj.category === "status") {
    let statDirection: "up" | "down" | undefined;
    let statTarget: "self" | "target" | undefined;

    if (moveKey === "recover") {
      const heal = Math.round(attackerMon.maxHp * 0.5);
      const newHp = Math.min(attackerMon.maxHp, attackerCurrentHp + heal);
      commentary = `✨ ${aName}의 ${moveObj.nameKo}! 체력을 ${heal} 회복했다! (${newHp}/${attackerMon.maxHp})`;
      return {
        attacker: attackerRole,
        moveKey,
        moveName: moveObj.nameKo,
        isHit: true,
        damage: 0,
        typeMod: 1.0,
        attackerHpAfter: newHp,
        defenderHpAfter: defenderCurrentHp,
        commentary,
      };
    } else if (moveKey === "withdraw") {
      commentary = `🛡️ ${aName}의 ${moveObj.nameKo}! 단단한 조개 껍질 속에 숨어 방어가 올랐다! (+1)`;
      statDirection = "up";
      statTarget = "self";
    } else if (moveKey === "minimize") {
      commentary = `🫥 ${aName}의 ${moveObj.nameKo}! 몸을 작게 축소시켜 회피율이 크게 올랐다! (+2)`;
      statDirection = "up";
      statTarget = "self";
    } else if (moveKey === "light-screen") {
      commentary = `🔮 ${aName}의 ${moveObj.nameKo}! 빛의 장막이 펼쳐져 특수 방어가 강화되었다!`;
      statDirection = "up";
      statTarget = "self";
    } else if (moveKey === "focus-energy") {
      commentary = `💢 ${aName}의 ${moveObj.nameKo}! 기를 모아 급소에 맞힐 확률이 크게 올랐다! (+2)`;
      statDirection = "up";
      statTarget = "self";
    } else if (moveKey === "toxic") {
      commentary = `☠️ ${aName}의 ${moveObj.nameKo}! ${dName}(은)는 맹독에 걸렸다!`;
    } else if (moveKey === "confuse-ray") {
      commentary = `💫 ${aName}의 ${moveObj.nameKo}! ${dName}(은)는 혼란에 빠졌다!`;
    } else {
      const desc = moveObj.description || "";
      if (desc.includes("떨어뜨") || desc.includes("낮춘") || desc.includes("감소") || desc.includes("하락")) {
        statDirection = "down";
        statTarget = "target";
        commentary = `🔻 ${aName}의 ${moveObj.nameKo}! ${dName}의 능력이 떨어졌다!`;
      } else if (desc.includes("올린다") || desc.includes("상승") || desc.includes("높인다") || desc.includes("올려")) {
        statDirection = "up";
        statTarget = "self";
        commentary = `🔺 ${aName}의 ${moveObj.nameKo}! ${aName}의 능력이 올랐다!`;
      } else {
        commentary = `✨ ${aName}의 ${moveObj.nameKo}!`;
      }
    }
    return {
      attacker: attackerRole,
      moveKey,
      moveName: moveObj.nameKo,
      isHit: true,
      damage: 0,
      typeMod: 1.0,
      attackerHpAfter: attackerCurrentHp,
      defenderHpAfter: defenderCurrentHp,
      commentary,
      statDirection,
      statTarget,
    };
  }

  // 자폭 (Self-Destruct)
  let attackerHpAfter = attackerCurrentHp;
  if (moveKey === "self-destruct") {
    attackerHpAfter = 0;
  }

  // 공격/특수 데미지 계산
  typeMod = getTypeEffectiveness(moveObj.type, defenderMon.types);
  if (typeMod === 0) {
    commentary = `⛔ ${aName}의 ${moveObj.nameKo}! 그러나 ${dName}에게는 효과가 없는 것 같다... (0 데미지)`;
    return {
      attacker: attackerRole,
      moveKey,
      moveName: moveObj.nameKo,
      isHit: true,
      damage: 0,
      typeMod: 0,
      attackerHpAfter,
      defenderHpAfter: defenderCurrentHp,
      commentary,
    };
  }

  // 나이트헤드 (고정 피해 50)
  if (moveKey === "night-shade") {
    damage = 50 * typeMod;
  } else {
    const isSpecial = moveObj.category === "special";
    const aStat = isSpecial ? attackerMon.spAtk : attackerMon.attack;
    const dStat = isSpecial ? defenderMon.spDef : defenderMon.defense;
    const basePower = moveObj.power || 40;
    const isStab = attackerMon.types.includes(moveObj.type) ? 1.5 : 1.0;
    const randomFactor = 0.85 + Math.random() * 0.15;
    damage = Math.max(1, Math.round(((basePower * (aStat / dStat) * 0.38) + 2) * isStab * typeMod * randomFactor));
  }

  const defenderHpAfter = Math.max(0, defenderCurrentHp - damage);

  // 중계 멘트 작성
  let effText = "";
  if (typeMod > 1.0) effText = " 🔥 효과가 굉장했다!";
  else if (typeMod < 1.0) effText = " 💧 효과가 별로인 듯하다...";

  if (moveKey === "clamp") {
    commentary = `🐚 ${aName}의 ${moveObj.nameKo}! ${dName}(을)를 껍질 속에 가두어 조였다!${effText} (-${damage} HP)`;
  } else if (moveKey === "waterfall") {
    commentary = `🌊 ${aName}의 ${moveObj.nameKo}! 솟구치는 폭포수로 ${dName}(을)를 쳐올렸다!${effText} (-${damage} HP)`;
  } else if (moveKey === "bone-club") {
    commentary = `🦴 ${aName}의 ${moveObj.nameKo}! 단단한 뼈다귀로 머리를 내려쳤다!${effText} (-${damage} HP)`;
  } else if (moveKey === "fire-blast") {
    commentary = `🔥 ${aName}의 ${moveObj.nameKo}! 거대한 大 자 화염이 ${dName}(을)를 집어삼켰다!${effText} (-${damage} HP)`;
  } else if (moveKey === "earthquake") {
    commentary = `💥 ${aName}의 ${moveObj.nameKo}! 대지가 갈라지며 엄청난 진동이 강타했다!${effText} (-${damage} HP)`;
  } else if (moveKey === "egg-bomb") {
    commentary = `🥚 ${aName}의 ${moveObj.nameKo}! 거대한 알이 직격하여 폭발했다!${effText} (-${damage} HP)`;
  } else if (moveKey === "smog") {
    commentary = `💨 ${aName}의 ${moveObj.nameKo}! 짙은 유독가스가 ${dName}(을)를 덮쳤다!${effText} (-${damage} HP)`;
  } else if (moveKey === "sludge") {
    commentary = `🧪 ${aName}의 ${moveObj.nameKo}! 더러운 오물 덩어리가 날아와 터졌다!${effText} (-${damage} HP)`;
  } else if (moveKey === "self-destruct") {
    commentary = `💣 ${aName}의 ${moveObj.nameKo}! 전장을 날려버리는 괴멸적 대폭발!${effText} (-${damage} HP, 시전자 기절)`;
  } else if (moveKey === "lick") {
    commentary = `👅 ${aName}의 ${moveObj.nameKo}! 긴 혀로 ${dName}(을)를 쓸어올렸다!${effText} (-${damage} HP)`;
  } else {
    commentary = `⚡ ${aName}의 ${moveObj.nameKo}!${effText} (-${damage} HP)`;
  }

  return {
    attacker: attackerRole,
    moveKey,
    moveName: moveObj.nameKo,
    isHit: true,
    damage,
    typeMod,
    attackerHpAfter,
    defenderHpAfter,
    commentary,
  };
}

// SSE Clients for Live Reload
const sseClients: http.ServerResponse[] = [];
const moveGifMemoryCache = new Map<string, any>();
const bulbapediaCoreSeriesCache = new Map<string, any>();

const serverStartTime = Date.now();
let movesVersionCounter = 1;

export function getMovesVersion(): string {
  let hash = 0;
  for (const m of VERIFIED_MOVES) {
    const s = `${m.id}:${m.status}:${m.isVerified}`;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
  }
  return `${serverStartTime}_${movesVersionCounter}_${hash}`;
}

// ============================================================================
// 실시간 소스 파일 변경 감지 및 캐시 자동 초기화 헬퍼
// ============================================================================

/**
 * 특정 기술(moveKey)에 직접/간접적으로 영향을 미치는 모든 소스 파일 목록을 반환합니다.
 */
export function getMoveSourceFiles(rawMoveKey: string): string[] {
  const moveKey = rawMoveKey.replace(/-enemy$/, "");
  const files: string[] = [];

  // 1. 모든 기술 렌더링에 공통으로 영향을 주는 핵심 종속 파일
  const sharedFiles = [
    path.resolve(__dirname, "../src/utils/battleGifRenderer.ts"),
    path.resolve(__dirname, "../src/renderers/moves/common/helpers.ts"),
    path.resolve(__dirname, "../src/renderers/moves/common/genericTypeEffects.ts"),
    path.resolve(__dirname, "../src/battle/moves/types.ts"),
    path.resolve(__dirname, "../src/battle/moves/moveRegistry.ts"),
    path.resolve(__dirname, "movesData.ts"),
  ];
  for (const sf of sharedFiles) {
    if (fs.existsSync(sf)) files.push(sf);
  }

  // 2. 개별 기술 정의 파일 (src/battle/moves/definitions/XXX_move_name.ts)
  const moveItem = VERIFIED_MOVES.find((m) => m.id === moveKey);
  const moveNum = moveItem?.num;

  if (moveNum !== undefined && moveNum > 0) {
    const numPrefix = String(moveNum).padStart(3, "0");
    const defsDir = path.resolve(__dirname, "../src/battle/moves/definitions");
    if (fs.existsSync(defsDir)) {
      try {
        const defFiles = fs.readdirSync(defsDir);
        const match = defFiles.find(
          (f) => f.startsWith(`${numPrefix}_`) && (f.endsWith(".ts") || f.endsWith(".js"))
        );
        if (match) {
          files.push(path.join(defsDir, match));
        }
      } catch {}
    }

    // 3. 렌더러 구현 파일 (Gen 1 4단위 규격: move001_004.ts, move113_116.ts 등)
    const start = Math.floor((moveNum - 1) / 4) * 4 + 1;
    const end = start + 3;
    const gen1Dir = path.resolve(__dirname, "../src/renderers/moves/gen1");
    const rendererFilename = `move${String(start).padStart(3, "0")}_${String(end).padStart(3, "0")}.ts`;
    const rendererPath = path.join(gen1Dir, rendererFilename);
    if (fs.existsSync(rendererPath)) {
      files.push(rendererPath);
    }
  }

  return files;
}

/**
 * 특정 기술(moveKey)의 소스 파일들 중 가장 최신 수정 시각(mtime ms)을 반환합니다.
 */
export function getMoveLatestMtime(rawMoveKey: string): number {
  const files = getMoveSourceFiles(rawMoveKey);
  let latest = 0;
  for (const f of files) {
    try {
      const stat = fs.statSync(f);
      if (stat.mtimeMs > latest) {
        latest = stat.mtimeMs;
      }
    } catch {}
  }
  return Math.round(latest);
}

const rendererPath = path.resolve(__dirname, "../src/utils/canvasRenderer.ts");
const interactionPath = path.resolve(__dirname, "../src/events/interactionCreate.ts");
const movesRendererDir = path.resolve(__dirname, "../src/renderers/moves");
const movesDefsDir = path.resolve(__dirname, "../src/battle/moves");
const viewerMovesDataPath = path.resolve(__dirname, "movesData.ts");
const battleServicePath = path.resolve(__dirname, "../src/services/battleService.ts");

[rendererPath, interactionPath, movesRendererDir, movesDefsDir, viewerMovesDataPath, battleServicePath].forEach((targetPath) => {
  if (fs.existsSync(targetPath)) {
    const onFileChange = (eventType?: string, filename?: string | null) => {
      console.log(`[VIEWER] ${path.basename(targetPath)} changed (${filename || "file"}), clearing move cache and triggering live reload...`);
      movesVersionCounter++;
      moveGifMemoryCache.clear();
      const payload = JSON.stringify({
        type: "reload",
        changedFile: filename || "",
        version: getMovesVersion(),
      });
      sseClients.forEach((client) => {
        try {
          client.write(`data: ${payload}\n\n`);
        } catch {}
      });
    };

    try {
      fs.watch(targetPath, { recursive: true }, onFileChange);
    } catch {
      // Fallback non-recursive
      fs.watch(targetPath, onFileChange);
    }
  }
});

// Convert Discord Message Payload to JSON response
function serializeDiscordMessagePayload(result: any) {
  const attachment = result.files && result.files[0];
  let imageBase64 = "";
  if (attachment && attachment.attachment) {
    imageBase64 = `data:image/png;base64,${attachment.attachment.toString("base64")}`;
  }

  let embedData = null;
  if (result.embeds && result.embeds[0]) {
    embedData = typeof result.embeds[0].toJSON === "function" ? result.embeds[0].toJSON() : result.embeds[0];
  }

  const rows = (result.components || []).map((row: any) => {
    const rowJson = typeof row.toJSON === "function" ? row.toJSON() : row;
    return (rowJson.components || []).map((btn: any) => ({
      custom_id: btn.custom_id,
      label: btn.label,
      style: btn.style, // 1 = Primary, 2 = Secondary, 3 = Success, 4 = Danger
      disabled: Boolean(btn.disabled),
    }));
  });

  return {
    image: imageBase64,
    embed: embedData,
    rows: rows,
  };
}

function parseBulbapediaGenInfo(fileName: string) {
  const upper = fileName.toUpperCase();
  const isAlt2 = upper.includes("_2.") || upper.includes("-2.");
  const altSuffix = isAlt2 ? " (반동/후속)" : "";

  if (upper.includes("_I.") || upper.includes("_RB.") || upper.includes("_RG.")) return { order: 1, badge: "GEN I", label: `1세대 (RGBY)${altSuffix}` };
  if (upper.includes("_II.") || upper.includes("_GS.") || upper.includes("_C.")) return { order: 2, badge: "GEN II", label: `2세대 (GSC)${altSuffix}` };
  if (upper.includes("_III.") || upper.includes("_RS.") || upper.includes("_E.") || upper.includes("_FRLG.") || upper.includes("_COLO.") || upper.includes("_XD.")) return { order: 3, badge: "GEN III", label: `3세대 (RSE/FRLG)${altSuffix}` };
  if (upper.includes("_IV.") || upper.includes("_DP.") || upper.includes("_PT.") || upper.includes("_HGSS.")) return { order: 4, badge: "GEN IV", label: `4세대 (DPPt/HGSS)${altSuffix}` };
  if (upper.includes("_V.") || upper.includes("_BW.") || upper.includes("_B2W2.")) return { order: 5, badge: "GEN V", label: `5세대 (BW/B2W2)${altSuffix}` };
  if (upper.includes("_VI.") || upper.includes("_XY.") || upper.includes("_ORAS.")) return { order: 6 + (isAlt2 ? 0.1 : 0), badge: "GEN VI", label: `6세대 (XY/ORAS)${altSuffix}` };
  if (upper.includes("_VII.") || upper.includes("_SM.") || upper.includes("_USUM.")) return { order: 7 + (isAlt2 ? 0.1 : 0), badge: "GEN VII", label: `7세대 (SM/USUM)${altSuffix}` };
  if (upper.includes("_PE.") || upper.includes("_LGPE.")) return { order: 8 + (isAlt2 ? 0.1 : 0), badge: "LET'S GO", label: `레츠고 (LGPE)${altSuffix}` };
  if (upper.includes("_VIII.") || upper.includes("_SWSH.")) return { order: 9 + (isAlt2 ? 0.1 : 0), badge: "GEN VIII", label: `8세대 (소드/실드)${altSuffix}` };
  if (upper.includes("_BDSP.")) return { order: 10 + (isAlt2 ? 0.1 : 0), badge: "BDSP", label: `8세대 (BDSP)${altSuffix}` };
  if (upper.includes("_LA.") || upper.includes("_PLA.")) return { order: 11 + (isAlt2 ? 0.1 : 0), badge: "PLA", label: `LEGENDS 아르세우스${altSuffix}` };
  if (upper.includes("_IX.") || upper.includes("_SV.")) return { order: 12 + (isAlt2 ? 0.1 : 0), badge: "GEN IX", label: `9세대 (SV)${altSuffix}` };
  if (upper.includes("_ZA.") || upper.includes("_PLZA.")) return { order: 13 + (isAlt2 ? 0.1 : 0), badge: "PLZA", label: `LEGENDS Z-A${altSuffix}` };
  return { order: 99, badge: "OTHER", label: fileName.replace(/\.[^/.]+$/, "") };
}

async function scrapeBulbapediaCoreSeries(rawTitle: string) {
  const pageTitle = rawTitle.trim().replace(/\s+/g, "_");
  const wikiUrl = `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(pageTitle)}_(move)`;
  try {
    const res = await fetch(wikiUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!res.ok) {
      return { ok: false, error: `Bulbapedia returned HTTP ${res.status}`, wikiUrl, items: [] };
    }
    const html = await res.text();
    const coreIdx = html.lastIndexOf("Core series games");
    if (coreIdx === -1) {
      return { ok: true, wikiUrl, items: [] };
    }

    let endIdx = html.indexOf("Side series games", coreIdx);
    if (endIdx === -1) endIdx = html.indexOf("In spin-off games", coreIdx);
    if (endIdx === -1) endIdx = html.indexOf("<h3>", coreIdx + 100);
    if (endIdx === -1) endIdx = coreIdx + 100000;

    const section = html.slice(coreIdx, endIdx);
    const regex = /<a href="(\/wiki\/File:[^"]+)"[^>]*>[\s\S]*?<img[^>]+(?:src|data-src)="([^">]+)"/gi;
    let match: RegExpExecArray | null;
    const items: any[] = [];
    const seenFiles = new Set<string>();

    while ((match = regex.exec(section)) !== null) {
      const filePageRel = match[1];
      let imgUrl = match[2];
      if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;

      const fileName = decodeURIComponent(filePageRel.replace("/wiki/File:", ""));
      if (seenFiles.has(fileName)) continue;
      seenFiles.add(fileName);

      const genInfo = parseBulbapediaGenInfo(fileName);
      items.push({
        fileName,
        filePage: `https://bulbapedia.bulbagarden.net${filePageRel}`,
        imgUrl,
        proxyUrl: `/api/image-proxy?url=${encodeURIComponent(imgUrl)}`,
        ...genInfo,
      });
    }

    items.sort((a, b) => a.order - b.order);
    return { ok: true, wikiUrl, items };
  } catch (err: any) {
    return { ok: false, error: err.message, wikiUrl, items: [] };
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Live Reload SSE
  if (req.method === "GET" && req.url === "/api/live") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    sseClients.push(res);
    req.on("close", () => {
      const idx = sseClients.indexOf(res);
      if (idx >= 0) sseClients.splice(idx, 1);
    });
    return;
  }

  // 2. Serve HTML
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const htmlPath = path.join(__dirname, "index.html");
    fs.readFile(htmlPath, "utf-8", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Failed to load HTML: " + err.message);
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  // 2-A-1. Move Viewer - Clear In-Memory Render Cache (All or specific move)
  if (req.method === "POST" && req.url?.startsWith("/api/clear-cache")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const targetMove = url.searchParams.get("moveKey");
    let count = 0;
    if (targetMove) {
      for (const [k] of moveGifMemoryCache.entries()) {
        if (k.startsWith(targetMove)) {
          moveGifMemoryCache.delete(k);
          count++;
        }
      }
      console.log(`[VIEWER CACHE] Cleared ${count} cached GIF items for move "${targetMove}".`);
    } else {
      count = moveGifMemoryCache.size;
      moveGifMemoryCache.clear();
      console.log(`[VIEWER CACHE] Cleared ${count} cached GIF items.`);
    }
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, clearedCount: count, targetMove: targetMove || "all" }));
    return;
  }

  // 2-A-2. Move Viewer - Restart Server (with cache wipe)
  if (req.method === "POST" && req.url === "/api/restart-server") {
    const count = moveGifMemoryCache.size;
    moveGifMemoryCache.clear();
    bulbapediaCoreSeriesCache.clear();
    console.log(`[VIEWER RESTART] Cleared caches (${count} GIF items) and triggering server restart...`);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, clearedCount: count }));

    setTimeout(() => {
      const isWin = process.platform === "win32";
      const cmd = isWin ? "cmd.exe" : "npm";
      const args = isWin ? ["/c", "npm", "run", "viewer"] : ["run", "viewer"];
      try {
        const child = spawn(cmd, args, {
          detached: true,
          stdio: "ignore",
          cwd: process.cwd(),
          env: process.env,
        });
        child.unref();
      } catch (err) {
        console.error("[VIEWER RESTART ERROR]", err);
      }
      process.exit(0);
    }, 200);
    return;
  }

  // 2-B-1. Move Viewer - Real-time Version & Hash Checker (for live polling sync)
  if (req.method === "GET" && req.url?.startsWith("/api/moves-version")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const activeMoveKey = url.searchParams.get("activeMove") || "";
    const activeMoveMtime = activeMoveKey ? getMoveLatestMtime(activeMoveKey) : 0;
    const version = getMovesVersion();
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(JSON.stringify({
      ok: true,
      version,
      serverStartTime,
      count: VERIFIED_MOVES.length,
      activeMove: activeMoveKey,
      activeMoveMtime,
    }));
    return;
  }

  // 2-B. Move Viewer - List all verified moves
  if (req.method === "GET" && req.url?.startsWith("/api/moves")) {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Moves-Version": getMovesVersion(),
    });
    res.end(JSON.stringify(VERIFIED_MOVES));
    return;
  }

  // 2-B-4. Battle View - Get 3v3 Battle Loadouts & Defaults
  if (req.method === "GET" && req.url?.startsWith("/api/battle-loadouts")) {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(JSON.stringify({
      ok: true,
      loadouts: BATTLE_LOADOUTS,
      defaultTeams: BATTLE_DEFAULT_TEAMS,
      newMoveKeys: NEW_MOVES_KEYS,
    }));
    return;
  }

  // 2-B-5. Battle View - Execute 3v3 Battle Turn Simulation
  if (req.method === "POST" && req.url?.startsWith("/api/battle-turn")) {
    let bodyStr = "";
    req.on("data", (chunk) => { bodyStr += chunk; });
    req.on("end", async () => {
      try {
        const body = JSON.parse(bodyStr || "{}");
        const turnNumber = Number(body.turnNumber ?? 1);
        let trapTurns = Number(body.trapTurns ?? 0);
        let usedNewMoves: string[] = Array.isArray(body.usedNewMoves) ? [...body.usedNewMoves] : [];

        // 3v3 Team Parsing with smart fallback
        let playerTeam: Array<{ species: string; currentHp: number; maxHp: number }> = body.playerTeam;
        let enemyTeam: Array<{ species: string; currentHp: number; maxHp: number }> = body.enemyTeam;
        let pActiveIdx = Number(body.playerActiveIdx ?? 0);
        let eActiveIdx = Number(body.enemyActiveIdx ?? 0);

        if (!playerTeam || !playerTeam.length) {
          playerTeam = BATTLE_DEFAULT_TEAMS.player.map((sp) => {
            const l = BATTLE_LOADOUTS[sp] || BATTLE_LOADOUTS["cloyster"];
            return { species: sp, currentHp: l.hp, maxHp: l.maxHp };
          });
          pActiveIdx = 0;
        }
        if (!enemyTeam || !enemyTeam.length) {
          enemyTeam = BATTLE_DEFAULT_TEAMS.enemy.map((sp) => {
            const l = BATTLE_LOADOUTS[sp] || BATTLE_LOADOUTS["weezing"];
            return { species: sp, currentHp: l.hp, maxHp: l.maxHp };
          });
          eActiveIdx = 0;
        }

        let pEntry = playerTeam[pActiveIdx];
        let eEntry = enemyTeam[eActiveIdx];
        let playerMon = BATTLE_LOADOUTS[pEntry.species] || BATTLE_LOADOUTS["cloyster"];
        let enemyMon = BATTLE_LOADOUTS[eEntry.species] || BATTLE_LOADOUTS["weezing"];

        // 1. Player Move Selection (Smart priority for unused new moves if not provided)
        let playerMoveKey = body.playerMove;
        if (!playerMoveKey) {
          const unusedPNew = playerMon.moves.filter(
            (m) => NEW_MOVES_KEYS.includes(m.key) && !usedNewMoves.includes(m.key)
          );
          if (unusedPNew.length > 0) {
            playerMoveKey = unusedPNew[0].key;
          } else {
            playerMoveKey = playerMon.moves[Math.floor(Math.random() * playerMon.moves.length)].key;
          }
        }

        // 2. Enemy AI Move Selection (Prioritizes unused new moves, controls self-destruct timing)
        let enemyMoveKey = body.enemyMove;
        if (!enemyMoveKey) {
          const unusedENew = enemyMon.moves.filter(
            (m) => NEW_MOVES_KEYS.includes(m.key) && !usedNewMoves.includes(m.key)
          );
          if (unusedENew.length > 0) {
            const nonSelfDestruct = unusedENew.filter((m) => m.key !== "self-destruct");
            if (nonSelfDestruct.length > 0 && eEntry.currentHp > enemyMon.maxHp * 0.4) {
              enemyMoveKey = nonSelfDestruct[Math.floor(Math.random() * nonSelfDestruct.length)].key;
            } else {
              enemyMoveKey = unusedENew[Math.floor(Math.random() * unusedENew.length)].key;
            }
          } else {
            enemyMoveKey = enemyMon.moves[Math.floor(Math.random() * enemyMon.moves.length)].key;
          }
        }

        // 3. Speed Comparison
        const playerGoesFirst = playerMon.speed >= enemyMon.speed;
        const actions: any[] = [];
        const switchEvents: any[] = [];
        let battleEnded = false;
        let winner: string | null = null;

        const executeStep = (attackerRole: "player" | "enemy", moveKey: string) => {
          if (attackerRole === "player") {
            const beforePHp = pEntry.currentHp;
            const beforeEHp = eEntry.currentHp;
            const act = calculateBattleAction("player", playerMon, enemyMon, moveKey, beforePHp, beforeEHp);
            pEntry.currentHp = act.attackerHpAfter;
            eEntry.currentHp = act.defenderHpAfter;
            if (NEW_MOVES_KEYS.includes(moveKey) && !usedNewMoves.includes(moveKey)) {
              usedNewMoves.push(moveKey);
            }
            actions.push({
              ...act,
              gifUrl: `/api/render-move?moveKey=${encodeURIComponent(act.moveKey)}&playerSpecies=${pEntry.species}&enemySpecies=${eEntry.species}&playerHp=${beforePHp}&enemyHp=${beforeEHp}&playerMaxHp=${playerMon.maxHp}&enemyMaxHp=${enemyMon.maxHp}&damage=${act.damage}&isHit=${act.isHit}&dialogue=${encodeURIComponent(act.commentary)}&actMode=single&statDirection=${act.statDirection || ""}&statTarget=${act.statTarget || ""}&t=${Date.now()}`,
            });
            if (act.moveKey === "clamp" && act.isHit && eEntry.currentHp > 0) {
              trapTurns = Math.floor(Math.random() * 2) + 4;
            }
          } else {
            const beforePHp = pEntry.currentHp;
            const beforeEHp = eEntry.currentHp;
            const act = calculateBattleAction("enemy", enemyMon, playerMon, moveKey, beforeEHp, beforePHp);
            eEntry.currentHp = act.attackerHpAfter;
            pEntry.currentHp = act.defenderHpAfter;
            if (NEW_MOVES_KEYS.includes(moveKey) && !usedNewMoves.includes(moveKey)) {
              usedNewMoves.push(moveKey);
            }
            actions.push({
              ...act,
              gifUrl: `/api/render-move?moveKey=${encodeURIComponent(act.moveKey + "-enemy")}&playerSpecies=${pEntry.species}&enemySpecies=${eEntry.species}&playerHp=${beforePHp}&enemyHp=${beforeEHp}&playerMaxHp=${playerMon.maxHp}&enemyMaxHp=${enemyMon.maxHp}&damage=${act.damage}&isHit=${act.isHit}&dialogue=${encodeURIComponent(act.commentary)}&actMode=single&statDirection=${act.statDirection || ""}&statTarget=${act.statTarget || ""}&t=${Date.now()}`,
            });
          }
        };

        const checkFaintAndSwitch = () => {
          // Check Player faint
          if (pEntry.currentHp <= 0) {
            pEntry.currentHp = 0;
            if (pActiveIdx + 1 < playerTeam.length) {
              const prevMonName = playerMon.nameKo;
              pActiveIdx++;
              pEntry = playerTeam[pActiveIdx];
              playerMon = BATTLE_LOADOUTS[pEntry.species] || BATTLE_LOADOUTS["cloyster"];
              switchEvents.push({
                side: "player",
                fromIdx: pActiveIdx - 1,
                toIdx: pActiveIdx,
                newSpecies: pEntry.species,
                newNameKo: playerMon.nameKo,
                commentary: `💀 아군의 [${prevMonName}]이(가) 쓰러졌다!\n🔄 아군은 [${playerMon.nameKo}]을(를) 전장에 내보냈다!`,
              });
            } else {
              battleEnded = true;
            }
          }

          // Check Enemy faint
          if (eEntry.currentHp <= 0) {
            eEntry.currentHp = 0;
            trapTurns = 0;
            if (eActiveIdx + 1 < enemyTeam.length) {
              const prevMonName = enemyMon.nameKo;
              eActiveIdx++;
              eEntry = enemyTeam[eActiveIdx];
              enemyMon = BATTLE_LOADOUTS[eEntry.species] || BATTLE_LOADOUTS["weezing"];
              switchEvents.push({
                side: "enemy",
                fromIdx: eActiveIdx - 1,
                toIdx: eActiveIdx,
                newSpecies: eEntry.species,
                newNameKo: enemyMon.nameKo,
                commentary: `💥 적군의 [${prevMonName}]이(가) 쓰러졌다!\n🔄 상대는 [${enemyMon.nameKo}]을(를) 전장에 내보냈다!`,
              });
            } else {
              battleEnded = true;
            }
          }
        };

        if (playerGoesFirst) {
          executeStep("player", playerMoveKey);
          checkFaintAndSwitch();
          const firstAct = actions[0];
          const defenderFainted = firstAct && firstAct.defenderHpAfter <= 0;
          const attackerFainted = firstAct && firstAct.attackerHpAfter <= 0;
          if (!defenderFainted && !attackerFainted && !battleEnded) {
            executeStep("enemy", enemyMoveKey);
            checkFaintAndSwitch();
          }
        } else {
          executeStep("enemy", enemyMoveKey);
          checkFaintAndSwitch();
          const firstAct = actions[0];
          const defenderFainted = firstAct && firstAct.defenderHpAfter <= 0;
          const attackerFainted = firstAct && firstAct.attackerHpAfter <= 0;
          if (!defenderFainted && !attackerFainted && !battleEnded) {
            executeStep("player", playerMoveKey);
            checkFaintAndSwitch();
          }
        }

        // End of Turn Effects
        let endOfTurnCommentary = "";
        if (!battleEnded && trapTurns > 0 && eEntry.currentHp > 0) {
          const trapDmg = Math.max(1, Math.round(enemyMon.maxHp / 8));
          eEntry.currentHp = Math.max(0, eEntry.currentHp - trapDmg);
          trapTurns--;
          if (trapTurns === 0) {
            endOfTurnCommentary = `📢 ${enemyMon.nameKo}(은)는 껍질의 조임으로 ${trapDmg} 데미지를 입고, 구속에서 풀려났다!`;
          } else {
            endOfTurnCommentary = `📢 ${enemyMon.nameKo}(은)는 껍질에 조여져 고통받고 있다! (-${trapDmg} HP, 잔여 ${trapTurns}턴)`;
          }
          checkFaintAndSwitch();
        }

        const playerAllFainted = playerTeam.every((p) => p.currentHp <= 0);
        const enemyAllFainted = enemyTeam.every((e) => e.currentHp <= 0);
        if (playerAllFainted && enemyAllFainted) {
          battleEnded = true;
          winner = "draw";
        } else if (enemyAllFainted) {
          battleEnded = true;
          winner = "player";
        } else if (playerAllFainted) {
          battleEnded = true;
          winner = "enemy";
        }

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          ok: true,
          turnNumber,
          playerTeam,
          enemyTeam,
          playerActiveIdx: pActiveIdx,
          enemyActiveIdx: eActiveIdx,
          playerSpecies: pEntry.species,
          enemySpecies: eEntry.species,
          playerHp: pEntry.currentHp,
          enemyHp: eEntry.currentHp,
          trapTurns,
          actions,
          switchEvents,
          usedNewMoves,
          endOfTurnCommentary,
          battleEnded,
          winner,
        }));
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 2-B-2. Move Viewer - Fetch Bulbapedia Core series images (Gen 1 ~ Legends Z-A)
  if (req.method === "GET" && req.url?.startsWith("/api/move-core-series")) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const rawMoveKey = url.searchParams.get("moveKey") || "";
      const isEnemyCaster = rawMoveKey.endsWith("-enemy");
      const cleanKey = isEnemyCaster ? rawMoveKey.replace(/-enemy$/, "") : rawMoveKey;

      if (cleanKey === "encounter-entry" || cleanKey === "perk-hug") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, wikiUrl: null, items: [], customNote: "공식 본가 기술이 아닙니다." }));
        return;
      }

      const moveObj = VERIFIED_MOVES.find(m => m.id === cleanKey);
      const moveData = getMoveData(cleanKey);
      const pageTitle = url.searchParams.get("nameEn") || moveObj?.nameEn || moveData?.nameEn || cleanKey;

      const cached = bulbapediaCoreSeriesCache.get(cleanKey);
      if (cached) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ...cached, fromCache: true }));
        return;
      }

      const result = await scrapeBulbapediaCoreSeries(pageTitle);
      if (result.ok && result.items && result.items.length > 0) {
        bulbapediaCoreSeriesCache.set(cleanKey, result);
      }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // 2-B-3. Move Viewer - Image Proxy for external CDN images
  if (req.method === "GET" && req.url?.startsWith("/api/image-proxy")) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl || (!targetUrl.startsWith("https://archives.bulbagarden.net/") && !targetUrl.startsWith("https://bulbapedia.bulbagarden.net/"))) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Invalid URL");
        return;
      }
      const fetchRes = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (!fetchRes.ok) {
        res.writeHead(fetchRes.status);
        res.end();
        return;
      }
      const contentType = fetchRes.headers.get("content-type") || "image/png";
      const buffer = Buffer.from(await fetchRes.arrayBuffer());
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      });
      res.end(buffer);
    } catch (err: any) {
      res.writeHead(500);
      res.end();
    }
    return;
  }

  // 2-C. Move Viewer - Render Move GIF (A attacks with move, then B counterattacks with same move!)
  if (req.method === "GET" && req.url?.startsWith("/api/render-move")) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const rawMoveKey = url.searchParams.get("moveKey") || "double-kick";
      const isEnemyCaster = rawMoveKey.endsWith("-enemy");
      const moveKey = isEnemyCaster ? rawMoveKey.replace(/-enemy$/, "") : rawMoveKey;
      const playerSpecies = url.searchParams.get("playerSpecies") || "bulbasaur";
      const enemySpecies = url.searchParams.get("enemySpecies") || "onix";
      const hitMode = url.searchParams.get("hitMode") || "normal";
      const flyPhase = url.searchParams.get("flyPhase") || "2";
      const actMode = url.searchParams.get("actMode") || "dual";
      const subMoveParam = (url.searchParams.get("subMove") || url.searchParams.get("subMoveKey") || "").toLowerCase().trim();
      const metronomeOnly = subMoveParam === "only" || subMoveParam === "none" || flyPhase === "only" || flyPhase === "1";
      const METRONOME_SAMPLE_MOVES = ["thunderbolt", "flamethrower", "earthquake", "hydro-pump", "psychic", "blizzard", "tackle", "fire-blast"];
      const metronomeSubKey = metronomeOnly ? "none" : (
        flyPhase === "thunderbolt" ? "thunderbolt" :
        (subMoveParam && subMoveParam !== "random" ? subMoveParam :
        METRONOME_SAMPLE_MOVES[Math.floor(Math.random() * METRONOME_SAMPLE_MOVES.length)])
      );
      const metronomeSubData = getMoveData(metronomeSubKey);
      const metronomeSubKo = metronomeSubData?.nameKo || metronomeSubKey;
      const metronomeIsStatus = metronomeSubData?.category === "status";

      const mirrorSubKey = (subMoveParam && subMoveParam !== "random") ? subMoveParam : (
        (flyPhase === "thunderbolt" || flyPhase === "1") ? "thunderbolt" :
        (flyPhase === "tackle" || flyPhase === "full") ? "tackle" : "flamethrower"
      );
      const mirrorSubData = getMoveData(mirrorSubKey);
      const customPlayerHp = url.searchParams.get("playerHp") !== null ? parseInt(url.searchParams.get("playerHp")!, 10) : undefined;
      const customEnemyHp = url.searchParams.get("enemyHp") !== null ? parseInt(url.searchParams.get("enemyHp")!, 10) : undefined;
      const customPlayerMaxHp = url.searchParams.get("playerMaxHp") !== null ? parseInt(url.searchParams.get("playerMaxHp")!, 10) : undefined;
      const customEnemyMaxHp = url.searchParams.get("enemyMaxHp") !== null ? parseInt(url.searchParams.get("enemyMaxHp")!, 10) : undefined;
      const customDamage = url.searchParams.get("damage") !== null ? parseInt(url.searchParams.get("damage")!, 10) : undefined;
      const customDialogue = url.searchParams.get("dialogue")
        ? decodeURIComponent(url.searchParams.get("dialogue")!).replace(/(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F)/gu, "").trim()
        : undefined;
      const customStatDirection = (url.searchParams.get("statDirection") || "").toLowerCase().trim() as "up" | "down" | "";
      const customStatTarget = (url.searchParams.get("statTarget") || "").toLowerCase().trim() as "self" | "target" | "";

      console.log(`[VIEWER MOVE] moveKey=${rawMoveKey}, hitMode=${hitMode}, actMode=${actMode}, pHP=${customPlayerHp ?? 'def'}, eHP=${customEnemyHp ?? 'def'}, statDir=${customStatDirection || 'none'}`);

      const cacheKey = `${rawMoveKey}_${playerSpecies}_${enemySpecies}_${hitMode}_${flyPhase}_${actMode}_${metronomeSubKey}_${mirrorSubKey}_p${customPlayerHp ?? ''}_e${customEnemyHp ?? ''}_d${customDamage ?? ''}_dlg${customDialogue ? '1' : '0'}_sd${customStatDirection}_st${customStatTarget}`;
      const noCache = url.searchParams.get("nocache") === "1" || !!url.searchParams.get("t");
      const cached = noCache ? null : moveGifMemoryCache.get(cacheKey);
      if (cached) {
        const latestMtime = getMoveLatestMtime(rawMoveKey);
        if (latestMtime > (cached.cachedAt || 0)) {
          console.log(`[VIEWER CACHE AUTO-CLEAR] Move "${rawMoveKey}" source modified (${new Date(latestMtime).toLocaleTimeString()}), auto-invalidating cache!`);
          moveGifMemoryCache.delete(cacheKey);
        } else {
          if (url.searchParams.get("format") === "gif" || (req.headers.accept && req.headers.accept.includes("image/gif"))) {
            const base64Data = cached.gif.replace(/^data:image\/gif;base64,/, "");
            const buf = Buffer.from(base64Data, "base64");
            res.writeHead(200, {
              "Content-Type": "image/gif",
              "Content-Length": buf.length,
              "Cache-Control": "no-cache"
            });
            res.end(buf);
            return;
          }
          res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          });
          res.end(JSON.stringify({ ...cached, fromCache: true, renderTimeMs: cached.renderTimeMs }));
          return;
        }
      }

      const moveData = getMoveData(moveKey);
      const moveKo = moveKey === "encounter-entry" ? "야생 포켓몬 조우 (등장)" : (moveKey === "perk-hug" ? "포옹 (🫂 특수 연출)" : (moveData?.nameKo || moveKey));
      const playerInfo = POKEMON_SPECIES_DATA[playerSpecies];
      const enemyInfo = POKEMON_SPECIES_DATA[enemySpecies];
      const playerDisplayName = (playerInfo?.num ? POKEMON_NAMES_KO[String(playerInfo.num)] : null) || (playerInfo as any)?.nameKo || playerSpecies;
      const enemyDisplayName = (enemyInfo?.num ? POKEMON_NAMES_KO[String(enemyInfo.num)] : null) || (enemyInfo as any)?.nameKo || enemySpecies;

      const isStatus = moveData?.category === "status" || moveKey === "swords-dance" || moveKey === "whirlwind" || moveKey === "perk-hug" || moveKey === "bide-charge";
      const isOHKO = moveKey === "guillotine" || moveKey === "horn-drill" || moveKey === "fissure" || moveKey === "sheer-cold";
      const isMiss = hitMode === "miss";
      const isImmune = hitMode === "immune";
      const isQuarter = hitMode === "quarter";
      const isNotVery = hitMode === "not-very";
      const isSuper = hitMode === "super";
      const isUltra = hitMode === "ultra";

      let typeMod = 1.0;
      if (isMiss || isImmune) typeMod = 0.0;
      else if (isQuarter) typeMod = 0.25;
      else if (isNotVery) typeMod = 0.5;
      else if (isSuper) typeMod = 2.0;
      else if (isUltra) typeMod = 4.0;
      else typeMod = 1.0;

      const isHit = !isMiss;
      const isMetronomeAttack = moveKey === "metronome" && !metronomeOnly && !metronomeIsStatus;
      const mirrorIsStatus = mirrorSubData?.category === "status";
      const isMirrorAttack = moveKey === "mirror-move" && !mirrorIsStatus;
      const isStatusEffective = isStatus && !isMetronomeAttack && !isMirrorAttack;
      const calculatedDamage = isStatusEffective ? 0 : (isMiss || isImmune ? 0 : (isOHKO ? 150 : Math.max(1, Math.round(35 * typeMod))));
      const actualDamage = customDamage !== undefined ? customDamage : calculatedDamage;
      const act1EnemyHpAfter = customEnemyHp !== undefined ? Math.max(0, customEnemyHp - actualDamage) : (isStatusEffective ? 150 : (isMiss || isImmune ? 150 : (isOHKO ? 0 : Math.max(0, 150 - actualDamage))));

      const isBuffMove = (
        moveKey === "swords-dance" || moveKey === "growth" || moveKey === "dragon-dance" ||
        moveKey === "calm-mind" || moveKey === "bulk-up" || moveKey === "agility" ||
        moveKey === "double-team" || moveKey === "minimize" || moveKey === "harden" ||
        moveKey === "iron-defense" || moveKey === "withdraw" || moveKey === "focus-energy" ||
        moveKey === "barrier" || moveKey === "defense-curl" || moveKey === "amnesia" ||
        moveKey === "acid-armor" || moveKey === "sharpen" || moveKey === "charge" ||
        moveKey === "nasty-plot" || moveKey === "quiver-dance" || moveKey === "shell-smash" ||
        moveKey === "rock-polish" || moveKey === "work-up" || moveKey === "hone-claws" ||
        moveKey === "belly-drum" || moveKey === "coil" || moveKey === "light-screen" || moveKey === "reflect" ||
        Boolean(moveData?.description && (
          !moveData.description.includes("떨어지지") &&
          !moveData.description.includes("떨어뜨") &&
          !moveData.description.includes("낮춘") &&
          !moveData.description.includes("감소") &&
          !moveData.description.includes("하락") &&
          (moveData.description.includes("올린다") || moveData.description.includes("상승") || moveData.description.includes("높인다") || moveData.description.includes("올려") || moveData.description.includes("급소율을"))
        ))
      );
      const isNotDebuff = moveKey === "mist" || moveKey === "haze" || moveKey === "safeguard";
      const isDebuffMove = isStatus && !isOHKO && !isNotDebuff && (
        moveKey === "growl" || moveKey === "tail-whip" || moveKey === "leer" || moveKey === "sand-attack" ||
        moveKey === "screech" || moveKey === "charm" || moveKey === "fake-tears" || moveKey === "metal-sound" ||
        moveKey === "string-shot" || moveKey === "smokescreen" || moveKey === "kinesis" || moveKey === "flash" ||
        moveKey === "sweet-scent" || moveKey === "scary-face" || moveKey === "cotton-spore" ||
        Boolean(moveData?.description && (
          !moveData.description.includes("떨어지지") &&
          (moveData.description.includes("떨어뜨") || moveData.description.includes("낮춘") || moveData.description.includes("감소") || moveData.description.includes("하락"))
        ))
      );

      const isBuff = customStatDirection === "up" || (customStatDirection === "" && isBuffMove);
      const isDebuff = customStatDirection === "down" || (customStatDirection === "" && isDebuffMove);

      const targetIsTarget = customStatTarget === "target" || (!customStatTarget && isDebuff);

      const pStatChanges: { target: "player" | "enemy"; direction: "up" | "down" }[] | undefined = isBuff
        ? [{ target: targetIsTarget ? "enemy" : "player", direction: "up" }]
        : (isDebuff ? [{ target: targetIsTarget ? "enemy" : "player", direction: "down" }] : undefined);

      const eStatChanges: { target: "player" | "enemy"; direction: "up" | "down" }[] | undefined = isBuff
        ? [{ target: targetIsTarget ? "player" : "enemy", direction: "up" }]
        : (isDebuff ? [{ target: targetIsTarget ? "player" : "enemy", direction: "down" }] : undefined);

      const initPlayerMaxHp = customPlayerMaxHp ?? 150;
      const initEnemyMaxHp = customEnemyMaxHp ?? 150;
      const initPlayerHp = customPlayerHp !== undefined ? customPlayerHp : ((isEnemyCaster && isOHKO && !isMiss) ? 0 : initPlayerMaxHp);
      const initEnemyHp = customEnemyHp !== undefined ? customEnemyHp : ((!isEnemyCaster && isOHKO && !isMiss) ? 0 : initEnemyMaxHp);

      const mockBattle = {
        userId: "viewer_user",
        slotId: 1,
        stage: 1,
        biome: "town",
        phase: (isOHKO && !isMiss) ? (isEnemyCaster ? "DEFEAT" : "VICTORY") : "ACTION",
        dialogueText: customDialogue || (moveKey === "perk-hug" ? `[PERK:hug] ${playerDisplayName}(은)는 당신을 포옹하고 돌아갔다.` : ""),
        hugTriggered: moveKey === "perk-hug",
        playerParty: [{
          id: "p1",
          speciesId: playerSpecies,
          dexNumber: playerInfo?.num || (playerInfo as any)?.dexNumber || 448,
          species: playerSpecies,
          name: playerDisplayName,
          level: 25,
          hp: initPlayerHp,
          maxHp: initPlayerMaxHp,
          stats: { hp: initPlayerMaxHp, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
          moves: [moveKey, "surf", "ice-beam", "blizzard", "psybeam"].filter((m, i, arr) => arr.indexOf(m) === i).slice(0, 4),
          types: playerInfo?.types?.map((t: string) => t.toLowerCase()) || ["fighting", "steel"]
        }],
        playerBattleMon: {
          id: "p1",
          speciesId: playerSpecies,
          dexNumber: playerInfo?.num || (playerInfo as any)?.dexNumber || 448,
          species: playerSpecies,
          name: playerDisplayName,
          level: 25,
          hp: initPlayerHp,
          maxHp: initPlayerMaxHp,
          stats: { hp: initPlayerMaxHp, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
          moves: [moveKey, "surf", "ice-beam", "blizzard", "psybeam"].filter((m, i, arr) => arr.indexOf(m) === i).slice(0, 4),
          types: playerInfo?.types?.map((t: string) => t.toLowerCase()) || ["fighting", "steel"],
          semiInvulnerableState: (!isEnemyCaster && ((moveKey === "fly" && flyPhase === "2") ? "air" : ((moveKey === "dig" && flyPhase === "2") ? "underground" : null))),
          chargingMove: (!isEnemyCaster && ((moveKey === "fly" && flyPhase === "2") ? "fly" : ((moveKey === "dig" && flyPhase === "2") ? "dig" : null))),
        },
        enemy: {
          id: "e1",
          speciesId: enemySpecies,
          dexNumber: enemyInfo?.num || (enemyInfo as any)?.dexNumber || 815,
          species: enemySpecies,
          name: enemyDisplayName,
          level: 25,
          hp: initEnemyHp,
          maxHp: initEnemyMaxHp,
          stats: { hp: initEnemyMaxHp, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
          moves: [moveKey],
          types: enemyInfo?.types?.map((t: string) => t.toLowerCase()) || ["fire"],
          semiInvulnerableState: (isEnemyCaster && ((moveKey === "fly" && flyPhase === "2") ? "air" : ((moveKey === "dig" && flyPhase === "2") ? "underground" : null))),
          chargingMove: (isEnemyCaster && ((moveKey === "fly" && flyPhase === "2") ? "fly" : ((moveKey === "dig" && flyPhase === "2") ? "dig" : null))),
        },
        turnActions: isEnemyCaster ? (
          (moveKey === "fly" && flyPhase === "1") ? [
            {
              actor: "enemy",
              moveKey: "fly",
              moveName: "공중날기",
              damage: 0,
              isHit: true,
              isTurn1Launch: true,
              chargingMove: "fly",
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 하늘 높이 날아올랐다!`
            },
            {
              actor: "player",
              moveKey: "tackle",
              moveName: "몸통박치기",
              damage: 0,
              isHit: false,
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `아군 ${playerDisplayName}의 몸통박치기!\n하지만 상대에게 닿지 않았다!`
            }
          ] : (moveKey === "fly" && flyPhase === "full") ? [
            {
              actor: "enemy",
              moveKey: "fly",
              moveName: "공중날기",
              damage: 0,
              isHit: true,
              isTurn1Launch: true,
              chargingMove: "fly",
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 하늘 높이 날아올랐다!`
            },
            {
              actor: "enemy",
              moveKey: "fly",
              moveName: "공중날기",
              damage: actualDamage,
              isHit: isHit,
              isTurn1Launch: false,
              wasDescentFromAir: true,
              isSuperEffective: isSuper,
              typeMod: typeMod,
              playerHpAfter: isMiss ? 150 : Math.max(0, 150 - actualDamage),
              enemyHpAfter: 150,
              effectiveness: typeMod,
              log: isMiss
                ? `적 ${enemyDisplayName}의 공중날기!\n하지만 상대에게 빗나갔다!`
                : `적 ${enemyDisplayName}의 공중날기! ${actualDamage} 데미지!`
            }
          ] : (moveKey === "fly") ? [
            {
              actor: "enemy",
              moveKey: "fly",
              moveName: "공중날기",
              damage: actualDamage,
              isHit: isHit,
              isTurn1Launch: false,
              wasDescentFromAir: true,
              isSuperEffective: isSuper,
              typeMod: typeMod,
              playerHpAfter: isMiss ? 150 : Math.max(0, 150 - actualDamage),
              enemyHpAfter: 150,
              effectiveness: typeMod,
              log: isMiss
                ? `적 ${enemyDisplayName}의 공중날기!\n하지만 상대에게 빗나갔다!`
                : `적 ${enemyDisplayName}의 공중날기! ${actualDamage} 데미지!`
            },
            {
              actor: "player",
              moveKey: "tackle",
              moveName: "몸통박치기",
              damage: 25,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: isMiss ? 150 : Math.max(0, 150 - actualDamage),
              enemyHpAfter: 125,
              effectiveness: 1.0,
              log: `아군 ${playerDisplayName}의 몸통박치기! 25 데미지!`
            }
          ] : (moveKey === "dig" && flyPhase === "1") ? [
            {
              actor: "enemy",
              moveKey: "dig",
              moveName: "구멍파기",
              damage: 0,
              isHit: true,
              isTurn1Launch: true,
              chargingMove: "dig",
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 땅속으로 파고들었다!`
            },
            ...(actMode === "single" ? [] : [{
              actor: "player",
              moveKey: "tackle",
              moveName: "몸통박치기",
              damage: 0,
              isHit: false,
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `아군 ${playerDisplayName}의 몸통박치기!\n하지만 상대에게 닿지 않았다!`
            }])
          ] : (moveKey === "dig" && flyPhase === "full") ? [
            {
              actor: "enemy",
              moveKey: "dig",
              moveName: "구멍파기",
              damage: 0,
              isHit: true,
              isTurn1Launch: true,
              chargingMove: "dig",
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 땅속으로 파고들었다!`
            },
            {
              actor: "enemy",
              moveKey: "dig",
              moveName: "구멍파기",
              damage: actualDamage,
              isHit: isHit,
              isTurn1Launch: false,
              isSuperEffective: isSuper,
              typeMod: typeMod,
              playerHpAfter: isMiss ? 150 : Math.max(0, 150 - actualDamage),
              enemyHpAfter: 150,
              effectiveness: typeMod,
              log: isMiss
                ? `적 ${enemyDisplayName}의 구멍파기!\n하지만 상대에게 빗나갔다!`
                : `적 ${enemyDisplayName}의 구멍파기! ${actualDamage} 데미지!`
            }
          ] : (moveKey === "dig") ? [
            {
              actor: "enemy",
              moveKey: "dig",
              moveName: "구멍파기",
              damage: actualDamage,
              isHit: isHit,
              isTurn1Launch: false,
              isSuperEffective: isSuper,
              typeMod: typeMod,
              playerHpAfter: isMiss ? 150 : Math.max(0, 150 - actualDamage),
              enemyHpAfter: 150,
              effectiveness: typeMod,
              log: isMiss
                ? `적 ${enemyDisplayName}의 구멍파기!\n하지만 상대에게 빗나갔다!`
                : `적 ${enemyDisplayName}의 구멍파기! ${actualDamage} 데미지!`
            },
            ...(actMode === "single" ? [] : [{
              actor: "player",
              moveKey: "tackle",
              moveName: "몸통박치기",
              damage: 25,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: isMiss ? 150 : Math.max(0, 150 - actualDamage),
              enemyHpAfter: 125,
              effectiveness: 1.0,
              log: `아군 ${playerDisplayName}의 몸통박치기! 25 데미지!`
            }])
          ] : ((moveKey === "bide" && flyPhase === "1") || moveKey === "bide-charge") ? [
            {
              actor: "enemy",
              moveKey: "bide-charge",
              moveName: "참기 (참기)",
              damage: 0,
              isHit: true,
              isTurn1Launch: true,
              chargingMove: "bide",
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 참기를 시작했다!`
            }
          ] : (moveKey === "bide" && flyPhase === "full") ? [
            {
              actor: "enemy",
              moveKey: "bide",
              moveName: "참기",
              damage: 0,
              isHit: true,
              isTurn1Launch: true,
              chargingMove: "bide",
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 참기를 시작했다!`
            },
            {
              actor: "player",
              moveKey: "tackle",
              moveName: "몸통박치기",
              damage: 25,
              isHit: true,
              playerHpAfter: 150,
              enemyHpAfter: 125,
              effectiveness: 1.0,
              log: `아군 ${playerDisplayName}의 몸통박치기! 25 데미지!`
            },
            {
              actor: "enemy",
              moveKey: "bide",
              moveName: "참기",
              damage: 50,
              isHit: isHit,
              isTurn1Launch: false,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: isMiss ? 150 : 100,
              enemyHpAfter: 125,
              effectiveness: 1.0,
              log: isMiss
                ? `적 ${enemyDisplayName}의 참기 방출!\n하지만 상대에게 빗나갔다!`
                : `적 ${enemyDisplayName}(은)는 참아낸 데미지를 방출했다! 50 데미지!`
            }
          ] : (moveKey === "bide") ? [
            {
              actor: "enemy",
              moveKey: "bide",
              moveName: "참기",
              damage: 50,
              isHit: isHit,
              isTurn1Launch: false,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: isMiss ? 150 : 100,
              enemyHpAfter: 125,
              effectiveness: 1.0,
              log: isMiss
                ? `적 ${enemyDisplayName}의 참기 방출!\n하지만 상대에게 빗나갔다!`
                : `적 ${enemyDisplayName}(은)는 참아낸 데미지를 방출했다! 50 데미지!`
            },
            ...(actMode === "single" ? [] : [{
              actor: "player",
              moveKey: "tackle",
              moveName: "몸통박치기",
              damage: 25,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: isMiss ? 150 : 100,
              enemyHpAfter: 100,
              effectiveness: 1.0,
              log: `아군 ${playerDisplayName}의 몸통박치기! 25 데미지!`
            }])
          ] : (moveKey === "metronome") ? (
            metronomeOnly ? [
              {
                actor: "enemy",
                moveKey: "metronome",
                moveName: "손가락흔들기",
                copiedMoveKey: "none",
                damage: 0,
                isHit: true,
                playerHpAfter: 150,
                enemyHpAfter: 150,
                effectiveness: 1.0,
                log: `적 ${enemyDisplayName}의 손가락흔들기!\n손가락을 흔들어 집중하고 있다!`
              }
            ] : [
              {
                actor: "enemy",
                moveKey: "metronome",
                moveName: "손가락흔들기",
                copiedMoveKey: metronomeSubKey,
                damage: actualDamage,
                isHit: isHit,
                isSuperEffective: false,
                typeMod: 1.0,
                playerHpAfter: isMiss ? 150 : act1EnemyHpAfter,
                enemyHpAfter: 150,
                effectiveness: 1.0,
                log: isMiss
                  ? `적 ${enemyDisplayName}의 손가락흔들기!\n하지만 상대에게 빗나갔다!`
                  : `적 ${enemyDisplayName}의 손가락흔들기!\n손가락을 흔들어 ${metronomeSubKo}(이)가 튀어나왔다!\n${actualDamage} 데미지!`
              },
              ...(actMode === "single" ? [] : [{
                actor: "player",
                moveKey: "tackle",
                moveName: "몸통박치기",
                damage: 25,
                isHit: true,
                isSuperEffective: false,
                typeMod: 1.0,
                playerHpAfter: isMiss ? 150 : act1EnemyHpAfter,
                enemyHpAfter: 125,
                effectiveness: 1.0,
                log: `아군 ${playerDisplayName}의 몸통박치기! 25 데미지!`
              }])
            ]
          ) : (moveKey === "mimic" || moveKey === "copycat") ? (
            actMode === "single" ? [
              {
                actor: "enemy",
                moveKey: "mimic",
                moveName: "흉내쟁이",
                copiedMoveKey: "tackle",
                damage: 35,
                isHit: isHit,
                isSuperEffective: false,
                typeMod: 1.0,
                playerHpAfter: isMiss ? 150 : Math.max(0, 150 - 35),
                enemyHpAfter: 150,
                effectiveness: 1.0,
                log: isMiss
                  ? `적 ${enemyDisplayName}의 흉내쟁이!\n하지만 상대에게 빗나갔다!`
                  : `적 ${enemyDisplayName}의 흉내쟁이!\n아군 ${playerDisplayName}의 몸통박치기(을)를 따라했다!\n35 데미지!`
              }
            ] : [
              {
                actor: "player",
                moveKey: "tackle",
                moveName: "몸통박치기",
                damage: 25,
                isHit: true,
                isSuperEffective: false,
                typeMod: 1.0,
                playerHpAfter: 150,
                enemyHpAfter: 125,
                effectiveness: 1.0,
                log: `아군 ${playerDisplayName}의 몸통박치기! 25 데미지!`
              },
              {
                actor: "enemy",
                moveKey: "mimic",
                moveName: "흉내쟁이",
                copiedMoveKey: "tackle",
                damage: 35,
                isHit: isHit,
                isSuperEffective: false,
                typeMod: 1.0,
                playerHpAfter: isMiss ? 150 : Math.max(0, 150 - 35),
                enemyHpAfter: 125,
                effectiveness: 1.0,
                log: isMiss
                  ? `적 ${enemyDisplayName}의 흉내쟁이!\n하지만 상대에게 빗나갔다!`
                  : `적 ${enemyDisplayName}의 흉내쟁이!\n아군 ${playerDisplayName}의 몸통박치기(을)를 따라했다!\n35 데미지!`
              }
            ]
          ) : (moveKey === "mirror-move") ? (
            actMode === "single" ? [
              {
                actor: "enemy",
                moveKey: "mirror-move",
                moveName: "따라하기",
                copiedMoveKey: mirrorSubKey,
                damage: mirrorIsStatus ? 0 : actualDamage,
                isHit: isHit,
                isSuperEffective: isSuper,
                typeMod: typeMod,
                playerHpAfter: isMiss || mirrorIsStatus ? 150 : Math.max(0, 150 - actualDamage),
                enemyHpAfter: 150,
                effectiveness: typeMod,
                log: isMiss
                  ? `적 ${enemyDisplayName}의 따라하기!\n하지만 상대에게 빗나갔다!`
                  : (mirrorIsStatus
                    ? `적 ${enemyDisplayName}의 따라하기!\n아군 ${playerDisplayName}의 ${mirrorSubKo}(을)를 흉내 냈다!`
                    : `적 ${enemyDisplayName}의 따라하기!\n아군 ${playerDisplayName}의 ${mirrorSubKo}(을)를 흉내 냈다!\n${actualDamage} 데미지!`)
              }
            ] : [
              {
                actor: "player",
                moveKey: mirrorSubKey,
                moveName: mirrorSubKo,
                damage: 25,
                isHit: true,
                isSuperEffective: false,
                typeMod: 1.0,
                playerHpAfter: 150,
                enemyHpAfter: 125,
                effectiveness: 1.0,
                log: `아군 ${playerDisplayName}의 ${mirrorSubKo}! 25 데미지!`
              },
              {
                actor: "enemy",
                moveKey: "mirror-move",
                moveName: "따라하기",
                copiedMoveKey: mirrorSubKey,
                damage: mirrorIsStatus ? 0 : actualDamage,
                isHit: isHit,
                isSuperEffective: isSuper,
                typeMod: typeMod,
                playerHpAfter: isMiss || mirrorIsStatus ? 150 : Math.max(0, 150 - actualDamage),
                enemyHpAfter: 125,
                effectiveness: typeMod,
                log: isMiss
                  ? `적 ${enemyDisplayName}의 따라하기!\n하지만 상대에게 빗나갔다!`
                  : (mirrorIsStatus
                    ? `적 ${enemyDisplayName}의 따라하기!\n아군 ${playerDisplayName}의 ${mirrorSubKo}(을)를 흉내 냈다!`
                    : `적 ${enemyDisplayName}의 따라하기!\n아군 ${playerDisplayName}의 ${mirrorSubKo}(을)를 흉내 냈다!\n${actualDamage} 데미지!`)
              }
            ]
          ) : [
            {
              actor: "enemy",
              moveKey: moveKey,
              moveName: moveKo,
              damage: actualDamage,
              isHit: isHit,
              isSuperEffective: false,
              typeMod: 1.0,
              statChanges: eStatChanges,
              playerHpAfter: customPlayerHp !== undefined ? Math.max(0, customPlayerHp - actualDamage) : ((isOHKO && !isMiss) ? 0 : Math.max(0, 150 - actualDamage)),
              enemyHpAfter: initEnemyHp,
              effectiveness: 1.0,
              log: isMiss
                ? `적 ${enemyDisplayName}의 ${moveKo}!\n하지만 상대에게 빗나갔다!`
                : (isOHKO
                  ? `적 ${enemyDisplayName}의 ${moveKo}!\n일격필살! 아군 ${playerDisplayName}(은)는 쓰러졌다!`
                  : `적 ${enemyDisplayName}의 ${moveKo}! ${actualDamage} 데미지!`)
            }
          ]
        ) : (moveKey === "fly" && flyPhase === "1") ? [
          {
            actor: "player",
            moveKey: "fly",
            moveName: "공중날기",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "fly",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 하늘 높이 날아올랐다!`
          },
          {
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 0,
            isHit: false,
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기!\n하지만 상대에게 닿지 않았다!`
          }
        ] : (moveKey === "fly" && flyPhase === "full") ? [
          {
            actor: "player",
            moveKey: "fly",
            moveName: "공중날기",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "fly",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 하늘 높이 날아올랐다!`
          },
          {
            actor: "player",
            moveKey: "fly",
            moveName: "공중날기",
            damage: actualDamage,
            isHit: isHit,
            isTurn1Launch: false,
            wasDescentFromAir: true,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            playerHpAfter: 150,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 공중날기!\n하지만 상대에게 빗나갔다!`
              : (isSuper
                ? `아군 ${playerDisplayName}의 공중날기! 효과가 굉장했다! ${actualDamage} 데미지!`
                : `아군 ${playerDisplayName}의 공중날기! ${actualDamage} 데미지!`)
          }
        ] : (moveKey === "fly") ? [
          {
            actor: "player",
            moveKey: "fly",
            moveName: "공중날기",
            damage: actualDamage,
            isHit: isHit,
            isTurn1Launch: false,
            wasDescentFromAir: true,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            playerHpAfter: 150,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 공중날기!\n하지만 상대에게 빗나갔다!`
              : (isSuper
                ? `아군 ${playerDisplayName}의 공중날기! 효과가 굉장했다! ${actualDamage} 데미지!`
                : `아군 ${playerDisplayName}의 공중날기! ${actualDamage} 데미지!`)
          },
          {
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 25,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 125,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기! 25 데미지!`
          }
        ] : (moveKey === "razor-wind" && flyPhase === "1") ? [
          {
            actor: "player",
            moveKey: "razor-wind",
            moveName: "칼바람",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "razor-wind",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 칼바람을 일으켰다!`
          },
          {
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 20,
            isHit: true,
            playerHpAfter: 130,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기! 20 데미지!`
          }
        ] : (moveKey === "razor-wind" && flyPhase === "full") ? [
          {
            actor: "player",
            moveKey: "razor-wind",
            moveName: "칼바람",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "razor-wind",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 칼바람을 일으켰다!`
          },
          {
            actor: "player",
            moveKey: "razor-wind",
            moveName: "칼바람",
            damage: actualDamage,
            isHit: isHit,
            isTurn1Launch: false,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            playerHpAfter: 150,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 칼바람!\n하지만 상대에게 빗나갔다!`
              : (isSuper
                ? `아군 ${playerDisplayName}의 칼바람! 효과가 굉장했다! 급소에 맞았다! ${actualDamage} 데미지!`
                : `아군 ${playerDisplayName}의 칼바람! 급소에 맞았다! ${actualDamage} 데미지!`)
          }
        ] : (moveKey === "razor-wind") ? [
          {
            actor: "player",
            moveKey: "razor-wind",
            moveName: "칼바람",
            damage: actualDamage,
            isHit: isHit,
            isTurn1Launch: false,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            playerHpAfter: 150,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 칼바람!\n하지만 상대에게 빗나갔다!`
              : (isSuper
                ? `아군 ${playerDisplayName}의 칼바람! 효과가 굉장했다! 급소에 맞았다! ${actualDamage} 데미지!`
                : `아군 ${playerDisplayName}의 칼바람! 급소에 맞았다! ${actualDamage} 데미지!`)
          },
          {
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 20,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 130,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기! 20 데미지!`
          }
        ] : (moveKey === "dig" && flyPhase === "1") ? [
          {
            actor: "player",
            moveKey: "dig",
            moveName: "구멍파기",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "dig",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 땅속으로 파고들었다!`
          },
          ...(actMode === "single" ? [] : [{
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 0,
            isHit: false,
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기!\n하지만 상대에게 닿지 않았다!`
          }])
        ] : (moveKey === "dig" && flyPhase === "full") ? [
          {
            actor: "player",
            moveKey: "dig",
            moveName: "구멍파기",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "dig",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 땅속으로 파고들었다!`
          },
          {
            actor: "player",
            moveKey: "dig",
            moveName: "구멍파기",
            damage: actualDamage,
            isHit: isHit,
            isTurn1Launch: false,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            playerHpAfter: 150,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 구멍파기!\n하지만 상대에게 빗나갔다!`
              : (isSuper
                ? `아군 ${playerDisplayName}의 구멍파기! 효과가 굉장했다! ${actualDamage} 데미지!`
                : `아군 ${playerDisplayName}의 구멍파기! ${actualDamage} 데미지!`)
          }
        ] : (moveKey === "dig") ? [
          {
            actor: "player",
            moveKey: "dig",
            moveName: "구멍파기",
            damage: actualDamage,
            isHit: isHit,
            isTurn1Launch: false,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            playerHpAfter: 150,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 구멍파기!\n하지만 상대에게 빗나갔다!`
              : (isSuper
                ? `아군 ${playerDisplayName}의 구멍파기! 효과가 굉장했다! ${actualDamage} 데미지!`
                : `아군 ${playerDisplayName}의 구멍파기! ${actualDamage} 데미지!`)
          },
          ...(actMode === "single" ? [] : [{
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 25,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 125,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기! 25 데미지!`
          }])
        ] : ((moveKey === "bide" && flyPhase === "1") || moveKey === "bide-charge") ? [
          {
            actor: "player",
            moveKey: "bide-charge",
            moveName: "참기 (참기)",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "bide",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 참기를 시작했다!`
          }
        ] : (moveKey === "bide" && flyPhase === "full") ? [
          {
            actor: "player",
            moveKey: "bide",
            moveName: "참기",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "bide",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 참기를 시작했다!`
          },
          {
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 25,
            isHit: true,
            playerHpAfter: 125,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기! 25 데미지!`
          },
          {
            actor: "player",
            moveKey: "bide",
            moveName: "참기",
            damage: 50,
            isHit: isHit,
            isTurn1Launch: false,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 125,
            enemyHpAfter: isMiss ? 150 : 100,
            effectiveness: 1.0,
            log: isMiss
              ? `아군 ${playerDisplayName}의 참기 방출!\n하지만 상대에게 빗나갔다!`
              : `아군 ${playerDisplayName}(은)는 참아낸 데미지를 방출했다! 50 데미지!`
          }
        ] : (moveKey === "bide") ? [
          {
            actor: "player",
            moveKey: "bide",
            moveName: "참기",
            damage: 50,
            isHit: isHit,
            isTurn1Launch: false,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 125,
            enemyHpAfter: isMiss ? 150 : 100,
            effectiveness: 1.0,
            log: isMiss
              ? `아군 ${playerDisplayName}의 참기 방출!\n하지만 상대에게 빗나갔다!`
              : `아군 ${playerDisplayName}(은)는 참아낸 데미지를 방출했다! 50 데미지!`
          },
          ...(actMode === "single" ? [] : [{
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 20,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 105,
            enemyHpAfter: isMiss ? 150 : 100,
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기! 20 데미지!`
          }])
        ] : (moveKey === "metronome") ? (
          metronomeOnly ? [
            {
              actor: "player",
              moveKey: "metronome",
              moveName: "손가락흔들기",
              copiedMoveKey: "none",
              damage: 0,
              isHit: true,
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `아군 ${playerDisplayName}의 손가락흔들기!\n손가락을 흔들어 집중하고 있다!`
            }
          ] : [
            {
              actor: "player",
              moveKey: "metronome",
              moveName: "손가락흔들기",
              copiedMoveKey: metronomeSubKey,
              damage: actualDamage,
              isHit: isHit,
              isSuperEffective: isSuper,
              typeMod: typeMod,
              playerHpAfter: 150,
              enemyHpAfter: isMiss ? 150 : act1EnemyHpAfter,
              effectiveness: typeMod,
              log: isMiss
                ? `아군 ${playerDisplayName}의 손가락흔들기!\n손가락을 흔들어 ${metronomeSubKo}(이)가 튀어나왔다!\n하지만 상대에게 빗나갔다!`
                : `아군 ${playerDisplayName}의 손가락흔들기!\n손가락을 흔들어 ${metronomeSubKo}(이)가 튀어나왔다!\n${actualDamage} 데미지!`
            },
            ...(actMode === "single" ? [] : [{
              actor: "enemy",
              moveKey: "tackle",
              moveName: "몸통박치기",
              damage: 25,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: 125,
              enemyHpAfter: isMiss ? 150 : act1EnemyHpAfter,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}의 몸통박치기! 25 데미지!`
            }])
          ]
        ) : (moveKey === "mimic" || moveKey === "copycat") ? (
          actMode === "single" ? [
            {
              actor: "player",
              moveKey: "mimic",
              moveName: "흉내쟁이",
              copiedMoveKey: "tackle",
              damage: 35,
              isHit: isHit,
              isSuperEffective: isSuper,
              typeMod: typeMod,
              playerHpAfter: 150,
              enemyHpAfter: isMiss ? 150 : Math.max(0, 150 - 35),
              effectiveness: 1.0,
              log: isMiss
                ? `아군 ${playerDisplayName}의 흉내쟁이!\n하지만 상대에게 빗나갔다!`
                : `아군 ${playerDisplayName}의 흉내쟁이!\n상대 ${enemyDisplayName}의 몸통박치기(을)를 따라했다!\n35 데미지!`,
            }
          ] : [
            {
              actor: "enemy",
              moveKey: "tackle",
              moveName: "몸통박치기",
              damage: 25,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: 125,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}의 몸통박치기! 25 데미지!`
            },
            {
              actor: "player",
              moveKey: "mimic",
              moveName: "흉내쟁이",
              copiedMoveKey: "tackle",
              damage: 35,
              isHit: isHit,
              isSuperEffective: isSuper,
              typeMod: typeMod,
              playerHpAfter: 125,
              enemyHpAfter: isMiss ? 150 : Math.max(0, 150 - 35),
              effectiveness: 1.0,
              log: isMiss
                ? `아군 ${playerDisplayName}의 흉내쟁이!\n하지만 상대에게 빗나갔다!`
                : `아군 ${playerDisplayName}의 흉내쟁이!\n상대 ${enemyDisplayName}의 몸통박치기(을)를 따라했다!\n35 데미지!`,
            }
          ]
        ) : (moveKey === "mirror-move") ? (
          actMode === "single" ? [
            {
              actor: "player",
              moveKey: "mirror-move",
              moveName: "따라하기",
              copiedMoveKey: mirrorSubKey,
              damage: actualDamage,
              isHit: isHit,
              isSuperEffective: isSuper,
              typeMod: typeMod,
              playerHpAfter: 150,
              enemyHpAfter: isMiss ? 150 : Math.max(0, 150 - actualDamage),
              effectiveness: typeMod,
              log: isMiss
                ? `아군 ${playerDisplayName}의 따라하기!\n하지만 상대에게 빗나갔다!`
                : `아군 ${playerDisplayName}의 따라하기!\n상대 ${enemyDisplayName}의 ${mirrorSubKo}(을)를 흉내 냈다!\n${actualDamage} 데미지!`,
            }
          ] : [
            {
              actor: "enemy",
              moveKey: mirrorSubKey,
              moveName: mirrorSubKo,
              damage: 45,
              isHit: true,
              isSuperEffective: true,
              typeMod: 2.0,
              playerHpAfter: 105,
              enemyHpAfter: 150,
              effectiveness: 2.0,
              log: `적 ${enemyDisplayName}의 ${mirrorSubKo}! 효과가 굉장했다! 45 데미지!`
            },
            {
              actor: "player",
              moveKey: "mirror-move",
              moveName: "따라하기",
              copiedMoveKey: mirrorSubKey,
              damage: actualDamage,
              isHit: isHit,
              isSuperEffective: isSuper,
              typeMod: typeMod,
              playerHpAfter: 105,
              enemyHpAfter: isMiss ? 150 : Math.max(0, 150 - actualDamage),
              effectiveness: typeMod,
              log: isMiss
                ? `아군 ${playerDisplayName}의 따라하기!\n하지만 상대에게 빗나갔다!`
                : `아군 ${playerDisplayName}의 따라하기!\n상대 ${enemyDisplayName}의 ${mirrorSubKo}(을)를 흉내 냈다!\n${actualDamage} 데미지!`
            }
          ]
        ) : (moveKey === "perk-hug") ? [
          {
            actor: "player",
            moveKey: "perk-hug",
            moveName: "포옹",
            damage: 0,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `[PERK:hug] ${playerDisplayName}(은)는 당신을 포옹하고 돌아갔다.`
          }
        ] : (moveKey === "self-destruct") ? [
          {
            actor: "player",
            moveKey: "self-destruct",
            moveName: "자폭",
            damage: isMiss ? 0 : Math.round(95 * typeMod),
            isHit: isHit,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            playerHpAfter: 0,
            enemyHpAfter: isMiss ? 150 : Math.max(0, 150 - Math.round(95 * typeMod)),
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 자폭!\n하지만 상대에게 빗나갔다!\n${playerDisplayName}(은)는 폭발하여 스스로 쓰러졌다!`
              : `아군 ${playerDisplayName}의 자폭! ${Math.round(95 * typeMod)} 데미지!\n${playerDisplayName}(은)는 폭발하여 스스로 쓰러졌다!`
          },
          ...(actMode === "dual" ? [
            {
              actor: "enemy",
              moveKey: "self-destruct",
              moveName: "자폭",
              damage: isMiss ? 0 : Math.round(95 * typeMod),
              isHit: isHit,
              isSuperEffective: isSuper,
              typeMod: typeMod,
              playerHpAfter: 0,
              enemyHpAfter: 0,
              effectiveness: typeMod,
              log: isMiss
                ? `적 ${enemyDisplayName}의 자폭!\n하지만 상대에게 빗나갔다!\n${enemyDisplayName}(은)는 폭발하여 스스로 쓰러졌다!`
                : `적 ${enemyDisplayName}의 자폭! ${Math.round(95 * typeMod)} 데미지!\n${enemyDisplayName}(은)는 폭발하여 스스로 쓰러졌다!`
            }
          ] : [])
        ] : (isOHKO && !isMiss) ? [
          {
            actor: "player",
            moveKey: moveKey,
            moveName: moveKo,
            damage: actualDamage,
            isHit: isHit,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 150,
            enemyHpAfter: 0,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}의 ${moveKo}!\n일격필살! 상대 ${enemyDisplayName}(은)는 쓰러졌다!`
          }
        ] : (actMode === "dual" ? [
          {
            actor: "player",
            moveKey: moveKey,
            moveName: moveKo,
            damage: actualDamage,
            isHit: isHit,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            statChanges: pStatChanges,
            playerHpAfter: (moveKey === "take-down" || moveKey === "double-edge") ? 135 : 150,
            enemyHpAfter: act1EnemyHpAfter,
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 ${moveKo}!\n하지만 상대에게 빗나갔다!`
              : (isImmune
                ? `아군 ${playerDisplayName}의 ${moveKo}!\n상대에게 효과가 없는 것 같다...`
                : (isQuarter || isNotVery
                  ? `아군 ${playerDisplayName}의 ${moveKo}!\n효과가 별로인 듯하다...`
                  : (isSuper || isUltra
                    ? `아군 ${playerDisplayName}의 ${moveKo}!\n효과가 굉장했다!`
                    : `아군 ${playerDisplayName}의 ${moveKo}!`)))
          },
          {
            actor: "enemy",
            moveKey: moveKey,
            moveName: moveKo,
            damage: actualDamage,
            isHit: isHit,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            statChanges: eStatChanges,
            playerHpAfter: isStatus ? 150 : (isMiss || isImmune ? 150 : Math.max(0, 150 - actualDamage)),
            enemyHpAfter: (moveKey === "take-down" || moveKey === "double-edge")
              ? 135
              : (isStatus ? 150 : (isMiss || isImmune ? 150 : Math.max(0, 150 - actualDamage))),
            effectiveness: typeMod,
            log: isMiss
              ? `적 ${enemyDisplayName}의 ${moveKo}!\n하지만 상대에게 빗나갔다!`
              : (isImmune
                ? `적 ${enemyDisplayName}의 ${moveKo}!\n상대에게 효과가 없는 것 같다...`
                : (isQuarter || isNotVery
                  ? `적 ${enemyDisplayName}의 ${moveKo}!\n효과가 별로인 듯하다...`
                  : (isSuper || isUltra
                    ? `적 ${enemyDisplayName}의 ${moveKo}!\n효과가 굉장했다!`
                    : `적 ${enemyDisplayName}의 ${moveKo}!`)))
          }
        ] : [
          {
            actor: "player",
            moveKey: moveKey,
            moveName: moveKo,
            damage: actualDamage,
            isHit: isHit,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            statChanges: pStatChanges,
            playerHpAfter: customPlayerHp !== undefined ? (moveKey === "take-down" || moveKey === "double-edge" ? Math.max(0, customPlayerHp - Math.round(actualDamage * 0.25)) : customPlayerHp) : ((moveKey === "take-down" || moveKey === "double-edge") ? 135 : 150),
            enemyHpAfter: act1EnemyHpAfter,
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 ${moveKo}!\n하지만 상대에게 빗나갔다!`
              : (isImmune
                ? `아군 ${playerDisplayName}의 ${moveKo}!\n상대에게 효과가 없는 것 같다...`
                : (isQuarter || isNotVery
                  ? `아군 ${playerDisplayName}의 ${moveKo}!\n효과가 별로인 듯하다...`
                  : (isSuper || isUltra
                    ? `아군 ${playerDisplayName}의 ${moveKo}!\n효과가 굉장했다!`
                    : `아군 ${playerDisplayName}의 ${moveKo}!`)))
          }
        ])
      };

      const t0 = Date.now();
      let gifResult: any;
      if (moveKey === "encounter-entry") {
        gifResult = await renderBattleEntryGif({
          battle: {
            ...mockBattle,
            dialogueText: `야생의 ${enemyDisplayName}(이)가 나타났다!`,
          } as any,
          lang: "ko",
        });
      } else {
        if (!mockBattle.dialogueText && mockBattle.turnActions?.length) {
          mockBattle.dialogueText = mockBattle.turnActions.map((a: any) => a.log).filter(Boolean).join("\n");
        }
        gifResult = await renderBattleMoveGif({
          battle: mockBattle as any,
          lang: "ko",
          includeFramePreviews: true,
        });
      }
      const t1 = Date.now();

      let pageCount = gifResult.frames ? gifResult.frames.length : 25;
      try {
        const meta = await sharp(gifResult.buffer, { animated: true }).metadata();
        pageCount = meta.pages || pageCount;
      } catch {}

      const responseData = {
        gif: `data:image/gif;base64,${gifResult.buffer.toString("base64")}`,
        renderTimeMs: t1 - t0,
        motionDurationMs: gifResult.motionDurationMs,
        frameCount: pageCount,
        moveKey: rawMoveKey,
        moveName: isEnemyCaster ? `${moveKo} (상대 시전)` : moveKo,
        phases: gifResult.phases || [],
        frames: gifResult.frames || [],
        cachedAt: Date.now(),
        mtime: getMoveLatestMtime(rawMoveKey),
      };

      moveGifMemoryCache.set(cacheKey, responseData);

      if (url.searchParams.get("format") === "gif" || (req.headers.accept && req.headers.accept.includes("image/gif"))) {
        res.writeHead(200, {
          "Content-Type": "image/gif",
          "Content-Length": gifResult.buffer.length,
          "Cache-Control": "no-cache"
        });
        res.end(gifResult.buffer);
        return;
      }

      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.end(JSON.stringify(responseData));
    } catch (err: any) {
      console.error("[VIEWER MOVE ERROR]", err);
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 3. Initial State Endpoint
  if (req.method === "GET" && req.url?.startsWith("/api/initial")) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const screen = url.searchParams.get("screen") || "title";

      let result: any;
      if (screen === "title") {
        result = await renderTitleMessageData(null as any, SIMULATED_USER_ID);
      } else if (screen === "slots") {
        result = renderSlotsScreenData(SIMULATED_USER_ID);
      } else if (screen === "starter_select") {
        result = await renderStarterSelectMessageData(
          null as any,
          SIMULATED_USER_ID,
          1,
          0,
          1,
          1,
          [],
          false,
          false,
          false
        );
      } else if (screen === "party") {
        result = await renderPartyViewMessageData(
          null as any,
          SIMULATED_USER_ID,
          1,
          0,
          1,
          1,
          "1:2:1:1-4:1:0:1-7:0:1:0",
          false,
          false,
          false,
          0,
          "moves",
          0
        );
      } else if (screen === "pokedex") {
        result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, 1, 1, "title");
      } else if (screen === "bag") {
        result = await renderBagMessageData(null as any, SIMULATED_USER_ID, "pokemon");
      } else if (screen === "multiplayer") {
        result = await renderMultiplayerMessageData(null as any, SIMULATED_USER_ID);
      } else if (screen === "settings") {
        result = renderSettingsMessageData(SIMULATED_USER_ID);
      } else {
        result = await renderTitleMessageData(null as any, SIMULATED_USER_ID);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(serializeDiscordMessagePayload(result)));
    } catch (err: any) {
      console.error("[VIEWER INITIAL ERROR]", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 4. Click Interaction Dispatcher
  if (req.method === "POST" && req.url === "/api/click") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { customId } = JSON.parse(body || "{}");
        if (!customId) throw new Error("Missing customId");

        console.log(`[VIEWER INTERACTION] Clicked customId: ${customId}`);

        const parts = customId.split("_");
        let result: any;

        if (customId.startsWith("menu_back_to_title_") || customId.startsWith("starter_back_title_")) {
          result = await renderTitleMessageData(null as any, SIMULATED_USER_ID);
        } else if (customId.startsWith("menu_inventory_") || customId.startsWith("bag_tab_")) {
          if (customId.includes("pokedex")) {
            result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, 1, 1, "inventory");
          } else {
            const tab = customId.includes("records") ? "records" : "pokemon";
            result = await renderBagMessageData(null as any, SIMULATED_USER_ID, tab);
          }
        } else if (customId.startsWith("menu_settings_")) {
          result = renderSettingsMessageData(SIMULATED_USER_ID);
        } else if (customId.startsWith("settings_lang_")) {
          const lang = parts[2] as "en" | "ko";
          saveService.setLanguage(SIMULATED_USER_ID, lang);
          result = renderSettingsMessageData(SIMULATED_USER_ID);
        } else if (customId.startsWith("menu_multiplay_")) {
          result = await renderMultiplayerMessageData(null as any, SIMULATED_USER_ID);
        } else if (customId.startsWith("multi_pokedex_btn_")) {
          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, 1, 1, "multiplay");
        } else if (customId.startsWith("pokedex_ability_")) {
          const rawAbilityParam = parts[2] || "none";
          const rawAbility = rawAbilityParam === "none" ? undefined : decodeURIComponent(rawAbilityParam);
          const dexNo = parseInt(parts[3], 10) || 1;
          const page = parseInt(parts[4], 10) || 1;
          const fromScreen = (parts[5] || "title") as "multiplay" | "inventory" | "title";
          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, dexNo, page, fromScreen, rawAbility);
        } else if (customId.startsWith("pokedex_select_")) {
          const dexNo = parseInt(parts[2], 10) || 1;
          const page = parseInt(parts[3], 10) || 1;
          const fromScreen = (parts[4] || "title") as "multiplay" | "inventory" | "title";
          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, dexNo, page, fromScreen, undefined);
        } else if (
          customId.startsWith("pokedex_page_") ||
          customId.startsWith("pokedex_pageprev_") ||
          customId.startsWith("pokedex_pagenext_") ||
          customId.startsWith("pokedex_jumpback_") ||
          customId.startsWith("pokedex_jumpfwd_")
        ) {
          const targetPage = parseInt(parts[2], 10) || 1;
          const currentDexNo = parseInt(parts[3], 10) || ((targetPage - 1) * 8 + 1);
          const fromScreen = (parts[4] || "title") as "multiplay" | "inventory" | "title";
          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, currentDexNo, targetPage, fromScreen, undefined);
        } else if (customId.startsWith("pokedex_back_")) {
          const fromScreen = parts[2] as "multiplay" | "inventory" | "title";
          if (fromScreen === "multiplay") {
            result = await renderMultiplayerMessageData(null as any, SIMULATED_USER_ID);
          } else if (fromScreen === "inventory") {
            result = await renderBagMessageData(null as any, SIMULATED_USER_ID, "pokemon");
          } else {
            result = await renderTitleMessageData(null as any, SIMULATED_USER_ID);
          }
        } else if (customId.startsWith("pokedex_add_multi_")) {
          const dexNo = parseInt(parts[3], 10) || 1;
          const page = parseInt(parts[4], 10) || 1;
          const fromScreen = (parts[5] || "multiplay") as "multiplay" | "inventory" | "title";
          const poke = await getPokemonByDexNumber(dexNo);
          if (poke) {
            const partyPoke: PartyPokemon = {
              speciesId: poke.speciesId,
              name: poke.koreanName || poke.name,
              level: 50,
              hp: poke.hp * 2 + 110,
              maxHp: poke.hp * 2 + 110,
              moves: ["Tackle", "Quick Attack"],
            };
            saveService.addMultiplayerPokemon(SIMULATED_USER_ID, partyPoke);
          }
          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, dexNo, page, fromScreen);
        } else if (customId.startsWith("pokedex_add_bag_")) {
          const dexNo = parseInt(parts[3], 10) || 1;
          const page = parseInt(parts[4], 10) || 1;
          const fromScreen = (parts[5] || "inventory") as "multiplay" | "inventory" | "title";
          const poke = await getPokemonByDexNumber(dexNo);
          if (poke) {
            const partyPoke: PartyPokemon = {
              speciesId: poke.speciesId,
              name: poke.koreanName || poke.name,
              level: 25,
              hp: poke.hp + 50,
              maxHp: poke.hp + 50,
              moves: ["Tackle", "Growl"],
            };
            saveService.addBagPokemon(SIMULATED_USER_ID, partyPoke);
          }
          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, dexNo, page, fromScreen);
        } else if (customId.startsWith("menu_newgame_")) {
          const targetSlot = saveService.getFirstAvailableSlot(SIMULATED_USER_ID);
          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, targetSlot, 0, 1, 1, [], false, false, false);
        } else if (customId.startsWith("menu_loadgame_")) {
          result = renderSlotsScreenData(SIMULATED_USER_ID);
        } else if (customId.startsWith("slot_select_")) {
          const slotId = parseInt(parts[2], 10) || 1;
          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, 0, 1, 1, [], false, false, false);
        } else if (customId.startsWith("starter_open_gen_menu_") || customId.startsWith("starter_genmenu_")) {
          const rawGen = parseInt(parts[2], 10);
          const currentGen = isNaN(rawGen) ? 0 : rawGen;
          const slotId = parseInt(parts[3], 10) || 1;
          const partyParam = parts[4] || "empty";
          const flagsParam = parts[5] || "0_0_0";
          result = await renderGenSelectMessageData(null as any, SIMULATED_USER_ID, currentGen, slotId, partyParam, flagsParam);
        } else if (customId.startsWith("starter_pickgen_") || customId.startsWith("starter_genback_")) {
          const isBack = customId.startsWith("starter_genback_");
          const chosenGen = parseInt(parts[2], 10) || 0;
          const prevGen = parseInt(parts[3], 10) || 0;
          const slotId = parseInt(parts[4], 10) || 1;
          const partyRaw = parts[5] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[6] === "1";
          const isHa = parts[7] === "1";
          const isPassive = parts[8] === "1";

          const nextGen = isBack ? chosenGen : (chosenGen === prevGen ? 0 : chosenGen);
          const genStarters = getStartersByGen(nextGen);
          const firstStarterDex = genStarters[0]?.dexNumber || 1;

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, nextGen, 1, firstStarterDex, partyDexList, isShiny, isHa, isPassive);
        } else if (customId.startsWith("starter_sel_") || customId.startsWith("starter_slot_")) {
          const dexNo = parseInt(parts[2], 10) || 1;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, isShiny, isHa, isPassive);
        } else if (
          customId.startsWith("starter_page_prev_") ||
          customId.startsWith("starter_page_next_") ||
          customId.startsWith("starter_page_jumpfirst_") ||
          customId.startsWith("starter_page_jumplast_") ||
          customId.startsWith("starter_page_")
        ) {
          const action = parts[2];
          const gen = parseInt(parts[3], 10) || 0;
          const curPage = parseInt(parts[4], 10) || 1;
          const currentDexNo = parseInt(parts[5], 10) || 1;
          const slotId = parseInt(parts[6], 10) || 1;
          const partyRaw = parts[7] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[8] === "1";
          const isHa = parts[9] === "1";
          const isPassive = parts[10] === "1";

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          let allStarters = getStartersByGen(gen).filter((s) => userStarters.get(s.speciesId)?.isUnlocked);
          if (isShiny) allStarters = allStarters.filter((s) => (userStarters.get(s.speciesId)?.shinyTier || 0) > 0);
          if (isHa) allStarters = allStarters.filter((s) => userStarters.get(s.speciesId)?.hasHiddenAbility);
          if (isPassive) allStarters = allStarters.filter((s) => userStarters.get(s.speciesId)?.passiveUnlocked);

          const totalPages = Math.max(1, Math.ceil(allStarters.length / 8));
          let targetPage = curPage;

          if (action === "prev") targetPage = Math.max(1, curPage - 1);
          else if (action === "next") targetPage = Math.min(totalPages, curPage + 1);
          else if (action === "jumpfirst") targetPage = 1;
          else if (action === "jumplast") targetPage = totalPages;

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, targetPage, currentDexNo, partyDexList, isShiny, isHa, isPassive);
        } else if (customId.startsWith("starter_toggleshiny_")) {
          const gen = parseInt(parts[2], 10) || 0;
          const page = parseInt(parts[3], 10) || 1;
          const dexNo = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, !isShiny, isHa, isPassive);
        } else if (customId.startsWith("starter_togglepass_")) {
          const gen = parseInt(parts[2], 10) || 0;
          const page = parseInt(parts[3], 10) || 1;
          const dexNo = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, isShiny, isHa, !isPassive);
        } else if (customId.startsWith("starter_toggleha_")) {
          const gen = parseInt(parts[2], 10) || 0;
          const page = parseInt(parts[3], 10) || 1;
          const dexNo = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, isShiny, !isHa, isPassive);
        } else if (customId.startsWith("starter_add_")) {
          const dexNo = parseInt(parts[2], 10) || 1;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          if (!partyDexList.includes(dexNo) && partyDexList.length < 6) {
            partyDexList.push(dexNo);
          }

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, isShiny, isHa, isPassive);
        } else if (customId.startsWith("starter_openparty_")) {
          const dexNo = parseInt(parts[2], 10) || 1;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, 0, "moves", 0);
        } else if (customId.startsWith("party_pick_")) {
          const rawIdx = parseInt(parts[2], 10);
          const targetIdx = isNaN(rawIdx) ? -1 : rawIdx;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const dexNo = parseInt(parts[5], 10) || 1;
          const slotId = parseInt(parts[6], 10) || 1;
          const partyRaw = parts[7] || "empty";
          const isShiny = parts[8] === "1";
          const isHa = parts[9] === "1";
          const isPassive = parts[10] === "1";
          const tab = (parts[11] || "moves") as PartyViewTab;
          const moveIdx = 0;

          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, targetIdx, tab, moveIdx);
        } else if (customId.startsWith("party_tab_")) {
          const targetTab = parts[2] as PartyViewTab;
          const currentIdx = parseInt(parts[3], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          const partyRaw = parts[8] || "empty";
          const isShiny = parts[9] === "1";
          const isHa = parts[10] === "1";
          const isPassive = parts[11] === "1";
          const moveIdx = parseInt(parts[12], 10) || 0;

          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, currentIdx, targetTab, moveIdx);
        } else if (customId.startsWith("party_movepick_") || customId.startsWith("party_pickmove_")) {
          const targetMoveIdx = parseInt(parts[2], 10) || 0;
          const currentIdx = parseInt(parts[3], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          const partyRaw = parts[8] || "empty";
          const isShiny = parts[9] === "1";
          const isHa = parts[10] === "1";
          const isPassive = parts[11] === "1";
          const tab: PartyViewTab = "moves";

          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, currentIdx, tab, targetMoveIdx);
        } else if (customId.startsWith("party_setshiny_")) {
          const targetShinyTier = parseInt(parts[2], 10) || 0;
          const currentIdx = parseInt(parts[3], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          const partyRaw = parts[8] || "empty";
          const isShiny = parts[9] === "1";
          const isHa = parts[10] === "1";
          const isPassive = parts[11] === "1";
          const tab = (parts[12] || "shiny") as PartyViewTab;
          const moveIdx = parseInt(parts[13], 10) || 0;

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          const partyStates = parsePartyParam(partyRaw, userStarters);
          const targetMember = partyStates[currentIdx];
          if (targetMember) {
            targetMember.shinyTier = targetShinyTier;
          }
          const newPartyParam = serializePartyParam(partyStates);
          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx);
        } else if (customId.startsWith("party_setha_") || customId.startsWith("party_toggleha_")) {
          const isSet = customId.startsWith("party_setha_");
          const targetUseHa = isSet ? parts[2] === "1" : undefined;
          const currentIdx = parseInt(parts[isSet ? 3 : 2], 10) || 0;
          const gen = parseInt(parts[isSet ? 4 : 3], 10) || 0;
          const page = parseInt(parts[isSet ? 5 : 4], 10) || 1;
          const dexNo = parseInt(parts[isSet ? 6 : 5], 10) || 1;
          const slotId = parseInt(parts[isSet ? 7 : 6], 10) || 1;
          const partyRaw = parts[isSet ? 8 : 7] || "empty";
          const isShiny = parts[isSet ? 9 : 8] === "1";
          const isHa = parts[isSet ? 10 : 9] === "1";
          const isPassive = parts[isSet ? 11 : 10] === "1";
          const tab = (parts[isSet ? 12 : 11] || "moves") as PartyViewTab;
          const moveIdx = parseInt(parts[isSet ? 13 : 12], 10) || 0;

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          const partyStates = parsePartyParam(partyRaw, userStarters);
          const targetMember = partyStates[currentIdx];
          if (targetMember) {
            targetMember.useHiddenAbility = isSet ? (targetUseHa ?? !targetMember.useHiddenAbility) : !targetMember.useHiddenAbility;
          }
          const newPartyParam = serializePartyParam(partyStates);
          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx);
        } else if (customId.startsWith("party_togglepass_")) {
          const currentIdx = parseInt(parts[2], 10) || 0;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const dexNo = parseInt(parts[5], 10) || 1;
          const slotId = parseInt(parts[6], 10) || 1;
          const partyRaw = parts[7] || "empty";
          const isShiny = parts[8] === "1";
          const isHa = parts[9] === "1";
          const isPassive = parts[10] === "1";
          const tab = (parts[11] || "moves") as PartyViewTab;
          const moveIdx = parseInt(parts[12], 10) || 0;

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          const partyStates = parsePartyParam(partyRaw, userStarters);
          const targetMember = partyStates[currentIdx];
          if (targetMember) {
            targetMember.usePassive = !targetMember.usePassive;
          }
          const newPartyParam = serializePartyParam(partyStates);
          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx);
        } else if (customId.startsWith("party_remove_")) {
          const currentIdx = parseInt(parts[2], 10) || 0;
          const removeDex = parseInt(parts[3], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          const partyRaw = parts[8] || "empty";
          const isShiny = parts[9] === "1";
          const isHa = parts[10] === "1";
          const isPassive = parts[11] === "1";
          const tab = (parts[12] || "moves") as PartyViewTab;
          const moveIdx = parseInt(parts[13], 10) || 0;

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          const partyStates = parsePartyParam(partyRaw, userStarters);
          const filteredStates = partyStates.filter((p) => p.dexNumber !== removeDex);
          const newPartyParam = serializePartyParam(filteredStates);
          const nextSelectedIdx = Math.max(0, Math.min(currentIdx, filteredStates.length - 1));

          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, nextSelectedIdx, tab, moveIdx);
        } else if (customId.startsWith("party_back_starter_")) {
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const dexNo = parseInt(parts[5], 10) || 1;
          const slotId = parseInt(parts[6], 10) || 1;
          const partyRaw = parts[7] || "empty";
          const isShiny = parts[8] === "1";
          const isHa = parts[9] === "1";
          const isPassive = parts[10] === "1";

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          const partyStates = parsePartyParam(partyRaw, userStarters);
          const partyDexList = partyStates.map((p) => p.dexNumber);

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, isShiny, isHa, isPassive);
        } else {
          result = await renderTitleMessageData(null as any, SIMULATED_USER_ID);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(serializeDiscordMessagePayload(result)));
      } catch (err: any) {
        console.error("[VIEWER CLICK ERROR]", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`[SERVER] Port ${PORT} in use, retrying in 1000ms...`);
    setTimeout(() => {
      try { server.close(); } catch {}
      server.listen(PORT, "0.0.0.0");
    }, 1000);
  } else {
    console.error("[SERVER ERROR]", err);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`================================================`);
  console.log(`  🎨 ROGUEPot Canvas UI Viewer Started!`);
  console.log(`  🔗 Open in Browser: http://localhost:${PORT}`);
  console.log(`  🔗 Alternative IP: http://127.0.0.1:${PORT}`);
  console.log(`================================================`);
});