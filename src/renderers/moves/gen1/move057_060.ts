import { Path2D, createCanvas } from "@napi-rs/canvas";

// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 70) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 기술 제작 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

/**
 * Gen 1 Moves 057 - 060 Renderers
 * 
 * 057: 파도타기 (Surf)
 * 058: 냉동빔 (Ice Beam) - [완료]
 * 059: 눈보라 (Blizzard) - [완료]
 * 060: 환상빔 (Psybeam) - [완료]
 */


// ============================================================================
// 057: 파도타기 (Surf) - 공통 동적 스케일 및 오프셋 테이블
// ============================================================================
// [유저 요청 엄수]: "파도 나타나는거 좀 더 커지게 가능>"
// 초기 발생(F0~F3) 크기를 대폭 확대(0.38->0.56)하여 등장부터 웅장하고 위압감 있게 형성
const SURF_SCALES = [0.56, 0.72, 0.88, 1.05, 1.20, 1.29, 1.36, 1.42];
const SURF_ADVANCES = [0, 0, 0, 0, 0, 14, 32, 50];
// [유저 요청 엄수]: "파도 넓이에 맞춰서 시전했던 수증기도 범위 넓어지게"
const SURF_WAVE_WIDTHS = [120, 142, 164, 182, 202, 215, 225, 234];

function drawCleanSurfWave(
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
  const waveFrame = frame.waveFrame ?? (frame.moveStep !== undefined ? frame.moveStep - 1 : undefined);
  if (waveFrame === undefined || waveFrame < 0 || waveFrame > 7) return;

  const isP = drawCtx.isPlayer;
  const casterGround = isP
    ? (drawCtx.pm ?? { x: drawCtx.attackerPos.x, y: drawCtx.attackerPos.y + 36 })
    : (drawCtx.em ?? { x: drawCtx.attackerPos.x, y: drawCtx.attackerPos.y + 36 });
  const targetGround = isP
    ? (drawCtx.em ?? { x: drawCtx.targetPos.x, y: drawCtx.targetPos.y + 36 })
    : (drawCtx.pm ?? { x: drawCtx.targetPos.x, y: drawCtx.targetPos.y + 36 });

  const ax = casterGround.x;
  const ay = casterGround.y;
  const tx = targetGround.x;
  const ty = targetGround.y;

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  const rawNx = -dy;
  const rawNy = dx * 0.46;
  const nLen = Math.hypot(rawNx, rawNy) || 1;
  const nx = rawNx / nLen;
  const ny = rawNy / nLen;

  // 바닥 지면 기준점 (수증기 안쪽으로 밀착 접지)
  const bottomY = ay + 4;
  const dir = isP ? 1 : -1;

  // ==========================================================================
  // [유저 요청 엄수]: "가장 베이스가 될 어두운 파란색으로 형태 먼저잡아봐"
  // - 레퍼런스 실사 이미지(media_1788720816699.png)의 파도 구조/실루엣 정확히 반영:
  //   1. 좌측 등성이: 좌측 바닥(backG)에서 볼록하게 솟구쳐 오르는 파도 벽
  //   2. 상단 크레스트: 좌측 35% 지점에서 최고점을 찍고 완만한 돔 아치
  //   3. 우측 립: 우측으로 앞으로 뻗은 후 안쪽(좌하단)으로 둥글게 감겨 내려오는 C-컬 립
  //   4. 동굴/공동: 립 아래쪽으로 오목하게 깊게 파고들어가는 배럴 내부
  //   5. 우측 바닥 자락: 동굴 아래에서 우측 바닥으로 낮고 완만하게 길게 깔리는 파도 자락
  //   6. 색상: 가장 베이스가 될 깊은 어두운 파란색(#0b3b60) 단일 실루엣
  // ==========================================================================

  // 각 프레임별 스케일 및 진행도 (F0: 나타남 ~ F4: 기준 거대 파도 ~ F7: 전진 낙하)
  const s = SURF_SCALES[Math.min(waveFrame, SURF_SCALES.length - 1)];
  const advX = dir * SURF_ADVANCES[Math.min(waveFrame, SURF_ADVANCES.length - 1)];

  // 기준 파도 크기 (유저 지정 빨간 펜 실측 비율 반영: H=180 기준)
  const H = 180 * s;

  const backG       = { x: ax - dir * (H * 0.55) + advX, y: bottomY };
  const crestApex   = { x: ax - dir * (H * 0.05) + advX, y: bottomY - H * 0.99 };
  const lipShoulder = { x: ax + dir * (H * 0.55) + advX, y: bottomY - H * 0.92 };
  const lipTip      = { x: ax + dir * (H * 0.93) + advX, y: bottomY - H * 0.47 };
  const tubeCeiling = { x: ax + dir * (H * 0.62) + advX, y: bottomY - H * 0.52 };
  const frontG      = { x: ax + dir * (H * 0.48) + advX, y: bottomY };

  ctx.save();


  // 1. 외곽선 경로 생성 (유저 빨간 펜 지정 비율 100% 일치 실사형 C-컬 파도)
  ctx.beginPath();
  ctx.moveTo(backG.x, backG.y);

  // 1) 좌측 등성이 (Back Wall): 바닥에서 솟구쳐 파도 벽을 형성하며 정점으로 상승
  ctx.bezierCurveTo(
    ax - dir * (H * 0.78) + advX, bottomY - H * 0.25,
    ax - dir * (H * 0.68) + advX, bottomY - H * 0.75,
    crestApex.x, crestApex.y
  );

  // 2) 상단 크레스트 능선: 정점에서 우측 전방으로 완만한 호를 그리며 뻗어나감
  ctx.bezierCurveTo(
    ax + dir * (H * 0.18) + advX, bottomY - H * 1.01,
    ax + dir * (H * 0.38) + advX, bottomY - H * 0.98,
    lipShoulder.x, lipShoulder.y
  );

  // 3) 우측 립: 앞으로 뻗으며 아래로 둥글게 말려 떨어지는 C-컬 립 (부리 형태 배제, 자연스러운 쇄파 머리)
  ctx.bezierCurveTo(
    ax + dir * (H * 0.78) + advX, bottomY - H * 0.82,
    ax + dir * (H * 0.96) + advX, bottomY - H * 0.65,
    lipTip.x, lipTip.y
  );

  // 4) 립 내측 컬링: 안쪽으로 둥글게 말려 들어가는 배럴 튜브 천장 (둥근 C자 튜브 굴곡)
  ctx.bezierCurveTo(
    ax + dir * (H * 0.88) + advX, bottomY - H * 0.38,
    ax + dir * (H * 0.75) + advX, bottomY - H * 0.44,
    tubeCeiling.x, tubeCeiling.y
  );

  // 5) 배럴 공동 하강부: 튜브 천장에서 지면으로 부드럽게 낙하
  ctx.bezierCurveTo(
    ax + dir * (H * 0.48) + advX, bottomY - H * 0.55,
    ax + dir * (H * 0.40) + advX, bottomY - H * 0.22,
    frontG.x, frontG.y
  );

  // 6) 바닥 수평선 접지: 우측 접지면에서 좌측 접지면으로 수평 밀착
  ctx.lineTo(backG.x, backG.y);
  ctx.closePath();

  // [유저 요청 엄수]: "올라오는 파도 색깔이 좀더 푸르렀으면 좋겠어" + "밝은 처리 했던 부분 좀 더 푸른빛으로 해줘봐"
  // - 탁하고 어두운 단색(#0a3c68) 및 연한 하늘색(#258cfb) 대신 선명하고 깊은 로열 코발트 블루 그라데이션 적용
  const baseWaveGrad = ctx.createLinearGradient(0, bottomY - H * 1.05, 0, bottomY);
  baseWaveGrad.addColorStop(0.00, "#0b68e8"); // 상단 선명하고 짙은 푸른빛 로열 코발트 블루 (하늘빛/물빠진 느낌 제거)
  baseWaveGrad.addColorStop(0.22, "#0d61db"); // 상중단 선명하고 맑은 로열 오션 블루
  baseWaveGrad.addColorStop(0.50, "#0a50ae"); // 중단 깊고 푸른 사파이어 블루
  baseWaveGrad.addColorStop(0.80, "#083c88"); // 하단 푸른빛이 풍부한 딥 마린 블루
  baseWaveGrad.addColorStop(1.00, "#072f6a"); // 지면 접지 네이비 (검은색이 아닌 짙은 푸른색 유지)
  ctx.fillStyle = baseWaveGrad;
  ctx.fill();

  // 2. 파도 내부 레이어 클리핑
  ctx.save();
  ctx.clip();

  // 2-1. [유저 요청 엄수]: 상단 크레스트 쉐이딩 - 수증기풀화면 이후 파도색(#187be7) 적용
  drawWaveUpperCrestShading(ctx, ax, bottomY, H, dir, advX, waveFrame);

  // 2-2. [유저 요청 엄수]: 파도 배럴 공동 쉐도우 쉐이딩 (#03172b)
  drawWaveBarrelShadow(ctx, ax, bottomY, H, dir, advX);

  // 2-3. [유저 요청 엄수]: "고리게 퍼진형태 아...ㅋㅋㅋ 그리고 좀 파도처럼 자연스럽게" - 상단 크레스트 수증기
  drawWaveCrestSteam(ctx, ax, bottomY, H, dir, advX, waveFrame);

  // 2-4. [유저 요청 엄수]: "파도의 끝 방향으로 향하는 선같은거 (반투명하고 외각은 흐려지는 선들) (마치 물줄기의 이동처럼) 추가해봐"
  drawWaveWaterStreamlines(ctx, ax, bottomY, H, dir, advX, waveFrame);

  // 2-5. [유저 요청 엄수]: "위치가 문제인듯 파도 형상을 벗어나지 않게 해봐"
  // 파도 외곽선 클리핑(ctx.clip) 내부에서만 렌더링되어 파도 형상을 절대 벗어나지 않음
  drawWaveBodySteam(ctx, ax, bottomY, H, dir, advX, waveFrame);

  ctx.restore();

  ctx.restore();
}

/**
 * [유저 요청 엄수]: "파도 자체에서도 수증기 나오게 해줘"
 * - 1. Crest Blowback Plumes: 상단 크레스트 능선 위로 뿜어져 피어오르고 바람에 뒤쪽으로 흩날리는 유기적 수증기
 * - 2. Back-Wall Shroud: 거대한 파도 뒤쪽 경사면을 따라 몽환적으로 피어오르는 연무
 * - 3. Wave Face Rising Mist: 파도의 푸른 수면을 타고 일렁이며 피어오르는 부드러운 반투명 증기 레이어
 * - 4. Dissolving Spume Wisps: 상공으로 비산하며 자연스럽게 녹아 사라지는 수무 조각들
 */
