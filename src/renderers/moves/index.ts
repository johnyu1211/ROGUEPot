// ============================================================================
// ?좑툘 [湲곗닠 ?댄럺???쒖옉 吏移?- 256???붾젅??理쒖쟻??Octree Optimizer) 湲곗?]
// 1. 諛고? GIF ?뚮뜑?щ뒗 Octree Quantizer + useOptimizer (threshold: 85) 湲곕컲??//    256???붾젅???ъ궗???쒖???梨꾪깮?섍퀬 ?덉쓬.
// 2. ?좉퇋 湲곗닠 援ы쁽 ??遺덊븘?뷀븳 怨쇰룄??洹몃씪?붿뼵???쒖궗瑜?吏?묓븯怨? 256???붾젅???섍꼍?먯꽌
//    ?좊챸?섍쾶 ?뗫낫?대뒗 ?듭떖 怨좎콈???⑥깋/?ㅼ삩 ?됱긽 泥닿퀎 諛?30 FPS 洹쒓꺽??湲곗??쇰줈 ?쒖옉??寃?
// 3. 二쇱슂 ?곗텧 ?꾩긽 ?꾪솚(諛쒖궗 -> ?寃?-> ??컻 ?? ?쒖뿉??phaseId ?먮뒗 moveStep??//    紐낇솗??援щ텇 吏?뺥븯???붾젅???먮룞 由ъ뀑(isVisualStateShift)???꾨꼍???숈옉?섎룄濡?援ъ꽦??寃?
// 4. ?꾨젅?꾨퀎 ?대?吏 異붿텧 諛??쒓컖??寃利앹? ?좎?媛 ??酉곗뼱(http://localhost:3456)?먯꽌
//    吏곸젒 ?뺤씤?섎?濡? ?묒뾽 ???먯씠?꾪듃媛 留ㅻ쾲 ?꾨젅?꾩쓣 ?쇱씪??異붿텧/議고쉶?섏? 留?寃?
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
  drawHyperBeamEffect as drawGenericHyperBeamEffect,
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
export {
  drawSolarBeamEffect,
  drawDrainEffect,
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
export * from "./gen1/move057_060.js";
export * from "./gen1/move061_064.js";
export * from "./gen1/move065_068.js";
export * from "./gen1/move069_072.js";
export * from "./gen1/move073_076.js";
export * from "./gen1/move077_080.js";
export * from "./gen1/move081_084.js";
export * from "./gen1/move085_088.js";


/**
 * Central Dispatcher for rendering Pok챕mon move visual effects onto the battle canvas
 */
export function renderMoveEffect(
  ctx: any,
  info: MoveEffectInfo
) {
  const isPlayer = info.isPlayerAttacking;
  const moveKey = getMoveKey(info.moveKey || info.moveName);
  const type = (info.type || "normal").toLowerCase();

  const playerPos: MovePoint = { x: 175, y: 220 };
  const enemyPos: MovePoint = { x: 418, y: 152 };

  const startPos = isPlayer ? playerPos : enemyPos;
  const targetPos = isPlayer ? enemyPos : playerPos;

  const dx = targetPos.x - startPos.x;
  const dy = targetPos.y - startPos.y;
  const angle = Math.atan2(dy, dx);

  ctx.save();

  const moveData = MOVES_DATA[moveKey];
  const isStatus = moveData?.category === "status" || (info as any).category === "status";
  if (isStatus && moveKey !== "swords-dance" && moveKey !== "swordsdance" && moveKey !== "whirlwind") {
    ctx.restore();
    return;
  }

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
  } else if (moveKey === "solar-beam" || moveKey === "solar-blade") {
    drawSolarBeamEffect(ctx, startPos, targetPos, angle, dx, dy);
  } else if (moveKey === "mega-drain" || moveKey === "giga-drain" || moveKey === "absorb" || moveKey === "leech-life" || moveKey === "draining-kiss") {
    drawDrainEffect(ctx, startPos, targetPos, type);
  } else if (moveKey === "hyper-beam" || moveKey === "giga-impact") {
    drawGenericHyperBeamEffect(ctx, startPos, targetPos, angle, dx, dy);
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
    drawPhysicalImpactEffect(ctx, targetPos);
  }

  ctx.restore();
}