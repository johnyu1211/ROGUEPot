import { createCanvas } from "@napi-rs/canvas";
import { SaveSlotsScreenOptions } from "../types.js";
import { getPokemonSprite } from "../common/spriteLoader.js";
import { drawInGameMessageBox } from "../common/textHelpers.js";
import { drawVectorWarning, drawVectorGlobe } from "../common/vectorIcons.js";

function formatSlotDate(dateStr?: string, isKo: boolean = true): string {
  if (!dateStr) return isKo ? "저장 기록 없음" : "No record";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? (isKo ? "오후" : "PM") : (isKo ? "오전" : "AM");
    const h12 = hours % 12 || 12;
    if (isKo) {
      return `${year}. ${month}. ${date}. ${ampm} ${h12}:${minutes}:${seconds}`;
    } else {
      return `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")} ${h12}:${minutes}:${seconds} ${ampm}`;
    }
  } catch {
    return dateStr;
  }
}

function drawRetroCornerBrackets(ctx: any, x: number, y: number, w: number, h: number, color: string = "#38BDF8", size: number = 7) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  // Top-Left
  ctx.moveTo(x + 5, y + 5 + size);
  ctx.lineTo(x + 5, y + 5);
  ctx.lineTo(x + 5 + size, y + 5);
  // Top-Right
  ctx.moveTo(x + w - 5 - size, y + 5);
  ctx.lineTo(x + w - 5, y + 5);
  ctx.lineTo(x + w - 5, y + 5 + size);
  // Bottom-Left
  ctx.moveTo(x + 5, y + h - 5 - size);
  ctx.lineTo(x + 5, y + h - 5);
  ctx.lineTo(x + 5 + size, y + h - 5);
  // Bottom-Right
  ctx.moveTo(x + w - 5 - size, y + h - 5);
  ctx.lineTo(x + w - 5, y + h - 5);
  ctx.lineTo(x + w - 5, y + h - 5 - size);
  ctx.stroke();
  ctx.restore();
}

function drawSmallHeart(ctx: any, x: number, y: number, size: number = 5.5, color: string = "#F472B6") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
  ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Renders the PokéRogue-Style 3 Save Slots Screen (560x380) with 2x SuperSampling
 */
