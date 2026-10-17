// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { drawRecoveryStarSpiral } from "./move105_108.js";

/**
 * 253: 소란피우기 (Uproar)
 * 
 * [유저 요구사항 100% 반영]:
 * - 울부짖기(Roar / 046) 3D 전방 지향성 음파 비행 메커니즘 참고
 * - 발사되는 원판:
 *   - 여러겹의 링(노랑, 연주황 겹겹)으로 이루어진 3D 원판 (Shockwave Disc)
 *   - 중심에서 외곽까지 노랑과 연주황의 선명한 동심원 링들이 겹겹이 층을 이룸
 * - 원판과 함께 발사되는 음표:
 *   - 갈주황(#B84E10) 및 주황(#FF7A00) 2톤으로 구성된 단일음표(♪)와 2연음표(♫)
 *   - 3D 원판 둘레 및 비행 궤도를 따라 원판과 함께 전방으로 쇄도
 * - 타격 시: 대상 직격 음파 폭발 & 갈주황/주황 음표 방사형 비산
 */

// 3D 링 상의 음표 배치 스펙 (타원 둘레를 따라 갈주황과 주황이 교차 배치)
const UPROAR_3D_RING_NOTES = [
  { phi: 0, type: "single" as const, color: "#FF7A00" },                    // 0° (전방 첨단): 주황 단일음표 (♪)
  { phi: (55 * Math.PI) / 180, type: "double" as const, color: "#B84E10" },  // +55° (근경 상부): 갈주황 2연음표 (♫)
  { phi: (115 * Math.PI) / 180, type: "single" as const, color: "#FF7A00" }, // +115° (근경 하부): 주황 단일음표 (♪)
  { phi: (170 * Math.PI) / 180, type: "double" as const, color: "#B84E10" }, // +170° (후방): 갈주황 2연음표 (♫)
  { phi: (-120 * Math.PI) / 180, type: "single" as const, color: "#B84E10" },// -120° (원경 하부): 갈주황 단일음표 (♪)
  { phi: (-60 * Math.PI) / 180, type: "double" as const, color: "#FF7A00" },  // -60° (원경 상부): 주황 2연음표 (♫)
];

/**
 * 5단계 색상 전환 팔레트 (B3903A > 주황 > D9D719 > 노랑 > AB8D8C)
 * prog (0.0 ~ 1.0)에 따라 부드러운 색상 보간 반환
 */
export function getUproarPalette(prog: number) {
  const p = Math.min(1.0, Math.max(0, prog));
  const STOPS = [
    { r: 179, g: 144, b: 58, hex: "#B3903A" },  // 0.00: B3903A (황갈색)
    { r: 255, g: 122, b: 0, hex: "#FF7A00" },   // 0.25: 주황
    { r: 217, g: 215, b: 25, hex: "#D9D719" },  // 0.50: D9D719 (라임 옐로우)
    { r: 255, g: 230, b: 0, hex: "#FFE600" },   // 0.75: 노랑
    { r: 171, g: 141, b: 140, hex: "#AB8D8C" }, // 1.00: AB8D8C (뮤트 로즈 브라운)
  ];

  const scaled = p * 4;
  const idx = Math.min(3, Math.floor(scaled));
  const subT = scaled - idx;

  const c1 = STOPS[idx];
  const c2 = STOPS[idx + 1];

  const r = Math.round(c1.r + (c2.r - c1.r) * subT);
  const g = Math.round(c1.g + (c2.g - c1.g) * subT);
  const b = Math.round(c1.b + (c2.b - c1.b) * subT);

  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const hexStr = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  const rgbStr = `${r}, ${g}, ${b}`;

  return { rgbStr, hexStr };
}

/**
 * Helper: 여러겹의 링으로 이루어진 3D 음파 원판 렌더러
 * - 발사 진행도(prog) 또는 고정 색상(colorRgb)에 따라 링 선 색상 적용
 */
// 5단계 표준 색상 상수 (B3903A > 주황 > D9D719 > 노랑 > AB8D8C)
const C_B3903A = "179, 144, 58";  // 1. 황갈색
const C_ORANGE = "255, 122, 0";   // 2. 주황
const C_D9D719 = "217, 215, 25";  // 3. 라임 옐로우
const C_YELLOW = "255, 230, 0";   // 4. 노랑
const C_AB8D8C = "171, 141, 140"; // 5. 뮤트 로즈 브라운

const HEX_B3903A = "#B3903A";
const HEX_ORANGE = "#FF7A00";
const HEX_D9D719 = "#D9D719";
const HEX_YELLOW = "#FFE600";
const HEX_AB8D8C = "#AB8D8C";

/**
 * Helper: 여러겹의 링으로 이루어진 3D 음파 원판 렌더러
 * - 중간(내측 링) -> 중간 링 -> 바깥쪽(최외곽 링)으로 색상이 완전히 퍼져나가도록 독립적 색상 수용
 */
export function drawUproarMultiRingDisc(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  radius: number,
  alpha: number = 1.0,
  depthRatio: number = 0.54,
  colInner: string = C_ORANGE,
  colMid?: string,
  colOuter?: string
) {
  if (radius <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(depthRatio, 1.08);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const cIn = colInner;
  const cMid = colMid ?? colInner;
  const cOut = colOuter ?? colMid ?? colInner;

  // 링 선 자체의 렌더러: 링 선 안쪽은 100% 투명, 바깥쪽은 선명한 색깔
  const drawGradientRingLine = (
    rOut: number,
    thickness: number,
    color: string
  ) => {
    const rIn = Math.max(0, rOut - thickness);
    const grad = ctx.createRadialGradient(0, 0, rIn, 0, 0, rOut);
    grad.addColorStop(0, `rgba(${color}, 0)`);       // 링 선 안쪽: 완전 투명
    grad.addColorStop(0.40, `rgba(${color}, 0.25)`);
    grad.addColorStop(1.0, `rgba(${color}, 0.95)`);  // 링 선 바깥쪽: 선명한 색깔

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rOut, 0, Math.PI * 2, false);
    ctx.arc(0, 0, rIn, 0, Math.PI * 2, true); // 도넛 중공(Hollow) 컷아웃
    ctx.closePath();
    ctx.fill();

    // 링 선 가장 바깥쪽 선명한 외곽 테두리선
    ctx.strokeStyle = `rgba(${color}, 1.0)`;
    ctx.lineWidth = Math.max(1.2, radius * 0.025);
    ctx.beginPath();
    ctx.arc(0, 0, rOut, 0, Math.PI * 2);
    ctx.stroke();
  };

  // 3단계 간격의 링 (중간(내측) -> 바깥쪽(외곽) 방향으로 색상 전개)
  drawGradientRingLine(radius * 0.40, radius * 0.12, cIn);
  drawGradientRingLine(radius * 0.70, radius * 0.14, cMid);
  drawGradientRingLine(radius * 1.00, radius * 0.16, cOut);

  ctx.restore();
}

/**
 * Helper: 단일 8분음표 (♪) SVG 벡터 렌더러
 */
