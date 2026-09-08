import { Path2D } from "@napi-rs/canvas";

/**
 * Gen 1 Moves 049 - 052 Renderers
 * 
 * 049: 소닉붐 (Sonic Boom)
 * 050: 사슬묶기 (Disable)
 * 051: 용해액 (Acid)
 * 052: 불꽃세례 (Ember)
 */

// ============================================================================
// 049: 소닉붐 (Sonic Boom)
// ============================================================================

/**
 * Helper: 두꺼운 초승달 형태의 소닉붐 충격파 (Crescent Sonic Shockwave)
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. 초승달 형태(형태만), 근데 조금 더 두꺼운 모양이 적 방향을 향해 발사됨 ( ) )
 * 2. 색은 흰색 (앞은 100% 불투명, 뒤는 70% 반투명)
 * 3. 가로(Span)만큼 두께를 가진 짧은 직선이 잔상처럼 뒤쪽은 0% 투명, 앞쪽은 50% 반투명
 */
export function drawSonicBoomCrescent(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  span: number = 46,
  thickness: number = 10,
  alpha: number = 1.0,
  tiltAngle: number = -0.28, // 약 -16도 왼쪽으로 비스듬하게 틸트
  depthRatio: number = 0.82  // 3D 원근 입체 압축 비율
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  // 살짝 3차원 비스듬하게 왼쪽으로 기울인 각도 및 원근 투영
  ctx.rotate(angle + tiltAngle);
  ctx.scale(1.06, depthRatio); // 3D 원근 타원 압축

  const halfSpan = span / 2;
  const frontBulge = thickness * 0.95; // 전방 볼록 정점 (+X)
  const backIndent = thickness * 0.10; // 후방 오목 안쪽 (+X)
  const tipOffset = thickness * 1.25;  // 양끝 팁 후방 위치 (-X)
  const trailLen = 28;                 // 짧은 직선 잔상 길이

  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 잔상 슬립스트림: )의 오목한 뒷면을 완벽히 메우며 뒤로 뻗어나가는 직선 잔상
  // (뒤쪽은 0% 완전 투명 -> ) 뒷면에 닿는 앞쪽은 50% 반투명)
  const trailGrad = ctx.createLinearGradient(-tipOffset - trailLen, 0, backIndent, 0);
  trailGrad.addColorStop(0.0, "rgba(255, 255, 255, 0)");
  trailGrad.addColorStop(0.4, "rgba(255, 255, 255, " + (0.16 * alpha) + ")");
  trailGrad.addColorStop(1.0, "rgba(255, 255, 255, " + (0.50 * alpha) + ")");

  ctx.save();
  ctx.fillStyle = trailGrad;
  ctx.beginPath();
  // 상단 팁(-tipOffset, -halfSpan)에서 시작
  ctx.moveTo(-tipOffset, -halfSpan);
  // )의 오목한 안쪽 면을 오차 없이 완벽히 메우며 하단 팁으로 곡선 이동
  ctx.bezierCurveTo(
    backIndent, -halfSpan * 0.48,
    backIndent, halfSpan * 0.48,
    -tipOffset, halfSpan
  );
  // 하단 팁에서 뒤쪽으로 직선 이동
  ctx.lineTo(-tipOffset - trailLen, halfSpan);
  // 뒤쪽에서 수직으로 위로 이동
  ctx.lineTo(-tipOffset - trailLen, -halfSpan);
  // 다시 상단 팁으로 닫아 )의 뒷면을 완전히 채움
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. 두꺼운 초승달 충격파 본체: )
  // 앞쪽(진행방향)은 100% 완전 불투명, 뒤쪽은 70% 반투명
  const bodyGrad = ctx.createLinearGradient(-tipOffset, 0, frontBulge, 0);
  bodyGrad.addColorStop(0.0, "rgba(255, 255, 255, " + (0.70 * alpha) + ")");
  bodyGrad.addColorStop(0.65, "rgba(255, 255, 255, " + (0.90 * alpha) + ")");
  bodyGrad.addColorStop(1.0, "rgba(255, 255, 255, " + (1.00 * alpha) + ")");

  ctx.beginPath();
  // 상단 팁에서 출발 -> 전방 볼록 호 -> 하단 팁
  ctx.moveTo(-tipOffset, -halfSpan);
  ctx.bezierCurveTo(
    frontBulge + 3, -halfSpan * 0.52,
    frontBulge + 3, halfSpan * 0.52,
    -tipOffset, halfSpan
  );
  // 하단 팁에서 출발 -> 후방 오목 호 -> 상단 팁
  ctx.bezierCurveTo(
    backIndent, halfSpan * 0.48,
    backIndent, -halfSpan * 0.48,
    -tipOffset, -halfSpan
  );
  ctx.closePath();

  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 순백의 날카로운 외곽 림 하이라이트
  ctx.strokeStyle = "rgba(255, 255, 255, " + (0.85 * alpha) + ")";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper: 타격 지점 중심 투명 순백 확산 충격파 (아주 짧게 소멸)
 * - 중심부(r <= 40%)는 100% 완전 투명하여 피격 포켓몬이 또렷하게 투영
 * - 외곽은 순백의 압축 기류 링으로 시원하게 팡! 터진 후 순식간에 페이드아웃
 */
export function drawSonicBoomHollowShockwave(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0
) {
  if (radius <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, "rgba(255, 255, 255, 0)");        // 중심부 100% 완전 투명
  grad.addColorStop(0.40, "rgba(255, 255, 255, 0)");     // 투명 영역 유지
  grad.addColorStop(0.70, "rgba(255, 255, 255, 0.40)");  // 순백 반투명 전개
  grad.addColorStop(0.90, "rgba(255, 255, 255, 0.85)");  // 압축 기류 고리
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0.95)");   // 가장자리 강렬한 림

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // 외곽 샤프 링
  ctx.strokeStyle = "rgba(255, 255, 255, " + (0.90 * alpha) + ")";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 049: 소닉붐 (Sonic Boom) 종합 이펙트 렌더러
 * - 6연발 두꺼운 초승달 충격파 ) ) ) ) ) ) 연속 비행 (간격 확장)
 * - 타격 지점에서 아주 짧은 중심 투명 순백 확산 충격파 폭발
 */
