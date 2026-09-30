// ============================================================================
// 🎮 ROGUEPot Move Animation Renderer: No.145 ~ No.148
// 145: 거품 (Bubble)
// 146: 잼잼펀치 (Dizzy Punch)
// 147: 버섯포자 (Spore)
// 148: 플래시 (Flash)
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawWaterSoapBubble, drawBubblePopSplash } from "./move061_064.js";
import { drawFrontStraightPunchFistSvg } from "./move001_004.js";
import { drawMiniRetroStar, getCometPunchFistImg } from "../common/helpers.js";
import { drawSleepZzz } from "./move141_144.js";

export { drawWaterSoapBubble, drawBubblePopSplash, drawSleepZzz };

export interface Bubble3Config {
  baseRadius: number;
  perpOffset: number;
  targetOffsetX: number;
  targetOffsetY: number;
  pulseFreq: number;
  pulsePhase: number;
  popRadius: number;
}

export const BUBBLE_3_CONFIGS: Bubble3Config[] = [
  {
    baseRadius: 10.0,
    perpOffset: -16,
    targetOffsetX: -8,
    targetOffsetY: -10,
    pulseFreq: 4.8,
    pulsePhase: 0,
    popRadius: 18,
  },
  {
    baseRadius: 12.5,
    perpOffset: 3,
    targetOffsetX: 2,
    targetOffsetY: 0,
    pulseFreq: 4.5,
    pulsePhase: Math.PI * 0.7,
    popRadius: 22,
  },
  {
    baseRadius: 9.5,
    perpOffset: 16,
    targetOffsetX: 7,
    targetOffsetY: 8,
    pulseFreq: 5.0,
    pulsePhase: Math.PI * 1.4,
    popRadius: 20,
  },
];

/**
 * 🫧 투명 비눗방울 (Transparent Soap Bubble)
 * [유저 요청 완벽 반영]:
 * - 중심부는 100% 완전 투명 (배경/포켓몬이 그대로 비침)
 * - 바깥쪽으로 갈수록 점진적으로 반투명해지는 아쿠아/스카이블루 그라데이션
 * - 표면의 미세한 외곽 림 및 상단 광택 하이라이트로 입체적인 맑은 비눗방울 질감 유지
 */
export function drawTransparentSoapBubble(
  ctx: any,
  x: number,
  y: number,
  r: number,
  alpha: number = 1.0
) {
  if (r <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 방울 내부: 중심의 투명 반경을 축소하고 외곽으로 갈수록 반투명해지는 방사형 그라데이션
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0.00, "rgba(224, 242, 254, 0.00)"); // 중심점 핀포인트 투명 (0%)
  grad.addColorStop(0.18, "rgba(224, 242, 254, 0.04)"); // 투명 반경 축소 (18%부터 은은한 워터 틴트 유입)
  grad.addColorStop(0.38, "rgba(186, 230, 253, 0.22)"); // 38% 구간 반투명
  grad.addColorStop(0.65, "rgba(125, 211, 252, 0.44)"); // 중간부 선명한 스카이블루 (44%)
  grad.addColorStop(0.85, "rgba(56, 189, 248, 0.65)");  // 외곽부 아쿠아 (65%)
  grad.addColorStop(1.00, "rgba(2, 132, 199, 0.80)");   // 가장자리 림 (80%)
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // 2. 가장자리 얇은 반투명 외곽 림
  ctx.strokeStyle = "rgba(196, 255, 255, 0.75)";
  ctx.lineWidth = Math.max(1.0, r * 0.12);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // 3. 상단-좌측 반사 광택 호 (Glossy Arc)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
  ctx.lineWidth = Math.max(1.0, r * 0.16);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.74, -Math.PI * 0.95, -Math.PI * 0.48);
  ctx.stroke();

  // 4. 상단-좌측 작은 반짝임 점
  ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
  ctx.beginPath();
  ctx.arc(x - r * 0.42, y - r * 0.42, Math.max(0.8, r * 0.14), 0, Math.PI * 2);
  ctx.fill();

  // 5. 하단-우측 은은한 반사 림
  ctx.strokeStyle = "rgba(224, 255, 255, 0.45)";
  ctx.lineWidth = Math.max(0.8, r * 0.10);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.80, Math.PI * 0.15, Math.PI * 0.42);
  ctx.stroke();

  ctx.restore();
}

/**
 * 145: 거품 (Bubble) Effect Renderer
 *
 * [유저 요구사항 100% 반영]:
 * 1. 거품광선(061)의 고품질 물 비눗방울 그래픽(drawWaterSoapBubble)에서 3개만 차용
 * 2. 꼬리(drawBubbleBeamTrail / 빔 잔상) 일체 배제
 * 3. 3개의 거품이 날아가면서 커졌다가 작아졌다가(호흡/진동 펄스) 팽창과 수축을 반복
 * 4. 상대에게 도달한 후 1번, 2번, 3번 거품이 순차적으로 '펑! 펑! 펑!' 파열(drawBubblePopSplash)
 */
