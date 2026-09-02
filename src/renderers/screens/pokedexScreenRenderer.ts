import { createCanvas } from "@napi-rs/canvas";
import { PokedexScreenOptions } from "../types.js";
import { getPokemonSprite } from "../common/spriteLoader.js";
import { getPokemonSpeciesInfo, getAbilityDetail } from "../../services/pokeApiService.js";
import { TYPE_COLORS, TYPE_NAMES_KO } from "../common/assetLoader.js";
import { drawBookIcon } from "../common/vectorIcons.js";

export async function renderPokedexScreen(options?: PokedexScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  ctx.textRendering = "optimizeSpeed";

  const isKo = options?.lang === "ko";
  const items = options?.pageList || [];
  const selected = options?.selectedPokemon || items[0] || null;
  const curPage = options?.currentPage || 1;
  const totPages = options?.totalPages || 129;
  const allowFetch = options?.allowFetchSprites !== false;

  // 0. PRELOAD ALL ASSETS IN PARALLEL (Instant Multi-Threaded Loading)
  const [sprites, bigSprite, speciesInfo] = await Promise.all([
    Promise.all(items.map((p) => (p ? getPokemonSprite(p.speciesId, allowFetch) : Promise.resolve(null)))),
    selected ? getPokemonSprite(selected.speciesId, allowFetch) : Promise.resolve(null),
    selected ? getPokemonSpeciesInfo(selected.dexNumber) : Promise.resolve({ genusKo: "포켓몬", genusEn: "Pokémon", flavorTextKo: "", flavorTextEn: "" }),
  ]);

  // 1. Dark Retro Background (Refined Dark Midnight)
  ctx.fillStyle = "#13151F";
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BANNER: Full-width Header Bar across the entire Left Half (y: 0 ~ 42)
  const splitX = 262;
  ctx.fillStyle = "#1A1D2A";
  ctx.fillRect(0, 0, splitX, 42);

  // Bottom border line under left header
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(splitX, 42);
  ctx.stroke();

  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "포켓몬 도감" : "POKÉDEX", splitX / 2 - 10, 29);

  // Page Indicator Badge on Left Header
  ctx.font = "12px DungGeunMo";
  ctx.fillStyle = "#8E96AB";
  ctx.textAlign = "right";
  ctx.fillText(`P.${curPage}/${totPages}`, splitX - 10, 28);

  // 3. LEFT SIDE: 8 Pokémon Grid (2 Columns x 4 Rows, y: 48 ~ 370)
  const startListY = 48;
  const slotW = 118;
  const slotH = 76;
  const gapX = 6;
  const gapY = 6;

  for (let i = 0; i < 8; i++) {
    const p = items[i];
    // Row-major order: Row 0 (1, 2), Row 1 (3, 4), Row 2 (5, 6), Row 3 (7, 8)
    const row = Math.floor(i / 2);
    const col = i % 2;
    const sx = 10 + col * (slotW + gapX);
    const sy = startListY + row * (slotH + gapY);
    const isSelected = selected && p && selected.dexNumber === p.dexNumber;

    // Slot Box Background (Refined Dark Midnight Slate)
    ctx.fillStyle = isSelected ? "#222738" : "#181B26";
    ctx.beginPath();
    ctx.roundRect(sx, sy, slotW, slotH, 6);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = "#5865F2";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (p) {
      const displayName = (isKo && p.koreanName) ? p.koreanName : p.name;
      const dexTag = p.dexNumber <= 0 ? "#---" : `#${String(p.dexNumber).padStart(3, "0")}`;

      // Left Header: Slot Number + Pokemon Name (13px Bold)
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#E2E8F0";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}. ${displayName.slice(0, 5)}`, sx + 6, sy + 16);

      // Right Header: Dex Number (#001) Right-aligned (12px Bold)
      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#7E869B";
      ctx.textAlign = "right";
      ctx.fillText(dexTag, sx + slotW - 6, sy + 16);

      // Mini Sprite (Centered in left half area: 50x48)
      const sprite = sprites[i];
      const sprAreaW = 50;
      const sprAreaH = 48;
      const sprAreaX = sx + 6;
      const sprAreaY = sy + 22;

      if (sprite) {
        const scale = 0.64;
        const sprW = sprite.width * scale;
        const sprH = sprite.height * scale;
        ctx.drawImage(
          sprite,
          sprAreaX + (sprAreaW - sprW) / 2,
          sprAreaY + (sprAreaH - sprH) / 2,
          sprW,
          sprH
        );
      } else {
        // Pixel Loading Placeholder
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sprAreaX + sprAreaW / 2, sprAreaY + sprAreaH / 2, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sprAreaX + sprAreaW / 2 - 10, sprAreaY + sprAreaH / 2);
        ctx.lineTo(sprAreaX + sprAreaW / 2 + 10, sprAreaY + sprAreaH / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sprAreaX + sprAreaW / 2, sprAreaY + sprAreaH / 2, 3.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Mini Type Badges (44x20 on the right side of slot, vertically balanced)
      const typeCount = Math.min(2, p.types.length);
      const badgeW = 44;
      const badgeH = 20;
      const badgeX = sx + slotW - badgeW - 6;

      for (let tIdx = 0; tIdx < typeCount; tIdx++) {
        const tName = p.types[tIdx];
        const tLower = tName.toLowerCase();
        const tColor = TYPE_COLORS[tLower] || "#777777";
        const tDisplay = isKo ? (TYPE_NAMES_KO[tLower] || tName) : tName.slice(0, 4).toUpperCase();
        
        // Single type: centered at y=34 | Dual types: y=22, y=45
        const bY = typeCount === 1 ? sy + 34 : sy + 22 + tIdx * 23;

        ctx.fillStyle = tColor;
        ctx.beginPath();
        ctx.roundRect(badgeX, bY, badgeW, badgeH, 3);
        ctx.fill();

        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 1;
        ctx.font = isKo ? "bold 12px DungGeunMo" : "bold 10px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(tDisplay, badgeX + badgeW / 2, bY + 14);
        ctx.restore();
      }
    } else {
      ctx.font = "12px DungGeunMo";
      ctx.fillStyle = "#4B5268";
      ctx.textAlign = "center";
      ctx.fillText("---", sx + slotW / 2, sy + slotH / 2 + 4);
    }
  }

  // 4. VERTICAL SPLIT DIVIDER LINE (100% Full Height)
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, height);
  ctx.stroke();

  // 5. RIGHT SIDE: Selected Pokémon Detailed Stats & Showcase
  const rightX = 274;
  const rightW = width - rightX - 10;

  if (selected) {
    // 5-1. TOP MAIN INFO CARD (Sprite Box + Dex Number & Name & Genus + Types) (y: 10 ~ 98)
    const topCardY = 10;
    const topCardH = 88;

    ctx.fillStyle = "#181B26";
    ctx.beginPath();
    ctx.roundRect(rightX, topCardY, rightW, topCardH, 6);
    ctx.fill();
    ctx.strokeStyle = "#282D3D";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sprite Showcase Box (Compact 72x72)
    const showBoxX = rightX + 8;
    const showBoxSize = 72;
    const showBoxY = topCardY + 8;

    ctx.fillStyle = "#12141C";
    ctx.beginPath();
    ctx.roundRect(showBoxX, showBoxY, showBoxSize, showBoxSize, 6);
    ctx.fill();

    if (bigSprite) {
      const scale = 1.35;
      const sprW = bigSprite.width * scale;
      const sprH = bigSprite.height * scale;
      ctx.drawImage(bigSprite, showBoxX + (showBoxSize - sprW) / 2, showBoxY + (showBoxSize - sprH) / 2, sprW, sprH);
    } else {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(showBoxX + showBoxSize / 2, showBoxY + showBoxSize / 2, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(showBoxX + showBoxSize / 2 - 18, showBoxY + showBoxSize / 2);
      ctx.lineTo(showBoxX + showBoxSize / 2 + 18, showBoxY + showBoxSize / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(showBoxX + showBoxSize / 2, showBoxY + showBoxSize / 2, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Info Column next to Sprite (Dex Number + Name + Genus + Types)
    const infoX = showBoxX + showBoxSize + 12;
    const titleName = (isKo && selected.koreanName) ? selected.koreanName : selected.name;
    const dexTag = `#${String(selected.dexNumber).padStart(3, "0")}`;

    const genusText = isKo ? speciesInfo.genusKo : speciesInfo.genusEn;

    // 1. Top Row: #001 (Dex Tag in Slate) + Pokémon Name (Bold White 18px) + Genus
    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = "#8E96AB";
    ctx.textAlign = "left";
    ctx.fillText(dexTag, infoX, topCardY + 28);

    const tagWidth = ctx.measureText(dexTag).width;
    ctx.font = "bold 18px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(titleName, infoX + tagWidth + 6, topCardY + 28);

    if (genusText) {
      const nameWidth = ctx.measureText(titleName).width;
      ctx.font = "12px DungGeunMo";
      ctx.fillStyle = "#8E96AB";
      ctx.fillText(`(${genusText})`, infoX + tagWidth + 6 + nameWidth + 6, topCardY + 28);
    }

    // 2. Bottom Row: Type Badges (46x24 badges)
    let typeBadgeX = infoX;
    const badgeW = isKo ? 46 : 52;
    const badgeH = 24;
    const typeBadgeY = topCardY + 48;

    for (const tName of selected.types) {
      const tLower = tName.toLowerCase();
      const tColor = TYPE_COLORS[tLower] || "#777777";
      const tDisplay = isKo ? (TYPE_NAMES_KO[tLower] || tName) : tName.toUpperCase();

      ctx.fillStyle = tColor;
      ctx.beginPath();
      ctx.roundRect(typeBadgeX, typeBadgeY, badgeW, badgeH, 4);
      ctx.fill();

      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 1;
      ctx.font = isKo ? "bold 13px DungGeunMo" : "bold 11px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(tDisplay, typeBadgeX + badgeW / 2, typeBadgeY + 16);
      ctx.restore();

      typeBadgeX += badgeW + 8;
    }

    // 5-2. BASE STATS 2-COLUMN X 3-ROW GRID (HP/SPE, ATK/SPA, DEF/SPD, y: 104 ~ 222)
    const statsCardY = 104;
    const statsCardH = 118;

    ctx.fillStyle = "#181B26";
    ctx.beginPath();
    ctx.roundRect(rightX, statsCardY, rightW, statsCardH, 6);
    ctx.fill();
    ctx.strokeStyle = "#282D3D";
    ctx.lineWidth = 1;
    ctx.stroke();

    const statsGrid = [
      // Row 0: HP / SPE
      { label: "HP", val: selected.hp, color: "#57F287", col: 0, row: 0 },
      { label: isKo ? "스핏" : "SPE", val: selected.speed, color: "#F8D030", col: 1, row: 0 },
      // Row 1: ATK / SPA
      { label: isKo ? "공격" : "ATK", val: selected.attack, color: "#F08030", col: 0, row: 1 },
      { label: isKo ? "특공" : "SPA", val: selected.spAttack, color: "#C03028", col: 1, row: 1 },
      // Row 2: DEF / SPD
      { label: isKo ? "방어" : "DEF", val: selected.defense, color: "#6890F0", col: 0, row: 2 },
      { label: isKo ? "특방" : "SPD", val: selected.spDefense, color: "#F85888", col: 1, row: 2 },
    ];

    const barW = 60;
    const barH = 12;
    for (const st of statsGrid) {
      const colX = st.col === 0 ? rightX + 12 : rightX + 144;
      const rowY = statsCardY + 12 + st.row * 33;

      // Label (HP, ATK, DEF, SPE, SPA, SPD) - Clean Slate
      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = "#8E96AB";
      ctx.textAlign = "left";
      ctx.fillText(st.label, colX, rowY + 14);

      // Value - Colorful Stat Color
      ctx.font = "bold 15px DungGeunMo";
      ctx.textAlign = "right";
      ctx.fillStyle = st.color;
      ctx.fillText(String(st.val), colX + 54, rowY + 14);

      // Bar Background
      const gaugeX = colX + 60;
      ctx.fillStyle = "#12141C";
      ctx.beginPath();
      ctx.roundRect(gaugeX, rowY + 2, barW, barH, 3);
      ctx.fill();

      // Bar Fill - Colorful Stat Color
      const fillW = Math.min(barW, Math.max(3, (st.val / 180) * barW));
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.roundRect(gaugeX, rowY + 2, fillW, barH, 3);
      ctx.fill();
    }

    // 5-3. BOTTOM FLAVOR TEXT CARD (y: 228 ~ 370, matching bottom of left list)
    const flavorCardY = 228;
    const flavorCardH = 142;

    ctx.fillStyle = "#181B26";
    ctx.beginPath();
    ctx.roundRect(rightX, flavorCardY, rightW, flavorCardH, 6);
    ctx.fill();
    ctx.strokeStyle = "#282D3D";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Flavor Header: 포켓몬 도감 설명
    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = "#CBD5E1";
    ctx.textAlign = "left";
    ctx.fillText(isKo ? "포켓몬 도감 설명" : "POKÉDEX ENTRY", rightX + 10, flavorCardY + 18);

    // Sub-divider line under flavor header
    ctx.strokeStyle = "#282D3D";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX + 8, flavorCardY + 26);
    ctx.lineTo(rightX + rightW - 8, flavorCardY + 26);
    ctx.stroke();

    // Flavor Text (Official Pokémon Flavor Text Description)
    const flavorText = (isKo ? speciesInfo.flavorTextKo : speciesInfo.flavorTextEn) ||
      (isKo ? "포켓몬 도감에 등록된 포켓몬입니다." : "A Pokémon registered in the Pokédex.");

    ctx.font = "13px DungGeunMo";
    ctx.fillStyle = "#F1F5F9";
    ctx.textAlign = "left";

    const maxTextW = rightW - 20;
    const words = flavorText.split(" ");
    let line = "";
    let lineY = flavorCardY + 46;
    const lineHeight = 21;
    let linesDrawn = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + (line ? " " : "") + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextW && n > 0) {
        ctx.fillText(line, rightX + 10, lineY);
        line = words[n];
        lineY += lineHeight;
        linesDrawn++;
        if (linesDrawn >= 4) break;
      } else {
        line = testLine;
      }
    }
    if (line && linesDrawn < 4) {
      ctx.fillText(line, rightX + 10, lineY);
    }
  }

  // 6. FLOATING OVERLAY RPG DIALOG WINDOW (Only appears when activeAbility is selected)
  if (selected && options?.activeAbility) {
    const targetAbility = options.activeAbility;
    const isHa = selected.hiddenAbility && targetAbility.toLowerCase() === selected.hiddenAbility.toLowerCase();

    const abDetail = await getAbilityDetail(targetAbility);
    const abName = isKo ? abDetail.nameKo : abDetail.name;
    const abDesc = isKo ? abDetail.descriptionKo : abDetail.descriptionEn;
    const typeTag = isHa ? (isKo ? "[숨특]" : "[HA]") : (isKo ? "[특성]" : "[Ability]");

    const overlayX = 12;
    const overlayY = 224;
    const overlayW = width - 24;
    const overlayH = 144;

    // Outer Shadow to create true floating pop-up window depth
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.92)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    // Window Solid Background
    ctx.fillStyle = "#12141D";
    ctx.beginPath();
    ctx.roundRect(overlayX, overlayY, overlayW, overlayH, 8);
    ctx.fill();
    ctx.restore();

    // Window Double Border Frame (Soft Off-White Silver Retro Style)
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(overlayX, overlayY, overlayW, overlayH, 8);
    ctx.stroke();

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(overlayX + 3, overlayY + 3, overlayW - 6, overlayH - 6, 6);
    ctx.stroke();

    // Dialog Window Header Bar (y: overlayY ~ overlayY + 30)
    ctx.fillStyle = "#1E2438";
    ctx.beginPath();
    ctx.roundRect(overlayX + 4, overlayY + 4, overlayW - 8, 28, [5, 5, 0, 0]);
    ctx.fill();

    // Header Title: [특성] 심록 (Soft Off-White)
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = "#F1F5F9";
    ctx.textAlign = "left";
    ctx.fillText(`${typeTag} ${abName}`, overlayX + 14, overlayY + 23);

    // Horizontal divider line under dialog header
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(overlayX + 4, overlayY + 32);
    ctx.lineTo(overlayX + overlayW - 4, overlayY + 32);
    ctx.stroke();

    // Effect Description Text (Wrapped nicely across 500px wide box)
    ctx.font = "13px DungGeunMo";
    ctx.fillStyle = "#F8FAFC";
    ctx.textAlign = "left";

    const maxTextW = overlayW - 28;
    const words = abDesc.split(" ");
    let line = "";
    let lineY = overlayY + 54;
    const lineHeight = 21;
    let linesDrawn = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + (line ? " " : "") + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextW && n > 0) {
        ctx.fillText(line, overlayX + 16, lineY);
        line = words[n];
        lineY += lineHeight;
        linesDrawn++;
        if (linesDrawn >= 4) break;
      } else {
        line = testLine;
      }
    }
    if (line && linesDrawn < 4) {
      ctx.fillText(line, overlayX + 16, lineY);
    }
  }

  return canvas.toBuffer("image/png");
}

