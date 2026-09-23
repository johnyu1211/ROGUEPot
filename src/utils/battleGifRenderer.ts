// @ts-ignore
import GIFEncoder from "gif-encoder-2";
import { createCanvas } from "@napi-rs/canvas";
import { BattleState, TurnActionInfo } from "../services/battleService.js";
import { renderMoveEffect, drawStatBoostEffect, drawStatDropEffect } from "../renderers/moves/index.js";
import { POKEMON_SPECIES_DATA } from "../data/pokemonStats.js";
import { getMoveKey, getMoveData, MOVES_DATA } from "../data/movesKo.js";
import {
  BATTLE_LAYOUT_CONFIG,
  getArenaAssets,
  getPbInfoAssets,
  getPokemonSprite,
  drawPokeRogueBattleHud,
  drawFittedBattleSprite,
  getStatusTintColor,
  getPokemonDisplayName,
  formatMoney,
  wrapDialogueText,
  drawPokemonSilhouetteShadow,
  drawPokemonShadow,
  BIOME_NAMES_KO,
} from "./canvasRenderer.js";
import { getMoveAnimation } from "../battle/moves/moveRegistry.js";
import { applyMoveCameraToFrames, setMoveAnimationResolver } from "./battleCamera.js";

setMoveAnimationResolver(getMoveAnimation);
(globalThis as any).__getMoveAnimation = getMoveAnimation;
import { BattleFrame } from "../battle/moves/types.js";
import { interpolateBattleFramesTo30Fps } from "./frameInterpolator.js";
import { applyDamageBlinkFrames } from "./damageBlink.js";
import { getPerkSvgImageSync, BallPerkId } from "./perkSvgIcons.js";

export interface BattleAnimationOptions {
  battle: BattleState;
  lang?: "ko" | "en";
  moveKey?: string;
  type?: string;
  isSpecial?: boolean;
  isPlayerAttacking?: boolean;
  dialogueLines?: string[];
  includeFramePreviews?: boolean;
  entryType?: "both" | "enemy" | "player";
}

export interface FramePreviewItem {
  index: number;
  delay: number;
  phaseId: string;
  phaseName: string;
  dataUrl: string;
  cameraZoom: number;
  pOffset: { x: number; y: number };
  eOffset: { x: number; y: number };
}

export interface PhaseInfoItem {
  phaseId: string;
  phaseName: string;
  frameIndex: number;
  delay?: number;
  pOffset?: { x: number; y: number };
  eOffset?: { x: number; y: number };
  cameraZoom?: number;
  playerHp?: number;
  enemyHp?: number;
  dataUrl: string;
}

export interface RenderGifResult {
  buffer: Buffer;
  motionDurationMs: number;
  frames?: FramePreviewItem[];
  phases?: PhaseInfoItem[];
}

const edgeColorCache = new WeakMap<any, { top: string; bottom: string }>();

function getArenaEdgeColors(bg: any): { top: string; bottom: string } {
  if (!bg) return { top: "#38BDF8", bottom: "#2E5C2E" };
  if (edgeColorCache.has(bg)) return edgeColorCache.get(bg)!;

  try {
    const tempCanvas = createCanvas(bg.width || 560, bg.height || 380);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(bg, 0, 0);

    // Sample top edge pixel (middle of top line)
    const topData = tempCtx.getImageData(Math.floor((bg.width || 560) / 2), 2, 1, 1).data;
    const topHex = `rgb(${topData[0]}, ${topData[1]}, ${topData[2]})`;

    // Sample bottom edge pixel (middle of bottom line)
    const botData = tempCtx.getImageData(Math.floor((bg.width || 560) / 2), (bg.height || 380) - 2, 1, 1).data;
    const botHex = `rgb(${botData[0]}, ${botData[1]}, ${botData[2]})`;

    const colors = { top: topHex, bottom: botHex };
    edgeColorCache.set(bg, colors);
    return colors;
  } catch (e) {
    return { top: "#38BDF8", bottom: "#2E5C2E" };
  }
}

/**
 * 1. Standard Move Execution GIF:
 * Frame 0: Leading Static Buffer (1000ms) - Calm intro announcement
 * Frame 1: Lunge / Windup (No effect)
 * Frame 2: Single Move Effect Strike & Hit Flash (Effect ONCE!)
 * Frame 3: Recoil & Damage Settling + Stat Particles Start
 * Frame 4: Neutral Return + Stat Particles Climax
 * Frame 5: 11-Minute Static Hold Frame (Effect OFF, holds still)
 */
/**
 * Generates recoil and damage settling frames with sprite transparency flickering
 * based on type effectiveness:
 * - Not very effective (<= 0.5x) or Immune (0x): 0 blinks (steady hit)
 * - Normal hit (1.0x): 1 blink (transparent -> normal)
 * - Super Effective (2.0x): 3 blinks (strobe 3 times)
 * - Double Super Effective (>= 4.0x): 4 blinks (strobe 4 times)
 */
function createEffectivenessFlickerFrames(
  action: TurnActionInfo,
  isAttackerPlayer: boolean,
  isAct1: boolean,
  usePlayerFront: boolean = false,
  useEnemyBack: boolean = false
): any[] {
  // 깜빡임(점멸) 및 깜빡임 직후 체력 게이지 감소 애니메이션은
  // applyDamageBlinkFrames에서 공식 포켓몬 타이밍에 맞추어 단일 통합 처리됩니다.
  return [];
}

/**
 * Creates dedicated end-of-turn residual damage animation frames (poison, burn, trap, weather).
 * Plays before the faint frames and final hold frame so end-of-turn damage has a smooth blink + drain
 * instead of abruptly jumping on the final hold frame!
 */
function createResidualDamageFrames(
  postEnemyHp: number,
  finalEnemyHp: number,
  postPlayerHp: number,
  finalPlayerHp: number,
  playerFrontHold: boolean,
  enemyBackHold: boolean,
  isPlayerEndingEvading: boolean,
  isEnemyEndingEvading: boolean,
  lastAction: any
): BattleFrame[] {
  const enemyLoss = postEnemyHp - finalEnemyHp;
  const playerLoss = postPlayerHp - finalPlayerHp;
  if (enemyLoss <= 0 && playerLoss <= 0) return [];

  const base: BattleFrame = {
    delay: 50,
    pOffset: isPlayerEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
    eOffset: isEnemyEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
    pAlpha: 1.0,
    eAlpha: 1.0,
    hidePShadow: isPlayerEndingEvading,
    hideEShadow: isEnemyEndingEvading,
    hidePlayer: isPlayerEndingEvading,
    hideEnemy: isEnemyEndingEvading,
    hideUI: false,
    hideHud: false,
    hideDialogue: false,
    showEffect: false,
    hitFlash: false,
    usePlayerFront: playerFrontHold,
    useEnemyBack: enemyBackHold,
    enemyHp: postEnemyHp,
    playerHp: postPlayerHp,
    textLineIdx: 99,
    statProgress: undefined,
    isBlur: false,
    moveEffect: lastAction,
    afterCameraReturn: true,
  };

  const frames: BattleFrame[] = [];

  // 1. Brief pause before residual damage triggers (350ms)
  frames.push({
    ...base,
    delay: 350,
    phaseId: "residual-damage-pre",
    phaseName: "상태이상/구속 데미지 발생",
  });

  // 2. Sprite Blink (2 cycles, 50ms off / 50ms on)
  for (let c = 0; c < 2; c++) {
    // Off frame
    frames.push({
      ...base,
      delay: 50,
      pAlpha: playerLoss > 0 ? 0.20 : 1.0,
      eAlpha: enemyLoss > 0 ? 0.20 : 1.0,
      pOffset: playerLoss > 0 ? { x: (c % 2 === 0 ? 3 : -2), y: 0 } : (isPlayerEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 }),
      eOffset: enemyLoss > 0 ? { x: (c % 2 === 0 ? -3 : 2), y: 0 } : (isEnemyEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 }),
      phaseId: `residual-blink-${c + 1}-off`,
      phaseName: `상태이상 피격 깜빡임 ${c + 1}`,
    });
    // On frame
    frames.push({
      ...base,
      delay: 50,
      pAlpha: 1.0,
      eAlpha: 1.0,
      phaseId: `residual-blink-${c + 1}-on`,
      phaseName: `상태이상 피격 복귀 ${c + 1}`,
    });
  }

  // 3. Smooth HP Drain (4 steps)
  const steps = 4;
  for (let s = 1; s <= steps; s++) {
    const progress = s / steps;
    const t = Math.sin((progress * Math.PI) / 2);
    const curEnemyHp = enemyLoss > 0 ? Math.max(finalEnemyHp, Math.round(postEnemyHp - enemyLoss * t)) : postEnemyHp;
    const curPlayerHp = playerLoss > 0 ? Math.max(finalPlayerHp, Math.round(postPlayerHp - playerLoss * t)) : postPlayerHp;
    const isLast = (s === steps);

    frames.push({
      ...base,
      delay: isLast ? 220 : 90,
      enemyHp: curEnemyHp,
      playerHp: curPlayerHp,
      phaseId: `residual-hp-drain-${s}`,
      phaseName: `상태이상 체력 감소 (${Math.round(progress * 100)}%)`,
    });
  }

  // 4. Settling pause (250ms)
  frames.push({
    ...base,
    delay: 250,
    enemyHp: finalEnemyHp,
    playerHp: finalPlayerHp,
    phaseId: "residual-settle",
    phaseName: "상태이상 데미지 안착",
  });

  return frames;
}

/**
 * Creates dedicated 3-step post-move stat change animation frames.
 * Plays AFTER the move attack finishes, emitting rising/falling particles while dialogue states the stat change.
 */
