// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 30) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 기술 제작 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

/**
 * Gen 1 Moves 077 - 080 Renderers
 *
 * 077: 독가루 (Poison Powder)
 * 078: 저리가루 (Stun Spore)
 * 079: 수면가루 (Sleep Powder)
 * 080: 꽃잎댄스 (Petal Dance)
 */

// ============================================================================
// 077: 독가루 (Poison Powder) - 보라 독가루 구름
// ============================================================================

/**
 * 독가루 입자 하나 (부드러운 살랑거리는 포자)
 * - 중심 진함 → 가장자리 투명한 radial gradient
 * - 살짝 납작한 타원형 (분말이 흩날리는 느낌)
 */
function drawPoisonMote(
  ctx: any,
  x: number,
  y: number,
  r: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02 || r <= 0.5) return;

  ctx.save();
  // 살짝 기울어진 납작 타원 (분말이 흩날리는 방향성)
  const tilt = Math.sin(seed * 1.3) * 0.4;
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(1.0, 0.75);

  // 중심 어두운 보라/자주 → 가장자리 투명 (밝은 흰색 제거)
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  const hue = 275 + Math.sin(seed * 1.7) * 12;   // 263 ~ 287 (자주~보라)
  grad.addColorStop(0.00, `hsla(${hue}, 70%, 28%, ${alpha * 0.95})`);   // 진한 자주 (중심)
  grad.addColorStop(0.35, `hsla(${hue}, 65%, 35%, ${alpha * 0.80})`);   // 어두운 보라
  grad.addColorStop(0.65, `hsla(${hue}, 70%, 48%, ${alpha * 0.45})`);   // 중간 보라
  grad.addColorStop(0.85, `hsla(${hue}, 75%, 58%, ${alpha * 0.15})`);
  grad.addColorStop(1.00, `hsla(${hue}, 75%, 55%, 0)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 살랑살랑 떨어지는 분말 입자 하나를 그린다.
 * localP: 낙하 진행도 (0=상단, 1=바닥)
 * seed: 각 입자별 고유 시드
 */
function drawFallingPowderMote(
  ctx: any,
  topX: number,
  topY: number,
  botY: number,
  localP: number,
  seed: number,
  baseSize: number
) {
  if (localP < 0 || localP > 1.0) return;

  // 비선형 낙하: 처음엔 살짝 떠 있다가 아래로 완만히 가속
  const eased = localP * localP * (3 - 2 * localP) * 0.35 + localP * 0.65;

  // 좌우로 흔들리며 낙하 (살랑살랑) - 진폭/주파수 랜덤화
  const swayAmp = 10 + Math.sin(seed * 2.1) * 8;
  const swayFreq = 1.6 + (Math.abs(seed) % 1.8);
  const sway = swayAmp * Math.sin(swayFreq * localP * Math.PI * 2);

  // 상단 기준 X 에서 흩어진 오프셋
  const spread = (Math.sin(seed * 1.7) * 0.5 + Math.cos(seed * 2.3) * 0.5) * 22;
  const mx = topX + spread + sway;
  const my = topY + (botY - topY) * eased;

// 아래로 갈수록 옅어짐
  const fade = localP > 0.80 ? Math.max(0, 1 - (localP - 0.80) / 0.20) : 1.0;
  const mr = baseSize * (1.0 - localP * 0.20) * 0.65;  // 전체 크기 축소

  drawPoisonMote(ctx, mx, my, mr, fade, seed);
}

/**
 * 진한 보라 먼지/연기 (모래뿌리기의 먼지 스타일)
 * - 위에서 아래로 넓게 퍼지는 반투명 연기 덩어리
 * - 살랑거리는 가루와 함께 배경 레이어로 깔림
 */
function drawPoisonDust(
  ctx: any,
  cx: number,
  cy: number,
  spread: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02) return;

  // 진한 보라 radial gradient 연기 (중심 진함 → 바깥 투명)
  const r = spread;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  const wobble = Math.sin(seed * 2.3) * 8;
  grad.addColorStop(0.00, `rgba(88, 28, 135, ${alpha * 0.75})`);   // 진한 보라
  grad.addColorStop(0.35, `rgba(107, 33, 168, ${alpha * 0.55})`);  // 중간 보라
  grad.addColorStop(0.65, `rgba(126, 34, 206, ${alpha * 0.30})`);  // 밝아지는 보라
  grad.addColorStop(0.85, `rgba(168, 85, 247, ${alpha * 0.12})`);
  grad.addColorStop(1.00, `rgba(168, 85, 247, 0)`);

  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  // 살짝 납작한 타원 (퍼지는 느낌)
  ctx.ellipse(cx + wobble * 0.4, cy, r, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 독가루 구름 (여러 모트가 뭉친 형태)
 */
function drawPoisonCloud(
  ctx: any,
  cx: number,
  cy: number,
  spread: number,
  count: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.02) return;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const ang = t * Math.PI * 2 + timeSeed * 0.6;
    const radius = spread * (0.35 + 0.65 * ((Math.sin(timeSeed * 1.7 + i * 2.3) + 1) * 0.5));
    const mx = cx + Math.cos(ang) * radius * (0.8 + 0.4 * Math.sin(timeSeed + i));
    const my = cy + Math.sin(ang) * radius * 0.7 - Math.abs(Math.sin(timeSeed * 0.8 + i)) * 4;
    const mr = 2.2 + (i % 3) * 1.2 + Math.sin(timeSeed + i * 1.3) * 0.8;

    drawPoisonMote(ctx, mx, my, mr, alpha, i * 1.7);
  }
}

/**
 * moveStep(1~8) + effectProgress(0~1)을 하나의 연속 타임라인 globalT(0~1)로 변환.
 * 각 스텝은 globalT의 고정된 구간을 담당하므로 프레임 전환 시 입자 위치가
 * 자연스럽게 이어진다.
 */
function stepToGlobalT(moveStep: number, effectProgress: number): number {
  // 스텝별 globalT 구간 (start, end)
  const RANGES: Record<number, [number, number]> = {
    1: [0.00, 0.12],
    2: [0.12, 0.24],
    3: [0.24, 0.38],
    4: [0.38, 0.52],
    5: [0.52, 0.68],
    6: [0.68, 0.84],
    7: [0.84, 1.00],
  };
  const range = RANGES[moveStep] ?? [0, 1];
  const p = Math.max(0, Math.min(1, effectProgress));
  return range[0] + (range[1] - range[0]) * p;
}

/**
 * 각 분말 입자의 고유 타임라인 (globalT 기준 낙하 시작/종료).
 * seed로부터 고정 생성 → 프레임 간 동일한 입자가 동일한 위치.
 */
function getPowderTiming(seed: number, idx: number): { startT: number; endT: number; baseX: number; baseSize: number } {
  // 고정 해시 기반 (프레임마다 같은 결과)
  const h1 = Math.sin(seed * 12.9898) * 43758.5453;
  const h2 = Math.sin(seed * 78.233) * 43758.5453;
  const h3 = Math.sin(seed * 45.164) * 43758.5453;
  const r1 = h1 - Math.floor(h1);
  const r2 = h2 - Math.floor(h2);
  const r3 = h3 - Math.floor(h3);

  // 낙하 시작: globalT 0.14 ~ 0.42 사이 랜덤
  const startT = 0.14 + r1 * 0.28;
  // 낙하 지속: 0.32 ~ 0.52
  const dur = 0.32 + r2 * 0.20;
  const endT = startT + dur;

  // 좌우 위치 오프셋: -22 ~ +22
  const baseX = (r3 - 0.5) * 44;
  // 크기: 1.6 ~ 2.4 (축소)
  const baseSize = 1.6 + (r1 * 0.8);

  return { startT, endT, baseX, baseSize };
}

/**
 * 진한 보라 먼지 입자의 고유 타임라인
 */
function getDustTiming(seed: number): { startT: number; endT: number; baseX: number; baseR: number } {
  const h1 = Math.sin(seed * 21.71) * 43758.5453;
  const h2 = Math.sin(seed * 53.13) * 43758.5453;
  const h3 = Math.sin(seed * 91.77) * 43758.5453;
  const r1 = h1 - Math.floor(h1);
  const r2 = h2 - Math.floor(h2);
  const r3 = h3 - Math.floor(h3);

  const startT = 0.12 + r1 * 0.20;   // 0.12 ~ 0.32
  const dur = 0.42 + r2 * 0.22;      // 0.42 ~ 0.64
  const endT = startT + dur;

  const baseX = (r3 - 0.5) * 36;     // -18 ~ +18
  const baseR = 12 + r1 * 5;         // 12 ~ 17 (축소)

  return { startT, endT, baseX, baseR };
}

/**
 * 077: 독가루 (Poison Powder) 메인 이펙트 렌더러
 *
 * ⭐ 연속 타임라인 기반:
 *  - moveStep + effectProgress → globalT(0~1)로 통합
 *  - 각 입자는 고정 시드로부터 고유 낙하 타이밍을 가짐
 *  - 프레임이 바뀌어도 입자가 연속적으로 이어짐
 */
export function drawPoisonPowderEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0
) {
  const tcx = targetPos.x;
  const tcy = targetPos.y - 6;

  // 상대 머리 위 상단 기준점 (분말이 여기서 뿌려짐)
  const topX = tcx;
  const topY = tcy - 90;
  const botY = tcy - 10;

  const POWDER_COUNT = 26;
  const DUST_COUNT = 6;

  // ⭐ 연속 타임라인
  const gT = stepToGlobalT(moveStep, effectProgress);

  // ── 상단 분말 뭉침: gT 0.00 ~ 0.30 동안 성장, 이후 서서히 옅어짐 ──
  const topGrowT = Math.min(1, gT / 0.24);
  const topFade = gT > 0.30 ? Math.max(0, 1 - (gT - 0.30) / 0.40) : 1.0;
  if (topFade > 0.02) {
    const spread = 12 + topGrowT * 22;
    const alpha = topFade * Math.min(1, topGrowT * 1.6);

    // 상단 진한 먼지 (배경)
    drawPoisonDust(ctx, topX, topY + 4, spread * 1.4, alpha * 0.7, gT * 6);
    // 상단 밝은 분말
    drawPoisonCloud(ctx, topX, topY, spread, Math.floor(6 + topGrowT * 12), alpha, gT * 8);
  }

  // ── 진한 먼지 입자들: gT 기준 고정 타임라인으로 낙하 ──
  for (let i = 0; i < DUST_COUNT; i++) {
    const seed = i * 7.31 + 1.0;
    const { startT, endT, baseX, baseR } = getDustTiming(seed);
    if (gT < startT || gT > endT + 0.05) continue;

    const localT = Math.max(0, Math.min(1, (gT - startT) / (endT - startT)));
    const eased = localT * localT * (3 - 2 * localT) * 0.4 + localT * 0.6;

    const dustY = topY + (botY - topY) * eased;
    const dustX = topX + baseX + Math.sin(localT * Math.PI * 1.4 + seed) * 10;
    const dustAlpha = Math.max(0, 1 - localT * 0.55) * 0.55;

    if (localT > 1.0) {
      // 낙하 완료 후 옅게 남음
      drawPoisonDust(ctx, dustX, botY, baseR * 0.8, Math.max(0, 0.35 * (1 - (gT - endT) / 0.05)), seed);
    } else {
      drawPoisonDust(ctx, dustX, dustY, baseR, dustAlpha, seed);
    }
  }

  // ── 밝은 분말 입자들: gT 기준 고정 타임라인으로 살랑살랑 낙하 ──
  for (let i = 0; i < POWDER_COUNT; i++) {
    const seed = i * 1.37 + 0.5;
    const { startT, endT, baseX, baseSize } = getPowderTiming(seed, i);
    if (gT < startT || gT > endT + 0.10) continue;

    const localT = Math.max(0, Math.min(1, (gT - startT) / (endT - startT)));
    const eased = localT * localT * (3 - 2 * localT) * 0.35 + localT * 0.65;

    // 살랑살랑 sway (연속)
    const swayAmp = 10 + Math.sin(seed * 2.1) * 8;
    const swayFreq = 1.6 + (Math.abs(seed) % 1.8);
    const sway = Math.sin(eased * Math.PI * swayFreq + seed * 3.7) * swayAmp;

    const mx = topX + baseX + sway;
    const my = topY + (botY - topY) * eased;

    const fade = localT > 0.80 ? Math.max(0, 1 - (localT - 0.80) / 0.20) : 1.0;
    const mr = baseSize * (1.0 - localT * 0.20);

if (localT >= 1.0) {
      // 낙하 완료 후 상대 몸체에 옅게 남음
      const settleFade = Math.max(0, 0.4 * (1 - (gT - endT) / 0.10));
      drawPoisonMote(ctx, topX + baseX, botY, 1.8, settleFade, seed);
    } else {
      drawPoisonMote(ctx, mx, my, mr, fade, seed);
    }
  }

  // ── 상대 몸체 위에 쌓이는 먼지 (gT 0.62 이후) ──
  if (gT > 0.60) {
    const settle = Math.min(1, (gT - 0.60) / 0.20);
    drawPoisonDust(ctx, tcx, tcy - 10, 24 + settle * 14, 0.50 * settle, gT * 5);
  }

  // ── 몸체 위 분말 뭉침 (gT 0.68 이후) ──
  if (gT > 0.66) {
    const settle = Math.min(1, (gT - 0.66) / 0.18);
    drawPoisonCloud(ctx, tcx, tcy - 8, 16 + settle * 14, Math.floor(8 + settle * 8), 0.75 * settle, gT * 7);
  }

  // ── 거품 파티클 (독 침투, gT 0.72 이후) ──
  if (gT > 0.72) {
    const bubbleP = Math.min(1, (gT - 0.72) / 0.18);
    const bubFade = Math.max(0, 1 - (gT - 0.82) / 0.18);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + bubbleP * 3;
      const bx = tcx + Math.cos(ang) * (16 + bubbleP * 10);
      const by = tcy + Math.sin(ang) * (12 + bubbleP * 8) - bubbleP * 6;
      const br = 3 + (i % 3);
      drawPoisonMote(ctx, bx, by, br, Math.max(0, bubFade) * 0.9, i * 2.1);
    }
  }

  // ── 최종 잔향 (gT 0.88 이후 서서히 사라짐) ──
  if (gT > 0.88) {
    const fade = Math.max(0, 1 - (gT - 0.88) / 0.12);
    if (fade > 0.02) {
      drawPoisonCloud(ctx, tcx, tcy, 18 + (1 - fade) * 8, 8, fade * 0.6, gT * 9);
    }
  }
}

// ============================================================================
// 078: 저리가루 (Stun Spore) - 노란 마비 가루
// ============================================================================

/**
 * 저리가루 입자 하나 (중심 어두운 노랑/주황 → 가장자리 투명)
 */
function drawStunMote(
  ctx: any,
  x: number,
  y: number,
  r: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02 || r <= 0.5) return;

  ctx.save();
  const tilt = Math.sin(seed * 1.3) * 0.4;
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(1.0, 0.75);

  // 중심 어두운 노랑/주황 → 가장자리 투명
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  const hue = 42 + Math.sin(seed * 1.7) * 14;   // 28 ~ 56 (주황~노랑)
  grad.addColorStop(0.00, `hsla(${hue}, 90%, 30%, ${alpha * 0.95})`);   // 진한 주황 (중심)
  grad.addColorStop(0.35, `hsla(${hue}, 92%, 42%, ${alpha * 0.80})`);   // 진한 노랑
  grad.addColorStop(0.65, `hsla(${hue}, 95%, 58%, ${alpha * 0.45})`);   // 밝은 노랑
  grad.addColorStop(0.85, `hsla(${hue}, 100%, 68%, ${alpha * 0.15})`);
  grad.addColorStop(1.00, `hsla(${hue}, 100%, 65%, 0)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 저리가루 진한 노란 먼지/연기
 */
function drawStunDust(
  ctx: any,
  cx: number,
  cy: number,
  spread: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02) return;

  const r = spread;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  const wobble = Math.sin(seed * 2.3) * 8;
  grad.addColorStop(0.00, `rgba(180, 83, 9, ${alpha * 0.75})`);   // 진한 주황
  grad.addColorStop(0.35, `rgba(202, 138, 4, ${alpha * 0.55})`);  // 짙은 노랑
  grad.addColorStop(0.65, `rgba(250, 204, 21, ${alpha * 0.30})`); // 레몬 노랑
  grad.addColorStop(0.85, `rgba(254, 240, 138, ${alpha * 0.12})`);
  grad.addColorStop(1.00, `rgba(254, 240, 138, 0)`);

  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx + wobble * 0.4, cy, r, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 저리가루 구름
 */
function drawStunCloud(
  ctx: any,
  cx: number,
  cy: number,
  spread: number,
  count: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.02) return;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const ang = t * Math.PI * 2 + timeSeed * 0.6;
    const radius = spread * (0.35 + 0.65 * ((Math.sin(timeSeed * 1.7 + i * 2.3) + 1) * 0.5));
    const mx = cx + Math.cos(ang) * radius * (0.8 + 0.4 * Math.sin(timeSeed + i));
    const my = cy + Math.sin(ang) * radius * 0.7 - Math.abs(Math.sin(timeSeed * 0.8 + i)) * 4;
    const mr = 2.2 + (i % 3) * 1.2 + Math.sin(timeSeed + i * 1.3) * 0.8;

    drawStunMote(ctx, mx, my, mr, alpha, i * 1.7);
  }
}

