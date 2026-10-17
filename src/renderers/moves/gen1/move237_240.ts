// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import {
  drawMiniRetroStar,
  drawStarburstImpact,
  getKarateBlackImg,
  getKarateRedImg,
} from "../common/helpers.js";

// ============================================================================
// 🔮 237: 잠재파워 (Hidden Power / めざめるパワー) - 특수 기술
// 위력: 60 / 명중: 100 / PP: 15 / 비접촉
// 설명: 시전자의 개체값(IV)에 따라 기술의 속성과 위력이 변화한다.
// 연출: 화면 암전 ➔ 사방에서 주황빛(바깥 투명, 안쪽 흰색 자글자글) 수렴
//      ➔ 가운데 응축 및 초록색 변환 ➔ 상대방에게 발사 시 사방으로 추악 퍼졌다가
//      ➔ 상대방 스프라이트로 쇄도 돌진 ➔ 직격 폭발 & 초록 플라즈마 비산
// ============================================================================

interface SizzlingOrbOptions {
  x: number;
  y: number;
  coreRadius: number;
  glowRadius: number;
  midGlowRadius?: number;
  outerColor: string;
  outerGlowColor: string;
  midGlowColor?: string;
  innerHaloColor: string;
  sparkColor?: string;
  lightningColor?: string;
  seed: number;
  alpha?: number;
  sizzleIntensity?: number;
  spinAngle?: number;
}

/**
 * 자글자글한 (crackling / sizzling / jagged) 화이트 플라즈마 코어 및 3단 다층 글로우 렌더러
 * - 1단: 중심부 잠재파워 덩어리 (자글자글한 백색 플라즈마)
 * - 2단: 덩어리와 외곽 사이의 선명한 중간색 오라 글로우 (midGlow)
 * - 3단: 외곽으로 부드럽게 퍼져나가는 대형 앰비언트 글로우 (outerGlow)
 */
function drawSizzlingCoreOrb(ctx: any, opt: SizzlingOrbOptions) {
  const {
    x,
    y,
    coreRadius,
    glowRadius,
    midGlowRadius = coreRadius * 1.85,
    outerColor,
    outerGlowColor,
    midGlowColor,
    innerHaloColor,
    seed,
    alpha = 1.0,
    sizzleIntensity = 1.0,
    spinAngle = 0,
  } = opt;

  if (alpha <= 0.01 || glowRadius <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  // 1. 외곽 대형 글로우 (기존 글로우 - 반경 확장 & 부드러운 투명 방사)
  const outerGrad = ctx.createRadialGradient(x, y, midGlowRadius * 0.65, x, y, glowRadius);
  outerGrad.addColorStop(0, outerGlowColor);
  outerGrad.addColorStop(0.55, outerGlowColor.replace(/[\d.]+\)$/, "0.14)"));
  outerGrad.addColorStop(1.0, outerColor);
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중간 글로우 (덩어리와 기존 외곽 글로우 사이의 선명한 중간색 오라)
  const effectiveMidColor = midGlowColor ?? outerGlowColor;
  const midGrad = ctx.createRadialGradient(x, y, coreRadius * 0.25, x, y, midGlowRadius);
  midGrad.addColorStop(0, innerHaloColor);
  midGrad.addColorStop(0.40, effectiveMidColor);
  midGrad.addColorStop(1.0, effectiveMidColor.replace(/[\d.]+\)$/, "0.0)"));
  ctx.fillStyle = midGrad;
  ctx.beginPath();
  ctx.arc(x, y, midGlowRadius, 0, Math.PI * 2);
  ctx.fill();

  // 3. 중심부 잠재파워 자글자글한 백색 플라즈마 덩어리
  // (동그라미가 아닌, 3중 고주파 하모닉 파동으로 격렬하게 요동치는 유기적 플라즈마 형태)
  // 외곽선(선)을 방지하기 위해 5단계 투명 그라데이션 다층 레이어로 부드럽게 감싸면서도 고밀도 핵 유지
  const numVerts = 40;
  const radii: number[] = [];
  for (let i = 0; i < numVerts; i++) {
    const angle = (i * Math.PI * 2) / numVerts;
    const jitter = Math.sin(angle * 5 + seed * 11.3) * 0.42
                 + Math.cos(angle * 9 - seed * 7.1) * 0.35
                 + Math.sin(angle * 13 + seed * 17.9) * 0.23;
    radii.push(Math.max(2, coreRadius * (0.88 + 0.38 * jitter * sizzleIntensity)));
  }

  const sizzleLayers = [
    { scale: 1.25, alpha: 0.16 }, // 외곽 1단계: 16% 소프트 투명 연무 (칼로 자른 선 완전 방지)
    { scale: 1.10, alpha: 0.26 }, // 외곽 2단계: 42% 누적 투명도
    { scale: 0.95, alpha: 0.34 }, // 중간 3단계: 76% 누적 밀도
    { scale: 0.80, alpha: 0.42 }, // 코어 4단계: 100% 순백광 도달
    { scale: 0.58, alpha: 0.60 }, // 중심핵 5단계: 눈부신 초고밀도 순백광 덩어리
  ];

  ctx.save();
  for (const layer of sizzleLayers) {
    ctx.fillStyle = `rgba(255, 255, 255, ${layer.alpha})`;
    ctx.beginPath();
    for (let i = 0; i < numVerts; i++) {
      const angle = (i * Math.PI * 2) / numVerts + spinAngle;
      const r = radii[i] * layer.scale;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 4. 자글자글한 외곽 미세 플라즈마 코로나 돌기 (Sizzling Micro-Corona Tendrils)
  const numSpikes = 20;
  ctx.save();
  for (let s = 0; s < numSpikes; s++) {
    const sAngle = (s * Math.PI * 2) / numSpikes + Math.sin(s * 3.7 + seed * 9.3) * 0.25 + spinAngle;
    const jitter = Math.sin(s * 7.1 + seed * 13.7) * 0.5 + Math.cos(s * 4.3 - seed * 17.1) * 0.5;
    const spikeLen = coreRadius * (0.15 + 0.25 * Math.abs(jitter)) * sizzleIntensity;
    const baseR = coreRadius * 0.80;
    const tipR = baseR + spikeLen;

    const bx = x + Math.cos(sAngle) * baseR;
    const by = y + Math.sin(sAngle) * baseR;
    const tx = x + Math.cos(sAngle) * tipR;
    const ty = y + Math.sin(sAngle) * tipR;

    const spGrad = ctx.createLinearGradient(bx, by, tx, ty);
    spGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.90)");
    spGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.50)");
    spGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.strokeStyle = spGrad;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }
  ctx.restore();

  // 5. 백색 덩어리 내부에서 선명하게 파직거리는 자글자글 플라즈마 결 (Internal Crackle Filaments)
  const numArcs = 3;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 1.1;
  ctx.lineCap = "round";
  for (let a = 0; a < numArcs; a++) {
    const aAngle = (a * Math.PI * 2) / numArcs + Math.sin(seed * 7.1 + a * 4.3) * 0.8 + spinAngle;
    const arcLen = coreRadius * (0.35 + 0.25 * Math.sin(seed * 11.7 + a * 2.9));

    const p0x = x + Math.cos(aAngle) * (coreRadius * 0.1);
    const p0y = y + Math.sin(aAngle) * (coreRadius * 0.1);
    const p1x = x + Math.cos(aAngle + 0.3) * (arcLen * 0.5) + Math.sin(seed * 19.3 + a) * 1.5;
    const p1y = y + Math.sin(aAngle + 0.3) * (arcLen * 0.5) + Math.cos(seed * 23.1 + a) * 1.5;
    const p2x = x + Math.cos(aAngle - 0.2) * arcLen;
    const p2y = y + Math.sin(aAngle - 0.2) * arcLen;

    ctx.beginPath();
    ctx.moveTo(p0x, p0y);
    ctx.lineTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

const HP_ORANGE_SCHEME = {
  outerColor: "rgba(251, 146, 60, 0.0)",       // Outer transparent
  outerGlowColor: "rgba(251, 146, 60, 0.28)",  // 외곽 부드러운 옅은 주황빛
  midGlowColor: "rgba(249, 115, 22, 0.62)",    // 중간색: 덩어리와 외곽 사이의 따뜻하고 선명한 웜오렌지 오라
  innerHaloColor: "rgba(255, 247, 237, 0.88)", // 덩어리 바로 주변 맑은 웜화이트
  sparkColor: "#FEF08A",
  lightningColor: "rgba(255, 255, 255, 0.95)",
};

const HP_GREEN_SCHEME = {
  outerColor: "rgba(16, 185, 129, 0.0)",      // Outer transparent
  outerGlowColor: "rgba(16, 185, 129, 0.35)", // 외곽 부드러운 에메랄드 안개
  midGlowColor: "rgba(34, 197, 94, 0.72)",    // 중간색: 덩어리와 외곽 사이의 선명한 그린 오라
  innerHaloColor: "rgba(209, 250, 229, 0.92)", // 덩어리 주변 민트 화이트
  sparkColor: "#86EFAC",
  lightningColor: "rgba(255, 255, 255, 1.0)",
};

function getHpTransitionScheme(prog: number) {
  if (prog < 0.25) {
    return HP_ORANGE_SCHEME;
  } else if (prog < 0.5) {
    return {
      outerColor: "rgba(245, 158, 11, 0.0)",
      outerGlowColor: "rgba(245, 158, 11, 0.30)",
      midGlowColor: "rgba(234, 179, 8, 0.65)", // 중간 골드 오라
      innerHaloColor: "rgba(254, 243, 199, 0.90)",
      sparkColor: "#FEF08A",
      lightningColor: "rgba(255, 255, 255, 0.95)",
    };
  } else if (prog < 0.75) {
    return {
      outerColor: "rgba(132, 204, 22, 0.0)",
      outerGlowColor: "rgba(132, 204, 22, 0.35)",
      midGlowColor: "rgba(101, 163, 13, 0.68)", // 중간 라임 오라
      innerHaloColor: "rgba(217, 249, 157, 0.90)",
      sparkColor: "#A3E635",
      lightningColor: "rgba(255, 255, 255, 0.95)",
    };
  } else {
    return HP_GREEN_SCHEME;
  }
}

// ----------------------------------------------------------------------------
// 🔮 가로 수평 회전 궤도 파라미터 (Horizontal Spiral Orbit)
// ----------------------------------------------------------------------------
const NUM_HP_ORBS = 5;
const HP_HORIZONTAL_RADIUS = 138; // 초기 수평 회전 반경 (충분한 시각적 웅장함 확보)
const HP_TILT_Y = 0.44;          // 2.5D 수평 타원 투영 비율
const HP_ROTATIONS = 1.25;       // Step 1 동안 수평 회전 바퀴 수 (1.25바퀴 연속 회전)

// 각 구체별 고유 크기 (글로우 반경을 35~42px로 확장하고, 18~22px 중간 글로우 층 추가)
const HP_ORB_SIZES = [
  { core: 11.0, midGlow: 20, glow: 38 },
  { core: 12.5, midGlow: 22, glow: 42 },
  { core: 10.0, midGlow: 18, glow: 35 },
  { core: 12.0, midGlow: 21, glow: 40 },
  { core: 10.5, midGlow: 19, glow: 37 },
];

/**
 * 가로 수평 나선 궤도 상태 계산
 * - 시전자 포켓몬 스프라이트 중심(cx, cy)을 기준으로 부드럽게 감겨들며 끊김 없이 수렴
 */
function getHorizontalOrbState(
  i: number,
  prog: number,
  cx: number,
  cy: number
) {
  const baseAngle = (i * 2 * Math.PI) / NUM_HP_ORBS;

  // 회전 각도: 모여드는 동안 지속적으로 가속 회전 (소용돌이 각속도)
  // 회전 스텝(프레임당 각도 변화)을 38°~52° 범위로 제어하여 5개 구체(72° 간격)의 위상 겹침 착시(정지한 것처럼 보이는 현상)를 완벽 차단
  const angle = baseAngle + HP_ROTATIONS * Math.PI * 2 * (0.80 * prog + 0.20 * prog * prog);

  // 수평 반경 수렴: 시작부터 끝까지 매 프레임 일정한 속도로 줄어들며 중심으로 감겨 들어감
  const curR = HP_HORIZONTAL_RADIUS * Math.pow(Math.max(0, 1 - prog), 0.92);

  // 3D 가로 수평면 좌표 (X: 좌우, Z: 원근 깊이)
  const x3d = curR * Math.cos(angle);
  const z3d = curR * Math.sin(angle); // z > 0: 앞, z < 0: 뒤

  // 원근 깊이에 따른 미세 스케일 (앞쪽은 조금 크고, 뒤쪽은 조금 작게)
  const D = 280;
  const persp = Math.max(0.72, Math.min(1.28, D / (D - z3d * 0.75)));

  // 가로 수평 타원 투영 좌표
  const screenX = cx + x3d;
  const screenY = cy + z3d * HP_TILT_Y;

  // 멀리 있을 때 투명하게 시작하는 페이드 인 (초반 20% 동안 0.0 -> 1.0)
  const fadeIn = Math.min(1.0, prog / 0.20);
  const depthFactor = 0.75 + 0.25 * ((z3d + HP_HORIZONTAL_RADIUS) / (2 * HP_HORIZONTAL_RADIUS));
  const alpha = fadeIn * depthFactor;

  return {
    screenX,
    screenY,
    x3d,
    z3d,
    persp,
    alpha,
    isBehind: z3d < -0.05,
  };
}

export function drawHiddenPowerBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
  const cx = casterPos.x;
  const cy = casterPos.y;

  ctx.save();

  // 1. 전장 배경 암전 오버레이 (Dark Background Overlay)
  const darkAlpha = (frame as any).darkAlpha ?? (frame.blackFadeAlpha && frame.blackFadeAlpha > 0 ? frame.blackFadeAlpha : 0);
  if (darkAlpha > 0.01 && step <= 4) {
    ctx.save();
    ctx.globalAlpha = darkAlpha;
    ctx.fillStyle = "#000000";
    ctx.fillRect(-6000, -6000, 14000, 14000);
    ctx.restore();
  }

  // 2. Step 1: 가로 수평 회전 중 포켓몬 스프라이트 뒤편(Z < 0)에 위치한 순수 주황빛 구체들 (선/링 제거)
  if (step === 1) {
    for (let i = 0; i < NUM_HP_ORBS; i++) {
      const state = getHorizontalOrbState(i, prog, cx, cy);

      if (state.alpha <= 0.01) continue;

      // 본체 구체가 뒤편(isBehind === true)일 때 렌더링 (포켓몬 스프라이트 뒤편)
      if (state.isBehind) {
        const size = HP_ORB_SIZES[i % HP_ORB_SIZES.length];
        drawSizzlingCoreOrb(ctx, {
          x: state.screenX,
          y: state.screenY,
          coreRadius: size.core * state.persp,
          midGlowRadius: size.midGlow * state.persp,
          glowRadius: size.glow * state.persp,
          ...HP_ORANGE_SCHEME,
          seed: prog * 15 + i * 7,
          alpha: state.alpha,
          sizzleIntensity: 1.1,
        });
      }
    }
  }

  ctx.restore();
}

