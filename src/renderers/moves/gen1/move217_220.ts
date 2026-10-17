// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";

// ============================================================================
// 🎁 217: 프레젠트 (Present / プレゼント) - 노말 타입 물리 기술
//
// 위력: — (40: 40%, 80: 30%, 120: 10%) / 명중: 90 / PP: 15 / 접촉 판정: X
// 설명: 덫을 설치한 상자를 상대에게 건네어 공격한다. HP가 회복돼버릴 때도 있다. (회복 25%: 20%)
//
// [연출 기승전결 시퀀스]:
// 1. 기(起) - 발사 & 포물선 비행:
//    - 시전자 가벼운 도약 후 선물 상자 투척
//    - 리본이 달린 클래식 빨간 선물 상자가 사랑스러운 별빛 트레일을 남기며 포물선(Arc)을 그리며 대상 머리/발밑으로 비행
// 2. 승(承) - 착지 & 서스펜스 요동:
//    - 대상 전면에 상자가 '착!' 착지하며 탄성 바운스 (Squash & Stretch)
//    - 뚜껑이 들썩이며 좌우로 두근두근 요동침 (긴장감 고조)
// 3. 전(轉) - 확률 분기 결과 공개:
//    [분기 A: 데미지 타격 (40/80/120 위력)]
//    - 상자 뚜껑이 하늘로 튕겨 날아가며 '쾅!!' 다이내믹 폭죽/스타버스트 폭발
//    - 강렬한 충격파 링 & 사방으로 터져나가는 화려한 축제 콘페티(오색 색종이 조각)와 파티클 비산
//    - 피격자 타격 흔들림 및 섬광
//    [분기 B: 체력 회복 (20% 확률로 상대 최대 HP 25% 회복)]
//    - 상자가 부드럽게 열리며 상냥한 황금빛/에메랄드 치유 광선 방출
//    - 대상 발밑의 치유 오라 링 & 머리 위로 피어오르는 파스텔 치유 별빛/하트 샤워
//    - 대상이 포근한 빛에 감싸이며 기분 좋게 둥실 떠오름
//    [분기 C: 빗나감 (Miss)]
//    - 상자가 대상을 지나쳐 털썩 떨어지고 옆으로 기우뚱 쓰러지며 삐질 연기 뿜음
// 4. 결(結) - 안정화 및 원위치 복귀
// ============================================================================

// 256색 최적화 프레젠트 전용 팔레트
const PRESENT_PALETTE = {
  // 선물 상자 본체 (화이트 & 쿨 실버 그레이 3D 셰이딩)
  boxHigh: "#FFFFFF", // 상단면 (순백)
  boxBase: "#F1F5F9", // 좌측면 (밝은 오프화이트 실버)
  boxShadow: "#CBD5E1", // 우측 음영면 (소프트 셰이디드 슬레이트)
  boxInner: "#1E293B", // 내부 공동 (다크 슬레이트)

  // 리본 & 매듭 (선명하고 화사한 크림슨 레드)
  ribbonHigh: "#FCA5A5", // 리본 하이라이트/광택 (소프트 코랄)
  ribbonBase: "#EF4444", // 리본 메인 (비비드 레드)
  ribbonShadow: "#991B1B", // 리본 음영 (딥 크림슨)

  // 반짝이 및 별빛 이펙트 (골드)
  starGold: "#FEF08A",
  starBright: "#FACC15",

  // 폭발 (Branch A)
  white: "#FFFFFF",
  expYellow: "#FDE047",
  expOrange: "#F97316",
  expRed: "#EF4444",

  // 오색 축제 콘페티
  confetti: [
    "#EF4444", // 레드
    "#3B82F6", // 블루
    "#10B981", // 에메랄드
    "#FACC15", // 골드
    "#EC4899", // 핑크
    "#8B5CF6", // 퍼플
    "#FFFFFF", // 순백
    "#F97316", // 오렌지
  ],

  // 회복 치유 (Branch B)
  healMint: "#34D399",
  healEmerald: "#10B981",
  healLightGreen: "#A7F3D0",
  healGold: "#FEF08A",
  healSoftYellow: "#FDE68A",

  // 빗나감 연기
  smokeLight: "#E5E7EB",
  smokeDark: "#9CA3AF",
};

/**
 * 3D 입체 선물 상자 뚜껑 (Overhanging 3D Isometric Lid & Bow)
 */
