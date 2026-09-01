// @ts-ignore
import GIFEncoder from "gif-encoder-2";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
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
  moveKey: string;
  attackerName: string;
  moveNameKo: string;
  moveNameEn: string;
  type: string;
  isSpecial: boolean;
  isPlayerAttacking: boolean;
  damage: number;
  enemyOldHp: number;
  enemyNewHp: number;
  playerOldHp: number;
  playerNewHp: number;
  dialogueLines: string[];
}

/**
 * Renders a full multi-frame animated GIF for a battle move execution
 */
export async function renderBattleMoveGif(options: BattleAnimationOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const isKo = options.lang === "ko";
  const battle = options.battle;
  const enemy = battle.enemy;
  const playerMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];

  // Preload arena and battler sprites
  const [arena, pbAssets, enemySprite, playerSprite] = await Promise.all([
    getArenaAssets(battle.biome || "Town"),
    getPbInfoAssets(),
    getPokemonSprite(enemy.speciesId, true, enemy.shinyTier || 0, false),
    getPokemonSprite(playerMon.speciesId, true, playerMon.shinyTier || 0, true),
  ]);

  const encoder = new GIFEncoder(width, height, "octree", true);
  encoder.setDelay(140); // 140ms per frame
  encoder.setRepeat(0);  // Loop
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // Frame Configurations (Attacker Lunge -> Strike -> Hit Flash -> Settle)
  const isPlayer = options.isPlayerAttacking;
  const isSpecial = options.isSpecial;

  const framesConfig = [
    // Frame 1: Windup & Lunge Start
    {
      pOffset: isPlayer ? (isSpecial ? { x: 0, y: -8 } : { x: 18, y: -10 }) : { x: 0, y: 0 },
      eOffset: !isPlayer ? (isSpecial ? { x: 0, y: -8 } : { x: -18, y: 10 }) : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      enemyHp: options.enemyOldHp,
      playerHp: options.playerOldHp,
      textLineIdx: 1
    },
    // Frame 2: Move Effect Strikes Target
    {
      pOffset: isPlayer ? (isSpecial ? { x: 0, y: -4 } : { x: 28, y: -16 }) : { x: 0, y: 0 },
      eOffset: !isPlayer ? (isSpecial ? { x: 0, y: -4 } : { x: -28, y: 16 }) : { x: 0, y: 0 },
      showEffect: true,
      hitFlash: false,
      enemyHp: options.enemyOldHp,
      playerHp: options.playerOldHp,
      textLineIdx: 1
    },
    // Frame 3: Defender Hit Flash & Knockback
    {
      pOffset: isPlayer ? { x: 12, y: -6 } : { x: 0, y: 0 },
      eOffset: isPlayer ? { x: 8, y: -4 } : { x: -12, y: 6 },
      showEffect: true,
      hitFlash: true,
      enemyHp: Math.round((options.enemyOldHp + options.enemyNewHp) / 2),
      playerHp: Math.round((options.playerOldHp + options.playerNewHp) / 2),
      textLineIdx: 2
    },
    // Frame 4: Damage Settled & Final HP
    {
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      enemyHp: options.enemyNewHp,
      playerHp: options.playerNewHp,
      textLineIdx: 3
    }
  ];

  for (const f of framesConfig) {
    ctx.clearRect(0, 0, width, height);

    // 1. Arena Background
    if (arena.bg) {
      ctx.drawImage(arena.bg, 0, 0, width, 270);
    } else {
      ctx.fillStyle = "#487848";
      ctx.fillRect(0, 0, width, 270);
    }

    // 2. Enemy Platform
    const ep = BATTLE_LAYOUT_CONFIG.enemyPlatform;
    if (arena.b) {
      const ePlatW = arena.b.width * ep.scale;
      const ePlatH = arena.b.height * ep.scale;
      ctx.drawImage(arena.b, width - ep.x - ePlatW, ep.y, ePlatW, ePlatH);
    }

    // 3. Player Platform (Mirrored)
    const pp = BATTLE_LAYOUT_CONFIG.playerPlatform;
    if (arena.b) {
      const pPlatW = arena.b.width * pp.scale;
      const pPlatH = arena.b.height * pp.scale;
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(arena.b, pp.x, pp.y, pPlatW, pPlatH);
      ctx.restore();
    }

    // 4. Enemy Sprite
    const em = BATTLE_LAYOUT_CONFIG.enemyPokemon;
    if (enemySprite) {
      ctx.save();
      if (f.hitFlash && isPlayer) {
        ctx.filter = "brightness(1.8) contrast(1.2)";
      }
      drawFittedBattleSprite(ctx, enemySprite, em.x + f.eOffset.x, em.y + f.eOffset.y, em.size);
      ctx.restore();
    }

    // 5. Player Sprite
    const pm = BATTLE_LAYOUT_CONFIG.playerPokemon;
    if (playerSprite) {
      ctx.save();
      if (f.hitFlash && !isPlayer) {
        ctx.filter = "brightness(1.8) contrast(1.2)";
      }
      drawFittedBattleSprite(ctx, playerSprite, pm.x + f.pOffset.x, pm.y + f.pOffset.y, pm.size);
      ctx.restore();
    }

    // 6. Draw Move Effect (if active on this frame)
    if (f.showEffect) {
      renderMoveEffect(ctx, {
        moveKey: options.moveKey,
        type: options.type,
        isSpecial: options.isSpecial,
        isPlayerAttacking: options.isPlayerAttacking
      });
    }

    // 7. Top Right: Biome - Wave & Money
    const rawBiome = battle.biome || "Town";
    const biomeDisplay = isKo ? (BIOME_NAMES_KO[rawBiome.toLowerCase()] || rawBiome) : rawBiome;
    const waveText = `${biomeDisplay} - ${battle.wave || 1}`;
    const moneyText = formatMoney(battle.money || 0);

    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    const textX = width - 24;

    ctx.font = "bold 15px DungGeunMo";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
    ctx.lineWidth = 3.5;
    ctx.strokeText(waveText, textX, 14);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(waveText, textX, 14);

    ctx.font = "bold 13px DungGeunMo";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
    ctx.lineWidth = 3.0;
    ctx.strokeText(moneyText, textX, 34);
    ctx.fillStyle = "#FDE047";
    ctx.fillText(moneyText, textX, 34);

    // 8. Enemy HUD Box
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

    // 9. Player HUD Box
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

    // 10. Bottom Dialogue Box
    const boxY = 270;
    ctx.fillStyle = "#131924";
    ctx.fillRect(0, boxY, width, height - boxY);

    ctx.strokeStyle = "#0D9488";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, boxY);
    ctx.lineTo(width, boxY);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "bold 15px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";

    const linesToShow = options.dialogueLines.slice(0, f.textLineIdx);
    linesToShow.slice(0, 3).forEach((line: string, lIdx: number) => {
      ctx.fillText(line, 24, boxY + 16 + lIdx * 25);
    });

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}
