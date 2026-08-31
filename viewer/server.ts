import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  renderStarterSelectScreen,
  renderTitleScreen,
  renderPokedexScreen,
  renderBagScreen,
  renderMultiplayerScreen,
  renderEggGachaScreen,
  renderGenSelectScreen,
  PartyViewTab,
} from "../src/utils/canvasRenderer.js";
import { STARTER_DATABASE, getStartersByGen, getStarterByDexNumber } from "../src/data/starterCosts.js";
import { MOVES_DATA } from "../src/data/movesKo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3456;

// SSE Clients for Live Reload
const sseClients: http.ServerResponse[] = [];

// Watch canvasRenderer.ts for changes and trigger live reload
const rendererPath = path.resolve(__dirname, "../src/utils/canvasRenderer.ts");
if (fs.existsSync(rendererPath)) {
  fs.watch(rendererPath, () => {
    console.log("[VIEWER] canvasRenderer.ts changed, triggering hot reload...");
    sseClients.forEach((client) => {
      client.write("data: reload\n\n");
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Live Reload SSE Endpoint
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

  // 2. Serve Viewer HTML
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const htmlPath = path.join(__dirname, "index.html");
    fs.readFile(htmlPath, "utf-8", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Failed to load viewer HTML: " + err.message);
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  // 3. Render API Endpoint
  if (req.method === "POST" && req.url === "/api/render") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const screen = payload.screen || "starter_party";

        let buffer: Buffer | null = null;

        // Realistic PokeRogue Starter DB integration
        const sampleStarters = getStartersByGen(payload.currentGen || 1);
        const selectedParty = payload.party || [];
        const activePartyIdx = payload.selectedPartyIdx ?? 1;
        const activeMember = selectedParty[activePartyIdx];
        const inspectedStarter = activeMember ? getStarterByDexNumber(activeMember.dexNumber) || sampleStarters[0] : sampleStarters[0];

        const mockUserStarters = new Map<string, any>();
        mockUserStarters.set("bulbasaur", {
          speciesId: "bulbasaur",
          isUnlocked: true,
          shinyTier: 2,
          hasHiddenAbility: true,
          passiveUnlocked: true,
          candies: payload.userCandies ?? 50,
        });
        mockUserStarters.set("piplup", {
          speciesId: "piplup",
          isUnlocked: true,
          shinyTier: 0,
          hasHiddenAbility: false,
          passiveUnlocked: false,
          candies: 12,
        });

        if (screen === "starter_party") {
          buffer = await renderStarterSelectScreen({
            selectedStarter: inspectedStarter,
            currentGen: payload.currentGen || 1,
            currentPage: payload.currentPage || 1,
            totalPages: payload.totalPages || 4,
            startersList: sampleStarters.slice(0, 12),
            selectedParty,
            userStarters: mockUserStarters,
            isShinyFilter: payload.isShinyFilter,
            isHaFilter: payload.isHaFilter,
            isPassiveFilter: payload.isPassiveFilter,
            maxCost: 10,
            lang: "ko",
            isPartyView: true,
            selectedPartyIdx: activePartyIdx,
            partyTab: (payload.partyTab as PartyViewTab) || "moves",
            selectedMoveIdx: payload.selectedMoveIdx ?? 0,
          });
        } else if (screen === "starter_select") {
          buffer = await renderStarterSelectScreen({
            selectedStarter: inspectedStarter,
            currentGen: payload.currentGen || 1,
            currentPage: payload.currentPage || 1,
            totalPages: payload.totalPages || 4,
            startersList: sampleStarters.slice(0, 12),
            selectedParty,
            userStarters: mockUserStarters,
            isShinyFilter: payload.isShinyFilter,
            isHaFilter: payload.isHaFilter,
            isPassiveFilter: payload.isPassiveFilter,
            maxCost: 10,
            lang: "ko",
            isPartyView: false,
          });
        } else if (screen === "title") {
          buffer = await renderTitleScreen({
            username: "Player1",
            hasSavedSlots: true,
            party: [
              { speciesId: "piplup", name: "팽도리", level: 15 },
              { speciesId: "bulbasaur", name: "이상해씨", level: 20 },
            ],
            lang: "ko",
          });
        } else if (screen === "pokedex") {
          buffer = await renderPokedexScreen({
            selectedPokemon: {
              dexNumber: 1,
              speciesId: "bulbasaur",
              name: "Bulbasaur",
              koreanName: "이상해씨",
              types: ["grass", "poison"],
              hp: 45,
              attack: 49,
              defense: 49,
              spAttack: 65,
              spDefense: 65,
              speed: 45,
            },
            pageList: [
              { dexNumber: 1, speciesId: "bulbasaur", name: "Bulbasaur", koreanName: "이상해씨", types: ["grass", "poison"], hp: 45, attack: 49, defense: 49, spAttack: 65, spDefense: 65, speed: 45 },
              { dexNumber: 2, speciesId: "ivysaur", name: "Ivysaur", koreanName: "이상해풀", types: ["grass", "poison"], hp: 60, attack: 62, defense: 63, spAttack: 80, spDefense: 80, speed: 60 },
              { dexNumber: 3, speciesId: "venusaur", name: "Venusaur", koreanName: "이상해꽃", types: ["grass", "poison"], hp: 80, attack: 82, defense: 83, spAttack: 100, spDefense: 100, speed: 80 },
              { dexNumber: 4, speciesId: "charmander", name: "Charmander", koreanName: "파이리", types: ["fire"], hp: 39, attack: 52, defense: 43, spAttack: 60, spDefense: 50, speed: 65 },
            ],
            currentPage: 1,
            totalPages: 129,
            lang: "ko",
          });
        } else if (screen === "bag") {
          buffer = await renderBagScreen({
            username: "Player1",
            tab: "pokemon",
            party: [
              { speciesId: "piplup", name: "팽도리", level: 15 },
              { speciesId: "bulbasaur", name: "이상해씨", level: 20 },
            ],
            stats: { totalRuns: 12, highestWave: 145 },
            lang: "ko",
          });
        } else if (screen === "multiplayer") {
          buffer = await renderMultiplayerScreen({
            username: "Player1",
            party: [
              { speciesId: "piplup", name: "팽도리", level: 15 },
              { speciesId: "bulbasaur", name: "이상해씨", level: 20 },
            ],
            lang: "ko",
          });
        } else if (screen === "gacha") {
          buffer = await renderEggGachaScreen({
            bannerType: "move",
            eggsList: [
              { id: "e1", tier: "legendary", stepsRequired: 50, stepsProgress: 35 },
              { id: "e2", tier: "epic", stepsRequired: 25, stepsProgress: 20 },
              { id: "e3", tier: "rare", stepsRequired: 10, stepsProgress: 8 },
            ],
            vouchers: { common: 10, plus: 2, premium: 1 },
            lang: "ko",
          });
        } else if (screen === "gen_select") {
          buffer = await renderGenSelectScreen({
            currentGen: 1,
            lang: "ko",
          });
        }

        if (buffer) {
          const base64 = buffer.toString("base64");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ image: `data:image/png;base64,${base64}` }));
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unknown screen type" }));
        }
      } catch (err: any) {
        console.error("[VIEWER ERROR]", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err?.message || "Render failed" }));
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
