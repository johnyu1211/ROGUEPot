"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BATTLE_LAYOUT_CONFIG = void 0;
exports.drawPokeRogueBattleHud = drawPokeRogueBattleHud;
var assetLoader_js_1 = require("../common/assetLoader.js");
var textHelpers_js_1 = require("../common/textHelpers.js");
var movesKo_js_1 = require("../../data/movesKo.js");
exports.BATTLE_LAYOUT_CONFIG = {
    enemyPlatform: { scale: 1.5, x: 95, y: 25 },
    playerPlatform: { scale: 2.0, x: -25, y: 130 },
    enemyPokemon: { size: 75, x: 418, y: 135 },
    playerPokemon: { size: 135, x: 150, y: 280 },
    enemyHud: { x: 16, y: 16, w: 228, h: 54 },
    playerHud: { x: 316, y: 180, w: 228, h: 74 }
};
function drawPokeRogueBattleHud(ctx, opt) {
    var x = opt.x, y = opt.y, w = opt.w, h = opt.h, name = opt.name, level = opt.level, hp = opt.hp, maxHp = opt.maxHp, isEnemy = opt.isEnemy, isBoss = opt.isBoss, bossShields = opt.bossShields, statusBadge = opt.statusBadge, exp = opt.exp, maxExp = opt.maxExp, hudImage = opt.hudImage, hpLabel = opt.hpLabel;
    ctx.save();
    var scale = 1.75;
    if (hudImage) {
        // 1. Render Authentic Official PokéRogue Battle Box Sprite
        ctx.drawImage(hudImage, x, y, w, h);
        // 1.1 Render Official Green/Cyan HP Badge on Left of Bar
        if (hpLabel) {
            var labelX = isEnemy ? (x + 41.5 * scale) : (x + 51.5 * scale);
            ctx.drawImage(hpLabel, labelX, y + 17.5 * scale, hpLabel.width * scale, hpLabel.height * scale);
        }
        // 2. Pokémon Name (Centered in top bar, player shifted slightly right for bevel padding)
        var displayName = name + (statusBadge || "");
        ctx.font = "bold 13px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        var nameX = isEnemy ? (x + 16 * scale) : (x + 20 * scale);
        ctx.fillText(displayName, nameX, y + 10.5 * scale);
        // 3. Level Indicator (Centered in top bar with comfortable breathing room)
        ctx.textAlign = "right";
        ctx.font = "bold 11px DungGeunMo";
        ctx.fillStyle = "#F59E0B";
        var lvLabelX = isEnemy ? (x + w - 34 * scale) : (x + w - 28 * scale);
        var lvNumX = isEnemy ? (x + w - 20 * scale) : (x + w - 14 * scale);
        ctx.fillText("Lv.", lvLabelX, y + 10.5 * scale);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 13px DungGeunMo";
        ctx.fillText(level.toString(), lvNumX, y + 10.5 * scale);
        // 4. HP Bar Gauge inside exact pixel cavity
        var hpRatio = Math.max(0, Math.min(1.0, hp / maxHp));
        var hpColor = hpRatio > 0.5 ? "#22C55E" : hpRatio > 0.2 ? "#EAB308" : "#EF4444";
        if (isEnemy) {
            var slotX = x + 58.5 * scale;
            var slotY = y + 19.3 * scale;
            var slotW = (isBoss ? 87 : 48.5) * scale;
            var slotH = 3.0 * scale;
            if (hpRatio > 0) {
                ctx.fillStyle = hpColor;
                ctx.fillRect(slotX, slotY, slotW * hpRatio, slotH);
            }
            if (isBoss && bossShields !== undefined) {
                for (var s = 0; s < 3; s++) {
                    ctx.fillStyle = s < bossShields ? "#EF4444" : "#475569";
                    ctx.beginPath();
                    ctx.roundRect(x + w - 60 - s * 14, y + 5, 10, 4, 1);
                    ctx.fill();
                }
            }
        }
        else {
            var slotX = x + 68.5 * scale;
            var slotY = y + 19.3 * scale;
            var slotW = 48.5 * scale;
            var slotH = 3.0 * scale;
            if (hpRatio > 0) {
                ctx.fillStyle = hpColor;
                ctx.fillRect(slotX, slotY, slotW * hpRatio, slotH);
            }
            // Player HP Numbers (Centered in bottom bar)
            ctx.textAlign = "right";
            ctx.font = "bold 11px DungGeunMo";
            ctx.fillStyle = "#FFFFFF";
            ctx.textBaseline = "middle";
            ctx.fillText("".concat(hp, " / ").concat(maxHp), x + w - 14 * scale, y + 31.5 * scale);
            // Player EXP Bar (Bottom dotted line track: x=33..115)
            var expSlotX = x + 33 * scale;
            var expSlotY = y + 39 * scale;
            var expSlotW = 82 * scale;
            var expSlotH = 2 * scale;
            var expRatio = Math.max(0, Math.min(1.0, (exp || 0) / (maxExp || 100)));
            if (expRatio > 0) {
                ctx.fillStyle = "#38BDF8";
                ctx.fillRect(expSlotX, expSlotY, expSlotW * expRatio, expSlotH);
            }
        }
    }
    ctx.restore();
}
/**


function drawBiomeBackground(ctx: any, width: number, biome: string) {
  const b = biome.toLowerCase();

  if (b.includes("town")) {
    // 1. Town Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#3B82F6");
    sky.addColorStop(0.6, "#93C5FD");
    sky.addColorStop(1, "#E0F2FE");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Soft Clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.beginPath();
    ctx.arc(80, 45, 24, 0, Math.PI * 2);
    ctx.arc(105, 40, 30, 0, Math.PI * 2);
    ctx.arc(130, 45, 22, 0, Math.PI * 2);
    ctx.arc(420, 35, 20, 0, Math.PI * 2);
    ctx.arc(445, 30, 26, 0, Math.PI * 2);
    ctx.arc(470, 35, 18, 0, Math.PI * 2);
    ctx.fill();

    // Distant Town Houses & Roof Silhouettes (y: 95 ~ 160)
    ctx.fillStyle = "#64748B";
    ctx.beginPath();
    ctx.rect(30, 115, 60, 45);
    ctx.moveTo(25, 115); ctx.lineTo(60, 85); ctx.lineTo(95, 115);
    ctx.rect(110, 100, 75, 60);
    ctx.moveTo(105, 100); ctx.lineTo(147, 72); ctx.lineTo(190, 100);
    ctx.rect(210, 85, 45, 75);
    ctx.moveTo(205, 85); ctx.lineTo(232, 60); ctx.lineTo(260, 85);
    ctx.rect(330, 110, 80, 50);
    ctx.moveTo(325, 110); ctx.lineTo(370, 80); ctx.lineTo(415, 110);
    ctx.rect(430, 120, 90, 40);
    ctx.moveTo(425, 120); ctx.lineTo(475, 95); ctx.lineTo(525, 120);
    ctx.fill();

    // Midground Fences & Trees
    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.arc(20, 150, 25, 0, Math.PI * 2);
    ctx.arc(100, 152, 20, 0, Math.PI * 2);
    ctx.arc(310, 148, 28, 0, Math.PI * 2);
    ctx.arc(425, 150, 22, 0, Math.PI * 2);
    ctx.arc(540, 146, 30, 0, Math.PI * 2);
    ctx.fill();

    // Cobblestone Paved Ground (y: 160 ~ 270)
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#94A3B8");
    ground.addColorStop(1, "#475569");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);

    // Cobblestone Grid Textures
    ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
    ctx.lineWidth = 1;
    for (let r = 165; r < 270; r += 14) {
      ctx.beginPath();
      ctx.moveTo(0, r); ctx.lineTo(width, r);
      ctx.stroke();
      const offset = (r % 28 === 0) ? 0 : 15;
      for (let c = offset; c < width; c += 30) {
        ctx.beginPath();
        ctx.moveTo(c, r); ctx.lineTo(c, r + 14);
        ctx.stroke();
      }
    }
  } else if (b.includes("forest")) {
    // Forest Twilight Canopy
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#064E3B");
    sky.addColorStop(0.5, "#047857");
    sky.addColorStop(1, "#10B981");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Dappled Sunlight Rays
    ctx.fillStyle = "rgba(254, 240, 138, 0.15)";
    ctx.beginPath();
    ctx.moveTo(60, 0); ctx.lineTo(140, 270); ctx.lineTo(180, 270); ctx.lineTo(100, 0);
    ctx.moveTo(280, 0); ctx.lineTo(360, 270); ctx.lineTo(410, 270); ctx.lineTo(330, 0);
    ctx.fill();

    // Deep Forest Trees & Trunks
    ctx.fillStyle = "#065F46";
    ctx.beginPath();
    ctx.arc(70, 70, 75, 0, Math.PI * 2);
    ctx.arc(200, 60, 85, 0, Math.PI * 2);
    ctx.arc(360, 65, 80, 0, Math.PI * 2);
    ctx.arc(490, 75, 90, 0, Math.PI * 2);
    ctx.fill();

    // Tree Trunks
    ctx.fillStyle = "#78350F";
    ctx.fillRect(55, 100, 28, 65);
    ctx.fillRect(185, 95, 34, 70);
    ctx.fillRect(345, 100, 30, 65);
    ctx.fillRect(475, 105, 32, 60);

    // Forest Floor with Moss & Leaves
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#14532D");
    ground.addColorStop(1, "#052E16");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);
  } else if (b.includes("cave")) {
    // Cavern Ceiling & Rock Vaults
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#0F172A");
    sky.addColorStop(1, "#1E293B");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Stalactites Hanging from Ceiling
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    const stals = [[30, 65, 20], [80, 95, 26], [140, 55, 18], [210, 80, 22], [280, 110, 30], [350, 70, 20], [420, 90, 24], [480, 60, 18], [530, 85, 22]];
    for (const [sx, sh, sw] of stals) {
      ctx.moveTo(sx - sw / 2, 0);
      ctx.lineTo(sx, sh);
      ctx.lineTo(sx + sw / 2, 0);
    }
    ctx.fill();

    // Glowing Cyan & Purple Crystal Shards
    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.moveTo(115, 140); ctx.lineTo(122, 115); ctx.lineTo(129, 140);
    ctx.moveTo(435, 135); ctx.lineTo(442, 108); ctx.lineTo(449, 135);
    ctx.fill();
    ctx.fillStyle = "#C084FC";
    ctx.beginPath();
    ctx.moveTo(250, 145); ctx.lineTo(256, 122); ctx.lineTo(262, 145);
    ctx.fill();

    // Cave Ground
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#1E293B");
    ground.addColorStop(1, "#0B0F19");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);
  } else if (b.includes("sea")) {
    // Ocean Horizon & Coastal Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 145);
    sky.addColorStop(0, "#0284C7");
    sky.addColorStop(0.7, "#38BDF8");
    sky.addColorStop(1, "#BAE6FD");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 145);

    // Distant Tropical Island Silhouette
    ctx.fillStyle = "#0F766E";
    ctx.beginPath();
    ctx.ellipse(120, 145, 95, 20, 0, Math.PI, 0);
    ctx.ellipse(440, 145, 80, 16, 0, Math.PI, 0);
    ctx.fill();

    // Deep Ocean Water Gradient & Wave Lines (y: 145 ~ 270)
    const ground = ctx.createLinearGradient(0, 145, 0, 270);
    ground.addColorStop(0, "#0369A1");
    ground.addColorStop(0.5, "#0284C7");
    ground.addColorStop(1, "#0C4A6E");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 145, width, 125);

    // White Wave Foam Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 2;
    for (let wy = 160; wy < 270; wy += 22) {
      ctx.beginPath();
      for (let wx = 0; wx < width; wx += 40) {
        ctx.quadraticCurveTo(wx + 20, wy - 4, wx + 40, wy);
      }
      ctx.stroke();
    }
  } else if (b.includes("volcano")) {
    // Fiery Volcanic Sky with Ash & Smoke
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#450A0A");
    sky.addColorStop(0.5, "#7F1D1D");
    sky.addColorStop(1, "#B91C1C");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Jagged Obsidian Volcano Mountain Peaks
    ctx.fillStyle = "#1C1917";
    ctx.beginPath();
    ctx.moveTo(0, 160);
    ctx.lineTo(80, 80);
    ctx.lineTo(160, 130);
    ctx.lineTo(260, 60);
    ctx.lineTo(360, 125);
    ctx.lineTo(460, 70);
    ctx.lineTo(width, 150);
    ctx.lineTo(width, 160);
    ctx.closePath();
    ctx.fill();

    // Molten Lava Falls
    ctx.fillStyle = "#F97316";
    ctx.beginPath();
    ctx.moveTo(255, 75); ctx.lineTo(265, 75); ctx.lineTo(270, 160); ctx.lineTo(250, 160);
    ctx.fill();

    // Scorched Basalt Ground with Magma Glow Fissures
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#292524");
    ground.addColorStop(1, "#0C0A09");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);

    // Glowing Orange Lava Cracks
    ctx.strokeStyle = "#EA580C";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(30, 210); ctx.lineTo(90, 225); ctx.lineTo(150, 215); ctx.lineTo(220, 240);
    ctx.moveTo(320, 220); ctx.lineTo(390, 205); ctx.lineTo(470, 235); ctx.lineTo(530, 220);
    ctx.stroke();
  } else if (b.includes("metropolis")) {
    // Cyberpunk Metropolis Skyline
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#0F172A");
    sky.addColorStop(0.7, "#1E1B4B");
    sky.addColorStop(1, "#312E81");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Neon Skyscrapers with Window Grids
    ctx.fillStyle = "#111827";
    ctx.fillRect(20, 40, 55, 120);
    ctx.fillRect(90, 20, 70, 140);
    ctx.fillRect(175, 55, 60, 105);
    ctx.fillRect(320, 30, 75, 130);
    ctx.fillRect(410, 50, 65, 110);
    ctx.fillRect(490, 25, 55, 135);

    // Cyber Window Lights
    ctx.fillStyle = "#38BDF8";
    for (let wy = 35; wy < 155; wy += 14) {
      ctx.fillRect(102, wy, 8, 5); ctx.fillRect(122, wy, 8, 5); ctx.fillRect(142, wy, 8, 5);
      ctx.fillRect(335, wy, 8, 5); ctx.fillRect(355, wy, 8, 5); ctx.fillRect(375, wy, 8, 5);
    }

    // High-tech Cyber Grid Floor
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#1F2937");
    ground.addColorStop(1, "#030712");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);

    // Neon Cyan Floor Gridlines
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5;
    for (let gy = 170; gy < 270; gy += 20) {
      ctx.beginPath();
      ctx.moveTo(0, gy); ctx.lineTo(width, gy);
      ctx.stroke();
    }
  } else if (b.includes("dojo")) {
    // Traditional Dojo Screen & Warm Lantern Horizon
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#78350F");
    sky.addColorStop(0.6, "#9A3412");
    sky.addColorStop(1, "#D97706");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Shoji Screen Wooden Framework
    ctx.fillStyle = "#451A03";
    ctx.fillRect(0, 50, width, 10);
    ctx.fillRect(0, 100, width, 10);
    for (let sx = 0; sx < width; sx += 55) {
      ctx.fillRect(sx, 0, 8, 160);
    }

    // Polished Wooden Floor
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#92400E");
    ground.addColorStop(1, "#451A03");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);

    // Wood Floorboard Planks
    ctx.strokeStyle = "rgba(69, 26, 3, 0.6)";
    ctx.lineWidth = 2;
    for (let fy = 168; fy < 270; fy += 16) {
      ctx.beginPath();
      ctx.moveTo(0, fy); ctx.lineTo(width, fy);
      ctx.stroke();
    }
  } else {
    // Default / Plains / Grass: Scenic Rolling Hills & Open Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#38BDF8");
    sky.addColorStop(0.6, "#7DD3FC");
    sky.addColorStop(1, "#E0F2FE");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Cumulus Pixel Clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(120, 45, 28, 0, Math.PI * 2);
    ctx.arc(155, 38, 36, 0, Math.PI * 2);
    ctx.arc(190, 45, 26, 0, Math.PI * 2);
    ctx.arc(380, 40, 24, 0, Math.PI * 2);
    ctx.arc(410, 32, 32, 0, Math.PI * 2);
    ctx.arc(440, 40, 22, 0, Math.PI * 2);
    ctx.fill();

    // Distant Rolling Green Hills
    ctx.fillStyle = "#15803D";
    ctx.beginPath();

    ctx.ellipse(140, 160, 180, 45, 0, Math.PI, 0);
    ctx.ellipse(450, 160, 160, 40, 0, Math.PI, 0);
    ctx.fill();

    // Foreground Green Meadow
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#22C55E");
    ground.addColorStop(1, "#15803D");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);
  }
}

function drawBattlePlatforms(ctx: any, biome: string) {
  const b = biome.toLowerCase();

  const getPlatformColors = () => {
    if (b.includes("cave")) return { top: "#475569", rim: "#334155", shadow: "rgba(15, 23, 42, 0.6)", border: "#94A3B8" };
    if (b.includes("forest")) return { top: "#166534", rim: "#14532D", shadow: "rgba(5, 46, 22, 0.6)", border: "#4ADE80" };
    if (b.includes("town")) return { top: "#64748B", rim: "#475569", shadow: "rgba(30, 41, 59, 0.5)", border: "#CBD5E1" };
    if (b.includes("sea")) return { top: "#FDE047", rim: "#CA8A04", shadow: "rgba(12, 74, 110, 0.6)", border: "#FEF08A" };
    if (b.includes("volcano")) return { top: "#44403C", rim: "#292524", shadow: "rgba(120, 53, 15, 0.7)", border: "#F97316" };
    if (b.includes("metropolis")) return { top: "#1E293B", rim: "#0F172A", shadow: "rgba(2, 6, 23, 0.7)", border: "#38BDF8" };
    if (b.includes("dojo")) return { top: "#B45309", rim: "#78350F", shadow: "rgba(69, 26, 3, 0.6)", border: "#FCD34D" };
    return { top: "#4ADE80", rim: "#16A34A", shadow: "rgba(20, 83, 45, 0.55)", border: "#86EFAC" };
  };

  const pCol = getPlatformColors();

  const draw3DPlatform = (cx: number, cy: number, rx: number, ry: number, extrude: number) => {
    // 1. Ground Drop Shadow
    ctx.fillStyle = pCol.shadow;
    ctx.beginPath();
    ctx.ellipse(cx, cy + extrude + 4, rx + 4, ry + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 3D Extrusion Rim Body
    ctx.fillStyle = pCol.rim;
    ctx.beginPath();
    ctx.ellipse(cx, cy + extrude, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - rx, cy);
    ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();

    // 3. Top Surface
    ctx.fillStyle = pCol.top;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Highlight Rim Stroke
    ctx.strokeStyle = pCol.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // Draw Enemy Platform (extrude: 6)
  draw3DPlatform(415, 138, 78, 16, 6);

  // Draw Player Platform (extrude: 8)
  draw3DPlatform(145, 228, 85, 18, 8);
}

const arenaCache = new Map<string, { bg: Image | null; a: Image | null; b: Image | null }>();


export async function renderBattleScreen(options: BattleScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const scale = 2;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.imageSmoothingEnabled = false;

  const isKo = options.lang === "ko";
  const battle = options.battle;
  const enemy = battle.enemy;
  const playerParty = battle.playerParty || [];
  const playerMon = (battle as any).playerBattleMon || playerParty[battle.playerActiveIndex] || playerParty[0] || {
    speciesId: "bulbasaur",
    name: "이상해씨",
    level: 5,
    hp: 20,
    maxHp: 20,
  };

  // 1. Draw Official PokéRogue Arena Background & Preload Authentic HUD Sprites
  const [arena, pbAssets] = await Promise.all([
    getArenaAssets(battle.biome || "Town"),
    getPbInfoAssets(),
  ]);
  if (arena.bg) {
    ctx.drawImage(arena.bg, 0, 0, width, height);
  } else {
    drawBiomeBackground(ctx, width, battle.biome || "Town");
  }

  // 2. Draw Official PokéRogue 3D Platforms using BATTLE_LAYOUT_CONFIG
  const ep = BATTLE_LAYOUT_CONFIG.enemyPlatform;
  const pp = BATTLE_LAYOUT_CONFIG.playerPlatform;
  const enemyPlatW = 320 * ep.scale;
  const enemyPlatH = 132 * ep.scale;
  const playerPlatW = 320 * pp.scale;
  const playerPlatH = 132 * pp.scale;

  if (arena.b) {
    // Enemy Platform (Top-Right)
    ctx.drawImage(arena.b, ep.x, ep.y, enemyPlatW, enemyPlatH);

    // Player Platform (Foreground Bottom-Left, mirrored)
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(arena.b, pp.x, pp.y, playerPlatW, playerPlatH);
    ctx.restore();
  } else if (arena.a) {
    ctx.drawImage(arena.a, 0, 48 * (275 / 180), width, enemyPlatH);
  } else {
    drawBattlePlatforms(ctx, battle.biome || "Town");
  }

  // 3. Preload & Draw Pokémon Sprites (Transform, Illusion, and Accurate Shiny Tier Front & Back support)
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

  const playerIsShiny = playerShinyTier > 0;
  const enemyIsShiny = enemyShinyTier > 0;

  const [enemySprite, playerSprite] = await Promise.all([
    getPokemonSprite(enemyActiveSpecies, true, enemyShinyTier, false),
    getPokemonSprite(playerActiveSpecies, true, playerShinyTier, true),
  ]);

  // Draw Battler Sprites & Shadows using BATTLE_LAYOUT_CONFIG
  const em = BATTLE_LAYOUT_CONFIG.enemyPokemon;
  const pm = BATTLE_LAYOUT_CONFIG.playerPokemon;

  // 4. Draw Pokémon Silhouette Shadows (cast onto platform ground)
  if (enemySprite && (battle.phase !== "VICTORY" || enemy.hp > 0)) {
    drawPokemonSilhouetteShadow(ctx, enemySprite, em.x, em.y, em.size, false, 0.42);
  }
  if (playerSprite) {
    drawPokemonSilhouetteShadow(ctx, playerSprite, pm.x, pm.y, pm.size, true, 0.42);
  }

  // On VICTORY screen, fainted enemy is gone (empty platform)
  if (enemySprite && (battle.phase !== "VICTORY" || enemy.hp > 0)) {
    drawFittedBattleSprite(ctx, enemySprite, em.x, em.y, em.size);
  }

  if (playerSprite) {
    drawFittedBattleSprite(ctx, playerSprite, pm.x, pm.y, pm.size);
  }

  // 4.5. Draw PokéRogue Authentic Move Effect (only during active turn, never on VICTORY/DEFEAT/MENU screens)
  if (battle.lastMoveEffect && battle.phase === "MAIN") {
    renderMoveEffect(ctx, battle.lastMoveEffect);
  }

  // 5. Top Right: Biome - Wave, Money & Weather
  const rawBiome = battle.biome || "Town";
  const biomeDisplay = isKo ? (BIOME_NAMES_KO[rawBiome.toLowerCase()] || rawBiome) : rawBiome;
  const waveText = `${biomeDisplay} - ${battle.wave || 1}`;
  const moneyText = formatMoney(battle.money || 0);

  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const textX = width - 24;

  // 1) Biome - Wave (White text with dark outline)
  const waveY = 14;
  ctx.font = "bold 15px DungGeunMo";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  ctx.strokeText(waveText, textX, waveY);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(waveText, textX, waveY);

  // 2) Money right below Biome (Gold yellow text with dark outline)
  const moneyY = waveY + 20;
  ctx.font = "bold 13px DungGeunMo";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 3.0;
  ctx.strokeText(moneyText, textX, moneyY);
  ctx.fillStyle = "#FDE047";
  ctx.fillText(moneyText, textX, moneyY);

  // 3) Weather text right below Money (Thematic color with dark outline)
  if (battle.weather) {
    const wType = battle.weather;
    const wConfig: Record<string, { labelKo: string; labelEn: string; color: string }> = {
      sun: { labelKo: "쾌청", labelEn: "SUN", color: "#FB923C" },
      rain: { labelKo: "비바라기", labelEn: "RAIN", color: "#60A5FA" },
      sand: { labelKo: "모래바람", labelEn: "SAND", color: "#FBBF24" },
      snow: { labelKo: "설경", labelEn: "SNOW", color: "#BAE6FD" },
    };
    const cfg = wConfig[wType] || wConfig.sun;
    const turnsStr = battle.weatherTurns ? ` ${battle.weatherTurns}${isKo ? "턴" : "T"}` : "";
    const weatherText = `${isKo ? cfg.labelKo : cfg.labelEn}${turnsStr}`;

    const weatherY = moneyY + 18;
    ctx.font = "bold 13px DungGeunMo";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
    ctx.lineWidth = 3.0;
    ctx.strokeText(weatherText, textX, weatherY);
    ctx.fillStyle = cfg.color;
    ctx.fillText(weatherText, textX, weatherY);
  }

  const getStatusBadge = (mon: any) => {
    if (mon.status === "par") return isKo ? " [마비]" : " [PAR]";
    if (mon.status === "brn") return isKo ? " [화상]" : " [BRN]";
    if (mon.status === "slp") return isKo ? " [수면]" : " [SLP]";
    if (mon.status === "psn" || mon.status === "tox") return isKo ? " [독]" : " [PSN]";
    if (mon.status === "frz") return isKo ? " [빙결]" : " [FRZ]";
    if (mon.substituteHp && mon.substituteHp > 0) return isKo ? " [대타]" : " [SUB]";
    return "";
  };

  // 6. Draw Authentic PokéRogue Enemy HUD Box
  const eh = BATTLE_LAYOUT_CONFIG.enemyHud;
  const enemyHudY = eh.y;
  let cleanEnemyName = getPokemonDisplayName(enemy, isKo).replace(/[^\w\s가-힣0-9\(\)\-\.]/g, "").trim();
  const enemySpeciesData = POKEMON_SPECIES_DATA[enemy.speciesId] || POKEMON_SPECIES_DATA[enemyActiveSpecies] || null;
  const enemyTypes = enemy.types || (enemySpeciesData ? enemySpeciesData.types : ["normal"]);

  drawPokeRogueBattleHud(ctx, {
    x: eh.x,
    y: enemyHudY,
    w: eh.w,
    h: eh.h,
    name: cleanEnemyName,
    level: enemy.level,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    isEnemy: true,
    types: enemyTypes,
    isBoss: enemy.isBoss,
    bossShields: enemy.bossShields,
    statusBadge: getStatusBadge(enemy),
    isKo,
    hudImage: enemy.isBoss ? pbAssets.bossBox : pbAssets.enemyBox,
    hpLabel: pbAssets.hpLabel,
  });

  // 7. Draw Authentic PokéRogue Player HUD Box
  const ph = BATTLE_LAYOUT_CONFIG.playerHud;
  const illusionMon = (playerMon as any).hasIllusion && (playerMon as any).illusionTarget
    ? (playerMon as any).illusionTarget
    : playerMon;
  let cleanPlayerName = getPokemonDisplayName(illusionMon, isKo).replace(/[^\w\s가-힣0-9\(\)\-\.]/g, "").trim();
  const playerSpeciesData = POKEMON_SPECIES_DATA[playerMon.speciesId] || POKEMON_SPECIES_DATA[playerActiveSpecies] || null;
  const playerTypes = playerMon.types || (playerSpeciesData ? playerSpeciesData.types : ["normal"]);

  drawPokeRogueBattleHud(ctx, {
    x: ph.x,
    y: ph.y,
    w: ph.w,
    h: ph.h,
    name: cleanPlayerName,
    level: playerMon.level,
    hp: playerMon.hp,
    maxHp: playerMon.maxHp,
    isEnemy: false,
    types: playerTypes,
    statusBadge: getStatusBadge(playerMon),
    exp: battle.playerExp || 0,
    maxExp: battle.playerMaxExp || 100,
    isKo,
    hudImage: pbAssets.playerBox,
    hpLabel: pbAssets.hpLabel,
  });



/**
 * Draws the 2x2 Battle Move Cards Grid during FIGHT phase
 */
