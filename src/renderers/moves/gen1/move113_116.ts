// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 85) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 기술 제작 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { drawMiniRetroStar } from "../common/helpers.js";

// ============================================================================
// 공통 헬퍼: 십자 글린트 & 크리스탈 반사광
// ============================================================================

/**
 * 4방향 다이아몬드/십자 글린트 (Sharp Cross Glint)
 */
function drawSharpCrossGlint(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  color: string = "#FFFFFF",
  alpha: number = 1.0,
  rotAngle: number = 0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);
  if (rotAngle !== 0) ctx.rotate(rotAngle);

  // 수평 날카로운 빔
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.quadraticCurveTo(0, 0, 0, -size * 0.20);
  ctx.quadraticCurveTo(0, 0, size, 0);
  ctx.quadraticCurveTo(0, 0, 0, size * 0.20);
  ctx.closePath();
  ctx.fill();

  // 수직 날카로운 빔
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(0, 0, size * 0.20, 0);
  ctx.quadraticCurveTo(0, 0, 0, size);
  ctx.quadraticCurveTo(0, 0, -size * 0.20, 0);
  ctx.closePath();
  ctx.fill();

  // 중심 코어 점
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 정육각형 그리기 헬퍼
 */
function drawHexagon(ctx: any, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// ============================================================================
// 113: 빛의장막 (Light Screen)
// ============================================================================
// 113: 빛의장막 (Light Screen)
// ============================================================================

/**
 * 크리스탈 다이아몬드 스파클 (Diamond Star Glint)
 * - 레퍼런스(SV): 크리스탈 유리 슬랩 테두리에 자연스럽고 섬세하게 맺히는 순백 다이아몬드 별빛
 */
function drawSparkleStar(ctx: any, x: number, y: number, size: number, alpha: number = 1.0) {
  if (size <= 0.4 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 1. 은은한 순백/라벤더 미세 헤일로
  const radGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 1.4);
  radGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  radGrad.addColorStop(0.35, "rgba(232, 121, 249, 0.45)");
  radGrad.addColorStop(1, "rgba(232, 121, 249, 0)");
  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(x, y, size * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // 2. 샤프한 4방향 순백 다이아몬드 십자 빔
  ctx.fillStyle = "#FFFFFF";
  const armLen = size * 1.35;
  const armThick = Math.max(0.4, size * 0.15);

  ctx.beginPath();
  ctx.moveTo(x - armLen, y);
  ctx.quadraticCurveTo(x, y, x, y - armThick);
  ctx.quadraticCurveTo(x, y, x + armLen, y);
  ctx.quadraticCurveTo(x, y, x, y + armThick);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y - armLen);
  ctx.quadraticCurveTo(x, y, x + armThick, y);
  ctx.quadraticCurveTo(x, y, x, y + armLen);
  ctx.quadraticCurveTo(x, y, x - armThick, y);
  ctx.closePath();
  ctx.fill();

  // 3. 중심 순백 코어 점
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.6, size * 0.24), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 상단 모서리 수평 렌즈 플레어 (Top Edge Horizontal Lens Flare)
 * - 레퍼런스(SV) 상단 전체를 관통하며 우측으로 뻗어나가는 눈부신 순백/라벤더 수평 레이저 빔
 */
function drawTopEdgeFlare(ctx: any, x: number, y: number, width: number, alpha: number = 1.0) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 1. 넓은 수평 라벤더 네온 빔 (Horizontal Flare Streak)
  const grad = ctx.createLinearGradient(x - width * 0.55, y, x + width * 0.70, y);
  grad.addColorStop(0, "rgba(255, 255, 255, 0)");
  grad.addColorStop(0.15, "rgba(232, 121, 249, 0.40)");
  grad.addColorStop(0.45, "rgba(255, 255, 255, 0.95)");
  grad.addColorStop(0.70, "rgba(216, 112, 240, 0.50)");
  grad.addColorStop(0.95, "rgba(232, 121, 249, 0.25)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - width * 0.55, y);
  ctx.quadraticCurveTo(x, y - 2.2, x + width * 0.70, y);
  ctx.quadraticCurveTo(x, y + 2.2, x - width * 0.55, y);
  ctx.fill();

  // 2. 수평 순백 레이저 코어 선 (우측으로 샤프하게 길게 뻗어나가는 레퍼런스 광선)
  const coreGrad = ctx.createLinearGradient(x - width * 0.45, y, x + width * 0.75, y);
  coreGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  coreGrad.addColorStop(0.10, "rgba(255, 255, 255, 0.85)");
  coreGrad.addColorStop(0.40, "rgba(255, 255, 255, 1.0)");
  coreGrad.addColorStop(0.70, "rgba(255, 255, 255, 0.85)");
  coreGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = coreGrad;
  ctx.fillRect(x - width * 0.45, y - 0.8, width * 1.20, 1.6);

  // 3. 수평 렌즈 플레어 핫스팟 (위아래 원형 번짐 없이 좌우로만 퍼지는 플레어 밴드)
  const spotGrad = ctx.createLinearGradient(x - width * 0.30, y, x + width * 0.30, y);
  spotGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  spotGrad.addColorStop(0.30, "rgba(255, 245, 255, 0.75)");
  spotGrad.addColorStop(0.50, "rgba(255, 255, 255, 1.0)");
  spotGrad.addColorStop(0.70, "rgba(255, 245, 255, 0.75)");
  spotGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = spotGrad;
  ctx.fillRect(x - width * 0.30, y - 1.6, width * 0.60, 3.2);

  ctx.restore();
}

/**
 * 반투명 에스퍼 색상의 유리판 (Psychic Translucent Glass Panel)
 * - 레퍼런스(SV) 직사각형 크리스탈 슬랩
 * - 투명하고 맑은 에스퍼 바이올렛 그라디언트 본체
 * - 3D 크리스탈 굴절 하이라이트 베벨
 * - 외곽 네온 글로우 테두리선
 * - 끝쪽 모서리 고휘도 L자형 발광선 & 세로 기둥 라인 총총 다이아몬드 스타 글린트
 */
function drawPsychicGlassPanel(
  ctx: any,
  cx: number,
  cy: number,
  w: number,
  h: number,
  alpha: number = 1.0,
  sheenOffset: number | null = null,
  glowIntensity: number = 1.0,
  scale: number = 1.0,
  rot: number = 0,
  panelIndex: number = 0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);
  if (rot !== 0) ctx.rotate(rot);
  if (scale !== 1.0) ctx.scale(scale, scale);

  const hw = w / 2;
  const hh = h / 2;

  // 1. 투명하고 맑은 에스퍼 크리스탈 본체 (레퍼런스 투명도 유지)
  const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
  grad.addColorStop(0, "rgba(250, 232, 255, 0.14)"); // 루미너스 소프트 라벤더
  grad.addColorStop(0.40, "rgba(232, 121, 249, 0.16)"); // 생생한 에스퍼 오키드
  grad.addColorStop(0.80, "rgba(168, 85, 247, 0.14)"); // 신비로운 반투명 퍼플
  grad.addColorStop(1, "rgba(147, 51, 234, 0.10)"); // 딥 바이올렛 하단
  ctx.fillStyle = grad;

  // 레퍼런스 스타일: 샤프한 직사각형 크리스탈 슬랩 (곡선 없이 단정하고 각진 실루엣)
  ctx.beginPath();
  ctx.rect(-hw, -hh, w, h);
  ctx.fill();

  // 2. 내부 유리 굴절 베벨 라인 (좌상단 화이트 하이라이트 & 우하단 그림자)
  if (w >= 12) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.60)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-hw + 1.0, hh - 1.0);
    ctx.lineTo(-hw + 1.0, -hh + 1.0);
    ctx.lineTo(hw - 1.0, -hh + 1.0);
    ctx.stroke();

    ctx.strokeStyle = "rgba(147, 51, 234, 0.30)";
    ctx.beginPath();
    ctx.moveTo(hw - 1.0, -hh + 1.0);
    ctx.lineTo(hw - 1.0, hh - 1.0);
    ctx.lineTo(-hw + 1.0, hh - 1.0);
    ctx.stroke();
  }

  // 3. 사선 유리 반사광 (Diagonal Reflective Sheen Band)
  if (sheenOffset !== null && sheenOffset >= -1.2 && sheenOffset <= 1.2) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-hw, -hh, w, h);
    ctx.clip();

    const bandX = sheenOffset * (w + 24);
    const sheenGrad = ctx.createLinearGradient(bandX - 10, -hh, bandX + 10, hh);
    sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0.0)");
    sheenGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.35)");
    sheenGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.80)");
    sheenGrad.addColorStop(0.7, "rgba(255, 255, 255, 0.35)");
    sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.moveTo(bandX - 16, -hh);
    ctx.lineTo(bandX + 2, -hh);
    ctx.lineTo(bandX + 18, hh);
    ctx.lineTo(bandX, hh);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 4. 모서리 및 기둥 네온 발광 (레퍼런스 스타일: 수직 기둥 자체가 밝은 빛줄기로 발광)
  // 4-1. 넓고 부드러운 네온 헤일로
  ctx.strokeStyle = `rgba(216, 112, 240, ${0.30 * glowIntensity})`;
  ctx.lineWidth = 4.0;
  ctx.strokeRect(-hw, -hh, w, h);

  // 4-2. 선명한 에스퍼 네온 테두리
  ctx.strokeStyle = `rgba(232, 121, 249, ${0.60 * glowIntensity})`;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(-hw, -hh, w, h);

  // 4-3. 순백 코어 테두리선 (상단과 좌우 수직 기둥의 샤프한 순백 선)
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * glowIntensity})`;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-hw, -hh, w, h);

  ctx.restore();
}

/**
 * 113: 빛의장막 (Light Screen) - 배틀 이펙트 (전면 레이어)
 *
 * 연출 흐름:
 * 1. Step 1: 카메라 각도 180도 우측 회전 (적 시점에서 시전 포켓몬 보는 시점으로 전환)
 * 2. Step 2: 시전 포켓몬 정면 앞 - 안쪽 중앙 유리판(#1) 전개
 * 3. Step 3: 안쪽 좌우 유리판(#2, #3) 바깥쪽으로 확장
 * 4. Step 4: 바깥쪽 좌우 유리판(#4, #5) 확장하여 5개 유리판 결합 완성
 * 5. Step 5: 5개 유리판 공명 & 사선 반사광 연속 스위프 & 상단 십자별 반짝임
 * 6. Step 6: 다시 180도 회전하여 원래 내 포켓몬 뷰로 복귀
 * 7. Step 7: 내 포켓몬 뷰 전방에 안착된 빛의장막 수호 상태 유지
 */
export function drawLightScreenEffect(
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

  const cx = casterPos.x;
  const cy = casterPos.y;
  const p = effectProgress;

  // --------------------------------------------------------------------------
  // Step 1: 180도 우측 회전 트랜지션 (순수 전장 카메라 아크 샷)
  // --------------------------------------------------------------------------
  if (moveStep === 1) {
    // 회전 중에는 불필요한 바닥 링 및 점 이펙트 없이 깔끔한 전장 선회만 유지
    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // Step 2: 적 시점 - 안쪽 중앙 유리판(#1) 전개
  // --------------------------------------------------------------------------
  // 레퍼런스 스타일 5단 평행 3D 크리스탈 슬랩 (SV 스타일 3D 직육면체 결계)
  // 좌측 전방(적 방향)으로 레이어가 뻗어나오며 생성:
  // 상단 라인은 거의 수평(4px 차이)으로 정렬되고, 하단 라인은 3D 지면 뎁스(12px 차이)로 확장
  const LAYER_SPECS = [
    { dx: 0, dy: 0, w: 70, h: 108, a: 0.76 },
    { dx: -8, dy: 2, w: 72, h: 110, a: 0.82 },
    { dx: -16, dy: 4, w: 74, h: 112, a: 0.88 },
    { dx: -24, dy: 6, w: 76, h: 114, a: 0.92 },
    { dx: -32, dy: 8, w: 78, h: 116, a: 0.96 },
  ];

  // --------------------------------------------------------------------------
  // Step 2: 1차 기저 레이어 발현 (가장 안쪽 단정 규격: w=70, h=108)
  // --------------------------------------------------------------------------
  if (moveStep === 2) {
    const rot = 0; // 수직 단정 정렬
    const baseX = cx;
    const baseY = cy - 6;
    const spec = LAYER_SPECS[0];

    const alpha = Math.min(0.85, 0.40 + p * 0.45);
    const glow = 1.0 + p * 0.35;

    drawPsychicGlassPanel(ctx, baseX + spec.dx, baseY + spec.dy, spec.w, spec.h, alpha, null, glow, 1.0, rot, 0);
  }

  // --------------------------------------------------------------------------
  // Step 3: 2차, 3차 레이어가 좌측 전방으로 순차 돌출 (살짝 왼쪽 방향으로 생김)
  // --------------------------------------------------------------------------
  else if (moveStep === 3) {
    const rot = 0;
    const baseX = cx;
    const baseY = cy - 6;

    // Layer 0 고정
    drawPsychicGlassPanel(ctx, baseX + LAYER_SPECS[0].dx, baseY + LAYER_SPECS[0].dy, LAYER_SPECS[0].w, LAYER_SPECS[0].h, 0.75, null, 1.0, 1.0, rot, 0);

    if (p <= 0.6) {
      // #21: 2차 레이어가 1차 레이어 앞쪽(좌측 전방)으로 돌출
      const slideP = Math.min(1.0, p / 0.5);
      const l1X = baseX + LAYER_SPECS[1].dx * slideP;
      const l1Y = baseY + LAYER_SPECS[1].dy * slideP;
      drawPsychicGlassPanel(ctx, l1X, l1Y, LAYER_SPECS[1].w, LAYER_SPECS[1].h, 0.82, null, 1.05, 1.0, rot, 1);
    } else {
      // #22: 2차 레이어 안착 + 3차 레이어가 추가 좌측 전방 돌출
      const l1X = baseX + LAYER_SPECS[1].dx;
      const l1Y = baseY + LAYER_SPECS[1].dy;
      drawPsychicGlassPanel(ctx, l1X, l1Y, LAYER_SPECS[1].w, LAYER_SPECS[1].h, 0.82, null, 1.0, 1.0, rot, 1);

      const slideP = Math.min(1.0, (p - 0.5) / 0.5);
      const l2X = baseX + LAYER_SPECS[1].dx + (LAYER_SPECS[2].dx - LAYER_SPECS[1].dx) * slideP;
      const l2Y = baseY + LAYER_SPECS[1].dy + (LAYER_SPECS[2].dy - LAYER_SPECS[1].dy) * slideP;
      drawPsychicGlassPanel(ctx, l2X, l2Y, LAYER_SPECS[2].w, LAYER_SPECS[2].h, 0.88, null, 1.10, 1.0, rot, 2);
    }
  }

  // --------------------------------------------------------------------------
  // Step 4: 4차, 5차(최전방) 레이어가 좌측 전방으로 순차 돌출되어 5단 완성!
  // --------------------------------------------------------------------------
  else if (moveStep === 4) {
    const rot = 0;
    const baseX = cx;
    const baseY = cy - 6;

    // Layer 0, 1, 2 고정
    drawPsychicGlassPanel(ctx, baseX + LAYER_SPECS[0].dx, baseY + LAYER_SPECS[0].dy, LAYER_SPECS[0].w, LAYER_SPECS[0].h, 0.75, null, 1.0, 1.0, rot, 0);
    drawPsychicGlassPanel(ctx, baseX + LAYER_SPECS[1].dx, baseY + LAYER_SPECS[1].dy, LAYER_SPECS[1].w, LAYER_SPECS[1].h, 0.82, null, 1.0, 1.0, rot, 1);
    drawPsychicGlassPanel(ctx, baseX + LAYER_SPECS[2].dx, baseY + LAYER_SPECS[2].dy, LAYER_SPECS[2].w, LAYER_SPECS[2].h, 0.88, null, 1.0, 1.0, rot, 2);

    if (p <= 0.6) {
      // #23: 4차 레이어 돌출 (좌측 전방)
      const slideP = Math.min(1.0, p / 0.5);
      const l3X = baseX + LAYER_SPECS[2].dx + (LAYER_SPECS[3].dx - LAYER_SPECS[2].dx) * slideP;
      const l3Y = baseY + LAYER_SPECS[2].dy + (LAYER_SPECS[3].dy - LAYER_SPECS[2].dy) * slideP;
      drawPsychicGlassPanel(ctx, l3X, l3Y, LAYER_SPECS[3].w, LAYER_SPECS[3].h, 0.92, null, 1.10, 1.0, rot, 3);
    } else {
      // #24: 4차 레이어 안착 + 5차 최전방 레이어 좌측 전방 돌출 완료!
      const l3X = baseX + LAYER_SPECS[3].dx;
      const l3Y = baseY + LAYER_SPECS[3].dy;
      drawPsychicGlassPanel(ctx, l3X, l3Y, LAYER_SPECS[3].w, LAYER_SPECS[3].h, 0.92, null, 1.0, 1.0, rot, 3);

      const slideP = Math.min(1.0, (p - 0.5) / 0.5);
      const l4X = baseX + LAYER_SPECS[3].dx + (LAYER_SPECS[4].dx - LAYER_SPECS[3].dx) * slideP;
      const l4Y = baseY + LAYER_SPECS[3].dy + (LAYER_SPECS[4].dy - LAYER_SPECS[3].dy) * slideP;
      drawPsychicGlassPanel(ctx, l4X, l4Y, LAYER_SPECS[4].w, LAYER_SPECS[4].h, 0.96, null, 1.15, 1.0, rot, 4);
    }
  }

  // --------------------------------------------------------------------------
  // Step 5: 5단 3D 크리스탈 결계 완성 & 공명 펄스 발광 (레퍼런스 SV 완전 구현)
  // --------------------------------------------------------------------------
  else if (moveStep === 5) {
    const rot = 0;
    const baseX = cx;
    const baseY = cy - 6;
    const glowPulse = 1.0 + Math.sin(p * Math.PI) * 0.35;

    // 1. 5개 평행 크리스탈 슬랩 렌더링 (각 기둥마다 유기적으로 분산된 다이아몬드 별빛)
    LAYER_SPECS.forEach((ly, idx) => {
      drawPsychicGlassPanel(
        ctx,
        baseX + ly.dx,
        baseY + ly.dy,
        ly.w,
        ly.h,
        ly.a,
        null,
        glowPulse * (1.0 + idx * 0.03),
        1.0,
        rot,
        idx
      );
    });
  }

  // --------------------------------------------------------------------------
  // Step 6: 360도 순방향 아크 샷 트랜지션 (180° -> 270° -> 360° 내 시점 복귀)
  // (카메라가 가던 방향 그대로 360도 연속 선회하며, 장막도 3D 원근에 맞춰 지속 회전)
  // --------------------------------------------------------------------------
  else if (moveStep === 6) {
    const rot = 0; // 3D 원근 유지: 2D 기울임 없이 수직 단정 정렬
    const isOrbiting = frame?.orbitT !== undefined;

    // 3D 회전 각도에 따른 가로 폭 원근 단축 계수 (카메라 회전 시에만 원근 단축 적용)
    let wScale = 1.0;
    if (isOrbiting) {
      if (p <= 0.5) {
        const u = p / 0.5;
        const minEdge = 0.18;
        wScale = minEdge + (1.0 - minEdge) * Math.cos(u * Math.PI * 0.5);
      } else {
        const v = (p - 0.5) / 0.5;
        const minEdge = 0.18;
        const settleScale = 0.88;
        wScale = minEdge + (settleScale - minEdge) * Math.sin(v * Math.PI * 0.5);
      }
    }

    // 🌟 #27부터 360도 회전 시작 직후 초고속 페이드아웃 (빠른 스냅 디졸브)
    // Frame #27(p=0.06)에서 0.80 -> #29(p=0.18)에서 0.42 -> #31(p=0.32)에서 0.05 -> #32(p=0.38)에서 완전 소멸
    const fadeProgress = Math.min(1.0, p / 0.35);
    const fadeFactor = Math.max(0, Math.pow(1.0 - fadeProgress, 1.2));

    if (fadeFactor <= 0.005) {
      ctx.restore();
      return;
    }

    const curBaseX = cx;

    // 🌟 3D 회전 원근에 따른 세로(Y) 궤도 호 (Orbital Arc):
    // 카메라 회전 중일 때만 타원 궤도를 따라 세로 위치 이동
    const orbitArcY = isOrbiting ? Math.sin(p * Math.PI) * 16 : 0;
    const curBaseY = cy - 6 + orbitArcY;

    // 시전자 -> 상대 방향 벡터 비율
    const dirX = frame?.dirX ?? -Math.cos(p * Math.PI);
    const dirRatio = dirX / 0.901;

    LAYER_SPECS.forEach((ly, idx) => {
      // 5개 레이어가 시전자 전방(상대 방향)으로 뻗어나감
      const lDx = dirRatio * (idx * 8);
      const lDy = ly.dy;

      const px = curBaseX + lDx;
      const py = curBaseY + lDy;
      const curW = ly.w * wScale;

      drawPsychicGlassPanel(
        ctx,
        px,
        py,
        curW,
        ly.h,
        ly.a * fadeFactor,
        null,
        fadeFactor,
        1.0,
        rot,
        idx
      );
    });
  }

  // --------------------------------------------------------------------------
  // Step 7: 내 포켓몬 뷰 안착 (장막은 Step 6 선회 중 이미 완전 소멸되어 깔끔한 시야 유지)
  // --------------------------------------------------------------------------
  else if (moveStep === 7) {
    // 이미 완전 소멸되었으므로 추가 렌더링 없이 시야 확보
    ctx.restore();
    return;
  }

  ctx.restore();
}

/**
 * 113: 빛의장막 (Light Screen) - 배틀 이펙트 (배경 레이어)
 * - 3D 뎁스: 베리어는 배경 포켓몬과 전경 포켓몬 사이(drawMiddleEffect)에서
 *   정확한 Z-depth로 렌더링되므로 배경 레이어는 비워둡니다.
 */
export function drawLightScreenBehindEffect(
  _ctx: any,
  _frame: any,
  _drawCtx: any
) {
  return;
}

// ============================================================================
// 114: 흑안개 (Haze) - 전역 흑안개 가스 구름 & 순차 페이드인 & 반투명 암전
// ============================================================================

/**
 * 부드러운 3차 에르미트 보간 헬퍼 (Smooth Hermite Step)
 */
function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * 전장 반투명 암전 오버레이 (Translucent Dark Atmosphere Fade-in)
 * - 일렁이는 물결 대신 전장을 은은하고 묵직하게 감싸는 반투명 흑요석 암전
 */
function drawTranslucentDarkOverlay(ctx: any, alpha: number) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.fillStyle = `rgba(3, 6, 14, ${Math.min(0.55, alpha)})`;
  ctx.fillRect(-120, -100, 800, 600);
  ctx.restore();
}

/**
 * 안개 바깥쪽을 부드럽게 감싸는 광역 반투명 수증기 미스트 (Outer Translucent Haze Mist)
 * - 짙은 안개 덩어리 바깥쪽으로 약 1.70배 넓게 퍼지며 대기 중에 스며드는 은은하고 투명한 흑색 수증기 층 형성
 * - 0.06~0.22 수준의 극도로 부드럽고 흐릿한(hazy) 투명도로 안개 경계를 넓게 확산
 */
function drawOuterTranslucentMist(
  ctx: any,
  cx: number,
  cy: number,
  w: number,
  h: number,
  alpha: number,
  shiftX: number = 0
) {
  if (alpha <= 0.01 || w <= 10 || h <= 5) return;
  ctx.save();

  const x = cx + shiftX;
  const y = cy;

  const outerW = w * 1.70;
  const outerH = h * 1.75;

  const outerLobes = [
    { dx: 0, dy: 0, rx: outerW * 0.38, ry: outerH * 0.38, weight: 1.0 },
    { dx: -outerW * 0.30, dy: outerH * 0.06, rx: outerW * 0.28, ry: outerH * 0.32, weight: 0.85 },
    { dx: outerW * 0.30, dy: -outerH * 0.05, rx: outerW * 0.29, ry: outerH * 0.33, weight: 0.88 },
    { dx: -outerW * 0.16, dy: -outerH * 0.20, rx: outerW * 0.30, ry: outerH * 0.26, weight: 0.78 },
    { dx: outerW * 0.16, dy: outerH * 0.18, rx: outerW * 0.31, ry: outerH * 0.28, weight: 0.80 },
    { dx: -outerW * 0.40, dy: -outerH * 0.02, rx: outerW * 0.20, ry: outerH * 0.22, weight: 0.65 },
    { dx: outerW * 0.40, dy: outerH * 0.04, rx: outerW * 0.20, ry: outerH * 0.22, weight: 0.65 },
  ];

  for (const lobe of outerLobes) {
    const lx = x + lobe.dx;
    const ly = y + lobe.dy;
    const lrx = lobe.rx;
    const lry = lobe.ry;
    const maxR = Math.max(lrx, lry);

    ctx.save();
    ctx.translate(lx, ly);
    ctx.scale(lrx / maxR, lry / maxR);

    const grad = ctx.createRadialGradient(0, 0, maxR * 0.05, 0, 0, maxR);
    grad.addColorStop(0, `rgba(16, 24, 38, ${Math.min(0.24, alpha * 0.20 * lobe.weight)})`);
    grad.addColorStop(0.45, `rgba(28, 40, 62, ${Math.min(0.15, alpha * 0.12 * lobe.weight)})`);
    grad.addColorStop(0.78, `rgba(45, 60, 88, ${Math.min(0.07, alpha * 0.05 * lobe.weight)})`);
    grad.addColorStop(1.0, "rgba(45, 60, 88, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, maxR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 가로로 큼직하고 흐릿한 유기적 흑안개 가스 구름 코어 (Broad & Hazy Organic Gas Cloud)
 * - 한층 거대해진 스케일(폭 260~335px, 높이 78~104px)과 부드럽고 흐릿한(Hazy) 연무 그라데이션
 * - 지나치게 짙은 칠흑을 배제하고, 코어 0.58 -> 0.38 -> 0.16 -> 0.0의 매우 흐릿하고 유연한 수증기 질감 연출
 */
function drawOrganicHazeCloud(
  ctx: any,
  cx: number,
  cy: number,
  w: number,
  h: number,
  alpha: number,
  shiftX: number = 0,
  density: number = 1.0
) {
  if (alpha <= 0.01 || w <= 10 || h <= 5) return;
  ctx.save();

  const x = cx + shiftX;
  const y = cy;

  // 5개의 가로로 배치된 대형 서브 로브 (풍성하게 뭉게뭉게 퍼지는 가스 구름)
  const lobes = [
    { dx: 0, dy: 0, rx: w * 0.40, ry: h * 0.42, d: 1.0 },
    { dx: -w * 0.26, dy: h * 0.06, rx: w * 0.32, ry: h * 0.36, d: 0.88 },
    { dx: w * 0.26, dy: -h * 0.05, rx: w * 0.33, ry: h * 0.38, d: 0.90 },
    { dx: -w * 0.06, dy: -h * 0.18, rx: w * 0.34, ry: h * 0.30, d: 0.85 },
    { dx: w * 0.08, dy: h * 0.16, rx: w * 0.35, ry: h * 0.32, d: 0.82 },
  ];

  for (const lobe of lobes) {
    const lx = x + lobe.dx;
    const ly = y + lobe.dy;
    const lrx = lobe.rx;
    const lry = lobe.ry;
    const maxR = Math.max(lrx, lry);

    ctx.save();
    ctx.translate(lx, ly);
    ctx.scale(lrx / maxR, lry / maxR);

    const grad = ctx.createRadialGradient(0, 0, maxR * 0.05, 0, 0, maxR);
    // 한층 흐리고(Hazy) 부드럽게 퍼지는 수증기 농도 밸런스
    grad.addColorStop(0, `rgba(10, 16, 26, ${Math.min(0.68, alpha * 0.58 * density * lobe.d)})`);
    grad.addColorStop(0.38, `rgba(20, 28, 44, ${Math.min(0.48, alpha * 0.38 * density * lobe.d)})`);
    grad.addColorStop(0.70, `rgba(32, 44, 66, ${Math.min(0.24, alpha * 0.16 * density)})`);
    grad.addColorStop(0.90, `rgba(45, 60, 85, ${Math.min(0.10, alpha * 0.05 * density)})`);
    grad.addColorStop(1.0, "rgba(45, 60, 85, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, maxR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 상단 림에 스치는 은은하고 흐릿한 슬레이트 하이라이트
  const rimW = w * 0.65;
  const rimH = h * 0.22;
  const rimGrad = ctx.createLinearGradient(x - rimW / 2, y - h * 0.28, x + rimW / 2, y - h * 0.28);
  rimGrad.addColorStop(0, "rgba(45, 58, 80, 0)");
  rimGrad.addColorStop(0.5, `rgba(75, 92, 118, ${Math.min(0.20, alpha * 0.15)})`);
  rimGrad.addColorStop(1.0, "rgba(45, 58, 80, 0)");

  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.ellipse(x, y - h * 0.28, rimW / 2, rimH / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 전장 상단(천장)과 하단(바닥)에 거대하게 포진한 10개의 초대형 가로형 흑안개 구름
 * - 중간 안개는 완전 제거하여 루카리오와 에이스번의 대치 구도와 전장 중앙 시야를 시원하게 확보
 * - [상단 거대 안개대 (Upper Tier)]: 천장 상공을 뒤덮는 5개의 초대형 연무 (w: 360~420px, h: 120~140px)
 * - [하단 거대 안개대 (Lower Tier)]: 전경 바닥을 덮는 5개의 초대형 지면 연무 (w: 370~450px, h: 130~150px)
 */
const HAZE_GLOBAL_CLOUDS = [
  // ==========================================================================
  // 1. [상단 거대 안개대 (Upper Tier - 천장 상공 극단)] y: -55 ~ -25
  // ==========================================================================
  // (1) 좌측 상공 배경
  { x: 90, y: -40, w: 370, h: 125, inStart: 0.16, inEnd: 0.34, outStart: 0.70, outEnd: 0.90, driftX: -15 },
  // (2) 좌중단 상공
  { x: 200, y: -25, w: 400, h: 135, inStart: 0.08, inEnd: 0.26, outStart: 0.74, outEnd: 0.94, driftX: 18 },
  // (3) 중앙 상공 코어
  { x: 300, y: -50, w: 420, h: 140, inStart: 0.12, inEnd: 0.30, outStart: 0.72, outEnd: 0.92, driftX: -18 },
  // (4) 우중단 상공 (적 플랫폼 상공 극단)
  { x: 410, y: -30, w: 390, h: 130, inStart: 0.04, inEnd: 0.22, outStart: 0.74, outEnd: 0.94, driftX: -16 },
  // (5) 최우측 상공 배경
  { x: 505, y: -55, w: 360, h: 120, inStart: 0.20, inEnd: 0.38, outStart: 0.68, outEnd: 0.88, driftX: 14 },

  // ==========================================================================
  // 2. [하단 거대 안개대 (Lower Tier - 전경 바닥)] y: 385 ~ 410
  // ==========================================================================
  // (6) 아군 전면 좌측 바닥
  { x: 75, y: 400, w: 380, h: 130, inStart: 0.04, inEnd: 0.22, outStart: 0.72, outEnd: 0.92, driftX: 20 },
  // (7) 루카리오 발밑 및 플랫폼 지면
  { x: 175, y: 385, w: 420, h: 140, inStart: 0.00, inEnd: 0.18, outStart: 0.75, outEnd: 0.95, driftX: 16 },
  // (8) 전장 최전방 바닥 중앙 코어
  { x: 290, y: 410, w: 450, h: 150, inStart: 0.12, inEnd: 0.30, outStart: 0.73, outEnd: 0.93, driftX: 22 },
  // (9) 우중단 바닥
  { x: 400, y: 390, w: 410, h: 135, inStart: 0.08, inEnd: 0.26, outStart: 0.74, outEnd: 0.94, driftX: -18 },
  // (10) 우측 하단 바닥
  { x: 495, y: 405, w: 370, h: 130, inStart: 0.15, inEnd: 0.33, outStart: 0.70, outEnd: 0.90, driftX: -20 },
];

/**
 * 114: 흑안개 (Haze)
 * - 얼음 타입 변화기: 배틀 중인 모든 포켓몬의 능력치 랭크 변화 완전 초기화 (0 리셋)
 * - 연출: 카메라 줌아웃 와이드 뷰 ➔ 반투명 암전 페이드인 ➔ 전장 전역(11개 지점) 외곽 투명 미스트 & 가로 흑안개 구름 순차 페이드인 ➔ 전장 전체 완전 잠식 ➔ 구름 순차 페이드아웃 & 암전 해제 ➔ 카메라 중립 복귀
 */
export function drawHazeEffect(
  ctx: any,
  _playerPos: { x: number; y: number },
  _enemyPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number,
  _isPlayerCaster: boolean = true
) {
  if (moveStep <= 0) return;
  ctx.save();

  const p = effectProgress;

  // 1. 전장 반투명 암전 오버레이 (0 -> 0.44 -> 0 매끄러운 곡선)
  let overlayAlpha = 0;
  if (p < 0.22) {
    overlayAlpha = smoothStep(0.0, 0.22, p) * 0.44;
  } else if (p <= 0.70) {
    overlayAlpha = 0.44;
  } else {
    overlayAlpha = (1.0 - smoothStep(0.70, 0.96, p)) * 0.44;
  }
  drawTranslucentDarkOverlay(ctx, overlayAlpha);

  // 2-1. [외곽 투명 안개 층] 안개 바깥쪽에 약 1.55배 더 넓고 부드럽게 퍼지는 투명한 수증기 미스트 (alpha: 0.10~0.28)
  //      - 짙은 안개 구름들 바깥쪽으로 부드러운 증기 연무가 퍼져 '너무 짙기만한' 느낌 해소
  for (const c of HAZE_GLOBAL_CLOUDS) {
    const inFactor = smoothStep(c.inStart, c.inEnd, p);
    const outFactor = smoothStep(c.outStart, c.outEnd, p);
    const cloudAlpha = inFactor * (1.0 - outFactor);

    if (cloudAlpha > 0.01) {
      const shiftX = c.driftX * (p - 0.5) * 1.25;
      drawOuterTranslucentMist(ctx, c.x, c.y, c.w, c.h, cloudAlpha, shiftX);
    }
  }

  // 2-2. [중앙 안개 코어 층] 전장 전역(All Quadrants) 유기적 흑안개 가스 구름 본체 렌더링
  for (const c of HAZE_GLOBAL_CLOUDS) {
    const inFactor = smoothStep(c.inStart, c.inEnd, p);
    const outFactor = smoothStep(c.outStart, c.outEnd, p);
    const cloudAlpha = inFactor * (1.0 - outFactor);

    if (cloudAlpha > 0.01) {
      const shiftX = c.driftX * (p - 0.5);
      drawOrganicHazeCloud(ctx, c.x, c.y, c.w, c.h, cloudAlpha * 0.94, shiftX);
    }
  }

  ctx.restore();
}

// ============================================================================
// 115: 리플렉터 (Reflect)
// ============================================================================



/**
 * 6개 꼭짓점을 계산하는 헬퍼 (Pointy-topped hexagon: 상단과 하단에 꼭짓점, 좌우는 수직 모서리)
 */
function getHexagonVertices(cx: number, cy: number, rx: number, ry: number) {
  const vertices: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    vertices.push({
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    });
  }
  return vertices;
}

function drawHexagonPathFromVertices(ctx: any, vertices: { x: number; y: number }[]) {
  ctx.beginPath();
  for (let i = 0; i < vertices.length; i++) {
    if (i === 0) ctx.moveTo(vertices[i].x, vertices[i].y);
    else ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  ctx.closePath();
}

/**
 * 반투명 에메랄드 3D 육각 크리스탈 패널 (Emerald Hexagonal Crystal Panel)
 * - 상하 뾰족한 각도 & 좌우 수직 모서리의 단정하고 견고한 육각 실드 실루엣
 * - 맑고 투명한 에메랄드/시안 그라디언트 본체
 * - 사선 크리스탈 반사광(Reflective Sheen Sweep) 띠 & 수직 수평 직교 그라디언트 & 보조 반사선
 * - 외곽 네온 에메랄드 글로우 & 순백 코어 윤곽선
 */
function drawHexagonalCrystalPanel(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  alpha: number = 1.0,
  sheenOffset: number | null = null,
  glowIntensity: number = 1.0,
  scale: number = 1.0,
  rot: number = 0,
  _panelIndex: number = 0,
  sheenAlpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);
  if (rot !== 0) ctx.rotate(rot);
  if (scale !== 1.0) ctx.scale(scale, scale);

  const outVerts = getHexagonVertices(0, 0, rx, ry);

  // 1. 투명하고 맑은 에메랄드/시안 크리스탈 본체 채움 (내부 선 없는 깔끔한 글래스)
  const baseGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
  baseGrad.addColorStop(0, "rgba(236, 253, 245, 0.18)"); // 소프트 민트
  baseGrad.addColorStop(0.35, "rgba(52, 211, 153, 0.20)"); // 에메랄드 그린
  baseGrad.addColorStop(0.70, "rgba(16, 185, 129, 0.16)"); // 딥 에메랄드
  baseGrad.addColorStop(1, "rgba(6, 182, 212, 0.12)");    // 시안 굴절
  ctx.fillStyle = baseGrad;
  drawHexagonPathFromVertices(ctx, outVerts);
  ctx.fill();

  // 2. 사선 크리스탈 반사광 (Diagonal Sheen Sweep & Right Facet Highlight)
  if (sheenOffset !== null && sheenOffset >= -1.2 && sheenOffset <= 1.2 && sheenAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * sheenAlpha;
    drawHexagonPathFromVertices(ctx, outVerts);
    ctx.clip();

    // rx는 패널 가로 반지름 (육각 실질 가로 경계: ±0.866 * rx)
    // sheenOffset = -0.55 (좌측면: bandX ≈ -27px) -> 0.00 (중앙: 0px) -> +0.55 (우측면: bandX ≈ +27px)
    const bandX = sheenOffset * rx;

    // 사선 기울기 및 법선 벡터 연산 (빛 줄기에 정확히 수직인 그라디언트)
    const tiltX = 16;
    const dy = ry * 2;
    const dx = tiltX * 2;
    const len = Math.hypot(dx, dy) || 1;
    const normX = dy / len;
    const normY = -dx / len;

    const wHalf = 11;
    const sheenGrad = ctx.createLinearGradient(
      bandX - wHalf * normX,
      -wHalf * normY,
      bandX + wHalf * normX,
      wHalf * normY
    );
    sheenGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    sheenGrad.addColorStop(0.25, "rgba(167, 243, 208, 0.40)");
    sheenGrad.addColorStop(0.50, "rgba(255, 255, 255, 0.95)");
    sheenGrad.addColorStop(0.75, "rgba(167, 243, 208, 0.40)");
    sheenGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    // 메인 사선 반사광 띠 (Main Sheen Quad)
    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.moveTo(bandX - tiltX - wHalf, -ry - 2);
    ctx.lineTo(bandX - tiltX + wHalf, -ry - 2);
    ctx.lineTo(bandX + tiltX + wHalf, ry + 2);
    ctx.lineTo(bandX + tiltX - wHalf, ry + 2);
    ctx.closePath();
    ctx.fill();

    // 순백 샤프 레이저 코어 선 (Sharp White Laser Core)
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bandX - tiltX, -ry - 2);
    ctx.lineTo(bandX + tiltX, ry + 2);
    ctx.stroke();
    ctx.restore();

    // 보조 얇은 반사선 (Secondary Parallel Accent Sheen Stripe)
    const thinOffset = -7.0;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.60)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(bandX + thinOffset * normX - tiltX, -ry - 2 + thinOffset * normY);
    ctx.lineTo(bandX + thinOffset * normX + tiltX, ry + 2 + thinOffset * normY);
    ctx.stroke();
    ctx.restore();

    // #26: 우측 반사면 안착 엣지 하이라이트 (Right Facet Rim Glint in Frame #26)
    if (sheenOffset >= 0.40) {
      const rightAlpha = Math.min(1.0, (sheenOffset - 0.40) / 0.15);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.90 * rightAlpha})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0.866 * rx, -0.5 * ry);
      ctx.lineTo(0.866 * rx, 0.5 * ry);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // 3. 외곽 네온 발광 및 순백 윤곽선
  // 3-1. 넓은 에메랄드 네온 헤일로
  ctx.strokeStyle = `rgba(16, 185, 129, ${0.30 * glowIntensity})`;
  ctx.lineWidth = 4.0;
  drawHexagonPathFromVertices(ctx, outVerts);
  ctx.stroke();

  // 3-2. 선명한 에메랄드/민트 네온 테두리
  ctx.strokeStyle = `rgba(52, 211, 153, ${0.65 * glowIntensity})`;
  ctx.lineWidth = 2.2;
  drawHexagonPathFromVertices(ctx, outVerts);
  ctx.stroke();

  // 3-3. 순백 코어 윤곽선
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * glowIntensity})`;
  ctx.lineWidth = 1.2;
  drawHexagonPathFromVertices(ctx, outVerts);
  ctx.stroke();

  ctx.restore();
}