export function drawBubbleEffect(
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
  const { attackerPos, targetPos, isPlayer: isP, isHit } = drawCtx;

  // 시전자 위치 (거품을 내뿜는 입/머리 위치)
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 12 : 8);

  // 대상 위치
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0) return;

  const angle = Math.atan2(dy, dx);
  const normX = -Math.sin(angle);
  const normY = Math.cos(angle);

  ctx.save();

  const bubbleProgresses: number[] = frame.bubbles || [];
  const globalAlpha = frame.effectAlpha ?? 1.0;

  // 비행 중 거품 / 파열 거품 렌더링
  for (let i = 0; i < bubbleProgresses.length; i++) {
    const prog = bubbleProgresses[i];
    if (prog === undefined || prog <= 0) continue;

    const cfg = BUBBLE_3_CONFIGS[i % BUBBLE_3_CONFIGS.length];

    if (prog < 1.0) {
      // 🫧 1. 거품 비행 중: "꼬리같은거 없이 해당 거품 3개가 커졌다가 작아졌다가 하면서 적에게 이동"
      const flightT = Math.max(0, Math.min(1.0, prog));

      // 부드러운 궤적: 시작점에서는 한곳에서 발사되고, 비행 중 살짝 벌어졌다 타겟으로 수렴
      const spreadT = Math.sin(flightT * Math.PI);
      const wobble = Math.sin(flightT * Math.PI * 3 + cfg.pulsePhase) * 4;
      const effectiveOffset = cfg.perpOffset * spreadT + wobble * spreadT;

      // 비눗방울 특유의 공중 부력 (살짝 위로 떠오르는 아크)
      const buoyancy = -Math.sin(flightT * Math.PI) * 6;

      const baseX = ax + dx * flightT;
      const baseY = ay + dy * flightT;

      const curX = baseX + normX * effectiveOffset;
      const curY = baseY + normY * effectiveOffset + buoyancy;

      // 🫧 "커졌다가 작아졌다가": 비행 중 크기 팽창 및 수축 진동 (0.65x ~ 1.35x)
      const pulse = Math.sin(flightT * Math.PI * cfg.pulseFreq + cfg.pulsePhase);
      const scale = 1.0 + 0.35 * pulse;
      const currentRadius = Math.max(3.5, cfg.baseRadius * scale);

      // 생성 시 자연스러운 페이드인
      const bAlpha = Math.min(1.0, flightT / 0.08) * globalAlpha;

      // 꼬리 일체 없이 중심이 투명하고 외곽이 반투명한 비눗방울 본체 렌더링
      drawTransparentSoapBubble(ctx, curX, curY, currentRadius, bAlpha);
    } else {
      // 💥 2. 적에게 닿은 후 파열: "닿고나서 펑펑펑"
      if (isHit !== false) {
        // frame.bubbles에서 1.0 -> 1.40까지 popProg 진행
        const popDuration = 0.40;
        const popProg = Math.min(1.0, (prog - 1.0) / popDuration);
        if (popProg < 1.0) {
          const hitX = tx + cfg.targetOffsetX;
          const hitY = ty + cfg.targetOffsetY;
          drawBubblePopSplash(ctx, hitX, hitY, popProg, cfg.popRadius);
        }
      }
    }
  }

  // 발밑 물보라 파문 (피날레 27프레임 이후)
  const splashRingProg = frame.splashRingProg;
  if (splashRingProg !== undefined && splashRingProg > 0 && splashRingProg <= 1.0) {
    const ringR = 20 + splashRingProg * 16;
    const ringA = Math.max(0, 1.0 - splashRingProg) * 0.55;
    ctx.strokeStyle = `rgba(125, 211, 252, ${ringA})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 16, ringR, ringR * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
// 146: 잼잼펀치 / 잽잽펀치 (Dizzy Punch)
// ============================================================================

export interface Parabolic3DConfusionParticle {
  angle3D: number;   // 방위각 (0 ~ 2*PI, 360도 둥글게 원형 전방위 방사)
  elevation: number; // 발사 앙각 (라디안: 55° ~ 72° 상공 포물선 발사)
  speed: number;     // 초속 (px/진행도)
  gravity: number;   // 중력 가속도
  size: number;      // 기본 크기 (px)
  color: string;
  type: "star" | "spiral" | "chick" | "sparkle";
  rotSpeed: number;
  rotOffset: number;
}

export const JAB1_CONFUSION_PARTICLES: Parabolic3DConfusionParticle[] = [
  // 12방향 360도 둥근 3D 원형 각도 (매 30도 간격으로 둥글게 입체 방사, 체공 시간 대폭 연장)
  // 0° (우측 측면)
  { angle3D: 0, elevation: 1.05, speed: 104, gravity: 210, size: 13, color: "#FACC15", type: "star", rotSpeed: 4.0, rotOffset: 0.2 },
  // 30° (우측 전면)
  { angle3D: Math.PI / 6, elevation: 1.10, speed: 108, gravity: 216, size: 11, color: "#FEF08A", type: "spiral", rotSpeed: -5.5, rotOffset: 0.0 },
  // 60° (중앙 우측 전면)
  { angle3D: Math.PI / 3, elevation: 1.18, speed: 112, gravity: 224, size: 8.5, color: "#FFFFFF", type: "sparkle", rotSpeed: 4.5, rotOffset: 0.3 },
  // 90° (정면 전방: 카메라를 향해 앞으로 둥글게 튀어나오는 피요피요 병아리!)
  { angle3D: Math.PI / 2, elevation: 1.12, speed: 115, gravity: 228, size: 14.5, color: "#FACC15", type: "chick", rotSpeed: 1.8, rotOffset: -0.15 },
  // 120° (중앙 좌측 전면)
  { angle3D: (2 * Math.PI) / 3, elevation: 1.16, speed: 110, gravity: 220, size: 12, color: "#FDE047", type: "star", rotSpeed: -4.8, rotOffset: 0.5 },
  // 150° (좌측 전면)
  { angle3D: (5 * Math.PI) / 6, elevation: 1.10, speed: 106, gravity: 214, size: 11, color: "#F59E0B", type: "spiral", rotSpeed: 6.0, rotOffset: 0.8 },
  // 180° (좌측 측면)
  { angle3D: Math.PI, elevation: 1.05, speed: 102, gravity: 208, size: 13, color: "#FACC15", type: "star", rotSpeed: -3.8, rotOffset: 0.4 },
  // 210° (좌측 후면 깊이)
  { angle3D: (7 * Math.PI) / 6, elevation: 1.10, speed: 105, gravity: 212, size: 8.5, color: "#FFFFFF", type: "sparkle", rotSpeed: 5.0, rotOffset: 0.0 },
  // 240° (중앙 좌측 후면)
  { angle3D: (4 * Math.PI) / 3, elevation: 1.15, speed: 108, gravity: 218, size: 10.5, color: "#FEF08A", type: "star", rotSpeed: -4.0, rotOffset: 0.2 },
  // 270° (정후면 깊이: 배경 뒤쪽 상공으로 솟구침)
  { angle3D: (3 * Math.PI) / 2, elevation: 1.20, speed: 114, gravity: 226, size: 11.5, color: "#FDE047", type: "star", rotSpeed: 3.5, rotOffset: 0.6 },
  // 300° (중앙 우측 후면)
  { angle3D: (5 * Math.PI) / 3, elevation: 1.15, speed: 106, gravity: 215, size: 8.5, color: "#FFFFFF", type: "sparkle", rotSpeed: -4.5, rotOffset: 0.1 },
  // 330° (우측 후면 깊이)
  { angle3D: (11 * Math.PI) / 6, elevation: 1.08, speed: 104, gravity: 210, size: 10.5, color: "#FEF08A", type: "star", rotSpeed: 4.2, rotOffset: 0.7 },
];

export const JAB2_CONFUSION_PARTICLES: Parabolic3DConfusionParticle[] = [
  // 2차 잽: 15도 위상 오프셋 (체공 시간 대폭 연장)
  // 15° (우측 전면)
  { angle3D: Math.PI / 12, elevation: 1.08, speed: 106, gravity: 214, size: 13.5, color: "#FACC15", type: "star", rotSpeed: -4.5, rotOffset: 0.3 },
  // 45° (우측 대각 전면)
  { angle3D: Math.PI / 4, elevation: 1.14, speed: 110, gravity: 220, size: 8.5, color: "#FFFFFF", type: "sparkle", rotSpeed: 5.2, rotOffset: 0.0 },
  // 75° (정면 우측 전면)
  { angle3D: (5 * Math.PI) / 12, elevation: 1.18, speed: 114, gravity: 226, size: 11.5, color: "#FDE047", type: "spiral", rotSpeed: -6.0, rotOffset: 0.5 },
  // 105° (정면 좌측 전방: 카메라를 향해 앞으로 둥글게 튀어나오는 피요피요 병아리!)
  { angle3D: (7 * Math.PI) / 12, elevation: 1.12, speed: 116, gravity: 230, size: 14.5, color: "#FACC15", type: "chick", rotSpeed: -1.8, rotOffset: 0.15 },
  // 135° (좌측 대각 전면)
  { angle3D: (3 * Math.PI) / 4, elevation: 1.15, speed: 108, gravity: 218, size: 8.5, color: "#FFFFFF", type: "sparkle", rotSpeed: -4.2, rotOffset: 0.2 },
  // 165° (좌측 전면)
  { angle3D: (11 * Math.PI) / 12, elevation: 1.08, speed: 104, gravity: 210, size: 13, color: "#FEF08A", type: "star", rotSpeed: 4.6, rotOffset: 0.8 },
  // 195° (좌측 후면)
  { angle3D: (13 * Math.PI) / 12, elevation: 1.10, speed: 105, gravity: 212, size: 11, color: "#F59E0B", type: "spiral", rotSpeed: -5.8, rotOffset: 1.0 },
  // 225° (좌측 대각 후면)
  { angle3D: (5 * Math.PI) / 4, elevation: 1.16, speed: 110, gravity: 220, size: 10.5, color: "#FACC15", type: "star", rotSpeed: 3.8, rotOffset: 0.4 },
  // 255° (정후면 좌측 깊이)
  { angle3D: (17 * Math.PI) / 12, elevation: 1.20, speed: 114, gravity: 226, size: 8.5, color: "#FFFFFF", type: "sparkle", rotSpeed: -5.0, rotOffset: 0.0 },
  // 285° (정후면 우측 깊이)
  { angle3D: (19 * Math.PI) / 12, elevation: 1.18, speed: 112, gravity: 224, size: 11.5, color: "#FEF08A", type: "star", rotSpeed: 4.0, rotOffset: 0.6 },
  // 315° (우측 대각 후면)
  { angle3D: (7 * Math.PI) / 4, elevation: 1.12, speed: 106, gravity: 214, size: 11, color: "#FDE047", type: "spiral", rotSpeed: -6.5, rotOffset: 0.2 },
  // 345° (우측 후면)
  { angle3D: (23 * Math.PI) / 12, elevation: 1.06, speed: 102, gravity: 208, size: 10.5, color: "#FACC15", type: "star", rotSpeed: 3.5, rotOffset: 0.7 },
];

/**
 * 뱅글뱅글 돌아가는 혼란 스파이럴 기호 (@)
 */
export function drawDizzySpiral(
  ctx: any,
  x: number,
  y: number,
  radius: number = 10,
  color: string = "#FDE047",
  alpha: number = 1.0,
  rotation: number = 0
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.4, radius * 0.22);
  ctx.lineCap = "round";

  ctx.beginPath();
  const turns = 1.75;
  const maxAngle = turns * Math.PI * 2;
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * maxAngle;
    const r = (i / steps) * radius;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * 잼잼펀치(ピヨピヨパンチ) 상징: 귀여운 미니 피요피요 혼란 병아리
 */
export function drawMiniDizzyChick(
  ctx: any,
  x: number,
  y: number,
  size: number = 12,
  facingLeft: boolean = false,
  alpha: number = 1.0,
  rotation: number = 0
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  if (facingLeft) ctx.scale(-1, 1);
  ctx.globalAlpha = alpha;

  const r = size * 0.5;

  // 1. 몸통 (선명한 노란 깃털)
  ctx.fillStyle = "#FACC15";
  ctx.strokeStyle = "#CA8A04";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. 부리 (주황색 삼각형)
  ctx.fillStyle = "#F97316";
  ctx.beginPath();
  ctx.moveTo(r * 0.7, -r * 0.15);
  ctx.lineTo(r * 1.35, 0);
  ctx.lineTo(r * 0.7, r * 0.25);
  ctx.closePath();
  ctx.fill();

  // 3. 혼란 눈 (x자 눈)
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 1.2;
  const ex = r * 0.2;
  const ey = -r * 0.2;
  const es = r * 0.26;
  ctx.beginPath();
  ctx.moveTo(ex - es, ey - es); ctx.lineTo(ex + es, ey + es);
  ctx.moveTo(ex - es, ey + es); ctx.lineTo(ex + es, ey - es);
  ctx.stroke();

  // 4. 날개
  ctx.strokeStyle = "#EAB308";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(-r * 0.25, r * 0.1, r * 0.45, Math.PI * 0.2, Math.PI * 0.9);
  ctx.stroke();

  // 5. 벼슬 깃털
  ctx.fillStyle = "#FDE047";
  ctx.beginPath();
  ctx.ellipse(-r * 0.1, -r * 0.95, r * 0.22, r * 0.35, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 타격 순간(퍽!) 강타 스파크 & 충격 효과
 */
export function drawHitSparkImpact(
  ctx: any,
  x: number,
  y: number,
  radius: number = 24,
  alpha: number = 1.0
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  drawMiniRetroStar(ctx, x, y, radius * 1.3, "#FFFFFF", Math.PI / 4);
  drawMiniRetroStar(ctx, x, y, radius * 0.9, "#FACC15", 0);

  const sparkPoints = [
    { dx: -16, dy: -14, r: 3.0, c: "#FFFFFF" },
    { dx: 17, dy: -12, r: 2.8, c: "#FEF08A" },
    { dx: -14, dy: 15, r: 2.8, c: "#FACC15" },
    { dx: 15, dy: 14, r: 3.0, c: "#FFFFFF" },
    { dx: 0, dy: -22, r: 2.5, c: "#FEF08A" },
    { dx: 0, dy: 20, r: 2.5, c: "#F59E0B" },
  ];
  for (const sp of sparkPoints) {
    ctx.fillStyle = sp.c;
    ctx.beginPath();
    ctx.arc(x + sp.dx, y + sp.dy, sp.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderParabolicBurst(
  ctx: any,
  originX: number,
  originY: number,
  particles: Parabolic3DConfusionParticle[],
  progress: number
) {
  const t = Math.max(0, Math.min(1.0, progress));
  if (t <= 0 || t > 1.0) return;

  // [유저 피드백 적극 반영: "그 터진 애들이 너무 빨리 사라진다"]
  // 80% 진행도까지 100% 완전 불투명(1.0) 유지하여 길게 머묾!
  // 마지막 20%(0.80 ~ 1.0) 구간에서만 부드럽고 자연스럽게 페이드아웃
  const baseAlpha = t < 0.80 ? 1.0 : Math.max(0, (1.0 - t) / 0.20);
  if (baseAlpha <= 0) return;

  // 1. 3D 입체 각도 팽창 링 (타격점 중심 3D 원형 충격파)
  if (t < 0.45) {
    const ringT = t / 0.45;
    const ringRx = 14 + ringT * 42;
    const ringRy = ringRx * 0.44; // 3D 원근 타원비
    const ringA = (1.0 - ringT) * 0.75 * (t < 0.35 ? 1.0 : (1.0 - (t - 0.35) / 0.10));
    ctx.save();
    ctx.strokeStyle = `rgba(250, 204, 21, ${ringA.toFixed(3)})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(originX, originY + 6, ringRx, ringRy, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${(ringA * 0.6).toFixed(3)})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(originX, originY + 6, ringRx * 0.85, ringRy * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. 3D 원형(360도) 포물선 입자 계산 및 Z-소팅 (깊이 순 정렬)
  const renderedItems = particles.map((p) => {
    // 3D 구면/원형 탄도학 계산: 방위각(angle3D)과 앙각(elevation)에 따라 360도 둥글게 방사
    // 수평 확산: 초반 팽창 후 공기 저항(drag)으로 감속하여 3D 돔을 형성하고 머무름
    const horizEase = Math.sin(t * Math.PI * 0.5);
    const radDist = (p.speed * 0.45) * (0.30 * t + 0.70 * horizEase);
    const posX = radDist * Math.cos(p.angle3D);
    const posZ = radDist * Math.sin(p.angle3D); // +Z는 전면(카메라 앞), -Z는 후면(배경 깊숙이)

    // 수직 포물선: 솟구침 -> 상공 체공(Hang-time) -> 부드러운 하강 유영
    const vy0 = p.speed * Math.sin(p.elevation);
    const posY = -vy0 * t + 0.5 * p.gravity * t * t;
    const flutter = Math.sin(t * Math.PI * 4 + p.rotOffset) * 2.0 * Math.sin(t * Math.PI);

    // 3D 쿼터뷰 투영 (전후 깊이 posZ에 따른 세로 투영 및 크기 원근감)
    const screenX = originX + posX;
    const screenY = originY + posY + flutter + posZ * 0.42;

    // 3D 원근 스케일: 전면(카메라 가까움)은 더 크고, 후면(배경)은 더 작게
    const depthScale = Math.max(0.68, Math.min(1.42, 1.0 + (posZ / 75) * 0.30));
    const popScale = t < 0.10 ? 0.5 + (t / 0.10) * 0.5 : 1.0;
    const finalSize = p.size * depthScale * popScale;

    // 체공 중 미세한 반짝임(Twinkle)과 3D 깊이 알파
    const twinkle = t > 0.40 ? 0.92 + 0.08 * Math.sin(t * Math.PI * 8 + p.rotOffset) : 1.0;
    const depthAlpha = Math.max(0, Math.min(1.0, baseAlpha * twinkle * (posZ < 0 ? 0.90 : 1.0)));
    const rot = p.rotOffset + p.rotSpeed * t;

    return {
      p,
      posZ,
      screenX,
      screenY,
      finalSize,
      depthAlpha,
      rot,
    };
  });

  // 깊이(posZ) 오름차순 정렬: 후면 입자(-Z) 먼저 렌더링 ➔ 전면 입자(+Z) 위에 렌더링
  renderedItems.sort((a, b) => a.posZ - b.posZ);

  for (const item of renderedItems) {
    const { p, screenX: px, screenY: py, finalSize: curSize, depthAlpha: pAlpha, rot: pRot } = item;
    if (pAlpha <= 0) continue;

    ctx.save();
    ctx.globalAlpha = pAlpha;
    // 어떤 배경에서도 별과 기호가 또렷하게 보이도록 부드러운 그림자 부여
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 2.5;

    if (p.type === "star") {
      drawMiniRetroStar(ctx, px, py, curSize, p.color, pRot);
    } else if (p.type === "spiral") {
      drawDizzySpiral(ctx, px, py, curSize * 0.9, p.color, pAlpha, pRot);
    } else if (p.type === "chick") {
      drawMiniDizzyChick(
        ctx,
        px,
        py,
        curSize,
        Math.cos(p.angle3D) < 0,
        pAlpha,
        (Math.cos(p.angle3D) < 0 ? -1 : 1) * Math.sin(t * Math.PI * 3) * 0.25
      );
    } else if (p.type === "sparkle") {
      drawMiniRetroStar(ctx, px, py, curSize, p.color, Math.PI / 4 + pRot);
    }

    ctx.restore();
  }
}

/**
 * 146: 잼잼펀치 / 잽잽펀치 (Dizzy Punch) Effect Renderer
 *
 * [유저 요청 완벽 반영]:
 * 1. 주먹 SVG: 메가톤펀치에 사용된 정면 정권 SVG(drawFrontStraightPunchFistSvg) 사용
 * 2. 퍽 > 혼란 효과 터지기 2회
 * 3. 혼란 효과: 빙글빙글 공전하는 것이 아니라, 타격점으로부터 다각도 포물선 궤적으로 분출!
 */
export function drawDizzyPunchEffect(
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
  const { attackerPos, targetPos, isPlayer: isP, isHit } = drawCtx;

  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);
  const ax = attackerPos.x;
  const ay = attackerPos.y;

  // 방향 벡터 (시전자 -> 대상)
  const dirX = tx - ax;
  const dirY = ty - ay;
  const dist = Math.hypot(dirX, dirY) || 1;
  const nx = dirX / dist;
  const ny = dirY / dist;

  // 1차 잽 타격점 (약간 좌측 안면/턱)
  const hit1X = tx - 14;
  const hit1Y = ty - 18;

  // 2차 잽 타격점 (약간 우측 관자놀이/안면)
  const hit2X = tx + 14;
  const hit2Y = ty - 22;

  ctx.save();

  // 1. 주먹 렌더링 (메가톤펀치 주먹 스프라이트 사용)
  const jabNum = frame.jabNum; // 1 | 2
  const fistProg = frame.fistProg ?? 1.0;
  const fistAlpha = frame.fistAlpha ?? 0;
  const cometFist = getCometPunchFistImg();

  if (fistAlpha > 0 && jabNum) {
    if (jabNum === 1) {
      // 1차 잽 (왼손 잽 - 살짝 비스듬히 정면 돌진)
      const curX = hit1X - nx * 32 * (1.0 - fistProg);
      const curY = hit1Y - ny * 32 * (1.0 - fistProg);
      const fistScale = 0.62 + 0.16 * fistProg; // 0.62 -> 0.78
      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(-0.15);
      ctx.scale(fistScale, fistScale);
      ctx.globalAlpha = fistAlpha;
      if (cometFist) {
        const fw = cometFist.width;
        const fh = cometFist.height;
        ctx.drawImage(cometFist, -fw / 2, -fh / 2, fw, fh);
      } else {
        drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.5, 1.0);
      }
      ctx.restore();
    } else if (jabNum === 2) {
      // 2차 잽 (오른손 잽/스트레이트 - 반대쪽 미러링 및 각도)
      const curX = hit2X - nx * 32 * (1.0 - fistProg);
      const curY = hit2Y - ny * 32 * (1.0 - fistProg);
      const fistScale = 0.64 + 0.16 * fistProg; // 0.64 -> 0.80
      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(0.15);
      ctx.scale(-fistScale, fistScale); // 오른손 주먹 미러링
      ctx.globalAlpha = fistAlpha;
      if (cometFist) {
        const fw = cometFist.width;
        const fh = cometFist.height;
        ctx.drawImage(cometFist, -fw / 2, -fh / 2, fw, fh);
      } else {
        drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.5, 1.0);
      }
      ctx.restore();
    }
  }

  // 2. 타격 순간 스파크 ("퍽!")
  if (frame.showHitSpark && isHit !== false) {
    const sparkX = jabNum === 1 ? hit1X : hit2X;
    const sparkY = (jabNum === 1 ? hit1Y : hit2Y) - 6;
    drawHitSparkImpact(ctx, sparkX, sparkY, 26, 1.0);
  }

  // 3. 1차 혼란 효과 포물선 분출
  if (frame.wave1Prog !== undefined && frame.wave1Prog > 0 && frame.wave1Prog <= 1.0 && isHit !== false) {
    renderParabolicBurst(ctx, hit1X, hit1Y - 6, JAB1_CONFUSION_PARTICLES, frame.wave1Prog);
  }

  // 4. 2차 혼란 효과 포물선 분출
  if (frame.wave2Prog !== undefined && frame.wave2Prog > 0 && frame.wave2Prog <= 1.0 && isHit !== false) {
    renderParabolicBurst(ctx, hit2X, hit2Y - 6, JAB2_CONFUSION_PARTICLES, frame.wave2Prog);
  }

  ctx.restore();
}

