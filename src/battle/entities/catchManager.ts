import { BattleState } from "../engine/types.js";
import { saveService } from "../../services/saveService.js";

export interface CatchAttemptResult {
  success: boolean;
  battle: BattleState;
}

/**
 * Handles Poké Ball catch mechanics, ball item consumption, and capture rate rolls.
 */
export function attemptCatchPokemon(
  userId: string,
  slotId: number,
  ballType: string,
  battle: BattleState,
  lang: "ko" | "en" = "ko"
): CatchAttemptResult {
  const isKo = lang === "ko";
  const enemyMonName = isKo ? battle.enemy.nameKo : battle.enemy.name;

  const profile = saveService.getProfile(userId);
  const slot = profile.slots[slotId];
  const items = slot?.items || { "poke-ball": 5 };
  if (items["poke-ball"] === undefined && Object.keys(items).length === 0) {
    items["poke-ball"] = 5;
  }

  const currentCount = items[ballType] || 0;
  battle.lastMoveEffect = null;
  if (currentCount <= 0) {
    battle.phase = "MAIN";
    battle.dialogueText = isKo ? "몬스터볼이 부족합니다!" : "You don't have enough Poké Balls!";
    return { success: false, battle };
  }

  items[ballType] = currentCount - 1;
  if (items[ballType] <= 0) {
    delete items[ballType];
  }
  saveService.updateSlot(userId, slotId, { items });

  let ballMult = 1.0;
  if (ballType === "great-ball") ballMult = 1.5;
  else if (ballType === "ultra-ball") ballMult = 2.0;
  else if (ballType === "rogue-ball") ballMult = 3.0;
  else if (ballType === "master-ball") ballMult = 999.0;

  const hpRatio = battle.enemy.hp / battle.enemy.maxHp;
  const catchRate = Math.min(1.0, (1 - hpRatio * 0.6) * 0.45 * ballMult);
  const roll = Math.random();
  const isSuccess = roll < catchRate || ballType === "master-ball";

  if (isSuccess) {
    battle.phase = "VICTORY";
    battle.dialogueText = isKo
      ? `신난다! ${enemyMonName}(을)를 잡았다!`
      : `Gotcha! ${enemyMonName} was caught!`;

    if (battle.playerParty.length < 6) {
      battle.playerParty.push({
        speciesId: battle.enemy.speciesId,
        name: isKo ? (battle.enemy.nameKo || battle.enemy.name) : (battle.enemy.name || battle.enemy.nameKo),
        nameKo: battle.enemy.nameKo,
        nameEn: battle.enemy.name,
        level: battle.enemy.level,
        hp: battle.enemy.hp,
        maxHp: battle.enemy.maxHp,
        moves: battle.enemy.moves,
        isShiny: battle.enemy.isShiny,
        shinyTier: battle.enemy.shinyTier || (battle.enemy.isShiny ? 1 : 0),
      });
    }

    saveService.updateSlot(userId, slotId, {
      party: battle.playerParty,
      money: battle.money + 200,
      score: battle.score + 50,
      items,
    });

    return { success: true, battle };
  } else {
    battle.phase = "MAIN";
    battle.dialogueText = isKo
      ? `아까워라! ${enemyMonName}(이)가 볼에서 튀어나왔다!`
      : `Oh no! The Pokémon broke free!`;
    return { success: false, battle };
  }
}
