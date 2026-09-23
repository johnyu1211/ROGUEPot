// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import {
  getCometPunchFistImg,
  drawMiniRetroStar,
  drawStarburstImpact,
} from "../common/helpers.js";
import { drawFrontStraightPunchFistSvg } from "./move001_004.js";
import { drawFootprintStamp } from "./move025_028.js";

/**
 * Draw project's official verified fist sprite (Comet Punch Fist / Front Straight Punch SVG)
 * - Maximum rotation angle is strictly clamped to 60 degrees ([-Math.PI / 3, Math.PI / 3])
 * - flipH: horizontal flip for opposite direction strikes (replaces unnatural 180° flips)
 */
function drawOfficialFist(
  ctx: any,
  x: number,
  y: number,
  angle: number,
  scale = 1.0,
  alpha = 1.0,
  flipH = false
) {
  // Max 60 degrees restriction: clamp to [-Math.PI / 3, Math.PI / 3]
  const clampedAngle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, angle));

  ctx.save();
  ctx.translate(x, y);
  if (flipH) {
    ctx.scale(-1, 1);
  }
  ctx.rotate(clampedAngle);
  ctx.globalAlpha = alpha;

  const cometImg = getCometPunchFistImg();
  if (cometImg) {
    const s = 0.32 * scale;
    ctx.scale(s, s);
    ctx.drawImage(cometImg, -cometImg.width / 2, -cometImg.height / 2);
  } else {
    drawFrontStraightPunchFistSvg(ctx, 0, 0, 1.35 * scale, alpha);
  }
  ctx.restore();
}

/**
 * Draw project's official verified kick footprint sprite (Footprint Stamp)
 * - Maximum rotation angle is strictly clamped to 60 degrees ([-Math.PI / 3, Math.PI / 3])
 * - flipH: horizontal flip for opposite side kicks
 */
function drawOfficialFoot(
  ctx: any,
  x: number,
  y: number,
  angle: number,
  scale = 1.0,
  alpha = 1.0,
  flipH = false
) {
  // Max 60 degrees restriction: clamp to [-Math.PI / 3, Math.PI / 3]
  const clampedAngle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, angle));

  ctx.save();
  ctx.translate(x, y);
  if (flipH) {
    ctx.scale(-1, 1);
  }
  ctx.rotate(clampedAngle);
  drawFootprintStamp(ctx, 0, 0, 1.05 * scale, 0, "#0F172A", "rgba(0,0,0,0.35)", alpha);
  ctx.restore();
}

/**
 * Helper to draw 5th Gen sharp Comic Hit Starburst (Angular polygon contact explosion)
 */
