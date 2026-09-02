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
exports.drawVectorGlobe = drawVectorGlobe;
exports.drawVectorWarning = drawVectorWarning;
exports.drawVectorCheck = drawVectorCheck;
exports.drawCheckmark = drawCheckmark;
exports.drawVectorStar = drawVectorStar;
exports.drawShinySparkle = drawShinySparkle;
exports.drawShinyTierSparkles = drawShinyTierSparkles;
exports.drawSwordIcon = drawSwordIcon;
exports.drawBookIcon = drawBookIcon;
exports.drawVectorBag = drawVectorBag;
exports.drawCandyIcon = drawCandyIcon;
exports.drawLockIcon = drawLockIcon;
exports.drawGearIcon = drawGearIcon;
exports.drawEggIcon = drawEggIcon;
exports.drawPartyRightPanel = drawPartyRightPanel;
exports.drawMoveCategoryIcon = drawMoveCategoryIcon;
exports.drawTypeIcon = drawTypeIcon;
exports.drawTargetIcon = drawTargetIcon;
var spriteLoader_js_1 = require("./spriteLoader.js");
/**
 * Draws a clean vector Globe Icon for Multiplayer Header
 */
function drawVectorGlobe(ctx, cx, cy, r, color) {
    if (color === void 0) { color = "#5865F2"; }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.5, r, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}
/**
 * Draws a clean vector Warning Triangle Icon
 */
function drawVectorWarning(ctx, cx, cy, size, color) {
    if (color === void 0) { color = "#F4A261"; }
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.9, cy + size * 0.7);
    ctx.lineTo(cx - size * 0.9, cy + size * 0.7);
    ctx.closePath();
    ctx.stroke();
    ctx.fillRect(cx - 1, cy - size * 0.35, 2, size * 0.45);
    ctx.fillRect(cx - 1, cy + size * 0.35, 2, 2);
    ctx.restore();
}
/**
 * Draws a clean vector Check Circle Icon
 */
function drawVectorCheck(ctx, cx, cy, r, color) {
    if (color === void 0) { color = "#57F287"; }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.45, cy);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.35);
    ctx.lineTo(cx + r * 0.45, cy - r * 0.35);
    ctx.stroke();
    ctx.restore();
}
/**
 * Draws a clean vector Checkmark Icon (SVG path style)
 */
function drawCheckmark(ctx, cx, cy, size, color) {
    if (size === void 0) { size = 5.5; }
    if (color === void 0) { color = "#22C55E"; }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.7, cy);
    ctx.lineTo(cx - size * 0.15, cy + size * 0.55);
    ctx.lineTo(cx + size * 0.75, cy - size * 0.55);
    ctx.stroke();
    ctx.restore();
}
/**
 * Draws a clean vector Star Icon
 */
function drawVectorStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
    if (color === void 0) { color = "#F4A261"; }
    ctx.save();
    var rot = (Math.PI / 2) * 3;
    var x = cx;
    var y = cy;
    var step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (var i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}
/**
 * Draws a clean vector PokéRogue 4-point sparkle star (replaces emoji to prevent font breaking)
 */
function drawShinySparkle(ctx, cx, cy, size, color) {
    if (color === void 0) { color = "#F59E0B"; }
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    var r = size;
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx, cy, cx + r, cy);
    ctx.quadraticCurveTo(cx, cy, cx + r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + r);
    ctx.quadraticCurveTo(cx, cy, cx - r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - r);
    ctx.fill();
    // Highlight center dot
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1.5, size * 0.28), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
/**
 * Draws a single crisp vector Shiny Sparkle Star with Tier Color (Tier 1 Yellow, Tier 2 Blue, Tier 3 Red)
 */
function drawShinyTierSparkles(ctx, startX, centerY, tier, size) {
    if (size === void 0) { size = 7.5; }
    if (tier <= 0)
        return startX;
    var color = tier === 3 ? "#EF4444" : tier === 2 ? "#3B82F6" : "#F59E0B";
    drawShinySparkle(ctx, startX + size, centerY, size, color);
    return startX + size * 2 + 5;
}
/**
 * Draws a clean vector Crossed Sword Icon for Moves Tab
 */