export function drawGiftBoxLid(
  ctx: any,
  lw: number,
  ld: number,
  lh: number,
  rw: number
) {
  const halfLW = lw / 2;
  const halfLD = ld / 2;
  const hrw = rw / 2;
  const sL = halfLD / halfLW; // isometric slope

  // 1. 좌측 스커트 (Front-Left Skirt)
  ctx.save();
  ctx.fillStyle = PRESENT_PALETTE.boxBase; // #DC2626
  ctx.beginPath();
  ctx.moveTo(-halfLW, 0);
  ctx.lineTo(0, halfLD);
  ctx.lineTo(0, halfLD + lh);
  ctx.lineTo(-halfLW, lh);
  ctx.closePath();
  ctx.fill();

  // 좌측 스커트 세로 리본
  const lx1 = -halfLW / 2 - hrw;
  const lx2 = -halfLW / 2 + hrw;
  const ly1 = halfLD + lx1 * sL;
  const ly2 = halfLD + lx2 * sL;
  ctx.fillStyle = PRESENT_PALETTE.ribbonBase; // #FACC15
  ctx.beginPath();
  ctx.moveTo(lx1, ly1);
  ctx.lineTo(lx2, ly2);
  ctx.lineTo(lx2, ly2 + lh);
  ctx.lineTo(lx1, ly1 + lh);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. 우측 스커트 (Front-Right Skirt - 음영)
  ctx.save();
  ctx.fillStyle = PRESENT_PALETTE.boxShadow; // #991B1B
  ctx.beginPath();
  ctx.moveTo(0, halfLD);
  ctx.lineTo(halfLW, 0);
  ctx.lineTo(halfLW, lh);
  ctx.lineTo(0, halfLD + lh);
  ctx.closePath();
  ctx.fill();

  // 우측 스커트 세로 리본
  const rx1 = halfLW / 2 - hrw;
  const rx2 = halfLW / 2 + hrw;
  const ry1 = halfLD - rx1 * sL;
  const ry2 = halfLD - rx2 * sL;
  ctx.fillStyle = PRESENT_PALETTE.ribbonShadow; // #CA8A04
  ctx.beginPath();
  ctx.moveTo(rx1, ry1);
  ctx.lineTo(rx2, ry2);
  ctx.lineTo(rx2, ry2 + lh);
  ctx.lineTo(rx1, ry1 + lh);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 스커트 하단 외곽선
  ctx.save();
  ctx.strokeStyle = "rgba(100, 116, 139, 0.45)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-halfLW, lh);
  ctx.lineTo(0, halfLD + lh);
  ctx.lineTo(halfLW, lh);
  ctx.stroke();
  ctx.restore();

  // 3. 뚜껑 상단면 (Top Isometric Rhombus)
  ctx.save();
  ctx.fillStyle = PRESENT_PALETTE.boxHigh; // 순백 상단면
  ctx.beginPath();
  ctx.moveTo(0, -halfLD);
  ctx.lineTo(halfLW, 0);
  ctx.lineTo(0, halfLD);
  ctx.lineTo(-halfLW, 0);
  ctx.closePath();
  ctx.fill();

  // 상단면 모서리 스트로크
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 4. 뚜껑 상단 3D 대각선 십자 리본 (Isometric Cross Ribbons)
  // 대각선 1: 좌상(NW) -> 우하(SE)
  ctx.fillStyle = PRESENT_PALETTE.ribbonBase;
  ctx.beginPath();
  ctx.moveTo(-halfLW / 2 - hrw, -halfLD / 2 + hrw * sL);
  ctx.lineTo(-halfLW / 2 + hrw, -halfLD / 2 - hrw * sL);
  ctx.lineTo(halfLW / 2 + hrw, halfLD / 2 - hrw * sL);
  ctx.lineTo(halfLW / 2 - hrw, halfLD / 2 + hrw * sL);
  ctx.closePath();
  ctx.fill();

  // 대각선 2: 좌하(SW) -> 우상(NE)
  ctx.beginPath();
  ctx.moveTo(-halfLW / 2 - hrw, halfLD / 2 - hrw * sL);
  ctx.lineTo(-halfLW / 2 + hrw, halfLD / 2 + hrw * sL);
  ctx.lineTo(halfLW / 2 + hrw, -halfLD / 2 + hrw * sL);
  ctx.lineTo(halfLW / 2 - hrw, -halfLD / 2 - hrw * sL);
  ctx.closePath();
  ctx.fill();

  // 리본 교차점 중앙 마름모 하이라이트
  ctx.fillStyle = PRESENT_PALETTE.ribbonHigh;
  ctx.beginPath();
  ctx.moveTo(0, -hrw * sL * 1.3);
  ctx.lineTo(hrw * 1.3, 0);
  ctx.lineTo(0, hrw * sL * 1.3);
  ctx.lineTo(-hrw * 1.3, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 5. 상단 3D 리본 장식 (Bow Loops, Knot, and Streamers)
  const loopW = Math.max(4.6, lw * 0.22);
  const loopH = Math.max(3.2, ld * 0.38);

  ctx.save();
  // 5-1. 늘어뜨려진 리본 테일 (Cascading Fishtail Streamers)
  ctx.fillStyle = PRESENT_PALETTE.ribbonBase;

  // 좌측 테일 (왼쪽 앞으로 흐름)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-halfLW * 0.28, halfLD * 0.45, -halfLW * 0.48, halfLD * 0.82);
  ctx.lineTo(-halfLW * 0.38, halfLD * 0.94);
  ctx.quadraticCurveTo(-halfLW * 0.18, halfLD * 0.45, 0, 1.5);
  ctx.closePath();
  ctx.fill();

  // 우측 테일 (오른쪽 앞으로 흐름)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(halfLW * 0.28, halfLD * 0.45, halfLW * 0.48, halfLD * 0.82);
  ctx.lineTo(halfLW * 0.38, halfLD * 0.94);
  ctx.quadraticCurveTo(halfLW * 0.18, halfLD * 0.45, 0, 1.5);
  ctx.closePath();
  ctx.fill();

  // 5-2. 좌측 리본 루프 (Left 3D Loop)
  ctx.save();
  ctx.translate(-hrw * 0.95, -1);
  ctx.rotate(-0.35);
  ctx.fillStyle = PRESENT_PALETTE.ribbonBase;
  ctx.beginPath();
  ctx.ellipse(-loopW * 0.75, -loopH * 0.45, loopW * 0.85, loopH * 0.65, -0.22, 0, Math.PI * 2);
  ctx.fill();
  // 루프 내부 음영 홀
  ctx.fillStyle = PRESENT_PALETTE.ribbonShadow;
  ctx.beginPath();
  ctx.ellipse(-loopW * 0.75, -loopH * 0.45, loopW * 0.42, loopH * 0.32, -0.22, 0, Math.PI * 2);
  ctx.fill();
  // 루프 상단 하이라이트 림
  ctx.strokeStyle = PRESENT_PALETTE.ribbonHigh;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.restore();

  // 5-3. 우측 리본 루프 (Right 3D Loop)
  ctx.save();
  ctx.translate(hrw * 0.95, -1);
  ctx.rotate(0.35);
  ctx.fillStyle = PRESENT_PALETTE.ribbonBase;
  ctx.beginPath();
  ctx.ellipse(loopW * 0.75, -loopH * 0.45, loopW * 0.85, loopH * 0.65, 0.22, 0, Math.PI * 2);
  ctx.fill();
  // 루프 내부 음영 홀
  ctx.fillStyle = PRESENT_PALETTE.ribbonShadow;
  ctx.beginPath();
  ctx.ellipse(loopW * 0.75, -loopH * 0.45, loopW * 0.42, loopH * 0.32, 0.22, 0, Math.PI * 2);
  ctx.fill();
  // 루프 상단 하이라이트 림
  ctx.strokeStyle = PRESENT_PALETTE.ribbonHigh;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.restore();

  // 5-4. 중앙 매듭 (Center 3D Knot)
  ctx.fillStyle = PRESENT_PALETTE.ribbonShadow;
  ctx.beginPath();
  ctx.ellipse(0, 0, hrw * 1.15, hrw * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PRESENT_PALETTE.ribbonBase;
  ctx.beginPath();
  ctx.ellipse(-0.5, -0.5, hrw * 0.95, hrw * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PRESENT_PALETTE.ribbonHigh;
  ctx.beginPath();
  ctx.ellipse(-1.0, -1.0, hrw * 0.45, hrw * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 정교한 3D 입체 클래식 선물 상자 (3D Isometric Gift Box)
 * - 3면 입체 투영 (Front-Left, Front-Right 음영면, Top 개방/폐쇄면)
 * - 3D 입체 십자 리본 및 오버행 뚜껑 (Overhanging Skirt Lid)
 * - 상자 개방 시 내부 공간 및 찬란한 황금빛 코어 광채 연출
 */
export function drawGiftBox(
  ctx: any,
  cx: number,
  cy: number,
  width: number = 24,
  height: number = 21,
  scale: number = 1.0,
  rotation: number = 0,
  lidLift: number = 0,
  lidRot: number = 0,
  alpha: number = 1.0,
  isOpen: boolean = false
) {
  if (alpha <= 0.01 || scale <= 0.05) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const w = width;
  const h = height;
  const d = Math.round(w * 0.44); // 3D 깊이감 (Isometric Depth)
  const by = Math.round((d - h) / 2); // (0, 0) 중심 정렬 기준 Y 좌표

  const halfW = w / 2;
  const halfD = d / 2;

  // 상자 본체 정점 Y 좌표 정의
  const pC_y = by;
  const pBC_y = by + h;
  const pL_top_y = by - halfD;
  const pL_bot_y = by + h - halfD;
  const pR_top_y = by - halfD;
  const pR_bot_y = by + h - halfD;
  const pBT_y = by - d;

  const ribbonW = Math.max(3.2, w * 0.18);
  const halfRW = ribbonW / 2;
  const slope = halfD / halfW; // Isometric Slope

  // 2. 상자 내부 공동 및 광채 (뚜껑이 열려 있을 때: isOpen || lidLift > 2)
  if (isOpen || lidLift > 2) {
    ctx.save();
    // 내부 베이스 (어두운 벨벳 레드)
    ctx.fillStyle = PRESENT_PALETTE.boxInner; // #450A0A
    ctx.beginPath();
    ctx.moveTo(0, pBT_y);
    ctx.lineTo(halfW, pR_top_y);
    ctx.lineTo(0, pC_y);
    ctx.lineTo(-halfW, pL_top_y);
    ctx.closePath();
    ctx.fill();

    // 상자 내부 두께 림 (Wall Bevel Edge)
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 상자 내부에서 뿜어져 나오는 황금빛 코어 광채
    const innerGlow = ctx.createRadialGradient(0, by - halfD, 1, 0, by - halfD, halfW * 1.2);
    innerGlow.addColorStop(0.0, "#FFFFFF");
    innerGlow.addColorStop(0.25, PRESENT_PALETTE.starGold);
    innerGlow.addColorStop(0.55, PRESENT_PALETTE.starBright);
    innerGlow.addColorStop(0.85, "rgba(239, 68, 68, 0.4)");
    innerGlow.addColorStop(1.0, "transparent");

    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.moveTo(0, pBT_y);
    ctx.lineTo(halfW, pR_top_y);
    ctx.lineTo(0, pC_y);
    ctx.lineTo(-halfW, pL_top_y);
    ctx.closePath();
    ctx.fill();

    // 뚜껑이 크게 열렸을 때 상자 안에서 솟구치는 미세 스파클
    if (lidLift > 5) {
      drawPresentDiamondStar(ctx, 0, by - halfD - lidLift * 0.35, 4.2, PRESENT_PALETTE.starGold, 0.85);
    }
    ctx.restore();
  } else {
    // 뚜껑이 닫혀 있을 때의 상단면
    ctx.save();
    ctx.fillStyle = PRESENT_PALETTE.boxHigh;
    ctx.beginPath();
    ctx.moveTo(0, pBT_y);
    ctx.lineTo(halfW, pR_top_y);
    ctx.lineTo(0, pC_y);
    ctx.lineTo(-halfW, pL_top_y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 3. 좌측 면 (Front-Left Face - 기준면)
  ctx.save();
  ctx.fillStyle = PRESENT_PALETTE.boxBase; // #DC2626
  ctx.beginPath();
  ctx.moveTo(-halfW, pL_top_y);
  ctx.lineTo(0, pC_y);
  ctx.lineTo(0, pBC_y);
  ctx.lineTo(-halfW, pL_bot_y);
  ctx.closePath();
  ctx.fill();

  // 좌측 면 세로 리본 (Vertical Ribbon Stripe)
  const lx1 = -halfW / 2 - halfRW;
  const lx2 = -halfW / 2 + halfRW;
  const ly1 = pC_y + lx1 * slope;
  const ly2 = pC_y + lx2 * slope;
  ctx.fillStyle = PRESENT_PALETTE.ribbonBase; // #FACC15
  ctx.beginPath();
  ctx.moveTo(lx1, ly1);
  ctx.lineTo(lx2, ly2);
  ctx.lineTo(lx2, ly2 + h);
  ctx.lineTo(lx1, ly1 + h);
  ctx.closePath();
  ctx.fill();

  // 좌측 면 가로 리본 (Horizontal Waist Ribbon)
  const waistY = pC_y + h * 0.52;
  ctx.fillStyle = PRESENT_PALETTE.ribbonBase;
  ctx.beginPath();
  ctx.moveTo(-halfW, waistY - halfRW - halfD);
  ctx.lineTo(0, waistY - halfRW);
  ctx.lineTo(0, waistY + halfRW);
  ctx.lineTo(-halfW, waistY + halfRW - halfD);
  ctx.closePath();
  ctx.fill();

  // 가로 리본 상단 하이라이트 라인
  ctx.strokeStyle = PRESENT_PALETTE.ribbonHigh;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-halfW, waistY - halfRW - halfD);
  ctx.lineTo(0, waistY - halfRW);
  ctx.stroke();

  // 좌측 면 외곽 테두리 (미세한 음영 스트로크)
  ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();

  // 4. 우측 면 (Front-Right Face - 깊은 음영면)
  ctx.save();
  ctx.fillStyle = PRESENT_PALETTE.boxShadow; // #CBD5E1 (소프트 셰이디드 슬레이트)
  ctx.beginPath();
  ctx.moveTo(0, pC_y);
  ctx.lineTo(halfW, pR_top_y);
  ctx.lineTo(halfW, pR_bot_y);
  ctx.lineTo(0, pBC_y);
  ctx.closePath();
  ctx.fill();

  // 우측 면 세로 리본 (Vertical Ribbon Stripe - 음영톤)
  const rx1 = halfW / 2 - halfRW;
  const rx2 = halfW / 2 + halfRW;
  const ry1 = pC_y - rx1 * slope;
  const ry2 = pC_y - rx2 * slope;
  ctx.fillStyle = PRESENT_PALETTE.ribbonShadow; // #991B1B
  ctx.beginPath();
  ctx.moveTo(rx1, ry1);
  ctx.lineTo(rx2, ry2);
  ctx.lineTo(rx2, ry2 + h);
  ctx.lineTo(rx1, ry1 + h);
  ctx.closePath();
  ctx.fill();

  // 우측 면 가로 리본 (Horizontal Waist Ribbon - 음영톤)
  ctx.fillStyle = PRESENT_PALETTE.ribbonShadow;
  ctx.beginPath();
  ctx.moveTo(0, waistY - halfRW);
  ctx.lineTo(halfW, waistY - halfRW - halfD);
  ctx.lineTo(halfW, waistY + halfRW - halfD);
  ctx.lineTo(0, waistY + halfRW);
  ctx.closePath();
  ctx.fill();

  // 우측 면 외곽 테두리
  ctx.strokeStyle = "rgba(100, 116, 139, 0.55)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();

  // 5. 정면 중앙 모서리 하이라이트 (3D Ridge Crease Highlight)
  ctx.save();
  ctx.strokeStyle = "#FFFFFF"; // 순백 모서리 능선
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(0, pC_y);
  ctx.lineTo(0, pBC_y);
  ctx.stroke();
  ctx.restore();

  // 6. 3D 입체 뚜껑 및 리본 보우 (Overhanging 3D Lid & Bow)
  // lidLift와 lidRot에 따라 상단으로 들리거나 회전
  ctx.save();
  const lidBaseY = by - halfD - lidLift;
  ctx.translate(0, lidBaseY);
  ctx.rotate(lidRot);

  const lw = w + 3.5;
  const ld = d + 1.8;
  const lh = Math.max(4.5, h * 0.22);

  drawGiftBoxLid(ctx, lw, ld, lh, ribbonW);

  ctx.restore(); // end lid

  ctx.restore(); // end main box
}

/**
 * 4각 다이아몬드 십자 반짝이 별 (Diamond Star Glint)
 */
export function drawPresentDiamondStar(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  color: string = PRESENT_PALETTE.starGold,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(0, 0, size, 0);
  ctx.quadraticCurveTo(0, 0, 0, size);
  ctx.quadraticCurveTo(0, 0, -size, 0);
  ctx.quadraticCurveTo(0, 0, 0, -size);
  ctx.closePath();
  ctx.fill();

  // 중앙 순백 하이라이트 코어
  ctx.fillStyle = PRESENT_PALETTE.white;
  const inner = size * 0.45;
  ctx.beginPath();
  ctx.moveTo(0, -inner);
  ctx.quadraticCurveTo(0, 0, inner, 0);
  ctx.quadraticCurveTo(0, 0, 0, inner);
  ctx.quadraticCurveTo(0, 0, -inner, 0);
  ctx.quadraticCurveTo(0, 0, 0, -inner);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 포물선 비행 궤적 뒤를 수놓는 반짝이 트레일 파티클
 */
const FLIGHT_TRAIL_OFFSETS = [
  { progressOff: 0.08, dx: -8, dy: 6, size: 4.0, color: PRESENT_PALETTE.starGold },
  { progressOff: 0.16, dx: 6, dy: 4, size: 3.2, color: PRESENT_PALETTE.expYellow },
  { progressOff: 0.25, dx: -5, dy: -6, size: 4.5, color: PRESENT_PALETTE.white },
  { progressOff: 0.35, dx: 7, dy: -4, size: 2.8, color: PRESENT_PALETTE.ribbonBase },
  { progressOff: 0.45, dx: -4, dy: 5, size: 3.8, color: PRESENT_PALETTE.starGold },
];

/**
 * 폭발 콘페티 파티클 정적 데이터 (결정론적 분산 - 16개 오색 조각)
 */
const CONFETTI_PARTICLES = [
  { angle: 0.2, speed: 48, rotSpeed: 5.2, size: 5.5, colorIdx: 0 },
  { angle: 0.7, speed: 36, rotSpeed: -4.1, size: 4.0, colorIdx: 1 },
  { angle: 1.1, speed: 52, rotSpeed: 6.8, size: 6.0, colorIdx: 2 },
  { angle: 1.6, speed: 32, rotSpeed: -3.5, size: 4.5, colorIdx: 3 },
  { angle: 2.1, speed: 46, rotSpeed: 4.9, size: 5.0, colorIdx: 4 },
  { angle: 2.7, speed: 40, rotSpeed: -6.2, size: 4.2, colorIdx: 5 },
  { angle: 3.3, speed: 50, rotSpeed: 5.5, size: 5.8, colorIdx: 6 },
  { angle: 3.8, speed: 34, rotSpeed: -4.8, size: 4.0, colorIdx: 7 },
  { angle: 4.3, speed: 44, rotSpeed: 6.1, size: 5.2, colorIdx: 0 },
  { angle: 4.8, speed: 38, rotSpeed: -3.9, size: 4.6, colorIdx: 2 },
  { angle: 5.3, speed: 54, rotSpeed: 5.7, size: 6.2, colorIdx: 3 },
  { angle: 5.8, speed: 30, rotSpeed: -5.4, size: 3.8, colorIdx: 4 },
  { angle: 0.4, speed: 22, rotSpeed: 3.2, size: 3.5, colorIdx: 5 },
  { angle: 1.9, speed: 26, rotSpeed: -4.0, size: 4.2, colorIdx: 1 },
  { angle: 3.6, speed: 24, rotSpeed: 4.5, size: 3.6, colorIdx: 6 },
  { angle: 5.0, speed: 28, rotSpeed: -3.7, size: 4.0, colorIdx: 7 },
];

/**
 * 회복 치유 별빛 & 하트 파티클 정적 데이터 (결정론적 상승 - 12개)
 */
const HEAL_SHOWER_PARTICLES = [
  { ox: -24, oy: 15, riseRate: 46, swayFreq: 3.2, swayAmp: 7, size: 5.0, isHeart: false },
  { ox: 18, oy: 12, riseRate: 52, swayFreq: 2.8, swayAmp: -8, size: 4.5, isHeart: true },
  { ox: -12, oy: 8, riseRate: 58, swayFreq: 3.5, swayAmp: 9, size: 6.0, isHeart: false },
  { ox: 26, oy: 18, riseRate: 42, swayFreq: 2.5, swayAmp: -6, size: 4.0, isHeart: false },
  { ox: -6, oy: 20, riseRate: 64, swayFreq: 4.0, swayAmp: 8, size: 5.5, isHeart: true },
  { ox: 10, oy: 5, riseRate: 55, swayFreq: 3.0, swayAmp: -7, size: 4.8, isHeart: false },
  { ox: -30, oy: 22, riseRate: 38, swayFreq: 2.2, swayAmp: 5, size: 3.8, isHeart: false },
  { ox: 32, oy: 24, riseRate: 48, swayFreq: 3.1, swayAmp: -9, size: 4.2, isHeart: true },
  { ox: 0, oy: 16, riseRate: 60, swayFreq: 3.8, swayAmp: 10, size: 5.2, isHeart: false },
  { ox: -18, oy: 28, riseRate: 50, swayFreq: 2.7, swayAmp: 6, size: 4.0, isHeart: false },
  { ox: 22, oy: 30, riseRate: 44, swayFreq: 3.3, swayAmp: -7, size: 4.6, isHeart: false },
  { ox: -2, oy: 32, riseRate: 66, swayFreq: 4.2, swayAmp: -8, size: 5.8, isHeart: true },
];

/**
 * 미니 파스텔 하트 그리기 (회복 시 피어오름)
 */
function drawMiniPastelHeart(ctx: any, cx: number, cy: number, size: number, alpha: number = 1.0) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = PRESENT_PALETTE.healLightGreen;

  const w = size * 1.15;
  const h = size * 0.85;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.25);
  ctx.bezierCurveTo(-w * 0.55, -h * 0.85, -w * 1.1, -h * 0.05, 0, h * 0.8);
  ctx.bezierCurveTo(w * 1.1, -h * 0.05, w * 0.55, -h * 0.85, 0, -h * 0.25);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * ----------------------------------------------------------------------------
 * 🎁 217 프레젠트 후면 효과 렌더러 (Behind Effect)
 * ----------------------------------------------------------------------------
 */
export function drawPresentBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep ?? 1;

  // 타겟 중심 좌표
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isP ? 16 : 10);

  // 회복 연출 시 후면 부드러운 치유 기둥 & 오라 링
  if (step === 3 && frame.isHeal) {
    const healProg = frame.healProgress ?? 0.5;
    targetCtx.save();

    // 1. 세로 치유 광선 기둥 (Warm Healing Pillar)
    const beamAlpha = Math.sin(healProg * Math.PI) * 0.45;
    if (beamAlpha > 0.01) {
      const beamGrad = targetCtx.createLinearGradient(0, ty + 25, 0, ty - 85);
      beamGrad.addColorStop(0.0, "rgba(52, 211, 153, 0.45)");
      beamGrad.addColorStop(0.5, "rgba(254, 240, 138, 0.35)");
      beamGrad.addColorStop(1.0, "transparent");
      targetCtx.fillStyle = beamGrad;
      targetCtx.fillRect(tx - 36, ty - 85, 72, 110);
    }

    // 2. 바닥 에메랄드 3D 치유 링 (Ground Healing Ring)
    const ringProg = Math.min(1.0, healProg * 1.3);
    const ringRadiusX = 20 + ringProg * 26;
    const ringRadiusY = ringRadiusX * 0.38;
    const ringAlpha = Math.max(0, 1.0 - Math.pow(ringProg, 1.5)) * 0.75;

    if (ringAlpha > 0.01) {
      targetCtx.save();
      targetCtx.globalAlpha = ringAlpha;
      targetCtx.strokeStyle = PRESENT_PALETTE.healMint;
      targetCtx.lineWidth = 3.0;
      targetCtx.beginPath();
      targetCtx.ellipse(tx, ty + 18, ringRadiusX, ringRadiusY, 0, 0, Math.PI * 2);
      targetCtx.stroke();

      targetCtx.strokeStyle = PRESENT_PALETTE.healGold;
      targetCtx.lineWidth = 1.5;
      targetCtx.beginPath();
      targetCtx.ellipse(tx, ty + 18, ringRadiusX * 0.85, ringRadiusY * 0.85, 0, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    }

    targetCtx.restore();
  }
}

/**
 * ----------------------------------------------------------------------------
 * 🎁 217 프레젠트 전면 효과 렌더러 (Main Effect)
 * ----------------------------------------------------------------------------
 */
export function drawPresentEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP, isHit } = drawCtx;
  const step = frame.moveStep ?? 1;

  // 시전자 및 타겟 좌표
  const ax = (attackerPos?.x ?? (isP ? 175 : 418)) + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = (attackerPos?.y ?? (isP ? 220 : 152)) + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 15 : 10);

  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isP ? 16 : 10);

  // ==========================================================================
  // Step 1: 포물선 투척 및 비행 궤적 (Toss & Parabolic Arc Flight)
  // ==========================================================================
  if (step === 1) {
    const arcProg = frame.presentArcProgress ?? 0.0;
    if (arcProg <= 0.01) return;

    // 포물선 보간 (시전자 -> 타겟)
    const sx = ax + (isP ? 18 : -18);
    const sy = ay - 8;
    const destX = isHit ? tx : tx + (isP ? 45 : -45);
    const destY = ty;

    const curX = sx + (destX - sx) * arcProg;
    const arcHeight = 52;
    const curY = sy + (destY - sy) * arcProg - Math.sin(arcProg * Math.PI) * arcHeight;

    // 1. 포물선 비행 뒤쪽 별빛 반짝이 트레일
    for (const t of FLIGHT_TRAIL_OFFSETS) {
      const trailP = arcProg - t.progressOff;
      if (trailP > 0.02 && trailP < 0.98) {
        const trailX = sx + (destX - sx) * trailP + t.dx;
        const trailY = sy + (destY - sy) * trailP - Math.sin(trailP * Math.PI) * arcHeight + t.dy;
        const trailAlpha = Math.max(0, 1.0 - (arcProg - trailP) * 3.5);
        drawPresentDiamondStar(targetCtx, trailX, trailY, t.size, t.color, trailAlpha);
      }
    }

    // 2. 비행 중 살랑거리는 상자 각도
    const flightRot = Math.sin(arcProg * Math.PI * 3.0) * 0.28 + (isP ? 0.20 : -0.20);
    const boxScale = 0.88 + Math.sin(arcProg * Math.PI) * 0.18;

    drawGiftBox(targetCtx, curX, curY, 24, 21, boxScale, flightRot, 0, 0, 1.0, false);
  }

  // ==========================================================================
  // Step 2: 착지 및 서스펜스 요동 (Landing & Suspense Wobble)
  // ==========================================================================
  else if (step === 2) {
    const boxX = isHit ? tx : tx + (isP ? 45 : -45);
    const boxY = ty + 12;

    const scaleX = frame.presentBoxScaleX ?? 1.0;
    const scaleY = frame.presentBoxScaleY ?? 1.0;
    const rot = frame.presentBoxRot ?? 0.0;
    const lidLift = frame.presentLidLift ?? 0.0;
    const lidRot = frame.presentLidRot ?? 0.0;
    const boxAlpha = frame.presentBoxAlpha ?? 1.0;

    // 착지 시 지면 먼지 팝 (Landing Dust)
    if (frame.showDust) {
      targetCtx.save();
      targetCtx.fillStyle = "rgba(220, 205, 180, 0.70)";
      targetCtx.beginPath();
      targetCtx.arc(boxX - 16, boxY + 8, 4.5, 0, Math.PI * 2);
      targetCtx.arc(boxX + 16, boxY + 8, 4.5, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    }

    // 요동 중 상자 주변 서스펜스 스파클 (작은 노란 반짝이)
    if (frame.showSuspenseSparkle) {
      drawPresentDiamondStar(targetCtx, boxX - 14, boxY - 18, 4.0, PRESENT_PALETTE.starGold, 0.9);
      drawPresentDiamondStar(targetCtx, boxX + 16, boxY - 22, 5.0, PRESENT_PALETTE.expYellow, 0.95);
    }

    targetCtx.save();
    targetCtx.translate(boxX, boxY);
    targetCtx.scale(scaleX, scaleY);
    targetCtx.translate(-boxX, -boxY);
    drawGiftBox(targetCtx, boxX, boxY, 24, 21, 1.0, rot, lidLift, lidRot, boxAlpha, false);
    targetCtx.restore();
  }

  // ==========================================================================
  // Step 3: 확률 분기 결과 (Outcome Reveal: Explosion / Heal / Miss)
  // ==========================================================================
  else if (step === 3) {
    const boxX = isHit ? tx : tx + (isP ? 45 : -45);
    const boxY = ty + 12;

    // ------------------------------------------------------------------------
    // [분기 A: 데미지 타격 (Explosive Surprise Bomb)]
    // ------------------------------------------------------------------------
    if (isHit && !frame.isHeal) {
      const hitProg = frame.hitProgress ?? 0.5;

      // 1. 공중으로 솟구치는 상자 뚜껑 (Blown Lid)
      if (hitProg < 0.85) {
        const lidRise = hitProg * 48;
        const lidSpin = hitProg * 5.0 * (isP ? 1 : -1);
        const lidAlpha = Math.max(0, 1.0 - hitProg * 1.15);

        targetCtx.save();
        targetCtx.translate(boxX + (isP ? 12 : -12) * hitProg, boxY - 14 - lidRise);
        targetCtx.rotate(lidSpin);
        targetCtx.globalAlpha = lidAlpha;

        drawGiftBoxLid(targetCtx, 27.5, 12.8, 4.8, 4.2);
        targetCtx.restore();
      }

      // 2. 부서진 상자 바디 잔해 (점차 소산)
      const debrisAlpha = Math.max(0, 1.0 - hitProg * 1.5);
      if (debrisAlpha > 0.01) {
        drawGiftBox(targetCtx, boxX, boxY, 24, 21, 1.0, 0.1, 8, 0.3, debrisAlpha, true);
      }

      // 3. 중심 섬광 & 다이내믹 스타버스트 화염구
      if (hitProg <= 0.60) {
        const burstT = hitProg / 0.60;
        const burstScale = Math.sin(burstT * Math.PI);
        const coreRadius = 14 + burstScale * 26;

        targetCtx.save();
        targetCtx.translate(boxX, boxY - 10);

        // 오렌지/레드 외곽 화염 광채
        targetCtx.fillStyle = PRESENT_PALETTE.expRed;
        targetCtx.beginPath();
        targetCtx.arc(0, 0, coreRadius * 1.1, 0, Math.PI * 2);
        targetCtx.fill();

        // 8방향 날카로운 스타버스트
        targetCtx.fillStyle = PRESENT_PALETTE.expYellow;
        targetCtx.beginPath();
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI) / 4;
          const outerR = coreRadius * 1.35;
          const innerR = coreRadius * 0.55;
          const ox1 = Math.cos(ang) * outerR;
          const oy1 = Math.sin(ang) * outerR;
          const ox2 = Math.cos(ang + Math.PI / 8) * innerR;
          const oy2 = Math.sin(ang + Math.PI / 8) * innerR;
          if (i === 0) targetCtx.moveTo(ox1, oy1);
          else targetCtx.lineTo(ox1, oy1);
          targetCtx.lineTo(ox2, oy2);
        }
        targetCtx.closePath();
        targetCtx.fill();

        // 순백 코어 플래시
        targetCtx.fillStyle = PRESENT_PALETTE.white;
        targetCtx.beginPath();
        targetCtx.arc(0, 0, coreRadius * 0.55, 0, Math.PI * 2);
        targetCtx.fill();

        targetCtx.restore();
      }



      // 5. 사방으로 뿜어져 나가는 16개 오색 축제 콘페티 (Confetti Streamers)
      const confettiAlpha = Math.max(0, 1.0 - Math.pow(Math.max(0, (hitProg - 0.25) / 0.75), 1.25));
      if (confettiAlpha > 0.01) {
        for (const c of CONFETTI_PARTICLES) {
          const easeDist = 1.0 - Math.pow(1.0 - Math.min(1.0, hitProg * 1.2), 2.2);
          const dist = 6 + easeDist * c.speed;
          const px = boxX + Math.cos(c.angle) * dist;
          // 중력 감안하여 약간 아래로 포물선 가속
          const py = boxY - 10 + Math.sin(c.angle) * dist * 0.85 + Math.pow(hitProg, 2.0) * 12;

          const pSize = Math.max(1.5, c.size * (1.0 - hitProg * 0.45));
          const pRot = hitProg * c.rotSpeed;

          targetCtx.save();
          targetCtx.translate(px, py);
          targetCtx.rotate(pRot);
          targetCtx.globalAlpha = confettiAlpha;
          targetCtx.fillStyle = PRESENT_PALETTE.confetti[c.colorIdx % PRESENT_PALETTE.confetti.length];
          // 회전하는 직사각형/마름모 색종이 조각
          targetCtx.fillRect(-pSize / 2, -pSize / 3, pSize, pSize * 0.65);
          targetCtx.restore();
        }
      }
    }

    // ------------------------------------------------------------------------
    // [분기 B: 체력 회복 (Healing Light & Shower)]
    // ------------------------------------------------------------------------
    else if (isHit && frame.isHeal) {
      const healProg = frame.healProgress ?? 0.5;

      // 1. 열려 있는 선물 상자 본체 (은은하게 빛남)
      const boxAlpha = Math.max(0, 1.0 - Math.pow(Math.max(0, (healProg - 0.7) / 0.3), 1.5));
      if (boxAlpha > 0.01) {
        drawGiftBox(targetCtx, boxX, boxY, 24, 21, 1.0, 0, 14, 0.22, boxAlpha, true);
      }

      // 2. 상자 입구 십자 치유 섬광
      const glintAlpha = Math.sin(healProg * Math.PI) * 0.95;
      drawPresentDiamondStar(targetCtx, boxX, boxY - 10, 8.0, PRESENT_PALETTE.healGold, glintAlpha);

      // 3. 하늘로 흩날려 피어오르는 12개의 에메랄드/골드 별빛 & 파스텔 하트 샤워
      const showerAlpha = Math.sin(healProg * Math.PI);
      if (showerAlpha > 0.01) {
        for (const p of HEAL_SHOWER_PARTICLES) {
          const riseY = healProg * p.riseRate;
          const swayX = Math.sin(healProg * p.swayFreq + p.ox) * p.swayAmp;
          const px = tx + p.ox + swayX;
          const py = ty + p.oy - riseY;

          const pAlpha = showerAlpha * Math.max(0.2, 1.0 - (riseY / (p.riseRate * 1.1)));

          if (p.isHeart) {
            drawMiniPastelHeart(targetCtx, px, py, p.size, pAlpha);
          } else {
            drawPresentDiamondStar(targetCtx, px, py, p.size, PRESENT_PALETTE.healGold, pAlpha);
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // [분기 C: 빗나감 (Miss / Flop)]
    // ------------------------------------------------------------------------
    else if (!isHit) {
      const missProg = frame.missProgress ?? 0.5;

      // 옆으로 털썩 쓰러진 상자 (rot ~ 1.3)
      const flopRot = Math.min(1.25, 0.4 + missProg * 0.85);
      const flopAlpha = Math.max(0, 1.0 - Math.pow(Math.max(0, (missProg - 0.5) / 0.5), 1.4));

      if (flopAlpha > 0.01) {
        drawGiftBox(targetCtx, boxX, boxY + 2, 24, 21, 0.95, flopRot, 8, 0.4, flopAlpha, false);
      }

      // 삐질 피어오르는 회색 연기 구름 (Poof Smoke)
      const smokeAlpha = Math.sin(missProg * Math.PI) * 0.80;
      if (smokeAlpha > 0.01) {
        targetCtx.save();
        targetCtx.globalAlpha = smokeAlpha;
        targetCtx.fillStyle = PRESENT_PALETTE.smokeDark;
        targetCtx.beginPath();
        targetCtx.arc(boxX - 6, boxY - 14 - missProg * 12, 5.0 + missProg * 4.0, 0, Math.PI * 2);
        targetCtx.arc(boxX + 7, boxY - 16 - missProg * 14, 6.0 + missProg * 4.5, 0, Math.PI * 2);
        targetCtx.arc(boxX, boxY - 22 - missProg * 16, 7.0 + missProg * 5.0, 0, Math.PI * 2);
        targetCtx.fill();

        targetCtx.fillStyle = PRESENT_PALETTE.smokeLight;
        targetCtx.beginPath();
        targetCtx.arc(boxX - 2, boxY - 18 - missProg * 14, 4.5 + missProg * 3.0, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.restore();
      }
    }
  }

  // ==========================================================================
  // Step 4: 원위치 복귀 및 잔향 정돈 (Recovery)
  // ==========================================================================
  else if (step === 4) {
    // 잔여 이펙트 부드럽게 소산
  }
}

// ============================================================================
// 💢 218: 화풀이 (Frustration / やつあたり) - 노말 타입 물리 기술
//
// 위력: 친밀도 반비례 (최대 102) / 명중: 100 / PP: 20 / 접촉 판정: O
// 설명: 불만을 풀기 위해 전력으로 상대를 공격한다. 친밀하지 않을수록 위력이 올라간다.
//
// [유저 지정 연출 시퀀스]:
// 1. 시전포켓몬이 붉게 물듦 (뽐내기의 대상포켓몬 참고)
// 2. 앞뒤로 움직이면서 각도를 해당방향으로 각도기울기
// 3. 타격 3개 (타격 이펙트 및 점 파티클은 은혜갚기에서 가져오되 글로우 빨간색, 타격 3개는 큰 점파티클)
// ============================================================================

/**
 * 💢 [화풀이 전용 빨간색 발광 알갱이 Orb]:
 * 은혜갚기의 구체형 발광 알갱이 규격을 계승하되, 대상 포켓몬 스프라이트보다 Z축 상위(앞)에
 * 완전히 올라오도록 단단한 불투명 코어 + 선명한 크림슨 레드 글로우 림으로 렌더링
 */
export function drawFrustrationGlowingRedOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();

  // 1. 외곽 강렬한 분노 레드 발광 글로우 림
  const glowRadius = radius * 1.5;
  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  glowGrad.addColorStop(0.00, `rgba(255, 255, 255, ${0.95 * alpha})`);
  glowGrad.addColorStop(0.20, `rgba(254, 202, 202, ${0.85 * alpha})`); // 소프트 핑크
  glowGrad.addColorStop(0.50, `rgba(239, 68, 68, ${0.95 * alpha})`);   // 비비드 크림슨 레드
  glowGrad.addColorStop(0.80, `rgba(220, 38, 38, ${0.75 * alpha})`);   // 강렬한 분노 레드
  glowGrad.addColorStop(1.00, "rgba(185, 28, 28, 0.0)");               // 소산

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 단단한 붉은 구체 바디 (스프라이트가 투과되지 않고 Z축 위에 완전히 얹힘)
  ctx.fillStyle = `rgba(220, 20, 40, ${0.98 * alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.90, 0, Math.PI * 2);
  ctx.fill();

  // 3. 중심부 순백 하이라이트 코어 (지시 엄수: 흰색원 작게 유지)
  ctx.fillStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🥊 [은혜갚기 계승]: 순백 코어 플래시 (선 없는 순백 발광 섬광 - 타격 크기 축소 5px ~ 10px)
 */
export function drawFrustrationSmallWhiteHitBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.35) return;
  const alpha = Math.max(0, 1.0 - progress / 0.35);
  if (alpha <= 0.01) return;

  ctx.save();
  const coreR = 5 + progress * 5;
  const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  flashGrad.addColorStop(0.00, `rgba(255, 255, 255, ${1.0 * alpha})`);
  flashGrad.addColorStop(0.40, `rgba(255, 255, 255, ${0.92 * alpha})`);
  flashGrad.addColorStop(0.72, `rgba(254, 202, 202, ${0.55 * alpha})`);
  flashGrad.addColorStop(1.00, "rgba(239, 68, 68, 0.0)");

  ctx.fillStyle = flashGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 🥊 [은혜갚기 계승]: 날카로운 8각 스타버스트 (Sharp Comic Starburst - 타격 크기 축소 7px ~ 14px)
 */
export function drawFrustrationSmallWhiteSharpImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.35) return;
  const alpha = Math.max(0, 1.0 - progress / 0.35);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(progress * 0.45);

  const outerR = 7 + progress * 7;
  const innerR = outerR * 0.38;
  const points = 8;

  ctx.fillStyle = `rgba(255, 255, 255, ${0.96 * alpha})`;
  ctx.strokeStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.lineWidth = 1.2;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;

  ctx.beginPath();
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
 * 화풀이 3개 타격의 기준 위치 및 파티클 구성 정보
 * - 타격 크기(largeRadius): 작게 (8, 8.5, 9.5)
 * - 점 파티클(orbs): 은혜갚기 규격 그대로 유지
 */
export const FRUSTRATION_HITS = [
  {
    // Hit 1: 약간 좌상단 (타격 크기 작게: 8)
    dx: -12,
    dy: -8,
    largeRadius: 8,
    orbs: [
      { angle: -0.80 * Math.PI, maxDist: 40, radius: 4.5, speedPow: 1.5 },
      { angle: -0.25 * Math.PI, maxDist: 46, radius: 5.0, speedPow: 1.3 },
      { angle:  0.35 * Math.PI, maxDist: 34, radius: 4.0, speedPow: 1.8 },
      { angle:  0.95 * Math.PI, maxDist: 42, radius: 4.8, speedPow: 1.4 },
      { angle:  1.45 * Math.PI, maxDist: 32, radius: 3.8, speedPow: 1.9 },
    ],
  },
  {
    // Hit 2: 약간 우하단 (타격 크기 작게: 8.5)
    dx: 12,
    dy: 6,
    largeRadius: 8.5,
    orbs: [
      { angle: -0.65 * Math.PI, maxDist: 44, radius: 4.8, speedPow: 1.4 },
      { angle: -0.10 * Math.PI, maxDist: 50, radius: 5.2, speedPow: 1.3 },
      { angle:  0.50 * Math.PI, maxDist: 38, radius: 4.2, speedPow: 1.7 },
      { angle:  1.10 * Math.PI, maxDist: 48, radius: 5.0, speedPow: 1.4 },
      { angle:  1.60 * Math.PI, maxDist: 36, radius: 4.0, speedPow: 1.8 },
    ],
  },
  {
    // Hit 3: 정중앙 (피니시 결정타 타격 크기 작게: 9.5)
    dx: 0,
    dy: 0,
    largeRadius: 9.5,
    orbs: [
      { angle: -0.38 * Math.PI, maxDist: 60, radius: 5.6, speedPow: 1.4 },
      { angle: -0.06 * Math.PI, maxDist: 38, radius: 4.2, speedPow: 2.0 },
      { angle:  0.28 * Math.PI, maxDist: 54, radius: 5.2, speedPow: 1.5 },
      { angle:  0.64 * Math.PI, maxDist: 32, radius: 4.0, speedPow: 2.2 },
      { angle:  0.94 * Math.PI, maxDist: 64, radius: 5.8, speedPow: 1.3 },
      { angle:  1.18 * Math.PI, maxDist: 44, radius: 4.6, speedPow: 1.8 },
      { angle:  1.46 * Math.PI, maxDist: 56, radius: 5.2, speedPow: 1.4 },
      { angle:  1.72 * Math.PI, maxDist: 36, radius: 4.2, speedPow: 2.0 },
    ],
  },
];

/**
 * 💢 218: 화풀이 (Frustration) Front Effect
 * - Step 2:
 *   1. 3단 타격 (Hit 1: 좌상단, Hit 2: 우하단, Hit 3: 정중앙 피니시)
 *   2. 타격 직격 시 은혜갚기 규격 순백 플래시 & 날카로운 8각 스타버스트
 *   3. 타격 3개는 큰 점 파티클 (Large Glowing Red Orb)
 *   4. 큰 점 파티클에서 붉은색 글로우를 두른 작은 점 파티클(Luminous Red Orb)들이 사방으로 확산
 */
export function drawFrustrationEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, isPlayer: isP, isHit } = drawCtx;
  const step = frame.moveStep ?? 1;

  if (step !== 2 || !isHit) return;

  const hitIdx = (frame.hitIndex ?? 1) - 1; // 0, 1, 2
  if (hitIdx < 0 || hitIdx >= FRUSTRATION_HITS.length) return;

  const hitConfig = FRUSTRATION_HITS[hitIdx];
  const hitProg = frame.hitProgress ?? 0.5;

  // 타겟 중심 좌표 (피격자 상체/가슴 중앙 정렬)
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isP ? 8 : 6);

  // 이번 타격의 타격점 좌표
  const hx = tx + (isP ? hitConfig.dx : -hitConfig.dx);
  const hy = ty + hitConfig.dy;

  targetCtx.save();

  // 1. [아래 레이어]: 작은 붉은 점 파티클들 (사방으로 비산하는 Small Glowing Red Orbs)
  const orbScale = Math.max(0.20, 1.0 - hitProg * 0.65);
  let smallOrbAlpha = 1.0;
  if (hitProg > 0.55) {
    const fadeT = (hitProg - 0.55) / 0.45;
    smallOrbAlpha = Math.max(0, 1.0 - Math.pow(fadeT, 1.25));
  }

  if (smallOrbAlpha > 0.01) {
    for (const orb of hitConfig.orbs) {
      const expandEase = 1.0 - Math.pow(1.0 - Math.min(1.0, hitProg), orb.speedPow);
      const dist = 5 + expandEase * orb.maxDist;
      const ox = hx + Math.cos(orb.angle) * dist;
      const oy = hy + Math.sin(orb.angle) * dist * 0.90;

      const curRadius = orb.radius * orbScale;
      drawFrustrationGlowingRedOrb(targetCtx, ox, oy, curRadius, smallOrbAlpha);
    }
  }

  // 2. [중간 레이어]: 큰 점 파티클 (타격 중심의 Large Glowing Red Orb)
  let largeScale = 1.0;
  let largeAlpha = 1.0;
  if (hitProg < 0.20) {
    largeScale = 0.6 + (hitProg / 0.20) * 0.55; // 0.6 -> 1.15 팝인
    largeAlpha = Math.min(1.0, hitProg / 0.10);
  } else if (hitProg < 0.40) {
    const t = (hitProg - 0.20) / 0.20;
    largeScale = 1.15 - t * 0.15; // 1.15 -> 1.0 안착
    largeAlpha = 1.0;
  } else {
    const t = (hitProg - 0.40) / 0.60;
    largeScale = 1.0 - t * 0.35; // 1.0 -> 0.65 축소
    largeAlpha = Math.max(0, 1.0 - Math.pow(t, 1.3));
  }

  if (largeAlpha > 0.01) {
    drawFrustrationGlowingRedOrb(targetCtx, hx, hy, hitConfig.largeRadius * largeScale, largeAlpha);
  }

  // 3. [최상위 Z축 레이어 - 유저 지시 엄수]: 타격 이펙트가 점 파티클 위에 렌더링
  // 순백 플래시를 먼저 깔고, 날카로운 8각 스타버스트를 맨 위에 얹어 타격 이펙트가 점 파티클보다 확실히 위에 표시
  drawFrustrationSmallWhiteHitBurst(targetCtx, hx, hy, hitProg);
  drawFrustrationSmallWhiteSharpImpactBurst(targetCtx, hx, hy, hitProg);

  targetCtx.restore();
}

// ============================================================================
// 🛡️ 219: 신비의부적 (Safeguard)
// 시전 포켓몬의 스프라이트 위에 안쪽으로 작아지는 #3EDDE0 5겹 원 & 시계방향 십자별 연출
// ============================================================================

/**
 * 십자별을 감싸는 신비로운 영기/증기 (Celestial Star Vapor Puff)
 * - 중심 순백 소프트 글로우 코어 + 외곽 유기적 4엽 순백 반투명 증기 로브
 * - 별보다 훨씬 더 오래 남아 서서히 기화/소산됨
 */
function drawStarVaporPuff(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  rollAngle: number = 0
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.translate(x, y);

  // 1. 중심 소프트 코어 증기 (Soft Pure White Vapor Core)
  const grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
  grad.addColorStop(0.0, `rgba(255, 255, 255, ${Math.min(1.0, alpha * 0.70)})`);
  grad.addColorStop(0.40, `rgba(255, 255, 255, ${Math.min(1.0, alpha * 0.40)})`);
  grad.addColorStop(0.75, `rgba(255, 255, 255, ${Math.min(1.0, alpha * 0.15)})`);
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 외곽 4엽 유기적 순백 증기 로브 (Pure White Organic Billowing Lobes)
  const LOBE_COUNT = 4;
  for (let i = 0; i < LOBE_COUNT; i++) {
    const angle = rollAngle + (i / LOBE_COUNT) * Math.PI * 2;
    const lobeDist = radius * 0.38;
    const lobeR = radius * 0.65;
    const lx = Math.cos(angle) * lobeDist;
    const ly = Math.sin(angle) * lobeDist;

    const lobeGrad = ctx.createRadialGradient(lx, ly, lobeR * 0.15, lx, ly, lobeR);
    lobeGrad.addColorStop(0.0, `rgba(255, 255, 255, ${Math.min(1.0, alpha * 0.45)})`);
    lobeGrad.addColorStop(0.55, `rgba(255, 255, 255, ${Math.min(1.0, alpha * 0.18)})`);
    lobeGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = lobeGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, lobeR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 4각 다이아몬드 순백 십자별 (Sparkle Cross Star)
 */
function drawSafeguardCrossStar(
  ctx: any,
  x: number,
  y: number,
  size: number,
  alpha: number = 1.0,
  rot: number = 0,
  coreColor: string = "#FFFFFF",
  glowColor: string = "rgba(255, 255, 255, 0.95)"
) {
  if (size <= 0.5 || alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(x, y);
  if (rot !== 0) ctx.rotate(rot);

  const half = size * 0.5;
  const pinch = Math.max(0.8, size * 0.13);

  // 순백 글로우 섀도우
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 6;
  ctx.fillStyle = coreColor;

  ctx.beginPath();
  ctx.moveTo(0, -half);
  ctx.lineTo(pinch, -pinch);
  ctx.lineTo(half, 0);
  ctx.lineTo(pinch, pinch);
  ctx.lineTo(0, half);
  ctx.lineTo(-pinch, pinch);
  ctx.lineTo(-half, 0);
  ctx.lineTo(-pinch, -pinch);
  ctx.closePath();
  ctx.fill();

  // 중앙 핀포인트 순백 하이라이트 코어
  if (size >= 5) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.7, size * 0.12), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawSafeguardEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const casterPos = drawCtx?.casterPos || drawCtx?.attackerPos;
  if (!casterPos) return;

  const isP = drawCtx.isPlayer;
  const cx = casterPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  // 포켓몬 스프라이트 중앙
  const cy = casterPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 8);

  const progress = frame.shrinkProgress ?? frame.effectProgress ?? 0;
  if (progress < 0 || progress > 1) return;

  const maxRadius = frame.maxRadius ?? 48;
  // 5겹 링 간격 확장: [1.0, 0.87, 0.74, 0.61, 0.48] (간격 ~13% 스텝)
  const layerFactors = [1.0, 0.87, 0.74, 0.61, 0.48];
  // 외각(0)과 내각(4)이 투명해지는 대칭 알파 그라데이션 (Outer & Inner Transparent Gradient)
  const layerAlphaFactors = [0.40, 0.76, 1.00, 0.76, 0.40];

  targetCtx.save();

  // 1. 축소 궤적에 남겨지는 흰색 반투명 잔상 (Trailing White Translucent Afterimages)
  const ghosts: Array<{ progress?: number; radius?: number; alpha: number }> = frame.ghosts ?? [];
  for (const ghost of ghosts) {
    if (!ghost || ghost.alpha <= 0.01) continue;

    const gRadius = ghost.radius ?? Math.max(0, maxRadius * (1.0 - (ghost.progress ?? 0)));
    if (gRadius <= 0.5) continue;

    targetCtx.save();
    targetCtx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    const glw = Math.min(2.0, Math.max(0.7, gRadius * 0.075));
    targetCtx.lineWidth = glw;

    // 5겹 흰색 반투명 잔상 링 (외각/내각 투명 그라데이션)
    for (let i = 0; i < layerFactors.length; i++) {
      const factor = layerFactors[i];
      const rGhost = gRadius * factor;
      if (rGhost < 0.5) continue;
      targetCtx.save();
      targetCtx.globalAlpha = Math.min(1.0, Math.max(0, ghost.alpha * layerAlphaFactors[i]));
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, rGhost, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    }
    targetCtx.restore();
  }

  // 2. 작아진 위치에 남겨지는 흰색 반투명 잔상 (Shrunk Position White Afterimage)
  if (frame.shrunkAfterimage && frame.shrunkAfterimage.alpha > 0.01) {
    const sAlpha = frame.shrunkAfterimage.alpha;
    const sRadius = frame.shrunkAfterimage.radius ?? 12;

    targetCtx.save();
    targetCtx.globalAlpha = Math.min(1.0, Math.max(0, sAlpha));

    // 은은한 흰색 반투명 내부 글로우
    targetCtx.fillStyle = "rgba(255, 255, 255, 0.12)";
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, sRadius, 0, Math.PI * 2);
    targetCtx.fill();

    // 5겹 흰색 반투명 잔상 링 (두께 보강 및 외각/내각 투명 그라데이션)
    targetCtx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    targetCtx.lineWidth = 1.8;
    for (let i = 0; i < layerFactors.length; i++) {
      const factor = layerFactors[i];
      const rS = sRadius * factor;
      if (rS < 0.5) continue;
      targetCtx.save();
      targetCtx.globalAlpha = Math.min(1.0, Math.max(0, sAlpha * layerAlphaFactors[i]));
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, rS, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    }
    targetCtx.restore();
  }

  // 3. 메인 5겹 시안(#3EDDE0) 링 + 외각/내각 투명 그라데이션
  const curRadius = Math.max(0, maxRadius * (1.0 - progress));
  const alpha = frame.circleAlpha ?? 1.0;

  if (curRadius > 0.5 && alpha > 0.01) {
    targetCtx.save();
    targetCtx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

    const rOuter = curRadius;
    const rInner = curRadius * layerFactors[layerFactors.length - 1];

    // A. [안쪽 검정 글로우]: 5겹 링 안쪽 경계에서 중심으로 퍼지는 은은한 소프트 블랙 글로우
    if (rInner > 2) {
      const gradInner = targetCtx.createRadialGradient(
        cx, cy, Math.max(0, rInner * 0.30),
        cx, cy, rInner
      );
      gradInner.addColorStop(0, "rgba(0, 0, 0, 0.0)");
      gradInner.addColorStop(0.5, "rgba(0, 0, 0, 0.18)");
      gradInner.addColorStop(1, "rgba(0, 0, 0, 0.50)");

      targetCtx.fillStyle = gradInner;
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, rInner, 0, Math.PI * 2);
      targetCtx.fill();

      // 안쪽 링 경계 소프트 블랙 림
      targetCtx.strokeStyle = "rgba(0, 0, 0, 0.35)";
      targetCtx.lineWidth = Math.min(2.2, Math.max(0.8, rInner * 0.10));
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, rInner, 0, Math.PI * 2);
      targetCtx.stroke();
    }

    // B. [바깥쪽 미세한 흰색 글로우]: 최외곽 링 바깥쪽으로 번지는 소프트 화이트 글로우
    if (rOuter > 3) {
      targetCtx.save();
      targetCtx.strokeStyle = "rgba(255, 255, 255, 0.50)";
      targetCtx.lineWidth = Math.min(2.6, Math.max(1.1, rOuter * 0.07));
      targetCtx.shadowColor = "rgba(255, 255, 255, 0.90)";
      targetCtx.shadowBlur = 6;
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, rOuter + 0.8, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    }

    // C. [외각/내각 투명 그라데이션 도넛 밴드]: 링 대역 전체에 깔리는 부드러운 #3EDDE0 그라데이션
    if (rInner > 2 && rOuter > rInner) {
      const gradBand = targetCtx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
      gradBand.addColorStop(0.0, "rgba(62, 221, 224, 0.0)");   // 내각 완전 투명
      gradBand.addColorStop(0.2, "rgba(62, 221, 224, 0.08)");
      gradBand.addColorStop(0.5, "rgba(62, 221, 224, 0.20)");  // 중심 발광 피크
      gradBand.addColorStop(0.8, "rgba(62, 221, 224, 0.08)");
      gradBand.addColorStop(1.0, "rgba(62, 221, 224, 0.0)");   // 외각 완전 투명

      targetCtx.save();
      targetCtx.fillStyle = gradBand;
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      targetCtx.arc(cx, cy, rInner, 0, Math.PI * 2, true);
      targetCtx.fill();
      targetCtx.restore();
    }

    // D. 메인 5겹 #3EDDE0 링 (외각 및 내각이 투명해지는 그라데이션 적용)
    const lw = Math.min(2.8, Math.max(1.1, curRadius * 0.10));
    targetCtx.lineWidth = lw;
    targetCtx.strokeStyle = "#3EDDE0";

    for (let i = 0; i < layerFactors.length; i++) {
      const factor = layerFactors[i];
      const rLayer = curRadius * factor;
      if (rLayer < 0.5) continue;

      targetCtx.save();
      targetCtx.globalAlpha = Math.min(1.0, Math.max(0, alpha * layerAlphaFactors[i]));
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, rLayer, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    }

    targetCtx.restore();
  }

  // --------------------------------------------------------------------------
  // 4. 시계방향 십자별 & 별을 감싸는 증기 (Clockwise Cross Stars & Surrounding Vapor)
  // - 축소에 영향 받지 않고 원래 위치(반경 46px)에 고정
  // - 증기는 별보다 더 오래 남아있음
  // --------------------------------------------------------------------------
  const stars: Array<{
    angle: number;
    radius?: number;
    size?: number;
    alpha?: number;
    starAlpha?: number;
    vaporAlpha?: number;
    vaporRadius?: number;
    rot?: number;
    color?: string;
    glowColor?: string;
  }> = frame.stars ?? [];

  for (const star of stars) {
    if (!star) continue;

    // 축소에 영향 받지 않고 자신의 원래 반경(기본 46px)에 고정
    const starR = star.radius ?? 46;
    const sx = cx + Math.cos(star.angle) * starR;
    const sy = cy + Math.sin(star.angle) * starR;

    // A. 별을 감싸는 증기 (별보다 훨씬 더 오래 남아있음)
    const vAlpha = star.vaporAlpha ?? 0;
    if (vAlpha > 0.01) {
      const vRadius = star.vaporRadius ?? 12;
      drawStarVaporPuff(targetCtx, sx, sy, vRadius, vAlpha, (star.rot ?? 0) * 1.5);
    }

    // B. 순백 십자별 (별 자체는 반짝이다 먼저 소멸)
    const sAlpha = star.starAlpha ?? star.alpha ?? 0;
    if (sAlpha > 0.01) {
      const sSize = star.size ?? 9;
      drawSafeguardCrossStar(
        targetCtx,
        sx,
        sy,
        sSize,
        sAlpha,
        star.rot ?? 0,
        star.color ?? "#FFFFFF",
        star.glowColor ?? "rgba(255, 255, 255, 0.95)"
      );
    }
  }

  targetCtx.restore();
}

// ============================================================================
// 💔 220: 아픔나누기 (Pain Split / いたみわけ) - 노말 타입 변화 기술
//
// 설명: 자신과 상대의 체력을 합쳐서 절반씩 나눈다.
// [유저 지시사항]:
// 1. 서로에게 타격 이펙트 (타격이펙트는 이미지 참조)
// 2. 5번
// 3. 타격이미지의 외각 타격은 원래 주황색이었는데 > 주황색 > 반투명갈색화 일어남 > 그 후 페이드아웃
// ============================================================================

/**
 * 💥 [220 아픔나누기 전용 타격 이펙트]:
 * - 외각 타격: 선명한 주황색(Orange Pop) ➔ 반투명 갈색화(Translucent Brown) ➔ 페이드아웃(Fadeout)
 * - 내부 링: 순백 12각 톱니 링 (White Toothed Cog Ring)
 * - 내부 코어: 칠흑 코어 원 + 붉은색 참격 호 (Red Curved Slash)
 */
export function drawPainSplitHitImpact(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  scale: number = 1.0
) {
  if (progress < 0 || progress > 1.0) return;

  ctx.save();
  ctx.translate(cx, cy);

  // Overall scale: starts punchy and crisp, expands slightly with progress
  const curScale = scale * (0.95 + progress * 0.15);
  ctx.scale(curScale, curScale);

  // Alpha: fades out smoothly from progress 0.60 to 1.0
  let overallAlpha = 1.0;
  if (progress > 0.60) {
    overallAlpha = Math.max(0, 1.0 - (progress - 0.60) / 0.40);
  }
  if (overallAlpha <= 0.01) {
    ctx.restore();
    return;
  }

  // 1. Color interpolation for Outer Spiky Burst:
  // Starts Vivid Orange: rgb(255, 120, 15)
  // Transitions to Translucent Brown: rgba(142, 90, 58, 0.75)
  // User: "원래 주황색이었는데 > 주황색 > 반투명갈색화 일어남 그 후 페이드아웃"
  const colorT = Math.min(1.0, Math.max(0, (progress - 0.20) / 0.35));
  const r = Math.round(255 + (142 - 255) * colorT);
  const g = Math.round(120 + (90 - 120) * colorT);
  const b = Math.round(15 + (58 - 15) * colorT);
  const a = (0.98 + (0.75 - 0.98) * colorT) * overallAlpha;

  // Outer Spiky Burst points (18 radial comic blast teeth matching Gen 5 sprite)
  const numOuterPoints = 18;
  const outerTipR = 25.5;
  const outerValleyR = 19.0;
  const tipVariations = [
    1.0, 0.95, 1.02, 0.98, 1.04, 0.96, 1.0, 0.98, 1.05,
    0.97, 1.02, 0.95, 1.06, 0.97, 1.01, 0.96, 1.03, 0.98
  ];

  // 중심 관통 홀 반지름 (포켓몬 스프라이트/배경이 비치도록 완전 관통)
  const innerHoleR = 10.0;

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  ctx.beginPath();
  const outerStep = Math.PI / numOuterPoints;
  for (let i = 0; i < numOuterPoints * 2; i++) {
    const isTip = i % 2 === 0;
    const ptIdx = Math.floor(i / 2);
    const radius = isTip ? outerTipR * (tipVariations[ptIdx] || 1.0) : outerValleyR;
    const angle = i * outerStep - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // 💥 외곽 버스트 중심부도 완전히 뚫어내어 구멍(Hole) 생성 (외곽 border 제거)
  ctx.moveTo(innerHoleR, 0);
  ctx.arc(0, 0, innerHoleR, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill("evenodd");

  // 2. White Toothed Cog Ring (더 커진 12각 순백 톱니 링 + 관통 홀)
  const teethCount = 12;
  const toothOuterR = 17.5;
  const toothInnerR = 12.5;
  ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, overallAlpha * 1.05).toFixed(3)})`;
  ctx.beginPath();
  for (let i = 0; i < teethCount * 2; i++) {
    const isTip = i % 2 === 0;
    const rad = (i / (teethCount * 2)) * Math.PI * 2 - Math.PI / 2;
    const tr = isTip ? toothOuterR : toothInnerR;
    const x = Math.cos(rad) * tr;
    const y = Math.sin(rad) * tr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // 중심부를 깔끔하게 뚫어내는 내부 원형 홀
  ctx.moveTo(innerHoleR, 0);
  ctx.arc(0, 0, innerHoleR, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill("evenodd");

  ctx.restore();
}

/**
 * 💔 220: 아픔나누기 Main Effect (서로에게 타격 이펙트 5번 렌더링)
 */
export function drawPainSplitEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;

  // 아군 포켓몬 중심 좌표
  const px = (isP ? attackerPos.x : targetPos.x) + (frame.pOffset?.x ?? 0);
  const py = (isP ? attackerPos.y : targetPos.y) + (frame.pOffset?.y ?? 0) - (isP ? 12 : 8);

  // 상대 포켓몬 중심 좌표
  const ex = (!isP ? attackerPos.x : targetPos.x) + (frame.eOffset?.x ?? 0);
  const ey = (!isP ? attackerPos.y : targetPos.y) + (frame.eOffset?.y ?? 0) - (!isP ? 12 : 8);

  const activeHits: Array<{
    hitIdx: number;
    dx: number;
    dy: number;
    progress: number;
    isClimax?: boolean;
    scale?: number;
  }> = frame.activeHits ?? [];

  if (!activeHits || activeHits.length === 0) return;

  targetCtx.save();

  for (const hit of activeHits) {
    if (!hit || hit.progress < 0 || hit.progress > 1.0) continue;

    const baseScale = hit.scale ?? 1.0;
    const isClimax = hit.isClimax ?? false;
    const finalScale = isClimax ? baseScale * 1.15 : baseScale;

    // 1. 아군 포켓몬에게 타격 이펙트 렌더링 (플레이어 크기 135px 반영 1.10배)
    const playerHitX = px + hit.dx;
    const playerHitY = py + hit.dy;
    drawPainSplitHitImpact(targetCtx, playerHitX, playerHitY, hit.progress, finalScale * 1.10);

    // 2. 상대 포켓몬에게 타격 이펙트 렌더링 (좌우 대칭을 위해 -hit.dx)
    const enemyHitX = ex - hit.dx;
    const enemyHitY = ey + hit.dy;
    drawPainSplitHitImpact(targetCtx, enemyHitX, enemyHitY, hit.progress, finalScale * 1.0);
  }

  targetCtx.restore();
}

