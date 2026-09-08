// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// 코드 수정 -> 증분 빌드(npm run build) -> 뷰어 캐시 갱신 후 즉시 보고할 것.
// ============================================================================

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  renderTitleMessageData,
  renderSlotsScreenData,
  renderBagMessageData,
  renderMultiplayerMessageData,
  renderPokedexMessageData,
  renderSettingsMessageData,
  renderGenSelectMessageData,
  renderStarterSelectMessageData,
  renderPartyViewMessageData,
  parsePartyParam,
  serializePartyParam,
} from "../src/events/interactionCreate.js";
import { saveService, PartyPokemon } from "../src/services/saveService.js";
import { db } from "../src/services/db.js";
import { PartyViewTab } from "../src/utils/canvasRenderer.js";
import { getStartersByGen } from "../src/data/starterCosts.js";
import { getUserStarters } from "../src/services/starterService.js";
import { getPokemonByDexNumber } from "../src/services/pokeApiService.js";
import { VERIFIED_MOVES } from "./movesData.js";
import { renderBattleMoveGif, renderBattleEntryGif } from "../src/utils/battleGifRenderer.js";
import { getMoveData } from "../src/data/movesKo.js";
import { POKEMON_SPECIES_DATA } from "../src/data/pokemonStats.js";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3456;
const SIMULATED_USER_ID = "viewer_simulator_user";

// Initialize a realistic mock profile in SQLite
function initSimulatedUser() {
  saveService.getProfile(SIMULATED_USER_ID);
  saveService.setLanguage(SIMULATED_USER_ID, "ko");

  const starterData: Record<string, any> = {
    "bulbasaur": { isUnlocked: true, shinyTier: 2, hasHiddenAbility: true, passiveUnlocked: true, candies: 50, eggMoves: ["Earth Power"] },
    "charmander": { isUnlocked: true, shinyTier: 1, hasHiddenAbility: false, passiveUnlocked: true, candies: 20, eggMoves: [] },
    "squirtle": { isUnlocked: true, shinyTier: 0, hasHiddenAbility: true, passiveUnlocked: false, candies: 15, eggMoves: [] },
    "piplup": { isUnlocked: true, shinyTier: 0, hasHiddenAbility: false, passiveUnlocked: false, candies: 12, eggMoves: [] },
    "pikachu": { isUnlocked: true, shinyTier: 3, hasHiddenAbility: true, passiveUnlocked: true, candies: 99, eggMoves: [] },
  };

  db.prepare("UPDATE users SET starter_data = ? WHERE user_id = ?").run(
    JSON.stringify(starterData),
    SIMULATED_USER_ID
  );
}
initSimulatedUser();

// SSE Clients for Live Reload
const sseClients: http.ServerResponse[] = [];
const moveGifMemoryCache = new Map<string, any>();
const bulbapediaCoreSeriesCache = new Map<string, any>();

const rendererPath = path.resolve(__dirname, "../src/utils/canvasRenderer.ts");
const interactionPath = path.resolve(__dirname, "../src/events/interactionCreate.ts");
const movesRendererDir = path.resolve(__dirname, "../src/renderers/moves");
const movesDefsDir = path.resolve(__dirname, "../src/battle/moves");

[rendererPath, interactionPath, movesRendererDir, movesDefsDir].forEach((targetPath) => {
  if (fs.existsSync(targetPath)) {
    try {
      fs.watch(targetPath, { recursive: true }, () => {
        console.log(`[VIEWER] ${path.basename(targetPath)} changed, clearing move cache and triggering live reload...`);
        moveGifMemoryCache.clear();
        sseClients.forEach((client) => client.write("data: reload\n\n"));
      });
    } catch {
      // Fallback non-recursive
      fs.watch(targetPath, () => {
        moveGifMemoryCache.clear();
        sseClients.forEach((client) => client.write("data: reload\n\n"));
      });
    }
  }
});

// Convert Discord Message Payload to JSON response
function serializeDiscordMessagePayload(result: any) {
  const attachment = result.files && result.files[0];
  let imageBase64 = "";
  if (attachment && attachment.attachment) {
    imageBase64 = `data:image/png;base64,${attachment.attachment.toString("base64")}`;
  }

  let embedData = null;
  if (result.embeds && result.embeds[0]) {
    embedData = typeof result.embeds[0].toJSON === "function" ? result.embeds[0].toJSON() : result.embeds[0];
  }

  const rows = (result.components || []).map((row: any) => {
    const rowJson = typeof row.toJSON === "function" ? row.toJSON() : row;
    return (rowJson.components || []).map((btn: any) => ({
      custom_id: btn.custom_id,
      label: btn.label,
      style: btn.style, // 1 = Primary, 2 = Secondary, 3 = Success, 4 = Danger
      disabled: Boolean(btn.disabled),
    }));
  });

  return {
    image: imageBase64,
    embed: embedData,
    rows: rows,
  };
}


function parseBulbapediaGenInfo(fileName: string) {
  const upper = fileName.toUpperCase();
  const isAlt2 = upper.includes("_2.") || upper.includes("-2.");
  const altSuffix = isAlt2 ? " (반동/후속)" : "";

  if (upper.includes("_I.") || upper.includes("_RB.") || upper.includes("_RG.")) return { order: 1, badge: "GEN I", label: `1세대 (RGBY)${altSuffix}` };
  if (upper.includes("_II.") || upper.includes("_GS.") || upper.includes("_C.")) return { order: 2, badge: "GEN II", label: `2세대 (GSC)${altSuffix}` };
  if (upper.includes("_III.") || upper.includes("_RS.") || upper.includes("_E.") || upper.includes("_FRLG.") || upper.includes("_COLO.") || upper.includes("_XD.")) return { order: 3, badge: "GEN III", label: `3세대 (RSE/FRLG)${altSuffix}` };
  if (upper.includes("_IV.") || upper.includes("_DP.") || upper.includes("_PT.") || upper.includes("_HGSS.")) return { order: 4, badge: "GEN IV", label: `4세대 (DPPt/HGSS)${altSuffix}` };
  if (upper.includes("_V.") || upper.includes("_BW.") || upper.includes("_B2W2.")) return { order: 5, badge: "GEN V", label: `5세대 (BW/B2W2)${altSuffix}` };
  if (upper.includes("_VI.") || upper.includes("_XY.") || upper.includes("_ORAS.")) return { order: 6 + (isAlt2 ? 0.1 : 0), badge: "GEN VI", label: `6세대 (XY/ORAS)${altSuffix}` };
  if (upper.includes("_VII.") || upper.includes("_SM.") || upper.includes("_USUM.")) return { order: 7 + (isAlt2 ? 0.1 : 0), badge: "GEN VII", label: `7세대 (SM/USUM)${altSuffix}` };
  if (upper.includes("_PE.") || upper.includes("_LGPE.")) return { order: 8 + (isAlt2 ? 0.1 : 0), badge: "LET'S GO", label: `레츠고 (LGPE)${altSuffix}` };
  if (upper.includes("_VIII.") || upper.includes("_SWSH.")) return { order: 9 + (isAlt2 ? 0.1 : 0), badge: "GEN VIII", label: `8세대 (소드/실드)${altSuffix}` };
  if (upper.includes("_BDSP.")) return { order: 10 + (isAlt2 ? 0.1 : 0), badge: "BDSP", label: `8세대 (BDSP)${altSuffix}` };
  if (upper.includes("_LA.") || upper.includes("_PLA.")) return { order: 11 + (isAlt2 ? 0.1 : 0), badge: "PLA", label: `LEGENDS 아르세우스${altSuffix}` };
  if (upper.includes("_IX.") || upper.includes("_SV.")) return { order: 12 + (isAlt2 ? 0.1 : 0), badge: "GEN IX", label: `9세대 (SV)${altSuffix}` };
  if (upper.includes("_ZA.") || upper.includes("_PLZA.")) return { order: 13 + (isAlt2 ? 0.1 : 0), badge: "PLZA", label: `LEGENDS Z-A${altSuffix}` };
  return { order: 99, badge: "OTHER", label: fileName.replace(/\.[^/.]+$/, "") };
}

