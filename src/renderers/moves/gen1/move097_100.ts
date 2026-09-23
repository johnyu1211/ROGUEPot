// ============================================================================
// ⚠️ [개발 지침 - AI 필독]
// 1. 256색 팔레트 최적화 (Octree Optimizer) 기준: 고채도 비비드 단색 및 3~4단계 톤 대비.
// 2. 프레임별 이미지 추출/조회 루프 금지 (유저는 웹 뷰어 http://localhost:3456 에서 직접 확인).
// 3. 시전자 모션 기승전결(모으기 ➔ 돌진/방출 ➔ 타격 ➔ 복귀)을 지킬 것.
// ============================================================================

import { createCanvas } from "@napi-rs/canvas";
import { drawFittedBattleSprite } from "../../common/spriteLoader.js";
import { drawMiniRetroStar, drawStarburstImpact } from "../common/helpers.js";
import { drawPhysicalImpactEffect } from "../common/genericTypeEffects.js";
import { drawTakeDownEffect } from "./move033_036.js";

// ============================================================================
// 097: 고속이동 (Agility)
// ============================================================================

let agilityGhostCanvas: any = null;
let agilityGhostCtx: any = null;

function getAgilityGhostCanvas(size: number) {
  const s = Math.max(Math.ceil(size * 1.6), 320);
  if (!agilityGhostCanvas || agilityGhostCanvas.width < s || agilityGhostCanvas.height < s) {
    agilityGhostCanvas = createCanvas(s, s);
    agilityGhostCtx = agilityGhostCanvas.getContext("2d");
  } else {
    agilityGhostCtx.clearRect(0, 0, agilityGhostCanvas.width, agilityGhostCanvas.height);
    agilityGhostCtx.globalCompositeOperation = "source-over";
    agilityGhostCtx.globalAlpha = 1.0;
    agilityGhostCtx.filter = "none";
  }
  return { canvas: agilityGhostCanvas, ctx: agilityGhostCtx, cx: s / 2, cy: s * 0.8 };
}

/**
 * 고속이동 전용 그라데이션 투명도 잔상 스프라이트 렌더러
 * - 시전 포켓몬의 실물 스프라이트를 오프스크린에 렌더링
 * - 이동 방향에 따라 destination-in 선형 그라데이션 마스크 적용 (앞쪽은 선명, 뒤쪽 궤적은 0% 투명 페이드)
 * - 네온 시안/민트/화이트 에너지 아우라 필터 지원
 */
function drawAgilityGhostSprite(
  targetCtx: any,
  sprite: any,
  x: number,
  y: number,
  size: number,
  alpha: number,
  direction: "left" | "right",
  style: "natural" | "cyan" | "mint" | "white" = "natural"
) {
  if (!sprite || alpha <= 0.02) return;
  const { canvas, ctx, cx, cy } = getAgilityGhostCanvas(size);

  // 1. Offscreen에 스타일 필터 적용 후 스프라이트 렌더링
  ctx.save();
  if (style === "cyan") {
    ctx.filter = "brightness(0) invert(1) drop-shadow(0px 0px 4px #06b6d4)";
  } else if (style === "mint") {
    ctx.filter = "brightness(0) invert(1) drop-shadow(0px 0px 4px #2dd4bf)";
  } else if (style === "white") {
    ctx.filter = "brightness(0) invert(1) drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.95))";
  } else {
    // natural: 원본 스프라이트 질감 유지 + 고속 시안 네온 아우라
    ctx.filter = "drop-shadow(0px 0px 4px rgba(45, 212, 191, 0.85)) brightness(1.15)";
  }

  drawFittedBattleSprite(ctx, sprite, cx, cy, size);
  ctx.restore();

  // 2. 이동 방향에 따른 그라데이션 투명도 마스크 (destination-in)
  // direction === "left": 왼쪽(선두)에서 오른쪽(후방)으로 갈수록 점진적 투명화
  // direction === "right": 오른쪽(선두)에서 왼쪽(후방)으로 갈수록 점진적 투명화
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";

  const span = size * 0.95;
  const leadX = direction === "left" ? (cx - span * 0.5) : (cx + span * 0.5);
  const tailX = direction === "left" ? (cx + span * 0.5) : (cx - span * 0.5);

  const grad = ctx.createLinearGradient(leadX, cy, tailX, cy);
  grad.addColorStop(0.0, "rgba(0, 0, 0, 1.0)");
  grad.addColorStop(0.35, "rgba(0, 0, 0, 0.85)");
  grad.addColorStop(0.70, "rgba(0, 0, 0, 0.40)");
  grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 3. 메인 캔버스에 합성
  targetCtx.save();
  targetCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
  targetCtx.drawImage(canvas, x - cx, y - cy);
  targetCtx.restore();
}

