// ============================================================================
// 🎮 ROGUEPot Move Animation Renderer: No.133 ~ No.136
// 133: 망각술 (Amnesia)
// 134: 숟가락휘기 (Kinesis)
// 135: 알낳기 (Soft-Boiled)
// 136: 무릎차기 (High Jump Kick)
// ============================================================================

import { createCanvas } from "@napi-rs/canvas";
import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawFittedBattleSprite } from "../../common/spriteLoader.js";
import { drawStarburstImpact, drawStatBoostEffect } from "../common/helpers.js";
import { drawRecoveryStarSpiral } from "./move105_108.js";

// ============================================================================
// 🌟 공통 그래픽 헬퍼: 4각 다이아몬드 십자별 (Sparkle Diamond)
// ============================================================================
export function pathDiamondCross(ctx: any, rx: number, ry: number) {
  ctx.beginPath();
  ctx.moveTo(0, -ry);
  ctx.lineTo(rx * 0.22, -ry * 0.22);
  ctx.lineTo(rx, 0);
  ctx.lineTo(rx * 0.22, ry * 0.22);
  ctx.lineTo(0, ry);
  ctx.lineTo(-rx * 0.22, ry * 0.22);
  ctx.lineTo(-rx, 0);
  ctx.lineTo(-rx * 0.22, -ry * 0.22);
  ctx.closePath();
}

export function drawDiamondCrossSparkle(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation: number = 0,
  alpha: number = 1.0,
  color: string = "#FFFFFF"
) {
  if (alpha <= 0.01 || rx <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  pathDiamondCross(ctx, rx, ry);
  ctx.fill();
  ctx.restore();
}

// ============================================================================
// 📍 위치 좌표 헬퍼 (attackerPos / targetPos 안전 추출)
// ============================================================================
function getAttackerPos(drawCtx: EffectDrawContext): { x: number; y: number } {
  return (
    drawCtx.attackerPos ||
    drawCtx.casterPos ||
    (drawCtx.isPlayer ? drawCtx.pm : drawCtx.em) || { x: 200, y: 300 }
  );
}

function getTargetPos(drawCtx: EffectDrawContext): { x: number; y: number } {
  return (
    drawCtx.targetPos ||
    (!drawCtx.isPlayer ? drawCtx.pm : drawCtx.em) || { x: 500, y: 160 }
  );
}

// ============================================================================
// 133: 망각술 (Amnesia) 렌더러
// ============================================================================

/**
 * 🌑 배경 암전 오버레이 (Background Dim Overlay)
 */
function drawDimOverlay(ctx: any, alpha: number) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.85, alpha)})`;
  ctx.fillRect(-5000, -5000, 12000, 12000);
  ctx.restore();
}

/**
 * 💨 부드러운 유기적 수증기 퍼프 (Soft Steam Puff)
 * - 만화적 먹선 테두리 없이, 중심에서 외곽으로 부드럽게 페이드아웃되는 순수 수증기 연무
 */
function drawSoftSteamPuff(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.02 || radius <= 1.0) return;
  ctx.save();
  ctx.translate(x, y);

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  grad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.95})`);
  grad.addColorStop(0.40, `rgba(248, 251, 255, ${alpha * 0.80})`);
  grad.addColorStop(0.75, `rgba(235, 245, 255, ${alpha * 0.35})`);
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * ☁️ 모락모락 수증기 구름 + 중앙 파란색 물음표 (?)
 * - 먹선 테두리가 일절 없는 사실적이고 부드러운 수증기 구름 클러스터
 */
function drawAmnesiaSteamCloudWithQuestion(
  ctx: any,
  cx: number,
  cy: number,
  scale: number,
  rotation: number = 0,
  alpha: number = 1.0,
  qColor: string = "#00A8FF"
) {
  if (alpha <= 0.01 || scale <= 0.05) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);

  // 1. 하단에서 모락모락 피어오르는 작은 수증기 방울들
  drawSoftSteamPuff(ctx, -5, 20, 8, 0.55);
  drawSoftSteamPuff(ctx, 4, 13, 10, 0.70);

  // 2. 메인 수증기 구름 클러스터 (겹치는 부드러운 순백 수증기 덩어리)
  drawSoftSteamPuff(ctx, -18, 0, 17, 0.88);
  drawSoftSteamPuff(ctx, 18, 0, 17, 0.88);
  drawSoftSteamPuff(ctx, -10, -12, 19, 0.92);
  drawSoftSteamPuff(ctx, 10, -12, 19, 0.92);
  drawSoftSteamPuff(ctx, 0, 4, 19, 0.92);
  // 중심 고밀도 순백 코어
  drawSoftSteamPuff(ctx, 0, -4, 22, 1.0);

  // 3. 수증기 구름 정중앙의 파란색 물음표 (?)
  ctx.font = 'bold 30px "DungGeunMo", sans-serif, monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 어두운 네이비 블루 테두리 그림자 (암전 & 흰 수증기 속에서 완벽한 시인성)
  ctx.lineWidth = 4.0;
  ctx.strokeStyle = "#0A1931";
  ctx.strokeText("?", 0, -4);

  // 물음표 본체 (선명하고 청명한 파란색 / 스카이 블루)
  ctx.fillStyle = qColor;
  ctx.fillText("?", 0, -4);

  // 물음표 머리 상단 하이라이트 점
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(-4, -14, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 💨 수증기 구름 기화 파열 (Steam Cloud Disperse / Pop)
 * - 뭉게구름이 사방으로 부드럽게 흩어져 기화하며 소멸
 */
function drawAmnesiaSteamCloudPop(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  const alpha = Math.max(0, 1.0 - progress);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  const dist = 10 + progress * 34;
  const puffCount = 7;

  // 사방으로 부드럽게 확산되며 기화하는 수증기 퍼프들
  for (let i = 0; i < puffCount; i++) {
    const angle = (i * Math.PI * 2) / puffCount + 0.25;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * (dist * 0.7) - progress * 12; // 위로 모락모락 상승
    const r = Math.max(2, 15 * (1.0 - progress * 0.6));

    drawSoftSteamPuff(ctx, px, py, r, alpha * 0.85);
  }

  // 중심 잔여 수증기 감쇠
  drawSoftSteamPuff(ctx, cx, cy - 4, 18 * (1.0 - progress), alpha * 0.6);

  // 중심 파란색 스파클 (Blue Sparkle)
  drawDiamondCrossSparkle(ctx, cx, cy - 4, 7 * alpha, 10 * alpha, 0, alpha, "#00A8FF");
  drawDiamondCrossSparkle(ctx, cx, cy - 4, 4 * alpha, 6 * alpha, Math.PI / 4, alpha, "#74B9FF");

  ctx.restore();
}

export function drawAmnesiaEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const userPos = getAttackerPos(drawCtx);

  const phaseId = frame.phaseId || "";
  const progress = frame.effectProgress ?? 0;
  const ux = userPos.x;
  const uy = userPos.y;

  // 수증기 구름이 뜨는 위치: 시전자 머리 바로 위
  const cloudY = uy - 74;

  // 0. 머리 비우기 웅크림 (암전 서서히 시작)
  if (phaseId.startsWith("amnesia-crouch")) {
    drawDimOverlay(targetCtx, 0.40 * progress);
    return;
  }

  // 1. 수증기 구름 + 파란색 물음표 퐁! 생성 (암전 심화 0.40 -> 0.70)
  if (phaseId.startsWith("amnesia-cloud-spawn")) {
    drawDimOverlay(targetCtx, 0.40 + 0.30 * progress);
    const scale = Math.min(1.0, 0.3 + progress * 0.75);
    drawAmnesiaSteamCloudWithQuestion(targetCtx, ux, cloudY, scale, 0, Math.min(1.0, progress * 1.5), "#00A8FF");
    return;
  }

  // 2. 수증기 구름 정점 안착 & 갸우뚱~ (1차) (암전 0.70 유지)
  if (phaseId.startsWith("amnesia-cloud-tilt-1")) {
    drawDimOverlay(targetCtx, 0.70);
    const tilt = -0.14 * (1.0 - progress) + 0.12 * progress;
    drawAmnesiaSteamCloudWithQuestion(targetCtx, ux, cloudY, 1.0, tilt, 1.0, "#00A8FF");
    return;
  }

  // 3. 반대편으로 살짝 갸우뚱~ (2차) (암전 0.70 유지)
  if (phaseId.startsWith("amnesia-cloud-tilt-2")) {
    drawDimOverlay(targetCtx, 0.70);
    const tilt = 0.12 * (1.0 - progress) - 0.08 * progress;
    drawAmnesiaSteamCloudWithQuestion(targetCtx, ux, cloudY, 1.0, tilt, 1.0, "#00A8FF");
    return;
  }

  // 4. 수증기 구름 퐁! 하고 기화 터짐 (Pop!) (암전 0.70 -> 0.0 페이드아웃)
  if (phaseId.startsWith("amnesia-cloud-pop")) {
    drawDimOverlay(targetCtx, 0.70 * (1.0 - progress));
    drawAmnesiaSteamCloudPop(targetCtx, ux, cloudY, progress);
    return;
  }

  // 5. 스탯 상승 파티클 (암전 해제된 밝은 화면)
  if (phaseId.startsWith("amnesia-buff")) {
    drawStatBoostEffect(targetCtx, userPos, progress);
    return;
  }
}

