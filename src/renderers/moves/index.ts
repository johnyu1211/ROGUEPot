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

import { drawFurySwipesEffect, drawBonemerangEffect, drawRestEffect, drawRestBehindEffect } from "./gen1/move153_156.js";
import { drawRockSlideEffect } from "./gen1/move157_160.js";
import { drawStruggleEffect, drawSketchEffect, drawTripleKickEffect, drawThiefEffect } from "./gen1/move165_168.js";
import { drawSpiderWebEffect, drawMindReaderEffect, drawNightmareEffect, drawNightmareBehindEffect } from "./gen1/move169_172.js";
import {
  drawSnoreEffect,
  drawCurseNormalEffect,
  drawCurseNormalBehindEffect,
  drawCurseGhostEffect,
  drawCurseGhostBehindEffect,
} from "./gen1/move173_176.js";
import { drawAeroblastEffect, drawAeroblastBehindEffect } from "./gen1/move177_180.js";
import { drawZapCannonEffect, drawZapCannonBehindEffect } from "./gen1/move189_192.js";
import { drawHeatWaveEffect, drawHeatWaveBehindEffect } from "./gen1/move257_260.js";
import {
  drawWillOWispEffect,
  drawWillOWispBehindEffect,
  drawMementoEffect,
  drawMementoBehindEffect,
  drawFacadeEffect,
  drawFacadeBehindEffect,
} from "./gen1/move261_264.js";
import {
  drawSmellingSaltsEffect,
  drawSmellingSaltsBehindEffect,
  drawFollowMeEffect,
  drawFollowMeBehindEffect,
  drawChargeEffect,
  drawChargeBehindEffect,
} from "./gen1/move265_268.js";
import {
  drawTauntEffect,
  drawTauntBehindEffect,
  drawHelpingHandEffect,
  drawHelpingHandBehindEffect,
  drawTrickEffect,
  drawTrickBehindEffect,
  drawRolePlayEffect,
  drawRolePlayBehindEffect,
} from "./gen1/move269_272.js";

import {
  drawWishEffect,
  drawWishBehindEffect,
  drawAssistEffect,
  drawAssistBehindEffect,
  drawIngrainEffect,
  drawIngrainBehindEffect,
  drawSuperpowerEffect,
  drawSuperpowerBehindEffect,
} from "./gen1/move273_276.js";

import {
  drawMagicCoatEffect,
  drawMagicCoatBehindEffect,
  drawRecycleEffect,
  drawRecycleBehindEffect,
  drawRevengeEffect,
  drawRevengeBehindEffect,
  drawBrickBreakEffect,
  drawBrickBreakBehindEffect,
} from "./gen1/move277_280.js";

