// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 85) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 기술 제작 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { createCanvas } from "@napi-rs/canvas";
import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawFittedBattleSprite } from "../../common/spriteLoader.js";
import {
  drawMiniRetroStar,
  drawStarburstImpact,
  getCometPunchFistImg,
  getFocusPunchRedFistCanvas,
} from "../common/helpers.js";
import { drawFrontStraightPunchFistSvg } from "./move001_004.js";

// ============================================================================
// 👻🔥 261: 도깨비불 (Will-O-Wisp / おにび) - 불꽃 타입 변화 기술
//
// 위력: - / 명중: 85 / PP: 15 / 상대 100% 화상 (불꽃 타입 면역)
// 설명: 으스스하고 괴상한 불꽃을 쏘아 상대를 화상 상태로 만든다.
//
// [연출 기승전결 시퀀스]:
// 1. 기(起): 시전자 주변에 으스스한 3개의 푸른 영혼 도깨비불(Ghostly Cyan-Blue Wisps) 점화 및 부유
// 2. 승(承): 상대를 향해 물결치듯 유려한 사인파 궤적을 그리며 3개의 도깨비불이 쇄도 비행
// 3. 전(轉): 대상 포켓몬 둘레를 3D 입체 궤도로 휘감으며 나선 수렴 (Behind ↔ Front 교차)
// 4. 결(結): 대상 중심에서 도깨비불이 합쳐지며 강렬한 청색·주황 화염 대폭발 & 화상(Burn) 상태 부여
// ============================================================================

export const WILL_O_WISP_PALETTE = {
  white: "#FFFFFF",
  blackCore: "#000000",    // 칠흑의 검은 중심
  darkVoid: "#0d0517",     // 검은 중심 외곽 암흑
  deepViolet: "#4c1d95",   // 심연의 보랏빛 베이스
  richPurple: "#7e22ce",   // 일렁이는 보라색 화염
  brightPurple: "#a855f7", // 생생한 바이올렛 불꽃
  lightViolet: "#c084fc",  // 불꽃 하이라이트 림
  smokePurple: "#9333ea",  // 중심에서 뿜어지는 보라색 연기
  burstYellow: "#FEF08A",  // 피격 폭발 황금빛
  burstOrange: "#F97316",  // 피격 폭발 주황 화염
  burstRed: "#EF4444",     // 피격 폭발 진홍빛
  burstDarkRed: "#991B1B", // 피격 폭발 짙은 불꽃
};

/**
 * 성스러운불꽃(221) 기반 유기적 도깨비불 화염 덩어리(Billowing Flame Puff) 제어점 생성
 * - 위쪽(-Y)으로 타오르며 솟구치는 유선형 화염 볼륨
 * - 4~5개의 불규칙하고 역동적으로 넘실거리는 화염 돌기(Lobes)로 살아있는 불꽃 실루엣 구현
 */
function getWispBillowingPoints(
  baseR: number,
  seed: number,
  roll: number,
  stretchY: number = 1.40
): { x: number; y: number }[] {
  const SAMPLES = 18;
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < SAMPLES; i++) {
    const angle = (i / SAMPLES) * Math.PI * 2;
    const cosVal = Math.cos(angle);
    const sinVal = Math.sin(angle);

    // 위쪽(-Y)은 불꽃이 솟구치고 아래쪽(+Y)은 둥글게 볼륨을 유지
    const isUp = sinVal < 0;
    const flameLift = isUp ? (1.0 + Math.pow(Math.abs(sinVal), 1.25) * (stretchY - 1.0)) : 1.0;

    // 성스러운불꽃/용의분노 고증 다중 주파수 화염 요동 (4~5 로브)
    const bump = 1.0
      + Math.sin(angle * 4 + roll + seed) * 0.16
      + Math.cos(angle * 3 - roll * 0.85) * 0.11
      + Math.sin(angle * 2 + seed * 1.4) * 0.08;

    const r = baseR * bump;
    pts.push({
      x: cosVal * r,
      y: sinVal * r * flameLift,
    });
  }

  return pts;
}

/**
 * 성스러운불꽃식 부드러운 2차 베지어 곡선 외곽선 패스 트레이서
 */
function traceWispContour(ctx: any, pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 3) return;
  ctx.beginPath();
  const startMidX = (pts[0].x + pts[n - 1].x) * 0.5;
  const startMidY = (pts[0].y + pts[n - 1].y) * 0.5;
  ctx.moveTo(startMidX, startMidY);

  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const midX = (curr.x + next.x) * 0.5;
    const midY = (curr.y + next.y) * 0.5;
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
  }
  ctx.closePath();
}

/**
 * 도깨비불(Will-O-Wisp) 성스러운불꽃 기반 고품질 화염 구체 렌더링
 * - [유저 지정 연출]:
 *   1. [구체 z축 아래]: 중심으로부터 뿜어져 나와 멀리 뻗어나가지 못하고 페이드아웃하는 보라색 연기 (성스러운불꽃 스모크 플룸 고증)
 *   2. [외곽 및 바디]: 성스러운불꽃식 유기적 다엽형(Multi-Lobed) 일렁이는 보라색 화염
 *   3. [검은 중심]: 중앙 깊은 칠흑의 검은 구체/코어
 */
