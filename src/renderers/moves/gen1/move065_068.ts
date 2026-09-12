// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { drawPeckImpactSpark } from "./move061_064.js";
import { drawStarburstImpact, drawMiniRetroStar } from "../common/helpers.js";
import { drawFootprintStamp } from "./move025_028.js";

// ============================================================================
// 065: 회전부리 (Drill Peck) Helpers & Renderer
// ============================================================================

/**
 * 3차원 원추형 회전선 렌더러 (3D Conical Drill Rotation Lines)
 * - 스프라이트가 렌더링되는 로컬 좌표계(translate(px, py) + rotate(rot))와 100% 동일한 공간에서 렌더링
 * - 포켓몬의 발(y=0)부터 부리/머리끝(y=-drawH)까지 몸체 중심축을 완벽히 감싸는 정확히 3가닥의 순백 나선선
 * - 선의 양 끝단은 투명(alpha: 0.0)하게 페이드아웃
 * - 스프라이트 회전 각도(전면 ➔ 측면 ➔ 후면)와 완벽히 동기화되어 일체감 있게 회전
 * - isFrontLayer=false: 포켓몬 뒤쪽으로 돌아가는 반구간 (drawBehindEffect)
 * - isFrontLayer=true: 포켓몬 앞쪽을 가로지르는 반구간 (drawEffect)
 */
export function draw3DDrillRotationLines(
  ctx: any,
  casterX: number,
  casterY: number,
  casterRot: number,
  spinPhase: number,
  isFrontLayer: boolean,
  intensity: number = 1.0,
  isPlayer: boolean = true
) {
  if (intensity <= 0.01) return;

  ctx.save();
  // 스프라이트 렌더링 엔진과 100% 동일한 기준점 및 회전각 적용
  ctx.translate(casterX, casterY);
  ctx.rotate(casterRot);

  // 스프라이트 로컬 공간:
  // - 발 위치: y = 0
  // - 몸체 중심: y = -35 ~ -40px
  // - 부리/머리끝: y = -70 ~ -75px
  // - 가로 폭: x축 방향
  // - 3D 깊이: z축 방향 (z > 0 전면, z < 0 후면)
  const NUM_BLADES = 3;
  const STEPS_PER_BLADE = 28;
  const drillLen = isPlayer ? 74 : 64; // 플레이어/적 크기 비례
  const baseOffset = isPlayer ? 6 : 4;

  for (let b = 0; b < NUM_BLADES; b++) {
    const bladePhase = spinPhase + b * ((Math.PI * 2) / NUM_BLADES);

    const points: { x: number; y: number; z: number; u: number }[] = [];
    for (let s = 0; s <= STEPS_PER_BLADE; s++) {
      const u = s / STEPS_PER_BLADE; // 0.0(발) ~ 1.0(부리끝)
      
      // 몸체 축(-Y 방향)을 따라 발에서 머리로 진행
      const yLocal = -(baseOffset + u * drillLen);
      // 원추형 반경: 발 부근 36px -> 부리 끝 14px로 날카롭게 수렴
      const rLocal = (isPlayer ? 36 : 30) - u * (isPlayer ? 22 : 18);

      // 한 가닥당 약 1.15바퀴 3D 나선
      const phi = bladePhase + u * (Math.PI * 2.3);
      const xLocal = rLocal * Math.cos(phi);
      const zLocal = rLocal * Math.sin(phi);

      points.push({ x: xLocal, y: yLocal, z: zLocal, u });
    }

    // 앞/뒤 레이어에 맞는 연속 세그먼트 분리
    let curRun: { x: number; y: number; z: number; u: number }[] = [];

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const inLayer = isFrontLayer ? pt.z >= -3 : pt.z <= 3;

      if (inLayer) {
        curRun.push(pt);
      } else {
        if (curRun.length >= 2) {
          renderHelicalRun(ctx, curRun, isFrontLayer, intensity);
        }
        curRun = [];
      }
    }
    if (curRun.length >= 2) {
      renderHelicalRun(ctx, curRun, isFrontLayer, intensity);
    }
  }

  ctx.restore();
}

/**
 * 헬퍼: 3D 나선 세그먼트 스트로크 (양 끝단 투명 페이드 그라디언트)
 */
