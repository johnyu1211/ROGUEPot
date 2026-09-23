// ============================================================================
// ⚠️ [개발 지침 - AI 필독]
// 1. 256색 팔레트 최적화 (Octree Optimizer) 기준: 고채도 비비드 단색 및 3~4단계 톤 대비.
// 2. 프레임별 이미지 추출/조회 루프 금지 (유저는 웹 뷰어 http://localhost:3456 에서 직접 확인).
// 3. 시전자 모션 기승전결(모으기 ➔ 돌진/방출 ➔ 타격 ➔ 복귀)을 지킬 것.
// ============================================================================

import { createCanvas } from "@napi-rs/canvas";
import { drawFittedBattleSprite } from "../../common/spriteLoader.js";
import { drawGrowlLightning } from "./move045_048.js";
import { drawMiniRetroStar, drawStatBoostEffect } from "../common/helpers.js";

// ============================================================================
// 101: 나이트헤드 (Night Shade)
// ============================================================================

/**
 * 나이트헤드 배경 레이어 (유저 요구사항: 암전된 상태 & 암전 페이드인)
 * - 시전자 뒤편 및 전체 전장을 뒤덮는 칠흑 같은 심연의 어둠 그라데이션
 * - 시전자 발밑에서 피어오르는 보랏빛 음영 오라
 * - 페이드인/페이드아웃 곡선에 따라 자연스럽게 암전 조절
 */
export function drawNightShadeBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const darkAlpha = frame.darkAlpha ?? 0;
  if (darkAlpha <= 0.01) return;

  const isP = drawCtx.isPlayer;
  const cm = isP ? drawCtx.pm : drawCtx.em;
  const cx = cm.x;
  const cy = cm.y - (cm.size * 0.5);

  ctx.save();
  // 1. 전체 전장 암전 (심연의 짙은 나이트메어 블랙-바이올렛)
  const baseGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 420);
  baseGrad.addColorStop(0.0, `rgba(20, 10, 32, ${0.90 * darkAlpha})`);
  baseGrad.addColorStop(0.5, `rgba(12, 6, 20, ${0.95 * darkAlpha})`);
  baseGrad.addColorStop(1.0, `rgba(4, 2, 8, ${0.98 * darkAlpha})`);

  ctx.fillStyle = baseGrad;
  ctx.fillRect(-5000, -5000, 15000, 15000);

  // 2. 시전자 주변 바닥에서 피어오르는 어둠의 원혼 안개/음영 오라
  const auraGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 140);
  auraGrad.addColorStop(0.0, `rgba(147, 51, 234, ${0.30 * darkAlpha})`);
  auraGrad.addColorStop(0.6, `rgba(88, 28, 135, ${0.18 * darkAlpha})`);
  auraGrad.addColorStop(1.0, "rgba(88, 28, 135, 0.0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 나이트헤드 전면 레이어 (유저 요구사항:
 * 1. 시전 포켓몬의 스프라이트를 그대로 둔 채로
 * 2. 위에 반투명 + 채도밝기 살짝 높인 시전 포켓몬 스프라이트를 z축 위에 표시하고 크기를 커지게)
 */
export function drawNightShadeEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const phantomAlpha = frame.phantomAlpha ?? 0;
  if (phantomAlpha <= 0.01) return;

  const isP = drawCtx.isPlayer;
  const casterSprite = isP ? drawCtx.playerSprite : drawCtx.enemySprite;
  if (!casterSprite) return;

  const cm = isP ? drawCtx.pm : drawCtx.em;
  const scale = frame.phantomScale ?? 1.5;

  ctx.save();

  // 1. 반투명도 설정 (유저 요구사항: 기본적으로 확실한 반투명 상태)
  // 최대 0.46 수준으로 제한하여 지상의 본체와 배경이 항상 투과되도록 유지
  const finalAlpha = Math.min(0.46, Math.max(0.0, phantomAlpha));
  ctx.globalAlpha = finalAlpha;

  // 2. 유저 요구사항: 채도 + 밝기 살짝 높인 시전 포켓몬 스프라이트
  // 불투명화 방지를 위해 그림자 투명도를 대폭 낮춘 은은한 고스트 림 글로우 적용
  ctx.filter = "brightness(1.22) saturate(1.30) drop-shadow(0px 0px 6px rgba(168, 85, 247, 0.25))";

  // 3. z축 상단 확대 연출:
  // 기본 시전자 중심점 계산
  const baseCenterX = cm.x;
  const baseCenterY = cm.y - (cm.size * 0.5);

  // 크기가 커지면서 위로 살짝 부유하여 전장을 위압적으로 덮음
  const floatY = (scale - 1.0) * (cm.size * 0.22);
  const targetX = baseCenterX;
  const targetY = baseCenterY + (cm.size * scale * 0.5) - floatY;

  drawFittedBattleSprite(ctx, casterSprite, targetX, targetY, cm.size * scale);

  ctx.restore();
}

