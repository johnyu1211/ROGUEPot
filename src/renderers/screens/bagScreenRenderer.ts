import { createCanvas } from "@napi-rs/canvas";
import { BagScreenOptions } from "../types.js";
import { drawVectorBag, drawVectorStar, drawPartyRightPanel } from "../common/vectorIcons.js";

/**
 * Renders Trainer Bag UI with Signature Gold Amber & Pocket Theme
 */
export async function renderBagScreen(options?: BagScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  ctx.textRendering = "optimizeSpeed";

  const isKo = options?.lang === "ko";
  const currentTab = options?.tab || "pokemon";

  // 1. Dark Retro Background (Warm Deep Night)
  ctx.fillStyle = "#14121A";
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BANNER: Trainer Bag Header with Vector Bag Icon (y: 0 ~ 42)
  const splitX = 285;
  ctx.fillStyle = "#201B28";
  ctx.fillRect(0, 0, splitX, 42);

  ctx.strokeStyle = "#F4A261";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(splitX, 42);
  ctx.stroke();

  drawVectorBag(ctx, 22, 21, 14, 14, "#F4A261");

  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#F4A261";
  ctx.textAlign = "left";
  ctx.fillText(isKo ? "트레이너 포켓" : "TRAINER POCKET", 40, 27);

  // 3. LEFT SIDE: Menu / Category Box
  const leftX = 18;
  const leftY = 58;
  const leftW = 265;
  const leftH = 304;

  ctx.fillStyle = "#191522";
  ctx.fillRect(leftX, leftY, leftW, leftH);
  ctx.strokeStyle = "#2B2338";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(leftX, leftY, leftW, leftH);

  // Pocket Title
  ctx.fillStyle = "#282034";
  ctx.fillRect(leftX + 2, leftY + 2, leftW - 4, 32);
  ctx.font = "bold 17px DungGeunMo";
  ctx.fillStyle = "#F4A261";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "POKÉMON VAULT" : "POKÉMON VAULT", leftX + leftW / 2, leftY + 23);

  const tabs = isKo
    ? [
        { key: "pokemon", label: "1. 출전 포켓몬" },
        { key: "pokedex", label: "2. 포켓몬 도감" },
        { key: "records", label: "3. 트레이너 기록" },
      ]
    : [
        { key: "pokemon", label: "1. ACTIVE PARTY" },
        { key: "pokedex", label: "2. POKÉDEX" },
        { key: "records", label: "3. CAREER RECORDS" },
      ];

  tabs.forEach((t, idx) => {
    const tabY = leftY + 44 + idx * 60;
    const isSelected = currentTab === t.key;

    ctx.fillStyle = isSelected ? "#2C223A" : "#14111C";
    ctx.beginPath();
    ctx.roundRect(leftX + 10, tabY, leftW - 20, 48, 8);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = "#F4A261";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#231C2E";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.font = isSelected ? "bold 16px DungGeunMo" : "16px DungGeunMo";
    ctx.fillStyle = isSelected ? "#FFFFFF" : "#968CA8";
    ctx.textAlign = "left";
    ctx.fillText((isSelected ? "▶ " : "  ") + t.label, leftX + 18, tabY + 30);
  });

  // 4. Bottom Info Box: ONLY HIGHEST WAVE
  const infoBoxY = leftY + 230;
  const infoBoxH = 62;

  ctx.fillStyle = "#14111C";
  ctx.beginPath();
  ctx.roundRect(leftX + 10, infoBoxY, leftW - 20, infoBoxH, 8);
  ctx.fill();

  ctx.strokeStyle = "#F4A261";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawVectorStar(ctx, leftX + leftW / 2 - 58, infoBoxY + 20, 5, 6, 3, "#F4A261");
  ctx.font = "14px DungGeunMo";
  ctx.fillStyle = "#968CA8";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "최고 도달 기록" : "BEST RUN RECORD", leftX + leftW / 2 + 6, infoBoxY + 24);

  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#57F287";
  ctx.fillText(`Wave ${options?.stats?.highestWave ?? 0}`, leftX + leftW / 2, infoBoxY + 48);

  // 5. RIGHT SIDE PANEL: showSlotNumbers is TRUE with WHITE color in Bag Screen
  await drawPartyRightPanel(ctx, 295, 18, 244, 344, {
    username: options?.username,
    avatarUrl: options?.avatarUrl,
    party: options?.party,
    lang: options?.lang,
    showSlotNumbers: true,
    borderColor: "#F4A261",
  });

  return canvas.toBuffer("image/png");
}
