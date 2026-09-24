// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawStarburstImpact } from "../common/helpers.js";

/**
 * 🌟 5각 별 외곽 패스 생성 함수 (5-Pointed Star Path)
 */
export function pathFivePointStar(
  ctx: any,
  outerRadius: number,
  innerRadius: number
) {
  ctx.beginPath();
  const step = Math.PI / 5; // 36도 간격
  let rot = -Math.PI / 2; // 상단 12시 꼭짓점부터 시작

  for (let i = 0; i < 5; i++) {
    const x1 = Math.cos(rot) * outerRadius;
    const y1 = Math.sin(rot) * outerRadius;
    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);
    rot += step;

    const x2 = Math.cos(rot) * innerRadius;
    const y2 = Math.sin(rot) * innerRadius;
    ctx.lineTo(x2, y2);
    rot += step;
  }
  ctx.closePath();
}

/**
 * ✨ 4각 다이아몬드 십자별 패스 생성 함수 (4-Pointed Diamond Sparkle Star)
 * - 원작 5세대 스피드스타의 찬란한 다이아몬드 십자 반짝이 고증
 */
export function pathDiamondSparkle(
  ctx: any,
  rx: number,
  ry: number
) {
  ctx.beginPath();
  ctx.moveTo(0, -ry); // 상단 뾰족
  ctx.lineTo(rx * 0.22, -ry * 0.22);
  ctx.lineTo(rx, 0); // 우측 뾰족
  ctx.lineTo(rx * 0.22, ry * 0.22);
  ctx.lineTo(0, ry); // 하단 뾰족
  ctx.lineTo(-rx * 0.22, ry * 0.22);
  ctx.lineTo(-rx, 0); // 좌측 뾰족
  ctx.lineTo(-rx * 0.22, -ry * 0.22);
  ctx.closePath();
}

/**
 * 🌟 포켓몬스터 정통 순수 5각 별 렌더러 (Crisp Borderless 5-Pointed Star)
 * - 테두리(border) 없음, 그라데이션 없음, 솔리드 단색 플랫 채우기
 */