// ============================================================================
// 103: 싫은소리 (Screech)
// ============================================================================

/**
 * 싫은소리 3D 원추형 링 상의 6방향 번개 배치 각도 (3D 타원 원주 둘레를 6등분하여 원형 배치)
 * - 6개의 ⚡ 번개모양이 3D 링 원주 둘레(0°, 60°, 120°, 180°, 240°, 300°)를 둥글게 감싸며 배치
 * - [유저 요구사항]:
 *   1) "회전하게 해주고": 링이 전진하면서 6개의 번개 위치가 원주 둘레를 따라 부드럽게 회전(Rotation)
 *   2) "방향이 꺾인선이 정면을 향하게 (선말하는거임)": 번개 촉/진행 방향(heading)이 외곽 방사가 아닌
 *      적(상대방)을 향하는 '정면(mainAngle)'을 똑바로 조준!
 *   3) "그리고 울부짖기처럼 번개모양 6개인가? 그거": 울부짖기 정통 지그재그 ⚡ 번개 폴리곤 6개
 */
const SCREECH_3D_RING_ANGLES = [
  0,
  (60 * Math.PI) / 180,
  (120 * Math.PI) / 180,
  Math.PI,
  (240 * Math.PI) / 180,
  (300 * Math.PI) / 180,
];

function drawScreech3DRingLightningSet(
  ctx: any,
  cx: number,
  cy: number,
  mainAngle: number,
  radius: number,
  baseScale: number,
  alpha: number,
  depthRatio: number = 0.58,
  rotAngle: number = 0
) {
  if (baseScale <= 0 || alpha <= 0) return;

  const cosM = Math.cos(mainAngle);
  const sinM = Math.sin(mainAngle);

  // 6개 번개의 3D 원주상 회전 위치 계산
  const bolts = SCREECH_3D_RING_ANGLES.map((basePhi) => {
    const phi = basePhi + rotAngle;
    // 3D 링 로컬 타원 좌표 (u: 비행축, v: 횡단축)
    const u = Math.cos(phi) * radius * depthRatio;
    const v = Math.sin(phi) * radius * 1.08;

    // 월드 좌표 변환
    const wx = cx + cosM * u - sinM * v;
    const wy = cy + sinM * u + cosM * v;

    // 3D 등각 원근 깊이 스케일링 (화면 상단 원경 0.85 ~ 하단 근경 1.18)
    const depthFactor = 1.0 + ((wy - cy) / (radius * 1.08 + 1)) * 0.20;
    const finalScale = Math.max(0.30, baseScale * depthFactor);
    const finalAlpha = Math.min(1.0, Math.max(0.04, alpha * (0.88 + (depthFactor - 1.0) * 0.12)));

    // [유저 요구사항] 방향이 꺾인선이 정면을 향하게 -> heading = mainAngle!
    const heading = mainAngle;

    return { wx, wy, heading, finalScale, finalAlpha };
  });

  // 깊이 정렬 (원경 -> 근경 순서로 렌더링하여 입체 오버랩)
  bolts.sort((a, b) => a.wy - b.wy);

  for (const b of bolts) {
    drawGrowlLightning(ctx, b.wx, b.wy, b.heading, 0, b.finalScale, b.finalAlpha);
  }
}

