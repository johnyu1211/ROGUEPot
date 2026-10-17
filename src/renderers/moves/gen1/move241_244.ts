// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar, drawStarburstImpact, drawStatBoostEffect } from "../common/helpers.js";
import { drawBiteUpperJaw, drawBiteLowerJaw } from "./move041_044.js";

// ============================================================================
// ☀️ 241: 쾌청 (Sunny Day / にほんばれ) - 불꽃 타입 변화 기술 (날씨)
//
// 위력: — / 명중: — / PP: 5 / 5턴간 맑음 날씨 조성
// 설명: 5턴 동안 햇살을 강하게 해서 불꽃타입 기술의 위력을 올린다. (물 0.5배, 불꽃 1.5배)
//
// [아침햇살 참고 - 노란 햇빛 색상 연출]:
// 1. 화면 전체 노란 햇빛 필터 25% (Yellow Sunlight Filter)
// 2. 빛줄기 여러 갈래 (노란 햇빛 색):
//    - 왼쪽 상단(Top-Left)에서 시작
//    - 왼쪽 상단에 가까운 부분은 노란 햇빛 색 50%
//    - 바깥쪽, 우측 아래(Bottom-Right)로 내려올수록 투명해지게 (그라데이션 소산)
// 3. 왼쪽 상단 발원지 온화한 노란 햇빛 방사 코로나
// ============================================================================

export function drawSunnyDayBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 전면 레이어(drawSunnyDayEffect)에서 화면 전체 필터 및 사선 광선을 일괄 합성
}