export function drawUproarSingleNote(
  ctx: any,
  cx: number,
  cy: number,
  color: string,
  scale: number = 1.0,
  rotation: number = 0,
  alpha: number = 1.0
) {
  if (scale <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.translate(0, 8);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.ellipse(-5, 4, 7.5, 5.2, -0.40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(1.5, -20, 2.8, 24);

  ctx.beginPath();
  ctx.moveTo(4.3, -20);
  ctx.bezierCurveTo(12, -18, 17, -10, 16, -1.5);
  ctx.bezierCurveTo(13.5, -7.5, 9, -11, 4.3, -12);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Helper: 2연 16분음표 (♫) SVG 벡터 렌더러
 */
export function drawUproarDoubleNote(
  ctx: any,
  cx: number,
  cy: number,
  color: string,
  scale: number = 1.0,
  rotation: number = 0,
  alpha: number = 1.0
) {
  if (scale <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.translate(0, 7);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.ellipse(-9, 5, 6.5, 4.5, -0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(7, 2, 6.5, 4.5, -0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(-4, -16, 2.5, 21);
  ctx.fillRect(12, -19, 2.5, 21);

  ctx.beginPath();
  ctx.moveTo(-4, -16);
  ctx.lineTo(14.5, -19);
  ctx.lineTo(14.5, -15.5);
  ctx.lineTo(-4, -12.5);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-4, -10.5);
  ctx.lineTo(14.5, -13.5);
  ctx.lineTo(14.5, -10.5);
  ctx.lineTo(-4, -7.5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawUproarNote(
  ctx: any,
  cx: number,
  cy: number,
  type: "single" | "double",
  color: string,
  scale: number,
  rotation: number,
  alpha: number
) {
  if (type === "single") {
    drawUproarSingleNote(ctx, cx, cy, color, scale, rotation, alpha);
  } else {
    drawUproarDoubleNote(ctx, cx, cy, color, scale, rotation, alpha);
  }
}

/**
 * Helper: 3D 원판 둘레 음표 세트 렌더러
 */
export function draw3DRingNotesSet(
  ctx: any,
  ax: number,
  ay: number,
  cx: number,
  cy: number,
  mainAngle: number,
  radius: number,
  baseScale: number,
  alpha: number,
  depthRatio: number = 0.54,
  noteColor: string = HEX_ORANGE,
  secondaryColor?: string
) {
  if (baseScale <= 0 || alpha <= 0) return;

  const cosM = Math.cos(mainAngle);
  const sinM = Math.sin(mainAngle);

  const apexX = ax - cosM * 40;
  const apexY = ay - sinM * 40;

  const pCol = noteColor;
  const sCol = secondaryColor ?? noteColor;

  const notes = UPROAR_3D_RING_NOTES.map((spec, idx) => {
    const u = Math.cos(spec.phi) * radius * depthRatio;
    const v = Math.sin(spec.phi) * radius * 1.08;

    const wx = cx + cosM * u - sinM * v;
    const wy = cy + sinM * u + cosM * v;

    const depthFactor = 1.0 + ((wy - cy) / (radius * 1.08 + 1)) * 0.22;
    const finalScale = Math.max(0.35, baseScale * depthFactor);
    const finalAlpha = Math.min(1.0, Math.max(0.06, alpha * (0.88 + (depthFactor - 1.0) * 0.12)));

    const heading = Math.atan2(wy - apexY, wx - apexX) + (spec.type === "single" ? 0.08 : -0.08);
    const color = idx % 2 === 0 ? pCol : sCol;

    return {
      wx,
      wy,
      type: spec.type,
      color,
      heading,
      finalScale,
      finalAlpha,
    };
  });

  notes.sort((a, b) => a.wy - b.wy);

  for (const n of notes) {
    drawUproarNote(ctx, n.wx, n.wy, n.type, n.color, n.finalScale, n.heading, n.finalAlpha);
  }
}

/**
 * 253: 소란피우기 메인 렌더러 함수
 * - 중간에서 바깥으로 색상이 완전히 퍼져나가는 프레임별 캐스케이드 연출
 */
export function drawUproarEffect(
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

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);

  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const mainAngle = Math.atan2(ty - ay, tx - ax);

  ctx.save();

  // ==========================================================================
  // [1차 파동]: 중간(내측) ➔ 바깥(외곽)으로 5색 확산
  // ==========================================================================
  if (step === 1) {
    // 1-1. 발사: 중심에서 #B3903A 발현
    const t = 0.22; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 24, 0.85, 0.54, C_B3903A, C_B3903A, C_B3903A);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 26, 0.60, 0.75, 0.54, HEX_B3903A);
  } else if (step === 2) {
    // 1-2. 전진 1: 주황이 중심(중간)에 출현! B3903A는 중간 링으로 번짐
    const t = 0.38; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 40, 0.80, 0.54, C_ORANGE, C_B3903A, C_B3903A);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 43, 0.72, 0.80, 0.54, HEX_B3903A);
  } else if (step === 3) {
    // 1-3. 전진 2: D9D719가 중심에 출현, 주황이 중간 링으로, B3903A가 외곽 링으로 번짐!
    const t = 0.55; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 60, 0.78, 0.54, C_D9D719, C_ORANGE, C_B3903A);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 64, 0.88, 0.85, 0.54, HEX_ORANGE);
  } else if (step === 4) {
    // 1-4. 완전 퍼짐: 노랑이 중심, D9D719가 중간, AB8D8C가 외곽 링과 음표까지 도달!
    const t = 0.72; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 82, 0.72, 0.54, C_YELLOW, C_D9D719, C_AB8D8C);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 86, 1.05, 0.88, 0.54, HEX_AB8D8C);
  }

  // ==========================================================================
  // [2차 파동]: 다시 중간(내측)부터 새로 발사되어 바깥으로 완전 확산
  // ==========================================================================
  else if (step === 5) {
    // 2-1. 2차 발사: 중심에서 다시 #B3903A 발현 (1차 잔향은 앞에서 AB8D8C로 소산)
    const t = 0.24; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 28, 0.85, 0.54, C_B3903A, C_B3903A, C_B3903A);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 30, 0.65, 0.80, 0.54, HEX_B3903A);

    const tPrev = 0.86; const cxP = ax + (tx - ax) * tPrev; const cyP = ay + (ty - ay) * tPrev;
    drawUproarMultiRingDisc(ctx, cxP, cyP, mainAngle, 92, 0.22, 0.54, C_AB8D8C, C_AB8D8C, C_AB8D8C);
  } else if (step === 6) {
    // 2-2. 전진 1: 주황이 중심에 출현, B3903A가 중간/외곽으로 번짐
    const t = 0.42; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 48, 0.80, 0.54, C_ORANGE, C_B3903A, C_B3903A);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 52, 0.78, 0.82, 0.54, HEX_B3903A);
  } else if (step === 7) {
    // 2-3. 전진 2: D9D719가 중심, 주황이 중간, B3903A가 외곽으로 번짐
    const t = 0.62; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 72, 0.78, 0.54, C_D9D719, C_ORANGE, C_B3903A);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 76, 0.95, 0.85, 0.54, HEX_ORANGE);
  } else if (step === 8) {
    // 2-4. 완전 퍼짐: 노랑이 중심, D9D719가 중간, AB8D8C가 외곽 링과 음표까지 완전 도달!
    const t = 0.82; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 96, 0.75, 0.54, C_YELLOW, C_D9D719, C_AB8D8C);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 100, 1.15, 0.90, 0.54, HEX_AB8D8C);
  }

  // ==========================================================================
  // [3차 파동]: 최대 확산 파동 (중간에서 바깥으로 5색 전체가 완벽하게 번져나감)
  // ==========================================================================
  else if (step === 9) {
    // 3-1. 3차 발사: 중심에서 다시 #B3903A 발현
    const t = 0.26; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 32, 0.88, 0.54, C_B3903A, C_B3903A, C_B3903A);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 35, 0.72, 0.82, 0.54, HEX_B3903A);

    const tPrev = 0.96; const cxP = ax + (tx - ax) * tPrev; const cyP = ay + (ty - ay) * tPrev;
    drawUproarMultiRingDisc(ctx, cxP, cyP, mainAngle, 115, 0.22, 0.54, C_AB8D8C, C_AB8D8C, C_AB8D8C);
  } else if (step === 10) {
    // 3-2. 전진 1: 주황이 중심(중간)에 출현, B3903A가 중간/외곽으로 확산
    const t = 0.44; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 54, 0.82, 0.54, C_ORANGE, C_B3903A, C_B3903A);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 58, 0.85, 0.85, 0.54, HEX_B3903A);
  } else if (step === 11) {
    // 3-3. 전진 2: D9D719가 중심, 주황이 중간 링, B3903A가 외곽 링으로 번짐
    const t = 0.62; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 78, 0.80, 0.54, C_D9D719, C_ORANGE, C_B3903A);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 83, 1.02, 0.88, 0.54, HEX_ORANGE);
  } else if (step === 12) {
    // 3-4. 퍼짐 1: 노랑이 중심, D9D719가 중간 링, 주황이 외곽 링으로 번짐
    const t = 0.80; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 102, 0.82, 0.54, C_YELLOW, C_D9D719, C_ORANGE);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 108, 1.25, 0.92, 0.54, HEX_D9D719);
  } else if (step === 13) {
    // 3-5. 최대 완전 퍼짐 (직격): AB8D8C가 중심에서 외곽과 음표까지 완전히 물들이며 폭발적 확산!
    const t = 0.98; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 130, 0.88, 0.54, C_AB8D8C, C_YELLOW, C_AB8D8C);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 135, 1.50, 1.0, 0.54, HEX_AB8D8C);
  } else if (step === 14) {
    // 3-6. 관통 소산: AB8D8C로 완전히 물든 원판과 음표가 전방으로 페이드아웃
    const t = 1.18; const cx = ax + (tx - ax) * t; const cy = ay + (ty - ay) * t;
    const prog = frame.effectProgress ?? 0.8;
    const fadeAlpha = Math.max(0, 1.0 - prog * 0.75) * 0.50;
    drawUproarMultiRingDisc(ctx, cx, cy, mainAngle, 160, fadeAlpha, 0.54, C_AB8D8C, C_AB8D8C, C_AB8D8C);
    draw3DRingNotesSet(ctx, ax, ay, cx, cy, mainAngle, 165, 1.15, fadeAlpha, 0.54, HEX_AB8D8C);
  }

  ctx.restore();
}