export async function renderSaveSlotsScreen(options: SaveSlotsScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const scale = 2;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.imageSmoothingEnabled = false;

  const isKo = options.lang === "ko";
  const deleteMode = Boolean(options.deleteMode);
  const selectedSlotId = options.selectedSlotId;

  // Background
  ctx.fillStyle = "#11141D";
  ctx.fillRect(0, 0, width, height);

  // Pre-load party sprites for all 3 slots
  for (let i = 0; i < 3; i++) {
    const s = options.slots ? options.slots[i + 1] : null;
    if (s && s.party && Array.isArray(s.party)) {
      await Promise.all(
        s.party.slice(0, 6).map((p: any) => p && p.speciesId && getPokemonSprite(p.speciesId, true, p.shinyTier !== undefined ? p.shinyTier : (p.isShiny ? 1 : 0)))
      );
    }
  }

  // Top Header Banner (0 ~ 40)
  ctx.fillStyle = "#181B26";
  ctx.fillRect(0, 0, width, 40);
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(width, 40);
  ctx.stroke();

  // Header Icon & Title
  if (deleteMode) {
    drawVectorWarning(ctx, 24, 20, 9, "#EF4444");
  } else {
    drawVectorGlobe(ctx, 24, 20, 8, "#38BDF8");
  }

  ctx.textBaseline = "middle";
  ctx.font = "bold 17px DungGeunMo";
  ctx.fillStyle = deleteMode ? "#EF4444" : "#38BDF8";
  ctx.textAlign = "left";
  ctx.fillText(deleteMode ? (isKo ? "세이브 슬롯 삭제 모드" : "DELETE SLOT MODE") : (isKo ? "세이브 슬롯 선택" : "SAVE SLOTS"), 40, 21);

  ctx.font = "bold 13px DungGeunMo";
  ctx.fillStyle = deleteMode ? "#FCA5A5" : "#94A3B8";
  ctx.textAlign = "right";
  ctx.fillText(
    deleteMode
      ? (isKo ? "삭제할 슬롯을 선택하세요" : "Select a slot to delete")
      : (isKo ? "모험을 시작하거나 이어하세요" : "Select a slot to play"),
    width - 16,
    21
  );

  // 3 Slots Grid (Vertical layout: cardW 532, cardH 96, gap 12)
  const cardW = 532;
  const cardH = 96;
  const cardX = 14;
  const cardYs = [48, 156, 264];

  for (let i = 0; i < 3; i++) {
    const slotNum = i + 1;
    const slot = options.slots ? options.slots[slotNum] : null;
    const cardY = cardYs[i];
    const isSelected = selectedSlotId === slotNum;

    if (slot) {
      // Saved Slot Card
      ctx.fillStyle = isSelected ? "#1E293B" : "#1A212E";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 6);
      ctx.fill();

      // Border
      const borderColor = deleteMode ? "#EF4444" : (isSelected ? "#2DD4BF" : "#0D9488");
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isSelected ? 2.5 : 1.8;
      ctx.stroke();

      // Selected Pointer (▶)
      if (isSelected) {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        const pX = cardX + cardW - 8;
        const pY = cardY + cardH / 2;
        ctx.moveTo(pX, pY - 6);
        ctx.lineTo(pX + 6, pY);
        ctx.lineTo(pX, pY + 6);
        ctx.closePath();
        ctx.fill();
      }

      // Left Text Information
      const textX = cardX + 16;
      ctx.textAlign = "left";

      // Line 1: Mode (Slot #)
      ctx.textBaseline = "middle";
      ctx.font = "bold 16px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`${slot.gameMode || (isKo ? "클래식" : "Classic")} (${slotNum})`, textX, cardY + 24);

      // Line 2: Mode - Wave
      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = "#E2E8F0";
      ctx.fillText(`${slot.gameMode || (isKo ? "클래식" : "Classic")} - ${isKo ? "웨이브" : "Wave"} ${slot.wave || 1}`, textX, cardY + 48);

      // Line 3: Saved Timestamp (Last Updated / Saved Time)
      ctx.font = "12px DungGeunMo";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(formatSlotDate(slot.updatedAt, isKo), textX, cardY + 70);

      // Right Side Party Pokémon (Up to 6)
      const party = slot.party || [];
      const partyStartX = cardX + 240;
      const slotItemW = 46;

      for (let pIdx = 0; pIdx < Math.min(6, party.length); pIdx++) {
        const p = party[pIdx];
        if (!p) continue;
        const px = partyStartX + pIdx * slotItemW;
        const py = cardY + 10;

        // Sprite
        const sprite = await getPokemonSprite(p.speciesId, true, p.shinyTier !== undefined ? p.shinyTier : (p.isShiny ? 1 : 0));
        if (sprite) {
          ctx.drawImage(sprite, px, py, 34, 34);
        }

        // Level
        ctx.textAlign = "center";
        ctx.font = "bold 11px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`Lv${p.level || 5}`, px + 17, py + 46);
      }
    } else {
      // Empty Slot Card
      ctx.fillStyle = "#131620";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 6);
      ctx.fill();

      ctx.strokeStyle = isSelected ? "#38BDF8" : "#2A3245";
      ctx.lineWidth = isSelected ? 2 : 1.2;
      ctx.stroke();

      const textX = cardX + 20;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      // Line 1: [슬롯 N] 빈 슬롯
      ctx.font = "bold 16px DungGeunMo";
      ctx.fillStyle = isSelected ? "#94A3B8" : "#64748B";
      ctx.fillText(isKo ? `[슬롯 ${slotNum}] 빈 슬롯` : `[Slot ${slotNum}] Empty Slot`, textX, cardY + 36);

      // Line 2: Description
      ctx.font = "13px DungGeunMo";
      ctx.fillStyle = "#475569";
      ctx.fillText(isKo ? "새로운 모험을 시작할 수 있습니다." : "Start a new adventure in this slot", textX, cardY + 62);

      // Right Button indicator
      ctx.textAlign = "right";
      ctx.font = "bold 15px DungGeunMo";
      ctx.fillStyle = "#38BDF8";
      ctx.fillText("+ NEW GAME", cardX + cardW - 24, cardY + cardH / 2);
    }
  }

  // In-Game Dialogue Box overlay (if active)
  if (options.inGameMessage) {
    drawInGameMessageBox(ctx, width, height, options.inGameMessage, isKo);
  }

  return canvas.toBuffer("image/png");
}
