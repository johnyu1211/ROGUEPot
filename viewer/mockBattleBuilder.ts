import { VERIFIED_MOVES } from "./movesData.js";
import { getMoveData } from "../src/data/movesKo.js";
import { POKEMON_SPECIES_DATA } from "../src/data/pokemonStats.js";
import { POKEMON_NAMES_KO } from "../src/data/pokemonNamesKo.js";
import { getTypeEffectiveness } from "../src/battle/mechanics/typeChart.js";

export interface MockBattleParams {
  playerSpecies?: string;
  enemySpecies?: string;
  biome?: string;
  hitMode?: string;
  flyPhase?: string;
  actMode?: string;
  subMove?: string;
  playerHp?: number;
  enemyHp?: number;
  playerMaxHp?: number;
  enemyMaxHp?: number;
  damage?: number;
  dialogue?: string;
  statDirection?: string;
  statTarget?: string;
}

export interface MockBattleResult {
  mockBattle: any;
  rawMoveKey: string;
  moveKey: string;
  moveKo: string;
  playerDisplayName: string;
  enemyDisplayName: string;
  isEnemyCaster: boolean;
  metronomeSubKey: string;
  mirrorSubKey: string;
  playerSpecies: string;
  enemySpecies: string;
  biome: string;
  hitMode: string;
  flyPhase: string;
  actMode: string;
  customPlayerHp?: number;
  customEnemyHp?: number;
  customDamage?: number;
  customDialogue?: string;
  customStatDirection?: string;
  customStatTarget?: string;
}