function createStatChangeFrames(
  action: TurnActionInfo,
  isAttackerPlayer: boolean,
  dialogueTextIdx: number = 1,
  usePlayerFront: boolean = false,
  useEnemyBack: boolean = false
): any[] {
  if (!action.statChanges || action.statChanges.length === 0) {
    return [];
  }

  const isP = isAttackerPlayer;
  const isBoost = action.statChanges.some(sc => sc.direction === "up");
  const statTypeName = isBoost ? "능력치 상승" : "능력치 하락";

  return [
    // Step 1: Wave 1 soaring up from ground (150ms)
    {
      phaseId: "stat-change-1",
      phaseName: `${statTypeName} 파티클 1단계`,
      delay: 150,
      pOffset: (usePlayerFront && isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      eOffset: (useEnemyBack && !isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      targetAlpha: 1.0,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: 0.18,
      isBlur: false,
      moveEffect: action,
      cameraZoom: 1.0,
      cameraFocal: null,
      _gen5Camera: false,
      afterCameraReturn: true,
    },
    // Step 2: Wave 1 fading, Wave 2 soaring up from ground (150ms)
    {
      phaseId: "stat-change-2",
      phaseName: `${statTypeName} 파티클 2단계`,
      delay: 150,
      pOffset: (usePlayerFront && isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      eOffset: (useEnemyBack && !isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      targetAlpha: 1.0,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: 0.45,
      isBlur: false,
      moveEffect: action,
      cameraZoom: 1.0,
      cameraFocal: null,
      _gen5Camera: false,
      afterCameraReturn: true,
    },
    // Step 3: Wave 2 fading, Wave 3 soaring up from ground (160ms)
    {
      phaseId: "stat-change-3",
      phaseName: `${statTypeName} 파티클 3단계`,
      delay: 160,
      pOffset: (usePlayerFront && isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      eOffset: (useEnemyBack && !isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      targetAlpha: 1.0,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: 0.72,
      isBlur: false,
      moveEffect: action,
      cameraZoom: 1.0,
      cameraFocal: null,
      _gen5Camera: false,
      afterCameraReturn: true,
    },
    // Step 4: Wave 3 reaching apex and cleanly dissolving (180ms)
    {
      phaseId: "stat-change-4",
      phaseName: `${statTypeName} 파티클 클라이맥스`,
      delay: 180,
      pOffset: (usePlayerFront && isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      eOffset: (useEnemyBack && !isP) ? { x: 0, y: 0 } : { x: 0, y: 0 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      targetAlpha: 1.0,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: 0.95,
      isBlur: false,
      moveEffect: action,
      cameraZoom: 1.0,
      cameraFocal: null,
      _gen5Camera: false,
      afterCameraReturn: true,
    },
  ];
}

/**
 * Creates a smooth 4-step sinking faint animation when a Pokémon reaches 0 HP
 */
function createFaintingFrames(
  action: TurnActionInfo,
  target: "player" | "enemy" | "both" | boolean,
  dialogueTextIdx: number = 99,
  usePlayerFront: boolean = false,
  useEnemyBack: boolean = false
): any[] {
  const isTargetPlayer = target === "player" || target === "both" || target === true;
  const isEnemy = target === "enemy" || target === "both" || (typeof target === "boolean" && !target);

  return [
    // Step 1: Initial stumble and start sinking (140ms)
    {
      delay: 140,
      pOffset: isTargetPlayer ? { x: 0, y: 18 } : { x: 0, y: 0 },
      eOffset: isEnemy ? { x: 0, y: 18 } : { x: 0, y: 0 },
      pAlpha: isTargetPlayer ? 0.85 : 1.0,
      eAlpha: isEnemy ? 0.85 : 1.0,
      showEffect: false,
      hitFlash: false,
      usePlayerFront: usePlayerFront,
      useEnemyBack: useEnemyBack,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: undefined,
      isBlur: false,
      moveEffect: action,
    },
    // Step 2: Sinking deeper into the platform (140ms)
    {
      delay: 140,
      pOffset: isTargetPlayer ? { x: 0, y: 46 } : { x: 0, y: 0 },
      eOffset: isEnemy ? { x: 0, y: 46 } : { x: 0, y: 0 },
      pAlpha: isTargetPlayer ? 0.55 : 1.0,
      eAlpha: isEnemy ? 0.55 : 1.0,
      showEffect: false,
      hitFlash: false,
      usePlayerFront: usePlayerFront,
      useEnemyBack: useEnemyBack,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: undefined,
      isBlur: false,
      moveEffect: action,
    },
    // Step 3: Submerged / nearly gone (140ms)
    {
      delay: 140,
      pOffset: isTargetPlayer ? { x: 0, y: 80 } : { x: 0, y: 0 },
      eOffset: isEnemy ? { x: 0, y: 80 } : { x: 0, y: 0 },
      pAlpha: isTargetPlayer ? 0.20 : 1.0,
      eAlpha: isEnemy ? 0.20 : 1.0,
      showEffect: false,
      hitFlash: false,
      usePlayerFront: usePlayerFront,
      useEnemyBack: useEnemyBack,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: undefined,
      isBlur: false,
      moveEffect: action,
    },
    // Step 4: Fully fainted / platform empty (350ms)
    {
      delay: 350,
      pOffset: isTargetPlayer ? { x: 0, y: -9999 } : { x: 0, y: 0 },
      eOffset: isEnemy ? { x: 0, y: -9999 } : { x: 0, y: 0 },
      pAlpha: isTargetPlayer ? 0.0 : 1.0,
      eAlpha: isEnemy ? 0.0 : 1.0,
      hidePlayer: isTargetPlayer,
      hideEnemy: isEnemy,
      showEffect: false,
      hitFlash: false,
      usePlayerFront: usePlayerFront,
      useEnemyBack: useEnemyBack,
      enemyHp: action.enemyHpAfter,
      playerHp: action.playerHpAfter,
      textLineIdx: dialogueTextIdx,
      statProgress: undefined,
      isBlur: false,
      moveEffect: action,
    }
  ];
}

/**
 * Creates the adorable Hug animation cutscene:
 * 1. Switches player Pokémon to front-sprite view, hops towards camera (moving left & downward, growing via perspective).
 * 2. Tilts forward slightly to embrace for 1 second (1000ms).
 * 3. Switches back to rear view and hops back to original position and scale.
 */
function createHugAnimationFrames(
  currentEnemyHp: number,
  currentPlayerHp: number,
  dialogueTextIdx: number = 1,
  extraDownOffset: number = 0
): any[] {
  const d1 = Math.round(extraDownOffset * 0.20);
  const d2 = Math.round(extraDownOffset * 0.45);
  const d3 = Math.round(extraDownOffset * 0.75);
  const dFull = extraDownOffset;

  return [
    // 1. Approach towards camera: 3 bouncy hops moving substantially downwards into foreground (up to 5.0x)
    // --- HOP 1: First leap forward ---
    {
      delay: 100,
      pOffset: { x: 0, y: 15 + d1 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1.70, y: 1.70 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: true,
      useEnemyBack: false,
      hidePShadow: true,
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-approach",
      phaseName: "포옹 다가오기 (1단 도약, 1.70배)",
    },
    {
      delay: 90,
      pOffset: { x: 0, y: 70 + d1 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 2.30, y: 2.15 }, // 착지 스쿼시
      showEffect: false,
      hitFlash: false,
      usePlayerFront: true,
      useEnemyBack: false,
      hidePShadow: true,
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-approach",
      phaseName: "포옹 다가오기 (1단 착지, 2.30배)",
    },

    // --- HOP 2: Second leap forward closer ---
    {
      delay: 100,
      pOffset: { x: 0, y: 55 + d2 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 3.10, y: 3.10 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: true,
      useEnemyBack: false,
      hidePShadow: true,
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-approach",
      phaseName: "포옹 다가오기 (2단 도약, 3.10배)",
    },
    {
      delay: 90,
      pOffset: { x: 0, y: 135 + d2 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 3.80, y: 3.60 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: true,
      useEnemyBack: false,
      hidePShadow: true,
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-approach",
      phaseName: "포옹 다가오기 (2단 착지, 3.80배)",
    },

    // --- HOP 3: Third leap directly in front of camera/screen ---
    {
      delay: 100,
      pOffset: { x: 0, y: 115 + d3 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 4.30, y: 4.30 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: true,
      useEnemyBack: false,
      hidePShadow: true,
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-approach",
      phaseName: "포옹 다가오기 (3단 도약, 4.30배)",
    },
    // 마지막 가까이다가오는 1프레임: 메시지창 & 텍스트 Z축보다 위에 렌더링 (아래로 깊게 이동)
    {
      delay: 100,
      pOffset: { x: 0, y: 220 + dFull },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 4.80, y: 4.70 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: true,
      useEnemyBack: false,
      hidePShadow: true,
      drawPlayerAboveHud: true, // 메시지창 및 텍스트보다 Z축 위에 렌더링!
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-approach",
      phaseName: "포옹 도착 (4.8배 초대형, 화면 하단 밀착)",
    },

    // 2. Hug phase: Leaning forward towards camera for 1 second (1000ms), 5.0x super close-up hug!
    {
      delay: 1000,
      pOffset: { x: 0, y: 235 + dFull },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 5.00, y: 5.00 }, // 화면 가득 5배 크기 포옹!
      pRot: -0.06, // 앞쪽으로 살짝 기울여 안아주기
      showEffect: false,
      hitFlash: false,
      usePlayerFront: true,
      useEnemyBack: false,
      hidePShadow: true,
      drawPlayerAboveHud: true, // 메시지창 및 텍스트보다 Z축 위에 렌더링!
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-embrace",
      phaseName: "포옹 (1초간 안아주기, 5배 초대형, 화면 하단 밀착)",
    },

    // 3. Return phase: Switch back to rear sprite, 3 bouncy hops back to platform
    // --- HOP 1 back ---
    {
      delay: 90,
      pOffset: { x: 0, y: 150 + d3 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 4.10, y: 4.10 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      hidePShadow: true,
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-return",
      phaseName: "포옹 복귀 (후면 전환 후 1단 도약)",
    },
    {
      delay: 90,
      pOffset: { x: 0, y: 115 + d2 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 3.30, y: 3.30 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      hidePShadow: true,
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-return",
      phaseName: "포옹 복귀 (1단 착지, 3.3배)",
    },

    // --- HOP 2 back ---
    {
      delay: 90,
      pOffset: { x: 0, y: 50 + d2 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 2.50, y: 2.50 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      hidePShadow: true,
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-return",
      phaseName: "포옹 복귀 (2단 도약, 2.5배)",
    },
    {
      delay: 90,
      pOffset: { x: 0, y: 65 + d1 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1.80, y: 1.80 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      hidePShadow: true,
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-return",
      phaseName: "포옹 복귀 (2단 착지, 1.8배)",
    },

    // --- HOP 3 back ---
    {
      delay: 90,
      pOffset: { x: 0, y: -10 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1.30, y: 1.30 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      hidePShadow: true,
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-return",
      phaseName: "포옹 복귀 (3단 도약)",
    },
    {
      delay: 120,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1.0, y: 1.0 },
      showEffect: false,
      hitFlash: false,
      usePlayerFront: false,
      useEnemyBack: false,
      hidePShadow: false,
      targetAlpha: 1.0,
      enemyHp: currentEnemyHp,
      playerHp: currentPlayerHp,
      textLineIdx: dialogueTextIdx,
      isBlur: false,
      cameraZoom: 1.0,
      cameraPan: { x: 0, y: 0 },
      cameraFocal: null,
      _gen5Camera: false,
      phaseId: "hug-return",
      phaseName: "포옹 복귀 완료 (제자리 원래크기)",
    },
  ];
}

function isEvasionLaunch(action?: TurnActionInfo | null): boolean {
  if (!action) return false;
  const k = (action.moveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
  if (!["fly", "dig", "dive", "bounce", "shadow-force", "phantom-force"].includes(k)) return false;
  if (action.isTurn1Launch || action.chargingMove === "dig") return true;
  return (action.damage ?? 0) === 0 && (
    action.log?.includes("날아올랐다") || action.log?.includes("flew up") ||
    action.log?.includes("파고들었다") || action.log?.includes("burrowed") ||
    action.log?.includes("땅속으로") || action.log?.includes("dug a hole") ||
    action.log?.includes("잠수했다") || action.log?.includes("underwater") ||
    action.log?.includes("모습을 감췄다") || action.log?.includes("vanished") ||
    action.log?.includes("튀어올랐다") || action.log?.includes("bounced")
  );
}

function isEvasionStrike(action?: TurnActionInfo | null): boolean {
  if (!action) return false;
  const k = (action.moveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
  if (!["fly", "dig", "dive", "bounce", "shadow-force", "phantom-force"].includes(k)) return false;
  return !isEvasionLaunch(action);
}

function createAirGlideDescentFrames(
  eff: any,
  isAttackerPlayer: boolean,
  textLineIdx: number = 1
): any[] {
  const isP = isAttackerPlayer;
  return [
    // 1. High Sky Glide (66ms) - Pokémon gliding smoothly across the high azure sky
    {
      delay: 66,
      diveStep: 1,
      skyCameraTilt: 0.0,
      pOffset: { x: 0, y: -10 },
      eOffset: { x: 0, y: -10 },
      pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
      eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
      pRot: 0,
      eRot: 0,
      isHighSkyCutscene: true,
      hideUI: true,
      isAttackerPlayer: isP,
      showEffect: false,
      hitFlash: false,
      enemyHp: eff.enemyHpAfter,
      playerHp: eff.playerHpAfter,
      textLineIdx,
      isBlur: false,
      moveEffect: eff,
    },
    // 2. Diagonal Swoop Bank (66ms) - Smooth banking transition towards the battlefield
    {
      delay: 66,
      diveStep: 2,
      skyCameraTilt: isP ? 0.35 : -0.35,
      pOffset: { x: 0, y: 15 },
      eOffset: { x: 0, y: 15 },
      pScale: isP ? { x: 1.80, y: 0.45 } : undefined,
      eScale: !isP ? { x: 1.80, y: 0.45 } : undefined,
      pRot: 0,
      eRot: 0,
      isHighSkyCutscene: true,
      hideUI: true,
      isAttackerPlayer: isP,
      showEffect: false,
      hitFlash: false,
      enemyHp: eff.enemyHpAfter,
      playerHp: eff.playerHpAfter,
      textLineIdx,
      isBlur: false,
      moveEffect: eff,
    },
    // 3. Smooth Air Swoop onto Battlefield Platform (66ms) - Swooping in gracefully before move start
    {
      delay: 66,
      pOffset: isP ? { x: 0, y: -35 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: 0, y: -35 } : { x: 0, y: 0 },
      pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
      eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
      pRot: 0,
      eRot: 0,
      isHighSkyCutscene: false,
      hideUI: false,
      isAttackerPlayer: isP,
      showEffect: false,
      hitFlash: false,
      enemyHp: eff.enemyHpAfter,
      playerHp: eff.playerHpAfter,
      textLineIdx,
      isBlur: false,
      moveEffect: eff,
    },
  ];
}

function drawHighSkyCutscene(
  ctx: any,
  width: number,
  height: number,
  f: any,
  attackerSprite: any
) {
  ctx.save();

  // Camera Tilt Angle (0 = level straight flight, -0.30 to -0.78 = diagonal bank)
  const cameraTilt = f.skyCameraTilt || 0;
  const isDiagonalBank = Math.abs(cameraTilt) > 0.05;

  // Apply Camera Tilt Transform centered at canvas center
  ctx.translate(width / 2, height / 2);
  if (cameraTilt) {
    ctx.rotate(cameraTilt);
  }

  // Large bounding size to cover entire screen seamlessly when rotated
  const bgSize = Math.max(width, height) * 1.8;

  // 1. Clear Atmospheric Sky Gradient (Distinct Top Space Navy vs Bottom Horizon Cyan)
  const skyGrad = ctx.createLinearGradient(0, -bgSize / 2, 0, bgSize / 2);
  skyGrad.addColorStop(0, "#080E1E");    // Top: Deep Stratosphere (Space Navy)
  skyGrad.addColorStop(0.35, "#0369A1"); // Mid-Upper: High Azure Sky
  skyGrad.addColorStop(0.65, "#38BDF8"); // Horizon: Light Atmosphere Blue
  skyGrad.addColorStop(0.85, "#BAE6FD"); // Lower Atmosphere: Bright Cyan
  skyGrad.addColorStop(1, "#E0F2FE");    // Bottom: Horizon Atmosphere Glow

  ctx.fillStyle = skyGrad;
  ctx.fillRect(-bgSize / 2, -bgSize / 2, bgSize, bgSize);

  // 2. Dynamic Speedlines (Streaming horizontally relative to flight direction)
  const stepSeed = (f.diveStep || 0) * 53;
  const numLines = isDiagonalBank ? 32 : 22;
  for (let i = 0; i < numLines; i++) {
    const lx = ((i * 39 + stepSeed * 9) % bgSize) - bgSize / 2;
    const ly = ((i * 43 + stepSeed * 4) % (bgSize * 0.65)) - bgSize * 0.32;
    const len = 80 + (i % 4) * 40;

    ctx.save();
    ctx.strokeStyle = (i % 2 === 0) ? "rgba(255, 255, 255, 0.85)" : "rgba(186, 230, 253, 0.55)";
    ctx.lineWidth = (i % 3 === 0) ? 2.5 : 1.3;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx - len, ly);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Gliding / Banking Pokémon Sprite
  if (attackerSprite) {
    ctx.save();
    const isP = f.isAttackerPlayer !== false;
    let ox = f.skyOffset?.x ?? (isP ? f.pOffset?.x : f.eOffset?.x) ?? 0;
    let oy = f.skyOffset?.y ?? (isP ? f.pOffset?.y : f.eOffset?.y) ?? 0;
    if (Math.abs(oy) > 400) oy = 0; // Guard against -9999 evasion offset
    if (Math.abs(ox) > 400) ox = 0;

    const scale = isP ? f.pScale : f.eScale;
    const rot = (isP ? f.pRot : f.eRot) || 0;

    ctx.translate(ox, oy);
    if (rot) ctx.rotate(rot);

    if (scale) ctx.scale(scale.x, scale.y);
    drawFittedBattleSprite(ctx, attackerSprite, 0, 65, 130);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 5th Generation (Black/White) style smooth continuous camera tracking
 * Automatically detects attack action phases and establishes a rock-solid
 * trapezoidal camera envelope: zooms in once smoothly upon lunge, stays locked at peak 1.38x
 * across all multi-hits and effectiveness blinks without ANY oscillation ("확축확축" 방지),
 * and glides smoothly back out when the turn ends.
 */
export async function renderBattleMoveGif(options: BattleAnimationOptions): Promise<RenderGifResult> {
  const logicalWidth = 560;
  const logicalHeight = 380;
  const renderScale = 0.75; // 420x285 (44% pixel reduction, 2.3x faster encoding!)
  const width = Math.round(logicalWidth * renderScale);   // 420
  const height = Math.round(logicalHeight * renderScale); // 285
  const isKo = options.lang === "ko";
  const battle = options.battle;
  const enemy = battle.enemy;
  const playerMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];

  const moveKey = options.moveKey || battle.lastMoveEffect?.moveKey || "tackle";
  const type = options.type || battle.lastMoveEffect?.type || "normal";
  const isSpecial = options.isSpecial !== undefined ? options.isSpecial : (battle.lastMoveEffect?.isSpecial ?? false);
  const isPlayer = options.isPlayerAttacking !== undefined ? options.isPlayerAttacking : (battle.lastMoveEffect?.isPlayerAttacking ?? true);

  const fallbackDialogue = (battle.dialogueText && battle.dialogueText.trim().length > 0)
    ? battle.dialogueText
    : ((battle.turnActions && battle.turnActions.length > 0)
      ? battle.turnActions.map((a: any) => a.log).filter(Boolean).join("\n")
      : "");
  const dialogueLines = options.dialogueLines || fallbackDialogue.replace(/\\n/g, "\n").split("\n");

  const em = BATTLE_LAYOUT_CONFIG.enemyPokemon;
  const pm = BATTLE_LAYOUT_CONFIG.playerPokemon;

  const enemyActiveSpecies = (enemy as any).isTransformed ? ((enemy as any).transformedSpeciesId || enemy.speciesId || (enemy as any).species) : (enemy.speciesId || (enemy as any).species);
  const playerActiveSpecies = (playerMon as any).isTransformed
    ? ((playerMon as any).transformedSpeciesId || playerMon.speciesId || (playerMon as any).species)
    : ((playerMon as any).hasIllusion && (playerMon as any).illusionTarget ? ((playerMon as any).illusionTarget.speciesId || (playerMon as any).illusionTarget.species) : (playerMon.speciesId || (playerMon as any).species));

  const enemyShinyTier = (enemy as any).shinyTier !== undefined ? (enemy as any).shinyTier : (enemy.isShiny ? 1 : 0);
  const playerShinyTier = ((playerMon as any).hasIllusion && (playerMon as any).illusionTarget)
    ? ((playerMon as any).illusionTarget.shinyTier !== undefined ? (playerMon as any).illusionTarget.shinyTier : ((playerMon as any).illusionTarget.isShiny ? 1 : 0))
    : ((playerMon as any).shinyTier !== undefined ? (playerMon as any).shinyTier : ((playerMon as any).isShiny ? 1 : 0));

  const [arena, pbAssets, enemySprite, playerSprite, playerFrontSprite, enemyBackSprite] = await Promise.all([
    getArenaAssets(battle.biome || "Town"),
    getPbInfoAssets(),
    getPokemonSprite(enemyActiveSpecies, true, enemyShinyTier, false),
    getPokemonSprite(playerActiveSpecies, true, playerShinyTier, true),
    getPokemonSprite(playerActiveSpecies, true, playerShinyTier, false),
    getPokemonSprite(enemyActiveSpecies, true, enemyShinyTier, true),
  ]);

  // ============================================================================
  // 🎨 [GIF 렌더링 표준 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
  // - 인코더: Octree 양자화 + useOptimizer 활성화 (useOptimizer = true)
  // - 유사도 임계치: threshold = 85 (화면 85% 이상 유사 시 256색 팔레트 재사용)
  // - 기술 제작 기준: 256색 팔레트 재사용 환경을 표준으로 제작하며,
  //   30 FPS 부드러운 애니메이션과 반투명 이펙트를 온전히 유지하면서 고속 렌더링 지원
  // ============================================================================
  const encoder = new GIFEncoder(width, height, "octree", true);
  encoder.setThreshold(30);
  encoder.setRepeat(-1);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const turnActions = battle.turnActions || [];
  const hasMultipleActions = turnActions.length >= 2;

  const a1 = turnActions[0] || {
    actor: isPlayer ? "player" : "enemy",
    moveKey,
    moveNameKo: moveKey,
    moveNameEn: moveKey,
    type,
    isSpecial,
    isPlayerAttacking: isPlayer,
    enemyHpAfter: enemy.hp,
    playerHpAfter: playerMon.hp,
    statChanges: battle.lastMoveEffect?.statChanges,
    hitCount: (battle.lastMoveEffect as any)?.hitCount,
  };
  const isP1 = a1.actor === "player";

  // Pre-action initial HP before ANY damage in this turn occurs!
  const initialEnemyHp = a1.enemyHpBefore !== undefined
    ? a1.enemyHpBefore
    : (isP1 ? (a1.enemyHpAfter + (a1.damage || 0)) : a1.enemyHpAfter);
  const initialPlayerHp = a1.playerHpBefore !== undefined
    ? a1.playerHpBefore
    : (!isP1 ? (a1.playerHpAfter + (a1.damage || 0)) : a1.playerHpAfter);

  const enemyHp = initialEnemyHp;
  const playerHp = initialPlayerHp;
  let mKey1 = getMoveKey(a1.moveKey || a1.moveName);
  if (mKey1 === "solar-beam" && (a1.isTurn1Launch || a1.chargingMove === "solar-beam" || a1.log?.includes("빛을 흡수") || a1.log?.includes("sunlight"))) {
    mKey1 = "solar-beam-charge";
  }
  const isChop1 = (mKey1 === "karate-chop" || mKey1 === "karatechop");
  const isSlap1 = (mKey1 === "double-slap" || mKey1 === "doubleslap");
  const isPunch1 = (mKey1 === "comet-punch" || mKey1 === "cometpunch");
  const isMegaPunch1 = (mKey1 === "mega-punch" || mKey1 === "megapunch");
  const isPayDay1 = (mKey1 === "pay-day" || mKey1 === "payday");
  const isFirePunch1 = (mKey1 === "fire-punch" || mKey1 === "firepunch");
  const isIcePunch1 = (mKey1 === "ice-punch" || mKey1 === "icepunch");
  const isGuillotine1 = (mKey1 === "guillotine" || mKey1 === "horn-drill" || mKey1 === "horndrill" || mKey1 === "fissure");
  const isSwordsDance1 = (mKey1 === "swords-dance" || mKey1 === "swordsdance");
  const isFly1 = (mKey1 === "fly");
  const isRazorWind1 = (mKey1 === "razor-wind" || mKey1 === "razorwind");
  const isWingAttack1 = (mKey1 === "wing-attack" || mKey1 === "wingattack");
  const isWhirlwind1 = (mKey1 === "whirlwind");
  const isBind1 = (mKey1 === "bind" || mKey1 === "wrap" || mKey1 === "clamp" || mKey1 === "sand-tomb" || mKey1 === "whirlpool" || mKey1 === "fire-spin" || mKey1 === "infestation" || mKey1 === "snap-trap");
  const isSlam1 = (mKey1 === "slam");
  const isVineWhip1 = (mKey1 === "vine-whip" || mKey1 === "vinewhip");
  const isStomp1 = (mKey1 === "stomp");
  const isDoubleKick1 = (mKey1 === "double-kick" || mKey1 === "doublekick");
  const isSingleStrikeSpecial1 = (
    mKey1 === "thunder-punch" || mKey1 === "thunderpunch" ||
    mKey1 === "scratch" ||
    mKey1 === "vice-grip" || mKey1 === "vicegrip" ||
    mKey1 === "cut" ||
    mKey1 === "gust"
  );

  const moveData1 = getMoveData(mKey1);
  const isCharging1 = isEvasionLaunch(a1);
  const isEvasionHit1 = isEvasionStrike(a1);
  const isStatusMove1 = (moveData1?.category === "status" || (a1 as any).category === "status" || ((a1.damage ?? 0) === 0 && !isCharging1 && !isEvasionHit1)) && !isSwordsDance1 && !isWhirlwind1;

  const isHit1 = a1.isHit !== undefined ? a1.isHit : ((a1.damage ?? 0) > 0 || (!a1.log?.includes("빗나갔다") && !a1.log?.includes("missed") && !a1.log?.includes("빗나가")));
  const isMiss1 = !isHit1;

  const moveAnim1 = getMoveAnimation(mKey1, isStatusMove1);
  let act1Frames: any[] = moveAnim1.buildFrames({
    action: a1,
    isPlayer: isP1,
    isHit: isHit1,
    isMiss: isMiss1,
    enemyHp: initialEnemyHp,
    playerHp: initialPlayerHp,
    textLineIdx: 1,
    usePlayerFront: false,
    useEnemyBack: false,
  });

  const a1MoveKey = (a1.moveKey || moveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
    if (a1.wasDescentFromAir && a1MoveKey !== "fly") {
      act1Frames = [
        ...createAirGlideDescentFrames(a1, isP1, 1),
        ...act1Frames
      ];
    }

  // [유저 요구사항] 상성/데미지에 따른 대상 스프라이트 깜빡임(Blink) 프레임 적용
  act1Frames = applyDamageBlinkFrames(act1Frames, a1, isP1);

  if (a1.canAct === false) {
    act1Frames = [
      {
        delay: 850,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        cameraZoom: 1.0,
        cameraPan: { x: 0, y: 0 },
        cameraFocal: null,
        _gen5Camera: false,
        afterCameraReturn: true,
        hideUI: false,
        hideHud: false,
        hideDialogue: false,
        phaseId: "cannot-act-1",
        phaseName: "행동 불가",
        showEffect: false,
        hitFlash: false,
        enemyHp: initialEnemyHp,
        playerHp: initialPlayerHp,
        textLineIdx: 1,
        moveEffect: a1,
      }
    ];
  }

  let framesConfig: any[] = [];

  if (hasMultipleActions) {
    const a2 = turnActions[1];
    const isP2 = a2.actor === "player";
    let mKey2 = getMoveKey(a2.moveKey || a2.moveName);
    if (mKey2 === "solar-beam" && (a2.isTurn1Launch || a2.chargingMove === "solar-beam" || a2.log?.includes("빛을 흡수") || a2.log?.includes("sunlight"))) {
      mKey2 = "solar-beam-charge";
    }
    const isChop2 = (mKey2 === "karate-chop" || mKey2 === "karatechop");
    const isSlap2 = (mKey2 === "double-slap" || mKey2 === "doubleslap");
    const isPunch2 = (mKey2 === "comet-punch" || mKey2 === "cometpunch");
    const isMegaPunch2 = (mKey2 === "mega-punch" || mKey2 === "megapunch");
    const isPayDay2 = (mKey2 === "pay-day" || mKey2 === "payday");
    const isFirePunch2 = (mKey2 === "fire-punch" || mKey2 === "firepunch");
    const isIcePunch2 = (mKey2 === "ice-punch" || mKey2 === "icepunch");
    const isGuillotine2 = (mKey2 === "guillotine" || mKey2 === "horn-drill" || mKey2 === "horndrill" || mKey2 === "fissure");
    const isSwordsDance2 = (mKey2 === "swords-dance" || mKey2 === "swordsdance");
    const isFly2 = (mKey2 === "fly");
    const isRazorWind2 = (mKey2 === "razor-wind" || mKey2 === "razorwind");
    const isWingAttack2 = (mKey2 === "wing-attack" || mKey2 === "wingattack");
    const isWhirlwind2 = (mKey2 === "whirlwind");
    const isBind2 = (mKey2 === "bind" || mKey2 === "wrap" || mKey2 === "clamp" || mKey2 === "sand-tomb" || mKey2 === "whirlpool" || mKey2 === "fire-spin" || mKey2 === "infestation" || mKey2 === "snap-trap");
    const isSlam2 = (mKey2 === "slam");
    const isVineWhip2 = (mKey2 === "vine-whip" || mKey2 === "vinewhip");
    const isStomp2 = (mKey2 === "stomp");
    const isDoubleKick2 = (mKey2 === "double-kick" || mKey2 === "doublekick");
    const isSingleStrikeSpecial2 = (
      mKey2 === "thunder-punch" || mKey2 === "thunderpunch" ||
      mKey2 === "scratch" ||
      mKey2 === "vice-grip" || mKey2 === "vicegrip" ||
      mKey2 === "cut" ||
      mKey2 === "gust"
    );

    const moveData2 = getMoveData(mKey2);
    const isCharging2 = isEvasionLaunch(a2);
    const isEvasionHit2 = isEvasionStrike(a2);
    const isStatusMove2 = (moveData2?.category === "status" || (a2 as any).category === "status" || ((a2.damage ?? 0) === 0 && !isCharging2 && !isEvasionHit2)) && !isSwordsDance2 && !isWhirlwind2;

    const isHit2 = a2.isHit !== undefined ? a2.isHit : ((a2.damage ?? 0) > 0 || (!a2.log?.includes("빗나갔다") && !a2.log?.includes("missed") && !a2.log?.includes("빗나가")));
    const isMiss2 = !isHit2;

    const moveAnim2 = getMoveAnimation(mKey2, isStatusMove2);
    let act2Frames: any[] = moveAnim2.buildFrames({
      action: a2,
      isPlayer: isP2,
      isHit: isHit2,
      isMiss: isMiss2,
      enemyHp: a2.enemyHpBefore !== undefined ? a2.enemyHpBefore : a1.enemyHpAfter,
      playerHp: a2.playerHpBefore !== undefined ? a2.playerHpBefore : a1.playerHpAfter,
      textLineIdx: 3,
      usePlayerFront: false,
      useEnemyBack: false,
    });

    const a2MoveKey = (a2.moveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
    if (a2.wasDescentFromAir && a2MoveKey !== "fly") {
      act2Frames = [
        ...createAirGlideDescentFrames(a2, isP2, 3),
        ...act2Frames
      ];
    }

    // [유저 요구사항] 상성/데미지에 따른 대상 스프라이트 깜빡임(Blink) 프레임 적용
    act2Frames = applyDamageBlinkFrames(act2Frames, a2, isP2);

    if (a2.canAct === false) {
      act2Frames = [
        {
          delay: 850,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          cameraZoom: 1.0,
          cameraPan: { x: 0, y: 0 },
          cameraFocal: null,
          _gen5Camera: false,
          afterCameraReturn: true,
          hideUI: false,
          hideHud: false,
          hideDialogue: false,
          phaseId: "cannot-act-2",
          phaseName: "행동 불가",
          showEffect: false,
          hitFlash: false,
          enemyHp: a1.enemyHpAfter,
          playerHp: a1.playerHpAfter,
          textLineIdx: 3,
          moveEffect: a2,
        }
      ];
    }

    const a1Fainted = a1.enemyHpAfter <= 0 || a1.playerHpAfter <= 0;
    const a2Fainted = a2 && (a2.enemyHpAfter <= 0 || a2.playerHpAfter <= 0);

    // Turn-around victory pose persists whenever Guillotine successfully hits!
    const isP1GuillotineKill = isP1 && isGuillotine1 && (a1.enemyHpAfter <= 0 || isHit1);
    const isP2GuillotineKill = isP2 && isGuillotine2 && ((a2 ? a2.enemyHpAfter <= 0 : false) || isHit2);
    const isE1GuillotineKill = !isP1 && isGuillotine1 && (a1.playerHpAfter <= 0 || isHit1);
    const isE2GuillotineKill = !isP2 && isGuillotine2 && ((a2 ? a2.playerHpAfter <= 0 : false) || isHit2);

    const playerFrontHold = isP1GuillotineKill || isP2GuillotineKill;
    const enemyBackHold = isE1GuillotineKill || isE2GuillotineKill;

    const a3 = turnActions[2];
    const postActionEnemyHp = a3 ? a3.enemyHpAfter : (a2 ? a2.enemyHpAfter : a1.enemyHpAfter);
    const postActionPlayerHp = a3 ? a3.playerHpAfter : (a2 ? a2.playerHpAfter : a1.playerHpAfter);
    const finalEnemyHp = Math.min(enemy.hp, postActionEnemyHp);
    const finalPlayerHp = Math.min(playerMon.hp, postActionPlayerHp);

    const isWhirlwindHit1 = isWhirlwind1 && (a1.isHit !== false && !a1.log?.includes("통하지 않았다") && !a1.log?.includes("실패했다"));
    const isWhirlwindHit2 = isWhirlwind2 && (a2 ? (a2.isHit !== false && !a2.log?.includes("통하지 않았다") && !a2.log?.includes("실패했다")) : false);
    const hasWhirlwindSuccess = isWhirlwindHit1 || isWhirlwindHit2;

    const isEnemyFainted = (finalEnemyHp <= 0 || (enemy.hp <= 0 && !hasWhirlwindSuccess) || (battle.phase === "VICTORY" && !hasWhirlwindSuccess));
    const isPlayerFainted = (finalPlayerHp <= 0 || (playerMon.hp <= 0 && !hasWhirlwindSuccess) || (battle.phase === "DEFEAT" && !hasWhirlwindSuccess));
    const isAnyFainted = a1Fainted || a2Fainted || isEnemyFainted || isPlayerFainted;

    const faintAction = a2 || a1;
    const isFissureAction = ((faintAction?.moveKey || "").toLowerCase().replace(/[\s_]+/g, "-") === "fissure");
    const faintTarget = (isEnemyFainted && isPlayerFainted) ? "both" : (isPlayerFainted ? "player" : "enemy");
    const faintFrames = (isEnemyFainted || isPlayerFainted) && !isFissureAction
      ? createFaintingFrames(faintAction, faintTarget, 99, playerFrontHold, enemyBackHold)
      : [];

    const a1IsEvasionLaunch = isEvasionLaunch(a1);
    const a1IsEvasionStrike = isEvasionStrike(a1);
    const a2IsEvasionLaunch = isEvasionLaunch(a2);
    const a2IsEvasionStrike = isEvasionStrike(a2);

    const hasPlayerSemiInvulnerable = Boolean(
      (playerMon as any)?.semiInvulnerableState ||
      (playerMon as any)?.isSemiInvulnerable ||
      playerMon?.chargingMove === "fly" ||
      playerMon?.chargingMove === "dig" ||
      playerMon?.chargingMove === "dive" ||
      playerMon?.chargingMove === "bounce" ||
      playerMon?.chargingMove === "shadow-force" ||
      playerMon?.chargingMove === "phantom-force"
    );

    const hasEnemySemiInvulnerable = Boolean(
      (enemy as any)?.semiInvulnerableState ||
      (enemy as any)?.isSemiInvulnerable ||
      enemy?.chargingMove === "fly" ||
      enemy?.chargingMove === "dig" ||
      enemy?.chargingMove === "dive" ||
      enemy?.chargingMove === "bounce" ||
      enemy?.chargingMove === "shadow-force" ||
      enemy?.chargingMove === "phantom-force"
    );

    // Evasion state at START of turn (before Act 1 starts) - true if semi-invulnerable in air, unleashing evasion strike, or opponent missed into empty air
    const isPlayerStartingEvading = !a1IsEvasionLaunch && !a2IsEvasionLaunch && (
      hasPlayerSemiInvulnerable ||
      (a1IsEvasionStrike && isP1) ||
      (a2IsEvasionStrike && isP2) ||
      Boolean(a1 && (a1.log?.includes("닿지 않았다") || a1.log?.includes("couldn't reach") || a1.log?.includes("couldn't hit")) && !isP1) ||
      Boolean(a1?.wasDescentFromAir && isP1) ||
      Boolean(a2?.wasDescentFromAir && isP2)
    );
    const isEnemyStartingEvading = !a1IsEvasionLaunch && !a2IsEvasionLaunch && (
      hasEnemySemiInvulnerable ||
      (a1IsEvasionStrike && !isP1) ||
      (a2IsEvasionStrike && !isP2) ||
      Boolean(a1 && (a1.log?.includes("닿지 않았다") || a1.log?.includes("couldn't reach") || a1.log?.includes("couldn't hit")) && isP1) ||
      Boolean(a1?.wasDescentFromAir && !isP1) ||
      Boolean(a2?.wasDescentFromAir && !isP2)
    );

    // Evasion state during Act 1 (for non-acting Pokemon)
    const isPlayerEvadingDuringAct1 = isPlayerStartingEvading && !isP1;
    const isEnemyEvadingDuringAct1 = isEnemyStartingEvading && isP1;

    // Evasion state during Act 2 (for non-acting Pokemon)
    const isPlayerEvadingDuringAct2 = !isP2 && ((a1IsEvasionLaunch && isP1) || (isPlayerStartingEvading && !isP1 && !a1IsEvasionStrike));
    const isEnemyEvadingDuringAct2 = isP2 && ((a1IsEvasionLaunch && !isP1) || (isEnemyStartingEvading && isP1 && !a1IsEvasionStrike));

    // Evasion state during Mid-Turn Pause (between Act 1 and Act 2)
    const isPlayerMidTurnEvading = (a1IsEvasionLaunch && isP1) || (isPlayerStartingEvading && !a1IsEvasionStrike) || isPlayerEvadingDuringAct2;
    const isEnemyMidTurnEvading = (a1IsEvasionLaunch && !isP1) || (isEnemyStartingEvading && !a1IsEvasionStrike) || isEnemyEvadingDuringAct2;

    // Evasion state at END of turn (final hold frame)
    const isPlayerEndingEvading = (a1IsEvasionLaunch && isP1 && (!a2 || !isP2)) || (a2IsEvasionLaunch && isP2) || (hasPlayerSemiInvulnerable && !a1IsEvasionStrike && !a2IsEvasionStrike);
    const isEnemyEndingEvading = (a1IsEvasionLaunch && !isP1 && (!a2 || isP2)) || (a2IsEvasionLaunch && !isP2) || (hasEnemySemiInvulnerable && !a1IsEvasionStrike && !a2IsEvasionStrike);

    // Turn-end residual damage frames (poison, burn, trap, weather)
    const residualFrames = createResidualDamageFrames(
      postActionEnemyHp,
      finalEnemyHp,
      postActionPlayerHp,
      finalPlayerHp,
      playerFrontHold,
      enemyBackHold,
      isPlayerEndingEvading,
      isEnemyEndingEvading,
      a3 || a2 || a1
    );

    const isCameraNone1 = moveAnim1?.camera?.type === "none";
    let processedAct1Frames = act1Frames.map(f => ({
      ...f,
      isAttackerPlayer: isP1,
      hideUI: f.hideUI !== undefined ? f.hideUI : (isCameraNone1 ? false : (!f.afterCameraReturn && (f.delay === undefined || f.delay < 10000))),
    }));
    if (isEnemyEvadingDuringAct1) {
      processedAct1Frames = processedAct1Frames.map(f => f.isHighSkyCutscene ? f : ({ ...f, eOffset: { x: 0, y: -9999 }, hideEShadow: true, hideEnemy: true, eAlpha: 0.0 }));
    } else if (isPlayerEvadingDuringAct1) {
      processedAct1Frames = processedAct1Frames.map(f => f.isHighSkyCutscene ? f : ({ ...f, pOffset: { x: 0, y: -9999 }, hidePShadow: true, hidePlayer: true, pAlpha: 0.0 }));
    }

    const isCameraNone2 = moveAnim2?.camera?.type === "none";
    let processedAct2Frames = act2Frames.map(f => ({
      ...f,
      isAttackerPlayer: isP2,
      hideUI: f.hideUI !== undefined ? f.hideUI : (isCameraNone2 ? false : (!f.afterCameraReturn && (f.delay === undefined || f.delay < 10000))),
    }));
    if (isPlayerEvadingDuringAct2) {
      processedAct2Frames = processedAct2Frames.map(f => f.isHighSkyCutscene ? f : ({ ...f, pOffset: { x: 0, y: -9999 }, hidePShadow: true, hidePlayer: true, pAlpha: 0.0 }));
    } else if (isEnemyEvadingDuringAct2) {
      processedAct2Frames = processedAct2Frames.map(f => f.isHighSkyCutscene ? f : ({ ...f, eOffset: { x: 0, y: -9999 }, hideEShadow: true, hideEnemy: true, eAlpha: 0.0 }));
    }

    const emBody = { x: em.x, y: em.y - 36 };
    const pmBody = { x: pm.x, y: pm.y - 36 };

    if (a1.canAct !== false) {
      applyMoveCameraToFrames(processedAct1Frames, moveAnim1, isP1, emBody, pmBody, true);
    }
    if (a2.canAct !== false) {
      applyMoveCameraToFrames(processedAct2Frames, moveAnim2, isP2, emBody, pmBody, false);
    }

    let processedAct3Frames: any[] = [];
    let act3FlickerFrames: any[] = [];
    let act3StatFrames: any[] = [];
    let isP3 = false;
    let moveAnim3: any = null;

    if (a3) {
      isP3 = a3.actor === "player";
      let mKey3 = getMoveKey(a3.moveKey || a3.moveName);
      if (mKey3 === "solar-beam" && (a3.isTurn1Launch || a3.chargingMove === "solar-beam" || a3.log?.includes("빛을 흡수") || a3.log?.includes("sunlight"))) {
        mKey3 = "solar-beam-charge";
      }
      const moveData3 = getMoveData(mKey3);
      const isCharging3 = isEvasionLaunch(a3);
      const isEvasionHit3 = isEvasionStrike(a3);
      const isStatusMove3 = (moveData3?.category === "status" || (a3 as any).category === "status" || ((a3.damage ?? 0) === 0 && !isCharging3 && !isEvasionHit3));
      const isHit3 = a3.isHit !== undefined ? a3.isHit : ((a3.damage ?? 0) > 0 || (!a3.log?.includes("빗나갔다") && !a3.log?.includes("missed") && !a3.log?.includes("빗나가")));
      const isMiss3 = !isHit3;

      moveAnim3 = getMoveAnimation(mKey3, isStatusMove3);
      let act3Frames: any[] = moveAnim3.buildFrames({
        action: a3,
        isPlayer: isP3,
        isHit: isHit3,
        isMiss: isMiss3,
        enemyHp: a2.enemyHpAfter,
        playerHp: a2.playerHpAfter,
        textLineIdx: 5,
        usePlayerFront: false,
        useEnemyBack: false,
      });
      act3Frames = applyDamageBlinkFrames(act3Frames, a3, isP3);
      const isCameraNone3 = moveAnim3?.camera?.type === "none";
      processedAct3Frames = act3Frames.map(f => ({
        ...f,
        isAttackerPlayer: isP3,
        hideUI: f.hideUI !== undefined ? f.hideUI : (isCameraNone3 ? false : (!f.afterCameraReturn && (f.delay === undefined || f.delay < 10000))),
      }));
      if (a3.canAct !== false) {
        applyMoveCameraToFrames(processedAct3Frames, moveAnim3, isP3, emBody, pmBody, false);
      }
      act3FlickerFrames = createEffectivenessFlickerFrames(a3, isP3, false, playerFrontHold, enemyBackHold);
      act3StatFrames = createStatChangeFrames(a3, isP3, 6, playerFrontHold, enemyBackHold);
    }

    const isFlyGlide1 = (mKey1 === "fly" && !isEvasionLaunch(a1));
    const leadingBlurDelay = isFlyGlide1 ? 1000 : 800;

    const isHugTurn = Boolean(battle.hugTriggered || (battle.lastMoveEffect as any)?.hugTriggered);
    const pSpriteHug = playerFrontSprite || playerSprite;
    const pDimHug = Math.max(pSpriteHug?.width || 70, pSpriteHug?.height || 70);
    const extraDownOffsetHug = Math.max(0, Math.round((pDimHug - 65) * 0.75));
    const hugFrames = isHugTurn ? createHugAnimationFrames(enemy.hp, playerMon.hp, 1, extraDownOffsetHug) : [];

    const act1HasStatFrames = processedAct1Frames.some(f => f.statProgress !== undefined) || Boolean(moveAnim1?.customStatParticles);
    const act2HasStatFrames = processedAct2Frames.some(f => f.statProgress !== undefined) || Boolean(moveAnim2?.customStatParticles);

    framesConfig = [
      // Frame 0: Leading Cinematic Soft-Blur Loading Frame (1000ms for Fly glide, 800ms for others) - Field Blur
      {
        delay: leadingBlurDelay,
        pOffset: isPlayerStartingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        eOffset: isEnemyStartingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        pAlpha: isPlayerStartingEvading ? 0.0 : 1.0,
        eAlpha: isEnemyStartingEvading ? 0.0 : 1.0,
        hidePShadow: isPlayerStartingEvading,
        hideEShadow: isEnemyStartingEvading,
        hidePlayer: isPlayerStartingEvading,
        hideEnemy: isEnemyStartingEvading,
        showEffect: false,
        hitFlash: false,
        enemyHp: initialEnemyHp,
        playerHp: initialPlayerHp,
        textLineIdx: 0,
        statProgress: undefined,
        isBlur: true,
      },
      // === HUG CUTSCENE (If triggered!) ===
      ...hugFrames,
      // === ACT 1 ===
      ...processedAct1Frames,
      // Frame 3: Attacker 1 Recoil & Damage Settling (with Dynamic Effectiveness Blinking!)
      ...(createEffectivenessFlickerFrames(a1, isP1, true, isP1GuillotineKill, isE1GuillotineKill).map(f =>
        isPlayerEvadingDuringAct1 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyEvadingDuringAct1 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      )),
      // Dedicated Post-Move Stat Change Phase for Action 1 (if stat changes exist and not already in act1 frames!)
      ...(!act1HasStatFrames ? (createStatChangeFrames(a1, isP1, 2, isP1GuillotineKill, isE1GuillotineKill).map(f =>
        isPlayerEvadingDuringAct1 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyEvadingDuringAct1 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      )) : []),
      // Frame 4: Natural Breathing Room Pause between Turns (850ms - comfortable reading pause!)
      {
        delay: 850,
        pOffset: isPlayerMidTurnEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        eOffset: isEnemyMidTurnEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        pAlpha: isPlayerMidTurnEvading ? 0.0 : 1.0,
        eAlpha: isEnemyMidTurnEvading ? 0.0 : 1.0,
        hidePShadow: isPlayerMidTurnEvading,
        hideEShadow: isEnemyMidTurnEvading,
        hidePlayer: isPlayerMidTurnEvading,
        hideEnemy: isEnemyMidTurnEvading,
        hideUI: false,
        hideHud: false,
        hideDialogue: false,
        showEffect: false,
        hitFlash: false,
        usePlayerFront: isP1GuillotineKill,
        useEnemyBack: isE1GuillotineKill,
        targetAlpha: 1.0,
        enemyHp: a1.enemyHpAfter,
        playerHp: a1.playerHpAfter,
        textLineIdx: Math.max(1, (a1.log ? a1.log.replace(/\\n/g, "\n").split("\n").filter(Boolean).length : 2)),
        statProgress: undefined,
        isBlur: false,
        moveEffect: a1,
      },
      // === ACT 2 ===
      ...processedAct2Frames,
      // Frame 7: Attacker 2 Recoil & Counter Damage (with Dynamic Effectiveness Blinking!)
      ...(a2.canAct === false ? [] : (createEffectivenessFlickerFrames(a2, isP2, false, playerFrontHold, enemyBackHold).map(f =>
        isPlayerEvadingDuringAct2 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyEvadingDuringAct2 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      ))),
      // Dedicated Post-Move Stat Change Phase for Action 2 (if stat changes exist and not already in act2 frames!)
      ...(!act2HasStatFrames && a2.canAct !== false ? (createStatChangeFrames(a2, isP2, 4, playerFrontHold, enemyBackHold).map(f =>
        isPlayerEvadingDuringAct2 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyEvadingDuringAct2 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      )) : []),
      // === ACT 3 (If present!) ===
      ...(a3 ? [
        // Natural Breathing Room Pause between Act 2 and Act 3 (850ms)
        {
          delay: 850,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          pAlpha: 1.0,
          eAlpha: 1.0,
          hidePShadow: false,
          hideEShadow: false,
          hidePlayer: false,
          hideEnemy: false,
          hideUI: false,
          hideHud: false,
          hideDialogue: false,
          showEffect: false,
          hitFlash: false,
          usePlayerFront: false,
          useEnemyBack: false,
          targetAlpha: 1.0,
          enemyHp: a2.enemyHpAfter,
          playerHp: a2.playerHpAfter,
          textLineIdx: Math.max(1, (a2.log ? a2.log.replace(/\\n/g, "\n").split("\n").filter(Boolean).length : 3)),
          statProgress: undefined,
          isBlur: false,
          moveEffect: a2,
        },
        ...processedAct3Frames,
        ...(a3.canAct === false ? [] : act3FlickerFrames),
        ...act3StatFrames,
      ] : []),
      // Turn-End Residual Damage (poison, burn, trap, weather)
      ...residualFrames,
      // Sinking Faint Collapse Animation (if someone fainted)
      ...faintFrames,
      // Final 11-Minute Static Hold Frame (655,000ms) - completely neutral with NO statProgress
      {
        delay: 655000,
        pOffset: isPlayerEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        eOffset: isEnemyEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        pAlpha: (isPlayerFainted || (!isP2 && isWhirlwindHit2) || (!isP1 && isWhirlwindHit1)) ? 0.0 : 1.0,
        eAlpha: (isEnemyFainted || (isP2 && isWhirlwindHit2) || (isP1 && isWhirlwindHit1)) ? 0.0 : 1.0,
        hidePShadow: isPlayerEndingEvading || isPlayerFainted || (!isP2 && isWhirlwindHit2) || (!isP1 && isWhirlwindHit1),
        hideEShadow: isEnemyEndingEvading || isEnemyFainted || (isP2 && isWhirlwindHit2) || (isP1 && isWhirlwindHit1),
        hidePlayer: isPlayerEndingEvading || isPlayerFainted || (!isP2 && isWhirlwindHit2) || (!isP1 && isWhirlwindHit1),
        hideEnemy: isEnemyEndingEvading || isEnemyFainted || (isP2 && isWhirlwindHit2) || (isP1 && isWhirlwindHit1),
        hideUI: false,
        hideHud: false,
        hideDialogue: false,
        showEffect: false,
        hitFlash: false,
        usePlayerFront: playerFrontHold,
        useEnemyBack: enemyBackHold,
        enemyHp: finalEnemyHp,
        playerHp: finalPlayerHp,
        textLineIdx: 99,
        statProgress: undefined,
        isBlur: false,
        moveEffect: a3 || a2,
      }
    ];
  } else {
    // Single Action Turn (e.g. 1 move executed or enemy fainted)
    const a1 = turnActions[0];
    const isP1 = a1 ? (a1.actor === "player") : isPlayer;
    const eff = a1 || {
      moveKey,
      moveName: moveKey,
      type,
      isSpecial,
      isPlayerAttacking: isPlayer,
      statChanges: battle.lastMoveEffect?.statChanges,
      enemyHpAfter: enemyHp,
      playerHpAfter: playerHp,
    };

    const isGuillotineSingle = (eff.moveKey || moveKey).toLowerCase().replace(/[\s_]+/g, "-") === "guillotine" || (eff.moveKey || moveKey).toLowerCase().replace(/[\s_]+/g, "-").includes("horn-drill") || (eff.moveKey || moveKey).toLowerCase().replace(/[\s_]+/g, "-") === "fissure";
    const isFissureSingle = (eff.moveKey || moveKey).toLowerCase().replace(/[\s_]+/g, "-") === "fissure";
    const isWhirlwindSingle = (eff.moveKey || moveKey).toLowerCase().replace(/[\s_]+/g, "-") === "whirlwind";
    const isWhirlwindSuccess = isWhirlwindSingle && (eff.isHit !== false && !eff.log?.includes("통하지 않았다") && !eff.log?.includes("실패했다"));

    const postActionEnemyHp = eff.enemyHpAfter !== undefined ? eff.enemyHpAfter : enemyHp;
    const postActionPlayerHp = eff.playerHpAfter !== undefined ? eff.playerHpAfter : playerHp;
    const finalEnemyHp = Math.min(enemy.hp, postActionEnemyHp);
    const finalPlayerHp = Math.min(playerMon.hp, postActionPlayerHp);
    const isEnemyFainted = (finalEnemyHp <= 0 || (enemy.hp <= 0 && !isWhirlwindSuccess) || (battle.phase === "VICTORY" && !isWhirlwindSuccess));
    const isPlayerFainted = (finalPlayerHp <= 0 || (playerMon.hp <= 0 && !isWhirlwindSuccess) || (battle.phase === "DEFEAT" && !isWhirlwindSuccess));
    const isFainted = isEnemyFainted || isPlayerFainted;

    const playerFrontHold = isP1 && isGuillotineSingle && (isEnemyFainted || isHit1);
    const enemyBackHold = !isP1 && isGuillotineSingle && (isPlayerFainted || isHit1);

    const faintTarget = (isEnemyFainted && isPlayerFainted) ? "both" : (isPlayerFainted ? "player" : "enemy");
    const faintFrames = (isFainted && !isFissureSingle)
      ? createFaintingFrames(eff, faintTarget, 99, playerFrontHold, enemyBackHold)
      : [];

    const a1IsEvasionLaunch = isEvasionLaunch(a1);
    const a1IsEvasionStrike = isEvasionStrike(a1);

    const hasPlayerSemiInvulnerable = Boolean(
      (playerMon as any)?.semiInvulnerableState ||
      (playerMon as any)?.isSemiInvulnerable ||
      playerMon?.chargingMove === "fly" ||
      playerMon?.chargingMove === "dig" ||
      playerMon?.chargingMove === "dive" ||
      playerMon?.chargingMove === "bounce" ||
      playerMon?.chargingMove === "shadow-force" ||
      playerMon?.chargingMove === "phantom-force"
    );

    const hasEnemySemiInvulnerable = Boolean(
      (enemy as any)?.semiInvulnerableState ||
      (enemy as any)?.isSemiInvulnerable ||
      enemy?.chargingMove === "fly" ||
      enemy?.chargingMove === "dig" ||
      enemy?.chargingMove === "dive" ||
      enemy?.chargingMove === "bounce" ||
      enemy?.chargingMove === "shadow-force" ||
      enemy?.chargingMove === "phantom-force"
    );

    const isPlayerStartingEvading = !a1IsEvasionLaunch && (
      hasPlayerSemiInvulnerable ||
      (a1IsEvasionStrike && isP1) ||
      Boolean(a1 && (a1.log?.includes("닿지 않았다") || a1.log?.includes("couldn't reach") || a1.log?.includes("couldn't hit")) && !isP1) ||
      Boolean(eff?.wasDescentFromAir && isP1)
    );
    const isEnemyStartingEvading = !a1IsEvasionLaunch && (
      hasEnemySemiInvulnerable ||
      (a1IsEvasionStrike && !isP1) ||
      Boolean(a1 && (a1.log?.includes("닿지 않았다") || a1.log?.includes("couldn't reach") || a1.log?.includes("couldn't hit")) && isP1) ||
      Boolean(eff?.wasDescentFromAir && !isP1)
    );

    const isPlayerEndingEvading = (a1IsEvasionLaunch && isP1) || (hasPlayerSemiInvulnerable && !a1IsEvasionStrike);
    const isEnemyEndingEvading = (a1IsEvasionLaunch && !isP1) || (hasEnemySemiInvulnerable && !a1IsEvasionStrike);

    // Turn-end residual damage frames (poison, burn, trap, weather)
    const residualFramesSingle = createResidualDamageFrames(
      postActionEnemyHp,
      finalEnemyHp,
      postActionPlayerHp,
      finalPlayerHp,
      playerFrontHold,
      enemyBackHold,
      isPlayerEndingEvading,
      isEnemyEndingEvading,
      eff
    );

    const isCameraNoneSingle = moveAnim1?.camera?.type === "none";
    let processedSingleActFrames = act1Frames.map(f => ({
      ...f,
      isAttackerPlayer: isP1,
      hideUI: f.hideUI !== undefined ? f.hideUI : (isCameraNoneSingle ? false : (!f.afterCameraReturn && (f.delay === undefined || f.delay < 10000))),
    }));
    if (isEnemyStartingEvading && isP1) {
      processedSingleActFrames = processedSingleActFrames.map(f => f.isHighSkyCutscene ? f : ({ ...f, eOffset: { x: 0, y: -9999 }, hideEShadow: true, hideEnemy: true, eAlpha: 0.0 }));
    } else if (isPlayerStartingEvading && !isP1) {
      processedSingleActFrames = act1Frames.map(f => f.isHighSkyCutscene ? f : ({ ...f, pOffset: { x: 0, y: -9999 }, hidePShadow: true, hidePlayer: true, pAlpha: 0.0 }));
    }

    const emBodySingle = { x: em.x, y: em.y - 36 };
    const pmBodySingle = { x: pm.x, y: pm.y - 36 };
    if (a1?.canAct !== false) {
      applyMoveCameraToFrames(processedSingleActFrames, moveAnim1, isP1, emBodySingle, pmBodySingle);
    }

    const isFlyGlideSingle = (mKey1 === "fly" && !isEvasionLaunch(a1));
    const singleLeadingBlurDelay = isFlyGlideSingle ? 1000 : 800;

    const isHugTurnSingle = Boolean(battle.hugTriggered || (battle.lastMoveEffect as any)?.hugTriggered);
    const pSpriteSingle = playerFrontSprite || playerSprite;
    const pDimSingle = Math.max(pSpriteSingle?.width || 70, pSpriteSingle?.height || 70);
    const extraDownOffsetSingle = Math.max(0, Math.round((pDimSingle - 65) * 0.75));
    const hugFramesSingle = isHugTurnSingle ? createHugAnimationFrames(enemy.hp, playerMon.hp, 1, extraDownOffsetSingle) : [];

    const singleHasStatFrames = processedSingleActFrames.some(f => f.statProgress !== undefined) || Boolean(moveAnim1?.customStatParticles);

    framesConfig = [
      // Frame 0: Leading Cinematic Soft-Blur Loading Frame (1000ms for Fly glide, 800ms for others) - Field Blur
      {
        delay: singleLeadingBlurDelay,
        pOffset: isPlayerStartingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        eOffset: isEnemyStartingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        pAlpha: isPlayerStartingEvading ? 0.0 : 1.0,
        eAlpha: isEnemyStartingEvading ? 0.0 : 1.0,
        hidePShadow: isPlayerStartingEvading,
        hideEShadow: isEnemyStartingEvading,
        hidePlayer: isPlayerStartingEvading,
        hideEnemy: isEnemyStartingEvading,
        showEffect: false,
        hitFlash: false,
        enemyHp: initialEnemyHp,
        playerHp: initialPlayerHp,
        textLineIdx: 0,
        statProgress: undefined,
        isBlur: true,
      },
      // === HUG CUTSCENE (If triggered!) ===
      ...hugFramesSingle,
      // Act 1 Move Animation (Fully executed with all sub-frames!)
      ...processedSingleActFrames,
      // Frame 3: Recoil & Damage Settling (with Dynamic Effectiveness Blinking!)
      ...(createEffectivenessFlickerFrames(eff, isP1, true, playerFrontHold, enemyBackHold).map(f =>
        isPlayerStartingEvading && !isP1 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyStartingEvading && isP1 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      )),
      // Dedicated Post-Move Stat Change Phase (if stat changes exist and not already in single act frames!)
      ...(!singleHasStatFrames ? (createStatChangeFrames(eff, isP1, 2, playerFrontHold, enemyBackHold).map(f =>
        isPlayerStartingEvading && !isP1 ? { ...f, pOffset: { x: 0, y: -9999 }, hidePlayer: true, hidePShadow: true, pAlpha: 0.0 }
        : (isEnemyStartingEvading && isP1 ? { ...f, eOffset: { x: 0, y: -9999 }, hideEnemy: true, hideEShadow: true, eAlpha: 0.0 } : f)
      )) : []),
      // Turn-End Residual Damage (poison, burn, trap, weather)
      ...residualFramesSingle,
      // Sinking Faint Collapse Animation (if fainted)
      ...faintFrames,
      // Final 11-Minute Static Hold Frame (655,000ms) - completely neutral with NO statProgress
      {
        delay: 655000,
        pOffset: isPlayerEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        eOffset: isEnemyEndingEvading ? { x: 0, y: -9999 } : { x: 0, y: 0 },
        pAlpha: (isPlayerFainted || (!isP1 && isWhirlwindSuccess)) ? 0.0 : 1.0,
        eAlpha: (isEnemyFainted || (isP1 && isWhirlwindSuccess)) ? 0.0 : 1.0,
        hidePShadow: isPlayerEndingEvading || isPlayerFainted || (!isP1 && isWhirlwindSuccess),
        hideEShadow: isEnemyEndingEvading || isEnemyFainted || (isP1 && isWhirlwindSuccess),
        hidePlayer: isPlayerEndingEvading || isPlayerFainted || (!isP1 && isWhirlwindSuccess),
        hideEnemy: isEnemyEndingEvading || isEnemyFainted || (isP1 && isWhirlwindSuccess),
        hideUI: false,
        hideHud: false,
        hideDialogue: false,
        showEffect: false,
        hitFlash: false,
        usePlayerFront: playerFrontHold,
        useEnemyBack: enemyBackHold,
        enemyHp: finalEnemyHp,
        playerHp: finalPlayerHp,
        textLineIdx: 99,
        statProgress: undefined,
        isBlur: false,
        moveEffect: eff,
      }
    ];
  }

  if (battle.hugTriggered) {
    battle.hugTriggered = false;
  }

  // Resample all battle keyframes with rhythmic pacing (25 FPS dashes, hit-stop, weighty flinch)
  framesConfig = interpolateBattleFramesTo30Fps(framesConfig);

  const motionDurationMs = framesConfig.slice(0, -1).reduce((sum, f) => sum + f.delay, 0);

  const ep = BATTLE_LAYOUT_CONFIG.enemyPlatform;
  const pp = BATTLE_LAYOUT_CONFIG.playerPlatform;
  const enemyPlatW = 320 * ep.scale;
  const enemyPlatH = 132 * ep.scale;
  const playerPlatW = 320 * pp.scale;
  const playerPlatH = 132 * pp.scale;

  // Camera already applied cleanly per-act using modular camera strategy!

  const offCanvas = createCanvas(width, height);
  const offCtx = offCanvas.getContext("2d");
  offCtx.imageSmoothingEnabled = false;

  const seenPhases = new Set<string>();
  const phases: PhaseInfoItem[] = [];
  let frameIdx = 0;
  let prevBattleFrame: any = null;

  let curRenderEnemyHp = initialEnemyHp;
  let curRenderPlayerHp = initialPlayerHp;
  let curRenderEnemyStatus: string | null = (a1.enemyStatusBefore !== undefined ? a1.enemyStatusBefore : enemy.status) || null;
  let curRenderPlayerStatus: string | null = (a1.playerStatusBefore !== undefined ? a1.playerStatusBefore : playerMon.status) || null;

  for (const f of framesConfig) {
    if (f.enemyHp !== undefined) curRenderEnemyHp = f.enemyHp;
    if (f.playerHp !== undefined) curRenderPlayerHp = f.playerHp;
    if (f.enemyStatus !== undefined) curRenderEnemyStatus = f.enemyStatus;
    if (f.playerStatus !== undefined) curRenderPlayerStatus = f.playerStatus;
    f.enemyHp = curRenderEnemyHp;
    f.playerHp = curRenderPlayerHp;
    f.enemyStatus = curRenderEnemyStatus;
    f.playerStatus = curRenderPlayerStatus;

    let drawPlayerSpriteFn: (() => void) | null = null;
    const isAnyBlur = Boolean(f.isBlur || f.cameraBlur);
    const targetCtx = isAnyBlur ? offCtx : ctx;
    targetCtx.clearRect(0, 0, width, height);

    targetCtx.save();
    targetCtx.scale(renderScale, renderScale);

    if (f.isHighSkyCutscene) {
      const attackerSprite = (f.isAttackerPlayer !== false)
        ? (playerSprite || playerFrontSprite)
        : (enemySprite || enemyBackSprite);
      drawHighSkyCutscene(targetCtx, logicalWidth, logicalHeight, f, attackerSprite);
    } else {
      const isTracking = Boolean(f.cameraTrackAttacker);
      const hasCamera = Boolean(f.cameraZoom || f.cameraPan || isTracking || f.cameraFocal || f.cameraRoll);
      if (hasCamera) {
        targetCtx.save();
        const zoom = f.cameraZoom || 1.0;
        const isAttackerP = f.isAttackerPlayer !== false;

        if (isTracking) {
          // Pure 100% vertical tracking: X is strictly centered at logicalWidth / 2 (280) so left and right margins never expose!
          const liveY = isAttackerP ? (pm.y + f.pOffset.y) : (em.y + f.eOffset.y);
          const screenY = isAttackerP ? pm.y : em.y;

          targetCtx.translate(logicalWidth / 2, screenY);
          targetCtx.scale(zoom, zoom);
          if (f.cameraRoll) targetCtx.rotate(f.cameraRoll);
          targetCtx.translate(-logicalWidth / 2, -liveY);
        } else if (f.cameraFocal) {
          // Exactly center target Pokémon in the camera viewport with cameraPan screen shake support!
          const panX = f.cameraPan?.x || 0;
          const panY = f.cameraPan?.y || 0;
          targetCtx.translate(logicalWidth / 2 + panX, logicalHeight / 2 + panY);
          targetCtx.scale(zoom, zoom);
          if (f.cameraRoll) targetCtx.rotate(f.cameraRoll);
          targetCtx.translate(-f.cameraFocal.x, -f.cameraFocal.y);
        } else {
          const focalY = isAttackerP ? pm.y : em.y;
          const panX = f.cameraPan?.x || 0;
          const panY = f.cameraPan?.y || 0;

          targetCtx.translate(logicalWidth / 2 + panX, focalY + panY);
          targetCtx.scale(zoom, zoom);
          if (f.cameraRoll) targetCtx.rotate(f.cameraRoll);
          targetCtx.translate(-logicalWidth / 2, -focalY);
        }
      }

      if (f.blackoutScreen) {
        // Pure 100% Solid Blackout for Guillotine Execution Freeze!
        targetCtx.fillStyle = "#000000";
        targetCtx.fillRect(-logicalWidth * 4, -3000, logicalWidth * 9, 6000);
      } else {
        // Sample exact top and bottom edge colors from the arena background image
        const edgeColors = getArenaEdgeColors(arena.bg);

        // 1. Top Sky Fill (for y <= 0 extending upwards to -3000px):
        if (isTracking) {
          // Stratosphere space navy gradient transitioning into biome's top edge color at y = 0
          const skyAscentGrad = targetCtx.createLinearGradient(0, -2500, 0, 0);
          skyAscentGrad.addColorStop(0, "#0B1120"); // Deep Stratosphere space navy
          skyAscentGrad.addColorStop(0.35, "#0284C7"); // Sky Blue
          skyAscentGrad.addColorStop(0.70, "#38BDF8"); // Atmosphere cyan
          skyAscentGrad.addColorStop(1, edgeColors.top); // Seamless connection to top of arena background!
          targetCtx.fillStyle = skyAscentGrad;
          targetCtx.fillRect(-logicalWidth * 4, -3000, logicalWidth * 9, 3000);
        } else {
          targetCtx.fillStyle = edgeColors.top;
          targetCtx.fillRect(-logicalWidth * 4, -3000, logicalWidth * 9, 3000);
        }

        // 2. Bottom Ground Fill (for y >= logicalHeight extending downwards to +3000px):
        targetCtx.fillStyle = edgeColors.bottom;
        targetCtx.fillRect(-logicalWidth * 4, logicalHeight, logicalWidth * 9, 3000);

        // 3. Side Margins (for x < -logicalWidth and x > logicalWidth * 2):
        const sideGrad = targetCtx.createLinearGradient(0, 0, 0, logicalHeight);
        sideGrad.addColorStop(0, edgeColors.top);
        sideGrad.addColorStop(1, edgeColors.bottom);
        targetCtx.fillStyle = sideGrad;
        targetCtx.fillRect(-logicalWidth * 4, 0, logicalWidth * 3, logicalHeight);
        targetCtx.fillRect(logicalWidth * 2, 0, logicalWidth * 3, logicalHeight);

        // 4. Ground Arena Background Image (Seamless multi-panel coverage with bgOffsetX support for Arc Shots & Pan)
        if (arena.bg) {
          const bgShift = (f.bgOffsetX || 0) % logicalWidth;
          targetCtx.drawImage(arena.bg, bgShift, 0, logicalWidth, logicalHeight);
          targetCtx.drawImage(arena.bg, bgShift - logicalWidth, 0, logicalWidth, logicalHeight);
          targetCtx.drawImage(arena.bg, bgShift + logicalWidth, 0, logicalWidth, logicalHeight);
          targetCtx.drawImage(arena.bg, bgShift - logicalWidth * 2, 0, logicalWidth, logicalHeight);
          targetCtx.drawImage(arena.bg, bgShift + logicalWidth * 2, 0, logicalWidth, logicalHeight);
        } else {
          targetCtx.fillStyle = "#487848";
          targetCtx.fillRect(-logicalWidth, 0, logicalWidth * 3, logicalHeight);
        }

        if (arena.b && !f.hidePlatform) {
          const platAlpha = f.platformAlpha !== undefined ? f.platformAlpha : 1.0;
          if (platAlpha > 0.01) {
            targetCtx.save();
            if (platAlpha < 0.99) targetCtx.globalAlpha = platAlpha;

            const arenaPlatform = arena.b!;
            const drawEnemyPlat = () => {
              const se = f.ePlatScale ?? 1.0;
              const We = enemyPlatW * se;
              const He = enemyPlatH * se;
              const ePlatX = f.ePlatOffset?.x ?? (f.ePlatX ?? 0);
              const ePlatY = f.ePlatOffset?.y ?? ((f as any).ePlatY ?? 0);
              const drawX = (em.x + ePlatX) - 323 * se;
              const drawY = (em.y + ePlatY) - 110 * se;
              targetCtx.drawImage(arenaPlatform, drawX, drawY, We, He);
            };

            const drawPlayerPlat = () => {
              const sp = f.pPlatScale ?? 1.0;
              const Wp = playerPlatW * sp;
              const Hp = playerPlatH * sp;
              const pPlatX = f.pPlatOffset?.x ?? (f.pPlatX ?? 0);
              const pPlatY = f.pPlatOffset?.y ?? 0;
              const flippedX = 418 - pPlatX - 443 * sp;
              const drawY = (pm.y + pPlatY) - 150 * sp;
              targetCtx.save();
              targetCtx.translate(logicalWidth, 0);
              targetCtx.scale(-1, 1);
              targetCtx.drawImage(arenaPlatform, flippedX, drawY, Wp, Hp);
              targetCtx.restore();
            };

            if (f.drawEnemyOnTop) {
              drawPlayerPlat();
              drawEnemyPlat();
            } else {
              drawEnemyPlat();
              drawPlayerPlat();
            }
            targetCtx.restore();
          }
        }
      }

      // Looming Descending Sky Shadow on Target Platform (e.g. Fly Turn 2 targeting & descent phase)
      if (f.loomingShadow) {
        const targetPos = f.isAttackerPlayer !== false ? em : pm;
        const lx = targetPos.x + (f.loomingShadow.offsetX || 0);
        const ly = targetPos.y + (f.loomingShadow.offsetY || 0);
        const sw = f.loomingShadow.w;
        const sh = f.loomingShadow.h;
        const alpha = f.loomingShadow.alpha || 0.6;

        targetCtx.save();
        targetCtx.globalAlpha = alpha;
        targetCtx.fillStyle = "rgba(15, 23, 42, 0.75)";
        targetCtx.beginPath();
        targetCtx.ellipse(lx, ly, sw, sh, 0, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.restore();
      }

      // Determine target entity for hitFlash & filter styling
      const eTarget = (f.moveEffect ? f.moveEffect.actor === "player" : isPlayer);
      const pTarget = (f.moveEffect ? f.moveEffect.actor === "enemy" : !isPlayer);
      let isAttackingPlayer = (f.moveEffect ? f.moveEffect.actor === "player" : (f.moveEffect?.isPlayerAttacking ?? isPlayer));

      const eAlpha = f.eAlpha !== undefined
        ? f.eAlpha
        : ((f.targetAlpha !== undefined && eTarget) ? f.targetAlpha : 1.0);
      const pAlpha = f.pAlpha !== undefined
        ? f.pAlpha
        : ((f.targetAlpha !== undefined && pTarget) ? f.targetAlpha : 1.0);

      // Pokémon Silhouette Shadows (cast onto platform ground - cleanly suppressed when Pokemon rushes away, leaps into mid-air, or goes off-screen)
      const platShadowMul = f.platformAlpha !== undefined ? f.platformAlpha : (f.hidePlatform ? 0 : 1.0);
      const isEnemyHidden = (!f.ePlatOffset && f.eOffset && (Math.abs(f.eOffset.x) > 35 || f.eOffset.y <= -30 || f.eOffset.y >= 9000)) || f.hideEShadow || f.hideEnemy || (eAlpha <= 0.02) || f.blackoutScreen || platShadowMul <= 0.01;
      if (enemySprite && !isEnemyHidden) {
        const eShadowX = em.x + ((f.targetWhiteAura && eTarget) ? 0 : (f.eOffset?.x || 0));
        const eShadowY = em.y + (f.ePlatOffset ? (f.eOffset?.y || 0) : 0);
        const eSize = em.size * (f.eScale?.x ?? 1.0);
        drawPokemonSilhouetteShadow(targetCtx, enemySprite, eShadowX, eShadowY, eSize, false, 0.42 * eAlpha * platShadowMul);
      }

      const isPlayerHidden = (!f.pPlatOffset && f.pOffset && (Math.abs(f.pOffset.x) > 35 || f.pOffset.y <= -30 || f.pOffset.y >= 9000)) || f.hidePShadow || f.hidePlayer || (pAlpha <= 0.02) || f.blackoutScreen || platShadowMul <= 0.01;
      if (playerSprite && !isPlayerHidden) {
        const pShadowX = pm.x + ((f.targetWhiteAura && pTarget) ? 0 : (f.pOffset?.x || 0));
        const pShadowY = pm.y + (f.pPlatOffset ? (f.pOffset?.y || 0) : 0);
        const pSize = pm.size * (f.pScale?.x ?? 1.0);
        drawPokemonSilhouetteShadow(targetCtx, playerSprite, pShadowX, pShadowY, pSize, true, 0.42 * pAlpha * platShadowMul);
      }

      const drawEnemySprite = () => {
        const eSpriteToDraw = f.useEnemyBack ? (enemyBackSprite || enemySprite) : enemySprite;
        const isEnemySpriteHidden = (f.eOffset && (f.eOffset.y <= -500 || f.eOffset.y >= 9000)) || f.hideEnemy || (eAlpha <= 0.01);
        if (eSpriteToDraw && !isEnemySpriteHidden) {
          targetCtx.save();
          if (f.eClipBottomY !== undefined) {
            targetCtx.beginPath();
            targetCtx.rect(-9999, -9999, 19999, f.eClipBottomY - (-9999));
            targetCtx.clip();
          }
          const isWhiteAura = (f.targetWhiteAura && eTarget) || f.eWhiteAura;
          if (f.eWhite || (f.casterWhite && !isAttackingPlayer)) {
            targetCtx.filter = "brightness(0) invert(1)";
          } else if (f.eWhiteTint) {
            const rad = f.whiteTintRadius ?? 2.5;
            targetCtx.filter = `brightness(1.50) drop-shadow(0px 0px ${rad}px rgba(255,255,255,0.92))`;
          } else if (f.eGreyTint || (f.targetGreyTint && eTarget)) {
            targetCtx.filter = "grayscale(1) brightness(0.98) contrast(1.15)";
          } else if (f.targetDarkLevel !== undefined && f.targetDarkLevel > 0 && eTarget) {
            const lvl = Math.min(1.0, f.targetDarkLevel);
            const bri = Math.max(0.04, 1.0 - lvl * 0.94);
            const sat = Math.max(0.0, 1.0 - lvl * 0.85);
            targetCtx.filter = `brightness(${bri.toFixed(2)}) saturate(${sat.toFixed(2)}) drop-shadow(0px 0px ${Math.round(lvl * 6)}px rgba(0, 0, 0, ${lvl.toFixed(2)}))`;
          } else if (f.hitFlash && eTarget && !(f.targetPurpleLevel !== undefined && f.targetPurpleLevel > 0) && !f.targetRedTint && !f.eRedTint && !f.targetBlueTint && !f.eBlueTint) {
            targetCtx.filter = "brightness(1.35)";
          } else if ((f.targetYellowAura && eTarget) || f.eYellowAura || (f.casterYellowAura && !isAttackingPlayer)) {
            targetCtx.filter = "drop-shadow(0px 0px 8px #FACC15) drop-shadow(0px 0px 16px #EAB308) brightness(1.2)";
          } else if ((f.targetPurpleLevel !== undefined && f.targetPurpleLevel > 0 && eTarget) || f.ePurpleTint) {
            const lvl = Math.max(0, Math.min(1, f.targetPurpleLevel !== undefined ? f.targetPurpleLevel : 1.0));
            const sep = (0.35 + 0.35 * lvl).toFixed(2);
            const rot = Math.round(245 + 15 * lvl);
            const sat = (1.5 + 2.0 * lvl).toFixed(1);
            const bri = (1.0 - 0.15 * lvl).toFixed(2);
            targetCtx.filter = `sepia(${sep}) hue-rotate(${rot}deg) saturate(${sat}) brightness(${bri})`;
          } else if ((f.targetRedTint && eTarget) || f.eRedTint) {
            targetCtx.filter = "sepia(1) hue-rotate(314deg) saturate(9) brightness(1.05) drop-shadow(0px 0px 6px #ef4444)";
          } else if ((f.targetBlueTint && eTarget) || f.eBlueTint) {
            targetCtx.filter = "sepia(0.60) hue-rotate(180deg) saturate(2.5) brightness(1.1)";
          }
          if (eAlpha < 0.99) {
            targetCtx.globalAlpha = eAlpha;
          }
          const ex = em.x + (f.eOffset?.x ?? 0);
          const ey = em.y + (f.eOffset?.y ?? 0);
          const eTintColor = getStatusTintColor(curRenderEnemyStatus);
          if (isWhiteAura) {
            // 1. [아래 레이어] 원본 스프라이트는 제자리에 그대로 유지 (오프셋 0, 스케일 1.0, 원본 색상)
            drawFittedBattleSprite(targetCtx, eSpriteToDraw, em.x, em.y, em.size, eTintColor);

            // 2. [위 레이어] 반투명 흰색 스프라이트는 위에 뜨며(이동/진동/팽창) 렌더링
            targetCtx.save();
            const bAlpha = f.targetWhiteBorderAlpha ?? 0.85;
            targetCtx.filter = `brightness(0) invert(1) drop-shadow(0px 0px 3px rgba(255, 255, 255, ${bAlpha}))`;
            targetCtx.globalAlpha = (f.targetWhiteOpacity ?? 0.48) * eAlpha;
            if (f.eScale || f.eRot || f.eOffset) {
              targetCtx.translate(ex, ey);
              if (f.eRot) targetCtx.rotate(f.eRot);
              if (f.eScale) targetCtx.scale(f.eScale.x, f.eScale.y);
              drawFittedBattleSprite(targetCtx, eSpriteToDraw, 0, 0, em.size, eTintColor);
            } else {
              drawFittedBattleSprite(targetCtx, eSpriteToDraw, ex, ey, em.size, eTintColor);
            }
            targetCtx.restore();
          } else if (f.eScale || f.eRot) {
            targetCtx.translate(ex, ey);
            if (f.eRot) targetCtx.rotate(f.eRot);
            if (f.eScale) targetCtx.scale(f.eScale.x, f.eScale.y);
            drawFittedBattleSprite(targetCtx, eSpriteToDraw, 0, 0, em.size, eTintColor);
          } else {
            drawFittedBattleSprite(targetCtx, eSpriteToDraw, ex, ey, em.size, eTintColor);
          }
          targetCtx.restore();
        }
      };

      const drawPlayerSprite = () => {
        const pSpriteToDraw = f.usePlayerFront ? (playerFrontSprite || playerSprite) : playerSprite;
        const isPlayerSpriteHidden = (f.pOffset && (f.pOffset.y <= -500 || f.pOffset.y >= 9000)) || f.hidePlayer || (pAlpha <= 0.01);
        if (pSpriteToDraw && !isPlayerSpriteHidden && (playerMon.hp > 0 || f.playerHp > 0 || pAlpha > 0.01)) {
          targetCtx.save();
          if (f.pClipBottomY !== undefined) {
            targetCtx.beginPath();
            targetCtx.rect(-9999, -9999, 19999, f.pClipBottomY - (-9999));
            targetCtx.clip();
          }
          const isWhiteAura = (f.targetWhiteAura && pTarget) || f.pWhiteAura;
          if (f.pWhite || (f.casterWhite && isAttackingPlayer)) {
            targetCtx.filter = "brightness(0) invert(1)";
          } else if (f.pWhiteTint) {
            const rad = f.whiteTintRadius ?? 2.5;
            targetCtx.filter = `brightness(1.50) drop-shadow(0px 0px ${rad}px rgba(255,255,255,0.92))`;
          } else if (f.pGreyTint || (f.targetGreyTint && pTarget)) {
            targetCtx.filter = "grayscale(1) brightness(0.98) contrast(1.15)";
          } else if (f.targetDarkLevel !== undefined && f.targetDarkLevel > 0 && pTarget) {
            const lvl = Math.min(1.0, f.targetDarkLevel);
            const bri = Math.max(0.04, 1.0 - lvl * 0.94);
            const sat = Math.max(0.0, 1.0 - lvl * 0.85);
            targetCtx.filter = `brightness(${bri.toFixed(2)}) saturate(${sat.toFixed(2)}) drop-shadow(0px 0px ${Math.round(lvl * 6)}px rgba(0, 0, 0, ${lvl.toFixed(2)}))`;
          } else if (f.hitFlash && pTarget && !(f.targetPurpleLevel !== undefined && f.targetPurpleLevel > 0) && !f.targetRedTint && !f.pRedTint && !f.targetBlueTint && !f.pBlueTint) {
            targetCtx.filter = "brightness(1.35)";
          } else if ((f.targetYellowAura && pTarget) || f.pYellowAura || (f.casterYellowAura && isAttackingPlayer)) {
            targetCtx.filter = "drop-shadow(0px 0px 8px #FACC15) drop-shadow(0px 0px 16px #EAB308) brightness(1.2)";
          } else if ((f.targetPurpleLevel !== undefined && f.targetPurpleLevel > 0 && pTarget) || f.pPurpleTint) {
            const lvl = Math.max(0, Math.min(1, f.targetPurpleLevel !== undefined ? f.targetPurpleLevel : 1.0));
            const sep = (0.35 + 0.35 * lvl).toFixed(2);
            const rot = Math.round(245 + 15 * lvl);
            const sat = (1.5 + 2.0 * lvl).toFixed(1);
            const bri = (1.0 - 0.15 * lvl).toFixed(2);
            targetCtx.filter = `sepia(${sep}) hue-rotate(${rot}deg) saturate(${sat}) brightness(${bri})`;
          } else if ((f.targetRedTint && pTarget) || f.pRedTint) {
            targetCtx.filter = "sepia(1) hue-rotate(314deg) saturate(9) brightness(1.05) drop-shadow(0px 0px 6px #ef4444)";
          } else if ((f.targetBlueTint && pTarget) || f.pBlueTint) {
            targetCtx.filter = "sepia(0.60) hue-rotate(180deg) saturate(2.5) brightness(1.1)";
          }
          if (pAlpha < 0.99) {
            targetCtx.globalAlpha = pAlpha;
          }
          const px = pm.x + (f.pOffset?.x ?? 0);
          const py = pm.y + (f.pOffset?.y ?? 0);
          const pTintColor = getStatusTintColor(curRenderPlayerStatus);
          if (isWhiteAura) {
            // 1. [아래 레이어] 원본 스프라이트는 제자리에 그대로 유지 (오프셋 0, 스케일 1.0, 원본 색상)
            drawFittedBattleSprite(targetCtx, pSpriteToDraw, pm.x, pm.y, pm.size, pTintColor);

            // 2. [위 레이어] 반투명 흰색 스프라이트는 위에 뜨며(이동/진동/팽창) 렌더링
            targetCtx.save();
            const bAlpha = f.targetWhiteBorderAlpha ?? 0.85;
            targetCtx.filter = `brightness(0) invert(1) drop-shadow(0px 0px 3px rgba(255, 255, 255, ${bAlpha}))`;
            targetCtx.globalAlpha = (f.targetWhiteOpacity ?? 0.48) * pAlpha;
            if (f.pScale || f.pRot || f.pOffset) {
              targetCtx.translate(px, py);
              if (f.pRot) targetCtx.rotate(f.pRot);
              if (f.pScale) targetCtx.scale(f.pScale.x, f.pScale.y);
              drawFittedBattleSprite(targetCtx, pSpriteToDraw, 0, 0, pm.size, pTintColor);
            } else {
              drawFittedBattleSprite(targetCtx, pSpriteToDraw, px, py, pm.size, pTintColor);
            }
            targetCtx.restore();
          } else if (f.pScale || f.pRot) {
            targetCtx.translate(px, py);
            if (f.pRot) targetCtx.rotate(f.pRot);
            if (f.pScale) targetCtx.scale(f.pScale.x, f.pScale.y);
            drawFittedBattleSprite(targetCtx, pSpriteToDraw, 0, 0, pm.size, pTintColor);
          } else {
            drawFittedBattleSprite(targetCtx, pSpriteToDraw, px, py, pm.size, pTintColor);
          }
          targetCtx.restore();
        }
      };
      drawPlayerSpriteFn = drawPlayerSprite;

      const activeEffect = f.moveEffect || battle.lastMoveEffect || {
        moveKey,
        type,
        isSpecial,
        isPlayerAttacking: isPlayer,
      };
      const activeKey = (activeEffect.moveKey || moveKey).toLowerCase().replace(/[\s_]+/g, "-");
      isAttackingPlayer = activeEffect.actor ? (activeEffect.actor === "player") : (activeEffect.isPlayerAttacking ?? isPlayer);
      const targetBase = isAttackingPlayer ? em : pm;
      const attackerBase = isAttackingPlayer ? pm : em;
      // Center effect on Pokémon's torso/body (36px above platform surface)
      const targetPos = { x: targetBase.x, y: targetBase.y - 36 };
      const attackerPos = { x: attackerBase.x, y: attackerBase.y - 36 };

      const currentMoveAnim = getMoveAnimation(activeKey);

      // Behind-Sprite Move Effect Layer (e.g. Disable chains behind target, Vine Whip vines, ambient background filters)
      if (f.showBehindEffect ?? (f.showEffect !== false && (f.showEffect || f.moveStep))) {
        if (currentMoveAnim?.drawBehindEffect) {
          const casterOffset = isAttackingPlayer ? (f.pOffset ?? { x: 0, y: 0 }) : (f.eOffset ?? { x: 0, y: 0 });
          const casterPos = { x: attackerPos.x + casterOffset.x, y: attackerPos.y + casterOffset.y };

          currentMoveAnim.drawBehindEffect(targetCtx, f, {
            targetPos,
            attackerPos,
            casterPos,
            isPlayer: isAttackingPlayer,
            isHit: Boolean(activeEffect.isHit ?? true),
            width: logicalWidth,
            height: logicalHeight,
            em,
            pm,
            playerSprite: f.usePlayerFront ? (playerFrontSprite || playerSprite) : playerSprite,
            enemySprite: f.useEnemyBack ? (enemyBackSprite || enemySprite) : enemySprite,
            pAlpha,
            eAlpha,
            frame: f,
          });
        } else if (activeKey === "vine-whip" || activeKey === "vinewhip" || activeKey === "stomp") {
          renderMoveEffect(targetCtx, {
            moveKey: activeEffect.moveKey || moveKey,
            type: activeEffect.type || type,
            isSpecial: activeEffect.isSpecial !== undefined ? activeEffect.isSpecial : isSpecial,
            isPlayerAttacking: isAttackingPlayer,
            step: f.moveStep ?? (f.showEffect ? 2 : 1),
            layer: "behind",
          });
        }
      }

      const invokeMiddleEffect = () => {
        if (currentMoveAnim?.drawMiddleEffect && (f.showEffect || f.moveStep)) {
          const casterOffset = isAttackingPlayer ? (f.pOffset ?? { x: 0, y: 0 }) : (f.eOffset ?? { x: 0, y: 0 });
          const casterPos = { x: attackerPos.x + casterOffset.x, y: attackerPos.y + casterOffset.y };
          currentMoveAnim.drawMiddleEffect(targetCtx, f, {
            targetPos,
            attackerPos,
            casterPos,
            isPlayer: isAttackingPlayer,
            isHit: Boolean(activeEffect.isHit ?? true),
            width: logicalWidth,
            height: logicalHeight,
            em,
            pm,
            playerSprite: f.usePlayerFront ? (playerFrontSprite || playerSprite) : playerSprite,
            enemySprite: f.useEnemyBack ? (enemyBackSprite || enemySprite) : enemySprite,
            pAlpha,
            eAlpha,
            frame: f,
          });
        }
      };

      if (f.drawEnemyOnTop) {
        if (!f.drawPlayerAboveHud) drawPlayerSprite();
        invokeMiddleEffect();
        drawEnemySprite();
      } else {
        drawEnemySprite();
        invokeMiddleEffect();
        if (!f.drawPlayerAboveHud) drawPlayerSprite();
      }

      // Front-Sprite Move Effect Layer:
      // Uses the move's own self-contained drawEffect method
      if (f.showEffect !== false && (f.showEffect || f.moveStep)) {
        if (currentMoveAnim.drawEffect) {
          const casterOffset = isAttackingPlayer ? (f.pOffset ?? { x: 0, y: 0 }) : (f.eOffset ?? { x: 0, y: 0 });
          const casterPos = { x: attackerPos.x + casterOffset.x, y: attackerPos.y + casterOffset.y };

          currentMoveAnim.drawEffect(targetCtx, f, {
            targetPos,
            attackerPos,
            casterPos,
            isPlayer: isAttackingPlayer,
            isHit: Boolean(activeEffect.isHit ?? true),
            width: logicalWidth,
            height: logicalHeight,
            em,
            pm,
            playerSprite: f.usePlayerFront ? (playerFrontSprite || playerSprite) : playerSprite,
            enemySprite: f.useEnemyBack ? (enemyBackSprite || enemySprite) : enemySprite,
            pAlpha,
            eAlpha,
            frame: f,
          });
        } else {
          renderMoveEffect(targetCtx, {
            moveKey: activeEffect.moveKey || moveKey,
            type: activeEffect.type || type,
            isSpecial: activeEffect.isSpecial !== undefined ? activeEffect.isSpecial : isSpecial,
            isPlayerAttacking: isAttackingPlayer,
            step: f.moveStep ?? (f.showEffect ? 3 : 1),
            layer: (activeKey === "vine-whip" || activeKey === "vinewhip" || activeKey === "stomp") ? "front" : "all",
          });
        }
      }

      if (f.blackFadeAlpha !== undefined && f.blackFadeAlpha > 0) {
        targetCtx.save();
        targetCtx.globalAlpha = f.blackFadeAlpha;
        targetCtx.fillStyle = "#000000";
        targetCtx.fillRect(-logicalWidth * 4, -3000, logicalWidth * 9, 6000);
        targetCtx.restore();
      }

      // Stat Boost / Drop Arrow Particles (Rendered within Pokémon coordinate space so they always attach perfectly!)
      // ⚠️ 커스텀 기술(customStatParticles)이 자체 drawEffect에서 스탯 연출을 그리는 경우, 기본 파티클은 스킵하여 시각적 중복을 방지.
      //    (배틀 로직의 statProgress 값/흐름은 그대로 유지 — 순수 렌더링 분기)
      if (f.statProgress !== undefined && !currentMoveAnim?.customStatParticles) {
        const activeEffect = f.moveEffect || battle.lastMoveEffect;
        let statChanges = activeEffect?.statChanges || battle.lastMoveEffect?.statChanges;
        if (!statChanges || statChanges.length === 0) {
          const moveKey = (activeEffect?.moveKey || (f.moveEffect as any)?.moveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
          const moveData = getMoveData(moveKey);
          const desc = moveData?.description || "";
          const isDebuffMove = moveKey.includes("growl") || moveKey.includes("tail-whip") || moveKey.includes("tailwhip") || moveKey.includes("leer") || moveKey.includes("screech") || moveKey.includes("charm") || moveKey.includes("fake-tears") || moveKey.includes("string-shot") || moveKey.includes("sand-attack") || desc.includes("떨어뜨") || desc.includes("낮춘") || desc.includes("감소") || desc.includes("하락");
          if (isDebuffMove) {
            statChanges = [{ target: isAttackingPlayer ? "enemy" : "player", direction: "down" }];
          } else {
            statChanges = [{ target: isAttackingPlayer ? "player" : "enemy", direction: "up" }];
          }
        }
        if (statChanges && statChanges.length > 0) {
          for (const change of statChanges) {
            const targetPos = change.target === "player"
              ? { x: pm.x + (f.pOffset?.x ?? 0), y: pm.y + (f.pOffset?.y ?? 0) }
              : { x: em.x + (f.eOffset?.x ?? 0), y: em.y + (f.eOffset?.y ?? 0) };

            if (change.direction === "up") {
              drawStatBoostEffect(targetCtx, targetPos, f.statProgress);
            } else {
              drawStatDropEffect(targetCtx, targetPos, f.statProgress);
            }
          }
        }
      }

      if (hasCamera) {
        targetCtx.restore();
      }
    }

    if (!f.isBlur && !f.cameraBlur && !f.blackoutScreen && !f.blackFadeAlpha) {
      if (!f.hideUI) {
        renderBattleHeader(targetCtx, logicalWidth, battle, isKo);
      }
      if (!f.hideHud && !f.hideUI) {
        renderBattleHuds(targetCtx, battle, isKo, pbAssets, curRenderEnemyHp, curRenderPlayerHp, undefined, curRenderEnemyStatus, curRenderPlayerStatus);
      }
      if (!f.hideDialogue && !f.hideUI) {
        renderBattleDialogue(targetCtx, logicalWidth, logicalHeight, dialogueLines, f.textLineIdx);
      }
      if (f.drawPlayerAboveHud && drawPlayerSpriteFn) {
        drawPlayerSpriteFn();
      }
    } else if (f.isBlur) {
      // Base empty dialogue box drawn on offCanvas before full-frame blur
      const boxY = 270;
      const glassGrad = targetCtx.createLinearGradient(0, boxY, 0, logicalHeight);
      glassGrad.addColorStop(0, "rgba(10, 16, 26, 0.58)");
      glassGrad.addColorStop(1, "rgba(6, 10, 18, 0.68)");
      targetCtx.fillStyle = glassGrad;
      targetCtx.fillRect(0, boxY, logicalWidth, logicalHeight - boxY);
    }

    targetCtx.restore();

    if (f.isBlur) {
      // Apply UNIFIED 100% Full-Screen Deep Soft-Blur to the main canvas
      ctx.clearRect(0, 0, width, height);
      ctx.filter = "blur(12px) brightness(0.88)";
      ctx.drawImage(offCanvas, 0, 0, width, height);
      ctx.filter = "none";
    } else if (f.cameraBlur) {
      // Apply Temporary Camera Shockwave Blur to the battle scene
      ctx.clearRect(0, 0, width, height);
      const blurPx = typeof f.cameraBlur === "number" ? f.cameraBlur : 3.5;
      const margin = Math.ceil(blurPx * 2);
      ctx.drawImage(offCanvas, 0, 0, width, height);
      ctx.filter = `blur(${blurPx}px)`;
      ctx.drawImage(offCanvas, -margin, -margin, width + margin * 2, height + margin * 2);
      ctx.filter = "none";

      // Render crisp UI on top of blurred camera scene
      if (!f.blackoutScreen && !f.blackFadeAlpha) {
        ctx.save();
        ctx.scale(renderScale, renderScale);
        if (!f.hideUI) {
          renderBattleHeader(ctx, logicalWidth, battle, isKo);
        }
        if (!f.hideHud && !f.hideUI) {
          renderBattleHuds(ctx, battle, isKo, pbAssets, curRenderEnemyHp, curRenderPlayerHp, undefined, curRenderEnemyStatus, curRenderPlayerStatus);
        }
        if (!f.hideDialogue && !f.hideUI) {
          renderBattleDialogue(ctx, logicalWidth, logicalHeight, dialogueLines, f.textLineIdx);
        }
        if (f.drawPlayerAboveHud && drawPlayerSpriteFn) {
          drawPlayerSpriteFn();
        }
        ctx.restore();
      }
    }

    let effectiveDelay = f.delay;
    if (f.delay >= 10000) {
      effectiveDelay = f.delay;
    } else if (f.isBlur) {
      // Full cinematic blur delay (default 800ms)
      effectiveDelay = f.delay || 800;
    } else {
      // 30 FPS uniform fluid timing (33ms)
      effectiveDelay = f.delay || 33;
    }

    // 🎨 [256색 팔레트 최적화]: 시각적 급변 프레임(블러 종료, 타격 섬광, 상성 틴트 On/Off, 이펙트 시작/종료, 위상 변경 등)에서는
    // 팔레트 재사용을 리셋하여 256색 팔레트가 신규 색상을 정확하고 풍성하게 담도록 보장
    const isVisualStateShift = Boolean(
      (frameIdx === 1) ||
      (prevBattleFrame && Boolean(f.isBlur) !== Boolean(prevBattleFrame.isBlur)) ||
      (prevBattleFrame && Boolean(f.cameraBlur) !== Boolean(prevBattleFrame.cameraBlur)) ||
      (prevBattleFrame && Boolean(f.hitFlash) !== Boolean(prevBattleFrame.hitFlash)) ||
      (prevBattleFrame && Boolean(f.whiteFlash) !== Boolean(prevBattleFrame.whiteFlash)) ||
      (prevBattleFrame && Boolean(f.targetBlueTint) !== Boolean(prevBattleFrame.targetBlueTint)) ||
      (prevBattleFrame && Boolean(f.targetRedTint) !== Boolean(prevBattleFrame.targetRedTint)) ||
      (prevBattleFrame && Boolean(f.targetPurpleLevel) !== Boolean(prevBattleFrame.targetPurpleLevel)) ||
      (prevBattleFrame && Boolean(f.eWhite) !== Boolean(prevBattleFrame.eWhite)) ||
      (prevBattleFrame && Boolean(f.pWhite) !== Boolean(prevBattleFrame.pWhite)) ||
      (prevBattleFrame && Boolean(f.showEffect) !== Boolean(prevBattleFrame.showEffect)) ||
      (prevBattleFrame && Boolean(f.blackoutScreen) !== Boolean(prevBattleFrame.blackoutScreen)) ||
      (prevBattleFrame && Boolean(f.blackFadeAlpha) !== Boolean(prevBattleFrame.blackFadeAlpha)) ||
      (prevBattleFrame && Boolean(f.bgFilterAlpha) !== Boolean(prevBattleFrame.bgFilterAlpha)) ||
      (prevBattleFrame && Boolean(f.whiteoutAlpha) !== Boolean(prevBattleFrame.whiteoutAlpha)) ||
      (prevBattleFrame && Boolean(f.targetYellowAura || f.eYellowAura || f.pYellowAura || f.casterYellowAura) !== Boolean(prevBattleFrame.targetYellowAura || prevBattleFrame.eYellowAura || prevBattleFrame.pYellowAura || prevBattleFrame.casterYellowAura)) ||
      (prevBattleFrame && Boolean(f.targetWhiteAura || f.eWhiteAura || f.pWhiteAura) !== Boolean(prevBattleFrame.targetWhiteAura || prevBattleFrame.eWhiteAura || prevBattleFrame.pWhiteAura)) ||
      (prevBattleFrame && (f.targetWhiteOpacity !== prevBattleFrame.targetWhiteOpacity || f.targetWhiteBorderAlpha !== prevBattleFrame.targetWhiteBorderAlpha)) ||
      (prevBattleFrame && f.phaseId && prevBattleFrame.phaseId ? f.phaseId !== prevBattleFrame.phaseId : (prevBattleFrame && f.moveStep !== undefined && prevBattleFrame.moveStep !== undefined && f.moveStep !== prevBattleFrame.moveStep))
    );

    if (isVisualStateShift) {
      (encoder as any).reuseTab = false;
      (encoder as any).prevImage = null;
    }

    encoder.setDelay(effectiveDelay);
    encoder.addFrame(ctx);
    prevBattleFrame = f;

    if (options.includeFramePreviews) {
      const phaseId = f.phaseId || (f.isBlur ? "blur" : (f.hitFlash ? "strike" : (f.showEffect ? "effect" : "neutral")));
      const phaseName = f.phaseName || (f.isBlur ? "초기 로딩 (블러)" : (f.hitFlash ? "타격 작렬" : (f.showEffect ? "기술 이펙트" : "중립 대기")));
      phases.push({
        phaseId,
        phaseName,
        frameIndex: frameIdx,
        delay: effectiveDelay,
        pOffset: f.pOffset,
        eOffset: f.eOffset,
        cameraZoom: f.cameraZoom,
        playerHp: f.playerHp,
        enemyHp: f.enemyHp,
        dataUrl: ctx.canvas.toDataURL("image/jpeg", 0.85),
      });
    }
    frameIdx++;
  }

  const totalMotionMs = framesConfig
    .filter(f => f.delay < 10000)
    .reduce((sum, f) => sum + (f.isBlur ? (f.delay || 800) : (f.delay || 33)), 0);

  encoder.finish();
  return {
    buffer: encoder.out.getData(),
    motionDurationMs: totalMotionMs,
    phases: options.includeFramePreviews ? phases : undefined,
  };
}

/**
 * 2. Knockout / Fainting GIF (Full move casting animation + Sinking faint collapse)
 */
export async function renderBattleFaintGif(options: BattleAnimationOptions): Promise<RenderGifResult> {
  return renderBattleMoveGif(options);
}

/**
 * 3. Wild Encounter Entry GIF:
 */
export async function renderBattleEntryGif(options: BattleAnimationOptions): Promise<RenderGifResult> {
  const logicalWidth = 560;
  const logicalHeight = 380;
  const renderScale = 0.75; // 420x285 경량화 규격 (배틀 애니메이션 규격과 1:1 통일!)
  const width = Math.round(logicalWidth * renderScale);   // 420
  const height = Math.round(logicalHeight * renderScale); // 285
  const isKo = options.lang === "ko";
  const battle = options.battle;
  const enemy = battle.enemy;
  const playerMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];

  const entryType = options.entryType || "both";

  const defaultEntryDialogue = isKo
    ? (entryType === "player"
      ? `가랏, ${playerMon.nameKo || playerMon.name}!`
      : (entryType === "enemy"
        ? `상대는 [${enemy.nameKo || enemy.name}]을(를) 내보냈다!`
        : (enemy.isBoss ? `보스 포켓몬 ${enemy.nameKo || enemy.name}(이)가 나타났다!` : `야생의 ${enemy.nameKo || enemy.name}(이)가 나타났다!`)
      ))
    : (entryType === "player"
      ? `Go, ${playerMon.name}!`
      : (entryType === "enemy"
        ? `Foe sent out ${enemy.name}!`
        : (enemy.isBoss ? `Boss Pokémon ${enemy.name} appeared!` : `Wild ${enemy.name} appeared!`)
      ));
  const rawDialogue = battle.dialogueText || defaultEntryDialogue;
  const dialogueLines = options.dialogueLines || rawDialogue.replace(/\\n/g, "\n").split("\n");

  const enemyActiveSpecies = (enemy as any).isTransformed
    ? ((enemy as any).transformedSpeciesId || enemy.speciesId || (enemy as any).species)
    : (enemy.speciesId || (enemy as any).species || "onix");
  const playerActiveSpecies = (playerMon as any)?.isTransformed
    ? ((playerMon as any).transformedSpeciesId || playerMon.speciesId || (playerMon as any).species)
    : ((playerMon as any)?.hasIllusion && (playerMon as any).illusionTarget
      ? ((playerMon as any).illusionTarget.speciesId || (playerMon as any).illusionTarget.species)
      : (playerMon?.speciesId || (playerMon as any)?.species || "bulbasaur"));

  const enemyShinyTier = (enemy as any).shinyTier !== undefined ? (enemy as any).shinyTier : (enemy.isShiny ? 1 : 0);
  const playerShinyTier = ((playerMon as any)?.hasIllusion && (playerMon as any).illusionTarget)
    ? ((playerMon as any).illusionTarget.shinyTier !== undefined ? (playerMon as any).illusionTarget.shinyTier : ((playerMon as any).illusionTarget.isShiny ? 1 : 0))
    : ((playerMon as any)?.shinyTier !== undefined ? (playerMon as any).shinyTier : ((playerMon as any)?.isShiny ? 1 : 0));

  const [arena, pbAssets, enemySprite, playerSprite] = await Promise.all([
    getArenaAssets(battle.biome || "Town"),
    getPbInfoAssets(),
    getPokemonSprite(enemyActiveSpecies, true, enemyShinyTier, false),
    getPokemonSprite(playerActiveSpecies, true, playerShinyTier, true),
  ]);

  // 🎨 [GIF 렌더링 표준 지침 - 256색 팔레트 최적화(Octree Optimizer, threshold: 85)]
  const encoder = new GIFEncoder(width, height, "octree", true);
  encoder.setThreshold(85);
  encoder.setRepeat(-1);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const entryFrames = entryType === "player" ? [
    // Player Replacement Entry Frames
    // Frame 0: Leading Cinematic Soft-Blur Loading Frame (800ms)
    { delay: 800, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 0.0, showHud: false, textLineIdx: 0, isBlur: true, cryWave: 0 },
    // Frame 1: Fade-in Step 1 (120ms) - At (-15px, +10px) 35% translucent
    { delay: 120, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: -15, pMonY: 10, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 0.35, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 2: Fade-in Step 2 (120ms) - 75% opacity
    { delay: 120, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: -15, pMonY: 10, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 0.75, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 3: Fade-in Hold (280ms) - 100% FULLY OPAQUE
    { delay: 280, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: -15, pMonY: 10, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 4: Movement Step 1 (140ms) - moves towards center
    { delay: 140, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: -6, pMonY: 4, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 5: Movement Step 2 (140ms) - Settles onto Stage at (0, 0)
    { delay: 140, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 6: Player Battler DS Cry Callout (Vibration Step 1: 150ms)
    { delay: 150, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: -2, pMonY: -3, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 1 },
    // Frame 7: Player Battler DS Cry Callout (Vibration Step 2: 150ms)
    { delay: 150, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 3, pMonY: 2, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 2 },
    // Frame 8: HUD Status Slates Slide In & Appear (300ms)
    { delay: 300, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: true, textLineIdx: 99, isBlur: false, cryWave: 0 },
    // Frame 9: Dialogue reading frame (1,200ms)
    { delay: 1200, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: true, textLineIdx: 99, isBlur: false, cryWave: 0 },
    // Frame 10: 11-Minute Static Hold Frame (655,000ms)
    { delay: 655000, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: true, textLineIdx: 99, isBlur: false, cryWave: 0 }
  ] : [
    // Wild Encounter or Enemy Entry Frames
    // Frame 0: Leading Cinematic Soft-Blur Loading Frame (800ms / 0.8s)
    { delay: 800, pPlatX: 0, ePlatX: 24, ePlatY: -15, pMonX: 0, pMonY: 0, eMonX: 24, eMonY: -15, enemyOpacity: 0.0, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: true, cryWave: 0 },
    // Frame 1: Fade-in Step 1 (120ms)
    { delay: 120, pPlatX: 0, ePlatX: 24, ePlatY: -15, pMonX: 0, pMonY: 0, eMonX: 24, eMonY: -15, enemyOpacity: 0.35, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 2: Fade-in Step 2 (120ms)
    { delay: 120, pPlatX: 0, ePlatX: 24, ePlatY: -15, pMonX: 0, pMonY: 0, eMonX: 24, eMonY: -15, enemyOpacity: 0.75, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 3: Fade-in Hold (280ms)
    { delay: 280, pPlatX: 0, ePlatX: 24, ePlatY: -15, pMonX: 0, pMonY: 0, eMonX: 24, eMonY: -15, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 4: Movement Step 1 (140ms)
    { delay: 140, pPlatX: 0, ePlatX: 10, ePlatY: -6, pMonX: 0, pMonY: 0, eMonX: 10, eMonY: -6, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 5: Movement Step 2 (140ms)
    { delay: 140, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 0 },
    // Frame 6: Enemy Battler DS Cry Callout (Vibration Step 1: 150ms)
    { delay: 150, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 0, pMonY: 0, eMonX: -2, eMonY: -3, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 1 },
    // Frame 7: Enemy Battler DS Cry Callout (Vibration Step 2: 150ms)
    { delay: 150, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 0, pMonY: 0, eMonX: 3, eMonY: 2, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: false, textLineIdx: 0, isBlur: false, cryWave: 2 },
    // Frame 8: HUD Status Slates Slide In & Appear (300ms)
    { delay: 300, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: true, textLineIdx: 99, isBlur: false, cryWave: 0 },
    // Frame 9: Reading frame (1,200ms)
    { delay: 1200, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: true, textLineIdx: 99, isBlur: false, cryWave: 0 },
    // Frame 10: 11-Minute Static Hold Frame (655,000ms)
    { delay: 655000, pPlatX: 0, ePlatX: 0, ePlatY: 0, pMonX: 0, pMonY: 0, eMonX: 0, eMonY: 0, enemyOpacity: 1.0, playerOpacity: 1.0, showHud: true, textLineIdx: 99, isBlur: false, cryWave: 0 }
  ];

  const motionDurationMs = entryFrames.slice(0, -1).reduce((sum, f) => sum + f.delay, 0);

  const ep = BATTLE_LAYOUT_CONFIG.enemyPlatform;
  const pp = BATTLE_LAYOUT_CONFIG.playerPlatform;
  const enemyPlatW = 320 * ep.scale;
  const enemyPlatH = 132 * ep.scale;
  const playerPlatW = 320 * pp.scale;
  const playerPlatH = 132 * pp.scale;

  const em = BATTLE_LAYOUT_CONFIG.enemyPokemon;
  const pm = BATTLE_LAYOUT_CONFIG.playerPokemon;

  const offEntryCanvas = createCanvas(width, height);
  const offEntryCtx = offEntryCanvas.getContext("2d");
  offEntryCtx.imageSmoothingEnabled = false;

  let entryFrameIdx = 0;
  let prevEntryFrame: any = null;

  for (const f of entryFrames) {
    const targetCtx = f.isBlur ? offEntryCtx : ctx;
    targetCtx.clearRect(0, 0, width, height);

    targetCtx.save();
    targetCtx.scale(renderScale, renderScale);

    if (arena.bg) targetCtx.drawImage(arena.bg, 0, 0, logicalWidth, logicalHeight);
    else { targetCtx.fillStyle = "#487848"; targetCtx.fillRect(0, 0, logicalWidth, logicalHeight); }

    const eOpacity = f.enemyOpacity !== undefined ? f.enemyOpacity : 1.0;
    const pOpacity = (f as any).playerOpacity !== undefined ? (f as any).playerOpacity : 1.0;

    // Sliding / Fading Platforms
    if (arena.b) {
      // Enemy Platform: with enemyOpacity and (ePlatX, ePlatY)
      if (entryType === "player" || eOpacity > 0) {
        targetCtx.save();
        if (entryType !== "player") targetCtx.globalAlpha = eOpacity;
        targetCtx.drawImage(arena.b, ep.x + (f.ePlatX || 0), ep.y + ((f as any).ePlatY || 0), enemyPlatW, enemyPlatH);
        targetCtx.restore();
      }
      // Player Platform: always static at pp.x, pp.y with 100% opacity
      targetCtx.save();
      targetCtx.translate(logicalWidth, 0);
      targetCtx.scale(-1, 1);
      targetCtx.drawImage(arena.b, pp.x + f.pPlatX, pp.y, playerPlatW, playerPlatH);
      targetCtx.restore();
    }

    // Battler Sprites (with DS Cry vibration offsets and enemy fade-in)
    if (enemySprite && eOpacity > 0) {
      targetCtx.save();
      targetCtx.globalAlpha = eOpacity;
      drawFittedBattleSprite(targetCtx, enemySprite, em.x + (f.eMonX || 0), em.y + (f.eMonY || 0), em.size, getStatusTintColor(enemy.status));
      targetCtx.restore();
    }
    if (playerSprite && pOpacity > 0) {
      targetCtx.save();
      targetCtx.globalAlpha = pOpacity;
      drawFittedBattleSprite(targetCtx, playerSprite, pm.x + (f.pMonX || 0), pm.y + (f.pMonY || 0), pm.size, getStatusTintColor(playerMon.status));
      targetCtx.restore();
    }

    if (!f.isBlur) {
      renderBattleHeader(targetCtx, logicalWidth, battle, isKo);
      if (f.showHud) {
        renderBattleHuds(targetCtx, battle, isKo, pbAssets, enemy.hp, playerMon.hp, undefined, enemy.status, playerMon.status);
      }
      renderBattleDialogue(targetCtx, logicalWidth, logicalHeight, dialogueLines, f.textLineIdx);
    } else {
      // Base empty dialogue box drawn on offEntryCanvas before full-frame blur
      const boxY = 270;
      const glassGrad = targetCtx.createLinearGradient(0, boxY, 0, logicalHeight);
      glassGrad.addColorStop(0, "rgba(10, 16, 26, 0.58)");
      glassGrad.addColorStop(1, "rgba(6, 10, 18, 0.68)");
      targetCtx.fillStyle = glassGrad;
      targetCtx.fillRect(0, boxY, logicalWidth, logicalHeight - boxY);
    }

    targetCtx.restore();

    if (f.isBlur) {
      // Apply UNIFIED 100% Full-Screen Deep Soft-Blur to main canvas
      ctx.clearRect(0, 0, width, height);
      ctx.filter = "blur(12px) brightness(0.88)";
      ctx.drawImage(offEntryCanvas, 0, 0, width, height);
      ctx.filter = "none";
    }

    const isEntryVisualShift = Boolean(
      (entryFrameIdx === 1) ||
      (prevEntryFrame && Boolean(f.isBlur) !== Boolean(prevEntryFrame.isBlur)) ||
      (prevEntryFrame && Boolean(f.showHud) !== Boolean(prevEntryFrame.showHud)) ||
      (prevEntryFrame && Boolean(f.enemyOpacity > 0) !== Boolean(prevEntryFrame.enemyOpacity > 0)) ||
      (prevEntryFrame && Boolean((f as any).playerOpacity > 0) !== Boolean((prevEntryFrame as any).playerOpacity > 0))
    );

    if (isEntryVisualShift) {
      (encoder as any).reuseTab = false;
      (encoder as any).prevImage = null;
    }

    encoder.setDelay(f.delay);
    encoder.addFrame(ctx);
    prevEntryFrame = f;
    entryFrameIdx++;
  }

  encoder.finish();
  return { buffer: encoder.out.getData(), motionDurationMs };
}

/**
 * Shared Header Rendering (Biome - Wave, Money)
 */
function renderBattleHeader(ctx: any, width: number, battle: BattleState, isKo: boolean) {
  const rawBiome = battle.biome || "Town";
  const biomeDisplay = isKo ? (BIOME_NAMES_KO[rawBiome.toLowerCase()] || rawBiome) : rawBiome;
  const waveText = `${biomeDisplay} - ${battle.wave || 1}`;
  const moneyText = formatMoney(battle.money || 0);

  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const textX = width - 24;

  const waveY = 14;
  ctx.font = "bold 15px DungGeunMo";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  ctx.strokeText(waveText, textX, waveY);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(waveText, textX, waveY);

  const moneyY = waveY + 20;
  ctx.font = "bold 13px DungGeunMo";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 3.0;
  ctx.strokeText(moneyText, textX, moneyY);
  ctx.fillStyle = "#FDE047";
  ctx.fillText(moneyText, textX, moneyY);
}

function getStatusBadge(status: string | null | undefined, isKo: boolean): string {
  if (!status) return "";
  switch (status.toLowerCase()) {
    case "psn":
      return isKo ? " [독]" : " [PSN]";
    case "tox":
      return isKo ? " [맹독]" : " [TOX]";
    case "par":
      return isKo ? " [마비]" : " [PAR]";
    case "brn":
      return isKo ? " [화상]" : " [BRN]";
    case "slp":
      return isKo ? " [수면]" : " [SLP]";
    case "frz":
      return isKo ? " [빙결]" : " [FRZ]";
    default:
      return "";
  }
}

function renderBattleHuds(
  ctx: any,
  battle: BattleState,
  isKo: boolean,
  pbAssets: any,
  enemyHp: number,
  playerHp: number,
  playerHudOffset?: { x?: number; y?: number },
  enemyStatus?: string | null,
  playerStatus?: string | null
) {
  const enemy = battle.enemy;
  const playerMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];

  const eStatus = enemyStatus !== undefined ? enemyStatus : enemy.status;
  const pStatus = playerStatus !== undefined ? playerStatus : playerMon.status;

  const eh = BATTLE_LAYOUT_CONFIG.enemyHud;
  const cleanEnemyName = getPokemonDisplayName(enemy, isKo).replace(/[^\w\s가-힣0-9\(\)\-\.]/g, "").trim();
  const enemySpeciesData = POKEMON_SPECIES_DATA[enemy.speciesId] || null;
  const enemyTypes = enemy.types || (enemySpeciesData ? enemySpeciesData.types : ["normal"]);

  drawPokeRogueBattleHud(ctx, {
    x: eh.x,
    y: eh.y,
    w: eh.w,
    h: eh.h,
    name: cleanEnemyName,
    level: enemy.level,
    hp: Math.max(0, Math.round(enemyHp)),
    maxHp: enemy.maxHp,
    isEnemy: true,
    types: enemyTypes,
    isBoss: enemy.isBoss,
    bossShields: enemy.bossShields,
    statusBadge: getStatusBadge(eStatus, isKo),
    isKo,
    hudImage: enemy.isBoss ? pbAssets.bossBox : pbAssets.enemyBox,
    hpLabel: pbAssets.hpLabel,
  });

  const ph = BATTLE_LAYOUT_CONFIG.playerHud;
  const cleanPlayerName = getPokemonDisplayName(playerMon, isKo).replace(/[^\w\s가-힣0-9\(\)\-\.]/g, "").trim();
  const playerSpeciesData = POKEMON_SPECIES_DATA[playerMon.speciesId] || null;
  const playerTypes = playerMon.types || (playerSpeciesData ? playerSpeciesData.types : ["normal"]);

  drawPokeRogueBattleHud(ctx, {
    x: ph.x + (playerHudOffset?.x || 0),
    y: ph.y + (playerHudOffset?.y || 0),
    w: ph.w,
    h: ph.h,
    name: cleanPlayerName,
    level: playerMon.level,
    hp: Math.max(0, Math.round(playerHp)),
    maxHp: playerMon.maxHp,
    isEnemy: false,
    types: playerTypes,
    statusBadge: getStatusBadge(pStatus, isKo),
    exp: battle.playerExp || 0,
    maxExp: battle.playerMaxExp || 100,
    isKo,
    hudImage: pbAssets.playerBox,
    hpLabel: pbAssets.hpLabel,
  });
}

/**
 * Shared Dialogue Box Rendering
 */
function renderBattleDialogue(ctx: any, width: number, height: number, dialogueLines: string[], textLineIdx: number, textOnly: boolean = false) {
  const boxY = 270;
  if (!textOnly) {
    const glassGrad = ctx.createLinearGradient(0, boxY, 0, height);
    glassGrad.addColorStop(0, "rgba(10, 16, 26, 0.58)");
    glassGrad.addColorStop(1, "rgba(6, 10, 18, 0.68)");
    ctx.fillStyle = glassGrad;
    ctx.fillRect(0, boxY, width, height - boxY);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "bold 15px DungGeunMo";

  if (textLineIdx > 0) {
    const fullText = dialogueLines.join("\n");
    const wrapped = wrapDialogueText(ctx, fullText, width - 48);
    const available = wrapped.slice(0, textLineIdx);
    const linesToShow = available.length > 3 ? available.slice(-3) : available;
    linesToShow.forEach((line: string, lIdx: number) => {
      const textY = boxY + 16 + lIdx * 26;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
      ctx.lineWidth = 3.5;

      const perkMatch = line.match(/^\[PERK:([a-z_]+)\]\s*(.*)$/);
      if (perkMatch) {
        const perkId = perkMatch[1] as BallPerkId;
        const cleanLine = perkMatch[2];
        const svgImg = getPerkSvgImageSync(perkId);
        if (svgImg) {
          ctx.drawImage(svgImg, 24, textY - 1, 18, 18);
        }
        const textX = svgImg ? (24 + 22) : 24;
        ctx.strokeText(cleanLine, textX, textY);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(cleanLine, textX, textY);
      } else {
        ctx.strokeText(line, 24, textY);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(line, 24, textY);
      }
    });
  }
}
