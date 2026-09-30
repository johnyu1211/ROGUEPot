import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";

/**
 * Gen 1 Moves 161 - 164 Renderers
 * 
 * 161: 트라이어택 (Tri Attack)
 * 162: 분노의앞니 (Super Fang)
 * 163: 베어가르기 (Slash)
 * 164: 대타출동 (Substitute) - [예정]
 */

// ============================================================================
// 161: 트라이어택 (Tri Attack)
// ============================================================================

/**
 * 삼원소 팔레트 정의 (빨간색 불꽃, 노란색 불꽃, 파란색 불꽃)
 */
export interface TriElementColorConfig {
  name: "fire" | "electric" | "ice";
  coreColor: string;
  midColor: string;
  darkColor: string;
  haloColor: string;
  trailColor: string;
  sparkColor: string;
}

export const TRI_ELEMENTS: TriElementColorConfig[] = [
  // 0: 파란색 불꽃 (얼음 / 빙결 원소)
  {
    name: "ice",
    coreColor: "#FFFFFF",
    midColor: "#38BDF8",
    darkColor: "#0284C7",
    haloColor: "rgba(56, 189, 248, 0.35)",
    trailColor: "rgba(14, 165, 233, 0.8)",
    sparkColor: "#BAE6FD",
  },
  // 1: 노란색 불꽃 (전기 / 마비 원소)
  {
    name: "electric",
    coreColor: "#FFFFFF",
    midColor: "#FACC15",
    darkColor: "#CA8A04",
    haloColor: "rgba(250, 204, 21, 0.35)",
    trailColor: "rgba(234, 179, 8, 0.8)",
    sparkColor: "#FEF08A",
  },
  // 2: 빨간색 불꽃 (불꽃 / 화상 원소)
  {
    name: "fire",
    coreColor: "#FFFFFF",
    midColor: "#F97316",
    darkColor: "#EF4444",
    haloColor: "rgba(239, 68, 68, 0.35)",
    trailColor: "rgba(220, 38, 38, 0.8)",
    sparkColor: "#FEE2E2",
  },
];

/**
 * 🌌 암전 오버레이 렌더러 (Darkness Dim Overlay)
 * - 전장 전체를 칠흑 같은 어둠으로 덮어 삼색 불꽃의 발광을 극대화
 */
export function drawTriDarkOverlay(ctx: any, alpha: number) {
  if (alpha <= 0.005) return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.92, Math.max(0, alpha));
  ctx.fillStyle = "rgba(6, 8, 16, 1.0)";
  ctx.fillRect(-6000, -6000, 14000, 14000);
  ctx.restore();
}

/**
 * 3D 타원 궤도 좌표 계산 헬퍼
 * @param theta 궤도 각도 (라디안)
 * @param cx 궤도 중심 X
 * @param cy 궤도 중심 Y
 * @param rx 수평 반경
 * @param ry 수직 반경 (원근 압축)
 * @param tiltX 궤도 경사 각도
 */
export function getTriOrbitPoint(
  theta: number,
  cx: number,
  cy: number,
  rx: number = 70,
  ry: number = 32,
  tiltAngle: number = -0.28
) {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  // 기본 2.5D 타원
  const rawX = rx * cosT;
  const rawY = ry * sinT;

  // 경사 각도 회전 적용 (스탠딩 입체감)
  const cosTilt = Math.cos(tiltAngle);
  const sinTilt = Math.sin(tiltAngle);

  const x = cx + rawX * cosTilt - rawY * sinTilt;
  const y = cy + rawX * sinTilt + rawY * cosTilt;
  // z > 0: 화면 전면 (카메라 앞), z < 0: 화면 후면 (포켓몬 뒤)
  const z = sinT;

  return { x, y, z };
}

/**
 * 🔥 3D 삼원소 불꽃 렌더러 (점차 길어지는 유기적 화염 꼬리 + 다엽형 화염 헤드)
 * - user request: "3차원으로 파란색 불꽃, 노란색불꽃, 빨간색뿔꽃이 (처음에는 짧게 생겼다가 점차 길어짐)"
 * - 회전 궤도 원 반경: rx = 70, ry = 32 (연기 자체 크기는 유지하고 원의 공전 범위만 확장)
 * @param lengthFactor 0.15 (초기 아주 짧음) ~ 1.0 (최대 길이로 신장)
 * @param isBehindLayer true인 경우 z < -0.05인 후면만 렌더, false인 경우 z >= -0.05인 전면만 렌더
 */
