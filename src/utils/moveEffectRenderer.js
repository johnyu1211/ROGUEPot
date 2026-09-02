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
exports.preloadMoveAssets = preloadMoveAssets;
exports.renderMoveEffect = renderMoveEffect;
exports.drawStatBoostEffect = drawStatBoostEffect;
exports.drawStatDropEffect = drawStatDropEffect;
exports.drawKarateChopEffect = drawKarateChopEffect;
exports.drawDoubleSlapEffect = drawDoubleSlapEffect;
var canvas_1 = require("@napi-rs/canvas");
var path_1 = require("path");
var fs_1 = require("fs");
var karateBlackImg = null;
var karateRedImg = null;
function preloadMoveAssets() {
    return __awaiter(this, void 0, void 0, function () {
        var bPath, rPath, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!!karateBlackImg) return [3 /*break*/, 2];
                    bPath = path_1.default.resolve(process.cwd(), "assets/effects/karate_chop_black.png");
                    if (!fs_1.default.existsSync(bPath)) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, canvas_1.loadImage)(bPath)];
                case 1:
                    karateBlackImg = _a.sent();
                    _a.label = 2;
                case 2:
                    if (!!karateRedImg) return [3 /*break*/, 4];
                    rPath = path_1.default.resolve(process.cwd(), "assets/effects/karate_chop_red.png");
                    if (!fs_1.default.existsSync(rPath)) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, canvas_1.loadImage)(rPath)];
                case 3:
                    karateRedImg = _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Initial eager load
preloadMoveAssets();
function renderMoveEffect(ctx, info) {
    var _a, _b;
    var isPlayer = info.isPlayerAttacking;
    var moveKey = info.moveKey.toLowerCase().replace(/[\s_]+/g, "-");
    var type = (info.type || "normal").toLowerCase();
    // Attacker & Target Anchor Points (Logical 560x380 coordinates)
    var playerPos = { x: 175, y: 220 };
    var enemyPos = { x: 418, y: 135 };
    var startPos = isPlayer ? playerPos : enemyPos;
    var targetPos = isPlayer ? enemyPos : playerPos;
    var dx = targetPos.x - startPos.x;
    var dy = targetPos.y - startPos.y;
    var angle = Math.atan2(dy, dx);
    ctx.save();
    // 1. SPECIFIC SIGNATURE MOVES FIRST
    if (moveKey === "karate-chop" || moveKey === "karatechop") {
        drawKarateChopEffect(ctx, targetPos, (_a = info.step) !== null && _a !== void 0 ? _a : 4);
    }
    else if (moveKey === "double-slap" || moveKey === "doubleslap") {
        drawDoubleSlapEffect(ctx, targetPos, (_b = info.step) !== null && _b !== void 0 ? _b : 1);
    }
    else if (moveKey === "solar-beam" || moveKey === "solar-blade") {
        drawSolarBeamEffect(ctx, startPos, targetPos, angle, dx, dy);
    }
    else if (moveKey === "mega-drain" || moveKey === "giga-drain" || moveKey === "absorb" || moveKey === "leech-life" || moveKey === "draining-kiss") {
        drawDrainEffect(ctx, startPos, targetPos, type);
    }
    else if (moveKey === "hyper-beam" || moveKey === "giga-impact") {
        drawHyperBeamEffect(ctx, startPos, targetPos, angle, dx, dy);
    }
    else if (moveKey === "shadow-ball" || moveKey === "dark-pulse") {
        drawShadowBallEffect(ctx, startPos, targetPos, angle);
    }
    else if (moveKey === "thunderbolt" || moveKey === "thunder" || moveKey === "spark" || type === "electric") {
        drawElectricEffect(ctx, startPos, targetPos, info.isSpecial);
    }
    else if (moveKey === "flamethrower" || moveKey === "fire-blast" || moveKey === "ember" || type === "fire") {
        drawFireEffect(ctx, startPos, targetPos, info.isSpecial);
    }
    else if (moveKey === "water-gun" || moveKey === "hydro-pump" || moveKey === "surf" || moveKey === "bubble-beam" || type === "water") {
        drawWaterEffect(ctx, startPos, targetPos, info.isSpecial);
    }
    else if (moveKey === "ice-beam" || moveKey === "blizzard" || moveKey === "ice-punch" || type === "ice") {
        drawIceEffect(ctx, startPos, targetPos, info.isSpecial);
    }
    else if (moveKey === "slash" || moveKey === "scratch" || moveKey === "fury-swipes" || moveKey === "night-slash" || moveKey === "dragon-claw" || moveKey === "shadow-claw") {
        drawSlashEffect(ctx, targetPos, type);
    }
    else if (type === "grass") {
        drawGrassEffect(ctx, startPos, targetPos);
    }
    else if (type === "psychic") {
        drawPsychicEffect(ctx, targetPos);
    }
    else if (type === "poison") {
        drawPoisonEffect(ctx, startPos, targetPos);
    }
    else if (type === "ground" || type === "rock") {
        drawRockGroundEffect(ctx, targetPos);
    }
    else if (type === "flying") {
        drawFlyingEffect(ctx, targetPos);
    }
    else if (type === "ghost" || type === "dark") {
        drawGhostDarkEffect(ctx, targetPos);
    }
    else if (type === "dragon") {
        drawDragonEffect(ctx, startPos, targetPos);
    }
    else if (type === "steel") {
        drawSteelEffect(ctx, targetPos);
    }
    else if (type === "fairy") {
        drawFairyEffect(ctx, targetPos);
    }
    else {
        // Default Physical Strike (Tackle, Pound, Quick Attack, Slam)
        drawPhysicalImpactEffect(ctx, targetPos);
    }
    ctx.restore();
}
/**
 * 1. Solar Beam: Massive Glowing Emerald Laser + Orbiting Rings + Starburst Blast
 */
