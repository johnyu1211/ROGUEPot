import { createCanvas } from "@napi-rs/canvas";
import { TitleScreenOptions } from "../types.js";
import { getLogoImage } from "../common/assetLoader.js";
import { drawPartyRightPanel } from "../common/vectorIcons.js";

/**
 * Renders title card maximized to 560x380
 */
export async function renderTitleScreen(options?: TitleScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  ctx.textRendering = "optimizeSpeed";

  const isKo = options?.lang === "ko";

  // 1. Dark Retro Background
  ctx.fillStyle = "#13151F";
  ctx.fillRect(0, 0, width, height);

  // 2. Logo Aligned to LEFT (Balanced Margin from Divider Line)
  const logo = await getLogoImage();
  const leftPadding = 16;

  if (logo) {
    const logoWidth = 232;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    const logoX = leftPadding;
    const logoY = 38;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Subtitle: Discord Bot version
    ctx.font = "18px DungGeunMo";
    ctx.fillStyle = "#F4A261";
    ctx.textAlign = "left";
    ctx.fillText("Discord Bot version", leftPadding + 6, logoY + logoHeight + 26);

    // 3. Menu List on the Left (Multilingual, 24px)
    const menuStartY = logoY + logoHeight + 72;
    ctx.font = "24px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";

    if (options?.hasSavedSlots) {
      ctx.fillText(isKo ? "1. 이어하기" : "1. CONTINUE", leftPadding + 6, menuStartY);
      ctx.fillText(isKo ? "2. 새 게임" : "2. NEW GAME", leftPadding + 6, menuStartY + 38);
      ctx.fillText(isKo ? "3. 불러오기" : "3. LOAD GAME", leftPadding + 6, menuStartY + 76);
      ctx.fillText(isKo ? "4. 멀티플레이" : "4. MULTIPLAY", leftPadding + 6, menuStartY + 114);
    } else {
      ctx.fillText(isKo ? "1. 새 게임" : "1. NEW GAME", leftPadding + 6, menuStartY);
      ctx.fillText(isKo ? "2. 멀티플레이" : "2. MULTIPLAY", leftPadding + 6, menuStartY + 38);
      ctx.fillText(isKo ? "3. 인벤토리" : "3. INVENTORY", leftPadding + 6, menuStartY + 76);
    }
  }

  // 4. RIGHT SIDE PANEL: showSlotNumbers is FALSE on Title Screen
  await drawPartyRightPanel(ctx, 295, 18, 244, 344, {
    username: options?.username,
    avatarUrl: options?.avatarUrl,
    party: options?.party,
    lang: options?.lang,
    showSlotNumbers: false,
  });

  return canvas.toBuffer("image/png");
}
