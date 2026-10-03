// ============================================================================
// 🎮 ROGUEPot Move Animation Renderer: No.149 ~ No.152
// 149: 사이코웨이브 (Psywave)
// 150: 튀어오르기 (Splash) - 예약
// 151: 녹기 (Acid Armor) - 예약
// 152: 집게해머 (Crabhammer) - 예약
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar } from "../common/helpers.js";

// ============================================================================
// 🌀 149: 사이코웨이브 (Psywave)
//
// [유저 요구사항 100% 반영]:
// 1. 시전포켓몬에게서 시작되는 길쭉한 타원형으로 이루어진 색깔 곡선이 상대에게로 이동함
// 2. > 타격 >
// 3. 대상포켓몬 스프라이트 잠깐살짝 납작해졌다가 돌아옴 >
// 4. 링이 여러개 나타남 >
// ============================================================================

/**
 * 길쭉한 타원형(가로 원반) 단일 엘리먼트 렌더링
 * - GBA 3세대 공식 고증 및 첨부 이미지 완벽 일치:
/**
 * 길쭉한 타원형(가로 원반) 단일 엘리먼트 렌더링
 * [유저 피드백 완벽 반영]:
 * - 흰색 점 및 흰색 링(하이라이트 선) 일체 제거
 * - 단색(solid flat color)의 반투명 타원형
 * - 보라(Deep Violet)와 핫마젠타(Neon Magenta) 교차 색상
 */
export function drawPsywaveElongatedEllipse(
  ctx: any,
  x: number,
  y: number,
  rx: number,
  ry: number,
  colFactor: number, // 0.0 (딥 바이올렛) ~ 1.0 (네온 마젠타)
  alpha: number = 1.0
) {
  if (rx <= 0 || ry <= 0 || alpha <= 0.01) return;

  ctx.save();
  // 단색의 반투명 타원형 적용
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha * 0.65));

  // 색상 보간: 보라 (#8b5cf6: 139, 92, 246) <-> 마젠타 (#f43f5e: 244, 63, 94)
  const r = Math.round(139 + (244 - 139) * colFactor);
  const g = Math.round(75 + (63 - 75) * colFactor);
  const b = Math.round(246 + (94 - 246) * colFactor);

  // 흰색 점이나 흰색 링 없는 순수 단색 반투명 타원형
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 시전포켓몬에서 상대로 뻗어나가는 길쭉한 타원형 색깔 곡선 스트림 (S-Curve Psywave Stream)
 * - [유저 피드백 완벽 반영]:
 *   1. 흰색 점 / 흰색 링 없이 단색의 반투명 길쭉한 타원형들로만 구성
 *   2. 허공에 웨이브와 별개로 떠있는 동그라미(선두 헤드 구체) 완전 제거
 *   3. 시전자 -> 대상 방향을 연결하는 완만한 S자 사인파 궤적을 따라 균일하게 이어짐
 */
export function drawPsywaveStream(
  ctx: any,
  casterPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  waveProgress: number, // 0.0 ~ 1.0 (발사 진행도)
  wavePhase: number = 0, // 사인파 진동 페이즈
  alpha: number = 1.0
) {
  if (waveProgress <= 0.01 || alpha <= 0.01) return;

  const cx = casterPos.x;
  const cy = casterPos.y;
  const tx = targetPos.x;
  const ty = targetPos.y;

  const dx = tx - cx;
  const dy = ty - cy;
  const dist = Math.hypot(dx, dy);
  if (dist < 5) return;

  // 법선 벡터 (곡선 굴곡 방향)
  const nx = -dy / dist;
  const ny = dx / dist;

  // 진폭 및 주파수 (배틀 필드에 알맞은 우아한 S자 곡선)
  const maxAmp = 40; // 횡방향 진폭 (가로로 시원하게 굽이침)
  const cycles = 1.35; // 1.35주기 (시전자에서 출발해 상대를 향해 굽이치는 S자 형태)

  // 촘촘한 타원형 샘플링 수 (웨이브 끝까지 균일하게 중첩되어 유려한 리본 모양 형성)
  const numSamples = Math.max(3, Math.floor(48 * Math.min(1.0, waveProgress)));

  ctx.save();

  // 궤적을 수놓는 단색 반투명 길쭉한 타원형들 순차 렌더링
  for (let i = 0; i <= numSamples; i++) {
    // t는 0.0(시전자)부터 waveProgress(웨이브 선두)까지 정확하게 보간
    const t = (i / numSamples) * waveProgress;
    const ampEnvelope = Math.sin(Math.PI * Math.min(1.0, t));
    const sineOffset = Math.sin(t * Math.PI * 2 * cycles - wavePhase) * maxAmp * ampEnvelope;

    const px = cx + t * dx + nx * sineOffset;
    const py = cy + t * dy + ny * sineOffset;

    // 크기 계산: [유저 요청 완벽 반영] 가로로 훨씬 넓고 납작한 원근 타원형 (rx: 38~44)
    const scaleFactor = 0.75 + 0.25 * Math.sin(Math.PI * Math.min(1.0, t * 1.5));
    const rx = (38 + 5 * Math.sin(i * 0.8)) * scaleFactor;
    const ry = (7.5 + 1.2 * Math.sin(i * 0.8)) * scaleFactor;

    // 색상 밴딩 계수 (보라 <-> 마젠타 물결치는 교차)
    const colFactor = 0.5 + 0.5 * Math.sin(t * 14 - wavePhase * 1.6);

    drawPsywaveElongatedEllipse(ctx, px, py, rx, ry, colFactor, alpha);
  }

  ctx.restore();
}

/**
 * 2. 타격 시 폭발적 충격파 & 사이킥 스파크 이펙트 (Hit Impact Burst)
 */
export function drawPsywaveHitBurst(
  ctx: any,
  tx: number,
  ty: number,
  progress: number, // 0.0 ~ 1.0
  alpha: number = 1.0
) {
  if (progress <= 0 || progress > 1.0 || alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha * (1.0 - progress * 0.65)));

  // (1) 팽창하는 가로로 넓은 사이킥 타원 충격파 링
  const shockRx = 20 + 52 * progress;
  const shockRy = 6 + 15 * progress;

  ctx.strokeStyle = progress < 0.4 ? "#f472b6" : "#f43f5e";
  ctx.lineWidth = Math.max(1.0, 3.5 * (1.0 - progress * 0.8));
  ctx.beginPath();
  ctx.ellipse(tx, ty, shockRx, shockRy, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 보조 외곽 오라 링
  ctx.strokeStyle = "rgba(168, 85, 247, 0.70)";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.ellipse(tx, ty, shockRx * 1.18, shockRy * 1.18, 0, 0, Math.PI * 2);
  ctx.stroke();

  // (2) 사방으로 튀는 복고풍 4방향 미니 별빛 스파크 (drawMiniRetroStar 활용)
  const sparkCount = 6;
  for (let i = 0; i < sparkCount; i++) {
    const angle = (i * Math.PI * 2) / sparkCount + progress * 0.8;
    const dist = (14 + 32 * progress) * (0.85 + 0.3 * (i % 2));
    const sx = tx + Math.cos(angle) * dist;
    const sy = ty + Math.sin(angle) * dist * 0.55; // 세로 압축 원근감

    const starSize = Math.max(2, (6 - progress * 4));
    const starColor = i % 2 === 0 ? "#fbcfe8" : (i % 3 === 0 ? "#f43f5e" : "#c084fc");
    drawMiniRetroStar(ctx, sx, sy, starSize, starColor, angle);
  }

  ctx.restore();
}

/**
 * 4. 대상포켓몬 몸체를 감싸며 나타나는 여러 개의 링 (Multiple Resonating Psychic Rings)
 * - [유저 요구사항 100% 반영]: "링이 여러개 나타남", 가로로 넉넉하게 감싸는 폭
 * - [첨부 이미지 100% 고증]:
 *   대상포켓몬의 발끝부터 머리까지 상하 수직으로 배치된 5개의 마젠타/보랏빛 타원 링
 * - 포켓몬의 체구를 가로로 넓게 감싸며 리드미컬하게 공명 펄스 팽창 및 파동 진동
 */