import {
  drawYawnEffect,
  drawYawnBehindEffect,
  drawKnockOffEffect,
  drawKnockOffBehindEffect,
  drawEndeavorEffect,
  drawEndeavorBehindEffect,
  drawEruptionEffect,
  drawEruptionBehindEffect,
} from "./gen1/move281_284.js";

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
export * from "./gen1/move089_092.js";
export * from "./gen1/move093_096.js";
export * from "./gen1/move097_100.js";
export * from "./gen1/move101_104.js";
export * from "./gen1/move105_108.js";
export * from "./gen1/move109_112.js";
export * from "./gen1/move113_116.js";
export * from "./gen1/move117_120.js";
export * from "./gen1/move121_124.js";
export * from "./gen1/move125_128.js";
export * from "./gen1/move129_132.js";
export * from "./gen1/move133_136.js";
export * from "./gen1/move137_140.js";
export * from "./gen1/move141_144.js";
export * from "./gen1/move145_148.js";
export * from "./gen1/move149_152.js";
export * from "./gen1/move153_156.js";
export * from "./gen1/move157_160.js";
export * from "./gen1/move161_164.js";
export * from "./gen1/move165_168.js";
export * from "./gen1/move169_172.js";
export * from "./gen1/move173_176.js";
export * from "./gen1/move177_180.js";
export * from "./gen1/move181_184.js";
export * from "./gen1/move185_188.js";
export * from "./gen1/move189_192.js";
export * from "./gen1/move193_196.js";
export * from "./gen1/move197_200.js";
export * from "./gen1/move201_204.js";
export * from "./gen1/move205_208.js";
export * from "./gen1/move209_212.js";
export * from "./gen1/move213_216.js";
export * from "./gen1/move217_220.js";
export * from "./gen1/move221_224.js";
export * from "./gen1/move225_228.js";
export * from "./gen1/move229_232.js";
export * from "./gen1/move233_236.js";
export * from "./gen1/move237_240.js";
export * from "./gen1/move241_244.js";
export * from "./gen1/move245_248.js";
export * from "./gen1/move249_252.js";
export * from "./gen1/move253_256.js";
export * from "./gen1/move257_260.js";
export * from "./gen1/move261_264.js";
export * from "./gen1/move265_268.js";
export * from "./gen1/move269_272.js";
export * from "./gen1/move273_276.js";
export * from "./gen1/move277_280.js";
export * from "./gen1/move281_284.js";
export * from "./gen1/move521_524.js";

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
  if (isStatus && moveKey !== "swords-dance" && moveKey !== "swordsdance" && moveKey !== "whirlwind" && moveKey !== "spider-web" && moveKey !== "spiderweb" && moveKey !== "mind-reader" && moveKey !== "mindreader" && moveKey !== "stockpile") {
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
  } else if (moveKey === "zap-cannon" || moveKey === "zapcannon") {
    if (info.layer === "behind") {
      drawZapCannonBehindEffect(ctx, startPos, targetPos, info.step ?? 3);
    } else {
      drawZapCannonEffect(ctx, startPos, targetPos, info.step ?? 3);
    }
  } else if (moveKey === "thunderbolt" || moveKey === "thunder" || moveKey === "spark" || type === "electric") {
    drawElectricEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "flamethrower" || moveKey === "fire-blast" || moveKey === "ember" || type === "fire") {
    drawFireEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "water-gun" || moveKey === "hydro-pump" || moveKey === "surf" || moveKey === "bubble-beam" || type === "water") {
    drawWaterEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "ice-beam" || moveKey === "blizzard" || type === "ice") {
    drawIceEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "fury-swipes" || moveKey === "furyswipes") {
    drawFurySwipesEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "bonemerang" || moveKey === "bone-merang") {
    drawBonemerangEffect(ctx, startPos, targetPos, info.step ?? 1);
  } else if (moveKey === "rest") {
    drawRestEffect(ctx, startPos, targetPos, info.step ?? 1);
  } else if (moveKey === "rock-slide" || moveKey === "rockslide") {
    drawRockSlideEffect(ctx, startPos, targetPos, info.step ?? 1);
  } else if (moveKey === "slash" || moveKey === "night-slash" || moveKey === "dragon-claw" || moveKey === "shadow-claw") {
    drawSlashEffect(ctx, targetPos, type);
  } else if (moveKey === "struggle") {
    drawStruggleEffect(ctx, targetPos, info.step ?? 3);
  } else if (moveKey === "sketch") {
    drawSketchEffect(ctx, targetPos, info.step ?? 2);
  } else if (moveKey === "triple-kick" || moveKey === "triplekick") {
    drawTripleKickEffect(ctx, targetPos, info.step ?? 2);
  } else if (moveKey === "thief") {
    drawThiefEffect(ctx, targetPos, info.step ?? 3);
  } else if (moveKey === "spider-web" || moveKey === "spiderweb") {
    drawSpiderWebEffect(ctx, targetPos, info.step ?? 3);
  } else if (moveKey === "mind-reader" || moveKey === "mindreader") {
    drawMindReaderEffect(ctx, targetPos, info.step ?? 4);
  } else if (moveKey === "nightmare") {
    if (info.layer === "behind") {
      drawNightmareBehindEffect(ctx, targetPos, info.step ?? 3);
    } else {
      drawNightmareEffect(ctx, targetPos, info.step ?? 3);
    }
  } else if (moveKey === "curse-ghost") {
    if (info.layer === "behind") {
      drawCurseGhostBehindEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5 } as any, { attackerPos: startPos, targetPos, isPlayer: true } as any);
    } else {
      drawCurseGhostEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5 } as any, { attackerPos: startPos, targetPos, isPlayer: true } as any);
    }
  } else if (moveKey === "curse" || moveKey === "curse-normal") {
    if (info.layer === "behind") {
      drawCurseNormalBehindEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5 } as any, { attackerPos: startPos, targetPos, isPlayer: true } as any);
    } else {
      drawCurseNormalEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5 } as any, { attackerPos: startPos, targetPos, isPlayer: true } as any);
    }
  } else if (moveKey === "aeroblast") {
    drawAeroblastEffect(ctx, targetPos, info.step ?? 3);
  } else if (moveKey === "heat-wave" || moveKey === "heatwave") {
    if (info.layer === "behind") {
      drawHeatWaveBehindEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, heatWaveTime: 1.0, showBehindEffect: true, filterIntensity: 1.0 } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawHeatWaveEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, heatWaveTime: 1.0, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "will-o-wisp" || moveKey === "will_o_wisp" || moveKey === "261" || moveKey === "도깨비불") {
    if (info.layer === "behind") {
      drawWillOWispBehindEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawWillOWispEffect(ctx, { moveStep: info.step ?? 4, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "memento" || moveKey === "262" || moveKey === "추억의선물" || moveKey === "추억의 선물") {
    if (info.layer === "behind") {
      drawMementoBehindEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawMementoEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "smelling-salts" || moveKey === "smellingsalts" || moveKey === "265" || moveKey === "정신차리기") {
    if (info.layer === "behind") {
      drawSmellingSaltsBehindEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawSmellingSaltsEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "follow-me" || moveKey === "followme" || moveKey === "266" || moveKey === "날따름") {
    if (info.layer === "behind") {
      drawFollowMeBehindEffect(ctx, { moveStep: info.step ?? 1, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawFollowMeEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "charge" || moveKey === "268" || moveKey === "충전") {
    if (info.layer === "behind") {
      drawChargeBehindEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawChargeEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "taunt" || moveKey === "269" || moveKey === "도발") {
    if (info.layer === "behind") {
      drawTauntBehindEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawTauntEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "helping-hand" || moveKey === "helpinghand" || moveKey === "270" || moveKey === "도우미") {
    if (info.layer === "behind") {
      drawHelpingHandBehindEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawHelpingHandEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "trick" || moveKey === "271" || moveKey === "트릭") {
    if (info.layer === "behind") {
      drawTrickBehindEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawTrickEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "role-play" || moveKey === "roleplay" || moveKey === "272" || moveKey === "역할놀이") {
    if (info.layer === "behind") {
      drawRolePlayBehindEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawRolePlayEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "wish" || moveKey === "273" || moveKey === "희망사항") {
    if (info.layer === "behind") {
      drawWishBehindEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawWishEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "assist" || moveKey === "274" || moveKey === "조수") {
    if (info.layer === "behind") {
      drawAssistBehindEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawAssistEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "ingrain" || moveKey === "275" || moveKey === "뿌리박기") {
    if (info.layer === "behind") {
      drawIngrainBehindEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawIngrainEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "superpower" || moveKey === "276" || moveKey === "엄청난힘") {
    if (info.layer === "behind") {
      drawSuperpowerBehindEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawSuperpowerEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "magic-coat" || moveKey === "magiccoat" || moveKey === "277" || moveKey === "매직코트") {
    if (info.layer === "behind") {
      drawMagicCoatBehindEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawMagicCoatEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "recycle" || moveKey === "278" || moveKey === "리사이클") {
    if (info.layer === "behind") {
      drawRecycleBehindEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawRecycleEffect(ctx, { moveStep: info.step ?? 2, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "revenge" || moveKey === "279" || moveKey === "리벤지") {
    if (info.layer === "behind") {
      drawRevengeBehindEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawRevengeEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "brick-break" || moveKey === "brickbreak" || moveKey === "280" || moveKey === "깨뜨리다") {
    if (info.layer === "behind") {
      drawBrickBreakBehindEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawBrickBreakEffect(ctx, { moveStep: info.step ?? 3, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "yawn" || moveKey === "281" || moveKey === "하품") {
    if (info.layer === "behind") {
      drawYawnBehindEffect(ctx, { moveStep: info.step ?? 0.5, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawYawnEffect(ctx, { moveStep: info.step ?? 0.5, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "knock-off" || moveKey === "knockoff" || moveKey === "282" || moveKey === "탁쳐서떨구기") {
    if (info.layer === "behind") {
      drawKnockOffBehindEffect(ctx, { moveStep: info.step ?? 0.35, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawKnockOffEffect(ctx, { moveStep: info.step ?? 0.35, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "endeavor" || moveKey === "283" || moveKey === "죽기살기") {
    if (info.layer === "behind") {
      drawEndeavorBehindEffect(ctx, { moveStep: info.step ?? 0.6, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawEndeavorEffect(ctx, { moveStep: info.step ?? 0.6, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
  } else if (moveKey === "eruption" || moveKey === "284" || moveKey === "분화") {
    if (info.layer === "behind") {
      drawEruptionBehindEffect(ctx, { moveStep: info.step ?? 0.6, effectProgress: 0.5, showBehindEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    } else {
      drawEruptionEffect(ctx, { moveStep: info.step ?? 0.6, effectProgress: 0.5, showEffect: true } as any, { attackerPos: startPos, targetPos, isPlayer } as any);
    }
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