// ============================================================================
// 🔮 254: 비축하기 (Stockpile / たくわえる) - 노말 타입 변화 기술
//
// 위력: — / 명중: — / PP: 20 / 대상: 자신 / 접촉: X
// 설명: 힘을 비축한다. 최대 3회까지 비축하여 방어와 특수방어를 올릴 수 있다.
//
// [유저 요구사항 100% 반영]:
// 1. E4D249 구체가 사방에서 시전포켓몬 안으로 들어감
// 2. EA9C63 색상인 구체도 있음 (크기가 살짝 작음)
// 3. 해당 구체는 잔상을 남기는데 뒤쪽일수록 투명함
// ============================================================================

export const STOCKPILE_COLOR_YELLOW = {
  hex: "#E4D249",
  rgb: "228, 210, 73",
};

export const STOCKPILE_COLOR_ORANGE = {
  hex: "#EA9C63",
  rgb: "234, 156, 99",
};

/**
 * 하이라이트 없는 부드러운 타원형 오브 렌더러
 * - cx, cy: 중심 좌표
 * - rx, ry: 장축, 단축 반지름
 * - rotation: 진행 방향 헤딩 각도
 * - colorType: 'yellow' (#E4D249) 또는 'orange' (#EA9C63)
 * - alpha: 불투명도 (0.0 ~ 1.0)
 */
