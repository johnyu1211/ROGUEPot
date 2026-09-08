/**
 * Move Renderers: 061 - 064
 * 061: 거품광선 (Bubble Beam)
 * 062: 오로라빔 (Aurora Beam) - 예약
 * 063: 파괴광선 (Hyper Beam) - 예약
 * 064: 쪼기 (Peck) - 예약
 *
 * ⚠️ [개발/작업 지침 - AI 필독]
 * 1. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
 *    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하여 턴 시간을 낭비하지 말 것!
 *    코드 수정 -> 빌드 -> 뷰어 캐시 갱신 확인 후 즉시 유저에게 보고할 것.
 * 2. [256색 팔레트 최적화(Octree Optimizer) 기준 제작 지침]:
 *    - 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 85) 기반의 256색 팔레트 재사용 표준을 사용함.
 *    - 신규 기술 구현 시 과도한 반투명 그라디언트 난사를 지양하고, 256색 환경에서 선명하게 돋보이는 고채도 단색/네온 색상 체계와 30 FPS 규격 준수.
 *    - 발사 -> 타격 -> 폭발 등 주요 연출 전환 시 phaseId 또는 moveStep을 명확히 지정하여 팔레트 자동 리셋(isVisualStateShift)이 완벽히 동작하도록 구성할 것.
 */

import {
  drawPsybeamBehindEffect,
  draw3DPsybeamRing,
  drawPsybeamHollowCircle,
  PSYBEAM_RING_PALETTES,
} from "./move057_060.js";

// ============================================================================
// 061 거품광선 (Bubble Beam) Helpers
// ============================================================================

/**
 * Helper to draw a luminous, translucent anime-style water bubble (애니메이션풍 눈부신 워터 비눗방울)
 * - [유저 레퍼런스(팽도리 거품광선) 100% 반영]:
 *   1. 어두운 림 완전 제거 -> 빛을 받아 화사하게 발광하는 라이트 시안 발광 림 (#C4FFFF)
 *   2. 맑고 투명한 크리스탈 아쿠아 그라데이션 (#FFFFFF -> #E0FFFF -> #BAE6FD -> #50ADE6)
 *   3. 팽도리 거품광선 특유의 선명한 상단 좌측 순백 광택 & 핀포인트 스파클
 *   4. 하단 우측 부드러운 아쿠아 반사광
 */
export function drawWaterSoapBubble(
  ctx: any,
  x: number,
  y: number,
  r: number,
  alpha: number = 1.0
) {
  if (r <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 중간 부분이 과도하게 하얗게 뜨지 않도록 맑고 청량한 블루 톤을 강화한 수포 그라데이션
  const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.05, x, y, r);
  grad.addColorStop(0.00, "#FFFFFF"); // 작은 순백 스파클 코어
  grad.addColorStop(0.18, "#BAE6FD"); // 밝은 아이스 아쿠아
  grad.addColorStop(0.42, "#7DD3FC"); // [중간부 톤다운]: 산뜻하고 맑은 스카이 시안 블루
  grad.addColorStop(0.70, "#38BDF8"); // 청량한 비비드 시안
  grad.addColorStop(0.90, "#0EA5E9"); // 팽도리 바디 블루
  grad.addColorStop(1.00, "#0284C7"); // 외곽 오션 엣지
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // 2. [레퍼런스 핵심]: 어두운 테두리가 아닌, 빛을 받아 눈부시게 빛나는 라이트 시안 발광 림
  ctx.strokeStyle = "#C4FFFF";
  ctx.lineWidth = Math.max(1.0, r * 0.16);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // 3. 상단 좌측 선명한 순백 초승달 하이라이트
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1.1, r * 0.20);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.74, -Math.PI * 0.95, -Math.PI * 0.48);
  ctx.stroke();

  // 4. 상단 좌측 핀포인트 순백 스파클
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x - r * 0.42, y - r * 0.42, Math.max(0.9, r * 0.18), 0, Math.PI * 2);
  ctx.fill();

  // 5. 하단 우측 부드러운 아쿠아 반사광
  ctx.strokeStyle = "#E0FFFF";
  ctx.lineWidth = Math.max(0.8, r * 0.14);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.80, Math.PI * 0.15, Math.PI * 0.42);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper: 거품 뒤에 뻗어나가는 투명도 있는 파란색 빔 잔상 (Bubble Jet Stream Trail)
 * - [유저 요구사항 & 팽도리 레퍼런스 엄수]: 거품 뒤에 투명도가 있는 눈부신 시안 빔 잔상 (뒤쪽은 100% 투명함)
 * - 전방(거품 접합부): 팽도리 거품광선의 눈부신 발광 시안 화이트 (rgba(196, 255, 255, 0.75))
 * - 후방(꼬리 끝단): 100% 완전 투명 (alpha = 0.0) 페이드아웃
 * - 내부 고속 순백 워터 코어 스트릭 라인 + 상하 보조 고속 스피드라인 동시 렌더링
 */