export function drawHiddenPowerEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
  const targetPos = drawCtx.targetPos;

  // 시전 포켓몬 스프라이트 중심 위치
  const cx = casterPos.x;
  const cy = casterPos.y;

  ctx.save();

  // [Step 1: 가로 수평으로 회전하면서 내 포켓몬 스프라이트 위치로 모여듬 (앞쪽 Z >= 0 순수 구체들)]
  if (step === 1) {
    for (let i = 0; i < NUM_HP_ORBS; i++) {
      const state = getHorizontalOrbState(i, prog, cx, cy);

      if (state.alpha <= 0.01) continue;

      // 본체 구체가 앞쪽(!isBehind)일 때 렌더링 (포켓몬 스프라이트 앞편)
      if (!state.isBehind) {
        const size = HP_ORB_SIZES[i % HP_ORB_SIZES.length];
        drawSizzlingCoreOrb(ctx, {
          x: state.screenX,
          y: state.screenY,
          coreRadius: size.core * state.persp,
          midGlowRadius: size.midGlow * state.persp,
          glowRadius: size.glow * state.persp,
          ...HP_ORANGE_SCHEME,
          seed: prog * 15 + i * 7,
          alpha: state.alpha,
          sizzleIntensity: 1.1,
        });
      }
    }
  }

  // [Step 2: 내 포켓몬 스프라이트 위치에서 뭉쳐져서 초록 색깔로 변환 (3단 다층 거대 구체 응축)]
  if (step === 2) {
    const scheme = getHpTransitionScheme(prog);
    const sphereCoreR = 19 + Math.sin(prog * Math.PI * 5) * 2.8;
    const sphereMidGlowR = 34 + Math.sin(prog * Math.PI * 5) * 4.0;
    const sphereGlowR = 64 + Math.sin(prog * Math.PI * 5) * 8.0;

    // 중심 거대 응축 구체 (내 포켓몬 스프라이트 위치 cx, cy)
    drawSizzlingCoreOrb(ctx, {
      x: cx,
      y: cy,
      coreRadius: sphereCoreR,
      midGlowRadius: sphereMidGlowR,
      glowRadius: sphereGlowR,
      ...scheme,
      seed: prog * 25,
      alpha: 1.0,
      sizzleIntensity: 1.6,
    });
  }

/**
 * 3D 원형 링(Ring) 발사 궤도 상의 에너지 구체 위치 및 원근감 계산
 * - 유저 피드백 참고 이미지 완벽 반영: 전장 중앙(시전자와 피격자 사이)을 중심으로 형성되는 대형 3D 원형 링
 * - 6개 구체가 2.5D 타원 고리(상, 우상, 우하, 하, 좌하, 좌상) 형태로 사방으로 넓게 개화
 * - 깊이(Z)에 따른 원근 스케일링(persp) 및 Z-sorting 지원
 */
