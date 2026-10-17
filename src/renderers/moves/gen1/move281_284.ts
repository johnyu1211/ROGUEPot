// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { getTargetSpriteCenter } from "./move249_252.js";
import {
  drawMiniRetroStar,
  drawStarburstImpact,
  getKarateRedImg,
} from "../common/helpers.js";

// ============================================================================
// 📍 공통 시전자 좌표 헬퍼
// ============================================================================
function getCasterPos(drawCtx: EffectDrawContext, frame: BattleFrame) {
  const isP = drawCtx.isPlayer !== undefined ? Boolean(drawCtx.isPlayer) : true;
  const basePos = isP
    ? (drawCtx.pm || { x: 150, y: 280 })
    : (drawCtx.em || { x: 418, y: 152 });
  const offX = isP ? (frame?.pOffset?.x ?? 0) : (frame?.eOffset?.x ?? 0);
  const offY = isP ? (frame?.pOffset?.y ?? 0) : (frame?.eOffset?.y ?? 0);
  return {
    baseX: basePos.x,
    baseY: basePos.y,
    cx: basePos.x + offX,
    cy: basePos.y + offY - (isP ? 38 : 34),
    groundY: basePos.y + offY + (isP ? 6 : 4),
    offX,
    offY,
    isP,
  };
}

// ============================================================================
// 281: 하품 (Yawn) - Normal / Status
// - 시전 포켓몬이 크게 하품하며 입가에서 따스하고 몽글몽글한 김(뭉게 연기 뭉치)을 내뿜음
// - 뭉게 연기 뭉치가 두둥실(부드러운 상하 부유 파동 & 말랑한 호흡 스케일)하며 대상에게 유영
// - 대상에게 도달한 연기 뭉치가 얼굴 주변을 감싸며 김처럼 스르륵 피어올라 흩어짐
// ============================================================================

/**
 * 몽글몽글한 다엽형 하품 김/뭉게 연기 뭉치 렌더링 헬퍼
 * - 여러 개의 둥근 구름 로브(Lobe)가 겹쳐진 풍성한 뭉게구름/연기 뭉치 실루엣
 * - 중심부는 포근한 반투명 밀크화이트, 하단부는 은은한 연회색 입체 음영, 외곽은 부드럽게 퍼지는 김(Steam) 그라데이션
 */