/**
 * 전기 스파크 (마비 연출) - 노란 지그재그, 끝이 뾰족한 테이퍼드 다각형
 */
function drawStunSpark(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02 || size <= 2) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#FDE047";
  ctx.strokeStyle = "#FEF08A";
  ctx.lineWidth = 0.8;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3;

  const sparkCount = 3;
  for (let s = 0; s < sparkCount; s++) {
    const ang = (s / sparkCount) * Math.PI * 2 + seed * 1.3;
    const len = size * (0.7 + 0.3 * Math.sin(seed * 2.1 + s));
    const segments = 3;
    const baseHalfW = 1.6;   // 스파크 시작 두께 (반폭)

    // 지그재그 중심선 좌표 계산
    const pts: { x: number; y: number }[] = [{ x: cx, y: cy }];
    for (let k = 1; k <= segments; k++) {
      const t = k / segments;
      const jitter = (Math.sin(seed * 7.7 + s * 3.1 + k * 2.2) * 0.5) * size * 0.35;
      const px = cx + Math.cos(ang) * len * t + Math.cos(ang + Math.PI / 2) * jitter;
      const py = cy + Math.sin(ang) * len * t + Math.sin(ang + Math.PI / 2) * jitter;
      pts.push({ x: px, y: py });
    }

    // 각 점에서 두께를 테이퍼 (시작 1.0 → 끝 0.0)
    const widths: number[] = pts.map((_, k) => {
      const t = k / (pts.length - 1);
      // 끝으로 갈수록 급격히 좁아짐 (제곱 falloff)
      return baseHalfW * Math.pow(1 - t, 1.4);
    });

    // 위쪽 경계 다각형 경로
    ctx.beginPath();
    for (let k = 0; k < pts.length; k++) {
      // 각 점의 법선 방향 (진행 방향의 수직)
      const prev = pts[Math.max(0, k - 1)];
      const next = pts[Math.min(pts.length - 1, k + 1)];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const dl = Math.hypot(dx, dy) || 1;
      const nx = -dy / dl;
      const ny = dx / dl;
      const w = widths[k];
      const px = pts[k].x + nx * w;
      const py = pts[k].y + ny * w;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    // 아래쪽 경계 (역순)
    for (let k = pts.length - 1; k >= 0; k--) {
      const prev = pts[Math.max(0, k - 1)];
      const next = pts[Math.min(pts.length - 1, k + 1)];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const dl = Math.hypot(dx, dy) || 1;
      const nx = -dy / dl;
      const ny = dx / dl;
      const w = widths[k];
      const px = pts[k].x - nx * w;
      const py = pts[k].y - ny * w;
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 078: 저리가루 (Stun Spore) 메인 이펙트 렌더러
 *
 * ⭐ 독가루와 동일한 "위에서 살랑살랑 낙하" 방식, 색상만 노랑/주황
 *    + 마비 연출로 전기 스파크 추가
 *
 * moveStep 매핑 (8단계, 독가루와 동일):
 *  1~2: 상단 분말 구름 형성
 *  3~4: 살랑살랑 낙하
 *  5:    몸체에 쌓임
 *  6:    마비 침투 & 전기 스파크
 *  7:    잔향
 */
export function drawStunSporeEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0
) {
  const tcx = targetPos.x;
  const tcy = targetPos.y - 6;

  const topX = tcx;
  const topY = tcy - 90;
  const botY = tcy - 10;

  const POWDER_COUNT = 26;
  const DUST_COUNT = 6;

  const gT = stepToGlobalT(moveStep, effectProgress);

  // ── 상단 분말 뭉침 ──
  const topGrowT = Math.min(1, gT / 0.24);
  const topFade = gT > 0.30 ? Math.max(0, 1 - (gT - 0.30) / 0.40) : 1.0;
  if (topFade > 0.02) {
    const spread = 12 + topGrowT * 22;
    const alpha = topFade * Math.min(1, topGrowT * 1.6);

    drawStunDust(ctx, topX, topY + 4, spread * 1.4, alpha * 0.7, gT * 6);
    drawStunCloud(ctx, topX, topY, spread, Math.floor(6 + topGrowT * 12), alpha, gT * 8);
  }

  // ── 진한 노란 먼지 입자 낙하 ──
  for (let i = 0; i < DUST_COUNT; i++) {
    const seed = i * 7.31 + 1.0;
    const { startT, endT, baseX, baseR } = getDustTiming(seed);
    if (gT < startT || gT > endT + 0.05) continue;

    const localT = Math.max(0, Math.min(1, (gT - startT) / (endT - startT)));
    const eased = localT * localT * (3 - 2 * localT) * 0.4 + localT * 0.6;

    const dustY = topY + (botY - topY) * eased;
    const dustX = topX + baseX + Math.sin(localT * Math.PI * 1.4 + seed) * 10;
    const dustAlpha = Math.max(0, 1 - localT * 0.55) * 0.55;

    if (localT > 1.0) {
      drawStunDust(ctx, dustX, botY, baseR * 0.8, Math.max(0, 0.35 * (1 - (gT - endT) / 0.05)), seed);
    } else {
      drawStunDust(ctx, dustX, dustY, baseR, dustAlpha, seed);
    }
  }

  // ── 밝은 분말 입자 낙하 ──
  for (let i = 0; i < POWDER_COUNT; i++) {
    const seed = i * 1.37 + 0.5;
    const { startT, endT, baseX, baseSize } = getPowderTiming(seed, i);
    if (gT < startT || gT > endT + 0.10) continue;

    const localT = Math.max(0, Math.min(1, (gT - startT) / (endT - startT)));
    const eased = localT * localT * (3 - 2 * localT) * 0.35 + localT * 0.65;

    const swayAmp = 10 + Math.sin(seed * 2.1) * 8;
    const swayFreq = 1.6 + (Math.abs(seed) % 1.8);
    const sway = Math.sin(eased * Math.PI * swayFreq + seed * 3.7) * swayAmp;

    const mx = topX + baseX + sway;
    const my = topY + (botY - topY) * eased;

    const fade = localT > 0.80 ? Math.max(0, 1 - (localT - 0.80) / 0.20) : 1.0;
    const mr = baseSize * (1.0 - localT * 0.20);

    if (localT >= 1.0) {
      const settleFade = Math.max(0, 0.4 * (1 - (gT - endT) / 0.10));
      drawStunMote(ctx, topX + baseX, botY, 1.8, settleFade, seed);
    } else {
      drawStunMote(ctx, mx, my, mr, fade, seed);
    }
  }

  // ── 몸체 위에 쌓이는 먼지 ──
  if (gT > 0.60) {
    const settle = Math.min(1, (gT - 0.60) / 0.20);
    drawStunDust(ctx, tcx, tcy - 10, 24 + settle * 14, 0.50 * settle, gT * 5);
  }

  // ── 몸체 위 분말 뭉침 ──
  if (gT > 0.66) {
    const settle = Math.min(1, (gT - 0.66) / 0.18);
    drawStunCloud(ctx, tcx, tcy - 8, 16 + settle * 14, Math.floor(8 + settle * 8), 0.75 * settle, gT * 7);
  }

  // ── 마비 전기 스파크 (gT 0.72 이후) ──
  if (gT > 0.72) {
    const sparkP = Math.min(1, (gT - 0.72) / 0.18);
    const sparkFade = Math.max(0, 1 - (gT - 0.82) / 0.18);
    const sparkCount = 5;
    for (let i = 0; i < sparkCount; i++) {
      const seed = i * 3.7 + 0.3;
      const ang = (i / sparkCount) * Math.PI * 2 + sparkP * 2;
      const dist = 14 + sparkP * 12;
      const sx = tcx + Math.cos(ang) * dist;
      const sy = tcy + Math.sin(ang) * dist * 0.8 - sparkP * 4;
      drawStunSpark(ctx, sx, sy, 10 + (i % 2) * 3, Math.max(0, sparkFade), seed);
    }
  }

  // ── 최종 잔향 ──
  if (gT > 0.88) {
    const fade = Math.max(0, 1 - (gT - 0.88) / 0.12);
    if (fade > 0.02) {
      drawStunCloud(ctx, tcx, tcy, 18 + (1 - fade) * 8, 8, fade * 0.6, gT * 9);
    }
  }
}

// ============================================================================
// 079: 수면가루 (Sleep Powder) - 하늘색 수면 가루 (최신 세대 기준)
// ============================================================================

/**
 * 수면가루 입자 하나 (하늘빛/시안 → 가장자리 투명)
 */
function drawSleepMote(
  ctx: any,
  x: number,
  y: number,
  r: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02 || r <= 0.5) return;

  ctx.save();
  const tilt = Math.sin(seed * 1.3) * 0.4;
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(1.0, 0.75);

  // 중심 진한 감청/스카이 → 중간 밝은 하늘색 → 가장자리 아이스 블루 투명
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  const hue = 196 + Math.sin(seed * 1.7) * 14;  // 182~210 (시안~하늘색)
  grad.addColorStop(0.00, `hsla(${hue}, 80%, 30%, ${alpha * 0.95})`);   // 진한 청색 (중심)
  grad.addColorStop(0.35, `hsla(${hue}, 85%, 48%, ${alpha * 0.80})`);   // 화사한 하늘색
  grad.addColorStop(0.65, `hsla(${hue}, 90%, 68%, ${alpha * 0.45})`);   // 밝은 스카이블루
  grad.addColorStop(0.85, `hsla(${hue}, 95%, 85%, ${alpha * 0.15})`);   // 아이스 블루
  grad.addColorStop(1.00, `hsla(${hue}, 95%, 82%, 0)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 수면가루 배경 먼지/연기 (하늘빛 안개 느낌)
 */
function drawSleepDust(
  ctx: any,
  cx: number,
  cy: number,
  spread: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02) return;

  const r = spread;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  const wobble = Math.sin(seed * 2.3) * 8;
  grad.addColorStop(0.00, `rgba(14, 116, 144, ${alpha * 0.70})`);   // 진한 청록/시안
  grad.addColorStop(0.35, `rgba(2, 132, 199, ${alpha * 0.50})`);    // 맑은 하늘색
  grad.addColorStop(0.65, `rgba(56, 189, 248, ${alpha * 0.28})`);   // 연하늘색
  grad.addColorStop(0.85, `rgba(186, 230, 253, ${alpha * 0.10})`);  // 아이스 블루
  grad.addColorStop(1.00, `rgba(186, 230, 253, 0)`);

  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx + wobble * 0.4, cy, r, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 수면가루 구름 (여러 모트 뭉침)
 */
function drawSleepCloud(
  ctx: any,
  cx: number,
  cy: number,
  spread: number,
  count: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.02) return;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const ang = t * Math.PI * 2 + timeSeed * 0.6;
    const radius = spread * (0.35 + 0.65 * ((Math.sin(timeSeed * 1.7 + i * 2.3) + 1) * 0.5));
    const mx = cx + Math.cos(ang) * radius * (0.8 + 0.4 * Math.sin(timeSeed + i));
    const my = cy + Math.sin(ang) * radius * 0.7 - Math.abs(Math.sin(timeSeed * 0.8 + i)) * 4;
    const mr = 2.2 + (i % 3) * 1.2 + Math.sin(timeSeed + i * 1.3) * 0.8;

    drawSleepMote(ctx, mx, my, mr, alpha, i * 1.7);
  }
}

/**
 * 079: 수면가루 (Sleep Powder) 메인 이펙트 렌더러
 *
 * ⭐ 최신 세대 기준 화사한 하늘색(Cyan / Sky Blue) 분말 낙하 방식
 *
 * moveStep 매핑 (8단계):
 *  1~2: 상단 분말 구름 형성
 *  3~4: 살랑살랑 낙하
 *  5:   몸체에 쌓임
 *  6:   수면 침투
 *  7:   잔향
 */
export function drawSleepPowderEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0
) {
  const tcx = targetPos.x;
  const tcy = targetPos.y - 6;

  const topX = tcx;
  const topY = tcy - 90;
  const botY = tcy - 10;

  const POWDER_COUNT = 26;
  const DUST_COUNT = 6;

  const gT = stepToGlobalT(moveStep, effectProgress);

  // ── 상단 분말 뭉침 ──
  const topGrowT = Math.min(1, gT / 0.24);
  const topFade = gT > 0.30 ? Math.max(0, 1 - (gT - 0.30) / 0.40) : 1.0;
  if (topFade > 0.02) {
    const spread = 12 + topGrowT * 22;
    const alpha = topFade * Math.min(1, topGrowT * 1.6);

    drawSleepDust(ctx, topX, topY + 4, spread * 1.4, alpha * 0.7, gT * 6);
    drawSleepCloud(ctx, topX, topY, spread, Math.floor(6 + topGrowT * 12), alpha, gT * 8);
  }

  // ── 진한 하늘색 먼지 입자 낙하 ──
  for (let i = 0; i < DUST_COUNT; i++) {
    const seed = i * 7.31 + 1.0;
    const { startT, endT, baseX, baseR } = getDustTiming(seed);
    if (gT < startT || gT > endT + 0.05) continue;

    const localT = Math.max(0, Math.min(1, (gT - startT) / (endT - startT)));
    const eased = localT * localT * (3 - 2 * localT) * 0.4 + localT * 0.6;

    const dustY = topY + (botY - topY) * eased;
    const dustX = topX + baseX + Math.sin(localT * Math.PI * 1.4 + seed) * 10;
    const dustAlpha = Math.max(0, 1 - localT * 0.55) * 0.55;

    if (localT > 1.0) {
      drawSleepDust(ctx, dustX, botY, baseR * 0.8, Math.max(0, 0.35 * (1 - (gT - endT) / 0.05)), seed);
    } else {
      drawSleepDust(ctx, dustX, dustY, baseR, dustAlpha, seed);
    }
  }

  // ── 밝은 하늘빛 분말 입자 살랑살랑 낙하 ──
  for (let i = 0; i < POWDER_COUNT; i++) {
    const seed = i * 1.37 + 0.5;
    const { startT, endT, baseX, baseSize } = getPowderTiming(seed, i);
    if (gT < startT || gT > endT + 0.10) continue;

    const localT = Math.max(0, Math.min(1, (gT - startT) / (endT - startT)));
    const eased = localT * localT * (3 - 2 * localT) * 0.35 + localT * 0.65;

    const swayAmp = 10 + Math.sin(seed * 2.1) * 8;
    const swayFreq = 1.6 + (Math.abs(seed) % 1.8);
    const sway = Math.sin(eased * Math.PI * swayFreq + seed * 3.7) * swayAmp;

    const mx = topX + baseX + sway;
    const my = topY + (botY - topY) * eased;

    const fade = localT > 0.80 ? Math.max(0, 1 - (localT - 0.80) / 0.20) : 1.0;
    const mr = baseSize * (1.0 - localT * 0.20);

    if (localT >= 1.0) {
      const settleFade = Math.max(0, 0.4 * (1 - (gT - endT) / 0.10));
      drawSleepMote(ctx, topX + baseX, botY, 1.8, settleFade, seed);
    } else {
      drawSleepMote(ctx, mx, my, mr, fade, seed);
    }
  }

  // ── 몸체 위에 쌓이는 먼지 ──
  if (gT > 0.60) {
    const settle = Math.min(1, (gT - 0.60) / 0.20);
    drawSleepDust(ctx, tcx, tcy - 10, 24 + settle * 14, 0.50 * settle, gT * 5);
  }

  // ── 몸체 위 분말 뭉침 ──
  if (gT > 0.66) {
    const settle = Math.min(1, (gT - 0.66) / 0.18);
    drawSleepCloud(ctx, tcx, tcy - 8, 16 + settle * 14, Math.floor(8 + settle * 8), 0.75 * settle, gT * 7);
  }

  // ── 최종 잔향 (gT 0.88 이후 서서히 사라짐) ──
  if (gT > 0.88) {
    const fade = Math.max(0, 1 - (gT - 0.88) / 0.12);
    if (fade > 0.02) {
      drawSleepCloud(ctx, tcx, tcy, 18 + (1 - fade) * 8, 8, fade * 0.6, gT * 9);
    }
  }
}

// ============================================================================
// 080: 꽃잎댄스 (Petal Dance) - 화사한 벚꽃/장미 꽃잎 회오리 난무
// ============================================================================

/**
 * 벚꽃/장미 꽃잎 하나 (입체적인 3D 펄럭임 물방울/하트 잎사귀 실루엣)
 */
function drawPetal(
  ctx: any,
  x: number,
  y: number,
  size: number,
  angle: number,
  tilt: number,
  typeIdx: number,
  alpha: number
) {
  if (alpha <= 0.02 || size <= 1) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(Math.max(0.2, Math.abs(Math.cos(tilt))), 1.0);

  // 256색 최적화 팔레트 (딥로즈, 핫핑크, 벚꽃핑크, 소프트코랄)
  const PALETTE = [
    { base: "#F43F5E", high: "#FDA4AF", border: "#BE185D" },
    { base: "#EC4899", high: "#FBCFE8", border: "#9D174D" },
    { base: "#F472B6", high: "#FFE4E6", border: "#DB2777" },
    { base: "#FB7185", high: "#FECDD3", border: "#BE185D" },
  ];
  const p = PALETTE[Math.abs(typeIdx) % PALETTE.length];

  ctx.globalAlpha = alpha;

  // 곡선 벚꽃 잎사귀 패스
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.bezierCurveTo(size * 0.75, size * 0.35, size * 0.85, -size * 0.45, 0, -size);
  ctx.bezierCurveTo(-size * 0.85, -size * 0.45, -size * 0.75, size * 0.35, 0, size);
  ctx.closePath();

  // 투톤 핑크 그라데이션
  const grad = ctx.createLinearGradient(0, -size, 0, size);
  grad.addColorStop(0.0, p.high);
  grad.addColorStop(0.65, p.base);
  grad.addColorStop(1.0, p.border);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = p.border;
  ctx.lineWidth = Math.max(0.6, size * 0.08);
  ctx.stroke();

  // 중앙 잎맥 하이라이트
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.65);
  ctx.lineTo(0, size * 0.35);
  ctx.strokeStyle = p.high;
  ctx.lineWidth = Math.max(0.5, size * 0.07);
  ctx.stroke();

  ctx.restore();
}

/**
 * 핑크/라임 다이아몬드 타격 섬광
 */
function drawPetalSpark(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number,
  color: string = "#FBCFE8"
) {
  if (alpha <= 0.02 || size <= 1) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  // 4방향 십자 다이아몬드
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.28, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.28, cy);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - size, cy);
  ctx.lineTo(cx, cy - size * 0.28);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy + size * 0.28);
  ctx.closePath();
  ctx.fill();

  // 중심 하이라이트
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 꽃잎 충격파 링 (적절한 반투명도와 부드러운 선 표현)
 */
function drawPetalShockwave(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  alpha: number,
  color: string = "#F472B6"
) {
  if (alpha <= 0.02 || rx <= 2) return;

  // 부드럽고 자연스러운 반투명 충격파 적용 (최대 0.45 내외로 부드럽게 감쇠)
  const ringAlpha = Math.min(0.48, Math.max(0, alpha * 0.60));
  if (ringAlpha <= 0.02) return;

  ctx.save();

  // 1. 내부 은은한 반투명 파동 면 (에너지 번짐 효과)
  ctx.globalAlpha = ringAlpha * 0.20;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 외곽선 반투명 스트로크 (과도하게 두껍지 않고 부드러운 링)
  ctx.globalAlpha = ringAlpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.min(2.2, Math.max(1.0, rx * 0.028));

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 080: 꽃잎댄스 (Petal Dance) 메인 이펙트 렌더러
 *
 * 연출 구성:
 * - moveStep 1: 댄스 시작 & 발밑 꽃잎 태동 (시전자 회전 궤도 시작)
 * - moveStep 2: 나선 회오리 팽창 (시전자가 빙글빙글 돌며 꽃잎이 소용돌이로 솟구침)
 * - moveStep 3: 꽃잎 만개 태풍 완성 (시전자 전신을 꽃잎 폭풍이 감싸며 돌진 준비)
 * - moveStep 4: 전방 도약 돌진 (시전자 돌진 + 꽃잎들이 추진 기류 형성)
 * - moveStep 5: 꽃잎 폭풍 쇄도 (시전자 ➔ 상대 고속 비행)
 * - moveStep 6: 1차 난무 타격 (상대 감싸며 1차 회오리 & 타격 섬광)
 * - moveStep 7: 2차 폭풍 댄스 (맹렬한 2차 타격 & 나선 가속)
 * - moveStep 8: 꽃잎 대폭발 (사방 만개 비산 & 핑크/화이트 다이아몬드 섬광 & 2중 충격파)
 * - moveStep 9: 잔향 (공중에 흩어진 꽃잎들 살랑살랑 낙하)
 */
export function drawPetalDanceEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0
) {
  const acx = attackerPos.x;
  const acy = attackerPos.y - 4;
  const tcx = targetPos.x;
  const tcy = targetPos.y - 8;
  const p = Math.max(0, Math.min(1, effectProgress));

  // ── 1. 댄스 시작 & 발밑 꽃잎 태동 (발밑에서 꽃잎들이 피어나며 회전 시작) ──
  if (moveStep === 1) {
    const petalCount = 12;
    for (let i = 0; i < petalCount; i++) {
      const seed = i * 2.19 + 1.0;
      const angle = (i / petalCount) * Math.PI * 2 + p * 2.5;
      const dist = 10 + p * 16 + Math.sin(seed * 2) * 4;
      const px = acx + Math.cos(angle) * dist * 1.2;
      const py = acy + 12 + Math.sin(angle) * dist * 0.45 - p * 16;
      const size = 4.5 + (i % 3) * 1.2;
      const rot = angle + p * 3.0;
      const tilt = p * 5.0 + seed;
      const alpha = Math.min(1, p * 2.5) * 0.95;

      drawPetal(ctx, px, py, size, rot, tilt, i, alpha);
    }
    // 발밑 미세한 핑크빛 기류
    drawPetalShockwave(ctx, acx, acy + 8, 16 * p, 8 * p, 0.4 * p, "#FDA4AF");
  }

  // ── 2. 나선 회오리 팽창 (시전자가 빙글빙글 돌며 꽃잎이 소용돌이로 솟구침) ──
  else if (moveStep === 2) {
    const petalCount = 24;
    for (let i = 0; i < petalCount; i++) {
      const seed = i * 3.17 + 0.5;
      const t = (i / petalCount + p * 1.4) % 1.0;
      // 3D 원추형 나선 (발밑에서 어깨 위까지 회전 상승)
      const spiralRadius = 14 + t * 28 + Math.sin(seed) * 4;
      const angle = t * Math.PI * 5 + p * 4.0;
      const px = acx + Math.cos(angle) * spiralRadius * 1.15;
      const py = acy + 10 - t * 46 + Math.sin(angle) * spiralRadius * 0.45;
      const size = 5.5 + (i % 4) * 1.2;
      const rot = angle + t * 4;
      const tilt = t * 8.0 + seed;
      const alpha = Math.sin(t * Math.PI) * 0.95;

      drawPetal(ctx, px, py, size, rot, tilt, i, alpha);
    }
    // 솟구치는 핑크 링
    drawPetalShockwave(ctx, acx, acy - 4, 26 * p, 13 * p, 0.5 * (1 - p * 0.4), "#F472B6");
  }

  // ── 3. 꽃잎 만개 태풍 완성 (시전자 전신을 꽃잎 폭풍이 감싸며 돌진 준비) ──
  else if (moveStep === 3) {
    const petalCount = 32;
    for (let i = 0; i < petalCount; i++) {
      const seed = i * 1.83 + 0.9;
      const t = (i / petalCount + p * 1.8) % 1.0;
      // 팽창하는 2중 나선 꽃잎 태풍
      const spiralRadius = 24 + Math.sin(t * Math.PI) * 22;
      const angle = t * Math.PI * 6 + p * 6.0;
      const px = acx + Math.cos(angle) * spiralRadius * 1.1;
      const py = acy + 6 - t * 50 + Math.sin(angle) * spiralRadius * 0.5;
      const size = 6.2 + (i % 3) * 1.4;
      const rot = angle + t * 5;
      const tilt = t * 10.0 + seed;
      const alpha = Math.sin(t * Math.PI) * 0.98;

      drawPetal(ctx, px, py, size, rot, tilt, i, alpha);
    }
    // 중심 코어 글로우
    drawPetalSpark(ctx, acx, acy - 8, 16, 0.6 * p, "#FBCFE8");
    drawPetalShockwave(ctx, acx, acy - 6, 32 + p * 10, 16 + p * 5, 0.6 * (1 - p * 0.5), "#EC4899");
  }

  // ── 4. 전방 도약 돌진 (시전자 돌진 + 꽃잎들이 추진 기류 형성) ──
  else if (moveStep === 4) {
    const streamCount = 30;
    for (let i = 0; i < streamCount; i++) {
      const seed = i * 2.57 + 0.4;
      const t = (i / streamCount + p * 1.6) % 1.0;
      // 시전자 뒤에서 앞으로 뻗어나가는 유선형 꽃잎 제트 스트림
      const backOffX = (1 - t) * -38;
      const spreadY = Math.sin(seed * 2.8 + t * 4) * (12 + t * 14);
      const px = acx + backOffX + t * 24;
      const py = acy + spreadY - t * 10;
      const size = 6.0 + (i % 3) * 1.3;
      const rot = Math.PI * 0.15 + Math.sin(seed + t * 3) * 0.4;
      const tilt = t * 8.0 + seed;
      const alpha = Math.sin(t * Math.PI) * 0.95;

      drawPetal(ctx, px, py, size, rot, tilt, i, alpha);
    }
    // 돌진 추진 충격파
    drawPetalShockwave(ctx, acx - 14, acy + 4, 20 + p * 16, 10 + p * 8, 0.7 * (1 - p), "#F43F5E");
  }

  // ── 5. 꽃잎 폭풍 쇄도: 시전자 ➔ 상대로 고속 비행 ──
  else if (moveStep === 5) {
    const streamCount = 32;
    for (let i = 0; i < streamCount; i++) {
      const seed = i * 4.19 + 0.3;
      const t = (i / streamCount + p * 1.4) % 1.0;
      // 시전자에서 상대로 가는 3차 베지에 포물선 궤적
      const easeT = t * t * (3 - 2 * t);
      const arcHeight = Math.sin(t * Math.PI) * -42;
      const spreadX = Math.sin(seed * 2.5 + t * 4) * (14 + t * 18);
      const spreadY = Math.cos(seed * 1.7 + t * 3) * (8 + t * 12);

      const px = acx + (tcx - acx) * easeT + spreadX;
      const py = acy + (tcy - acy) * easeT + arcHeight + spreadY;
      const size = 6.5 + (i % 3) * 1.4;
      const rot = Math.atan2(tcy - acy, tcx - acx) + Math.sin(t * 5 + seed) * 0.7;
      const tilt = t * 8.0 + seed;
      const alpha = Math.sin(t * Math.PI) * 0.95;

      drawPetal(ctx, px, py, size, rot, tilt, i, alpha);
    }
  }

  // ── 6. 1차 난무 타격: 상대 감싸며 회오리 & 1차 타격 섬광 ──
  else if (moveStep === 6) {
    const stormCount = 28;
    for (let i = 0; i < stormCount; i++) {
      const seed = i * 2.71 + 1.2;
      const angle = (i / stormCount) * Math.PI * 2 + p * 5.0;
      const rx = 32 + Math.sin(seed + p * 3) * 10;
      const ry = 18 + Math.cos(seed + p * 2) * 6;
      const heightOff = -28 + (i % 7) * 8 + Math.sin(angle * 2) * 6;

      const px = tcx + Math.cos(angle) * rx;
      const py = tcy + Math.sin(angle) * ry + heightOff;
      const size = 6.0 + (i % 4) * 1.2;
      const rot = angle + Math.PI / 2;
      const tilt = p * 6 + seed;
      const alpha = 0.85 + Math.sin(angle) * 0.15;

      drawPetal(ctx, px, py, size, rot, tilt, i, alpha);
    }

    // 1차 타격 섬광 & 충격파
    const hitP = Math.min(1, p * 1.5);
    drawPetalSpark(ctx, tcx, tcy - 8, 22 * (1 - hitP * 0.4), Math.max(0, 1 - hitP * 0.7), "#FFFFFF");
    drawPetalSpark(ctx, tcx, tcy - 8, 16 * (1 - hitP * 0.3), Math.max(0, 1 - hitP * 0.6), "#FBCFE8");
    drawPetalShockwave(ctx, tcx, tcy - 8, 22 + hitP * 24, 12 + hitP * 14, Math.max(0, 0.70 * (1 - hitP * 0.7)), "#FDA4AF");
  }

  // ── 7. 2차 폭풍 댄스: 맹렬한 고속 회전 & 2차 맹타 ──
  else if (moveStep === 7) {
    const stormCount = 34;
    for (let i = 0; i < stormCount; i++) {
      const seed = i * 1.93 + 0.8;
      const t = (i / stormCount + p * 2.0) % 1.0;
      const spiralR = 20 + (1 - t) * 36;
      const angle = t * Math.PI * 6 + p * 8.0;
      const px = tcx + Math.cos(angle) * spiralR;
      const py = tcy + Math.sin(angle) * spiralR * 0.55 - 40 * t;
      const size = 6.2 + (i % 3) * 1.3;
      const rot = angle + Math.PI / 2 + t * 4;
      const tilt = t * 10 + seed;
      const alpha = Math.sin(t * Math.PI) * 0.95;

      drawPetal(ctx, px, py, size, rot, tilt, i, alpha);
    }

    // 2차 타격 십자 섬광
    const hitP = Math.min(1, p * 1.4);
    drawPetalSpark(ctx, tcx - 4, tcy - 12, 28 * (1 - hitP * 0.3), Math.max(0, 1 - hitP * 0.5), "#FFFFFF");
    drawPetalSpark(ctx, tcx + 6, tcy - 4, 20 * (1 - hitP * 0.4), Math.max(0, 1 - hitP * 0.6), "#FDA4AF");
    drawPetalShockwave(ctx, tcx, tcy - 8, 28 + hitP * 32, 16 + hitP * 18, Math.max(0, 0.75 * (1 - hitP * 0.7)), "#F472B6");
  }

  // ── 8. 꽃잎 대폭발: 사방 만개 비산 & 피날레 충격파 ──
  else if (moveStep === 8) {
    const burstCount = 42;
    const burstP = p;
    const easedBurst = Math.pow(burstP, 0.8);

    for (let i = 0; i < burstCount; i++) {
      const seed = i * 2.13 + 0.7;
      const baseAng = (i / burstCount) * Math.PI * 2;
      const speed = 36 + (Math.sin(seed * 3.1) + 1) * 32;
      const dist = speed * easedBurst;

      const px = tcx + Math.cos(baseAng) * dist * 1.15;
      const py = tcy + Math.sin(baseAng) * dist * 0.75 - Math.sin(burstP * Math.PI) * 12;
      const size = (7.0 + (i % 4) * 1.4) * (1.0 - burstP * 0.25);
      const rot = baseAng + burstP * 4.5 + seed;
      const tilt = burstP * 8.0 + seed;
      const alpha = Math.max(0, 1.0 - burstP * 1.1);

      drawPetal(ctx, px, py, size, rot, tilt, i, alpha);
    }

    // 대폭발 2중 부드러운 반투명 충격파 링
    const shockR = easedBurst * 65;
    const shockFade = Math.max(0, 1 - burstP);
    drawPetalShockwave(ctx, tcx, tcy - 8, shockR, shockR * 0.55, shockFade * 0.85, "#FFFFFF");
    drawPetalShockwave(ctx, tcx, tcy - 8, shockR * 1.2, shockR * 0.65, shockFade * 0.70, "#F472B6");
    drawPetalShockwave(ctx, tcx, tcy - 8, shockR * 0.75, shockR * 0.42, shockFade * 0.60, "#FDA4AF");

    // 대폭발 중심 플래시
    if (burstP < 0.4) {
      const flashA = (1 - burstP / 0.4) * 0.9;
      drawPetalSpark(ctx, tcx, tcy - 8, 36, flashA, "#FFFFFF");
      drawPetalSpark(ctx, tcx, tcy - 8, 24, flashA, "#FBCFE8");
    }
  }

  // ── 9. 잔향: 공중에서 팔랑거리며 낙하 ──
  else if (moveStep === 9) {
    const fadeCount = 20;
    const fadeA = Math.max(0, 1.0 - p * 1.15);

    for (let i = 0; i < fadeCount; i++) {
      const seed = i * 3.47 + 0.9;
      const baseX = tcx + (Math.sin(seed * 2.3) * 60);
      const sway = Math.sin(p * Math.PI * 3 + seed) * 14;
      const px = baseX + sway;
      const py = tcy - 35 + (p * 55) + Math.cos(seed * 1.9) * 16;
      const size = 5.0 + (i % 3) * 1.2;
      const rot = seed + p * 2.5;
      const tilt = p * 6.0 + seed;

      drawPetal(ctx, px, py, size, rot, tilt, i, fadeA * 0.75);
    }
  }
}