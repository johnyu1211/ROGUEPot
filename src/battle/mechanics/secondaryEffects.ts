import { BattlePokemon, BattleState } from "../engine/types.js";
import { MoveData } from "../../data/movesKo.js";
import { getMoveTrait } from "../moves/traits/moveTraits.js";

/**
 * Handles secondary attack effects (Drain, Recoil, Stat drops, Status inflictions, Flinch, Traps).
 */
export function applySecondaryAttackEffects(
  actor: BattlePokemon,
  target: BattlePokemon,
  move: MoveData,
  damageDealt: number,
  isKo: boolean,
  battle?: BattleState
): string {
  if (damageDealt <= 0) return "";
  let log = "";
  const mName = move.name.toLowerCase().replace(/[\s_]+/g, "-");
  const trait = getMoveTrait(mName);

  // 1. Draining Moves
  if (trait?.drainRatio) {
    const healAmount = Math.max(1, Math.floor(damageDealt * trait.drainRatio));
    actor.hp = Math.min(actor.maxHp, actor.hp + healAmount);
    log += isKo ? `\n상대의 체력을 ${healAmount} 흡수했다!` : `\nRestored ${healAmount} HP!`;
  }

  // 2. Recoil Moves
  if (["struggle", "165", "발버둥"].includes(mName)) {
    const recoilDmg = Math.max(1, Math.floor(actor.maxHp * 0.25));
    actor.hp = Math.max(0, actor.hp - recoilDmg);
    log += isKo ? `\n발버둥친 반동으로 ${recoilDmg} 데미지를 입었다!` : `\nHit with ${recoilDmg} recoil damage from struggling!`;
  } else if (trait?.recoilRatio) {
    const recoilDmg = Math.max(1, Math.floor(damageDealt * trait.recoilRatio));
    actor.hp = Math.max(0, actor.hp - recoilDmg);
    log += isKo ? `\n반동으로 ${recoilDmg} 데미지를 입었다!` : `\nHit with ${recoilDmg} recoil damage!`;
  }

  // 3. Pay Day
  if (mName === "pay-day" || mName === "payday") {
    const coinGain = actor.level * 5;
    log += isKo ? `\n동전을 마구 주워 +P ${coinGain.toLocaleString()}을 획득했다!` : `\nCoins scattered everywhere! Got +P ${coinGain.toLocaleString()}!`;
  }

  // 4. Self Stat Drops
  if (["close-combat", "headlong-rush", "armor-cannon"].includes(mName)) {
    actor.stages.def = Math.max(-6, actor.stages.def - 1);
    actor.stages.spd = Math.max(-6, actor.stages.spd - 1);
    log += isKo ? `\n자신의 방어와 특수방어가 떨어졌다! (-1)` : `\nDefense and Sp. Def fell! (-1)`;
  } else if (["draco-meteor", "overheat", "leaf-storm"].includes(mName)) {
    actor.stages.spa = Math.max(-6, actor.stages.spa - 2);
    log += isKo ? `\n자신의 특수공격이 크게 떨어졌다! (-2)` : `\nSp. Atk harshly fell! (-2)`;
  } else if (["superpower", "276", "엄청난힘"].includes(mName) || move.id === 276 || move.nameKo === "엄청난힘") {
    actor.stages.atk = Math.max(-6, actor.stages.atk - 1);
    actor.stages.def = Math.max(-6, actor.stages.def - 1);
    log += isKo ? `\n자신의 공격과 방어가 떨어졌다! (-1)` : `\nAttack and Defense fell! (-1)`;
    if (battle?.lastMoveEffect) {
      const isPlayerActor = actor === battle.playerBattleMon || actor === battle.playerParty?.[battle.playerActiveIndex];
      battle.lastMoveEffect.statChanges = battle.lastMoveEffect.statChanges || [];
      battle.lastMoveEffect.statChanges.push(
        { target: isPlayerActor ? "player" : "enemy", direction: "down" },
        { target: isPlayerActor ? "player" : "enemy", direction: "down" }
      );
    }
  }

  // 4b. Self Stat Boosts
  if (actor.hp > 0) {
    if (["steel-wing", "steel_wing", "steelwing", "211", "강철날개"].includes(mName) || move.id === 211) {
      const isSerene = Boolean(
        actor.ability?.toLowerCase().includes("serene") ||
        actor.passiveAbility?.toLowerCase().includes("serene")
      );
      const boostChance = isSerene ? 0.20 : 0.10;
      if (Math.random() < boostChance && actor.stages.def < 6) {
        actor.stages.def = Math.min(6, actor.stages.def + 1);
        const aName = isKo ? (actor.nameKo || actor.name) : (actor.name || actor.nameKo);
        log += isKo ? `\n${aName}의 방어가 올랐다! (+1)` : `\n${aName}'s Defense rose! (+1)`;
      }
    }
    if (["metal-claw", "metal_claw", "metalclaw", "232", "메탈클로"].includes(mName) || move.id === 232 || move.nameKo === "메탈클로") {
      const isSerene = Boolean(
        actor.ability?.toLowerCase().includes("serene") ||
        actor.passiveAbility?.toLowerCase().includes("serene")
      );
      const boostChance = isSerene ? 0.20 : 0.10;
      if (Math.random() < boostChance && actor.stages.atk < 6) {
        actor.stages.atk = Math.min(6, actor.stages.atk + 1);
        const aName = isKo ? (actor.nameKo || actor.name) : (actor.name || actor.nameKo);
        log += isKo ? `\n${aName}의 공격이 올랐다! (+1)` : `\n${aName}'s Attack rose! (+1)`;
      }
    }
    if (["ancient-power", "ancient_power", "ancientpower", "246", "원시의힘"].includes(mName) || move.id === 246 || move.nameKo === "원시의힘") {
      const isSerene = Boolean(
        actor.ability?.toLowerCase().includes("serene") ||
        actor.passiveAbility?.toLowerCase().includes("serene")
      );
      const boostChance = isSerene ? 0.20 : 0.10;
      if (Math.random() < boostChance) {
        let boosted = false;
        const stats: ("atk" | "def" | "spa" | "spd" | "spe")[] = ["atk", "def", "spa", "spd", "spe"];
        for (const stat of stats) {
          if (actor.stages[stat] < 6) {
            actor.stages[stat] = Math.min(6, actor.stages[stat] + 1);
            boosted = true;
          }
        }
        if (boosted) {
          const aName = isKo ? (actor.nameKo || actor.name) : (actor.name || actor.nameKo);
          log += isKo ? `\n${aName}의 모든 능력이 올랐다!` : `\nAll of ${aName}'s stats rose!`;
          if (battle?.lastMoveEffect) {
            const isPlayer = (actor === battle.playerBattleMon || (battle.playerParty && actor === battle.playerParty[battle.playerActiveIndex]));
            battle.lastMoveEffect.statChanges = battle.lastMoveEffect.statChanges || [];
            battle.lastMoveEffect.statChanges.push({
              target: isPlayer ? "player" : "enemy",
              direction: "up",
            });
          }
        }
      }
    }
    if (["rapid-spin", "rapid_spin", "rapidspin", "229", "고속스핀"].includes(mName) || move.id === 229 || move.nameKo === "고속스핀") {
      if (actor.stages.spe < 6) {
        actor.stages.spe = Math.min(6, actor.stages.spe + 1);
        const aName = isKo ? (actor.nameKo || actor.name) : (actor.name || actor.nameKo);
        log += isKo ? `\n${aName}의 스피드가 올랐다! (+1)` : `\n${aName}'s Speed rose! (+1)`;
      }
      if (actor.trapState) {
        actor.trapState = null;
        log += isKo ? `\n조이기 상태에서 벗어났다!` : `\nFreed from the trap!`;
      }
      if (actor.isSeeded) {
        actor.isSeeded = false;
        log += isKo ? `\n씨뿌리기 효과를 날려버렸다!` : `\nBlew away Leech Seed!`;
      }
      if (battle) {
        const isPlayer = (actor === battle.playerBattleMon || (battle.playerParty && actor === battle.playerParty[battle.playerActiveIndex]));
        if (isPlayer && (battle.playerSpikesLayers || 0) > 0) {
          battle.playerSpikesLayers = 0;
          log += isKo ? `\n아군 진영의 압정뿌리기를 모두 날려버렸다!` : `\nBlew away Spikes from the team's side!`;
        } else if (!isPlayer && (battle.enemySpikesLayers || 0) > 0) {
          battle.enemySpikesLayers = 0;
          log += isKo ? `\n상대 진영의 압정뿌리기를 모두 날려버렸다!` : `\nBlew away Spikes from the enemy's side!`;
        }
      }
    }
  }

  // 5. Flinch
  if (["bite", "rock-slide", "rockslide", "157", "스톤샤워", "iron-head", "air-slash", "headbutt", "sky-attack", "stomp", "23", "짓밟기", "rolling-kick", "27", "돌려차기", "snore", "173", "코골기"].includes(mName)) {
    if (Math.random() < 0.3) {
      target.isFlinched = true;
    }
  } else if (["bone-club", "boneclub", "125", "hyper-fang", "hyperfang", "158", "필살앞니"].includes(mName)) {
    if (Math.random() < 0.1) {
      target.isFlinched = true;
    }
  } else if (["waterfall", "127", "twister", "239", "회오리"].includes(mName)) {
    if (Math.random() < 0.2) {
      target.isFlinched = true;
    }
  } else if (["fake-out", "fakeout", "fake_out", "252", "속이기"].includes(mName)) {
    target.isFlinched = true;
  }

  // 6. Status Inflictions from Attacks
  // 불꽃 타입 공격 또는 열탕(Scald)에 피격된 대상의 얼음 상태 해제 (포켓몬 본가 공식 시스템)
  if (target.hp > 0 && target.status === "frz" && (move.type === "fire" || mName === "scald")) {
    target.status = null;
    log += isKo ? `\n${target.name}의 얼음이 녹았다!` : `\n${target.name} thawed out!`;
  }

  // 정신차리기(Smelling Salts)에 피격된 대상의 마비 상태 해제 (포켓몬 본가 공식 시스템)
  if (target.hp > 0 && target.status === "par" && (["smelling-salts", "smellingsalts", "265", "정신차리기"].includes(mName) || move.id === 265 || move.nameKo === "정신차리기")) {
    target.status = null;
    const tName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
    log += isKo ? `\n${tName}의 마비가 풀렸다!` : `\n${tName}'s paralysis was cured!`;
  }

  if (target.hp > 0 && !target.status && (!target.safeguardTurns || target.safeguardTurns <= 0)) {
    const isHeatWave = ["heat-wave", "heat_wave", "heatwave", "257", "열풍"].includes(mName) || move.id === 257 || move.nameKo === "열풍";
    const isSacredFire = ["sacred-fire", "sacred_fire", "sacredfire", "221", "성스러운불꽃"].includes(mName);
    if (isSacredFire || isHeatWave || ["flamethrower", "fire-blast", "scald", "ember", "fire-punch", "flame-wheel", "flamewheel", "172", "화염바퀴", "화염자동차"].includes(mName)) {
      const isSerene = Boolean(
        actor.ability?.toLowerCase().includes("serene") ||
        actor.passiveAbility?.toLowerCase().includes("serene")
      );
      const baseBurnChance = isSacredFire ? 0.5 : (mName === "scald" ? 0.3 : 0.1);
      const burnChance = isSerene ? Math.min(1.0, baseBurnChance * 2) : baseBurnChance;
      if (Math.random() < burnChance && !target.types.map(t => t.toLowerCase()).includes("fire")) {
        target.status = "brn";
        const tName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
        log += isKo ? `\n${tName}(은)는 화상을 입었다!` : `\n${tName} was burned!`;
      }
    } else if (["ice-beam", "blizzard", "ice-punch", "powder-snow", "powder_snow", "powdersnow", "181", "눈싸라기"].includes(mName)) {
      if (Math.random() < 0.1 && !target.types.map(t => t.toLowerCase()).includes("ice")) {
        target.status = "frz";
        log += isKo ? `\n${target.name}(은)는 꽁꽁 얼어붙었다!` : `\n${target.name} was frozen solid!`;
      }
    } else if (["thunderbolt", "thunder-shock", "thundershock", "discharge", "spark", "209", "스파크", "thunder", "thunder-punch", "body-slam", "lick", "zap-cannon", "zap_cannon", "zapcannon", "192", "전자포", "nuzzle", "dragon-breath", "dragon_breath", "dragonbreath", "225", "용의숨결"].includes(mName)) {
      const isGuaranteedPar = ["zap-cannon", "zap_cannon", "zapcannon", "192", "전자포", "nuzzle"].includes(mName);
      const isDragonBreath = ["dragon-breath", "dragon_breath", "dragonbreath", "225", "용의숨결"].includes(mName);
      const parChance = isGuaranteedPar ? 1.0 : ((mName === "thunder" || mName === "body-slam" || mName === "lick" || mName === "spark" || mName === "209" || mName === "스파크" || isDragonBreath) ? 0.3 : 0.1);
      const isLimber = target.ability?.toLowerCase() === "limber" || target.passiveAbility?.toLowerCase() === "limber";
      const isElectricImmune = !isDragonBreath && target.types.map(t => t.toLowerCase()).includes("electric");
      if (Math.random() < parChance && !isElectricImmune && !isLimber) {
        target.status = "par";
        const tName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
        log += isKo ? `\n${tName}(은)는 마비에 걸렸다!` : `\n${tName} is paralyzed!`;
      }
    } else if (["poison-sting", "twineedle", "sludge-bomb", "sludgebomb", "188", "오물폭탄", "poison-jab", "smog", "sludge"].includes(mName)) {
      const psnChance = mName === "smog" ? 0.4 : (mName === "poison-sting" ? 0.3 : (mName === "twineedle" ? 0.2 : 0.3));
      const isTargetPoisonOrSteel = target.types.some(t => ["poison", "steel"].includes(t.toLowerCase()));
      if (Math.random() < psnChance && !isTargetPoisonOrSteel) {
        target.status = "psn";
        log += isKo ? `\n${target.name}(은)는 독에 걸렸다!` : `\n${target.name} was poisoned!`;
      }
    } else if (["tri-attack", "triattack", "161", "트라이어택"].includes(mName)) {
      if (Math.random() < 0.2) {
        const targetTypes = target.types.map(t => t.toLowerCase());
        const candidates: Array<{ status: "brn" | "frz" | "par"; immuneType: string; koText: string; enText: string }> = [
          { status: "brn", immuneType: "fire", koText: `\n${target.name}(은)는 화상을 입었다!`, enText: `\n${target.name} was burned!` },
          { status: "frz", immuneType: "ice", koText: `\n${target.name}(은)는 꽁꽁 얼어붙었다!`, enText: `\n${target.name} was frozen solid!` },
          { status: "par", immuneType: "electric", koText: `\n${target.name}(은)는 마비에 걸렸다!`, enText: `\n${target.name} is paralyzed!` },
        ];
        const valid = candidates.filter(c => !targetTypes.includes(c.immuneType));
        if (valid.length > 0) {
          const chosen = valid[Math.floor(Math.random() * valid.length)];
          target.status = chosen.status;
          log += isKo ? chosen.koText : chosen.enText;
        }
      }
    }
  }

  // 7. Confusion from Attacks
  if (target.hp > 0 && (!target.confusionTurns || target.confusionTurns <= 0) && (!target.safeguardTurns || target.safeguardTurns <= 0)) {
    const isDynamicPunch = ["dynamic-punch", "dynamic_punch", "dynamicpunch", "223", "폭발펀치"].includes(mName);
    if (isDynamicPunch || ["psybeam", "confusion", "water-pulse", "dizzy-punch"].includes(mName)) {
      const isOwnTempo = target.ability?.toLowerCase().replace(/[\s_-]+/g, "") === "owntempo" ||
        target.passiveAbility?.toLowerCase().replace(/[\s_-]+/g, "") === "owntempo";
      const tName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
      if (isOwnTempo) {
        log += isKo ? `\n[특성 마이페이스] ${tName}에게는 혼란이 통하지 않는다!` : `\n[Own Tempo] ${tName} cannot be confused!`;
      } else {
        const confChance = isDynamicPunch ? 1.0 : (mName === "water-pulse" || mName === "dizzy-punch" ? 0.2 : 0.1);
        if (Math.random() < confChance) {
          target.isConfused = true;
          target.confusionTurns = Math.floor(Math.random() * 4) + 2;
          log += isKo ? `\n${tName}(은)는 혼란에 빠졌다!` : `\n${tName} became confused!`;
        }
      }
    }
  }

  // 8. Target Stat Drops from Attacks
  if (target.hp > 0) {
    const isIcyWind = ["icy-wind", "icy_wind", "icywind", "196", "얼어붙은바람", "얼어붙은 바람"].includes(mName) || move.id === 196;
    if (isIcyWind || ["bubble-beam", "bubble", "constrict"].includes(mName)) {
      const dropChance = isIcyWind ? 1.0 : 0.1;
      if (Math.random() < dropChance && target.stages.spe > -6) {
        target.stages.spe = Math.max(-6, target.stages.spe - 1);
        log += isKo ? `\n${target.name}의 스피드가 떨어졌다! (-1)` : `\n${target.name}'s Speed fell! (-1)`;
      }
    } else if (["aurora-beam", "play-rough"].includes(mName) && Math.random() < 0.1) {
      if (target.stages.atk > -6) {
        target.stages.atk = Math.max(-6, target.stages.atk - 1);
        log += isKo ? `\n${target.name}의 공격이 떨어졌다! (-1)` : `\n${target.name}'s Attack fell! (-1)`;
      }
    } else if (["iron-tail", "iron_tail", "irontail", "231", "아이언테일"].includes(mName) || move.id === 231 || move.nameKo === "아이언테일") {
      const isSerene = Boolean(
        actor.ability?.toLowerCase().includes("serene") ||
        actor.passiveAbility?.toLowerCase().includes("serene")
      );
      const dropChance = isSerene ? 0.60 : 0.30;
      if (Math.random() < dropChance && target.stages.def > -6) {
        target.stages.def = Math.max(-6, target.stages.def - 1);
        const tName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
        log += isKo ? `\n${tName}의 방어가 떨어졌다! (-1)` : `\n${tName}'s Defense fell! (-1)`;
      }
    } else if (
      ["acid", "crunch", "242", "깨물어부수기", "깨물어-부수기", "깨물어 부수기"].includes(mName) ||
      ["rock-smash", "rock_smash", "rocksmash", "249", "바위깨기", "파워케이지", "파워 케이지"].includes(mName) ||
      move.id === 249 ||
      move.nameKo === "바위깨기"
    ) {
      const isRockSmash =
        ["rock-smash", "rock_smash", "rocksmash", "249", "바위깨기", "파워케이지", "파워 케이지"].includes(mName) ||
        move.id === 249 ||
        move.nameKo === "바위깨기";
      const isSerene = Boolean(
        actor.ability?.toLowerCase().includes("serene") ||
        actor.passiveAbility?.toLowerCase().includes("serene")
      );
      const baseChance = isRockSmash ? 0.5 : 0.2;
      const dropChance = isSerene ? Math.min(1.0, baseChance * 2) : baseChance;
      if (Math.random() < dropChance && target.stages.def > -6) {
        target.stages.def = Math.max(-6, target.stages.def - 1);
        const tName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
        log += isKo ? `\n${tName}의 방어가 떨어졌다! (-1)` : `\n${tName}'s Defense fell! (-1)`;
        if (battle?.lastMoveEffect) {
          const isPlayerTarget = (target === battle.playerBattleMon || (battle.playerParty && target === battle.playerParty[battle.playerActiveIndex]));
          battle.lastMoveEffect.statChanges = battle.lastMoveEffect.statChanges || [];
          battle.lastMoveEffect.statChanges.push({
            target: isPlayerTarget ? "player" : "enemy",
            direction: "down",
          });
        }
      }
    } else if (
      ["shadow-ball", "shadow_ball", "shadowball", "247", "섀도볼", "쉐도우볼"].includes(mName) ||
      move.id === 247 ||
      move.nameKo === "섀도볼" ||
      ["psychic", "94", "사이코키네시스", "bug-buzz", "earth-power", "focus-blast"].includes(mName) ||
      move.id === 94 ||
      move.nameKo === "사이코키네시스"
    ) {
      const isSerene = Boolean(
        actor.ability?.toLowerCase().includes("serene") ||
        actor.passiveAbility?.toLowerCase().includes("serene")
      );
      const isPsychic = ["psychic", "94", "사이코키네시스"].includes(mName) || move.id === 94 || move.nameKo === "사이코키네시스";
      const baseChance = isPsychic ? 0.10 : 0.20;
      const dropChance = isSerene ? Math.min(1.0, baseChance * 2) : baseChance;
      if (Math.random() < dropChance && target.stages.spd > -6) {
        target.stages.spd = Math.max(-6, target.stages.spd - 1);
        const tName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
        log += isKo ? `\n${tName}의 특수방어가 떨어졌다! (-1)` : `\n${tName}'s Sp. Def fell! (-1)`;
        if (battle?.lastMoveEffect) {
          const isPlayerTarget = (target === battle.playerBattleMon || (battle.playerParty && target === battle.playerParty[battle.playerActiveIndex]));
          battle.lastMoveEffect.statChanges = battle.lastMoveEffect.statChanges || [];
          battle.lastMoveEffect.statChanges.push({
            target: isPlayerTarget ? "player" : "enemy",
            direction: "down",
          });
        }
      }
    } else if (["mud-slap", "mud_slap", "mudslap", "189", "진흙뿌리기", "octazooka", "190", "옥타주카", "대포무노포", "muddy-water", "mirror-shot"].includes(mName)) {
      const dropChance = (mName === "mud-slap" || mName === "mud_slap" || mName === "mudslap" || mName === "189" || mName === "진흙뿌리기") ? 1.0 : (["octazooka", "190", "옥타주카", "대포무노포"].includes(mName) ? 0.5 : 0.3);
      if (Math.random() < dropChance && target.stages.acc > -6) {
        target.stages.acc = Math.max(-6, target.stages.acc - 1);
        const tName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
        log += isKo ? `\n${tName}의 명중률이 떨어졌다! (-1)` : `\n${tName}'s Accuracy fell! (-1)`;
      }
    }
  }

  // 9. Trapping Moves (Bind, Wrap, Fire Spin, etc.)
  if (trait?.trapMove && target.hp > 0 && !target.trapState) {
    const turns = Math.random() < 0.5 ? 4 : 5;
    target.trapState = {
      moveKey: mName,
      moveNameKo: move.nameKo || move.name,
      moveNameEn: move.name,
      turnsLeft: turns,
    };
    log += isKo
      ? `\n${target.name}(은)는 ${move.nameKo || move.name}에 묶여 빠져나올 수 없게 되었다!`
      : `\n${target.name} was trapped by ${move.name}!`;
  }

  // 10. Thief (도둑질: 상대의 지닌물건을 훔쳐옴)
  if (["thief", "168", "도둑질"].includes(mName)) {
    if (target.heldItems && target.heldItems.length > 0) {
      if (!actor.heldItems || actor.heldItems.length === 0) {
        const stolenItem = target.heldItems.shift()!;
        actor.heldItems = actor.heldItems || [];
        actor.heldItems.push(stolenItem);
        log += isKo
          ? `\n${actor.nameKo || actor.name}(은)는 ${target.nameKo || target.name}의 ${stolenItem}을(를) 훔쳤다!`
          : `\n${actor.name} stole ${target.name}'s ${stolenItem}!`;
      }
    }
  }

  // 10b. Knock Off (탁쳐서떨구기: 상대의 지닌물건을 탁 쳐서 떨어뜨려 사용 불능으로 만듦)
  if (
    ["knock-off", "knock_off", "knockoff", "282", "탁쳐서떨구기"].includes(mName) ||
    move.id === 282 ||
    move.nameKo === "탁쳐서떨구기"
  ) {
    const hasSub = Boolean(target.substituteHp && target.substituteHp > 0);
    const tAb = (target.ability || "").toLowerCase().trim().replace(/[\s_]+/g, "-");
    const tPassAb = (target.passiveAbility || "").toLowerCase().trim().replace(/[\s_]+/g, "-");
    const isStickyHold =
      tAb === "sticky-hold" || tAb === "stickyhold" || tAb === "점착" ||
      tPassAb === "sticky-hold" || tPassAb === "stickyhold" || tPassAb === "점착";

    const currentItem =
      target.heldItem ||
      (target.heldItems && target.heldItems.length > 0 ? target.heldItems[0] : null);

    if (!hasSub && currentItem) {
      const aName = isKo ? (actor.nameKo || actor.name) : (actor.name || actor.nameKo);
      const tName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
      if (isStickyHold) {
        log += isKo
          ? `\n[특성 점착] ${tName}의 지닌물건은 떨어지지 않는다!`
          : `\n[Sticky Hold] ${tName}'s item cannot be knocked off!`;
      } else {
        target.heldItem = null;
        if (target.heldItems && target.heldItems.length > 0) {
          target.heldItems.shift();
        }
        target.knockedOffItem = currentItem;
        log += isKo
          ? `\n${aName}(은)는 ${tName}의 ${currentItem}을(를) 탁 쳐서 떨어뜨렸다!`
          : `\n${aName} knocked off ${tName}'s ${currentItem}!`;
      }
    }
  }

  // 11. Rampage Moves (Thrash, Petal Dance, Outrage)
  if (trait?.rampageMove && actor.hp > 0) {
    const aName = isKo ? (actor.nameKo || actor.name) : (actor.name || actor.nameKo);
    if (!actor.rampageState) {
      const totalTurns = Math.random() < 0.5 ? 2 : 3;
      actor.rampageState = {
        moveKey: mName,
        turnsLeft: totalTurns - 1, // 1st turn completed right now
      };
      log += isKo
        ? `\n${aName}(은)는 난동을 부리기 시작했다!`
        : `\n${aName} began rampaging!`;
    } else {
      actor.rampageState.turnsLeft -= 1;
      if (actor.rampageState.turnsLeft <= 0) {
        actor.rampageState = null;
        if (!actor.status && !actor.isConfused) {
          actor.isConfused = true;
          actor.confusionTurns = Math.floor(Math.random() * 4) + 2; // 2 ~ 5 turns
          log += isKo
            ? `\n${aName}(은)는 피로로 혼란에 빠졌다!`
            : `\n${aName} became confused due to fatigue!`;
        } else {
          log += isKo
            ? `\n${aName}(은)는 난동을 끝냈다.`
            : `\n${aName}'s rampage ended.`;
        }
      } else {
        log += isKo
          ? `\n${aName}(은)는 계속해서 난동을 부리고 있다!`
          : `\n${aName} is still rampaging!`;
      }
    }
  }

  return log;
}