/**
 * 울부짖기 스타일 3D 원근 방향 정렬 자글자글한 원 (Screech 3D Jagged Circle)
 * - 중심부는 완전 투명하여 시전자 및 전장 배경이 온전히 비침 (울음소리/울부짖기 원과 동일 메커니즘)
 * - 진행 축(angle)에 맞추어 3D 원근 압축(depthRatio: 0.58, scale Y: 1.08) 적용되어 적 방향으로 비행
 * - 가장자리(외각) 둘레가 매끄러운 타원이 아닌 고주파로 자글자글하게 요동치는 톱니(Jagged) 폴리곤
 * - [유저 요구사항]: "회전하게 해주고" -> rotAngle 반영하여 톱니 둘레가 날카롭게 회전(Spin)
 * - 외곽선: 네온 옐로우/골드 림 + 순백 샤프 코어 라인
 */
/**
 * 반투명한 노란 회전선 렌더러
 * - [유저 요구사항]: "회전감 느껴지는 선 제거, 대신 반투명한 노란 회전선 추가 (회전선은 진행방향쪽은 반투명 뒤쪽은 투명)"
 * - 회전 방향(dir: -1=반시계/왼쪽, +1=시계/오른쪽)으로 전진하는 호선 스트릭
 * - 진행방향(선두/Head)은 선명한 반투명 노란색(alpha ~0.72)
 * - 뒤쪽(꼬리/Tail)으로 갈수록 점진적으로 감쇠되어 완전 투명(alpha 0.0)으로 페이드아웃
 */