function drawSwordIcon(ctx, cx, cy, size, color) {
    if (size === void 0) { size = 6; }
    if (color === void 0) { color = "#FFFFFF"; }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Blade 1
    ctx.moveTo(cx - size, cy - size);
    ctx.lineTo(cx + size, cy + size);
    // Cross guard 1
    ctx.moveTo(cx - size * 0.4, cy - size * 0.8);
    ctx.lineTo(cx - size * 0.8, cy - size * 0.4);
    // Blade 2
    ctx.moveTo(cx + size, cy - size);
    ctx.lineTo(cx - size, cy + size);
    // Cross guard 2
    ctx.moveTo(cx + size * 0.4, cy - size * 0.8);
    ctx.lineTo(cx + size * 0.8, cy - size * 0.4);
    ctx.stroke();
    ctx.restore();
}
/**
 * Draws a clean vector Book/Dex Icon for Ability/Pokedex cards
 */
function drawBookIcon(ctx, cx, cy, w, h, color) {
    if (w === void 0) { w = 12; }
    if (h === void 0) { h = 10; }
    if (color === void 0) { color = "#60A5FA"; }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - w / 2, cy - h / 2, w / 2, h);
    ctx.strokeRect(cx, cy - h / 2, w / 2, h);
    ctx.beginPath();
    ctx.moveTo(cx, cy - h / 2);
    ctx.lineTo(cx, cy + h / 2);
    ctx.stroke();
    ctx.restore();
}
/**
 * Draws a clean vector Bag Icon
 */
function drawVectorBag(ctx, cx, cy, w, h, color) {
    if (color === void 0) { color = "#F4A261"; }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - w / 2, cy - h / 4, w, h * 0.75);
    ctx.beginPath();
    ctx.arc(cx, cy - h / 4, w * 0.28, Math.PI, 0);
    ctx.stroke();
    ctx.restore();
}
/**
 * Draws Vector Candy Icon (PokéRogue Style Striped Wrapped Candy)
 */
function drawCandyIcon(ctx, cx, cy, r, mainColor, stripeColor) {
    if (r === void 0) { r = 6.5; }
    if (mainColor === void 0) { mainColor = "#F59E0B"; }
    if (stripeColor === void 0) { stripeColor = "#FEF08A"; }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 12);
    // 1. Left Wrapper Frill
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -1);
    ctx.lineTo(-r * 1.8, -r * 0.9);
    ctx.lineTo(-r * 1.6, -r * 0.3);
    ctx.lineTo(-r * 2.0, 0);
    ctx.lineTo(-r * 1.6, r * 0.3);
    ctx.lineTo(-r * 1.8, r * 0.9);
    ctx.lineTo(-r * 0.7, 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // 2. Right Wrapper Frill
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(r * 0.7, -1);
    ctx.lineTo(r * 1.8, -r * 0.9);
    ctx.lineTo(r * 1.6, -r * 0.3);
    ctx.lineTo(r * 2.0, 0);
    ctx.lineTo(r * 1.6, r * 0.3);
    ctx.lineTo(r * 1.8, r * 0.9);
    ctx.lineTo(r * 0.7, 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // 3. Candy Center Ball
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    // 4. Swirl / Stripes on Ball
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-r * 0.6, 0, r * 0.9, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.6, 0, r * 0.9, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.8);
    ctx.lineTo(r * 0.8, r * 0.8);
    ctx.stroke();
    // Highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Center Ball Outline
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    // Knot Bands
    ctx.fillStyle = "#D97706";
    ctx.fillRect(-r * 0.75, -2, 1.2, 4);
    ctx.fillRect(r * 0.75 - 1.2, -2, 1.2, 4);
    ctx.restore();
}
/**
 * Draws Vector Padlock
 */
