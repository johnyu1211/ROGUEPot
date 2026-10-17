// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { createCanvas } from "@napi-rs/canvas";
import { drawFittedBattleSprite, getFittedBattleSpriteBounds } from "../../common/spriteLoader.js";
import { drawMiniRetroStar, drawStarburstImpact, drawStatDropEffect, drawStatBoostEffect } from "../common/helpers.js";

// ============================================================================
// 🌪️ 229: 고속스핀 (Rapid Spin / こうそくスピン) - 노말 타입 물리 기술
//
// 위력: 50 / 명중: 100 / PP: 40 / 접촉: O
// 설명: 고속으로 회전하여 상대를 공격한다. 조이기, 씨뿌리기, 압정뿌리기 등을 날려버린다.
// 부가 효과: 100% 확률로 자신의 스피드가 1랭크 상승.
// ============================================================================

export function drawRapidSpinBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  return; // 이펙트 임시 비활성화 (스프라이트 회전 집중 점검)
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const isP = drawCtx.isPlayer;
  const casterPos = drawCtx.attackerPos;
  const targetPos = drawCtx.targetPos;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;

  ctx.save();

  // Step 1: 회전 준비 - 시전자 발밑 고속 회전 먼지 및 진동 링
  if (step === 1) {
    const radius = 18 + prog * 20;
    const ringAlpha = (1.0 - prog) * 0.7;
    ctx.strokeStyle = `rgba(220, 220, 230, ${ringAlpha})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(casterPos.x, casterPos.y + 24, radius, radius * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Step 2 & 3: 돌진 및 타격 중 후방 윈드 스피드 트레일
  if (step === 2 || step === 3) {
    const curX = casterPos.x + (targetPos.x - casterPos.x) * (step === 2 ? prog * 0.85 : 0.9);
    const curY = casterPos.y + (targetPos.y - casterPos.y) * (step === 2 ? prog * 0.85 : 0.9);

    for (let i = 0; i < 3; i++) {
      const trailOffX = (i + 1) * -14 * (isP ? 1 : -1);
      const trailOffY = (i + 1) * -6;
      const tAlpha = Math.max(0, 0.45 - i * 0.12);
      ctx.strokeStyle = `rgba(240, 240, 250, ${tAlpha})`;
      ctx.lineWidth = 3 - i * 0.8;
      ctx.beginPath();
      ctx.ellipse(curX + trailOffX, curY + trailOffY + 15, 14 - i * 2, 6, 0.2 * (isP ? 1 : -1), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawRapidSpinEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  return; // 이펙트 임시 비활성화 (스프라이트 회전 집중 점검)
  if (!frame.showEffect) return;
  const isP = drawCtx.isPlayer;
  const casterPos = drawCtx.attackerPos;
  const targetPos = drawCtx.targetPos;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;

  ctx.save();

  // [Step 1: 회전 가속 (Spin Acceleration)]
  if (step === 1) {
    const rotSpeed = prog * Math.PI * 6;
    const numBlades = 4;
    const cx = casterPos.x;
    const cy = casterPos.y;

    for (let i = 0; i < numBlades; i++) {
      const angle = rotSpeed + (i * Math.PI * 2) / numBlades;
      const r = 24 + prog * 10;
      const bx = cx + Math.cos(angle) * r;
      const by = cy + Math.sin(angle) * (r * 0.45);

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + prog * 0.5})`;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle + 0.85);
      ctx.stroke();

      // 회전 팁 스파크
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // [Step 2: 회전 돌진 쇄도 (Spinning Rush)]
  if (step === 2) {
    const curX = casterPos.x + (targetPos.x - casterPos.x) * prog;
    const curY = casterPos.y + (targetPos.y - casterPos.y) * prog;
    const rot = prog * Math.PI * 10;

    // 회오리 원뿔 궤적 (Tornado cone)
    for (let r = 10; r <= 36; r += 8) {
      const a = (rot + r) % (Math.PI * 2);
      ctx.strokeStyle = `rgba(235, 245, 255, ${0.35 + (r / 36) * 0.45})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(curX, curY, r, r * 0.5, a * 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 선두 스피드 라인
    const headAngle = Math.atan2(targetPos.y - casterPos.y, targetPos.x - casterPos.x);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(curX + Math.cos(headAngle) * 35, curY + Math.sin(headAngle) * 35);
    ctx.stroke();
  }

  // [Step 3: 연속 타격 & 트랩·압정 비산 (Spin Impact & Hazard Clearing)]
  if (step === 3) {
    const tx = targetPos.x;
    const ty = targetPos.y;

    // 중심 격렬한 회전 충격파 링
    const shockRadius = 15 + prog * 45;
    const shockAlpha = Math.max(0, 1.0 - prog);
    ctx.strokeStyle = `rgba(255, 255, 255, ${shockAlpha})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(tx, ty, shockRadius, shockRadius * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 타격 스타버스트
    if (prog < 0.6) {
      drawStarburstImpact(ctx, tx, ty, "#94A3B8", "#FFFFFF", 34);
    }

    // 사방으로 튕겨 날아가는 트랩/압정 파편들 (Spikes & hazard shards clearing)
    const shardCount = 8;
    for (let i = 0; i < shardCount; i++) {
      const angle = (i * Math.PI * 2) / shardCount + prog * 1.5;
      const dist = 20 + prog * 70;
      const sx = tx + Math.cos(angle) * dist;
      const sy = ty + Math.sin(angle) * dist;
      const sAlpha = Math.max(0, 1.0 - prog * 1.1);

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle + prog * 4);
      ctx.fillStyle = i % 2 === 0 ? `rgba(200, 220, 240, ${sAlpha})` : `rgba(255, 255, 255, ${sAlpha})`;
      ctx.beginPath();
      ctx.moveTo(-5, -2);
      ctx.lineTo(6, 0);
      ctx.lineTo(-5, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // [Step 4: 스피드 상승 기류 및 착지 (Speed Boost & Settling)]
  if (step === 4) {
    const cx = casterPos.x;
    const cy = casterPos.y;

    // 스피드 부스트 상승 파티클
    for (let i = 0; i < 5; i++) {
      const pProg = (prog + i * 0.2) % 1.0;
      const py = cy + 20 - pProg * 45;
      const px = cx + Math.sin(pProg * Math.PI * 3 + i) * 16;
      const alpha = Math.sin(pProg * Math.PI) * 0.85;

      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - 10);
      ctx.stroke();

      ctx.fillStyle = `rgba(186, 230, 253, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py - 11, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ============================================================================
// 🌸 230: 달콤한향기 (Sweet Scent / あまいかおり) - 노말 타입 변화 기술
//
// 위력: — / 명중: 100 / PP: 20 / 대상: 상대 / 접촉: X
// 설명: 향기로 상대의 회피율을 크게(2랭크) 떨어뜨린다.
//
// [유저 요구사항 100% 반영]:
// > 화면페이드로 반투명 분홍과 동시에 꽃 잎이 화면 왼쪽 에서 나타나서 오른쪽ㅇ로 페이드아웃 (상대시점 반대방향)
// ============================================================================

interface SweetScentPetalConfig {
  yRatio: number;          // 화면 높이 비율 (0.08 ~ 0.92)
  spawnDelay: number;      // 등장 지연 (0.00 ~ 0.40)
  travelDuration: number;  // 횡단 시간 (0.55 ~ 0.70)
  size: number;            // 꽃잎 크기 (8 ~ 14px)
  waveFreq: number;        // 상하 살랑거림 주파수
  waveAmp: number;         // 상하 살랑거림 진폭 (10 ~ 20px)
  phase: number;           // 초기 위상 각도
  rotSpeed: number;        // 회전 속도
  colorIdx: number;        // 4색 핑크 팔레트 인덱스
  isBehind: boolean;       // true: 스프라이트 뒤편 레이어 / false: 앞편 레이어
}

// 화면 전체를 풍성하고 유기적으로 가로지르는 24개의 고유 꽃잎 데이터
const SWEET_SCENT_PETALS: SweetScentPetalConfig[] = [
  // 1차 선발대 (상단/중단/하단에서 일제히 등장 시작)
  { yRatio: 0.16, spawnDelay: 0.00, travelDuration: 0.65, size: 10, waveFreq: 1.4, waveAmp: 14, phase: 0.2, rotSpeed: 2.2, colorIdx: 0, isBehind: false },
  { yRatio: 0.38, spawnDelay: 0.02, travelDuration: 0.60, size: 12, waveFreq: 1.2, waveAmp: 16, phase: 1.1, rotSpeed: 2.8, colorIdx: 1, isBehind: false },
  { yRatio: 0.62, spawnDelay: 0.04, travelDuration: 0.68, size: 9,  waveFreq: 1.6, waveAmp: 12, phase: 2.3, rotSpeed: 2.0, colorIdx: 2, isBehind: true },
  { yRatio: 0.82, spawnDelay: 0.03, travelDuration: 0.62, size: 11, waveFreq: 1.3, waveAmp: 18, phase: 0.8, rotSpeed: 2.5, colorIdx: 3, isBehind: false },
  { yRatio: 0.26, spawnDelay: 0.06, travelDuration: 0.64, size: 8,  waveFreq: 1.5, waveAmp: 10, phase: 3.1, rotSpeed: 1.8, colorIdx: 1, isBehind: true },
  { yRatio: 0.50, spawnDelay: 0.07, travelDuration: 0.58, size: 13, waveFreq: 1.1, waveAmp: 15, phase: 1.7, rotSpeed: 3.0, colorIdx: 0, isBehind: false },

  // 2차 본류대 (화면 가득 밀려드는 주력 꽃잎 파도)
  { yRatio: 0.12, spawnDelay: 0.10, travelDuration: 0.62, size: 11, waveFreq: 1.3, waveAmp: 16, phase: 2.8, rotSpeed: 2.4, colorIdx: 2, isBehind: false },
  { yRatio: 0.32, spawnDelay: 0.12, travelDuration: 0.65, size: 12, waveFreq: 1.6, waveAmp: 14, phase: 0.5, rotSpeed: 2.6, colorIdx: 3, isBehind: false },
  { yRatio: 0.72, spawnDelay: 0.11, travelDuration: 0.60, size: 10, waveFreq: 1.4, waveAmp: 12, phase: 1.9, rotSpeed: 2.1, colorIdx: 0, isBehind: true },
  { yRatio: 0.44, spawnDelay: 0.14, travelDuration: 0.66, size: 14, waveFreq: 1.2, waveAmp: 20, phase: 3.4, rotSpeed: 3.2, colorIdx: 1, isBehind: false },
  { yRatio: 0.88, spawnDelay: 0.15, travelDuration: 0.58, size: 8,  waveFreq: 1.7, waveAmp: 10, phase: 0.9, rotSpeed: 1.9, colorIdx: 2, isBehind: false },
  { yRatio: 0.22, spawnDelay: 0.17, travelDuration: 0.63, size: 9,  waveFreq: 1.5, waveAmp: 15, phase: 2.5, rotSpeed: 2.7, colorIdx: 0, isBehind: true },

  // 3차 증류대 (풍성한 볼륨감과 여운 형성)
  { yRatio: 0.58, spawnDelay: 0.20, travelDuration: 0.64, size: 11, waveFreq: 1.4, waveAmp: 16, phase: 1.2, rotSpeed: 2.5, colorIdx: 3, isBehind: false },
  { yRatio: 0.18, spawnDelay: 0.22, travelDuration: 0.61, size: 12, waveFreq: 1.2, waveAmp: 12, phase: 3.0, rotSpeed: 2.3, colorIdx: 1, isBehind: false },
  { yRatio: 0.78, spawnDelay: 0.24, travelDuration: 0.65, size: 10, waveFreq: 1.5, waveAmp: 18, phase: 0.4, rotSpeed: 2.9, colorIdx: 2, isBehind: false },
  { yRatio: 0.36, spawnDelay: 0.25, travelDuration: 0.59, size: 13, waveFreq: 1.3, waveAmp: 14, phase: 2.1, rotSpeed: 3.1, colorIdx: 0, isBehind: true },
  { yRatio: 0.66, spawnDelay: 0.27, travelDuration: 0.62, size: 9,  waveFreq: 1.6, waveAmp: 11, phase: 1.5, rotSpeed: 1.8, colorIdx: 3, isBehind: false },
  { yRatio: 0.48, spawnDelay: 0.29, travelDuration: 0.60, size: 12, waveFreq: 1.1, waveAmp: 15, phase: 2.7, rotSpeed: 2.6, colorIdx: 1, isBehind: false },

  // 4차 후속대 (페이드아웃으로 향하는 꼬리 꽃잎들)
  { yRatio: 0.14, spawnDelay: 0.32, travelDuration: 0.60, size: 9,  waveFreq: 1.4, waveAmp: 13, phase: 0.7, rotSpeed: 2.2, colorIdx: 2, isBehind: true },
  { yRatio: 0.28, spawnDelay: 0.34, travelDuration: 0.58, size: 11, waveFreq: 1.5, waveAmp: 15, phase: 2.0, rotSpeed: 2.8, colorIdx: 0, isBehind: false },
  { yRatio: 0.54, spawnDelay: 0.35, travelDuration: 0.62, size: 10, waveFreq: 1.2, waveAmp: 12, phase: 3.2, rotSpeed: 2.1, colorIdx: 3, isBehind: false },
  { yRatio: 0.74, spawnDelay: 0.36, travelDuration: 0.59, size: 12, waveFreq: 1.3, waveAmp: 16, phase: 1.4, rotSpeed: 2.7, colorIdx: 1, isBehind: false },
  { yRatio: 0.40, spawnDelay: 0.38, travelDuration: 0.57, size: 8,  waveFreq: 1.6, waveAmp: 10, phase: 0.3, rotSpeed: 1.9, colorIdx: 2, isBehind: true },
  { yRatio: 0.64, spawnDelay: 0.40, travelDuration: 0.56, size: 11, waveFreq: 1.2, waveAmp: 14, phase: 2.4, rotSpeed: 2.4, colorIdx: 0, isBehind: false },
];

/**
 * 🌸 달콤한향기 꽃잎 하나 (256색 팔레트 최적화 & 곡선 벚꽃/장미 잎사귀)
 */
function drawSweetScentPetal(
  ctx: any,
  x: number,
  y: number,
  size: number,
  angle: number,
  tiltScaleX: number,
  colorIdx: number,
  alpha: number
) {
  if (alpha <= 0.015 || size <= 1) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(tiltScaleX, 1.0);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 4종 로맨틱 핑크 팔레트 (소프트 사쿠라, 로즈 코랄, 딥 블라썸, 플로럴 베리)
  const PALETTES = [
    { base: "#F472B6", high: "#FFE4E6", mid: "#FBCFE8", border: "#DB2777" },
    { base: "#FB7185", high: "#FECDD3", mid: "#FDA4AF", border: "#BE185D" },
    { base: "#EC4899", high: "#FDF2F8", mid: "#F472B6", border: "#9D174D" },
    { base: "#F43F5E", high: "#FFE4E6", mid: "#FB7185", border: "#881337" },
  ];
  const pal = PALETTES[colorIdx % PALETTES.length];

  // 곡선 벚꽃 꽃잎 외곽선
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.bezierCurveTo(size * 0.82, size * 0.38, size * 0.90, -size * 0.48, 0, -size);
  ctx.bezierCurveTo(-size * 0.90, -size * 0.48, -size * 0.82, size * 0.38, 0, size);
  ctx.closePath();

  // 입체 그라데이션
  const grad = ctx.createLinearGradient(0, -size, 0, size);
  grad.addColorStop(0.0, pal.high);
  grad.addColorStop(0.35, pal.mid);
  grad.addColorStop(0.75, pal.base);
  grad.addColorStop(1.0, pal.border);
  ctx.fillStyle = grad;
  ctx.fill();

  // 또렷한 테두리
  ctx.strokeStyle = pal.border;
  ctx.lineWidth = Math.max(0.65, size * 0.08);
  ctx.stroke();

  // 중앙 잎맥 하이라이트
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.65);
  ctx.lineTo(0, size * 0.40);
  ctx.strokeStyle = pal.high;
  ctx.lineWidth = Math.max(0.5, size * 0.07);
  ctx.stroke();

  ctx.restore();
}

/**
 * 🌸 화면을 가로지르는 꽃잎 기류 렌더러
 * - 플레이어 시점: 화면 왼쪽(-45) -> 오른쪽(screenW + 55)으로 이동하며 페이드아웃
 * - 상대(적) 시점: 화면 오른쪽(screenW + 45) -> 왼쪽(-55)으로 이동하며 페이드아웃
 */
function renderSweetScentPetalStream(
  ctx: any,
  globalP: number,
  isBehindLayer: boolean,
  isPlayer: boolean,
  screenW: number,
  screenH: number
) {
  for (let i = 0; i < SWEET_SCENT_PETALS.length; i++) {
    const pCfg = SWEET_SCENT_PETALS[i];
    if (pCfg.isBehind !== isBehindLayer) continue;

    // 진행도 체크 (등장 전이거나 비행 종료 시 스킵)
    if (globalP < pCfg.spawnDelay) continue;
    const localT = (globalP - pCfg.spawnDelay) / pCfg.travelDuration;
    if (localT < 0 || localT > 1.0) continue;

    const t = localT;

    // X 좌표 계산: 플레이어(좌->우) vs 상대시점(우->좌)
    let curX: number;
    if (isPlayer) {
      const startX = -45;
      const endX = screenW + 55;
      curX = startX + (endX - startX) * t;
    } else {
      const startX = screenW + 45;
      const endX = -55;
      curX = startX + (endX - startX) * t;
    }

    // Y 좌표 계산 (부드러운 살랑거림 웨이브 & 기류 하강)
    const baseY = pCfg.yRatio * screenH;
    const waveY = Math.sin(t * Math.PI * 2 * pCfg.waveFreq + pCfg.phase) * pCfg.waveAmp;
    const driftY = t * 16;
    const curY = baseY + waveY + driftY;

    // 알파 계산: 왼쪽에서 나타나서(페이드인 0.0->0.18) -> 오른쪽으로 페이드아웃(0.62->1.00)
    let alpha: number;
    if (t < 0.18) {
      alpha = t / 0.18;
    } else if (t > 0.62) {
      alpha = Math.max(0, 1.0 - (t - 0.62) / 0.38);
    } else {
      alpha = 1.0;
    }

    // 3D 회전 및 펄럭임 텀블
    const angle = isPlayer
      ? pCfg.phase + t * pCfg.rotSpeed * Math.PI
      : pCfg.phase - t * pCfg.rotSpeed * Math.PI;
    const tiltScaleX = Math.max(0.18, Math.abs(Math.cos(pCfg.phase * 1.5 + t * Math.PI * 3.5)));

    // 꽃잎 렌더링
    drawSweetScentPetal(ctx, curX, curY, pCfg.size, angle, tiltScaleX, pCfg.colorIdx, alpha);
  }
}

/**
 * 🌸 화면 반투명 분홍 페이드 (Screen Translucent Pink Fade)
 */
function drawSweetScentPinkScreenFade(ctx: any, pinkAlpha: number, screenW: number, screenH: number) {
  if (pinkAlpha <= 0.005) return;
  ctx.save();

  // 1. 전체 화면을 덮는 은은한 반투명 분홍 틴트 (Translucent Sweet Pink Filter)
  ctx.fillStyle = `rgba(244, 114, 182, ${pinkAlpha * 0.70})`;
  ctx.fillRect(-2000, -2000, 5000, 5000);

  // 2. 화면 전체를 감싸는 몽환적인 핑크 비네팅 (Atmospheric Pink Vignette)
  const radGrad = ctx.createRadialGradient(
    screenW * 0.5, screenH * 0.5, screenH * 0.22,
    screenW * 0.5, screenH * 0.5, screenW * 0.72
  );
  radGrad.addColorStop(0.0, "rgba(251, 113, 133, 0.0)");
  radGrad.addColorStop(0.65, `rgba(244, 114, 182, ${pinkAlpha * 0.25})`);
  radGrad.addColorStop(1.0, `rgba(225, 29, 72, ${pinkAlpha * 0.55})`);
  ctx.fillStyle = radGrad;
  ctx.fillRect(-2000, -2000, 5000, 5000);

  ctx.restore();
}

export function drawSweetScentBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const isP = drawCtx.isPlayer;
  const casterOffset = isP ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
  const casterPos = {
    x: drawCtx.attackerPos.x + casterOffset.x,
    y: drawCtx.attackerPos.y + casterOffset.y,
  };
  const step = frame.moveStep || 1;
  const globalP = frame.globalProgress ?? (frame.effectProgress ?? 0);
  const screenW = drawCtx.width || 560;
  const screenH = drawCtx.height || 380;

  ctx.save();

  // Step 1: 시전자 주변 부드러운 개화 핑크빛 배경 글로우
  if (step === 1) {
    const glowProg = frame.effectProgress ?? 0;
    const glowRadius = 30 + glowProg * 35;
    const glowAlpha = Math.sin(glowProg * Math.PI) * 0.40;
    const grad = ctx.createRadialGradient(casterPos.x, casterPos.y, 4, casterPos.x, casterPos.y, glowRadius);
    grad.addColorStop(0, `rgba(244, 114, 182, ${glowAlpha})`);
    grad.addColorStop(1, "rgba(244, 114, 182, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(casterPos.x, casterPos.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 배경 레이어 꽃잎 스트림 (포켓몬 스프라이트 뒤편을 통과하는 입체 꽃잎)
  renderSweetScentPetalStream(ctx, globalP, true, isP, screenW, screenH);

  ctx.restore();
}

export function drawSweetScentEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const isP = drawCtx.isPlayer;
  const casterOffset = isP ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
  const targetOffset = isP ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });
  const casterPos = {
    x: drawCtx.attackerPos.x + casterOffset.x,
    y: drawCtx.attackerPos.y + casterOffset.y,
  };
  const targetPos = {
    x: drawCtx.targetPos.x + targetOffset.x,
    y: drawCtx.targetPos.y + targetOffset.y,
  };
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const globalP = frame.globalProgress ?? prog;
  const screenW = drawCtx.width || 560;
  const screenH = drawCtx.height || 380;

  ctx.save();

  // 1. [화면 페이드: 반투명 분홍] (전 화면 핑크 필터 & 비네팅)
  const pinkAlpha = frame.pinkFadeAlpha ?? (
    step === 1 ? prog * 0.38 :
    step === 2 ? 0.38 :
    step === 3 ? 0.38 - prog * 0.18 :
    Math.max(0, 0.20 * (1 - prog))
  );
  drawSweetScentPinkScreenFade(ctx, pinkAlpha, screenW, screenH);

  // 2. [꽃잎 흩날림] 화면 왼쪽에서 나타나서 오른쪽으로 페이드아웃 (상대시점 반대방향)
  renderSweetScentPetalStream(ctx, globalP, false, isP, screenW, screenH);

  // 3. [Step 1: 개화 향기 파동 링] 시전자 주변 핑크 향기 파동
  if (step === 1) {
    const cx = casterPos.x;
    const cy = casterPos.y;
    for (let r = 0; r < 2; r++) {
      const ringProg = (prog + r * 0.4) % 1.0;
      const radius = 12 + ringProg * 35;
      const alpha = Math.sin(ringProg * Math.PI) * 0.65;
      ctx.strokeStyle = `rgba(251, 113, 133, ${alpha})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius, radius * 0.52, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 4. [Step 3: 대상을 감싸는 유혹의 달콤한 향무] (명중 시에만)
  if (step === 3 && drawCtx.isHit !== false) {
    const tx = targetPos.x;
    const ty = targetPos.y;

    // 대상 머리 위 살랑이는 핑크 향기 소용돌이
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 + prog * Math.PI * 2.5;
      const radX = 26 + Math.sin(prog * Math.PI * 2 + i) * 6;
      const radY = 14 + Math.cos(prog * Math.PI * 2 + i) * 4;
      const px = tx + Math.cos(angle) * radX;
      const py = ty + Math.sin(angle) * radY - 8;
      const alpha = Math.sin(prog * Math.PI) * 0.70;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.fillStyle = `rgba(251, 113, 133, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 미니 핑크 하트 (방심/매료 연출)
    for (let h = 0; h < 2; h++) {
      const hProg = (prog + h * 0.45) % 1.0;
      const hx = tx + (h === 0 ? -16 : 18) + Math.sin(hProg * Math.PI * 3) * 5;
      const hy = ty - 22 - hProg * 20;
      const hAlpha = Math.sin(hProg * Math.PI) * 0.85;
      const hSize = 4 + hProg * 2;

      ctx.save();
      ctx.translate(hx, hy);
      ctx.globalAlpha = hAlpha;
      ctx.fillStyle = "#F472B6";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-hSize, -hSize, -hSize * 1.5, hSize * 0.4, 0, hSize * 1.4);
      ctx.bezierCurveTo(hSize * 1.5, hSize * 0.4, hSize, -hSize, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  // 5. [Step 4: 회피율 2랭크 하락 디버프] (명중 시 대상 위치에 적용)
  if (step === 4 && drawCtx.isHit !== false && frame.statDropProgress !== undefined) {
    const debuffProg = frame.statDropProgress ?? prog;
    drawStatDropEffect(ctx, targetPos, debuffProg);
  }

  ctx.restore();
}

// ============================================================================
// ⚔️ 231: 아이언테일 (Iron Tail / アイアンテール) - 강철 타입 물리 기술
//
// 위력: 100 / 명중: 75 / PP: 15 / 접촉: O
// 설명: 단단한 꼬리로 상대를 힘껏 쳐서 공격한다. 30% 확률로 상대의 방어를 1랭크 떨어뜨린다.
//
// [커스텀 연출 기승전결 시퀀스]:
// 1. [기(起) - 단단해지기(Harden) 경화 & 강철 꼬리 에너지 충전]:
//    - 온몸이 슬레이트 그레이(강철 메탈릭) 필터로 전환 (pGreyTint)
//    - 시전자 몸체 실루엣에 100% 마스킹된 단색 순백 금속 반사 사선 스트라이프 스위프 (좌상단 -> 우하단)
//    - 시전자 우측 및 꼬리에 "칭!(Tink!)" 선명한 대칭 순백 십자선 메탈릭 반짝임 (Cross Star Sparkle)
// 2. [승(承) - 대상 포켓몬 근처 도약 & 스프라이트 수평 회전(앞면/뒷면) & 강철 꼬리 참격 전개]:
//    - 대상 포켓몬 바로 앞까지 공중 도약 쇄도
//    - 공중에서 3D 수평 회전 (등 -> 앞 -> 등 전면/후면 전환 교차)
//    - 회전하며 등을 상대에게 돌리는 순간, 눈부시게 빛나는 강철 꼬리(Iron Tail Blade) 발현
//    - 거대한 은빛 초승달 참격 호선(Metallic Crescent Slash Arc) 전개
// 3. [전(轉) - 묵직한 강철 꼬리 직격 강타 & 대격돌]:
//    - 대상 전면에 강철 꼬리 수직/대각 강타
//    - 은백색 충돌 섬광 (hitFlash) + 대형 스타버스트 충격파 + 대각선 강철 절삭선 + 지면 충격파 링 + 크롬 파편 비산
// 4. [결(結) - 원위치 복귀 착지 & 방어력 하락 디버프]:
//    - 반동을 이용해 원위치로 매끄럽게 복귀
//    - 30% 확률 상대 방어력 1랭크 하락 디버프 파티클 연계
// ============================================================================

let ironTailMaskCanvas: any = null;
let ironTailMaskCtx: any = null;
let ironTailStripeCanvas: any = null;
let ironTailStripeCtx: any = null;

function getIronTailBuffers(s: number) {
  if (!ironTailMaskCanvas || ironTailMaskCanvas.width !== s || ironTailMaskCanvas.height !== s) {
    ironTailMaskCanvas = createCanvas(s, s);
    ironTailMaskCtx = ironTailMaskCanvas.getContext("2d");
  }
  if (!ironTailStripeCanvas || ironTailStripeCanvas.width !== s || ironTailStripeCanvas.height !== s) {
    ironTailStripeCanvas = createCanvas(s, s);
    ironTailStripeCtx = ironTailStripeCanvas.getContext("2d");
  }
  return {
    maskCanvas: ironTailMaskCanvas,
    maskCtx: ironTailMaskCtx,
    stripeCanvas: ironTailStripeCanvas,
    stripeCtx: ironTailStripeCtx,
  };
}

/**
 * 단단해지기(Harden) 스타일 스프라이트 마스킹 메탈릭 사선 스트라이프
 * - 시전자 포켓몬의 스프라이트 실루엣(알파 채널)에만 정확히 100% 마스킹
 * - 좌상단 모서리에서 우하단 모서리로 완벽하게 가로지르는 사선(-42°) 단색 순백 스트라이프
 */
function drawHardenStyleMetallicStripe(
  targetCtx: any,
  sprite: any,
  cx: number,
  groundY: number,
  size: number,
  shiftRatio: number // -0.28 (좌상단) ~ +0.28 (우하단)
) {
  const bounds = getFittedBattleSpriteBounds(sprite, size);
  const actualW = bounds.drawW;
  const actualH = bounds.drawH;
  const refDim = Math.max(actualW, actualH);

  const s = Math.max(Math.ceil(size * 1.5), 256);
  const { maskCanvas, maskCtx, stripeCanvas, stripeCtx } = getIronTailBuffers(s);
  const midX = s / 2;
  const bottomY = s - 10;
  const spriteCenterY = bottomY - actualH / 2;

  maskCtx.clearRect(0, 0, s, s);
  stripeCtx.clearRect(0, 0, s, s);

  if (sprite) {
    const angle = -Math.PI * 0.23;
    const shift = shiftRatio * refDim;
    const W = Math.max(8, Math.round(refDim * 0.16));
    const H = W / 2;
    const L = refDim * 2.6;

    const W_thin = Math.max(2, Math.round(W * 0.25));
    const gap = Math.max(3, Math.round(W * 0.35));
    const thinShift = shift - H - gap - W_thin / 2;

    stripeCtx.save();
    stripeCtx.translate(midX, spriteCenterY);
    stripeCtx.rotate(angle);
    stripeCtx.fillStyle = "#FFFFFF";
    // 메인 굵은 스트라이프
    stripeCtx.fillRect(-L / 2, shift - H, L, W);
    // 좌상단 얇은 보조 스트라이프
    stripeCtx.fillRect(-L / 2, thinShift - W_thin / 2, L, W_thin);
    stripeCtx.restore();

    maskCtx.save();
    drawFittedBattleSprite(maskCtx, sprite, midX, bottomY, size);
    maskCtx.globalCompositeOperation = "source-in";
    maskCtx.drawImage(stripeCanvas, 0, 0);
    maskCtx.restore();

    targetCtx.save();
    targetCtx.drawImage(maskCanvas, cx - midX, groundY - bottomY);
    targetCtx.restore();
  } else {
    // 스프라이트가 없는 경우 타원 대체
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.ellipse(cx, groundY - actualH / 2, actualW / 2, actualH / 2, 0, 0, Math.PI * 2);
    targetCtx.clip();

    const angle = -Math.PI * 0.23;
    targetCtx.translate(cx, groundY - actualH / 2);
    targetCtx.rotate(angle);

    const shift = shiftRatio * refDim;
    const W = Math.max(8, Math.round(refDim * 0.16));
    const H = W / 2;
    const L = refDim * 2.6;

    const W_thin = Math.max(2, Math.round(W * 0.25));
    const gap = Math.max(3, Math.round(W * 0.35));
    const thinShift = shift - H - gap - W_thin / 2;

    targetCtx.fillStyle = "#FFFFFF";
    targetCtx.fillRect(-L / 2, shift - H, L, W);
    targetCtx.fillRect(-L / 2, thinShift - W_thin / 2, L, W_thin);
    targetCtx.restore();
  }
}

/**
 * 십자선 메탈릭 반짝임 (Mathematically Symmetric Single-Path Crosshair Glint)
 */
function drawCrossStarSparkle(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  color: string = "#FFFFFF"
) {
  ctx.save();
  ctx.fillStyle = color;

  const intCx = Math.round(cx);
  const intCy = Math.round(cy);
  const half = Math.round(size / 2);
  const pinch = Math.max(1.2, Math.round(size * 0.08 * 10) / 10);

  ctx.beginPath();
  ctx.moveTo(intCx, intCy - half);
  ctx.lineTo(intCx + pinch, intCy - pinch);
  ctx.lineTo(intCx + half, intCy);
  ctx.lineTo(intCx + pinch, intCy + pinch);
  ctx.lineTo(intCx, intCy + half);
  ctx.lineTo(intCx - pinch, intCy + pinch);
  ctx.lineTo(intCx - half, intCy);
  ctx.lineTo(intCx - pinch, intCy - pinch);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 십자 크롬 글린트 (Chrome Cross Glint)
 */
function drawChromeCrossGlint(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.lineTo(size, 0);
  ctx.moveTo(0, -size);
  ctx.lineTo(0, size);
  ctx.stroke();

  // 대각선 보조 글린트
  ctx.strokeStyle = "rgba(224, 242, 254, 0.7)";
  ctx.lineWidth = 1.2;
  const diag = size * 0.55;
  ctx.beginPath();
  ctx.moveTo(-diag, -diag);
  ctx.lineTo(diag, diag);
  ctx.moveTo(-diag, diag);
  ctx.lineTo(diag, -diag);
  ctx.stroke();

  // 중앙 빛망울
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(0, 0, Math.min(3.5, size * 0.25), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 공중제비 꼬리 휘두르기 호선 (Somersault Tail Swing Arc)
 * - 사용자 요청: 선 뒤쪽으로 올 때 자연스러운 투명 그라데이션 적용 (선두는 밝고 선명, 뒤쪽 트레일은 페이드아웃)
 */
function drawIronTailSwingArc(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  sweepAngle: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const numSegments = 24;
  for (let i = 0; i < numSegments; i++) {
    const t0 = i / numSegments;
    const t1 = Math.min(1.0, (i + 1.08) / numSegments); // 이음매 없는 미세 오버랩
    const a0 = startAngle + sweepAngle * t0;
    const a1 = startAngle + sweepAngle * t1;

    // 선 뒤쪽(t=0)은 0.0 (완전 투명) -> 앞쪽(t=1)으로 올수록 1.0 (선명)
    const midT = (t0 + t1) / 2;
    const segAlpha = Math.pow(midT, 1.25);
    if (segAlpha <= 0.01) continue;

    const isTip = (i === numSegments - 1);

    // 1. 외곽 은빛 아우라
    ctx.strokeStyle = `rgba(148, 163, 184, ${0.55 * segAlpha})`;
    ctx.lineWidth = 6.5;
    ctx.lineCap = isTip ? "round" : "butt";
    ctx.beginPath();
    ctx.arc(0, 0, radius, a0, a1);
    ctx.stroke();

    // 2. 중간 크롬 실버 코어
    ctx.strokeStyle = `rgba(226, 232, 240, ${0.92 * segAlpha})`;
    ctx.lineWidth = 3.8;
    ctx.lineCap = isTip ? "round" : "butt";
    ctx.beginPath();
    ctx.arc(0, 0, radius, a0, a1);
    ctx.stroke();

    // 3. 중심 백열 화이트 림 (선두 부근 집중 강조)
    if (midT > 0.25) {
      const coreAlpha = Math.min(1.0, (midT - 0.25) / 0.75);
      ctx.strokeStyle = `rgba(255, 255, 255, ${coreAlpha * segAlpha})`;
      ctx.lineWidth = 2.0;
      ctx.lineCap = isTip ? "round" : "butt";
      ctx.beginPath();
      ctx.arc(0, 0, radius, a0, a1);
      ctx.stroke();
    }
  }

  ctx.restore();
}


/**
 * 강철 격돌 대형 임팩트 버스트 (Steel Impact Burst)
 */
function drawSteelImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  prog: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const t = Math.min(1.0, prog);

  // 1. 충격파 링 (Ground shockwave ellipse)
  const ringR = 18 + t * 44;
  const ringAlpha = Math.max(0, 1.0 - t * 1.15);
  ctx.strokeStyle = `rgba(224, 242, 254, ${ringAlpha})`;
  ctx.lineWidth = 3.2 * (1.0 - t * 0.5);
  ctx.beginPath();
  ctx.ellipse(0, 8, ringR, ringR * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 중심 백열 섬광 코로나
  if (t < 0.6) {
    const coronaR = (1.0 - t / 0.6) * 34;
    const coronaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coronaR);
    coronaGrad.addColorStop(0, "#FFFFFF");
    coronaGrad.addColorStop(0.4, "rgba(224, 242, 254, 0.95)");
    coronaGrad.addColorStop(1, "rgba(148, 163, 184, 0)");
    ctx.fillStyle = coronaGrad;
    ctx.beginPath();
    ctx.arc(0, 0, coronaR, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 가로 크롬 플레어 (Horizontal Metallic Flare - 사용자 요청으로 가로선으로 전환)
  const flareL = Math.max(0, (1.0 - t) * 58);
  const flareW = 2.8;
  if (flareL > 0) {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(-flareL, 0);
    ctx.lineTo(0, -flareW);
    ctx.lineTo(flareL, 0);
    ctx.lineTo(0, flareW);
    ctx.closePath();
    ctx.fill();
  }

  // 4. 날카로운 사다리꼴 금속 파편 스파크 비산 (10개)
  const shardCount = 10;
  for (let i = 0; i < shardCount; i++) {
    const angle = (i * Math.PI * 2) / shardCount + t * 0.6;
    const dist = 14 + t * 65;
    const sx = Math.cos(angle) * dist;
    const sy = Math.sin(angle) * dist * 0.65;
    const sAlpha = Math.max(0, 1.0 - t * 1.15);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle + t * 4);
    ctx.fillStyle = i % 2 === 0 ? `rgba(255, 255, 255, ${sAlpha})` : `rgba(203, 213, 225, ${sAlpha})`;
    ctx.beginPath();
    ctx.moveTo(-3, -1.5);
    ctx.lineTo(4, 0);
    ctx.lineTo(-3, 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export function drawIronTailBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const isP = drawCtx.isPlayer;
  const casterPos = drawCtx.attackerPos;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;

  ctx.save();

  // [Step 1: 단단해지기 후방 이펙트 - 차가운 은백색 메탈릭 아우라]
  if (step === 1) {
    const glowRadius = 26 + prog * 18;
    const alpha = Math.sin(prog * Math.PI) * 0.50;
    const grad = ctx.createRadialGradient(casterPos.x, casterPos.y, 6, casterPos.x, casterPos.y, glowRadius);
    grad.addColorStop(0, `rgba(226, 232, 240, ${alpha})`);
    grad.addColorStop(0.6, `rgba(148, 163, 184, ${alpha * 0.35})`);
    grad.addColorStop(1, "rgba(100, 116, 139, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(casterPos.x, casterPos.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // [Step 2: 후방 잔상 반투명 링 완전 제거 per user request]

  ctx.restore();
}

export function drawIronTailEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const isP = drawCtx.isPlayer;
  const casterSprite = isP ? drawCtx.playerSprite : drawCtx.enemySprite;
  const casterSize = isP ? (drawCtx?.pm?.size || 140) : (drawCtx?.em?.size || 110);
  const casterPos = drawCtx.attackerPos;
  const targetPos = drawCtx.targetPos;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;

  ctx.save();

  // [Step 1: 단단해지기(Harden) 경화 - 스프라이트 마스킹 사선 스트라이프 & 순백 십자선 반짝임]
  if (step === 1) {
    const casterOffset = isP ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
    const baseGroundY = isP ? (drawCtx?.pm?.y ?? (casterPos.y + 36)) : (drawCtx?.em?.y ?? (casterPos.y + 36));
    const groundY = baseGroundY + casterOffset.y;

    // 1. 단단해지기 스타일 단색 순백 사선 스트라이프 스위프 (좌상단 -> 우하단 완주)
    const shiftRatio = -0.28 + prog * 0.56;
    drawHardenStyleMetallicStripe(ctx, casterSprite, casterPos.x, groundY, casterSize, shiftRatio);

    // 2. 단단해지기 시전 포켓몬 오른쪽 선명한 순백 십자선 반짝임 (Tink!) - 유지
    const bounds = getFittedBattleSpriteBounds(casterSprite, casterSize);
    const actualW = bounds.drawW;
    const actualH = bounds.drawH;
    const refDim = Math.max(actualW, actualH);
    const starX = Math.round(casterPos.x + actualW * 0.44 * (isP ? 1 : -1));
    const starY = Math.round((groundY - actualH) + actualH * 0.08);
    const starPulse = 0.85 + 0.35 * Math.sin(prog * Math.PI);
    const starSize = Math.max(12, Math.round(refDim * 0.15 * starPulse));
    drawCrossStarSparkle(ctx, starX, starY, starSize, "#FFFFFF");
  }

  // [Step 2: 대상 근처 도약 & 회전 (Somersault Spin)]
  if (step === 2) {
    // 사용자 요청: 이동 시 후방 괄호 호선 제거 (스프라이트 공중제비 도약 회전에 집중)
    return;
  }

  // [Step 3: 강철 격돌 - 대형 임팩트 버스트]
  if (step === 3) {
    const targetOffset = isP ? (frame?.eOffset ?? { x: 0, y: 0 }) : (frame?.pOffset ?? { x: 0, y: 0 });
    const tx = targetPos.x + targetOffset.x;
    const ty = targetPos.y + targetOffset.y;

    // 직격 시 대형 백열 코로나, 십자 크롬 플레어, 충격파 링 & 메탈릭 파편 폭발
    const burstAlpha = Math.max(0, 1.0 - prog * 0.75);
    drawSteelImpactBurst(ctx, tx, ty - 6, prog, burstAlpha);
  }

  // [Step 4: 착지 & 방어력 하락 잔상]
  if (step === 4) {
    drawStatDropEffect(ctx, targetPos, prog);
  }

  ctx.restore();
}

// ============================================================================
// 🐾 232: 메탈클로 (Metal Claw / メタルクロー) - 강철 타입 물리 기술
//
// 위력: 50 / 명중: 95 / PP: 35 / 접촉: O
// 설명: 강철의 발톱으로 상대를 베어 갈라 공격한다. 10% 확률로 자신의 공격이 1랭크 올라간다.
// 연출 흐름: 단단해지기(Harden) 경화 애니메이션 실행 후 3단 금속할퀴기(Metallic Claw) 참격
// ============================================================================

/**
 * ⚔️ 금속할퀴기 단일 발톱 블레이드 (Single Metallic Claw Blade)
 * - 묵직한 크롬 스틸 테두리 베벨 + 입체 실버 그라데이션 바디 + 면도날 순백 절삭 코어 + 관통 침선
 */
export function drawSingleMetallicClawBlade(
  ctx: any,
  halfL: number,
  thickness: number = 6,
  curve: number = -2.5,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || halfL <= 0) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 1. 외곽 회색 반투명 보강 영역 (클로 자국과 동일한 첨두 유선형 블레이드 형상 및 넉넉한 크기)
  const auraThick = thickness * 2.3;
  const auraHalfL = halfL * 1.25;
  ctx.fillStyle = "rgba(71, 85, 105, 0.65)"; // 시인성 높은 또렷한 회색 반투명
  ctx.beginPath();
  ctx.moveTo(-auraHalfL, 0);
  ctx.quadraticCurveTo(0, -auraThick + curve, auraHalfL, 0);
  ctx.quadraticCurveTo(0, auraThick + curve, -auraHalfL, 0);
  ctx.closePath();
  ctx.fill();

  // 2. 외곽 메탈릭 크롬/순백 클로 바디 (Gleaming Chrome Silver & White Outer Claw)
  const grad = ctx.createLinearGradient(0, -thickness + curve, 0, thickness + curve);
  grad.addColorStop(0.0, "#E2E8F0");
  grad.addColorStop(0.30, "#FFFFFF");
  grad.addColorStop(0.70, "#CBD5E1");
  grad.addColorStop(1.0, "#94A3B8");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-halfL, 0);
  ctx.quadraticCurveTo(0, -thickness + curve, halfL, 0);
  ctx.quadraticCurveTo(0, thickness + curve, -halfL, 0);
  ctx.closePath();
  ctx.fill();

  // 3. 클로 중간에 클로 모양으로 클로보다 살짝 작은 검정색 코어 (Black Inner Claw Core)
  const blackThick = thickness * 0.68;
  const blackHalfL = halfL * 0.84;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(-blackHalfL, 0);
  ctx.quadraticCurveTo(0, -blackThick + curve * 0.85, blackHalfL, 0);
  ctx.quadraticCurveTo(0, blackThick + curve * 0.85, -blackHalfL, 0);
  ctx.closePath();
  ctx.fill();

  // 4. 첨단 초고속 메탈릭 관통 침선 (Speed Needle Glint)
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(halfL * 0.65, curve * 0.5);
  ctx.lineTo(halfL + 12, curve);
  ctx.stroke();

  ctx.restore();
}

/**
 * 🐾 3줄기 금속할퀴기(Metallic Scratch) 클러스터 및 마찰 스파크 비산
 */
export function drawMetallicClawSlashCluster(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  prog: number,
  isPlayer: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // 절삭 진행도에 따른 전개 및 슬라이드
  // prog 0.0 ~ 0.35: 급격한 발톱 확장 절삭
  // prog 0.35 ~ 0.65: 최대 길이 참격 직격 & 슬라이드
  // prog 0.65 ~ 1.00: 페이드아웃
  const cutProg = Math.min(1.0, prog * 1.5);
  const slideT = Math.max(0, prog - 0.25) / 0.75;
  const slideX = slideT * 12;
  const slideY = slideT * 4;

  let alpha = 1.0;
  if (prog < 0.2) {
    alpha = prog / 0.2;
  } else if (prog > 0.65) {
    alpha = Math.max(0, 1.0 - (prog - 0.65) / 0.35);
  }

  ctx.translate(slideX, slideY);

  // 3단 발톱: 중앙 발톱이 가장 길고(halfL ~ 44), 상하 발톱(halfL ~ 35) 약간 후퇴 정렬
  const spacing = 16;
  const tracks = [
    { localY: -spacing, staggerX: -6, halfL: 35 * cutProg, thick: 5.2, curve: -2.5 },
    { localY: 0,        staggerX: 4,  halfL: 45 * cutProg, thick: 6.2, curve: -2.0 },
    { localY: spacing,  staggerX: -6, halfL: 35 * cutProg, thick: 5.2, curve: -2.5 },
  ];

  for (const t of tracks) {
    ctx.save();
    ctx.translate(t.staggerX, t.localY);
    drawSingleMetallicClawBlade(ctx, t.halfL, t.thick, t.curve, alpha);
    ctx.restore();
  }

  // 금속 절삭 마찰 스파크 비산 (8개 사방 튀는 금속 스파크)
  if (prog >= 0.15 && prog <= 0.85) {
    const sparkT = (prog - 0.15) / 0.7;
    const sparkAlpha = Math.max(0, 1.0 - sparkT * 1.2) * alpha;

    const sparkAngles = [-0.8, -0.4, -0.1, 0.3, 0.7, 1.1, 2.2, 2.8];
    for (let i = 0; i < sparkAngles.length; i++) {
      const spAngle = sparkAngles[i];
      const spDist = 12 + sparkT * (35 + (i % 3) * 15);
      const sx = Math.cos(spAngle) * spDist;
      const sy = Math.sin(spAngle) * spDist * 0.8;
      const sLen = Math.max(2, 6 * (1.0 - sparkT));

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(spAngle);
      ctx.strokeStyle = i % 2 === 0 ? `rgba(255, 255, 255, ${sparkAlpha})` : `rgba(226, 232, 240, ${sparkAlpha})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-sLen, 0);
      ctx.lineTo(sLen, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
}

export function drawMetalClawBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const isP = drawCtx.isPlayer;
  const casterPos = drawCtx.attackerPos;
  const targetPos = drawCtx.targetPos;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;

  ctx.save();

  // [Step 1: 단단해지기 후방 이펙트 - 차가운 은백색 메탈릭 아우라]
  if (step === 1) {
    const glowRadius = 28 + prog * 18;
    const alpha = Math.sin(prog * Math.PI) * 0.50;
    const grad = ctx.createRadialGradient(casterPos.x, casterPos.y, 6, casterPos.x, casterPos.y, glowRadius);
    grad.addColorStop(0, `rgba(226, 232, 240, ${alpha})`);
    grad.addColorStop(0.6, `rgba(148, 163, 184, ${alpha * 0.35})`);
    grad.addColorStop(1, "rgba(100, 116, 139, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(casterPos.x, casterPos.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // [Step 3: 타격 직격 시 후방 충격파 링]
  if (step === 3) {
    const targetOffset = isP ? (frame?.eOffset ?? { x: 0, y: 0 }) : (frame?.pOffset ?? { x: 0, y: 0 });
    const tx = targetPos.x + targetOffset.x;
    const ty = targetPos.y + targetOffset.y;
    const ringR = 14 + prog * 36;
    const ringAlpha = Math.max(0, (1.0 - prog * 1.2) * 0.45);
    ctx.strokeStyle = `rgba(224, 242, 254, ${ringAlpha})`;
    ctx.lineWidth = 2.4 * (1.0 - prog * 0.5);
    ctx.beginPath();
    ctx.ellipse(tx, ty + 12, ringR, ringR * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawMetalClawEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const isP = drawCtx.isPlayer;
  const casterSprite = isP ? drawCtx.playerSprite : drawCtx.enemySprite;
  const casterSize = isP ? (drawCtx?.pm?.size || 140) : (drawCtx?.em?.size || 110);
  const casterPos = drawCtx.attackerPos;
  const targetPos = drawCtx.targetPos;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;

  ctx.save();

  // [Step 1: 단단해지기(Harden) 경화 - 스프라이트 마스킹 사선 스트라이프 & 순백 십자선 반짝임]
  if (step === 1) {
    const casterOffset = isP ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
    const baseGroundY = isP ? (drawCtx?.pm?.y ?? (casterPos.y + 36)) : (drawCtx?.em?.y ?? (casterPos.y + 36));
    const groundY = baseGroundY + casterOffset.y;

    // 1. 단단해지기 스타일 단색 순백 사선 스트라이프 스위프 (좌상단 -> 우하단 완주)
    const shiftRatio = -0.28 + prog * 0.56;
    drawHardenStyleMetallicStripe(ctx, casterSprite, casterPos.x, groundY, casterSize, shiftRatio);

    // 2. 발톱 부분의 선명한 순백 십자선 반짝임 (Tink!)
    const bounds = getFittedBattleSpriteBounds(casterSprite, casterSize);
    const actualW = bounds.drawW;
    const actualH = bounds.drawH;
    const refDim = Math.max(actualW, actualH);
    const starX = Math.round(casterPos.x + actualW * 0.44 * (isP ? 1 : -1));
    const starY = Math.round((groundY - actualH) + actualH * 0.12);
    const starPulse = 0.85 + 0.35 * Math.sin(prog * Math.PI);
    const starSize = Math.max(12, Math.round(refDim * 0.16 * starPulse));
    drawCrossStarSparkle(ctx, starX, starY, starSize, "#FFFFFF");
  }

  // [Step 2: 전방 고속 쇄도 & 발톱 조준 (Claw Dash)]
  if (step === 2) {
    // 사용자 요청: 이동 시 후방 직선 3줄기 제거 (스프라이트 전방 고속 도약에 집중)
    return;
  }

  // [Step 3: 3연속 대각선 금속할퀴기(Metallic Claw) 참격 절삭 및 스파크]
  if (step === 3) {
    const targetOffset = isP ? (frame?.eOffset ?? { x: 0, y: 0 }) : (frame?.pOffset ?? { x: 0, y: 0 });
    const tx = targetPos.x + targetOffset.x;
    const ty = targetPos.y + targetOffset.y - 14;

    // 대각선 할퀴기 각도: 포켓몬 공식 규격 정통 하향 사선 절삭 각도 (우상단 -> 좌하단 시원하게 내리베기)
    const angle = (3 * Math.PI) / 4 - 0.15;

    drawMetallicClawSlashCluster(ctx, tx, ty, angle, prog, isP);
  }

  // [Step 4: 반동 복귀 & 공격력 상승 오라 (Attack Rise Aura)]
  if (step === 4) {
    const statProg = Math.max(0.01, Math.min(0.99, prog));
    drawStatBoostEffect(ctx, casterPos, statProg);
  }

  ctx.restore();
}
