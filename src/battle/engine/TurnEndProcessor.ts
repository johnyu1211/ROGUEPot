import { BattlePokemon, BattleState, StatStages } from "./types.js";

/**
 * Handles all end-of-turn calculations and status damage.
 */
export function processTurnEndEffects(
  mon: BattlePokemon,
  isKo: boolean,
  logs: string[],
  weather?: "sun" | "rain" | "sand" | "snow" | null,
  battle?: BattleState
) {
  if (mon.hp <= 0) return;
  const name = isKo ? mon.nameKo : mon.name;

  // 1. Mist countdown
  if (mon.mistTurns && mon.mistTurns > 0) {
    mon.mistTurns -= 1;
    if (mon.mistTurns === 0) {
      logs.push(isKo ? `${name}을(를) 감싸던 흰안개가 걷혔다.` : `The mist surrounding ${name} faded.`);
    }
  }

  // 2. Disable countdown
  if (mon.disabledTurns && mon.disabledTurns > 0) {
    mon.disabledTurns -= 1;
    if (mon.disabledTurns === 0) {
      mon.disabledMove = null;
      logs.push(isKo ? `${name}의 기술을 묶던 사슬이 풀렸다!` : `${name} is no longer disabled!`);
    }
  }

  // 3. Sandstorm residual damage
  if (weather === "sand") {
    const isImmune = mon.types.some((t) => ["rock", "ground", "steel"].includes(t.toLowerCase())) ||
      mon.ability === "Magic Guard" || mon.ability === "Overcoat" || mon.ability === "Sand Force" ||
      mon.ability === "Sand Rush" || mon.ability === "Sand Veil";
    if (!isImmune) {
      const sandDmg = Math.max(1, Math.floor(mon.maxHp / 16));
      mon.hp = Math.max(0, mon.hp - sandDmg);
      logs.push(isKo ? `모래바람이 ${name}을(를) 덮쳤다! (-${sandDmg})` : `The sandstorm buffeted ${name}! (-${sandDmg})`);
    }
  }

  // 4. Burn residual damage (1/16)
  if (mon.status === "brn") {
    const burnDmg = Math.max(1, Math.floor(mon.maxHp / 16));
    mon.hp = Math.max(0, mon.hp - burnDmg);
    logs.push(isKo ? `${name}(은)는 화상으로 ${burnDmg} 데미지를 입었다!` : `${name} was hurt by its burn! (${burnDmg})`);
  }

  // 5. Poison / Badly Poisoned residual damage
  if (mon.status === "psn") {
    const psnDmg = Math.max(1, Math.floor(mon.maxHp / 8));
    mon.hp = Math.max(0, mon.hp - psnDmg);
    logs.push(isKo ? `${name}(은)는 독으로 ${psnDmg} 데미지를 입었다!` : `${name} was hurt by poison! (${psnDmg})`);
  } else if (mon.status === "tox") {
    const counter = mon.toxicCounter || 1;
    const toxDmg = Math.max(1, Math.floor((mon.maxHp * counter) / 16));
    mon.hp = Math.max(0, mon.hp - toxDmg);
    mon.toxicCounter = counter + 1;
    logs.push(isKo ? `${name}(은)는 맹독으로 ${toxDmg} 데미지를 입었다!` : `${name} was badly hurt by toxic! (${toxDmg})`);
  }

  // 6. Trapping Move residual damage (1/8)
  if (mon.trapState && mon.trapState.turnsLeft > 0 && mon.hp > 0) {
    const trapDmg = Math.max(1, Math.floor(mon.maxHp / 8));
    mon.hp = Math.max(0, mon.hp - trapDmg);
    mon.trapState.turnsLeft -= 1;
    const trapMoveName = isKo ? mon.trapState.moveNameKo : mon.trapState.moveNameEn;
    logs.push(
      isKo
        ? `${name}(은)는 ${trapMoveName}의 조임으로 ${trapDmg} 데미지를 입었다!`
        : `${name} is hurt by ${trapMoveName}! (${trapDmg})`
    );

    if (mon.trapState.turnsLeft <= 0) {
      if (mon.hp > 0) {
        logs.push(
          isKo
            ? `${name}(은)는 ${trapMoveName}의 구속에서 풀려났다!`
            : `${name} was freed from ${trapMoveName}!`
        );
      }
      mon.trapState = null;
    }
  }

  // 7. Leech Seed drain (1/8)
  if (mon.isSeeded && mon.hp > 0 && battle) {
    const isPlayerVictim = (mon === battle.playerBattleMon || mon === battle.playerParty[battle.playerActiveIndex]);
    const leechTarget = isPlayerVictim ? battle.enemy : (battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex]);
    const drainDmg = Math.max(1, Math.floor(mon.maxHp / 8));
    mon.hp = Math.max(0, mon.hp - drainDmg);

    const healAmount = Math.min(leechTarget.maxHp - leechTarget.hp, drainDmg);
    if (healAmount > 0) {
      leechTarget.hp += healAmount;
    }

    const leechTargetName = isPlayerVictim
      ? (isKo ? leechTarget.nameKo : leechTarget.name)
      : leechTarget.name;

    logs.push(
      isKo
        ? `씨뿌리기가 ${name}의 체력을 깎아내렸다! (-${drainDmg})\n${leechTargetName}의 체력이 회복되었다! (+${drainDmg})`
        : `Leech Seed stole HP from ${name}! (-${drainDmg})\n${leechTargetName} restored HP!`
    );

    // Trigger absorb visual cue for animation
    battle.lastMoveEffect = {
      moveKey: "absorb",
      moveName: "Absorb",
      type: "grass",
      isSpecial: true,
      isPlayerAttacking: !isPlayerVictim,
    };

    if (battle.turnActions) {
      battle.turnActions.push({
        actor: !isPlayerVictim ? "player" : "enemy",
        moveKey: "absorb",
        moveName: "Absorb",
        type: "grass",
        isSpecial: true,
        log: isKo ? `씨뿌리기가 ${name}의 체력을 흡수했다!` : `Leech Seed absorbed HP from ${name}!`,
        enemyHpAfter: battle.enemy.hp,
        playerHpAfter: (battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex]).hp,
        damage: drainDmg,
        isHit: true,
      });
    }
  }

  // 8. Moody Ability
  if (mon.ability === "Moody" || mon.passiveAbility === "Moody") {
    const statsList: (keyof StatStages)[] = ["atk", "def", "spa", "spd", "spe"];
    const boostStat = statsList[Math.floor(Math.random() * statsList.length)];
    const dropList = statsList.filter((s) => s !== boostStat);
    const dropStat = dropList[Math.floor(Math.random() * dropList.length)];

    mon.stages[boostStat] = Math.min(6, mon.stages[boostStat] + 2);
    mon.stages[dropStat] = Math.max(-6, mon.stages[dropStat] - 1);
    logs.push(
      isKo
        ? `\n[특성 변덕쟁이!] ${name}의 ${boostStat.toUpperCase()} 크게 상승(+2), ${dropStat.toUpperCase()} 하락(-1)`
        : `\n[Moody!] ${name}'s ${boostStat.toUpperCase()} sharply rose, ${dropStat.toUpperCase()} fell.`
    );

    if (battle?.lastMoveEffect) {
      const isPlayerMon = mon === battle.playerBattleMon || mon === battle.playerParty[battle.playerActiveIndex];
      battle.lastMoveEffect.statChanges = battle.lastMoveEffect.statChanges || [];
      battle.lastMoveEffect.statChanges.push({ target: isPlayerMon ? "player" : "enemy", direction: "up" });
      battle.lastMoveEffect.statChanges.push({ target: isPlayerMon ? "player" : "enemy", direction: "down" });
    }
  }

  // 9. Speed Boost Ability
  if (mon.ability === "Speed Boost" || mon.passiveAbility === "Speed Boost") {
    mon.stages.spe = Math.min(6, mon.stages.spe + 1);
    logs.push(isKo ? `\n[특성 가속!] ${name}의 스피드가 올라갔다! (+1)` : `\n[Speed Boost!] ${name}'s Speed rose! (+1)`);

    if (battle?.lastMoveEffect) {
      const isPlayerMon = mon === battle.playerBattleMon || mon === battle.playerParty[battle.playerActiveIndex];
      battle.lastMoveEffect.statChanges = battle.lastMoveEffect.statChanges || [];
      battle.lastMoveEffect.statChanges.push({ target: isPlayerMon ? "player" : "enemy", direction: "up" });
    }
  }
}
