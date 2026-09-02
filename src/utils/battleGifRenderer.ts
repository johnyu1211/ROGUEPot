// @ts-ignore
import GIFEncoder from "gif-encoder-2";
import { createCanvas } from "@napi-rs/canvas";
import { BattleState, TurnActionInfo } from "../services/battleService.js";
import { renderMoveEffect, drawStatBoostEffect, drawStatDropEffect } from "./moveEffectRenderer.js";
import { POKEMON_SPECIES_DATA } from "../data/pokemonStats.js";
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
  statProgress?: number
): any[] {
  const typeMod = action.typeMod !== undefined ? action.typeMod : (action.isSuperEffective ? 2.0 : 1.0);
  
  let blinkCount = 0; // Default: 0 blinks for normal hits (1.0x) and not very effective (<= 0.5x)
  if (typeMod >= 4.0) blinkCount = 4; // Double super effective (>= 4.0x) -> 4 blinks
  else if (typeMod >= 2.0) blinkCount = 3; // Super effective (2.0x) -> 3 blinks

  const isP = isAttackerPlayer;
  const textIdx = isAct1 ? 2 : 99;

  if (blinkCount === 0) {
    return [
      {
        delay: 420,
        pOffset: isP ? { x: 6, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -6, y: 3 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        targetAlpha: 1.0,
        enemyHp: action.enemyHpAfter,
        playerHp: action.playerHpAfter,
        textLineIdx: textIdx,
        statProgress,
        isBlur: false,
        moveEffect: action,
      }
    ];
  }

  const frames: any[] = [];
  const durationPerHalf = blinkCount >= 4 ? 55 : (blinkCount === 3 ? 65 : 100);

  for (let i = 0; i < blinkCount; i++) {
    const isLast = (i === blinkCount - 1);
    // 1. Transparent half-blink
    frames.push({
      delay: durationPerHalf,
      pOffset: isP ? { x: Math.max(0, 6 - i * 2), y: Math.min(0, -3 + i) } : { x: 4 - (i % 2) * 8, y: -2 },
      eOffset: !isP ? { x: Math.min(0, -6 + i * 2), y: Math.max(0, 3 - i) } : { x: 4 - (i % 2) * 8, y: -2 },
      showEffect: false,
      hitFlash: false,
      targetAlpha: 0.1,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: textIdx,
      statProgress: isLast ? statProgress : undefined,
      isBlur: false,
      moveEffect: action,
    });
    // 2. Visible normal half-blink
    frames.push({
      delay: isLast ? durationPerHalf + 80 : durationPerHalf,
      pOffset: isP ? { x: Math.max(0, 4 - i * 2), y: Math.min(0, -2 + i) } : { x: 0, y: 0 },
      eOffset: !isP ? { x: Math.min(0, -4 + i * 2), y: Math.max(0, 2 - i) } : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      targetAlpha: 1.0,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: textIdx,
      statProgress: isLast ? statProgress : undefined,
      isBlur: false,
      moveEffect: action,
    });
  }

  return frames;
}

/**
 * Creates a smooth 4-step sinking faint animation when a Pokémon reaches 0 HP
 */
function createFaintingFrames(
  action: TurnActionInfo,
  isTargetPlayer: boolean,
  dialogueTextIdx: number = 99
): any[] {
  const isEnemy = !isTargetPlayer;

  return [
    // Step 1: Initial stumble and start sinking (140ms)
    {
      delay: 140,
      pOffset: isTargetPlayer ? { x: 0, y: 18 } : { x: 0, y: 0 },
      eOffset: isEnemy ? { x: 0, y: 18 } : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      targetAlpha: 0.85,
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
      showEffect: false,
      hitFlash: false,
      targetAlpha: 0.55,
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
      showEffect: false,
      hitFlash: false,
      targetAlpha: 0.20,
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
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      targetAlpha: 0.0,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: undefined,
      isBlur: false,
      moveEffect: action,
    }
  ];
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
  const mKey1 = a1.moveKey.toLowerCase().replace(/[\s_]+/g, "-");
  const isChop1 = (mKey1 === "karate-chop" || mKey1 === "karatechop");
  const isSlap1 = (mKey1 === "double-slap" || mKey1 === "doubleslap");
  const isPunch1 = (mKey1 === "comet-punch" || mKey1 === "cometpunch");
  const isMegaPunch1 = (mKey1 === "mega-punch" || mKey1 === "megapunch");
  const isPayDay1 = (mKey1 === "pay-day" || mKey1 === "payday");
  const isFirePunch1 = (mKey1 === "fire-punch" || mKey1 === "firepunch");
  const isIcePunch1 = (mKey1 === "ice-punch" || mKey1 === "icepunch");
  const isSingleStrikeSpecial1 = (
    mKey1 === "thunder-punch" || mKey1 === "thunderpunch" ||
    mKey1 === "scratch" ||
    mKey1 === "vice-grip" || mKey1 === "vicegrip" ||
    mKey1 === "guillotine"
  );

  let act1Frames: any[] = [];
  if (isChop1) {
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
          statProgress: 0.25,
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
            statProgress: (idx + 1) * 0.1,
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
            statProgress: (idx + 1) * 0.1,
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
            statProgress: (idx + 1) * 0.1,
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
            statProgress: (idx + 1) * 0.1,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        }
      ];
    } else if (isSingleStrikeSpecial1) {
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
        // 2. Step 1: Direct Impact Strike + Hit Flash (200ms)
        {
          delay: 200,
          pOffset: isP1 ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: isP1 ? { x: 10, y: -3 } : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: 0.25,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // 3. Step 2: Special Effect Action / Slash / Clamp / Spark (140ms)
        {
          delay: 140,
          pOffset: isP1 ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: isP1 ? { x: 5, y: -1 } : { x: -16, y: 6 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: 0.25,
          isBlur: false,
          moveEffect: a1,
          moveStep: 2,
        },
        // 4. Step 3: Spark / Shockwave Dispersal & Dissipation (130ms)
        {
          delay: 130,
          pOffset: isP1 ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: isP1 ? { x: 2, y: 0 } : { x: -10, y: 3 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: 0.25,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        }
      ];
    } else {
      act1Frames = [
        // Standard Windup (180ms)
        {
          delay: 180,
          pOffset: isP1 ? (a1.isSpecial ? { x: 0, y: -6 } : { x: 18, y: -8 }) : { x: 0, y: 0 },
          eOffset: !isP1 ? (a1.isSpecial ? { x: 0, y: -6 } : { x: -18, y: 8 }) : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemy.hp,
          playerHp: playerMon.hp,
          textLineIdx: 1,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a1,
          moveStep: 1,
        },
        // Standard Strike Impact (240ms)
        {
          delay: 240,
          pOffset: isP1 ? { x: 20, y: -10 } : { x: -8, y: 4 },
          eOffset: isP1 ? { x: 8, y: -2 } : { x: -20, y: 10 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 1,
          statProgress: 0.25,
          isBlur: false,
          moveEffect: a1,
          moveStep: 3,
        }
      ];
    }

  let framesConfig: any[] = [];

  if (hasMultipleActions) {
    const a2 = turnActions[1];
    const isP2 = a2.actor === "player";
    const mKey2 = a2.moveKey.toLowerCase().replace(/[\s_]+/g, "-");
    const isChop2 = (mKey2 === "karate-chop" || mKey2 === "karatechop");
    const isSlap2 = (mKey2 === "double-slap" || mKey2 === "doubleslap");
    const isPunch2 = (mKey2 === "comet-punch" || mKey2 === "cometpunch");
    const isMegaPunch2 = (mKey2 === "mega-punch" || mKey2 === "megapunch");
    const isPayDay2 = (mKey2 === "pay-day" || mKey2 === "payday");
    const isFirePunch2 = (mKey2 === "fire-punch" || mKey2 === "firepunch");
    const isIcePunch2 = (mKey2 === "ice-punch" || mKey2 === "icepunch");
    const isSingleStrikeSpecial2 = (
      mKey2 === "thunder-punch" || mKey2 === "thunderpunch" ||
      mKey2 === "scratch" ||
      mKey2 === "vice-grip" || mKey2 === "vicegrip" ||
      mKey2 === "guillotine"
    );

    let act2Frames: any[] = [];
    if (isChop2) {
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
          statProgress: 0.25,
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
            statProgress: (idx + 1) * 0.1,
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
            statProgress: (idx + 1) * 0.1,
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
            statProgress: (idx + 1) * 0.1,
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
            statProgress: (idx + 1) * 0.1,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
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
          statProgress: 0.25,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        }
      ];
    } else if (isSingleStrikeSpecial2) {
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
        // 2. Step 1: Direct Impact Strike + Hit Flash (200ms)
        {
          delay: 200,
          pOffset: isP2 ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: !isP2 ? { x: -22, y: 9 } : { x: 10, y: -3 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: 0.25,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // 3. Step 2: Special Effect Action / Slash / Clamp / Spark (140ms)
        {
          delay: 140,
          pOffset: isP2 ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: !isP2 ? { x: -16, y: 6 } : { x: 5, y: -1 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: 0.25,
          isBlur: false,
          moveEffect: a2,
          moveStep: 2,
        },
        // 4. Step 3: Spark / Shockwave Dispersal & Dissipation (130ms)
        {
          delay: 130,
          pOffset: isP2 ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: !isP2 ? { x: -10, y: 3 } : { x: 2, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: 0.25,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        }
      ];
    } else {
      act2Frames = [
        // Standard Counter Windup (180ms)
        {
          delay: 180,
          pOffset: isP2 ? (a2.isSpecial ? { x: 0, y: -6 } : { x: 18, y: -8 }) : { x: 0, y: 0 },
          eOffset: !isP2 ? (a2.isSpecial ? { x: 0, y: -6 } : { x: -18, y: 8 }) : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
          moveStep: 1,
        },
        // Standard Counter Strike (240ms)
        {
          delay: 240,
          pOffset: isP2 ? { x: 20, y: -10 } : { x: -8, y: 4 },
          eOffset: !isP2 ? { x: -20, y: 10 } : { x: 8, y: -2 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: 3,
          statProgress: 0.25,
          isBlur: false,
          moveEffect: a2,
          moveStep: 3,
        }
      ];
    }

    const a1Fainted = a1.enemyHpAfter <= 0 || a1.playerHpAfter <= 0;
    const a2Fainted = a2 && (a2.enemyHpAfter <= 0 || a2.playerHpAfter <= 0);

    const faintFrames = a2Fainted
      ? createFaintingFrames(a2, a2.playerHpAfter <= 0, 99)
      : (a1Fainted ? createFaintingFrames(a1, a1.playerHpAfter <= 0, 99) : []);

    const finalEnemyHp = a2 ? a2.enemyHpAfter : a1.enemyHpAfter;
    const finalPlayerHp = a2 ? a2.playerHpAfter : a1.playerHpAfter;
    const isAnyFainted = a1Fainted || a2Fainted;

    framesConfig = [
      // Frame 0: Leading Cinematic Soft-Blur Loading Frame (800ms / 0.8s)
      {
        delay: 800,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: enemy.hp,
        playerHp: playerMon.hp,
        textLineIdx: 0,
        statProgress: undefined,
        isBlur: true,
      },
      // === ACT 1 ===
      ...act1Frames,
      // Frame 3: Attacker 1 Recoil & Damage Settling (with Dynamic Effectiveness Blinking!)
      ...createEffectivenessFlickerFrames(a1, isP1, true),
      // Frame 4: Natural Breathing Room Pause between Turns (380ms - comfortable reading pause!)
      {
        delay: 380,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        targetAlpha: 1.0,
        enemyHp: a1.enemyHpAfter,
        playerHp: a1.playerHpAfter,
        textLineIdx: 2,
        statProgress: undefined,
        isBlur: false,
        moveEffect: a1,
      },
      // === ACT 2 ===
      ...act2Frames,
      // Frame 7: Attacker 2 Recoil & Counter Damage (with Dynamic Effectiveness Blinking!)
      ...createEffectivenessFlickerFrames(a2, isP2, false, 0.75),
      // Sinking Faint Collapse Animation (if someone fainted)
      ...faintFrames,
      // Frame 8: Neutral Return & Stat Changes Peak (if nobody fainted)
      ...(!isAnyFainted ? [
        {
          delay: 320,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          targetAlpha: 1.0,
          enemyHp: finalEnemyHp,
          playerHp: finalPlayerHp,
          textLineIdx: 99,
          statProgress: 0.95,
          isBlur: false,
          moveEffect: a2,
        }
      ] : []),
      // Final 11-Minute Static Hold Frame (655,000ms)
      {
        delay: 655000,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        targetAlpha: isAnyFainted ? 0.0 : 1.0,
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

    const finalEnemyHp = eff.enemyHpAfter !== undefined ? eff.enemyHpAfter : enemyHp;
    const finalPlayerHp = eff.playerHpAfter !== undefined ? eff.playerHpAfter : playerHp;
    const isEnemyFainted = finalEnemyHp <= 0;
    const isPlayerFainted = finalPlayerHp <= 0;
    const isFainted = isEnemyFainted || isPlayerFainted;

    const faintFrames = isFainted
      ? createFaintingFrames(eff, isPlayerFainted, 99)
      : [];

    framesConfig = [
      // Frame 0: Leading Cinematic Soft-Blur Loading Frame (800ms / 0.8s)
      {
        delay: 800,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: enemy.hp,
        playerHp: playerMon.hp,
        textLineIdx: 0,
        statProgress: undefined,
        isBlur: true,
      },
      // Act 1 Move Animation (Fully executed with all sub-frames!)
      ...act1Frames,
      // Frame 3: Recoil & Damage Settling (with Dynamic Effectiveness Blinking!)
      ...createEffectivenessFlickerFrames(eff, isP1, true, 0.65),
      // Sinking Faint Collapse Animation (if fainted)
      ...faintFrames,
      // Frame 4: Neutral Return & Stat Particles Peak (if not fainted)
      ...(!isFainted ? [
        {
          delay: 240,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          targetAlpha: 1.0,
          enemyHp: finalEnemyHp,
          playerHp: finalPlayerHp,
          textLineIdx: 3,
          statProgress: 0.95,
          isBlur: false,
          moveEffect: eff,
        }
      ] : []),
      // Frame 5: 11-Minute Static Hold Frame (655,000ms)
      {
        delay: 655000,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        targetAlpha: isFainted ? 0.0 : 1.0,
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

    if (arena.bg) targetCtx.drawImage(arena.bg, 0, 0, width, height);
    else { targetCtx.fillStyle = "#487848"; targetCtx.fillRect(0, 0, width, height); }

    if (arena.b) {
      targetCtx.drawImage(arena.b, ep.x, ep.y, enemyPlatW, enemyPlatH);
      targetCtx.save();
      targetCtx.translate(width, 0);
      targetCtx.scale(-1, 1);
      targetCtx.drawImage(arena.b, pp.x, pp.y, playerPlatW, playerPlatH);
      targetCtx.restore();
    }

    // Determine target entity for alpha & filter styling
    const eTarget = (f.moveEffect ? f.moveEffect.actor === "player" : isPlayer);
    const pTarget = (f.moveEffect ? f.moveEffect.actor === "enemy" : !isPlayer);

    const eAlpha = (f.targetAlpha !== undefined && eTarget) ? f.targetAlpha : 1.0;
    const pAlpha = (f.targetAlpha !== undefined && pTarget) ? f.targetAlpha : 1.0;

    // Pokémon Silhouette Shadows (cast onto platform ground)
    if (enemySprite && eAlpha > 0.02 && (enemy.hp > 0 || f.enemyHp > 0)) {
      const eShadowX = em.x + f.eOffset.x;
      const eShadowY = em.y;
      drawPokemonSilhouetteShadow(targetCtx, enemySprite, eShadowX, eShadowY, em.size, false, 0.42 * eAlpha);
    }

    if (playerSprite && pAlpha > 0.02 && (playerMon.hp > 0 || f.playerHp > 0)) {
      const pShadowX = pm.x + f.pOffset.x;
      const pShadowY = pm.y;
      drawPokemonSilhouetteShadow(targetCtx, playerSprite, pShadowX, pShadowY, pm.size, true, 0.42 * pAlpha);
    }

    // Enemy Sprite
    if (enemySprite && eAlpha > 0.01 && (enemy.hp > 0 || f.enemyHp > 0 || f.targetAlpha !== 0.0)) {
      targetCtx.save();
      if (f.hitFlash && eTarget) {
        targetCtx.filter = "brightness(1.35)";
      }
      if (eAlpha < 0.99) {
        targetCtx.globalAlpha = eAlpha;
      }
      drawFittedBattleSprite(targetCtx, enemySprite, em.x + f.eOffset.x, em.y + f.eOffset.y, em.size);
      targetCtx.restore();
    }

    // Player Sprite
    if (playerSprite && pAlpha > 0.01 && (playerMon.hp > 0 || f.playerHp > 0 || f.targetAlpha !== 0.0)) {
      targetCtx.save();
      if (f.hitFlash && pTarget) {
        targetCtx.filter = "brightness(1.35)";
      }
      if (pAlpha < 0.99) {
        targetCtx.globalAlpha = pAlpha;
      }
      drawFittedBattleSprite(targetCtx, playerSprite, pm.x + f.pOffset.x, pm.y + f.pOffset.y, pm.size);
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

    // Stat Boost / Drop Arrow Particles
    if (f.statProgress !== undefined) {
      const activeEffect = f.moveEffect || battle.lastMoveEffect;
      const statChanges = activeEffect?.statChanges || battle.lastMoveEffect?.statChanges;
      if (statChanges && statChanges.length > 0) {
        for (const change of statChanges) {
          const targetPos = change.target === "player"
            ? { x: pm.x + f.pOffset.x, y: pm.y + f.pOffset.y - pm.size * 0.45 }
            : { x: em.x + f.eOffset.x, y: em.y + f.eOffset.y - em.size * 0.45 };

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
