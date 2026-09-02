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
  const enemyPos: MovePoint = { x: 418, y: 135 };

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
    drawVineWhipEffect(ctx, startPos, targetPos, info.step ?? 1);
  } else if (moveKey === "stomp") {
    drawStompEffect(ctx, targetPos, info.step ?? 1);
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
