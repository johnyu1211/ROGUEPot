import { BattlePokemon, BattleState, StatStages } from "./types.js";
import { getTypeEffectiveness } from "../mechanics/typeChart.js";

/**
 * Handles all end-of-turn calculations and status damage.
 */
export function processTurnEndEffects(
  mon: BattlePokemon,
  isKo: boolean,
  logs: string[],
  weather?: "sun" | "rain" | "sand" | "snow" | null,
  battle?: BattleState,
  phase: "all" | "actions" | "residuals" = "all"
) {
  if (mon.hp <= 0) return;
  const name = isKo ? mon.nameKo : mon.name;

  // ==========================================================================
  // [Phase A: 카운트다운 및 전용 연출(turnActions)을 동반하는 턴 종료 기술 효과]
  // - 본가 공식 순서 및 GIF 렌더러 파이프라인(turnActions -> residualFrames)과
  //   충돌 없이 1:1로 맞물리도록 상태이상 잔여 데미지보다 먼저 처리합니다.
  // ==========================================================================
  if (phase === "all" || phase === "actions") {
    // 1. Mist countdown
    if (mon.mistTurns && mon.mistTurns > 0) {
      mon.mistTurns -= 1;
      if (mon.mistTurns === 0) {
        logs.push(isKo ? `${name}을(를) 감싸던 흰안개가 걷혔다.` : `The mist surrounding ${name} faded.`);
      }
    }

    // 1-1. Light Screen countdown
    if (mon.lightScreenTurns && mon.lightScreenTurns > 0) {
      mon.lightScreenTurns -= 1;
      if (mon.lightScreenTurns === 0) {
        logs.push(isKo ? `${name}의 빛의장막이 걷혔다.` : `${name}'s Light Screen wore off.`);
      }
    }

    // 1-2. Reflect countdown
    if (mon.reflectTurns && mon.reflectTurns > 0) {
      mon.reflectTurns -= 1;
      if (mon.reflectTurns === 0) {
        logs.push(isKo ? `${name}의 리플렉터가 걷혔다.` : `${name}'s Reflect wore off.`);
      }
    }

    // 1-3. Safeguard countdown
    if (mon.safeguardTurns && mon.safeguardTurns > 0) {
      mon.safeguardTurns -= 1;
      if (mon.safeguardTurns === 0) {
        logs.push(isKo ? `${name} 팀의 신비의부적 효과가 사라졌다.` : `The Safeguard veil around ${name}'s team faded.`);
      }
    }

    // 1-4. Mind Reader countdown
    if (mon.mindReaderTurnsLeft && mon.mindReaderTurnsLeft > 0) {
      mon.mindReaderTurnsLeft -= 1;
      if (mon.mindReaderTurnsLeft === 0) {
        mon.mindReaderTargetId = null;
      }
    }

    // 1-5. Center of Attention (Follow Me) reset
    if (mon.isCenterOfAttention) {
      mon.isCenterOfAttention = false;
    }

    // 2. Disable countdown
    if (mon.disabledTurns && mon.disabledTurns > 0) {
      mon.disabledTurns -= 1;
      if (mon.disabledTurns === 0) {
        mon.disabledMove = null;
        logs.push(isKo ? `${name}의 기술을 묶던 사슬이 풀렸다!` : `${name} is no longer disabled!`);
      }
    }

    // 2-1. Encore countdown
    if (mon.encoreTurns && mon.encoreTurns > 0) {
      mon.encoreTurns -= 1;
      if (mon.encoreTurns === 0) {
        mon.encoreMove = null;
        logs.push(isKo ? `${name}의 앙코르 효과가 끝났다!` : `${name}'s encore ended!`);
      }
    }

    // 2-2. Taunt countdown
    if (mon.isTaunted && mon.tauntTurns && mon.tauntTurns > 0) {
      mon.tauntTurns -= 1;
      if (mon.tauntTurns === 0) {
        mon.isTaunted = false;
        logs.push(isKo ? `${name}의 도발 효과가 풀렸다!` : `${name}'s taunt wore off!`);
      }
    }

    // 2-3. Helping Hand & Magic Coat reset at turn end
    if (mon.isHelpingHandBoosted) {
      mon.isHelpingHandBoosted = false;
    }
    if (mon.isMagicCoat) {
      mon.isMagicCoat = false;
    }

    // 3. Future Sight (미래예지) countdown & strike (2턴 뒤 위력 120 에스퍼 특수 공격 발동)
    if (mon.futureSight && mon.hp > 0) {
      mon.futureSight.turnsLeft -= 1;
      if (mon.futureSight.turnsLeft <= 0) {
        const fsData = mon.futureSight;
        mon.futureSight = null;

        // 데미지 계산: 위력 120 에스퍼 특수 기술
        const spaStage = fsData.userSpaStage;
        const spaMultiplier = spaStage >= 0 ? (2 + spaStage) / 2 : 2 / (2 - spaStage);
        const effectiveSpa = Math.floor(fsData.userSpa * spaMultiplier);

        const spdStage = mon.stages?.spd || 0;
        const spdMultiplier = spdStage >= 0 ? (2 + spdStage) / 2 : 2 / (2 - spdStage);
        const effectiveSpd = Math.max(1, Math.floor((mon.spDef || 100) * spdMultiplier));

        const baseDmg = Math.floor((((2 * fsData.userLevel / 5 + 2) * 120 * effectiveSpa) / effectiveSpd) / 50) + 2;
        const stab = fsData.userTypes.some((t) => t.toLowerCase() === "psychic") ? 1.5 : 1.0;
        const typeMod = getTypeEffectiveness("psychic", mon.types || []);

        if (typeMod === 0) {
          logs.push(
            isKo
              ? `${name}(은)는 미래예지의 공격을 받았다!\n하지만 ${name}에게는 효과가 없는 것 같다...`
              : `${name} took the Future Sight attack!\nIt doesn't affect ${name}...`
          );
        } else {
          const finalDmg = Math.max(1, Math.floor(baseDmg * stab * typeMod));
          const prevHp = mon.hp;
          mon.hp = Math.max(0, mon.hp - finalDmg);

          let effectivenessLog = "";
          if (typeMod >= 2.0) {
            effectivenessLog = isKo ? "\n효과가 굉장했다!" : "\nIt's super effective!";
          } else if (typeMod < 1.0) {
            effectivenessLog = isKo ? "\n효과가 별로인 듯하다..." : "\nIt's not very effective...";
          }

          logs.push(
            isKo
              ? `${name}(은)는 미래예지의 공격을 받았다! (-${finalDmg})${effectivenessLog}`
              : `${name} took the Future Sight attack! (-${finalDmg})${effectivenessLog}`
          );

          if (battle) {
            const isPlayerVictim = (mon === battle.playerBattleMon || mon === battle.playerParty[battle.playerActiveIndex]);
            const playerMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];

            battle.lastMoveEffect = {
              moveKey: "future-sight-damage",
              moveName: isKo ? "미래예지" : "Future Sight",
              type: "psychic",
              isSpecial: true,
              isPlayerAttacking: fsData.isUserPlayer,
            };

            if (battle.turnActions) {
              battle.turnActions.push({
                actor: fsData.isUserPlayer ? "player" : "enemy",
                moveKey: "future-sight-damage",
                moveName: isKo ? "미래예지" : "Future Sight",
                type: "psychic",
                isSpecial: true,
                log: isKo
                  ? `${name}(은)는 미래예지의 공격을 받았다! (-${finalDmg})${effectivenessLog}`
                  : `${name} took the Future Sight attack! (-${finalDmg})${effectivenessLog}`,
                enemyHpBefore: !isPlayerVictim ? prevHp : battle.enemy.hp,
                enemyHpAfter: battle.enemy.hp,
                playerHpBefore: isPlayerVictim ? prevHp : (playerMon ? playerMon.hp : 0),
                playerHpAfter: playerMon ? playerMon.hp : 0,
                damage: finalDmg,
                isHit: true,
              });
            }
          }
        }
      }
    }

    // 4. Wish (희망사항) resolution (소원이 이루어짐)
    const isPlayerMon = battle ? (mon === battle.playerBattleMon || mon === battle.playerParty?.[battle.playerActiveIndex]) : true;
    const activeWish = battle
      ? (isPlayerMon ? battle.playerWishState : battle.enemyWishState) || mon.wishState
      : mon.wishState;

    if (activeWish && mon.hp > 0) {
      activeWish.turnsLeft -= 1;
      if (activeWish.turnsLeft <= 0) {
        const prevHp = mon.hp;
        const actualHeal = Math.min(mon.maxHp - mon.hp, activeWish.healAmount);
        mon.hp += actualHeal;
        const wishLog = isKo
          ? `${activeWish.userNameKo}의 소원이 이루어졌다! (+${actualHeal})`
          : `${activeWish.userName}'s wish came true! (+${actualHeal})`;
        logs.push(wishLog);
        if (battle) {
          if (isPlayerMon) battle.playerWishState = null;
          else battle.enemyWishState = null;

          if (actualHeal > 0 && battle.turnActions) {
            const playerMon = battle.playerBattleMon || battle.playerParty?.[battle.playerActiveIndex];
            battle.turnActions.push({
              actor: isPlayerMon ? "player" : "enemy",
              moveKey: "wish",
              moveName: isKo ? "희망사항" : "Wish",
              type: "normal",
              isSpecial: false,
              log: wishLog,
              enemyHpBefore: !isPlayerMon ? prevHp : battle.enemy.hp,
              enemyHpAfter: battle.enemy.hp,
              playerHpBefore: isPlayerMon ? prevHp : (playerMon ? playerMon.hp : 0),
              playerHpAfter: playerMon ? playerMon.hp : 0,
              damage: 0,
              isHit: true,
            });
          }
        }
        mon.wishState = null;
      }
    }

    // 5. Ingrain (뿌리박기) HP recovery (1/16 max HP)
    if (mon.isIngrained && mon.hp > 0) {
      const healAmount = Math.max(1, Math.floor(mon.maxHp / 16));
      const actualHeal = Math.min(mon.maxHp - mon.hp, healAmount);
      if (actualHeal > 0) {
        const prevHp = mon.hp;
        mon.hp += actualHeal;
        const ingrainLog = isKo
          ? `${name}(은)는 뿌리에서 양분을 흡수했다! (+${actualHeal})`
          : `${name} absorbed nutrients with its roots! (+${actualHeal})`;
        logs.push(ingrainLog);

        if (battle) {
          const isPlayerIngrain = (mon === battle.playerBattleMon || mon === battle.playerParty?.[battle.playerActiveIndex]);
          const playerMon = battle.playerBattleMon || battle.playerParty?.[battle.playerActiveIndex];

          battle.lastMoveEffect = {
            moveKey: "ingrain",
            moveName: isKo ? "뿌리박기" : "Ingrain",
            type: "grass",
            isSpecial: false,
            isPlayerAttacking: isPlayerIngrain,
          };

          if (battle.turnActions) {
            battle.turnActions.push({
              actor: isPlayerIngrain ? "player" : "enemy",
              moveKey: "ingrain",
              moveName: isKo ? "뿌리박기" : "Ingrain",
              type: "grass",
              isSpecial: false,
              log: ingrainLog,
              enemyHpBefore: !isPlayerIngrain ? prevHp : battle.enemy.hp,
              enemyHpAfter: battle.enemy.hp,
              playerHpBefore: isPlayerIngrain ? prevHp : (playerMon ? playerMon.hp : 0),
              playerHpAfter: playerMon ? playerMon.hp : 0,
              damage: 0,
              isHit: true,
            });
          }
        }
      }
    }

    // 6. Leech Seed drain (1/8)
    if (mon.isSeeded && mon.hp > 0 && battle) {
      const isPlayerVictim = (mon === battle.playerBattleMon || mon === battle.playerParty[battle.playerActiveIndex]);
      const leechTarget = isPlayerVictim ? battle.enemy : (battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex]);
      const prevVictimHp = mon.hp;
      const prevTargetHp = leechTarget.hp;
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

      battle.lastMoveEffect = {
        moveKey: "absorb",
        moveName: "Absorb",
        type: "grass",
        isSpecial: true,
        isPlayerAttacking: !isPlayerVictim,
      };

      if (battle.turnActions) {
        const playerMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];
        battle.turnActions.push({
          actor: !isPlayerVictim ? "player" : "enemy",
          moveKey: "absorb",
          moveName: "Absorb",
          type: "grass",
          isSpecial: true,
          log: isKo ? `씨뿌리기가 ${name}의 체력을 흡수했다!` : `Leech Seed absorbed HP from ${name}!`,
          enemyHpBefore: isPlayerVictim ? prevTargetHp : prevVictimHp,
          enemyHpAfter: battle.enemy.hp,
          playerHpBefore: isPlayerVictim ? prevVictimHp : prevTargetHp,
          playerHpAfter: playerMon.hp,
          damage: drainDmg,
          isHit: true,
        });
      }
    }

    // 7. Curse (저주) residual damage (1/4 max HP)
    if (mon.isCursed && mon.hp > 0) {
      const prevHp = mon.hp;
      const curseDmg = Math.max(1, Math.floor(mon.maxHp / 4));
      mon.hp = Math.max(0, mon.hp - curseDmg);
      logs.push(
        isKo
          ? `${name}(은)는 저주에 걸려 있다! (-${curseDmg})`
          : `${name} is afflicted by the curse! (-${curseDmg})`
      );

      if (battle) {
        const isPlayerVictim = (mon === battle.playerBattleMon || mon === battle.playerParty[battle.playerActiveIndex]);
        const playerMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];

        battle.lastMoveEffect = {
          moveKey: "curse-damage",
          moveName: "Curse",
          type: "ghost",
          isSpecial: false,
          isPlayerAttacking: !isPlayerVictim,
        };

        if (battle.turnActions) {
          battle.turnActions.push({
            actor: !isPlayerVictim ? "player" : "enemy",
            moveKey: "curse-damage",
            moveName: "Curse",
            type: "ghost",
            isSpecial: false,
            log: isKo
              ? `${name}(은)는 저주에 걸려 있다! (-${curseDmg})`
              : `${name} is afflicted by the curse! (-${curseDmg})`,
            enemyHpBefore: !isPlayerVictim ? prevHp : battle.enemy.hp,
            enemyHpAfter: battle.enemy.hp,
            playerHpBefore: isPlayerVictim ? prevHp : (playerMon ? playerMon.hp : 0),
            playerHpAfter: playerMon ? playerMon.hp : 0,
            damage: curseDmg,
            isHit: true,
          });
        }
      }
    }
  }

  // ==========================================================================
  // [Phase B: 날씨/상태이상/구속 잔여 데미지 (residualFrames) 및 턴 종료 특성]
  // ==========================================================================
  if ((phase === "all" || phase === "residuals") && mon.hp > 0) {
    // 1. Sandstorm residual damage
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

    // 1-1. Hail / Snow residual damage (1/16 max HP for non-Ice types, Ice Body recovery)
    if (weather === "snow" && mon.hp > 0) {
      const isIce = mon.types.some((t) => t.toLowerCase() === "ice");
      const abilityName = (mon.ability || "").toLowerCase().replace(/[\s_]+/g, "-");
      const passiveName = (mon.passiveAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
      const hasAbility = (a: string) => abilityName === a || passiveName === a;

      if (hasAbility("ice-body")) {
        const healAmount = Math.max(1, Math.floor(mon.maxHp / 16));
        const actualHeal = Math.min(mon.maxHp - mon.hp, healAmount);
        if (actualHeal > 0) {
          mon.hp += actualHeal;
          logs.push(isKo ? `아이스바디로 ${name}의 체력이 회복되었다! (+${actualHeal})` : `${name}'s Ice Body restored HP! (+${actualHeal})`);
        }
      } else {
        const isImmune = isIce ||
          hasAbility("magic-guard") ||
          hasAbility("overcoat") ||
          hasAbility("snow-cloak") ||
          hasAbility("slush-rush");

        if (!isImmune && mon.hp > 0) {
          const hailDmg = Math.max(1, Math.floor(mon.maxHp / 16));
          mon.hp = Math.max(0, mon.hp - hailDmg);
          logs.push(isKo ? `싸라기눈이 ${name}을(를) 덮쳤다! (-${hailDmg})` : `The hail buffeted ${name}! (-${hailDmg})`);
        }
      }
    }

    // 2. Burn residual damage (1/16)
    if (mon.status === "brn" && mon.hp > 0) {
      const burnDmg = Math.max(1, Math.floor(mon.maxHp / 16));
      mon.hp = Math.max(0, mon.hp - burnDmg);
      logs.push(isKo ? `${name}(은)는 화상으로 ${burnDmg} 데미지를 입었다!` : `${name} was hurt by its burn! (${burnDmg})`);
    }

    // 3. Poison / Badly Poisoned residual damage
    if (mon.status === "psn" && mon.hp > 0) {
      const psnDmg = Math.max(1, Math.floor(mon.maxHp / 8));
      mon.hp = Math.max(0, mon.hp - psnDmg);
      logs.push(isKo ? `${name}(은)는 독으로 ${psnDmg} 데미지를 입었다!` : `${name} was hurt by poison! (${psnDmg})`);
    } else if (mon.status === "tox" && mon.hp > 0) {
      const counter = mon.toxicCounter || 1;
      const toxDmg = Math.max(1, Math.floor((mon.maxHp * counter) / 16));
      mon.hp = Math.max(0, mon.hp - toxDmg);
      mon.toxicCounter = counter + 1;
      logs.push(isKo ? `${name}(은)는 맹독으로 ${toxDmg} 데미지를 입었다!` : `${name} was badly hurt by toxic! (${toxDmg})`);
    }

    // 4. Trapping Move residual damage (1/8)
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

    // 5. Nightmare (악몽) residual damage (1/4 max HP while asleep)
    if (mon.hasNightmare && mon.hp > 0) {
      if (mon.status === "slp") {
        const nightmareDmg = Math.max(1, Math.floor(mon.maxHp / 4));
        mon.hp = Math.max(0, mon.hp - nightmareDmg);
        logs.push(
          isKo
            ? `${name}(은)는 악몽에 시달리고 있다! (-${nightmareDmg})`
            : `${name} is locked in a nightmare! (-${nightmareDmg})`
        );
      } else {
        mon.hasNightmare = false;
      }
    }

    // 6. Perish Song (멸망의 노래) countdown & faint
    if (mon.perishCount && mon.perishCount > 0 && mon.hp > 0) {
      mon.perishCount -= 1;
      if (mon.perishCount > 0) {
        logs.push(
          isKo
            ? `${name}의 멸망의 노래 카운트가 ${mon.perishCount}(이)가 되었다!`
            : `${name}'s perish count fell to ${mon.perishCount}!`
        );
      } else {
        mon.hp = 0;
        mon.perishCount = 0;
        logs.push(
          isKo
            ? `${name}(은)는 멸망의 노래로 인해 기절했다!`
            : `${name} perished!`
        );
      }
    }

    // 7. Moody Ability
    if ((mon.ability === "Moody" || mon.passiveAbility === "Moody") && mon.hp > 0) {
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

    // 8. Speed Boost Ability
    if ((mon.ability === "Speed Boost" || mon.passiveAbility === "Speed Boost") && mon.hp > 0) {
      mon.stages.spe = Math.min(6, mon.stages.spe + 1);
      logs.push(isKo ? `\n[특성 가속!] ${name}의 스피드가 올라갔다! (+1)` : `\n[Speed Boost!] ${name}'s Speed rose! (+1)`);

      if (battle?.lastMoveEffect) {
        const isPlayerMon = mon === battle.playerBattleMon || mon === battle.playerParty[battle.playerActiveIndex];
        battle.lastMoveEffect.statChanges = battle.lastMoveEffect.statChanges || [];
        battle.lastMoveEffect.statChanges.push({ target: isPlayerMon ? "player" : "enemy", direction: "up" });
      }
    }

    // 9. Yawn (하품) 졸음 카운트다운 및 수면 발동 (다음 턴 종료 시 잠듦)
    if (mon.yawnTurns && mon.yawnTurns > 0 && mon.hp > 0) {
      mon.yawnTurns -= 1;
      if (mon.yawnTurns <= 0) {
        mon.yawnTurns = 0;
        const sleepImmuneAbilities = new Set([
          "insomnia", "불면",
          "vital-spirit", "vitalspirit", "의기양양",
          "comatose", "절대안깸",
          "sweet-veil", "sweetveil", "스위트베일",
          "purifying-salt", "purifyingsalt", "정화의소금",
        ]);
        const mAb = (mon.ability || "").toLowerCase().trim().replace(/[\s_]+/g, "-");
        const mPassAb = (mon.passiveAbility || "").toLowerCase().trim().replace(/[\s_]+/g, "-");
        const hasSafeguard = Boolean(mon.safeguardTurns && mon.safeguardTurns > 0);
        const isSleepImmune = sleepImmuneAbilities.has(mAb) || sleepImmuneAbilities.has(mPassAb);

        if (!mon.status && !hasSafeguard && !isSleepImmune) {
          mon.status = "slp";
          mon.sleepTurns = Math.floor(Math.random() * 3) + 2; // 2~4 turns
          logs.push(
            isKo
              ? `${name}(은)는 졸음을 이기지 못하고 잠들어 버렸다!`
              : `${name} fell asleep!`
          );
        }
      }
    }
  }
}
