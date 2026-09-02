import { createCanvas } from "@napi-rs/canvas";
import { EggGachaScreenOptions } from "../types.js";
import { getPokemonSprite } from "../common/spriteLoader.js";
import { drawShinySparkle, drawShinyTierSparkles, drawEggIcon } from "../common/vectorIcons.js";

export async function renderEggGachaScreen(options: EggGachaScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  ctx.textRendering = "optimizeSpeed";

  const isKo = options.lang === "ko";
  const machine = options.selectedMachine || "shiny";
  const eggs = options.eggs || [];

  // Background
  ctx.fillStyle = "#13151F";
  ctx.fillRect(0, 0, width, height);

  // Top Banner
  ctx.fillStyle = "#1A1D2A";
  ctx.fillRect(0, 0, width, 42);
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(width, 42);
  ctx.stroke();

  ctx.font = "bold 20px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(isKo ? "알 뽑기 (EGG GACHA)" : "EGG GACHA", 14, 28);

  ctx.font = "bold 15px DungGeunMo";
  ctx.fillStyle = "#F59E0B";
  ctx.textAlign = "right";
  ctx.fillText(isKo ? `인큐베이터: ${eggs.length}개 보관 중` : `Incubator: ${eggs.length} Eggs`, width - 14, 28);

  // Top Gacha Machine Showcase (3 Machines Cards, y: 52 ~ 160)
  const machines = [
    { id: "shiny", nameKo: "이로치 UP 뽑기", nameEn: "Shiny UP Gacha", descKo: "이로치 확률 1/64", descEn: "Shiny Rate 1/64", color: "#F59E0B" },
    { id: "move", nameKo: "알 기술 UP 뽑기", nameEn: "Move UP Gacha", descKo: "희귀 알기술 확률 UP", descEn: "Rare Moves UP", color: "#EC4899" },
    { id: "legendary", nameKo: "전설 픽업 뽑기", nameEn: "Legendary UP", descKo: "전설 포켓몬 확률 UP", descEn: "Legendary Rate UP", color: "#8B5CF6" },
  ];

  const mCardW = 174;
  const mCardH = 100;
  const startX = 10;
  const startY = 52;
  const gapX = 9;

  for (let i = 0; i < 3; i++) {
    const m = machines[i];
    const mx = startX + i * (mCardW + gapX);
    const isSel = m.id === machine;

    ctx.fillStyle = isSel ? "#22273A" : "#181B26";
    ctx.beginPath();
    ctx.roundRect(mx, startY, mCardW, mCardH, 6);
    ctx.fill();

    ctx.strokeStyle = isSel ? m.color : "#282D3D";
    ctx.lineWidth = isSel ? 2 : 1;
    ctx.stroke();

    // Machine Name
    ctx.font = "bold 16px DungGeunMo";
    ctx.fillStyle = isSel ? "#FFFFFF" : "#CBD5E1";
    ctx.textAlign = "center";
    ctx.fillText(isKo ? m.nameKo : m.nameEn, mx + mCardW / 2, startY + 24);

    // Big Egg Vector Icon
    drawEggIcon(ctx, mx + mCardW / 2, startY + 54, 12, 16, m.color);

    // Desc
    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = isSel ? m.color : "#64748B";
    ctx.fillText(isKo ? m.descKo : m.descEn, mx + mCardW / 2, startY + 86);
  }

  // Divider Line
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(10, 164);
  ctx.lineTo(width - 10, 164);
  ctx.stroke();

  // Incubator Section Header (y: 184)
  drawEggIcon(ctx, 22, 184, 7, 10, "#F59E0B");
  ctx.textBaseline = "middle";
  ctx.font = "bold 17px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(isKo ? "인큐베이터 알 보관소 (웨이브 클리어 시 부화!)" : "Incubator (Clearing waves hatches eggs!)", 36, 184);

  // Incubator Eggs Grid (y: 196 ~ 370, 4 Columns x 2 Rows = 8 Visible Slots)
  const eggSlotW = 128;
  const eggSlotH = 78;
  const eggStartX = 10;
  const eggStartY = 196;
  const eggGapX = 9;
  const eggGapY = 8;

  for (let i = 0; i < 8; i++) {
    const e = eggs[i];
    const col = i % 4;
    const row = Math.floor(i / 4);
    const ex = eggStartX + col * (eggSlotW + eggGapX);
    const ey = eggStartY + row * (eggSlotH + eggGapY);

    ctx.fillStyle = e ? "#181B26" : "#11131A";
    ctx.beginPath();
    ctx.roundRect(ex, ey, eggSlotW, eggSlotH, 5);
    ctx.fill();

    ctx.strokeStyle = e ? "#282D3D" : "#1E2230";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (e) {
      const tierColor = e.tier === "legendary" ? "#8B5CF6" : e.tier === "epic" ? "#EC4899" : e.tier === "rare" ? "#3B82F6" : "#10B981";
      const tierLabel = isKo ? (e.tier === "legendary" ? "전설알" : e.tier === "epic" ? "에픽알" : e.tier === "rare" ? "레어알" : "일반알") : e.tier.toUpperCase();

      // Tier Badge
      ctx.fillStyle = tierColor;
      ctx.beginPath();
      ctx.roundRect(ex + 6, ey + 6, 44, 18, 3);
      ctx.fill();
      ctx.font = "bold 11px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(tierLabel, ex + 28, ey + 19);

      // Egg Vector Icon
      drawEggIcon(ctx, ex + eggSlotW - 18, ey + 20, 8, 11, tierColor);

      // Progress Waves
      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(`${e.stepsProgress} / ${e.stepsRequired} W`, ex + 8, ey + 46);

      // Gauge Bar
      const gW = eggSlotW - 16;
      const gH = 6;
      ctx.fillStyle = "#12141C";
      ctx.beginPath();
      ctx.roundRect(ex + 8, ey + 56, gW, gH, 3);
      ctx.fill();

      const ratio = Math.min(1.0, e.stepsProgress / e.stepsRequired);
      ctx.fillStyle = tierColor;
      ctx.beginPath();
      ctx.roundRect(ex + 8, ey + 56, Math.max(3, ratio * gW), gH, 3);
      ctx.fill();
    } else {
      ctx.font = "bold 18px DungGeunMo";
      ctx.fillStyle = "#2D3246";
      ctx.textAlign = "center";
      ctx.fillText("+", ex + eggSlotW / 2, ey + 36);

      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = "#475569";
      ctx.fillText(isKo ? "빈 슬롯" : "Empty", ex + eggSlotW / 2, ey + 56);
    }
  }

  return canvas.toBuffer("image/png");
}