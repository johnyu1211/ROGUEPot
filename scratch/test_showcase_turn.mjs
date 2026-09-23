import { getOrCreateShowcaseSession, executeShowcaseTurn } from "../dist/battle/showcaseEngine.js";

async function testShowcaseTurn() {
  const session = getOrCreateShowcaseSession("test_user", true);
  console.log("Initial state:");
  console.log(`Player: ${session.battle.playerBattleMon.name} (hp=${session.battle.playerBattleMon.hp})`);
  console.log(`Enemy: ${session.battle.enemy.name} (hp=${session.battle.enemy.hp})`);

  const { turnCommentary } = await executeShowcaseTurn(session);
  console.log("\nTurn commentary:", turnCommentary);

  console.log("\nTurn Actions:", JSON.stringify(session.battle.turnActions?.map(a => ({
    actor: a.actor,
    moveKey: a.moveKey,
    damage: a.damage,
    eHpBefore: a.enemyHpBefore,
    pHpBefore: a.playerHpBefore,
    eHpAfter: a.enemyHpAfter,
    pHpAfter: a.playerHpAfter,
  })), null, 2));

  const { phases } = await (await import("../dist/utils/battleGifRenderer.js")).renderBattleMoveGif({
    battle: session.battle,
    lang: "ko",
    includeFramePreviews: true,
  });

  console.log(`\nPhases (${phases.length}):`);
  phases.forEach(p => {
    console.log(
      `Frame #${String(p.frameIndex).padStart(2)}: delay=${String(p.delay).padStart(4)}ms, phaseId=${(p.phaseId || "").padEnd(28)}, pHP=${String(p.playerHp).padStart(3)}, eHP=${String(p.enemyHp).padStart(3)}`
    );
  });
}

testShowcaseTurn();