export function drawCartoonSwiftStar(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  rotation: number = 0,
  alpha: number = 1.0,
  color: string = "#F1E949"
) {
  if (alpha <= 0.01 || size <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const outerR = size;
  const innerR = size * 0.44;

  ctx.fillStyle = color;
  pathFivePointStar(ctx, outerR, innerR);
  ctx.fill();

  ctx.restore();
}

/**
 * ✨ 4각 다이아몬드 십자별 렌더러 (Sparkle Diamond Cross Star)
 * - 원작 스피드스타의 궤적을 잇는 찬란한 십자 반짝이 별
 * - 테두리 없음, 순수 솔리드 플랫 채우기 (#FFFFFF, #FFF67A, #F1E949)
 */
export function drawDiamondSparkleStar(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  rotation: number = 0,
  alpha: number = 1.0,
  color: string = "#FFFFFF"
) {
  if (alpha <= 0.01 || size <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  ctx.fillStyle = color;
  // 세로가 약간 더 날렵하고 샤프한 다이아몬드 십자 형태
  pathDiamondSparkle(ctx, size * 0.78, size * 1.18);
  ctx.fill();

  ctx.restore();
}

// 6개 메인 별의 균등 분할 각도 (60도 간격)
const STAR_ANGLES_6 = [
  0,
  (Math.PI * 2) / 6,
  ((Math.PI * 2) / 6) * 2,
  ((Math.PI * 2) / 6) * 3,
  ((Math.PI * 2) / 6) * 4,
  ((Math.PI * 2) / 6) * 5,
];

// 6개 별의 교차 배색 (#F1E949와 더 밝은 레몬빛 #FFF67A)
const STAR_COLORS_6 = [
  "#F1E949",
  "#FFF67A",
  "#F1E949",
  "#FFF67A",
  "#F1E949",
  "#FFF67A",
];

// 시전자 둘레 궤도 보조 십자별 각도 (메인 별 사이)
const SPARKLE_ANGLES_4 = [
  Math.PI * 0.25,
  Math.PI * 0.75,
  Math.PI * 1.25,
  Math.PI * 1.75,
];

const ARC_CONFIGS_6 = [-13, 11, -6, 10, -4, 8];

/**
 * 🌟 시전자 주변 3D 지속 회전 및 대각선 스타 스트림(Star Stream) 렌더러
 * - [유저 피드백]: 시작부터 별 5개 이상 배치, 발사 중에도 시전자 둘레에서 계속 회전 유지
 * - [유저 피드백]: 좀 더 촘촘하게 발사, 발사되는 선(스피드라인) 별쪽은 반투명 끝쪽은 투명
 */
function drawSwiftOrbitAndStream(
  ctx: any,
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  spinAngle: number,
  launchProg: number, // 0.0 미만이면 순수 회전, 0.0 ~ 1.0이면 발사 진행
  layer: "behind" | "front"
) {
  const rx = 42;
  const ry = 18;
  const orbitTilt = -0.15; // 3D 경사각

  // ==========================================================================
  // 1. 시전자 주변 메인 6개 별 & 궤도 보조 십자별 렌더링
  // ==========================================================================
  for (let i = 0; i < 6; i++) {
    const starColor = STAR_COLORS_6[i];
    let isLaunched = false;
    let flightT = 0;

    // 0~4번 별은 순차 발사되고 (더 촘촘한 간격 0.085), 6번째(5번) 별은 발사 중에도 계속 회전!
    if (launchProg >= 0 && i < 5) {
      const startT = i * 0.085; // 0.00, 0.085, 0.170, 0.255, 0.340 (촘촘한 간격)
      const duration = 0.40;
      const rawT = (launchProg - startT) / duration;
      if (rawT > 0) {
        isLaunched = true;
        flightT = rawT;
      }
    }

    if (!isLaunched) {
      // ----------------------------------------------------------------------
      // [시전자 주변 반시계 지속 회전]
      // ----------------------------------------------------------------------
      const currentAngle = -(STAR_ANGLES_6[i] + spinAngle);

      const unrotatedX = Math.cos(currentAngle) * rx;
      const unrotatedY = Math.sin(currentAngle) * ry;

      const rotX = unrotatedX * Math.cos(orbitTilt) - unrotatedY * Math.sin(orbitTilt);
      const rotY = unrotatedX * Math.sin(orbitTilt) + unrotatedY * Math.cos(orbitTilt);

      const isFront = unrotatedY >= -1.0;
      if (layer === "behind" && isFront) continue;
      if (layer === "front" && !isFront) continue;

      const depthScale = isFront ? 1.15 : 0.85;
      const starSize = 12 * depthScale;

      // 메인 5각 별
      drawCartoonSwiftStar(
        ctx,
        cx + rotX,
        cy + rotY,
        starSize,
        currentAngle * 2.2,
        1.0,
        starColor
      );
    } else {
      // ----------------------------------------------------------------------
      // [적을 향해 쇄도 비행하는 촘촘한 스타 스트림] (시전자 앞 레이어에 렌더링)
      // ----------------------------------------------------------------------
      if (layer === "behind") continue;

      // 발사 시점의 궤도 이탈 위치
      const launchAngle = -(STAR_ANGLES_6[i] + spinAngle - flightT * 0.8);
      const startX = cx + Math.cos(launchAngle) * 28;
      const startY = cy + Math.sin(launchAngle) * 12;

      // A. 비행 중인 별 (flightT <= 1.0)
      if (flightT <= 1.0) {
        const arcOffset = Math.sin(flightT * Math.PI) * ARC_CONFIGS_6[i];
        const curX = startX + (tx - startX) * flightT;
        const curY = startY + (ty - startY) * flightT + arcOffset;

        // 1) [유저 피드백] 발사되는 선: 별쪽은 반투명(0.65), 끝쪽은 투명(0.0)
        const prevT = Math.max(0, flightT - 0.16);
        const prevX = startX + (tx - startX) * prevT;
        const prevY = startY + (ty - startY) * prevT + Math.sin(prevT * Math.PI) * ARC_CONFIGS_6[i];

        ctx.save();
        const lineGrad = ctx.createLinearGradient(prevX, prevY, curX, curY);
        const rgb = starColor === "#F1E949" ? "241, 233, 73" : "255, 246, 122";
        lineGrad.addColorStop(0.0, `rgba(${rgb}, 0.0)`);   // 끝쪽(꼬리): 완전 투명
        lineGrad.addColorStop(0.5, `rgba(${rgb}, 0.22)`);  // 중간: 은은한 페이드
        lineGrad.addColorStop(1.0, `rgba(${rgb}, 0.65)`);  // 별쪽(머리): 반투명
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(curX, curY);
        ctx.stroke();
        ctx.restore();

        // 2) 메인 5각 별 (자전 비행, 크기 13px)
        const starRot = flightT * Math.PI * 5 + i * 1.2;
        drawCartoonSwiftStar(ctx, curX, curY, 13, starRot, 1.0, starColor);

        // 3) [유저 피드백] 더욱 촘촘해진 4각 다이아몬드 십자별 무리 (Star Stream)
        // 메인 별 사이를 촘촘하게 채워주는 5개의 십자 반짝이 별
        const sparkleOffsets = [
          { dt: -0.03, lateral: 4, size: 7.5, color: "#FFFFFF" },
          { dt: -0.06, lateral: -5, size: 8.5, color: "#FFF67A" },
          { dt: -0.09, lateral: 3, size: 6.5, color: "#FFFFFF" },
          { dt: -0.12, lateral: -4, size: 6.0, color: "#FFF67A" },
          { dt: -0.16, lateral: 1, size: 5.0, color: "#FFFFFF" },
        ];

        for (const sp of sparkleOffsets) {
          const sT = flightT + sp.dt;
          if (sT > 0.02 && sT < 1.0) {
            const sArc = Math.sin(sT * Math.PI) * ARC_CONFIGS_6[i] + sp.lateral;
            const sx = startX + (tx - startX) * sT;
            const sy = startY + (ty - startY) * sT + sArc;
            const sRot = sT * Math.PI * 4 + i;
            drawDiamondSparkleStar(ctx, sx, sy, sp.size, sRot, 0.95, sp.color);
          }
        }
      } else if (flightT >= 1.0 && flightT < 1.45) {
        // B. ★ [유저 피드백] 별이 상대방에게 닿을 때마다 파동처럼 터지는 (커지는 노란 링)! ★
        const ringProg = (flightT - 1.0) / 0.45; // 0.0 ~ 1.0 (착탄 후 팽창 진행률)
        const easeOut = 1 - Math.pow(1 - ringProg, 2); // 급속 팽창 후 부드러운 감속
        const ringRadius = 8 + easeOut * 34; // 모든 별 동일하게 8px -> 42px로 깔끔하게 퍼지는 노란 링
        const ringAlpha = Math.max(0, 1.0 - ringProg * 0.95);

        // 1) 메인 파동처럼 커지는 노란 링 (깔끔한 2D 정원 파동)
        ctx.save();
        ctx.beginPath();
        ctx.arc(tx, ty, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = starColor; // #F1E949 또는 #FFF67A (유저 지정 노란색)
        ctx.lineWidth = Math.max(1.2, 2.6 * (1.0 - ringProg * 0.6));
        ctx.globalAlpha = ringAlpha;
        ctx.stroke();

        // 2) 내부 보조 밝은 레몬 펄스 링 (2D 동그란 이중 파동)
        if (ringProg < 0.65) {
          const innerR = ringRadius * 0.65;
          ctx.beginPath();
          ctx.arc(tx, ty, innerR, 0, Math.PI * 2);
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = ringAlpha * 0.85;
          ctx.stroke();
        }
        ctx.restore();

        // 3) 파동 링과 함께 사방으로 튀어나오는 4각 다이아몬드 십자별 파편들 (2D 확산)
        const burstSpread = easeOut * 22;
        for (let sp = 0; sp < 3; sp++) {
          const angle = (sp * Math.PI * 2) / 3 + i * 1.3;
          const px = tx + Math.cos(angle) * burstSpread;
          const py = ty + Math.sin(angle) * burstSpread;
          drawDiamondSparkleStar(
            ctx,
            px,
            py,
            Math.max(2.5, 7.0 - ringProg * 4.0),
            angle + ringProg * 4,
            ringAlpha,
            sp % 2 === 0 ? "#FFFFFF" : starColor
          );
        }
      }
    }
  }

  // ==========================================================================
  // 2. 시전자 주변을 지키는 궤도 보조 다이아몬드 십자별 (첨부 이미지의 레디바 주변 반짝이)
  // ==========================================================================
  for (let s = 0; s < 4; s++) {
    const sAngle = -(SPARKLE_ANGLES_4[s] + spinAngle * 1.1);
    const ux = Math.cos(sAngle) * 32;
    const uy = Math.sin(sAngle) * 14;

    const rotX = ux * Math.cos(orbitTilt) - uy * Math.sin(orbitTilt);
    const rotY = ux * Math.sin(orbitTilt) + uy * Math.cos(orbitTilt);

    const isFront = uy >= -1.0;
    if (layer === "behind" && isFront) continue;
    if (layer === "front" && !isFront) continue;

    const sSize = 5.5 + Math.sin(spinAngle * 2 + s) * 1.5;
    const sColor = s % 2 === 0 ? "#FFFFFF" : "#FFF67A";
    drawDiamondSparkleStar(ctx, cx + rotX, cy + rotY, sSize, sAngle * 1.5, 0.9, sColor);
  }
}

/**
 * 🌌 스피드스타 암전 알파 계산 함수 (Fade In -> Sustain -> Fade Out)
 */
function getSwiftDimAlpha(phaseId: string, progress: number): number {
  if (phaseId.startsWith("swift-spin-")) {
    const stage = parseInt(phaseId.replace("swift-spin-", ""), 10) || 1;
    // 1~3단계: 0.0 -> 0.70으로 매끄러운 페이드 인 (Fade In)
    if (stage <= 3) {
      return Math.min(0.70, ((stage - 1 + progress) / 3.0) * 0.70);
    }
    // 4~8단계: 짙은 밤하늘 암전 유지 (0.70)
    return 0.70;
  }
  if (phaseId.startsWith("swift-launch-")) {
    const stage = parseInt(phaseId.replace("swift-launch-", ""), 10) || 1;
    // 1~5단계: 찬란한 스타 스트림 발사 & 착탄 동안 암전 유지 (0.70)
    if (stage <= 5) return 0.70;
    // 6~8단계: 0.70 -> 0.15로 서서히 페이드 아웃 (Fade Out)
    const fadeOutP = (stage - 5 + progress) / 3.0; // 0.0 ~ 1.0
    return Math.max(0.15, 0.70 - fadeOutP * 0.55);
  }
  if (phaseId === "swift-finish") {
    // 마지막 잔향 소멸과 함께 완전 페이드 아웃 (0.15 -> 0.0)
    return Math.max(0, 0.15 * (1.0 - progress));
  }
  return 0;
}

/**
 * 🌌 스피드스타 전용 초광역 암전 필터 (Dark Ambient Overlay)
 * - ⚠️ [유저 요청 엄격 준수]: "이때 상대시점에서 암전 필터가 잘리지 않게 주의"
 * - 초광역 바운드(-6000px ~ +8000px, 14,000 x 14,000px)를 채워
 *   아군/적군/카메라 어떤 시점에서도 1픽셀도 잘리지 않고 화면 전체를 100% 빈틈없이 커버
 */
export function drawSwiftDimOverlay(ctx: any, alpha: number) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.fillStyle = `rgba(10, 8, 16, ${Math.min(0.72, Math.max(0, alpha))})`;
  ctx.fillRect(-6000, -6000, 14000, 14000);
  ctx.restore();
}

/**
 * 🌟 129: 스피드스타 후방 레이어 이펙트 (배경 암전 필터 & 시전자 등 뒤를 도는 별들)
 */
export function drawSwiftBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos } = drawCtx;
  const casterPos = drawCtx.casterPos || attackerPos;
  const phaseId = frame.phaseId || "";
  const progress = frame.effectProgress !== undefined ? frame.effectProgress : 0.5;

  // 0. [유저 피드백] 어두운 암전효과 페이드 인/페이드 아웃 (상대 시점 초광역 방어)
  const dimAlpha = getSwiftDimAlpha(phaseId, progress);
  drawSwiftDimOverlay(targetCtx, dimAlpha);

  const cx = casterPos.x;
  const cy = casterPos.y - 10;
  const tx = targetPos.x;
  const ty = targetPos.y - 12;

  // 1. 순수 회전 단계 (spinAngle 증가, launchProg: -1)
  if (phaseId.startsWith("swift-spin-")) {
    const stage = parseInt(phaseId.replace("swift-spin-", ""), 10) || 1;
    const spinAngle = (stage - 1 + progress) * 0.65;
    drawSwiftOrbitAndStream(targetCtx, cx, cy, tx, ty, spinAngle, -1, "behind");
    return;
  }

  // 2. 발사 단계 (회전 계속 유지하면서 발사!)
  if (phaseId.startsWith("swift-launch-")) {
    const stage = parseInt(phaseId.replace("swift-launch-", ""), 10) || 1;
    const spinAngle = 8 * 0.65 + (stage - 1 + progress) * 0.65;
    const launchProg = (stage - 1 + progress) / 8.0; // 0.0 ~ 1.0
    drawSwiftOrbitAndStream(targetCtx, cx, cy, tx, ty, spinAngle, launchProg, "behind");
    return;
  }

  // 3. 카메라 글라이드 프레임 등 중간 전환 프레임에서도 별 유지
  if (phaseId.includes("glide")) {
    // 발사 시작 직전 글라이드이거나 발사 중 글라이드일 때 안전하게 이전 회전 상태 유지
    const spinAngle = 8 * 0.65 + progress * 0.65;
    drawSwiftOrbitAndStream(targetCtx, cx, cy, tx, ty, spinAngle, -1, "behind");
    return;
  }
}

