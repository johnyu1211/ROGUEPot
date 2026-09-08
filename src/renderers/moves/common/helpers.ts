import { createCanvas, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

export let karateBlackImg: any = null;
export let karateRedImg: any = null;
export let doubleSlapWhiteImg: any = null;
export let cometPunchFistImg: any = null;
export let firePunchFistCanvas: any = null;
export let icePunchFistCanvas: any = null;
export let thunderPunchFistCanvas: any = null;
export let kickFootprintImg: any = null;

export function createTintedFistCanvas(img: any, fillHex: string) {
  if (!img || !img.width || !img.height) return null;
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;

  const r = parseInt(fillHex.slice(1, 3), 16);
  const g = parseInt(fillHex.slice(3, 5), 16);
  const b = parseInt(fillHex.slice(5, 7), 16);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 30) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 30) {
        const factor = brightness / 255;
        data[i] = Math.min(255, Math.round(r * factor * 1.25));
        data[i + 1] = Math.min(255, Math.round(g * factor * 1.25));
        data[i + 2] = Math.min(255, Math.round(b * factor * 1.25));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// Top-level await guarantees 100% decoded pixel buffers before any render call
try {
  const bPath = path.resolve(process.cwd(), "assets/effects/karate_chop_black.png");
  if (fs.existsSync(bPath)) karateBlackImg = await loadImage(bPath);

  const rPath = path.resolve(process.cwd(), "assets/effects/karate_chop_red.png");
  if (fs.existsSync(rPath)) karateRedImg = await loadImage(rPath);

  const wPath = path.resolve(process.cwd(), "assets/effects/double_slap_white.png");
  if (fs.existsSync(wPath)) doubleSlapWhiteImg = await loadImage(wPath);

  const pPath = path.resolve(process.cwd(), "assets/effects/comet_punch_fist.png");
  if (fs.existsSync(pPath)) {
    cometPunchFistImg = await loadImage(pPath);
    firePunchFistCanvas = createTintedFistCanvas(cometPunchFistImg, "#FF6B00");
    icePunchFistCanvas = createTintedFistCanvas(cometPunchFistImg, "#00D2FF");
    thunderPunchFistCanvas = createTintedFistCanvas(cometPunchFistImg, "#FFD700");
  }

  const kPath = path.resolve(process.cwd(), "assets/effects/kick_footprint.png");
  if (fs.existsSync(kPath)) kickFootprintImg = await loadImage(kPath);
} catch (err) {
  // Ignore error
}

export function getKickFootprintImg(): any {
  return kickFootprintImg;
}

export function getKarateBlackImg(): any {
  return karateBlackImg;
}

export function getKarateRedImg(): any {
  return karateRedImg;
}

export function getDoubleSlapWhiteImg(): any {
  return doubleSlapWhiteImg;
}

export function getCometPunchFistImg(): any {
  return cometPunchFistImg;
}

export function getFirePunchFistCanvas(): any {
  return firePunchFistCanvas;
}

export function getIcePunchFistCanvas(): any {
  return icePunchFistCanvas;
}

export function getThunderPunchFistCanvas(): any {
  return thunderPunchFistCanvas;
}

export async function preloadMoveAssets() {
  // Pre-loaded synchronously via top-level await!
}

/**
 * Common Helper: Mini Pixel Star Impact Burst
 */
export function drawMiniRetroStar(ctx: any, cx: number, cy: number, size: number, color: string = "#FFFFFF") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(cx, cy);

  const half = size / 2;
  const quarter = size / 4;

  ctx.beginPath();
  ctx.moveTo(0, -half);
  ctx.lineTo(quarter, -quarter);
  ctx.lineTo(half, 0);
  ctx.lineTo(quarter, quarter);
  ctx.lineTo(0, half);
  ctx.lineTo(-quarter, quarter);
  ctx.lineTo(-half, 0);
  ctx.lineTo(-quarter, -quarter);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Common Helper: High-Quality Impact Starburst & Shockwave Ring
 */
export function drawStarburstImpact(ctx: any, tx: number, ty: number, color1: string, color2: string, radius = 34) {
  const hitGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, radius);
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

  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    const r1 = radius * 0.30;
    const r2 = radius * (0.85 + (a % 2) * 0.35);
    const x1 = tx + Math.cos(a) * r1;
    const y1 = ty + Math.sin(a) * r1;
    const x2 = tx + Math.cos(a) * r2;
    const y2 = ty + Math.sin(a) * r2;

    const streakGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    streakGrad.addColorStop(0, "#FFFFFF");
    streakGrad.addColorStop(0.35, color2);
    streakGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.strokeStyle = streakGrad;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

/**
 * Stat Boost Effect (능력치 향상 / 랭크 상승)
 * - [유저 피드백: "능력치 향상시 파티클 올라가는게 너무 일정해ㅔ서 부자연스러워보여"]
 * - 기계적인 동시/대칭 상승 및 직선 궤적을 탈피하고, 자연스러운 에너지 기류 연출
 * - 시차(Spawn), 시작 고도(startYOff), 수평 시작점(baseX), 상승 속도(speed),
 *   수평 완만한 방사(driftDist), 부드러운 수평 파동(swayAmp & phase), 가속 곡선(easeY),
 *   파티클 체급 다양화(대형 오라 구체 / 중형 에너지 모트 / 미세 골든 스파클)로 유기적인 랭크업 연출
 */
export function drawStatBoostEffect(ctx: any, pos: { x: number; y: number }, progress: number = 0.5) {
  ctx.save();
  const clampedProgress = Math.min(1.0, Math.max(0.0, progress));
  if (clampedProgress <= 0.0 || clampedProgress >= 1.0) {
    ctx.restore();
    return;
  }

  const orbConfigs = [
    // Phase 1 (0.00 ~ 0.20): 초기 자연스러운 기저 분출
    { baseX: -22, startYOff:  8, driftDir: -1, driftDist: 26, swayAmp: 4.5, phase: 0.5, spawn: 0.00, life: 0.48, speed: 118, easeY: 0.90, radius: 6.8, tier: "core" },
    { baseX:  16, startYOff:  2, driftDir:  1, driftDist: 34, swayAmp: 5.0, phase: 2.1, spawn: 0.03, life: 0.46, speed: 128, easeY: 0.85, radius: 4.5, tier: "mote" },
    { baseX:  -4, startYOff: 12, driftDir:  0, driftDist:  8, swayAmp: 3.5, phase: 4.2, spawn: 0.06, life: 0.50, speed:  92, easeY: 1.05, radius: 2.6, tier: "spark" },
    { baseX:  28, startYOff: -4, driftDir:  1, driftDist: 38, swayAmp: 4.0, phase: 1.4, spawn: 0.10, life: 0.45, speed: 110, easeY: 0.95, radius: 7.2, tier: "core" },
    { baseX: -12, startYOff:  6, driftDir: -1, driftDist: 18, swayAmp: 5.5, phase: 3.6, spawn: 0.13, life: 0.47, speed: 132, easeY: 0.88, radius: 4.2, tier: "mote" },
    { baseX:   6, startYOff: 14, driftDir:  1, driftDist: 22, swayAmp: 3.0, phase: 5.1, spawn: 0.17, life: 0.50, speed:  86, easeY: 1.10, radius: 2.8, tier: "spark" },

    // Phase 2 (0.20 ~ 0.38): 중반 활발한 상승 기류 형성
    { baseX: -30, startYOff: -2, driftDir: -1, driftDist: 40, swayAmp: 6.0, phase: 1.8, spawn: 0.20, life: 0.46, speed: 115, easeY: 0.92, radius: 6.5, tier: "core" },
    { baseX:  10, startYOff:  8, driftDir:  1, driftDist: 28, swayAmp: 4.2, phase: 4.5, spawn: 0.23, life: 0.48, speed: 124, easeY: 0.86, radius: 4.6, tier: "mote" },
    { baseX: -18, startYOff: 10, driftDir: -1, driftDist: 20, swayAmp: 3.8, phase: 0.8, spawn: 0.27, life: 0.50, speed:  96, easeY: 1.05, radius: 2.5, tier: "spark" },
    { baseX:  22, startYOff:  4, driftDir:  1, driftDist: 36, swayAmp: 5.2, phase: 3.2, spawn: 0.30, life: 0.46, speed: 120, easeY: 0.90, radius: 7.0, tier: "core" },
    { baseX:  -2, startYOff: -6, driftDir:  0, driftDist: 10, swayAmp: 4.8, phase: 5.5, spawn: 0.33, life: 0.47, speed: 135, easeY: 0.84, radius: 4.0, tier: "mote" },
    { baseX: -26, startYOff: 12, driftDir: -1, driftDist: 32, swayAmp: 3.5, phase: 2.6, spawn: 0.36, life: 0.49, speed:  88, easeY: 1.12, radius: 2.7, tier: "spark" },

    // Phase 3 (0.38 ~ 0.54): 클라이맥스 랭크업 에너지 만개
    { baseX:  14, startYOff:  0, driftDir:  1, driftDist: 30, swayAmp: 5.5, phase: 1.1, spawn: 0.39, life: 0.46, speed: 122, easeY: 0.88, radius: 6.6, tier: "core" },
    { baseX: -14, startYOff:  6, driftDir: -1, driftDist: 24, swayAmp: 4.0, phase: 3.8, spawn: 0.42, life: 0.47, speed: 112, easeY: 0.94, radius: 4.4, tier: "mote" },
    { baseX:  26, startYOff:  8, driftDir:  1, driftDist: 42, swayAmp: 4.5, phase: 5.9, spawn: 0.45, life: 0.48, speed:  98, easeY: 1.02, radius: 2.4, tier: "spark" },
    { baseX:  -8, startYOff: 14, driftDir: -1, driftDist: 16, swayAmp: 5.0, phase: 2.3, spawn: 0.48, life: 0.46, speed: 130, easeY: 0.85, radius: 6.8, tier: "core" },
    { baseX:  18, startYOff: -4, driftDir:  1, driftDist: 32, swayAmp: 3.8, phase: 4.1, spawn: 0.51, life: 0.46, speed: 116, easeY: 0.90, radius: 4.2, tier: "mote" },

    // Phase 4 (0.54 ~ 0.70): 후반 잔여 에너지 비산 및 승화
    { baseX: -20, startYOff:  4, driftDir: -1, driftDist: 28, swayAmp: 4.2, phase: 0.4, spawn: 0.54, life: 0.45, speed: 125, easeY: 0.88, radius: 5.8, tier: "core" },
    { baseX:   4, startYOff: 10, driftDir:  0, driftDist: 12, swayAmp: 3.5, phase: 3.0, spawn: 0.57, life: 0.46, speed:  94, easeY: 1.05, radius: 2.6, tier: "spark" },
    { baseX:  12, startYOff:  2, driftDir:  1, driftDist: 26, swayAmp: 4.8, phase: 5.0, spawn: 0.60, life: 0.44, speed: 118, easeY: 0.92, radius: 4.5, tier: "mote" },
    { baseX: -10, startYOff: -6, driftDir: -1, driftDist: 18, swayAmp: 3.8, phase: 2.0, spawn: 0.63, life: 0.43, speed: 132, easeY: 0.86, radius: 3.8, tier: "mote" },
    { baseX:  24, startYOff:  8, driftDir:  1, driftDist: 34, swayAmp: 4.0, phase: 4.4, spawn: 0.66, life: 0.42, speed: 105, easeY: 0.95, radius: 2.5, tier: "spark" },
  ];

  for (const cfg of orbConfigs) {
    if (clampedProgress < cfg.spawn || clampedProgress > cfg.spawn + cfg.life) continue;
    const t = (clampedProgress - cfg.spawn) / cfg.life; // 0.0 -> 1.0 within its lifetime

    // 부드러운 생성 & 정상 도달 후 자연스러운 기화 페이드아웃
    const alpha = Math.sin(t * Math.PI * 0.70 + 0.30) * Math.pow(1.0 - t, 1.1) * 0.96;
    if (alpha <= 0.02) continue;

    // 개별 가속도(easeY) 기반 상승 + 수평 유기적 요동(sway) 및 측면 확산(drift)
    const soarT = Math.pow(t, cfg.easeY);
    const startY = pos.y + cfg.startYOff;
    const orbY = startY - (soarT * cfg.speed);

    const drift = cfg.driftDir * Math.pow(t, 0.95) * cfg.driftDist;
    const sway = Math.sin(t * Math.PI * 2 + cfg.phase) * cfg.swayAmp;
    const orbX = pos.x + cfg.baseX + drift + sway;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (cfg.tier === "core") {
      // 1. 대형 랭크업 코어 오브 (생생한 오렌지 바디 + 아프리콧 하이라이트 + 앰버 림)
      const r = cfg.radius * (1.0 - 0.22 * t);
      ctx.fillStyle = "rgba(249, 115, 22, 0.96)";
      ctx.beginPath();
      ctx.arc(orbX, orbY, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(234, 88, 12, 0.85)";
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.fillStyle = "rgba(254, 215, 170, 0.95)";
      ctx.beginPath();
      ctx.arc(orbX, orbY, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (cfg.tier === "mote") {
      // 2. 중형 에너지 모트 (부유하는 밝은 웜 앰버)
      const r = cfg.radius * (1.0 - 0.20 * t);
      ctx.fillStyle = "rgba(251, 146, 60, 0.95)";
      ctx.beginPath();
      ctx.arc(orbX, orbY, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 237, 213, 0.90)";
      ctx.beginPath();
      ctx.arc(orbX, orbY, r * 0.40, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 3. 미세 골든 스파클 (반짝이는 황금빛 에너지 불꽃)
      const r = cfg.radius * (1.0 - 0.15 * t);
      const flicker = 0.85 + 0.15 * Math.sin(t * 12 + cfg.phase);
      ctx.fillStyle = `rgba(253, 224, 71, ${flicker * 0.95})`;
      ctx.beginPath();
      ctx.arc(orbX, orbY, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(orbX, orbY, r * 0.40, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Stat Drop Effect (능력치 하락 / 랭크 하락) - 5세대 공식 배틀 연출:
 * - [유저 피드백: "왜 랭크하락 파티클에 하이라이트가 보이지?"] -> 하이라이트/글로우 완전 제거, 차분하고 깊은 솔리드 블루 구체
 * - [유저 피드백: "형태는 랭크상승 파티클 참고해봐"] -> 랭크상승(drawStatBoostEffect)과 동일한 컴팩트 원형 구체(오브) + 외곽 림 구조 적용
 * - [유저 피드백: "사선바깥으로 적용"] -> 좌(↙)/우(↘) 대각선 외곽 궤적(driftDist: 34~46px) 전개
 * - 정돈된 2파동 10개 구체 파티클 (과하지 않고 깔끔한 구성)
 */
export function drawStatDropEffect(ctx: any, pos: { x: number; y: number }, progress: number = 0.5) {
  ctx.save();
  const clampedProgress = Math.min(1.0, Math.max(0.0, progress));
  if (clampedProgress <= 0.0 || clampedProgress >= 1.0) {
    ctx.restore();
    return;
  }

  // [유저 피드백: "하락하는거 너무 일정하지 않나?"]
  // 기계적인 대칭/일괄 낙하를 탈피하고, 시차(Spawn), 시작 고도(startYOff), 낙하 속도(speed),
  // 궤적 각도(driftDist), 가속도(ease)를 유기적으로 분산하여 자연스러운 빗방울/디버프 연쇄 낙하 연출
  const orbConfigs = [
    // 1차 연쇄 낙하군 (시차를 두고 위에서부터 엇갈려 쏟아짐)
    { baseX: -8,  startYOff: -98, driftDir: -1, driftDist: 22, spawn: 0.00, life: 0.52, speed: 108, ease: 0.95, radius: 5.2 },
    { baseX: 12,  startYOff: -88, driftDir:  1, driftDist: 28, spawn: 0.05, life: 0.50, speed: 94,  ease: 0.88, radius: 4.2 },
    { baseX: -2,  startYOff: -94, driftDir: -1, driftDist: 10, spawn: 0.10, life: 0.52, speed: 102, ease: 0.92, radius: 4.8 },
    { baseX: -16, startYOff: -90, driftDir: -1, driftDist: 32, spawn: 0.15, life: 0.48, speed: 90,  ease: 0.85, radius: 3.8 },
    { baseX: 6,   startYOff: -100, driftDir: 1, driftDist: 18, spawn: 0.20, life: 0.52, speed: 112, ease: 0.98, radius: 5.0 },

    // 2차 연쇄 낙하군 (1차 방울들이 중앙을 통과할 때 자연스럽게 이어지며 빈틈을 채움)
    { baseX: -11, startYOff: -92, driftDir: -1, driftDist: 24, spawn: 0.28, life: 0.52, speed: 98,  ease: 0.90, radius: 4.6 },
    { baseX: 16,  startYOff: -96, driftDir:  1, driftDist: 30, spawn: 0.33, life: 0.50, speed: 106, ease: 0.96, radius: 4.4 },
    { baseX: 2,   startYOff: -86, driftDir:  1, driftDist: 12, spawn: 0.38, life: 0.48, speed: 92,  ease: 0.86, radius: 3.8 },
    { baseX: -5,  startYOff: -102, driftDir: -1, driftDist: 16, spawn: 0.43, life: 0.52, speed: 110, ease: 0.98, radius: 5.2 },
    { baseX: 10,  startYOff: -90, driftDir:  1, driftDist: 26, spawn: 0.48, life: 0.50, speed: 96,  ease: 0.92, radius: 4.2 },
  ];

  for (const cfg of orbConfigs) {
    if (clampedProgress < cfg.spawn || clampedProgress > cfg.spawn + cfg.life) continue;
    const t = (clampedProgress - cfg.spawn) / cfg.life; // 0.0 -> 1.0 within its wave

    // 각 파티클별 고유 가속 곡선(ease) 및 개별 고도(startYOff) 기반 유기적 낙하
    const fallT = Math.pow(t, cfg.ease);
    const startY = pos.y + cfg.startYOff;
    const orbY = startY + (fallT * cfg.speed);
    const orbX = pos.x + cfg.baseX + (cfg.driftDir * fallT * cfg.driftDist);

    // 낙하하면서 서서히 자연스럽게 축소 & 서브픽셀 번짐 방지 정수 좌표 스냅
    const r = cfg.radius * (1.0 - 0.20 * t);
    const px = Math.round(orbX);
    const py = Math.round(orbY);
    const rad = Math.max(1, Math.round(r));

    ctx.save();
    // 100% 완전 불투명 & 글로우/그림자/필터 일체 제거
    ctx.globalAlpha = 1.0;
    ctx.filter = "none";
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // 단일하고 선명한 100% 완전 불투명 플랫 솔리드 세룰리안 블루 원형 구체 (하늘빛이 감도는 깊은 블루 #0284C7, 외곽 림/하이라이트/스트로크 일체 없음)
    ctx.fillStyle = "#0284C7";
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}
