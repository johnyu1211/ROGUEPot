// @ts-ignore
import GIFEncoder from "gif-encoder-2";
import { createCanvas } from "@napi-rs/canvas";
import { BattleState } from "../services/battleService.js";
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

  let framesConfig: any[] = [];

  if (hasMultipleActions) {
    const a1 = turnActions[0];
    const a2 = turnActions[1];
    const isP1 = a1.actor === "player";
    const isP2 = a2.actor === "player";

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
      // === ACT 1: First Attacker (e.g. Player) ===
      // Frame 1: Attacker 1 Windup & Lunge (180ms)
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
      // Frame 2: Attacker 1 Strike Impact & Move Effect (240ms)
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
      },
      // Frame 3: Attacker 1 Recoil & Damage Settling (420ms - allows reading action 1 outcome!)
      {
        delay: 420,
        pOffset: isP1 ? { x: 6, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP1 ? { x: -6, y: 3 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a1.enemyHpAfter,
        playerHp: a1.playerHpAfter,
        textLineIdx: 2,
        statProgress: undefined,
        isBlur: false,
        moveEffect: a1,
      },
      // Frame 4: Natural Breathing Room Pause between Turns (380ms - comfortable reading pause!)
      {
        delay: 380,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a1.enemyHpAfter,
        playerHp: a1.playerHpAfter,
        textLineIdx: 2,
        statProgress: undefined,
        isBlur: false,
        moveEffect: a1,
      },
      // === ACT 2: Counter-Attacker (e.g. Enemy) ===
      // Frame 5: Attacker 2 Windup & Counter Lunge (180ms)
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
      // Frame 6: Attacker 2 Counter Strike Impact & Move Effect (240ms)
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
      },
      // Frame 7: Attacker 2 Recoil & Stat Changes Start (450ms - allows reading counter attack log!)
      {
        delay: 450,
        pOffset: isP2 ? { x: 6, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP2 ? { x: -6, y: 3 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a2.enemyHpAfter,
        playerHp: a2.playerHpAfter,
        textLineIdx: 99,
        statProgress: 0.75,
        isBlur: false,
        moveEffect: a2,
      },
      // Frame 8: Neutral Return & Stat Changes Peak (320ms)
      {
        delay: 320,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a2.enemyHpAfter,
        playerHp: a2.playerHpAfter,
        textLineIdx: 99,
        statProgress: 0.95,
        isBlur: false,
        moveEffect: a2,
      },
      // Frame 9: 11-Minute Static Hold Frame (655,000ms)
      {
        delay: 655000,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a2.enemyHpAfter,
        playerHp: a2.playerHpAfter,
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
    };

    framesConfig = [
      // Frame 0: Leading Cinematic Soft-Blur Loading Frame (800ms / 0.8s)
      {
        delay: 800,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: enemyHp,
        playerHp: playerHp,
        textLineIdx: 0,
        statProgress: undefined,
        isBlur: true,
      },
      // Frame 1: Attacker Windup & Lunge (180ms)
      {
        delay: 180,
        pOffset: isP1 ? (eff.isSpecial ? { x: 0, y: -6 } : { x: 18, y: -8 }) : { x: 0, y: 0 },
        eOffset: !isP1 ? (eff.isSpecial ? { x: 0, y: -6 } : { x: -18, y: 8 }) : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: enemyHp,
        playerHp: playerHp,
        textLineIdx: 1,
        statProgress: undefined,
        isBlur: false,
        moveEffect: eff,
      },
      // Frame 2: Move Effect Strikes Target (240ms)
      {
        delay: 240,
        pOffset: isP1 ? (eff.isSpecial ? { x: 0, y: -4 } : { x: 20, y: -10 }) : { x: 0, y: 0 },
        eOffset: isP1 ? { x: 8, y: -2 } : (eff.isSpecial ? { x: 0, y: -4 } : { x: -20, y: 10 }),
        showEffect: true,
        hitFlash: true,
        enemyHp: enemyHp,
        playerHp: playerHp,
        textLineIdx: 1,
        statProgress: 0.25,
        isBlur: false,
        moveEffect: eff,
      },
      // Frame 3: Recoil & Damage Settling (300ms)
      {
        delay: 300,
        pOffset: isP1 ? { x: 6, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP1 ? { x: -6, y: 3 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: enemyHp,
        playerHp: playerHp,
        textLineIdx: 2,
        statProgress: 0.65,
        isBlur: false,
        moveEffect: eff,
      },
      // Frame 4: Neutral Return & Stat Particles Peak (240ms)
      {
        delay: 240,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: enemyHp,
        playerHp: playerHp,
        textLineIdx: 3,
        statProgress: 0.95,
        isBlur: false,
        moveEffect: eff,
      },
      // Frame 5: 11-Minute Static Hold Frame (655,000ms)
      {
        delay: 655000,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: enemyHp,
        playerHp: playerHp,
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

    if (arena.bg) targetCtx.drawImage(arena.bg, 0, 0, width, 275);
    else { targetCtx.fillStyle = "#487848"; targetCtx.fillRect(0, 0, width, 275); }

    if (arena.b) {
      targetCtx.drawImage(arena.b, ep.x, ep.y, enemyPlatW, enemyPlatH);
      targetCtx.save();
      targetCtx.translate(width, 0);
      targetCtx.scale(-1, 1);
      targetCtx.drawImage(arena.b, pp.x, pp.y, playerPlatW, playerPlatH);
      targetCtx.restore();
    }

    if (enemySprite) {
      targetCtx.save();
      if (f.hitFlash && ((f.moveEffect ? f.moveEffect.actor === "player" : isPlayer))) {
        targetCtx.filter = "brightness(1.8) contrast(1.2)";
      }
      drawFittedBattleSprite(targetCtx, enemySprite, em.x + f.eOffset.x, em.y + f.eOffset.y, em.size);
      targetCtx.restore();
    }

    if (playerSprite) {
      targetCtx.save();
      if (f.hitFlash && ((f.moveEffect ? f.moveEffect.actor === "enemy" : !isPlayer))) {
        targetCtx.filter = "brightness(1.8) contrast(1.2)";
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
      targetCtx.fillStyle = "#131924";
      targetCtx.fillRect(0, boxY, width, height - boxY);
      targetCtx.strokeStyle = "#0D9488";
      targetCtx.lineWidth = 2.5;
      targetCtx.beginPath();
      targetCtx.moveTo(0, boxY);
      targetCtx.lineTo(width, boxY);
      targetCtx.stroke();

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
 * 2. Knockout / Fainting GIF:
 * Frame 0: Leading Cinematic Soft-Blur Loading Frame (500ms)
 * Frame 1: Hit Strike & KO Flash (Effect ONCE!)
 * Frame 2: Sinking begins (Effect OFF)
 * Frame 3: Deep sinking beneath ground (Effect OFF)
 * Frame 4: Disappeared / Empty platform (Effect OFF)
 * Frame 5: 60-Second Static Hold Frame
 */
export async function renderBattleFaintGif(options: BattleAnimationOptions): Promise<RenderGifResult> {
  const width = 560;
  const height = 380;
  const isKo = options.lang === "ko";
  const battle = options.battle;
  const enemy = battle.enemy;
  const playerMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];

  const moveKey = options.moveKey || battle.lastMoveEffect?.moveKey || "tackle";
  const type = options.type || battle.lastMoveEffect?.type || "normal";
  const isSpecial = options.isSpecial !== undefined ? options.isSpecial : (battle.lastMoveEffect?.isSpecial ?? false);

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

  const faintFrames = [
    // Frame 0: Leading Cinematic Soft-Blur Loading Frame (800ms / 0.8s) - Calm pre-strike stance without text!
    { delay: 800, showEffect: false, hitFlash: false, eOffsetY: 0, opacity: 1.0, enemyHp: enemy.hp, textLineIdx: 0, isBlur: true },
    // Frame 1: Hit Flash (180ms) - ONLY FRAME WITH EFFECT!
    { delay: 180, showEffect: true, hitFlash: true, eOffsetY: -4, opacity: 1.0, enemyHp: 0, textLineIdx: 1, isBlur: false },
    // Frame 2: Sinking Begins (220ms) - EFFECT OFF!
    { delay: 220, showEffect: false, hitFlash: false, eOffsetY: 18, opacity: 0.75, enemyHp: 0, textLineIdx: 2, isBlur: false },
    // Frame 3: Deep Sink & Fade Out (220ms) - EFFECT OFF!
    { delay: 220, showEffect: false, hitFlash: false, eOffsetY: 45, opacity: 0.35, enemyHp: 0, textLineIdx: 2, isBlur: false },
    // Frame 4: Completely Gone (200ms) - EFFECT OFF!
    { delay: 200, showEffect: false, hitFlash: false, eOffsetY: 70, opacity: 0.0, enemyHp: 0, textLineIdx: 3, isBlur: false },
    // Frame 5: 11-Minute Static Hold Frame (655,000ms - Maximum GIF89a unsigned 16-bit delay limit)
    { delay: 655000, showEffect: false, hitFlash: false, eOffsetY: 70, opacity: 0.0, enemyHp: 0, textLineIdx: 99, isBlur: false }
  ];

  const motionDurationMs = faintFrames.slice(0, -1).reduce((sum, f) => sum + f.delay, 0);

  const ep = BATTLE_LAYOUT_CONFIG.enemyPlatform;
  const pp = BATTLE_LAYOUT_CONFIG.playerPlatform;
  const enemyPlatW = 320 * ep.scale;
  const enemyPlatH = 132 * ep.scale;
  const playerPlatW = 320 * pp.scale;
  const playerPlatH = 132 * pp.scale;

  const em = BATTLE_LAYOUT_CONFIG.enemyPokemon;
  const pm = BATTLE_LAYOUT_CONFIG.playerPokemon;

  const offFaintCanvas = createCanvas(width, height);
  const offFaintCtx = offFaintCanvas.getContext("2d");
  offFaintCtx.imageSmoothingEnabled = false;

  for (const f of faintFrames) {
    const targetCtx = f.isBlur ? offFaintCtx : ctx;
    targetCtx.clearRect(0, 0, width, height);

    if (arena.bg) targetCtx.drawImage(arena.bg, 0, 0, width, 275);
    else { targetCtx.fillStyle = "#487848"; targetCtx.fillRect(0, 0, width, 275); }

    if (arena.b) {
      targetCtx.drawImage(arena.b, ep.x, ep.y, enemyPlatW, enemyPlatH);
      targetCtx.save();
      targetCtx.translate(width, 0);
      targetCtx.scale(-1, 1);
      targetCtx.drawImage(arena.b, pp.x, pp.y, playerPlatW, playerPlatH);
      targetCtx.restore();
    }

    // Enemy Fainting Sprite (Sliding Down + Fading Opacity)
    if (enemySprite && f.opacity > 0) {
      targetCtx.save();
      targetCtx.globalAlpha = f.opacity;
      if (f.hitFlash) targetCtx.filter = "brightness(1.8) contrast(1.2)";
      drawFittedBattleSprite(targetCtx, enemySprite, em.x, em.y + f.eOffsetY, em.size);
      targetCtx.restore();
    }

    if (playerSprite) {
      drawFittedBattleSprite(targetCtx, playerSprite, pm.x, pm.y, pm.size);
    }

    if (f.showEffect) {
      renderMoveEffect(targetCtx, { moveKey, type, isSpecial, isPlayerAttacking: true });
    }

    if (!f.isBlur) {
      renderBattleHeader(targetCtx, width, battle, isKo);
      renderBattleHuds(targetCtx, battle, isKo, pbAssets, f.enemyHp, playerMon.hp);
      renderBattleDialogue(targetCtx, width, height, dialogueLines, f.textLineIdx);
    } else {
      // Base empty dialogue box drawn on offCanvas before full-frame blur
      const boxY = 270;
      targetCtx.fillStyle = "#131924";
      targetCtx.fillRect(0, boxY, width, height - boxY);
      targetCtx.strokeStyle = "#0D9488";
      targetCtx.lineWidth = 2.5;
      targetCtx.beginPath();
      targetCtx.moveTo(0, boxY);
      targetCtx.lineTo(width, boxY);
      targetCtx.stroke();

      // Apply UNIFIED 100% Full-Screen Blur to the main canvas
      ctx.clearRect(0, 0, width, height);
      ctx.filter = "blur(6px) brightness(0.88)";
      ctx.drawImage(offFaintCanvas, 0, 0, width, height);
      ctx.filter = "none";
    }

    encoder.setDelay(f.delay);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return { buffer: encoder.out.getData(), motionDurationMs };
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

    if (arena.bg) targetCtx.drawImage(arena.bg, 0, 0, width, 275);
    else { targetCtx.fillStyle = "#487848"; targetCtx.fillRect(0, 0, width, 275); }

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
      targetCtx.fillStyle = "#131924";
      targetCtx.fillRect(0, boxY, width, height - boxY);
      targetCtx.strokeStyle = "#0D9488";
      targetCtx.lineWidth = 2.5;
      targetCtx.beginPath();
      targetCtx.moveTo(0, boxY);
      targetCtx.lineTo(width, boxY);
      targetCtx.stroke();

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
  ctx.fillStyle = "#131924";
  ctx.fillRect(0, boxY, width, height - boxY);

  ctx.strokeStyle = "#0D9488";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, boxY);
  ctx.lineTo(width, boxY);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, boxY + 2);
  ctx.lineTo(width, boxY + 2);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "bold 14px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";

  if (textLineIdx > 0) {
    const fullText = dialogueLines.join("\n");
    const wrapped = wrapDialogueText(ctx, fullText, width - 48);
    const available = wrapped.slice(0, textLineIdx);
    const linesToShow = available.length > 3 ? available.slice(-3) : available;
    linesToShow.forEach((line: string, lIdx: number) => {
      ctx.fillText(line, 24, boxY + 16 + lIdx * 26);
    });
  }
}