function drawYawnSteamCluster(
  ctx: any,
  x: number,
  y: number,
  baseR: number,
  alpha: number,
  phase: number,
  wobbleX: number = 1.0,
  wobbleY: number = 1.0,
  rot: number = 0
) {
  if (alpha <= 0.01 || baseR <= 1) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(wobbleX, wobbleY);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  // 1. 바깥쪽으로 은은하게 번지는 수증기/김(Steam) 외곽 소프트 글로우
  const mistR = baseR * 1.55;
  const mistGrad = ctx.createRadialGradient(0, 0, baseR * 0.15, 0, 0, mistR);
  mistGrad.addColorStop(0, "rgba(255, 255, 255, 0.28)");
  mistGrad.addColorStop(0.55, "rgba(241, 245, 249, 0.14)");
  mistGrad.addColorStop(1, "rgba(241, 245, 249, 0)");
  ctx.fillStyle = mistGrad;
  ctx.beginPath();
  ctx.arc(0, 0, mistR, 0, Math.PI * 2);
  ctx.fill();

  // 뭉게 연기 뭉치를 구성하는 6개의 볼륨 로브 배치 (시간에 따라 미세하게 뭉글거림)
  const lobes = [
    { ox: -0.48, oy: 0.06, r: 0.62, sp: 0.0 },
    { ox: 0.48, oy: 0.08, r: 0.60, sp: 1.1 },
    { ox: -0.26, oy: -0.34, r: 0.66, sp: 2.2 },
    { ox: 0.26, oy: -0.32, r: 0.64, sp: 3.3 },
    { ox: -0.18, oy: 0.30, r: 0.56, sp: 4.4 },
    { ox: 0.22, oy: 0.28, r: 0.58, sp: 5.5 },
  ];

  // 2. 메인 뭉게 연기 몸체 (반투명하고 뽀얀 김/연기 클러스터)
  for (let i = 0; i < lobes.length; i++) {
    const lb = lobes[i];
    const pulse = 1 + Math.sin(phase * 3.2 + lb.sp) * 0.07;
    const lx = lb.ox * baseR * pulse;
    const ly = lb.oy * baseR * pulse;
    const lr = lb.r * baseR * pulse;

    const lobeGrad = ctx.createRadialGradient(
      lx - lr * 0.18,
      ly - lr * 0.22,
      lr * 0.08,
      lx,
      ly,
      lr * 1.12
    );
    lobeGrad.addColorStop(0, "rgba(255, 255, 255, 0.56)");
    lobeGrad.addColorStop(0.55, "rgba(248, 250, 252, 0.42)");
    lobeGrad.addColorStop(0.85, "rgba(226, 232, 240, 0.20)");
    lobeGrad.addColorStop(1, "rgba(226, 232, 240, 0)");

    ctx.fillStyle = lobeGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, lr * 1.12, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 중심 코어 퍼프 (부드러운 반투명 김 코어)
  const coreGrad = ctx.createRadialGradient(
    -baseR * 0.12,
    -baseR * 0.15,
    baseR * 0.08,
    0,
    0,
    baseR * 0.95
  );
  coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.64)");
  coreGrad.addColorStop(0.58, "rgba(248, 250, 252, 0.45)");
  coreGrad.addColorStop(1, "rgba(226, 232, 240, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, baseR * 0.95, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawYawnBehindEffect(
  _ctx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 기존 배경 비네트 및 핑크 후광 제거 (순수하게 뭉게 연기 뭉치만 연출)
}

export function drawYawnEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 0;
  const { cx, cy, isP } = getCasterPos(drawCtx, frame);
  const { x: tx, y: ty } = getTargetSpriteCenter(drawCtx, frame);

  ctx.save();

  const dirX = tx >= cx ? 1 : -1;
  const mouthX = cx + dirX * (isP ? 22 : 18);
  const mouthY = cy - (isP ? 8 : 4);

  // 1. 시전자 입가에서 하품할 때 피어오르는 초기 김(입김) 확산 (0.04 ~ 0.32)
  if (step >= 0.04 && step <= 0.32) {
    const p = (step - 0.04) / 0.28;
    const breathAlpha = Math.sin(p * Math.PI) * 0.42;
    const bx = mouthX + dirX * p * 18;
    const by = mouthY - p * 8;
    const br = (isP ? 14 : 12) + p * 18;

    const bGrad = ctx.createRadialGradient(bx, by, 2, bx, by, br);
    bGrad.addColorStop(0, `rgba(255, 255, 255, ${breathAlpha.toFixed(3)})`);
    bGrad.addColorStop(0.6, `rgba(241, 245, 249, ${(breathAlpha * 0.5).toFixed(3)})`);
    bGrad.addColorStop(1, "rgba(241, 245, 249, 0)");
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 두둥실 떠가며 대상에게 향하는 뭉게 연기 뭉치들 (0.06 ~ 0.96)
  // - 선두의 큼직한 메인 뭉게 연기 뭉치와 뒤따르는 보조 연기 뭉치들이
  //   부드러운 물결(두둥실 부유 궤적)을 그리며 대상에게 이동한 뒤 김처럼 피어오르며 스르륵 흩어짐
  const clouds = [
    {
      start: 0.06,
      arrive: 0.68,
      end: 0.92,
      baseR: 25,
      ampY: 22,
      freq: 2.0,
      phaseOff: 0.0,
      endOx: 0,
      endOy: -10,
    },
    {
      start: 0.14,
      arrive: 0.75,
      end: 0.96,
      baseR: 19,
      ampY: -18,
      freq: 2.2,
      phaseOff: 1.4,
      endOx: -12,
      endOy: -18,
    },
    {
      start: 0.21,
      arrive: 0.80,
      end: 0.98,
      baseR: 15,
      ampY: 15,
      freq: 2.4,
      phaseOff: 2.8,
      endOx: 12,
      endOy: -6,
    },
  ];

  for (let i = 0; i < clouds.length; i++) {
    const c = clouds[i];
    if (step < c.start || step > c.end) continue;

    const destX = tx + c.endOx;
    const destY = ty + c.endOy;

    if (step <= c.arrive) {
      // [두둥실 유영 구간]: 입가에서 피어나 위아래로 폭신하게 부유하며 대상에게 이동
      const tRaw = (step - c.start) / (c.arrive - c.start);
      // 부드러운 가감속
      const t = 0.5 - 0.5 * Math.cos(tRaw * Math.PI);

      const curX = mouthX + (destX - mouthX) * t;
      const linearY = mouthY + (destY - mouthY) * t;

      // "두둥실" 부유감: 완만한 아치 상승 + 사인파 상하 바운스
      const archLift = -Math.sin(tRaw * Math.PI) * 16;
      const bobbingY = Math.sin(tRaw * Math.PI * c.freq + c.phaseOff) * c.ampY * Math.sin(tRaw * Math.PI);
      const curY = linearY + archLift + bobbingY;

      // 입에서 나올 때 뭉게뭉게 커지며 등장 (살짝 투명한 김 느낌)
      const growScale = tRaw < 0.18 ? 0.35 + (tRaw / 0.18) * 0.65 : 1.0;
      const alpha = tRaw < 0.12 ? (tRaw / 0.12) * 0.72 : 0.72;

      // 두둥실 호흡에 맞춘 말랑말랑한 스케일 변화 & 살짝 흔들리는 각도
      const breathPhase = tRaw * Math.PI * 3.5 + c.phaseOff;
      const wobbleX = 1.0 + Math.sin(breathPhase) * 0.08;
      const wobbleY = 1.0 - Math.sin(breathPhase) * 0.07;
      const rot = Math.sin(tRaw * Math.PI * 2.5 + i) * 0.12;

      // 이동 궤적 뒤에 남는 작은 김(연기) 방울 잔상 2개
      for (let w = 1; w <= 2; w++) {
        const wtRaw = Math.max(0, tRaw - w * 0.055);
        if (wtRaw <= 0.02) continue;
        const wt = 0.5 - 0.5 * Math.cos(wtRaw * Math.PI);
        const wx = mouthX + (destX - mouthX) * wt;
        const wy =
          mouthY +
          (destY - mouthY) * wt -
          Math.sin(wtRaw * Math.PI) * 16 +
          Math.sin(wtRaw * Math.PI * c.freq + c.phaseOff) * c.ampY * Math.sin(wtRaw * Math.PI);
        const wr = c.baseR * (0.36 - w * 0.08) * growScale;
        const wAlpha = alpha * (0.32 - w * 0.10);

        const wGrad = ctx.createRadialGradient(wx, wy, 1, wx, wy, wr);
        wGrad.addColorStop(0, `rgba(255, 255, 255, ${wAlpha.toFixed(3)})`);
        wGrad.addColorStop(0.65, `rgba(241, 245, 249, ${(wAlpha * 0.5).toFixed(3)})`);
        wGrad.addColorStop(1, "rgba(241, 245, 249, 0)");
        ctx.fillStyle = wGrad;
        ctx.beginPath();
        ctx.arc(wx, wy, wr, 0, Math.PI * 2);
        ctx.fill();
      }

      drawYawnSteamCluster(
        ctx,
        curX,
        curY,
        c.baseR * growScale,
        alpha,
        tRaw * 2.5 + i,
        wobbleX,
        wobbleY,
        rot
      );
    } else {
      // [대상 도달 후 김처럼 스르륵 퍼지며 피어오르는 소산 구간] (arrive ~ end)
      const dissP = (step - c.arrive) / (c.end - c.arrive);
      const dissAlpha = Math.max(0, Math.cos(dissP * Math.PI * 0.5) * 0.70);
      // 위로 두둥실 피어오르며 넓게 퍼짐
      const curX = destX + Math.sin(dissP * Math.PI * 1.5 + i) * 8;
      const curY = destY - dissP * 24;
      const expandR = c.baseR * (1.0 + dissP * 0.45);
      const wobbleX = 1.0 + dissP * 0.15;
      const wobbleY = 1.0 - dissP * 0.08;
      const rot = Math.sin(dissP * Math.PI + i) * 0.15;

      drawYawnSteamCluster(
        ctx,
        curX,
        curY,
        expandR,
        dissAlpha,
        1.0 + dissP * 2 + i,
        wobbleX,
        wobbleY,
        rot
      );
    }
  }

  ctx.restore();
}

// ============================================================================
// 282: 탁쳐서떨구기 (Knock Off) - Dark / Physical
// - 90도로 세워진 태권당수 손바닥 (빨간 필터 씌워진 상태: getKarateRedImg)
// - 위에서 아래로 내려치기
// - 타격 이후 Z축 회전을 통해 내려치는 느낌
// - 타격 시 점 파티클 (흰노란 글로우 + 중심 흰색) 비산
// ============================================================================

interface KnockOffDotParticleSpec {
  angle: number;
  speed: number;
  startT: number;
  life: number;
  coreR: number;
}

const KNOCK_OFF_HIT_DOT_PARTICLES: KnockOffDotParticleSpec[] = [
  { angle: -Math.PI * 0.94, speed: 62, startT: 0.00, life: 0.78, coreR: 3.1 },
  { angle: -Math.PI * 0.81, speed: 65, startT: 0.02, life: 0.80, coreR: 3.4 },
  { angle: -Math.PI * 0.68, speed: 58, startT: 0.01, life: 0.75, coreR: 2.8 },
  { angle: -Math.PI * 0.55, speed: 64, startT: 0.00, life: 0.79, coreR: 3.2 },
  { angle: -Math.PI * 0.24, speed: 61, startT: 0.02, life: 0.76, coreR: 3.0 },
  { angle: -Math.PI * 0.08, speed: 66, startT: 0.00, life: 0.80, coreR: 3.3 },
  { angle:  Math.PI * 0.12, speed: 60, startT: 0.01, life: 0.77, coreR: 3.1 },
  { angle:  Math.PI * 0.28, speed: 63, startT: 0.02, life: 0.76, coreR: 2.9 },
  { angle:  Math.PI * 0.46, speed: 59, startT: 0.00, life: 0.78, coreR: 3.2 },
  { angle:  Math.PI * 0.62, speed: 64, startT: 0.01, life: 0.75, coreR: 2.8 },
  { angle:  Math.PI * 0.76, speed: 62, startT: 0.00, life: 0.79, coreR: 3.1 },
  { angle:  Math.PI * 0.90, speed: 60, startT: 0.02, life: 0.76, coreR: 2.9 },
];

/**
 * 탁쳐서떨구기 타격 점 파티클 렌더러 (흰노란 글로우 + 중심 순백색 코어)
 */
function drawKnockOffHitDotParticles(
  ctx: any,
  tx: number,
  ty: number,
  prog: number
) {
  if (prog <= 0 || prog >= 1.0) return;
  ctx.save();

  for (const p of KNOCK_OFF_HIT_DOT_PARTICLES) {
    const localT = (prog - p.startT) / p.life;
    if (localT <= 0 || localT >= 1.0) continue;

    // 중심에서 원형/방사형으로 시원하게 퍼져나감
    const distEase = 1.0 - Math.pow(1.0 - localT, 2.2);
    const dist = 10 + p.speed * distEase;
    const px = tx + Math.cos(p.angle) * dist;
    const py = ty + Math.sin(p.angle) * dist;

    const alpha =
      localT < 0.16
        ? localT / 0.16
        : Math.pow(Math.max(0, 1.0 - (localT - 0.16) / 0.84), 1.35);
    if (alpha <= 0.02) continue;

    const scale =
      localT < 0.25
        ? 0.85 + 0.25 * (localT / 0.25)
        : 1.10 - 0.45 * ((localT - 0.25) / 0.75);
    const coreR = Math.max(1.2, p.coreR * scale);
    const glowR = coreR * 3.3;

    // 1) 바깥 흰노란 글로우 (White-Yellow Glow)
    const glowGrad = ctx.createRadialGradient(px, py, coreR * 0.25, px, py, glowR);
    glowGrad.addColorStop(0.00, `rgba(255, 255, 255, ${(alpha * 0.98).toFixed(3)})`);
    glowGrad.addColorStop(0.32, `rgba(254, 249, 195, ${(alpha * 0.92).toFixed(3)})`); // 연한 흰노랑 (#FEF9C3)
    glowGrad.addColorStop(0.65, `rgba(250, 204, 21, ${(alpha * 0.55).toFixed(3)})`);  // 선명한 옐로우 글로우 (#FACC15)
    glowGrad.addColorStop(1.00, "rgba(250, 204, 21, 0.0)");

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(px, py, glowR, 0, Math.PI * 2);
    ctx.fill();

    // 2) 중심 흰색 코어 점 (Pure White Center)
    ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.98).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px, py, coreR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawKnockOffBehindEffect(
  _ctx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 불필요한 후면 암전 및 후광 제거 (순수하게 손바닥 내려치기 연출 집중)
}

export function drawKnockOffEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 0;
  if (!frame.showEffect || step <= 0 || step >= 1.0) return;

  const { isP } = getCasterPos(drawCtx, frame);
  // 피격 포켓몬의 흔들림(eOffset/pOffset)에 손바닥 궤적이나 타격 점 파티클이 흔들리지 않도록 고정 중심 좌표 사용
  const { x: tx, y: ty } = getTargetSpriteCenter(drawCtx, {} as BattleFrame);

  const sprite = getKarateRedImg();
  if (!sprite) return;

  // 시전자 방향에 따른 좌우 반전 (엄지가 시전자 쪽/바깥쪽, 손날이 타격 방향을 향하도록 설정)
  const dir = isP ? 1 : -1;

  // 1. 도구가 있는 경우: 작은 몬스터볼 형태(위 빨강, 아래 흰색) 구체가 통통 튀며 떨어지는 연출 (step >= 0.26 ~ 0.96)
  // ⚠️ 손 형상 아래(뒤) 레이어에 그려지도록 손바닥보다 먼저 렌더링
  const act = frame.moveEffect;
  const logStr = typeof act?.log === "string" ? act.log : "";
  const hasKnockedOffItem =
    frame.knockedOffItem !== undefined
      ? Boolean(frame.knockedOffItem)
      : act?.knockedOffItem !== undefined
        ? Boolean(act.knockedOffItem)
        : logStr.length > 0
          ? logStr.includes("탁 쳐서 떨어뜨렸다") || logStr.toLowerCase().includes("knocked off")
          : true;

  if (hasKnockedOffItem && step >= 0.26 && step <= 0.96) {
    const p = (step - 0.26) / 0.70;
    const itemAlpha = p < 0.82 ? 1.0 : Math.max(0, (1 - p) / 0.18);

    // 피격 포켓몬에서 바깥쪽 바닥으로 통통 튀며 이동 (타격 직후 손과 겹침을 줄이도록 18px 바깥에서 시작)
    const knockDir = isP ? 1 : -1;
    const ix = tx + knockDir * (18 + p * 62);
    const groundLevel = ty + (isP ? 26 : 32);

    // 3회 통통 튀는 포물선 바운스 궤적:
    // 1차 바운스 (0.00 ~ 0.52): 타격 지점에서 위로 튀어올랐다가 바닥 착지
    // 2차 바운스 (0.52 ~ 0.80): 바닥에서 통! 튀어오름
    // 3차 바운스 (0.80 ~ 1.00): 작게 한 번 더 톡 튀고 멈춤
    let iy = groundLevel;
    if (p < 0.52) {
      const bp = p / 0.52;
      const startY = ty + 2;
      const linearY = startY + (groundLevel - startY) * bp;
      const arcLift = Math.sin(bp * Math.PI) * 36;
      iy = linearY - arcLift;
    } else if (p < 0.80) {
      const bp = (p - 0.52) / 0.28;
      const arcLift = Math.sin(bp * Math.PI) * 18;
      iy = groundLevel - arcLift;
    } else {
      const bp = (p - 0.80) / 0.20;
      const arcLift = Math.sin(bp * Math.PI) * 6;
      iy = groundLevel - arcLift;
    }

    // 바닥 그림자
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${(itemAlpha * 0.35).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(ix, groundLevel + 5, 6.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 작은 몬스터볼 형태 (위 빨강, 아래 흰색) 구체 렌더링
    const rot = p * Math.PI * 4.5 * knockDir;
    const ballR = 7.0; // 작고 귀여운 필드 도구 볼 사이즈

    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, itemAlpha));

    // 1) 아래쪽 반구: 흰색 (#FFFFFF ~ 연회색 입체 음영)
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.arc(0, 0, ballR, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();

    // 2) 위쪽 반구: 빨간색 (#EF4444)
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(0, 0, ballR, Math.PI, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();

    // 3) 중앙 가로 검은 띠 & 외곽 윤곽선
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-ballR, 0);
    ctx.lineTo(ballR, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, ballR, 0, Math.PI * 2);
    ctx.stroke();

    // 4) 정중앙 작은 흰색 버튼
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // 5) 상단 빨간 반구 위 작은 광택 하이라이트
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(-2.3, -2.8, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 2. 태권당수 손바닥 내려치기 & Z축 회전 스윙 (몬스터볼 위에 그려지도록 배치)
  // 기본 각도: 90도로 세워진 상태 (원본이 왼쪽을 향하므로 +90도(Math.PI / 2) 회전 시 손가락이 위를 향해 직립)
  const baseRotZ = Math.PI / 2;

  let handOx = -14 * dir;
  let handOy = -72;
  let zRotOffset = 0; // 타격 이후 Z축 추가 회전량
  let handAlpha = 1.0;

  if (step < 0.14) {
    // 1단계: 대상 포켓몬 머리 위 상공에서 90도로 세워진 빨간 손바닥 출현 및 살짝 뜸
    const p = step / 0.14;
    handOy = -68 - p * 8; // -68 -> -76 (내려치기 직전 예비 동작)
    zRotOffset = 0;
    handAlpha = Math.min(1.0, p / 0.35);
  } else if (step < 0.26) {
    // 2단계: 위에서 아래로 수직 하강하여 타격 지점(중앙)까지 내려침 (90도 직립 유지)
    const p = (step - 0.14) / 0.12;
    const easeIn = Math.pow(p, 1.6);
    handOy = -76 + easeIn * 70; // -76 -> -6 (타격 지점 도달)
    zRotOffset = 0;
    handAlpha = 1.0;
  } else if (step < 0.68) {
    // 3단계: 타격 이후 Z축 회전을 통해 강하게 내려치는 스윙 팔로우스루
    const p = (step - 0.26) / 0.42;
    const easeOut = 1 - Math.pow(1 - p, 2.2);

    // Z축 회전: 90도 직립 상태에서 타격 방향으로 약 105도(-Math.PI * 0.58) Z축 회전하며 내려침
    zRotOffset = -easeOut * (Math.PI * 0.58);

    // 회전과 함께 아래쪽 및 전방으로 호를 그리며 내려찍힘
    handOx = (-14 + easeOut * 28) * dir;
    handOy = -6 + easeOut * 48; // -6 -> +42
    handAlpha = 1.0;

    // 고속 회전 내려치기 구간의 잔상 (Z축 회전 궤적 강조)
    if (p > 0.08 && p < 0.85) {
      for (let tIdx = 1; tIdx <= 2; tIdx++) {
        const tp = Math.max(0, p - tIdx * 0.11);
        const tEase = 1 - Math.pow(1 - tp, 2.2);
        const trailOx = (-14 + tEase * 28) * dir;
        const trailOy = -6 + tEase * 48;
        const trailZRot = baseRotZ - tEase * (Math.PI * 0.58);
        const trailAlpha = (0.32 - tIdx * 0.11) * (1 - p * 0.5);

        ctx.save();
        ctx.globalAlpha = Math.max(0, trailAlpha);
        ctx.translate(tx + trailOx, ty + trailOy);
        if (isP) {
          ctx.scale(-1, 1);
        }
        ctx.rotate(trailZRot);
        const sw = 80 * 1.05;
        const sh = 60 * 1.05;
        ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
        ctx.restore();
      }
    }
  } else {
    // 4단계: 내려친 끝 지점에서 회전 각도를 유지한 채 서서히 페이드아웃
    const p = (step - 0.68) / 0.32;
    zRotOffset = -(Math.PI * 0.58 + p * 0.08);
    handOx = (14 + p * 4) * dir;
    handOy = 42 + p * 6;
    handAlpha = Math.max(0, 1 - p);
  }

  if (handAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, handAlpha));
    ctx.translate(tx + handOx, ty + handOy);
    if (isP) {
      ctx.scale(-1, 1);
    }
    // Z축 회전 (2D 캔버스 평면 회전 = Z축 회전)
    ctx.rotate(baseRotZ + zRotOffset);

    const sw = 80 * 1.05;
    const sh = 60 * 1.05;
    ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }

  // 3. 타격 시점(step >= 0.26)부터 퍼져나가는 흰노란 글로우 + 중심 흰색 타격 점 파티클
  if (step >= 0.26 && step <= 0.78) {
    const dotProg = (step - 0.26) / 0.52;
    drawKnockOffHitDotParticles(ctx, tx, ty, dotProg);
  }
}

// ============================================================================
// 283: 죽기살기 (Endeavor) - Normal / Physical
// - 이전 객기(263, Facade) 기반 이펙트:
//   1. 시전 포켓몬이 아래로 납작 / 세로로 길어짐을 반복(스쿼시&스트레치)하며 최대 웅크림
//   2. 이때 시전자에게서 3D 포물선 궤적의 타원형 땀방울(중심 완전 투명, 외곽 푸른빛 테두리 & 하이라이트 점)이 사방으로 튐
//   3. 전방 고속 쇄도 및 정통 몸통박치기 정면 격돌 (순백 섬광 코어 + 8각 스타버스트 + 충격파 링 + 레트로 별 스파크)
// ============================================================================

function drawEndeavorImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number = 8,
  fillColor: string = "#FFFFFF",
  strokeColor: string = "#FEF08A",
  lineWidth: number = 2.4,
  rotation: number = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (rotation !== 0) ctx.rotate(rotation);

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;

  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  if (strokeColor && lineWidth > 0) ctx.stroke();
  ctx.restore();
}

function drawEndeavorSweatDroplet(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  angle: number,
  elongation: number = 1.35,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const rx = radius * elongation;
  const ry = radius;

  // 1. 내각 글로우 & 완전 투명 중심
  ctx.save();
  ctx.scale(rx, ry);

  const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.0);
  innerGrad.addColorStop(0.0, "rgba(56, 189, 248, 0.0)");
  innerGrad.addColorStop(0.45, "rgba(56, 189, 248, 0.0)");
  innerGrad.addColorStop(0.70, `rgba(56, 189, 248, ${(alpha * 0.32).toFixed(3)})`);
  innerGrad.addColorStop(0.88, `rgba(14, 165, 233, ${(alpha * 0.68).toFixed(3)})`);
  innerGrad.addColorStop(1.0, `rgba(2, 132, 199, ${(alpha * 0.90).toFixed(3)})`);

  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 선명한 타원형 푸른 외곽선
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(14, 165, 233, ${(alpha * 0.95).toFixed(3)})`;
  ctx.lineWidth = Math.max(1.1, radius * 0.30);
  ctx.stroke();

  ctx.strokeStyle = `rgba(2, 132, 199, ${(alpha * 0.85).toFixed(3)})`;
  ctx.lineWidth = Math.max(0.6, radius * 0.15);
  ctx.stroke();

  // 3. 상단/내측 단일 순백 하이라이트 점
  const hx = -rx * 0.25;
  const hy = -ry * 0.38;
  const hr = Math.max(0.70, radius * 0.24);
  ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.95).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

const ENDEAVOR_SWEAT_DROPLETS_3D = [
  // Behind Layer (Vz < 0: 시전자 뒤쪽 방향으로 포물선 비산, 3개)
  { angle: -2.60, speed: 122, vy: 82,  radius: 2.5, elong: 1.35, tDelay: 0.00 },
  { angle: -1.75, speed:  82, vy: 116, radius: 2.3, elong: 1.28, tDelay: 0.14 },
  { angle: -0.80, speed: 108, vy: 74,  radius: 2.6, elong: 1.32, tDelay: 0.05 },

  // Front Layer (Vz >= 0: 시전자 앞/하단 방향으로 포물선 비산, 3개)
  { angle:  0.40, speed: 130, vy: 96,  radius: 2.7, elong: 1.35, tDelay: 0.03 },
  { angle:  1.95, speed:  78, vy: 112, radius: 2.4, elong: 1.30, tDelay: 0.18 },
  { angle:  2.85, speed: 112, vy: 86,  radius: 2.6, elong: 1.32, tDelay: 0.09 },
];

// 2차 땀방울 웨이브: 두번째는 더 격하게 (개수 증가 + 반경/장축 확대 + 사방 맹렬한 포물선 비산)
const ENDEAVOR_SWEAT_DROPLETS_WAVE2_3D = [
  // Behind Layer (Vz < 0: 5개)
  { angle: -2.75, speed: 134, vy: 92,  radius: 2.9, elong: 1.42, tDelay: 0.00 },
  { angle: -2.20, speed: 116, vy: 118, radius: 2.7, elong: 1.38, tDelay: 0.06 },
  { angle: -1.62, speed:  94, vy: 132, radius: 2.8, elong: 1.35, tDelay: 0.12 },
  { angle: -1.05, speed: 124, vy: 104, radius: 2.7, elong: 1.40, tDelay: 0.03 },
  { angle: -0.52, speed: 138, vy: 86,  radius: 3.0, elong: 1.44, tDelay: 0.09 },

  // Front Layer (Vz >= 0: 5개)
  { angle:  0.32, speed: 142, vy: 106, radius: 3.1, elong: 1.45, tDelay: 0.02 },
  { angle:  0.95, speed: 118, vy: 122, radius: 2.8, elong: 1.38, tDelay: 0.08 },
  { angle:  1.78, speed:  92, vy: 128, radius: 2.7, elong: 1.36, tDelay: 0.15 },
  { angle:  2.38, speed: 126, vy: 108, radius: 2.9, elong: 1.40, tDelay: 0.05 },
  { angle:  2.92, speed: 136, vy: 94,  radius: 3.0, elong: 1.42, tDelay: 0.11 },
];

function drawEndeavor3DParabolicSweatWaves(
  ctx: any,
  ax: number,
  ay: number,
  t: number,
  intensityScale: number = 1.0,
  isBehindLayer: boolean = false,
  isPlayer: boolean = true,
  sweatWave: number = 1
) {
  if (t <= 0 || t > 1.10) return;

  const g = 145;
  const droplets = sweatWave === 2 ? ENDEAVOR_SWEAT_DROPLETS_WAVE2_3D : ENDEAVOR_SWEAT_DROPLETS_3D;

  for (let i = 0; i < droplets.length; i++) {
    const drop = droplets[i];
    const isBack = Math.sin(drop.angle) < 0;
    if (isBehindLayer !== isBack) continue;

    const tDelay = drop.tDelay ?? 0;
    if (t < tDelay) continue;

    const curT = Math.min(1.05, (t - tDelay) / (1.0 - tDelay * 0.75));
    if (curT <= 0) continue;

    const angle = isPlayer ? drop.angle : (Math.PI - drop.angle);
    const speed = drop.speed * intensityScale;
    const vy0 = drop.vy * intensityScale;

    const dx = Math.cos(angle) * (speed * curT);
    const dz = Math.sin(angle) * (speed * 0.45 * curT);
    const h = vy0 * curT - 0.5 * g * curT * curT;

    const screenX = ax + dx;
    const screenY = ay + dz - h;

    const vx = Math.cos(angle) * speed;
    const vyScreen = Math.sin(angle) * (speed * 0.45) - (vy0 - g * curT);
    const tangentAngle = Math.atan2(vyScreen, vx);

    const depthRatio = Math.sin(angle);
    const depthScale = Math.max(0.85, Math.min(1.15, 1.0 + depthRatio * 0.15));

    let lifeAlpha = 1.0;
    if (curT < 0.10) {
      lifeAlpha = Math.max(0.3, curT / 0.10);
    } else if (curT > 0.82) {
      lifeAlpha = Math.max(0.0, 1.0 - (curT - 0.82) / 0.23);
    }

    if (lifeAlpha <= 0.01) continue;

    drawEndeavorSweatDroplet(
      ctx,
      screenX,
      screenY,
      drop.radius * depthScale,
      tangentAngle,
      drop.elong,
      lifeAlpha
    );
  }
}

export function drawEndeavorBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const moveStep = frame.moveStep ?? 1;
  const isPlayer = drawCtx.isPlayer ?? true;
  const attackerPos = drawCtx.attackerPos ?? (isPlayer ? { x: 175, y: 220 } : { x: 418, y: 152 });
  const targetPos = drawCtx.targetPos ?? (isPlayer ? { x: 418, y: 152 } : { x: 175, y: 220 });

  // [Step 1]: 웅크림 및 발밑 흙먼지/긴장 진동 + 3D 포물선 땀방울 (Behind 레이어)
  if (moveStep === 1) {
    const sweatWave = (frame as any).sweatWave ?? 1;
    const sweatIntensity = (frame as any).sweatIntensity ?? (sweatWave === 2 ? 1.38 : 1.0);
    const isWindup = frame.phaseId === "endeavor-windup-crouch" || sweatWave === 2;
    const dustAlpha = isWindup ? 0.78 : 0.45;
    const footX = attackerPos.x;
    const footY = attackerPos.y + 18;

    ctx.save();
    ctx.fillStyle = `rgba(209, 213, 219, ${dustAlpha})`;
    ctx.beginPath();
    ctx.arc(footX - (isPlayer ? 12 : -12), footY, isWindup ? 6.0 : 4.0, 0, Math.PI * 2);
    ctx.arc(footX - (isPlayer ? 18 : -18), footY - 1, isWindup ? 5.0 : 3.0, 0, Math.PI * 2);
    ctx.arc(footX + (isPlayer ? 10 : -10), footY, isWindup ? 4.5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const ax = attackerPos.x;
    const ay = attackerPos.y - 12;
    const sweatT = frame.sweatT ?? 0.50;

    drawEndeavor3DParabolicSweatWaves(ctx, ax, ay, sweatT, sweatIntensity, true, isPlayer, sweatWave);
  }

  // [Step 2]: 전방 고속 쇄도 시전자 후방 스피드 스트림
  if (moveStep === 2) {
    ctx.save();
    const ax = attackerPos.x;
    const ay = attackerPos.y;
    const tx = targetPos.x;
    const ty = targetPos.y;
    const angle = Math.atan2(ty - ay, tx - ax);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const perpX = -sin;
    const perpY = cos;

    const streakOffsets = [-16, -7, 6, 16];
    for (let i = 0; i < streakOffsets.length; i++) {
      const off = streakOffsets[i];
      const startDist = -14 - (i % 2) * 8;
      const endDist = -56 - (i % 3) * 16;

      const sx = ax + perpX * off + cos * startDist;
      const sy = ay + perpY * off + sin * startDist;
      const ex = ax + perpX * off + cos * endDist;
      const ey = ay + perpY * off + sin * endDist;

      const grad = ctx.createLinearGradient(sx, sy, ex, ey);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.90)");
      grad.addColorStop(0.4, "rgba(224, 242, 254, 0.70)");
      grad.addColorStop(1, "rgba(186, 230, 253, 0.0)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawEndeavorEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const moveStep = frame.moveStep ?? 1;
  const isPlayer = drawCtx.isPlayer ?? true;
  const isHit = drawCtx.isHit ?? true;
  const attackerPos = drawCtx.attackerPos ?? (isPlayer ? { x: 175, y: 220 } : { x: 418, y: 152 });
  const targetPos = drawCtx.targetPos ?? (isPlayer ? { x: 418, y: 152 } : { x: 175, y: 220 });

  // [Step 1]: 3D 포물선 땀방울 [Front 레이어: 시전자 앞쪽으로 튀는 땀방울]
  if (moveStep === 1) {
    const ax = attackerPos.x;
    const ay = attackerPos.y - 12;
    const sweatT = frame.sweatT ?? 0.50;
    const sweatWave = (frame as any).sweatWave ?? 1;
    const sweatIntensity = (frame as any).sweatIntensity ?? (sweatWave === 2 ? 1.38 : 1.0);

    drawEndeavor3DParabolicSweatWaves(ctx, ax, ay, sweatT, sweatIntensity, false, isPlayer, sweatWave);
    return;
  }

  // [Step 2]: 전방 고속 쇄도
  if (moveStep === 2) {
    return;
  }

  // [Step 3]: 몸통박치기 정면 3연속 격돌 (순백 섬광 코어 + 8각 스타버스트 + 충격파 링 + 속도선 + 레트로 별 스파크)
  if (moveStep === 3) {
    if (!isHit) return;

    const hitIndex = (frame as any).hitIndex ?? 3;
    const hitOx = hitIndex === 1 ? -12 : hitIndex === 2 ? 12 : 0;
    const hitOy = hitIndex === 1 ? -6 : hitIndex === 2 ? 5 : 0;
    const tx = targetPos.x + hitOx;
    const ty = targetPos.y + hitOy;
    const p = Math.max(0, Math.min(1, frame.effectProgress ?? 0.5));
    const rotOffset = hitIndex === 1 ? -0.18 : hitIndex === 2 ? 0.22 : 0;

    ctx.save();

    // 1. 순백 중심 섬광 코어
    const flashAlpha = Math.max(0, 1.0 - p * 0.85);
    if (flashAlpha > 0.03) {
      const coreR = 24 + (1.0 - p) * 16;
      const grad = ctx.createRadialGradient(tx, ty, 2, tx, ty, coreR);
      grad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha.toFixed(3)})`);
      grad.addColorStop(0.35, `rgba(254, 240, 138, ${(flashAlpha * 0.9).toFixed(3)})`);
      grad.addColorStop(0.75, `rgba(253, 224, 71, ${(flashAlpha * 0.45).toFixed(3)})`);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tx, ty, coreR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. 날카로운 8각 충돌 스타버스트
    const burstAlpha = Math.max(0, 1.0 - p * 0.90);
    if (burstAlpha > 0.03) {
      const outerR = 22 + p * 20;
      const innerR = outerR * 0.42;
      drawEndeavorImpactBurst(
        ctx,
        tx,
        ty,
        outerR,
        innerR,
        8,
        `rgba(255, 255, 255, ${burstAlpha.toFixed(3)})`,
        `rgba(253, 224, 71, ${(burstAlpha * 0.95).toFixed(3)})`,
        2.5,
        rotOffset + p * 0.40
      );
    }

    // 3. 순백 고속 팽창 충격파 링
    const ringAlpha = Math.max(0, 1.0 - p * 0.92);
    if (ringAlpha > 0.03) {
      const rx = 16 + p * 34;
      const ry = rx * 0.72;
      ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha.toFixed(3)})`;
      ctx.lineWidth = 3.0 * (1.0 - p * 0.35);
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(254, 240, 138, ${(ringAlpha * 0.65).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx + 4, ry + 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. 격돌 관통 속도선
    const lineAlpha = Math.max(0, 1.0 - p * 1.1);
    if (lineAlpha > 0.05) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha.toFixed(3)})`;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      const dir = isPlayer ? 1 : -1;
      for (const lineOff of [-14, 0, 14]) {
        ctx.beginPath();
        ctx.moveTo(tx - dir * 22, ty + lineOff - 8);
        ctx.lineTo(tx + dir * 18, ty + lineOff);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. 사방 비산 레트로 별빛 스파크
    const starAlpha = Math.max(0, 1.0 - p * 0.85);
    if (starAlpha > 0.04) {
      const starAngles = [-0.65, 0.45, 1.75, 2.85, -2.15, -1.25];
      for (let i = 0; i < starAngles.length; i++) {
        const a = starAngles[i] + rotOffset;
        const dist = 12 + p * (26 + (i % 3) * 10);
        const sx = tx + Math.cos(a) * dist;
        const sy = ty + Math.sin(a) * (dist * 0.82);
        drawMiniRetroStar(ctx, sx, sy, 5.0 * (1.0 - p * 0.3), `rgba(254, 240, 138, ${starAlpha.toFixed(3)})`, a + p);
      }
    }

    ctx.restore();
  }
}