/**
 * 날렵한 바람 절단 호 (Wind Crescent Blade)
 * - 끝부분이 바늘처럼 뾰족한 초승달 모양 (Tapered Bezier Path)
 * - 유저 요청 투명도: 좌측은 100% 완전 투명(0.0), 우측은 선명한 반투명(0.90) 그라데이션
 * - isFacingRight === true일 때 ')' 형태, false일 때 '(' 형태
 */
function drawTaperedCrescent(
  ctx: any,
  x: number,
  y: number,
  height: number,
  curveAmount: number,
  thickness: number,
  alpha: number,
  colorType: "white" | "mint" = "white"
) {
  if (alpha <= 0.02) return;
  const halfH = height * 0.5;
  const topX = x;
  const topY = y - halfH;
  const botX = x;
  const botY = y + halfH;

  const isFacingRight = curveAmount >= 0;
  const outerX = x + curveAmount;
  const innerX = x + curveAmount - (isFacingRight ? thickness : -thickness);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(topX, topY);

  // Outer convex curve from top to bottom
  ctx.bezierCurveTo(
    outerX, topY + halfH * 0.45,
    outerX, botY - halfH * 0.45,
    botX, botY
  );

  // Inner concave curve from bottom back to top
  ctx.bezierCurveTo(
    innerX, botY - halfH * 0.45,
    innerX, topY + halfH * 0.45,
    topX, topY
  );
  ctx.closePath();

  // 가로 범위 계산 후 좌 ➔ 우 그라데이션 (좌측: 투명, 우측: 반투명)
  const minX = Math.min(topX, innerX, outerX);
  const maxX = Math.max(topX, innerX, outerX);

  const startX = isFacingRight ? minX : maxX;
  const endX = isFacingRight ? maxX : minX;

  const grad = ctx.createLinearGradient(startX, y, endX, y);
  const core = colorType === "white" ? "255, 255, 255" : "45, 212, 191";
  const glow = "6, 182, 212";

  grad.addColorStop(0.0, `rgba(${core}, 0.0)`);
  grad.addColorStop(0.35, `rgba(${glow}, ${alpha * 0.25})`);
  grad.addColorStop(0.70, `rgba(${core}, ${alpha * 0.65})`);
  grad.addColorStop(1.0, `rgba(255, 255, 255, ${alpha * 0.90})`);

  ctx.fillStyle = grad;
  ctx.fill();

  // 선두 림(외곽선) 날카로운 화이트 하이라이트
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(topX, topY);
  ctx.bezierCurveTo(
    outerX, topY + halfH * 0.45,
    outerX, botY - halfH * 0.45,
    botX, botY
  );
  ctx.stroke();

  ctx.restore();
}

/**
 * 고속이동 배경 레이어 (스피드라인 및 바람 잔향 + 시전 포켓몬 후방 잔상)
 */