export function drawStockpileEllipse(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation: number,
  colorType: "yellow" | "orange",
  alpha: number = 1.0
) {
  if (rx <= 0.5 || ry <= 0.5 || alpha <= 0.01) return;
  const col = colorType === "yellow" ? STOCKPILE_COLOR_YELLOW : STOCKPILE_COLOR_ORANGE;
  const a = Math.min(1.0, Math.max(0, alpha));

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // 1. 외곽 은은한 소프트 오라 (하이라이트 없이 고유 색상의 부드러운 발광)
  const auraRx = rx * 1.45;
  const auraRy = ry * 1.45;
  const auraGrad = ctx.createRadialGradient(0, 0, Math.min(rx, ry) * 0.35, 0, 0, Math.max(auraRx, auraRy));
  auraGrad.addColorStop(0.0, `rgba(${col.rgb}, ${0.35 * a})`);
  auraGrad.addColorStop(0.60, `rgba(${col.rgb}, ${0.14 * a})`);
  auraGrad.addColorStop(1.0, `rgba(${col.rgb}, 0)`);

  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, auraRx, auraRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 타원형 본체 (하이라이트 없이 순수한 고유 색상으로 깔끔하게 채움)
  const maxR = Math.max(rx, ry);
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
  coreGrad.addColorStop(0.00, `rgba(${col.rgb}, ${0.98 * a})`);
  coreGrad.addColorStop(0.85, `rgba(${col.rgb}, ${0.92 * a})`);
  coreGrad.addColorStop(1.00, `rgba(${col.rgb}, 0.0)`);

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** 호환용 래퍼 함수 */
export function drawStockpileOrb(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  colorType: "yellow" | "orange",
  alpha: number = 1.0
) {
  drawStockpileEllipse(ctx, cx, cy, radius * 1.25, radius * 0.72, 0, colorType, alpha);
}

export interface StockpileOrbSpec {
  angle: number;       // 사방 출발 각도 (라디안)
  dist: number;        // 출발 거리 (시전 포켓몬보다 살짝 떨어진 곳: 60~95px)
  colorType: "yellow" | "orange";
  baseRx: number;      // 타원 장축 (노랑: 11~13.5px, 주황: 8~9.5px - 살짝 작음)
  baseRy: number;      // 타원 단축 (노랑: 6.5~7.5px, 주황: 4.5~5.5px)
  baseRadius: number;  // 테스트 및 호환용 평균 반지름
  curveSign: number;   // 궤적 곡선 방향 (-1, 0, 1)
  curveAmount: number; // 궤적 최대 곡률 (px)
  delay: number;       // 출발 지연 (0.0 ~ 0.35)
  duration: number;    // 이동 소요 시간 (0.45 ~ 0.65)
  isBehind: boolean;   // 포켓몬 뒤쪽 레이어 여부
}

/**
 * 사방에서 시전 포켓몬보다 살짝 떨어진 거리(65~92px)에서 페이드 인으로 나타나는 타원 데이터
 * - #E4D249 (노랑): 12개 (장축 11~13.5px)
 * - #EA9C63 (주황): 8개 (장축 8~9.5px, 살짝 작음)
 */
export const STOCKPILE_ORB_SPECS: StockpileOrbSpec[] = [
  // 1차 웨이브: 살짝 떨어진 곳에서 페이드 인으로 출현하여 유입 (1번 타원은 0.34 도달 ➔ 스쿼시&스트레치 및 노란빛 페이드인 유발)
  { angle: 0.05, dist: 72, colorType: "yellow", baseRx: 12.0, baseRy: 7.0, baseRadius: 12.0, curveSign: 1, curveAmount: 12, delay: 0.00, duration: 0.34, isBehind: false },
  { angle: 0.45, dist: 68, colorType: "orange", baseRx: 8.5, baseRy: 5.0, baseRadius: 8.5, curveSign: -1, curveAmount: 10, delay: 0.03, duration: 0.50, isBehind: false },
  { angle: 0.95, dist: 75, colorType: "yellow", baseRx: 13.0, baseRy: 7.5, baseRadius: 13.0, curveSign: 1, curveAmount: 14, delay: 0.06, duration: 0.54, isBehind: false },
  { angle: 1.55, dist: 65, colorType: "orange", baseRx: 8.0, baseRy: 4.8, baseRadius: 8.0, curveSign: -1, curveAmount: 9, delay: 0.02, duration: 0.48, isBehind: false },
  { angle: 2.15, dist: 74, colorType: "yellow", baseRx: 12.5, baseRy: 7.2, baseRadius: 12.5, curveSign: 1, curveAmount: 11, delay: 0.05, duration: 0.53, isBehind: false },
  { angle: 2.75, dist: 78, colorType: "orange", baseRx: 8.5, baseRy: 5.2, baseRadius: 8.5, curveSign: -1, curveAmount: 13, delay: 0.08, duration: 0.55, isBehind: false },
  { angle: 3.25, dist: 76, colorType: "yellow", baseRx: 13.0, baseRy: 7.5, baseRadius: 13.0, curveSign: 1, curveAmount: 14, delay: 0.02, duration: 0.52, isBehind: false },
  { angle: 3.75, dist: 70, colorType: "orange", baseRx: 8.0, baseRy: 4.8, baseRadius: 8.0, curveSign: -1, curveAmount: 12, delay: 0.06, duration: 0.51, isBehind: true },
  { angle: 4.30, dist: 66, colorType: "yellow", baseRx: 11.5, baseRy: 6.8, baseRadius: 11.5, curveSign: 1, curveAmount: 10, delay: 0.04, duration: 0.49, isBehind: true },
  { angle: 4.80, dist: 73, colorType: "orange", baseRx: 8.5, baseRy: 5.0, baseRadius: 8.5, curveSign: -1, curveAmount: 12, delay: 0.07, duration: 0.53, isBehind: true },
  { angle: 5.35, dist: 75, colorType: "yellow", baseRx: 12.5, baseRy: 7.2, baseRadius: 12.5, curveSign: 1, curveAmount: 11, delay: 0.03, duration: 0.50, isBehind: true },
  { angle: 5.90, dist: 69, colorType: "orange", baseRx: 8.0, baseRy: 4.8, baseRadius: 8.0, curveSign: -1, curveAmount: 10, delay: 0.05, duration: 0.52, isBehind: false },

  // 2차 웨이브: 살짝 더 바깥 둘레(80~92px)에서 시차를 두고 페이드 인 출현
  { angle: 0.25, dist: 85, colorType: "orange", baseRx: 8.5, baseRy: 5.0, baseRadius: 8.5, curveSign: -1, curveAmount: 15, delay: 0.18, duration: 0.52, isBehind: false },
  { angle: 1.25, dist: 82, colorType: "yellow", baseRx: 13.5, baseRy: 7.8, baseRadius: 13.5, curveSign: 1, curveAmount: 13, delay: 0.22, duration: 0.54, isBehind: false },
  { angle: 1.90, dist: 88, colorType: "yellow", baseRx: 11.5, baseRy: 6.8, baseRadius: 11.5, curveSign: -1, curveAmount: 14, delay: 0.26, duration: 0.50, isBehind: false },
  { angle: 2.50, dist: 86, colorType: "orange", baseRx: 7.5, baseRy: 4.5, baseRadius: 7.5, curveSign: 1, curveAmount: 10, delay: 0.20, duration: 0.53, isBehind: false },
  { angle: 3.55, dist: 84, colorType: "yellow", baseRx: 12.0, baseRy: 7.0, baseRadius: 12.0, curveSign: -1, curveAmount: 12, delay: 0.24, duration: 0.52, isBehind: true },
  { angle: 4.10, dist: 80, colorType: "orange", baseRx: 9.0, baseRy: 5.4, baseRadius: 9.0, curveSign: 1, curveAmount: 11, delay: 0.28, duration: 0.49, isBehind: true },
  { angle: 4.60, dist: 87, colorType: "yellow", baseRx: 13.0, baseRy: 7.5, baseRadius: 13.0, curveSign: -1, curveAmount: 13, delay: 0.16, duration: 0.54, isBehind: true },
  { angle: 5.65, dist: 90, colorType: "yellow", baseRx: 12.0, baseRy: 7.0, baseRadius: 12.0, curveSign: 1, curveAmount: 15, delay: 0.22, duration: 0.51, isBehind: false },
];

/**
 * 단일 타원과 그 뒤를 잇는 잔상 렌더링 헬퍼
 * - 시전 포켓몬보다 살짝 떨어진 곳에서 페이드 인으로 나타나서 안으로 들어감
 * - 하이라이트 없는 타원형이며, 뒤쪽일수록 투명한 잔상 유지
 */
function renderSingleStockpileOrbAndTrails(
  ctx: any,
  spec: StockpileOrbSpec,
  prog: number,
  cx: number,
  cy: number
) {
  const localT = (prog - spec.delay) / spec.duration;
  if (localT < 0.0 || localT > 1.05) return;

  // 궤적 상의 위치 계산 함수 (살짝 떨어진 출발점 -> 포켓몬 몸통 중심)
  const getOrbPos = (t: number) => {
    const clampedT = Math.min(1.0, Math.max(0, t));
    // 포켓몬 안으로 자연스럽게 빨려 들어가는 easeIn
    const easeT = Math.pow(clampedT, 1.75);

    const sx = cx + Math.cos(spec.angle) * spec.dist;
    const sy = cy + Math.sin(spec.angle) * spec.dist;

    const nx = -Math.sin(spec.angle);
    const ny = Math.cos(spec.angle);
    const arc = Math.sin(clampedT * Math.PI) * spec.curveSign * spec.curveAmount;

    const x = sx + (cx - sx) * easeT + nx * arc;
    const y = sy + (cy - sy) * easeT + ny * arc;

    return { x, y, easeT, clampedT };
  };

  // 진행 방향(헤딩) 계산 함수
  const getHeading = (t: number, curPos: { x: number; y: number }) => {
    const nextT = Math.min(1.0, t + 0.025);
    const nextPos = getOrbPos(nextT);
    const dx = nextPos.x - curPos.x;
    const dy = nextPos.y - curPos.y;
    if (Math.hypot(dx, dy) < 0.001) {
      return Math.atan2(cy - curPos.y, cx - curPos.x);
    }
    return Math.atan2(dy, dx);
  };

  // 1. 머리 타원의 상태 계산
  const headPos = getOrbPos(localT);
  const headHeading = getHeading(localT, headPos);
  const distToCenter = Math.hypot(headPos.x - cx, headPos.y - cy);

  // [유저 요구 1]: 시전 포켓몬보다 살짝 떨어진 곳에서 "페이드 인"으로 나타남
  const fadeIn = Math.min(1.0, localT / 0.28);

  // 시전 포켓몬 안으로 들어갈 때(중심 20px 이내) 몸속으로 흡수되며 축소 소멸
  let absorbScale = 1.0;
  if (distToCenter < 20) {
    absorbScale = Math.max(0, distToCenter / 20);
  }

  const headAlpha = fadeIn * absorbScale;
  const curRx = spec.baseRx * (0.65 + 0.35 * fadeIn) * absorbScale;
  const curRy = spec.baseRy * (0.65 + 0.35 * fadeIn) * absorbScale;

  if (headAlpha <= 0.01 || curRx <= 0.5 || curRy <= 0.5) return;

  // ========================================================================
  // 2. 잔상(Afterimage Trails) 렌더링
  // - "해당 구체(타원)는 잔상을 남기는데 뒤쪽일수록 투명함"
  // - 하이라이트 없는 타원형이며, 뒤쪽일수록 점차 투명해짐
  // ========================================================================
  const N_TRAILS = 6;
  const trailStep = 0.034;

  for (let k = N_TRAILS; k >= 1; k--) {
    const trailT = localT - k * trailStep;
    if (trailT < 0) continue;

    const tPos = getOrbPos(trailT);
    const tHeading = getHeading(trailT, tPos);
    const tDist = Math.hypot(tPos.x - cx, tPos.y - cy);

    let tAbsorb = 1.0;
    if (tDist < 20) {
      tAbsorb = Math.max(0, tDist / 20);
    }

    const tFadeIn = Math.min(1.0, trailT / 0.28);
    // 뒤쪽(k가 클수록) 점진적으로 투명해짐
    const trailRatio = 1.0 - k / (N_TRAILS + 1);
    const trailAlpha = headAlpha * Math.pow(trailRatio, 1.25) * 0.78 * tAbsorb * tFadeIn;
    const trailRx = spec.baseRx * (0.65 + 0.35 * trailRatio) * tAbsorb;
    const trailRy = spec.baseRy * (0.65 + 0.35 * trailRatio) * tAbsorb;

    if (trailAlpha > 0.02 && trailRx > 0.5 && trailRy > 0.5) {
      drawStockpileEllipse(ctx, tPos.x, tPos.y, trailRx, trailRy, tHeading, spec.colorType, trailAlpha);
    }
  }

  // 3. 메인 타원 렌더링 (하이라이트 없이, 진행 방향으로 회전된 타원형)
  drawStockpileEllipse(ctx, headPos.x, headPos.y, curRx, curRy, headHeading, spec.colorType, headAlpha);
}

/**
 * 254: 비축하기 전면 이펙트 렌더러
 */
export function drawStockpileEffect(
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
  const prog = frame.effectProgress ?? 0.5;

  // 시전 포켓몬 스프라이트 정중앙 좌표 (엔진의 attackerPos/casterPos는 이미 y-36 몸통 중심으로 계산되어 전달됨)
  const casterPos = drawCtx.casterPos ?? {
    x: attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)),
    y: attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)),
  };
  const cx = casterPos.x;
  const cy = casterPos.y;

  ctx.save();

  // 1. 포켓몬 앞쪽 구체들 렌더링 (사방에서 시전포켓몬 안으로 빨려 들어감)
  for (const spec of STOCKPILE_ORB_SPECS) {
    if (!spec.isBehind) {
      renderSingleStockpileOrbAndTrails(ctx, spec, prog, cx, cy);
    }
  }

  // 2. 구체들이 안으로 비축되면서 시전포켓몬 중심에서 피어나는 황금/주황 에너지 펄스
  if (prog > 0.25) {
    const pulseAlpha = Math.sin(Math.min(1.0, (prog - 0.25) / 0.75) * Math.PI) * 0.38;
    if (pulseAlpha > 0.02) {
      const pulseR = 32 + Math.sin(prog * Math.PI * 3) * 6;
      const pGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
      pGrad.addColorStop(0.0, `rgba(${STOCKPILE_COLOR_YELLOW.rgb}, ${0.55 * pulseAlpha})`);
      pGrad.addColorStop(0.55, `rgba(${STOCKPILE_COLOR_ORANGE.rgb}, ${0.28 * pulseAlpha})`);
      pGrad.addColorStop(1.0, `rgba(${STOCKPILE_COLOR_YELLOW.rgb}, 0)`);

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 254: 비축하기 후면 이펙트 렌더러 (포켓몬 등 뒤에서 날아오는 구체들)
 */
export function drawStockpileBehindEffect(
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
  const prog = frame.effectProgress ?? 0.5;

  // 시전 포켓몬 스프라이트 정중앙 좌표
  const casterPos = drawCtx.casterPos ?? {
    x: attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)),
    y: attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)),
  };
  const cx = casterPos.x;
  const cy = casterPos.y;

  ctx.save();

  // 포켓몬 뒤쪽 구체들 렌더링
  for (const spec of STOCKPILE_ORB_SPECS) {
    if (spec.isBehind) {
      renderSingleStockpileOrbAndTrails(ctx, spec, prog, cx, cy);
    }
  }

  ctx.restore();
}