function getHpProjectileOrbState(
  k: number,
  numBolts: number,
  fwd: number,
  rx: number,
  ry: number,
  rotAngle: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number
) {
  // 6개 구체의 기준 각도: k=0(상단 -90°), k=1(우상 -30°), k=2(우하 +30°), k=3(하단 +90°), k=4(좌하 +150°), k=5(좌상 +210°)
  const baseAngle = (k * 2 * Math.PI) / numBolts - Math.PI * 0.5;
  const angle = baseAngle + rotAngle;

  const cxMid = cx + dx * fwd;
  const cyMid = cy + dy * fwd;

  const offsetX = rx * Math.cos(angle);
  const offsetY = ry * Math.sin(angle);

  const screenX = cxMid + offsetX;
  const screenY = cyMid + offsetY;

  // 2.5D 전장 깊이(Z): 화면 아래쪽(+Y)이 카메라에 가까운 전경(+Z), 위쪽(-Y)이 원경(-Z)
  const z3d = offsetY;
  const D = 220;
  const persp = Math.max(0.72, Math.min(1.30, D / (D - z3d * 0.85)));

  // 깊이에 따른 미세 알파
  const depthAlpha = Math.max(0.75, Math.min(1.0, 0.88 + 0.12 * (z3d / Math.max(1, ry))));

  return {
    screenX,
    screenY,
    z3d,
    persp,
    depthAlpha,
  };
}

  // [Step 3: 상대방에게 발사 시 3D 원형 링 형태로 사방으로 추악 개화 (유저 참고 이미지 배치)]
  if (step === 3) {
    const dx = targetPos.x - cx;
    const dy = targetPos.y - cy;

    // 시전자 위치에서 뭉쳐졌던 거대 코어가 6개의 3D 구체로 폭발 분리되는 잔여 플래시
    if (prog < 0.35) {
      const coreFade = 1 - prog / 0.35;
      drawSizzlingCoreOrb(ctx, {
        x: cx,
        y: cy,
        coreRadius: 18 * coreFade,
        midGlowRadius: 32 * coreFade,
        glowRadius: 55 * coreFade,
        ...HP_GREEN_SCHEME,
        seed: prog * 30,
        alpha: coreFade,
        sizzleIntensity: 1.5,
      });
    }

    const numBolts = 6;
    const fwd = 0.48 * Math.sin(prog * Math.PI * 0.5);
    const rx = 48 * Math.sin(prog * Math.PI * 0.5);
    const ry = 54 * Math.sin(prog * Math.PI * 0.5);
    // 6개 구체의 3D 원형 링 공전 회전각 (프레임당 약 28°씩 지속적 매끄러운 회전)
    const rotAngle = 2.95 * prog;

    // 6개 구체의 3D 상태 계산 및 Z-Sort (화면 위쪽/원경 먼저, 아래쪽/전경 나중에 렌더링)
    const orbStates = [];
    for (let k = 0; k < numBolts; k++) {
      const state = getHpProjectileOrbState(k, numBolts, fwd, rx, ry, rotAngle, cx, cy, dx, dy);
      orbStates.push({ k, ...state });
    }
    orbStates.sort((a, b) => a.z3d - b.z3d);

    for (const orb of orbStates) {
      // 3D 발사 궤적 연결 글로우 잔상
      for (let tr = 1; tr <= 3; tr++) {
        const trProg = Math.max(0, prog - tr * 0.08);
        const tfwd = 0.48 * Math.sin(trProg * Math.PI * 0.5);
        const trx = 48 * Math.sin(trProg * Math.PI * 0.5);
        const tryVal = 54 * Math.sin(trProg * Math.PI * 0.5);
        const trotAngle = 2.95 * trProg;
        const trState = getHpProjectileOrbState(orb.k, numBolts, tfwd, trx, tryVal, trotAngle, cx, cy, dx, dy);
        const tAlpha = (1 - tr / 4) * 0.45 * trState.depthAlpha;

        const trailR = Math.max(2, (22 - tr * 3.8) * trState.persp);
        const grad = ctx.createRadialGradient(trState.screenX, trState.screenY, 0, trState.screenX, trState.screenY, trailR);
        grad.addColorStop(0, "rgba(167, 243, 208, 0.65)");
        grad.addColorStop(0.5, "rgba(34, 197, 94, 0.35)");
        grad.addColorStop(1.0, "rgba(34, 197, 94, 0.0)");
        ctx.save();
        ctx.globalAlpha = tAlpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(trState.screenX, trState.screenY, trailR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 선두 3D 입체 자글자글 구체 (원근감 persp + 공전/자전 회전 반영)
      drawSizzlingCoreOrb(ctx, {
        x: orb.screenX,
        y: orb.screenY,
        coreRadius: 11.5 * orb.persp,
        midGlowRadius: 21 * orb.persp,
        glowRadius: 38 * orb.persp,
        ...HP_GREEN_SCHEME,
        seed: prog * 20 + orb.k * 5,
        alpha: orb.depthAlpha,
        sizzleIntensity: 1.3,
        spinAngle: rotAngle * 1.5,
      });
    }
  }

  // [Step 4: 3D 원형 링을 형성한 6개 구체가 3D 나선을 그리며 상대방 스프라이트로 쇄도 돌진]
  if (step === 4) {
    const dx = targetPos.x - cx;
    const dy = targetPos.y - cy;

    const numBolts = 6;
    const easeT = prog * prog * (3 - 2 * prog);
    const fwd = 0.48 + 0.52 * easeT;
    const converge = 1 - Math.pow(prog, 1.4);
    const rx = 48 * converge;
    const ry = 54 * converge;
    // Step 3의 2.95rad에서 이어서 고속 3D 나선 회전 가속
    const rotAngle = 2.95 + 4.2 * prog;

    // 6개 구체의 3D 상태 계산 및 Z-Sort
    const orbStates = [];
    for (let k = 0; k < numBolts; k++) {
      const state = getHpProjectileOrbState(k, numBolts, fwd, rx, ry, rotAngle, cx, cy, dx, dy);
      orbStates.push({ k, ...state });
    }
    orbStates.sort((a, b) => a.z3d - b.z3d);

    for (const orb of orbStates) {
      // 3D 고속 돌진 스피드 트레일 잔상 (3D 곡선 궤적)
      for (let tr = 1; tr <= 3; tr++) {
        const trProg = Math.max(0, prog - tr * 0.07);
        const tease = trProg * trProg * (3 - 2 * trProg);
        const tfwd = 0.48 + 0.52 * tease;
        const trConverge = 1 - Math.pow(trProg, 1.4);
        const trx = 48 * trConverge;
        const tryVal = 54 * trConverge;
        const trotAngle = 2.95 + 4.2 * trProg;
        const trState = getHpProjectileOrbState(orb.k, numBolts, tfwd, trx, tryVal, trotAngle, cx, cy, dx, dy);
        const tAlpha = (1 - tr / 4) * 0.50 * trState.depthAlpha;

        const trailR = Math.max(2, (24 - tr * 4.2) * trState.persp);
        const grad = ctx.createRadialGradient(trState.screenX, trState.screenY, 0, trState.screenX, trState.screenY, trailR);
        grad.addColorStop(0, "rgba(167, 243, 208, 0.68)");
        grad.addColorStop(0.5, "rgba(34, 197, 94, 0.35)");
        grad.addColorStop(1.0, "rgba(34, 197, 94, 0.0)");
        ctx.save();
        ctx.globalAlpha = tAlpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(trState.screenX, trState.screenY, trailR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 돌진 선두 3D 입체 자글자글 구체 (원근감 persp + 공전/자전 회전 반영)
      drawSizzlingCoreOrb(ctx, {
        x: orb.screenX,
        y: orb.screenY,
        coreRadius: 12.5 * orb.persp,
        midGlowRadius: 22 * orb.persp,
        glowRadius: 40 * orb.persp,
        ...HP_GREEN_SCHEME,
        seed: prog * 25 + orb.k * 6,
        alpha: orb.depthAlpha,
        sizzleIntensity: 1.4,
        spinAngle: rotAngle * 1.5,
      });
    }
  }

/**
 * 237: 잠재파워 전용 시네마틱 플라즈마 직격 폭발 (Cinematic Plasma Detonation)
 * - 촌스러운 레트로 별가루/와이어 링/스포크 선 완전 배제
 * - 고에너지 아나모픽 렌즈 플레어 + 자글자글한 플라즈마 다중 파열체 + 초고속 유선형 에너지 파편
 */
function drawHiddenPowerPlasmaImpact(
  ctx: any,
  tx: number,
  ty: number,
  prog: number
) {
  const alpha = Math.max(0, 1 - prog);
  if (alpha <= 0.01) return;

  ctx.save();

  // 1. 거대 에메랄드 플라즈마 앰비언트 글로우 (Ambient Detonation Glow)
  const glowR = 48 + prog * 72;
  const glowGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, glowR);
  glowGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * alpha})`);
  glowGrad.addColorStop(0.25, `rgba(167, 243, 208, ${0.85 * alpha})`);
  glowGrad.addColorStop(0.55, `rgba(16, 185, 129, ${0.50 * alpha})`);
  glowGrad.addColorStop(1.0, "rgba(5, 150, 105, 0.0)");

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(tx, ty, glowR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 고에너지 아나모픽 렌즈 플레어 (초반 직격 순간 눈부신 수평/수직 섬광 슬릿)
  if (prog < 0.45) {
    const flareProg = prog / 0.45;
    const flareAlpha = Math.sin((1 - flareProg) * Math.PI * 0.5) * 0.95;

    // 수평 고광도 플레어
    const hW = 150 - flareProg * 45;
    const hH = Math.max(1, 4.0 * (1 - flareProg));
    const hGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, hW);
    hGrad.addColorStop(0, `rgba(255, 255, 255, ${flareAlpha})`);
    hGrad.addColorStop(0.35, `rgba(167, 243, 208, ${flareAlpha * 0.75})`);
    hGrad.addColorStop(1.0, "rgba(16, 185, 129, 0)");

    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(1, hH / hW);
    ctx.fillStyle = hGrad;
    ctx.beginPath();
    ctx.arc(0, 0, hW, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 수직 서브 플레어
    const vH = 85 - flareProg * 25;
    const vW = Math.max(1, 3.0 * (1 - flareProg));
    const vGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, vH);
    vGrad.addColorStop(0, `rgba(255, 255, 255, ${flareAlpha * 0.9})`);
    vGrad.addColorStop(0.35, `rgba(167, 243, 208, ${flareAlpha * 0.6})`);
    vGrad.addColorStop(1.0, "rgba(16, 185, 129, 0)");

    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(vW / vH, 1);
    ctx.fillStyle = vGrad;
    ctx.beginPath();
    ctx.arc(0, 0, vH, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. 자글자글한 백색 플라즈마 파열 핵 (Sizzling Detonation Core Clusters)
  // 중심 폭발체 + 3개의 분산 폭발체
  const clusters = [
    { dx: 0, dy: 0, r: 24 + prog * 12, intensity: 1.4, seed: 17 },
    { dx: -16 * prog, dy: -10 * prog, r: 14 + prog * 8, intensity: 1.1, seed: 43 },
    { dx: 18 * prog, dy: -8 * prog, r: 15 + prog * 9, intensity: 1.2, seed: 71 },
    { dx: -6 * prog, dy: 16 * prog, r: 13 + prog * 7, intensity: 1.0, seed: 93 },
  ];

  for (const c of clusters) {
    const cx = tx + c.dx;
    const cy = ty + c.dy;
    const coreR = Math.max(1, c.r * (1 - prog * 0.7));

    // 외곽선 없는 부드러운 투명 방사형 그라데이션 백색 플라즈마 파열핵
    const fadeR = coreR * 1.15;
    const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, fadeR);
    cGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
    cGrad.addColorStop(0.65, "rgba(255, 255, 255, 0.95)");
    cGrad.addColorStop(0.85, "rgba(167, 243, 208, 0.60)");
    cGrad.addColorStop(0.96, "rgba(16, 185, 129, 0.20)");
    cGrad.addColorStop(1.00, "rgba(16, 185, 129, 0.0)");

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, alpha * 1.2);
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, fadeR, 0, Math.PI * 2);
    ctx.fill();

    // 안쪽 비등하는 미세 코어 핫스팟
    const innerR = coreR * 0.45;
    const inGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
    inGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
    inGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
    ctx.fillStyle = inGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4. 고속 비산 에너지 파편 (High-Velocity Directional Plasma Shards)
  // 귀여운 별가루 대신, 실제 폭발 물리 궤적으로 사방에 비산하는 유선형 플라즈마 파편들
  const shardCount = 12;
  const shardAngles = [
    0.15, 0.62, 1.18, 1.75, 2.28, 2.85, 3.35, 3.82, 4.38, 4.95, 5.52, 6.05
  ];
  const shardSpeeds = [72, 85, 65, 90, 78, 88, 68, 82, 75, 92, 70, 84];

  for (let s = 0; s < shardCount; s++) {
    const angle = shardAngles[s] + 0.08 * Math.sin(s * 2.3);
    const speed = shardSpeeds[s];
    const dist = 10 + speed * Math.pow(prog, 0.85);
    const sx = tx + Math.cos(angle) * dist;
    const sy = ty + Math.sin(angle) * (dist * 0.85); // 2.5D 시점 반영

    const shardLen = Math.max(3, (24 - prog * 12) * (speed / 75));
    const shardWidth = Math.max(1.5, 4.2 * (1 - prog));

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    ctx.globalAlpha = Math.max(0, (1 - prog * 0.95) * 0.95);

    // 날렵한 다이아몬드/눈물방울 형태의 에메랄드 에너지 파편
    const sGrad = ctx.createLinearGradient(-shardLen, 0, shardLen * 0.4, 0);
    sGrad.addColorStop(0, "rgba(5, 150, 105, 0)");
    sGrad.addColorStop(0.5, "#10B981");
    sGrad.addColorStop(0.85, "#A7F3D0");
    sGrad.addColorStop(1.0, "#FFFFFF");

    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.moveTo(shardLen * 0.4, 0); // 선두
    ctx.lineTo(0, -shardWidth * 0.5);
    ctx.lineTo(-shardLen, 0); // 후미 꼬리
    ctx.lineTo(0, shardWidth * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

  // [Step 5: 상대방 피격 폭발 & 초록 플라즈마 비산]
  if (step === 5) {
    drawHiddenPowerPlasmaImpact(ctx, targetPos.x, targetPos.y, prog);
  }

  ctx.restore();
}

// ============================================================================
// ⚔️ 238: 크로스촙 (Cross Chop / クロスチョップ) - 격투 타입 물리 기술
// 위력: 100 / 명중: 80 / PP: 5 / 급소율 높음 (+1) / 접촉
// 설명: 양손으로 당수를 상대에게 X자로 힘껏 교차시켜 공격한다. 급소에 맞기 쉽다.
// 연출: 시전자 도약 ➔ 상대 중심 대형 X자 교차 참격 칼날 ➔ 교차점 강력한 십자 폭발 & 스파크
// ============================================================================

export function drawCrossChopBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const isP = drawCtx.isPlayer;
  const casterPos = drawCtx.attackerPos;

  // Step 1: 도약 시 후방 스피드 잔상 라인
  if (step === 1) {
    ctx.save();
    ctx.strokeStyle = `rgba(251, 146, 60, ${0.4 * (1 - prog)})`;
    ctx.lineWidth = 2.5;
    for (let i = -1; i <= 1; i++) {
      const offY = i * 16;
      ctx.beginPath();
      ctx.moveTo(casterPos.x - 20 * (isP ? 1 : -1), casterPos.y + offY);
      ctx.lineTo(casterPos.x - 55 * (isP ? 1 : -1), casterPos.y + offY + 8);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * 90도로 세워진 태권당수 손 렌더러
 * - isLeftHand: true일 때 왼손 (scale(-1, 1) + rotate(90도)로 엄지가 왼쪽 바깥, 손날이 오른쪽 안쪽)
 * - isLeftHand: false일 때 오른손 (rotate(90도)로 엄지가 오른쪽 바깥, 손날이 왼쪽 안쪽)
 */
function drawCrossChopHand(
  ctx: any,
  sprite: any,
  x: number,
  y: number,
  isLeftHand: boolean,
  alpha: number,
  scale: number = 0.95
) {
  if (!sprite || alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));
  ctx.translate(x, y);

  if (isLeftHand) {
    ctx.scale(-scale, scale);
  } else {
    ctx.scale(scale, scale);
  }
  ctx.rotate(Math.PI / 2);

  const sw = 80;
  const sh = 60;
  ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();
}

export function drawCrossChopEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const targetPos = drawCtx.targetPos;

  const karateImg = getKarateBlackImg();

  // 대형 X자 궤적 좌표 설정 (상대 중심 기준으로 양쪽 사이드로 교차하며 내려감)
  const handDistX = 72;
  const handStartY = -64;
  const handEndY = 56;

  // 왼손: 좌상단 -> 우하단 사이드 (\)
  const lStartX = targetPos.x - handDistX;
  const lStartY = targetPos.y + handStartY;
  const lEndX = targetPos.x + handDistX;
  const lEndY = targetPos.y + handEndY;

  // 오른손: 우상단 -> 좌하단 사이드 (/)
  const rStartX = targetPos.x + handDistX;
  const rStartY = targetPos.y + handStartY;
  const rEndX = targetPos.x - handDistX;
  const rEndY = targetPos.y + handEndY;

  const numTrail = 10;

  ctx.save();

  // [Step 2: 양손 당수 90도 세움 + 엄지 바깥 + 양쪽 사이드로 X자 교차 하강 + 시작~끝 전체 잔상]
  if (step === 2) {
    const curProg = Math.min(1.0, prog * 1.05);
    const currentTrailIdx = Math.min(numTrail, Math.floor(curProg * numTrail));

    // 1. 시작점부터 현재 진행 지점까지 남는 반투명 손 잔상
    // 사용자의 핵심 요구: "잔상은 시작점부터 끝 지점까지 다 나와야 되기 때문에 투명도 조절을 잘 해 줘야겠지."
    // 시작점에 가까울수록 0.16 ~ 끝에 갈수록 0.35로 자연스러운 농담(투명도) 조절
    for (let i = 0; i <= currentTrailIdx; i++) {
      const t = i / numTrail;
      const lx = lStartX + (lEndX - lStartX) * t;
      const ly = lStartY + (lEndY - lStartY) * t;
      const rx = rStartX + (rEndX - rStartX) * t;
      const ry = rStartY + (rEndY - rStartY) * t;

      const ratio = i / numTrail;
      const trailAlpha = 0.16 + 0.20 * ratio;

      drawCrossChopHand(ctx, karateImg, lx, ly, true, trailAlpha);
      drawCrossChopHand(ctx, karateImg, rx, ry, false, trailAlpha);
    }

    // 2. 현재 선두의 메인 손 (Leading Hands) - 가장 선명하고 또렷하게 타격
    const curHeadT = curProg;
    const curLx = lStartX + (lEndX - lStartX) * curHeadT;
    const curLy = lStartY + (lEndY - lStartY) * curHeadT;
    const curRx = rStartX + (rEndX - rStartX) * curHeadT;
    const curRy = rStartY + (rEndY - rStartY) * curHeadT;
    drawCrossChopHand(ctx, karateImg, curLx, curLy, true, 0.95);
    drawCrossChopHand(ctx, karateImg, curRx, curRy, false, 0.95);
  }

  // [Step 3: 타격 시 주황 점 파티클 튀김 & 전체 X자 잔상 반투명 페이드아웃]
  if (step === 3) {
    // 1. 완성된 X자 전체 잔상이 화면에 유지되며 서서히 페이드아웃
    const fade = Math.max(0, 1.0 - prog * 1.5);
    if (fade > 0.01) {
      for (let i = 0; i <= numTrail; i++) {
        const t = i / numTrail;
        const lx = lStartX + (lEndX - lStartX) * t;
        const ly = lStartY + (lEndY - lStartY) * t;
        const rx = rStartX + (rEndX - rStartX) * t;
        const ry = rStartY + (rEndY - rStartY) * t;

        const ratio = i / numTrail;
        const trailAlpha = (0.16 + 0.20 * ratio) * fade;

        drawCrossChopHand(ctx, karateImg, lx, ly, true, trailAlpha);
        drawCrossChopHand(ctx, karateImg, rx, ry, false, trailAlpha);
      }

      // 양쪽 사이드 끝에 도달한 최종 위치 손
      drawCrossChopHand(ctx, karateImg, lEndX, lEndY, true, 0.85 * fade);
      drawCrossChopHand(ctx, karateImg, rEndX, rEndY, false, 0.85 * fade);
    }

    // 2. 타격 시 사방으로 튀어나가는 주황 점 파티클
    const orangeParticles = [
      // 1) 고밀도 중심 및 근접 주황 점
      { angle: 0.2,  dist: 28, r: 5.0, color: "#EA580C" },
      { angle: 1.1,  dist: 34, r: 5.5, color: "#F97316" },
      { angle: 1.9,  dist: 30, r: 4.8, color: "#FB923C" },
      { angle: 2.8,  dist: 36, r: 5.2, color: "#EA580C" },
      { angle: 3.7,  dist: 26, r: 5.4, color: "#F97316" },
      { angle: 4.6,  dist: 32, r: 5.0, color: "#FB923C" },
      { angle: 5.4,  dist: 29, r: 4.6, color: "#EA580C" },
      // 2) 중간 확산 주황 점
      { angle: 0.45, dist: 55, r: 4.2, color: "#F97316" },
      { angle: 0.85, dist: 70, r: 3.6, color: "#EA580C" },
      { angle: 1.45, dist: 60, r: 4.5, color: "#FB923C" },
      { angle: 1.75, dist: 75, r: 3.4, color: "#F97316" },
      { angle: 2.35, dist: 50, r: 4.0, color: "#EA580C" },
      { angle: 2.65, dist: 80, r: 3.2, color: "#FB923C" },
      { angle: 3.25, dist: 65, r: 4.4, color: "#F97316" },
      { angle: 3.55, dist: 55, r: 3.8, color: "#EA580C" },
      { angle: 4.15, dist: 72, r: 4.0, color: "#FB923C" },
      { angle: 4.45, dist: 58, r: 3.5, color: "#F97316" },
      { angle: 5.05, dist: 78, r: 3.8, color: "#EA580C" },
      { angle: 5.75, dist: 62, r: 4.2, color: "#FB923C" },
      { angle: 6.10, dist: 68, r: 3.6, color: "#F97316" },
      // 3) 고속 원거리 비산 주황 점
      { angle: 0.65, dist: 105, r: 3.2, color: "#F97316" },
      { angle: 1.30, dist: 95,  r: 2.8, color: "#EA580C" },
      { angle: 2.10, dist: 110, r: 3.0, color: "#FB923C" },
      { angle: 2.90, dist: 100, r: 2.6, color: "#F97316" },
      { angle: 3.85, dist: 112, r: 3.0, color: "#EA580C" },
      { angle: 4.75, dist: 96,  r: 2.8, color: "#FB923C" },
      { angle: 5.50, dist: 108, r: 3.2, color: "#F97316" },
    ];

    const burstProgress = 1 - Math.pow(1 - prog, 2.2); // 초반 급속 분산 감속 커브
    const particleAlpha = Math.max(0, 1.0 - Math.pow(prog, 1.15));
    const dropY = prog * prog * 15; // 미세 중력 낙하

    ctx.save();
    for (const p of orangeParticles) {
      const px = targetPos.x + Math.cos(p.angle) * p.dist * burstProgress;
      const py = targetPos.y + Math.sin(p.angle) * p.dist * burstProgress * 0.85 + dropY;
      const curR = Math.max(0.6, p.r * (1 - prog * 0.35));

      ctx.globalAlpha = particleAlpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, curR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 🌪️ 239: 회오리 (Twister / たつまき) - 드래곤 타입 특수 기술
// 위력: 40 / 명중: 100 / PP: 20 / 20% 풀죽음 / 비접촉
// 설명: 강력한 회오리를 일으켜 상대를 끌어들여 공격한다. 상대를 풀죽게 만들 때가 있다.
// 연출: 바닥 모래 먼지 회전 ➔ 위로 솟구치는 반투명 하얀색 3D 모래시계형 토네이도
//      ➔ 내부 회전 볼륨 + 외부 나선 그라데이션 리본 다층 회전 ➔ 소산
// ============================================================================

/**
 * 회오리바람의 높이 비율(u: 0=바닥, 1=최상단)에 따른 반경(픽셀) 반환
 * - 아랫부분이 두껍고(38px), 중간 부분이 살짝 얇고(20px), 윗부분이 또 두꺼운(54px) 모래시계형 형태
 */
function getTwisterRadius(u: number): number {
  const clampedU = Math.max(0, Math.min(1, u));
  const uMid = 0.44;
  const rBase = 38; // 아랫부분 두꺼움
  const rMid = 20;  // 중간 부분 살짝 얇음
  const rTop = 54;  // 윗부분 또 두꺼움

  if (clampedU <= uMid) {
    const t = clampedU / uMid;
    const factor = (1 - t) * (1 - t);
    return rMid + (rBase - rMid) * factor;
  } else {
    const t = (clampedU - uMid) / (1 - uMid);
    const factor = Math.pow(t, 1.35);
    return rMid + (rTop - rMid) * factor;
  }
}

/**
 * 1. 전장 기류 앰비언트 (Twister Ambient Wind Atmosphere)
 * - 회오리가 몰아치며 전장에 은은한 폭풍/드래곤 기류 틴트 (전체 화면 100% 완전 커버)
 */
function drawTwisterAmbientWind(
  ctx: any,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  intensity: number
) {
  if (intensity <= 0.01) return;
  ctx.save();

  // 1. 전체 화면을 감싸는 은은한 돌풍 대기 틴트 (카메라 줌/시점 완벽 대응)
  ctx.fillStyle = `rgba(15, 23, 42, ${0.28 * intensity})`;
  ctx.fillRect(-6000, -6000, 14000, 14000);

  // 2. 대상 포켓몬 중심에서 퍼지는 드래곤 돌풍 앰비언트 방사 그라데이션
  const maxR = 850;
  const grad = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, maxR);
  grad.addColorStop(0.00, `rgba(241, 245, 249, ${0.20 * intensity})`); // 중심: 밝은 기류빛
  grad.addColorStop(0.35, `rgba(148, 163, 184, ${0.30 * intensity})`); // 중간: 돌풍 회색
  grad.addColorStop(0.70, `rgba(51, 65, 85, ${0.45 * intensity})`);   // 외곽: 어두운 폭풍 구름빛
  grad.addColorStop(1.00, `rgba(15, 23, 42, ${0.60 * intensity})`);

  ctx.fillStyle = grad;
  ctx.fillRect(-6000, -6000, 14000, 14000);

  ctx.restore();
}

/**
 * 2. 바닥 지면 흙먼지 소용돌이 렌더러
 * - 2.5D 타원 소용돌이 링 + 회전하는 풍성한 흙먼지 연무 구름 + 중심 흙먼지 집결 코어
 */
function drawTwisterGroundDust(
  ctx: any,
  centerX: number,
  baseY: number,
  baseRot: number,
  isBehind: boolean,
  intensity: number = 1.0
) {
  if (intensity <= 0.01) return;
  ctx.save();
  const baseAlpha = Math.min(1.0, intensity);

  // 1. 바닥 중심 흙먼지 집결 코어 (회오리가 지면에서 발원하는 부드러운 모래흙 틴트)
  if (!isBehind) {
    const coreGrad = ctx.createRadialGradient(centerX, baseY + 6, 2, centerX, baseY + 6, 36);
    coreGrad.addColorStop(0.0, `rgba(202, 160, 114, ${baseAlpha * 0.45})`);
    coreGrad.addColorStop(0.5, `rgba(224, 196, 155, ${baseAlpha * 0.25})`);
    coreGrad.addColorStop(1.0, "rgba(180, 140, 95, 0.0)");

    ctx.save();
    ctx.translate(centerX, baseY + 6);
    ctx.scale(1.0, 0.35);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. 바닥 지면 2.5D 타원 회전 흙먼지 링 (4중 동심 링)
  const numRings = 4;
  for (let r = 0; r < numRings; r++) {
    const ringProg = ((baseRot * 0.14) + r / numRings) % 1.0;
    const ringRadius = 14 + ringProg * 40;
    const ringAlpha = Math.sin(ringProg * Math.PI) * (isBehind ? 0.32 : 0.60) * baseAlpha;

    ctx.save();
    ctx.translate(centerX, baseY + 6);
    ctx.scale(1.0, 0.34); // 2.5D 바닥면 투영

    const ringColor = r % 2 === 0
      ? `rgba(215, 182, 138, ${ringAlpha})`
      : `rgba(240, 225, 195, ${ringAlpha * 0.85})`;

    ctx.strokeStyle = ringColor;
    ctx.lineWidth = Math.max(1.2, 2.8 * (1 - ringProg * 0.45));
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // 3. 바닥에서 소용돌이치며 피어오르는 풍성한 흙먼지 안개 구름 (10개 클러스터)
  const numPuffs = 10;
  for (let i = 0; i < numPuffs; i++) {
    const puffAng = (i * Math.PI * 2) / numPuffs + baseRot * 1.15;
    const distR = 14 + ((i * 13) % 24);
    const px = centerX + Math.cos(puffAng) * distR;
    const lift = Math.abs(Math.sin(baseRot * 1.3 + i * 0.9)) * 8 * baseAlpha;
    const py = baseY + 6 + Math.sin(puffAng) * (distR * 0.34) - lift;
    const z = Math.sin(puffAng);

    if (isBehind && z >= 0) continue;
    if (!isBehind && z < 0) continue;

    const puffSize = 12 + (i % 4) * 4.5;
    const puffAlpha = (isBehind ? 0.28 : 0.48) * baseAlpha;

    const puffGrad = ctx.createRadialGradient(px, py, 0, px, py, puffSize);
    puffGrad.addColorStop(0.0, `rgba(205, 162, 115, ${puffAlpha})`);
    puffGrad.addColorStop(0.45, `rgba(225, 196, 155, ${puffAlpha * 0.65})`);
    puffGrad.addColorStop(0.80, `rgba(238, 220, 190, ${puffAlpha * 0.25})`);
    puffGrad.addColorStop(1.0, "rgba(180, 140, 95, 0.0)");

    ctx.fillStyle = puffGrad;
    ctx.beginPath();
    ctx.arc(px, py, puffSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. 바닥 흙먼지 나선형 수렴 기류선 (Inflow Streaks)
  const numStreaks = 4;
  for (let s = 0; s < numStreaks; s++) {
    const streakProg = ((baseRot * 0.22) + s / numStreaks) % 1.0;
    const sAng = (s * Math.PI * 2) / numStreaks + baseRot * 0.8;
    const sDist = 42 - streakProg * 26;
    const sx = centerX + Math.cos(sAng) * sDist;
    const sy = baseY + 6 + Math.sin(sAng) * (sDist * 0.34);
    const sz = Math.sin(sAng);

    if (isBehind && sz >= 0) continue;
    if (!isBehind && sz < 0) continue;

    const sAlpha = Math.sin(streakProg * Math.PI) * (isBehind ? 0.25 : 0.50) * baseAlpha;
    ctx.save();
    ctx.strokeStyle = `rgba(220, 190, 148, ${sAlpha})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 3. 반투명 하얀색 그라데이션 모래시계형 토네이도 내부 바디 (Inner Vortex Funnel Body)
 * - 아랫부분 두껍고 중간 잘록하며 윗부분 두꺼운 모래시계형 실루엣 형태
 * - 중심부: 선명한 반투명 순백 형태 및 코어, 외곽: 투명 그라데이션
 */
function drawTwisterBody(
  ctx: any,
  centerX: number,
  baseY: number,
  curHeight: number,
  alpha: number,
  isBehind: boolean
) {
  if (alpha <= 0.01 || curHeight <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  const steps = 48;
  const maxR = 54;
  const peakAlpha = isBehind ? 0.38 : 0.58;

  // 1. 모래시계형 메인 바디 실루엣 (전체 외형 모래시계 형태)
  const grad = ctx.createLinearGradient(centerX - maxR, 0, centerX + maxR, 0);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  grad.addColorStop(0.20, `rgba(255, 255, 255, ${peakAlpha * 0.45})`);
  grad.addColorStop(0.50, `rgba(255, 255, 255, ${peakAlpha})`);
  grad.addColorStop(0.80, `rgba(255, 255, 255, ${peakAlpha * 0.45})`);
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();

  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const r = getTwisterRadius(u);
    const y = baseY - u * curHeight;
    const x = centerX - r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  for (let i = steps; i >= 0; i--) {
    const u = i / steps;
    const r = getTwisterRadius(u);
    const y = baseY - u * curHeight;
    const x = centerX + r;
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();

  // 2. 중심부 고밀도 백색 코어 (더욱 또렷하고 선명한 순백의 중앙 소용돌이 형태)
  const coreAlpha = peakAlpha * 0.70;
  const coreGrad = ctx.createLinearGradient(centerX - maxR * 0.5, 0, centerX + maxR * 0.5, 0);
  coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  coreGrad.addColorStop(0.50, `rgba(255, 255, 255, ${coreAlpha})`);
  coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();

  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const r = getTwisterRadius(u) * 0.52;
    const y = baseY - u * curHeight;
    const x = centerX - r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  for (let i = steps; i >= 0; i--) {
    const u = i / steps;
    const r = getTwisterRadius(u) * 0.52;
    const y = baseY - u * curHeight;
    const x = centerX + r;
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 4. 표면 고속 회전 바람 나선 급류 밴드 (Twister Surface Wind Torrents)
 * - 회오리 표면(radMult = 0.98)에 굵직하고 선명한 4개의 바람 나선 급류 밴드가 회전
 * - 강력한 3D 나선 회전감을 시각적으로 극대화
 */
function drawTwisterSurfaceTorrents(
  ctx: any,
  centerX: number,
  baseY: number,
  curHeight: number,
  baseRot: number,
  alpha: number,
  isBehind: boolean
) {
  if (alpha <= 0.01 || curHeight <= 6) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  const numStreams = 4;
  const steps = 80;
  const turns = 2.4;
  const radMult = 0.98;

  for (let s = 0; s < numStreams; s++) {
    const phaseOffset = (s * Math.PI * 2) / numStreams;
    const rotSpeed = baseRot;

    let currentChunk: { x: number; y: number; u: number; z: number }[] = [];

    const flushChunk = () => {
      if (currentChunk.length < 2) {
        currentChunk = [];
        return;
      }

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const startPt = currentChunk[0];
      const endPt = currentChunk[currentChunk.length - 1];
      const avgU = (startPt.u + endPt.u) * 0.5;
      const uFade = Math.sin(Math.max(0, Math.min(1, avgU)) * Math.PI);

      const peakAlpha = (isBehind ? 0.32 : 0.72) * (0.35 + 0.65 * uFade);
      const w = (isBehind ? 4.2 : 7.2) + uFade * 2.2;

      // 1. 은은한 바람빛 소프트 오라 그라데이션
      const auraGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      auraGrad.addColorStop(0.0, "rgba(241, 245, 249, 0.0)");
      auraGrad.addColorStop(0.2, `rgba(226, 232, 240, ${peakAlpha * 0.60})`);
      auraGrad.addColorStop(0.8, `rgba(226, 232, 240, ${peakAlpha * 0.60})`);
      auraGrad.addColorStop(1.0, "rgba(241, 245, 249, 0.0)");

      ctx.strokeStyle = auraGrad;
      ctx.lineWidth = w * 1.6;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      // 2. 순백 코어 하이라이트
      const coreGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      coreGrad.addColorStop(0.25, `rgba(255, 255, 255, ${peakAlpha * 0.85})`);
      coreGrad.addColorStop(0.50, `rgba(255, 255, 255, ${peakAlpha * 1.0})`);
      coreGrad.addColorStop(0.75, `rgba(255, 255, 255, ${peakAlpha * 0.85})`);
      coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.strokeStyle = coreGrad;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      ctx.restore();
      currentChunk = [];
    };

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const ang = phaseOffset + rotSpeed + u * turns * Math.PI * 2;
      const rad = getTwisterRadius(u) * radMult;

      const x = centerX + Math.cos(ang) * rad;
      const z = Math.sin(ang);
      const y = baseY - u * curHeight + z * (rad * 0.22);

      const isInCurrentPass = isBehind ? z < 0.05 : z > -0.05;

      if (isInCurrentPass) {
        currentChunk.push({ x, y, u, z });
      } else {
        flushChunk();
      }
    }
    flushChunk();
  }

  ctx.restore();
}

export interface TwisterDebrisDef {
  baseU: number;
  speedU: number;
  baseAngle: number;
  radiusRatio: number;
  size: number;
  kind: "wind" | "dust";
  color?: string;
}

export const TWISTER_DEBRIS: TwisterDebrisDef[] = [
  // 1. 순백색 반투명 바람 기류 입자 (Wind Motes / Air Droplets)
  { baseU: 0.06, speedU: 1.2, baseAngle: 0.3, radiusRatio: 0.85, size: 4.8, kind: "wind" },
  { baseU: 0.14, speedU: 1.4, baseAngle: 1.7, radiusRatio: 0.95, size: 3.6, kind: "wind" },
  { baseU: 0.22, speedU: 1.1, baseAngle: 3.2, radiusRatio: 0.70, size: 5.2, kind: "wind" },
  { baseU: 0.30, speedU: 1.5, baseAngle: 4.8, radiusRatio: 0.90, size: 3.4, kind: "wind" },
  { baseU: 0.38, speedU: 1.2, baseAngle: 0.9, radiusRatio: 1.05, size: 5.6, kind: "wind" },
  { baseU: 0.46, speedU: 1.0, baseAngle: 2.4, radiusRatio: 0.75, size: 4.0, kind: "wind" },
  { baseU: 0.54, speedU: 1.6, baseAngle: 4.0, radiusRatio: 0.98, size: 4.4, kind: "wind" },
  { baseU: 0.62, speedU: 1.1, baseAngle: 5.5, radiusRatio: 0.82, size: 5.0, kind: "wind" },
  { baseU: 0.70, speedU: 1.3, baseAngle: 1.1, radiusRatio: 0.75, size: 3.8, kind: "wind" },
  { baseU: 0.78, speedU: 1.0, baseAngle: 2.8, radiusRatio: 1.04, size: 4.6, kind: "wind" },
  { baseU: 0.86, speedU: 1.4, baseAngle: 4.4, radiusRatio: 0.88, size: 3.2, kind: "wind" },
  { baseU: 0.94, speedU: 1.2, baseAngle: 0.2, radiusRatio: 0.70, size: 4.2, kind: "wind" },

  // 2. 바닥에서 말려 올라간 고운 흙먼지 & 모래 파편 (Natural Soil & Sand Dust)
  { baseU: 0.04, speedU: 1.1, baseAngle: 4.5, radiusRatio: 0.78, size: 3.4, kind: "dust", color: "#E2C9A5" },
  { baseU: 0.10, speedU: 1.5, baseAngle: 3.0, radiusRatio: 0.84, size: 2.6, kind: "dust", color: "#D4B483" },
  { baseU: 0.18, speedU: 1.3, baseAngle: 4.6, radiusRatio: 1.00, size: 3.2, kind: "dust", color: "#C8A265" },
  { baseU: 0.26, speedU: 1.0, baseAngle: 0.6, radiusRatio: 0.80, size: 3.8, kind: "dust", color: "#DFD3C3" },
  { baseU: 0.34, speedU: 1.4, baseAngle: 2.2, radiusRatio: 0.86, size: 2.8, kind: "dust", color: "#E5D9C5" },
  { baseU: 0.42, speedU: 1.1, baseAngle: 3.7, radiusRatio: 0.64, size: 4.0, kind: "dust", color: "#D4B483" },
  { baseU: 0.50, speedU: 1.3, baseAngle: 5.2, radiusRatio: 0.94, size: 2.8, kind: "dust", color: "#BCA37F" },
  { baseU: 0.58, speedU: 0.9, baseAngle: 1.3, radiusRatio: 0.72, size: 3.6, kind: "dust", color: "#E2C9A5" },
  { baseU: 0.66, speedU: 1.4, baseAngle: 2.9, radiusRatio: 0.88, size: 3.0, kind: "dust", color: "#C8A265" },
  { baseU: 0.74, speedU: 1.2, baseAngle: 4.2, radiusRatio: 1.02, size: 3.8, kind: "dust", color: "#DFD3C3" },
  { baseU: 0.82, speedU: 1.5, baseAngle: 5.8, radiusRatio: 0.82, size: 2.4, kind: "dust", color: "#D4B483" },
  { baseU: 0.90, speedU: 1.0, baseAngle: 1.5, radiusRatio: 0.68, size: 3.2, kind: "dust", color: "#E5D9C5" },
  { baseU: 0.96, speedU: 1.3, baseAngle: 3.6, radiusRatio: 0.76, size: 2.6, kind: "dust", color: "#BCA37F" },
];

/**
 * 5. 3D 나선 궤도로 상승 회전하는 백색 바람 입자 & 흙먼지 렌더러
 */
function drawTwisterDebris(
  ctx: any,
  centerX: number,
  baseY: number,
  curHeight: number,
  baseRot: number,
  alpha: number,
  isBehind: boolean,
  windOnly: boolean = false
) {
  if (alpha <= 0.01 || curHeight <= 6) return;

  for (let i = 0; i < TWISTER_DEBRIS.length; i++) {
    const d = TWISTER_DEBRIS[i];
    if (windOnly && d.kind === "dust") continue;
    const u = (d.baseU + baseRot * 0.08 * d.speedU) % 1.0;
    const rad = getTwisterRadius(u) * d.radiusRatio;

    const rotSpeed = baseRot * (0.92 + 0.16 * (d.speedU - 1.0));
    const ang = d.baseAngle + rotSpeed + u * 2.2 * Math.PI;

    const x = centerX + Math.cos(ang) * rad;
    const z = Math.sin(ang);
    const y = baseY - u * curHeight + z * (rad * 0.20);

    if (isBehind && z >= 0) continue;
    if (!isBehind && z < 0) continue;

    const vFade = Math.sin(u * Math.PI);
    const pAlpha = alpha * vFade * (isBehind ? 0.55 : 0.92);
    const depthScale = 0.85 + 0.30 * ((z + 1) * 0.5);
    const curSize = d.size * depthScale;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1.0, pAlpha));

    if (d.kind === "wind") {
      // 1) 순백색 반투명 바람 기류 입자 (입체 3D 풍압 방울)
      const grad = ctx.createRadialGradient(
        x - curSize * 0.25,
        y - curSize * 0.25,
        0,
        x,
        y,
        curSize * 0.85
      );
      grad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.5, "rgba(241, 245, 249, 0.65)");
      grad.addColorStop(1.0, "rgba(226, 232, 240, 0.0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, curSize * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // 미세 하이라이트 글린트
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(x - curSize * 0.22, y - curSize * 0.22, Math.max(0.6, curSize * 0.25), 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 2) 자연스러운 고운 흙먼지 & 모래 알갱이
      const dustGrad = ctx.createRadialGradient(
        x - curSize * 0.2,
        y - curSize * 0.2,
        0,
        x,
        y,
        curSize * 0.65
      );
      const dustColor = d.color || "#D4B483";
      dustGrad.addColorStop(0.0, "#FAF6F0");
      dustGrad.addColorStop(0.5, dustColor);
      dustGrad.addColorStop(1.0, "rgba(180, 140, 95, 0.15)");

      ctx.fillStyle = dustGrad;
      ctx.beginPath();
      ctx.arc(x, y, curSize * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * 6. 회오리 외각 3D 나선 유선 리본 렌더러 (흰색 외각 투명)
 */
function drawTwisterOuter3DLines(
  ctx: any,
  centerX: number,
  baseY: number,
  curHeight: number,
  baseRot: number,
  alpha: number,
  isBehind: boolean
) {
  if (alpha <= 0.01 || curHeight <= 6) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  const numLines = 4;
  const steps = 80;
  const turns = 2.1;
  const radMult = 1.28;

  for (let l = 0; l < numLines; l++) {
    const phaseOffset = (l * Math.PI * 2) / numLines;
    const rotSpeed = baseRot;

    let currentChunk: { x: number; y: number; u: number; z: number }[] = [];

    const flushChunk = () => {
      if (currentChunk.length < 2) {
        currentChunk = [];
        return;
      }

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const startPt = currentChunk[0];
      const endPt = currentChunk[currentChunk.length - 1];
      const avgU = (startPt.u + endPt.u) * 0.5;
      const uFade = Math.sin(Math.max(0, Math.min(1, avgU)) * Math.PI);

      const depthFactor = isBehind ? 0.38 : 0.95;
      const peakAlpha = depthFactor * (0.35 + 0.65 * uFade);
      const w = (isBehind ? 4.5 : 9.5) + avgU * 4.5;

      // 1. 외각 투명 글로우 패스
      const glowGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      glowGrad.addColorStop(0.0, "rgba(241, 245, 249, 0.0)");
      glowGrad.addColorStop(0.25, `rgba(226, 232, 240, ${peakAlpha * 0.45})`);
      glowGrad.addColorStop(0.75, `rgba(226, 232, 240, ${peakAlpha * 0.45})`);
      glowGrad.addColorStop(1.0, "rgba(241, 245, 249, 0.0)");

      ctx.strokeStyle = glowGrad;
      ctx.lineWidth = w * 2.1;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      // 2. 바디 리본 패스
      const bodyGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      bodyGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      bodyGrad.addColorStop(0.20, `rgba(255, 255, 255, ${peakAlpha * 0.80})`);
      bodyGrad.addColorStop(0.80, `rgba(255, 255, 255, ${peakAlpha * 0.80})`);
      bodyGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.strokeStyle = bodyGrad;
      ctx.lineWidth = w * 1.15;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      // 3. 중심 순백 코어선 패스
      const coreGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      coreGrad.addColorStop(0.20, `rgba(255, 255, 255, ${peakAlpha * 0.95})`);
      coreGrad.addColorStop(0.80, `rgba(255, 255, 255, ${peakAlpha * 0.95})`);
      coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.strokeStyle = coreGrad;
      ctx.lineWidth = Math.max(2.6, w * 0.35);
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      ctx.restore();
      currentChunk = [];
    };

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const ang = phaseOffset + rotSpeed + u * turns * Math.PI * 2;
      const rad = getTwisterRadius(u) * radMult;

      const x = centerX + Math.cos(ang) * rad;
      const z = Math.sin(ang);
      const y = baseY - u * curHeight + z * (rad * 0.26);

      const isInCurrentPass = isBehind ? z < 0.05 : z > -0.05;

      if (isInCurrentPass) {
        currentChunk.push({ x, y, u, z });
      } else {
        flushChunk();
      }
    }
    flushChunk();
  }

  ctx.restore();
}

/**
 * 7. [유저 이미지 1:1 완벽 반영]: 외각 상단 및 하단 거대 회오리 선 밴드 (Outer Whirlwind Accent Swoosh Bands)
 * - 두께감 있는 와이드 리본(14~24px) + 중심 순백색(#FFFFFF) + 외곽 0.0 투명도(흰색 외각 투명)
 */
function drawTwisterOuterAccentSwooshes(
  ctx: any,
  centerX: number,
  baseY: number,
  curHeight: number,
  baseRot: number,
  alpha: number,
  isBehind: boolean
) {
  if (alpha <= 0.01 || curHeight <= 8) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  const swooshes = [
    // 1. [상단 외각 회오리 선]: 상단 넓게 펼쳐지는 거대 유선 (u: 0.70 ~ 0.92, radMult: 1.38)
    {
      uMin: 0.70,
      uMax: 0.92,
      radMult: 1.38,
      phaseOffset: 0.0,
      turns: 1.35,
      baseW: isBehind ? 8.5 : 16.5,
    },
    // 2. [하단 외각 회오리 선]: 상대 발밑/허리를 감싸며 앞으로 둥글게 휘어지는 거대 유선 (u: 0.15 ~ 0.38, radMult: 1.32)
    {
      uMin: 0.15,
      uMax: 0.38,
      radMult: 1.32,
      phaseOffset: Math.PI * 0.9,
      turns: 1.35,
      baseW: isBehind ? 7.5 : 14.5,
    },
    // 3. [중간 외각 보조 회오리 선]: 중심부를 감싸며 흐르는 다이내믹 유선 (u: 0.42 ~ 0.65, radMult: 1.35)
    {
      uMin: 0.42,
      uMax: 0.65,
      radMult: 1.35,
      phaseOffset: Math.PI * 0.45,
      turns: 1.35,
      baseW: isBehind ? 8.0 : 15.0,
    },
  ];

  const steps = 60;

  for (const sw of swooshes) {
    const rotSpeed = baseRot;
    let currentChunk: { x: number; y: number; u: number; z: number }[] = [];

    const flushChunk = () => {
      if (currentChunk.length < 2) {
        currentChunk = [];
        return;
      }

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const startPt = currentChunk[0];
      const endPt = currentChunk[currentChunk.length - 1];
      const avgU = (startPt.u + endPt.u) * 0.5;

      const uRel = (avgU - sw.uMin) / (sw.uMax - sw.uMin);
      const uFade = Math.sin(Math.max(0, Math.min(1, uRel)) * Math.PI);

      const depthFactor = isBehind ? 0.42 : 1.0;
      const peakAlpha = depthFactor * (0.40 + 0.60 * uFade);
      const w = sw.baseW * (0.85 + 0.30 * uFade);

      // 1. 외각 투명 글로우 패스
      const glowGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      glowGrad.addColorStop(0.0, "rgba(241, 245, 249, 0.0)");
      glowGrad.addColorStop(0.20, `rgba(226, 232, 240, ${peakAlpha * 0.50})`);
      glowGrad.addColorStop(0.50, `rgba(241, 245, 249, ${peakAlpha * 0.65})`);
      glowGrad.addColorStop(0.80, `rgba(226, 232, 240, ${peakAlpha * 0.50})`);
      glowGrad.addColorStop(1.0, "rgba(241, 245, 249, 0.0)");

      ctx.strokeStyle = glowGrad;
      ctx.lineWidth = w * 2.2;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      // 2. 바디 리본 패스
      const bodyGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      bodyGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      bodyGrad.addColorStop(0.20, `rgba(255, 255, 255, ${peakAlpha * 0.85})`);
      bodyGrad.addColorStop(0.50, `rgba(255, 255, 255, ${peakAlpha * 0.95})`);
      bodyGrad.addColorStop(0.80, `rgba(255, 255, 255, ${peakAlpha * 0.85})`);
      bodyGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.strokeStyle = bodyGrad;
      ctx.lineWidth = w * 1.15;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      // 3. 중심 순백 코어선 패스 (선명한 순백색 중심)
      const coreGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      coreGrad.addColorStop(0.20, `rgba(255, 255, 255, ${peakAlpha * 0.98})`);
      coreGrad.addColorStop(0.50, `rgba(255, 255, 255, ${peakAlpha * 1.0})`);
      coreGrad.addColorStop(0.80, `rgba(255, 255, 255, ${peakAlpha * 0.98})`);
      coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.strokeStyle = coreGrad;
      ctx.lineWidth = Math.max(3.2, w * 0.38);
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      ctx.restore();
      currentChunk = [];
    };

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = sw.uMin + t * (sw.uMax - sw.uMin);
      const ang = sw.phaseOffset + rotSpeed + t * sw.turns * Math.PI * 2;
      const rad = getTwisterRadius(u) * sw.radMult;

      const x = centerX + Math.cos(ang) * rad;
      const z = Math.sin(ang);
      const y = baseY - u * curHeight + z * (rad * 0.28);

      const isInCurrentPass = isBehind ? z < 0.05 : z > -0.05;

      if (isInCurrentPass) {
        currentChunk.push({ x, y, u, z });
      } else {
        flushChunk();
      }
    }
    flushChunk();
  }

  ctx.restore();
}

/**
 * 8. 회오리 소산 시 파열하는 바람 칼날 및 흙먼지/바람 입자 비산
 */
function drawTwisterBurstSplash(
  ctx: any,
  centerX: number,
  baseY: number,
  maxHeight: number,
  prog: number
) {
  const alpha = Math.max(0, 1.0 - prog);
  if (alpha <= 0.01) return;

  ctx.save();

  // 1. 소산 시 사방으로 뻗어 나가는 순백의 바람 칼날 아크 (Wind Blades)
  const numBlades = 8;
  for (let k = 0; k < numBlades; k++) {
    const bladeAng = (k * Math.PI * 2) / numBlades + prog * 0.7;
    const bladeDist = 28 + prog * 68;
    const bx = centerX + Math.cos(bladeAng) * bladeDist;
    const by = baseY - 0.45 * maxHeight + Math.sin(bladeAng) * (bladeDist * 0.40);
    const bladeLen = Math.max(2, 18 * (1 - prog * 0.8));

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(bladeAng + Math.PI * 0.5);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
    ctx.lineWidth = Math.max(1.0, 2.8 * (1 - prog));
    ctx.beginPath();
    ctx.moveTo(-bladeLen * 0.5, 0);
    ctx.quadraticCurveTo(0, -3, bladeLen * 0.5, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/**
 * 포켓몬 뒤쪽에 그려지는 회오리 후면 레이어 (Z < 0)
 */
export function drawTwisterBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const targetPos = drawCtx.targetPos;
  const centerX = targetPos.x;
  const baseY = targetPos.y + 40;
  const maxHeight = 150;
  const width = drawCtx.width || 512;
  const height = drawCtx.height || 384;

  const baseRot = frame.twisterRot ?? ((step - 1) * 3.5 + prog * 3.5);

  ctx.save();

  // [Step 1: 지면 흙먼지 소용돌이 발생 ➔ 회오리 기둥 솟구침 - 후면]
  if (step === 1) {
    const intensity = Math.min(0.80, 0.35 + prog * 0.45);
    drawTwisterAmbientWind(ctx, width, height, centerX, targetPos.y, intensity);

    const dustIntensity = prog <= 0.32
      ? Math.min(1.0, 0.60 + prog * 1.3)
      : Math.max(0.85, 1.0 - (prog - 0.32) * 0.25);
    drawTwisterGroundDust(ctx, centerX, baseY, baseRot, true, dustIntensity);

    // prog 0.0 ~ 0.32: 바닥 흙먼지만 맹렬히 회전 (기둥 없음)
    // prog 0.32 ~ 1.0: 흙먼지 속에서 회오리 기둥이 바닥에서 하늘로 가속하며 솟구쳐 오름!
    if (prog > 0.32) {
      const riseProg = (prog - 0.32) / 0.68;
      const easedRise = Math.pow(riseProg, 1.25);
      const curHeight = easedRise * maxHeight;
      const alpha = Math.min(0.92, 0.40 + riseProg * 0.52);

      drawTwisterBody(ctx, centerX, baseY, curHeight, alpha, true);
      drawTwisterSurfaceTorrents(ctx, centerX, baseY, curHeight, baseRot, alpha, true);
      drawTwisterDebris(ctx, centerX, baseY, curHeight, baseRot, alpha, true);
      drawTwisterOuter3DLines(ctx, centerX, baseY, curHeight, baseRot, alpha, true);
      drawTwisterOuterAccentSwooshes(ctx, centerX, baseY, curHeight, baseRot, alpha, true);
    }
  }

  // [Step 2: 3D 모래시계 토네이도 맹렬한 회전 & 3D 외각 유선 - 후면]
  if (step === 2) {
    const curHeight = maxHeight;

    drawTwisterAmbientWind(ctx, width, height, centerX, targetPos.y, 0.80);
    drawTwisterGroundDust(ctx, centerX, baseY, baseRot, true, 0.95);
    drawTwisterBody(ctx, centerX, baseY, curHeight, 0.92, true);
    drawTwisterSurfaceTorrents(ctx, centerX, baseY, curHeight, baseRot, 0.92, true);
    drawTwisterDebris(ctx, centerX, baseY, curHeight, baseRot, 0.92, true);
    drawTwisterOuter3DLines(ctx, centerX, baseY, curHeight, baseRot, 0.92, true);
    drawTwisterOuterAccentSwooshes(ctx, centerX, baseY, curHeight, baseRot, 0.95, true);
  }

  // [Step 3: 회오리 소산 & 바람/모래 먼지 잔향 비산 - 후면]
  if (step === 3) {
    const alpha = Math.max(0, 1.0 - prog);

    drawTwisterAmbientWind(ctx, width, height, centerX, targetPos.y, 0.80 * alpha);
    drawTwisterGroundDust(ctx, centerX, baseY, baseRot, true, alpha * 0.65);
    drawTwisterBody(ctx, centerX, baseY, maxHeight, alpha * 0.75, true);
    drawTwisterSurfaceTorrents(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, true);
    drawTwisterOuter3DLines(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, true);
    drawTwisterOuterAccentSwooshes(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, true);
  }

  ctx.restore();
}

/**
 * 포켓몬 앞쪽에 그려지는 회오리 전면 레이어 (Z >= 0)
 */
export function drawTwisterEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const targetPos = drawCtx.targetPos;
  const centerX = targetPos.x;
  const baseY = targetPos.y + 40;
  const maxHeight = 150;
  const width = drawCtx.width || 512;
  const height = drawCtx.height || 384;

  const baseRot = frame.twisterRot ?? ((step - 1) * 3.5 + prog * 3.5);

  ctx.save();

  // [Step 1: 바닥에서 흙먼지 소용돌이 전개 ➔ 회오리 기둥 솟구침 - 전면]
  if (step === 1) {
    const dustIntensity = prog <= 0.32
      ? Math.min(1.0, 0.60 + prog * 1.3)
      : Math.max(0.85, 1.0 - (prog - 0.32) * 0.25);
    drawTwisterGroundDust(ctx, centerX, baseY, baseRot, false, dustIntensity);

    // prog 0.0 ~ 0.32: 바닥 흙먼지만 맹렬히 회전 (기둥 없음)
    // prog 0.32 ~ 1.0: 흙먼지 속에서 회오리 기둥이 바닥에서 하늘로 가속하며 솟구쳐 오름!
    if (prog > 0.32) {
      const riseProg = (prog - 0.32) / 0.68;
      const easedRise = Math.pow(riseProg, 1.25);
      const curHeight = easedRise * maxHeight;
      const alpha = Math.min(1.0, 0.40 + riseProg * 0.60);

      drawTwisterBody(ctx, centerX, baseY, curHeight, alpha, false);
      drawTwisterSurfaceTorrents(ctx, centerX, baseY, curHeight, baseRot, alpha, false);
      drawTwisterDebris(ctx, centerX, baseY, curHeight, baseRot, alpha, false);
      drawTwisterOuter3DLines(ctx, centerX, baseY, curHeight, baseRot, alpha, false);
      drawTwisterOuterAccentSwooshes(ctx, centerX, baseY, curHeight, baseRot, alpha, false);
    }
  }

  // [Step 2: 3D 모래시계 토네이도 맹렬한 회전 & 3D 외각 유선 - 전면]
  if (step === 2) {
    const curHeight = maxHeight;

    drawTwisterGroundDust(ctx, centerX, baseY, baseRot, false, 0.98);
    drawTwisterBody(ctx, centerX, baseY, curHeight, 0.98, false);
    drawTwisterSurfaceTorrents(ctx, centerX, baseY, curHeight, baseRot, 0.98, false);
    drawTwisterDebris(ctx, centerX, baseY, curHeight, baseRot, 0.98, false);
    drawTwisterOuter3DLines(ctx, centerX, baseY, curHeight, baseRot, 0.98, false);
    drawTwisterOuterAccentSwooshes(ctx, centerX, baseY, curHeight, baseRot, 0.98, false);
  }

  // [Step 3: 회오리 소산 & 바람 칼날/흙먼지 비산 - 전면]
  if (step === 3) {
    const alpha = Math.max(0, 1.0 - prog);

    drawTwisterGroundDust(ctx, centerX, baseY, baseRot, false, alpha * 0.70);
    drawTwisterBody(ctx, centerX, baseY, maxHeight, alpha * 0.75, false);
    drawTwisterSurfaceTorrents(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, false);
    drawTwisterOuter3DLines(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, false);
    drawTwisterOuterAccentSwooshes(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, false);

    // 소산 시 파열하는 바람 칼날 및 흙먼지/바람 입자
    drawTwisterBurstSplash(ctx, centerX, baseY, maxHeight, prog);
  }

  ctx.restore();
}


// ============================================================================
// 🌧️ 240: 비바라기 (Rain Dance / あまごい) - 물 타입 변화 기술 (날씨)
// 위력: — / 명중: — / PP: 5 / 5턴간 비 날씨 조성
// 설명: 5턴 동안 비를 내리게 하여 물타입 기술의 위력을 올린다. (불꽃 0.5배, 물 1.5배)
// 연출: 시전자 기원 점프 ➔ 전장 사선 폭우 쏟아짐 ➔ 지면 물결 링 & 튀는 물방울
// ============================================================================

export function drawRainDanceBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep || 1;
  if (step === 1) return;
  const prog = frame.effectProgress || 0;

  ctx.save();

  // 비 내릴 때 전장 어두워지는 은은한 블루 필터 틴트 (구름 오브젝트 없음)
  const tintAlpha = step === 2 ? Math.min(0.18, prog * 0.25) : 0.18 * (1 - prog * 0.3);
  ctx.fillStyle = `rgba(15, 23, 42, ${tintAlpha})`;
  ctx.fillRect(0, 0, drawCtx.width || 512, drawCtx.height || 384);

  ctx.restore();
}

// 1단계: 선행 빗방울 (화면 중앙부에서 1~2줄기가 먼저 톡, 톡 떨어짐)
interface EarlyDrop {
  x: number;
  startProg: number; // 시작 시점 (Step 2 prog 기준)
  duration: number;  // 지면까지 낙하하는 구간 길이
}

const EARLY_DROPS: EarlyDrop[] = [
  // 1번째: 화면 중앙에 가장 먼저 떨어지는 1줄기
  { x: 235, startProg: 0.00, duration: 0.35 },
  // 2번째: 약간 우측에 뒤이어 떨어지는 2번째 줄기
  { x: 340, startProg: 0.22, duration: 0.35 },
  // 3~4번째: 비가 시작되려는 순간 좌우에서 톡톡 떨어짐
  { x: 150, startProg: 0.40, duration: 0.32 },
  { x: 420, startProg: 0.46, duration: 0.32 },
];

// 2단계: 본격적인 빗줄기 (Y축 높이를 30~350px로 사방에 고르게 분산시켜 일렬 정렬 및 동시 낙하 원천 차단)
const MAIN_RAIN_STREAKS = [
  { x: 60,  yOffset: 30,  speed: 1.02 },
  { x: 130, yOffset: 180, speed: 1.08 },
  { x: 190, yOffset: 90,  speed: 0.98 },
  { x: 250, yOffset: 310, speed: 1.12 },
  { x: 310, yOffset: 220, speed: 1.05 },
  { x: 370, yOffset: 70,  speed: 1.10 },
  { x: 430, yOffset: 270, speed: 1.04 },
  { x: 480, yOffset: 140, speed: 1.06 },
  { x: 90,  yOffset: 350, speed: 1.14 },
  { x: 160, yOffset: 250, speed: 1.00 },
  { x: 220, yOffset: 40,  speed: 1.06 },
  { x: 280, yOffset: 160, speed: 1.10 },
  { x: 350, yOffset: 300, speed: 1.02 },
  { x: 410, yOffset: 120, speed: 1.08 },
];

export function drawRainDanceEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const w = drawCtx.width || 512;
  const h = drawCtx.height || 384;

  ctx.save();

  // [Step 1: 시전자 점프 외 링 및 파티클 효과 제거됨]

  // 사선 각도: 우상단 -> 좌하단 (-0.45 라디안, 약 -25도)
  const slantDx = -14;
  const slantDy = 32;

  // [Step 2 초중반: 한두 줄기 먼저 톡, 톡 떨어지는 선행 빗방울]
  if (step === 2 && prog < 0.75) {
    for (const d of EARLY_DROPS) {
      if (prog >= d.startProg && prog <= d.startProg + d.duration) {
        const dropT = (prog - d.startProg) / d.duration;
        const curY = -20 + dropT * 310;
        const curX = d.x + (dropT * 310 / slantDy) * slantDx;

        const dropAlpha = Math.sin(dropT * Math.PI * 0.9) * 0.95;
        ctx.strokeStyle = `rgba(224, 242, 254, ${dropAlpha})`;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.lineTo(curX + slantDx, curY + slantDy);
        ctx.stroke();

        // 지면 도달 시 작은 물방울 튀김
        if (dropT > 0.70) {
          const hitProg = (dropT - 0.70) / 0.30;
          const hitR = 2 + hitProg * 5;
          const hitAlpha = (1 - hitProg) * 0.55;
          ctx.strokeStyle = `rgba(186, 230, 253, ${hitAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(curX + slantDx, curY + slantDy, hitR, hitR * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }

  // [Step 2 후반 & Step 3: 전장에 자연스럽게 흩뿌려지는 본격적인 사선 빗줄기]
  // Y축 높이가 30~350px로 각각 완전히 다르므로 일렬로 뭉쳐 내리지 않고 자연스럽게 교차 비산
  if ((step === 2 && prog >= 0.50) || step === 3) {
    const rainAlpha = step === 2
      ? Math.min(0.90, ((prog - 0.50) / 0.50) * 0.90)
      : (1 - prog * 0.30) * 0.90;

    ctx.strokeStyle = `rgba(224, 242, 254, ${rainAlpha})`;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";

    const loopH = h + slantDy;
    // Step 2 후반(0.50~1.0) -> Step 3(0.0~1.0) 끊김 없이 부드럽게 이어지는 연속 시간축
    const t = step === 2 ? (prog - 0.50) : (0.50 + prog);

    for (let i = 0; i < MAIN_RAIN_STREAKS.length; i++) {
      const s = MAIN_RAIN_STREAKS[i];
      const dropFallDist = t * s.speed * 680;
      const curY = (s.yOffset + dropFallDist) % loopH - slantDy;
      const curX = ((s.x + (dropFallDist / slantDy) * slantDx) % w + w) % w;

      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.lineTo(curX + slantDx, curY + slantDy);
      ctx.stroke();
    }
  }

  // [Step 3: 지면 물결 리플 링 & 빗방울 물보라 바운스]
  if (step === 3) {
    const rippleCount = 8;
    const ripplePositions = [
      { x: 120, y: 260 }, { x: 210, y: 290 }, { x: 340, y: 250 },
      { x: 420, y: 270 }, { x: 170, y: 230 }, { x: 280, y: 275 },
      { x: 380, y: 220 }, { x: 460, y: 285 },
    ];

    for (let r = 0; r < rippleCount; r++) {
      const pos = ripplePositions[r];
      const rProg = (prog + r * 0.15) % 1.0;
      const radius = 6 + rProg * 22;
      const rAlpha = Math.max(0, 1.0 - rProg) * 0.65;

      ctx.strokeStyle = `rgba(186, 230, 253, ${rAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, radius, radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 튀어오르는 작은 물보라 점
      if (rProg < 0.5) {
        const splashH = Math.sin(rProg * Math.PI * 2) * 8;
        ctx.fillStyle = `rgba(255, 255, 255, ${rAlpha * 1.2})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - splashH, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}
