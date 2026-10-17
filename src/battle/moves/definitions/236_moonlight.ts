// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawMoonlightBehindEffect,
  drawMoonlightEffect,
} from "../../../renderers/moves/gen1/move233_236.js";
import { createSmoothCameraReturnFrames } from "../../../utils/battleCamera.js";

/**
 * 236: 달빛 (Moonlight / つきのひかり) - 페어리 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 5 / 대상: 자신 / 접촉: X
 * 설명: 달의 빛을 받아 자신의 HP를 회복한다. 날씨에 따라 회복량이 변한다.
 *
 * [유저 요구사항 100% 반영]:
 * 1. 카메라가 대상 포켓몬보다 살짝 위를 포커싱.
 * 2. 하늘색 빛줄기: 윗쪽은 50% 반투명, 아래로 내려올수록 투명해지는 빛줄기가 아래로 내려옴.
 * 3. 빛줄기는 아래로 내려올수록 각도가 퍼짐 (사다리꼴 콘 빔).
 * 4. 각도가 퍼지는 바닥 너비는 대상 포켓몬 바닥 플랫폼을 넘어서지 않고, 그보다 많이 작게,
 *    웬만한 포켓몬들 스프라이트보다는 크게 (~114px).
 * 5. 빛줄기가 내려오는 것을 카메라가 포커싱하면서 대상 포켓몬을 포커싱하게.
 * 6. 이때 바닥에 빛에 의해서 타원형의 빛무리(Floor Elliptical Illumination) 생성.
 * 7. 암전 시 땅 위 빛줄기 영역과 바닥 타원 영역만 암전 영향을 덜 받고, 땅 아래 및 외곽은 짙은 암전 유지.
 * 8. 빛줄기가 얇아지면서 사라지고, 그 뒤에 암전 상태에서 HP 회복 애니메이션(나선 회복별) 재생.
 */
