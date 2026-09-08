// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 85) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 신규 기술 구현 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 주요 연출 위상 전환(발사 -> 타격 -> 폭발 등) 시에는 phaseId 또는 moveStep을
//    명확히 구분 지정하여 팔레트 자동 리셋(isVisualStateShift)이 완벽히 동작하도록 구성할 것.
// 4. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { MoveEffectInfo, MovePoint } from "./types.js";
import {
  preloadMoveAssets,
  drawMiniRetroStar,
  drawStarburstImpact,
  drawStatBoostEffect,
  drawStatDropEffect,
} from "./common/helpers.js";
import {
  drawSolarBeamEffect,
  drawDrainEffect,
  drawHyperBeamEffect,
  drawElectricEffect,
  drawFireEffect,
  drawWaterEffect,
  drawIceEffect,
  drawSlashEffect,
  drawShadowBallEffect,
  drawGrassEffect,
  drawPsychicEffect,
  drawPoisonEffect,
  drawRockGroundEffect,
  drawFlyingEffect,
  drawGhostDarkEffect,
  drawDragonEffect,
  drawSteelEffect,
  drawFairyEffect,
  drawPhysicalImpactEffect,
} from "./common/genericTypeEffects.js";

import {
  drawPoundEffect,
  drawKarateChopEffect,
  drawDoubleSlapEffect,
  drawCometPunchEffect,
  drawFrontStraightPunchFistSvg,
} from "./gen1/move001_004.js";

import {
  drawMegaPunchEffect,
  drawPayDayEffect,
  drawFirePunchEffect,
  drawIcePunchEffect,
  drawKobanCoin,
  drawFlameTongue,
} from "./gen1/move005_008.js";

import {
  drawThunderPunchEffect,
  drawScratchEffect,
  drawViceGripEffect,
  drawGuillotineEffect,
  drawPincerClaw,
  drawSingleScissorBlade,
  drawWrithingLightningBolt,
} from "./gen1/move009_012.js";

import {
  drawRazorWindEffect,
  drawSwordsDanceEffect,
  drawCutEffect,
  drawGustEffect,
} from "./gen1/move013_016.js";

import {
  drawWingAttackEffect,
  drawWhirlwindEffect,
  drawFlyEffect,
  drawBindEffect,
} from "./gen1/move017_020.js";

import {
  drawSlamEffect,
  drawVineWhipEffect,
  drawStompEffect,
  drawDoubleKickEffect,
} from "./gen1/move021_024.js";

import { getMoveKey, MOVES_DATA } from "../../data/movesKo.js";

// Re-export everything for modules and backward compatibility
export * from "./types.js";
export * from "./common/helpers.js";
export * from "./common/genericTypeEffects.js";
export * from "./gen1/move001_004.js";
export * from "./gen1/move005_008.js";
export * from "./gen1/move009_012.js";
export * from "./gen1/move013_016.js";
export * from "./gen1/move017_020.js";
export * from "./gen1/move021_024.js";
export * from "./gen1/move025_028.js";
export * from "./gen1/move029_032.js";
export * from "./gen1/move033_036.js";
export * from "./gen1/move037_040.js";
export * from "./gen1/move041_044.js";
export * from "./gen1/move045_048.js";
export * from "./gen1/move049_052.js";
export * from "./gen1/move053_056.js";

/**
 * Central Dispatcher for rendering Pokémon move visual effects onto the battle canvas
 */
