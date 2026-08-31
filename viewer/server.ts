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
const rendererPath = path.resolve(__dirname, "../src/utils/canvasRenderer.ts");
const interactionPath = path.resolve(__dirname, "../src/events/interactionCreate.ts");

[rendererPath, interactionPath].forEach((file) => {
  if (fs.existsSync(file)) {
    fs.watch(file, () => {
      console.log(`[VIEWER] ${path.basename(file)} changed, triggering live reload...`);
      sseClients.forEach((client) => client.write("data: reload\n\n"));
    });
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
          const moveIdx = 0; // Always reset to 1st move (slot 0) on switching party member!

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

server.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`  🎨 ROGUEPot Canvas UI Viewer Started!`);
  console.log(`  🔗 Open in Browser: http://localhost:${PORT}`);
  console.log(`================================================`);
});
