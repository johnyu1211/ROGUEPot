// @ts-ignore
import GIFEncoder from "gif-encoder-2";
import { createCanvas } from "@napi-rs/canvas";
import { BattleState } from "../services/battleService.js";
import { renderMoveEffect } from "./moveEffectRenderer.js";
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

/**
 * 1. Standard Move Execution GIF (Attack lunge -> Effect strike -> Hit flash -> Settle)
 */
export async function renderBattleMoveGif(options: BattleAnimationOptions): Promise<Buffer> {
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

  const framesConfig = [
    {
      delay: 120,
      pOffset: isPlayer ? (isSpecial ? { x: 0, y: -6 } : { x: 12, y: -6 }) : { x: 0, y: 0 },
      eOffset: !isPlayer ? (isSpecial ? { x: 0, y: -6 } : { x: -12, y: 6 }) : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      enemyHp: enemyHp,
      playerHp: playerHp,
      textLineIdx: 1
    },
    {
      delay: 140,
      pOffset: isPlayer ? (isSpecial ? { x: 0, y: -4 } : { x: 18, y: -10 }) : { x: 0, y: 0 },
      eOffset: !isPlayer ? (isSpecial ? { x: 0, y: -4 } : { x: -18, y: 10 }) : { x: 0, y: 0 },
      showEffect: true,
      hitFlash: false,
      enemyHp: enemyHp,
      playerHp: playerHp,
      textLineIdx: 1
    },
    {
      delay: 160,
      pOffset: isPlayer ? { x: 8, y: -4 } : { x: 0, y: 0 },
      eOffset: isPlayer ? { x: 8, y: -4 } : { x: -8, y: 4 },
      showEffect: true,
      hitFlash: true,
      enemyHp: enemyHp,
      playerHp: playerHp,
      textLineIdx: 2
    },
    {
      delay: 10000,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      enemyHp: enemyHp,
      playerHp: playerHp,
      textLineIdx: 3
    }
  ];

  const ep = BATTLE_LAYOUT_CONFIG.enemyPlatform;
  const pp = BATTLE_LAYOUT_CONFIG.playerPlatform;
  const enemyPlatW = 320 * ep.scale;
  const enemyPlatH = 132 * ep.scale;
  const playerPlatW = 320 * pp.scale;
  const playerPlatH = 132 * pp.scale;

  const em = BATTLE_LAYOUT_CONFIG.enemyPokemon;
  const pm = BATTLE_LAYOUT_CONFIG.playerPokemon;

  for (const f of framesConfig) {
    ctx.clearRect(0, 0, width, height);

    if (arena.bg) ctx.drawImage(arena.bg, 0, 0, width, 275);
    else { ctx.fillStyle = "#487848"; ctx.fillRect(0, 0, width, 275); }

    if (arena.b) {
      ctx.drawImage(arena.b, ep.x, ep.y, enemyPlatW, enemyPlatH);
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(arena.b, pp.x, pp.y, playerPlatW, playerPlatH);
      ctx.restore();
    }

    if (enemySprite) {
      ctx.save();
      if (f.hitFlash && isPlayer) ctx.filter = "brightness(1.8) contrast(1.2)";
      drawFittedBattleSprite(ctx, enemySprite, em.x + f.eOffset.x, em.y + f.eOffset.y, em.size);
      ctx.restore();
    }

    if (playerSprite) {
      ctx.save();
      if (f.hitFlash && !isPlayer) ctx.filter = "brightness(1.8) contrast(1.2)";
      drawFittedBattleSprite(ctx, playerSprite, pm.x + f.pOffset.x, pm.y + f.pOffset.y, pm.size);
      ctx.restore();
    }

    if (f.showEffect) {
      renderMoveEffect(ctx, { moveKey, type, isSpecial, isPlayerAttacking: isPlayer });
    }

    renderBattleHeader(ctx, width, battle, isKo);
    renderBattleHuds(ctx, battle, isKo, pbAssets, f.enemyHp, f.playerHp);
    renderBattleDialogue(ctx, width, height, dialogueLines, f.textLineIdx);

    encoder.setDelay(f.delay);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

/**
 * 2. Knockout / Fainting GIF (Hit spark -> Sinking into ground with Fade Out -> Empty Platform)
 */
export async function renderBattleFaintGif(options: BattleAnimationOptions): Promise<Buffer> {
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

  // Faint Animation Frames (Hit -> Sink 1 -> Sink 2 / Fade -> Gone / Empty)
  const faintFrames = [
    // Frame 1: Hit Flash (130ms)
    { delay: 130, showEffect: true, hitFlash: true, eOffsetY: -4, opacity: 1.0, enemyHp: 0, textLineIdx: 1 },
    // Frame 2: Sinking Begins (140ms)
    { delay: 140, showEffect: false, hitFlash: false, eOffsetY: 14, opacity: 0.75, enemyHp: 0, textLineIdx: 2 },
    // Frame 3: Deep Sink & Fade Out (150ms)
    { delay: 150, showEffect: false, hitFlash: false, eOffsetY: 38, opacity: 0.35, enemyHp: 0, textLineIdx: 2 },
    // Frame 4: Completely Fainted / Empty Platform (Holds for 10000ms / 10초 정적 대기)
    { delay: 10000, showEffect: false, hitFlash: false, eOffsetY: 70, opacity: 0.0, enemyHp: 0, textLineIdx: 3 }
  ];

  const ep = BATTLE_LAYOUT_CONFIG.enemyPlatform;
  const pp = BATTLE_LAYOUT_CONFIG.playerPlatform;
  const enemyPlatW = 320 * ep.scale;
  const enemyPlatH = 132 * ep.scale;
  const playerPlatW = 320 * pp.scale;
  const playerPlatH = 132 * pp.scale;

  const em = BATTLE_LAYOUT_CONFIG.enemyPokemon;
  const pm = BATTLE_LAYOUT_CONFIG.playerPokemon;

  for (const f of faintFrames) {
    ctx.clearRect(0, 0, width, height);

    if (arena.bg) ctx.drawImage(arena.bg, 0, 0, width, 275);
    else { ctx.fillStyle = "#487848"; ctx.fillRect(0, 0, width, 275); }

    if (arena.b) {
      ctx.drawImage(arena.b, ep.x, ep.y, enemyPlatW, enemyPlatH);
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(arena.b, pp.x, pp.y, playerPlatW, playerPlatH);
      ctx.restore();
    }

    // Enemy Fainting Sprite (Sliding Down + Fading Opacity)
    if (enemySprite && f.opacity > 0) {
      ctx.save();
      ctx.globalAlpha = f.opacity;
      if (f.hitFlash) ctx.filter = "brightness(1.8) contrast(1.2)";
      drawFittedBattleSprite(ctx, enemySprite, em.x, em.y + f.eOffsetY, em.size);
      ctx.restore();
    }

    if (playerSprite) {
      drawFittedBattleSprite(ctx, playerSprite, pm.x, pm.y, pm.size);
    }

    if (f.showEffect) {
      renderMoveEffect(ctx, { moveKey, type, isSpecial, isPlayerAttacking: true });
    }

    renderBattleHeader(ctx, width, battle, isKo);
    renderBattleHuds(ctx, battle, isKo, pbAssets, f.enemyHp, playerMon.hp);
    renderBattleDialogue(ctx, width, height, dialogueLines, f.textLineIdx);

    encoder.setDelay(f.delay);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

/**
 * 3. Wild Encounter Entry GIF (Terrain slides left-to-right, Enemy slides right-to-left)
 */
export async function renderBattleEntryGif(options: BattleAnimationOptions): Promise<Buffer> {
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

  // Entry Slide Frames:
  // - Terrain (Left Platform): Slides in from left (-200 -> -90 -> -25 -> 0)
  // - Enemy Platform: Slides in from right (+200 -> +90 -> +25 -> 0)
  // - Enemy Pokemon: Slides in from outside-right (+240 -> +110 -> +30 -> 0)
  // - Player Pokemon: Slides in from outside-left (-240 -> -110 -> -30 -> 0)
  const entryFrames = [
    { delay: 110, pPlatX: -180, ePlatX: 180, pMonX: -220, eMonX: 220, showHud: false, textLineIdx: 0 },
    { delay: 120, pPlatX: -80, ePlatX: 80, pMonX: -100, eMonX: 100, showHud: false, textLineIdx: 0 },
    { delay: 130, pPlatX: -20, ePlatX: 20, pMonX: -25, eMonX: 25, showHud: true, textLineIdx: 1 },
    { delay: 10000, pPlatX: 0, ePlatX: 0, pMonX: 0, eMonX: 0, showHud: true, textLineIdx: 2 }
  ];

  const ep = BATTLE_LAYOUT_CONFIG.enemyPlatform;
  const pp = BATTLE_LAYOUT_CONFIG.playerPlatform;
  const enemyPlatW = 320 * ep.scale;
  const enemyPlatH = 132 * ep.scale;
  const playerPlatW = 320 * pp.scale;
  const playerPlatH = 132 * pp.scale;

  const em = BATTLE_LAYOUT_CONFIG.enemyPokemon;
  const pm = BATTLE_LAYOUT_CONFIG.playerPokemon;

  for (const f of entryFrames) {
    ctx.clearRect(0, 0, width, height);

    if (arena.bg) ctx.drawImage(arena.bg, 0, 0, width, 275);
    else { ctx.fillStyle = "#487848"; ctx.fillRect(0, 0, width, 275); }

    // Sliding Platforms
    if (arena.b) {
      // Enemy Platform sliding from right
      ctx.drawImage(arena.b, ep.x + f.ePlatX, ep.y, enemyPlatW, enemyPlatH);
      // Player Platform sliding from left
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(arena.b, pp.x + f.pPlatX, pp.y, playerPlatW, playerPlatH);
      ctx.restore();
    }

    // Sliding Battler Sprites
    if (enemySprite) {
      drawFittedBattleSprite(ctx, enemySprite, em.x + f.eMonX, em.y, em.size);
    }
    if (playerSprite) {
      drawFittedBattleSprite(ctx, playerSprite, pm.x + f.pMonX, pm.y, pm.size);
    }

    renderBattleHeader(ctx, width, battle, isKo);

    if (f.showHud) {
      renderBattleHuds(ctx, battle, isKo, pbAssets, enemy.hp, playerMon.hp);
    }

    renderBattleDialogue(ctx, width, height, dialogueLines, f.textLineIdx);

    encoder.setDelay(f.delay);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
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
  ctx.font = "bold 15px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";

  if (textLineIdx > 0) {
    const linesToShow = dialogueLines.slice(0, textLineIdx);
    linesToShow.slice(0, 3).forEach((line: string, lIdx: number) => {
      ctx.fillText(line, 24, boxY + 16 + lIdx * 25);
    });
  }
}
