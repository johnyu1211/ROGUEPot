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

function drawHighSkyCutscene(
  ctx: any,
  width: number,
  height: number,
  f: any,
  attackerSprite: any
) {
  // 1. Supersonic Stratosphere Vertical Dive Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, "#080F1E"); // Deep Stratosphere Space Navy
  skyGrad.addColorStop(0.30, "#0369A1"); // High-Altitude Azure
  skyGrad.addColorStop(0.70, "#0284C7"); // Sky Blue
  skyGrad.addColorStop(1, "#E0F2FE"); // Dense Cloud Base
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. High-Speed Upward Streaming Vertical Sonic Speedlines
  const stepSeed = (f.diveStep || 0) * 47;
  for (let i = 0; i < 32; i++) {
    const sx = ((i * 19 + stepSeed * 3) % (width + 60)) - 30;
    const sy = ((i * 47 + stepSeed * 7) % (height + 220)) - 100;
    const len = 90 + (i % 5) * 40;

    ctx.save();
    ctx.strokeStyle = (i % 2 === 0) ? "rgba(255, 255, 255, 0.90)" : "rgba(186, 230, 253, 0.60)";
    ctx.lineWidth = (i % 3 === 0) ? 2.6 : 1.4;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy - len); // Streamlines pointing UPWARDS (diving downwards!)
    ctx.stroke();
    ctx.restore();
  }

  // 3. Flanking Cloud Vapor Streams Rushing Upward
  const drawVerticalCloudPuff = (cx: number, cy: number, r: number, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.5, cy - r * 0.4, r * 0.8, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.4, cy + r * 0.3, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const cloudOffset = ((f.diveStep || 0) * 90) % 300;
  drawVerticalCloudPuff(30, 100 - cloudOffset, 36, 0.45);
  drawVerticalCloudPuff(50, 260 - cloudOffset, 44, 0.55);
  drawVerticalCloudPuff(width - 40, 140 - cloudOffset, 40, 0.50);
  drawVerticalCloudPuff(width - 60, 300 - cloudOffset, 48, 0.60);

  // 4. Diving Pokémon (Supersonic Aerodynamic Nose-Dive)
  if (attackerSprite) {
    ctx.save();
    const isP = f.isAttackerPlayer !== false;
    const ox = (isP ? f.pOffset?.x : f.eOffset?.x) || 0;
    const oy = (isP ? f.pOffset?.y : f.eOffset?.y) || 0;
    const scale = isP ? f.pScale : f.eScale;
    const rot = (isP ? f.pRot : f.eRot) || 0;

    const posX = width / 2 + ox;
    const posY = height / 2 + oy;

    // Aerodynamic Sonic Shockwave V-Cone Trail behind diving Pokemon
    ctx.save();
    const coneGrad = ctx.createLinearGradient(posX, posY - 90, posX, posY + 40);
    coneGrad.addColorStop(0, "rgba(255, 255, 255, 0.0)");
    coneGrad.addColorStop(0.65, "rgba(186, 230, 253, 0.40)");
    coneGrad.addColorStop(1, "rgba(255, 255, 255, 0.80)");

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(posX, posY + 45); // Point of Mach cone
    ctx.lineTo(posX - 42, posY - 105);
    ctx.lineTo(posX + 42, posY - 105);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Sonic shockwave compression rings
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(posX, posY - 20, 34, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(posX, posY - 55, 50, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw Aerodynamically Compressed Diving Pokémon Sprite
    ctx.translate(posX, posY);
    if (rot) ctx.rotate(rot);
    if (scale) ctx.scale(scale.x, scale.y);
    drawFittedBattleSprite(ctx, attackerSprite, 0, 0, 120);
    ctx.restore();
  }
}

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

  const enemyActiveSpecies = (enemy as any).isTransformed ? ((enemy as any).transformedSpeciesId || enemy.speciesId) : enemy.speciesId;
  const playerActiveSpecies = (playerMon as any).isTransformed
    ? ((playerMon as any).transformedSpeciesId || playerMon.speciesId)
    : ((playerMon as any).hasIllusion && (playerMon as any).illusionTarget ? (playerMon as any).illusionTarget.speciesId : playerMon.speciesId);

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
  const isStatusMove1 = moveData1?.category === "status" || (a1 as any).category === "status" || ((a1.damage ?? 0) === 0 && !isCharging1 && !isEvasionHit1 && !isSwordsDance1 && !isWhirlwind1);

  let act1Frames: any[] = [];
  if (isStatusMove1) {
    // Dedicated Status / Healing / Buff / Debuff Animation: Pulses on own platform without contacting opponent!
    act1Frames = [
      // 1. Caster gathers energy on home platform (66ms x 2 = 132ms)
      {
        delay: 66,
        pOffset: isP1 ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP1 ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP1 ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP1 ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp: enemy.hp,
        playerHp: playerMon.hp,
        textLineIdx: 1,
        isBlur: false,
        moveEffect: a1,
      },
      {
        delay: 66,
        pOffset: isP1 ? { x: 0, y: -8 } : { x: 0, y: 0 },
        eOffset: !isP1 ? { x: 0, y: -8 } : { x: 0, y: 0 },
        pScale: isP1 ? { x: 1.12, y: 0.90 } : undefined,
        eScale: !isP1 ? { x: 1.12, y: 0.90 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp: enemy.hp,
        playerHp: playerMon.hp,
        textLineIdx: 1,
        isBlur: false,
        moveEffect: a1,
      },
      // 2. Status pulse & settle on home platform (66ms x 2 = 132ms)
      {
        delay: 66,
        pOffset: isP1 ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP1 ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP1 ? { x: 0.96, y: 1.06 } : undefined,
        eScale: !isP1 ? { x: 0.96, y: 1.06 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp: a1.enemyHpAfter,
        playerHp: a1.playerHpAfter,
        textLineIdx: 1,
        isBlur: false,
        moveEffect: a1,
      },
      {
        delay: 66,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a1.enemyHpAfter,
        playerHp: a1.playerHpAfter,
        textLineIdx: 1,
        isBlur: false,
        moveEffect: a1,
      }
    ];
  } else if (isChop1) {
      act1Frames = [
        // 1A: Hand appears hovering above target head (130ms)
        {
          delay: 130,
          pOffset: isP1 ? { x: 12, y: -5 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -12, y: 5 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 1B: 살짝 아래로 틱 내려감 (140ms)
        {
          delay: 140,
          pOffset: isP1 ? { x: 16, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -16, y: 6 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // 1C: 위로 살짝 올라갔다가 멈칫 장전 (150ms)
        {
          delay: 150,
          pOffset: isP1 ? { x: 18, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -18, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        },
        // 1D: 팍! 하고 내려침 (240ms)
        {
          delay: 240,
          pOffset: isP1 ? { x: 20, y: -10 } : { x: -8, y: 4 },
          eOffset: isP1 ? { x: 8, y: -2 } : { x: -20, y: 10 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 4,
        }
      ];
    } else if (isSlap1) {
      const hits = Math.min(5, Math.max(2, a1.hitCount || 3));
      act1Frames = [
        // Windup lunge
        {
          delay: 150,
          pOffset: isP1 ? { x: 14, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -14, y: 6 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // Alternating Left / Right Cheek Slaps (Strike Impact -> Follow-through Fade Out)
        ...Array.from({ length: hits }).flatMap((_, idx) => [
          // Sub-frame A: Strike Impact (Full Opacity + Hit Flash)
          {
            delay: 140,
            pOffset: isP1 ? { x: 22, y: -8 } : { x: -6, y: 3 },
            eOffset: isP1
              ? { x: (idx % 2 === 0 ? 10 : -8), y: (idx % 2 === 0 ? -3 : 3) }
              : { x: -22, y: 8 },
            showEffect: true,
            hitFlash: true,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 1,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a1,
            moveStep: idx * 2 + 1,
          },
          // Sub-frame B: Follow-through Fade Out (Gradual Transparency)
          {
            delay: 130,
            pOffset: isP1 ? { x: 16, y: -6 } : { x: -3, y: 1 },
            eOffset: isP1
              ? { x: (idx % 2 === 0 ? 4 : -4), y: 0 }
              : { x: -16, y: 6 },
            showEffect: true,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 1,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a1,
            moveStep: idx * 2 + 2,
          }
        ])
      ];
    } else if (isPunch1) {
      const hits = Math.min(5, Math.max(2, a1.hitCount || 3));
      act1Frames = [
        // Windup dash lunge
        {
          delay: 150,
          pOffset: isP1 ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 3-Punch Barrage (Strike Impact -> Follow-through Fade Out)
        ...Array.from({ length: hits }).flatMap((_, idx) => [
          // Sub-frame A: Strike Impact (Full Opacity + Hit Flash)
          {
            delay: 140,
            pOffset: isP1 ? { x: 22, y: -8 } : { x: -6, y: 3 },
            eOffset: isP1
              ? { x: (idx % 2 === 0 ? 10 : -8), y: (idx % 2 === 0 ? -3 : 3) }
              : { x: -22, y: 8 },
            showEffect: true,
            hitFlash: true,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 1,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a1,
            moveStep: idx * 2 + 1,
          },
          // Sub-frame B: Follow-through Fade Out (Gradual Transparency)
          {
            delay: 130,
            pOffset: isP1 ? { x: 16, y: -6 } : { x: -3, y: 1 },
            eOffset: isP1
              ? { x: (idx % 2 === 0 ? 4 : -4), y: 0 }
              : { x: -16, y: 6 },
            showEffect: true,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 1,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a1,
            moveStep: idx * 2 + 2,
          }
        ])
      ];
    } else if (isMegaPunch1) {
      act1Frames = [
        // Step 1: Big Yellow Ring appears around target (130ms)
        {
          delay: 130,
          pOffset: isP1 ? { x: 12, y: -5 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -12, y: 5 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // Step 2: Yellow Ring rapidly contracts/shrinks towards target (130ms)
        {
          delay: 130,
          pOffset: isP1 ? { x: 16, y: -7 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -16, y: 7 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // Step 3: Ring shrunk tiny + Heavy Punch Strikes + Hit Flash (220ms)
        {
          delay: 220,
          pOffset: isP1 ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: isP1 ? { x: 10, y: -3 } : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        },
        // Step 4: Ring expands outward like a ripple wave (130ms)
        {
          delay: 130,
          pOffset: isP1 ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: isP1 ? { x: 5, y: -1 } : { x: -16, y: 6 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 4,
        },
        // Step 5: Wave expands further and dissipates (120ms)
        {
          delay: 120,
          pOffset: isP1 ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: isP1 ? { x: 2, y: 0 } : { x: -10, y: 3 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 5,
        }
      ];
    } else if (isPayDay1) {
      act1Frames = [
        // 1. Windup lunge (150ms)
        {
          delay: 150,
          pOffset: isP1 ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
        },
        // 2. Step 1: Coins impact cluster + Hit Flash (200ms)
        {
          delay: 200,
          pOffset: isP1 ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: isP1 ? { x: 10, y: -3 } : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 3. Step 2: Coins scatter outward (140ms)
        {
          delay: 140,
          pOffset: isP1 ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: isP1 ? { x: 5, y: -1 } : { x: -16, y: 6 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // 4. Step 3: Coins disperse far & fade transparently (130ms)
        {
          delay: 130,
          pOffset: isP1 ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: isP1 ? { x: 2, y: 0 } : { x: -10, y: 3 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        }
      ];
    } else if (isFirePunch1) {
      act1Frames = [
        // 1. Windup lunge (150ms)
        {
          delay: 150,
          pOffset: isP1 ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
        },
        // 2. Step 1: Direct Fire Punch Impact (200ms) with Hit Flash
        {
          delay: 200,
          pOffset: isP1 ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: isP1 ? { x: 10, y: -3 } : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 3. Step 2: Flames Burst & Scatter Outward (140ms)
        {
          delay: 140,
          pOffset: isP1 ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: isP1 ? { x: 5, y: -1 } : { x: -16, y: 6 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // 4. Step 3: Flames Disperse Far & Dissipate (130ms)
        {
          delay: 130,
          pOffset: isP1 ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: isP1 ? { x: 2, y: 0 } : { x: -10, y: 3 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        }
      ];
    } else if (isIcePunch1) {
      act1Frames = [
        // 1. Windup lunge (150ms)
        {
          delay: 150,
          pOffset: isP1 ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
        },
        // 2. Step 1: Direct Glacial Strike + 6 Ice Crystals Form + Hit Flash (200ms)
        {
          delay: 200,
          pOffset: isP1 ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: isP1 ? { x: 10, y: -3 } : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 3. Step 2: Ice Crystals Shatter & Expand Radially (140ms)
        {
          delay: 140,
          pOffset: isP1 ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: isP1 ? { x: 5, y: -1 } : { x: -16, y: 6 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // 4. Step 3: Crystals Disperse Far & Dissipate (130ms)
        {
          delay: 130,
          pOffset: isP1 ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: isP1 ? { x: 2, y: 0 } : { x: -10, y: 3 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        }
      ];
    } else if (isGuillotine1) {
      const isHit1 = a1.isHit !== undefined ? a1.isHit : ((a1.damage ?? 0) > 0 || (!a1.log?.includes("빗나갔다") && !a1.log?.includes("missed") && !a1.log?.includes("빗나가")));
      const isMiss1 = !isHit1;
      act1Frames = [
        // 1. Windup stance - In place (120ms)
        {
          delay: 120,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
        },
        // 2. Step 1: First Diagonal Slash [/] (160ms)
        {
          delay: 160,
          pOffset: isP1 ? { x: 0, y: 0 } : (isMiss1 ? { x: 26, y: 4 } : { x: -4, y: 2 }),
          eOffset: isP1 ? (isMiss1 ? { x: 26, y: -4 } : { x: 6, y: -2 }) : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          usePlayerFront: isP1,
          useEnemyBack: !isP1,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 3. Step 2: Second Diagonal Slash [\] (160ms)
        {
          delay: 160,
          pOffset: isP1 ? { x: 0, y: 0 } : (isMiss1 ? { x: 24, y: 3 } : { x: -6, y: 3 }),
          eOffset: isP1 ? (isMiss1 ? { x: 24, y: -3 } : { x: 8, y: -3 }) : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          usePlayerFront: isP1,
          useEnemyBack: !isP1,
          enemyHp: isHit1 ? enemy.hp : a1.enemyHpAfter,
          playerHp: isHit1 ? playerMon.hp : a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        ...(isHit1 ? [
          // 4. Step 3: FATAL FULL [X] SCISSOR EXECUTION CRASH (260ms)
          {
            delay: 260,
            pOffset: isP1 ? { x: 0, y: 0 } : { x: -12, y: 4 },
            eOffset: isP1 ? { x: 12, y: -4 } : { x: 0, y: 0 },
            showEffect: true,
            hitFlash: true,
            usePlayerFront: isP1,
            useEnemyBack: !isP1,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 1,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a1,
            moveStep: 3,
          },
          // 5. Step 4: Red [X] Dissipation (140ms)
          {
            delay: 140,
            pOffset: isP1 ? { x: 0, y: 0 } : { x: -4, y: 1 },
            eOffset: isP1 ? { x: 4, y: 0 } : { x: 0, y: 0 },
            showEffect: true,
            hitFlash: false,
            usePlayerFront: isP1,
            useEnemyBack: !isP1,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 1,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a1,
            moveStep: 4,
          }
        ] : [
          // On Miss: Defender slides smoothly back to center (180ms)
          {
            delay: 180,
            pOffset: !isP1 ? { x: 8, y: 1 } : { x: 0, y: 0 },
            eOffset: isP1 ? { x: 8, y: -1 } : { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            usePlayerFront: isP1,
            useEnemyBack: !isP1,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 1,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a1,
          }
        ])
      ];
    } else if (isSwordsDance1) {
      act1Frames = [
        // 1. Low 3D Orbit around Waist (120ms)
        {
          delay: 120,
          pOffset: isP1 ? { x: 0, y: -2 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: 0, y: -2 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 2. Ascending 3D Orbit - 1st Spin (120ms)
        {
          delay: 120,
          pOffset: isP1 ? { x: 0, y: -4 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: 0, y: -4 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // 3. Mid-High 3D Orbit - 2nd Spin (120ms)
        {
          delay: 120,
          pOffset: isP1 ? { x: 0, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: 0, y: -6 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        },
        // 4. High 3D Orbit & Inward Tilt toward Apex (130ms)
        {
          delay: 130,
          pOffset: isP1 ? { x: 0, y: -7 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: 0, y: -7 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 4,
        },
        // 5. Swords Clash & Tips Touch at ONE Point above Head (240ms)
        {
          delay: 240,
          pOffset: isP1 ? { x: 0, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: 0, y: -8 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 5,
        },
        // 6. Power Dispersal & Aura Rise (140ms)
        {
          delay: 140,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 6,
        }
      ];
    } else if (isFly1) {
      const isHit1 = a1.isHit !== undefined ? a1.isHit : ((a1.damage ?? 0) > 0 || (!a1.log?.includes("빗나갔다") && !a1.log?.includes("missed") && !a1.log?.includes("빗나가")));
      const isMiss1 = !isHit1;
      const isTurn1Launch = (a1.damage ?? 0) === 0 && (a1.log?.includes("날아올랐다") || a1.log?.includes("flew up"));

      if (isTurn1Launch) {
        // Turn 1: 15 FPS Cinematic Launch (Zoom-in close-up -> Rocket Liftoff -> Stratosphere Ascent -> Vanish)
        act1Frames = [
          // 1. Dynamic Close-Up on Attacker & Deep Crouch Preparation (66ms x 3 = 200ms)
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: 2 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: 2 } : { x: 0, y: 0 },
            pScale: isP1 ? { x: 1.10, y: 0.92 } : undefined,
            eScale: !isP1 ? { x: 1.10, y: 0.92 } : undefined,
            cameraZoom: 1.45,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP1,
            pWhite: false,
            eWhite: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: 6 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: 6 } : { x: 0, y: 0 },
            pScale: isP1 ? { x: 1.25, y: 0.80 } : undefined,
            eScale: !isP1 ? { x: 1.25, y: 0.80 } : undefined,
            cameraZoom: 1.60,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP1,
            pWhite: false,
            eWhite: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: 8 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: 8 } : { x: 0, y: 0 },
            pScale: isP1 ? { x: 1.30, y: 0.75 } : undefined,
            eScale: !isP1 ? { x: 1.30, y: 0.75 } : undefined,
            cameraZoom: 1.70,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP1,
            pWhite: false,
            eWhite: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          // 2. Rocket Sky Launch & Camera Dynamic Tracking Upward into Stratosphere! (66ms x 4 = 264ms)
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: -60 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: -60 } : { x: 0, y: 0 },
            pScale: isP1 ? { x: 0.65, y: 1.45 } : undefined,
            eScale: !isP1 ? { x: 0.65, y: 1.45 } : undefined,
            cameraZoom: 1.60,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP1,
            pWhite: isP1,
            eWhite: !isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: -140 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: -140 } : { x: 0, y: 0 },
            pScale: isP1 ? { x: 0.45, y: 1.85 } : undefined,
            eScale: !isP1 ? { x: 0.45, y: 1.85 } : undefined,
            cameraZoom: 1.50,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP1,
            pWhite: isP1,
            eWhite: !isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: -240 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: -240 } : { x: 0, y: 0 },
            pScale: isP1 ? { x: 0.35, y: 2.10 } : undefined,
            eScale: !isP1 ? { x: 0.35, y: 2.10 } : undefined,
            cameraZoom: 1.38,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP1,
            pWhite: isP1,
            eWhite: !isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: -360 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: -360 } : { x: 0, y: 0 },
            pScale: isP1 ? { x: 0.28, y: 2.30 } : undefined,
            eScale: !isP1 ? { x: 0.28, y: 2.30 } : undefined,
            cameraZoom: 1.25,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP1,
            pWhite: isP1,
            eWhite: !isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          // 3. Stratosphere Piercing & Neutral Reset (66ms x 2 = 132ms)
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: -520 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: -520 } : { x: 0, y: 0 },
            pScale: isP1 ? { x: 0.20, y: 2.50 } : undefined,
            eScale: !isP1 ? { x: 0.20, y: 2.50 } : undefined,
            cameraZoom: 1.10,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP1,
            pWhite: isP1,
            eWhite: !isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          }
        ];
      } else {
        // Turn 2: 15 FPS Subtle Lo
        act1Frames = [
          // 1. Target Battlefield Warning Shadow (66ms x 3 = 200ms)
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            hidePlayer: isP1,
            hideEnemy: !isP1,
            hidePShadow: isP1,
            hideEShadow: !isP1,
            loomingShadow: { offsetY: -25, w: 12, h: 4, alpha: 0.35 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            hidePlayer: isP1,
            hideEnemy: !isP1,
            hidePShadow: isP1,
            hideEShadow: !isP1,
            loomingShadow: { offsetY: -12, w: 20, h: 6, alpha: 0.55 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            pOffset: isP1 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            hidePlayer: isP1,
            hideEnemy: !isP1,
            hidePShadow: isP1,
            hideEShadow: !isP1,
            loomingShadow: { offsetY: 0, w: 28, h: 9, alpha: 0.75 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },

          // 2. High Sky Supersonic Vertical Nose-Dive Cutscene (66ms x 4 = 264ms)
          {
            delay: 66,
            diveStep: 1,
            pOffset: { x: 0, y: -110 },
            eOffset: { x: 0, y: -110 },
            pScale: isP1 ? { x: 0.65, y: 1.45 } : undefined,
            eScale: !isP1 ? { x: 0.65, y: 1.45 } : undefined,
            pRot: 0,
            eRot: 0,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            diveStep: 2,
            pOffset: { x: 0, y: -30 },
            eOffset: { x: 0, y: -30 },
            pScale: isP1 ? { x: 0.52, y: 1.75 } : undefined,
            eScale: !isP1 ? { x: 0.52, y: 1.75 } : undefined,
            pRot: 0,
            eRot: 0,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            diveStep: 3,
            pOffset: { x: 0, y: 55 },
            eOffset: { x: 0, y: 55 },
            pScale: isP1 ? { x: 0.42, y: 2.10 } : undefined,
            eScale: !isP1 ? { x: 0.42, y: 2.10 } : undefined,
            pRot: 0,
            eRot: 0,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            diveStep: 4,
            pOffset: { x: 0, y: 155 },
            eOffset: { x: 0, y: 155 },
            pScale: isP1 ? { x: 0.32, y: 2.50 } : undefined,
            eScale: !isP1 ? { x: 0.32, y: 2.50 } : undefined,
            pRot: 0,
            eRot: 0,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },

          // 3. Battlefield Arena Vertical Nose-Dive Plunge (66ms x 2 = 132ms)
          {
            delay: 66,
            pOffset: isP1 ? { x: 268, y: -360 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: -268, y: -160 } : { x: 0, y: 0 },
            pScale: isP1 ? { x: 0.40, y: 2.00 } : undefined,
            eScale: !isP1 ? { x: 0.40, y: 2.00 } : undefined,
            pRot: 0,
            eRot: 0,
            loomingShadow: { offsetY: 0, w: 28, h: 9, alpha: 0.85 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },
          {
            delay: 66,
            pOffset: isP1 ? { x: 268, y: -180 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: -268, y: 40 } : { x: 0, y: 0 },
            pScale: isP1 ? { x: 0.30, y: 2.40 } : undefined,
            eScale: !isP1 ? { x: 0.30, y: 2.40 } : undefined,
            pRot: 0,
            eRot: 0,
            loomingShadow: { offsetY: 0, w: 34, h: 11, alpha: 1.0 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP1,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemy.hp,
            playerHp: playerMon.hp,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          },

          // 4. Ground Arena Vertical Dive-Bomb Impact Slam (66ms x 3 = 200ms)
          {
            delay: 66,
            pOffset: isP1 ? { x: 268, y: -139 } : (isMiss1 ? { x: 20, y: 4 } : { x: -8, y: 4 }),
            eOffset: isP1 ? (isMiss1 ? { x: 20, y: -4 } : { x: 8, y: -4 }) : { x: -268, y: 149 },
            pScale: isP1 ? { x: 1.35, y: 0.65 } : undefined,
            eScale: !isP1 ? { x: 1.35, y: 0.65 } : undefined,
            pRot: 0,
            eRot: 0,
            pWhite: false,
            eWhite: false,
            isHighSkyCutscene: false,
            showEffect: true,
            hitFlash: isHit1,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
            moveStep: 3,
          },
          {
            delay: 66,
            pOffset: isP1 ? { x: 134, y: -30 } : { x: 0, y: 0 },
            eOffset: !isP1 ? { x: -134, y: 30 } : { x: 0, y: 0 },
            pScale: isP1 ? { x: 1.10, y: 0.92 } : undefined,
            eScale: !isP1 ? { x: 1.10, y: 0.92 } : undefined,
            isHighSkyCutscene: false,
            showEffect: true,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
            moveStep: 4,
          },
          {
            delay: 66,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            isHighSkyCutscene: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 1,
            isBlur: false,
            moveEffect: a1,
          }
        ];
      }
    } else if (isRazorWind1) {
      const isHit1 = a1.isHit !== undefined ? a1.isHit : ((a1.damage ?? 0) > 0 || (!a1.log?.includes("빗나갔다") && !a1.log?.includes("missed") && !a1.log?.includes("빗나가")));
      const isMiss1 = !isHit1;
      act1Frames = [
        // 1. Helical Spiral Orbit around Attacker (150ms)
        {
          delay: 150,
          pOffset: isP1 ? { x: 4, y: -2 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -4, y: 2 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 2. Swirl Dissolving & Fading Out at Attacker (150ms)
        {
          delay: 150,
          pOffset: isP1 ? { x: 6, y: -3 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -6, y: 3 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // 3. Faint Translucent Opposite Pairs Spawning at Defender (150ms)
        {
          delay: 150,
          pOffset: isP1 ? { x: 8, y: -4 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -8, y: 4 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        },
        // 4. Blades Closing In & Becoming Denser from All Opposing Sides (170ms)
        {
          delay: 170,
          pOffset: isP1 ? { x: 12, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -12, y: 6 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 4,
        },
        // 5. Full Omnidirectional 8-Way Cleave Storm Impact (240ms)
        {
          delay: 240,
          pOffset: isP1 ? { x: 14, y: -7 } : (isMiss1 ? { x: 26, y: 4 } : { x: -6, y: 3 }),
          eOffset: isP1 ? (isMiss1 ? { x: 26, y: -4 } : { x: 10, y: -3 }) : { x: -14, y: 7 },
          showEffect: true,
          hitFlash: isHit1,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 5,
        },
        // 6. Gentle Shard Fade-Out Dispersal (140ms)
        {
          delay: 140,
          pOffset: isP1 ? { x: 4, y: -2 } : { x: 0, y: 0 },
          eOffset: isP1 ? { x: 2, y: 0 } : { x: -4, y: 2 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 6,
        }
      ];
    } else if (isWingAttack1) {
      const isHit1 = a1.isHit !== undefined ? a1.isHit : ((a1.damage ?? 0) > 0 || (!a1.log?.includes("빗나갔다") && !a1.log?.includes("missed") && !a1.log?.includes("빗나가")));
      const isMiss1 = !isHit1;
      act1Frames = [
        // 1. Dive Lunge (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 180, y: -90 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -180, y: 90 } : { x: 0, y: 0 },
          pScale: isP1 ? { x: 1.40, y: 0.45 } : undefined,
          eScale: !isP1 ? { x: 1.40, y: 0.45 } : undefined,
          pRot: isP1 ? -0.22 : undefined,
          eRot: !isP1 ? 0.22 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 2. Direct Contact Strike & Feather Burst (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 260, y: -138 } : (isMiss1 ? { x: 26, y: 4 } : { x: -8, y: 4 }),
          eOffset: isP1 ? (isMiss1 ? { x: 26, y: -4 } : { x: 12, y: -4 }) : { x: -260, y: 138 },
          pScale: isP1 ? { x: 1.35, y: 0.48 } : undefined,
          eScale: !isP1 ? { x: 1.35, y: 0.48 } : undefined,
          pRot: isP1 ? -0.22 : undefined,
          eRot: !isP1 ? 0.22 : undefined,
          showEffect: true,
          hitFlash: isHit1,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // 3. Piercing Fly-Through Off-Screen (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 450, y: -245 } : (isMiss1 ? { x: 16, y: 2 } : { x: -4, y: 2 }),
          eOffset: isP1 ? (isMiss1 ? { x: 16, y: -2 } : { x: 6, y: -2 }) : { x: -450, y: 245 },
          pScale: isP1 ? { x: 1.45, y: 0.38 } : undefined,
          eScale: !isP1 ? { x: 1.45, y: 0.38 } : undefined,
          pRot: isP1 ? -0.25 : undefined,
          eRot: !isP1 ? 0.25 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        },
        // 4. Swooping Re-entry from Bottom-Left (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: -50, y: 24 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: 50, y: -24 } : { x: 0, y: 0 },
          pScale: isP1 ? { x: 1.20, y: 0.70 } : undefined,
          eScale: !isP1 ? { x: 1.20, y: 0.70 } : undefined,
          pRot: isP1 ? -0.12 : undefined,
          eRot: !isP1 ? 0.12 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 4,
        },
        // 5. Clean Landing Touchdown (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 4,
        }
      ];
    } else if (isWhirlwind1) {
      const isHit1 = a1.isHit !== undefined ? a1.isHit : ((a1.damage ?? 0) > 0 || (!a1.log?.includes("빗나갔다") && !a1.log?.includes("missed") && !a1.log?.includes("빗나가")));
      const isMiss1 = !isHit1;
      act1Frames = [
        // 1. Cyclone Inception & Rising Float (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 12, y: -4 } : (isMiss1 ? { x: -26, y: 4 } : { x: 0, y: -30 }),
          eOffset: isP1 ? (isMiss1 ? { x: 26, y: -4 } : { x: 0, y: -30 }) : { x: -12, y: 4 },
          pRot: isP1 ? undefined : (isMiss1 ? undefined : -0.55),
          eRot: isP1 ? (isMiss1 ? undefined : 0.55) : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 2. Towering Cyclone Surge & Mid-Air Spin (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 16, y: -6 } : (isMiss1 ? { x: -26, y: 4 } : { x: -10, y: -130 }),
          eOffset: isP1 ? (isMiss1 ? { x: 26, y: -4 } : { x: 10, y: -130 }) : { x: -16, y: 6 },
          pRot: isP1 ? undefined : (isMiss1 ? undefined : -2.6),
          eRot: isP1 ? (isMiss1 ? undefined : 2.6) : undefined,
          showEffect: true,
          hitFlash: isHit1,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // 3. Roaring Sky Vortex Off-Screen Ejection (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 10, y: -3 } : (isMiss1 ? { x: -16, y: 2 } : { x: -6, y: -260 }),
          eOffset: isP1 ? (isMiss1 ? { x: 16, y: -2 } : { x: 6, y: -260 }) : { x: -10, y: 3 },
          pRot: isP1 ? undefined : (isMiss1 ? undefined : -5.8),
          eRot: isP1 ? (isMiss1 ? undefined : 5.8) : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        },
        // 4. Cyclone Dissipates & Soft Float Down (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 4, y: 0 } : { x: 0, y: -70 },
          eOffset: isP1 ? { x: 0, y: -70 } : { x: -4, y: 0 },
          pRot: isP1 ? undefined : -0.20,
          eRot: isP1 ? 0.20 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 4,
        },
        // 5. Clean Ground Touchdown (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 4,
        }
      ];
    } else if (isSingleStrikeSpecial1) {
      const isHit1 = a1.isHit !== undefined ? a1.isHit : ((a1.damage ?? 0) > 0 || (!a1.log?.includes("빗나갔다") && !a1.log?.includes("missed") && !a1.log?.includes("빗나가")));
      const isMiss1 = !isHit1;
      act1Frames = [
        // 1. Windup Lunge (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 18, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP1 ? { x: -18, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
        },
        // 2. Direct Strike Impact (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 22, y: -9 } : (isMiss1 ? { x: 26, y: 4 } : { x: -14, y: 4 }),
          eOffset: isP1 ? (isMiss1 ? { x: 26, y: -4 } : { x: 14, y: -4 }) : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: isHit1,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 3. Effect Action (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 14, y: -5 } : (isMiss1 ? { x: 16, y: 2 } : { x: -8, y: 2 }),
          eOffset: isP1 ? (isMiss1 ? { x: 16, y: -2 } : { x: 8, y: -2 }) : { x: -14, y: 5 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // 4. Recovery (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        }
      ];
    } else {
      const isHit1 = a1.isHit !== undefined ? a1.isHit : ((a1.damage ?? 0) > 0 || (!a1.log?.includes("빗나갔다") && !a1.log?.includes("missed") && !a1.log?.includes("빗나가")));
      const isMiss1 = !isHit1;
      act1Frames = [
        // 1. Standard Windup (100ms)
        {
          delay: 100,
          pOffset: isP1 ? (a1.isSpecial ? { x: 0, y: -6 } : { x: 18, y: -8 }) : { x: 0, y: 0 },
          eOffset: !isP1 ? (a1.isSpecial ? { x: 0, y: -6 } : { x: -18, y: 8 }) : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 2. Standard Strike Impact (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 22, y: -9 } : (isMiss1 ? { x: 26, y: 4 } : { x: -14, y: 4 }),
          eOffset: isP1 ? (isMiss1 ? { x: 26, y: -4 } : { x: 14, y: -4 }) : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: isHit1,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // 3. Recoil Shake (100ms)
        {
          delay: 100,
          pOffset: isP1 ? { x: 12, y: -4 } : (isMiss1 ? { x: 12, y: 2 } : { x: -6, y: 2 }),
          eOffset: isP1 ? (isMiss1 ? { x: 12, y: -2 } : { x: 6, y: -2 }) : { x: -12, y: 4 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        },
        // 4. Recovery (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          isBlur: false,
          moveEffect: a1,
        }
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
    const isStatusMove2 = moveData2?.category === "status" || (a2 as any).category === "status" || ((a2.damage ?? 0) === 0 && !isCharging2 && !isEvasionHit2 && !isSwordsDance2 && !isWhirlwind2);

    let act2Frames: any[] = [];
    if (isStatusMove2) {
      // Dedicated Status / Healing / Buff / Debuff Animation: Pulses on own platform without contacting opponent!
      act2Frames = [
        // 1. Caster gathers energy on home platform (66ms x 2 = 132ms)
        {
          delay: 66,
          pOffset: isP2 ? { x: 0, y: -4 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: 0, y: -4 } : { x: 0, y: 0 },
          pScale: isP2 ? { x: 1.06, y: 0.94 } : undefined,
          eScale: !isP2 ? { x: 1.06, y: 0.94 } : undefined,
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
        },
        {
          delay: 66,
          pOffset: isP2 ? { x: 0, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: 0, y: -8 } : { x: 0, y: 0 },
          pScale: isP2 ? { x: 1.12, y: 0.90 } : undefined,
          eScale: !isP2 ? { x: 1.12, y: 0.90 } : undefined,
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
        },
        // 2. Status pulse & settle on home platform (66ms x 2 = 132ms)
        {
          delay: 66,
          pOffset: isP2 ? { x: 0, y: -4 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: 0, y: -4 } : { x: 0, y: 0 },
          pScale: isP2 ? { x: 0.96, y: 1.06 } : undefined,
          eScale: !isP2 ? { x: 0.96, y: 1.06 } : undefined,
          showEffect: false,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
        },
        {
          delay: 66,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
        }
      ];
    } else if (isChop2) {
      act2Frames = [
        // 2A: Hand appears hovering above player (130ms)
        {
          delay: 130,
          pOffset: isP2 ? { x: 12, y: -5 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -12, y: 5 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 2B: 살짝 아래로 틱 내려감 (140ms)
        {
          delay: 140,
          pOffset: isP2 ? { x: 16, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -16, y: 6 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // 2C: 위로 살짝 올라갔다가 멈칫 장전 (150ms)
        {
          delay: 150,
          pOffset: isP2 ? { x: 18, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -18, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        },
        // 2D: 팍! 하고 내려침 (240ms)
        {
          delay: 240,
          pOffset: isP2 ? { x: 20, y: -10 } : { x: -8, y: 4 },
          eOffset: !isP2 ? { x: -20, y: 10 } : { x: 8, y: -2 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 4,
        }
      ];
    } else if (isSlap2) {
      const hits2 = Math.min(5, Math.max(2, a2.hitCount || 3));
      act2Frames = [
        // Windup lunge
        {
          delay: 150,
          pOffset: isP2 ? { x: 14, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -14, y: 6 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // Alternating Left / Right Cheek Slaps (Strike Impact -> Follow-through Fade Out)
        ...Array.from({ length: hits2 }).flatMap((_, idx) => [
          // Sub-frame A: Strike Impact (Full Opacity + Hit Flash)
          {
            delay: 140,
            pOffset: !isP2
              ? { x: (idx % 2 === 0 ? 10 : -8), y: (idx % 2 === 0 ? -3 : 3) }
              : { x: 22, y: -8 },
            eOffset: !isP2 ? { x: -22, y: 8 } : { x: 6, y: -3 },
            showEffect: true,
            hitFlash: true,
            enemyHp: a2.enemyHpAfter,
            playerHp: a2.playerHpAfter,
            textLineIdx: 3,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a2,
            moveStep: idx * 2 + 1,
          },
          // Sub-frame B: Follow-through Fade Out (Gradual Transparency)
          {
            delay: 130,
            pOffset: !isP2
              ? { x: (idx % 2 === 0 ? 4 : -4), y: 0 }
              : { x: 16, y: -6 },
            eOffset: !isP2 ? { x: -16, y: 6 } : { x: 3, y: -1 },
            showEffect: true,
            hitFlash: false,
            enemyHp: a2.enemyHpAfter,
            playerHp: a2.playerHpAfter,
            textLineIdx: 3,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a2,
            moveStep: idx * 2 + 2,
          }
        ])
      ];
    } else if (isPunch2) {
      const hits2 = Math.min(5, Math.max(2, a2.hitCount || 3));
      act2Frames = [
        // Windup dash lunge
        {
          delay: 150,
          pOffset: isP2 ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 3-Punch Barrage (Strike Impact -> Follow-through Fade Out)
        ...Array.from({ length: hits2 }).flatMap((_, idx) => [
          // Sub-frame A: Strike Impact (Full Opacity + Hit Flash)
          {
            delay: 140,
            pOffset: !isP2
              ? { x: (idx % 2 === 0 ? 10 : -8), y: (idx % 2 === 0 ? -3 : 3) }
              : { x: 22, y: -8 },
            eOffset: !isP2 ? { x: -22, y: 8 } : { x: 6, y: -3 },
            showEffect: true,
            hitFlash: true,
            enemyHp: a2.enemyHpAfter,
            playerHp: a2.playerHpAfter,
            textLineIdx: 3,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a2,
            moveStep: idx * 2 + 1,
          },
          // Sub-frame B: Follow-through Fade Out (Gradual Transparency)
          {
            delay: 130,
            pOffset: !isP2
              ? { x: (idx % 2 === 0 ? 4 : -4), y: 0 }
              : { x: 16, y: -6 },
            eOffset: !isP2 ? { x: -16, y: 6 } : { x: 3, y: -1 },
            showEffect: true,
            hitFlash: false,
            enemyHp: a2.enemyHpAfter,
            playerHp: a2.playerHpAfter,
            textLineIdx: 3,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a2,
            moveStep: idx * 2 + 2,
          }
        ])
      ];
    } else if (isMegaPunch2) {
      act2Frames = [
        // Step 1: Big Yellow Ring appears around target (130ms)
        {
          delay: 130,
          pOffset: isP2 ? { x: 12, y: -5 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -12, y: 5 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // Step 2: Yellow Ring rapidly contracts/shrinks towards target (130ms)
        {
          delay: 130,
          pOffset: isP2 ? { x: 16, y: -7 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -16, y: 7 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // Step 3: Ring shrunk tiny + Heavy Punch Strikes + Hit Flash (220ms)
        {
          delay: 220,
          pOffset: isP2 ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: !isP2 ? { x: -22, y: 9 } : { x: 10, y: -3 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        },
        // Step 4: Ring expands outward like a ripple wave (130ms)
        {
          delay: 130,
          pOffset: isP2 ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: !isP2 ? { x: -16, y: 6 } : { x: 5, y: -1 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 4,
        },
        // Step 5: Wave expands further and dissipates (120ms)
        {
          delay: 120,
          pOffset: isP2 ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -10, y: 3 } : { x: 2, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 5,
        }
      ];
    } else if (isPayDay2) {
      act2Frames = [
        // 1. Counter Windup lunge (150ms)
        {
          delay: 150,
          pOffset: isP2 ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
        },
        // 2. Step 1: Coins impact cluster + Hit Flash (200ms)
        {
          delay: 200,
          pOffset: isP2 ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: !isP2 ? { x: -22, y: 9 } : { x: 10, y: -3 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 3. Step 2: Coins scatter outward (140ms)
        {
          delay: 140,
          pOffset: isP2 ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: !isP2 ? { x: -16, y: 6 } : { x: 5, y: -1 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // 4. Step 3: Coins disperse far & fade transparently (130ms)
        {
          delay: 130,
          pOffset: isP2 ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -10, y: 3 } : { x: 2, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        }
      ];
    } else if (isFirePunch2) {
      act2Frames = [
        // 1. Counter Windup lunge (150ms)
        {
          delay: 150,
          pOffset: isP2 ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
        },
        // 2. Step 1: Direct Fire Punch Impact (200ms) with Hit Flash
        {
          delay: 200,
          pOffset: isP2 ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: !isP2 ? { x: -22, y: 9 } : { x: 10, y: -3 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 3. Step 2: Flames Burst & Scatter Outward (140ms)
        {
          delay: 140,
          pOffset: isP2 ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: !isP2 ? { x: -16, y: 6 } : { x: 5, y: -1 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // 4. Step 3: Flames Disperse Far & Dissipate (130ms)
        {
          delay: 130,
          pOffset: isP2 ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -10, y: 3 } : { x: 2, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        }
      ];
    } else if (isIcePunch2) {
      act2Frames = [
        // 1. Counter Windup lunge (150ms)
        {
          delay: 150,
          pOffset: isP2 ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
        },
        // 2. Step 1: Direct Glacial Strike + 6 Ice Crystals Form + Hit Flash (200ms)
        {
          delay: 200,
          pOffset: isP2 ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: !isP2 ? { x: -22, y: 9 } : { x: 10, y: -3 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 3. Step 2: Ice Crystals Shatter & Expand Radially (140ms)
        {
          delay: 140,
          pOffset: isP2 ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: !isP2 ? { x: -16, y: 6 } : { x: 5, y: -1 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // 4. Step 3: Crystals Disperse Far & Dissipate (130ms)
        {
          delay: 130,
          pOffset: isP2 ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -10, y: 3 } : { x: 2, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        }
      ];
    } else if (isGuillotine2) {
      const isHit2 = a2.isHit !== undefined ? a2.isHit : ((a2.damage ?? 0) > 0 || (!a2.log?.includes("빗나갔다") && !a2.log?.includes("missed") && !a2.log?.includes("빗나가")));
      const isMiss2 = !isHit2;
      act2Frames = [
        // 1. Counter Windup stance - In place (120ms)
        {
          delay: 120,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
        },
        // 2. Step 1: First Diagonal Slash [/] (160ms)
        {
          delay: 160,
          pOffset: isP2 ? { x: 0, y: 0 } : (isMiss2 ? { x: 26, y: 4 } : { x: -4, y: 2 }),
          eOffset: isP2 ? (isMiss2 ? { x: 26, y: -4 } : { x: 6, y: -2 }) : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          usePlayerFront: isP2,
          useEnemyBack: !isP2,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 3. Step 2: Second Diagonal Slash [\] (160ms)
        {
          delay: 160,
          pOffset: isP2 ? { x: 0, y: 0 } : (isMiss2 ? { x: 24, y: 3 } : { x: -6, y: 3 }),
          eOffset: isP2 ? (isMiss2 ? { x: 24, y: -3 } : { x: 8, y: -3 }) : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          usePlayerFront: isP2,
          useEnemyBack: !isP2,
          enemyHp: isHit2 ? a1.enemyHpAfter : a2.enemyHpAfter,
          playerHp: isHit2 ? a1.playerHpAfter : a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        ...(isHit2 ? [
          // 4. Step 3: FATAL FULL [X] SCISSOR EXECUTION CRASH (260ms)
          {
            delay: 260,
            pOffset: isP2 ? { x: 0, y: 0 } : { x: -12, y: 4 },
            eOffset: isP2 ? { x: 12, y: -4 } : { x: 0, y: 0 },
            showEffect: true,
            hitFlash: true,
            usePlayerFront: isP2,
            useEnemyBack: !isP2,
            enemyHp: a2.enemyHpAfter,
            playerHp: a2.playerHpAfter,
            textLineIdx: 3,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a2,
            moveStep: 3,
          },
          // 5. Step 4: Red [X] Dissipation (140ms)
          {
            delay: 140,
            pOffset: isP2 ? { x: 0, y: 0 } : { x: -4, y: 1 },
            eOffset: isP2 ? { x: 4, y: 0 } : { x: 0, y: 0 },
            showEffect: true,
            hitFlash: false,
            usePlayerFront: isP2,
            useEnemyBack: !isP2,
            enemyHp: a2.enemyHpAfter,
            playerHp: a2.playerHpAfter,
            textLineIdx: 3,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a2,
            moveStep: 4,
          }
        ] : [
          // On Miss: Defender slides smoothly back to center (180ms)
          {
            delay: 180,
            pOffset: !isP2 ? { x: 8, y: 1 } : { x: 0, y: 0 },
            eOffset: isP2 ? { x: 8, y: -1 } : { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            usePlayerFront: isP2,
            useEnemyBack: !isP2,
            enemyHp: a2.enemyHpAfter,
            playerHp: a2.playerHpAfter,
            textLineIdx: 3,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a2,
          }
        ])
      ];
    } else if (isSwordsDance2) {
      act2Frames = [
        // 1. Low 3D Orbit around Waist (120ms)
        {
          delay: 120,
          pOffset: isP2 ? { x: 0, y: -2 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: 0, y: -2 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 2. Ascending 3D Orbit - 1st Spin (120ms)
        {
          delay: 120,
          pOffset: isP2 ? { x: 0, y: -4 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: 0, y: -4 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // 3. Mid-High 3D Orbit - 2nd Spin (120ms)
        {
          delay: 120,
          pOffset: isP2 ? { x: 0, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: 0, y: -6 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        },
        // 4. High 3D Orbit & Inward Tilt toward Apex (130ms)
        {
          delay: 130,
          pOffset: isP2 ? { x: 0, y: -7 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: 0, y: -7 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 4,
        },
        // 5. Swords Clash & Tips Touch at ONE Point above Head (240ms)
        {
          delay: 240,
          pOffset: isP2 ? { x: 0, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: 0, y: -8 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 5,
        },
        // 6. Power Dispersal & Aura Rise (140ms)
        {
          delay: 140,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 6,
        }
      ];
    } else if (isFly2) {
      const isHit2 = a2.isHit !== undefined ? a2.isHit : ((a2.damage ?? 0) > 0 || (!a2.log?.includes("빗나갔다") && !a2.log?.includes("missed") && !a2.log?.includes("빗나가")));
      const isMiss2 = !isHit2;
      const isTurn1Launch = (a2.damage ?? 0) === 0 && (a2.log?.includes("날아올랐다") || a2.log?.includes("flew up"));

      if (isTurn1Launch) {
        // Turn 1: 15 FPS Cinematic Launch (Zoom-in close-up -> Rocket Liftoff -> Stratosphere Ascent -> Vanish)
        act2Frames = [
          // 1. Dynamic Close-Up on Attacker & Deep Crouch Preparation (66ms x 3 = 200ms)
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: 2 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: 2 } : { x: 0, y: 0 },
            pScale: isP2 ? { x: 1.10, y: 0.92 } : undefined,
            eScale: !isP2 ? { x: 1.10, y: 0.92 } : undefined,
            cameraZoom: 1.45,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP2,
            pWhite: false,
            eWhite: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: 6 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: 6 } : { x: 0, y: 0 },
            pScale: isP2 ? { x: 1.25, y: 0.80 } : undefined,
            eScale: !isP2 ? { x: 1.25, y: 0.80 } : undefined,
            cameraZoom: 1.60,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP2,
            pWhite: false,
            eWhite: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: 8 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: 8 } : { x: 0, y: 0 },
            pScale: isP2 ? { x: 1.30, y: 0.75 } : undefined,
            eScale: !isP2 ? { x: 1.30, y: 0.75 } : undefined,
            cameraZoom: 1.70,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP2,
            pWhite: false,
            eWhite: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          // 2. Rocket Sky Launch & Camera Dynamic Tracking Upward into Stratosphere! (66ms x 4 = 264ms)
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: -60 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: -60 } : { x: 0, y: 0 },
            pScale: isP2 ? { x: 0.65, y: 1.45 } : undefined,
            eScale: !isP2 ? { x: 0.65, y: 1.45 } : undefined,
            cameraZoom: 1.60,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP2,
            pWhite: isP2,
            eWhite: !isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: -140 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: -140 } : { x: 0, y: 0 },
            pScale: isP2 ? { x: 0.45, y: 1.85 } : undefined,
            eScale: !isP2 ? { x: 0.45, y: 1.85 } : undefined,
            cameraZoom: 1.50,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP2,
            pWhite: isP2,
            eWhite: !isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: -240 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: -240 } : { x: 0, y: 0 },
            pScale: isP2 ? { x: 0.35, y: 2.10 } : undefined,
            eScale: !isP2 ? { x: 0.35, y: 2.10 } : undefined,
            cameraZoom: 1.38,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP2,
            pWhite: isP2,
            eWhite: !isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: -360 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: -360 } : { x: 0, y: 0 },
            pScale: isP2 ? { x: 0.28, y: 2.30 } : undefined,
            eScale: !isP2 ? { x: 0.28, y: 2.30 } : undefined,
            cameraZoom: 1.25,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP2,
            pWhite: isP2,
            eWhite: !isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          // 3. Stratosphere Piercing & Neutral Reset (66ms x 2 = 132ms)
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: -520 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: -520 } : { x: 0, y: 0 },
            pScale: isP2 ? { x: 0.20, y: 2.50 } : undefined,
            eScale: !isP2 ? { x: 0.20, y: 2.50 } : undefined,
            cameraZoom: 1.10,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP2,
            pWhite: isP2,
            eWhite: !isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          }
        ];
      } else {
        // Turn 2: 15 FPS Subtle Looming Shadow -> High Sky Gliding -> Pure Vertical Streamlined Compressed Plunge -> Ground Slam Impact
        act2Frames = [
          // 1. Target Battlefield Warning Shadow (66ms x 3 = 200ms)
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            hidePlayer: isP2,
            hideEnemy: !isP2,
            hidePShadow: isP2,
            hideEShadow: !isP2,
            loomingShadow: { offsetY: -25, w: 12, h: 4, alpha: 0.35 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            hidePlayer: isP2,
            hideEnemy: !isP2,
            hidePShadow: isP2,
            hideEShadow: !isP2,
            loomingShadow: { offsetY: -12, w: 20, h: 6, alpha: 0.55 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            pOffset: isP2 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            hidePlayer: isP2,
            hideEnemy: !isP2,
            hidePShadow: isP2,
            hideEShadow: !isP2,
            loomingShadow: { offsetY: 0, w: 28, h: 9, alpha: 0.75 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },

          // 2. High Sky Supersonic Vertical Nose-Dive Cutscene (66ms x 4 = 264ms)
          {
            delay: 66,
            diveStep: 1,
            pOffset: { x: 0, y: -110 },
            eOffset: { x: 0, y: -110 },
            pScale: isP2 ? { x: 0.65, y: 1.45 } : undefined,
            eScale: !isP2 ? { x: 0.65, y: 1.45 } : undefined,
            pRot: 0,
            eRot: 0,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            diveStep: 2,
            pOffset: { x: 0, y: -30 },
            eOffset: { x: 0, y: -30 },
            pScale: isP2 ? { x: 0.52, y: 1.75 } : undefined,
            eScale: !isP2 ? { x: 0.52, y: 1.75 } : undefined,
            pRot: 0,
            eRot: 0,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            diveStep: 3,
            pOffset: { x: 0, y: 55 },
            eOffset: { x: 0, y: 55 },
            pScale: isP2 ? { x: 0.42, y: 2.10 } : undefined,
            eScale: !isP2 ? { x: 0.42, y: 2.10 } : undefined,
            pRot: 0,
            eRot: 0,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            diveStep: 4,
            pOffset: { x: 0, y: 155 },
            eOffset: { x: 0, y: 155 },
            pScale: isP2 ? { x: 0.32, y: 2.50 } : undefined,
            eScale: !isP2 ? { x: 0.32, y: 2.50 } : undefined,
            pRot: 0,
            eRot: 0,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },

          // 3. Battlefield Arena Vertical Nose-Dive Plunge (66ms x 2 = 132ms)
          {
            delay: 66,
            pOffset: isP2 ? { x: 268, y: -360 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: -268, y: -160 } : { x: 0, y: 0 },
            pScale: isP2 ? { x: 0.40, y: 2.00 } : undefined,
            eScale: !isP2 ? { x: 0.40, y: 2.00 } : undefined,
            pRot: 0,
            eRot: 0,
            loomingShadow: { offsetY: 0, w: 28, h: 9, alpha: 0.85 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },
          {
            delay: 66,
            pOffset: isP2 ? { x: 268, y: -180 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: -268, y: 40 } : { x: 0, y: 0 },
            pScale: isP2 ? { x: 0.30, y: 2.40 } : undefined,
            eScale: !isP2 ? { x: 0.30, y: 2.40 } : undefined,
            pRot: 0,
            eRot: 0,
            loomingShadow: { offsetY: 0, w: 34, h: 11, alpha: 1.0 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP2,
            showEffect: false,
            hitFlash: false,
            enemyHp: a1.enemyHpAfter,
            playerHp: a1.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          },

          // 4. Ground Arena Vertical Dive-Bomb Impact Slam (66ms x 3 = 200ms)
          {
            delay: 66,
            pOffset: isP2 ? { x: 268, y: -139 } : (isMiss2 ? { x: 20, y: 4 } : { x: -8, y: 4 }),
            eOffset: isP2 ? (isMiss2 ? { x: 20, y: -4 } : { x: 8, y: -4 }) : { x: -268, y: 149 },
            pScale: isP2 ? { x: 1.35, y: 0.65 } : undefined,
            eScale: !isP2 ? { x: 1.35, y: 0.65 } : undefined,
            pRot: 0,
            eRot: 0,
            pWhite: false,
            eWhite: false,
            isHighSkyCutscene: false,
            showEffect: true,
            hitFlash: isHit2,
            enemyHp: a2.enemyHpAfter,
            playerHp: a2.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
            moveStep: 3,
          },
          {
            delay: 66,
            pOffset: isP2 ? { x: 134, y: -30 } : { x: 0, y: 0 },
            eOffset: !isP2 ? { x: -134, y: 30 } : { x: 0, y: 0 },
            pScale: isP2 ? { x: 1.10, y: 0.92 } : undefined,
            eScale: !isP2 ? { x: 1.10, y: 0.92 } : undefined,
            isHighSkyCutscene: false,
            showEffect: true,
            hitFlash: false,
            enemyHp: a2.enemyHpAfter,
            playerHp: a2.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
            moveStep: 4,
          },
          {
            delay: 66,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            isHighSkyCutscene: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: a2.enemyHpAfter,
            playerHp: a2.playerHpAfter,
            textLineIdx: 3,
            isBlur: false,
            moveEffect: a2,
          }
        ];
      }
    } else if (isRazorWind2) {
      const isHit2 = a2.isHit !== undefined ? a2.isHit : ((a2.damage ?? 0) > 0 || (!a2.log?.includes("빗나갔다") && !a2.log?.includes("missed") && !a2.log?.includes("빗나가")));
      const isMiss2 = !isHit2;
      act2Frames = [
        // 1. Counter Helical Spiral Orbit around Attacker (150ms)
        {
          delay: 150,
          pOffset: isP2 ? { x: 4, y: -2 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -4, y: 2 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 2. Counter Swirl Dissolving & Fading Out at Attacker (150ms)
        {
          delay: 150,
          pOffset: isP2 ? { x: 6, y: -3 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -6, y: 3 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // 3. Faint Translucent Opposite Pairs Spawning at Defender (150ms)
        {
          delay: 150,
          pOffset: isP2 ? { x: 8, y: -4 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -8, y: 4 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        },
        // 4. Blades Closing In & Becoming Denser from All Opposing Sides (170ms)
        {
          delay: 170,
          pOffset: isP2 ? { x: 12, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -12, y: 6 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 4,
        },
        // 5. Full Omnidirectional 8-Way Cleave Storm Impact (240ms)
        {
          delay: 240,
          pOffset: isP2 ? (isMiss2 ? { x: 26, y: -4 } : { x: 10, y: -3 }) : { x: -14, y: 7 },
          eOffset: !isP2 ? (isMiss2 ? { x: 26, y: 4 } : { x: -6, y: 3 }) : { x: 14, y: -7 },
          showEffect: true,
          hitFlash: isHit2,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 5,
        },
        // 6. Gentle Shard Fade-Out Dispersal (140ms)
        {
          delay: 140,
          pOffset: isP2 ? { x: 2, y: 0 } : { x: -4, y: 2 },
          eOffset: !isP2 ? { x: 4, y: -2 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 6,
        }
      ];
    } else if (isWingAttack2) {
      const isHit2 = a2.isHit !== undefined ? a2.isHit : ((a2.damage ?? 0) > 0 || (!a2.log?.includes("빗나갔다") && !a2.log?.includes("missed") && !a2.log?.includes("빗나가")));
      const isMiss2 = !isHit2;
      act2Frames = [
        // 1. Counter Dive Lunge (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 180, y: -90 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -180, y: 90 } : { x: 0, y: 0 },
          pScale: isP2 ? { x: 1.40, y: 0.45 } : undefined,
          eScale: !isP2 ? { x: 1.40, y: 0.45 } : undefined,
          pRot: isP2 ? -0.22 : undefined,
          eRot: !isP2 ? 0.22 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 2. Direct Contact Strike & Feather Burst (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 260, y: -138 } : (isMiss2 ? { x: 26, y: 4 } : { x: -8, y: 4 }),
          eOffset: isP2 ? (isMiss2 ? { x: 26, y: -4 } : { x: 12, y: -4 }) : { x: -260, y: 138 },
          pScale: isP2 ? { x: 1.35, y: 0.48 } : undefined,
          eScale: !isP2 ? { x: 1.35, y: 0.48 } : undefined,
          pRot: isP2 ? -0.22 : undefined,
          eRot: !isP2 ? 0.22 : undefined,
          showEffect: true,
          hitFlash: isHit2,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // 3. Piercing Fly-Through Off-Screen (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 450, y: -245 } : (isMiss2 ? { x: 16, y: 2 } : { x: -4, y: 2 }),
          eOffset: isP2 ? (isMiss2 ? { x: 16, y: -2 } : { x: 6, y: -2 }) : { x: -450, y: 245 },
          pScale: isP2 ? { x: 1.45, y: 0.38 } : undefined,
          eScale: !isP2 ? { x: 1.45, y: 0.38 } : undefined,
          pRot: isP2 ? -0.25 : undefined,
          eRot: !isP2 ? 0.25 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        },
        // 4. Swooping Re-entry from Bottom-Left (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: -50, y: 24 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: 50, y: -24 } : { x: 0, y: 0 },
          pScale: isP2 ? { x: 1.20, y: 0.70 } : undefined,
          eScale: !isP2 ? { x: 1.20, y: 0.70 } : undefined,
          pRot: isP2 ? -0.12 : undefined,
          eRot: !isP2 ? 0.12 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 4,
        },
        // 5. Clean Landing Touchdown (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 4,
        }
      ];
    } else if (isWhirlwind2) {
      const isHit2 = a2.isHit !== undefined ? a2.isHit : ((a2.damage ?? 0) > 0 || (!a2.log?.includes("빗나갔다") && !a2.log?.includes("missed") && !a2.log?.includes("빗나가")));
      const isMiss2 = !isHit2;
      act2Frames = [
        // 1. Cyclone Inception & Rising Float (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 12, y: -4 } : (isMiss2 ? { x: -26, y: 4 } : { x: 0, y: -30 }),
          eOffset: isP2 ? (isMiss2 ? { x: 26, y: -4 } : { x: 0, y: -30 }) : { x: -12, y: 4 },
          pRot: isP2 ? undefined : (isMiss2 ? undefined : -0.55),
          eRot: isP2 ? (isMiss2 ? undefined : 0.55) : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 2. Towering Cyclone Surge & Mid-Air Spin (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 16, y: -6 } : (isMiss2 ? { x: -26, y: 4 } : { x: -10, y: -130 }),
          eOffset: isP2 ? (isMiss2 ? { x: 26, y: -4 } : { x: 10, y: -130 }) : { x: -16, y: 6 },
          pRot: isP2 ? undefined : (isMiss2 ? undefined : -2.6),
          eRot: isP2 ? (isMiss2 ? undefined : 2.6) : undefined,
          showEffect: true,
          hitFlash: isHit2,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // 3. Roaring Sky Vortex Off-Screen Ejection (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 10, y: -3 } : (isMiss2 ? { x: -16, y: 2 } : { x: -6, y: -260 }),
          eOffset: isP2 ? (isMiss2 ? { x: 16, y: -2 } : { x: 6, y: -260 }) : { x: -10, y: 3 },
          pRot: isP2 ? undefined : (isMiss2 ? undefined : -5.8),
          eRot: isP2 ? (isMiss2 ? undefined : 5.8) : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        },
        // 4. Cyclone Dissipates & Soft Float Down (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 4, y: 0 } : { x: 0, y: -70 },
          eOffset: isP2 ? { x: 0, y: -70 } : { x: -4, y: 0 },
          pRot: isP2 ? undefined : -0.20,
          eRot: isP2 ? 0.20 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 4,
        },
        // 5. Clean Ground Touchdown (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 4,
        }
      ];
    } else if (isSingleStrikeSpecial2) {
      const isHit2 = a2.isHit !== undefined ? a2.isHit : ((a2.damage ?? 0) > 0 || (!a2.log?.includes("빗나갔다") && !a2.log?.includes("missed") && !a2.log?.includes("빗나가")));
      const isMiss2 = !isHit2;
      act2Frames = [
        // 1. Windup Lunge (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 18, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -18, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
        },
        // 2. Direct Strike Impact (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 22, y: -9 } : (isMiss2 ? { x: 26, y: 4 } : { x: -14, y: 4 }),
          eOffset: !isP2 ? { x: -22, y: 9 } : (isMiss2 ? { x: 26, y: -4 } : { x: 10, y: -3 }),
          showEffect: true,
          hitFlash: isHit2,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 3. Effect Action (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 14, y: -5 } : (isMiss2 ? { x: 16, y: 2 } : { x: -8, y: 2 }),
          eOffset: !isP2 ? { x: -14, y: 5 } : (isMiss2 ? { x: 16, y: -2 } : { x: 8, y: -2 }),
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // 4. Recovery (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        }
      ];
    } else {
      const isHit2 = a2.isHit !== undefined ? a2.isHit : ((a2.damage ?? 0) > 0 || (!a2.log?.includes("빗나갔다") && !a2.log?.includes("missed") && !a2.log?.includes("빗나가")));
      const isMiss2 = !isHit2;
      act2Frames = [
        // 1. Standard Windup (100ms)
        {
          delay: 100,
          pOffset: isP2 ? (a2.isSpecial ? { x: 0, y: -6 } : { x: 18, y: -8 }) : { x: 0, y: 0 },
          eOffset: !isP2 ? (a2.isSpecial ? { x: 0, y: -6 } : { x: -18, y: 8 }) : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 2. Standard Strike Impact (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 22, y: -9 } : (isMiss2 ? { x: 26, y: 4 } : { x: -14, y: 4 }),
          eOffset: !isP2 ? { x: -22, y: 9 } : (isMiss2 ? { x: 26, y: -4 } : { x: 8, y: -2 }),
          showEffect: true,
          hitFlash: isHit2,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // 3. Recoil Shake (100ms)
        {
          delay: 100,
          pOffset: isP2 ? { x: 12, y: -4 } : (isMiss2 ? { x: 12, y: 2 } : { x: -6, y: 2 }),
          eOffset: !isP2 ? { x: -12, y: 4 } : (isMiss2 ? { x: 12, y: -2 } : { x: 6, y: -2 }),
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        },
        // 4. Recovery (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          isBlur: false,
          moveEffect: a2,
        }
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

    const finalEnemyHp = a2 ? a2.enemyHpAfter : a1.enemyHpAfter;
    const finalPlayerHp = a2 ? a2.playerHpAfter : a1.playerHpAfter;
    const isEnemyFainted = finalEnemyHp <= 0;
    const isPlayerFainted = finalPlayerHp <= 0;
    const isAnyFainted = a1Fainted || a2Fainted;

    const faintFrames = a2Fainted
      ? createFaintingFrames(a2, isPlayerFainted, 99, playerFrontHold, enemyBackHold)
      : (a1Fainted ? createFaintingFrames(a1, isPlayerFainted, 99, playerFrontHold, enemyBackHold) : []);

    const a1IsEvasionLaunch = isEvasionLaunch(a1);
    const a1IsEvasionStrike = isEvasionStrike(a1);
    const a2IsEvasionLaunch = isEvasionLaunch(a2);
    const a2IsEvasionStrike = isEvasionStrike(a2);

    // Evasion state at START of turn (before Act 1 starts) - ONLY true if unleashing an evasion strike or opponent missed into empty air
    const isPlayerStartingEvading = !a1IsEvasionLaunch && !a2IsEvasionLaunch && (
      (a1IsEvasionStrike && isP1) || (a2IsEvasionStrike && isP2) || (Boolean(a1 && a1.log?.includes("닿지 않았다") && !isP1))
    );
    const isEnemyStartingEvading = !a1IsEvasionLaunch && !a2IsEvasionLaunch && (
      (a1IsEvasionStrike && !isP1) || (a2IsEvasionStrike && !isP2) || (Boolean(a1 && a1.log?.includes("닿지 않았다") && isP1))
    );

    // Evasion state during Act 1 (for non-acting Pokemon)
    const isPlayerEvadingDuringAct1 = isPlayerStartingEvading && !isP1;
    const isEnemyEvadingDuringAct1 = isEnemyStartingEvading && isP1;

    // Evasion state during Act 2 (for non-acting Pokemon)
    const isPlayerEvadingDuringAct2 = (a1IsEvasionLaunch && isP1) || (isPlayerStartingEvading && !isP1 && !a1IsEvasionStrike);
    const isEnemyEvadingDuringAct2 = (a1IsEvasionLaunch && !isP1) || (isEnemyStartingEvading && isP1 && !a1IsEvasionStrike);

    // Evasion state at END of turn (final hold frame)
    const isPlayerEndingEvading = (a1IsEvasionLaunch && isP1 && !a2) || (a2IsEvasionLaunch && isP2) || (Boolean(playerMon.semiInvulnerableState || playerMon.chargingMove));
    const isEnemyEndingEvading = (a1IsEvasionLaunch && !isP1 && !a2) || (a2IsEvasionLaunch && !isP2) || (Boolean(enemy.semiInvulnerableState || enemy.chargingMove));

    let processedAct1Frames = act1Frames;
    if (isEnemyEvadingDuringAct1) {
      processedAct1Frames = act1Frames.map(f => ({ ...f, eOffset: { x: 0, y: -9999 }, hideEShadow: true, hideEnemy: true, eAlpha: 0.0 }));
    } else if (isPlayerEvadingDuringAct1) {
      processedAct1Frames = act1Frames.map(f => ({ ...f, pOffset: { x: 0, y: -9999 }, hidePShadow: true, hidePlayer: true, pAlpha: 0.0 }));
    }

    let processedAct2Frames = act2Frames;
    if (isPlayerEvadingDuringAct2) {
      processedAct2Frames = act2Frames.map(f => ({ ...f, pOffset: { x: 0, y: -9999 }, hidePShadow: true, hidePlayer: true, pAlpha: 0.0 }));
    } else if (isEnemyEvadingDuringAct2) {
      processedAct2Frames = act2Frames.map(f => ({ ...f, eOffset: { x: 0, y: -9999 }, hideEShadow: true, hideEnemy: true, eAlpha: 0.0 }));
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
        pAlpha: isPlayerFainted ? 0.0 : 1.0,
        eAlpha: isEnemyFainted ? 0.0 : 1.0,
        hidePShadow: isPlayerEndingEvading || isPlayerFainted,
        hideEShadow: isEnemyEndingEvading || isEnemyFainted,
        hidePlayer: isPlayerEndingEvading || isPlayerFainted,
        hideEnemy: isEnemyEndingEvading || isEnemyFainted,
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
    const finalEnemyHp = eff.enemyHpAfter !== undefined ? eff.enemyHpAfter : enemyHp;
    const finalPlayerHp = eff.playerHpAfter !== undefined ? eff.playerHpAfter : playerHp;
    const isEnemyFainted = finalEnemyHp <= 0;
    const isPlayerFainted = finalPlayerHp <= 0;
    const isFainted = isEnemyFainted || isPlayerFainted;

    const playerFrontHold = isP1 && isGuillotineSingle && isEnemyFainted;
    const enemyBackHold = !isP1 && isGuillotineSingle && isPlayerFainted;

    const faintFrames = isFainted
      ? createFaintingFrames(eff, isPlayerFainted, 99, playerFrontHold, enemyBackHold)
      : [];

    const a1IsEvasionLaunch = isEvasionLaunch(a1);
    const a1IsEvasionStrike = isEvasionStrike(a1);

    const isPlayerStartingEvading = !a1IsEvasionLaunch && ((a1IsEvasionStrike && isP1) || (Boolean(a1 && a1.log?.includes("닿지 않았다") && !isP1)));
    const isEnemyStartingEvading = !a1IsEvasionLaunch && ((a1IsEvasionStrike && !isP1) || (Boolean(a1 && a1.log?.includes("닿지 않았다") && isP1)));

    const isPlayerEndingEvading = (a1IsEvasionLaunch && isP1) || Boolean(playerMon.semiInvulnerableState || playerMon.chargingMove);
    const isEnemyEndingEvading = (a1IsEvasionLaunch && !isP1) || Boolean(enemy.semiInvulnerableState || enemy.chargingMove);

    let processedSingleActFrames = act1Frames;
    if (isEnemyStartingEvading && isP1) {
      processedSingleActFrames = act1Frames.map(f => ({ ...f, eOffset: { x: 0, y: -9999 }, hideEShadow: true, hideEnemy: true, eAlpha: 0.0 }));
    } else if (isPlayerStartingEvading && !isP1) {
      processedSingleActFrames = act1Frames.map(f => ({ ...f, pOffset: { x: 0, y: -9999 }, hidePShadow: true, hidePlayer: true, pAlpha: 0.0 }));
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
        pAlpha: isPlayerFainted ? 0.0 : 1.0,
        eAlpha: isEnemyFainted ? 0.0 : 1.0,
        hidePShadow: isPlayerEndingEvading || isPlayerFainted,
        hideEShadow: isEnemyEndingEvading || isEnemyFainted,
        hidePlayer: isPlayerEndingEvading || isPlayerFainted,
        hideEnemy: isEnemyEndingEvading || isEnemyFainted,
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

  const offCanvas = createCanvas(width, height);
  const offCtx = offCanvas.getContext("2d");
  offCtx.imageSmoothingEnabled = false;

  for (const f of framesConfig) {
    const targetCtx = f.isBlur ? offCtx : ctx;
    targetCtx.clearRect(0, 0, width, height);

    if (f.isHighSkyCutscene) {
      const attackerSprite = f.isAttackerPlayer ? playerSprite : enemySprite;
      drawHighSkyCutscene(targetCtx, width, height, f, attackerSprite);
    } else {
      const isTracking = Boolean(f.cameraTrackAttacker);
      const hasCamera = Boolean(f.cameraZoom || f.cameraPan || isTracking);
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
      const isEnemyHidden = (f.eOffset && (f.eOffset.y <= -50 || f.eOffset.y >= 9000)) || f.hideEShadow || f.hideEnemy || (eAlpha <= 0.02) || Boolean(f.eScale);
      if (enemySprite && !isEnemyHidden) {
        const eShadowX = em.x + f.eOffset.x;
        const eShadowY = em.y;
        drawPokemonSilhouetteShadow(targetCtx, enemySprite, eShadowX, eShadowY, em.size, false, 0.42 * eAlpha);
      }

      const isPlayerHidden = (f.pOffset && (f.pOffset.y <= -50 || f.pOffset.y >= 9000)) || f.hidePShadow || f.hidePlayer || (pAlpha <= 0.02) || Boolean(f.pScale);
      if (playerSprite && !isPlayerHidden) {
        const pShadowX = pm.x + f.pOffset.x;
        const pShadowY = pm.y;
        drawPokemonSilhouetteShadow(targetCtx, playerSprite, pShadowX, pShadowY, pm.size, true, 0.42 * pAlpha);
      }

      // Enemy Sprite
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

      // Player Sprite
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

      // Move Effect Rendering (including Karate Chop multi-step hand animation)
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

    encoder.setDelay(f.delay);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return { buffer: encoder.out.getData(), motionDurationMs };
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

/**
 * Shared HUD Boxes Rendering
 */
function renderBattleHuds(ctx: any, battle: BattleState, isKo: boolean, pbAssets: any, enemyHp: number, playerHp: number) {
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
    x: ph.x,
    y: ph.y,
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
