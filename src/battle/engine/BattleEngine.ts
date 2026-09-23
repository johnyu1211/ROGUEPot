import { BattlePokemon, BattleState, TurnActionInfo } from "./types.js";
import { getMoveData, getMoveKey, MOVES_DATA } from "../../data/movesKo.js";
import { getStageMultiplier } from "../mechanics/statModifier.js";
import { getMoveTrait } from "../moves/traits/moveTraits.js";
import { executeSingleAction } from "./TurnActionExecutor.js";
import { processTurnEndEffects } from "./TurnEndProcessor.js";
import { calculateStats, createPlayerBattleMon } from "../entities/pokemonFactory.js";
import { saveService } from "../../services/saveService.js";
import { BALL_PERK_DEFINITIONS } from "../../utils/perkSvgIcons.js";

/**
 * High-level Battle Engine Orchestrator.
 * Coordinates turn sequences, speed calculations, action orders, victory/defeat transitions, and save updates.
 */
export class BattleEngine {
  public static executeTurn(
    battle: BattleState,
    playerMoveKey: string,
    lang: "ko" | "en" = "ko",
    skipSave: boolean = false
  ): BattleState {
    const playerMon = battle.playerBattleMon;
    const enemyMon = battle.enemy;

    if (!playerMon || playerMon.hp <= 0 || enemyMon.hp <= 0) return battle;

    const isKo = lang === "ko";
    const pMoveKey = getMoveKey(playerMoveKey);
    const pMove = getMoveData(pMoveKey) || {
      id: 0,
      name: pMoveKey,
      nameKo: playerMoveKey,
      type: "normal",
      power: 40,
      accuracy: 100,
      pp: 35,
      category: "physical",
      description: "기본 공격 기술",
    };

    // Enemy move selection
    let eMoveKey: string;
    let eMove: any;
    if (enemyMon.chargingMove) {
      eMoveKey = enemyMon.chargingMove;
      eMove = getMoveData(eMoveKey) || {
        id: 0,
        name: eMoveKey,
        nameKo: eMoveKey,
        type: "normal",
        power: 40,
        accuracy: 100,
        pp: 35,
        category: "physical",
        description: "기본 공격 기술",
      };
    } else {
      const eMoveRaw = enemyMon.moves[Math.floor(Math.random() * enemyMon.moves.length)] || "Tackle";
      eMoveKey = getMoveKey(eMoveRaw);
      eMove = getMoveData(eMoveRaw) || {
        id: 0,
        name: eMoveKey,
        nameKo: eMoveRaw,
        type: "normal",
        power: 40,
        accuracy: 100,
        pp: 35,
        category: "physical",
        description: "기본 공격 기술",
      };
    }

    // PP consumption for non-charging moves
    const isPlayerChargingSame = playerMon.chargingMove && (playerMon.chargingMove === pMoveKey);
    if (!isPlayerChargingSame) {
      if (!playerMon.movePps || playerMon.movePps.length !== playerMon.moves.length) {
        playerMon.movePps = playerMon.moves.map(m => getMoveData(m)?.pp || 20);
      }
      const pMoveIdx = playerMon.moves.findIndex(m => getMoveKey(m) === pMoveKey);
      if (pMoveIdx !== -1 && playerMon.movePps && playerMon.movePps[pMoveIdx] !== undefined) {
        playerMon.movePps[pMoveIdx] = Math.max(0, playerMon.movePps[pMoveIdx] - 1);
      }
      if (battle.playerParty[battle.playerActiveIndex]) {
        battle.playerParty[battle.playerActiveIndex].movePps = [...playerMon.movePps];
      }
    }

    // Move Priorities
    const pPriority = getMoveTrait(pMoveKey)?.priority || 0;
    const ePriority = getMoveTrait(eMoveKey)?.priority || 0;

    // Speeds (Paralysis 0.5x, Stages)
    const pSpeed = playerMon.speed * getStageMultiplier(playerMon.stages.spe) * (playerMon.status === "par" ? 0.5 : 1.0);
    const eSpeed = enemyMon.speed * getStageMultiplier(enemyMon.stages.spe) * (enemyMon.status === "par" ? 0.5 : 1.0);

    // Turn order determination (Speed Tie: 50% random roll)
    let playerGoesFirst = true;
    if (battle.pendingBallPerk === "sky_flight" && (pMove.type || "").toLowerCase() === "flying") {
      playerGoesFirst = true;
    } else if (pPriority > ePriority) {
      playerGoesFirst = true;
    } else if (pPriority < ePriority) {
      playerGoesFirst = false;
    } else if (pSpeed > eSpeed) {
      playerGoesFirst = true;
    } else if (pSpeed < eSpeed) {
      playerGoesFirst = false;
    } else {
      playerGoesFirst = Math.random() < 0.5; // Official Speed Tie rule
    }

    let turnLogs: string[] = [];

    // Reset turn-scoped flags
    playerMon.isProtected = false;
    enemyMon.isProtected = false;
    playerMon.isFlinched = false;
    enemyMon.isFlinched = false;
    playerMon.lastPhysicalDamageTakenThisTurn = 0;
    enemyMon.lastPhysicalDamageTakenThisTurn = 0;

    // Process pending ball perks
    if (battle.pendingBallPerk) {
      const pId = battle.pendingBallPerk;
      const def = BALL_PERK_DEFINITIONS[pId];
      if (def && ["surveillance", "acid_dissolve", "sticky_web", "rock_solid", "chilly", "dinosaur", "heat", "overcharge", "downfall"].includes(pId)) {
        const msg = isKo
          ? (pId === "acid_dissolve" ? "[PERK:acid_dissolve] 용액으로 상대의 랭크업을 모두 제거했다!"
             : pId === "surveillance" ? "[PERK:surveillance] 감시 효과로 상대는 교체할 수 없다!"
             : pId === "sticky_web" ? "[PERK:sticky_web] 바닥에 끈적끈적한 실을 깔았다!"
             : pId === "rock_solid" ? "[PERK:rock_solid] 단단한 돌멩이의 가호로 3턴간 받는 피해가 50% 감소한다!"
             : pId === "chilly" ? "[PERK:chilly] 얼어붙은 한기가 전장을 뒤덮어 상대 스피드가 1랭크 하락했다!"
             : pId === "dinosaur" ? "[PERK:dinosaur] 고대 공룡의 기운으로 3턴간 드래곤 외 기술 위력이 약화된다!"
             : pId === "heat" ? "[PERK:heat] 작열하는 열기로 2턴간 공격과 특수공격이 2랭크 상승했다!"
             : pId === "overcharge" ? "[PERK:overcharge] 과충전 상태가 되어 스피드+2, 공격+1, 특공+1 상승했다!"
             : "[PERK:downfall] 몰락의 힘으로 특수공격+4, 스피드+2 대폭 상승했다!")
          : (pId === "acid_dissolve" ? "[PERK:acid_dissolve] Dissolved all stat boosts of the opponent!"
             : pId === "surveillance" ? "[PERK:surveillance] Trapped the opponent with Surveillance!"
             : pId === "sticky_web" ? "[PERK:sticky_web] Laid down a Sticky Web!"
             : pId === "rock_solid" ? "[PERK:rock_solid] Pebble protection reduces damage by 50% for 3 turns!"
             : pId === "chilly" ? "[PERK:chilly] Freezing chill engulfed the field, lowering foe's Speed by 1 stage!"
             : pId === "dinosaur" ? "[PERK:dinosaur] Ancient dinosaur presence weakens non-Dragon moves for 3 turns!"
             : pId === "heat" ? "[PERK:heat] Blazing heat boosted Atk and Sp.Atk by 2 stages for 2 turns!"
             : pId === "overcharge" ? "[PERK:overcharge] Overcharge boosted Speed +2, Atk +1, Sp.Atk +1!"
             : "[PERK:downfall] Downfall sharply boosted Sp.Atk +4 and Speed +2!");
        turnLogs.push(msg);
        battle.pendingBallPerk = null;
      } else if (pId === "hug") {
        turnLogs.push(isKo ? `[PERK:hug] ${playerMon.nameKo || playerMon.name}(은)는 당신을 포옹하고 돌아갔다.` : `[PERK:hug] ${playerMon.name} hugged you and returned.`);
        battle.hugTriggered = true;
        battle.pendingBallPerk = null;
      } else if (["confuse", "flinch", "taunt", "attract", "willpower"].includes(pId)) {
        battle.pendingBallPerk = null;
      }
    }

    const turnActions: TurnActionInfo[] = [];

    const firstActor = playerGoesFirst ? playerMon : enemyMon;
    const firstMove = playerGoesFirst ? pMove : eMove;
    const secondActor = playerGoesFirst ? enemyMon : playerMon;
    const secondMove = playerGoesFirst ? eMove : pMove;
    const isFirstPlayer = playerGoesFirst;

    const firstActorWasAir = (firstActor as any).semiInvulnerableState === "air" || (firstActor as any).chargingMove === "fly";
    const secondActorWasAir = (secondActor as any).semiInvulnerableState === "air" || (secondActor as any).chargingMove === "fly";

    // Setup visual animation effect tracking
    const statChanges1: { target: "player" | "enemy"; direction: "up" | "down" }[] = [];
    battle.lastMoveEffect = {
      moveKey: isFirstPlayer ? pMoveKey : eMoveKey,
      moveName: firstMove.name,
      type: firstMove.type || "normal",
      isSpecial: firstMove.category === "special",
      isPlayerAttacking: isFirstPlayer,
      statChanges: statChanges1,
      wasDescentFromAir: firstActorWasAir,
    };

    // --- Action 1 Execution ---
    const act1PlayerHpBefore = battle.playerBattleMon.hp;
    const act1EnemyHpBefore = enemyMon.hp;
    const act1PlayerStatusBefore = battle.playerBattleMon.status || null;
    const act1EnemyStatusBefore = enemyMon.status || null;

    if (firstActor.isFlinched) {
      firstActor.isFlinched = false;
      const fName = isFirstPlayer ? firstActor.name : (isKo ? firstActor.nameKo : firstActor.name);
      const flinchMsg = isKo ? `${fName}(은)는 풀이 죽어 움직일 수 없다!` : `${fName} flinched!`;
      turnLogs.push(flinchMsg);
      turnActions.push({
        actor: isFirstPlayer ? "player" : "enemy",
        moveKey: "status",
        moveName: isKo ? "풀죽음" : "Flinched",
        type: "normal",
        isSpecial: false,
        log: flinchMsg,
        enemyHpBefore: act1EnemyHpBefore,
        playerHpBefore: act1PlayerHpBefore,
        enemyHpAfter: enemyMon.hp,
        playerHpAfter: playerMon.hp,
        enemyStatusBefore: act1EnemyStatusBefore,
        playerStatusBefore: act1PlayerStatusBefore,
        enemyStatusAfter: enemyMon.status || null,
        playerStatusAfter: battle.playerBattleMon.status || null,
        damage: 0,
        isHit: false,
        canAct: false,
      });
    } else {
      const res1 = executeSingleAction(firstActor, secondActor, firstMove, isFirstPlayer, isKo, battle);
      turnLogs.push(res1.log);

      if (res1.canAct === false) {
        turnActions.push({
          actor: isFirstPlayer ? "player" : "enemy",
          moveKey: "status",
          moveName: isKo ? "행동 불가" : "Cannot Move",
          type: "normal",
          isSpecial: false,
          log: res1.log,
          enemyHpBefore: act1EnemyHpBefore,
          playerHpBefore: act1PlayerHpBefore,
          enemyHpAfter: enemyMon.hp,
          playerHpAfter: playerMon.hp,
          enemyStatusBefore: act1EnemyStatusBefore,
          playerStatusBefore: act1PlayerStatusBefore,
          enemyStatusAfter: enemyMon.status || null,
          playerStatusAfter: battle.playerBattleMon.status || null,
          damage: 0,
          isHit: false,
          canAct: false,
        });
      } else {
        const isHit1 = (res1.damage ?? 0) > 0 || (res1.hitCount ?? 0) > 0 ||
          (!res1.log.includes("빗나갔다") && !res1.log.includes("missed") &&
           !res1.log.includes("효과가 없는") && !res1.log.includes("닿지 않았다"));

        const isTurn1Launch1 = (res1.damage ?? 0) === 0 && Boolean(
          res1.log.includes("날아올랐다") || res1.log.includes("flew up") ||
          res1.log.includes("파고들었다") || res1.log.includes("burrowed") ||
          res1.log.includes("잠수했다") || res1.log.includes("underwater") ||
          res1.log.includes("모습을 감췄다") || res1.log.includes("vanished") ||
          res1.log.includes("튀어올랐다") || res1.log.includes("bounced") ||
          res1.log.includes("빛을 흡수") || res1.log.includes("sunlight") ||
          res1.log.includes("칼바람을 일으켰다") || res1.log.includes("whirlwind") ||
          firstActor.chargingMove
        );

        const rawKey1 = isFirstPlayer ? pMoveKey : eMoveKey;
        const finalKey1 = (rawKey1 === "solar-beam" && isTurn1Launch1) ? "solar-beam-charge" : rawKey1;

        turnActions.push({
          actor: isFirstPlayer ? "player" : "enemy",
          moveKey: finalKey1,
          moveName: firstMove.name,
          type: firstMove.type || "normal",
          isSpecial: firstMove.category === "special",
          log: res1.log,
          enemyHpBefore: act1EnemyHpBefore,
          playerHpBefore: act1PlayerHpBefore,
          enemyHpAfter: enemyMon.hp,
          playerHpAfter: battle.playerBattleMon.hp,
          enemyStatusBefore: act1EnemyStatusBefore,
          playerStatusBefore: act1PlayerStatusBefore,
          enemyStatusAfter: enemyMon.status || null,
          playerStatusAfter: battle.playerBattleMon.status || null,
          statChanges: battle.lastMoveEffect?.statChanges ? [...battle.lastMoveEffect.statChanges] : [],
          typeMod: res1.typeMod,
          hitCount: res1.hitCount,
          isSuperEffective: res1.isSuperEffective,
          damage: res1.damage,
          isHit: isHit1,
          wasDescentFromAir: firstActorWasAir,
          isTurn1Launch: isTurn1Launch1,
          chargingMove: firstActor.chargingMove || undefined,
          canAct: true,
          copiedMoveKey: res1.copiedMoveKey,
        });
      }
    }

    // --- Action 2 Execution (if defender and attacker are still alive and battle not finished) ---
    if (secondActor.hp > 0 && firstActor.hp > 0 && battle.phase !== "VICTORY" && battle.phase !== "DEFEAT") {
      const act2PlayerHpBefore = battle.playerBattleMon.hp;
      const act2EnemyHpBefore = enemyMon.hp;
      const act2PlayerStatusBefore = battle.playerBattleMon.status || null;
      const act2EnemyStatusBefore = enemyMon.status || null;

      if (secondActor.isFlinched) {
        secondActor.isFlinched = false;
        const sName = !isFirstPlayer ? secondActor.name : (isKo ? secondActor.nameKo : secondActor.name);
        const flinchMsg = isKo ? `${sName}(은)는 풀이 죽어 움직일 수 없다!` : `${sName} flinched!`;
        turnLogs.push(flinchMsg);
        turnActions.push({
          actor: !isFirstPlayer ? "player" : "enemy",
          moveKey: "status",
          moveName: isKo ? "풀죽음" : "Flinched",
          type: "normal",
          isSpecial: false,
          log: flinchMsg,
          enemyHpBefore: act2EnemyHpBefore,
          playerHpBefore: act2PlayerHpBefore,
          enemyHpAfter: enemyMon.hp,
          playerHpAfter: playerMon.hp,
          enemyStatusBefore: act2EnemyStatusBefore,
          playerStatusBefore: act2PlayerStatusBefore,
          enemyStatusAfter: enemyMon.status || null,
          playerStatusAfter: battle.playerBattleMon.status || null,
          damage: 0,
          isHit: false,
          canAct: false,
        });
      } else {
        const statChanges2: { target: "player" | "enemy"; direction: "up" | "down" }[] = [];
        battle.lastMoveEffect = {
          moveKey: !isFirstPlayer ? pMoveKey : eMoveKey,
          moveName: secondMove.name,
          type: secondMove.type || "normal",
          isSpecial: secondMove.category === "special",
          isPlayerAttacking: !isFirstPlayer,
          statChanges: statChanges2,
          wasDescentFromAir: secondActorWasAir,
        };

        const res2 = executeSingleAction(secondActor, firstActor, secondMove, !isFirstPlayer, isKo, battle);
        turnLogs.push(res2.log);

        if (res2.canAct === false) {
          turnActions.push({
            actor: !isFirstPlayer ? "player" : "enemy",
            moveKey: "status",
            moveName: isKo ? "행동 불가" : "Cannot Move",
            type: "normal",
            isSpecial: false,
            log: res2.log,
            enemyHpBefore: act2EnemyHpBefore,
            playerHpBefore: act2PlayerHpBefore,
            enemyHpAfter: enemyMon.hp,
            playerHpAfter: playerMon.hp,
            enemyStatusBefore: act2EnemyStatusBefore,
            playerStatusBefore: act2PlayerStatusBefore,
            enemyStatusAfter: enemyMon.status || null,
            playerStatusAfter: battle.playerBattleMon.status || null,
            damage: 0,
            isHit: false,
            canAct: false,
          });
        } else {
          const isHit2 = (res2.damage ?? 0) > 0 || (res2.hitCount ?? 0) > 0 ||
            (!res2.log.includes("빗나갔다") && !res2.log.includes("missed") &&
             !res2.log.includes("효과가 없는") && !res2.log.includes("닿지 않았다"));

          const isTurn1Launch2 = (res2.damage ?? 0) === 0 && Boolean(
            res2.log.includes("날아올랐다") || res2.log.includes("flew up") ||
            res2.log.includes("파고들었다") || res2.log.includes("burrowed") ||
            res2.log.includes("잠수했다") || res2.log.includes("underwater") ||
            res2.log.includes("모습을 감췄다") || res2.log.includes("vanished") ||
            res2.log.includes("튀어올랐다") || res2.log.includes("bounced") ||
            res2.log.includes("빛을 흡수") || res2.log.includes("sunlight") ||
            res2.log.includes("칼바람을 일으켰다") || res2.log.includes("whirlwind") ||
            secondActor.chargingMove
          );

          const rawKey2 = !isFirstPlayer ? pMoveKey : eMoveKey;
          const finalKey2 = (rawKey2 === "solar-beam" && isTurn1Launch2) ? "solar-beam-charge" : rawKey2;

          turnActions.push({
            actor: !isFirstPlayer ? "player" : "enemy",
            moveKey: finalKey2,
            moveName: secondMove.name,
            type: secondMove.type || "normal",
            isSpecial: secondMove.category === "special",
            log: res2.log,
            enemyHpBefore: act2EnemyHpBefore,
            playerHpBefore: act2PlayerHpBefore,
            enemyHpAfter: enemyMon.hp,
            playerHpAfter: battle.playerBattleMon.hp,
            enemyStatusBefore: act2EnemyStatusBefore,
            playerStatusBefore: act2PlayerStatusBefore,
            enemyStatusAfter: enemyMon.status || null,
            playerStatusAfter: battle.playerBattleMon.status || null,
            statChanges: battle.lastMoveEffect?.statChanges ? [...battle.lastMoveEffect.statChanges] : [],
            typeMod: res2.typeMod,
            hitCount: res2.hitCount,
            isSuperEffective: res2.isSuperEffective,
            damage: res2.damage,
            isHit: isHit2,
            wasDescentFromAir: secondActorWasAir,
            isTurn1Launch: isTurn1Launch2,
            chargingMove: secondActor.chargingMove || undefined,
            canAct: true,
            copiedMoveKey: res2.copiedMoveKey,
          });
        }
      }
    }

    battle.turnActions = turnActions;

    // Reset flinch at end of actions so it never spills over to next turn
    battle.playerBattleMon.isFlinched = false;
    enemyMon.isFlinched = false;

    // --- End of Turn Processing ---
    if (battle.phase !== "VICTORY" && battle.phase !== "DEFEAT") {
      processTurnEndEffects(battle.playerBattleMon, isKo, turnLogs, battle.weather, battle);
      processTurnEndEffects(enemyMon, isKo, turnLogs, battle.weather, battle);
    }

    if (battle.weather && battle.weatherTurns) {
      battle.weatherTurns -= 1;
      if (battle.weatherTurns <= 0) {
        battle.weather = null;
        battle.weatherTurns = undefined;
        turnLogs.push(isKo ? `날씨가 원래대로 돌아왔다!` : `The weather returned to normal!`);
      }
    }

    // Ensure active pokemon's HP is properly clamped and synced to party
    if (playerMon.hp <= 0) {
      playerMon.hp = 0;
    }
    if (enemyMon.hp <= 0) {
      enemyMon.hp = 0;
    }
    battle.playerParty[battle.playerActiveIndex].hp = playerMon.hp;

    // --- Victory / Defeat Transitions ---
    const enemyFainted = enemyMon.hp <= 0;
    const playerFainted = playerMon.hp <= 0;

    if (enemyFainted && playerFainted) {
      // Both fainted simultaneously (e.g. Self-Destruct, Explosion, Destiny Bond, Recoil)
      const aliveIdx = battle.playerParty.findIndex((p) => p.hp > 0);
      if (aliveIdx >= 0) {
        battle.phase = "VICTORY";
        if (battle.gameMode !== "showcase") {
          const moneyGain = Math.floor(enemyMon.level * 120);
          battle.money += moneyGain;
          battle.score += enemyMon.level * 10;
          turnLogs.push(
            isKo
              ? `상대 ${enemyMon.nameKo}(이)가 쓰러졌다! (획득: +P ${moneyGain.toLocaleString()})`
              : `Foe ${enemyMon.name} fainted! (Won: +P ${moneyGain.toLocaleString()})`
          );
        } else {
          turnLogs.push(
            isKo
              ? `상대 ${enemyMon.nameKo}(이)가 쓰러졌다!`
              : `Foe ${enemyMon.name} fainted!`
          );
        }
        battle.playerActiveIndex = aliveIdx;
        battle.playerBattleMon = createPlayerBattleMon(battle.playerParty[aliveIdx], battle.playerParty);
        turnLogs.push(
          isKo
            ? `${playerMon.name}(이)가 쓰러졌다! 가랏, ${battle.playerBattleMon.name}!`
            : `${playerMon.name} fainted! Go, ${battle.playerBattleMon.name}!`
        );
      } else {
        battle.phase = "DEFEAT";
        turnLogs.push(isKo ? `모든 포켓몬이 쓰러졌다... 눈앞이 캄캄해졌다!` : `All Pokémon fainted... You blacked out!`);
      }
    } else if (enemyFainted) {
      battle.phase = "VICTORY";
      if (battle.gameMode !== "showcase") {
        const expGain = Math.floor(enemyMon.level * 15);
        const moneyGain = Math.floor(enemyMon.level * 120);
        battle.money += moneyGain;
        battle.score += enemyMon.level * 10;
        battle.playerExp += expGain;

        turnLogs.push(
          isKo
            ? `상대 ${enemyMon.nameKo}(이)가 쓰러졌다! 획득: +P ${moneyGain.toLocaleString()} | +${expGain} EXP`
            : `Foe ${enemyMon.name} fainted! Won: +P ${moneyGain.toLocaleString()} | +${expGain} EXP`
        );

        if (battle.playerExp >= battle.playerMaxExp) {
          playerMon.level += 1;
          const oldMaxHp = playerMon.maxHp;
          const newStats = calculateStats(playerMon.speciesId, playerMon.level);
          playerMon.maxHp = newStats.maxHp;
          const hpGain = Math.max(0, newStats.maxHp - oldMaxHp);
          playerMon.hp = Math.min(playerMon.maxHp, playerMon.hp + hpGain);
          playerMon.atk = newStats.atk;
          playerMon.def = newStats.def;
          playerMon.spAtk = newStats.spAtk;
          playerMon.spDef = newStats.spDef;
          playerMon.speed = newStats.speed;
          battle.playerExp = 0;
          battle.playerMaxExp = playerMon.level * 15;
          battle.playerParty[battle.playerActiveIndex].level = playerMon.level;
          battle.playerParty[battle.playerActiveIndex].hp = playerMon.hp;
          battle.playerParty[battle.playerActiveIndex].maxHp = playerMon.maxHp;
          turnLogs.push(isKo ? `${playerMon.name}의 레벨이 ${playerMon.level}(으)로 올랐다!` : `${playerMon.name} grew to Lv. ${playerMon.level}!`);
        }
      } else {
        turnLogs.push(
          isKo
            ? `상대 ${enemyMon.nameKo}(이)가 쓰러졌다!`
            : `Foe ${enemyMon.name} fainted!`
        );
      }
    } else if (playerFainted) {
      const aliveIdx = battle.playerParty.findIndex((p) => p.hp > 0);
      if (aliveIdx >= 0) {
        battle.playerActiveIndex = aliveIdx;
        battle.playerBattleMon = createPlayerBattleMon(battle.playerParty[aliveIdx], battle.playerParty);
        turnLogs.push(
          isKo
            ? `${playerMon.name}(이)가 쓰러졌다! 가랏, ${battle.playerBattleMon.name}!`
            : `${playerMon.name} fainted! Go, ${battle.playerBattleMon.name}!`
        );
      } else {
        battle.phase = "DEFEAT";
        turnLogs.push(isKo ? `모든 포켓몬이 쓰러졌다... 눈앞이 캄캄해졌다!` : `All Pokémon fainted... You blacked out!`);
      }
    }

    if (battle.phase !== "VICTORY" && battle.phase !== "DEFEAT") {
      const activeMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];
      if (activeMon?.chargingMove) {
        battle.phase = "FIGHT";
      } else {
        battle.phase = "MAIN";
      }
    }

