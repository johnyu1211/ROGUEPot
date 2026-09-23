import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { applyDamageBlinkFrames } from "../src/utils/damageBlink.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defsDir = path.resolve(__dirname, "../src/battle/moves/definitions");

async function checkAllMoves() {
  const files = fs.readdirSync(defsDir).filter(f => f.endsWith(".ts"));
  console.log(`Testing ${files.length} move definitions for HP glitches/bounces...`);

  let glitchCount = 0;

  for (const file of files) {
    try {
      const mod = await import(`../src/battle/moves/definitions/${file}`);
      const moveAnim = Object.values(mod).find(v => v && typeof v === "object" && typeof v.buildFrames === "function");
      if (!moveAnim) continue;

      // Test as Player attacking Enemy
      for (const isPlayer of [true, false]) {
        const initEnemyHp = 150;
        const initPlayerHp = 200;
        const damage = 35;
        const afterEnemyHp = isPlayer ? (initEnemyHp - damage) : initEnemyHp;
        const afterPlayerHp = isPlayer ? initPlayerHp : (initPlayerHp - damage);

        const action = {
          actor: isPlayer ? "player" : "enemy",
          moveKey: moveAnim.key || "test",
          moveName: moveAnim.nameKo || "테스트",
          type: moveAnim.type || "normal",
          damage,
          isHit: true,
          typeMod: 1.0,
          enemyHpBefore: initEnemyHp,
          playerHpBefore: initPlayerHp,
          enemyHpAfter: afterEnemyHp,
          playerHpAfter: afterPlayerHp,
          log: "테스트 기술 사용!",
        };

        const ctx = {
          action,
          isPlayer,
          isHit: true,
          isMiss: false,
          enemyHp: initEnemyHp,
          playerHp: initPlayerHp,
          textLineIdx: 1,
        };

        let rawFrames = moveAnim.buildFrames(ctx);
        let frames = applyDamageBlinkFrames([...rawFrames], action, isPlayer);

        // Check for HP bounces
        for (let i = 1; i < frames.length; i++) {
          const prev = frames[i - 1];
          const curr = frames[i];

          const pPrev = prev.playerHp !== undefined ? prev.playerHp : initPlayerHp;
          const pCurr = curr.playerHp !== undefined ? curr.playerHp : initPlayerHp;
          const ePrev = prev.enemyHp !== undefined ? prev.enemyHp : initEnemyHp;
          const eCurr = curr.enemyHp !== undefined ? curr.enemyHp : initEnemyHp;

          if (isPlayer) {
            // Target is Enemy: enemyHp should NEVER increase
            if (eCurr > ePrev) {
              console.log(`[GLITCH in ${file} (Player atk)] Frame #${i} (${curr.phaseId || i}): enemyHp jumped from ${ePrev} to ${eCurr}!`);
              glitchCount++;
            }
            // Player HP should not increase
            if (pCurr > pPrev) {
              console.log(`[GLITCH in ${file} (Player atk)] Frame #${i} (${curr.phaseId || i}): playerHp jumped from ${pPrev} to ${pCurr}!`);
              glitchCount++;
            }
          } else {
            // Target is Player: playerHp should NEVER increase
            if (pCurr > pPrev) {
              console.log(`[GLITCH in ${file} (Enemy atk)] Frame #${i} (${curr.phaseId || i}): playerHp jumped from ${pPrev} to ${pCurr}!`);
              glitchCount++;
            }
            // Enemy HP should not increase
            if (eCurr > ePrev) {
              console.log(`[GLITCH in ${file} (Enemy atk)] Frame #${i} (${curr.phaseId || i}): enemyHp jumped from ${ePrev} to ${eCurr}!`);
              glitchCount++;
            }
          }
        }
      }
    } catch (e) {
      // skip or report error
    }
  }

  console.log(`Testing complete. Total HP glitches found: ${glitchCount}`);
}

checkAllMoves();