function drawLockIcon(ctx, cx, cy, w, h, color) {
    if (w === void 0) { w = 9; }
    if (h === void 0) { h = 10; }
    if (color === void 0) { color = "#64748B"; }
    var bodyH = h * 0.6;
    var bodyY = cy - bodyH / 2 + 2;
    var bodyX = cx - w / 2;
    // Shackle
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    var shackleR = w * 0.32;
    ctx.arc(cx, bodyY - 1, shackleR, Math.PI, 0);
    ctx.stroke();
    // Lock Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY, w, bodyH, 2);
    ctx.fill();
    // Keyhole
    ctx.fillStyle = "#10121A";
    ctx.beginPath();
    ctx.arc(cx, bodyY + bodyH * 0.45, 1.2, 0, Math.PI * 2);
    ctx.fill();
}
/**
 * Draws Vector Gear / Settings Icon
 */
function drawGearIcon(ctx, cx, cy, r, color) {
    if (r === void 0) { r = 5.5; }
    if (color === void 0) { color = "#60A5FA"; }
    ctx.fillStyle = color;
    var teeth = 6;
    for (var i = 0; i < teeth; i++) {
        var angle = (i * Math.PI) / (teeth / 2);
        var tx = cx + Math.cos(angle) * (r * 1.25);
        var ty = cy + Math.sin(angle) * (r * 1.25);
        ctx.beginPath();
        ctx.arc(tx, ty, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // Inner hole
    ctx.fillStyle = "#1B2030";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
}
/**
 * Draws Vector Pokemon Egg Icon
 */
function drawEggIcon(ctx, cx, cy, rx, ry, color) {
    if (rx === void 0) { rx = 10; }
    if (ry === void 0) { ry = 14; }
    if (color === void 0) { color = "#FDE68A"; }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Egg Spot details
    ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
    ctx.beginPath();
    ctx.arc(cx - rx * 0.3, cy - ry * 0.2, rx * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
    ctx.beginPath();
    ctx.arc(cx + rx * 0.35, cy + ry * 0.25, rx * 0.28, 0, Math.PI * 2);
    ctx.fill();
}
/**
 * Reusable helper to draw the 6-Pokemon Party Split-Screen Panel (Vertical Split Line + Open Grid)
 */
function drawPartyRightPanel(ctx, boxX, boxY, boxW, boxH, options) {
    return __awaiter(this, void 0, void 0, function () {
        var isKo, party, borderColor, profileH, userText, gridStartX, gridStartY, cardW, cardH, gapX, gapY, i, col, row, cX, cY, mon, sprite;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isKo = (options === null || options === void 0 ? void 0 : options.lang) === "ko";
                    party = (options === null || options === void 0 ? void 0 : options.party) || [];
                    borderColor = (options === null || options === void 0 ? void 0 : options.borderColor) || "#3B82F6";
                    // 1. Right Party Panel Background Card
                    ctx.fillStyle = "#181C2B";
                    ctx.beginPath();
                    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
                    ctx.fill();
                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    profileH = 44;
                    ctx.fillStyle = "#10121C";
                    ctx.beginPath();
                    ctx.roundRect(boxX + 2, boxY + 2, boxW - 4, profileH, [6, 6, 0, 0]);
                    ctx.fill();
                    // Username
                    ctx.font = "bold 13px DungGeunMo";
                    ctx.fillStyle = "#FFFFFF";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";
                    userText = (options === null || options === void 0 ? void 0 : options.username) ? "".concat(options.username) : (isKo ? "트레이너 파티" : "Trainer Party");
                    ctx.fillText(userText, boxX + 12, boxY + 22);
                    gridStartX = boxX + 8;
                    gridStartY = boxY + profileH + 8;
                    cardW = 110;
                    cardH = 88;
                    gapX = 8;
                    gapY = 8;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < 6)) return [3 /*break*/, 5];
                    col = i % 2;
                    row = Math.floor(i / 2);
                    cX = gridStartX + col * (cardW + gapX);
                    cY = gridStartY + row * (cardH + gapY);
                    mon = party[i];
                    if (!mon) return [3 /*break*/, 3];
                    // Occupied Party Slot Card
                    ctx.fillStyle = "#1E2438";
                    ctx.beginPath();
                    ctx.roundRect(cX, cY, cardW, cardH, 4);
                    ctx.fill();
                    ctx.strokeStyle = mon.isShiny ? "#F59E0B" : "#2E3854";
                    ctx.lineWidth = mon.isShiny ? 1.5 : 1;
                    ctx.stroke();
                    return [4 /*yield*/, (0, spriteLoader_js_1.getPokemonSprite)(mon.speciesId, true, mon.shinyTier !== undefined ? mon.shinyTier : (mon.isShiny ? 1 : 0))];
                case 2:
                    sprite = _a.sent();
                    if (sprite) {
                        ctx.drawImage(sprite, cX + cardW / 2 - 25, cY + 4, 50, 50);
                    }
                    // Name & Level
                    ctx.textAlign = "center";
                    ctx.font = "bold 11px DungGeunMo";
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillText(mon.name, cX + cardW / 2, cY + 62);
                    ctx.font = "10px DungGeunMo";
                    ctx.fillStyle = "#94A3B8";
                    ctx.fillText("Lv.".concat(mon.level), cX + cardW / 2, cY + 76);
                    // Shiny Sparkle
                    if (mon.isShiny) {
                        drawShinySparkle(ctx, cX + cardW - 10, cY + 10, 4, "#F59E0B");
                    }
                    return [3 /*break*/, 4];
                case 3:
                    // Empty Slot Card
                    ctx.fillStyle = "#141724";
                    ctx.beginPath();
                    ctx.roundRect(cX, cY, cardW, cardH, 4);
                    ctx.fill();
                    ctx.strokeStyle = "#252B42";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.font = "bold 11px DungGeunMo";
                    ctx.fillStyle = "#475569";
                    ctx.fillText((options === null || options === void 0 ? void 0 : options.showSlotNumbers) ? "Slot ".concat(i + 1) : (isKo ? "- 빈 슬롯 -" : "- Empty -"), cX + cardW / 2, cY + cardH / 2);
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Draws PokéRogue / Official style SVG vector Move Category Icon (Physical, Special, Status)
 */
function drawMoveCategoryIcon(ctx, x, y, category, w, h) {
    if (w === void 0) { w = 22; }
    if (h === void 0) { h = 22; }
    var cat = (category || "status").toLowerCase();
    if (cat === "physical") {
        // Physical: Vivid Crimson + Spiky Impact Burst
        ctx.fillStyle = "#E11D48";
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        var cx = x + w / 2;
        var cy = y + h / 2;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        var spikes = 8;
        var outerR = 6.8;
        var innerR = 3.2;
        for (var i = 0; i < spikes * 2; i++) {
            var r = i % 2 === 0 ? outerR : innerR;
            var angle = (i * Math.PI) / spikes;
            var sx = cx + Math.cos(angle) * r;
            var sy = cy + Math.sin(angle) * r;
            if (i === 0)
                ctx.moveTo(sx, sy);
            else
                ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
    }
    else if (cat === "special") {
        // Special: Deep Indigo/Cyan + Concentric Energy Waves
        ctx.fillStyle = "#4F46E5";
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        var cx = x + w / 2;
        var cy = y + h / 2;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, 6.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(cx, cy, 1.4, 0, Math.PI * 2);
        ctx.fill();
    }
    else {
        // Status: Slate-Gray + Yin-Yang Swirl
        ctx.fillStyle = "#6B7C96";
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        var cx = x + w / 2;
        var cy = y + h / 2;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(cx, cy, 6.0, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = "#6B7C96";
        ctx.beginPath();
        ctx.arc(cx - 3.0, cy, 3.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(cx + 3.0, cy, 3.0, 0, Math.PI * 2);
        ctx.fill();
    }
}
/**
 * Draws PokéRogue / Official style SVG vector Type Icon for all 18 Pokémon Types
 */
function drawTypeIcon(ctx, x, y, size, typeName, shape) {
    if (shape === void 0) { shape = "rounded"; }
    var cleanType = (typeName || "normal").toLowerCase().trim();
    var color = {
        normal: "#929DA3", fire: "#EE8130", water: "#6390F0", grass: "#7AC74C",
        electric: "#F7D02C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
        ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
        rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", steel: "#B7B7CE",
        fairy: "#D685AD", dark: "#705746"
    }[cleanType] || "#777777";
    var r = size / 2;
    var cx = x + r;
    var cy = y + r;
    ctx.save();
    // Background badge container
    ctx.fillStyle = color;
    ctx.beginPath();
    if (shape === "circle") {
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    else {
        ctx.roundRect(x, y, size, size, Math.max(3, Math.floor(size * 0.18)));
    }
    ctx.fill();
    // Vector Glyph setup
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(1.2, size * 0.08);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    var s = size / 24;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    switch (cleanType) {
        case "fire": {
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.bezierCurveTo(3.5, -5, 7, -1, 7, 4);
            ctx.bezierCurveTo(7, 8, 4, 9, 0, 9);
            ctx.bezierCurveTo(-4, 9, -7, 8, -7, 4);
            ctx.bezierCurveTo(-7, -1, -3.5, -5, 0, -9);
            ctx.fill();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, 1.5);
            ctx.bezierCurveTo(2, 3.5, 3, 5.5, 3, 7);
            ctx.bezierCurveTo(3, 8.5, 1.5, 8.8, 0, 8.8);
            ctx.bezierCurveTo(-1.5, 8.8, -3, 8.5, -3, 7);
            ctx.bezierCurveTo(-3, 5.5, -2, 3.5, 0, 1.5);
            ctx.fill();
            break;
        }
        case "water": {
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.bezierCurveTo(4, -3, 7, 2, 7, 5);
            ctx.bezierCurveTo(7, 8.5, 3.5, 9.5, 0, 9.5);
            ctx.bezierCurveTo(-3.5, 9.5, -7, 8.5, -7, 5);
            ctx.bezierCurveTo(-7, 2, -4, -3, 0, -9);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(0, 4.5, 3.8, -Math.PI * 0.7, -Math.PI * 0.1);
            ctx.stroke();
            break;
        }
        case "grass": {
            ctx.beginPath();
            ctx.moveTo(-6, 6);
            ctx.quadraticCurveTo(-6, -6, 7, -7);
            ctx.quadraticCurveTo(6, 6, -6, 6);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-5, 5);
            ctx.lineTo(4, -4);
            ctx.stroke();
            break;
        }
        case "electric": {
            ctx.beginPath();
            ctx.moveTo(1.5, -9);
            ctx.lineTo(-6, 0);
            ctx.lineTo(-0.5, 0);
            ctx.lineTo(-3, 9);
            ctx.lineTo(6, -1);
            ctx.lineTo(1, -1);
            ctx.closePath();
            ctx.fill();
            break;
        }
        case "normal": {
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case "ice": {
            ctx.lineWidth = 1.8;
            for (var i = 0; i < 3; i++) {
                var ang = (i * Math.PI) / 3;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * -8, Math.sin(ang) * -8);
                ctx.lineTo(Math.cos(ang) * 8, Math.sin(ang) * 8);
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case "fighting": {
            ctx.beginPath();
            ctx.roundRect(-6, -6, 12, 12, 3);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-2, -6);
            ctx.lineTo(-2, 2);
            ctx.moveTo(2, -6);
            ctx.lineTo(2, 2);
            ctx.stroke();
            break;
        }
        case "poison": {
            ctx.beginPath();
            ctx.arc(0, -2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-3.5, 2, 7, 5);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(-2, -2, 1.4, 0, Math.PI * 2);
            ctx.arc(2, -2, 1.4, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case "ground": {
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(7, 5);
            ctx.lineTo(-7, 5);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-4, 0);
            ctx.lineTo(4, 0);
            ctx.stroke();
            break;
        }
        case "flying": {
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.quadraticCurveTo(-4, 0, -8, -5);
            ctx.quadraticCurveTo(-3, -3, 0, -1);
            ctx.quadraticCurveTo(3, -3, 8, -5);
            ctx.quadraticCurveTo(4, 0, 0, 5);
            ctx.fill();
            break;
        }
        case "psychic": {
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.quadraticCurveTo(0, -6, 8, 0);
            ctx.quadraticCurveTo(0, 6, -8, 0);
            ctx.fill();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case "bug": {
            ctx.beginPath();
            ctx.arc(0, -3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(0, 3, 5, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(0, 8);
            ctx.stroke();
            break;
        }
        case "rock": {
            ctx.beginPath();
            ctx.moveTo(-3, -7);
            ctx.lineTo(4, -6);
            ctx.lineTo(7, 1);
            ctx.lineTo(3, 7);
            ctx.lineTo(-5, 6);
            ctx.lineTo(-7, -1);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-3, -7);
            ctx.lineTo(0, 0);
            ctx.lineTo(3, 7);
            ctx.moveTo(0, 0);
            ctx.lineTo(-7, -1);
            ctx.moveTo(0, 0);
            ctx.lineTo(7, 1);
            ctx.stroke();
            break;
        }
        case "ghost": {
            ctx.beginPath();
            ctx.arc(0, -2, 6, Math.PI, 0);
            ctx.lineTo(6, 4);
            ctx.lineTo(3, 7);
            ctx.lineTo(0, 4);
            ctx.lineTo(-3, 7);
            ctx.lineTo(-6, 4);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(-2.2, -2, 1.3, 0, Math.PI * 2);
            ctx.arc(2.2, -2, 1.3, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case "dragon": {
            ctx.beginPath();
            ctx.moveTo(-7, 6);
            ctx.quadraticCurveTo(-4, -6, 6, -6);
            ctx.lineTo(1, -1);
            ctx.lineTo(6, 1);
            ctx.lineTo(0, 4);
            ctx.lineTo(4, 7);
            ctx.closePath();
            ctx.fill();
            break;
        }
        case "dark": {
            ctx.beginPath();
            ctx.arc(0, 0, 7, -Math.PI * 0.4, Math.PI * 0.7);
            ctx.arc(-2.5, 0, 5.5, Math.PI * 0.6, -Math.PI * 0.35, true);
            ctx.closePath();
            ctx.fill();
            break;
        }
        case "steel": {
            ctx.beginPath();
            for (var i = 0; i < 6; i++) {
                var a = (i * Math.PI) / 3;
                var hx = Math.cos(a) * 7.2;
                var hy = Math.sin(a) * 7.2;
                if (i === 0)
                    ctx.moveTo(hx, hy);
                else
                    ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case "fairy": {
            ctx.beginPath();
            var outer = 8;
            var inner = 2.5;
            for (var p = 0; p < 8; p++) {
                var rad = p % 2 === 0 ? outer : inner;
                var ang = (p * Math.PI) / 4;
                var fx = Math.cos(ang) * rad;
                var fy = Math.sin(ang) * rad;
                if (p === 0)
                    ctx.moveTo(fx, fy);
                else
                    ctx.lineTo(fx, fy);
            }
            ctx.closePath();
            ctx.fill();
            break;
        }
        default: {
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(6, 0);
            ctx.lineTo(0, 6);
            ctx.lineTo(-6, 0);
            ctx.closePath();
            ctx.fill();
            break;
        }
    }
    ctx.restore();
}
/**
 * Draws a sharp, authentic PokéRogue / RPG-style Target / Bullseye (과녁) Icon for Accuracy (🎯)
 */
function drawTargetIcon(ctx, cx, cy, r, color) {
    if (r === void 0) { r = 6.0; }
    if (color === void 0) { color = "#38BDF8"; }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3;
    // Outer Ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    // 4 Crosshairs extending slightly outside and inside
    var crossIn = r * 0.45;
    var crossOut = r + 1.6;
    ctx.beginPath();
    // Top
    ctx.moveTo(cx, cy - crossOut);
    ctx.lineTo(cx, cy - crossIn);
    // Bottom
    ctx.moveTo(cx, cy + crossIn);
    ctx.lineTo(cx, cy + crossOut);
    // Left
    ctx.moveTo(cx - crossOut, cy);
    ctx.lineTo(cx - crossIn, cy);
    // Right
    ctx.moveTo(cx + crossIn, cy);
    ctx.lineTo(cx + crossOut, cy);
    ctx.stroke();
    // Center Bullseye Dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
