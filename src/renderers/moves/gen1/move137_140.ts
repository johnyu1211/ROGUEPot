// ============================================================================
// 🎮 ROGUEPot Move Animation Renderer: No.137 ~ No.140
// 137: 뱀눈초리 (Glare)
// 138: 꿈먹기 (Dream Eater)
// 139: 독가스 (Poison Gas)
// 140: 구슬던지기 (Barrage)
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";

// ============================================================================
// 📍 공통 헬퍼: 암전 오버레이
// ============================================================================
function drawDimOverlay(ctx: any, alpha: number, color: string = "rgba(10, 8, 20, 1.0)") {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = color;
  ctx.fillRect(-6000, -6000, 14000, 14000);
  ctx.restore();
}

// ============================================================================
// 🐍 137: 뱀눈초리 (Glare)
// ============================================================================
/**
 * 뱀눈초리 5세대 공식 고증 붉은 뱀 눈동자 (Snake Slit Eyes)
 * - [첨부 이미지 100% 고증]: 붉은색 아몬드 눈 윤곽 + 중앙 올리브/황록색 세로 슬릿 동공
 */
export function drawSnakeEye(
  ctx: any,
  ex: number,
  ey: number,
  width: number,
  height: number,
  openProg: number, // 0.0 ~ 1.0 (눈꺼풀 열림)
  alpha: number = 1.0,
  isLeft: boolean = true
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(ex, ey);
  if (!isLeft) {
    ctx.scale(-1, 1);
  }
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const halfW = width * 0.5;
  const curH = height * Math.max(0.04, openProg);

  // 1. 눈이 감겨있을 때 (붉은색 실선)
  if (openProg <= 0.08) {
    ctx.strokeStyle = "rgba(220, 38, 38, 0.95)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-halfW, -curH * 0.2);
    ctx.quadraticCurveTo(0, 0, halfW, curH * 0.28);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // 2. 첨부 이미지 고증 날카로운 붉은 뱀눈 아몬드 패스
  ctx.beginPath();
  // 좌측 외곽 끝 (날카롭게 위쪽을 향함)
  ctx.moveTo(-halfW, -height * 0.18 * openProg);
  // 상단 높은 아치 곡선
  ctx.quadraticCurveTo(-width * 0.05, -curH * 0.65, halfW, height * 0.25 * openProg);
  // 하단 부드러운 곡선
  ctx.quadraticCurveTo(0, curH * 0.45, -halfW, -height * 0.18 * openProg);
  ctx.closePath();

  // 3. 붉은색 반투명 안구 채우기 (첨부 이미지 100% 고증: rgba(165, 20, 20, 0.88))
  ctx.fillStyle = "rgba(165, 20, 20, 0.88)";
  ctx.fill();

  // 외곽 날카로운 붉은 테두리
  ctx.strokeStyle = "rgba(140, 15, 15, 0.95)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 4. 중앙 세로 슬릿 동공 (첨부 이미지의 올리브/황록색 슬릿 동공)
  if (openProg > 0.15) {
    const pupilP = (openProg - 0.15) / 0.85;
    const pupilW = 4.8 * pupilP;
    const pupilH = (curH * 0.70) * pupilP;

    // 동공 은은한 황록색 글로우
    ctx.save();
    ctx.fillStyle = "rgba(189, 217, 31, 0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 0, pupilW * 1.6, pupilH * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 동공 본체 (황록색/올리브 옐로우)
    ctx.fillStyle = "#BDD91F";
    ctx.beginPath();
    ctx.ellipse(0, 0, pupilW, pupilH, 0, 0, Math.PI * 2);
    ctx.fill();

    // 동공 내부 세로 코어
    ctx.fillStyle = "#E4F362";
    ctx.beginPath();
    ctx.ellipse(0, 0, pupilW * 0.45, pupilH * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 🌟 137: 뱀눈초리 메인 이펙트 렌더러
 * - [유저 요구사항]:
 *   1) 암전효과필터 적용
 *   2) 아래에서부터 붉은색 실선이 올라옴
 *   3) 눈을 뜨면서 첨부 이미지의 붉은 뱀눈(황록색 슬릿 동공) 완성
 */
export function drawGlareEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  // 1. 암전 효과 필터 적용 (0.75 암전)
  let dimA = 0;
  if (step === 1) dimA = 0.55;
  else if (step === 2 || step === 3 || step === 4) dimA = 0.78;
  else if (step === 5) dimA = 0.38;
  drawDimOverlay(targetCtx, dimA, "rgba(12, 10, 10, 0.82)");

  // 2. 눈 중심 위치 계산 (전장 중앙 상공에서 대면)
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  const eyeCenterX = (ax + tx) * 0.5 + (isP ? 10 : -10);
  const eyeBaseY = Math.min(ay, ty) - 18;

  // 3. 아래에서부터 붉은색 실선 상승 ➔ 눈 개안 시퀀스
  let riseOffsetY = 0;
  let openProg = 0;
  let eyeAlpha = 1.0;

  if (step === 1) {
    // 1단계: 아래에서 붉은색 실선이 솟아오름
    riseOffsetY = 40;
    openProg = 0.0;
    eyeAlpha = 0.85;
  } else if (step === 2) {
    // 2단계: 실선이 눈 위치에 안착
    riseOffsetY = 0;
    openProg = 0.05;
    eyeAlpha = 0.95;
  } else if (step === 3) {
    // 3단계: 눈을 뜨기 시작함
    riseOffsetY = 0;
    openProg = 0.55;
    eyeAlpha = 1.0;
  } else if (step === 4) {
    // 4단계: 눈을 완전히 뜨며 첨부 이미지 뱀눈 완성
    riseOffsetY = 0;
    openProg = 1.0;
    eyeAlpha = 1.0;
  } else if (step === 5) {
    // 5단계: 응시 유지 및 페이드아웃
    riseOffsetY = 0;
    openProg = 1.0;
    eyeAlpha = 0.60;
  }

  if (step >= 1 && step <= 5) {
    const eyeSpacing = 42;
    const eyeW = 54;
    const eyeH = 28;
    const curY = eyeBaseY + riseOffsetY;

    // 좌안 & 우안 렌더링
    drawSnakeEye(targetCtx, eyeCenterX - eyeSpacing, curY, eyeW, eyeH, openProg, eyeAlpha, true);
    drawSnakeEye(targetCtx, eyeCenterX + eyeSpacing, curY, eyeW, eyeH, openProg, eyeAlpha, false);
  }
}