function drawGen5ComicHitBurst(ctx: any, cx: number, cy: number, radius = 26) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer Golden-Amber Comic Starburst Polygon (8 sharp points)
  ctx.fillStyle = "#F59E0B";
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const numPoints = 8;
  for (let i = 0; i < numPoints * 2; i++) {
    const a = (i / (numPoints * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : radius * 0.42;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner Bright Yellow Starburst
  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  const innerR = radius * 0.65;
  for (let i = 0; i < numPoints * 2; i++) {
    const a = (i / (numPoints * 2)) * Math.PI * 2 + Math.PI / 8;
    const r = i % 2 === 0 ? innerR : innerR * 0.38;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Core White Flash
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper to draw sparkling 4-pointed diamond stars
 */
function drawSparkleStars(ctx: any, cx: number, cy: number, count = 5, dist = 24) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + 0.35;
    const sx = cx + Math.cos(a) * dist;
    const sy = cy + Math.sin(a) * (dist * 0.82);

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(sx, sy - 5);
    ctx.lineTo(sx + 2, sy);
    ctx.lineTo(sx, sy + 5);
    ctx.lineTo(sx - 2, sy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy);
    ctx.lineTo(sx, sy + 2);
    ctx.lineTo(sx + 5, sy);
    ctx.lineTo(sx, sy - 2);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * 037: 난동부리기 (Thrash) Visual Effect (5th Gen Official Relentless Fists & Feet Rampage)
 * 
 * - 프로젝트 기존 공식 검수 에셋 활용 (메가톤펀치 주먹 & 메가톤킥 발자국)
 * - 회전각 최대 60도 엄격 제한 (180도 회전/뒤집힘 금지, 좌우 반전 flipH 처리)
 * - Z축 레이어링: 배경 타격 버스트 및 충격파를 하단에 깔고, 주먹/발을 최상단 Z축에 배치하여 명확한 타격감 구현
 * - 넓은 타격 분포: 복부(좌하단) -> 턱/어깨(우상단) -> 안면(헤드킥) -> 정수리(수직 스톰프)로 전신 난타
 * 
 * - Step 2: 1타 - 왼손 복부 펀치 (코믹 버스트 -> 상단 왼주먹 맹타)
 * - Step 3: 2타 - 오른손 상단 펀치 (코믹 버스트 -> 상단 오른주먹 강타, 수평반전)
 * - Step 4: 3타 - 날아차기 하이킥 (초승달 궤적 + 코믹 버스트 -> 상단 날아차기 발)
 * - Step 5: 4타 - 수직 강하 거대 짓밟기 (지면 2중 충격파 + 코믹 버스트 -> 상단 거대 수직 발자국)
 * - Step 6: 5단계 - 잔류 비산 별빛 파티클
 */
export function drawThrashEffect(
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
  const { targetPos } = drawCtx;
  const tx = targetPos.x;
  const ty = targetPos.y;
  const step = frame.moveStep || 2;

  ctx.save();

  if (step === 2) {
    // 1타: 왼손 복부 펀치 (공식 주먹 에셋 사용)
    // Z-Layer: 1) 타격 접촉면 코믹 버스트 & 별빛 먼저 -> 2) 최상단 Z축에 공식 주먹 렌더링
    drawGen5ComicHitBurst(ctx, tx - 16, ty + 12, 26);
    drawSparkleStars(ctx, tx - 16, ty + 12, 5, 24);
    // 주먹 회전각: +0.22 rad (+12.6° <= 60°), flipH: false
    drawOfficialFist(ctx, tx - 36, ty + 12, 0.22, 1.15, 1.0, false);
  } else if (step === 3) {
    // 2타: 오른손 어퍼컷/어깨 펀치 (공식 주먹 에셋 사용)
    // Z-Layer: 1) 타격 접촉면 코믹 버스트 & 별빛 먼저 -> 2) 최상단 Z축에 공식 주먹 렌더링
    drawGen5ComicHitBurst(ctx, tx + 16, ty - 18, 28);
    drawSparkleStars(ctx, tx + 16, ty - 18, 6, 26);
    // 주먹 회전각: -0.22 rad (-12.6° <= 60°), 180도 회전 대신 flipH: true (수평 반전)
    drawOfficialFist(ctx, tx + 36, ty - 18, -0.22, 1.15, 1.0, true);
  } else if (step === 4) {
    // 3타: 날아차기 하이킥 (공식 발 에셋 사용)
    // 초승달 궤적
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(tx + 10, ty - 22, 34, -Math.PI / 3, Math.PI / 4);
    ctx.stroke();

    // Z-Layer: 1) 타격 접촉면 코믹 버스트 & 별빛 먼저 -> 2) 최상단 Z축에 공식 발 렌더링
    drawGen5ComicHitBurst(ctx, tx + 10, ty - 24, 30);
    drawSparkleStars(ctx, tx + 10, ty - 24, 7, 30);
    // 발 회전각: +0.52 rad (+30° <= 60°), flipH: false
    drawOfficialFoot(ctx, tx + 26, ty - 26, 0.52, 1.25, 1.0, false);
  } else if (step === 5) {
    // 4타: 피니시 수직 강하 거대 짓밟기 발 (정수리 강타, 공식 발 에셋 사용)
    // 바닥 지면 압박 충격파 2중 타원
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 24, 48, 16, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 24, 64, 22, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Z-Layer: 1) 정수리 접촉면 코믹 버스트 & 별빛 먼저 -> 2) 최상단 Z축에 거대 발자국 렌더링
    drawGen5ComicHitBurst(ctx, tx, ty - 20, 36);
    drawSparkleStars(ctx, tx, ty - 16, 10, 40);

    // 발 회전각: 0 rad (0° <= 60°, 180도 회전 절대 금지, 자연스러운 발바닥 형태 유지)
    drawOfficialFoot(ctx, tx, ty - 32, 0, 1.65, 1.0, false);
  } else if (step === 6) {
    // 5단계: 잔류 비산 별빛 파티클
    drawSparkleStars(ctx, tx, ty - 10, 8, 36);
  }

  ctx.restore();
}

/**
 * Helper to draw radiant golden-yellow aura energy wrapping the caster Pokémon
 */
function drawCasterYellowAura(ctx: any, cx: number, cy: number, radius = 38, alpha = 1.0) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // 1. Soft Radiant Golden Glow Envelope (Radial Gradient)
  const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, radius * 1.4);
  grad.addColorStop(0, "rgba(254, 240, 138, 0.50)");
  grad.addColorStop(0.35, "rgba(250, 204, 21, 0.40)");
  grad.addColorStop(0.75, "rgba(234, 179, 8, 0.18)");
  grad.addColorStop(1, "rgba(202, 138, 4, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // 2. Ascending Tapered Golden Energy Flames (Wrapping the body)
  const flameOffsets = [
    { ox: -radius * 0.45, oy: radius * 0.25, h: radius * 0.95, w: 12, a: -0.18 },
    { ox: radius * 0.45, oy: radius * 0.25, h: radius * 1.0, w: 13, a: 0.2 },
    { ox: -radius * 0.2, oy: radius * 0.35, h: radius * 1.15, w: 15, a: -0.08 },
    { ox: radius * 0.2, oy: radius * 0.35, h: radius * 1.2, w: 16, a: 0.1 },
    { ox: 0, oy: radius * 0.4, h: radius * 1.3, w: 18, a: 0 },
  ];

  for (const f of flameOffsets) {
    ctx.save();
    ctx.translate(cx + f.ox, cy + f.oy);
    ctx.rotate(f.a);

    const fGrad = ctx.createLinearGradient(0, 0, 0, -f.h);
    fGrad.addColorStop(0, "rgba(245, 158, 11, 0.75)");
    fGrad.addColorStop(0.45, "rgba(250, 204, 21, 0.85)");
    fGrad.addColorStop(0.85, "rgba(254, 240, 138, 0.95)");
    fGrad.addColorStop(1, "#FFFFFF");

    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.moveTo(-f.w * 0.5, 0);
    ctx.quadraticCurveTo(-f.w * 0.65, -f.h * 0.5, 0, -f.h);
    ctx.quadraticCurveTo(f.w * 0.65, -f.h * 0.5, f.w * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 3. Dynamic Orbiting / Ascending Golden Energy Sparkles
  const sparkAngles = [0.4, 1.2, 2.1, 3.5, 4.3, 5.4];
  for (let i = 0; i < sparkAngles.length; i++) {
    const ang = sparkAngles[i];
    const dist = radius * (0.85 + (i % 3) * 0.2);
    const sx = cx + Math.cos(ang) * dist;
    const sy = cy + Math.sin(ang) * (dist * 0.75) - 6;
    drawMiniRetroStar(ctx, sx, sy, 7, i % 2 === 0 ? "#FEF08A" : "#FFFFFF");
  }

  ctx.restore();
}

/**
 * 038: 이판사판태클 (Double-Edge) Visual Effect
 * 
 * - 초고속 돌진 접근 후 빠른 페이드인 충돌 -> 피크 대폭발 -> 페이드아웃 분산
 * - 이펙트 지속 동안 시전 포켓몬을 황금/노란빛 에너지 오라로 감싸며, 이펙트 종료 시 오라 해제
 * - Step 2: 빠른 페이드인 (Fast Fade-in, alpha: 0.55, 28px 버스트 & 충격파)
 * - Step 3: 피크 대폭발 (Peak Collision, alpha: 1.0, 50px 버스트, 2중 충격파 링, 8방향 방사형 빔)
 * - Step 4: 페이드아웃 분산 (Fade-out, alpha: 0.40, 58px 충격파 링 및 별빛 파티클 확산)
 */
export function drawDoubleEdgeEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    [key: string]: any;
  }
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 2;

  // Caster position (시전 포켓몬 위치)
  const casterX = drawCtx.casterPos?.x ?? (attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)));
  const casterY = drawCtx.casterPos?.y ?? (attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)));

  // Target position (방어 포켓몬 타격 위치)
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  ctx.save();

  // 1. 시전 포켓몬 노란빛 에너지 오라 (이펙트 단계 동안만 활성화, 이펙트 사라질 때 자동 해제)
  if (frame.casterYellowAura || (step >= 2 && step <= 4)) {
    const auraAlpha = step === 2 ? 0.65 : (step === 3 ? 1.0 : 0.45);
    drawCasterYellowAura(ctx, casterX, casterY, 36, auraAlpha);
  }

  // 2. 이판사판태클 충돌 폭발 (빠른 페이드인 -> 피크 대폭발 -> 페이드아웃 분산)
  if (step === 2) {
    // Step 2: 빠른 페이드인 (Fast Fade-in, alpha: 0.55)
    ctx.save();
    ctx.globalAlpha = 0.55;
    drawStarburstImpact(ctx, tx, ty, "#D97706", "#FEF08A", 28);

    // Initial shockwave ring
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(tx, ty, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(tx, ty, 32, 0, Math.PI * 2);
    ctx.stroke();

    // Short impact streaks
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + (isP ? 0.2 : 3.3);
      const r1 = 12;
      const r2 = 30;
      const x1 = tx + Math.cos(angle) * r1;
      const y1 = ty + Math.sin(angle) * r1;
      const x2 = tx + Math.cos(angle) * r2;
      const y2 = ty + Math.sin(angle) * r2;

      ctx.strokeStyle = "#FDE047";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (step === 3) {
    // Step 3: 피크 대폭발 (Peak Collision, alpha: 1.0)
    ctx.save();
    drawStarburstImpact(ctx, tx, ty, "#D97706", "#FEF08A", 50);

    // Dual Intense Shockwave Rings
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(tx, ty, 34, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(tx, ty, 52, 0, Math.PI * 2);
    ctx.stroke();

    // Heavy Radiating Impact Beams
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i + (isP ? 0.2 : 3.3);
      const r1 = 16;
      const r2 = 50 + (i % 2) * 16;
      const x1 = tx + Math.cos(angle) * r1;
      const y1 = ty + Math.sin(angle) * r1;
      const x2 = tx + Math.cos(angle) * r2;
      const y2 = ty + Math.sin(angle) * r2;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, "#FFFFFF");
      grad.addColorStop(0.35, "#FBBF24");
      grad.addColorStop(1, "rgba(217, 119, 6, 0)");

      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Impact Star Particles
    drawMiniRetroStar(ctx, tx + 32, ty - 26, 11, "#FEF08A");
    drawMiniRetroStar(ctx, tx - 30, ty + 24, 10, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 28, ty + 22, 9, "#F59E0B");
    drawMiniRetroStar(ctx, tx - 28, ty - 24, 9, "#FEF08A");
    ctx.restore();
  } else if (step === 4) {
    // Step 4: 페이드아웃 분산 (Fade-out, alpha: 0.40)
    ctx.save();
    ctx.globalAlpha = 0.40;
    drawStarburstImpact(ctx, tx, ty, "#D97706", "#FEF08A", 58);

    // Expanding shockwaves
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(tx, ty, 52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(tx, ty, 74, 0, Math.PI * 2);
    ctx.stroke();

    drawMiniRetroStar(ctx, tx + 42, ty - 32, 8, "rgba(254, 240, 138, 0.5)");
    drawMiniRetroStar(ctx, tx - 40, ty + 30, 8, "rgba(255, 255, 255, 0.5)");
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 039: 꼬리흔들기 (Tail Whip) Visual Effect
 * 
 * Concept:
 * - 이펙트 없음 (No visual effects - 순수 시전자 스프라이트 반전 및 살랑이는 원형 궤적 모션)
 */
export function drawTailWhipEffect(
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
  // 꼬리흔들기는 공격 이펙트 없이 시전자 스프라이트 반전 및 살랑거리는 궤적 움직임으로만 연출
}

/**
 * Helper to draw a single elongated, deadly straight poison needle (길어진 직선 독침 1개)
 * - Length: ~92px (x: -74 to +18)
 * - 투명도 아예 제거: 100% 완전 불투명한 솔리드 맹독 코어 + 뚜렷한 다크 림
 * - 초고채도 선명한 맹독 색상: 딥 바이올렛(#4C1D95, #7E22CE) -> 비비드 퍼플(#A855F7) -> 일렉트릭 마젠타(#C026D3) -> 쨍한 네온 팁(#E879F9)
 */
function drawPoisonNeedle(ctx: any, x: number, y: number, angle: number, scale: number = 1.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 1.0; // ⚠️ 투명도 아예 제거 (100% 완전 불투명)

  // 1. 100% 완전 불투명 선명한 맹독 스피드라인 궤적 (살짝 연하고 화사한 톤)
  const trailGrad = ctx.createLinearGradient(-85, 0, 18, 0);
  trailGrad.addColorStop(0, "#7E22CE"); // 살짝 연해진 바이올렛
  trailGrad.addColorStop(0.35, "#A855F7"); // 라이트 퍼플
  trailGrad.addColorStop(0.70, "#C084FC"); // 부드러운 라일락
  trailGrad.addColorStop(1, "#F0ABFC"); // 연한 네온 팁

  ctx.strokeStyle = trailGrad;
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-85, 0);
  ctx.lineTo(16, 0);
  ctx.stroke();

  // 상하 보조 슬립스트림 라인 (100% 불투명 솔리드)
  ctx.strokeStyle = "#C084FC";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-60, -4.5);
  ctx.lineTo(8, -4.5);
  ctx.moveTo(-60, 4.5);
  ctx.lineTo(8, 4.5);
  ctx.stroke();

  // 2. 직선 독침 본체 (살짝 연해진 산뜻한 맹독 그라데이션)
  const bodyGrad = ctx.createLinearGradient(-74, 0, 18, 0);
  bodyGrad.addColorStop(0, "#6B21A8"); // 부드러운 퍼플 (기존 #4C1D95 대신)
  bodyGrad.addColorStop(0.30, "#9333EA"); // 밝은 바이올렛
  bodyGrad.addColorStop(0.65, "#C084FC"); // 연한 일렉트릭 퍼플
  bodyGrad.addColorStop(0.90, "#E879F9"); // 연한 마젠타 핑크
  bodyGrad.addColorStop(1, "#F5D0FE"); // 화사하고 연한 네온 팁

  // 또렷하고 굵은 외곽선 (100% 불투명 림)
  ctx.beginPath();
  ctx.moveTo(-74, -1.5);
  ctx.lineTo(-45, -2.6);
  ctx.lineTo(6, -2.8);
  ctx.lineTo(18, 0);
  ctx.lineTo(6, 2.8);
  ctx.lineTo(-45, 2.6);
  ctx.lineTo(-74, 1.5);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.strokeStyle = "#581C87"; // 기존 #2E1065 대신 조금 더 연하고 부드러운 딥 퍼플 림
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 3. 내부 맹독 코어 직선 (100% 완전 불투명 네온 라인)
  ctx.strokeStyle = "#FAF5FF";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-56, 0);
  ctx.lineTo(16, 0);
  ctx.stroke();

  // 4. 침 끝 맹독 방울 (연한 네온 마젠타 & 화이트 핀포인트)
  ctx.fillStyle = "#E879F9";
  ctx.beginPath();
  ctx.arc(17.5, 0, 2.0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(17.5, 0, 1.0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper to draw a pinpoint micro needle prick spark (극소형 핀포인트 바늘구멍 찌르기)
 * - Radius: barely 7~8px
 * - 100% 불투명 쨍한 비비드 맹독 스파크 (살짝 연한 톤)
 */
export function drawTinyPrickImpact(ctx: any, x: number, y: number) {
  ctx.save();
  ctx.globalAlpha = 1.0;

  // 1. 선명하고 부드러운 마젠타 링 (r=7.5px)
  ctx.strokeStyle = "#E879F9";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(x, y, 7.5, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 부드러운 네온 십자 찌르기 스파크
  ctx.strokeStyle = "#F0ABFC";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 7.5, y);
  ctx.lineTo(x + 7.5, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y - 6.5);
  ctx.lineTo(x, y + 6.5);
  ctx.stroke();

  // 3. 대각선 글린트
  ctx.strokeStyle = "#C084FC";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x - 3.5, y - 3.5);
  ctx.lineTo(x + 3.5, y + 3.5);
  ctx.moveTo(x - 3.5, y + 3.5);
  ctx.lineTo(x + 3.5, y - 3.5);
  ctx.stroke();

  // 4. 중심 코어 도트
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x, y, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper to draw a vivid, 100% completely opaque poison bubble (투명도 아예 제거한 맹독 비눗방울)
 * - 투명도 0% (완전 불투명 100% 솔리드)
 * - 살짝 연하고 산뜻한 일렉트릭 맹독 컬러 (#FAF5FF, #F0ABFC, #C084FC, #9333EA, #6B21A8)
 * - 두껍고 선명한 솔리드 외곽 링
 */
export function drawPoisonSoapBubble(ctx: any, x: number, y: number, r: number) {
  if (r <= 0) return;
  ctx.save();
  ctx.globalAlpha = 1.0; // ⚠️ 투명도 아예 제거 (100% 완전 불투명!)

  // 1. 100% 완전 불투명 산뜻하게 연해진 맹독 그라데이션 (NO RGBA, ONLY 100% SOLID HEX)
  const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.05, x, y, r);
  grad.addColorStop(0.0, "#FAF5FF"); // 밝은 화이트 라일락
  grad.addColorStop(0.25, "#F0ABFC"); // 연한 네온 마젠타
  grad.addColorStop(0.55, "#C084FC"); // 부드러운 라이트 퍼플
  grad.addColorStop(0.85, "#9333EA"); // 산뜻한 바이올렛
  grad.addColorStop(1.0, "#6B21A8"); // 부드러운 딥 퍼플 테두리 안쪽
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // 2. 산뜻한 맹독 테두리 링 (100% 솔리드)
  ctx.strokeStyle = "#A855F7";
  ctx.lineWidth = Math.max(2.0, r * 0.22);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // 3. 상단 좌측 연한 라일락 초승달 광택 (100% 솔리드)
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1.5, r * 0.20);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, -Math.PI * 0.95, -Math.PI * 0.50);
  ctx.stroke();

  // 4. 미세 화이트 스파클 핀포인트
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x - r * 0.42, y - r * 0.42, Math.max(1.0, r * 0.16), 0, Math.PI * 2);
  ctx.fill();

  // 5. 하단 우측 선명한 바이올렛 반사광 (100% 솔리드)
  ctx.strokeStyle = "#D8B4FE";
  ctx.lineWidth = Math.max(1.2, r * 0.14);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, Math.PI * 0.15, Math.PI * 0.40);
  ctx.stroke();

  ctx.restore();
}

