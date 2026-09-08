// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

/**
 * 5방향 번개 사출 각도 정의 (양쪽 아래 -> 좌우 수평 방향으로 변경)
 * - 왼쪽 (180°)
 * - 왼쪽 위 (-135°)
 * - 위 (-90°)
 * - 오른쪽 위 (-45°)
 * - 오른쪽 (0°)
 */
const GROWL_LIGHTNING_DIRECTIONS = [
  { name: "왼쪽", angle: Math.PI },
  { name: "왼쪽 위", angle: -Math.PI * 0.75 },
  { name: "위", angle: -Math.PI * 0.5 },
  { name: "오른쪽 위", angle: -Math.PI * 0.25 },
  { name: "오른쪽", angle: 0 },
];

/**
 * Helper: 중심부가 투명하고 외곽 부분이 80% 불투명한 주황색 원
 * - 링(외곽선)이 아니라 면으로 채워진 주황색 원 (filled circle)
 * - 중심부(r <= 35%)는 100% 완전 투명하여 시전 포켓몬과 배경이 온전히 비침
 * - 외곽으로 갈수록 투명도 70%를 거쳐 가장자리(외각)에서 80% 불투명 주황색 도달
 */
function drawOrangeCircle(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0
) {
  if (radius <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, "rgba(255, 40, 30, 0)");        // 중심부: 100% 완전 투명
  grad.addColorStop(0.40, "rgba(255, 40, 30, 0)");     // 안쪽 투명 영역 유지
  grad.addColorStop(0.70, "rgba(255, 35, 22, 0.22)");  // 선홍빛 붉은색 점진적 전개
  grad.addColorStop(0.90, "rgba(255, 24, 15, 0.42)");  // 선명한 붉은빛 몸체부
  grad.addColorStop(1.0, "rgba(255, 16, 10, 0.58)");   // 외곽 가장자리: 맑은 붉은빛 (빨간빛 강화)

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper: 순수 플랫 ⚡ 번개모양 SVG 벡터 렌더러
 * - 테두리(stroke) 없음, 하이라이트(광택선) 없음
 * - 아이코닉한 지그재그(⚡) 번개 폴리곤 (Feather/Lucide SVG zap 규격)
 * - 중심지(cx, cy)에서 방사형 방향(angle)으로 dist만큼 나아가며, 뾰족한 끝이 바깥쪽을 향함
 */
function drawGrowlLightning(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  dist: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (scale <= 0 || alpha <= 0) return;

  const bx = cx + Math.cos(angle) * dist;
  const by = cy + Math.sin(angle) * dist;

  ctx.save();
  ctx.translate(bx, by);
  // 번개의 뾰족한 첨단(-1, 10)이 바깥쪽(angle)을 향하도록 회전
  ctx.rotate(angle - Math.PI / 2);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 정통 지그재그 ⚡ 번개 SVG 폴리곤 (화살표 모양이 아닌 순수 번개)
  ctx.beginPath();
  ctx.moveTo(13 - 12, 2 - 12);  // ( 1, -10) 상단 코너
  ctx.lineTo(3 - 12, 14 - 12);  // (-9,   2) 좌측 지그재그 외곽 첨단
  ctx.lineTo(12 - 12, 14 - 12); // ( 0,   2) 중앙 수평 절개선
  ctx.lineTo(11 - 12, 22 - 12); // (-1,  10) 하단 뾰족한 번개 촉 (바깥쪽 조준)
  ctx.lineTo(21 - 12, 10 - 12); // ( 9,  -2) 우측 지그재그 외곽 첨단
  ctx.lineTo(12 - 12, 10 - 12); // ( 0,  -2) 중앙 수평 절개선
  ctx.closePath();

  // 테두리 없음, 하이라이트 없음: 순수 플랫 옐로우/골드 채우기만 적용
  ctx.fillStyle = "#FFE600";
  ctx.fill();

  ctx.restore();
}

/**
 * 045: 울음소리 (Growl)
 * 
 * User Concept:
 * - 3겹의 투명도 70%의 주황색 원이 시전 포켓몬의 중심지에서부터 시작 (어느정도 큰 원)
 * - 원의 안쪽(중심부)은 투명함 (원의 외곽 부분만 불투명 80%) -> 링이 아닌 중심부가 투명한 채워진 원
 * - 퍼지는 원과 함께 번개모양 svg가 5방향으로 나감 (왼쪽, 왼쪽 위, 위, 오른쪽 위, 오른쪽)
 * - 번개: 화살표 모양이 아닌 지그재그 번개모양, 테두리 없음, 하이라이트 없음
 */
export function drawGrowlEffect(
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

  // 시전자 스프라이트 정중앙 좌표
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const cx = ax;
  const cy = ay - (isP ? 10 : 6);

  ctx.save();

  if (step === 1) {
    // 1단계: 시전자 포효 준비 (숨 들이쉬기 & 초기 중심부 미세 주황 원 + 소형 번개)
    drawOrangeCircle(ctx, cx, cy, 18, 0.4);
    for (const dir of GROWL_LIGHTNING_DIRECTIONS) {
      drawGrowlLightning(ctx, cx, cy, dir.angle, 20, 0.65, 0.5);
    }
  } else if (step === 2) {
    // 2단계: 3겹의 주황색 원 확산 시작 & 5방향 번개 사출
    drawOrangeCircle(ctx, cx, cy, 42, 0.70); // 1차 외곽 원
    drawOrangeCircle(ctx, cx, cy, 26, 0.65); // 2차 중간 원
    drawOrangeCircle(ctx, cx, cy, 12, 0.60); // 3차 내부 원
    for (const dir of GROWL_LIGHTNING_DIRECTIONS) {
      drawGrowlLightning(ctx, cx, cy, dir.angle, 46, 0.90, 0.85);
    }
  } else if (step === 3) {
    // 3단계: 3겹의 주황색 원 대형 확산 & 5방향 번개 뻗음
    drawOrangeCircle(ctx, cx, cy, 72, 0.70);
    drawOrangeCircle(ctx, cx, cy, 54, 0.70);
    drawOrangeCircle(ctx, cx, cy, 36, 0.65);
    for (const dir of GROWL_LIGHTNING_DIRECTIONS) {
      drawGrowlLightning(ctx, cx, cy, dir.angle, 78, 1.15, 1.0);
    }
  } else if (step === 4) {
    // 4단계: 3겹의 원 최대 확장 (어느정도 큰 원 - 100px 대형 원) & 5방향 번개 최고조
    drawOrangeCircle(ctx, cx, cy, 100, 0.70);
    drawOrangeCircle(ctx, cx, cy, 80, 0.70);
    drawOrangeCircle(ctx, cx, cy, 60, 0.70);
    for (const dir of GROWL_LIGHTNING_DIRECTIONS) {
      drawGrowlLightning(ctx, cx, cy, dir.angle, 110, 1.35, 1.0);
    }
  } else if (step === 5) {
    // 5단계: 대형 원 및 5방향 번개 확산 소멸 (페이드아웃)
    drawOrangeCircle(ctx, cx, cy, 128, 0.25);
    drawOrangeCircle(ctx, cx, cy, 106, 0.40);
    drawOrangeCircle(ctx, cx, cy, 84, 0.50);
    for (const dir of GROWL_LIGHTNING_DIRECTIONS) {
      drawGrowlLightning(ctx, cx, cy, dir.angle, 138, 1.0, 0.40);
    }
  }

  ctx.restore();
}

/**
 * 046: 울부짖기 (Roar)
 * 
 * User Concept:
 * - 울음소리와 유사한 에셋(3겹의 붉은 원 + 5방향 플랫 지그재그 ⚡ 번개) 사용
 * - 울음소리는 시전 포켓몬 중심 제자리 확산이지만,
 *   울부짖기는 해당 이펙트가 대상 포켓몬 방향(앞쪽)으로 전진하며 거대하게 퍼지는 전방 지향성 음파 폭풍!
 * - 대상 포켓몬 포커싱(카메라) + 대상이 거센 풍압과 충격을 맞고 화면 밖으로 밀려남(Blow-back)
 */
/**
 * Helper: 3D 원근 틸트가 적용된 주황/붉은색 음파 타원 렌더러
 * - 비행 진행 방향(angle)에 맞추어 깊이(depthRatio: 0.54) 압축 원근 왜곡 적용
 * - 비행 궤적 축상에서 입체적으로 비스듬히 날아가는 3D 원반(Shockwave Disc) 형태
 */
function draw3DSonicWave(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  radius: number,
  alpha: number = 1.0,
  depthRatio: number = 0.54
) {
  if (radius <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle); // 진행 방향 축 (X축이 비행 진행선, Y축이 횡단면)
  ctx.scale(depthRatio, 1.08); // 전진 깊이축 0.54로 원근 압축 -> 3D 타원 원반 형성
  drawOrangeCircle(ctx, 0, 0, radius, alpha);
  ctx.restore();
}

/**
 * 3D 원추형 링 상의 5방향 번개 배치 각도 (3D 타원 원주 둘레를 5등분하여 둥글게 원형 배치)
 * - 0°: 전방 첨단 (상대방을 향하는 최선두)
 * - +72°: 하단 전방 (근경 전방)
 * - +144°: 하단 후방 (근경 후방)
 * - -144°: 상단 후방 (원경 후방)
 * - -72°: 상단 전방 (원경 전방)
 * 5개 번개의 위치가 3D 음파 타원 링의 원주 둘레를 둥글게 감싸며 3차원 입체 궤도를 형성함
 */
const ROAR_3D_RING_ANGLES = [
  0,
  (72 * Math.PI) / 180,
  (144 * Math.PI) / 180,
  (-144 * Math.PI) / 180,
  (-72 * Math.PI) / 180,
];

/**
 * Helper: 3D 원추형 링의 원주 둘레를 따라 둥글게(3차원 타원 원형) 번개 5가닥을 렌더링
 * - 3D 타원 원반(Shockwave Disc)의 둘레(0°, ±72°, ±144°)에 번개의 위치를 둥글게 3차원으로 배치
 * - 화면 Y좌표(원경 vs 근경)에 맞춰 뒤쪽 번개부터 앞쪽 번개 순으로 정렬 렌더링
 * - 시전자 원점에서 전방 외곽으로 퍼지는 3D 원추 확산 각도로 헤딩 회전
 * - 원경/근경 깊이감에 따른 스케일 및 투명도 차등 적용
 */
function draw3DRingLightningSet(
  ctx: any,
  ax: number,
  ay: number,
  cx: number,
  cy: number,
  mainAngle: number,
  radius: number,
  baseScale: number,
  alpha: number,
  depthRatio: number = 0.54
) {
  if (baseScale <= 0 || alpha <= 0) return;

  const cosM = Math.cos(mainAngle);
  const sinM = Math.sin(mainAngle);

  // 원추 가상 정점(시전자 뒤쪽 40px): 모든 번개가 전방 외곽으로 자연스럽게 확산되는 기준점
  const apexX = ax - cosM * 40;
  const apexY = ay - sinM * 40;

  // 5개 번개의 3D 원주상 위치 및 스케일 계산
  const bolts = ROAR_3D_RING_ANGLES.map((phi) => {
    // 3D 링 로컬 타원 좌표 (u: 비행축, v: 횡단축)
    const u = Math.cos(phi) * radius * depthRatio;
    const v = Math.sin(phi) * radius * 1.08;

    // 월드 좌표 변환
    const wx = cx + cosM * u - sinM * v;
    const wy = cy + sinM * u + cosM * v;

    // 3D 등각 원근 깊이 스케일링 (화면 상단 원경 0.85 ~ 하단 근경 1.18)
    const depthFactor = 1.0 + ((wy - cy) / (radius * 1.08 + 1)) * 0.20;
    const finalScale = Math.max(0.30, baseScale * depthFactor);
    // 시작 시 투명하고 적 도달 시 불투명하도록 alpha 곡선 온전히 반영
    const finalAlpha = Math.min(1.0, Math.max(0.04, alpha * (0.88 + (depthFactor - 1.0) * 0.12)));

    // 번개 진행 각도: 정점에서 (wx, wy)를 향해 전방 외곽으로 사출
    const heading = Math.atan2(wy - apexY, wx - apexX);

    return { wx, wy, heading, finalScale, finalAlpha };
  });

  // 깊이 정렬 (화면 상단 원경 -> 하단 근경 순서로 그려서 입체 오버랩)
  bolts.sort((a, b) => a.wy - b.wy);

  for (const b of bolts) {
    drawGrowlLightning(ctx, b.wx, b.wy, b.heading, 0, b.finalScale, b.finalAlpha);
  }
}

/**
 * 046: 울부짖기 (Roar)
 * 
 * User Concept (3차원 입체화):
 * - 울음소리와 유사한 에셋(3겹의 붉은 원 + 5방향 ⚡ 번개) 기반
 * - 상대 방향으로 날아가는 음파와 번개가 3차원 원근감(3D)을 갖도록 입체 렌더링:
 *   1) 각 링이 진행축에 직교하는 3D 타원 원반(depthRatio: 0.54)으로 기울어져 비행
 *   2) 3겹의 링이 동일한 중심이 아닌 Z축 깊이별로 순차 배치되어 전방으로 확장되는 3D 원추형(Conical Horn) 파동 형성
 *   3) 5방향 번개의 위치 역시 3D 원추 링 둘레를 따라 둥글게(3차원 타원 원주) 배치되어 비행
 *   4) 번개는 시전 초기 은은하게 투명(alpha 0.20)하게 시작하여, 적에게 도달 직격 시 완전 불투명(alpha 1.0)하게 응축 작렬
 * - 대상 포켓몬 포커싱(카메라) + 대상이 거센 풍압과 충격을 맞고 화면 밖으로 밀려남(Blow-back)
 */
export function drawRoarEffect(
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

  // 시전자와 대상의 실제 렌더링 위치 (오프셋 포함)
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);

  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  // 시전자 -> 대상 방향 주 각도 (비행 궤적 축)
  const mainAngle = Math.atan2(ty - ay, tx - ax);

  ctx.save();

  if (step === 1) {
    // 1단계: 시전자 입 앞쪽에서 포효 3D 음파 구 충전 시작 (번개: 은은하고 투명하게 발생)
    const t = 0.14;
    const cx = ax + (tx - ax) * t;
    const cy = ay + (ty - ay) * t;
    draw3DSonicWave(ctx, cx, cy, mainAngle, 22, 0.50);
    draw3DRingLightningSet(ctx, ax, ay, cx, cy, mainAngle, 24, 0.60, 0.20);
  } else if (step === 2) {
    // 2단계: 3D 원추형 3단 링 전진 사출 (번개: 반투명으로 서서히 또렷해짐)
    const t1 = 0.42; // 선두 링
    const t2 = 0.32; // 중간 링
    const t3 = 0.22; // 후미 링

    const cx1 = ax + (tx - ax) * t1; const cy1 = ay + (ty - ay) * t1;
    const cx2 = ax + (tx - ax) * t2; const cy2 = ay + (ty - ay) * t2;
    const cx3 = ax + (tx - ax) * t3; const cy3 = ay + (ty - ay) * t3;

    // 뒤에서 앞 순서로 렌더링하여 3D 깊이 오버랩 구현
    draw3DSonicWave(ctx, cx3, cy3, mainAngle, 20, 0.58);
    draw3DSonicWave(ctx, cx2, cy2, mainAngle, 36, 0.65);
    draw3DSonicWave(ctx, cx1, cy1, mainAngle, 54, 0.70);

    // 번개 위치도 선두 링의 3D 타원 원주 둘레를 따라 둥글게 3차원으로 배치 (alpha 0.50)
    draw3DRingLightningSet(ctx, ax, ay, cx1, cy1, mainAngle, 56, 0.90, 0.50);
  } else if (step === 3) {
    // 3단계: 거대한 3D 음파 폭풍이 대상 앞까지 급속 전진 & 1차 풍압 타격 (번개: 짙고 선명해짐)
    const t1 = 0.74;
    const t2 = 0.62;
    const t3 = 0.50;

    const cx1 = ax + (tx - ax) * t1; const cy1 = ay + (ty - ay) * t1;
    const cx2 = ax + (tx - ax) * t2; const cy2 = ay + (ty - ay) * t2;
    const cx3 = ax + (tx - ax) * t3; const cy3 = ay + (ty - ay) * t3;

    draw3DSonicWave(ctx, cx3, cy3, mainAngle, 44, 0.65);
    draw3DSonicWave(ctx, cx2, cy2, mainAngle, 66, 0.70);
    draw3DSonicWave(ctx, cx1, cy1, mainAngle, 88, 0.72);

    draw3DRingLightningSet(ctx, ax, ay, cx1, cy1, mainAngle, 92, 1.25, 0.85);
  } else if (step === 4) {
    // 4단계: 거대 3D 포효 음파가 대상 포켓몬을 직격하여 집어삼킴 (번개: 100% 완전 불투명 작렬!)
    const t1 = 0.98;
    const t2 = 0.84;
    const t3 = 0.70;

    const cx1 = ax + (tx - ax) * t1; const cy1 = ay + (ty - ay) * t1;
    const cx2 = ax + (tx - ax) * t2; const cy2 = ay + (ty - ay) * t2;
    const cx3 = ax + (tx - ax) * t3; const cy3 = ay + (ty - ay) * t3;

    draw3DSonicWave(ctx, cx3, cy3, mainAngle, 70, 0.68);
    draw3DSonicWave(ctx, cx2, cy2, mainAngle, 94, 0.72);
    draw3DSonicWave(ctx, cx1, cy1, mainAngle, 120, 0.75);

    draw3DRingLightningSet(ctx, ax, ay, cx1, cy1, mainAngle, 126, 1.50, 1.0);
  } else if (step === 5) {
    // 5단계: 대상을 밖으로 날려버린 후 3D 음파 폭풍이 전방 너머로 관통 소멸 (페이드아웃)
    const t1 = 1.16;
    const t2 = 1.02;
    const t3 = 0.88;

    const cx1 = ax + (tx - ax) * t1; const cy1 = ay + (ty - ay) * t1;
    const cx2 = ax + (tx - ax) * t2; const cy2 = ay + (ty - ay) * t2;
    const cx3 = ax + (tx - ax) * t3; const cy3 = ay + (ty - ay) * t3;

    draw3DSonicWave(ctx, cx3, cy3, mainAngle, 92, 0.48);
    draw3DSonicWave(ctx, cx2, cy2, mainAngle, 120, 0.35);
    draw3DSonicWave(ctx, cx1, cy1, mainAngle, 148, 0.22);

    draw3DRingLightningSet(ctx, ax, ay, cx1, cy1, mainAngle, 154, 1.10, 0.25);
  }

  ctx.restore();
}