function drawBattleFightMovesGrid(ctx, combatMon, isKo, categoriesSprite) {
    var _a, _b;
    var boxY = 270;
    var colW = 264;
    var rowH = 47;
    var startX = 12;
    var startY = boxY + 5;
    var gapX = 8;
    var gapY = 6;
    var moves = ((combatMon === null || combatMon === void 0 ? void 0 : combatMon.moves) && combatMon.moves.length > 0)
        ? combatMon.moves
        : ["Tackle", "Growl"];
    var movePps = (combatMon === null || combatMon === void 0 ? void 0 : combatMon.movePps) || [];
    for (var i = 0; i < 4; i++) {
        var col = i % 2;
        var row = Math.floor(i / 2);
        var cX = startX + col * (colW + gapX);
        var cY = startY + row * (rowH + gapY);
        var mKey = moves[i];
        var cleanKey = mKey ? mKey.toLowerCase().replace(/[\s_]+/g, "-") : null;
        var mData = cleanKey ? movesKo_js_1.MOVES_DATA[cleanKey] || { name: mKey, nameKo: mKey, type: "normal", power: 40, accuracy: 100, pp: 35, category: "physical", id: 0, description: "" } : null;
        if (!mData) {
            // Empty slot card
            ctx.fillStyle = "rgba(19, 25, 36, 0.6)";
            ctx.beginPath();
            ctx.roundRect(cX, cY, colW, rowH, 4);
            ctx.fill();
            ctx.strokeStyle = "#334155";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = "#64748B";
            ctx.font = "12px DungGeunMo";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(isKo ? "- 기술 없음 -" : "- Empty -", cX + colW / 2, cY + rowH / 2);
            continue;
        }
        var typeColor = assetLoader_js_1.TYPE_COLORS[(_a = mData.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()] || "#A8A77A";
        var typeLabel = isKo ? (assetLoader_js_1.TYPE_NAMES_KO[(_b = mData.type) === null || _b === void 0 ? void 0 : _b.toLowerCase()] || mData.type) : (mData.type || "NORMAL").toUpperCase();
        // Card background
        ctx.fillStyle = "#18202F";
        ctx.beginPath();
        ctx.roundRect(cX, cY, colW, rowH, 4);
        ctx.fill();
        // Card border
        ctx.strokeStyle = typeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Left Type color strip
        ctx.fillStyle = typeColor;
        ctx.beginPath();
        ctx.roundRect(cX, cY, 4, rowH, [4, 0, 0, 4]);
        ctx.fill();
        // 1. Move Name (e.g. "1. 몸통박치기")
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = "bold 13px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        var moveName = "".concat(i + 1, ". ").concat(isKo ? mData.nameKo : (mData.name ? mData.name.charAt(0).toUpperCase() + mData.name.slice(1).replace(/-/g, " ") : mKey));
        ctx.fillText(moveName, cX + 10, cY + 14);
        // 2. Type Badge (Upper Right)
        var badgeW = isKo ? 32 : 38;
        var badgeH = 14;
        var badgeX = cX + colW - badgeW - 6;
        var badgeY = cY + 7;
        ctx.fillStyle = typeColor;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
        ctx.fill();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 10px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(typeLabel, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);
        // 3. Official Category Icon (Physical / Special / Status)
        if (categoriesSprite) {
            var catSx = mData.category === "special" ? 28 : (mData.category === "status" ? 56 : 0);
            var iconW = 28 * 1.25; // 35px
            var iconH = 11 * 1.25; // 13.75px
            var iconX = badgeX - iconW - 5;
            var iconY = cY + 7;
            ctx.drawImage(categoriesSprite, catSx, 0, 28, 11, iconX, iconY, iconW, iconH);
        }
        else {
            var catColor = mData.category === "special" ? "#3B82F6" : mData.category === "status" ? "#64748B" : "#E11D48";
            var catLabel = isKo
                ? (mData.category === "special" ? "특수" : mData.category === "status" ? "변화" : "물리")
                : (mData.category === "special" ? "SPEC" : mData.category === "status" ? "STAT" : "PHYS");
            var catBadgeW = isKo ? 28 : 32;
            var catBadgeX = badgeX - catBadgeW - 4;
            ctx.fillStyle = catColor;
            ctx.beginPath();
            ctx.roundRect(catBadgeX, badgeY, catBadgeW, badgeH, 3);
            ctx.fill();
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(catLabel, catBadgeX + catBadgeW / 2, badgeY + badgeH / 2 + 0.5);
        }
        // 4. Bottom Line: Power / Accuracy / PP
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = "11px DungGeunMo";
        ctx.fillStyle = "#94A3B8";
        var powStr = isKo ? "\uC704\uB825 ".concat(mData.power !== null ? mData.power : "--") : "Pow ".concat(mData.power !== null ? mData.power : "--");
        var accStr = isKo ? "\uBA85\uC911 ".concat(mData.accuracy !== null ? mData.accuracy : "--") : "Acc ".concat(mData.accuracy !== null ? mData.accuracy : "--");
        ctx.fillText("".concat(powStr, "  ").concat(accStr), cX + 10, cY + 33);
        // PP on bottom right (Default: White, Low: Yellow, Almost empty/0: Red)
        var curPp = (movePps && movePps[i] !== undefined) ? movePps[i] : mData.pp;
        var maxPp = mData.pp;
        var ppRatio = maxPp > 0 ? (curPp / maxPp) : 1;
        var ppColor = (curPp === 0 || ppRatio <= 0.15)
            ? "#EF4444" // 빨간색 (거의 없거나 0)
            : ppRatio <= 0.4
                ? "#F59E0B" // 노란색 (부족할 때)
                : "#FFFFFF"; // 흰색 (기본)
        ctx.textAlign = "right";
        ctx.font = "bold 11px DungGeunMo";
        ctx.fillStyle = ppColor;
        ctx.fillText("PP ".concat(curPp, "/").concat(maxPp), cX + colW - 8, cY + 33);
    }
}
// 8. Bottom Dialogue & Command Box (Full Width 100%: x 0, y 270, w 560, h 110)
var boxY = 270;
var boxH = height - boxY;
// Authentic Gen 5 Translucent Glass Gradient
var glassGrad = ctx.createLinearGradient(0, boxY, 0, height);
glassGrad.addColorStop(0, "rgba(10, 16, 26, 0.58)");
glassGrad.addColorStop(1, "rgba(6, 10, 18, 0.68)");
ctx.fillStyle = glassGrad;
ctx.fillRect(0, boxY, width, boxH);
if (battle.phase === "VICTORY" || battle.phase === "DEFEAT") {
    ctx.strokeStyle = battle.phase === "VICTORY" ? "#22C55E" : "#EF4444";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, boxY);
    ctx.lineTo(width, boxY);
    ctx.stroke();
}
if (battle.phase === "FIGHT") {
    // ⚔️ Render 2x2 Battle Move Cards Grid during FIGHT phase
    drawBattleFightMovesGrid(ctx, playerMon, isKo, pbAssets.categories);
}
else {
    // Dialogue Text with outline for maximum legibility over translucent background
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "bold 15px DungGeunMo";
    var pDisplayName = (0, textHelpers_js_1.getPokemonDisplayName)(playerMon, isKo);
    var defaultDialogue = isKo
        ? "".concat(pDisplayName, "(\uC740)\uB294 \uBB34\uC5C7\uC744 \uD560\uAE4C?")
        : "What will ".concat(pDisplayName, " do?");
    var fullText = (battle.dialogueText || defaultDialogue).replace(/\\n/g, "\n");
    var wrapped = (0, textHelpers_js_1.wrapDialogueText)(ctx, fullText, width - 48);
    var linesToShow = wrapped.length > 3 ? wrapped.slice(-3) : wrapped;
    linesToShow.forEach(function (line, lIdx) {
        var textY = boxY + 16 + lIdx * 26;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
        ctx.lineWidth = 3.5;
        ctx.strokeText(line, 24, textY);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(line, 24, textY);
    });
}
// In-Game Message Modal overlay
if (options.inGameMessage) {
    (0, textHelpers_js_1.drawInGameMessageBox)(ctx, width, height, options.inGameMessage, isKo);
}
return canvas.toBuffer("image/png");