/**
 * 🌟 129: 스피드스타 전방 레이어 이펙트 (가슴 앞 회전 별, 스타 스트림 비행체, 타격 폭발)
 */
export function drawSwiftEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos } = drawCtx;
  const casterPos = drawCtx.casterPos || attackerPos;
  const phaseId = frame.phaseId || "";
  const progress = frame.effectProgress !== undefined ? frame.effectProgress : 0.5;

  const cx = casterPos.x;
  const cy = casterPos.y - 10;
  const tx = targetPos.x;
  const ty = targetPos.y - 12;

  // ==========================================================================
  // [1단계: 순수 회전 단계 (가슴 앞 레이어)]
  // ==========================================================================
  if (phaseId.startsWith("swift-spin-")) {
    const stage = parseInt(phaseId.replace("swift-spin-", ""), 10) || 1;
    const spinAngle = (stage - 1 + progress) * 0.65;
    drawSwiftOrbitAndStream(targetCtx, cx, cy, tx, ty, spinAngle, -1, "front");
    return;
  }

  // ==========================================================================
  // [2단계: 발사 중에도 계속 회전하며 스타 스트림 연속 사출 (가슴 앞 레이어)]
  // ==========================================================================
  if (phaseId.startsWith("swift-launch-")) {
    const stage = parseInt(phaseId.replace("swift-launch-", ""), 10) || 1;
    const spinAngle = 8 * 0.65 + (stage - 1 + progress) * 0.65;
    const launchProg = (stage - 1 + progress) / 8.0;
    drawSwiftOrbitAndStream(targetCtx, cx, cy, tx, ty, spinAngle, launchProg, "front");
    return;
  }

  // ==========================================================================
  // [카메라 글라이드 프레임 등 중간 전환 방어]
  // ==========================================================================
  if (phaseId.includes("glide")) {
    const spinAngle = 8 * 0.65 + progress * 0.65;
    // 글라이드가 발사 후 피격 전이면 발사 완료 상태로 렌더링
    drawSwiftOrbitAndStream(targetCtx, cx, cy, tx, ty, spinAngle, 0.95, "front");
    return;
  }

  // ==========================================================================
  // [3단계: 마지막 큰 타격 효과 제거 (유저 요청: 파동 링만 깔끔하게 유지)]
  // ==========================================================================
  if (phaseId.startsWith("swift-hit-")) {
    // 마지막에 크게 나오는 타격 효과(스타버스트, 거대 별, 거대 충격파) 완전 제거
    return;
  }

  // ==========================================================================
  // [4단계: 피날레 잔향 페이드아웃]
  // ==========================================================================
  if (phaseId === "swift-finish") {
    const fadeAlpha = Math.max(0, 1.0 - progress);
    if (fadeAlpha <= 0.01) return;

    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const dist = 24 + progress * 16;
      const sx = tx + Math.cos(angle) * dist;
      const sy = ty - 8 + Math.sin(angle) * (dist * 0.5) - progress * 12;

      // 5각 별과 4각 다이아몬드 십자별 교차 승화
      if (i % 2 === 0) {
        drawCartoonSwiftStar(
          targetCtx,
          sx,
          sy,
          Math.max(2, 6 * fadeAlpha),
          progress * 2 + i,
          fadeAlpha,
          STAR_COLORS_6[i % STAR_COLORS_6.length]
        );
      } else {
        drawDiamondSparkleStar(
          targetCtx,
          sx,
          sy,
          Math.max(2, 7 * fadeAlpha),
          progress * 3 + i,
          fadeAlpha,
          "#FFFFFF"
        );
      }
    }
  }
}

// ============================================================================
// 🚀 130: 로켓박치기 (Skull Bash) - 노말 타입 물리 공격기 (위력 130)
// ============================================================================

/**
 * 🌪️ 시전포켓몬 앞 돔 형태의 공기 압축 바람 부스터 (Aero Booster Dome)
 * - [유저 요청]: 돔 형태의 바람 부스터 이펙트가 시전 포켓몬 앞에 생김
 * - 초음속 돌진 직전 기두(Nose Cone)를 감싸는 유선형 공기 압축 돔 + 후방 제트 기류선
 */
