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
 * Renders a pixel-perfect multi-frame animated GIF for a battle move execution
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

  const enemyShinyTier = (enemy as any).shinyTier !== undefined
    ? (enemy as any).shinyTier
    : (enemy.isShiny ? 1 : 0);

  const playerShinyTier = ((playerMon as any).hasIllusion && (playerMon as any).illusionTarget)
    ? ((playerMon as any).illusionTarget.shinyTier !== undefined ? (playerMon as any).illusionTarget.shinyTier : ((playerMon as any).illusionTarget.isShiny ? 1 : 0))
    : ((playerMon as any).shinyTier !== undefined ? (playerMon as any).shinyTier : ((playerMon as any).isShiny ? 1 : 0));

  // Preload arena and battler sprites exactly like canvasRenderer
  const [arena, pbAssets, enemySprite, playerSprite] = await Promise.all([
    getArenaAssets(battle.biome || "Town"),
    getPbInfoAssets(),
    getPokemonSprite(enemyActiveSpecies, true, enemyShinyTier, false),
    getPokemonSprite(playerActiveSpecies, true, playerShinyTier, true),
  ]);

  const encoder = new GIFEncoder(width, height, "octree", true);
  encoder.setRepeat(-1);  // 1회만 재생 후 마지막 정적 프레임에서 영구 정지 (무한 루프 방지)
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const enemyHp = enemy.hp;
  const playerHp = playerMon.hp;

  // Frame Configurations (Attacker Lunge -> Strike -> Hit Flash -> Settle Hold)
  const framesConfig = [
    // Frame 1: Windup & Lunge Start (120ms)
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
    // Frame 2: Move Effect Strikes Target (140ms)
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
    // Frame 3: Defender Hit Flash & Knockback (160ms)
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
    // Frame 4: Damage Settled & Final Still Result (4000ms 유지 / 정지)
    {
      delay: 4000,
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

    // 1. Arena Background
    if (arena.bg) {
      ctx.drawImage(arena.bg, 0, 0, width, 275);
    } else {
      ctx.fillStyle = "#487848";
      ctx.fillRect(0, 0, width, 275);
    }

    // 2. Platforms (Exact match to canvasRenderer)
    if (arena.b) {
      // Enemy Platform (Top-Right)
      ctx.drawImage(arena.b, ep.x, ep.y, enemyPlatW, enemyPlatH);

      // Player Platform (Foreground Bottom-Left, mirrored)
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(arena.b, pp.x, pp.y, playerPlatW, playerPlatH);
      ctx.restore();
    }

    // 3. Enemy Sprite
    if (enemySprite) {
      ctx.save();
      if (f.hitFlash && isPlayer) {
        ctx.filter = "brightness(1.8) contrast(1.2)";
      }
      drawFittedBattleSprite(ctx, enemySprite, em.x + f.eOffset.x, em.y + f.eOffset.y, em.size);
      ctx.restore();
    }

    // 4. Player Sprite
    if (playerSprite) {
      ctx.save();
      if (f.hitFlash && !isPlayer) {
        ctx.filter = "brightness(1.8) contrast(1.2)";
      }
      drawFittedBattleSprite(ctx, playerSprite, pm.x + f.pOffset.x, pm.y + f.pOffset.y, pm.size);
      ctx.restore();
    }

    // 5. Draw Move Effect (if active on this frame)
    if (f.showEffect) {
      renderMoveEffect(ctx, {
        moveKey,
        type,
        isSpecial,
        isPlayerAttacking: isPlayer
      });
    }

    // 6. Top Right: Biome - Wave, Money & Weather
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

    // 7. Enemy HUD Box
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
      hp: f.enemyHp,
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

    // 8. Player HUD Box
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
      hp: f.playerHp,
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

    // 9. Bottom Dialogue Box (Exact match to canvasRenderer)
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

    const linesToShow = dialogueLines.slice(0, f.textLineIdx);
    linesToShow.slice(0, 3).forEach((line: string, lIdx: number) => {
      ctx.fillText(line, 24, boxY + 16 + lIdx * 25);
    });

    encoder.setDelay(f.delay);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}
