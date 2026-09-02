"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMoney = formatMoney;
exports.wrapDialogueText = wrapDialogueText;
exports.getPokemonDisplayName = getPokemonDisplayName;
exports.drawInGameMessageBox = drawInGameMessageBox;
var starterCosts_js_1 = require("../../data/starterCosts.js");
var pokemonStats_js_1 = require("../../data/pokemonStats.js");
var pokemonNamesKo_js_1 = require("../../data/pokemonNamesKo.js");
var vectorIcons_js_1 = require("./vectorIcons.js");
function formatMoney(amount) {
    var num = Math.floor(amount || 0);
    if (num < 1000) {
        return "P ".concat(num);
    }
    if (num < 1000000) {
        var kVal = num / 1000;
        var formatted_1 = kVal >= 100 ? Math.floor(kVal) : (kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1).replace(/\.0$/, ""));
        return "P ".concat(formatted_1, "k");
    }
    if (num < 1000000000) {
        var mVal = num / 1000000;
        var formatted_2 = mVal >= 100 ? Math.floor(mVal) : (mVal % 1 === 0 ? mVal.toFixed(0) : mVal.toFixed(1).replace(/\.0$/, ""));
        return "P ".concat(formatted_2, "M");
    }
    var bVal = num / 1000000000;
    var formatted = bVal >= 100 ? Math.floor(bVal) : (bVal % 1 === 0 ? bVal.toFixed(0) : bVal.toFixed(1).replace(/\.0$/, ""));
    return "P ".concat(formatted, "B");
}
/**
 * Splits and wraps dialogue text into clean lines fitting within maxWidth
 */
function wrapDialogueText(ctx, text, maxWidth) {
    var rawLines = text.split("\n");
    var wrapped = [];
    for (var _i = 0, rawLines_1 = rawLines; _i < rawLines_1.length; _i++) {
        var raw = rawLines_1[_i];
        var trimmed = raw.trim();
        if (!trimmed)
            continue;
        if (ctx.measureText(trimmed).width <= maxWidth) {
            wrapped.push(trimmed);
            continue;
        }
        var words = trimmed.split(" ");
        var currentLine = "";
        for (var _a = 0, words_1 = words; _a < words_1.length; _a++) {
            var word = words_1[_a];
            var testLine = currentLine ? "".concat(currentLine, " ").concat(word) : word;
            if (ctx.measureText(testLine).width <= maxWidth) {
                currentLine = testLine;
            }
            else {
                if (currentLine)
                    wrapped.push(currentLine);
                if (ctx.measureText(word).width > maxWidth) {
                    var charLine = "";
                    for (var _b = 0, word_1 = word; _b < word_1.length; _b++) {
                        var char = word_1[_b];
                        if (ctx.measureText(charLine + char).width <= maxWidth) {
                            charLine += char;
                        }
                        else {
                            wrapped.push(charLine);
                            charLine = char;
                        }
                    }
                    currentLine = charLine;
                }
                else {
                    currentLine = word;
                }
            }
        }
        if (currentLine)
            wrapped.push(currentLine);
    }
    return wrapped;
}
/**
 * Renders the Authentic PokéRogue Battle Screen (560x380) with 2x SuperSampling
 */
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    var paragraphs = text.split("\n");
    var curY = y;
    for (var _i = 0, paragraphs_1 = paragraphs; _i < paragraphs_1.length; _i++) {
        var p = paragraphs_1[_i];
        if (!p || p.trim().length === 0) {
            curY += lineHeight;
            continue;
        }
        var words = p.split(" ");
        var line = "";
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + " ";
            var metrics = ctx.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line.trim(), x, curY);
                line = words[n] + " ";
                curY += lineHeight;
            }
            else {
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
function getPokemonDisplayName(mon, isKo) {
    if (!mon)
        return isKo ? "포켓몬" : "Pokemon";
    if (mon.nickname)
        return mon.nickname;
    var speciesId = (mon.speciesId || "").toLowerCase().replace(/[\s_]+/g, "-");
    var starter = speciesId ? (0, starterCosts_js_1.getStarterBySpeciesId)(speciesId) : null;
    var sData = pokemonStats_js_1.POKEMON_SPECIES_DATA[speciesId];
    if (isKo) {
        if (mon.nameKo)
            return mon.nameKo;
        if (starter === null || starter === void 0 ? void 0 : starter.nameKo)
            return starter.nameKo;
        if ((sData === null || sData === void 0 ? void 0 : sData.num) && pokemonNamesKo_js_1.POKEMON_NAMES_KO[sData.num])
            return pokemonNamesKo_js_1.POKEMON_NAMES_KO[sData.num];
        if (mon.name && /[가-힣]/.test(mon.name))
            return mon.name;
        return mon.name || speciesId || "포켓몬";
    }
    else {
        if (mon.nameEn)
            return mon.nameEn;
        if (starter === null || starter === void 0 ? void 0 : starter.name)
            return starter.name;
        if (sData === null || sData === void 0 ? void 0 : sData.name)
            return sData.name;
        if (mon.name && !/[가-힣]/.test(mon.name))
            return mon.name;
        if (speciesId) {
            return speciesId.charAt(0).toUpperCase() + speciesId.slice(1).replace(/-/g, " ");
        }
        return "Pokemon";
    }
}
function drawInGameMessageBox(ctx, width, height, msg, isKo) {
    // 1. Subtle Dim Overlay across the entire screen
    ctx.fillStyle = "rgba(7, 9, 15, 0.45)";
    ctx.fillRect(0, 0, width, height);
    // 2. In-Game Dialogue Box (Bottom Position: y: 264 ~ 368, H: 104, styled like Pokédex Card)
    var boxX = 14;
    var boxY = height - 112;
    var boxW = width - 28;
    var boxH = 102;
    // Outer border & dark background (Same as Pokédex Flavor Card)
    ctx.fillStyle = "#181B26";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.strokeStyle = "#282D3D";
    ctx.lineWidth = 1;
    ctx.stroke();
    // 3. Header: Pokédex-style Title + Move Type Badge + Stats on Right
    var curHeaderX = boxX + 12;
    if (msg.moveType) {
        (0, vectorIcons_js_1.drawTypeIcon)(ctx, curHeaderX, boxY + 6, 20, msg.moveType, "rounded");
        curHeaderX += 26;
    }
    ctx.textBaseline = "middle";
    ctx.font = "bold 15px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    var displayTitle = isKo ? msg.title : msg.title.toUpperCase().replace(/[-_]+/g, " ");
    ctx.fillText(displayTitle, curHeaderX, boxY + 16);
    // Header Right: [Category Icon] + Power + [Target Icon] + Accuracy + PP
    var curRightX = boxX + boxW - 14;
    if (msg.movePp) {
        ctx.font = "bold 14px DungGeunMo";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        var ppValText = " ".concat(msg.movePp);
        ctx.fillStyle = "#FCD34D";
        ctx.fillText(ppValText, curRightX, boxY + 16);
        var valW = ctx.measureText(ppValText).width;
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
        (0, vectorIcons_js_1.drawTargetIcon)(ctx, curRightX - 6, boxY + 16, 6.2, "#38BDF8");
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
        (0, vectorIcons_js_1.drawMoveCategoryIcon)(ctx, curRightX - 23, boxY + 5, msg.moveCategory);
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