function renderHelicalRun(
  ctx: any,
  run: { x: number; y: number; z: number; u: number }[],
  isFront: boolean,
  intensity: number
) {
  const pStart = run[0];
  const pEnd = run[run.length - 1];

  const grad = ctx.createLinearGradient(pStart.x, pStart.y, pEnd.x, pEnd.y);
  const peakAlpha = (isFront ? 0.98 : 0.60) * intensity;

  // 세그먼트 양 끝은 투명(0.0), 중심은 백색(peakAlpha)
  grad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
  grad.addColorStop(0.25, `rgba(255, 255, 255, ${(peakAlpha * 0.80).toFixed(2)})`);
  grad.addColorStop(0.50, `rgba(255, 255, 255, ${peakAlpha.toFixed(2)})`);
  grad.addColorStop(0.75, `rgba(255, 255, 255, ${(peakAlpha * 0.80).toFixed(2)})`);
  grad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

  ctx.save();
  ctx.strokeStyle = grad;
  ctx.lineWidth = isFront ? 2.6 : 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(run[0].x, run[0].y);
  for (let k = 1; k < run.length; k++) {
    ctx.lineTo(run[k].x, run[k].y);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * 065 회전부리 (Drill Peck) Behind Effect
 * - 포켓몬 뒤쪽으로 감겨 돌아가는 3D 회전선 렌더링
 */
export function drawDrillPeckBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    pm?: any;
    em?: any;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false) return;
  const { isPlayer: isP, pm, em } = drawCtx;

  // 스프라이트 렌더링과 100% 동일한 기준 좌표 및 회전각 추출
  const casterBase = isP ? pm : em;
  const casterX = casterBase.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const casterY = casterBase.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const casterRot = isP ? (frame.pRot ?? 1.22) : (frame.eRot ?? -1.95);

  const drillIntensity = frame.drillIntensity ?? (frame.moveStep && frame.moveStep >= 1 && frame.moveStep <= 8 ? 1.0 : 0);
  const spinPhase = frame.drillSpinPhase ?? ((frame.moveStep || 1) * Math.PI * 0.5);

  if (drillIntensity > 0.02) {
    draw3DDrillRotationLines(ctx, casterX, casterY, casterRot, spinPhase, false, drillIntensity, isP);
  }
}

/**
 * 065 회전부리 (Drill Peck) Front Effect
 * - 포켓몬 앞쪽으로 감겨 돌아가는 3D 회전선 렌더링
 * - 매 회전 타격 시 피격 지점에 쪼기 타격 이펙트 (drawPeckImpactSpark) 직격
 */
export function drawDrillPeckEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    pm?: any;
    em?: any;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false) return;
  const { isPlayer: isP, isHit, pm, em, targetPos } = drawCtx;
  const step = frame.moveStep || 1;

  // 1. 스프라이트와 100% 일치하는 기준 좌표 및 회전각
  const casterBase = isP ? pm : em;
  const casterX = casterBase.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const casterY = casterBase.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const casterRot = isP ? (frame.pRot ?? 1.22) : (frame.eRot ?? -1.95);

  const drillIntensity = frame.drillIntensity ?? (step >= 1 && step <= 8 ? 1.0 : 0);
  const spinPhase = frame.drillSpinPhase ?? (step * Math.PI * 0.5);

  // 1. 포켓몬 전면 3D 회전선
  if (drillIntensity > 0.02) {
    draw3DDrillRotationLines(ctx, casterX, casterY, casterRot, spinPhase, true, drillIntensity, isP);
  }

  // 2. 피격자 중심 쪼기 타격 이펙트 (drawPeckImpactSpark)
  if (isHit) {
    const targetX = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
    const targetY = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));
    const hitY = targetY - (isP ? 12 : 8);

    if (step === 2) {
      drawPeckImpactSpark(ctx, targetX, hitY, 1.0, false);
    } else if (step === 4) {
      drawPeckImpactSpark(ctx, targetX, hitY, 1.2, false);
    } else if (step === 6) {
      drawPeckImpactSpark(ctx, targetX, hitY, 1.4, true);
    } else if (step === 8) {
      drawPeckImpactSpark(ctx, targetX, hitY, 1.7, true);
    }
  }
}

// ============================================================================
// 066: 지옥바퀴 (Submission) Helpers & Renderer
// ============================================================================

/**
 * 066 지옥바퀴 코믹 크런치 버스트 폴리곤 헬퍼
 */
function drawComicCrunchBurst(
  ctx: any,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number = 8,
  color: string = "#FFFFFF",
  strokeColor: string = "#D97706"
) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3.2;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 지옥바퀴 모션블러 (Wheel Motion Blur Renderer)
 * - 두 포켓몬이 맞물려 회전하는 궤적 주변에 생기는 바퀴 형태의 고속 모션블러
 * - isFront=false: 포켓몬 뒤편 회전 디스크 및 앰비언트 글로우
 * - isFront=true: 포켓몬 앞을 가로지르는 고속 원형 림 궤적선(끝단 투명 페이드) & 스포크 잔상 & 비산 스파크
 */