export const POISON_BUBBLES_WAVE1 = [
  { ox: -16, oy: 8, r: 6.5 },
  { ox: 15, oy: -10, r: 8.0 },
  { ox: -10, oy: -20, r: 5.5 },
  { ox: 20, oy: 14, r: 7.0 },
  { ox: -24, oy: -6, r: 5.0 },
  { ox: 6, oy: 18, r: 6.0 },
  { ox: 0, oy: -2, r: 9.0 },
];

export const POISON_BUBBLES_WAVE2 = [
  { ox: -20, oy: -8, r: 7.5 },
  { ox: 18, oy: -28, r: 9.5 },
  { ox: -14, oy: -40, r: 6.5 },
  { ox: 24, oy: -4, r: 8.0 },
  { ox: -30, oy: -22, r: 6.0 },
  { ox: 5, oy: 0, r: 7.5 },
  { ox: -2, oy: -24, r: 10.5 },
  { ox: 12, oy: -48, r: 5.5 },
];

export const POISON_BUBBLES_WAVE3 = [
  { ox: -24, oy: -26, r: 7.0 },
  { ox: 22, oy: -50, r: 8.5 },
  { ox: -16, oy: -62, r: 6.0 },
  { ox: 28, oy: -20, r: 7.5 },
  { ox: -34, oy: -42, r: 5.5 },
  { ox: 2, oy: -46, r: 9.0 },
];

