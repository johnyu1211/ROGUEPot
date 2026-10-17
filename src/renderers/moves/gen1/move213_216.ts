// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";

// ============================================================================
// 💖 213: 헤롱헤롱 (Attract / メロメロ) - 노말 타입 변화 기술
//
// 위력: — / 명중: 100 / PP: 15 / 접촉 판정: X
// 설명: 수컷은 암컷을 암컷은 수컷을 유혹하여 헤롱헤롱하게 만든다. 상대가 기술을 쓰기 어려워진다.
//
// [연출 시퀀스]:
// 1. 뒤 배경: 은은하고 사랑스러운 핑크빛 대기 틴트 및 반짝이(스파클) 파티클
// 2. 시전자: 사랑스러운 바운스 및 주변에서 퐁퐁 솟아오르는 미니 핑크 하트
// 3. 발사: 크고 선명한 사랑의 핑크 하트가 콩닥콩닥 박동(Heartbeat pulse)하며
//    물결치듯 대상에게 날아감 + 하트 궤적을 수놓는 분홍빛 반짝이 트레일
// 4. 피격: 대상 머리/가슴에 하트가 뿅! 하고 안착
//    + 대상 머리 주위에 빙글빙글 회전하는 핑크 하트들 (공전 오빗)
// 5. 실패 (Miss/Invalid): 하트가 대상 앞에서 금이 가며 쩍 갈라져(Broken Heart)
//    잿빛으로 바스러지며 아래로 툭 떨어지는 실연 연출
// ============================================================================

// 256색 최적화 헤롱헤롱 팔레트 (Attract Palette)
const ATTRACT_WHITE = "#FFFFFF";       // 순백 하이라이트 & 유리알 반사광
const ATTRACT_BABY_PINK = "#FCE7F3";   // 파스텔 베이비 핑크 (내부 코어)
const ATTRACT_LIGHT_PINK = "#F472B6";  // 화사한 소프트 핑크
const ATTRACT_ROSE_PINK = "#EC4899";   // 선명한 로즈 핑크 (하트 본체)
const ATTRACT_DARK_WINE = "#4C0519";   // 깊은 와인 레드 (배경 비네트)

/**
 * 정교하고 통통한 포켓몬 본가 스타일 하트 패스 생성 (가로로 볼륨감 있는 황금 비율)
 */
function createHeartPath(ctx: any, cx: number, cy: number, size: number) {
  ctx.beginPath();
  const w = size * 1.18;
  const h = size * 0.82;
  ctx.moveTo(cx, cy - h * 0.25);
  ctx.bezierCurveTo(cx - w * 0.55, cy - h * 0.85, cx - w * 1.12, cy - h * 0.05, cx, cy + h * 0.80);
  ctx.bezierCurveTo(cx + w * 1.12, cy - h * 0.05, cx + w * 0.55, cy - h * 0.85, cx, cy - h * 0.25);
  ctx.closePath();
}

/**
 * 사랑스러운 하트 본체 렌더러 (보더 없는 깔끔한 로즈 핑크 + 하이라이트 글린트)
 */
export function drawAttractHeart(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number = 1.0,
  rotation: number = 0,
  scale: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 하트 본체 (선명한 로즈 핑크 단색, 플랫 스타일)
  createHeartPath(ctx, 0, 0, size);
  ctx.fillStyle = ATTRACT_ROSE_PINK;
  ctx.fill();

  ctx.restore();
}

/**
 * 실패 시 쪼개지는 깨진 하트 (Broken Heart) 렌더러 (보더 없음)
 */
export function drawBrokenHeart(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  breakProgress: number, // 0.0 ~ 1.0
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const splitDist = breakProgress * size * 0.65;
  const fallDist = Math.pow(breakProgress, 1.8) * 45;
  const rot = breakProgress * 0.35;

  const w = size * 1.18;
  const h = size * 0.82;

  // 회색빛 틴트 (실연으로 색을 잃음)
  const heartGrey = "#9CA3AF";
  const heartDarkGrey = "#4B5563";

  // 왼쪽 조각
  ctx.save();
  ctx.translate(cx - splitDist, cy + fallDist);
  ctx.rotate(-rot);
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.25);
  ctx.bezierCurveTo(-w * 0.55, -h * 0.85, -w * 1.12, -h * 0.05, 0, h * 0.80);
  // 번개 모양 균열 라인
  ctx.lineTo(-w * 0.1, h * 0.38);
  ctx.lineTo(w * 0.08, h * 0.15);
  ctx.lineTo(-w * 0.06, -h * 0.05);
  ctx.closePath();
  ctx.fillStyle = heartDarkGrey;
  ctx.fill();
  ctx.restore();

  // 오른쪽 조각
  ctx.save();
  ctx.translate(cx + splitDist, cy + fallDist);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.25);
  ctx.bezierCurveTo(w * 0.55, -h * 0.85, w * 1.12, -h * 0.05, 0, h * 0.80);
  // 번개 모양 균열 라인 맞물림
  ctx.lineTo(-w * 0.1, h * 0.38);
  ctx.lineTo(w * 0.08, h * 0.15);
  ctx.lineTo(-w * 0.06, -h * 0.05);
  ctx.closePath();
  ctx.fillStyle = heartGrey;
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 반짝이는 십자 별빛 (Sparkle)
 */