export function drawSubmissionWheelMotionBlur(
  ctx: any,
  cx: number,
  cy: number,
  spinAngle: number,
  isFront: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);

  if (!isFront) {
    // [뒤쪽 레이어] 회전 오라 링 및 반투명 모션블러 디스크
    // 1. 넓은 오렌지 모션 글로우 링
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(251, 146, 60, 0.35)";
    ctx.lineWidth = 38;
    ctx.stroke();

    // 2. 내부 화이트-옐로우 회전 코어
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 20;
    ctx.stroke();

    // 3. 중심 회전 나선 소용돌이 기류
    ctx.save();
    ctx.rotate(spinAngle);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.30)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22 + i * 8, a, a + Math.PI * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // [앞쪽 레이어] 바퀴 외곽 림 모션블러 (Wheel Rim Motion Blur Arcs)
    // 회전 각도에 맞추어 도는 4개의 두꺼운 고속 원호 (양 끝단 투명 페이드)
    const numArcs = 4;
    const baseRadius = 58;
    const arcLengths = [Math.PI * 0.75, Math.PI * 0.85, Math.PI * 0.70, Math.PI * 0.80];
    const widths = [6.0, 4.5, 7.0, 5.0];

    ctx.save();
    ctx.rotate(spinAngle);

    for (let i = 0; i < numArcs; i++) {
      const startAngle = (i * Math.PI * 2) / numArcs;
      const arcLen = arcLengths[i];
      const r = baseRadius + (i % 2 === 0 ? 8 : -4);
      const strokeW = widths[i];

      // 부드러운 끝단 투명도를 위한 세그먼트 보간 스트로크
      const SEGMENTS = 20;
      for (let s = 0; s < SEGMENTS; s++) {
        const u0 = s / SEGMENTS;
        const u1 = (s + 1) / SEGMENTS;
        const a0 = startAngle + u0 * arcLen;
        const a1 = startAngle + u1 * arcLen;

        // 양 끝단 투명, 중간 100% 불투명 곡선 (sin curve)
        const alphaFactor = Math.sin(u0 * Math.PI);
        const alpha = Math.max(0, Math.min(1.0, alphaFactor * 1.3));

        if (alpha > 0.02) {
          ctx.beginPath();
          ctx.arc(0, 0, r, a0, a1 + 0.03); // 미세 오버랩으로 매끄러운 연결
          ctx.strokeStyle = (i === 0 || i === 2)
            ? `rgba(255, 255, 255, ${(alpha * 0.95).toFixed(2)})`
            : `rgba(254, 215, 170, ${(alpha * 0.85).toFixed(2)})`;
          ctx.lineWidth = strokeW;
          ctx.lineCap = "round";
          ctx.stroke();
        }
      }
    }

    // 4개의 스포크(바퀴 살) 고속 회전 잔상
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      const sa = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * 14, Math.sin(sa) * 14);
      // 약간 휘어진 회전 스포크 잔상
      const midAngle = sa - 0.22;
      const endAngle = sa - 0.40;
      ctx.quadraticCurveTo(
        Math.cos(midAngle) * 38,
        Math.sin(midAngle) * 38,
        Math.cos(endAngle) * 64,
        Math.sin(endAngle) * 64
      );
      ctx.stroke();
    }

    // 바퀴 원심력으로 바깥으로 튕겨나가는 스파크 및 에너지 입자
    for (let p = 0; p < 12; p++) {
      const pAngle = (p * Math.PI * 2) / 12 + spinAngle * 1.5;
      const pDist = 65 + ((p * 7) % 24);
      const px = Math.cos(pAngle) * pDist;
      const py = Math.sin(pAngle) * pDist;
      const pSize = 1.8 + (p % 3);

      ctx.fillStyle = p % 2 === 0 ? "#FFFFFF" : "#FDE047";
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * 상대 필드 대격돌 내리꽂기 충격파 & 지면 흙먼지 렌더러
 */
export function drawSubmissionSlamImpact(
  ctx: any,
  groundX: number,
  groundY: number,
  intensity: number = 1.0
) {
  if (intensity <= 0.01) return;
  ctx.save();

  // 1. 지면 타원 충격파 링 (Ground Shockwave Ellipses)
  const rX1 = 65 * intensity;
  const rY1 = 22 * intensity;
  ctx.beginPath();
  ctx.ellipse(groundX, groundY, rX1, rY1, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(249, 115, 22, ${(0.80 * intensity).toFixed(2)})`;
  ctx.lineWidth = 5.0;
  ctx.stroke();

  const rX2 = 42 * intensity;
  const rY2 = 14 * intensity;
  ctx.beginPath();
  ctx.ellipse(groundX, groundY, rX2, rY2, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${(0.95 * intensity).toFixed(2)})`;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // 2. 8방향 격투 스타버스트 & 다각형 크런치 버스트
  drawStarburstImpact(ctx, groundX, groundY - 10, "#EA580C", "#FBBF24", Math.round(44 * intensity));
  drawComicCrunchBurst(ctx, groundX, groundY - 10, Math.round(36 * intensity), Math.round(18 * intensity), 8, "#FFFFFF", "#D97706");

  // 3. 좌우로 솟구쳐 튀는 지면 흙먼지 및 암석 파편
  const dustParticles = [
    { dx: -45, dy: -28, r: 5.5, color: "#D97706" },
    { dx: -35, dy: -18, r: 7.0, color: "#EA580C" },
    { dx: -22, dy: -36, r: 4.5, color: "#FED7AA" },
    { dx: -55, dy: -12, r: 6.0, color: "#9A3412" },
    { dx: 45, dy: -28, r: 5.5, color: "#D97706" },
    { dx: 35, dy: -18, r: 7.0, color: "#EA580C" },
    { dx: 22, dy: -36, r: 4.5, color: "#FED7AA" },
    { dx: 55, dy: -12, r: 6.0, color: "#9A3412" },
  ];

  for (const d of dustParticles) {
    ctx.fillStyle = d.color;
    ctx.globalAlpha = 0.75 * intensity;
    ctx.beginPath();
    ctx.arc(groundX + d.dx * intensity, groundY + d.dy * intensity, d.r * intensity, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 066 지옥바퀴 (Submission) Behind Effect
 * - 컷씬 주황색 배경(중간부분만 살짝 흰색 방사형 그라디언트 + 애니메이션 방사선 텍스처)
 * - 두 포켓몬 뒤편의 바퀴 회전 오라 및 모션블러 디스크
 */
export function drawSubmissionBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width: number;
    height: number;
    em?: any;
    pm?: any;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false && !frame.submissionCutscene) return;

  // 1. 주황색 배경 (중간부분만 살짝 흰) 컷씬 배경
  if (frame.submissionCutscene) {
    ctx.save();
    const cx = 280;
    const cy = 190;

    // 전체 화면 채우는 방사형 주황색 그라디언트 (중간부분 살짝 흰색)
    const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 270);
    bgGrad.addColorStop(0.00, "#FFFFFF");       // 중간부분 순백 (White core)
    bgGrad.addColorStop(0.18, "#FFF7ED");       // 연한 웜 크림 화이트
    bgGrad.addColorStop(0.38, "#FED7AA");       // 부드러운 밝은 오렌지
    bgGrad.addColorStop(0.65, "#FB923C");       // 비비드 격투 오렌지
    bgGrad.addColorStop(0.88, "#EA580C");       // 짙은 딥 오렌지
    bgGrad.addColorStop(1.00, "#C2410C");       // 외곽 엠버 브라운

    ctx.fillStyle = bgGrad;
    ctx.fillRect(-600, -2000, 2000, 4000);

    // 극적인 격투 애니메이션 효과: 중심 방사선 (Radial Energy Rays)
    const spinAngle = frame.wheelSpinAngle || 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spinAngle * 0.3);
    const numRays = 18;
    for (let i = 0; i < numRays; i++) {
      const a0 = (i * Math.PI * 2) / numRays;
      const a1 = a0 + (Math.PI / numRays) * 0.42;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 360, a0, a1);
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
      ctx.fill();
    }
    ctx.restore();

    // 두 포켓몬 뒤편의 바퀴 모션블러 디스크 & 회전 오라
    drawSubmissionWheelMotionBlur(ctx, cx, cy, spinAngle, false);
    ctx.restore();
  }
}