/**
 * 독침 피격 후 피어오르는 맹독 비눗방울 군집 (1/2/3차 웨이브 공용 렌더러)
 */
export function drawPoisonBubblesWave(ctx: any, tx: number, ty: number, wave: 1 | 2 | 3) {
  const bubbles = wave === 1 ? POISON_BUBBLES_WAVE1 : (wave === 2 ? POISON_BUBBLES_WAVE2 : POISON_BUBBLES_WAVE3);
  for (const b of bubbles) {
    drawPoisonSoapBubble(ctx, tx + b.ox, ty + b.oy, b.r);
  }
}

/**
 * 040: 독침 (Poison Sting) Visual Effect
 * 
 * - 독침 길이 대폭 연장: ~92px의 날카로운 단일 직선 보랏빛 독침 사출
 * - 투명도 아예 제거 & 초고채도 선명한 맹독 색상 적용 (100% 완전 불투명 솔리드)
 * - 타격 이펙트 크기 극소화: 바늘구멍 찌르기 수준의 7~8px 극소형 핀포인트 스파크
 * - 피격 후 대상 포켓몬 보라색화 진행 (Poison Tint Progression)
 * - 대상 포켓몬 주변에 100% 불투명하고 쨍한 보라색 비눗방울 군집 발생 및 상승
 */
