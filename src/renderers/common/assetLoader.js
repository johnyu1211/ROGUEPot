"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BIOME_NAMES_KO = exports.TYPE_NAMES_KO = exports.TYPE_COLORS = exports.POKEROGUE_TYPE_COLORS = void 0;
exports.getLogoImage = getLogoImage;
exports.getPbInfoAssets = getPbInfoAssets;
exports.getArenaAssets = getArenaAssets;
var canvas_1 = require("@napi-rs/canvas");
var cachedLogo = null;
function getLogoImage() {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (cachedLogo)
                        return [2 /*return*/, cachedLogo];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, canvas_1.loadImage)("https://pokerogue.net/images/logo.png")];
                case 2:
                    cachedLogo = _a.sent();
                    return [2 /*return*/, cachedLogo];
                case 3:
                    err_1 = _a.sent();
                    console.error("[CANVAS] Failed to load remote logo:", err_1);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.POKEROGUE_TYPE_COLORS = {
    normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
    grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
    ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
    rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
    steel: "#B7B7CE", fairy: "#D685AD"
};
exports.TYPE_COLORS = {
    normal: "#929DA3", fire: "#EE8130", water: "#6390F0", grass: "#7AC74C",
    electric: "#F7D02C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
    ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
    rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", steel: "#B7B7CE",
    fairy: "#D685AD", dark: "#705746",
};
exports.TYPE_NAMES_KO = {
    normal: "노말", fire: "불꽃", water: "물", grass: "풀",
    electric: "전기", ice: "얼음", fighting: "격투", poison: "독",
    ground: "땅", flying: "비행", psychic: "에스퍼", bug: "벌레",
    rock: "바위", ghost: "고스트", dragon: "드래곤", steel: "강철",
    fairy: "페어리", dark: "악",
};
exports.BIOME_NAMES_KO = {
    town: "마을", plains: "평원", grass: "풀숲", forest: "숲",
    cave: "동굴", sea: "바다", metropolis: "대도시", dojo: "도장",
    volcano: "화산", mountain: "산", jungle: "정글", swamp: "늪지대",
    desert: "사막", "snowy forest": "설원", "power plant": "발전소",
    graveyard: "묘지", space: "우주", abyss: "심연",
};
var cachedPbInfo = null;
function getPbInfoAssets() {
    return __awaiter(this, void 0, void 0, function () {
        var base, imgBase, _a, playerBox, enemyBox, bossBox, hpLabel, categories, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (cachedPbInfo)
                        return [2 /*return*/, cachedPbInfo];
                    base = "https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/beta/images/ui";
                    imgBase = "https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/beta/images";
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all([
                            (0, canvas_1.loadImage)("".concat(base, "/pbinfo_player.png")).catch(function () { return null; }),
                            (0, canvas_1.loadImage)("".concat(base, "/pbinfo_enemy_mini.png")).catch(function () { return null; }),
                            (0, canvas_1.loadImage)("".concat(base, "/pbinfo_enemy_boss.png")).catch(function () { return null; }),
                            (0, canvas_1.loadImage)("".concat(base, "/text_images/en/battle_ui/overlay_hp_label.png")).catch(function () { return null; }),
                            (0, canvas_1.loadImage)("".concat(imgBase, "/categories.png")).catch(function () { return null; }),
                        ])];
                case 2:
                    _a = _c.sent(), playerBox = _a[0], enemyBox = _a[1], bossBox = _a[2], hpLabel = _a[3], categories = _a[4];
                    cachedPbInfo = { playerBox: playerBox, enemyBox: enemyBox, bossBox: bossBox, hpLabel: hpLabel, categories: categories };
                    return [2 /*return*/, cachedPbInfo];
                case 3:
                    _b = _c.sent();
                    return [2 /*return*/, { playerBox: null, enemyBox: null, bossBox: null, hpLabel: null, categories: null }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
var arenaCache = new Map();
function getArenaAssets(biomeName) {
    return __awaiter(this, void 0, void 0, function () {
        var clean, baseUrl, _a, bg, a, b, result, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    clean = (biomeName || "Town").toLowerCase().trim()
                        .replace(/\s+/g, "_")
                        .replace(/[^a-z0-9_]/g, "");
                    if (clean === "grass")
                        clean = "grass";
                    if (clean === "plains")
                        clean = "plains";
                    if (clean === "sea" || clean === "ocean")
                        clean = "sea";
                    if (clean === "fairycave" || clean === "fairy_cave")
                        clean = "fairy_cave";
                    if (clean === "icecave" || clean === "ice_cave")
                        clean = "ice_cave";
                    if (clean === "powerplant" || clean === "power_plant")
                        clean = "power_plant";
                    if (clean === "snowyforest" || clean === "snowy_forest")
                        clean = "snowy_forest";
                    if (clean === "rocky_coast" || clean === "rockycoast")
                        clean = "rockycoast";
                    if (clean === "tallgrass" || clean === "tall_grass")
                        clean = "tall_grass";
                    if (clean === "constructionsite" || clean === "construction_site")
                        clean = "construction_site";
                    if (arenaCache.has(clean)) {
                        return [2 /*return*/, arenaCache.get(clean)];
                    }
                    baseUrl = "https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/beta/images/arenas";
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all([
                            (0, canvas_1.loadImage)("".concat(baseUrl, "/").concat(clean, "_bg.png")).catch(function () { return (0, canvas_1.loadImage)("".concat(baseUrl, "/town_bg.png")).catch(function () { return null; }); }),
                            (0, canvas_1.loadImage)("".concat(baseUrl, "/").concat(clean, "_a.png")).catch(function () { return (0, canvas_1.loadImage)("".concat(baseUrl, "/town_a.png")).catch(function () { return null; }); }),
                            (0, canvas_1.loadImage)("".concat(baseUrl, "/").concat(clean, "_b.png")).catch(function () { return (0, canvas_1.loadImage)("".concat(baseUrl, "/town_b.png")).catch(function () { return null; }); }),
                        ])];
                case 2:
                    _a = _b.sent(), bg = _a[0], a = _a[1], b = _a[2];
                    result = { bg: bg, a: a, b: b };
                    arenaCache.set(clean, result);
                    return [2 /*return*/, result];
                case 3:
                    err_2 = _b.sent();
                    console.error("[CANVAS] Failed to load arena assets for ".concat(biomeName, ":"), err_2);
                    return [2 /*return*/, { bg: null, a: null, b: null }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