export const moonlightMove: BattleMoveAnimation = {
  num: 236,
  key: "moonlight",
  nameKo: "달빛",
  nameEn: "Moonlight",
  type: "fairy",
  category: "status",
  camera: {
    type: "custom", // 프레임별 맞춤형 카메라(살짝 위 포커싱 -> 하강 추적 포커싱 -> 복귀) 직접 관리
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawMoonlightBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMoonlightEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    // -------------------------------------------------------------------------
    // 📷 카메라 포컬 좌표 계산
    // -------------------------------------------------------------------------
    const neutralCenter = { x: 280, y: 190 };
    // 대상 포켓몬 중심 포컬 (플레이어: 150, 280 / 적: 346, 154)
    const targetFocal = isP
      ? { x: 150, y: 280 }
      : {
          x: Math.round(neutralCenter.x + (418 - neutralCenter.x) * 0.48), // 346
          y: Math.round(neutralCenter.y + (152 - neutralCenter.y) * 0.48), // 154
        };

    // "대상 포켓몬보다 살짝 위" 포컬 (길어진 빛줄기가 시작되는 상공을 조망)
    const highFocalOffset = isP ? 86 : 72;
    const highFocal = {
      x: targetFocal.x,
      y: targetFocal.y - highFocalOffset,
    };

    const targetZoom = 1.30;
    const frames: BattleFrame[] = [];

    // =========================================================================
    // [Step 1: 기(起) - 카메라 살짝 위 포커싱 진입 & 상공 하늘색 빛줄기 맺힘] (3프레임, 45ms)
    // =========================================================================
    for (let i = 0; i < 3; i++) {
      const u = (i + 1) / 3;
      // 부드러운 이징 줌인 & 살짝 위 포컬로 이동
      const eased = u * u;
      const zoom = Number((1.0 + (targetZoom - 1.0) * eased).toFixed(4));
      const focal = {
        x: Math.round(neutralCenter.x + (highFocal.x - neutralCenter.x) * eased),
        y: Math.round(neutralCenter.y + (highFocal.y - neutralCenter.y) * eased),
      };

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        moveStep: 1,
        phaseId: `moonlight-focus-high-${i + 1}`,
        phaseName: "#1. 카메라 상단 포커싱 진입",
        effectProgress: 0.05 + 0.10 * u, // 빛줄기 시동
        showEffect: true,
        showBehindEffect: true,
        cameraZoom: zoom,
        cameraFocal: focal,
        _gen5Camera: true,
      });
    }

    // =========================================================================
    // [Step 1-2: 빛줄기 하강 & 카메라가 빛줄기를 포커싱하며 대상 포켓몬으로 하강] (6프레임, 45ms)
    // [유저 요청 핵심]: "빛줄기가 내려오는 거를 카메라가 포커싱하면서 대상 포켓몬을 포커싱하게"
    // =========================================================================
    for (let i = 0; i < 6; i++) {
      const u = i / 5; // 0.0 ~ 1.0
      // 큐빅 이즈인아웃으로 빛줄기와 함께 카메라가 우아하게 아래로 내려옴
      const eased = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

      // 카메라 포컬 Y: highFocal.y -> targetFocal.y
      const curFocalY = Math.round(highFocal.y + (targetFocal.y - highFocal.y) * eased);
      const focal = {
        x: targetFocal.x,
        y: curFocalY,
      };

      // 빛줄기 진행도: 0.15 -> 1.00 (바닥에 닿는 순간 바닥 타원형 빛 피어남)
      const prog = 0.15 + 0.85 * eased;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        moveStep: 1,
        phaseId: `moonlight-descend-${i + 1}`,
        phaseName: i === 5
          ? "#1. 빛줄기 바닥 안착 & 대상 포켓몬 포커싱 완료"
          : `#1. 빛줄기 하강 및 카메라 추적 (${i + 1}/6)`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
        cameraZoom: targetZoom,
        cameraFocal: focal,
        _gen5Camera: true,
      });
    }

    // =========================================================================
    // [Step 2: 승(承) - 대상 포켓몬 정면 포커싱 & 하늘색 빛줄기 조명 & 바닥 타원형 빛 충만] (6프레임, 45ms)
    // =========================================================================
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      // 대상 포켓몬의 온화한 생체 펄스
      const pulseScale = 1.0 + Math.sin(prog * Math.PI) * 0.04;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        pScale: isP ? { x: pulseScale, y: pulseScale } : undefined,
        eScale: !isP ? { x: pulseScale, y: pulseScale } : undefined,
        moveStep: 2,
        phaseId: `moonlight-beam-glow-${i + 1}`,
        phaseName: "#2. 하늘색 빛줄기 조명 및 바닥 타원형 빛무리",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
        cameraZoom: targetZoom,
        cameraFocal: targetFocal,
        _gen5Camera: true,
      });
    }

    // =========================================================================
    // [Step 3: 전-1(轉) - 빛줄기가 얇아지면서 사라짐 (Thinning & Vanishing)] (6프레임, 45ms)
    // [유저 요구사항 100% 반영]: "빗줄기가 얇아지면서 사라지고"
    // - 빛줄기 폭이 중심축으로 좁아지며 소산 (widthScale: 1.0 -> 0.0)
    // - 바닥 타원형 빛무리도 함께 축소 소산
    // - 짙은 밤하늘 암전(darkAlpha = 1.0)은 그대로 100% 유지!
    // =========================================================================
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      const pulseScale = 1.0 + Math.sin(prog * Math.PI) * 0.02;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        pScale: isP ? { x: pulseScale, y: pulseScale } : undefined,
        eScale: !isP ? { x: pulseScale, y: pulseScale } : undefined,
        moveStep: 3,
        phaseId: `moonlight-thinning-${i + 1}`,
        phaseName: `#3. 빛줄기가 얇아지면서 사라짐 (${Math.round((1.0 - prog) * 100)}% -> 0%)`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
        cameraZoom: targetZoom,
        cameraFocal: targetFocal,
        _gen5Camera: true,
      });
    }

    // =========================================================================
    // [Step 4: 전-2(轉) - 암전 상태에서 HP 회복 애니메이션 재생] (8프레임, 65ms)
    // [유저 요구사항 100% 반영]: "그 뒤에 암전 상태에서 HP 회복 애니메이션 재생"
    // - 빛줄기가 완전히 사라진 상태에서 칠흑의 밤하늘 암전(darkAlpha = 1.0) 유지!
    // - 대상 포켓몬 주위로 4개의 나선 회복별(Recovery Star Spiral)이 시계방향 3D 타원 궤도로
    //   회전하며 상공으로 승화하는 고품질 HP 회복 애니메이션 재생!
    // =========================================================================
    for (let i = 0; i < 8; i++) {
      const prog = i / 7;
      const pulseScale = 1.0 + Math.sin(prog * Math.PI) * 0.04;
      const bobY = -Math.sin(prog * Math.PI) * 2;

      frames.push({
        ...baseFrame,
        delay: 65,
        ...cOff(0, bobY),
        pScale: isP ? { x: pulseScale, y: pulseScale } : undefined,
        eScale: !isP ? { x: pulseScale, y: pulseScale } : undefined,
        moveStep: 4,
        phaseId: `moonlight-recovery-stars-${i + 1}`,
        phaseName: `#4. 암전 속 HP 회복 나선별 재생 (${i + 1}/8)`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
        cameraZoom: targetZoom,
        cameraFocal: targetFocal,
        _gen5Camera: true,
      });
    }

    // =========================================================================
    // [Step 5: 결(結) - 암전 서서히 걷히며 카메라 중립 복귀 (Glide-Out)] (7프레임, 50ms)
    // =========================================================================
    const lastFrame = frames[frames.length - 1];
    const returnFrames = createSmoothCameraReturnFrames(
      lastFrame,
      targetZoom,
      targetFocal,
      neutralCenter.x,
      neutralCenter.y,
      7,
      50
    );
    returnFrames.forEach((rf, idx) => {
      rf.moveStep = 5;
      rf.effectProgress = (idx + 1) / returnFrames.length; // 암전 페이드아웃 (1.0 -> 0.0)
      rf.phaseId = `moonlight-return-${idx + 1}`;
      rf.phaseName = "#5. 암전 해제 및 카메라 중립 복귀";
      rf.showEffect = true;
      rf.showBehindEffect = true;
    });
    frames.push(...returnFrames);

    return frames;
  },
};