export function drawAgilityBehindEffect(
  ctx: any,
  casterPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number,
  frame?: any,
  drawCtx?: any
) {
  if (moveStep <= 0) return;
  ctx.save();
  const cx = casterPos.x;
  const cy = casterPos.y;
  const p = effectProgress;

  const isPlayer = drawCtx?.isPlayer ?? true;
  const casterSprite = isPlayer ? (drawCtx?.playerSprite) : (drawCtx?.enemySprite);
  const casterSize = isPlayer ? (drawCtx?.pm?.size || 140) : (drawCtx?.em?.size || 110);

  // Step 2: 횡이동 순간 스피드 스트림 라인 (수평 초광속 바람선 - #8, #9의 Step 3 가로선 제거)
  if (moveStep === 2) {
    const alpha = p * 0.85;
    const lines = 10;
    ctx.lineCap = "round";

    for (let i = 0; i < lines; i++) {
      const lineY = cy - 40 + i * 9 + ((i * 17) % 7);
      const lineLen = 60 + ((i * 31) % 50) + p * 40;
      const speed = ((i * 23) % 40) + p * 35;
      const startX = cx - 80 - speed;
      const endX = startX + lineLen;

      const grad = ctx.createLinearGradient(startX, lineY, endX, lineY);
      grad.addColorStop(0.0, "rgba(6, 182, 212, 0.0)");
      grad.addColorStop(0.5, `rgba(45, 212, 191, ${0.45 * alpha})`);
      grad.addColorStop(1.0, `rgba(255, 255, 255, ${0.75 * alpha})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5 + (i % 3) * 0.8;
      ctx.beginPath();
      ctx.moveTo(startX, lineY);
      ctx.lineTo(endX, lineY);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * 고속이동 전면 레이어 (초고속 잔상 실루엣, 스피드 링, 상승 화살표 기운)
 */
export function drawAgilityEffect(
  ctx: any,
  casterPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  frame?: any,
  drawCtx?: any
) {
  ctx.save();
  const cx = casterPos.x;
  const cy = casterPos.y;
  const p = effectProgress;

  const isPlayer = drawCtx?.isPlayer ?? true;
  const casterSprite = isPlayer ? (drawCtx?.playerSprite) : (drawCtx?.enemySprite);
  const casterSize = isPlayer ? (drawCtx?.pm?.size || 140) : (drawCtx?.em?.size || 110);
  // 포켓몬의 발끝 지면 높이 (attackerPos.y는 몸통 중심(-36px)이므로 지면은 pm.y 또는 cy + 36)
  const groundY = isPlayer ? (drawCtx?.pm?.y ?? (cy + 36)) : (drawCtx?.em?.y ?? (cy + 36));

  // Step 1: 웅크리며 에너지 충전 (날렵한 수직 충전 스파크 입자 - ⚠️ [유저 요청] #5번 파란색 선 제거)
  if (moveStep === 1 && p <= 0.5) {
    const alpha = Math.min(1.0, p * 1.5);
    for (let i = 0; i < 6; i++) {
      const spX = cx - 24 + ((i * 19) % 48);
      const spY = groundY - 8 - p * 30 - ((i * 11) % 18);
      const h = 5 + (i % 3) * 3;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.fillRect(spX, spY, 2, h);
    }
  }

  // Step 2: 좌우 초고속 잔상 플리커 (원래 위치 [-28, 28, -14, 14] 기준 포켓몬 스프라이트 실루엣 잔상)
  // ⚠️ [Y축 정렬] drawFittedBattleSprite는 하단(발끝) 기준이므로 groundY에 맞춰 실물 포켓몬과 지면 높이를 완벽 일치시킴
  else if (moveStep === 2) {
    const offsets = [-28, 28, -14, 14];
    const styles: ("natural" | "mint" | "cyan")[] = ["natural", "mint", "cyan"];

    for (let i = 0; i < 3; i++) {
      const ox = offsets[(i + Math.floor(p * 4)) % offsets.length];
      const ghostAlpha = (0.75 - i * 0.20) * Math.sin(p * Math.PI);
      if (ghostAlpha <= 0.05) continue;

      // 원래 동그라미(ellipse)가 위치하던 좌표에 포켓몬 지면(groundY) 기준 스프라이트 잔상 렌더링
      if (casterSprite) {
        const direction: "left" | "right" = ox < 0 ? "left" : "right";
        drawAgilityGhostSprite(
          ctx,
          casterSprite,
          cx + ox,
          groundY,
          casterSize,
          ghostAlpha,
          direction,
          styles[i]
        );
      }

      // 기존 잔상 속 수평 초고속 스피드 컷팅 라인 유지
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx + ox - 20, cy - 10 + i * 10);
      ctx.lineTo(cx + ox + 20, cy - 10 + i * 10);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Step 3: 초광속 질주 가속 잔영 (바람 절단 호 ')' 제거 테스트 - 수평 스피드 스트림 라인만 유지)
  else if (moveStep === 3) {
    // ⚠️ [유저 요청] ')' 바람 절단 호 제거 (수평 스피드라인 스트림만 깔끔하게 유지)
  }

  ctx.restore();
}

// ============================================================================
// 098: 전광석화 (Quick Attack)
// ============================================================================

/**
 * 전광석화 전용 순백 잔상 스프라이트 렌더러
 */
function drawQuickAttackGhost(
  targetCtx: any,
  sprite: any,
  baseX: number,
  baseY: number,
  size: number,
  offsetX: number,
  offsetY: number,
  scaleX: number,
  scaleY: number,
  rot: number,
  alpha: number
) {
  if (!sprite || alpha <= 0.02) return;
  targetCtx.save();
  targetCtx.filter = "brightness(0) invert(1) drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.9))";
  targetCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
  targetCtx.translate(baseX + offsetX, baseY + offsetY);
  if (rot) targetCtx.rotate(rot);
  if (scaleX !== 1 || scaleY !== 1) targetCtx.scale(scaleX, scaleY);
  drawFittedBattleSprite(targetCtx, sprite, 0, 0, size);
  targetCtx.restore();
}

/**
 * 전광석화 배경 레이어 (시전자 순백 잔상 실루엣)
 * - ⚠️ [유저 요청] 곁 흰색 선(스피드라인) 완전 제거하고 포켓몬 스프라이트 뒤에 흰색 잔상만 렌더링
 */
export function drawQuickAttackBehindEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number,
  frame?: any,
  drawCtx?: any
) {
  if (moveStep <= 0) return;

  // Step 1: 순간 가속 발진 시작선 (⚠️ [유저 요청] 동그란 원 제거 ➔ 선으로 시작선 표시: 끝은 투명, 앞쪽은 반투명)
  if (moveStep === 1) {
    const dx = targetPos.x - attackerPos.x;
    const dy = targetPos.y - attackerPos.y;
    const angle = Math.atan2(dy, dx);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // 선의 끝 (뒤쪽: 투명 0.0) -> 선의 앞쪽 (돌진 방향 머리: 반투명 0.75)
    const tailX = attackerPos.x - cos * 42;
    const tailY = attackerPos.y - sin * 42;
    const headX = attackerPos.x + cos * 22;
    const headY = attackerPos.y + sin * 22;

    const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    grad.addColorStop(0.35, "rgba(255, 255, 255, 0.20)");
    grad.addColorStop(0.70, "rgba(255, 255, 255, 0.50)");
    grad.addColorStop(1.0, "rgba(255, 255, 255, 0.75)");

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(headX, headY);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const isPlayer = drawCtx?.isPlayer ?? true;
  const sprite = isPlayer ? drawCtx?.playerSprite : drawCtx?.enemySprite;
  const base = isPlayer ? drawCtx?.pm : drawCtx?.em;
  if (!sprite || !base) return;

  const sign = isPlayer ? 1 : -1;
  const baseX = base.x;
  const baseY = base.y;
  const size = base.size || (isPlayer ? 140 : 110);

  // Step 2: 초광속 직진 돌파 - 시전자 스프라이트 후방 순백 잔상 2개 (원거리/근거리)
  if (moveStep === 2) {
    // 1. 먼 잔상 (발진 지점 부근)
    drawQuickAttackGhost(
      ctx,
      sprite,
      baseX,
      baseY,
      size,
      22 * sign,
      -8 * sign,
      1.15,
      0.90,
      -0.06 * sign,
      0.28
    );

    // 2. 가까운 잔상 (본체 직후방)
    drawQuickAttackGhost(
      ctx,
      sprite,
      baseX,
      baseY,
      size,
      68 * sign,
      -25 * sign,
      1.20,
      0.85,
      -0.10 * sign,
      0.55
    );
  }
}

/**
 * 전광석화 전면 레이어 (몸통박치기 타격 충돌, 착지 흙먼지)
 * - ⚠️ [유저 요청] 곁의 흰색 선 및 발진 원 제거 ➔ 배경 잔상/시작선만 남김
 */
export function drawQuickAttackEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  frame?: any,
  drawCtx?: any
) {
  ctx.save();
  const p = effectProgress;
  const ax = attackerPos.x;
  const ay = attackerPos.y;
  const tx = targetPos.x;
  const ty = targetPos.y;

  // Step 1: 순간 발진 (⚠️ [유저 요청] 동그란 원 제거 ➔ 배경 레이어의 시작선으로 대체)
  if (moveStep === 1) {
    // 동그란 원 완전 제거
  }

  // Step 2: 초광속 직진 돌파 (⚠️ [유저 요청] 곁의 흰색 선 완전 제거 -> 배경 레이어의 순백 잔상만 표출)
  else if (moveStep === 2) {
    // 곁 흰색 선 없음 (클린 렌더링)
  }

  // Step 3: 적 정면 대격돌 충돌 (⚠️ [유저 요청] 일반 몸통박치기 타격 이펙트)
  else if (moveStep === 3) {
    drawPhysicalImpactEffect(ctx, targetPos, p);
  }

  // Step 5: 관통 후 스키드 착지 먼지 (브레이크 감속 & 정위치 복귀)
  else if (moveStep === 5) {
    const alpha = Math.max(0, (1.0 - p) * 0.85);
    const groundY = targetPos.y + 24;
    const skidX = targetPos.x + (attackerPos.x < targetPos.x ? 45 : -45);

    ctx.save();
    // 지면 스키드 마크 (타원형 브레이크 선)
    ctx.strokeStyle = `rgba(120, 113, 108, ${alpha * 0.6})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(skidX, groundY, 18 * (1.0 + p * 0.4), 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 스키드 마찰 흙먼지 퍼프 2개
    ctx.fillStyle = `rgba(214, 211, 209, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(skidX - 8, groundY - 4 - p * 6, 6 + p * 4, 0, Math.PI * 2);
    ctx.arc(skidX + 8, groundY - 5 - p * 7, 7 + p * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 099: 분노 (Rage)
// ============================================================================

/**
 * 유기적인 뭉게구름형 김/증기 퍼프 클러스터 (Organic Billowing Steam Puff)
 * 외곽으로 갈수록 부드럽게 투명해지는 방사형 그라디언트 적용
 */
function drawOrganicSteamPuff(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  isAngryRed: boolean = false
) {
  if (alpha <= 0.03 || radius <= 1.5) return;
  ctx.save();
  ctx.translate(x, y);

  const r = radius;
  const outerR = r * 1.05;

  // 외곽으로 갈수록 부드럽게 투명해지는 방사형 그라디언트 (중심: 코어 하이라이트 -> 외곽: 완전 투명)
  const grad = ctx.createRadialGradient(0, -r * 0.05, 0, 0, -r * 0.05, outerR);
  if (isAngryRed) {
    grad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.95})`);
    grad.addColorStop(0.28, `rgba(254, 226, 226, ${alpha * 0.85})`);
    grad.addColorStop(0.65, `rgba(254, 205, 211, ${alpha * 0.40})`);
    grad.addColorStop(1.0, "rgba(254, 205, 211, 0.0)");
  } else {
    grad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.95})`);
    grad.addColorStop(0.35, `rgba(248, 250, 252, ${alpha * 0.75})`);
    grad.addColorStop(0.70, `rgba(241, 245, 249, ${alpha * 0.35})`);
    grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
  }

  ctx.fillStyle = grad;

  // 4개의 겹친 유기적 구름 로브
  ctx.beginPath();
  ctx.arc(0, -r * 0.32, r * 0.62, 0, Math.PI * 2);
  ctx.arc(-r * 0.42, r * 0.1, r * 0.52, 0, Math.PI * 2);
  ctx.arc(r * 0.42, r * 0.1, r * 0.52, 0, Math.PI * 2);
  ctx.arc(0, r * 0.22, r * 0.58, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 모락모락 피어오르는 S자 증기 곡선 (Wispy Steam Stream Trail)
 * 아래쪽은 투명, 중간은 반투명, 구름 하단 외곽 접점 직전에 자연스럽게 페이드아웃되어
 * 구름 안쪽으로 선이 뚫고 들어가 비치는 현상을 완전히 방지합니다.
 */
function drawRisingSteamStream(
  ctx: any,
  startX: number,
  startY: number,
  height: number,
  wobbleX: number,
  lineWidth: number,
  alpha: number,
  puffRadius: number = 0
) {
  if (alpha <= 0.03 || height <= 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 구름 안쪽으로 선이 침범하지 않도록, 구름 밑면 접점(puffRadius * 0.6)까지만 곡선을 그리고 멈춤
  const stopOffset = Math.max(2, puffRadius * 0.6);
  const effectiveHeight = Math.max(3, height - stopOffset);
  const endRatio = effectiveHeight / height;
  const endX = startX + wobbleX * 0.4 * endRatio;
  const endY = startY - effectiveHeight;

  // 아래쪽(startY)은 완전 투명(0.0) -> 중간부는 반투명 -> 구름 밑면 접점(endY)에서 부드럽게 소멸(0.0)
  const streamGrad = ctx.createLinearGradient(startX, startY, endX, endY);
  streamGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  streamGrad.addColorStop(0.35, `rgba(254, 226, 226, ${alpha * 0.25})`);
  streamGrad.addColorStop(0.70, `rgba(255, 255, 255, ${alpha * 0.55})`);
  streamGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.strokeStyle = streamGrad;
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(
    startX + wobbleX * endRatio,
    startY - effectiveHeight * 0.35,
    startX - wobbleX * 0.8 * endRatio,
    startY - effectiveHeight * 0.70,
    endX,
    endY
  );
  ctx.stroke();
  ctx.restore();
}

/**
 * 콧김 제트 뿜기 (Snort Jet: 💨)
 */
function drawSnortJet(
  ctx: any,
  x: number,
  y: number,
  dir: 1 | -1,
  length: number,
  alpha: number
) {
  if (alpha <= 0.03) return;
  ctx.save();
  ctx.translate(x, y);

  for (let i = 0; i < 3; i++) {
    const px = dir * (6 + i * length * 0.38);
    const py = -i * 2.5;
    const r = 3.5 + i * 3.2;
    const puffAlpha = alpha * (1.0 - i * 0.22);
    drawOrganicSteamPuff(ctx, px, py, r, puffAlpha, true);
  }

  ctx.restore();
}

/**
 * 분노 배경 레이어 (시전자 붉은 격노 열파동)
 */
export function drawRageBehindEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number,
  frame?: any,
  drawCtx?: any
) {
  ctx.save();
  const cPos = drawCtx?.casterPos ?? attackerPos;
  const cx = cPos.x;
  const cy = cPos.y;
  const p = effectProgress;
  const isRed = Boolean(frame?.pRedTint || frame?.eRedTint);

  // 시전자가 붉게 변해있을 때 시전자 주변 붉은 분노 열기 오라 (Red Fury Heat Aura)
  if (isRed && moveStep <= 2) {
    const pulse = Math.sin(p * Math.PI * 3.5) * 0.15;
    const baseR = moveStep === 1 ? (p > 0.6 ? 42 : 36) : 40;
    const r = baseR + pulse * 10;
    const alpha = (0.5 + pulse) * (moveStep === 1 && p < 0.5 ? 0.75 : 0.9);

    const rageGrad = ctx.createRadialGradient(cx, cy - 6, 8, cx, cy - 6, r);
    rageGrad.addColorStop(0.0, `rgba(239, 68, 68, ${0.55 * alpha})`);
    rageGrad.addColorStop(0.55, `rgba(185, 28, 28, ${0.30 * alpha})`);
    rageGrad.addColorStop(1.0, "rgba(127, 29, 29, 0.0)");

    ctx.fillStyle = rageGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 6, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 분노 전면 레이어 (피어오르는 유기적 증기, 돌진 및 돌진 타격 이펙트)
 */
export function drawRageEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  frame?: any,
  drawCtx?: any
) {
  ctx.save();
  const p = effectProgress;
  const cPos = drawCtx?.casterPos ?? attackerPos;
  const cx = cPos.x;
  const cy = cPos.y;
  const tx = targetPos.x;
  const ty = targetPos.y;
  const isP = drawCtx?.isPlayer ?? (attackerPos.x < targetPos.x);
  const isRed = Boolean(frame?.pRedTint || frame?.eRedTint);

  // Step 1: 붉어짐 1차/2차 및 숨고르기 (김은 1차에서 1번만 발생하여 2차에 걸쳐 투명해지며 상승)
  if (moveStep === 1) {
    const dirX: 1 | -1 = isP ? 1 : -1;
    const phaseId = frame?.phaseId;

    if (phaseId === "rage-red-1" || p < 0.45) {
      // 1. [1차 붉어짐 (#5 in viewer)]: 김이 처음 발생! (낮은 높이, 짙고 선명한 농밀 증기, 불투명도 0.95)
      const streamY = cy - 14;
      const h = 26;

      drawRisingSteamStream(ctx, cx + dirX * 10, streamY, h, 4 * dirX, 2.6, 0.95, 8.0);
      drawOrganicSteamPuff(ctx, cx + dirX * 12, streamY - h, 8.0, 0.95, true);

      drawRisingSteamStream(ctx, cx + dirX * 2, streamY - 6, h + 6, -3 * dirX, 2.3, 0.90, 9.5);
      drawOrganicSteamPuff(ctx, cx + dirX * 1, streamY - 6 - (h + 6), 9.5, 0.90, true);

      // 콧김 제트 (💨)
      drawSnortJet(ctx, cx + dirX * 14, cy - 8, dirX, 16, 0.85);
    } else if (phaseId === "rage-normal" || p < 0.75) {
      // 2. [원래대로 복귀(숨고르기) (#6 in viewer)]: 그 김이 중간 높이로 상승하며 반투명해짐 (불투명도 0.55)
      const streamY = cy - 28;
      const h = 28;

      drawRisingSteamStream(ctx, cx + dirX * 12, streamY, h, 6 * dirX, 2.2, 0.55, 10.5);
      drawOrganicSteamPuff(ctx, cx + dirX * 15, streamY - h, 10.5, 0.55, false);

      drawRisingSteamStream(ctx, cx + dirX * 1, streamY - 8, h + 8, -5 * dirX, 2.0, 0.50, 12.0);
      drawOrganicSteamPuff(ctx, cx - dirX * 1, streamY - 8 - (h + 8), 12.0, 0.50, false);

      // 콧김 잔향도 전방으로 퍼지며 흩어짐
      drawSnortJet(ctx, cx + dirX * 20, cy - 12, dirX, 22, 0.40);
    } else {
      // 3. [2차 붉어짐 (#7 in viewer)]: 그 김이 높은 상공으로 올라가며 거의 투명하게 소멸 (불투명도 0.20)
      const streamY = cy - 46;
      const h = 30;

      drawRisingSteamStream(ctx, cx + dirX * 14, streamY, h, 8 * dirX, 1.8, 0.22, 13.5);
      drawOrganicSteamPuff(ctx, cx + dirX * 18, streamY - h, 13.5, 0.22, false);

      drawRisingSteamStream(ctx, cx, streamY - 10, h + 8, -7 * dirX, 1.6, 0.18, 15.0);
      drawOrganicSteamPuff(ctx, cx - dirX * 3, streamY - 10 - (h + 8), 15.0, 0.18, false);

      // 콧김 잔향 희미하게 소멸
      drawSnortJet(ctx, cx + dirX * 26, cy - 16, dirX, 26, 0.15);
    }
  }

  // Step 2: 돌진 준비(후진) & 맹렬한 돌진 쇄도
  else if (moveStep === 2) {
    if (p < 0.5) {
      // 도움닫기 후진 지면 먼지 구름
      drawOrganicSteamPuff(ctx, cx - (isP ? 8 : -8), cy + 14, 6, 0.65, false);
      drawOrganicSteamPuff(ctx, cx - (isP ? 16 : -16), cy + 12, 9, 0.75, false);
    } else {
      // 고속 돌진 스피드 라인 (Speed Lines)
      ctx.save();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.65)";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      const dirX = isP ? 1 : -1;
      for (let i = 0; i < 3; i++) {
        const lineY = cy - 12 + i * 12;
        const lineX1 = cx - dirX * 28;
        const lineX2 = cx - dirX * 6;
        ctx.beginPath();
        ctx.moveTo(lineX1, lineY);
        ctx.lineTo(lineX2, lineY);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Step 3: 정면 충돌 (돌진 타격 이펙트 호출)
  else if (moveStep === 3) {
    // 유저 요청: "이펙트는 돌진 타격이펙트" -> drawTakeDownEffect 사용
    const hitDrawCtx = {
      targetPos,
      attackerPos,
      isPlayer: isP,
      isHit: frame?.hitFlash ?? true,
      ...(drawCtx ?? {}),
    };
    drawTakeDownEffect(ctx, frame, hitDrawCtx);
  }

  // Step 4: 충돌 반동 바운스 (착지 먼지 및 진정)
  else if (moveStep === 4) {
    drawOrganicSteamPuff(ctx, tx + (isP ? 8 : -8), ty + 4, 10, 0.5, true);
    drawOrganicSteamPuff(ctx, cx, cy + 16, 8, 0.55, false);
  }

  ctx.restore();
}

// ============================================================================
// 100: 순간이동 (Teleport)
// ============================================================================

/**
 * 순간이동 배경 레이어 (신비로운 차원 왜곡 볼텍스 - 순백색 모노톤)
 */
export function drawTeleportBehindEffect(
  ctx: any,
  casterPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number,
  frame?: any
) {
  ctx.save();
  const cx = casterPos.x;
  const cy = casterPos.y;
  const p = effectProgress;

  // Step 1, 2, 3: 시전자 뒤편 차원 포털 왜곡 오라 (순백색 모노톤)
  if (moveStep >= 1 && moveStep <= 3) {
    const alpha = moveStep === 1 ? p * 0.75 : (moveStep === 2 ? 0.85 : (1.0 - p) * 0.85);
    const portalR = 45 + Math.sin(p * Math.PI * 3) * 6;

    const portalGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, portalR);
    portalGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.40 * alpha})`);
    portalGrad.addColorStop(0.50, `rgba(255, 255, 255, ${0.18 * alpha})`);
    portalGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = portalGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, portalR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 순간이동 전면 레이어 (수직 와핑 빔, 팝 소멸 플래시, 스타더스트 - 순백색 모노톤)
 */
export function drawTeleportEffect(
  ctx: any,
  casterPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  frame?: any
) {
  ctx.save();
  const cx = casterPos.x;
  const cy = casterPos.y;
  const p = effectProgress;

  // Step 1: 사이킥 텔레포트 차징 (유저 요청: 링 및 파티클 제거 완료, 순백색 모노톤)
  if (moveStep === 1) {
    // 링과 파티클을 제거하여 깔끔한 차원 집중 연출
  }

  // Step 2: 수직 차원 와핑 빔 (유저 요청: 컬러 이펙트 없이 흰색으로만 & 위로 갈수록 뾰족한 세로선 빔 & 양쪽 끝 투명한 가로선들)
  else if (moveStep === 2) {
    const beamW = 32 * (1.0 - p * 0.35);
    const alpha = 0.95;
    const topY = cy - 88;
    const bottomY = cy + 60;
    const baseHalfW = beamW * 0.55;

    // 1. 수직 사이킥 에너지 스파이어 (위로 갈수록 뾰족하게 모이는 첨탑 세로선 - 순백색)
    const beamGrad = ctx.createLinearGradient(cx - baseHalfW, cy, cx + baseHalfW, cy);
    beamGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    beamGrad.addColorStop(0.25, `rgba(255, 255, 255, ${0.45 * alpha})`);
    beamGrad.addColorStop(0.50, `rgba(255, 255, 255, ${0.95 * alpha})`);
    beamGrad.addColorStop(0.75, `rgba(255, 255, 255, ${0.45 * alpha})`);
    beamGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx + baseHalfW, bottomY);
    ctx.lineTo(cx - baseHalfW, bottomY);
    ctx.closePath();
    ctx.fill();

    // 2. 중심부 고휘도 순백색 코어 침 (위로 갈수록 더 날카롭게 뾰족)
    const coreHalfW = baseHalfW * 0.42;
    const coreGrad = ctx.createLinearGradient(cx - coreHalfW, cy, cx + coreHalfW, cy);
    coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    coreGrad.addColorStop(0.50, `rgba(255, 255, 255, ${0.95 * alpha})`);
    coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(cx, topY - 3);
    ctx.lineTo(cx + coreHalfW, bottomY);
    ctx.lineTo(cx - coreHalfW, bottomY);
    ctx.closePath();
    ctx.fill();

    // 3. 스캔라인 수평 컷팅선들 (유저 요청: 컬러 없이 순백색 & 가로선 양쪽 끝 투명 페이드아웃)
    for (let i = 0; i < 5; i++) {
      const lineY = cy - 46 + i * 18 + ((i * 11) % 7);
      // 세로선이 위로 갈수록 뾰족해지므로, 가로선 폭도 조화롭게 위쪽으로 갈수록 슬림
      const t = Math.max(0.18, Math.min(1.0, (lineY - topY) / (bottomY - topY)));
      const lineHalfW = (baseHalfW * t * 1.35) + 10 + ((i * 7) % 8);
      const x1 = cx - lineHalfW;
      const x2 = cx + lineHalfW;

      const lineGrad = ctx.createLinearGradient(x1, lineY, x2, lineY);
      lineGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      lineGrad.addColorStop(0.25, `rgba(255, 255, 255, ${0.65 * alpha})`);
      lineGrad.addColorStop(0.50, `rgba(255, 255, 255, ${0.95 * alpha})`);
      lineGrad.addColorStop(0.75, `rgba(255, 255, 255, ${0.65 * alpha})`);
      lineGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x1, lineY);
      ctx.lineTo(x2, lineY);
      ctx.stroke();
    }
  }

  // Step 3: 순간 소멸 팝 플래시 (유저 요청: #6도 반투명하게)
  else if (moveStep === 3) {
    const flashR = 44 * (1.0 - p * 0.25);
    const popAlpha = (1.0 - p) * 0.65;

    // 순간 소멸 순백 반투명 구체
    const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
    flashGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.55 * popAlpha})`);
    flashGrad.addColorStop(0.40, `rgba(255, 255, 255, ${0.28 * popAlpha})`);
    flashGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, flashR, 0, Math.PI * 2);
    ctx.fill();

    // 4방향 순백 반투명 크로스 스파크
    const starAlpha = Math.max(0.1, 0.65 * popAlpha);
    drawMiniRetroStar(ctx, cx, cy, 28 * (1.0 - p * 0.3), `rgba(255, 255, 255, ${starAlpha.toFixed(2)})`);
  }

  // Step 4: 잔여 차원 파문 & 스타더스트 부유 (유저 요청: 반투명 흰색가루 파티클 & 개별 투명도 차등)
  else if (moveStep === 4) {
    const alpha = Math.max(0, 1.0 - p);

    // 1) 바닥에 퍼져나가는 잔여 순백 파문 링
    ctx.save();
    ctx.translate(cx, cy + 18);
    ctx.scale(1.0, 0.35);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.50})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + p * 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2) 허공으로 흩날리는 순백 스타더스트/가루 파티클 (반투명하게, 어떤 것은 더 투명하게)
    const count = 12;
    for (let i = 0; i < count; i++) {
      const spProgress = (p * 1.15 + i * (1.0 / count)) % 1.0;
      const spAngle = i * 0.52 + 0.25;
      const spDist = 10 + spProgress * 32;
      const spX = cx + Math.cos(spAngle) * spDist;
      const spY = cy - spProgress * 50 + ((i % 4) * 6 - 8);

      // 개별 파티클마다 서로 다른 기본 투명도 (어떤 것은 0.6~0.7, 어떤 것은 0.15~0.28로 훨씬 투명)
      const transVariation = [0.65, 0.22, 0.45, 0.15, 0.55, 0.28, 0.70, 0.18, 0.50, 0.25, 0.60, 0.30][i % 12];
      const particleAlpha = Math.max(0.0, Math.min(0.75, transVariation * alpha * (1.0 - spProgress * 0.6)));

      const particleColor = `rgba(255, 255, 255, ${particleAlpha.toFixed(3)})`;
      const size = (3.2 + (i % 3) * 1.2) * (1.0 - spProgress * 0.35);

      if (i % 3 === 0) {
        // 작은 원형 미세 가루
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(spX, spY, size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 미니 레트로 스타 반짝임
        drawMiniRetroStar(ctx, spX, spY, size, particleColor, spAngle + p * 2);
      }
    }
  }

  ctx.restore();
}
