import { InGameMessage } from "../types.js";
import { getStarterBySpeciesId } from "../../data/starterCosts.js";
import { POKEMON_SPECIES_DATA } from "../../data/pokemonStats.js";
import { POKEMON_NAMES_KO } from "../../data/pokemonNamesKo.js";
import { drawTypeIcon, drawTargetIcon, drawMoveCategoryIcon } from "./vectorIcons.js";

export function formatMoney(amount: number): string {
  const num = Math.floor(amount || 0);
  if (num < 1000) {
    return `P ${num}`;
  }
  if (num < 1_000_000) {
    const kVal = num / 1000;
    const formatted = kVal >= 100 ? Math.floor(kVal) : (kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1).replace(/\.0$/, ""));
    return `P ${formatted}k`;
  }
  if (num < 1_000_000_000) {
    const mVal = num / 1_000_000;
    const formatted = mVal >= 100 ? Math.floor(mVal) : (mVal % 1 === 0 ? mVal.toFixed(0) : mVal.toFixed(1).replace(/\.0$/, ""));
    return `P ${formatted}M`;
  }
  const bVal = num / 1_000_000_000;
  const formatted = bVal >= 100 ? Math.floor(bVal) : (bVal % 1 === 0 ? bVal.toFixed(0) : bVal.toFixed(1).replace(/\.0$/, ""));
  return `P ${formatted}B`;
}

/**
 * Splits and wraps dialogue text into clean lines fitting within maxWidth
 */
export function wrapDialogueText(ctx: any, text: string, maxWidth: number): string[] {
  const rawLines = text.split("\n");
  const wrapped: string[] = [];

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (ctx.measureText(trimmed).width <= maxWidth) {
      wrapped.push(trimmed);
      continue;
    }

    const words = trimmed.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) wrapped.push(currentLine);
        if (ctx.measureText(word).width > maxWidth) {
          let charLine = "";
          for (const char of word) {
            if (ctx.measureText(charLine + char).width <= maxWidth) {
              charLine += char;
            } else {
              wrapped.push(charLine);
              charLine = char;
            }
          }
          currentLine = charLine;
        } else {
          currentLine = word;
        }
      }
    }
    if (currentLine) wrapped.push(currentLine);
  }

  return wrapped;
}

/**
 * Renders the Authentic PokéRogue Battle Screen (560x380) with 2x SuperSampling
 */

function drawWrappedText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const paragraphs = text.split("\n");
  let curY = y;

  for (const p of paragraphs) {
    if (!p || p.trim().length === 0) {
      curY += lineHeight;
      continue;
    }
    const words = p.split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, curY);
        line = words[n] + " ";
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, curY);
    curY += lineHeight;
  }

  return curY;
}

/**
 * Draws an authentic PokéRogue / Pokémon in-game dialogue message box overlaid on the top z-index layer
 * (Matched 100% to the Pokédex flavor text message box design)
 */

export function getPokemonDisplayName(mon: any, isKo: boolean): string {
  if (!mon) return isKo ? "포켓몬" : "Pokemon";
  if (mon.nickname) return mon.nickname;

  const speciesId = (mon.speciesId || "").toLowerCase().replace(/[\s_]+/g, "-");
  const starter = speciesId ? getStarterBySpeciesId(speciesId) : null;
  const sData = POKEMON_SPECIES_DATA[speciesId];

  if (isKo) {
    if (mon.nameKo) return mon.nameKo;
    if (starter?.nameKo) return starter.nameKo;
    if (sData?.num && POKEMON_NAMES_KO[sData.num]) return POKEMON_NAMES_KO[sData.num];
    if (mon.name && /[가-힣]/.test(mon.name)) return mon.name;
    return mon.name || speciesId || "포켓몬";
  } else {
    if (mon.nameEn) return mon.nameEn;
    if (starter?.name) return starter.name;
    if (sData?.name) return sData.name;
    if (mon.name && !/[가-힣]/.test(mon.name)) return mon.name;
    if (speciesId) {
      return speciesId.charAt(0).toUpperCase() + speciesId.slice(1).replace(/-/g, " ");
    }
    return "Pokemon";
  }
}

export function drawInGameMessageBox(ctx: any, width: number, height: number, msg: InGameMessage, isKo: boolean) {
  // 1. Subtle Dim Overlay across the entire screen
  ctx.fillStyle = "rgba(7, 9, 15, 0.45)";
  ctx.fillRect(0, 0, width, height);

  // 2. In-Game Dialogue Box (Bottom Position: y: 264 ~ 368, H: 104, styled like Pokédex Card)
  const boxX = 14;
  const boxY = height - 112;
  const boxW = width - 28;
  const boxH = 102;

  // Outer border & dark background (Same as Pokédex Flavor Card)
  ctx.fillStyle = "#181B26";
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 6);
  ctx.fill();

  ctx.strokeStyle = "#282D3D";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 3. Header: Pokédex-style Title + Move Type Badge + Stats on Right
  let curHeaderX = boxX + 12;

  if (msg.moveType) {
    drawTypeIcon(ctx, curHeaderX, boxY + 6, 20, msg.moveType, "rounded");
    curHeaderX += 26;
  }

  ctx.textBaseline = "middle";
  ctx.font = "bold 15px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  const displayTitle = isKo ? msg.title : msg.title.toUpperCase().replace(/[-_]+/g, " ");
  ctx.fillText(displayTitle, curHeaderX, boxY + 16);

  // Header Right: [Category Icon] + Power + [Target Icon] + Accuracy + PP
  let curRightX = boxX + boxW - 14;
  if (msg.movePp) {
    ctx.font = "bold 14px DungGeunMo";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const ppValText = ` ${msg.movePp}`;
    ctx.fillStyle = "#FCD34D";
    ctx.fillText(ppValText, curRightX, boxY + 16);
    const valW = ctx.measureText(ppValText).width;
    curRightX -= valW;

    ctx.fillStyle = "#F59E0B";
    ctx.fillText("PP:", curRightX, boxY + 16);
    curRightX -= ctx.measureText("PP:").width + 10;
  }

  if (msg.moveAccuracy) {
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = "#F1F5F9";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(msg.moveAccuracy, curRightX, boxY + 16);
    curRightX -= ctx.measureText(msg.moveAccuracy).width + 6;

    // Draw Target (과녁) SVG Icon
    drawTargetIcon(ctx, curRightX - 6, boxY + 16, 6.2, "#38BDF8");
    curRightX -= 20;
  }

  if (msg.movePower) {
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = "#F1F5F9";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(msg.movePower, curRightX, boxY + 16);
    curRightX -= ctx.measureText(msg.movePower).width + 10;
  }

  if (msg.moveCategory) {
    drawMoveCategoryIcon(ctx, curRightX - 23, boxY + 5, msg.moveCategory);
  }

  // Sub-divider line under header (matching Pokédex Card)
  ctx.strokeStyle = "#282D3D";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + 8, boxY + 28);
  ctx.lineTo(boxX + boxW - 8, boxY + 28);
  ctx.stroke();

  // 4. Flavor Text (Spacious & Clean Wrapping - pure description only)
  ctx.textBaseline = "top";
  ctx.font = "15px DungGeunMo";
  ctx.fillStyle = "#F1F5F9";
  ctx.textAlign = "left";
  drawWrappedText(ctx, msg.text, boxX + 12, boxY + 38, boxW - 24, 20);
}