export function buildMockBattleForViewer(rawMoveKey: string, params: MockBattleParams = {}): MockBattleResult {
  const isEnemyCaster = rawMoveKey.endsWith("-enemy");
  const moveKey = isEnemyCaster ? rawMoveKey.replace(/-enemy$/, "") : rawMoveKey;
  const defaultPlayerSpecies = (moveKey === "transform" && !isEnemyCaster) ? "ditto" : (moveKey === "curse-ghost" && !isEnemyCaster) ? "gengar" : (moveKey === "aeroblast" && !isEnemyCaster) ? "lugia" : (moveKey === "cotton-spore" && !isEnemyCaster) ? "mareep" : (moveKey === "reversal" && !isEnemyCaster) ? "lucario" : "vulpix";
  const defaultEnemySpecies = (moveKey === "transform" && isEnemyCaster) ? "ditto" : (moveKey === "curse-ghost" && isEnemyCaster) ? "gengar" : (moveKey === "aeroblast" && !isEnemyCaster) ? "grovyle" : (moveKey === "aeroblast" && isEnemyCaster) ? "lugia" : (moveKey === "cotton-spore" && !isEnemyCaster) ? "pikachu" : (moveKey === "cotton-spore" && isEnemyCaster) ? "mareep" : (moveKey === "reversal" && isEnemyCaster) ? "lucario" : (moveKey === "reversal" && !isEnemyCaster) ? "snorlax" : "charizard";
  const playerSpecies = params.playerSpecies || defaultPlayerSpecies;
  const enemySpecies = params.enemySpecies || defaultEnemySpecies;
  const biome = (params.biome || "cave").toLowerCase().trim();
  const hitMode = params.hitMode || "normal";
  const flyPhase = params.flyPhase || "2";
  const actMode = params.actMode || "dual";
  const subMoveParam = (params.subMove || "").toLowerCase().trim();
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
  const customPlayerHp = params.playerHp;
  const customEnemyHp = params.enemyHp;
  const customPlayerMaxHp = params.playerMaxHp;
  const customEnemyMaxHp = params.enemyMaxHp;
  const customDamage = params.damage;
  const customDialogue = params.dialogue
    ? decodeURIComponent(params.dialogue).replace(/(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F)/gu, "").trim()
    : undefined;
  const customStatDirection = (params.statDirection || "").toLowerCase().trim() as "up" | "down" | "";
  const customStatTarget = (params.statTarget || "").toLowerCase().trim() as "self" | "target" | "";

      const verifiedMove = VERIFIED_MOVES.find(m => m.id === moveKey);
      const moveData = getMoveData(moveKey);
      const moveKo = moveKey === "encounter-entry" ? "야생 포켓몬 조우 (등장)" : (moveKey === "perk-hug" ? "포옹 (🫂 특수 연출)" : (verifiedMove?.nameKo || moveData?.nameKo || moveKey));
      const playerInfo = POKEMON_SPECIES_DATA[playerSpecies];
      const enemyInfo = POKEMON_SPECIES_DATA[enemySpecies];
      const playerDisplayName = playerSpecies === "custom" ? "커스텀" : ((playerInfo?.num ? POKEMON_NAMES_KO[String(playerInfo.num)] : null) || (playerInfo as any)?.nameKo || playerSpecies);
      const enemyDisplayName = enemySpecies === "custom" ? "커스텀" : ((enemyInfo?.num ? POKEMON_NAMES_KO[String(enemyInfo.num)] : null) || (enemyInfo as any)?.nameKo || enemySpecies);

      const isCharge = moveKey.endsWith("-charge") || verifiedMove?.specialType === "charge";
      const isStatus = moveData?.category === "status" || verifiedMove?.category === "status" || isCharge || moveKey === "swords-dance" || moveKey === "whirlwind" || moveKey === "perk-hug" || moveKey === "bide-charge";
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
        moveKey === "acid-armor" || moveKey === "sharpen" || moveKey === "conversion" || moveKey === "charge" ||
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
        biome: biome,
        phase: (isOHKO && !isMiss) ? (isEnemyCaster ? "DEFEAT" : "VICTORY") : "ACTION",
        dialogueText: customDialogue || (moveKey === "perk-hug" ? `[PERK:hug] ${playerDisplayName}(은)는 당신을 포옹하고 돌아갔다.` : ""),
        hugTriggered: moveKey === "perk-hug",
        playerParty: [{
          id: "p1",
          speciesId: playerSpecies,
          dexNumber: playerInfo?.num || (playerInfo as any)?.dexNumber || (playerSpecies === "vulpix" ? 37 : 448),
          species: playerSpecies,
          name: playerDisplayName,
          level: 25,
          hp: initPlayerHp,
          maxHp: initPlayerMaxHp,
          stats: { hp: initPlayerMaxHp, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
          moves: [moveKey, "surf", "ice-beam", "blizzard", "psybeam"].filter((m, i, arr) => arr.indexOf(m) === i).slice(0, 4),
          types: playerInfo?.types?.map((t: string) => t.toLowerCase()) || ["fire"]
        }],
        playerBattleMon: {
          id: "p1",
          speciesId: playerSpecies,
          dexNumber: playerInfo?.num || (playerInfo as any)?.dexNumber || (playerSpecies === "vulpix" ? 37 : 448),
          species: playerSpecies,
          name: playerDisplayName,
          level: 25,
          hp: initPlayerHp,
          maxHp: initPlayerMaxHp,
          stats: { hp: initPlayerMaxHp, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
          moves: [moveKey, "surf", "ice-beam", "blizzard", "psybeam"].filter((m, i, arr) => arr.indexOf(m) === i).slice(0, 4),
          types: playerInfo?.types?.map((t: string) => t.toLowerCase()) || ["fire"],
          semiInvulnerableState: (!isEnemyCaster && ((moveKey === "fly" && flyPhase === "2") ? "air" : ((moveKey === "dig" && flyPhase === "2") ? "underground" : null))),
          chargingMove: (!isEnemyCaster && ((moveKey === "fly" && flyPhase === "2") ? "fly" : ((moveKey === "dig" && flyPhase === "2") ? "dig" : null))),
        },
        enemy: {
          id: "e1",
          speciesId: enemySpecies,
          dexNumber: enemyInfo?.num || (enemyInfo as any)?.dexNumber || (enemySpecies === "charizard" ? 6 : (enemySpecies === "cinderace" ? 815 : 253)),
          species: enemySpecies,
          name: enemyDisplayName,
          level: 25,
          hp: initEnemyHp,
          maxHp: initEnemyMaxHp,
          stats: { hp: initEnemyMaxHp, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
          moves: [moveKey],
          types: enemyInfo?.types?.map((t: string) => t.toLowerCase()) || ["fire", "flying"],
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
          ] : (moveKey === "sky-attack-charge" || moveKey === "sky-attack-charge-enemy") ? [
            {
              actor: "enemy",
              moveKey: "sky-attack-charge",
              moveName: "불새 (충전)",
              damage: 0,
              isHit: true,
              isTurn1Launch: true,
              chargingMove: "sky-attack",
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 눈부신 빛에 휩싸였다!`
            }
          ] : (moveKey === "skull-bash-charge" || moveKey === "skull-bash-charge-enemy") ? [
            {
              actor: "enemy",
              moveKey: "skull-bash-charge",
              moveName: "로켓박치기 (충전)",
              damage: 0,
              isHit: true,
              isTurn1Launch: true,
              chargingMove: "skull-bash",
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 머리를 움츠렸다!`
            }
          ] : (moveKey === "solar-beam-charge" || moveKey === "solar-beam-charge-enemy") ? [
            {
              actor: "enemy",
              moveKey: "solar-beam-charge",
              moveName: "솔라빔 (충전)",
              damage: 0,
              isHit: true,
              isTurn1Launch: true,
              chargingMove: "solar-beam",
              playerHpAfter: 150,
              enemyHpAfter: 150,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 빛을 모으고 있다!`
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
          ) : (moveKey === "struggle") ? [
            {
              actor: "enemy",
              moveKey: "struggle",
              moveName: "발버둥",
              damage: actualDamage,
              isHit: isHit,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: isMiss ? initPlayerHp : Math.max(0, initPlayerHp - actualDamage),
              enemyHpAfter: Math.max(1, Math.round(initEnemyHp * 0.75)),
              effectiveness: 1.0,
              log: isMiss
                ? `적 ${enemyDisplayName}의 발버둥!\n하지만 상대에게 빗나갔다!`
                : `적 ${enemyDisplayName}의 발버둥!\n반동으로 데미지를 입었다!`
            }
          ] : (moveKey === "curse-ghost") ? [
            {
              actor: "enemy",
              moveKey: "curse-ghost",
              moveName: "저주",
              damage: 0,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: initPlayerHp,
              enemyHpAfter: Math.max(1, Math.round(initEnemyHp * 0.50)),
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 자신의 체력을 깎아 ${playerDisplayName}에게 저주를 걸었다!`
            }
          ] : (moveKey === "curse-damage") ? [
            {
              actor: "enemy",
              moveKey: "curse-damage",
              moveName: "저주",
              damage: Math.max(1, Math.round(initPlayerHp * 0.25)),
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpBefore: initPlayerHp,
              playerHpAfter: Math.max(1, Math.round(initPlayerHp * 0.75)),
              enemyHpBefore: initEnemyHp,
              enemyHpAfter: initEnemyHp,
              effectiveness: 1.0,
              log: `${playerDisplayName}(은)는 저주에 걸려 있다! (-${Math.max(1, Math.round(initPlayerHp * 0.25))})`
            }
          ] : (moveKey === "curse" || moveKey === "curse-normal") ? [
            {
              actor: "enemy",
              moveKey: "curse",
              moveName: "저주",
              damage: 0,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: initPlayerHp,
              enemyHpAfter: initEnemyHp,
              statChanges: [
                { target: "enemy", direction: "down" },
                { target: "enemy", direction: "up" },
                { target: "enemy", direction: "up" }
              ],
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}의 스피드가 떨어지고 공격과 방어가 올라갔다!`
            }
          ] : (moveKey === "substitute") ? [
            {
              actor: "enemy",
              moveKey: "substitute",
              moveName: "대타출동",
              damage: 0,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: initPlayerHp,
              enemyHpAfter: Math.max(1, Math.round(initEnemyHp * 0.75)),
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 자신의 HP를 깎아 대타 분신을 만들었다!`
            }
          ] : (moveKey === "transform") ? [
            {
              actor: "enemy",
              moveKey: "transform",
              moveName: "변신",
              damage: 0,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: initPlayerHp,
              enemyHpAfter: initEnemyHp,
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 ${playerDisplayName}(으)로 변신했다!`
            }
          ] : [
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
        ] : (moveKey === "sky-attack-charge") ? [
          {
            actor: "player",
            moveKey: "sky-attack-charge",
            moveName: "불새 (충전)",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "sky-attack",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 눈부신 빛에 휩싸였다!`
          }
        ] : (moveKey === "skull-bash-charge") ? [
          {
            actor: "player",
            moveKey: "skull-bash-charge",
            moveName: "로켓박치기 (충전)",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "skull-bash",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 머리를 움츠렸다!`
          }
        ] : (moveKey === "solar-beam-charge") ? [
          {
            actor: "player",
            moveKey: "solar-beam-charge",
            moveName: "솔라빔 (충전)",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "solar-beam",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 빛을 모으고 있다!`
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
        ] : (moveKey === "struggle") ? [
          {
            actor: "player",
            moveKey: "struggle",
            moveName: "발버둥",
            damage: actualDamage,
            isHit: isHit,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: Math.max(1, Math.round(initPlayerHp * 0.75)),
            enemyHpAfter: isMiss ? initEnemyHp : Math.max(0, initEnemyHp - actualDamage),
            effectiveness: 1.0,
            log: isMiss
              ? `아군 ${playerDisplayName}의 발버둥!\n하지만 상대에게 빗나갔다!`
              : `아군 ${playerDisplayName}의 발버둥! ${actualDamage} 데미지!\n발버둥의 반동으로 데미지를 입었다!`
          },
          ...(actMode === "dual" ? [
            {
              actor: "enemy",
              moveKey: "struggle",
              moveName: "발버둥",
              damage: actualDamage,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: Math.max(1, Math.round(initPlayerHp * 0.50)),
              enemyHpAfter: Math.max(1, Math.round(initEnemyHp * 0.75)),
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}의 발버둥! ${actualDamage} 데미지!\n발버둥의 반동으로 데미지를 입었다!`
            }
          ] : [])
        ] : (moveKey === "curse-ghost") ? [
          {
            actor: "player",
            moveKey: "curse-ghost",
            moveName: "저주",
            damage: 0,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: Math.max(1, Math.round(initPlayerHp * 0.50)),
            enemyHpAfter: initEnemyHp,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 자신의 체력을 깎아 ${enemyDisplayName}에게 저주를 걸었다!`
          },
          ...(actMode === "dual" ? [
            {
              actor: "enemy",
              moveKey: "curse-ghost",
              moveName: "저주",
              damage: 0,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: Math.max(1, Math.round(initPlayerHp * 0.50)),
              enemyHpAfter: Math.max(1, Math.round(initEnemyHp * 0.50)),
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 자신의 체력을 깎아 ${playerDisplayName}에게 저주를 걸었다!`
            }
          ] : [])
        ] : (moveKey === "curse-damage") ? [
          {
            actor: "player",
            moveKey: "curse-damage",
            moveName: "저주",
            damage: Math.max(1, Math.round(initEnemyHp * 0.25)),
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            enemyHpBefore: initEnemyHp,
            enemyHpAfter: Math.max(1, Math.round(initEnemyHp * 0.75)),
            playerHpBefore: initPlayerHp,
            playerHpAfter: initPlayerHp,
            effectiveness: 1.0,
            log: `${enemyDisplayName}(은)는 저주에 걸려 있다! (-${Math.max(1, Math.round(initEnemyHp * 0.25))})`
          },
          ...(actMode === "dual" ? [
            {
              actor: "enemy",
              moveKey: "curse-damage",
              moveName: "저주",
              damage: Math.max(1, Math.round(initPlayerHp * 0.25)),
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpBefore: initPlayerHp,
              playerHpAfter: Math.max(1, Math.round(initPlayerHp * 0.75)),
              enemyHpBefore: Math.max(1, Math.round(initEnemyHp * 0.75)),
              enemyHpAfter: Math.max(1, Math.round(initEnemyHp * 0.75)),
              effectiveness: 1.0,
              log: `${playerDisplayName}(은)는 저주에 걸려 있다! (-${Math.max(1, Math.round(initPlayerHp * 0.25))})`
            }
          ] : [])
        ] : (moveKey === "curse" || moveKey === "curse-normal") ? [
          {
            actor: "player",
            moveKey: "curse",
            moveName: "저주",
            damage: 0,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: initPlayerHp,
            enemyHpAfter: initEnemyHp,
            statChanges: [
              { target: "player", direction: "down" },
              { target: "player", direction: "up" },
              { target: "player", direction: "up" }
            ],
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}의 스피드가 떨어지고 공격과 방어가 올라갔다!`
          },
          ...(actMode === "dual" ? [
            {
              actor: "enemy",
              moveKey: "curse",
              moveName: "저주",
              damage: 0,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: initPlayerHp,
              enemyHpAfter: initEnemyHp,
              statChanges: [
                { target: "enemy", direction: "down" },
                { target: "enemy", direction: "up" },
                { target: "enemy", direction: "up" }
              ],
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}의 스피드가 떨어지고 공격과 방어가 올라갔다!`
            }
          ] : [])
        ] : (moveKey === "substitute") ? [
          {
            actor: "player",
            moveKey: "substitute",
            moveName: "대타출동",
            damage: 0,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: Math.max(1, Math.round(initPlayerHp * 0.75)),
            enemyHpAfter: initEnemyHp,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 자신의 HP를 깎아 대타 분신을 만들었다!`
          },
          ...(actMode === "dual" ? [
            {
              actor: "enemy",
              moveKey: "substitute",
              moveName: "대타출동",
              damage: 0,
              isHit: true,
              isSuperEffective: false,
              typeMod: 1.0,
              playerHpAfter: Math.max(1, Math.round(initPlayerHp * 0.75)),
              enemyHpAfter: Math.max(1, Math.round(initEnemyHp * 0.75)),
              effectiveness: 1.0,
              log: `적 ${enemyDisplayName}(은)는 자신의 HP를 깎아 대타 분신을 만들었다!`
            }
          ] : [])
        ] : (moveKey === "transform") ? [
          {
            actor: "player",
            moveKey: "transform",
            moveName: "변신",
            damage: 0,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: initPlayerHp,
            enemyHpAfter: initEnemyHp,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 ${enemyDisplayName}(으)로 변신했다!`
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

  if (!mockBattle.dialogueText && mockBattle.turnActions?.length) {
    mockBattle.dialogueText = mockBattle.turnActions.map((a: any) => a.log).filter(Boolean).join("\n");
  }

  return {
    mockBattle,
    rawMoveKey,
    moveKey,
    moveKo,
    playerDisplayName,
    enemyDisplayName,
    isEnemyCaster,
    metronomeSubKey,
    mirrorSubKey,
    playerSpecies,
    enemySpecies,
    biome,
    hitMode,
    flyPhase,
    actMode,
    customPlayerHp,
    customEnemyHp,
    customDamage,
    customDialogue,
    customStatDirection,
    customStatTarget,
  };
}