// ============================================================================
// 284: 분화 (Eruption) - Fire / Special
// - 바위(돌): 매그니튜드(222)의 3면 입체 다면체 바위(drawPolygonalRock) 스타일 적용
// - 화염 분출: 직선 사각형(fillRect) 기둥을 제거하고, 자연스럽게 일렁이며 솟구치는 볼류메트릭 화산 화염/연기 분수로 개선
// - 화산폭발의 자잘한 알갱이(화산재·자갈·불티 알갱이)들이 시전 포켓몬 위쪽(머리 상공)에서 다량 분출되도록 구현
// ============================================================================

const ERUPTION_ROCK_PALETTE = {
  rockShadow: "#140B09",
  rockBase: "#261714",
  rockHighlight: "#3D2722",
  emberCore: "#FEF08A",
  emberMid: "#F97316",
  emberDeep: "#DC2626",
  ashDark: "#140E0C",
};

/**
 * 매그니튜드(222)의 drawPolygonalRock을 기반으로 한 입체 다면체 화산 바위 렌더러
 * - 유저 요청: "분화의 돌 근처 부분 빨간색으로 하고" -> 바위 외곽 윤곽과 주변부를 선명한 용암 붉은색(#EF4444 / #DC2626)으로 감싸기
 */
function drawVolcanicBoulder(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  rot: number,
  alpha: number = 1.0,
  withHeatGlow: boolean = true
) {
  if (alpha <= 0.01 || size <= 1) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // 바위 6각형 외곽선 Hull 경로 생성 헬퍼 (scale 배율 지원)
  const makeScaledHullPath = (scale: number) => {
    const s = size * scale;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.85, -s * 0.25);
    ctx.lineTo(s * 0.7, s * 0.7);
    ctx.lineTo(-s * 0.5, s);
    ctx.lineTo(-s * 0.9, s * 0.4);
    ctx.lineTo(-s * 0.85, -s * 0.25);
    ctx.closePath();
  };

  // 돌 근처 붉은 용암 테두리:
  // ⚠️ 반투명(alpha < 1) 붉은 글로우가 흰 연기와 섞이면 연분홍/흰빛 픽셀이 되어
  // 256색 GIF 양자화 과정에서 돌 외곽에 흰색 테두리처럼 보이는 현상이 발생함!
  // 이를 원천 차단하기 위해 반투명 글로우를 제거하고 100% 불투명(alpha 1.0) 진홍/적색 다각형 셸로 감쌈.
  if (withHeatGlow) {
    // 바깥쪽 진한 암적색 용암 림 (불투명)
    ctx.fillStyle = "#881313";
    makeScaledHullPath(1.26);
    ctx.fill();

    // 안쪽 선명한 진홍색 용암 림 (불투명, 흰빛 섞이지 않은 순수 적색)
    ctx.fillStyle = "#C81E1E";
    makeScaledHullPath(1.14);
    ctx.fill();
  }

  // 기본 외곽 채우기 (면 사이 틈새 방지)
  ctx.fillStyle = ERUPTION_ROCK_PALETTE.rockBase;
  makeScaledHullPath(1.0);
  ctx.fill();

  // 1. 상단 밝은 면 (매그니튜드 동일 3D 폴리곤 구조 - 어두운 갈색)
  ctx.fillStyle = ERUPTION_ROCK_PALETTE.rockHighlight;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.85, -size * 0.25);
  ctx.lineTo(0, size * 0.3);
  ctx.lineTo(-size * 0.85, -size * 0.25);
  ctx.closePath();
  ctx.fill();

  // 2. 좌측 중간면
  ctx.fillStyle = ERUPTION_ROCK_PALETTE.rockBase;
  ctx.beginPath();
  ctx.moveTo(-size * 0.85, -size * 0.25);
  ctx.lineTo(0, size * 0.3);
  ctx.lineTo(-size * 0.5, size);
  ctx.lineTo(-size * 0.9, size * 0.4);
  ctx.closePath();
  ctx.fill();

  // 3. 우측 그림자면
  ctx.fillStyle = ERUPTION_ROCK_PALETTE.rockShadow;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.lineTo(size * 0.85, -size * 0.25);
  ctx.lineTo(size * 0.7, size * 0.7);
  ctx.lineTo(-size * 0.5, size);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 용암 바위가 날아갈 때 뒤쪽에 남는 하얀색 연기 잔상(White Steam/Smoke Trail) 렌더러
 * - 돌 본체보다 폭을 좁게 유지하여 돌 양옆 외곽으로 흰 연기가 삐져나와 돌 테두리가 하얗게 보이는 현상 방지
 */
