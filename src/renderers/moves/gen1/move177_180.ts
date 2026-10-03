// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar, drawStarburstImpact } from "../common/helpers.js";
import { drawPhysicalImpactEffect } from "../common/genericTypeEffects.js";

/**
 * Gen 2 Moves 177 - 180 Renderers
 *
 * 177: 에어로블라스트 (Aeroblast) - 루기아 전용기
 * 178: 코튼포자 (Cotton Spore)
 * 179: 기사회생 (Reversal)
 * 180: 원망 (Spite)
 */

// ============================================================================
// 177: 에어로블라스트 (Aeroblast)
// ============================================================================

/**
 * 256색 팔레트 최적화 고선명 색상 상수 (Aeroblast Palette)
 */
const AERO_WHITE = "#FFFFFF";
const AERO_SKY_GLOW = "#E0F2FE";
const AERO_CYAN_LIGHT = "#BAE6FD";
const AERO_CYAN = "#38BDF8";
const AERO_CYAN_NEON = "#00E5FF";
const AERO_BLUE_CORE = "#0284C7";
const AERO_NAVY = "#0F172A";
const AERO_DARK_TEAL_BASE = "#042F2E";
const AERO_DARK_TEAL = "#0F766E";
const AERO_DARK_TEAL_DEEP = "#115E59";

/**
 * Step 1: 사방에서 모여드는 기체 스트림 (Converging Inflow Gas Streams)
 * - 360도 전방위(사방)에서 시전자 앞 구체로 모여드는 기체와 공기 입자들
 */
/**
 * Step 1: 사방에서 구체 속으로 맹렬히 빨려 들어가는 백색 기체 흡수 선 (Bold Converging Wind Streaks)
 * - 360도 전방위 먼 곳(110~170px)에서 시전자 앞 구체 중심으로 쇄도하는 긴 유선형 기체 줄기
 * - behind/front 레이어로 나누어 구체에 가려지지 않고 사방에서 구체 속으로 빨려 들어가는 모습이 선명하게 노출됨
 */