export function drawBubbleBeamTrail(
  ctx: any,
  headX: number,
  headY: number,
  angle: number,
  trailLength: number,
  bubbleRadius: number,
  alpha: number = 1.0
) {
  if (trailLength <= 2 || alpha <= 0) return;
  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const tailL = trailLength;
  // [유저 요구사항 엄수]: 거품보다 크지 않으면서도 뒤에 시원하게 뻗는 잔상 폭 (반지름의 75%)
  const wHead = bubbleRadius * 0.75;
  const wTail = bubbleRadius * 0.18;

  // 1. 외곽 팽도리 애니풍 발광 시안 빔 잔상 (뒤로 50~62px 길고 시원하게 뻗으며 투명하게 페이드아웃)
  const auraGrad = ctx.createLinearGradient(0, 0, -tailL, 0);
  auraGrad.addColorStop(0.00, "rgba(196, 255, 255, 0.85)"); // 거품 접합부: 눈부신 발광 시안 화이트
  auraGrad.addColorStop(0.25, "rgba(125, 211, 252, 0.60)"); // 중간 1: 맑고 시원한 라이트 시안
  auraGrad.addColorStop(0.65, "rgba(56, 189, 248, 0.28)");  // 중간 2: 은은한 아쿠아
  auraGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.00)");  // 꼬리 끝단: 100% 완전 투명!

  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.moveTo(0, -wHead);
  ctx.lineTo(-tailL, -wTail);
  ctx.lineTo(-tailL, wTail);
  ctx.lineTo(0, wHead);
  ctx.closePath();
  ctx.fill();

  // 2. 내부 고속 초수류 코어 스트릭 (눈부신 순백 물줄기 중심선, 길게 잔상 유지)
  const coreGrad = ctx.createLinearGradient(0, 0, -tailL * 0.90, 0);
  coreGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.95)"); // 백색 고속 중심선
  coreGrad.addColorStop(0.35, "rgba(196, 255, 255, 0.75)"); // 발광 시안 하이라이트
  coreGrad.addColorStop(0.75, "rgba(125, 211, 252, 0.35)");
  coreGrad.addColorStop(1.00, "rgba(186, 230, 253, 0.00)"); // 투명 페이드아웃

  ctx.strokeStyle = coreGrad;
  ctx.lineWidth = Math.max(1.2, bubbleRadius * 0.24);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-tailL * 0.90, 0);
  ctx.stroke();

  // 3. 상하 보조 고속 스피드라인 2줄 (날렵한 제트 꼬리)
  const subGrad = ctx.createLinearGradient(0, 0, -tailL * 0.75, 0);
  subGrad.addColorStop(0.00, "rgba(224, 255, 255, 0.60)");
  subGrad.addColorStop(1.00, "rgba(186, 230, 253, 0.00)");

  ctx.strokeStyle = subGrad;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-2, -wHead * 0.55);
  ctx.lineTo(-tailL * 0.75, -wTail * 0.6);
  ctx.moveTo(-2, wHead * 0.55);
  ctx.lineTo(-tailL * 0.75, wTail * 0.6);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper: 거품이 피격 시 톡 터지는 물보라 파열 이펙트 (Bubble Pop Burst)
 * - 팽창하는 물방울 링 + 사방으로 비산하는 5~6개의 미세 물방울
 */
