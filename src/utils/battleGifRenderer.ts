// @ts-ignore
import GIFEncoder from "gif-encoder-2";
import { createCanvas } from "@napi-rs/canvas";
import { BattleState, TurnActionInfo } from "../services/battleService.js";
import { renderMoveEffect, drawStatBoostEffect, drawStatDropEffect } from "./moveEffectRenderer.js";
import { POKEMON_SPECIES_DATA } from "../data/pokemonStats.js";
import { getMoveKey, getMoveData, MOVES_DATA } from "../data/movesKo.js";
import {
  BATTLE_LAYOUT_CONFIG,
  getArenaAssets,
  getPbInfoAssets,
  getPokemonSprite,
  drawPokeRogueBattleHud,
  drawFittedBattleSprite,
  getPokemonDisplayName,
  formatMoney,
  wrapDialogueText,
  drawPokemonSilhouetteShadow,
  drawPokemonShadow,
  BIOME_NAMES_KO,
} from "./canvasRenderer.js";
import { getMoveAnimation } from "../battle/moves/moveRegistry.js";
import { directBattleCamera } from "./battleCamera.js";

export interface BattleAnimationOptions {
  battle: BattleState;
  lang?: "ko" | "en";
  moveKey?: string;
  type?: string;
  isSpecial?: boolean;
  isPlayerAttacking?: boolean;
  dialogueLines?: string[];
}

export interface RenderGifResult {
  buffer: Buffer;
  motionDurationMs: number;
}

const edgeColorCache = new WeakMap<any, { top: string; bottom: string }>();

function getArenaEdgeColors(bg: any): { top: string; bottom: string } {
  if (!bg) return { top: "#38BDF8", bottom: "#2E5C2E" };
  if (edgeColorCache.has(bg)) return edgeColorCache.get(bg)!;

  try {
    const tempCanvas = createCanvas(bg.width || 560, bg.height || 380);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(bg, 0, 0);

    // Sample top edge pixel (middle of top line)
    const topData = tempCtx.getImageData(Math.floor((bg.width || 560) / 2), 2, 1, 1).data;
    const topHex = `rgb(${topData[0]}, ${topData[1]}, ${topData[2]})`;

    // Sample bottom edge pixel (middle of bottom line)
    const botData = tempCtx.getImageData(Math.floor((bg.width || 560) / 2), (bg.height || 380) - 2, 1, 1).data;
    const botHex = `rgb(${botData[0]}, ${botData[1]}, ${botData[2]})`;

    const colors = { top: topHex, bottom: botHex };
    edgeColorCache.set(bg, colors);
    return colors;
  } catch (e) {
    return { top: "#38BDF8", bottom: "#2E5C2E" };
  }
}

/**
 * 1. Standard Move Execution GIF:
 * Frame 0: Leading Static Buffer (1000ms) - Calm intro announcement
 * Frame 1: Lunge / Windup (No effect)
 * Frame 2: Single Move Effect Strike & Hit Flash (Effect ONCE!)
 * Frame 3: Recoil & Damage Settling + Stat Particles Start
 * Frame 4: Neutral Return + Stat Particles Climax
 * Frame 5: 11-Minute Static Hold Frame (Effect OFF, holds still)
 */
/**
 * Generates recoil and damage settling frames with sprite transparency flickering
 * based on type effectiveness:
 * - Not very effective (<= 0.5x) or Immune (0x): 0 blinks (steady hit)
 * - Normal hit (1.0x): 1 blink (transparent -> normal)
 * - Super Effective (2.0x): 3 blinks (strobe 3 times)
 * - Double Super Effective (>= 4.0x): 4 blinks (strobe 4 times)
 */