function drawSparkle(ctx: any, cx: number, cy: number, size: number, alpha: number, color: string = ATTRACT_WHITE) {
  if (alpha <= 0.01 || size <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.quadraticCurveTo(cx, cy, cx + size, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + size);
  ctx.quadraticCurveTo(cx, cy, cx - size, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - size);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}


/**
 * 213: 헤롱헤롱 (Attract) 배후 이펙트 렌더러 (Behind Layer)
 * - 핑크빛 로맨틱 대기 틴트 및 비네트
 * - 바닥의 은은한 핑크 오라 웅덩이
 * - 떠다니는 반짝이 스파클들
 */
export function drawAttractBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, width, height } = drawCtx;
  const pinkDim = frame.pinkDimAlpha ?? frame.dimAlpha ?? 0;
  if (pinkDim > 0.01) {
    targetCtx.save();
    targetCtx.globalAlpha = Math.min(0.55, pinkDim);

    // 1. 핑크빛 대기 틴트 (무한 화각)
    targetCtx.fillStyle = "rgba(244, 114, 182, 0.16)";
    targetCtx.fillRect(-6000, -6000, 14000, 14000);

    // 2. 가장자리 부드러운 와인 비네트
    targetCtx.fillStyle = "rgba(76, 5, 25, 0.18)";
    targetCtx.fillRect(-6000, -6000, 14000, 14000);

    targetCtx.restore();
  }

  // 바닥 핑크빛 오라 웅덩이
  const auraAlpha = frame.pinkAuraAlpha ?? 0;
  if (auraAlpha > 0.02) {
    targetCtx.save();
    targetCtx.globalAlpha = Math.min(0.65, auraAlpha);
    const grad = targetCtx.createRadialGradient(
      targetPos.x, targetPos.y + 20, 5,
      targetPos.x, targetPos.y + 20, 60
    );
    grad.addColorStop(0, "rgba(244, 114, 182, 0.5)");
    grad.addColorStop(0.6, "rgba(236, 72, 153, 0.2)");
    grad.addColorStop(1, "rgba(219, 39, 119, 0)");
    targetCtx.fillStyle = grad;
    targetCtx.beginPath();
    targetCtx.ellipse(targetPos.x, targetPos.y + 20, 55, 18, 0, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.restore();
  }
}

/**
 * 213: 헤롱헤롱 (Attract) 전면 메인 이펙트 렌더러 (Front Layer)
 */
export function drawAttractEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer } = drawCtx;
  const moveStep = frame.moveStep ?? 1;

  // -------------------------------------------------------------
  // 1. 시전자 주변 미니 하트 분출 (Caster Floating Mini Hearts)
  // -------------------------------------------------------------
  const casterMiniHeartsAlpha = frame.casterHeartsAlpha ?? 0;
  if (casterMiniHeartsAlpha > 0.02) {
    const miniConfigs = [
      { dx: -18, dy: -28, size: 7, rot: -0.2, phase: 0 },
      { dx:   0, dy: -42, size: 9, rot:  0.0, phase: 1.2 },
      { dx:  18, dy: -32, size: 8, rot:  0.25, phase: 2.5 },
      { dx: -10, dy: -55, size: 6, rot: -0.15, phase: 3.8 },
      { dx:  14, dy: -52, size: 7, rot:  0.18, phase: 4.9 },
    ];
    for (const cfg of miniConfigs) {
      const curX = attackerPos.x + cfg.dx;
      const curY = attackerPos.y + cfg.dy - (frame.effectProgress ?? 0) * 15;
      drawAttractHeart(targetCtx, curX, curY, cfg.size, casterMiniHeartsAlpha * 0.9, cfg.rot);
    }
  }

  // -------------------------------------------------------------
  // 2. 메인 투사체 하트 비행 (Flying Projectile Heart)
  // -------------------------------------------------------------
  const heartProgress = frame.heartProgress;
  if (heartProgress !== undefined && heartProgress >= 0 && heartProgress <= 1.0) {
    const t = heartProgress;
    // 시전자 위치에서 대상 위치로 비행
    const startX = attackerPos.x + (isPlayer ? 15 : -15);
    const startY = attackerPos.y - 20;
    const endX = targetPos.x;
    const endY = targetPos.y - 15;

    // S자 물결 웨이브 + 아치형 곡선
    const wave = Math.sin(t * Math.PI * 3) * 16;
    const arch = -Math.sin(t * Math.PI) * 25;
    const curX = startX + (endX - startX) * t + (isPlayer ? -wave * 0.5 : wave * 0.5);
    const curY = startY + (endY - startY) * t + arch + wave;

    // 심장 박동 펄스 (Heartbeat pulse: 콩닥콩닥 1.0 -> 1.25 -> 1.0)
    const beat = 1.0 + Math.sin(t * Math.PI * 6) * 0.22;
    const baseSize = frame.heartSize ?? 22;
    const hAlpha = frame.heartAlpha ?? 1.0;
    const hRot = Math.sin(t * Math.PI * 2) * 0.2;

    // 빗나감(Miss) 시 균열 & 부서짐 연출
    if (!drawCtx.isHit && frame.isBrokenHeart) {
      const crackProg = frame.breakProgress ?? 0.5;
      drawBrokenHeart(targetCtx, curX, curY, baseSize, crackProg, hAlpha);
    } else {
      drawAttractHeart(targetCtx, curX, curY, baseSize, hAlpha, hRot, beat);

      // 하트 뒤를 따르는 반짝이 스파클 트레일
      for (let i = 1; i <= 3; i++) {
        const trT = Math.max(0, t - i * 0.06);
        const trX = startX + (endX - startX) * trT;
        const trY = startY + (endY - startY) * trT + arch * 0.8;
        drawSparkle(targetCtx, trX + (i % 2 === 0 ? 8 : -8), trY + 4, 4 - i, hAlpha * (0.8 - i * 0.2), ATTRACT_LIGHT_PINK);
      }
    }
  }

  // -------------------------------------------------------------
  // 3. 대상 주위를 공전하는 헤롱헤롱 하트들 (Orbiting Infatuation Hearts)
  // -------------------------------------------------------------
  const orbitAlpha = frame.infatuateHeartsAlpha ?? 0;
  if (orbitAlpha > 0.02) {
    const orbitProg = frame.orbitProgress ?? 0;
    const orbitCount = 3;
    const orbitRadiusX = 36;
    const orbitRadiusY = 14;
    const centerY = targetPos.y - 20;

    for (let i = 0; i < orbitCount; i++) {
      const angle = orbitProg * Math.PI * 2 + (i * Math.PI * 2) / orbitCount;
      const ox = targetPos.x + Math.cos(angle) * orbitRadiusX;
      const oy = centerY + Math.sin(angle) * orbitRadiusY;
      const oSize = 9 + Math.sin(angle) * 2; // 원근감 (앞쪽은 크고 뒤쪽은 작음)
      const oAlpha = orbitAlpha * (0.7 + Math.sin(angle) * 0.3);

      drawAttractHeart(targetCtx, ox, oy, oSize, oAlpha, Math.cos(angle) * 0.25);
    }
  }
}