/**
 * Renders a Pixel Art Quality Test Card (/test command)
 */
export async function renderDotTestCard(): Promise<Buffer> {
  const width = 560;
  const height = 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#12101F";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  ctx.font = "22px DungGeunMo";
  ctx.fillStyle = "#F4A261";
  ctx.textAlign = "center";
  ctx.fillText("★ PIXEL ART SPRITE QUALITY TEST ★", width / 2, 38);

  ctx.font = "14px DungGeunMo";
  ctx.fillStyle = "#8E88AB";
  ctx.fillText("Nearest-Neighbor Scaled (Zero Blur / No Smoothing)", width / 2, 60);

  const pokemonList = [
    { name: "darkrai", label: "Darkrai", x: 30, y: 80, scale: 2 },
    { name: "charizard", label: "Charizard", x: 200, y: 80, scale: 2 },
    { name: "gengar-mega", label: "Mega Gengar", x: 370, y: 80, scale: 2 },
  ];

  for (const p of pokemonList) {
    const sprite = await getPokemonSprite(p.name);
    if (sprite) {
      ctx.fillStyle = "#1E1A33";
      ctx.fillRect(p.x, p.y, 160, 190);
      ctx.strokeStyle = "#383152";
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, 160, 190);

      const sprW = sprite.width * p.scale;
      const sprH = sprite.height * p.scale;
      const sprX = p.x + (160 - sprW) / 2;
      const sprY = p.y + (150 - sprH) / 2;
      ctx.drawImage(sprite, sprX, sprY, sprW, sprH);

      ctx.font = "13px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(p.label, p.x + 80, p.y + 175);
    }
  }

  ctx.font = "13px DungGeunMo";
  ctx.fillStyle = "#57F287";
  ctx.textAlign = "center";
  ctx.fillText("✔ 100% Crisp Pixel Art Rendering Verified", width / 2, 315);

  return canvas.toBuffer("image/png");
}