function drawSolarBeamEffect(ctx, start, target, angle, dx, dy) {
    ctx.fillStyle = "rgba(10, 25, 15, 0.28)";
    ctx.fillRect(0, 0, 560, 275);
    ctx.strokeStyle = "rgba(74, 222, 128, 0.45)";
    ctx.lineWidth = 32;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.strokeStyle = "#22C55E";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.strokeStyle = "#86EFAC";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    var ringCount = 5;
    for (var i = 1; i <= ringCount; i++) {
        var t = i / (ringCount + 1);
        var rx = start.x + dx * t;
        var ry = start.y + dy * t;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(angle);
        ctx.strokeStyle = "#FEF08A";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 16, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    var muzzle = ctx.createRadialGradient(start.x, start.y, 2, start.x, start.y, 32);
    muzzle.addColorStop(0, "#FFFFFF");
    muzzle.addColorStop(0.4, "#86EFAC");
    muzzle.addColorStop(1, "rgba(34, 197, 94, 0)");
    ctx.fillStyle = muzzle;
    ctx.beginPath();
    ctx.arc(start.x, start.y, 32, 0, Math.PI * 2);
    ctx.fill();
    drawStarburstImpact(ctx, target.x, target.y, "#4ADE80", "#FEF08A");
}
/**
 * 2. Drain Moves: Swirling Life-Energy Orbs from Defender into Attacker
 */
function drawDrainEffect(ctx, user, target, type) {
    var orbColor = type === "fairy" ? "#F472B6" : (type === "bug" ? "#A3E635" : "#4ADE80");
    var glowColor = type === "fairy" ? "#FBCFE8" : "#DCFCE7";
    var targetGrad = ctx.createRadialGradient(target.x, target.y, 5, target.x, target.y, 35);
    targetGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    targetGrad.addColorStop(0.5, orbColor);
    targetGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = targetGrad;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 35, 0, Math.PI * 2);
    ctx.fill();
    var dx = user.x - target.x;
    var dy = user.y - target.y;
    for (var i = 0; i < 6; i++) {
        var t = (i + 1) / 7;
        var curve = Math.sin(t * Math.PI) * ((i % 2 === 0 ? 1 : -1) * 35);
        var ox = target.x + dx * t - (dy / Math.sqrt(dx * dx + dy * dy)) * curve;
        var oy = target.y + dy * t + (dx / Math.sqrt(dx * dx + dy * dy)) * curve;
        ctx.fillStyle = orbColor;
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    var userAura = ctx.createRadialGradient(user.x, user.y, 5, user.x, user.y, 40);
    userAura.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    userAura.addColorStop(0.4, glowColor);
    userAura.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = userAura;
    ctx.beginPath();
    ctx.arc(user.x, user.y, 40, 0, Math.PI * 2);
    ctx.fill();
}
/**
 * 3. Hyper Beam / Giga Impact: Destructive White/Gold Laser Cannon
 */
function drawHyperBeamEffect(ctx, start, target, angle, dx, dy) {
    ctx.fillStyle = "rgba(15, 10, 25, 0.4)";
    ctx.fillRect(0, 0, 560, 275);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
    ctx.lineWidth = 36;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    drawStarburstImpact(ctx, target.x, target.y, "#F59E0B", "#FFFFFF", 55);
}
/**
 * 4. Electric: Sharp Jagged Branching Lightning Bolts + Sparks
 */
function drawElectricEffect(ctx, start, target, isSpecial) {
    var topY = Math.min(start.y, target.y) - 40;
    var segments = [
        { x: target.x - 25, y: topY },
        { x: target.x - 5, y: topY + 30 },
        { x: target.x - 20, y: topY + 50 },
        { x: target.x + 10, y: topY + 80 },
        { x: target.x, y: target.y }
    ];
    ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
    ctx.lineWidth = 14;
    ctx.lineJoin = "miter";
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (var i = 1; i < segments.length; i++)
        ctx.lineTo(segments[i].x, segments[i].y);
    ctx.stroke();
    ctx.strokeStyle = "#FFE600";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (var i = 1; i < segments.length; i++)
        ctx.lineTo(segments[i].x, segments[i].y);
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (var i = 1; i < segments.length; i++)
        ctx.lineTo(segments[i].x, segments[i].y);
    ctx.stroke();
    for (var a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        var r = 24 + (a % 2) * 12;
        var sx = target.x + Math.cos(a) * r;
        var sy = target.y + Math.sin(a) * r;
        ctx.fillStyle = "#FFE600";
        ctx.fillRect(sx - 2, sy - 2, 5, 5);
    }
    drawStarburstImpact(ctx, target.x, target.y, "#FFE600", "#38BDF8", 38);
}
/**
 * 5. Fire: Fiery Blast Stream & Rising Flame Pillar
 */
function drawFireEffect(ctx, start, target, isSpecial) {
    var dx = target.x - start.x;
    var dy = target.y - start.y;
    for (var i = 1; i <= 3; i++) {
        var t = i / 3.5;
        var fx = start.x + dx * t;
        var fy = start.y + dy * t;
        var fGrad = ctx.createRadialGradient(fx, fy, 2, fx, fy, 16 + i * 4);
        fGrad.addColorStop(0, "#FEF08A");
        fGrad.addColorStop(0.4, "#F97316");
        fGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(fx, fy, 16 + i * 4, 0, Math.PI * 2);
        ctx.fill();
    }
    var flameGrad = ctx.createRadialGradient(target.x, target.y, 4, target.x, target.y - 10, 42);
    flameGrad.addColorStop(0, "#FFFFFF");
    flameGrad.addColorStop(0.25, "#FDE047");
    flameGrad.addColorStop(0.65, "#EA580C");
    flameGrad.addColorStop(1, "rgba(185, 28, 28, 0)");
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.ellipse(target.x, target.y - 8, 36, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    for (var i = 0; i < 7; i++) {
        var ex = target.x - 20 + Math.random() * 40;
        var ey = target.y - 10 - Math.random() * 40;
        ctx.fillStyle = "#FEF08A";
        ctx.fillRect(ex, ey, 3, 3);
    }
}
/**
 * 6. Water: High-Velocity Cyan/Blue Torrent + Foam & Splash Droplets
 */
function drawWaterEffect(ctx, start, target, isSpecial) {
    ctx.strokeStyle = "rgba(14, 165, 233, 0.4)";
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.strokeStyle = "#0284C7";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.strokeStyle = "#BAE6FD";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    var splashGrad = ctx.createRadialGradient(target.x, target.y, 5, target.x, target.y, 42);
    splashGrad.addColorStop(0, "#FFFFFF");
    splashGrad.addColorStop(0.4, "#38BDF8");
    splashGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
    ctx.fillStyle = splashGrad;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 42, 0, Math.PI * 2);
    ctx.fill();
    for (var a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        var dx = Math.cos(a) * 30;
        var dy = Math.sin(a) * 30;
        ctx.fillStyle = "#E0F2FE";
        ctx.beginPath();
        ctx.arc(target.x + dx, target.y + dy, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}
/**
 * 7. Ice: Crystalline Snowflake Burst & Freezing Jagged Spires
 */
function drawIceEffect(ctx, start, target, isSpecial) {
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 4;
    for (var i = 0; i < 4; i++) {
        var sx = target.x - 24 + i * 16;
        var sy = target.y + 20;
        ctx.fillStyle = "rgba(186, 230, 253, 0.85)";
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 8, sy - 40 - (i % 2) * 15);
        ctx.lineTo(sx + 16, sy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    drawStarburstImpact(ctx, target.x, target.y, "#38BDF8", "#FFFFFF", 35);
}
/**
 * 8. Physical Slash / Scratch: 3-Blade Crescent Trails
 */
function drawSlashEffect(ctx, target, type) {
    var glowColor = type === "dark" || type === "ghost" ? "rgba(168, 85, 247, 0.6)" : (type === "dragon" ? "rgba(20, 184, 166, 0.6)" : "rgba(239, 68, 68, 0.5)");
    var coreColor = type === "dark" ? "#C084FC" : "#FFFFFF";
    var slashOffsets = [-14, 0, 14];
    for (var _i = 0, slashOffsets_1 = slashOffsets; _i < slashOffsets_1.length; _i++) {
        var offset = slashOffsets_1[_i];
        var x1 = target.x - 35 + offset;
        var y1 = target.y - 38 - offset * 0.3;
        var x2 = target.x + 35 + offset;
        var y2 = target.y + 28 - offset * 0.3;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    drawStarburstImpact(ctx, target.x, target.y, "#FDE047", "#FFFFFF", 28);
}
/**
 * 9. Shadow Ball / Dark Pulse: Ethereal Void Energy Orb & Shadow Burst
 */
function drawShadowBallEffect(ctx, start, target, angle) {
    var midX = (start.x + target.x) / 2;
    var midY = (start.y + target.y) / 2;
    var ballGrad = ctx.createRadialGradient(midX, midY, 4, midX, midY, 26);
    ballGrad.addColorStop(0, "#18181B");
    ballGrad.addColorStop(0.5, "#7E22CE");
    ballGrad.addColorStop(0.9, "#C084FC");
    ballGrad.addColorStop(1, "rgba(126, 34, 206, 0)");
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(midX, midY, 26, 0, Math.PI * 2);
    ctx.fill();
    var hitGrad = ctx.createRadialGradient(target.x, target.y, 5, target.x, target.y, 45);
    hitGrad.addColorStop(0, "#09090B");
    hitGrad.addColorStop(0.4, "#6B21A8");
    hitGrad.addColorStop(0.8, "#A855F7");
    hitGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.fillStyle = hitGrad;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 45, 0, Math.PI * 2);
    ctx.fill();
}
/**
 * 10. Grass: Spinning Dual-Tone Leaf Whirlwind
 */
function drawGrassEffect(ctx, start, target) {
    for (var i = 0; i < 8; i++) {
        var a = (i / 8) * Math.PI * 2;
        var r = 22 + (i % 2) * 12;
        var lx = target.x + Math.cos(a) * r;
        var ly = target.y + Math.sin(a) * r;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(a + Math.PI / 4);
        ctx.fillStyle = i % 2 === 0 ? "#22C55E" : "#86EFAC";
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    drawStarburstImpact(ctx, target.x, target.y, "#4ADE80", "#FEF08A", 30);
}
/**
 * 11. Psychic: Concentric Magenta/Violet Distortion Rings
 */
function drawPsychicEffect(ctx, target) {
    var ringColors = ["rgba(244, 63, 94, 0.8)", "rgba(192, 132, 252, 0.7)", "rgba(244, 114, 182, 0.6)"];
    for (var i = 0; i < 3; i++) {
        ctx.strokeStyle = ringColors[i];
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(target.x, target.y, 22 + i * 12, 14 + i * 8, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}
/**
 * 12. Poison: Toxic Purple Bubbling Acidic Blast
 */
function drawPoisonEffect(ctx, start, target) {
    for (var i = 0; i < 6; i++) {
        var px = target.x - 20 + Math.random() * 40;
        var py = target.y - 15 + Math.random() * 30;
        var r = 6 + Math.random() * 8;
        var pGrad = ctx.createRadialGradient(px, py, 2, px, py, r);
        pGrad.addColorStop(0, "#E9D5FF");
        pGrad.addColorStop(0.6, "#A855F7");
        pGrad.addColorStop(1, "#581C87");
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
    }
    drawStarburstImpact(ctx, target.x, target.y, "#A855F7", "#F3E8FF", 28);
}
/**
 * 13. Rock / Ground: Crashing Boulders & Ground Dust
 */
function drawRockGroundEffect(ctx, target) {
    ctx.strokeStyle = "#A16207";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(target.x, target.y + 15, 38, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
    var rockColors = ["#78716C", "#A8A29E", "#57534E"];
    for (var i = 0; i < 4; i++) {
        var rx = target.x - 25 + i * 16;
        var ry = target.y - 15 + (i % 2) * 10;
        ctx.fillStyle = rockColors[i % 3];
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + 12, ry - 14);
        ctx.lineTo(rx + 16, ry + 2);
        ctx.closePath();
        ctx.fill();
    }
}
/**
 * 14. Flying: Sharp Sky-Blue Crescent Wind Blades
 */
function drawFlyingEffect(ctx, target) {
    for (var i = 0; i < 3; i++) {
        var fx = target.x - 20 + i * 18;
        var fy = target.y - 15 + i * 10;
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(fx, fy, 22, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
    }
    drawStarburstImpact(ctx, target.x, target.y, "#BAE6FD", "#FFFFFF", 26);
}
/**
 * 15. Ghost / Dark: Shadow Wave
 */
function drawGhostDarkEffect(ctx, target) {
    drawStarburstImpact(ctx, target.x, target.y, "#7E22CE", "#C084FC", 36);
}
/**
 * 16. Dragon: Mystic Cyan/Teal Dragon Breath
 */
function drawDragonEffect(ctx, start, target) {
    drawStarburstImpact(ctx, target.x, target.y, "#0D9488", "#2DD4BF", 38);
}
/**
 * 17. Steel: Metallic Sheen Gleam & Impact Ping
 */
function drawSteelEffect(ctx, target) {
    drawStarburstImpact(ctx, target.x, target.y, "#94A3B8", "#FFFFFF", 32);
}
/**
 * 18. Fairy: Pink Starburst & Sparkling Moon Dust
 */
function drawFairyEffect(ctx, target) {
    drawStarburstImpact(ctx, target.x, target.y, "#EC4899", "#FDE047", 34);
}
/**
 * Default Physical Impact (Tackle, Pound, Quick Attack, Slam)
 */
function drawPhysicalImpactEffect(ctx, target) {
    drawStarburstImpact(ctx, target.x, target.y, "#F59E0B", "#FFFFFF", 32);
}
/**
 * Common Helper: High-Quality Impact Starburst & Shockwave Ring
 */
function drawStarburstImpact(ctx, tx, ty, color1, color2, radius) {
    if (radius === void 0) { radius = 34; }
    var hitGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, radius);
    hitGrad.addColorStop(0, "#FFFFFF");
    hitGrad.addColorStop(0.35, color2);
    hitGrad.addColorStop(0.7, color1);
    hitGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = hitGrad;
    ctx.beginPath();
    ctx.arc(tx, ty, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(tx, ty, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    for (var a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        var r1 = radius * 0.35;
        var r2 = radius * (0.8 + (a % 2) * 0.3);
        var x1 = tx + Math.cos(a) * r1;
        var y1 = ty + Math.sin(a) * r1;
        var x2 = tx + Math.cos(a) * r2;
        var y2 = ty + Math.sin(a) * r2;
        ctx.strokeStyle = color2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}
/**
 * 19. Stat Boost Effect (능력치 향상 / 랭크 상승)
 * Luminous red/amber glowing chevron arrows and sparkle orbs rising upward!
 */
function drawStatBoostEffect(ctx, pos, progress) {
    if (progress === void 0) { progress = 0.5; }
    ctx.save();
    var clampedProgress = Math.min(1.0, Math.max(0.0, progress));
    // Soft ambient rising aura
    var auraGrad = ctx.createRadialGradient(pos.x, pos.y, 10, pos.x, pos.y - 20, 65);
    auraGrad.addColorStop(0, "rgba(239, 68, 68, 0.35)");
    auraGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.20)");
    auraGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y - 15, 65, 0, Math.PI * 2);
    ctx.fill();
    // 5 Ascending Glowing Arrows (Upwards ^ )
    var arrowConfigs = [
        { offsetX: -32, baseY: 25, speed: 65, size: 11, delay: 0.0, color: "#EF4444" },
        { offsetX: -14, baseY: 35, speed: 75, size: 14, delay: 0.15, color: "#F59E0B" },
        { offsetX: 0, baseY: 45, speed: 85, size: 16, delay: 0.05, color: "#FDE047" },
        { offsetX: 16, baseY: 35, speed: 75, size: 13, delay: 0.2, color: "#F59E0B" },
        { offsetX: 34, baseY: 25, speed: 65, size: 10, delay: 0.1, color: "#EF4444" },
    ];
    for (var _i = 0, arrowConfigs_1 = arrowConfigs; _i < arrowConfigs_1.length; _i++) {
        var cfg = arrowConfigs_1[_i];
        var localProgress = (clampedProgress + cfg.delay) % 1.0;
        var arrowY = pos.y + cfg.baseY - (localProgress * cfg.speed);
        var arrowX = pos.x + cfg.offsetX;
        var alpha = Math.sin(localProgress * Math.PI);
        if (alpha <= 0.05)
            continue;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Draw Chevron Arrow pointing UP ( ^ )
        var s = cfg.size;
        ctx.beginPath();
        ctx.moveTo(arrowX - s, arrowY + s * 0.55);
        ctx.lineTo(arrowX, arrowY - s * 0.45);
        ctx.lineTo(arrowX + s, arrowY + s * 0.55);
        ctx.stroke();
        // Inner bright core
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(arrowX - s * 0.7, arrowY + s * 0.45);
        ctx.lineTo(arrowX, arrowY - s * 0.35);
        ctx.lineTo(arrowX + s * 0.7, arrowY + s * 0.45);
        ctx.stroke();
        // Trailing sparkle dot beneath each arrow
        ctx.fillStyle = cfg.color;
        ctx.beginPath();
        ctx.arc(arrowX, arrowY + s * 1.1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    // Floating sparkle particles
    var sparkles = [
        { ox: -20, oy: -10, r: 2.5, color: "#FDE047" },
        { ox: 15, oy: -25, r: 3.0, color: "#F59E0B" },
        { ox: -5, oy: -40, r: 2.0, color: "#EF4444" },
        { ox: 25, oy: -5, r: 2.2, color: "#FDE047" },
    ];
    for (var _a = 0, sparkles_1 = sparkles; _a < sparkles_1.length; _a++) {
        var sp = sparkles_1[_a];
        var py = pos.y + sp.oy - clampedProgress * 30;
        var px = pos.x + sp.ox;
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(px, py, sp.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
/**
 * 20. Stat Drop Effect (능력치 하락 / 랭크 하락)
 * Deep blue/cyan/purple glowing chevron arrows and mist droplets descending downward!
 */
function drawStatDropEffect(ctx, pos, progress) {
    if (progress === void 0) { progress = 0.5; }
    ctx.save();
    var clampedProgress = Math.min(1.0, Math.max(0.0, progress));
    // Dark cold blue ambient aura
    var auraGrad = ctx.createRadialGradient(pos.x, pos.y, 10, pos.x, pos.y + 15, 65);
    auraGrad.addColorStop(0, "rgba(59, 130, 246, 0.35)");
    auraGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.20)");
    auraGrad.addColorStop(1, "rgba(59, 130, 246, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y + 10, 65, 0, Math.PI * 2);
    ctx.fill();
    // 5 Descending Glowing Arrows (Downwards v )
    var arrowConfigs = [
        { offsetX: -32, baseY: -35, speed: 65, size: 11, delay: 0.0, color: "#3B82F6" },
        { offsetX: -14, baseY: -45, speed: 75, size: 14, delay: 0.15, color: "#60A5FA" },
        { offsetX: 0, baseY: -55, speed: 85, size: 16, delay: 0.05, color: "#818CF8" },
        { offsetX: 16, baseY: -45, speed: 75, size: 13, delay: 0.2, color: "#60A5FA" },
        { offsetX: 34, baseY: -35, speed: 65, size: 10, delay: 0.1, color: "#3B82F6" },
    ];
    for (var _i = 0, arrowConfigs_2 = arrowConfigs; _i < arrowConfigs_2.length; _i++) {
        var cfg = arrowConfigs_2[_i];
        var localProgress = (clampedProgress + cfg.delay) % 1.0;
        var arrowY = pos.y + cfg.baseY + (localProgress * cfg.speed);
        var arrowX = pos.x + cfg.offsetX;
        var alpha = Math.sin(localProgress * Math.PI);
        if (alpha <= 0.05)
            continue;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Draw Chevron Arrow pointing DOWN ( v )
        var s = cfg.size;
        ctx.beginPath();
        ctx.moveTo(arrowX - s, arrowY - s * 0.55);
        ctx.lineTo(arrowX, arrowY + s * 0.45);
        ctx.lineTo(arrowX + s, arrowY - s * 0.55);
        ctx.stroke();
        // Inner bright core
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(arrowX - s * 0.7, arrowY - s * 0.45);
        ctx.lineTo(arrowX, arrowY + s * 0.35);
        ctx.lineTo(arrowX + s * 0.7, arrowY - s * 0.45);
        ctx.stroke();
        // Trailing droplet dot above each falling arrow
        ctx.fillStyle = cfg.color;
        ctx.beginPath();
        ctx.arc(arrowX, arrowY - s * 1.1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    // Descending droplet particles
    var droplets = [
        { ox: -20, oy: 5, r: 2.5, color: "#60A5FA" },
        { ox: 15, oy: 20, r: 3.0, color: "#3B82F6" },
        { ox: -5, oy: 35, r: 2.0, color: "#818CF8" },
        { ox: 25, oy: -2, r: 2.2, color: "#60A5FA" },
    ];
    for (var _a = 0, droplets_1 = droplets; _a < droplets_1.length; _a++) {
        var dp = droplets_1[_a];
        var py = pos.y + dp.oy + clampedProgress * 30;
        var px = pos.x + dp.ox;
        ctx.fillStyle = dp.color;
        ctx.beginPath();
        ctx.arc(px, py, dp.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
/**
 * Authentic Gen 5 Karate Chop (태권당수):
 * A distinct, iconic blocky Karate Hand sprite matching official Gen 5 geometry:
 * 4 horizontal blocky fingers with rounded caps extending to the left, thumb folded on top-right,
 * charging red/orange flash and slamming down with orange/amber impact embers!
 */
function drawKarateChopEffect(ctx, target, step) {
    if (step === void 0) { step = 4; }
    ctx.save();
    var cx = target.x;
    var cy = target.y - 45;
    var handOy = -55;
    var rotDeg = 0;
    var isRedFlash = false;
    var showImpact = false;
    if (step === 1) {
        // Step 1: Hand appears hovering above target head (Black Hand, purely horizontal)
        handOy = -58;
        isRedFlash = false;
    }
    else if (step === 2) {
        // Step 2: 살짝 아래로 틱 내려감 (Pure vertical dip down)
        handOy = -44;
        isRedFlash = false;
    }
    else if (step === 3) {
        // Step 3: 위로 살짝 올라갔다가 멈칫 장전 (Pure vertical rise up & Red charging hold)
        handOy = -76;
        isRedFlash = true;
    }
    else {
        // Step 4: 팍! 하고 정수리에 딱 내리찍음 (Pure vertical slam down on head + Orange embers!)
        handOy = -15;
        isRedFlash = false;
        showImpact = true;
    }
    // 1. Draw Authentic 5th Gen Hand Sprite Asset (Fixed 0 degree angle)
    var sprite = isRedFlash ? karateRedImg : karateBlackImg;
    if (sprite) {
        ctx.save();
        ctx.translate(cx, cy + handOy);
        var sw = 80 * 1.15;
        var sh = 60 * 1.15;
        ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
        ctx.restore();
    }
    // 2. Orange / Amber Hit Embers on Impact (Step 3)
    if (showImpact) {
        ctx.save();
        var embers = [
            { ox: -30, oy: -20, r: 3.5, color: "#EA580C" },
            { ox: 25, oy: -35, r: 3.0, color: "#F97316" },
            { ox: 38, oy: -15, r: 4.0, color: "#FBBF24" },
            { ox: -40, oy: 10, r: 3.5, color: "#F97316" },
            { ox: -25, oy: 30, r: 3.0, color: "#EA580C" },
            { ox: 35, oy: 25, r: 4.0, color: "#FBBF24" },
            { ox: 0, oy: 38, r: 3.5, color: "#EA580C" },
            { ox: -10, oy: -45, r: 2.5, color: "#FDE047" },
        ];
        for (var _i = 0, embers_1 = embers; _i < embers_1.length; _i++) {
            var eb = embers_1[_i];
            var px = cx + eb.ox;
            var py = cy + handOy + 15 + eb.oy;
            ctx.fillStyle = eb.color;
            ctx.beginPath();
            ctx.arc(px, py, eb.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    ctx.restore();
}
/**
 * Authentic Gen 5 Double Slap (연속뺨치기):
 * Rhythmic alternating Left & Right open palm slaps across the target's face
 * with slap wind arcs and star impact sparks!
 */
function drawDoubleSlapEffect(ctx, target, step) {
    if (step === void 0) { step = 1; }
    ctx.save();
    // step: 1 (Slap Left), 2 (Slap Right), 3 (Slap Left), 4 (Slap Right), 5 (Slap Left)
    var isLeft = (step % 2 !== 0);
    var handX = target.x + (isLeft ? -36 : 36);
    var handY = target.y - 25;
    var rotAngle = isLeft ? (25 * Math.PI) / 180 : (-25 * Math.PI) / 180;
    var scaleX = isLeft ? 1 : -1;
    // 1. Slap Motion Arc / Wind Streaks
    ctx.save();
    ctx.strokeStyle = "rgba(254, 240, 138, 0.9)";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (isLeft) {
        ctx.arc(target.x - 10, target.y - 20, 36, Math.PI * 0.85, Math.PI * 1.6);
    }
    else {
        ctx.arc(target.x + 10, target.y - 20, 36, Math.PI * 1.4, Math.PI * 2.15);
    }
    ctx.stroke();
    // Outer white speed trail
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (isLeft) {
        ctx.arc(target.x - 10, target.y - 20, 44, Math.PI * 0.9, Math.PI * 1.55);
    }
    else {
        ctx.arc(target.x + 10, target.y - 20, 44, Math.PI * 1.45, Math.PI * 2.1);
    }
    ctx.stroke();
    ctx.restore();
    // 2. Open Palm Hand (Glove silhouette with 5 fingers)
    ctx.save();
    ctx.translate(handX, handY);
    ctx.scale(scaleX * 1.25, 1.25);
    ctx.rotate(rotAngle);
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 3.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    // Wrist
    ctx.moveTo(-10, 22);
    ctx.lineTo(10, 22);
    ctx.lineTo(12, 6);
    // Pinky
    ctx.lineTo(18, -4);
    ctx.arc(16, -7, 3.2, 0, Math.PI, true);
    ctx.lineTo(11, 2);
    // Ring
    ctx.lineTo(11, -12);
    ctx.arc(9, -15, 3.2, 0, Math.PI, true);
    ctx.lineTo(6, 0);
    // Middle
    ctx.lineTo(4, -18);
    ctx.arc(2, -21, 3.5, 0, Math.PI, true);
    ctx.lineTo(0, -2);
    // Index
    ctx.lineTo(-3, -15);
    ctx.arc(-5, -18, 3.2, 0, Math.PI, true);
    ctx.lineTo(-6, 2);
    // Thumb
    ctx.lineTo(-16, -6);
    ctx.arc(-18, -4, 3.8, 0, Math.PI, true);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Palm crease / inner shading
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 8, 6, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    ctx.restore();
    // 3. Impact Star / Sparks at Point of Cheek Contact
    ctx.save();
    var sparkX = target.x + (isLeft ? -10 : 10);
    var sparkY = target.y - 25;
    // Yellow 4-point Impact Star
    ctx.fillStyle = "#FACC15";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sparkX, sparkY - 18);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX + 18, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY + 18);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX - 18, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY - 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // White inner star
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(sparkX, sparkY - 9);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX + 9, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY + 9);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX - 9, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY - 9);
    ctx.closePath();
    ctx.fill();
    // Spark dots
    var sparkDots = [
        { ox: -15, oy: -14, r: 2.5, c: "#FEF08A" },
        { ox: 16, oy: -13, r: 2.2, c: "#FACC15" },
        { ox: -13, oy: 16, r: 2.2, c: "#FACC15" },
        { ox: 15, oy: 15, r: 2.5, c: "#FEF08A" },
    ];
    for (var _i = 0, sparkDots_1 = sparkDots; _i < sparkDots_1.length; _i++) {
        var sd = sparkDots_1[_i];
        ctx.fillStyle = sd.c;
        ctx.beginPath();
        ctx.arc(sparkX + sd.ox, sparkY + sd.oy, sd.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    ctx.restore();
}
