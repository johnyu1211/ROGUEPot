import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  renderTitleMessageData,
  renderSlotsScreenData,
  renderBagMessageData,
  renderMultiplayerMessageData,
  renderGenSelectMessageData,
  renderStarterSelectMessageData,
  renderPartyViewMessageData,
} from "../src/events/interactionCreate.js";
import { saveService } from "../src/services/saveService.js";
import { db } from "../src/services/db.js";
import { PartyViewTab } from "../src/utils/canvasRenderer.js";

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

  // Also support embed if returned
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

  // 3. Initial State Endpoint (Defaults directly to TITLE SCREEN - The true initial landing page!)
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
          1, // gen
          1, // page
          1, // selectedDexNo
          "393:0:0:0-1:2:0:1", // partyParam
          false,
          false,
          false
        );
      } else if (screen === "party") {
        result = await renderPartyViewMessageData(
          null as any,
          SIMULATED_USER_ID,
          1,
          1,
          1,
          1,
          "393:0:0:0-1:2:0:1",
          false,
          false,
          false,
          1,
          "moves",
          0
        );
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

  // 4. Click Interaction Dispatcher (Full Discord event handling)
  if (req.method === "POST" && req.url === "/api/click") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { customId } = JSON.parse(body || "{}");
        if (!customId) throw new Error("Missing customId");

        console.log(`[VIEWER INTERACTION] Clicked customId: ${customId}`);

        let result: any;

        // TITLE & MENU INTERACTIONS
        if (customId.startsWith("menu_newgame_") || customId.startsWith("menu_loadgame_")) {
          result = renderSlotsScreenData(SIMULATED_USER_ID);
        } else if (customId.startsWith("slot_select_")) {
          // slot_select_${slotId}_${userId}
          const parts = customId.split("_");
          const slotId = parseInt(parts[2], 10) || 1;
          result = await renderStarterSelectMessageData(
            null as any,
            SIMULATED_USER_ID,
            slotId,
            1, // gen 1
            1, // page 1
            1, // Bulbasaur
            "393:0:0:0-1:2:0:1", // initial party
            false,
            false,
            false
          );
        } else if (customId.startsWith("menu_back_to_title_") || customId.startsWith("starter_back_title_")) {
          result = await renderTitleMessageData(null as any, SIMULATED_USER_ID);
        } else if (customId.startsWith("menu_inventory_") || customId.startsWith("bag_tab_")) {
          const tab = customId.includes("pokedex") ? "pokedex" : (customId.includes("records") ? "records" : "pokemon");
          result = await renderBagMessageData(null as any, SIMULATED_USER_ID, tab);
        } else if (customId.startsWith("menu_multiplay_")) {
          result = await renderMultiplayerMessageData(null as any, SIMULATED_USER_ID);
        }

        // GENERATION SELECTOR
        else if (customId.startsWith("starter_genmenu_")) {
          // starter_genmenu_${gen}_${slotId}_${partyParam}_${flagsParam}_${userId}
          const parts = customId.split("_");
          const gen = parseInt(parts[2], 10) || 1;
          const slotId = parseInt(parts[3], 10) || 1;
          const partyParam = parts[4] || "empty";
          const flagsParam = parts[5] || "0_0_0";
          result = await renderGenSelectMessageData(null as any, SIMULATED_USER_ID, gen, slotId, partyParam, flagsParam);
        } else if (customId.startsWith("starter_pickgen_") || customId.startsWith("starter_genback_")) {
          // starter_pickgen_${targetGen}_${currentGen}_${slotId}_${partyParam}_${flagsParam}_${userId}
          const parts = customId.split("_");
          const targetGen = parseInt(parts[2], 10) || 1;
          const slotId = parseInt(parts[4], 10) || 1;
          const partyParam = parts[5] || "empty";
          const flags = (parts[6] || "0_0_0").split("_").map((v: string) => v === "1");
          result = await renderStarterSelectMessageData(
            null as any,
            SIMULATED_USER_ID,
            slotId,
            targetGen,
            1, // page 1
            1,
            partyParam,
            flags[0],
            flags[1],
            flags[2]
          );
        }

        // PARTY BUILDER INTERACTIONS
        else if (customId.startsWith("party_pick_")) {
          const parts = customId.split("_");
          const idx = parseInt(parts[2], 10);
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const dexNo = parseInt(parts[5], 10) || 1;
          const slotId = parseInt(parts[6], 10) || 1;
          const partyParam = parts[7] || "empty";
          const flags = (parts[8] || "0_0_0").split("_").map((v: string) => v === "1");
          const tab = (parts[9] as PartyViewTab) || "moves";
          const moveIdx = parseInt(parts[10], 10) || 0;

          result = await renderPartyViewMessageData(
            null as any,
            SIMULATED_USER_ID,
            slotId,
            gen,
            page,
            dexNo,
            partyParam,
            flags[0],
            flags[1],
            flags[2],
            idx,
            tab,
            moveIdx
          );
        } else if (customId.startsWith("party_tab_")) {
          const parts = customId.split("_");
          const tab = parts[2] as PartyViewTab;
          const partyIdx = parseInt(parts[3], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          const partyParam = parts[8] || "empty";
          const flags = (parts[9] || "0_0_0").split("_").map((v: string) => v === "1");
          const moveIdx = parseInt(parts[10], 10) || 0;

          result = await renderPartyViewMessageData(
            null as any,
            SIMULATED_USER_ID,
            slotId,
            gen,
            page,
            dexNo,
            partyParam,
            flags[0],
            flags[1],
            flags[2],
            partyIdx,
            tab,
            moveIdx
          );
        } else if (customId.startsWith("party_pickmove_")) {
          const parts = customId.split("_");
          const mIdx = parseInt(parts[2], 10);
          const partyIdx = parseInt(parts[3], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          const partyParam = parts[8] || "empty";
          const flags = (parts[9] || "0_0_0").split("_").map((v: string) => v === "1");
          const tab = (parts[10] as PartyViewTab) || "moves";

          result = await renderPartyViewMessageData(
            null as any,
            SIMULATED_USER_ID,
            slotId,
            gen,
            page,
            dexNo,
            partyParam,
            flags[0],
            flags[1],
            flags[2],
            partyIdx,
            tab,
            mIdx
          );
        } else if (customId.startsWith("party_setha_")) {
          const parts = customId.split("_");
          const haVal = parts[2] === "1";
          const partyIdx = parseInt(parts[3], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          let partyParam = parts[8] || "empty";
          const flags = (parts[9] || "0_0_0").split("_").map((v: string) => v === "1");
          const tab = (parts[10] as PartyViewTab) || "moves";
          const moveIdx = parseInt(parts[11], 10) || 0;

          if (partyParam !== "empty") {
            const list = partyParam.split("-");
            if (list[partyIdx]) {
              const [d, s, , p] = list[partyIdx].split(":");
              list[partyIdx] = `${d}:${s}:${haVal ? 1 : 0}:${p}`;
              partyParam = list.join("-");
            }
          }

          result = await renderPartyViewMessageData(
            null as any,
            SIMULATED_USER_ID,
            slotId,
            gen,
            page,
            dexNo,
            partyParam,
            flags[0],
            flags[1],
            flags[2],
            partyIdx,
            tab,
            moveIdx
          );
        } else if (customId.startsWith("party_togglepass_")) {
          const parts = customId.split("_");
          const partyIdx = parseInt(parts[2], 10) || 0;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const dexNo = parseInt(parts[5], 10) || 1;
          const slotId = parseInt(parts[6], 10) || 1;
          let partyParam = parts[7] || "empty";
          const flags = (parts[8] || "0_0_0").split("_").map((v: string) => v === "1");
          const tab = (parts[9] as PartyViewTab) || "moves";
          const moveIdx = parseInt(parts[10], 10) || 0;

          if (partyParam !== "empty") {
            const list = partyParam.split("-");
            if (list[partyIdx]) {
              const [d, s, ha, p] = list[partyIdx].split(":");
              const newPass = p === "1" ? "0" : "1";
              list[partyIdx] = `${d}:${s}:${ha}:${newPass}`;
              partyParam = list.join("-");
            }
          }

          result = await renderPartyViewMessageData(
            null as any,
            SIMULATED_USER_ID,
            slotId,
            gen,
            page,
            dexNo,
            partyParam,
            flags[0],
            flags[1],
            flags[2],
            partyIdx,
            tab,
            moveIdx
          );
        } else if (customId.startsWith("party_remove_")) {
          const parts = customId.split("_");
          const partyIdx = parseInt(parts[2], 10) || 0;
          const gen = parseInt(parts[4], 10) || 0;
          const page = parseInt(parts[5], 10) || 1;
          const dexNo = parseInt(parts[6], 10) || 1;
          const slotId = parseInt(parts[7], 10) || 1;
          let partyParam = parts[8] || "empty";
          const flags = (parts[9] || "0_0_0").split("_").map((v: string) => v === "1");
          const tab = (parts[10] as PartyViewTab) || "moves";
          const moveIdx = parseInt(parts[11], 10) || 0;

          if (partyParam !== "empty") {
            const list = partyParam.split("-");
            list.splice(partyIdx, 1);
            partyParam = list.length > 0 ? list.join("-") : "empty";
          }

          const newPartyIdx = partyParam === "empty" ? -1 : Math.max(0, partyIdx - 1);

          result = await renderPartyViewMessageData(
            null as any,
            SIMULATED_USER_ID,
            slotId,
            gen,
            page,
            dexNo,
            partyParam,
            flags[0],
            flags[1],
            flags[2],
            newPartyIdx,
            tab,
            moveIdx
          );
        } else if (customId.startsWith("party_back_starter_")) {
          const parts = customId.split("_");
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const dexNo = parseInt(parts[5], 10) || 1;
          const slotId = parseInt(parts[6], 10) || 1;
          const partyParam = parts[7] || "empty";
          const flags = (parts[8] || "0_0_0").split("_").map((v: string) => v === "1");

          result = await renderStarterSelectMessageData(
            null as any,
            SIMULATED_USER_ID,
            slotId,
            gen,
            page,
            dexNo,
            partyParam,
            flags[0],
            flags[1],
            flags[2]
          );
        } else if (customId.startsWith("starter_openparty_")) {
          const parts = customId.split("_");
          const dexNo = parseInt(parts[2], 10) || 1;
          const gen = parseInt(parts[3], 10) || 0;
          const page = parseInt(parts[4], 10) || 1;
          const slotId = parseInt(parts[5], 10) || 1;
          const partyParam = parts[6] || "empty";
          const flags = (parts[7] || "0_0_0").split("_").map((v: string) => v === "1");

          result = await renderPartyViewMessageData(
            null as any,
            SIMULATED_USER_ID,
            slotId,
            gen,
            page,
            dexNo,
            partyParam,
            flags[0],
            flags[1],
            flags[2],
            0,
            "moves",
            0
          );
        }

        // STARTER SELECT GENERAL INTERACTIONS
        else if (
          customId.startsWith("starter_slot_") ||
          customId.startsWith("starter_toggleshiny_") ||
          customId.startsWith("starter_togglepass_") ||
          customId.startsWith("starter_toggleha_") ||
          customId.startsWith("starter_page_") ||
          customId.startsWith("starter_add_")
        ) {
          const parts = customId.split("_");
          let gen = 1, page = 1, dexNo = 1, slotId = 1, partyParam = "empty", isShiny = false, isHa = false, isPass = false;

          if (customId.startsWith("starter_slot_")) {
            dexNo = parseInt(parts[2], 10) || 1;
            gen = parseInt(parts[3], 10) || 1;
            page = parseInt(parts[4], 10) || 1;
            slotId = parseInt(parts[5], 10) || 1;
            partyParam = parts[6] || "empty";
            const flags = (parts[7] || "0_0_0").split("_").map((v: string) => v === "1");
            isShiny = flags[0]; isHa = flags[1]; isPass = flags[2];
          } else if (customId.startsWith("starter_add_")) {
            dexNo = parseInt(parts[2], 10) || 1;
            gen = parseInt(parts[3], 10) || 1;
            page = parseInt(parts[4], 10) || 1;
            slotId = parseInt(parts[5], 10) || 1;
            partyParam = parts[6] || "empty";
            const flags = (parts[7] || "0_0_0").split("_").map((v: string) => v === "1");
            isShiny = flags[0]; isHa = flags[1]; isPass = flags[2];

            if (partyParam === "empty") partyParam = `${dexNo}:0:0:0`;
            else partyParam += `-${dexNo}:0:0:0`;
          } else if (customId.startsWith("starter_toggleshiny_")) {
            gen = parseInt(parts[2], 10) || 1;
            page = parseInt(parts[3], 10) || 1;
            dexNo = parseInt(parts[4], 10) || 1;
            slotId = parseInt(parts[5], 10) || 1;
            partyParam = parts[6] || "empty";
            const flags = (parts[7] || "0_0_0").split("_").map((v: string) => v === "1");
            isShiny = !flags[0]; isHa = flags[1]; isPass = flags[2];
          } else if (customId.startsWith("starter_togglepass_")) {
            gen = parseInt(parts[2], 10) || 1;
            page = parseInt(parts[3], 10) || 1;
            dexNo = parseInt(parts[4], 10) || 1;
            slotId = parseInt(parts[5], 10) || 1;
            partyParam = parts[6] || "empty";
            const flags = (parts[7] || "0_0_0").split("_").map((v: string) => v === "1");
            isShiny = flags[0]; isHa = flags[1]; isPass = !flags[2];
          } else if (customId.startsWith("starter_toggleha_")) {
            gen = parseInt(parts[2], 10) || 1;
            page = parseInt(parts[3], 10) || 1;
            dexNo = parseInt(parts[4], 10) || 1;
            slotId = parseInt(parts[5], 10) || 1;
            partyParam = parts[6] || "empty";
            const flags = (parts[7] || "0_0_0").split("_").map((v: string) => v === "1");
            isShiny = flags[0]; isHa = !flags[1]; isPass = flags[2];
          } else if (customId.startsWith("starter_page_")) {
            const isNext = parts[2] === "next";
            gen = parseInt(parts[3], 10) || 1;
            page = (parseInt(parts[4], 10) || 1) + (isNext ? 1 : -1);
            dexNo = parseInt(parts[5], 10) || 1;
            slotId = parseInt(parts[6], 10) || 1;
            partyParam = parts[7] || "empty";
            const flags = (parts[8] || "0_0_0").split("_").map((v: string) => v === "1");
            isShiny = flags[0]; isHa = flags[1]; isPass = flags[2];
          }

          result = await renderStarterSelectMessageData(
            null as any,
            SIMULATED_USER_ID,
            slotId,
            gen,
            page,
            dexNo,
            partyParam,
            isShiny,
            isHa,
            isPass
          );
        } else {
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
  console.log(`  🎮 ROGUEPot Canvas UI Viewer Started!`);
  console.log(`  🔗 Open in Browser: http://localhost:${PORT}`);
  console.log(`================================================`);
});