/**
 * 066 지옥바퀴 (Submission) Front Effect
 * - 컷씬 중: 포켓몬 전면을 감싸는 바퀴의 모션블러 림 & 스포크 잔상 & 비산 스파크
 * - 급강하 중: 수직 스피드 라인
 * - 상대 필드 내리꽂기: 쾅! 지면 충격파 타원 링 + 흙먼지 + 스타버스트
 */
export function drawSubmissionEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    pm?: any;
    em?: any;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false && !frame.submissionCutscene) return;
  const { isPlayer: isP, pm, em } = drawCtx;
  const step = frame.moveStep || 1;

  // 1. 컷씬 중: 포켓몬 전면 바퀴 림 모션블러 렌더링
  if (frame.submissionCutscene) {
    const cx = 280;
    const cy = 190;
    const spinAngle = frame.wheelSpinAngle || 0;
    drawSubmissionWheelMotionBlur(ctx, cx, cy, spinAngle, true);
    return;
  }

  // 2. 상대 필드 급강하 (Step 9) 및 대격돌 내리꽂기 (Step 10, 11)
  // 대상 필드(상대방 플랫폼 위치) 추출
  const targetBase = isP ? em : pm;
  const slamX = targetBase.x;
  const slamY = targetBase.y;

  if (step === 9) {
    // 급강하 수직 스피드 라인 (윗부분 100% 투명 페이드아웃 그라디언트)
    ctx.save();
    ctx.lineCap = "round";
    const lineConfigs = [
      { xo: -24, topOff: -140, botOff: -65, w: 2.4 },
      { xo: -12, topOff: -160, botOff: -55, w: 3.2 },
      { xo: 0,   topOff: -170, botOff: -50, w: 3.8 },
      { xo: 12,  topOff: -160, botOff: -55, w: 3.2 },
      { xo: 24,  topOff: -140, botOff: -65, w: 2.4 },
    ];
    for (const lc of lineConfigs) {
      const y0 = slamY + lc.topOff;
      const y1 = slamY + lc.botOff;
      const lineGrad = ctx.createLinearGradient(0, y0, 0, y1);
      lineGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)"); // 윗부분 100% 투명
      lineGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.25)");
      lineGrad.addColorStop(0.75, "rgba(255, 255, 255, 0.70)");
      lineGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.95)"); // 아랫부분 선명한 백색

      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = lc.w;
      ctx.beginPath();
      ctx.moveTo(slamX + lc.xo, y0);
      ctx.lineTo(slamX + lc.xo, y1);
      ctx.stroke();
    }
    ctx.restore();
  } else if (step === 10) {
    // 3. 상대 필드 대격돌 내리꽂기 (Step 10)
    drawSubmissionSlamImpact(ctx, slamX, slamY, 1.0);
  } else if (step === 11) {
    // 4. 충격파 잔향 및 흙먼지 소멸 (Step 11)
    drawSubmissionSlamImpact(ctx, slamX, slamY, 0.45);
  }
}