/**
 * 115: 리플렉터 (Reflect) - 배틀 이펙트 (전면 레이어)
 *
 * 연출 흐름:
 * 1. Step 1: 카메라 각도 180도 우측 회전 (적 시점에서 시전 포켓몬 보는 시점으로 전환)
 * 2. Step 2: 시전 포켓몬 정면 앞 - 1차 기저 3D 육각 크리스탈 베리어(#1) 전개
 * 3. Step 3: 2차, 3차 육각 패널(#2, #3) 전방으로 순차 돌출
 * 4. Step 4: 4차, 5차 육각 패널(#4, #5) 돌출하여 5단 일체형 육각 거울 결계 결합 완성
 * 5. Step 5: 5단 육각 결계 공명 & 에메랄드 사선 반사광 연속 스위프 & 상단 수평 플레어 & 꼭짓점 십자별 반짝임
 * 6. Step 6: 다시 180도 선회하여 360도 순방향 완주 & 원래 아군 뷰 복귀 (베리어 에메랄드 스타더스트 분산 페이드아웃)
 * 7. Step 7: 내 포켓몬 뷰 전방에 안착된 리플렉터 수호 상태 유지
 */
export function drawReflectEffect(
  ctx: any,
  casterPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number,
  frame?: any,
  _drawCtx?: any
) {
  if (moveStep <= 0) return;
  ctx.save();

  const cx = casterPos.x;
  const cy = casterPos.y;
  const p = effectProgress;

  // --------------------------------------------------------------------------
  // Step 1: 180도 우측 회전 트랜지션 (순수 전장 카메라 아크 샷)
  // --------------------------------------------------------------------------
  if (moveStep === 1) {
    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // 5단 평행 3D 육각 크리스탈 베리어 레이어 스펙
  // 좌측 전방(상대 방향)으로 레이어가 뻗어나오며 적층 생성:
  // 지면 3D 뎁스에 맞춰 dx, dy 오프셋 및 크기 점증
  // --------------------------------------------------------------------------
  const HEX_LAYER_SPECS = [
    { dx: 0, dy: 0, rx: 42, ry: 50, a: 0.76 },
    { dx: -8, dy: 2, rx: 44, ry: 52, a: 0.82 },
    { dx: -16, dy: 4, rx: 46, ry: 54, a: 0.88 },
    { dx: -24, dy: 6, rx: 48, ry: 56, a: 0.92 },
    { dx: -32, dy: 8, rx: 50, ry: 58, a: 0.96 },
  ];

  // --------------------------------------------------------------------------
  // Step 2: 1차 기저 육각 레이어 발현 (가장 안쪽 단정 규격)
  // --------------------------------------------------------------------------
  if (moveStep === 2) {
    const rot = 0;
    const baseX = cx;
    const baseY = cy - 6;
    const spec = HEX_LAYER_SPECS[0];

    const alpha = Math.min(0.85, 0.40 + p * 0.45);
    const glow = 1.0 + p * 0.35;

    drawHexagonalCrystalPanel(
      ctx,
      baseX + spec.dx,
      baseY + spec.dy,
      spec.rx,
      spec.ry,
      alpha,
      null,
      glow,
      1.0,
      rot,
      0
    );
  }

  // --------------------------------------------------------------------------
  // Step 3: 2차, 3차 육각 레이어가 전방으로 순차 돌출
  // --------------------------------------------------------------------------
  else if (moveStep === 3) {
    const rot = 0;
    const baseX = cx;
    const baseY = cy - 6;

    // Layer 0 고정
    drawHexagonalCrystalPanel(
      ctx,
      baseX + HEX_LAYER_SPECS[0].dx,
      baseY + HEX_LAYER_SPECS[0].dy,
      HEX_LAYER_SPECS[0].rx,
      HEX_LAYER_SPECS[0].ry,
      0.75,
      null,
      1.0,
      1.0,
      rot,
      0
    );

    if (p <= 0.6) {
      // 2차 육각 레이어가 1차 레이어 앞쪽으로 돌출
      const slideP = Math.min(1.0, p / 0.5);
      const l1X = baseX + HEX_LAYER_SPECS[1].dx * slideP;
      const l1Y = baseY + HEX_LAYER_SPECS[1].dy * slideP;
      drawHexagonalCrystalPanel(
        ctx,
        l1X,
        l1Y,
        HEX_LAYER_SPECS[1].rx,
        HEX_LAYER_SPECS[1].ry,
        0.82,
        null,
        1.05,
        1.0,
        rot,
        1
      );
    } else {
      // 2차 레이어 안착 + 3차 레이어 추가 돌출
      const l1X = baseX + HEX_LAYER_SPECS[1].dx;
      const l1Y = baseY + HEX_LAYER_SPECS[1].dy;
      drawHexagonalCrystalPanel(
        ctx,
        l1X,
        l1Y,
        HEX_LAYER_SPECS[1].rx,
        HEX_LAYER_SPECS[1].ry,
        0.82,
        null,
        1.0,
        1.0,
        rot,
        1
      );

      const slideP = Math.min(1.0, (p - 0.5) / 0.5);
      const l2X = baseX + HEX_LAYER_SPECS[1].dx + (HEX_LAYER_SPECS[2].dx - HEX_LAYER_SPECS[1].dx) * slideP;
      const l2Y = baseY + HEX_LAYER_SPECS[1].dy + (HEX_LAYER_SPECS[2].dy - HEX_LAYER_SPECS[1].dy) * slideP;
      drawHexagonalCrystalPanel(
        ctx,
        l2X,
        l2Y,
        HEX_LAYER_SPECS[2].rx,
        HEX_LAYER_SPECS[2].ry,
        0.88,
        null,
        1.10,
        1.0,
        rot,
        2
      );
    }
  }

  // --------------------------------------------------------------------------
  // Step 4: 4차, 5차 최전방 육각 레이어가 순차 돌출되어 5단 완성!
  // --------------------------------------------------------------------------
  else if (moveStep === 4) {
    const rot = 0;
    const baseX = cx;
    const baseY = cy - 6;

    // Layer 0, 1, 2 고정
    drawHexagonalCrystalPanel(ctx, baseX + HEX_LAYER_SPECS[0].dx, baseY + HEX_LAYER_SPECS[0].dy, HEX_LAYER_SPECS[0].rx, HEX_LAYER_SPECS[0].ry, 0.75, null, 1.0, 1.0, rot, 0);
    drawHexagonalCrystalPanel(ctx, baseX + HEX_LAYER_SPECS[1].dx, baseY + HEX_LAYER_SPECS[1].dy, HEX_LAYER_SPECS[1].rx, HEX_LAYER_SPECS[1].ry, 0.82, null, 1.0, 1.0, rot, 1);
    drawHexagonalCrystalPanel(ctx, baseX + HEX_LAYER_SPECS[2].dx, baseY + HEX_LAYER_SPECS[2].dy, HEX_LAYER_SPECS[2].rx, HEX_LAYER_SPECS[2].ry, 0.88, null, 1.0, 1.0, rot, 2);

    if (p <= 0.6) {
      // 4차 육각 레이어 돌출
      const slideP = Math.min(1.0, p / 0.5);
      const l3X = baseX + HEX_LAYER_SPECS[2].dx + (HEX_LAYER_SPECS[3].dx - HEX_LAYER_SPECS[2].dx) * slideP;
      const l3Y = baseY + HEX_LAYER_SPECS[2].dy + (HEX_LAYER_SPECS[3].dy - HEX_LAYER_SPECS[2].dy) * slideP;
      drawHexagonalCrystalPanel(ctx, l3X, l3Y, HEX_LAYER_SPECS[3].rx, HEX_LAYER_SPECS[3].ry, 0.92, null, 1.10, 1.0, rot, 3);
    } else {
      // 4차 레이어 안착 + 5차 최전방 육각 레이어 전방 돌출 완료!
      const l3X = baseX + HEX_LAYER_SPECS[3].dx;
      const l3Y = baseY + HEX_LAYER_SPECS[3].dy;
      drawHexagonalCrystalPanel(ctx, l3X, l3Y, HEX_LAYER_SPECS[3].rx, HEX_LAYER_SPECS[3].ry, 0.92, null, 1.0, 1.0, rot, 3);

      const slideP = Math.min(1.0, (p - 0.5) / 0.5);
      const l4X = baseX + HEX_LAYER_SPECS[3].dx + (HEX_LAYER_SPECS[4].dx - HEX_LAYER_SPECS[3].dx) * slideP;
      const l4Y = baseY + HEX_LAYER_SPECS[3].dy + (HEX_LAYER_SPECS[4].dy - HEX_LAYER_SPECS[3].dy) * slideP;
      drawHexagonalCrystalPanel(ctx, l4X, l4Y, HEX_LAYER_SPECS[4].rx, HEX_LAYER_SPECS[4].ry, 0.96, null, 1.15, 1.0, rot, 4);
    }
  }

  // --------------------------------------------------------------------------
  // Step 5: 5단 3D 육각 결계 완성 & 공명 펄스 & 사선 반사광 스위프
  // --------------------------------------------------------------------------
  else if (moveStep === 5) {
    const rot = 0;
    const baseX = cx;
    const baseY = cy - 6;
    const glowPulse = 1.0 + Math.sin(p * Math.PI) * 0.35;

    // 사선 반사면(막의 반사면) 스위프 진행도 및 페이드인/페이드아웃 연산:
    // #24 (p=0.25): 좌측 면 스위프 시작 & 부드러운 페이드인 (sheenOffset = -0.55, sheenAlpha = 0.45)
    // #25 (p=0.55): 중앙 정면 통과 & 피크 최고조 (sheenOffset = 0.00, sheenAlpha = 1.00)
    // #26 (p=0.95): 우측 면 안착 완료 & 페이드아웃 진행 (sheenOffset = +0.55, sheenAlpha = 0.45)
    let sheenOffset: number;
    let sheenAlpha: number;
    if (p <= 0.55) {
      sheenOffset = -0.55 + ((p - 0.25) / 0.30) * 0.55;
      sheenAlpha = 0.45 + ((p - 0.25) / 0.30) * 0.55;
    } else {
      sheenOffset = ((p - 0.55) / 0.40) * 0.55;
      sheenAlpha = 1.00 - ((p - 0.55) / 0.40) * 0.55;
    }
    sheenAlpha = Math.max(0, Math.min(1.0, sheenAlpha));

    // 1. 5개 평행 육각 크리스탈 패널 렌더링 (반짝이는 반사광은 제일 앞 최상단 패널에만 페이드인/아웃 적용)
    HEX_LAYER_SPECS.forEach((ly, idx) => {
      const isFront = (idx === HEX_LAYER_SPECS.length - 1);
      drawHexagonalCrystalPanel(
        ctx,
        baseX + ly.dx,
        baseY + ly.dy,
        ly.rx,
        ly.ry,
        ly.a,
        isFront ? sheenOffset : null,
        glowPulse * (1.0 + idx * 0.03),
        1.0,
        rot,
        idx,
        sheenAlpha
      );
    });
  }

  // --------------------------------------------------------------------------
  // Step 6: 360도 순방향 아크 샷 트랜지션 (180° -> 270° -> 360° 내 시점 복귀)
  // (카메라가 360도 연속 선회하며, 육각 장막도 3D 원근에 맞춰 회전 및 초고속 페이드아웃)
  // --------------------------------------------------------------------------
  else if (moveStep === 6) {
    const rot = 0;
    const isOrbiting = frame?.orbitT !== undefined;

    // 3D 회전 각도에 따른 가로 폭 원근 단축 계수
    let wScale = 1.0;
    if (isOrbiting) {
      if (p <= 0.5) {
        const u = p / 0.5;
        const minEdge = 0.18;
        wScale = minEdge + (1.0 - minEdge) * Math.cos(u * Math.PI * 0.5);
      } else {
        const v = (p - 0.5) / 0.5;
        const minEdge = 0.18;
        const settleScale = 0.88;
        wScale = minEdge + (settleScale - minEdge) * Math.sin(v * Math.PI * 0.5);
      }
    }

    // 초고속 페이드아웃 (빠른 스냅 디졸브)
    const fadeProgress = Math.min(1.0, p / 0.35);
    const fadeFactor = Math.max(0, Math.pow(1.0 - fadeProgress, 1.2));

    if (fadeFactor <= 0.005) {
      ctx.restore();
      return;
    }

    const curBaseX = cx;
    const orbitArcY = isOrbiting ? Math.sin(p * Math.PI) * 16 : 0;
    const curBaseY = cy - 6 + orbitArcY;

    // 시전자 -> 상대 방향 벡터 비율
    const dirX = frame?.dirX ?? -Math.cos(p * Math.PI);
    const dirRatio = dirX / 0.901;

    // Step 6 초반 잔여 반사광 페이드아웃 마무리 (Frame #27 등 회전 시작 직후 부드럽게 소멸)
    const step6SheenAlpha = p < 0.12 ? 0.45 * (1.0 - p / 0.12) * fadeFactor : 0;

    HEX_LAYER_SPECS.forEach((ly, idx) => {
      const lDx = dirRatio * (idx * 8);
      const lDy = ly.dy;

      const px = curBaseX + lDx;
      const py = curBaseY + lDy;
      const curRx = ly.rx * wScale;
      const isFront = (idx === HEX_LAYER_SPECS.length - 1);

      drawHexagonalCrystalPanel(
        ctx,
        px,
        py,
        curRx,
        ly.ry,
        ly.a * fadeFactor,
        (isFront && step6SheenAlpha > 0.01) ? 0.55 : null,
        fadeFactor,
        1.0,
        rot,
        idx,
        step6SheenAlpha
      );
    });

    // 소멸 시 흩날리는 에메랄드 스타더스트
    const dusts = [
      { ox: 0, oy: -20, vx: -18, vy: -16 },
      { ox: 14, oy: 0, vx: 20, vy: -10 },
      { ox: -14, oy: 15, vx: -22, vy: 14 },
      { ox: 10, oy: -14, vx: 16, vy: -18 },
      { ox: -10, oy: 22, vx: -15, vy: 16 },
      { ox: 16, oy: 18, vx: 22, vy: 12 },
      { ox: -16, oy: -18, vx: -24, vy: -12 },
      { ox: 0, oy: 12, vx: 0, vy: 22 }
    ];
    for (const d of dusts) {
      const dx = curBaseX + d.ox + d.vx * p;
      const dy = curBaseY + d.oy + d.vy * p;
      const dAlpha = Math.max(0, 1.0 - p);
      drawMiniRetroStar(ctx, dx, dy, 5, "#A7F3D0", dAlpha * fadeFactor * 0.9);
    }
  }

  // --------------------------------------------------------------------------
  // Step 7: 내 포켓몬 뷰 안착 (장막은 Step 6 선회 중 이미 완전 소멸되어 시야 확보)
  // --------------------------------------------------------------------------
  else if (moveStep === 7) {
    ctx.restore();
    return;
  }

  ctx.restore();
}

/**
 * 115: 리플렉터 (Reflect) - 배틀 이펙트 (배경 레이어)
 * - 3D 뎁스: 베리어는 배경 포켓몬과 전경 포켓몬 사이(drawMiddleEffect)에서
 *   정확한 Z-depth로 렌더링되므로 배경 레이어는 비워둡니다.
 */
export function drawReflectBehindEffect(
  _ctx: any,
  _frame: any,
  _drawCtx: any
) {
  return;
}

// ============================================================================
// 116: 기충전 / 기에모으기 (Focus Energy)
// ============================================================================

/**
 * 116: 기충전 / 기에모으기 (Focus Energy)
 * - 노말 타입 변화기: 자신의 급소율(Critical Hit Ratio) +2랭크 상승
 * - 신규 리메이크: 시전 포켓몬 둘레를 3D 입체로 둥글게 떠서 도는 영롱한 노란빛 에너지 구체
 */

/**
 * 기충전: 노란빛이 나는 에너지 구체 (Yellow Glowing Ki Orb)
 */
function drawYellowGlowingOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number = 1.0,
  isFront: boolean = true
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 1. 외곽 부드러운 방사형 네온 오라 (Wide Soft Halo)
  const haloR = radius * (isFront ? 2.3 : 1.8);
  const haloGrad = ctx.createRadialGradient(x, y, radius * 0.2, x, y, haloR);
  haloGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");   // 순백 중심 발광
  haloGrad.addColorStop(0.35, "rgba(254, 240, 138, 0.50)"); // 페일 레몬
  haloGrad.addColorStop(0.70, "rgba(253, 224, 71, 0.20)");  // 소프트 옐로우
  haloGrad.addColorStop(1.0, "rgba(250, 204, 21, 0.0)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(x, y, haloR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중간 압축 발광 림 (Inner Concentrated Glow)
  const innerR = radius * 1.35;
  const innerGrad = ctx.createRadialGradient(x, y, 0, x, y, innerR);
  innerGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
  innerGrad.addColorStop(0.50, "rgba(254, 249, 195, 0.85)"); // 페일 크림
  innerGrad.addColorStop(1.0, "rgba(253, 224, 71, 0.0)");
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(x, y, innerR, 0, Math.PI * 2);
  ctx.fill();

  // 3. 구체 본체 (3D Sphere Body - 하이라이트 색상을 베이스 색으로 적용)
  const spotX = x - radius * 0.25;
  const spotY = y - radius * 0.25;
  const bodyGrad = ctx.createRadialGradient(
    spotX,
    spotY,
    radius * 0.05,
    x,
    y,
    radius
  );
  bodyGrad.addColorStop(0.0, "#FFFFFF");     // 순백 극점
  bodyGrad.addColorStop(0.35, "#FEFCE8");    // 페일 웜 화이트 (하이라이트 베이스)
  bodyGrad.addColorStop(0.70, "#FEF9C3");    // 페일 크림 옐로우 (기존 하이라이트 색상)
  bodyGrad.addColorStop(1.0, "#FEF08A");     // 소프트 파스텔 옐로우 림
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // 4. 구체 표면 순백 스펙큘러 핫스팟 (Micro Specular Highlight)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(spotX, spotY, Math.max(0.8, radius * 0.32), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 구체에서 상공으로 치솟는 영롱한 노란빛줄기 (Upward Yellow Ki Beam)
 * - 높이와 광도에 따라 웅장하게 확장되는 4단 입체 광선 기둥
 */
function drawYellowUpwardBeam(
  ctx: any,
  x: number,
  y: number,
  height: number,
  intensity: number,
  orbRadius: number,
  sparkPhase: number = 0
) {
  if (intensity <= 0.02 || height <= 2) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * intensity;

  const topY = y - height;

  // 1. 외곽 소프트 골든/레몬 네온 헤일로 (Wide Soft Halo) - 초장거리 높이에 맞춰 폭 확장
  const haloWidth = Math.min(18, 13 + (height / 130) * 4);
  const haloGrad = ctx.createLinearGradient(0, y, 0, topY);
  haloGrad.addColorStop(0.0, "rgba(254, 240, 138, 0.55)"); // 레몬 옐로우
  haloGrad.addColorStop(0.3, "rgba(250, 204, 21, 0.40)");  // 골든 옐로우
  haloGrad.addColorStop(0.7, "rgba(253, 224, 71, 0.25)");  // 소프트 옐로우
  haloGrad.addColorStop(1.0, "rgba(254, 249, 195, 0.0)");  // 상공 페이드아웃

  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.moveTo(x - haloWidth * 0.5, y);
  ctx.lineTo(x - haloWidth * 0.35, topY);
  ctx.lineTo(x + haloWidth * 0.35, topY);
  ctx.lineTo(x + haloWidth * 0.5, y);
  ctx.closePath();
  ctx.fill();

  // 2. 내부 루미너스 페일 크림 광선 줄기 (Inner Luminous Column)
  const colWidth = Math.min(7.0, 5.0 + (height / 130) * 1.8);
  const colGrad = ctx.createLinearGradient(0, y, 0, topY);
  colGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.98)");
  colGrad.addColorStop(0.2, "rgba(254, 252, 232, 0.90)"); // #FEFCE8
  colGrad.addColorStop(0.65, "rgba(254, 249, 195, 0.70)"); // #FEF9C3
  colGrad.addColorStop(1.0, "rgba(254, 240, 138, 0.0)");  // #FEF08A 페이드

  ctx.fillStyle = colGrad;
  ctx.beginPath();
  ctx.moveTo(x - colWidth * 0.5, y);
  ctx.lineTo(x - colWidth * 0.35, topY);
  ctx.lineTo(x + colWidth * 0.35, topY);
  ctx.lineTo(x + colWidth * 0.5, y);
  ctx.closePath();
  ctx.fill();

  // 3. 초고휘도 순백 중심 레이저 코어 (Pure White Center Laser Streak)
  const coreWidth = Math.min(2.4, 1.6 + (height / 130) * 0.6);
  const coreGrad = ctx.createLinearGradient(0, y, 0, topY);
  coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  coreGrad.addColorStop(0.4, "rgba(255, 255, 255, 0.95)");
  coreGrad.addColorStop(0.85, "rgba(254, 252, 232, 0.65)");
  coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.fillRect(x - coreWidth * 0.5, topY + height * 0.06, coreWidth, height * 0.94);

  // 4. 빛줄기를 타고 상승하는 기운 스파크 대시 (Ascending Energy Streaks) - 높은 기둥에 맞춰 5개로 증강
  const sparkCount = height > 85 ? 5 : 3;
  for (let i = 0; i < sparkCount; i++) {
    const prog = (sparkPhase + i * (1.0 / sparkCount)) % 1.0;
    const sy = y - prog * height;
    const sx = x + Math.sin(prog * Math.PI * 4 + i * 2) * 1.8;
    const sparkAlpha = Math.sin(prog * Math.PI);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * sparkAlpha})`;
    ctx.fillRect(sx - 0.7, sy - 3.0, 1.4, Math.min(7.0, 4.0 + height * 0.025));
  }

  ctx.restore();
}

/**
 * 빛줄기 분출 지점 구체 표면 폭발광 & 반짝임 (Beam Eruption Root Bloom & Glint)
 */
function drawBeamRootBloom(
  ctx: any,
  x: number,
  y: number,
  intensity: number,
  orbRadius: number
) {
  if (intensity <= 0.05) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * intensity;

  // 1. 발사 구체 표면 순백-황금 방사형 폭발광
  const bloomR = orbRadius * (2.0 + intensity * 0.6);
  const bGrad = ctx.createRadialGradient(x, y, 0, x, y, bloomR);
  bGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.98)");
  bGrad.addColorStop(0.35, "rgba(254, 249, 195, 0.75)");
  bGrad.addColorStop(0.70, "rgba(250, 204, 21, 0.45)");
  bGrad.addColorStop(1.0, "rgba(250, 204, 21, 0.0)");

  ctx.fillStyle = bGrad;
  ctx.beginPath();
  ctx.arc(x, y, bloomR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 구체 중심 십자/다이아몬드 스파크 글린트 (분출구 핫스팟)
  const starR = orbRadius * (1.6 + intensity * 0.6);
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(x, y - starR);
  ctx.quadraticCurveTo(x, y, x + starR * 0.35, y);
  ctx.quadraticCurveTo(x, y, x, y + starR * 0.6);
  ctx.quadraticCurveTo(x, y, x - starR * 0.35, y);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - starR * 0.8, y);
  ctx.quadraticCurveTo(x, y, x, y - starR * 0.35);
  ctx.quadraticCurveTo(x, y, x + starR * 0.8, y);
  ctx.quadraticCurveTo(x, y, x, y + starR * 0.35);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

interface FocusBeamState {
  height: number;
  intensity: number;
  sparkPhase: number;
}

interface FocusSingleOrb {
  x: number;
  y: number;
  z: number;
  radius: number;
  alpha: number;
  isFront: boolean;
  beam?: FocusBeamState;
  trail: Array<{
    x: number;
    y: number;
    z: number;
    radius: number;
    alpha: number;
    isFront: boolean;
  }>;
  groundShadow: {
    x: number;
    y: number;
    rx: number;
    ry: number;
    alpha: number;
  };
}

interface FocusOrbMultiState {
  orbs: FocusSingleOrb[];
}

function getFocusEnergyOrbState(frame: any, casterPos: { x: number; y: number }): FocusOrbMultiState {
  const baseAngle = frame.orbAngle ?? 0;
  const cx = casterPos.x;
  const cy = casterPos.y - 12; // 포켓몬 체구 중심 높이

  const Rx = 44; // 타원 가로 반경 (포켓몬 좌우를 시원하게 감싸는 폭)
  const Ry = 16; // 타원 세로 반경 (2.5D 전장 틸트 시각)

  const ORB_COUNT = 8;
  const angleStep = (Math.PI * 2) / ORB_COUNT; // 45도 균등 간격 (8방위 링)

  const orbBeams: Array<{ orbIndex: number; height: number; intensity: number }> = frame.orbBeams || [];

  const orbs: FocusSingleOrb[] = [];

  for (let i = 0; i < ORB_COUNT; i++) {
    const angle = baseAngle + i * angleStep;

    // 메인 구체 위치 및 3D 뎁스
    // z = sin(angle): > 0 이면 전면(화면 아래쪽, 카메라 근접), < 0 이면 배후(화면 위쪽)
    const z = Math.sin(angle);
    const x = cx + Rx * Math.cos(angle);
    const y = cy + Ry * Math.sin(angle);

    // 3D 원근 스케일 (구체 더 작게: 전면 3.7px, 배후 2.3px, 중심 3.0px)
    const baseR = 3.0 + z * 0.7;

    // 구체 상공 분출 빔 설정
    const beamConfig = orbBeams.find(b => b.orbIndex === i);
    let beam: FocusBeamState | undefined;
    if (beamConfig && beamConfig.intensity > 0.01) {
      beam = {
        height: beamConfig.height,
        intensity: beamConfig.intensity,
        sparkPhase: (frame.effectProgress ?? 0) * 3.5 + i * 0.4,
      };
    }

    // 꼬리 잔상 (Trailing Trail Particles: 8개 미니 구체에 맞춘 콤팩트 2단계 페이드 꼬리)
    const trailOffsets = [0.07, 0.14];
    const trail = trailOffsets.map((offset, idx) => {
      const tAngle = angle - offset;
      const tZ = Math.sin(tAngle);
      const tX = cx + Rx * Math.cos(tAngle);
      const tY = cy + Ry * Math.sin(tAngle);
      const fade = Math.pow(0.60, idx + 1);
      const tR = (baseR * 0.70) * Math.pow(0.70, idx);
      return {
        x: tX,
        y: tY,
        z: tZ,
        radius: Math.max(1.1, tR),
        alpha: fade * (tZ >= 0 ? 0.85 : 0.55),
        isFront: tZ >= 0,
      };
    });

    // 바닥에 은은하게 비치는 노란빛 반사광 (빔 방출 시 더욱 강렬해짐)
    const groundY = casterPos.y + 24;
    const shadowAlpha = (0.05 + (z + 1) * 0.02) * (beam ? 2.2 : 1.0);
    const groundShadow = {
      x,
      y: groundY,
      rx: baseR * (beam ? 1.6 : 1.2),
      ry: baseR * (beam ? 0.45 : 0.35),
      alpha: Math.min(0.35, shadowAlpha),
    };

    orbs.push({
      x,
      y,
      z,
      radius: baseR,
      alpha: z >= 0 ? 1.0 : 0.88,
      isFront: z >= 0,
      beam,
      trail,
      groundShadow,
    });
  }

  return { orbs };
}

/**
 * 116: 기충전 (Focus Energy) - 배후 레이어 (포켓몬 스프라이트 뒤편)
 */
export function drawFocusEnergyBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const casterPos = drawCtx?.casterPos || drawCtx?.attackerPos;
  if (!casterPos) return;

  const state = getFocusEnergyOrbState(frame, casterPos);

  // 1. 바닥 노란빛 반사광 (배후 접지면)
  ctx.save();
  for (const orb of state.orbs) {
    ctx.fillStyle = `rgba(250, 204, 21, ${orb.groundShadow.alpha})`;
    ctx.beginPath();
    ctx.ellipse(
      orb.groundShadow.x,
      orb.groundShadow.y,
      orb.groundShadow.rx,
      orb.groundShadow.ry,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  // 2. 배후에 위치한 구체들 z 깊이에 따라 정렬 (더 먼 쪽부터 먼저 그림)
  const behindOrbs = state.orbs.filter(o => !o.isFront).sort((a, b) => a.z - b.z);

  for (const orb of behindOrbs) {
    // 1) 꼬리 잔상 중 배후인 입자
    for (let i = orb.trail.length - 1; i >= 0; i--) {
      const pt = orb.trail[i];
      if (!pt.isFront) {
        drawYellowGlowingOrb(ctx, pt.x, pt.y, pt.radius, pt.alpha, false);
      }
    }
    // 2) 위로 뿜어내는 노란빛줄기 (배후)
    if (orb.beam) {
      drawYellowUpwardBeam(ctx, orb.x, orb.y, orb.beam.height, orb.beam.intensity, orb.radius, orb.beam.sparkPhase);
    }
    // 3) 메인 구체
    drawYellowGlowingOrb(ctx, orb.x, orb.y, orb.radius, orb.alpha, false);
    // 4) 구체 표면 분출구 폭발광 & 반짝임
    if (orb.beam) {
      drawBeamRootBloom(ctx, orb.x, orb.y, orb.beam.intensity, orb.radius);
    }
  }

  // 3. 전면에 있는 구체의 꼬리 잔상 중 배후에 걸쳐있는 입자 렌더링
  const frontOrbs = state.orbs.filter(o => o.isFront);
  for (const orb of frontOrbs) {
    for (let i = orb.trail.length - 1; i >= 0; i--) {
      const pt = orb.trail[i];
      if (!pt.isFront) {
        drawYellowGlowingOrb(ctx, pt.x, pt.y, pt.radius, pt.alpha, false);
      }
    }
  }
}

/**
 * 116: 기충전 (Focus Energy) - 전면 레이어 (포켓몬 스프라이트 앞편)
 */
export function drawFocusEnergyEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const casterPos = drawCtx?.casterPos || drawCtx?.attackerPos;
  if (!casterPos) return;

  const state = getFocusEnergyOrbState(frame, casterPos);

  // 1. 배후에 있는 구체의 꼬리 잔상 중 전면에 걸쳐있는 입자 먼저 렌더링
  const behindOrbs = state.orbs.filter(o => !o.isFront);
  for (const orb of behindOrbs) {
    for (let i = orb.trail.length - 1; i >= 0; i--) {
      const pt = orb.trail[i];
      if (pt.isFront) {
        drawYellowGlowingOrb(ctx, pt.x, pt.y, pt.radius, pt.alpha, true);
      }
    }
  }

  // 2. 전면에 위치한 구체들 z 깊이에 따라 정렬 (더 먼 쪽부터, 가장 앞쪽을 마지막에 그림)
  const frontOrbs = state.orbs.filter(o => o.isFront).sort((a, b) => a.z - b.z);

  for (const orb of frontOrbs) {
    // 1) 꼬리 잔상 중 전면인 입자
    for (let i = orb.trail.length - 1; i >= 0; i--) {
      const pt = orb.trail[i];
      if (pt.isFront) {
        drawYellowGlowingOrb(ctx, pt.x, pt.y, pt.radius, pt.alpha, true);
      }
    }
    // 2) 위로 뿜어내는 노란빛줄기 (전면)
    if (orb.beam) {
      drawYellowUpwardBeam(ctx, orb.x, orb.y, orb.beam.height, orb.beam.intensity, orb.radius, orb.beam.sparkPhase);
    }
    // 3) 메인 구체
    drawYellowGlowingOrb(ctx, orb.x, orb.y, orb.radius, orb.alpha, true);
    // 4) 구체 표면 분출구 폭발광 & 반짝임
    if (orb.beam) {
      drawBeamRootBloom(ctx, orb.x, orb.y, orb.beam.intensity, orb.radius);
    }
  }
}
