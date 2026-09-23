// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { drawTackleEffect, drawTackleBehindEffect } from "./move033_036.js";

/**
 * 만화/애니메이션 스타일의 몽글몽글한 순백 증기 구름 퍼프 (Steam Puff Cloud)
 */
function drawSingleSteamPuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.02 || radius <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 1. 외곽 부드러운 화이트 증기 오라
  const haloR = radius * 1.35;
  const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
  haloGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  haloGrad.addColorStop(0.5, "rgba(241, 245, 249, 0.75)");
  haloGrad.addColorStop(1, "rgba(226, 232, 240, 0.0)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 3중 융합 몽글몽글 구름 클러스터 (메인 중앙구 + 좌/우 서브구)
  const subR = radius * 0.68;
  ctx.fillStyle = "#FFFFFF";

  // 중앙 메인 원
  ctx.beginPath();
  ctx.arc(cx, cy - radius * 0.1, radius, 0, Math.PI * 2);
  ctx.fill();

  // 좌측 서브 원
  ctx.beginPath();
  ctx.arc(cx - radius * 0.55, cy + radius * 0.2, subR, 0, Math.PI * 2);
  ctx.fill();

  // 우측 서브 원
  ctx.beginPath();
  ctx.arc(cx + radius * 0.55, cy + radius * 0.2, subR, 0, Math.PI * 2);
  ctx.fill();

  // 3. 증기 볼륨 음영 (하단 소프트 그레이 테두리 라인)
  ctx.strokeStyle = "rgba(203, 213, 225, 0.45)";
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(cx - radius * 0.55, cy + radius * 0.2, subR, 0.4 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + radius * 0.55, cy + radius * 0.2, subR, 0.1 * Math.PI, 0.6 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

/**
 * 117: 참기 (Bide) 1턴 차징 연출
 * - 시전 포켓몬 머리 위에서 순차적으로 솟구쳐 피어오르는 3개의 순백 증기 퍼프
 * - 1번(좌상단), 2번(중앙상단), 3번(우상단)
 */
export function drawBideChargeEffect(
  ctx: any,
  casterPos: { x: number; y: number },
  progress: number = 0.5,
  isPlayer: boolean = true
) {
  const cx = casterPos.x;
  // 포켓몬 머리 위 기준점 (체구 상단)
  const headY = casterPos.y - (isPlayer ? 38 : 30);

  ctx.save();

  // 바닥 붉은 텐션 반사광
  const groundY = casterPos.y + (isPlayer ? 22 : 18);
  const glowAlpha = Math.sin(progress * Math.PI) * 0.25;
  const gGrad = ctx.createRadialGradient(cx, groundY, 0, cx, groundY, 32);
  gGrad.addColorStop(0, `rgba(239, 68, 68, ${glowAlpha})`);
  gGrad.addColorStop(0.6, `rgba(220, 38, 38, ${glowAlpha * 0.5})`);
  gGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
  ctx.fillStyle = gGrad;
  ctx.beginPath();
  ctx.ellipse(cx, groundY, 36, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3개의 증기 구름 타임라인 정의
  // puff1: progress 0.10 ~ 0.55
  // puff2: progress 0.35 ~ 0.80
  // puff3: progress 0.60 ~ 1.00
  const puffs = [
    { start: 0.10, end: 0.55, dirX: -14, dirY: -26, maxR: 8.5 },
    { start: 0.35, end: 0.80, dirX: 0, dirY: -34, maxR: 10.0 },
    { start: 0.60, end: 1.00, dirX: 14, dirY: -26, maxR: 8.5 },
  ];

  for (let i = 0; i < puffs.length; i++) {
    const pInfo = puffs[i];
    if (progress < pInfo.start || progress > pInfo.end) continue;

    const localT = (progress - pInfo.start) / (pInfo.end - pInfo.start);
    // 이징: 초반에 빠르게 분출된 후 서서히 감속
    const easeT = 1 - Math.pow(1 - localT, 2);

    const px = cx + pInfo.dirX * easeT;
    const py = headY + pInfo.dirY * easeT;

    // 크기는 점점 커짐
    const r = 3.0 + (pInfo.maxR - 3.0) * Math.sin(localT * Math.PI * 0.85);

    // 투명도: 솟구칠 때 빠르게 1.0 ➔ 상공에서 서서히 페이드아웃
    const alpha = localT < 0.25
      ? localT / 0.25
      : 1.0 - (localT - 0.25) / 0.75;

    // 메인 증기 구름
    drawSingleSteamPuff(ctx, px, py, r, alpha);

    // 증기를 따라붙는 미세 잔류 증기 방울
    if (localT > 0.15 && localT < 0.85) {
      const trailAlpha = alpha * 0.65;
      const trailX = cx + pInfo.dirX * (easeT * 0.45);
      const trailY = headY + pInfo.dirY * (easeT * 0.45);
      ctx.fillStyle = `rgba(255, 255, 255, ${trailAlpha})`;
      ctx.beginPath();
      ctx.arc(trailX, trailY, Math.max(1.0, r * 0.35), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 117: 참기 (Bide) 2턴 공격 연출 (몸통박치기 전면 타격)
 */
export function drawBideAttackEffect(
  ctx: any,
  targetPos: { x: number; y: number },
  attackerPos?: { x: number; y: number },
  step: number = 3,
  progress: number = 0.65,
  isPlayer: boolean = true
) {
  drawTackleEffect(ctx, targetPos, attackerPos, step, progress, isPlayer);
}

/**
 * 117: 참기 (Bide) 2턴 공격 연출 (몸통박치기 후방 대시 스트림)
 */
export function drawBideAttackBehindEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  step: number = 2,
  progress: number = 0.5,
  isPlayer: boolean = true
) {
  drawTackleBehindEffect(ctx, attackerPos, targetPos, step, progress, isPlayer);
}

// ============================================================================
// No. 118: 손가락흔들기 (Metronome)
// ============================================================================

/**
 * 음표 (♪) 파티클
 */
function drawMusicalNote(
  ctx: any,
  x: number,
  y: number,
  size: number = 10,
  color: string = "#FDE047",
  alpha: number = 1.0,
  rotation: number = 0
) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  if (rotation !== 0) ctx.rotate(rotation);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  ctx.fillStyle = color;
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 1.2;

  // 음표 헤드 (타원)
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.38, size * 0.26, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 음표 기둥 (스템)
  ctx.beginPath();
  ctx.moveTo(size * 0.28, -size * 0.05);
  ctx.lineTo(size * 0.28, -size * 0.95);
  // 음표 꼬리 (깃)
  ctx.quadraticCurveTo(size * 0.75, -size * 0.85, size * 0.65, -size * 0.45);
  ctx.stroke();

  ctx.restore();
}

/**
 * 4방향 레트로 다이아몬드 마법 별빛 (✦)
 */
function drawMetronomeStar(
  ctx: any,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  color: string = "#FFFFFF",
  alpha: number = 1.0,
  rotation: number = 0
) {
  if (alpha <= 0.02 || outerR <= 0.5) return;
  ctx.save();
  ctx.translate(cx, cy);
  if (rotation !== 0) ctx.rotate(rotation);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  ctx.fillStyle = color;
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  const points = 4;
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * 메트로놈 만화풍 거대 순백 포인팅 핸드 (Pointing Glove Hand)
 * - (0, 0) 기준은 손목 중앙 피벗
 * - 위로 뻗은 검지 손가락 (끝점 y ≈ -48)
 * - 둥글게 말려있는 세 손가락(중지, 약지, 소지) & 접힌 엄지
 */
function drawPointingGloveHand(
  ctx: any,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 1. 부드러운 노란빛 외곽 글로우
  ctx.shadowColor = "rgba(253, 224, 71, 0.45)";
  ctx.shadowBlur = 10;

  // 2. 장갑 바디 (손목 ~ 손바닥 ~ 검지손가락 ~ 접힌 손가락 외곽선)
  ctx.beginPath();
  // 손목 좌하단
  ctx.moveTo(-9, 4);
  // 손바닥 좌측 외곽 (엄지 쪽)
  ctx.quadraticCurveTo(-14, -6, -11, -16);
  // 접힌 엄지손가락 외곽
  ctx.quadraticCurveTo(-14, -20, -10, -25);
  ctx.quadraticCurveTo(-7, -26, -5, -22);
  // 검지 손가락 좌측 라인 (위로 쭉 뻗음)
  ctx.lineTo(-5, -45);
  // 검지 손가락 끝 둥근 캡
  ctx.arc(0, -45, 5.0, Math.PI, 0, false);
  // 검지 손가락 우측 라인 (내려옴)
  ctx.lineTo(5, -22);
  // 접힌 중지/약지/소지 3중 핑거 융기 (우측 볼륨)
  ctx.arc(9, -20, 4.5, -Math.PI * 0.4, Math.PI * 0.3, false);
  ctx.arc(10, -12, 4.5, -Math.PI * 0.3, Math.PI * 0.4, false);
  ctx.arc(8, -4, 4.2, -Math.PI * 0.2, Math.PI * 0.5, false);
  // 손목 우하단
  ctx.quadraticCurveTo(8, 3, 7, 4);
  // 손목 밑단 커브
  ctx.quadraticCurveTo(0, 7, -9, 4);
  ctx.closePath();

  // 바디 그라데이션 채우기 (상단 순백 -> 하단 소프트 라벤더/블루그레이 음영)
  const handGrad = ctx.createLinearGradient(0, -50, 0, 7);
  handGrad.addColorStop(0, "#FFFFFF");
  handGrad.addColorStop(0.65, "#FFFFFF");
  handGrad.addColorStop(1, "#E2E8F0");
  ctx.fillStyle = handGrad;
  ctx.fill();

  // 글로우 해제 후 선명한 아웃라인
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  // 3. 접힌 손가락 내부 주름선 디테일
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#64748B";

  // 중지/약지 주름
  ctx.beginPath();
  ctx.moveTo(4, -16);
  ctx.quadraticCurveTo(7, -17, 10, -16);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(3, -9);
  ctx.quadraticCurveTo(6, -10, 9, -9);
  ctx.stroke();

  // 접힌 엄지 주름
  ctx.beginPath();
  ctx.moveTo(-5, -21);
  ctx.quadraticCurveTo(-4, -15, -7, -12);
  ctx.stroke();

  // 검지 손가락 하이라이트 글린트 (왼쪽 가장자리 순백 하이라이트)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-3, -43);
  ctx.lineTo(-3, -24);
  ctx.stroke();

  ctx.restore();
}

/**
 * 118: 손가락흔들기 (Metronome) 연출
 * - 시전자 정면/머리 앞 거대 순백 포인팅 핸드가 메트로놈처럼 좌우 째깍째깍 스윙
 * - 궤적을 따라 피어오르는 마법 별빛(✦)과 음표(♪) 파티클
 * - 마지막 중앙 정지 순간 손끝에서 결정 스타버스트 섬광 발산
 */
export function drawMetronomeEffect(
  ctx: any,
  casterPos: { x: number; y: number },
  progress: number = 0.5,
  isPlayer: boolean = true
) {
  // 시전자 포켓몬 정면 상단 (머리/가슴 앞)
  const pivotX = casterPos.x + (isPlayer ? 8 : -8);
  const pivotY = casterPos.y - (isPlayer ? 28 : 22);

  ctx.save();

  // 1. 진자 스윙 각도 계산 (Angle in degrees)
  // progress: 0.0 ~ 1.0
  // t: 0.00 ~ 0.22 : 0 -> +28 deg (우측)
  // t: 0.22 ~ 0.50 : +28 -> -28 deg (좌측)
  // t: 0.50 ~ 0.74 : -28 -> +24 deg (우측)
  // t: 0.74 ~ 0.88 : +24 -> 0 deg (중앙 수렴)
  // t: 0.88 ~ 1.00 : 0 deg (중앙 고정 & 섬광)
  let angleDeg = 0;
  if (progress < 0.22) {
    const p = progress / 0.22;
    angleDeg = Math.sin(p * Math.PI * 0.5) * 28;
  } else if (progress < 0.50) {
    const p = (progress - 0.22) / 0.28;
    angleDeg = 28 * Math.cos(p * Math.PI);
  } else if (progress < 0.74) {
    const p = (progress - 0.50) / 0.24;
    angleDeg = -28 * Math.cos(p * Math.PI) * (24 / 28);
  } else if (progress < 0.88) {
    const p = (progress - 0.74) / 0.14;
    angleDeg = 24 * (1 - Math.sin(p * Math.PI * 0.5));
  } else {
    angleDeg = 0;
  }

  const angleRad = (angleDeg * Math.PI) / 180;
  const handScale = isPlayer ? 1.28 : 1.12;
  const armR = 50 * handScale;

  // 2. 배경 메트로놈 궤적 호선 (Pendulum Motion Arc Guide)
  const arcAlpha = Math.min(0.38, Math.sin(progress * Math.PI) * 0.45);
  if (arcAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = arcAlpha;
    ctx.strokeStyle = "rgba(253, 224, 71, 0.65)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const startA = -Math.PI * 0.5 - (30 * Math.PI) / 180;
    const endA = -Math.PI * 0.5 + (30 * Math.PI) / 180;
    ctx.arc(pivotX, pivotY, armR, startA, endA);
    ctx.stroke();
    ctx.restore();
  }

  // 3. 메인 만화풍 포인팅 핸드 렌더링 (유저 요청: 손가락 모양만 비활성화)
  // drawPointingGloveHand(ctx, handScale, handAlpha);


  // 4. 손끝(Fingertip) 글로벌 좌표
  const tipX = pivotX + Math.sin(angleRad) * armR;
  const tipY = pivotY - Math.cos(angleRad) * armR;

  // 5. 스윙 도중 방출되는 마법 별빛 & 음표 파티클
  const starEvents = [
    { spawn: 0.15, life: 0.28, xOff: 18, yOff: -12, r: 7.5, color: "#FDE047" },
    { spawn: 0.35, life: 0.26, xOff: -14, yOff: -10, r: 6.8, color: "#38BDF8" },
    { spawn: 0.52, life: 0.28, xOff: -22, yOff: -14, r: 8.0, color: "#F472B6" },
    { spawn: 0.68, life: 0.26, xOff: 16, yOff: -12, r: 7.2, color: "#4ADE80" },
    { spawn: 0.80, life: 0.20, xOff: 4, yOff: -16, r: 9.0, color: "#FFFFFF" },
  ];

  for (const se of starEvents) {
    if (progress >= se.spawn && progress <= se.spawn + se.life) {
      const st = (progress - se.spawn) / se.life;
      const sAlpha = Math.sin(st * Math.PI);
      const sRot = st * Math.PI;
      const curX = pivotX + se.xOff + Math.sin(st * Math.PI) * 4;
      const curY = pivotY - armR * 0.95 + se.yOff - st * 12;
      drawMetronomeStar(ctx, curX, curY, se.r, se.r * 0.35, se.color, sAlpha, sRot);
    }
  }

  // 2개의 음표 이벤트:
  const noteEvents = [
    { spawn: 0.20, life: 0.32, xOff: 24, yOff: -26, size: 10, color: "#FBBF24", rot: 0.2 },
    { spawn: 0.54, life: 0.32, xOff: -26, yOff: -28, size: 11, color: "#EC4899", rot: -0.25 },
  ];

  for (const ne of noteEvents) {
    if (progress >= ne.spawn && progress <= ne.spawn + ne.life) {
      const nt = (progress - ne.spawn) / ne.life;
      const nAlpha = Math.sin(nt * Math.PI);
      const curX = pivotX + ne.xOff + Math.sin(nt * Math.PI * 2) * 5;
      const curY = pivotY - armR * 0.85 + ne.yOff - nt * 16;
      drawMusicalNote(ctx, curX, curY, ne.size, ne.color, nAlpha, ne.rot);
    }
  }

  // 6. 클라이맥스 섬광 (Ding! Flash at center lock: progress >= 0.84)
  if (progress >= 0.84) {
    const flashT = (progress - 0.84) / 0.16; // 0.0 ~ 1.0
    const flashAlpha = Math.sin(flashT * Math.PI * 0.85);
    const starR = 8.0 + flashT * 18.0;

    // 중앙 섬광 코어 링
    ctx.save();
    ctx.globalAlpha = flashAlpha * 0.85;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(tipX, tipY, flashT * 18.0, 0, Math.PI * 2);
    ctx.stroke();

    // 8방향 스타버스트 섬광
    drawMetronomeStar(ctx, tipX, tipY, starR, starR * 0.25, "#FFFFFF", flashAlpha, flashT * 0.5);
    drawMetronomeStar(ctx, tipX, tipY, starR * 0.65, starR * 0.18, "#FEF08A", flashAlpha * 0.9, -flashT * 0.5);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 만화풍 물방울/식은땀 (Sweatdrop 💧)
 */
function drawSweatdrop(ctx: any, cx: number, cy: number, size: number, alpha: number) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 물방울 본체 (눈물방울 형태 Bezier 곡선)
  const grad = ctx.createRadialGradient(cx - size * 0.2, cy - size * 0.2, 1, cx, cy, size * 1.2);
  grad.addColorStop(0, "#93C5FD");
  grad.addColorStop(0.5, "#3B82F6");
  grad.addColorStop(1.0, "#1D4ED8");

  ctx.fillStyle = grad;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  // 뾰족한 위쪽 끝점에서 시작
  ctx.moveTo(cx, cy - size * 1.1);
  // 우측 하단 둥근 곡선
  ctx.bezierCurveTo(cx + size * 0.85, cy - size * 0.2, cx + size * 0.85, cy + size * 0.8, cx, cy + size * 0.8);
  // 좌측 하단 둥근 곡선 후 상단 복귀
  ctx.bezierCurveTo(cx - size * 0.85, cy + size * 0.8, cx - size * 0.85, cy - size * 0.2, cx, cy - size * 1.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 하이라이트 글린트
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.beginPath();
  ctx.arc(cx - size * 0.28, cy + size * 0.1, size * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 120: 자폭 (Self-Destruct) 배경 이펙트 (폭심지 바닥 그을림 & 방사형 지면 균열)
 */
export function drawSelfDestructBehindEffect(
  ctx: any,
  blastPos: { x: number; y: number },
  step: number,
  progress: number
) {
  if (step < 3) return; // 기폭 단계 이전에는 바닥 그을림 없음

  const t = Math.max(0, Math.min(1.0, (progress - 0.70) / 0.30));
  const cx = blastPos.x;
  const cy = blastPos.y + 16; // 지면 플랫폼 위치

  ctx.save();

  // 1. 바닥 그을림 크레이터 (Scorched Ground Crater)
  const maxRx = 95;
  const maxRy = 34;
  const currentRx = maxRx * Math.min(1.0, t * 2.5);
  const currentRy = maxRy * Math.min(1.0, t * 2.5);
  const scorchAlpha = (1.0 - t * 0.35) * 0.82;

  if (currentRx > 2) {
    const sGrad = ctx.createRadialGradient(cx, cy, currentRx * 0.1, cx, cy, currentRx);
    sGrad.addColorStop(0, `rgba(15, 15, 18, ${scorchAlpha})`);
    sGrad.addColorStop(0.45, `rgba(30, 27, 24, ${scorchAlpha * 0.85})`);
    sGrad.addColorStop(0.80, `rgba(60, 35, 20, ${scorchAlpha * 0.45})`);
    sGrad.addColorStop(1.0, "rgba(20, 20, 20, 0)");

    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, currentRx, currentRy, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 방사형 지면 균열선 (Crater Fissure Lines with glowing lava glow)
  if (t > 0.05) {
    const crackAlpha = Math.max(0, 1.0 - t * 1.1);
    if (crackAlpha > 0.02) {
      ctx.strokeStyle = `rgba(249, 115, 22, ${crackAlpha * 0.9})`;
      ctx.lineWidth = 2.0;

      const cracks = [
        [0.2, 45, 16],
        [-0.4, -42, 14],
        [0.8, 55, -12],
        [-0.9, -50, -10],
        [0.05, 12, 22],
        [-0.15, -18, 20],
      ];

      for (const [midAngle, ex, ey] of cracks) {
        const xEnd = cx + ex;
        const yEnd = cy + ey;
        const cGrad = ctx.createLinearGradient(cx, cy, xEnd, yEnd);
        cGrad.addColorStop(0.0, "rgba(249, 115, 22, 0.0)"); // 안쪽 투명
        cGrad.addColorStop(0.40, `rgba(249, 115, 22, ${crackAlpha * 0.35})`);
        cGrad.addColorStop(1.0, `rgba(249, 115, 22, ${crackAlpha * 0.75})`); // 바깥쪽 반투명

        ctx.strokeStyle = cGrad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const mx = cx + ex * 0.5 + midAngle * 10;
        const my = cy + ey * 0.5 + midAngle * 5;
        ctx.lineTo(mx, my);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

/**
 * 120: 자폭 (Self-Destruct) 전면 메인 이펙트
 * - Step 1: 중간 제동 먼지 & 뒤돌아볼 때 식은땀(💧)
 * - Step 2: 상대 코앞 체온 과부하 팽창 & 황금빛 진동 경고선
 * - Step 3: 펑! (백열 플라즈마 코어 + 2중 초음속 충격파 링 + 9-Lobe 거대 화구 + 파편 + 흑연 버섯구름)
 */
export function drawSelfDestructEffect(
  ctx: any,
  casterPos: { x: number; y: number },
  blastPos: { x: number; y: number },
  step: number,
  progress: number,
  isPlayer: boolean
) {
  ctx.save();

  // =========================================================================
  // STEP 1: 걷기, 중간 정지 & 뒤돌아보기
  // (유저 피드백: 걷는 동작과 돌아볼 때 먼지, 땀방울 등 추가 이펙트 완전 제거)
  // =========================================================================
  if (step === 1) {
    ctx.restore();
    return;
  }

  // =========================================================================
  // STEP 2: 상대 코앞 밀착 & 크리퍼식 순백 점멸 (Creeper Ticking Countdown)
  // (유저 피드백: 외부 이펙트 대신 포켓몬 본체가 크리퍼처럼 순백으로 깜빡거림)
  // =========================================================================
  else if (step === 2) {
    ctx.restore();
    return;
  }

  // =========================================================================
  // STEP 3: 펑! (THE APOCALYPTIC SUPERNOVA EXPLOSION)
  // =========================================================================
  else if (step === 3) {
    const t = Math.max(0, Math.min(1.0, (progress - 0.70) / 0.30));
    const bx = blastPos.x;
    const by = blastPos.y;

    // -----------------------------------------------------------------------
    // A. 3D 입체 각도 타원형 충격파 링 (3D Perspective Tilted Shockwave Rings)
    // (유저 피드백: 링 투명도 안쪽 투명 / 바깥쪽 반투명, 각도와 타원형으로 3D 입체감 구현)
    // -----------------------------------------------------------------------
    const waveAlpha = Math.max(0, Math.sin((1.0 - t) * Math.PI * 0.90));
    if (waveAlpha > 0.02) {
      // 1) 3D 틸트 메인 공중 충격파 링 (-18도 입체 각도 틸트, 3D 타원 원근비 0.54)
      const ring1R = 25 + t * 210;
      ctx.save();
      ctx.translate(bx, by - 4);
      ctx.rotate((-18 * Math.PI) / 180); // -18도 입체 틸트
      ctx.scale(1.0, 0.54);              // 타원형 3D 원근비

      // 안쪽 100% 투명 ➔ 바깥쪽 반투명 그라데이션 밴드
      const ringGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, ring1R);
      ringGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      ringGrad.addColorStop(0.65, "rgba(255, 255, 255, 0.0)"); // 안쪽은 완전 투명
      ringGrad.addColorStop(0.85, `rgba(254, 240, 138, ${waveAlpha * 0.45})`); // 중간부터 부드럽게 반투명
      ringGrad.addColorStop(0.96, `rgba(255, 255, 255, ${waveAlpha * 0.70})`); // 바깥쪽 충격파 테두리 반투명 하이라이트
      ringGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)"); // 최외곽 림 페더링

      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(0, 0, ring1R, 0, Math.PI * 2);
      ctx.fill();

      // 바깥쪽 전선(Wavefront) 림 스트로크
      ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha * 0.65})`;
      ctx.lineWidth = Math.max(1.0, 3.2 - t * 2.2);
      ctx.beginPath();
      ctx.arc(0, 0, ring1R * 0.96, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // 2) 보조 지면 수평 충격파 링 (지면 배틀 플랫폼과 수평을 이루는 3D 타원형)
      if (t > 0.05) {
        const ring2R = (ring1R - 30);
        if (ring2R > 15) {
          ctx.save();
          ctx.translate(bx, by + 10);
          ctx.rotate((6 * Math.PI) / 180); // 지면 원근 각도 (6도)
          ctx.scale(1.0, 0.44);             // 지면 납작 타원 원근비

          const ring2Grad = ctx.createRadialGradient(0, 0, 0, 0, 0, ring2R);
          ring2Grad.addColorStop(0.0, "rgba(249, 115, 22, 0.0)");
          ring2Grad.addColorStop(0.60, "rgba(249, 115, 22, 0.0)"); // 안쪽 투명
          ring2Grad.addColorStop(0.92, `rgba(249, 115, 22, ${waveAlpha * 0.55})`); // 바깥쪽 반투명 주황
          ring2Grad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)");

          ctx.fillStyle = ring2Grad;
          ctx.beginPath();
          ctx.arc(0, 0, ring2R, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(254, 240, 138, ${waveAlpha * 0.50})`;
          ctx.lineWidth = Math.max(1.0, 2.2 - t * 1.5);
          ctx.beginPath();
          ctx.arc(0, 0, ring2R * 0.94, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }
      }
    }

    // -----------------------------------------------------------------------
    // B. 3D 입체 각도 타원형 폭발 방사선 (3D Perspective Blast Shock Lines)
    // (유저 피드백: 선 나오는 것도 안쪽 투명 / 바깥쪽 반투명, 각도와 타원형으로 3D 입체감 구현)
    // -----------------------------------------------------------------------
    if (t > 0.03 && t < 0.85) {
      const lineAlpha = Math.max(0, Math.sin((1.0 - (t - 0.03) / 0.82) * Math.PI));
      if (lineAlpha > 0.02) {
        ctx.save();
        const LINE_COUNT = 16;
        const tiltRad = (-18 * Math.PI) / 180;
        const cosT = Math.cos(tiltRad);
        const sinT = Math.sin(tiltRad);

        for (let i = 0; i < LINE_COUNT; i++) {
          const ang = (i / LINE_COUNT) * Math.PI * 2 + (i % 2) * 0.15;
          const innerDist = 20 + t * 45;
          const lineLen = (48 + ((i * 23) % 40)) * (0.8 + t * 1.6);
          const outerDist = innerDist + lineLen;

          // 3D 타원형 원근 납작화 (타원비 0.54)
          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);
          const lx0 = cosA * innerDist;
          const ly0 = sinA * innerDist * 0.54;
          const lx1 = cosA * outerDist;
          const ly1 = sinA * outerDist * 0.54;

          // 입체 각도 회전 적용
          const x0 = bx + (lx0 * cosT - ly0 * sinT);
          const y0 = by + (lx0 * sinT + ly0 * cosT);
          const x1 = bx + (lx1 * cosT - ly1 * sinT);
          const y1 = by + (lx1 * sinT + ly1 * cosT);

          // 선 자체의 선형 그라데이션: 안쪽 완전 투명 ➔ 바깥쪽 반투명
          const lineGrad = ctx.createLinearGradient(x0, y0, x1, y1);
          lineGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)"); // 안쪽 시작점 완전 투명!
          lineGrad.addColorStop(0.35, "rgba(254, 240, 138, 0.08)");
          lineGrad.addColorStop(0.85, `rgba(255, 255, 255, ${lineAlpha * 0.65})`); // 바깥쪽 반투명 하이라이트!
          lineGrad.addColorStop(1.0, `rgba(249, 115, 22, ${lineAlpha * 0.35})`); // 끝부분 반투명

          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = Math.max(1.0, (i % 3 === 0 ? 2.6 : 1.6) - t * 1.2);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // -----------------------------------------------------------------------
    // C. 거대 9-로브 화염 버섯구름 화구 (Giant 9-Lobe Fireball)
    // (유저 피드백: 구체가 외곽으로 갈수록 투명해지도록 부드러운 알파 감쇄 적용)
    // -----------------------------------------------------------------------
    if (t < 0.75) {
      const fireT = Math.min(1.0, t / 0.55);
      const fireAlpha = t < 0.45 ? 1.0 : (1.0 - (t - 0.45) / 0.30);
      const fireMaxR = 125 * Math.sin(fireT * Math.PI * 0.5);

      ctx.save();
      ctx.globalAlpha = Math.max(0, fireAlpha);

      // 0) 전체 화구 배경 완충 앰비언트 글로우 (부드러운 열기 방사)
      const ambGrad = ctx.createRadialGradient(bx, by - t * 14, 0, bx, by - t * 14, fireMaxR * 1.15);
      ambGrad.addColorStop(0.0, "rgba(254, 240, 138, 0.45)");
      ambGrad.addColorStop(0.40, "rgba(249, 115, 22, 0.25)");
      ambGrad.addColorStop(0.75, "rgba(239, 68, 68, 0.08)");
      ambGrad.addColorStop(1.0, "rgba(185, 28, 28, 0.0)");
      ctx.fillStyle = ambGrad;
      ctx.beginPath();
      ctx.arc(bx, by - t * 14, fireMaxR * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // 1) 9개의 역동적인 외곽 화염 로브 (외곽으로 갈수록 자연스럽게 투명해지는 그라데이션)
      const LOBE_COUNT = 9;
      for (let i = 0; i < LOBE_COUNT; i++) {
        const angle = (i / LOBE_COUNT) * Math.PI * 2 + t * 0.8;
        const dist = fireMaxR * (0.50 + Math.sin(i * 2.3 + t * 4) * 0.12);
        const lobeR = fireMaxR * (0.55 + Math.cos(i * 1.7) * 0.15);
        const lx = bx + Math.cos(angle) * dist;
        const ly = by + Math.sin(angle) * (dist * 0.82) - (t * 22); // 상승 부력

        const fGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lobeR);
        fGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");  // 중심부 순백
        fGrad.addColorStop(0.20, "rgba(254, 240, 138, 0.85)"); // 밝은 황색
        fGrad.addColorStop(0.45, "rgba(249, 115, 22, 0.55)");  // 불꽃 주황 (반투명)
        fGrad.addColorStop(0.70, "rgba(239, 68, 68, 0.25)");   // 심홍 적색 (높은 투명도)
        fGrad.addColorStop(0.90, "rgba(185, 28, 28, 0.08)");   // 외곽 은은한 불씨
        fGrad.addColorStop(1.0, "rgba(153, 27, 27, 0.0)");     // 완전 투명

        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(lx, ly, Math.max(1, lobeR), 0, Math.PI * 2);
        ctx.fill();
      }

      // 2) 중심 초고열 플라즈마 코어 (외곽으로 갈수록 부드러운 투명 감쇄)
      const coreR = fireMaxR * (t < 0.25 ? 0.85 : 0.48);
      const coreGrad = ctx.createRadialGradient(bx, by - t * 14, 0, bx, by - t * 14, Math.max(1, coreR));
      coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
      coreGrad.addColorStop(0.30, "rgba(254, 240, 138, 0.80)");
      coreGrad.addColorStop(0.60, "rgba(249, 115, 22, 0.35)");
      coreGrad.addColorStop(0.85, "rgba(239, 68, 68, 0.10)");
      coreGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(bx, by - t * 14, Math.max(1, coreR), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // -----------------------------------------------------------------------
    // C. 흑연 연기 버섯구름 (Billowing Charcoal Smoke Plumes)
    // (유저 피드백: 비산 파편 파티클 제거 및 연막 구체 외곽 투명화 적용)
    // -----------------------------------------------------------------------
    if (t > 0.28) {
      const smokeT = (t - 0.28) / 0.72; // 0.0 ~ 1.0
      const smokeAlpha = Math.sin((1.0 - smokeT) * Math.PI * 0.65) * 0.95;

      if (smokeAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = smokeAlpha;

        const SMOKE_PUFFS = [
          { xOff: 0, yOff: -38, r: 48 },
          { xOff: -32, yOff: -26, r: 42 },
          { xOff: 34, yOff: -28, r: 44 },
          { xOff: -20, yOff: -54, r: 38 },
          { xOff: 22, yOff: -56, r: 40 },
          { xOff: 0, yOff: -72, r: 36 },
          { xOff: -44, yOff: -12, r: 32 },
          { xOff: 46, yOff: -14, r: 34 },
        ];

        for (let i = 0; i < SMOKE_PUFFS.length; i++) {
          const puff = SMOKE_PUFFS[i];
          const curR = puff.r * (0.65 + smokeT * 0.75);
          const px = bx + puff.xOff * (1.0 + smokeT * 0.5);
          const py = by + (puff.yOff - smokeT * 38); // 위로 솟구치는 열기 기류

          const smGrad = ctx.createRadialGradient(px, py - curR * 0.1, 0, px, py, curR);
          smGrad.addColorStop(0.0, "rgba(107, 114, 128, 0.85)"); // 중심부 밝은 회색
          smGrad.addColorStop(0.35, "rgba(75, 85, 99, 0.55)");   // 중간 회색 (부드러운 투명도)
          smGrad.addColorStop(0.68, "rgba(55, 65, 81, 0.25)");   // 진한 흑연색 외곽
          smGrad.addColorStop(0.88, "rgba(31, 41, 55, 0.08)");   // 흩어지는 잔여 연막
          smGrad.addColorStop(1.0, "rgba(17, 24, 39, 0.0)");     // 완전 투명

          ctx.fillStyle = smGrad;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(1, curR), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }
  }

  ctx.restore();
}