// ============================================================================
// 147: 버섯포자 (Spore)
// ============================================================================

/**
 * 🍄 버섯 갓 포자체 (Mushroom Spore Cap)
 * - 통통하고 귀여운 아가리쿠스 버섯 모자 형태
 * - 아이보리 크림색 주름 하단(Gills) + 볼륨감 있는 버섯 갓 돔 + 4개의 입체 점박이 무늬(Spots)
 */
export function drawMushroomSporeCap(
  ctx: any,
  x: number,
  y: number,
  size: number = 18,
  rotation: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const rx = size * 0.95;
  const ry = size * 0.72;

  // 1. 하단 버섯 주름부 (Gills / Underside)
  ctx.fillStyle = "#FEF08A"; // 밝은 크림 아이보리
  ctx.strokeStyle = "#CA8A04";
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.ellipse(0, ry * 0.22, rx * 0.90, ry * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 하단 방사형 미세 주름선
  ctx.strokeStyle = "rgba(161, 98, 7, 0.45)";
  ctx.lineWidth = 0.8;
  for (let a = -0.75; a <= 0.75; a += 0.25) {
    ctx.beginPath();
    ctx.moveTo(0, ry * 0.20);
    ctx.lineTo(a * rx * 0.82, ry * 0.42);
    ctx.stroke();
  }

  // 2. 버섯 갓 상단 돔 (Upper Cap Dome)
  const capGrad = ctx.createLinearGradient(-rx, -ry * 0.9, rx, ry * 0.3);
  capGrad.addColorStop(0.00, "#FB7185"); // 상단 하이라이트 핑크레드
  capGrad.addColorStop(0.35, "#E11D48"); // 선명한 메인 버섯 레드
  capGrad.addColorStop(0.80, "#BE123C"); // 몸체 레드
  capGrad.addColorStop(1.00, "#881337"); // 하단 음영 딥와인
  ctx.fillStyle = capGrad;
  ctx.strokeStyle = "#4C0519";
  ctx.lineWidth = 1.3;

  ctx.beginPath();
  ctx.moveTo(-rx, ry * 0.20);
  ctx.bezierCurveTo(-rx * 0.95, -ry * 0.95, rx * 0.95, -ry * 0.95, rx, ry * 0.20);
  ctx.bezierCurveTo(rx * 0.60, ry * 0.36, -rx * 0.60, ry * 0.36, -rx, ry * 0.20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. 갓 위 입체 순백 점박이 도트 무늬 (Mushroom White Spots)
  ctx.fillStyle = "#FFFFFF";

  // 중앙 큰 점
  ctx.beginPath();
  ctx.ellipse(0, -ry * 0.36, rx * 0.22, ry * 0.20, 0, 0, Math.PI * 2);
  ctx.fill();

  // 좌측 점
  ctx.beginPath();
  ctx.ellipse(-rx * 0.48, -ry * 0.16, rx * 0.17, ry * 0.15, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // 우측 점
  ctx.beginPath();
  ctx.ellipse(rx * 0.48, -ry * 0.16, rx * 0.17, ry * 0.15, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // 상단 미니 점
  ctx.beginPath();
  ctx.arc(-rx * 0.16, -ry * 0.68, rx * 0.10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 대상 머리 위 버섯 갓 파열 시 사방으로 튀어나가는 12방향 포자 펠릿
 */
export interface SporeBurstShard {
  angle: number;
  maxDist: number;
  size: number;
  color: string;
}

export const SPORE_BURST_SHARDS: SporeBurstShard[] = [
  { angle: 0, maxDist: 34, size: 4.0, color: "#FACC15" },
  { angle: Math.PI / 6, maxDist: 30, size: 3.5, color: "#FEF08A" },
  { angle: Math.PI / 3, maxDist: 36, size: 4.2, color: "#FDE047" },
  { angle: Math.PI / 2, maxDist: 28, size: 3.8, color: "#A3E635" },
  { angle: (2 * Math.PI) / 3, maxDist: 35, size: 4.2, color: "#FEF08A" },
  { angle: (5 * Math.PI) / 6, maxDist: 32, size: 3.6, color: "#FACC15" },
  { angle: Math.PI, maxDist: 34, size: 4.0, color: "#FDE047" },
  { angle: (7 * Math.PI) / 6, maxDist: 31, size: 3.4, color: "#FEF08A" },
  { angle: (4 * Math.PI) / 3, maxDist: 36, size: 4.0, color: "#A3E635" },
  { angle: (3 * Math.PI) / 2, maxDist: 38, size: 4.5, color: "#FACC15" }, // 상공으로 강하게 솟구침
  { angle: (5 * Math.PI) / 3, maxDist: 35, size: 3.8, color: "#FEF08A" },
  { angle: (11 * Math.PI) / 6, maxDist: 32, size: 3.6, color: "#FDE047" },
];

/**
 * 살랑살랑 흔들리며 전신으로 쏟아지는 다채로운 황금빛 버섯 포자 가루 입자
 * - 가로 일직선 현상 방지: 입자별 시작 시점(delayT), 체공 시간(duration), 낙하 높이/거리 비동기화
 */
export interface SporeShowerParticle {
  seed: number;
  relX: number;     // 대상 중심 대비 상대 X (-38 ~ +38)
  startY: number;   // 낙하 시작 Y (-68 ~ -25, 유기적 돔 구름 분포)
  fallDist: number; // 낙하 거리 (55 ~ 85px)
  swayFreq: number; // 좌우 살랑거림 진동수
  swayAmp: number;  // 좌우 흔들림 폭
  size: number;     // 알갱이 크기
  color: string;    // 포자 색상
  delayT: number;   // 입자별 낙하 시작 타이밍 (0.00 ~ 0.50 분산)
  duration: number; // 개별 입자의 체공 및 낙하 지속 시간 (0.30 ~ 0.50)
  gravityPow: number; // 부유 가속 지수
}

export const SPORE_SHOWER_PARTICLES: SporeShowerParticle[] = [
  // 1차 웨이브: 초반 낙하 포자들 (delayT: 0.00 ~ 0.08, 최대 0.38에 바닥 소멸)
  { seed: 1.1, relX: -4, startY: -58, fallDist: 72, swayFreq: 3.2, swayAmp: 7, size: 2.9, color: "#FACC15", delayT: 0.00, duration: 0.32, gravityPow: 1.2 },
  { seed: 2.3, relX: 12, startY: -48, fallDist: 66, swayFreq: 2.8, swayAmp: 8, size: 2.6, color: "#FEF08A", delayT: 0.02, duration: 0.34, gravityPow: 1.3 },
  { seed: 3.7, relX: -18, startY: -42, fallDist: 68, swayFreq: 3.5, swayAmp: 9, size: 2.4, color: "#FDE047", delayT: 0.04, duration: 0.33, gravityPow: 1.25 },
  { seed: 4.2, relX: 6, startY: -64, fallDist: 78, swayFreq: 3.0, swayAmp: 6, size: 3.1, color: "#EAB308", delayT: 0.03, duration: 0.30, gravityPow: 1.15 },
  { seed: 5.8, relX: -26, startY: -36, fallDist: 62, swayFreq: 2.5, swayAmp: 10, size: 2.1, color: "#A3E635", delayT: 0.06, duration: 0.36, gravityPow: 1.35 },
  { seed: 6.4, relX: 24, startY: -38, fallDist: 64, swayFreq: 3.4, swayAmp: 9, size: 2.2, color: "#FEF08A", delayT: 0.05, duration: 0.35, gravityPow: 1.3 },
  { seed: 7.9, relX: -10, startY: -54, fallDist: 74, swayFreq: 3.8, swayAmp: 7, size: 2.8, color: "#FACC15", delayT: 0.08, duration: 0.31, gravityPow: 1.2 },
  { seed: 8.5, relX: 18, startY: -56, fallDist: 70, swayFreq: 2.7, swayAmp: 8, size: 2.7, color: "#FDE047", delayT: 0.07, duration: 0.32, gravityPow: 1.25 },

  // 2차 웨이브: 중반 쇄도 포자들 (delayT: 0.10 ~ 0.20, 최대 0.54에 바닥 소멸)
  { seed: 9.1, relX: 0, startY: -66, fallDist: 80, swayFreq: 3.1, swayAmp: 6, size: 3.2, color: "#FACC15", delayT: 0.10, duration: 0.30, gravityPow: 1.15 },
  { seed: 10.3, relX: -14, startY: -46, fallDist: 68, swayFreq: 3.6, swayAmp: 8, size: 2.5, color: "#FEF08A", delayT: 0.13, duration: 0.33, gravityPow: 1.3 },
  { seed: 11.7, relX: 15, startY: -60, fallDist: 76, swayFreq: 2.9, swayAmp: 7, size: 2.8, color: "#EAB308", delayT: 0.11, duration: 0.31, gravityPow: 1.2 },
  { seed: 12.2, relX: -32, startY: -32, fallDist: 58, swayFreq: 2.2, swayAmp: 11, size: 1.9, color: "#FDE047", delayT: 0.16, duration: 0.35, gravityPow: 1.4 },
  { seed: 13.9, relX: 30, startY: -34, fallDist: 60, swayFreq: 2.4, swayAmp: 10, size: 2.0, color: "#FEF08A", delayT: 0.15, duration: 0.36, gravityPow: 1.35 },
  { seed: 14.4, relX: -8, startY: -62, fallDist: 78, swayFreq: 3.7, swayAmp: 7, size: 3.0, color: "#FACC15", delayT: 0.18, duration: 0.30, gravityPow: 1.2 },
  { seed: 15.6, relX: 8, startY: -50, fallDist: 72, swayFreq: 3.3, swayAmp: 8, size: 2.7, color: "#A3E635", delayT: 0.17, duration: 0.34, gravityPow: 1.25 },
  { seed: 16.8, relX: -22, startY: -40, fallDist: 66, swayFreq: 2.6, swayAmp: 9, size: 2.3, color: "#FEF08A", delayT: 0.20, duration: 0.34, gravityPow: 1.3 },

  // 3차 웨이브: 후반 잔여 포자들 (delayT: 0.22 ~ 0.36, 최대 0.70에 전원 바닥 소멸)
  { seed: 17.5, relX: 22, startY: -44, fallDist: 68, swayFreq: 3.0, swayAmp: 8, size: 2.4, color: "#FDE047", delayT: 0.22, duration: 0.34, gravityPow: 1.25 },
  { seed: 18.2, relX: -4, startY: -58, fallDist: 74, swayFreq: 3.5, swayAmp: 7, size: 2.8, color: "#FACC15", delayT: 0.25, duration: 0.32, gravityPow: 1.2 },
  { seed: 19.9, relX: 5, startY: -52, fallDist: 70, swayFreq: 3.2, swayAmp: 8, size: 2.6, color: "#FEF08A", delayT: 0.27, duration: 0.33, gravityPow: 1.3 },
  { seed: 20.4, relX: -16, startY: -46, fallDist: 64, swayFreq: 2.8, swayAmp: 9, size: 2.2, color: "#EAB308", delayT: 0.29, duration: 0.34, gravityPow: 1.3 },
  { seed: 21.1, relX: 16, startY: -48, fallDist: 65, swayFreq: 3.4, swayAmp: 8, size: 2.3, color: "#FACC15", delayT: 0.28, duration: 0.33, gravityPow: 1.25 },
  { seed: 22.8, relX: -28, startY: -30, fallDist: 56, swayFreq: 2.1, swayAmp: 11, size: 1.8, color: "#A3E635", delayT: 0.32, duration: 0.36, gravityPow: 1.4 },
  { seed: 23.3, relX: 28, startY: -32, fallDist: 58, swayFreq: 2.3, swayAmp: 10, size: 1.9, color: "#FEF08A", delayT: 0.31, duration: 0.35, gravityPow: 1.35 },
  { seed: 24.7, relX: 0, startY: -60, fallDist: 76, swayFreq: 3.6, swayAmp: 7, size: 2.9, color: "#FDE047", delayT: 0.34, duration: 0.31, gravityPow: 1.2 },
  { seed: 25.0, relX: -10, startY: -42, fallDist: 62, swayFreq: 3.1, swayAmp: 8, size: 2.1, color: "#FACC15", delayT: 0.35, duration: 0.33, gravityPow: 1.3 },
  { seed: 26.5, relX: 10, startY: -44, fallDist: 64, swayFreq: 3.3, swayAmp: 8, size: 2.2, color: "#FEF08A", delayT: 0.36, duration: 0.33, gravityPow: 1.3 },
  { seed: 27.2, relX: -6, startY: -50, fallDist: 68, swayFreq: 3.2, swayAmp: 8, size: 2.5, color: "#FDE047", delayT: 0.35, duration: 0.32, gravityPow: 1.25 },
  { seed: 28.9, relX: 6, startY: -52, fallDist: 68, swayFreq: 3.4, swayAmp: 7, size: 2.4, color: "#FACC15", delayT: 0.36, duration: 0.31, gravityPow: 1.2 },
];

/**
 * 147: 버섯포자 (Spore) Effect Renderer
 *
 * 연출 구성:
 * 1. 시전자 웅크림 후 귀여운 버섯 갓 포자체(Mushroom Spore Cap) 완만 포물선 도약 비행 & 황금빛 포자 꼬리
 * 2. 대상 머리 위 상공 도달 후 '파앙!' 파열 ➔ 360도 12방향 포자 펠릿 + 팽창 충격파 링
 * 3. 28개의 다채로운 황금/연두 포자 가루가 살랑살랑 전신으로 쏟아지는 자욱한 포자 샤워 (Spore Shower)
 * 4. 포자가 체내에 스며들며 대상 졸림 리액션 & 머리 위에서 몽환적으로 떠오르는 3단 Zzz 수면 방울
 */
export function drawSporeEffect(
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
  const { attackerPos, targetPos, isPlayer: isP, isHit } = drawCtx;

  // 시전자 포자 방출 원점 (머리/입가)
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 16 : 10);

  // 대상 중심 및 머리 위 상공 타격점
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isP ? 14 : 10);
  const headY = ty - 28; // 대상 머리 위 포자 파열 중심

  ctx.save();

  // -------------------------------------------------------------
  // 1. 버섯 갓 포자체 포물선 비행 (Mushroom Spore Cap Flight)
  // -------------------------------------------------------------
  const capProg = frame.capFlightProg;
  const capAlpha = frame.capAlpha ?? 1.0;
  if (capProg !== undefined && capProg >= 0 && capProg <= 1.0 && capAlpha > 0.01) {
    const t = Math.max(0, Math.min(1.0, capProg));
    const arcHeight = 44; // 상공으로 도약하는 포물선 정점 높이
    const arcY = -Math.sin(t * Math.PI) * arcHeight;

    const curX = ax + (tx - ax) * t;
    const curY = ay + (headY - ay) * t + arcY;

    // 비행 중 통통 튀는 회전 및 펄스 호흡
    const rot = Math.sin(t * Math.PI * 2.5) * 0.22;
    const pulseScale = 1.0 + 0.14 * Math.sin(t * Math.PI * 4);
    const capSize = 17 * pulseScale;

    // 비행 궤적 뒤편 흩날리는 미세 황금 포자 잔상 (Spore Dust Trail)
    if (t > 0.10) {
      const trailCount = 5;
      for (let i = 1; i <= trailCount; i++) {
        const trailT = Math.max(0, t - i * 0.04);
        const trArcY = -Math.sin(trailT * Math.PI) * arcHeight;
        const trX = ax + (tx - ax) * trailT + Math.sin(trailT * 10 + i) * 4;
        const trY = ay + (headY - ay) * trailT + trArcY + i * 2;
        const trAlpha = (1.0 - i / (trailCount + 1)) * 0.70 * capAlpha;

        ctx.fillStyle = i % 2 === 0 ? "#FACC15" : "#FEF08A";
        ctx.globalAlpha = trAlpha;
        ctx.beginPath();
        ctx.arc(trX, trY, Math.max(1.0, 2.8 - i * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 버섯 갓 본체 렌더링
    drawMushroomSporeCap(ctx, curX, curY, capSize, rot, capAlpha);
  }

  // -------------------------------------------------------------
  // 2. 버섯 갓 파열 & 360도 12방향 포자 펠릿 확산 (Spore Burst)
  // -------------------------------------------------------------
  const burstProg = frame.burstProg;
  if (burstProg !== undefined && burstProg > 0 && burstProg <= 1.0 && isHit !== false) {
    const t = Math.max(0, Math.min(1.0, burstProg));
    const burstAlpha = t < 0.65 ? 1.0 : Math.max(0, (1.0 - t) / 0.35);

    // 2-1. 황금 팽창 충격파 링 (Burst Ring)
    const ringR = 10 + t * 36;
    ctx.save();
    ctx.strokeStyle = `rgba(250, 204, 21, ${(burstAlpha * 0.85).toFixed(3)})`;
    ctx.lineWidth = Math.max(1.2, 2.5 * (1.0 - t));
    ctx.beginPath();
    ctx.ellipse(tx, headY, ringR, ringR * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${(burstAlpha * 0.60).toFixed(3)})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(tx, headY, ringR * 0.75, ringR * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2-2. 12방향 포자 펠릿 방사상 팽창
    const easeDist = Math.sin(t * Math.PI * 0.5);
    for (const shard of SPORE_BURST_SHARDS) {
      const curDist = shard.maxDist * easeDist;
      const sx = tx + Math.cos(shard.angle) * curDist;
      const sy = headY + Math.sin(shard.angle) * curDist * 0.65; // 쿼터뷰 타원 투영

      const curSize = Math.max(1.0, shard.size * (1.0 - t * 0.40));
      ctx.save();
      ctx.globalAlpha = burstAlpha;
      ctx.fillStyle = shard.color;
      ctx.beginPath();
      ctx.arc(sx, sy, curSize, 0, Math.PI * 2);
      ctx.fill();

      // 밝은 코어 하이라이트
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(sx - curSize * 0.3, sy - curSize * 0.3, curSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // 3. 자욱한 버섯 포자 샤워 & 안개 구름 (Spore Dust Shower & Mist)
  // -------------------------------------------------------------
  const showerProg = frame.sporeShowerProg;
  if (showerProg !== undefined && showerProg > 0 && showerProg <= 1.0 && isHit !== false) {
    const st = Math.max(0, Math.min(1.0, showerProg));
    const mistFade = frame.sporeMistFade ?? (st < 0.70 ? 1.0 : Math.max(0, (1.0 - st) / 0.30));

    // 3-1. 대상 주변 은은한 황금/올리브 포자 안개 구름 (Spore Mist Cloud)
    if (mistFade > 0.01) {
      ctx.save();
      const mistGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 46);
      mistGrad.addColorStop(0.00, `rgba(250, 204, 21, ${(0.32 * mistFade).toFixed(3)})`);
      mistGrad.addColorStop(0.45, `rgba(234, 179, 8, ${(0.20 * mistFade).toFixed(3)})`);
      mistGrad.addColorStop(0.80, `rgba(163, 230, 53, ${(0.10 * mistFade).toFixed(3)})`);
      mistGrad.addColorStop(1.00, "rgba(202, 138, 4, 0.0)");
      ctx.fillStyle = mistGrad;
      ctx.beginPath();
      ctx.ellipse(tx, ty + 2, 48, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3-2. 다채로운 포자 가루 비동기 낙하 (떨어지면서 스르륵 페이드아웃)
    if (st < 0.75) {
      // 샤워 후반부 전체 글로벌 페이드아웃 (0.50~0.75 구간 부드러운 소산)
      const globalFade = st < 0.45 ? 1.0 : Math.max(0, (0.75 - st) / 0.30);

      for (const p of SPORE_SHOWER_PARTICLES) {
        const elapsed = st - p.delayT;
        if (elapsed <= 0) continue;
        const localT = elapsed / p.duration;
        if (localT > 1.0) continue;

        // 부유 가속 곡선 (자연스러운 체공 및 낙하)
        const easeT = Math.pow(localT, p.gravityPow);
        // 좌우 살랑살랑 부드러운 사인파 흔들림
        const sway = Math.sin(localT * Math.PI * p.swayFreq + p.seed) * p.swayAmp;
        const px = tx + p.relX + sway;
        const py = ty + p.startY + p.fallDist * easeT;

        // [떨어지면서 페이드아웃]: 상공 출현 후 아래로 떨어질수록 점진적으로 스르륵 투명화
        const fadeIn = Math.min(1.0, localT / 0.15);
        const fadeOut = Math.pow(Math.max(0, 1.0 - (localT - 0.15) / 0.85), 1.25);
        const pAlpha = fadeIn * fadeOut * globalFade;
        if (pAlpha <= 0.01) continue;

        // 떨어지면서 입자 크기도 부드럽게 줄어들어 녹아내리는 느낌 부여
        const curSize = Math.max(0.8, p.size * (1.0 - localT * 0.35));

        ctx.save();
        ctx.globalAlpha = pAlpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, curSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // -------------------------------------------------------------
  // 4. 수면 Zzz 방울 & 몽환적 슬립 스파클 (Deep Sleep Zzz & Sparkles)
  // -------------------------------------------------------------
  const sleepProg = frame.sleepProgress;
  const sleepAlpha = frame.sleepAlpha ?? 1.0;
  if (sleepProg !== undefined && sleepProg > 0 && sleepAlpha > 0.01 && isHit !== false) {
    // 4-1. 머리 위 피어오르는 Zzz 방울
    drawSleepZzz(ctx, tx + 6, headY - 4, sleepProg, sleepAlpha);
  }

  // -------------------------------------------------------------
  // 5. 빗나갔을 때 바닥 포자 푸슉 소산 (Miss Effect)
  // -------------------------------------------------------------
  if (isHit === false && frame.missPuffProg !== undefined && frame.missPuffProg > 0) {
    const mp = Math.min(1.0, frame.missPuffProg);
    const mAlpha = Math.max(0, 1.0 - mp);
    const puffR = 12 + mp * 18;

    ctx.save();
    ctx.globalAlpha = mAlpha * 0.65;
    ctx.fillStyle = "#EAB308";
    ctx.beginPath();
    ctx.ellipse(tx + 22, ty + 16, puffR, puffR * 0.40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 148: 플래시 (Flash)
// ============================================================================

/**
 * 🌌 플래시 암전 오버레이 (Flash Darkness Dim Overlay)
 * - 칠흑 같은 어둠으로 전장 전체를 덮어 암전 분위기 연출
 */
export function drawFlashDarkOverlay(ctx: any, alpha: number) {
  if (alpha <= 0.005) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = "rgba(4, 5, 10, 1.0)";
  ctx.fillRect(-6000, -6000, 14000, 14000);
  ctx.restore();
}

/**
 * ⚡ 플래시 순백 오버레이 (Full-Screen Pure Whiteout Overlay)
 * - 화면 전체를 완전한 순백색으로 채우고 부드럽게 페이드아웃
 */
export function drawFlashWhiteOverlay(ctx: any, alpha: number) {
  if (alpha <= 0.005) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(-6000, -6000, 14000, 14000);
  ctx.restore();
}

/**
 * ✨ 시전포켓몬 1프레임 번쩍 섬광 (Caster Flash 1-Frame Burst)
 * - [유저 피드백 완벽 반영]: 플래시의 모든 이펙트는 100% 순백색(Pure White)으로만 렌더링
 * - 시전자 위치(cx, cy)에서 단 1프레임 동안 강렬하게 터져나오는 눈부신 순백의 섬광
 * - 1. 순백 방사형 코어 글로우 (중심 100% 흰색 -> 외곽 투명 순백 그라데이션)
 * - 2. 8방향 날카로운 순백 스타버스트 플레어 (4방향 주 광선 + 4방향 보조 광선)
 * - 3. 360도 16갈래 순백 방사형 레이저 스파크 니들 (Radiant Spark Needles)
 * - 4. 2중 순백 충격파 링 (안쪽 투명, 바깥쪽 흰색)
 */
export function drawFlashCasterBurst(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0
) {
  ctx.save();

  // 1. 중심 핀포인트 순백 코어 글로우 (Nuclear Core Glow)
  // [유저 요구사항]: 링 안쪽의 투명함을 살리기 위해 코어 반경을 컴팩트하게 집중
  const coreR = 24 * scale;
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  coreGrad.addColorStop(0.00, "rgba(255, 255, 255, 1.0)");
  coreGrad.addColorStop(0.40, "rgba(255, 255, 255, 0.85)");
  coreGrad.addColorStop(0.75, "rgba(255, 255, 255, 0.30)");
  coreGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 2중 충격파 링: "링들 안쪽은 투명 바깥은 색깔인 형태"
  // [유저 요구사항 완벽 반영]: 링 안쪽은 완전 투명(0%), 바깥쪽으로 갈수록 흰색이 진해지며 외곽 테두리 림 맺힘
  
  // (1) 내측 링 (반경 18px ~ 44px)
  const r1Inner = 18 * scale;
  const r1Outer = 44 * scale;
  const r1Grad = ctx.createRadialGradient(cx, cy, r1Inner, cx, cy, r1Outer);
  r1Grad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
  r1Grad.addColorStop(0.40, "rgba(255, 255, 255, 0.08)");
  r1Grad.addColorStop(0.75, "rgba(255, 255, 255, 0.35)");
  r1Grad.addColorStop(1.00, "rgba(255, 255, 255, 0.85)");
  ctx.fillStyle = r1Grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r1Outer, 0, Math.PI * 2);
  ctx.fill();

  // 내측 링 외곽 흰색 림 (선명한 바깥 테두리)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 2.2 * scale;
  ctx.beginPath();
  ctx.arc(cx, cy, r1Outer, 0, Math.PI * 2);
  ctx.stroke();

  // (2) 외측 링 (반경 44px ~ 72px)
  const r2Inner = 44 * scale;
  const r2Outer = 72 * scale;
  const r2Grad = ctx.createRadialGradient(cx, cy, r2Inner, cx, cy, r2Outer);
  r2Grad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
  r2Grad.addColorStop(0.40, "rgba(255, 255, 255, 0.06)");
  r2Grad.addColorStop(0.75, "rgba(255, 255, 255, 0.25)");
  r2Grad.addColorStop(1.00, "rgba(255, 255, 255, 0.70)");
  ctx.fillStyle = r2Grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r2Outer, 0, Math.PI * 2);
  ctx.fill();

  // 외측 링 외곽 흰색 림 (선명한 바깥 테두리)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.80)";
  ctx.lineWidth = 1.6 * scale;
  ctx.beginPath();
  ctx.arc(cx, cy, r2Outer, 0, Math.PI * 2);
  ctx.stroke();

  // 3. 8방향 순백 스타버스트 플레어 (8-Pointed Pure White Flash Starburst Flares)
  // (1) 주 십자 광선 (가로/세로 - 십자선은 쨍하고 선명하게 유지)
  const mainRayLenX = 180 * scale;
  const mainRayLenY = 145 * scale;
  const mainRayWidth = 14 * scale;

  // 가로 주 광선
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(cx - mainRayLenX, cy);
  ctx.lineTo(cx, cy - mainRayWidth);
  ctx.lineTo(cx + mainRayLenX, cy);
  ctx.lineTo(cx, cy + mainRayWidth);
  ctx.closePath();
  ctx.fill();

  // 세로 주 광선
  ctx.beginPath();
  ctx.moveTo(cx, cy - mainRayLenY);
  ctx.lineTo(cx + mainRayWidth, cy);
  ctx.lineTo(cx, cy + mainRayLenY);
  ctx.lineTo(cx - mainRayWidth, cy);
  ctx.closePath();
  ctx.fill();

  // 주 광선 순백색 림 오버레이
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  const subWidth = mainRayWidth * 0.55;
  ctx.beginPath();
  ctx.moveTo(cx - mainRayLenX * 0.75, cy);
  ctx.lineTo(cx, cy - subWidth);
  ctx.lineTo(cx + mainRayLenX * 0.75, cy);
  ctx.lineTo(cx, cy + subWidth);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy - mainRayLenY * 0.75);
  ctx.lineTo(cx + subWidth, cy);
  ctx.lineTo(cx, cy + mainRayLenY * 0.75);
  ctx.lineTo(cx - subWidth, cy);
  ctx.closePath();
  ctx.fill();

  // (2) 대각선 4방향 보조 광선 (45도, 135도, 225도, 315도)
  const diagRayLen = 95 * scale;
  const diagRayWidth = 9 * scale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);

  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  ctx.moveTo(-diagRayLen, 0);
  ctx.lineTo(0, -diagRayWidth);
  ctx.lineTo(diagRayLen, 0);
  ctx.lineTo(0, diagRayWidth);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -diagRayLen);
  ctx.lineTo(diagRayWidth, 0);
  ctx.lineTo(0, diagRayLen);
  ctx.lineTo(-diagRayWidth, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. 16갈래 순백 방사형 레이저 스파크 직선들 (Radiant Spark Needles)
  // [유저 요구사항 완벽 반영]: "직선들 (십자선제외하고) 바깥쪽 투명하게"
  // 시작점(안쪽)은 선명한 순백색 -> 바깥쪽 끝으로 갈수록 완전히 투명하게 페이드아웃
  const sparkCount = 16;
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < sparkCount; i++) {
    const angle = (i * Math.PI * 2) / sparkCount + 0.12;
    const len = (i % 2 === 0 ? 120 : 70) * (0.85 + 0.3 * Math.sin(i * 1.7)) * scale;
    const startR = 14 * scale;

    const x1 = Math.cos(angle) * startR;
    const y1 = Math.sin(angle) * startR;
    const x2 = Math.cos(angle) * len;
    const y2 = Math.sin(angle) * len;

    // 선형 그라데이션: 안쪽(시작)은 불투명 흰색, 바깥쪽(끝)은 100% 완전 투명
    const lineGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    lineGrad.addColorStop(0.00, (i % 2 === 0) ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.80)");
    lineGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.65)");
    lineGrad.addColorStop(0.70, "rgba(255, 255, 255, 0.25)");
    lineGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.00)"); // 바깥쪽 투명!

    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = (i % 2 === 0 ? 2.2 : 1.4) * scale;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();

  // 중심 핀포인트 초고광도 코어 (Pure White Core)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 148: 플래시 (Flash) Effect Renderer
 *
 * [유저 요구사항 100% 반영]:
 * > 암전 > 시전포켓몬에게서 번쩍 1프레임 > 전체 흰색 > 흰색이 페이드아웃
 *
 * 1. 암전: 전장이 어두워지는 짙은 어둠 오버레이 (frame.darkAlpha)
 * 2. 시전포켓몬에게서 번쩍 1프레임: 시전자 중심 폭발적 섬광 발광 (frame.casterFlash)
 * 3. 전체 흰색: 화면 전체 순백 화이트아웃 100% (frame.whiteAlpha = 1.0)
 * 4. 흰색이 페이드아웃: 점진적으로 흰색이 걷히며 배틀 화면 복귀 (frame.whiteAlpha 감소)
 */
export function drawFlashEffect(
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
  if (frame.showEffect === false && !frame.casterFlash && !frame.darkAlpha && !frame.whiteAlpha) {
    return;
  }

  const { isPlayer: isP } = drawCtx;

  // 시전자 위치 (오프셋 반영)
  const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
  const cx = casterPos.x;
  const cy = casterPos.y - (isP ? 10 : 8);

  ctx.save();

  // 1. 암전 오버레이 (frame.darkAlpha)
  const darkAlpha = frame.darkAlpha ?? 0;
  if (darkAlpha > 0.005) {
    drawFlashDarkOverlay(ctx, darkAlpha);
  }

  // 2. 시전포켓몬에게서 번쩍 1프레임 (frame.casterFlash)
  if (frame.casterFlash) {
    const burstScale = frame.flashScale ?? 1.15;
    drawFlashCasterBurst(ctx, cx, cy, burstScale);
  }

  // 3. 전체 흰색 및 페이드아웃 오버레이 (frame.whiteAlpha)
  const whiteAlpha = frame.whiteAlpha ?? 0;
  if (whiteAlpha > 0.005) {
    drawFlashWhiteOverlay(ctx, whiteAlpha);
  }

  ctx.restore();
}