export function drawPsywaveTargetRings(
  ctx: any,
  targetPos: { x: number; y: number },
  ringsProgress: number, // 0.0 ~ 1.0 (링 연출 진행도)
  alpha: number = 1.0
) {
  if (ringsProgress <= 0 || alpha <= 0.01) return;

  const tx = targetPos.x;
  const ty = targetPos.y;

  // 대상 포켓몬 몸체 높이에 따른 3단 링 수직 오프셋 (하체, 중심 몸통, 상체/머리)
  const RING_CONFIGS = [
    { baseOffsetY: 14,  rxBase: 50, ryBase: 17.0, phaseShift: 0.0, isMagenta: true },  // 1단 (하체/발밑)
    { baseOffsetY: 0,   rxBase: 54, ryBase: 18.5, phaseShift: 1.0, isMagenta: false }, // 2단 (중심 몸통)
    { baseOffsetY: -15, rxBase: 48, ryBase: 16.5, phaseShift: 2.0, isMagenta: true },  // 3단 (상체/머리)
  ];

  ctx.save();

  // 연출 페이드아웃 곡선
  const fadeOut = ringsProgress > 0.70 ? (1.0 - (ringsProgress - 0.70) / 0.30) : 1.0;
  const currentAlpha = Math.min(1.0, Math.max(0, alpha * fadeOut));

  RING_CONFIGS.forEach((cfg, idx) => {
    // 링별 주기적 맥동 (공명 파동)
    const waveT = ringsProgress * Math.PI * 3 + cfg.phaseShift;
    const pulseFactor = Math.sin(waveT);

    // 링 크기 팽창 및 맥동: [유저 요구사항 100% 반영]
    // 1. 가로로 넉넉하게 감싸는 rxBase (45~55)
    // 2. 세로 두께(높이)를 대폭 높인 ryBase (15.5~18.5)
    const expandRx = cfg.rxBase + 9 * ringsProgress + 5 * pulseFactor;
    const expandRy = cfg.ryBase + 3.0 * ringsProgress + 2.0 * pulseFactor;

    // 미세한 상하 부유 파동
    const floatY = ty + cfg.baseOffsetY + 2 * Math.sin(waveT * 0.8);

    // 색상 팔레트: 마젠타(자홍) vs 바이올렛(보라) 교차 밴딩
    const [rCore, gCore, bCore] = cfg.isMagenta ? [244, 63, 94] : [192, 38, 211]; // 코어 (#f43f5e / #c026d3)
    const [rGlow, gGlow, bGlow] = cfg.isMagenta ? [232, 121, 249] : [168, 85, 247]; // 글로우 오라 (#e879f9 / #a855f7)

    // (1) 링 내부 은은한 반투명 채우기
    ctx.save();
    ctx.globalAlpha = currentAlpha * 0.12;
    ctx.fillStyle = `rgb(${rGlow}, ${gGlow}, ${bGlow})`;
    ctx.beginPath();
    ctx.ellipse(tx, floatY, expandRx * 0.90, expandRy * 0.90, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // (2) [유저 요구사항 100% 반영] 세로 두께 대폭 증가 + 투명 그라데이션 (Transparent Gradient)
    // 원근 타원 비율에 맞춰 래디얼 그라데이션을 타원형으로 스케일 변환
    ctx.save();
    ctx.translate(tx, floatY);
    const scaleX = expandRx / expandRy;
    ctx.scale(scaleX, 1.0);

    // 세로 두께 (약 17~20px의 넉넉한 세로 두께 밴드)
    const bandHalf = 8.5 + 1.5 * pulseFactor;
    const rInner = Math.max(1.0, expandRy - bandHalf);
    const rOuter = expandRy + bandHalf;

    // 안쪽 경계(0.0) -> 중간 오라 -> 코어 발광 -> 바깥 오라 -> 바깥 경계(1.0 투명 0.0)
    // 부드러운 투명 그라데이션을 통해 링 상하 및 좌우 경계가 투명하게 자연스럽게 스며듦
    const ringGrad = ctx.createRadialGradient(0, 0, rInner, 0, 0, rOuter);
    ringGrad.addColorStop(0.0, `rgba(${rGlow}, ${gGlow}, ${bGlow}, 0.0)`);
    ringGrad.addColorStop(0.20, `rgba(${rGlow}, ${gGlow}, ${bGlow}, ${currentAlpha * 0.40})`);
    ringGrad.addColorStop(0.42, `rgba(${rCore}, ${gCore}, ${bCore}, ${currentAlpha * 0.82})`);
    ringGrad.addColorStop(0.50, `rgba(255, 255, 255, ${currentAlpha * 0.55})`);
    ringGrad.addColorStop(0.58, `rgba(${rCore}, ${gCore}, ${bCore}, ${currentAlpha * 0.82})`);
    ringGrad.addColorStop(0.80, `rgba(${rGlow}, ${gGlow}, ${bGlow}, ${currentAlpha * 0.40})`);
    ringGrad.addColorStop(1.0, `rgba(${rGlow}, ${gGlow}, ${bGlow}, 0.0)`);

    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // (3) 코어 라인 소프트 오라 (과도하게 날카로운 선 없이 투명 그라데이션 코어 보강)
    ctx.save();
    ctx.globalAlpha = currentAlpha * 0.40;
    ctx.strokeStyle = `rgba(${rCore}, ${gCore}, ${bCore}, 0.65)`;
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.ellipse(tx, floatY, expandRx, expandRy, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  // [유저 요구사항]: "감싸지는 링에서는 점 파티클 제거" 완벽 준수
  // (이전 버전의 7개 점 파티클 순환 렌더링 코드 완전 삭제)

  ctx.restore();
}

/**
 * 🌀 149: 사이코웨이브 (Psywave) 메인 DrawEffect 함수
 */
export function drawPsywaveEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (frame.showEffect === false) return;

  const { isPlayer: isP } = drawCtx;

  // 시전자 위치 (입/몸체 발사 원점)
  const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
  const cx = casterPos.x + (isP ? 6 : -6);
  const cy = casterPos.y + (isP ? 4 : 2);

  // 대상 위치 (피격 대상 중심)
  const targetPos = drawCtx.targetPos;
  const tx = targetPos.x;
  const ty = targetPos.y + (isP ? 6 : 8);

  ctx.save();

  // 1. 색깔 곡선 이동 스트림 (S-Curve Elongated Ellipses Stream)
  const waveProg = frame.waveProgress ?? 0;
  const wavePhase = frame.wavePhase ?? 0;
  const waveAlpha = frame.waveFadeAlpha ?? 1.0;

  if (waveProg > 0 && waveAlpha > 0.01) {
    drawPsywaveStream(
      ctx,
      { x: cx, y: cy },
      { x: tx, y: ty },
      waveProg,
      wavePhase,
      waveAlpha
    );
  }

  // 2. 타격 충격파 (Hit Impact Burst)
  const impactProg = frame.impactProgress ?? 0;
  if (impactProg > 0) {
    drawPsywaveHitBurst(ctx, tx, ty - 6, impactProg, 1.0);
  }

  // 3. 대상 몸체 5단 링 (Multiple Resonating Psychic Rings)
  const ringsProg = frame.ringsProgress ?? 0;
  const ringsAlpha = frame.ringsAlpha ?? 1.0;
  if (ringsProg > 0 && ringsAlpha > 0.01) {
    drawPsywaveTargetRings(ctx, { x: tx, y: ty - 4 }, ringsProg, ringsAlpha);
  }

  ctx.restore();
}

// ============================================================================
// 💦 150: 튀어오르기 (Splash)
//
// [유저 요구사항 100% 반영]:
// 시전포켓몬 
// > 납작해지기(30%정도) > 원상복구 > 다시 동일하게 납작해지기 > 원상복구 > 납작 > 원복 
// 이떄 납작해질 때다 물방울 튀기기 (링없이 파티클만)
// ============================================================================

export interface SplashDropletDef {
  vx: number;          // 수평 속도 (-85 ~ +85: 좌우로 시원하게 확산)
  vy: number;          // 수직 초기 속도 (-55 ~ -105: 상공으로 솟구침)
  gravity: number;     // 중력 가속도 (130 ~ 170: 둥근 포물선 낙하 유도)
  size: number;        // 선두 물방울 반경
  colorStyle: "main" | "light" | "white" | "deep";
  originOffsetX: number; // 발밑 시작 오프셋 X
  originOffsetY: number; // 발밑 시작 오프셋 Y
}

/**
 * 튀어오르기 포물선 분수 스트림 정의 (좌우 및 중앙 총 14개 물줄기)
 * - ⚠️ 유저 요구사항: "(링없이 파티클만)" 완벽 반영
 * - 포켓몬 좌우로 넓고 둥글게 뻗어나가는 포물선(Parabolic Arc) 궤적
 */
export const SPLASH_PARABOLA_STREAMS: SplashDropletDef[] = [
  // 좌측 2개
  { vx: -72, vy: -52, gravity: 140, size: 4.0, colorStyle: "main",  originOffsetX: -10, originOffsetY: 4 },
  { vx: -42, vy: -82, gravity: 155, size: 4.4, colorStyle: "light", originOffsetX: -6,  originOffsetY: 2 },

  // 우측 2개
  { vx:  72, vy: -52, gravity: 140, size: 4.0, colorStyle: "main",  originOffsetX:  10, originOffsetY: 4 },
  { vx:  42, vy: -82, gravity: 155, size: 4.4, colorStyle: "light", originOffsetX:  6,  originOffsetY: 2 },

  // 중앙 2개
  { vx: -14, vy: -96, gravity: 165, size: 4.2, colorStyle: "light", originOffsetX: -3,  originOffsetY: 0 },
  { vx:  14, vy: -92, gravity: 165, size: 4.0, colorStyle: "deep",  originOffsetX:  3,  originOffsetY: 0 },
];

/**
 * 포물선 상의 특정 시점(t) 위치 및 순간 속도 벡터 계산
 */
export function computeParabolaPoint(
  startX: number,
  startY: number,
  vx: number,
  vy: number,
  gravity: number,
  t: number
) {
  const x = startX + vx * t;
  const y = startY + vy * t + 0.5 * gravity * t * t;
  const curVx = vx;
  const curVy = vy + gravity * t;
  const angle = Math.atan2(curVy, curVx);
  return { x, y, vx: curVx, vy: curVy, angle };
}

/**
 * 시작점(발밑)부터 현재 물방울 위치(t)까지 부드럽게 이어지는 포물선 궤적 호 (Parabolic Arc Trail)
 * - 링 없이 순수 물줄기 포물선 궤적만 렌더링하여 뚜렷한 포물선 시각 효과 부여
 */
export function drawParabolicArcTrail(
  ctx: any,
  startX: number,
  startY: number,
  vx: number,
  vy: number,
  gravity: number,
  t: number,
  alpha: number = 1.0
) {
  if (t <= 0.04 || alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha * 0.70));

  // 포물선 궤적을 6단계 세그먼트로 샘플링하여 유려한 호(Arc) 생성
  ctx.beginPath();
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const sampleT = (i / steps) * t;
    const pt = computeParabolaPoint(startX, startY, vx, vy, gravity, sampleT);
    if (i === 0) {
      ctx.moveTo(pt.x, pt.y);
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  }

  // 1차 외곽 스카이블루 아쿠아 라인
  ctx.strokeStyle = "rgba(56, 189, 248, 0.65)"; // #38bdf8
  ctx.lineWidth = 2.0;
  ctx.lineCap = "round";
  ctx.stroke();

  // 2차 코어 순백 발광 라인
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.restore();
}

/**
 * 단일 물방울 파티클 (Water Droplet) 렌더링
 * - 궤적 방향(angle)에 맞추어 유선형(Teardrop) 물방울 모양으로 뻗음
 * - 코어 하이라이트(순백)를 포함하여 입체감 있고 청량한 물방울 질감
 */
/**
 * 단일 물방울 파티클 (Water Droplet) 렌더링
 * - [유저 요구사항 100% 반영]:
 *   1. 흰색 물방울 제거 (모두 청량한 하늘색/물빛 단색 적용)
 *   2. 유선형 대신 깔끔한 타원형(ellipse) 조형
 *   3. 흰색 하이라이트 일체 제거 (플랫 클린 도트 스타일)
 */
export function drawWaterDroplet(
  ctx: any,
  x: number,
  y: number,
  size: number,
  angle: number,
  alpha: number = 1.0,
  colorStyle: "main" | "light" | "white" | "deep" = "main"
) {
  if (size <= 0.5 || alpha <= 0.01) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // 유저 요청: 반투명 적용 (0.55 반투명)
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha * 0.55));

  // 유저 요청: 타원형(ellipse)으로 제작
  ctx.beginPath();
  const rx = size * 1.35;
  const ry = size * 0.90;
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);

  // 유저 요청: 흰색 물방울 제거 -> 맑은 하늘색 / 시안 / 마린블루만 사용
  if (colorStyle === "deep") {
    ctx.fillStyle = "#0284c7"; // 깊은 마린블루
  } else if (colorStyle === "light" || colorStyle === "white") {
    ctx.fillStyle = "#7dd3fc"; // 맑은 하늘색 (흰색 제거)
  } else {
    ctx.fillStyle = "#38bdf8"; // 비비드 시안블루
  }
  ctx.fill();

  // 유저 요청: 하이라이트 완전 제거 (순수 타원형 단색)

  ctx.restore();
}