function drawConvergingGasStreams(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  dir: number,
  layer: "behind" | "front" | "all" = "all"
) {
  ctx.save();
  ctx.lineCap = "round";

  const clampT = Math.max(0, Math.min(1.0, progress));
  const animTime = progress; // 다 모인 후에도 계속 회전 및 순환!
  const numStreams = 14; // 사방 14방향으로 촘촘하고 풍성하게 배치

  for (let i = 0; i < numStreams; i++) {
    // 레이어 분리 (짝수는 구체 뒤, 홀수는 구체 앞)
    const isFront = i % 2 !== 0;
    if (layer === "behind" && isFront) continue;
    if (layer === "front" && !isFront) continue;

    // 360도 균등 각도 + 소용돌이 기류 회전 (멈추지 않고 계속 회전!)
    const baseAngle = (i / numStreams) * Math.PI * 2 + animTime * 1.6 * dir;

    // 사방 아주 먼 곳(115 ~ 170px)에서 구체 중심(4 ~ 10px)까지 깊숙이 빨려 들어감
    const outerR = 120 + ((i * 29) % 50); // 120 ~ 170px 사방 먼 거리
    const innerR = 4 + (1.0 - clampT) * 6; // 구체 코어 안쪽으로 완전히 흡수

    // 2차 베지어 곡선으로 공기압에 의해 나선형으로 휘어지며 빨려 들어가는 경로
    const sx = cx + Math.cos(baseAngle) * outerR;
    const sy = cy + Math.sin(baseAngle) * (outerR * 0.85);

    const midAngle = baseAngle + dir * 0.52;
    const midDist = (outerR + innerR) * 0.48;
    const cpx = cx + Math.cos(midAngle) * midDist;
    const cpy = cy + Math.sin(midAngle) * (midDist * 0.85);

    const endAngle = baseAngle + dir * 1.05;
    const ex = cx + Math.cos(endAngle) * innerR;
    const ey = cy + Math.sin(endAngle) * (innerR * 0.85);

    // 베지어 상의 위치 계산 함수
    const getBezierPt = (u: number) => {
      const uClamped = Math.max(0, Math.min(1, u));
      const inv = 1 - uClamped;
      return {
        x: inv * inv * sx + 2 * inv * uClamped * cpx + uClamped * uClamped * ex,
        y: inv * inv * sy + 2 * inv * uClamped * cpy + uClamped * uClamped * ey,
      };
    };

    // 시간에 따라 사방 바깥(u=0)에서 구체 중심(u=1)으로 빠르게 쇄도하는 스트림 궤적 (멈추지 않고 순환)
    const phase = (animTime * 2.6 + (i / numStreams)) % 1.0;
    const headU = Math.min(1.0, phase * 1.35); // 스트림 선두 (구체 쪽)
    const tailU = Math.max(0.0, headU - 0.58);  // 스트림 꼬리 (외곽 쪽, 길이 60~90px)

    if (headU > tailU + 0.04) {
      const samples = 14;

      for (let s = 0; s < samples; s++) {
        const v1 = s / samples;
        const v2 = (s + 1) / samples;
        const vMid = (v1 + v2) * 0.5;

        // 양 끝(v=0 꼬리, v=1 머리)에서 0, 중간(0.5)에서 1이 되는 sin 테이퍼 팩터 (끝부분 투명하고 뾰족!)
        const taper = Math.sin(vMid * Math.PI);
        if (taper <= 0.01) continue;

        const u1 = tailU + v1 * (headU - tailU);
        const u2 = tailU + v2 * (headU - tailU);
        const p1 = getBezierPt(u1);
        const p2 = getBezierPt(u2);

        // 1. 외곽 아이스 화이트 소프트 글로우 선 (끝부분 투명 감쇠)
        const glowWidth = Math.max(0.4, 4.4 * Math.pow(taper, 0.7));
        const glowAlpha = Math.max(0, 0.45 * taper);
        ctx.lineWidth = glowWidth;
        ctx.strokeStyle = `rgba(224, 242, 254, ${glowAlpha})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // 2. 중심 순백 코어 기체 선 (양 끝 0.3px로 뾰족 + 알파 0으로 투명하게 감쇠)
        const coreWidth = Math.max(0.3, 2.6 * Math.pow(taper, 0.75));
        const coreAlpha = Math.max(0, 0.98 * taper);
        ctx.lineWidth = coreWidth;
        ctx.strokeStyle = `rgba(255, 255, 255, ${coreAlpha})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

/**
 * Step 1: 시전자 앞 페이드인하는 흰푸른구체 (외각 투명 방사형 그라데이션 - 순백 중심)
 * - 중심: 압도적인 순백광
 * - 중간: 극도로 연하고 밝은 아이스 화이트
 * - 외곽: 극히 옅은 화이트 스카이로 알파 0 투명 감쇠
 */
function drawFadeInAeroSphere(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number
) {
  if (radius <= 1 || alpha <= 0.01) return;

  ctx.save();
  const safeAlpha = Math.max(0, Math.min(1.0, alpha));

  // 1. 외부 은은한 소프트 오라 (순백 중심 -> 외곽 극히 연한 아이스 화이트 -> 투명)
  const auraR = radius * 1.65;
  const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraR);
  auraGrad.addColorStop(0, `rgba(255, 255, 255, ${safeAlpha * 0.50})`);
  auraGrad.addColorStop(0.35, `rgba(240, 249, 255, ${safeAlpha * 0.32})`);
  auraGrad.addColorStop(0.70, `rgba(224, 242, 254, ${safeAlpha * 0.15})`);
  auraGrad.addColorStop(1.0, "rgba(224, 242, 254, 0)"); // 외각 완전 투명
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 메인 구체 본체 (순백 지배적: 0~70%가 눈부신 백색, 70~100%에서만 극히 옅은 화이트 스카이 후 투명)
  const mainGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  mainGrad.addColorStop(0, `rgba(255, 255, 255, ${safeAlpha * 0.98})`);
  mainGrad.addColorStop(0.40, `rgba(255, 255, 255, ${safeAlpha * 0.94})`);
  mainGrad.addColorStop(0.70, `rgba(240, 249, 255, ${safeAlpha * 0.82})`);
  mainGrad.addColorStop(0.88, `rgba(224, 242, 254, ${safeAlpha * 0.40})`);
  mainGrad.addColorStop(1.0, "rgba(224, 242, 254, 0)"); // 외각 완전 투명
  ctx.fillStyle = mainGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // 3. 중심부 순백의 초고압 코어 (완벽한 순백 그라데이션)
  const coreR = radius * 0.48;
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${safeAlpha * 1.0})`);
  coreGrad.addColorStop(0.65, `rgba(255, 255, 255, ${safeAlpha * 0.85})`);
  coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0)"); // 코어 외곽도 순백으로 부드럽게 녹아듦
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Step 1: 구체가 페이드인하면서 둥글어 보이게 둥근 구체를 감싸는 기체선들 (Wrapping Spherical Gas Lines)
 * - 순백 & 아이스 화이트 선들로 둥근 입체 구면 곡률을 감싸 안음
 */
function drawWrappingSphereLines(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  progress: number,
  dir: number
) {
  if (radius <= 2) return;

  ctx.save();
  ctx.lineCap = "round";

  // 알파 계산은 0~1 클램프, 회전 시간은 클램프 없이 지속 증가하여 다 모인 후에도 계속 고속 회전!
  const alphaT = Math.max(0, Math.min(1.0, progress));
  const lineAlpha = Math.min(1.0, 0.40 + alphaT * 0.60);
  const spinTime = progress; // 지속 회전 타임라인

  // 1. 구면의 둥근 입체감을 살리는 3D 타원 곡면 호 (순백 & 아이스 화이트 계열)
  const orbits = [
    { tilt: -0.32, rotSpeed: 4.2, rxScale: 1.08, ryScale: 0.48, color: AERO_WHITE, width: 2.2 },
    { tilt: 0.68, rotSpeed: -3.8, rxScale: 1.15, ryScale: 0.42, color: "#FFFFFF", width: 1.9 },
    { tilt: -0.98, rotSpeed: 4.6, rxScale: 1.12, ryScale: 0.52, color: "#F0F9FF", width: 2.0 },
    { tilt: 1.28, rotSpeed: -4.0, rxScale: 1.05, ryScale: 0.58, color: "#E0F2FE", width: 1.7 },
  ];

  for (let i = 0; i < orbits.length; i++) {
    const orb = orbits[i];
    const spin = spinTime * orb.rotSpeed * dir; // 멈추지 않고 계속 회전!

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(orb.tilt);

    const rx = radius * orb.rxScale;
    const ry = radius * orb.ryScale;

    // 타원 호를 따라 양 끝이 투명하고 뾰족하게 감싸는 기체선 (Tapered Sharp Orbit Arcs)
    const arcLength = Math.PI * 1.35;
    const startA = (spin) % (Math.PI * 2);

    const arcSamples = 16;
    for (let s = 0; s < arcSamples; s++) {
      const v1 = s / arcSamples;
      const v2 = (s + 1) / arcSamples;
      const vMid = (v1 + v2) * 0.5;

      // 양 끝 0, 중간 1의 sin 테이퍼
      const taper = Math.sin(vMid * Math.PI);
      if (taper <= 0.01) continue;

      const a1 = startA + v1 * arcLength;
      const a2 = startA + v2 * arcLength;

      const p1x = Math.cos(a1) * rx;
      const p1y = Math.sin(a1) * ry;
      const p2x = Math.cos(a2) * rx;
      const p2y = Math.sin(a2) * ry;

      const segWidth = Math.max(0.3, orb.width * Math.pow(taper, 0.75));
      const segAlpha = Math.max(0, lineAlpha * 0.95 * taper);

      ctx.lineWidth = segWidth;
      ctx.strokeStyle = `rgba(255, 255, 255, ${segAlpha})`;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 2. 사방에서 모여든 기체가 구체의 둥근 윤곽을 타면서 휘감아 도는 스월 기체선 (Tapered Swirl Wraps)
  const numSwirls = 6;
  for (let i = 0; i < numSwirls; i++) {
    const baseA = (i / numSwirls) * Math.PI * 2 + spinTime * Math.PI * 3.2 * dir; // 멈추지 않고 계속 회전!
    const rStart = radius * 1.35;
    const rMid = radius * 1.05;
    const rEnd = radius * 0.65;

    const x1 = cx + Math.cos(baseA) * rStart;
    const y1 = cy + Math.sin(baseA) * (rStart * 0.82);

    const midA = baseA + dir * 0.8;
    const x2 = cx + Math.cos(midA) * rMid;
    const y2 = cy + Math.sin(midA) * (rMid * 0.82);

    const endA = baseA + dir * 1.5;
    const x3 = cx + Math.cos(endA) * rEnd;
    const y3 = cy + Math.sin(endA) * (rEnd * 0.82);

    // 2차 베지어 상에서 양 끝이 투명하고 뾰족한 기체선으로 분할 렌더링
    const swirlSamples = 12;
    for (let s = 0; s < swirlSamples; s++) {
      const v1 = s / swirlSamples;
      const v2 = (s + 1) / swirlSamples;
      const vMid = (v1 + v2) * 0.5;

      const taper = Math.sin(vMid * Math.PI);
      if (taper <= 0.01) continue;

      const bPt = (u: number) => {
        const inv = 1 - u;
        return {
          x: inv * inv * x1 + 2 * inv * u * x2 + u * u * x3,
          y: inv * inv * y1 + 2 * inv * u * y2 + u * u * y3,
        };
      };

      const ptA = bPt(v1);
      const ptB = bPt(v2);

      const segWidth = Math.max(0.3, 1.8 * Math.pow(taper, 0.75));
      const segAlpha = Math.max(0, lineAlpha * 0.88 * taper);

      ctx.lineWidth = segWidth;
      ctx.strokeStyle = i % 2 === 0 
        ? `rgba(255, 255, 255, ${segAlpha})` 
        : `rgba(240, 249, 255, ${segAlpha})`;
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/**
 * 대상 포켓몬을 휘감아 도는 맹렬한 회전선 (Target Pokémon Swirling Rotation Lines)
 * - 발사 및 착탄 시 대상 포켓몬의 몸체를 3D 입체 각도로 휘감아 도는 나선형 회전 기체선들
 * - 양 끝부분이 날카롭게 뾰족하고 투명하게 감쇠됨
 */
/**
 * 대상 포켓몬을 휘감아 도는 14가닥의 3D 입체 나선 회전선 (Target 3D Vortex Cage Orbits)
 * - 발사 및 착탄 시 대상 포켓몬의 전신을 3D 입체 각도로 칭칭 동여매는 나선형 고속 회전 기체선들
 * - 안쪽 밀착 궤도(Inner Cage)와 바깥쪽 팽창 궤도(Outer Vortex)의 2중 입체 구조
 * - 양 끝부분이 0.2px로 극도로 날카롭게 뾰족하고 투명하게 감쇠됨
 */
function drawTargetVortexRotationLines(
  ctx: any,
  tx: number,
  ty: number,
  progress: number,
  moveStep: number,
  layer: "behind" | "front" | "all" = "all"
) {
  ctx.save();
  ctx.lineCap = "round";

  const t = Math.max(0, Math.min(1.0, progress));
  // 필터가 종료되는 마지막 순간(Step 5 소산)까지 강렬한 볼텍스 회전 완벽 유지!
  const intensity = moveStep === 2 ? 0.90 : moveStep === 3 ? 1.0 : moveStep === 4 ? 0.95 : Math.max(0, (1.0 - t * 0.7) * 0.90);
  const lineAlpha = (moveStep === 2 ? 0.70 + t * 0.30 : 0.95) * intensity;

  // 대상 포켓몬을 감싸는 14개의 정교한 3D 회전 궤도 (다양한 고도, 반경, 틸트각, 회전 속도)
  const targetOrbits = [
    // [안쪽 밀착 궤도 - Inner Cage: 대상 몸체 바로 위에서 초고속 회전]
    { tilt: -0.35, rotSpeed:  6.2, rx: 32, ry: 14, yOff:  -4, isFront: true,  color: AERO_WHITE,      width: 2.8 },
    { tilt:  0.45, rotSpeed: -6.8, rx: 35, ry: 13, yOff: -16, isFront: false, color: AERO_CYAN_NEON, width: 2.2 },
    { tilt: -0.65, rotSpeed:  7.2, rx: 30, ry: 15, yOff:  10, isFront: true,  color: AERO_SKY_GLOW,   width: 2.5 },
    { tilt:  0.80, rotSpeed: -5.8, rx: 34, ry: 12, yOff: -26, isFront: false, color: AERO_CYAN,      width: 2.0 },
    { tilt: -0.15, rotSpeed:  7.5, rx: 36, ry: 14, yOff:   2, isFront: true,  color: AERO_WHITE,      width: 3.0 },
    { tilt:  0.25, rotSpeed: -6.5, rx: 33, ry: 13, yOff:  18, isFront: false, color: AERO_CYAN_NEON, width: 2.2 },

    // [바깥쪽 팽창 궤도 - Outer Vortex: 대상 전후좌우를 웅장하게 포위]
    { tilt: -0.85, rotSpeed:  5.4, rx: 48, ry: 20, yOff:  -8, isFront: true,  color: AERO_WHITE,      width: 2.6 },
    { tilt:  0.95, rotSpeed: -5.6, rx: 52, ry: 22, yOff:  -2, isFront: false, color: AERO_SKY_GLOW,   width: 2.0 },
    { tilt: -0.40, rotSpeed:  5.9, rx: 55, ry: 21, yOff:  14, isFront: true,  color: AERO_CYAN_NEON, width: 2.8 },
    { tilt:  0.60, rotSpeed: -5.2, rx: 46, ry: 19, yOff: -20, isFront: false, color: AERO_BLUE_CORE,  width: 1.8 },
    { tilt: -1.15, rotSpeed:  6.4, rx: 50, ry: 23, yOff:   6, isFront: true,  color: AERO_WHITE,      width: 2.5 },
    { tilt:  1.20, rotSpeed: -6.0, rx: 54, ry: 20, yOff: -12, isFront: false, color: AERO_CYAN,      width: 2.2 },
    { tilt: -0.20, rotSpeed:  7.0, rx: 58, ry: 24, yOff:  22, isFront: true,  color: AERO_SKY_GLOW,   width: 2.4 },
    { tilt:  0.35, rotSpeed: -6.2, rx: 44, ry: 18, yOff: -32, isFront: false, color: AERO_WHITE,      width: 2.0 },
  ];

  for (let i = 0; i < targetOrbits.length; i++) {
    const orb = targetOrbits[i];
    if (layer === "behind" && orb.isFront) continue;
    if (layer === "front" && !orb.isFront) continue;

    // Step 진행 시에도 끊김 없이 계속 회전하도록 시간 오프셋 누적
    const spinTime = t + (moveStep - 2) * 1.35;
    const spin = (spinTime * orb.rotSpeed * 1.8) % (Math.PI * 2);

    ctx.save();
    ctx.translate(tx, ty + orb.yOff);
    ctx.rotate(orb.tilt);

    // 호의 길이 (1.4 파이 ~ 250도)
    const arcLen = Math.PI * 1.40;
    const startA = spin;
    const arcSamples = 20;

    for (let s = 0; s < arcSamples; s++) {
      const v1 = s / arcSamples;
      const v2 = (s + 1) / arcSamples;
      const vMid = (v1 + v2) * 0.5;

      // 양 끝부분 0.2px로 극도로 날카롭게 뾰족 & 투명 감쇠
      const taper = Math.sin(vMid * Math.PI);
      if (taper <= 0.005) continue;

      const a1 = startA + v1 * arcLen;
      const a2 = startA + v2 * arcLen;

      const p1x = Math.cos(a1) * orb.rx;
      const p1y = Math.sin(a1) * orb.ry;
      const p2x = Math.cos(a2) * orb.rx;
      const p2y = Math.sin(a2) * orb.ry;

      const isBlue = orb.color !== AERO_WHITE;
      const finalWidth = isBlue ? Math.max(0.2, orb.width * 0.75 * Math.pow(taper, 0.70)) : Math.max(0.2, orb.width * Math.pow(taper, 0.70));
      const segAlpha = Math.max(0, lineAlpha * taper * (isBlue ? 0.35 : 1.0));

      // 메인 회전선 (순백색은 선명하고, 파란선은 투명하고 은은하게)
      ctx.lineWidth = finalWidth;
      ctx.strokeStyle = hexToRgba(orb.color, segAlpha);
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * 발포 직후 및 착탄 시 전장 전체를 뒤흔드는 압도적 퀄리티의 푸른 필터 회전선 배경
 * (Deep Cosmic Blue Atmospheric Filter & Multi-layered Cyclone Speedlines)
 * 
 * [완성도 혁신 구조]:
 * 1. 심연의 딥 코스믹 에어로 블루 베이스 (Dark Royal Indigo/Navy Void: 90% 차원 전환)
 * 2. 중심 4중 초광역 방사형 발광 글로우 (White-Cyan Core to Sapphire Gradient)
 * 3. 8개의 거대한 입체 에어로 리본 (Massive Swirling Air Ribbons: 8~16px 두께의 공기 덩어리 밴드)
 * 4. 48가닥의 초고속 쐐기형 나선 스피드라인 (Manga Cyclone Speedlines: 양 끝 0.2px 완벽 테이퍼링)
 * 5. 4중 방사형 팽창 사이클론 파동 링 (Expanding Shockwave Rings)
 * 6. 24개의 고속 와류 바람 입자 스트릭 (Vortex Streak Motes)
 */
function drawSwirlingVortexBackground(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  moveStep: number,
  dir: number
) {
  ctx.save();

  const t = Math.max(0, Math.min(1.0, progress));
  const intensity = moveStep === 2 ? 0.95 : moveStep === 3 ? 1.0 : moveStep === 4 ? 0.95 : Math.max(0, (1.0 - t * 0.7) * 0.90);

  // 1. 맑고 청명한 창공의 에어로 하늘색 베이스 (Clean Sky Blue Base)
  ctx.fillStyle = `rgba(3, 105, 161, ${0.75 * intensity})`;
  ctx.fillRect(-5000, -5000, 12000, 12000);

  // 2. 대상 포켓몬 위치 중심 초강력 순백 발광 글로우 (Brilliant White Core Gradient)
  // - 대상 포켓몬이 서 있는 중심부를 훨씬 더 희고 눈부신 순백 광채로 스포트라이트!
  const bgGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 520);
  bgGrad.addColorStop(0.00, `rgba(255, 255, 255, ${0.98 * intensity})`);
  bgGrad.addColorStop(0.14, `rgba(255, 255, 255, ${0.92 * intensity})`); // 넓은 순백 영역
  bgGrad.addColorStop(0.28, `rgba(240, 249, 255, ${0.78 * intensity})`); // 아이스 화이트
  bgGrad.addColorStop(0.48, `rgba(186, 230, 253, ${0.58 * intensity})`); // 파스텔 하늘빛
  bgGrad.addColorStop(0.72, `rgba(56, 189, 248, ${0.32 * intensity})`);  // 맑은 하늘색
  bgGrad.addColorStop(0.92, `rgba(14, 165, 233, ${0.14 * intensity})`);
  bgGrad.addColorStop(1.00, "rgba(3, 105, 161, 0)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(-5000, -5000, 12000, 12000);

  const rotAngle = (t * 6.8 + moveStep * 2.8) * dir; // 초고속 회전!

  // 3-0. 🌟 [유저 지시]: 배경 필터에 굵은 짙은 청록 "직선" 추가 (Bold Dark Teal Straight Lines)
  // - [유저 지시 엄수]: "얘는 직선으로 해줘", "이 짙은선은 중간까지 이어지지는 않고 중간부분부터 투명하게"
  // - 외곽 먼 곳에서 대상을 향해 방사형으로 곧게 뻗은 일직선(Straight line)!
  // - 중심부로 직접 이어지지 않고, 중간 지점(uMid ~ 0.5)부터 안쪽으로 오면서 자연스럽게 투명하게 소산!
  const numTealLines = 10;
  for (let r = 0; r < numTealLines; r++) {
    const angle = (r / numTealLines) * Math.PI * 2 + rotAngle;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // 안쪽 끝은 중심에서 180~220px 떨어진 중간 지점 (중심부 타겟 영역 침범 원천 차단)
    const rIn = 180 + ((r * 19) % 40);
    // 바깥쪽 끝은 화면 바깥 520~720px
    const rOut = 520 + ((r * 43) % 200);

    const tealColor = r % 2 === 0 ? "rgba(15, 118, 110," : "rgba(17, 94, 89,"; // #0F766E / #115E59
    const lineSamples = 20;

    for (let s = 0; s < lineSamples; s++) {
      const u1 = s / lineSamples;
      const u2 = (s + 1) / lineSamples;
      const uMid = (u1 + u2) * 0.5; // 0.0 (안쪽 rIn) ~ 1.0 (외곽 rOut)

      // 🌟 [유저 지시]: 중간부분부터 안쪽으로 오면서 투명하게 사라짐
      // uMid = 0.50 이상: 외곽 구간에서 굵고 선명한 짙은 청록 직선
      // uMid = 0.0 ~ 0.50: 안쪽으로 향하면서 0으로 완전히 페이드아웃
      const innerFade = Math.max(0, Math.min(1.0, uMid / 0.50));
      // 외곽 끝에서도 자연스럽게 테이퍼
      const outerFade = Math.sin(Math.min(1.0, (1.0 - uMid) / 0.15) * Math.PI * 0.5);

      const taper = innerFade * outerFade;
      if (taper <= 0.01) continue;

      const d1 = rIn + u1 * (rOut - rIn);
      const d2 = rIn + u2 * (rOut - rIn);

      // 완벽한 일직선(Straight line) 좌표 (곡률 없음!)
      const px1 = cx + cosA * d1;
      const py1 = cy + sinA * (d1 * 0.72);
      const px2 = cx + cosA * d2;
      const py2 = cy + sinA * (d2 * 0.72);

      // 굵은 직선 폭 (외곽 12~16px 굵기 -> 중간에서 날렵하게 사라짐)
      const segWidth = Math.max(0.8, (12 + (r % 3) * 3) * Math.pow(innerFade, 0.5) * Math.pow(outerFade, 0.4));
      const segAlpha = (0.65 + (r % 3) * 0.15) * taper * intensity;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineWidth = segWidth;
      ctx.strokeStyle = `${tealColor} ${segAlpha})`;
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 3. [거대한 입체 에어로 리본 - 8개]
  // - [유저 지시]: 배경 소용돌이 선이 훨씬 더 급격하게 나선형으로 꺾이며 회전 (Curvature 대폭 강화)
  const numRibbons = 8;
  for (let r = 0; r < numRibbons; r++) {
    const baseA = (r / numRibbons) * Math.PI * 2 + rotAngle;
    const rIn = 30 + ((r * 19) % 25);
    const rOut = 440 + ((r * 37) % 220);

    // 나선 회전각을 1.15 -> 3.14(180도)로 대폭 꺾어 거대한 와류 곡률 형성
    const midA = baseA + dir * 1.45;
    const endA = baseA + dir * 3.14;
    const midR = (rIn + rOut) * 0.38;

    const rColor = r % 2 === 0 ? "rgba(56, 189, 248," : "rgba(224, 242, 254,";
    const ribbonSamples = 24;

    for (let s = 0; s < ribbonSamples; s++) {
      const u1 = s / ribbonSamples;
      const u2 = (s + 1) / ribbonSamples;
      const uMid = (u1 + u2) * 0.5;

      const taper = Math.sin(uMid * Math.PI);
      if (taper <= 0.01) continue;

      // 2차 베지어 곡선 보간
      const b0 = (1 - u1) * (1 - u1);
      const b1 = 2 * (1 - u1) * u1;
      const b2 = u1 * u1;
      const px1 = b0 * (cx + Math.cos(baseA) * rIn) + b1 * (cx + Math.cos(midA) * midR) + b2 * (cx + Math.cos(endA) * rOut);
      const py1 = b0 * (cy + Math.sin(baseA) * (rIn * 0.72)) + b1 * (cy + Math.sin(midA) * (midR * 0.72)) + b2 * (cy + Math.sin(endA) * (rOut * 0.72));

      const c0 = (1 - u2) * (1 - u2);
      const c1 = 2 * (1 - u2) * u2;
      const c2 = u2 * u2;
      const px2 = c0 * (cx + Math.cos(baseA) * rIn) + c1 * (cx + Math.cos(midA) * midR) + c2 * (cx + Math.cos(endA) * rOut);
      const py2 = c0 * (cy + Math.sin(baseA) * (rIn * 0.72)) + c1 * (cy + Math.sin(midA) * (midR * 0.72)) + c2 * (cy + Math.sin(endA) * (rOut * 0.72));

      const segWidth = Math.max(0.5, (10 + (r % 3) * 4) * Math.pow(taper, 0.65));
      const segAlpha = (0.28 + (r % 3) * 0.12) * taper * intensity;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineWidth = segWidth;
      ctx.strokeStyle = `${rColor} ${segAlpha})`;
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 4. [48가닥의 초고속 쐐기형 나선 스피드라인 (Manga Cyclone Speedlines)]
  // - [유저 지시]: 화면 전체를 휘감아 도는 나선형 꺾임 곡률 대폭 강화 (endAngle 1.05 -> 2.75)
  const numLines = 48;
  ctx.lineCap = "round";

  for (let i = 0; i < numLines; i++) {
    const baseAngle = (i / numLines) * Math.PI * 2 + rotAngle;

    const rInner = 20 + ((i * 13) % 45);
    const rOuter = 360 + ((i * 47) % 360);

    // 나선 꺾임각 2.5배 강화 (더 가파르게 휘어지는 사이클론 곡선)
    const midAngle = baseAngle + dir * 1.25;
    const endAngle = baseAngle + dir * 2.75;
    const midR = (rInner + rOuter) * 0.36;

    const isMajor = i % 3 === 0;
    const maxW = isMajor ? 3.6 : (i % 2 === 0 ? 2.4 : 1.4);
    const lineBaseAlpha = (isMajor ? 0.85 : 0.55) * intensity;

    const strokeColor = i % 4 === 0
      ? AERO_WHITE
      : i % 4 === 1
      ? AERO_CYAN_NEON
      : i % 4 === 2
      ? AERO_SKY_GLOW
      : AERO_CYAN;

    const lineSamples = 20;
    for (let s = 0; s < lineSamples; s++) {
      const u1 = s / lineSamples;
      const u2 = (s + 1) / lineSamples;
      const uMid = (u1 + u2) * 0.5;

      const taper = Math.sin(uMid * Math.PI);
      if (taper <= 0.01) continue;

      const b0 = (1 - u1) * (1 - u1);
      const b1 = 2 * (1 - u1) * u1;
      const b2 = u1 * u1;
      const px1 = b0 * (cx + Math.cos(baseAngle) * rInner) + b1 * (cx + Math.cos(midAngle) * midR) + b2 * (cx + Math.cos(endAngle) * rOuter);
      const py1 = b0 * (cy + Math.sin(baseAngle) * (rInner * 0.72)) + b1 * (cy + Math.sin(midAngle) * (midR * 0.72)) + b2 * (cy + Math.sin(endAngle) * (rOuter * 0.72));

      const c0 = (1 - u2) * (1 - u2);
      const c1 = 2 * (1 - u2) * u2;
      const c2 = u2 * u2;
      const px2 = c0 * (cx + Math.cos(baseAngle) * rInner) + c1 * (cx + Math.cos(midAngle) * midR) + c2 * (cx + Math.cos(endAngle) * rOuter);
      const py2 = c0 * (cy + Math.sin(baseAngle) * (rInner * 0.72)) + c1 * (cy + Math.sin(midAngle) * (midR * 0.72)) + c2 * (cy + Math.sin(endAngle) * (rOuter * 0.72));

      const segWidth = Math.max(0.2, maxW * Math.pow(taper, 0.70));
      const segAlpha = lineBaseAlpha * taper;

      ctx.lineWidth = segWidth;
      ctx.strokeStyle = hexToRgba(strokeColor, segAlpha);
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * 전면 대기 푸른빛 필터 & 진공 렌즈 글로우 (Front Atmospheric Filter & Vacuum Lens Glow)
 * - 배틀 씬 전면에서 캐릭터와 배경을 하나로 묶어주는 맑고 영롱한 푸른빛 공기감 부여
 */
function drawFrontAtmosphericFilter(
  ctx: any,
  tx: number,
  ty: number,
  progress: number,
  moveStep: number,
  beamProgress: number = 1.0
) {
  ctx.save();
  const intensity = moveStep === 2 ? 0.90 : moveStep === 3 ? 1.0 : 0.60;

  // 1. 화면 전체 맑고 화사한 창공 하늘색 대기 틴트
  ctx.fillStyle = `rgba(56, 189, 248, ${0.13 * intensity})`;
  ctx.fillRect(-5000, -5000, 12000, 12000);

  // 2. 블라스트가 대상 포켓몬에게 도달하는 순간(beamProgress >= 0.90)부터 눈부신 순백 오라 발광!
  if (moveStep >= 3 || beamProgress >= 0.90) {
    const auraGrad = ctx.createRadialGradient(tx, ty, 5, tx, ty, 180);
    auraGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.45 * intensity})`);
    auraGrad.addColorStop(0.25, `rgba(240, 249, 255, ${0.30 * intensity})`);
    auraGrad.addColorStop(0.55, `rgba(186, 230, 253, ${0.15 * intensity})`);
    auraGrad.addColorStop(1.0, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = auraGrad;
    ctx.fillRect(tx - 240, ty - 240, 480, 480);
  }

  ctx.restore();
}