function drawWaveBodySteam(
  ctx: any,
  ax: number,
  bottomY: number,
  H: number,
  dir: number,
  advX: number = 0,
  waveFrame: number = 4
) {
  if (H < 40) return;

  // 파도 크기와 역동성에 비례하여 수증기 분출량 증가 (초기 파도 확대에 맞춰 상향 보정)
  const INTENSITIES = [0.28, 0.48, 0.68, 0.85, 1.00, 0.95, 0.88, 0.78];
  const intensity = INTENSITIES[Math.min(waveFrame, INTENSITIES.length - 1)] ?? 1.0;
  if (intensity <= 0.05) return;

  const scale = H / 180;
  ctx.save();

  // A. [상단 크레스트 능선 분출 수증기 - Organic Volumetric Crest Billow Clusters]
  // [유저 요청 엄수]: "간격이 너무 일정하다 이거 좀 수정해줘"
  // - 기존의 등간격 7개 원형 점(nx: -0.48 ~ +0.52, Δ=0.16) 배치 완전 제거!
  // - 불규칙하고 역동적인 군집(Cluster) 구조 + 크기 대/중/소 비대칭 배분 + 부드러운 다단계 볼륨 그라데이션
  // - 1단계: 크레스트 능선을 감싸는 부드러운 기저 연무대 (Connecting Atmospheric Veil)로 점 형태 단절 방지
  // - 2단계: 뒤쪽 바람에 날리는 깃털형 꼬리(Trailing Feather) -> 좌중간 융기 -> 정점 초대형 뭉게구름(Apex Mega Cauliflower) -> 전방 숄더 롤
  // - 중심부 과도한 백색 점 방지: 코어 불투명도 0.65 및 완만한 가우스형 방사 감쇄(0.35 -> 0.68 -> 0.90)

  // 1. 기저 연무대: 능선 전체를 포근히 이어주는 2개의 광범위 소프트 베일
  const CREST_VEILS = [
    { nx: -0.36, ny: 0.94, rx: 70, ry: 26, rot: -0.22, op: 0.30 },
    { nx:  0.14, ny: 1.02, rx: 80, ry: 30, rot:  0.12, op: 0.32 },
  ];
  for (let i = 0; i < CREST_VEILS.length; i++) {
    const cv = CREST_VEILS[i];
    const px = ax + dir * (H * cv.nx) + advX;
    const py = bottomY - H * cv.ny;
    const rx = cv.rx * scale;
    const ry = cv.ry * scale;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(dir * cv.rot);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${cv.op * intensity})`);
    grad.addColorStop(0.45, `rgba(240, 250, 255, ${cv.op * 0.60 * intensity})`);
    grad.addColorStop(0.80, `rgba(224, 242, 254, ${cv.op * 0.18 * intensity})`);
    grad.addColorStop(1.00, "rgba(224, 242, 254, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. 비대칭 유기적 빌로우 군집 (Irregular Volumetric Billow Clusters)
  const CREST_CLUSTERS = [
    // [군집 1]: 후방 바람에 쓸리는 비산 꼬리 (뒤로 길게 늘어지며 비산)
    { nx: -0.52, ny: 0.84, rx: 44, ry: 18, rot: -0.45, driftX: -16, driftY: -10, op: 0.44 },
    { nx: -0.42, ny: 0.92, rx: 28, ry: 20, rot: -0.32, driftX: -10, driftY: -14, op: 0.48 },

    // [간격 크게 건너뜀: -0.42 -> -0.22 (0.20 점프! 등간격 배제)]
    // [군집 2]: 좌중간 융기 덩어리
    { nx: -0.22, ny: 1.02, rx: 46, ry: 28, rot: -0.15, driftX: -6, driftY: -18, op: 0.58 },

    // [간격 건너뜀: -0.22 -> -0.04 (0.18 점프)]
    // [군집 3]: 파도 정점 초대형 뭉게구름 군집 (Apex Heavy Cauliflower)
    // 중심 대형 빌로우 + 전방 겹침 빌로우 + 상향 분출 증기 3중 결합으로 유기적 덩어리감 형성
    { nx: -0.04, ny: 1.08, rx: 56, ry: 36, rot:  0.02, driftX: -3, driftY: -22, op: 0.64 },
    { nx:  0.08, ny: 1.06, rx: 48, ry: 32, rot:  0.12, driftX:  2, driftY: -18, op: 0.60 },
    { nx:  0.02, ny: 1.18, rx: 32, ry: 20, rot:  0.06, driftX: -1, driftY: -26, op: 0.42 },

    // [간격 크게 건너뜀: +0.08 -> +0.36 (0.28 대형 점프! 등간격 완전 탈피)]
    // [군집 4]: 전방 숄더/립 방향 쇄파 연무
    { nx:  0.36, ny: 0.96, rx: 42, ry: 26, rot:  0.28, driftX:  4, driftY: -14, op: 0.52 },
    { nx:  0.50, ny: 0.84, rx: 30, ry: 20, rot:  0.40, driftX:  8, driftY:  -8, op: 0.44 },
  ];

  for (let i = 0; i < CREST_CLUSTERS.length; i++) {
    const cp = CREST_CLUSTERS[i];
    const undulX = Math.sin(waveFrame * 1.5 + i * 1.3) * 5 * scale;
    const undulY = Math.cos(waveFrame * 1.3 + i * 0.9) * 4 * scale;

    const px = ax + dir * (H * cp.nx + (cp.driftX * scale)) + advX + undulX;
    const py = bottomY - H * cp.ny + (cp.driftY * scale) + undulY;
    const rx = cp.rx * scale;
    const ry = cp.ry * scale;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(dir * cp.rot);

    const maxR = Math.max(rx, ry);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${cp.op * 0.65 * intensity})`);
    grad.addColorStop(0.35, `rgba(252, 254, 255, ${cp.op * 0.48 * intensity})`);
    grad.addColorStop(0.68, `rgba(235, 246, 255, ${cp.op * 0.22 * intensity})`);
    grad.addColorStop(0.90, `rgba(224, 242, 254, ${cp.op * 0.06 * intensity})`);
    grad.addColorStop(1.00, "rgba(224, 242, 254, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // B. [파도 후벽 및 외곽 수증기 - Back Wall Shroud]
  const WALL_SHROUD = [
    { nx: -0.65, ny: 0.30, rx: 30, ry: 24, rot: 0.40, op: 0.45 },
    { nx: -0.58, ny: 0.50, rx: 34, ry: 26, rot: 0.35, op: 0.50 },
    { nx: -0.50, ny: 0.68, rx: 36, ry: 28, rot: 0.30, op: 0.55 },
    { nx: -0.38, ny: 0.82, rx: 34, ry: 26, rot: 0.20, op: 0.52 },
  ];

  for (let i = 0; i < WALL_SHROUD.length; i++) {
    const ws = WALL_SHROUD[i];
    const px = ax + dir * (H * ws.nx) + advX;
    const py = bottomY - H * ws.ny;
    const rx = ws.rx * scale;
    const ry = ws.ry * scale;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(dir * ws.rot);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${ws.op * intensity})`);
    grad.addColorStop(0.40, `rgba(240, 249, 255, ${ws.op * 0.75 * intensity})`);
    grad.addColorStop(0.78, `rgba(224, 242, 254, ${ws.op * 0.28 * intensity})`);
    grad.addColorStop(1.00, "rgba(224, 242, 254, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // C. [파도 앞면 수면 증기 - Wave Face Rising Mist]
  const FACE_MIST = [
    { nx: -0.25, ny: 0.42, rx: 38, ry: 24, rot: -0.15, op: 0.36 },
    { nx: -0.08, ny: 0.56, rx: 42, ry: 26, rot: -0.08, op: 0.40 },
    { nx:  0.10, ny: 0.66, rx: 44, ry: 28, rot:  0.08, op: 0.42 },
    { nx:  0.28, ny: 0.72, rx: 40, ry: 26, rot:  0.18, op: 0.40 },
    { nx:  0.42, ny: 0.62, rx: 36, ry: 24, rot:  0.28, op: 0.36 },
    { nx:  0.16, ny: 0.44, rx: 38, ry: 24, rot:  0.00, op: 0.34 },
  ];

  for (let i = 0; i < FACE_MIST.length; i++) {
    const fm = FACE_MIST[i];
    const px = ax + dir * (H * fm.nx) + advX;
    const py = bottomY - H * fm.ny;
    const rx = fm.rx * scale;
    const ry = fm.ry * scale;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(dir * fm.rot);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${fm.op * intensity})`);
    grad.addColorStop(0.48, `rgba(240, 250, 255, ${fm.op * 0.60 * intensity})`);
    grad.addColorStop(0.82, `rgba(224, 242, 254, ${fm.op * 0.20 * intensity})`);
    grad.addColorStop(1.00, "rgba(224, 242, 254, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // D. [상공으로 비산하는 흩날림 연무 - Dissolving Spume Wisps]
  // [유저 요청 엄수]: "간격이 너무 일정하다 이거 좀 수정해줘" - 비대칭 및 불규칙 비산
  if (waveFrame >= 2) {
    const SPUME_WISPS = [
      { nx: -0.46, ny: 1.15, rx: 30, ry: 9,  rot: -0.50, op: 0.36 },
      { nx: -0.14, ny: 1.25, rx: 24, ry: 13, rot: -0.15, op: 0.40 },
      { nx:  0.06, ny: 1.28, rx: 28, ry: 11, rot:  0.10, op: 0.42 },
      { nx:  0.34, ny: 1.14, rx: 22, ry: 8,  rot:  0.40, op: 0.34 },
    ];

    for (let i = 0; i < SPUME_WISPS.length; i++) {
      const sw = SPUME_WISPS[i];
      const px = ax + dir * (H * sw.nx) + advX;
      const py = bottomY - H * sw.ny;
      const rx = sw.rx * scale;
      const ry = sw.ry * scale;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(dir * sw.rot);

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
      grad.addColorStop(0.00, `rgba(255, 255, 255, ${sw.op * 0.58 * intensity})`);
      grad.addColorStop(0.40, `rgba(245, 252, 255, ${sw.op * 0.36 * intensity})`);
      grad.addColorStop(0.80, `rgba(224, 242, 254, ${sw.op * 0.12 * intensity})`);
      grad.addColorStop(1.00, "rgba(224, 242, 254, 0.0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * [유저 요청 엄수]: 프레임 4번 기준 상단 크레스트 쉐이딩 (Wave Upper Crest Shading)
 * - [유저 요청 엄수]: "그 밝은 영역이 파도가 커질수록 위로 커지게 (단 파도를 넘어가지는 않게)"
 * - 파도가 커질수록(F0 -> F4 -> F7) 상단 능선이 위로 확장되어 거대 파도의 상단부를 풍부하게 채움
 * - Math.min 및 외곽선 클리핑(ctx.clip)을 통해 파도 외곽선을 절대 넘지 않도록 제한
 * - 양끝 블러 및 하단 투명도 페이드 유지
 */
function drawWaveUpperCrestShading(
  ctx: any,
  ax: number,
  bottomY: number,
  H: number,
  dir: number,
  advX: number = 0,
  waveFrame: number = 4
) {
  // [유저 요청 엄수]: 파도가 커질수록 위로 커지게 (단 파도를 넘어가지는 않게)
  const SHIFTS = [0.00, 0.02, 0.04, 0.07, 0.095, 0.115, 0.130, 0.140];
  const upShift = SHIFTS[Math.min(waveFrame, SHIFTS.length - 1)] ?? 0.095;

  const cw = ctx.canvas?.width || 560;
  const ch = ctx.canvas?.height || 380;
  const off = createCanvas(cw, ch);
  const oCtx = off.getContext("2d");

  oCtx.beginPath();
  const pStartCrest = {
    x: ax + dir * (H * -0.569) + advX,
    y: bottomY - H * (0.723 + upShift * 0.8)
  };
  oCtx.moveTo(pStartCrest.x, pStartCrest.y);

  // 1) 상단 크레스트 능선 (파도가 커질수록 위로 점진적 확장, 외곽선 초과 방지)
  const tApexY = Math.min(1.01, 0.990 + upShift);
  const tApexY1 = Math.min(1.00, 0.983 + upShift);
  const tShoulderY = Math.min(0.92, 0.834 + upShift * 1.1);
  const tLipY = Math.min(0.72, 0.649 + upShift * 0.8);

  oCtx.bezierCurveTo(
    ax + dir * (H * -0.539) + advX, bottomY - H * Math.min(0.90, 0.849 + upShift * 0.8),
    ax + dir * (H * -0.376) + advX, bottomY - H * Math.min(1.00, 0.975 + upShift),
    ax + dir * (H * -0.124) + advX, bottomY - H * tApexY1
  );
  oCtx.bezierCurveTo(
    ax + dir * (H *  0.054) + advX, bottomY - H * tApexY,
    ax + dir * (H *  0.217) + advX, bottomY - H * Math.min(0.97, 0.894 + upShift * 1.05),
    ax + dir * (H *  0.402) + advX, bottomY - H * tShoulderY
  );
  // 2) 우측 숄더에서 립 팁으로 하향 전개
  oCtx.bezierCurveTo(
    ax + dir * (H *  0.528) + advX, bottomY - H * Math.min(0.88, 0.790 + upShift * 0.95),
    ax + dir * (H *  0.624) + advX, bottomY - H * Math.min(0.80, 0.731 + upShift * 0.85),
    ax + dir * (H *  0.683) + advX, bottomY - H * tLipY
  );
  // 3) 우측 립 팁 외측에서 쉐도우 상단 접점으로 하강
  oCtx.bezierCurveTo(
    ax + dir * (H *  0.683) + advX, bottomY - H * 0.575,
    ax + dir * (H *  0.587) + advX, bottomY - H * 0.509,
    ax + dir * (H *  0.469) + advX, bottomY - H * 0.479
  );
  // 4) 하단 경계선 (배럴 쉐도우 상단 능선을 따라 완만하게 이동)
  oCtx.bezierCurveTo(
    ax + dir * (H *  0.320) + advX, bottomY - H * 0.449,
    ax + dir * (H *  0.083) + advX, bottomY - H * 0.523,
    ax + dir * (H * -0.124) + advX, bottomY - H * 0.590
  );
  // 5) 좌측 등성이 복귀 및 폐곡선
  oCtx.bezierCurveTo(
    ax + dir * (H * -0.302) + advX, bottomY - H * 0.627,
    ax + dir * (H * -0.480) + advX, bottomY - H * 0.649,
    pStartCrest.x, pStartCrest.y
  );
  oCtx.closePath();

  // [유저 요청 엄수]: "양끝을 블러처리시켜봐" + "아까 추가했던 청록색 색상 현재 수증기풀화면 이후 파도색(#187be7)으로" + "밝은 처리 했던 부분 좀 더 푸른빛으로 해줘봐"
  // - 연한 하늘색/청록빛(rgba(37, 140, 251)) 대신 순수 블루 채도가 높은 강렬한 로열 코발트 블루 그라데이션 적용
  const x1 = ax + dir * (H * -0.569) + advX;
  const y1 = bottomY - H * (0.723 + upShift * 0.8);
  const x2 = ax + dir * (H *  0.683) + advX;
  const y2 = bottomY - H * 0.600;

  const gradH = oCtx.createLinearGradient(x1, y1, x2, y2);
  gradH.addColorStop(0.00, "rgba(6, 95, 240, 0.0)");
  gradH.addColorStop(0.18, "rgba(6, 95, 240, 1.0)");
  gradH.addColorStop(0.80, "rgba(14, 112, 252, 1.0)");
  gradH.addColorStop(1.00, "rgba(6, 95, 240, 0.0)");
  oCtx.fillStyle = gradH;
  oCtx.fill();

  // [유저 요청 엄수]: 파도 전면 아래쪽까지 푸른빛이 풍부하게 퍼지도록 페이드아웃 하향 전개
  oCtx.globalCompositeOperation = "destination-in";
  const yTop = bottomY - H * (1.01 + upShift);
  const yFadeStart = bottomY - H * 0.85;
  const yFadeEnd = bottomY - H * 0.35;
  const gradV = oCtx.createLinearGradient(0, yTop, 0, yFadeEnd);
  const stopStart = Math.max(0, Math.min(1, (yFadeStart - yTop) / (yFadeEnd - yTop)));
  gradV.addColorStop(0.00, "rgba(0, 0, 0, 1.0)");
  gradV.addColorStop(stopStart, "rgba(0, 0, 0, 1.0)");
  gradV.addColorStop(1.00, "rgba(0, 0, 0, 0.0)");
  oCtx.fillStyle = gradV;
  oCtx.fillRect(0, 0, cw, ch);

  // [유저 요청 엄수]: "명암 잘 넣긴 했는데 그 좀 블러있게 해줘서 자연스럽게 연결되게 해줘 - 파도 색깔부분"
  // 상단 크레스트 밝은 파란색 외곽선을 소프트 가우시안 블러로 확산시켜 베이스 파란색과 매끄럽게 연결
  const blurPx = Math.max(4, Math.round((H / 180) * 11));
  ctx.save();
  ctx.filter = `blur(${blurPx}px)`;
  ctx.drawImage(off, 0, 0);
  ctx.restore();
}

/**
 * [유저 요청 엄수]: 프레임 4번 기준 파도 배럴 공동 쉐도우 쉐이딩 (Wave Barrel Cavity Shadow)
 * - 빨간 펜 지정 영역(크레스트 돔 하단 ~ 바닥 수증기/지면 상단, 우측 립 수증기 뭉치와 맞닿는 내측 공동)에만
 *   정확하게 깊은 바다 음영(Deep Ocean Shadow, #03172b) 적용
 * - [유저 요청 엄수]: "명암 잘 넣긴 했는데 그 좀 블러있게 해줘서 자연스럽게 연결되게 해줘 - 파도 색깔부분"
 *   오프스크린 캔버스 및 가우시안 블러를 적용하여 칼로 자른 듯한 경계를 없애고 베이스 파란색(#0a3c68)과 유기적으로 융합
 */
function drawWaveBarrelShadow(
  ctx: any,
  ax: number,
  bottomY: number,
  H: number,
  dir: number,
  advX: number = 0
) {
  const cw = ctx.canvas?.width || 560;
  const ch = ctx.canvas?.height || 380;
  const off = createCanvas(cw, ch);
  const oCtx = off.getContext("2d");

  oCtx.beginPath();
  const pStart = { x: ax + dir * (H * -0.672) + advX, y: bottomY - H * 0.294 };
  oCtx.moveTo(pStart.x, pStart.y);

  // 1) 좌측 등성이 내벽 곡선 (크레스트 돔 하단 솟구침)
  oCtx.bezierCurveTo(
    ax + dir * (H * -0.657) + advX, bottomY - H * 0.553,
    ax + dir * (H * -0.524) + advX, bottomY - H * 0.760,
    ax + dir * (H * -0.339) + advX, bottomY - H * 0.790
  );
  // 2) 크레스트 하단 능선 통과부 (돔 곡률 유지하며 하향 전개)
  oCtx.bezierCurveTo(
    ax + dir * (H * -0.154) + advX, bottomY - H * 0.805,
    ax + dir * (H *  0.054) + advX, bottomY - H * 0.679,
    ax + dir * (H *  0.269) + advX, bottomY - H * 0.612
  );
  // 3) 우측 립 수증기 뭉치 접점부
  oCtx.bezierCurveTo(
    ax + dir * (H *  0.394) + advX, bottomY - H * 0.568,
    ax + dir * (H *  0.491) + advX, bottomY - H * 0.553,
    ax + dir * (H *  0.557) + advX, bottomY - H * 0.538
  );
  // 4) 우측 경계 (수증기 뭉치 좌측 자락 및 튜브 하강선)
  oCtx.bezierCurveTo(
    ax + dir * (H *  0.565) + advX, bottomY - H * 0.442,
    ax + dir * (H *  0.528) + advX, bottomY - H * 0.294,
    ax + dir * (H *  0.454) + advX, bottomY - H * 0.212
  );
  // 5) 하단 경계 (포켓 상단 및 지면 수증기 윗선)
  oCtx.bezierCurveTo(
    ax + dir * (H *  0.269) + advX, bottomY - H * 0.212,
    ax + dir * (H *  0.069) + advX, bottomY - H * 0.271,
    ax + dir * (H * -0.339) + advX, bottomY - H * 0.316
  );
  // 6) 좌하단 복귀 및 폐곡선
  oCtx.bezierCurveTo(
    ax + dir * (H * -0.494) + advX, bottomY - H * 0.331,
    ax + dir * (H * -0.613) + advX, bottomY - H * 0.271,
    ax + dir * (H * -0.672) + advX, bottomY - H * 0.227
  );
  oCtx.closePath();

  // [유저 요청 엄수]: "올라오는 파도 색깔이 좀더 푸르렀으면 좋겠어"
  // - 깊은 바다 음영을 완전한 검은색(#03172b) 대신 푸른빛이 풍부하게 감도는 딥 사파이어 네이비로 개선
  const syTop = bottomY - H * 0.805;
  const syBot = bottomY - H * 0.200;
  const sGrad = oCtx.createLinearGradient(0, syTop, 0, syBot);
  sGrad.addColorStop(0.00, "rgba(6, 36, 82, 0.0)");
  sGrad.addColorStop(0.20, "rgba(6, 36, 82, 0.72)");
  sGrad.addColorStop(0.55, "rgba(8, 44, 98, 0.78)");
  sGrad.addColorStop(1.00, "rgba(6, 36, 82, 0.0)");

  oCtx.fillStyle = sGrad;
  oCtx.fill();

  // [유저 요청 엄수]: "명암 잘 넣긴 했는데 그 좀 블러있게 해줘서 자연스럽게 연결되게 해줘 - 파도 색깔부분"
  // 배럴 음영 외곽선을 소프트 가우시안 블러로 부드럽게 확산시켜 베이스 파란색(#0a3c68)과 매끄럽게 연결
  const blurPx = Math.max(5, Math.round((H / 180) * 13));
  ctx.save();
  ctx.filter = `blur(${blurPx}px)`;
  ctx.drawImage(off, 0, 0);
  ctx.restore();
}

/**
 * [유저 요청 엄수]: "고리게 퍼진형태 아...ㅋㅋㅋ 그리고 좀 파도처럼 자연스럽게"
 * - 프레임 4번 기준 상단 크레스트 수증기 (Wave Crest Steam)
 * - 인위적인 줄기/갈퀴 형태를 완전히 배제하고, 상단 크레스트 능선을 따라 부드럽게 고루 퍼진 수증기 캐노피로 전면 개편
 * - 상단 능선부는 짙은 순백 수증기 퍼프(Billows)로 볼륨감을 부여하고, 하단 방향으로는 세룰리안 블루 수면 속으로 투명하게 자연 페이드
 * - 좌우 양끝 역시 부드러운 그라데이션 페이드아웃으로 파도 전체와 유기적으로 융합
 */
function drawWaveCrestSteam(
  ctx: any,
  ax: number,
  bottomY: number,
  H: number,
  dir: number,
  advX: number = 0,
  waveFrame: number = 4
) {
  if (H < 50) return;

  const frameAlpha = [0.0, 0.3, 0.6, 0.85, 1.0, 1.0, 0.9, 0.8][Math.min(waveFrame, 7)] ?? 1.0;
  if (frameAlpha <= 0.01) return;

  const scale = H / 180;
  const cw = ctx.canvas?.width || 560;
  const ch = ctx.canvas?.height || 380;
  const off = createCanvas(cw, ch);
  const oCtx = off.getContext("2d");

  // 1. 크레스트 능선을 따라 고르게 펼쳐지는 부드러운 수증기 캐노피 영역 정의
  oCtx.beginPath();
  // 좌측 후벽부에서 파도 능선을 감싸며 시작
  oCtx.moveTo(ax - dir * (H * 0.65) + advX, bottomY - H * 0.60);
  oCtx.bezierCurveTo(
    ax - dir * (H * 0.65) + advX, bottomY - H * 0.85,
    ax - dir * (H * 0.35) + advX, bottomY - H * 1.05,
    ax - dir * (H * 0.05) + advX, bottomY - H * 1.05
  );
  oCtx.bezierCurveTo(
    ax + dir * (H * 0.25) + advX, bottomY - H * 1.05,
    ax + dir * (H * 0.55) + advX, bottomY - H * 0.98,
    ax + dir * (H * 0.82) + advX, bottomY - H * 0.80
  );
  oCtx.bezierCurveTo(
    ax + dir * (H * 0.88) + advX, bottomY - H * 0.60,
    ax + dir * (H * 0.72) + advX, bottomY - H * 0.56,
    ax + dir * (H * 0.55) + advX, bottomY - H * 0.60
  );
  // 하단 경계: 파도 전면 수면을 따라 완만한 유선형으로 하강
  oCtx.bezierCurveTo(
    ax + dir * (H * 0.35) + advX, bottomY - H * 0.65,
    ax + dir * (H * 0.10) + advX, bottomY - H * 0.70,
    ax - dir * (H * 0.12) + advX, bottomY - H * 0.72
  );
  oCtx.bezierCurveTo(
    ax - dir * (H * 0.30) + advX, bottomY - H * 0.70,
    ax - dir * (H * 0.48) + advX, bottomY - H * 0.65,
    ax - dir * (H * 0.65) + advX, bottomY - H * 0.60
  );
  oCtx.closePath();

  // 수직 그라데이션: 상단 크레스트 능선은 순백(0.92), 아래쪽으로 내려오면서 투명하게 자연 감쇄
  const gV = oCtx.createLinearGradient(0, bottomY - H * 1.05, 0, bottomY - H * 0.58);
  gV.addColorStop(0.00, `rgba(255, 255, 255, ${0.92 * frameAlpha})`);
  gV.addColorStop(0.25, `rgba(255, 255, 255, ${0.72 * frameAlpha})`);
  gV.addColorStop(0.55, `rgba(255, 255, 255, ${0.38 * frameAlpha})`);
  gV.addColorStop(0.85, `rgba(240, 248, 255, ${0.10 * frameAlpha})`);
  gV.addColorStop(1.00, "rgba(240, 248, 255, 0.0)");
  oCtx.fillStyle = gV;
  oCtx.fill();

  // 수평 양끝 블러 페이드: 좌측 후벽 및 우측 립 끝단이 뭉개지며 자연스럽게 사라짐
  oCtx.globalCompositeOperation = "destination-in";
  const gH = oCtx.createLinearGradient(ax - dir * (H * 0.65) + advX, 0, ax + dir * (H * 0.88) + advX, 0);
  gH.addColorStop(0.00, "rgba(0, 0, 0, 0.0)");
  gH.addColorStop(0.12, "rgba(0, 0, 0, 1.0)");
  gH.addColorStop(0.88, "rgba(0, 0, 0, 1.0)");
  gH.addColorStop(1.00, "rgba(0, 0, 0, 0.0)");
  oCtx.fillStyle = gH;
  oCtx.fillRect(0, 0, cw, ch);

  ctx.drawImage(off, 0, 0);

  // 2. 상단 능선을 따라 자연스럽게 융합되는 유기적 수증기/포말 볼륨 (Volumetric Crest Foam Billows)
  // [유저 요청 엄수]: "간격이 너무 일정하다 이거 좀 수정해줘", "위치가 문제인듯 파도 형상을 벗어나지 않게 해봐"
  // - 14개 등간격 소형 원(r: 18~24) 완전 제거 -> 넓고 부드러운 타원형 폼 쿠션으로 전면 교체
  // - 점처럼 맺히지 않고 파도 상단 캐노피와 유기적으로 하나되어 풍성한 포말 볼륨 형성
  ctx.save();
  const BILLOW_CLUSTERS = [
    // 좌측 후벽부 완만한 포말대
    { nx: -0.32, ny: 0.86, rx: 44, ry: 24, rot: -0.25, op: 0.48 },
    // 정점 부근 대형 포말 볼륨 (두 덩어리가 겹쳐 연속된 유기적 뭉게구름 형성)
    { nx: -0.06, ny: 0.95, rx: 54, ry: 28, rot: -0.05, op: 0.58 },
    { nx:  0.14, ny: 0.94, rx: 50, ry: 26, rot:  0.12, op: 0.58 },
    // 우측 숄더 포말대
    { nx:  0.38, ny: 0.90, rx: 46, ry: 22, rot:  0.28, op: 0.50 },
    { nx:  0.58, ny: 0.80, rx: 38, ry: 18, rot:  0.40, op: 0.44 },
    // 중하단 몸체부 부드러운 안개 (점 형태 배제, 넓은 타원)
    { nx:  0.05, ny: 0.82, rx: 56, ry: 20, rot:  0.08, op: 0.32 },
    { nx:  0.28, ny: 0.78, rx: 50, ry: 18, rot:  0.22, op: 0.30 },
  ];

  for (let i = 0; i < BILLOW_CLUSTERS.length; i++) {
    const b = BILLOW_CLUSTERS[i];
    const px = ax + dir * (H * b.nx) + advX;
    const py = bottomY - H * b.ny;
    const rx = b.rx * scale;
    const ry = b.ry * scale;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(dir * b.rot);

    const maxR = Math.max(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
    g.addColorStop(0.00, `rgba(255, 255, 255, ${b.op * 0.65 * frameAlpha})`);
    g.addColorStop(0.40, `rgba(255, 255, 255, ${b.op * 0.42 * frameAlpha})`);
    g.addColorStop(0.75, `rgba(240, 248, 255, ${b.op * 0.15 * frameAlpha})`);
    g.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * [유저 요청 엄수]: "파도의 끝 방향으로 향하는 선같은거 (반투명하고 외각은 흐려지는 선들) (마치 물줄기의 이동처럼) 추가해봐"
 * [유저 요청 엄수]: "선이 그냥 고정적인 그냥 선인데 물줄기를 나타내는것처럼 마치 파장처럼 위로 올라가기라도 하면모를까 (단 파도내에서)"
 * [유저 요청 엄수]: "그 가닥같은거 좀만 더 굵게 해볼래" -> "더 두껍게 해주고 그리고 색깔 단순 흰색 말고 밝은 톤쉐이딩 느낌으로다가"
 * [유저 요청 엄수]: "넓적 하게 투명하게" -> "더 두껍게 더 흐리게" -> "좀만더 넓적하고 좀만 더 투명하게 아주넓적"
 * - 파도의 하단/기저면에서 솟구쳐 파도 능선과 립 끝(Tip)으로 굽이쳐 오르는 5개 아주 넓적한(width 52~76px) 대형 수류 리본
 * - 투명도 강화(transMul 0.70)로 깊은 배럴 공동 음영(#03172b)과 파도 베이스가 유리알처럼 맑게 비쳐 입체감 극대화
 * - 5단계 다층 블러 그라데이션 및 소프트 블러(blur 1.2px)로 외곽선이 물안개/빛무리처럼 부드럽게 흐려짐
 * - ctx.clip() 내부에서만 렌더링되어 파도 외곽을 절대 벗어나지 않음 (단 파도내에서 엄수)
 */
const BROAD_RIBBON_GUIDES = [
  // 1. 좌측 벽면 넓은 수류 (Back Wall Broad Surge)
  {
    path: [
      [-0.56, 0.22],
      [-0.52, 0.48],
      [-0.42, 0.72],
      [-0.28, 0.88],
      [-0.08, 0.96]
    ],
    width: 58,
    speed: 0.20,
    offset: 0.00
  },
  // 2. 좌중간 넓은 수류 (Mid-Left Broad Surge)
  {
    path: [
      [-0.44, 0.20],
      [-0.38, 0.46],
      [-0.25, 0.72],
      [-0.06, 0.88],
      [ 0.16, 0.95]
    ],
    width: 70,
    speed: 0.22,
    offset: 0.30
  },
  // 3. 중앙 메인 넓은 수류 (Center Face Broad Surge)
  {
    path: [
      [-0.28, 0.18],
      [-0.20, 0.44],
      [-0.05, 0.68],
      [ 0.18, 0.84],
      [ 0.45, 0.88]
    ],
    width: 76,
    speed: 0.24,
    offset: 0.60
  },
  // 4. 중앙 우측 립으로 감아도는 넓은 수류 (Center-Right to Lip Broad Ribbon)
  {
    path: [
      [-0.12, 0.20],
      [-0.02, 0.42],
      [ 0.16, 0.65],
      [ 0.40, 0.78],
      [ 0.68, 0.78],
      [ 0.82, 0.64]
    ],
    width: 64,
    speed: 0.26,
    offset: 0.15
  },
  // 5. 배럴 우측 & 립 하강 넓은 수류 (Right Barrel to Lip Tip Broad Ribbon)
  {
    path: [
      [ 0.06, 0.24],
      [ 0.22, 0.40],
      [ 0.44, 0.58],
      [ 0.66, 0.66],
      [ 0.84, 0.54],
      [ 0.86, 0.44]
    ],
    width: 52,
    speed: 0.28,
    offset: 0.45
  }
];

function sampleWaveSpline(keyPts: { x: number; y: number }[], numSamples: number = 36) {
  const n = keyPts.length - 1;
  const samples: { x: number; y: number; nx: number; ny: number }[] = [];
  for (let s = 0; s <= numSamples; s++) {
    const t = s / numSamples;
    const p = Math.max(0, Math.min(n, t * n));
    const i0 = Math.min(n - 1, Math.floor(p));
    const frac = p - i0;

    const p0 = i0 > 0 ? keyPts[i0 - 1] : keyPts[0];
    const p1 = keyPts[i0];
    const p2 = keyPts[Math.min(n, i0 + 1)];
    const p3 = keyPts[Math.min(n, i0 + 2)];

    const t2 = frac * frac;
    const t3 = t2 * frac;

    const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * frac + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
    const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * frac + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

    const dt = 0.01;
    const fN = Math.min(1.0, frac + dt);
    const t2n = fN * fN;
    const t3n = t2n * fN;
    const xn = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * fN + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2n + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3n);
    const yn = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * fN + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2n + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3n);

    const tx = xn - x;
    const ty = yn - y;
    const len = Math.hypot(tx, ty) || 1;
    samples.push({ x, y, nx: -ty / len, ny: tx / len });
  }
  return samples;
}

function strokeSmoothWavePath(ctx: any, pts: { x: number; y: number }[]) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
}

function drawWaveWaterStreamlines(
  ctx: any,
  ax: number,
  bottomY: number,
  H: number,
  dir: number,
  advX: number = 0,
  waveFrame: number = 4
) {
  if (H < 50) return;

  const frameAlpha = [0.0, 0.35, 0.70, 0.90, 1.0, 1.0, 0.95, 0.85][Math.min(waveFrame, 7)] ?? 1.0;
  if (frameAlpha <= 0.01) return;

  const scale = H / 180;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // [유저 요청 엄수]: "더 흐리게" - 부드러운 소프트 블러로 외곽선 경계선이 안개처럼 흐려지도록 연출
  if (ctx.filter !== undefined) {
    ctx.filter = "blur(1.2px)";
  }

  const fTime = waveFrame;

  // [유저 요청 엄수]: "더 두껍게 해주고 그리고 색깔 단순 흰색 말고 밝은 톤쉐이딩 느낌으로다가" + "밝은 처리 했던 부분 좀 더 푸른빛으로 해줘봐"
  // 3단계 선명한 푸른빛 톤쉐이딩 색상 (로열 코발트 림 -> 맑고 깊은 블루 몸체 -> 푸른빛 머금은 화사한 하이라이트)
  const cBase = "6, 105, 220";   // #0669dc 선명한 코발트 림 베이스 (Ambient Outer Rim)
  const cMid  = "32, 155, 252";  // #209bfc 깊고 맑은 로열 블루 수류 (Translucent Body)
  const cHigh = "135, 215, 255"; // #87d7ff 푸른빛이 풍부한 하이라이트 릿지 (Highlight Ridge - 흰색 탈피)

  // [유저 요청 엄수]: "살짞만 불투명하게" (불투명도를 살짝 올려 맑은 투명감을 유지하되 수류의 존재감과 선명도 강화)
  const transMul = 0.84;

  for (let gIdx = 0; gIdx < BROAD_RIBBON_GUIDES.length; gIdx++) {
    const guide = BROAD_RIBBON_GUIDES[gIdx];
    const keyPts = guide.path.map(([nx, ny]) => ({
      x: ax + dir * (H * nx) + advX,
      y: bottomY - H * ny
    }));

    const samples = sampleWaveSpline(keyPts, 36);

    // 각 리본당 위로 솟구쳐 오르는 2개의 아주 넓고 투명한 물줄기 펄스
    for (let pulse = 0; pulse < 2; pulse++) {
      const pulseProg = ((fTime * guide.speed + guide.offset + pulse * 0.50) % 1.0);
      const span = 0.52;
      const uMin = Math.max(0, pulseProg - span * 0.5);
      const uMax = Math.min(1.0, pulseProg + span * 0.5);

      if (uMax - uMin < 0.06) continue;

      const idxMin = Math.floor(uMin * (samples.length - 1));
      const idxMax = Math.ceil(uMax * (samples.length - 1));

      const pulsePts: { x: number; y: number }[] = [];
      for (let k = idxMin; k <= idxMax; k++) {
        const pt = samples[k];
        if (!pt) continue;
        const uLocal = (k - idxMin) / Math.max(1, idxMax - idxMin);
        const env = Math.sin(uLocal * Math.PI); // 양 끝단 부드러운 투명 페이드

        // 파장처럼 유려하게 일렁이는 미세 수류 굴곡 (Harmonic Undulation)
        const waveUndul = Math.sin(uLocal * Math.PI * 2.0 - fTime * 2.0 + gIdx) * (1.8 * scale * env);
        pulsePts.push({
          x: pt.x + pt.nx * waveUndul,
          y: pt.y + pt.ny * waveUndul
        });
      }

      if (pulsePts.length < 2) continue;

      const p0 = pulsePts[0];
      const p1 = pulsePts[pulsePts.length - 1];

      // [유저 요청 엄수]: "아주넓적" - 대폭 확장된 넓적한 리본 폭 (H=180 기준 52~76px)
      const w = guide.width * scale;

      // [유저 요청 엄수]: "더 흐리게" + "좀만 더 투명하게" - 5단계 다층 블러 그라데이션
      // 1) 최외곽 소프트 앰비언트 아우라 (가장 넓고 은은한 외곽 흐림)
      const g0 = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
      g0.addColorStop(0.00, `rgba(${cBase}, 0.0)`);
      g0.addColorStop(0.20, `rgba(${cBase}, ${0.10 * transMul * frameAlpha})`);
      g0.addColorStop(0.80, `rgba(${cBase}, ${0.10 * transMul * frameAlpha})`);
      g0.addColorStop(1.00, `rgba(${cBase}, 0.0)`);
      ctx.lineWidth = w * 2.0;
      ctx.strokeStyle = g0;
      ctx.globalAlpha = 0.22 * transMul;
      strokeSmoothWavePath(ctx, pulsePts);

      // 2) 외곽 반투명 청록 림 (Outer Translucent Feather)
      const g1 = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
      g1.addColorStop(0.00, `rgba(${cBase}, 0.0)`);
      g1.addColorStop(0.22, `rgba(${cBase}, ${0.18 * transMul * frameAlpha})`);
      g1.addColorStop(0.78, `rgba(${cBase}, ${0.18 * transMul * frameAlpha})`);
      g1.addColorStop(1.00, `rgba(${cBase}, 0.0)`);
      ctx.lineWidth = w * 1.5;
      ctx.strokeStyle = g1;
      ctx.globalAlpha = 0.32 * transMul;
      strokeSmoothWavePath(ctx, pulsePts);

      // 3) 중간 스카이 아쿠아 리본 본체 (Mid Translucent Ribbon Body)
      const g2 = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
      g2.addColorStop(0.00, `rgba(${cMid}, 0.0)`);
      g2.addColorStop(0.25, `rgba(${cMid}, ${0.30 * transMul * frameAlpha})`);
      g2.addColorStop(0.75, `rgba(${cMid}, ${0.30 * transMul * frameAlpha})`);
      g2.addColorStop(1.00, `rgba(${cMid}, 0.0)`);
      ctx.lineWidth = w * 1.0;
      ctx.strokeStyle = g2;
      ctx.globalAlpha = 0.42 * transMul;
      strokeSmoothWavePath(ctx, pulsePts);

      // 4) 내부 은은한 아쿠아 발광 코어 (Inner Glowing Core)
      const g3 = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
      g3.addColorStop(0.00, `rgba(${cMid}, 0.0)`);
      g3.addColorStop(0.28, `rgba(${cMid}, ${0.38 * transMul * frameAlpha})`);
      g3.addColorStop(0.72, `rgba(${cMid}, ${0.38 * transMul * frameAlpha})`);
      g3.addColorStop(1.00, `rgba(${cMid}, 0.0)`);
      ctx.lineWidth = w * 0.65;
      ctx.strokeStyle = g3;
      ctx.globalAlpha = 0.48 * transMul;
      strokeSmoothWavePath(ctx, pulsePts);

      // 5) 부드럽게 흐려진 투명 아이스 화이트 릿지 (날카로운 실선 배제, 넓고 소프트한 반투명 빛의 능선)
      const g4 = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
      g4.addColorStop(0.00, `rgba(${cHigh}, 0.0)`);
      g4.addColorStop(0.32, `rgba(${cHigh}, ${0.38 * transMul * frameAlpha})`);
      g4.addColorStop(0.68, `rgba(${cHigh}, ${0.38 * transMul * frameAlpha})`);
      g4.addColorStop(1.00, `rgba(${cHigh}, 0.0)`);
      ctx.lineWidth = w * 0.35;
      ctx.strokeStyle = g4;
      ctx.globalAlpha = 0.45 * transMul;
      strokeSmoothWavePath(ctx, pulsePts);
    }
  }

  if (ctx.filter !== undefined) {
    ctx.filter = "none";
  }
  ctx.restore();
}

/**
 * [유저 요청 엄수]: "저 앞 쪽 파도 크기가 파도크기에 비례해서 달라져야하는데 너무 빨리 그냥 커지는듯"
 * - 파도 크기(H) 및 성장도(waveFrame)에 정비례하여 점진적으로 자연스럽게 커지는 비례형 쇄파 수증기
 * - Frame 0: 생성 초기 잔잔한 수면 (0% - 급작스러운 포말 폭발 배제)
 * - Frame 1: 립 팁 끝단에 맺히는 작은 포말 캡 (25% - 파란 부리를 감싸며 단정하게 시작)
 * - Frame 2: 립을 따라 떨어지기 시작하는 중간 쇄파 (48%)
 * - Frame 3: 파도가 커지며 튜브 안쪽 공동을 채워나가는 전개형 포말 (72%)
 * - Frame 4: 파도가 거대해지는 최고조 피크(H=180)에서 만개하는 대형 수증기 (100%)
 * - Frame 5~7: 전방으로 전진 쇄파하며 자연스럽게 비산 (108%~120%)
 */
function drawWaveLipSteamCluster(
  ctx: any,
  ax: number,
  bottomY: number,
  H: number,
  dir: number,
  advX: number = 0,
  alpha: number = 1.0,
  waveFrame: number = 4
) {
  if (alpha <= 0.01 || H < 40) return;

  // [유저 요청 엄수]: 파도 크기와 성숙도에 정확히 비례하는 점진 성장 계수 (초기 파도 확대에 맞춰 상향 보정)
  const GROWTH = [0.28, 0.46, 0.65, 0.82, 1.00, 1.10, 1.18, 1.25];
  const g = GROWTH[Math.min(waveFrame, GROWTH.length - 1)] ?? 1.00;

  if (g <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha * Math.min(1.0, 0.35 + 0.65 * g)));

  // 앵커: 립 팁(H * 0.93) 바로 위(H * 0.88)에 정확히 안착하여 어느 프레임에서도 파란 부리가 삐져나오지 않음
  const cx = ax + dir * (H * 0.88) + advX;
  const cy = bottomY - H * 0.47;
  const scale = (H / 180) * (0.45 + 0.55 * g);

  // [유저 요청 엄수]: "그리고 형태가 너무 일정한듯"
  // 단순 원형 클러스터 탈피 -> 파도 수류 및 파쇄 물리 역학에 맞춘 프레임별 고유 형태학(Morphology) 구현:
  // F0: 발원 수면 사선 물 혀 볏 포말
  // F1: 초승달 모양의 얇고 날렵한 볏 포말 캡 (Crescent Crest)
  // F2: 아래로 꺾여 떨어지기 시작하는 갈고리형 쇄파 (Curving Plunge Hook)
  // F3: 튜브 캐비티 안쪽으로 수직 낙하하는 폭포형 커튼 (Vertical Waterfall Cascade)
  // F4: 수면 격돌 임팩트 가마솥! 상향 분출 스플래시 왕관 + 전방 돌출 쇄파 연무 (Explosive Cauldron)
  // F5: 붕괴하며 수면으로 쏟아져 굴러가는 롤러 사태 (Surging Avalanche Roller)
  // F6: 전방으로 낮고 맹렬히 뻗어나가는 쐐기형 돌진 파면 (Wedge Deluge)
  // F7: 전방을 광범위하게 휩쓰는 파쇄수 워시 (Sweeping Deluge Wash)

  let underclouds: Array<{ dx: number; dy: number; rx: number; ry: number; rot: number; op: number }> = [];
  let puffs: Array<{ dx: number; dy: number; rx: number; ry: number; rot: number; op: number }> = [];
  let droplets: Array<{ dx: number; dy: number; r: number; op: number }> = [];

  if (waveFrame === 0) {
    // F0: 발원 수면 사선 물 혀 볏 포말
    puffs = [
      { dx: -12, dy: -4, rx: 13, ry: 9, rot: -0.20, op: 0.90 },
      { dx:  -4, dy: -2, rx: 15, ry: 10, rot: -0.08, op: 0.95 },
      { dx:   4, dy:  0, rx: 14, ry: 10, rot:  0.12, op: 0.95 },
      { dx:   8, dy:  4, rx: 12, ry: 8, rot:  0.28, op: 0.88 },
    ];
    droplets = [
      { dx: 11, dy: -1, r: 2.0, op: 0.80 },
    ];
  } else if (waveFrame === 1) {
    // F1: 날렵한 초승달형 볏 포말
    puffs = [
      { dx: -16, dy: -6, rx: 15, ry: 10, rot: -0.25, op: 0.92 },
      { dx:  -6, dy: -4, rx: 18, ry: 12, rot: -0.10, op: 0.98 },
      { dx:   3, dy: -2, rx: 17, ry: 12, rot:  0.15, op: 0.98 },
      { dx:   9, dy:  4, rx: 14, ry: 10, rot:  0.35, op: 0.92 },
      { dx:   3, dy:  9, rx: 12, ry:  9, rot:  0.20, op: 0.88 },
    ];
    droplets = [
      { dx:  15, dy: -3, r: 2.5, op: 0.85 },
      { dx:  13, dy:  6, r: 2.0, op: 0.80 },
    ];
  } else if (waveFrame === 2) {
    // F2: 꺾여 떨어지는 갈고리 쇄파
    underclouds = [
      { dx: -4, dy: 12, rx: 26, ry: 30, rot: 0.2, op: 0.65 }
    ];
    puffs = [
      { dx: -18, dy: -12, rx: 16, ry: 11, rot: -0.3, op: 0.92 },
      { dx:  -6, dy:  -6, rx: 20, ry: 15, rot: -0.1, op: 0.98 },
      { dx:   4, dy:  -2, rx: 21, ry: 16, rot:  0.2, op: 0.98 },
      { dx:   8, dy:  12, rx: 20, ry: 18, rot:  0.4, op: 0.96 },
      { dx:   2, dy:  26, rx: 18, ry: 19, rot:  0.3, op: 0.94 },
      { dx:  -6, dy:  38, rx: 15, ry: 17, rot:  0.1, op: 0.88 },
      { dx:  -4, dy:  50, rx: 12, ry: 13, rot:  0.0, op: 0.80 },
    ];
    droplets = [
      { dx:  16, dy:   2, r: 3.2, op: 0.90 },
      { dx:  18, dy:  16, r: 3.0, op: 0.85 },
      { dx:  10, dy:  34, r: 2.8, op: 0.85 },
      { dx:  -8, dy:  58, r: 2.2, op: 0.75 },
    ];
  } else if (waveFrame === 3) {
    // F3: 수직 낙하 폭포 커튼 + 캐비티 소용돌이
    underclouds = [
      { dx:  -8, dy: 22, rx: 34, ry: 46, rot: 0.15, op: 0.68 },
      { dx: -34, dy: 14, rx: 28, ry: 32, rot: -0.2, op: 0.62 },
    ];
    puffs = [
      { dx: -16, dy: -14, rx: 20, ry: 14, rot: -0.3, op: 0.96 },
      { dx:   0, dy:  -8, rx: 24, ry: 18, rot:  0.1, op: 0.98 },
      { dx:   8, dy:   8, rx: 22, ry: 26, rot:  0.3, op: 0.98 },
      { dx:   6, dy:  28, rx: 24, ry: 30, rot:  0.2, op: 0.96 },
      { dx:   2, dy:  48, rx: 22, ry: 28, rot:  0.1, op: 0.92 },
      { dx:  -4, dy:  66, rx: 18, ry: 22, rot:  0.0, op: 0.88 },
      { dx: -24, dy:  -2, rx: 22, ry: 18, rot: -0.2, op: 0.94 },
      { dx: -38, dy:  12, rx: 24, ry: 20, rot: -0.4, op: 0.92 },
      { dx: -32, dy:  30, rx: 22, ry: 22, rot: -0.3, op: 0.88 },
      { dx: -20, dy:  46, rx: 20, ry: 20, rot: -0.1, op: 0.85 },
    ];
    droplets = [
      { dx:  18, dy:  -4, r: 3.5, op: 0.90 },
      { dx:  22, dy:  14, r: 4.0, op: 0.92 },
      { dx:  16, dy:  38, r: 3.8, op: 0.88 },
      { dx:   8, dy:  62, r: 3.2, op: 0.82 },
      { dx:  -6, dy:  78, r: 2.8, op: 0.78 },
      { dx: -48, dy:  16, r: 2.5, op: 0.75 },
    ];
  } else if (waveFrame === 4) {
    // F4: 폭발적 충돌 가마솥! 상향 스플래시 왕관 + 전방 돌출 요철
    underclouds = [
      { dx:  -6, dy: 14, rx: 46, ry: 42, rot: 0.1, op: 0.75 },
      { dx: -36, dy: 16, rx: 38, ry: 36, rot: -0.2, op: 0.70 },
      { dx: -52, dy: 38, rx: 38, ry: 34, rot: -0.15, op: 0.75 },
      { dx: -32, dy: 60, rx: 36, ry: 30, rot: -0.05, op: 0.80 },
      { dx:  22, dy: 24, rx: 38, ry: 38, rot: 0.3, op: 0.70 },
    ];
    // 립 하단과 지면 기저부 및 상단 공동 사이 빈틈 밀착 충전
    underclouds.push(
      { dx: -42, dy: -12, rx: 48, ry: 36, rot: -0.15, op: 0.88 },
      { dx: -60, dy:  10, rx: 46, ry: 36, rot: -0.10, op: 0.88 },
      { dx: -68, dy:  38, rx: 44, ry: 36, rot: -0.15, op: 0.88 },
      { dx: -86, dy:  54, rx: 42, ry: 34, rot: -0.05, op: 0.88 },
      { dx: -66, dy:  68, rx: 40, ry: 32, rot:  0.00, op: 0.88 },
      { dx: -98, dy:  68, rx: 38, ry: 30, rot:  0.05, op: 0.85 }
    );
    puffs = [
      // 상향 분출 스플래시 왕관 (High Splash Crown)
      { dx:  -8, dy: -26, rx: 16, ry: 24, rot: -0.15, op: 0.96 },
      { dx:   8, dy: -20, rx: 18, ry: 26, rot:  0.25, op: 0.96 },
      { dx:  22, dy: -12, rx: 20, ry: 22, rot:  0.45, op: 0.94 },
      // 립 코어
      { dx:  -2, dy:  -4, rx: 28, ry: 25, rot:  0.05, op: 0.98 },
      { dx: -20, dy:  -8, rx: 25, ry: 22, rot: -0.25, op: 0.97 },
      // 전방 돌출 쇄파 연무 (Forward Snout)
      { dx:  28, dy:   8, rx: 26, ry: 24, rot:  0.30, op: 0.95 },
      { dx:  36, dy:  24, rx: 25, ry: 22, rot:  0.20, op: 0.92 },
      { dx:  30, dy:  44, rx: 24, ry: 22, rot:  0.10, op: 0.88 },
      // 지면 충돌부 및 캐비티 밀착
      { dx:  12, dy:  38, rx: 30, ry: 26, rot:  0.15, op: 0.96 },
      { dx:  -2, dy:  56, rx: 28, ry: 24, rot:  0.00, op: 0.94 },
      { dx: -18, dy:  68, rx: 26, ry: 22, rot: -0.10, op: 0.90 },
      { dx: -38, dy:  56, rx: 28, ry: 24, rot: -0.10, op: 0.94 },
      // 캐비티 내부
      { dx: -42, dy:   6, rx: 26, ry: 24, rot: -0.35, op: 0.95 },
      { dx: -48, dy:  22, rx: 24, ry: 22, rot: -0.40, op: 0.92 },
      { dx: -54, dy:  38, rx: 26, ry: 23, rot: -0.25, op: 0.94 },
      { dx: -34, dy:  42, rx: 25, ry: 23, rot: -0.20, op: 0.90 },
    ];
    puffs.push(
      // 상단 공동 및 크레스트 하단 연결 (상단 수증기 틈새 완전 차단)
      { dx: -24, dy: -22, rx: 26, ry: 22, rot: -0.18, op: 0.95 },
      { dx: -45, dy: -18, rx: 28, ry: 24, rot: -0.12, op: 0.96 },
      { dx: -65, dy:  -8, rx: 29, ry: 24, rot: -0.06, op: 0.96 },
      { dx: -32, dy:   6, rx: 28, ry: 24, rot: -0.10, op: 0.96 },
      { dx: -54, dy:  16, rx: 29, ry: 25, rot: -0.05, op: 0.96 },
      // 하단 공동 및 지면 연결
      { dx: -68, dy:  32, rx: 28, ry: 24, rot: -0.20, op: 0.95 },
      { dx: -82, dy:  44, rx: 26, ry: 22, rot: -0.15, op: 0.95 },
      { dx: -72, dy:  58, rx: 28, ry: 24, rot: -0.08, op: 0.96 },
      { dx: -92, dy:  62, rx: 28, ry: 24, rot:  0.00, op: 0.95 },
      { dx: -80, dy:  74, rx: 29, ry: 25, rot:  0.05, op: 0.94 },
      { dx: -58, dy:  76, rx: 30, ry: 26, rot:  0.05, op: 0.95 },
      { dx: -105, dy: 72, rx: 26, ry: 22, rot:  0.00, op: 0.92 }
    );
    droplets = [
      { dx:  12, dy: -38, r: 4.2, op: 0.95 },
      { dx:  26, dy: -30, r: 4.8, op: 0.95 },
      { dx:  38, dy: -18, r: 4.0, op: 0.92 },
      { dx:  48, dy:   2, r: 4.5, op: 0.92 },
      { dx:  52, dy:  18, r: 4.2, op: 0.90 },
      { dx:  46, dy:  38, r: 3.8, op: 0.88 },
      { dx:  -4, dy: -42, r: 3.5, op: 0.90 },
      { dx: -18, dy: -34, r: 3.2, op: 0.85 },
      { dx: -58, dy:  10, r: 3.5, op: 0.85 },
      { dx:  -8, dy:  80, r: 3.0, op: 0.80 },
    ];
  } else if (waveFrame === 5) {
    // F5: 붕괴하며 수면으로 쏟아져 굴러가는 사태 (Surging Avalanche)
    underclouds = [
      { dx:  12, dy: 30, rx: 48, ry: 42, rot: 0.35, op: 0.74 },
      { dx: -20, dy: 36, rx: 44, ry: 36, rot: 0.10, op: 0.75 },
      { dx: -50, dy: 42, rx: 46, ry: 38, rot: -0.10, op: 0.78 },
      { dx: -35, dy: 65, rx: 44, ry: 36, rot: -0.05, op: 0.80 },
      { dx:  38, dy: 44, rx: 40, ry: 34, rot: 0.40, op: 0.68 },
    ];
    underclouds.push(
      // 상단 공동 및 크레스트 하단 안개 (#30 5 빈틈 차단 및 2중 분리 방지)
      { dx: -45, dy: -16, rx: 50, ry: 40, rot: -0.16, op: 0.88 },
      { dx: -68, dy:   8, rx: 52, ry: 42, rot: -0.10, op: 0.88 },
      { dx: -35, dy:   8, rx: 48, ry: 38, rot: -0.05, op: 0.86 },
      // 하단 공동 연결
      { dx: -70, dy:  46, rx: 45, ry: 38, rot: -0.10, op: 0.88 },
      { dx: -92, dy:  60, rx: 42, ry: 35, rot: -0.05, op: 0.88 },
      { dx: -75, dy:  78, rx: 40, ry: 34, rot:  0.00, op: 0.88 },
      { dx: -105, dy: 76, rx: 36, ry: 30, rot:  0.05, op: 0.85 }
    );
    puffs = [
      // 상단 잔여 낙하
      { dx: -14, dy:  -2, rx: 24, ry: 18, rot: -0.15, op: 0.94 },
      { dx:   6, dy:   2, rx: 26, ry: 20, rot:  0.15, op: 0.96 },
      { dx:  26, dy:  12, rx: 26, ry: 22, rot:  0.30, op: 0.96 },
      // 사선 붕괴 벽 (Avalanche Slope)
      { dx:  44, dy:  26, rx: 28, ry: 24, rot:  0.40, op: 0.95 },
      { dx:  52, dy:  44, rx: 29, ry: 24, rot:  0.30, op: 0.94 },
      { dx:  48, dy:  64, rx: 30, ry: 26, rot:  0.20, op: 0.92 },
      { dx:  34, dy:  80, rx: 32, ry: 26, rot:  0.10, op: 0.90 },
      // 지면 접지 쇄도 및 파도면 밀착
      { dx:  14, dy:  42, rx: 32, ry: 28, rot:  0.20, op: 0.95 },
      { dx:  -4, dy:  56, rx: 30, ry: 26, rot:  0.05, op: 0.94 },
      { dx: -18, dy:  70, rx: 28, ry: 24, rot: -0.05, op: 0.90 },
      { dx: -38, dy:  74, rx: 32, ry: 25, rot:  0.00, op: 0.94 },
      { dx: -56, dy:  68, rx: 28, ry: 22, rot: -0.10, op: 0.92 },
      { dx:  12, dy:  82, rx: 32, ry: 24, rot:  0.05, op: 0.92 },
      // 후방 연무 및 파도면 연결
      { dx: -48, dy:  32, rx: 26, ry: 22, rot: -0.25, op: 0.92 },
      { dx: -38, dy:  46, rx: 26, ry: 22, rot: -0.20, op: 0.90 },
    ];
    puffs.push(
      // 상단 능선/크레스트와 수직으로 밀착 연결되는 순백 포말
      { dx: -24, dy: -24, rx: 28, ry: 22, rot: -0.18, op: 0.95 },
      { dx: -46, dy: -20, rx: 30, ry: 24, rot: -0.14, op: 0.96 },
      { dx: -68, dy: -12, rx: 32, ry: 26, rot: -0.08, op: 0.96 },
      { dx: -32, dy:   4, rx: 30, ry: 24, rot: -0.12, op: 0.96 },
      { dx: -54, dy:  14, rx: 32, ry: 26, rot: -0.06, op: 0.96 },
      { dx: -74, dy:  24, rx: 30, ry: 25, rot: -0.02, op: 0.95 },
      // 하단 지면 쇄도 연결
      { dx: -72, dy:  40, rx: 28, ry: 24, rot: -0.15, op: 0.95 },
      { dx: -88, dy:  52, rx: 28, ry: 24, rot: -0.10, op: 0.95 },
      { dx: -74, dy:  68, rx: 30, ry: 26, rot: -0.05, op: 0.96 },
      { dx: -96, dy:  70, rx: 28, ry: 24, rot:  0.00, op: 0.95 },
      { dx: -82, dy:  84, rx: 32, ry: 26, rot:  0.05, op: 0.94 },
      { dx: -110, dy: 78, rx: 26, ry: 22, rot:  0.00, op: 0.90 }
    );
    droplets = [
      { dx:  64, dy:  18, r: 4.8, op: 0.92 },
      { dx:  68, dy:  38, r: 4.6, op: 0.90 },
      { dx:  62, dy:  58, r: 4.4, op: 0.88 },
      { dx:  46, dy:  90, r: 3.8, op: 0.85 },
      { dx:  22, dy: -14, r: 3.5, op: 0.88 },
    ];
  } else if (waveFrame === 6) {
    // F6: 전방으로 낮고 맹렬히 뻗어나가는 쐐기형 파면 (Wedge Deluge)
    underclouds = [
      { dx:  28, dy: 44, rx: 55, ry: 38, rot: 0.30, op: 0.75 },
      { dx:  -8, dy: 50, rx: 46, ry: 36, rot: 0.10, op: 0.75 },
      { dx: -45, dy: 54, rx: 50, ry: 40, rot: -0.05, op: 0.80 },
      { dx: -28, dy: 74, rx: 46, ry: 36, rot:  0.00, op: 0.82 },
      { dx:  58, dy: 58, rx: 44, ry: 32, rot: 0.35, op: 0.70 },
    ];
    underclouds.push(
      // F6 상단 공동 밀착 뱅크 (#31 6 2중 분리 방지)
      { dx: -45, dy: -14, rx: 52, ry: 40, rot: -0.12, op: 0.88 },
      { dx: -68, dy:  10, rx: 54, ry: 42, rot: -0.05, op: 0.88 },
      { dx: -36, dy:  12, rx: 48, ry: 38, rot: -0.05, op: 0.86 },
      // 하단 쇄도 뱅크
      { dx: -75, dy:  52, rx: 46, ry: 38, rot: -0.05, op: 0.88 },
      { dx: -98, dy:  68, rx: 42, ry: 36, rot:  0.00, op: 0.88 },
      { dx: -80, dy:  86, rx: 40, ry: 34, rot:  0.05, op: 0.88 },
      { dx: -115, dy: 82, rx: 36, ry: 30, rot:  0.05, op: 0.85 }
    );
    puffs = [
      { dx:  -6, dy:   8, rx: 22, ry: 16, rot:  0.00, op: 0.92 },
      { dx:  16, dy:  16, rx: 25, ry: 18, rot:  0.20, op: 0.94 },
      { dx:  38, dy:  28, rx: 28, ry: 22, rot:  0.35, op: 0.95 },
      // 전방 쐐기 (Forward Wedge)
      { dx:  62, dy:  42, rx: 30, ry: 24, rot:  0.40, op: 0.95 },
      { dx:  74, dy:  60, rx: 32, ry: 24, rot:  0.30, op: 0.94 },
      { dx:  68, dy:  78, rx: 34, ry: 26, rot:  0.20, op: 0.92 },
      { dx:  50, dy:  92, rx: 36, ry: 28, rot:  0.10, op: 0.92 },
      // 지면 쇄도 및 파도면 밀착
      { dx:  26, dy:  60, rx: 34, ry: 28, rot:  0.15, op: 0.94 },
      { dx:   2, dy:  72, rx: 32, ry: 26, rot:  0.05, op: 0.92 },
      { dx: -20, dy:  82, rx: 30, ry: 24, rot: -0.05, op: 0.88 },
      { dx: -42, dy:  82, rx: 34, ry: 26, rot:  0.00, op: 0.94 },
      { dx: -60, dy:  78, rx: 30, ry: 24, rot: -0.05, op: 0.92 },
      { dx:  24, dy:  94, rx: 34, ry: 24, rot:  0.05, op: 0.92 },
      { dx: -28, dy:  36, rx: 22, ry: 18, rot: -0.20, op: 0.86 },
      { dx: -52, dy:  52, rx: 28, ry: 24, rot: -0.15, op: 0.92 },
    ];
    puffs.push(
      // 크레스트 천장 하단과 빈틈없이 이어지는 덮치는 순백 포말
      { dx: -26, dy: -26, rx: 28, ry: 22, rot: -0.15, op: 0.95 },
      { dx: -48, dy: -20, rx: 30, ry: 24, rot: -0.10, op: 0.96 },
      { dx: -70, dy: -10, rx: 32, ry: 25, rot: -0.05, op: 0.96 },
      { dx: -34, dy:   4, rx: 30, ry: 24, rot: -0.08, op: 0.96 },
      { dx: -56, dy:  16, rx: 32, ry: 25, rot: -0.05, op: 0.96 },
      { dx: -78, dy:  26, rx: 30, ry: 25, rot: -0.02, op: 0.95 },
      // 하단 지면 쇄도
      { dx: -76, dy:  46, rx: 28, ry: 24, rot: -0.10, op: 0.95 },
      { dx: -94, dy:  60, rx: 29, ry: 25, rot: -0.05, op: 0.95 },
      { dx: -78, dy:  76, rx: 32, ry: 26, rot:  0.00, op: 0.96 },
      { dx: -102, dy: 78, rx: 30, ry: 25, rot:  0.05, op: 0.95 },
      { dx: -86, dy:  92, rx: 34, ry: 26, rot:  0.05, op: 0.94 },
      { dx: -118, dy: 86, rx: 26, ry: 22, rot:  0.00, op: 0.90 }
    );
    droplets = [
      { dx:  88, dy:  36, r: 5.0, op: 0.92 },
      { dx:  92, dy:  56, r: 4.8, op: 0.90 },
      { dx:  84, dy:  76, r: 4.5, op: 0.88 },
      { dx:  66, dy: 100, r: 4.0, op: 0.85 },
      { dx:  38, dy:  -4, r: 3.5, op: 0.85 },
    ];
  } else {
    // F7: 전방을 광범위하게 휩쓰는 파쇄수 워시 (Deluge Wash)
    underclouds = [
      { dx:  44, dy: 52, rx: 62, ry: 38, rot: 0.25, op: 0.76 },
      { dx:   4, dy: 58, rx: 46, ry: 34, rot: 0.05, op: 0.70 },
      { dx:  78, dy: 66, rx: 48, ry: 32, rot: 0.30, op: 0.70 },
    ];
    underclouds.push(
      // F7 상단 립 천장 완전 차폐 (#39 상단 틈새 방지)
      { dx: -55, dy: -32, rx: 56, ry: 44, rot: -0.10, op: 0.96 },
      { dx: -82, dy: -24, rx: 58, ry: 44, rot: -0.06, op: 0.96 },
      { dx: -40, dy: -12, rx: 52, ry: 40, rot: -0.10, op: 0.92 },
      { dx: -65, dy:  12, rx: 54, ry: 40, rot: -0.05, op: 0.90 },
      { dx: -35, dy:  14, rx: 48, ry: 36, rot: -0.05, op: 0.88 },
      // 하단 세척 연결
      { dx: -10, dy:  22, rx: 45, ry: 30, rot:  0.10, op: 0.85 },
      { dx: -35, dy:  35, rx: 42, ry: 32, rot: -0.05, op: 0.85 },
      { dx: -65, dy:  55, rx: 45, ry: 36, rot:  0.00, op: 0.88 },
      { dx: -95, dy:  75, rx: 40, ry: 34, rot:  0.05, op: 0.85 }
    );
    puffs = [
      { dx: -12, dy:   0, rx: 24, ry: 20, rot:  0.00, op: 0.94 },
      { dx:  10, dy:  -6, rx: 26, ry: 22, rot:  0.15, op: 0.95 },
      { dx:   8, dy:  18, rx: 24, ry: 16, rot:  0.10, op: 0.92 },
      { dx:  32, dy:  26, rx: 28, ry: 20, rot:  0.25, op: 0.94 },
      { dx:  56, dy:  38, rx: 30, ry: 22, rot:  0.35, op: 0.95 },
      // 광폭 쇄도 첨단
      { dx:  82, dy:  54, rx: 34, ry: 24, rot:  0.35, op: 0.95 },
      { dx:  96, dy:  72, rx: 36, ry: 24, rot:  0.25, op: 0.94 },
      { dx:  88, dy:  90, rx: 38, ry: 26, rot:  0.15, op: 0.92 },
      { dx:  66, dy: 102, rx: 40, ry: 28, rot:  0.08, op: 0.92 },
      // 지면 세척
      { dx:  38, dy:  72, rx: 36, ry: 28, rot:  0.10, op: 0.94 },
      { dx:  12, dy:  84, rx: 35, ry: 26, rot:  0.00, op: 0.92 },
      { dx: -12, dy:  92, rx: 32, ry: 24, rot: -0.05, op: 0.88 },
      { dx:  38, dy: 104, rx: 38, ry: 24, rot:  0.00, op: 0.92 },
      { dx: -18, dy:  48, rx: 24, ry: 18, rot: -0.15, op: 0.85 },
    ];
    puffs.push(
      // 크레스트와 완벽히 융합되는 상단 쇄파 포말 (#39 집중 보강)
      { dx: -52, dy: -38, rx: 36, ry: 28, rot: -0.12, op: 0.98 },
      { dx: -78, dy: -30, rx: 38, ry: 28, rot: -0.08, op: 0.98 },
      { dx: -98, dy: -18, rx: 40, ry: 30, rot: -0.04, op: 0.98 },
      { dx: -24, dy: -24, rx: 28, ry: 22, rot: -0.12, op: 0.96 },
      { dx: -46, dy: -18, rx: 30, ry: 24, rot: -0.08, op: 0.96 },
      { dx: -68, dy:  -6, rx: 32, ry: 25, rot: -0.04, op: 0.96 },
      { dx: -32, dy:   6, rx: 30, ry: 24, rot: -0.05, op: 0.95 },
      { dx: -55, dy:  16, rx: 32, ry: 25, rot: -0.02, op: 0.95 },
      // 하단 세척
      { dx: -32, dy:  22, rx: 26, ry: 22, rot: -0.10, op: 0.94 },
      { dx: -54, dy:  42, rx: 28, ry: 24, rot: -0.05, op: 0.95 },
      { dx: -76, dy:  62, rx: 32, ry: 26, rot:  0.00, op: 0.95 },
      { dx: -98, dy:  80, rx: 34, ry: 26, rot:  0.05, op: 0.92 }
    );
    droplets = [
      { dx: 112, dy:  52, r: 5.2, op: 0.92 },
      { dx: 116, dy:  72, r: 4.8, op: 0.90 },
      { dx: 104, dy:  92, r: 4.6, op: 0.88 },
      { dx:  84, dy: 112, r: 4.2, op: 0.85 },
      { dx:  54, dy:   8, r: 3.8, op: 0.85 },
    ];
  }

  // 1. 대형 언더클라우드 (소프트 바디)
  for (let i = 0; i < underclouds.length; i++) {
    const uc = underclouds[i];
    ctx.save();
    const px = cx + dir * (uc.dx * scale);
    const py = cy + uc.dy * scale;
    const rx = uc.rx * scale;
    const ry = uc.ry * scale;
    ctx.translate(px, py);
    ctx.rotate(dir * uc.rot);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${uc.op * alpha})`);
    grad.addColorStop(0.50, `rgba(250, 253, 255, ${uc.op * 0.85 * alpha})`);
    grad.addColorStop(0.80, `rgba(224, 242, 254, ${uc.op * 0.35 * alpha})`);
    grad.addColorStop(1.00, "rgba(224, 242, 254, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. 다층 유기적 수증기/포말 퍼프
  for (let i = 0; i < puffs.length; i++) {
    const p = puffs[i];
    ctx.save();
    const px = cx + dir * (p.dx * scale);
    const py = cy + p.dy * scale;
    const rx = p.rx * scale;
    const ry = p.ry * scale;
    ctx.translate(px, py);
    ctx.rotate(dir * p.rot);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${p.op * alpha})`);
    grad.addColorStop(0.38, `rgba(255, 255, 255, ${p.op * 0.90 * alpha})`);
    grad.addColorStop(0.68, `rgba(240, 249, 255, ${p.op * 0.58 * alpha})`);
    grad.addColorStop(0.88, `rgba(224, 242, 254, ${p.op * 0.22 * alpha})`);
    grad.addColorStop(1.00, "rgba(224, 242, 254, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. 비산하는 수적 및 포말 스파크
  for (let i = 0; i < droplets.length; i++) {
    const d = droplets[i];
    const px = cx + dir * (d.dx * scale);
    const py = cy + d.dy * scale;
    const r = d.r * Math.max(0.7, scale);

    const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 1.5);
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${d.op * alpha})`);
    grad.addColorStop(0.60, `rgba(255, 255, 255, ${d.op * 0.85 * alpha})`);
    grad.addColorStop(0.85, `rgba(224, 242, 254, ${d.op * 0.35 * alpha})`);
    grad.addColorStop(1.00, "rgba(224, 242, 254, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * [유저 요청 엄수]: "상대방이 시전하는 파도타기에는 이쪽에도 수증기"
 * [유저 피드백 엄수]: "시전포켓몬이 상대인경우 저 빨간 부분 수증기 좀더 투명도가 낮아야 덮치는 파도로 보일듯"
 * [유저 피드백 엄수]: "수증기 채우라는거였는데", "적대시전 시 수증기 빈틈은 해결도 안했네?" (#30 5, #31 6, #32 7)
 * - 상대방 시전 시(dir = -1) 카메라 방향으로 정면 노출되는 파도 배럴 내부 공동(Cavity)과 천장 아치의
 *   모든 빈틈을 불투명도 높은(투명도가 낮은) 순백 뭉게구름과 쇄파 포말로 완벽히 채워 덮치는 파도로 완성
 */
function drawWaveInnerArchSteam(
  ctx: any,
  ax: number,
  bottomY: number,
  H: number,
  dir: number,
  advX: number = 0,
  waveFrame: number = 4,
  alpha: number = 1.0
) {
  if (dir !== -1 || alpha <= 0.01 || H < 40) return;
  if (waveFrame < 0 || waveFrame > 7) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 프레임별 유저 적색 원형 지정 영역(nx, ny) 완벽 충전 빌로우 & 퍼프 정의
  // nx: (px - (ax + advX)) / (dir * H) -> dir = -1이므로 좌측(타겟 방향)으로 갈수록 nx 증가
  // ny: (bottomY - py) / H -> 바닥(bottomY)에서 위로 갈수록 ny 증가 (크레스트 상단 ny ~ 0.95)
  interface ArchBillow {
    nx: number;
    ny: number;
    rx: number;
    ry: number;
    rot: number;
    op: number;
  }

  let billows: ArchBillow[] = [];
  let crispPuffs: ArchBillow[] = [];

  if (waveFrame === 0) {
    // [F0 / Frame 26 (moveStep: 1, waveFrame: 0)]: 기저부 수면 사선 물 혀 & 발원 아치 수증기 밀착 보강
    billows.push(
      // 1. 솟구치는 물 혀 전방 팁 하부 (nx ~ 0.75..0.92, ny ~ 0.32..0.52)
      { nx: 0.90, ny: 0.40, rx: 34, ry: 26, rot:  0.25, op: 0.98 },
      { nx: 0.85, ny: 0.46, rx: 36, ry: 28, rot:  0.20, op: 0.98 },
      { nx: 0.80, ny: 0.38, rx: 35, ry: 28, rot:  0.22, op: 0.97 },
      { nx: 0.76, ny: 0.48, rx: 38, ry: 30, rot:  0.15, op: 0.98 },

      // 2. 융기 경사면 및 천장 하단 (nx ~ 0.50..0.74, ny ~ 0.36..0.58)
      { nx: 0.72, ny: 0.44, rx: 40, ry: 32, rot:  0.12, op: 0.98 },
      { nx: 0.68, ny: 0.52, rx: 42, ry: 34, rot:  0.08, op: 0.98 },
      { nx: 0.64, ny: 0.58, rx: 40, ry: 32, rot:  0.04, op: 0.98 },
      { nx: 0.60, ny: 0.42, rx: 42, ry: 34, rot:  0.04, op: 0.98 },
      { nx: 0.56, ny: 0.52, rx: 44, ry: 36, rot:  0.00, op: 0.98 },
      { nx: 0.52, ny: 0.40, rx: 42, ry: 34, rot: -0.04, op: 0.98 },

      // 3. 기저부 발원지 및 수면 포말 연결부 (nx ~ 0.20..0.48, ny ~ 0.30..0.52)
      { nx: 0.46, ny: 0.44, rx: 42, ry: 34, rot: -0.06, op: 0.98 },
      { nx: 0.42, ny: 0.36, rx: 40, ry: 32, rot: -0.08, op: 0.97 },
      { nx: 0.38, ny: 0.46, rx: 40, ry: 32, rot: -0.10, op: 0.98 },
      { nx: 0.32, ny: 0.35, rx: 38, ry: 30, rot: -0.12, op: 0.96 },
      { nx: 0.26, ny: 0.38, rx: 36, ry: 28, rot: -0.15, op: 0.95 },
      { nx: 0.20, ny: 0.36, rx: 34, ry: 26, rot: -0.18, op: 0.93 }
    );

    crispPuffs.push(
      { nx: 0.88, ny: 0.42, rx: 22, ry: 16, rot:  0.24, op: 0.98 },
      { nx: 0.82, ny: 0.48, rx: 24, ry: 18, rot:  0.18, op: 0.98 },
      { nx: 0.76, ny: 0.44, rx: 26, ry: 20, rot:  0.12, op: 0.98 },
      { nx: 0.70, ny: 0.52, rx: 28, ry: 22, rot:  0.06, op: 0.98 },
      { nx: 0.64, ny: 0.46, rx: 28, ry: 22, rot:  0.02, op: 0.98 },
      { nx: 0.58, ny: 0.52, rx: 30, ry: 24, rot: -0.02, op: 0.98 },
      { nx: 0.52, ny: 0.44, rx: 28, ry: 22, rot: -0.06, op: 0.98 },
      { nx: 0.44, ny: 0.40, rx: 26, ry: 20, rot: -0.08, op: 0.98 },
      { nx: 0.36, ny: 0.42, rx: 26, ry: 20, rot: -0.12, op: 0.97 },
      { nx: 0.28, ny: 0.36, rx: 24, ry: 18, rot: -0.15, op: 0.95 },
      { nx: 0.22, ny: 0.36, rx: 22, ry: 16, rot: -0.18, op: 0.93 }
    );
  } else if (waveFrame === 1) {
    // [F1 / Frame 27 (moveStep: 2, waveFrame: 1)]: 물 혀 상승 & 아치 형성기 수증기 완전 밀착 보강
    billows.push(
      // 1. 앞으로 솟구치며 꺾이는 립 하단 전방 홈 (nx ~ 0.78..0.94, ny ~ 0.35..0.55)
      { nx: 0.93, ny: 0.42, rx: 36, ry: 28, rot:  0.24, op: 0.98 },
      { nx: 0.88, ny: 0.48, rx: 38, ry: 30, rot:  0.18, op: 0.98 },
      { nx: 0.84, ny: 0.40, rx: 36, ry: 28, rot:  0.22, op: 0.97 },
      { nx: 0.80, ny: 0.52, rx: 42, ry: 32, rot:  0.14, op: 0.98 },
      { nx: 0.76, ny: 0.42, rx: 40, ry: 30, rot:  0.16, op: 0.97 },

      // 2. 배럴 아치 천장 곡선부 (nx ~ 0.52..0.76, ny ~ 0.40..0.62)
      { nx: 0.74, ny: 0.48, rx: 44, ry: 34, rot:  0.12, op: 0.98 },
      { nx: 0.70, ny: 0.56, rx: 46, ry: 36, rot:  0.06, op: 0.98 },
      { nx: 0.67, ny: 0.62, rx: 44, ry: 34, rot:  0.02, op: 0.98 },
      { nx: 0.63, ny: 0.46, rx: 46, ry: 36, rot:  0.04, op: 0.98 },
      { nx: 0.60, ny: 0.56, rx: 48, ry: 38, rot: -0.02, op: 0.98 },
      { nx: 0.56, ny: 0.64, rx: 44, ry: 34, rot: -0.04, op: 0.98 },
      { nx: 0.53, ny: 0.48, rx: 46, ry: 36, rot: -0.04, op: 0.98 },
      { nx: 0.50, ny: 0.58, rx: 48, ry: 38, rot: -0.06, op: 0.98 },

      // 3. 내측 공동 및 지면 포말 연결부 (nx ~ 0.22..0.50, ny ~ 0.34..0.56)
      { nx: 0.46, ny: 0.44, rx: 44, ry: 34, rot: -0.06, op: 0.98 },
      { nx: 0.44, ny: 0.54, rx: 44, ry: 34, rot: -0.08, op: 0.98 },
      { nx: 0.40, ny: 0.38, rx: 42, ry: 32, rot: -0.08, op: 0.97 },
      { nx: 0.37, ny: 0.48, rx: 42, ry: 32, rot: -0.12, op: 0.98 },
      { nx: 0.34, ny: 0.38, rx: 40, ry: 30, rot: -0.12, op: 0.96 },
      { nx: 0.30, ny: 0.46, rx: 40, ry: 30, rot: -0.15, op: 0.97 },
      { nx: 0.26, ny: 0.38, rx: 38, ry: 28, rot: -0.16, op: 0.95 },
      { nx: 0.22, ny: 0.40, rx: 34, ry: 26, rot: -0.18, op: 0.93 }
    );

    crispPuffs.push(
      { nx: 0.92, ny: 0.44, rx: 24, ry: 18, rot:  0.24, op: 0.98 },
      { nx: 0.86, ny: 0.50, rx: 26, ry: 20, rot:  0.18, op: 0.98 },
      { nx: 0.80, ny: 0.46, rx: 28, ry: 22, rot:  0.14, op: 0.98 },
      { nx: 0.76, ny: 0.54, rx: 30, ry: 24, rot:  0.08, op: 0.98 },
      { nx: 0.70, ny: 0.48, rx: 28, ry: 22, rot:  0.06, op: 0.98 },
      { nx: 0.66, ny: 0.58, rx: 30, ry: 24, rot:  0.02, op: 0.98 },
      { nx: 0.60, ny: 0.50, rx: 32, ry: 24, rot:  0.00, op: 0.98 },
      { nx: 0.56, ny: 0.56, rx: 32, ry: 24, rot: -0.04, op: 0.98 },
      { nx: 0.50, ny: 0.48, rx: 30, ry: 22, rot: -0.04, op: 0.98 },
      { nx: 0.46, ny: 0.54, rx: 30, ry: 22, rot: -0.08, op: 0.98 },
      { nx: 0.40, ny: 0.42, rx: 28, ry: 20, rot: -0.08, op: 0.98 },
      { nx: 0.36, ny: 0.50, rx: 28, ry: 20, rot: -0.12, op: 0.98 },
      { nx: 0.30, ny: 0.42, rx: 26, ry: 18, rot: -0.14, op: 0.97 },
      { nx: 0.24, ny: 0.40, rx: 24, ry: 16, rot: -0.16, op: 0.95 }
    );
  } else if (waveFrame === 2) {
    // [F2 / Frame 28 (moveStep: 3, waveFrame: 2)]: 유저 적색 표기 (립 하단 아치 천장 및 내측 공동 수증기 보강)
    billows.push(
      // 1. 립 하단 전방 홈 & 팁 하부 (nx ~ 0.80..0.96, ny ~ 0.38..0.58)
      { nx: 0.96, ny: 0.45, rx: 38, ry: 30, rot:  0.22, op: 0.98 },
      { nx: 0.92, ny: 0.52, rx: 40, ry: 32, rot:  0.18, op: 0.98 },
      { nx: 0.88, ny: 0.42, rx: 38, ry: 30, rot:  0.25, op: 0.97 },
      { nx: 0.84, ny: 0.50, rx: 44, ry: 34, rot:  0.15, op: 0.98 },
      { nx: 0.80, ny: 0.56, rx: 44, ry: 34, rot:  0.10, op: 0.98 },
      { nx: 0.78, ny: 0.42, rx: 42, ry: 32, rot:  0.18, op: 0.97 },

      // 2. 아치 천장 곡선부 (유저 적색 표기 중심부: nx ~ 0.54..0.78, ny ~ 0.44..0.66)
      { nx: 0.76, ny: 0.50, rx: 48, ry: 38, rot:  0.12, op: 0.98 },
      { nx: 0.72, ny: 0.58, rx: 50, ry: 40, rot:  0.08, op: 0.98 },
      { nx: 0.70, ny: 0.65, rx: 48, ry: 38, rot:  0.04, op: 0.98 },
      { nx: 0.66, ny: 0.48, rx: 50, ry: 40, rot:  0.06, op: 0.98 },
      { nx: 0.64, ny: 0.58, rx: 52, ry: 42, rot:  0.00, op: 0.98 },
      { nx: 0.60, ny: 0.66, rx: 48, ry: 38, rot: -0.04, op: 0.98 },
      { nx: 0.56, ny: 0.50, rx: 50, ry: 40, rot: -0.02, op: 0.98 },
      { nx: 0.54, ny: 0.60, rx: 52, ry: 42, rot: -0.06, op: 0.98 },

      // 3. 내측 공동 및 지면 포말 연결부 (nx ~ 0.22..0.52, ny ~ 0.36..0.58)
      { nx: 0.50, ny: 0.46, rx: 48, ry: 38, rot: -0.05, op: 0.98 },
      { nx: 0.48, ny: 0.56, rx: 48, ry: 38, rot: -0.08, op: 0.98 },
      { nx: 0.44, ny: 0.42, rx: 46, ry: 36, rot: -0.08, op: 0.97 },
      { nx: 0.42, ny: 0.52, rx: 46, ry: 36, rot: -0.12, op: 0.98 },
      { nx: 0.38, ny: 0.40, rx: 44, ry: 34, rot: -0.12, op: 0.96 },
      { nx: 0.35, ny: 0.48, rx: 44, ry: 34, rot: -0.15, op: 0.97 },
      { nx: 0.30, ny: 0.40, rx: 40, ry: 32, rot: -0.15, op: 0.95 },
      { nx: 0.26, ny: 0.42, rx: 38, ry: 30, rot: -0.18, op: 0.93 },
      { nx: 0.22, ny: 0.44, rx: 36, ry: 28, rot: -0.20, op: 0.92 }
    );

    crispPuffs.push(
      { nx: 0.94, ny: 0.46, rx: 26, ry: 20, rot:  0.22, op: 0.98 },
      { nx: 0.90, ny: 0.52, rx: 28, ry: 22, rot:  0.16, op: 0.98 },
      { nx: 0.84, ny: 0.50, rx: 30, ry: 24, rot:  0.12, op: 0.98 },
      { nx: 0.80, ny: 0.58, rx: 32, ry: 25, rot:  0.08, op: 0.98 },
      { nx: 0.75, ny: 0.50, rx: 30, ry: 24, rot:  0.06, op: 0.98 },
      { nx: 0.70, ny: 0.60, rx: 32, ry: 25, rot:  0.02, op: 0.98 },
      { nx: 0.65, ny: 0.52, rx: 34, ry: 26, rot:  0.00, op: 0.98 },
      { nx: 0.60, ny: 0.58, rx: 34, ry: 26, rot: -0.04, op: 0.98 },
      { nx: 0.55, ny: 0.50, rx: 32, ry: 25, rot: -0.04, op: 0.98 },
      { nx: 0.50, ny: 0.56, rx: 32, ry: 25, rot: -0.08, op: 0.98 },
      { nx: 0.46, ny: 0.44, rx: 30, ry: 24, rot: -0.08, op: 0.98 },
      { nx: 0.42, ny: 0.52, rx: 30, ry: 24, rot: -0.12, op: 0.98 },
      { nx: 0.36, ny: 0.44, rx: 28, ry: 22, rot: -0.14, op: 0.97 },
      { nx: 0.30, ny: 0.42, rx: 26, ry: 20, rot: -0.16, op: 0.95 },
      { nx: 0.24, ny: 0.42, rx: 24, ry: 18, rot: -0.18, op: 0.93 }
    );
  } else if (waveFrame === 3) {
    // [F3 / Frame 28 (waveFrame: 3)]: 유저 적색 표기 배럴 천장 및 아치 내측 수증기 집중 보강
    // 1. 립 하단 홈 & 쇄파 팁 하부 (nx ~ 0.82..0.96, ny ~ 0.40..0.58)
    billows.push(
      { nx: 0.94, ny: 0.46, rx: 38, ry: 32, rot:  0.22, op: 0.98 },
      { nx: 0.90, ny: 0.52, rx: 42, ry: 34, rot:  0.18, op: 0.98 },
      { nx: 0.88, ny: 0.42, rx: 40, ry: 32, rot:  0.25, op: 0.97 },
      { nx: 0.84, ny: 0.50, rx: 44, ry: 36, rot:  0.15, op: 0.98 },
      { nx: 0.82, ny: 0.58, rx: 44, ry: 36, rot:  0.10, op: 0.98 },
      { nx: 0.80, ny: 0.44, rx: 42, ry: 34, rot:  0.18, op: 0.97 }
    );
    // 2. 배럴 튜브 아치 천장 곡선 (유저 적색 표기 중심부: nx ~ 0.58..0.80, ny ~ 0.45..0.66)
    billows.push(
      { nx: 0.78, ny: 0.48, rx: 48, ry: 38, rot:  0.12, op: 0.98 },
      { nx: 0.75, ny: 0.56, rx: 50, ry: 40, rot:  0.08, op: 0.98 },
      { nx: 0.72, ny: 0.64, rx: 48, ry: 38, rot:  0.04, op: 0.98 },
      { nx: 0.68, ny: 0.48, rx: 50, ry: 40, rot:  0.06, op: 0.98 },
      { nx: 0.65, ny: 0.58, rx: 52, ry: 42, rot:  0.00, op: 0.98 },
      { nx: 0.62, ny: 0.66, rx: 48, ry: 38, rot: -0.04, op: 0.98 },
      { nx: 0.58, ny: 0.50, rx: 50, ry: 40, rot: -0.02, op: 0.98 },
      { nx: 0.55, ny: 0.60, rx: 52, ry: 42, rot: -0.06, op: 0.98 }
    );
    // 3. 배럴 내부 공동 및 우측 하강 경사면 (바닥 포말과 매끄럽게 연결: nx ~ 0.28..0.52, ny ~ 0.38..0.62)
    billows.push(
      { nx: 0.50, ny: 0.46, rx: 48, ry: 38, rot: -0.05, op: 0.98 },
      { nx: 0.48, ny: 0.56, rx: 48, ry: 38, rot: -0.08, op: 0.98 },
      { nx: 0.44, ny: 0.42, rx: 46, ry: 36, rot: -0.08, op: 0.97 },
      { nx: 0.42, ny: 0.52, rx: 46, ry: 36, rot: -0.12, op: 0.98 },
      { nx: 0.38, ny: 0.40, rx: 44, ry: 34, rot: -0.12, op: 0.96 },
      { nx: 0.35, ny: 0.48, rx: 44, ry: 34, rot: -0.15, op: 0.97 },
      { nx: 0.30, ny: 0.42, rx: 42, ry: 32, rot: -0.15, op: 0.95 },
      { nx: 0.26, ny: 0.44, rx: 38, ry: 30, rot: -0.18, op: 0.93 }
    );

    // 고밀도 선명 순백 포말 퍼프 (크리스프한 거품 질감 및 빈틈 완전 차단)
    crispPuffs.push(
      { nx: 0.92, ny: 0.47, rx: 26, ry: 20, rot:  0.22, op: 0.98 },
      { nx: 0.88, ny: 0.53, rx: 28, ry: 22, rot:  0.16, op: 0.98 },
      { nx: 0.82, ny: 0.52, rx: 30, ry: 24, rot:  0.12, op: 0.98 },
      { nx: 0.78, ny: 0.58, rx: 32, ry: 25, rot:  0.08, op: 0.98 },
      { nx: 0.74, ny: 0.50, rx: 30, ry: 24, rot:  0.06, op: 0.98 },
      { nx: 0.70, ny: 0.60, rx: 32, ry: 25, rot:  0.02, op: 0.98 },
      { nx: 0.65, ny: 0.52, rx: 34, ry: 26, rot:  0.00, op: 0.98 },
      { nx: 0.60, ny: 0.58, rx: 34, ry: 26, rot: -0.04, op: 0.98 },
      { nx: 0.55, ny: 0.50, rx: 32, ry: 25, rot: -0.04, op: 0.98 },
      { nx: 0.50, ny: 0.56, rx: 32, ry: 25, rot: -0.08, op: 0.98 },
      { nx: 0.46, ny: 0.46, rx: 30, ry: 24, rot: -0.08, op: 0.98 },
      { nx: 0.42, ny: 0.52, rx: 30, ry: 24, rot: -0.12, op: 0.98 },
      { nx: 0.36, ny: 0.44, rx: 28, ry: 22, rot: -0.14, op: 0.97 },
      { nx: 0.30, ny: 0.42, rx: 26, ry: 20, rot: -0.16, op: 0.95 }
    );
  } else if (waveFrame === 4) {
    // [F4 / Frame 30]: 유저 적색 표기 (상단 크레스트와 사태 포말 사이 가로형 수면 띠)
    // nx ~ 0.05..0.90, ny ~ 0.46..0.82
    billows.push(
      { nx: 0.88, ny: 0.60, rx: 38, ry: 32, rot:  0.20, op: 0.96 },
      { nx: 0.76, ny: 0.68, rx: 42, ry: 35, rot:  0.10, op: 0.96 },
      { nx: 0.64, ny: 0.74, rx: 46, ry: 38, rot:  0.00, op: 0.96 },
      { nx: 0.50, ny: 0.77, rx: 48, ry: 38, rot: -0.06, op: 0.96 },
      { nx: 0.36, ny: 0.75, rx: 46, ry: 38, rot: -0.10, op: 0.96 },
      { nx: 0.24, ny: 0.70, rx: 44, ry: 35, rot: -0.15, op: 0.95 },
      { nx: 0.14, ny: 0.64, rx: 40, ry: 32, rot: -0.18, op: 0.94 },
      { nx: 0.06, ny: 0.56, rx: 34, ry: 28, rot: -0.20, op: 0.90 },
      // 하단 사태 포말과 융합하는 블렌드 레이어
      { nx: 0.70, ny: 0.56, rx: 40, ry: 34, rot:  0.08, op: 0.96 },
      { nx: 0.54, ny: 0.62, rx: 44, ry: 36, rot: -0.02, op: 0.96 },
      { nx: 0.38, ny: 0.60, rx: 44, ry: 35, rot: -0.08, op: 0.95 },
      { nx: 0.22, ny: 0.54, rx: 40, ry: 32, rot: -0.14, op: 0.94 }
    );

    crispPuffs.push(
      { nx: 0.84, ny: 0.63, rx: 26, ry: 22, rot:  0.15, op: 0.98 },
      { nx: 0.72, ny: 0.70, rx: 29, ry: 24, rot:  0.06, op: 0.98 },
      { nx: 0.58, ny: 0.75, rx: 32, ry: 25, rot: -0.02, op: 0.98 },
      { nx: 0.44, ny: 0.76, rx: 32, ry: 25, rot: -0.08, op: 0.98 },
      { nx: 0.30, ny: 0.72, rx: 30, ry: 24, rot: -0.12, op: 0.98 },
      { nx: 0.18, ny: 0.66, rx: 26, ry: 22, rot: -0.16, op: 0.96 },
      { nx: 0.08, ny: 0.58, rx: 24, ry: 20, rot: -0.18, op: 0.92 },
      { nx: 0.62, ny: 0.60, rx: 28, ry: 22, rot:  0.02, op: 0.97 },
      { nx: 0.46, ny: 0.64, rx: 29, ry: 23, rot: -0.06, op: 0.97 },
      { nx: 0.32, ny: 0.60, rx: 28, ry: 22, rot: -0.10, op: 0.96 }
    );
  } else if (waveFrame === 5) {
    // [F5 / Frame 31]: 유저 적색 표기 (파도 아치 내부 오목한 수면 공동 전체)
    // nx ~ 0.06..0.85, ny ~ 0.32..0.78
    billows.push(
      { nx: 0.85, ny: 0.56, rx: 40, ry: 32, rot:  0.18, op: 0.96 },
      { nx: 0.72, ny: 0.65, rx: 44, ry: 36, rot:  0.08, op: 0.96 },
      { nx: 0.58, ny: 0.72, rx: 48, ry: 38, rot:  0.00, op: 0.96 },
      { nx: 0.44, ny: 0.73, rx: 48, ry: 38, rot: -0.06, op: 0.96 },
      { nx: 0.30, ny: 0.70, rx: 44, ry: 36, rot: -0.12, op: 0.96 },
      { nx: 0.18, ny: 0.62, rx: 40, ry: 32, rot: -0.16, op: 0.94 },
      { nx: 0.10, ny: 0.54, rx: 36, ry: 28, rot: -0.20, op: 0.90 },
      // 배럴 아치 내부 깊은 공동 (유저 적색 표기 공동 틈새 완전 충전)
      { nx: 0.52, ny: 0.48, rx: 44, ry: 36, rot: -0.04, op: 0.96 },
      { nx: 0.38, ny: 0.46, rx: 46, ry: 36, rot: -0.08, op: 0.96 },
      { nx: 0.24, ny: 0.44, rx: 44, ry: 34, rot: -0.12, op: 0.95 },
      { nx: 0.14, ny: 0.42, rx: 38, ry: 30, rot: -0.16, op: 0.92 },
      { nx: 0.32, ny: 0.36, rx: 42, ry: 32, rot: -0.10, op: 0.94 },
      { nx: 0.46, ny: 0.38, rx: 42, ry: 32, rot: -0.06, op: 0.95 },
      // 하단 쇄도 파면과 융합 블렌드
      { nx: 0.66, ny: 0.54, rx: 40, ry: 32, rot:  0.05, op: 0.96 },
      { nx: 0.50, ny: 0.58, rx: 44, ry: 34, rot: -0.04, op: 0.96 },
      { nx: 0.34, ny: 0.56, rx: 42, ry: 32, rot: -0.10, op: 0.95 }
    );

    crispPuffs.push(
      { nx: 0.80, ny: 0.59, rx: 28, ry: 22, rot:  0.12, op: 0.98 },
      { nx: 0.68, ny: 0.67, rx: 30, ry: 24, rot:  0.05, op: 0.98 },
      { nx: 0.54, ny: 0.72, rx: 32, ry: 26, rot: -0.02, op: 0.98 },
      { nx: 0.40, ny: 0.72, rx: 32, ry: 26, rot: -0.08, op: 0.98 },
      { nx: 0.26, ny: 0.67, rx: 30, ry: 24, rot: -0.12, op: 0.97 },
      { nx: 0.14, ny: 0.58, rx: 26, ry: 20, rot: -0.16, op: 0.95 },
      // 공동 내부 포말 퍼프
      { nx: 0.48, ny: 0.46, rx: 29, ry: 23, rot: -0.04, op: 0.97 },
      { nx: 0.34, ny: 0.44, rx: 30, ry: 24, rot: -0.08, op: 0.97 },
      { nx: 0.20, ny: 0.42, rx: 28, ry: 22, rot: -0.14, op: 0.95 },
      { nx: 0.38, ny: 0.36, rx: 28, ry: 22, rot: -0.08, op: 0.96 },
      { nx: 0.58, ny: 0.56, rx: 28, ry: 22, rot:  0.00, op: 0.97 },
      { nx: 0.42, ny: 0.58, rx: 29, ry: 23, rot: -0.05, op: 0.97 }
    );
  } else if (waveFrame === 6) {
    // [F6 / Frame 39 (moveStep: 7, waveFrame: 6)]: 유저 적색 원형 지정 영역(nx ~ 0.28..0.82, ny ~ -0.28..0.12) 완벽 밀폐 충전
    billows.push(
      // 1. 상단 크레스트 및 아치 천장 곡선부
      { nx: 0.82, ny: 0.58, rx: 46, ry: 36, rot:  0.14, op: 0.98 },
      { nx: 0.74, ny: 0.65, rx: 50, ry: 40, rot:  0.08, op: 0.98 },
      { nx: 0.62, ny: 0.71, rx: 52, ry: 42, rot:  0.02, op: 0.98 },
      { nx: 0.48, ny: 0.72, rx: 52, ry: 42, rot: -0.04, op: 0.98 },
      { nx: 0.34, ny: 0.68, rx: 48, ry: 38, rot: -0.09, op: 0.97 },
      { nx: 0.20, ny: 0.60, rx: 44, ry: 34, rot: -0.14, op: 0.95 },

      // 2. 아치 내부 공동 코어 (nx ~ 0.20..0.70, ny ~ 0.20..0.55)
      { nx: 0.68, ny: 0.45, rx: 50, ry: 40, rot:  0.06, op: 0.98 },
      { nx: 0.56, ny: 0.48, rx: 52, ry: 42, rot:  0.00, op: 0.98 },
      { nx: 0.44, ny: 0.48, rx: 52, ry: 42, rot: -0.05, op: 0.98 },
      { nx: 0.32, ny: 0.44, rx: 48, ry: 38, rot: -0.10, op: 0.97 },
      { nx: 0.20, ny: 0.38, rx: 44, ry: 34, rot: -0.14, op: 0.95 },
      { nx: 0.55, ny: 0.28, rx: 54, ry: 44, rot: -0.02, op: 0.99 },
      { nx: 0.40, ny: 0.26, rx: 52, ry: 42, rot: -0.05, op: 0.99 },
      { nx: 0.68, ny: 0.28, rx: 52, ry: 42, rot:  0.03, op: 0.99 },

      // 3. [유저 적색 원형 지정 구역 - 우측 배럴-립 사이 푸른 구멍 완전 밀폐 충전]:
      // worldX ~ 340..395, worldY ~ 35..95 => nx ~ -0.04..0.18, ny ~ 0.22..0.52
      { nx:  0.07, ny: 0.37, rx: 65, ry: 52, rot:  0.06, op: 1.0 },
      { nx:  0.07, ny: 0.46, rx: 62, ry: 50, rot:  0.02, op: 1.0 },
      { nx:  0.05, ny: 0.28, rx: 62, ry: 50, rot:  0.08, op: 1.0 },
      { nx:  0.13, ny: 0.38, rx: 64, ry: 52, rot:  0.04, op: 1.0 },
      { nx:  0.00, ny: 0.36, rx: 60, ry: 48, rot:  0.10, op: 1.0 },
      { nx: -0.03, ny: 0.42, rx: 58, ry: 46, rot:  0.08, op: 1.0 },
      { nx:  0.15, ny: 0.48, rx: 60, ry: 48, rot:  0.00, op: 1.0 },
      { nx:  0.12, ny: 0.28, rx: 60, ry: 48, rot:  0.06, op: 1.0 },
      { nx: -0.02, ny: 0.30, rx: 56, ry: 46, rot:  0.12, op: 1.0 },
      { nx:  0.06, ny: 0.22, rx: 58, ry: 46, rot:  0.08, op: 1.0 },
      { nx:  0.08, ny: 0.52, rx: 58, ry: 46, rot:  0.00, op: 1.0 },

      // 4. 좌측 쇄도 파면 연결부 밀착
      { nx: 0.28, ny: 0.34, rx: 56, ry: 46, rot: -0.06, op: 0.99 },
      { nx: 0.35, ny: 0.42, rx: 56, ry: 46, rot: -0.08, op: 0.99 },
      { nx: 0.22, ny: 0.26, rx: 54, ry: 44, rot: -0.04, op: 0.99 }
    );

    crispPuffs.push(
      // 상단 아치
      { nx: 0.78, ny: 0.60, rx: 30, ry: 24, rot:  0.10, op: 0.98 },
      { nx: 0.66, ny: 0.67, rx: 32, ry: 25, rot:  0.04, op: 0.98 },
      { nx: 0.52, ny: 0.71, rx: 34, ry: 26, rot: -0.02, op: 0.98 },
      { nx: 0.38, ny: 0.67, rx: 32, ry: 25, rot: -0.06, op: 0.98 },
      { nx: 0.26, ny: 0.59, rx: 28, ry: 22, rot: -0.11, op: 0.96 },

      // 푸른 구멍 중심부 선명 순백 포말 퍼프
      { nx:  0.07, ny: 0.37, rx: 44, ry: 36, rot:  0.06, op: 1.0 },
      { nx:  0.09, ny: 0.44, rx: 42, ry: 34, rot:  0.02, op: 1.0 },
      { nx:  0.04, ny: 0.30, rx: 42, ry: 34, rot:  0.08, op: 1.0 },
      { nx:  0.13, ny: 0.37, rx: 44, ry: 36, rot:  0.04, op: 1.0 },
      { nx:  0.00, ny: 0.37, rx: 40, ry: 32, rot:  0.10, op: 1.0 },
      { nx: -0.02, ny: 0.43, rx: 38, ry: 30, rot:  0.08, op: 1.0 },
      { nx:  0.14, ny: 0.47, rx: 40, ry: 32, rot:  0.00, op: 1.0 },
      { nx:  0.10, ny: 0.29, rx: 42, ry: 34, rot:  0.06, op: 1.0 }
    );
  } else if (waveFrame === 7) {
    // [F7 / Frame 39 (moveStep: 8, waveFrame: 7)]: 유저 적색 표기 (상단 아치 천장 및 배럴 공동 수증기 집중 보강)
    // 1. 상단 크레스트 아치 곡선부 (유저 적색 표기 집중 구역: nx ~ 0.40..0.85, ny ~ 0.56..0.76)
    billows.push(
      { nx: 0.82, ny: 0.58, rx: 46, ry: 36, rot:  0.15, op: 0.98 },
      { nx: 0.75, ny: 0.66, rx: 50, ry: 40, rot:  0.10, op: 0.98 },
      { nx: 0.66, ny: 0.72, rx: 52, ry: 42, rot:  0.04, op: 0.98 },
      { nx: 0.54, ny: 0.74, rx: 54, ry: 42, rot: -0.02, op: 0.98 },
      { nx: 0.42, ny: 0.72, rx: 52, ry: 40, rot: -0.06, op: 0.98 },
      { nx: 0.30, ny: 0.68, rx: 48, ry: 38, rot: -0.10, op: 0.97 },
      { nx: 0.18, ny: 0.60, rx: 44, ry: 34, rot: -0.15, op: 0.95 }
    );

    // 2. 아치 내부 공동 코어 (볼륨 밀착 및 유저 적색 표기 완전 충전)
    billows.push(
      { nx: 0.74, ny: 0.52, rx: 48, ry: 38, rot:  0.10, op: 0.98 },
      { nx: 0.62, ny: 0.58, rx: 52, ry: 42, rot:  0.02, op: 0.98 },
      { nx: 0.50, ny: 0.62, rx: 54, ry: 42, rot: -0.04, op: 0.98 },
      { nx: 0.38, ny: 0.58, rx: 50, ry: 40, rot: -0.08, op: 0.98 },
      { nx: 0.26, ny: 0.52, rx: 46, ry: 36, rot: -0.12, op: 0.96 },
      { nx: 0.55, ny: 0.48, rx: 48, ry: 36, rot: -0.02, op: 0.96 },
      { nx: 0.42, ny: 0.46, rx: 46, ry: 36, rot: -0.06, op: 0.96 },
      { nx: 0.16, ny: 0.44, rx: 40, ry: 30, rot: -0.16, op: 0.92 }
    );

    // 3. 고밀도 순백 포말 퍼프 (아치 천장과 파도 경계면 초밀착 차폐)
    crispPuffs.push(
      { nx: 0.80, ny: 0.62, rx: 30, ry: 24, rot:  0.12, op: 0.98 },
      { nx: 0.70, ny: 0.68, rx: 32, ry: 26, rot:  0.06, op: 0.98 },
      { nx: 0.60, ny: 0.73, rx: 34, ry: 27, rot:  0.00, op: 0.98 },
      { nx: 0.48, ny: 0.73, rx: 34, ry: 27, rot: -0.05, op: 0.98 },
      { nx: 0.36, ny: 0.68, rx: 32, ry: 25, rot: -0.08, op: 0.98 },
      { nx: 0.24, ny: 0.60, rx: 28, ry: 22, rot: -0.12, op: 0.96 },
      { nx: 0.64, ny: 0.58, rx: 32, ry: 25, rot:  0.02, op: 0.98 },
      { nx: 0.50, ny: 0.58, rx: 32, ry: 25, rot: -0.04, op: 0.98 },
      { nx: 0.38, ny: 0.54, rx: 30, ry: 24, rot: -0.08, op: 0.97 },
      { nx: 0.28, ny: 0.48, rx: 28, ry: 22, rot: -0.12, op: 0.95 }
    );

    // 4. [유저 요청 엄수]: 39번 프레임 우측 중하단 공동 구멍 완전 밀폐 충전 (nx ~ 0.14..0.74, ny ~ -0.02..0.40)
    billows.push(
      // 중앙 코어
      { nx: 0.50, ny: 0.12, rx: 56, ry: 46, rot:  0.00, op: 0.99 },
      { nx: 0.50, ny: 0.25, rx: 54, ry: 44, rot: -0.02, op: 0.99 },
      { nx: 0.50, ny: 0.38, rx: 52, ry: 42, rot: -0.04, op: 0.99 },
      { nx: 0.50, ny: 0.00, rx: 52, ry: 42, rot:  0.02, op: 0.98 },
      // 좌측 연결부
      { nx: 0.64, ny: 0.14, rx: 56, ry: 46, rot:  0.05, op: 0.99 },
      { nx: 0.64, ny: 0.28, rx: 54, ry: 44, rot:  0.02, op: 0.99 },
      { nx: 0.64, ny: 0.40, rx: 52, ry: 42, rot:  0.00, op: 0.99 },
      { nx: 0.64, ny: 0.02, rx: 52, ry: 42, rot:  0.04, op: 0.98 },
      { nx: 0.74, ny: 0.18, rx: 52, ry: 42, rot:  0.08, op: 0.99 },
      { nx: 0.74, ny: 0.32, rx: 50, ry: 40, rot:  0.05, op: 0.99 },
      // 우측 연결부 (파도 벽 틈새 밀폐)
      { nx: 0.36, ny: 0.12, rx: 56, ry: 46, rot: -0.04, op: 0.99 },
      { nx: 0.36, ny: 0.25, rx: 54, ry: 44, rot: -0.06, op: 0.99 },
      { nx: 0.36, ny: 0.38, rx: 52, ry: 42, rot: -0.06, op: 0.99 },
      { nx: 0.36, ny: 0.00, rx: 52, ry: 42, rot: -0.02, op: 0.98 },
      { nx: 0.24, ny: 0.15, rx: 50, ry: 40, rot: -0.08, op: 0.98 },
      { nx: 0.24, ny: 0.28, rx: 48, ry: 38, rot: -0.10, op: 0.98 },
      { nx: 0.14, ny: 0.18, rx: 46, ry: 36, rot: -0.12, op: 0.97 },
      { nx: 0.14, ny: 0.30, rx: 44, ry: 34, rot: -0.14, op: 0.97 },

      // 우측 배럴-립 사이 푸른 구멍 완전 밀폐 충전
      { nx:  0.07, ny: 0.37, rx: 65, ry: 52, rot:  0.06, op: 1.0 },
      { nx:  0.07, ny: 0.46, rx: 62, ry: 50, rot:  0.02, op: 1.0 },
      { nx:  0.05, ny: 0.28, rx: 62, ry: 50, rot:  0.08, op: 1.0 },
      { nx:  0.13, ny: 0.38, rx: 64, ry: 52, rot:  0.04, op: 1.0 },
      { nx:  0.00, ny: 0.36, rx: 60, ry: 48, rot:  0.10, op: 1.0 },
      { nx: -0.03, ny: 0.42, rx: 58, ry: 46, rot:  0.08, op: 1.0 }
    );

    // 고밀도 순백 포말 퍼프 (구멍 중심부 집중 분사)
    crispPuffs.push(
      { nx: 0.50, ny: 0.14, rx: 36, ry: 30, rot:  0.00, op: 0.99 },
      { nx: 0.50, ny: 0.26, rx: 34, ry: 28, rot: -0.02, op: 0.99 },
      { nx: 0.62, ny: 0.16, rx: 36, ry: 30, rot:  0.04, op: 0.99 },
      { nx: 0.62, ny: 0.28, rx: 34, ry: 28, rot:  0.02, op: 0.99 },
      { nx: 0.38, ny: 0.14, rx: 36, ry: 30, rot: -0.04, op: 0.99 },
      { nx: 0.38, ny: 0.26, rx: 34, ry: 28, rot: -0.06, op: 0.99 },
      { nx: 0.28, ny: 0.18, rx: 32, ry: 26, rot: -0.08, op: 0.98 },
      { nx: 0.70, ny: 0.20, rx: 32, ry: 26, rot:  0.06, op: 0.98 },
      { nx: 0.50, ny: 0.36, rx: 34, ry: 28, rot:  0.00, op: 0.99 },
      { nx: 0.40, ny: 0.36, rx: 32, ry: 26, rot: -0.04, op: 0.99 },
      { nx:  0.07, ny: 0.37, rx: 44, ry: 36, rot:  0.06, op: 1.0 },
      { nx:  0.09, ny: 0.44, rx: 42, ry: 34, rot:  0.02, op: 1.0 },
      { nx:  0.04, ny: 0.30, rx: 42, ry: 34, rot:  0.08, op: 1.0 }
    );
  }

  const s = H / 180;

  // 1. 대형 순백 언더클라우드 빌로우 (부드러운 베이스 볼륨 및 틈새 밀폐)
  for (let i = 0; i < billows.length; i++) {
    const b = billows[i];
    const px = ax + dir * (H * b.nx) + advX;
    const py = bottomY - H * b.ny;
    const rx = b.rx * s;
    const ry = b.ry * s;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(dir * b.rot);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    // [유저 요청 엄수]: "수증기 좀더 투명도가 낮아야 덮치는 파도로 보일듯" (낮은 투명도 = 높은 불투명도 순백)
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${b.op * alpha})`);
    grad.addColorStop(0.55, `rgba(252, 254, 255, ${b.op * 0.94 * alpha})`);
    grad.addColorStop(0.82, `rgba(235, 246, 255, ${b.op * 0.55 * alpha})`);
    grad.addColorStop(1.00, "rgba(224, 242, 254, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. 선명한 고밀도 포말 퍼프 (크리스프한 질감 & 크레스트/립과의 완벽한 융합)
  for (let i = 0; i < crispPuffs.length; i++) {
    const p = crispPuffs[i];
    const px = ax + dir * (H * p.nx) + advX;
    const py = bottomY - H * p.ny;
    const rx = p.rx * s;
    const ry = p.ry * s;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(dir * p.rot);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${p.op * alpha})`);
    grad.addColorStop(0.45, `rgba(255, 255, 255, ${p.op * 0.96 * alpha})`);
    grad.addColorStop(0.75, `rgba(242, 250, 255, ${p.op * 0.70 * alpha})`);
    grad.addColorStop(0.92, `rgba(224, 244, 255, ${p.op * 0.28 * alpha})`);
    grad.addColorStop(1.00, "rgba(224, 242, 254, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 파도 아래부분의 반투명 파란색 흐림 (수증기 아래 레이어)
 * - [유저 요청 엄수]: "파도 아래부분에 반투명 파란색 흐림 (수증기 아래)"
 * - 파도의 하단부 및 지면 기저부에 부드럽게 퍼지는 반투명 오션 블루 블러 워시
 */
function drawWaveBottomBlueBlur(
  ctx: any,
  groundX: number,
  groundY: number,
  waveFrame: number,
  waveW: number = 75
) {
  ctx.save();

  // 바닥 지면 위치에 접지
  const baseY = groundY;
  // [유저 요청 엄수]: 파도 넓이(waveW)에 맞춰 반투명 파란색 흐림 범위 확장
  const r = waveW * 0.46;

  // 1. 메인 파도 하단 반투명 파란색 흐림 (Radial Blue Blur)
  const g1 = ctx.createRadialGradient(groundX, baseY, 0, groundX, baseY, r);
  g1.addColorStop(0.00, "rgba(8, 102, 235, 0.45)");
  g1.addColorStop(0.38, "rgba(6, 88, 210, 0.32)");
  g1.addColorStop(0.72, "rgba(24, 138, 250, 0.14)");
  g1.addColorStop(1.00, "rgba(8, 102, 235, 0.0)");
  ctx.fillStyle = g1;
  ctx.beginPath();
  ctx.arc(groundX, baseY, r, 0, Math.PI * 2);
  ctx.fill();

  // 2. 파도 하단 바닥 앰비언트 블루 흐림 (좌/우 파도 폭에 맞춰 넓게 퍼짐)
  const spreadX = waveW * 0.28;
  const r2 = r * 0.82;
  const g2 = ctx.createRadialGradient(groundX - spreadX, groundY, 0, groundX - spreadX, groundY, r2);
  g2.addColorStop(0.00, "rgba(6, 80, 195, 0.36)");
  g2.addColorStop(0.50, "rgba(10, 110, 240, 0.18)");
  g2.addColorStop(1.00, "rgba(10, 110, 240, 0.0)");
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(groundX - spreadX, groundY, r2, 0, Math.PI * 2);
  ctx.fill();

  const g3 = ctx.createRadialGradient(groundX + spreadX, groundY - 4, 0, groundX + spreadX, groundY - 4, r2);
  g3.addColorStop(0.00, "rgba(10, 110, 240, 0.36)");
  g3.addColorStop(0.50, "rgba(32, 150, 252, 0.15)");
  g3.addColorStop(1.00, "rgba(10, 110, 240, 0.0)");
  ctx.fillStyle = g3;
  ctx.beginPath();
  ctx.arc(groundX + spreadX, groundY - 4, r2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 1번 프레임 물줄기 시작 지점 바닥의 자연스러운 순백 수증기 (Localized Base Steam)
 */
function drawLocalizedBaseSteam(
  ctx: any,
  groundX: number,
  groundY: number,
  alpha: number = 1.0,
  waveFrame: number = 0,
  waveW: number = 75
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const fSeed = waveFrame * 1.7;
  const fTime = waveFrame;

  // [유저 요청 엄수]: "파도 넓이에 맞춰서 시전했던 수증기도 범위 넓어지게"
  // 파도의 실제 폭(waveW: 55~195px)에 비례하여 수증기의 배치 폭과 구름 크기 자동 확장
  const wScale = waveW / 75; // 0.73 (frame 0) -> 2.60 (frame 7)

  // 1. [유저 요청 엄수]: "근처에 투명도가 낮은 흰색 수증기 여러개"
  // - 파도 넓이에 맞춰 좌·우로 풍성하게 펼쳐지는 짙은 순백 뭉게구름 퍼프들
  const DENSE_WHITE_PUFFS = [
    // 중앙 코어
    { dx:   0, dy:  -6, r: 21, op: 0.96 },
    { dx:  -8, dy: -14, r: 19, op: 0.94 },
    { dx:   9, dy: -12, r: 20, op: 0.94 },
    // 좌측 기저부 & 날개
    { dx: -18, dy:  -8, r: 19, op: 0.95 },
    { dx: -32, dy:  -5, r: 18, op: 0.92 },
    { dx: -45, dy:  -2, r: 17, op: 0.90 },
    // 우측 기저부 & 날개
    { dx:  20, dy:  -7, r: 20, op: 0.94 },
    { dx:  34, dy:  -4, r: 18, op: 0.92 },
    { dx:  48, dy:  -2, r: 17, op: 0.88 },
    // 상단부
    { dx: -12, dy: -24, r: 18, op: 0.92 },
    { dx:  14, dy: -22, r: 18, op: 0.90 },
    // 바닥 밀착
    { dx:   2, dy:   3, r: 17, op: 0.95 },
    { dx: -24, dy:   2, r: 16, op: 0.92 },
    { dx:  25, dy:   2, r: 16, op: 0.92 },
  ];

  for (let i = 0; i < DENSE_WHITE_PUFFS.length; i++) {
    const p = DENSE_WHITE_PUFFS[i];
    // 파도 폭(wScale)에 맞춰 좌우 위치 및 반경 스케일링
    const px = groundX + p.dx * (0.85 * wScale) + Math.sin(fSeed + i * 1.2) * 1.8;
    const py = groundY + p.dy * (0.85 + 0.15 * wScale) + Math.cos(fSeed * 0.9 + i * 1.2) * 1.8;
    const pr = p.r * (0.85 + 0.20 * wScale) + Math.sin(fSeed * 0.7 + i) * 1.5;

    const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
    // 중심부는 거의 완전히 불투명한(투명도가 매우 낮은) 짙은 순백
    g.addColorStop(0.00, `rgba(255, 255, 255, ${p.op * alpha})`);
    g.addColorStop(0.55, `rgba(255, 255, 255, ${p.op * 0.88 * alpha})`);
    g.addColorStop(0.85, `rgba(255, 255, 255, ${p.op * 0.32 * alpha})`);
    g.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 바깥으로 뿜어져 나가는 동적 증기 스트림 (파도 폭에 비례하여 더 멀리 뿜어짐)
  const STEAM_STREAMS = [
    // --- [좌측 바깥으로 뿜어져 나가는 증기군] ---
    { startX: -6,  startY: -6,  vx: -6.5, vy: -1.2, startR: 16, growR: 2.2, op: 0.85, phaseOffset: 0 },
    { startX: -10, startY: -12, vx: -8.2, vy: -3.0, startR: 14, growR: 2.5, op: 0.75, phaseOffset: 1.5 },
    { startX: -8,  startY: -2,  vx: -5.0, vy:  1.5, startR: 15, growR: 2.0, op: 0.80, phaseOffset: 3.0 },
    { startX: -14, startY: -16, vx: -9.5, vy: -2.2, startR: 17, growR: 2.8, op: 0.65, phaseOffset: 4.5 },

    // --- [우측 바깥으로 뿜어져 나가는 증기군 (비대칭 속도/각도)] ---
    { startX:  8,  startY: -5,  vx:  7.2, vy: -1.0, startR: 17, growR: 2.4, op: 0.85, phaseOffset: 0.5 },
    { startX: 12,  startY: -10, vx:  9.0, vy: -2.8, startR: 15, growR: 2.6, op: 0.70, phaseOffset: 2.2 },
    { startX:  6,  startY:  1,  vx:  5.8, vy:  1.8, startR: 16, growR: 2.1, op: 0.80, phaseOffset: 3.8 },
    { startX: 15,  startY: -14, vx: 10.5, vy: -1.8, startR: 18, growR: 3.0, op: 0.60, phaseOffset: 5.2 },

    // --- [중앙 기저부에서 끊임없이 솟구쳐 오르는 신선한 코어 수증기] ---
    { startX: -2,  startY: -8,  vx: -1.8, vy: -4.5, startR: 18, growR: 1.8, op: 0.88, phaseOffset: 1.0 },
    { startX:  4,  startY: -12, vx:  2.2, vy: -5.2, startR: 17, growR: 1.9, op: 0.82, phaseOffset: 2.8 },
    { startX:  1,  startY: -2,  vx:  0.8, vy:  1.2, startR: 19, growR: 1.5, op: 0.90, phaseOffset: 0.2 },
    { startX: -3,  startY: -18, vx: -1.2, vy: -6.0, startR: 15, growR: 2.2, op: 0.65, phaseOffset: 4.0 },
  ];

  for (let i = 0; i < STEAM_STREAMS.length; i++) {
    const s = STEAM_STREAMS[i];
    const cycle = 5.0;
    const t = (fTime + s.phaseOffset) % cycle;
    const progress = t / cycle;

    // 파도 폭에 비례하여 시작 위치 및 분출 속도 확장
    const px = groundX + s.startX * (0.85 * wScale) + (s.vx * (0.8 + 0.25 * wScale)) * t;
    const py = groundY + s.startY + s.vy * t;
    const pr = (s.startR + s.growR * t) * (0.85 + 0.18 * wScale);

    const fade = Math.sin(progress * Math.PI);
    const puffOp = s.op * fade * alpha;
    if (puffOp <= 0.02) continue;

    const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
    g.addColorStop(0.00, `rgba(255, 255, 255, ${puffOp})`);
    g.addColorStop(0.45, `rgba(255, 255, 255, ${puffOp * 0.65})`);
    g.addColorStop(0.80, `rgba(255, 255, 255, ${puffOp * 0.22})`);
    g.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * [유저 요청 엄수]: "파도 올라올 때즈음 화면 흐리게 하고 수증기로 화면이 가득차게해봐"
 * - 파도 융기 시점(Frames 1~4) 화면 전체에 몽환적 수분감 소프트 블러 적용
 * - 전장 전체를 가득 채우는 웅장한 수증기 클라우드 뱅크 및 부유 뭉게구름 방울 확산
 */
function drawAtmosphericWaveSteamAndBlur(
  ctx: any,
  waveFrame: number,
  logicalWidth: number = 560,
  logicalHeight: number = 373
) {
  // [유저 피드백 엄수]: "수증기 극대화 조금만 더 뒤로 미뤄봐"
  // - Frames 0~2: 화면 가림 전혀 없음 (0~6%)
  // - Frames 3~4: 은은한 수분감 및 파도 상단 미세 수무 (15% ~ 28%)
  // - Frames 5~6: 파도가 대상 방향으로 쏟아지며 수증기 본격 확산 (48% ~ 75%)
  // - Frame 7+: 거대 해일 정점 및 내려침 순간 화면 전체 수증기 극대화 (100%)
  const STEAM_DENSITIES = [0.0, 0.02, 0.06, 0.15, 0.28, 0.48, 0.75, 1.00];
  const density = (waveFrame !== undefined && waveFrame >= 0 && waveFrame < STEAM_DENSITIES.length)
    ? STEAM_DENSITIES[waveFrame]
    : (waveFrame !== undefined && waveFrame >= 7 ? 1.00 : 0);

  if (density > 0.02) {
    ctx.save();

    // A. 화면 전역 앰비언트 수무 워시 (부드러운 수분감으로 전장을 흐리고 네 모서리까지 빈틈없이 감쌈)
    const fogGrad = ctx.createLinearGradient(0, 0, 0, logicalHeight);
    fogGrad.addColorStop(0.00, `rgba(235, 248, 255, ${0.25 * density})`);
    fogGrad.addColorStop(0.35, `rgba(220, 245, 255, ${0.45 * density})`);
    fogGrad.addColorStop(0.70, `rgba(230, 248, 255, ${0.52 * density})`);
    fogGrad.addColorStop(1.00, `rgba(240, 252, 255, ${0.40 * density})`);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // B. 전장 전체(네 모서리, 중앙, 외곽)를 가로지르는 대형 수증기 뱅크들 (Atmospheric Rolling Steam Banks)
    const w = logicalWidth;
    const h = logicalHeight;
    const fSeed = waveFrame * 1.5;

    const STEAM_BANKS = [
      // 상단 모서리 및 상단 능선
      { x: w * 0.08, y: h * 0.12, r: 160, a: 0.50 * density, seed: 1 },
      { x: w * 0.38, y: h * 0.15, r: 180, a: 0.55 * density, seed: 2 },
      { x: w * 0.72, y: h * 0.14, r: 175, a: 0.52 * density, seed: 3 },
      { x: w * 0.94, y: h * 0.18, r: 165, a: 0.48 * density, seed: 4 },

      // 중앙 전역
      { x: w * 0.14, y: h * 0.48, r: 190, a: 0.58 * density, seed: 5 },
      { x: w * 0.48, y: h * 0.44, r: 210, a: 0.62 * density, seed: 6 },
      { x: w * 0.82, y: h * 0.48, r: 195, a: 0.58 * density, seed: 7 },

      // 하단 모서리 및 바닥 전역
      { x: w * 0.06, y: h * 0.82, r: 180, a: 0.55 * density, seed: 8 },
      { x: w * 0.42, y: h * 0.80, r: 200, a: 0.60 * density, seed: 9 },
      { x: w * 0.76, y: h * 0.82, r: 190, a: 0.58 * density, seed: 10 },
      { x: w * 0.96, y: h * 0.78, r: 170, a: 0.52 * density, seed: 11 },
    ];

    for (let i = 0; i < STEAM_BANKS.length; i++) {
      const b = STEAM_BANKS[i];
      const driftX = Math.cos(fSeed + b.seed * 1.5) * 14;
      const driftY = Math.sin(fSeed + b.seed * 1.8) * 10;
      const px = b.x + driftX;
      const py = b.y + driftY;
      const pr = b.r * (0.92 + 0.15 * Math.sin(fSeed * 0.7 + b.seed));

      const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
      g.addColorStop(0.00, `rgba(255, 255, 255, ${b.a})`);
      g.addColorStop(0.48, `rgba(255, 255, 255, ${b.a * 0.78})`);
      g.addColorStop(0.80, `rgba(240, 250, 255, ${b.a * 0.28})`);
      g.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // C. 화면 중전경에 흩날리는 부유 뭉게구름 퍼프들
    const PUFFS = [
      { x: w * 0.22, y: h * 0.32, r: 110, a: 0.55 * density, s: 20 },
      { x: w * 0.46, y: h * 0.36, r: 125, a: 0.60 * density, s: 21 },
      { x: w * 0.72, y: h * 0.34, r: 115, a: 0.56 * density, s: 22 },
      { x: w * 0.28, y: h * 0.62, r: 130, a: 0.62 * density, s: 23 },
      { x: w * 0.58, y: h * 0.60, r: 135, a: 0.64 * density, s: 24 },
      { x: w * 0.80, y: h * 0.65, r: 120, a: 0.58 * density, s: 25 },
    ];
    for (let i = 0; i < PUFFS.length; i++) {
      const p = PUFFS[i];
      const px = p.x + Math.sin(fSeed * 1.3 + p.s) * 10;
      const py = p.y - Math.abs(Math.cos(fSeed * 1.1 + p.s)) * 8;
      const pr = p.r * (0.90 + 0.18 * Math.sin(fSeed + p.s));

      const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
      g.addColorStop(0.00, `rgba(255, 255, 255, ${p.a})`);
      g.addColorStop(0.52, `rgba(255, 255, 255, ${p.a * 0.72})`);
      g.addColorStop(0.82, `rgba(240, 250, 255, ${p.a * 0.22})`);
      g.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ============================================================================
// 5세대 공식 배틀 연출: 수증기 이후 대지 침수 해양 & 피격 분출 (media_1788718974357.png 재현)
// ============================================================================

/**
 * 고화질 5단계 반투명 수류 리본 렌더러 (상승 파도와 100% 동일한 톤쉐이딩 기법)
 */
function strokeGroundWaterRibbon(ctx: any, pts: { x: number; y: number }[], width: number, alpha: number = 1.0) {
  if (pts.length < 2) return;
  const p0 = pts[0];
  const p1 = pts[pts.length - 1];

  const cBase = "0, 160, 188";   // #00A0BC 청록 림 베이스
  const cMid  = "56, 189, 248";  // #38bdf8 화사한 스카이 아쿠아
  const cHigh = "224, 250, 255"; // #e0faff 초고휘도 아이스 화이트

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 0) 광역 소프트 앰비언트 블러 아우라 (바닥 수면과 매끄럽게 연결)
  const g00 = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
  g00.addColorStop(0.00, `rgba(${cBase}, 0.0)`);
  g00.addColorStop(0.18, `rgba(${cBase}, ${0.07 * alpha})`);
  g00.addColorStop(0.82, `rgba(${cBase}, ${0.07 * alpha})`);
  g00.addColorStop(1.00, `rgba(${cBase}, 0.0)`);
  ctx.lineWidth = width * 3.0;
  ctx.strokeStyle = g00;
  strokeSmoothWavePath(ctx, pts);

  // 1) 최외곽 소프트 앰비언트 아우라
  const g0 = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
  g0.addColorStop(0.00, `rgba(${cBase}, 0.0)`);
  g0.addColorStop(0.20, `rgba(${cBase}, ${0.12 * alpha})`);
  g0.addColorStop(0.80, `rgba(${cBase}, ${0.12 * alpha})`);
  g0.addColorStop(1.00, `rgba(${cBase}, 0.0)`);
  ctx.lineWidth = width * 2.0;
  ctx.strokeStyle = g0;
  strokeSmoothWavePath(ctx, pts);

  // 2) 외곽 반투명 청록 림
  const g1 = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
  g1.addColorStop(0.00, `rgba(${cBase}, 0.0)`);
  g1.addColorStop(0.22, `rgba(${cBase}, ${0.22 * alpha})`);
  g1.addColorStop(0.78, `rgba(${cBase}, ${0.22 * alpha})`);
  g1.addColorStop(1.00, `rgba(${cBase}, 0.0)`);
  ctx.lineWidth = width * 1.4;
  ctx.strokeStyle = g1;
  strokeSmoothWavePath(ctx, pts);

  // 3) 중간 스카이 아쿠아 본체
  const g2 = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
  g2.addColorStop(0.00, `rgba(${cMid}, 0.0)`);
  g2.addColorStop(0.25, `rgba(${cMid}, ${0.35 * alpha})`);
  g2.addColorStop(0.75, `rgba(${cMid}, ${0.35 * alpha})`);
  g2.addColorStop(1.00, `rgba(${cMid}, 0.0)`);
  ctx.lineWidth = width * 0.95;
  ctx.strokeStyle = g2;
  strokeSmoothWavePath(ctx, pts);

  // 4) 내부 은은한 아쿠아 발광 코어
  const g3 = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
  g3.addColorStop(0.00, `rgba(${cMid}, 0.0)`);
  g3.addColorStop(0.28, `rgba(${cMid}, ${0.45 * alpha})`);
  g3.addColorStop(0.72, `rgba(${cMid}, ${0.45 * alpha})`);
  g3.addColorStop(1.00, `rgba(${cMid}, 0.0)`);
  ctx.lineWidth = width * 0.60;
  ctx.strokeStyle = g3;
  strokeSmoothWavePath(ctx, pts);

  // 5) 부드러운 아이스 화이트 릿지
  const g4 = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
  g4.addColorStop(0.00, `rgba(${cHigh}, 0.0)`);
  g4.addColorStop(0.32, `rgba(${cHigh}, ${0.45 * alpha})`);
  g4.addColorStop(0.68, `rgba(${cHigh}, ${0.45 * alpha})`);
  g4.addColorStop(1.00, `rgba(${cHigh}, 0.0)`);
  ctx.lineWidth = width * 0.30;
  ctx.strokeStyle = g4;
  strokeSmoothWavePath(ctx, pts);

  ctx.restore();
}

/**
 * 유기적 연속 포말 쇄파선 (점박이 구슬 배제, 깊이 음영과 순백 포말 리본 일체형)
 */
function drawContinuousFoamRidge(ctx: any, ridgePts: { x: number; y: number }[], width: number, alpha: number = 1.0, seed: number = 0) {
  if (ridgePts.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 1. Swell Under-Shadow (자연스러운 파도 골 음영: 소프트 블러로 부드럽게 감싸는 깊이감)
  const shadowPts = ridgePts.map(p => ({ x: p.x, y: p.y + width * 0.55 }));
  ctx.save();
  const shadowBlur = Math.max(2.0, width * 0.35);
  ctx.filter = `blur(${shadowBlur.toFixed(1)}px)`;
  ctx.strokeStyle = `rgba(3, 23, 43, ${0.40 * alpha})`;
  ctx.lineWidth = width * 1.35;
  strokeSmoothWavePath(ctx, shadowPts);
  ctx.restore();

  // 2. [유저 요청 엄수]: "흰색선 바깥의 옅은 흰색선 가우시안처리? 그런것좀 해봐 선처럼안보이게"
  // - 외곽 옅은 포말 아우라의 '선(Stroke)' 느낌을 완전히 없애기 위해 가우시안 블러(Gaussian Blur) 다층 산란 적용
  // - 선 경계선이 안개처럼 부드럽게 퍼져 수면에 자연스럽게 번지는 물거품/포말 글로우(Froth Glow Diffusion)로 연출
  ctx.save();
  const auraBlurWide = Math.max(3.5, width * 0.65);
  ctx.filter = `blur(${auraBlurWide.toFixed(1)}px)`;
  ctx.strokeStyle = `rgba(215, 245, 255, ${0.42 * alpha})`;
  ctx.lineWidth = width * 2.4;
  strokeSmoothWavePath(ctx, ridgePts);
  ctx.restore();

  ctx.save();
  const auraBlurMid = Math.max(1.8, width * 0.32);
  ctx.filter = `blur(${auraBlurMid.toFixed(1)}px)`;
  ctx.strokeStyle = `rgba(235, 250, 255, ${0.30 * alpha})`;
  ctx.lineWidth = width * 1.4;
  strokeSmoothWavePath(ctx, ridgePts);
  ctx.restore();

  // 3. Frothing White Foam Ribbon (풍성한 순백 포말 띠)
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.82 * alpha})`;
  ctx.lineWidth = width * 0.75;
  strokeSmoothWavePath(ctx, ridgePts);

  // 4. Razor Sharp Ice-White Crest Edge (파도 정점의 날카롭고 선명한 쇄파 엣지)
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.98 * alpha})`;
  ctx.lineWidth = Math.max(1.5, width * 0.28);
  strokeSmoothWavePath(ctx, ridgePts);

  // 5. Secondary Trailing Foam Lacing (부서진 파도가 뒤로 남기는 자연스러운 포말 흔적)
  // - [유저 요청 엄수]: 선처럼 보이지 않도록 가우시안 블러를 적용하여 부드러운 잔여 거품 연무로 산란
  if (width >= 5.0) {
    const lacePts: { x: number; y: number }[] = [];
    for (let i = 0; i < ridgePts.length; i++) {
      const p = ridgePts[i];
      const trailOff = Math.sin(seed * 2.1 + i * 0.45) * (width * 0.4) + (width * 0.35);
      lacePts.push({ x: p.x, y: p.y - trailOff });
    }
    ctx.save();
    const laceBlur = Math.max(2.2, width * 0.35);
    ctx.filter = `blur(${laceBlur.toFixed(1)}px)`;
    ctx.strokeStyle = `rgba(224, 248, 255, ${0.30 * alpha})`;
    ctx.lineWidth = Math.max(2.0, width * 0.45);
    strokeSmoothWavePath(ctx, lacePts);
    ctx.restore();
  }

  // 6. Occasional Frothy Breaking Patches (오직 파도 최고점 근처에서만 불규칙하게 피어오르는 백파)
  for (let i = 2; i < ridgePts.length - 2; i += 4) {
    const p = ridgePts[i];
    const crestPeak = Math.sin(seed * 3.7 + i * 1.8);
    if (crestPeak > 0.55) {
      const r = width * (0.5 + crestPeak * 0.35);
      const puffGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      puffGrad.addColorStop(0.00, `rgba(255, 255, 255, ${0.85 * alpha})`);
      puffGrad.addColorStop(0.50, `rgba(240, 252, 255, ${0.60 * alpha})`);
      puffGrad.addColorStop(1.00, "rgba(224, 245, 255, 0.0)");
      ctx.fillStyle = puffGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * [유저 요청 엄수]: "데미지 입는 포켓몬 근처에서 나오는 수증기 개선한번 해줘 (너무 물기둥처럼 보이는것들 제거하고 그냥 수증기가 물체에 부딪혀서 나오는것처럼)"
 * - 수직 분출 물기둥(water pillar) 완전 제거!
 * - 거대 파도 물살이 피격 포켓몬의 신체와 대지에 정면 격돌하며 사방으로 폭발/비산하는 유기적 충돌 수증기 (Collision Impact Vapor)
 */
function drawPokemonCollisionSteamBehind(
  ctx: any,
  tx: number,
  ty: number,
  prog: number,
  alpha: number,
  dirSign: number = 1
) {
  if (prog <= 0.02 || alpha <= 0.02) return;
  ctx.save();

  // 충돌 격돌 시점부터 외곽으로 자연스럽게 부풀어 오르는 수증기 팽창 계수
  const exp = 0.65 + 0.45 * prog;
  const hExp = Math.min(1.15, 0.50 + 0.70 * prog);
  const driftX = 12 * dirSign * prog;
  const driftY = -14 * prog;

  // 1. 포켓몬 후면을 감싸며 배경에 깊이감을 형성하는 대형 볼륨 수증기 뱅크 (Rear Volumetric Vapor Banks)
  const REAR_BANKS = [
    { ox: -20 * dirSign, oy: -36, rx: 44, ry: 30, rot: -0.10 * dirSign, op: 0.72 },
    { ox:  16 * dirSign, oy: -42, rx: 48, ry: 32, rot:  0.12 * dirSign, op: 0.75 },
    { ox:  -2 * dirSign, oy: -56, rx: 46, ry: 28, rot:  0.02 * dirSign, op: 0.70 },
    { ox: -38 * dirSign, oy: -30, rx: 36, ry: 24, rot: -0.18 * dirSign, op: 0.58 },
    { ox:  40 * dirSign, oy: -36, rx: 42, ry: 28, rot:  0.20 * dirSign, op: 0.62 },
    { ox:   6 * dirSign, oy: -70, rx: 34, ry: 22, rot:  0.06 * dirSign, op: 0.54 },
  ];

  for (let i = 0; i < REAR_BANKS.length; i++) {
    const rb = REAR_BANKS[i];
    const px = tx + (rb.ox + driftX) * exp;
    const py = ty + (rb.oy + driftY) * hExp;
    const rx = rb.rx * exp;
    const ry = rb.ry * exp;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rb.rot);

    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    g.addColorStop(0.00, `rgba(255, 255, 255, ${rb.op * alpha})`);
    g.addColorStop(0.46, `rgba(238, 250, 255, ${rb.op * 0.75 * alpha})`);
    g.addColorStop(0.78, `rgba(215, 243, 255, ${rb.op * 0.28 * alpha})`);
    g.addColorStop(1.00, "rgba(215, 243, 255, 0.0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. 상공으로 흩날리는 부드러운 수증기 깃털 (Rising Spindrift Wisps)
  const RISING_WISPS = [
    { ox: -18 * dirSign, oy: -82, rx: 26, ry: 18, rot: -0.18 * dirSign, op: 0.48 },
    { ox:  14 * dirSign, oy: -86, rx: 28, ry: 19, rot:  0.15 * dirSign, op: 0.50 },
    { ox:   0,           oy: -94, rx: 24, ry: 16, rot:  0.00,          op: 0.42 },
  ];

  for (const rw of RISING_WISPS) {
    const px = tx + (rw.ox + driftX * 1.3) * exp;
    const py = ty + (rw.oy + driftY * 1.2) * hExp;
    const rx = rw.rx * exp;
    const ry = rw.ry * exp;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rw.rot);

    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    g.addColorStop(0.00, `rgba(255, 255, 255, ${rw.op * alpha})`);
    g.addColorStop(0.50, `rgba(235, 248, 255, ${rw.op * 0.60 * alpha})`);
    g.addColorStop(1.00, "rgba(215, 243, 255, 0.0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawPokemonCollisionSteamFront(
  ctx: any,
  tx: number,
  ty: number,
  prog: number,
  alpha: number,
  dirSign: number = 1
) {
  if (prog <= 0.02 || alpha <= 0.02) return;
  ctx.save();

  const exp = 0.60 + 0.45 * prog;
  const hExp = Math.min(1.15, 0.45 + 0.70 * prog);
  const driftX = 10 * dirSign * prog;
  const driftY = -8 * prog;

  // 1. 발밑 수면 격돌 쇄파 안개 (Waterline Base Turbulence Churn)
  // - 파도가 포켓몬 발밑과 하체에 부딪쳐 수면에 격렬한 백색 포말 거품 및 안개 층 형성
  const BASE_CHURNS = [
    { ox: -28 * dirSign, oy:  2, rx: 36, ry: 15, rot: -0.10 * dirSign, op: 0.88 },
    { ox:   0,           oy: -2, rx: 44, ry: 17, rot:  0.00,          op: 0.94 },
    { ox:  32 * dirSign, oy:  3, rx: 40, ry: 16, rot:  0.12 * dirSign, op: 0.90 },
    { ox: -50 * dirSign, oy:  6, rx: 28, ry: 12, rot: -0.15 * dirSign, op: 0.70 },
    { ox:  52 * dirSign, oy:  7, rx: 32, ry: 13, rot:  0.18 * dirSign, op: 0.72 },
  ];

  for (let i = 0; i < BASE_CHURNS.length; i++) {
    const bc = BASE_CHURNS[i];
    const px = tx + (bc.ox + driftX * 0.6) * exp;
    const py = ty + bc.oy;
    const rx = bc.rx * exp;
    const ry = bc.ry * exp;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(bc.rot);

    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    g.addColorStop(0.00, `rgba(255, 255, 255, ${bc.op * alpha})`);
    g.addColorStop(0.48, `rgba(240, 252, 255, ${bc.op * 0.78 * alpha})`);
    g.addColorStop(0.80, `rgba(215, 243, 255, ${bc.op * 0.28 * alpha})`);
    g.addColorStop(1.00, "rgba(215, 243, 255, 0.0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. 포켓몬 신체 직격 충돌 파쇄 수증기 (Body Collision Impact Puffs)
  // - 파도가 몸체에 직접 부딪혀 피어오르는 생생한 비산 수증기 구름
  const BODY_PUFFS = [
    { ox: -16 * dirSign, oy: -20, rx: 26, ry: 21, rot: -0.12 * dirSign, op: 0.94 },
    { ox:   6 * dirSign, oy: -26, rx: 28, ry: 22, rot:  0.10 * dirSign, op: 0.95 },
    { ox:  -4 * dirSign, oy: -38, rx: 30, ry: 23, rot:  0.00,          op: 0.92 },
    { ox:  26 * dirSign, oy: -30, rx: 27, ry: 21, rot:  0.15 * dirSign, op: 0.88 },
    { ox: -30 * dirSign, oy: -28, rx: 23, ry: 19, rot: -0.16 * dirSign, op: 0.82 },
    { ox:   8 * dirSign, oy: -50, rx: 24, ry: 18, rot:  0.05 * dirSign, op: 0.84 },
    { ox:  34 * dirSign, oy: -44, rx: 22, ry: 17, rot:  0.18 * dirSign, op: 0.78 },
    { ox: -18 * dirSign, oy: -58, rx: 20, ry: 16, rot: -0.10 * dirSign, op: 0.74 },
  ];

  for (let i = 0; i < BODY_PUFFS.length; i++) {
    const bp = BODY_PUFFS[i];
    const px = tx + (bp.ox + driftX) * exp;
    const py = ty + (bp.oy + driftY) * hExp;
    const rx = bp.rx * exp;
    const ry = bp.ry * exp;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(bp.rot);

    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    g.addColorStop(0.00, `rgba(255, 255, 255, ${bp.op * alpha})`);
    g.addColorStop(0.42, `rgba(248, 253, 255, ${bp.op * 0.86 * alpha})`);
    g.addColorStop(0.76, `rgba(220, 245, 255, ${bp.op * 0.32 * alpha})`);
    g.addColorStop(1.00, "rgba(220, 245, 255, 0.0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. 충돌 지점에서 유기적으로 뿜어 나오는 미세 비산 수증기 물방울들 (Spray Wisps)
  const SPRAY_WISPS = [
    { ox: -36 * dirSign, oy: -44, r: 3.2, op: 0.80 },
    { ox:  38 * dirSign, oy: -48, r: 3.5, op: 0.82 },
    { ox: -18 * dirSign, oy: -64, r: 2.8, op: 0.75 },
    { ox:  22 * dirSign, oy: -66, r: 3.0, op: 0.78 },
    { ox:   4 * dirSign, oy: -74, r: 3.2, op: 0.80 },
    { ox: -44 * dirSign, oy: -22, r: 2.5, op: 0.70 },
    { ox:  46 * dirSign, oy: -24, r: 2.8, op: 0.72 },
    { ox:  14 * dirSign, oy: -14, r: 3.0, op: 0.75 },
  ];

  for (const sw of SPRAY_WISPS) {
    const px = tx + (sw.ox + driftX) * exp;
    const py = ty + (sw.oy + driftY) * hExp;
    ctx.fillStyle = `rgba(255, 255, 255, ${sw.op * alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, sw.r * exp, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 5세대 공식 배틀 연출: 수증기 이후 대지 침수 해양 평면 & 후면 비산 분출 (Behind Layer)
 * - [유저 요청 엄수]: 올라오는 파도의 컬러(#0a3c68, #03172b, #187be7, #38bdf8, #e0faff)와 퀄리티에 완벽히 일치
 *   1. 심층 심해 베이스 그라데이션 (#187be7 -> #0e6ecc -> #0a5096 -> #0a3c68 -> #03172b)
 *   2. 수평선 소프트 미스트 헤이즈
 *   3. 시전자에서 대상을 향해 쏟아져 나가는 대각 5단계 반투명 수류 리본들 (Diagonal Surging Torrents)
 *   4. 원근법에 따른 유기적 연속 포말 쇄파선들 (6개 층위)
 *   5. 후면 3대 거대 수직 비산 분출 (Hydro Geysers)
 *   6. 수면에 일렁이는 몽환적 잔여 수증기 (Surface Rolling Mist)
 */
function drawGen5FloodedOceanBehind(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    em?: { x: number; y: number; size: number };
    pm?: { x: number; y: number; size: number };
    [key: string]: any;
  }
) {
  const floodAlpha = frame.oceanFloodAlpha ?? (frame.moveStep !== undefined && frame.moveStep >= 9 && frame.moveStep <= 14 ? 1.0 : 0);
  if (floodAlpha <= 0.01) return;

  const isP = drawCtx.isPlayer;
  const targetGround = isP
    ? (drawCtx.em ?? { x: 348, y: 170 })
    : (drawCtx.pm ?? { x: 140, y: 270 });

  const tx = targetGround.x;
  const ty = targetGround.y;
  // [유저 피드백 엄수]: "내가 시전할 때는 바닥 필드가 다 파도로 뒤덮이는데 적시전하면 내쪽만 바닥이 파도로 변해서 뭔가 어색해"
  // - 시전자(아군/적)와 무관하게 전장 전체(상단 원경 수평선 ~ 하단 근경)가 모두 파도로 뒤덮이도록
  //   수평선 기준을 항상 전장 상단 원경 지점(em.y - 52, 기본 약 118px)으로 통일
  const fieldTopY = drawCtx.em ? drawCtx.em.y : 170;
  const horizonY = fieldTopY - 52;
  const fTime = (frame.moveStep || 9);
  const wCanvas = drawCtx.width || 560;
  const hCanvas = drawCtx.height || 373;

  ctx.save();
  ctx.globalAlpha = floodAlpha;

  // 1. [대지 침수 해양 단색 베이스 (Solid Ocean Blue Plane)]
  // - [유저 요청 엄수]: "바닥 파랑 단색으로 해보자 그라데이션효과 없이"
  // - 다단계 그라데이션(oceanGrad) 및 대각 수류 블러 리본(TORRENTS)을 완전히 배제하고,
  //   선명하고 균일한 오션 블루(#187be7) 단색 평면으로 바닥을 깔끔하게 채움
  ctx.fillStyle = "#187be7";
  ctx.fillRect(-200, horizonY, wCanvas + 400, hCanvas - horizonY + 200);

  // 2. [원근법에 따른 연속 포말 쇄파선들 (Continuous Rolling Wave Foam Ridges)]
  const dirSign = isP ? 1 : -1;
  const slantVal = -0.06 * dirSign;
  const FOAM_RIDGES = [
    { y: horizonY + 12, amp: 2.0, wl: 42, width: 3.0,  speed: 1.0, slant: slantVal * 0.6 },
    { y: horizonY + 34, amp: 3.2, wl: 56, width: 4.5,  speed: 1.6, slant: slantVal * 0.8 },
    { y: horizonY + 66, amp: 5.0, wl: 78, width: 6.2,  speed: 2.2, slant: slantVal * 1.0 },
    { y: horizonY + 108, amp: 7.5, wl: 110, width: 8.8,  speed: 3.0, slant: slantVal * 1.1 },
    { y: horizonY + 160, amp: 10.0, wl: 150, width: 11.5, speed: 3.8, slant: slantVal * 1.2 },
    { y: horizonY + 224, amp: 13.0, wl: 190, width: 14.5, speed: 4.5, slant: slantVal * 1.2 },
  ];

  for (let rIdx = 0; rIdx < FOAM_RIDGES.length; rIdx++) {
    const fr = FOAM_RIDGES[rIdx];
    const tShift = fTime * 0.45 * fr.speed;
    const ridgePts: { x: number; y: number }[] = [];

    for (let x = -60; x <= wCanvas + 60; x += 10) {
      const macroWave = Math.sin(x / fr.wl + tShift) * fr.amp;
      const harmonicWave = Math.cos(x * 0.035 + tShift * 1.3) * (fr.amp * 0.35);
      const microChop = Math.sin(x * 0.18 + tShift * 2.2) * (fr.amp * 0.15);
      const wy = fr.y + macroWave + harmonicWave + microChop + (x - tx) * fr.slant;
      ridgePts.push({ x, y: wy });
    }

    drawContinuousFoamRidge(ctx, ridgePts, fr.width, 0.95, fTime * 2.0 + rIdx);
  }

  // 5. [피격 포켓몬 충돌 비산 수증기 (Collision Impact Vapor - Behind Layer)]
  const geyserProg = frame.splashGeyserProgress ?? 1.0;
  if (geyserProg > 0.05) {
    drawPokemonCollisionSteamBehind(ctx, tx, ty, geyserProg, floodAlpha, dirSign);
  }

  // 6. [수면에 깔리는 몽환적 잔여 수증기 (Surface Rolling Mist)]
  if (floodAlpha > 0.25) {
    const sTime = fTime * 1.2;
    const MIST_BANKS = [
      { x: wCanvas * 0.18, y: horizonY + 28, rx: 75, ry: 22 },
      { x: wCanvas * 0.52, y: horizonY + 48, rx: 90, ry: 25 },
      { x: wCanvas * 0.86, y: horizonY + 32, rx: 80, ry: 24 },
      { x: wCanvas * 0.32, y: horizonY + 98, rx: 100, ry: 30 },
      { x: wCanvas * 0.72, y: horizonY + 118, rx: 95, ry: 28 },
    ];
    for (let i = 0; i < MIST_BANKS.length; i++) {
      const mb = MIST_BANKS[i];
      const px = mb.x + Math.sin(sTime + i * 1.3) * 14;
      const py = mb.y + Math.cos(sTime * 0.9 + i * 1.1) * 6;
      const g = ctx.createRadialGradient(px, py, 0, px, py, mb.rx);
      g.addColorStop(0.00, `rgba(255, 255, 255, ${0.28 * floodAlpha})`);
      g.addColorStop(0.48, `rgba(240, 250, 255, ${0.16 * floodAlpha})`);
      g.addColorStop(1.00, "rgba(240, 250, 255, 0.0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(px, py, mb.rx, mb.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 5세대 공식 배틀 연출: 피격 포켓몬 전면 침수 수면 & 전면 비산 분출 & 상공 비산 수적 (Front Layer)
 */
function drawGen5FloodedOceanFront(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    em?: { x: number; y: number; size: number };
    pm?: { x: number; y: number; size: number };
    [key: string]: any;
  }
) {
  const floodAlpha = frame.oceanFloodAlpha ?? (frame.moveStep !== undefined && frame.moveStep >= 9 && frame.moveStep <= 14 ? 1.0 : 0);
  if (floodAlpha <= 0.01) return;

  const targetGround = drawCtx.isPlayer
    ? (drawCtx.em ?? { x: 348, y: 170 })
    : (drawCtx.pm ?? { x: 140, y: 270 });

  const tx = targetGround.x;
  const ty = targetGround.y;
  const geyserProg = frame.splashGeyserProgress ?? 1.0;

  ctx.save();
  ctx.globalAlpha = floodAlpha;

  const dirSign = drawCtx.isPlayer ? 1 : -1;

  // 1. [피격 포켓몬 충돌 비산 수증기 (Collision Impact Vapor - Front Layer)]
  if (geyserProg > 0.05) {
    drawPokemonCollisionSteamFront(ctx, tx, ty, geyserProg, floodAlpha, dirSign);
  }

  // 3. 비산하는 자연스러운 대형 수적 방울들 (5세대 원작 일치)
  const dropAlpha = frame.dropletsAlpha ?? 1.0;
  if (dropAlpha > 0.05) {
    const drops = [
      { ox: -145 * dirSign, oy: -95,  r: 4.5, a: 0.92 },
      { ox: -110 * dirSign, oy: -35,  r: 3.8, a: 0.88 },
      { ox:  -50 * dirSign, oy: -65,  r: 4.2, a: 0.90 },
      { ox:  -18 * dirSign, oy: -85,  r: 4.8, a: 0.94 },
      { ox:   15 * dirSign, oy: -36,  r: 3.8, a: 0.88 },
      { ox:  115 * dirSign, oy: -88,  r: 4.8, a: 0.94 },
      { ox:  135 * dirSign, oy: -28,  r: 4.2, a: 0.86 },
      { ox:  -80 * dirSign, oy: -78,  r: 3.5, a: 0.84 },
      { ox:  -38 * dirSign, oy: -110, r: 4.0, a: 0.88 },
      { ox:   48 * dirSign, oy: -105, r: 4.4, a: 0.90 },
    ];

    for (const d of drops) {
      const dx = tx + d.ox;
      const dy = ty + d.oy;
      const gHalo = ctx.createRadialGradient(dx, dy, 0, dx, dy, d.r * 1.5);
      gHalo.addColorStop(0.00, `rgba(224, 250, 255, ${0.80 * d.a * dropAlpha * floodAlpha})`);
      gHalo.addColorStop(0.50, `rgba(56, 189, 248, ${0.40 * d.a * dropAlpha * floodAlpha})`);
      gHalo.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");
      ctx.fillStyle = gHalo;
      ctx.beginPath();
      ctx.arc(dx, dy, d.r * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * d.a * dropAlpha * floodAlpha})`;
      ctx.beginPath();
      ctx.arc(dx, dy, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. 수증기에서 대지 침수 해양으로 이어지는 부드러운 전환 틴트 (Step 9)
  const whiteTrans = frame.whiteTransitionAlpha ?? 0;
  if (whiteTrans > 0.02) {
    ctx.fillStyle = `rgba(255, 255, 255, ${whiteTrans})`;
    ctx.fillRect(-500, -300, (drawCtx.width || 560) + 1000, (drawCtx.height || 373) + 600);
  }

  ctx.restore();
}

export function drawSurfBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    em?: { x: number; y: number; size: number };
    pm?: { x: number; y: number; size: number };
    [key: string]: any;
  }
) {
  const waveFrame = frame.waveFrame ?? (frame.moveStep !== undefined ? frame.moveStep - 1 : undefined);

  if (waveFrame !== undefined && waveFrame >= 0 && waveFrame <= 7) {
    if (drawCtx.isPlayer) {
      // 1. 파도 물줄기는 시전 포켓몬 아래(Behind) 레이어에 배치
      drawCleanSurfWave(ctx, frame, drawCtx);
    }
  } else if (frame.moveStep !== undefined && frame.moveStep >= 9 && frame.moveStep <= 14) {
    // 5세대 공식 배틀 연출: 수증기 이후 대지 침수 해양 평면 & 후면 비산 분출 (Behind Layer)
    drawGen5FloodedOceanBehind(ctx, frame, drawCtx);
  }
}

export function drawSurfEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    em?: { x: number; y: number; size: number };
    pm?: { x: number; y: number; size: number };
    [key: string]: any;
  }
) {
  const waveFrame = frame.waveFrame ?? (frame.moveStep !== undefined ? frame.moveStep - 1 : undefined);

  // [유저 요청 엄수]: "파도 넓이에 맞춰서 시전했던 수증기도 범위 넓어지게"
  const waveW = waveFrame !== undefined ? (SURF_WAVE_WIDTHS[waveFrame] ?? 142) : 142;

  if (waveFrame !== undefined && waveFrame >= 0 && waveFrame <= 7) {
    const s = SURF_SCALES[Math.min(waveFrame, SURF_SCALES.length - 1)];
    const advX = (drawCtx.isPlayer ? 1 : -1) * SURF_ADVANCES[Math.min(waveFrame, SURF_ADVANCES.length - 1)];
    const H = 180 * s;

    if (drawCtx.isPlayer) {
      const casterGround = drawCtx.pm ?? { x: drawCtx.attackerPos.x, y: drawCtx.attackerPos.y + 36 };

      // 1. 바닥 기저부 수증기 (유지)
      drawLocalizedBaseSteam(ctx, casterGround.x, casterGround.y, 0.95, waveFrame, waveW);

      // 2. [유저 요청 엄수]: 파도 립 하단 수증기 뭉치 (Frame 4 기준 및 파도 립 형성 구간)
      drawWaveLipSteamCluster(ctx, casterGround.x, casterGround.y + 4, H, drawCtx.isPlayer ? 1 : -1, advX, 0.95, waveFrame);

      // 3. [유저 요청 엄수]: 화면 흐리게 & 수증기로 화면이 가득 차게 (플레이어 시전 시 내측 아치 수증기는 제외)
      drawAtmosphericWaveSteamAndBlur(ctx, waveFrame, drawCtx.width || 560, drawCtx.height || 373);
    } else {
      // 적 시점 시전일 때
      drawCleanSurfWave(ctx, frame, drawCtx);

      const casterGround = drawCtx.em ?? { x: drawCtx.attackerPos.x, y: drawCtx.attackerPos.y + 36 };

      // 1. 바닥 기저부 수증기 (유지)
      drawLocalizedBaseSteam(ctx, casterGround.x, casterGround.y, 0.95, waveFrame, waveW);

      // 2. [유저 요청 엄수]: 파도 립 하단 수증기 뭉치
      drawWaveLipSteamCluster(ctx, casterGround.x, casterGround.y + 4, H, drawCtx.isPlayer ? 1 : -1, advX, 0.95, waveFrame);

      // 4. [유저 요청 엄수]: "시전포켓몬이 상대인경우 저 빨간 부분 수증기 좀더 투명도가 낮아야 덮치는 파도로 보일듯" (상대방 시전 전용)
      drawWaveInnerArchSteam(ctx, casterGround.x, casterGround.y + 4, H, drawCtx.isPlayer ? 1 : -1, advX, waveFrame, 0.95);

      // 5. [유저 요청 엄수]: 화면 흐리게 & 수증기로 화면이 가득 차게
      drawAtmosphericWaveSteamAndBlur(ctx, waveFrame, drawCtx.width || 560, drawCtx.height || 373);
    }

  } else if (frame.moveStep !== undefined && frame.moveStep >= 9 && frame.moveStep <= 14) {
    // 5세대 공식 배틀 연출: 수증기 이후 피격 포켓몬 전면 침수 수면 & 전면 비산 분출 & 상공 비산 수적 (Front Layer)
    drawGen5FloodedOceanFront(ctx, frame, drawCtx);
  }
}

// ============================================================================
// 058: 냉동빔 (Ice Beam) - 5세대 블랙/화이트 공식 배틀 연출 & 초정밀 극저온 결계
// ============================================================================

// [유저 요청 엄수]: "뾰족한 얼음 제거 너무 PPT 같음"
// 뾰족한 다각면 얼음 첨탑/크리스탈(drawFacetedIceSpire) 완전 제거 완료!

// [유저 요청 엄수]: "그리고 타격시 바닥에 생기는거 제거"
// 타격 시 바닥에 생기던 지면 동결 오라 및 얼음 균열(drawGroundFrostField) 완전 제거 완료!

// [유저 요청 엄수]: "동그란거 걍 없애고 초반 찌지직도 제거해"
// 시전 포켓몬 앞 동그라미 구체(drawSkyBlueColdSphere) 및 초반 전기가닥 찌지직(drawCryoLightningCrackles) 완전 제거 완료!

/**
 * Helper: 5세대 고유 직선 톱니형/다이아몬드 차가운 냉동광선 (5th Gen Serrated Ice Beam)
 * - [유저 요청 엄수]: "얇은 빔이 날아가게", 파란색은 #72FFFB 적용, 시작점 투명
 */
function drawGen5IceBeam(
  ctx: any,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  startP: number,
  endP: number,
  alpha: number = 1.0,
  seed: number = 0
) {
  if (alpha <= 0.01 || endP <= startP) return;

  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  const startDist = dist * Math.max(0, startP);
  const endDist = dist * Math.min(1.10, endP);
  const curLen = endDist - startDist;
  if (curLen < 1) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p0x = sx + ux * startDist;
  const p0y = sy + uy * startDist;
  const p1x = sx + ux * endDist;
  const p1y = sy + uy * endDist;

  // 시작점 투명도 페이드 (Gradient Fade): 시작점이 구체를 가리지 않고 자연스럽게 스며나오도록 투명화
  const fadeFrac = Math.min(0.22, Math.max(0.06, 22 / Math.max(curLen, 1)));

  // 1. [유저 요청 엄수]: 더욱 얇아진 극저온 서리 오라 (살짝 더 희고 은은하게)
  const auraGrad = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
  auraGrad.addColorStop(0.00, "rgba(180, 245, 255, 0.0)"); // 시작점 완전 투명!
  auraGrad.addColorStop(fadeFrac, "rgba(186, 253, 251, 0.45)");
  auraGrad.addColorStop(0.85, "rgba(220, 254, 254, 0.50)");
  auraGrad.addColorStop(1.00, "rgba(240, 252, 255, 0.30)");

  ctx.strokeStyle = auraGrad;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p0x, p0y);
  ctx.lineTo(p1x, p1y);
  ctx.stroke();

  // 2. [유저 요청 엄수]: "광선 조금만 더 얇게" (전체 폭 2.2px ~ 4.8px 초슬림 5세대 톱니 사슬)
  const stepLen = 4.0;
  const wavelength = 8.0;
  const topPts: { x: number; y: number }[] = [];
  const botPts: { x: number; y: number }[] = [];

  for (let d = startDist; d <= endDist; d += stepLen) {
    const frac = d / wavelength;
    const tri = Math.abs((frac % 1.0) - 0.5) * 2;
    const halfW = 1.1 + tri * 1.3; // 반경 1.1 ~ 2.4px (전체 폭 2.2 ~ 4.8px!)

    const cx = sx + ux * d;
    const cy = sy + uy * d;

    topPts.push({ x: cx + nx * halfW, y: cy + ny * halfW });
    botPts.push({ x: cx - nx * halfW, y: cy - ny * halfW });
  }

  const endFrac = endDist / wavelength;
  const endTri = Math.abs((endFrac % 1.0) - 0.5) * 2;
  const endHalfW = 1.1 + endTri * 1.3;
  topPts.push({ x: p1x + nx * endHalfW, y: p1y + ny * endHalfW });
  botPts.push({ x: p1x - nx * endHalfW, y: p1y - ny * endHalfW });

  if (topPts.length >= 2) {
    // 본체 그라데이션: [유저 요청 엄수]: "살짝만 더 희게 수정" (순백 및 초고휘도 화이트-시안 영역 확대)
    const bodyGrad = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
    bodyGrad.addColorStop(0.00, "rgba(186, 253, 251, 0.0)"); // 시작점 완전 투명!
    bodyGrad.addColorStop(fadeFrac * 0.7, "rgba(186, 253, 251, 0.55)");
    bodyGrad.addColorStop(fadeFrac, "#B2FCFA");
    bodyGrad.addColorStop(0.35, "#D2FEFD");
    bodyGrad.addColorStop(0.60, "#EAFFFF");
    bodyGrad.addColorStop(0.85, "#F6FFFF");
    bodyGrad.addColorStop(1.00, "#FFFFFF");

    // 외곽선 그라데이션: 살짝 더 밝고 부드러운 아이스 시안 라인 (#38BDF8 / #67E8F9)
    const borderGrad = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
    borderGrad.addColorStop(0.00, "rgba(56, 189, 248, 0.0)");
    borderGrad.addColorStop(fadeFrac, "#38BDF8");
    borderGrad.addColorStop(0.70, "#67E8F9");
    borderGrad.addColorStop(1.00, "#BAE6FD");

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 0.8;
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(topPts[0].x, topPts[0].y);
    for (let i = 1; i < topPts.length; i++) {
      ctx.lineTo(topPts[i].x, topPts[i].y);
    }
    for (let i = botPts.length - 1; i >= 0; i--) {
      ctx.lineTo(botPts[i].x, botPts[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 3. [유저 요청 엄수]: 내부 초슬림 순백 직선 레이저 심선 (폭 1.2px -> 1.7px로 살짝 상향하여 흰색감 보강)
  const coreGrad = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
  coreGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
  coreGrad.addColorStop(fadeFrac * 0.5, "rgba(255, 255, 255, 0.50)");
  coreGrad.addColorStop(fadeFrac, "#FFFFFF");
  coreGrad.addColorStop(0.85, "#FFFFFF");
  coreGrad.addColorStop(1.00, "rgba(255, 255, 255, 1.0)");

  ctx.strokeStyle = coreGrad;
  ctx.lineWidth = 1.7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p0x, p0y);
  ctx.lineTo(p1x, p1y);
  ctx.stroke();

  // 4. 슬림 빔을 감싸며 뻗어나가는 미세 번개 (흰색 비율 상향)
  const cracklePoints = [0.25, 0.50, 0.75, 0.95];
  for (let i = 0; i < cracklePoints.length; i++) {
    const cp = cracklePoints[i];
    if (cp < startP || cp > endP) continue;

    const cpx = sx + ux * (dist * cp);
    const cpy = sy + uy * (dist * cp);
    const side = (i % 2 === 0 ? 1 : -1);

    ctx.strokeStyle = (i % 3 === 0) ? "#B2FCFA" : "#FFFFFF";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(cpx, cpy);
    ctx.lineTo(cpx + nx * (side * 2.4) + ux * 3, cpy + ny * (side * 2.4) + uy * 3);
    ctx.lineTo(cpx + nx * (side * 3.6) + ux * 7, cpy + ny * (side * 3.6) + uy * 7);
    ctx.stroke();
  }

  // [유저 요청 엄수]: "광선 끝에 동그란 거 제거" -> 끝단 arc 원형 섬광 및 링 코드 일체 제거!

  ctx.restore();
}

/**
 * Helper: 타격 직격 지점 극저온 스타버스트 & 충격파 (Cryo Impact Starburst)
 * - [유저 요청 엄수]: "타격시 타격점 강조하는 동그란 거 제거"
 * - 원형 섬광 구체 및 동심원 충격파 링 일체 제거!
 * - 날카로운 방사형 다이아몬드 얼음 가시(Ice Needle Spikes)만 샤프하게 작렬
 */
function drawCryoImpactBurst(
  ctx: any,
  tx: number,
  ty: number,
  intensity: number,
  alpha: number
) {
  if (alpha <= 0.01 || intensity <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const maxR = 44 * intensity;

  // [유저 요청 엄수]: 타격점 강조하는 동그란 거 (원형 섬광 구체 및 충격파 링) 완전 제거!
  // 날카로운 8방향 다이아몬드 얼음 가시 방사선 (Ice Needle Spikes)만 작렬
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + (intensity * 0.35);
    const spikeLen = maxR * (0.85 + 0.35 * (i % 2));
    const sx = tx + Math.cos(angle) * (maxR * 0.15);
    const sy = ty + Math.sin(angle) * (maxR * 0.15);
    const ex = tx + Math.cos(angle) * spikeLen;
    const ey = ty + Math.sin(angle) * spikeLen;

    const streakGrad = ctx.createLinearGradient(sx, sy, ex, ey);
    streakGrad.addColorStop(0.0, "#FFFFFF");
    streakGrad.addColorStop(0.4, "#B8FEFD");
    streakGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.strokeStyle = streakGrad;
    ctx.lineWidth = 2.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Helper: 빙결 폭발 산산조각 얼음 파편 물리 비산 (Glacial Shatter Shards)
 */
function drawGlacialShatterShards(
  ctx: any,
  tx: number,
  ty: number,
  progress: number,
  alpha: number
) {
  if (alpha <= 0.01 || progress <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const t = Math.min(1.0, Math.max(0, progress));
  const shardCount = 24;

  for (let i = 0; i < shardCount; i++) {
    // 의사 난수 각도 및 초기 속도
    const seed = (i * 37 + 13) % 100;
    const baseAngle = (i / shardCount) * Math.PI * 2 + (seed * 0.02);
    const speed = 45 + (seed % 65);
    const gravity = 85;

    // 포물선 궤적: x = vx * t, y = vy * t + 0.5 * g * t^2
    const vx = Math.cos(baseAngle) * speed * 1.35;
    const vy = Math.sin(baseAngle) * speed * 0.95;

    const px = tx + vx * t;
    const py = ty + vy * t + 0.5 * gravity * t * t;

    const shardSize = (6 + (i % 4) * 2.2) * (1.0 - t * 0.35);
    const spin = (i % 2 === 0 ? 1 : -1) * (seed * 0.05 + 2.5) * t * Math.PI;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(spin);

    // 반짝이는 극저온 다이아몬드 크리스탈 결정 (외곽선 없이 #B2FCFA & #FFFFFF로 영롱하게 반짝임)
    ctx.fillStyle = (i % 3 === 0) ? "#FFFFFF" : ((i % 3 === 1) ? "#B2FCFA" : "rgba(235, 254, 254, 0.92)");

    const cSize = (3.5 + (i % 4) * 1.4) * (1.0 - t * 0.3);
    ctx.beginPath();
    ctx.moveTo(0, -cSize);
    ctx.lineTo(cSize * 0.55, 0);
    ctx.lineTo(0, cSize * 0.7);
    ctx.lineTo(-cSize * 0.55, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 반짝이는 다이아몬드 더스트 스파클 (Diamond Dust Sparkles)
  const dustCount = 28;
  for (let i = 0; i < dustCount; i++) {
    const seed = (i * 43 + 7) % 100;
    const angle = (i / dustCount) * Math.PI * 2 + seed * 0.03;
    const dist = (20 + (seed % 60)) * (0.3 + t * 0.95);
    const dx = tx + Math.cos(angle) * dist;
    const dy = ty + Math.sin(angle) * (dist * 0.8) - t * 25; // 위로 서서히 부유

    const sparkleAlpha = Math.sin(Math.min(1.0, t * 1.5) * Math.PI) * (0.6 + (i % 5) * 0.1);
    if (sparkleAlpha <= 0.05) continue;

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, alpha * sparkleAlpha);
    ctx.translate(dx, dy);

    // 4포인트 미니 십자 별빛
    const dSize = 2.5 + (i % 3) * 1.2;
    ctx.fillStyle = (i % 2 === 0) ? "#FFFFFF" : "#A5F3FC";
    ctx.beginPath();
    ctx.moveTo(0, -dSize);
    ctx.lineTo(dSize * 0.25, 0);
    ctx.lineTo(0, dSize);
    ctx.lineTo(-dSize * 0.25, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Helper: 공중으로 피어오르는 극저온 서리 수증기 안개 구름 (Subzero Vapor Puffs)
 */
function drawSubzeroMistPuffs(
  ctx: any,
  tx: number,
  ty: number,
  alpha: number
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const puffs = [
    { ox: -24, oy: -15, r: 26 },
    { ox: 18, oy: -20, r: 28 },
    { ox: -10, oy: -35, r: 32 },
    { ox: 25, oy: -5, r: 24 },
    { ox: 0, oy: 10, r: 30 },
  ];

  for (const p of puffs) {
    const mistGrad = ctx.createRadialGradient(tx + p.ox, ty + p.oy, 0, tx + p.ox, ty + p.oy, p.r);
    mistGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.45)");
    mistGrad.addColorStop(0.4, "rgba(236, 254, 255, 0.28)");
    mistGrad.addColorStop(0.75, "rgba(103, 232, 249, 0.12)");
    mistGrad.addColorStop(1.0, "rgba(6, 182, 212, 0.0)");

    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.arc(tx + p.ox, ty + p.oy, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 058 냉동빔 전용 배경 흰푸른 대기 필터 (Ice Beam White-Blue Atmospheric Chill Filter)
 * - [유저 요청 엄수]: "냉동빔 발사중에는 배경에 흰푸른 필터 이떄 상대시전시 필터안잘리게조심"
 * - 광선 발사 및 쇄도, 타격 지속 구간 동안 배경 전체를 신비롭고 서늘한 백청색(흰푸른) 서리 냉기로 뒤덮음
 * - 상대 시전 시 카메라 포커스가 아군 포켓몬(140, 270)으로 이동하고 줌인(1.30배) 및 넉백 흔들림이 발생해도
 *   절대로 화면 좌측/우측/상단/하단 경계선이 잘리지 않도록 4배 이상 광활한 절대 안전 마진(padX: 4배, padY: 4배)으로 전역 렌더링
 */
function drawIceBeamAtmosphereFilter(
  ctx: any,
  filterAlpha: number,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  if (filterAlpha <= 0.01) return;

  ctx.save();

  const w = drawCtx.width || 560;
  const h = drawCtx.height || 373;

  // 상대방 시전(카메라가 좌하단 아군 140, 270으로 줌인) 및 카메라 흔들림 시에도
  // 화면 어느 모서리에서도 필터 경계가 잘리거나 드러나지 않도록 광활한 마진 적용 (최소 2500px / 2000px)
  const padX = Math.max(w * 4, 2500);
  const padY = Math.max(h * 4, 2000);
  const startX = -padX;
  const startY = -padY;
  const totalW = w + padX * 2;
  const totalH = h + padY * 2;

  // 1. 전역 흰푸른(화이트-시안-아이스블루) 대기 틴트 그래디언트
  // 화면 전역(-150 ~ h+150)을 자연스럽게 아우르는 부드러운 수직 그라데이션
  const gradTop = -150;
  const gradBottom = h + 150;
  const frostGrad = ctx.createLinearGradient(0, gradTop, 0, gradBottom);
  frostGrad.addColorStop(0.00, `rgba(210, 245, 255, ${Math.min(0.85, filterAlpha * 0.48)})`);
  frostGrad.addColorStop(0.25, `rgba(235, 252, 255, ${Math.min(0.92, filterAlpha * 0.65)})`);
  frostGrad.addColorStop(0.50, `rgba(255, 255, 255, ${Math.min(0.96, filterAlpha * 0.76)})`);
  frostGrad.addColorStop(0.75, `rgba(186, 246, 255, ${Math.min(0.88, filterAlpha * 0.62)})`);
  frostGrad.addColorStop(1.00, `rgba(145, 222, 255, ${Math.min(0.78, filterAlpha * 0.48)})`);

  ctx.fillStyle = frostGrad;
  ctx.fillRect(startX, startY, totalW, totalH);

  // 2. 광선 축(Beam Center Axis)을 따라 배경에 은은히 번지는 수평 순백 냉기 발광층
  const midY = (drawCtx.attackerPos.y + drawCtx.targetPos.y) / 2;
  const beamAuraGrad = ctx.createLinearGradient(0, midY - 140, 0, midY + 140);
  beamAuraGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
  beamAuraGrad.addColorStop(0.35, `rgba(225, 252, 255, ${filterAlpha * 0.22})`);
  beamAuraGrad.addColorStop(0.50, `rgba(255, 255, 255, ${filterAlpha * 0.32})`);
  beamAuraGrad.addColorStop(0.65, `rgba(186, 246, 255, ${filterAlpha * 0.22})`);
  beamAuraGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = beamAuraGrad;
  ctx.fillRect(startX, startY, totalW, totalH);

  // 3. 전장 중심(아군-적군 사이) 극저온 서리 앰비언트 글로우 (Soft Subzero Ambient Bloom)
  const midX = (drawCtx.attackerPos.x + drawCtx.targetPos.x) / 2;
  const bloomR = 420;
  const centerBloom = ctx.createRadialGradient(midX, midY, 0, midX, midY, bloomR);
  centerBloom.addColorStop(0.00, `rgba(255, 255, 255, ${filterAlpha * 0.25})`);
  centerBloom.addColorStop(0.40, `rgba(215, 250, 255, ${filterAlpha * 0.16})`);
  centerBloom.addColorStop(0.75, `rgba(165, 240, 255, ${filterAlpha * 0.08})`);
  centerBloom.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = centerBloom;
  ctx.beginPath();
  ctx.arc(midX, midY, bloomR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawIceBeamBehindEffect(
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
  // [유저 요청 엄수]: "그리고 타격시 바닥에 생기는거 제거" & "뾰족한 얼음 제거"
  // 바닥 지면 동결 파문 및 배경 얼음 첨탑 완전 제거 완료!

  // [유저 요청 엄수]: "냉동빔 발사중에는 배경에 흰푸른 필터 이떄 상대시전시 필터안잘리게조심"
  const filterAlpha = frame.bgFilterAlpha ?? (
    frame.streamHead !== undefined && frame.streamHead > 0
      ? (
          frame.moveStep === 2 ? 0.45 :
          frame.moveStep === 3 ? 0.58 :
          frame.moveStep === 4 ? 0.68 :
          frame.moveStep === 5 ? 0.75 :
          frame.moveStep === 6 ? 0.70 :
          frame.moveStep === 7 ? 0.42 :
          0.50
        ) * (frame.streamAlpha ?? 1.0)
      : (frame.moveStep === 8 ? 0.18 : 0)
  );

  if (filterAlpha > 0.01) {
    drawIceBeamAtmosphereFilter(ctx, filterAlpha, drawCtx);
  }
}

export function drawIceBeamEffect(
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
  // 대상 중심 및 바닥 좌표
  const targetX = drawCtx.targetPos.x;
  const targetY = drawCtx.targetPos.y - 8;
  const groundY = targetY + 36;

  // 시전자 중심 좌표
  const attackerX = drawCtx.attackerPos.x;
  const attackerY = drawCtx.attackerPos.y - 4;

  // 시전자에서 대상을 향하는 단위 벡터 계산 (원근법 및 상대/아군 시점 완벽 대응)
  const dx = targetX - attackerX;
  const dy = targetY - attackerY;
  const dist = Math.hypot(dx, dy);
  const ux = dx / dist;
  const uy = dy / dist;

  // 시전 포켓몬 바로 앞에서 직선 냉동광선 사출 (구체 없이 시전자로부터 직접 발사)
  const beamStartX = attackerX + ux * 12;
  const beamStartY = attackerY + uy * 12;

  // 1. [유저 요청 엄수]: 5세대 직선 차가운 냉동광선 발사 (#72FFFB 적용, 시작점 투명)
  if (frame.streamHead !== undefined && frame.streamHead > 0) {
    drawGen5IceBeam(
      ctx,
      beamStartX,
      beamStartY,
      targetX,
      targetY,
      frame.streamTail ?? 0.0,
      frame.streamHead,
      frame.streamAlpha ?? 1.0,
      frame.moveStep ?? 1
    );
  }

  // 4. 대상 직격 스타버스트 & 백청색 충격파
  if (frame.impactIntensity !== undefined && frame.impactIntensity > 0) {
    drawCryoImpactBurst(ctx, targetX, targetY, frame.impactIntensity, frame.impactIntensity);
  }

  // [유저 요청 엄수]: "뾰족한 얼음 제거 너무 PPT 같음"
  // 인위적인 PPT 도형 같던 전면 뾰족한 각면 크리스탈 결계(drawFacetedIceSpire) 완전 제거!

  // 6. 빙결 폭발 산산조각 & 다이아몬드 더스트
  if (frame.shatterProgress !== undefined && frame.shatterProgress > 0) {
    drawGlacialShatterShards(ctx, targetX, targetY, frame.shatterProgress, frame.shatterAlpha ?? 1.0);
  }

  // 7. 공중으로 기화하는 서리 수증기 안개
  if (frame.mistAlpha !== undefined && frame.mistAlpha > 0) {
    drawSubzeroMistPuffs(ctx, targetX, targetY - 10, frame.mistAlpha);
  }
}

// ============================================================================
// 059: 눈보라 (Blizzard) - 좌➔우로 서서히 강해지며 화면 전체를 집어삼키는 맹렬한 눈 폭풍
// ============================================================================

/**
 * 1. 배경 전체 순백 화이트아웃 대기 필터 (Blizzard Atmospheric Whiteout Filter)
 * - [유저 요청 엄수]: "눈보라는 배경을 희게 필터넣고", "상대시전시 필터안잘리게조심"
 * - 전장 전체를 덮는 다층 순백 서리 안개 & 화이트아웃 대기
 * - 넉넉한 확장 패딩으로 카메라 줌인/상대 시전 시에도 절대 잘리지 않음
 */
// ============================================================================
// 059: 눈보라 (Blizzard)
// - [유저 요청 엄수]: "배경이 회색"
// - [유저 요청 엄수]: "냉기가 흰색블러덩어리들 (기체같은)로 하고"
// - [유저 요청 엄수]: "얼음조각들이 떠다녀야"
// - [유저 요청 엄수]: "왼쪽에서 오른쪽으로 서서히 강해지다가 결국 눈 폭풍에 화면전체가 뒤덮이면서 끝나게"
// - [유저 요청 엄수]: "눈 덩어리가 쌓이게가 아니다", "타격지점 이펙트는 뺴줘", "볼폼없는 구불구불한 선 제거"
// ============================================================================

/**
 * 1. 배경 혹한의 회색 폭풍 대기 필터 (Gray Storm Atmosphere)
 * - [유저 요청 엄수]: "배경이 회색"
 * - 먹구름과 눈보라가 뒤덮인 차가운 회색 톤 (#334155 / #475569 / #1E293B)
 * - [유저 요청 엄수]: "블리자드가 걷히는게 아니라 걍 뿅하고 사라지시는데" 해결
 * - 걷힘 단계(clearProg > 0) 시 좌측부터 맑은 배경이 드러나며 우측으로 안개가 걷히는 수평 페이드 적용!
 * - 넉넉한 확장 패딩(2500, 2000)으로 카메라 줌/상대 시전 시에도 절대 잘리지 않음
 */
function drawBlizzardGrayAtmosphere(
  ctx: any,
  alpha: number,
  canvasWidth: number = 560,
  canvasHeight: number = 373,
  clearProg: number = 0,
  isPlayer: boolean = true
) {
  if (alpha <= 0.01) return;

  const grayAlpha = Math.min(0.85, alpha * 0.82);
  if (grayAlpha <= 0.01) return;

  ctx.save();

  const padX = Math.max(canvasWidth * 4.0, 2500);
  const padY = Math.max(canvasHeight * 4.0, 2000);
  const startX = -padX;
  const startY = -padY;
  const totalW = canvasWidth + padX * 2;
  const totalH = canvasHeight + padY * 2;

  if (clearProg > 0) {
    // [유저 요청 엄수]: "블리자드 이동도 왼쪽에서 오른쪽으로 페이드아웃되게 (마지막프레임)"
    // - 좌측부터 맑아지며 우측으로 안개가 물러나는 수평 그라데이션
    const clearX = isPlayer
      ? (-80 + clearProg * (canvasWidth + 240))
      : (canvasWidth + 80 - clearProg * (canvasWidth + 240));

    const fadeWidth = 220;
    const x0 = isPlayer ? (clearX - fadeWidth) : (clearX + fadeWidth);
    const x1 = clearX;

    const clearGrad = ctx.createLinearGradient(x0, 0, x1, 0);
    clearGrad.addColorStop(0.00, "rgba(40, 50, 65, 0.0)");
    clearGrad.addColorStop(0.40, `rgba(55, 68, 88, ${grayAlpha * 0.40})`);
    clearGrad.addColorStop(1.00, `rgba(65, 78, 98, ${grayAlpha * 0.88})`);

    ctx.fillStyle = clearGrad;
    ctx.fillRect(startX, startY, totalW, totalH);
  } else {
    // 일반 상태: 전체 회색 폭풍 하늘 수직 그래디언트
    const grayGrad = ctx.createLinearGradient(0, startY, 0, startY + totalH);
    grayGrad.addColorStop(0.00, `rgba(40, 50, 65, ${grayAlpha * 0.95})`);
    grayGrad.addColorStop(0.35, `rgba(65, 78, 98, ${grayAlpha * 0.88})`);
    grayGrad.addColorStop(0.70, `rgba(90, 105, 125, ${grayAlpha * 0.82})`);
    grayGrad.addColorStop(1.00, `rgba(45, 58, 75, ${grayAlpha * 0.95})`);

    ctx.fillStyle = grayGrad;
    ctx.fillRect(startX, startY, totalW, totalH);
  }

  // 차가운 회색 암운 덩어리들 (Atmospheric Storm Cloud Clusters)
  const cloudClusters = [
    { x: -canvasWidth * 0.25, y: canvasHeight * 0.35, r: 380, a: 0.32 * grayAlpha },
    { x: canvasWidth * 0.30, y: canvasHeight * 0.15, r: 340, a: 0.28 * grayAlpha },
    { x: canvasWidth * 0.70, y: canvasHeight * 0.65, r: 360, a: 0.30 * grayAlpha },
    { x: canvasWidth * 1.20, y: canvasHeight * 0.40, r: 390, a: 0.26 * grayAlpha },
  ];

  for (const cc of cloudClusters) {
    if (clearProg > 0) {
      const clearX = isPlayer
        ? (-80 + clearProg * (canvasWidth + 240))
        : (canvasWidth + 80 - clearProg * (canvasWidth + 240));
      const distFromClear = isPlayer ? (cc.x - clearX) : (clearX - cc.x);
      if (distFromClear < -100) continue; // 맑아진 영역의 구름은 완전 소멸
    }

    const rad = ctx.createRadialGradient(cc.x, cc.y, 0, cc.x, cc.y, cc.r);
    rad.addColorStop(0.0, `rgba(28, 38, 55, ${cc.a})`);
    rad.addColorStop(0.5, `rgba(45, 60, 80, ${cc.a * 0.65})`);
    rad.addColorStop(1.0, "rgba(45, 60, 80, 0.0)");
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(cc.x, cc.y, cc.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 2. 기체 형태의 흰색 블러 덩어리 냉기 (Gaseous White Vapor Clouds)
 * - [유저 요청 엄수]: "냉기도 왼쪽에서 오른쪽으로 이동했다 (내가시전시) 를 알 수 있게 왼쪽에서 강해졌다가 지나간걸 느낄 수 있게 왼쪽이 먼저 사라지도록"
 * - [유저 요청 엄수]: "블리자드 이동도 왼쪽에서 오른쪽으로 페이드아웃되게 (마지막프레임)"
 * - 좌측에서 강하게 피어오른 냉기 구름이 우측으로 전진하며, 후미(좌측)는 깨끗하게 먼저 걷혀 냉기가 통과해 지나간 감각을 선명하게 연출
 * - 걷힘 단계에서는 우측 화면 밖으로 빠져나가며 부드럽게 잔여 기체가 좌➔우 방향으로 소멸
 */
function drawBlizzardGaseousVapor(
  ctx: any,
  stormProg: number,
  intensity: number,
  isBehind: boolean,
  canvasWidth: number = 560,
  canvasHeight: number = 373,
  isPlayer: boolean = true,
  clearProg: number = 0
) {
  if (intensity <= 0.01) return;

  ctx.save();

  // stormProg가 진행함에 따라 폭풍 파동이 우측으로 계속 전진
  const waveProg = Math.min(2.2, stormProg / 1.25);
  const waveCenterX = isPlayer
    ? (-120 + waveProg * (canvasWidth + 240))
    : (canvasWidth + 120 - waveProg * (canvasWidth + 240));

  // 이동하는 냉기 구름 팩의 전체 너비 (~440px)
  const packetWidth = canvasWidth * 0.80;

  const baseCount = isBehind ? 18 : 24;
  const cloudCount = Math.max(6, Math.floor(baseCount * Math.pow(intensity, 1.2)));

  const clearFade = clearProg > 0 ? Math.max(0, 1 - clearProg * 0.70) : 1.0;

  for (let c = 0; c < cloudCount; c++) {
    const seed = (c * 67.31 + (isBehind ? 19 : 73)) % 1000;
    // 팩 내부 분산 (-0.5 ~ +0.5)
    const relOffset = ((c / (cloudCount - 1)) - 0.5) * packetWidth;
    const curX = waveCenterX + relOffset + ((seed % 70) - 35);

    // [유저 요청 엄수]: 후미(좌측)가 먼저 사라지도록 페이드아웃 적용
    const tailX = isPlayer ? (waveCenterX - packetWidth * 0.45) : (waveCenterX + packetWidth * 0.45);
    const headX = isPlayer ? (waveCenterX + packetWidth * 0.50) : (waveCenterX - packetWidth * 0.50);

    // 후미보다 뒤편이면 페이드아웃 (좌측이 먼저 사라짐!)
    const fromTail = isPlayer ? (curX - tailX) : (tailX - curX);
    if (fromTail < -100) continue; // 이미 지나간 좌측 영역 완전 소멸
    const tailFade = Math.min(1.0, Math.max(0, (fromTail + 80) / 160));

    // 선두(우측) 도달 페이드
    const toHead = isPlayer ? (headX - curX) : (curX - headX);
    const headFade = (stormProg >= 0.95) ? 1.0 : Math.min(1.0, Math.max(0, (toHead + 80) / 160));

    if (tailFade <= 0.01 || headFade <= 0.01) continue;

    // [유저 요청 엄수]: "블리자드 이동도 왼쪽에서 오른쪽으로 페이드아웃되게 (마지막프레임)"
    let leftToRightFade = 1.0;
    if (clearProg > 0) {
      const clearX = isPlayer
        ? (-60 + clearProg * (canvasWidth + 220))
        : (canvasWidth + 60 - clearProg * (canvasWidth + 220));
      const distFromClear = isPlayer ? (curX - clearX) : (clearX - curX);
      if (distFromClear < -60) continue; // 맑아진 좌측 영역 구름은 완전 소멸!
      leftToRightFade = Math.min(1.0, Math.max(0, (distFromClear + 60) / 180));
    }

    const baseY = (canvasHeight * -0.15) + ((seed * 21.7) % (canvasHeight * 1.3));
    const curY = baseY + Math.sin(curX * 0.012 + seed * 0.18) * 16;

    // 기체 덩어리 크기 (반경 60 ~ 160px)
    const baseR = (isBehind ? 95 : 80) + (seed % 45);
    const scaleR = baseR * (0.65 + intensity * 0.55);

    // 순백 블러 덩어리 투명도 (후미 페이드 + 선두 페이드 + 걷힘 페이드 + 좌➔우 페이드)
    const puffAlpha = (isBehind ? 0.42 : 0.55) * intensity * tailFade * headFade * clearFade * leftToRightFade;
    if (puffAlpha <= 0.01) continue;

    // 1개의 유기적인 기체 덩어리를 구성하는 4개의 서브 퍼프 (Sub-puffs)
    const subPuffs = [
      { ox: 0, oy: 0, r: scaleR, a: puffAlpha },
      { ox: scaleR * 0.42, oy: -scaleR * 0.22, r: scaleR * 0.78, a: puffAlpha * 0.85 },
      { ox: -scaleR * 0.38, oy: scaleR * 0.18, r: scaleR * 0.82, a: puffAlpha * 0.80 },
      { ox: scaleR * 0.18, oy: scaleR * 0.32, r: scaleR * 0.72, a: puffAlpha * 0.75 },
    ];

    for (const p of subPuffs) {
      const px = curX + p.ox;
      const py = curY + p.oy;

      const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r);
      grad.addColorStop(0.00, `rgba(255, 255, 255, ${p.a})`);
      grad.addColorStop(0.35, `rgba(242, 250, 255, ${p.a * 0.80})`);
      grad.addColorStop(0.70, `rgba(220, 240, 255, ${p.a * 0.30})`);
      grad.addColorStop(1.00, "rgba(220, 240, 255, 0.0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 3. 절정의 눈 폭풍 화면 전체 집어삼킴 (Total Screen Blizzard Engulfment)
 * - [유저 요청 엄수]: "결국 눈 폭풍에 화면전체가 뒤덮이면서 끝나게"
 * - [유저 요청 엄수]: "블리자드 이동도 왼쪽에서 오른쪽으로 페이드아웃되게 (마지막프레임)"
 * - stormProg >= 0.90 (Steps 5~6) 클라이맥스 구간에서 전 화면을 거대한 기체 냉기 운무로 완전히 뒤덮음
 * - 걷힘 단계(clearProg > 0)에서는 화면 우측으로 드리프트하며, 오프스크린 destination-in 마스크로 좌측부터 선명하게 페이드아웃!
 */
function drawBlizzardTotalEngulfment(
  ctx: any,
  stormProg: number,
  intensity: number,
  whiteoutAlpha: number,
  canvasWidth: number = 560,
  canvasHeight: number = 373,
  isBehind: boolean = false,
  clearProg: number = 0,
  isPlayer: boolean = true
) {
  if (stormProg < 0.90) return;
  if (clearProg >= 0.98 || intensity <= 0.01) return;

  const engulfPower = Math.min(1.0, (stormProg - 0.85) / 0.28);
  if (engulfPower <= 0.05) return;

  const clearFade = clearProg > 0 ? Math.max(0, 1 - clearProg * 0.70) : 1.0;
  if (clearFade <= 0.01) return;

  ctx.save();

  const padX = Math.max(canvasWidth * 4.0, 2500);
  const padY = Math.max(canvasHeight * 4.0, 2000);
  const startX = -padX;
  const startY = -padY;
  const totalW = canvasWidth + padX * 2;
  const totalH = canvasHeight + padY * 2;

  const driftX = clearProg > 0 ? (isPlayer ? 1 : -1) * (clearProg * canvasWidth * 0.90) : 0;

  if (isBehind) {
    // 후면: 전장 전체를 덮는 짙은 혹한 폭풍 연무층
    const alphaVal = Math.min(0.88, engulfPower * 0.85 * intensity * clearFade);
    if (alphaVal > 0.01) {
      if (clearProg > 0) {
        // [유저 요청 엄수]: "블리자드 이동도 왼쪽에서 오른쪽으로 페이드아웃되게 (마지막프레임)"
        const clearX = isPlayer
          ? (-50 + clearProg * (canvasWidth + 200))
          : (canvasWidth + 50 - clearProg * (canvasWidth + 200));
        const fadeWidth = 220;
        const x0 = isPlayer ? (clearX - fadeWidth) : (clearX + fadeWidth);
        const x1 = clearX;

        const eGrad = ctx.createLinearGradient(x0, 0, x1, 0);
        eGrad.addColorStop(0.00, "rgba(55, 68, 88, 0.0)");
        eGrad.addColorStop(0.50, `rgba(65, 78, 98, ${alphaVal * 0.45})`);
        eGrad.addColorStop(1.00, `rgba(75, 90, 112, ${alphaVal})`);

        ctx.fillStyle = eGrad;
        ctx.fillRect(startX, startY, totalW, totalH);
      } else {
        const engulfGrad = ctx.createLinearGradient(startX, startY, startX + totalW, startY + totalH);
        engulfGrad.addColorStop(0.0, `rgba(55, 68, 88, ${alphaVal})`);
        engulfGrad.addColorStop(0.35, `rgba(80, 95, 118, ${alphaVal * 0.95})`);
        engulfGrad.addColorStop(0.70, `rgba(200, 225, 245, ${alphaVal * 0.60})`);
        engulfGrad.addColorStop(1.0, `rgba(50, 62, 80, ${alphaVal})`);

        ctx.fillStyle = engulfGrad;
        ctx.fillRect(startX, startY, totalW, totalH);
      }
    }
  } else {
    // 전면: 포켓몬과 화면 전체를 집어삼키는 거대한 순백 기체 구름 폭풍 (Engulfing White Gas Clouds)
    const squallAlpha = Math.min(0.96, engulfPower * 0.94 * intensity * clearFade);
      if (clearProg > 0) {
        // [유저 요청 엄수]: "블리자드 이동도 왼쪽에서 오른쪽으로 페이드아웃되게 (마지막프레임)"
        // - 오프스크린 캔버스(560x373) 대신 전체 카메라 뷰포트(startX, totalW)에 직접 수평 페이드 그라데이션 적용!
        // - 카메라 줌(1.25)/팬 적용 시 프레임 11, 12, 36, 37, 38에서 발생하던 칼선 컷오프(x=412, x=68) 완벽 제거!
        const clearX = isPlayer
          ? (-60 + clearProg * (canvasWidth + 240))
          : (canvasWidth + 60 - clearProg * (canvasWidth + 240));
        const fadeW = 240;
        const x0 = isPlayer ? (clearX - fadeW) : (clearX + fadeW);
        const x1 = clearX;

        const vGrad = ctx.createLinearGradient(x0, 0, x1, 0);
        vGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
        vGrad.addColorStop(0.35, `rgba(240, 250, 255, ${squallAlpha * 0.35})`);
        vGrad.addColorStop(0.70, `rgba(230, 245, 255, ${squallAlpha * 0.75})`);
        vGrad.addColorStop(1.00, `rgba(255, 255, 255, ${squallAlpha * 0.95})`);

        ctx.fillStyle = vGrad;
        ctx.fillRect(startX, startY, totalW, totalH);

        // 경계면을 따라 자연스럽게 굽이치는 유기적 순백 기체 덩어리들 (인위적인 직선 경계 방지)
        const frontCloudCount = 7;
        for (let w = 0; w < frontCloudCount; w++) {
          const yPos = (canvasHeight / (frontCloudCount - 1)) * w;
          const wobble = Math.sin(stormProg * 3.5 + w * 1.8) * 45;
          const puffX = isPlayer ? (clearX + wobble + 40) : (clearX - wobble - 40);
          const r = 110 + (w * 17) % 50;

          const pGrad = ctx.createRadialGradient(puffX, yPos, 0, puffX, yPos, r);
          pGrad.addColorStop(0.00, `rgba(255, 255, 255, ${squallAlpha * 0.85})`);
          pGrad.addColorStop(0.45, `rgba(242, 250, 255, ${squallAlpha * 0.50})`);
          pGrad.addColorStop(1.00, "rgba(220, 240, 255, 0.0)");

          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(puffX, yPos, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // clearProg == 0 일반 절정 상태: 화면 전체를 뒤덮는 8개의 대형 순백 운무 구름
        const waveCount = 8;
        for (let w = 0; w < waveCount; w++) {
          const yMid = (canvasHeight / (waveCount - 1)) * w;
          const xPos = canvasWidth * 0.5 + driftX + Math.sin(stormProg * 3 + w) * 50;
          const r = canvasWidth * 0.55;

          const gGrad = ctx.createRadialGradient(xPos, yMid, 0, xPos, yMid, r);
          gGrad.addColorStop(0.00, `rgba(255, 255, 255, ${squallAlpha * 0.95})`);
          gGrad.addColorStop(0.40, `rgba(242, 250, 255, ${squallAlpha * 0.82})`);
          gGrad.addColorStop(0.75, `rgba(220, 240, 255, ${squallAlpha * 0.40})`);
          gGrad.addColorStop(1.00, "rgba(220, 240, 255, 0.0)");

          ctx.fillStyle = gGrad;
          ctx.beginPath();
          ctx.arc(xPos, yMid, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
  }

  ctx.restore();
}

/**
 * 4. 화면 상/하단 시네마틱 흐린 어두운 회색 경계 바 (Cinematic Soft-Edge Letterbox Bars)
 * - [유저 요청 엄수]: "화면 위, 화면 아래 시네마틱하게 경계면이 흐린 어두운 회색"
 * - [유저 요청 엄수]: "시네마 검정은 서서히 페이드아웃되게"
 * - [유저 요청 엄수]: "아래거는 안보임" 버그 해결 -> 실제 캔버스 높이(screenH)를 기준으로 정확히 하단 바 렌더링!
 * - 기술 마무리 단계(clearProg > 0)에서 급격히 꺼지지 않고, 마지막 프레임까지 부드럽고 우아하게 선형 감쇄
 */
function drawBlizzardCinematicBars(
  ctx: any,
  intensity: number,
  whiteoutAlpha: number,
  canvasWidth: number = 560,
  canvasHeight: number = 380,
  clearProg: number = 0
) {
  if (intensity <= 0.005 && whiteoutAlpha <= 0.005 && clearProg >= 0.98) return;

  ctx.save();
  // 캔버스 실제 화면 기준(Physical Screen Space)으로 고정하여 시네마틱 레터박스 프레임 형성
  if (ctx.resetTransform) {
    ctx.resetTransform();
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  const screenW = ctx.canvas?.width || Math.round(canvasWidth * 0.75);
  const screenH = ctx.canvas?.height || Math.round(canvasHeight * 0.75);

  // [유저 요청 엄수]: "시네마 검정은 서서히 페이드아웃되게"
  // 걷힘 단계에서 급격히 끊기지 않고, 마지막 프레임까지 완만하게 서서히 줄어드는 선형 페이드아웃 곡선
  let barAlpha: number;
  if (clearProg > 0) {
    // clearProg 0.28 ➔ 0.74, clearProg 0.62 ➔ 0.48, clearProg 0.90 ➔ 0.23
    barAlpha = Math.max(0.0, 0.96 * (1.0 - clearProg * 0.76));
  } else {
    barAlpha = Math.min(0.96, Math.max(0.20, intensity * 0.96));
  }

  if (barAlpha <= 0.01) {
    ctx.restore();
    return;
  }

  const barHeight = Math.round(screenH * 0.18 * (clearProg > 0 ? (1.0 - clearProg * 0.15) : 1.0));

  // 1. 화면 위 (Top): 상단 끝에서 아래쪽으로 경계면이 부드럽게 흐려지는 어두운 회색
  const topGrad = ctx.createLinearGradient(0, 0, 0, barHeight);
  topGrad.addColorStop(0.00, `rgba(18, 24, 34, ${barAlpha * 0.96})`);
  topGrad.addColorStop(0.35, `rgba(26, 34, 46, ${barAlpha * 0.80})`);
  topGrad.addColorStop(0.65, `rgba(38, 48, 64, ${barAlpha * 0.45})`);
  topGrad.addColorStop(0.85, `rgba(45, 58, 76, ${barAlpha * 0.15})`);
  topGrad.addColorStop(1.00, "rgba(45, 58, 76, 0.0)");

  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, screenW, barHeight);

  // 2. 화면 아래 (Bottom): 하단 끝에서 위쪽으로 경계면이 부드럽게 흐려지는 어두운 회색
  const bottomY = screenH - barHeight;
  const botGrad = ctx.createLinearGradient(0, bottomY, 0, screenH);
  botGrad.addColorStop(0.00, "rgba(45, 58, 76, 0.0)");
  botGrad.addColorStop(0.15, `rgba(45, 58, 76, ${barAlpha * 0.15})`);
  botGrad.addColorStop(0.40, `rgba(38, 48, 64, ${barAlpha * 0.45})`);
  botGrad.addColorStop(0.70, `rgba(26, 34, 46, ${barAlpha * 0.80})`);
  botGrad.addColorStop(1.00, `rgba(18, 24, 34, ${barAlpha * 0.96})`);

  ctx.fillStyle = botGrad;
  ctx.fillRect(0, bottomY, screenW, barHeight);

  ctx.restore();
}

// ============================================================================
// 059 눈보라 Export Functions
// ============================================================================

export function drawBlizzardBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  // ⚠️ [철저한 잔여 프레임 차단]: showEffect가 false이거나 intensity가 0이면 일체 렌더링하지 않고 즉시 종료!
  if (!frame.showEffect) return;

  const intensity = frame.stormIntensity ?? frame.blizzardIntensity ?? 0.0;
  const whiteout = frame.whiteoutAlpha ?? 0.0;
  const clearProg = frame.clearProg ?? 0.0;
  if (intensity <= 0.001 && whiteout <= 0.001) return;

  const w = drawCtx.width || 560;
  const h = drawCtx.height || 373;
  const stormProg = frame.stormProg ?? frame.sweepProgress ?? ((frame.moveStep || 1) * 0.14);
  const isP = drawCtx.isPlayer !== false;

  // 1. [유저 요청 엄수]: 배경 회색 폭풍 대기 필터 (좌측부터 걷힘 지원)
  drawBlizzardGrayAtmosphere(ctx, whiteout, w, h, clearProg, isP);

  // 2. [유저 요청 엄수]: 후면 기체 형태의 흰색 블러 덩어리 냉기 (왼쪽에서 강해졌다가 지나가며 왼쪽이 먼저 사라짐)
  drawBlizzardGaseousVapor(ctx, stormProg, intensity, true, w, h, isP, clearProg);

  // 3. [유저 요청 엄수]: 클라이맥스 전장 전체 뒤덮음 (후면 층, 우측으로 휩쓸리며 걷힘)
  drawBlizzardTotalEngulfment(ctx, stormProg, intensity, whiteout, w, h, true, clearProg, isP);
}

export function drawBlizzardEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  // ⚠️ [철저한 잔여 프레임 차단]: showEffect가 false이거나 intensity가 0이면 일체 렌더링하지 않고 즉시 종료!
  if (!frame.showEffect) return;

  const intensity = frame.stormIntensity ?? frame.blizzardIntensity ?? 0.0;
  const whiteout = frame.whiteoutAlpha ?? 0.0;
  const clearProg = frame.clearProg ?? 0.0;
  if (intensity <= 0.001 && whiteout <= 0.001) return;

  const w = drawCtx.width || 560;
  const h = drawCtx.height || 373;
  const stormProg = frame.stormProg ?? frame.sweepProgress ?? ((frame.moveStep || 1) * 0.14);
  const isP = drawCtx.isPlayer !== false;

  // 1. [유저 요청 엄수]: 전면 기체 형태의 흰색 블러 덩어리 냉기 (왼쪽에서 강해졌다가 지나가며 왼쪽이 먼저 사라짐)
  drawBlizzardGaseousVapor(ctx, stormProg, intensity, false, w, h, isP, clearProg);

  // 2. [유저 요청 엄수]: 클라이맥스 전면 화면 전체 집어삼킴 (오프스크린 마스크로 좌➔우 완벽 페이드아웃)
  drawBlizzardTotalEngulfment(ctx, stormProg, intensity, whiteout, w, h, false, clearProg, isP);

  // 3. [유저 요청 엄수]: 화면 위, 화면 아래 시네마틱하게 경계면이 흐린 어두운 회색 (마지막 프레임까지 서서히 페이드아웃)
  drawBlizzardCinematicBars(ctx, intensity, whiteout, w, h, clearProg);

  // 4. [유저 요청 엄수]: 냉기 몇몇개는 시네마 검정 위레이어에 표시되도록! (좌➔우 걷힘 반영)
  drawBlizzardOverCinematicVapor(ctx, stormProg, intensity, w, h, isP, clearProg);
}

/**
 * 5. 시네마틱 레터박스 위 레이어에 오버레이되는 냉기 기체 (Over-Cinematic Vapor Clouds)
 * - [유저 요청 엄수]: "해당 레이어 윗표시 냉기는 끝까지 나오게 연출"
 * - [유저 요청 엄수]: "냉기 몇몇개는 시네마 검정 위레이어에 표시되도록"
 * - [유저 요청 엄수]: "블리자드 이동도 왼쪽에서 오른쪽으로 페이드아웃되게 (마지막프레임)"
 * - 초반 쇄도부터 절정 피날레까지 유지되며, 걷힘 단계에서는 좌측부터 걷히며 우측으로 흩어지며 소멸
 */
function drawBlizzardOverCinematicVapor(
  ctx: any,
  stormProg: number,
  intensity: number,
  canvasWidth: number = 560,
  canvasHeight: number = 380,
  isPlayer: boolean = true,
  clearProg: number = 0
) {
  if (intensity <= 0.01) return;

  const clearFade = clearProg > 0 ? Math.max(0, 1 - clearProg * 0.70) : 1.0;
  if (clearFade <= 0.01) return;

  ctx.save();
  // 캔버스 실제 화면 기준(Physical Screen Space)으로 시네마틱 바 위에 정확히 오버레이
  if (ctx.resetTransform) {
    ctx.resetTransform();
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  const screenW = ctx.canvas?.width || Math.round(canvasWidth * 0.75);
  const screenH = ctx.canvas?.height || Math.round(canvasHeight * 0.75);

  const drawPuff = (px: number, py: number, scaleR: number, puffAlpha: number) => {
    const subPuffs = [
      { ox: 0, oy: 0, r: scaleR, a: puffAlpha },
      { ox: scaleR * 0.40, oy: -scaleR * 0.18, r: scaleR * 0.75, a: puffAlpha * 0.88 },
      { ox: -scaleR * 0.35, oy: scaleR * 0.15, r: scaleR * 0.80, a: puffAlpha * 0.82 },
    ];

    for (const p of subPuffs) {
      const x = px + p.ox;
      const y = py + p.oy;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, p.r);
      grad.addColorStop(0.00, `rgba(255, 255, 255, ${p.a})`);
      grad.addColorStop(0.35, `rgba(240, 250, 255, ${p.a * 0.80})`);
      grad.addColorStop(0.70, `rgba(215, 238, 255, ${p.a * 0.30})`);
      grad.addColorStop(1.00, "rgba(220, 240, 255, 0.0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // 1. [초반~중반 쇄도 단계 (stormProg < 0.90)]: 좌➔우로 훑고 지나가는 이동 파동
  if (stormProg < 0.90) {
    const waveProg = Math.min(1.0, stormProg / 0.85);
    const waveCenterX = isPlayer
      ? (-80 + waveProg * (screenW + 160))
      : (screenW + 80 - waveProg * (screenW + 160));

    const packetWidth = screenW * 0.80;
    const tailX = isPlayer ? (waveCenterX - packetWidth * 0.45) : (waveCenterX + packetWidth * 0.45);
    const headX = isPlayer ? (waveCenterX + packetWidth * 0.50) : (waveCenterX - packetWidth * 0.50);

    const clouds = [
      { relX: -0.30, y: screenH * 0.06, r: 52, seed: 13 },
      { relX: 0.02,  y: screenH * 0.11, r: 64, seed: 27 },
      { relX: 0.32,  y: screenH * 0.05, r: 58, seed: 41 },
      { relX: -0.28, y: screenH * 0.93, r: 55, seed: 59 },
      { relX: 0.05,  y: screenH * 0.88, r: 68, seed: 73 },
      { relX: 0.35,  y: screenH * 0.94, r: 56, seed: 89 },
      { relX: 0.15,  y: screenH * 0.35, r: 75, seed: 97 },
    ];

    for (const oc of clouds) {
      const curX = waveCenterX + oc.relX * packetWidth + Math.sin(stormProg * 2.5 + oc.seed) * 15;

      const fromTail = isPlayer ? (curX - tailX) : (tailX - curX);
      if (fromTail < -60) continue;
      const tailFade = Math.min(1.0, Math.max(0, (fromTail + 50) / 110));

      const toHead = isPlayer ? (headX - curX) : (curX - headX);
      if (toHead < -60) continue;
      const headFade = Math.min(1.0, Math.max(0, (toHead + 50) / 110));

      if (tailFade <= 0.01 || headFade <= 0.01) continue;

      const curY = oc.y + Math.sin(curX * 0.018 + oc.seed) * 8;
      const scaleR = oc.r * (0.65 + intensity * 0.55);
      const puffAlpha = 0.58 * intensity * tailFade * headFade;
      if (puffAlpha <= 0.01) continue;

      drawPuff(curX, curY, scaleR, puffAlpha);
    }
  }

  // 2. [절정 및 걷힘 단계 (stormProg >= 0.55)]: 상/하단 시네마틱 바 위를 끊임없이 휘감는 순백 냉기 기류
  if (stormProg >= 0.55) {
    const sustainPower = Math.min(1.0, (stormProg - 0.50) / 0.35);
    const topBarPuffs = 6;
    const botBarPuffs = 6;

    // A. 상단 시네마틱 바 위를 넘나드는 순백 냉기 구름들
    for (let i = 0; i < topBarPuffs; i++) {
      const seed = (i * 43.17 + 103) % 1000;
      const spanX = screenW + 160;
      const curX = isPlayer
        ? ((((i / topBarPuffs) * spanX + stormProg * 320 * (0.9 + (seed % 20) * 0.02)) % spanX) - 80)
        : (screenW + 80 - (((i / topBarPuffs) * spanX + stormProg * 320 * (0.9 + (seed % 20) * 0.02)) % spanX));

      // [유저 요청 엄수]: "블리자드 이동도 왼쪽에서 오른쪽으로 페이드아웃되게 (마지막프레임)"
      let leftFade = 1.0;
      if (clearProg > 0) {
        const clearScreenX = isPlayer
          ? (-30 + clearProg * (screenW + 120))
          : (screenW + 30 - clearProg * (screenW + 120));
        const distFromClear = isPlayer ? (curX - clearScreenX) : (clearScreenX - curX);
        if (distFromClear < -30) continue;
        leftFade = Math.min(1.0, Math.max(0, (distFromClear + 30) / 100));
      }

      const curY = (screenH * 0.07) + Math.sin(curX * 0.02 + seed * 0.1) * 9;
      const r = (50 + (seed % 28)) * (0.75 + intensity * 0.45);
      const alpha = 0.56 * intensity * sustainPower * clearFade * leftFade;
      if (alpha <= 0.01) continue;

      drawPuff(curX, curY, r, alpha);
    }

    // B. 하단 시네마틱 바 위를 넘나드는 순백 냉기 구름들
    for (let i = 0; i < botBarPuffs; i++) {
      const seed = (i * 51.31 + 219) % 1000;
      const spanX = screenW + 160;
      const curX = isPlayer
        ? ((((i / botBarPuffs) * spanX + stormProg * 340 * (0.88 + (seed % 20) * 0.02)) % spanX) - 80)
        : (screenW + 80 - (((i / botBarPuffs) * spanX + stormProg * 340 * (0.88 + (seed % 20) * 0.02)) % spanX));

      // [유저 요청 엄수]: "블리자드 이동도 왼쪽에서 오른쪽으로 페이드아웃되게 (마지막프레임)"
      let leftFade = 1.0;
      if (clearProg > 0) {
        const clearScreenX = isPlayer
          ? (-30 + clearProg * (screenW + 120))
          : (screenW + 30 - clearProg * (screenW + 120));
        const distFromClear = isPlayer ? (curX - clearScreenX) : (clearScreenX - curX);
        if (distFromClear < -30) continue;
        leftFade = Math.min(1.0, Math.max(0, (distFromClear + 30) / 100));
      }

      const curY = (screenH * 0.92) + Math.sin(curX * 0.02 + seed * 0.1) * 9;
      const r = (52 + (seed % 30)) * (0.75 + intensity * 0.45);
      const alpha = 0.56 * intensity * sustainPower * clearFade * leftFade;
      if (alpha <= 0.01) continue;

      drawPuff(curX, curY, r, alpha);
    }
  }

  ctx.restore();
}

// ============================================================================
// 060: 환상빔 (Psybeam) - 초음파 기반 다채로운 사이키델릭 링 연출
// ============================================================================

/**
 * 환상빔 5세대(블랙/화이트) 공식 배틀 연출 사이키델릭 무지개 컬러 팔레트 (유저 레퍼런스 완벽 일치)
 * 0: 일렉트릭 로열 블루 (#3B5CE8)
 * 1: 웜 앰버 오렌지 / 골드 (#FFA020)
 * 2: 핫 네온 핑크 / 마젠타 (#D608D7)
 * 3: 브라이트 사이케 바이올렛 / 퍼플 (#A817E1)
 * 4: 일렉트릭 라벤더 라일락 (#7952CC)
 */
export const PSYBEAM_RING_PALETTES = [
  { aura: "rgba(59, 92, 232, 0.70)",   main: "#3B5CE8", core: "rgba(210, 230, 255, 0.95)", hex: "#3B5CE8" }, // 0: Electric Royal Blue
  { aura: "rgba(255, 160, 32, 0.70)",  main: "#FFA020", core: "rgba(255, 240, 190, 0.95)", hex: "#FFA020" }, // 1: Warm Amber Orange
  { aura: "rgba(214, 8, 215, 0.70)",   main: "#D608D7", core: "rgba(255, 215, 250, 0.95)", hex: "#D608D7" }, // 2: Hot Neon Magenta
  { aura: "rgba(168, 23, 225, 0.70)",  main: "#A817E1", core: "rgba(240, 205, 255, 0.95)", hex: "#A817E1" }, // 3: Bright Psyche Violet
  { aura: "rgba(121, 82, 204, 0.70)",  main: "#7952CC", core: "rgba(225, 210, 255, 0.95)", hex: "#7952CC" }, // 4: Electric Lavender
];

/**
 * 5포인트 별 그리기 헬퍼 (혼란 별무리용)
 */
function drawPsyStar5(ctx: any, cx: number, cy: number, rOuter: number, rInner: number, rotation: number = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = rotation + (i * Math.PI) / 5 - Math.PI / 2;
    const r = (i % 2 === 0) ? rOuter : rInner;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Helper: 3차원처럼 보이는 둥근 환상빔 링 (3D Psybeam Ring)
 * - 5세대 공식 배틀 3D 원근 뷰: 정면에 가깝게 똑바로 서 있는 둥근 링 (depthRatio: 0.80, baseTilt: ~7.5°)
 * - 5세대 고유 사이키델릭 색감: 풍성한 네온 바디 + 강렬한 글로우 오라
 * - [유저 레퍼런스 엄수]: 3D 원근에 따른 기립 타원 각도 및 원형 비율 반영
 */
export function draw3DPsybeamRing(
  ctx: any,
  cx: number,
  cy: number,
  tiltAngle: number,
  radius: number,
  alpha: number = 1.0,
  depthRatio: number = 0.80,
  lineWidth: number = 1.2,
  paletteIndex: number = 0
) {
  if (radius <= 0 || alpha <= 0) return;
  const pal = PSYBEAM_RING_PALETTES[paletteIndex % PSYBEAM_RING_PALETTES.length];

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const rx = Math.max(0.1, radius * depthRatio);
  const ry = Math.max(0.1, radius);

  // [유저 피드백]: 링에 해당 색상의 미세하고 은은한 네온 글로우 부여
  ctx.shadowColor = pal.main;
  ctx.shadowBlur = 4.0;

  // 1. 슬림하고 섬세한 네온 글로우 오라 (색감 보조)
  ctx.strokeStyle = pal.aura;
  ctx.lineWidth = lineWidth * 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, tiltAngle, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 샤프한 1.2px 순수 메인 링 (해당 색상 글로우 발산)
  ctx.strokeStyle = pal.main;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, tiltAngle, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper: 2차원 둥근 환상빔 링 (2D Psybeam Ring)
 * - 대상에게 쌓이거나 접촉할 때 왜곡 없이 그려지는 2차원 정원
 */
export function draw2DPsybeamRing(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0,
  lineWidth: number = 1.2,
  paletteIndex: number = 0
) {
  if (radius <= 0 || alpha <= 0) return;
  const pal = PSYBEAM_RING_PALETTES[paletteIndex % PSYBEAM_RING_PALETTES.length];

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // [유저 피드백]: 링에 해당 색상의 미세하고 은은한 네온 글로우 부여
  ctx.shadowColor = pal.main;
  ctx.shadowBlur = 4.0;

  // 1. 슬림한 네온 글로우 오라
  ctx.strokeStyle = pal.aura;
  ctx.lineWidth = lineWidth * 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 샤프한 1.2px 메인 링 (해당 색상 글로우 발산)
  ctx.strokeStyle = pal.main;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper: 중심부가 투명하고 외곽이 선명한 사이킥 퍼플/핑크 확산 원 렌더러
 * - 초음파의 yellowHollowCircle에 대응하는 환상빔 전용 사이킥 버전
 * - 중심부(r <= 38%)는 100% 완전 투명하여 피격 포켓몬의 모습이 온전히 보임
 * - 5세대 특유의 오키드 로즈/바이올렛/스카이블루 그라데이션 적용
 */
export function drawPsybeamHollowCircle(
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
  grad.addColorStop(0.00, "rgba(214, 8, 215, 0.0)");         // 중심부: 100% 완전 투명
  grad.addColorStop(0.38, "rgba(214, 8, 215, 0.0)");         // 안쪽 투명 영역 유지
  grad.addColorStop(0.65, "rgba(255, 160, 32, 0.45)");       // 웜 앰버 오렌지
  grad.addColorStop(0.85, "rgba(214, 8, 215, 0.85)");       // 핫 네온 마젠타
  grad.addColorStop(1.00, "rgba(59, 92, 232, 0.95)");        // 일렉트릭 로열 블루 엣지

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper: 대상 머리 위를 3D 타원 궤도로 빙글빙글 공전하는 혼란(Confusion) 별무리 연출
 * - 다채로운 환상빔 컬러 별(핑크, 시안, 옐로우)이 포켓몬 머리 위를 회전
 */
export function drawPsybeamConfusionStars(
  ctx: any,
  headX: number,
  headY: number,
  progress: number
) {
  if (progress <= 0 || progress > 1.25) return;
  ctx.save();

  // 타원 궤도 파라미터 (가로 28px, 세로 11px 입체 타원)
  const orbitRx = 28;
  const orbitRy = 11;
  const baseAngle = progress * Math.PI * 4.2;

  const globalAlpha = progress < 0.15
    ? (progress / 0.15)
    : progress > 0.85
    ? Math.max(0, (1.15 - progress) / 0.30)
    : 1.0;

  const starPalettes = [
    { fill: "#FB7185", stroke: "rgba(190, 18, 60, 0.85)" },  // 핑크
    { fill: "#22D3EE", stroke: "rgba(14, 116, 144, 0.85)" }, // 시안
    { fill: "#FDE047", stroke: "rgba(161, 98, 7, 0.85)" },   // 옐로우
  ];

  const stars = [0, 1, 2].map((i) => {
    const phi = baseAngle + (i * Math.PI * 2) / 3;
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);

    const sx = headX + cosP * orbitRx;
    const sy = headY + sinP * orbitRy;

    const depth = (sinP + 1.0) / 2.0;
    const scale = 0.80 + depth * 0.40;
    const starAlpha = (0.50 + depth * 0.50) * globalAlpha;
    const spinRot = phi * 1.5;

    return { sx, sy, scale, starAlpha, spinRot, pal: starPalettes[i] };
  });

  stars.sort((a, b) => a.sy - b.sy);

  for (const s of stars) {
    if (s.starAlpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = Math.min(1.0, Math.max(0, s.starAlpha));

    // 외곽 잔상 스파크
    ctx.fillStyle = "rgba(192, 132, 252, 0.35)";
    ctx.beginPath();
    ctx.arc(s.sx, s.sy, 6 * s.scale, 0, Math.PI * 2);
    ctx.fill();

    // 5각 별 렌더링
    drawPsyStar5(ctx, s.sx, s.sy, 8 * s.scale, 3.8 * s.scale, s.spinRot);
    ctx.fillStyle = s.pal.fill;
    ctx.strokeStyle = s.pal.stroke;
    ctx.lineWidth = 1.4;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 060 환상빔 Export Functions
// ============================================================================

export function drawPsybeamBehindEffect(
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
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0) return;

  const beamT = frame.beamT ?? (frame.leaderT ? Math.min(1.0, frame.leaderT) : Math.min(1.0, step * 0.28));
  const beamAlpha = frame.beamAlpha ?? (step >= 10 ? Math.max(0, 1.0 - (step - 9) * 0.45) : 1.0);

  // [유저 레퍼런스 반영]: 링들을 묶어주는 부드러운 원통/원뿔형 사이킥 빔 오라 (Continuous Cylindrical Beam Wash)
  if (beamAlpha > 0 && beamT > 0 && step <= 10) {
    ctx.save();
    const activeLength = dist * Math.min(1.0, beamT);
    const mainAngle = Math.atan2(dy, dx);

    ctx.translate(ax, ay);
    ctx.rotate(mainAngle);

    const normH1 = 11;
    const normH2 = 11 + (activeLength / dist) * 11;

    ctx.globalAlpha = Math.min(1.0, beamAlpha * 0.28);
    const auraGrad = ctx.createLinearGradient(0, 0, activeLength, 0);
    auraGrad.addColorStop(0.00, "rgba(59, 92, 232, 0.40)");   // Blue
    auraGrad.addColorStop(0.28, "rgba(255, 160, 32, 0.40)");  // Amber Orange
    auraGrad.addColorStop(0.55, "rgba(214, 8, 215, 0.40)");   // Hot Magenta
    auraGrad.addColorStop(0.80, "rgba(168, 23, 225, 0.40)");  // Violet
    auraGrad.addColorStop(1.00, "rgba(121, 82, 204, 0.45)");  // Lavender

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.moveTo(0, -normH1);
    ctx.lineTo(activeLength, -normH2);
    ctx.lineTo(activeLength, normH2);
    ctx.lineTo(0, normH1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export function drawPsybeamEffect(
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
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  // 시전자 및 대상 중심 좌표
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);

  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);

  ctx.save();

  // 비행 진행 방향 축 각도
  const mainAngle = Math.atan2(dy, dx);

  // 1. [유저 레퍼런스 기준]:
  // - 발사가 아니라 링이 쭉 이어져서 상대방에게 닿는 연속 빔 (Continuous Connected Ring Beam)
  // - 대상에게 다가갈수록 링 크기가 점진적으로 나팔/원뿔형으로 확대 (Funnel Cone Expansion)
  // - 5가지 핵심 무지개 색상 (블루, 앰버, 마젠타, 바이올렛, 라벤더)의 유기적 흐름
  const beamT = frame.beamT ?? (frame.leaderT ? Math.min(1.0, frame.leaderT) : Math.min(1.0, step * 0.28));
  const streamPhase = frame.streamPhase ?? (step - 1);
  const burstR = frame.psyBurstR ?? frame.yellowBurstR;
  const beamAlpha = frame.beamAlpha ?? (step >= 10 ? Math.max(0, 1.0 - (step - 9) * 0.45) : 1.0);

  const RING_SPACING_PX = 9.2; // 촘촘한 링 간격
  const BASE_RING_RADIUS = 10.5; // 시전자 발사부 기준 링 반경 (10.5px)

  // [유저 레퍼런스 엄수]: 5세대 원작 배틀 3D 카메라 투영 각도 (+7.5° 기립 슬랜트 및 0.80 원형 비율)
  const dirSign = dx >= 0 ? 1 : -1;
  const baseTilt = dirSign * (7.5 * Math.PI / 180);

  if (beamAlpha > 0 && beamT > 0 && (step <= 10 || (burstR !== undefined && burstR < 70))) {
    const activeLength = dist * Math.min(1.0, beamT);
    const totalRings = Math.max(2, Math.floor(activeLength / RING_SPACING_PX));

    for (let i = 0; i <= totalRings; i++) {
      const segDist = i * RING_SPACING_PX;
      const segT = dist > 0 ? segDist / dist : 0;
      if (segT > beamT + 0.01) break;

      // 시전자 위치에서 시작하여 광선 전선을 향해 뻗어가는 각 링의 중심점
      const rx = ax + dx * segT;
      const ry = ay + dy * segT;

      // 미세한 사이킥 파동 진동
      const wave = Math.sin(segT * Math.PI * 6 - streamPhase * 1.5) * 1.0;
      const normX = -Math.sin(mainAngle);
      const normY = Math.cos(mainAngle);
      const cx = rx + normX * wave;
      const cy = ry + normY * wave;

      // [유저 레퍼런스 반영]: 대상(피격 포켓몬)에 가까워질수록 링의 크기가 자연스럽게 나팔/원뿔형으로 확장 (10.5px -> ~20px)
      const expandFactor = 1.0 + segT * 0.90;
      const curRadius = BASE_RING_RADIUS * expandFactor;

      // 팔레트 인덱스: 광선을 타고 앞으로 계속해서 흘러가는 사이키델릭 무지개 플로우
      const paletteIndex = Math.abs(Math.floor(i - streamPhase * 2 + 1200)) % PSYBEAM_RING_PALETTES.length;

      // 링 개별 투명도 (시전자 발생부는 자연스럽게 연결, 전체는 1.0 고선명)
      let ringAlpha = beamAlpha;
      if (segT < 0.04) {
        ringAlpha *= (segT / 0.04);
      }

      // 상대방 몸체에 도달한 끝단(segT >= 0.90 && beamT >= 0.95):
      // 3D 링이 정면 원형으로 부드럽게 펼쳐지며 타겟 몸체에 감김
      if (segT >= 0.90 && beamT >= 0.95) {
        const contactMorph = Math.min(1.0, (segT - 0.90) / 0.10);
        const contactR = curRadius + contactMorph * 4.0;
        const depthRatio = 0.80 + contactMorph * 0.18; // 0.80 -> 0.98 (정원형 전개)
        const tilt = baseTilt * (1.0 - contactMorph * 0.6);
        draw3DPsybeamRing(ctx, cx, cy, tilt, contactR, ringAlpha, depthRatio, 1.2, paletteIndex);
      } else {
        // 광선 본체: 5세대 공식 배틀 연출과 일치하는 원형 기립 링 (depthRatio: 0.80, +7.5° 기립 슬랜트)
        draw3DPsybeamRing(ctx, cx, cy, baseTilt, curRadius, ringAlpha, 0.80, 1.2, paletteIndex);
      }
    }

    // 상대방에게 광선이 완전히 닿아있는 동안(beamT >= 0.95), 타겟 피격 지점에 사이킥 접촉 링 발생
    if (beamT >= 0.95 && step >= 4 && step <= 9) {
      for (let c = 0; c < 3; c++) {
        const cR = 15 + c * 6.0 + Math.sin(streamPhase * 2 + c) * 1.2;
        const cAlpha = Math.min(1.0, beamAlpha * (0.85 - c * 0.18));
        const cPalIdx = (streamPhase + c * 2) % PSYBEAM_RING_PALETTES.length;
        draw3DPsybeamRing(ctx, tx, ty, baseTilt * 0.5, cR, cAlpha, 0.88, 1.3, cPalIdx);
      }
    }
  }

  // 2. 다 이어진 후: 접촉 지점에서 중간이 투명한 사이킥 원의 외곽 확산 폭발!
  if (burstR !== undefined && burstR > 0) {
    const burstAlpha = frame.burstAlpha ?? 0.80;
    drawPsybeamHollowCircle(ctx, tx, ty, burstR, burstAlpha);

    // 중심부에서 튀어나오는 다채로운 사이킥 스파크 (레퍼런스 일치 5색 팔레트)
    if (burstAlpha > 0.4) {
      const sparkColors = ["#3B5CE8", "#FFA020", "#D608D7", "#A817E1", "#7952CC"];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + burstR * 0.05;
        const spDist = burstR * 0.75;
        const spX = tx + Math.cos(a) * spDist;
        const spY = ty + Math.sin(a) * spDist;
        ctx.save();
        ctx.fillStyle = sparkColors[i % sparkColors.length];
        ctx.fillRect(spX - 1.5, spY - 1.5, 3, 3);
        ctx.restore();
      }
    }
  }

  ctx.restore();
}