/**
 * 튀어오르기 물방울 파티클 군집 렌더링
 * - [유저 피드백 반영]:
 *   1. 궤적 선(트레일) 완전 제거 (순수 알갱이만 렌더링)
 *   2. 알갱이들이 일정한 간격/동시가 아니라 서로 다른 순서와 타이밍(비동기 시차)으로 비산
 *   3. 사이클(1, 2, 3)마다 알갱이 발사 순서가 완전히 뒤바뀜
 */
export function drawSplashParticles(
  ctx: any,
  baseX: number,
  baseY: number,
  progress: number, // 0.0 ~ 1.0
  cycle: number = 1,
  alpha: number = 1.0
) {
  if (progress <= 0 || progress > 1.0 || alpha <= 0.01) return;

  const cycleSpeedMult = cycle === 2 ? 1.08 : (cycle === 3 ? 1.14 : 1.0);
  const cycleGravityShift = cycle === 3 ? 1.06 : 1.0;

  // 6개 알갱이별 불규칙한 발사 지연 시간표
  const STAGGER_MAP: Record<number, number[]> = {
    1: [0.00, 0.24, 0.10, 0.34, 0.16, 0.04],
    2: [0.26, 0.00, 0.36, 0.12, 0.04, 0.20],
    3: [0.12, 0.32, 0.00, 0.22, 0.36, 0.08],
  };
  const delays = STAGGER_MAP[cycle] || STAGGER_MAP[1];

  ctx.save();

  SPLASH_PARABOLA_STREAMS.forEach((tmpl, idx) => {
    const delay = delays[idx % delays.length];
    if (progress < delay) return; // 아직 출발하지 않은 알갱이

    // 지연 이후의 유효 시간 (0.0 ~ 1.0)
    const activeDuration = Math.max(0.40, 1.0 - delay);
    const t = Math.min(1.0, (progress - delay) / activeDuration);
    if (t <= 0.01) return;

    // 자연스러운 페이드인/아웃
    const pAlpha = t < 0.12 ? (t / 0.12) : (t > 0.65 ? Math.max(0, 1.0 - (t - 0.65) / 0.35) : 1.0);
    const finalAlpha = alpha * pAlpha;
    if (finalAlpha <= 0.01) return;

    // 사이클별 약간의 각도/방향 미세 지터(불규칙성)
    const jitterX = Math.sin(idx * 3.7 + cycle * 2.1) * 4;
    const startX = baseX + tmpl.originOffsetX + jitterX;
    const startY = baseY + tmpl.originOffsetY;
    const vx = tmpl.vx * cycleSpeedMult;
    const vy = tmpl.vy * cycleSpeedMult;
    const gravity = tmpl.gravity * cycleGravityShift;

    // 선두 타원형 물방울 알갱이 단독 렌더링 (보조 알갱이 제거로 개수 축소)
    const leadPt = computeParabolaPoint(startX, startY, vx, vy, gravity, t);
    const sizeScale = t < 0.22 ? (0.65 + 0.35 * (t / 0.22)) : Math.max(0.55, 1.0 - (t - 0.22) * 0.45);
    const curSize = tmpl.size * sizeScale;

    drawWaterDroplet(
      ctx,
      leadPt.x,
      leadPt.y,
      curSize,
      leadPt.angle,
      finalAlpha,
      tmpl.colorStyle
    );
  });

  ctx.restore();
}