export function drawSpiritWispFlame(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  angle: number = 0,
  flutter: number = 0,
  alpha: number = 1.0,
  scale: number = 1.0,
  isHotOrange: boolean = false,
  animTime: number = 0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const r = radius;
  const p = WILL_O_WISP_PALETTE;
  const roll = flutter * 2.2;

  // --------------------------------------------------------------------------
  // [1. 구체 z축 아래]: 중심으로부터 뿜어내는 보라색 연기 (Volumetric Smoke Plumes)
  // - 성스러운불꽃식 방사형 스모크 플룸
  // - 구체보다 먼저(가장 아래 레이어) 렌더링
  // - 중심(0, 0)에서 뿜어져 나와 1.2r ~ 1.85r 이내에서 부드럽게 100% 페이드아웃
  // --------------------------------------------------------------------------
  const numPlumes = 8;
  for (let i = 0; i < numPlumes; i++) {
    const plumeAngle = (i / numPlumes) * Math.PI * 2 + roll * 0.35;
    // 중심에서부터의 거리: 멀리 가지 못함 (반경의 1.1배 ~ 1.8배 이내)
    const cycle = ((i * 0.23 + Math.abs(flutter) * 1.2) % 1.0);
    const distRatio = 1.05 + cycle * 0.75;
    const px = Math.cos(plumeAngle) * (r * distRatio);
    // 연기는 약간 위(-Y)로 떠오름
    const py = Math.sin(plumeAngle) * (r * distRatio * 0.8) - (cycle * r * 0.45);

    // 거리 및 수명에 따른 부드러운 소멸 (외곽으로 갈수록 지수 곡선 페이드아웃)
    const fade = Math.pow(Math.max(0.0, 1.0 - cycle), 1.6);
    const plumeAlpha = fade * 0.48;
    const plumeR = r * (0.35 + cycle * 0.50);

    if (plumeAlpha > 0.01) {
      const smokeGrad = ctx.createRadialGradient(px, py, plumeR * 0.08, px, py, plumeR);
      smokeGrad.addColorStop(0.0, `rgba(168, 85, 247, ${(plumeAlpha * 0.95).toFixed(3)})`);
      smokeGrad.addColorStop(0.35, `rgba(126, 34, 206, ${(plumeAlpha * 0.65).toFixed(3)})`);
      smokeGrad.addColorStop(0.70, `rgba(88, 28, 135, ${(plumeAlpha * 0.25).toFixed(3)})`);
      smokeGrad.addColorStop(1.0, "rgba(59, 7, 100, 0.0)");
      ctx.fillStyle = smokeGrad;
      ctx.beginPath();
      ctx.arc(px, py, plumeR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --------------------------------------------------------------------------
  // [2. 외곽 앰비언트 글로우]: 보라빛 은은한 화염 대기광
  // --------------------------------------------------------------------------
  const glowR = r * 2.5;
  const glowGrad = ctx.createRadialGradient(0, -r * 0.3, r * 0.2, 0, -r * 0.3, glowR);
  if (!isHotOrange) {
    glowGrad.addColorStop(0.0, "rgba(168, 85, 247, 0.55)");
    glowGrad.addColorStop(0.40, "rgba(126, 34, 206, 0.28)");
    glowGrad.addColorStop(0.75, "rgba(76, 29, 149, 0.10)");
    glowGrad.addColorStop(1.0, "rgba(40, 10, 80, 0.0)");
  } else {
    glowGrad.addColorStop(0.0, "rgba(249, 115, 22, 0.70)");
    glowGrad.addColorStop(0.40, "rgba(239, 68, 68, 0.35)");
    glowGrad.addColorStop(1.0, "rgba(153, 27, 27, 0.0)");
  }
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, -r * 0.3, glowR, 0, Math.PI * 2);
  ctx.fill();

  // --------------------------------------------------------------------------
  // [3. 성스러운불꽃식 외곽 화염 바디]: 일렁이는 다엽형 짙은 보라 불꽃 (Outer Flame)
  // - 외곽 경계면을 다단 그라데이션 및 소프트 블러로 흐리게 처리
  // --------------------------------------------------------------------------
  const outerPts = getWispBillowingPoints(r * 1.35, 2.5, roll, 1.45);
  ctx.save();
  const blurOuter = Math.max(1.8, r * 0.18);
  ctx.filter = `blur(${blurOuter.toFixed(1)}px)`;
  traceWispContour(ctx, outerPts);
  const maxOuterR = r * 1.65;
  const outerGrad = ctx.createRadialGradient(0, -r * 0.2, 0, 0, -r * 0.2, maxOuterR);
  if (!isHotOrange) {
    outerGrad.addColorStop(0.0, "rgba(126, 34, 206, 0.85)");
    outerGrad.addColorStop(0.35, "rgba(91, 33, 182, 0.68)");
    outerGrad.addColorStop(0.65, "rgba(76, 29, 149, 0.42)");
    outerGrad.addColorStop(0.85, "rgba(59, 7, 100, 0.16)");
    outerGrad.addColorStop(1.0, "rgba(40, 10, 80, 0.0)");
  } else {
    outerGrad.addColorStop(0.0, "rgba(239, 68, 68, 0.85)");
    outerGrad.addColorStop(0.50, "rgba(220, 38, 38, 0.60)");
    outerGrad.addColorStop(0.80, "rgba(153, 27, 27, 0.25)");
    outerGrad.addColorStop(1.0, "rgba(153, 27, 27, 0.0)");
  }
  ctx.fillStyle = outerGrad;
  ctx.fill();
  ctx.filter = "none";
  ctx.restore();

  // --------------------------------------------------------------------------
  // [4. 성스러운불꽃식 중간 화염 바디]: 선명하고 생생하게 일렁이는 보라 불꽃 (Mid Flame)
  // - 외곽 화염과의 경계면을 바이올렛-보라 다단 그라데이션 및 소프트 블러로 자연스럽게 블렌딩
  // --------------------------------------------------------------------------
  const midPts = getWispBillowingPoints(r * 1.05, 5.8, -roll * 1.15, 1.35);
  ctx.save();
  const blurMid = Math.max(1.5, r * 0.15);
  ctx.filter = `blur(${blurMid.toFixed(1)}px)`;
  traceWispContour(ctx, midPts);
  const maxMidR = r * 1.25;
  const midGrad = ctx.createRadialGradient(0, -r * 0.15, 0, 0, -r * 0.15, maxMidR);
  if (!isHotOrange) {
    midGrad.addColorStop(0.0, "rgba(168, 85, 247, 0.95)");
    midGrad.addColorStop(0.35, "rgba(147, 51, 234, 0.82)");
    midGrad.addColorStop(0.65, "rgba(126, 34, 206, 0.50)");
    midGrad.addColorStop(0.85, "rgba(91, 33, 182, 0.20)");
    midGrad.addColorStop(1.0, "rgba(76, 29, 149, 0.0)");
  } else {
    midGrad.addColorStop(0.0, "rgba(251, 146, 60, 0.95)");
    midGrad.addColorStop(0.40, "rgba(249, 115, 22, 0.80)");
    midGrad.addColorStop(0.70, "rgba(239, 68, 68, 0.45)");
    midGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");
  }
  ctx.fillStyle = midGrad;
  ctx.fill();
  ctx.filter = "none";
  ctx.restore();

  // --------------------------------------------------------------------------
  // [5. 안쪽 일렁이는 하이라이트 화염 림]: 빛나는 바이올렛 불꽃 혓바닥 (Inner Flame)
  // - 중간 화염과의 경계면을 연한 보라 그라데이션 및 소프트 블러로 흐리게 블렌딩
  // --------------------------------------------------------------------------
  const inPts = getWispBillowingPoints(r * 0.78, 9.2, roll * 1.4, 1.25);
  ctx.save();
  const blurInner = Math.max(1.2, r * 0.12);
  ctx.filter = `blur(${blurInner.toFixed(1)}px)`;
  traceWispContour(ctx, inPts);
  const inGrad = ctx.createRadialGradient(0, -r * 0.1, 0, 0, -r * 0.1, r * 0.95);
  if (!isHotOrange) {
    inGrad.addColorStop(0.0, "rgba(233, 213, 255, 0.95)");
    inGrad.addColorStop(0.30, "rgba(216, 180, 254, 0.85)");
    inGrad.addColorStop(0.60, "rgba(192, 132, 252, 0.55)");
    inGrad.addColorStop(0.85, "rgba(168, 85, 247, 0.22)");
    inGrad.addColorStop(1.0, "rgba(147, 51, 234, 0.0)");
  } else {
    inGrad.addColorStop(0.0, "rgba(254, 240, 138, 0.95)");
    inGrad.addColorStop(0.35, "rgba(251, 146, 60, 0.80)");
    inGrad.addColorStop(0.70, "rgba(249, 115, 22, 0.40)");
    inGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");
  }
  ctx.fillStyle = inGrad;
  ctx.fill();
  ctx.filter = "none";
  ctx.restore();

  // --------------------------------------------------------------------------
  // [6. 검은 중심]: 중앙 깊은 칠흑의 암흑 코어 (Deep Black Void Core)
  // - 불꽃 로브들이 이 검은 중심을 감싸며 일렁임
  // --------------------------------------------------------------------------
  const blackRadius = r * 0.52;
  const blackGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, blackRadius);
  blackGrad.addColorStop(0.0, "#000000"); // 100% 칠흑
  blackGrad.addColorStop(0.65, "#0b0416");
  blackGrad.addColorStop(1.0, isHotOrange ? "#450a0a" : "#2e1065");
  ctx.fillStyle = blackGrad;
  ctx.beginPath();
  ctx.arc(0, 0, blackRadius, 0, Math.PI * 2);
  ctx.fill();

  // 순수 칠흑 중심점
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(0, 0, blackRadius * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // 검은 중심 외곽 미세 바이올렛 림 광채
  if (!isHotOrange) {
    ctx.strokeStyle = "rgba(192, 132, 252, 0.70)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, 0, blackRadius * 0.95, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --------------------------------------------------------------------------
  // [7. 유기적으로 부유하는 반투명 점 파티클 (Floating Semi-Transparent Ember Sparks)]
  // - 중심과 불꽃 바디에서 피어올라 위쪽/외곽으로 살랑거리며 부유하는 반투명 점 파티클
  // - 단색 불투명이 아닌 rgba 반투명 적용
  // - animTime / timeSeed에 의해 실제로 위쪽으로 떠오르며 지속적으로 움직임
  // --------------------------------------------------------------------------
  const sparkCount = 6;
  const timeSeed = animTime > 0 ? animTime : (Math.abs(flutter) * 3.5);
  for (let sp = 0; sp < sparkCount; sp++) {
    // 0 ~ 1 사이로 지속적으로 위로 순환 (자연스러운 시간 경과 움직임)
    const spCycle = ((sp * (1.0 / sparkCount) + timeSeed * 0.75) % 1.0);

    // 파티클의 움직임: 아래쪽/중심부에서 생성되어 위로 솟구치며 좌우로 살랑거림
    const sway = Math.sin(spCycle * Math.PI * 2.5 + sp * 2.1);
    const spX = sway * (r * (0.32 + spCycle * 0.5));
    // -Y 방향(위쪽)으로 상승 (중심부 -r*0.2에서 상공 -r*1.85까지 이동)
    const spY = -r * (0.2 + spCycle * 1.65);

    // 크기: 생성 시 작고, 중간에 커졌다가 소멸 시 작아짐
    const sizeFactor = Math.sin(spCycle * Math.PI);
    const spSize = Math.max(1.0, r * 0.13 * (0.4 + sizeFactor * 0.8));

    // 반투명도: 생성/소멸 시 부드럽게 페이드, 최대 투명도 0.35 ~ 0.55 (반투명화)
    const spAlpha = Math.pow(sizeFactor, 1.2) * (isHotOrange ? 0.65 : 0.52);

    if (spAlpha > 0.03) {
      const spR = Math.max(1.8, spSize * 1.3);
      const spGrad = ctx.createRadialGradient(spX, spY, 0, spX, spY, spR);
      if (!isHotOrange) {
        if (sp % 2 === 0) {
          spGrad.addColorStop(0.0, `rgba(216, 180, 254, ${spAlpha.toFixed(3)})`);
          spGrad.addColorStop(0.40, `rgba(192, 132, 252, ${(spAlpha * 0.70).toFixed(3)})`);
          spGrad.addColorStop(1.0, "rgba(147, 51, 234, 0.0)");
        } else {
          spGrad.addColorStop(0.0, `rgba(243, 232, 255, ${spAlpha.toFixed(3)})`);
          spGrad.addColorStop(0.40, `rgba(233, 213, 255, ${(spAlpha * 0.75).toFixed(3)})`);
          spGrad.addColorStop(1.0, "rgba(168, 85, 247, 0.0)");
        }
      } else {
        if (sp % 2 === 0) {
          spGrad.addColorStop(0.0, `rgba(254, 240, 138, ${spAlpha.toFixed(3)})`);
          spGrad.addColorStop(0.40, `rgba(251, 146, 60, ${(spAlpha * 0.70).toFixed(3)})`);
          spGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");
        } else {
          spGrad.addColorStop(0.0, `rgba(255, 237, 213, ${spAlpha.toFixed(3)})`);
          spGrad.addColorStop(0.40, `rgba(249, 115, 22, ${(spAlpha * 0.70).toFixed(3)})`);
          spGrad.addColorStop(1.0, "rgba(185, 28, 28, 0.0)");
        }
      }
      ctx.beginPath();
      ctx.arc(spX, spY, spR, 0, Math.PI * 2);
      ctx.fillStyle = spGrad;
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 261: 도깨비불 후면(Behind) 렌더러
 * - 대상/시전자 뒤편(z < 0)으로 공전하는 도깨비불 궤도 렌더링
 * - 으스스한 암전 대기 오라
 */
export function drawWillOWispBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const isPlayer = drawCtx.isPlayer ?? true;
  const moveStep = frame.moveStep ?? 1;
  const isHit = drawCtx.isHit !== false;

  const targetPos = drawCtx.targetPos || (isPlayer ? { x: 380, y: 130 } : { x: 150, y: 280 });
  const attackerPos = drawCtx.attackerPos || (isPlayer ? { x: 150, y: 280 } : { x: 380, y: 130 });

  const casterX = attackerPos.x + (isPlayer ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const casterY = attackerPos.y + (isPlayer ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));

  const targetX = targetPos.x + (isPlayer ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const targetY = targetPos.y + (isPlayer ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  ctx.save();

  // 1. 암전 배경 오라 (Eerie Dimming Atmosphere) - 카메라 줌/팬 대응 전체 화면 커버
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0.005) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.65, Math.max(0, dimAlpha * 0.65));
    // 으스스한 푸른빛이 도는 흑청색 암전
    ctx.fillStyle = "#090d1a";
    ctx.fillRect(-6000, -6000, 14000, 14000);
    ctx.restore();
  }

  // 2. Step 1 (시전자 앞 점화 및 회전): 뒤편 공전 불꽃
  if (moveStep === 1) {
    const orbitProg = frame.wispOrbitProg ?? 0;
    const count = 3;
    const baseRadius = 14 * (frame.wispScale ?? 1.0);

    for (let i = 0; i < count; i++) {
      const angle = orbitProg * Math.PI * 2 + (i * (Math.PI * 2) / count);
      const cosVal = Math.cos(angle);
      const sinVal = Math.sin(angle);

      // z < 0 이면 뒤편(Behind)에 위치
      if (sinVal < 0) {
        const rx = 36 * (frame.wispScale ?? 1.0);
        const ry = 14 * (frame.wispScale ?? 1.0);
        const wx = casterX + (isPlayer ? 24 : -24) + cosVal * rx;
        const wy = casterY - 10 + sinVal * ry;
        const depthScale = 0.80 + (sinVal + 1) * 0.15;
        const depthAlpha = 0.65 + (sinVal + 1) * 0.18;
        const animTime = (frame.wispTime ?? 0) * 3.5 + i * 0.6;

        drawSpiritWispFlame(
          ctx,
          wx,
          wy,
          baseRadius * depthScale,
          0,
          Math.sin(angle * 2 + (frame.wispTime ?? 0) * 8),
          depthAlpha * (frame.wispAlpha ?? 1.0),
          1.0,
          false,
          animTime
        );
      }
    }
  }

  ctx.restore();
}

/**
 * 261: 도깨비불 전면(Front) 렌더러
 * - Step 1: 시전자 주변 앞쪽 도깨비불 점화 및 부유
 * - Step 2: 상대를 향해 쇄도하며 치면서 관통하여 지나감 (Strike & Pass Through)
 * - Step 3: 관통 후 대상 잔여 화상 불씨 안정 및 복귀
 */
export function drawWillOWispEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const isPlayer = drawCtx.isPlayer ?? true;
  const moveStep = frame.moveStep ?? 1;
  const isHit = drawCtx.isHit !== false;

  const targetPos = drawCtx.targetPos || (isPlayer ? { x: 380, y: 130 } : { x: 150, y: 280 });
  const attackerPos = drawCtx.attackerPos || (isPlayer ? { x: 150, y: 280 } : { x: 380, y: 130 });

  const casterX = attackerPos.x + (isPlayer ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const casterY = attackerPos.y + (isPlayer ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));

  const targetX = targetPos.x + (isPlayer ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const targetY = targetPos.y + (isPlayer ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  ctx.save();

  // ==========================================================================
  // [Step 1]: 시전자 앞 도깨비불 점화 및 부유 (Front Wisps)
  // ==========================================================================
  if (moveStep === 1) {
    const orbitProg = frame.wispOrbitProg ?? 0;
    const count = 3;
    const baseRadius = 14 * (frame.wispScale ?? 1.0);

    for (let i = 0; i < count; i++) {
      const angle = orbitProg * Math.PI * 2 + (i * (Math.PI * 2) / count);
      const cosVal = Math.cos(angle);
      const sinVal = Math.sin(angle);

      // z >= 0 이면 앞편(Front)에 위치
      if (sinVal >= 0) {
        const rx = 36 * (frame.wispScale ?? 1.0);
        const ry = 14 * (frame.wispScale ?? 1.0);
        const wx = casterX + (isPlayer ? 24 : -24) + cosVal * rx;
        const wy = casterY - 10 + sinVal * ry;
        const depthScale = 0.95 + sinVal * 0.15;
        const depthAlpha = 0.85 + sinVal * 0.15;
        const animTime = (frame.wispTime ?? 0) * 3.5 + i * 0.6;

        drawSpiritWispFlame(
          ctx,
          wx,
          wy,
          baseRadius * depthScale,
          0,
          Math.sin(angle * 2 + (frame.wispTime ?? 0) * 8),
          depthAlpha * (frame.wispAlpha ?? 1.0),
          1.0,
          false,
          animTime
        );
      }
    }
  }

  // ==========================================================================
  // [Step 2]: 상대를 향해 쇄도하며 치면서 관통하여 지나감 (Strike & Pass Through)
  // ==========================================================================
  if (moveStep === 2) {
    const flyProg = frame.wispFlyProg ?? 0;
    const count = 3;
    const baseRadius = 16;
    const p = WILL_O_WISP_PALETTE;

    // 출발점 -> 대상점
    const startX = casterX + (isPlayer ? 24 : -24);
    const startY = casterY - 10;
    const endX = isHit ? targetX : (targetX + (isPlayer ? 100 : -100));
    const endY = isHit ? targetY : (targetY - 55);

    const dirX = endX - startX;
    const dirY = endY - startY;
    const len = Math.hypot(dirX, dirY) || 1;
    const unitDirX = dirX / len;
    const unitDirY = dirY / len;
    // 진행 방향의 직교(법선) 벡터 (좌/우 확산용)
    const normX = -unitDirY;
    const normY = unitDirX;
    const flightAngle = Math.atan2(dirY, dirX) + Math.PI / 2;

    // 타격 전/후 3구 도깨비불의 궤적 계산 헬퍼
    const getWispPos = (progT: number, idx: number) => {
      const curX = startX + dirX * progT;
      const curY = startY + dirY * progT;

      // 비행 중 유기적 사인파 흔들림
      const waveFreq = 3.5;
      const waveAmp = 12 * Math.sin(Math.min(1.0, progT) * Math.PI);
      const waveY = Math.sin(progT * Math.PI * waveFreq + idx * 2.1) * waveAmp;
      const waveX = Math.cos(progT * Math.PI * waveFreq + idx * 2.1) * (waveAmp * 0.35);

      // ★ 타격 후(progT > 0.85) 부채꼴로 확 퍼지는 산란(Scatter) 오프셋
      const postHit = isHit ? Math.max(0, progT - 0.85) : 0;
      const spreadDir = idx === 0 ? -1.0 : idx === 2 ? 1.0 : 0.0;
      const spreadDist = spreadDir * (Math.pow(postHit, 1.15) * 95);
      const extraLift = idx === 1 ? -postHit * 22 : (idx === 0 ? -postHit * 10 : postHit * 10);

      return {
        x: curX + waveX + normX * spreadDist,
        y: curY + waveY + normY * spreadDist + extraLift,
        spreadDir,
        postHit,
      };
    };

    // 1. 도깨비불 3구의 관통 & 타격 후 확산 비행
    for (let i = 0; i < count; i++) {
      // 3구 불꽃의 편대 시차
      const offsetT = (i - 1) * 0.08;
      const t = flyProg + offsetT;
      if (t < 0.05 || t > 1.65) continue;

      const pos = getWispPos(t, i);
      const wx = pos.x;
      const wy = pos.y;

      // 관통 후 부드러운 소멸 (t > 1.05 이면 페이드아웃)
      let alpha = 1.0;
      if (t > 1.05) {
        alpha = Math.max(0, 1.0 - (t - 1.05) / 0.55);
      }

      // 대상 통과 후 산란하면서 점차 자연스럽게 축소 및 소멸
      let sizeScale = 1.0;
      if (pos.postHit > 0) {
        sizeScale = Math.max(0.45, 1.0 - pos.postHit * 0.70);
      }

      // 퍼지는 방향에 맞춘 각도 틸트
      const tiltAngle = flightAngle * 0.35 + (pos.spreadDir * pos.postHit * 0.55);

      // 꼬리 유령 잔상 (외곽 투명 그라데이션 적용)
      const trailAlpha = 0.35 * alpha * Math.sin(Math.min(1.0, t) * Math.PI);
      if (trailAlpha > 0.04) {
        for (let tr = 1; tr <= 3; tr++) {
          const trailT = t - tr * 0.04;
          if (trailT <= 0) continue;
          const trPos = getWispPos(trailT, i);
          const trR = baseRadius * (0.6 - tr * 0.15) * sizeScale;
          const trA = trailAlpha * (1.0 - tr * 0.25);
          if (trA > 0.02) {
            const trGrad = ctx.createRadialGradient(trPos.x, trPos.y, 0, trPos.x, trPos.y, trR);
            trGrad.addColorStop(0.0, `rgba(192, 132, 252, ${(trA * 0.9).toFixed(3)})`);
            trGrad.addColorStop(0.45, `rgba(168, 85, 247, ${(trA * 0.5).toFixed(3)})`);
            trGrad.addColorStop(1.0, "rgba(126, 34, 206, 0.0)");
            ctx.beginPath();
            ctx.arc(trPos.x, trPos.y, trR, 0, Math.PI * 2);
            ctx.fillStyle = trGrad;
            ctx.fill();
          }
        }
      }

      const animTime = 1.5 + t * 4.5 + i * 0.7;

      drawSpiritWispFlame(
        ctx,
        wx,
        wy,
        baseRadius * sizeScale,
        tiltAngle,
        Math.sin(t * 16 + i),
        alpha,
        1.0,
        false, // 타격 이펙트 제거: 일관된 신비로운 보라색 화염 유지
        animTime
      );
    }
  }

  // ==========================================================================
  // [Step 3]: 대상 잔여 화상 불씨 안정 & 피날레 (Lingering Burn Embers)
  // ==========================================================================
  if (moveStep === 3 && isHit) {
    const fadeProg = frame.wispFadeProg ?? 0;
    const fadeAlpha = Math.max(0, 1.0 - fadeProg);

    if (fadeAlpha > 0.02) {
      ctx.save();
      ctx.translate(targetX, targetY);

      // 대상 몸 주변에 피어오르는 보라/주황 잔여 화상 불씨 (외곽선 투명 그라데이션)
      const emberCount = 6;
      for (let em = 0; em < emberCount; em++) {
        const emProg = (fadeProg + em * 0.16) % 1.0;
        const emX = Math.sin(em * 2.8 + fadeProg * 5) * (20 * emProg);
        const emY = -8 - emProg * 40;
        const emR = 1.8 + emProg * 2.2;
        const emA = Math.sin(emProg * Math.PI) * fadeAlpha * 0.75;

        if (emA > 0.02) {
          const emGrad = ctx.createRadialGradient(emX, emY, 0, emX, emY, emR);
          if (em % 2 === 0) {
            emGrad.addColorStop(0.0, `rgba(216, 180, 254, ${emA.toFixed(3)})`);
            emGrad.addColorStop(0.40, `rgba(168, 85, 247, ${(emA * 0.65).toFixed(3)})`);
            emGrad.addColorStop(1.0, "rgba(126, 34, 206, 0.0)");
          } else {
            emGrad.addColorStop(0.0, `rgba(254, 240, 138, ${emA.toFixed(3)})`);
            emGrad.addColorStop(0.40, `rgba(249, 115, 22, ${(emA * 0.70).toFixed(3)})`);
            emGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");
          }
          ctx.beginPath();
          ctx.arc(emX, emY, emR, 0, Math.PI * 2);
          ctx.fillStyle = emGrad;
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  ctx.restore();
}

// ============================================================================
// 🎁💜 262: 추억의선물 (Memento / おきみやげ) - 악 타입 변화 기술
//
// 위력: - / 명중: 100 / PP: 10 / 상대 공격·특수공격 2랭크 하락 (-2) & 시전자 기절
// 설명: 자신은 기절하게 되지만 그 대신 상대의 공격과 특수공격을 크게 떨어뜨린다.
//
// [유저 지정 연출]:
// 1. 시전 포켓몬에게서 거대한 타원형 보라 색깔 반투명한, 외곽은 투명한 무언가가 발사돼. 위로, 카메라 위로.
// 2. 시전 포켓몬의 포켓몬 스프라이트 형태의 게 위로 올라가.
// 3. 그다음에 적 포켓몬 위에서 적 포켓몬 스프라이트 형태의 보라 색깔 반투명 무언가가 적 포켓몬 스프라이트 안으로 들어가. 서서히.
// ============================================================================

export const MEMENTO_PALETTE = {
  coreWhite: "#FFFFFF",
  brightViolet: "#E9D5FF",
  lightPurple: "#C084FC",
  vividPurple: "#A855F7",
  deepPurple: "#7E22CE",
  darkViolet: "#581C87",
  shadowVoid: "#2E1065",
  deepVoidBlack: "#0C051A",
};

/**
 * [유저 요청 완벽 고증]:
 * 거대한 타원형 보라 색깔 반투명한, 외곽은 투명한 무언가
 * - 타원형(Oval / Ellipse) 형상: 수직으로 길쭉한 비행 형태 (가로 대비 세로 1.8~2.5배)
 * - 중심부: 생생하고 신비로운 보랏빛 반투명 코어
 * - 외곽: 100% 투명 그라데이션으로 자연스럽게 공간에 녹아듦
 */
export function drawGiantPurpleOval(
  ctx: any,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  alpha: number = 1.0,
  stretchY: number = 1.0
) {
  if (alpha <= 0.01 || radiusX <= 1 || radiusY <= 1) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, (ctx.globalAlpha ?? 1.0) * alpha));
  ctx.translate(x, y);

  const effRx = radiusX;
  const effRy = radiusY * stretchY;

  // 메인 거대 보라빛 반투명 타원체 (글로우 레이어 제거 - 순수 단일 타원형)
  ctx.scale(effRx, effRy);
  const mainGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.0);
  mainGrad.addColorStop(0.0, "rgba(168, 85, 247, 0.70)"); // 중심: 보라색 반투명
  mainGrad.addColorStop(0.55, "rgba(126, 34, 206, 0.50)"); // 중간: 보라색 반투명
  mainGrad.addColorStop(0.85, "rgba(88, 28, 135, 0.20)");  // 외곽 안쪽: 보라색
  mainGrad.addColorStop(1.0, "rgba(88, 28, 135, 0.0)");    // 외곽: 100% 완전 투명!
  ctx.fillStyle = mainGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1.0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

interface MementoSilhouetteCache {
  canvas: any;
  ctx: any;
  spriteRef: any;
  size: number;
}
const mementoSilhouetteMap = new Map<string, MementoSilhouetteCache>();

function getPurpleSilhouetteCanvas(sprite: any, size: number, cacheKey: string) {
  const s = Math.max(Math.ceil(size * 1.6), 360);
  let entry = mementoSilhouetteMap.get(cacheKey);
  if (!entry || entry.canvas.width !== s || entry.canvas.height !== s) {
    const canvas = createCanvas(s, s);
    const ctx = canvas.getContext("2d");
    entry = { canvas, ctx, spriteRef: null, size: 0 };
    mementoSilhouetteMap.set(cacheKey, entry);
  }

  if (entry.spriteRef !== sprite || entry.size !== size) {
    entry.ctx.clearRect(0, 0, s, s);
    entry.ctx.save();

    // 1. Draw fitted battle sprite at bottom center (s / 2, s - 20)
    drawFittedBattleSprite(entry.ctx, sprite, s / 2, s - 20, size);

    // 2. Colorize with mystical purple gradient
    entry.ctx.globalCompositeOperation = "source-in";
    const grad = entry.ctx.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0.0, "#E9D5FF"); // 상단 연보라
    grad.addColorStop(0.30, "#C084FC"); // 밝은 보라
    grad.addColorStop(0.65, "#9333EA"); // 생생한 바이올렛
    grad.addColorStop(1.0, "#581C87"); // 하단 심연 보라
    entry.ctx.fillStyle = grad;
    entry.ctx.fillRect(0, 0, s, s);

    entry.ctx.restore();
    entry.spriteRef = sprite;
    entry.size = size;
  }

  return { canvas: entry.canvas, cx: s / 2, cy: s - 20 };
}

/**
 * 포켓몬 스프라이트 형태의 보라빛 반투명 실루엣 렌더링
 */
export function drawPurpleSpriteSilhouette(
  ctx: any,
  sprite: any,
  x: number,
  groundY: number,
  size: number,
  alpha: number = 1.0,
  cacheKey: string = "memento_soul",
  scaleX: number = 1.0,
  scaleY: number = 1.0
) {
  if (!sprite || alpha <= 0.02) return;
  const { canvas, cx, cy } = getPurpleSilhouetteCanvas(sprite, size, cacheKey);

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, (ctx.globalAlpha ?? 1.0) * alpha));
  ctx.translate(x, groundY);
  if (scaleX !== 1.0 || scaleY !== 1.0) {
    ctx.scale(scaleX, scaleY);
  }

  // 순수 반투명 실루엣 (글로우 효과 제거)
  ctx.drawImage(canvas, -cx, -cy);

  ctx.restore();
}

/**
 * 262: 추억의선물 후면(Behind) 렌더러
 * - 심연의 보라빛 암전 대기광
 * - 시전자 발밑 영혼 에너지 지면 리플 링 및 적 포켓몬 발밑 저주 융해 웅덩이
 */
export function drawMementoBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const isPlayer = drawCtx.isPlayer ?? true;
  const moveStep = frame.moveStep ?? 1;

  const targetPos = drawCtx.targetPos || (isPlayer ? { x: 380, y: 130 } : { x: 150, y: 280 });
  const attackerPos = drawCtx.attackerPos || (isPlayer ? { x: 150, y: 280 } : { x: 380, y: 130 });

  const casterX = attackerPos.x + (isPlayer ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const casterY = attackerPos.y + (isPlayer ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));

  const targetX = targetPos.x + (isPlayer ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const targetY = targetPos.y + (isPlayer ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  ctx.save();

  // 1. 암전 배경 오라 (Eerie Dimming Atmosphere) - 카메라 줌/팬 대응 전체 화면 커버
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0.005) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.65, Math.max(0, dimAlpha * 0.70));
    // 으스스한 심연의 흑자색 암전
    ctx.fillStyle = MEMENTO_PALETTE.deepVoidBlack;
    ctx.fillRect(-6000, -6000, 14000, 14000);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 262: 추억의선물 전면(Front) 렌더러
 * - Step 1: 시전자에게서 거대한 타원형 보라 색깔 반투명한(외곽 투명) 오라 발사 & 시전자 스프라이트 형태 상공(카메라 위) 쇄도
 * - Step 2: 적 포켓몬 위에서 적 포켓몬 스프라이트 형태의 보라 색깔 반투명체가 적 포켓몬 스프라이트 안으로 '서서히' 들어감
 * - Step 3: 적 포켓몬 체내 주술 안정 & 공격/특공 2랭크 하락 디버프 각인
 */
export function drawMementoEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const isPlayer = drawCtx.isPlayer ?? true;
  const moveStep = frame.moveStep ?? 1;
  const isHit = drawCtx.isHit !== false;

  const pm = drawCtx.pm || { x: 150, y: 280, size: 120 };
  const em = drawCtx.em || { x: 380, y: 130, size: 120 };

  const casterInfo = isPlayer ? pm : em;
  const targetInfo = isPlayer ? em : pm;

  const casterSprite = isPlayer ? drawCtx.playerSprite : drawCtx.enemySprite;
  const targetSprite = isPlayer ? drawCtx.enemySprite : drawCtx.playerSprite;

  const casterOffset = isPlayer ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
  const targetOffset = isPlayer ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });

  const casterX = casterInfo.x + casterOffset.x;
  const casterY = casterInfo.y + casterOffset.y;

  const targetX = targetInfo.x + targetOffset.x;
  const targetY = targetInfo.y + targetOffset.y;

  ctx.save();

  // ==========================================================================
  // [Step 1]: 시전 포켓몬의 포켓몬 스프라이트 형태의 게 위로, 카메라 위로 올라감
  //           (보라색 구체 및 글로우 제거 - 순수 보라빛 반투명 실루엣만 쇄도)
  // ==========================================================================
  if (moveStep === 1) {
    const ascendProg = frame.casterAscendProg ?? 0;

    // 시전 포켓몬의 포켓몬 스프라이트 형태의 게 위로 올라감
    // - Y 오프셋: 상공으로 급상승 (ascendProg 에 따라 Y = casterY 에서 카메라 밖 -Y 로 솟구침)
    const soulGroundY = casterY - (ascendProg * 380);
    const soulAlpha = Math.max(0, Math.min(0.85, (frame.soulAlpha ?? 0.80) * (1.1 - ascendProg * 0.45)));

    if (casterSprite && soulAlpha > 0.02) {
      // 상승 궤적에 따른 잔상 (Trailing Echoes)
      if (ascendProg > 0.15) {
        drawPurpleSpriteSilhouette(
          ctx,
          casterSprite,
          casterX,
          soulGroundY + 36,
          casterInfo.size,
          soulAlpha * 0.40,
          "caster_soul_trail1",
          0.97,
          1.03
        );
      }
      if (ascendProg > 0.35) {
        drawPurpleSpriteSilhouette(
          ctx,
          casterSprite,
          casterX,
          soulGroundY + 75,
          casterInfo.size,
          soulAlpha * 0.20,
          "caster_soul_trail2",
          0.94,
          1.06
        );
      }

      // 메인 시전 포켓몬 보라빛 반투명 영혼 스프라이트
      drawPurpleSpriteSilhouette(
        ctx,
        casterSprite,
        casterX,
        soulGroundY,
        casterInfo.size,
        soulAlpha,
        "caster_soul",
        1.0,
        1.0 + (ascendProg * 0.12) // 살짝 위로 뻗어나가는 스트레치감
      );
    }
  }

  // ==========================================================================
  // [Step 2]: 적 포켓몬 위에서 적 포켓몬 스프라이트 형태의 보라 색깔 반투명 무언가가
  //           적 포켓몬 스프라이트 안으로 '서서히' 들어감
  // ==========================================================================
  if (moveStep === 2) {
    const descendProg = frame.targetDescendProg ?? 0;
    const startOffsetY = -150; // 적 포켓몬 상공 높이에서 시작

    // 빗맞았을 경우(isHit === false): 영혼체가 적 포켓몬을 빗겨가며 흩어짐
    const curOffsetY = isHit
      ? (startOffsetY * (1.0 - Math.min(1.0, descendProg)))
      : (startOffsetY * (1.0 - descendProg) - descendProg * 30);
    const curX = isHit
      ? targetX
      : (targetX + (isPlayer ? 70 : -70) * descendProg);

    const soulGroundY = targetY + curOffsetY;
    const soulAlpha = (frame.targetSoulAlpha ?? 0.85) * (isHit ? 1.0 : Math.max(0, 1.0 - descendProg));

    // 1. 적 포켓몬 스프라이트 형태의 보라 색깔 반투명 무언가
    if (targetSprite && soulAlpha > 0.02) {
      // 상공에서 하강할 때 뒤따르는 부드러운 유선형 잔상
      if (descendProg < 0.90) {
        drawPurpleSpriteSilhouette(
          ctx,
          targetSprite,
          curX,
          soulGroundY - 22,
          targetInfo.size,
          soulAlpha * 0.35,
          "target_soul_trail",
          0.98,
          0.98
        );
      }

      // 메인 하강 적 포켓몬 스프라이트 형태
      drawPurpleSpriteSilhouette(
        ctx,
        targetSprite,
        curX,
        soulGroundY,
        targetInfo.size,
        soulAlpha,
        "target_soul",
        1.0,
        1.0
      );
    }

    // 2. 적 포켓몬 스프라이트 안으로 들어갈 때(descendProg > 0.70) 발생하는 나선형 입자 침투
    if (isHit && descendProg >= 0.70) {
      const enterRatio = (descendProg - 0.70) / 0.30; // 0.0 ~ 1.0
      const pulseAlpha = Math.sin(enterRatio * Math.PI) * 0.65;

      if (pulseAlpha > 0.02) {
        ctx.save();
        ctx.translate(targetX, targetY - (targetInfo.size * 0.45));

        // 체내로 빨려 들어가는 나선형 보라 스파크 입자 (글로우 림 없음)
        const numSparks = 6;
        for (let sp = 0; sp < numSparks; sp++) {
          const spAngle = (sp / numSparks) * Math.PI * 2 + enterRatio * 4;
          const spDist = (1.0 - enterRatio) * (targetInfo.size * 0.55);
          const spX = Math.cos(spAngle) * spDist;
          const spY = Math.sin(spAngle) * (spDist * 0.7);
          const spR = Math.max(1.2, 2.2 * (1.0 - enterRatio));

          ctx.fillStyle = `rgba(168, 85, 247, ${(pulseAlpha * 0.80).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(spX, spY, spR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }
  }

  // ==========================================================================
  // [Step 3]: 저주 각인 안정화 & 잔여 보라빛 기운 소산
  // ==========================================================================
  if (moveStep === 3 && isHit) {
    const fadeProg = frame.curseFadeProg ?? 0;
    const fadeAlpha = Math.max(0, 1.0 - fadeProg);

    if (fadeAlpha > 0.02) {
      ctx.save();
      ctx.translate(targetX, targetY - (targetInfo.size * 0.4));

      // 몸에서 잔잔하게 피어오르는 보라빛 저주 연무 입자
      const numParticles = 6;
      for (let p = 0; p < numParticles; p++) {
        const pProg = (fadeProg + p * 0.17) % 1.0;
        const px = Math.sin(p * 2.5 + fadeProg * 6) * (targetInfo.size * 0.35);
        const py = -pProg * (targetInfo.size * 0.65);
        const pr = Math.max(1.0, 2.2 * (1.0 - pProg));
        const pa = Math.sin(pProg * Math.PI) * fadeAlpha * 0.55;

        if (pa > 0.02) {
          const partGrad = ctx.createRadialGradient(px, py, 0, px, py, pr * 1.5);
          partGrad.addColorStop(0.0, `rgba(216, 180, 254, ${pa.toFixed(3)})`);
          partGrad.addColorStop(0.5, `rgba(168, 85, 247, ${(pa * 0.6).toFixed(3)})`);
          partGrad.addColorStop(1.0, "rgba(126, 34, 206, 0.0)");
          ctx.fillStyle = partGrad;
          ctx.beginPath();
          ctx.arc(px, py, pr * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  ctx.restore();
}

// ============================================================================
// 😤💦💥 263: 객기 (Facade / からげんき) - 노말 타입 물리 기술
//
// 위력: 70 (독·맹독·마비·화상 상태 시 140으로 2배 증가 & 화상 물리 공격력 반감 페널티 무시)
// 명중: 100 / PP: 20
// 설명: 자신이 독, 마비, 화상 상태일 때 날리면 기술의 위력이 2배가 된다.
//
// [유저 지정 연출]:
// 1. 아래로납작 세로로 길어졌다를 반복하고 (포켓몬 본체가 고통/투지를 불태우며 스쿼시&스트레치 반복)
// 2. 몸통박치기 이펙트 (전방 고속 쇄도 및 강력한 정면 격돌 몸통박치기)
// 3. (이때 땀방울이 사방으로 튐) (충돌 순간 사방 360도로 맹렬히 튀어 나가는 물방울/땀방울 파티클)
// ============================================================================

/**
 * 날카로운 만화풍 충돌 섬광 스타버스트 💥 (Sharp Comic Impact Starburst)
 */
function drawFacadeImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number = 8,
  fillColor: string = "#FFFFFF",
  strokeColor: string = "#FEF08A",
  lineWidth: number = 2.4,
  rotation: number = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (rotation !== 0) ctx.rotate(rotation);

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;

  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  if (strokeColor && lineWidth > 0) ctx.stroke();
  ctx.restore();
}

/**
 * 💧 땀방울 (Sweat Droplet) 렌더러
 * - [유저 지정 연출]:
 *   1. 형태: 타원형 (Ellipse, 눈물방울 X)
 *   2. 내부/중간: 완전 투명 (Transparent Center)
 *   3. 외곽: 선명한 푸른빛 테두리 & 그라디언트 림 (Blue Outer Border)
 */
export function drawSweatDroplet(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  angle: number,
  elongation: number = 1.35,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const rx = radius * elongation;
  const ry = radius;

  // 1. [내각 글로우 & 투명 중심]: 타원 안쪽 방향으로만 은은하게 스며드는 투명 그라데이션
  // ctx.scale(rx, ry)를 통해 방사형 그라데이션을 타원 종횡비에 100% 동심원으로 맞춤 (외곽 번짐 전혀 없음)
  ctx.save();
  ctx.scale(rx, ry);

  const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.0);
  innerGrad.addColorStop(0.0, "rgba(56, 189, 248, 0.0)");                       // 중심부 완전 투명 (0%)
  innerGrad.addColorStop(0.45, "rgba(56, 189, 248, 0.0)");                      // 45% 반경까지 완전 투명 유지
  innerGrad.addColorStop(0.70, `rgba(56, 189, 248, ${(alpha * 0.32).toFixed(3)})`); // 안쪽 방향 부드러운 하늘빛 내각 글로우
  innerGrad.addColorStop(0.88, `rgba(14, 165, 233, ${(alpha * 0.68).toFixed(3)})`); // 외곽 직전 선명한 청색 림
  innerGrad.addColorStop(1.0, `rgba(2, 132, 199, ${(alpha * 0.90).toFixed(3)})`);   // 최외곽 테두리 딥블루

  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore(); // scale 복원

  // 2. [외곽선]: 바깥쪽 번짐 없이 안쪽으로만 닫히는 단정하고 선명한 타원형 외곽선
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(14, 165, 233, ${(alpha * 0.95).toFixed(3)})`;
  ctx.lineWidth = Math.max(1.1, radius * 0.30);
  ctx.stroke();

  // 최외곽 미세 에지 림 (윤곽을 정갈하게 잡아줌)
  ctx.strokeStyle = `rgba(2, 132, 199, ${(alpha * 0.85).toFixed(3)})`;
  ctx.lineWidth = Math.max(0.6, radius * 0.15);
  ctx.stroke();

  // 3. [하이라이트 점 하나만]: 땀방울 상단/내측에 맺힌 단 하나의 반짝이는 순백 하이라이트 점
  const hx = -rx * 0.25;
  const hy = -ry * 0.38;
  const hr = Math.max(0.70, radius * 0.24);
  ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.95).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 3D 포물선 탄도학 땀방울 파라미터 정의
 * - 시전 포켓몬을 중심(Center)에 두고 사방으로 방사
 * - [방향 불규칙 & 순서 불규칙]:
 *   1. 각도(angle), 속도(speed), 포물선 고도(vy)를 비대칭/불규칙하게 구성
 *   2. 각 땀방울마다 발사 딜레이(tDelay)를 달리하여 불규칙한 시간 차를 두고 순차 비산
 * - Behind 레이어: Vz < 0 (시전자 등 뒤로 포물선 궤적 비산, 3개)
 * - Front 레이어: Vz >= 0 (시전자 앞/하단으로 포물선 궤적 비산, 3개)
 */
const SWEAT_DROPLETS_3D = [
  // Behind Layer (Vz < 0: 상공 및 뒤쪽 방향으로 포물선 비산, 3개)
  { angle: -2.60, speed: 122, vy: 82,  radius: 2.5, elong: 1.35, tDelay: 0.00 }, // 1순위: 좌상단 후방으로 빠르게 낮게 비산
  { angle: -1.75, speed:  82, vy: 116, radius: 2.3, elong: 1.28, tDelay: 0.14 }, // 5순위: 상공 직상방으로 높고 늦게 솟구침
  { angle: -0.80, speed: 108, vy: 74,  radius: 2.6, elong: 1.32, tDelay: 0.05 }, // 3순위: 우상단 후방으로 중간 타이밍 비산

  // Front Layer (Vz >= 0: 정면 및 앞/하단 방향으로 포물선 비산, 3개)
  { angle:  0.40, speed: 130, vy: 96,  radius: 2.7, elong: 1.35, tDelay: 0.03 }, // 2순위: 우하단 전방으로 맹렬하게 튀어나감
  { angle:  1.95, speed:  78, vy: 112, radius: 2.4, elong: 1.30, tDelay: 0.18 }, // 6순위: 하단 전방으로 늦게 높이 솟으며 착지
  { angle:  2.85, speed: 112, vy: 86,  radius: 2.6, elong: 1.32, tDelay: 0.09 }, // 4순위: 좌하단 전방으로 중간 템포 비산
];

/**
 * 3D 포물선 궤적 땀방울 배치 렌더러
 * - isBehindLayer: true이면 시전자 뒤쪽(Vz < 0) 땀방울만 렌더링, false이면 시전자 앞쪽(Vz >= 0) 땀방울만 렌더링
 * - 중심에는 시전 포켓몬이 위치(중심 좌표: ax, ay)
 * - 3D 타원형, 중간 투명, 외곽 푸른빛, 포물선 탄도학 궤적 적용
 * - 방향 및 발사 순서가 불규칙적으로 전개
 */
function draw3DParabolicSweatWaves(
  ctx: any,
  ax: number,
  ay: number,
  t: number,
  intensityScale: number = 1.0,
  isBehindLayer: boolean = false,
  isPlayer: boolean = true
) {
  if (t <= 0 || t > 1.10) return;

  const g = 145; // 중력 가속도

  for (let i = 0; i < SWEAT_DROPLETS_3D.length; i++) {
    const drop = SWEAT_DROPLETS_3D[i];
    const isBack = Math.sin(drop.angle) < 0;

    // Behind 레이어와 Front 레이어 분리 (시전 포켓몬을 중심에 두고 Z축 분할)
    if (isBehindLayer !== isBack) continue;

    // 🌟 [순서도 불규칙하게]: 각 땀방울마다 개별 딜레이(tDelay) 적용
    const tDelay = drop.tDelay ?? 0;
    if (t < tDelay) continue; // 아직 생성되지 않은 땀방울은 건너뜀

    // 0 ~ 1 사이로 정규화된 땀방울 개별 비행 시간
    const curT = Math.min(1.05, (t - tDelay) / (1.0 - tDelay * 0.75));
    if (curT <= 0) continue;

    const angle = isPlayer ? drop.angle : (Math.PI - drop.angle);
    const speed = drop.speed * intensityScale;
    const vy0 = drop.vy * intensityScale;

    // 1. 수평 (X, Z) 지면 이동 (Z축은 0.45 원근 투영)
    const dx = Math.cos(angle) * (speed * curT);
    const dz = Math.sin(angle) * (speed * 0.45 * curT);

    // 2. 수직 포물선 (Parabolic Height Arc: h(t) = v0*t - 0.5*g*t^2)
    const h = vy0 * curT - 0.5 * g * curT * curT;

    // 스크린 좌표 (Y축은 위쪽이 음수이므로 -h)
    const screenX = ax + dx;
    const screenY = ay + dz - h;

    // 3. 포물선 접선 속도 벡터 (회전 각도 계산: 궤적 진행 방향으로 타원 정렬)
    const vx = Math.cos(angle) * speed;
    const vyScreen = Math.sin(angle) * (speed * 0.45) - (vy0 - g * curT);
    const tangentAngle = Math.atan2(vyScreen, vx);

    // 4. 3D 원근 스케일 (앞쪽은 살짝 커지고, 뒤쪽은 살짝 작아짐)
    const depthRatio = Math.sin(angle); // -1.0 ~ 1.0
    const depthScale = Math.max(0.85, Math.min(1.15, 1.0 + depthRatio * 0.15));

    // 5. 수명 알파 (초반부터 선명하게 보이다가 착지 직전 부드럽게 소멸)
    let lifeAlpha = 1.0;
    if (curT < 0.10) {
      lifeAlpha = Math.max(0.3, curT / 0.10);
    } else if (curT > 0.82) {
      lifeAlpha = Math.max(0.0, 1.0 - (curT - 0.82) / 0.23);
    }

    if (lifeAlpha <= 0.01) continue;

    // 타원형 땀방울 렌더링 (중간 완전 투명, 외곽 푸른빛, 내각 글로우, 하이라이트 점)
    drawSweatDroplet(
      ctx,
      screenX,
      screenY,
      drop.radius * depthScale,
      tangentAngle,
      drop.elong,
      lifeAlpha
    );
  }
}

/**
 * 263: 객기 후방 이펙트 (시전자 발밑 흙먼지 / 돌진 스피드선 / 3D 포물선 땀방울 뒤쪽 레이어)
 */
export function drawFacadeBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const moveStep = frame.moveStep ?? 1;
  const isPlayer = drawCtx.isPlayer ?? true;
  const attackerPos = drawCtx.attackerPos ?? (isPlayer ? { x: 175, y: 220 } : { x: 418, y: 152 });
  const targetPos = drawCtx.targetPos ?? (isPlayer ? { x: 418, y: 152 } : { x: 175, y: 220 });

  // [Step 1]: 웅크림 및 발밑 흙먼지/긴장 진동 + 3D 포물선 땀방울 (Behind 레이어)
  if (moveStep === 1) {
    const isWindup = frame.phaseId === "facade-windup-crouch";
    const dustAlpha = isWindup ? 0.75 : 0.45;
    const footX = attackerPos.x;
    const footY = attackerPos.y + 18;

    ctx.save();
    ctx.fillStyle = `rgba(209, 213, 219, ${dustAlpha})`;
    ctx.beginPath();
    ctx.arc(footX - (isPlayer ? 12 : -12), footY, isWindup ? 5.5 : 4.0, 0, Math.PI * 2);
    ctx.arc(footX - (isPlayer ? 18 : -18), footY - 1, isWindup ? 4.5 : 3.0, 0, Math.PI * 2);
    ctx.arc(footX + (isPlayer ? 10 : -10), footY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 🌟 3D 포물선 땀방울 [Behind 레이어: 시전자 뒤쪽으로 튀는 땀방울]
    // 중심에는 시전 포켓몬이 위치하여 땀방울이 시전자 등 뒤로 통과
    // ★ 주의: 땀방울 원점은 시전자 중심 위치에 고정! (몸체 스쿼시/스트레치에 흔들리지 않고 공중으로 자유 비산)
    const ax = attackerPos.x;
    const ay = attackerPos.y - 12;
    const sweatT = frame.sweatT ?? 0.50;

    draw3DParabolicSweatWaves(ctx, ax, ay, sweatT, 1.0, true, isPlayer);
  }

  // [Step 2]: 전방 고속 쇄도 시전자 후방 스피드 스트림
  if (moveStep === 2) {
    ctx.save();
    const ax = attackerPos.x;
    const ay = attackerPos.y;
    const tx = targetPos.x;
    const ty = targetPos.y;
    const angle = Math.atan2(ty - ay, tx - ax);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const perpX = -sin;
    const perpY = cos;

    const streakOffsets = [-16, -7, 6, 16];
    for (let i = 0; i < streakOffsets.length; i++) {
      const off = streakOffsets[i];
      const startDist = -14 - (i % 2) * 8;
      const endDist = -56 - (i % 3) * 16;

      const sx = ax + perpX * off + cos * startDist;
      const sy = ay + perpY * off + sin * startDist;
      const ex = ax + perpX * off + cos * endDist;
      const ey = ay + perpY * off + sin * endDist;

      const grad = ctx.createLinearGradient(sx, sy, ex, ey);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.90)");
      grad.addColorStop(0.4, "rgba(224, 242, 254, 0.70)");
      grad.addColorStop(1, "rgba(186, 230, 253, 0.0)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * 263: 객기 전면 이펙트
 * - Step 1: 시전자 스쿼시&스트레치 중 시전자 앞쪽 3D 포물선 땀방울 비산 (중심: 시전 포켓몬)
 * - Step 2: 전방 고속 쇄도
 * - Step 3: 몸통박치기 정면 격돌 섬광 + 스타버스트 + 충격파 링 (⚠️ 대상에게는 땀방울 일절 없음!)
 */
export function drawFacadeEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const moveStep = frame.moveStep ?? 1;
  const isPlayer = drawCtx.isPlayer ?? true;
  const isHit = drawCtx.isHit ?? true;
  const attackerPos = drawCtx.attackerPos ?? (isPlayer ? { x: 175, y: 220 } : { x: 418, y: 152 });
  const targetPos = drawCtx.targetPos ?? (isPlayer ? { x: 418, y: 152 } : { x: 175, y: 220 });

  // ==========================================================================
  // [Step 1]: 3D 포물선 땀방울 [Front 레이어: 시전자 앞쪽으로 튀는 땀방울] 💦
  // - 중심에는 시전 포켓몬이 위치하여 땀방울이 시전자 몸통 앞/하단으로 포물선을 그리며 비산
  // (⚠️ 대상에게는 땀방울이 절대 생기지 않음! 오직 시전자에게서만 사방 3D 포물선으로 튐)
  // ==========================================================================
  if (moveStep === 1) {
    // ★ 주의: 땀방울 원점은 시전자 중심 위치에 고정!
    const ax = attackerPos.x;
    const ay = attackerPos.y - 12;
    const sweatT = frame.sweatT ?? 0.50;

    draw3DParabolicSweatWaves(ctx, ax, ay, sweatT, 1.0, false, isPlayer);
    return;
  }

  // ==========================================================================
  // [Step 2]: 전방 고속 쇄도 (시전자 돌진 스트림)
  // (⚠️ 땀방울은 움직일 때마다 새로 나오는 것이 아니므로 스텝 2에서는 추가 생성하지 않음)
  // ==========================================================================
  if (moveStep === 2) {
    return;
  }

  // ==========================================================================
  // [Step 3]: 몸통박치기 정면 격돌 (오직 정통 몸통박치기 타격 이펙트만 전개!)
  // ⚠️ 대상에게는 땀방울이 일절 발생하지 않습니다.
  // ==========================================================================
  if (moveStep === 3) {
    if (!isHit) return;

    const tx = targetPos.x;
    const ty = targetPos.y;
    const p = Math.max(0, Math.min(1, frame.effectProgress ?? 0.5));

    ctx.save();

    // 1. 순백 중심 섬광 코어 (Central Impact Flash Core)
    const flashAlpha = Math.max(0, 1.0 - p * 0.85);
    if (flashAlpha > 0.03) {
      const coreR = 24 + (1.0 - p) * 16;
      const grad = ctx.createRadialGradient(tx, ty, 2, tx, ty, coreR);
      grad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha.toFixed(3)})`);
      grad.addColorStop(0.35, `rgba(254, 240, 138, ${(flashAlpha * 0.9).toFixed(3)})`);
      grad.addColorStop(0.75, `rgba(253, 224, 71, ${(flashAlpha * 0.45).toFixed(3)})`);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tx, ty, coreR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. 날카로운 정통 충돌 스타버스트 💥 (Sharp Comic Impact Starburst)
    const burstAlpha = Math.max(0, 1.0 - p * 0.90);
    if (burstAlpha > 0.03) {
      const outerR = 22 + p * 20;
      const innerR = outerR * 0.42;
      drawFacadeImpactBurst(
        ctx,
        tx,
        ty,
        outerR,
        innerR,
        8,
        `rgba(255, 255, 255, ${burstAlpha.toFixed(3)})`,
        `rgba(253, 224, 71, ${(burstAlpha * 0.95).toFixed(3)})`,
        2.5,
        p * 0.40
      );
    }

    // 3. 순백 고속 팽창 충격파 링 (Expanding Shockwave Ring)
    const ringAlpha = Math.max(0, 1.0 - p * 0.92);
    if (ringAlpha > 0.03) {
      const rx = 16 + p * 34;
      const ry = rx * 0.72;
      ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha.toFixed(3)})`;
      ctx.lineWidth = 3.0 * (1.0 - p * 0.35);
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(254, 240, 138, ${(ringAlpha * 0.65).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx + 4, ry + 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. 격돌 관통 속도선 (Impact Brackets / Shock Lines)
    const lineAlpha = Math.max(0, 1.0 - p * 1.1);
    if (lineAlpha > 0.05) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha.toFixed(3)})`;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      const dir = isPlayer ? 1 : -1;
      for (const lineOff of [-14, 0, 14]) {
        ctx.beginPath();
        ctx.moveTo(tx - dir * 22, ty + lineOff - 8);
        ctx.lineTo(tx + dir * 18, ty + lineOff);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. 사방 비산 4방향 레트로 별빛 스파크 (Flying Mini Retro Hit Stars)
    const starAlpha = Math.max(0, 1.0 - p * 0.85);
    if (starAlpha > 0.04) {
      const starAngles = [-0.65, 0.45, 1.75, 2.85, -2.15, -1.25];
      for (let i = 0; i < starAngles.length; i++) {
        const a = starAngles[i];
        const dist = 12 + p * (26 + (i % 3) * 10);
        const sx = tx + Math.cos(a) * dist;
        const sy = ty + Math.sin(a) * (dist * 0.82);
        drawMiniRetroStar(ctx, sx, sy, 5.0 * (1.0 - p * 0.3), `rgba(254, 240, 138, ${starAlpha.toFixed(3)})`, a + p);
      }
    }

    ctx.restore();
  }
}

/**
 * ============================================================================
 * 264: 힘껏펀치 (Focus Punch / きあいパンチ) 렌더러
 * ============================================================================
 * [유저 지정 연출]:
 * - 시전포켓몬 포커싱
 * - > 연한빨강, 연한 노랑으로 이루어진 선들이 위로 올라감.
 *
 * [구현 상세]:
 * - Behind 레이어: 시전자 등 뒤편으로 솟구쳐 오르는 연한빨강·연한노랑 에너지선 (Z < 0)
 * - Front 레이어: 시전자 정면 앞쪽으로 솟구쳐 오르는 연한빨강·연한노랑 에너지선 (Z >= 0)
 * - 시전 포켓몬을 감싸며 바닥에서 머리 위 상공으로 끊임없이 유기적으로 피어오르는 기 모으기 광선
 */

interface FocusPunchRisingLine {
  offsetX: number;     // 시전자 중심 기준 좌우 오프셋 (-38 ~ +38)
  length: number;      // 선 길이 (32 ~ 50 px)
  speed: number;       // 상승 속도 배율 (0.90 ~ 1.35)
  phase: number;       // 위상 (0.0 ~ 1.0)
  width: number;       // 선 두께 (2.6 ~ 3.6 px)
  colorType: "light-red" | "light-yellow" | "gradient";
  isBehind: boolean;   // true: 시전자 뒤편, false: 시전자 앞편
}

const FOCUS_PUNCH_RISING_LINES: FocusPunchRisingLine[] = [
  // Behind Layer (시전자 뒤편으로 올라가는 선들, 6개)
  { offsetX: -30, length: 36, speed: 1.15, phase: 0.05, width: 2.8, colorType: "light-red",    isBehind: true },
  { offsetX: -15, length: 44, speed: 0.95, phase: 0.40, width: 3.2, colorType: "light-yellow", isBehind: true },
  { offsetX:  -3, length: 38, speed: 1.25, phase: 0.70, width: 2.6, colorType: "gradient",     isBehind: true },
  { offsetX:  12, length: 42, speed: 1.05, phase: 0.20, width: 3.0, colorType: "light-red",    isBehind: true },
  { offsetX:  25, length: 36, speed: 1.30, phase: 0.55, width: 2.8, colorType: "light-yellow", isBehind: true },
  { offsetX:  35, length: 40, speed: 0.90, phase: 0.85, width: 2.6, colorType: "gradient",     isBehind: true },

  // Front Layer (시전자 앞쪽으로 올라가는 선들, 7개)
  { offsetX: -35, length: 38, speed: 1.20, phase: 0.30, width: 3.0, colorType: "light-yellow", isBehind: false },
  { offsetX: -20, length: 48, speed: 1.00, phase: 0.65, width: 3.6, colorType: "light-red",    isBehind: false },
  { offsetX:  -8, length: 44, speed: 1.35, phase: 0.10, width: 3.2, colorType: "gradient",     isBehind: false },
  { offsetX:   5, length: 50, speed: 1.10, phase: 0.50, width: 3.6, colorType: "light-yellow", isBehind: false },
  { offsetX:  18, length: 44, speed: 0.95, phase: 0.80, width: 3.2, colorType: "light-red",    isBehind: false },
  { offsetX:  28, length: 40, speed: 1.25, phase: 0.25, width: 3.0, colorType: "gradient",     isBehind: false },
  { offsetX:  38, length: 34, speed: 1.05, phase: 0.60, width: 2.8, colorType: "light-yellow", isBehind: false },
];

/**
 * 연한 빨강 및 연한 노랑으로 이루어진 상승 에너지선 렌더링 헬퍼
 * 🌟 [유저 지정 엄수]: 구체가 아닌, 선의 윗부분 끝이 사각형이 아니게 둥근 라운드 캡(Round Cap) + 하단 Flat Cut
 */
export function drawFocusPunchRisingLines(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  isBehindLayer: boolean,
  globalAlpha: number = 1.0
) {
  if (globalAlpha <= 0.01) return;

  const yStart = cy + 24; // 지면 발밑
  const yEnd = cy - 65;   // 상공 머리 위
  const hSpan = yStart - yEnd;

  ctx.save();

  for (let i = 0; i < FOCUS_PUNCH_RISING_LINES.length; i++) {
    const line = FOCUS_PUNCH_RISING_LINES[i];
    if (line.isBehind !== isBehindLayer) continue;

    // 위로 부드럽게 상승하는 주기 (0 ~ 1)
    const cycle = ((progress * line.speed + line.phase) % 1.0);

    // 상승 Y 좌표 (바닥에서 시작하여 위쪽으로 이동)
    const curY = yStart - cycle * hSpan;
    // 약간의 유기적인 좌우 살랑거림
    const sway = Math.sin(cycle * Math.PI * 2.5 + i * 1.7) * 1.5;
    const curX = cx + line.offsetX + sway;

    const topY = curY - line.length * 0.5;
    const botY = curY + line.length * 0.5;

    // 생성 시 페이드인, 소멸 시 페이드아웃 (부드러운 사인 곡선)
    const alpha = Math.sin(cycle * Math.PI) * globalAlpha;
    if (alpha <= 0.02) continue;

    const w = line.width;
    const r = w * 0.5;

    // 🌟 상단 끝 라운드 캡은 선명하게 유지되고, 하단 바닥은 자연스럽게 페이드아웃
    const grad = ctx.createLinearGradient(curX, botY, curX, topY);

    if (line.colorType === "light-red") {
      // 연한 빨강 (Soft Red / Light Red: #FCA5A5 ~ #F87171)
      grad.addColorStop(0.0, "rgba(248, 113, 113, 0.0)");
      grad.addColorStop(0.25, `rgba(252, 165, 165, ${(alpha * 0.70).toFixed(3)})`);
      grad.addColorStop(0.70, `rgba(248, 113, 113, ${(alpha * 0.92).toFixed(3)})`);
      grad.addColorStop(1.0, `rgba(254, 202, 202, ${(alpha * 1.0).toFixed(3)})`);
    } else if (line.colorType === "light-yellow") {
      // 연한 노랑 (Soft Yellow / Light Yellow: #FEF08A ~ #FDE047)
      grad.addColorStop(0.0, "rgba(250, 204, 21, 0.0)");
      grad.addColorStop(0.25, `rgba(254, 240, 138, ${(alpha * 0.70).toFixed(3)})`);
      grad.addColorStop(0.70, `rgba(253, 224, 71, ${(alpha * 0.92).toFixed(3)})`);
      grad.addColorStop(1.0, `rgba(254, 252, 232, ${(alpha * 1.0).toFixed(3)})`);
    } else {
      // 연한 빨강 + 연한 노랑 그라데이션 (하단 연한 빨강 ➔ 상단 연한 노랑)
      grad.addColorStop(0.0, "rgba(248, 113, 113, 0.0)");
      grad.addColorStop(0.25, `rgba(252, 165, 165, ${(alpha * 0.70).toFixed(3)})`);
      grad.addColorStop(0.70, `rgba(254, 240, 138, ${(alpha * 0.92).toFixed(3)})`);
      grad.addColorStop(1.0, `rgba(254, 252, 232, ${(alpha * 1.0).toFixed(3)})`);
    }

    // 1. 외곽 상승선 본체: 끝부분이 사각형이 아니게 둥근 라운드 캡(Round Cap) + 하단 평면
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(curX - r, botY);
    ctx.lineTo(curX - r, topY + r);
    ctx.arc(curX, topY + r, r, Math.PI, 0, false); // 상단 반원 돔 캡
    ctx.lineTo(curX + r, botY);
    ctx.closePath();
    ctx.fill();

    // 2. 중심 밝은 코어 심선: 동일한 라운드 캡 처리
    const cr = r * 0.45;
    const coreGrad = ctx.createLinearGradient(curX, botY, curX, topY);
    coreGrad.addColorStop(0.15, "rgba(255, 255, 255, 0.0)");
    coreGrad.addColorStop(0.65, `rgba(255, 255, 255, ${(alpha * 0.80).toFixed(3)})`);
    coreGrad.addColorStop(1.0, `rgba(255, 255, 255, ${(alpha * 0.95).toFixed(3)})`);

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(curX - cr, botY);
    ctx.lineTo(curX - cr, topY + cr);
    ctx.arc(curX, topY + cr, cr, Math.PI, 0, false);
    ctx.lineTo(curX + cr, botY);
    ctx.closePath();
    ctx.fill();
  }

  // ⚠️ [유저 지정]: 점파티클은 완전 제거 (오직 상승선만 깔끔하게 렌더링)

  ctx.restore();
}

/**
 * 264: 힘껏펀치 Step 2 - 적 포켓몬 위치 중심 흰색 파장 및 전체 파란 배경 필터 렌더러
 * - 화면 필터로 파란 색깔 배경 페이드 인
 * - 적 포켓몬 스프라이트 위치에서 흰 색깔로 시작되어 외곽으로 확산되는 동심원 파장(Ripple Waves) 렌더링
 * - 포켓몬 스프라이트 뒤편(Behind Layer)에서 렌더링되어 대상 실루엣을 부각
 */
/**
 * 264: 힘껏펀치 Step 2 - 적 포켓몬 위치 중심 뾰족한 방사형 흰색/하늘색 버스트 및 파란 배경 렌더러
 * - [유저 제공 레퍼런스 엄수]:
 *   1. 선명하고 강렬한 포켓몬 배틀 로열 블루 단색 배경 (#085ab5, rgb(8, 90, 181))
 *   2. 적 포켓몬(Machoke) 뒤편을 완전히 감싸는 순백색(#ffffff) 대형 발광핵
 *   3. 중심에서 360도로 뻗어나가는 뾰족뾰족한 톱니 가시 모양의 방사형 스파이크 버스트 (Starburst / Spiked Shockwave)
 *   4. 시전자(Togekiss/하단 좌측) 방향으로 길게 뻗어나가는 사선 쐐기형 광선 (Directional Tapered Beam)
 */
/**
 * 264: 힘껏펀치 Step 2 - 원작 레퍼런스(4세대) 준수 총 4겹의 스타버스트 & 배틀 블루 배경 렌더러
 * - [유저 지정 엄수]: 스타버스트는 총 4겹(4 Tiers)으로 구성:
 *   1. Tier 4 (최외곽 4겹 - 짙은 로열 블루 스파이크 림, #1876e0)
 *   2. Tier 3 (중간 외측 3겹 - 선명한 스카이 블루 스파이크 림, #52aef8)
 *   3. Tier 2 (중간 내측 2겹 - 연한 파스텔 아이스 블루 스파이크 림, #b6e2fe)
 *   4. Tier 1 (최내곽 1겹 - 적 포켓몬을 완전히 감싸는 순백색 대형 스타버스트 코어, #ffffff)
 * - 4겹 모두 시전자 방향(좌하단)으로 자연스러운 유기적 타원 확장 적용
 */
interface FocusPunchStarburstTier {
  fillColor: (alpha: number) => string;
  shadowColor: (alpha: number) => string;
  shadowBlur: number;
  baseValR: number;
  toothH: number;
  stretchScale: number;
}

const FOCUS_PUNCH_STARBURST_TIERS: FocusPunchStarburstTier[] = [
  // 1. Tier 4 (최외곽 4겹 - 짙은 로열 블루 스파이크 림)
  {
    fillColor: (a) => `rgba(24, 118, 224, ${a.toFixed(3)})`,
    shadowColor: (a) => `rgba(10, 80, 180, ${(a * 0.60).toFixed(3)})`,
    shadowBlur: 6,
    baseValR: 104,
    toothH: 18,
    stretchScale: 0.82,
  },
  // 2. Tier 3 (중간 외측 3겹 - 선명한 스카이 블루 스파이크 림)
  {
    fillColor: (a) => `rgba(82, 174, 248, ${a.toFixed(3)})`,
    shadowColor: (a) => `rgba(50, 140, 230, ${(a * 0.60).toFixed(3)})`,
    shadowBlur: 5,
    baseValR: 85,
    toothH: 15,
    stretchScale: 0.82,
  },
  // 3. Tier 2 (중간 내측 2겹 - 연한 파스텔 아이스 블루 스파이크 림)
  {
    fillColor: (a) => `rgba(182, 226, 254, ${a.toFixed(3)})`,
    shadowColor: (a) => `rgba(140, 205, 255, ${(a * 0.60).toFixed(3)})`,
    shadowBlur: 4,
    baseValR: 66,
    toothH: 12,
    stretchScale: 0.82,
  },
  // 4. Tier 1 (최내곽 1겹 - 적 포켓몬을 감싸는 순백색 대형 스타버스트 코어)
  {
    fillColor: (a) => `rgba(255, 255, 255, ${a.toFixed(3)})`,
    shadowColor: (a) => `rgba(220, 240, 255, ${(a * 0.80).toFixed(3)})`,
    shadowBlur: 4,
    baseValR: 48,
    toothH: 10,
    stretchScale: 0.82,
  },
];

const FOCUS_PUNCH_TOOTH_SEEDS = [
  1.0, 1.15, 0.90, 1.12, 0.95, 1.18, 0.88, 1.14,
  0.92, 1.16, 0.88, 1.12, 0.95, 1.18, 0.90, 1.15,
  0.88, 1.12, 0.92, 1.18, 0.88, 1.14, 0.90, 1.12,
  0.92, 1.15, 0.88, 1.14, 0.92, 1.16, 0.88, 1.12,
];

export function drawFocusPunchTargetWave(
  ctx: any,
  tx: number,
  ty: number,
  cx: number = tx - 220,
  cy: number = ty + 110,
  waveProgress: number = 1.0,
  blueAlpha: number = 1.0,
  starburstAlpha: number = 1.0
) {
  if (blueAlpha <= 0.01) return;

  ctx.save();

  // 1. 선명하고 강렬한 포켓몬 배틀 로열 블루 배경 (Gen 4 원작 컬러 #0a58b2)
  ctx.fillStyle = `rgba(10, 88, 178, ${blueAlpha.toFixed(3)})`;
  ctx.fillRect(-6000, -6000, 14000, 14000);

  // 🌟 [유저 지정 엄수]: 화면이 파란색으로 완전히 물든 후 스타버스트가 나타남
  if (starburstAlpha <= 0.01 || waveProgress <= 0.01) {
    ctx.restore();
    return;
  }

  // 시전자 방향 벡터
  const dx = cx - tx;
  const dy = cy - ty;
  const angleToCaster = Math.atan2(dy, dx);

  const expand = Math.min(1.0, 0.40 + waveProgress * 0.60);
  const toothCount = FOCUS_PUNCH_TOOTH_SEEDS.length;
  const sAlpha = Math.min(1.0, blueAlpha * starburstAlpha);

  // 2. 총 4겹의 스타버스트 동심 계층 렌더링 (Tier 4 -> Tier 3 -> Tier 2 -> Tier 1)
  for (const tier of FOCUS_PUNCH_STARBURST_TIERS) {
    ctx.save();
    ctx.shadowColor = tier.shadowColor(sAlpha);
    ctx.shadowBlur = tier.shadowBlur;
    ctx.fillStyle = tier.fillColor(sAlpha);

    ctx.beginPath();
    for (let i = 0; i < toothCount; i++) {
      const thetaP = (i * Math.PI * 2) / toothCount;
      const thetaV = thetaP + Math.PI / toothCount;

      // 시전자(하단 좌측) 방향으로 타원 및 톱니 부드러운 확장
      let diffP = Math.abs(thetaP - angleToCaster);
      if (diffP > Math.PI) diffP = Math.PI * 2 - diffP;
      const stretchP = Math.pow(Math.max(0, Math.cos(diffP)), 1.5) * tier.stretchScale;

      let diffV = Math.abs(thetaV - angleToCaster);
      if (diffV > Math.PI) diffV = Math.PI * 2 - diffV;
      const stretchV = Math.pow(Math.max(0, Math.cos(diffV)), 1.5) * tier.stretchScale;

      // 미세 생동감 쉼머
      const shimmer = Math.sin(waveProgress * Math.PI * 6 + i * 1.3) * 1.5;

      const valR = (tier.baseValR * (1.0 + stretchV) + shimmer * 0.4) * expand;
      const toothH = (tier.toothH * FOCUS_PUNCH_TOOTH_SEEDS[i] * (1.0 + stretchP * 0.5) + shimmer) * expand;
      const peakR = valR + toothH;

      const px = tx + Math.cos(thetaP) * peakR;
      const py = ty + Math.sin(thetaP) * (peakR * 0.90); // 2.5D 배틀필드 원근 타원

      const vx = tx + Math.cos(thetaV) * valR;
      const vy = ty + Math.sin(thetaV) * (valR * 0.90);

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
      ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 264: 힘껏펀치 후방 이펙트
 * - Step 1: 시전자 뒤편으로 올라가는 연한빨강·연한노랑 에너지선
 * - Step 2: 원작 레퍼런스 준수 파란 배경 + 적 포켓몬 위치 중심 4겹 스타버스트
 */
export function drawFocusPunchBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (frame.afterCameraReturn) return;
  if (frame.phaseId && (
    frame.phaseId.includes("camera-") ||
    frame.phaseId.includes("damage-blink") ||
    frame.phaseId.includes("hp-drain") ||
    frame.phaseId.includes("hp-recovery") ||
    frame.phaseId.includes("neutral") ||
    frame.phaseId.includes("recoil")
  )) return;
  if (!frame.showEffect && !frame.showBehindEffect) return;

  const isPlayer = drawCtx.isPlayer ?? true;
  const moveStep = frame.moveStep ?? 1;

  if (moveStep === 1) {
    const attackerPos = drawCtx.attackerPos ?? (isPlayer ? { x: 175, y: 220 } : { x: 418, y: 152 });
    const casterOff = isPlayer ? (frame.pOffset || { x: 0, y: 0 }) : (frame.eOffset || { x: 0, y: 0 });
    const cx = attackerPos.x + casterOff.x;
    const cy = attackerPos.y + casterOff.y;

    const progress = frame.effectProgress ?? (frame.chargeProgress ?? 0.5);
    const alpha = frame.lineAlpha ?? 1.0;

    drawFocusPunchRisingLines(ctx, cx, cy, progress, true, alpha);
  } else if (moveStep === 2) {
    const targetPos = drawCtx.targetPos ?? (isPlayer ? { x: 380, y: 130 } : { x: 175, y: 220 });
    const targetOff = isPlayer ? (frame.eOffset || { x: 0, y: 0 }) : (frame.pOffset || { x: 0, y: 0 });
    const tx = targetPos.x + targetOff.x;
    const ty = targetPos.y + targetOff.y;

    const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos ?? (isPlayer ? { x: 175, y: 220 } : { x: 380, y: 130 });
    const cx = casterPos.x;
    const cy = casterPos.y;

    const waveProgress = frame.waveProgress ?? frame.effectProgress ?? 0.0;
    const blueAlpha = frame.blueAlpha ?? 1.0;
    const starburstAlpha = frame.starburstAlpha ?? (waveProgress > 0.01 ? 1.0 : 0.0);

    drawFocusPunchTargetWave(ctx, tx, ty, cx, cy, waveProgress, blueAlpha, starburstAlpha);
  }
}

/**
 * 🥊 힘껏펀치 전용 빨간색 필터 주먹 렌더러
 * - [유저 지정 엄수]: 
 *   1. 기존 공식 주먹 에셋(comet_punch_fist.png / SVG) 사용
 *   2. 빨간색 필터(Red Tint) 적용
 *   3. 75도 회전된 각도에서 수평(0도)으로 회전하며 강타
 */
export function drawFocusPunchRedFist(
  ctx: any,
  x: number,
  y: number,
  scale: number,
  alpha: number,
  rotDeg: number,
  isPlayer: boolean = true
) {
  if (alpha <= 0.01 || scale <= 0.01) return;

  ctx.save();
  ctx.translate(x, y);

  // 시전자(플레이어)가 적군을 공격할 때 주먹이 오른쪽(적군)을 향하도록 x축 반전
  if (isPlayer) {
    ctx.scale(-1, 1);
  }

  // 75도 -> 0도 수평 회전 (라디안 변환)
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * Math.min(1.0, alpha);

  // 붉은 타격 대기광 글로우
  ctx.shadowColor = "rgba(239, 68, 68, 0.75)";
  ctx.shadowBlur = 12;

  const redFistCanvas = getFocusPunchRedFistCanvas();
  if (redFistCanvas) {
    const fw = redFistCanvas.width;
    const fh = redFistCanvas.height;
    ctx.drawImage(redFistCanvas, -fw / 2, -fh / 2, fw, fh);
  } else {
    const cometFist = getCometPunchFistImg();
    if (cometFist) {
      const fw = cometFist.width;
      const fh = cometFist.height;
      ctx.drawImage(cometFist, -fw / 2, -fh / 2, fw, fh);
    } else {
      drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.2, 1.0);
    }
  }

  ctx.restore();
}

/**
 * 264: 힘껏펀치 전면 이펙트
 * - Step 1: 시전자 앞편으로 올라가는 연한빨강·연한노랑 에너지선
 * - Step 2: 75도에서 수평(0도)으로 회전하며 강타하는 빨간색 필터 주먹 & 타격 임팩트
 */
export function drawFocusPunchEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (frame.afterCameraReturn) return;
  if (frame.phaseId && (
    frame.phaseId.includes("camera-") ||
    frame.phaseId.includes("damage-blink") ||
    frame.phaseId.includes("hp-drain") ||
    frame.phaseId.includes("hp-recovery") ||
    frame.phaseId.includes("neutral") ||
    frame.phaseId.includes("recoil")
  )) return;
  if (!frame.showEffect) return;

  const isPlayer = drawCtx.isPlayer ?? true;
  const moveStep = frame.moveStep ?? 1;

  if (moveStep === 1) {
    const attackerPos = drawCtx.attackerPos ?? (isPlayer ? { x: 175, y: 220 } : { x: 418, y: 152 });
    const casterOff = isPlayer ? (frame.pOffset || { x: 0, y: 0 }) : (frame.eOffset || { x: 0, y: 0 });
    const cx = attackerPos.x + casterOff.x;
    const cy = attackerPos.y + casterOff.y;

    const progress = frame.effectProgress ?? (frame.chargeProgress ?? 0.5);
    const alpha = frame.lineAlpha ?? 1.0;

    drawFocusPunchRisingLines(ctx, cx, cy, progress, false, alpha);
  } else if (moveStep === 2) {
    // 🥊 붉은 주먹 75도 ➔ 0도(수평) 타격 렌더링
    // 🌟 [유저 지정 엄수]:
    //   1. 주먹 위치는 항상 타겟 정중앙(tx, ty)에 고정
    //   2. 투명하면서 큰 크기(scale ~1.05, alpha ~0.28)에서 시작해
    //   3. 작아지면서 선명(scale -> 0.50, alpha -> 1.0)하게 수평(0도)으로 강타!
    if (frame.showPunch && frame.punchProgress !== undefined) {
      const targetPos = drawCtx.targetPos ?? (isPlayer ? { x: 380, y: 130 } : { x: 175, y: 220 });
      const targetOff = isPlayer ? (frame.eOffset || { x: 0, y: 0 }) : (frame.pOffset || { x: 0, y: 0 });
      const tx = targetPos.x + targetOff.x;
      const ty = targetPos.y + targetOff.y;

      const prog = frame.punchProgress;
      const rot = frame.punchRot !== undefined ? frame.punchRot : ((1.0 - Math.min(1.0, prog)) * 75);
      const alpha = frame.punchAlpha !== undefined ? frame.punchAlpha : (0.28 + Math.min(1.0, prog) * 0.72);
      const scale = frame.punchScale !== undefined ? frame.punchScale : (1.05 - Math.min(1.0, prog) * 0.55);

      // 🌟 [유저 지정 엄수]: 촌티나는(밤티나는) 링/왜건휠 이펙트 완전 배제!
      // 세련된 순백 코어 플래시 & 8방향 샤프 코믹 임팩트 버스트를 주먹 뒤 배경에 먼저 렌더링
      if (frame.showImpact) {
        const impactProg = frame.impactProgress !== undefined ? frame.impactProgress : (prog >= 1.05 ? 0.70 : 0.30);
        drawFocusPunchCleanImpact(ctx, tx, ty, impactProg);
      }

      // 🌟 [유저 지정 엄수]: 주먹 이펙트는 타격(임팩트) 위에 표시되게 렌더링!
      // 주먹 위치는 항상 타겟 중앙 (이동 오프셋 없이 tx, ty에 완전 앵커링)
      drawFocusPunchRedFist(ctx, tx, ty, scale, alpha, rot, isPlayer);

      // 🌟 [유저 지정 엄수]: 타격 후 사방으로 튀어나가는 선명한 점파티클! (주먹 위/앞 최전면 레이어로 분출)
      if (frame.showImpact) {
        const impactProg = frame.impactProgress !== undefined ? frame.impactProgress : (prog >= 1.05 ? 0.70 : 0.30);
        drawFocusPunchSparks(ctx, tx, ty, impactProg);
      }
    }
  }
}

interface FocusPunchSpark {
  angle: number;
  speed: number;
  radius: number;
  color: string;
  hasStreak?: boolean;
}

// 🌟 [유저 지정 엄수]: 타격 직후 사방으로 튀어나가는 22개 고속 발광 점파티클 (Dot Particles)
const FOCUS_PUNCH_SPARKS: FocusPunchSpark[] = [
  // 1. 상단 (12시 방향 분출)
  { angle: -Math.PI * 0.50, speed: 85, radius: 5.8, color: "#FFFFFF", hasStreak: true },
  { angle: -Math.PI * 0.58, speed: 70, radius: 4.5, color: "#FEF08A" },
  { angle: -Math.PI * 0.42, speed: 76, radius: 4.8, color: "#FDE047" },
  { angle: -Math.PI * 0.66, speed: 96, radius: 3.8, color: "#FFFFFF", hasStreak: true },
  { angle: -Math.PI * 0.34, speed: 90, radius: 4.0, color: "#FB923C", hasStreak: true },

  // 2. 우상단 / 우측 (1시 ~ 3시)
  { angle: -Math.PI * 0.20, speed: 82, radius: 5.4, color: "#FFFFFF", hasStreak: true },
  { angle: -Math.PI * 0.08, speed: 90, radius: 4.2, color: "#FEF08A" },
  { angle: 0.05, speed: 100, radius: 6.2, color: "#FFFFFF", hasStreak: true },
  { angle: 0.18, speed: 75, radius: 4.6, color: "#EF4444" },
  { angle: 0.32, speed: 88, radius: 4.0, color: "#FDE047" },

  // 3. 우하단 / 하단 (4시 ~ 6시)
  { angle: Math.PI * 0.45, speed: 78, radius: 5.5, color: "#FFFFFF" },
  { angle: Math.PI * 0.55, speed: 68, radius: 4.5, color: "#FEF08A" },
  { angle: Math.PI * 0.68, speed: 92, radius: 4.0, color: "#FB923C", hasStreak: true },
  { angle: Math.PI * 0.35, speed: 85, radius: 5.0, color: "#FFFFFF" },

  // 4. 좌하단 / 좌측 (7시 ~ 9시)
  { angle: Math.PI * 0.85, speed: 80, radius: 4.8, color: "#FEF08A" },
  { angle: Math.PI * 0.98, speed: 95, radius: 5.8, color: "#FFFFFF", hasStreak: true },
  { angle: -Math.PI * 0.92, speed: 74, radius: 4.4, color: "#EF4444" },
  { angle: -Math.PI * 0.78, speed: 88, radius: 4.0, color: "#FDE047" },

  // 5. 좌상단 (10시 ~ 11시)
  { angle: -Math.PI * 0.72, speed: 84, radius: 5.2, color: "#FFFFFF" },
  { angle: -Math.PI * 0.82, speed: 68, radius: 4.2, color: "#FEF08A" },
  { angle: -Math.PI * 0.62, speed: 98, radius: 6.2, color: "#FFFFFF", hasStreak: true },
  { angle: -Math.PI * 0.28, speed: 70, radius: 3.8, color: "#FB923C" },
];

/**
 * 🌟 [유저 지정 엄수]: 타격 후 사방으로 튀어나가는 전면 점파티클 렌더러
 * - 주먹 앞/타겟 전면에 선명한 2중 발광 구체(글로우 + 순백 코어)와 고속 속도선 꼬리 렌더링
 */
export function drawFocusPunchSparks(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress <= 0.0 || progress >= 1.0) return;

  const easeOut = 1.0 - Math.pow(1.0 - Math.min(1.0, progress), 2.2);

  let sizeScale = 1.0;
  let alpha = 1.0;
  if (progress > 0.50) {
    const fadeT = (progress - 0.50) / 0.50;
    sizeScale = Math.max(0.3, 1.0 - fadeT * 0.55);
    alpha = Math.max(0.0, 1.0 - Math.pow(fadeT, 1.3));
  }
  if (alpha <= 0.01) return;

  ctx.save();

  for (const spark of FOCUS_PUNCH_SPARKS) {
    const dist = 12 + spark.speed * easeOut;
    const px = cx + Math.cos(spark.angle) * dist;
    const py = cy + Math.sin(spark.angle) * dist;
    const r = spark.radius * sizeScale;

    // 1. 고속 궤적 라인 (Streak) - 점파티클 뒤로 이어지는 미세 잔상 꼬리
    if (spark.hasStreak && progress > 0.06 && progress < 0.85) {
      const trailLen = Math.min(dist * 0.38, 16 * sizeScale);
      const tailX = px - Math.cos(spark.angle) * trailLen;
      const tailY = py - Math.sin(spark.angle) * trailLen;

      ctx.save();
      ctx.strokeStyle = spark.color;
      ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * (alpha * 0.75);
      ctx.lineWidth = Math.max(1.5, r * 0.45);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.restore();
    }

    // 2. 외곽 색상 글로우 (Outer Colored Glow)
    ctx.save();
    ctx.fillStyle = spark.color;
    ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * (alpha * 0.95);
    ctx.shadowColor = spark.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();

    // 3. 중심부 초고휘도 순백 코어 (Bright Pure White Core)
    ctx.fillStyle = "#FFFFFF";
    ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1.0, r * 0.55), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 💥 힘껏펀치 전용 클린 샤프 임팩트 버스트 (촌티나는 링/원형 왜건휠 일체 배제)
 * - 4세대 원작 감성의 순백 코어 섬광 + 8방향 날카로운 코믹 스타버스트
 */
function drawFocusPunchCleanImpact(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  const alpha = Math.max(0, 1.0 - progress);
  if (alpha <= 0.01) return;

  ctx.save();

  // 1. 순백 코어 섬광 (Soft Pure White Core Flash)
  const coreR = 18 + progress * 24;
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  coreGrad.addColorStop(0.00, `rgba(255, 255, 255, ${(1.0 * alpha).toFixed(3)})`);
  coreGrad.addColorStop(0.40, `rgba(255, 255, 255, ${(0.85 * alpha).toFixed(3)})`);
  coreGrad.addColorStop(0.75, `rgba(254, 202, 202, ${(0.30 * alpha).toFixed(3)})`);
  coreGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 날카로운 8방향 순백 샤프 스타버스트 (Sharp Comic Impact Star - 링 없음)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(progress * 0.45);

  const outerR = 26 + progress * 22;
  const innerR = outerR * 0.38;
  const points = 8;

  ctx.fillStyle = `rgba(255, 255, 255, ${(0.95 * alpha).toFixed(3)})`;
  ctx.strokeStyle = `rgba(255, 255, 255, ${(1.0 * alpha).toFixed(3)})`;
  ctx.lineWidth = 2.0;

  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 3. 미세 타격 십자 스파크 파티클 4개 (깔끔한 순백 미니 스타)
  const sparkDist = 18 + progress * 26;
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2 + Math.PI / 4;
    const sx = cx + Math.cos(ang) * sparkDist;
    const sy = cy + Math.sin(ang) * sparkDist;
    drawMiniRetroStar(ctx, sx, sy, 3.8 * (1.0 - progress * 0.4), `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
  }

  ctx.restore();
}



