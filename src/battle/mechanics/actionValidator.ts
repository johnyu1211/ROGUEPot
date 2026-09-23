import { BattlePokemon } from "../engine/types.js";
import { MoveData } from "../../data/movesKo.js";

export interface ActionValidationResult {
  canAct: boolean;
  log?: string;
  selfDamage?: number;
}

/**
 * Validates if the Pokémon can execute an action this turn.
 * Handles status conditions (sleep, freeze, paralysis), volatile conditions (flinch, confuse, attract),
 * and restrictions (recharge, taunt, disable).
 */
export function validateAction(
  actor: BattlePokemon,
  move: MoveData,
  actorName: string,
  moveName: string,
  isKo: boolean
): ActionValidationResult {
  // 1. Must recharge turn (Hyper Beam, Giga Impact, etc.)
  if (actor.mustRecharge) {
    actor.mustRecharge = false;
    return {
      canAct: false,
      log: isKo ? `${actorName}(은)는 반동으로 움직일 수 없다!` : `${actorName} must recharge!`,
    };
  }

  // 2. Flinch condition
  if (actor.isFlinched) {
    actor.isFlinched = false;
    return {
      canAct: false,
      log: isKo ? `${actorName}(은)는 풀이 죽어 움직일 수 없다!` : `${actorName} flinched!`,
    };
  }

  // 3. Sleep condition
  if (actor.status === "slp") {
    // 같은 턴에 방금 잠든 직후(sleepTurns === 0)라면 절대 즉시 깰 수 없음!
    if ((actor.sleepTurns || 0) === 0) {
      actor.sleepTurns = 1;
      return {
        canAct: false,
        log: isKo ? `${actorName}(은)는 쿨쿨 잠들어 있다...` : `${actorName} is fast asleep!`,
      };
    }

    const duration = actor.sleepDuration || 2;
    if ((actor.sleepTurns || 0) < duration) {
      actor.sleepTurns = (actor.sleepTurns || 0) + 1;
      return {
        canAct: false,
        log: isKo ? `${actorName}(은)는 쿨쿨 잠들어 있다...` : `${actorName} is fast asleep!`,
      };
    }

    // 수면 턴수 충족 -> 기상! (GBA/고전 본가 룰: 일어난 턴은 기상 로그와 함께 행동 소모)
    actor.status = null;
    actor.sleepTurns = 0;
    delete actor.sleepDuration;
    return {
      canAct: false,
      log: isKo ? `${actorName}(은)는 눈을 떴다!` : `${actorName} woke up!`,
    };
  }

  // 4. Freeze condition
  if (actor.status === "frz") {
    if (Math.random() < 0.2) {
      actor.status = null;
      // Thawed out: can act immediately
    } else {
      return {
        canAct: false,
        log: isKo ? `${actorName}(은)는 얼어붙어서 움직일 수 없다!` : `${actorName} is frozen solid!`,
      };
    }
  }

  // 5. Paralysis condition (25% fully paralyzed)
  if (actor.status === "par" && Math.random() < 0.25) {
    return {
      canAct: false,
      log: isKo ? `${actorName}(은)는 몸이 저려서 움직일 수 없다!` : `${actorName} is fully paralyzed!`,
    };
  }

  // 6. Attract condition (50% immobilized by love)
  if (actor.isAttracted && Math.random() < 0.5) {
    return {
      canAct: false,
      log: isKo
        ? `${actorName}(은)는 헤롱헤롱 상태에 빠져 몸을 움직일 수 없다!`
        : `${actorName} is immobilized by love!`,
    };
  }

  // 7. Confusion condition
  if (actor.isConfused) {
    actor.confusionTurns = (actor.confusionTurns || 3) - 1;
    if (actor.confusionTurns <= 0) {
      actor.isConfused = false;
      actor.confusionTurns = 0;
      return {
        canAct: true,
        log: isKo ? `${actorName}(은)는 혼란이 풀렸다!` : `${actorName} snapped out of confusion!`,
      };
    } else if (Math.random() < 0.33) {
      // 40 Power typeless physical self-attack formula
      const confDmg = Math.max(
        1,
        Math.floor((((2 * actor.level / 5 + 2) * 40 * actor.atk / Math.max(1, actor.def)) / 50) + 2)
      );
      actor.hp = Math.max(0, actor.hp - confDmg);
      return {
        canAct: false,
        selfDamage: confDmg,
        log: isKo
          ? `${actorName}(은)는 혼란에 빠져 있다!\n혼란으로 인해 자신을 공격했다! (-${confDmg})`
          : `${actorName} is confused!\nIt hurt itself in confusion! (-${confDmg})`,
      };
    }
  }

  // 8. Taunt restriction (Status moves blocked)
  if (actor.isTaunted && move.category === "status") {
    return {
      canAct: false,
      log: isKo
        ? `${actorName}(은)는 도발당해서 변화기를 쓸 수 없다!`
        : `${actorName} cannot use status moves due to Taunt!`,
    };
  }

  // 9. Disable restriction (Specific move disabled)
  const cleanMoveKey = move.name.toLowerCase().replace(/[\s_]+/g, "-");
  if (actor.disabledMove && actor.disabledMove === cleanMoveKey) {
    return {
      canAct: false,
      log: isKo
        ? `${actorName}의 ${moveName}!\n하지만 사슬에 묶여 기술을 쓸 수 없다!`
        : `${actorName}'s ${moveName}!\nDisabled by chains and cannot be used!`,
    };
  }

  return { canAct: true };
}