// ============================================================================
// 134: 숟가락휘기 (Kinesis) 렌더러
// ============================================================================

/**
 * 은빛 메탈릭 숟가락 (구부러지는 관절 포함)
 */
function drawBendingSpoon(
  ctx: any,
  cx: number,
  cy: number,
  bendAngleDeg: number,
  scale: number = 1.0,
  auraAlpha: number = 0.0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const bendRad = (bendAngleDeg * Math.PI) / 180;
  const sinB = Math.sin(bendRad);
  const cosB = Math.cos(bendRad);

  // 1. 기하 계산:
  // - 손잡이 상단(접합부): (0, 4)
  // - 머리 회전 중심 (0, 0)
  // - 휨 넥(Neck) 중심선 끝 (머리 기저부 로컬 (0, -8)):
  const cbX = 8 * sinB;
  const cbY = -8 * cosB;

  // - 휨 넥 머리 내부 연장 지점 (머리 로컬 (0, -12)):
  const ctopX = 12 * sinB;
  const ctopY = -12 * cosB;

  // 넥 중심선 제어점 계산:
  const distCenter = Math.hypot(cbX, cbY - 4);
  const lCenter = Math.max(2.0, distCenter * 0.4);
  const cp1Center = { x: 0, y: 4 - lCenter };
  const cp2Center = { x: cbX - sinB * lCenter, y: cbY + cosB * lCenter };

  // 2. 보랏빛 사이킥 오라 글로우 (뒤쪽)
  if (auraAlpha > 0.05) {
    ctx.save();
    // 부드러운 외곽 광채 (Outer aura)
    ctx.globalAlpha = Math.min(0.35, auraAlpha * 0.4);
    ctx.strokeStyle = "#C56CF0";
    ctx.fillStyle = "#C56CF0";
    ctx.lineWidth = 16;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.lineTo(0, 4);
    ctx.bezierCurveTo(cp1Center.x, cp1Center.y, cp2Center.x, cp2Center.y, cbX, cbY);
    ctx.stroke();

    ctx.save();
    ctx.rotate(bendRad);
    ctx.beginPath();
    ctx.ellipse(0, -22, 15, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 밝은 내부 오라 (Core aura)
    ctx.globalAlpha = Math.min(0.75, auraAlpha * 0.8);
    ctx.strokeStyle = "#A29BFE";
    ctx.fillStyle = "#A29BFE";
    ctx.lineWidth = 8;

    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.lineTo(0, 4);
    ctx.bezierCurveTo(cp1Center.x, cp1Center.y, cp2Center.x, cp2Center.y, cbX, cbY);
    ctx.stroke();

    ctx.save();
    ctx.rotate(bendRad);
    ctx.beginPath();
    ctx.ellipse(0, -22, 12, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // 3. 일체형 외곽 딥 실버 실루엣 (#778CA3)
  // - 손잡이와 넥이 분리되지 않고 하나의 통짜 금속 패스로 이어짐
  const wShadow = 3.4;
  const hlShadow = { x: -wShadow, y: 4 };
  const hrShadow = { x: wShadow, y: 4 };
  const tlShadow = { x: ctopX - wShadow * cosB, y: ctopY - wShadow * sinB };
  const trShadow = { x: ctopX + wShadow * cosB, y: ctopY + wShadow * sinB };

  const distLShadow = Math.hypot(tlShadow.x - hlShadow.x, tlShadow.y - hlShadow.y);
  const lLShadow = Math.max(1.8, distLShadow * 0.38);
  const cpL1Shadow = { x: hlShadow.x, y: hlShadow.y - lLShadow };
  const cpL2Shadow = { x: tlShadow.x - sinB * lLShadow, y: tlShadow.y + cosB * lLShadow };

  const distRShadow = Math.hypot(trShadow.x - hrShadow.x, trShadow.y - hrShadow.y);
  const lRShadow = Math.max(1.8, distRShadow * 0.38);
  const cpR1Shadow = { x: trShadow.x - sinB * lRShadow, y: trShadow.y + cosB * lRShadow };
  const cpR2Shadow = { x: hrShadow.x, y: hrShadow.y - lRShadow };

  ctx.fillStyle = "#778CA3"; // 딥 실버 섀도우

  ctx.beginPath();
  // 손잡이 좌측
  ctx.moveTo(hlShadow.x, hlShadow.y);
  ctx.lineTo(-2.2, 22);
  ctx.bezierCurveTo(-3.5, 28, -2, 34, 0, 34);
  ctx.bezierCurveTo(2, 34, 3.5, 28, 2.2, 22);
  ctx.lineTo(hrShadow.x, hrShadow.y);
  // 휨 넥 우측 곡선 (외곽/내각 매끄럽게 연결)
  ctx.bezierCurveTo(cpR2Shadow.x, cpR2Shadow.y, cpR1Shadow.x, cpR1Shadow.y, trShadow.x, trShadow.y);
  // 머리 내부 진입단
  ctx.lineTo(tlShadow.x, tlShadow.y);
  // 휨 넥 좌측 곡선
  ctx.bezierCurveTo(cpL2Shadow.x, cpL2Shadow.y, cpL1Shadow.x, cpL1Shadow.y, hlShadow.x, hlShadow.y);
  ctx.closePath();
  ctx.fill();

  // 머리(Bowl) 외곽 타원 (동일한 딥 실버로 완전 융합)
  ctx.save();
  ctx.rotate(bendRad);
  ctx.beginPath();
  ctx.ellipse(0, -22, 10, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. 일체형 내부 메탈릭 실버 몸체 (#D1D8E0)
  const wBody = 2.2;
  const hlBody = { x: -wBody, y: 4 };
  const hrBody = { x: wBody, y: 4 };
  const tlBody = { x: ctopX - wBody * cosB, y: ctopY - wBody * sinB };
  const trBody = { x: ctopX + wBody * cosB, y: ctopY + wBody * sinB };

  const distLBody = Math.hypot(tlBody.x - hlBody.x, tlBody.y - hlBody.y);
  const lLBody = Math.max(1.8, distLBody * 0.38);
  const cpL1Body = { x: hlBody.x, y: hlBody.y - lLBody };
  const cpL2Body = { x: tlBody.x - sinB * lLBody, y: tlBody.y + cosB * lLBody };

  const distRBody = Math.hypot(trBody.x - hrBody.x, trBody.y - hrBody.y);
  const lRBody = Math.max(1.8, distRBody * 0.38);
  const cpR1Body = { x: trBody.x - sinB * lRBody, y: trBody.y + cosB * lRBody };
  const cpR2Body = { x: hrBody.x, y: hrBody.y - lRBody };

  ctx.fillStyle = "#D1D8E0"; // 메탈릭 실버
  ctx.beginPath();
  // 손잡이 몸체
  ctx.moveTo(hlBody.x, hlBody.y);
  ctx.lineTo(-1.2, 20);
  ctx.bezierCurveTo(-2.2, 26, -1, 32, 0, 32);
  ctx.bezierCurveTo(1, 32, 2.2, 26, 1.2, 20);
  ctx.lineTo(hrBody.x, hrBody.y);
  // 휨 넥 몸체 우측
  ctx.bezierCurveTo(cpR2Body.x, cpR2Body.y, cpR1Body.x, cpR1Body.y, trBody.x, trBody.y);
  // 머리 내부 연결
  ctx.lineTo(tlBody.x, tlBody.y);
  // 휨 넥 몸체 좌측
  ctx.bezierCurveTo(cpL2Body.x, cpL2Body.y, cpL1Body.x, cpL1Body.y, hlBody.x, hlBody.y);
  ctx.closePath();
  ctx.fill();

  // 머리(Bowl) 내부 메탈릭 실버 타원 (동일한 메탈릭 실버로 100% 매끄럽게 융합)
  ctx.save();
  ctx.rotate(bendRad);
  ctx.beginPath();
  ctx.ellipse(0, -22, 8.5, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. 유기적으로 이어지는 메탈릭 광택 하이라이트 (#FFFFFF)
  // 손잡이 끝부터 꺾인 넥을 타고 매끄럽게 흐르는 중심 반사광
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(0, 4);
  ctx.bezierCurveTo(cp1Center.x, cp1Center.y, cp2Center.x, cp2Center.y, cbX, cbY);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  ctx.stroke();

  // 머리 볼록한 빛 반사 하이라이트
  ctx.save();
  ctx.rotate(bendRad);
  ctx.beginPath();
  ctx.ellipse(-2.5, -23, 4.5, 9, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 🌑 약한 보라색 배경 암전 오버레이 (Subtle Purple Dim Overlay)
 */
function drawPurpleDimOverlay(ctx: any, alpha: number) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.fillStyle = `rgba(28, 12, 45, ${Math.min(0.65, alpha)})`;
  ctx.fillRect(-5000, -5000, 12000, 12000);
  ctx.restore();
}

/**
 * 🔮 숟가락 절곡 후 사방으로 퍼져나가는 보랏빛 사이킥 파장
 */
function drawExpandingPurpleWave(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress <= 0.01 || progress >= 1.0) return;

  ctx.save();
  ctx.translate(cx, cy);

  const maxR = 220;
  const r1 = 15 + progress * maxR;
  const alpha1 = Math.sin(progress * Math.PI) * 0.85;

  // 외곽 보라색 글로우 링
  ctx.beginPath();
  ctx.ellipse(0, 0, r1 * 1.25, r1 * 0.75, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(162, 155, 254, ${alpha1 * 0.9})`; // 밝은 라벤더 보라
  ctx.lineWidth = Math.max(1, (1.0 - progress) * 6.0);
  ctx.stroke();

  // 내부 진한 바이올렛 링
  ctx.beginPath();
  ctx.ellipse(0, 0, r1 * 1.15, r1 * 0.68, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(142, 68, 173, ${alpha1 * 0.7})`;
  ctx.lineWidth = Math.max(1, (1.0 - progress) * 3.5);
  ctx.stroke();

  // 2차 후속 링
  const p2 = Math.max(0, progress - 0.20) / 0.80;
  if (p2 > 0 && p2 < 1.0) {
    const r2 = 10 + p2 * (maxR * 0.75);
    const alpha2 = Math.sin(p2 * Math.PI) * 0.65;
    ctx.beginPath();
    ctx.ellipse(0, 0, r2 * 1.25, r2 * 0.75, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(197, 108, 240, ${alpha2 * 0.8})`;
    ctx.lineWidth = Math.max(1, (1.0 - p2) * 4.0);
    ctx.stroke();
  }

  // 중심부 보랏빛 플래시 확산
  if (progress < 0.45) {
    const flashProg = progress / 0.45;
    const flashR = 20 + flashProg * 45;
    const flashAlpha = (1.0 - flashProg) * 0.55;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, flashR);
    grad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
    grad.addColorStop(0.4, `rgba(162, 155, 254, ${flashAlpha * 0.8})`);
    grad.addColorStop(1.0, `rgba(108, 92, 231, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, flashR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawKinesisEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const userPos = getAttackerPos(drawCtx);
  const targetPos = getTargetPos(drawCtx);
  const dir = targetPos.x >= userPos.x ? 1 : -1;

  const phaseId = frame.phaseId || "";
  const progress = frame.effectProgress ?? 0;

  // 숟가락 위치: 전장 중앙 상공
  const spoonX = userPos.x * 0.5 + targetPos.x * 0.5;
  const spoonY = userPos.y * 0.5 + targetPos.y * 0.5 - 24;

  // 1. 숟가락 등장 (약한 보라색 암전 서서히 시작)
  if (phaseId.startsWith("kinesis-spawn")) {
    drawPurpleDimOverlay(targetCtx, 0.35 * progress);
    const alpha = Math.min(1.0, progress * 1.5);
    targetCtx.save();
    targetCtx.globalAlpha = alpha;
    drawBendingSpoon(targetCtx, spoonX, spoonY, 0, 1.0, 0.7);
    targetCtx.restore();
    return;
  }

  // 2. 숟가락 꺾임 진행 (0도 -> 80도, 암전 유지)
  if (phaseId.startsWith("kinesis-bend")) {
    drawPurpleDimOverlay(targetCtx, 0.35 + 0.15 * progress);
    const bendAngle = progress * 80 * dir;
    drawBendingSpoon(targetCtx, spoonX, spoonY, bendAngle, 1.0, 0.9);
    return;
  }

  // 3. 꺾인 후 퍼지는 보라색 파장 (절곡 숟가락 유지 & 보랏빛 충격파 확산)
  if (phaseId.startsWith("kinesis-wave")) {
    drawPurpleDimOverlay(targetCtx, 0.50 * (1.0 - progress * 0.5));
    // 파장 확산
    drawExpandingPurpleWave(targetCtx, spoonX, spoonY, progress);
    // 꺾인 숟가락 유지
    drawBendingSpoon(targetCtx, spoonX, spoonY, 80 * dir, 1.0, 0.8);
    return;
  }

  // 4. 숟가락 페이드아웃 소멸 & 암전 해제
  if (phaseId.startsWith("kinesis-fade")) {
    drawPurpleDimOverlay(targetCtx, 0.25 * (1.0 - progress));
    const alpha = Math.max(0, 1.0 - progress);
    if (alpha > 0.05) {
      targetCtx.save();
      targetCtx.globalAlpha = alpha;
      drawBendingSpoon(targetCtx, spoonX, spoonY, 80 * dir, 1.0, alpha * 0.6);
      targetCtx.restore();
    }
  }
}

// ============================================================================
// 135: 알낳기 (Soft-Boiled) 렌더러
// ============================================================================

/**
 * 🥚 부드러운 달걀 모양 패스
 */
function pathEgg(ctx: any, rx: number, ry: number) {
  ctx.beginPath();
  // 상단은 살짝 갸름하고 하단은 둥글고 풍만한 완벽한 계란 형상
  ctx.moveTo(0, -ry);
  ctx.bezierCurveTo(rx * 0.72, -ry, rx, -ry * 0.15, rx, ry * 0.35);
  ctx.bezierCurveTo(rx, ry * 0.88, rx * 0.6, ry, 0, ry);
  ctx.bezierCurveTo(-rx * 0.6, ry, -rx, ry * 0.88, -rx, ry * 0.35);
  ctx.bezierCurveTo(-rx, -ry * 0.15, -rx * 0.72, -ry, 0, -ry);
  ctx.closePath();
}

/**
 * 🥚 온전한 달걀 렌더러 (회전, 스케일, 균열선 지원)
 */
function drawCompleteEgg(
  ctx: any,
  x: number,
  y: number,
  rot: number = 0,
  scale: number = 1.0,
  crackProg: number = 0
) {
  ctx.save();
  ctx.translate(x, y);
  if (rot !== 0) ctx.rotate(rot);
  if (scale !== 1.0) ctx.scale(scale, scale);

  // 알 그림자 / 테두리
  ctx.fillStyle = "#E5C287";
  pathEgg(ctx, 16, 22);
  ctx.fill();

  // 알 크림/상아빛 본체
  ctx.fillStyle = "#FFFDF8";
  pathEgg(ctx, 14.5, 20.5);
  ctx.fill();

  // 계란 표면 광택 하이라이트
  ctx.beginPath();
  ctx.ellipse(-4.5, -7, 5, 8.5, -0.25, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fill();

  // 지그재그 균열선 (Crack)
  if (crackProg > 0.05) {
    const p = Math.min(1.0, crackProg);
    const rx = 14.5;
    ctx.beginPath();
    ctx.moveTo(-rx * p, -1);
    ctx.lineTo(-rx * 0.6 * p, -5 * p);
    ctx.lineTo(-rx * 0.2 * p, 3 * p);
    ctx.lineTo(rx * 0.2 * p, -4 * p);
    ctx.lineTo(rx * 0.6 * p, 2 * p);
    ctx.lineTo(rx * p, -1);
    ctx.strokeStyle = "#8B572A";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // 틈새로 살짝 새어나오는 황금빛 광채
    if (p > 0.4) {
      ctx.beginPath();
      ctx.moveTo(-rx * p * 0.8, -1);
      ctx.lineTo(-rx * 0.6 * p * 0.8, -5 * p);
      ctx.lineTo(-rx * 0.2 * p * 0.8, 3 * p);
      ctx.lineTo(rx * 0.2 * p * 0.8, -4 * p);
      ctx.lineTo(rx * 0.6 * p * 0.8, 2 * p);
      ctx.lineTo(rx * p * 0.8, -1);
      ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * 🐣 깨진 달걀 상단 껍질 패스
 */
function pathTopEggShell(ctx: any, rx: number, ry: number) {
  ctx.beginPath();
  ctx.moveTo(-rx, -1);
  ctx.lineTo(-rx * 0.6, -5);
  ctx.lineTo(-rx * 0.2, 3);
  ctx.lineTo(rx * 0.2, -4);
  ctx.lineTo(rx * 0.6, 2);
  ctx.lineTo(rx, -1);
  ctx.bezierCurveTo(rx, -ry * 0.15, rx * 0.72, -ry, 0, -ry);
  ctx.bezierCurveTo(-rx * 0.72, -ry, -rx, -ry * 0.15, -rx, -1);
  ctx.closePath();
}

/**
 * 🐣 깨진 달걀 하단 껍질 패스
 */
function pathBottomEggShell(ctx: any, rx: number, ry: number) {
  ctx.beginPath();
  ctx.moveTo(-rx, -1);
  ctx.lineTo(-rx * 0.6, -5);
  ctx.lineTo(-rx * 0.2, 3);
  ctx.lineTo(rx * 0.2, -4);
  ctx.lineTo(rx * 0.6, 2);
  ctx.lineTo(rx, -1);
  ctx.bezierCurveTo(rx, ry * 0.35, rx * 0.88, ry, 0, ry);
  ctx.bezierCurveTo(-rx * 0.88, ry, -rx, ry * 0.35, -rx, -1);
  ctx.closePath();
}

/**
 * 🐣 부화(해칭)하여 열린 달걀 렌더러 (상하 껍질 분리 + 황금 노른자 + 밝은 범위 광채)
 */
function drawHatchedEgg(
  ctx: any,
  x: number,
  y: number,
  splitProg: number,
  alpha: number = 1.0,
  showBurst: boolean = true
) {
  if (alpha <= 0.02) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Math.min(1.0, alpha);

  const rxOut = 16;
  const ryOut = 22;
  const rxIn = 14.5;
  const ryIn = 20.5;

  const splitY = splitProg * 20;

  // 1. 달걀 부화 시 사방으로 퍼지는 밝은 범위 광채 (Wide Ambient Burst)
  if (showBurst && splitProg > 0.05) {
    const burstAlpha = Math.min(0.85, splitProg * 1.2) * alpha;
    const burstR = 18 + splitProg * 42;
    ctx.save();
    ctx.globalAlpha = burstAlpha;
    const burstGrad = ctx.createRadialGradient(0, splitY * 0.15, 0, 0, splitY * 0.15, burstR);
    burstGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    burstGrad.addColorStop(0.3, "rgba(255, 245, 170, 0.85)");
    burstGrad.addColorStop(0.65, "rgba(255, 215, 0, 0.40)");
    burstGrad.addColorStop(1.0, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = burstGrad;
    ctx.beginPath();
    ctx.arc(0, splitY * 0.15, burstR, 0, Math.PI * 2);
    ctx.fill();

    // 부화 순간 중앙 십자 글린트
    if (splitProg > 0.3) {
      const spAlpha = Math.min(1.0, (splitProg - 0.3) / 0.7);
      drawDiamondCrossSparkle(ctx, 0, splitY * 0.15, 10 * spAlpha, 14 * spAlpha, 0, spAlpha * 0.9, "#FFFFFF");
      drawDiamondCrossSparkle(ctx, 0, splitY * 0.15, 6 * spAlpha, 8 * spAlpha, Math.PI / 4, spAlpha * 0.7, "#FFD32A");
    }
    ctx.restore();
  }

  // 2. 하단 껍질 속 영롱한 황금빛 노른자 (Golden Yolk)
  ctx.save();
  ctx.translate(0, splitY * 0.25);
  // 노른자 주변 은은한 앰비언트 글로우
  const yolkGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
  yolkGlow.addColorStop(0, "rgba(255, 235, 120, 0.55)");
  yolkGlow.addColorStop(1, "rgba(255, 215, 0, 0)");
  ctx.fillStyle = yolkGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  const yolkGrad = ctx.createRadialGradient(0, 0, 2, 0, 2, 13);
  yolkGrad.addColorStop(0, "#FFF275");
  yolkGrad.addColorStop(0.45, "#FFA801");
  yolkGrad.addColorStop(1.0, "#FF8A00");
  ctx.fillStyle = yolkGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();

  // 노른자 하이라이트 글린트
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(-3.5, -4, 3, 2, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. 하단 껍질 (Bottom Shell)
  ctx.save();
  ctx.translate(0, splitY * 0.35);
  ctx.rotate(splitProg * 0.08);

  ctx.fillStyle = "#E5C287";
  pathBottomEggShell(ctx, rxOut, ryOut);
  ctx.fill();

  ctx.fillStyle = "#FFFDF8";
  pathBottomEggShell(ctx, rxIn, ryIn);
  ctx.fill();

  ctx.strokeStyle = "#F0DCB5";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // 4. 상단 껍질 (Top Shell)
  ctx.save();
  ctx.translate(0, -splitY);
  ctx.rotate(-splitProg * 0.25);

  ctx.fillStyle = "#E5C287";
  pathTopEggShell(ctx, rxOut, ryOut);
  ctx.fill();

  ctx.fillStyle = "#FFFDF8";
  pathTopEggShell(ctx, rxIn, ryIn);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(-4, -12, 4, 6, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 힐링 그린 크로스 (+) 렌더러
 */
function drawHealingCross(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number = 1.0,
  color: string = "#00E676"
) {
  if (alpha <= 0.01 || size <= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);

  const w = size * 0.32;
  const h = size;

  // 외곽선/음영
  ctx.fillStyle = "#00B894";
  ctx.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
  ctx.fillRect(-h / 2 - 1, -w / 2 - 1, h + 2, w + 2);

  // 내부 본체
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillRect(-h / 2, -w / 2, h, w);

  // 중심 하이라이트
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(-w / 4, -w / 4, w / 2, w / 2);

  ctx.restore();
}

export function drawSoftBoiledEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const userPos = getAttackerPos(drawCtx);

  const phaseId = frame.phaseId || "";
  const progress = frame.effectProgress ?? 0;
  const ux = userPos.x;
  const uy = userPos.y;

  // 알의 기본 위치: 시전자 앞 살짝 상공
  const eggBaseX = ux + (drawCtx.isPlayer ? 22 : -22);
  const eggBaseY = uy - 20;

  // 1. 달걀 통- 도약 출현
  if (phaseId.startsWith("softboiled-spawn")) {
    const jumpY = -Math.sin(progress * Math.PI) * 22;
    const eggScale = Math.min(1.0, 0.5 + progress * 0.6);
    drawCompleteEgg(targetCtx, eggBaseX, eggBaseY + jumpY, 0, eggScale, 0);
    return;
  }

  // 2. 달걀 좌우 흔들림 (Wobble) - 부화 전 긴장감!
  if (phaseId === "softboiled-wobble-1") {
    const rot = -Math.sin(progress * Math.PI) * 0.16;
    drawCompleteEgg(targetCtx, eggBaseX, eggBaseY, rot, 1.0, 0);
    return;
  }
  if (phaseId === "softboiled-wobble-2") {
    const rot = Math.sin(progress * Math.PI) * 0.16;
    drawCompleteEgg(targetCtx, eggBaseX, eggBaseY, rot, 1.0, 0);
    return;
  }

  // 3. 달걀 균열 (Crack) 톡!
  if (phaseId.startsWith("softboiled-crack")) {
    drawCompleteEgg(targetCtx, eggBaseX, eggBaseY, 0, 1.0, progress);
    return;
  }

  // 4. 알 해칭(부화) & 껍질 오픈 & 밝은 범위 빛 방출
  if (phaseId === "softboiled-hatch-1" || phaseId === "softboiled-hatch-2" || phaseId === "softboiled-hatch") {
    drawHatchedEgg(targetCtx, eggBaseX, eggBaseY, progress, 1.0, true);
    return;
  }

  // 4-1. 부화 후 알 껍질 & 노른자 완전 페이드아웃 (계란 깨고 난 후 완전히 소멸)
  if (phaseId.startsWith("softboiled-hatch-fade")) {
    const fadeAlpha = Math.max(0, 1.0 - progress);
    if (fadeAlpha > 0.02) {
      drawHatchedEgg(targetCtx, eggBaseX, eggBaseY, 1.0, fadeAlpha, false);
    }
    return;
  }

  // 5. HP 회복 엠블럼 나선 상승 & 시전자 전신 치유 흡수 (계란이 완전히 사라진 후 진행!)
  if (phaseId.startsWith("softboiled-recover") || phaseId.startsWith("softboiled-absorb")) {
    const bodyCenterY = uy - (drawCtx.isPlayer ? 10 : 8);
    drawRecoveryStarSpiral(targetCtx, ux, bodyCenterY, progress);
    return;
  }

  // 6. HP 회복 완료 및 착지 & 잔여 치유 반짝임
  if (phaseId.startsWith("softboiled-settle")) {
    const alpha = Math.max(0, 1.0 - progress * 1.5);
    if (alpha > 0.02) {
      drawDiamondCrossSparkle(targetCtx, ux - 15, uy - 25, 6 * alpha, 9 * alpha, 0, alpha, "#AAFF00");
      drawDiamondCrossSparkle(targetCtx, ux + 16, uy - 32, 7 * alpha, 10 * alpha, 0.4, alpha, "#DEFF99");
      drawDiamondCrossSparkle(targetCtx, ux, uy - 45, 5 * alpha, 8 * alpha, -0.3, alpha, "#FFFFFF");
    }
  }
}

// ============================================================================
// 136: 무릎차기 (High Jump Kick) 렌더러
// ============================================================================

let orangeGhostCanvas: any = null;
let orangeGhostCtx: any = null;
let lastOrangeSprite: any = null;
let lastOrangeSize: number = 0;

function getOrangeSilhouetteCanvas(sprite: any, size: number): { canvas: any; cx: number; cy: number } {
  const s = Math.max(Math.ceil(size * 1.5), 320);
  if (!orangeGhostCanvas || orangeGhostCanvas.width !== s || orangeGhostCanvas.height !== s) {
    orangeGhostCanvas = createCanvas(s, s);
    orangeGhostCtx = orangeGhostCanvas.getContext("2d");
    lastOrangeSprite = null;
  }
  if (lastOrangeSprite !== sprite || lastOrangeSize !== size) {
    orangeGhostCtx.clearRect(0, 0, s, s);
    orangeGhostCtx.save();
    drawFittedBattleSprite(orangeGhostCtx, sprite, s / 2, s / 2, size);
    orangeGhostCtx.globalCompositeOperation = "source-in";
    const grad = orangeGhostCtx.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, "#FFB830"); // 상단 황금 주황
    grad.addColorStop(1, "#FF5200"); // 하단 진한 주황
    orangeGhostCtx.fillStyle = grad;
    orangeGhostCtx.fillRect(0, 0, s, s);
    orangeGhostCtx.restore();

    lastOrangeSprite = sprite;
    lastOrangeSize = size;
  }
  return { canvas: orangeGhostCanvas, cx: s / 2, cy: s / 2 };
}

function drawOrangeGhost(
  targetCtx: any,
  sprite: any,
  x: number,
  y: number,
  size: number,
  scaleX: number = 1.0,
  scaleY: number = 1.0,
  rot: number = 0,
  alpha: number = 1.0
) {
  if (!sprite || alpha <= 0.02) return;
  const { canvas, cx, cy } = getOrangeSilhouetteCanvas(sprite, size);
  targetCtx.save();
  targetCtx.globalAlpha = Math.max(0, Math.min(1.0, alpha));
  targetCtx.translate(x, y);
  if (rot) targetCtx.rotate(rot);
  if (scaleX !== 1 || scaleY !== 1) targetCtx.scale(scaleX, scaleY);
  targetCtx.drawImage(canvas, -cx, -cy);
  targetCtx.restore();
}

/**
 * 🏃 무릎차기 배경 레이어 (시전포켓몬 후방 주황색 스프라이트 잔상)
 * - ⚠️ [유저 요청]: 불꽃처럼 길게 늘어진 것 제거하고 순수 주황 스프라이트 잔상만 남김 (끝쪽이 투명한)
 */
export function drawHighJumpKickBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const phaseId = frame.phaseId || "";
  const isP = drawCtx.isPlayer;
  const sprite = isP ? drawCtx.playerSprite : drawCtx.enemySprite;
  const base = isP ? drawCtx.pm : drawCtx.em;
  if (!sprite || !base) return;

  const size = base.size || (isP ? 140 : 110);
  const offset = isP ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
  const curX = base.x + offset.x;
  const curY = base.y + offset.y;

  const pScale = isP ? frame.pScale : frame.eScale;
  const scaleX = pScale?.x ?? 1.0;
  const scaleY = pScale?.y ?? 1.0;
  const rot = isP ? (frame.pRot ?? 0) : (frame.eRot ?? 0);

  // 1. 도약 단계 (hjk-leap-1, hjk-leap-2): 상공으로 솟구칠 때 후방/아래쪽으로 뻗는 주황 스프라이트 잔상
  if (phaseId.startsWith("hjk-leap")) {
    const leapAngle = isP ? Math.atan2(-75, 30) : Math.atan2(-65, -25);
    const backAngle = leapAngle + Math.PI;
    const cosB = Math.cos(backAngle);
    const sinB = Math.sin(backAngle);

    // 시전자 후방 주황색 실루엣 잔상 3개 (뒤로 갈수록 투명해져 0으로 소멸)
    drawOrangeGhost(targetCtx, sprite, curX + cosB * 20, curY + sinB * 20, size, scaleX, scaleY, rot, 0.48);
    drawOrangeGhost(targetCtx, sprite, curX + cosB * 40, curY + sinB * 40, size, scaleX * 0.96, scaleY * 0.96, rot, 0.25);
    drawOrangeGhost(targetCtx, sprite, curX + cosB * 60, curY + sinB * 60, size, scaleX * 0.92, scaleY * 0.92, rot, 0.08);
    return;
  }

  // 2. 급강하 돌진 단계 (hjk-dive-1, hjk-dive-2): 상공에서 타겟을 향해 마하 강하할 때 후방 주황 스프라이트 잔상
  if (phaseId.startsWith("hjk-dive")) {
    const targetBase = isP ? drawCtx.em : drawCtx.pm;
    const dx = targetBase.x - curX;
    const dy = targetBase.y - curY;
    const diveAngle = Math.atan2(dy, dx);
    const backAngle = diveAngle + Math.PI;
    const cosB = Math.cos(backAngle);
    const sinB = Math.sin(backAngle);

    // 시전자 후방 주황색 실루엣 잔상 3개 (뒤로 갈수록 투명해져 0으로 소멸)
    drawOrangeGhost(targetCtx, sprite, curX + cosB * 25, curY + sinB * 25, size, scaleX, scaleY, rot, 0.52);
    drawOrangeGhost(targetCtx, sprite, curX + cosB * 50, curY + sinB * 50, size, scaleX * 0.95, scaleY * 0.95, rot, 0.26);
    drawOrangeGhost(targetCtx, sprite, curX + cosB * 75, curY + sinB * 75, size, scaleX * 0.90, scaleY * 0.90, rot, 0.09);
    return;
  }
}

/**
 * 지면 바닥 먼지 폭풍 (Dust Puffs)
 */
function drawGroundDustPuffs(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const dustDist = progress * 32;
  const puffR = 6 + progress * 8;

  // 좌측 먼지
  ctx.beginPath();
  ctx.arc(cx - dustDist, cy, puffR, 0, Math.PI * 2);
  ctx.arc(cx - dustDist * 0.6, cy - 4, puffR * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = "#DFE6E9";
  ctx.fill();

  // 우측 먼지
  ctx.beginPath();
  ctx.arc(cx + dustDist, cy, puffR, 0, Math.PI * 2);
  ctx.arc(cx + dustDist * 0.6, cy - 4, puffR * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = "#DFE6E9";
  ctx.fill();

  ctx.restore();
}

/**
 * 🔴 무릎차기 고광택 붉은 입체 구체 알갱이 (Glossy Red Impact Beads)
 * - ⚠️ [유저 요청]: 타격 현재거 유지하면서 이런 빨강 알갱이들이 사방으로 퍼지게 (퍼지면서 페이드아웃)
 * - 스크린샷 레퍼런스와 동일하게 좌상단 화이트 스펙큘러 하이라이트가 또렷한 3D 레드 비드
 */
function drawGlossyRedBead(
  ctx: any,
  bx: number,
  by: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.02 || radius <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  // 1. 3D 입체 방사형 구체 그라데이션 (좌상단 웜 오렌지 하이라이트 -> #FF1D00 비비드 바디 -> 우하단 깊은 음영)
  const lightOffsetX = radius * 0.30;
  const lightOffsetY = radius * 0.30;
  const sphereGrad = ctx.createRadialGradient(
    bx - lightOffsetX,
    by - lightOffsetY,
    radius * 0.08,
    bx,
    by,
    radius
  );
  sphereGrad.addColorStop(0.0, "#FF8A50"); // 좌상단 화사한 웜 하이라이트
  sphereGrad.addColorStop(0.35, "#FF1D00"); // ⚠️ [유저 지정]: 강렬한 비비드 버밀리온 레드 (#FF1D00)
  sphereGrad.addColorStop(0.75, "#BA1400"); // 깊은 버밀리온 쉐이딩
  sphereGrad.addColorStop(1.0, "#660B00");  // 우하단 깊은 테두리 그림자

  ctx.fillStyle = sphereGrad;
  ctx.beginPath();
  ctx.arc(bx, by, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 고광택 화이트 스펙큘러 하이라이트 (Glossy White Glint)
  // 스크린샷과 정확히 일치하는 좌상단의 또렷한 원형 하얀 반사광 점
  const glintR = radius * 0.28;
  const gx = bx - radius * 0.32;
  const gy = by - radius * 0.32;

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(gx, gy, glintR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🌟 붉은 충격 스파클 별 (Red Impact Sparkle)
 * - 스크린샷 속 비산하는 6각 붉은 섬광별 재현 (#FF1D00)
 */
function drawRedImpactSparkle(
  ctx: any,
  sx: number,
  sy: number,
  size: number,
  alpha: number
) {
  if (alpha <= 0.02 || size <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));
  ctx.translate(sx, sy);

  ctx.fillStyle = "#FF1D00";
  const points = 6;
  const outerR = size;
  const innerR = size * 0.38;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / points;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

const RED_IMPACT_BEADS = [
  // 상/하/좌/우 사방 10방향 알갱이 (스크린샷에 나타난 구도)
  { angle: -Math.PI * 0.48, distMult: 1.15, radius: 6.5 }, // 12시 상단
  { angle: -Math.PI * 0.30, distMult: 0.98, radius: 5.4 }, // 1시
  { angle: -Math.PI * 0.10, distMult: 1.22, radius: 6.2 }, // 2시
  { angle:  Math.PI * 0.12, distMult: 1.05, radius: 5.8 }, // 4시
  { angle:  Math.PI * 0.35, distMult: 1.25, radius: 5.2 }, // 5시
  { angle:  Math.PI * 0.52, distMult: 1.10, radius: 6.0 }, // 6시 하단
  { angle:  Math.PI * 0.72, distMult: 0.92, radius: 5.0 }, // 7시
  { angle:  Math.PI * 0.95, distMult: 1.18, radius: 6.6 }, // 9시 좌측
  { angle: -Math.PI * 0.82, distMult: 1.02, radius: 5.6 }, // 10시
  { angle: -Math.PI * 0.65, distMult: 0.88, radius: 4.8 }, // 11시
];

const RED_IMPACT_SPARKLES = [
  { angle: -Math.PI * 0.40, distMult: 0.70, size: 7.5 }, // 상단 별
  { angle:  Math.PI * 0.05, distMult: 0.85, size: 8.0 }, // 우측 별
  { angle:  Math.PI * 0.60, distMult: 0.65, size: 6.5 }, // 좌하단 별
];

/**
 * 💥 무릎차기 타격 임팩트 (High Jump Kick Hit Impact)
 * - ⚠️ [유저 요청]: 타격 현재거 유지하면서 이런 빨강 알갱이들이 사방으로 퍼지게 (퍼지면서 페이드아웃)
 * - 기존 섬광, 링 충격파, 8방향 스파이크, 광원 십자 빔 유지 + 3D 고광택 붉은 알갱이 비산 및 페이드아웃
 */
function drawHighJumpKickHitImpact(
  targetCtx: any,
  tx: number,
  ty: number,
  progress: number
) {
  const p = Math.max(0, Math.min(1, progress));

  // 1. 기존 타격 이펙트 (코어 섬광, 링 충격파, 8방향 스파이크, 십자 플레어 유지)
  const baseAlpha = Math.max(0, 1.0 - p * 1.35);
  if (baseAlpha > 0.02) {
    targetCtx.save();

    // 1-1. 중심 코어 충격 섬광 (부드러운 방사형 그라데이션 - 바깥 둘레 100% 투명)
    const coreRadius = 26 + p * 40;
    const coreGrad = targetCtx.createRadialGradient(tx, ty, 0, tx, ty, coreRadius);
    coreGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.95 * baseAlpha})`);
    coreGrad.addColorStop(0.25, `rgba(255, 220, 100, ${0.85 * baseAlpha})`);
    coreGrad.addColorStop(0.6, `rgba(255, 80, 20, ${0.5 * baseAlpha})`);
    coreGrad.addColorStop(1.0, `rgba(255, 50, 0, 0.0)`); // 외곽 끝부분 100% 투명

    targetCtx.fillStyle = coreGrad;
    targetCtx.beginPath();
    targetCtx.arc(tx, ty, coreRadius, 0, Math.PI * 2);
    targetCtx.fill();

    // 1-2. 동심원 충격파 링 (Shockwave Ring - 내부 및 외부 경계 모두 부드럽게 0으로 감쇄)
    const ringR = 18 + p * 54;
    const ringThickness = 14 + p * 8;
    const innerR = Math.max(0.1, ringR - ringThickness);
    const outerR = ringR + ringThickness;

    const ringGrad = targetCtx.createRadialGradient(tx, ty, innerR, tx, ty, outerR);
    ringGrad.addColorStop(0.0, `rgba(255, 120, 40, 0.0)`); // 안쪽 경계 투명
    ringGrad.addColorStop(0.35, `rgba(255, 240, 200, ${0.9 * baseAlpha})`); // 링 중심부 피크 화이트/골드
    ringGrad.addColorStop(0.7, `rgba(255, 70, 30, ${0.45 * baseAlpha})`);
    ringGrad.addColorStop(1.0, `rgba(255, 30, 10, 0.0)`); // 바깥쪽 끝부분 100% 투명

    targetCtx.fillStyle = ringGrad;
    targetCtx.beginPath();
    targetCtx.arc(tx, ty, outerR, 0, Math.PI * 2);
    targetCtx.arc(tx, ty, innerR, 0, Math.PI * 2, true);
    targetCtx.fill();

    // 1-3. 8방향 크런치 스파이크 (방사형 쐐기 - 바깥쪽 끝부분이 100% 완전 투명한 선형 그라데이션)
    const spikeCount = 8;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i * Math.PI * 2) / spikeCount + 0.35 + p * 0.15;
      const rStart = 8 + p * 16;
      const rEnd = 34 + p * 52;
      const halfWidth = 3.6 * (1.0 - p * 0.4);

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const perpX = -sinA * halfWidth;
      const perpY = cosA * halfWidth;

      const x1 = tx + cosA * rStart;
      const y1 = ty + sinA * rStart;
      const x2 = tx + cosA * rEnd;
      const y2 = ty + sinA * rEnd;

      const spikeGrad = targetCtx.createLinearGradient(x1, y1, x2, y2);
      if (i % 2 === 0) {
        spikeGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.95 * baseAlpha})`);
        spikeGrad.addColorStop(0.35, `rgba(255, 215, 60, ${0.75 * baseAlpha})`);
        spikeGrad.addColorStop(0.75, `rgba(255, 80, 20, ${0.35 * baseAlpha})`);
        spikeGrad.addColorStop(1.0, `rgba(255, 40, 0, 0.0)`); // 외곽 끝 완전 투명!
      } else {
        spikeGrad.addColorStop(0.0, `rgba(255, 230, 180, ${0.9 * baseAlpha})`);
        spikeGrad.addColorStop(0.4, `rgba(255, 90, 30, ${0.65 * baseAlpha})`);
        spikeGrad.addColorStop(1.0, `rgba(220, 20, 0, 0.0)`); // 외곽 끝 완전 투명!
      }

      targetCtx.fillStyle = spikeGrad;
      targetCtx.beginPath();
      targetCtx.moveTo(x1 + perpX, y1 + perpY);
      targetCtx.lineTo(x1 - perpX, y1 - perpY);
      targetCtx.lineTo(x2, y2);
      targetCtx.closePath();
      targetCtx.fill();
    }

    // 1-4. 광원 십자 섬광 (Cross Flare Beams - 빔의 양 끝단이 100% 완전 투명)
    const flareLen = 45 + p * 25;
    const flareThick = 4.8 * (1.0 - p * 0.5);

    const drawFlareRay = (deg: number, lenScale: number = 1.0) => {
      targetCtx.save();
      targetCtx.translate(tx, ty);
      targetCtx.rotate(deg);

      const fLen = flareLen * lenScale;
      const fThick = flareThick * lenScale;

      const beamGrad = targetCtx.createLinearGradient(-fLen, 0, fLen, 0);
      beamGrad.addColorStop(0.0, `rgba(255, 220, 100, 0.0)`); // 좌측 끝 투명
      beamGrad.addColorStop(0.25, `rgba(255, 140, 40, ${0.35 * baseAlpha})`);
      beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.95 * baseAlpha})`); // 중심 피크 백색
      beamGrad.addColorStop(0.75, `rgba(255, 140, 40, ${0.35 * baseAlpha})`);
      beamGrad.addColorStop(1.0, `rgba(255, 220, 100, 0.0)`); // 우측 끝 투명

      targetCtx.fillStyle = beamGrad;
      targetCtx.beginPath();
      targetCtx.moveTo(-fLen, 0);
      targetCtx.lineTo(0, -fThick);
      targetCtx.lineTo(fLen, 0);
      targetCtx.lineTo(0, fThick);
      targetCtx.closePath();
      targetCtx.fill();

      targetCtx.restore();
    };

    drawFlareRay(0, 1.0);
    drawFlareRay(Math.PI / 2, 1.0);
    drawFlareRay(Math.PI / 4, 0.65); // 45도 보조 빔
    drawFlareRay(-Math.PI / 4, 0.65);

    targetCtx.restore();
  }

  // 2. 🌟 사방으로 퍼지며 페이드아웃되는 붉은 알갱이들 및 스파클 (유저 요청)
  const t = Math.max(0, Math.min(1.0, p));
  const beadDistBase = 20 + Math.pow(t, 0.88) * 92; // 거리 20px -> 112px
  // t=0.30일 때 alpha=1.0, t=0.72일 때 alpha=0.45, t=0.98일 때 alpha=0.03
  const beadAlpha = Math.max(0, Math.min(1.0, (1.0 - t) * 1.45));

  if (beadAlpha > 0.02) {
    // 2-1. 붉은 충격 스파클 별 3기 비산
    for (const sp of RED_IMPACT_SPARKLES) {
      const spDist = beadDistBase * sp.distMult;
      const spX = tx + Math.cos(sp.angle) * spDist * 1.15;
      const spY = ty + Math.sin(sp.angle) * spDist * 0.90;
      drawRedImpactSparkle(targetCtx, spX, spY, sp.size * (1.0 - t * 0.2), beadAlpha * 0.9);
    }

    // 2-2. 고광택 붉은 입체 알갱이 10기 비산 (퍼지면서 페이드아웃)
    for (const bd of RED_IMPACT_BEADS) {
      const dist = beadDistBase * bd.distMult;
      const bx = tx + Math.cos(bd.angle) * dist * 1.15;
      const by = ty + Math.sin(bd.angle) * dist * 0.90;
      const r = bd.radius * (1.0 - t * 0.12);
      drawGlossyRedBead(targetCtx, bx, by, r, beadAlpha);
    }
  }
}

export function drawHighJumpKickEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const userPos = getAttackerPos(drawCtx);
  const targetPos = getTargetPos(drawCtx);

  const phaseId = frame.phaseId || "";
  const progress = frame.effectProgress ?? 0;

  // 1. 지면 도약 발진 시 바닥 먼지 퍼프 (leap-1 단계에서만 바닥에 살짝)
  if (phaseId === "hjk-leap-1") {
    drawGroundDustPuffs(targetCtx, userPos.x, userPos.y + 18, progress, 1.0 - progress);
    return;
  }

  // 2. 급강하 돌진 단계: ⚠️ 원뿔 충격파 제거됨 (시전자 후방 주황잔상은 drawHighJumpKickBehindEffect에서 렌더링)
  if (phaseId.startsWith("hjk-dive")) {
    return;
  }

  // 3. 무릎 직격 타격 폭쇄 (쾅! 크런치 임팩트)
  if (phaseId.startsWith("hjk-hit")) {
    drawHighJumpKickHitImpact(targetCtx, targetPos.x, targetPos.y, progress);
    return;
  }

  // 4. 타격 반동 공중제비 & 지면 착지
  if (phaseId.startsWith("hjk-land")) {
    drawGroundDustPuffs(targetCtx, userPos.x, userPos.y + 16, progress, 1.0 - progress);
  }
}