// ============================================================================
// 🔮 138: 꿈먹기 (Dream Eater)
// ============================================================================
/**
 * 꿈먹기 몽환의 정기 영혼 구체 (Dream Spirit Orbs)
 */
export function drawDreamSpiritOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number = 1.0,
  pulse: number = 0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 외곽 보랏빛 몽환 안개 글로우
  const r = radius * (1.0 + Math.sin(pulse) * 0.12);
  const auraGrad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.8);
  auraGrad.addColorStop(0.0, "rgba(232, 121, 249, 0.85)"); // 밝은 마젠타/라벤더
  auraGrad.addColorStop(0.45, "rgba(168, 85, 247, 0.50)"); // 사이킥 퍼플
  auraGrad.addColorStop(1.0, "rgba(126, 34, 206, 0.0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 내부 유백색 꿈 코어
  const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
  coreGrad.addColorStop(0.0, "#FFFFFF"); // 초고열 순백
  coreGrad.addColorStop(0.55, "#F5D0FE"); // 연보라
  coreGrad.addColorStop(1.0, "#C084FC"); // 바이올렛
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // 신비로운 십자 별빛
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🌟 138: 꿈먹기 메인 이펙트 렌더러
 */
export function drawDreamEaterEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - 10;

  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - 12;

  // 1. 몽환적 사이킥 딥 인디고 암전
  let dimA = 0;
  if (step === 1) dimA = 0.45;
  else if (step === 2 || step === 3) dimA = 0.72;
  else if (step === 4) dimA = 0.50;
  else if (step === 5) dimA = 0.20;
  drawDimOverlay(targetCtx, dimA, "rgba(24, 9, 44, 0.85)");

  // 2. 꿈의 정기 구체 비행 스트림 (step 2: 추출 ➔ step 3: 시전자로 흡수 비행 ➔ step 4: 시전자 융합)
  if (step >= 2 && step <= 4) {
    const orbCount = 3;
    for (let o = 0; o < orbCount; o++) {
      let t = 0;
      if (step === 2) {
        // 대상 몸체에서 솟아오름
        t = 0.15 + o * 0.08;
      } else if (step === 3) {
        // 시전자를 향해 S자 나선 궤적 비행
        t = 0.45 + o * 0.18;
      } else if (step === 4) {
        // 시전자 몸체에 도달하여 흡수
        t = 0.88 + o * 0.05;
      }
      t = Math.min(1.0, Math.max(0, t));

      // 부드러운 아크 나선 곡선 좌표
      const curX = tx + (ax - tx) * t;
      const wave = Math.sin(t * Math.PI * 3 + o * 2.0) * (26 * (1.0 - t * 0.6));
      const curY = ty + (ay - ty) * t + wave - Math.sin(t * Math.PI) * 35;

      const orbR = 8.5 + Math.sin(o * 1.5 + t * 4) * 2;
      const orbA = step === 4 ? (1.0 - t) * 1.2 : 0.95;

      drawDreamSpiritOrb(targetCtx, curX, curY, orbR, orbA, t * 6 + o);
    }
  }

  // 3. 대상 악몽 타격 왜곡 링 (step 2~3)
  if (step === 2 || step === 3) {
    targetCtx.save();
    const shockP = step === 2 ? 0.45 : 0.85;
    const sR = 25 + shockP * 35;
    targetCtx.strokeStyle = `rgba(192, 132, 252, ${(1.0 - shockP) * 0.8})`;
    targetCtx.lineWidth = 2.5;
    targetCtx.beginPath();
    targetCtx.arc(tx, ty, sR, 0, Math.PI * 2);
    targetCtx.stroke();
    targetCtx.restore();
  }

  // 4. 시전자 치유 및 회복 광채 (step 4~5)
  if (step >= 4 && step <= 5) {
    const healP = step === 4 ? 0.5 : 1.0;
    const healA = (1.0 - (step - 4) * 0.55);

    targetCtx.save();
    targetCtx.globalAlpha = healA;

    // 시전자 주변 에메랄드-골드 치유 아우라
    const hGrad = targetCtx.createRadialGradient(ax, ay, 10, ax, ay, 45);
    hGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.85)");
    hGrad.addColorStop(0.4, "rgba(52, 211, 153, 0.65)"); // 에메랄드
    hGrad.addColorStop(1.0, "rgba(16, 185, 129, 0.0)");
    targetCtx.fillStyle = hGrad;
    targetCtx.beginPath();
    targetCtx.arc(ax, ay, 45, 0, Math.PI * 2);
    targetCtx.fill();

    // 상승하는 작은 치유 십자별 (+)
    for (let c = 0; c < 4; c++) {
      const cx = ax + ((c % 2 === 0 ? 1 : -1) * (14 + c * 6));
      const cy = ay - (healP * 30 + c * 8);
      targetCtx.fillStyle = "#A7F3D0";
      targetCtx.fillRect(cx - 1.5, cy - 6, 3, 12);
      targetCtx.fillRect(cx - 6, cy - 1.5, 12, 3);
    }

    targetCtx.restore();
  }
}