// ============================================================================
// 💧 150: 땀방울 (Sweat Drop) 파티클 — 공중 도약 시 튀는 땀방울 효과
// ============================================================================

export interface SweatDropletDef {
  vx: number;
  vy: number;
  gravity: number;
  size: number;
  colorStyle: "main" | "light" | "white" | "deep";
  originOffsetX: number;
  originOffsetY: number;
}

/** 땀방울 분사 스트림 정의 (5개로 정예화하여 깔끔한 비산) */
export const SWEAT_DROP_STREAMS: SweatDropletDef[] = [
  // 좌측 2개
  { vx: -50, vy: -42, gravity: 200, size: 2.8, colorStyle: "light", originOffsetX: -8, originOffsetY: -4 },
  { vx: -28, vy: -62, gravity: 215, size: 2.5, colorStyle: "main",  originOffsetX: -4, originOffsetY: -8 },

  // 우측 2개
  { vx:  50, vy: -42, gravity: 200, size: 2.8, colorStyle: "light", originOffsetX:  8, originOffsetY: -4 },
  { vx:  28, vy: -62, gravity: 215, size: 2.5, colorStyle: "main",  originOffsetX:  4, originOffsetY: -8 },

  // 중앙 1개
  { vx:   0, vy: -70, gravity: 225, size: 2.7, colorStyle: "light", originOffsetX:  0, originOffsetY: -12 },
];

/**
 * 땀방울 파티클 군집 렌더링
 * - 땀방울 개수를 줄여 귀엽고 깔끔하게 연출
 */
export function drawSweatDropParticles(
  ctx: any,
  baseX: number,
  baseY: number,
  progress: number, // 0.0 ~ 1.0
  cycle: number = 1,
  alpha: number = 1.0
) {
  if (progress <= 0 || progress > 1.0 || alpha <= 0.01) return;

  const cycleSpeedMult = cycle === 2 ? 1.06 : (cycle === 3 ? 1.12 : 1.0);

  // 5개 땀방울 지연 시간표
  const SWEAT_STAGGER_MAP: Record<number, number[]> = {
    1: [0.00, 0.22, 0.08, 0.28, 0.14],
    2: [0.24, 0.04, 0.28, 0.10, 0.00],
    3: [0.10, 0.26, 0.00, 0.18, 0.30],
  };
  const delays = SWEAT_STAGGER_MAP[cycle] || SWEAT_STAGGER_MAP[1];

  ctx.save();

  SWEAT_DROP_STREAMS.forEach((tmpl, idx) => {
    const delay = delays[idx % delays.length];
    if (progress < delay) return;

    const activeDuration = Math.max(0.40, 1.0 - delay);
    const t = Math.min(1.0, (progress - delay) / activeDuration);
    if (t <= 0.01) return;

    const pAlpha = t < 0.10 ? (t / 0.10) : (t > 0.60 ? Math.max(0, 1.0 - (t - 0.60) / 0.40) : 1.0);
    const finalAlpha = alpha * pAlpha;
    if (finalAlpha <= 0.01) return;

    const jitterX = Math.sin(idx * 2.9 + cycle * 1.7) * 3;
    const startX = baseX + tmpl.originOffsetX + jitterX;
    const startY = baseY + tmpl.originOffsetY;
    const vx = tmpl.vx * cycleSpeedMult;
    const vy = tmpl.vy * cycleSpeedMult;
    const gravity = tmpl.gravity;

    // 선두 땀방울 알갱이 단독 렌더링 (보조 알갱이 제거)
    const leadPt = computeParabolaPoint(startX, startY, vx, vy, gravity, t);
    const sizeScale = t < 0.20 ? (0.60 + 0.40 * (t / 0.20)) : Math.max(0.45, 1.0 - (t - 0.20) * 0.65);
    drawWaterDroplet(ctx, leadPt.x, leadPt.y, tmpl.size * sizeScale, leadPt.angle, finalAlpha, tmpl.colorStyle);
  });

  ctx.restore();
}

/**
 * 💦 150: 바둥바둥 (Splash) 메인 DrawEffect 함수
 * - 착지(납작) 구간: 물방울 튀기기 (splashProgress)
 * - 공중 도약 구간: 땀방울 튀기기 (sweatProgress)
 */
export function drawSplashEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (frame.showEffect === false) return;

  const { isPlayer: isP } = drawCtx;
  const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
  const baseX = casterPos.x;

  // 착지 발밑 기준점
  const groundY = casterPos.y + (isP ? 22 : 18);
  // 공중 몸통 기준점 (도약 높이를 반영)
  const airOffsetY = frame.sweatAirOffsetY ?? 0;
  const airY = casterPos.y + airOffsetY + (isP ? 8 : 6);

  const cycle = frame.splashCycle ?? 1;
  const effectAlpha = frame.splashAlpha ?? 1.0;

  // ① 착지 물방울 파티클 (납작해질 때)
  const splashProg = frame.splashProgress ?? 0;
  if (splashProg > 0.001 && splashProg <= 1.0) {
    drawSplashParticles(ctx, baseX, groundY, splashProg, cycle, effectAlpha);
  }

  // ② 공중 땀방울 파티클 (도약 시)
  const sweatProg = frame.sweatProgress ?? 0;
  if (sweatProg > 0.001 && sweatProg <= 1.0) {
    drawSweatDropParticles(ctx, baseX, airY, sweatProg, cycle, effectAlpha * 0.90);
  }
}

// ============================================================================
// 🧪 151: 녹기 (Acid Armor)
//
// [유저 요구사항 100% 반영]:
// 1. 원래상태에서 시전포켓몬
// 2. 납작해지면서 넓어짐 > 동시에 흰색필터 적용 점점강하게 >
// 3. 이후 납작상태유지 흰색필터적용유지 페이드아웃 하고 원상복귀 빠르게
// ============================================================================

/**
 * 🧪 151: 녹기 (Acid Armor) 메인 DrawEffect 함수
 */
export function drawAcidArmorEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (frame.showEffect === false) return;
  // 향후 파티클이나 액체 웅덩이 효과 추가 시 이곳에 렌더링
}

// ============================================================================
// 🦀 152: 집게해머 (Crabhammer)
//
// 타입: 물 (Water)
// 분류: 물리 (Physical)
// 위력: 100 / 명중: 90 / PP: 10
// 효과: 큰 집게를 상대에게 내리쳐서 공격한다. 급소에 맞기 쉽다.
//
// 연출 구성:
// 1. [기합 & 수압 응축]: 시전자가 뒤로 웅크려 힘을 모으며 발밑에서 회전하는 물기운 오라 태동
// 2. [도약 & 거대 집게해머 치켜들기]: 시전자가 상공으로 도약, 대상 머리 위 상공에 거대한 붉은 갑각 집게발이
//    휘몰아치는 아쿠아 격류를 휘감으며 쩍 벌려진 채 높이 치켜올려짐
// 3. [벼락같은 해머 강타 & 맞물림]: 집게발이 사선 아래로 맹렬한 수압 궤적을 그리며 벼락같이 내리찍고 "딱!" 맞물림
// 4. [타격 작렬 & 물보라 대폭발]: 1프레임 백색 섬광, 피격 대상 납작 짓눌림, 지면 충격파 + 거대한 물보라 왕관 기둥(Crown Geyser)
//    + 사방으로 비산하는 14개 포물선 물방울 + 급소 보정 특유의 다이아몬드 크로스 스파크
// 5. [피격자 탄성 넉백 & 물방울 잔향]: 피격자가 튀어올랐다가 흔들리며 회복, 물보라가 포말로 부서지며 낙하
// 6. [시전자 착지 복귀 & 카메라 복귀]: 안정적인 정위치 복귀
// ============================================================================