// ============================================================================
// 💤 214: 잠꼬대 (Sleep Talk / ねごと) - 노말 타입 변화 기술
//
// 위력: — / 명중: — / PP: 10 / 접촉 판정: X
// 설명: 자신이 배운 기술 중 하나를 무작위로 날린다. 자신이 잠들어 있을 때만 쓸 수 있다.
//
// [연출 기승전결 시퀀스]:
// - 유저 요청: 잠꼬대 쓰면 잠듦 애니메이션('z' 글자 순차 상승)과 부들거리기만 구현
// 1. 잠든 상태: 머리 위로 순서대로 피어오르는 입체 'z' -> 'z' -> 'Z' 수면 이펙트 (156: 잠자기 스타일)
// 2. 몸을 좌우로 부들부들 떠는 리액션 (-3px ~ +3px)
// 3. 추첨된 연계 기술 모션으로 자연스럽게 전환
// 4. 실패 시(Awake / Fail): 어리둥절 갸우뚱 & 머리 위 만화풍 땀방울(💧) 및 잿빛 연기 퍼프(💨)
// ============================================================================

const SLEEPTALK_WHITE = "#FFFFFF";
const SLEEPTALK_FAIL_BLUE = "#38BDF8";
const SLEEPTALK_FAIL_GRAY = "#94A3B8";

/**
 * 실패 시 머리 위 땀방울(💧) 및 연기 퍼프 렌더러
 */