// ============================================================================
// 067: 안다리걸기 (Low Kick) Renderer
// ============================================================================

/**
 * 067: 안다리걸기 (Low Kick) Effect
 * - 적 스프라이트 아래쪽(발목/지면 라인)에서 검정 발바닥 아이콘이 좌에서 우로 탁! 치기
 * - 발바닥 이동경로 뒤편에 격투 색상(#F97316 ~ #EA580C)의 유선형 잔상 궤적 형성 (뒤쪽은 100% 투명 페이드아웃)
 * - 잔상 경로를 따라 서서히 사라지는 반투명 격투색 잔상 발바닥 배치
 * - 타격 지점에서 탁! 걸어 넘어뜨리는 격투 임팩트 버스트 & 바닥 흙먼지 연출
 */
export function drawLowKickEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    pm?: any;
    em?: any;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false) return;
  const { isPlayer: isP, isHit, em, pm } = drawCtx;
  const step = frame.moveStep || 1;

  // 대상 포켓몬 지면 기준점
  const targetBase = isP ? em : pm;
  const tx = targetBase ? targetBase.x : drawCtx.targetPos.x;
  const ty = targetBase ? targetBase.y : drawCtx.targetPos.y;

  // 발목/스프라이트 하단 높이 (지면에서 약 8px 위)
  const sweepY = ty + 8;

  // 스위프 진행률 (0.0: 좌측 시작 ➔ 1.0: 우측 완료)
  const prog = frame.sweepProgress ?? (step <= 2 ? 0.20 : step === 3 ? 0.55 : step === 4 ? 0.85 : 1.0);

  // 스위프 좌/우 범위 (좌측 -55px ~ 우측 +50px)
  const sweepStartX = tx - 55;
  const sweepEndX = tx + 50;
  const curX = sweepStartX + (sweepEndX - sweepStartX) * prog;
  // 자연스러운 스위프 호 (약간의 상하 포물선 궤적: 중앙에서 낮고 끝에서 살짝 올라감)
  const curY = sweepY - Math.sin(prog * Math.PI) * 3;

  ctx.save();

  // 1. [격투 색상의 잔상 이동경로 (Fighting-Colored Afterimage Trail)]
  // - 끝쪽(이동경로 뒤편, 좌측)은 100% 투명하게 페이드아웃
  // - 현재 발바닥 위치(우측)로 갈수록 진하고 밝은 격투 주황(#F97316 ~ #FEF08A)으로 수렴
  if (prog > 0.08) {
    ctx.save();
    const trailStartX = sweepStartX;
    const trailGrad = ctx.createLinearGradient(trailStartX, sweepY, curX, curY);
    trailGrad.addColorStop(0.00, "rgba(234, 88, 12, 0.0)");       // 이동경로 맨 뒤: 100% 투명!
    trailGrad.addColorStop(0.30, "rgba(234, 88, 12, 0.25)");      // 완만한 페이드인
    trailGrad.addColorStop(0.65, "rgba(249, 115, 22, 0.70)");      // 비비드 격투 오렌지
    trailGrad.addColorStop(0.92, "rgba(251, 146, 60, 0.90)");      // 고채도 주황
    trailGrad.addColorStop(1.00, "rgba(254, 240, 138, 0.98)");      // 발바닥 직전 순백/황금빛 코어

    // 두께 테이퍼링 (뒤쪽은 2px ➔ 발바닥 위치는 16px)
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.moveTo(trailStartX, sweepY);
    ctx.quadraticCurveTo(
      (trailStartX + curX) * 0.5,
      sweepY - 5,
      curX,
      curY - 8
    );
    ctx.lineTo(curX, curY + 8);
    ctx.quadraticCurveTo(
      (trailStartX + curX) * 0.5,
      sweepY + 5,
      trailStartX,
      sweepY
    );
    ctx.closePath();
    ctx.fill();

    // 중심 가속 심선 (Core Slice)
    const coreGrad = ctx.createLinearGradient(trailStartX, sweepY, curX, curY);
    coreGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
    coreGrad.addColorStop(0.50, "rgba(254, 240, 138, 0.35)");
    coreGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.95)");
    ctx.strokeStyle = coreGrad;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(trailStartX, sweepY);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    ctx.restore();

    // 2. [격투 색상의 잔상 발바닥들 (Fading Ghost Footprints along Path)]
    // - 경로 뒤쪽으로 갈수록 투명해지는 잔상 발바닥 3개
    const ghostConfigs = [
      { distBack: 38, alpha: 0.20, scale: 1.0 },
      { distBack: 24, alpha: 0.40, scale: 1.1 },
      { distBack: 12, alpha: 0.65, scale: 1.18 },
    ];
    for (const gc of ghostConfigs) {
      const gx = curX - gc.distBack;
      if (gx >= trailStartX) {
        const gy = sweepY - Math.sin(((gx - sweepStartX) / (sweepEndX - sweepStartX)) * Math.PI) * 3;
        drawFootprintStamp(ctx, gx, gy, gc.scale, 0.22, "#EA580C", "rgba(154, 52, 18, 0.35)", gc.alpha);
      }
    }
  }

  // 3. [메인 검정 발바닥 (Black Footprint Stamp)]
  // - 아래쪽 좌에서 우로 스위프하며 타격하는 메인 검정 발바닥
  const footAlpha = frame.footAlpha ?? (step >= 5 ? 0.40 : 1.0);
  if (footAlpha > 0.05) {
    drawFootprintStamp(
      ctx,
      curX,
      curY,
      1.25,
      0.22,
      "#0F172A", // 선명한 검정 발바닥
      "rgba(0, 0, 0, 0.45)",
      footAlpha
    );
  }

  // 4. [탁! 안다리 킥 타격 임팩트 & 지면 마찰 스파크 (Step 4: Sharp Kick Snap Impact)]
  if (step === 4 && isHit) {
    ctx.save();

    // A. [수평 킥 슬릿 섬광 (Horizontal Kick Slit Flare)]
    // - 몸통박치기 같은 둥근 원형 폭발 대신, 발목을 가로로 걷어차는 날카로운 수평 슬릿 플래시
    const slitGrad = ctx.createLinearGradient(tx - 40, sweepY, tx + 40, sweepY);
    slitGrad.addColorStop(0.00, "rgba(234, 88, 12, 0.0)");
    slitGrad.addColorStop(0.22, "rgba(249, 115, 22, 0.60)");
    slitGrad.addColorStop(0.42, "rgba(254, 240, 138, 0.95)");
    slitGrad.addColorStop(0.50, "#FFFFFF");
    slitGrad.addColorStop(0.58, "rgba(254, 240, 138, 0.95)");
    slitGrad.addColorStop(0.78, "rgba(249, 115, 22, 0.60)");
    slitGrad.addColorStop(1.00, "rgba(234, 88, 12, 0.0)");

    ctx.fillStyle = slitGrad;
    ctx.beginPath();
    ctx.moveTo(tx - 40, sweepY);
    ctx.quadraticCurveTo(tx, sweepY - 6, tx + 40, sweepY);
    ctx.quadraticCurveTo(tx, sweepY + 6, tx - 40, sweepY);
    ctx.closePath();
    ctx.fill();

    // B. [중심 샤프 킥 다이아몬드 코어 (Sharp Kick Snap Diamond Core)]
    // - 타격 중심점의 예리한 순백 다이아몬드 (가로 18px, 세로 12px)
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(tx, sweepY - 7);
    ctx.lineTo(tx + 9, sweepY);
    ctx.lineTo(tx, sweepY + 7);
    ctx.lineTo(tx - 9, sweepY);
    ctx.closePath();
    ctx.fill();

    // C. [발목을 걷어차 올리는 역동적 사선 킥 스파크선 (Directional Kinetic Kick Streaks)]
    // - 좌->우 스위프 관성으로 인해 우측 상단 및 사방으로 뻗는 날카로운 격투 스파크 라인들
    const kickStreaks = [
      { angle: -0.32, r1: 6, r2: 36, w: 2.8, col: "#FEF08A" }, // 우측 살짝 위 (주 추진 방향)
      { angle: -0.85, r1: 5, r2: 30, w: 2.2, col: "#FFFFFF" }, // 우측 대각선 위
      { angle: -1.35, r1: 4, r2: 26, w: 1.8, col: "#F97316" }, // 거의 수직 위
      { angle: 0.28, r1: 6, r2: 32, w: 2.4, col: "#FB923C" },  // 우측 살짝 아래
      { angle: -2.35, r1: 5, r2: 22, w: 1.8, col: "#FEF08A" }, // 좌측 상단 반동
      { angle: 2.75, r1: 4, r2: 18, w: 1.4, col: "#F97316" },  // 좌측 하단 반동
    ];

    for (const st of kickStreaks) {
      const cos = Math.cos(st.angle);
      const sin = Math.sin(st.angle);
      const x1 = tx + cos * st.r1;
      const y1 = sweepY + sin * st.r1;
      const x2 = tx + cos * st.r2;
      const y2 = sweepY + sin * st.r2;

      const sGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      sGrad.addColorStop(0.0, "#FFFFFF");
      sGrad.addColorStop(0.4, st.col);
      sGrad.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");

      ctx.strokeStyle = sGrad;
      ctx.lineWidth = st.w;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // D. [킥 임팩트 미니 레트로 스파크 파편 (Mini Spark Diamonds)]
    // - 둥근 먼지볼 대신 예리한 스파크 파편 비산
    drawMiniRetroStar(ctx, tx + 18, sweepY - 14, 8, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 28, sweepY - 6, 7, "#FEF08A");
    drawMiniRetroStar(ctx, tx + 10, sweepY - 22, 6, "#F97316");
    drawMiniRetroStar(ctx, tx - 16, sweepY - 12, 6, "#FED7AA");
    drawMiniRetroStar(ctx, tx + 24, sweepY + 8, 5, "#FEF08A");

    // E. [초슬림 수평 지면 충격파 (Ground-Level Sweep Ring)]
    // - 둥근 구형 링이 아니라, 바닥을 훑고 퍼져나가는 얇고 넓은 수평 타원 링
    ctx.strokeStyle = "rgba(254, 240, 138, 0.90)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(tx + 4, sweepY + 2, 38, 5, 0.04, 0, Math.PI * 2);
    ctx.stroke();

    // F. [지면 킥 마찰 흙먼지 (Directional Ground Dust)]
    // - 발이 지면을 차며 튀어오르는 방향성 먼지 파티클
    ctx.fillStyle = "rgba(241, 245, 249, 0.80)";
    ctx.beginPath();
    ctx.ellipse(tx + 26, sweepY + 4, 8, 3.5, 0.25, 0, Math.PI * 2);
    ctx.ellipse(tx + 40, sweepY + 3, 5, 2.5, 0.35, 0, Math.PI * 2);
    ctx.ellipse(tx - 20, sweepY + 5, 4.5, 2, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 5. [타격 잔향 확산 & 페이드 (Step 5: Impact Dissipation)]
  if (step === 5 && isHit) {
    ctx.save();
    ctx.globalAlpha = 0.40;

    // 넓어진 수평 지면 충격파 페이드
    ctx.strokeStyle = "rgba(254, 240, 138, 0.50)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(tx + 8, sweepY + 2, 48, 6, 0.04, 0, Math.PI * 2);
    ctx.stroke();

    // 잔여 스파크 파편 2개
    drawMiniRetroStar(ctx, tx + 28, sweepY - 18, 5, "#FEF08A");
    drawMiniRetroStar(ctx, tx + 38, sweepY - 8, 5, "#F97316");

    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 068: 카운터 (Counter) Renderers
// - 사용자 요청: "카운터 일반 타격대신에 상대방 살짝뒤로 움직였다가 회전 팍 하면서 화면 백색 그리고 페이드아웃"
// ============================================================================

/**
 * 068: 카운터 (Counter) Behind Effect
 * - 전체 전장을 순백으로 물들이는 화면 백색 배경 (Screen Whiteout Background)
 */
export function drawCounterBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    [key: string]: any;
  }
) {
  const bgAlpha = frame.bgWhiteAlpha ?? frame.whiteAlpha ?? 0;
  if (bgAlpha > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, bgAlpha)})`;
    ctx.fillRect(-10000, -10000, 20000, 20000);
    ctx.restore();
  }
}

/**
 * 068: 카운터 (Counter) Front Effect
 * - 전체 전장을 뒤덮는 백색 플래시 오버레이 및 점진적 페이드아웃
 * - 회전 팍! 순간 터져나오는 날카로운 순백 카운터 사선 슬래시 빔 & 십자 스파크
 */
export function drawCounterEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    [key: string]: any;
  }
) {
  const { targetPos, isPlayer: isP } = drawCtx;
  const tx = targetPos.x;
  const ty = targetPos.y;

  // 1. [화면 백색 플래시 & 점진적 페이드아웃 (Screen Whiteout Overlay)]
  const whiteAlpha = frame.whiteAlpha ?? 0;
  if (whiteAlpha > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, whiteAlpha)})`;
    ctx.fillRect(-10000, -10000, 20000, 20000);
    ctx.restore();
  }

  // 2. [회전 팍! 순간 날카로운 카운터 키네틱 슬래시 선 (Sharp Counter Kinetic Slash)]
  // - 일반 타격(몸통박치기/별모양 스타버스트) 대신, 카운터 특유의 예리한 사선 절단 섬광
  if (frame.showSlash && frame.isHit) {
    ctx.save();
    ctx.translate(tx, ty);

    // 사선 슬래시 각도 (대각선 고속 베기)
    const slashAngle = isP ? -0.45 : 0.45;
    ctx.rotate(slashAngle);

    // A. 순백 메인 슬래시 빔 (길이 140px, 폭 7px, 양 끝단 투명)
    const slashGrad = ctx.createLinearGradient(-70, 0, 70, 0);
    slashGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
    slashGrad.addColorStop(0.20, "rgba(254, 240, 138, 0.85)");
    slashGrad.addColorStop(0.50, "#FFFFFF");
    slashGrad.addColorStop(0.80, "rgba(254, 240, 138, 0.85)");
    slashGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

    ctx.strokeStyle = slashGrad;
    ctx.lineWidth = 7.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-70, 0);
    ctx.lineTo(70, 0);
    ctx.stroke();

    // B. 내부 순백 코어 심선
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-50, 0);
    ctx.lineTo(50, 0);
    ctx.stroke();

    // C. 십자 교차 보조 슬래시 (Cross Slash)
    ctx.rotate(Math.PI / 2);
    const subGrad = ctx.createLinearGradient(-35, 0, 35, 0);
    subGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    subGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
    subGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
    ctx.strokeStyle = subGrad;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-35, 0);
    ctx.lineTo(35, 0);
    ctx.stroke();

    // D. 4각 레트로 샤프 스파크
    drawMiniRetroStar(ctx, 24, -18, 9, "#FFFFFF");
    drawMiniRetroStar(ctx, -26, 16, 8, "#FEF08A");

    ctx.restore();
  }
}


