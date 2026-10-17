// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar, drawStarburstImpact, getCometPunchFistImg } from "../common/helpers.js";
import { drawFrontStraightPunchFistSvg } from "./move001_004.js";
import { drawConfusionEffect } from "./move045_048.js";

// ============================================================================
// 🔥 221: 성스러운불꽃 (Sacred Fire / せいなるほのお) - 칠색조 전용기
//
// 위력: 100 / 명중: 95 / PP: 5 / 화상 확률: 50% / 접촉: X
// 설명: 신비한 불꽃으로 상대를 태워서 공격한다. 50% 확률로 화상을 입힌다.
//
// [연출 기승전결 시퀀스]:
// 1. 기(起): 시전자 주위 신성한 황금빛 & 진홍빛 화염 불씨와 무지개 성광 입자 응축
// 2. 승(承): 대상 상공 및 발밑에서 나선형으로 솟구치는 거대한 성스러운 불꽃 기둥 (이중 나선 소용돌이)
// 3. 전(轉): 불꽃 기둥 대폭발 & 순백 섬광, 16방향 황금 스파크 비산 및 화상 엠버 링 확산
// 4. 결(結): 은은한 성스러운 불꽃 분진이 하늘로 승화하며 부드럽게 복귀
// ============================================================================

const SACRED_PALETTE = {
  white: "#FFFFFF",
  goldLight: "#FEF08A",
  goldCore: "#FACC15",
  amber: "#F59E0B",
  flameOrange: "#FB923C",
  crimsonLight: "#F87171",
  crimson: "#EF4444",
  deepRed: "#B91C1C",
  darkRed: "#7F1D1D",
  rainbowPurple: "#C084FC",
  smokeDark: "rgba(30, 10, 10, 0.4)",
};

/**
 * 성스러운불꽃 고유 배경: 암전 후 남색 배경 + 아래에서 위로 용솟음치는 흰푸른 화염 (Inferno)
 * (유저 요청: 카메라가 적/아군 포커싱이나 줌에 상관없이 화면 하단에 고정되어 항상 보이도록 화면 좌표계에 앵커링)
 */