function drawSleepFailReaction(
  ctx: any,
  cx: number,
  cy: number,
  alpha: number = 1.0,
  progress: number = 0.5
) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 만화풍 파란 땀방울 (Sweat drop)
  const dropX = cx + 12;
  const dropY = cy - 10 + progress * 6;
  const dropSize = 8;

  ctx.fillStyle = SLEEPTALK_FAIL_BLUE;
  ctx.beginPath();
  ctx.moveTo(dropX, dropY - dropSize * 0.8);
  ctx.bezierCurveTo(
    dropX - dropSize * 0.6, dropY,
    dropX - dropSize * 0.6, dropY + dropSize * 0.6,
    dropX, dropY + dropSize * 0.6
  );
  ctx.bezierCurveTo(
    dropX + dropSize * 0.6, dropY + dropSize * 0.6,
    dropX + dropSize * 0.6, dropY,
    dropX, dropY - dropSize * 0.8
  );
  ctx.closePath();
  ctx.fill();

  // 땀방울 하이라이트
  ctx.fillStyle = SLEEPTALK_WHITE;
  ctx.beginPath();
  ctx.arc(dropX - 1.5, dropY + 1, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // 2. 회색빛 실패 연기 퍼프 (3개 미니 서클)
  if (progress > 0.3) {
    const puffAlpha = Math.max(0, (1.0 - progress) * 1.5);
    ctx.fillStyle = SLEEPTALK_FAIL_GRAY;
    ctx.globalAlpha = puffAlpha * alpha;

    const puffX = cx - 10;
    const puffY = cy - 14 - (progress - 0.3) * 10;
    ctx.beginPath();
    ctx.arc(puffX, puffY, 4, 0, Math.PI * 2);
    ctx.arc(puffX + 5, puffY - 3, 3.2, 0, Math.PI * 2);
    ctx.arc(puffX - 4, puffY - 2, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 214: 잠꼬대 비하인드 이펙트
 * - 거품/배경 비네트/꿈가루 일체 없이 깔끔하게 처리
 */
export function drawSleepTalkBehindEffect(
  _targetCtx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 배경 비네트 및 추가 배경 이펙트 없음
}

/**
 * 214: 잠꼬대 전면 메인 이펙트
 * - 유저 요청: 잠꼬대 시 잠듦 애니메이션('z' 글자가 순서대로 상승)과 부들거리기만 구현
 * - DungGeunMo 레트로 도트 픽셀 폰트 + 또렷한 다크 아웃라인 + 파스텔 컬러 3단계 z -> z -> Z
 * - 시전자 머리 위 높은 위치에서 S자 곡선으로 피어오르며, 높은 불투명도로 선명하게 시인성 확보
 */
export function drawSleepTalkEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const casterPos = drawCtx?.casterPos || drawCtx?.attackerPos;
  if (!casterPos) return;

  const isPlayer = Boolean(drawCtx.isPlayer);
  // 시전자 머리 위 선명한 출현 원점 (포켓몬 스프라이트 상단 위 공중)
  const headX = casterPos.x + (isPlayer ? 16 : -16);
  const headY = casterPos.y - (isPlayer ? 52 : 42);

  // 1. 실패 연출 (Awake or Fail)
  if (frame.isSleepFail) {
    const prog = frame.effectProgress ?? 0.5;
    const failProg = frame.failProgress ?? prog;
    drawSleepFailReaction(targetCtx, headX, headY, frame.failAlpha ?? 1.0, failProg);
    return;
  }

  // 2. 순수 수면 'z' -> 'z' -> 'Z' 애니메이션
  const totalProg = Math.min(1.05, Math.max(0.0, frame.effectProgress ?? 0.5));

  // 3단계 수면 z 파티클 구성 (소 -> 중 -> 대)
  const Z_ITEMS = [
    { text: "z", size: 16, startP: 0.05, life: 0.90, dx: 12, dy: -22, strokeW: 2.6, color: "#93C5FD" }, // 1번: 연하늘 소형 z
    { text: "z", size: 22, startP: 0.20, life: 0.78, dx: 26, dy: -42, strokeW: 3.0, color: "#C4B5FD" }, // 2번: 연보라 중형 z
    { text: "Z", size: 28, startP: 0.35, life: 0.65, dx: 42, dy: -64, strokeW: 3.5, color: "#FBCFE8" }, // 3번: 연분홍 대형 Z
  ];

  targetCtx.save();
  targetCtx.textAlign = "center";
  targetCtx.textBaseline = "middle";

  for (let i = 0; i < Z_ITEMS.length; i++) {
    const item = Z_ITEMS[i];
    if (totalProg < item.startP || totalProg > item.startP + item.life) continue;

    const t = (totalProg - item.startP) / item.life;
    const sway = Math.sin((t * 2.2 + i * 0.8) * Math.PI) * 6;

    const curX = headX + (isPlayer ? item.dx : -item.dx) + sway;
    const curY = headY + (item.dy * (0.35 + t * 0.65));

    // 페이드인 ➔ 장시간 100% 완전 유지 ➔ 부드러운 페이드아웃 (눈에 선명하고 또렷하게 보이도록 지속 구간 극대화)
    const alpha = t < 0.12
      ? (t / 0.12)
      : t > 0.70
      ? Math.max(0, (1.0 - t) / 0.30)
      : 1.0;

    targetCtx.save();
    targetCtx.globalAlpha = Math.max(0, Math.min(1.0, alpha));
    targetCtx.font = `bold ${item.size}px DungGeunMo, sans-serif`;

    // 또렷한 검은색 외곽 테두리 (포켓몬 본가 스타일)
    targetCtx.lineWidth = item.strokeW;
    targetCtx.strokeStyle = "rgba(15, 23, 42, 0.92)";
    targetCtx.strokeText(item.text, curX, curY);

    // 파스텔 폰트 본체
    targetCtx.fillStyle = item.color;
    targetCtx.fillText(item.text, curX, curY);

    targetCtx.restore();
  }

  targetCtx.restore();
}

// ============================================================================
// 🔔 215: 치료방울 (Heal Bell / いやしのすず) - 노말 타입 변화 기술
//
// 위력: — / 명중: — / PP: 5 / 접촉 판정: X
// 설명: 기분 좋은 방울소리를 들려주어 같은 편 전원의 상태 이상을 회복한다.
//
// [연출 기승전결 시퀀스]:
// 1. 기(起): 시전자 머리 위 허공에 반짝이는 십자 섬광(Glint)과 함께 영롱한 황금 치료방울 등장
// 2. 승(承): 방울이 좌우로 리드미컬하게 딸랑딸랑 진동하며 3중 동심원 음파 링(Sound Resonance Waves) 방출
// 3. 전(轉): 방울 주변으로 다채로운 파스텔 음표(♪, ♫)가 춤추듯 상승하고, 시전자 전신으로 치유의 별빛 가루 샤워(Healing Sparkle Shower) 강림
// 4. 결(結): 상태이상 완전 치유 & 황금 잔향 소산 속 시전자의 기쁨에 찬 경쾌한 도약 바운스(Joyful Bounce)
// ============================================================================

// 256색 최적화 치료방울 팔레트 (Heal Bell Palette)
const HEALBELL_GOLD_HIGHLIGHT = "#FEF08A"; // 밝은 레몬 골드 하이라이트
const HEALBELL_GOLD_MAIN = "#FBBF24";      // 화사한 메인 골드
const HEALBELL_GOLD_DARK = "#D97706";      // 깊은 호박색 그림자/외곽
const HEALBELL_GOLD_SHADOW = "#78350F";    // 종 내부 어둠
const HEALBELL_RIBBON_RED = "#F43F5E";     // 상단 리본 로즈 레드
const HEALBELL_WHITE = "#FFFFFF";          // 순백 반사광 & 치유 스파클
const HEALBELL_CYAN = "#38BDF8";           // 청아한 하늘빛 음파/음표
const HEALBELL_MINT = "#34D399";           // 싱그러운 민트 음표
const HEALBELL_PINK = "#F472B6";           // 부드러운 핑크 음표

/**
 * 4방향 십자 치유 스파클 (Cross Sparkle) 렌더러
 */
function drawHealCrossSparkle(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number = 1.0,
  color: string = HEALBELL_WHITE
) {
  if (alpha <= 0.02 || size <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));
  ctx.fillStyle = color;

  // 세로축 다이아몬드
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.22, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.22, cy);
  ctx.closePath();
  ctx.fill();

  // 가로축 다이아몬드
  ctx.beginPath();
  ctx.moveTo(cx - size, cy);
  ctx.lineTo(cx, cy + size * 0.22);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy - size * 0.22);
  ctx.closePath();
  ctx.fill();

  // 중앙 코어 하이라이트
  ctx.fillStyle = HEALBELL_WHITE;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1, size * 0.25), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🌟 가로로 된 3D 노란 링 렌더러 (Horizontal 3D Yellow Resonance Ring)
 * - 3D 수평 원근 타원 압축 (scale(1.0, 0.38))
 * - 안쪽은 투명 그라데이션 (중심부 0% -> 외곽 95% 고채도 레몬 골드)
 * - 외곽은 눈부시게 빛나는 레몬 옐로우 발광 엣지 링
 * - Z축 레이어 분리 (behind: 뒷면 반원 / front: 앞면 반원 / all: 전체)
 */
function drawHorizontal3DRing(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0,
  layer: "behind" | "front" | "all" = "all"
) {
  if (alpha <= 0.02 || radius <= 2) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));
  ctx.translate(cx, cy);
  ctx.scale(1.0, 0.38); // 가로로 된 3D 수평 타원 압축

  const R = radius;
  const innerR = Math.max(0, R * 0.40);

  // 1. Z축 반원 분리 클리핑 (behind: 포켓몬 등 뒤 상단 반원 / front: 포켓몬 앞 하단 반원)
  ctx.beginPath();
  if (layer === "behind") {
    ctx.rect(-R * 1.6, -R * 1.6, R * 3.2, R * 1.6);
    ctx.clip();
  } else if (layer === "front") {
    ctx.rect(-R * 1.6, 0, R * 3.2, R * 1.6);
    ctx.clip();
  }

  // 2. 안쪽 투명 ➔ 바깥쪽 고채도 옐로우 방사형 그라데이션
  const grad = ctx.createRadialGradient(0, 0, innerR, 0, 0, R);
  grad.addColorStop(0.0, "rgba(254, 240, 138, 0.0)"); // 안쪽 완전 투명
  grad.addColorStop(0.48, "rgba(253, 224, 71, 0.06)"); // 은은한 노란빛
  grad.addColorStop(0.76, "rgba(250, 204, 21, 0.35)"); // 따뜻한 골드
  grad.addColorStop(0.92, "rgba(234, 179, 8, 0.82)");  // 선명한 옐로우
  grad.addColorStop(1.0, "rgba(254, 240, 138, 0.98)"); // 최외곽 레몬 골드 발광

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();

  // 3. 최외곽 선명한 3D 발광 엣지 링
  ctx.lineWidth = Math.max(1.8, 3.5 * (1.0 - (radius / 110) * 0.35));
  ctx.strokeStyle = "#FEF08A"; // 밝은 레몬 옐로우
  ctx.stroke();

  // 4. 내부 2차 보조 골드 림
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "#FDE047";
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(1, R * 0.92), 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 🎵 고품질 스타일리시 파스텔 3D 음표 렌더러 (♪ 단음표, ♫ 쌍음표)
 * - 캔디 젤리 같은 볼륨감 넘치는 타원형 음표 머리 (Tilted Candy Head)
 * - 또렷한 다크 아웃라인 + 영롱한 순백 초승달 하이라이트 글린트 (Crescent Shine)
 * - 단음표(♪): 우아하게 나부끼는 입체 리본 깃발 (Ribbon Wave Flag)
 * - 쌍음표(♫): 리드미컬하게 기울어진 볼드 듀얼 빔 (Slanted Connecting Beam)
 * - 음표 주위를 맴도는 4방향 미니 반짝이 스파클
 */