function drawTranslucentYellowRotationArcs(
  ctx: any,
  radius: number,
  rotAngle: number,
  dir: number,
  alpha: number = 1.0,
  numArcs: number = 2
) {
  if (radius <= 6 || alpha <= 0.02) return;

  const steps = 18;
  const arcSpan = Math.PI * 0.52; // 약 94도 길이의 회전 호선

  for (let k = 0; k < numArcs; k++) {
    const headAngle = rotAngle + (k / numArcs) * Math.PI * 2;

    for (let s = 0; s < steps; s++) {
      const frac0 = s / steps;
      const frac1 = (s + 1) / steps;

      const ang0 = headAngle - dir * arcSpan * (1 - frac0);
      const ang1 = headAngle - dir * arcSpan * (1 - frac1);

      const midFrac = (frac0 + frac1) * 0.5;
      // [유저 요구사항]: 진행방향쪽(midFrac -> 1)은 반투명 노란색, 뒤쪽(midFrac -> 0)은 완전 투명
      const segAlpha = Math.pow(midFrac, 1.8) * 0.72 * alpha;
      if (segAlpha <= 0.01) continue;

      const segWidth = 1.2 + midFrac * 2.8;

      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = segWidth;
      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(253, 224, 71, ${segAlpha})`;
      ctx.arc(0, 0, radius, ang0, ang1, dir < 0);
      ctx.stroke();

      // 진행방향 선두 35%에 밝은 하이라이트 코어
      if (midFrac > 0.65) {
        const coreAlpha = ((midFrac - 0.65) / 0.35) * 0.55 * alpha;
        ctx.beginPath();
        ctx.lineWidth = segWidth * 0.5;
        ctx.strokeStyle = `rgba(254, 240, 138, ${coreAlpha})`;
        ctx.arc(0, 0, radius, ang0, ang1, dir < 0);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

export function draw3DJaggedScreechCircle(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  radius: number,
  toothDepth: number = 8,
  alpha: number = 1.0,
  outerColor: string = "#FACC15",
  seed: number = 0,
  depthRatio: number = 0.58,
  rotAngle: number = 0,
  fixedSegments?: number,
  dir: number = -1
) {
  if (radius <= 3 || alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle); // 울부짖기 비행 진행 축 정렬
  ctx.scale(depthRatio, 1.08); // 3D 원근 틸트 타원 원반 형성

  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // [유저 요구사항] "외각이 자글자글한 풍부한 톱니 수 복원 & 회전 체감 유지":
  // 자글자글한 고주파 음파 느낌을 살리기 위해 30~46개의 풍부한 톱니날 구성
  const numTeeth = fixedSegments ? Math.round(fixedSegments / 2) : 36;

  // 1. 자글자글하고 날카로운 회전 톱니(Saw-Tooth) 폴리곤 패스
  // - 회전 방향(dir)으로 톱니 날이 기운 형태(directional lean)로 회전 시각화
  ctx.beginPath();
  const lean = dir * 0.20; // 회전 방향으로 기운 톱니 팁 오프셋

  for (let t = 0; t <= numTeeth; t++) {
    const basePhi = (t / numTeeth) * Math.PI * 2 + rotAngle;

    // 톱니 첨단 (Tip)
    const phiTip = basePhi + lean * (Math.PI / numTeeth);
    const harmonicTip = Math.sin((t / numTeeth) * Math.PI * 8 + seed) * (toothDepth * 0.20);
    const rTip = Math.max(2, radius + toothDepth + harmonicTip);
    const pxTip = Math.cos(phiTip) * rTip;
    const pyTip = Math.sin(phiTip) * rTip;

    // 톱니 골 (Valley)
    const phiValley = basePhi + (Math.PI / numTeeth);
    const harmonicValley = Math.cos((t / numTeeth) * Math.PI * 8 + seed) * (toothDepth * 0.12);
    const rValley = Math.max(2, radius - toothDepth * 0.40 + harmonicValley);
    const pxValley = Math.cos(phiValley) * rValley;
    const pyValley = Math.sin(phiValley) * rValley;

    if (t === 0) {
      ctx.moveTo(pxTip, pyTip);
    } else {
      ctx.lineTo(pxTip, pyTip);
    }
    if (t < numTeeth) {
      ctx.lineTo(pxValley, pyValley);
    }
  }
  ctx.closePath();

  // 2. 울부짖기/울음소리 스타일 방사형 그라데이션 (중심부 투명, 외각 발색)
  const maxR = radius + toothDepth + 4;
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
  grad.addColorStop(0.0, "rgba(254, 240, 138, 0.0)");       // 중심부: 100% 완전 투명
  grad.addColorStop(0.35, "rgba(254, 240, 138, 0.0)");      // 안쪽 투명 영역 유지
  grad.addColorStop(0.68, "rgba(250, 204, 21, 0.22)");      // 선명한 네온 옐로우 바디
  grad.addColorStop(0.86, "rgba(234, 179, 8, 0.48)");       // 고주파 소음 충격파
  grad.addColorStop(1.0, "rgba(253, 224, 71, 0.78)");       // 외곽 가장자리: 선명한 옐로우

  ctx.fillStyle = grad;
  ctx.fill();

  // 3. 자글자글한 외각 테두리 스트로크 (외곽 옐로우/골드 + 내부 순백)
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = outerColor;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke();

  // 4. [유저 요구사항] "회전감 느껴지는 선 제거, 대신 반투명한 노란 회전선 추가 (진행방향쪽은 반투명 뒤쪽은 투명)"
  // 이전의 흰색 스포크 직선은 완전 제거하고, 링을 따라 도는 반투명 노란 회전선 2겹 적용!
  drawTranslucentYellowRotationArcs(ctx, radius * 0.82, rotAngle, dir, alpha, 2);
  drawTranslucentYellowRotationArcs(ctx, radius * 0.58, rotAngle + Math.PI * 0.45, dir, alpha * 0.75, 2);

  ctx.restore();
}

/**
 * 싫은소리 메인 이펙트 렌더러
 * - 울부짖기처럼 시전자에서 상대를 향하는 3D 비행 축 방향으로 전진하는 자글자글한 원추형 링
 * - 6개의 ⚡ 번개모양이 선두 링보다 앞서서 먼저 쇄도하며 정면을 조준
 */
export function drawScreechEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
  if (!attackerPos || !targetPos) return;

  // 시전자와 대상의 실제 렌더링 위치 (울부짖기 축 방식)
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);

  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  // 시전자 -> 대상 방향 주 각도 (비행 궤적 축)
  const mainAngle = Math.atan2(ty - ay, tx - ax);

  // 1. 울부짖기 스타일 전방 지향성 3D 자글자글한 음파 링 렌더링 (screechRings)
  // [유저 요구사항]:
  // - "자글자글한 날의 갯수 풍부하게 복원": 30, 38, 46개의 촘촘한 톱니날
  // - "막 1번 왼쪽회전 막2번 오른쪽회전 막3번 왼쪽회전"
  if (frame.screechRings && Array.isArray(frame.screechRings)) {
    // 뒤에서 앞 순서로 렌더링하여 3D 깊이감 형성
    const sortedRings = [...frame.screechRings].sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
    const step = frame.moveStep ?? 1;

    // 각 막(링)별 풍부하고 자글자글한 톱니 수 및 시드 설정 (형태 불변 유지)
    const RING_CONFIGS = [
      { segments: 60, seed: 107 }, // 막 1번 (안쪽/후미): 30개 자글자글한 톱니
      { segments: 76, seed: 211 }, // 막 2번 (중간): 38개 자글자글한 톱니
      { segments: 92, seed: 337 }, // 막 3번 (바깥/선두): 46개 자글자글한 톱니
    ];

    for (let idx = 0; idx < sortedRings.length; idx++) {
      const ring = sortedRings[idx];
      const t = ring.t ?? 0;
      const cx = ax + (tx - ax) * t;
      const cy = ay + (ty - ay) * t;

      const ringConfig = RING_CONFIGS[idx % RING_CONFIGS.length];

      // [유저 요구사항] "막 1번 왼쪽회전 막2번 오른쪽회전 막3번 왼쪽회전":
      // idx 0 (막 1번): 왼쪽 회전 (반시계, dir = -1)
      // idx 1 (막 2번): 오른쪽 회전 (시계, dir = +1)
      // idx 2 (막 3번): 왼쪽 회전 (반시계, dir = -1)
      const dir = (idx === 1) ? 1 : -1;
      let ringRot = ring.rotAngle;
      if (ringRot === undefined) {
        ringRot = dir * ((step - 2) * 0.70);
      }

      draw3DJaggedScreechCircle(
        ctx,
        cx,
        cy,
        mainAngle,
        ring.r,
        ring.tooth ?? Math.max(5.5, ring.r * 0.08),
        ring.alpha ?? 1.0,
        ring.color ?? "#FACC15",
        ringConfig.seed,
        0.58,
        ringRot,
        ringConfig.segments,
        dir
      );
    }

    // 2. [유저 요구사항] "번개 6개 조금만 늦게 출발":
    // - step 1(시전자 포효 준비)에서는 조기 사출하지 않고 대기
    // - step 2부터 6개의 ⚡ 번개가 선두 링보다 적절한 리드로 앞서서 전방 쇄도
    // - 타격 시 나오는 스파이크/스크래치는 완전히 제거 유지
    // 비행 프레임(step 2~7) 동안 선두 링 앞을 찌르며 전진
    if (step >= 2 && step <= 7 && sortedRings.length > 0) {
      const leadRing = sortedRings[sortedRings.length - 1];
      
      let leadOffset = 0.08;
      if (step === 6) leadOffset = 0.06;
      else if (step === 7) leadOffset = 0.03;

      const t = Math.min(1.04, (leadRing.t ?? 0) + leadOffset);
      const cx = ax + (tx - ax) * t;
      const cy = ay + (ty - ay) * t;

      // 선두 링(막 3번)과 동기화되어 회전 (선두 링은 왼쪽/반시계 회전)
      const leadRot = -1 * ((step - 1) * 0.09 + t * 0.12);
      const baseScale = Math.min(1.45, Math.max(0.70, (leadRing.r + 10) * 0.012));

      // step 7까지 선명하게 적을 타격하고 소멸
      const boltAlpha = Math.min(1.0, Math.max(0.40, (leadRing.alpha ?? 1.0) * 1.15));

      if (boltAlpha > 0.02) {
        drawScreech3DRingLightningSet(
          ctx,
          cx,
          cy,
          mainAngle,
          leadRing.r * 0.95 + 4,
          baseScale,
          boltAlpha,
          0.58,
          leadRot
        );
      }
    }
  }

  // [유저 요구사항] "타격시 나오는건 없애줘": 별도의 타격 스파이크/스크래치 완전 제거
}

// ============================================================================
// 104: 그림자분신 (Double Team)
// ============================================================================

let doubleTeamCloneCanvas: any = null;
let doubleTeamCloneCtx: any = null;
let lastCloneSpriteRef: any = null;
let lastCloneSize: number = 0;

function getDoubleTeamCloneCanvas(sprite: any, size: number) {
  const s = Math.max(Math.ceil(size * 1.5), 320);
  if (!doubleTeamCloneCanvas || doubleTeamCloneCanvas.width !== s || doubleTeamCloneCanvas.height !== s) {
    doubleTeamCloneCanvas = createCanvas(s, s);
    doubleTeamCloneCtx = doubleTeamCloneCanvas.getContext("2d");
    lastCloneSpriteRef = null;
  }
  if (lastCloneSpriteRef !== sprite || lastCloneSize !== size) {
    doubleTeamCloneCtx.clearRect(0, 0, s, s);
    doubleTeamCloneCtx.save();
    doubleTeamCloneCtx.filter = "drop-shadow(0px 0px 4px rgba(224, 242, 254, 0.85)) brightness(1.15)";
    drawFittedBattleSprite(doubleTeamCloneCtx, sprite, s / 2, s - 10, size);
    doubleTeamCloneCtx.restore();
    lastCloneSpriteRef = sprite;
    lastCloneSize = size;
  }
  return { canvas: doubleTeamCloneCanvas, cx: s / 2, cy: s - 10 };
}

function drawDoubleTeamClone(
  targetCtx: any,
  sprite: any,
  x: number,
  groundY: number,
  size: number,
  alpha: number
) {
  if (!sprite || alpha <= 0.02) return;
  const { canvas, cx, cy } = getDoubleTeamCloneCanvas(sprite, size);
  targetCtx.save();
  targetCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
  targetCtx.drawImage(canvas, x - cx, groundY - cy);
  targetCtx.restore();
}

/**
 * 그림자분신 배경 레이어 (분신 지면 접지 그림자)
 */
export function drawDoubleTeamBehindEffect(
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

  const isPlayer = drawCtx?.isPlayer ?? true;
  const casterSize = isPlayer ? (drawCtx?.pm?.size || 140) : (drawCtx?.em?.size || 110);
  const cx = casterPos.x;
  const cy = casterPos.y;
  const groundY = isPlayer ? (drawCtx?.pm?.y ?? (cy + 36)) : (drawCtx?.em?.y ?? (cy + 36));
  const p = effectProgress;
  const w = Math.max(34, Math.min(68, casterSize * 0.42));

  // Step 2, 3, 4, 5: 분신 지면 접지 그림자 (자연스러운 2.5D 접지감 유지)
  if (moveStep >= 2 && moveStep <= 5) {
    let clonePositions: { x: number; alpha: number }[] = [];

    if (moveStep === 2) {
      // 6체 잔상 부드러운 다중 확산
      const t = Math.min(1.0, p * 1.15);
      clonePositions = [
        { x: cx - w * 2.2 * t, alpha: 0.45 * t },
        { x: cx - w * 1.4 * t, alpha: 0.60 * t },
        { x: cx - w * 0.7 * t, alpha: 0.70 * t },
        { x: cx + w * 0.7 * t, alpha: 0.70 * t },
        { x: cx + w * 1.4 * t, alpha: 0.60 * t },
        { x: cx + w * 2.2 * t, alpha: 0.45 * t },
      ];
    } else if (moveStep === 3) {
      // 1차 고속 진동 셔플
      const jitter = Math.sin(p * Math.PI * 4) * 4;
      clonePositions = [
        { x: cx - w * 2.2 + jitter, alpha: 0.45 },
        { x: cx - w * 1.4 - jitter, alpha: 0.60 },
        { x: cx - w * 0.7 + jitter, alpha: 0.70 },
        { x: cx + w * 0.7 - jitter, alpha: 0.70 },
        { x: cx + w * 1.4 + jitter, alpha: 0.60 },
        { x: cx + w * 2.2 - jitter, alpha: 0.45 },
      ];
    } else if (moveStep === 4) {
      // 2차 교차 위브
      const wave = Math.sin(p * Math.PI * 2) * (w * 0.35);
      clonePositions = [
        { x: cx - w * 2.2 + wave, alpha: 0.45 + 0.15 * Math.sin(p * 10) },
        { x: cx - w * 1.4 - wave, alpha: 0.60 + 0.15 * Math.cos(p * 10) },
        { x: cx - w * 0.7 + wave, alpha: 0.70 + 0.10 * Math.sin(p * 10) },
        { x: cx + w * 0.7 - wave, alpha: 0.70 + 0.10 * Math.cos(p * 10) },
        { x: cx + w * 1.4 + wave, alpha: 0.60 + 0.15 * Math.sin(p * 10) },
        { x: cx + w * 2.2 - wave, alpha: 0.45 + 0.15 * Math.cos(p * 10) },
      ];
    } else if (moveStep === 5) {
      // 본체로 융합 수렴
      const t = Math.max(0, 1.0 - p);
      clonePositions = [
        { x: cx - w * 2.0 * t, alpha: 0.45 * t },
        { x: cx - w * 1.3 * t, alpha: 0.55 * t },
        { x: cx - w * 0.6 * t, alpha: 0.65 * t },
        { x: cx + w * 0.6 * t, alpha: 0.65 * t },
        { x: cx + w * 1.3 * t, alpha: 0.55 * t },
        { x: cx + w * 2.0 * t, alpha: 0.45 * t },
      ];
    }

    for (const c of clonePositions) {
      if (c.alpha <= 0.05) continue;
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${c.alpha * 0.30})`;
      ctx.beginPath();
      ctx.ellipse(c.x, groundY - 2, casterSize * 0.28, casterSize * 0.075, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * 그림자분신 전면 레이어 (다중 잔상 확산, 고속 진동 셔플, 본체 융합 복귀)
 * - 과한 부가 이펙트(별, 폭발 섬광선, 쉐브론 화살표, 오라 등) 일체 배제
 * - 순수하게 시전자 잔상이 여러 개로 흩어졌다가 합쳐지는 분신술 본연의 연출에 집중
 */
export function drawDoubleTeamEffect(
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

  const isPlayer = drawCtx?.isPlayer ?? true;
  const casterSprite = isPlayer ? (drawCtx?.playerSprite) : (drawCtx?.enemySprite);
  const casterSize = isPlayer ? (drawCtx?.pm?.size || 140) : (drawCtx?.em?.size || 110);
  const cx = casterPos.x;
  const cy = casterPos.y;
  const groundY = isPlayer ? (drawCtx?.pm?.y ?? (cy + 36)) : (drawCtx?.em?.y ?? (cy + 36));
  const p = effectProgress;
  const w = Math.max(34, Math.min(68, casterSize * 0.42));

  if (!casterSprite) {
    ctx.restore();
    return;
  }

  // Step 1: 고속 진동 (좌우 ±6px 미세 잔상 플리커)
  if (moveStep === 1) {
    const flickerOffset = p < 0.5 ? -6 : 6;
    drawDoubleTeamClone(ctx, casterSprite, cx + flickerOffset, groundY, casterSize, 0.40);
  }

  // Step 2: 잔상 다중 확산 (좌우 6체의 반투명 잔상이 부드럽게 펼쳐짐)
  else if (moveStep === 2) {
    const t = Math.min(1.0, p * 1.15);
    drawDoubleTeamClone(ctx, casterSprite, cx - w * 2.2 * t, groundY, casterSize, 0.45 * t);
    drawDoubleTeamClone(ctx, casterSprite, cx - w * 1.4 * t, groundY, casterSize, 0.60 * t);
    drawDoubleTeamClone(ctx, casterSprite, cx - w * 0.7 * t, groundY, casterSize, 0.70 * t);
    drawDoubleTeamClone(ctx, casterSprite, cx + w * 0.7 * t, groundY, casterSize, 0.70 * t);
    drawDoubleTeamClone(ctx, casterSprite, cx + w * 1.4 * t, groundY, casterSize, 0.60 * t);
    drawDoubleTeamClone(ctx, casterSprite, cx + w * 2.2 * t, groundY, casterSize, 0.45 * t);
  }

  // Step 3: 잔상 고속 진동 산란 (흩어진 상태에서 고속 잔상 진동)
  else if (moveStep === 3) {
    const jitter = Math.sin(p * Math.PI * 4) * 4;
    drawDoubleTeamClone(ctx, casterSprite, cx - w * 2.2 + jitter, groundY, casterSize, 0.45);
    drawDoubleTeamClone(ctx, casterSprite, cx - w * 1.4 - jitter, groundY, casterSize, 0.60);
    drawDoubleTeamClone(ctx, casterSprite, cx - w * 0.7 + jitter, groundY, casterSize, 0.70);
    drawDoubleTeamClone(ctx, casterSprite, cx + w * 0.7 - jitter, groundY, casterSize, 0.70);
    drawDoubleTeamClone(ctx, casterSprite, cx + w * 1.4 + jitter, groundY, casterSize, 0.60);
    drawDoubleTeamClone(ctx, casterSprite, cx + w * 2.2 - jitter, groundY, casterSize, 0.45);
  }

  // Step 4: 잔상 교차 위브 셔플 (잔상들이 서로 위치를 흔들며 착시 유도)
  else if (moveStep === 4) {
    const wave = Math.sin(p * Math.PI * 2) * (w * 0.35);
    drawDoubleTeamClone(ctx, casterSprite, cx - w * 2.2 + wave, groundY, casterSize, 0.45 + 0.15 * Math.sin(p * 10));
    drawDoubleTeamClone(ctx, casterSprite, cx - w * 1.4 - wave, groundY, casterSize, 0.60 + 0.15 * Math.cos(p * 10));
    drawDoubleTeamClone(ctx, casterSprite, cx - w * 0.7 + wave, groundY, casterSize, 0.70 + 0.10 * Math.sin(p * 10));
    drawDoubleTeamClone(ctx, casterSprite, cx + w * 0.7 - wave, groundY, casterSize, 0.70 + 0.10 * Math.cos(p * 10));
    drawDoubleTeamClone(ctx, casterSprite, cx + w * 1.4 + wave, groundY, casterSize, 0.60 + 0.15 * Math.sin(p * 10));
    drawDoubleTeamClone(ctx, casterSprite, cx + w * 2.2 - wave, groundY, casterSize, 0.45 + 0.15 * Math.cos(p * 10));
  }

  // Step 5: 잔상 중심 수렴 및 본체 흡수 융합
  else if (moveStep === 5) {
    const t = Math.max(0, 1.0 - p);
    if (t > 0.05) {
      drawDoubleTeamClone(ctx, casterSprite, cx - w * 2.0 * t, groundY, casterSize, 0.45 * t);
      drawDoubleTeamClone(ctx, casterSprite, cx - w * 1.3 * t, groundY, casterSize, 0.55 * t);
      drawDoubleTeamClone(ctx, casterSprite, cx - w * 0.6 * t, groundY, casterSize, 0.65 * t);
      drawDoubleTeamClone(ctx, casterSprite, cx + w * 0.6 * t, groundY, casterSize, 0.65 * t);
      drawDoubleTeamClone(ctx, casterSprite, cx + w * 1.3 * t, groundY, casterSize, 0.55 * t);
      drawDoubleTeamClone(ctx, casterSprite, cx + w * 2.0 * t, groundY, casterSize, 0.45 * t);
    }
  }

  ctx.restore();
}