export function drawAeroBoosterDome(
  ctx: any,
  cx: number,
  cy: number,
  angle: number, // 돌진 진행 각도 (약 -0.45 rad, 우상단 26도)
  progress: number, // 0.0 ~ 1.0 (생성 및 팽창 진동)
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // 미세한 초음속 진동 떨림 (Jitter)
  const jitterY = (Math.random() - 0.5) * 1.5;
  ctx.translate(0, jitterY);

  const domeRadius = 24 + Math.sin(progress * Math.PI) * 5;
  const tailLength = 72 + (1 - progress) * 16; // 72~88px 길이의 긴 후방 꼬리


  // 2. 후방 공기 압축 링 (Shock Cone Rings - 뒤로 갈수록 페이드)
  for (let r = 0; r < 3; r++) {
    const ringBackX = -15 - r * 18;
    const ringRy = domeRadius * (0.88 + r * 0.18);
    const ringRx = 7 + r * 1.5;
    const ringAlpha = alpha * Math.max(0, 0.40 - r * 0.13);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ringBackX, 0, ringRx, ringRy, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(224, 242, 254, ${ringAlpha})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  // 3. 메인 돔 형태 바람 배리어 (유선형 볼록 전면 + 길게 뻗어나가는 후방 꼬리 슬리브)
  ctx.save();
  ctx.beginPath();
  // 꼬리 상단 끝에서 시작하여 전방 볼록 돔을 거쳐 꼬리 하단 끝으로 이어지는 유선형 궤적
  const tailEndX = -tailLength;
  const tailTopY = -domeRadius * 0.75;
  const tailBotY = domeRadius * 0.75;
  const domeTipX = domeRadius * 1.35;

  ctx.moveTo(tailEndX, tailTopY);
  // 꼬리 상단 -> 상단 어깨(0, -domeRadius)
  ctx.bezierCurveTo(
    tailEndX * 0.45, -domeRadius * 0.95,
    -10, -domeRadius,
    0, -domeRadius
  );
  // 상단 어깨 -> 전방 선단(domeTipX, 0)
  ctx.bezierCurveTo(
    domeRadius * 0.95, -domeRadius * 0.70,
    domeTipX, -domeRadius * 0.25,
    domeTipX, 0
  );
  // 전방 선단 -> 하단 어깨(0, domeRadius)
  ctx.bezierCurveTo(
    domeTipX, domeRadius * 0.25,
    domeRadius * 0.95, domeRadius * 0.70,
    0, domeRadius
  );
  // 하단 어깨 -> 꼬리 하단(tailEndX, tailBotY)
  ctx.bezierCurveTo(
    -10, domeRadius,
    tailEndX * 0.45, domeRadius * 0.95,
    tailEndX, tailBotY
  );
  // 꼬리 후방 안쪽 완만한 곡면 마감
  ctx.bezierCurveTo(
    tailEndX * 0.7, 0,
    tailEndX * 0.7, 0,
    tailEndX, tailTopY
  );
  ctx.closePath();

  // 돔 & 긴 꼬리 내부 채우기 (전방 순백/하늘빛 -> 꼬리 끝쪽 완벽히 투명 0.0)
  const domeFillGrad = ctx.createLinearGradient(domeTipX, 0, tailEndX, 0);
  domeFillGrad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.58})`); // 선단 순백
  domeFillGrad.addColorStop(0.25, `rgba(186, 230, 253, ${alpha * 0.32})`); // 전방 하늘빛
  domeFillGrad.addColorStop(0.60, `rgba(186, 230, 253, ${alpha * 0.14})`); // 꼬리 중반
  domeFillGrad.addColorStop(0.90, `rgba(186, 230, 253, ${alpha * 0.02})`); // 꼬리 후반
  domeFillGrad.addColorStop(1.0, "rgba(186, 230, 253, 0.0)"); // 꼬리 끝단 100% 완전 투명!
  ctx.fillStyle = domeFillGrad;
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 🌌 로켓박치기 초광역 검정 암전 오버레이 (Dark Blackout Overlay)
 * - [유저 요청]: 돌진시 검정암전과 함께 큰 폭발과 연기
 * - 상대 시점에서도 잘림 없이 초광역 바운드(-6000 ~ +8000) 커버
 */
export function drawSkullBashDimOverlay(ctx: any, alpha: number) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.fillStyle = `rgba(8, 6, 12, ${Math.min(0.85, Math.max(0, alpha))})`;
  ctx.fillRect(-6000, -6000, 14000, 14000);
  ctx.restore();
}

/**
 * 💥 첨부 이미지 고증: 날카로운 초승달 충격파 칼날 패스 (Crescent Shock Blade)
 */
function pathCrescentBlade(
  ctx: any,
  len: number,
  baseWidth: number,
  curve: number
) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -baseWidth + curve, len, 0);
  ctx.quadraticCurveTo(len * 0.5, baseWidth * 0.35 + curve, 0, 0);
  ctx.closePath();
}

/**
 * 💥 로켓박치기 거대 폭발과 연기 (Skull Bash Collision Explosion & Trailing Smoke)
 * - [첨부 이미지 100% 고증]:
 *   1) 좌측 충돌 코어: 눈부신 순백-황금 코어 섬광 + 방사형 초승달 충격파 칼날 + 주황빛 스파크 파편
 *   2) 우측 후방 연기 구름: 충돌 궤적 뒤로 길게 뻗어나가는 거대한 모래빛/회갈색 볼륨 연기 구름층 + 내부 불꽃 주황 글로우
 */
/**
 * 💨 로켓박치기 후방 거대 볼륨 연기 구름 (Trailing Smoke Clouds - Z축: 스프라이트 뒤쪽)
 * - [유저 요청]: 연기 방향 살짝 아래로(-16도) & Z축 스프라이트 뒤 레이어 렌더링
 * - 충돌 축 뒤쪽(필드 후면)으로 뻗어나가는 11개 층의 다층 볼륨 뭉게구름 연기 + 내부 주황 글로우 + 먼지
 */
export function drawSkullBashTrailingSmoke(
  ctx: any,
  bx: number, // 충돌 중심 X (타겟 앞)
  by: number, // 충돌 중심 Y
  progress: number, // 0.0 ~ 1.0 (폭발 진행률)
  alpha: number = 1.0,
  isPlayer: boolean = true,
  scale: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  if (scale !== 1.0) {
    ctx.translate(bx, by);
    ctx.scale(scale, scale);
    ctx.translate(-bx, -by);
  }

  const easeOut = 1 - Math.pow(1 - progress, 2);

  // [유저 요구사항]:
  // 아군 시전: 우상단 완만한 대각선(-16도)
  // 상대 시전: 좀 더 왼쪽 아래각도로(+Y, -X) + 짧게!
  let dirX: number;
  let dirY: number;
  let perpX: number;
  let perpY: number;
  let dScale: number;
  let rScale: number;

  if (isPlayer) {
    dirX = 0.961;
    dirY = -0.276;
    perpX = 0.276;
    perpY = 0.961;
    dScale = 1.0;
    rScale = 1.0;
  } else {
    // 상대 시전: 왼쪽 아래각도 (약 155도 좌하단) + 짧게(0.65배)
    dirX = -0.906;
    dirY = 0.423;
    perpX = 0.423;
    perpY = 0.906;
    dScale = 0.65; // 짧게 압축
    rScale = 0.82; // 알맞게 컴팩트
  }

  // 11개 다층 입체 구름 로브
  const RAW_LOBES = [
    // 1. 충돌 정면 분출구 (근경/고밀도 압축)
    { d: 25, p: -4, r: 38, baseColor: "#C5B39C", shadowColor: "#8C7A65", lightColor: "#E8DEC8" },
    { d: 45, p: -14, r: 42, baseColor: "#BFA98F", shadowColor: "#7D6B58", lightColor: "#EADFCB" },
    { d: 50, p: 16, r: 40, baseColor: "#B29C82", shadowColor: "#72604D", lightColor: "#DACBB2" },

    // 2. 대각선 팽창 구역 (중경 볼륨감)
    { d: 80, p: -24, r: 48, baseColor: "#B9A48A", shadowColor: "#786552", lightColor: "#EDE3D0" },
    { d: 88, p: 6, r: 52, baseColor: "#AD977D", shadowColor: "#6B5846", lightColor: "#DFD1B8" },
    { d: 95, p: 26, r: 46, baseColor: "#9E876E", shadowColor: "#604D3C", lightColor: "#D3C3A8" },

    // 3. 거대 버스트 (원경 뭉게구름)
    { d: 130, p: -32, r: 56, baseColor: "#A69076", shadowColor: "#665341", lightColor: "#E4D6BF" },
    { d: 138, p: -6, r: 62, baseColor: "#998267", shadowColor: "#594635", lightColor: "#D8C7AD" },
    { d: 145, p: 24, r: 50, baseColor: "#8D765C", shadowColor: "#503D2D", lightColor: "#CBB99E" },

    // 4. 후방 상공 원경 능선 (원거리 확산)
    { d: 180, p: -38, r: 58, baseColor: "#917B62", shadowColor: "#524030", lightColor: "#D4C3A9" },
    { d: 195, p: -10, r: 65, baseColor: "#846E56", shadowColor: "#473627", lightColor: "#C6B49A" },
  ];

  const SMOKE_LOBES = RAW_LOBES.map((lobe) => ({
    dx: (lobe.d * dScale) * dirX + (lobe.p * dScale) * perpX,
    dy: (lobe.d * dScale) * dirY + (lobe.p * dScale) * perpY,
    r: lobe.r * rScale,
    baseColor: lobe.baseColor,
    shadowColor: lobe.shadowColor,
    lightColor: lobe.lightColor,
  }));

  const smokeAlpha = alpha * Math.max(0, 1.0 - progress * 0.85);

  // 1) 연기 구름 내부에서 비쳐 나오는 대각선 주황빛 화염 에너지 글로우
  if (progress < 0.7) {
    const fireGlowAlpha = (1.0 - progress / 0.7) * alpha * 0.75;
    ctx.save();
    for (let f = 0; f < 3; f++) {
      const fDist = (35 + f * 42) * dScale;
      const fgx = bx + fDist * dirX + (f % 2 === 0 ? -8 : 6) * perpX * dScale;
      const fgy = by + fDist * dirY + (f % 2 === 0 ? -8 : 6) * perpY * dScale;
      const fgR = (34 + f * 12) * rScale;
      const fGrad = ctx.createRadialGradient(fgx, fgy, 0, fgx, fgy, fgR);
      fGrad.addColorStop(0.0, `rgba(255, 237, 74, ${fireGlowAlpha * 0.9})`);
      fGrad.addColorStop(0.4, `rgba(249, 115, 22, ${fireGlowAlpha * 0.6})`);
      fGrad.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.arc(fgx, fgy, fgR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2) 볼륨감 넘치는 다층 뭉게구름 연기 로브 렌더링 (외곽선 100% 소프트 블렌딩 투명화)
  for (let i = 0; i < SMOKE_LOBES.length; i++) {
    const lobe = SMOKE_LOBES[i];
    const expandR = lobe.r * (0.65 + easeOut * 0.65);
    const lx = bx + lobe.dx * (0.7 + easeOut * 0.45) + dirX * easeOut * (24 * dScale);
    const ly = by + lobe.dy * (0.7 + easeOut * 0.45) + dirY * easeOut * (24 * dScale);

    ctx.save();
    ctx.globalAlpha = smokeAlpha;

    // A. 메인 볼륨 구체 (동심원 방사 소프트 블렌딩 그라데이션)
    // 외곽선 경계가 뚝 끊기지 않고 360도 전 방향으로 완전히 부드럽게 공기 중으로 투명화
    const bodyGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, expandR);
    bodyGrad.addColorStop(0.0, lobe.baseColor);
    bodyGrad.addColorStop(0.38, lobe.baseColor);
    bodyGrad.addColorStop(0.68, lobe.shadowColor);
    bodyGrad.addColorStop(0.85, "rgba(140, 122, 101, 0.28)");
    bodyGrad.addColorStop(1.0, "rgba(140, 122, 101, 0.0)"); // 100% 외곽 완전 투명

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, expandR, 0, Math.PI * 2);
    ctx.fill();

    // B. 상단 소프트 하이라이트 (구름 안쪽 상단에서 은은하게 빛나는 입체광)
    const hlR = expandR * 0.55;
    const hlx = lx - expandR * 0.20 * perpX - expandR * 0.12 * dirX;
    const hly = ly - expandR * 0.20 * perpY - expandR * 0.12 * dirY;

    const hlGrad = ctx.createRadialGradient(hlx, hly, 0, hlx, hly, hlR);
    hlGrad.addColorStop(0.0, lobe.lightColor);
    hlGrad.addColorStop(0.40, lobe.lightColor);
    hlGrad.addColorStop(0.75, "rgba(232, 222, 200, 0.22)");
    hlGrad.addColorStop(1.0, "rgba(232, 222, 200, 0.0)"); // 끝부분 완전 투명

    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.arc(hlx, hly, hlR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3) 대각선 기류를 타고 비산하는 먼지 파편
  for (let d = 0; d < 8; d++) {
    const dDist = (20 + d * 22 + easeOut * 30) * dScale;
    const dPerp = (Math.sin(d * 1.5 + progress * 2) * 18 + (d % 2 === 0 ? 12 : -12)) * dScale;
    const dustX = bx + dDist * dirX + dPerp * perpX;
    const dustY = by + dDist * dirY + dPerp * perpY;
    const dustSize = (4.5 + (d % 3) * 1.2) * (1.0 - progress * 0.55) * rScale;
    ctx.save();
    ctx.globalAlpha = smokeAlpha * 0.75;
    ctx.fillStyle = d % 2 === 0 ? "#A38B70" : "#E8DEC8";
    ctx.beginPath();
    ctx.arc(dustX, dustY, Math.max(1, dustSize), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 💥 로켓박치기 정면 코어 폭발 (Core Explosion & Crescent Blades - Z축: 스프라이트 앞쪽)
 * - [첨부 이미지 100% 고증]: 눈부신 순백-황금 코어 섬광 + 방사형 초승달 충격파 칼날 + 주황빛 스파크 파편
 */
export function drawSkullBashCoreExplosion(
  ctx: any,
  bx: number,
  by: number,
  progress: number,
  alpha: number = 1.0,
  flipX: boolean = false,
  scale: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  if (flipX || scale !== 1.0) {
    ctx.translate(bx, by);
    ctx.scale(flipX ? -scale : scale, scale);
    ctx.translate(-bx, -by);
  }

  const easeOut = 1 - Math.pow(1 - progress, 2);
  const blastAlpha = alpha * Math.max(0, 1.0 - progress * 0.75);

  // 1) 외곽으로 뻗어나가는 날카로운 초승달 충격파 칼날 (Crescent Blades)
  const BLADE_ANGLES = [
    { angle: -Math.PI * 0.75, len: 65, width: 9, curve: -8, color: "#FBBF24" }, // 좌상
    { angle: -Math.PI * 0.45, len: 85, width: 11, curve: 12, color: "#F59E0B" }, // 상단 거대 호
    { angle: -Math.PI * 0.15, len: 75, width: 10, curve: -10, color: "#FBBF24" }, // 우상
    { angle: Math.PI * 0.35, len: 80, width: 11, curve: 14, color: "#F59E0B" },  // 우하 거대 호
    { angle: Math.PI * 0.75, len: 60, width: 8, curve: -6, color: "#FBBF24" },  // 좌하
    { angle: Math.PI * 0.95, len: 70, width: 9, curve: 8, color: "#F97316" },   // 좌측 정면
  ];

  for (let b = 0; b < BLADE_ANGLES.length; b++) {
    const blade = BLADE_ANGLES[b];
    const curLen = blade.len * (0.4 + easeOut * 0.75);
    const curWidth = blade.width * (1.0 - progress * 0.6);

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(blade.angle);
    ctx.globalAlpha = blastAlpha * (0.95 - progress * 0.3);

    const bGrad = ctx.createLinearGradient(0, 0, curLen, 0);
    bGrad.addColorStop(0.0, "#FFFFFF"); // 중심부 순백
    bGrad.addColorStop(0.35, blade.color); // 밝은 황금/주황
    bGrad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)"); // 끝부분 페이드

    ctx.fillStyle = bGrad;
    pathCrescentBlade(ctx, curLen, curWidth, blade.curve);
    ctx.fill();
    ctx.restore();
  }

  // 2) 중심 초고열 순백-황금 플라즈마 코어 섬광
  const coreRadius = (35 + easeOut * 30) * (1.0 - progress * 0.35);
  ctx.save();
  ctx.globalAlpha = blastAlpha;

  // 외곽 주황-황금 글로우
  const coreGrad = ctx.createRadialGradient(bx, by, 0, bx, by, coreRadius);
  coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");   // 정중앙 순백
  coreGrad.addColorStop(0.35, "rgba(254, 240, 138, 0.95)"); // 밝은 황금
  coreGrad.addColorStop(0.65, "rgba(249, 115, 22, 0.70)");  // 주황 화염
  coreGrad.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");     // 완전 투명
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(bx, by, coreRadius, 0, Math.PI * 2);
  ctx.fill();

  // 순백 초고열 스팟 (Center White Spot)
  const spotRadius = coreRadius * 0.55 * (1.0 - progress * 0.5);
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(bx, by, Math.max(1, spotRadius), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3) 사방으로 튀어나가는 주황빛 스파크 불씨 파편 (Spark Embers)
  const sparkCount = 10;
  for (let s = 0; s < sparkCount; s++) {
    const sAngle = (s * Math.PI * 2) / sparkCount + s * 0.3;
    const sDist = (20 + s * 5) * easeOut * 1.5;
    const sx = bx + Math.cos(sAngle) * sDist;
    const sy = by + Math.sin(sAngle) * sDist * 0.8;
    const sSize = (3.5 - progress * 2.2);

    if (sSize > 0.5) {
      ctx.save();
      ctx.globalAlpha = blastAlpha;
      ctx.fillStyle = s % 2 === 0 ? "#FFFFFF" : "#FBBF24";
      ctx.beginPath();
      ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * 🌟 130: 로켓박치기 후방 레이어 이펙트 (배경 검정 암전 & 아군 시전 시 후방 거대 연기 구름)
 * - 아군 시전 시: 연기가 상대 스프라이트 뒤쪽(Z축 뒤)에 배치됨
 */
export function drawSkullBashBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, isPlayer: isP } = drawCtx;
  const phaseId = frame.phaseId || "";
  const progress = frame.effectProgress !== undefined ? frame.effectProgress : 0.5;

  // 1. 암전 알파 계산: 돌진(dash) 및 충돌(impact) 시 짙은 암전
  let dimAlpha = 0;
  if (phaseId.startsWith("skullbash-dash")) {
    dimAlpha = Math.min(0.78, 0.35 + progress * 0.43); // 돌진 시 부드러운 암전 진입
  } else if (phaseId.startsWith("skullbash-impact")) {
    dimAlpha = 0.78; // 충돌 시 최대 암전 유지
  } else if (phaseId === "skullbash-finish") {
    dimAlpha = Math.max(0, 0.65 * (1.0 - progress)); // 복귀 시 페이드아웃
  }

  drawSkullBashDimOverlay(targetCtx, dimAlpha);

  // 2. [아군 시전 시에만]: 연기를 상대 스프라이트 뒤쪽(Z축 뒤)에 렌더링
  if (isP) {
    const blastX = targetPos.x - 16;
    const blastY = targetPos.y - 8;

    if (phaseId.startsWith("skullbash-impact")) {
      const stage = parseInt(phaseId.replace("skullbash-impact-", ""), 10) || 1;
      const explProgress = (stage - 1 + progress) / 4.0;
      drawSkullBashTrailingSmoke(targetCtx, blastX, blastY, explProgress, 1.0, true);
    } else if (phaseId === "skullbash-finish") {
      const fadeProgress = Math.min(1.0, 0.75 + progress * 0.25);
      drawSkullBashTrailingSmoke(targetCtx, blastX, blastY, fadeProgress, 1.0 - progress, true);
    }
  }
}

/**
 * 🌟 130: 로켓박치기 전방 레이어 이펙트 (바람 부스터 돔 & 정면 코어 폭발)
 * - [유저 요청]: 상대 시전 시에는 연기가 아군 스프라이트 앞쪽(Z축 위쪽)에 렌더링!
 */
export function drawSkullBashEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const casterPos = drawCtx.casterPos || attackerPos;
  const phaseId = frame.phaseId || "";
  const progress = frame.effectProgress !== undefined ? frame.effectProgress : 0.5;

  // 시전포켓몬 현재 화면 좌표 (pOffset/eOffset 반영)
  const casterX = casterPos.x;
  const casterY = casterPos.y - 12;

  // 충돌 폭발 중심점: 대상 포켓몬 전면 (아군 공격 시 대상 좌측 앞, 적 공격 시 대상 우측 앞)
  const blastX = isP ? (targetPos.x - 16) : (targetPos.x + 16);
  const blastY = targetPos.y - 8;

  // 1. 바람 부스터 돔 생성 및 돌진 비행
  // Phase 2 (부스터 형성) 및 Phase 3 (초고속 돌진)
  if (phaseId.startsWith("skullbash-booster") || phaseId.startsWith("skullbash-dash")) {
    const isDash = phaseId.startsWith("skullbash-dash");
    // 아군 시전: 우상단 대각선 (-0.45 rad), 적 시전: 좌하단 대각선 (Math.PI - 0.45 rad)
    const domeAngle = isP ? -0.45 : (Math.PI - 0.45);
    const domeAlpha = isDash ? 1.0 : Math.min(1.0, progress * 1.3);

    // 시전포켓몬 머리/전방 오프셋
    const domeFrontX = isP ? (casterX + 26) : (casterX - 26);
    const domeFrontY = isP ? (casterY - 8) : (casterY + 8);

    drawAeroBoosterDome(
      targetCtx,
      domeFrontX,
      domeFrontY,
      domeAngle,
      progress,
      domeAlpha
    );
    return;
  }

  // 2. 정면 격돌 & 코어 폭발 섬광
  if (phaseId.startsWith("skullbash-impact")) {
    const stage = parseInt(phaseId.replace("skullbash-impact-", ""), 10) || 1;
    const explProgress = (stage - 1 + progress) / 4.0;

    // [상대 시전 시]: 연기를 아군 스프라이트 앞쪽(Z축 위쪽)에 렌더링!
    if (!isP) {
      drawSkullBashTrailingSmoke(targetCtx, blastX, blastY, explProgress, 1.0, false);
    }
    // 코어 폭발 섬광 (스프라이트 전면)
    drawSkullBashCoreExplosion(targetCtx, blastX, blastY, explProgress, 1.0, !isP);
    return;
  }

  // 3. 복귀 및 잔향 페이드아웃
  if (phaseId === "skullbash-finish") {
    const fadeProgress = Math.min(1.0, 0.75 + progress * 0.25);
    // [상대 시전 시]: 연기 페이드아웃 (Z축 위쪽)
    if (!isP) {
      drawSkullBashTrailingSmoke(targetCtx, blastX, blastY, fadeProgress, 1.0 - progress, false);
    }
    drawSkullBashCoreExplosion(targetCtx, blastX, blastY, fadeProgress, 1.0 - progress, !isP);
    return;
  }
}

// ============================================================================
// 🛡️ 130-Charge: 로켓박치기 1턴 충전 고증 연출 (Skull Bash Charge - Turn 1)
// - [유저 첨부 5세대 원작 이미지 고증 (media_1790138952888.png)]:
//   1. 시전자 고개 푹 숙이고 웅크림
//   2. 머리 부위 검은-암회색 원형 에너지 압축 링(Aura Compression Ring) 형성
//   3. 시전자 하단 좌우로 몽글몽글 피어오르는 황금빛 모래먼지 구름층(Billowing Sand Dust Aura)
//   4. 방어력 상승 스파클 및 에너지 모트
// ============================================================================

/**
 * 🌪️ 시전자 하단 좌우로 팽창하며 피어오르는 황금빛 모래먼지 구름층 (원작 5세대 완벽 고증)
 */
export function drawSkullBashDustAura(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number = 1.0,
  isP: boolean = true
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);

  // 모래먼지 구름 로브 구성 (원작 5세대 캡처 완벽 일치: 지면 좌우로 풍성하게 부풀어 오른 형태)
  const dustLobes = [
    // [좌측 먼지 로브들]
    { ox: -32, oy: -2, rx: 15, ry: 9, scale: 1.05 },
    { ox: -22, oy: -6, rx: 16, ry: 10, scale: 1.15 },
    { ox: -12, oy: -9, rx: 15, ry: 11, scale: 1.2 },
    // [중앙 베이스]
    { ox: 0, oy: -10, rx: 17, ry: 11, scale: 1.25 },
    // [우측 먼지 로브들]
    { ox: 12, oy: -9, rx: 15, ry: 11, scale: 1.2 },
    { ox: 22, oy: -6, rx: 16, ry: 10, scale: 1.15 },
    { ox: 32, oy: -2, rx: 15, ry: 9, scale: 1.05 },
  ];

  const puffExpand = 0.85 + Math.sin(progress * Math.PI) * 0.3;
  const puffAlpha = alpha * Math.min(1.0, 0.5 + Math.sin(progress * Math.PI) * 0.5);

  // 1. 하단 어두운 음영 먼지 층 (바닥 접지 그림자)
  ctx.save();
  ctx.fillStyle = `rgba(165, 140, 95, ${puffAlpha * 0.65})`;
  for (const lobe of dustLobes) {
    ctx.beginPath();
    ctx.ellipse(
      lobe.ox * puffExpand,
      lobe.oy * puffExpand + 3,
      lobe.rx * lobe.scale * puffExpand,
      lobe.ry * lobe.scale * puffExpand,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  // 2. 중간 웜 샌드 골드 볼륨 먼지 층 (원작 메인 톤: #D4BC88)
  ctx.save();
  ctx.fillStyle = `rgba(215, 190, 140, ${puffAlpha * 0.85})`;
  for (const lobe of dustLobes) {
    ctx.beginPath();
    ctx.ellipse(
      lobe.ox * puffExpand,
      lobe.oy * puffExpand,
      lobe.rx * 0.88 * lobe.scale * puffExpand,
      lobe.ry * 0.88 * lobe.scale * puffExpand,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  // 3. 상단 밝은 크림-아이보리 하이라이트 림 (원작 상단 발광 림: #F7EAC4)
  ctx.save();
  ctx.fillStyle = `rgba(247, 234, 196, ${puffAlpha * 0.95})`;
  for (const lobe of dustLobes) {
    ctx.beginPath();
    ctx.ellipse(
      lobe.ox * puffExpand,
      lobe.oy * puffExpand - 2.5,
      lobe.rx * 0.65 * lobe.scale * puffExpand,
      lobe.ry * 0.65 * lobe.scale * puffExpand,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * 🔘 머리 부위 검은-암회색 원형 에너지 압축 링 (원작 5세대 완벽 고증)
 */
export function drawSkullBashCompressionRing(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);

  // 펄스 팽창 및 수축 (progress에 따라 부드러운 호흡)
  const pulse = Math.sin(progress * Math.PI);
  const r = 21 + pulse * 4;

  // 1. 외곽 부드러운 다크 글로우 섀도우
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r + 2.5, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(18, 14, 22, ${alpha * 0.45})`;
  ctx.lineWidth = 4.5;
  ctx.stroke();
  ctx.restore();

  // 2. 주 원형 링: 두껍고 또렷한 암회색 림 (원작 고증)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(38, 34, 44, ${alpha * 0.95})`;
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.restore();

  // 3. 내부 얇은 순백/골드 하이라이트 림
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r - 1.4, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * (0.35 + pulse * 0.35)})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  // 4. 중심 미세 에너지 압축 렌즈 효과 (내부 투명 ~ 외곽 엷은 셰이드)
  const grad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  grad.addColorStop(0.65, `rgba(240, 230, 200, ${alpha * 0.08})`);
  grad.addColorStop(0.95, `rgba(40, 35, 45, ${alpha * 0.22})`);
  grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * ✨ 방어력 상승 스파클 파티클
 */