export function drawPoisonStingEffect(
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
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 2;
  const progress = frame.effectProgress !== undefined ? frame.effectProgress : 1.0;

  // Target coordinates taking offsets into account
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  ctx.save();
  ctx.globalAlpha = 1.0; // ⚠️ 투명도 아예 제거

  if (step === 2) {
    // 1. Single elongated straight poison needle (길어진 직선 독침 1개 사출, 100% 불투명)
    const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
    const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));

    const angle = Math.atan2(ty - ay, tx - ax);
    const curT = Math.max(0, Math.min(1, progress));

    if (curT > 0.01 && curT < 1.0) {
      const nx = ax + (tx - ax) * curT;
      const ny = ay + (ty - ay) * curT;

      drawPoisonNeedle(ctx, nx, ny, angle, 1.0);
    }
  } else if (step === 3) {
    // 2. Pinpoint Tiny Needle Prick Impact (타격 이펙트 크기 존나작게: r=7.5px)
    drawTinyPrickImpact(ctx, tx, ty);
  } else if (step === 4) {
    // 3. 타격 후 1차: 대상 포켓몬 주변 100% 완전 불투명 선명한 보라색 비눗방울 발생
    drawTinyPrickImpact(ctx, tx, ty);
    drawPoisonBubblesWave(ctx, tx, ty, 1);
  } else if (step === 5) {
    // 4. 타격 후 2차: 보라색화 극대화 & 비눗방울 군집 상승 (100% 완전 불투명)
    drawPoisonBubblesWave(ctx, tx, ty, 2);
  } else if (step === 6) {
    // 5. 타격 후 3차: 비눗방울 상공 부유 및 분산 (100% 완전 불투명)
    drawPoisonBubblesWave(ctx, tx, ty, 3);
  }

  ctx.restore();
}
