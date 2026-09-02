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
exports.getPokemonSprite = getPokemonSprite;
exports.isSpriteCached = isSpriteCached;
exports.drawFittedBattleSprite = drawFittedBattleSprite;
exports.drawPokemonSilhouetteShadow = drawPokemonSilhouetteShadow;
exports.drawPokemonShadow = drawPokemonShadow;
var canvas_1 = require("@napi-rs/canvas");
var pokemonStats_js_1 = require("../../data/pokemonStats.js");
var starterCosts_js_1 = require("../../data/starterCosts.js");
var spriteCache = new Map();
/**
 * Helper to fetch a static pixel sprite from Showdown CDN / PokeRogue CDN with in-memory caching
 */
function getPokemonSprite(pokemonName_1) {
    return __awaiter(this, arguments, void 0, function (pokemonName, allowFetch, isShiny, isBack) {
        var clean_1, tier, cacheKey, isTestSubject, lookupKey, dexNo, spec, matchStarter, img, suffix, rogueUrl, _a, _b, folder, candidateKeys, _i, candidateKeys_1, k, _c, firstKey, err_1;
        if (allowFetch === void 0) { allowFetch = true; }
        if (isShiny === void 0) { isShiny = false; }
        if (isBack === void 0) { isBack = false; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 20, , 21]);
                    clean_1 = pokemonName.toLowerCase().trim();
                    if (clean_1 === "nidoran-f" || clean_1 === "nidoran_f" || clean_1 === "nidoran♀")
                        clean_1 = "nidoranf";
                    else if (clean_1 === "nidoran-m" || clean_1 === "nidoran_m" || clean_1 === "nidoran♂")
                        clean_1 = "nidoranm";
                    else if (clean_1 === "mr-mime" || clean_1 === "mr.-mime" || clean_1 === "mr mime")
                        clean_1 = "mrmime";
                    else if (clean_1 === "mime-jr" || clean_1 === "mime-jr." || clean_1 === "mime jr")
                        clean_1 = "mimejr";
                    else if (clean_1 === "mr-rime" || clean_1 === "mr.-rime" || clean_1 === "mr rime")
                        clean_1 = "mrrime";
                    else if (clean_1 === "ho-oh")
                        clean_1 = "hooh";
                    else if (clean_1 === "porygon-z")
                        clean_1 = "porygonz";
                    else if (clean_1 === "jangmo-o")
                        clean_1 = "jangmoo";
                    else if (clean_1 === "hakamo-o")
                        clean_1 = "hakamoo";
                    else if (clean_1 === "kommo-o")
                        clean_1 = "kommoo";
                    else if (clean_1 === "type-null" || clean_1 === "type: null")
                        clean_1 = "typenull";
                    else if (clean_1.startsWith("tapu-"))
                        clean_1 = clean_1.replace("tapu-", "tapu");
                    else if (clean_1.startsWith("tapu "))
                        clean_1 = clean_1.replace("tapu ", "tapu");
                    else if (clean_1 === "wo-chien")
                        clean_1 = "wochien";
                    else if (clean_1 === "chien-pao")
                        clean_1 = "chienpao";
                    else if (clean_1 === "ting-lu")
                        clean_1 = "tinglu";
                    else if (clean_1 === "chi-yu")
                        clean_1 = "chiyu";
                    else if (clean_1.startsWith("aegislash"))
                        clean_1 = "aegislash";
                    else if (clean_1.startsWith("meowstic"))
                        clean_1 = "meowstic";
                    else if (clean_1.startsWith("pumpkaboo"))
                        clean_1 = "pumpkaboo";
                    else if (clean_1.startsWith("gourgeist"))
                        clean_1 = "gourgeist";
                    else if (clean_1.startsWith("zygarde"))
                        clean_1 = "zygarde";
                    else if (clean_1.startsWith("oricorio"))
                        clean_1 = "oricorio";
                    else if (clean_1.startsWith("lycanroc"))
                        clean_1 = "lycanroc";
                    else if (clean_1.startsWith("wishiwashi"))
                        clean_1 = "wishiwashi";
                    else if (clean_1.startsWith("minior"))
                        clean_1 = "minior";
                    else if (clean_1.startsWith("mimikyu"))
                        clean_1 = "mimikyu";
                    else if (clean_1.startsWith("toxtricity"))
                        clean_1 = "toxtricity";
                    else if (clean_1.startsWith("eiscue"))
                        clean_1 = "eiscue";
                    else if (clean_1.startsWith("indeedee"))
                        clean_1 = "indeedee";
                    else if (clean_1.startsWith("morpeko"))
                        clean_1 = "morpeko";
                    else if (clean_1.startsWith("urshifu"))
                        clean_1 = "urshifu";
                    else if (clean_1.startsWith("basculegion"))
                        clean_1 = "basculegion";
                    else if (clean_1.startsWith("enamorus"))
                        clean_1 = "enamorus";
                    else if (clean_1.startsWith("ogerpon"))
                        clean_1 = "ogerpon";
                    else if (clean_1.startsWith("terapagos"))
                        clean_1 = "terapagos";
                    else if (clean_1.startsWith("tatsugiri"))
                        clean_1 = "tatsugiri";
                    else if (clean_1.startsWith("squawkabilly"))
                        clean_1 = "squawkabilly";
                    else if (clean_1.startsWith("dudunsparce"))
                        clean_1 = "dudunsparce";
                    else if (clean_1.startsWith("palafin"))
                        clean_1 = "palafin";
                    else if (clean_1.startsWith("maushold"))
                        clean_1 = "maushold";
                    else if (clean_1.startsWith("necrozma"))
                        clean_1 = "necrozma";
                    else if (clean_1.startsWith("calyrex"))
                        clean_1 = "calyrex";
                    else if (clean_1.startsWith("rotom")) {
                        if (clean_1 === "rotom-heat")
                            clean_1 = "rotom-heat";
                        else if (clean_1 === "rotom-wash")
                            clean_1 = "rotom-wash";
                        else if (clean_1 === "rotom-frost")
                            clean_1 = "rotom-frost";
                        else if (clean_1 === "rotom-fan")
                            clean_1 = "rotom-fan";
                        else if (clean_1 === "rotom-mow")
                            clean_1 = "rotom-mow";
                        else
                            clean_1 = "rotom";
                    }
                    tier = typeof isShiny === "number" ? isShiny : (isShiny ? 1 : 0);
                    cacheKey = "".concat(clean_1, "_").concat(tier, "_").concat(isBack ? "b" : "f");
                    if (spriteCache.has(cacheKey)) {
                        return [2 /*return*/, spriteCache.get(cacheKey)];
                    }
                    if (!allowFetch)
                        return [2 /*return*/, null];
                    isTestSubject = clean_1.startsWith("testsubject");
                    lookupKey = isTestSubject ? "ditto" : clean_1;
                    dexNo = null;
                    if (!isTestSubject) {
                        if (/^\d+$/.test(clean_1)) {
                            dexNo = parseInt(clean_1, 10);
                        }
                        else {
                            spec = pokemonStats_js_1.POKEMON_SPECIES_DATA[clean_1] || pokemonStats_js_1.POKEMON_SPECIES_DATA[clean_1.replace(/-/g, "")];
                            if (spec && spec.num > 0) {
                                dexNo = spec.num;
                            }
                            else {
                                matchStarter = starterCosts_js_1.STARTER_DATABASE.find(function (s) { return s.speciesId === clean_1; });
                                if (matchStarter && matchStarter.dexNumber > 0)
                                    dexNo = matchStarter.dexNumber;
                            }
                        }
                    }
                    img = null;
                    if (!(dexNo && !clean_1.includes("gmax") && !clean_1.includes("mega"))) return [3 /*break*/, 8];
                    suffix = isBack ? "b" : "";
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 8]);
                    rogueUrl = "https://raw.githubusercontent.com/Sandstormer/PokeRogue-Dex/main/images/".concat(dexNo, "_").concat(tier).concat(suffix, ".png");
                    return [4 /*yield*/, (0, canvas_1.loadImage)(rogueUrl)];
                case 2:
                    img = _d.sent();
                    return [3 /*break*/, 8];
                case 3:
                    _a = _d.sent();
                    if (!(tier > 0)) return [3 /*break*/, 7];
                    _d.label = 4;
                case 4:
                    _d.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, (0, canvas_1.loadImage)("https://raw.githubusercontent.com/Sandstormer/PokeRogue-Dex/main/images/".concat(dexNo, "_1").concat(suffix, ".png"))];
                case 5:
                    img = _d.sent();
                    if (img && tier >= 2 && !isTestSubject) {
                        img = applyShinyTierVariant(img, tier);
                    }
                    return [3 /*break*/, 7];
                case 6:
                    _b = _d.sent();
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 8];
                case 8:
                    if (!!img) return [3 /*break*/, 19];
                    folder = isBack
                        ? (tier > 0 && !isTestSubject ? "gen5-back-shiny" : "gen5-back")
                        : (tier > 0 && !isTestSubject ? "gen5-shiny" : "gen5");
                    candidateKeys = [
                        lookupKey,
                        lookupKey.replace(/gmax/g, "-gmax").replace(/mega/g, "-mega"),
                        lookupKey.replace(/-/g, "")
                    ];
                    _i = 0, candidateKeys_1 = candidateKeys;
                    _d.label = 9;
                case 9:
                    if (!(_i < candidateKeys_1.length)) return [3 /*break*/, 18];
                    k = candidateKeys_1[_i];
                    if (img)
                        return [3 /*break*/, 18];
                    _d.label = 10;
                case 10:
                    _d.trys.push([10, 12, , 17]);
                    return [4 /*yield*/, (0, canvas_1.loadImage)("https://play.pokemonshowdown.com/sprites/".concat(folder, "/").concat(k, ".png"))];
                case 11:
                    img = _d.sent();
                    return [3 /*break*/, 17];
                case 12:
                    _c = _d.sent();
                    if (!isBack) return [3 /*break*/, 14];
                    return [4 /*yield*/, (0, canvas_1.loadImage)("https://play.pokemonshowdown.com/sprites/".concat(tier > 0 && !isTestSubject ? "gen5-shiny" : "gen5", "/").concat(k, ".png")).catch(function () { return null; })];
                case 13:
                    img = _d.sent();
                    return [3 /*break*/, 16];
                case 14:
                    if (!(tier > 0 && !isTestSubject)) return [3 /*break*/, 16];
                    return [4 /*yield*/, (0, canvas_1.loadImage)("https://play.pokemonshowdown.com/sprites/gen5/".concat(k, ".png")).catch(function () { return null; })];
                case 15:
                    img = _d.sent();
                    _d.label = 16;
                case 16: return [3 /*break*/, 17];
                case 17:
                    _i++;
                    return [3 /*break*/, 9];
                case 18:
                    if (img) {
                        if (isTestSubject) {
                            img = applyWhiteDittoVariant(img, tier);
                        }
                        else if (tier >= 2) {
                            img = applyShinyTierVariant(img, tier);
                        }
                    }
                    _d.label = 19;
                case 19:
                    if (img) {
                        if (spriteCache.size >= 300) {
                            firstKey = spriteCache.keys().next().value;
                            if (firstKey)
                                spriteCache.delete(firstKey);
                        }
                        spriteCache.set(cacheKey, img);
                        return [2 /*return*/, img];
                    }
                    return [2 /*return*/, null];
                case 20:
                    err_1 = _d.sent();
                    console.error("[CANVAS] Failed to load sprite for ".concat(pokemonName, ":"), err_1);
                    return [2 /*return*/, null];
                case 21: return [2 /*return*/];
            }
        });
    });
}
function applyWhiteDittoVariant(img, tier) {
    if (tier === void 0) { tier = 0; }
    try {
        var canvas = (0, canvas_1.createCanvas)(img.width, img.height);
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var imgData = ctx.getImageData(0, 0, img.width, img.height);
        var data = imgData.data;
        for (var i = 0; i < data.length; i += 4) {
            var a = data[i + 3];
            if (a < 10)
                continue;
            var r = data[i];
            var g = data[i + 1];
            var b = data[i + 2];
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum < 60) {
                data[i] = Math.round(r * 0.35);
                data[i + 1] = Math.round(g * 0.35);
                data[i + 2] = Math.round(b * 0.35);
            }
            else {
                var norm = Math.max(0, Math.min(1, (lum - 60) / (255 - 60)));
                var whiteLum = Math.round(195 + norm * 60);
                if (tier === 3) {
                    data[i] = Math.min(255, Math.round(whiteLum * 1.0));
                    data[i + 1] = Math.min(255, Math.round(whiteLum * 0.93));
                    data[i + 2] = Math.min(255, Math.round(whiteLum * 0.95));
                }
                else if (tier === 2) {
                    data[i] = Math.min(255, Math.round(whiteLum * 0.94));
                    data[i + 1] = Math.min(255, Math.round(whiteLum * 0.97));
                    data[i + 2] = Math.min(255, whiteLum);
                }
                else if (tier === 1) {
                    data[i] = Math.min(255, whiteLum);
                    data[i + 1] = Math.min(255, Math.round(whiteLum * 0.99));
                    data[i + 2] = Math.min(255, Math.round(whiteLum * 0.94));
                }
                else {
                    data[i] = Math.min(255, Math.round(whiteLum * 0.97));
                    data[i + 1] = Math.min(255, Math.round(whiteLum * 0.98));
                    data[i + 2] = Math.min(255, whiteLum);
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas;
    }
    catch (err) {
        console.error("[CANVAS] Failed to apply white ditto variant:", err);
        return img;
    }
}
function applyShinyTierVariant(img, tier) {
    if (tier <= 1)
        return img;
    try {
        var canvas = (0, canvas_1.createCanvas)(img.width, img.height);
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var imgData = ctx.getImageData(0, 0, img.width, img.height);
        var data = imgData.data;
        var hueShiftDegrees = tier === 2 ? 140 : 260;
        var satMult = tier === 2 ? 1.25 : 1.35;
        for (var i = 0; i < data.length; i += 4) {
            var a = data[i + 3];
            if (a < 10)
                continue;
            var r = data[i] / 255;
            var g = data[i + 1] / 255;
            var b = data[i] / 255;
            var max = Math.max(r, g, b);
            var min = Math.min(r, g, b);
            var h = 0, s = 0, l = (max + min) / 2;
            if (max !== min) {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r:
                        h = (g - b) / d + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / d + 2;
                        break;
                    case b:
                        h = (r - g) / d + 4;
                        break;
                }
                h /= 6;
            }
            h = (h + hueShiftDegrees / 360) % 1.0;
            if (h < 0)
                h += 1.0;
            s = Math.min(1.0, s * satMult);
            var r1 = void 0, g1 = void 0, b1 = void 0;
            if (s === 0) {
                r1 = g1 = b1 = l;
            }
            else {
                var hue2rgb = function (p, q, t) {
                    if (t < 0)
                        t += 1;
                    if (t > 1)
                        t -= 1;
                    if (t < 1 / 6)
                        return p + (q - p) * 6 * t;
                    if (t < 1 / 2)
                        return q;
                    if (t < 2 / 3)
                        return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
                var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                var p = 2 * l - q;
                r1 = hue2rgb(p, q, h + 1 / 3);
                g1 = hue2rgb(p, q, h);
                b1 = hue2rgb(p, q, h - 1 / 3);
            }
            data[i] = Math.round(r1 * 255);
            data[i + 1] = Math.round(g1 * 255);
            data[i + 2] = Math.round(b1 * 255);
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas;
    }
    catch (err) {
        console.error("[CANVAS] Failed to apply shiny variant for tier ".concat(tier, ":"), err);
        return img;
    }
}
function isSpriteCached(pokemonName) {
    var clean = pokemonName.toLowerCase().trim();
    clean = clean.replace(/[^a-z0-9]/g, "");
    return spriteCache.has(clean);
}
/**
 * Draws a battler sprite tightly fitted by its non-transparent pixel bounding box
 * so that foreground/background physical size and surface contact are 100% accurate regardless of canvas padding.
 */
function drawFittedBattleSprite(ctx, sprite, targetX, targetY, targetSize) {
    if (!sprite || !sprite.width || !sprite.height)
        return;
    try {
        var tempCanvas = (0, canvas_1.createCanvas)(sprite.width, sprite.height);
        var tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(sprite, 0, 0);
        var data = tempCtx.getImageData(0, 0, sprite.width, sprite.height).data;
        var minX = sprite.width, maxX = 0, minY = sprite.height, maxY = 0;
        for (var y = 0; y < sprite.height; y++) {
            for (var x = 0; x < sprite.width; x++) {
                var a = data[(y * sprite.width + x) * 4 + 3];
                if (a > 10) {
                    if (x < minX)
                        minX = x;
                    if (x > maxX)
                        maxX = x;
                    if (y < minY)
                        minY = y;
                    if (y > maxY)
                        maxY = y;
                }
            }
        }
        if (maxX >= minX && maxY >= minY) {
            var actW = maxX - minX + 1;
            var actH = maxY - minY + 1;
            var maxDim = Math.max(actW, actH);
            var scale = targetSize / maxDim;
            var drawW = actW * scale;
            var drawH = actH * scale;
            var drawX = targetX - drawW / 2;
            var drawY = targetY - drawH; // bottom-aligned on surface
            ctx.drawImage(sprite, minX, minY, actW, actH, drawX, drawY, drawW, drawH);
            return;
        }
    }
    catch (_a) { }
    ctx.drawImage(sprite, targetX - targetSize / 2, targetY - targetSize, targetSize, targetSize);
}
/**
 * Draws an authentic Pokémon Sprite Silhouette Shadow.
 * Extracts the exact pixel outline of the battler's sprite,
 * creates a silhouette mask, and projects/skews it flat onto the platform ground.
 */
function drawPokemonSilhouetteShadow(ctx, sprite, targetX, targetY, targetSize, isPlayer, opacity) {
    if (isPlayer === void 0) { isPlayer = false; }
    if (opacity === void 0) { opacity = 0.40; }
    if (!sprite || !sprite.width || !sprite.height)
        return;
    try {
        var tempCanvas = (0, canvas_1.createCanvas)(sprite.width, sprite.height);
        var tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(sprite, 0, 0);
        var data = tempCtx.getImageData(0, 0, sprite.width, sprite.height).data;
        var minX = sprite.width, maxX = 0, minY = sprite.height, maxY = 0;
        for (var y = 0; y < sprite.height; y++) {
            for (var x = 0; x < sprite.width; x++) {
                var a = data[(y * sprite.width + x) * 4 + 3];
                if (a > 10) {
                    if (x < minX)
                        minX = x;
                    if (x > maxX)
                        maxX = x;
                    if (y < minY)
                        minY = y;
                    if (y > maxY)
                        maxY = y;
                }
            }
        }
        if (maxX < minX || maxY < minY)
            return;
        var actW = maxX - minX + 1;
        var actH = maxY - minY + 1;
        var maxDim = Math.max(actW, actH);
        var scale = targetSize / maxDim;
        var drawW = actW * scale;
        var drawH = actH * scale;
        var silCanvas = (0, canvas_1.createCanvas)(actW, actH);
        var silCtx = silCanvas.getContext("2d");
        silCtx.drawImage(sprite, minX, minY, actW, actH, 0, 0, actW, actH);
        silCtx.globalCompositeOperation = "source-in";
        silCtx.fillStyle = "rgba(10, 22, 16, ".concat(opacity, ")");
        silCtx.fillRect(0, 0, actW, actH);
        ctx.save();
        ctx.translate(targetX, targetY);
        var skewX = isPlayer ? -0.38 : -0.42;
        var scaleY = isPlayer ? 0.30 : 0.32;
        ctx.transform(1, 0, skewX, scaleY, 0, 0);
        ctx.drawImage(silCanvas, -drawW / 2, -drawH, drawW, drawH);
        ctx.restore();
    }
    catch (err) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, ".concat(opacity, ")");
        ctx.beginPath();
        ctx.ellipse(targetX, targetY - 4, targetSize * 0.35, targetSize * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
/**
 * Backward compatibility alias for drawPokemonShadow
 */
function drawPokemonShadow(ctx, cx, cy, rx, ry, opacity) {
    if (opacity === void 0) { opacity = 0.38; }
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, ".concat(opacity, ")");
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
