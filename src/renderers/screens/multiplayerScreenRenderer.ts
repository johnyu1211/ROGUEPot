import { createCanvas } from "@napi-rs/canvas";
import { MultiplayerScreenOptions } from "../types.js";
import { drawPartyRightPanel } from "../common/vectorIcons.js";

/**
 * Renders Multiplayer Screen with Signature Blurple Theme
 */
export async function renderMultiplayerScreen(options?: MultiplayerScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  ctx.textRendering = "optimizeSpeed";

  const isKo = options?.lang === "ko";

  // 1. Dark Retro Background (Discord Blurple Deep Night)
  ctx.fillStyle = "#111322";
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BANNER: Full-width Header Bar across the entire Left Half (y: 0 ~ 42)
  const splitX = 285;
  ctx.fillStyle = "#181C34";
  ctx.fillRect(0, 0, splitX, 42);

  // Bottom border line under left header (Blurple)
  ctx.strokeStyle = "#5865F2";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(splitX, 42);
  ctx.stroke();

  // Header Title Centered in Left Half
  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#5865F2";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "멀티플레이 로비" : "MULTIPLAYER LOBBY", splitX / 2, 28);

  // 3. RIGHT SIDE PANEL: Multiplayer Team (with slot numbers 1~6 and Blurple theme)
  await drawPartyRightPanel(ctx, 295, 18, 244, 344, {
    username: options?.username,
    avatarUrl: options?.avatarUrl,
    party: options?.party,
    lang: options?.lang,
    showSlotNumbers: true,
    borderColor: "#5865F2",
  });

  return canvas.toBuffer("image/png");
}