// ============================================================================
// 💥 255: 토해내기 (Spit Up / はきだす) - 노말 타입 특수 공격 기술
//
// 위력: 100 * 비축 카운트 (최대 300) / 명중: 100 / PP: 10 / 대상: 상대 / 접촉: X
// 설명: 비축된 힘을 상대에게 부딪쳐서 공격한다. 비축된 만큼 위력이 올라간다.
//
// [유저 요구사항 100% 반영]:
// 1. 비축하기 반대로 재생 (비축 구체가 시전 포켓몬 중심에서 시작하여 발포)
// 2. 꾸불꾸불이 아니라 "직선으로 모였다가 퍼져 나가게"
//    - 사방에서 시전 포켓몬 중간(중심)으로 직선으로 급속 수렴 응축
//    - 중심에서 시작하여 전방으로 부채꼴 원뿔형 직선 궤적으로 시원하게 퍼져 나감
// 3. 시전 포켓몬 모션:
//    - 발포 전 잠깐 살짝 작아지면서 찌그러짐 (Squash & Shrink)
//    - 2회 연속 팍! 팍! (2연속 폭발적 발포 팽창 & 묵직한 반동)
// 4. 비축하기에서 나온 이펙트가 멀어지면서 빨간 색깔(#FF2A2A)로 부드럽게 변환
// 5. 발포 및 비행 중에는 시전 포켓몬 포커싱 (Step 1: Caster Zoom Focus)
// 6. 대상 도달 시 대상 포켓몬 포커싱 (Step 2: Target Zoom Focus)
// 7. 대상 포켓몬에게 빨간 색깔 타격 이펙트 "타다닥" (5연속 쾌속 직격 스타버스트/충격파/스파크 폭쇄)
// ============================================================================

export const SPIT_UP_COLOR_RED = {
  hex: "#FF2B2B",
  rgb: "255, 43, 43",
};

export const SPIT_UP_COLOR_DEEP_RED = {
  hex: "#C80815",
  rgb: "200, 8, 21",
};

/**
 * 진행 거리 비율(travelRatio: 0.0 ~ 1.0)에 따라
 * 비축하기 색상(노랑 #E4D249 / 주황 #EA9C63)에서 선명하고 강렬한 빨간색(#FF2B2B)으로 변환
 */
export function getSpitUpColor(
  colorType: "yellow" | "orange",
  travelRatio: number
): { rgb: string; hex: string; r: number; g: number; b: number } {
  const t = Math.min(1.0, Math.max(0, travelRatio));

  // 시작 색상 (비축하기 고유 색상)
  const startR = colorType === "yellow" ? 228 : 234;
  const startG = colorType === "yellow" ? 210 : 156;
  const startB = colorType === "yellow" ? 73 : 99;

  // 종료 색상 (선명하고 강렬한 순수 레드)
  const endR = colorType === "yellow" ? 255 : 235;
  const endG = colorType === "yellow" ? 35 : 20;
  const endB = colorType === "yellow" ? 35 : 25;

  // 비행 초반에는 비축 색상을 유지하다가 멀어지면서 점차 빨간색으로 가속 전환
  const curveT = Math.pow(t, 1.25);

  const r = Math.round(startR + (endR - startR) * curveT);
  const g = Math.round(startG + (endG - startG) * curveT);
  const b = Math.round(startB + (endB - startB) * curveT);

  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  const rgb = `${r}, ${g}, ${b}`;

  return { rgb, hex, r, g, b };
}

/**
 * 토해내기 타원형 오브 렌더러 (비축하기 타원 디자인 계승 + 실시간 변환 색상 반영)
 */