export function drawSkullBashDefSparkles(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  isP: boolean = true
) {
  ctx.save();
  ctx.translate(cx, cy);

  const sparkleCount = 6;
  for (let i = 0; i < sparkleCount; i++) {
    const angle = (i / sparkleCount) * Math.PI * 2 + progress * 2.0;
    const rDist = 20 + ((i * 7 + progress * 25) % 18);
    const sx = Math.cos(angle) * rDist * 0.9;
    const sy = Math.sin(angle) * (rDist * 0.5) - 6 - progress * 14;

    const sAlpha = Math.sin(((progress + i / sparkleCount) % 1.0) * Math.PI);
    if (sAlpha <= 0.05) continue;

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, sAlpha);
    ctx.fillStyle = i % 2 === 0 ? "#FFF68F" : "#FFFFFF";
    ctx.beginPath();
    const sSize = 2.0 + (i % 2) * 1.2;
    ctx.rect(sx - sSize, sy - 0.7, sSize * 2, 1.4);
    ctx.rect(sx - 0.7, sy - sSize, 1.4, sSize * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 🌟 130-Charge: 로켓박치기 1턴 충전 후방 레이어
 */
export function drawSkullBashChargeBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 모래먼지 제거 요청에 따라 후방 지면 오라 비활성화
}

/**
 * 🌟 130-Charge: 로켓박치기 1턴 충전 전방 레이어 (방어력 상승 스파클)
 */
export function drawSkullBashChargeEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { attackerPos, isPlayer: isP } = drawCtx;
  const casterPos = drawCtx.casterPos || attackerPos;
  const progress = frame.effectProgress !== undefined ? frame.effectProgress : 0.5;

  const cx = casterPos.x;
  const cy = casterPos.y;

  // 방어력 상승 스파클 파티클만 렌더링
  drawSkullBashDefSparkles(targetCtx, cx, cy, progress, isP);
}