/**
 * Step 2 & 3: 바람으로 이루어진 직선의 볼텍스 빔 (Straight Vortex Wind Beam)
 * - 단순 단색 레이저가 아니라, 시전자부터 대상을 향해 직선으로 뻗어나가는 거대한 "바람의 나선 소용돌이(Vortex) 원통 빔"
 * - 구성:
 *   1. 외곽 투명 대기압 풍압 터널 (Atmospheric Wind Tunnel Sheath - 투명 그라데이션)
 *   2. 중심 초고속 진공 축선 (Pure White Supersonic Vacuum Axis - 3.6px)
 *   3. 8가닥 3D 나선형 회오리 바람 볼텍스 (8-Strand 3D Spiral Wind Filaments - 원통을 감싸고 초고속 회전)
 *   4. 나선 궤도를 질주하는 고속 바람 칼날 스트릭 (Helical Wind Blades / Speed Streaks - 12개)
 *   5. 마하 압축 타원 링 (Linear Mach Shockwave Compression Rings)
 *   6. 선두 원추형 바람 드릴 헤드 (Spinning Wind Spearhead)
 */
/**
 * 코골기(Snore) 3D 기하학을 계승한 입체 나선 소용돌이 유닛 (🌀)
 * - 비행 진행 축(mainAngle)에 맞춰 진행 방향 축을 depthRatio(0.54)로 압축, 수직축을 1.08로 세움
 *   (코골기 draw3DSnoreWaveDisc와 1:1 동일한 3D 규격 -> 진행 방향을 정면으로 마주보고 서 있는 3D 입체 디스크 소용돌이!)
 * - 3가닥의 순백 나선 날개가 중심에서 외곽으로 똬리를 틀며 고속 회전
 * - 양 끝 0.2px 완벽 테이퍼링 (날카롭고 투명)
 * - 순백선 100% (파란색 및 회색 글로우 완전 배제)
 * - 중심선(직선) 및 링/화살표 없음
 */