export function drawSpitUpEllipse(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation: number,
  color: { rgb: string; hex?: string },
  alpha: number = 1.0
) {
  if (rx <= 0.5 || ry <= 0.5 || alpha <= 0.01) return;
  const a = Math.min(1.0, Math.max(0, alpha));

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // 1. 외곽 은은한 소프트 오라 (변환 색상 고유 발광)
  const auraRx = rx * 1.50;
  const auraRy = ry * 1.50;
  const auraGrad = ctx.createRadialGradient(0, 0, Math.min(rx, ry) * 0.35, 0, 0, Math.max(auraRx, auraRy));
  auraGrad.addColorStop(0.0, `rgba(${color.rgb}, ${0.42 * a})`);
  auraGrad.addColorStop(0.60, `rgba(${color.rgb}, ${0.16 * a})`);
  auraGrad.addColorStop(1.0, `rgba(${color.rgb}, 0)`);

  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, auraRx, auraRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 타원형 본체 (하이라이트 없이 순수한 변환 색상으로 채움)
  const maxR = Math.max(rx, ry);
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
  coreGrad.addColorStop(0.00, `rgba(${color.rgb}, ${0.98 * a})`);
  coreGrad.addColorStop(0.85, `rgba(${color.rgb}, ${0.92 * a})`);
  coreGrad.addColorStop(1.00, `rgba(${color.rgb}, 0.0)`);

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export interface SpitUpStreamSpec {
  wave: 1 | 2;             // 1차 발포 (Pop 1) 또는 2차 발포 (Pop 2)
  angleOffset: number;     // 메인 비행 각도로부터의 확산 오프셋 (라디안)
  speedMult: number;       // 탄속 배율
  colorType: "yellow" | "orange";
  baseRx: number;          // 타원 장축
  baseRy: number;          // 타원 단축
  delay: number;           // 발포 지연 (wave 1: ~0.22, wave 2: ~0.44)
  isBehind: boolean;       // 포켓몬 뒤쪽 레이어 여부
}

/**
 * 2연속 "팍! 팍!" 발포 시 시전 포켓몬 중간에서 전방으로 퍼져 나가는 직선 궤적 데이터
 */
export const SPIT_UP_STREAM_SPECS: SpitUpStreamSpec[] = [
  // 1차 "팍" 발포 (Wave 1: prog 0.22 시점)
  { wave: 1, angleOffset: 0.00, speedMult: 1.18, colorType: "yellow", baseRx: 13.5, baseRy: 6.8, delay: 0.22, isBehind: false },
  { wave: 1, angleOffset: -0.12, speedMult: 1.08, colorType: "orange", baseRx: 9.5, baseRy: 5.0, delay: 0.23, isBehind: false },
  { wave: 1, angleOffset: 0.14, speedMult: 1.10, colorType: "yellow", baseRx: 12.8, baseRy: 6.4, delay: 0.24, isBehind: false },
  { wave: 1, angleOffset: -0.24, speedMult: 0.98, colorType: "orange", baseRx: 8.8, baseRy: 4.6, delay: 0.25, isBehind: true },
  { wave: 1, angleOffset: 0.23, speedMult: 1.02, colorType: "yellow", baseRx: 11.8, baseRy: 6.0, delay: 0.25, isBehind: false },
  { wave: 1, angleOffset: -0.06, speedMult: 1.14, colorType: "yellow", baseRx: 14.0, baseRy: 7.0, delay: 0.23, isBehind: false },
  { wave: 1, angleOffset: 0.08, speedMult: 1.12, colorType: "orange", baseRx: 9.8, baseRy: 5.2, delay: 0.24, isBehind: true },

  // 2차 "팍" 발포 (Wave 2: prog 0.44 시점) - 더 밀도 높고 강력한 폭발
  { wave: 2, angleOffset: 0.00, speedMult: 1.28, colorType: "yellow", baseRx: 15.0, baseRy: 7.5, delay: 0.44, isBehind: false },
  { wave: 2, angleOffset: -0.16, speedMult: 1.20, colorType: "yellow", baseRx: 13.5, baseRy: 6.8, delay: 0.45, isBehind: false },
  { wave: 2, angleOffset: 0.18, speedMult: 1.18, colorType: "orange", baseRx: 9.5, baseRy: 5.0, delay: 0.46, isBehind: false },
  { wave: 2, angleOffset: -0.30, speedMult: 1.05, colorType: "yellow", baseRx: 12.2, baseRy: 6.2, delay: 0.47, isBehind: true },
  { wave: 2, angleOffset: 0.31, speedMult: 1.04, colorType: "orange", baseRx: 9.0, baseRy: 4.8, delay: 0.47, isBehind: false },
  { wave: 2, angleOffset: -0.08, speedMult: 1.25, colorType: "orange", baseRx: 10.2, baseRy: 5.4, delay: 0.45, isBehind: false },
  { wave: 2, angleOffset: 0.10, speedMult: 1.22, colorType: "yellow", baseRx: 14.2, baseRy: 7.2, delay: 0.46, isBehind: true },
];

/**
 * 직선 모으기 연출 (prog 0.0 ~ 0.22)
 * 사방에서 시전 포켓몬 중간으로 직선으로 급속 수렴 응축
 */
function renderSpitUpGathering(
  ctx: any,
  prog: number,
  cx: number,
  cy: number,
  isBehind: boolean
) {
  if (prog >= 0.22) return;
  const inT = Math.min(1.0, prog / 0.19);
  const gatherAlpha = Math.sin(inT * Math.PI) * 0.88;
  if (gatherAlpha <= 0.02) return;

  const N_GATHER = 10;
  for (let i = 0; i < N_GATHER; i++) {
    const behind = i % 3 === 0;
    if (behind !== isBehind) continue;

    const angle = (i / N_GATHER) * Math.PI * 2 + 0.2;
    const startDist = 55;
    const dist = startDist * (1.0 - inT);

    const gx = cx + Math.cos(angle) * dist;
    const gy = cy + Math.sin(angle) * dist;

    const colorType = i % 2 === 0 ? "yellow" : "orange";
    const col = colorType === "yellow" ? STOCKPILE_COLOR_YELLOW : STOCKPILE_COLOR_ORANGE;

    drawSpitUpEllipse(
      ctx,
      gx,
      gy,
      8.5 * (1.0 - inT * 0.3),
      4.5 * (1.0 - inT * 0.3),
      angle + Math.PI,
      col,
      gatherAlpha
    );
  }

  // 시전 포켓몬 중간에 응축되는 발포 핵
  if (!isBehind) {
    const coreR = 6 + inT * 12;
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    coreGrad.addColorStop(0.0, `rgba(255, 255, 210, ${0.9 * gatherAlpha})`);
    coreGrad.addColorStop(0.45, `rgba(${STOCKPILE_COLOR_YELLOW.rgb}, ${0.7 * gatherAlpha})`);
    coreGrad.addColorStop(0.85, `rgba(${STOCKPILE_COLOR_ORANGE.rgb}, ${0.35 * gatherAlpha})`);
    coreGrad.addColorStop(1.0, "rgba(234, 156, 99, 0)");

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 단일 발포 스트림 타원 및 직선 잔상 렌더링
 * 시전 포켓몬 중간에서 시작하여 전방으로 직선으로 퍼져 나가며 빨간색으로 변환
 */
function renderSpitUpStreamParticle(
  ctx: any,
  spec: SpitUpStreamSpec,
  prog: number,
  cx: number,
  cy: number,
  tx: number,
  ty: number
) {
  if (prog < spec.delay) return;

  const totalDist = Math.hypot(tx - cx, ty - cy);
  const mainAngle = Math.atan2(ty - cy, tx - cx);
  const heading = mainAngle + spec.angleOffset;

  const flightDuration = 1.0 - spec.delay;
  const flightT = (prog - spec.delay) / flightDuration;
  if (flightT < 0.0 || flightT > 1.25) return;

  // 직선 가속 비행 (곡률 전혀 없음)
  const easeFlight = Math.pow(flightT, 1.15) * spec.speedMult * 1.35;
  const curDist = totalDist * easeFlight;

  // 멀어짐에 따른 진행률 (0.0 ~ 1.0)
  const travelRatio = Math.min(1.0, curDist / (totalDist * 0.88));

  const hx = cx + Math.cos(heading) * curDist;
  const hy = cy + Math.sin(heading) * curDist;

  // 멀어지며 노랑/주황에서 선명한 빨간색으로 변환된 색상 산출
  const headColor = getSpitUpColor(spec.colorType, travelRatio);

  const fadeOut = curDist > totalDist * 1.05 ? Math.max(0, 1.0 - (curDist - totalDist * 1.05) / 40) : 1.0;
  const headAlpha = Math.min(1.0, flightT * 3.5) * fadeOut;
  if (headAlpha <= 0.01) return;

  // 직선 잔상 (Afterimage Trails)
  const N_TRAILS = 6;
  const trailStepPx = 11 * spec.speedMult;

  for (let k = N_TRAILS; k >= 1; k--) {
    const tDist = curDist - k * trailStepPx;
    if (tDist <= 0) continue;

    const txPos = cx + Math.cos(heading) * tDist;
    const tyPos = cy + Math.sin(heading) * tDist;

    const tRatio = Math.min(1.0, tDist / (totalDist * 0.88));
    const tColor = getSpitUpColor(spec.colorType, tRatio);

    const trailRatio = 1.0 - k / (N_TRAILS + 1);
    const trailAlpha = headAlpha * Math.pow(trailRatio, 1.25) * 0.72;
    const trailRx = spec.baseRx * (0.65 + 0.35 * trailRatio);
    const trailRy = spec.baseRy * (0.65 + 0.35 * trailRatio);

    if (trailAlpha > 0.02 && trailRx > 0.5 && trailRy > 0.5) {
      drawSpitUpEllipse(ctx, txPos, tyPos, trailRx, trailRy, heading, tColor, trailAlpha);
    }
  }

  // 메인 머리 타원
  drawSpitUpEllipse(ctx, hx, hy, spec.baseRx, spec.baseRy, heading, headColor, headAlpha);
}

export interface SpitUpHitPoint {
  hitIdx: number;
  triggerProg: number; // Step 2 진행도 (0.0 ~ 1.0)
  dx: number;
  dy: number;
  scale: number;
  name: string;
}

/**
 * 대상 포켓몬 타격 이펙트 "타다닥" (5연속 쾌속 직격)
 */
export const SPIT_UP_HIT_POINTS: SpitUpHitPoint[] = [
  { hitIdx: 1, triggerProg: 0.08, dx: -15, dy: -18, scale: 0.88, name: "타" },
  { hitIdx: 2, triggerProg: 0.24, dx: 17, dy: -8, scale: 0.92, name: "다" },
  { hitIdx: 3, triggerProg: 0.40, dx: -12, dy: 14, scale: 0.90, name: "닥" },
  { hitIdx: 4, triggerProg: 0.56, dx: 14, dy: -22, scale: 0.96, name: "타" },
  { hitIdx: 5, triggerProg: 0.72, dx: 0, dy: -6, scale: 1.40, name: "닥 (피날레 직격 폭쇄)" },
];

/**
 * 단일 빨간 색깔 타격 이펙트 렌더러
 * - [유저 요청 엄수]: 링 제거, 점/스파크 파티클 제거, 타격 보더(stroke) 제거!
 * - 코어 레드 발광 플래시 버스트 & 순수 레드 채움 스타버스트
 */
function drawSingleRedHitImpact(
  ctx: any,
  hit: SpitUpHitPoint,
  step2Prog: number,
  tx: number,
  ty: number
) {
  const windowDuration = 0.36;
  const localT = (step2Prog - hit.triggerProg) / windowDuration;
  if (localT < 0.0 || localT > 1.0) return;

  const alpha = Math.max(0, 1.0 - localT);
  if (alpha <= 0.01) return;

  const hx = tx + hit.dx;
  const hy = ty + hit.dy;
  const scale = hit.scale;
  const isFinale = hit.hitIdx === 5;

  ctx.save();

  // [유저 요청 엄수]: 타격 이펙트에서 원형 발광 글로우(flashGrad) 완전 제거!
  // 날카롭고 선명한 순수 레드 스타버스트 (글로우/보더 없음)
  const numPoints = isFinale ? 12 : 8;
  const outerR = (20 + localT * 26) * scale;
  const innerR = outerR * (isFinale ? 0.35 : 0.30);

  ctx.translate(hx, hy);
  ctx.rotate(localT * 0.45 + hit.hitIdx * 0.5);

  ctx.beginPath();
  const step = Math.PI / numPoints;
  for (let i = 0; i < numPoints * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = i * step - Math.PI / 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // 글로우 없이 깔끔하고 선명한 순수 레드 솔리드 채움
  ctx.fillStyle = `rgba(255, 38, 38, ${0.95 * alpha})`;
  ctx.fill();

  ctx.restore();
}

/**
 * 255: 토해내기 전면 이펙트 렌더러
 */
export function drawSpitUpEffect(
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
  const prog = frame.effectProgress ?? 0.5;

  const casterPos = drawCtx.casterPos ?? {
    x: attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)),
    y: attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)),
  };
  const cx = casterPos.x;
  const cy = casterPos.y;

  const targetOffset = !isP ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
  const tx = targetPos.x + targetOffset.x;
  const ty = targetPos.y + targetOffset.y;

  ctx.save();

  // Step 1: 시전자 포커싱 구간 (직선 모으기 ➔ 발포 ➔ 멀어지며 빨간색 변환)
  if (step === 1) {
    renderSpitUpGathering(ctx, prog, cx, cy, false);

    for (const spec of SPIT_UP_STREAM_SPECS) {
      if (!spec.isBehind) {
        renderSpitUpStreamParticle(ctx, spec, prog, cx, cy, tx, ty);
      }
    }
  }

  // Step 2: 대상 포커싱 구간 (빨간 색깔 타격 이펙트 타다닥!)
  else if (step === 2) {
    for (const hit of SPIT_UP_HIT_POINTS) {
      drawSingleRedHitImpact(ctx, hit, prog, tx, ty);
    }
  }

  ctx.restore();
}