// ============================================================================
// 131: 가시대포 (Spike Cannon)
// - [유저 요구사항 1]: 바늘미사일의 바늘 에셋 기반, 발사 유형도 바늘미사일과 비슷하게 4연속 발사
// - [유저 요구사항 2]: 바늘 뒷부분에 고출력 로켓 엔진 추진 화염(Rocket Jet Flame) 탑재!
// - [유저 요구사항 3]: 타격 시 로켓박치기 같은 코어 폭발 및 뭉게구름 연기 작렬!
// ============================================================================

/**
 * 🚀 가시대포 엔진 불꽃 가시 바늘 렌더러 (Spike Cannon Needle with Rocket Jet Engine Flame)
 * - 바늘미사일의 내추럴 아이보리 뿔 콘 에셋 기반
 * - 바늘 꽁무니에 타오르는 로켓 제트 화염(Jet Flame) & 불씨 스파크 탑재
 */
export function drawSpikeCannonNeedle(
  ctx: any,
  x: number,
  y: number,
  angle: number,
  scale: number = 1.0,
  alpha: number = 1.0,
  flameFlicker: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;

  const length = 36 * scale;
  const radius = 6.2 * scale;

  // ========================================================================
  // 1. [유저 요구사항]: 뒷부분 로켓 엔진 추진 화염 (Rocket Jet Flame Plume)
  // ========================================================================
  const flameLen = (32 + Math.sin(flameFlicker * 10) * 6) * scale;
  const flameHalfW = radius * 0.92;

  // A. 외곽 주황-적색 화염 플룸
  const outerFlameGrad = ctx.createLinearGradient(0, 0, -flameLen, 0);
  outerFlameGrad.addColorStop(0.0, "rgba(255, 237, 74, 0.95)"); // 노랑
  outerFlameGrad.addColorStop(0.35, "rgba(249, 115, 22, 0.85)"); // 주황
  outerFlameGrad.addColorStop(0.70, "rgba(234, 88, 12, 0.45)"); // 적주황
  outerFlameGrad.addColorStop(1.0, "rgba(234, 88, 12, 0.0)"); // 투명 소멸

  ctx.fillStyle = outerFlameGrad;
  ctx.beginPath();
  ctx.moveTo(0, -flameHalfW);
  ctx.quadraticCurveTo(-flameLen * 0.5, -flameHalfW * 0.85, -flameLen, 0);
  ctx.quadraticCurveTo(-flameLen * 0.5, flameHalfW * 0.85, 0, flameHalfW);
  ctx.closePath();
  ctx.fill();

  // B. 내부 초고온 순백-황금 코어 제트 화염
  const innerFlameLen = flameLen * 0.58;
  const innerFlameHalfW = flameHalfW * 0.55;
  const innerFlameGrad = ctx.createLinearGradient(0, 0, -innerFlameLen, 0);
  innerFlameGrad.addColorStop(0.0, "#FFFFFF"); // 초고온 순백
  innerFlameGrad.addColorStop(0.45, "rgba(254, 240, 138, 0.95)"); // 레몬 황금
  innerFlameGrad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)"); // 투명

  ctx.fillStyle = innerFlameGrad;
  ctx.beginPath();
  ctx.moveTo(0, -innerFlameHalfW);
  ctx.quadraticCurveTo(-innerFlameLen * 0.5, -innerFlameHalfW * 0.5, -innerFlameLen, 0);
  ctx.quadraticCurveTo(-innerFlameLen * 0.5, innerFlameHalfW * 0.5, 0, innerFlameHalfW);
  ctx.closePath();
  ctx.fill();



  // ========================================================================
  // 2. 엔진 노즐 림 (Engine Nozzle Metal Rim)
  // ========================================================================
  ctx.fillStyle = "#334155"; // 다크 건메탈 노즐
  ctx.fillRect(-2.5 * scale, -radius * 1.05, 3.5 * scale, radius * 2.1);
  ctx.fillStyle = "#64748B";
  ctx.fillRect(-1.0 * scale, -radius * 1.05, 1.2 * scale, radius * 2.1);

  // ========================================================================
  // 3. 바늘미사일 기반 내추럴 아이보리 가시 바늘 본체
  // ========================================================================
  // 외곽선 (다크 앰버/본)
  ctx.beginPath();
  ctx.moveTo(length, 0); // 뾰족한 침 끝
  ctx.lineTo(0, -radius);
  ctx.lineTo(0, radius);
  ctx.closePath();
  ctx.fillStyle = "#451A03";
  ctx.fill();

  // 내부 아이보리 그라디언트 채우기
  const bodyGrad = ctx.createLinearGradient(0, -radius, 0, radius);
  bodyGrad.addColorStop(0.0, "#FAF7EE"); // 림 라이트
  bodyGrad.addColorStop(0.22, "#FFFFFF"); // 반사광
  bodyGrad.addColorStop(0.48, "#F4EBD9"); // 따뜻한 내추럴 아이보리
  bodyGrad.addColorStop(0.78, "#DECDB0"); // 본 음영
  bodyGrad.addColorStop(1.0, "#A89878"); // 하단 그림자

  ctx.beginPath();
  ctx.moveTo(length - 1.5, 0);
  ctx.lineTo(1.0, -radius + 1.2);
  ctx.lineTo(1.0, radius - 1.2);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 중앙 스펙큘러 릿지 라인
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 1.3 * scale;
  ctx.beginPath();
  ctx.moveTo(2, -radius * 0.22);
  ctx.lineTo(length - 1.5, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * 💥 가시대포 발사 포구 화염 (Muzzle Launch Flash)
 */
function drawSpikeMuzzleFlash(
  ctx: any,
  x: number,
  y: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
  grad.addColorStop(0.0, "#FFFFFF");
  grad.addColorStop(0.35, "rgba(254, 240, 138, 0.95)");
  grad.addColorStop(0.70, "rgba(249, 115, 22, 0.60)");
  grad.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 22, -Math.PI / 3, Math.PI / 3);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// 4발의 개별 탄착 오프셋 (단조롭지 않게 상대 전신에 역동적인 탄착군 형성)
const SPIKE_SHOT_OFFSETS = [
  { ox: -14, oy: -14 }, // 1발: 상단 어깨
  { ox: 14, oy: 10 },   // 2발: 하단 몸체
  { ox: -8, oy: 12 },   // 3발: 측면 허리
  { ox: 0, oy: -2 },    // 4발: 정중앙 급소 피니시
];

/**
 * 💨 가시대포 타격점 전용 미니 연기 (Compact Impact Smoke Puff)
 * - [유저 요구사항: "연기도 타격지점에만 작게"]:
 *   거대한 궤적 연기 대신, 타격점(bx, by) 중심 반경 12~24px 내에서만
 *   모락모락 솟구치다 은은하게 사라지는 앙증맞고 부드러운 뭉게구름 연기
 */
export function drawSpikeImpactSmoke(
  ctx: any,
  bx: number,
  by: number,
  progress: number,
  alpha: number = 1.0,
  isPlayer: boolean = true,
  scale: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  if (scale !== 1.0) {
    ctx.translate(bx, by);
    ctx.scale(scale, scale);
    ctx.translate(-bx, -by);
  }

  const easeOut = 1 - Math.pow(1 - progress, 2);
  const smokeAlpha = alpha * Math.max(0, 1.0 - progress * 0.85);

  // 시전 방향에 따른 미세 표류 드리프트 (상대 시전 시 좌하단 살짝, 아군 시전 시 우상단 살짝)
  const driftX = (isPlayer ? 7 : -7) * easeOut;
  const driftY = (isPlayer ? -8 : 7) * easeOut;

  // 타격 지점에 볼륨감 있게 모여있는 5개의 앙증맞은 연기 로브 (살짝 크기 상향)
  const MINI_LOBES = [
    { ox: 0, oy: 0, r: 14, baseColor: "#C5B39C", shadowColor: "#8C7A65", lightColor: "#E8DEC8" },
    { ox: (isPlayer ? 6 : -6), oy: -8, r: 12, baseColor: "#BFA98F", shadowColor: "#7D6B58", lightColor: "#EADFCB" },
    { ox: (isPlayer ? -6 : 6), oy: 5, r: 10, baseColor: "#B29C82", shadowColor: "#72604D", lightColor: "#DACBB2" },
    { ox: (isPlayer ? 8 : -8), oy: 3, r: 12, baseColor: "#AD977D", shadowColor: "#6B5846", lightColor: "#DFD1B8" },
    { ox: (isPlayer ? 1 : -1), oy: -11, r: 9, baseColor: "#9E876E", shadowColor: "#604D3C", lightColor: "#D3C3A8" },
  ];

  // 1) 연기 로브 렌더링 (100% 소프트 블렌딩 방사 그라데이션)
  for (let i = 0; i < MINI_LOBES.length; i++) {
    const lobe = MINI_LOBES[i];
    const expandR = lobe.r * (0.72 + easeOut * 0.58);
    const lx = bx + lobe.ox * (0.8 + easeOut * 0.4) + driftX;
    const ly = by + lobe.oy * (0.8 + easeOut * 0.4) + driftY;

    ctx.save();
    ctx.globalAlpha = smokeAlpha;

    // 메인 볼륨 구체 (외곽 완전 투명 그라데이션)
    const bodyGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, expandR);
    bodyGrad.addColorStop(0.0, lobe.baseColor);
    bodyGrad.addColorStop(0.40, lobe.baseColor);
    bodyGrad.addColorStop(0.70, lobe.shadowColor);
    bodyGrad.addColorStop(0.88, "rgba(140, 122, 101, 0.25)");
    bodyGrad.addColorStop(1.0, "rgba(140, 122, 101, 0.0)");

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, expandR, 0, Math.PI * 2);
    ctx.fill();

    // 상단 하이라이트
    const hlR = expandR * 0.50;
    const hlx = lx - expandR * 0.20;
    const hly = ly - expandR * 0.20;
    const hlGrad = ctx.createRadialGradient(hlx, hly, 0, hlx, hly, hlR);
    hlGrad.addColorStop(0.0, lobe.lightColor);
    hlGrad.addColorStop(0.45, lobe.lightColor);
    hlGrad.addColorStop(0.80, "rgba(232, 222, 200, 0.20)");
    hlGrad.addColorStop(1.0, "rgba(232, 222, 200, 0.0)");

    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.arc(hlx, hly, hlR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 2) 타격점 주변 미세 먼지 파편 4개
  for (let d = 0; d < 4; d++) {
    const dAngle = (d * Math.PI * 2) / 4 + 0.4;
    const dDist = (8 + d * 4) * easeOut;
    const dustX = bx + Math.cos(dAngle) * dDist + driftX * 0.5;
    const dustY = by + Math.sin(dAngle) * dDist + driftY * 0.5;
    const dustSize = Math.max(0.6, (2.4 - progress * 1.5));

    ctx.save();
    ctx.globalAlpha = smokeAlpha * 0.65;
    ctx.fillStyle = d % 2 === 0 ? "#A38B70" : "#E8DEC8";
    ctx.beginPath();
    ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 🌟 131: 가시대포 후방 레이어 이펙트
 * - [유저 요구사항: "그리고 연기 z축 앞에 (내 시전)"]:
 *   연기가 스프라이트 앞쪽(Z축 앞)으로 이동하여 후방 레이어는 비워둠.
 */
export function drawSpikeCannonBehindEffect(
  _targetCtx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // Z축 앞 레이어로 이동 완료
}

/**
 * 🌟 131: 가시대포 전방 레이어 이펙트 (바늘 비행, 머즐 플래시, 작은 코어 폭발, 타격점 미니 연기)
 */
export function drawSpikeCannonEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP, isHit } = drawCtx;
  const step = frame.moveStep || 1;

  // 시전자 전면 발사 좌표
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const launchMuzzleX = ax + (isP ? 26 : -26);
  const launchMuzzleY = ay + (isP ? -8 : 8);

  // 대상 기본 위치
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  // ========================================================================
  // [PART 1: 타격 연출 - 타격점 미니 연기 & 작은 폭발 (Z축: 대상 스프라이트 앞)]
  // ========================================================================
  if (isHit) {
    // 1-A. [유저 요구사항: "연기 살짝만 크게", "그리고 연기 z축 앞에 (내 시전)"]
    // 아군/적군 시전 모두 타격점 미니 연기를 Z축 앞(스프라이트 위)에 렌더링!
    let smokeShotIdx = -1;
    let smokeProg = 0.5;
    let smokeA = 0.8;
    let smokeSc = 1.0;

    if (step === 3) {
      smokeShotIdx = 0; smokeProg = 0.35; smokeA = 0.75; smokeSc = 1.0;
    } else if (step === 4) {
      smokeShotIdx = 0; smokeProg = 0.65; smokeA = 0.60; smokeSc = 1.05;
    } else if (step === 5) {
      smokeShotIdx = 1; smokeProg = 0.35; smokeA = 0.75; smokeSc = 1.0;
    } else if (step === 6) {
      smokeShotIdx = 1; smokeProg = 0.65; smokeA = 0.60; smokeSc = 1.05;
    } else if (step === 7) {
      smokeShotIdx = 2; smokeProg = 0.35; smokeA = 0.75; smokeSc = 1.0;
    } else if (step === 8) {
      smokeShotIdx = 2; smokeProg = 0.65; smokeA = 0.60; smokeSc = 1.05;
    } else if (step === 9) {
      smokeShotIdx = 3; smokeProg = 0.38; smokeA = 0.85; smokeSc = 1.25;
    } else if (step === 10) {
      // 폭발 후 연기가 타격점에서 살짝 볼륨감 있게 솟구침
      smokeShotIdx = 3; smokeProg = 0.68; smokeA = 0.80; smokeSc = 1.30;
    } else if (step === 11) {
      // 폭발 후 연기 페이드아웃
      smokeShotIdx = 3; smokeProg = 0.92; smokeA = 0.42; smokeSc = 1.30;
    }

    if (smokeShotIdx >= 0) {
      const conf = SPIKE_SHOT_OFFSETS[smokeShotIdx];
      const impX = tx + (isP ? conf.ox : -conf.ox);
      const impY = ty + conf.oy;
      drawSpikeImpactSmoke(targetCtx, impX, impY, smokeProg, smokeA, isP, smokeSc);
    }

    // 1-B. [유저 요구사항: "폭발이 너무 큰데 ㅋㅋㅋㅋ 가시대포의 폭발은 작게"]
    // * 중요: 타격 순간(step 3, 5, 7, 9)에만 작고 섬세한 핀포인트 폭발!
    // * step 10, 11에는 폭발 불꽃이 전혀 나오지 않고 오직 연기만 남음 ("폭발 후 연기까지")
    if (step === 3 || step === 5 || step === 7 || step === 9) {
      let hitIdx = 0;
      let burstProgress = 0.40;
      let burstScale = 0.25; // 가시대포에 어울리는 아주 작고 컴팩트한 폭발!

      if (step === 3) {
        hitIdx = 0;
        burstProgress = 0.40;
        burstScale = 0.25;
      } else if (step === 5) {
        hitIdx = 1;
        burstProgress = 0.40;
        burstScale = 0.25;
      } else if (step === 7) {
        hitIdx = 2;
        burstProgress = 0.40;
        burstScale = 0.26;
      } else if (step === 9) {
        hitIdx = 3;
        burstProgress = 0.38;
        burstScale = 0.36; // 피니시도 과하지 않고 찰진 작은 폭발
      }

      const conf = SPIKE_SHOT_OFFSETS[hitIdx];
      const impX = tx + (isP ? conf.ox : -conf.ox);
      const impY = ty + conf.oy;

      drawSkullBashCoreExplosion(targetCtx, impX, impY, burstProgress, 1.0, !isP, burstScale);
    }
  }

  // ========================================================================
  // [PART 2: 바늘미사일 유형의 4연속 엔진 불꽃 바늘 발사 & 비행 시퀀스]
  // ========================================================================
  // 비행 중인 바늘의 정보 계산
  let activeFlyShot = -1;
  let flyT = 0;
  let isMuzzleLaunch = false;

  if (step === 1) {
    // 1발 발사
    activeFlyShot = 0;
    flyT = 0.22;
    isMuzzleLaunch = true;
  } else if (step === 2) {
    // 1발 비행
    activeFlyShot = 0;
    flyT = 0.82;
  } else if (step === 3) {
    // 2발 발사 (1발 타격 중)
    activeFlyShot = 1;
    flyT = 0.22;
    isMuzzleLaunch = true;
  } else if (step === 4) {
    // 2발 비행
    activeFlyShot = 1;
    flyT = 0.82;
  } else if (step === 5) {
    // 3발 발사 (2발 타격 중)
    activeFlyShot = 2;
    flyT = 0.22;
    isMuzzleLaunch = true;
  } else if (step === 6) {
    // 3발 비행
    activeFlyShot = 2;
    flyT = 0.82;
  } else if (step === 7) {
    // 4발 피니시 발사 (3발 타격 중)
    activeFlyShot = 3;
    flyT = 0.22;
    isMuzzleLaunch = true;
  } else if (step === 8) {
    // 4발 피니시 비행
    activeFlyShot = 3;
    flyT = 0.85;
  }

  if (activeFlyShot >= 0) {
    const conf = SPIKE_SHOT_OFFSETS[activeFlyShot];
    const targetX = tx + (isP ? conf.ox : -conf.ox);
    const targetY = ty + conf.oy;

    const dx = targetX - launchMuzzleX;
    const dy = targetY - launchMuzzleY;
    const angle = Math.atan2(dy, dx);

    // 머즐 플래시
    if (isMuzzleLaunch) {
      drawSpikeMuzzleFlash(targetCtx, launchMuzzleX, launchMuzzleY, angle);
    }

    // 바늘 현재 위치
    const curX = launchMuzzleX + dx * flyT;
    const curY = launchMuzzleY + dy * flyT;
    const needleScale = activeFlyShot === 3 ? 1.15 : 1.05;

    drawSpikeCannonNeedle(
      targetCtx,
      curX,
      curY,
      angle,
      needleScale,
      1.0,
      flyT + step * 0.5
    );
  }
}