function draw3DAeroblastWindSpiral(
  ctx: any,
  cx: number,
  cy: number,
  mainAngle: number,
  radius: number,
  spinAngle: number,
  dir: number = 1.0,
  alpha: number = 1.0,
  depthRatio: number = 0.54
) {
  if (radius <= 2 || alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(mainAngle); // 진행 방향 축 (코골기와 동일)
  ctx.scale(depthRatio, 1.08); // 진행 방향 수직 3D 원근 타원 압축 (코골기와 동일)

  const numBlades = 3; // 3가닥 나선 소용돌이 🌀
  const turns = 1.35;  // 약 480도 감김
  const maxTheta = Math.PI * 2 * turns;
  const samples = 22;

  for (let b = 0; b < numBlades; b++) {
    const bladeOffset = b * ((Math.PI * 2) / numBlades);
    const startA = spinAngle * dir + bladeOffset;

    for (let s = 0; s < samples; s++) {
      const u1 = s / samples;
      const u2 = (s + 1) / samples;
      const uMid = (u1 + u2) * 0.5;

      // 양 끝 테이퍼링 (중심과 외곽 끝 0.2px로 날카롭게 뾰족)
      const taper = Math.sin(uMid * Math.PI);
      if (taper <= 0.01) continue;

      const r1 = radius * Math.pow(u1, 0.82);
      const r2 = radius * Math.pow(u2, 0.82);

      const th1 = startA + u1 * maxTheta * dir;
      const th2 = startA + u2 * maxTheta * dir;

      const p1x = Math.cos(th1) * r1;
      const p1y = Math.sin(th1) * r1;
      const p2x = Math.cos(th2) * r2;
      const p2y = Math.sin(th2) * r2;

      const width = Math.max(0.3, (1.8 + 1.8 * Math.min(1.5, radius / 30)) * Math.pow(taper, 0.70));
      const segAlpha = alpha * taper;

      // 메인 순백 바람선 (100% 순백색, 회색 글로우 없음)
      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(255, 255, 255, ${segAlpha * 0.95})`;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();
    }
  }

  // 외곽 회전 스월 아크 2가닥 (디스크의 둥근 입체감 보강)
  for (let k = 0; k < 2; k++) {
    const arcOffset = k * Math.PI + spinAngle * dir * 1.2;
    const arcLen = Math.PI * 0.85;
    const arcSamples = 12;

    for (let s = 0; s < arcSamples; s++) {
      const vMid = (s + 0.5) / arcSamples;
      const taper = Math.sin(vMid * Math.PI);
      if (taper <= 0.01) continue;

      const a1 = arcOffset + (s / arcSamples) * arcLen;
      const a2 = arcOffset + ((s + 1) / arcSamples) * arcLen;

      const r = radius * 0.95;
      const x1 = Math.cos(a1) * r;
      const y1 = Math.sin(a1) * r;
      const x2 = Math.cos(a2) * r;
      const y2 = Math.sin(a2) * r;

      ctx.lineWidth = Math.max(0.3, 2.0 * taper);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85 * taper})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // 중심부 투명~순백 기압 핵 (직선 없음, 속이 빈 듯 맑은 코어)
  const coreR = radius * 0.22;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.75})`);
  coreGrad.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.20})`);
  coreGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Step 2, 3, 4: 코골기(Snore) 3D 배치 + 독가스(Poison Gas) 직선 관통 Z축 후면 투과
 * (Connected Overlapping 3D Cyclone Vortex Chain - Penetrating Behind Target)
 * - [유저 지시]: 독가스(139)처럼 상대 포켓몬을 관통(투과)하여 상대의 등 뒤로 길게 이어짐!
 * - layer === "front": 시전자 앞(0.0)에서 상대 앞(1.02)까지 전면 스트림
 * - layer === "behind": 상대를 통과(0.95)하여 Z축 뒤로 깊숙이 뻗어나가는(1.45) 후면 관통 스트림
 * - 상대를 통과한 후방 소용돌이는 뒤로 갈수록 점진적으로 자연스럽게 투명화 (Distance Depth Fade)
 */
function drawAeroblastConnectedCyclones(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  progress: number,
  animPhase: number = 0,
  layer: "front" | "behind" | "all" = "all"
) {
  const dx = tx - ax;
  const dy = ty - ay;
  const totalDist = Math.hypot(dx, dy);
  if (totalDist <= 2) return;

  // 시전자 -> 대상 방향 비행 궤적 주 각도 (코골기 mainAngle과 1:1 동일)
  const mainAngle = Math.atan2(dy, dx);
  const cosA = Math.cos(mainAngle);
  const sinA = Math.sin(mainAngle);
  const perpX = -sinA;
  const perpY = cosA;

  // [독가스 방식 관통]: progress는 최대 1.45까지 전진 (상대 포켓몬 등 뒤로 45% 더 길게 이어짐)
  const headProgress = Math.min(1.45, Math.max(0.05, progress));
  const currDist = totalDist * headProgress;

  // 17개의 소용돌이 노드 정의:
  // 0~11: 시전자 앞 ~ 상대방 정면 (0.0 ~ 1.0)
  // 12~16: 상대방 몸체 투과 ~ 등 뒤로 깊숙이 뻗어나감 (1.08 ~ 1.45)
  const nodeConfigs = [
    { scaleMul: 0.96, rotSpeed: 12.0, dir:  1.0 }, // 0: 시전자 앞
    { scaleMul: 1.03, rotSpeed: 18.0, dir: -1.0 }, // 1
    { scaleMul: 0.95, rotSpeed: 24.0, dir:  1.0 }, // 2
    { scaleMul: 1.04, rotSpeed: 11.0, dir: -1.0 }, // 3
    { scaleMul: 0.98, rotSpeed: 20.0, dir:  1.0 }, // 4
    { scaleMul: 1.05, rotSpeed: 14.0, dir: -1.0 }, // 5
    { scaleMul: 0.97, rotSpeed: 22.0, dir:  1.0 }, // 6
    { scaleMul: 1.02, rotSpeed: 16.0, dir: -1.0 }, // 7
    { scaleMul: 0.96, rotSpeed: 21.0, dir:  1.0 }, // 8
    { scaleMul: 1.04, rotSpeed: 13.0, dir: -1.0 }, // 9
    { scaleMul: 0.98, rotSpeed: 19.0, dir:  1.0 }, // 10
    { scaleMul: 1.03, rotSpeed: 15.0, dir: -1.0 }, // 11: 상대방 정면 (u = 1.0)
    // 🌟 상대 포켓몬 투과 후 등 뒤로 이어지는 노드들 (독가스 Z축 관통)
    { scaleMul: 1.02, rotSpeed: 17.0, dir:  1.0 }, // 12: 관통 직후 (u ~ 1.09)
    { scaleMul: 1.04, rotSpeed: 14.0, dir: -1.0 }, // 13: 등 뒤 뻗어나감 (u ~ 1.18)
    { scaleMul: 0.99, rotSpeed: 20.0, dir:  1.0 }, // 14: 후방 전개 (u ~ 1.27)
    { scaleMul: 1.02, rotSpeed: 15.0, dir: -1.0 }, // 15: 후방 원거리 (u ~ 1.36)
    { scaleMul: 0.96, rotSpeed: 18.0, dir:  1.0 }, // 16: 후방 소산 말단 (u ~ 1.45)
  ];

  const numNodes = nodeConfigs.length;

  ctx.save();
  ctx.lineCap = "round";

  // 🌟 [유저 지시]: 대상에게 갈수록 소용돌이가 점진적으로 웅장하게 커지는 원추형(Funnel) 팽창
  // - 시전자 앞 발사점(u=0.0): 14px (컴팩트하고 날렵한 발사 코어)
  // - 대상 포켓몬 타격점(u=1.0): 36px (상대방을 덮칠 만큼 거대하고 박력 넘치는 볼텍스)
  // - 등 뒤 관통 및 소산(u=1.45): 41px (뒤로 넓게 퍼져나가며 투명 소산)
  const getAeroVortexBaseRadius = (uNorm: number): number => {
    const uClamped = Math.min(1.0, Math.max(0, uNorm));
    const rFront = 14 + 22 * Math.pow(uClamped, 0.88);
    const rBehind = uNorm > 1.0 ? 11 * (uNorm - 1.0) : 0;
    return rFront + rBehind;
  };

  // ===========================================================================
  // 0. 비행 직선 중앙에서 바깥으로 부드럽게 퍼져나가는 푸른빛 확산 글로우
  // ===========================================================================
  let glowStartDist = 0;
  let glowEndDist = currDist;
  if (layer === "front") {
    glowEndDist = Math.min(totalDist * 1.02, currDist);
  } else if (layer === "behind") {
    glowStartDist = Math.max(0, totalDist * 0.95);
  }

  if (glowEndDist > glowStartDist) {
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(mainAngle); // 비행 궤적 축 정렬

    // 소용돌이 크기 팽창에 맞추어 대상 쪽으로 갈수록 함께 넓어지는 원추형 확산 글로우 높이
    const hStart = 20 + 26 * Math.min(1.0, glowStartDist / totalDist);
    const hEnd = 20 + 26 * Math.min(1.45, glowEndDist / totalDist);
    const maxHalfH = Math.max(hStart, hEnd);

    const beamAxisGrad = ctx.createLinearGradient(0, -maxHalfH, 0, maxHalfH);
    beamAxisGrad.addColorStop(0.00, "rgba(56, 189, 248, 0)");
    beamAxisGrad.addColorStop(0.25, "rgba(56, 189, 248, 0.08)");
    beamAxisGrad.addColorStop(0.42, "rgba(0, 229, 255, 0.16)");
    beamAxisGrad.addColorStop(0.50, "rgba(186, 230, 253, 0.28)");
    beamAxisGrad.addColorStop(0.58, "rgba(0, 229, 255, 0.16)");
    beamAxisGrad.addColorStop(0.75, "rgba(56, 189, 248, 0.08)");
    beamAxisGrad.addColorStop(1.00, "rgba(56, 189, 248, 0)");

    ctx.fillStyle = beamAxisGrad;
    ctx.beginPath();
    ctx.moveTo(glowStartDist, -hStart);
    ctx.lineTo(glowEndDist, -hEnd);
    ctx.lineTo(glowEndDist, hEnd);
    ctx.lineTo(glowStartDist, hStart);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 0-2. 소용돌이 노드 중심에서 바깥으로 은은하게 퍼져나가는 방사형 3D 확산 블룸
  for (let i = 0; i < numNodes; i += 2) {
    const u = (i / (numNodes - 1)) * 1.45;
    if (u > headProgress + 0.03) continue;

    // 레이어 필터
    if (layer === "front" && u > 1.02) continue;
    if (layer === "behind" && u < 0.95) continue;

    // 관통 후 소산 감쇠 (Distance Depth Fade)
    const backFade = u > 1.0 ? Math.max(0, 1.0 - (u - 1.0) / 0.48) : 1.0;
    if (backFade <= 0.01) continue;

    const distOnAxis = totalDist * u;
    const cx = ax + cosA * distOnAxis;
    const cy = ay + sinA * distOnAxis;

    const baseR = getAeroVortexBaseRadius(u);
    const cfg = nodeConfigs[i];
    const r = baseR * cfg.scaleMul;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mainAngle);
    ctx.scale(0.54, 1.08); // 3D 디스크 규격

    const nodeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.40);
    nodeGrad.addColorStop(0.00, `rgba(186, 230, 253, ${0.20 * backFade})`);
    nodeGrad.addColorStop(0.35, `rgba(56, 189, 248, ${0.10 * backFade})`);
    nodeGrad.addColorStop(0.70, `rgba(56, 189, 248, ${0.03 * backFade})`);
    nodeGrad.addColorStop(1.00, "rgba(56, 189, 248, 0)");

    ctx.fillStyle = nodeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.40, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 1. 소용돌이 외곽을 3D 나선형으로 꼬며 감싸 이어주는 연쇄 결합 기류선 (3D Helical Binders)
  const numHelices = 4;
  for (let h = 0; h < numHelices; h++) {
    const helixOffset = h * (Math.PI * 0.5);
    const helixSamples = 38;

    for (let s = 0; s < helixSamples; s++) {
      const u1 = (s / helixSamples) * headProgress;
      const u2 = ((s + 1) / helixSamples) * headProgress;
      const uMid = (u1 + u2) * 0.5;

      // 레이어 필터
      if (layer === "front" && uMid > 1.02) continue;
      if (layer === "behind" && uMid < 0.95) continue;

      const taper = Math.sin(Math.min(1.0, uMid / headProgress) * Math.PI);
      if (taper <= 0.01) continue;

      // 관통 후 소산 감쇠
      const backFade = uMid > 1.0 ? Math.max(0, 1.0 - (uMid - 1.0) / 0.48) : 1.0;
      if (backFade <= 0.01) continue;

      const rCone1 = getAeroVortexBaseRadius(u1) * 0.88;
      const rCone2 = getAeroVortexBaseRadius(u2) * 0.88;

      const phi1 = animPhase * 14.0 + helixOffset + u1 * Math.PI * 4.5;
      const phi2 = animPhase * 14.0 + helixOffset + u2 * Math.PI * 4.5;

      const dist1 = totalDist * u1;
      const dist2 = totalDist * u2;

      const p1x = ax + cosA * (dist1 + Math.cos(phi1) * rCone1 * 0.54) + perpX * (Math.sin(phi1) * rCone1);
      const p1y = ay + sinA * (dist1 + Math.cos(phi1) * rCone1 * 0.54) + perpY * (Math.sin(phi1) * rCone1);

      const p2x = ax + cosA * (dist2 + Math.cos(phi2) * rCone2 * 0.54) + perpX * (Math.sin(phi2) * rCone2);
      const p2y = ay + sinA * (dist2 + Math.cos(phi2) * rCone2 * 0.54) + perpY * (Math.sin(phi2) * rCone2);

      const segWidth = Math.max(0.3, 1.8 * Math.pow(taper, 0.70));
      const segAlpha = 0.85 * taper * backFade;

      ctx.lineWidth = segWidth;
      ctx.strokeStyle = `rgba(255, 255, 255, ${segAlpha * 0.90})`;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();
    }
  }

  // 2. 뒤에서 앞 순서로 렌더링
  for (let i = 0; i < numNodes; i++) {
    const u = (i / (numNodes - 1)) * 1.45;
    if (u > headProgress + 0.02) continue;

    // 레이어 필터
    if (layer === "front" && u > 1.02) continue;
    if (layer === "behind" && u < 0.95) continue;

    // 관통 후 소산 감쇠 (Distance Depth Fade)
    const backFade = u > 1.0 ? Math.max(0, 1.0 - (u - 1.0) / 0.48) : 1.0;
    if (backFade <= 0.01) continue;

    const distOnAxis = totalDist * u;
    const cx = ax + cosA * distOnAxis;
    const cy = ay + sinA * distOnAxis;

    const cfg = nodeConfigs[i];

    const baseR = getAeroVortexBaseRadius(u);
    const pulse = Math.sin(animPhase * 8.0 + i * 1.5) * 0.05;
    const r = baseR * cfg.scaleMul * (1.0 + pulse);

    const spinAngle = animPhase * cfg.rotSpeed + i * 2.4;

    draw3DAeroblastWindSpiral(ctx, cx, cy, mainAngle, r, spinAngle, cfg.dir, 0.95 * backFade, 0.54);
  }

  // 선두 미니 임팩트 섬광 (선두가 속한 레이어에서만 표시)
  const isHeadInLayer = (layer === "all") || (layer === "front" && headProgress <= 1.02) || (layer === "behind" && headProgress > 1.02);
  if (isHeadInLayer) {
    const headX = ax + cosA * currDist;
    const headY = ay + sinA * currDist;
    const headAlpha = headProgress > 1.0 ? Math.max(0, 1.0 - (headProgress - 1.0) / 0.48) : 1.0;
    if (headAlpha > 0.02) {
      drawMiniRetroStar(ctx, headX, headY, 3.8, `rgba(255, 255, 255, ${headAlpha})`);
    }
  }

  ctx.restore();
}

/**
 * Step 3: 상대방을 삼키는 거대 회오리바람 기둥 (Colossal Tornado Vortex Funnel)
 */
function drawCycloneTornadoColumn(
  ctx: any,
  tx: number,
  ty: number,
  progress: number,
  spinPhase: number,
  isBehindLayer: boolean = false
) {
  const t = Math.max(0, Math.min(1.0, progress));
  const baseY = ty + 24;
  const maxHeight = 160;
  const currentHeight = maxHeight * Math.min(1.0, t * 1.25);
  const topY = baseY - currentHeight;

  const rBase = 22;
  const rTop = 58;

  ctx.save();

  // 배후 레이어: 거대 회오리바람의 뒤쪽 반원 호 & 내부 원통형 음영
  if (isBehindLayer) {
    const numBands = 8;
    for (let i = 0; i < numBands; i++) {
      const u = i / (numBands - 1);
      const y = baseY - u * currentHeight;
      const r = rBase + (rTop - rBase) * u;
      const bandPhase = spinPhase * 4.0 + u * Math.PI * 3.0;

      ctx.save();
      ctx.lineWidth = 2.4 + u * 1.6;
      ctx.strokeStyle = "rgba(2, 132, 199, 0.45)"; // 짙은 에어로 블루
      ctx.beginPath();
      // 뒤쪽 반원 호 (PI ~ 2*PI)
      ctx.ellipse(tx, y, r, r * 0.35, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  // 전면 레이어: 거대 회오리바람의 앞쪽 고속 순백/시안 회전 호
  const numBands = 8;
  for (let i = 0; i < numBands; i++) {
    const u = i / (numBands - 1);
    const y = baseY - u * currentHeight;
    const r = rBase + (rTop - rBase) * u;
    const bandPhase = spinPhase * 4.5 + u * Math.PI * 3.5;

    // 앞쪽 반원 호 (0 ~ PI)
    ctx.save();
    ctx.lineWidth = 2.8 + u * 1.8;
    ctx.strokeStyle = i % 2 === 0 ? AERO_WHITE : AERO_CYAN_NEON;
    ctx.beginPath();
    ctx.ellipse(tx, y, r, r * 0.35, 0, 0, Math.PI);
    ctx.stroke();

    // 호를 따라 고속 이동하는 바람 칼날 파티클 (Wind Streaks)
    const streakAngle = (bandPhase % Math.PI);
    const sx = tx + Math.cos(streakAngle) * r;
    const sy = y + Math.sin(streakAngle) * (r * 0.35);
    ctx.fillStyle = AERO_WHITE;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Step 3 & 4: 타겟을 난타하는 초승달 진공 참격 칼날 (Vacuum Slash Sickles)
 */
function drawVacuumSlashBlades(
  ctx: any,
  tx: number,
  ty: number,
  progress: number
) {
  ctx.save();
  const slashes = [
    { angle: -0.65, length: 74, xOff: -6, yOff: -8, width: 4.8 },
    { angle: 0.75, length: 68, xOff: 8, yOff: 4, width: 4.2 },
    { angle: 0.10, length: 82, xOff: 0, yOff: -14, width: 5.2 },
    { angle: -1.25, length: 62, xOff: -10, yOff: 10, width: 4.0 },
  ];

  const t = Math.max(0, Math.min(1.0, progress));

  for (let i = 0; i < slashes.length; i++) {
    const s = slashes[i];
    // 각 참격마다 시차 부여
    const delay = i * 0.22;
    if (t < delay) continue;
    const localT = Math.min(1.0, (t - delay) / 0.55);

    const len = s.length * Math.sin(localT * Math.PI);
    if (len <= 2) continue;

    ctx.save();
    ctx.translate(tx + s.xOff, ty + s.yOff);
    ctx.rotate(s.angle);

    // 날카로운 초승달 진공 참격
    ctx.beginPath();
    ctx.moveTo(-len * 0.5, 0);
    ctx.quadraticCurveTo(0, -s.width * 2.2, len * 0.5, 0);
    ctx.quadraticCurveTo(0, s.width * 0.6, -len * 0.5, 0);
    ctx.fillStyle = AERO_WHITE;
    ctx.fill();

    ctx.strokeStyle = AERO_CYAN_NEON;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Step 4: 대기 파열 십자 섬광 & 초고압 대폭발 (Atmospheric Rupture & Starburst Cross)
 */
function drawAtmosphericRuptureCross(
  ctx: any,
  tx: number,
  ty: number,
  radius: number,
  alpha: number
) {
  if (radius <= 2 || alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  // 1. 순백 & 시안 거대 충격파 원형 링
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = AERO_WHITE;
  ctx.beginPath();
  ctx.arc(tx, ty, radius * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.6;
  ctx.strokeStyle = AERO_CYAN_NEON;
  ctx.beginPath();
  ctx.arc(tx, ty, radius * 1.15, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 4방향 거대 주 섬광 광선 (Cardinal Rays - 날카로운 다이아몬드 참격)
  const cardR = radius * 1.55;
  const cardW = 7.5;
  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

  for (const a of angles) {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(a);

    ctx.fillStyle = AERO_WHITE;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cardR * 0.25, -cardW);
    ctx.lineTo(cardR, 0);
    ctx.lineTo(cardR * 0.25, cardW);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = AERO_CYAN;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // 3. 4방향 보조 대각선 섬광 광선 (Diagonal Rays)
  const diagR = radius * 1.05;
  const diagW = 4.5;
  const diagAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];

  for (const a of diagAngles) {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(a);

    ctx.fillStyle = AERO_SKY_GLOW;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(diagR * 0.25, -diagW);
    ctx.lineTo(diagR, 0);
    ctx.lineTo(diagR * 0.25, diagW);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 4. 중심 고휘도 폭발 글로우 구체
  const hitGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, radius * 0.55);
  hitGrad.addColorStop(0, AERO_WHITE);
  hitGrad.addColorStop(0.4, AERO_SKY_GLOW);
  hitGrad.addColorStop(0.8, AERO_CYAN);
  hitGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
  ctx.fillStyle = hitGrad;
  ctx.beginPath();
  ctx.arc(tx, ty, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // 5. 전방위 비산하는 미니 스타버스트 스파크 8개
  for (let i = 0; i < 8; i++) {
    const sparkAngle = (i / 8) * Math.PI * 2 + 0.2;
    const sparkDist = radius * (0.95 + (i % 2) * 0.35);
    const sx = tx + Math.cos(sparkAngle) * sparkDist;
    const sy = ty + Math.sin(sparkAngle) * sparkDist;
    drawMiniRetroStar(ctx, sx, sy, 3.2, AERO_WHITE);
  }

  ctx.restore();
}

/**
 * 지면 공기 압축 충격파 링 (Ground Shockwave Expansion)
 */
function drawGroundShockwave(
  ctx: any,
  tx: number,
  ty: number,
  progress: number
) {
  const t = Math.max(0, Math.min(1.0, progress));
  const gy = ty + 24;
  const rx = 24 + t * 52;
  const ry = rx * 0.34;
  const alpha = Math.max(0, 1.0 - t);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = AERO_WHITE;
  ctx.beginPath();
  ctx.ellipse(tx, gy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.4;
  ctx.strokeStyle = AERO_CYAN_NEON;
  ctx.beginPath();
  ctx.ellipse(tx, gy, rx * 1.25, ry * 1.25, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// Main Exported Renderers
// ============================================================================

/**
 * 177: 에어로블라스트 배후 이펙트 (Aeroblast Behind Effect)
 * - 전장 대기압 암전 워시
 * - 피격 포켓몬 등 뒤로 솟구치는 거대 회오리바람의 후면 호
 * - 발밑 지면 압축 충격파 링
 */
export function drawAeroblastBehindEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!frameOrTargetPos) return;

  let frame: BattleFrame | null = null;
  let drawCtx: EffectDrawContext | null = null;
  let targetPos = { x: 380, y: 130 };
  let attackerPos = { x: 130, y: 260 };
  let moveStep = 1;
  let p = 0.5;
  let isPlayer = true;

  if (
    typeof frameOrTargetPos === "object" &&
    ("showEffect" in frameOrTargetPos || "moveStep" in frameOrTargetPos || "delay" in frameOrTargetPos)
  ) {
    frame = frameOrTargetPos as BattleFrame;
    drawCtx = drawCtxOrStep as EffectDrawContext;
    if (!frame.showEffect || !drawCtx?.targetPos) return;

    targetPos = drawCtx.targetPos;
    attackerPos = drawCtx.attackerPos || attackerPos;
    isPlayer = drawCtx.isPlayer ?? true;
    moveStep = frame.moveStep ?? 1;
    p = frame.effectProgress ?? 0.5;
  } else {
    targetPos = frameOrTargetPos;
    moveStep = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 1;
    p = 0.5;
  }

  const ctx = targetCtx;
  const dir = isPlayer ? 1 : -1;

  // 발사 원점 (시전자 입/가슴 앞)
  const ax = attackerPos.x + (isPlayer ? (frame?.pOffset?.x ?? 0) : (frame?.eOffset?.x ?? 0)) + dir * 28;
  const ay = attackerPos.y + (isPlayer ? (frame?.pOffset?.y ?? 0) : (frame?.eOffset?.y ?? 0)) - 12;

  const tx = targetPos.x + (isPlayer ? (frame?.eOffset?.x ?? 0) : (frame?.pOffset?.x ?? 0));
  const ty = targetPos.y + (isPlayer ? (frame?.eOffset?.y ?? 0) : (frame?.pOffset?.y ?? 0)) - 6;

  ctx.save();

  // 1. 대기압 필터 오버레이 & 회전선 배경:
  // - Step 1: 기체 모을 때는 검정 필터 (Atmospheric Dim Black)
  // - Step 2+: 대상에게 발사할 때에는 시원하고 거대한 푸른 필터 + 화면 전체 나선형 회전선 배경!
  if (moveStep === 1) {
    const dimAlpha = frame?.dimAlpha ?? (0.18 + 0.74 * p);
    if (dimAlpha > 0.005) {
      ctx.save();
      // 대기압 진공 급강하 짙은 암전
      ctx.fillStyle = `rgba(8, 12, 22, ${dimAlpha})`;
      ctx.fillRect(-5000, -5000, 12000, 12000);
      ctx.restore();
    }
  } else {
    // Step 2, 3, 4: 발포 직후 및 착탄 - 맑고 짙푸른 에어로 블루 필터 + 32가닥 회전선 배경 전개!
    drawSwirlingVortexBackground(ctx, tx, ty, p, moveStep, dir);
  }

  // 2. 발사 및 착탄 시 대상 포켓몬 배후 회전선 (Target Behind Vortex Rotation Lines)
  // - 블라스트가 대상 포켓몬에게 도달하기 전(beamProgress < 0.90)에는 대상 회전선을 생성하지 않음!
  const bProg = frame?.beamProgress ?? (moveStep >= 3 ? 1.45 : p * 1.45);
  if ((moveStep === 2 && bProg >= 0.90) || (moveStep >= 3 && moveStep <= 5)) {
    drawTargetVortexRotationLines(ctx, tx, ty, p, moveStep, "behind");
  }

  // 3. 🌟 [유저 지시]: 독가스(139)처럼 상대 포켓몬을 관통하여 등 뒤(Z축 뒤)로 길게 뻗어나가는 후면 소용돌이 스트림!
  if (moveStep >= 2 && bProg >= 0.95) {
    const animP = p + (moveStep === 2 ? 0 : moveStep === 3 ? 1.2 : moveStep === 4 ? 2.4 : 3.6);
    if (moveStep === 5) {
      const dissProg = frame?.dissipationProgress ?? p;
      const fadeAlpha = Math.max(0, 1.0 - dissProg);
      if (fadeAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = fadeAlpha * 0.85;
        drawAeroblastConnectedCyclones(ctx, ax, ay, tx, ty, bProg, animP, "behind");
        ctx.restore();
      }
    } else {
      drawAeroblastConnectedCyclones(ctx, ax, ay, tx, ty, bProg, animP, "behind");
    }
  }

  ctx.restore();
}

/**
 * 177: 에어로블라스트 전면 이펙트 (Aeroblast Front Effect)
 * - Step 1: 시전자 앞 풍압 흡입 소용돌이 기류 & 초고압 에어로 볼텍스 구체
 * - Step 2: 초고속 3D 나선형 볼텍스 캐논 빔 & 마하 충격파 링
 * - Step 3: 상대 직격 착탄 & 전면 회오리바람 기둥 & 진공 참격 난타
 * - Step 4: 대기 파열 십자 섬광 & 초고압 충격파 대폭발 & 스파크 비산
 * - Step 5: 회오리 상공 소산 & 은은한 기류 잔향 소멸
 */
export function drawAeroblastEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!frameOrTargetPos) return;

  let frame: BattleFrame | null = null;
  let drawCtx: EffectDrawContext | null = null;
  let targetPos = { x: 380, y: 130 };
  let attackerPos = { x: 130, y: 260 };
  let moveStep = 1;
  let p = 0.5;
  let isPlayer = true;

  if (
    typeof frameOrTargetPos === "object" &&
    ("showEffect" in frameOrTargetPos || "moveStep" in frameOrTargetPos || "delay" in frameOrTargetPos)
  ) {
    frame = frameOrTargetPos as BattleFrame;
    drawCtx = drawCtxOrStep as EffectDrawContext;
    if (!frame.showEffect || !drawCtx?.targetPos) return;

    targetPos = drawCtx.targetPos;
    attackerPos = drawCtx.attackerPos || attackerPos;
    isPlayer = drawCtx.isPlayer ?? true;
    moveStep = frame.moveStep ?? 1;
    p = frame.effectProgress ?? 0.5;
  } else {
    targetPos = frameOrTargetPos;
    moveStep = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 1;
    p = 0.5;
  }

  const ctx = targetCtx;
  const dir = isPlayer ? 1 : -1;

  // 발사 원점 (시전자 입/가슴 앞)
  const ax = attackerPos.x + (isPlayer ? (frame?.pOffset?.x ?? 0) : (frame?.eOffset?.x ?? 0)) + dir * 28;
  const ay = attackerPos.y + (isPlayer ? (frame?.pOffset?.y ?? 0) : (frame?.eOffset?.y ?? 0)) - 12;

  // 피격 표적 중심 (상대방 가슴)
  const tx = targetPos.x + (isPlayer ? (frame?.eOffset?.x ?? 0) : (frame?.pOffset?.x ?? 0));
  const ty = targetPos.y + (isPlayer ? (frame?.eOffset?.y ?? 0) : (frame?.pOffset?.y ?? 0)) - 6;

  ctx.save();

  // ===========================================================================
  // Step 1: 풍압 집약 & 대기압 왜곡 차징 (1단계: 공기모으기 -> 2단계: 기체 다 모인 후 머금기)
  // ===========================================================================
  if (moveStep === 1) {
    const chargeProg = frame?.chargeProgress ?? p;
    const isFully = Boolean(frame?.isFullyCharged);
    const holdP = frame?.holdProgress ?? 0;

    // 기체가 다 모인 상태(isFully)에서는 고압 맥동과 초고속 회전 반영
    const pulseOffset = isFully ? Math.sin(holdP * Math.PI * 4) * 1.6 : 0;
    const sphereR = Math.max(12, (14 + chargeProg * 12) + pulseOffset); // 14px -> 26px (+맥동)
    const sphereAlpha = isFully ? 1.0 : Math.min(1.0, 0.20 + chargeProg * 0.80);

    // 1. 공기 모으는 중일 때만 사방에서 기체 흡수 선 유입 (다 뭉쳐진 후에는 완전히 흡수되어 소멸!)
    if (!isFully) {
      drawConvergingGasStreams(ctx, ax, ay, chargeProg, dir, "behind");
    }

    // 2. 시전자 앞 페이드인하는 순백 구체 (외각 투명 방사형 그라데이션)
    drawFadeInAeroSphere(ctx, ax, ay, sphereR, sphereAlpha);

    // 3. 공기 모으는 중일 때의 전면 기체 흡수 선 (다 뭉쳐진 후에는 완전히 흡수되어 소멸!)
    if (!isFully) {
      drawConvergingGasStreams(ctx, ax, ay, chargeProg, dir, "front");
    }

    // 4. 구체를 감싸며 둥글어 보이게 둥근 구체를 감싸는 압축공기 기체선들
    // - 다 뭉쳐진 후에는 흡수선은 완전히 사라지고, 오직 이 둥근 압축공기 회전선만 구체를 감싸고 맹렬히 초고속 회전!
    const wrapProg = isFully ? (1.0 + holdP * 3.2) : chargeProg;
    drawWrappingSphereLines(ctx, ax, ay, sphereR, wrapProg, dir);
  }

  // ===========================================================================
  // Step 2: 회전하는 바람 각기 다른 크기 및 회전 여러 개 겹쳐서 이어진 폭풍 사출
  // ===========================================================================
  else if (moveStep === 2) {
    const beamProg = frame?.beamProgress ?? p * 1.45;

    // 전면 대기 푸른빛 필터 (블라스트가 대상에 도달할 때만 대상 오라 발광)
    drawFrontAtmosphericFilter(ctx, tx, ty, p, 2, beamProg);

    // 🌟 전면 소용돌이 스트림 (시전자 앞 ~ 상대방 앞/가슴까지)
    drawAeroblastConnectedCyclones(ctx, ax, ay, tx, ty, beamProg, p, "front");

    // 바람이 대상 포켓몬에게 도달하는 순간(beamProgress >= 0.90)부터 전면 회전선 생성!
    if (beamProg >= 0.90) {
      drawTargetVortexRotationLines(ctx, tx, ty, p, 2, "front");
    }

    // 시전자 발사구 반동 섬광 구체 (은은한 순백 발광만 유지)
    const launchR = 24 * (1.0 - p * 0.25);
    drawFadeInAeroSphere(ctx, ax, ay, launchR, 1.0 - p * 0.3);
  }

  // ===========================================================================
  // Step 3: 상대 직격 착탄 & 관통 연결 폭풍 작렬 (Target Impact & Full Power Cyclones)
  // ===========================================================================
  else if (moveStep === 3) {
    const beamProg = frame?.beamProgress ?? 1.45;

    // 전면 대기 푸른빛 필터
    drawFrontAtmosphericFilter(ctx, tx, ty, p, 3);

    // 🌟 대상을 관통하는 전면 소용돌이 폭풍 (선끝까지 유지 & 회전 지속)
    drawAeroblastConnectedCyclones(ctx, ax, ay, tx, ty, beamProg, p + 1.2, "front");

    // 대상 포켓몬 전면을 맹렬히 휘감는 14가닥 3D 볼텍스 회전선 (지속 회전)
    drawTargetVortexRotationLines(ctx, tx, ty, p, 3, "front");

    // 시전자 발사구 기류 유지
    const launchR = 22 * (1.0 - p * 0.15);
    drawFadeInAeroSphere(ctx, ax, ay, launchR, 0.80);
  }

  // ===========================================================================
  // Step 4: 착탄 관통 피격 안착 (선끝까지 회전 유지)
  // ===========================================================================
  else if (moveStep === 4) {
    const beamProg = frame?.beamProgress ?? 1.45;

    // 전면 대기 푸른빛 필터
    drawFrontAtmosphericFilter(ctx, tx, ty, p, 4);

    // 🌟 대상을 꿰뚫은 전면 소용돌이 폭풍 (선끝까지 유지 & 계속 회전!)
    drawAeroblastConnectedCyclones(ctx, ax, ay, tx, ty, beamProg, p + 2.4, "front");

    // 대상 포켓몬 전면 회전선 (지속 회전)
    drawTargetVortexRotationLines(ctx, tx, ty, p, 4, "front");

    // 시전자 발사구 기류 유지
    const launchR = 18 * (1.0 - p * 0.2);
    drawFadeInAeroSphere(ctx, ax, ay, launchR, 0.60);
  }

  // ===========================================================================
  // Step 5: 폭풍 소멸 & 대기 안정화 (Dissipation & Recovery)
  // ===========================================================================
  else if (moveStep === 5) {
    const dissProg = frame?.dissipationProgress ?? p;
    const fadeAlpha = Math.max(0, 1.0 - dissProg);

    // 전면 대기 푸른빛 필터 (필터 종료까지 유지)
    drawFrontAtmosphericFilter(ctx, tx, ty, p, 5);

    // 소산 단계에서도 연결된 회오리바람이 서서히 소산되며 끝까지 회전 유지!
    if (fadeAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = fadeAlpha * 0.85;
      drawAeroblastConnectedCyclones(ctx, ax, ay, tx, ty, 1.45, dissProg + 3.6, "front");
      ctx.restore();
    }

    // 대상 포켓몬 전면 회전선 (필터 종료까지 맹렬히 회전하며 유지!)
    drawTargetVortexRotationLines(ctx, tx, ty, dissProg, 5, "front");

    if (fadeAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = fadeAlpha;

      // 상공으로 흩어지는 미세 바람 스파크
      for (let i = 0; i < 4; i++) {
        const sx = tx + ((i - 1.5) * 16);
        const sy = ty - 40 - (dissProg * 45) - (i * 8);
        drawMiniRetroStar(ctx, sx, sy, 2.2, AERO_WHITE);
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

// ============================================================================
// 178: 목화포자 (Cotton Spore)
// ============================================================================

/**
 * 256색 팔레트 최적화 목화포자 색상 상수 (Cotton Spore Palette)
 */
const COTTON_WHITE = "#FFFFFF";
const COTTON_CREAM = "#F8FAFC";
const COTTON_LIGHT_GRAY = "#F1F5F9";
const COTTON_SHADOW = "#E2E8F0";
const COTTON_DEEP_SHADOW = "#CBD5E1";
const COTTON_OUTLINE = "#94A3B8";
const COTTON_CALYX_GREEN = "#4ADE80";
const COTTON_CALYX_DARK = "#15803D";
const COTTON_SEED_BROWN = "#92400E";
const COTTON_SPARKLE_YELLOW = "#FEF08A";
const COTTON_SPARKLE_GREEN = "#86EFAC";

/**
 * 단일 목화 솜뭉치 (Fluffy Cotton Puff)
 * - 5개 외곽 로브 + 중심 로브로 이루어진 몽글몽글한 입체 솜뭉치
 * - 하단부에 목화 특유의 3갈래 초록색 꽃받침(Calyx)과 공기 중에 나부끼는 미세 솜털 섬유 가닥 표현
 */
function drawSingleCottonPuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  rot: number = 0,
  alpha: number = 1.0,
  showCalyx: boolean = true,
  scaleX: number = 1.0,
  scaleY: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));
  ctx.translate(cx, cy);
  if (rot !== 0) ctx.rotate(rot);
  if (scaleX !== 1.0 || scaleY !== 1.0) ctx.scale(scaleX, scaleY);

  const lobeAngles = [0, 1.256, 2.513, 3.770, 5.026]; // 5방향 대칭 로브
  const outerDist = radius * 0.45;
  const lobeR = radius * 0.58;
  const centerR = radius * 0.72;

  // 1. 하단 초록색 꽃받침 (Calyx / 깍지)
  if (showCalyx) {
    ctx.save();
    ctx.fillStyle = COTTON_CALYX_GREEN;
    ctx.strokeStyle = "rgba(21, 128, 61, 0.40)";
    ctx.lineWidth = 1;

    // 중앙, 좌, 우 3갈래 잎사귀
    ctx.beginPath();
    // 중앙 잎
    ctx.moveTo(-radius * 0.15, radius * 0.40);
    ctx.lineTo(0, radius * 0.95);
    ctx.lineTo(radius * 0.15, radius * 0.40);
    // 우측 잎
    ctx.lineTo(radius * 0.55, radius * 0.72);
    ctx.lineTo(radius * 0.25, radius * 0.30);
    // 좌측 잎
    ctx.lineTo(-radius * 0.25, radius * 0.30);
    ctx.lineTo(-radius * 0.55, radius * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 2. 외곽 소프트 반투명 솜털 림 (투명한 외곽선)
  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  ctx.beginPath();
  ctx.arc(0, 0, centerR * 1.14, 0, Math.PI * 2);
  for (let i = 0; i < lobeAngles.length; i++) {
    const lx = Math.cos(lobeAngles[i]) * outerDist;
    const ly = Math.sin(lobeAngles[i]) * outerDist;
    ctx.arc(lx, ly, lobeR * 1.14, 0, Math.PI * 2);
  }
  ctx.fill();

  // 중간 부드러운 반투명 층
  ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
  ctx.beginPath();
  ctx.arc(0, 0, centerR * 1.04, 0, Math.PI * 2);
  for (let i = 0; i < lobeAngles.length; i++) {
    const lx = Math.cos(lobeAngles[i]) * outerDist;
    const ly = Math.sin(lobeAngles[i]) * outerDist;
    ctx.arc(lx, ly, lobeR * 1.04, 0, Math.PI * 2);
  }
  ctx.fill();

  // 3. 밝은 순백 솜뭉치 코어 본체 (Pure White Fluffy Core)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(0, 0, centerR * 0.90, 0, Math.PI * 2);
  for (let i = 0; i < lobeAngles.length; i++) {
    const lx = Math.cos(lobeAngles[i]) * outerDist;
    const ly = Math.sin(lobeAngles[i]) * outerDist;
    ctx.arc(lx, ly, lobeR * 0.90, 0, Math.PI * 2);
  }
  ctx.fill();

  // 4. 상단-좌측 순백 볼륨 하이라이트 (Pure White Highlighting)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(-radius * 0.22, -radius * 0.22, centerR * 0.55, 0, Math.PI * 2);
  ctx.arc(Math.cos(lobeAngles[3]) * outerDist * 0.8, Math.sin(lobeAngles[3]) * outerDist * 0.8, lobeR * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // 5. 가장자리에 날리는 가느다란 반투명 솜털 섬유 가닥 (Wispy Cotton Strands)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(radius * 0.55, -radius * 0.20);
  ctx.quadraticCurveTo(radius * 0.85, -radius * 0.45, radius * 1.05, -radius * 0.30);
  ctx.moveTo(-radius * 0.50, radius * 0.15);
  ctx.quadraticCurveTo(-radius * 0.80, radius * 0.40, -radius * 1.00, radius * 0.25);
  ctx.stroke();

  ctx.restore();
}

/**
 * Step 1: 시전자 웅크림 및 몸털기 시 방출되는 포자 솜뭉치들
 */
function drawCottonWindupSporePuffs(
  ctx: any,
  ax: number,
  ay: number,
  progress: number,
  dir: number
) {
  const clampP = Math.max(0, Math.min(1.0, progress));
  const puffs = [
    { dx: -18, dy: -12, r: 12, rot: 0.2,  delay: 0.05 },
    { dx: 16,  dy: -20, r: 14, rot: -0.4, delay: 0.15 },
    { dx: -8,  dy: -28, r: 11, rot: 0.6,  delay: 0.25 },
    { dx: 14,  dy: 6,   r: 10, rot: -0.2, delay: 0.10 },
  ];

  for (let i = 0; i < puffs.length; i++) {
    const pf = puffs[i];
    const localT = Math.max(0, Math.min(1.0, (clampP - pf.delay) / (1.0 - pf.delay)));
    if (localT <= 0) continue;

    const scale = Math.sin(localT * Math.PI * 0.5) * (localT < 0.6 ? 1.25 : 1.0);
    const alpha = Math.min(1.0, localT * 2.5);
    const px = ax + pf.dx * dir;
    const py = ay + pf.dy - localT * 14;

    drawSingleCottonPuff(ctx, px, py, pf.r * scale, pf.rot + localT * 0.8, alpha, true);

    // 피어오르는 미세 홀씨 스파클
    if (localT > 0.3) {
      const spX = px + Math.cos(i * 1.6 + localT * 3) * (pf.r + 6);
      const spY = py + Math.sin(i * 1.6 + localT * 3) * (pf.r + 6);
      drawMiniRetroStar(ctx, spX, spY, 2.2, COTTON_SPARKLE_GREEN);
    }
  }
}

/**
 * Step 2: 시전자로부터 대각선 S자 나선 궤적으로 바람을 타고 쇄도하는 목화 솜뭉치 편대
 */
function drawCottonFlightStream(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  progress: number,
  dir: number,
  layer: "behind" | "front" | "all" = "all"
) {
  const clampP = Math.max(0, Math.min(1.0, progress));
  const numPuffs = 8;

  for (let i = 0; i < numPuffs; i++) {
    const isBehind = i % 3 === 0;
    if (layer === "behind" && !isBehind) continue;
    if (layer === "front" && isBehind) continue;

    // 시차(Stagger) 적용
    const delay = i * 0.08;
    const localT = Math.max(0, Math.min(1.0, (clampP - delay) / 0.65));
    if (localT <= 0 || localT >= 1.0) continue;

    // 직선 보간 + 완만한 포물선 호 + 부드러운 바람 사인파 요동
    const curX = ax + (tx - ax) * localT;
    const heightArc = -Math.sin(localT * Math.PI) * (36 + (i % 3) * 14);
    const waveY = Math.cos(localT * Math.PI * 3.5 + i * 1.4) * 10;
    const curY = ay + (ty - ay) * localT + heightArc + waveY;

    // 솜뭉치 크기 및 회전
    const radius = 10 + (i % 4) * 2.2;
    const rot = (localT * 4.2 + i * 0.8) * (i % 2 === 0 ? 1 : -1);
    const alpha = localT < 0.15 ? localT / 0.15 : (localT > 0.88 ? (1.0 - localT) / 0.12 : 1.0);

    drawSingleCottonPuff(ctx, curX, curY, radius, rot, alpha, true);

    // 솜뭉치 꼬리를 따르는 미세 솜털/홀씨 입자들
    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    for (let k = 1; k <= 2; k++) {
      const trailT = Math.max(0, localT - k * 0.05);
      const trX = ax + (tx - ax) * trailT;
      const trArc = -Math.sin(trailT * Math.PI) * (36 + (i % 3) * 14);
      const trWave = Math.cos(trailT * Math.PI * 3.5 + i * 1.4) * 10;
      const trY = ay + (ty - ay) * trailT + trArc + trWave;
      drawSingleCottonPuff(ctx, trX - dir * (k * 6), trY + (k * 2), radius * 0.32, rot, alpha * 0.5, false);
    }
    ctx.restore();
  }
}

/**
 * 대상 몸체에 착 달라붙는 목화 솜뭉치 좌표 데이터
 */
interface CottonClingPoint {
  id: number;
  rx: number;      // 대상 중심으로부터의 X 오프셋
  ry: number;      // 대상 중심으로부터의 Y 오프셋
  r: number;       // 기본 반경
  rot: number;     // 회전각
  layer: "behind" | "front";
  delayFr: number; // 착탄 시차
}

const COTTON_CLING_POINTS: CottonClingPoint[] = [
  // Front Layer (앞면 달라붙음 - 몸체를 포위하여 감쌈)
  { id: 0, rx: -3,  ry: -28, r: 15, rot: 0.15,  layer: "front",  delayFr: 0.00 }, // 머리 위
  { id: 1, rx: 17,  ry: -20, r: 12, rot: 0.45,  layer: "front",  delayFr: 0.08 }, // 우측 이마/귀
  { id: 2, rx: -2,  ry: -7,  r: 16, rot: -0.10, layer: "front",  delayFr: 0.14 }, // 가슴 중앙
  { id: 3, rx: -18, ry: 4,   r: 13, rot: -0.35, layer: "front",  delayFr: 0.18 }, // 좌측 허리
  { id: 4, rx: 16,  ry: 8,   r: 14, rot: 0.30,  layer: "front",  delayFr: 0.22 }, // 우측 배
  { id: 5, rx: -6,  ry: 22,  r: 12, rot: 0.05,  layer: "front",  delayFr: 0.28 }, // 하단 발치
  // Behind Layer (뒷면 감싸기 - 전후 입체감 제공)
  { id: 6, rx: -21, ry: -14, r: 14, rot: -0.25, layer: "behind", delayFr: 0.04 }, // 좌측 어깨 뒤
  { id: 7, rx: 20,  ry: 2,   r: 13, rot: 0.40,  layer: "behind", delayFr: 0.16 }, // 우측 등 뒤
];

/**
 * Step 3 ~ 5: 대상 포켓몬 전신에 찰싹 달라붙은 솜뭉치 클러스터
 */
function drawClingingCottonCluster(
  ctx: any,
  tx: number,
  ty: number,
  progress: number,
  step: number,
  layer: "behind" | "front" = "front"
) {
  for (let i = 0; i < COTTON_CLING_POINTS.length; i++) {
    const pt = COTTON_CLING_POINTS[i];
    if (pt.layer !== layer) continue;

    let scale = 1.0;
    let alpha = 1.0;
    let offsetX = pt.rx;
    let offsetY = pt.ry;

    // Step 3: 착탄 순간 (통통 튀며 탄성 바운스 Pop!)
    if (step === 3) {
      const localT = Math.max(0, Math.min(1.0, (progress - pt.delayFr) / (1.0 - pt.delayFr)));
      if (localT <= 0) continue;

      alpha = Math.min(1.0, localT * 3.5);
      // 탄성 팝업: 0.4 -> 1.35 -> 1.0 바운스
      const popBounce = Math.sin(localT * Math.PI) * 0.35;
      scale = (localT < 0.3 ? (localT / 0.3) * 1.30 : 1.0 + popBounce);

      // 착탄 직후 미세 솜털 조각 버스트
      if (localT > 0.15 && localT < 0.65 && layer === "front") {
        const burstT = (localT - 0.15) / 0.50;
        const bAlpha = 1.0 - burstT;
        ctx.save();
        ctx.globalAlpha = bAlpha * 0.75;
        for (let b = 0; b < 3; b++) {
          const bAngle = (b / 3) * Math.PI * 2 + pt.id;
          const bDist = pt.r * (0.8 + burstT * 1.2);
          const bx = tx + offsetX + Math.cos(bAngle) * bDist;
          const by = ty + offsetY + Math.sin(bAngle) * bDist;
          drawSingleCottonPuff(ctx, bx, by, 3.5 * (1.0 - burstT * 0.4), bAngle, bAlpha, false);
        }
        ctx.restore();
      }
    }
    // Step 4: 결박 및 짓누름 (숨쉬듯 부드러운 호흡 팽창 & 대상 진동과 연동)
    else if (step === 4) {
      const breathe = Math.sin(progress * Math.PI * 3.0 + pt.id * 1.2) * 0.05;
      scale = 1.0 + breathe;
      alpha = 1.0;
    }
    // Step 5: 소산 및 승화 (솜털 홀씨로 부드럽게 흩어지며 페이드아웃)
    else if (step === 5) {
      alpha = Math.max(0, 1.0 - progress * 1.15);
      scale = 1.0 + progress * 0.25;
      // 상공 및 외곽으로 살랑살랑 표류
      offsetX += Math.sin(progress * Math.PI * 2 + pt.id) * 16 * (pt.rx >= 0 ? 1 : -1);
      offsetY -= progress * 32;

      // 상공으로 날아가는 솜털 홀씨 가루
      if (progress > 0.2 && layer === "front") {
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        const flkX = tx + offsetX + Math.sin(pt.id * 2 + progress * 4) * 8;
        const flkY = ty + offsetY - progress * 15;
        drawSingleCottonPuff(ctx, flkX, flkY, 3.2, progress * 2, alpha * 0.8, false);
        ctx.restore();
      }
    }

    if (alpha > 0.01) {
      drawSingleCottonPuff(
        ctx,
        tx + offsetX,
        ty + offsetY,
        pt.r * scale,
        pt.rot + (step === 4 ? Math.sin(progress * Math.PI * 2) * 0.08 : 0),
        alpha,
        true
      );
    }
  }
}


/**
 * 178: 목화포자 - 배후 레이어 이펙트 (Behind Effect)
 * - 대상 몸체 뒤편에 감싸지는 솜뭉치 (좌측 어깨 뒤, 우측 등 뒤)
 * - 바람에 날리는 배후 편대 솜뭉치들
 */
export function drawCottonSporeBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (frame.showEffect === false && !frame.showBehindEffect) return;

  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 12 : 8);
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isP ? 10 : 8);
  const dir = isP ? 1 : -1;
  const moveStep = frame.moveStep ?? 1;

  ctx.save();

  // Step 2: 배후 비행 솜뭉치
  if (moveStep === 2) {
    const flightProg = frame.sporeFlightProg ?? frame.effectProgress ?? 0.5;
    drawCottonFlightStream(ctx, ax, ay, tx, ty, flightProg, dir, "behind");
  }
  // Step 3 ~ 5: 대상 뒤편 달라붙은 솜뭉치 (입체감 완성)
  else if (moveStep >= 3 && moveStep <= 5) {
    const prog = moveStep === 3
      ? (frame.clingProg ?? 0.5)
      : (moveStep === 4 ? (frame.statProgress ?? 0.5) : (frame.dissipationProg ?? 0.5));
    drawClingingCottonCluster(ctx, tx, ty, prog, moveStep, "behind");
  }

  ctx.restore();
}

/**
 * 178: 목화포자 - 전면 레이어 메인 이펙트 (Main Front Effect)
 */
export function drawCottonSporeEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (frame.showEffect === false) return;

  const { attackerPos, targetPos, isPlayer: isP, isHit } = drawCtx;
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 12 : 8);
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isP ? 10 : 8);
  const dir = isP ? 1 : -1;
  const moveStep = frame.moveStep ?? 1;

  ctx.save();

  // ===========================================================================
  // Step 1: 시전자 웅크림 및 몸 털기 방출 (Windup & Scatter)
  // ===========================================================================
  if (moveStep === 1) {
    const windupProg = frame.cottonWindupProg ?? frame.effectProgress ?? 0.5;
    drawCottonWindupSporePuffs(ctx, ax, ay, windupProg, dir);
  }

  // ===========================================================================
  // Step 2: 솜뭉치 대각선 S자 나선 궤적 쇄도 비행 (Floating Spore Drift)
  // ===========================================================================
  else if (moveStep === 2) {
    const flightProg = frame.sporeFlightProg ?? frame.effectProgress ?? 0.5;
    drawCottonFlightStream(ctx, ax, ay, tx, ty, flightProg, dir, "front");
  }

  // ===========================================================================
  // Step 3: 상대방 전신 착탄 & 찰싹 밀착 ('착 달라붙음!') (Clinging Impact)
  // ===========================================================================
  else if (moveStep === 3) {
    const clingProg = frame.clingProg ?? frame.effectProgress ?? 0.5;
    drawClingingCottonCluster(ctx, tx, ty, clingProg, 3, "front");

    // 착탄 순간 중앙부 타격 스파클 버스트
    if (frame.impactPop && clingProg < 0.6) {
      drawMiniRetroStar(ctx, tx, ty - 10, 3.5, COTTON_SPARKLE_YELLOW);
      drawMiniRetroStar(ctx, tx - 14 * dir, ty - 18, 2.8, COTTON_SPARKLE_GREEN);
      drawMiniRetroStar(ctx, tx + 12 * dir, ty - 4, 2.8, COTTON_WHITE);
    }
  }

  // ===========================================================================
  // Step 4: 결박 무게감 (기본 랭크다운 파티클과 연동되어 솜뭉치 유지)
  // ===========================================================================
  else if (moveStep === 4) {
    const debuffProg = frame.statProgress ?? frame.effectProgress ?? 0.5;
    // 전면 착 달라붙은 솜뭉치 유지
    drawClingingCottonCluster(ctx, tx, ty, debuffProg, 4, "front");
  }

  // ===========================================================================
  // Step 5: 솜뭉치 승화 및 홀씨 소산 (Dissipation & Recovery)
  // ===========================================================================
  else if (moveStep === 5) {
    const dissProg = frame.dissipationProgress ?? frame.effectProgress ?? 0.5;
    drawClingingCottonCluster(ctx, tx, ty, dissProg, 5, "front");
  }

  ctx.restore();
}

// ============================================================================
// 179: 기사회생 (Reversal) - 5세대 고증 3D 회전 구체 & 잔상 연출
// ============================================================================

/**
 * 기사회생 3D 잔상 구체 단일 렌더링
 * - 중심: 순백색 눈부신 코어
 * - 중간: 밝고 선명한 아이스 블루 / 시안 바디
 * - 외곽: 부드러운 스카이 블루 글로우
 */
function drawSingleReversalOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number
) {
  if (radius <= 0.5 || alpha <= 0.01) return;

  ctx.save();

  // 1. 외곽 붉은빛 소프트 오라 글로우 (Red Glow) - 알갱이 축소 반영
  const glowR = radius * 2.0;
  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowR);
  glowGrad.addColorStop(0.00, `rgba(239, 68, 68, ${0.85 * alpha})`);
  glowGrad.addColorStop(0.35, `rgba(220, 38, 38, ${0.50 * alpha})`);
  glowGrad.addColorStop(0.70, `rgba(185, 28, 28, ${0.18 * alpha})`);
  glowGrad.addColorStop(1.00, "rgba(185, 28, 28, 0.0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 붉은 그라데이션 바디 (안은 흰색 -> 바깥은 붉은색)
  const bodyR = radius * 1.15;
  const bodyGrad = ctx.createRadialGradient(x, y, 0, x, y, bodyR);
  bodyGrad.addColorStop(0.00, `rgba(255, 255, 255, ${0.98 * alpha})`);
  bodyGrad.addColorStop(0.40, `rgba(254, 205, 211, ${0.92 * alpha})`);
  bodyGrad.addColorStop(0.75, `rgba(239, 68, 68, ${0.85 * alpha})`);
  bodyGrad.addColorStop(1.00, "rgba(220, 38, 38, 0.0)");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(x, y, bodyR, 0, Math.PI * 2);
  ctx.fill();

  // 3. 눈부신 순백 코어 (Pure White Core)
  const coreR = radius * 0.50;
  const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, coreR);
  coreGrad.addColorStop(0.00, `rgba(255, 255, 255, ${1.0 * alpha})`);
  coreGrad.addColorStop(0.65, `rgba(255, 241, 242, ${0.95 * alpha})`);
  coreGrad.addColorStop(1.00, "rgba(255, 228, 230, 0.0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(x, y, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 기사회생 3D 회전 구체 시스템 (Behind / Front 레이어 완벽 분리)
 * - [유저 캡처 100% 동기화]: 노란색 슬라이스 밴드와 동일한 -32° 경사면 축을 따라 3D 회전
 * - sin(th) < 0: 포켓몬 등 뒤 (behind 레이어)
 * - sin(th) >= 0: 포켓몬 앞쪽 (front 레이어)
 */
function drawReversalOrbSystem(
  ctx: any,
  cx: number,
  cy: number,
  orbAngle: number,
  orbCount: number = 1,
  layer: "behind" | "front",
  alphaMultiplier: number = 1.0,
  disperseProgress?: number
) {
  // 🌟 [유저 지시]: 한번 빨간 구체 숨겨줘봐
  return;

  // 🌟 [유저 지시]: 빨간 회전구체 궤도 각도 수평 (tilt = 0.0)
  const tilt = 0.0; // 완전한 수평 궤도
  const cosTilt = 1.0;
  const sinTilt = 0.0;

  // 🌟 [유저 지시]: 줌 아웃 전 공중으로 분산 상승 (높이 최대 160px 솟구침, 외곽 확장 및 서서히 소멸)
  const disp = disperseProgress ?? 0;
  const dispLift = Math.pow(disp, 1.25) * 160;
  const dispExpand = 1.0 + disp * 0.70;
  const dispAlpha = Math.max(0, 1.0 - disp * 1.15);

  if (dispAlpha <= 0.005) return;

  // 구체 구성: [유저 지시] 1차 동그라미와 2차 동그라미 간격 대폭 좁힘 (yOff: -2.5 vs +3.0, phaseOffset: -0.38)
  const orbConfigs = orbCount === 2
    ? [
        { yOff: -2.5, rx: 46, ry: 15.0, baseRad: 3.6, dir: 1.0, phaseOffset: 0.0 },   // 선행 구체
        { yOff: 3.0, rx: 44, ry: 14.5, baseRad: 3.2, dir: 1.0, phaseOffset: -0.38 }, // 뒤따르는 구체 (간격 밀착)
      ]
    : [
        { yOff: 0, rx: 46, ry: 15.0, baseRad: 3.6, dir: 1.0, phaseOffset: 0.0 },
      ];

  // 잔상 오프셋 및 알파 감쇠 (헤드 포함 총 5개)
  const trailSteps = [
    { dt: 0.00, alphaScale: 1.00, sizeScale: 1.00 },
    { dt: 0.18, alphaScale: 0.70, sizeScale: 0.88 },
    { dt: 0.36, alphaScale: 0.48, sizeScale: 0.76 },
    { dt: 0.54, alphaScale: 0.30, sizeScale: 0.65 },
    { dt: 0.72, alphaScale: 0.16, sizeScale: 0.55 },
  ];

  for (const cfg of orbConfigs) {
    // 꼬리부터 먼저 그리고 머리를 마지막에 그려서 머리가 가장 위에 올라오도록 역순 순회
    for (let i = trailSteps.length - 1; i >= 0; i--) {
      const step = trailSteps[i];
      // 같은 방향(dir: 1.0)으로 시간차(phaseOffset)를 두고, 회전 뒤편으로 잔상이 뒤따름
      const th = (orbAngle + cfg.phaseOffset - step.dt) * cfg.dir;

      // 3D 뎁스 판단: sin(th) < 0이면 포켓몬 등 뒤, >= 0이면 앞쪽
      const sinTh = Math.sin(th);
      const isBehind = sinTh < 0;

      if (layer === "behind" && !isBehind) continue;
      if (layer === "front" && isBehind) continue;

      // 경사면(-32도) 회전 좌표 변환 + 🌟 공중 분산 상승 및 외곽 팽창
      const lx = Math.cos(th) * (cfg.rx * dispExpand);
      const ly = sinTh * (cfg.ry * dispExpand);

      const px = cx + lx * cosTilt - ly * sinTilt;
      const py = cy + lx * sinTilt + ly * cosTilt + cfg.yOff - dispLift;

      // 원근감 스케일: 앞쪽(z > 0)일 때 1.15배 확대, 뒤쪽(z < 0)일 때 0.85배 축소
      const depthScale = 1.0 + sinTh * 0.15;
      const finalRadius = cfg.baseRad * step.sizeScale * depthScale * (1.0 + disp * 0.35);
      const finalAlpha = step.alphaScale * (isBehind ? 0.80 : 1.0) * alphaMultiplier * dispAlpha;

      if (finalAlpha > 0.005) {
        drawSingleReversalOrb(ctx, px, py, finalRadius, finalAlpha);
      }

      // 🌟 [유저 지시]: 공중 분산 시 방사형으로 흩어지는 빛 가루/스파크
      if (disp > 0.08 && layer === "front" && i === 0) {
        ctx.save();
        for (let s = 0; s < 5; s++) {
          const sAngle = (s / 5) * Math.PI * 2 + orbAngle * 1.8;
          const sDist = disp * 30 + (s * 6) % 14;
          const sx = px + Math.cos(sAngle) * sDist;
          const sy = py + Math.sin(sAngle) * (sDist * 0.6) - disp * 20;
          const sR = Math.max(0.4, (2.2 - disp * 1.5) * (0.8 + (s % 3) * 0.2));
          const sAlpha = Math.max(0, (1.0 - disp) * 0.85);

          ctx.fillStyle = `rgba(255, ${160 + (s % 3) * 40}, 45, ${sAlpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, sR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }
}

/**
 * 5세대/6세대 원본 캡처 100% 고증: 시전포켓몬을 360° 입체로 감싸는 3D 원형 옐로우 스피드라인 링
 * - [루기아/루카리오 원본 캡처 media_1790866125400.png, media_1790866395123.png 완벽 일치]:
 *   1) 단일 평면 덩어리가 아닌, 시전 포켓몬의 몸체를 3차원 원(타원 원기둥 링)으로 완전히 감싸 회전
 *   2) Z축 분리: sin(th) < 0인 후면 50% 가닥은 포켓몬 등 뒤(behind), sin(th) >= 0인 전면 50% 가닥은 가슴/배 앞(front) 관통
 *   3) 모든 가닥의 각도가 통일되게 위쪽(-32° 대각선)을 향하며, 끝단은 0.2px 극세 바늘침으로 날카롭게 마감
 *   4) [유저 지시]: 주황빛 선들 완전 삭제, 순수 반투명 옐로우 & 순백 코어 스피드라인만 정갈하게 구성
 */
function drawYellow3DRingSpeedlines(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  layer: "behind" | "front" | "all" = "all"
) {
  ctx.save();
  ctx.lineCap = "round";

  // -32도 경사면 기울기 축 (구체 회전 궤도와 1:1 완벽 일치)
  const tilt = -0.56;
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);

  // 1. 3D 타원 링 베이스 오라 글로우 (주황빛 배제: 순수 맑은 반투명 옐로우)
  ctx.save();
  ctx.translate(cx, cy - 6);
  ctx.rotate(tilt);
  ctx.scale(1.0, 0.42); // 3D 원근 타원 압축

  const ringGrad = ctx.createRadialGradient(0, 0, 32, 0, 0, 75);
  ringGrad.addColorStop(0.0, "rgba(255, 245, 157, 0.0)");
  ringGrad.addColorStop(0.45, layer === "front" ? "rgba(255, 238, 88, 0.18)" : "rgba(255, 238, 88, 0.10)");
  ringGrad.addColorStop(0.78, layer === "front" ? "rgba(255, 245, 157, 0.10)" : "rgba(255, 238, 88, 0.05)");
  ringGrad.addColorStop(1.0, "rgba(255, 238, 88, 0.0)");

  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  if (layer === "front") {
    // 전면 반원 (y >= 0)
    ctx.arc(0, 0, 75, 0, Math.PI, false);
  } else if (layer === "behind") {
    // 후면 반원 (y < 0)
    ctx.arc(0, 0, 75, Math.PI, Math.PI * 2, false);
  } else {
    ctx.arc(0, 0, 75, 0, Math.PI * 2, false);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. 3D 원형 둘레 고속 스피드라인 (Manga Speedlines Ring)
  const numStrands = 60;
  for (let i = 0; i < numStrands; i++) {
    // 원 둘레 각도 (0 ~ 2pi) + 자연스러운 불규칙 지터
    const baseAngle = (i / numStrands) * Math.PI * 2;
    const angleJitter = Math.sin(i * 3.7) * 0.05;
    const th = baseAngle + angleJitter;

    // 3D 뎁스: sin(th) < 0 이면 등 뒤(behind), >= 0 이면 앞쪽(front)
    const sinTh = Math.sin(th);
    const isBehind = sinTh < 0;

    if (layer === "behind" && !isBehind) continue;
    if (layer === "front" && isBehind) continue;

    // 🌟 [유저 지시]: 주황빛 선들 삭제 (순수 옐로우 & 순백 코어 가닥만 남김)
    const isCoreLine = (i % 4 === 0) || (Math.abs(sinTh) > 0.82 && i % 2 === 0);
    const isYellowLine = (i % 2 === 0);
    if (!isCoreLine && !isYellowLine) continue; // 주황빛이던 비-코어 홀수 가닥 삭제

    // 타원 링 상의 3D 반경 (3중 밴드 깊이감 부여)
    const bandIdx = ((i * 7) % 3) - 1; // -1, 0, 1
    const rx = 52 + bandIdx * 8 + Math.sin(i * 5.1) * 3; // 41 ~ 63px
    const ry = 19 + bandIdx * 3 + Math.cos(i * 4.3) * 2; // 14 ~ 24px

    // 3D 타원 링 상의 기준 앵커 좌표
    const lx = Math.cos(th) * rx;
    const ly = sinTh * ry;
    const bx = cx + lx * cosTilt - ly * sinTilt;
    const by = cy - 6 + lx * sinTilt + ly * cosTilt;

    // 가닥 길이: 측면(플랭크)은 길게 뻗어나가고, 중앙부는 적당한 길이로 몸통 감쌈
    const isFlank = Math.abs(Math.cos(th)) > 0.60;
    const baseLen = isFlank ? (62 + ((i * 13) % 28)) : (45 + ((i * 11) % 20)); // 45 ~ 90px
    const len = baseLen + Math.sin(progress * 10 + i) * 3;

    // 가닥의 시작과 끝 (앵커 포인트 기준: 시작 -0.35, 끝 +0.65)
    // 🌟 모든 가닥이 일관되게 위쪽(-32° 대각선: cosTilt, sinTilt)을 향함
    const tStart = -len * 0.35;
    const tEnd = len * 0.65;
    const strandLen = tEnd - tStart;

    // 🌟 가닥 렌더링: 베이스(2.8~3.3px 굵기) ➔ 끝단(0.2px 극세 바늘침) 날카롭게 마감
    const samples = 7;
    for (let s = 0; s < samples; s++) {
      const u1 = s / samples;
      const u2 = (s + 1) / samples;
      const uMid = (u1 + u2) * 0.5;

      const px1 = bx + (tStart + u1 * strandLen) * cosTilt;
      const py1 = by + (tStart + u1 * strandLen) * sinTilt;
      const px2 = bx + (tStart + u2 * strandLen) * cosTilt;
      const py2 = by + (tStart + u2 * strandLen) * sinTilt;

      // 굵기 테이퍼: 3.0px ➔ 0.2px
      const width = Math.max(0.2, (2.8 + (i % 3) * 0.5) * Math.pow(1.0 - uMid, 0.85));

      // 투명도 감쇠: 끝단으로 갈수록 자연스럽게 0으로 페이드아웃
      const depthAlpha = isBehind ? 0.44 : 0.65;
      const segAlpha = depthAlpha * Math.pow(1.0 - uMid, 0.65) * (0.85 + 0.15 * (i % 2));

      // 색상: 순백(#FFFFFF) 또는 밝은 레몬 옐로우(#FFEE58) (주황빛 제로)
      const color = isCoreLine
        ? `rgba(255, 255, 255, ${segAlpha * 0.95})`
        : `rgba(255, 238, 88, ${segAlpha})`;

      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * [유저 지시]: 지면에 배치된 3D 잔상 스피드라인 링
 * - 배치: 포켓몬 발밑 지면(Ground gy)에 3D 타원 원형으로 안착
 * - 잔상: 각 가닥이 회전하며 뒤편으로 4단계의 반투명 잔상(Afterimages)을 남김
 * - 형상: 유려하게 솟구치며 양 끝이 뾰족한 초승달 블레이드형 스우시 가닥 16개로 구성된 3D 원형 링
 * - Z축 입체 분리:
 *     sin(phi) < 0: 포켓몬 발/몸체 뒤편 지면 (behind 레이어)
 *     sin(phi) >= 0: 포켓몬 발/몸체 앞쪽 지면 (front 레이어)
 */
function drawReversalSpeedlineRing(
  ctx: any,
  cx: number,
  gy: number, // 지면 Y 좌표
  orbAngle: number,
  layer: "behind" | "front",
  alphaMultiplier: number = 1.0,
  disperseProgress?: number
) {
  // 🌟 [유저 지시]: 퍼질 때 좀 더 빨리 투명해지도록 급격한 페이드아웃 적용
  const disp = disperseProgress ?? 0;
  const dispLift = Math.pow(disp, 1.25) * 140; // 솟구치는 상승 높이
  const dispExpand = 1.0 + disp * 0.70; // 외곽으로 비산
  const dispFade = Math.max(0, Math.pow(Math.max(0, 1.0 - disp * 2.2), 1.6)); // 초고속 조기 투명화 (disp ~ 0.45에서 완전 0)

  if (dispFade <= 0.005) return;

  ctx.save();
  ctx.lineCap = "round";

  const numStrands = 16;
  const rotOffset = orbAngle * 0.70; // 3D 회전 오프셋
  // 🌟 [유저 지시]: 조금만 원지름 좁게 (Rx: 44, Ry: 14.5) * 분산 시 외곽 확장
  const Rx = 44 * dispExpand;
  const Ry = 14.5 * dispExpand;
  const deltaPhi = 0.72; // 각 가닥의 원주 길이 (약 41도)

  // 🌟 [유저 지시]: 회전 뒤편으로 남기는 4단계 잔상(Afterimages) 정의 (오래된 잔상부터 헤드 순으로 렌더링)
  const trailSteps = [
    { dt: 0.38, alphaScale: 0.20, widthScale: 0.62 }, // 3차 잔상
    { dt: 0.24, alphaScale: 0.42, widthScale: 0.75 }, // 2차 잔상
    { dt: 0.12, alphaScale: 0.68, widthScale: 0.88 }, // 1차 잔상
    { dt: 0.00, alphaScale: 1.00, widthScale: 1.00 }, // 메인 헤드 (최상단)
  ];

  // 🌟 [유저 지시]: 흩어지더라도 불 형상처럼 보이게 하는 묶음들이 묶인채로 흩어지게 (4대 화염 묶음)
  const bundleCount = 4;
  const strandsPerBundle = numStrands / bundleCount; // 4가닥씩 한 묶음

  for (const step of trailSteps) {
    for (let i = 0; i < numStrands; i++) {
      const bundleIdx = Math.floor(i / strandsPerBundle);
      const inBundleIdx = i % strandsPerBundle;

      // 4개 화염 묶음 각각의 중심 방사 각도
      const bundleCenterAngle = (bundleIdx / bundleCount) * Math.PI * 2 + rotOffset;
      const cosBundle = Math.cos(bundleCenterAngle);
      const sinBundle = Math.sin(bundleCenterAngle);

      // 분산 시 묶음 단위로 함께 이동 (가닥들이 따로 쪼개지지 않고 묶인 채로 이동)
      const bundleBurstDist = Math.pow(disp, 0.85) * 65;
      const burstX = cosBundle * bundleBurstDist * 1.30;
      const burstY = sinBundle * bundleBurstDist * 0.55;
      const bundleLift = Math.pow(disp, 1.25) * 145 + (bundleIdx % 2) * 8 * disp;

      // 평상시 균등 원형 ➔ 분산 시 묶음 단위로 가닥들이 밀착하여 두터운 불꽃 형상 유지
      const normalPhi = (i / numStrands) * Math.PI * 2 + rotOffset;
      const bundledPhi = bundleCenterAngle + (inBundleIdx - 1.5) * 0.10; // 묶음 내부 밀착
      const phiBase = normalPhi * (1.0 - disp) + bundledPhi * disp;
      const phi = phiBase - step.dt * (1.0 - disp * 0.4);

      const sinPhi = Math.sin(phi);
      const isBehind = sinPhi < 0;

      // 🌟 Z축 앞/뒤 분리
      if (layer === "behind" && !isBehind) continue;
      if (layer === "front" && isBehind) continue;

      // 원근감 스케일 & 투명도 (앞쪽 1.15배, 뒤쪽 0.85배)
      const depthScale = 1.0 + sinPhi * 0.15;
      const layerAlpha = (isBehind ? 0.75 : 1.0) * step.alphaScale * alphaMultiplier * dispFade;
      if (layerAlpha <= 0.005) continue;

      // 🌟 [유저 지시]: 불꽃 묶음 두께 유지 (얇은 선으로 흩어지지 않고 두툼한 불꽃 덩어리감 유지)
      const baseWidth = Math.max(1.0, 9.5 * depthScale * step.widthScale * Math.max(0.75, 1.0 - disp * 0.20));

      const samples = 18;
      const topEdge: { x: number; y: number }[] = [];
      const bottomEdge: { x: number; y: number }[] = [];
      const coreTopEdge: { x: number; y: number }[] = [];
      const coreBottomEdge: { x: number; y: number }[] = [];

      let startPt = { x: 0, y: 0 };
      let endPt = { x: 0, y: 0 };

      // 불꽃 일렁임 미세 지터
      const flameFlutter = disp > 0.05 ? Math.sin(disp * 10 + bundleIdx * 2 + inBundleIdx) * (disp * 3.5) : 0;

      for (let s = 0; s <= samples; s++) {
        const u = s / samples;

        // 원주각
        const th = phi - (u - 0.5) * deltaPhi;
        const cosTh = Math.cos(th);
        const sinTh = Math.sin(th);

        // 🌟 지면(gy)에서 시작하여 위쪽으로 솟구치는 리프트 + 묶음 단위 비산 상승
        const lift = (30 + disp * 40) * Math.pow(u, 1.5) + bundleLift + flameFlutter * u;
        const px = cx + Rx * cosTh + burstX;
        const py = gy + Ry * sinTh - lift + burstY;

        if (s === 0) startPt = { x: px, y: py };
        if (s === samples) endPt = { x: px, y: py };

        // 완벽한 실제 접선 벡터 계산
        const uNext = Math.min(1.0, u + 0.02);
        const uPrev = Math.max(0.0, u - 0.02);
        const thNext = phi - (uNext - 0.5) * deltaPhi;
        const thPrev = phi - (uPrev - 0.5) * deltaPhi;
        const tx = (Rx * Math.cos(thNext)) - (Rx * Math.cos(thPrev));
        const ty = (Ry * Math.sin(thNext) - (30 + disp * 40) * Math.pow(uNext, 1.5)) - (Ry * Math.sin(thPrev) - (30 + disp * 40) * Math.pow(uPrev, 1.5));
        const tLen = Math.hypot(tx, ty) || 1.0;

        // 법선 벡터
        const nx = -ty / tLen;
        const ny = tx / tLen;

        // 🌟 양 끝 뾰족 + 중간 굵기 유지
        const bottomTaper = Math.sin(Math.min(1.0, u / 0.18) * (Math.PI * 0.5));
        const topTaper = Math.pow(Math.max(0.03, 1.0 - u * 0.88), 0.80);
        const halfW = Math.max(0.20, (baseWidth * 0.5) * bottomTaper * topTaper);
        const coreHalfW = halfW * 0.42;

        topEdge.push({ x: px + nx * halfW, y: py + ny * halfW });
        bottomEdge.push({ x: px - nx * halfW, y: py - ny * halfW });

        coreTopEdge.push({ x: px + nx * coreHalfW, y: py + ny * coreHalfW });
        coreBottomEdge.push({ x: px - nx * coreHalfW, y: py - ny * coreHalfW });
      }

      // 1) 외곽 리본: 밝은 노랑 -> 노랑 -> 윗부분 짙은 주황
      const grad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      grad.addColorStop(0.00, `rgba(255, 255, 140, ${0.95 * layerAlpha})`);
      grad.addColorStop(0.25, `rgba(255, 245, 90, ${0.85 * layerAlpha})`);
      grad.addColorStop(0.45, `rgba(255, 220, 30, ${0.75 * layerAlpha})`);
      grad.addColorStop(0.65, `rgba(255, 136, 0, ${0.65 * layerAlpha})`);
      grad.addColorStop(0.82, `rgba(255, 85, 0, ${0.45 * layerAlpha})`);
      grad.addColorStop(0.94, `rgba(249, 115, 22, ${0.25 * layerAlpha})`);
      grad.addColorStop(1.00, "rgba(234, 88, 12, 0.00)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(topEdge[0].x, topEdge[0].y);
      for (let j = 1; j < topEdge.length; j++) ctx.lineTo(topEdge[j].x, topEdge[j].y);
      for (let j = bottomEdge.length - 1; j >= 0; j--) ctx.lineTo(bottomEdge[j].x, bottomEdge[j].y);
      ctx.closePath();
      ctx.fill();

      // 2) 내부 중심 하이라이트 코어
      const coreGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      coreGrad.addColorStop(0.00, `rgba(255, 255, 220, ${0.95 * layerAlpha})`);
      coreGrad.addColorStop(0.30, `rgba(255, 255, 160, ${0.85 * layerAlpha})`);
      coreGrad.addColorStop(0.55, `rgba(255, 215, 64, ${0.70 * layerAlpha})`);
      coreGrad.addColorStop(0.75, `rgba(255, 136, 50, ${0.50 * layerAlpha})`);
      coreGrad.addColorStop(0.92, `rgba(255, 87, 34, ${0.25 * layerAlpha})`);
      coreGrad.addColorStop(1.00, "rgba(244, 81, 30, 0.00)");

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.moveTo(coreTopEdge[0].x, coreTopEdge[0].y);
      for (let j = 1; j < coreTopEdge.length; j++) ctx.lineTo(coreTopEdge[j].x, coreTopEdge[j].y);
      for (let j = coreBottomEdge.length - 1; j >= 0; j--) ctx.lineTo(coreBottomEdge[j].x, coreBottomEdge[j].y);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 기사회생 전용 초고품질 격투 대격돌 임팩트 (Reversal Colossal Impact Burst)
 * - 1. 초고휘도 순백/골든 방사형 섬광 코어 (Pure White & Golden Core)
 * - 2. 2중 동심원 고속 팽창 충격파 링 (Dual Expanding Shockwave Rings)
 * - 3. 10방향 만화풍 쐐기 크런치 스파이크 (Radial Crunch Wedge Spikes)
 * - 4. 대각선 교차 초고속 파열 빔 (Cross-Cutting Kinetic Beams)
 * - 5. 14방향 사방 비산 골든 스타버스트 & 화염 불티 (Flying Sparkles & Embers)
 */
function drawReversalStrikeImpact(
  ctx: any,
  tx: number,
  ty: number,
  progress: number,
  dir: number
) {
  const p = Math.max(0, Math.min(1.0, progress));
  const baseAlpha = Math.max(0, 1.0 - p * 1.15);
  if (baseAlpha <= 0.01) return;

  ctx.save();

  // 1. 순백 & 골든 중심 폭발 코어 (Central Core Flash)
  const coreR = 26 + p * 42;
  const coreGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, coreR);
  coreGrad.addColorStop(0.00, `rgba(255, 255, 255, ${0.98 * baseAlpha})`);
  coreGrad.addColorStop(0.25, `rgba(255, 245, 157, ${0.92 * baseAlpha})`);
  coreGrad.addColorStop(0.55, `rgba(255, 167, 38, ${0.65 * baseAlpha})`);
  coreGrad.addColorStop(0.85, `rgba(239, 68, 68, ${0.28 * baseAlpha})`);
  coreGrad.addColorStop(1.00, "rgba(220, 38, 38, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(tx, ty, coreR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 2중 충격파 링 (Dual Shockwave Donut Rings)
  const ring1R = 16 + p * 55;
  const ring1Thick = 13 * (1.0 - p * 0.45);
  const r1In = Math.max(0.1, ring1R - ring1Thick);
  const r1Out = ring1R + ring1Thick;

  const ring1Grad = ctx.createRadialGradient(tx, ty, r1In, tx, ty, r1Out);
  ring1Grad.addColorStop(0.0, "rgba(255, 214, 0, 0.0)");
  ring1Grad.addColorStop(0.35, `rgba(255, 255, 255, ${0.95 * baseAlpha})`);
  ring1Grad.addColorStop(0.70, `rgba(255, 179, 0, ${0.55 * baseAlpha})`);
  ring1Grad.addColorStop(1.0, "rgba(255, 87, 34, 0.0)");

  ctx.fillStyle = ring1Grad;
  ctx.beginPath();
  ctx.arc(tx, ty, r1Out, 0, Math.PI * 2);
  ctx.arc(tx, ty, r1In, 0, Math.PI * 2, true);
  ctx.fill();

  // 3. 10방향 방사형 쐐기 크런치 스파이크 (Radial Crunch Wedge Spikes)
  const numSpikes = 10;
  for (let i = 0; i < numSpikes; i++) {
    const angle = (i * Math.PI * 2) / numSpikes + 0.28 + p * 0.12;
    const isLong = i % 2 === 0;
    const rStart = 8 + p * 15;
    const rEnd = (isLong ? 48 : 34) + p * (isLong ? 58 : 40);
    const halfW = (isLong ? 4.4 : 3.2) * (1.0 - p * 0.4);

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const perpX = -sinA * halfW;
    const perpY = cosA * halfW;

    const x1 = tx + cosA * rStart;
    const y1 = ty + sinA * rStart;
    const x2 = tx + cosA * rEnd;
    const y2 = ty + sinA * rEnd;

    const spikeGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    spikeGrad.addColorStop(0.00, `rgba(255, 255, 255, ${0.98 * baseAlpha})`);
    spikeGrad.addColorStop(0.35, `rgba(255, 238, 88, ${0.85 * baseAlpha})`);
    spikeGrad.addColorStop(0.70, `rgba(255, 112, 67, ${0.45 * baseAlpha})`);
    spikeGrad.addColorStop(1.00, "rgba(230, 81, 0, 0.0)");

    ctx.fillStyle = spikeGrad;
    ctx.beginPath();
    ctx.moveTo(x1 + perpX, y1 + perpY);
    ctx.lineTo(x1 - perpX, y1 - perpY);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();
  }

  // 4. 대각 교차 초고속 파열 빔 (Cross Kinetic Slash Beams - 충돌 축 -28° 및 수직 62° 정렬)
  const beamAngles = [-0.50, Math.PI * 0.5 - 0.50];
  for (let b = 0; b < beamAngles.length; b++) {
    const bAngle = beamAngles[b];
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(bAngle);

    const bLen = (b === 0 ? 58 : 44) + p * 35;
    const bThick = (b === 0 ? 5.8 : 4.2) * (1.0 - p * 0.45);

    const beamGrad = ctx.createLinearGradient(-bLen, 0, bLen, 0);
    beamGrad.addColorStop(0.00, "rgba(255, 238, 88, 0.0)");
    beamGrad.addColorStop(0.25, `rgba(255, 167, 38, ${0.45 * baseAlpha})`);
    beamGrad.addColorStop(0.50, `rgba(255, 255, 255, ${0.98 * baseAlpha})`);
    beamGrad.addColorStop(0.75, `rgba(255, 167, 38, ${0.45 * baseAlpha})`);
    beamGrad.addColorStop(1.00, "rgba(255, 238, 88, 0.0)");

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-bLen, 0);
    ctx.lineTo(0, -bThick);
    ctx.lineTo(bLen, 0);
    ctx.lineTo(0, bThick);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 5. 🌟 [유저 지시]: 타격 이후 타격페이드아웃 프레임에서 점 파티클들 제거
  // 직격 충돌 1프레임(p < 0.25)에서만 순백 샤프 스타 4기 찰나 노출, 페이드아웃 프레임(p >= 0.25) 및 원형 점(dot) 파티클 일체 제거!
  if (p < 0.25) {
    const starAngles = [-0.65, 0.45, 2.15, -2.35];
    for (let s = 0; s < starAngles.length; s++) {
      const a = starAngles[s];
      const dist = 14 + p * 20;
      const sx = tx + Math.cos(a) * dist;
      const sy = ty + Math.sin(a) * dist * 0.85;
      const starR = 5.2 * (1.0 - p * 2.0);
      drawMiniRetroStar(ctx, sx, sy, starR, s % 2 === 0 ? "#FFFFFF" : "#FFEE58");
    }
  }

  ctx.restore();
}

/**
 * 시전자 쾌속 쇄도 시 후방으로 뿜어져 나오는 고속 추진 속도선 & 화염 잔상 (Dash Jet Streaks)
 */
function drawReversalDashAura(
  ctx: any,
  ax: number,
  ay: number,
  dir: number
) {
  ctx.save();
  ctx.lineCap = "round";

  // 시전자 등 뒤쪽(진행 반대 방향)으로 뻗는 날카로운 속도선 6가닥 (은은하고 투명한 잔상)
  // 아군 시전: 우상단(적)으로 쇄도 ➔ 속도선은 좌하단(-X, +Y)으로 분출
  // 적군 시전: 좌하단(아군)으로 쇄도 ➔ 속도선은 우상단(+X, -Y)으로 분출
  const dashStreaks = [
    { xo: -18, yo: -8, len: 42, w: 1.6, col: "rgba(255, 255, 255, 0.18)" },
    { xo: -25, yo: 2, len: 54, w: 1.8, col: "rgba(255, 238, 88, 0.15)" },
    { xo: -30, yo: 12, len: 44, w: 1.4, col: "rgba(255, 167, 38, 0.12)" },
    { xo: -16, yo: 18, len: 34, w: 1.2, col: "rgba(255, 112, 67, 0.10)" },
    { xo: -22, yo: -18, len: 30, w: 1.4, col: "rgba(255, 255, 255, 0.14)" },
    { xo: -35, yo: 6, len: 60, w: 1.8, col: "rgba(255, 238, 88, 0.13)" },
  ];

  for (const st of dashStreaks) {
    const sx = ax + st.xo * dir;
    const sy = ay + st.yo * dir;
    const ex = sx - st.len * dir * 1.15;
    const ey = sy + st.len * dir * 0.55;

    const grad = ctx.createLinearGradient(sx, sy, ex, ey);
    grad.addColorStop(0.0, st.col);
    grad.addColorStop(0.35, st.col);
    grad.addColorStop(1.0, "rgba(255, 112, 67, 0.0)");

    ctx.strokeStyle = grad;
    ctx.lineWidth = st.w;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 179: 기사회생 - 배후 레이어 이펙트 (Behind Effect)
 */
export function drawReversalBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (frame.hitProgress !== undefined) return;

  // 🌟 시전자 쾌속 돌진 시 배후 속도선
  if (frame.phaseId?.includes("strike-dash")) {
    const { attackerPos, isPlayer: isP } = drawCtx;
    const dir = isP ? 1 : -1;
    const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
    const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
    drawReversalDashAura(ctx, ax, ay, dir);
    return;
  }

  if (frame.showEffect === false && !frame.showBehindEffect) return;

  const returnFade = frame.fadeEffectOnCameraReturn
    ? Math.max(0, 1.0 - (frame.effectProgress ?? 0))
    : 1.0;
  if (returnFade <= 0.01) return;

  const { attackerPos, isPlayer: isP } = drawCtx;
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const baseAy = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  // 🌟 [유저 지시]: 붉은 동그라미가 바닥에 있는 회전과 잘 어울리게 위치 아래로 대폭 조정
  const orbY = baseAy + (isP ? 20 : 22);
  // 🌟 [유저 지시]: 시전 포켓몬 스프라이트의 바닥(플랫폼 지면 = attackerPos.y + 36)에 정확히 배치
  const groundY = baseAy + 36;
  const disp = frame.disperseProgress;

  // 1. [유저 지시]: 스프라이트 바닥에 배치된 3D 잔상 스피드라인 링 (배후 레이어: Z축 뒤)
  if (frame.showYellowAura) {
    drawReversalSpeedlineRing(ctx, ax, groundY, frame.orbAngle ?? 0, "behind", returnFade, disp);
  }

  // 2. 3D 회전 구체 시스템 (배후 레이어: 수평 궤도)
  if (frame.orbAngle !== undefined) {
    const orbCount = frame.orbCount ?? 1;
    drawReversalOrbSystem(ctx, ax, orbY, frame.orbAngle, orbCount, "behind", returnFade, disp);
  }
}

/**
 * 179: 기사회생 - 전면 레이어 메인 이펙트 (Front Main Effect)
 */
export function drawReversalEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 1. 화면 반투명 흰색 번쩍거림 오버레이
  const whiteAlpha = frame.whiteAlpha ?? 0;
  if (whiteAlpha > 0.005) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, Math.max(0, whiteAlpha))})`;
    ctx.fillRect(-6000, -6000, 14000, 14000);
    ctx.restore();
  }

  // 🌟 [유저 지시]: 클로즈 아웃 후 상대방 타격 렌더링 (초고품질 격투 대격돌 임팩트)
  if (frame.hitProgress !== undefined) {
    const { targetPos, isPlayer: isP } = drawCtx;
    const dir = isP ? 1 : -1;
    const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
    const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));
    drawReversalStrikeImpact(ctx, tx, ty, frame.hitProgress, dir);
    return;
  }

  if (frame.showEffect === false) return;

  const returnFade = frame.fadeEffectOnCameraReturn
    ? Math.max(0, 1.0 - (frame.effectProgress ?? 0))
    : 1.0;
  if (returnFade <= 0.01) return;

  const { attackerPos, isPlayer: isP } = drawCtx;
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const baseAy = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  // 🌟 [유저 지시]: 붉은 동그라미가 바닥에 있는 회전과 잘 어울리게 위치 아래로 대폭 조정
  const orbY = baseAy + (isP ? 20 : 22);
  // 🌟 [유저 지시]: 시전 포켓몬 스프라이트의 바닥(플랫폼 지면 = attackerPos.y + 36)에 정확히 배치
  const groundY = baseAy + 36;
  const disp = frame.disperseProgress;

  // 2. [유저 지시]: 스프라이트 바닥에 배치된 3D 잔상 스피드라인 링 (전면 레이어: Z축 앞)
  if (frame.showYellowAura) {
    drawReversalSpeedlineRing(ctx, ax, groundY, frame.orbAngle ?? 0, "front", returnFade, disp);
  }

  // 3. 3D 회전 구체 시스템 (전면 레이어: 수평 궤도)
  if (frame.orbAngle !== undefined) {
    const orbCount = frame.orbCount ?? 1;
    drawReversalOrbSystem(ctx, ax, orbY, frame.orbAngle, orbCount, "front", returnFade, disp);
  }
}

// ============================================================================
// 180: 원한 (Spite)
// ============================================================================

/**
 * 180: 원한 - 후면 배경 레이어 (Behind Effect) - 대상 효과 제거
 */
export function drawSpiteBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 유저 지시: 대상 포켓몬에 적용된 시각 효과 제거
}

/**
 * 180: 원한 - 전면 메인 이펙트 (Front Effect) - 대상 효과 제거
 */
export function drawSpiteEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 유저 지시: 대상 포켓몬에 적용된 시각 효과 제거 (스프라이트 자체의 흔들림 모션만 재생)
}