function drawLavaWhiteTrailSmoke(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.01 || radius <= 1.5) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(x, y);

  const subPuffs = [
    { ox: 0, oy: 0, rScale: 0.92 },
    { ox: Math.cos(seed) * radius * 0.24, oy: Math.sin(seed) * radius * 0.22, rScale: 0.74 },
    { ox: Math.cos(seed + 2.1) * radius * 0.26, oy: Math.sin(seed + 2.1) * radius * 0.24, rScale: 0.68 },
  ];

  for (let i = 0; i < subPuffs.length; i++) {
    const sp = subPuffs[i];
    const pr = radius * sp.rScale;
    const grad = ctx.createRadialGradient(sp.ox, sp.oy, pr * 0.05, sp.ox, sp.oy, pr);
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0.82)");
    grad.addColorStop(0.48, "rgba(241, 245, 249, 0.52)");
    grad.addColorStop(0.80, "rgba(226, 232, 240, 0.18)");
    grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sp.ox, sp.oy, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 시전자 분출 시 솟구치는 볼류메트릭 화산 화염/연기 퍼프 렌더러
 */
function drawVolcanicFlamePuff(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  smokeRatio: number,
  seed: number
) {
  if (alpha <= 0.01 || radius <= 2) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(x, y);

  const blobs = [
    { ox: 0, oy: 0, rx: radius * 0.95, ry: radius * 1.12 },
    { ox: Math.sin(seed) * radius * 0.38, oy: -radius * 0.22, rx: radius * 0.75, ry: radius * 0.92 },
    { ox: -Math.cos(seed * 1.3) * radius * 0.36, oy: radius * 0.14, rx: radius * 0.72, ry: radius * 0.78 },
    { ox: Math.cos(seed * 0.7) * radius * 0.25, oy: -radius * 0.42, rx: radius * 0.62, ry: radius * 0.85 },
  ];

  for (let b = 0; b < blobs.length; b++) {
    const bl = blobs[b];
    ctx.save();
    ctx.translate(bl.ox, bl.oy);
    ctx.scale(1.0, bl.ry / bl.rx);
    const grad = ctx.createRadialGradient(0, 0, bl.rx * 0.05, 0, 0, bl.rx);
    if (smokeRatio < 0.45) {
      grad.addColorStop(0.0, "rgba(239, 68, 68, 0.72)");
      grad.addColorStop(0.32, "rgba(220, 38, 38, 0.52)");
      grad.addColorStop(0.62, "rgba(185, 28, 28, 0.26)");
      grad.addColorStop(0.84, "rgba(153, 27, 27, 0.08)");
      grad.addColorStop(1.0, "rgba(127, 29, 29, 0.0)");
    } else {
      // 시전자 분화 배경 연기는 어두운 화산재 적갈색 연무로 처리하여 솟구치는 돌 외곽에 흰색이 비치지 않게 함
      grad.addColorStop(0.0, "rgba(87, 54, 48, 0.62)");
      grad.addColorStop(0.45, "rgba(62, 39, 35, 0.38)");
      grad.addColorStop(0.78, "rgba(39, 24, 21, 0.14)");
      grad.addColorStop(1.0, "rgba(28, 18, 16, 0.0)");
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, bl.rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// 시전 포켓몬 위쪽(머리 상공)에서 돌들이 솟구치는 구간에 걸쳐 팍팍 뿜어져 나가며 멈추지 않고 날아가는 알갱이 (총 26개)
const ERUPTION_UPPER_GRANULES = Array.from({ length: 26 }, (_, idx) => {
  const spread = (idx - 12.5) / 12.5; // -1.0 ~ +1.0
  const jitter = Math.sin(idx * 3.1) * 0.12;
  const angle = -Math.PI * 0.5 + spread * 1.05 + jitter;
  const speed = 135 + (idx % 5) * 26 + Math.abs(Math.cos(idx * 2.3)) * 40;
  const gravity = 210 + (idx % 4) * 28;
  const size = 2.4 + (idx % 4) * 0.9;
  // 바위들이 솟구치는 시간대에 걸쳐 순차적으로 팍팍 튀어나가도록 시작 시점 분산 (0.00 ~ 0.36)
  const startP = ((idx * 7) % 26) * 0.014;
  const lifeP = 0.52;
  const kind = idx % 3;
  return { angle, speed, gravity, size, startP, lifeP, kind, rotSpeed: (idx % 2 === 0 ? 1 : -1) * (6 + (idx % 5)) };
});

export function drawEruptionBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 0;
  // 포켓몬 피격/시전 흔들림(pOffset/eOffset)에 월드 이펙트(바위·화구·대지 열기)가 같이 흔들리지 않도록 고정 월드 좌표 사용
  const staticFrame = { ...frame, pOffset: { x: 0, y: 0 }, eOffset: { x: 0, y: 0 } };
  const { cx, cy, groundY, isP } = getCasterPos(drawCtx, staticFrame);
  const { x: tx, y: ty } = getTargetSpriteCenter(drawCtx, staticFrame);
  const dir = isP ? 1 : -1;

  ctx.save();

  // 1. 전장 전체를 물들이는 묵직한 화산 분화 암적색 하늘 필터 (0.03 ~ 0.96)
  if (step >= 0.03 && step <= 0.96) {
    const skyAlpha =
      step < 0.15
        ? ((step - 0.03) / 0.12) * 0.62
        : step < 0.80
          ? 0.62
          : Math.max(0, ((0.96 - step) / 0.16) * 0.62);
    const skyGrad = ctx.createLinearGradient(0, -100, 0, 500);
    skyGrad.addColorStop(0, `rgba(24, 9, 9, ${(skyAlpha * 1.1).toFixed(3)})`);
    skyGrad.addColorStop(0.55, `rgba(69, 10, 10, ${skyAlpha.toFixed(3)})`);
    skyGrad.addColorStop(1, `rgba(124, 45, 18, ${(skyAlpha * 0.85).toFixed(3)})`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-120, -120, 840, 640);
  }

  // 2. 시전자 위쪽에서 솟구치는 볼류메트릭 화산 화염/연기 분출
  if (step >= 0.05 && step <= 0.44) {
    const p = (step - 0.05) / 0.39;
    const baseAlpha = p < 0.18 ? p / 0.18 : Math.max(0, (1 - p) / 0.82);
    // 시전 포켓몬 위쪽(머리 상단 부근) 분화구 기준점
    const ventY = cy - 34;

    // (a) 시전자 위쪽에서 부채꼴로 솟구쳐 피어오르는 화산재 연기 & 볼류메트릭 화염 덩어리
    const puffConfigs = [
      { vx: 0, vy: -190, r0: 20, r1: 42, delay: 0.00, seed: 1.1 },
      { vx: -26, vy: -165, r0: 17, r1: 36, delay: 0.05, seed: 2.4 },
      { vx: 28, vy: -170, r0: 17, r1: 36, delay: 0.08, seed: 3.7 },
      { vx: -12, vy: -220, r0: 22, r1: 46, delay: 0.13, seed: 5.0 },
      { vx: 15, vy: -215, r0: 21, r1: 44, delay: 0.18, seed: 6.3 },
      { vx: -34, vy: -145, r0: 16, r1: 34, delay: 0.22, seed: 7.6 },
      { vx: 36, vy: -150, r0: 16, r1: 34, delay: 0.26, seed: 8.9 },
      { vx: 0, vy: -240, r0: 24, r1: 50, delay: 0.30, seed: 10.2 },
    ];

    for (let i = 0; i < puffConfigs.length; i++) {
      const cfg = puffConfigs[i];
      const lp = (p - cfg.delay) / (1.0 - cfg.delay * 0.7);
      if (lp <= 0 || lp >= 1.05) continue;
      const ease = 1 - Math.pow(1 - Math.min(1, lp), 2.0);
      const sway = Math.sin(lp * Math.PI * 2.5 + cfg.seed) * 10 * lp * dir;
      const px = cx + cfg.vx * dir * ease + sway;
      const py = ventY + cfg.vy * ease;
      const pr = cfg.r0 + (cfg.r1 - cfg.r0) * ease;
      const pAlpha = baseAlpha * (lp < 0.2 ? lp / 0.2 : Math.max(0, 1 - (lp - 0.2) / 0.85));
      const smokeRatio = Math.min(1, Math.max(0, (lp - 0.25) / 0.65));

      drawVolcanicFlamePuff(ctx, px, py, pr, pAlpha, smokeRatio, cfg.seed + lp * 3);
    }

    // (b) 시전자 발밑 지면 열기 (단색 타원 제거 -> 테두리가 보이지 않는 부드러운 방사형 그라데이션)
    const groundR = 54 + p * 18;
    ctx.save();
    ctx.translate(cx, groundY);
    ctx.scale(1.0, 0.30);
    const gGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, groundR);
    gGrad.addColorStop(0.0, `rgba(239, 68, 68, ${(baseAlpha * 0.55).toFixed(3)})`);
    gGrad.addColorStop(0.45, `rgba(220, 38, 38, ${(baseAlpha * 0.28).toFixed(3)})`);
    gGrad.addColorStop(0.80, `rgba(185, 28, 28, ${(baseAlpha * 0.08).toFixed(3)})`);
    gGrad.addColorStop(1.0, "rgba(153, 27, 27, 0.0)");
    ctx.fillStyle = gGrad;
    ctx.beginPath();
    ctx.arc(0, 0, groundR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. 피격자 발밑 용암 대지 열기 후광 (0.46 ~ 0.95) - 아군/적 플랫폼 실제 접지면에 맞춰 배치
  if (step >= 0.46 && step <= 0.95) {
    const p = (step - 0.46) / 0.49;
    const alpha = Math.sin(p * Math.PI) * 0.72;
    const targetBaseY = isP ? (drawCtx.em?.y ?? 152) : (drawCtx.pm?.y ?? 280);
    const targetGroundY = targetBaseY + (isP ? 4 : 6);

    const lavaGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 82);
    lavaGrad.addColorStop(0.0, `rgba(239, 68, 68, ${(alpha * 0.75).toFixed(3)})`);
    lavaGrad.addColorStop(0.38, `rgba(220, 38, 38, ${(alpha * 0.45).toFixed(3)})`);
    lavaGrad.addColorStop(0.72, `rgba(185, 28, 28, ${(alpha * 0.16).toFixed(3)})`);
    lavaGrad.addColorStop(1.0, "rgba(153, 27, 27, 0.0)");

    ctx.save();
    ctx.translate(tx, targetGroundY);
    ctx.scale(1, 0.34);
    ctx.fillStyle = lavaGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 82, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export function drawEruptionEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 0;
  // 타격 후 퍼지는 돌 파편과 낙하 운석이 피격 포켓몬의 흔들림(eOffset)이나 시전자 진동(pOffset)에 영향받지 않도록 고정 월드 좌표 사용!
  const staticFrame = { ...frame, pOffset: { x: 0, y: 0 }, eOffset: { x: 0, y: 0 } };
  const { cx, cy, isP } = getCasterPos(drawCtx, staticFrame);
  const { x: tx, y: ty } = getTargetSpriteCenter(drawCtx, staticFrame);
  // 아군 시전(좌->우, dir=1) vs 적 시전(우->좌, dir=-1) 방향 대칭 계수
  const dir = isP ? 1 : -1;

  ctx.save();

  // ==========================================================================
  // 1. 1단계 (0.06 ~ 0.44): 시전 포켓몬 위쪽(머리 상공)에서 일어나는 화산 폭발
  //    - 시전자 위쪽 분화 코어 열기 (하드 타원 클리핑 및 흰색 코어 제거)
  //    - 매그니튜드 스타일 어두운 갈색 다면체 암석(붉은 용암 오라) + 뒤쪽 흰색 연기 잔상
  //    - 자잘한 화산 폭발 알갱이(26개)가 시전 포켓몬 위쪽에서 '팍!' 하고 순간 폭발 비산
  // ==========================================================================
  if (step >= 0.06 && step <= 0.44) {
    const p = (step - 0.06) / 0.38;
    const upperOriginY = cy - 42; // 시전 포켓몬 위쪽(머리 상공) 분출 시작점

    // (a) 시전 포켓몬 위쪽에서 퍼지는 화산 분화 열기 (클리핑 없는 부드러운 방사형 글로우, 흰색 코어 배제)
    const ventAlpha = p < 0.25 ? p / 0.25 : Math.max(0, (1 - p) / 0.75);
    if (ventAlpha > 0.02) {
      const ventR = 36 + Math.sin(p * Math.PI * 3) * 8;
      ctx.save();
      ctx.translate(cx, upperOriginY);
      ctx.scale(1.25, 0.85);
      const ventGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, ventR);
      ventGrad.addColorStop(0.0, `rgba(239, 68, 68, ${(ventAlpha * 0.72).toFixed(3)})`);
      ventGrad.addColorStop(0.38, `rgba(220, 38, 38, ${(ventAlpha * 0.45).toFixed(3)})`);
      ventGrad.addColorStop(0.72, `rgba(185, 28, 28, ${(ventAlpha * 0.16).toFixed(3)})`);
      ventGrad.addColorStop(1.0, "rgba(153, 27, 27, 0.0)");
      ctx.fillStyle = ventGrad;
      ctx.beginPath();
      ctx.arc(0, 0, ventR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // (b) 시전 포켓몬 위쪽에서 돌이 솟구치는 동안 멈추지 않고 연속 포물선으로 팍팍 퍼져 나가는 파티클
    for (let i = 0; i < ERUPTION_UPPER_GRANULES.length; i++) {
      const g = ERUPTION_UPPER_GRANULES[i];
      const lt = (p - g.startP) / g.lifeP;
      if (lt <= 0 || lt >= 1.0) continue;

      // 상태 유지(정지) 없이 끝까지 시원하게 뻗어나가는 연속 속도 + 중력 낙하
      const gx = cx + Math.cos(g.angle) * g.speed * lt * dir;
      const gy = upperOriginY + Math.sin(g.angle) * g.speed * lt + 0.5 * g.gravity * lt * lt;
      const gAlpha = lt < 0.72 ? 1.0 : Math.max(0, (1 - lt) / 0.28);
      const curSize = g.size * (1 - lt * 0.25);

      if (g.kind === 0) {
        drawVolcanicBoulder(ctx, gx, gy, curSize * 1.35, lt * g.rotSpeed * dir, gAlpha, true);
      } else if (g.kind === 1) {
        ctx.save();
        ctx.globalAlpha = gAlpha;
        ctx.translate(gx, gy);
        ctx.rotate(lt * g.rotSpeed * dir);
        ctx.fillStyle = i % 2 === 0 ? "#EF4444" : "#DC2626";
        ctx.fillRect(-curSize * 0.6, -curSize * 0.6, curSize * 1.2, curSize * 1.2);
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = gAlpha;
        ctx.translate(gx, gy);
        ctx.rotate(lt * g.rotSpeed * dir);
        ctx.fillStyle = i % 2 === 0 ? ERUPTION_ROCK_PALETTE.rockBase : ERUPTION_ROCK_PALETTE.rockHighlight;
        ctx.fillRect(-curSize * 0.55, -curSize * 0.55, curSize * 1.1, curSize * 1.1);
        ctx.restore();
      }
    }

    // (c) 시전 포켓몬 위쪽에서 상공으로 솟구치는 붉은 용암 바위 5개 + 뒤따르는 흰색 연기 잔상
    const launchRocks = [
      { vx: -46, vy: -250, r: 15, delay: 0.00 },
      { vx: -18, vy: -290, r: 19, delay: 0.06 },
      { vx: 14, vy: -300, r: 21, delay: 0.12 },
      { vx: 42, vy: -260, r: 16, delay: 0.18 },
      { vx: -4, vy: -275, r: 18, delay: 0.24 },
    ];

    for (let i = 0; i < launchRocks.length; i++) {
      const lr = launchRocks[i];
      const lp = (p - lr.delay) / (1 - lr.delay);
      if (lp <= 0 || lp >= 1) continue;
      const rx = cx + lr.vx * dir * lp;
      const ry = upperOriginY + lr.vy * lp;
      const rAlpha = lp < 0.8 ? 1.0 : (1 - lp) / 0.2;

      // 상공으로 날아가는 용암 바위 뒤쪽 흰색 연기 잔상
      // (돌 외곽으로 흰 연기가 삐져나오지 않도록 돌 뒤쪽 충분한 거리에서 돌보다 좁은 폭으로 시작)
      for (let t = 4; t >= 1; t--) {
        const tp = lp - (0.105 + t * 0.068);
        if (tp <= 0) continue;
        const trx = cx + lr.vx * dir * tp;
        const tryY = upperOriginY + lr.vy * tp;
        const smokeR = lr.r * (0.68 - t * 0.09);
        const smokeAlpha = rAlpha * (0.72 - t * 0.13);
        drawLavaWhiteTrailSmoke(ctx, trx, tryY, smokeR, smokeAlpha, i * 1.9 + t);
      }

      drawVolcanicBoulder(ctx, rx, ry, lr.r, lp * Math.PI * 3 * (i % 2 === 0 ? 1 : -1) * dir, rAlpha, true);
    }
  }

  // ==========================================================================
  // 2. 2단계 (0.42 ~ 0.96): 상공에서 피격자 진영으로 쏟아지는 붉은 용암 바위 + 흰색 연기 잔상
  //    - 아군 시전(dir=1): 좌상단 -> 우하단 낙하
  //    - 적 시전(dir=-1): 우상단 -> 좌하단 낙하 (적 진영 방향에서 날아오도록 dir 적용)
  // ==========================================================================
  const meteors = [
    { fallStart: 0.42, hitStep: 0.58, endStep: 0.78, startOx: -50 * dir, startOy: -240, hitOx: -16 * dir, hitOy: 4, r: 20 },
    { fallStart: 0.50, hitStep: 0.66, endStep: 0.86, startOx: -16 * dir, startOy: -250, hitOx: 14 * dir, hitOy: -8, r: 23 },
    { fallStart: 0.58, hitStep: 0.74, endStep: 0.92, startOx: -40 * dir, startOy: -245, hitOx: -4 * dir, hitOy: 10, r: 19 },
    { fallStart: 0.64, hitStep: 0.80, endStep: 0.96, startOx: -20 * dir, startOy: -235, hitOx: 8 * dir, hitOy: -2, r: 22 },
  ];

  for (let i = 0; i < meteors.length; i++) {
    const m = meteors[i];
    if (step < m.fallStart || step > m.endStep) continue;

    const hitX = tx + m.hitOx;
    const hitY = ty + m.hitOy;

    if (step <= m.hitStep) {
      // 대각선 낙하 구간: 흰색 연기 잔상(drawLavaWhiteTrailSmoke) + 돌 근처 빨간 용암 오라 바위
      const fp = (step - m.fallStart) / (m.hitStep - m.fallStart);
      const bx = tx + m.startOx + (m.hitOx - m.startOx) * fp;
      const by = ty + m.startOy + (m.hitOy - m.startOy) * fp;

      // 뒤쪽으로 길고 풍성하게 이어지는 흰색 연기 잔상 (5단계)
      // 돌 외곽에 흰색이 겹쳐 보이지 않도록 돌 뒤쪽(0.11 이상)에서 좁은 폭(0.72배 이하)으로 따라붙음
      for (let t = 5; t >= 1; t--) {
        const tp = fp - (0.110 + t * 0.070);
        if (tp <= 0) continue;
        const trx = tx + m.startOx + (m.hitOx - m.startOx) * tp;
        const tryY = ty + m.startOy + (m.hitOy - m.startOy) * tp;
        const smokeR = m.r * (0.72 - t * 0.09);
        const smokeAlpha = 0.78 - t * 0.12;
        drawLavaWhiteTrailSmoke(
          ctx,
          trx,
          tryY,
          smokeR,
          smokeAlpha,
          i * 2.3 + t + fp * 2
        );
      }

      drawVolcanicBoulder(ctx, bx, by, m.r, fp * Math.PI * 2.5 * dir, 1.0, true);
    } else {
      // 각 운석 착탄 지점의 소프트 용암 화구 & 화산재 분진 확산
      const ep = (step - m.hitStep) / (m.endStep - m.hitStep);

      // (a) 착탄 지점 주변의 어두운 화산재 분진 연무 (타격 후 퍼지는 돌 외곽 뒤쪽에 흰색이 비치지 않도록 암갈색 분진 사용)
      if (ep > 0.12) {
        const smokeEp = (ep - 0.12) / 0.88;
        const dustAlpha = Math.sin(Math.min(1, smokeEp * 1.1) * Math.PI) * 0.48;
        if (dustAlpha > 0.02) {
          const dustPuffs = [
            { ox: -26 * dir, oy: -12, r0: 13, r1: 26 },
            { ox:  26 * dir, oy: -10, r0: 13, r1: 26 },
            { ox:   0,       oy: -26, r0: 15, r1: 30 },
          ];
          for (let d = 0; d < dustPuffs.length; d++) {
            const dp = dustPuffs[d];
            const dr = dp.r0 + (dp.r1 - dp.r0) * smokeEp;
            const dx = hitX + dp.ox * (0.75 + smokeEp * 0.85);
            const dy = hitY + dp.oy - smokeEp * 20;
            const dGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, dr);
            dGrad.addColorStop(0.0, `rgba(78, 52, 46, ${(dustAlpha * 0.70).toFixed(3)})`);
            dGrad.addColorStop(0.48, `rgba(62, 39, 35, ${(dustAlpha * 0.42).toFixed(3)})`);
            dGrad.addColorStop(0.80, `rgba(39, 24, 21, ${(dustAlpha * 0.14).toFixed(3)})`);
            dGrad.addColorStop(1.0, "rgba(28, 18, 16, 0.0)");
            ctx.fillStyle = dGrad;
            ctx.beginPath();
            ctx.arc(dx, dy, dr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // (b) 비대칭 소프트 용암 화염 폭발 (동그란 주황 테두리감 제거 & 흰색 코어 제거)
      if (ep < 0.75) {
        const fireT = Math.min(1.0, ep / 0.42);
        const fireAlpha = ep < 0.28 ? 1.0 : Math.max(0, 1.0 - (ep - 0.28) / 0.47);
        const fireMaxR = m.r * 2.05;
        const curR = fireMaxR * Math.sin(fireT * Math.PI * 0.5);
        const cyOff = hitY - ep * 12;

        ctx.save();
        ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * fireAlpha;

        const lobeCount = 6;
        for (let l = 0; l < lobeCount; l++) {
          const ang = (l / lobeCount) * Math.PI * 2 + ep * 1.1 + i * 0.85;
          const dist = curR * (0.28 + Math.sin(l * 2.3 + i) * 0.18);
          const lobeR = Math.max(2, curR * (0.62 + Math.cos(l * 1.9 + i) * 0.18));
          const lx = hitX + Math.cos(ang) * dist;
          const ly = cyOff + Math.sin(ang) * (dist * 0.75);

          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(ang);
          ctx.scale(1.18, 0.84);
          const fGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, lobeR);
          fGrad.addColorStop(0.0, "rgba(239, 68, 68, 0.70)");
          fGrad.addColorStop(0.32, "rgba(220, 38, 38, 0.50)");
          fGrad.addColorStop(0.62, "rgba(185, 28, 28, 0.20)");
          fGrad.addColorStop(0.84, "rgba(153, 27, 27, 0.06)");
          fGrad.addColorStop(1.0, "rgba(127, 29, 29, 0.0)");
          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.arc(0, 0, lobeR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      }
    }
  }

  // ==========================================================================
  // 3. 돌 떨어지는 구간에 걸쳐서 퍼지는 파편들 (0.55 ~ 0.96)
  //    - 한 시점에 뭉쳐서 뻗은 뒤 공중에 멈춰 있는(상태 유지) 이징을 완전히 제거!
  //    - 바위가 떨어져 타격하는 구간(0.56 ~ 0.80)에 걸쳐 파편들이 순차적으로 팍팍 튀어나가며,
  //      각 파편은 사라질 때까지 멈추지 않고 일정한 수평 속도와 중력 낙하로 시원하게 날아감
  // ==========================================================================
  if (step >= 0.55 && step <= 0.96) {
    // 돌이 떨어지는 시간대(0.56 ~ 0.80)에 걸쳐 시작 시점(startStep)이 분산된 10개의 다면체 돌 파편
    const FALL_SPREAD_SHARDS = [
      { startStep: 0.56, dur: 0.18, ox: -14, oy:  2, vx: -135, vy0:  -95, g: 290, size: 9.0, rot0: 0.3, rotV: -6.5 },
      { startStep: 0.58, dur: 0.18, ox:  -6, oy: -4, vx:   98, vy0: -125, g: 310, size: 7.8, rot0: 1.4, rotV:  5.8 },
      { startStep: 0.61, dur: 0.17, ox: -10, oy:  4, vx:  -88, vy0: -140, g: 320, size: 6.8, rot0: 2.1, rotV: -5.4 },
      { startStep: 0.64, dur: 0.18, ox:  12, oy: -6, vx:  142, vy0:  -88, g: 280, size: 8.6, rot0: 0.8, rotV:  6.2 },
      { startStep: 0.66, dur: 0.18, ox:   4, oy: -8, vx:  -52, vy0: -152, g: 330, size: 7.4, rot0: 1.9, rotV: -5.9 },
      { startStep: 0.69, dur: 0.17, ox:  14, oy:  2, vx:  115, vy0:  -55, g: 260, size: 6.6, rot0: 2.7, rotV:  6.8 },
      { startStep: 0.72, dur: 0.18, ox:  -8, oy:  6, vx: -148, vy0:  -68, g: 270, size: 8.2, rot0: 0.6, rotV: -7.1 },
      { startStep: 0.74, dur: 0.17, ox:   2, oy: -2, vx:   64, vy0: -145, g: 320, size: 6.4, rot0: 1.1, rotV:  5.5 },
      { startStep: 0.77, dur: 0.17, ox: -12, oy: -4, vx: -112, vy0: -118, g: 300, size: 7.2, rot0: 2.4, rotV: -6.0 },
      { startStep: 0.80, dur: 0.16, ox:  10, oy:  4, vx:  128, vy0: -105, g: 295, size: 7.6, rot0: 1.6, rotV:  6.4 },
    ];

    for (let s = 0; s < FALL_SPREAD_SHARDS.length; s++) {
      const sh = FALL_SPREAD_SHARDS[s];
      const lt = (step - sh.startStep) / sh.dur;
      if (lt <= 0 || lt >= 1.0) continue;

      // 멈춰 서는 상태 유지 구간 없이 끝까지 등속 수평 비행 + 포물선 낙하!
      const sx = tx + (sh.ox + sh.vx * lt) * dir;
      const sy = ty + sh.oy + sh.vy0 * lt + 0.5 * sh.g * lt * lt;
      const shardSize = sh.size * (1.0 - lt * 0.25);
      const shardRot = (sh.rot0 + sh.rotV * lt) * dir;
      const shardAlpha = lt < 0.72 ? 1.0 : Math.max(0, (1.0 - lt) / 0.28);

      drawVolcanicBoulder(ctx, sx, sy, shardSize, shardRot, shardAlpha, true);
    }

    // 자잘한 돌조각/용암 알갱이 18개도 돌이 떨어지는 구간(0.56 ~ 0.81)에 걸쳐 끊임없이 사방으로 팍팍 튀어나감
    for (let g = 0; g < 18; g++) {
      const startG = 0.56 + ((g * 5) % 18) * 0.014;
      const durG = 0.15;
      const lt = (step - startG) / durG;
      if (lt <= 0 || lt >= 1.0) continue;

      const ang = (g / 18) * Math.PI * 2 - Math.PI + (g % 3 - 1) * 0.12;
      const speed = 95 + (g % 4) * 28;
      const gx = tx + Math.cos(ang) * speed * lt * dir;
      const gy = ty + Math.sin(ang) * speed * 0.82 * lt + 85 * lt * lt;
      const gSize = (2.6 + (g % 3) * 0.95) * (1.0 - lt * 0.30);
      const gAlpha = lt < 0.70 ? 1.0 : Math.max(0, (1.0 - lt) / 0.30);

      ctx.save();
      ctx.globalAlpha = gAlpha;
      ctx.translate(gx, gy);
      ctx.rotate(lt * (g % 2 === 0 ? 7 : -7) * dir);
      ctx.fillStyle =
        g % 3 === 0
          ? ERUPTION_ROCK_PALETTE.emberDeep
          : g % 3 === 1
            ? ERUPTION_ROCK_PALETTE.rockHighlight
            : ERUPTION_ROCK_PALETTE.rockBase;
      ctx.fillRect(-gSize * 0.5, -gSize * 0.5, gSize, gSize);
      ctx.restore();
    }
  }

  ctx.restore();
}