/**
 * 게 집게발 형상 (흰색 반투명 실루엣)
 * - [유저 요구사항 100% 반영]: "집게는 흰색 반투명으로 형상만"
 */
export function drawCrabPincerClaw(
  ctx: any,
  x: number,
  y: number,
  openAngle: number,
  angle: number,
  scale: number = 1.0,
  isPlayer: boolean = true,
  alpha: number = 1.0
) {
  if (scale <= 0.01 || alpha <= 0.01) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (!isPlayer) {
    ctx.scale(-scale, scale);
  } else {
    ctx.scale(scale, scale);
  }
  // 흰색 반투명 형상만 (알파 0.45)
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha * 0.45));
  ctx.fillStyle = "#ffffff";

  // 1. 손바닥/몸통 형상
  ctx.beginPath();
  ctx.moveTo(-35, -16);
  ctx.bezierCurveTo(-20, -24, 0, -22, 6, -10);
  ctx.bezierCurveTo(12, 0, 10, 12, 4, 18);
  ctx.bezierCurveTo(-8, 24, -26, 20, -35, 12);
  ctx.bezierCurveTo(-38, 4, -38, -6, -35, -16);
  ctx.closePath();
  ctx.fill();

  // 2. 하단 고정 집게날 형상
  ctx.beginPath();
  ctx.moveTo(4, 16);
  ctx.bezierCurveTo(18, 20, 34, 14, 46, -2);
  ctx.bezierCurveTo(38, 2, 28, 4, 16, 5);
  ctx.bezierCurveTo(10, 5, 6, 8, 4, 16);
  ctx.closePath();
  ctx.fill();

  // 3. 상단 가동 집게날 형상 (openAngle 회전)
  ctx.save();
  ctx.translate(0, -12);
  ctx.rotate(-openAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(10, -18, 28, -20, 46, 8);
  ctx.bezierCurveTo(44, 4, 34, -2, 20, -2);
  ctx.bezierCurveTo(12, -2, 4, -4, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 집게해머 위에서 내려찍는 이펙트 (Vertical Pure White Down-Slam Pillar)
 * - [유저 첨부 이미지 100% 반영]:
 *   1. 오직 순백색(Pure White)으로만 구성
 *   2. 하단은 둥글고 묵직한 캡슐형 돔(Dome/Capsule) 타격면
 *   3. 상단은 수직 모션 스트릭으로 부드럽게 페이드아웃
 *   4. 좌우 외곽은 칼단면 없이 부드럽게 투명 감쇠
 */
export function drawCrabhammerDownSlam(
  ctx: any,
  targetX: number,
  targetY: number,
  progress: number, // 0.0 ~ 1.0
  isPlayer: boolean = true,
  alpha: number = 1.0
) {
  if (progress <= 0 || progress > 1.0 || alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 대상 머리 위 상공 (-200px)에서 대상 지면(+28px)으로 수직 내리찍음 (충분한 상공 길이 확보)
  const topY = targetY - 200;
  const bottomY = targetY + 28;
  const currentY = topY + (bottomY - topY) * Math.min(1.0, progress * 1.15);
  const tailLength = 230;
  const tailY = Math.max(topY - 40, currentY - tailLength);

  const cx = targetX;

  // 기둥 폭 (이미지 고증: 하단이 둥글고 묵직한 캡슐 형태, 반경 20~25px)
  const baseW = 20 + 5 * Math.sin(progress * Math.PI);
  const domeRadius = baseW;
  const domeCenterY = currentY - domeRadius;

  // 1. 순백색 외곽 소프트 글로우 오라 (상단 꼬리 끝 100% 완전 투명 + 부드러운 테이퍼링)
  const auraW = baseW + 8;
  const auraDomeCenterY = currentY - auraW;
  const auraGrad = ctx.createLinearGradient(cx, tailY - 25, cx, currentY);
  auraGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
  auraGrad.addColorStop(0.22, "rgba(255, 255, 255, 0.0)"); // 상단 22% 100% 완전 투명
  auraGrad.addColorStop(0.55, "rgba(255, 255, 255, 0.18)");
  auraGrad.addColorStop(0.85, "rgba(255, 255, 255, 0.35)");
  auraGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.moveTo(cx, tailY - 25); // 꼭짓점으로 부드럽게 모임 (일자 절단면 완전 제거)
  ctx.quadraticCurveTo(cx - auraW, tailY + 25, cx - auraW, auraDomeCenterY);
  ctx.arc(cx, auraDomeCenterY, auraW, Math.PI, 0, true);
  ctx.quadraticCurveTo(cx + auraW, tailY + 25, cx, tailY - 25);
  ctx.closePath();
  ctx.fill();

  // 2. 메인 순백색 묵직한 기둥 바디 (꼬리 상단 유선형 테이퍼링 + 100% 투명)
  const bodyW = baseW + 3;
  const bodyDomeCenterY = currentY - bodyW;
  const bodyGrad = ctx.createLinearGradient(cx, tailY - 20, cx, currentY);
  bodyGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
  bodyGrad.addColorStop(0.24, "rgba(255, 255, 255, 0.0)"); // 상단 24% 100% 완전 투명
  bodyGrad.addColorStop(0.55, "rgba(255, 255, 255, 0.50)");
  bodyGrad.addColorStop(0.85, "rgba(255, 255, 255, 0.88)");
  bodyGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.75)");

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(cx, tailY - 20);
  ctx.quadraticCurveTo(cx - bodyW, tailY + 30, cx - bodyW, bodyDomeCenterY);
  ctx.arc(cx, bodyDomeCenterY, bodyW, Math.PI, 0, true);
  ctx.quadraticCurveTo(cx + bodyW, tailY + 30, cx, tailY - 20);
  ctx.closePath();
  ctx.fill();

  // 3. 눈부신 순백 코어 (상단 테이퍼링 + 100% 투명)
  const coreW = baseW * 0.70;
  const coreDomeCenterY = currentY - coreW;
  const coreGrad = ctx.createLinearGradient(cx, tailY - 15, cx, currentY);
  coreGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
  coreGrad.addColorStop(0.28, "rgba(255, 255, 255, 0.0)"); // 상단 28% 100% 완전 투명
  coreGrad.addColorStop(0.60, "rgba(255, 255, 255, 0.85)");
  coreGrad.addColorStop(0.85, "rgba(255, 255, 255, 1.0)");
  coreGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.95)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(cx, tailY - 15);
  ctx.quadraticCurveTo(cx - coreW, tailY + 35, cx - coreW, coreDomeCenterY);
  ctx.arc(cx, coreDomeCenterY, coreW, Math.PI, 0, true);
  ctx.quadraticCurveTo(cx + coreW, tailY + 35, cx, tailY - 15);
  ctx.closePath();
  ctx.fill();

  // 4. 상단 수직 모션 스트릭 (꼬리 끝 부드러운 투명 페이드)
  const streakDefs = [
    { ox: -baseW * 0.70, topYOffset: -10, h: 68, alpha: 0.55, width: 2.0 },
    { ox: -baseW * 0.30, topYOffset: -24, h: 85, alpha: 0.75, width: 2.5 },
    { ox: baseW * 0.15,  topYOffset: -30, h: 92, alpha: 0.80, width: 2.8 },
    { ox: baseW * 0.55,  topYOffset: -16, h: 74, alpha: 0.60, width: 2.2 },
  ];

  streakDefs.forEach(s => {
    const sY = tailY + s.topYOffset;
    const sGrad = ctx.createLinearGradient(cx + s.ox, sY, cx + s.ox, sY + s.h);
    sGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
    sGrad.addColorStop(0.30, "rgba(255, 255, 255, 0.0)"); // 스트릭 상단 30% 투명
    sGrad.addColorStop(0.65, `rgba(255, 255, 255, ${s.alpha * 0.6})`);
    sGrad.addColorStop(1.00, `rgba(255, 255, 255, ${s.alpha})`);

    ctx.strokeStyle = sGrad;
    ctx.lineWidth = s.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + s.ox, sY);
    ctx.lineTo(cx + s.ox, sY + s.h);
    ctx.stroke();
  });

  ctx.restore();
}

