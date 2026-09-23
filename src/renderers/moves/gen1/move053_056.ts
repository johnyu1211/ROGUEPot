import { Path2D } from "@napi-rs/canvas";

/**
 * Gen 1 Moves 053 - 056 Renderers
 * 
 * 053: 화염방사 (Flamethrower)
 * 054: 흰안개 (Mist) - [예정]
 * 055: 물대포 (Water Gun) - [예정]
 * 056: 하이드로펌프 (Hydro Pump) - [예정]
 */

// ============================================================================
// 053: 화염방사 (Flamethrower)
// ============================================================================

/**
 * Helper: 시전자 입/앞쪽의 초고열 점화 불씨 (Charge Ignition Flare)
 */
export function drawFlamethrowerChargeFlare(
  ctx: any,
  x: number,
  y: number,
  intensity: number,
  alpha: number = 1.0
) {
  if (alpha <= 0 || intensity <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const r = 13 * intensity;

  // 외곽 적색/주황 아우라 (부드러운 감쇄)
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8);
  grad.addColorStop(0, "#FFFFFF");
  grad.addColorStop(0.25, "#FEF08A");
  grad.addColorStop(0.55, "#F97316");
  grad.addColorStop(0.85, "rgba(239, 68, 68, 0.4)");
  grad.addColorStop(1, "rgba(239, 68, 68, 0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 입가로 모여드는 십자형 플레어 광채
  ctx.strokeStyle = "rgba(254, 240, 138, 0.85)";
  ctx.lineWidth = 2.2 * intensity;
  ctx.beginPath();
  ctx.moveTo(x - r * 1.5, y);
  ctx.lineTo(x + r * 1.5, y);
  ctx.moveTo(x, y - r * 1.5);
  ctx.lineTo(x, y + r * 1.5);
  ctx.stroke();

  // 미세 스파크 4개
  ctx.fillStyle = "#FEF08A";
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 0.35;
    const dist = r * 1.25;
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 1.4 * intensity, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Helper: 뭉게뭉게 피어오르는 다엽형 화염 구름 플룸 (Billowing Multi-Lobed Flame Cloud)
 * - 단순한 동그라미(단일 원)가 아닌, 5개의 유기적 로브와 소프트 그라데이션으로 뭉쳐진 진짜 불꽃 덩어리
 * - 하드한 원형 테두리 없이 부드럽게 겹쳐져 진짜 타오르는 화염 가스 구름처럼 블렌딩됨
 */
export function drawBillowingFlamePuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  mainAngle: number,
  rollAngle: number,
  alpha: number = 1.0,
  seed: number = 0,
  noYellowCore: boolean = false
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);

  // 1. 후방으로 흩날리는 불꽃 혓바닥 (바람에 밀리는 화염 꼬리, 끝부분 투명 페이드 & 덩어리 간 자연스러운 연결)
  ctx.save();
  ctx.rotate(mainAngle);
  const tailLen = radius * 1.65;
  const tailW = radius * 0.58;

  const tailGrad = ctx.createLinearGradient(0, 0, -tailLen, 0);
  tailGrad.addColorStop(0.0, "rgba(239, 68, 68, 0.88)");
  tailGrad.addColorStop(0.55, "rgba(239, 68, 68, 0.45)");
  tailGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");
  ctx.fillStyle = tailGrad;

  ctx.beginPath();
  ctx.moveTo(0, -tailW);
  ctx.quadraticCurveTo(-tailLen * 0.6, -tailW * 0.8, -tailLen, 0);
  ctx.quadraticCurveTo(-tailLen * 0.6, tailW * 0.8, 0, tailW);
  ctx.closePath();
  ctx.fill();

  // 중간 주황빛 꼬리 코어 (끝부분 투명 페이드)
  const coreTailGrad = ctx.createLinearGradient(0, 0, -tailLen * 0.75, 0);
  coreTailGrad.addColorStop(0.0, "rgba(249, 115, 22, 0.92)");
  coreTailGrad.addColorStop(0.60, "rgba(249, 115, 22, 0.40)");
  coreTailGrad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)");
  ctx.fillStyle = coreTailGrad;

  ctx.beginPath();
  ctx.moveTo(0, -tailW * 0.6);
  ctx.quadraticCurveTo(-tailLen * 0.45, -tailW * 0.4, -tailLen * 0.75, 0);
  ctx.quadraticCurveTo(-tailLen * 0.45, tailW * 0.4, 0, tailW * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. 5개의 유기적 로브(Lobe)로 구성된 뭉게뭉게 화염 외곽 (소프트 블렌딩)
  const LOBE_COUNT = 5;
  for (let i = 0; i < LOBE_COUNT; i++) {
    const lobeAngle = rollAngle + (i / LOBE_COUNT) * Math.PI * 2;
    const lobeDist = radius * 0.34;
    const lobeR = radius * (0.60 + Math.sin(i * 1.9 + seed) * 0.12);
    const lx = Math.cos(lobeAngle) * lobeDist;
    const ly = Math.sin(lobeAngle) * lobeDist;

    const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lobeR);
    grad.addColorStop(0, "#F97316"); // 중심부 선명한 주황
    grad.addColorStop(0.50, "#EF4444"); // 중간 심홍 적색
    grad.addColorStop(0.85, "rgba(220, 38, 38, 0.45)");
    grad.addColorStop(1.0, "rgba(220, 38, 38, 0)"); // 외곽은 100% 투명 페이드

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lx, ly, lobeR, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 중심 코어: noYellowCore가 true이면 노란색(#FEF08A)과 백색(#FFFFFF) 없이 부드러운 주황/적색 코어 적용
  const coreR = radius * 0.46;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
  if (!noYellowCore) {
    coreGrad.addColorStop(0, "#FFFFFF");
    coreGrad.addColorStop(0.35, "#FEF08A");
    coreGrad.addColorStop(0.70, "rgba(249, 115, 22, 0.7)");
    coreGrad.addColorStop(1.0, "rgba(249, 115, 22, 0)");
  } else {
    coreGrad.addColorStop(0, "rgba(249, 115, 22, 0.85)");
    coreGrad.addColorStop(0.55, "rgba(239, 68, 68, 0.50)");
    coreGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");
  }

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper: 열기 부력으로 상승하며 기화하는 반투명 화염 기체 제트 기류 (Translucent Thermal Flame Stream)
 * - 유저 피드백: "날아가면서 조금씩 위로 올라가면서 투명해지게? 마치 화염기체처럼?"
 * - 노즐에서 뿜어져 나와 날아갈수록 열기 부력(Thermal Updraft)으로 부드럽게 위로 상승
 * - 날아갈수록 기체화(Gas Dissolution)되어 점점 투명해지며 공기 중으로 흩어짐
 * - 외곽 적색 콘 -> 중간 주황 빔 -> 중심 황백색 축선 모두 이 상승 기체 궤적을 따름
 */
function drawTranslucentThermalFlameStream(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  startP: number,
  endP: number,
  alpha: number
) {
  if (alpha <= 0.01 || endP <= startP) return;

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  const SAMPLES = 14;
  const topPtsRed: { x: number; y: number }[] = [];
  const botPtsRed: { x: number; y: number }[] = [];
  const topPtsOrange: { x: number; y: number }[] = [];
  const botPtsOrange: { x: number; y: number }[] = [];
  const centerPts: { x: number; y: number }[] = [];

  const rWStart = 6.0 + startP * 5.0;
  const rWEnd = 6.5 + endP * 16.5;

  const oWStart = 3.8 + startP * 4.0;
  const oWEnd = 4.2 + endP * 11.0;

  for (let i = 0; i <= SAMPLES; i++) {
    const s = i / SAMPLES;
    const t = startP + s * (endP - startP);

    // 고압 직선 제트 기류: 타겟 중심을 향해 힘차게 직진 (미세 열기 부력 -3px로 완화)
    const rise = -Math.pow(Math.max(0, t), 1.2) * 3.5;

    const cx = ax + ux * (dist * t);
    const cy = ay + uy * (dist * t) + rise;

    centerPts.push({ x: cx, y: cy });

    // 폭 확장 (원추형 고열 분사 기체 팽창)
    const rW = rWStart + s * (rWEnd - rWStart);
    topPtsRed.push({ x: cx - nx * rW, y: cy - ny * rW });
    botPtsRed.push({ x: cx + nx * rW, y: cy + ny * rW });

    const oW = oWStart + s * (oWEnd - oWStart);
    topPtsOrange.push({ x: cx - nx * oW, y: cy - ny * oW });
    botPtsOrange.push({ x: cx + nx * oW, y: cy + ny * oW });
  }

  const pStart = centerPts[0];
  const pEnd = centerPts[centerPts.length - 1];
  const tipLen = Math.min(22, dist * (endP - startP) * 0.28);
  const tipPt = {
    x: pEnd.x + ux * tipLen,
    y: pEnd.y + uy * tipLen - 1.5,
  };

  ctx.save();

  // 1. 외곽 적색 기체 콘 (점진적 투명화: 날아갈수록 옅어짐)
  const redGrad = ctx.createLinearGradient(pStart.x, pStart.y, tipPt.x, tipPt.y);
  if (startP > 0.06) {
    redGrad.addColorStop(0.0, "rgba(239, 68, 68, 0)");
    redGrad.addColorStop(0.12, `rgba(239, 68, 68, ${0.22 * alpha})`);
  } else {
    redGrad.addColorStop(0.0, `rgba(239, 68, 68, ${0.22 * alpha})`);
  }
  redGrad.addColorStop(0.45, `rgba(239, 68, 68, ${0.22 * alpha})`);
  // 날아가면서 점진적 투명화 (0.72에서 0.10, 1.0에서 0.0)
  redGrad.addColorStop(0.72, `rgba(239, 68, 68, ${0.10 * alpha})`);
  redGrad.addColorStop(0.90, `rgba(239, 68, 68, ${0.04 * alpha})`);
  redGrad.addColorStop(1.0, "rgba(239, 68, 68, 0)");

  ctx.fillStyle = redGrad;
  ctx.beginPath();
  ctx.moveTo(topPtsRed[0].x, topPtsRed[0].y);
  for (let i = 1; i <= SAMPLES; i++) {
    ctx.lineTo(topPtsRed[i].x, topPtsRed[i].y);
  }
  // 끝부분 테이퍼드 첨두
  ctx.quadraticCurveTo(pEnd.x, pEnd.y, tipPt.x, tipPt.y);
  ctx.quadraticCurveTo(pEnd.x, pEnd.y, botPtsRed[SAMPLES].x, botPtsRed[SAMPLES].y);
  for (let i = SAMPLES - 1; i >= 0; i--) {
    ctx.lineTo(botPtsRed[i].x, botPtsRed[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 2. 중간 주황색 기체 내부 빔 (점진적 투명화)
  const orangeGrad = ctx.createLinearGradient(pStart.x, pStart.y, tipPt.x, tipPt.y);
  if (startP > 0.06) {
    orangeGrad.addColorStop(0.0, "rgba(249, 115, 22, 0)");
    orangeGrad.addColorStop(0.12, `rgba(249, 115, 22, ${0.32 * alpha})`);
  } else {
    orangeGrad.addColorStop(0.0, `rgba(249, 115, 22, ${0.32 * alpha})`);
  }
  orangeGrad.addColorStop(0.45, `rgba(249, 115, 22, ${0.30 * alpha})`);
  orangeGrad.addColorStop(0.72, `rgba(249, 115, 22, ${0.14 * alpha})`);
  orangeGrad.addColorStop(0.90, `rgba(249, 115, 22, ${0.05 * alpha})`);
  orangeGrad.addColorStop(1.0, "rgba(249, 115, 22, 0)");

  ctx.fillStyle = orangeGrad;
  ctx.beginPath();
  ctx.moveTo(topPtsOrange[0].x, topPtsOrange[0].y);
  for (let i = 1; i <= SAMPLES; i++) {
    ctx.lineTo(topPtsOrange[i].x, topPtsOrange[i].y);
  }
  ctx.quadraticCurveTo(pEnd.x, pEnd.y, tipPt.x, tipPt.y);
  ctx.quadraticCurveTo(pEnd.x, pEnd.y, botPtsOrange[SAMPLES].x, botPtsOrange[SAMPLES].y);
  for (let i = SAMPLES - 1; i >= 0; i--) {
    ctx.lineTo(botPtsOrange[i].x, botPtsOrange[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 3. 중심 초고열 황백색 기체 코어 축선 (상승 곡선 + 점진적 투명화)
  const lineGrad = ctx.createLinearGradient(pStart.x, pStart.y, tipPt.x, tipPt.y);
  if (startP > 0.06) {
    lineGrad.addColorStop(0.0, "rgba(254, 240, 138, 0)");
    lineGrad.addColorStop(0.12, `rgba(254, 240, 138, ${0.52 * alpha})`);
  } else {
    lineGrad.addColorStop(0.0, `rgba(254, 240, 138, ${0.52 * alpha})`);
  }
  lineGrad.addColorStop(0.45, `rgba(254, 240, 138, ${0.48 * alpha})`);
  lineGrad.addColorStop(0.72, `rgba(254, 240, 138, ${0.18 * alpha})`);
  lineGrad.addColorStop(0.90, `rgba(254, 240, 138, ${0.05 * alpha})`);
  lineGrad.addColorStop(1.0, "rgba(254, 240, 138, 0)");

  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 4.2 + endP * 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(centerPts[0].x, centerPts[0].y);
  for (let i = 1; i <= SAMPLES; i++) {
    ctx.lineTo(centerPts[i].x, centerPts[i].y);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * 053: 화염방사 고압 연속 화염 제트 기류 종합 렌더러
 * - 열기 부력으로 위로 솟아오르며 기화하여 투명해지는 화염기체 제트 기류
 * - 그 위를 타고 나아가는 풍성한 11개의 롤링 회전 화염 구름 클러스터
 * - 흩날리는 불꽃 혓바닥과 사방으로 솟구치는 미세 불티
 */
export function drawFlamethrowerStream(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  headProgress: number,
  tailProgress: number = 0.0,
  alpha: number = 1.0,
  frameStep: number = 1
) {
  if (alpha <= 0.01 || headProgress <= 0 || headProgress <= tailProgress) return;

  const startP = Math.max(0, tailProgress);
  const endP = Math.min(1.15, headProgress);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  const mainAngle = Math.atan2(dy, dx);
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  ctx.save();

  // 1. [유저 피드백: "날아가면서 조금씩 위로 올라가면서 투명해지게? 마치 화염기체처럼?"]
  // 열기 부력으로 자연스럽게 위로 솟아오르며, 비행 거리에 따라 부드럽게 기화하여 투명해지는 반투명 기체 빔
  drawTranslucentThermalFlameStream(ctx, ax, ay, tx, ty, startP, endP, alpha);

  // 2. [전방 쇄도 유체 화염 구름 클러스터 - 롤링 화염기체]
  const BURST_SPACING = 0.11;
  const flowAdvance = ((frameStep - 3) * 0.14) % BURST_SPACING;
  const activeEnd = Math.min(1.08, endP);

  for (let k = 0; k < 11; k++) {
    const t = activeEnd - flowAdvance - k * BURST_SPACING;
    if (t < startP - 0.03 || t > endP + 0.02) continue;

    // 타겟 중심을 향해 힘차게 직진하는 고압 화염 제트 (미세 열기 부력 -3.5px 완화)
    const thermalRise = -Math.pow(Math.max(0, t), 1.2) * 3.5;

    // 직진 축선 주위의 안정적인 유기적 롤링 미세 난류
    const sinWave = Math.sin(t * Math.PI * 3.0 - frameStep * 1.2) * (t * 3.5);
    const jiggle = Math.sin(k * 2.2 + frameStep * 1.5) * (1.2 + t * 1.8);

    const px = ax + ux * (dist * t) + nx * (sinWave + jiggle);
    const py = ay + uy * (dist * t) + ny * (sinWave + jiggle) + thermalRise;

    // 기체 팽창: 타겟 쪽으로 갈수록 넓게 퍼지는 화염기체 구름 (7px -> 28px)
    const puffR = 7.0 + Math.pow(Math.min(1.15, Math.max(0, t)), 0.70) * 21.0;

    // 전진하면서 회전 롤링하는 다이내믹 앵글
    const rollAngle = -frameStep * 1.4 - k * 1.3;

    // [유저 요청: "화염방사 시전자랑 좀 가까이 있는 화염동그라미 가까울수록 투명하게"]
    // 시전자(t=0)에 가까울수록 점점 더 투명해지는 부드러운 거리 비례 감쇄 (0.0 ~ 0.45 구간)
    const casterDist = Math.max(0, t - startP);
    const nearCasterNorm = Math.min(1.0, casterDist / 0.45);
    const nearCasterFade = nearCasterNorm * nearCasterNorm * (3 - 2 * nearCasterNorm);

    // [화염기체 점진적 투명화: 날아갈수록 기화하여 공기 중으로 투명해짐]
    const gasDissolve = Math.max(0.18, 1.0 - Math.pow(Math.max(0, t - 0.08) / 0.95, 1.15) * 0.70);
    let puffAlpha = alpha * 0.85 * gasDissolve * nearCasterFade;

    // 스트림 선두 도달 페이드아웃
    if (t > endP - 0.08) {
      puffAlpha *= Math.max(0, (endP - t) / 0.08);
    }

    drawBillowingFlamePuff(ctx, px, py, puffR, mainAngle, rollAngle, puffAlpha, k + frameStep);
  }

  // 3. 외곽으로 거세게 날리는 날카로운 불꽃 혓바닥 (Flame Licks)
  const LICK_COUNT = 6;
  for (let j = 0; j < LICK_COUNT; j++) {
    const lt = startP + (j / (LICK_COUNT - 1)) * (endP - startP);
    if (lt < 0.15 || lt > 1.0) continue;

    const isTop = j % 2 === 0;
    const sign = isTop ? 1 : -1;
    const thermalRise = -Math.pow(Math.max(0, lt), 1.2) * 4.0;
    const sinWave = Math.sin(lt * Math.PI * 3.0 - frameStep * 1.2) * (lt * 3.5);
    const halfW = 5.0 + Math.pow(Math.min(1.2, lt), 0.75) * 17.0;

    const bx = ax + ux * (dist * lt) + nx * (sinWave + sign * halfW);
    const by = ay + uy * (dist * lt) + ny * (sinWave + sign * halfW) + thermalRise;

    const lickLen = 11 + lt * 11;
    const tipX = bx - ux * (lickLen * 0.75) + nx * (sign * (lickLen * 0.65));
    const tipY = by - uy * (lickLen * 0.75) + ny * (sign * (lickLen * 0.65)) - 2; // 상승 기류로 팁이 살짝 위로 말려 올라감

    // 날아갈수록 투명해지는 기체 혓바닥
    const lickDissolve = Math.max(0.15, 1.0 - Math.pow(lt, 1.1) * 0.65);
    const lickGrad = ctx.createLinearGradient(bx, by, tipX, tipY);
    const lickColor = (j % 2 === 0) ? "254, 240, 138" : "249, 115, 22";
    lickGrad.addColorStop(0.0, `rgba(${lickColor}, ${0.70 * alpha * lickDissolve})`);
    lickGrad.addColorStop(0.35, `rgba(239, 68, 68, ${0.30 * alpha * lickDissolve})`);
    lickGrad.addColorStop(0.70, `rgba(239, 68, 68, ${0.10 * alpha * lickDissolve})`);
    lickGrad.addColorStop(1.0, `rgba(239, 68, 68, 0.0)`);

    ctx.fillStyle = lickGrad;
    ctx.beginPath();
    ctx.moveTo(bx - ux * 4, by - uy * 4);
    ctx.quadraticCurveTo(bx + nx * (sign * 6), by + ny * (sign * 6), tipX, tipY);
    ctx.quadraticCurveTo(bx + ux * 4, by + uy * 4, bx + ux * 6, by + uy * 6);
    ctx.closePath();
    ctx.fill();
  }

  // 4. 사방으로 흩날리는 미세 고열 불티 (Embers) - 가벼운 재와 불티가 상승 기류를 타고 높이 솟아오름
  const SPARK_COUNT = 8;
  for (let p = 0; p < SPARK_COUNT; p++) {
    const pt = startP + (p / (SPARK_COUNT - 1)) * (endP - startP);
    if (pt < 0.15 || pt > 1.05) continue;

    const pSign = (p % 2 === 0) ? 1 : -1;
    const thermalRise = -Math.pow(Math.max(0, pt), 1.2) * 12.0;
    const sinWave = Math.sin(pt * Math.PI * 3.0 - frameStep * 1.2) * (pt * 4.0);
    const pDist = (sinWave + (8 + pt * 18) * pSign + Math.sin(p * 2 + frameStep) * 4);
    const spX = ax + ux * (dist * pt) + nx * pDist;
    const spY = ay + uy * (dist * pt) + ny * pDist + thermalRise - (p % 3) * 4;

    const sparkDissolve = Math.max(0.2, 1.0 - Math.pow(pt, 1.1) * 0.55);
    ctx.fillStyle = (p % 2 === 0) ? `rgba(254, 240, 138, ${sparkDissolve * alpha})` : `rgba(249, 115, 22, ${sparkDissolve * alpha})`;
    ctx.beginPath();
    ctx.arc(spX, spY, 1.4 + (p % 2) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Helper: 대상 격돌 시 전신을 집어삼키는 화염 폭풍 (Target Impact Inferno Vortex)
 * - 솟구쳐 오르는 거대한 7개의 화염 기둥 혓바닥과 사방으로 흩날리는 불티
 */
export function drawFlamethrowerImpactInferno(
  ctx: any,
  tx: number,
  ty: number,
  intensity: number,
  alpha: number = 1.0,
  frameStep: number = 1
) {
  if (alpha <= 0.01 || intensity <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 부드럽게 감쇄되는 중심부 고열 열기 아우라 (외곽 하드 라인 완전 제거)
  const coreR = (24 + intensity * 26);
  const glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, coreR * 1.6);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  glow.addColorStop(0.25, "rgba(254, 240, 138, 0.85)");
  glow.addColorStop(0.55, "rgba(249, 115, 22, 0.60)");
  glow.addColorStop(0.80, "rgba(239, 68, 68, 0.25)");
  glow.addColorStop(1, "rgba(239, 68, 68, 0)");

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(tx, ty, coreR * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // 2. [유저 피드백 반영: 도달 시 바닥 불꽃 임시 제외]
  // 대상 발밑 바닥에서 솟구치던 화염 기둥을 임시 제외하고, 타격 지점 열기 아우라와 비산 불티에 집중

  // 3. 사방으로 튀어오르는 고열 불티 (Sparks & Cinders)
  const SPARK_COUNT = 9;
  for (let s = 0; s < SPARK_COUNT; s++) {
    const sAngle = (s / SPARK_COUNT) * Math.PI * 2 + frameStep * 0.7;
    const sDist = (22 + (s * 7) % 28) * intensity;
    const sx = tx + Math.cos(sAngle) * sDist;
    const sy = ty - 8 + Math.sin(sAngle) * (sDist * 0.75) - (s % 3) * 7;

    ctx.fillStyle = (s % 2 === 0) ? "#FEF08A" : "#F97316";
    ctx.beginPath();
    ctx.arc(sx, sy, 1.4 + (s % 2) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 053: 화염방사 Background 이펙트 렌더러
 * - [유저 요청: "배경전체 살짝 붉게 (이펙트는 해당 배경색상효과 위에)"]
 * - 스프라이트 렌더링 이전에 호출되어 배틀 필드 배경 전체를 은은한 화염빛 붉은 열기 톤으로 전환
 */
export function drawFlamethrowerBehindEffect(
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
  const step = frame.moveStep || 1;
  const bgRedAlpha = frame.bgRedAlpha ?? (
    step === 1 ? 0.04 :
    step === 2 ? 0.08 :
    step === 3 ? 0.12 :
    step === 4 ? 0.16 :
    (step >= 5 && step <= 9) ? 0.22 :
    step === 10 ? 0.16 :
    step === 11 ? 0.11 :
    step === 12 ? 0.06 :
    step === 13 ? 0.02 : 0
  );

  if (bgRedAlpha <= 0) return;

  ctx.save();
  // 1. 배틀 아레나 배경 전체 붉은 틴트
  ctx.fillStyle = `rgba(220, 38, 38, ${bgRedAlpha})`;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  // 2. 화염 경로 및 타격 지점을 아우르는 고열 주황빛 래디얼 앰비언트 글로우
  const midX = (drawCtx.attackerPos.x + drawCtx.targetPos.x) / 2;
  const midY = (drawCtx.attackerPos.y + drawCtx.targetPos.y) / 2;
  const heatGlow = ctx.createRadialGradient(midX, midY, 30, midX, midY, 340);
  heatGlow.addColorStop(0, `rgba(249, 115, 22, ${bgRedAlpha * 0.45})`);
  heatGlow.addColorStop(0.65, `rgba(239, 68, 68, ${bgRedAlpha * 0.20})`);
  heatGlow.addColorStop(1, `rgba(220, 38, 38, 0)`);
  ctx.fillStyle = heatGlow;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  ctx.restore();
}

/**
 * 053: 화염방사 (Flamethrower) 종합 이펙트 렌더러
 */
export function drawFlamethrowerEffect(
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
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  // 시전자 발사 시작점 (입/가슴 앞쪽)
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)) + (isP ? 18 : -18);
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 8);

  // 대상 착탄 기준점 (포켓몬 중심부)
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 14 : 10);

  ctx.save();

  // 0. [유저 요청: "배경전체 살짝 붉게 (이펙트는 해당 배경색상효과 위에)"]
  // 화염 기류 렌더링 직전에 전장 전면에도 은은한 화염 열기 앰비언스를 배치하여 일체감 형성
  // (이후 아래의 화염 플레어, 화염 기체 제트, 타격 인페르노가 이 배경색상효과 '위'에 렌더링됨)
  const frontAmbientAlpha = frame.frontAmbientAlpha ?? (
    step === 1 ? 0.02 :
    step === 2 ? 0.04 :
    step === 3 ? 0.06 :
    step === 4 ? 0.08 :
    (step >= 5 && step <= 9) ? 0.10 :
    step === 10 ? 0.07 :
    step === 11 ? 0.05 :
    step === 12 ? 0.02 : 0
  );

  if (frontAmbientAlpha > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(220, 38, 38, ${frontAmbientAlpha})`;
    ctx.fillRect(-4000, -4000, 10000, 10000);
    ctx.restore();
  }

  // 1. 발사 준비 점화 플레어 (Charge Ignition Flare)
  if (frame.chargeIntensity !== undefined && frame.chargeIntensity > 0) {
    const chargeAlpha = frame.chargeAlpha ?? 1.0;
    drawFlamethrowerChargeFlare(ctx, ax, ay, frame.chargeIntensity, chargeAlpha);
  }

  // 2. 굽이치는 롤링 화염 제트 기류 (Flamethrower Rolling Fire Torrent)
  if (frame.streamHead !== undefined && frame.streamHead > 0) {
    const head = frame.streamHead;
    const tail = frame.streamTail ?? 0.0;
    const sAlpha = frame.streamAlpha ?? 1.0;
    drawFlamethrowerStream(ctx, ax, ay, tx, ty, head, tail, sAlpha, step);
  }

  // 3. 대상 격돌 전신 화염 포위 & 폭풍 (Impact Inferno Vortex)
  if (frame.impactIntensity !== undefined && frame.impactIntensity > 0) {
    const iAlpha = frame.impactAlpha ?? 1.0;
    drawFlamethrowerImpactInferno(ctx, tx, ty, frame.impactIntensity, iAlpha, step);
  }

  ctx.restore();
}

// ============================================================================
// 054: 흰안개 (Mist)
// - 얼음 속성 필드 보호 변화기 (5턴간 상대에 의한 능력치 저하 완전 방호)
// - 시전 포켓몬 앞쪽 필드 전개, 전장 전체 서서히 스며들었다 사라지는 푸른 필터
// ============================================================================



/**
 * Helper: 몽환적이고 부드러운 순백/빙청색 유기적 안개 구름 덩어리 (Mist Cloud Puff)
 * - 5개의 둥근 로브가 회전/팽창하며 공기 중에 서서히 기화하는 느낌
 */
function drawMistCloudPuff(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  rollAngle: number,
  alpha: number,
  seed: number = 0
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.translate(x, y);

  // 1. 중심 엽 (Soft White/Cyan Core)
  const coreGrad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
  coreGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.72 * alpha})`);
  coreGrad.addColorStop(0.35, `rgba(240, 249, 255, ${0.58 * alpha})`);
  coreGrad.addColorStop(0.70, `rgba(186, 230, 253, ${0.28 * alpha})`);
  coreGrad.addColorStop(1.0, "rgba(186, 230, 253, 0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 외곽 5엽 유기적 안개 로브
  const LOBE_COUNT = 5;
  for (let i = 0; i < LOBE_COUNT; i++) {
    const angle = rollAngle + (i / LOBE_COUNT) * Math.PI * 2;
    const lobeDist = radius * 0.38;
    const lobeR = radius * (0.62 + Math.sin(i * 1.7 + seed) * 0.12);
    const lx = Math.cos(angle) * lobeDist;
    const ly = Math.sin(angle) * lobeDist;

    const lobeGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lobeR);
    lobeGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.65 * alpha})`);
    lobeGrad.addColorStop(0.45, `rgba(224, 242, 254, ${0.42 * alpha})`);
    lobeGrad.addColorStop(0.80, `rgba(186, 230, 253, ${0.16 * alpha})`);
    lobeGrad.addColorStop(1.0, "rgba(186, 230, 253, 0)");

    ctx.fillStyle = lobeGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, lobeR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Helper: 안개 속에서 반짝이며 상승하는 다이아몬드 얼음 결정 (✦ Diamond Ice Crystals)
 */
function drawMistIceSparkles(
  ctx: any,
  fx: number,
  groundY: number,
  alpha: number,
  step: number
) {
  if (alpha <= 0.01) return;

  ctx.save();
  const SPARKLE_COUNT = 8;

  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const baseAngle = (i / SPARKLE_COUNT) * Math.PI * 2;
    const riseOffset = ((step * 0.13 + i * 0.22) % 1.0);
    const distR = 14 + ((i * 7) % 16) + Math.sin(step * 0.8 + i) * 4;

    const sx = fx + Math.cos(baseAngle + step * 0.15) * distR;
    const sy = groundY - 6 - riseOffset * 65 - Math.sin(i * 2.3) * 8;

    // 반짝임 펄스
    const pulse = 0.65 + Math.sin(step * 1.4 + i * 2.1) * 0.35;
    const sAlpha = alpha * pulse;
    const sSize = (3.5 + (i % 3) * 1.5) * (0.8 + riseOffset * 0.4);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(step * 0.2 + i * 0.8);

    // 외곽 빙청색 글로우
    ctx.fillStyle = `rgba(56, 189, 248, ${0.40 * sAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, sSize * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // 다이아몬드 결정 본체
    ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * sAlpha})`;
    ctx.beginPath();
    ctx.moveTo(0, -sSize * 1.4);
    ctx.quadraticCurveTo(sSize * 0.22, 0, sSize * 1.4, 0);
    ctx.quadraticCurveTo(sSize * 0.22, 0, 0, sSize * 1.4);
    ctx.quadraticCurveTo(-sSize * 0.22, 0, -sSize * 1.4, 0);
    ctx.quadraticCurveTo(-sSize * 0.22, 0, 0, -sSize * 1.4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * 054: 흰안개 Behind 이펙트 렌더러
 * - 시전자(아군) 발밑과 뒷편에서 피어오르는 후면 안개 구름 및 국소 냉기 아우라
 * - 변화기이므로 상대방 진영을 절대 침범하지 않고 오직 시전자 주위만 감쌈
 */
export function drawMistBehindEffect(
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
  const { attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;
  const dir = isP ? 1 : -1;

  const cx = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const cy = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const groundY = cy + 28;

  // 시전자 포켓몬 발밑/주변 집중 (상대방 쪽으로 넘어가지 않음)
  const mProgress = frame.mistProgress ?? 0;
  const fx = cx + dir * 6;

  // [유저 요청: "전체에다가 배경 약간 푸르고 흰 색깔 필터"]
  // 스프라이트 후면(배경 위) 전체에 서서히 푸르고 하얀 냉기/서리 필터를 은은하게 페이드인 ➔ 페이드아웃
  const filterAlpha = Math.sin(Math.min(1.0, Math.max(0, step / 10)) * Math.PI) * 0.22;

  ctx.save();

  // 1. 배틀 필드 전체 배경 푸르고 흰색 서리/안개 필터
  if (filterAlpha > 0.005) {
    const filterGrad = ctx.createLinearGradient(0, -200, 0, 480);
    filterGrad.addColorStop(0.0, `rgba(56, 189, 248, ${filterAlpha * 0.50})`); // 상단 푸른 냉기 기운
    filterGrad.addColorStop(0.40, `rgba(186, 230, 253, ${filterAlpha * 0.60})`); // 중간 은은한 파스텔 빙청색
    filterGrad.addColorStop(1.0, `rgba(255, 255, 255, ${filterAlpha * 0.55})`); // 하단 순백 서리/안개
    ctx.fillStyle = filterGrad;
    ctx.fillRect(-4000, -4000, 10000, 10000);
  }

  // 시전 포켓몬 후면 안개 구름
  const mAlpha = frame.mistAlpha ?? (step >= 8 ? Math.max(0, 1.0 - (step - 7) * 0.28) : 1.0);

  if (mProgress > 0 && mAlpha > 0.01) {
    const CLOUD_COUNT = 5;
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const offsetX = (i - 2) * 13;
      const riseH = Math.min(1.2, mProgress) * 36;
      const puffX = fx + offsetX + Math.sin(step * 0.2 + i) * 4;
      const puffY = groundY - riseH * (0.35 + (i / CLOUD_COUNT) * 0.55) + Math.sin(i * 2 + step * 0.8) * 3;
      const puffR = 18 + mProgress * 15 + ((i * 3) % 6);
      const roll = step * 0.3 + i * 1.2;

      drawMistCloudPuff(ctx, puffX, puffY, puffR, roll, mAlpha * 0.70, i);
    }
  }

  ctx.restore();
}

/**
 * 054: 흰안개 Front 종합 이펙트 렌더러
 * - 시전자 포켓몬 주위를 풍성하게 메우는 순백 안개 장막 + 다이아몬드 얼음 결정
 * - 시전자 자신의 몸을 감싸 랭크 하락을 방어하는 연출
 */
export function drawMistEffect(
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
  const { attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;
  const dir = isP ? 1 : -1;

  const cx = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const cy = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const groundY = cy + 28;

  // 시전자 포켓몬 발밑/주변 집중 (상대방 영역 침범 완전 차단)
  const mProgress = frame.mistProgress ?? 0;
  const fx = cx + dir * 6;

  ctx.save();

  // 1. 시전자 전면 순백 안개 구름 (Front Mist Plume - 시전자를 부드럽게 감싸는 연출)
  const mAlpha = frame.mistAlpha ?? (step >= 8 ? Math.max(0, 1.0 - (step - 7) * 0.28) : 1.0);
  if (mProgress > 0 && mAlpha > 0.01) {
    const FRONT_PUFFS = 6;
    for (let k = 0; k < FRONT_PUFFS; k++) {
      const offsetX = (k - 2.5) * 12;
      const riseH = Math.min(1.2, mProgress) * 34;
      const fX = fx + offsetX + Math.sin(step * 0.25 + k) * 5;
      const fY = groundY - riseH * (0.28 + (k / FRONT_PUFFS) * 0.65) + Math.sin(k * 2.2 + step * 0.7) * 3;
      const fR = 16 + mProgress * 16 + ((k * 4) % 5);
      const roll = -step * 0.35 - k * 1.1;

      // 부드러운 순백/빙청색 유기적 롤링 안개 (Alpha 0.45 ~ 0.58)
      drawMistCloudPuff(ctx, fX, fY, fR, roll, mAlpha * 0.52, k + 10);
    }
  }

  // 2. 시전자 주위로 반짝이며 피어오르는 다이아몬드 얼음 결정 (✦ Ice Crystals)
  const sparkleAlpha = frame.sparkleAlpha ?? (step >= 2 && step <= 9 ? 1.0 : 0);
  if (sparkleAlpha > 0) {
    drawMistIceSparkles(ctx, fx, groundY, sparkleAlpha, step);
  }

  ctx.restore();
}

// ============================================================================
// 055: 물대포 (Water Gun)
// - 물 타입 특수 공격 (위력 40, 명중 100%)
// - 1. 시전자 입가 수류 응결 링 및 미세 기포 발생 (Frames 1~2)
// - 2. 고속 원통형 제트 수류(Jet Stream) 사출 (Frames 3~5):
//      외곽 청록 시스 -> 시안 하이드로 빔 -> 순백 캐비테이션 코어
// - 3. 수류를 휘감는 2중 나선형 수류 리본 & 반투명 공기방울(Bubbles)
// - 4. 대상 직격 시 16개의 포물선 물방울 비산, 2중 충격 물결 링, 하이드로 스플래시 (Frames 5~7)
// - 5. 중력 낙하 물방울 착수 및 미세 수증기 페이드아웃 (Frames 8~10)
// ============================================================================

/**
 * Helper: 투명하고 맑은 물방울/버블 렌더링 (Water Bubble)
 */
function drawWaterBubble(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.translate(x, y);

  // 1. 반투명 구체 바디 그라디언트
  const grad = ctx.createRadialGradient(
    -radius * 0.3,
    -radius * 0.3,
    radius * 0.1,
    0,
    0,
    radius
  );
  grad.addColorStop(0.0, `rgba(240, 249, 255, ${0.85 * alpha})`);
  grad.addColorStop(0.4, `rgba(56, 189, 248, ${0.40 * alpha})`);
  grad.addColorStop(0.85, `rgba(2, 132, 199, ${0.55 * alpha})`);
  grad.addColorStop(1.0, `rgba(2, 132, 199, ${0.80 * alpha})`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 외곽 하이라이트 림
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.75 * alpha})`;
  ctx.lineWidth = Math.max(0.8, radius * 0.18);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
  ctx.stroke();

  // 3. 좌상단 초승달 모양 정반사 광택 (Specular Glint)
  ctx.fillStyle = `rgba(255, 255, 255, ${0.92 * alpha})`;
  ctx.beginPath();
  ctx.arc(-radius * 0.38, -radius * 0.38, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper: 비산하는 물방울 파편 렌더링 (Water Droplet) - 자연스러운 반투명 유체
 */
function drawWaterDroplet(
  ctx: any,
  x: number,
  y: number,
  vx: number,
  vy: number,
  size: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0.5) return;

  const angle = Math.atan2(vy, vx);
  const speed = Math.hypot(vx, vy);
  const stretch = Math.min(2.4, 1.0 + speed * 0.04);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // [유저 요청: "튀기는 물에서 border 제거"] -> 인위적인 외곽 테두리 없이 순수 반투명 유체 바디만 렌더링
  const grad = ctx.createLinearGradient(-size * stretch, 0, size * stretch, 0);
  grad.addColorStop(0.0, `rgba(2, 132, 199, ${0.75 * alpha})`);
  grad.addColorStop(0.5, `rgba(56, 189, 248, ${0.88 * alpha})`);
  grad.addColorStop(1.0, `rgba(186, 230, 253, ${0.95 * alpha})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * stretch, size, 0, 0, Math.PI * 2);
  ctx.fill();

  // 순백 스펙큘러 하이라이트 (유선형 타원 광택)
  ctx.fillStyle = `rgba(255, 255, 255, ${0.88 * alpha})`;
  ctx.beginPath();
  ctx.ellipse(
    size * stretch * 0.35,
    -size * 0.20,
    Math.max(0.7, size * 0.38),
    Math.max(0.4, size * 0.20),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

/**
 * Helper: 시전자 발사구 수류 응결 링 & 버블 (Water Gun Nozzle)
 */
function drawWaterGunNozzle(
  ctx: any,
  ax: number,
  ay: number,
  mainAngle: number,
  alpha: number,
  step: number
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(mainAngle);

  // 1. 노즐 부근 수류 응결 링 2겹
  for (let i = 0; i < 2; i++) {
    const ringP = ((step * 0.25 + i * 0.5) % 1.0);
    const rX = 6 + ringP * 14;
    const rY = 10 + ringP * 18;
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.65 * (1 - ringP) * alpha})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. 중심 물빛 스파크 글로우
  const coreR = 12 * alpha;
  const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, coreR);
  coreGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.95 * alpha})`);
  coreGrad.addColorStop(0.4, `rgba(56, 189, 248, ${0.70 * alpha})`);
  coreGrad.addColorStop(1.0, "rgba(2, 132, 199, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  // 3. 응결되는 4개의 물방울 비드
  for (let k = 0; k < 4; k++) {
    const bAngle = (k / 4) * Math.PI * 2 + step * 0.3;
    const bDist = (1 - ((step * 0.2 + k * 0.25) % 1.0)) * 22;
    const bx = Math.cos(bAngle) * bDist;
    const by = Math.sin(bAngle) * bDist;
    drawWaterBubble(ctx, bx, by, 2.5 + (k % 2), alpha * 0.75);
  }

  ctx.restore();
}

/**
 * Helper: 물대포 머리 부분의 부드러운 흰색 수증기/물안개 (Head Water Vapor Steam)
 * - [유저 요청]: "어? 그 수증기 그대로 머리부분으로 옮겨봐"
 * - 물줄기 머리 선단(endX) 및 전두부를 감싸며 피어오르는 다층 순백 수증기 퍼프
 */
function drawWaterGunHeadSteam(
  ctx: any,
  endX: number,
  thickness: number,
  alpha: number,
  step: number,
  headP: number
) {
  if (alpha <= 0.01) return;

  const steamScale = headP > 0.05 ? 1.0 : 0.45;
  const effectiveAlpha = alpha * steamScale;
  if (effectiveAlpha <= 0.01) return;

  // 머리 선단(endX)을 감싸며 전두부로 피어오르는 5개의 유기적 수증기 클러스터
  const PUFF_COUNT = 5;
  for (let i = 0; i < PUFF_COUNT; i++) {
    // i = 0은 머리 선단 직전(endX + 2), i가 커질수록 머리 뒤편(endX - ...)으로 전개
    const lagDist = (i === 0) ? -2 : (i * 7 + Math.sin(i * 2.3 + step * 1.8) * 3);
    const px = endX - lagDist;
    // 위아래로 살짝 흩날리는 와류 (Turbulence)
    const driftY = Math.sin(i * 1.7 + step * 2.5) * (1.8 + i * 1.1);

    // 반경
    const rX = (thickness * 0.42 + i * 2.6) * (1.1 + Math.sin(i * 3.1 + step) * 0.15);
    const rY = (thickness * 0.32 + i * 1.9) * (1.1 + Math.cos(i * 2.7 + step) * 0.15);

    // 투명도
    const puffAlpha = effectiveAlpha * Math.max(0, 0.72 - i * 0.11);
    if (puffAlpha <= 0.01) continue;

    ctx.save();
    ctx.translate(px, driftY);
    ctx.rotate(Math.sin(i * 1.5 + step * 1.2) * 0.22);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rX, rY));
    grad.addColorStop(0.0, `rgba(255, 255, 255, ${Math.min(1.0, puffAlpha * 0.95)})`); // 중심 순백 수증기 코어
    grad.addColorStop(0.35, `rgba(240, 249, 255, ${puffAlpha * 0.70})`); // 뽀얀 수증기
    grad.addColorStop(0.70, `rgba(224, 242, 254, ${puffAlpha * 0.30})`); // 부드러운 외곽 물안개
    grad.addColorStop(1.0, "rgba(224, 242, 254, 0.0)"); // 완전 투명 페이드

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 머리 선단 주변 미세 수증기 입자들 (Tiny Vapor Spores)
  for (let s = 0; s < 4; s++) {
    const sDist = 3 + s * 6 + ((step * 4 + s * 7) % 10);
    const sx = endX - sDist;
    const sy = Math.sin(s * 2.1 + step * 3.0) * (thickness * 0.38);
    const sR = 1.2 + (s % 2) * 0.8;
    const sAlpha = effectiveAlpha * Math.max(0, 0.65 - (sDist / 32));

    if (sAlpha > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${sAlpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Helper: 유선형 고압 제트 수류 스트림 (Water Jet Stream)
 * - 입가에서 대상까지 유기적으로 이어지는 고압 제트 기둥
 * - 반투명 아쿠아 셰이드 & 비비드 시안 바디
 * - [유저 요청: "물대포 안쪽 흰색 사각형의 양쪽 끝을 뾰족하게"]
 *   -> 내부 순백 캐비테이션 코어의 시작점과 끝점 모두 완벽하게 0px로 테이퍼링 (sin(cFrac * π))
 * - 2중 나선형 수류 회오리 리본 & 고속 유동 기포
 */
function drawWaterGunStream(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  headP: number,
  tailP: number,
  thickness: number,
  alpha: number,
  step: number
) {
  if (alpha <= 0.01 || headP <= tailP) return;

  const dx = tx - ax;
  const dy = ty - ay;
  const fullDist = Math.hypot(dx, dy);
  const mainAngle = Math.atan2(dy, dx);

  const startX = fullDist * tailP;
  const endX = fullDist * headP;
  const len = endX - startX;
  if (len <= 2) return;

  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(mainAngle);

  const startW = thickness * 0.75;
  const endW = thickness * 1.20;

  // 1. 외곽 반투명 하이드로 시스 (Deep Azure Outer Sheath)
  // - [유저 요청]: "물대포 끝 꼬리부분 투명하게"
  // - 꼬리 끝(startX) 완전 투명(0.0) 페이드 적용
  const sheathGrad = ctx.createLinearGradient(startX, 0, endX, 0);
  sheathGrad.addColorStop(0.0, "rgba(2, 132, 199, 0.0)"); // 꼬리 끝: 완전 투명
  sheathGrad.addColorStop(0.20, `rgba(2, 132, 199, ${0.15 * alpha})`);
  sheathGrad.addColorStop(0.50, `rgba(2, 132, 199, ${0.35 * alpha})`);
  sheathGrad.addColorStop(1.0, `rgba(2, 132, 199, ${0.40 * alpha})`);
  ctx.fillStyle = sheathGrad;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += 8) {
    const frac = (x - startX) / len;
    const tailTaper = tailP > 0.05
      ? Math.sin(Math.min(1.0, frac * 3.5) * Math.PI * 0.5)
      : Math.min(1.0, 0.75 + frac * 0.25);
    const w = (startW + (endW - startW) * frac) * 0.65 * tailTaper;
    const wave = Math.sin(x * 0.10 - step * 1.5) * 2.2 * tailTaper;
    if (x === startX) ctx.moveTo(x, -w + wave);
    else ctx.lineTo(x, -w + wave);
  }
  const headR = (startW + (endW - startW)) * 0.65 * (tailP > 0.05 && headP >= 1.0 ? 0.9 : 1.0);
  ctx.arc(endX, 0, headR, -Math.PI / 2, Math.PI / 2);
  for (let x = endX; x >= startX; x -= 8) {
    const frac = (x - startX) / len;
    const tailTaper = tailP > 0.05
      ? Math.sin(Math.min(1.0, frac * 3.5) * Math.PI * 0.5)
      : Math.min(1.0, 0.75 + frac * 0.25);
    const w = (startW + (endW - startW) * frac) * 0.65 * tailTaper;
    const wave = Math.sin(x * 0.10 - step * 1.5 + Math.PI * 0.5) * 2.2 * tailTaper;
    ctx.lineTo(x, w + wave);
  }
  ctx.closePath();
  ctx.fill();

  // 2. 내부 주 수류 기둥 (Vibrant Cyan Hydro Stream)
  // - [유저 요청]: "물대포 끝 꼬리부분 투명하게"
  // - 꼬리 끝(startX)에서 완전 투명(0.0)으로 시작하여 유기적으로 나타나는 반투명 수류 그라디언트
  const streamGrad = ctx.createLinearGradient(startX, 0, endX, 0);
  streamGrad.addColorStop(0.0, "rgba(14, 165, 233, 0.0)"); // 꼬리 끝: 완전 투명 (0.0)
  streamGrad.addColorStop(0.18, `rgba(14, 165, 233, ${0.25 * alpha})`); // 꼬리 점진적 반투명
  streamGrad.addColorStop(0.45, `rgba(14, 165, 233, ${0.80 * alpha})`); // 주 수류 바디
  streamGrad.addColorStop(0.75, `rgba(56, 189, 248, ${0.90 * alpha})`);
  streamGrad.addColorStop(1.0, `rgba(186, 230, 253, ${0.95 * alpha})`);
  ctx.fillStyle = streamGrad;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += 6) {
    const frac = (x - startX) / len;
    const tailTaper = tailP > 0.05
      ? Math.sin(Math.min(1.0, frac * 3.5) * Math.PI * 0.5)
      : Math.min(1.0, 0.75 + frac * 0.25);
    const w = (startW + (endW - startW) * frac) * 0.45 * tailTaper;
    const wave = Math.sin(x * 0.14 - step * 2.0) * 1.8 * tailTaper;
    if (x === startX) ctx.moveTo(x, -w + wave);
    else ctx.lineTo(x, -w + wave);
  }
  const innerHeadR = (startW + (endW - startW)) * 0.45 * (tailP > 0.05 && headP >= 1.0 ? 0.9 : 1.0);
  ctx.arc(endX, 0, innerHeadR, -Math.PI / 2, Math.PI / 2);
  for (let x = endX; x >= startX; x -= 6) {
    const frac = (x - startX) / len;
    const tailTaper = tailP > 0.05
      ? Math.sin(Math.min(1.0, frac * 3.5) * Math.PI * 0.5)
      : Math.min(1.0, 0.75 + frac * 0.25);
    const w = (startW + (endW - startW) * frac) * 0.45 * tailTaper;
    const wave = Math.sin(x * 0.14 - step * 2.0 + Math.PI * 0.6) * 1.8 * tailTaper;
    ctx.lineTo(x, w + wave);
  }
  ctx.closePath();
  ctx.fill();

  // 3. 중심 순백 캐비테이션 코어
  // - [유저 요청]: "물대포 길이 짧게, 중간 흰색깔 투명하게"
  // - 내부 흰색 코어를 75% 이상 투명(transparent)하게 처리하여 푸른 수류가 투명하게 비치도록 연출
  const coreStartX = startX + (tailP > 0.05 ? len * 0.08 : len * 0.03);
  const coreEndX = endX - (headP < 1.0 ? 5 : 3);
  const coreLen = coreEndX - coreStartX;
  if (coreLen > 4) {
    const maxW = Math.min(thickness * 0.22, coreLen * 0.24);
    const headR = maxW;
    const bodyEndX = coreEndX - headR;
    const bodyLen = Math.max(1, bodyEndX - coreStartX);

    const coreGrad = ctx.createLinearGradient(coreStartX, 0, coreEndX, 0);
    coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)"); // 꼬리 끝: 완전 투명
    coreGrad.addColorStop(0.20, `rgba(255, 255, 255, ${0.05 * alpha})`); // 뒤는 얇고 투명한 형태
    coreGrad.addColorStop(0.50, `rgba(255, 255, 255, ${0.12 * alpha})`); // 은은한 반투명 물빛
    coreGrad.addColorStop(0.80, `rgba(255, 255, 255, ${0.20 * alpha})`); // 반투명 순백 광택
    coreGrad.addColorStop(1.0, `rgba(255, 255, 255, ${0.25 * alpha})`); // 전두부도 불투명하지 않고 75% 투명

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(coreStartX, 0); // 꼬리 끝 (얇은 0px 포인트)
    // 윗변: 꼬리(coreStartX) -> 헤드 돔 베이스(bodyEndX)
    for (let x = coreStartX; x <= bodyEndX; x += 4) {
      const u = Math.max(0, Math.min(1.0, (x - coreStartX) / bodyLen));
      // 뒤쪽은 얇 and 앞쪽으로 갈수록 점진적으로 두꺼워지는 곡선
      const w = maxW * Math.pow(u, 0.72);
      const wave = Math.sin(x * 0.16 - step * 2.2) * (1.0 * Math.sin(u * Math.PI));
      ctx.lineTo(x, -w + wave);
    }
    // 전두부 헤드: 앞쪽의 둥근 불릿 돔
    ctx.arc(bodyEndX, 0, maxW, -Math.PI / 2, Math.PI / 2);
    // 아랫변: 헤드 돔 베이스(bodyEndX) -> 꼬리(coreStartX)
    for (let x = bodyEndX; x >= coreStartX; x -= 4) {
      const u = Math.max(0, Math.min(1.0, (x - coreStartX) / bodyLen));
      const w = maxW * Math.pow(u, 0.72);
      const wave = Math.sin(x * 0.16 - step * 2.2 + 0.5) * (1.0 * Math.sin(u * Math.PI));
      ctx.lineTo(x, w + wave);
    }
    ctx.lineTo(coreStartX, 0);
    ctx.closePath();
    ctx.fill();
  }

  // 4. 수류 내부를 고속 이동하는 기포들 (Flowing Bubbles)
  const BUBBLE_COUNT = 3;
  for (let b = 0; b < BUBBLE_COUNT; b++) {
    const bFrac = ((b * 0.33 + step * 0.25) % 1.0);
    const bx = startX + len * bFrac;
    const by = Math.sin(bx * 0.12 + b * 2.1) * (thickness * 0.18);
    const tailBubbleFade = Math.min(1.0, bFrac * 3.5); // 꼬리 부근 기포도 투명 페이드
    drawWaterBubble(ctx, bx, by, 1.8 + (b % 2) * 0.6, alpha * 0.70 * tailBubbleFade);
  }

  // 6. 선단부 비산 물방울 파편
  const HEAD_SPLASH_COUNT = 4;
  for (let h = 0; h < HEAD_SPLASH_COUNT; h++) {
    const hAngle = (h - 1.5) * 0.45 + Math.sin(h * 3.1 + step) * 0.2;
    const hDist = headR * 0.7 + ((h * 5 + step * 6) % 12);
    const hx = endX + Math.cos(hAngle) * hDist;
    const hy = Math.sin(hAngle) * hDist * 0.6;
    const vx = Math.cos(hAngle) * 16;
    const vy = Math.sin(hAngle) * 16;
    const hSize = 1.4 + (h % 2) * 0.6;
    drawWaterDroplet(ctx, hx, hy, vx, vy, hSize, 0.9 * alpha);
  }

  // 5. 머리 부분 흰색 수증기 플룸 (Head Water Vapor Steam)
  // - [유저 요청]: "어? 그 수증기 그대로 머리부분으로 옮겨봐"
  drawWaterGunHeadSteam(ctx, endX, thickness, alpha, step, headP);

  ctx.restore();
}

/**
 * Helper: 대상 격돌 스플래시 및 비산 물방울 파편 (Impact Splash)
 * - isBehind: 후면(Behind) 레이어 여부
 */
function drawWaterGunSplash(
  ctx: any,
  tx: number,
  ty: number,
  splashP: number,
  alpha: number,
  step: number,
  isBehind: boolean
) {
  if (alpha <= 0.01 || splashP <= 0) return;

  ctx.save();

  // 1. 방사형 포물선 비산 물방울 (16개 분할, Behind는 짝수, Front는 홀수)
  const DROPLET_COUNT = 16;
  for (let i = 0; i < DROPLET_COUNT; i++) {
    if (isBehind ? (i % 2 !== 0) : (i % 2 === 0)) continue;

    const baseAngle = (i / DROPLET_COUNT) * Math.PI * 2;
    const angle = baseAngle + Math.sin(i * 3.7) * 0.35;
    const speed = 28 + (i % 5) * 9 + Math.sin(i * 1.8) * 5;
    const dist = speed * splashP;

    // 포물선 중력 적용 (Gravity)
    const gx = Math.cos(angle) * dist;
    const gy = Math.sin(angle) * dist + 0.5 * 160 * (splashP * splashP);

    const dropX = tx + gx;
    const dropY = ty + gy;

    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed + 160 * splashP;

    const dropAlpha = alpha * Math.max(0, 1.0 - splashP * 0.85);
    const dropSize = Math.max(1.2, (4.5 - splashP * 1.8) * (0.8 + (i % 3) * 0.35));

    drawWaterDroplet(ctx, dropX, dropY, vx, vy, dropSize, dropAlpha);
  }

  // 2. 레이어별 분기
  if (isBehind) {
    // [Z축 뒤] 물보라 방사 스파이크 (Splash Burst Spikes)
    const burstCount = 6;
    const burstLen = (22 + Math.sin(step * 1.5) * 5) * Math.min(1.0, splashP * 2.2);
    if (burstLen > 3 && splashP < 0.85) {
      for (let b = 0; b < burstCount; b++) {
        const bAngle = (b / burstCount) * Math.PI * 2 + 0.25;
        const bW = Math.max(1.5, 4.0 * (1.0 - splashP));

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(bAngle);

        // [유저 요청: "튀기는 물에서 border 제거"] -> 외곽 인위적인 테두리 없이 순수 반투명 유체 스파이크만 렌더링
        ctx.fillStyle = b % 2 === 0
          ? `rgba(56, 189, 248, ${0.65 * alpha})`
          : `rgba(186, 230, 253, ${0.75 * alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, -bW);
        ctx.lineTo(burstLen, 0);
        ctx.lineTo(0, bW);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }
  } else {
    // [유저 요청: "동그라미 있잖아 적 스프라이트 바로 위에 중간은 희고 바깥쪽은 파란거 링말고" -> 완전 제거]
    // 적 스프라이트 위에 덮이던 중심부 흰색/파란색 원형 플레어 및 링 완전 배제
    // (전면은 포물선 비산 물방울만 자연스럽게 날아가도록 유지)
  }

  ctx.restore();
}

/**
 * 055: 물대포 Behind 이펙트 렌더러
 * - [유저 요청: 반투명 효과를 Z축 아래(스프라이트 뒷면)로 이동]
 * - 고압 제트 수류 스트림(Stream)을 스프라이트 뒷면 레이어에서 렌더링 -> 스프라이트를 가리지 않고 뒷면으로 통과
 * - 대상 뒤편으로 비산하는 물방울 파편 및 후면 반투명 스플래시 플레어/물안개 연출
 */
export function drawWaterGunBehindEffect(
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
  const step = frame.moveStep || 1;

  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - 4;

  ctx.save();

  // 대상 후면 100% 완전 불투명 비산 물방울 및 스파이크 (스프라이트 뒤쪽 3D 입체감)
  const splashP = frame.splashProgress ?? 0;
  const splashAlpha = frame.splashAlpha ?? 0;
  if (splashAlpha > 0.01 && splashP > 0) {
    drawWaterGunSplash(ctx, tx, ty, splashP, splashAlpha, step, true);
  }

  ctx.restore();
}

/**
 * 055: 물대포 Front 종합 이펙트 렌더러
 * - 고속 제트 수류 스트림(Stream)을 스프라이트 전면에서 직격 (100% 완전 불투명 솔리드)
 * - 시전자 노즐 분출 및 대상 전면 비산 물방울 파편 & 선명한 이중 충격 물결 링
 */
export function drawWaterGunEffect(
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
  const step = frame.moveStep || 1;
  const dir = isP ? 1 : -1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)) + dir * 26;
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - 10;

  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - 4;

  const dx = tx - ax;
  const dy = ty - ay;
  const mainAngle = Math.atan2(dy, dx);

  ctx.save();

  // 1. 고압 제트 수류 스트림 (스프라이트 전면에서 직격 타격 - 100% 완전 불투명 솔리드)
  const headP = frame.streamProgress ?? 0;
  const tailP = frame.streamTailProgress ?? 0;
  const streamAlpha = frame.streamAlpha ?? 0;
  const thickness = frame.streamThickness ?? 18;

  if (streamAlpha > 0.01 && headP > tailP) {
    drawWaterGunStream(ctx, ax, ay, tx, ty, headP, tailP, thickness, streamAlpha, step);
  }

  // 2. 시전자 노즐 수류 분출 (Step 1~3, 100% 완전 불투명)
  const nozzleAlpha = frame.nozzleAlpha ?? 0;
  if (nozzleAlpha > 0.01) {
    drawWaterGunNozzle(ctx, ax, ay, mainAngle, nozzleAlpha, step);
  }

  // 3. 대상 전면 비산 물방울 파편 및 전면 충격 물결 링 (100% 완전 불투명 솔리드)
  const splashP = frame.splashProgress ?? 0;
  const splashAlpha = frame.splashAlpha ?? 0;
  if (splashAlpha > 0.01 && splashP > 0) {
    drawWaterGunSplash(ctx, tx, ty, splashP, splashAlpha, step, false);
  }

  ctx.restore();
}

// ============================================================================
// 056: 하이드로펌프 (Hydro Pump)
// ============================================================================

/**
 * Helper: 시전자 발사구 초고압 수류 소용돌이 흡입 및 압축 (Vortex Charge Intake)
 */
function drawHydroPumpVortexCharge(
  ctx: any,
  ax: number,
  ay: number,
  mainAngle: number,
  alpha: number,
  intensity: number,
  step: number
) {
  if (alpha <= 0.01 || intensity <= 0) return;

  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(mainAngle);

  // 1. 발사구 주변으로 빨려들어오는 8방향 나선형 수류 흡입선 (Suction Spirals)
  const spiralCount = 8;
  for (let i = 0; i < spiralCount; i++) {
    const baseA = (i / spiralCount) * Math.PI * 2 + step * 0.8;
    const maxR = 38 * intensity;
    const minR = 6 * intensity;
    const streakGrad = ctx.createLinearGradient(
      Math.cos(baseA) * maxR, Math.sin(baseA) * maxR,
      Math.cos(baseA + 0.8) * minR, Math.sin(baseA + 0.8) * minR
    );
    streakGrad.addColorStop(0.0, "rgba(56, 189, 248, 0)");
    streakGrad.addColorStop(0.5, `rgba(56, 189, 248, ${0.75 * alpha})`);
    streakGrad.addColorStop(1.0, `rgba(224, 242, 254, ${0.95 * alpha})`);

    ctx.strokeStyle = streakGrad;
    ctx.lineWidth = 2.2 * intensity;
    ctx.beginPath();
    for (let p = 0; p <= 1.0; p += 0.1) {
      const r = maxR - (maxR - minR) * p;
      const a = baseA + p * 1.1;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r * 0.85;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // 2. 고압 압축 수류 링 (수축하는 3중 링)
  for (let rIdx = 0; rIdx < 3; rIdx++) {
    const ringT = (step * 0.35 + rIdx * 0.33) % 1.0;
    const ringR = (34 * (1.0 - ringT) + 4) * intensity;
    const ringAlpha = Math.sin(ringT * Math.PI) * alpha;
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.85 * ringAlpha})`;
    ctx.lineWidth = Math.max(1.5, 3.5 * (1.0 - ringT));
    ctx.beginPath();
    ctx.ellipse(0, 0, ringR * 1.1, ringR, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. 중심부 초고압 물빛 핵 구체 (Core Sphere)
  const coreR = 14 * intensity;
  const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, coreR);
  coreGrad.addColorStop(0.0, `rgba(255, 255, 255, ${1.0 * alpha})`);
  coreGrad.addColorStop(0.35, `rgba(186, 230, 253, ${0.95 * alpha})`);
  coreGrad.addColorStop(0.70, `rgba(14, 165, 233, ${0.80 * alpha})`);
  coreGrad.addColorStop(1.0, "rgba(2, 132, 199, 0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper: 시전자 스프라이트 앞쪽의 고압 수류 집속 원 및 반시계방향 공전 수류 (Revolving Water Focus Ring)
 * - [유저 피드백]: "회전하는 원의 크기는 조금 작게, 그리고 회전하니까 약간 중력에 의해 앞쪽은 둥글고 뒤쪽은 얇아지는 형태를 띄워야"
 * - 시전자 입가(발사구) 바로 앞쪽에 콤팩트한 크기(반경 ~17px)로 전개되는 영롱한 시안/순백 수류 집속 원
 * - 공전하는 수류는 진행 방향(앞쪽)은 표면장력/관성으로 '둥글고 통통한 물방울 머리', 뒤쪽은 유선형으로 '가늘고 얇아지는 꼬리' 형태를 띰
 * - 회전 방향: 완벽한 반시계방향(Counter-Clockwise)
 */
function drawHydroPumpRevolvingWaterRing(
  ctx: any,
  ax: number,
  ay: number,
  mainAngle: number,
  alpha: number,
  step: number
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(ax, ay);

  // 1. [유저 피드백: 원의 크기는 조금 작게] - 반경 약 17px (콤팩트한 집속 링)
  const ringScale = step === 1 ? 0.82 : 1.0;
  const ringR = (17.0 + Math.sin(step * 1.8) * 1.0) * ringScale;

  // 외곽 시안 물빛 글로우 링
  ctx.strokeStyle = `rgba(56, 189, 248, ${0.40 * alpha})`;
  ctx.lineWidth = 4.0 * ringScale;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // 중간 선명한 청량 아쿠아 링
  ctx.strokeStyle = `rgba(14, 165, 233, ${0.80 * alpha})`;
  ctx.lineWidth = 2.2 * ringScale;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // 중심 순백 샤프 링
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * alpha})`;
  ctx.lineWidth = 1.3 * ringScale;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // 링 내부 은은한 수막 렌즈 효과
  const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, ringR);
  innerGrad.addColorStop(0.0, `rgba(224, 242, 254, ${0.28 * alpha})`);
  innerGrad.addColorStop(0.65, `rgba(56, 189, 248, ${0.12 * alpha})`);
  innerGrad.addColorStop(1.0, "rgba(14, 165, 233, 0)");
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.fill();

  // 2. [유저 피드백: 앞쪽은 둥글고 뒤쪽은 얇아지는 유체 눈물방울 형태, 반시계방향 회전]
  // 3갈래의 유선형 수류 아크가 120도 간격으로 원주 위를 공전
  const ORBIT_STREAM_COUNT = 3;
  const rotSpeed = 1.45; // 프레임당 반시계방향 회전 라디안
  const arcSpan = Math.PI * 0.42; // 아크 길이 (~75도)
  const headR = 3.6 * ringScale; // 선두 머리 반폭 (총 너비 ~7.2px의 둥근 머리)
  const SAMPLES = 12;

  for (let i = 0; i < ORBIT_STREAM_COUNT; i++) {
    const baseOffset = i * ((Math.PI * 2) / ORBIT_STREAM_COUNT);
    // 반시계방향: 음수 방향으로 전진
    const headAngle = baseOffset - (step * rotSpeed);
    const tailAngle = headAngle + arcSpan;

    // 머리 중심 좌표 및 벡터
    const hx = Math.cos(headAngle) * ringR;
    const hy = Math.sin(headAngle) * ringR;
    // 반시계방향 진행 접선 벡터 (Y down canvas)
    const tx = Math.sin(headAngle);
    const ty = -Math.cos(headAngle);
    // 원 중심에서 바깥쪽 법선 벡터
    const nx = Math.cos(headAngle);
    const ny = Math.sin(headAngle);

    // 꼬리 끝 좌표 (0px 뾰족한 끝점)
    const tailX = Math.cos(tailAngle) * ringR;
    const tailY = Math.sin(tailAngle) * ringR;

    // 2-1. [앞쪽은 둥글고 뒤쪽은 얇아지는 유선형 수류 바디 (Curved Teardrop Body)]
    ctx.save();
    ctx.beginPath();

    // (A) 외곽 윤곽: 꼬리(u=1, w=0) -> 머리(u=0, w=headR)
    for (let s = SAMPLES; s >= 0; s--) {
      const u = s / SAMPLES; // 1 (tail) -> 0 (head)
      const angle = headAngle + u * arcSpan;
      // 폭 곡선: 머리(u=0)에서 두껍고 둥글다가, 뒤로 갈수록 날렵하게 0으로 얇아짐
      const w = headR * Math.pow(1 - u, 0.85);
      const rOut = ringR + w;
      const px = Math.cos(angle) * rOut;
      const py = Math.sin(angle) * rOut;
      if (s === SAMPLES) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    // (B) 앞쪽 머리: 볼록하고 둥근 물방울 돔 (Rounded Front Dome)
    const outerCorner = { x: hx + nx * headR, y: hy + ny * headR };
    const frontTip = { x: hx + tx * (headR * 1.15), y: hy + ty * (headR * 1.15) };
    const innerCorner = { x: hx - nx * headR, y: hy - ny * headR };

    ctx.bezierCurveTo(
      outerCorner.x + tx * (headR * 0.75), outerCorner.y + ty * (headR * 0.75),
      frontTip.x + nx * (headR * 0.45), frontTip.y + ny * (headR * 0.45),
      frontTip.x, frontTip.y
    );
    ctx.bezierCurveTo(
      frontTip.x - nx * (headR * 0.45), frontTip.y - ny * (headR * 0.45),
      innerCorner.x + tx * (headR * 0.75), innerCorner.y + ty * (headR * 0.75),
      innerCorner.x, innerCorner.y
    );

    // (C) 내곽 윤곽: 머리(u=0, w=headR) -> 꼬리(u=1, w=0)
    for (let s = 1; s <= SAMPLES; s++) {
      const u = s / SAMPLES; // 0 (head) -> 1 (tail)
      const angle = headAngle + u * arcSpan;
      const w = headR * Math.pow(1 - u, 0.85);
      const rIn = ringR - w;
      const px = Math.cos(angle) * rIn;
      const py = Math.sin(angle) * rIn;
      ctx.lineTo(px, py);
    }
    ctx.closePath();

    // 그라데이션 채움: 꼬리(투명 오션블루) -> 머리(눈부신 순백 포말)
    const dropGrad = ctx.createLinearGradient(tailX, tailY, frontTip.x, frontTip.y);
    dropGrad.addColorStop(0.0, `rgba(2, 132, 199, 0.0)`);
    dropGrad.addColorStop(0.35, `rgba(14, 165, 233, ${0.40 * alpha})`);
    dropGrad.addColorStop(0.70, `rgba(56, 189, 248, ${0.85 * alpha})`);
    dropGrad.addColorStop(0.92, `rgba(224, 242, 254, ${0.98 * alpha})`);
    dropGrad.addColorStop(1.0, `rgba(255, 255, 255, ${1.0 * alpha})`);
    ctx.fillStyle = dropGrad;
    ctx.fill();

    ctx.strokeStyle = `rgba(186, 230, 253, ${0.75 * alpha})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 2-2. 둥근 머리 중심 순백 하이라이트 글로우 (원형 점 배제 -> 접선 방향 유선형 타원)
    const headRot = Math.atan2(ty, tx);
    const glowGrad = ctx.createRadialGradient(
      hx + tx * 0.8, hy + ty * 0.8, 0,
      hx + tx * 0.8, hy + ty * 0.8, headR * 0.95
    );
    glowGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.98 * alpha})`);
    glowGrad.addColorStop(0.50, `rgba(224, 242, 254, ${0.80 * alpha})`);
    glowGrad.addColorStop(1.0, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(hx + tx * 0.8, hy + ty * 0.8, headR * 0.95, headR * 0.60, headRot, 0, Math.PI * 2);
    ctx.fill();

    // 2-3. 중심 척추 순백 캐비테이션 샤프 라인 (머리에서 꼬리 쪽으로 날렵하게 뻗어나감)
    ctx.beginPath();
    ctx.arc(0, 0, ringR, headAngle + arcSpan * 0.55, headAngle + 0.05, true);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.90 * alpha})`;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.stroke();

    // 2-4. 둥근 머리에서 반시계방향 접선으로 튕겨나가는 미세 유선형 물방울
    const dropDist = 3.5 + ((i * 2 + step * 4) % 8);
    const dx = frontTip.x + tx * dropDist;
    const dy = frontTip.y + ty * dropDist;
    const dAlpha = Math.max(0, 1 - dropDist / 12) * alpha;
    if (dAlpha > 0.05) {
      drawWaterDroplet(ctx, dx, dy, tx * 30, ty * 30, 1.1, dAlpha);
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Helper: 유기적 롤링 수류 팽창 서지 파동 (Hydro Surge Wave)
 * - [유저 피드백]: "발사되는 중간의 점같은게 완전히 동그라니까 너무 어색하게 느껴짐"
 * - 완전히 동그란 원(Circle)/점(Dot)을 일체 배제하고, 고속 수류의 흐름 방향으로 길쭉하게 뻗어나가는
 *   유선형 파동체, 전방 수류 서지 크레스트(포말 곡면), 초고속 캐비테이션 유선 스트릭으로 렌더링
 */
function drawBillowingWaterPuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  mainAngle: number,
  rollAngle: number,
  alpha: number = 1.0,
  seed: number = 0
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  // 전체 서지 파동을 고압 분사 축선(mainAngle)에 정렬 (X축 = 진행 방향, Y축 = 수직 방향)
  ctx.rotate(mainAngle);

  // 1. 후방으로 길게 늘어나는 유선형 수류 테일 (Streamlined Hydro Body & Tail - 원형 점 배제)
  const bodyLen = radius * 2.2;
  const bodyW = radius * 0.65;
  const rearLen = radius * 1.6;

  const bodyGrad = ctx.createLinearGradient(-rearLen, 0, bodyLen * 0.6, 0);
  bodyGrad.addColorStop(0.0, "rgba(2, 132, 199, 0.0)");
  bodyGrad.addColorStop(0.35, "rgba(14, 165, 233, 0.45)");
  bodyGrad.addColorStop(0.70, "rgba(56, 189, 248, 0.80)");
  bodyGrad.addColorStop(0.95, "rgba(186, 230, 253, 0.90)");
  bodyGrad.addColorStop(1.0, "rgba(224, 242, 254, 0.95)");
  ctx.fillStyle = bodyGrad;

  // 유선형 고속 유체 파동 윤곽 (슬림하고 날렵한 수류)
  ctx.beginPath();
  ctx.moveTo(bodyLen * 0.5, 0);
  ctx.quadraticCurveTo(bodyLen * 0.2, -bodyW, -rearLen, 0);
  ctx.quadraticCurveTo(bodyLen * 0.2, bodyW, bodyLen * 0.5, 0);
  ctx.closePath();
  ctx.fill();

  // 2. [유저 요청: "중간 )는 제거하고"] -> 인위적인 ')' 크레스트 곡선 완전 제거됨

  // 3. 내부 고압 캐비테이션 초고속 선형 스트릭 3줄 (Longitudinal Cavitation Velocity Streaks)
  // 점이나 호(')')가 아닌, 고속 분사 축선을 따라 평행하게 뻗는 샤프한 순백 제트 라인
  const STREAK_OFFSETS = [-bodyW * 0.45, 0, bodyW * 0.45];
  for (let s = 0; s < STREAK_OFFSETS.length; s++) {
    const sY = STREAK_OFFSETS[s] * (0.8 + Math.sin(seed + s * 1.7) * 0.2);
    const sLen = bodyLen * (s === 1 ? 0.9 : 0.65);
    const startX = -sLen * 0.5;
    const endX = sLen * 0.5;

    const streakGrad = ctx.createLinearGradient(startX, 0, endX, 0);
    streakGrad.addColorStop(0.0, "rgba(255, 255, 255, 0)");
    streakGrad.addColorStop(0.3, `rgba(255, 255, 255, ${s === 1 ? 0.95 : 0.75})`);
    streakGrad.addColorStop(0.85, `rgba(224, 242, 254, ${s === 1 ? 0.90 : 0.65})`);
    streakGrad.addColorStop(1.0, "rgba(224, 242, 254, 0)");

    ctx.strokeStyle = streakGrad;
    ctx.lineWidth = Math.max(1.2, (s === 1 ? radius * 0.18 : radius * 0.11));
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(startX, sY);
    ctx.lineTo(endX, sY);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Helper: 직선 선로를 따라 뻗어나가는 반투명 초고압 수류 제트 기둥 (Translucent Hydro Stream Base)
 * - 화염방사와 달리 열기 부력 없이 시전자에서 대상까지 직진하는 초고압 수류
 * - 노즐에서 좁게 시작하여 대상 쪽으로 갈수록 원뿔형으로 팽창
 * - 외곽 심해 오션블루 외피 -> 중간 선명한 시안 제트 빔 -> 중심 순백 캐비테이션 축선
 */
function drawTranslucentHydroStreamBase(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  startP: number,
  endP: number,
  alpha: number,
  thickScale: number = 1.0
) {
  if (alpha <= 0.01 || endP <= startP) return;

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  const SAMPLES = 14;
  const topPtsBlue: { x: number; y: number }[] = [];
  const botPtsBlue: { x: number; y: number }[] = [];
  const topPtsCyan: { x: number; y: number }[] = [];
  const botPtsCyan: { x: number; y: number }[] = [];
  const centerPts: { x: number; y: number }[] = [];

  const bWStart = (8.0 + startP * 6.0) * thickScale;
  const bWEnd = (9.0 + endP * 24.0) * thickScale;

  const cWStart = (5.0 + startP * 4.0) * thickScale;
  const cWEnd = (5.5 + endP * 16.0) * thickScale;

  for (let i = 0; i <= SAMPLES; i++) {
    const s = i / SAMPLES;
    const t = startP + s * (endP - startP);

    // 직진 궤적 (직선 선로)
    const cx = ax + ux * (dist * t);
    const cy = ay + uy * (dist * t);
    centerPts.push({ x: cx, y: cy });

    const bW = bWStart + s * (bWEnd - bWStart);
    topPtsBlue.push({ x: cx - nx * bW, y: cy - ny * bW });
    botPtsBlue.push({ x: cx + nx * bW, y: cy + ny * bW });

    const cW = cWStart + s * (cWEnd - cWStart);
    topPtsCyan.push({ x: cx - nx * cW, y: cy - ny * cW });
    botPtsCyan.push({ x: cx + nx * cW, y: cy + ny * cW });
  }

  const pStart = centerPts[0];
  const pEnd = centerPts[centerPts.length - 1];
  const tipLen = Math.min(26, dist * (endP - startP) * 0.30);
  const tipPt = {
    x: pEnd.x + ux * tipLen,
    y: pEnd.y + uy * tipLen,
  };

  ctx.save();

  // 1. 외곽 오션 블루 수류 외피 (반투명 유체 콘)
  const blueGrad = ctx.createLinearGradient(pStart.x, pStart.y, tipPt.x, tipPt.y);
  if (startP > 0.06) {
    blueGrad.addColorStop(0.0, "rgba(2, 132, 199, 0)");
    blueGrad.addColorStop(0.12, `rgba(2, 132, 199, ${0.30 * alpha})`);
  } else {
    blueGrad.addColorStop(0.0, `rgba(2, 132, 199, ${0.30 * alpha})`);
  }
  blueGrad.addColorStop(0.60, `rgba(2, 132, 199, ${0.28 * alpha})`);
  blueGrad.addColorStop(0.85, `rgba(14, 165, 233, ${0.15 * alpha})`);
  blueGrad.addColorStop(1.0, "rgba(14, 165, 233, 0)");

  ctx.fillStyle = blueGrad;
  ctx.beginPath();
  ctx.moveTo(topPtsBlue[0].x, topPtsBlue[0].y);
  for (let i = 1; i <= SAMPLES; i++) {
    ctx.lineTo(topPtsBlue[i].x, topPtsBlue[i].y);
  }
  ctx.quadraticCurveTo(pEnd.x, pEnd.y, tipPt.x, tipPt.y);
  ctx.quadraticCurveTo(pEnd.x, pEnd.y, botPtsBlue[SAMPLES].x, botPtsBlue[SAMPLES].y);
  for (let i = SAMPLES - 1; i >= 0; i--) {
    ctx.lineTo(botPtsBlue[i].x, botPtsBlue[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 2. 중간 시안/아쿠아 내부 제트 빔
  const cyanGrad = ctx.createLinearGradient(pStart.x, pStart.y, tipPt.x, tipPt.y);
  if (startP > 0.06) {
    cyanGrad.addColorStop(0.0, "rgba(14, 165, 233, 0)");
    cyanGrad.addColorStop(0.12, `rgba(14, 165, 233, ${0.45 * alpha})`);
  } else {
    cyanGrad.addColorStop(0.0, `rgba(14, 165, 233, ${0.45 * alpha})`);
  }
  cyanGrad.addColorStop(0.60, `rgba(56, 189, 248, ${0.42 * alpha})`);
  cyanGrad.addColorStop(0.88, `rgba(56, 189, 248, ${0.20 * alpha})`);
  cyanGrad.addColorStop(1.0, "rgba(56, 189, 248, 0)");

  ctx.fillStyle = cyanGrad;
  ctx.beginPath();
  ctx.moveTo(topPtsCyan[0].x, topPtsCyan[0].y);
  for (let i = 1; i <= SAMPLES; i++) {
    ctx.lineTo(topPtsCyan[i].x, topPtsCyan[i].y);
  }
  ctx.quadraticCurveTo(pEnd.x, pEnd.y, tipPt.x, tipPt.y);
  ctx.quadraticCurveTo(pEnd.x, pEnd.y, botPtsCyan[SAMPLES].x, botPtsCyan[SAMPLES].y);
  for (let i = SAMPLES - 1; i >= 0; i--) {
    ctx.lineTo(botPtsCyan[i].x, botPtsCyan[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 3. 중심 초고압 순백 캐비테이션 코어 축선 (Needle Cavitation Line)
  const lineGrad = ctx.createLinearGradient(pStart.x, pStart.y, tipPt.x, tipPt.y);
  if (startP > 0.06) {
    lineGrad.addColorStop(0.0, "rgba(255, 255, 255, 0)");
    lineGrad.addColorStop(0.12, `rgba(255, 255, 255, ${0.85 * alpha})`);
  } else {
    lineGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.85 * alpha})`);
  }
  lineGrad.addColorStop(0.70, `rgba(255, 255, 255, ${0.75 * alpha})`);
  lineGrad.addColorStop(0.92, `rgba(224, 242, 254, ${0.25 * alpha})`);
  lineGrad.addColorStop(1.0, "rgba(224, 242, 254, 0)");

  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = (4.5 + endP * 3.5) * thickScale;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(centerPts[0].x, centerPts[0].y);
  for (let i = 1; i <= SAMPLES; i++) {
    ctx.lineTo(centerPts[i].x, centerPts[i].y);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper: 초고압 수류 제트 기둥 주변에 뿜어져 나오는 부드러운 물안개/수증기 (Hydro Vapor Steam Plumes)
 * - [유저 피드백]: "중간중간 안개같은 (수증기) 넣어줘"
 * - 인위적인 선이나 경계선 없이, 수류 제트 축선을 따라 부드럽게 피어오르는 반투명 소프트 물안개/수증기 플룸
 */
function drawHydroPumpVaporMist(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  startP: number,
  endP: number,
  alpha: number,
  frameStep: number,
  thickScale: number = 1.0
) {
  if (alpha <= 0.01 || endP <= startP) return;

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;

  const mainAngle = Math.atan2(dy, dx);
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  // 수류 중간중간에 피어오르는 10개의 부드러운 물안개/수증기 클러스터
  const MIST_COUNT = 10;
  for (let m = 0; m < MIST_COUNT; m++) {
    const mBaseFrac = m / (MIST_COUNT - 1);
    // 수류 축선을 따라 분사되는 위치
    const mt = startP + mBaseFrac * (endP - startP);
    if (mt < 0.08 || mt > 1.05) continue;

    // [유저 요청: "수증기 물줄기쪽으로 좀 더 모아주고"]
    // - 수류 축선에 거의 밀착(lateral 2~5px 이내)하여 물줄기를 직접 감싸며 흐름
    const sign = (m % 2 === 0) ? 1 : -1;
    const drift = Math.sin(mt * Math.PI * 3.0 + frameStep * 1.5 + m * 2.0) * (1.2 + mt * 2.0);
    const lateral = (sign * (1.5 + mt * 3.5) + drift) * thickScale;

    const mx = ax + ux * (dist * mt) + nx * lateral;
    const my = ay + uy * (dist * mt) + ny * lateral;

    // 노즐 근처에서 대상 쪽으로 수류 폭에 맞춰 밀착 팽창하는 안개 구름
    const mistR = (13 + mt * 19) * thickScale;

    // [유저 요청: "수증기 투명도 좀만 더 낮춰봐"] -> 투명도를 좀 더 낮춰(불투명도 추가 상향 0.85) 더욱 뽀얗고 짙은 수증기
    let mistAlpha = alpha * 0.85;
    if (mt < startP + 0.08) {
      mistAlpha *= Math.max(0, (mt - startP) / 0.08);
    } else if (mt > endP - 0.08) {
      mistAlpha *= Math.max(0, (endP - mt) / 0.08);
    }
    if (mistAlpha <= 0.01) continue;

    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(mainAngle + Math.sin(m * 1.8 + frameStep * 0.8) * 0.20);

    // 뽀얗고 진한 순백 수증기 래디얼 그라데이션 (외곽은 0으로 자연스럽게 소멸)
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, mistR);
    grad.addColorStop(0.0, `rgba(255, 255, 255, ${Math.min(1.0, mistAlpha * 1.05)})`); // 중심 진한 순백 수증기 코어
    grad.addColorStop(0.35, `rgba(230, 246, 255, ${mistAlpha * 0.90})`); // 뽀얀 하늘빛 수증기
    grad.addColorStop(0.70, `rgba(186, 230, 253, ${mistAlpha * 0.50})`); // 부드러운 물안개 외곽
    grad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)"); // 경계선 없이 완전 투명 페이드

    ctx.fillStyle = grad;
    ctx.beginPath();
    // 물줄기 흐름 방향으로 늘어난 고밀도 유선형 수증기 플룸
    ctx.ellipse(0, 0, mistR * 1.55, mistR * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Helper: 화염방사 패턴 기반 고압 직선 수류 제트 캐논 종합 렌더러 (Hydro Pump Torrent Stream)
 * - 시전자에서 대상까지 직진하는 반투명 초고압 수류 베이스 빔
 * - 그 위를 타고 쇄도하는 11개의 롤링 회전 순백/시안 포말 구름 클러스터
 * - 물줄기 축선에 밀착하여 피어오르는 뽀얗고 진한 수증기 플룸
 * - 외곽으로 거세게 날리는 날카로운 물보라 촉수 (Hydro Tendrils)
 * - 사방으로 튀는 순백/시안 물방울 파티클
 */
function drawHydroPumpTorrent(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  headProgress: number,
  tailProgress: number = 0.0,
  thickness: number = 52,
  alpha: number = 1.0,
  frameStep: number = 1
) {
  if (alpha <= 0.01 || headProgress <= 0 || headProgress <= tailProgress) return;

  const startP = Math.max(0, tailProgress);
  const endP = Math.min(1.15, headProgress);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;

  const mainAngle = Math.atan2(dy, dx);
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  // 두께 스케일 팩터 (기준 두께: 52px)
  const thickScale = Math.max(0.4, Math.min(1.8, thickness / 52));

  // 1. 직선 선로를 따라 뻗어나가는 반투명 초고압 수류 제트 베이스 빔
  drawTranslucentHydroStreamBase(ctx, ax, ay, tx, ty, startP, endP, alpha, thickScale);

  // 2. 전방 쇄도 유체 수류 구름 클러스터 - 11개 롤링 순백 포말 & 시안 유체
  const BURST_SPACING = 0.10;
  const flowAdvance = ((frameStep - 3) * 0.14) % BURST_SPACING;
  const activeEnd = Math.min(1.08, endP);

  for (let k = 0; k < 11; k++) {
    const t = activeEnd - flowAdvance - k * BURST_SPACING;
    if (t < startP - 0.03 || t > endP + 0.02) continue;

    // 직진 축선 위 유기적 미세 난류 (좌우 진동)
    const sinWave = Math.sin(t * Math.PI * 3.0 - frameStep * 1.6) * (t * 6.0);
    const jiggle = Math.sin(k * 2.5 + frameStep * 1.8) * (1.5 + t * 2.2);

    const px = ax + ux * (dist * t) + nx * (sinWave + jiggle);
    const py = ay + uy * (dist * t) + ny * (sinWave + jiggle);

    // 원뿔형 슬림 고속 수류 팽창 (두께 파라미터에 따라 유동적으로 신축)
    const puffR = (8.5 + Math.pow(Math.min(1.15, Math.max(0, t)), 0.72) * 29.0) * thickScale;

    // 전진하면서 회전하는 다이내믹 롤링 앵글
    const rollAngle = -frameStep * 1.5 - k * 1.3;

    let puffAlpha = alpha * 0.90;
    // 시전자 입구 페이드인 & 선두 도달 페이드아웃
    if (t < startP + 0.07) {
      puffAlpha *= Math.max(0, (t - startP) / 0.07);
    } else if (t > endP - 0.08) {
      puffAlpha *= Math.max(0, (endP - t) / 0.08);
    }

    drawBillowingWaterPuff(ctx, px, py, puffR, mainAngle, rollAngle, puffAlpha, k + frameStep);
  }

  // 3. [유저 요청: "수증기 물줄기쪽으로 좀 더 모아주고 투명도 낮춰줘"]
  // - 물줄기 축선에 밀착하여 수류 위로 뽀얗고 짙게 피어오르는 수증기/물안개 플룸
  drawHydroPumpVaporMist(ctx, ax, ay, tx, ty, startP, endP, alpha, frameStep, thickScale);

  // 4. 외곽으로 거세게 날리는 날카로운 물보라 촉수 (Hydro Tendrils - 7개)
  const TENDRIL_COUNT = 7;
  for (let j = 0; j < TENDRIL_COUNT; j++) {
    const lt = startP + (j / (TENDRIL_COUNT - 1)) * (endP - startP);
    if (lt < 0.12 || lt > 1.0) continue;

    const isTop = j % 2 === 0;
    const sign = isTop ? 1 : -1;
    const sinWave = Math.sin(lt * Math.PI * 3.0 - frameStep * 1.6) * (lt * 6.0);
    const halfW = (6.0 + Math.pow(Math.min(1.2, lt), 0.75) * 20.0) * thickScale;

    const bx = ax + ux * (dist * lt) + nx * (sinWave + sign * halfW);
    const by = ay + uy * (dist * lt) + ny * (sinWave + sign * halfW);

    const tendrilLen = (12 + lt * 14) * thickScale;
    // 공기 저항으로 뒤쪽으로 휘감기며 흩뿌려짐
    const tipX = bx - ux * (tendrilLen * 0.85) + nx * (sign * (tendrilLen * 0.55));
    const tipY = by - uy * (tendrilLen * 0.85) + ny * (sign * (tendrilLen * 0.55));

    const tendrilGrad = ctx.createLinearGradient(bx, by, tipX, tipY);
    tendrilGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.85 * alpha})`);
    tendrilGrad.addColorStop(0.35, `rgba(56, 189, 248, ${0.55 * alpha})`);
    tendrilGrad.addColorStop(0.70, `rgba(14, 165, 233, ${0.25 * alpha})`);
    tendrilGrad.addColorStop(1.0, `rgba(2, 132, 199, 0.0)`);

    ctx.fillStyle = tendrilGrad;
    ctx.beginPath();
    ctx.moveTo(bx - ux * 4, by - uy * 4);
    ctx.quadraticCurveTo(bx + nx * (sign * 6), by + ny * (sign * 6), tipX, tipY);
    ctx.quadraticCurveTo(bx + ux * 4, by + uy * 4, bx + ux * 6, by + uy * 6);
    ctx.closePath();
    ctx.fill();
  }

  // 5. [유저 요청: "중간 )는 제거하고"] -> 괄호/호 형태를 띠던 충격파 링 완전 제거됨 (부드러운 물안개 수증기로 대체)

  // 6. 사방으로 흩날리는 미세 고속 물방울 (Water Droplets & Sprays - 유선형 수적으로 완전 대체)
  const DROP_COUNT = 10;
  for (let p = 0; p < DROP_COUNT; p++) {
    const pt = startP + (p / (DROP_COUNT - 1)) * (endP - startP);
    if (pt < 0.12 || pt > 1.05) continue;

    const pSign = (p % 2 === 0) ? 1 : -1;
    const sinWave = Math.sin(pt * Math.PI * 3.0 - frameStep * 1.6) * (pt * 6.0);
    const pDist = (sinWave + (12 + pt * 24) * pSign + Math.sin(p * 2 + frameStep) * 6) * thickScale;
    const spX = ax + ux * (dist * pt) + nx * pDist;
    const spY = ay + uy * (dist * pt) + ny * pDist;

    const dropAlpha = Math.max(0.2, 1.0 - Math.pow(pt, 1.1) * 0.45);
    // 진행 방향(ux, uy)을 따라 고속 비산하는 유선형 수적 (동그란 점 완전 배제)
    const vx = ux * 85 + nx * (pSign * 16);
    const vy = uy * 85 + ny * (pSign * 16);
    const dSize = 1.4 + (p % 3) * 0.5;
    drawWaterDroplet(ctx, spX, spY, vx, vy, dSize, dropAlpha * alpha);
  }

  ctx.restore();
}

/**
 * Helper: 대상 격돌 수압 폭발 및 바닥 수면 파문 (Hydro Impact)
 * - isBehind: 대상 등 뒤의 은은한 수압 물안개 돔 및 후면 비산 물방울
 * - !isBehind: 전면 물보라 플레어, 이중 충격 물결 링, 바닥 수면 웅덩이 파문, 20개 포물선 비산 수적
 */
function drawHydroPumpImpact(
  ctx: any,
  tx: number,
  ty: number,
  splashP: number,
  alpha: number,
  step: number,
  isBehind: boolean
) {
  if (alpha <= 0.01 || splashP <= 0) return;

  ctx.save();

  if (isBehind) {
    // =========================================================================
    // [후면 레이어 (Behind)]: 대상 등 뒤의 은은한 수압 물안개 돔 및 후면 비산 수적
    // =========================================================================
    const mistR = 55 + splashP * 35;
    const mistGrad = ctx.createRadialGradient(tx, ty - 10, 8, tx, ty - 10, mistR);
    mistGrad.addColorStop(0.0, `rgba(186, 230, 253, ${0.40 * alpha * (1 - splashP * 0.6)})`);
    mistGrad.addColorStop(0.55, `rgba(56, 189, 248, ${0.20 * alpha * (1 - splashP * 0.6)})`);
    mistGrad.addColorStop(1.0, "rgba(2, 132, 199, 0)");
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.arc(tx, ty - 10, mistR, 0, Math.PI * 2);
    ctx.fill();

    // 후면 비산 수적 12개
    const BACK_DROP_COUNT = 12;
    for (let i = 0; i < BACK_DROP_COUNT; i++) {
      const baseAngle = (i / BACK_DROP_COUNT) * Math.PI * 2;
      const angle = baseAngle + Math.sin(i * 3.1) * 0.30;
      const speed = 30 + (i % 4) * 10 + Math.sin(i * 1.6) * 6;
      const dist = speed * splashP;

      const gx = Math.cos(angle) * dist;
      const gy = Math.sin(angle) * dist + 0.5 * 140 * (splashP * splashP);

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed + 140 * splashP;

      const dropAlpha = alpha * Math.max(0, 1.0 - splashP * 0.85);
      const dropSize = Math.max(1.4, (4.8 - splashP * 2.0) * (0.8 + (i % 3) * 0.35));

      drawWaterDroplet(ctx, tx + gx, ty + gy, vx, vy, dropSize, dropAlpha * 0.75);
    }
  } else {
    // =========================================================================
    // [전면 레이어 (Front)]: 바닥 수면 파문, 충격 물결 링, 전면 플레어, 20개 비산 파편
    // =========================================================================
    // 1. 바닥 수면 웅덩이 파문 (Ground Puddle & Concentric Ripples at ty + 16)
    const puddleY = ty + 16;
    for (let rIdx = 0; rIdx < 3; rIdx++) {
      const ripT = Math.max(0, Math.min(1.0, splashP * 1.3 - rIdx * 0.22));
      if (ripT > 0 && ripT < 1.0) {
        const ripW = 28 + ripT * 62;
        const ripH = ripW * 0.35;
        const ripAlpha = Math.sin(ripT * Math.PI) * alpha * 0.75;

        ctx.save();
        ctx.strokeStyle = `rgba(186, 230, 253, ${ripAlpha})`;
        ctx.lineWidth = Math.max(1.2, 3.2 * (1 - ripT));
        ctx.beginPath();
        ctx.ellipse(tx, puddleY, ripW, ripH, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(56, 189, 248, ${ripAlpha * 0.55})`;
        ctx.lineWidth = Math.max(1.0, 5.0 * (1 - ripT));
        ctx.beginPath();
        ctx.ellipse(tx, puddleY, ripW * 0.88, ripH * 0.88, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. [유저 요청: "적 스프라이트 바로 위에 중간은 희고 바깥쪽은 파란거 링말고", "하이드로펌프도" -> 완전 제거]
    // 적 스프라이트 위에 표시되던 2중 충격파 링 및 중심부 흰색/파란색 원형 플레어 완전 제거
    // (바닥 수면 파문과 20개 비산 물방울만 자연스럽게 연출)

    // 4. [20개 전면 포물선 비산 수적 (20 Parabolic Spray Droplets)]
    const SPLASH_DROP_COUNT = 20;
    for (let i = 0; i < SPLASH_DROP_COUNT; i++) {
      const dropAngle = (i / SPLASH_DROP_COUNT) * Math.PI * 2 + Math.sin(i * 3.7 + step) * 0.25;
      const baseSpeed = 38 + ((i * 19 + step * 7) % 55);
      const dP = Math.min(1.0, splashP * 1.3);

      const gravity = 48 * dP * dP;
      const px = tx + Math.cos(dropAngle) * baseSpeed * dP * 1.25;
      const py = ty + Math.sin(dropAngle) * baseSpeed * dP * 0.85 + gravity;

      const vx = Math.cos(dropAngle) * baseSpeed;
      const vy = Math.sin(dropAngle) * baseSpeed + 35 * dP;

      const dropAlpha = Math.sin(Math.min(1.0, splashP * 1.2) * Math.PI) * alpha;
      const dropSize = 2.0 + (i % 4) * 0.7;

      drawWaterDroplet(ctx, px, py, vx, vy, dropSize, dropAlpha * 0.90);
    }
  }

  ctx.restore();
}

/**
 * 056: 하이드로펌프 Behind 이펙트 렌더러
 * - [유저 요청: "하이드로 펌프 화면 필터 파란빛 적용해주고"]
 * - [5세대 레퍼런스 이미지 완벽 재현]:
 *   1. 배틀필드 배경 전체에 깊고 청량한 심해/아쿠아 블루 화면 틴트
 *   2. 레퍼런스 이미지 특유의 '가로 수포(버블) 스트리머 라인' 5줄 전개
 *   3. 중심 수류 궤적을 감싸는 래디얼 앰비언트 워터 글로우
 *   4. 대상 뒤편 초대형 수압 폭발 및 물안개 돔 (isBehind 임팩트)
 */
export function drawHydroPumpBehindEffect(
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
  const step = frame.moveStep || 1;

  // 1. [유저 요청: 화면 필터 파란빛]
  const bgBlueAlpha = frame.bgBlueAlpha ?? (
    step === 1 ? 0.06 :
    step === 2 ? 0.12 :
    step === 3 ? 0.20 :
    step === 4 ? 0.28 :
    (step >= 5 && step <= 10) ? 0.32 :
    step === 11 ? 0.24 :
    step === 12 ? 0.16 :
    step === 13 ? 0.08 :
    step === 14 ? 0.03 : 0
  );

  if (bgBlueAlpha > 0) {
    ctx.save();
    // 1-1. 배틀 아레나 전체 청량한 심해 블루 틴트
    ctx.fillStyle = `rgba(3, 105, 161, ${bgBlueAlpha})`;
    ctx.fillRect(-4000, -4000, 10000, 10000);

    // 1-2. 중심 수류 궤적을 감싸는 래디얼 앰비언트 워터 글로우
    const midX = (attackerPos.x + targetPos.x) / 2;
    const midY = (attackerPos.y + targetPos.y) / 2;
    const waterGlow = ctx.createRadialGradient(midX, midY, 30, midX, midY, 360);
    waterGlow.addColorStop(0, `rgba(56, 189, 248, ${bgBlueAlpha * 0.45})`);
    waterGlow.addColorStop(0.60, `rgba(14, 165, 233, ${bgBlueAlpha * 0.25})`);
    waterGlow.addColorStop(1, `rgba(3, 105, 161, 0)`);
    ctx.fillStyle = waterGlow;
    ctx.fillRect(-4000, -4000, 10000, 10000);

    // 1-3. 은은한 수평 수류 유속 라인 (유저 요청: 동그란 반투명 원들 완전 제거, 깨끗한 블루 필터 유지)
    const LINE_COUNT = 4;
    const startY = midY - 75;
    for (let l = 0; l < LINE_COUNT; l++) {
      const lineY = startY + l * 50;
      const lineAlpha = bgBlueAlpha * (l % 2 === 0 ? 0.25 : 0.15);

      ctx.strokeStyle = `rgba(224, 242, 254, ${lineAlpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-4000, lineY);
      ctx.lineTo(6000, lineY);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 2. 대상 뒤편 간헐천 수압 폭발 및 물안개 돔 (Step 5~11)
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - 6;

  const splashP = frame.splashProgress ?? 0;
  const splashAlpha = frame.splashAlpha ?? 0;

  if (splashAlpha > 0.01 && splashP > 0) {
    drawHydroPumpImpact(ctx, tx, ty, splashP, splashAlpha, step, true);
  }
}

/**
 * 056: 하이드로펌프 Front 종합 이펙트 렌더러
 * - [유저 요청: "하이드로 펌프 화면 필터 파란빛 적용해주고 추가적으로 화염방사처럼 직선 선로에 물 같은 느낌나게"]
 * - [유저 추가 피드백: "기술 시전하는동안 스프라이트 앞쪽에 원, 그리고 그 원에 그 원을 따라서 도는 물들 이펙트 (회전은 반시계방향)"]
 * - 0. 전면 앰비언트 블루 필터
 * - 1. 시전자 고압 볼텍스 수류 흡입/응축 (Step 1~2)
 * - 2. 화염방사 패턴의 웅장한 직선 수류 제트 캐논 (Step 3~10)
 * - 3. 스프라이트 앞쪽 고압 원 및 반시계방향 공전 수류 이펙트 (Step 2~10)
 * - 4. 대상 전면 간헐천 폭발, 2중 충격파 링, 바닥 수면 파문, 20개 포물선 비산 수적 (Step 5~12)
 */
export function drawHydroPumpEffect(
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
  const step = frame.moveStep || 1;
  const dir = isP ? 1 : -1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)) + dir * 28;
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - 10;

  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - 6;

  const dx = tx - ax;
  const dy = ty - ay;
  const mainAngle = Math.atan2(dy, dx);

  ctx.save();

  // 0. 전면 앰비언트 블루 워시 (화염방사의 frontAmbientAlpha와 동일한 일체감)
  const frontAmbientAlpha = frame.frontAmbientAlpha ?? (
    step === 2 ? 0.03 :
    step === 3 ? 0.06 :
    step === 4 ? 0.10 :
    (step >= 5 && step <= 10) ? 0.14 :
    step === 11 ? 0.09 :
    step === 12 ? 0.04 : 0
  );

  if (frontAmbientAlpha > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(14, 165, 233, ${frontAmbientAlpha})`;
    ctx.fillRect(-4000, -4000, 10000, 10000);
    ctx.restore();
  }

  // 1. 화염방사 메커니즘을 계승한 초고압 직선 수류 제트 캐논 (Step 3~11)
  const headP = frame.streamProgress ?? 0;
  const tailP = frame.streamTailProgress ?? 0;
  const streamAlpha = frame.streamAlpha ?? 0;
  const thickness = frame.streamThickness ?? 52;

  if (streamAlpha > 0.01 && headP > tailP) {
    drawHydroPumpTorrent(ctx, ax, ay, tx, ty, headP, tailP, thickness, streamAlpha, step);
  }

  // 2. [유저 요청]: 하이드로펌프 시작할 때부터 해당 순환 원 나오게 (기존 흡입 소용돌이 대신)
  // Step 1부터 시전자 스프라이트 앞쪽에 형성되어 Step 11까지 맹렬하게 반시계방향 공전
  const ringAlpha = frame.ringAlpha ?? (
    step === 1 ? 0.85 :
    (step >= 2 && step <= 9) ? 1.0 :
    step === 10 ? 0.80 :
    step === 11 ? 0.40 : 0
  );
  if (ringAlpha > 0.01) {
    drawHydroPumpRevolvingWaterRing(ctx, ax, ay, mainAngle, ringAlpha, step);
  }

  // 4. 대상 전면 간헐천 폭발, 충격파 링, 바닥 수면 파문, 비산 파편 (Step 5~12)
  const splashP = frame.splashProgress ?? 0;
  const splashAlpha = frame.splashAlpha ?? 0;
  if (splashAlpha > 0.01 && splashP > 0) {
    drawHydroPumpImpact(ctx, tx, ty, splashP, splashAlpha, step, false);
  }

  ctx.restore();
}