function drawSacredNavyBlueFlamesBackground(
  ctx: any,
  frame: BattleFrame,
  canvasWidth: number = 560,
  canvasHeight: number = 380
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;

  // 전체 배경 알파 결정 (Step 1: 암전 및 남색 전환, Step 2~3: 유지, Step 4: 페이드아웃)
  let bgAlpha = 0;
  if (step === 1) {
    bgAlpha = Math.min(0.96, 0.2 + prog * 0.76);
  } else if (step === 2) {
    bgAlpha = 0.96;
  } else if (step === 3) {
    bgAlpha = Math.max(0.65, 0.96 - prog * 0.35);
  } else if (step === 4) {
    bgAlpha = Math.max(0, (1.0 - prog) * 0.65);
  }

  if (bgAlpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * bgAlpha;

  // [카메라 고정 화면 좌표계 (Screen Space)로 변환]:
  // 카메라 줌/팬(적대 포켓몬 포커스 또는 시전자 포커스)에 영향받지 않고
  // 항상 화면 전체 및 화면 하단에 고정되어 일렁이도록 설정
  if (ctx.resetTransform) {
    ctx.resetTransform();
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  const cw = canvasWidth || 560;
  const ch = canvasHeight || 380;
  const scale = (ctx.canvas?.width || 560) / cw;
  ctx.scale(scale, scale);

  // 1. 암전 후 딥 남색(Deep Navy) 그라데이션 배경 (화면 전체 덮기)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, ch);
  bgGrad.addColorStop(0.0, "#020510"); // 상단: 암전 딥 미드나이트 블랙
  bgGrad.addColorStop(0.35, "#060D24");
  bgGrad.addColorStop(0.70, "#0A183D");
  bgGrad.addColorStop(1.0, "#0F2859");

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, cw, ch);

  // 2. 하단 거대 화염 대지 발광 (Roaring Fire Aura - 화면 하단 앵커링)
  const bottomGlow = ctx.createLinearGradient(0, ch, 0, ch - 220);
  bottomGlow.addColorStop(0.0, "rgba(56, 189, 248, 0.45)");
  bottomGlow.addColorStop(0.35, "rgba(14, 116, 144, 0.25)");
  bottomGlow.addColorStop(0.75, "rgba(2, 132, 199, 0.10)");
  bottomGlow.addColorStop(1.0, "rgba(2, 132, 199, 0.0)");
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, ch - 220, cw, 220);

  // 3. [화염 파도: 화면 밖 바닥에서부터 일렁거리는 거대한 푸른 화염의 파도]
  // (유저 요청: 카메라 무빙이나 스텝 전환 시에도 절대 멈춤 없이 부드럽게 연속 일렁임)
  const time = frame.flameTime !== undefined
    ? frame.flameTime
    : (step * 8.0 + prog * 8.0) * 0.42;

  const continuousProg = frame.flameProg !== undefined
    ? frame.flameProg
    : ((step - 1) * 0.25 + prog * 0.25);

  const fastFlicker = Math.sin(time * 3.5) * 4.0;
  const wavePoints = 36;
  const startX = -30;
  const endX = cw + 30;
  const stepX = (endX - startX) / wavePoints;
  const waveBaseY = ch + 40; // 화면 바닥 밖으로 넉넉하게 확장

  // 후방 화염 파도 (딥 블루 ~ 시안, 일렁거리는 불길 파도)
  ctx.save();
  const backWaveGrad = ctx.createLinearGradient(0, waveBaseY, 0, ch - 150);
  backWaveGrad.addColorStop(0.0, "rgba(2, 132, 199, 0.95)");
  backWaveGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.70)");
  backWaveGrad.addColorStop(0.85, "rgba(56, 189, 248, 0.20)");
  backWaveGrad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)"); // 상단 투명 블렌드
  ctx.fillStyle = backWaveGrad;
  ctx.beginPath();
  ctx.moveTo(startX, waveBaseY);
  for (let i = 0; i <= wavePoints; i++) {
    const wx = startX + i * stepX;
    const wy = (ch - 110) + Math.sin(time + i * 0.65) * 20 + Math.cos(time * 1.2 + i * 1.1) * 12 + (i % 2 === 0 ? fastFlicker : -fastFlicker);
    ctx.lineTo(wx, wy);
  }
  ctx.lineTo(endX, waveBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 전방 화염 파도 (눈부신 순백 ~ 아이스 블루 초고열 작열 파도)
  ctx.save();
  const frontWaveGrad = ctx.createLinearGradient(0, waveBaseY, 0, ch - 120);
  frontWaveGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.98)");
  frontWaveGrad.addColorStop(0.35, "rgba(186, 230, 253, 0.90)");
  frontWaveGrad.addColorStop(0.70, "rgba(56, 189, 248, 0.45)");
  frontWaveGrad.addColorStop(0.90, "rgba(56, 189, 248, 0.15)");
  frontWaveGrad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)"); // 상단 투명 블렌드
  ctx.fillStyle = frontWaveGrad;
  ctx.beginPath();
  ctx.moveTo(startX, waveBaseY);
  for (let i = 0; i <= wavePoints; i++) {
    const wx = startX + i * stepX;
    const wy = (ch - 90) + Math.sin(time * 1.4 + i * 0.8 + 1.2) * 16 + Math.sin(time * 2.1 + i * 0.5) * 9;
    ctx.lineTo(wx, wy);
  }
  ctx.lineTo(endX, waveBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. [밝은 흰색/푸른 연기가 화염에서 위로 올라가면서 부드럽게 페이드 아웃]
  const numSmokePlumes = 18;
  for (let i = 0; i < numSmokePlumes; i++) {
    const emitterX = -20 + i * 36 + Math.sin(time * 0.9 + i * 1.5) * 12;
    const smokeCycle = (continuousProg * 5.0 + i * 0.17) % 1.0;
    const riseY = smokeCycle * 130;
    const smY = (ch - 110) - riseY;
    const smX = emitterX + Math.sin(time * 0.8 + i * 2.0) * (20 + smokeCycle * 18);

    // 위로 올라갈수록 연기가 부드럽게 팽창 (16px -> 42px)
    const smRadius = 16 + smokeCycle * 26;

    // 위로 올라가면서 부드럽게 페이드 아웃
    const heightFade = Math.max(0, Math.min(1.0, (smY - 90) / 120));
    const smAlpha = heightFade * (0.55 * (1.0 - Math.pow(smokeCycle, 1.4)));

    if (smAlpha > 0.015) {
      ctx.save();
      ctx.globalAlpha = smAlpha;

      const smokeGrad = ctx.createRadialGradient(smX, smY, smRadius * 0.08, smX, smY, smRadius);
      // [밝은 흰 색깔 연기 코어 -> 푸른 연기 바디 -> 완전 투명 페이드아웃]
      smokeGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.85)");   // 밝은 순백 연기 코어
      smokeGrad.addColorStop(0.28, "rgba(224, 242, 254, 0.65)");  // 밝은 아이스 화이트
      smokeGrad.addColorStop(0.60, "rgba(147, 197, 253, 0.30)");  // 은은한 푸른 연기
      smokeGrad.addColorStop(0.85, "rgba(59, 130, 246, 0.10)");   // 외곽 소프트 블렌드
      smokeGrad.addColorStop(1.0, "rgba(59, 130, 246, 0.0)");     // 100% 투명 소멸

      ctx.fillStyle = smokeGrad;
      ctx.beginPath();
      ctx.arc(smX, smY, smRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 5. 아지랑이 열기 수증기 줄기 (Rising Heat Wisps)
  ctx.save();
  ctx.lineWidth = 2.0;
  for (let i = 0; i < 16; i++) {
    const wxBase = -20 + i * 38;
    const wCycle = (continuousProg * 6.5 + i * 0.16) % 1.0;
    const wTopY = (ch - 110) - wCycle * 100;
    const wBotY = wTopY + 35;
    const wx = wxBase + Math.sin(time * 2.0 + i) * 12;

    const wAlpha = Math.max(0, (wTopY - 110) / 90) * 0.45 * (1.0 - wCycle);
    if (wAlpha > 0.02) {
      const wGrad = ctx.createLinearGradient(wx, wBotY, wx, wTopY);
      wGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      wGrad.addColorStop(0.5, `rgba(224, 242, 254, ${wAlpha})`);
      wGrad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)");

      ctx.strokeStyle = wGrad;
      ctx.beginPath();
      ctx.moveTo(wx, wBotY);
      ctx.quadraticCurveTo(wx + Math.sin(time * 2.5 + i) * 8, (wBotY + wTopY) / 2, wx, wTopY);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.restore();
}

/**
 * 성스러운불꽃 - 용의분노 스타일 유기적 화염 덩어리(Billowing Flame Puff) 제어점 생성
 * - 5~6개의 울퉁불퉁한 화염 돌기(Lobes)로 완전한 원형 형태를 탈피한 유기적 불꽃 실루엣
 */
function getSacredBillowingFlamePoints(
  baseR: number,
  seed: number,
  roll: number,
  isCore: boolean = false
): { x: number; y: number }[] {
  const scale = isCore ? 0.52 : 1.0;
  const R = baseR * scale;
  const SAMPLES = 16;
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < SAMPLES; i++) {
    const angle = (i / SAMPLES) * Math.PI * 2;
    // 전방 도톰, 후방 자연스럽게 꼬리 빠지는 유선형 볼륨
    const aspect = 1.0 + Math.cos(angle) * 0.12 - Math.cos(angle * 0.5) * 0.14;
    // 5~6개 화염 돌기
    const bump = 1.0
      + Math.sin(angle * 5 + roll + seed) * 0.18
      + Math.cos(angle * 3 - roll * 0.8) * 0.12
      + Math.sin(angle * 2 + seed * 1.5) * 0.08;

    const r = R * aspect * bump;
    pts.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }

  return pts;
}

function traceSacredBillowingContour(ctx: any, pts: { x: number; y: number }[]) {
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
 * 용의 분노(082) 스타일 볼류메트릭 화염 및 연기 덩어리 렌더러
 * - Pass 1: 외곽 앰비언트 글로우/연기 오라
 * - Pass 2: 메인 화염/연기 바디 (딥 인디고 & 블루-바이올렛 ➔ 연기 팽창)
 * - Pass 3: 중심 초고열 순백-아이시 코어
 */
function drawSacredBillowingFlamePuff(
  ctx: any,
  px: number,
  py: number,
  radius: number,
  flightAngle: number,
  rollAngle: number,
  alpha: number,
  seed: number,
  smokeRatio: number
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(px, py);
  ctx.rotate(flightAngle);

  // 1. 외곽 은은한 앰비언트 글로우/연기 오라 (용의 분노 기반)
  const auraPts = getSacredBillowingFlamePoints(radius * 1.30, seed + 2, rollAngle * 0.8, false);
  traceSacredBillowingContour(ctx, auraPts);
  const auraR = radius * 1.45;
  const auraGrad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, auraR);
  auraGrad.addColorStop(0.00, `rgba(67, 24, 184, ${0.40 * (1.0 - smokeRatio * 0.4)})`);
  auraGrad.addColorStop(0.50, `rgba(99, 70, 235, ${0.22 * (1.0 - smokeRatio * 0.3)})`);
  auraGrad.addColorStop(1.00, "rgba(99, 70, 235, 0.0)");
  ctx.fillStyle = auraGrad;
  ctx.fill();

  // 2. 메인 화염/연기 덩어리 (용의 분노 고유 딥 인디고 & 블루-바이올렛 팔레트)
  const flamePts = getSacredBillowingFlamePoints(radius, seed, rollAngle, false);
  traceSacredBillowingContour(ctx, flamePts);

  const maxR = radius * 1.25;
  const flameGrad = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, maxR);
  if (smokeRatio < 0.4) {
    // [화염 상태: 비비드 딥 인디고 & 블루-바이올렛]
    flameGrad.addColorStop(0.00, "rgba(49, 16, 150, 0.98)");
    flameGrad.addColorStop(0.30, "rgba(67, 24, 195, 0.94)");
    flameGrad.addColorStop(0.65, "rgba(88, 48, 225, 0.82)");
    flameGrad.addColorStop(0.88, "rgba(109, 74, 240, 0.38)");
    flameGrad.addColorStop(1.00, "rgba(109, 74, 240, 0.0)");
  } else {
    // [연기 상태: 팽창하며 번지는 몽환적인 바이올렛/아이스 블루 스모크]
    const sAlpha = 1.0 - (smokeRatio - 0.4) * 0.5;
    flameGrad.addColorStop(0.00, `rgba(76, 29, 149, ${0.85 * sAlpha})`);
    flameGrad.addColorStop(0.35, `rgba(109, 40, 217, ${0.60 * sAlpha})`);
    flameGrad.addColorStop(0.70, `rgba(139, 92, 246, ${0.30 * sAlpha})`);
    flameGrad.addColorStop(1.00, "rgba(168, 85, 247, 0.0)");
  }
  ctx.fillStyle = flameGrad;
  ctx.fill();

  // 3. 중심 초고열 순백-아이시 코어
  const coreAlpha = Math.max(0.0, 1.0 - smokeRatio * 1.5);
  if (coreAlpha > 0.05) {
    const corePts = getSacredBillowingFlamePoints(radius, seed, rollAngle, true);
    traceSacredBillowingContour(ctx, corePts);

    const coreR = radius * 0.52;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 1.25);
    coreGrad.addColorStop(0.00, `rgba(255, 255, 255, ${0.98 * coreAlpha})`);
    coreGrad.addColorStop(0.30, `rgba(238, 248, 255, ${0.90 * coreAlpha})`);
    coreGrad.addColorStop(0.65, `rgba(165, 180, 252, ${0.60 * coreAlpha})`);
    coreGrad.addColorStop(0.85, `rgba(192, 132, 252, ${0.25 * coreAlpha})`);
    coreGrad.addColorStop(1.00, "rgba(192, 132, 252, 0.0)");
    ctx.fillStyle = coreGrad;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 성스러운불꽃 - 원에서 다방면으로 뿜어져 나오는 용의분노풍 연기 화염 분출
 * [유저 수정 요청 반영]:
 * 1. 불꽃이 시작부터 훨씬 큰 상태(26px -> 50px+)로 나오게
 * 2. 한 번에 다 나오는 게 아니라, 일정한 순서에 맞게 시차를 두고 불규칙하게 순차 분출
 * 3. 뿜어져 나온 후 훨씬 빠르게 페이드아웃되어 템포감 있고 경쾌하게 소산
 */
/**
 * 성스러운불꽃 - 다방면으로 뿜어져 나오는 용의분노풍 연기 화염 분출 (통합 1차+2차)
 * [유저 핵심 요청 3가지 완벽 반영]:
 * 1. [완전 불규칙 다방면 분출]: 시계방향 패턴 배제, 대각선 및 직교로 교차(Criss-Cross) 분출
 * 2. [텀(Gap) 완전 제거]: 1차(외곽)와 2차(핵) 분출이 0.34 부근에서 완벽히 오버랩 연결
 * 3. [페이드아웃 이후에도 분출]: 구체 소멸(0.46) 이후에도 핵 중심부에서 0.76+까지 분출 지속!
 */
function drawSacredFireUnifiedEruptions(
  ctx: any,
  cx: number,
  cy: number,
  circleRadius: number,
  comboProg: number, // 0.00 ~ 1.00 (Step 3 & Step 4 통합 연속 타임라인)
  time: number
) {
  if (comboProg < 0 || comboProg > 1.0) return;

  ctx.save();

  interface EruptionPlume {
    angle: number;
    delay: number;
    duration: number;
    maxDist: number;
    seed: number;
    isCore: boolean;
  }

  const allPlumes: EruptionPlume[] = [
    // -----------------------------------------------------------------------
    // [1차 분출: 외곽 원 둘레 분출] (comboProg 0.00 ~ 0.48)
    // -----------------------------------------------------------------------
    // 1번: 9시 방향 (좌측)
    { angle: -Math.PI * 0.95, delay: 0.00, duration: 0.18, maxDist: 105, seed: 5.5,  isCore: false },
    // 2번: 2시 방향 (우상단 대각 교차!)
    { angle: -Math.PI * 0.22, delay: 0.04, duration: 0.18, maxDist: 115, seed: 4.1,  isCore: false },
    // 3번: 6시 방향 (하단 수직 교차!)
    { angle:  Math.PI * 0.52, delay: 0.09, duration: 0.17, maxDist: 90,  seed: 9.8,  isCore: false },
    // 4번: 11시 방향 (좌상단 대각 교차!)
    { angle: -Math.PI * 0.72, delay: 0.13, duration: 0.18, maxDist: 110, seed: 2.7,  isCore: false },
    // 5번: 4시 방향 (우하단 대각 교차!)
    { angle:  Math.PI * 0.32, delay: 0.18, duration: 0.17, maxDist: 95,  seed: 10.4, isCore: false },
    // 6번: 8시 방향 (좌하단 교차!)
    { angle:  Math.PI * 0.78, delay: 0.22, duration: 0.17, maxDist: 90,  seed: 8.8,  isCore: false },
    // 7번: 1시 방향 (우상단 대각 교차!)
    { angle: -Math.PI * 0.15, delay: 0.27, duration: 0.18, maxDist: 115, seed: 14.1, isCore: false },
    // 8번: 12시 방향 (상단 수직 솟구침)
    { angle: -Math.PI * 0.50, delay: 0.31, duration: 0.18, maxDist: 125, seed: 1.2,  isCore: false },

    // -----------------------------------------------------------------------
    // [2차 분출: 구체의 핵 중심부 분출] (comboProg 0.34 ~ 1.00)
    // ※ 1차(0.31~)와 텀 없이 매끄럽게 오버랩 시작!
    // ※ 구체가 0.46에 완전 투명 소멸한 후에도 0.76+까지 빈 공간에서 분출 지속!
    // -----------------------------------------------------------------------
    // 9번: 5시 방향 (우하단 대각 교차!)
    { angle:  Math.PI * 0.38, delay: 0.34, duration: 0.23, maxDist: 115, seed: 16.2, isCore: true },
    // 10번: 10시 방향 (좌상단 대각 교차!)
    { angle: -Math.PI * 0.75, delay: 0.39, duration: 0.23, maxDist: 125, seed: 21.5, isCore: true },
    // 11번: 1시 방향 (우상단 대각 교차!) - 구체 완전 소멸(0.46) 시점
    { angle: -Math.PI * 0.20, delay: 0.45, duration: 0.24, maxDist: 130, seed: 26.8, isCore: true },
    // 12번: 8시 방향 (좌하단 대각 교차!) - 구체 소멸 후 빈 공간에서 폭발!
    { angle:  Math.PI * 0.72, delay: 0.51, duration: 0.24, maxDist: 105, seed: 32.1, isCore: true },
    // 13번: 12시 방향 (상단 수직 솟구침!) - 구체 소멸 후 폭발!
    { angle: -Math.PI * 0.50, delay: 0.57, duration: 0.25, maxDist: 140, seed: 37.4, isCore: true },
    // 14번: 6시 방향 (하단 수직 교차!) - 구체 소멸 후 폭발!
    { angle:  Math.PI * 0.50, delay: 0.63, duration: 0.24, maxDist: 105, seed: 42.7, isCore: true },
    // 15번: 9시 방향 (좌측 수평 교차!) - 구체 소멸 후 폭발!
    { angle: -Math.PI * 0.95, delay: 0.69, duration: 0.24, maxDist: 115, seed: 48.0, isCore: true },
    // 16번: 3시 방향 (우측 수평 피날레!) - 구체 소멸 후 폭발 및 소산!
    { angle: -Math.PI * 0.05, delay: 0.75, duration: 0.24, maxDist: 125, seed: 53.3, isCore: true },
  ];

  for (let pIdx = 0; pIdx < allPlumes.length; pIdx++) {
    const cfg = allPlumes[pIdx];
    const elapsed = comboProg - cfg.delay;
    if (elapsed <= 0 || elapsed >= cfg.duration) continue;

    const t = elapsed / cfg.duration; // 0.0 ~ 1.0
    const baseAngle = cfg.angle;

    // 1) 빠른 페이드아웃 (지수 곡선으로 뿜어져 나온 후 신속히 소산)
    const pAlpha = Math.pow(Math.max(0.0, 1.0 - t), 1.6);
    if (pAlpha <= 0.01) continue;

    // 2) 분출 이동 거리: 외곽 분출은 둘레에서, 핵 분출은 정중앙 핵에서 출발
    const startDist = cfg.isCore ? (circleRadius * 0.10) : (circleRadius * 0.90);
    const dist = startDist + Math.pow(t, 0.62) * cfg.maxDist;

    // 3) 난류 요동 및 열기 부력 상승
    const wave = Math.sin(t * Math.PI * 2.2 + pIdx * 1.7 + time * 2.5) * (5.0 * t);
    const nx = -Math.sin(baseAngle);
    const ny = Math.cos(baseAngle);
    const thermalRise = Math.pow(t, 1.25) * 16.0;

    const px = cx + Math.cos(baseAngle) * dist + nx * wave;
    const py = cy + Math.sin(baseAngle) * dist + ny * wave - thermalRise;

    // 4) 큼직한 덩어리감 (초기 28px -> 52px+ 거대 볼륨)
    const mainR = (cfg.isCore ? 28.0 : 26.0) + t * 24.0;
    const flightAngle = baseAngle + t * 0.8 + time * 1.5;
    const rollAngle = -time * 2.5 - pIdx * 1.2;

    // 5) 연기 전이도 (화염 -> 연기)
    const smokeRatio = Math.min(1.0, Math.max(0.0, (t - 0.15) / 0.60));

    // [메인 거대 화염/연기 퍼프]
    drawSacredBillowingFlamePuff(
      ctx,
      px,
      py,
      mainR,
      flightAngle,
      rollAngle,
      pAlpha,
      cfg.seed,
      smokeRatio
    );

    // [뒤따르는 서브 화염 덩어리]
    const tTrail = t - 0.14;
    if (tTrail > 0) {
      const trailDist = startDist + Math.pow(tTrail, 0.62) * (cfg.maxDist * 0.65);
      const trailX = cx + Math.cos(baseAngle) * trailDist + nx * (wave * 0.6);
      const trailY = cy + Math.sin(baseAngle) * trailDist + ny * (wave * 0.6) - (thermalRise * 0.6);
      const trailR = 19.0 + tTrail * 18.0;
      const trailAlpha = pAlpha * 0.82;

      drawSacredBillowingFlamePuff(
        ctx,
        trailX,
        trailY,
        trailR,
        flightAngle - 0.3,
        rollAngle + 1.5,
        trailAlpha,
        cfg.seed + 5,
        smokeRatio * 0.8
      );
    }

    // 6) 미세 불티 스파크
    if (t > 0.05 && t < 0.70) {
      const spAlpha = pAlpha * 0.9;
      for (let s = 0; s < 2; s++) {
        const spAngle = baseAngle + (s === 0 ? 0.38 : -0.38) + Math.sin(time * 3.0 + s) * 0.25;
        const spDist = dist + (s === 0 ? 12 : -8);
        const spX = cx + Math.cos(spAngle) * spDist;
        const spY = cy + Math.sin(spAngle) * spDist - thermalRise * 0.8;

        ctx.fillStyle = s === 0
          ? `rgba(238, 248, 255, ${spAlpha})`
          : `rgba(192, 132, 252, ${spAlpha})`;
        ctx.fillRect(spX - 1.2, spY - 1.2, 2.5, 2.5);
      }
    }
  }

  ctx.restore();
}

/**
 * 성스러운불꽃 - 후면 이펙트 (카메라 화면 고정 남색 배경 & 하단 일렁이는 푸른 화염 파도)
 */
export function drawSacredFireBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 1. 카메라 고정 화면 좌표계 기반 남색 배경 및 화면 하단 일렁이는 푸른 화염 파도/연기
  drawSacredNavyBlueFlamesBackground(ctx, frame, drawCtx.width, drawCtx.height);
}

/**
 * 성스러운불꽃 - 전면 타격 이펙트
 * (유저 요청:
 *  1. 두꺼운 안쪽이 파란 색깔 불꽃에 중심부 색깔인 링, 링의 외곽(안/밖)은 투명 그라데이션 적용
 *  2. 화면 밖 거대한 크기에서 시작하여 중간에 대상 포켓몬을 감쌀 때까지 수축
 *  3. 링 중간 원 안에는 대상 포켓몬이 들어가고, 그 순간 원 외곽의 모든 영역에 파란 색깔 필터 적용)
 */
export function drawSacredFireEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer;

  const targetBase = isP ? drawCtx.em : drawCtx.pm;
  const targetOffset = isP ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });
  const cx = targetBase.x + targetOffset.x;
  const cy = (targetBase.y - 36) + targetOffset.y; // 대상 포켓몬 몸체 정중앙

  const time = frame.flameTime !== undefined
    ? frame.flameTime
    : (step * 8.0 + prog * 8.0) * 0.42;

  // --------------------------------------------------------------------------
  // 1. 링 반경 및 수축 / 내부에서 밖으로 커지는 원 반경 계산
  // --------------------------------------------------------------------------
  const targetFinalRadius = 55; // 대상 포켓몬을 알맞게 감싸는 최종 일치 반경
  const startRadius = 380;       // 화면 밖 거대한 링 시작 반경

  let ringRadius = targetFinalRadius;
  let innerCircleRadius = 0;
  let innerCircleAlpha = 0;
  let ringAlpha = 1.0;
  let isContacted = false;

  // 네거티브 파동 진행도 (0.0: 두 원이 딱 일치하는 순간 ~ 1.0: 완전히 밖으로 퍼져서 소멸)
  let negWaveProg = -1; // -1: 미발동

  if (step === 1) {
    // [Step 1: 두 원의 동시 대칭 수렴/확장]
    const t = prog;
    const ease = 1 - Math.pow(1 - t, 2.5); // 매끄러운 가감속 일치 곡선

    // 1) 밖에서 안으로 줄어드는 거대한 링 (380px -> 55px)
    ringRadius = startRadius - ease * (startRadius - targetFinalRadius);

    // 2) 줄어드는 링 타이밍에 정확히 맞춰 내부에서 밖으로 커지는 원 (0px -> 55px)
    innerCircleRadius = ease * targetFinalRadius;
    innerCircleAlpha = Math.min(1.0, 0.4 + ease * 0.6);

    // 3) [유저 요청]: 닿는 순간(prog >= 0.94) 링은 사라지고, 원 변형 및 네거티브 점화!
    if (prog >= 0.94) {
      isContacted = true;
      ringAlpha = 0; // 닿는 순간 링은 완전히 사라짐
      negWaveProg = ((prog - 0.94) / 0.06) * 0.15; // 0.0 ~ 0.15
    }
  } else if (step === 2) {
    // [Step 2: 닿은 후 - 링은 완전 소멸, 원은 에너지 고조 유지 & 네거티브 파동 확산]
    isContacted = true;
    ringAlpha = 0; // 링 완전 소멸 유지
    innerCircleRadius = targetFinalRadius + 4 + Math.sin(time * 5.0) * 1.5;
    innerCircleAlpha = 1.0;

    if (prog <= 0.70) {
      negWaveProg = 0.15 + (prog / 0.70) * 0.85; // 0.15 ~ 1.00
    }
  } else if (step === 3 || step === 4) {
    isContacted = true;
    ringAlpha = 0;
    // comboProg: 0.00 ~ 1.00 (Step 3 & Step 4 통합 연속 타임라인)
    const comboProg = step === 3 ? prog * 0.45 : 0.45 + prog * 0.55;
    const baseSphereR = targetFinalRadius + 4;
    const shrinkStart = 0.18; // 1차 외곽 분출 중반부터 수축 시작
    const shrinkEnd = 0.46;   // 2차 핵 분출 시작(0.34) 직후 중심으로 완전 응축/소멸

    if (comboProg < shrinkStart) {
      innerCircleRadius = baseSphereR + (step === 3 ? Math.sin(time * 5.0) * 1.5 : 0);
      innerCircleAlpha = 1.0;
    } else if (comboProg < shrinkEnd) {
      // [유저 핵심 요청]: 페이드아웃 대신 크기가 작아지면서(중심으로 응축하며) 사라지게 연출
      const shrinkT = (comboProg - shrinkStart) / (shrinkEnd - shrinkStart);
      const shrinkScale = Math.max(0, Math.pow(1.0 - shrinkT, 1.4)); // 매끄러운 가속 수축 곡선
      innerCircleRadius = baseSphereR * shrinkScale;
      // 투명도로 페이드아웃하지 않고 크기가 0으로 줄어들어 소멸 (극미세 잔상 방지용 3px 이하만 0으로 정리)
      innerCircleAlpha = innerCircleRadius > 3.0 ? 1.0 : (innerCircleRadius / 3.0);
    } else {
      innerCircleRadius = 0;
      innerCircleAlpha = 0.0;
    }
  }

  // --------------------------------------------------------------------------
  // 2. [유저 핵심 요청: 원 렌더링]
  //    - 닿기 전: 중심부 순백 ➔ 중간 슬림 푸른빛 ➔ 외곽 보랏빛
  //    - 닿는 순간 & 이후: 링은 사라지고, 원은 보라색과 파란색이 섞인 색으로
  //      (흰색은 중앙에 남아있지만 좀 더 커짐, 외각 경계는 100% 완전 투명 그라데이션)
  // --------------------------------------------------------------------------
  if (innerCircleAlpha > 0.01 && innerCircleRadius > 1) {
    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * innerCircleAlpha;

    const curR = innerCircleRadius;
    const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, curR);

    if (!isContacted) {
      // [1] 닿기 전: 확장 단계 그라데이션 (흰색 영역 축소 & 보라/파랑 풍성화)
      innerGrad.addColorStop(0.00, "rgba(255, 255, 255, 1.00)");   // 중심부: 순백
      innerGrad.addColorStop(0.20, "rgba(255, 255, 255, 0.95)");   // 순백 영역 축소
      innerGrad.addColorStop(0.30, "rgba(238, 248, 255, 0.90)");   // 순백 ➔ 푸른빛 전이부
      innerGrad.addColorStop(0.42, "rgba(56, 189, 248, 0.88)");    // 중간 부분: 슬림 시안 블루 액센트
      innerGrad.addColorStop(0.55, "rgba(99, 102, 241, 0.85)");    // 푸른빛 ➔ 보랏빛 신속 전이
      innerGrad.addColorStop(0.68, "rgba(168, 85, 247, 0.92)");    // 선명한 네온 바이올렛/보랏빛
      innerGrad.addColorStop(0.82, "rgba(147, 51, 234, 0.88)");    // 깊은 로열 퍼플
      innerGrad.addColorStop(0.93, "rgba(126, 34, 206, 0.65)");    // 외곽 딥 바이올렛
      innerGrad.addColorStop(1.00, "rgba(88, 28, 135, 0.0)");      // 최외곽: 100% 투명 블렌드
    } else {
      // [2] 닿는 순간 & 이후:
      // [유저 요청]: "흰 색깔 영역 좀 줄여 주고" (0.50 -> 0.22로 대폭 축소)
      // 원은 보라색과 파란색이 섞인 색으로, 외각 경계는 100% 완전 투명 그라데이션
      innerGrad.addColorStop(0.00, "rgba(255, 255, 255, 1.00)");   // 중심부: 초고열 순백 코어
      innerGrad.addColorStop(0.22, "rgba(255, 255, 255, 0.95)");   // [요청]: 축소된 중앙 순백 코어
      innerGrad.addColorStop(0.32, "rgba(224, 242, 254, 0.90)");   // 순백 ➔ 보라/파랑 혼합 전이부
      innerGrad.addColorStop(0.48, "rgba(96, 165, 250, 0.90)");    // [요청]: 파란색과 보라색이 섞인 블루-바이올렛
      innerGrad.addColorStop(0.70, "rgba(139, 92, 246, 0.88)");    // 바이올렛-퍼플 혼합 바디
      innerGrad.addColorStop(0.88, "rgba(168, 85, 247, 0.55)");    // 외곽 보랏빛 안개
      innerGrad.addColorStop(1.00, "rgba(126, 34, 206, 0.00)");    // [요청]: 외각 경계 100% 완전 투명 그라데이션
    }

    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, curR, 0, Math.PI * 2);
    ctx.fill();

    // ------------------------------------------------------------------------
    // [유저 핵심 요청]: "트레인(프레임)마다 흰 색깔 영역이 울렁거리면서 다방면으로 화염처럼 느껴지게끔"
    // 다방면(12방향)으로 뻗어나가는 유기적 화염 형태의 순백 코어 폴리곤 & 화염 혓바닥
    // ------------------------------------------------------------------------
    if (curR > 8) {
      // 1) 12방향 울렁거리는 순백 화염 코어 (Organic Multi-directional White Flame Core)
      const numFlamePts = 12;
      const pts: { x: number; y: number }[] = [];

      for (let k = 0; k < numFlamePts; k++) {
        const baseAngle = (k / numFlamePts) * Math.PI * 2 + time * 1.8;
        // 고주파 노이즈와 삼각함수 합성으로 매 프레임 다방면으로 불규칙하게 요동치는 화염 실루엣
        const wobble1 = Math.sin(time * 7.5 + k * 2.3);
        const wobble2 = Math.cos(time * 11.2 + k * 4.1);
        const wobble3 = Math.sin(time * 16.0 + k * 1.5);
        // 홀수/짝수 인덱스에 따라 뾰족한 화염 첨두와 완만한 골 형성
        const isSpike = (k % 2 === 1);
        const flameRatio = isSpike ? 0.30 : 0.20;
        const ptR = curR * (flameRatio + wobble1 * 0.05 + wobble2 * 0.04 + wobble3 * 0.025);

        pts.push({
          x: cx + Math.cos(baseAngle) * ptR,
          y: cy + Math.sin(baseAngle) * ptR,
        });
      }

      // 부드러운 스플라인 곡선으로 다방면 화염 렌더링
      ctx.beginPath();
      ctx.moveTo((pts[0].x + pts[numFlamePts - 1].x) / 2, (pts[0].y + pts[numFlamePts - 1].y) / 2);
      for (let k = 0; k < numFlamePts; k++) {
        const next = pts[(k + 1) % numFlamePts];
        const midX = (pts[k].x + next.x) / 2;
        const midY = (pts[k].y + next.y) / 2;
        ctx.quadraticCurveTo(pts[k].x, pts[k].y, midX, midY);
      }
      ctx.closePath();

      const whiteCoreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, curR * 0.35);
      whiteCoreGrad.addColorStop(0.00, "rgba(255, 255, 255, 1.00)");
      whiteCoreGrad.addColorStop(0.60, "rgba(255, 255, 255, 0.95)");
      whiteCoreGrad.addColorStop(0.85, "rgba(240, 249, 255, 0.65)");
      whiteCoreGrad.addColorStop(1.00, "rgba(224, 242, 254, 0.00)");
      ctx.fillStyle = whiteCoreGrad;
      ctx.fill();

      // 2) 다방면으로 뿜어져 나오는 역동적인 화염 혓바닥 (Dancing Flame Licks)
      const numLicks = 8;
      for (let j = 0; j < numLicks; j++) {
        const lickAngle = (j / numLicks) * Math.PI * 2 + time * 3.2 + Math.sin(time * 5.0 + j) * 0.35;
        // 혓바닥이 중심에서 바깥쪽으로 치솟으며 요동
        const lickDist = curR * (0.23 + Math.sin(time * 8.0 + j * 2.5) * 0.09 + Math.cos(time * 13.0 + j) * 0.05);
        const lx = cx + Math.cos(lickAngle) * lickDist;
        const ly = cy + Math.sin(lickAngle) * lickDist;
        const lickSize = curR * (0.065 + Math.sin(time * 9.0 + j) * 0.025);

        if (lickSize > 0.5) {
          const lickGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lickSize);
          lickGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.98)");
          lickGrad.addColorStop(0.50, "rgba(238, 248, 255, 0.70)");
          lickGrad.addColorStop(1.00, "rgba(186, 230, 253, 0.00)");
          ctx.fillStyle = lickGrad;
          ctx.beginPath();
          ctx.arc(lx, ly, lickSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 3. [핵심 요청: 딱 일치하는 순간에 원 내부를 제외한 바깥쪽에 네거티브,
  //    안에서 밖으로 퍼지면서 사라지게 연출]
  // --------------------------------------------------------------------------
  if (negWaveProg >= 0 && negWaveProg <= 1.0) {
    ctx.save();
    ctx.globalCompositeOperation = "difference";

    // 원 내부(대상 포켓몬)는 100% 보존되는 컷아웃 반경
    const cutoutR = Math.max(10, targetFinalRadius - 4);

    // 안에서 밖으로 급속히 뻗어나가는 네거티브 파동 반경 (55px -> 550px)
    const outerWaveR = cutoutR + Math.pow(negWaveProg, 0.75) * 520;
    // 밖으로 퍼지면서 자연스럽게 페이드아웃되어 사라짐 (1.0 -> 0.0)
    const waveAlpha = Math.max(0, 1.0 - Math.pow(negWaveProg, 1.25));

    if (waveAlpha > 0.01 && outerWaveR > cutoutR) {
      ctx.beginPath();
      // 전체 캔버스 직사각형 (화면 전체 덮기)
      ctx.rect(-3000, -3000, 7000, 7000);
      // 원 내부를 제외 (반시계방향 컷아웃: 대상 포켓몬 영역은 절대 네거티브되지 않음)
      ctx.arc(cx, cy, cutoutR, 0, Math.PI * 2, true);

      // 안에서 밖으로 퍼져나가는 네거티브 그라데이션
      const negGrad = ctx.createRadialGradient(cx, cy, cutoutR, cx, cy, outerWaveR);
      negGrad.addColorStop(0.00, `rgba(255, 255, 255, ${waveAlpha * Math.max(0, 1.0 - negWaveProg * 1.5)})`);
      negGrad.addColorStop(0.50, `rgba(255, 255, 255, ${waveAlpha * 0.95})`);
      negGrad.addColorStop(0.85, `rgba(255, 255, 255, ${waveAlpha * 0.70})`);
      negGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

      ctx.fillStyle = negGrad;
      ctx.fill();
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 4. [보라색 불꽃 링: 중심부 초고열 순백, 외곽 안/밖 투명 그라데이션]
  // --------------------------------------------------------------------------
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * ringAlpha;

  // 링 두께 계산: 화면 밖 거대할 때는 웅장하게 두껍고, 대상에게 수축 시 밀도 높은 화염 두께 유지
  const flameThickness = 24 + (ringRadius / startRadius) * 24; // 24px ~ 48px
  // [유저 핵심 피드백 반영]: 링 안쪽 방향의 보라색/글로우 완전 제거!
  // 링의 안쪽 경계(rIn)를 순백 중심선(ringRadius) 바로 안쪽(1.5px 앤티앨리어싱)으로 밀착시켜
  // 안쪽 영역(r < ringRadius)에는 보라색이 0%도 존재하지 않도록 설정
  const rIn = Math.max(0.1, ringRadius - 1.5);
  const rOut = ringRadius + flameThickness;

  // [레이어 A: 바깥쪽 방향으로만 확산되는 은은한 외곽 퍼플 플레임 앰비언트 글로우]
  const glowIn = ringRadius;
  const glowOut = ringRadius + flameThickness * 1.5;
  const glowGrad = ctx.createRadialGradient(cx, cy, glowIn, cx, cy, glowOut);
  glowGrad.addColorStop(0.00, "rgba(168, 85, 247, 0.35)");
  glowGrad.addColorStop(0.45, "rgba(147, 51, 234, 0.16)");
  glowGrad.addColorStop(1.00, "rgba(126, 34, 206, 0.0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, glowOut, 0, Math.PI * 2);
  ctx.arc(cx, cy, glowIn, 0, Math.PI * 2, true);
  ctx.fill();

  // [레이어 B: 메인 보라색 화염 링 (안쪽은 순백 코어로 시작해 바깥쪽으로만 보라색 화염 전개)]
  const ringGrad = ctx.createRadialGradient(cx, cy, rIn, cx, cy, rOut);
  ringGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");      // 안쪽 경계: 1.5px 앤티앨리어싱
  ringGrad.addColorStop(0.03, "rgba(255, 255, 255, 1.00)");     // 링 안쪽 최전선: 초고열 순백 코어
  ringGrad.addColorStop(0.12, "rgba(243, 232, 255, 0.95)");     // 순백 ➔ 보라 전이
  ringGrad.addColorStop(0.35, "rgba(168, 85, 247, 0.88)");      // 바깥 화염 바디: 선명한 네온 바이올렛
  ringGrad.addColorStop(0.65, "rgba(147, 51, 234, 0.55)");      // 바깥: 딥 인디고 퍼플
  ringGrad.addColorStop(1.00, "rgba(88, 28, 135, 0.0)");        // 최외곽: 100% 완전 투명

  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, rOut, 0, Math.PI * 2);
  ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.restore();

  // --------------------------------------------------------------------------
  // 5. [유저 핵심 요청 3가지 완벽 연계]:
  //    1) 1차(외곽)와 2차(핵) 분출 사이에 텀이 전혀 없도록 comboProg(0.0 ~ 1.0) 기반 매끄러운 연속/오버랩 연결
  //    2) 시계 방향이 아닌, 대각선 및 직교로 교차(Criss-cross)하는 완전 불규칙 다방면 분출
  //    3) 구체 페이드아웃(0.46) 완료 이후에도 핵 분출이 지속되어 빈 공간에서 연기가 피어오르며 소산
  // --------------------------------------------------------------------------
  if (step === 3 || step === 4) {
    const comboProg = step === 3 ? prog * 0.45 : 0.45 + prog * 0.55;
    drawSacredFireUnifiedEruptions(
      ctx,
      cx,
      cy,
      targetFinalRadius,
      comboProg,
      time
    );
  }
}

// ============================================================================
// 🌍 222: 매그니튜드 (Magnitude / マグニチュード) - 땅 타입 물리 기술
//
// 위력: 10~150 (변동) / 명중: 100 / PP: 30 / 접촉: X
// 설명: 지면을 격렬하게 흔들어 공격한다. 4~10의 매그니튜드 수치에 따라 위력이 변화한다.
//
// [연출 기승전결 시퀀스]:
// 1. 기(起): 시전자 점프 발구르기(Stomp) ➔ 착지 순간 지면 충격파 링 확산
// 2. 승(承): 진동 시작! 지면을 가르는 거대한 균열선(Fissure Cracks)이 대상 진영으로 뻗어나감
// 3. 전(轉): 대상 발밑에서 융기하는 입체 암석 기둥 파편 대폭쇄 & 흙먼지 연무 분출 및 강한 지진 셰이크
// 4. 결(結): 잔해 파편 낙하 분쇄 및 흙먼지 가라앉으며 전장 안정화
// ============================================================================

const MAGNITUDE_PALETTE = {
  rockShadow: "#3E2723",
  rockBase: "#6D4C41",
  rockHighlight: "#A1887F",
  dustLight: "rgba(215, 204, 200, 0.45)",
  dustDark: "rgba(109, 76, 65, 0.35)",
  shockwave: "#D7CCC8",
};

/**
 * 매그니튜드 - 후면 이펙트
 * (유저 요청: 땅 갈라지는 균열선 연출 완전히 제거됨)
 */
export function drawMagnitudeBehindEffect(
  _ctx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 지면 균열선 제거됨 (no-op)
}

/**
 * 입체 다면체 바위 렌더링 헬퍼
 */
function drawPolygonalRock(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  rot: number,
  alpha = 1.0
) {
  if (alpha <= 0) return;
  ctx.save();
  if (alpha < 1.0) {
    ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  }
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // 상단 밝은 면
  ctx.fillStyle = MAGNITUDE_PALETTE.rockHighlight;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.85, -size * 0.25);
  ctx.lineTo(0, size * 0.3);
  ctx.lineTo(-size * 0.85, -size * 0.25);
  ctx.closePath();
  ctx.fill();

  // 좌측 중간면
  ctx.fillStyle = MAGNITUDE_PALETTE.rockBase;
  ctx.beginPath();
  ctx.moveTo(-size * 0.85, -size * 0.25);
  ctx.lineTo(0, size * 0.3);
  ctx.lineTo(-size * 0.5, size);
  ctx.lineTo(-size * 0.9, size * 0.4);
  ctx.closePath();
  ctx.fill();

  // 우측 그림자면
  ctx.fillStyle = MAGNITUDE_PALETTE.rockShadow;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.lineTo(size * 0.85, -size * 0.25);
  ctx.lineTo(size * 0.7, size * 0.7);
  ctx.lineTo(-size * 0.5, size);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

interface MagnitudeRockDef {
  size: number;
  startX: number;
  startY: number;
  peakX: number;
  peakY: number;
  landX: number;
  landY: number;
  tLand: number;
  baseRot: number;
  rotSpeed: number;
}

const MAGNITUDE_ROCKS: MagnitudeRockDef[] = [
  // 1. 극좌측 대형 바위: 공중 정점 찍고 왼쪽으로 크게 퍼지며 낙하
  {
    size: 16,
    startX: -15,
    startY: 8,
    peakX: -26,
    peakY: -72,
    landX: -76,
    landY: 22,
    tLand: 0.88,
    baseRot: 0.2,
    rotSpeed: 2.8,
  },
  // 2. 좌측 중형 바위: 높이 솟구친 후 좌측으로 퍼지며 낙하
  {
    size: 14,
    startX: -8,
    startY: 12,
    peakX: -16,
    peakY: -88,
    landX: -48,
    landY: 16,
    tLand: 0.80,
    baseRot: 1.1,
    rotSpeed: -3.2,
  },
  // 3. 좌측 내측 소형 바위
  {
    size: 10,
    startX: -4,
    startY: 15,
    peakX: -8,
    peakY: -62,
    landX: -26,
    landY: 20,
    tLand: 0.75,
    baseRot: 2.4,
    rotSpeed: 3.5,
  },
  // 4. 중앙 거대 바위: 최고 고도 도달 후 중앙부 착지
  {
    size: 20,
    startX: 0,
    startY: 5,
    peakX: 2,
    peakY: -96,
    landX: 8,
    landY: 18,
    tLand: 0.84,
    baseRot: 0.5,
    rotSpeed: -2.0,
  },
  // 5. 우측 내측 소형 바위
  {
    size: 11,
    startX: 5,
    startY: 14,
    peakX: 10,
    peakY: -65,
    landX: 28,
    landY: 21,
    tLand: 0.76,
    baseRot: 1.8,
    rotSpeed: -3.0,
  },
  // 6. 우측 중형 바위: 우측으로 퍼지며 낙하
  {
    size: 15,
    startX: 10,
    startY: 10,
    peakX: 18,
    peakY: -84,
    landX: 52,
    landY: 17,
    tLand: 0.82,
    baseRot: 2.9,
    rotSpeed: 3.4,
  },
  // 7. 극우측 대형 바위: 공중 정점 찍고 오른쪽으로 크게 퍼지며 낙하
  {
    size: 17,
    startX: 16,
    startY: 8,
    peakX: 28,
    peakY: -70,
    landX: 78,
    landY: 24,
    tLand: 0.90,
    baseRot: 0.8,
    rotSpeed: -2.6,
  },
];

/**
 * 매그니튜드 - 전면 이펙트 (지진 충격파, 솟구치는 암석 기둥, 퍼지며 낙하하는 바위 파편)
 */
export function drawMagnitudeEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer;

  const casterPos = isP ? drawCtx.pm : drawCtx.em;
  const targetPos = isP ? drawCtx.em : drawCtx.pm;

  // Step 1: 시전자 발구르기 충격파 링
  if (step === 1) {
    const cx = casterPos.x;
    const cy = casterPos.y + 15;

    ctx.save();
    const ringR = 15 + prog * 45;
    ctx.globalAlpha = Math.max(0, 1.0 - prog);
    ctx.strokeStyle = MAGNITUDE_PALETTE.shockwave;
    ctx.lineWidth = 3.5 * (1.0 - prog * 0.5);

    ctx.beginPath();
    ctx.ellipse(cx, cy, ringR, ringR * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Step 2: 지진 진동 및 대상 발밑 흙먼지 요동 (땅 갈라짐 없이 진동 전개)
  if (step === 2) {
    const cx = targetPos.x;
    const cy = targetPos.y + 12;

    ctx.save();
    // 대상 발밑 지진 진동 충격파 링
    const ringR = 15 + prog * 32;
    ctx.globalAlpha = Math.min(0.65, (1.0 - prog) * 0.8);
    ctx.strokeStyle = MAGNITUDE_PALETTE.shockwave;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(cx, cy, ringR, ringR * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 발밑에서 피어오르는 미세 흙먼지
    for (let i = 0; i < 4; i++) {
      const dustX = cx + ((i % 2 === 0 ? 1 : -1) * (10 + i * 7));
      const dustY = cy - prog * 16 + (i % 2) * 4;
      const dustSize = 8 + prog * 10;
      ctx.globalAlpha = Math.max(0, (1.0 - prog * 0.8) * 0.35);
      ctx.fillStyle = MAGNITUDE_PALETTE.dustLight;
      ctx.beginPath();
      ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Step 3: 암석 기둥 상공으로 솟구침 (Rising Phase - 공중 정점까지 도달)
  if (step === 3) {
    const cx = targetPos.x;
    const cy = targetPos.y + 10;

    ctx.save();
    // 1. 발밑 흙먼지 분출 구름
    const dustAlpha = Math.max(0, 1.0 - prog * 0.7);
    ctx.globalAlpha = dustAlpha;
    for (let i = 0; i < 5; i++) {
      const dAngle = (i * Math.PI) / 4 + 0.2;
      const dDist = 16 + prog * 30;
      const dx = cx + Math.cos(dAngle) * dDist;
      const dy = cy + Math.sin(dAngle) * (dDist * 0.45);

      const dGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, 18);
      dGrad.addColorStop(0.0, MAGNITUDE_PALETTE.dustLight);
      dGrad.addColorStop(0.7, MAGNITUDE_PALETTE.dustDark);
      dGrad.addColorStop(1.0, "rgba(0,0,0,0)");

      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.arc(dx, dy, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. 7개의 주 바위 기둥이 지면에서 공중 정점(Peak)으로 솟구쳐 오름
    const easeUp = 1 - Math.pow(1 - prog, 2);
    for (const r of MAGNITUDE_ROCKS) {
      const rx = cx + r.startX + (r.peakX - r.startX) * easeUp;
      const ry = cy + r.startY + (r.peakY - r.startY) * easeUp;
      const rot = r.baseRot + r.rotSpeed * prog;
      drawPolygonalRock(ctx, rx, ry, r.size, rot);
    }

    // 3. 함께 솟구치는 미세 자갈 파편
    for (let i = 0; i < 8; i++) {
      const pAngle = (i * Math.PI * 2) / 8;
      const pDist = prog * (28 + (i % 3) * 12);
      const px = cx + Math.cos(pAngle) * pDist;
      const py = cy + Math.sin(pAngle) * (pDist * 0.5) - prog * 35;

      ctx.fillStyle = i % 2 === 0 ? MAGNITUDE_PALETTE.rockBase : MAGNITUDE_PALETTE.rockHighlight;
      ctx.fillRect(px - 2, py - 2, 3, 3);
    }

    ctx.restore();
  }

  // Step 4: 바위가 사방으로 퍼지면서 낙하 (Falling & Spreading Phase)
  if (step === 4) {
    const cx = targetPos.x;
    const cy = targetPos.y + 10;

    ctx.save();

    // 1. 공중 정점 찍은 7개의 바위가 좌우로 넓게 퍼지며 가속 낙하
    for (const r of MAGNITUDE_ROCKS) {
      let curX = cx + r.peakX;
      let curY = cy + r.peakY;
      let rot = r.baseRot + r.rotSpeed;
      let alpha = 1.0;

      if (prog < r.tLand) {
        // 공중 낙하 중: 중력 가속(fallP^2) & 좌우 넓게 퍼짐(spreadEase)
        const fallP = prog / r.tLand;
        const gravityEase = fallP * fallP;
        const spreadEase = 1 - Math.pow(1 - fallP, 1.8);

        curX = cx + r.peakX + (r.landX - r.peakX) * spreadEase;
        curY = cy + r.peakY + (r.landY - r.peakY) * gravityEase;
        rot = r.baseRot + r.rotSpeed * (1.0 + fallP * 1.5);
      } else {
        // 지면 착지 완료: 퍼진 위치에 도달 후 충격 먼지 및 안정화
        const landProg = (prog - r.tLand) / (1.0 - r.tLand);
        curX = cx + r.landX;
        curY = cy + r.landY;
        rot = r.baseRot + r.rotSpeed * 2.5;

        // 개별 바위 착지 충격 흙먼지 퍼프
        if (landProg < 0.7) {
          const pDustR = 5 + landProg * 14;
          const pDustAlpha = Math.max(0, 1.0 - landProg / 0.7) * 0.5;
          ctx.save();
          ctx.globalAlpha = pDustAlpha;
          ctx.fillStyle = MAGNITUDE_PALETTE.dustLight;
          ctx.beginPath();
          ctx.arc(curX, curY + 2, pDustR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 스텝 후반부 자연스러운 페이드 침강
        if (prog > 0.78) {
          alpha = Math.max(0, 1.0 - (prog - 0.78) / 0.22);
        }
      }

      drawPolygonalRock(ctx, curX, curY, r.size, rot, alpha);
    }

    // 2. 바위와 함께 사방으로 튀어나가며 떨어지는 파편 자갈
    for (let i = 0; i < 12; i++) {
      const pAngle = (i * Math.PI) / 6 - Math.PI / 12;
      const pDist = prog * (55 + (i % 4) * 20);
      const px = cx + Math.cos(pAngle) * (pDist * 1.3);
      const py = cy + Math.sin(pAngle) * (pDist * 0.5) - (1.0 - prog) * 15 + (prog * prog) * 32;
      const pAlpha = Math.max(0, 1.0 - prog * 0.9);

      ctx.save();
      ctx.globalAlpha = pAlpha;
      ctx.fillStyle = i % 2 === 0 ? MAGNITUDE_PALETTE.rockBase : MAGNITUDE_PALETTE.rockHighlight;
      ctx.fillRect(px - 2, py - 2, 3, 3);
      ctx.restore();
    }

    ctx.restore();
  }
}

// ============================================================================
// 💥 223: 폭발펀치 (Dynamic Punch / ばくだんパンチ) - 격투 타입 물리 기술
//
// 위력: 100 / 명중: 50 / PP: 5 / 혼란: 100% 확정 / 접촉: O
// 설명: 혼신의 힘으로 펀치를 날려 공격한다. 맞은 상대는 반드시 100% 혼란 상태가 된다.
//
// [연출 기승전결 시퀀스]:
// 1. 기(起): 시전자 주먹에 붉고 뜨거운 격투 투기 오라 & 번뜩이는 파워 차징
// 2. 승(承): 상대 면전으로 찰나의 전광석화 쇄도 (돌진 속도선)
// 3. 전(轉): 거대 코믹 주먹 강타 '쾅!!' + 강렬한 만화풍 3단 폭발 버섯구름 & 충격파 링
// 4. 결(結): 피격 후 머리 위를 빙글빙글 회전하는 3D 노란 혼란의 별무리(Dizzy Stars) 각인
// ============================================================================

const DYNAMIC_PALETTE = {
  white: "#FFFFFF",
  punchYellow: "#FDE047",
  punchOrange: "#FB923C",
  punchRed: "#EF4444",
  deepRed: "#991B1B",
  dizzyGold: "#FACC15",
  shockRing: "rgba(254, 240, 138, 0.75)",
  smokeDark: "#374151",
};

/**
 * 🥊 기존 공식 정면 정권 주먹 스프라이트 (Comet Punch Fist / SVG Fallback)
 * - 005 메가톤펀치, 183 마하펀치, 146 잼잼펀치와 동일한 기존 펀치 기술 주먹 에셋 재사용
 */
function drawDynamicPunchClassicFist(
  ctx: any,
  cx: number,
  cy: number,
  scale: number,
  alpha: number,
  rot: number = 0
) {
  if (alpha <= 0.01 || scale <= 0.02) return;
  ctx.save();
  ctx.translate(cx, cy);
  if (rot !== 0) ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const cometFist = getCometPunchFistImg();
  if (cometFist) {
    const fw = cometFist.width;
    const fh = cometFist.height;
    ctx.drawImage(cometFist, -fw / 2, -fh / 2, fw, fh);
  } else {
    drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.5, 1.0);
  }
  ctx.restore();
}

interface DynamicBurstDef {
  spawn: number;     // 시작 progress (0.00, 0.14, 0.28, 0.42, 0.56)
  life: number;      // 지속 시간
  dx: number;        // 타격점 기준 오프셋 (왼쪽 -> 오른쪽 -> 왼쪽 -> 아래 -> 중앙)
  dy: number;
  fireMaxR: number;  // 화구 최대 반경 (살짝 축소하여 타격감 및 가시성 확보)
  isClimax: boolean; // 피날레 대폭발 여부
}

// 💥 유저 요청 엄수: 폭발 반경 살짝 줄이고, 왼쪽 -> 오른쪽 -> 왼쪽 -> 아래 터지고 마지막에 한 번 크게 대폭발!
const FIVE_BURSTS: DynamicBurstDef[] = [
  { spawn: 0.00, life: 0.28, dx: -22, dy: -6, fireMaxR: 36, isClimax: false }, // 1. 왼쪽
  { spawn: 0.14, life: 0.28, dx: 24, dy: -8, fireMaxR: 46, isClimax: false },  // 2. 오른쪽
  { spawn: 0.28, life: 0.28, dx: -20, dy: 10, fireMaxR: 56, isClimax: false }, // 3. 왼쪽
  { spawn: 0.42, life: 0.28, dx: 0, dy: 22, fireMaxR: 68, isClimax: false },   // 4. 아래
  { spawn: 0.56, life: 0.44, dx: 0, dy: 0, fireMaxR: 100, isClimax: true },    // 5. 마지막 한 번 크게! (중앙 피날레 대폭발)
];

/**
 * 3D 입체 각도 틸트 충격파 링 (자폭 고증)
 */
function drawDynamicShockwaveRing(
  ctx: any,
  cx: number,
  cy: number,
  r: number,
  alpha: number,
  tiltDeg: number = -18,
  scaleY: number = 0.54,
  lineWidth: number = 2.4
) {
  if (alpha <= 0.02 || r <= 2) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((tiltDeg * Math.PI) / 180);
  ctx.scale(1.0, scaleY);

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  grad.addColorStop(0.68, "rgba(255, 255, 255, 0.0)");
  grad.addColorStop(0.86, `rgba(254, 240, 138, ${alpha * 0.45})`);
  grad.addColorStop(0.96, `rgba(255, 255, 255, ${alpha * 0.75})`);
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.70})`;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 3D 입체 각도 타원형 폭발 방사선 (자폭 고증)
 */
function drawDynamicBlastShockLines(
  ctx: any,
  cx: number,
  cy: number,
  t: number,
  alpha: number,
  lineCount: number = 16,
  maxLen: number = 70
) {
  if (alpha <= 0.02) return;
  ctx.save();
  const tiltRad = (-18 * Math.PI) / 180;
  const cosT = Math.cos(tiltRad);
  const sinT = Math.sin(tiltRad);

  for (let i = 0; i < lineCount; i++) {
    const ang = (i / lineCount) * Math.PI * 2 + (i % 2) * 0.15;
    const innerDist = 14 + t * 35;
    const lineLen = (maxLen * 0.6 + ((i * 19) % (maxLen * 0.5))) * (0.8 + t * 1.4);
    const outerDist = innerDist + lineLen;

    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);
    const lx0 = cosA * innerDist;
    const ly0 = sinA * innerDist * 0.54;
    const lx1 = cosA * outerDist;
    const ly1 = sinA * outerDist * 0.54;

    const x0 = cx + (lx0 * cosT - ly0 * sinT);
    const y0 = cy + (lx0 * sinT + ly0 * cosT);
    const x1 = cx + (lx1 * cosT - ly1 * sinT);
    const y1 = cy + (lx1 * sinT + ly1 * cosT);

    const lineGrad = ctx.createLinearGradient(x0, y0, x1, y1);
    lineGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    lineGrad.addColorStop(0.35, "rgba(254, 240, 138, 0.10)");
    lineGrad.addColorStop(0.85, `rgba(255, 255, 255, ${alpha * 0.75})`);
    lineGrad.addColorStop(1.0, `rgba(249, 115, 22, ${alpha * 0.35})`);

    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = Math.max(1.0, (i % 3 === 0 ? 2.4 : 1.4) * (1.0 - t * 0.5));
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 다엽형 화염 버섯구름 화구 (자폭 고증 볼류메트릭 렌더러)
 */
function drawDynamicFireball(
  ctx: any,
  cx: number,
  cy: number,
  localT: number,
  fireMaxR: number,
  lobeCount: number = 8,
  riseY: number = 10
) {
  if (localT >= 0.90 || fireMaxR <= 2) return;
  const fireT = Math.min(1.0, localT / 0.48);
  const fireAlpha = localT < 0.38 ? 1.0 : Math.max(0, 1.0 - (localT - 0.38) / 0.52);
  const curR = fireMaxR * Math.sin(fireT * Math.PI * 0.5);
  const cyOff = cy - localT * riseY;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * fireAlpha;

  // 1. Ambient glow
  const ambGrad = ctx.createRadialGradient(cx, cyOff, 0, cx, cyOff, curR * 1.15);
  ambGrad.addColorStop(0.0, "rgba(254, 240, 138, 0.50)");
  ambGrad.addColorStop(0.42, "rgba(249, 115, 22, 0.28)");
  ambGrad.addColorStop(0.78, "rgba(239, 68, 68, 0.08)");
  ambGrad.addColorStop(1.0, "rgba(185, 28, 28, 0.0)");
  ctx.fillStyle = ambGrad;
  ctx.beginPath();
  ctx.arc(cx, cyOff, curR * 1.15, 0, Math.PI * 2);
  ctx.fill();

  // 2. Outer Fire Lobes
  for (let i = 0; i < lobeCount; i++) {
    const angle = (i / lobeCount) * Math.PI * 2 + localT * 0.8;
    const dist = curR * (0.48 + Math.sin(i * 2.3 + localT * 4) * 0.12);
    const lobeR = curR * (0.50 + Math.cos(i * 1.7) * 0.14);
    const lx = cx + Math.cos(angle) * dist;
    const ly = cyOff + Math.sin(angle) * (dist * 0.82);

    const fGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lobeR);
    fGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    fGrad.addColorStop(0.20, "rgba(254, 240, 138, 0.85)");
    fGrad.addColorStop(0.46, "rgba(249, 115, 22, 0.55)");
    fGrad.addColorStop(0.72, "rgba(239, 68, 68, 0.22)");
    fGrad.addColorStop(0.90, "rgba(185, 28, 28, 0.06)");
    fGrad.addColorStop(1.0, "rgba(153, 27, 27, 0.0)");

    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, Math.max(1, lobeR), 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Central White Plasma Core
  const coreR = curR * (localT < 0.25 ? 0.78 : 0.44);
  const coreGrad = ctx.createRadialGradient(cx, cyOff, 0, cx, cyOff, Math.max(1, coreR));
  coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  coreGrad.addColorStop(0.32, "rgba(254, 240, 138, 0.85)");
  coreGrad.addColorStop(0.62, "rgba(249, 115, 22, 0.35)");
  coreGrad.addColorStop(0.85, "rgba(239, 68, 68, 0.10)");
  coreGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cyOff, Math.max(1, coreR), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 흑연 연기 버섯구름 (자폭 고증 연막 플룸)
 */
function drawDynamicSmokePlumes(
  ctx: any,
  cx: number,
  cy: number,
  smokeT: number, // 0.0 ~ 1.0
  scale: number = 1.0
) {
  if (smokeT <= 0.0 || smokeT >= 1.0) return;
  const smokeAlpha = Math.sin((1.0 - smokeT) * Math.PI * 0.70) * 0.90;
  if (smokeAlpha <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * smokeAlpha;

  const SMOKE_PUFFS = [
    { xOff: 0, yOff: -32, r: 38 },
    { xOff: -26, yOff: -22, r: 32 },
    { xOff: 28, yOff: -24, r: 34 },
    { xOff: -16, yOff: -46, r: 30 },
    { xOff: 18, yOff: -48, r: 32 },
    { xOff: 0, yOff: -60, r: 28 },
    { xOff: -34, yOff: -10, r: 26 },
    { xOff: 36, yOff: -12, r: 28 },
  ];

  for (let i = 0; i < SMOKE_PUFFS.length; i++) {
    const puff = SMOKE_PUFFS[i];
    const curR = puff.r * (0.65 + smokeT * 0.75) * scale;
    const px = cx + puff.xOff * (1.0 + smokeT * 0.45) * scale;
    const py = cy + (puff.yOff - smokeT * 32) * scale;

    const smGrad = ctx.createRadialGradient(px, py - curR * 0.1, 0, px, py, curR);
    smGrad.addColorStop(0.0, "rgba(107, 114, 128, 0.80)");
    smGrad.addColorStop(0.35, "rgba(75, 85, 99, 0.50)");
    smGrad.addColorStop(0.68, "rgba(55, 65, 81, 0.22)");
    smGrad.addColorStop(0.88, "rgba(31, 41, 55, 0.06)");
    smGrad.addColorStop(1.0, "rgba(17, 24, 39, 0.0)");

    ctx.fillStyle = smGrad;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1, curR), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 폭발펀치 - 후면 이펙트 (5연속 폭발 시점 연동 배경 섬광)
 */
export function drawDynamicPunchBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer;
  const targetPos = isP ? drawCtx.em : drawCtx.pm;

  // Step 3: 5연속 폭발 각각의 기폭 순간마다 번쩍이는 스타카토 배경 섬광
  if (step === 3 && prog >= 0.00 && prog < 0.98) {
    let maxFlash = 0;
    let flashR = 75;

    for (const b of FIVE_BURSTS) {
      if (prog >= b.spawn && prog <= b.spawn + b.life) {
        const localT = (prog - b.spawn) / b.life;
        const pulse = Math.sin(localT * Math.PI);
        const intensity = pulse * (b.isClimax ? 0.65 : 0.35);
        if (intensity > maxFlash) {
          maxFlash = intensity;
          flashR = b.isClimax ? 120 : (45 + b.fireMaxR * 0.7);
        }
      }
    }
    if (maxFlash <= 0.02) return;

    ctx.save();
    ctx.globalAlpha = Math.min(0.68, maxFlash);

    const grad = ctx.createRadialGradient(targetPos.x, targetPos.y - 10, 8, targetPos.x, targetPos.y - 10, flashR);
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.25, "rgba(254, 240, 138, 0.80)");
    grad.addColorStop(0.60, "rgba(249, 115, 22, 0.45)");
    grad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(targetPos.x, targetPos.y - 10, flashR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * 폭발펀치 - 전면 이펙트
 * - Step 1: 상대 면전으로 초고속 돌진 쇄도
 * - Step 2: [유저 요청 엄수] 주먹 발사 단독 프레임 (폭발 없이 주먹 확실히 가시화)
 * - Step 3: [1프레임 뒤 타격점 연쇄 폭발 시작] 총 5회 연속 고조 폭발 (펑! 펑! 펑! 펑! 펑!)
 * - Step 4: [기존 공용 혼란 애니메이션] 100% 확정 혼란 3D 별무리(drawConfusionEffect) 공전
 */
export function drawDynamicPunchEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer;

  const targetPos = isP ? drawCtx.em : drawCtx.pm;
  const dir = isP ? 1 : -1;

  // Step 1: 돌진 쇄도
  if (step === 1) {
    return;
  }

  // =========================================================================
  // Step 2: [유저 요청 엄수]: 주먹 발사 & 직격 단독 연출 (폭발 없이 주먹 가시성 100% 확보)
  // =========================================================================
  if (step === 2) {
    const punchProg = frame.fistProg ?? frame.effectProgress ?? 1.0;
    const cx = targetPos.x;
    const cy = targetPos.y - 10;

    ctx.save();

    if (punchProg < 0.7) {
      // 1) 주먹 발사 (Launch): 시전자에서 목표로 쇄도하는 주먹 + 후방 속도선
      const startX = (isP ? drawCtx.pm.x : drawCtx.em.x) + dir * 38;
      const curX = startX + (cx - startX) * 0.72;

      // 주먹 추진 속도선
      ctx.save();
      ctx.strokeStyle = "rgba(254, 240, 138, 0.75)";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(curX - dir * 32, cy);
      ctx.lineTo(curX - dir * 4, cy);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(curX - dir * 24, cy - 4);
      ctx.lineTo(curX - dir * 2, cy - 4);
      ctx.moveTo(curX - dir * 24, cy + 4);
      ctx.lineTo(curX - dir * 2, cy + 4);
      ctx.stroke();
      ctx.restore();

      // 전진하는 정권 주먹
      drawDynamicPunchClassicFist(ctx, curX, cy, 0.95, 1.0, dir * 0.05);
    } else {
      // 2) 주먹 직격 (Impact): 상대 정면에 100% 선명하게 꽂힘!
      // ⚠️ 주먹을 가리는 스타버스트 완전 배제! 주먹 뒤편 은은한 타격 링만 출력
      ctx.save();
      ctx.strokeStyle = "rgba(254, 240, 138, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 기존 공식 주먹 에셋이 최상단에 100% 선명하게 노출!
      drawDynamicPunchClassicFist(ctx, cx, cy, 1.05, 1.0, dir * 0.08);
    }

    ctx.restore();
    return;
  }

  // =========================================================================
  // Step 3: [유저 요청 엄수]: 주먹 발사 후 정확히 1프레임 뒤 타격점 연쇄 폭발!
  // - 1차(직격 점화) -> 2차 -> 3차 -> 4차 -> 5차(자폭급 피날레 대폭발)
  // =========================================================================
  if (step === 3) {
    const cx = targetPos.x;
    const cy = targetPos.y - 10; // 타격 중심점 (상대 상체)

    ctx.save();

    // 1. 꽂혀있던 주먹이 1차 폭발 화염 속으로 자연스럽게 페이드아웃 (prog < 0.15)
    if (prog < 0.15) {
      const punchAlpha = Math.max(0, 1.0 - prog / 0.15);
      drawDynamicPunchClassicFist(ctx, cx, cy, 0.92, punchAlpha * 0.85, dir * 0.08);
    }

    // 2. 타격 중심점에서 연속 기폭하는 5단계 연쇄 폭발 (펑! 펑! 펑! 펑! 펑!)
    for (let i = 0; i < FIVE_BURSTS.length; i++) {
      const b = FIVE_BURSTS[i];
      if (prog >= b.spawn && prog <= b.spawn + b.life) {
        const localT = (prog - b.spawn) / b.life;
        const bx = cx + b.dx;
        const by = cy + b.dy;

        if (!b.isClimax) {
          // 1~4차 폭발: 타격점 중심의 고속 압축 충격파 & 화염 폭쇄
          // 1) 3D 입체 각도 틸트 충격파 링 (-18도)
          const ringR = 12 + localT * (b.fireMaxR * 1.35);
          const ringAlpha = Math.max(0, Math.sin((1.0 - localT) * Math.PI * 0.85));
          drawDynamicShockwaveRing(ctx, bx, by, ringR, ringAlpha * 0.85, -18, 0.54, 2.0);

          // 2) 기폭 순간 스타버스트 섬광
          if (localT < 0.32) {
            const sAlpha = 1.0 - localT / 0.32;
            drawStarburstImpact(ctx, bx, by, DYNAMIC_PALETTE.punchOrange, DYNAMIC_PALETTE.white, (b.fireMaxR * 0.5) * sAlpha);
          }

          // 3) 중심 화구 (자폭 고증 다엽형 화염구)
          drawDynamicFireball(ctx, bx, by, localT, b.fireMaxR, 8, 8);

          // 4) 3D 방사선 (8방향)
          if (localT < 0.60) {
            const lineAlpha = Math.sin((1.0 - localT / 0.60) * Math.PI);
            drawDynamicBlastShockLines(ctx, bx, by, localT, lineAlpha * 0.70, 8, b.fireMaxR * 0.8);
          }
        } else {
          // 5차 피날레 대폭발: 진정한 자폭(Self-Destruct) 스타일의 거대 초신성 대폭발!
          // 1) 2중 3D 입체 각도 충격파 링 (공중 -18도 대형 링 + 지면 +6도 수평 링)
          const ring1R = 20 + localT * 135;
          const waveAlpha = Math.max(0, Math.sin((1.0 - localT) * Math.PI * 0.90));
          drawDynamicShockwaveRing(ctx, bx, by - 4, ring1R, waveAlpha * 0.95, -18, 0.54, 2.8);

          if (localT > 0.05) {
            const ring2R = ring1R - 20;
            if (ring2R > 10) {
              drawDynamicShockwaveRing(ctx, bx, by + 10, ring2R, waveAlpha * 0.70, 6, 0.44, 2.0);
            }
          }

          // 2) 3D 입체 각도 16방향 폭발 방사선 (안쪽 투명 -> 바깥쪽 선명)
          if (localT > 0.02 && localT < 0.85) {
            const lineAlpha = Math.sin((1.0 - (localT - 0.02) / 0.83) * Math.PI);
            drawDynamicBlastShockLines(ctx, bx, by, localT, lineAlpha * 0.90, 16, 75);
          }

          // 3) 거대 10-로브 화염 버섯구름 화구
          drawDynamicFireball(ctx, bx, by, localT, b.fireMaxR, 10, 16);

          // 4) 치솟는 8개 흑연 연기 버섯구름 (Billowing Charcoal Smoke Plumes)
          if (localT > 0.25) {
            const smokeT = (localT - 0.25) / 0.75;
            drawDynamicSmokePlumes(ctx, bx, by, smokeT, 0.95);
          }
        }
      }
    }

    ctx.restore();
  }

  // Step 4: [유저 요청] 기존 공용 혼란(Confusion) 애니메이션(drawConfusionEffect) 재사용
  if (step === 4) {
    const confProg = frame.confusionProgress ?? (0.15 + prog * 0.95);
    if (confProg > 0 && confProg <= 1.25) {
      const targetX = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
      const targetY = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));
      drawConfusionEffect(ctx, targetX, targetY - 28, confProg);
    }
  }
}

// ============================================================================
// ============================================================================
// 🪲 224: 메가혼 (Megahorn / メガホーン) - 벌레 타입 물리 기술
//
// 위력: 120 / 명중: 85 / PP: 10 / 접촉: O
// 설명: 단단하고 훌륭한 뿔로 마음껏 상대를 꿰찔러서 공격한다. (헤라크로스 상징기)
//
// [연출 기승전결 시퀀스 - 유저 요청 반영]:
// 1. 기(起): 박치기 도움닫기 웅크림 (뿔 준비 없음! 발밑 지면 마찰 먼지만 표현)
// 2. 승(承): 상대 진영으로 음속의 저공 쇄도 박치기 & 이마에 거대 에메랄드 메가혼 출현!
// 3. 전(轉): 상대 정면 머리 격돌 & 뿔 꿰찌르기 직격 + 치솟는 거대 초승달 참격 절단파 & 에메랄드 키틴질 파편 폭쇄!
// 4. 결(結): 충돌 반동 안정 착지 및 제자리 복귀
// ============================================================================

const MEGAHORN_PALETTE = {
  white: "#FFFFFF",
  hornHighlight: "#ECFCCB",
  hornLime: "#A3E635",
  hornEmerald: "#22C55E",
  hornDeepGreen: "#15803D",
  sparkSilver: "#E2E8F0",
  cutTrail: "rgba(163, 230, 53, 0.4)",
};

/**
 * 어두운 뿔드릴 뿔 (드릴날 X, 중심선 X, 그라데이션 X, [유저 요청] 뿔을 감싸는 주황빛 오라)
 * - 뿔드릴 특유의 날렵한 원뿔 & 둥근 베이스 캡 실루엣 (Conical Body with Rounded Base Cap)
 * - 드릴날(나선 스크류 홈) 완전히 없음
 * - 중심선(하이라이트 능선) 완전히 없음
 * - 그라데이션 없이 어두운 뿔드릴 고유의 솔리드 다크 메탈릭 슬레이트 컬러 채움
 * - 뿔 앞부분 사각형/스파클 완전히 제거
 * - 뿔을 역동적으로 감싸는 주황빛 타오르는 에너지 오라 (Orange Aura Enveloping Horn)
 */
function drawMegahornDarkHorn(
  ctx: any,
  cx: number,
  cy: number,
  scale: number,
  angle: number,
  alpha: number = 1.0,
  showOrangeAura: boolean = true
) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const length = 56;
  const baseRadius = 16;

  // =========================================================================
  // 1. [유저 요청] 뿔의 배경을 감싸는 에너지 파장 (Horn Background Energy Shroud & Wavefronts)
  // - 직선/기류선 완전 제거!
  // - 뿔의 형태 전체를 뒤 배경에서 유선형으로 포근하고 역동적으로 감싸는 에너지 플라즈마 필드
  // =========================================================================
  if (showOrangeAura) {
    ctx.save();

    // 1-1. [유저 요청] 뿔의 배경을 감싸는 유선형 에너지 파장 필드 (Enveloping Background Shroud)
    // 뿔의 원뿔 형태를 따라 뒤쪽 배경에 풍성하게 감싸는 다층 주황 플라즈마 슈라우드
    const shroudGrad = ctx.createLinearGradient(length + 8, 0, -20, 0);
    shroudGrad.addColorStop(0.0, "rgba(254, 240, 138, 0.85)"); // 첨두 골드
    shroudGrad.addColorStop(0.35, "rgba(251, 146, 60, 0.60)"); // 중앙 앰버 오렌지
    shroudGrad.addColorStop(0.70, "rgba(249, 115, 22, 0.38)"); // 외곽 오렌지 파장
    shroudGrad.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");    // 후방 소산

    ctx.fillStyle = shroudGrad;
    ctx.beginPath();
    ctx.moveTo(length + 8, 0);
    // 뿔 상단을 넉넉하게 감싸는 상단 베지어
    ctx.quadraticCurveTo(length * 0.45, -(baseRadius + 12), -16, -(baseRadius + 16));
    // 뿔 뒤쪽 베이스 캡 뒤를 둥글게 감쌈
    ctx.quadraticCurveTo(-26, 0, -16, baseRadius + 16);
    // 뿔 하단을 넉넉하게 감싸는 하단 베지어
    ctx.quadraticCurveTo(length * 0.45, baseRadius + 12, length + 8, 0);
    ctx.closePath();
    ctx.fill();

    // 1-2. 뿔의 배경을 타고 뒤로 펼쳐지는 2중 마하 충격파면 (Backdrop Mach Shock Wavefronts)
    const bowLayers = [
      { tipX: length + 4, backX: -16, spreadY: baseRadius + 12, width: 2.2 },
      { tipX: length + 10, backX: -24, spreadY: baseRadius + 20, width: 1.5 },
    ];

    for (const b of bowLayers) {
      const grad = ctx.createLinearGradient(b.tipX, 0, b.backX, 0);
      grad.addColorStop(0.0, "rgba(254, 240, 138, 0.95)"); // 밝은 백금/골드 첨두 압축점
      grad.addColorStop(0.35, "rgba(251, 146, 60, 0.85)"); // 선명한 앰버 오렌지
      grad.addColorStop(0.70, "rgba(249, 115, 22, 0.40)"); // 오렌지 파장
      grad.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");    // 후방 소산 페이드

      ctx.strokeStyle = grad;
      ctx.lineWidth = b.width;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(b.tipX, 0);
      ctx.quadraticCurveTo(b.tipX * 0.4, -b.spreadY * 0.4, b.backX, -b.spreadY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(b.tipX, 0);
      ctx.quadraticCurveTo(b.tipX * 0.4, b.spreadY * 0.4, b.backX, b.spreadY);
      ctx.stroke();
    }

    // 1-3. 뿔 표면을 타고 흐르는 3단 횡파 에너지 리브 (Transverse Wavefront Ripples `) )`)
    const rippleSteps = [
      { x: length * 0.72, r: baseRadius * 0.42, w: 2.0, a: 0.85 },
      { x: length * 0.44, r: baseRadius * 0.72, w: 1.8, a: 0.70 },
      { x: length * 0.16, r: baseRadius * 1.05, w: 1.5, a: 0.50 },
    ];

    for (const rip of rippleSteps) {
      const rGrad = ctx.createLinearGradient(rip.x + 4, 0, rip.x - 6, 0);
      rGrad.addColorStop(0.0, `rgba(254, 240, 138, ${rip.a})`);
      rGrad.addColorStop(0.6, `rgba(249, 115, 22, ${rip.a * 0.7})`);
      rGrad.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");

      ctx.strokeStyle = rGrad;
      ctx.lineWidth = rip.w;
      ctx.beginPath();
      ctx.moveTo(rip.x - 4, -rip.r * 1.25);
      ctx.quadraticCurveTo(rip.x + 4, 0, rip.x - 4, rip.r * 1.25);
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // 2. 어두운 뿔드릴 원뿔 외곽선 및 베이스 캡 (3D 입체 다크 슬레이트 아웃라인)
  // =========================================================================
  ctx.beginPath();
  ctx.moveTo(length, 0); // 날카로운 원뿔 침 끝단
  ctx.lineTo(0, -baseRadius);
  ctx.quadraticCurveTo(-9, 0, 0, baseRadius); // 둥근 3D 베이스 캡
  ctx.lineTo(length, 0);
  ctx.closePath();
  ctx.fillStyle = "#0F172A"; // Darkest slate border
  ctx.fill();

  // =========================================================================
  // 3. 3D 원주형 입체 조명 (3D Cylindrical Metallic Shading - 뿔드릴 고유 입체감)
  // - 상단 림 라이트 -> 부드러운 금속 광택선 -> 짙은 미드톤 슬레이트 -> 하단 그림자 음영
  // =========================================================================
  const bodyGrad = ctx.createLinearGradient(0, -baseRadius, 0, baseRadius);
  bodyGrad.addColorStop(0.0, "#475569");  // 상단 부드러운 림 라이트
  bodyGrad.addColorStop(0.22, "#94A3B8"); // 상단 3D 원통형 곡면 반사광 (Specular)
  bodyGrad.addColorStop(0.38, "#64748B"); // 중간 하이라이트 전환
  bodyGrad.addColorStop(0.65, "#334155"); // 어두운 뿔드릴 고유의 딥 슬레이트 바디 코어
  bodyGrad.addColorStop(0.85, "#1E293B"); // 하단 입체 그림자
  bodyGrad.addColorStop(1.0, "#0F172A");  // 최하단 앰비언트 오클루전

  ctx.beginPath();
  ctx.moveTo(length - 2.5, 0);
  ctx.lineTo(1.8, -baseRadius + 2.0);
  ctx.quadraticCurveTo(-7, 0, 1.8, baseRadius - 2.0);
  ctx.lineTo(length - 2.5, 0);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // =========================================================================
  // 4. 3D 원뿔 곡면 스펙큘러 라이트 (Curved Surface Specular Highlight)
  // - 상단 3D 곡면을 타고 흐르는 은은한 금속성 광택
  // =========================================================================
  const sheenGrad = ctx.createLinearGradient(0, 0, length, 0);
  sheenGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.08)");
  sheenGrad.addColorStop(0.40, "rgba(203, 213, 225, 0.50)");
  sheenGrad.addColorStop(0.80, "rgba(203, 213, 225, 0.20)");
  sheenGrad.addColorStop(1.0, "rgba(203, 213, 225, 0.0)"); // 끝단 투명 페이드 (흰색 점 없음)

  ctx.strokeStyle = sheenGrad;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(2, -baseRadius * 0.32);
  ctx.lineTo(length - 4, -baseRadius * 0.08);
  ctx.stroke();

  ctx.restore();
}

/**
 * 메가혼 - 후면 이펙트
 * - Step 2: [유저 요청] 배경필터 바탕 붉은색 (카메라 대상 포커싱 쇄도 단계)
 * - Step 3: [유저 요청] 타격 직후 이미 암전된 화면에서 서서히 암전이 풀림
 */
export function drawMegahornBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;

  // Step 2: 타격 전에는 어떠한 붉은 필터나 암전도 일절 없음! (원래 배틀 필드 유지)
  if (step === 2) {
    return;
  }

  // Step 3: [유저 요청] 암전 대신 타격 직후 붉은 반투명 페이드인 ➔ 페이드아웃
  if (step === 3) {
    ctx.save();

    // [유저 요청] 붉은 반투명 필터 페이드인 ➔ 페이드아웃
    // - prog < 0.08: 타격 직격 순간 (필터 0, 원래 화면에서 뿔 꽂힘과 초록 참격이 선명하게 노출!)
    // - prog 0.08 ~ 0.35: 타격 직후 붉은 반투명이 부드럽고 묵직하게 화면 가득 페이드인 (0.0 -> 0.70)
    // - prog 0.35 ~ 0.55: 붉은 반투명 피크 유지 (0.70)
    // - prog 0.55 ~ 1.0: 붉은 반투명이 서서히 페이드아웃 (0.70 -> 0.0)
    let redAlpha = 0;
    if (prog < 0.08) {
      redAlpha = 0;
    } else if (prog < 0.35) {
      // Fade-in
      const inP = (prog - 0.08) / 0.27;
      redAlpha = 0.70 * Math.sin(inP * Math.PI * 0.5);
    } else if (prog < 0.55) {
      // Peak hold
      redAlpha = 0.70;
    } else {
      // Fade-out
      const outP = (prog - 0.55) / 0.45;
      redAlpha = Math.max(0, 0.70 * (1.0 - outP));
    }

    if (redAlpha > 0.01) {
      ctx.fillStyle = `rgba(225, 20, 20, ${redAlpha})`;
      ctx.fillRect(-6000, -6000, 14000, 14000);
    }

    ctx.restore();
  }
}

/**
 * 메가혼 - 전면 이펙트 (박치기 쇄도 시 뿔 출현, 정면 직격 & 참격 파편 폭발)
 */
export function drawMegahornEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer;

  const casterPos = isP ? drawCtx.pm : drawCtx.em;
  const targetPos = isP ? drawCtx.em : drawCtx.pm;
  const dir = isP ? 1 : -1;

  const actOff = isP ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
  const curCasterX = casterPos.x + actOff.x;
  const curCasterY = casterPos.y + actOff.y;
  const hornAngle = isP ? -0.46 : 2.68;

  // =========================================================================
  // Step 1: 기(起) - 박치기 도움닫기 웅크림 (유저 요청: 뿔 준비 없음!)
  // - 시전자가 자세를 낮추며 뒤로 당겨질 때 발밑에 일어나는 지면 마찰 흙먼지만 은은하게 표현
  // =========================================================================
  if (step === 1) {
    ctx.save();
    const footY = curCasterY + (isP ? 22 : 16);
    for (let i = 0; i < 3; i++) {
      const dX = curCasterX - dir * (6 + i * 8 + prog * 10);
      const dY = footY + (i % 2) * 2;
      const dR = (3 + i * 1.8) * (1.0 - prog * 0.35);
      const alpha = Math.max(0, (1.0 - prog * 0.7) * 0.45);

      ctx.fillStyle = `rgba(168, 152, 120, ${alpha})`;
      ctx.beginPath();
      ctx.arc(dX, dY, dR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // =========================================================================
  // Step 2: 승(承) - [유저 요청] 대상 포커싱 다중 주황빛 수축 링 & 거대 뿔 돌진!
  // - [유저 요청] 링 여러 개, 간격은 좀 있는 수축 링:
  //   * 3중 동심 링 (간격 34px)
  //   * 조금 두꺼운 주황링 (lineWidth 5.2 ~ 3.6px)
  //   * 바깥은 투명, 안쪽은 반투명 주황빛
  // - 시전자 뿔을 감싸는 주황빛 에너지 & 어두운 뿔드릴 뿔 돌진
  // =========================================================================
  if (step === 2) {
    // 1. [유저 요청] 대상 포켓몬을 중심으로 줄어드는 다중 주황빛 링 (간격 있는 3중 링)
    ctx.save();
    const targetX = targetPos.x;
    const targetY = targetPos.y;

    // 기준 수축 반경 (타겟에 부드럽게 감속하며 착 감김)
    const startR = 105;
    const endR = 32;
    const shrinkEase = Math.pow(prog, 0.75);
    const baseR = startR - (startR - endR) * shrinkEase;

    // [유저 요청] 넉넉한 간격(34px)을 둔 다중 동심 링 설정
    const ringConfigs = [
      { offset: 0,  lineWidth: 5.2, alpha: 1.0,  hasFill: true,  goldWidth: 1.6 }, // 안쪽 메인 링
      { offset: 34, lineWidth: 4.4, alpha: 0.85, hasFill: false, goldWidth: 1.2 }, // 중간 링
      { offset: 68, lineWidth: 3.6, alpha: 0.60, hasFill: false, goldWidth: 0.0 }, // 바깥 링
    ];

    for (const cfg of ringConfigs) {
      const curR = baseR + cfg.offset;
      ctx.save();
      ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * cfg.alpha;

      // 안쪽은 반투명 (가장 안쪽 링 내부를 반투명 주황빛으로 채움)
      if (cfg.hasFill) {
        ctx.beginPath();
        ctx.arc(targetX, targetY, curR, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(249, 115, 22, 0.24)";
        ctx.fill();
      }

      // 주황링은 조금 두껍고 (바깥은 투명)
      ctx.strokeStyle = "#F97316";
      ctx.lineWidth = cfg.lineWidth;
      ctx.shadowColor = "#EA580C";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(targetX, targetY, curR, 0, Math.PI * 2);
      ctx.stroke();

      // 주황링 코어 하이라이트 골드 라인
      if (cfg.goldWidth > 0) {
        ctx.strokeStyle = "rgba(254, 240, 138, 0.85)";
        ctx.lineWidth = cfg.goldWidth;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(targetX, targetY, curR, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();

    // 2. 박치기 돌진 뿔 (뿔 배경을 감싸는 에너지 파장 & 어두운 뿔드릴 뿔)
    const headX = curCasterX + (isP ? 44 : -42);
    const headY = curCasterY + (isP ? -22 : 18);
    const hornScale = 1.10 + prog * 0.20;

    // 뿔 앞부분 사각형 없이 순수 어두운 뿔드릴 뿔 + 뿔을 감싸는 주황빛 오라 렌더링
    drawMegahornDarkHorn(ctx, headX, headY, hornScale, hornAngle, 1.0, true);
    return;
  }

  // =========================================================================
  // Step 3: 전(轉) - [유저 요청] 링이 밖으로 퍼지면서 암전 해제 & 머리 격돌 직격 대폭발!
  // - 1) [유저 요청] 대상 중심에서 밖으로 폭발적으로 퍼져나가는 주황빛 링 (암전 해제와 동기화)
  // - 2) 격돌 초기 (prog < 0.35): 시전자의 박치기 머리와 주황빛 뿔이 상대 면전에 꽂힘
  // - 3) 순백-에메랄드 스타버스트 충격파 + 거대 초승달 참격 교차 + 키틴질 파편 대폭쇄
  // =========================================================================
  if (step === 3) {
    const cx = targetPos.x;
    const cy = targetPos.y;

    ctx.save();

    // 1) [유저 요청] 타격 직후 밖으로 폭발적으로 퍼져나가는 주황빛 링
    // - 타격 순간(prog < 0.10)에는 꽂힘에 집중, 타격 직후(prog >= 0.10)부터 암전과 함께 폭발적 팽창!
    // - 링 선: 내각 색상(선명한 골드/주황), 외각 투명 그라데이션 적용!
    const expandP = Math.max(0, (prog - 0.08) / 0.92);
    const ringExpandR = 36 + Math.pow(expandP, 0.52) * 280;
    const ringAlpha = Math.max(0, 1.0 - expandP * 0.85);

    if (ringAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = ringAlpha;

      // [유저 요청] 링 선 렌더러 (내각 색상, 외각 투명 그라데이션)
      const drawGradientRingBand = (rInner: number, bandWidth: number, baseAlpha: number = 1.0) => {
        if (rInner <= 3 || baseAlpha <= 0.02) return;
        const rOuter = rInner + bandWidth;

        ctx.save();
        ctx.globalAlpha = ringAlpha * baseAlpha;

        // 1. 내각 색상 -> 외각 투명 방사형 그라데이션
        const ringGrad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
        ringGrad.addColorStop(0.0, "rgba(254, 240, 138, 0.95)"); // 내각: 선명한 골드 코어
        ringGrad.addColorStop(0.20, "rgba(249, 115, 22, 0.90)"); // 내각 직후: 선명한 주황
        ringGrad.addColorStop(0.60, "rgba(234, 88, 12, 0.35)"); // 외각 쪽: 감쇄 주황
        ringGrad.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");    // 외각: 100% 완전 투명!

        // 도넛 패스 (외각 원 - 내각 원: 중심부는 완전 투명)
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter, 0, Math.PI * 2, false);
        ctx.arc(cx, cy, rInner, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = ringGrad;
        ctx.fill();

        // 2. 내각 선명한 색상 림 라인 (Sharp Inner Color Edge)
        ctx.beginPath();
        ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(254, 240, 138, 0.95)";
        ctx.lineWidth = Math.max(1.2, 2.6 * (1.0 - prog * 0.45));
        ctx.shadowColor = "#EA580C";
        ctx.shadowBlur = 6;
        ctx.stroke();

        ctx.restore();
      };

      // 1-1. 메인 팽창 링 (두께 20px -> 감쇄, 간격 68px)
      const mainBand = Math.max(5.0, 20.0 * (1.0 - prog * 0.45));
      drawGradientRingBand(ringExpandR, mainBand, 1.0);

      // 1-2. 2차 팽창 링 (간격 68px)
      const ringSpacing = 68;
      const ring2R = ringExpandR - ringSpacing;
      if (ring2R > 16) {
        const band2 = Math.max(4.0, 15.0 * (1.0 - prog * 0.45));
        drawGradientRingBand(ring2R, band2, 0.80);
      }

      // 1-3. 3차 팽창 링 (간격 68px * 2)
      const ring3R = ringExpandR - ringSpacing * 2;
      if (ring3R > 20) {
        const band3 = Math.max(3.0, 11.0 * (1.0 - prog * 0.45));
        drawGradientRingBand(ring3R, band3, 0.50);
      }

      ctx.restore();
    }

    // 2) 타격점 중심 순백-에메랄드 스타버스트 충격파
    if (prog < 0.55) {
      const starScale = (1.0 - prog / 0.55) * 46;
      drawStarburstImpact(ctx, cx, cy, MEGAHORN_PALETTE.hornLime, MEGAHORN_PALETTE.white, starScale);
    }

    // 3) 초대형 에메랄드 초승달 참격 (Crescent Impale Slashes)
    const slashScale = 45 + prog * 22;
    const slashAlpha = Math.max(0, 1.0 - prog * 0.85);

    ctx.globalAlpha = slashAlpha;

    // 1차 메인 초승달 참격 (하단에서 상단으로 베어올림)
    ctx.strokeStyle = MEGAHORN_PALETTE.hornLime;
    ctx.lineWidth = 6.0 * (1.0 - prog * 0.4);
    ctx.beginPath();
    ctx.arc(cx, cy, slashScale, -Math.PI * 0.75, Math.PI * 0.25);
    ctx.stroke();

    ctx.strokeStyle = MEGAHORN_PALETTE.white;
    ctx.lineWidth = 2.5 * (1.0 - prog * 0.4);
    ctx.stroke();

    // 2차 역방향 교차 참격
    ctx.strokeStyle = MEGAHORN_PALETTE.hornEmerald;
    ctx.lineWidth = 4.5 * (1.0 - prog * 0.4);
    ctx.beginPath();
    ctx.arc(cx, cy, slashScale * 0.85, Math.PI * 0.15, Math.PI * 1.15);
    ctx.stroke();

    // 4) 타격 충격파 링 확산
    const ringR = 15 + prog * 55;
    ctx.strokeStyle = "rgba(163, 230, 53, 0.6)";
    ctx.lineWidth = 2.5 * (1.0 - prog);
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // 5) 16방향 비산하는 에메랄드 키틴질 파편 (사각형 대신 깔끔한 미세 원형 입자) & 은빛 스파크
    const numShards = 16;
    for (let i = 0; i < numShards; i++) {
      const angle = (i * Math.PI * 2) / numShards + i * 0.18;
      const dist = prog * (48 + (i % 4) * 16);
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * (dist * 0.85);
      const shardAlpha = Math.max(0, 1.0 - prog * 0.9);

      ctx.save();
      ctx.globalAlpha = slashAlpha * shardAlpha;
      if (i % 2 === 0) {
        ctx.fillStyle = i % 4 === 0 ? MEGAHORN_PALETTE.white : MEGAHORN_PALETTE.hornLime;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawMiniRetroStar(ctx, px, py, 3.5, MEGAHORN_PALETTE.hornHighlight, angle);
      }
      ctx.restore();
    }

    ctx.restore();
    return;
  }

  // =========================================================================
  // Step 4: 결(結) - 충돌 반동 마무리 & 잔여 스파클 소산
  // =========================================================================
  if (step === 4) {
    const cx = targetPos.x;
    const cy = targetPos.y;

    ctx.save();
    ctx.globalAlpha = Math.max(0, 1.0 - prog);
    for (let i = 0; i < 6; i++) {
      const px = cx + ((i * 19) % 44) - 22;
      const py = cy + ((i * 13) % 44) - 22;
      drawMiniRetroStar(ctx, px, py, 3, MEGAHORN_PALETTE.hornLime, i);
    }
    ctx.restore();
    return;
  }
}