export function renderMoveEffect(
  ctx: any,
  info: MoveEffectInfo
) {
  const isPlayer = info.isPlayerAttacking;
  const moveKey = getMoveKey(info.moveKey || info.moveName);
  const type = (info.type || "normal").toLowerCase();

  // Attacker & Target Anchor Points (Logical 560x380 coordinates)
  const playerPos: MovePoint = { x: 175, y: 220 };
  const enemyPos: MovePoint = { x: 418, y: 152 };

  const startPos = isPlayer ? playerPos : enemyPos;
  const targetPos = isPlayer ? enemyPos : playerPos;

  const dx = targetPos.x - startPos.x;
  const dy = targetPos.y - startPos.y;
  const angle = Math.atan2(dy, dx);

  ctx.save();

  // Check if move is a Status / Non-damaging move (Never draw physical impact onto opponent!)
  const moveData = MOVES_DATA[moveKey];
  const isStatus = moveData?.category === "status" || (info as any).category === "status";
  if (isStatus && moveKey !== "swords-dance" && moveKey !== "swordsdance" && moveKey !== "whirlwind") {
    ctx.restore();
    return;
  }

  // 1. SPECIFIC SIGNATURE MOVES (Gen 1: Moves 001 ~ 024)
  if (moveKey === "pound") {
    drawPoundEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "karate-chop" || moveKey === "karatechop") {
    drawKarateChopEffect(ctx, targetPos, info.step ?? 4);
  } else if (moveKey === "double-slap" || moveKey === "doubleslap") {
    drawDoubleSlapEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "comet-punch" || moveKey === "cometpunch") {
    drawCometPunchEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "mega-punch" || moveKey === "megapunch") {
    drawMegaPunchEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "pay-day" || moveKey === "payday") {
    drawPayDayEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "fire-punch" || moveKey === "firepunch") {
    drawFirePunchEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "ice-punch" || moveKey === "icepunch") {
    drawIcePunchEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "thunder-punch" || moveKey === "thunderpunch") {
    drawThunderPunchEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "scratch") {
    drawScratchEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "vice-grip" || moveKey === "vicegrip") {
    drawViceGripEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "guillotine") {
    drawGuillotineEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "razor-wind" || moveKey === "razorwind") {
    drawRazorWindEffect(ctx, startPos, targetPos, info.step ?? 1);
  } else if (moveKey === "swords-dance" || moveKey === "swordsdance") {
    drawSwordsDanceEffect(ctx, startPos, info.step ?? 1);
  } else if (moveKey === "cut") {
    drawCutEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "gust") {
    drawGustEffect(ctx, startPos, targetPos, info.step ?? 1);
  } else if (moveKey === "wing-attack" || moveKey === "wingattack") {
    drawWingAttackEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "whirlwind") {
    drawWhirlwindEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "fly") {
    drawFlyEffect(ctx, startPos, targetPos, info.step ?? 1);
  } else if (moveKey === "bind") {
    drawBindEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "slam") {
    drawSlamEffect(ctx, startPos, targetPos, info.step ?? 1);
  } else if (moveKey === "vine-whip" || moveKey === "vinewhip") {
    drawVineWhipEffect(ctx, startPos, targetPos, info.step ?? 1, info.layer ?? "all");
  } else if (moveKey === "stomp") {
    drawStompEffect(ctx, targetPos, info.step ?? 1, info.layer ?? "all");
  } else if (moveKey === "double-kick" || moveKey === "doublekick") {
    drawDoubleKickEffect(ctx, startPos, targetPos, info.step ?? 1);
  }
  // 2. ICONIC SPECIAL & ELEMENTAL MOVES
  else if (moveKey === "solar-beam" || moveKey === "solar-blade") {
    drawSolarBeamEffect(ctx, startPos, targetPos, angle, dx, dy);
  } else if (moveKey === "mega-drain" || moveKey === "giga-drain" || moveKey === "absorb" || moveKey === "leech-life" || moveKey === "draining-kiss") {
    drawDrainEffect(ctx, startPos, targetPos, type);
  } else if (moveKey === "hyper-beam" || moveKey === "giga-impact") {
    drawHyperBeamEffect(ctx, startPos, targetPos, angle, dx, dy);
  } else if (moveKey === "shadow-ball" || moveKey === "dark-pulse") {
    drawShadowBallEffect(ctx, startPos, targetPos, angle);
  } else if (moveKey === "thunderbolt" || moveKey === "thunder" || moveKey === "spark" || type === "electric") {
    drawElectricEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "flamethrower" || moveKey === "fire-blast" || moveKey === "ember" || type === "fire") {
    drawFireEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "water-gun" || moveKey === "hydro-pump" || moveKey === "surf" || moveKey === "bubble-beam" || type === "water") {
    drawWaterEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "ice-beam" || moveKey === "blizzard" || type === "ice") {
    drawIceEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "slash" || moveKey === "fury-swipes" || moveKey === "night-slash" || moveKey === "dragon-claw" || moveKey === "shadow-claw") {
    drawSlashEffect(ctx, targetPos, type);
  } else if (type === "grass") {
    drawGrassEffect(ctx, startPos, targetPos);
  } else if (type === "psychic") {
    drawPsychicEffect(ctx, targetPos);
  } else if (type === "poison") {
    drawPoisonEffect(ctx, startPos, targetPos);
  } else if (type === "ground" || type === "rock") {
    drawRockGroundEffect(ctx, targetPos);
  } else if (type === "flying") {
    drawFlyingEffect(ctx, targetPos);
  } else if (type === "ghost" || type === "dark") {
    drawGhostDarkEffect(ctx, targetPos);
  } else if (type === "dragon") {
    drawDragonEffect(ctx, startPos, targetPos);
  } else if (type === "steel") {
    drawSteelEffect(ctx, targetPos);
  } else if (type === "fairy") {
    drawFairyEffect(ctx, targetPos);
  } else {
    // Default Physical Strike fallback
    drawPhysicalImpactEffect(ctx, targetPos);
  }

  ctx.restore();
}