export function drawBubblePopSplash(
  ctx: any,
  x: number,
  y: number,
  progress: number, // 0.0 ~ 1.0
  baseRadius: number = 18
) {
  if (progress <= 0 || progress > 1.0) return;
  ctx.save();

  const alpha = Math.max(0, 1.0 - progress);

  // 1. 파열 물보라 팽창 링 (화사한 아쿠아 링)
  const ringR = baseRadius * (0.8 + progress * 1.5);
  ctx.strokeStyle = `rgba(125, 211, 252, ${alpha * 0.9})`;
  ctx.lineWidth = Math.max(1.2, 2.5 * (1.0 - progress * 0.6));
  ctx.beginPath();
  ctx.arc(x, y, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 내부 중심 화이트 파열 섬광
  if (progress < 0.45) {
    const flashA = (1.0 - progress / 0.45) * 0.8;
    ctx.fillStyle = `rgba(255, 255, 255, ${flashA})`;
    ctx.beginPath();
    ctx.arc(x, y, baseRadius * 0.55 * (1.0 + progress), 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 사방으로 튀는 미세 물방울 스파크 6개
  const dropletCount = 6;
  for (let i = 0; i < dropletCount; i++) {
    const angle = (i * Math.PI * 2) / dropletCount + 0.35;
    const dist = ringR * (0.9 + progress * 0.65);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist * 0.78; // 살짝 내려다보는 원근

    const dropR = Math.max(1.0, 2.4 * (1.0 - progress));
    ctx.fillStyle = i % 2 === 0 ? "#FFFFFF" : "#BAE6FD";
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, dropR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ============================================================================
// 061 거품광선 (Bubble Beam) Export Functions
// ============================================================================

/**
 * 거품광선 배후 효과: 포켓몬 뒤편에 뿜어지는 은은한 워터 제트 오라
 */
export function drawBubbleBeamBehindEffect(
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
  if (frame.showEffect === false) return;
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 12 : 8);
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0) return;

  const streamT = frame.streamT ?? 0;
  if (streamT <= 0) return;

  // 시전자~비행 선단 사이의 시원한 수류 오라 워시 (폭 18px)
  ctx.save();
  const angle = Math.atan2(dy, dx);
  ctx.translate(ax, ay);
  ctx.rotate(angle);

  const currentLen = dist * Math.min(1.0, streamT);
  const auraAlpha = frame.beamAuraAlpha ?? 0.25;

  const auraGrad = ctx.createLinearGradient(0, 0, currentLen, 0);
  auraGrad.addColorStop(0.0, "rgba(186, 230, 253, 0.35)");
  auraGrad.addColorStop(0.5, "rgba(125, 211, 252, 0.20)");
  auraGrad.addColorStop(1.0, "rgba(125, 211, 252, 0.00)"); // 꼬리 쪽 100% 투명

  ctx.fillStyle = auraGrad;
  ctx.globalAlpha = Math.min(1.0, auraAlpha);
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(currentLen, -9);
  ctx.lineTo(currentLen, 9);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 061 거품광선 메인 이펙트
 * - [유저 요구사항 100% 구현]:
 *   1. 팽도리 레퍼런스 발광 시안 워터 컬러
 *   2. [크기 확대 & 적정 거리]: 17~19px로 볼륨감 있게 키우고 적당한 간격으로 일직선 쇄도
 *   3. [시원하고 긴 잔상]: 거품 뒤로 75~85px 길고 투명하게 빠지는 선명한 빔 잔상
 *   4. 대상 피격 시 연속 파열 물보라
 */
export function drawBubbleBeamEffect(
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
  if (frame.showEffect === false) return;
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;

  // 시전자 및 대상 좌표 (피격 앵커 보정)
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 12 : 8);
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  ctx.save();

  // [유저 피드백 반영]: 과하지 않고 자연스러운 적정 높낮이 편차 (radius: 7.0~8.5px, perpOffset: -4.0~+3.6px)
  const BUBBLE_CONFIGS = [
    { radius: 8.5, perpOffset: -0.8, trailLen: 62 },   // 1호 (선두: 거의 중앙)
    { radius: 7.5, perpOffset: 3.6,  trailLen: 56 },   // 2호 (살짝 하단)
    { radius: 8.0, perpOffset: -4.0, trailLen: 60 },   // 3호 (살짝 상단)
    { radius: 7.0, perpOffset: 3.4,  trailLen: 54 },   // 4호 (살짝 하단)
    { radius: 8.0, perpOffset: -3.6, trailLen: 58 },   // 5호 (살짝 상단)
    { radius: 7.5, perpOffset: 1.0,  trailLen: 56 },   // 6호 (후미: 거의 중앙)
  ];

  // 프레임에서 전달받은 개별 진행도 (0.0 ~ 1.0 = 비행 중, 1.0+ = 타격 파열)
  const bubbleProgresses: number[] = frame.bubbles || [];
  const globalAlpha = frame.effectAlpha ?? 1.0;

  // 비행 중인 거품들은 후방(작은 진행도)부터 전방(큰 진행도) 순으로 정렬 렌더링
  const renderItems: Array<{ index: number; prog: number }> = [];
  for (let i = 0; i < bubbleProgresses.length; i++) {
    const prog = bubbleProgresses[i];
    if (prog !== undefined && prog > 0) {
      renderItems.push({ index: i, prog });
    }
  }
  renderItems.sort((a, b) => a.prog - b.prog);

  // 직교 단위 벡터 (일직선 비행 축)
  const normX = -Math.sin(angle);
  const normY = Math.cos(angle);

  for (const item of renderItems) {
    const i = item.index;
    const prog = item.prog;
    const cfg = BUBBLE_CONFIGS[i % BUBBLE_CONFIGS.length];

    if (prog < 1.0) {
      // -------------------------------------------------------------
      // A. 비행 단계: [일직선 비행] + [높낮이 변화] + [선명하고 긴 빔 잔상]
      // -------------------------------------------------------------
      const flightT = Math.max(0, Math.min(1.0, prog));

      // 발사 시 입에서 살짝 모여 나온 후 비행 구간에서 자연스럽게 높낮이 전개
      const spreadT = Math.min(1.0, flightT / 0.18);
      const effectiveOffset = cfg.perpOffset * (0.35 + 0.65 * spreadT);

      const baseX = ax + dx * flightT;
      const baseY = ay + dy * flightT;

      const curX = baseX + normX * effectiveOffset;
      const curY = baseY + normY * effectiveOffset;

      // 발사 초기 자연스러운 페이드인
      const bAlpha = Math.min(1.0, flightT / 0.10) * globalAlpha;

      // 1. [유저 요구사항]: 거품 뒤에 선명하고 길게 남는 투명 빔 잔상 (54~62px)
      const activeTrailLen = Math.min(cfg.trailLen, flightT * dist * 0.92);
      drawBubbleBeamTrail(ctx, curX, curY, angle, activeTrailLen, cfg.radius, bAlpha * 0.95);

      // 2. [유저 요구사항]: 작고 산뜻한 수포
      drawWaterSoapBubble(ctx, curX, curY, cfg.radius, bAlpha);
    } else {
      // -------------------------------------------------------------
      // B. 피격 파열 단계: 대상 몸체에 격돌하여 톡 터지는 물보라 (각 높이에 맞게 격돌)
      // -------------------------------------------------------------
      const popProg = Math.min(1.0, (prog - 1.0) / 0.40); // 1.0 ~ 1.40 동안 파열
      if (popProg < 1.0) {
        const hitX = tx + normX * cfg.perpOffset;
        const hitY = ty + normY * cfg.perpOffset;
        drawBubblePopSplash(ctx, hitX, hitY, popProg, cfg.radius);
      }
    }
  }

  // C. 최종 피격 정리 연출: 7발 격돌 후 대상 발밑의 물방울 파문 및 감속 스피드 다운 힌트
  const splashRingProg = frame.splashRingProg;
  if (splashRingProg !== undefined && splashRingProg > 0 && splashRingProg <= 1.0) {
    const ringR = 24 + splashRingProg * 18;
    const ringA = Math.max(0, 1.0 - splashRingProg) * 0.65;
    ctx.strokeStyle = `rgba(125, 211, 252, ${ringA})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 18, ringR, ringR * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
// 062 오로라빔 (Aurora Beam) Helpers & Renderers
// ============================================================================

/**
 * Helper: 4포인트 다이아몬드 프리즘 얼음 스파클
 */
function drawDiamondSparkle(
  ctx: any,
  x: number,
  y: number,
  size: number,
  color: string = "#FFFFFF",
  rotation: number = 0,
  alpha: number = 1.0
) {
  if (size <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.28, -size * 0.28);
  ctx.lineTo(size, 0);
  ctx.lineTo(size * 0.28, size * 0.28);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.28, size * 0.28);
  ctx.lineTo(-size, 0);
  ctx.lineTo(-size * 0.28, -size * 0.28);
  ctx.closePath();
  ctx.fill();

  // 중앙 미세 순백 코어
  if (color !== "#FFFFFF") {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.8, size * 0.22), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ============================================================================
// 062 오로라빔 (Aurora Beam) Helpers & Renderers
// ============================================================================

/**
 * 062 오로라빔 배후 효과:
 * 1. [유저 필수 요구사항]: 화면 어둡게하는 검정 필터 (Screen Darkening Filter)
 *    - ⚠️ 상대 시전 시 / 카메라 줌 & 팬 시 절대 잘리지 않도록 초광역 바운드(-10000, -10000, 20000, 20000) 채움
 * 2. [유저 요구사항]: 우리 환상빔 배후 효과 그대로 적용!
 */
export function drawAuroraBeamBehindEffect(
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
  if (frame.showEffect === false) return;

  // 1. [유저 핵심 요구사항]: 화면 어둡게하는 검정 필터 (Screen Darkening Filter)
  // - ⚠️ 상대 시전 시 / 카메라 줌 & 팬 시 절대 잘리지 않도록 초광역 바운드(-10000, -10000, 20000, 20000) 채움!
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(6, 10, 24, ${Math.min(0.85, dimAlpha)})`;
    ctx.fillRect(-10000, -10000, 20000, 20000);
    ctx.restore();
  }

  // 2. [유저 요구사항 엄수]: "오로라빔 발사는 초반에 살짝만 하고 나머지는 느려진 링이 가까워질수록 느려지니까 뭉쳐져서 타격되도록"
  // - 시전자와 영구 연결된 고정 빔 오라가 아니라, 비행하는 링 패킷(tailT ~ leaderT) 주위를 감싸는 오로라 에너지 오라
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0) return;

  const leaderT = frame.leaderT ?? frame.beamT ?? (step * 0.28);
  const tailT = frame.tailT ?? 0.0;
  const beamAlpha = frame.beamAlpha ?? (step >= 7 ? Math.max(0, 1.0 - (step - 6) * 0.45) : 1.0);

  if (beamAlpha > 0 && leaderT > 0 && step <= 7) {
    ctx.save();
    const mainAngle = Math.atan2(dy, dx);
    ctx.translate(ax, ay);
    ctx.rotate(mainAngle);

    const startX = dist * Math.max(0, tailT);
    const endX = dist * Math.min(1.0, leaderT);
    const packetLen = endX - startX;

    if (packetLen > 2) {
      const hStart = 11 + (startX / dist) * 11;
      const hEnd = 11 + (endX / dist) * 11;

      ctx.globalAlpha = Math.min(1.0, beamAlpha * 0.26);
      const auraGrad = ctx.createLinearGradient(startX, 0, endX, 0);
      auraGrad.addColorStop(0.00, "rgba(59, 92, 232, 0.35)");   // Blue
      auraGrad.addColorStop(0.28, "rgba(255, 160, 32, 0.35)");  // Amber Orange
      auraGrad.addColorStop(0.55, "rgba(214, 8, 215, 0.35)");   // Hot Magenta
      auraGrad.addColorStop(0.80, "rgba(168, 23, 225, 0.35)");  // Violet
      auraGrad.addColorStop(1.00, "rgba(121, 82, 204, 0.40)");  // Lavender

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.moveTo(startX, -hStart);
      ctx.lineTo(endX, -hEnd);
      ctx.lineTo(endX, hEnd);
      ctx.lineTo(startX, hStart);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * 062 오로라빔 메인 이펙트
 * - [유저 요구사항 100% 반영]:
 *   1. "오로라빔 발사는 초반에 살짝만 하고 나머지는 느려진 링이 가까워질수록 느려지니까 뭉쳐져서 타격되도록"
 *   2. 초반에만 발사되고 시전자와 분리되어 비행하는 8개 다각도 3D 링 패킷 체계
 *   3. 선두가 감속하면서 뒤 링들이 빠르게 따라붙어 간격이 점점 좁아지는 감속 뭉쳐짐(Accordion Bunching)
 *   4. 적 앞에서 고밀도로 겹쳐진 채 회전하며 타격 및 충격파 대폭발
 */
export function drawAuroraBeamEffect(
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
  if (frame.showEffect === false) return;
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  // 시전자 및 대상 중심 좌표
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);

  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);

  ctx.save();

  // 비행 진행 방향 축 각도
  const mainAngle = Math.atan2(dy, dx);

  const leaderT = frame.leaderT ?? frame.beamT ?? Math.min(1.0, step * 0.28);
  const tailT = frame.tailT ?? 0.0;
  const streamPhase = frame.streamPhase ?? (step - 1);
  const burstR = frame.psyBurstR ?? frame.yellowBurstR;
  const beamAlpha = frame.beamAlpha ?? (step >= 8 ? 0 : 1.0);

  const NUM_RINGS = 8;
  const BASE_RING_RADIUS = 10.5; // 시전자 발사부 기준 링 반경 (10.5px)

  const dirSign = dx >= 0 ? 1 : -1;
  const baseTilt = dirSign * (7.5 * Math.PI / 180);

  // 다각도 3D 틸트 베이스 각도군
  const RING_TILT_ANGLES = [
    -42, 28, -20, 52, -32, 38, -55, 20,
    -14, 46, -36, 24, -48, 34, -26, 58
  ];

  if (beamAlpha > 0 && leaderT > 0 && (step <= 7 || (burstR !== undefined && burstR < 70))) {
    // [유저 요구사항 100% 반영]:
    // "오로라빔 발사는 초반에 살짝만 하고 나머지는 느려진 링이 가까워질수록 느려지니까 뭉쳐져서 타격되도록"
    // 1. 발사는 초반에만: 링 패킷이 시전자로부터 사출 후 분리되어 독립 비행
    // 2. 적에게 가까워질수록 느려짐: 선두 링이 급감속하여 뒤쪽 링들이 따라붙으며 간격이 극적으로 좁아짐(Accordion Bunching)
    // 3. 뭉쳐져서 타격: 타겟 앞에서 8개의 다각도 3D 링이 빽빽하게 겹쳐지며 고밀도 집적 타격!
    for (let i = 0; i < NUM_RINGS; i++) {
      // i = 0: 선두 링 (Leader), i = NUM_RINGS - 1: 후미 링 (Tail)
      const frac = i / (NUM_RINGS - 1); // 0.0 (leader) ~ 1.0 (tail)

      // 감속에 따른 비선형 간격 압축: 선두(frac ~ 0)일수록 더 빽빽하게 압축됨
      const compressFrac = Math.pow(frac, 1.25);
      const ringT = leaderT - (leaderT - tailT) * compressFrac;

      // 발사 전(ringT < -0.02)인 링은 시전자 내부에 있으므로 렌더링 생략
      if (ringT < -0.02) continue;

      const clampedT = Math.max(0, Math.min(1.0, ringT));
      const rx = ax + dx * clampedT;
      const ry = ay + dy * clampedT;

      // 미세한 파동 진동
      const wave = Math.sin(clampedT * Math.PI * 6 - streamPhase * 1.5) * (1.2 * (1.0 - clampedT * 0.4));
      const normX = -Math.sin(mainAngle);
      const normY = Math.cos(mainAngle);
      const cx = rx + normX * wave;
      const cy = ry + normY * wave;

      // 대상에 가까워질수록 링의 크기가 자연스럽게 확장 (10.5px -> ~21px)
      const expandFactor = 1.0 + clampedT * 1.0;
      const curRadius = BASE_RING_RADIUS * expandFactor;

      // 환상빔 5색 팔레트 인덱스
      const paletteIndex = Math.abs(Math.floor(i - streamPhase * 2 + 1200)) % PSYBEAM_RING_PALETTES.length;

      // 링 개별 투명도
      let ringAlpha = beamAlpha;
      if (clampedT < 0.05 && tailT <= 0.01) {
        ringAlpha *= (clampedT / 0.05);
      }

      // [유저 요구사항]: "발사되는거 좀만 더 다각도화 & 적에게 가까워질수록 회전량 많아지게"
      const tiltDeg = RING_TILT_ANGLES[i % RING_TILT_ANGLES.length];
      const tiltFactor = 0.75 + 0.85 * Math.pow(clampedT, 1.25);
      const spinSpeed = 0.25 + 0.75 * Math.pow(clampedT, 1.6);
      const spinDirection = (i % 2 === 0) ? 1 : -1;
      const spinAngle = streamPhase * spinSpeed * spinDirection;
      const dynamicTilt = baseTilt + (tiltDeg * (Math.PI / 180) * tiltFactor) + spinAngle;

      const depthTumble = Math.abs(Math.cos(dynamicTilt * 1.3 + streamPhase * 0.4 * (0.5 + clampedT * 0.5)));
      const dynamicDepth = 0.58 + 0.36 * depthTumble;

      // 뭉쳐져서 타격되는 접촉부 (clampedT >= 0.95 && leaderT >= 0.98): 타겟 몸체에 감기며 원형 펼침
      if (clampedT >= 0.95 && leaderT >= 0.98) {
        const contactMorph = Math.min(1.0, (clampedT - 0.95) / 0.05);
        const contactR = curRadius + contactMorph * 5.0;
        const depthRatio = dynamicDepth + contactMorph * (0.98 - dynamicDepth);
        const tilt = dynamicTilt * (1.0 - contactMorph * 0.5);
        draw3DPsybeamRing(ctx, cx, cy, tilt, contactR, ringAlpha, depthRatio, 1.3, paletteIndex);
      } else {
        // 비행 본체: 다각도로 회전하는 슬림한 3D 링
        draw3DPsybeamRing(ctx, cx, cy, dynamicTilt, curRadius, ringAlpha, dynamicDepth, 1.2, paletteIndex);
      }
    }

    // 타겟 지점에 압축된 링들이 닿을 때 접촉 회전 링 형성 (leaderT >= 0.98, step 5~6)
    if (leaderT >= 0.98 && step >= 5 && step <= 6) {
      for (let c = 0; c < 3; c++) {
        const cR = 15 + c * 6.0 + Math.sin(streamPhase * 2.2 + c) * 1.5;
        const cAlpha = Math.min(1.0, beamAlpha * (0.90 - c * 0.20));
        const cPalIdx = (streamPhase + c * 2) % PSYBEAM_RING_PALETTES.length;
        const cTilt = baseTilt * 0.5 + ((c % 2 === 0 ? 40 : -40) * Math.PI / 180) + streamPhase * 0.70 * (c % 2 === 0 ? 1 : -1);
        const cDepth = 0.65 + 0.30 * Math.abs(Math.sin(streamPhase * 0.8 + c));
        draw3DPsybeamRing(ctx, tx, ty, cTilt, cR, cAlpha, cDepth, 1.3, cPalIdx);
      }
    }
  }

  // 2. 뭉쳐진 링 타격 후: 접촉 지점에서 중간이 투명한 사이킥 원의 외곽 확산 폭발!
  if (burstR !== undefined && burstR > 0) {
    const burstAlpha = frame.burstAlpha ?? 0.80;
    drawPsybeamHollowCircle(ctx, tx, ty, burstR, burstAlpha);

    // 중심부에서 튀어나오는 다채로운 스파크 (환상빔 5색 팔레트)
    if (burstAlpha > 0.4) {
      const sparkColors = ["#3B5CE8", "#FFA020", "#D608D7", "#A817E1", "#7952CC"];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + burstR * 0.05;
        const spDist = burstR * 0.75;
        const spX = tx + Math.cos(a) * spDist;
        const spY = ty + Math.sin(a) * spDist;
        ctx.save();
        ctx.fillStyle = sparkColors[i % sparkColors.length];
        ctx.fillRect(spX - 1.5, spY - 1.5, 3, 3);
        ctx.restore();
      }
    }
  }

  ctx.restore();
}