// ============================================================================
// ☠️ 139: 독가스 (Poison Gas)
// ============================================================================
/**
 * 독가스 유기적 소프트 블렌딩 뭉게구름 로브
 */
const POISON_GAS_LOBES = [
  { ox: -12, oy: -8, r: 24, base: "#7E22CE", shadow: "#4C1D95", light: "#C084FC" },
  { ox: 14, oy: -6, r: 28, base: "#6B21A8", shadow: "#3B0764", light: "#A855F7" },
  { ox: 0, oy: 10, r: 22, base: "#581C87", shadow: "#2E1065", light: "#9333EA" },
  { ox: -20, oy: 12, r: 18, base: "#7E22CE", shadow: "#4C1D95", light: "#C084FC" },
  { ox: 22, oy: 8, r: 20, base: "#6B21A8", shadow: "#3B0764", light: "#A855F7" },
  { ox: 8, oy: -18, r: 16, base: "#9333EA", shadow: "#581C87", light: "#D8B4FE" },
];

export function drawPoisonGasCloudCluster(
  ctx: any,
  cx: number,
  cy: number,
  scale: number,
  alpha: number = 1.0,
  drift: number = 0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  for (let i = 0; i < POISON_GAS_LOBES.length; i++) {
    const lobe = POISON_GAS_LOBES[i];
    const lx = cx + (lobe.ox + Math.sin(drift + i) * 6) * scale;
    const ly = cy + (lobe.oy + Math.cos(drift + i) * 4) * scale;
    const lr = lobe.r * scale;

    // 소프트 블렌딩 그라데이션 (100% 외곽 투명화)
    const gGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
    gGrad.addColorStop(0.0, lobe.base);
    gGrad.addColorStop(0.45, lobe.base);
    gGrad.addColorStop(0.75, lobe.shadow);
    gGrad.addColorStop(0.92, "rgba(88, 28, 135, 0.35)");
    gGrad.addColorStop(1.0, "rgba(88, 28, 135, 0.0)");

    ctx.fillStyle = gGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.fill();

    // 상단 연보라 하이라이트
    const hlr = lr * 0.45;
    const hlx = lx - lr * 0.22;
    const hly = ly - lr * 0.22;
    const hlGrad = ctx.createRadialGradient(hlx, hly, 0, hlx, hly, hlr);
    hlGrad.addColorStop(0.0, lobe.light);
    hlGrad.addColorStop(0.50, lobe.light);
    hlGrad.addColorStop(1.0, "rgba(216, 180, 254, 0.0)");
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.arc(hlx, hly, hlr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 🌟 139: 독가스 메인 이펙트 렌더러
 */
export function drawPoisonGasEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - 6;

  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - 8;

  // 1. 시전자 입가 독가스 분출 (step 1~2)
  if (step === 1) {
    drawPoisonGasCloudCluster(targetCtx, ax + (isP ? 20 : -20), ay, 0.45, 0.80, 0.5);
  } else if (step === 2) {
    // 상대방으로 날아가는 중간 독가스 스트림
    const midX = ax + (tx - ax) * 0.5;
    const midY = ay + (ty - ay) * 0.5 + 4;
    drawPoisonGasCloudCluster(targetCtx, midX, midY, 0.85, 0.88, 1.2);
  } else if (step === 3 || step === 4 || step === 5) {
    // 2. 상대방 전신 독가스 완전 차폐 및 팽창 (step 3~4)
    const scale = step === 3 ? 1.15 : (step === 4 ? 1.35 : 1.45);
    const alpha = step === 3 ? 0.90 : (step === 4 ? 0.85 : 0.45);
    drawPoisonGasCloudCluster(targetCtx, tx, ty, scale, alpha, step * 1.5);

    // 3. 독가스 기포 비산 (Poison Bubbles)
    for (let b = 0; b < 5; b++) {
      const bSeed = b * 1.8 + step * 2;
      const bx = tx + Math.sin(bSeed) * (26 * scale * 0.6);
      const by = ty + Math.cos(bSeed) * (18 * scale * 0.6) - (step - 3) * 10;
      const br = 3.5 + (b % 3) * 1.5;

      targetCtx.save();
      targetCtx.globalAlpha = alpha * 0.85;
      targetCtx.fillStyle = "rgba(192, 132, 252, 0.65)";
      targetCtx.strokeStyle = "#F5D0FE";
      targetCtx.lineWidth = 1.0;
      targetCtx.beginPath();
      targetCtx.arc(bx, by, br, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.stroke();
      targetCtx.restore();
    }
  }
}

// ============================================================================
// 🥚 140: 구슬던지기 (Barrage)
// ============================================================================
/**
 * 둥근 구슬/알 렌더러 (Round Orb with 3D Specular Highlight)
 */
export function drawBarrageOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number = 8.5,
  rotation: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 외곽 그림자 림
  ctx.fillStyle = "#365314"; // 다크 올리브/그린
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 내부 부드러운 3D 구체 그라데이션 (아이보리-연두빛)
  const orbGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 1, 0, 0, radius);
  orbGrad.addColorStop(0.0, "#FFFFFF"); // 스펙큘러 하이라이트
  orbGrad.addColorStop(0.25, "#ECFCCB"); // 밝은 연두빛 아이보리
  orbGrad.addColorStop(0.65, "#BEF264"); // 라임 그린
  orbGrad.addColorStop(1.0, "#65A30D"); // 짙은 녹색 음영
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 1.0, 0, Math.PI * 2);
  ctx.fill();

  // 3. 상단 광택 스팟
  ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
  ctx.beginPath();
  ctx.ellipse(-radius * 0.35, -radius * 0.35, radius * 0.35, radius * 0.20, -0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 구슬 타격 충격파 링 및 파편 비산 (Impact Burst)
 */
export function drawBarrageImpact(
  ctx: any,
  tx: number,
  ty: number,
  progress: number,
  alpha: number = 1.0,
  isFinish: boolean = false
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const easeOut = 1 - Math.pow(1 - progress, 2);
  const maxR = (isFinish ? 38 : 24) * easeOut;

  // 1. 충격파 링
  ctx.strokeStyle = isFinish ? "#FEF08A" : "#FDE047";
  ctx.lineWidth = isFinish ? 3.0 : 2.0;
  ctx.beginPath();
  ctx.ellipse(tx, ty, maxR, maxR * 0.75, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 사방으로 튀는 작은 구슬 파편 (Shards)
  const shardCount = isFinish ? 8 : 4;
  for (let s = 0; s < shardCount; s++) {
    const sAngle = (s * Math.PI * 2) / shardCount + 0.4;
    const sDist = maxR * (1.1 + (s % 2) * 0.3);
    const sx = tx + Math.cos(sAngle) * sDist;
    const sy = ty + Math.sin(sAngle) * (sDist * 0.75);

    ctx.fillStyle = s % 2 === 0 ? "#FFFFFF" : "#BEF264";
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(0.5, (isFinish ? 3.0 : 2.0) * (1.0 - progress * 0.8)), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// 4발의 개별 탄착 좌표 오프셋
const BARRAGE_SHOT_OFFSETS = [
  { ox: -10, oy: -12 }, // 1발: 상단
  { ox: 12, oy: 8 },    // 2발: 하단
  { ox: -6, oy: 10 },   // 3발: 측면
  { ox: 0, oy: -2 },    // 4발: 정중앙 피니시
];

/**
 * 🌟 140: 구슬던지기 메인 이펙트 렌더러
 */
export function drawBarrageEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP, isHit } = drawCtx;
  const step = frame.moveStep || 1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const launchX = ax + (isP ? 20 : -20);
  const launchY = ay + (isP ? -10 : 6);

  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  // ========================================================================
  // [PART 1: 타격 시 타격 링 & 파편]
  // ========================================================================
  if (isHit && (step === 3 || step === 5 || step === 7 || step === 9)) {
    let hitIdx = 0;
    let isFinish = false;
    let hitProg = 0.5;

    if (step === 3) { hitIdx = 0; hitProg = 0.55; }
    else if (step === 5) { hitIdx = 1; hitProg = 0.55; }
    else if (step === 7) { hitIdx = 2; hitProg = 0.55; }
    else if (step === 9) { hitIdx = 3; hitProg = 0.65; isFinish = true; }

    const conf = BARRAGE_SHOT_OFFSETS[hitIdx];
    const impX = tx + (isP ? conf.ox : -conf.ox);
    const impY = ty + conf.oy;

    drawBarrageImpact(targetCtx, impX, impY, hitProg, 1.0, isFinish);
  }

  // ========================================================================
  // [PART 2: 구슬 비행 시퀀스 (포물선 아크)]
  // ========================================================================
  let activeFlyShot = -1;
  let flyT = 0;

  if (step === 1) { activeFlyShot = 0; flyT = 0.28; }
  else if (step === 2) { activeFlyShot = 0; flyT = 0.85; }
  else if (step === 3) { activeFlyShot = 1; flyT = 0.28; }
  else if (step === 4) { activeFlyShot = 1; flyT = 0.85; }
  else if (step === 5) { activeFlyShot = 2; flyT = 0.28; }
  else if (step === 6) { activeFlyShot = 2; flyT = 0.85; }
  else if (step === 7) { activeFlyShot = 3; flyT = 0.28; }
  else if (step === 8) { activeFlyShot = 3; flyT = 0.88; }

  if (activeFlyShot >= 0) {
    const conf = BARRAGE_SHOT_OFFSETS[activeFlyShot];
    const destX = tx + (isP ? conf.ox : -conf.ox);
    const destY = ty + conf.oy;

    const curX = launchX + (destX - launchX) * flyT;
    const arcH = Math.sin(flyT * Math.PI) * 42; // 포물선 도약 고도
    const curY = launchY + (destY - launchY) * flyT - arcH;

    const orbRot = flyT * Math.PI * 4;
    const orbR = activeFlyShot === 3 ? 10.5 : 9.0;

    drawBarrageOrb(targetCtx, curX, curY, orbR, orbRot, 1.0);
  }
}
