import { BattlePokemon, BattleState } from "./types.js";
import { MoveData, MOVES_DATA, getMoveData } from "../../data/movesKo.js";
import { validateAction } from "../mechanics/actionValidator.js";
import { checkMoveHit } from "../mechanics/accuracyEngine.js";
import { calculateDamage } from "../mechanics/damageCalculator.js";
import { isSelfTargetStatusMove, executeStatusMove } from "../moves/traits/specialStatusRegistry.js";
import { applySecondaryAttackEffects } from "../mechanics/secondaryEffects.js";
import { getMoveTrait } from "../moves/traits/moveTraits.js";

export interface SingleActionResult {
  log: string;
  damage: number;
  typeMod?: number;
  hitCount?: number;
  isSuperEffective?: boolean;
  canAct?: boolean;
  copiedMoveKey?: string;
}

/**
 * Executes a single combat action (attack or status move) for one actor against a target.
 */
export function executeSingleAction(
  actor: BattlePokemon,
  target: BattlePokemon,
  move: MoveData,
  isActorPlayer: boolean,
  isKo: boolean,
  battle?: BattleState
): SingleActionResult {
  const actorName = isKo ? (actor.nameKo || actor.name) : (actor.name || actor.nameKo);
  const targetName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
  const moveName = isKo ? move.nameKo : move.name.toUpperCase();
  const moveKey = move.name.toLowerCase().replace(/[\s_]+/g, "-");

  // 1. Action Validation (Recharge, Flinch, Sleep, Freeze, Paralysis, Attract, Confusion, Taunt, Disable)
  const validation = validateAction(actor, move, actorName, moveName, isKo);
  if (!validation.canAct) {
    if (actor.chargingMove) {
      actor.chargingMove = null;
      actor.isSemiInvulnerable = false;
      actor.semiInvulnerableState = null;
      actor.bideDamageTaken = 0;
    }
    return { log: validation.log || "", damage: 0, canAct: false };
  }
  const validationPrefix = validation.log ? `${validation.log}\n` : "";

  // 2. Metronome (손가락흔들기) resolution
  let activeMove = move;
  let metronomePrefix = "";
  let metronomeMoveKey: string | undefined = undefined;
  const isMetronomeMove = (
    moveKey === "metronome" ||
    moveKey === "118" ||
    move.nameKo === "손가락흔들기"
  );

  if (isMetronomeMove) {
    const bannedKeys = new Set(["metronome", "struggle", "118", "165"]);
    const allCandidateKeys = Object.keys(MOVES_DATA).filter(k => !bannedKeys.has(k.toLowerCase()));
    const randomKey = allCandidateKeys[Math.floor(Math.random() * allCandidateKeys.length)] || "tackle";
    const selectedMoveData = MOVES_DATA[randomKey] || MOVES_DATA["tackle"];
    if (selectedMoveData) {
      metronomeMoveKey = selectedMoveData.name.toLowerCase().replace(/[\s_]+/g, "-");
      activeMove = selectedMoveData;
      const selectedKo = selectedMoveData.nameKo || metronomeMoveKey;
      const selectedEn = (selectedMoveData.name || metronomeMoveKey).toUpperCase();
      metronomePrefix = isKo
        ? `${actorName}의 손가락흔들기!\n손가락을 흔들어 ${selectedKo}(이)가 튀어나왔다!\n`
        : `${actorName} used METRONOME!\nWagging a finger stimulated its brain to unleash ${selectedEn}!\n`;
    }
  }

  // 2-1. Mimic / Copycat (흉내쟁이 / 흉내내기) resolution
  let copiedMoveKey: string | undefined = undefined;
  let mimicPrefix = "";
  const isMimicMove = (
    moveKey === "mimic" ||
    moveKey === "copycat" ||
    moveKey === "102" ||
    moveKey === "383" ||
    move.nameKo === "흉내쟁이" ||
    move.nameKo === "흉내내기"
  );

  if (isMimicMove) {
    let candidateKey = target.lastMoveUsed || battle?.lastMoveEffect?.moveKey;
    if (!candidateKey || candidateKey === "mimic" || candidateKey === "copycat") {
      if (target.moves && target.moves.length > 0) {
        candidateKey = target.moves.find(m => m !== "mimic" && m !== "copycat") || "tackle";
      } else {
        candidateKey = "tackle";
      }
    }

    const copiedMoveData = getMoveData(candidateKey) || MOVES_DATA[candidateKey] || MOVES_DATA["tackle"];
    if (copiedMoveData) {
      copiedMoveKey = candidateKey.toLowerCase().replace(/[\s_]+/g, "-");
      activeMove = copiedMoveData;
      const copiedKo = copiedMoveData.nameKo || copiedMoveKey;
      const copiedEn = (copiedMoveData.name || copiedMoveKey).toUpperCase();
      mimicPrefix = isKo
        ? `${actorName}의 흉내쟁이!\n${actorName}(은)는 상대의 ${copiedKo}(을)를 따라했다!\n`
        : `${actorName}'s COPYCAT!\n${actorName} mimicked ${targetName}'s ${copiedEn}!\n`;
    }
  }

  // 2-2. Mirror Move (따라하기) resolution
  let mirrorPrefix = "";
  const isMirrorMove = (
    moveKey === "mirror-move" ||
    moveKey === "mirrormove" ||
    moveKey === "119" ||
    move.nameKo === "따라하기"
  );

  if (isMirrorMove) {
    let candidateKey = target.lastMoveUsed || battle?.lastMoveEffect?.moveKey;
    if (!candidateKey || candidateKey === "mirror-move" || candidateKey === "mirrormove") {
      if (target.moves && target.moves.length > 0) {
        candidateKey = target.moves.find(m => m !== "mirror-move" && m !== "mirrormove") || "flamethrower";
      } else {
        candidateKey = "flamethrower";
      }
    }

    const copiedMoveData = getMoveData(candidateKey) || MOVES_DATA[candidateKey] || MOVES_DATA["flamethrower"] || MOVES_DATA["tackle"];
    if (copiedMoveData) {
      copiedMoveKey = candidateKey.toLowerCase().replace(/[\s_]+/g, "-");
      activeMove = copiedMoveData;
      const copiedKo = copiedMoveData.nameKo || copiedMoveKey;
      const copiedEn = (copiedMoveData.name || copiedMoveKey).toUpperCase();
      mirrorPrefix = isKo
        ? `${actorName}의 따라하기!\n${actorName}(은)는 상대의 ${copiedKo}(을)를 흉내 냈다!\n`
        : `${actorName} used MIRROR MOVE!\n${actorName} mirrored ${targetName}'s ${copiedEn}!\n`;
    }
  }

  const withPrefix = (res: SingleActionResult): SingleActionResult => {
    actor.lastMoveUsed = moveKey;
    return {
      ...res,
      log: `${validationPrefix}${metronomePrefix}${mimicPrefix}${mirrorPrefix}${res.log}`,
      copiedMoveKey: res.copiedMoveKey ?? metronomeMoveKey ?? copiedMoveKey,
    };
  };

  // Rage state tracking: Using Rage enters rage, choosing another move cancels it
  if (moveKey === "rage") {
    actor.isRaging = true;
  } else {
    actor.isRaging = false;
  }

  // 3. Status Moves Pipeline
  if (activeMove.category === "status") {
    const isSelfTarget = isSelfTargetStatusMove(activeMove.name);

    if (!isSelfTarget && target.isProtected) {
      return withPrefix({
        log: isKo ? `${targetName}(은)는 공격을 막아냈다!` : `${targetName} protected itself!`,
        damage: 0,
      });
    }

    if (!isSelfTarget && target.substituteHp && target.substituteHp > 0) {
      return withPrefix({
        log: isKo
          ? `${actorName}의 ${activeMove.nameKo}!\n하지만 대타출동 분신에게는 통하지 않았다!`
          : `${actorName}'s ${activeMove.name.toUpperCase()}!\nBut the substitute protected ${targetName}!`,
        damage: 0,
      });
    }

    if (!isSelfTarget && target.isSemiInvulnerable) {
      const hasNoGuard = actor.ability?.toLowerCase() === "no-guard";
      const isPoisonToxic = (activeMove.name.toLowerCase().replace(/[\s_]+/g, "-") === "toxic") && actor.types.includes("poison");
      if (!hasNoGuard && !isPoisonToxic) {
        return withPrefix({
          log: isKo
            ? `${actorName}의 ${activeMove.nameKo}!\n하지만 ${targetName}에게는 닿지 않았다!`
            : `${actorName}'s ${activeMove.name.toUpperCase()}!\nBut it couldn't reach ${targetName}!`,
          damage: 0,
        });
      }
    }

    if (!isSelfTarget) {
      const hitResult = checkMoveHit({
        actor,
        target,
        move: activeMove,
        weather: battle?.weather,
        hasClearEyePerk: isActorPlayer && battle?.pendingBallPerk === "clear_eye",
      });
      if (!hitResult.isHit) {
        return withPrefix({
          log: isKo
            ? `${actorName}의 ${activeMove.nameKo}!\n하지만 ${targetName}에게 맞지 않았다!`
            : `${actorName}'s ${activeMove.name.toUpperCase()}!\nBut it missed ${targetName}!`,
          damage: 0,
        });
      }
    }

    const statLog = executeStatusMove({
      actor,
      target,
      move: activeMove,
      actorName,
      targetName,
      isKo,
      battle,
    });
    const statusHeader = isKo ? `${actorName}의 ${activeMove.nameKo}!` : `${actorName} used ${activeMove.name.toUpperCase()}!`;
    return withPrefix({ log: `${statusHeader}\n${statLog}`, damage: 0 });
  }

  // 4. Two-Turn Charging Moves Pipeline
  const activeMoveKey = activeMove.name.toLowerCase().replace(/[\s_]+/g, "-");
  if (actor.chargingMove && actor.chargingMove !== activeMoveKey) {
    actor.chargingMove = null;
    actor.isSemiInvulnerable = false;
    actor.semiInvulnerableState = null;
  }

  const trait = getMoveTrait(activeMoveKey);
  if (trait?.chargeTrait) {
    const chargeInfo = trait.chargeTrait;
    const isInstantByWeather = chargeInfo.instantUnderWeather && battle?.weather === chargeInfo.instantUnderWeather;

    if (!isInstantByWeather) {
      if (actor.chargingMove !== activeMoveKey) {
        actor.chargingMove = activeMoveKey;
        if (chargeInfo.semiInvulnerable) {
          actor.isSemiInvulnerable = true;
          actor.semiInvulnerableState = chargeInfo.semiInvulnerable;
        }
        if (chargeInfo.chargeStatBoost) {
          const sKey = chargeInfo.chargeStatBoost.stat;
          actor.stages[sKey] = Math.min(6, actor.stages[sKey] + chargeInfo.chargeStatBoost.stage);
        }
        const moveHeader = isKo ? `${actorName}의 ${moveName}!` : `${actorName} used ${moveName}!`;
        const chargeLog = isKo
          ? `${moveHeader}\n${actorName}(은)는 ${chargeInfo.chargeTextKo}`
          : `${moveHeader}\n${actorName} ${chargeInfo.chargeTextEn}`;
        return withPrefix({ log: chargeLog, damage: 0 });
      }
      // Turn 2: Unleash attack
      actor.chargingMove = null;
      actor.isSemiInvulnerable = false;
      actor.semiInvulnerableState = null;
      actor.bideDamageTaken = 0;
    }
  }

  // Damp Ability Check (습기 특성은 자폭/대폭발 등의 기술을 무효화하고 시전자도 자폭하지 않음)
  if (trait?.isSelfDestruct) {
    const actorHasDamp = actor.ability?.toLowerCase() === "damp" || actor.passiveAbility?.toLowerCase() === "damp";
    const targetHasDamp = target.ability?.toLowerCase() === "damp" || target.passiveAbility?.toLowerCase() === "damp";
    if (actorHasDamp || targetHasDamp) {
      const dampMonName = actorHasDamp ? actorName : targetName;
      return withPrefix({
        log: isKo
          ? `${dampMonName}의 습기 특성으로 인해 ${moveName}(을)를 쓸 수 없다!`
          : `${actorName} cannot use ${moveName} because of ${dampMonName}'s Damp!`,
        damage: 0,
      });
    }
  }

  // 5. Accuracy & Evasiveness Check
  const hitResult = checkMoveHit({
    actor,
    target,
    move: activeMove,
    weather: battle?.weather,
    hasClearEyePerk: isActorPlayer && battle?.pendingBallPerk === "clear_eye",
  });

  if (!isActorPlayer && battle?.pendingBallPerk === "dodge") {
    const isNeverMiss = hitResult.reason === "never_miss";
    if (!isNeverMiss) {
      battle.pendingBallPerk = null;
      let selfDestructLog = "";
      if (trait?.isSelfDestruct) {
        actor.hp = 0;
        selfDestructLog = isKo ? `\n${actorName}(은)는 폭발하여 스스로 쓰러졌다!` : `\n${actorName} self-destructed and fainted!`;
      }
      return withPrefix({
        log: isKo
          ? `${actorName}의 ${moveName}!\n[PERK:dodge] ${targetName}(은)는 회피기동으로 적의 공격을 완벽히 피했다!${selfDestructLog}`
          : `${actorName}'s ${moveName}!\n[PERK:dodge] ${targetName} skillfully dodged the attack!${selfDestructLog}`,
        damage: 0,
      });
    }
  }

  if (!hitResult.isHit) {
    let selfDestructLog = "";
    if (trait?.isSelfDestruct) {
      actor.hp = 0;
      selfDestructLog = isKo ? `\n${actorName}(은)는 폭발하여 스스로 쓰러졌다!` : `\n${actorName} self-destructed and fainted!`;
    }
    return withPrefix({
      log: isKo ? `${actorName}의 ${moveName}! 하지만 공격은 빗나갔다!${selfDestructLog}` : `${actorName}'s ${moveName}! But the attack missed!${selfDestructLog}`,
      damage: 0,
    });
  }

  // 6. Protect Shield
  if (target.isProtected) {
    let selfDestructLog = "";
    if (trait?.isSelfDestruct) {
      actor.hp = 0;
      selfDestructLog = isKo ? `\n${actorName}(은)는 폭발하여 스스로 쓰러졌다!` : `\n${actorName} self-destructed and fainted!`;
    }
    return withPrefix({
      log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}(은)는 공격을 막아냈다!${selfDestructLog}` : `${actorName}'s ${moveName}! But ${targetName} protected itself!${selfDestructLog}`,
      damage: 0,
    });
  }

  // 7. Damage Calculation
  const dmgResult = calculateDamage(actor, target, activeMove, isActorPlayer, isKo, battle);
  const damage = dmgResult.damage;

  // 8. Water perk surge absorption
  let perkText = "";
  if (isActorPlayer && activeMove.type.toLowerCase() === "water" && damage > 0) {
    if (battle?.pendingBallPerk === "wave" || battle?.activeBallPerk === "wave") {
      const heal = Math.min(actor.maxHp - actor.hp, damage);
      if (heal > 0) {
        actor.hp += heal;
        perkText += isKo
          ? `\n[PERK:wave] 파도의 힘으로 입힌 피해만큼 체력을 흡수했다! (+${heal} HP)`
          : `\n[PERK:wave] Surging Wave absorbed ${heal} HP!`;
      }
    }
  }

  // 9. Target HP Modification & Safeguards
  let damageLog = "";
  if (!isActorPlayer && battle?.rockSolidTurns && battle.rockSolidTurns > 0) {
    damageLog += isKo ? "\n[PERK:rock_solid] 돌멩이 효과로 받는 피해를 50% 경감했다!" : "\n[PERK:rock_solid] Pebble reduced damage by 50%!";
  }

  if (target.substituteHp && target.substituteHp > 0) {
    target.substituteHp = Math.max(0, target.substituteHp - damage);
    if (target.substituteHp === 0) {
      damageLog += isKo ? ` 대타출동 분신이 대신 맞고 부서졌다!` : ` The substitute broke!`;
    } else {
      damageLog += isKo ? ` 대타출동 분신이 데미지를 흡수했다! (${damage})` : ` The substitute took ${damage} damage!`;
    }
  } else {
    if (target.hasIllusion) {
      target.hasIllusion = false;
      target.illusionTarget = null;
      damageLog += isKo ? `\n일루전이 깨져 본래의 ${isActorPlayer ? target.name : target.nameKo} 모습이 드러났다!` : `\nThe illusion broke!`;
    }

    if (!isActorPlayer && target.hasEndurePerk && damage >= target.hp) {
      target.hp = 1;
      target.hasEndurePerk = false;
      damageLog += isKo
        ? `\n[PERK:willpower] ${targetName}(은)는 의지의 힘으로 HP 1로 공격을 견뎌냈다!`
        : `\n[PERK:willpower] ${targetName} held on with 1 HP by Willpower!`;
    } else if (
      (target.ability?.toLowerCase() === "sturdy" || target.passiveAbility?.toLowerCase() === "sturdy") &&
      target.hp === target.maxHp &&
      damage >= target.hp
    ) {
      target.hp = 1;
      damageLog += isKo ? ` [특성 옹골참!] ${targetName}(은)는 1의 HP로 버텼다!` : ` [Sturdy!] ${targetName} held on with 1 HP!`;
    } else {
      target.hp = Math.max(0, target.hp - damage);
    }

    if (target.hp === 0) {
      target.chargingMove = null;
      target.isSemiInvulnerable = false;
      target.semiInvulnerableState = null;
      target.isRaging = false;
      target.bideDamageTaken = 0;
    }

    if (activeMove.category === "physical" && damage > 0) {
      target.lastPhysicalDamageTakenThisTurn = (target.lastPhysicalDamageTakenThisTurn || 0) + damage;
    }

    // Bide effect: accumulate damage taken while biding
    if (target.chargingMove === "bide" && target.hp > 0 && damage > 0) {
      target.bideDamageTaken = (target.bideDamageTaken || 0) + damage;
    }

    // Rage effect: User's Attack is raised by 1 stage every time it takes damage while raging
    if (target.isRaging && target.hp > 0 && damage > 0) {
      if (target.stages.atk < 6) {
        target.stages.atk = Math.min(6, target.stages.atk + 1);
        damageLog += isKo
          ? `\n[분노 효과!] ${targetName}의 분노가 끓어오른다! 공격이 올랐다! (+1)`
          : `\n[Rage!] ${targetName}'s rage is building! Attack rose! (+1)`;
        if (battle?.lastMoveEffect) {
          const isTargetPlayer = target === battle.playerBattleMon || target === battle.playerParty?.[battle.playerActiveIndex];
          battle.lastMoveEffect.statChanges = battle.lastMoveEffect.statChanges || [];
          battle.lastMoveEffect.statChanges.push({
            target: isTargetPlayer ? "player" : "enemy",
            direction: "up",
          });
        }
      }
    }
  }

  // 10. Self-Destruct execution
  if (dmgResult.isSelfDestruct) {
    actor.hp = 0;
    damageLog += isKo ? `\n${actorName}(은)는 폭발하여 스스로 쓰러졌다!` : `\n${actorName} self-destructed and fainted!`;
  }

  // 11. Secondary Effects
  const extraEffects = (dmgResult.typeMod > 0 && damage > 0)
    ? applySecondaryAttackEffects(actor, target, activeMove, damage, isKo)
    : "";

  // 12. Must recharge setup
  if (dmgResult.mustRecharge) {
    actor.mustRecharge = true;
  }

  const finalLog = `${dmgResult.log}${perkText}${damageLog}${extraEffects}`;
  return withPrefix({
    log: finalLog,
    damage,
    typeMod: dmgResult.typeMod,
    hitCount: dmgResult.hitCount,
    isSuperEffective: dmgResult.isSuperEffective,
  });
}
