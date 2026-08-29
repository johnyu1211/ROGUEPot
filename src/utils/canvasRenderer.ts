import { createCanvas, loadImage, GlobalFonts, Image } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

// Register custom pixel dot font
const fontPath = path.resolve(process.cwd(), "assets/fonts/DungGeunMo.ttf");
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, "DungGeunMo");
}

let cachedLogo: Image | null = null;

async function getLogoImage(): Promise<Image | null> {
  if (cachedLogo) return cachedLogo;
  try {
    cachedLogo = await loadImage("https://pokerogue.net/images/logo.png");
    return cachedLogo;
  } catch (err) {
    console.error("[CANVAS] Failed to load remote logo:", err);
    return null;
  }
}

export interface TitleScreenOptions {
  teamName?: string;
  hasSavedSlots?: boolean;
  unlockedCount?: number;
}

/**
 * Renders title card with Logo & Context-aware Menu on left, and ENTRY box on right
 */
export async function renderTitleScreen(options?: TitleScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 1. Dark Retro Background
  ctx.fillStyle = "#161424";
  ctx.fillRect(0, 0, width, height);

  // 2. Retro Border Frame (Outer Red + Inner Purple)
  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  ctx.strokeStyle = "#383152";
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // 3. Logo Aligned to LEFT
  const logo = await getLogoImage();
  const leftPadding = 32;

  if (logo) {
    const logoWidth = 240;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    const logoX = leftPadding;
    const logoY = 38;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Team Name directly below Logo (Pure White)
    ctx.font = "16px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText("By PageFaultGames", leftPadding + 6, logoY + logoHeight + 20);

    // 4. Menu List on the Left under By PageFaultGames
    const menuStartY = logoY + logoHeight + 60;
    ctx.font = "20px DungGeunMo";

    if (options?.hasSavedSlots) {
      // Saved games exist -> Show Continue, New Game, Load Game
      ctx.fillStyle = "#F4A261"; // Gold highlight for #1 Continue
      ctx.fillText("▶ 1. CONTINUE", leftPadding + 6, menuStartY);

      ctx.fillStyle = "#EAEAEA";
      ctx.fillText("  2. NEW GAME", leftPadding + 6, menuStartY + 34);

      ctx.fillStyle = "#9E9EAF";
      ctx.fillText("  3. LOAD GAME", leftPadding + 6, menuStartY + 68);
    } else {
      // No saved games at all -> Only show NEW GAME!
      ctx.fillStyle = "#F4A261"; // Gold highlight for New Game
      ctx.fillText("▶ 1. NEW GAME", leftPadding + 6, menuStartY);
    }
  }

  // 5. RIGHT SIDE: "ENTRY" Box
  const boxX = 305;
  const boxY = 38;
  const boxW = 215;
  const boxH = 274;

  // Box Outer & Inner Fill
  ctx.fillStyle = "#1E1A33";
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Inner subtle border
  ctx.strokeStyle = "#4D436D";
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX + 5, boxY + 5, boxW - 10, boxH - 10);

  // Entry Header Banner
  ctx.fillStyle = "#2D264A";
  ctx.fillRect(boxX + 6, boxY + 6, boxW - 12, 38);

  ctx.font = "bold 20px DungGeunMo";
  ctx.fillStyle = "#F4A261"; // Gold
  ctx.textAlign = "center";
  ctx.fillText("ENTRY", boxX + boxW / 2, boxY + 32);

  // Entry Details inside Box
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "15px DungGeunMo";

  const unlocked = options?.unlockedCount ?? 9;
  ctx.fillText(`• Starters: ${unlocked}`, boxX + 18, boxY + 75);
  ctx.fillText("• Mode: Classic", boxX + 18, boxY + 112);
  ctx.fillText("• Slots: 3 Available", boxX + 18, boxY + 149);

  // Status Indicator
  ctx.fillStyle = options?.hasSavedSlots ? "#57F287" : "#F4A261";
  ctx.font = "14px DungGeunMo";
  ctx.fillText(
    options?.hasSavedSlots ? "▶ Saved Run Found" : "▶ Ready for New Run",
    boxX + 18,
    boxY + 208
  );

  // Decorative mini pixel bar
  ctx.fillStyle = "#E63946";
  ctx.fillRect(boxX + 18, boxY + 235, boxW - 36, 4);

  return canvas.toBuffer("image/png");
}
