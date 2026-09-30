import { BattlePokemon } from "../engine/types.js";
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
  isKo: boolean
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
  } else if (["waterfall", "127"].includes(mName)) {
    if (Math.random() < 0.2) {
      target.isFlinched = true;
    }
  }

  // 6. Status Inflictions from Attacks
  // 불꽃 타입 공격 또는 열탕(Scald)에 피격된 대상의 얼음 상태 해제 (포켓몬 본가 공식 시스템)
  if (target.hp > 0 && target.status === "frz" && (move.type === "fire" || mName === "scald")) {
    target.status = null;
    log += isKo ? `\n${target.name}의 얼음이 녹았다!` : `\n${target.name} thawed out!`;
  }

  if (target.hp > 0 && !target.status) {
    if (["flamethrower", "fire-blast", "scald", "ember", "fire-punch", "flame-wheel", "flamewheel", "172", "화염바퀴", "화염자동차"].includes(mName)) {
      const burnChance = mName === "scald" ? 0.3 : 0.1;
      if (Math.random() < burnChance && !target.types.map(t => t.toLowerCase()).includes("fire")) {
        target.status = "brn";
        log += isKo ? `\n${target.name}(은)는 화상을 입었다!` : `\n${target.name} was burned!`;
      }
    } else if (["ice-beam", "blizzard", "ice-punch", "powder-snow"].includes(mName)) {
      if (Math.random() < 0.1 && !target.types.map(t => t.toLowerCase()).includes("ice")) {
        target.status = "frz";
        log += isKo ? `\n${target.name}(은)는 꽁꽁 얼어붙었다!` : `\n${target.name} was frozen solid!`;
      }
    } else if (["thunderbolt", "thunder-shock", "thundershock", "discharge", "spark", "thunder", "thunder-punch", "body-slam", "lick"].includes(mName)) {
      const parChance = (mName === "thunder" || mName === "body-slam" || mName === "lick") ? 0.3 : 0.1;
      if (Math.random() < parChance && !target.types.map(t => t.toLowerCase()).includes("electric")) {
        target.status = "par";
        log += isKo ? `\n${target.name}(은)는 마비에 걸렸다!` : `\n${target.name} is paralyzed!`;
      }
    } else if (["poison-sting", "twineedle", "sludge-bomb", "poison-jab", "smog", "sludge"].includes(mName)) {
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
  if (target.hp > 0 && (!target.confusionTurns || target.confusionTurns <= 0)) {
    if (["psybeam", "confusion", "water-pulse", "dizzy-punch", "dynamic-punch"].includes(mName)) {
      const confChance = mName === "dynamic-punch" ? 1.0 : (mName === "water-pulse" || mName === "dizzy-punch" ? 0.2 : 0.1);
      if (Math.random() < confChance) {
        target.isConfused = true;
        target.confusionTurns = Math.floor(Math.random() * 4) + 2;
        log += isKo ? `\n${target.name}(은)는 혼란에 빠졌다!` : `\n${target.name} became confused!`;
      }
    }
  }

  // 8. Target Stat Drops from Attacks
  if (target.hp > 0) {
    if (["bubble-beam", "bubble", "constrict", "icy-wind"].includes(mName)) {
      const dropChance = mName === "icy-wind" ? 1.0 : 0.1;
      if (Math.random() < dropChance && target.stages.spe > -6) {
        target.stages.spe = Math.max(-6, target.stages.spe - 1);
        log += isKo ? `\n${target.name}의 스피드가 떨어졌다! (-1)` : `\n${target.name}'s Speed fell! (-1)`;
      }
    } else if (["aurora-beam", "play-rough"].includes(mName) && Math.random() < 0.1) {
      if (target.stages.atk > -6) {
        target.stages.atk = Math.max(-6, target.stages.atk - 1);
        log += isKo ? `\n${target.name}의 공격이 떨어졌다! (-1)` : `\n${target.name}'s Attack fell! (-1)`;
      }
    } else if (["acid", "iron-tail", "crunch", "rock-smash"].includes(mName)) {
      const dropChance = mName === "rock-smash" ? 0.5 : 0.2;
      if (Math.random() < dropChance && target.stages.def > -6) {
        target.stages.def = Math.max(-6, target.stages.def - 1);
        log += isKo ? `\n${target.name}의 방어가 떨어졌다! (-1)` : `\n${target.name}'s Defense fell! (-1)`;
      }
    } else if (["psychic", "shadow-ball", "bug-buzz", "earth-power", "focus-blast"].includes(mName)) {
      const dropChance = mName === "psychic" ? 0.1 : 0.2;
      if (Math.random() < dropChance && target.stages.spd > -6) {
        target.stages.spd = Math.max(-6, target.stages.spd - 1);
        log += isKo ? `\n${target.name}의 특수방어가 떨어졌다! (-1)` : `\n${target.name}'s Sp. Def fell! (-1)`;
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