async function scrapeBulbapediaCoreSeries(rawTitle: string) {
  const pageTitle = rawTitle.trim().replace(/\s+/g, "_");
  const wikiUrl = `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(pageTitle)}_(move)`;
  try {
    const res = await fetch(wikiUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!res.ok) {
      return { ok: false, error: `Bulbapedia returned HTTP ${res.status}`, wikiUrl, items: [] };
    }
    const html = await res.text();
    const coreIdx = html.lastIndexOf("Core series games");
    if (coreIdx === -1) {
      return { ok: true, wikiUrl, items: [] };
    }

    let endIdx = html.indexOf("Side series games", coreIdx);
    if (endIdx === -1) endIdx = html.indexOf("In spin-off games", coreIdx);
    if (endIdx === -1) endIdx = html.indexOf("<h3>", coreIdx + 100);
    if (endIdx === -1) endIdx = coreIdx + 100000;

    const section = html.slice(coreIdx, endIdx);
    const regex = /<a href="(\/wiki\/File:[^"]+)"[^>]*>[\s\S]*?<img[^>]+(?:src|data-src)="([^">]+)"/gi;
    let match: RegExpExecArray | null;
    const items: any[] = [];
    const seenFiles = new Set<string>();

    while ((match = regex.exec(section)) !== null) {
      const filePageRel = match[1];
      let imgUrl = match[2];
      if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;

      const fileName = decodeURIComponent(filePageRel.replace("/wiki/File:", ""));
      if (seenFiles.has(fileName)) continue;
      seenFiles.add(fileName);

      const genInfo = parseBulbapediaGenInfo(fileName);
      items.push({
        fileName,
        filePage: `https://bulbapedia.bulbagarden.net${filePageRel}`,
        imgUrl,
        proxyUrl: `/api/image-proxy?url=${encodeURIComponent(imgUrl)}`,
        ...genInfo,
      });
    }

    items.sort((a, b) => a.order - b.order);
    return { ok: true, wikiUrl, items };
  } catch (err: any) {
    return { ok: false, error: err.message, wikiUrl, items: [] };
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Live Reload SSE
  if (req.method === "GET" && req.url === "/api/live") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    sseClients.push(res);
    req.on("close", () => {
      const idx = sseClients.indexOf(res);
      if (idx >= 0) sseClients.splice(idx, 1);
    });
    return;
  }

  // 2. Serve HTML
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const htmlPath = path.join(__dirname, "index.html");
    fs.readFile(htmlPath, "utf-8", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Failed to load HTML: " + err.message);
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  // 2-B. Move Viewer - List all verified moves
  if (req.method === "GET" && req.url === "/api/moves") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(VERIFIED_MOVES));
    return;
  }

  // 2-B-2. Move Viewer - Fetch Bulbapedia Core series images (Gen 1 ~ Legends Z-A)
  if (req.method === "GET" && req.url?.startsWith("/api/move-core-series")) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const rawMoveKey = url.searchParams.get("moveKey") || "";
      const isEnemyCaster = rawMoveKey.endsWith("-enemy");
      const cleanKey = isEnemyCaster ? rawMoveKey.replace(/-enemy$/, "") : rawMoveKey;

      if (cleanKey === "encounter-entry" || cleanKey === "perk-hug") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, wikiUrl: null, items: [], customNote: "공식 본가 기술이 아닙니다." }));
        return;
      }

      const moveObj = VERIFIED_MOVES.find(m => m.id === cleanKey);
      const moveData = getMoveData(cleanKey);
      const pageTitle = url.searchParams.get("nameEn") || moveObj?.nameEn || moveData?.nameEn || cleanKey;

      const cached = bulbapediaCoreSeriesCache.get(cleanKey);
      if (cached) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ...cached, fromCache: true }));
        return;
      }

      const result = await scrapeBulbapediaCoreSeries(pageTitle);
      if (result.ok && result.items && result.items.length > 0) {
        bulbapediaCoreSeriesCache.set(cleanKey, result);
      }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // 2-B-3. Move Viewer - Image Proxy for external CDN images
  if (req.method === "GET" && req.url?.startsWith("/api/image-proxy")) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl || (!targetUrl.startsWith("https://archives.bulbagarden.net/") && !targetUrl.startsWith("https://bulbapedia.bulbagarden.net/"))) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Invalid URL");
        return;
      }
      const fetchRes = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (!fetchRes.ok) {
        res.writeHead(fetchRes.status);
        res.end();
        return;
      }
      const contentType = fetchRes.headers.get("content-type") || "image/png";
      const buffer = Buffer.from(await fetchRes.arrayBuffer());
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      });
      res.end(buffer);
    } catch (err: any) {
      res.writeHead(500);
      res.end();
    }
    return;
  }


  // 2-C. Move Viewer - Render Move GIF (A attacks with move, then B counterattacks with same move!)
  if (req.method === "GET" && req.url?.startsWith("/api/render-move")) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const rawMoveKey = url.searchParams.get("moveKey") || "double-kick";
      const isEnemyCaster = rawMoveKey.endsWith("-enemy");
      const moveKey = isEnemyCaster ? rawMoveKey.replace(/-enemy$/, "") : rawMoveKey;
      const playerSpecies = url.searchParams.get("playerSpecies") || "bulbasaur";
      const enemySpecies = url.searchParams.get("enemySpecies") || "onix";
      const hitMode = url.searchParams.get("hitMode") || "normal"; // "normal" | "super" | "miss"
      const flyPhase = url.searchParams.get("flyPhase") || "2"; // "2": 2턴 활공 후 내려찍기 | "1": 1턴 도약 및 은신 | "full": 전체 연속 재생
      const actMode = url.searchParams.get("actMode") || "dual"; // "dual" (기본: 1막+2막 맞시전) | "single" (1막 단독)
      console.log(`[VIEWER MOVE] moveKey=${rawMoveKey}, hitMode=${hitMode}, actMode=${actMode}`);

      const cacheKey = `${rawMoveKey}_${playerSpecies}_${enemySpecies}_${hitMode}_${flyPhase}_${actMode}`;
      const noCache = url.searchParams.get("nocache") === "1" || !!url.searchParams.get("t");
      const cached = noCache ? null : moveGifMemoryCache.get(cacheKey);
      if (cached) {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        });
        res.end(JSON.stringify({ ...cached, fromCache: true, renderTimeMs: cached.renderTimeMs }));
        return;
      }

      const moveData = getMoveData(moveKey);
      const moveKo = moveKey === "encounter-entry" ? "야생 포켓몬 조우 (등장)" : (moveKey === "perk-hug" ? "포옹 (🫂 특수 연출)" : (moveData?.nameKo || moveKey));
      const playerInfo = POKEMON_SPECIES_DATA[playerSpecies];
      const enemyInfo = POKEMON_SPECIES_DATA[enemySpecies];
      const playerDisplayName = playerInfo?.nameKo || playerSpecies;
      const enemyDisplayName = enemyInfo?.nameKo || enemySpecies;

      const isStatus = moveData?.category === "status" || moveKey === "swords-dance" || moveKey === "whirlwind" || moveKey === "perk-hug";
      const isOHKO = moveKey === "guillotine" || moveKey === "horn-drill" || moveKey === "fissure" || moveKey === "sheer-cold";
      const isMiss = hitMode === "miss";
      const isImmune = hitMode === "immune";
      const isQuarter = hitMode === "quarter";   // 효과가 매우 별로 (0.25x - 50% 반투명 1회)
      const isNotVery = hitMode === "not-very"; // 효과가 별로 (0.5x - 1회)
      const isSuper = hitMode === "super";       // 효과가 굉장하다 (2.0x - 4회)
      const isUltra = hitMode === "ultra";       // 효과가 매우 굉장하다 (4.0x - 5회)

      let typeMod = 1.0;
      if (isMiss || isImmune) typeMod = 0.0;
      else if (isQuarter) typeMod = 0.25;
      else if (isNotVery) typeMod = 0.5;
      else if (isSuper) typeMod = 2.0;
      else if (isUltra) typeMod = 4.0;
      else typeMod = 1.0;

      const isHit = !isMiss;
      const actualDamage = isStatus ? 0 : (isMiss || isImmune ? 0 : (isOHKO ? 150 : Math.max(1, Math.round(35 * typeMod))));
      const act1EnemyHpAfter = isStatus ? 150 : (isMiss || isImmune ? 150 : (isOHKO ? 0 : Math.max(0, 150 - actualDamage)));

      const isBuff = moveKey === "swords-dance" || moveKey === "growth" || moveKey === "dragon-dance" || moveKey === "calm-mind" || moveKey === "bulk-up" || moveKey === "agility";
      const isNotDebuff = moveKey === "mist" || moveKey === "haze" || moveKey === "safeguard";
      const isDebuff = !isNotDebuff && (
        moveKey === "growl" || moveKey === "tail-whip" || moveKey === "leer" || moveKey === "sand-attack" ||
        moveKey === "screech" || moveKey === "charm" || moveKey === "fake-tears" || moveKey === "metal-sound" ||
        moveKey === "string-shot" || moveKey === "smokescreen" || moveKey === "kinesis" || moveKey === "flash" ||
        Boolean(moveData?.description && (
          !moveData.description.includes("떨어지지") &&
          (moveData.description.includes("떨어뜨") || moveData.description.includes("낮춘") || moveData.description.includes("감소") || moveData.description.includes("하락"))
        ))
      );

      const pStatChanges: { target: "player" | "enemy"; direction: "up" | "down" }[] | undefined = isBuff
        ? [{ target: "player", direction: "up" }]
        : (isDebuff ? [{ target: "enemy", direction: "down" }] : undefined);

      const eStatChanges: { target: "player" | "enemy"; direction: "up" | "down" }[] | undefined = isBuff
        ? [{ target: "enemy", direction: "up" }]
        : (isDebuff ? [{ target: "player", direction: "down" }] : undefined);

      const mockBattle = {
        userId: "viewer_user",
        slotId: 1,
        stage: 1,
        biome: "town",
        phase: (isOHKO && !isMiss) ? (isEnemyCaster ? "DEFEAT" : "VICTORY") : "ACTION",
        dialogueText: moveKey === "perk-hug" ? `[PERK:hug] ${playerDisplayName}(은)는 당신을 포옹하고 돌아갔다.` : "",
        hugTriggered: moveKey === "perk-hug",
        playerParty: [{
          id: "p1",
          speciesId: playerSpecies,
          dexNumber: playerInfo?.dexNumber || 1,
          species: playerSpecies,
          name: playerDisplayName,
          level: 25,
          hp: (isEnemyCaster && isOHKO && !isMiss) ? 0 : 150,
          maxHp: 150,
          stats: { hp: 150, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
          moves: [moveKey, "surf", "ice-beam", "blizzard", "psybeam"].filter((m, i, arr) => arr.indexOf(m) === i).slice(0, 4),
          types: playerInfo?.types || ["grass"]
        }],
        playerBattleMon: {
          id: "p1",
          speciesId: playerSpecies,
          dexNumber: playerInfo?.dexNumber || 1,
          species: playerSpecies,
          name: playerDisplayName,
          level: 25,
          hp: (isEnemyCaster && isOHKO && !isMiss) ? 0 : 150,
          maxHp: 150,
          stats: { hp: 150, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
          moves: [moveKey, "surf", "ice-beam", "blizzard", "psybeam"].filter((m, i, arr) => arr.indexOf(m) === i).slice(0, 4),
          types: playerInfo?.types || ["grass"],
          semiInvulnerableState: (moveKey === "fly" && flyPhase === "2") ? "air" : null,
          chargingMove: (moveKey === "fly" && flyPhase === "2") ? "fly" : null,
        },
        enemy: {
          id: "e1",
          speciesId: enemySpecies,
          dexNumber: enemyInfo?.dexNumber || 95,
          species: enemySpecies,
          name: enemyDisplayName,
          level: 25,
          hp: (!isEnemyCaster && isOHKO && !isMiss) ? 0 : 150,
          maxHp: 150,
          stats: { hp: 150, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
          moves: [moveKey],
          types: enemyInfo?.types || ["rock"]
        },
        turnActions: isEnemyCaster ? [
          // 적 시점 단독 시전: 적이 내 포켓몬을 향해 일격필살/기술 시전
          {
            actor: "enemy",
            moveKey: moveKey,
            moveName: moveKo,
            damage: actualDamage,
            isHit: isHit,
            isSuperEffective: false,
            typeMod: 1.0,
            statChanges: eStatChanges,
            playerHpAfter: (isOHKO && !isMiss) ? 0 : 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: isMiss
              ? `적 ${enemyDisplayName}의 ${moveKo}!\n하지만 상대에게 빗나갔다!`
              : `적 ${enemyDisplayName}의 ${moveKo}!\n일격필살! 아군 ${playerDisplayName}(은)는 쓰러졌다!`
          }
        ] : (moveKey === "fly" && flyPhase === "1") ? [
          // 1턴: 날아오르기 (하늘 높이 날아올랐다) + 적 공격 빗나감 (상공 은신 상태)
          {
            actor: "player",
            moveKey: "fly",
            moveName: "공중날기",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "fly",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 하늘 높이 날아올랐다!`
          },
          {
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 0,
            isHit: false,
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기!\n하지만 상대에게 닿지 않았다!`
          }
        ] : (moveKey === "fly" && flyPhase === "full") ? [
          // 전체 풀 시퀀스: 1턴 도약 ➔ 2턴 활공 후 급강하 내려찍기
          {
            actor: "player",
            moveKey: "fly",
            moveName: "공중날기",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "fly",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 하늘 높이 날아올랐다!`
          },
          {
            actor: "player",
            moveKey: "fly",
            moveName: "공중날기",
            damage: actualDamage,
            isHit: isHit,
            isTurn1Launch: false,
            wasDescentFromAir: true,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            playerHpAfter: 150,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 공중날기!\n하지만 상대에게 빗나갔다!`
              : (isSuper
                ? `아군 ${playerDisplayName}의 공중날기! 효과가 굉장했다! ${actualDamage} 데미지!`
                : `아군 ${playerDisplayName}의 공중날기! ${actualDamage} 데미지!`)
          }
        ] : (moveKey === "fly") ? [
          // 2턴 (기본값): 활공 후 급강하 내려찍기 + 적 반격
          {
            actor: "player",
            moveKey: "fly",
            moveName: "공중날기",
            damage: actualDamage,
            isHit: isHit,
            isTurn1Launch: false,
            wasDescentFromAir: true,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            playerHpAfter: 150,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 공중날기!\n하지만 상대에게 빗나갔다!`
              : (isSuper
                ? `아군 ${playerDisplayName}의 공중날기! 효과가 굉장했다! ${actualDamage} 데미지!`
                : `아군 ${playerDisplayName}의 공중날기! ${actualDamage} 데미지!`)
          },
          {
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 25,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 125,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기! 25 데미지!`
          }
        ] : (moveKey === "razor-wind" && flyPhase === "1") ? [
          // 1턴: 바람 일으키기 (소용돌이 장전) + 적 반격
          {
            actor: "player",
            moveKey: "razor-wind",
            moveName: "칼바람",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "razor-wind",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 칼바람을 일으켰다!`
          },
          {
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 20,
            isHit: true,
            playerHpAfter: 130,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기! 20 데미지!`
          }
        ] : (moveKey === "razor-wind" && flyPhase === "full") ? [
          // 전체 풀 시퀀스: 1턴 소용돌이 장전 ➔ 2턴 베기 폭풍 격돌
          {
            actor: "player",
            moveKey: "razor-wind",
            moveName: "칼바람",
            damage: 0,
            isHit: true,
            isTurn1Launch: true,
            chargingMove: "razor-wind",
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}(은)는 칼바람을 일으켰다!`
          },
          {
            actor: "player",
            moveKey: "razor-wind",
            moveName: "칼바람",
            damage: actualDamage,
            isHit: isHit,
            isTurn1Launch: false,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            playerHpAfter: 150,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 칼바람!\n하지만 상대에게 빗나갔다!`
              : (isSuper
                ? `아군 ${playerDisplayName}의 칼바람! 효과가 굉장했다! 급소에 맞았다! ${actualDamage} 데미지!`
                : `아군 ${playerDisplayName}의 칼바람! 급소에 맞았다! ${actualDamage} 데미지!`)
          }
        ] : (moveKey === "razor-wind") ? [
          // 2턴 (기본값): 칼바람 베기 공격 + 적 반격
          {
            actor: "player",
            moveKey: "razor-wind",
            moveName: "칼바람",
            damage: actualDamage,
            isHit: isHit,
            isTurn1Launch: false,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            playerHpAfter: 150,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 칼바람!\n하지만 상대에게 빗나갔다!`
              : (isSuper
                ? `아군 ${playerDisplayName}의 칼바람! 효과가 굉장했다! 급소에 맞았다! ${actualDamage} 데미지!`
                : `아군 ${playerDisplayName}의 칼바람! 급소에 맞았다! ${actualDamage} 데미지!`)
          },
          {
            actor: "enemy",
            moveKey: "tackle",
            moveName: "몸통박치기",
            damage: 20,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 130,
            enemyHpAfter: isMiss ? 150 : (isSuper ? 80 : 115),
            effectiveness: 1.0,
            log: `적 ${enemyDisplayName}의 몸통박치기! 20 데미지!`
          }
        ] : (moveKey === "perk-hug") ? [
          // 🫂 포옹 특수 연출 (내 포켓몬이 다가와 1초간 포옹 후 복귀)
          {
            actor: "player",
            moveKey: "perk-hug",
            moveName: "포옹",
            damage: 0,
            isHit: true,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 150,
            enemyHpAfter: 150,
            effectiveness: 1.0,
            log: `[PERK:hug] ${playerDisplayName}(은)는 당신을 포옹하고 돌아갔다.`
          }
        ] : (isOHKO && !isMiss) ? [
          // 1막: 일격필살 즉사 처형 (적 사망으로 2막 반격 없음)
          {
            actor: "player",
            moveKey: moveKey,
            moveName: moveKo,
            damage: actualDamage,
            isHit: isHit,
            isSuperEffective: false,
            typeMod: 1.0,
            playerHpAfter: 150,
            enemyHpAfter: 0,
            effectiveness: 1.0,
            log: `아군 ${playerDisplayName}의 ${moveKo}!\n일격필살! 상대 ${enemyDisplayName}(은)는 쓰러졌다!`
          }
        ] : (actMode === "dual" ? [
          // 1막: A(내 포켓몬)가 기술 시전
          {
            actor: "player",
            moveKey: moveKey,
            moveName: moveKo,
            damage: actualDamage,
            isHit: isHit,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            statChanges: pStatChanges,
            playerHpAfter: (moveKey === "take-down" || moveKey === "double-edge") ? 135 : 150,
            enemyHpAfter: act1EnemyHpAfter,
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 ${moveKo}!\n하지만 상대에게 빗나갔다!`
              : (isImmune
                ? `아군 ${playerDisplayName}의 ${moveKo}!\n상대에게 효과가 없는 것 같다...`
                : (isQuarter || isNotVery
                  ? `아군 ${playerDisplayName}의 ${moveKo}!\n효과가 별로인 듯하다...`
                  : (isSuper || isUltra
                    ? `아군 ${playerDisplayName}의 ${moveKo}!\n효과가 굉장했다!`
                    : `아군 ${playerDisplayName}의 ${moveKo}!`)))
          },
          // 2막: B(적대 포켓몬)가 해당 같은 기술 시전
          {
            actor: "enemy",
            moveKey: moveKey,
            moveName: moveKo,
            damage: actualDamage,
            isHit: isHit,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            statChanges: eStatChanges,
            playerHpAfter: isStatus ? 150 : (isMiss || isImmune ? 150 : Math.max(0, 150 - actualDamage)),
            enemyHpAfter: (moveKey === "take-down" || moveKey === "double-edge")
              ? 135
              : (isStatus ? 150 : (isMiss || isImmune ? 150 : Math.max(0, 150 - actualDamage))),
            effectiveness: typeMod,
            log: isMiss
              ? `적 ${enemyDisplayName}의 ${moveKo}!\n하지만 상대에게 빗나갔다!`
              : (isImmune
                ? `적 ${enemyDisplayName}의 ${moveKo}!\n상대에게 효과가 없는 것 같다...`
                : (isQuarter || isNotVery
                  ? `적 ${enemyDisplayName}의 ${moveKo}!\n효과가 별로인 듯하다...`
                  : (isSuper || isUltra
                    ? `적 ${enemyDisplayName}의 ${moveKo}!\n효과가 굉장했다!`
                    : `적 ${enemyDisplayName}의 ${moveKo}!`)))
          }
        ] : [
          // 기본 쾌속 모드: 1막 단독 시전 (로딩 속도 2~3배 대폭 단축!)
          {
            actor: "player",
            moveKey: moveKey,
            moveName: moveKo,
            damage: actualDamage,
            isHit: isHit,
            isSuperEffective: isSuper,
            typeMod: typeMod,
            statChanges: pStatChanges,
            playerHpAfter: (moveKey === "take-down" || moveKey === "double-edge") ? 135 : 150,
            enemyHpAfter: act1EnemyHpAfter,
            effectiveness: typeMod,
            log: isMiss
              ? `아군 ${playerDisplayName}의 ${moveKo}!\n하지만 상대에게 빗나갔다!`
              : (isImmune
                ? `아군 ${playerDisplayName}의 ${moveKo}!\n상대에게 효과가 없는 것 같다...`
                : (isQuarter || isNotVery
                  ? `아군 ${playerDisplayName}의 ${moveKo}!\n효과가 별로인 듯하다...`
                  : (isSuper || isUltra
                    ? `아군 ${playerDisplayName}의 ${moveKo}!\n효과가 굉장했다!`
                    : `아군 ${playerDisplayName}의 ${moveKo}!`)))
          }
        ])
      };

      const t0 = Date.now();
      let gifResult: any;
      if (moveKey === "encounter-entry") {
        gifResult = await renderBattleEntryGif({
          battle: {
            ...mockBattle,
            dialogueText: `야생의 ${enemyDisplayName}(이)가 나타났다!`,
          } as any,
          lang: "ko",
        });
      } else {
        if (!mockBattle.dialogueText && mockBattle.turnActions?.length) {
          mockBattle.dialogueText = mockBattle.turnActions.map((a: any) => a.log).filter(Boolean).join("\n");
        }
        gifResult = await renderBattleMoveGif({
          battle: mockBattle as any,
          lang: "ko",
          includeFramePreviews: true,
        });
      }
      const t1 = Date.now();

      let pageCount = gifResult.frames ? gifResult.frames.length : 25;
      try {
        const meta = await sharp(gifResult.buffer, { animated: true }).metadata();
        pageCount = meta.pages || pageCount;
      } catch {}

      const responseData = {
        gif: `data:image/gif;base64,${gifResult.buffer.toString("base64")}`,
        renderTimeMs: t1 - t0,
        motionDurationMs: gifResult.motionDurationMs,
        frameCount: pageCount,
        moveKey: rawMoveKey,
        moveName: isEnemyCaster ? `${moveKo} (상대 시전)` : moveKo,
        phases: gifResult.phases || [],
        frames: gifResult.frames || [],
      };

      moveGifMemoryCache.set(cacheKey, responseData);

      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.end(JSON.stringify(responseData));
    } catch (err: any) {
      console.error("[VIEWER MOVE ERROR]", err);
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 3. Initial State Endpoint
  if (req.method === "GET" && req.url?.startsWith("/api/initial")) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const screen = url.searchParams.get("screen") || "title";

      let result: any;
      if (screen === "title") {
        result = await renderTitleMessageData(null as any, SIMULATED_USER_ID);
      } else if (screen === "slots") {
        result = renderSlotsScreenData(SIMULATED_USER_ID);
      } else if (screen === "starter_select") {
        result = await renderStarterSelectMessageData(
          null as any,
          SIMULATED_USER_ID,
          1, // slotId
          0, // gen 0 (All)
          1, // page 1
          1, // selectedDexNo (Bulbasaur)
          [], // partyDexList
          false,
          false,
          false
        );
      } else if (screen === "party") {
        result = await renderPartyViewMessageData(
          null as any,
          SIMULATED_USER_ID,
          1,
          0,
          1,
          1,
          "1:2:1:1-4:1:0:1-7:0:1:0", // Sample 3 Pokemon Party
          false,
          false,
          false,
          0,
          "moves",
          0
        );
      } else if (screen === "pokedex") {
        result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, 1, 1, "title");
      } else if (screen === "bag") {
        result = await renderBagMessageData(null as any, SIMULATED_USER_ID, "pokemon");
      } else if (screen === "multiplayer") {
        result = await renderMultiplayerMessageData(null as any, SIMULATED_USER_ID);
      } else if (screen === "settings") {
        result = renderSettingsMessageData(SIMULATED_USER_ID);
      } else {
        result = await renderTitleMessageData(null as any, SIMULATED_USER_ID);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(serializeDiscordMessagePayload(result)));
    } catch (err: any) {
      console.error("[VIEWER INITIAL ERROR]", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 4. Click Interaction Dispatcher (100% 1:1 match with interactionCreate.ts button events)
  if (req.method === "POST" && req.url === "/api/click") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { customId } = JSON.parse(body || "{}");
        if (!customId) throw new Error("Missing customId");

        console.log(`[VIEWER INTERACTION] Clicked customId: ${customId}`);

        const parts = customId.split("_");
        let result: any;

        // 3-0. Back to Title Menu
        if (customId.startsWith("menu_back_to_title_") || customId.startsWith("starter_back_title_")) {
          result = await renderTitleMessageData(null as any, SIMULATED_USER_ID);
        }

        // 3-0-1. Inventory Bag Button Clicked
        else if (customId.startsWith("menu_inventory_") || customId.startsWith("bag_tab_")) {
          if (customId.includes("pokedex")) {
            result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, 1, 1, "inventory");
          } else {
            const tab = customId.includes("records") ? "records" : "pokemon";
            result = await renderBagMessageData(null as any, SIMULATED_USER_ID, tab);
          }
        }

        // 3-0-2. Settings Button Clicked (⚙️)
        else if (customId.startsWith("menu_settings_")) {
          result = renderSettingsMessageData(SIMULATED_USER_ID);
        }

        // 3-0-3. Switch Language (English / 한국어)
        else if (customId.startsWith("settings_lang_")) {
          const lang = parts[2] as "en" | "ko";
          saveService.setLanguage(SIMULATED_USER_ID, lang);
          result = renderSettingsMessageData(SIMULATED_USER_ID);
        }

        // 3-0-4. Multiplay Button Clicked
        else if (customId.startsWith("menu_multiplay_")) {
          result = await renderMultiplayerMessageData(null as any, SIMULATED_USER_ID);
        }

        // 3-0-6. Multiplayer Pokédex Button Clicked (interactionCreate.ts:1531)
        else if (customId.startsWith("multi_pokedex_btn_")) {
          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, 1, 1, "multiplay");
        }

        // 3-0-6-B. Pokédex Ability Info Button Clicked (interactionCreate.ts:1537)
        else if (customId.startsWith("pokedex_ability_")) {
          const rawAbilityParam = parts[2] || "none";
          const rawAbility = rawAbilityParam === "none" ? undefined : decodeURIComponent(rawAbilityParam);
          const dexNo = parseInt(parts[3], 10) || 1;
          const page = parseInt(parts[4], 10) || 1;
          const fromScreen = (parts[5] || "title") as "multiplay" | "inventory" | "title";

          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, dexNo, page, fromScreen, rawAbility);
        }

        // 3-0-7. Pokédex Select Pokémon (interactionCreate.ts:1549)
        else if (customId.startsWith("pokedex_select_")) {
          const dexNo = parseInt(parts[2], 10) || 1;
          const page = parseInt(parts[3], 10) || 1;
          const fromScreen = (parts[4] || "title") as "multiplay" | "inventory" | "title";

          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, dexNo, page, fromScreen, undefined);
        }

        // 3-0-8. Pokédex Page Navigation (interactionCreate.ts:1559)
        else if (
          customId.startsWith("pokedex_page_") ||
          customId.startsWith("pokedex_pageprev_") ||
          customId.startsWith("pokedex_pagenext_") ||
          customId.startsWith("pokedex_jumpback_") ||
          customId.startsWith("pokedex_jumpfwd_")
        ) {
          const targetPage = parseInt(parts[2], 10) || 1;
          const currentDexNo = parseInt(parts[3], 10) || ((targetPage - 1) * 8 + 1);
          const fromScreen = (parts[4] || "title") as "multiplay" | "inventory" | "title";

          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, currentDexNo, targetPage, fromScreen, undefined);
        }

        // 3-0-8-Back. Pokédex Back Button (pokedex_back_${fromScreen}_${userId})
        else if (customId.startsWith("pokedex_back_")) {
          const fromScreen = parts[2] as "multiplay" | "inventory" | "title";
          if (fromScreen === "multiplay") {
            result = await renderMultiplayerMessageData(null as any, SIMULATED_USER_ID);
          } else if (fromScreen === "inventory") {
            result = await renderBagMessageData(null as any, SIMULATED_USER_ID, "pokemon");
          } else {
            result = await renderTitleMessageData(null as any, SIMULATED_USER_ID);
          }
        }

        // 3-0-8-A. Pokédex Add to Multiplayer Team
        else if (customId.startsWith("pokedex_add_multi_")) {
          const dexNo = parseInt(parts[3], 10) || 1;
          const page = parseInt(parts[4], 10) || 1;
          const fromScreen = (parts[5] || "multiplay") as "multiplay" | "inventory" | "title";
          const poke = await getPokemonByDexNumber(dexNo);
          if (poke) {
            const partyPoke: PartyPokemon = {
              speciesId: poke.speciesId,
              name: poke.koreanName || poke.name,
              level: 50,
              hp: poke.hp * 2 + 110,
              maxHp: poke.hp * 2 + 110,
              moves: ["Tackle", "Quick Attack"],
            };
            saveService.addMultiplayerPokemon(SIMULATED_USER_ID, partyPoke);
          }
          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, dexNo, page, fromScreen);
        }

        // 3-0-8-B. Pokédex Add to Adventure Party
        else if (customId.startsWith("pokedex_add_bag_")) {
          const dexNo = parseInt(parts[3], 10) || 1;
          const page = parseInt(parts[4], 10) || 1;
          const fromScreen = (parts[5] || "inventory") as "multiplay" | "inventory" | "title";
          const poke = await getPokemonByDexNumber(dexNo);
          if (poke) {
            const partyPoke: PartyPokemon = {
              speciesId: poke.speciesId,
              name: poke.koreanName || poke.name,
              level: 25,
              hp: poke.hp + 50,
              maxHp: poke.hp + 50,
              moves: ["Tackle", "Growl"],
            };
            saveService.addBagPokemon(SIMULATED_USER_ID, partyPoke);
          }
          result = await renderPokedexMessageData(null as any, SIMULATED_USER_ID, dexNo, page, fromScreen);
        }

        // 2-1. New Game Button Clicked from Title (interactionCreate.ts:1746 -> renderStarterSelectMessageData directly!)
        else if (customId.startsWith("menu_newgame_")) {
          const targetSlot = saveService.getFirstAvailableSlot(SIMULATED_USER_ID);
          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, targetSlot, 0, 1, 1, [], false, false, false);
        }

        // 2-0. Load Game Button Clicked from Title
        else if (customId.startsWith("menu_loadgame_")) {
          result = renderSlotsScreenData(SIMULATED_USER_ID);
        }

        // Slot Select
        else if (customId.startsWith("slot_select_")) {
          const slotId = parseInt(parts[2], 10) || 1;
          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, 0, 1, 1, [], false, false, false);
        }

        // 2-1-G. Open Generation Selection Menu
        else if (customId.startsWith("starter_open_gen_menu_") || customId.startsWith("starter_genmenu_")) {
          const rawGen = parseInt(parts[2], 10);
          const currentGen = isNaN(rawGen) ? 0 : rawGen;
          const slotId = parseInt(parts[3], 10) || 1;
          const partyParam = parts[4] || "empty";
          const flagsParam = parts[5] || "0_0_0";
          result = await renderGenSelectMessageData(null as any, SIMULATED_USER_ID, currentGen, slotId, partyParam, flagsParam);
        }

        // 2-1-H. Pick Specific Generation from Gen Menu or Back Button
        else if (customId.startsWith("starter_pickgen_") || customId.startsWith("starter_genback_")) {
          const isBack = customId.startsWith("starter_genback_");
          const chosenGen = parseInt(parts[2], 10) || 0;
          const prevGen = parseInt(parts[3], 10) || 0;
          const slotId = parseInt(parts[4], 10) || 1;
          const partyRaw = parts[5] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[6] === "1";
          const isHa = parts[7] === "1";
          const isPassive = parts[8] === "1";

          const nextGen = isBack ? chosenGen : (chosenGen === prevGen ? 0 : chosenGen);
          const genStarters = getStartersByGen(nextGen);
          const firstStarterDex = genStarters[0]?.dexNumber || 1;

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, nextGen, 1, firstStarterDex, partyDexList, isShiny, isHa, isPassive);
        }

        // 2-1-A. Starter Select Pokemon Item Clicked (interactionCreate.ts:1790)
        else if (customId.startsWith("starter_sel_") || customId.startsWith("starter_slot_")) {
          const dexNo = parseInt(parts[2], 10) || 1;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, isShiny, isHa, isPassive);
        }

        // 2-1-B. Starter Page Navigation (interactionCreate.ts:1807)
        else if (
          customId.startsWith("starter_page_prev_") ||
          customId.startsWith("starter_page_next_") ||
          customId.startsWith("starter_page_jumpfirst_") ||
          customId.startsWith("starter_page_jumplast_") ||
          customId.startsWith("starter_page_")
        ) {
          const action = parts[2];
          const gen = parseInt(parts[3], 10) || 0;
          const curPage = parseInt(parts[4], 10) || 1;
          const currentDexNo = parseInt(parts[5], 10) || 1;
          const slotId = parseInt(parts[6], 10) || 1;
          const partyRaw = parts[7] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[8] === "1";
          const isHa = parts[9] === "1";
          const isPassive = parts[10] === "1";

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          let allStarters = getStartersByGen(gen).filter((s) => userStarters.get(s.speciesId)?.isUnlocked);
          if (isShiny) allStarters = allStarters.filter((s) => (userStarters.get(s.speciesId)?.shinyTier || 0) > 0);
          if (isHa) allStarters = allStarters.filter((s) => userStarters.get(s.speciesId)?.hasHiddenAbility);
          if (isPassive) allStarters = allStarters.filter((s) => userStarters.get(s.speciesId)?.passiveUnlocked);

          const totalPages = Math.max(1, Math.ceil(allStarters.length / 8));
          let targetPage = curPage;

          if (action === "prev") targetPage = Math.max(1, curPage - 1);
          else if (action === "next") targetPage = Math.min(totalPages, curPage + 1);
          else if (action === "jumpfirst") targetPage = 1;
          else if (action === "jumplast") targetPage = totalPages;

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, targetPage, currentDexNo, partyDexList, isShiny, isHa, isPassive);
        }

        // 2-1-T1. Starter Toggle Shiny (interactionCreate.ts:1844)
        else if (customId.startsWith("starter_toggleshiny_")) {
          const gen = parseInt(parts[2], 10) || 0;
          const page = parseInt(parts[3], 10) || 1;
          const dexNo = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, !isShiny, isHa, isPassive);
        }

        // 2-1-T2. Starter Toggle Passive (interactionCreate.ts:1861)
        else if (customId.startsWith("starter_togglepass_")) {
          const gen = parseInt(parts[2], 10) || 0;
          const page = parseInt(parts[3], 10) || 1;
          const dexNo = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, isShiny, isHa, !isPassive);
        }

        // 2-1-T3. Starter Toggle Hidden Ability (interactionCreate.ts:1878)
        else if (customId.startsWith("starter_toggleha_")) {
          const gen = parseInt(parts[2], 10) || 0;
          const page = parseInt(parts[3], 10) || 1;
          const dexNo = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, isShiny, !isHa, isPassive);
        }

        // 2-1-C. Starter Add to Party (interactionCreate.ts:1895)
        else if (customId.startsWith("starter_add_")) {
          const dexNo = parseInt(parts[2], 10) || 1;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const partyDexList = partyRaw === "empty" ? [] : partyRaw.split("-").map((d: string) => parseInt(d, 10)).filter(Boolean);
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          if (!partyDexList.includes(dexNo) && partyDexList.length < 6) {
            partyDexList.push(dexNo);
          }

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, isShiny, isHa, isPassive);
        }

        // 2-1-P1. Open Party View Screen (interactionCreate.ts:1916)
        else if (customId.startsWith("starter_openparty_")) {
          const dexNo = parseInt(parts[2], 10) || 1;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyRaw = parts[6] || "empty";
          const isShiny = parts[7] === "1";
          const isHa = parts[8] === "1";
          const isPassive = parts[9] === "1";

          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, 0, "moves", 0);
        }

        // 2-1-P2. Pick Party Member in Party View Screen (interactionCreate.ts:1932)
        else if (customId.startsWith("party_pick_")) {
          const rawIdx = parseInt(parts[2], 10);
          const targetIdx = isNaN(rawIdx) ? -1 : rawIdx;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const dexNo = parseInt(parts[5], 10) || 1;
          const slotId = parseInt(parts[6], 10) || 1;
          const partyRaw = parts[7] || "empty";
          const isShiny = parts[8] === "1";
          const isHa = parts[9] === "1";
          const isPassive = parts[10] === "1";
          const tab = (parts[11] || "moves") as PartyViewTab;
          const moveIdx = 0;

          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, targetIdx, tab, moveIdx);
        }

        // 2-1-P2-TAB. Switch Tab in Party View (interactionCreate.ts:1952)
        else if (customId.startsWith("party_tab_")) {
          const targetTab = parts[2] as PartyViewTab;
          const currentIdx = parseInt(parts[3], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          const partyRaw = parts[8] || "empty";
          const isShiny = parts[9] === "1";
          const isHa = parts[10] === "1";
          const isPassive = parts[11] === "1";
          const moveIdx = parseInt(parts[12], 10) || 0;

          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, currentIdx, targetTab, moveIdx);
        }

        // 2-1-P2-MOVE. Pick Move in Moves Tab (interactionCreate.ts:1971)
        else if (customId.startsWith("party_movepick_") || customId.startsWith("party_pickmove_")) {
          const targetMoveIdx = parseInt(parts[2], 10) || 0;
          const currentIdx = parseInt(parts[3], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          const partyRaw = parts[8] || "empty";
          const isShiny = parts[9] === "1";
          const isHa = parts[10] === "1";
          const isPassive = parts[11] === "1";
          const tab: PartyViewTab = "moves";

          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyRaw, isShiny, isHa, isPassive, currentIdx, tab, targetMoveIdx);
        }

        // 2-1-P2-SHINY. Set Shiny Tier in Shiny Tab (interactionCreate.ts:1990)
        else if (customId.startsWith("party_setshiny_")) {
          const targetShinyTier = parseInt(parts[2], 10) || 0;
          const currentIdx = parseInt(parts[3], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          const partyRaw = parts[8] || "empty";
          const isShiny = parts[9] === "1";
          const isHa = parts[10] === "1";
          const isPassive = parts[11] === "1";
          const tab = (parts[12] || "shiny") as PartyViewTab;
          const moveIdx = parseInt(parts[13], 10) || 0;

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          const partyStates = parsePartyParam(partyRaw, userStarters);
          const targetMember = partyStates[currentIdx];
          if (targetMember) {
            targetMember.shinyTier = targetShinyTier;
          }
          const newPartyParam = serializePartyParam(partyStates);
          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx);
        }

        // 2-1-P2-A. Set or Toggle Hidden Ability (interactionCreate.ts:2019)
        else if (customId.startsWith("party_setha_") || customId.startsWith("party_toggleha_")) {
          const isSet = customId.startsWith("party_setha_");
          const targetUseHa = isSet ? parts[2] === "1" : undefined;
          const currentIdx = parseInt(parts[isSet ? 3 : 2], 10) || 0;
          const gen = parseInt(parts[isSet ? 4 : 3], 10) || 0;
          const page = parseInt(parts[isSet ? 5 : 4], 10) || 1;
          const dexNo = parseInt(parts[isSet ? 6 : 5], 10) || 1;
          const slotId = parseInt(parts[isSet ? 7 : 6], 10) || 1;
          const partyRaw = parts[isSet ? 8 : 7] || "empty";
          const isShiny = parts[isSet ? 9 : 8] === "1";
          const isHa = parts[isSet ? 10 : 9] === "1";
          const isPassive = parts[isSet ? 11 : 10] === "1";
          const tab = (parts[isSet ? 12 : 11] || "moves") as PartyViewTab;
          const moveIdx = parseInt(parts[isSet ? 13 : 12], 10) || 0;

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          const partyStates = parsePartyParam(partyRaw, userStarters);
          const targetMember = partyStates[currentIdx];
          if (targetMember) {
            targetMember.useHiddenAbility = isSet ? (targetUseHa ?? !targetMember.useHiddenAbility) : !targetMember.useHiddenAbility;
          }
          const newPartyParam = serializePartyParam(partyStates);
          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx);
        }

        // 2-1-P2-B. Toggle Passive (interactionCreate.ts:2054)
        else if (customId.startsWith("party_togglepass_")) {
          const currentIdx = parseInt(parts[2], 10) || 0;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const dexNo = parseInt(parts[5], 10) || 1;
          const slotId = parseInt(parts[6], 10) || 1;
          const partyRaw = parts[7] || "empty";
          const isShiny = parts[8] === "1";
          const isHa = parts[9] === "1";
          const isPassive = parts[10] === "1";
          const tab = (parts[11] || "moves") as PartyViewTab;
          const moveIdx = parseInt(parts[12], 10) || 0;

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          const partyStates = parsePartyParam(partyRaw, userStarters);
          const targetMember = partyStates[currentIdx];
          if (targetMember) {
            targetMember.usePassive = !targetMember.usePassive;
          }
          const newPartyParam = serializePartyParam(partyStates);
          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, currentIdx, tab, moveIdx);
        }

        // 2-1-P2-R. Remove Party Member (interactionCreate.ts:2088)
        else if (customId.startsWith("party_remove_")) {
          const currentIdx = parseInt(parts[2], 10) || 0;
          const removeDex = parseInt(parts[3], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          const partyRaw = parts[8] || "empty";
          const isShiny = parts[9] === "1";
          const isHa = parts[10] === "1";
          const isPassive = parts[11] === "1";
          const tab = (parts[12] || "moves") as PartyViewTab;
          const moveIdx = parseInt(parts[13], 10) || 0;

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          const partyStates = parsePartyParam(partyRaw, userStarters);
          const filteredStates = partyStates.filter((p) => p.dexNumber !== removeDex);
          const newPartyParam = serializePartyParam(filteredStates);
          const nextSelectedIdx = Math.max(0, Math.min(currentIdx, filteredStates.length - 1));

          result = await renderPartyViewMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, newPartyParam, isShiny, isHa, isPassive, nextSelectedIdx, tab, moveIdx);
        }

        // 2-1-P2-B2. Back to Starter Select (interactionCreate.ts:2124)
        else if (customId.startsWith("party_back_starter_")) {
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const dexNo = parseInt(parts[5], 10) || 1;
          const slotId = parseInt(parts[6], 10) || 1;
          const partyRaw = parts[7] || "empty";
          const isShiny = parts[8] === "1";
          const isHa = parts[9] === "1";
          const isPassive = parts[10] === "1";

          const userStarters = getUserStarters(SIMULATED_USER_ID);
          const partyStates = parsePartyParam(partyRaw, userStarters);
          const partyDexList = partyStates.map((p) => p.dexNumber);

          result = await renderStarterSelectMessageData(null as any, SIMULATED_USER_ID, slotId, gen, page, dexNo, partyDexList, isShiny, isHa, isPassive);
        }

        // Fallback
        else {
          result = await renderTitleMessageData(null as any, SIMULATED_USER_ID);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(serializeDiscordMessagePayload(result)));
      } catch (err: any) {
        console.error("[VIEWER CLICK ERROR]", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`[SERVER] Port ${PORT} in use, retrying in 1000ms...`);
    setTimeout(() => {
      try { server.close(); } catch {}
      server.listen(PORT);
    }, 1000);
  } else {
    console.error("[SERVER ERROR]", err);
  }
});

server.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`  🎨 ROGUEPot Canvas UI Viewer Started!`);
  console.log(`  🔗 Open in Browser: http://localhost:${PORT}`);
  console.log(`================================================`);
});