export function drawSonicBoomEffect(
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

  // 시전자 및 대상 중심 좌표
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);

  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  ctx.save();

  // 비행 진행 방향 축 각도 (시전자 -> 대상)
  const mainAngle = Math.atan2(ty - ay, tx - ax);
  const dx = tx - ax;
  const dy = ty - ay;

  // 1. 6개의 두꺼운 초승달 충격파 ) ) ) ) ) ) 연속 발사 및 비행
  const CRESCENT_COUNT = 6;
  const CRESCENT_SPACING = 0.20; // 유저 요청 반영: 충격파 간격 확장 (기존 0.12 -> 0.20)
  const leaderT = frame.leaderT ?? ((step - 1) * 0.22 + 0.20);

  // 충격파 폭발(hollowShockwaveR) 완료 전까지 비행 표시
  for (let i = 0; i < CRESCENT_COUNT; i++) {
    const cT = leaderT - i * CRESCENT_SPACING;
    if (cT <= 0 || cT >= 1.20) continue; // 발사 전이거나 대상 통과 소멸

    // 발사 초기 페이드인 및 도달 직전 선명함
    const curAlpha = cT < 0.12 ? (cT / 0.12) : cT > 0.98 ? Math.max(0, (1.20 - cT) / 0.22) : 1.0;
    const curX = ax + dx * Math.min(1.05, cT);
    const curY = ay + dy * Math.min(1.05, cT);

    // 가로로 살짝 넓어진 폭 (46px)
    const span = 46 + (i % 2 === 0 ? 2 : -2);
    const thickness = 10;

    drawSonicBoomCrescent(ctx, curX, curY, mainAngle, span, thickness, curAlpha);
  }

  // 2. 타격 지점의 아주 짧은 중심 투명 순백 확산 충격파
  if (frame.hollowShockwaveR !== undefined && frame.hollowShockwaveR > 0) {
    const sR = frame.hollowShockwaveR;
    const sAlpha = frame.shockwaveAlpha ?? 0.85;
    drawSonicBoomHollowShockwave(ctx, tx, ty, sR, sAlpha);

    // 타격 순간 미세 순백 스파크 파편 (경쾌한 비산)
    if (sAlpha > 0.3) {
      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + sR * 0.1;
        const dist = sR * 0.72;
        const spX = tx + Math.cos(a) * dist;
        const spY = ty + Math.sin(a) * dist;
        ctx.fillRect(spX - 1.5, spY - 1.5, 3, 3);
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

// ============================================================================
// 050: 사슬묶기 (Disable)
// ============================================================================

/**
 * Helper: 전장 배경을 잿빛 회색으로 전환하는 오버레이
 * - "서서히 하지만 빠르게 사슬묶기 배경을 회색깔로 바꿈"
 * - 짙은 슬레이트 잿빛 오버레이로 배틀 아레나 전체를 완전히 무채색 잿빛 차원으로 물들임
 */
export function drawDisableGrayBackground(
  ctx: any,
  alpha: number,
  width: number = 384,
  height: number = 216
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  // 확실하고 압도적으로 체감되는 짙은 잿빛 회색 오버레이
  ctx.fillStyle = "rgba(26, 32, 44, 0.88)";
  ctx.fillRect(-4000, -4000, 10000, 10000);
  ctx.restore();
}

/**
 * Helper: 시전 포켓몬 앞쪽에 번쩍이는 파란색 십자형 별 (Blue Cross Star)
 * - 4방향으로 날카롭게 뻗어나가는 청명한 샤프 십자별 광채
 * - 눈부신 일렉트릭 블루/스카이 블루 외곽과 순백 코어
 */
export function drawBlueCrossStar(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (scale <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const rayLen = 32 * scale;
  const rayThick = 5.2 * scale;

  // 1. 외곽 부드러운 일렉트릭 블루 렌즈 플레어
  ctx.save();
  ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
  ctx.beginPath();
  ctx.arc(0, 0, 18 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 십자형 별 (수직/수평 샤프 빔)
  const drawCrossRay = (w: number, h: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, h);
    ctx.lineTo(-w, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // 외곽 블루 레이
  drawCrossRay(rayThick, rayLen, "#0284C7");
  drawCrossRay(rayLen, rayThick, "#0284C7");

  // 중간 스카이 블루 레이
  drawCrossRay(rayThick * 0.65, rayLen * 0.85, "#38BDF8");
  drawCrossRay(rayLen * 0.85, rayThick * 0.65, "#38BDF8");

  // 중심부 순백 코어 다이아몬드
  drawCrossRay(rayThick * 0.38, rayLen * 0.55, "#FFFFFF");
  drawCrossRay(rayLen * 0.55, rayThick * 0.38, "#FFFFFF");

  // 4방향 대각선 미세 반짝임
  const diagLen = 12 * scale;
  ctx.save();
  ctx.rotate(Math.PI / 4);
  drawCrossRay(2.2 * scale, diagLen, "rgba(224, 242, 254, 0.90)");
  drawCrossRay(diagLen, 2.2 * scale, "rgba(224, 242, 254, 0.90)");
  ctx.restore();

  ctx.restore();
}

/**
 * Helper: 메탈릭 보라색 사슬 - 정면 평면 링 (Flat Chain Link with center hole)
 * - 가운데가 실제로 뚫려 있고 상단에 은빛/라벤더 금속 하이라이트가 번쩍이는 쇠사슬 고리
 */
function drawPurpleFlatLink(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  scale: number = 1.0,
  alpha: number = 1.0,
  isFront: boolean = true
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const w = 18 * scale;
  const h = 9.5 * scale;
  const r = h / 2;
  const holeW = 9.0 * scale;
  const holeH = 4.0 * scale;
  const holeR = holeH / 2;

  // 1. 외곽 보라빛 네온 오라
  ctx.strokeStyle = isFront ? "rgba(192, 132, 252, 0.65)" : "rgba(147, 51, 234, 0.35)";
  ctx.lineWidth = 3.5 * scale;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.stroke();

  // 2. 도넛형 중공 사슬 바디 (가운데가 실제로 투명하게 뚫림)
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.roundRect(-holeW / 2, -holeH / 2, holeW, holeH, holeR);

  const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  if (isFront) {
    bodyGrad.addColorStop(0.0, "#F3E8FF"); // 상단 눈부신 은백 라벤더 하이라이트
    bodyGrad.addColorStop(0.25, "#C084FC"); // 밝은 메탈릭 퍼플
    bodyGrad.addColorStop(0.65, "#9333EA"); // 선명한 바이올렛
    bodyGrad.addColorStop(1.0, "#4C1D95"); // 깊은 하단 그림자
  } else {
    bodyGrad.addColorStop(0.0, "#A855F7");
    bodyGrad.addColorStop(0.5, "#6B21A8");
    bodyGrad.addColorStop(1.0, "#3B0764");
  }
  ctx.fillStyle = bodyGrad;
  ctx.fill("evenodd"); // 안쪽 홀을 100% 완전 투명하게 뚫음!

  // 3. 사슬 외곽 및 안쪽 홀 금속 테두리
  ctx.strokeStyle = isFront ? "#FAF5FF" : "rgba(192, 132, 252, 0.50)";
  ctx.lineWidth = 1.0 * scale;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.stroke();

  ctx.strokeStyle = isFront ? "#581C87" : "#3B0764";
  ctx.lineWidth = 1.0 * scale;
  ctx.beginPath();
  ctx.roundRect(-holeW / 2, -holeH / 2, holeW, holeH, holeR);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper: 메탈릭 보라색 사슬 - 측면 관통 링 (Side Chain Link threading through flat links)
 * - 90도 회전되어 이전 링과 다음 링의 구멍을 수직으로 관통하는 쇠사슬 고리
 */
function drawPurpleSideLink(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  scale: number = 1.0,
  alpha: number = 1.0,
  isFront: boolean = true
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const w = 8.5 * scale;
  const h = 15.0 * scale;
  const r = 4.2 * scale;
  const holeW = 3.0 * scale;
  const holeH = 8.5 * scale;
  const holeR = 1.5 * scale;

  // 1. 외곽 보라빛 오라
  ctx.strokeStyle = isFront ? "rgba(192, 132, 252, 0.55)" : "rgba(147, 51, 234, 0.30)";
  ctx.lineWidth = 3.0 * scale;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.stroke();

  // 2. 도넛형 수직 링 바디 (evenodd로 가운데 관통 구멍 뚫림)
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.roundRect(-holeW / 2, -holeH / 2, holeW, holeH, holeR);

  const bodyGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  if (isFront) {
    bodyGrad.addColorStop(0.0, "#F3E8FF"); // 좌상단 하이라이트
    bodyGrad.addColorStop(0.30, "#C084FC");
    bodyGrad.addColorStop(0.70, "#9333EA");
    bodyGrad.addColorStop(1.0, "#4C1D95"); // 우하단 그림자
  } else {
    bodyGrad.addColorStop(0.0, "#A855F7");
    bodyGrad.addColorStop(0.50, "#6B21A8");
    bodyGrad.addColorStop(1.0, "#3B0764");
  }
  ctx.fillStyle = bodyGrad;
  ctx.fill("evenodd");

  // 3. 외곽 및 안쪽 홀 테두리
  ctx.strokeStyle = isFront ? "#FAF5FF" : "rgba(192, 132, 252, 0.50)";
  ctx.lineWidth = 1.0 * scale;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.stroke();

  ctx.strokeStyle = isFront ? "#581C87" : "#3B0764";
  ctx.lineWidth = 1.0 * scale;
  ctx.beginPath();
  ctx.roundRect(-holeW / 2, -holeH / 2, holeW, holeH, holeR);
  ctx.stroke();

  ctx.restore();
}

/**
 * 050: 사슬묶기 (Disable) 공통 사슬 궤도 계산기
 * - 20개의 정면 평면 링과 측면 관통 링이 100% 빈틈없이 교차 맞물려 연속 쇠사슬(Interlocking Chain) 형성
 */
function getDisableChainLinks(
  targetPos: { x: number; y: number },
  progress: number, // 0.0 ~ 1.0
  squeeze: number = 1.0 // 1.0 ~ 0.72 (조여듦)
) {
  const tx = targetPos.x;
  const ty = targetPos.y;

  // 2줄의 수평 사슬 링: 상단 가슴(ty - 10), 하단 복부(ty + 8)
  const loops = [
    { yOffset: -10, rotOffset: 0.0, rx: 42 * squeeze, ry: 13 * squeeze },
    { yOffset: 8, rotOffset: Math.PI * 0.30, rx: 40 * squeeze, ry: 12 * squeeze },
  ];

  const totalLinksPerLoop = 20; // 10개 정면 링 + 10개 측면 링이 빈틈없이 맞물려 연속 사슬 형성
  const allLinks: Array<{
    cx: number;
    cy: number;
    angle: number;
    scale: number;
    z: number;
    isFlat: boolean;
  }> = [];

  // 가로 방향 회전
  const baseRot = progress * Math.PI * 3.6;

  for (const loop of loops) {
    for (let k = 0; k < totalLinksPerLoop; k++) {
      const theta = baseRot + loop.rotOffset + (k * Math.PI * 2) / totalLinksPerLoop;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const cx = tx + loop.rx * cosT;
      const cy = ty + loop.yOffset + loop.ry * sinT;
      const z = sinT; // z >= 0: 앞쪽, z < 0: 뒤쪽

      // 타원 궤도의 접선 각도 (사슬이 궤도를 따라 자연스럽게 회전)
      const tangentAngle = Math.atan2(loop.ry * cosT, -loop.rx * sinT);

      // 짝수 번째: Flat 링 (가운데 구멍 뚫린 정면 링), 홀수 번째: Side 링 (구멍을 관통하는 수직 링)
      const isFlat = (k % 2 === 0);
      const scale = 0.85 + (z + 1.0) * 0.15; // 앞쪽(1.0)은 크게, 뒤쪽(0.85)은 작게 원근감

      allLinks.push({ cx, cy, angle: tangentAngle, scale, z, isFlat });
    }
  }

  return allLinks;
}

/**
 * 050: 사슬묶기 Behind 이펙트 렌더러
 * - 스프라이트 렌더링 이전에 호출됨
 * - 1. 전장 회색 전환 오버레이 ("서서히 하지만 빠르게 사슬묶기 배경을 회색깔로 바꿈")
 * - 2. 대상 포켓몬 스프라이트 뒤쪽 사슬 (z < 0)
 */
export function drawDisableBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    width: number;
    height: number;
    [key: string]: any;
  }
) {
  const { targetPos, width, height } = drawCtx;

  // 1. 전장 회색 전환 오버레이 ("서서히 하지만 빠르게")
  const grayAlpha = frame.grayAlpha ?? 0;
  if (grayAlpha > 0) {
    drawDisableGrayBackground(ctx, grayAlpha, width, height);
  }

  // 2. 스프라이트 뒤쪽 사슬 (z < 0)
  const chainAlpha = frame.chainAlpha ?? (frame.chainProgress !== undefined ? 1.0 : 0);
  if (chainAlpha > 0) {
    const chainProgress = frame.chainProgress ?? 0;
    const squeeze = frame.chainSqueeze ?? 1.0;

    const links = getDisableChainLinks(targetPos, chainProgress, squeeze);
    const behindLinks = links.filter((l) => l.z < 0);
    // 깊이 정렬 (가장 먼 z = -1부터 z = 0 쪽으로 순차 렌더링)
    behindLinks.sort((a, b) => a.z - b.z);

    for (const link of behindLinks) {
      if (link.isFlat) {
        drawPurpleFlatLink(ctx, link.cx, link.cy, link.angle, link.scale, chainAlpha, false);
      } else {
        drawPurpleSideLink(ctx, link.cx, link.cy, link.angle, link.scale, chainAlpha, false);
      }
    }
  }
}

/**
 * 050: 사슬묶기 Front 이펙트 렌더러
 * - 스프라이트 렌더링 이후에 호출됨
 * - 1. 전장 전체 회색 분위기 일체화 틴트 (스프라이트 위를 덮는 무채색 필터)
 * - 2. 시전 포켓몬 앞쪽 파란색 십자형 별 번쩍임
 * - 3. 대상 포켓몬 스프라이트 앞쪽 사슬 (z >= 0)
 */
export function drawDisableFrontEffect(
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
  const { targetPos, casterPos, attackerPos, isPlayer: isP } = drawCtx;

  ctx.save();

  // 1. 스프라이트 위를 덮는 무채색 잿빛 분위기 필터 (전체화면 회색빛깔 완성)
  const grayAlpha = frame.grayAlpha ?? 0;
  if (grayAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.48, grayAlpha * 0.48);
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(-4000, -4000, 10000, 10000);
    ctx.restore();
  }

  // 2. 시전 포켓몬 앞쪽 파란색 십자형 별 번쩍임
  if (frame.starScale && frame.starScale > 0) {
    const cPos = casterPos ?? attackerPos;
    const starX = cPos.x + (isP ? 20 : -20);
    const starY = cPos.y - (isP ? 14 : 10);
    const starAlpha = frame.starAlpha ?? 1.0;
    drawBlueCrossStar(ctx, starX, starY, frame.starScale, starAlpha);
  }

  // 3. 스프라이트 앞쪽 사슬 (z >= 0, 스프라이트 위를 감싸며 가로 회전)
  const chainAlpha = frame.chainAlpha ?? (frame.chainProgress !== undefined ? 1.0 : 0);
  if (chainAlpha > 0) {
    const chainProgress = frame.chainProgress ?? 0;
    const squeeze = frame.chainSqueeze ?? 1.0;

    const links = getDisableChainLinks(targetPos, chainProgress, squeeze);
    const frontLinks = links.filter((l) => l.z >= 0);
    // 깊이 정렬 (z = 0부터 카메라에 가장 가까운 z = 1 쪽으로 순차 렌더링)
    frontLinks.sort((a, b) => a.z - b.z);

    for (const link of frontLinks) {
      if (link.isFlat) {
        drawPurpleFlatLink(ctx, link.cx, link.cy, link.angle, link.scale, chainAlpha, true);
      } else {
        drawPurpleSideLink(ctx, link.cx, link.cy, link.angle, link.scale, chainAlpha, true);
      }
    }
  }

  ctx.restore();
}

// ============================================================================
// 051: 용해액 (Acid)
// ============================================================================

/**
 * 용해액이 벽에 붙은 것 처럼 퍼진 🫟 스플래터 SVG 벡터 패스
 * (중심 유기적 다중 로브 + 외곽 돌출 촉수 및 유체 굴곡)
 */
const ACID_SPLATTER_SVG_PATH = 
  "M 0 -18 " +
  // 1. 우상단 솟구친 스플래시 촉수
  "C 6 -32, 24 -48, 38 -42 " +
  "C 46 -36, 30 -22, 24 -14 " +
  // 깊은 만(Bay)
  "C 36 -16, 54 -28, 70 -22 " +
  "C 80 -16, 68 -2, 54 4 " +
  // 2. 우측 길쭉한 비산 로브
  "C 64 10, 84 16, 80 30 " +
  "C 75 38, 56 28, 42 24 " +
  // 깊은 만
  "C 46 34, 52 50, 40 54 " +
  "C 30 56, 26 38, 16 28 " +
  // 3. 하단 길게 늘어진 드립 촉수
  "C 10 44, 2 62, -10 60 " +
  "C -22 56, -18 36, -26 26 " +
  // 4. 좌하단 넓적한 웅덩이형 철푸덕 로브
  "C -42 38, -64 46, -68 30 " +
  "C -72 16, -52 14, -38 8 " +
  // 깊은 만
  "C -54 10, -78 6, -76 -10 " +
  "C -74 -24, -54 -16, -40 -10 " +
  // 5. 좌상단 튀어오른 스플래시 촉수
  "C -48 -24, -60 -46, -44 -48 " +
  "C -32 -52, -28 -30, -18 -18 " +
  "C -12 -22, -6 -24, 0 -18 Z";

const acidSplatterPath = new Path2D(ACID_SPLATTER_SVG_PATH);
const ACID_BASE_SCALE = 0.35;
const ACID_COLOR = "#F59E0B"; // 누런색에 주황빛 (호박빛 황금 주황)

/**
 * Helper: 용해액이 벽에 철푸덕 붙은 것 처럼 퍼진 SVG 형태의 스플래터 (🫟 Splatter)
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. border 제거 (테두리 일절 없는 순수 플랫 솔리드 실루엣)
 * 2. 날아가는 이펙트가 구체가 아닌 '철푸덕' 형상 (비행 중 납작 일그러짐 + 뒤로 길게 뜯겨나가는 물방울들)
 * 3. 깊은 요철 만과 불규칙 방사 촉수로 이루어진 리얼 슬라임 스플래터
 */
export function drawAcidSplatter(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  alpha: number = 1.0,
  rot: number = 0,
  options?: {
    drawDrips?: boolean;
    dripLen?: number;
    showSatelliteDrops?: boolean;
    isFlying?: boolean;
  }
) {
  if (alpha <= 0.01 || scale <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // [유저 요구사항] 날아가는 이펙트가 완전한 구체가 아닌 '철푸덕' 형상으로 보이도록
  // 비행 중에는 진행 방향(X축)으로 길게 늘이고 두께(Y축)를 납작하게 눌러 슬라임 형상화
  if (options?.isFlying) {
    ctx.scale(scale * ACID_BASE_SCALE * 1.45, scale * ACID_BASE_SCALE * 0.65);
  } else {
    ctx.scale(scale * ACID_BASE_SCALE, scale * ACID_BASE_SCALE);
  }

  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = ACID_COLOR;
  ctx.fill(acidSplatterPath);

  // 2. 비행 시 후방으로 뜯겨 날아가는 꼬리 방울들 (border 제거)
  if (options?.showSatelliteDrops !== false) {
    const satelliteDrops = options?.isFlying
      ? [
          { x: -36, y: -8, r: 4.2 },
          { x: -50, y: 12, r: 3.6 },
          { x: -66, y: -5, r: 3.0 },
          { x: -82, y: 7, r: 2.4 },
        ]
      : [
          { x: 52, y: -26, r: 4.2 },
          { x: -56, y: -34, r: 3.8 },
          { x: 64, y: 18, r: 3.4 },
          { x: -58, y: 22, r: 3.6 },
          { x: 18, y: 56, r: 4.0 },
          { x: -34, y: 48, r: 3.0 },
        ];

    for (const d of satelliteDrops) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Helper: 용해액 발사 시 제일 앞에 날아가는 선두 투사체 (기존 타원형)
 * - [유저 요구사항] "용해액 발사될 때 제일 앞에 있는 svg는 기존 타원형"
 * - 진행 방향(rot)으로 길게 늘어난 납작한 철푸덕 타원형 유체 본체 + 후방 비산 물방울
 */
export function drawAcidFlyingHead(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  alpha: number = 1.0,
  rot: number = 0
) {
  if (alpha <= 0.01 || scale <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale * 1.45, scale * 0.65);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = ACID_COLOR;

  // 기존 타원형 본체 (rx: 34, ry: 18)
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // 후방으로 뜯겨 날아가는 꼬리 방울들 (border 제거)
  const satelliteDrops = [
    { x: -36, y: -8, r: 4.2 },
    { x: -50, y: 12, r: 3.6 },
    { x: -66, y: -5, r: 3.0 },
    { x: -82, y: 7, r: 2.4 },
  ];
  for (const d of satelliteDrops) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Helper: 부드럽고 자연스러운 액체 드립 스트림 (Stream with teardrop tip)
 */
function drawAcidDripStream(
  ctx: any,
  x: number,
  yStart: number,
  len: number,
  w: number
) {
  const dropY = yStart + len;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, yStart);
  ctx.quadraticCurveTo(x - w * 0.25, yStart + len * 0.45, x - w * 0.55, dropY - w * 0.4);
  ctx.arc(x, dropY, w * 0.65, Math.PI, 0, true);
  ctx.quadraticCurveTo(x + w * 0.25, yStart + len * 0.45, x + w / 2, yStart);
  ctx.closePath();
  ctx.fill();
}

/**
 * 051: 용해액 착탄(도착지점) 리얼 액체 충격 렌더러
 * 
 * Concept (유저 요구사항 100% 반영: "보통 액체가 어디 부딪히면 어떤지 알지?"):
 * 1. 둥근 원형/구체/타원 느낌 완전 배제 (No geometric ellipses, No circular discs)
 * 2. 착탄 순간(Frame 6): 고속 충돌로 사방으로 날카롭고 거칠게 뻗치는 액체 스플래시 스타버스트 + 중심에서 바깥으로 폭발 비산하는 방울들
 * 3. 흡착 및 흘러내림(Frame 7~8): 벽면에 철푸덕 납작하게 부착된 🫟 슬라임 본체 + 중력에 의해 아래로 주르륵 흘러내리는 5가닥 드립 스트림 + 뚝뚝 떨어지는 분리 액적
 * 4. 테두리(border) 없는 순수 플랫 유체 실루엣 (#F59E0B)
 */
export function drawAcidArrivalEffect(
  ctx: any,
  tx: number,
  ty: number,
  frame: any,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;

  const step = frame.moveStep; // 6: 최초 격돌 폭발, 7: 철푸덕 흡착&흘러내림, 8: 최대 흘러내림&낙하, 9: 소멸
  const impactScale = (frame.impactSplatterScale ?? 1.25) * ACID_BASE_SCALE;
  const dripLen = frame.impactDripLen ?? 30;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = ACID_COLOR;

  // =========================================================================
  // 1. [Frame 6: 착탄 순간 격돌 폭발] (Splash Starburst & Radial Spray)
  // =========================================================================
  if (step === 6) {
    // 1-1. 중심부 타격 격돌 스플래터 본체 (🫟)
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(impactScale * 1.15, impactScale * 1.15);
    ctx.fill(acidSplatterPath);
    ctx.restore();

    // 1-2. 사방으로 격렬하게 뻗어나가는 11가닥 액체 스플래시 촉수 (Splash Spikes)
    const splashSpikes = [
      { angle: -Math.PI * 0.92, len: 44, w: 0.16 },
      { angle: -Math.PI * 0.72, len: 52, w: 0.18 },
      { angle: -Math.PI * 0.48, len: 58, w: 0.19 },
      { angle: -Math.PI * 0.22, len: 48, w: 0.17 },
      { angle: 0.05,            len: 54, w: 0.18 },
      { angle: Math.PI * 0.26,  len: 42, w: 0.15 },
      { angle: Math.PI * 0.48,  len: 46, w: 0.16 },
      { angle: Math.PI * 0.72,  len: 38, w: 0.15 },
      { angle: Math.PI * 0.94,  len: 50, w: 0.18 },
      { angle: -Math.PI * 0.35, len: 36, w: 0.14 },
      { angle: -Math.PI * 0.08, len: 40, w: 0.15 },
    ];

    const baseR = 14;
    for (const s of splashSpikes) {
      const spX = tx + Math.cos(s.angle) * s.len;
      const spY = ty + Math.sin(s.angle) * s.len;
      const b1x = tx + Math.cos(s.angle - s.w) * baseR;
      const b1y = ty + Math.sin(s.angle - s.w) * baseR;
      const b2x = tx + Math.cos(s.angle + s.w) * baseR;
      const b2y = ty + Math.sin(s.angle + s.w) * baseR;

      ctx.beginPath();
      ctx.moveTo(b1x, b1y);
      ctx.quadraticCurveTo(
        tx + Math.cos(s.angle - s.w * 0.5) * (s.len * 0.5),
        ty + Math.sin(s.angle - s.w * 0.5) * (s.len * 0.5),
        spX, spY
      );
      ctx.quadraticCurveTo(
        tx + Math.cos(s.angle + s.w * 0.5) * (s.len * 0.5),
        ty + Math.sin(s.angle + s.w * 0.5) * (s.len * 0.5),
        b2x, b2y
      );
      ctx.closePath();
      ctx.fill();

      // [유저 요구사항] "안쪽에서 바깥으로 퍼지는 느낌으로 튀게해줘"
      // 촉수 팁 바깥쪽으로 고속 비산하는 타원형 신장 액적
      const dDist = s.len + 9 + (s.len % 6);
      const dX = tx + Math.cos(s.angle) * dDist;
      const dY = ty + Math.sin(s.angle) * dDist;
      ctx.save();
      ctx.translate(dX, dY);
      ctx.rotate(s.angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.8, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 안쪽에서 바깥쪽으로 퍼져나가는 미세 방울 산포
    const sprayDrops = [
      { a: -2.5, r: 38, size: 2.8 },
      { a: -1.8, r: 46, size: 3.2 },
      { a: -1.1, r: 50, size: 3.5 },
      { a: -0.4, r: 42, size: 3.0 },
      { a: 0.3,  r: 48, size: 3.4 },
      { a: 1.0,  r: 40, size: 2.6 },
      { a: 1.8,  r: 36, size: 3.0 },
      { a: 2.6,  r: 44, size: 3.2 },
    ];
    for (const od of sprayDrops) {
      const x = tx + Math.cos(od.a) * od.r;
      const y = ty + Math.sin(od.a) * od.r;
      ctx.beginPath();
      ctx.arc(x, y, od.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // =========================================================================
  // 2. [Frame 7~9: 벽면/몸체 철푸덕 부착 및 중력 흘러내림]
  // =========================================================================
  if (step >= 7) {
    // 2-1. 벽면에 철푸덕 납작하게 부착된 넓은 비정형 액체 슬라임 본체 (🫟)
    ctx.save();
    ctx.translate(tx, ty);
    const bodyScaleX = step === 7 ? impactScale * 1.35 : impactScale * 1.25;
    const bodyScaleY = step === 7 ? impactScale * 1.15 : impactScale * 1.05;
    ctx.scale(bodyScaleX, bodyScaleY);
    ctx.fill(acidSplatterPath);
    ctx.restore();

    // 2-2. 액체가 벽면을 타고 아래로 주르륵 흘러내리는 5가닥의 굵은 드립 스트림 (정확한 tx 기준)
    const dripStreams = [
      { x: tx - 22, yStart: ty + 8,  len: dripLen * 0.65, w: 4.5 },
      { x: tx - 8,  yStart: ty + 15, len: dripLen * 1.15, w: 6.8 }, // 가장 길고 묵직한 메인 줄기
      { x: tx + 8,  yStart: ty + 13, len: dripLen * 0.90, w: 5.4 },
      { x: tx + 24, yStart: ty + 9,  len: dripLen * 0.55, w: 4.0 },
      { x: tx + 36, yStart: ty + 5,  len: dripLen * 0.35, w: 2.8 },
    ];

    for (const ds of dripStreams) {
      drawAcidDripStream(ctx, ds.x, ds.yStart, ds.len, ds.w);
    }

    // 2-3. [Frame 8~9] 줄기 끝에서 떨어져 아래로 자유낙하하는 분리 산성 방울들 (뚝뚝 떨어짐)
    if (step >= 8) {
      // 메인 줄기 아래 낙하 방울들
      ctx.beginPath();
      ctx.arc(tx - 8, ty + 15 + dripLen * 1.15 + 12, 3.2, 0, Math.PI * 2);
      ctx.arc(tx - 8, ty + 15 + dripLen * 1.15 + 24, 2.2, 0, Math.PI * 2);
      ctx.arc(tx + 8, ty + 13 + dripLen * 0.90 + 10, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // 산성 부식 기포 (보글보글 반응 점)
      const bubbles = [
        { x: tx - 12, y: ty - 4, r: 1.8 },
        { x: tx + 14, y: ty + 2, r: 1.6 },
        { x: tx - 4,  y: ty + 8, r: 2.0 },
        { x: tx + 6,  y: ty - 10, r: 1.5 },
      ];
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      for (const b of bubbles) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2-4. 벽면에 튀어 잔류된 비산 스플랫 점들 (불규칙 흩뿌림)
    const wallSpots = [
      { x: tx - 38, y: ty - 18, r: 3.2 },
      { x: tx + 42, y: ty - 14, r: 2.8 },
      { x: tx - 32, y: ty + 24, r: 3.0 },
      { x: tx + 34, y: ty + 22, r: 2.6 },
      { x: tx - 14, y: ty - 28, r: 2.4 },
      { x: tx + 20, y: ty - 24, r: 2.6 },
    ];
    for (const ws of wallSpots) {
      ctx.beginPath();
      ctx.arc(ws.x, ws.y, ws.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 051: 용해액 (Acid) 종합 이펙트 렌더러
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. 포물선으로 발사 (Parabolic Trajectory: H = 75px 고공 포물선 궤도)
 * 2. 벽에 붙은 것 처럼 퍼진 SVG 🫟 스플래터 형태 (누런색에 주황빛)
 * 3. 포물선 궤도를 따라 짙고 부드러운 잔상(Afterimages)과 유체 방울들을 연속 남기며 비행
 * 4. 타격 시 대상 포켓몬 몸체(벽면)에 찰싹 부착되어 퍼지며, 산성액이 흘러내리고 부식 거품이 보글보글 솟아오름
 */
export function drawAcidEffect(
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

  // 발사 시작점 (시전자 입/가슴 위치)
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)) + (isP ? 18 : -18);
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 16 : 10);

  // 착탄 목표점 (대상 포켓몬 중심부)
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 14 : 10);

  const arcH = 75; // 포물선 솟구침 최고 정점 높이

  // 포물선 궤도 보간 함수 (t: 0.0 ~ 1.0)
  const getParabolaPoint = (t: number) => {
    const clamped = Math.max(0, Math.min(1, t));
    const px = ax + (tx - ax) * clamped;
    const py = ay + (ty - ay) * clamped - 4 * arcH * clamped * (1 - clamped);
    return { x: px, y: py };
  };

  // 포물선 접선 방향 각도 계산
  const getParabolaAngle = (t: number) => {
    const dt = 0.01;
    const t0 = Math.max(0, t - dt);
    const t1 = Math.min(1, t + dt);
    const p0 = getParabolaPoint(t0);
    const p1 = getParabolaPoint(t1);
    return Math.atan2(p1.y - p0.y, p1.x - p0.x);
  };

  ctx.save();

  const projectileT = frame.projectileT; // 0.0 ~ 1.0 (비행 진행도)
  const isImpact = Boolean(frame.isImpact);

  // =========================================================================
  // 1. 포물선 비행 및 잔상 렌더링 (Flying along Parabolic Arc with Wake Trail)
  // =========================================================================
  if (projectileT !== undefined && projectileT > 0 && projectileT <= 1.0) {
    const headT = projectileT;

    // [유저 요구사항] "잔상 더 길게" - 궤적 절반 이상을 연속적으로 덮는 9단계 롱 테일 유체 잔상
    const afterimageSteps = [
      { dt: 0.04, alphaMult: 0.88, scaleMult: 0.95 },
      { dt: 0.08, alphaMult: 0.78, scaleMult: 0.90 },
      { dt: 0.13, alphaMult: 0.68, scaleMult: 0.85 },
      { dt: 0.19, alphaMult: 0.58, scaleMult: 0.79 },
      { dt: 0.25, alphaMult: 0.48, scaleMult: 0.73 },
      { dt: 0.32, alphaMult: 0.38, scaleMult: 0.66 },
      { dt: 0.39, alphaMult: 0.28, scaleMult: 0.58 },
      { dt: 0.47, alphaMult: 0.18, scaleMult: 0.50 },
      { dt: 0.55, alphaMult: 0.10, scaleMult: 0.42 },
    ];

    // 후방 잔상들 먼저 렌더링 (뒤에서부터 앞 순서로)
    for (let k = afterimageSteps.length - 1; k >= 0; k--) {
      const ai = afterimageSteps[k];
      const trailT = headT - ai.dt;
      if (trailT >= 0.01) {
        const pt = getParabolaPoint(trailT);
        const rot = getParabolaAngle(trailT);
        const aiScale = (frame.splatterScale ?? 0.85) * ai.scaleMult;
        const aiAlpha = (frame.splatterAlpha ?? 1.0) * ai.alphaMult * (isImpact ? 0.7 : 1.0);

        drawAcidSplatter(ctx, pt.x, pt.y, aiScale, aiAlpha, rot, {
          drawDrips: false,
          showSatelliteDrops: false,
          isFlying: true,
        });

        // 잔상 사이사이에 중력으로 살짝 떨어지는 산성 방울 잔유물 (border 제거)
        ctx.save();
        ctx.fillStyle = "rgba(245, 158, 11, " + (aiAlpha * 0.85) + ")";
        ctx.beginPath();
        ctx.arc(pt.x + (isP ? -4 : 4), pt.y + 4 * (k + 1), 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 선두 메인 투사체 (기존 타원형) 렌더링 - [유저 요구사항: "용해액 발사될 때 제일 앞에 있는 svg는 기존 타원형"]
    if (!isImpact) {
      const headPos = getParabolaPoint(headT);
      const headRot = getParabolaAngle(headT);
      const headScale = frame.splatterScale ?? 0.88;
      const headAlpha = frame.splatterAlpha ?? 1.0;

      drawAcidFlyingHead(ctx, headPos.x, headPos.y, headScale, headAlpha, headRot);
    }
  }

  // =========================================================================
  // 2. 타격 지점 벽면/몸체 부착 스플래터 및 흘러내림 (Real Liquid Arrival Impact)
  // =========================================================================
  if (isImpact) {
    const impactAlpha = frame.impactSplatterAlpha ?? 1.0;
    drawAcidArrivalEffect(ctx, tx, ty, frame, impactAlpha);
  }

  ctx.restore();
}

// ============================================================================
// 052: 불꽃세례 (Ember)
// ============================================================================

/**
 * Helper: 작은 불 알갱이 1개 (Single Fiery Ember Spark)
 * - 중심 밝은 백황색 코어 + 외곽 선명한 주황/적색 화염체 + 후방 미세 불씨 꼬리
 */
export function drawSingleEmber(
  ctx: any,
  cx: number,
  cy: number,
  rot: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 후방으로 흩날리는 미세 불씨 파편 3개 (Trailing Spark Dust)
  const sparkBeads = [
    { d: 9,  oy: -1.2, r: 1.6, c: "#F97316" },
    { x: -17, oy: 1.4,  r: 1.2, c: "#EF4444" },
    { d: 25, oy: -0.8, r: 0.9, c: "#F59E0B" },
  ];
  for (const sp of sparkBeads) {
    ctx.save();
    ctx.fillStyle = sp.c;
    ctx.beginPath();
    ctx.arc(sp.x !== undefined ? sp.x : -sp.d, sp.oy, sp.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. 비행 방향으로 날렵하게 신장된 불 알갱이 본체
  // 외곽 적색 화염 오라
  ctx.fillStyle = "#EF4444";
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.2, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 중간 생생한 주황 불꽃
  ctx.fillStyle = "#F97316";
  ctx.beginPath();
  ctx.ellipse(0.5, 0, 3.8, 2.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 중심부 백열 레몬황색 코어
  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.ellipse(1.0, 0, 2.2, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper: 바닥에 스르륵 왼쪽에서 오른쪽으로 나타나고 사라지는 약한 불꽃 (Ground Flame Sweep)
 * - [유저 요구사항] "(도달했을 때 약한 불꽃이 바닥에 스르륵 왼쪽에서 오른쪽으로 나타나고 사라짐)"
 * - 폭발형 대형 화염이 아닌, 바닥을 타고 훑고 지나가는 절제되고 유려한 약한 불꽃 파동
 */
export function drawEmberGroundSweep(
  ctx: any,
  tx: number,
  groundY: number,
  sweepProgress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || sweepProgress < 0.05 || sweepProgress > 1.30) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 바닥 불꽃이 훑고 지나가는 가로 폭 (~74px)
  const spanW = 74;
  const leftX = tx - spanW / 2;
  const waveCenterX = leftX + (spanW + 24) * sweepProgress - 12;
  const flameCount = 9;

  for (let i = 0; i < flameCount; i++) {
    const fx = leftX + (i / (flameCount - 1)) * spanW;
    const dist = Math.abs(fx - waveCenterX);
    const waveRadius = 26;

    if (dist < waveRadius) {
      const intensity = (1 - dist / waveRadius) * Math.max(0, 1.25 - sweepProgress * 0.4);
      const h = intensity * (13 + (i % 3) * 4.5);
      const w = 3.8 + (i % 2) * 1.4;
      const tilt = 0.22; // 스위프 방향(오른쪽)으로 살짝 눕는 유려한 틸트

      ctx.save();
      ctx.translate(fx, groundY);
      ctx.rotate(tilt);

      // (1) 외곽 적색 화염
      ctx.fillStyle = "#EF4444";
      ctx.beginPath();
      ctx.moveTo(-w, 0);
      ctx.quadraticCurveTo(-w * 0.8, -h * 0.55, 0, -h);
      ctx.quadraticCurveTo(w * 0.8, -h * 0.55, w, 0);
      ctx.closePath();
      ctx.fill();

      // (2) 중간 생생한 주황 화염
      ctx.fillStyle = "#F97316";
      ctx.beginPath();
      ctx.moveTo(-w * 0.65, 0);
      ctx.quadraticCurveTo(-w * 0.5, -h * 0.45, 0, -h * 0.78);
      ctx.quadraticCurveTo(w * 0.5, -h * 0.45, w * 0.65, 0);
      ctx.closePath();
      ctx.fill();

      // (3) 내부 백열 레몬황색 코어
      ctx.fillStyle = "#FEF08A";
      ctx.beginPath();
      ctx.moveTo(-w * 0.35, 0);
      ctx.quadraticCurveTo(-w * 0.25, -h * 0.35, 0, -h * 0.50);
      ctx.quadraticCurveTo(w * 0.25, -h * 0.35, w * 0.35, 0);
      ctx.closePath();
      ctx.fill();

      // (4) 불꽃 끝단에서 하늘로 살짝 피어오르는 미세 불씨
      if (intensity > 0.45 && i % 2 === 0) {
        ctx.fillStyle = "#FEF08A";
        ctx.beginPath();
        ctx.arc(1.5, -h - 3, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // 바닥 그을림 열기 라인
  const glowW = Math.min(spanW * 0.75, 32);
  const grad = ctx.createLinearGradient(waveCenterX - glowW, groundY, waveCenterX + glowW, groundY);
  grad.addColorStop(0, "rgba(239, 68, 68, 0)");
  grad.addColorStop(0.5, "rgba(249, 115, 22, " + (0.60 * alpha) + ")");
  grad.addColorStop(1, "rgba(239, 68, 68, 0)");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(waveCenterX - glowW, groundY);
  ctx.lineTo(waveCenterX + glowW, groundY);
  ctx.stroke();

  ctx.restore();
}

/**
 * 052: 불꽃세례 (Ember) 종합 이펙트 렌더러
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. 작은 불 알갱이 3개를 날림 (나란히가 아닌 시차와 높낮이가 다른 비대칭 궤적)
 * 2. 도달했을 때 약한 불꽃이 바닥에 스르륵 왼쪽에서 오른쪽으로 나타나고 사라짐
 * 3. 이때 상대 포켓몬에 붉은색 필터가 살짝 빠르게 적용됨
 */
export function drawEmberEffect(
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

  // 발사 시작점 (시전자 입/앞쪽)
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)) + (isP ? 16 : -16);
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 12 : 8);

  // 대상 착탄 기준점 (발밑 바닥)
  const tx = targetPos.x;
  const groundY = targetPos.y + (isP ? 18 : 16);

  ctx.save();

  // =========================================================================
  // 1. 작은 불 알갱이 3개 비행 ("나란히는 아님" - 시차/높낮이/스피드 분산)
  // =========================================================================
  const emberProgress = frame.emberProgress;
  if (emberProgress !== undefined && emberProgress > 0 && emberProgress <= 1.05) {
    // 3개 알갱이 각각의 독립적 궤적 및 시차 정의
    const embers = [
      // 1번: 선두 알갱이 (가장 먼저 사출, 완만한 중단 궤도)
      {
        progress: emberProgress,
        arcH: 26,
        targetDx: -6,
        targetDy: 0,
        scale: 1.0,
      },
      // 2번: 하단 후속 알갱이 (시차 0.14 뒤처짐, 낮고 빠른 직선형 궤도)
      {
        progress: (emberProgress - 0.14) / 0.86,
        arcH: 14,
        targetDx: -24,
        targetDy: 2,
        scale: 0.85,
      },
      // 3번: 상단 후속 알갱이 (시차 0.28 뒤처짐, 높게 포물선으로 솟아올랐다 떨어지는 궤도)
      {
        progress: (emberProgress - 0.28) / 0.72,
        arcH: 38,
        targetDx: 8,
        targetDy: -2,
        scale: 0.90,
      },
    ];

    for (let i = 0; i < embers.length; i++) {
      const eb = embers[i];
      const t = eb.progress;
      if (t <= 0 || t >= 1.02) continue; // 발사 전이거나 이미 착탄함

      const targetX = tx + eb.targetDx;
      const targetY = groundY + eb.targetDy;

      // 포물선 궤도 보간
      const getPt = (ct: number) => {
        const c = Math.max(0, Math.min(1, ct));
        const px = ax + (targetX - ax) * c;
        const py = ay + (targetY - ay) * c - 4 * eb.arcH * c * (1 - c);
        return { x: px, y: py };
      };

      const pt = getPt(t);
      const dt = 0.01;
      const pPrev = getPt(Math.max(0, t - dt));
      const pNext = getPt(Math.min(1, t + dt));
      const rot = Math.atan2(pNext.y - pPrev.y, pNext.x - pPrev.x);

      // 발사 순간 페이드인 및 착지 직전 선명함
      const eAlpha = t < 0.10 ? t / 0.10 : 1.0;
      drawSingleEmber(ctx, pt.x, pt.y, rot, eb.scale, eAlpha);
    }
  }

  // =========================================================================
  // 2. 바닥에 스르륵 왼쪽에서 오른쪽으로 나타나고 사라지는 약한 불꽃
  // =========================================================================
  const sweepProgress = frame.sweepProgress;
  if (sweepProgress !== undefined && sweepProgress > 0) {
    const sweepAlpha = frame.sweepAlpha ?? 1.0;
    drawEmberGroundSweep(ctx, tx, groundY, sweepProgress, sweepAlpha);
  }

  ctx.restore();
}



