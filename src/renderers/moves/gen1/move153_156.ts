// ============================================================================
// 🎮 ROGUEPot Move Animation Renderer: No.153 ~ No.156
// 153: 대폭발 (Explosion)
// 154: 마구할퀴기 (Fury Swipes)
// 155: 뼈다귀부메랑 (Bonemerang)
// 156: 잠자기 (Rest)
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawCartoonBone, drawTaperedWindArc } from "./move125_128.js";
import { drawTackleEffect } from "./move033_036.js";

// ============================================================================
// 💥 153: 대폭발 (Explosion)
// ============================================================================

/**
 * 153: 대폭발 (Explosion) 배경 이펙트 (초거대 폭심지 바닥 그을림 & 방사형 지면 균열/마그마 발광)
 */
export function drawExplosionBehindEffect(
  ctx: any,
  blastPos: { x: number; y: number },
  step: number,
  progress: number
) {
  if (step < 3) return; // 기폭 단계 이전에는 바닥 그을림 없음

  const t = Math.max(0, Math.min(1.0, (progress - 0.70) / 0.30));
  const cx = blastPos.x;
  const cy = blastPos.y + 16; // 지면 플랫폼 위치

  ctx.save();

  // 1. 초대형 바닥 그을림 크레이터 (Scorched Ground Crater - 대폭발 초거대 스케일)
  const maxRx = 175;
  const maxRy = 62;
  const currentRx = maxRx * Math.min(1.0, t * 2.8);
  const currentRy = maxRy * Math.min(1.0, t * 2.8);
  const scorchAlpha = (1.0 - t * 0.30) * 0.88;

  if (currentRx > 2) {
    const sGrad = ctx.createRadialGradient(cx, cy, currentRx * 0.08, cx, cy, currentRx);
    sGrad.addColorStop(0, `rgba(12, 10, 15, ${scorchAlpha})`);
    sGrad.addColorStop(0.35, `rgba(28, 22, 20, ${scorchAlpha * 0.90})`);
    sGrad.addColorStop(0.65, `rgba(50, 28, 16, ${scorchAlpha * 0.55})`);
    sGrad.addColorStop(0.88, `rgba(80, 35, 15, ${scorchAlpha * 0.25})`);
    sGrad.addColorStop(1.0, "rgba(20, 20, 20, 0)");

    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, currentRx, currentRy, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 방사형 지면 균열선 & 초고열 마그마 발광 (Crater Fissure Lines with glowing lava glow)
  if (t > 0.04) {
    const crackAlpha = Math.max(0, 1.0 - t * 1.05);
    if (crackAlpha > 0.02) {
      ctx.lineWidth = 2.8;

      const cracks = [
        [0.2, 85, 30],
        [-0.35, -80, 28],
        [0.75, 105, -20],
        [-0.85, -95, -18],
        [0.1, 28, 38],
        [-0.2, -35, 36],
        [0.5, 62, -30],
        [-0.6, -68, -28],
        [0.3, 115, 12],
        [-0.4, -110, 10],
      ];

      for (const [midAngle, ex, ey] of cracks) {
        const xEnd = cx + ex;
        const yEnd = cy + ey;
        const cGrad = ctx.createLinearGradient(cx, cy, xEnd, yEnd);
        cGrad.addColorStop(0.0, "rgba(254, 240, 138, 0.0)"); // 안쪽 투명
        cGrad.addColorStop(0.35, `rgba(249, 115, 22, ${crackAlpha * 0.45})`);
        cGrad.addColorStop(0.85, `rgba(239, 68, 68, ${crackAlpha * 0.85})`);
        cGrad.addColorStop(1.0, "rgba(185, 28, 28, 0.0)"); // 외곽선 페이드

        ctx.strokeStyle = cGrad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const mx = cx + ex * 0.5 + midAngle * 14;
        const my = cy + ey * 0.5 + midAngle * 7;
        ctx.lineTo(mx, my);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

/**
 * 💥 대폭발 (Explosion) 기폭 직전 전체 화면 흑백 이펙트프레임 (Anime Monochrome Impact Frames)
 * - type 1 (Blackout): 칠흑의 암흑 화면 + 순백의 중심 코어 + 32방향 방사형 만화풍 스피드라인 쐐기 + 백색 전기 파편
 * - type 2 (Whiteout / Inverted): 강렬한 순백 화면 + 칠흑의 싱귤래리티 코어 + 방사형 흑색 스피드라인 + 번개 균열
 */
export function drawExplosionImpactFrame(
  ctx: any,
  blastPos: { x: number; y: number },
  type: 1 | 2
) {
  const bx = blastPos.x;
  const by = blastPos.y;

  ctx.save();

  if (type === 1) {
    // -------------------------------------------------------------------------
    // [TYPE 1]: BLACKOUT IMPACT FRAME (흑백 고대비 필터 투과 + 외곽 만화 비네팅 & 백색 쐐기)
    // -------------------------------------------------------------------------
    // 화면을 완전히 덮어 가리지 않고, 배경/포켓몬이 필터를 통해 투과되도록 외곽 비네팅 부여
    const vigGrad = ctx.createRadialGradient(bx, by, 70, bx, by, 320);
    vigGrad.addColorStop(0, "rgba(0, 0, 0, 0.0)");
    vigGrad.addColorStop(0.65, "rgba(0, 0, 0, 0.35)");
    vigGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.75)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(-2000, -2000, 4000, 4000);

    // 중심 폭심지 순백 초고열 플라즈마 코어 & 부드러운 발광체
    const coreGrad = ctx.createRadialGradient(bx, by, 0, bx, by, 80);
    coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
    coreGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.90)");
    coreGrad.addColorStop(0.70, "rgba(255, 255, 255, 0.40)");
    coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.ellipse(bx, by, 80, 65, 0, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // -------------------------------------------------------------------------
    // [TYPE 2]: INVERTED WHITEOUT IMPACT FRAME (반전 음화 필터 투과 + 싱귤래리티 중심 코어)
    // -------------------------------------------------------------------------
    // 화면을 선으로 어지럽히지 않고, 부드러운 반전 광원 림 워시 부여
    const lightGrad = ctx.createRadialGradient(bx, by, 70, bx, by, 320);
    lightGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    lightGrad.addColorStop(0.65, "rgba(255, 255, 255, 0.30)");
    lightGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.60)");
    ctx.fillStyle = lightGrad;
    ctx.fillRect(-2000, -2000, 4000, 4000);

    // 중심 칠흑의 싱귤래리티 코어 홀 & 발광 글로우
    const singGrad = ctx.createRadialGradient(bx, by, 0, bx, by, 85);
    singGrad.addColorStop(0.0, "rgba(0, 0, 0, 1.0)");
    singGrad.addColorStop(0.40, "rgba(0, 0, 0, 0.90)");
    singGrad.addColorStop(0.75, "rgba(0, 0, 0, 0.35)");
    singGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
    ctx.fillStyle = singGrad;
    ctx.beginPath();
    ctx.ellipse(bx, by, 85, 68, 0, 0, Math.PI * 2);
    ctx.fill();

    // 싱귤래리티 중심 미세 백색 핵
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(bx, by, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 153: 대폭발 (Explosion) 전면 메인 이펙트
 * - Step 1: 360° ORBIT 카메라 회전 (이펙트 없음)
 * - Step 2: 튀어오르기 & 기폭 직전 흑백 이펙트프레임 (Impact Frames)
 * - Step 3: 펑! (초대형 초신성 대폭발 - 3중 3D 충격파 링 + 28방향 3D 방사선 + 14-Lobe 초거대 화구 + 거대 흑연 버섯구름)
 */
export function drawExplosionEffect(
  ctx: any,
  casterPos: { x: number; y: number },
  blastPos: { x: number; y: number },
  step: number,
  progress: number,
  isPlayer: boolean
) {
  ctx.save();

  // =========================================================================
  // STEP 1: 360° ORBIT 회전
  // =========================================================================
  if (step === 1) {
    ctx.restore();
    return;
  }

  // =========================================================================
  // STEP 2: 튀어오르기 & 기폭 직전 전체화면 흑백 이펙트프레임 (Anime Impact Frames)
  // =========================================================================
  else if (step === 2) {
    if (progress >= 0.70) {
      const impactType = progress < 0.71 ? 1 : 2;
      drawExplosionImpactFrame(ctx, blastPos, impactType);
    }
    ctx.restore();
    return;
  }

  // =========================================================================
  // STEP 3: 펑! (THE APOCALYPTIC SUPERNOVA EXPLOSION - 초대형 초신성 대폭발)
  // =========================================================================
  else if (step === 3) {
    // -----------------------------------------------------------------------
    // 0. 순백 섬광 프레임 (백색 프레임 - #34 직후 화면 전체 순백 발광)
    // -----------------------------------------------------------------------
    if (progress >= 0.730 && progress < 0.750) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-2000, -2000, 4000, 4000);
      ctx.restore();
      return;
    }

    const t = Math.max(0, Math.min(1.0, (progress - 0.70) / 0.30));
    const bx = blastPos.x;
    const by = blastPos.y;

    // -----------------------------------------------------------------------
    // A. 3중 3D 입체 각도 타원형 충격파 링 (Triple 3D Perspective Tilted Shockwave Rings)
    // -----------------------------------------------------------------------
    const waveAlpha = Math.max(0, Math.sin((1.0 - t) * Math.PI * 0.90));
    if (waveAlpha > 0.02) {
      // 1) 메인 상공 초음속 충격파 링 (-18도 입체 각도 틸트, 3D 타원비 0.54) - 380px 초광폭 확산
      const ring1R = 45 + t * 380;
      ctx.save();
      ctx.translate(bx, by - 6);
      ctx.rotate((-18 * Math.PI) / 180);
      ctx.scale(1.0, 0.54);

      // 안쪽 완전 투명 -> 바깥쪽 반투명 순백/황금 그라데이션
      const ringGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, ring1R);
      ringGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      ringGrad.addColorStop(0.65, "rgba(255, 255, 255, 0.0)");
      ringGrad.addColorStop(0.85, `rgba(254, 240, 138, ${waveAlpha * 0.50})`);
      ringGrad.addColorStop(0.96, `rgba(255, 255, 255, ${waveAlpha * 0.85})`);
      ringGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(0, 0, ring1R, 0, Math.PI * 2);
      ctx.fill();

      // 전선(Wavefront) 림 스트로크
      ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha * 0.80})`;
      ctx.lineWidth = Math.max(1.0, 3.8 - t * 2.5);
      ctx.beginPath();
      ctx.arc(0, 0, ring1R * 0.96, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // 2) 보조 지면 수평 충격파 링 (지면 배틀 플랫폼 밀착 납작 타원)
      if (t > 0.03) {
        const ring2R = ring1R - 45;
        if (ring2R > 15) {
          ctx.save();
          ctx.translate(bx, by + 12);
          ctx.rotate((6 * Math.PI) / 180);
          ctx.scale(1.0, 0.42);

          const ring2Grad = ctx.createRadialGradient(0, 0, 0, 0, 0, ring2R);
          ring2Grad.addColorStop(0.0, "rgba(249, 115, 22, 0.0)");
          ring2Grad.addColorStop(0.58, "rgba(249, 115, 22, 0.0)");
          ring2Grad.addColorStop(0.90, `rgba(249, 115, 22, ${waveAlpha * 0.65})`);
          ring2Grad.addColorStop(0.98, `rgba(254, 240, 138, ${waveAlpha * 0.60})`);
          ring2Grad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)");

          ctx.fillStyle = ring2Grad;
          ctx.beginPath();
          ctx.arc(0, 0, ring2R, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(254, 240, 138, ${waveAlpha * 0.65})`;
          ctx.lineWidth = Math.max(1.0, 3.2 - t * 2.0);
          ctx.beginPath();
          ctx.arc(0, 0, ring2R * 0.95, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }
      }

      // 3) 고속 대기 응축 링 (Tertiary high-speed shock ring)
      if (t > 0.06 && t < 0.75) {
        const ring3R = ring1R * 0.72;
        if (ring3R > 20) {
          ctx.save();
          ctx.translate(bx, by - 12);
          ctx.rotate((-24 * Math.PI) / 180);
          ctx.scale(1.0, 0.50);

          ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha * 0.45})`;
          ctx.lineWidth = Math.max(0.8, 2.2 - t * 2.2);
          ctx.beginPath();
          ctx.arc(0, 0, ring3R, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }
      }
    }

    // -----------------------------------------------------------------------
    // B. 3D 입체 각도 타원형 폭발 방사선 (3D Perspective Blast Shock Lines, 28선)
    // -----------------------------------------------------------------------
    if (t > 0.02 && t < 0.88) {
      const lineAlpha = Math.max(0, Math.sin((1.0 - (t - 0.02) / 0.86) * Math.PI));
      if (lineAlpha > 0.02) {
        ctx.save();
        const LINE_COUNT = 28;
        const tiltRad = (-18 * Math.PI) / 180;
        const cosT = Math.cos(tiltRad);
        const sinT = Math.sin(tiltRad);

        for (let i = 0; i < LINE_COUNT; i++) {
          const ang = (i / LINE_COUNT) * Math.PI * 2 + (i % 2) * 0.12;
          const innerDist = 28 + t * 65;
          const lineLen = (85 + ((i * 37) % 65)) * (1.0 + t * 2.3);
          const outerDist = innerDist + lineLen;

          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);
          const lx0 = cosA * innerDist;
          const ly0 = sinA * innerDist * 0.54;
          const lx1 = cosA * outerDist;
          const ly1 = sinA * outerDist * 0.54;

          const x0 = bx + (lx0 * cosT - ly0 * sinT);
          const y0 = by + (lx0 * sinT + ly0 * cosT);
          const x1 = bx + (lx1 * cosT - ly1 * sinT);
          const y1 = by + (lx1 * sinT + ly1 * cosT);

          const lineGrad = ctx.createLinearGradient(x0, y0, x1, y1);
          lineGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)"); // 안쪽 투명
          lineGrad.addColorStop(0.20, `rgba(255, 255, 255, ${lineAlpha * 0.60})`);
          lineGrad.addColorStop(0.55, `rgba(254, 240, 138, ${lineAlpha * 0.85})`); // 중심부 선명 발광
          lineGrad.addColorStop(0.80, `rgba(249, 115, 22, ${lineAlpha * 0.45})`);
          lineGrad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)"); // 바깥쪽 100% 완전 투명 페이드아웃!

          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = Math.max(1.0, (i % 4 === 0 ? 3.5 : 2.0) - t * 1.3);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // -----------------------------------------------------------------------
    // C. 거대 16-로브 화면 완전 장악 초거대 화구 (Screen-Filling Inferno Fireball)
    // -----------------------------------------------------------------------
    if (t < 0.82) {
      const fireT = Math.min(1.0, t / 0.45);
      const fireAlpha = t < 0.48 ? 1.0 : (1.0 - (t - 0.48) / 0.34);
      const fireMaxR = 310 * Math.sin(fireT * Math.PI * 0.5); // 310px 화면 완전 장악 초거대 화구 (지름 620px)

      ctx.save();
      ctx.globalAlpha = Math.max(0, fireAlpha);

      // 0) 전체 화구 배경 완충 앰비언트 글로우 (지름 880px 화면 100% 완전 장악)
      const ambGrad = ctx.createRadialGradient(bx, by - t * 20, 0, bx, by - t * 20, fireMaxR * 1.42);
      ambGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.90)");
      ambGrad.addColorStop(0.20, "rgba(254, 240, 138, 0.75)");
      ambGrad.addColorStop(0.50, "rgba(249, 115, 22, 0.55)");
      ambGrad.addColorStop(0.75, "rgba(239, 68, 68, 0.32)");
      ambGrad.addColorStop(0.92, "rgba(185, 28, 28, 0.12)");
      ambGrad.addColorStop(1.0, "rgba(185, 28, 28, 0.0)");
      ctx.fillStyle = ambGrad;
      ctx.beginPath();
      ctx.arc(bx, by - t * 20, fireMaxR * 1.42, 0, Math.PI * 2);
      ctx.fill();

      // 1) 16개의 역동적인 외곽 화염 로브
      const LOBE_COUNT = 16;
      for (let i = 0; i < LOBE_COUNT; i++) {
        const angle = (i / LOBE_COUNT) * Math.PI * 2 + t * 0.95;
        const dist = fireMaxR * (0.58 + Math.sin(i * 2.3 + t * 4.5) * 0.16);
        const lobeR = fireMaxR * (0.60 + Math.cos(i * 1.8) * 0.16);
        const lx = bx + Math.cos(angle) * dist;
        const ly = by + Math.sin(angle) * (dist * 0.82) - (t * 32);

        const fGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lobeR);
        fGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.98)");
        fGrad.addColorStop(0.18, "rgba(254, 240, 138, 0.92)");
        fGrad.addColorStop(0.42, "rgba(249, 115, 22, 0.65)");
        fGrad.addColorStop(0.68, "rgba(239, 68, 68, 0.35)");
        fGrad.addColorStop(0.88, "rgba(185, 28, 28, 0.12)");
        fGrad.addColorStop(1.0, "rgba(153, 27, 27, 0.0)");

        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(lx, ly, Math.max(1, lobeR), 0, Math.PI * 2);
        ctx.fill();
      }

      // 2) 중심 초고열 플라즈마 코어
      const coreR = fireMaxR * (t < 0.35 ? 0.92 : 0.55);
      const coreGrad = ctx.createRadialGradient(bx, by - t * 20, 0, bx, by - t * 20, Math.max(1, coreR));
      coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
      coreGrad.addColorStop(0.32, "rgba(254, 240, 138, 0.92)");
      coreGrad.addColorStop(0.62, "rgba(249, 115, 22, 0.50)");
      coreGrad.addColorStop(0.86, "rgba(239, 68, 68, 0.20)");
      coreGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(bx, by - t * 20, Math.max(1, coreR), 0, Math.PI * 2);
      ctx.fill();

      // 3) 폭발 속에서 연속 기폭하는 2차 연쇄 화구들 (Secondary Internal Explosions)
      const INTERNAL_BURSTS = [
        { ox: -65, oy: -45, startT: 0.12, endT: 0.52, maxR: 130, tint: "white" },
        { ox: 70, oy: 28, startT: 0.22, endT: 0.62, maxR: 145, tint: "solar" },
        { ox: -30, oy: 65, startT: 0.32, endT: 0.72, maxR: 130, tint: "orange" },
        { ox: 55, oy: -60, startT: 0.42, endT: 0.82, maxR: 135, tint: "white" },
        { ox: -10, oy: -15, startT: 0.50, endT: 0.88, maxR: 150, tint: "solar" },
      ];

      for (const ib of INTERNAL_BURSTS) {
        if (t >= ib.startT && t <= ib.endT) {
          const bProg = (t - ib.startT) / (ib.endT - ib.startT);
          const bScale = Math.sin(bProg * Math.PI);
          const curR = ib.maxR * (0.35 + bScale * 0.65);
          const px = bx + ib.ox;
          const py = by + ib.oy - t * 22;

          const bGrad = ctx.createRadialGradient(px, py, 0, px, py, curR);
          if (ib.tint === "white") {
            bGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
            bGrad.addColorStop(0.35, "rgba(254, 240, 138, 0.92)");
            bGrad.addColorStop(0.70, "rgba(249, 115, 22, 0.65)");
            bGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");
          } else if (ib.tint === "solar") {
            bGrad.addColorStop(0.0, "rgba(254, 240, 138, 1.0)");
            bGrad.addColorStop(0.40, "rgba(249, 115, 22, 0.88)");
            bGrad.addColorStop(0.75, "rgba(239, 68, 68, 0.55)");
            bGrad.addColorStop(1.0, "rgba(185, 28, 28, 0.0)");
          } else {
            bGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
            bGrad.addColorStop(0.30, "rgba(249, 115, 22, 0.90)");
            bGrad.addColorStop(0.65, "rgba(239, 68, 68, 0.60)");
            bGrad.addColorStop(1.0, "rgba(153, 27, 27, 0.0)");
          }
          ctx.fillStyle = bGrad;
          ctx.beginPath();
          ctx.arc(px, py, curR, 0, Math.PI * 2);
          ctx.fill();

          if (bProg > 0.12) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${(1.0 - bProg) * 0.75})`;
            ctx.lineWidth = Math.max(1.0, 3.2 * (1.0 - bProg));
            ctx.beginPath();
            ctx.arc(px, py, curR * 1.12, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    }

    // -----------------------------------------------------------------------
    // D. 흑연 연기 거대 버섯구름 (Giant Billowing Charcoal Mushroom Smoke)
    // -----------------------------------------------------------------------
    if (t > 0.26) {
      const smokeT = (t - 0.26) / 0.74;
      const smokeAlpha = Math.sin((1.0 - smokeT) * Math.PI * 0.68) * 0.95;

      if (smokeAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = smokeAlpha;

        const SMOKE_PUFFS = [
          { xOff: 0, yOff: -55, r: 72 },
          { xOff: -50, yOff: -38, r: 62 },
          { xOff: 52, yOff: -40, r: 64 },
          { xOff: -32, yOff: -80, r: 58 },
          { xOff: 34, yOff: -82, r: 60 },
          { xOff: 0, yOff: -110, r: 54 },
          { xOff: -68, yOff: -18, r: 46 },
          { xOff: 70, yOff: -20, r: 48 },
          { xOff: -22, yOff: -136, r: 44 },
          { xOff: 24, yOff: -138, r: 44 },
          { xOff: -80, yOff: -50, r: 42 },
          { xOff: 82, yOff: -52, r: 42 },
          { xOff: 0, yOff: -160, r: 38 },
        ];

        for (let i = 0; i < SMOKE_PUFFS.length; i++) {
          const puff = SMOKE_PUFFS[i];
          const curR = puff.r * (0.68 + smokeT * 0.75);
          const px = bx + puff.xOff * (1.0 + smokeT * 0.52);
          const py = by + (puff.yOff - smokeT * 48);

          const smGrad = ctx.createRadialGradient(px, py - curR * 0.1, 0, px, py, curR);
          smGrad.addColorStop(0.0, "rgba(115, 122, 138, 0.88)");
          smGrad.addColorStop(0.35, "rgba(75, 85, 99, 0.58)");
          smGrad.addColorStop(0.68, "rgba(55, 65, 81, 0.28)");
          smGrad.addColorStop(0.88, "rgba(31, 41, 55, 0.09)");
          smGrad.addColorStop(1.0, "rgba(17, 24, 39, 0.0)");

          ctx.fillStyle = smGrad;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(1, curR), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }
  }

  ctx.restore();
}

// ============================================================================
// 🐾 154: 마구할퀴기 (Fury Swipes)
// ============================================================================

/**
 * Single Claw Blade Track (유저가 극찬한 커스텀 예리한 곡선 블레이드 형상 + 초고속 궤적 침선)
 *
 * @param ctx 캔버스 2D 컨텍스트
 * @param halfL 블레이드 절반 길이
 * @param thickness 블레이드 최대 두께 (중심부)
 * @param curve 블레이드 만곡도 (휘어짐 정도, 0 = 직진 대칭)
 * @param alpha 투명도
 */
export function drawSingleFuryClawBlade(
  ctx: any,
  halfL: number,
  thickness: number = 5,
  curve: number = 0,
  alpha: number = 1.0
) {
  ctx.save();
  ctx.globalAlpha *= alpha;

  // 1. 은백색 금속성 베이스 (외곽 테두리 border 제거)
  ctx.fillStyle = "#E2E8F0";

  ctx.beginPath();
  ctx.moveTo(-halfL, 0);
  ctx.quadraticCurveTo(0, -thickness + curve, halfL, 0);
  ctx.quadraticCurveTo(0, thickness + curve, -halfL, 0);
  ctx.closePath();
  ctx.fill();

  // 2. 내부 눈부신 순백 하이라이트 코어 (Pure White Gleaming Core)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(-halfL * 0.85, 0);
  ctx.quadraticCurveTo(0, -thickness * 0.52 + curve * 0.7, halfL * 0.85, 0);
  ctx.quadraticCurveTo(0, thickness * 0.52 + curve * 0.7, -halfL * 0.85, 0);
  ctx.closePath();
  ctx.fill();

  // 3. 첨단(끝부분) 초고속 궤적 침선 (Speed Needle Trail)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(halfL * 0.65, curve * 0.5);
  ctx.lineTo(halfL + 9, curve);
  ctx.stroke();

  ctx.restore();
}

/**
 * 3줄 또는 4줄의 정렬된 발톱 할퀴기 클러스터 렌더러
 *
 * @param ctx 캔버스 2D 컨텍스트
 * @param cx 타겟 중심 X
 * @param cy 타겟 중심 Y
 * @param angle 할퀴는 각도 (라디안)
 * @param scale 전체 스케일 (기본 1.0)
 * @param spread 발톱 간격 배율 (기본 1.0)
 * @param alpha 투명도 (0.0 ~ 1.0)
 * @param clawCount 발톱 개수 (기본 3, 피니시 시 4)
 * @param curveOffset 블레이드 만곡 방향/강도
 * @param slideOffset 해당 방향 아래로 슬라이드 이동량 { x, y } (로컬 좌표계)
 */
export function drawClawSwipeCluster(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  scale: number = 1.0,
  spread: number = 1.0,
  alpha: number = 1.0,
  clawCount: 3 | 4 = 3,
  curveOffset: number = 2.0,
  slideOffset: { x: number; y: number } = { x: 0, y: 0 }
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.translate(slideOffset.x, slideOffset.y);
  ctx.globalAlpha *= alpha;

  if (clawCount === 3) {
    // 3발톱: 중앙 발톱이 가장 길고 좌우 날렵하게 배치
    const spacing = 15 * spread;
    const tracks = [
      { localY: -spacing, staggerX: -7 * scale, length: 50 * scale, thick: 4.8 * spread, curve: curveOffset },
      { localY: 0,        staggerX: 0,          length: 64 * scale, thick: 5.6 * spread, curve: curveOffset * 0.8 },
      { localY: spacing,  staggerX: 7 * scale,  length: 50 * scale, thick: 4.8 * spread, curve: curveOffset },
    ];

    for (const t of tracks) {
      ctx.save();
      ctx.translate(t.staggerX, t.localY);
      drawSingleFuryClawBlade(ctx, t.length / 2, t.thick, t.curve, 1.0);
      ctx.restore();
    }
  } else {
    // 4발톱: 피니시 대격돌용 4단 와이드 발톱 클러스터
    const spacing = 12 * spread;
    const tracks = [
      { localY: -1.5 * spacing, staggerX: -9 * scale, length: 54 * scale, thick: 4.5 * spread, curve: curveOffset },
      { localY: -0.5 * spacing, staggerX: -2 * scale, length: 72 * scale, thick: 5.8 * spread, curve: curveOffset * 0.8 },
      { localY: 0.5 * spacing,  staggerX: 2 * scale,  length: 72 * scale, thick: 5.8 * spread, curve: curveOffset * 0.8 },
      { localY: 1.5 * spacing,  staggerX: 9 * scale,  length: 54 * scale, thick: 4.5 * spread, curve: curveOffset },
    ];

    for (const t of tracks) {
      ctx.save();
      ctx.translate(t.staggerX, t.localY);
      drawSingleFuryClawBlade(ctx, t.length / 2, t.thick, t.curve, 1.0);
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * 154: 마구할퀴기 (Fury Swipes) 메인 이펙트 렌더러
 *
 * 연출 흐름 (유저 요구사항 100% 반영):
 * 1. 유저 선호 커스텀 예리한 곡선 발톱 블레이드 + 초고속 궤적 침선 적용
 * 2. 반짝거리는 노란 별 및 흰색 구형 타격 이펙트 완전 배제 (순수 참격 집중)
 * 3. 한쪽 방향 할퀴기 출현 ➔ 참격이 그대로 해당 방향 아래로 살짝 슬라이드하며 페이드아웃 ➔ 완전히 소멸
 * 4. 완전히 사라진 후 반대 방향 할퀴기 출현 ➔ 해당 방향 아래로 슬라이드하며 페이드아웃 ➔ 완전히 소멸
 * 5. 리드미컬하게 번갈아가며 연속 타격 진행
 */
export function drawFurySwipesEffect(
  ctx: any,
  targetOrFrame: any,
  stepOrDrawCtx?: any,
  maybeDrawCtx?: any
) {
  let targetX = 0;
  let targetY = 0;
  let step = 1;

  if (targetOrFrame && typeof targetOrFrame.x === "number") {
    targetX = targetOrFrame.x;
    targetY = targetOrFrame.y;
    step = typeof stepOrDrawCtx === "number" ? stepOrDrawCtx : (stepOrDrawCtx?.moveStep ?? 1);
  } else {
    const frame = targetOrFrame as BattleFrame;
    const drawCtx = stepOrDrawCtx as EffectDrawContext;
    if (!drawCtx?.targetPos) return;
    targetX = drawCtx.targetPos.x;
    targetY = drawCtx.targetPos.y;
    step = frame.moveStep ?? 1;
  }

  // 타겟 포켓몬 몸체 중심
  const cx = targetX;
  const cy = targetY - 26;

  // 각도 정의 (둘 다 아래 방향으로 시원하게 베어내림)
  // 우사선 (우상 -> 좌하 베기): 126.4° (cos < 0, sin > 0 -> 좌하 방향)
  const angleRight = (3 * Math.PI) / 4 - 0.15;
  const curveRight = -2.0;

  // 좌사선 반대방향 (좌상 -> 우하 베기): 53.6° (cos > 0, sin > 0 -> 우하 방향)
  const angleLeft = Math.PI / 4 + 0.15;
  const curveLeft = 2.0;

  ctx.save();

  switch (step) {
    // -------------------------------------------------------------
    // [1타]: 우측 사선 할퀴기 (Right -> Left Downward)
    // -------------------------------------------------------------
    case 2:
      // 1타 출현: 정위치 선명한 할퀴기
      drawClawSwipeCluster(ctx, cx, cy, angleRight, 1.0, 1.0, 1.0, 3, curveRight, { x: 0, y: 0 });
      break;

    case 3:
      // 1타 슬라이드 & 페이드: 해당 방향 아래로 살짝 슬라이드하며 페이드아웃
      drawClawSwipeCluster(ctx, cx, cy, angleRight, 1.0, 1.22, 0.40, 3, curveRight, { x: 14, y: 0 });
      break;

    case 4:
      // 완전히 사라진 상태 (화면 클린)
      break;

    // -------------------------------------------------------------
    // [2타]: 반대방향 좌측 사선 할퀴기 (Left -> Right Downward)
    // -------------------------------------------------------------
    case 5:
      // 2타 출현: 반대 방향 정위치 선명한 할퀴기
      drawClawSwipeCluster(ctx, cx, cy, angleLeft, 1.0, 1.0, 1.0, 3, curveLeft, { x: 0, y: 0 });
      break;

    case 6:
      // 2타 슬라이드 & 페이드: 반대 방향 아래로 살짝 슬라이드하며 페이드아웃
      drawClawSwipeCluster(ctx, cx, cy, angleLeft, 1.0, 1.22, 0.40, 3, curveLeft, { x: 14, y: 0 });
      break;

    case 7:
      // 완전히 사라진 상태 (화면 클린)
      break;

    // -------------------------------------------------------------
    // [3타]: 우측 사선 할퀴기 (Right -> Left Downward)
    // -------------------------------------------------------------
    case 8:
      // 3타 출현: 정위치 선명한 할퀴기
      drawClawSwipeCluster(ctx, cx, cy, angleRight, 1.0, 1.0, 1.0, 3, curveRight, { x: 0, y: 0 });
      break;

    case 9:
      // 3타 슬라이드 & 페이드: 해당 방향 아래로 살짝 슬라이드하며 페이드아웃
      drawClawSwipeCluster(ctx, cx, cy, angleRight, 1.0, 1.22, 0.40, 3, curveRight, { x: 14, y: 0 });
      break;

    case 10:
      // 완전히 사라진 상태 (화면 클린)
      break;

    // -------------------------------------------------------------
    // [4타]: 반대방향 좌측 사선 할퀴기 피니시 (Left -> Right Downward)
    // -------------------------------------------------------------
    case 11:
      // 4타 피니시 출현: 살짝 더 묵직하고 와이드한 4단 발톱 클러스터
      drawClawSwipeCluster(ctx, cx, cy, angleLeft, 1.15, 1.0, 1.0, 4, curveLeft, { x: 0, y: 0 });
      break;

    case 12:
      // 4타 슬라이드 & 페이드: 반대 방향 아래로 살짝 슬라이드하며 페이드아웃
      drawClawSwipeCluster(ctx, cx, cy, angleLeft, 1.15, 1.25, 0.40, 4, curveLeft, { x: 15, y: 0 });
      break;

    case 13:
    case 14:
    default:
      // 완전히 소멸 및 복귀 완료
      break;
  }

  ctx.restore();
}

// ============================================================================
// 🦴 155: 뼈다귀부메랑 (Bonemerang)
// ============================================================================

/**
 * 155: 뼈다귀부메랑 (Bonemerang) 후방 레이어 렌더러
 * - Step 4: 1차 관통 후 상대 포켓몬 스프라이트 뒤편으로 진입하여 배후를 3D 타원으로 선회하는 구간
 * - 상대 포켓몬의 등 뒤에서 회전하므로 포켓몬 몸체에 자연스럽게 가려지며, 등 뒤 오픈 공간으로 넓게 선회
 */
export function drawBonemerangBehindEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let step = 1;
  let p = 0.5;
  let ax = 200;
  let ay = 300;
  let tx = 550;
  let ty = 180;
  let isP = true;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    tx = targetPosOrDrawCtx?.x ?? 550;
    ty = targetPosOrDrawCtx?.y ?? 180;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    const frame = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.attackerPos || { x: 200, y: 300 };
    const tPos = drawCtx.targetPos || { x: 550, y: 180 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frame.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
  }

  // Step 4: 상대 포켓몬 관통 후 배후 선회 루프 구간
  if (step === 4) {
    ctx.save();
    const targetHitX = tx + (isP ? -6 : 6);
    const targetHitY = ty - (isP ? 10 : 8);
    const dir = isP ? 1 : -1;

    // 배후 3D 타원 선회 궤적 (상대 몸체 뒤편 오픈 공간으로 92px 선회)
    const loopX = targetHitX + Math.sin(p * Math.PI) * 92 * dir;
    const loopY = targetHitY - Math.sin(p * Math.PI * 2) * 22 - Math.sin(p * Math.PI) * 12;

    // 바닥 추적 그림자
    const shadowY = ty + 24 - Math.sin(p * Math.PI) * 4;
    ctx.save();
    ctx.fillStyle = "rgba(20, 24, 39, 0.32)";
    ctx.beginPath();
    ctx.ellipse(loopX, shadowY, 13, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 초고속 회전 각도 (회전 방향 유지)
    const spinDir = isP ? 1 : -1;
    const spinAngle = Math.PI * 6.0 + p * Math.PI * 8.0 * spinDir;

    // 뼈다귀 본체 & 회전 후류 바람 아크
    drawCartoonBone(ctx, loopX, loopY, spinAngle, 1.15, 1.0, true);
    const windRadius = 19;
    drawTaperedWindArc(ctx, loopX, loopY, windRadius, spinAngle, Math.PI * 0.45, spinDir, 0.65);
    drawTaperedWindArc(ctx, loopX, loopY, windRadius, spinAngle + Math.PI, Math.PI * 0.45, spinDir, 0.65);

    ctx.restore();
  }
}

/**
 * 155: 뼈다귀부메랑 (Bonemerang) 전면 레이어 렌더러
 *
 * 연출 구성 (유저 요청 100% 반영):
 * 1. [투척 준비 와인드업] 시전자 손에서 뼈다귀 투척 조준
 * 2. [전방 1차 투척 비행] 뼈다귀가 초고속 회전하며 상대를 향해 직진 비행 & 바닥 그림자 추적
 * 3. [1차 관통 타격] 상대 포켓몬 스프라이트를 관통하며 몸통박치기 타격 이펙트 (drawTackleEffect) 직격
 * 4. [배후 선회 잔향] 상대 뒤편으로 뼈가 넘어간 사이 전면에 1차 타격 잔향 페이드아웃 (뼈 본체는 drawBonemerangBehindEffect에서 렌더링)
 * 5. [2차 관통 복귀 타격] 배후에서 돌아온 뼈가 상대를 다시 관통하며 몸통박치기 타격 이펙트 (drawTackleEffect) 한 번 더 직격 & 체력 감소
 * 6. [시전자 복귀 & 페이드아웃] 뼈가 시전 포켓몬에게 돌아오면서 점차 투명해져 부드럽게 페이드아웃 소멸
 */
export function drawBonemerangEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let step = 1;
  let p = 0.5;
  let ax = 200;
  let ay = 300;
  let tx = 550;
  let ty = 180;
  let isP = true;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    tx = targetPosOrDrawCtx?.x ?? 550;
    ty = targetPosOrDrawCtx?.y ?? 180;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    const frame = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.attackerPos || { x: 200, y: 300 };
    const tPos = drawCtx.targetPos || { x: 550, y: 180 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frame.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
  }

  ctx.save();

  // 투척 시작점 (시전자 앞/손 부근)
  const launchX = ax + (isP ? 34 : -34);
  const launchY = ay - (isP ? 16 : 14);

  // 대상 관통 타격점 (피격 포켓몬 상체 중심)
  const targetHitX = tx + (isP ? -6 : 6);
  const targetHitY = ty - (isP ? 10 : 8);

  const spinDir = isP ? 1 : -1;

  // ==========================================================================
  // Step 1: 시전자 투척 와인드업 (시전자 손에서 투척 준비)
  // ==========================================================================
  if (step === 1) {
    const prepRotation = isP ? -0.45 : 0.45;
    drawCartoonBone(ctx, launchX, launchY, prepRotation, 1.15, 1.0, false);
  }

  // ==========================================================================
  // Step 2: 전방 1차 투척 비행 (상대를 향해 직진 회전 비행)
  // ==========================================================================
  else if (step === 2) {
    const arcY = Math.sin(p * Math.PI) * 28;
    const curX = launchX + (targetHitX - launchX) * p;
    const curY = launchY + (targetHitY - launchY) * p - arcY;

    // 바닥 타원형 그림자 추적
    const groundStartY = ay + 24;
    const groundTargetY = ty + 24;
    const shadowY = groundStartY + (groundTargetY - groundStartY) * p;
    const heightFactor = Math.sin(p * Math.PI);
    const shadowAlpha = Math.max(0.12, 0.40 * (1.0 - heightFactor * 0.35));

    ctx.save();
    ctx.fillStyle = `rgba(20, 24, 39, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(curX, shadowY, 14 * (1.0 - heightFactor * 0.25), 6 * (1.0 - heightFactor * 0.25), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 회전 각도
    const spinAngle = p * Math.PI * 6.0 * spinDir;

    // 회전 뼈다귀 및 바람 아크
    drawCartoonBone(ctx, curX, curY, spinAngle, 1.15, 1.0, true);
    const windRadius = 19;
    drawTaperedWindArc(ctx, curX, curY, windRadius, spinAngle, Math.PI * 0.45, spinDir, 0.65);
    drawTaperedWindArc(ctx, curX, curY, windRadius, spinAngle + Math.PI, Math.PI * 0.45, spinDir, 0.65);
  }

  // ==========================================================================
  // Step 3: 1차 관통 타격 순간 (상대 포켓몬 스프라이트 관통 직격 & 몸통박치기 타격 이펙트 발동)
  // ==========================================================================
  else if (step === 3) {
    // 1. 몸통박치기 정통 타격 이펙트 (스타버스트 섬광, 충격파 링, 스파크 별빛, 속도선)
    drawTackleEffect(ctx, { x: targetHitX, y: targetHitY }, { x: launchX, y: launchY }, 3, p * 0.5, isP);

    // 2. 관통 순간 직격 중인 고속 회전 뼈다귀
    const impactRot = (isP ? 0.75 : -0.75) + p * 1.5 * spinDir;
    drawCartoonBone(ctx, targetHitX, targetHitY, impactRot, 1.20, 1.0, true);
  }

  // ==========================================================================
  // Step 4: 상대 포켓몬 관통 후 배후 선회 구간 (전면에는 1차 타격 잔향 유지)
  // ==========================================================================
  else if (step === 4) {
    // 1차 타격 잔향 소산 (뼈 자체는 등 뒤에 있으므로 drawBonemerangBehindEffect에서 렌더링)
    if (p < 0.40) {
      drawTackleEffect(ctx, { x: targetHitX, y: targetHitY }, { x: launchX, y: launchY }, 4, 0.40 + p * 1.5, isP);
    }
  }

  // ==========================================================================
  // Step 5: 2차 관통 복귀 타격 (배후에서 돌아오면서 상대를 다시 관통! 몸통박치기 이펙트 한 번 더 직격!)
  // ==========================================================================
  else if (step === 5) {
    // 1. 몸통박치기 정통 타격 이펙트 2회차 발동!
    drawTackleEffect(ctx, { x: targetHitX, y: targetHitY }, { x: launchX, y: launchY }, 3, 0.15 + p * 0.5, isP);

    // 2. 배후에서 전면으로 치고 나오는 반대 틸트 회전 뼈다귀
    const impactRot2 = (isP ? -0.85 : 0.85) + p * 2.0 * spinDir;
    drawCartoonBone(ctx, targetHitX, targetHitY, impactRot2, 1.25, 1.0, true);
  }

  // ==========================================================================
  // Step 6: 시전 포켓몬에게 뼈가 돌아오면서 페이드아웃 소멸
  // ==========================================================================
  else if (step === 6) {
    // 2차 타격 잔향 소산
    if (p < 0.45) {
      drawTackleEffect(ctx, { x: targetHitX, y: targetHitY }, { x: launchX, y: launchY }, 4, 0.40 + p * 1.2, isP);
    }

    // 복귀 궤적 (상대 타격점 -> 시전자 손)
    const returnArc = Math.sin(p * Math.PI) * 22;
    const curX = targetHitX + (launchX - targetHitX) * p;
    const curY = targetHitY + (launchY - targetHitY) * p - returnArc;

    // 시전포켓몬에게 뼈가 돌아오면서 페이드아웃 (유저 요구사항 100% 반영)
    const fadeAlpha = Math.max(0, 1.0 - Math.pow(p, 1.1) * 1.05);

    if (fadeAlpha > 0.02) {
      // 바닥 복귀 그림자 페이드아웃
      const groundStartY = ty + 24;
      const groundTargetY = ay + 24;
      const shadowY = groundStartY + (groundTargetY - groundStartY) * p;
      const shadowAlpha = Math.max(0, 0.35 * fadeAlpha);

      if (shadowAlpha > 0.01) {
        ctx.save();
        ctx.fillStyle = `rgba(20, 24, 39, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(curX, shadowY, 14 * fadeAlpha, 6 * fadeAlpha, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 회전 각도 (복귀 고속 스핀)
      const returnSpinAngle = Math.PI * 14.0 + p * Math.PI * 6.0 * (-spinDir);

      // 페이드아웃 중인 뼈다귀 및 회전 바람 아크
      drawCartoonBone(ctx, curX, curY, returnSpinAngle, 1.15, fadeAlpha, true);
      const windRadius = 19;
      drawTaperedWindArc(ctx, curX, curY, windRadius, returnSpinAngle, Math.PI * 0.45, -spinDir, 0.65 * fadeAlpha);
      drawTaperedWindArc(ctx, curX, curY, windRadius, returnSpinAngle + Math.PI, Math.PI * 0.45, -spinDir, 0.65 * fadeAlpha);
    }
  }

  ctx.restore();
}

// ============================================================================
// 💤 156: 잠자기 (Rest)
// ============================================================================

/**
 * 몽환적인 파스텔 수면 비눗방울 & Zzz 글자 렌더러
 */
export function drawDreamBubbleWithZ(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  letter: string,
  alpha: number = 1.0,
  themeColor: string = "#C4B5FD",
  popProgress: number = 0
) {
  if (alpha <= 0.01 || radius <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  // 1. 방울이 터지는 연출 (popProgress > 0)
  if (popProgress > 0) {
    const popScale = 1.0 + popProgress * 0.45;
    const popAlpha = Math.max(0, 1.0 - popProgress);
    ctx.globalAlpha = popAlpha * alpha;

    // 파열 파편 링
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = Math.max(1.0, 2.0 * (1.0 - popProgress));
    ctx.beginPath();
    ctx.arc(x, y, radius * popScale, 0, Math.PI * 2);
    ctx.stroke();

    // 6방향 미니 스파클 파편
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.3;
      const dist = radius * (1.1 + popProgress * 0.7);
      const px = x + Math.cos(ang) * dist;
      const py = y + Math.sin(ang) * dist;
      ctx.fillStyle = i % 2 === 0 ? "#FFFFFF" : themeColor;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.8, 2.2 * (1.0 - popProgress)), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return;
  }

  // 2. 비눗방울 외곽 림 & 부드러운 그라데이션 본체
  const bubbleGrad = ctx.createRadialGradient(
    x - radius * 0.28,
    y - radius * 0.28,
    radius * 0.1,
    x,
    y,
    radius
  );
  bubbleGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.55)");
  bubbleGrad.addColorStop(0.40, "rgba(255, 255, 255, 0.12)");
  bubbleGrad.addColorStop(0.75, `${themeColor}33`);
  bubbleGrad.addColorStop(0.96, `${themeColor}CC`);
  bubbleGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.90)");

  ctx.fillStyle = bubbleGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // 외곽선 림
  ctx.strokeStyle = `rgba(255, 255, 255, 0.85)`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 3. 상단 좌측 반사광 하이라이트 글레어
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.beginPath();
  ctx.ellipse(
    x - radius * 0.38,
    y - radius * 0.38,
    radius * 0.32,
    radius * 0.18,
    -Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // 하단 우측 보조 반사광
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.beginPath();
  ctx.ellipse(
    x + radius * 0.35,
    y + radius * 0.35,
    radius * 0.22,
    radius * 0.10,
    -Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // 4. 내부 Zzz 글자 렌더링
  const fontSize = Math.round(radius * 1.05);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 가독성 확보용 어두운 외곽선 (포켓몬 풍 테두리)
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = "rgba(15, 23, 42, 0.82)";
  ctx.strokeText(letter, x, y + 1);

  // 글자 본체
  ctx.fillStyle = themeColor;
  ctx.fillText(letter, x, y + 1);

  // 글자 중심 밝은 하이라이트 코어
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${Math.round(fontSize * 0.85)}px sans-serif`;
  ctx.fillText(letter, x - 0.5, y + 0.5);

  ctx.restore();
}

/**
 * 영롱한 4방향 치유 십자성 (+) 렌더러
 */
export function drawHealingCrossSparkle(
  ctx: any,
  x: number,
  y: number,
  size: number,
  color: string = "#5EEAD4",
  alpha: number = 1.0,
  rot: number = 0
) {
  if (alpha <= 0.01 || size <= 0) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  const armLen = size;
  const armThick = size * 0.24;

  // 십자성 본체 (+)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-armLen, -armThick);
  ctx.lineTo(-armThick, -armThick);
  ctx.lineTo(-armThick, -armLen);
  ctx.lineTo(armThick, -armLen);
  ctx.lineTo(armThick, -armThick);
  ctx.lineTo(armLen, -armThick);
  ctx.lineTo(armLen, armThick);
  ctx.lineTo(armThick, armThick);
  ctx.lineTo(armThick, armLen);
  ctx.lineTo(-armThick, armLen);
  ctx.lineTo(-armThick, armThick);
  ctx.lineTo(-armLen, armThick);
  ctx.closePath();
  ctx.fill();

  // 외곽선
  ctx.strokeStyle = "rgba(255, 255, 255, 0.90)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 중심부 순백 발광 코어
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(0, 0, armThick * 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 156: 잠자기 (Rest) 배경 이펙트 (유저 요청: 추가 이펙트 일체 없음)
 */
export function drawRestBehindEffect(
  _ctx: any,
  _attackerPosOrFrame?: any,
  _targetPosOrDrawCtx?: any,
  _moveStep?: number,
  _progress?: number,
  _isPlayer?: boolean
) {
  // 거품 및 추가 배경 이펙트 일체 없음
}

/**
 * 156: 잠자기 (Rest) 전면 이펙트
 * - 유저 요청: 거품이나 추가 이펙트 없이 순수하게 'z' 글자가 순서대로 올라오도록 단순화
 */
export function drawRestEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let step = 1;
  let p = 0.5;
  let ax = 200;
  let ay = 300;
  let isP = true;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    const frame = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.attackerPos || { x: 200, y: 300 };
    ax = aPos.x;
    ay = aPos.y;
    step = frame.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
  }

  // 머리 위 z 출현 원점
  const headX = ax + (isP ? 14 : -14);
  const headY = ay - (isP ? 34 : 28);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 1단계부터 4단계까지의 전체 진행도 (0.0 ~ 1.0)
  // Step 1: 0.0 ~ 0.25, Step 2: 0.25 ~ 0.60, Step 3: 0.60 ~ 0.85, Step 4: 0.85 ~ 1.0
  let totalProg = 0;
  if (step === 1) totalProg = p * 0.25;
  else if (step === 2) totalProg = 0.25 + p * 0.35;
  else if (step === 3) totalProg = 0.60 + p * 0.25;
  else totalProg = 0.85 + p * 0.15;

  // 순서대로 올라오는 3개의 z 글자 (소 -> 중 -> 대)
  const Z_ITEMS = [
    { startP: 0.10, endP: 0.65, dx: -8, riseDist: 42, size: 13, text: "z", color: "#93C5FD" }, // 1번: 연하늘 z
    { startP: 0.30, endP: 0.82, dx: 4,  riseDist: 52, size: 16, text: "z", color: "#C4B5FD" }, // 2번: 연보라 z
    { startP: 0.50, endP: 0.98, dx: 18, riseDist: 62, size: 21, text: "Z", color: "#FBCFE8" }, // 3번: 연분홍 큰 Z
  ];

  for (const item of Z_ITEMS) {
    if (totalProg < item.startP || totalProg > item.endP) continue;

    const localT = (totalProg - item.startP) / (item.endP - item.startP);
    const easeY = Math.pow(localT, 0.85);
    const sway = Math.sin(localT * Math.PI * 2.5) * 5;

    const curX = headX + item.dx + sway;
    const curY = headY - easeY * item.riseDist;

    // 페이드인/페이드아웃
    const alpha = Math.sin(localT * Math.PI);

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));
    ctx.font = `bold ${item.size}px sans-serif`;

    // 또렷한 검은색 외곽 테두리 (포켓몬 본가 스타일)
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeText(item.text, curX, curY);

    // 파스텔 폰트 본체
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, curX, curY);

    ctx.restore();
  }

  ctx.restore();
}