/**
 * Helper: 반투명 연분홍빛 배경 오버레이 (유저 지정: 서서히 20% 연분홍빛)
 * - 카메라 줌 및 팬 이동(적 시전 시 화면 하단/좌측 집중) 시에도 화면 전체를 빈틈없이 덮도록
 *   광범위 좌표(-4000, -4000, 10000, 10000)로 채워 잘림 현상을 완전 방지
 */
function drawPinkBackgroundOverlay(ctx: any, alpha: number = 0.20) {
  if (alpha <= 0) return;
  ctx.save();
  // 부드러운 파스텔 연분홍빛 (#FFB6C1 / rgba(255, 182, 193))
  ctx.fillStyle = `rgba(255, 182, 193, ${Math.min(0.20, Math.max(0, alpha))})`;
  ctx.fillRect(-4000, -4000, 10000, 10000);
  ctx.restore();
}

/**
 * Helper: 단순 플랫 검정색 8분음표 (♪) SVG 벡터 렌더러
 * - 테두리(stroke) 없음, 하이라이트(광택) 없음, 순수 단순 플랫 검정(#000000)
 */
function drawSingleMusicNoteSvg(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  rotation: number = 0,
  alpha: number = 1.0
) {
  if (scale <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.translate(0, 8); // 시각적 중심(y=-8)을 원점에 맞춰 부드러운 중심축 회전
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = "#000000"; // 순수 단순 플랫 검정

  // 1. 타원형 음표 머리 (약간 기울어진 타원)
  ctx.beginPath();
  ctx.ellipse(-5, 4, 7.5, 5.2, -0.40, 0, Math.PI * 2);
  ctx.fill();

  // 2. 음표 기둥 (Stem)
  ctx.fillRect(1.5, -20, 2.8, 24);

  // 3. 음표 꼬리 (Flag - 우측으로 유려하게 감기는 곡선)
  ctx.beginPath();
  ctx.moveTo(4.3, -20);
  ctx.bezierCurveTo(12, -18, 17, -10, 16, -1.5);
  ctx.bezierCurveTo(13.5, -7.5, 9, -11, 4.3, -12);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Helper: 단순 플랫 검정색 2연 16분음표 (♫) SVG 벡터 렌더러
 * - 테두리(stroke) 없음, 하이라이트(광택) 없음, 순수 단순 플랫 검정(#000000)
 */
function drawDoubleMusicNoteSvg(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  rotation: number = 0,
  alpha: number = 1.0
) {
  if (scale <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.translate(0, 7); // 시각적 중심 원점 정렬
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = "#000000";

  // 좌측 음표 머리
  ctx.beginPath();
  ctx.ellipse(-9, 5, 6.5, 4.5, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // 우측 음표 머리
  ctx.beginPath();
  ctx.ellipse(7, 2, 6.5, 4.5, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // 좌측 기둥 (Stem)
  ctx.fillRect(-4, -16, 2.5, 21);

  // 우측 기둥 (Stem)
  ctx.fillRect(12, -19, 2.5, 21);

  // 상단 가로 이음줄 2줄 (16분음표 Beams)
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

/**
 * Helper: 대상 머리 위로 피어오르는 공용 잠듦(Sleep) Zzz 수면 연출
 * - z -> z -> Z 3개의 문자가 화면상에 동시에 3개 모두 선명히 보이도록 수명과 스폰 타이밍 최적화
 */
export function drawSleepZzzEffect(
  ctx: any,
  headX: number,
  headY: number,
  progress: number // 0.0 ~ 1.0
) {
  if (progress <= 0 || progress > 1.2) return;
  ctx.save();

  // 3개의 z가 동시에 3개 모두 선명히 보이도록 수명(life)과 스폰 간격 최적화
  const zzzConfigs = [
    { text: "z", size: 12, spawnT: 0.05, life: 0.95, dx: 10, dy: -18, swayFreq: 2.2, phase: 0.0 },
    { text: "z", size: 17, spawnT: 0.16, life: 0.84, dx: 23, dy: -36, swayFreq: 2.0, phase: 0.8 },
    { text: "Z", size: 23, spawnT: 0.28, life: 0.72, dx: 38, dy: -56, swayFreq: 1.8, phase: 1.6 },
  ];

  for (let i = 0; i < zzzConfigs.length; i++) {
    const cfg = zzzConfigs[i];
    if (progress < cfg.spawnT || progress > cfg.spawnT + cfg.life) continue;
    const t = (progress - cfg.spawnT) / cfg.life;

    // S자 살랑살랑 부유
    const sway = Math.sin((t * cfg.swayFreq + cfg.phase) * Math.PI) * 6;
    const curX = headX + cfg.dx + sway;
    const curY = headY + (cfg.dy * (0.35 + t * 0.65));

    // 페이드인 -> 오래 유지 -> 정점에서 부드럽게 페이드아웃 (3개가 한눈에 동시에 보이도록 유지 구간 확장)
    const alpha = t < 0.15
      ? (t / 0.15)
      : t > 0.75
      ? Math.max(0, (1.0 - t) / 0.25)
      : 1.0;

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
    ctx.font = `bold ${Math.round(cfg.size)}px DungGeunMo, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 짙은 남색 외곽선으로 또렷하게 강조
    ctx.strokeStyle = "rgba(15, 23, 42, 0.85)";
    ctx.lineWidth = 3.2;
    ctx.strokeText(cfg.text, curX, curY);

    ctx.fillStyle = "#BAE6FD"; // 부드러운 수면 파스텔 하늘색
    ctx.fillText(cfg.text, curX, curY);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 047: 노래하기 (Sing)
 * 
 * Concept (유연하고 부드러운 몽환적 연출):
 * - 서서히 배경이 반투명 연분홍빛 20% 물듦 (광범위 채우기)
 * - 4개의 검정색 플랫 음표(♪ ♫ ♪ ♫)가 살아있는 진행파(Traveling Wave)를 타며 일렬로 살랑살랑 유영
 * - 각 음표가 파동에 맞추어 유연하게 갸우뚱(Tilt)거리며 비행
 * - 대상 몸체에 닿으면 뚝 끊기거나 멈추지 않고, 중심점으로 감속(Ease-out)하며 스르륵 스며들어 체내로 자연 흡수
 * - 스며들 때마다 부드러운 수면 리플 파동이 방사형으로 퍼짐
 * - 대상 포켓몬이 서서히 긴장을 풀며 나른하게 잠듦 (3개의 Zzz 동시 선명 표출)
 */
export function drawSingEffect(
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

  // 시전자와 대상 중심 좌표
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);

  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  ctx.save();

  // 1. 배경 반투명 연분홍빛 오버레이 (광범위 좌표로 화면 100% 빈틈없이 커버)
  const pinkAlpha = frame.pinkAlpha ?? (
    step <= 2 ? 0.08 :
    step <= 5 ? 0.16 :
    step <= 14 ? 0.20 :
    step === 15 ? 0.12 : 0
  );
  drawPinkBackgroundOverlay(ctx, pinkAlpha);

  // 2. 일렬로 흔들거리며 이동하는 4개의 멜로디 음표 (♪ ♫ ♪ ♫ 단일 대열)
  const notesConfig = [
    { type: "single" as const, baseScale: 1.10, baseRot: -0.10, phaseOffset: 0.0 }, // 선두 음표 (♪)
    { type: "double" as const, baseScale: 1.00, baseRot: 0.08, phaseOffset: 0.7 },  // 두 번째 음표 (♫)
    { type: "single" as const, baseScale: 0.94, baseRot: -0.06, phaseOffset: 1.4 }, // 세 번째 음표 (♪)
    { type: "double" as const, baseScale: 0.88, baseRot: 0.12, phaseOffset: 2.1 },  // 꼬리 음표 (♫)
  ];

  // leaderT: 선두 음표의 진행도 (0.0: 시전자 ~ 1.0: 대상 중심 ~ 1.5+: 완전 흡수)
  const leaderT = frame.leaderT ?? (
    step === 1 ? 0.16 :
    step === 2 ? 0.30 :
    step === 3 ? 0.44 :
    step === 4 ? 0.58 :
    step === 5 ? 0.72 :
    step === 6 ? 0.86 :
    step === 7 ? 1.00 :
    step === 8 ? 1.14 :
    step === 9 ? 1.28 :
    step === 10 ? 1.44 : 2.0
  );

  const ripples: Array<{ cx: number; cy: number; radius: number; alpha: number }> = [];

  if (leaderT < 1.70) {
    const dx = tx - ax;
    const dy = ty - ay;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const nx = -dy / dist;
    const ny = dx / dist;

    const noteSpacing = 0.14; // 자연스러운 일렬 간격

    for (let i = 0; i < notesConfig.length; i++) {
      const cfg = notesConfig[i];
      const noteT = leaderT - i * noteSpacing;
      if (noteT <= 0 || noteT >= 1.35) continue; // 출발 전이거나 완전히 흡수 완료됨

      if (noteT < 0.90) {
        // [비행 중: 살아있는 진행파(Traveling Wave)를 타고 부드럽게 유영]
        // 시간(leaderT)과 공간(noteT)이 결합된 유연한 파동
        const wavePhase = (noteT * 2.6 - leaderT * 1.1) * Math.PI * 2 + cfg.phaseOffset * 0.3;
        
        // 대상에 가까워질수록 흔들림이 0으로 부드럽게 수렴하여 중심으로 유도
        const enterDamp = Math.min(1.0, noteT / 0.14);
        const exitDamp = noteT > 0.65 ? Math.max(0, (0.90 - noteT) / 0.25) : 1.0;
        const damp = enterDamp * exitDamp;

        // 주 파동 + 부 파동(풍부한 유기적 곡선)
        const wave = Math.sin(wavePhase) * (17 * damp);
        const subWave = Math.sin(wavePhase * 2.0) * (3.5 * damp);
        const totalWave = wave + subWave;

        const cx = ax + dx * noteT + nx * totalWave;
        const cy = ay + dy * noteT + ny * totalWave;

        // 파동의 기울기에 맞추어 음표 머리가 살랑살랑 갸우뚱(Tilt)
        const tilt = Math.cos(wavePhase) * (0.24 * damp);
        const rotation = cfg.baseRot + tilt;

        const alpha = Math.min(1.0, enterDamp);

        if (cfg.type === "single") {
          drawSingleMusicNoteSvg(ctx, cx, cy, cfg.baseScale, rotation, alpha);
        } else {
          drawDoubleMusicNoteSvg(ctx, cx, cy, cfg.baseScale, rotation, alpha);
        }
      } else {
        // [서서히 스미는 구간: 대상의 표면에서 중심점으로 감속하며 체내로 스며들어 흡수]
        const seepT = (noteT - 0.90) / 0.40; // 0.0 ~ 1.0
        
        // 대상 진입점(0.90 위치)에서 중심점(tx, ty)으로의 부드러운 감속 이동 (Cubic Ease-Out)
        const startX = ax + dx * 0.90;
        const startY = ay + dy * 0.90;
        const ease = 1.0 - Math.pow(1.0 - seepT, 2.0);

        const cx = startX + (tx - startX) * ease;
        const cy = startY + (ty - startY) * ease;

        // 스케일 축소 및 페이드아웃 (스르륵 스며듦)
        const scale = Math.max(0.01, cfg.baseScale * (1.0 - Math.pow(seepT, 1.2) * 0.85));
        const alpha = Math.max(0, 1.0 - Math.pow(seepT, 1.1));

        // 흡수되면서 각도가 완만하게 0으로 정돈
        const rotation = cfg.baseRot * (1.0 - seepT);

        if (cfg.type === "single") {
          drawSingleMusicNoteSvg(ctx, cx, cy, scale, rotation, alpha);
        } else {
          drawDoubleMusicNoteSvg(ctx, cx, cy, scale, rotation, alpha);
        }

        // 음표가 체내로 스며들 때 중심부에서 퍼져나가는 부드러운 수면 리플 파동
        if (seepT > 0.10 && seepT < 0.90) {
          const rT = (seepT - 0.10) / 0.80; // 0.0 ~ 1.0
          const rRadius = 8 + rT * 26;
          const rAlpha = (1.0 - rT) * 0.22;
          ripples.push({ cx: tx, cy: ty, radius: rRadius, alpha: rAlpha });
        }
      }
    }

    // 동적 확장 수면 리플 렌더링
    for (const r of ripples) {
      ctx.save();
      ctx.strokeStyle = `rgba(0, 0, 0, ${r.alpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(r.cx, r.cy, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 3. 잠듦 상태 (3개의 Zzz 수면 연출)
  if (frame.sleepProgress !== undefined || step >= 11) {
    const sleepProgress = frame.sleepProgress ?? (
      step === 11 ? 0.25 :
      step === 12 ? 0.45 :
      step === 13 ? 0.65 :
      step === 14 ? 0.80 :
      step === 15 ? 0.95 : 1.0
    );
    const headX = tx - (isP ? 10 : 8);
    const headY = ty - (isP ? 35 : 28);
    drawSleepZzzEffect(ctx, headX, headY, sleepProgress);
  }

  ctx.restore();
}

/**
 * 048: 초음파 (Supersonic)
 * 
 * User Concept:
 * - 발사되는 건 동그란 링 (원형 링, 3D 타원 왜곡 없음)
 * - 발사될 때 투명하다가 전진하면서 반투명해지며, 색상은 기존 음파 링(주황/선홍빛) 유지
 * - 3개의 초음파 링이 적에게 차곡차곡 쌓임 (적의 몸체를 감싸는 3중 링 적재)
 * - 다 쌓이면 울음소리 때 봤던 중간이 투명한 원 (대신 여기서는 노란색)이 바깥으로 거대하게 퍼짐
 * - 이후 혼란 상태로 만듦 (머리 위 3D 궤도 회전 별무리 + 좌우 비틀거림)
 */

/**
 * Helper: 3차원처럼 보이는 둥근 초음파 링 (3D Ultrasonic Ring)
 * - 비행 진행 축(mainAngle)에 직교하는 3D 타원 원반(depthRatio: 0.52, 1.06)으로 원근 틸트
 * - 발사 시점에는 투명(alpha 0.15~0.20), 전진하면서 선명한 반투명(alpha 0.70~0.85)
 * - 색상: 밝고 선명한 일렉트릭 황금 옐로우 (Electric Ultrasonic Yellow)
 */
export function draw3DSupersonicRing(
  ctx: any,
  cx: number,
  cy: number,
  mainAngle: number,
  radius: number,
  alpha: number = 1.0,
  depthRatio: number = 0.52,
  lineWidth: number = 3.0
) {
  if (radius <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(mainAngle); // 비행 진행 축 방향
  ctx.scale(depthRatio, 1.06); // 진행 축 직교 3D 원근 타원 압축
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 외곽 은은한 노란빛 3D 오라 링
  ctx.strokeStyle = "rgba(250, 204, 21, 0.40)";
  ctx.lineWidth = lineWidth * 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 선명한 황금 옐로우 메인 3D 링
  ctx.strokeStyle = "rgba(234, 179, 8, 0.95)";
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 중심부 순백/밝은 레몬빛 하이라이트 코어 선
  ctx.strokeStyle = "rgba(254, 249, 195, 0.90)";
  ctx.lineWidth = Math.max(1, lineWidth * 0.45);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper: 2차원 둥근 초음파 링 (2D Ultrasonic Ring)
 * - 대상에게 쌓일 때 왜곡 없이 그려지는 완전한 2차원 정원(Round Circle)
 * - 선명한 황금 옐로우 오라 및 코어 하이라이트
 */
export function draw2DSupersonicRing(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0,
  lineWidth: number = 3.0
) {
  if (radius <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 외곽 은은한 노란빛 오라 링
  ctx.strokeStyle = "rgba(250, 204, 21, 0.40)";
  ctx.lineWidth = lineWidth * 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 선명한 황금 옐로우 메인 원형 링
  ctx.strokeStyle = "rgba(234, 179, 8, 0.95)";
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 중심부 순백/밝은 레몬빛 하이라이트 코어 선
  ctx.strokeStyle = "rgba(254, 249, 195, 0.90)";
  ctx.lineWidth = Math.max(1, lineWidth * 0.45);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper: 중심부가 투명하고 외곽이 선명한 노란색 확산 원 렌더러
 * - 울음소리(drawOrangeCircle)의 노란색(Yellow) 변형 버전
 * - 중심부(r <= 38%)는 100% 완전 투명하여 피격 포켓몬의 모습이 온전히 보임
 * - 외곽으로 갈수록 선명한 황금빛 노란색(Yellow)으로 짙어지며 바깥쪽으로 시원하게 확산
 */
export function drawYellowHollowCircle(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0
) {
  if (radius <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, "rgba(250, 204, 21, 0)");        // 중심부: 100% 완전 투명
  grad.addColorStop(0.38, "rgba(250, 204, 21, 0)");     // 안쪽 투명 영역 유지
  grad.addColorStop(0.68, "rgba(254, 240, 138, 0.32)"); // 은은한 레몬빛 점진적 전개
  grad.addColorStop(0.88, "rgba(250, 204, 21, 0.65)");  // 선명한 황금빛 노랑 몸체부
  grad.addColorStop(1.0, "rgba(234, 179, 8, 0.88)");    // 외곽 가장자리: 강렬하고 짙은 옐로우
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper: 5각 별(5-pointed Star) 벡터 렌더러
 */
function drawFivePointStar(
  ctx: any,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  rotation: number = 0,
  fillColor: string = "#FACC15",
  strokeColor: string = "rgba(161, 98, 7, 0.85)"
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.beginPath();

  const points = 5;
  const step = Math.PI / points;

  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Helper: 대상 머리 위를 3D 타원 궤도로 빙글빙글 공전하는 공용 혼란(Confusion) 별무리 연출
 * - 3개의 노란빛 별(★ ★ ★)이 포켓몬 머리 위를 기울어진 타원 궤도를 따라 어지럽게 회전
 * - 앞쪽(근경)은 크고 선명하게(scale 1.15, alpha 1.0), 뒤쪽(원경)은 작고 반투명하게(scale 0.80, alpha 0.55) 3D 깊이 오버랩
 */
export function drawConfusionEffect(
  ctx: any,
  headX: number,
  headY: number,
  progress: number // 0.0 ~ 1.2
) {
  if (progress <= 0 || progress > 1.25) return;
  ctx.save();

  // 타원 궤도 파라미터 (가로 28px, 세로 11px 입체 타원)
  const orbitRx = 28;
  const orbitRy = 11;

  // 회전 속도 (progress 진행에 따라 약 2바퀴 회전)
  const baseAngle = progress * Math.PI * 4.2;

  // 전체 페이드인 -> 유지 -> 페이드아웃
  const globalAlpha = progress < 0.15
    ? (progress / 0.15)
    : progress > 0.85
    ? Math.max(0, (1.15 - progress) / 0.30)
    : 1.0;

  // 3개의 별 (120도 간격)
  const stars = [0, 1, 2].map((i) => {
    const phi = baseAngle + (i * Math.PI * 2) / 3;
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);

    // 타원 궤도상 좌표
    const sx = headX + cosP * orbitRx;
    const sy = headY + sinP * orbitRy;

    // 3D 깊이: sinP가 양수이면 앞쪽(근경, 하단), 음수이면 뒤쪽(원경, 상단)
    const depth = (sinP + 1.0) / 2.0; // 0.0(뒤쪽) ~ 1.0(앞쪽)
    const scale = 0.80 + depth * 0.40; // 0.80 ~ 1.20
    const starAlpha = (0.50 + depth * 0.50) * globalAlpha;
    const spinRot = phi * 1.5; // 자체 자전

    return { sx, sy, scale, starAlpha, spinRot, sinP };
  });

  // 뒤쪽 별부터 앞쪽 별 순서로 정렬 (Painter's algorithm)
  stars.sort((a, b) => a.sy - b.sy);

  for (const s of stars) {
    if (s.starAlpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = Math.min(1.0, Math.max(0, s.starAlpha));
    
    // 외곽 은은한 노란빛 잔상/스파크
    ctx.save();
    ctx.fillStyle = "rgba(253, 224, 71, 0.40)";
    ctx.beginPath();
    ctx.arc(s.sx, s.sy, 6 * s.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5각 별 렌더링
    drawFivePointStar(ctx, s.sx, s.sy, 8 * s.scale, 3.8 * s.scale, s.spinRot, "#FDE047", "rgba(161, 98, 7, 0.85)");
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 048: 초음파 (Supersonic) 종합 이펙트 렌더러
 * - 3차원처럼 보이는 둥근 같은 크기(radius: 36px)의 노란색 링 6개 사출
 * - 발사 시 투명(0.15) ➔ 전진하면서 선명한 반투명(0.85)
 * - 대상에 도달 시 사라지지 않고 차곡차곡 쌓여 3D 음파 원통 케이지 형성 및 공명
 * - 이후 중심 투명 노란색 원 확산(최대 88px) ➔ 혼란(Confusion) 3D 별무리 공전
 */
export function drawSupersonicEffect(
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

  // 시전자 및 대상 중심 좌표
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);

  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  ctx.save();

  // 비행 진행 방향 축 각도
  const mainAngle = Math.atan2(ty - ay, tx - ax);
  const cosM = Math.cos(mainAngle);
  const sinM = Math.sin(mainAngle);

  // 1. 발사되는 3D 링(25px) 및 적에게 도착하여 안쪽(작은 원)에서 바깥쪽(큰 원)으로 커지며 쌓이는 2D 동심원 링
  // 6개의 링: 발사 시 반경 25px, 도착 후 안쪽(15px) -> 바깥쪽(40px)으로 5px 간격 6중 동심원 적재
  const RING_COUNT = 6;
  const FLYING_RADIUS = 25; // 유저 요청: 발사되는 링 25px
  const RING_SPACING = 0.11; // 링 간 시차

  const leaderT = frame.leaderT ?? ((step - 1) * 0.18 + 0.16);

  // 링들은 노란색 충격파 폭발 전까지 표시
  if (step <= 9 || (frame.yellowBurstR === undefined && step < 10)) {
    const dx = tx - ax;
    const dy = ty - ay;

    const activeRings: Array<{
      cx: number;
      cy: number;
      radius: number;
      alpha: number;
      isStacked: boolean;
      depthRatio: number;
      angle: number;
    }> = [];

    for (let i = 0; i < RING_COUNT; i++) {
      const ringT = leaderT - i * RING_SPACING;
      if (ringT <= 0) continue; // 아직 발사 전

      // 도착 후 각 링의 동심원 반경: 안쪽 작은 원(15px)에서 바깥쪽 큰 원(40px)으로 5px 간격 확장
      const targetStackedR = 15 + i * 5; // i=0: 15px, i=1: 20px, i=2: 25px, i=3: 30px, i=4: 35px, i=5: 40px

      if (ringT < 1.0) {
        // [비행 중]: 3차원 원근 틸트(depthRatio: 0.52)를 유지하며 25px 크기로 시전자에서 대상을 향해 비행
        // 발사 시점 투명(0.15) -> 전진하면서 선명한 반투명(0.85)
        const curAlpha = 0.15 + ringT * 0.70; // 0.15 ~ 0.85
        const curX = ax + dx * ringT;
        const curY = ay + dy * ringT;

        // 적에게 도달 직전(0.85~1.0) 부드럽게 2D 원형으로 개방 & 해당 링의 동심원 크기로 안착 전환
        const morph = ringT >= 0.85 ? (ringT - 0.85) / 0.15 : 0;
        const depthRatio = 0.52 + (1.0 - 0.52) * morph;
        const angle = mainAngle * (1.0 - morph);
        const curR = FLYING_RADIUS + (targetStackedR - FLYING_RADIUS) * morph;

        activeRings.push({
          cx: curX,
          cy: curY,
          radius: curR,
          alpha: curAlpha,
          isStacked: false,
          depthRatio,
          angle,
        });
      } else {
        // [적에게 도착하여 중첩]: 안쪽 작은 원에서 바깥쪽으로 커지는 2차원 동심원 링으로 차곡차곡 적재
        const pulse = Math.sin((leaderT * 12 + i * 1.2) * Math.PI) * 0.8;
        const curX = tx;
        const curY = ty;
        const curR = targetStackedR + pulse;
        const curAlpha = 0.85;

        activeRings.push({
          cx: curX,
          cy: curY,
          radius: curR,
          alpha: curAlpha,
          isStacked: true,
          depthRatio: 1.0,
          angle: 0,
        });
      }
    }

    // 적재된 링은 바깥 큰 원을 먼저 그리고 안쪽 작은 원을 위에 그려 선명도 극대화
    activeRings.sort((a, b) => {
      if (a.isStacked && b.isStacked) {
        return b.radius - a.radius;
      }
      return a.cy - b.cy;
    });

    for (const r of activeRings) {
      if (r.isStacked || r.depthRatio >= 0.98) {
        // 도착한 중첩 링은 왜곡 없는 2차원 둥근 원!
        draw2DSupersonicRing(ctx, r.cx, r.cy, r.radius, r.alpha, 2.6);
      } else {
        // 비행 중인 링은 25px 크기 3차원 원근감 유지
        draw3DSupersonicRing(ctx, r.cx, r.cy, r.angle, r.radius, r.alpha, r.depthRatio, 2.6);
      }
    }
  }

  // 2. 다 쌓인 후: 중간이 투명한 노란색 원의 외곽 확산 폭발!
  if (frame.yellowBurstR !== undefined && frame.yellowBurstR > 0) {
    const burstR = frame.yellowBurstR;
    const burstAlpha = frame.burstAlpha ?? 0.80;
    drawYellowHollowCircle(ctx, tx, ty, burstR, burstAlpha);

    // 중심부에서 튀어나오는 미세 노란 스파크
    if (burstAlpha > 0.4) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + burstR * 0.05;
        const spDist = burstR * 0.75;
        const spX = tx + Math.cos(a) * spDist;
        const spY = ty + Math.sin(a) * spDist;
        ctx.save();
        ctx.fillStyle = "#FEF08A";
        ctx.fillRect(spX - 2, spY - 2, 4, 4);
        ctx.restore();
      }
    }
  }

  // 3. 혼란(Confusion) 상태이상 연출 (머리 위 3D 궤도 회전 별무리)
  if (frame.confusionProgress !== undefined || step >= 11) {
    const confProgress = frame.confusionProgress ?? ((step - 10) / 5.0);
    const headX = tx - (isP ? 10 : 8);
    const headY = ty - (isP ? 42 : 36);
    drawConfusionEffect(ctx, headX, headY, confProgress);
  }

  ctx.restore();
}