export function drawTriElementalFlame3D(
  ctx: any,
  elem: TriElementColorConfig,
  currentTheta: number,
  cx: number,
  cy: number,
  lengthFactor: number,
  globalAlpha: number,
  isBehindLayer: boolean,
  rx: number = 70,
  ry: number = 32
) {
  if (globalAlpha <= 0.01) return;

  const tilt = -0.28;

  const headPos = getTriOrbitPoint(currentTheta, cx, cy, rx, ry, tilt);

  // z-culling: 뒤 레이어는 z < -0.05만, 앞 레이어는 z >= -0.05만 렌더
  const isCurrentlyBehind = headPos.z < -0.05;
  if (isBehindLayer !== isCurrentlyBehind) return;

  // 3D 깊이 스케일 및 밝기 보정
  const depthNorm = (headPos.z + 1.0) / 2.0; // 0.0 (가장 먼 곳) ~ 1.0 (가장 가까운 곳)
  const depthScale = 0.78 + 0.44 * depthNorm; // 0.78x ~ 1.22x
  const depthAlpha = Math.min(1.0, (0.75 + 0.25 * depthNorm) * globalAlpha);

  ctx.save();
  ctx.globalAlpha = depthAlpha;

  // -------------------------------------------------------------
  // 1. 점차 길어지는 화염 꼬리 (Elongating Curved Flame Trail)
  // -------------------------------------------------------------
  // lengthFactor (0.12 ~ 1.0)에 따라 뒤로 뻗어나가는 궤도 각도 폭 결정
  const maxTrailSpan = 1.25; // 최대 약 72도에 달하는 롱 테일
  const currentTrailSpan = Math.max(0.15, lengthFactor * maxTrailSpan);
  const SAMPLES = Math.max(8, Math.round(16 * lengthFactor));

  const trailPoints: Array<{ x: number; y: number; r: number; alpha: number }> = [];

  for (let i = 0; i <= SAMPLES; i++) {
    const u = i / SAMPLES; // 0: 헤드 바로 뒤, 1: 꼬리 끝
    // 회전 방향의 반대쪽(뒤쪽)으로 궤도를 따라 샘플링
    const sampleTheta = currentTheta - u * currentTrailSpan;
    const pt = getTriOrbitPoint(sampleTheta, cx, cy, rx, ry, tilt);

    // 꼬리 끝으로 갈수록 가늘어지고 투명해짐
    const r = (11 * (1.0 - u * 0.78)) * depthScale;
    const a = Math.pow(1.0 - u, 1.4);

    trailPoints.push({ x: pt.x, y: pt.y, r, alpha: a });
  }

  // 꼬리 리본 패스 드로잉 (외곽 그라데이션)
  if (trailPoints.length >= 2) {
    ctx.save();
    for (let i = 0; i < trailPoints.length - 1; i++) {
      const p1 = trailPoints[i];
      const p2 = trailPoints[i + 1];
      const segAlpha = p1.alpha * depthAlpha;
      if (segAlpha <= 0.01) continue;

      ctx.strokeStyle = elem.midColor;
      ctx.lineWidth = Math.max(1.5, p1.r * 1.6);
      ctx.lineCap = "round";
      ctx.globalAlpha = segAlpha * 0.75;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // 내부 중심 코어 밝은 선 (앞쪽 50% 구간)
      if (i < trailPoints.length * 0.55) {
        ctx.strokeStyle = elem.coreColor;
        ctx.lineWidth = Math.max(1.0, p1.r * 0.8);
        ctx.globalAlpha = segAlpha * 0.95;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // -------------------------------------------------------------
  // 2. 다엽형 화염 헤드 (Billowing Multi-Lobed Flame Head)
  // -------------------------------------------------------------
  const headRadius = (10 + 3.0 * lengthFactor) * depthScale;

  // 2-1. 외곽 부드러운 발광 헤일로
  const haloGrad = ctx.createRadialGradient(
    headPos.x, headPos.y, 0,
    headPos.x, headPos.y, headRadius * 2.2
  );
  haloGrad.addColorStop(0.0, elem.haloColor);
  haloGrad.addColorStop(0.6, elem.haloColor.replace("0.35", "0.15"));
  haloGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(headPos.x, headPos.y, headRadius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // 2-2. 4개의 유기적 로브로 타오르는 불꽃 덩어리
  const LOBES = 4;
  for (let l = 0; l < LOBES; l++) {
    const lobeAngle = currentTheta * 1.5 + (l / LOBES) * Math.PI * 2;
    const lobeDist = headRadius * 0.32;
    const lx = headPos.x + Math.cos(lobeAngle) * lobeDist;
    const ly = headPos.y + Math.sin(lobeAngle) * lobeDist;
    const lr = headRadius * 0.65;

    const lobeGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
    lobeGrad.addColorStop(0.0, elem.midColor);
    lobeGrad.addColorStop(0.65, elem.darkColor);
    lobeGrad.addColorStop(1.0, "rgba(0,0,0,0)");

    ctx.fillStyle = lobeGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2-3. 중심부 초고열 순백-원소색 코어
  const coreR = headRadius * 0.52;
  const coreGrad = ctx.createRadialGradient(
    headPos.x - coreR * 0.25, headPos.y - coreR * 0.25, 0,
    headPos.x, headPos.y, coreR
  );
  coreGrad.addColorStop(0.0, elem.coreColor);
  coreGrad.addColorStop(0.45, elem.midColor);
  coreGrad.addColorStop(1.0, "rgba(255,255,255,0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(headPos.x, headPos.y, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🔮 고에너지 원소 알갱이 렌더러 (Tri-Element Glowing Bead / Pellet)
 * - user request: "해당 다색 불꽃이 알갱이로 발사됨"
 * - 중심 초고열 순백 핵 + 선명한 원소색 구체 + 외곽 글로우 + 뒤따르는 잔상 비드
 */
export function drawTriBead(
  ctx: any,
  elem: TriElementColorConfig,
  x: number,
  y: number,
  dirX: number,
  dirY: number,
  radius: number = 7.5,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const dist = Math.hypot(dirX, dirY) || 1;
  const nx = dirX / dist;
  const ny = dirY / dist;

  // 1. 발사 방향 반대쪽으로 뒤따르는 미세 알갱이 잔상 (Pellet Motion Tail)
  const TAIL_COUNT = 3;
  for (let i = 1; i <= TAIL_COUNT; i++) {
    const tailDist = i * (radius * 1.5);
    const tx = x - nx * tailDist;
    const ty = y - ny * tailDist;
    const tr = radius * (1.0 - i * 0.28);
    const ta = alpha * (0.65 - i * 0.18);

    if (ta > 0.01 && tr > 0.5) {
      ctx.save();
      ctx.globalAlpha = ta;
      const tGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, tr);
      tGrad.addColorStop(0.0, elem.midColor);
      tGrad.addColorStop(1.0, "rgba(0,0,0,0)");
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 2. 외곽 부드러운 원소 발광 헤일로
  const haloGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.4);
  haloGrad.addColorStop(0.0, elem.haloColor);
  haloGrad.addColorStop(0.7, elem.haloColor.replace("0.35", "0.10"));
  haloGrad.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.4, 0, Math.PI * 2);
  ctx.fill();

  // 3. 메인 알갱이 구체 본체
  const bodyGrad = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, 0,
    x, y, radius
  );
  bodyGrad.addColorStop(0.0, elem.coreColor);
  bodyGrad.addColorStop(0.35, elem.midColor);
  bodyGrad.addColorStop(0.85, elem.darkColor);
  bodyGrad.addColorStop(1.0, elem.midColor);

  // 4. 왼쪽 상단 핀포인트 순백 하이라이트 글린트
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🔮 3원소 투척 구체 & 유기적 꼬리잔상 렌더러 (Tri-Element Thrown Sphere with Flame-like Tail)
 * - user request: "동그라미 3 개 색깔별로 하나씩 던져지게 해줘 (회전하는 거랑 유사한 꼬리잔상)"
 * - 포물선 투척 궤적을 따라 회전 불꽃과 유사한 테이퍼드 리본 꼬리잔상(외곽 원소색 + 중심 순백 코어) 형성
 */
export function drawTriThrownSphere(
  ctx: any,
  elem: TriElementColorConfig,
  launchX: number,
  launchY: number,
  targetX: number,
  targetY: number,
  progress: number, // 0.0 (발사) ~ 1.0 (착탄)
  arcHeight: number = 26,
  radius: number = 10,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress < 0.0) return;

  const getPathPoint = (t: number) => {
    const ct = Math.max(0, Math.min(1.0, t));
    const px = launchX + (targetX - launchX) * ct;
    // - Math.sin(ct * Math.PI) * arcHeight: 솟구쳐 올랐다가 꽂히는 포물선 투척 탄도
    const py = launchY + (targetY - launchY) * ct - Math.sin(ct * Math.PI) * arcHeight;
    return { x: px, y: py };
  };

  const head = getPathPoint(progress);

  // 1. 회전하는 연기/불꽃과 유사한 유기적 꼬리잔상 (Tapering Flame Ribbon Trail)
  const trailSpan = 0.24; // 궤적상의 꼬리 길이 비율
  const SAMPLES = 12;
  const trailPoints: Array<{ x: number; y: number; r: number; alpha: number }> = [];

  for (let i = 0; i <= SAMPLES; i++) {
    const u = i / SAMPLES; // 0: 구체 바로 뒤, 1: 꼬리 끝
    const sampleT = progress - u * trailSpan;
    if (sampleT < -0.05) break;

    const effectiveT = Math.max(0, sampleT);
    const pt = getPathPoint(effectiveT);

    // 발사 초반 꼬리가 자연스럽게 발사점에서 늘어남
    const shrinkFactor = sampleT < 0 ? Math.max(0, 1.0 + sampleT / trailSpan) : 1.0;
    const r = radius * (1.0 - u * 0.82) * shrinkFactor;
    const a = Math.pow(1.0 - u, 1.3) * shrinkFactor * alpha;

    trailPoints.push({ x: pt.x, y: pt.y, r, alpha: a });
  }

  // 꼬리 리본 패스 드로잉
  if (trailPoints.length >= 2) {
    ctx.save();
    for (let i = 0; i < trailPoints.length - 1; i++) {
      const p1 = trailPoints[i];
      const p2 = trailPoints[i + 1];
      const segAlpha = p1.alpha;
      if (segAlpha <= 0.01) continue;

      // 외곽 원소 색상 리본 (회전 불꽃과 동일한 라운드 캡 & 그라데이션 광채)
      ctx.strokeStyle = elem.midColor;
      ctx.lineWidth = Math.max(1.5, p1.r * 1.8);
      ctx.lineCap = "round";
      ctx.globalAlpha = segAlpha * 0.8;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // 내부 중심 코어 순백 발광 선 (앞쪽 60% 구간)
      if (i < trailPoints.length * 0.6) {
        ctx.strokeStyle = elem.coreColor;
        ctx.lineWidth = Math.max(1.0, p1.r * 0.85);
        ctx.lineCap = "round";
        ctx.globalAlpha = segAlpha * 0.95;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 2. 동그라미 구체 본체 렌더링
  ctx.save();
  ctx.globalAlpha = alpha;

  // 2-1. 외곽 강화된 원소 발광 글로우 (광역 소프트 블룸 + 밀착 인텐스 코로나)
  // A. 외곽 광역 소프트 글로우 (Outer Ambient Bloom)
  const outerHalo = ctx.createRadialGradient(
    head.x, head.y, radius * 0.5,
    head.x, head.y, radius * 3.0
  );
  outerHalo.addColorStop(0.0, elem.haloColor.replace("0.35", "0.65"));
  outerHalo.addColorStop(0.45, elem.haloColor.replace("0.35", "0.28"));
  outerHalo.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = outerHalo;
  ctx.beginPath();
  ctx.arc(head.x, head.y, radius * 3.0, 0, Math.PI * 2);
  ctx.fill();

  // B. 구체 외곽 밀착 인텐스 코로나 (Inner Intense Corona)
  const innerHalo = ctx.createRadialGradient(
    head.x, head.y, radius * 0.8,
    head.x, head.y, radius * 1.85
  );
  innerHalo.addColorStop(0.0, elem.midColor);
  innerHalo.addColorStop(0.55, elem.haloColor.replace("0.35", "0.80"));
  innerHalo.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = innerHalo;
  ctx.beginPath();
  ctx.arc(head.x, head.y, radius * 1.85, 0, Math.PI * 2);
  ctx.fill();

  // 2-2. 원소 구체 본체 - 외곽 그라데이션 투명화 (Soft-edged Luminous Elemental Sphere)
  // 딱딱한 원형 테두리를 제거하고 외곽이 100% 투명하게 페이드아웃되도록 그라데이션 적용
  const sphereR = radius * 1.25;
  const bodyGrad = ctx.createRadialGradient(
    head.x, head.y, 0,
    head.x, head.y, sphereR
  );
  // 중심부는 하이라이트 없이 선명하고 깊은 순수 원소 발색
  bodyGrad.addColorStop(0.0, elem.midColor);
  bodyGrad.addColorStop(0.40, elem.midColor);
  // 외곽으로 갈수록 부드러운 투명도 감쇄 (딱딱한 칼선/외곽선 완전 제거)
  bodyGrad.addColorStop(0.70, elem.haloColor.replace("0.35", "0.75"));
  bodyGrad.addColorStop(0.88, elem.haloColor.replace("0.35", "0.25"));
  bodyGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)"); // 외곽 100% 완전 투명

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(head.x, head.y, sphereR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 💥 피격 대상 원소 착탄 파쇄/폭발 효과 렌더러
 * - user request:
 *   1. 화염: 화염방사/불대문자 기술 참고하여 뭉게뭉게 퍼지는 다엽형 화염 가스 구름 (투명 그라데이션 적용)
 *   2. 전기: 번개/10만볼트 참고하여 강력한 다층 뇌격 낙뢰 + 대상 전신 관통 지그재그 방전 아크
 *   3. 얼음: 대상 포켓몬 위에 직접 크고 날카로운 입체 다각면 얼음 조각(크리스탈 샤드)들이 결빙/파쇄
 */
export function drawTriImpactBurst(
  ctx: any,
  elem: TriElementColorConfig,
  tx: number,
  ty: number,
  burstProgress: number, // 0.0 ~ 1.0
  alpha: number = 1.0
) {
  if (burstProgress <= 0 || burstProgress >= 1.0 || alpha <= 0.01) return;

  const t = burstProgress;
  const easeOut = Math.sin(t * Math.PI * 0.5);
  const fadeAlpha = Math.max(0, 1.0 - t) * alpha;

  ctx.save();
  ctx.globalAlpha = fadeAlpha;

  // =========================================================================
  // 1. 🔥 화염 (Fire) - 외곽 완전 투명화로 구체 경계를 제거한 유기적 화염 폭발
  // =========================================================================
  if (elem.name === "fire") {
    // 1-1. 중심부 고열 열기 아우라 (외곽 완전 투명 페이드아웃)
    const centerR = (22 + easeOut * 32);
    const centerGrad = ctx.createRadialGradient(tx, ty - 6, 0, tx, ty - 6, centerR);
    centerGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    centerGrad.addColorStop(0.18, "rgba(254, 240, 138, 0.80)");
    centerGrad.addColorStop(0.42, "rgba(249, 115, 22, 0.50)");
    centerGrad.addColorStop(0.68, "rgba(239, 68, 68, 0.20)");
    centerGrad.addColorStop(0.88, "rgba(220, 38, 38, 0.05)");
    centerGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)"); // 외곽 100% 완전 투명

    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(tx, ty - 6, centerR, 0, Math.PI * 2);
    ctx.fill();

    // 1-2. 외곽으로 피어오르는 부드러운 화염 구름 플룸 (외곽 투명화 극대화로 구체 겹침 seam 완전 제거)
    const PUFF_COUNT = 6;
    for (let i = 0; i < PUFF_COUNT; i++) {
      const angle = (i / PUFF_COUNT) * Math.PI * 2 + 0.35;
      const dist = easeOut * (18 + (i % 2) * 8);
      const px = tx + Math.cos(angle) * dist;
      const py = ty - 6 + Math.sin(angle) * dist * 0.68 - (easeOut * 12);
      const pr = (18 + (i % 3) * 6) * (0.8 + easeOut * 0.7);

      const pGrad = ctx.createRadialGradient(px, py, 0, px, py, pr);
      pGrad.addColorStop(0.0, "rgba(254, 240, 138, 0.65)");
      pGrad.addColorStop(0.25, "rgba(249, 115, 22, 0.40)");
      pGrad.addColorStop(0.50, "rgba(239, 68, 68, 0.18)");
      pGrad.addColorStop(0.75, "rgba(220, 38, 38, 0.06)");
      pGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)"); // 외곽 완전 투명

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1-3. 위로 흩날리는 미세 불티 스파크 (Rising Embers)
    for (let s = 0; s < 9; s++) {
      const sAngle = (s / 9) * Math.PI * 2 + s * 1.5;
      const sDist = easeOut * (28 + (s % 4) * 8);
      const sx = tx + Math.cos(sAngle) * sDist;
      const sy = ty - 6 + Math.sin(sAngle) * sDist * 0.65 - (easeOut * 22);
      const sr = Math.max(0.8, 2.2 * (1.0 - t));

      ctx.fillStyle = s % 2 === 0 ? "rgba(255, 255, 255, 0.9)" : "rgba(254, 240, 138, 0.85)";
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // =========================================================================
  // =========================================================================
  // 2. ⚡ 전기 (Electric) - 구체 파열 중심 방전 & 끝부분이 날카롭게 뾰족한 고전압 번개
  // =========================================================================
  else if (elem.name === "electric") {
    // 2-1. 지그재그 포인트 생성 헬퍼
    const makeLightning = (
      x1: number, y1: number, x2: number, y2: number,
      segs: number, jitter: number, seed: number
    ) => {
      const pts = [{ x: x1, y: y1 }];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const ny = dx / dist;
      for (let i = 1; i < segs; i++) {
        const u = i / segs;
        const bx = x1 + dx * u;
        const by = y1 + dy * u;
        const offset = Math.sin(seed + i * 2.7) * jitter * (0.4 + 0.6 * Math.sin(u * Math.PI));
        pts.push({ x: bx + nx * offset, y: by + ny * offset });
      }
      pts.push({ x: x2, y: y2 });
      return pts;
    };

    // 2-2. ⚡ 끝부분이 극도로 날카롭고 뾰족하게 테이퍼링되는 번개 드로잉 (Tapered Sharp Lightning)
    const drawTaperedLightning = (
      points: { x: number; y: number }[],
      baseW: number
    ) => {
      if (points.length < 2) return;
      const N = points.length - 1;

      // A. 외곽 고전압 앰버 오라 (뿌리는 넓고 끝으로 갈수록 날카롭게 감쇄)
      for (let i = 0; i < N; i++) {
        const u = i / N;
        const taper = Math.max(0.10, Math.pow(1.0 - u, 0.82));
        ctx.strokeStyle = "rgba(234, 179, 8, 0.48)";
        ctx.lineWidth = Math.max(0.7, baseW * 3.4 * taper);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }

      // B. 레몬 옐로우 번개 본체
      for (let i = 0; i < N; i++) {
        const u = i / N;
        const taper = Math.max(0.08, Math.pow(1.0 - u, 0.85));
        ctx.strokeStyle = "#FDE047";
        ctx.lineWidth = Math.max(0.5, baseW * 1.8 * taper);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }

      // C. 순백 초고압 코어 (루트 중심 ~ 75% 지점까지만 관통, 끝은 날카로운 옐로우 침)
      for (let i = 0; i < N; i++) {
        const u = i / N;
        if (u > 0.75) break;
        const taper = Math.max(0.05, Math.pow(1.0 - u, 0.90));
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = Math.max(0.4, baseW * 0.75 * taper);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }

      // D. 🎯 끝부분 극세 바늘침 삼각형 (Razor Sharp Needle Point Terminator)
      const pLast = points[N];
      const pPrev = points[N - 1];
      const tdx = pLast.x - pPrev.x;
      const tdy = pLast.y - pPrev.y;
      const tLen = Math.hypot(tdx, tdy) || 1;
      const dirX = tdx / tLen;
      const dirY = tdy / tLen;
      const normX = -dirY;
      const normY = dirX;

      const needleLen = Math.max(4.0, 7.5 * (1.0 - t * 0.3));
      const tipX = pLast.x + dirX * needleLen;
      const tipY = pLast.y + dirY * needleLen;

      // 외곽 앰버 바늘 팁
      const auraW = Math.max(1.0, baseW * 0.28);
      ctx.fillStyle = "rgba(234, 179, 8, 0.55)";
      ctx.beginPath();
      ctx.moveTo(pLast.x + normX * auraW, pLast.y + normY * auraW);
      ctx.lineTo(tipX + dirX * 1.5, tipY + dirY * 1.5);
      ctx.lineTo(pLast.x - normX * auraW, pLast.y - normY * auraW);
      ctx.closePath();
      ctx.fill();

      // 본체 레몬 옐로우 날카로운 바늘 팁
      const yellowW = Math.max(0.65, baseW * 0.16);
      ctx.fillStyle = "#FDE047";
      ctx.beginPath();
      ctx.moveTo(pLast.x + normX * yellowW, pLast.y + normY * yellowW);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(pLast.x - normX * yellowW, pLast.y - normY * yellowW);
      ctx.closePath();
      ctx.fill();

      // 내부 순백 초침
      const coreW = Math.max(0.35, baseW * 0.08);
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(pLast.x + normX * coreW, pLast.y + normY * coreW);
      ctx.lineTo(tipX - dirX * 1.2, tipY - dirY * 1.2);
      ctx.lineTo(pLast.x - normX * coreW, pLast.y - normY * coreW);
      ctx.closePath();
      ctx.fill();
    };

    const boltWidth = Math.max(1.2, 3.2 * (1.0 - t * 0.4));
    const spreadScale = 0.82 + easeOut * 0.28;

    // 2-3. 구체 파열 중심에서 사방으로 뻗어 퍼져나가는 고전압 방전 번개
    // (화면 밖으로 나가지 않고 대상 포켓몬 주변에 응축되어 날카롭게 터짐)
    const explosionBolts = [
      // 1) 상단 분출 번개 (화면 밖 나가지 않고 대상 머리 위까지만 짧고 예리하게)
      {
        ex: tx - 6,
        ey: ty - 6 - (28 + easeOut * 6) * spreadScale,
        segs: 6, jit: 10, seed: 1.1 + t * 8, w: 1.2,
        branch: { ex: tx + 14, ey: ty - 26, fromIdx: 3, w: 0.65, seed: 3.5 + t * 8 }
      },
      // 2) 우상단 뇌격
      {
        ex: tx + 34 * spreadScale,
        ey: ty - 6 - 20 * spreadScale,
        segs: 6, jit: 11, seed: 2.4 + t * 8, w: 1.05,
        branch: { ex: tx + 26, ey: ty - 4, fromIdx: 4, w: 0.6, seed: 5.1 + t * 8 }
      },
      // 3) 좌상단 뇌격
      {
        ex: tx - 35 * spreadScale,
        ey: ty - 6 - 14 * spreadScale,
        segs: 6, jit: 12, seed: 4.2 + t * 8, w: 1.05,
        branch: { ex: tx - 24, ey: ty - 26, fromIdx: 3, w: 0.6, seed: 6.8 + t * 8 }
      },
      // 4) 우하단 접지 방전
      {
        ex: tx + 26 * spreadScale,
        ey: ty - 6 + 28 * spreadScale,
        segs: 5, jit: 10, seed: 5.9 + t * 8, w: 0.95
      },
      // 5) 좌하단 접지 방전
      {
        ex: tx - 28 * spreadScale,
        ey: ty - 6 + 26 * spreadScale,
        segs: 5, jit: 10, seed: 7.3 + t * 8, w: 0.95
      },
      // 6) 하단 중심 접지 아크
      {
        ex: tx + 3,
        ey: ty - 6 + 36 * spreadScale,
        segs: 5, jit: 8, seed: 8.7 + t * 8, w: 0.9
      }
    ];

    for (const b of explosionBolts) {
      const pts = makeLightning(tx, ty - 6, b.ex, b.ey, b.segs, b.jit, b.seed);
      drawTaperedLightning(pts, boltWidth * b.w);

      // 날카로운 보조 분기 가지 번개 (Sharp Fork Branch)
      if (b.branch && pts.length > b.branch.fromIdx) {
        const startPt = pts[b.branch.fromIdx];
        const bpts = makeLightning(startPt.x, startPt.y, b.branch.ex, b.branch.ey, 3, 7, b.branch.seed);
        drawTaperedLightning(bpts, boltWidth * b.branch.w);
      }
    }

    // 2-4. 중심점 초고압 플라즈마 플래시 (Central Plasma Contact Bloom)
    const flashR = (16 + easeOut * 24) * (1.0 - t * 0.5);
    const flashGrad = ctx.createRadialGradient(tx, ty - 6, 0, tx, ty - 6, flashR);
    flashGrad.addColorStop(0.0, "#FFFFFF");
    flashGrad.addColorStop(0.40, "#FEF08A");
    flashGrad.addColorStop(0.75, "rgba(250, 204, 21, 0.45)");
    flashGrad.addColorStop(1.0, "rgba(250, 204, 21, 0)");
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(tx, ty - 6, flashR, 0, Math.PI * 2);
    ctx.fill();
  }

  // =========================================================================
  // 3. ❄️ 얼음 (Ice) - 대상 포켓몬 위에 직접 생겨나는 날카로운 입체 다각면 얼음 조각들
  // =========================================================================
  else {
    // 3-1. 냉기 서리 결계 안개 (Cryo Frost Aura)
    const frostR = (22 + easeOut * 32);
    const frostGrad = ctx.createRadialGradient(tx, ty - 10, 0, tx, ty - 10, frostR);
    frostGrad.addColorStop(0.0, "rgba(224, 242, 254, 0.65)");
    frostGrad.addColorStop(0.45, "rgba(56, 189, 248, 0.35)");
    frostGrad.addColorStop(0.85, "rgba(14, 165, 233, 0.12)");
    frostGrad.addColorStop(1.0, "rgba(14, 165, 233, 0.0)");
    ctx.fillStyle = frostGrad;
    ctx.beginPath();
    ctx.arc(tx, ty - 10, frostR, 0, Math.PI * 2);
    ctx.fill();

    // 3-2. 각진 얼음 바위/빙석 렌더러 (Faceted Glacial Ice Rock - 다이아몬드 대신 돌/암석 느낌의 다각면 입체 형태)
    const drawGlacialIceRock = (
      rx: number,
      ry: number,
      variant: number
    ) => {
      if (variant === 0) {
        // [타입 A] 중앙 대형 각진 얼음 바위
        const v = [
          { x: -rx * 0.72, y: -ry * 0.45 },
          { x: -rx * 0.18, y: -ry * 0.95 },
          { x:  rx * 0.65, y: -ry * 0.72 },
          { x:  rx * 0.95, y: -ry * 0.10 },
          { x:  rx * 0.70, y:  ry * 0.78 },
          { x: -rx * 0.20, y:  ry * 0.95 },
          { x: -rx * 0.85, y:  ry * 0.40 },
        ];
        const C = { x: rx * 0.05, y: -ry * 0.15 };

        // 상부 밝은 빙하 면
        ctx.fillStyle = "#F0F9FF";
        ctx.beginPath();
        ctx.moveTo(v[0].x, v[0].y);
        ctx.lineTo(v[1].x, v[1].y);
        ctx.lineTo(v[2].x, v[2].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();

        // 우측 맑은 시안 블루 면
        ctx.fillStyle = "#7DD3FC";
        ctx.beginPath();
        ctx.moveTo(v[2].x, v[2].y);
        ctx.lineTo(v[3].x, v[3].y);
        ctx.lineTo(v[4].x, v[4].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();

        // 하단 짙은 빙결 음영 면
        ctx.fillStyle = "#0284C7";
        ctx.beginPath();
        ctx.moveTo(v[4].x, v[4].y);
        ctx.lineTo(v[5].x, v[5].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();

        // 좌측 중간톤 면
        ctx.fillStyle = "#38BDF8";
        ctx.beginPath();
        ctx.moveTo(v[5].x, v[5].y);
        ctx.lineTo(v[6].x, v[6].y);
        ctx.lineTo(v[0].x, v[0].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();
      } else if (variant === 1) {
        // [타입 B] 날카롭게 깎여나간 절벽형 빙암
        const v = [
          { x: -rx * 0.85, y: -ry * 0.22 },
          { x: -rx * 0.35, y: -ry * 0.92 },
          { x:  rx * 0.48, y: -ry * 0.65 },
          { x:  rx * 0.88, y:  ry * 0.15 },
          { x:  rx * 0.52, y:  ry * 0.85 },
          { x: -rx * 0.42, y:  ry * 0.78 },
        ];
        const C = { x: -rx * 0.08, y: -ry * 0.10 };

        ctx.fillStyle = "#E0F2FE";
        ctx.beginPath();
        ctx.moveTo(v[0].x, v[0].y);
        ctx.lineTo(v[1].x, v[1].y);
        ctx.lineTo(v[2].x, v[2].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#38BDF8";
        ctx.beginPath();
        ctx.moveTo(v[2].x, v[2].y);
        ctx.lineTo(v[3].x, v[3].y);
        ctx.lineTo(v[4].x, v[4].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#0369A1";
        ctx.beginPath();
        ctx.moveTo(v[4].x, v[4].y);
        ctx.lineTo(v[5].x, v[5].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#0284C7";
        ctx.beginPath();
        ctx.moveTo(v[5].x, v[5].y);
        ctx.lineTo(v[0].x, v[0].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();
      } else {
        // [타입 C] 묵직하고 단단한 빙석 덩어리
        const v = [
          { x: -rx * 0.62, y: -ry * 0.78 },
          { x:  rx * 0.28, y: -ry * 0.95 },
          { x:  rx * 0.86, y: -ry * 0.35 },
          { x:  rx * 0.90, y:  ry * 0.52 },
          { x:  rx * 0.12, y:  ry * 0.90 },
          { x: -rx * 0.78, y:  ry * 0.58 },
        ];
        const C = { x: rx * 0.12, y: -ry * 0.08 };

        ctx.fillStyle = "#F0F9FF";
        ctx.beginPath();
        ctx.moveTo(v[0].x, v[0].y);
        ctx.lineTo(v[1].x, v[1].y);
        ctx.lineTo(v[2].x, v[2].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#0284C7";
        ctx.beginPath();
        ctx.moveTo(v[2].x, v[2].y);
        ctx.lineTo(v[3].x, v[3].y);
        ctx.lineTo(v[4].x, v[4].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#0369A1";
        ctx.beginPath();
        ctx.moveTo(v[4].x, v[4].y);
        ctx.lineTo(v[5].x, v[5].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#38BDF8";
        ctx.beginPath();
        ctx.moveTo(v[5].x, v[5].y);
        ctx.lineTo(v[0].x, v[0].y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill();
      }
    };

    // 3-3. 대상 포켓몬 위에 직접 박히며 생겨나는 다각면 얼음 바위/암석 덩어리들
    // - ox, oy: 초기 밀집 중심점(tx, ty - 6) 기준 좁은 간격의 초기 위치 (밀착 결빙 클러스터)
    // - ang: 폭발 시 사방으로 퍼져나갈 방사 각도
    // - speed: 퍼져나가는 속도 및 비산 거리 계수
    // - spin: 비산 시 회전 각속도
    const iceShards = [
      // 0) 중앙 대형 핵심 얼음 바위 (중심에서 파열)
      { ox: 0, oy: -3, w: 22, h: 24, baseRot: -0.10, ang: -0.25, speed: 0.85, spin: 0.6, v: 0 },
      // 1) 상단 얼음 바위
      { ox: 0, oy: -15, w: 16, h: 18, baseRot: 0.12, ang: -Math.PI * 0.50, speed: 1.15, spin: -0.8, v: 0 },
      // 2) 우상단 각진 빙석
      { ox: 10, oy: -11, w: 17, h: 19, baseRot: 0.35, ang: -Math.PI * 0.22, speed: 1.30, spin: 1.1, v: 1 },
      // 3) 우하단 각진 빙석
      { ox: 11, oy: 4, w: 16, h: 17, baseRot: 0.75, ang: Math.PI * 0.22, speed: 1.25, spin: 0.9, v: 2 },
      // 4) 하단 지지 얼음 바위
      { ox: 1, oy: 9, w: 17, h: 16, baseRot: 0.20, ang: Math.PI * 0.52, speed: 1.05, spin: -0.7, v: 0 },
      // 5) 좌하단 얼음 바위
      { ox: -11, oy: 4, w: 15, h: 16, baseRot: -0.75, ang: Math.PI * 0.82, speed: 1.25, spin: -1.0, v: 2 },
      // 6) 좌상단 깎인 빙암
      { ox: -10, oy: -11, w: 17, h: 18, baseRot: -0.40, ang: -Math.PI * 0.78, speed: 1.30, spin: -1.1, v: 1 },
    ];

    // 초기 밀집(t <= 0.15) 후 사방으로 폭발적으로 퍼져나감 (각 얼음들이 퍼지도록 비산 처리)
    // t: 0.20 (피격 순간, 좁은 간격의 밀집 상태) -> 0.60 (강렬한 외곽 비산) -> 0.90 (원거리 비산 및 소멸)
    const explodeT = Math.max(0, (t - 0.15) / 0.85);
    const spreadEase = Math.pow(explodeT, 0.72); // 초반 급격한 가속 후 관성 비산

    for (let k = 0; k < iceShards.length; k++) {
      const sh = iceShards[k];
      
      // 사방으로 퍼져나가는 비산 거리 (퍼짐 효과 극대화)
      const scatterDist = spreadEase * (38 + sh.speed * 28);
      const curX = tx + sh.ox + Math.cos(sh.ang) * scatterDist;
      const curY = ty - 6 + sh.oy + Math.sin(sh.ang) * scatterDist * 0.72; // 원근감 적용

      // 비산하면서 역동적 회전 및 축소 파쇄
      const curRot = sh.baseRot + spreadEase * sh.spin * Math.PI;
      const scale = Math.max(0.22, (1.0 - spreadEase * 0.38) * (1.0 - t * 0.2));
      const rx = (sh.w * scale) * 0.5;
      const ry = (sh.h * scale) * 0.5;

      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(curRot);

      drawGlacialIceRock(rx, ry, sh.v);

      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * 🌟 161: 트라이어택 후면 레이어 렌더러 (drawBehindEffect)
 * - 칠흑 같은 암전 오버레이 (배경 레이어)
 * - 3D 궤도에서 포켓몬 뒤쪽(z < -0.05)으로 공전하는 삼색 불꽃들
 */
export function drawTriAttackBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep;
  const darkAlpha = frame.darkAlpha ?? 0;

  // 1. 암전 오버레이 (배경 덮기)
  if (darkAlpha > 0.01) {
    drawTriDarkOverlay(targetCtx, darkAlpha);
  }

  // Step 1: 3차원 삼색 불꽃 회전 (뒤쪽 절반)
  // ⚠️ 카메라 복귀 프레임 등에서 허공에 잔류 불꽃이 렌더링되지 않도록 step === 1 및 flameAlpha 검증
  if (step === 1 && (frame.flameAlpha ?? 0) > 0.01) {
    const { attackerPos, isPlayer: isP } = drawCtx;
    const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
    const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));

    // 시전자 중심 살짝 전면부
    const cx = ax + (isP ? 20 : -20);
    const cy = ay - 8;

    const baseTheta = frame.orbitTheta ?? 0;
    const lengthFactor = frame.flameLengthFactor ?? 0.2;
    const flameAlpha = frame.flameAlpha ?? 1.0;
    const orbitRx = (frame as any).orbitRx ?? 70;
    const orbitRy = (frame as any).orbitRy ?? 32;

    // 3원소 불꽃: 파랑(0), 노랑(1), 빨강(2)을 120도 간격으로 배치
    for (let k = 0; k < 3; k++) {
      const elem = TRI_ELEMENTS[k];
      const theta = baseTheta + (k * (Math.PI * 2 / 3));
      drawTriElementalFlame3D(targetCtx, elem, theta, cx, cy, lengthFactor, flameAlpha, true, orbitRx, orbitRy);
    }
  }
}

/**
 * 🌟 161: 트라이어택 전면 레이어 렌더러 (drawEffect)
 * - Step 1: 3D 궤도에서 포켓몬 앞쪽(z >= -0.05)으로 공전하는 점차 길어지는 삼색 불꽃들
 * - Step 2: 상대방 클로즈업 + 해당 다색 불꽃이 알갱이로 발사되어 착탄 타격!
 */
export function drawTriAttackEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep;
  const { attackerPos, targetPos, isPlayer: isP, isHit } = drawCtx;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  // -----------------------------------------------------------------
  // Step 1: 3차원 삼색 불꽃 회전 (앞쪽 절반)
  // -----------------------------------------------------------------
  if (step === 1 && (frame.flameAlpha ?? 0) > 0.01) {
    const cx = ax + (isP ? 20 : -20);
    const cy = ay - 8;

    const baseTheta = frame.orbitTheta ?? 0;
    const lengthFactor = frame.flameLengthFactor ?? 0.2;
    const flameAlpha = frame.flameAlpha ?? 1.0;
    const orbitRx = (frame as any).orbitRx ?? 70;
    const orbitRy = (frame as any).orbitRy ?? 32;

    for (let k = 0; k < 3; k++) {
      const elem = TRI_ELEMENTS[k];
      const theta = baseTheta + (k * (Math.PI * 2 / 3));
      drawTriElementalFlame3D(targetCtx, elem, theta, cx, cy, lengthFactor, flameAlpha, false, orbitRx, orbitRy);
    }
    return;
  }

  // -----------------------------------------------------------------
  // Step 2: 상대방 클로즈업 & 다색 불꽃이 알갱이로 발사됨
  // -----------------------------------------------------------------
  if (step === 2) {
    const darkAlpha = frame.darkAlpha ?? 0;
    // Step 2에서도 잔여 암전 은은하게 유지
    if (darkAlpha > 0.01) {
      drawTriDarkOverlay(targetCtx, darkAlpha * 0.4);
    }

    const launchX = ax + (isP ? 34 : -34);
    const launchY = ay - 10;
    const hitTargetY = ty - 12;

    const pellets: Array<{
      elemIdx: number;       // 0: 파랑, 1: 노랑, 2: 빨강
      progress: number;      // 0.0 (발사) ~ 1.0 (착탄)
      arcHeight?: number;    // 포물선 투척 높이
      offsetY?: number;       // 탄도 상하 오프셋
      burstProgress?: number; // 착탄 폭발 진행도 (0.0 ~ 1.0)
    }> = frame.triPellets || [];

    for (const p of pellets) {
      const elem = TRI_ELEMENTS[p.elemIdx];
      const arc = p.arcHeight ?? 26;
      const targetY = hitTargetY + (p.offsetY || 0);

      // 1. 비행 중인 동그라미 구체 + 유기적 화염 꼬리잔상 렌더링 (착탄 전)
      if (p.progress >= 0.0 && p.progress < 1.0) {
        drawTriThrownSphere(
          targetCtx,
          elem,
          launchX,
          launchY,
          tx,
          targetY,
          p.progress,
          arc,
          10.0,
          1.0
        );
      }

      // 2. 착탄 후 원소 폭발 버스트 렌더링 (isHit인 경우만)
      if (isHit !== false && p.burstProgress !== undefined && p.burstProgress > 0 && p.burstProgress <= 1.0) {
        drawTriImpactBurst(targetCtx, elem, tx, targetY, p.burstProgress, 1.0);
      }
    }
  }
}

// ============================================================================
// 🦷 162: 분노의앞니 (Super Fang) - 5세대 필살앞니 기반 올 레드 & 초고속 교합
// ============================================================================

function lerpColorRgb(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
}

// 유저 요청: 시전자가 빨갛게 변할 때 위에 파티클 올라오는 것은 제거 (순수 스프라이트 진동 & 붉은 발열만 유지)

/**
 * 5세대 필살앞니 고증 단일 치아 렌더러 (Super Fang: 올 레드 & 크림슨 에너지 버전)
 * - 형태: 필살앞니와 1:1 완벽 동일한 유선형 3D 타원형 절치
 * - 후방: 얇게 테이퍼링되는 붉은 유선형 꼬리 + 끝단 투명 페이드아웃
 * - 전방: 짙은 크림슨 레드(#991B1B) ~ 선명한 스칼렛(#EF4444) 헤드 + 또렷한 화이트 하이라이트 림선
 */
function drawSuperFangTooth(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  wid: number = 16,
  frontLen: number = 20,
  tailLen: number = 48,
  energyFactor: number = 0.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const halfW = wid * 0.5;
  const tailR = Math.max(1.2, halfW * 0.2);

  // 1. 후방 붉은 유선형 꼬리 (끝단이 얇게 빠지는 유선형 테이퍼드 테일 - 레드 그라데이션)
  ctx.beginPath();
  ctx.ellipse(0, 0, frontLen * 0.8, halfW * 0.95, 0, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.lineTo(-tailLen + tailR, tailR);
  ctx.arc(-tailLen + tailR, 0, tailR, Math.PI * 0.5, -Math.PI * 0.5);
  ctx.closePath();

  const tailGrad = ctx.createLinearGradient(-tailLen, 0, 0, 0);
  tailGrad.addColorStop(0.0, "rgba(220, 38, 38, 0.0)");
  tailGrad.addColorStop(0.25, "rgba(239, 68, 68, 0.45)");
  tailGrad.addColorStop(0.55, "rgba(254, 202, 202, 0.85)");
  tailGrad.addColorStop(0.85, "#FFFFFF");
  tailGrad.addColorStop(1.0, "#FFFFFF");
  ctx.fillStyle = tailGrad;
  ctx.fill();

  // 2. 전방 치아 헤드: 강렬한 크림슨 레드 타원형 헤드
  const headHalfL = frontLen * 0.95;
  const headHalfW = halfW * 0.92;
  const headCx = frontLen * 0.1;

  ctx.beginPath();
  ctx.ellipse(headCx, 0, headHalfL, headHalfW, 0, 0, Math.PI * 2);

  // 에너지 고조에 따른 붉은색 보간 (강렬한 크림슨 -> 백열 붉은 섬광)
  const t = Math.max(0, Math.min(1, energyFactor));
  const col0 = lerpColorRgb([254, 202, 202], [254, 226, 226], t); // 상단 밝은 코랄 하이라이트
  const col1 = lerpColorRgb([239, 68, 68], [255, 30, 30], t);     // 메인 강렬한 스칼렛 레드
  const col2 = lerpColorRgb([153, 27, 27], [185, 28, 28], t);     // 하단 깊은 크림슨 음영

  const headGrad = ctx.createLinearGradient(headCx - headHalfL, 0, headCx + headHalfL, 0);
  headGrad.addColorStop(0.0, col0);
  headGrad.addColorStop(0.5, col1);
  headGrad.addColorStop(1.0, col2);
  ctx.fillStyle = headGrad;
  ctx.fill();

  // 화이트 외곽선 (림 하이라이트) + 붉은 발광 글로우
  ctx.save();
  ctx.shadowColor = "rgba(255, 30, 30, 0.85)";
  ctx.shadowBlur = 6;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * 5세대 필살앞니 고증 2단 앞니 쌍 (Super Fang: 18px 간격 & 6px 스태거)
 */
function drawSuperFangIncisorPair(
  ctx: any,
  centerX: number,
  centerY: number,
  angle: number,
  sepDist: number = 18,
  wid: number = 16,
  frontLen: number = 20,
  tailLen: number = 48,
  energyFactor: number = 0.0,
  alpha: number = 1.0
) {
  const sepAngle = angle + Math.PI * 0.5;
  const sx = Math.cos(sepAngle) * sepDist * 0.5;
  const sy = Math.sin(sepAngle) * sepDist * 0.5;

  const stagger = 6;
  const ax = Math.cos(angle) * stagger * 0.5;
  const ay = Math.sin(angle) * stagger * 0.5;

  // 좌측 1번 앞니
  drawSuperFangTooth(ctx, centerX - sx + ax, centerY - sy + ay, angle, wid, frontLen, tailLen, energyFactor, alpha);
  // 우측 2번 앞니
  drawSuperFangTooth(ctx, centerX + sx - ax, centerY + sy - ay, angle, wid, frontLen, tailLen, energyFactor, alpha);
}

/**
 * 초고속 교합 쇄도 시 뒤따르는 붉은 스피드 트레일 선 (무는 것만 빠르게!)
 */
function drawSuperFangSnapTrails(
  ctx: any,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  angle: number,
  sepDist: number = 18,
  alpha: number = 0.9
) {
  if (alpha <= 0.01) return;
  const sepAngle = angle + Math.PI * 0.5;
  const sx = Math.cos(sepAngle) * sepDist * 0.5;
  const sy = Math.sin(sepAngle) * sepDist * 0.5;
  const stagger = 6;
  const ax = Math.cos(angle) * stagger * 0.5;
  const ay = Math.sin(angle) * stagger * 0.5;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const offsets = [
    { x: -sx + ax, y: -sy + ay },
    { x:  sx - ax, y:  sy - ay },
  ];

  ctx.shadowColor = "rgba(255, 30, 30, 0.9)";
  ctx.shadowBlur = 6;

  for (const off of offsets) {
    const startX = fromX + off.x;
    const startY = fromY + off.y;
    const endX = toX + off.x;
    const endY = toY + off.y;

    const grad = ctx.createLinearGradient(startX, startY, endX, endY);
    grad.addColorStop(0, "rgba(239, 68, 68, 0)");
    grad.addColorStop(0.35, "rgba(239, 68, 68, 0.55)");
    grad.addColorStop(1, "rgba(254, 226, 226, 0.95)");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 5세대 필살앞니 고증 만화풍 충격 폭발 구름 (Super Fang: 올 레드 버전)
 * - 굵은 딥 크림슨(#991B1B) 테두리 + 선명한 레드(#EF4444) 내각 + 밝은 코랄 핑크/크림(#FEE2E2) 코어
 */
function drawSuperFangComicImpactPuff(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const circles = [
    { x: -14, y: 0, r: 12 },
    { x: -5,  y: -10, r: 14 },
    { x: 10,  y: -8, r: 13 },
    { x: 14,  y: 6,  r: 12 },
    { x: 2,   y: 11, r: 13 },
    { x: -10, y: 8,  r: 11 },
    { x: 0,   y: 0,  r: 15 },
  ];

  // 1. 강력한 외각 붉은 글로우 (2단 외곽 발광)
  ctx.save();
  ctx.shadowColor = "rgba(255, 20, 20, 0.95)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 8.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(185, 28, 28, 0.75)";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 6.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. 메인 짙은 크림슨 레드 테두리
  ctx.fillStyle = "#991B1B";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 5.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 내각 레드 그라데이션 레이어
  ctx.fillStyle = "#DC2626";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 3.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#EF4444";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#F87171";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. 내부 화사한 크림슨 코어 (#FEE2E2, 단 색상은 빨갛게 반영)
  ctx.fillStyle = "#FEE2E2";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 필살앞니 고증 14방향 비산 탄환 알갱이 (Super Fang: 올 레드 루비 에너지 펠릿)
 */
const SUPER_FANG_PARTICLES = [
  // 우상단 스트림 (각도: -45° ~ -78°)
  { angle: -0.92, speed: 70, r: 4.8 },
  { angle: -1.15, speed: 85, r: 5.2 },
  { angle: -1.30, speed: 98, r: 4.5 },
  { angle: -0.76, speed: 62, r: 4.0 },
  { angle: -1.05, speed: 112, r: 5.5 },
  { angle: -1.40, speed: 78, r: 3.8 },
  { angle: -0.86, speed: 94, r: 4.6 },

  // 좌하단 스트림 (각도: 102° ~ 138°)
  { angle: 2.18, speed: 68, r: 4.8 },
  { angle: 2.38, speed: 82, r: 5.2 },
  { angle: 2.00, speed: 96, r: 4.5 },
  { angle: 2.50, speed: 64, r: 4.0 },
  { angle: 2.25, speed: 110, r: 5.4 },
  { angle: 1.85, speed: 74, r: 3.8 },
  { angle: 2.45, speed: 90, r: 4.6 },
];

function drawSuperFangRedParticles(
  ctx: any,
  originX: number,
  originY: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;
  const t = Math.min(1.0, Math.max(0, progress));

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  for (const p of SUPER_FANG_PARTICLES) {
    const dist = t * p.speed;
    const px = originX + Math.cos(p.angle) * dist;
    const py = originY + Math.sin(p.angle) * dist;

    // 원거리 확산 시 비례 축소
    const shrink = Math.max(0.08, 1.0 - Math.pow(t, 0.75) * 0.85);
    const curR = p.r * shrink;

    const glowR1 = curR + 3.6 * shrink;
    const glowR2 = curR + 2.8 * shrink;
    const borderR = curR + 2.0 * shrink;
    const innerR1 = curR + 1.2 * shrink;
    const innerR2 = curR + 0.6 * shrink;
    const curBlur = Math.max(1, Math.round(8 * shrink));

    // 1. 외각 붉은 글로우
    ctx.save();
    ctx.shadowColor = "rgba(255, 30, 30, 0.95)";
    ctx.shadowBlur = curBlur;
    ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
    ctx.beginPath();
    ctx.arc(px, py, glowR1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(185, 28, 28, 0.75)";
    ctx.beginPath();
    ctx.arc(px, py, glowR2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. 메인 짙은 크림슨 테두리
    ctx.fillStyle = "#991B1B";
    ctx.beginPath();
    ctx.arc(px, py, borderR, 0, Math.PI * 2);
    ctx.fill();

    // 3. 내각 레드 그라데이션
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.arc(px, py, innerR1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(px, py, innerR2, 0, Math.PI * 2);
    ctx.fill();

    // 4. 화사한 레드 코어 (노란색 배제, 올 레드 고증)
    ctx.fillStyle = "#FEE2E2";
    ctx.beginPath();
    ctx.arc(px, py, curR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 타격 중심부에 피어오르는 부드러운 붉은 연막 구름 (Super Fang: 레드 스팀 버전)
 */
function drawSuperFangSmokePuffs(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  const t = Math.min(1.0, Math.max(0, progress));

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const puffs = [
    { ox: -10, oy: -12, baseR: 14, grow: 10 },
    { ox: 12,  oy: -6,  baseR: 16, grow: 12 },
    { ox: -4,  oy: 8,   baseR: 15, grow: 11 },
    { ox: 8,   oy: 12,  baseR: 13, grow: 9 },
    { ox: -14, oy: 2,   baseR: 12, grow: 8 },
  ];

  for (const puff of puffs) {
    const px = cx + puff.ox * (1 + t * 0.25);
    const py = cy + puff.oy * (1 + t * 0.25);
    const r = puff.baseR + t * puff.grow;

    // 붉은 연막 그라데이션
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0.0, "rgba(254, 226, 226, 0.85)");
    grad.addColorStop(0.35, "rgba(252, 165, 165, 0.65)");
    grad.addColorStop(0.70, "rgba(239, 68, 68, 0.28)");
    grad.addColorStop(1.0, "rgba(185, 28, 28, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 🦷 162: 분노의앞니 (Super Fang) 메인 이펙트 렌더러
 * - 필살앞니(158) 원작 5개 프레임 구조 완벽 계승
 * - 시전자 좌우 흔들림 & 분노 발열 -> 상대방 포커싱 -> 무는 것만 초고속 교합 -> 올 레드 이펙트
 */
export function drawSuperFangEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const { attackerPos, targetPos, isPlayer: isP, isHit } = drawCtx;
  const step = frame.moveStep ?? 1;
  const p = frame.effectProgress ?? 0.5;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  ctx.save();

  // 대각선 교합 축: 약 47도 (0.82 rad) - 필살앞니 고증 각도
  const angle = 0.82;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // =========================================================================
  // Step 1: 시전 포켓몬 좌우 흔들림 & 붉게 발열 (Rage Phase)
  // [유저 요청]: "시전자가 빨갛게 변할때 위에 파티클 올라오는건 제거" -> 파티클 없이 순수 스프라이트 진동 & 발열만 유지
  // =========================================================================
  if (step === 1) {
    // 파티클 없음
  }

  // =========================================================================
  // Step 2: 상대방 포커싱 (카메라 글라이드 중 - 깨끗한 타겟 시야 확보)
  // =========================================================================
  else if (step === 2) {
    // 상대방 화면 안착 대기
  }

  // =========================================================================
  // Step 3: 붉은 앞니 출현 & 초고속 교합 쇄도 ("무는 것만 빠르게")
  // =========================================================================
  else if (step === 3) {
    // p가 0 -> 1로 갈 때 46px -> 0px로 즉시 닫힘
    const dist = Math.max(0, 46 * (1.0 - p));

    const startDist = 50;
    const ulStartX = tx - cosA * startDist;
    const ulStartY = ty - sinA * startDist;
    const ulCurX = tx - cosA * dist;
    const ulCurY = ty - sinA * dist;

    const brStartX = tx + cosA * startDist;
    const brStartY = ty + sinA * startDist;
    const brCurX = tx + cosA * dist;
    const brCurY = ty + sinA * dist;

    // 붉은 스피드 트레일 (4개 이빨 각각의 고속 궤적)
    if (p > 0.15) {
      drawSuperFangSnapTrails(ctx, ulStartX, ulStartY, ulCurX, ulCurY, angle, 18, 0.95);
      drawSuperFangSnapTrails(ctx, brStartX, brStartY, brCurX, brCurY, angle, 18, 0.95);
    }

    // 붉은 앞니 쌍 (빠르게 닫히며 붉은 에너지 최대 발광)
    const rushTailLen = 48 + p * 12;
    drawSuperFangIncisorPair(ctx, ulCurX, ulCurY, angle, 18, 16, 20, rushTailLen, p, 1.0);
    drawSuperFangIncisorPair(ctx, brCurX, brCurY, angle + Math.PI, 18, 16, 20, rushTailLen, p, 1.0);

    // 격돌 직전/도달 순간 (p > 0.65): 붉은 만화풍 폭발 구름 전개 시작
    if (p > 0.65) {
      const puffProg = (p - 0.65) / 0.35;
      const puffScale = 0.6 + puffProg * 0.65;
      drawSuperFangComicImpactPuff(ctx, tx + 22, ty - 20, puffScale, 1.0);
      drawSuperFangComicImpactPuff(ctx, tx - 22, ty + 20, puffScale, 1.0);
    }
  }

  // =========================================================================
  // Step 4: 완전 교합 & 붉은 만화풍 폭발 & 붉은 알갱이 분출 (이펙트는 그대로 단 색상은 빨갛게)
  // =========================================================================
  else if (step === 4) {
    // 맞물린 붉은 앞니 (중심부)
    const teethAlpha = Math.max(0, 1.0 - p * 0.65);
    if (teethAlpha > 0.01) {
      drawSuperFangIncisorPair(ctx, tx - cosA * 2, ty - sinA * 2, angle, 18, 16, 20, 48, 1.0, teethAlpha);
      drawSuperFangIncisorPair(ctx, tx + cosA * 2, ty + sinA * 2, angle + Math.PI, 18, 16, 20, 48, 1.0, teethAlpha);
    }

    // 격돌 만화풍 폭발 구름 (우상단 & 좌하단)
    if (p <= 0.5) {
      const puffScale = 1.15;
      drawSuperFangComicImpactPuff(ctx, tx + 22, ty - 20, puffScale, 1.0);
      drawSuperFangComicImpactPuff(ctx, tx - 22, ty + 20, puffScale, 1.0);
    }

    // 붉은 연막 구름 형성 (progress: 0.0 -> 0.3)
    drawSuperFangSmokePuffs(ctx, tx, ty, p * 0.3, 0.88);

    // 붉은 알갱이 비산 시작 (progress: 0.1 -> 0.45)
    if (isHit !== false) {
      drawSuperFangRedParticles(ctx, tx, ty, 0.1 + p * 0.35, 1.0);
    }
  }

  // =========================================================================
  // Step 5: 앞니 소멸 & 붉은 알갱이 원거리 확산 & 붉은 연막 팽창
  // =========================================================================
  else if (step === 5) {
    // 붉은 연막 팽창 및 지속
    drawSuperFangSmokePuffs(ctx, tx, ty, 0.3 + p * 0.4, 0.78);

    // 붉은 알갱이 원거리 확산 (progress: 0.45 -> 0.85)
    if (isHit !== false) {
      drawSuperFangRedParticles(ctx, tx, ty, 0.45 + p * 0.4, 1.0);
    }
  }

  // =========================================================================
  // Step 6: 붉은 알갱이 및 연막 구름 페이드아웃 (소산)
  // =========================================================================
  else if (step === 6) {
    const fade = Math.max(0, 1.0 - p * 1.3);

    // 연막 서서히 페이드아웃
    drawSuperFangSmokePuffs(ctx, tx, ty, 0.7 + p * 0.3, fade * 0.65);

    // 알갱이 끝자락 페이드아웃
    if (isHit !== false && fade > 0.01) {
      drawSuperFangRedParticles(ctx, tx, ty, 0.85 + p * 0.15, fade);
    }
  }

  ctx.restore();
}

// ============================================================================
// ⚔️ 163: 베어가르기 (Slash) - 유저 레퍼런스 완벽 고증
// (선명한 레몬 옐로우 & 순백 코어 일체형 거대 참격호 + 양 끝단 극세 바늘 수렴 + 중심 순백/핑크 스타버스트)
// ============================================================================

/**
 * 1. 레퍼런스 이미지 완벽 고증: 선명한 레몬 옐로우 & 순백 코어의 단일 거대 참격호 (Razor-Sharp Slash Blade)
 * - [유저 피드백 반영]:
 *   1) 긁을 때 선 끝쪽 뾰족하게: 양 끝이 완벽하게 0px 바늘 끝으로 뾰족하게 테이퍼링 (Cubic Bezier + Needle Terminators)
 *   2) 순백 코어 역시 라운드 캡 없이 양 끝이 0px 침 형태로 예리하게 폴리곤 마감
 *   3) 잔상 부분 떨어져 있는 거 어색함 제거: 분리된 꼬리선 제거, 칼날 본체와 일체형으로 이어지는 매끄러운 단일 블레이드 및 바람 베일만 유지
 */
function drawSlashReferenceBlade(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  length: number = 210,
  thickness: number = 13.0,
  progress: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const t = Math.max(0.1, Math.min(1.0, progress));
  const curL = length * t;
  const halfL = curL * 0.5;
  const halfThick = thickness * 0.5;

  // 1-1. 외곽 라임-그린/옐로우 대기 찢김 바람 베일 (블레이드에 밀착된 부드러운 일체형 아우라)
  const auraW = thickness * 1.6;
  const auraGrad = ctx.createLinearGradient(-halfL, 0, halfL, 0);
  auraGrad.addColorStop(0.0, "rgba(174, 218, 96, 0.0)");
  auraGrad.addColorStop(0.20, "rgba(174, 218, 96, 0.35)");
  auraGrad.addColorStop(0.50, "rgba(254, 240, 138, 0.45)");
  auraGrad.addColorStop(0.80, "rgba(234, 179, 8, 0.30)");
  auraGrad.addColorStop(1.0, "rgba(234, 179, 8, 0.0)");

  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.moveTo(-halfL * 1.04, 0);
  ctx.bezierCurveTo(-halfL * 0.45, auraW * 0.65, halfL * 0.45, auraW * 0.65, halfL * 1.04, 0);
  ctx.bezierCurveTo(halfL * 0.45, -auraW * 0.65, -halfL * 0.45, -auraW * 0.65, -halfL * 1.04, 0);
  ctx.closePath();
  ctx.fill();

  // 1-2. 메인 레몬 옐로우 ~ 골드 칼날 본체 (양 끝이 바늘 끝처럼 0px로 완벽히 뾰족하게 수렴)
  const bladeGrad = ctx.createLinearGradient(-halfL, 0, halfL, 0);
  bladeGrad.addColorStop(0.0, "#FEF08A");
  bladeGrad.addColorStop(0.22, "#FDE047");
  bladeGrad.addColorStop(0.50, "#FACC15");
  bladeGrad.addColorStop(0.78, "#EAB308");
  bladeGrad.addColorStop(1.0, "#CA8A04");

  ctx.fillStyle = bladeGrad;
  ctx.beginPath();
  ctx.moveTo(-halfL, 0); // 좌하단 극세 바늘 끝 (0px)
  // 상부 호선 (중심 대칭)
  ctx.bezierCurveTo(-halfL * 0.42, halfThick, halfL * 0.42, halfThick, halfL, 0); // 우상단 극세 바늘 끝 (0px)
  // 하부 호선 (중심 대칭)
  ctx.bezierCurveTo(halfL * 0.42, -halfThick, -halfL * 0.42, -halfThick, -halfL, 0);
  ctx.closePath();
  ctx.fill();

  // 1-3. 중심 백열 순백 코어 (라운드 캡 없이 양 끝이 0px 바늘 끝으로 완벽 수렴하는 순백 폴리곤)
  const coreHalfL = halfL * 0.94;
  const coreHalfThick = halfThick * 0.42;

  ctx.save();
  ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(-coreHalfL, 0);
  ctx.bezierCurveTo(-coreHalfL * 0.40, coreHalfThick, coreHalfL * 0.40, coreHalfThick, coreHalfL, 0);
  ctx.bezierCurveTo(coreHalfL * 0.40, -coreHalfThick, -coreHalfL * 0.40, -coreHalfThick, -coreHalfL, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 2. 레퍼런스 이미지 완벽 고증: 중심 순백 & 연분홍 림 타격 스타버스트 (Reference Impact Burst)
 * - 레퍼런스 스크린샷 중심부의 눈부신 백열 코어 + 은은한 핑크/바이올렛 림 코로나 + 방사형 스파이크
 * - 참격 중심 좌표(cx, cy) 및 칼날 축(angle)에 정확히 동기화
 */
function drawSlashReferenceImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const coreR = 14 * scale;
  const coronaR = 34 * scale;

  // 2-1. 은은한 핑크/바이올렛 외곽 코로나 헤일로 (레퍼런스 이미지 픽셀 고증: rgb(231, 216, 225))
  const coronaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coronaR);
  coronaGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  coronaGrad.addColorStop(0.30, "rgba(255, 255, 255, 0.95)");
  coronaGrad.addColorStop(0.60, "rgba(252, 231, 243, 0.75)"); // 연분홍 림
  coronaGrad.addColorStop(0.85, "rgba(231, 216, 225, 0.40)"); // 바이올렛-그레이 림
  coronaGrad.addColorStop(1.0, "rgba(231, 216, 225, 0.0)");

  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coronaR, 0, Math.PI * 2);
  ctx.fill();

  // 2-2. 만화풍 다엽형 날카로운 순백 스타버스트 (Luminous Multi-Spike Starburst)
  const SPIKES = 12;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  for (let i = 0; i < SPIKES * 2; i++) {
    const ang = (i * Math.PI) / SPIKES;
    const r = (i % 2 === 0 ? coreR * 1.85 : coreR * 0.75);
    const px = Math.cos(ang) * r;
    const py = Math.sin(ang) * r * 0.85; // 타원형 편평비
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // 2-3. 타격 횡단 순백 바늘 글린트 (Cutting Needle Glint - 칼날 각도와 완벽 일치)
  const needleL = 42 * scale;
  const needleW = 3.2 * scale;
  ctx.save();
  ctx.rotate(angle);

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(-needleL, 0);
  ctx.lineTo(0, -needleW);
  ctx.lineTo(needleL, 0);
  ctx.lineTo(0, needleW);
  ctx.closePath();
  ctx.fill();

  // 십자 방향 짧은 침
  const crossL = 20 * scale;
  const crossW = 2.0 * scale;
  ctx.beginPath();
  ctx.moveTo(0, -crossL);
  ctx.lineTo(-crossW, 0);
  ctx.lineTo(0, crossL);
  ctx.lineTo(crossW, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  ctx.restore();
}

/**
 * 3. 레퍼런스 스타일 참격 비산 스파크 및 라임/골드 알갱이 (Flying Sparks & Shards)
 */
const SLASH_REF_SPARKS = [
  // 상단으로 튀는 불꽃
  { angle: -Math.PI * 0.62, speed: 75, r: 3.2, col: "#FEF08A" },
  { angle: -Math.PI * 0.42, speed: 90, r: 3.8, col: "#FFFFFF" },
  { angle: -Math.PI * 0.22, speed: 65, r: 2.8, col: "#AEDA60" },
  { angle: -Math.PI * 0.82, speed: 82, r: 3.5, col: "#FEF08A" },
  // 하단으로 튀는 불꽃
  { angle: Math.PI * 0.38, speed: 76, r: 3.2, col: "#FEF08A" },
  { angle: Math.PI * 0.58, speed: 94, r: 4.0, col: "#FFFFFF" },
  { angle: Math.PI * 0.78, speed: 70, r: 3.0, col: "#AEDA60" },
  { angle: Math.PI * 0.18, speed: 84, r: 3.4, col: "#FEF08A" },
  // 측면 비산
  { angle: -Math.PI * 0.08, speed: 58, r: 2.5, col: "#FDE047" },
  { angle: -Math.PI * 0.92, speed: 62, r: 2.6, col: "#FFFFFF" },
  { angle: Math.PI * 0.92, speed: 55, r: 2.4, col: "#AEDA60" },
  { angle: 0.05, speed: 52, r: 2.2, col: "#FEF08A" },
];

function drawSlashReferenceSparks(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;
  const t = Math.min(1.0, Math.max(0, progress));

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  for (const s of SLASH_REF_SPARKS) {
    const dist = t * s.speed;
    const px = cx + Math.cos(s.angle) * dist;
    const py = cy + Math.sin(s.angle) * dist;

    const shrink = Math.max(0.1, 1.0 - t * 0.82);
    const curR = s.r * shrink;

    ctx.fillStyle = s.col;
    ctx.beginPath();
    ctx.arc(px, py, curR, 0, Math.PI * 2);
    ctx.fill();

    // 꼬리 빛 잔상
    ctx.strokeStyle = s.col;
    ctx.lineWidth = Math.max(0.8, curR * 0.6);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - Math.cos(s.angle) * (curR * 2.2), py - Math.sin(s.angle) * (curR * 2.2));
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * ⚔️ 163: 베어가르기 (Slash) 메인 이펙트 렌더러 (유저 레퍼런스 100% 반영)
 */
export function drawSlashMoveEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const { targetPos, isHit } = drawCtx;
  const step = frame.moveStep ?? 1;
  const p = frame.effectProgress ?? 0.5;

  // [유저 피드백]: "시전자에게서 빛나는건 제거" -> step 1에서는 아무것도 그리지 않음!
  if (step === 1) return;

  // 참격 기준 타격 중심: 피격자의 기본 좌표에 일관되게 고정
  // (피격자의 flinch/반동 eOffset/pOffset에 흔들리지 않고 Step 2 출현 선과 Step 3 타격 폭발점이 완벽히 일치)
  const slashX = targetPos.x;
  const slashY = targetPos.y - 12;

  // 레퍼런스 이미지 고증 각도: 약 -25도 (-0.44 rad)
  // 좌하단에서 우상단으로 뻗는 예리한 사선 참격선
  const slashAngle = -0.44;

  ctx.save();

  // =========================================================================
  // Step 2: 상대방 전면 날카로운 레몬 옐로우 참격호 출현 & 쇄도
  // =========================================================================
  if (step === 2) {
    drawSlashReferenceBlade(ctx, slashX, slashY, slashAngle, 210, 13.0, p, 1.0);
  }

  // =========================================================================
  // Step 3: 촥!! 직격 & 레퍼런스 1:1 중심 순백-핑크 섬광 폭발 (그전 노란선 중앙과 정밀 일치)
  // =========================================================================
  else if (step === 3) {
    // 1. 메인 레몬 옐로우 칼날 (떨어진 잔상선 없이 매끄러운 단일 일체형 참격호)
    const bladeAlpha = Math.max(0, 1.0 - p * 0.65);
    if (bladeAlpha > 0.01) {
      drawSlashReferenceBlade(ctx, slashX, slashY, slashAngle, 210, 13.0, 1.0, bladeAlpha);
    }

    // 2. 중심 순백 & 연분홍 림 타격 스타버스트 (레퍼런스 이미지 고증: 참격호 정중앙에 정확히 일치)
    if (isHit !== false) {
      const burstScale = p < 0.4 ? (0.7 + p * 1.5) : (1.3 - (p - 0.4) * 0.7);
      const burstAlpha = Math.max(0, 1.0 - p * 0.75);
      drawSlashReferenceImpactBurst(ctx, slashX, slashY, slashAngle, burstScale, burstAlpha);

      // 3. 비산 스파크 및 라임/골드 알갱이
      drawSlashReferenceSparks(ctx, slashX, slashY, p * 0.65, 1.0);
    }
  }

  // =========================================================================
  // Step 4: 참격 잔향 소산 & 스파크 원거리 비산 페이드아웃
  // =========================================================================
  else if (step === 4) {
    const fade = Math.max(0, 1.0 - p * 1.25);

    // 잔여 칼날 페이드아웃 (떨어진 잔상 없이 원래 참격호가 매끄럽게 소산)
    if (fade > 0.01) {
      drawSlashReferenceBlade(ctx, slashX, slashY, slashAngle, 210, 11.0, 1.0, fade * 0.65);
    }

    // 스파크 원거리 비산 및 소멸
    if (isHit !== false && fade > 0.01) {
      drawSlashReferenceSparks(ctx, slashX, slashY, 0.65 + p * 0.35, fade);
    }
  }

  ctx.restore();
}

// ============================================================================
// 🧸 164: 대타출동 (Substitute)
// ============================================================================

/**
 * 💨 대타출동 시전자 후퇴 슬라이드 흙먼지 (Skid Dust)
 * - 아군(좌측 후퇴) / 상대(우측 후퇴)에 맞추어 발밑 반대 방향으로 피어오르는 미끄러짐 먼지
 */
export function drawSubstituteSkidDust(
  ctx: any,
  x: number,
  y: number,
  isPlayer: boolean,
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 진행에 따른 팽창 및 페이드
  const p = Math.min(1.0, Math.max(0, progress));
  // 아군은 좌측으로 빠지므로 먼지는 우측(+X)으로, 상대는 우측으로 빠지므로 먼지는 좌측(-X)으로
  const dir = isPlayer ? 1 : -1;

  const puffs = [
    { ox: 8 * dir, oy: 24, r: 8 + p * 12, alphaMul: 0.9 },
    { ox: 22 * dir, oy: 22, r: 6 + p * 10, alphaMul: 0.75 },
    { ox: 38 * dir, oy: 26, r: 4 + p * 8, alphaMul: 0.6 },
    { ox: 14 * dir, oy: 28, r: 5 + p * 7, alphaMul: 0.8 },
  ];

  for (const puff of puffs) {
    const curAlpha = Math.max(0, (1 - p * 0.9) * puff.alphaMul);
    if (curAlpha <= 0.01) continue;

    const px = x + puff.ox * (1 + p * 0.8);
    const py = y + puff.oy - p * 4;

    ctx.save();
    ctx.globalAlpha = curAlpha * alpha;
    ctx.fillStyle = "#E2E8F0";
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.arc(px, py, puff.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 💨 대타출동 펑! 소환 연기구름 (Substitute Poof Smoke)
 * - 본가 원작 고증: 포켓몬이 빠진 자리에 몽글몽글 터지는 카툰풍 화이트-연회색 연기구름 볼륨
 */
export function drawSubstitutePoof(
  ctx: any,
  x: number,
  y: number,
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p = Math.min(1.0, Math.max(0, progress));

  // 1. 팽창 스케일 및 페이드 곡선
  const scale = p < 0.35 ? (0.3 + p * 2.2) : (1.07 + (p - 0.35) * 0.25);
  const fade = p < 0.4 ? 1.0 : Math.max(0, 1.0 - (p - 0.4) / 0.6);

  if (fade <= 0.01) {
    ctx.restore();
    return;
  }

  // 2. 7방향 유기적 뭉게구름 로브(Lobe) 정의
  const lobes = [
    { angle: -Math.PI / 2, dist: 24, r: 18 },          // 상단
    { angle: -Math.PI * 0.78, dist: 22, r: 16 },      // 좌상
    { angle: -Math.PI * 0.22, dist: 22, r: 16 },      // 우상
    { angle: -Math.PI * 0.95, dist: 28, r: 17 },      // 좌측
    { angle: -Math.PI * 0.05, dist: 28, r: 17 },      // 우측
    { angle: Math.PI * 0.75, dist: 20, r: 14 },       // 좌하
    { angle: Math.PI * 0.25, dist: 20, r: 14 },       // 우하
    { angle: 0, dist: 0, r: 24 },                     // 중앙 코어
  ];

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = fade * alpha;

  // 그림자/외곽선 패스 (일체형 볼륨감)
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 2.0;

  for (const lobe of lobes) {
    const lx = Math.cos(lobe.angle) * lobe.dist;
    const ly = Math.sin(lobe.angle) * lobe.dist;

    ctx.beginPath();
    ctx.arc(lx, ly, lobe.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 내부 밝은 하이라이트 레이어
  ctx.fillStyle = "#F8FAFC";
  for (const lobe of lobes) {
    const lx = Math.cos(lobe.angle) * (lobe.dist * 0.85);
    const ly = Math.sin(lobe.angle) * (lobe.dist * 0.85) - 2;

    ctx.beginPath();
    ctx.arc(lx, ly, lobe.r * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // 3. 중심 소환 스파클 (노란빛/하얀빛 깜찍한 반짝이 별)
  if (p >= 0.15 && p <= 0.75) {
    const sparkAlpha = p < 0.45 ? 1.0 : (1.0 - (p - 0.45) / 0.3);
    ctx.save();
    ctx.globalAlpha = sparkAlpha * alpha;
    
    // 상하좌우 작은 십자별 3개
    drawMiniSparkStar(ctx, x - 20, y - 26, 7, "#FDE047");
    drawMiniSparkStar(ctx, x + 24, y - 18, 9, "#FFFFFF");
    drawMiniSparkStar(ctx, x + 4, y - 36, 6, "#FACC15");
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 미니 반짝이 십자별 헬퍼
 */
function drawMiniSparkStar(ctx: any, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 💨 대타출동 인형 착지 지면 미니 퍼프 (Landing Dust)
 */
export function drawSubstituteLandingDust(
  ctx: any,
  x: number,
  y: number,
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p = Math.min(1.0, Math.max(0, progress));
  const curAlpha = Math.max(0, 1.0 - p);

  if (curAlpha <= 0.01) {
    ctx.restore();
    return;
  }

  ctx.globalAlpha = curAlpha * alpha;
  ctx.fillStyle = "#E2E8F0";
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 1.0;

  const groundY = y + 26;
  const spreadX = 22 + p * 20;

  // 좌측 미니 퍼프
  ctx.beginPath();
  ctx.arc(x - spreadX, groundY - p * 3, 5 + p * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 우측 미니 퍼프
  ctx.beginPath();
  ctx.arc(x + spreadX, groundY - p * 3, 5 + p * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * 🧸 164: 대타출동 (Substitute) 메인 이펙트 렌더러
 */
export function drawSubstituteEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const { attackerPos, isPlayer } = drawCtx;
  const step = frame.moveStep ?? 1;
  const p = frame.effectProgress ?? 0.5;

  // 스폰 및 연기 기준 중심 좌표: 원래 시전 포켓몬의 베이스 좌표
  const baseX = attackerPos.x;
  const baseY = attackerPos.y;

  // Step 1: 시전 포켓몬 미끄러져 빠지는 중 (발밑 흙먼지 퍼프)
  if (step === 1) {
    const casterX = isPlayer ? (frame.pOffset?.x ?? 0) + baseX : (frame.eOffset?.x ?? 0) + baseX;
    drawSubstituteSkidDust(ctx, casterX, baseY, isPlayer, p, 1.0);
  }

  // Step 2: 펑!! 연기구름 폭발 & 소환 섬광
  else if (step === 2) {
    drawSubstitutePoof(ctx, baseX, baseY, p, 1.0);
  }

  // Step 3: 인형 착지 바운스 & 지면 미니 퍼프
  else if (step === 3) {
    // 잔여 연기 살짝 소산
    if (p < 0.6) {
      drawSubstitutePoof(ctx, baseX, baseY, 0.4 + p * 0.6, Math.max(0, 1.0 - p * 1.5));
    }
    // 지면 착지 퍼프
    drawSubstituteLandingDust(ctx, baseX, baseY, p, 1.0);
  }

  // Step 4: 완료 및 잔여 먼지 소산
  else if (step === 4) {
    if (p < 0.5) {
      drawSubstituteLandingDust(ctx, baseX, baseY, 0.5 + p * 0.5, Math.max(0, 0.5 - p));
    }
  }
}



