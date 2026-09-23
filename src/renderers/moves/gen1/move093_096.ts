// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 85) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 기술 제작 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { createCanvas } from "@napi-rs/canvas";
import {
  drawStarburstImpact,
  drawMiniRetroStar,
  drawStatBoostEffect,
  drawStatDropEffect,
  drawSleepZzzEffect,
} from "../common/helpers.js";

/**
 * Gen 1 Moves 093 - 096 Renderers
 *
 * 093: 염동력 (Confusion)
 * 094: 사이코키네시스 (Psychic)
 * 095: 최면술 (Hypnosis)
 * 096: 요가포즈 (Meditate)
 */

// ============================================================================
// 공통 기하학 / 사이킥 헬퍼
// ============================================================================

/**
 * 뾰족한 칼날 형태의 방사형 테이퍼드 사이킥 광선 빔
 */
function drawTaperedRay(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  baseWidth: number,
  color: string,
  coreColor: string = "#FFFFFF"
) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const perpX = -sin * (baseWidth * 0.5);
  const perpY = cos * (baseWidth * 0.5);

  const tipX = cx + cos * length;
  const tipY = cy + sin * length;

  ctx.save();
  // 외곽 테이퍼드 다각형
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx + perpX, cy + perpY);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(cx - perpX, cy - perpY);
  ctx.closePath();
  ctx.fill();

  // 순백 슬림 코어
  if (baseWidth >= 2.5 && length >= 8) {
    const cPerpX = perpX * 0.35;
    const cPerpY = perpY * 0.35;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.moveTo(cx + cPerpX, cy + cPerpY);
    ctx.lineTo(tipX * 0.85 + cx * 0.15, tipY * 0.85 + cy * 0.15);
    ctx.lineTo(cx - cPerpX, cy - cPerpY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 4각 다이아몬드 에너지 결정 프리즘 그리기
 */
function drawEnergyDiamond(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  aspectRatio: number = 1.6,
  rot: number = 0,
  fillColor: string = "#C084FC",
  borderColor: string = "#FFFFFF"
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  const rx = radius;
  const ry = radius * aspectRatio;

  ctx.beginPath();
  ctx.moveTo(0, -ry);
  ctx.lineTo(rx, 0);
  ctx.lineTo(0, ry);
  ctx.lineTo(-rx, 0);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.restore();
}

/**
 * 타원형 파동 링 (진동/리플 지원)
 */
function drawUndulatingRing(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  waves: number = 6,
  amplitude: number = 3,
  phase: number = 0,
  color: string = "#EC4899",
  lineWidth: number = 2.0
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();

  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const waveOffset = Math.sin(theta * waves + phase) * amplitude;
    const curRx = Math.max(1, rx + waveOffset);
    const curRy = Math.max(1, ry + waveOffset * 0.6);
    const px = cx + Math.cos(theta) * curRx;
    const py = cy + Math.sin(theta) * curRy;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// 093: 염동력 (Confusion)
// ============================================================================

/**
 * 093: 염동력 (Confusion) 전용 렌더러
 * - 에스퍼 / 특수 (위력 50, 명중 100, 10% 혼란)
 *
 * 연출 흐름:
 * 1. 암전 속 사이코키네틱 공간 왜곡 파동 (마젠타/바이올렛 리플)
 * 2. 대상을 옥죄며 진동하는 염동력 압박 밴드 (수축 및 고주파 왜곡)
 * 3. 염동력 파열: 8방향 예리한 사이킥 스타버스트 & 2중 충격파 링
 * 4. 피격 후 머리 위 3D 타원 궤도 회전 혼란 별무리 & 잔여 에너지 페이드아웃
 */
/**
 * 093: 염동력 (Confusion) 배경 레이어 렌더러
 * - 포켓몬 스프라이트 뒷면에 렌더링되므로, 대상 포켓몬은 암전(어두운 필터)의 영향을 받지 않고 밝고 선명하게 유지됨.
 * - #1 ~ #4 (moveStep 1, 2) 동안 전장/발판만 딥 바이올렛으로 암전.
 * - #5 (moveStep 3) 타격 순간부터 암전 완전 제거.
 */
export function drawConfusionBehindEffect(
  ctx: any,
  moveStep: number,
  progress: number
) {
  // #1 ~ #4 동안만 배경 암전 유지, #5부터는 암전 완전 제거
  if (moveStep === 1 || moveStep === 2) {
    const p = Math.min(1.0, Math.max(0.0, progress));
    const dimAlpha = moveStep === 1 ? Math.min(0.55, p * 0.65) : 0.55;
    ctx.save();
    ctx.fillStyle = `rgba(38, 10, 60, ${dimAlpha})`;
    ctx.fillRect(-5000, -5000, 15000, 15000);
    ctx.restore();
  }
}

/**
 * 093: 염동력 (Confusion) 전용 렌더러 (포켓몬 전면 이펙트)
 * - 에스퍼 / 특수 (위력 50, 명중 100, 10% 혼란)
 */
export function drawConfusionMoveEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  progress: number,
  isPlayer: boolean
) {
  ctx.save();

  const p = Math.min(1.0, Math.max(0.0, progress));
  const targetX = targetPos.x;
  const targetY = targetPos.y;

  // Step 1: 사이코키네틱 전조 (#1 / 뷰어 #5)
  // ⚠️ [유저 요구사항] 흰색 점들 완전 제거, 대상 포켓몬 외곽선 및 반투명 필터 적용 시작
  if (moveStep === 1) {
    // 흰색 점들 완전 제거 (캔버스 이펙트 없음, 배경 암전만 drawBehindEffect에서 유지)
  }

  // Step 2: 염동력 결박 & 진동 압박 (#2, #3, #4)
  // ⚠️ [유저 요구사항]
  // - 일렁이는 보라색/흰색 울렁거림 완전 제거
  // - 전면 암전 fillRect 제거 (대상 포켓몬은 암전 영향 없음)
  // - 대상 포켓몬 자체의 순백 오라/보더(targetWhiteAura), 미세 팽창 및 진동 모션만 선명하게 노출
  else if (moveStep === 2) {
    // 전면 불필요한 이펙트 배제 (포켓몬 자체 순백 오라 및 진동 모션 집중)
  }

  // Step 3: 염동력 타격 순간 (#5 / 뷰어 #9)
  // ⚠️ [유저 요구사항] #9 이펙트 제거 요청에 따라 캔버스 이펙트 미출력
  else if (moveStep === 3) {
    // 캔버스 버스트 이펙트 배제 (피격 플래시 및 넉백 흔들림만 노출)
  }

  // Step 4: 사이킥 여파 & 에너지 분산
  else if (moveStep === 4) {
    // 암전은 #5부터 완전 제거됨

    // 잔여 엷은 핑크/퍼플 사이킥 파티클 자연스러운 분산 소멸 (혼란 별무리 없음!)
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + p * 2.2;
      const dist = 20 + p * 28 + (i % 2) * 8;
      const px = targetX + Math.cos(ang) * dist;
      const py = targetY + Math.sin(ang) * (dist * 0.65) - p * 12;
      const alpha = Math.max(0, 0.55 * (1.0 - p));
      if (alpha > 0.02) {
        ctx.fillStyle = i % 2 === 0 ? `rgba(244, 114, 182, ${alpha})` : `rgba(192, 132, 252, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.2 * (1.0 - p * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

// ============================================================================
// 094: 사이코키네시스 (Psychic)
// ============================================================================

/**
 * 094: 사이코키네시스 (Psychic) 배경 레이어 렌더러
 * - [유저 요구사항] 3세대(GBA) 루비/사파이어 사이코키네시스 고유의 전면 물결 스트라이프 배경
 * - 반투명(Semi-transparent) 처리로 전장/발판이 비쳐 보임
 * - 아래쪽으로 갈수록 더 짙고 어두운 딥 바이올렛으로 그라데이션 변화
 * - 매 프레임 아래로 부드럽게 흘러내리는 하향 이동 모션
 * - [유저 요구사항] 암전 페이드인 (Step 1~3) 및 유려한 페이드아웃 (Step 7~9)
 * - 상대 시전 시에도 클리핑되지 않도록 대형 좌표(-5000, -5000, 15000, 15000) 사용.
 * - #1 ~ #9 (moveStep 1~9) 동안 배경 암전 및 물결무늬 점진적 페이드아웃 적용.
 */
export function drawPsychicBehindEffect(
  ctx: any,
  moveStep: number,
  progress: number
) {
  // #1 ~ #9 (moveStep 1~9: 발현 페이드인 -> 구속 피크 -> 타격 및 복귀 페이드아웃)
  if (moveStep >= 1 && moveStep <= 9) {
    const p = Math.min(1.0, Math.max(0.0, progress));

    // [유저 요구사항] 암전 페이드인 & 페이드아웃 곡선 정밀 적용
    let stepAlpha = 1.0;
    if (moveStep === 1) {
      stepAlpha = 0.35 + p * 0.15; // 0.35 ~ 0.50 (페이드인 시작)
    } else if (moveStep === 2) {
      stepAlpha = 0.70;            // 0.70 (페이드인 전개)
    } else if (moveStep === 3) {
      stepAlpha = 0.90;            // 0.90 (거의 가득 참)
    } else if (moveStep >= 4 && moveStep <= 6) {
      stepAlpha = 1.0;             // 1.0 (극대 유지)
    } else if (moveStep === 7) {
      stepAlpha = 0.82;            // 0.82 (특이점 응축 및 페이드아웃 개시)
    } else if (moveStep === 8) {
      stepAlpha = 0.40;            // 0.40 (타격 순간 배경 급격히 감쇠)
    } else if (moveStep === 9) {
      stepAlpha = 0.12;            // 0.12 (복귀 시 미세 잔여 여운 소멸)
    }

    ctx.save();

    // 1. [기저 반투명 딥 바이올렛 그라데이션] (상단은 옅고, 아래쪽으로 갈수록 짙어짐)
    const baseGrad = ctx.createLinearGradient(0, -100, 0, 320);
    baseGrad.addColorStop(0, `rgba(28, 6, 44, ${0.20 * stepAlpha})`);
    baseGrad.addColorStop(0.50, `rgba(22, 4, 38, ${0.45 * stepAlpha})`);
    baseGrad.addColorStop(1.0, `rgba(14, 2, 26, ${0.78 * stepAlpha})`);
    ctx.fillStyle = baseGrad;
    ctx.fillRect(-5000, -5000, 15000, 15000);

    // 2. [3세대 GBA 스타일 사이코키네시스 연속 물결 스트라이프]
    // - 네온 마젠타, 일렉트릭 바이올렛, 딥 인디고, 비비드 라일락 4색 띠가 연속적으로 결합된 사인파 물결
    const stripeH = 10.5;   // 각 물결 띠의 수직 두께
    const amplitude = 5.2;  // 물결 파고 진폭
    const waveLength = 46;  // 수평 파장 (약 6~7개 물결 파동 노출)
    const omega = (Math.PI * 2) / waveLength;

    // 매 스텝마다 아래로(+Y) 7px씩 확실하게 흘러내리는 하향 이동
    const downwardSpeed = 7;
    const yShift = (moveStep * downwardSpeed + p * 3) % (stripeH * 4);

    // 수평 미세 위상 진동
    const xPhase = moveStep * 0.22;

    // 공식 3세대 사이코키네시스 4색 팔레트
    const PALETTE = [
      [245, 12, 245], // Electric Neon Magenta
      [175, 10, 248], // Vivid Psychic Violet
      [112, 10, 188], // Deep Indigo Violet
      [215, 60, 248], // Bright Lilac / Orchid
    ];

    // 뷰포트 및 카메라 줌/팬 영역 넉넉한 커버 범위
    const minX = -250;
    const maxX = 750;
    const minY = -120;
    const maxY = 380;

    // 상하 기준점 (아래쪽으로 갈수록 더 짙고 어두워지는 계산 기준)
    const topRefY = -40;
    const botRefY = 240;

    let stripeIdx = 0;
    for (let baseY = minY + yShift; baseY < maxY; baseY += stripeH) {
      const c = PALETTE[((stripeIdx % PALETTE.length) + PALETTE.length) % PALETTE.length];
      stripeIdx++;

      // 수직 위치 정규화 (0 = 상단, 1 = 하단): 아래쪽이 더 짙어짐
      const yNorm = Math.min(1.0, Math.max(0.0, (baseY - topRefY) / (botRefY - topRefY)));

      // 반투명 투명도: 상단은 0.32 ~ 하단은 0.65 (stepAlpha 반영)
      const alpha = (0.32 + yNorm * 0.33) * stepAlpha;

      // 색상 어두움: 상단은 비비드한 원색 그대로, 하단으로 갈수록 짙고 어두운 톤으로 감쇠
      const darken = 1.0 - yNorm * 0.42;
      const r = Math.round(c[0] * darken);
      const g = Math.round(c[1] * darken);
      const b = Math.round(c[2] * darken);

      ctx.beginPath();
      // 띠의 상단 물결 경계
      for (let x = minX; x <= maxX; x += 8) {
        const y = baseY + Math.sin(x * omega + xPhase) * amplitude;
        if (x === minX) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      // 띠의 하단 물결 경계 (역방향으로 닫아 매끄러운 단일 리본 형성)
      for (let x = maxX; x >= minX; x -= 8) {
        const y = (baseY + stripeH) + Math.sin(x * omega + xPhase) * amplitude;
        ctx.lineTo(x, y);
      }
      ctx.closePath();

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();
    }

    // 3. [하단 비네트 추가 레이어] 바닥으로 갈수록 짙고 깊은 특수 공간 느낌 강화
    const botVignette = ctx.createLinearGradient(0, 100, 0, 260);
    botVignette.addColorStop(0, "rgba(14, 2, 24, 0)");
    botVignette.addColorStop(1, `rgba(12, 2, 22, ${0.45 * stepAlpha})`);
    ctx.fillStyle = botVignette;
    ctx.fillRect(-5000, 100, 15000, 500);

    ctx.restore();
  }
}

/**
 * 094 사이코키네시스 원 (Circle)
 * - 중심부 투명 채워진 원 + 외각 약한 밝은색 단거리 글로우
 * - 3D 원근 틸트(translate -> rotate -> scale)를 통해 3D 입체 원반(Disc)으로 표현
 */
function drawPsychicCircle(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0,
  angle: number = 0,
  scaleX: number = 1.0,
  scaleY: number = 1.0
) {
  if (radius <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 3D 원근 틸트 변환 (울부짖기 방식)
  ctx.translate(cx, cy);
  if (angle !== 0) ctx.rotate(angle);
  if (scaleX !== 1.0 || scaleY !== 1.0) ctx.scale(scaleX, scaleY);

  // 1. [기본 원] 중심부 투명 + 외곽으로 갈수록 색상이 차오르는 채워진 원
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  grad.addColorStop(0, "rgba(236, 72, 153, 0)");        // 중심부: 100% 완전 투명
  grad.addColorStop(0.40, "rgba(236, 72, 153, 0)");     // 안쪽 투명 영역 유지
  grad.addColorStop(0.70, "rgba(217, 70, 239, 0.35)");  // 보라/마젠타 점진적 전개
  grad.addColorStop(0.90, "rgba(236, 72, 153, 0.65)");  // 선명한 핑크 몸체부
  grad.addColorStop(1.0, "rgba(255, 20, 147, 0.85)");   // 외곽 가장자리: 선명한 네온 핑크

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. [외각 약한 밝은색 글로우] (약하게 + 범위 짧게: radius - 2.5 ~ radius + 4.5)
  const glowOuter = radius + 4.5;
  const glowGrad = ctx.createRadialGradient(0, 0, Math.max(0, radius - 2.5), 0, 0, glowOuter);
  glowGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  glowGrad.addColorStop(0.35, "rgba(255, 245, 255, 0.42)");  // 외각 둘레 부근 은은하고 밝은 피크
  glowGrad.addColorStop(0.70, "rgba(244, 114, 182, 0.15)");  // 짧고 부드러운 감쇠
  glowGrad.addColorStop(1.0, "rgba(244, 114, 182, 0)");       // 4.5px 바깥에서 완전 투명

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, glowOuter, 0, Math.PI * 2, false);
  ctx.arc(0, 0, Math.max(0, radius - 2.5), 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

interface Psychic3DCircleConfig {
  dx: number;
  dy: number;
  radius: number;
  angle: number;
  scaleX: number;
  scaleY: number;
}

/**
 * 094 사이코키네시스: 순수 3방향 3D 원 설정 (180도 / 3 = 60도 정규 3방향)
 * - 오프셋 없이 동일한 중심(casterFront)에서 60도씩 균등 회전하여 완벽한 3중 자이로스코프/원자 궤도 형성
 */
function getPsychic3DirCircles(isPlayer: boolean): Psychic3DCircleConfig[] {
  const baseAngle = isPlayer ? -0.35 : 0.35;
  const dir = isPlayer ? -1 : 1;

  const list: Psychic3DCircleConfig[] = [];

  // 3방향: 0°, 60°, 120°
  for (let k = 0; k < 3; k++) {
    const rot = (k * Math.PI) / 3; // 60도 간격 (0°, 60°, 120°)
    const curAngle = baseAngle + dir * rot;
    list.push({
      dx: 0,
      dy: 0,
      radius: 48,
      angle: curAngle,
      scaleX: 0.52,
      scaleY: 1.05,
    });
  }

  return list;
}

/**
 * 094: 사이코키네시스 (Psychic) 전용 렌더러 (포켓몬 전면 이펙트)
 * - 에스퍼 / 특수 (위력 90, 명중 100, 10% 특방 1랭크 하락)
 */
export function drawPsychicMoveEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  progress: number,
  isPlayer: boolean
) {
  ctx.save();

  const p = Math.min(1.0, Math.max(0.0, progress));
  const targetX = targetPos.x;
  const targetY = targetPos.y;

  // 시전자 전방 기준점 (포켓몬 앞쪽 허공 - 모든 원이 이 중심을 공유)
  const casterFrontX = attackerPos.x + (isPlayer ? 55 : -55);
  const casterFrontY = attackerPos.y + (isPlayer ? -15 : 15);

  const circles = getPsychic3DirCircles(isPlayer);

  // Step 1 ~ 3: 3방향 원이 60도씩 순차 발현 (#1 ~ #3)
  if (moveStep >= 1 && moveStep <= 3) {
    const activeCount = moveStep; // 1개 -> 2개 -> 3개 완성
    for (let i = 0; i < activeCount; i++) {
      const cfg = circles[i];
      const isNew = i === activeCount - 1;
      const s = isNew ? (0.65 + p * 0.35) : 1.0;
      const a = isNew ? Math.min(1.0, 0.45 + p * 0.55) : 1.0;
      drawPsychicCircle(
        ctx,
        casterFrontX,
        casterFrontY,
        cfg.radius * s,
        a,
        cfg.angle,
        cfg.scaleX,
        cfg.scaleY
      );
    }
  }

  // Step 4: 3방향 완성 사이킥 원 공명 펄스 (#4)
  else if (moveStep === 4) {
    const pulse = 1.0 + Math.sin(p * Math.PI) * 0.04;
    for (const cfg of circles) {
      drawPsychicCircle(
        ctx,
        casterFrontX,
        casterFrontY,
        cfg.radius * pulse,
        1.0,
        cfg.angle,
        cfg.scaleX,
        cfg.scaleY
      );
    }
  }

  // Step 5: 대상 사이킥 포획 개시 & 원 잔향 페이드아웃 (#5)
  else if (moveStep === 5) {
    const alpha = Math.max(0, 0.75 * (1.0 - p * 0.7));
    if (alpha > 0.05) {
      for (const cfg of circles) {
        drawPsychicCircle(
          ctx,
          casterFrontX,
          casterFrontY,
          cfg.radius * 0.95,
          alpha,
          cfg.angle,
          cfg.scaleX,
          cfg.scaleY
        );
      }
    }
  }

  // Step 6: 극대 사이코키네틱 구속 & 역동적 공중 진동 (#6)
  else if (moveStep === 6) {
    // 대상 주변의 초고주파 에너지 스파크
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + p * 6.0;
      const dist = 36 + Math.sin(p * 20 + i) * 8;
      const dx = targetX + Math.cos(ang) * dist;
      const dy = targetY - 12 + Math.sin(ang) * (dist * 0.6);
      drawMiniRetroStar(ctx, dx, dy, 3.5, "#FFFFFF");
    }
  }

  // Step 7: 특이점 초고밀도 압축 진동 (#7)
  else if (moveStep === 7) {
    // 폭발 직전 압축 스파크
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + p * 8.0;
      const r = 24 + Math.sin(p * 30 + i) * 6;
      const px = targetX + Math.cos(ang) * r;
      const py = targetY - 10 + Math.sin(ang) * (r * 0.6);
      drawMiniRetroStar(ctx, px, py, 3.5, "#FFFFFF");
    }
  }

  // Step 8: 사이킥 타격 순간 (#8)
  // ⚠️ [유저 요구사항] 타격지점 캔버스 이펙트 일시 제외 (피격 플래시, 넉백 흔들림 및 화이트 틴트만 노출)
  else if (moveStep === 8) {
    // 캔버스 버스트/폭발 이펙트 배제
  }

  ctx.restore();
}

// ============================================================================
// 095: 최면술 (Hypnosis)
// ============================================================================

/**
 * Helper: 최면술 전용 노란색 중공원 (Yellow Hollow Disc Circle)
 * - 사이코키네시스(drawPsychicCircle) & 울음소리(drawOrangeCircle)와 동일한 원 구조:
 *   1) 면으로 채워진 원이지만 중심부(0 ~ 38%)는 100% 완전 투명
 *   2) 중심 투명 영역에서 외곽으로 갈수록 선명한 레몬/황금빛 노란색(#FACC15, #EAB308)으로 차오름
 *   3) 외곽 둘레(radius - 2.5 ~ radius + 4.5)에 부드럽고 얇은 밝은 레몬-화이트 광택 글로우
 *   4) 3D 원근 틸트(rotate & scale) 지원
 */
function drawHypnosisYellowCircle(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0,
  angle: number = 0,
  scaleX: number = 1.0,
  scaleY: number = 1.0
) {
  if (radius <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 3D 원근 틸트 변환
  ctx.translate(cx, cy);
  if (angle !== 0) ctx.rotate(angle);
  if (scaleX !== 1.0 || scaleY !== 1.0) ctx.scale(scaleX, scaleY);

  // 1. [기본 원반] 중심부 100% 완전 투명 + 외곽으로 갈수록 차오르는 채워진 황금빛 노란색 원
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  grad.addColorStop(0, "rgba(250, 204, 21, 0)");        // 중심부: 100% 완전 투명
  grad.addColorStop(0.38, "rgba(250, 204, 21, 0)");     // 안쪽 투명 영역 유지 (38%)
  grad.addColorStop(0.68, "rgba(254, 240, 138, 0.35)"); // 은은한 레몬빛 점진적 전개
  grad.addColorStop(0.88, "rgba(250, 204, 21, 0.70)");  // 선명한 황금빛 옐로우 몸체부
  grad.addColorStop(1.0, "rgba(234, 179, 8, 0.92)");    // 외곽 가장자리: 짙은 골든 옐로우

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. [외곽 얇고 부드러운 밝은 레몬-화이트 글로우] (radius - 2.5 ~ radius + 4.5)
  const glowOuter = radius + 4.5;
  const glowGrad = ctx.createRadialGradient(0, 0, Math.max(0, radius - 2.5), 0, 0, glowOuter);
  glowGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  glowGrad.addColorStop(0.35, "rgba(254, 249, 195, 0.45)"); // 외곽 둘레 레몬-화이트 광택
  glowGrad.addColorStop(0.70, "rgba(250, 204, 21, 0.18)");  // 부드러운 감쇠
  glowGrad.addColorStop(1.0, "rgba(250, 204, 21, 0)");       // 바깥쪽 완전 투명

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, glowOuter, 0, Math.PI * 2, false);
  ctx.arc(0, 0, Math.max(0, radius - 2.5), 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 095: 최면술 (Hypnosis) 전용 렌더러
 * - 에스퍼 / 변화 (명중 60, 상대 잠듦 부여)
 *
 * 연출 흐름:
 * 1. 몽환적인 전장 톤다운 & 시전자 최면 파동 충전
 * 2. 초음파 방식 발포: 시전자에서 상대를 향해 연속 사출되는 5중 노란색 중공원 링 (사이코키네시스/울음소리형 원반)
 * 3. 대상 도달 시 2차원 동심원 링으로 중첩되어 대상을 감싸고 최면 펄스 공명
 * 4. 대상 졸음 유발 (스프라이트 살짝 가라앉음), 수면 방울 및 떠오르는 Zzz 수면 룬 파티클
 * 5. 수면 상태 안착 & 암전 해제 및 복귀
 */
export function drawHypnosisEffect(
  ctx: any,
  frameOrAttackerPos: any,
  drawCtxOrTargetPos: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let frame: any;
  let attackerPos: { x: number; y: number };
  let targetPos: { x: number; y: number };
  let isP: boolean;
  let isHit: boolean = true;
  let step: number;
  let leaderT: number | undefined;
  let p: number;

  if (frameOrAttackerPos && typeof frameOrAttackerPos.x === "number") {
    // Legacy signature: (ctx, attackerPos, targetPos, moveStep, progress, isPlayer)
    attackerPos = frameOrAttackerPos;
    targetPos = drawCtxOrTargetPos;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
    frame = {};
  } else {
    // Standard signature: (ctx, frame, drawCtx)
    frame = frameOrAttackerPos || {};
    const drawCtx = drawCtxOrTargetPos || {};
    attackerPos = drawCtx.attackerPos || { x: 200, y: 350 };
    targetPos = drawCtx.targetPos || { x: 550, y: 180 };
    isP = Boolean(drawCtx.isPlayer);
    isHit = Boolean(drawCtx.isHit ?? true);
    step = frame.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
    leaderT = frame.leaderT;
  }

  ctx.save();

  // 시전자 전면 발사점 좌표 (얼굴/전면에서 발사)
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)) + (isP ? 45 : -45);
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 15 : 10);

  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const mainAngle = Math.atan2(dy, dx);

  // 1) 몽환적인 딥 슬레이트 화면 필터 (단계별 자연스러운 명암 조절)
  let dimAlpha = 0;
  if (step === 1 || step === 2) {
    const lT = leaderT ?? (step === 1 ? p * 0.8 : 0.8 + p * 0.7);
    dimAlpha = Math.min(0.48, 0.20 + lT * 0.20);
  } else if (step === 3) {
    dimAlpha = 0.45;
  } else if (step === 4) {
    dimAlpha = Math.max(0, 0.45 * (1.0 - p));
  }

  if (dimAlpha > 0.02) {
    ctx.fillStyle = `rgba(15, 23, 42, ${dimAlpha})`;
    ctx.fillRect(-5000, -5000, 15000, 15000);
  }

  // 2) 초음파 방식 노란색 중공원 링 발사: 날아갈수록 원이 커지고 + 쌓이지 않고 적을 지나서 뒤로 관통 (넓어지면서 투명해짐)
  if (step === 1 || step === 2) {
    const RING_COUNT = 5;
    const RING_SPACING = 0.12;
    const curLeaderT = leaderT ?? (step === 1 ? p * 0.95 : 0.95 + p * 0.70);

    for (let i = 0; i < RING_COUNT; i++) {
      const ringT = curLeaderT - i * RING_SPACING;
      if (ringT <= 0) continue; // 아직 발사 전
      if (ringT > 1.75) continue; // 완전히 지나쳐 투명해져 소멸

      // 1) 날아갈수록 원이 커지게 (발사 시 22px -> 적 통과 시 56px -> 적 뒤로 지나가면서 최대 78px까지 확장)
      const curR = 22 + ringT * 34;

      // 2) 위치: 적에게 쌓이지 않고 직진 관통하여 적 뒤로 통과
      const curX = ax + dx * ringT;
      const curY = ay + dy * ringT;

      // 3) 투명도: 적에게 날아가며 선명해지다가, 적을 통과(ringT >= 0.85)하면서 넓어지며 투명해짐
      let curAlpha = 0;
      if (ringT <= 0.85) {
        curAlpha = Math.min(0.92, 0.22 + ringT * 0.70);
      } else {
        const fadeProg = (ringT - 0.85) / 0.75;
        curAlpha = Math.max(0, 0.92 * (1.0 - fadeProg));
      }
      if (curAlpha <= 0.02) continue;

      // 4) 3D 진행 축 틸트: 날아가면서 자연스럽게 깊이감 유지
      const depthRatio = 0.52 + Math.min(0.18, ringT * 0.12);
      drawHypnosisYellowCircle(ctx, curX, curY, curR, curAlpha, mainAngle, depthRatio, 1.06);
    }
  }

  // 3) 대상 졸음 유발 & 공용 수면 Zzz 룬 파티클 (Step 3)
  else if (step === 3) {
    if (!isHit) {
      ctx.restore();
      return;
    }

    const headX = tx + (isP ? 10 : -8);
    const headY = ty - (isP ? 38 : 32);
    drawSleepZzzEffect(ctx, headX, headY, p);
  }

  // 4) 수면 안착 및 암전 자연 해제 (Step 4)
  else if (step === 4) {
    if (!isHit) {
      ctx.restore();
      return;
    }

    // 수면 zzz가 완전히 피어오르며 상공으로 페이드아웃
    const headX = tx + (isP ? 10 : -8);
    const headY = ty - (isP ? 38 : 32);
    drawSleepZzzEffect(ctx, headX, headY, 0.70 + p * 0.40);
  }

  ctx.restore();
}

// ============================================================================
// 096: 요가포즈 (Meditate)
// ============================================================================

/**
 * 8방향 신성 기하학 연꽃 만다라(Zen Lotus Mandala) 서클 그리기
 */
function drawLotusMandala(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  alpha: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  const ryRatio = 0.42; // 원근 타원 투영 비율

  // 1) 외곽 점선/원형 림
  ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.85})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * ryRatio, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2) 8개의 뾰족한 연꽃 꽃잎 (Lotus Petals)
  const petalCount = 8;
  for (let i = 0; i < petalCount; i++) {
    const ang = (i / petalCount) * Math.PI * 2 + rot;
    const tipR = radius * 0.95;
    const tipX = Math.cos(ang) * tipR;
    const tipY = Math.sin(ang) * (tipR * ryRatio);

    const baseAng1 = ang - (Math.PI / petalCount) * 0.75;
    const baseAng2 = ang + (Math.PI / petalCount) * 0.75;
    const baseR = radius * 0.38;

    const b1x = Math.cos(baseAng1) * baseR;
    const b1y = Math.sin(baseAng1) * (baseR * ryRatio);
    const b2x = Math.cos(baseAng2) * baseR;
    const b2y = Math.sin(baseAng2) * (baseR * ryRatio);

    // 꽃잎 외곽 앰버 바디
    ctx.fillStyle = `rgba(245, 158, 11, ${alpha * 0.55})`;
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.quadraticCurveTo(
      Math.cos(ang) * (radius * 0.65),
      Math.sin(ang) * (radius * 0.65 * ryRatio),
      tipX,
      tipY
    );
    ctx.quadraticCurveTo(
      Math.cos(ang) * (radius * 0.65),
      Math.sin(ang) * (radius * 0.65 * ryRatio),
      b2x,
      b2y
    );
    ctx.closePath();
    ctx.fill();

    // 꽃잎 중심 맥선 (순백-황금)
    ctx.strokeStyle = `rgba(254, 240, 138, ${alpha * 0.95})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
  }

  // 3) 내부 동심 차크라 링 및 중심 광휘
  ctx.strokeStyle = `rgba(253, 224, 71, ${alpha * 0.95})`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.38, radius * 0.38 * ryRatio, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 6 * ryRatio, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

let meditateOffscreen: any = null;
let meditateOffscreenCtx: any = null;

function getMeditateOffscreen(size: number) {
  const s = Math.max(Math.ceil(size), 320);
  if (!meditateOffscreen || meditateOffscreen.width < s || meditateOffscreen.height < s) {
    meditateOffscreen = createCanvas(s, s);
    meditateOffscreenCtx = meditateOffscreen.getContext("2d");
  } else {
    meditateOffscreenCtx.clearRect(0, 0, meditateOffscreen.width, meditateOffscreen.height);
    meditateOffscreenCtx.globalCompositeOperation = "source-over";
    meditateOffscreenCtx.globalAlpha = 1.0;
  }
  return { canvas: meditateOffscreen, ctx: meditateOffscreenCtx };
}

/**
 * 요가포즈 3방향 축 분할 마스크 (30°, 150°, 270°)
 */
function applyMeditateConicMask(octx: any, ocx: number, ocy: number, reqSize: number) {
  octx.globalCompositeOperation = "destination-in";
  const conic = octx.createConicGradient(0, ocx, ocy);
  const minAlpha = 0.7; // 기준 투명도 0.7 (은은한 대비감)

  for (let deg = 0; deg <= 360; deg += 1.5) {
    const f = deg / 360;
    let phi = ((deg - 30) % 120 + 120) % 120;
    if (phi > 60) phi = 120 - phi;

    let a = 1.0;
    if (phi <= 4.0) {
      a = minAlpha;
    } else if (phi < 36.0) {
      const t = (phi - 4.0) / 32.0;
      a = minAlpha + (1.0 - minAlpha) * (t * t * (3 - 2 * t));
    } else {
      a = 1.0;
    }
    conic.addColorStop(Math.min(1.0, f), `rgba(0, 0, 0, ${a.toFixed(3)})`);
  }

  octx.fillStyle = conic;
  octx.fillRect(0, 0, reqSize, reqSize);
}

/**
 * 096 요가포즈: 외곽 기존 원 (#3D007B 딥 바이올렛)
 * - 밝은 라벤더 보더 & 이너 글로우 + 외곽 글로우 + 3축 분할 마스크
 */
function drawOuterMeditateCircle(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0
) {
  if (radius <= 0 || alpha <= 0) return;

  const glowOuter = radius + 6.0;
  const pad = 12;
  const reqSize = Math.ceil((glowOuter + pad) * 2);
  const { canvas: oc, ctx: octx } = getMeditateOffscreen(reqSize);

  const ocx = Math.floor(reqSize / 2);
  const ocy = Math.floor(reqSize / 2);

  // 1. #3D007B(61, 0, 123) 베이스 그라데이션
  // 원이 퍼질수록(radius가 커질수록) 안쪽 투명 영역(holeRatio)도 넓어져 맑은 파동 링을 형성
  const holeRatio = Math.min(0.65, 0.35 + (radius / 120) * 0.28);
  const midRatio = holeRatio + (1.0 - holeRatio) * 0.45;
  const bodyRatio = holeRatio + (1.0 - holeRatio) * 0.80;

  const grad = octx.createRadialGradient(ocx, ocy, 0, ocx, ocy, radius);
  grad.addColorStop(0, "rgba(61, 0, 123, 0)");          // 중심부 투명
  grad.addColorStop(holeRatio, "rgba(61, 0, 123, 0)");   // 퍼지면서 넓어지는 투명 영역
  grad.addColorStop(midRatio, "rgba(61, 0, 123, 0.50)"); // 베이스 딥 퍼플 중간조
  grad.addColorStop(bodyRatio, "rgba(61, 0, 123, 0.80)");// 베이스 #3D007B 선명한 바디
  grad.addColorStop(1.0, "rgba(61, 0, 123, 0.92)");     // 외곽 가장자리

  octx.fillStyle = grad;
  octx.beginPath();
  octx.arc(ocx, ocy, radius, 0, Math.PI * 2);
  octx.fill();

  // 2. 안쪽으로 퍼지는 밝은색 이너 글로우
  const innerGlowWidth = Math.min(12.0, Math.max(4.0, radius * 0.16));
  const innerR = Math.max(0, radius - innerGlowWidth);
  const innerGlowGrad = octx.createRadialGradient(ocx, ocy, innerR, ocx, ocy, radius);
  innerGlowGrad.addColorStop(0, "rgba(168, 85, 247, 0)");
  innerGlowGrad.addColorStop(0.50, "rgba(192, 132, 252, 0.25)");
  innerGlowGrad.addColorStop(0.85, "rgba(216, 180, 254, 0.55)");
  innerGlowGrad.addColorStop(1.0, "rgba(233, 213, 255, 0.75)");

  octx.fillStyle = innerGlowGrad;
  octx.beginPath();
  octx.arc(ocx, ocy, radius, 0, Math.PI * 2, false);
  octx.arc(ocx, ocy, innerR, 0, Math.PI * 2, true);
  octx.closePath();
  octx.fill();

  // 3. 외곽 선명한 Border
  octx.strokeStyle = "rgba(216, 180, 254, 0.95)";
  octx.lineWidth = 1.8;
  octx.beginPath();
  octx.arc(ocx, ocy, radius, 0, Math.PI * 2);
  octx.stroke();

  // 4. 외곽 글로우
  const glowGrad = octx.createRadialGradient(ocx, ocy, Math.max(0, radius - 1.5), ocx, ocy, glowOuter);
  glowGrad.addColorStop(0, "rgba(168, 85, 247, 0.40)");
  glowGrad.addColorStop(0.40, "rgba(97, 26, 179, 0.25)");
  glowGrad.addColorStop(1.0, "rgba(61, 0, 123, 0)");

  octx.fillStyle = glowGrad;
  octx.beginPath();
  octx.arc(ocx, ocy, glowOuter, 0, Math.PI * 2, false);
  octx.arc(ocx, ocy, Math.max(0, radius - 1.5), 0, Math.PI * 2, true);
  octx.closePath();
  octx.fill();

  // 5. 3방향 분할 마스크 합성
  applyMeditateConicMask(octx, ocx, ocy, reqSize);

  // 6. 메인 캔버스에 출력
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.drawImage(oc, 0, 0, reqSize, reqSize, Math.round(cx - ocx), Math.round(cy - ocy), reqSize, reqSize);
  ctx.restore();
}

/**
 * 096 요가포즈: 내부 2차 원 (#C507C4 비비드 네온 마젠타)
 * - 밝은 핑크-마젠타 보더 & 이너 글로우 + 외곽 글로우 + 3축 분할 마스크
 */
function drawInnerMeditateCircle(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0
) {
  if (radius <= 0 || alpha <= 0) return;

  const glowOuter = radius + 5.0;
  const pad = 12;
  const reqSize = Math.ceil((glowOuter + pad) * 2);
  const { canvas: oc, ctx: octx } = getMeditateOffscreen(reqSize);

  const ocx = Math.floor(reqSize / 2);
  const ocy = Math.floor(reqSize / 2);

  // 1. #C507C4(197, 7, 196) 베이스 그라데이션
  // 원이 퍼질수록(radius가 커질수록) 안쪽 투명 영역(holeRatio)도 넓어져 맑은 파동 링을 형성
  const holeRatio = Math.min(0.65, 0.35 + (radius / 120) * 0.28);
  const midRatio = holeRatio + (1.0 - holeRatio) * 0.45;
  const bodyRatio = holeRatio + (1.0 - holeRatio) * 0.80;

  const grad = octx.createRadialGradient(ocx, ocy, 0, ocx, ocy, radius);
  grad.addColorStop(0, "rgba(197, 7, 196, 0)");          // 중심부 투명
  grad.addColorStop(holeRatio, "rgba(197, 7, 196, 0)");   // 퍼지면서 넓어지는 투명 영역
  grad.addColorStop(midRatio, "rgba(197, 7, 196, 0.50)"); // #C507C4 중간조
  grad.addColorStop(bodyRatio, "rgba(197, 7, 196, 0.80)");// #C507C4 선명한 바디
  grad.addColorStop(1.0, "rgba(197, 7, 196, 0.92)");     // 가장자리 선명한 #C507C4

  octx.fillStyle = grad;
  octx.beginPath();
  octx.arc(ocx, ocy, radius, 0, Math.PI * 2);
  octx.fill();

  // 2. 안쪽으로 퍼지는 밝은 마젠타 이너 글로우
  const innerGlowWidth = Math.min(10.0, Math.max(3.0, radius * 0.16));
  const innerR = Math.max(0, radius - innerGlowWidth);
  const innerGlowGrad = octx.createRadialGradient(ocx, ocy, innerR, ocx, ocy, radius);
  innerGlowGrad.addColorStop(0, "rgba(197, 7, 196, 0)");
  innerGlowGrad.addColorStop(0.50, "rgba(232, 121, 249, 0.30)");
  innerGlowGrad.addColorStop(0.85, "rgba(244, 114, 182, 0.60)");
  innerGlowGrad.addColorStop(1.0, "rgba(253, 224, 71, 0.55)");

  octx.fillStyle = innerGlowGrad;
  octx.beginPath();
  octx.arc(ocx, ocy, radius, 0, Math.PI * 2, false);
  octx.arc(ocx, ocy, innerR, 0, Math.PI * 2, true);
  octx.closePath();
  octx.fill();

  // 3. 외곽 선명한 밝은 마젠타 Border
  octx.strokeStyle = "rgba(244, 114, 182, 0.95)";
  octx.lineWidth = 1.5;
  octx.beginPath();
  octx.arc(ocx, ocy, radius, 0, Math.PI * 2);
  octx.stroke();

  // 4. 외곽 글로우
  const glowGrad = octx.createRadialGradient(ocx, ocy, Math.max(0, radius - 1.5), ocx, ocy, glowOuter);
  glowGrad.addColorStop(0, "rgba(232, 121, 249, 0.45)");
  glowGrad.addColorStop(0.50, "rgba(197, 7, 196, 0.25)");
  glowGrad.addColorStop(1.0, "rgba(197, 7, 196, 0)");

  octx.fillStyle = glowGrad;
  octx.beginPath();
  octx.arc(ocx, ocy, glowOuter, 0, Math.PI * 2, false);
  octx.arc(ocx, ocy, Math.max(0, radius - 1.5), 0, Math.PI * 2, true);
  octx.closePath();
  octx.fill();

  // 5. 3방향 분할 마스크 합성
  applyMeditateConicMask(octx, ocx, ocy, reqSize);

  // 6. 메인 캔버스에 출력
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.drawImage(oc, 0, 0, reqSize, reqSize, Math.round(cx - ocx), Math.round(cy - ocy), reqSize, reqSize);
  ctx.restore();
}

/**
 * 요가포즈 파동 단계별 반경 및 투명도 계산
 * @param t 연속 시간 단위 (0 = 발현 시작)
 */
function getMeditateWaveProps(t: number) {
  const maxT = 6.8;
  if (t < 0 || t > maxT) {
    return { radius: 0, alpha: 0 };
  }

  // 확장 진행도 p: 0.0 (생성) ~ 1.0 (최대 확장 소멸)
  const p = Math.min(1.0, Math.max(0, t / maxT));

  // 반경: t=0일 때 20px에서 시작하여 퍼지면서 약 112px까지 확장
  const radius = 20 + p * 92;

  // [유저 요구사항] 원들이 퍼지면서(p가 증가할수록) 점점 투명해지도록 페이드아웃
  // 초반 0.88에서 시작하여 퍼져나감에 따라 부드럽게 감쇠되어 0으로 완전 투명화
  const alpha = Math.max(0, 0.88 * Math.pow(1.0 - p, 1.15));

  return { radius, alpha };
}

/**
 * 096: 요가포즈 (Meditate) 전용 렌더러
 * - [유저 요구사항] 기존 원(#3D007B)이 먼저 퍼지고 1프레임 뒤에 내부 원(#C507C4)이 뒤따라 발현/확장
 * - 중간프레임 대폭 증설(총 8단계 중간 프레임)로 부드럽고 풍성한 전개 연출
 */
export function drawMeditateEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  progress: number,
  isPlayer: boolean
) {
  ctx.save();

  const cx = attackerPos.x;
  const cy = attackerPos.y;

  // moveStep 1~8 기반 연속 시간 진행 t (각 스텝당 1.0 단위 진행)
  const t = moveStep - 1;

  // 1. 기존 외곽 원(#3D007B): t=0부터 시작하여 확장
  const outerProps = getMeditateWaveProps(t);
  if (outerProps.alpha > 0.01 && outerProps.radius > 0) {
    drawOuterMeditateCircle(ctx, cx, cy, outerProps.radius, outerProps.alpha);
  }

  // 2. 내부 작은 원(#C507C4): 유저 요청에 따라 정확히 3프레임 뒤(t - 3.0) 뒤따라 발현 및 추격 확장
  const innerProps = getMeditateWaveProps(t - 3.0);
  if (innerProps.alpha > 0.01 && innerProps.radius > 0) {
    drawInnerMeditateCircle(ctx, cx, cy, innerProps.radius, innerProps.alpha);
  }

  ctx.restore();
}