export function drawSunnyDayEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const prog = frame.effectProgress ?? 0;

  // 1. 현재 카메라 변환 매트릭스로부터 뷰포트의 화면 모서리(월드 좌표) 계산
  const logicalW = drawCtx.width || 512;
  const logicalH = drawCtx.height || 384;

  let tl = { x: 0, y: 0 };
  let br = { x: logicalW, y: logicalH };

  try {
    const m = ctx.getTransform();
    const det = m.a * m.d - m.b * m.c;
    if (det && Math.abs(det) > 1e-6) {
      tl = {
        x: (m.d * (0 - m.e) - m.c * (0 - m.f)) / det,
        y: (m.a * (0 - m.f) - m.b * (0 - m.e)) / det,
      };
      const canvasW = ctx.canvas?.width || logicalW;
      const canvasH = ctx.canvas?.height || logicalH;
      br = {
        x: (m.d * (canvasW - m.e) - m.c * (canvasH - m.f)) / det,
        y: (m.a * (canvasH - m.f) - m.b * (canvasW - m.e)) / det,
      };
    }
  } catch {
    tl = { x: -30, y: -20 };
    br = { x: logicalW + 30, y: logicalH + 20 };
  }

  const vw = Math.max(100, br.x - tl.x);
  const vh = Math.max(100, br.y - tl.y);

  // 부드러운 페이드인/페이드아웃 엔벨로프
  let animAlpha = 1.0;
  if (prog < 0.20) {
    animAlpha = Math.sin((prog / 0.20) * (Math.PI / 2));
  } else if (prog > 0.80) {
    animAlpha = Math.sin(((1.0 - prog) / 0.20) * (Math.PI / 2));
  }
  if (animAlpha <= 0.005) return;

  ctx.save();

  // --------------------------------------------------------------------------
  // 1. 화면에 노란 햇빛 색깔 필터 25% (25% Yellow Sunlight Screen Overlay Filter)
  // --------------------------------------------------------------------------
  const filterAlpha = 0.25 * animAlpha;
  ctx.fillStyle = `rgba(254, 240, 138, ${filterAlpha})`;
  ctx.fillRect(tl.x - 200, tl.y - 200, vw + 400, vh + 400);

  // --------------------------------------------------------------------------
  // 2. 빛줄기 여러 갈래 (Multiple Crepuscular Rays from Top-Left to Bottom-Right)
  //    - 시작점: 왼쪽 상단 (Top-Left)
  //    - 왼쪽 상단에 가까운 부분: 노란 햇빛 색깔 50%
  //    - 우측 아래로 내려올수록 투명해지게 (그라데이션 소산)
  // --------------------------------------------------------------------------
  const originX = tl.x - vw * 0.03;
  const originY = tl.y - vh * 0.03;

  const baseAngle = Math.atan2(vh, vw); // 대각선 사선 기준각 (~37도)
  const maxDist = Math.hypot(vw, vh) * 1.45; // 화면 전체를 관통하는 충분한 거리

  // 5갈래의 굵고 웅장한 사선 빛줄기 (두께 대폭 강화)
  const rays = [
    { angleOffset: -0.22, spread: 0.13, alpha: 0.88 },
    { angleOffset: -0.11, spread: 0.16, alpha: 1.00 },
    { angleOffset:  0.00, spread: 0.17, alpha: 1.00 },
    { angleOffset:  0.12, spread: 0.15, alpha: 0.95 },
    { angleOffset:  0.23, spread: 0.13, alpha: 0.85 },
  ];

  // 프레임 진행에 따른 자연스러운 미세 광선 시머(Shimmer)
  const shimmer = Math.sin(prog * Math.PI * 2) * 0.010;

  for (let i = 0; i < rays.length; i++) {
    const ray = rays[i];
    const aCenter = baseAngle + ray.angleOffset + shimmer * (i % 2 === 0 ? 1 : -1);
    const halfSpread = ray.spread * 0.5;
    const a1 = aCenter - halfSpread;
    const a2 = aCenter + halfSpread;

    // 1) 굵직한 메인 노란 햇빛 광선 빔 (Main Broad Yellow Beam)
    const nearR = 10;
    const nx1 = originX + Math.cos(a1) * nearR;
    const ny1 = originY + Math.sin(a1) * nearR;
    const nx2 = originX + Math.cos(a2) * nearR;
    const ny2 = originY + Math.sin(a2) * nearR;

    const fx1 = originX + Math.cos(a1) * maxDist;
    const fy1 = originY + Math.sin(a1) * maxDist;
    const fx2 = originX + Math.cos(a2) * maxDist;
    const fy2 = originY + Math.sin(a2) * maxDist;

    const midFarX = (fx1 + fx2) * 0.5;
    const midFarY = (fy1 + fy2) * 0.5;

    // 선형 그라데이션: 좌상단(50% 노란 햇빛) ➔ 우하단(0% 투명)
    const grad = ctx.createLinearGradient(originX, originY, midFarX, midFarY);
    const peakAlpha = 0.50 * animAlpha * ray.alpha;

    grad.addColorStop(0.00, `rgba(254, 240, 138, ${peakAlpha})`);
    grad.addColorStop(0.20, `rgba(253, 224, 71, ${peakAlpha * 0.82})`);
    grad.addColorStop(0.48, `rgba(250, 204, 21, ${peakAlpha * 0.46})`);
    grad.addColorStop(0.78, `rgba(253, 224, 71, ${peakAlpha * 0.15})`);
    grad.addColorStop(1.00, "rgba(253, 224, 71, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(nx1, ny1);
    ctx.lineTo(fx1, fy1);
    ctx.lineTo(fx2, fy2);
    ctx.lineTo(nx2, ny2);
    ctx.closePath();
    ctx.fill();

    // 2) 광선 중심부 농도 보강 코어 빔 (Dense Center Core for Radiant Presence)
    const coreSpread = halfSpread * 0.50;
    const ca1 = aCenter - coreSpread;
    const ca2 = aCenter + coreSpread;

    const cnx1 = originX + Math.cos(ca1) * nearR;
    const cny1 = originY + Math.sin(ca1) * nearR;
    const cnx2 = originX + Math.cos(ca2) * nearR;
    const cny2 = originY + Math.sin(ca2) * nearR;

    const cfx1 = originX + Math.cos(ca1) * maxDist;
    const cfy1 = originY + Math.sin(ca1) * maxDist;
    const cfx2 = originX + Math.cos(ca2) * maxDist;
    const cfy2 = originY + Math.sin(ca2) * maxDist;

    const coreMidFarX = (cfx1 + cfx2) * 0.5;
    const coreMidFarY = (cfy1 + cfy2) * 0.5;

    const coreGrad = ctx.createLinearGradient(originX, originY, coreMidFarX, coreMidFarY);
    const corePeak = 0.22 * animAlpha * ray.alpha;

    coreGrad.addColorStop(0.00, `rgba(255, 255, 230, ${corePeak})`);
    coreGrad.addColorStop(0.22, `rgba(254, 240, 138, ${corePeak * 0.78})`);
    coreGrad.addColorStop(0.52, `rgba(253, 224, 71, ${corePeak * 0.35})`);
    coreGrad.addColorStop(1.00, "rgba(253, 224, 71, 0.0)");

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(cnx1, cny1);
    ctx.lineTo(cfx1, cfy1);
    ctx.lineTo(cfx2, cfy2);
    ctx.lineTo(cnx2, cny2);
    ctx.closePath();
    ctx.fill();
  }

  // --------------------------------------------------------------------------
  // 3. 왼쪽 상단 발원지 온화한 노란 햇빛 방사 코로나 (Top-Left Sun Corona)
  //    - 좌상단 50% 노란 햇빛 광원을 자연스럽게 감싸는 소프트 방사 그라데이션
  // --------------------------------------------------------------------------
  const coronaR = Math.min(vw, vh) * 0.50;
  const coronaGrad = ctx.createRadialGradient(originX, originY, 0, originX, originY, coronaR);
  const coronaPeak = 0.50 * animAlpha;
  coronaGrad.addColorStop(0.00, `rgba(255, 255, 225, ${coronaPeak})`);
  coronaGrad.addColorStop(0.25, `rgba(254, 240, 138, ${coronaPeak * 0.65})`);
  coronaGrad.addColorStop(0.60, `rgba(253, 224, 71, ${coronaPeak * 0.22})`);
  coronaGrad.addColorStop(1.00, "rgba(253, 224, 71, 0.0)");

  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(originX, originY, coronaR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ============================================================================
// 🦷 242: 깨물어부수기 (Crunch / かみくだく) - 악 타입 물리 기술
// 위력: 80 / 명중: 100 / PP: 15 / 20% 방어 1랭크 하락 / 접촉
// 설명: 날카로운 이빨로 상대를 깨물어 부숴서 공격한다. 상대의 방어를 떨어뜨릴 때가 있다.
// 연출 (유저 요청 100% 반영):
// - 물기(Bite)에서 사용하던 상하 턱 이빨(drawBiteUpperJaw, drawBiteLowerJaw) 100% 재사용
// - 화면 전체 암전 효과 (Blackout / Dark Fade & 심연 비네트 오라)
// - 콰직 깨물었을 때 순백색 돌조각(White Faceted Stone Shards)들이 깨지듯 사방으로 폭발 비산
// ============================================================================

/**
 * Helper: 3D 볼륨 입체 흰색 돌조각/바위 파편 (White Faceted Rock Shard)
 * - 불규칙한 5~7각 다각형 지오메트리 & 비대칭 종횡비
 * - 각 면(facet)별 입체 명암 (순백색 #FFFFFF, 밝은 회백색 #F8FAFC / #E2E8F0, 그림자 #CBD5E1 / #94A3B8)
 * - 또렷한 다크 슬레이트(#1E293B) 외곽선 및 내부 능선 분할선
 */
function drawWhiteRockPiece(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  angle: number,
  seed: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0.8) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 파편마다 불규칙한 정점 수 (5각, 6각, 7각)
  const numVerts = 5 + Math.floor(((seed * 7.9) % 100) / 34); // 5 ~ 7
  // 파편마다 제각각인 종횡비 (납작하거나 날카롭거나 둥글거나: 0.65 ~ 1.15)
  const aspectY = 0.65 + (((seed * 13.7) % 100) / 100) * 0.50;

  const verts: { x: number; y: number }[] = [];
  for (let i = 0; i < numVerts; i++) {
    // 균등 분할에 지그재그 각도 노이즈 추가
    const aNoise = ((((seed * 31.1 + i * 43.7) % 100) / 100) - 0.5) * (Math.PI / numVerts) * 0.6;
    const a = (i * Math.PI * 2) / numVerts + aNoise;

    // 정점별 큰 반경 편차 (0.55 ~ 1.25)로 깨진 돌의 비대칭 단면 연출
    const varFactor = 0.55 + (((seed * 19.3 + i * 37.1) % 100) / 100) * 0.70;
    const r = (size * 0.5) * varFactor;
    verts.push({
      x: Math.cos(a) * r,
      y: Math.sin(a) * r * aspectY,
    });
  }

  // 1. 기본 베이스 채우기
  ctx.beginPath();
  ctx.moveTo(verts[0].x, verts[0].y);
  for (let i = 1; i < numVerts; i++) {
    ctx.lineTo(verts[i].x, verts[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = "#E2E8F0";
  ctx.fill();

  // 2. 중심(오프셋 중심점)에서 각 정점으로 향하는 입체 패싯(삼각면) 채색
  // 좌상단 앞쪽 광원(-0.75 PI)
  const centerOffX = size * 0.12 * Math.cos(seed);
  const centerOffY = size * 0.12 * Math.sin(seed);

  for (let i = 0; i < numVerts; i++) {
    const nextIdx = (i + 1) % numVerts;
    const v1 = verts[i];
    const v2 = verts[nextIdx];

    const midX = (v1.x + v2.x) * 0.5 - centerOffX;
    const midY = (v1.y + v2.y) * 0.5 - centerOffY;
    const faceAngle = Math.atan2(midY, midX);

    const lightDiff = Math.abs(Math.atan2(Math.sin(faceAngle - (-Math.PI * 0.75)), Math.cos(faceAngle - (-Math.PI * 0.75))));
    const lightFactor = 1.0 - (lightDiff / Math.PI);

    let facetColor = "#CBD5E1";
    if (lightFactor > 0.70) {
      facetColor = "#FFFFFF"; // 눈부신 순백 하이라이트 면
    } else if (lightFactor > 0.45) {
      facetColor = "#F8FAFC"; // 밝은 순백/아이보리 면
    } else if (lightFactor > 0.25) {
      facetColor = "#E2E8F0"; // 부드러운 밝은 회백색 면
    } else if (lightFactor > 0.12) {
      facetColor = "#CBD5E1"; // 측면 음영
    } else {
      facetColor = "#94A3B8"; // 하단 짙은 돌 그림자 면
    }

    ctx.fillStyle = facetColor;
    ctx.beginPath();
    ctx.moveTo(centerOffX, centerOffY);
    ctx.lineTo(v1.x, v1.y);
    ctx.lineTo(v2.x, v2.y);
    ctx.closePath();
    ctx.fill();

    // 면 분할 능선(Ridge line)
    ctx.strokeStyle = "rgba(100, 116, 139, 0.40)";
    ctx.lineWidth = Math.max(0.6, size * 0.05);
    ctx.beginPath();
    ctx.moveTo(centerOffX, centerOffY);
    ctx.lineTo(v1.x, v1.y);
    ctx.stroke();
  }

  // 3. 또렷하고 날카로운 다크 슬레이트 외곽 윤곽선
  ctx.beginPath();
  ctx.moveTo(verts[0].x, verts[0].y);
  for (let i = 1; i < numVerts; i++) {
    ctx.lineTo(verts[i].x, verts[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = Math.max(0.9, size * 0.075);
  ctx.lineJoin = "miter";
  ctx.stroke();

  // 4. 모서리 글린트 (가장 밝은 하이라이트 꼭짓점에 반짝이는 순백점)
  if (size >= 5) {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(verts[0].x * 0.85, verts[0].y * 0.85, Math.max(0.7, size * 0.06), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawCrunchBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const targetPos = drawCtx.targetPos;

  // Step 1 & 2: 암전과 어우러지는 상대 배후 짙은 암흑의 심연 비네트 오라
  if (step === 1 || step === 2) {
    ctx.save();
    const alpha = step === 1 ? 0.35 + prog * 0.35 : 0.70;
    const grad = ctx.createRadialGradient(targetPos.x, targetPos.y, 8, targetPos.x, targetPos.y, 110);
    grad.addColorStop(0, `rgba(15, 7, 25, ${alpha * 0.85})`);
    grad.addColorStop(0.45, `rgba(30, 10, 48, ${alpha * 0.55})`);
    grad.addColorStop(0.8, `rgba(59, 7, 100, ${alpha * 0.25})`);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(targetPos.x, targetPos.y, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (step === 3) {
    // Step 3: 깨지는 순간 후방에서 폭발하는 짙은 암흑 다크 펄스
    ctx.save();
    const alpha = Math.max(0, (1 - prog) * 0.65);
    const r = 20 + prog * 85;
    const grad = ctx.createRadialGradient(targetPos.x, targetPos.y, 5, targetPos.x, targetPos.y, r);
    grad.addColorStop(0, `rgba(20, 10, 30, ${alpha * 0.9})`);
    grad.addColorStop(0.6, `rgba(58, 12, 85, ${alpha * 0.4})`);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(targetPos.x, targetPos.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawCrunchEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const targetPos = drawCtx.targetPos;
  const tx = targetPos.x;
  const ty = targetPos.y;

  ctx.save();

  // [Step 1: 암전 속에서 물기 상하 턱 이빨 출현 & 턱 벌어짐 (부가 잡선 없음)]
  if (step === 1) {
    // 턱 간격: 50px에서 서서히 조준되며 42px로 살짝 좁혀짐
    const gap = 50 - prog * 8;
    const jawAlpha = 0.70 + prog * 0.30;
    const jawScale = 1.18; // 물기(1.0)보다 위압감 있는 1.18배 스케일

    // 물기(Bite)에서 사용하던 상하 턱 이빨 순수 렌더링
    drawBiteUpperJaw(ctx, tx, ty - gap, jawScale, jawAlpha);
    drawBiteLowerJaw(ctx, tx, ty + gap, jawScale, jawAlpha);
  }

  // [Step 2: 콰직! 전광석화로 상대 중심을 향해 맞물리며 닫힘 (뒤에 오는 직선/이동선 일체 제거)]
  else if (step === 2) {
    // 고속 닫힘 가속 곡선 (easeIn)
    const t = Math.pow(prog, 1.5);
    const gap = 42 * (1 - t) - 2 * t; // 42px -> -2px(완전 교합)
    const jawScale = 1.18 + prog * 0.04; // 닫히며 1.22로 묵직하게 전진

    // 물기 상하 턱 이빨 순수 교합 (뒤에 오는 직선/이동선 일체 제거)
    drawBiteUpperJaw(ctx, tx, ty - gap, jawScale, 1.0);
    drawBiteLowerJaw(ctx, tx, ty + gap, jawScale, 1.0);
  }

  // [Step 3: 완전 교합 & 콰직! 흰색 돌조각들이 깨지듯 사방으로 폭발 비산 타격]
  else if (step === 3) {
    // 1. 깨무는 순간(초반) 쾅 맞물린 뒤 즉시 돌조각 비산으로 전환
    const jawAlpha = prog < 0.12 ? Math.max(0, 1.0 - prog / 0.12) : 0;
    if (jawAlpha > 0.01) {
      drawBiteUpperJaw(ctx, tx, ty - 2, 1.22, jawAlpha);
      drawBiteLowerJaw(ctx, tx, ty + 2, 1.22, jawAlpha);
    }

    // 2. 중심부 순백 타격 플래시 (링 제거: 테두리 선 없이 부드러운 섬광만)
    if (prog < 0.4) {
      const flashAlpha = Math.max(0, 1.0 - prog * 2.5);
      const flashGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 38 * (1 + prog * 0.8));
      flashGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.9 * flashAlpha})`);
      flashGrad.addColorStop(0.4, `rgba(226, 232, 240, ${0.45 * flashAlpha})`);
      flashGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(tx, ty, 38 * (1 + prog * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. ★ [유저 요청 완벽 반영]: 가장 큰 파편 크기 축소 (11~15px) & 크기/궤적/형상 불규칙성 극대화
    // 3개 계층 총 40여개의 다채로운 입체 흰색 돌조각 파편

    // A. 대형 흰색 돌조각 (9개) - 기존 17~23px에서 11~15px로 작게 축소 + 불규칙한 크기/비산 분산
    const largeCount = 9;
    for (let i = 0; i < largeCount; i++) {
      const seed = i * 23.7 + 11.2;
      // 불규칙 각도 지터 (완전 균등 분할 탈피)
      const aJitter = ((((seed * 13.9) % 100) / 100) - 0.5) * 0.50;
      const baseA = (i * Math.PI * 2) / largeCount + aJitter + 0.18;

      // 불규칙 비산 거리 (파편마다 튀어나가는 거리와 가속도가 다름)
      const distMul = 0.75 + (((seed * 31.3) % 100) / 100) * 0.55;
      const speedDist = (12 + Math.pow(prog, 0.65) * 82) * distMul;
      const gravityY = prog * prog * (16 + ((seed % 4) * 5));

      const px = tx + Math.cos(baseA) * speedDist;
      const py = ty + Math.sin(baseA) * (speedDist * 0.85) + gravityY;

      // ★ [유저 요청 핵심]: 가장 큰 파편 크기를 기존 17~23px에서 11.0 ~ 15.0px로 아담하게 축소 + 제각각 불규칙한 크기
      const size = 11.0 + (((seed * 41.7) % 100) / 100) * 4.0; // 11.0 ~ 15.0px
      const spinSpeed = 2.8 + (((seed * 17.1) % 100) / 100) * 4.2;
      const rot = baseA + prog * spinSpeed * (i % 2 === 0 ? 1 : -1);
      const shardAlpha = Math.min(1.0, (1.0 - prog * 0.95) * 1.15);

      drawWhiteRockPiece(ctx, px, py, size, rot, seed, shardAlpha);
    }

    // B. 중형 흰색 돌조각 (13개) - 6.0 ~ 9.5px 사이의 불규칙한 중간 파편들
    const medCount = 13;
    for (let i = 0; i < medCount; i++) {
      const seed = i * 37.1 + 5.7;
      const aJitter = ((((seed * 19.3) % 100) / 100) - 0.5) * 0.60;
      const baseA = (i * Math.PI * 2) / medCount + aJitter + 0.38;

      const distMul = 0.70 + (((seed * 29.7) % 100) / 100) * 0.60;
      const speedDist = (16 + Math.pow(prog, 0.58) * 118) * distMul;
      const gravityY = prog * prog * (22 + ((seed % 5) * 6));

      const px = tx + Math.cos(baseA) * speedDist;
      const py = ty + Math.sin(baseA) * (speedDist * 0.82) + gravityY;

      // 불규칙 크기 (6.0 ~ 9.5px)
      const size = 6.0 + (((seed * 23.3) % 100) / 100) * 3.5;
      const spinSpeed = 4.5 + (((seed * 11.3) % 100) / 100) * 5.0;
      const rot = baseA + prog * spinSpeed * (i % 2 === 0 ? -1 : 1);
      const shardAlpha = Math.min(1.0, (1.0 - prog * 0.98) * 1.1);

      drawWhiteRockPiece(ctx, px, py, size, rot, seed, shardAlpha);
    }

    // C. 소형/미세 돌가루 및 파편 (18개) - 폭발적인 초속도로 사방으로 흩뿌려짐 (2.0 ~ 4.8px)
    const smallCount = 18;
    for (let i = 0; i < smallCount; i++) {
      const seed = i * 53.9 + 17.3;
      const aJitter = ((((seed * 27.7) % 100) / 100) - 0.5) * 0.75;
      const baseA = (i * Math.PI * 2) / smallCount + aJitter + 0.12;

      const distMul = 0.65 + (((seed * 43.1) % 100) / 100) * 0.70;
      const speedDist = (10 + Math.pow(prog, 0.50) * 142) * distMul;
      const gravityY = prog * prog * (28 + ((seed % 6) * 7));

      const px = tx + Math.cos(baseA) * speedDist;
      const py = ty + Math.sin(baseA) * (speedDist * 0.80) + gravityY;

      // 불규칙 미세 크기 (2.0 ~ 4.8px)
      const size = 2.0 + (((seed * 19.9) % 100) / 100) * 2.8;
      const rot = baseA + prog * (7.0 + (seed % 6));
      const shardAlpha = Math.min(1.0, (1.0 - prog) * 1.2);

      drawWhiteRockPiece(ctx, px, py, size, rot, seed, shardAlpha);
    }
  }

  ctx.restore();
}

// ============================================================================
// 🪞 243: 미러코트 (Mirror Coat / ミラーコート) - 에스퍼 타입 특수 기술
// 위력: — / 명중: 100 / PP: 20 / 우선도: -5 / 비접촉
// 설명: 상대에게 받은 특수공격의 데미지를 2배로 만들어 그 상대에게 돌려준다.
//
// [유저 기획 및 연출 플로우]:
// 1. 기술 시전 > 분홍빛 베리어 생성(기술베리어 참조) + 하늘푸른색 반짝임
// 2. 상대방이 기술 사용 > 데미지를 받은 후
// 3. 미러코트 베리어가 깨지면서 와장창 파편 비산
// 4. 미러코트가 다시 나타남 (순백/핑크 섬광 + 2배 에너지 재충전)
// 5. 미러코트에서 반짝임(하늘푸른색 십자별/스파클 탄환들)이 대상포켓몬에게 날아감
// 6. 대상 포켓몬 직격 대폭발 & 체력 감소
// 7. 정위치 복귀
// ============================================================================

/**
 * 대칭 단색 십자별 반짝임 (미러코트 하늘푸른색/핑크/순백 스파클)
 */
function drawMirrorCoatCrossStar(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  color: string = "#38BDF8"
) {
  if (size <= 0.5) return;
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

  // 중심부 순백 코어
  if (size >= 8) {
    ctx.fillStyle = "#FFFFFF";
    const coreR = Math.max(1, Math.round(pinch * 0.8));
    ctx.beginPath();
    ctx.arc(intCx, intCy, coreR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 배리어 사선 반사 하이라이트 (단단해지기/배리어 스타일 순백 듀얼 스트라이프)
 */
function drawMirrorCoatReflectStripes(
  ctx: any,
  cx: number,
  cy: number,
  rectW: number,
  rectH: number,
  shiftOffset: number = 0,
  alpha: number = 0.85
) {
  if (alpha <= 0.01) return;
  const angle = -Math.PI * 0.23;
  const refDim = Math.max(rectW, rectH);
  const W = Math.max(10, Math.round(refDim * 0.20));
  const H = W / 2;
  const L = refDim * 2.6;

  const W_thin = Math.max(3, Math.round(W * 0.28));
  const gap = Math.max(4, Math.round(W * 0.38));
  const thinShift = shiftOffset - H - gap - W_thin / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;

  ctx.fillRect(-L / 2, shiftOffset - H, L, W);
  ctx.fillRect(-L / 2, thinShift - W_thin / 2, L, W_thin);

  ctx.restore();
}

/**
 * 온전한 분홍빛 베리어 본체 + 하늘푸른색 반짝임 렌더러
 */
function drawFullPinkBarrier(
  ctx: any,
  cx: number,
  cy: number,
  rectW: number,
  rectH: number,
  alpha: number = 1.0,
  hasGlint: boolean = true,
  glintPhase: number = 0
) {
  if (alpha <= 0.01) return;
  const halfW = rectW / 2;
  const halfH = rectH / 2;
  const leftX = cx - halfW;
  const topY = cy - halfH;
  const rightX = cx + halfW;
  const bottomY = cy + halfH;
  const lineWidth = 2.8;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 1) 사각형 내부 클리핑 후 분홍빛 반투명 채움 + 반사 스트라이프
  ctx.save();
  ctx.beginPath();
  ctx.rect(leftX, topY, rectW, rectH);
  ctx.clip();

  // 분홍빛 반투명 (에스퍼 크리스탈 핑크/로즈)
  ctx.fillStyle = "rgba(244, 114, 182, 0.35)";
  ctx.fillRect(leftX, topY, rectW, rectH);
  ctx.fillStyle = "rgba(236, 72, 153, 0.15)";
  ctx.fillRect(leftX, topY, rectW, rectH);

  // 사선 반사 스트라이프 유지
  drawMirrorCoatReflectStripes(ctx, cx, cy, rectW, rectH, 0, 0.85);

  ctx.restore(); // clip 해제

  // 2) 순백 + 네온 핑크 외곽 테두리
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(leftX, topY, rectW, rectH);

  ctx.strokeStyle = "rgba(244, 114, 182, 0.6)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(leftX - 1, topY - 1, rectW + 2, rectH + 2);

  // 3) 하늘푸른색 반짝임 (Sky Blue Glint / Sparkle)
  if (hasGlint) {
    const corners = [
      { x: leftX, y: topY },
      { x: rightX, y: topY },
      { x: rightX, y: bottomY },
      { x: leftX, y: bottomY },
    ];
    // 꼭짓점 순회 하늘푸른색 십자별 (중간 점 및 잡음 일체 제거)
    const pIdx = Math.abs(Math.floor(glintPhase * 4)) % 4;
    const corner = corners[pIdx];
    drawMirrorCoatCrossStar(ctx, corner.x, corner.y, 17, "#38BDF8");
  }

  ctx.restore();
}

/**
 * 베리어 피격 균열 (Cracks / 쩍 갈라지는 크리스탈 균열선)
 */
function drawBarrierCracks(
  ctx: any,
  cx: number,
  cy: number,
  leftX: number,
  topY: number,
  rectW: number,
  rectH: number
) {
  ctx.save();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2.0;
  ctx.lineCap = "round";

  const cracks = [
    [{ x: cx, y: cy }, { x: cx - 12, y: cy - 8 }, { x: cx - 18, y: cy - 20 }, { x: leftX + 4, y: topY + 6 }],
    [{ x: cx, y: cy }, { x: cx + 14, y: cy - 6 }, { x: cx + 22, y: cy - 16 }, { x: leftX + rectW - 2, y: topY + 8 }],
    [{ x: cx, y: cy }, { x: cx - 10, y: cy + 12 }, { x: cx - 20, y: cy + 18 }, { x: leftX + 6, y: topY + rectH - 4 }],
    [{ x: cx, y: cy }, { x: cx + 12, y: cy + 10 }, { x: cx + 24, y: cy + 22 }, { x: leftX + rectW - 4, y: topY + rectH - 6 }],
    [{ x: cx - 12, y: cy - 8 }, { x: cx - 24, y: cy - 2 }],
    [{ x: cx + 14, y: cy - 6 }, { x: cx + 26, y: cy - 2 }],
  ];

  for (const branch of cracks) {
    ctx.beginPath();
    ctx.moveTo(branch[0].x, branch[0].y);
    for (let i = 1; i < branch.length; i++) {
      ctx.lineTo(branch[i].x, branch[i].y);
    }
    ctx.stroke();
  }

  // 균열선 하늘푸른빛 서브 스트로크
  ctx.strokeStyle = "#7DD3FC";
  ctx.lineWidth = 1.0;
  for (const branch of cracks) {
    ctx.beginPath();
    ctx.moveTo(branch[0].x, branch[0].y);
    for (let i = 1; i < branch.length; i++) {
      ctx.lineTo(branch[i].x, branch[i].y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 베리어 와장창 깨짐 (Shatter / 사방으로 폭발 비산하는 핑크/스카이 크리스탈 파편)
 */
function drawBarrierShatter(
  ctx: any,
  cx: number,
  cy: number,
  prog: number
) {
  const count = 18;
  for (let i = 0; i < count; i++) {
    const seed = (i * 47.1) % 1;
    const angle = (i * Math.PI * 2) / count + seed * 0.4;
    const speed = 25 + ((i * 31) % 45);
    const dist = prog * speed;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * (dist * 0.8) + prog * prog * 24;
    const rot = angle + prog * ((i % 2 === 0 ? 1 : -1) * 7);
    const shardSize = Math.max(1.5, (9 + (i % 5) * 2) * (1 - prog * 0.45));
    const alpha = Math.max(0, 1 - prog * 1.15);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    const isPink = i % 2 === 0;
    ctx.fillStyle = isPink ? "rgba(244, 114, 182, 0.9)" : "rgba(56, 189, 248, 0.9)";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.0;

    ctx.beginPath();
    ctx.moveTo(0, -shardSize);
    ctx.lineTo(shardSize * 0.65, shardSize * 0.45);
    ctx.lineTo(-shardSize * 0.55, shardSize * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * 미러코트에서 대상 포켓몬에게 날아가는 하늘푸른색 반짝임들 (투사체 궤적)
 */
function drawMirrorCoatFlyingSparkles(
  ctx: any,
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  prog: number
) {
  const sparkleCount = 6;
  for (let i = 0; i < sparkleCount; i++) {
    const delay = i * 0.10;
    const p = Math.max(0, Math.min(1, (prog - delay) / (1 - delay * 0.4)));
    if (p <= 0 || p >= 1) continue;

    // 위아래로 산란하는 호 궤적
    const arcHeight = ((i % 2 === 0 ? -1 : 1) * (18 + (i % 3) * 12)) * Math.sin(p * Math.PI);
    const curX = fromPos.x + (toPos.x - fromPos.x) * p;
    const curY = fromPos.y + (toPos.y - fromPos.y) * p + arcHeight;

    // 꼬리 잔상
    ctx.save();
    const prevP = Math.max(0, p - 0.15);
    const prevArc = ((i % 2 === 0 ? -1 : 1) * (18 + (i % 3) * 12)) * Math.sin(prevP * Math.PI);
    const prevX = fromPos.x + (toPos.x - fromPos.x) * prevP;
    const prevY = fromPos.y + (toPos.y - fromPos.y) * prevP + prevArc;

    const tailGrad = ctx.createLinearGradient(curX, curY, prevX, prevY);
    tailGrad.addColorStop(0, "rgba(56, 189, 248, 0.7)");
    tailGrad.addColorStop(0.6, "rgba(244, 114, 182, 0.4)");
    tailGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(prevX, prevY);
    ctx.stroke();

    // 하늘푸른색 반짝임 십자별
    const starSize = 12 + (i % 3) * 4;
    drawMirrorCoatCrossStar(ctx, curX, curY, starSize, "#38BDF8");
    drawMirrorCoatCrossStar(ctx, curX, curY, starSize * 0.5, "#FFFFFF");

    // 주변 미세 핑크/스카이 스파클
    drawMiniRetroStar(ctx, curX + 5, curY - 4, 4, "#F472B6");
    drawMiniRetroStar(ctx, curX - 4, curY + 5, 3.5, "#BAE6FD");

    ctx.restore();
  }
}

/**
 * 세련된 하늘푸른색 반짝임 크리스탈 타격 (X자 및 조잡한 요소 배제)
 */
function drawMirrorCoatHitSparkles(
  ctx: any,
  tx: number,
  ty: number,
  prog: number
) {
  const alpha = Math.max(0, 1.0 - prog);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  // 피격 위치에서 흩날리는 순수 하늘푸른색/순백 십자별 반짝임들 (유기적 배치)
  const hitSparkles = [
    { dx:   0, dy:   0, size: 20, delay: 0.00, color: "#38BDF8" },
    { dx: -12, dy:  -8, size: 14, delay: 0.06, color: "#BAE6FD" },
    { dx:  14, dy:  -6, size: 16, delay: 0.10, color: "#38BDF8" },
    { dx:  -8, dy:  10, size: 12, delay: 0.14, color: "#FFFFFF" },
    { dx:  10, dy:   8, size: 13, delay: 0.18, color: "#38BDF8" },
    { dx: -16, dy:   2, size: 10, delay: 0.22, color: "#7DD3FC" },
    { dx:  16, dy:  -2, size: 11, delay: 0.26, color: "#BAE6FD" },
  ];

  for (const s of hitSparkles) {
    const p = Math.max(0, Math.min(1.0, (prog - s.delay) / 0.65));
    if (p <= 0 || p >= 1.0) continue;

    const sSize = s.size * Math.sin(p * Math.PI);
    const driftDist = p * 14;
    const sx = tx + s.dx + (s.dx > 0 ? driftDist : -driftDist) * 0.45;
    const sy = ty + s.dy + (s.dy > 0 ? driftDist : -driftDist) * 0.35;

    drawMirrorCoatCrossStar(ctx, sx, sy, sSize, s.color);
    if (sSize > 11) {
      drawMirrorCoatCrossStar(ctx, sx, sy, sSize * 0.45, "#FFFFFF");
    }
  }

  ctx.restore();
}

export function drawMirrorCoatBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 시전 포켓몬에게 일체의 오라/글로우를 넣지 않음
}

export function drawMirrorCoatEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const casterPos = drawCtx.attackerPos;
  const targetPos = drawCtx.targetPos;
  const isP = drawCtx.isPlayer;

  // 시전 포켓몬 정중앙 베리어 좌표 (기술 배리어 기준: casterPos.x, casterPos.y - 2)
  const cx = casterPos.x;
  const cy = casterPos.y - 2;

  const rectW = 62;
  const rectH = 66;
  const halfW = rectW / 2; // 31
  const halfH = rectH / 2; // 33
  const topY = cy - halfH;
  const bottomY = cy + halfH;
  const leftX = cx - halfW;
  const rightX = cx + halfW;
  const lineWidth = 2.8;

  ctx.save();

  // =========================================================================
  // [Step 1: 기술 시전 = 분홍빛 베리어 생성 + 꼭짓점 반짝임 유지]
  // =========================================================================
  if (step === 1) {
    // 1-1. 상단 하늘푸른색 십자별 번쩍임 (prog <= 0.20)
    if (prog <= 0.20) {
      const p = prog / 0.20;
      const starSize = Math.sin(Math.min(1.0, p * 1.5) * Math.PI) * 20;
      drawMirrorCoatCrossStar(ctx, cx, topY, starSize, "#38BDF8");
    }

    // 1-2. 상단 가로선 좌우 확장 (0.20 < prog <= 0.40)
    else if (prog <= 0.40) {
      const p = (prog - 0.20) / 0.20;
      const curHW = Math.min(halfW, p * halfW);

      ctx.save();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(cx - curHW, topY);
      ctx.lineTo(cx + curHW, topY);
      ctx.stroke();

      // 양 끝 전진 팁 하늘푸른색 십자별
      const tipSize = 9;
      drawMirrorCoatCrossStar(ctx, cx - curHW, topY, tipSize, "#38BDF8");
      drawMirrorCoatCrossStar(ctx, cx + curHW, topY, tipSize, "#38BDF8");
      ctx.restore();
    }

    // 1-3. 좌우 세로선 수직 하강 (0.40 < prog <= 0.60)
    else if (prog <= 0.60) {
      const p = (prog - 0.40) / 0.20;
      const curH = Math.min(rectH, p * rectH);

      ctx.save();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      // 상단 가로선 고정
      ctx.beginPath();
      ctx.moveTo(leftX, topY);
      ctx.lineTo(rightX, topY);
      ctx.stroke();

      // 좌우 세로선 하강
      ctx.beginPath();
      ctx.moveTo(leftX, topY);
      ctx.lineTo(leftX, topY + curH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightX, topY);
      ctx.lineTo(rightX, topY + curH);
      ctx.stroke();

      // 양 하단 팁 하늘푸른색 십자별
      const tipSize = 9;
      drawMirrorCoatCrossStar(ctx, leftX, topY + curH, tipSize, "#38BDF8");
      drawMirrorCoatCrossStar(ctx, rightX, topY + curH, tipSize, "#38BDF8");
      ctx.restore();
    }

    // 1-4. 하단선 수렴 & 결합 번쩍 (0.60 < prog <= 0.80)
    else if (prog <= 0.80) {
      const p = (prog - 0.60) / 0.20;
      const curInW = Math.min(halfW, p * halfW);

      ctx.save();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      // ㄷ자 테두리 고정
      ctx.beginPath();
      ctx.moveTo(leftX, topY);
      ctx.lineTo(rightX, topY);
      ctx.lineTo(rightX, bottomY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(leftX, topY);
      ctx.lineTo(leftX, bottomY);
      ctx.stroke();

      // 하단 좌우에서 안쪽으로 수렴
      ctx.beginPath();
      ctx.moveTo(leftX, bottomY);
      ctx.lineTo(leftX + curInW, bottomY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightX, bottomY);
      ctx.lineTo(rightX - curInW, bottomY);
      ctx.stroke();

      // 결합 순간 번쩍임
      if (p >= 0.85) {
        const sparkP = (p - 0.85) / 0.15;
        const sparkSize = Math.sin(sparkP * Math.PI) * 18;
        drawMirrorCoatCrossStar(ctx, cx, bottomY, sparkSize, "#38BDF8");
        drawMirrorCoatCrossStar(ctx, cx, bottomY, sparkSize * 0.6, "#FFFFFF");
      } else {
        const tipSize = 8;
        drawMirrorCoatCrossStar(ctx, leftX + curInW, bottomY, tipSize, "#38BDF8");
        drawMirrorCoatCrossStar(ctx, rightX - curInW, bottomY, tipSize, "#38BDF8");
      }
      ctx.restore();
    }

    // 1-5. 분홍빛 채움 + 사선 반사 하이라이트 번쩍 스위프 (0.80 < prog <= 0.95)
    else if (prog <= 0.95) {
      const p = (prog - 0.80) / 0.15;

      ctx.save();

      // 클리핑 후 분홍빛 채움
      ctx.save();
      ctx.beginPath();
      ctx.rect(leftX, topY, rectW, rectH);
      ctx.clip();

      ctx.fillStyle = "rgba(244, 114, 182, 0.35)";
      ctx.fillRect(leftX, topY, rectW, rectH);
      ctx.fillStyle = "rgba(236, 72, 153, 0.15)";
      ctx.fillRect(leftX, topY, rectW, rectH);

      // 사선 반사 하이라이트 스위프
      const refDim = Math.max(rectW, rectH);
      const shift = (-0.8 + p * 1.6) * refDim;
      drawMirrorCoatReflectStripes(ctx, cx, cy, rectW, rectH, shift, 0.95);

      ctx.restore();

      // 순백 테두리
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(leftX, topY, rectW, rectH);

      // 우상단 모서리 하늘푸른색 글린트
      const glintSize = Math.sin(Math.min(1.0, p * 1.6) * Math.PI) * 16;
      drawMirrorCoatCrossStar(ctx, rightX, topY, glintSize, "#38BDF8");

      ctx.restore();
    }

    // 1-6. 분홍빛 베리어 완성 유지 & 4개 꼭짓점 반짝임
    else {
      drawFullPinkBarrier(ctx, cx, cy, rectW, rectH, 1.0, true, 0.0);
    }
  }

  // =========================================================================
  // [Step 2: 베리어 균열 ➔ 와장창 깨짐 (Shatter)]
  // =========================================================================
  else if (step === 2) {
    if (prog <= 0.35) {
      // 1) 분홍빛 베리어 본체 유지
      drawFullPinkBarrier(ctx, cx, cy, rectW, rectH, 0.95, false, 0);

      // 2) 균열 (Crack) 쩍 갈라짐
      drawBarrierCracks(ctx, cx, cy, leftX, topY, rectW, rectH);

      // 베리어 중앙 균열 발광
      drawMirrorCoatCrossStar(ctx, cx, cy, 14, "#FFFFFF");
    } else {
      // 3) 쨍그랑! 미러코트 베리어가 와장창 깨지면서 파편 비산
      const breakP = (prog - 0.35) / 0.65;
      drawBarrierShatter(ctx, cx, cy, breakP);

      // 중심부 잔류 깨짐 섬광
      if (breakP < 0.45) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.45 - breakP) * 2.2})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // =========================================================================
  // [Step 3: 깨진 자리에서 파편인 하늘푸른색 십자별들이 대상에게 날아감!]
  // =========================================================================
  else if (step === 3) {
    // 베리어는 완전히 깨졌으므로 베리어는 그리지 않고, 깨진 자리에서 십자별들이 쇄도!
    const fromPos = { x: cx, y: cy };
    drawMirrorCoatFlyingSparkles(ctx, fromPos, targetPos, prog);
  }

  // =========================================================================
  // [Step 4: 대상 포켓몬 직격 타격 & 체력 감소]
  // =========================================================================
  else if (step === 4) {
    // 날아온 반짝임들이 대상 포켓몬에게 적중하는 영롱한 크리스탈 십자별 타격 (X자/빨강 없음)
    drawMirrorCoatHitSparkles(ctx, targetPos.x, targetPos.y, prog);
  }

  // =========================================================================
  // [Step 5: 정위치 복귀 & 마무리]
  // =========================================================================
  else if (step === 5) {
    // 잔여 이펙트 없음 (깨끗한 정위치 복귀)
  }

  ctx.restore();
}

// ============================================================================
// 👁️ 244: 자기암시 (Psych Up / じこあんじ) - 노말 타입 변화 기술
// 위력: — / 명중: — (필중) / PP: 10
// 설명: 자신에게 암시를 걸어서 상대의 모든 능력치 랭크 변화 상태를 자신에게 똑같이 복사한다.
// 연출: 기술 이펙트 없음 (별도 캔버스 파티클/광원 이펙트 없이 시전자 스프라이트 변화기 모션만 연출)
// ============================================================================

export function drawPsychUpBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 자기암시 기술 이펙트 없음
}

export function drawPsychUpEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const prog = frame.effectProgress ?? 0;
  const casterPos = drawCtx.attackerPos;

  // 반투명 엔벨로프 (피크 투명도 ~0.70)
  let alpha = 0.70;
  if (prog < 0.12) {
    alpha = (prog / 0.12) * 0.70;
  } else if (prog > 0.85) {
    alpha = Math.max(0, (1.0 - prog) / 0.15) * 0.70;
  }
  if (alpha <= 0.01) return;

  const cx = casterPos.x;
  const cy = casterPos.y - 2; // 시전 포켓몬 중심부 기준

  // 유저 요청 반영: 회전 방향 반대 (시계방향 0 -> +2*PI)
  const rot = prog * Math.PI * 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // 유저 요청 완벽 반영:
  // 1) 타원형 배제 ➔ 완전한 정원(동그라미) 나선 지오메트리
  // 2) 선의 시작부분(안쪽 코어)과 끝부분(외곽) 모두 날카롭게 뾰족한 테이퍼드 끝 (Pointed Tips)
  // 3) 중간부분도 포켓몬이 투과되어 보이는 부드러운 반투명 (Semi-transparent throughout)
  const numPoints = 140;
  const angleSpan = Math.PI * 5.5; // 2.75 회전
  const rMin = 6, rMax = 56;
  const baseOffset = -Math.PI / 3;

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const a = baseOffset - t * angleSpan;
    const r = rMin + (rMax - rMin) * Math.pow(t, 0.95);
    pts.push({
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
    });
  }

  // 양 끝(t=0, t=1)이 뾰족하고 중간이 도톰하게 부풀어 오르는 테이퍼드 폴리곤 리본 정점 계산
  const getRibbonVertices = (maxHw: number) => {
    const upper: { x: number; y: number }[] = [];
    const lower: { x: number; y: number }[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      // t=0(시작) 및 t=1(끝)에서 폭 0으로 뾰족하게 수렴하는 사인 곡선 엔벨로프
      const taper = Math.sin(t * Math.PI);
      const hw = maxHw * Math.pow(taper, 0.75);

      let dx: number, dy: number;
      if (i === 0) {
        dx = pts[1].x - pts[0].x;
        dy = pts[1].y - pts[0].y;
      } else if (i === numPoints) {
        dx = pts[numPoints].x - pts[numPoints - 1].x;
        dy = pts[numPoints].y - pts[numPoints - 1].y;
      } else {
        dx = pts[i + 1].x - pts[i - 1].x;
        dy = pts[i + 1].y - pts[i - 1].y;
      }
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      upper.push({ x: pts[i].x + nx * hw, y: pts[i].y + ny * hw });
      lower.push({ x: pts[i].x - nx * hw, y: pts[i].y - ny * hw });
    }
    return { upper, lower };
  };

  const drawTaperedPolygon = (
    ribbon: { upper: { x: number; y: number }[]; lower: { x: number; y: number }[] },
    fillStyle: string
  ) => {
    ctx.beginPath();
    ctx.moveTo(ribbon.upper[0].x, ribbon.upper[0].y);
    for (let i = 1; i < ribbon.upper.length; i++) {
      ctx.lineTo(ribbon.upper[i].x, ribbon.upper[i].y);
    }
    for (let i = ribbon.lower.length - 1; i >= 0; i--) {
      ctx.lineTo(ribbon.lower[i].x, ribbon.lower[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  };

  // 1) 외곽 소프트 페더링 림 (가장자리 투명 보더)
  const r1 = getRibbonVertices(6.2);
  drawTaperedPolygon(r1, `rgba(254, 240, 138, ${alpha * 0.18})`);

  // 2) 메인 골든 옐로우 리본 바디 (중간부분도 투과되는 반투명)
  const r2 = getRibbonVertices(4.4);
  drawTaperedPolygon(r2, `rgba(250, 204, 21, ${alpha * 0.32})`);

  // 3) 내부 밝은 레몬 코어 밴드 (투명도 유지)
  const r3 = getRibbonVertices(2.0);
  drawTaperedPolygon(r3, `rgba(254, 240, 138, ${alpha * 0.22})`);

  ctx.restore();
}