function drawStylishMusicNote(
  ctx: any,
  cx: number,
  cy: number,
  isDouble: boolean,
  size: number,
  color: string,
  alpha: number = 1.0,
  rot: number = 0
) {
  if (alpha <= 0.02 || size <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  const headRx = size * 0.46; // 가로 타원 반지름
  const headRy = size * 0.34; // 세로 타원 반지름
  const stemH = size * 1.25;  // 기둥 높이
  const outlineColor = color; // 음표 border와 음표 색상 동일

  // 1. 단음표 (♪)
  if (!isDouble) {
    // A) 음표 머리
    ctx.save();
    ctx.rotate(-0.45);
    ctx.fillStyle = color;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, headRx, headRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // B) 수직 기둥 (Stem)
    const stemX = headRx * 0.72;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(stemX, 0);
    ctx.lineTo(stemX, -stemH);
    ctx.stroke();

    // C) 깃발 (Ribbon Wave Flag)
    ctx.fillStyle = color;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(stemX, -stemH);
    ctx.bezierCurveTo(
      stemX + size * 0.65, -stemH + size * 0.18,
      stemX + size * 0.75, -stemH + size * 0.55,
      stemX + size * 0.35, -stemH + size * 0.78
    );
    ctx.bezierCurveTo(
      stemX + size * 0.50, -stemH + size * 0.52,
      stemX + size * 0.38, -stemH + size * 0.28,
      stemX, -stemH + size * 0.18
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // 2. 쌍음표 (♫)
    const span = size * 0.88; // 두 머리 사이 간격
    const stepUp = size * 0.18; // 우측 머리가 살짝 높은 경쾌한 율동 계단

    // A) 좌측 머리
    ctx.save();
    ctx.translate(-span * 0.5, 0);
    ctx.rotate(-0.45);
    ctx.fillStyle = color;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, headRx, headRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // B) 우측 머리
    ctx.save();
    ctx.translate(span * 0.5, -stepUp);
    ctx.rotate(-0.45);
    ctx.fillStyle = color;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, headRx, headRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // C) 트윈 기둥 (Twin Stems)
    const stem1X = -span * 0.5 + headRx * 0.72;
    const stem2X = span * 0.5 + headRx * 0.72;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(stem1X, 0);
    ctx.lineTo(stem1X, -stemH);
    ctx.moveTo(stem2X, -stepUp);
    ctx.lineTo(stem2X, -stemH - stepUp);
    ctx.stroke();

    // D) 상단 연결 볼드 빔 (Slanted Connecting Beam)
    ctx.fillStyle = color;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(stem1X - 1.5, -stemH + 2);
    ctx.lineTo(stem2X + 1.5, -stemH - stepUp + 2);
    ctx.lineTo(stem2X + 1.5, -stemH - stepUp - 5);
    ctx.lineTo(stem1X - 1.5, -stemH - 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 치유의 별빛 가루 샤워 (Healing Sparkle Shower) 렌더러
 */
function drawHealingShower(
  ctx: any,
  cx: number,
  cy: number,
  progress: number, // 0.0 ~ 1.0
  alpha: number = 1.0
) {
  if (alpha <= 0.02) return;
  ctx.save();

  // 고정 시드 기반 결정론적 14개 치유 파티클 (위에서 아래로 샤워 낙하)
  const PARTICLES = [
    { dx: -24, dyBase: -35, speed: 52, size: 7.0, color: HEALBELL_GOLD_HIGHLIGHT, delay: 0.00 },
    { dx: 18, dyBase: -45, speed: 58, size: 8.5, color: HEALBELL_WHITE, delay: 0.08 },
    { dx: -12, dyBase: -40, speed: 64, size: 6.0, color: HEALBELL_GOLD_MAIN, delay: 0.15 },
    { dx: 26, dyBase: -30, speed: 50, size: 7.5, color: HEALBELL_CYAN, delay: 0.22 },
    { dx: 4, dyBase: -50, speed: 66, size: 9.0, color: HEALBELL_WHITE, delay: 0.10 },
    { dx: -32, dyBase: -25, speed: 48, size: 6.5, color: HEALBELL_GOLD_HIGHLIGHT, delay: 0.30 },
    { dx: 34, dyBase: -20, speed: 46, size: 6.0, color: HEALBELL_PINK, delay: 0.25 },
    { dx: -6, dyBase: -42, speed: 60, size: 8.0, color: HEALBELL_MINT, delay: 0.18 },
    { dx: 12, dyBase: -38, speed: 56, size: 7.0, color: HEALBELL_GOLD_MAIN, delay: 0.35 },
    { dx: -20, dyBase: -48, speed: 62, size: 8.0, color: HEALBELL_WHITE, delay: 0.28 },
    { dx: 22, dyBase: -44, speed: 54, size: 6.5, color: HEALBELL_GOLD_HIGHLIGHT, delay: 0.40 },
    { dx: -16, dyBase: -32, speed: 52, size: 5.5, color: HEALBELL_CYAN, delay: 0.45 },
    { dx: 8, dyBase: -28, speed: 48, size: 6.0, color: HEALBELL_WHITE, delay: 0.38 },
    { dx: 0, dyBase: -55, speed: 68, size: 8.5, color: HEALBELL_GOLD_MAIN, delay: 0.12 },
  ];

  for (let i = 0; i < PARTICLES.length; i++) {
    const p = PARTICLES[i];
    if (progress < p.delay) continue;

    const t = Math.min(1.0, (progress - p.delay) / (1.0 - p.delay * 0.7));
    const px = cx + p.dx + Math.sin(t * Math.PI * 2 + i) * 5;
    const py = cy + p.dyBase + t * p.speed;

    // 자연스러운 페이드인 & 페이드아웃
    const pAlpha = alpha * (t < 0.2 ? (t / 0.2) : Math.max(0, (1.0 - t) / 0.8));
    if (pAlpha <= 0.02) continue;

    if (i % 2 === 0) {
      drawHealCrossSparkle(ctx, px, py, p.size * (0.8 + Math.sin(t * Math.PI) * 0.4), pAlpha, p.color);
    } else {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1.0, pAlpha));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1.2, p.size * 0.35), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = HEALBELL_WHITE;
      ctx.beginPath();
      ctx.arc(px - 0.5, py - 0.5, Math.max(0.6, p.size * 0.18), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * 215: 치료방울 비하인드 이펙트
 * - 시전자 배후의 따뜻하고 포근한 황금빛 앰비언트 글로우 및 3D 링 후면(Behind) 렌더링
 */
export function drawHealBellBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect && !frame.showBehindEffect) return;

  const casterPos = drawCtx?.casterPos || drawCtx?.attackerPos;
  if (!casterPos) return;

  const ringY = casterPos.y + 6;

  // 1. 따뜻한 황금빛 앰비언트 후광 링
  const bgGlowAlpha = frame.healBellBgAlpha ?? 0;
  if (bgGlowAlpha > 0.02) {
    targetCtx.save();
    const radius = frame.healBellBgRadius ?? 48;
    for (let r = radius; r >= 16; r -= 14) {
      const layerAlpha = bgGlowAlpha * 0.18 * (1.0 - r / (radius + 20));
      targetCtx.globalAlpha = Math.max(0, Math.min(1.0, layerAlpha));
      targetCtx.fillStyle = HEALBELL_GOLD_MAIN;
      targetCtx.beginPath();
      targetCtx.arc(casterPos.x, casterPos.y - 12, r, 0, Math.PI * 2);
      targetCtx.fill();
    }
    targetCtx.restore();
  }

  // 2. 가로 3D 옐로우 링 1차 (Behind 레이어: 포켓몬 등 뒤 상단 반원)
  const ring1Prog = frame.ring1Progress ?? frame.healBellRing1Progress ?? frame.healBellWaveProgress ?? 0;
  const ring1Alpha = frame.ring1Alpha ?? frame.healBellRing1Alpha ?? (ring1Prog > 0 ? (frame.healBellWaveAlpha ?? 0.9) : 0);
  if (ring1Alpha > 0.02 && ring1Prog > 0) {
    const r1 = 14 + ring1Prog * 76;
    drawHorizontal3DRing(targetCtx, casterPos.x, ringY, r1, ring1Alpha, "behind");
  }

  // 3. 가로 3D 옐로우 링 2차 (Behind 레이어: 포켓몬 등 뒤 상단 반원)
  const ring2Prog = frame.ring2Progress ?? frame.healBellRing2Progress ?? 0;
  const ring2Alpha = frame.ring2Alpha ?? frame.healBellRing2Alpha ?? 0;
  if (ring2Alpha > 0.02 && ring2Prog > 0) {
    const r2 = 14 + ring2Prog * 88;
    drawHorizontal3DRing(targetCtx, casterPos.x, ringY, r2, ring2Alpha, "behind");
  }
}

/**
 * 215: 치료방울 전면 메인 이펙트
 * - 가로로 된 3D 노란 링 2회 퍼짐 (Front 레이어: 포켓몬 앞 하단 반원, 안쪽 투명 그라데이션)
 * - 춤추는 스타일리시 파스텔 음표 (Candy Gloss ♪, ♫)
 * - 치유의 별빛 가루 샤워 (Healing Sparkle Shower)
 * - 치유 섬광 (Heal Glint)
 */
export function drawHealBellEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const casterPos = drawCtx?.casterPos || drawCtx?.attackerPos;
  if (!casterPos) return;

  const isPlayer = Boolean(drawCtx.isPlayer);
  const ringY = casterPos.y + 6;

  // -----------------------------------------------------------------
  // 1. 가로로 된 3D 노란 링 2회 퍼짐 (포켓몬 앞면 반원)
  // -----------------------------------------------------------------
  const ring1Prog = frame.ring1Progress ?? frame.healBellRing1Progress ?? frame.healBellWaveProgress ?? 0;
  const ring1Alpha = frame.ring1Alpha ?? frame.healBellRing1Alpha ?? (ring1Prog > 0 ? (frame.healBellWaveAlpha ?? 0.9) : 0);
  if (ring1Alpha > 0.02 && ring1Prog > 0) {
    const r1 = 14 + ring1Prog * 76;
    drawHorizontal3DRing(targetCtx, casterPos.x, ringY, r1, ring1Alpha, "front");
  }

  const ring2Prog = frame.ring2Progress ?? frame.healBellRing2Progress ?? 0;
  const ring2Alpha = frame.ring2Alpha ?? frame.healBellRing2Alpha ?? 0;
  if (ring2Alpha > 0.02 && ring2Prog > 0) {
    const r2 = 14 + ring2Prog * 88;
    drawHorizontal3DRing(targetCtx, casterPos.x, ringY, r2, ring2Alpha, "front");
  }

  // -----------------------------------------------------------------
  // 2. 🎵 스타일리시 3D 파스텔 음표들 - 2회 링 퍼짐에 맞춰 1차/2차로 분할 등장
  // -----------------------------------------------------------------
  const noteOriginX = casterPos.x + (isPlayer ? 4 : -4);
  const noteOriginY = casterPos.y - 12;

  // [1차 링 확장 시 등장하는 음표 그룹 (Batch 1: 3개)]
  const r1ActiveProg = ring1Prog > 0 ? ring1Prog : ((frame.healBellNotesProgress ?? 0) <= 0.5 ? (frame.healBellNotesProgress ?? 0) * 2 : 0);
  const r1ActiveAlpha = ring1Alpha > 0 ? ring1Alpha : (frame.healBellNotesAlpha ?? 0);

  if (r1ActiveAlpha > 0.05 && r1ActiveProg > 0.12) {
    const BATCH1 = [
      { isDouble: false, color: "#FBBF24", targetDx: -58, targetDy: -50, size: 14, rot: -0.22, startP: 0.15 },
      { isDouble: true,  color: "#38BDF8", targetDx: 62,  targetDy: -52, size: 15, rot: 0.20,  startP: 0.30 },
      { isDouble: false, color: "#F472B6", targetDx: -10, targetDy: -75, size: 13, rot: -0.10, startP: 0.45 },
    ];

    for (let i = 0; i < BATCH1.length; i++) {
      const n = BATCH1[i];
      if (r1ActiveProg < n.startP) continue;

      const t = Math.min(1.0, (r1ActiveProg - n.startP) / (1.0 - n.startP));
      const easeT = 1.0 - Math.pow(1.0 - t, 1.4);

      const spreadX = n.targetDx * easeT;
      const spreadY = n.targetDy * easeT;
      const sway = Math.sin((t * 2.2 + i * 1.1) * Math.PI) * (8 * easeT);

      const nx = noteOriginX + (isPlayer ? spreadX : -spreadX) + sway;
      const ny = noteOriginY + spreadY;

      const nAlpha = r1ActiveAlpha * (t < 0.18 ? (t / 0.18) : t > 0.70 ? Math.max(0, (1.0 - t) / 0.30) : 1.0);
      if (nAlpha <= 0.02) continue;

      const dynamicRot = n.rot + Math.sin(t * Math.PI * 2) * 0.16;
      drawStylishMusicNote(targetCtx, nx, ny, n.isDouble, n.size, n.color, nAlpha, dynamicRot);
    }
  }

  // [2차 링 확장 시 새롭게 등장하는 음표 그룹 (Batch 2: 3개)]
  const r2ActiveProg = ring2Prog > 0 ? ring2Prog : ((frame.healBellNotesProgress ?? 0) > 0.5 ? ((frame.healBellNotesProgress ?? 0) - 0.5) * 2 : 0);
  const r2ActiveAlpha = ring2Alpha > 0 ? ring2Alpha : (frame.healBellNotesAlpha ?? 0);

  if (r2ActiveAlpha > 0.05 && r2ActiveProg > 0.12) {
    const BATCH2 = [
      { isDouble: true,  color: "#34D399", targetDx: 68,  targetDy: -48, size: 15, rot: 0.25,  startP: 0.15 },
      { isDouble: false, color: "#C084FC", targetDx: -64, targetDy: -55, size: 14, rot: -0.22, startP: 0.30 },
      { isDouble: true,  color: "#F59E0B", targetDx: 14,  targetDy: -80, size: 14, rot: 0.12,  startP: 0.45 },
    ];

    for (let i = 0; i < BATCH2.length; i++) {
      const n = BATCH2[i];
      if (r2ActiveProg < n.startP) continue;

      const t = Math.min(1.0, (r2ActiveProg - n.startP) / (1.0 - n.startP));
      const easeT = 1.0 - Math.pow(1.0 - t, 1.4);

      const spreadX = n.targetDx * easeT;
      const spreadY = n.targetDy * easeT;
      const sway = Math.sin((t * 2.2 + i * 1.1) * Math.PI) * (8 * easeT);

      const nx = noteOriginX + (isPlayer ? spreadX : -spreadX) + sway;
      const ny = noteOriginY + spreadY;

      const nAlpha = r2ActiveAlpha * (t < 0.18 ? (t / 0.18) : t > 0.70 ? Math.max(0, (1.0 - t) / 0.30) : 1.0);
      if (nAlpha <= 0.02) continue;

      const dynamicRot = n.rot + Math.sin(t * Math.PI * 2) * 0.16;
      drawStylishMusicNote(targetCtx, nx, ny, n.isDouble, n.size, n.color, nAlpha, dynamicRot);
    }
  }
}

// ============================================================================
// ✨ 216: 은혜갚기 (Return / おんがえし) - 노말 타입 물리 공격기
//
// 위력: 친밀도 비례 (최대 102) / 명중: 100 / PP: 20 / 접촉 판정: O
// 설명: 트레이너를 위해 전력으로 상대를 공격한다. 친밀할수록 위력이 올라간다.
//
// [연출 지시 엄수]:
// 1. 시전포켓몬 납작 2회 (Squash & Stretch 탄성 바운스 2회)
// 2. 타격: 속여때리기와 동일한 타격 규격 (작은 마하펀치 플래시 + 작은 8각 날카로운 스타버스트)
// 3. 암전 없음 (화면 어두워지지 않음)
// 4. 파티클 형태: 속여때리기와 동일한 구체형 순백 발광 알갱이 (Luminous White Orb)
// 5. 회전하는 파티클이 아니라 중심에서 사방(360도)으로 뿜어져 퍼지는 확산 파티클
// ============================================================================

/**
 * 🥊 [속여때리기 동일 규격]: 바깥으로 퍼져나가는 구체형 순백 발광 알갱이 (Luminous White Orb)
 * - 중심부는 눈부신 100% 순백(#FFFFFF) 코어
 * - 외곽 글로우는 은은한 푸른빛 회색(Bluish-Gray) 림
 */
function drawReturnGlowingWhiteOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();

  // 1. 외곽 은은한 푸른빛(Soft Blue) 발광 글로우
  const glowRadius = radius * 1.85;
  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  glowGrad.addColorStop(0.00, `rgba(255, 255, 255, ${1.0 * alpha})`);
  glowGrad.addColorStop(0.35, `rgba(224, 242, 254, ${0.95 * alpha})`); // 화사한 연하늘 코어 림
  glowGrad.addColorStop(0.65, `rgba(147, 197, 253, ${0.78 * alpha})`); // 살짝 푸른빛 소프트 블루
  glowGrad.addColorStop(0.86, `rgba(96, 165, 250, ${0.45 * alpha})`);  // 선명한 푸른빛 외곽 림
  glowGrad.addColorStop(1.00, "rgba(59, 130, 246, 0.0)");             // 자연스러운 푸른빛 소산

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중심부 선명하고 단단한 순백 구체 코어
  ctx.fillStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.68, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🥊 [속여때리기 동일 규격]: 작은 마하펀치 순백 코어 플래시 (선 없는 순백 코어 발광 섬광)
 */
function drawReturnSmallWhiteHitBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.18) return;
  const alpha = Math.max(0, 1.0 - progress / 0.18);
  if (alpha <= 0.01) return;

  ctx.save();

  // 순백 원형 코어 플래시 (8px -> 16px)
  const coreR = (8 + progress * 8);
  const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  flashGrad.addColorStop(0.00, `rgba(255, 255, 255, ${1.0 * alpha})`);
  flashGrad.addColorStop(0.40, `rgba(255, 255, 255, ${0.92 * alpha})`);
  flashGrad.addColorStop(0.72, `rgba(215, 226, 240, ${0.48 * alpha})`);
  flashGrad.addColorStop(1.00, "rgba(155, 172, 194, 0.0)");

  ctx.fillStyle = flashGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🥊 [속여때리기 동일 규격]: 작은 몸통박치기 타격 스타일 날카로운 8각 스타버스트 (Sharp Comic Starburst, 주먹 없이)
 */
function drawReturnSmallWhiteSharpImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.18) return;
  const alpha = Math.max(0, 1.0 - progress / 0.18);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(progress * 0.40);

  const outerR = 8 + progress * 8;
  const innerR = outerR * 0.40;
  const points = 8;

  ctx.fillStyle = `rgba(255, 255, 255, ${0.96 * alpha})`;
  ctx.strokeStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.lineWidth = 1.4;
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
 * 은혜갚기 불규칙 방사 확산 순백 발광 알갱이 목록 (8개)
 * - [유저 지시 엄수]: 갯수 절반(8개)으로 축소 & 각도/거리/속도를 불규칙하게 배치하여 역동적인 파편감 연출
 */
const RETURN_SPREAD_ORBS = [
  { angle: -0.38 * Math.PI, maxDist: 60, radius: 5.6, speedPow: 1.4 }, // 우상단 원거리 쾌속
  { angle: -0.06 * Math.PI, maxDist: 34, radius: 4.0, speedPow: 2.1 }, // 우측 근거리 완속
  { angle:  0.28 * Math.PI, maxDist: 50, radius: 5.2, speedPow: 1.6 }, // 우하단 중거리
  { angle:  0.64 * Math.PI, maxDist: 28, radius: 3.6, speedPow: 2.3 }, // 하단 초근거리
  { angle:  0.94 * Math.PI, maxDist: 64, radius: 5.8, speedPow: 1.3 }, // 좌하단 초원거리 쾌속
  { angle:  1.18 * Math.PI, maxDist: 40, radius: 4.4, speedPow: 1.9 }, // 좌측 중근거리
  { angle:  1.46 * Math.PI, maxDist: 54, radius: 5.0, speedPow: 1.5 }, // 좌상단 원거리
  { angle:  1.72 * Math.PI, maxDist: 32, radius: 3.8, speedPow: 2.0 }, // 상단 근거리
];

/**
 * ✨ 216: 은혜갚기 (Return) Front Effect
 * - Step 2:
 *   [유저 지시 엄수]:
 *   1. 속여때리기와 동일한 타격 이펙트 (작은 마하펀치 플래시 + 작은 8각 날카로운 스타버스트)
 *   2. 화면 암전 없음 (blackFadeAlpha 없음)
 *   3. 회전하는 파티클이 아닌, 8개의 불규칙하게 퍼지는 순백 발광 알갱이 파티클 (속여때리기와 동일 형태)
 */
export function drawReturnEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep ?? 1;
  const p = frame.effectProgress ?? 0.5;

  // 타겟 중심 좌표
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isP ? 16 : 12);

  // --------------------------------------------------------------------------
  // Step 2: 작은 마하펀치 타격 & 불규칙하게 사방으로 퍼지는 순백 발광 알갱이들 (8개)
  // --------------------------------------------------------------------------
  if (step === 2) {
    const hitProg = frame.hitProgress ?? p;

    targetCtx.save();

    // 1. [속여때리기 동일]: 작은 마하펀치 순백 코어 플래시 (1프레임만 출력)
    drawReturnSmallWhiteHitBurst(targetCtx, tx, ty, hitProg);

    // 2. [속여때리기 동일]: 작은 8각 순백 날카로운 스타버스트 (1프레임만 출력)
    drawReturnSmallWhiteSharpImpactBurst(targetCtx, tx, ty, hitProg);

    // 3. [유저 지시 엄수]: 8개 알갱이의 불규칙한 방사 확산
    const sizeScale = Math.max(0.25, 1.0 - hitProg * 0.70);

    let orbAlpha = 1.0;
    if (hitProg > 0.55) {
      const fadeT = (hitProg - 0.55) / 0.45;
      orbAlpha = Math.max(0.0, 1.0 - Math.pow(fadeT, 1.25));
    }

    if (orbAlpha > 0.01) {
      for (const orb of RETURN_SPREAD_ORBS) {
        // 알갱이마다 서로 다른 감속 곡선(speedPow)으로 불규칙 팽창
        const expandEase = 1.0 - Math.pow(1.0 - Math.min(1.0, hitProg), orb.speedPow);
        const dist = 6 + expandEase * orb.maxDist;
        const ox = tx + Math.cos(orb.angle) * dist;
        const oy = ty + Math.sin(orb.angle) * dist * 0.90;

        const curRadius = orb.radius * sizeScale;
        drawReturnGlowingWhiteOrb(targetCtx, ox, oy, curRadius, orbAlpha);
      }
    }

    targetCtx.restore();
  }
}