    // Ball perk counters
    if (battle.stickyWebTurns && battle.stickyWebTurns > 0) {
      battle.stickyWebTurns -= 1;
      if (battle.stickyWebTurns === 0) {
        turnLogs.push(isKo ? "[PERK:sticky_web] 바닥에 깔려있던 끈적끈적한 실이 사라졌다." : "[PERK:sticky_web] The sticky web dissipated.");
      }
    }
    if (battle.rockSolidTurns && battle.rockSolidTurns > 0) {
      battle.rockSolidTurns -= 1;
      if (battle.rockSolidTurns === 0) {
        turnLogs.push(isKo ? "[PERK:rock_solid] 돌멩이의 방어 효과가 끝났다." : "[PERK:rock_solid] The pebble protection wore off.");
      }
    }
    if (battle.chillyTurns && battle.chillyTurns > 0) {
      battle.chillyTurns -= 1;
      if (battle.chillyTurns === 0) {
        turnLogs.push(isKo ? "[PERK:chilly] 얼어붙은 한기가 가라앉았다." : "[PERK:chilly] The freezing chill settled down.");
      }
    }
    if (battle.dinosaurTurns && battle.dinosaurTurns > 0) {
      battle.dinosaurTurns -= 1;
      if (battle.dinosaurTurns === 0) {
        turnLogs.push(isKo ? "[PERK:dinosaur] 고대 공룡의 기운이 사라졌다." : "[PERK:dinosaur] The ancient dinosaur presence faded.");
      }
    }
    if (battle.heatTimer && battle.heatTimer > 0) {
      battle.heatTimer -= 1;
      if (battle.heatTimer === 0) {
        playerMon.stages.atk = Math.max(-6, playerMon.stages.atk - 1);
        playerMon.stages.spa = Math.max(-6, playerMon.stages.spa - 1);
        turnLogs.push(isKo ? "[PERK:heat] 열기가 식으며 공격과 특수공격이 1랭크 하락했다!" : "[PERK:heat] Heat cooled down, lowering Atk and Sp.Atk by 1 stage!");
      }
    }
    if (battle.overchargeTurnCount !== undefined) {
      battle.overchargeTurnCount += 1;
      if (battle.overchargeTurnCount === 1) {
        playerMon.stages.spa = Math.min(6, playerMon.stages.spa + 1);
        turnLogs.push(isKo ? "[PERK:overcharge] 과충전의 여파로 특수공격이 1랭크 추가 상승했다!" : "[PERK:overcharge] Overcharge surge increased Sp.Atk by 1 stage!");
      } else if (battle.overchargeTurnCount >= 3) {
        playerMon.stages.spe = Math.max(-6, playerMon.stages.spe - 4);
        battle.overchargeTurnCount = undefined;
        turnLogs.push(isKo ? "[PERK:overcharge] 과충전 방전으로 스피드가 4랭크 급격히 하락했다!" : "[PERK:overcharge] Overcharge discharge severely lowered Speed by 4 stages!");
      }
    }
    if (battle.downfallTurnCount !== undefined) {
      battle.downfallTurnCount += 1;
      if (battle.downfallTurnCount === 1) {
        playerMon.stages.spe = Math.max(-6, playerMon.stages.spe - 3);
        turnLogs.push(isKo ? "[PERK:downfall] 몰락의 대가로 스피드가 3랭크 하락했다!" : "[PERK:downfall] Downfall effect lowered Speed by 3 stages!");
      } else if (battle.downfallTurnCount >= 4) {
        playerMon.stages.spa = Math.max(-6, playerMon.stages.spa - 6);
        battle.downfallTurnCount = undefined;
        turnLogs.push(isKo ? "[PERK:downfall] 완전한 몰락으로 특수공격이 6랭크 급락했다!" : "[PERK:downfall] Utter downfall sharply plummeted Sp.Atk by 6 stages!");
      }
    }
    if (playerMon.isTaunted && playerMon.tauntTurns) {
      playerMon.tauntTurns -= 1;
      if (playerMon.tauntTurns <= 0) {
        playerMon.isTaunted = false;
        playerMon.tauntTurns = 0;
        turnLogs.push(isKo ? `${playerMon.nameKo || playerMon.name}의 도발 효과가 풀렸다!` : `${playerMon.name}'s taunt wore off!`);
      }
    }
    if (enemyMon.isTaunted && enemyMon.tauntTurns) {
      enemyMon.tauntTurns -= 1;
      if (enemyMon.tauntTurns <= 0) {
        enemyMon.isTaunted = false;
        enemyMon.tauntTurns = 0;
        turnLogs.push(isKo ? `${enemyMon.nameKo || enemyMon.name}의 도발 효과가 풀렸다!` : `${enemyMon.name}'s taunt wore off!`);
      }
    }

    battle.dialogueText = turnLogs.join("\n");
    battle.turnCount += 1;

    if (!skipSave) {
      saveService.updateSlot(battle.userId, battle.slotId, {
        party: battle.playerParty,
        money: battle.money,
        score: battle.score,
      });
    }

    return battle;
  }
}