/**
 * 255: 토해내기 후면 이펙트 렌더러 (포켓몬 등 뒤 레이어)
 */
export function drawSpitUpBehindEffect(
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
  const prog = frame.effectProgress ?? 0.5;

  const casterPos = drawCtx.casterPos ?? {
    x: attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)),
    y: attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)),
  };
  const cx = casterPos.x;
  const cy = casterPos.y;

  const targetOffset = !isP ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
  const tx = targetPos.x + targetOffset.x;
  const ty = targetPos.y + targetOffset.y;

  ctx.save();

  if (step === 1) {
    renderSpitUpGathering(ctx, prog, cx, cy, true);

    for (const spec of SPIT_UP_STREAM_SPECS) {
      if (spec.isBehind) {
        renderSpitUpStreamParticle(ctx, spec, prog, cx, cy, tx, ty);
      }
    }
  }

  ctx.restore();
}

// ============================================================================
// 256: 꿀꺽 (Swallow)
// ============================================================================
// [유저 요구사항 100% 반영]:
// 1. 세로로 길어졌다가 아래로 꾹 눌러짐 (스프라이트 모션: 스트레치 후 강력한 스쿼시)
// 2. 위로 비축하기 이펙트가 위로 올라가는데 색깔이 하늘 파란 색깔임 (#38BDF8 / #7DD3FC)
// 3. 직선 위로 올라감 (곡선/회전 없이 순수 수직 직선 궤적으로 상승하며 다단계 잔상 유지)
// ============================================================================

export const SWALLOW_COLOR_SKYBLUE = {
  hex: "#38BDF8",
  rgb: "56, 189, 248",
};

export const SWALLOW_COLOR_LIGHTSKY = {
  hex: "#7DD3FC",
  rgb: "125, 211, 252",
};

/**
 * 꿀꺽 하늘빛 타원형 오브 렌더러
 * - 비축하기 타원(drawStockpileEllipse) 구조 계승: 하이라이트 없이 고유의 선명한 하늘빛 색상 및 부드러운 오라
 */