function createEffectivenessFlickerFrames(
  action: TurnActionInfo,
  isAttackerPlayer: boolean,
  isAct1: boolean,
  usePlayerFront: boolean = false,
  useEnemyBack: boolean = false
): any[] {
  if (!action) return [];

  // Skip flicker / recoil settling completely for 0-damage actions (charging moves, misses, immunities)
  const moveNameLower = (action.moveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
  const isCharging = ["fly", "dig", "dive", "bounce", "shadow-force", "phantom-force", "solar-beam", "solar-blade", "skull-bash", "meteor-beam", "sky-attack"].includes(moveNameLower) && (action.damage ?? 0) === 0;
  if (isCharging || (action.damage ?? 0) === 0) {
    return [];
  }

  const typeMod = action.typeMod !== undefined ? action.typeMod : (action.isSuperEffective ? 2.0 : 1.0);
  
  let blinkCount = 0; // Default: 0 blinks for normal hits (1.0x) and not very effective (<= 0.5x)
  if (typeMod >= 4.0) blinkCount = 4; // Double super effective (>= 4.0x) -> 4 blinks
  else if (typeMod >= 2.0) blinkCount = 3; // Super effective (2.0x) -> 3 blinks

  const isP = isAttackerPlayer;
  const textIdx = isAct1 ? 2 : 99;

  if (blinkCount === 0) {
    return [
      {
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        usePlayerFront: usePlayerFront,
        useEnemyBack: useEnemyBack,
        targetAlpha: 1.0,
        enemyHp: action.enemyHpAfter,
        playerHp: action.playerHpAfter,
        textLineIdx: textIdx,
        statProgress: undefined,
        isBlur: false,
        moveEffect: action,
      }
    ];
  }

  const durationPerHalf = blinkCount >= 4 ? 55 : (blinkCount === 3 ? 65 : 100);
  const frames: any[] = [];
  for (let i = 0; i < blinkCount; i++) {
    const isLast = (i === blinkCount - 1);
    // 1. Semi-transparent blink & subtle defender flinch
    frames.push({
      delay: durationPerHalf,
      pOffset: (usePlayerFront && isP) ? { x: 0, y: 0 } : (isP ? { x: 0, y: 0 } : { x: 4 - (i % 2) * 8, y: -2 }),
      eOffset: (useEnemyBack && !isP) ? { x: 0, y: 0 } : (!isP ? { x: 0, y: 0 } : { x: 4 - (i % 2) * 8, y: -2 }),
      showEffect: false,
      hitFlash: false,
      usePlayerFront: usePlayerFront,
      useEnemyBack: useEnemyBack,
      targetAlpha: 0.15,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: textIdx,
      statProgress: undefined,
      isBlur: false,
      moveEffect: action,
    });
    // 2. Visible normal half-blink
    frames.push({
      delay: isLast ? durationPerHalf + 80 : durationPerHalf,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: usePlayerFront,
      useEnemyBack: useEnemyBack,
      targetAlpha: 1.0,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: textIdx,
      statProgress: undefined,
      isBlur: false,
      moveEffect: action,
    });
  }

  return frames;
}

/**
 * Creates dedicated 3-step post-move stat change animation frames.
 * Plays AFTER the move attack finishes, emitting rising/falling particles while dialogue states the stat change.
 */
function createStatChangeFrames(
  action: TurnActionInfo,
  isAttackerPlayer: boolean,
  dialogueTextIdx: number = 1,
  usePlayerFront: boolean = false,
  useEnemyBack: boolean = false
): any[] {
  if (!action.statChanges || action.statChanges.length === 0) {
    return [];
  }

  const isP = isAttackerPlayer;
  return [
    // Step 1: Wave 1 soaring up from ground (150ms)
    {
      delay: 150,
      pOffset: (usePlayerFront && isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      eOffset: (useEnemyBack && !isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      targetAlpha: 1.0,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: 0.18,
      isBlur: false,
      moveEffect: action,
    },
    // Step 2: Wave 1 fading, Wave 2 soaring up from ground (150ms)
    {
      delay: 150,
      pOffset: (usePlayerFront && isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      eOffset: (useEnemyBack && !isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      targetAlpha: 1.0,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: 0.45,
      isBlur: false,
      moveEffect: action,
    },
    // Step 3: Wave 2 fading, Wave 3 soaring up from ground (160ms)
    {
      delay: 160,
      pOffset: (usePlayerFront && isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      eOffset: (useEnemyBack && !isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      targetAlpha: 1.0,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: 0.72,
      isBlur: false,
      moveEffect: action,
    },
    // Step 4: Wave 3 reaching apex and cleanly dissolving (180ms)
    {
      delay: 180,
      pOffset: (usePlayerFront && isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      eOffset: (useEnemyBack && !isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      targetAlpha: 1.0,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: 0.95,
      isBlur: false,
      moveEffect: action,
    },
  ];
}

/**
 * Creates a smooth 4-step sinking faint animation when a Pokémon reaches 0 HP
 */
function createFaintingFrames(
  action: TurnActionInfo,
  isTargetPlayer: boolean,
  dialogueTextIdx: number = 99,
  usePlayerFront: boolean = false,
  useEnemyBack: boolean = false
): any[] {
  const isEnemy = !isTargetPlayer;

  return [
    // Step 1: Initial stumble and start sinking (140ms)
    {
      delay: 140,
      pOffset: isTargetPlayer ? { x: 0, y: 18 } : { x: 0, y: 0 },
      eOffset: isEnemy ? { x: 0, y: 18 } : { x: 0, y: 0 },
      pAlpha: isTargetPlayer ? 0.85 : 1.0,
      eAlpha: isEnemy ? 0.85 : 1.0,
      showEffect: false,
      hitFlash: false,
      usePlayerFront: usePlayerFront,
      useEnemyBack: useEnemyBack,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: undefined,
      isBlur: false,
      moveEffect: action,
    },
    // Step 2: Sinking deeper into the platform (140ms)
    {
      delay: 140,
      pOffset: isTargetPlayer ? { x: 0, y: 46 } : { x: 0, y: 0 },
      eOffset: isEnemy ? { x: 0, y: 46 } : { x: 0, y: 0 },
      pAlpha: isTargetPlayer ? 0.55 : 1.0,
      eAlpha: isEnemy ? 0.55 : 1.0,
      showEffect: false,
      hitFlash: false,
      usePlayerFront: usePlayerFront,
      useEnemyBack: useEnemyBack,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: undefined,
      isBlur: false,
      moveEffect: action,
    },
    // Step 3: Submerged / nearly gone (140ms)
    {
      delay: 140,
      pOffset: isTargetPlayer ? { x: 0, y: 80 } : { x: 0, y: 0 },
      eOffset: isEnemy ? { x: 0, y: 80 } : { x: 0, y: 0 },
      pAlpha: isTargetPlayer ? 0.20 : 1.0,
      eAlpha: isEnemy ? 0.20 : 1.0,
      showEffect: false,
      hitFlash: false,
      usePlayerFront: usePlayerFront,
      useEnemyBack: useEnemyBack,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: undefined,
      isBlur: false,
      moveEffect: action,
    },
    // Step 4: Fully fainted / platform empty (350ms)
    {
      delay: 350,
      pOffset: isTargetPlayer ? { x: 0, y: -9999 } : { x: 0, y: 0 },
      eOffset: isEnemy ? { x: 0, y: -9999 } : { x: 0, y: 0 },
      pAlpha: isTargetPlayer ? 0.0 : 1.0,
      eAlpha: isEnemy ? 0.0 : 1.0,
      hidePlayer: isTargetPlayer,
      hideEnemy: isEnemy,
      showEffect: false,
      hitFlash: false,
      usePlayerFront: usePlayerFront,
      useEnemyBack: useEnemyBack,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: undefined,
      isBlur: false,
      moveEffect: action,
    }
  ];
}

function isEvasionLaunch(action?: TurnActionInfo | null): boolean {
  if (!action) return false;
  const k = (action.moveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
  if (!["fly", "dig", "dive", "bounce", "shadow-force", "phantom-force"].includes(k)) return false;
  return (action.damage ?? 0) === 0 && (
    action.log?.includes("날아올랐다") || action.log?.includes("flew up") ||
    action.log?.includes("파고들었다") || action.log?.includes("burrowed") ||
    action.log?.includes("잠수했다") || action.log?.includes("underwater") ||
    action.log?.includes("모습을 감췄다") || action.log?.includes("vanished") ||
    action.log?.includes("튀어올랐다") || action.log?.includes("bounced")
  );
}

function isEvasionStrike(action?: TurnActionInfo | null): boolean {
  if (!action) return false;
  const k = (action.moveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
  if (!["fly", "dig", "dive", "bounce", "shadow-force", "phantom-force"].includes(k)) return false;
  return !isEvasionLaunch(action);
}

function createAirGlideDescentFrames(
  eff: any,
  isAttackerPlayer: boolean,
  textLineIdx: number = 1
): any[] {
  const isP = isAttackerPlayer;
  return [
    // 1. High Sky Glide (66ms) - Pokémon gliding smoothly across the high azure sky
    {
      delay: 66,
      diveStep: 1,
      skyCameraTilt: 0.0,
      pOffset: { x: 0, y: -10 },
      eOffset: { x: 0, y: -10 },
      pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
      eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
      pRot: 0,
      eRot: 0,
      isHighSkyCutscene: true,
      isAttackerPlayer: isP,
      showEffect: false,
      hitFlash: false,
      enemyHp: eff.enemyHpAfter,
      playerHp: eff.playerHpAfter,
      textLineIdx,
      isBlur: false,
      moveEffect: eff,
    },
    // 2. Diagonal Swoop Bank (66ms) - Smooth banking transition towards the battlefield
    {
      delay: 66,
      diveStep: 2,
      skyCameraTilt: isP ? 0.35 : -0.35,
      pOffset: { x: 0, y: 15 },
      eOffset: { x: 0, y: 15 },
      pScale: isP ? { x: 0.95, y: 1.10 } : undefined,
      eScale: !isP ? { x: 0.95, y: 1.10 } : undefined,
      pRot: isP ? 0.20 : -0.20,
      eRot: !isP ? 0.20 : -0.20,
      isHighSkyCutscene: true,
      isAttackerPlayer: isP,
      showEffect: false,
      hitFlash: false,
      enemyHp: eff.enemyHpAfter,
      playerHp: eff.playerHpAfter,
      textLineIdx,
      isBlur: false,
      moveEffect: eff,
    },
    // 3. Smooth Air Swoop onto Battlefield Platform (66ms) - Swooping in gracefully before move start
    {
      delay: 66,
      pOffset: isP ? { x: 0, y: -35 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: 0, y: -35 } : { x: 0, y: 0 },
      pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
      eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
      pRot: 0,
      eRot: 0,
      isHighSkyCutscene: false,
      isAttackerPlayer: isP,
      showEffect: false,
      hitFlash: false,
      enemyHp: eff.enemyHpAfter,
      playerHp: eff.playerHpAfter,
      textLineIdx,
      isBlur: false,
      moveEffect: eff,
    },
  ];
}

function drawHighSkyCutscene(
  ctx: any,
  width: number,
  height: number,
  f: any,
  attackerSprite: any
) {
  ctx.save();

  // Camera Tilt Angle (0 = level straight flight, -0.30 to -0.78 = diagonal bank)
  const cameraTilt = f.skyCameraTilt || 0;
  const isDiagonalBank = Math.abs(cameraTilt) > 0.05;

  // Apply Camera Tilt Transform centered at canvas center
  ctx.translate(width / 2, height / 2);
  if (cameraTilt) {
    ctx.rotate(cameraTilt);
  }

  // Large bounding size to cover entire screen seamlessly when rotated
  const bgSize = Math.max(width, height) * 1.8;

  // 1. Clear Atmospheric Sky Gradient (Distinct Top Space Navy vs Bottom Horizon Cyan)
  const skyGrad = ctx.createLinearGradient(0, -bgSize / 2, 0, bgSize / 2);
  skyGrad.addColorStop(0, "#080E1E");    // Top: Deep Stratosphere (Space Navy)
  skyGrad.addColorStop(0.35, "#0369A1"); // Mid-Upper: High Azure Sky
  skyGrad.addColorStop(0.65, "#38BDF8"); // Horizon: Light Atmosphere Blue
  skyGrad.addColorStop(0.85, "#BAE6FD"); // Lower Atmosphere: Bright Cyan
  skyGrad.addColorStop(1, "#E0F2FE");    // Bottom: Horizon Atmosphere Glow

  ctx.fillStyle = skyGrad;
  ctx.fillRect(-bgSize / 2, -bgSize / 2, bgSize, bgSize);

  // 2. Dynamic Speedlines (Streaming horizontally relative to flight direction)
  const stepSeed = (f.diveStep || 0) * 53;
  const numLines = isDiagonalBank ? 32 : 22;
  for (let i = 0; i < numLines; i++) {
    const lx = ((i * 39 + stepSeed * 9) % bgSize) - bgSize / 2;
    const ly = ((i * 43 + stepSeed * 4) % (bgSize * 0.65)) - bgSize * 0.32;
    const len = 80 + (i % 4) * 40;

    ctx.save();
    ctx.strokeStyle = (i % 2 === 0) ? "rgba(255, 255, 255, 0.85)" : "rgba(186, 230, 253, 0.55)";
    ctx.lineWidth = (i % 3 === 0) ? 2.5 : 1.3;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx - len, ly);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Gliding / Banking Pokémon Sprite
  if (attackerSprite) {
    ctx.save();
    const isP = f.isAttackerPlayer !== false;
    let ox = f.skyOffset?.x ?? (isP ? f.pOffset?.x : f.eOffset?.x) ?? 0;
    let oy = f.skyOffset?.y ?? (isP ? f.pOffset?.y : f.eOffset?.y) ?? 0;
    if (Math.abs(oy) > 400) oy = 0; // Guard against -9999 evasion offset
    if (Math.abs(ox) > 400) ox = 0;

    const scale = isP ? f.pScale : f.eScale;
    const rot = (isP ? f.pRot : f.eRot) || 0;

    ctx.translate(ox, oy);
    if (rot) ctx.rotate(rot);

    if (scale) ctx.scale(scale.x, scale.y);
    drawFittedBattleSprite(ctx, attackerSprite, 0, 65, 130);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 5th Generation (Black/White) style smooth continuous camera tracking
 * Automatically detects attack action phases and establishes a rock-solid
 * trapezoidal camera envelope: zooms in once smoothly upon lunge, stays locked at peak 1.38x
 * across all multi-hits and effectiveness blinks without ANY oscillation ("확축확축" 방지),
 * and glides smoothly back out when the turn ends.
 */
export async function renderBattleMoveGif(options: BattleAnimationOptions): Promise<RenderGifResult> {
  const width = 560;
  const height = 380;
  const isKo = options.lang === "ko";
  const battle = options.battle;
  const enemy = battle.enemy;
  const playerMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];

  const moveKey = options.moveKey || battle.lastMoveEffect?.moveKey || "tackle";
  const type = options.type || battle.lastMoveEffect?.type || "normal";
  const isSpecial = options.isSpecial !== undefined ? options.isSpecial : (battle.lastMoveEffect?.isSpecial ?? false);
  const isPlayer = options.isPlayerAttacking !== undefined ? options.isPlayerAttacking : (battle.lastMoveEffect?.isPlayerAttacking ?? true);

  const dialogueLines = options.dialogueLines || (battle.dialogueText || "").replace(/\\n/g, "\n").split("\n");

  const enemyActiveSpecies = battle.debugEnemySpecies || ((enemy as any).isTransformed ? ((enemy as any).transformedSpeciesId || enemy.speciesId) : enemy.speciesId);
  const playerActiveSpecies = battle.debugPlayerSpecies || ((playerMon as any).isTransformed
    ? ((playerMon as any).transformedSpeciesId || playerMon.speciesId)
    : ((playerMon as any).hasIllusion && (playerMon as any).illusionTarget ? (playerMon as any).illusionTarget.speciesId : playerMon.speciesId));

  const enemyShinyTier = (enemy as any).shinyTier !== undefined ? (enemy as any).shinyTier : (enemy.isShiny ? 1 : 0);
  const playerShinyTier = ((playerMon as any).hasIllusion && (playerMon as any).illusionTarget)
    ? ((playerMon as any).illusionTarget.shinyTier !== undefined ? (playerMon as any).illusionTarget.shinyTier : ((playerMon as any).illusionTarget.isShiny ? 1 : 0))
    : ((playerMon as any).shinyTier !== undefined ? (playerMon as any).shinyTier : ((playerMon as any).isShiny ? 1 : 0));

  const [arena, pbAssets, enemySprite, playerSprite, playerFrontSprite, enemyBackSprite] = await Promise.all([
    getArenaAssets(battle.biome || "Town"),
    getPbInfoAssets(),
    getPokemonSprite(enemyActiveSpecies, true, enemyShinyTier, false),
    getPokemonSprite(playerActiveSpecies, true, playerShinyTier, true),
    getPokemonSprite(playerActiveSpecies, true, playerShinyTier, false),
    getPokemonSprite(enemyActiveSpecies, true, enemyShinyTier, true),
  ]);

  const encoder = new GIFEncoder(width, height, "octree", true);
  encoder.setRepeat(-1);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const enemyHp = enemy.hp;
  const playerHp = playerMon.hp;

  const turnActions = battle.turnActions || [];
  const hasMultipleActions = turnActions.length >= 2;

  const a1 = turnActions[0] || {
    actor: isPlayer ? "player" : "enemy",
    moveKey,
    moveNameKo: moveKey,
    moveNameEn: moveKey,
    type,
    isSpecial,
    isPlayerAttacking: isPlayer,
    enemyHpAfter: enemyHp,
    playerHpAfter: playerHp,
    statChanges: battle.lastMoveEffect?.statChanges,
    hitCount: (battle.lastMoveEffect as any)?.hitCount,
  };
  const isP1 = a1.actor === "player";
  const mKey1 = getMoveKey(a1.moveKey || a1.moveName);
  const isChop1 = (mKey1 === "karate-chop" || mKey1 === "karatechop");
  const isSlap1 = (mKey1 === "double-slap" || mKey1 === "doubleslap");
  const isPunch1 = (mKey1 === "comet-punch" || mKey1 === "cometpunch");
  const isMegaPunch1 = (mKey1 === "mega-punch" || mKey1 === "megapunch");
  const isPayDay1 = (mKey1 === "pay-day" || mKey1 === "payday");
  const isFirePunch1 = (mKey1 === "fire-punch" || mKey1 === "firepunch");
  const isIcePunch1 = (mKey1 === "ice-punch" || mKey1 === "icepunch");
  const isGuillotine1 = (mKey1 === "guillotine");
  const isSwordsDance1 = (mKey1 === "swords-dance" || mKey1 === "swordsdance");
  const isFly1 = (mKey1 === "fly");
  const isRazorWind1 = (mKey1 === "razor-wind" || mKey1 === "razorwind");
  const isWingAttack1 = (mKey1 === "wing-attack" || mKey1 === "wingattack");
  const isWhirlwind1 = (mKey1 === "whirlwind");
  const isBind1 = (mKey1 === "bind" || mKey1 === "wrap" || mKey1 === "clamp" || mKey1 === "sand-tomb" || mKey1 === "whirlpool" || mKey1 === "fire-spin" || mKey1 === "infestation" || mKey1 === "snap-trap");
  const isSlam1 = (mKey1 === "slam");
  const isVineWhip1 = (mKey1 === "vine-whip" || mKey1 === "vinewhip");
  const isStomp1 = (mKey1 === "stomp");
  const isDoubleKick1 = (mKey1 === "double-kick" || mKey1 === "doublekick");
  const isSingleStrikeSpecial1 = (
    mKey1 === "thunder-punch" || mKey1 === "thunderpunch" ||
    mKey1 === "scratch" ||
    mKey1 === "vice-grip" || mKey1 === "vicegrip" ||
    mKey1 === "cut" ||
    mKey1 === "gust"
  );

  const moveData1 = getMoveData(mKey1);
  const isCharging1 = isEvasionLaunch(a1);
  const isEvasionHit1 = isEvasionStrike(a1);
  const isStatusMove1 = (moveData1?.category === "status" || (a1 as any).category === "status" || ((a1.damage ?? 0) === 0 && !isCharging1 && !isEvasionHit1)) && !isSwordsDance1 && !isWhirlwind1;

  const isHit1 = a1.isHit !== undefined ? a1.isHit : ((a1.damage ?? 0) > 0 || (!a1.log?.includes("빗나갔다") && !a1.log?.includes("missed") && !a1.log?.includes("빗나가")));
  const isMiss1 = !isHit1;

  const moveAnim1 = getMoveAnimation(mKey1, isStatusMove1);
  let act1Frames: any[] = moveAnim1.buildFrames({
    action: a1,
    isPlayer: isP1,
    isHit: isHit1,
    isMiss: isMiss1,
    enemyHp: enemy.hp,
    playerHp: playerMon.hp,
    textLineIdx: 1,
    usePlayerFront: false,
    useEnemyBack: false,
  });

  const a1MoveKey = (a1.moveKey || moveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
    if (a1.wasDescentFromAir && a1MoveKey !== "fly") {
      act1Frames = [
        ...createAirGlideDescentFrames(a1, isP1, 1),
        ...act1Frames
      ];
    }

  let framesConfig: any[] = [];

  if (hasMultipleActions) {
    const a2 = turnActions[1];
    const isP2 = a2.actor === "player";
    const mKey2 = getMoveKey(a2.moveKey || a2.moveName);
    const isChop2 = (mKey2 === "karate-chop" || mKey2 === "karatechop");
    const isSlap2 = (mKey2 === "double-slap" || mKey2 === "doubleslap");
    const isPunch2 = (mKey2 === "comet-punch" || mKey2 === "cometpunch");
    const isMegaPunch2 = (mKey2 === "mega-punch" || mKey2 === "megapunch");
    const isPayDay2 = (mKey2 === "pay-day" || mKey2 === "payday");
    const isFirePunch2 = (mKey2 === "fire-punch" || mKey2 === "firepunch");
    const isIcePunch2 = (mKey2 === "ice-punch" || mKey2 === "icepunch");
    const isGuillotine2 = (mKey2 === "guillotine");
    const isSwordsDance2 = (mKey2 === "swords-dance" || mKey2 === "swordsdance");
    const isFly2 = (mKey2 === "fly");
    const isRazorWind2 = (mKey2 === "razor-wind" || mKey2 === "razorwind");
    const isWingAttack2 = (mKey2 === "wing-attack" || mKey2 === "wingattack");
    const isWhirlwind2 = (mKey2 === "whirlwind");
    const isBind2 = (mKey2 === "bind" || mKey2 === "wrap" || mKey2 === "clamp" || mKey2 === "sand-tomb" || mKey2 === "whirlpool" || mKey2 === "fire-spin" || mKey2 === "infestation" || mKey2 === "snap-trap");
    const isSlam2 = (mKey2 === "slam");
    const isVineWhip2 = (mKey2 === "vine-whip" || mKey2 === "vinewhip");
    const isStomp2 = (mKey2 === "stomp");
    const isDoubleKick2 = (mKey2 === "double-kick" || mKey2 === "doublekick");
    const isSingleStrikeSpecial2 = (
      mKey2 === "thunder-punch" || mKey2 === "thunderpunch" ||
      mKey2 === "scratch" ||
      mKey2 === "vice-grip" || mKey2 === "vicegrip" ||
      mKey2 === "cut" ||
      mKey2 === "gust"
    );

    const moveData2 = getMoveData(mKey2);
    const isCharging2 = isEvasionLaunch(a2);
    const isEvasionHit2 = isEvasionStrike(a2);
    const isStatusMove2 = (moveData2?.category === "status" || (a2 as any).category === "status" || ((a2.damage ?? 0) === 0 && !isCharging2 && !isEvasionHit2)) && !isSwordsDance2 && !isWhirlwind2;

    const isHit2 = a2.isHit !== undefined ? a2.isHit : ((a2.damage ?? 0) > 0 || (!a2.log?.includes("빗나갔다") && !a2.log?.includes("missed") && !a2.log?.includes("빗나가")));
    const isMiss2 = !isHit2;

    const moveAnim2 = getMoveAnimation(mKey2, isStatusMove2);
    let act2Frames: any[] = moveAnim2.buildFrames({
      action: a2,
      isPlayer: isP2,
      isHit: isHit2,
      isMiss: isMiss2,
      enemyHp: a1.enemyHpAfter,
      playerHp: a1.playerHpAfter,
      textLineIdx: 3,
      usePlayerFront: false,
      useEnemyBack: false,
    });

    const a2MoveKey = (a2.moveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
    if (a2.wasDescentFromAir && a2MoveKey !== "fly") {
      act2Frames = [
        ...createAirGlideDescentFrames(a2, isP2, 3),
        ...act2Frames
      ];
    }

    const a1Fainted = a1.enemyHpAfter <= 0 || a1.playerHpAfter <= 0;
    const a2Fainted = a2 && (a2.enemyHpAfter <= 0 || a2.playerHpAfter <= 0);

    // Turn-around victory pose ONLY persists if the Guillotine attack actually scored a lethal KO!
    const isP1GuillotineKill = isP1 && isGuillotine1 && (a1.enemyHpAfter <= 0);
    const isP2GuillotineKill = isP2 && isGuillotine2 && (a2 ? a2.enemyHpAfter <= 0 : false);
    const isE1GuillotineKill = !isP1 && isGuillotine1 && (a1.playerHpAfter <= 0);
    const isE2GuillotineKill = !isP2 && isGuillotine2 && (a2 ? a2.playerHpAfter <= 0 : false);

    const playerFrontHold = isP1GuillotineKill || isP2GuillotineKill;
    const enemyBackHold = isE1GuillotineKill || isE2GuillotineKill;

    const finalEnemyHp = Math.min(enemy.hp, a2 ? a2.enemyHpAfter : a1.enemyHpAfter);
    const finalPlayerHp = Math.min(playerMon.hp, a2 ? a2.playerHpAfter : a1.playerHpAfter);

    const isWhirlwindHit1 = isWhirlwind1 && (a1.isHit !== false && !a1.log?.includes("통하지 않았다") && !a1.log?.includes("실패했다"));
    const isWhirlwindHit2 = isWhirlwind2 && (a2 ? (a2.isHit !== false && !a2.log?.includes("통하지 않았다") && !a2.log?.includes("실패했다")) : false);
    const hasWhirlwindSuccess = isWhirlwindHit1 || isWhirlwindHit2;

    const isEnemyFainted = (finalEnemyHp <= 0 || (enemy.hp <= 0 && !hasWhirlwindSuccess) || (battle.phase === "VICTORY" && !hasWhirlwindSuccess));
    const isPlayerFainted = (finalPlayerHp <= 0 || (playerMon.hp <= 0 && !hasWhirlwindSuccess) || (battle.phase === "DEFEAT" && !hasWhirlwindSuccess));
    const isAnyFainted = a1Fainted || a2Fainted || isEnemyFainted || isPlayerFainted;

    const faintAction = a2 || a1;
    const faintFrames = (isEnemyFainted || isPlayerFainted)
      ? createFaintingFrames(faintAction, isPlayerFainted, 99, playerFrontHold, enemyBackHold)
      : [];

    const a1IsEvasionLaunch = isEvasionLaunch(a1);
    const a1IsEvasionStrike = isEvasionStrike(a1);
    const a2IsEvasionLaunch = isEvasionLaunch(a2);
    const a2IsEvasionStrike = isEvasionStrike(a2);

    // Evasion state at START of turn (before Act 1 starts) - ONLY true if unleashing an evasion strike, opponent missed into empty air, or gliding descent
    const isPlayerStartingEvading = !a1IsEvasionLaunch && !a2IsEvasionLaunch && (
      (a1IsEvasionStrike && isP1) || (a2IsEvasionStrike && isP2) || (Boolean(a1 && a1.log?.includes("닿지 않았다") && !isP1)) || Boolean(a1?.wasDescentFromAir && isP1) || Boolean(a2?.wasDescentFromAir && isP2)
    );
    const isEnemyStartingEvading = !a1IsEvasionLaunch && !a2IsEvasionLaunch && (
      (a1IsEvasionStrike && !isP1) || (a2IsEvasionStrike && !isP2) || (Boolean(a1 && a1.log?.includes("닿지 않았다") && isP1)) || Boolean(a1?.wasDescentFromAir && !isP1) || Boolean(a2?.wasDescentFromAir && !isP2)
    );

    // Evasion state during Act 1 (for non-acting Pokemon)
    const isPlayerEvadingDuringAct1 = isPlayerStartingEvading && !isP1;
    const isEnemyEvadingDuringAct1 = isEnemyStartingEvading && isP1;

    // Evasion state during Act 2 (for non-acting Pokemon)
    const isPlayerEvadingDuringAct2 = !isP2 && ((a1IsEvasionLaunch && isP1) || (isPlayerStartingEvading && !isP1 && !a1IsEvasionStrike));
    const isEnemyEvadingDuringAct2 = isP2 && ((a1IsEvasionLaunch && !isP1) || (isEnemyStartingEvading && isP1 && !a1IsEvasionStrike));

    // Evasion state at END of turn (final hold frame)
    const isPlayerEndingEvading = (a1IsEvasionLaunch && isP1 && !a2) || (a2IsEvasionLaunch && isP2) || (Boolean(playerMon.semiInvulnerableState || playerMon.chargingMove));
    const isEnemyEndingEvading = (a1IsEvasionLaunch && !isP1 && !a2) || (a2IsEvasionLaunch && !isP2) || (Boolean(enemy.semiInvulnerableState || enemy.chargingMove));

    let processedAct1Frames = act1Frames;
    if (isEnemyEvadingDuringAct1) {
      processedAct1Frames = act1Frames.map(f => f.isHighSkyCutscene ? f : ({ ...f, eOffset: { x: 0, y: -9999 }, hideEShadow: true, hideEnemy: true, eAlpha: 0.0 }));
    } else if (isPlayerEvadingDuringAct1) {
      processedAct1Frames = act1Frames.map(f => f.isHighSkyCutscene ? f : ({ ...f, pOffset: { x: 0, y: -9999 }, hidePShadow: true, hidePlayer: true, pAlpha: 0.0 }));
    }

    let processedAct2Frames = act2Frames;
    if (isPlayerEvadingDuringAct2) {
      processedAct2Frames = act2Frames.map(f => f.isHighSkyCutscene ? f : ({ ...f, pOffset: { x: 0, y: -9999 }, hidePShadow: true, hidePlayer: true, pAlpha: 0.0 }));
    } else if (isEnemyEvadingDuringAct2) {
      processedAct2Frames = act2Frames.map(f => f.isHighSkyCutscene ? f : ({ ...f, eOffset: { x: 0, y: -9999 }, hideEShadow: true, hideEnemy: true, eAlpha: 0.0 }));
    }

    framesConfig = [
      // Frame 0: Leading Cinematic Soft-Blur Loading Frame (800ms / 0.8s)
      {
        delay: 800,
        pOffset: isPlayerStartingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        eOffset: isEnemyStartingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        pAlpha: isPlayerStartingEvading ? 0.0 : 1.0,
        eAlpha: isEnemyStartingEvading ? 0.0 : 1.0,
        hidePShadow: isPlayerStartingEvading,
        hideEShadow: isEnemyStartingEvading,
        hidePlayer: isPlayerStartingEvading,
        hideEnemy: isEnemyStartingEvading,
        showEffect: false,
        hitFlash: false,
        enemyHp: enemy.hp,
        playerHp: playerMon.hp,
        textLineIdx: 0,
        statProgress: undefined,
        isBlur: true,
      },
      // === ACT 1 ===
      ...processedAct1Frames,
      // Frame 3: Attacker 1 Recoil & Damage Settling (with Dynamic Effectiveness Blinking!)
      ...(createEffectivenessFlickerFrames(a1, isP1, true, isP1GuillotineKill, isE1GuillotineKill).map(f =>
        isPlayerEvadingDuringAct1 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyEvadingDuringAct1 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      )),
      // Dedicated Post-Move Stat Change Phase for Action 1 (if stat changes exist!)
      ...(createStatChangeFrames(a1, isP1, 2, isP1GuillotineKill, isE1GuillotineKill).map(f =>
        isPlayerEvadingDuringAct1 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyEvadingDuringAct1 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      )),
      // Frame 4: Natural Breathing Room Pause between Turns (320ms - comfortable reading pause!)
      {
        delay: 320,
        pOffset: (a1IsEvasionLaunch && isP1) || isPlayerEvadingDuringAct2 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        eOffset: (a1IsEvasionLaunch && !isP1) || isEnemyEvadingDuringAct2 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        pAlpha: (a1IsEvasionLaunch && isP1) || isPlayerEvadingDuringAct2 ? 0.0 : 1.0,
        eAlpha: (a1IsEvasionLaunch && !isP1) || isEnemyEvadingDuringAct2 ? 0.0 : 1.0,
        hidePShadow: (a1IsEvasionLaunch && isP1) || isPlayerEvadingDuringAct2,
        hideEShadow: (a1IsEvasionLaunch && !isP1) || isEnemyEvadingDuringAct2,
        hidePlayer: (a1IsEvasionLaunch && isP1) || isPlayerEvadingDuringAct2,
        hideEnemy: (a1IsEvasionLaunch && !isP1) || isEnemyEvadingDuringAct2,
        showEffect: false,
        hitFlash: false,
        usePlayerFront: isP1GuillotineKill,
        useEnemyBack: isE1GuillotineKill,
        targetAlpha: 1.0,
        enemyHp: a1.enemyHpAfter,
        playerHp: a1.playerHpAfter,
        textLineIdx: 2,
        statProgress: undefined,
        isBlur: false,
        moveEffect: a1,
      },
      // === ACT 2 ===
      ...processedAct2Frames,
      // Frame 7: Attacker 2 Recoil & Counter Damage (with Dynamic Effectiveness Blinking!)
      ...(createEffectivenessFlickerFrames(a2, isP2, false, playerFrontHold, enemyBackHold).map(f =>
        isPlayerEvadingDuringAct2 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyEvadingDuringAct2 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      )),
      // Dedicated Post-Move Stat Change Phase for Action 2 (if stat changes exist!)
      ...(createStatChangeFrames(a2, isP2, 4, playerFrontHold, enemyBackHold).map(f =>
        isPlayerEvadingDuringAct2 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyEvadingDuringAct2 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      )),
      // Sinking Faint Collapse Animation (if someone fainted)
      ...faintFrames,
      // Final 11-Minute Static Hold Frame (655,000ms) - completely neutral with NO statProgress
      {
        delay: 655000,
        pOffset: isPlayerEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        eOffset: isEnemyEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        pAlpha: (isPlayerFainted || (!isP2 && isWhirlwindHit2) || (!isP1 && isWhirlwindHit1)) ? 0.0 : 1.0,
        eAlpha: (isEnemyFainted || (isP2 && isWhirlwindHit2) || (isP1 && isWhirlwindHit1)) ? 0.0 : 1.0,
        hidePShadow: isPlayerEndingEvading || isPlayerFainted || (!isP2 && isWhirlwindHit2) || (!isP1 && isWhirlwindHit1),
        hideEShadow: isEnemyEndingEvading || isEnemyFainted || (isP2 && isWhirlwindHit2) || (isP1 && isWhirlwindHit1),
        hidePlayer: isPlayerEndingEvading || isPlayerFainted || (!isP2 && isWhirlwindHit2) || (!isP1 && isWhirlwindHit1),
        hideEnemy: isEnemyEndingEvading || isEnemyFainted || (isP2 && isWhirlwindHit2) || (isP1 && isWhirlwindHit1),
        showEffect: false,
        hitFlash: false,
        usePlayerFront: playerFrontHold,
        useEnemyBack: enemyBackHold,
        enemyHp: finalEnemyHp,
        playerHp: finalPlayerHp,
        textLineIdx: 99,
        statProgress: undefined,
        isBlur: false,
        moveEffect: a2,
      }
    ];
  } else {
    // Single Action Turn (e.g. 1 move executed or enemy fainted)
    const a1 = turnActions[0];
    const isP1 = a1 ? (a1.actor === "player") : isPlayer;
    const eff = a1 || {
      moveKey,
      moveName: moveKey,
      type,
      isSpecial,
      isPlayerAttacking: isPlayer,
      statChanges: battle.lastMoveEffect?.statChanges,
      enemyHpAfter: enemyHp,
      playerHpAfter: playerHp,
    };

    const isGuillotineSingle = (eff.moveKey || moveKey).toLowerCase().replace(/[\s_]+/g, "-") === "guillotine";
    const isWhirlwindSingle = (eff.moveKey || moveKey).toLowerCase().replace(/[\s_]+/g, "-") === "whirlwind";
    const isWhirlwindSuccess = isWhirlwindSingle && (eff.isHit !== false && !eff.log?.includes("통하지 않았다") && !eff.log?.includes("실패했다"));

    const finalEnemyHp = Math.min(enemy.hp, eff.enemyHpAfter !== undefined ? eff.enemyHpAfter : enemyHp);
    const finalPlayerHp = Math.min(playerMon.hp, eff.playerHpAfter !== undefined ? eff.playerHpAfter : playerHp);
    const isEnemyFainted = (finalEnemyHp <= 0 || (enemy.hp <= 0 && !isWhirlwindSuccess) || (battle.phase === "VICTORY" && !isWhirlwindSuccess));
    const isPlayerFainted = (finalPlayerHp <= 0 || (playerMon.hp <= 0 && !isWhirlwindSuccess) || (battle.phase === "DEFEAT" && !isWhirlwindSuccess));
    const isFainted = isEnemyFainted || isPlayerFainted;

    const playerFrontHold = isP1 && isGuillotineSingle && isEnemyFainted;
    const enemyBackHold = !isP1 && isGuillotineSingle && isPlayerFainted;

    const faintFrames = isFainted
      ? createFaintingFrames(eff, isPlayerFainted, 99, playerFrontHold, enemyBackHold)
      : [];

    const a1IsEvasionLaunch = isEvasionLaunch(a1);
    const a1IsEvasionStrike = isEvasionStrike(a1);

    const isPlayerStartingEvading = !a1IsEvasionLaunch && ((a1IsEvasionStrike && isP1) || (Boolean(a1 && a1.log?.includes("닿지 않았다") && !isP1)) || Boolean(eff?.wasDescentFromAir && isP1));
    const isEnemyStartingEvading = !a1IsEvasionLaunch && ((a1IsEvasionStrike && !isP1) || (Boolean(a1 && a1.log?.includes("닿지 않았다") && isP1)) || Boolean(eff?.wasDescentFromAir && !isP1));

    const isPlayerEndingEvading = (a1IsEvasionLaunch && isP1) || Boolean(playerMon.semiInvulnerableState || playerMon.chargingMove);
    const isEnemyEndingEvading = (a1IsEvasionLaunch && !isP1) || Boolean(enemy.semiInvulnerableState || enemy.chargingMove);

    let processedSingleActFrames = act1Frames;
    if (isEnemyStartingEvading && isP1) {
      processedSingleActFrames = act1Frames.map(f => f.isHighSkyCutscene ? f : ({ ...f, eOffset: { x: 0, y: -9999 }, hideEShadow: true, hideEnemy: true, eAlpha: 0.0 }));
    } else if (isPlayerStartingEvading && !isP1) {
      processedSingleActFrames = act1Frames.map(f => f.isHighSkyCutscene ? f : ({ ...f, pOffset: { x: 0, y: -9999 }, hidePShadow: true, hidePlayer: true, pAlpha: 0.0 }));
    }

    framesConfig = [
      // Frame 0: Leading Cinematic Soft-Blur Loading Frame (800ms / 0.8s)
      {
        delay: 800,
        pOffset: isPlayerStartingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        eOffset: isEnemyStartingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        pAlpha: isPlayerStartingEvading ? 0.0 : 1.0,
        eAlpha: isEnemyStartingEvading ? 0.0 : 1.0,
        hidePShadow: isPlayerStartingEvading,
        hideEShadow: isEnemyStartingEvading,
        hidePlayer: isPlayerStartingEvading,
        hideEnemy: isEnemyStartingEvading,
        showEffect: false,
        hitFlash: false,
        enemyHp: enemy.hp,
        playerHp: playerMon.hp,
        textLineIdx: 0,
        statProgress: undefined,
        isBlur: true,
      },
      // Act 1 Move Animation (Fully executed with all sub-frames!)
      ...processedSingleActFrames,
      // Frame 3: Recoil & Damage Settling (with Dynamic Effectiveness Blinking!)
      ...(createEffectivenessFlickerFrames(eff, isP1, true, playerFrontHold, enemyBackHold).map(f =>
        isPlayerStartingEvading && !isP1 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyStartingEvading && isP1 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      )),
      // Dedicated Post-Move Stat Change Phase (if stat changes exist!)
      ...(createStatChangeFrames(eff, isP1, 2, playerFrontHold, enemyBackHold).map(f =>
        isPlayerStartingEvading && !isP1 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyStartingEvading && isP1 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      )),
      // Sinking Faint Collapse Animation (if fainted)
      ...faintFrames,
      // Final 11-Minute Static Hold Frame (655,000ms) - completely neutral with NO statProgress
      {
        delay: 655000,
        pOffset: isPlayerEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        eOffset: isEnemyEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        pAlpha: (isPlayerFainted || (!isP1 && isWhirlwindSuccess)) ? 0.0 : 1.0,
        eAlpha: (isEnemyFainted || (isP1 && isWhirlwindSuccess)) ? 0.0 : 1.0,
        hidePShadow: isPlayerEndingEvading || isPlayerFainted || (!isP1 && isWhirlwindSuccess),
        hideEShadow: isEnemyEndingEvading || isEnemyFainted || (isP1 && isWhirlwindSuccess),
        hidePlayer: isPlayerEndingEvading || isPlayerFainted || (!isP1 && isWhirlwindSuccess),
        hideEnemy: isEnemyEndingEvading || isEnemyFainted || (isP1 && isWhirlwindSuccess),
        showEffect: false,
        hitFlash: false,
        usePlayerFront: playerFrontHold,
        useEnemyBack: enemyBackHold,
        enemyHp: finalEnemyHp,
        playerHp: finalPlayerHp,
        textLineIdx: 99,
        statProgress: undefined,
        isBlur: false,
        moveEffect: eff,
      }
    ];
  }

  const motionDurationMs = framesConfig.slice(0, -1).reduce((sum, f) => sum + f.delay, 0);

  const ep = BATTLE_LAYOUT_CONFIG.enemyPlatform;
  const pp = BATTLE_LAYOUT_CONFIG.playerPlatform;
  const enemyPlatW = 320 * ep.scale;
  const enemyPlatH = 132 * ep.scale;
  const playerPlatW = 320 * pp.scale;
  const playerPlatH = 132 * pp.scale;

  const em = BATTLE_LAYOUT_CONFIG.enemyPokemon;
  const pm = BATTLE_LAYOUT_CONFIG.playerPokemon;

  // Apply 5th Generation (Black/White) style smooth continuous camera tracking towards defending Pokémon
  directBattleCamera(framesConfig, isPlayer, em, pm);

  const offCanvas = createCanvas(width, height);
  const offCtx = offCanvas.getContext("2d");
  offCtx.imageSmoothingEnabled = false;

  for (const f of framesConfig) {
    const targetCtx = f.isBlur ? offCtx : ctx;
    targetCtx.clearRect(0, 0, width, height);

    if (f.isHighSkyCutscene) {
      const attackerSprite = (f.isAttackerPlayer !== false)
        ? (playerSprite || playerFrontSprite)
        : (enemySprite || enemyBackSprite);
      drawHighSkyCutscene(targetCtx, width, height, f, attackerSprite);
    } else {
      const isTracking = Boolean(f.cameraTrackAttacker);
      const hasCamera = Boolean(f.cameraZoom || f.cameraPan || isTracking || f.cameraFocal);
      if (hasCamera) {
        targetCtx.save();
        const zoom = f.cameraZoom || 1.0;
        const isAttackerP = f.isAttackerPlayer !== false;

        if (isTracking) {
          // Pure 100% vertical tracking: X is strictly centered at width / 2 (280) so left and right margins never expose!
          const liveY = isAttackerP ? (pm.y + f.pOffset.y) : (em.y + f.eOffset.y);
          const screenY = isAttackerP ? pm.y : em.y;

          targetCtx.translate(width / 2, screenY);
          targetCtx.scale(zoom, zoom);
          targetCtx.translate(-width / 2, -liveY);
        } else if (f.cameraFocal) {
          // Smooth Gen 5 style camera glide focused towards defending Pokémon getting hit
          // Clamped within arena bounds so 100% of the arena background stays visible with zero edge artifacts
          const halfW = width / (2 * zoom);
          const halfH = height / (2 * zoom);
          const minX = halfW;
          const maxX = width - halfW;
          const minY = halfH;
          const maxY = height - halfH;

          const clampedX = Math.max(minX, Math.min(maxX, f.cameraFocal.x));
          const clampedY = Math.max(minY, Math.min(maxY, f.cameraFocal.y));

          targetCtx.translate(width / 2, height / 2);
          targetCtx.scale(zoom, zoom);
          targetCtx.translate(-clampedX, -clampedY);
        } else {
          const focalY = isAttackerP ? pm.y : em.y;
          const panY = f.cameraPan?.y || 0;

          targetCtx.translate(width / 2, focalY + panY);
          targetCtx.scale(zoom, zoom);
          targetCtx.translate(-width / 2, -focalY);
        }
      }

      // Sample exact top and bottom edge colors from the arena background image
      const edgeColors = getArenaEdgeColors(arena.bg);

      // 1. Top Sky Fill (for y <= 0 extending upwards to -3000px):
      if (isTracking) {
        // Stratosphere space navy gradient transitioning into biome's top edge color at y = 0
        const skyAscentGrad = targetCtx.createLinearGradient(0, -2500, 0, 0);
        skyAscentGrad.addColorStop(0, "#0B1120"); // Deep Stratosphere space navy
        skyAscentGrad.addColorStop(0.35, "#0284C7"); // Sky Blue
        skyAscentGrad.addColorStop(0.70, "#38BDF8"); // Atmosphere cyan
        skyAscentGrad.addColorStop(1, edgeColors.top); // Seamless connection to top of arena background!
        targetCtx.fillStyle = skyAscentGrad;
        targetCtx.fillRect(-width * 4, -3000, width * 9, 3000);
      } else {
        targetCtx.fillStyle = edgeColors.top;
        targetCtx.fillRect(-width * 4, -3000, width * 9, 3000);
      }

      // 2. Bottom Ground Fill (for y >= height extending downwards to +3000px):
      // Guaranteed seamless ground color matching the biome floor (grass, soil, sand, rock)
      targetCtx.fillStyle = edgeColors.bottom;
      targetCtx.fillRect(-width * 4, height, width * 9, 3000);

      // 3. Side Margins (for x < 0 and x > width):
      const sideGrad = targetCtx.createLinearGradient(0, 0, 0, height);
      sideGrad.addColorStop(0, edgeColors.top);
      sideGrad.addColorStop(1, edgeColors.bottom);
      targetCtx.fillStyle = sideGrad;
      targetCtx.fillRect(-width * 4, 0, width * 4, height);
      targetCtx.fillRect(width, 0, width * 4, height);

      // 4. Ground Arena Background Image
      if (arena.bg) {
        targetCtx.drawImage(arena.bg, 0, 0, width, height);
      } else {
        targetCtx.fillStyle = "#487848";
        targetCtx.fillRect(0, 0, width, height);
      }

      if (arena.b) {
        targetCtx.drawImage(arena.b, ep.x, ep.y, enemyPlatW, enemyPlatH);
        targetCtx.save();
        targetCtx.translate(width, 0);
        targetCtx.scale(-1, 1);
        targetCtx.drawImage(arena.b, pp.x, pp.y, playerPlatW, playerPlatH);
        targetCtx.restore();
      }

      // Looming Descending Sky Shadow on Target Platform (e.g. Fly Turn 2 targeting & descent phase)
      if (f.loomingShadow) {
        const targetPos = f.isAttackerPlayer !== false ? em : pm;
        const lx = targetPos.x + (f.loomingShadow.offsetX || 0);
        const ly = targetPos.y + (f.loomingShadow.offsetY || 0);
        const sw = f.loomingShadow.w;
        const sh = f.loomingShadow.h;
        const alpha = f.loomingShadow.alpha || 0.6;

        targetCtx.save();
        targetCtx.globalAlpha = alpha;
        targetCtx.fillStyle = "rgba(15, 23, 42, 0.75)";
        targetCtx.beginPath();
        targetCtx.ellipse(lx, ly, sw, sh, 0, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.restore();
      }

      // Determine target entity for hitFlash & filter styling
      const eTarget = (f.moveEffect ? f.moveEffect.actor === "player" : isPlayer);
      const pTarget = (f.moveEffect ? f.moveEffect.actor === "enemy" : !isPlayer);

      const eAlpha = f.eAlpha !== undefined
        ? f.eAlpha
        : ((f.targetAlpha !== undefined && eTarget) ? f.targetAlpha : 1.0);
      const pAlpha = f.pAlpha !== undefined
        ? f.pAlpha
        : ((f.targetAlpha !== undefined && pTarget) ? f.targetAlpha : 1.0);

      // Pokémon Silhouette Shadows (cast onto platform ground - suppressed during high-speed mid-air flight, underground, or off-screen)
      const isEnemyHidden = (f.eOffset && (f.eOffset.y <= -50 || f.eOffset.y >= 9000)) || f.hideEShadow || f.hideEnemy || (eAlpha <= 0.02);
      if (enemySprite && !isEnemyHidden) {
        const eShadowX = em.x + (f.eOffset?.x || 0);
        const eShadowY = em.y;
        drawPokemonSilhouetteShadow(targetCtx, enemySprite, eShadowX, eShadowY, em.size, false, 0.42 * eAlpha);
      }

      const isPlayerHidden = (f.pOffset && (f.pOffset.y <= -50 || f.pOffset.y >= 9000)) || f.hidePShadow || f.hidePlayer || (pAlpha <= 0.02);
      if (playerSprite && !isPlayerHidden) {
        const pShadowX = pm.x + (f.pOffset?.x || 0);
        const pShadowY = pm.y;
        drawPokemonSilhouetteShadow(targetCtx, playerSprite, pShadowX, pShadowY, pm.size, true, 0.42 * pAlpha);
      }

      const drawEnemySprite = () => {
        const eSpriteToDraw = f.useEnemyBack ? (enemyBackSprite || enemySprite) : enemySprite;
        const isEnemySpriteHidden = (f.eOffset && (f.eOffset.y <= -500 || f.eOffset.y >= 9000)) || f.hideEnemy || (eAlpha <= 0.01);
        if (eSpriteToDraw && !isEnemySpriteHidden) {
          targetCtx.save();
          if (f.eWhite) {
            targetCtx.filter = "brightness(0) invert(1)";
          } else if (f.hitFlash && eTarget) {
            targetCtx.filter = "brightness(1.35)";
          }
          if (eAlpha < 0.99) {
            targetCtx.globalAlpha = eAlpha;
          }
          const ex = em.x + f.eOffset.x;
          const ey = em.y + f.eOffset.y;
          if (f.eScale || f.eRot) {
            targetCtx.translate(ex, ey);
            if (f.eRot) targetCtx.rotate(f.eRot);
            if (f.eScale) targetCtx.scale(f.eScale.x, f.eScale.y);
            drawFittedBattleSprite(targetCtx, eSpriteToDraw, 0, 0, em.size);
          } else {
            drawFittedBattleSprite(targetCtx, eSpriteToDraw, ex, ey, em.size);
          }
          targetCtx.restore();
        }
      };

      const drawPlayerSprite = () => {
        const pSpriteToDraw = f.usePlayerFront ? (playerFrontSprite || playerSprite) : playerSprite;
        const isPlayerSpriteHidden = (f.pOffset && (f.pOffset.y <= -500 || f.pOffset.y >= 9000)) || f.hidePlayer || (pAlpha <= 0.01);
        if (pSpriteToDraw && !isPlayerSpriteHidden && (playerMon.hp > 0 || f.playerHp > 0 || pAlpha > 0.01)) {
          targetCtx.save();
          if (f.pWhite) {
            targetCtx.filter = "brightness(0) invert(1)";
          } else if (f.hitFlash && pTarget) {
            targetCtx.filter = "brightness(1.35)";
          }
          if (pAlpha < 0.99) {
            targetCtx.globalAlpha = pAlpha;
          }
          const px = pm.x + f.pOffset.x;
          const py = pm.y + f.pOffset.y;
          if (f.pScale || f.pRot) {
            targetCtx.translate(px, py);
            if (f.pRot) targetCtx.rotate(f.pRot);
            if (f.pScale) targetCtx.scale(f.pScale.x, f.pScale.y);
            drawFittedBattleSprite(targetCtx, pSpriteToDraw, 0, 0, pm.size);
          } else {
            drawFittedBattleSprite(targetCtx, pSpriteToDraw, px, py, pm.size);
          }
          targetCtx.restore();
        }
      };

      // Behind-Sprite Move Effect Layer (e.g. Vine Whip vines emerging from behind attacker's body)
      if (f.showEffect || f.moveStep) {
        const activeEffect = f.moveEffect || battle.lastMoveEffect || {
          moveKey,
          type,
          isSpecial,
          isPlayerAttacking: isPlayer,
        };
        const activeKey = (activeEffect.moveKey || moveKey).toLowerCase().replace(/[\s_]+/g, "-");
        if (activeKey === "vine-whip" || activeKey === "vinewhip" || activeKey === "stomp") {
          renderMoveEffect(targetCtx, {
            moveKey: activeEffect.moveKey || moveKey,
            type: activeEffect.type || type,
            isSpecial: activeEffect.isSpecial !== undefined ? activeEffect.isSpecial : isSpecial,
            isPlayerAttacking: activeEffect.actor ? (activeEffect.actor === "player") : (activeEffect.isPlayerAttacking ?? isPlayer),
            step: f.moveStep ?? (f.showEffect ? 2 : 1),
            layer: "behind",
          });
        }
      }

      if (f.drawEnemyOnTop) {
        drawPlayerSprite();
        drawEnemySprite();
      } else {
        drawEnemySprite();
        drawPlayerSprite();
      }

      // Front-Sprite Move Effect Layer (Target strike flash, impact bursts, leaf particles)
      if (f.showEffect || f.moveStep) {
        const activeEffect = f.moveEffect || battle.lastMoveEffect || {
          moveKey,
          type,
          isSpecial,
          isPlayerAttacking: isPlayer,
        };
        const activeKey = (activeEffect.moveKey || moveKey).toLowerCase().replace(/[\s_]+/g, "-");
        if (f.showEffect || activeKey === "karate-chop" || activeKey === "karatechop") {
          renderMoveEffect(targetCtx, {
            moveKey: activeEffect.moveKey || moveKey,
            type: activeEffect.type || type,
            isSpecial: activeEffect.isSpecial !== undefined ? activeEffect.isSpecial : isSpecial,
            isPlayerAttacking: activeEffect.actor ? (activeEffect.actor === "player") : (activeEffect.isPlayerAttacking ?? isPlayer),
            step: f.moveStep ?? (f.showEffect ? 3 : 1),
            layer: (activeKey === "vine-whip" || activeKey === "vinewhip" || activeKey === "stomp") ? "front" : "all",
          });
        }
      }

      if (hasCamera) {
        targetCtx.restore();
      }
    }

    // Stat Boost / Drop Arrow Particles
    if (f.statProgress !== undefined) {
      const activeEffect = f.moveEffect || battle.lastMoveEffect;
      const statChanges = activeEffect?.statChanges || battle.lastMoveEffect?.statChanges;
      if (statChanges && statChanges.length > 0) {
        for (const change of statChanges) {
          const targetPos = change.target === "player"
            ? { x: pm.x + f.pOffset.x, y: pm.y + f.pOffset.y }
            : { x: em.x + f.eOffset.x, y: em.y + f.eOffset.y };

          if (change.direction === "up") {
            drawStatBoostEffect(targetCtx, targetPos, f.statProgress);
          } else {
            drawStatDropEffect(targetCtx, targetPos, f.statProgress);
          }
        }
      }
    }

    if (!f.isBlur) {
      renderBattleHeader(targetCtx, width, battle, isKo);
      renderBattleHuds(targetCtx, battle, isKo, pbAssets, f.enemyHp !== undefined ? f.enemyHp : enemyHp, f.playerHp !== undefined ? f.playerHp : playerHp);
      renderBattleDialogue(targetCtx, width, height, dialogueLines, f.textLineIdx);
    } else {
      // Base empty dialogue box drawn on offCanvas before full-frame blur
      const boxY = 270;
      const glassGrad = targetCtx.createLinearGradient(0, boxY, 0, height);
      glassGrad.addColorStop(0, "rgba(10, 16, 26, 0.58)");
      glassGrad.addColorStop(1, "rgba(6, 10, 18, 0.68)");
      targetCtx.fillStyle = glassGrad;
      targetCtx.fillRect(0, boxY, width, height - boxY);

      // Apply UNIFIED 100% Full-Screen Blur to the main canvas
      ctx.clearRect(0, 0, width, height);
      ctx.filter = "blur(6px) brightness(0.88)";
      ctx.drawImage(offCanvas, 0, 0, width, height);
      ctx.filter = "none";
    }

    let effectiveDelay = f.delay;
    if (f.delay >= 10000) {
      effectiveDelay = f.delay;
    } else if (f.isBlur) {
      // 600ms leading cinematic soft-blur loading transition
      effectiveDelay = 600;
    } else if (f.hitFlash || f.showEffect) {
      // Impact & effect frames: Deliberate 135ms+ holding time so the camera zoom & hit burst are clearly felt!
      effectiveDelay = Math.max(135, Math.round(f.delay * 1.35));
    } else {
      // Fluid, smooth 8~10 FPS animation timing (1.25x) - crisp, dynamic, and free of stutter/lag
      effectiveDelay = Math.max(70, Math.round(f.delay * 1.25));
    }

    encoder.setDelay(effectiveDelay);
    encoder.addFrame(ctx);
  }

  const totalMotionMs = framesConfig
    .filter(f => f.delay < 10000)
    .reduce((sum, f) => {
      if (f.isBlur) return sum + 600;
      if (f.hitFlash || f.showEffect) return sum + Math.max(135, Math.round(f.delay * 1.35));
      return sum + Math.max(70, Math.round(f.delay * 1.25));
    }, 0);

  encoder.finish();
  return { buffer: encoder.out.getData(), motionDurationMs: totalMotionMs };
}

/**
 * 2. Knockout / Fainting GIF (Full move casting animation + Sinking faint collapse)
 */
export async function renderBattleFaintGif(options: BattleAnimationOptions): Promise<RenderGifResult> {
  return renderBattleMoveGif(options);
}

/**
 * 3. Wild Encounter Entry GIF:
 * Frame 1: Far Slide-in (180ms)
 * Frame 2: Mid-way Approach (200ms)
 * Frame 3: Near Landing & HUD appears (200ms)
 * Frame 4: Grounded on Platform (220ms)
 * Frame 5: 11-Minute Static Hold Frame (655,000ms - Maximum GIF89a unsigned 16-bit delay limit)
 */
export async function renderBattleEntryGif(options: BattleAnimationOptions): Promise<RenderGifResult> {
  const width = 560;
  const height = 380;
  const isKo = options.lang === "ko";
  const battle = options.battle;
  const enemy = battle.enemy;
  const playerMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];

  const dialogueLines = options.dialogueLines || (battle.dialogueText || "").replace(/\\n/g, "\n").split("\n");

  const enemyActiveSpecies = (enemy as any).isTransformed ? ((enemy as any).transformedSpeciesId || enemy.speciesId) : enemy.speciesId;
  const playerActiveSpecies = (playerMon as any).isTransformed
    ? ((playerMon as any).transformedSpeciesId || playerMon.speciesId)
    : ((playerMon as any).hasIllusion && (playerMon as any).illusionTarget ? (playerMon as any).illusionTarget.speciesId : playerMon.speciesId);

  const enemyShinyTier = (enemy as any).shinyTier !== undefined ? (enemy as any).shinyTier : (enemy.isShiny ? 1 : 0);
  const playerShinyTier = ((playerMon as any).hasIllusion && (playerMon as any).illusionTarget)
    ? ((playerMon as any).illusionTarget.shinyTier !== undefined ? (playerMon as any).illusionTarget.shinyTier : ((playerMon as any).illusionTarget.isShiny ? 1 : 0))
    : ((playerMon as any).shinyTier !== undefined ? (playerMon as any).shinyTier : ((playerMon as any).isShiny ? 1 : 0));

  const [arena, pbAssets, enemySprite, playerSprite] = await Promise.all([
    getArenaAssets(battle.biome || "Town"),
    getPbInfoAssets(),
    getPokemonSprite(enemyActiveSpecies, true, enemyShinyTier, false),
    getPokemonSprite(playerActiveSpecies, true, playerShinyTier, true),
  ]);

  const encoder = new GIFEncoder(width, height, "octree", true);
  encoder.setRepeat(-1);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const entryFrames = [
    // Frame 0: Leading Cinematic Soft-Blur Loading Frame (800ms / 0.8s) - Unified full-screen blur without text!
    { delay: 800, pPlatX: 0, ePlatX: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, showHud: false, textLineIdx: 0, isBlur: true, cryWave: 0 },
    // Frame 1: Far Slide-in (160ms)
    { delay: 160, pPlatX: -160, ePlatX: 160, pMonX: -200, pMonY: 0, eMonX: 200, eMonY: 0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 2: Touchdown Landing on Platform (150ms)
    { delay: 150, pPlatX: 0, ePlatX: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 3: DS Cry Vibration Phase 1 - Shake Left & Cry Soundwave (110ms)
    { delay: 110, pPlatX: 0, ePlatX: 0, pMonX: 0, pMonY: 0, eMonX: -7, eMonY: -3, showHud: true, textLineIdx: 1, isBlur: false, cryWave: 1 },
    // Frame 4: DS Cry Vibration Phase 2 - Shake Right & Expanding Ring (110ms)
    { delay: 110, pPlatX: 0, ePlatX: 0, pMonX: 0, pMonY: 0, eMonX: 7, eMonY: -2, showHud: true, textLineIdx: 1, isBlur: false, cryWave: 2 },
    // Frame 5: DS Cry Vibration Phase 3 - Settle & Micro-Bounce (120ms)
    { delay: 120, pPlatX: 0, ePlatX: 0, pMonX: 0, pMonY: 0, eMonX: -2, eMonY: 0, showHud: true, textLineIdx: 2, isBlur: false, cryWave: 3 },
    // Frame 6: Battle Ready Stance (160ms)
    { delay: 160, pPlatX: 0, ePlatX: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, showHud: true, textLineIdx: 2, isBlur: false, cryWave: 0 },
    // Frame 7: 11-Minute Static Hold Frame (655,000ms - Maximum GIF89a unsigned 16-bit delay limit)
    { delay: 655000, pPlatX: 0, ePlatX: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, showHud: true, textLineIdx: 99, isBlur: false, cryWave: 0 }
  ];

  const motionDurationMs = entryFrames.slice(0, -1).reduce((sum, f) => sum + f.delay, 0);

  const ep = BATTLE_LAYOUT_CONFIG.enemyPlatform;
  const pp = BATTLE_LAYOUT_CONFIG.playerPlatform;
  const enemyPlatW = 320 * ep.scale;
  const enemyPlatH = 132 * ep.scale;
  const playerPlatW = 320 * pp.scale;
  const playerPlatH = 132 * pp.scale;

  const em = BATTLE_LAYOUT_CONFIG.enemyPokemon;
  const pm = BATTLE_LAYOUT_CONFIG.playerPokemon;

  const offEntryCanvas = createCanvas(width, height);
  const offEntryCtx = offEntryCanvas.getContext("2d");
  offEntryCtx.imageSmoothingEnabled = false;

  for (const f of entryFrames) {
    const targetCtx = f.isBlur ? offEntryCtx : ctx;
    targetCtx.clearRect(0, 0, width, height);

    if (arena.bg) targetCtx.drawImage(arena.bg, 0, 0, width, height);
    else { targetCtx.fillStyle = "#487848"; targetCtx.fillRect(0, 0, width, height); }

    // Sliding Platforms
    if (arena.b) {
      // Enemy Platform sliding from right
      targetCtx.drawImage(arena.b, ep.x + f.ePlatX, ep.y, enemyPlatW, enemyPlatH);
      // Player Platform sliding from left
      targetCtx.save();
      targetCtx.translate(width, 0);
      targetCtx.scale(-1, 1);
      targetCtx.drawImage(arena.b, pp.x + f.pPlatX, pp.y, playerPlatW, playerPlatH);
      targetCtx.restore();
    }

    // Battler Sprites (with DS Cry vibration offsets)
    if (enemySprite) {
      drawFittedBattleSprite(targetCtx, enemySprite, em.x + (f.eMonX || 0), em.y + (f.eMonY || 0), em.size);
    }
    if (playerSprite) {
      drawFittedBattleSprite(targetCtx, playerSprite, pm.x + (f.pMonX || 0), pm.y + (f.pMonY || 0), pm.size);
    }

    if (!f.isBlur) {
      renderBattleHeader(targetCtx, width, battle, isKo);
      if (f.showHud) {
        renderBattleHuds(targetCtx, battle, isKo, pbAssets, enemy.hp, playerMon.hp);
      }
      renderBattleDialogue(targetCtx, width, height, dialogueLines, f.textLineIdx);
    } else {
      // Base empty dialogue box drawn on offEntryCanvas before full-frame blur
      const boxY = 270;
      const glassGrad = targetCtx.createLinearGradient(0, boxY, 0, height);
      glassGrad.addColorStop(0, "rgba(10, 16, 26, 0.58)");
      glassGrad.addColorStop(1, "rgba(6, 10, 18, 0.68)");
      targetCtx.fillStyle = glassGrad;
      targetCtx.fillRect(0, boxY, width, height - boxY);

      // Apply UNIFIED 100% Full-Screen Blur to main canvas
      ctx.clearRect(0, 0, width, height);
      ctx.filter = "blur(6px) brightness(0.88)";
      ctx.drawImage(offEntryCanvas, 0, 0, width, height);
      ctx.filter = "none";
    }

    encoder.setDelay(f.delay);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return { buffer: encoder.out.getData(), motionDurationMs };
}

/**
 * Shared Header Rendering (Biome - Wave, Money)
 */
function renderBattleHeader(ctx: any, width: number, battle: BattleState, isKo: boolean) {
  const rawBiome = battle.biome || "Town";
  const biomeDisplay = isKo ? (BIOME_NAMES_KO[rawBiome.toLowerCase()] || rawBiome) : rawBiome;
  const waveText = `${biomeDisplay} - ${battle.wave || 1}`;
  const moneyText = formatMoney(battle.money || 0);

  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const textX = width - 24;

  const waveY = 14;
  ctx.font = "bold 15px DungGeunMo";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  ctx.strokeText(waveText, textX, waveY);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(waveText, textX, waveY);

  const moneyY = waveY + 20;
  ctx.font = "bold 13px DungGeunMo";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 3.0;
  ctx.strokeText(moneyText, textX, moneyY);
  ctx.fillStyle = "#FDE047";
  ctx.fillText(moneyText, textX, moneyY);
}

function renderBattleHuds(ctx: any, battle: BattleState, isKo: boolean, pbAssets: any, enemyHp: number, playerHp: number, playerHudOffset?: { x?: number; y?: number }) {
  const enemy = battle.enemy;
  const playerMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];

  const eh = BATTLE_LAYOUT_CONFIG.enemyHud;
  const cleanEnemyName = getPokemonDisplayName(enemy, isKo).replace(/[^\w\s가-힣0-9\(\)\-\.]/g, "").trim();
  const enemySpeciesData = POKEMON_SPECIES_DATA[enemy.speciesId] || null;
  const enemyTypes = enemy.types || (enemySpeciesData ? enemySpeciesData.types : ["normal"]);

  drawPokeRogueBattleHud(ctx, {
    x: eh.x,
    y: eh.y,
    w: eh.w,
    h: eh.h,
    name: cleanEnemyName,
    level: enemy.level,
    hp: enemyHp,
    maxHp: enemy.maxHp,
    isEnemy: true,
    types: enemyTypes,
    isBoss: enemy.isBoss,
    bossShields: enemy.bossShields,
    statusBadge: "",
    isKo,
    hudImage: enemy.isBoss ? pbAssets.bossBox : pbAssets.enemyBox,
    hpLabel: pbAssets.hpLabel,
  });

  const ph = BATTLE_LAYOUT_CONFIG.playerHud;
  const cleanPlayerName = getPokemonDisplayName(playerMon, isKo).replace(/[^\w\s가-힣0-9\(\)\-\.]/g, "").trim();
  const playerSpeciesData = POKEMON_SPECIES_DATA[playerMon.speciesId] || null;
  const playerTypes = playerMon.types || (playerSpeciesData ? playerSpeciesData.types : ["normal"]);

  drawPokeRogueBattleHud(ctx, {
    x: ph.x + (playerHudOffset?.x || 0),
    y: ph.y + (playerHudOffset?.y || 0),
    w: ph.w,
    h: ph.h,
    name: cleanPlayerName,
    level: playerMon.level,
    hp: playerHp,
    maxHp: playerMon.maxHp,
    isEnemy: false,
    types: playerTypes,
    statusBadge: "",
    exp: battle.playerExp || 0,
    maxExp: battle.playerMaxExp || 100,
    isKo,
    hudImage: pbAssets.playerBox,
    hpLabel: pbAssets.hpLabel,
  });
}

/**
 * Shared Dialogue Box Rendering
 */
function renderBattleDialogue(ctx: any, width: number, height: number, dialogueLines: string[], textLineIdx: number) {
  const boxY = 270;
  const glassGrad = ctx.createLinearGradient(0, boxY, 0, height);
  glassGrad.addColorStop(0, "rgba(10, 16, 26, 0.58)");
  glassGrad.addColorStop(1, "rgba(6, 10, 18, 0.68)");
  ctx.fillStyle = glassGrad;
  ctx.fillRect(0, boxY, width, height - boxY);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "bold 15px DungGeunMo";

  if (textLineIdx > 0) {
    const fullText = dialogueLines.join("\n");
    const wrapped = wrapDialogueText(ctx, fullText, width - 48);
    const available = wrapped.slice(0, textLineIdx);
    const linesToShow = available.length > 3 ? available.slice(-3) : available;
    linesToShow.forEach((line: string, lIdx: number) => {
      const textY = boxY + 16 + lIdx * 26;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
      ctx.lineWidth = 3.5;
      ctx.strokeText(line, 24, textY);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(line, 24, textY);
    });
  }
}