/**
 * 집게해머 타격 유기적 물보라 버스트 & 비산 물방울 & 샤워 미스트
 * - [유저 요청 복원]: 요청하신 1차 원형 방사형 비드 물보라 버스트 형태 (첨부 캡처 이미지 버전)
 */
export function drawCrabhammerHitSplash(
  ctx: any,
  tx: number,
  ty: number,
  progress: number, // 0.0 ~ 1.0
  alpha: number = 1.0
) {
  if (progress <= 0 || progress > 1.0 || alpha <= 0.01) return;

  ctx.save();

  // 타격 중심점 (대상 포켓몬 몸체 중앙 약간 하단)
  const cx = tx;
  const cy = ty + 4;

  // 단일 물방울/물덩어리 (중간 근처 몇 개 알갱이의 왼쪽 위쪽에만 하이라이트 적용)
  const drawCelWaterBlob = (
    bx: number,
    by: number,
    radius: number,
    blobAlpha: number,
    colorType: "main" | "cyan" | "deep" = "main",
    hasHighlight: boolean = false
  ) => {
    if (radius <= 0.5 || blobAlpha <= 0.02) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, blobAlpha);

    // 순수 물 바디 채우기 (테두리 없음)
    const bodyColor = colorType === "cyan" ? "#38bdf8" : (colorType === "deep" ? "#2563eb" : "#60a5fa");
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(bx, by, radius, 0, Math.PI * 2);
    ctx.fill();

    // [유저 요구사항 반영]: "타격시에 중간 근처 몇개 왼쪽 위쪽에만 하이라이트 넣어봐" -> "좀만 더"
    if (hasHighlight && radius >= 2.5) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      // 왼쪽 위 오프셋 (bx - radius * 0.32, by - radius * 0.32)
      ctx.arc(
        bx - radius * 0.32,
        by - radius * 0.32,
        Math.max(1.2, radius * 0.31),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  };

  // -------------------------------------------------------------------------
  // 1단계: 폭발적 유기형 물 스플래시 버스트 (Image 1: Initial Impact Burst)
  // -------------------------------------------------------------------------
  if (progress < 0.48) {
    const p1 = Math.min(1.0, progress / 0.35);
    // 버스트 페이드아웃 (0.35 이후부터 급격히 물방울로 쪼개지며 소산)
    const bAlpha = alpha * (progress < 0.28 ? 1.0 : Math.max(0, 1.0 - (progress - 0.28) / 0.20));

    if (bAlpha > 0.02) {
      ctx.save();

      // [첨부 1번 이미지 정밀 고증] 유기적으로 뻗어나가는 물보라 가지 (Splash Lobes)
      // 각 가지는 연속된 3~5개의 중첩된 원형 물방울로 이루어져 자연스러운 유체 형상 형성
      const SPLASH_BRANCHES = [
        // 상공 수직 물기둥 가지 2줄 (높이 45~55px 솟구침)
        { baseAngle: -Math.PI / 2 - 0.12, dists: [10, 22, 34, 46], sizes: [11, 9, 7, 5] },
        { baseAngle: -Math.PI / 2 + 0.18, dists: [12, 26, 38, 50], sizes: [10, 8.5, 6.5, 4.5] },
        // 좌상단 거대 물보라 덩어리
        { baseAngle: -2.35, dists: [12, 24, 36, 44], sizes: [12, 10, 7.5, 5] },
        { baseAngle: -2.85, dists: [10, 20, 30], sizes: [10, 8, 5.5] },
        // 우상단 물보라 가지
        { baseAngle: -0.75, dists: [11, 23, 34, 42], sizes: [11, 9, 6.5, 4.5] },
        { baseAngle: -0.30, dists: [10, 20, 31], sizes: [9.5, 7.5, 5] },
        // 좌측 및 좌하단 유선형 물보라
        { baseAngle: Math.PI - 0.2, dists: [10, 21, 32], sizes: [10, 8, 5] },
        { baseAngle: 2.45, dists: [8, 18, 28], sizes: [9, 7, 4.5] },
        // 하단 지면 튀김
        { baseAngle: 1.57, dists: [8, 16, 25], sizes: [9, 6.5, 4] },
        { baseAngle: 1.05, dists: [8, 17, 26], sizes: [8.5, 6, 4] },
      ];

      // 가지 팽창 스케일 곡선
      const expand = 0.35 + 0.65 * Math.sin(p1 * Math.PI * 0.5);

      // (A) 중심 코어 수역 연결 알갱이들 (중간 알갱이 4개 모두 왼쪽 위 하이라이트)
      const coreBlobs = [
        { ox: -5, oy: -3, r: 9 * expand, hl: true },   // 중간 좌측 알갱이
        { ox:  4, oy: -2, r: 8.5 * expand, hl: true },  // 중간 우측 알갱이
        { ox: -3, oy:  5, r: 8 * expand, hl: true },   // 중간 하단 좌측 알갱이
        { ox:  3, oy:  5, r: 7.5 * expand, hl: true }, // 중간 하단 우측 알갱이
      ];
      coreBlobs.forEach((b) => {
        drawCelWaterBlob(cx + b.ox, cy + b.oy, b.r, bAlpha, "cyan", b.hl);
      });

      // (B) 사방으로 뻗친 가지들 렌더링 (중간 주변 및 상공/좌측 가지 기저부 알갱이들에 하이라이트 적용)
      SPLASH_BRANCHES.forEach((branch, bIdx) => {
        branch.dists.forEach((d, idx) => {
          const currentDist = d * expand;
          const bx = cx + Math.cos(branch.baseAngle) * currentDist;
          const by = cy + Math.sin(branch.baseAngle) * currentDist;
          const sz = branch.sizes[idx] * (0.8 + 0.2 * expand);
          const colorType = idx === branch.dists.length - 1 ? "cyan" : "main";
          // 중간 근처 기저부 알갱이들(idx 0) 및 상공/좌상단 2번째 알갱이(idx 1)에 왼쪽 위 하이라이트
          const isMidHl =
            (idx === 0 && (bIdx === 0 || bIdx === 1 || bIdx === 2 || bIdx === 4 || bIdx === 6)) ||
            (idx === 1 && (bIdx === 0 || bIdx === 2));
          drawCelWaterBlob(bx, by, sz, bAlpha, colorType, isMidHl);
        });
      });

      // (C) 가지 끝에서 이미 분리되어 튀어나가기 시작한 위성 물방울들
      const SATELLITE_DROPLETS = [
        { angle: -1.70, dist: 54, r: 3.8 },
        { angle: -1.35, dist: 58, r: 3.5 },
        { angle: -2.50, dist: 52, r: 4.0 },
        { angle: -0.65, dist: 49, r: 3.6 },
        { angle: 2.80,  dist: 38, r: 3.2 },
        { angle: 0.85,  dist: 35, r: 3.0 },
        { angle: -2.95, dist: 44, r: 3.4 },
        { angle: -0.15, dist: 42, r: 3.2 },
      ];
      SATELLITE_DROPLETS.forEach((sat) => {
        const sx = cx + Math.cos(sat.angle) * sat.dist * expand;
        const sy = cy + Math.sin(sat.angle) * sat.dist * expand;
        drawCelWaterBlob(sx, sy, sat.r, bAlpha * 0.95, "cyan");
      });

      ctx.restore();
    }
  }

  // -------------------------------------------------------------------------
  // 2단계: 사방으로 솟구쳐 비산하는 물방울 분출 (Image 2: Flying Droplet Spray)
  // -------------------------------------------------------------------------
  if (progress >= 0.25 && progress < 0.82) {
    const p2 = (progress - 0.25) / 0.57; // 0.0 ~ 1.0
    const sprayAlpha = alpha * (progress < 0.60 ? 1.0 : Math.max(0, 1.0 - (progress - 0.60) / 0.22));

    if (sprayAlpha > 0.02) {
      // 26개의 비산 물방울 궤적 (위쪽으로 강하게 솟구친 후 중력 작용)
      const SPRAY_BEADS = [
        // 상공으로 높이 솟구치는 물방울들 (vy 강한 음수)
        { vx: -8,  vy: -88, g: 110, r: 4.2 },
        { vx: 12,  vy: -92, g: 115, r: 4.0 },
        { vx: -22, vy: -82, g: 105, r: 3.8 },
        { vx: 26,  vy: -78, g: 105, r: 3.6 },
        { vx: -4,  vy: -98, g: 120, r: 3.4 },
        { vx: 18,  vy: -85, g: 112, r: 3.8 },
        // 좌측/좌상단으로 뻗어나가는 물방울
        { vx: -48, vy: -65, g: 95,  r: 4.5 },
        { vx: -62, vy: -45, g: 85,  r: 4.0 },
        { vx: -36, vy: -55, g: 90,  r: 3.6 },
        { vx: -72, vy: -25, g: 75,  r: 3.4 },
        { vx: -54, vy: -12, g: 70,  r: 3.5 },
        // 우측/우상단으로 뻗어나가는 물방울
        { vx: 46,  vy: -68, g: 95,  r: 4.4 },
        { vx: 64,  vy: -48, g: 85,  r: 4.0 },
        { vx: 38,  vy: -52, g: 90,  r: 3.5 },
        { vx: 70,  vy: -22, g: 75,  r: 3.4 },
        { vx: 52,  vy: -10, g: 70,  r: 3.6 },
        // 하단/대각선 아래로 튀는 작은 물방울
        { vx: -30, vy: 15,  g: 65,  r: 3.2 },
        { vx: 32,  vy: 18,  g: 65,  r: 3.0 },
        { vx: -16, vy: 25,  g: 70,  r: 2.8 },
        { vx: 18,  vy: 22,  g: 70,  r: 2.8 },
        // 미세 원형 비드들
        { vx: -14, vy: -68, g: 95,  r: 2.6 },
        { vx: 6,   vy: -72, g: 100, r: 2.5 },
        { vx: -40, vy: -35, g: 80,  r: 2.8 },
        { vx: 42,  vy: -32, g: 80,  r: 2.8 },
        { vx: -28, vy: -75, g: 102, r: 3.0 },
        { vx: 30,  vy: -70, g: 100, r: 3.1 },
      ];

      SPRAY_BEADS.forEach((b) => {
        const curX = cx + b.vx * p2;
        const curY = cy + b.vy * p2 + 0.5 * b.g * p2 * p2;
        const curR = Math.max(1.0, b.r * (1.0 - p2 * 0.45));
        drawCelWaterBlob(curX, curY, curR, sprayAlpha, "main");
      });
    }
  }

  // -------------------------------------------------------------------------
  // 3단계: 주변에 잔잔히 내려앉는 미세 물안개 샤워 (Image 3: Glistening Mist Shower)
  // -------------------------------------------------------------------------
  if (progress >= 0.58) {
    const p3 = (progress - 0.58) / 0.42; // 0.0 ~ 1.0
    const mistAlpha = alpha * Math.max(0, 1.0 - p3 * 0.90);

    if (mistAlpha > 0.02) {
      ctx.save();

      // 36개의 미세 물방울 샤워 입자 정의 (의사 난수 시드 기반 고정 분포)
      const MIST_PARTICLES = [
        { seed: 1,  ox: -38, oy: -62, vy: 42, r: 1.8, isWhite: true },
        { seed: 2,  ox: -24, oy: -75, vy: 48, r: 1.5, isWhite: false },
        { seed: 3,  ox: -10, oy: -82, vy: 52, r: 2.0, isWhite: true },
        { seed: 4,  ox: 8,   oy: -85, vy: 50, r: 1.6, isWhite: false },
        { seed: 5,  ox: 22,  oy: -78, vy: 46, r: 1.9, isWhite: true },
        { seed: 6,  ox: 36,  oy: -65, vy: 44, r: 1.4, isWhite: false },
        { seed: 7,  ox: -48, oy: -45, vy: 38, r: 1.6, isWhite: false },
        { seed: 8,  ox: -32, oy: -50, vy: 42, r: 2.2, isWhite: true },
        { seed: 9,  ox: -16, oy: -58, vy: 46, r: 1.5, isWhite: false },
        { seed: 10, ox: 4,   oy: -60, vy: 48, r: 2.0, isWhite: true },
        { seed: 11, ox: 20,  oy: -52, vy: 45, r: 1.7, isWhite: false },
        { seed: 12, ox: 42,  oy: -42, vy: 40, r: 2.1, isWhite: true },
        { seed: 13, ox: -52, oy: -25, vy: 35, r: 1.5, isWhite: false },
        { seed: 14, ox: -30, oy: -30, vy: 38, r: 1.8, isWhite: true },
        { seed: 15, ox: -8,  oy: -35, vy: 42, r: 2.2, isWhite: true },
        { seed: 16, ox: 14,  oy: -32, vy: 40, r: 1.6, isWhite: false },
        { seed: 17, ox: 34,  oy: -26, vy: 36, r: 1.9, isWhite: true },
        { seed: 18, ox: 50,  oy: -20, vy: 34, r: 1.4, isWhite: false },
        { seed: 19, ox: -40, oy: -8,  vy: 30, r: 1.6, isWhite: false },
        { seed: 20, ox: -20, oy: -12, vy: 34, r: 2.0, isWhite: true },
        { seed: 21, ox: 0,   oy: -15, vy: 36, r: 2.4, isWhite: true },
        { seed: 22, ox: 24,  oy: -10, vy: 32, r: 1.7, isWhite: false },
        { seed: 23, ox: 44,  oy: -6,  vy: 28, r: 1.5, isWhite: true },
        { seed: 24, ox: -28, oy: 8,   vy: 26, r: 1.6, isWhite: false },
        { seed: 25, ox: -6,  oy: 5,   vy: 28, r: 2.0, isWhite: true },
        { seed: 26, ox: 16,  oy: 8,   vy: 26, r: 1.8, isWhite: false },
        { seed: 27, ox: 32,  oy: 12,  vy: 24, r: 1.4, isWhite: true },
        { seed: 28, ox: -18, oy: 20,  vy: 22, r: 1.5, isWhite: false },
        { seed: 29, ox: 6,   oy: 22,  vy: 22, r: 1.7, isWhite: true },
        { seed: 30, ox: 26,  oy: 25,  vy: 20, r: 1.3, isWhite: false },
        { seed: 31, ox: -45, oy: -55, vy: 40, r: 1.4, isWhite: true },
        { seed: 32, ox: 48,  oy: -50, vy: 42, r: 1.5, isWhite: true },
        { seed: 33, ox: -12, oy: -70, vy: 48, r: 1.8, isWhite: false },
        { seed: 34, ox: 28,  oy: -68, vy: 46, r: 1.9, isWhite: true },
        { seed: 35, ox: -35, oy: 15,  vy: 25, r: 1.4, isWhite: false },
        { seed: 36, ox: 38,  oy: 18,  vy: 22, r: 1.5, isWhite: true },
      ];

      MIST_PARTICLES.forEach(p => {
        // 부드럽게 사뿐히 내려앉는 낙하 궤적
        const fallY = cy + p.oy + p.vy * p3;
        // 미세한 좌우 살랑거림
        const swayX = cx + p.ox + Math.sin(p3 * 4.5 + p.seed) * 3.5;

        // 반짝임 펄스 (Glistening Twinkle)
        const twinkle = 0.65 + 0.35 * Math.sin(p3 * 8.0 + p.seed * 1.5);
        const particleAlpha = mistAlpha * twinkle;

        ctx.fillStyle = p.isWhite
          ? `rgba(255, 255, 255, ${particleAlpha})`
          : `rgba(125, 211, 252, ${particleAlpha * 0.9})`;

        ctx.beginPath();
        ctx.arc(swayX, fallY, Math.max(0.6, p.r * (1.0 - p3 * 0.35)), 0, Math.PI * 2);
        ctx.fill();

        // 가장 반짝이는 큰 백색 입자에 4방향 미니 글린트 스파크 추가
        if (p.isWhite && p.r >= 2.0 && twinkle > 0.85) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${particleAlpha * 0.85})`;
          ctx.lineWidth = 1.0;
          const glintLen = 2.8;
          ctx.beginPath();
          ctx.moveTo(swayX - glintLen, fallY);
          ctx.lineTo(swayX + glintLen, fallY);
          ctx.moveTo(swayX, fallY - glintLen);
          ctx.lineTo(swayX + glintLen, fallY);
          ctx.stroke();
        }
      });

      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * 💨 집게해머 타격 유기적 수증기 확산 (Dispersing Water Vapor)
 * - [유저 요구사항 100% 반영]:
 *   1. "수증기는 외각으로 갈수록 투명한 흰색 그라데이션, 중간이 반투명한 형태의 랜덤한 형체"
 *   2. "Z축 최상단"
 *   3. "수증기는 타격이펙트때 같이 나오지만 종료는 별개로 퍼지게"
 * - 타격 시점(progress=0)부터 함께 분출되어, 알갱이가 사라진 후에도 사방으로 널리 퍼지며 독자적으로 기화/소산
 */
export function drawCrabhammerVaporDispersal(
  ctx: any,
  tx: number,
  ty: number,
  progress: number, // 0.0 ~ 1.0 (타격 직격부터 소산까지)
  alpha: number = 1.0
) {
  if (progress <= 0 || progress > 1.0 || alpha <= 0.01) return;

  ctx.save();

  const cx = tx;
  const cy = ty + 26;

  // 외각으로 갈수록 투명한 하늘색 그라데이션, 중간이 반투명한 형태의 랜덤 형체 수증기 (Sky Blue Water Vapor)
  const drawSingleVaporPuff = (px: number, py: number, radius: number, puffAlpha: number) => {
    if (radius <= 1.0 || puffAlpha <= 0.01) return;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
    grad.addColorStop(0.00, `rgba(186, 230, 253, ${Math.min(1.0, puffAlpha * 0.48)})`);
    grad.addColorStop(0.45, `rgba(125, 211, 252, ${puffAlpha * 0.25})`);
    grad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawOrganicVaporCloud = (
    vx: number,
    vy: number,
    baseR: number,
    cloudAlpha: number,
    seed: number
  ) => {
    if (baseR <= 2 || cloudAlpha <= 0.01) return;
    ctx.save();
    // 4개의 서브 퍼프가 유기적으로 뭉쳐 자연스러운 랜덤 형체 구성
    const offsets = [
      { dx: 0, dy: 0, rMult: 1.0 },
      { dx: Math.sin(seed * 1.7) * baseR * 0.45, dy: Math.cos(seed * 2.3) * baseR * 0.45, rMult: 0.85 },
      { dx: Math.cos(seed * 3.1) * baseR * 0.40, dy: Math.sin(seed * 1.9) * baseR * 0.40, rMult: 0.80 },
      { dx: Math.sin(seed * 2.5) * baseR * 0.35, dy: -Math.cos(seed * 3.7) * baseR * 0.35, rMult: 0.75 },
    ];
    for (const o of offsets) {
      drawSingleVaporPuff(vx + o.dx, vy + o.dy, baseR * o.rMult, cloudAlpha);
    }
    ctx.restore();
  };

  // 수증기 전체 발현 진입 (초반 빠른 기화)
  const fadeIn = Math.min(1.0, progress / 0.10);

  if (fadeIn > 0.01) {
    // [유저 피드백 반영]: 균등 확산 탈피 -> 속도, 크기, 확산 거리, 소멸 시점의 유기적 비대칭화
    const VAPOR_CLUSTERS = [
      // 1. 상공 메인 볼륨 증기 (가장 크고 높이 치솟으며 끝까지 오래 남는 대형 증기)
      { angle: -Math.PI / 2 - 0.15, maxDist: 82, riseY: -45, baseR: 22, speedExp: 0.50, fadePow: 0.90, seed: 1.4 },
      // 2. 상공 우측 빠른 상승 증기 (빠르게 치솟아 흩어지는 중형 증기)
      { angle: -Math.PI / 2 + 0.38, maxDist: 68, riseY: -38, baseR: 14, speedExp: 0.40, fadePow: 1.30, seed: 2.7 },
      // 3. 좌상단 거대 증기 뱅크 (좌측으로 묵직하게 밀려나는 볼륨 덩어리)
      { angle: -2.25, maxDist: 74, riseY: -24, baseR: 20, speedExp: 0.46, fadePow: 1.00, seed: 3.9 },
      // 4. 좌측 작은 미세 수증기 퍼프 (일찍 흩어져 사라지는 잔여 증기)
      { angle: -2.90, maxDist: 44, riseY: -10, baseR: 11, speedExp: 0.65, fadePow: 1.65, seed: 4.8 },
      // 5. 중심부 근처에 느리게 머무르는 짙은 잔향 증기 (적게 이동하고 제자리에서 뭉게뭉게 팽창)
      { angle: -1.75, maxDist: 22, riseY: -12, baseR: 19, speedExp: 0.85, fadePow: 0.85, seed: 5.2 },
      // 6. 우상단 날렵한 분출 증기
      { angle: -0.65, maxDist: 62, riseY: -26, baseR: 15, speedExp: 0.44, fadePow: 1.25, seed: 6.6 },
      // 7. 우측 낮게 깔리는 미세 증기
      { angle: -0.15, maxDist: 50, riseY: -8,  baseR: 10, speedExp: 0.58, fadePow: 1.55, seed: 7.3 },
      // 8. 하단 바닥 잔류 증기 (지면을 따라 완만하게 퍼짐)
      { angle:  1.85, maxDist: 30, riseY: -2,  baseR: 13, speedExp: 0.72, fadePow: 1.40, seed: 8.5 },
      // 9. 우하단 비대칭 꼬리 증기
      { angle:  0.80, maxDist: 36, riseY: -4,  baseR: 11, speedExp: 0.62, fadePow: 1.45, seed: 9.1 },
    ];

    VAPOR_CLUSTERS.forEach((v) => {
      // 구름별 고유 확산 곡선 (어떤 것은 초반에 팍 터지고, 어떤 것은 서서히 이동)
      const cloudExp = Math.pow(progress, v.speedExp);
      const currentDist = 8 + v.maxDist * cloudExp;
      const swayX = Math.sin(progress * 2.8 + v.seed) * 6;
      const vx = cx + Math.cos(v.angle) * currentDist + swayX;
      const vy = cy + Math.sin(v.angle) * currentDist + v.riseY * Math.pow(progress, 1.1);

      // 구름별 고유 소산 속도 (일찍 사라지는 미세 퍼프 vs 끝까지 뭉게뭉게 남는 대형 증기)
      const cFadeOut = Math.max(0, 1.0 - Math.pow(progress, v.fadePow));
      const cAlpha = alpha * fadeIn * cFadeOut;

      if (cAlpha > 0.015) {
        // 구름 크기도 공기 중으로 흩어지며 뭉게뭉게 팽창
        const vr = v.baseR * (0.65 + 0.80 * cloudExp);
        drawOrganicVaporCloud(vx, vy, vr, cAlpha, v.seed);
      }
    });
  }

  ctx.restore();
}

/**
 * 🦀 152: 집게해머 (Crabhammer) 메인 DrawEffect 함수
 */
export function drawCrabhammerEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (frame.showEffect === false) return;

  const { isPlayer: isP } = drawCtx;
  const targetPos = drawCtx.targetPos;
  const tx = targetPos.x;
  const ty = targetPos.y;

  ctx.save();

  // 1. 위에서 내려찍는 순백 기둥 (Vertical Down-Slam Pillar)
  const slamArcProg = frame.slamArcProgress ?? 0;
  if (slamArcProg > 0) {
    drawCrabhammerDownSlam(ctx, tx, ty, slamArcProg, isP, frame.slamArcAlpha ?? 1.0);
  }

  // 2. 타격 시 지면 물보라 스플래시 (Ground Water Splash)
  const impactProg = frame.impactProgress ?? 0;
  if (impactProg > 0) {
    drawCrabhammerHitSplash(ctx, tx, ty, impactProg, frame.impactAlpha ?? 1.0);

    // 3. [Z축 최상단]: 타격 시 함께 발생하여 별개로 넓게 퍼져 소산하는 수증기 (Dispersing Water Vapor)
    drawCrabhammerVaporDispersal(ctx, tx, ty, impactProg, frame.impactAlpha ?? 1.0);
  }

  ctx.restore();
}