export function drawSwallowEllipse(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation: number,
  colorType: "skyblue" | "lightsky",
  alpha: number = 1.0
) {
  if (rx <= 0.5 || ry <= 0.5 || alpha <= 0.01) return;
  const col = colorType === "skyblue" ? SWALLOW_COLOR_SKYBLUE : SWALLOW_COLOR_LIGHTSKY;
  const a = Math.min(1.0, Math.max(0, alpha));

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // 1. 외곽 은은한 소프트 오라 (하이라이트 없이 하늘빛 고유 색상의 부드러운 발광)
  const auraRx = rx * 1.45;
  const auraRy = ry * 1.45;
  const auraGrad = ctx.createRadialGradient(0, 0, Math.min(rx, ry) * 0.35, 0, 0, Math.max(auraRx, auraRy));
  auraGrad.addColorStop(0.0, `rgba(${col.rgb}, ${0.35 * a})`);
  auraGrad.addColorStop(0.60, `rgba(${col.rgb}, ${0.14 * a})`);
  auraGrad.addColorStop(1.0, `rgba(${col.rgb}, 0)`);

  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, auraRx, auraRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 타원형 본체 (하이라이트 없이 순수한 고유 색상으로 깔끔하게 채움)
  const maxR = Math.max(rx, ry);
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
  coreGrad.addColorStop(0.00, `rgba(${col.rgb}, ${0.98 * a})`);
  coreGrad.addColorStop(0.85, `rgba(${col.rgb}, ${0.92 * a})`);
  coreGrad.addColorStop(1.00, `rgba(${col.rgb}, 0.0)`);

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export interface SwallowOrbSpec {
  offsetX: number;     // 시전 포켓몬 기준 X 오프셋 (수직 직선)
  startY: number;      // 시작 Y 오프셋 (몸체 내부/하단에서 시작)
  riseDist: number;    // 직선 위로 올라가는 거리 (65 ~ 95px)
  colorType: "skyblue" | "lightsky";
  baseRx: number;      // 타원 세로 길이 / 장축 (11 ~ 14px)
  baseRy: number;      // 타원 가로 폭 / 단축 (5.5 ~ 7.5px)
  riseDelay: number;   // 상승 시작 (0.14 ~ 0.34)
  riseDur: number;     // 상승 소요 시간 (0.18)
  fallDelay: number;   // 하강 시작 (0.52 ~ 0.70)
  fallDur: number;     // 하강 소요 시간 (0.18)
  isBehind: boolean;   // 포켓몬 뒤쪽 레이어 여부
}

/**
 * 꿀꺽 시전 시 위로 올라갔다가 다시 내려오는 하늘 파란 색깔 비축하기 오브 스펙
 * - [유저 요구사항 100% 반영]:
 *   1. 올라가는 거 완전 재생 (0.12 ~ 0.42): 모든 오브가 위로 솟아오름
 *   2. 상공 체류 (0.36 ~ 0.44): 상공에서 대기
 *   3. 내려오는 거 완전 재생 (0.44 ~ 0.73): 모든 오브가 아래로 내려와 몸속으로 완전히 들어감
 *   4. 완전히 끝난 후 안착 (0.73 ~ 1.00): 공중에 아무것도 없는 상태에서 포켓몬 안착 후 Step 2 회복 시작
 */
export const SWALLOW_ORB_SPECS: SwallowOrbSpec[] = [
  { offsetX: -20, startY: 8,  riseDist: 75, colorType: "skyblue",  baseRx: 11.5, baseRy: 6.0, riseDelay: 0.12, riseDur: 0.16, fallDelay: 0.44, fallDur: 0.15, isBehind: false },
  { offsetX:  18, startY: 6,  riseDist: 70, colorType: "lightsky", baseRx: 9.0,  baseRy: 4.8, riseDelay: 0.15, riseDur: 0.16, fallDelay: 0.47, fallDur: 0.15, isBehind: true },
  { offsetX:  -8, startY: 12, riseDist: 82, colorType: "skyblue",  baseRx: 12.5, baseRy: 6.8, riseDelay: 0.18, riseDur: 0.16, fallDelay: 0.50, fallDur: 0.15, isBehind: false },
  { offsetX:  22, startY: 4,  riseDist: 74, colorType: "lightsky", baseRx: 9.5,  baseRy: 5.0, riseDelay: 0.20, riseDur: 0.16, fallDelay: 0.52, fallDur: 0.15, isBehind: false },
  { offsetX: -14, startY: 10, riseDist: 78, colorType: "skyblue",  baseRx: 12.0, baseRy: 6.2, riseDelay: 0.22, riseDur: 0.16, fallDelay: 0.54, fallDur: 0.15, isBehind: true },
  { offsetX:   6, startY: 14, riseDist: 85, colorType: "skyblue",  baseRx: 13.0, baseRy: 7.0, riseDelay: 0.24, riseDur: 0.16, fallDelay: 0.56, fallDur: 0.15, isBehind: false },
  { offsetX:  -2, startY: 8,  riseDist: 72, colorType: "lightsky", baseRx: 9.0,  baseRy: 4.8, riseDelay: 0.26, riseDur: 0.16, fallDelay: 0.58, fallDur: 0.15, isBehind: false },
];

/**
 * 단일 하늘빛 타원 오브 및 다단계 잔상(Trail) 렌더러
 * - [상승/하강 분리 원칙]:
 *   상승 구간(rise)에서는 위로만 올라가고, 하강 구간(fall)에서는 아래로만 내려옴
 */
function renderSingleSwallowOrbAndTrails(
  ctx: any,
  spec: SwallowOrbSpec,
  prog: number,
  cx: number,
  cy: number
) {
  // 1. 아직 상승 전
  if (prog < spec.riseDelay) return;

  const curX = cx + spec.offsetX;
  const N_TRAILS = 4;

  // 2. [상승 단계]: 위로 올라가는 거 재생 (prog: riseDelay ~ riseDelay + riseDur)
  if (prog < spec.riseDelay + spec.riseDur) {
    const t = (prog - spec.riseDelay) / spec.riseDur;
    const clampedT = Math.min(1.0, Math.max(0.0, t));
    const easeT = Math.sin(clampedT * Math.PI * 0.5); // 부드러운 감속 상승
    const curY = cy + spec.startY - spec.riseDist * easeT;
    const heading = -Math.PI / 2; // 수직 상향

    const fadeIn = Math.min(1.0, clampedT / 0.20);
    const headAlpha = fadeIn * 0.95;
    if (headAlpha <= 0.01) return;

    // 상승 잔상: 진행 방향 뒤쪽(아래쪽)으로 잔상 배치
    for (let k = N_TRAILS; k >= 1; k--) {
      const trailT = clampedT - k * 0.06;
      if (trailT <= 0.0) continue;
      const tEase = Math.sin(trailT * Math.PI * 0.5);
      const tY = cy + spec.startY - spec.riseDist * tEase;
      const trailRatio = 1.0 - k / (N_TRAILS + 1);
      const trailAlpha = headAlpha * Math.pow(trailRatio, 1.25) * 0.72;
      drawSwallowEllipse(ctx, curX, tY, spec.baseRx * 0.85, spec.baseRy * 0.85, heading, spec.colorType, trailAlpha);
    }

    drawSwallowEllipse(ctx, curX, curY, spec.baseRx, spec.baseRy, heading, spec.colorType, headAlpha);
    return;
  }

  // 3. [상공 체류 단계]: 상승 완료 후 하강 시작 전까지 상공에서 대기 (prog: riseEnd ~ fallDelay)
  if (prog < spec.fallDelay) {
    const curY = cy + spec.startY - spec.riseDist;
    const heading = -Math.PI / 2;
    const hoverPulse = 0.92 + 0.08 * Math.sin(prog * Math.PI * 6);
    drawSwallowEllipse(ctx, curX, curY, spec.baseRx * hoverPulse, spec.baseRy * hoverPulse, heading, spec.colorType, 0.92);
    return;
  }

  // 4. [하강 단계]: 내려오는 거 재생 (prog: fallDelay ~ fallDelay + fallDur)
  if (prog < spec.fallDelay + spec.fallDur) {
    const t = (prog - spec.fallDelay) / spec.fallDur;
    const clampedT = Math.min(1.0, Math.max(0.0, t));
    const easeT = 1.0 - Math.cos(clampedT * Math.PI * 0.5); // 몸체로 가속 하강
    const curY = (cy + spec.startY - spec.riseDist) + spec.riseDist * easeT;
    const heading = Math.PI / 2; // 수직 하향

    const fadeOut = Math.min(1.0, (1.0 - clampedT) / 0.20);
    const headAlpha = fadeOut * 0.95;
    if (headAlpha <= 0.01) return;

    // 하강 잔상: 진행 방향 뒤쪽(위쪽)으로 잔상 배치
    for (let k = N_TRAILS; k >= 1; k--) {
      const trailT = clampedT - k * 0.06;
      if (trailT <= 0.0) continue;
      const tEase = 1.0 - Math.cos(trailT * Math.PI * 0.5);
      const tY = (cy + spec.startY - spec.riseDist) + spec.riseDist * tEase;
      const trailRatio = 1.0 - k / (N_TRAILS + 1);
      const trailAlpha = headAlpha * Math.pow(trailRatio, 1.25) * 0.72;
      drawSwallowEllipse(ctx, curX, tY, spec.baseRx * 0.85, spec.baseRy * 0.85, heading, spec.colorType, trailAlpha);
    }

    drawSwallowEllipse(ctx, curX, curY, spec.baseRx, spec.baseRy, heading, spec.colorType, headAlpha);
    return;
  }

  // 5. 하강 완료 후 몸속 흡수 소멸 (prog >= fallDelay + fallDur)
}

/**
 * 256: 꿀꺽 전면 이펙트 렌더러
 */
export function drawSwallowEffect(
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
  const prog = frame.effectProgress ?? 0.5;

  const casterPos = drawCtx.casterPos ?? {
    x: attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)),
    y: attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)),
  };
  const cx = casterPos.x;
  const cy = casterPos.y;

  ctx.save();

  // Step 1: 비축하기 이펙트 상승 & 하강 복귀
  if (step === 1) {
    for (const spec of SWALLOW_ORB_SPECS) {
      if (!spec.isBehind) {
        renderSingleSwallowOrbAndTrails(ctx, spec, prog, cx, cy);
      }
    }
  }
  // Step 2: HP 회복 이펙트 (회복별 나선 상승 & 체표면 치유 광채)
  else if (step === 2) {
    drawRecoveryStarSpiral(ctx, cx, cy - 10, prog);
  }

  ctx.restore();
}

/**
 * 256: 꿀꺽 후면 이펙트 렌더러 (포켓몬 등 뒤 레이어)
 */
export function drawSwallowBehindEffect(
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
  const prog = frame.effectProgress ?? 0.5;

  const casterPos = drawCtx.casterPos ?? {
    x: attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)),
    y: attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)),
  };
  const cx = casterPos.x;
  const cy = casterPos.y;

  ctx.save();

  if (step === 1) {
    for (const spec of SWALLOW_ORB_SPECS) {
      if (spec.isBehind) {
        renderSingleSwallowOrbAndTrails(ctx, spec, prog, cx, cy);
      }
    }
  }

  ctx.restore();
}



