// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSafeguardEffect } from "../../../renderers/moves/gen1/move217_220.js";

/**
 * 219: 신비의부적 (Safeguard)
 * - 시전포켓몬 스프라이트 위에 안쪽으로 작아지는 하늘색 원 연출
 */
export const safeguardMove: BattleMoveAnimation = {
  num: 219,
  key: "safeguard",
  nameKo: "신비의부적",
  nameEn: "Safeguard",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSafeguardEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      showEffect: true,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    // 5개의 시계방향 비균일 십자별 위치 정의 (각도 및 반경 비균일/불규칙 배치)
    // S1(~11:40, -80°, R49) ➔ S2(~1:30, -45°, R42) ➔ S3(~4:30, +45°, R48) ➔ S4(~7:40, +140°, R44) ➔ S5(~9:50, +214°, R50)
    const S1 = { angle: -Math.PI * 0.44, radius: 49 };
    const S2 = { angle: -Math.PI * 0.25, radius: 42 };
    const S3 = { angle: Math.PI * 0.25, radius: 48 };
    const S4 = { angle: Math.PI * 0.78, radius: 44 };
    const S5 = { angle: Math.PI * 1.19, radius: 50 };

    // 각 별의 생애 주기
    // ⚠️ 유저 요청: 증기는 별이 나타나고 사라진 후에 페이드 인으로 나타남!
    // Stage 0: 별 단독 출현 (증기 없음)
    // Stage 1: 별 축소 및 페이드아웃 (증기 없음)
    // Stage 2: 별 완전 소멸 ➔ 증기 페이드 인으로 피어오름!
    // Stage 3: 증기 최대 팽창 (피크)
    // Stage 4: 증기 서서히 소산
    const starStage = (cfg: { angle: number; radius: number }, stage: number) => {
      switch (stage) {
        case 0:
          return { ...cfg, size: 10, starAlpha: 1.0, vaporAlpha: 0.0, vaporRadius: 0, rot: 0 };
        case 1:
          return { ...cfg, size: 6, starAlpha: 0.45, vaporAlpha: 0.0, vaporRadius: 0, rot: 0.15 };
        case 2:
          return { ...cfg, size: 0, starAlpha: 0.0, vaporAlpha: 0.42, vaporRadius: 9, rot: 0.25 };
        case 3:
          return { ...cfg, size: 0, starAlpha: 0.0, vaporAlpha: 0.72, vaporRadius: 13, rot: 0.35 };
        case 4:
          return { ...cfg, size: 0, starAlpha: 0.0, vaporAlpha: 0.25, vaporRadius: 15, rot: 0.45 };
        default:
          return null;
      }
    };

    return [
      {
        ...baseFrame,
        ...cOff(0, 0),
        delay: 80,
        moveStep: 1,
        shrinkProgress: 0.05,
        circleAlpha: 0.80,
        ghosts: [],
        stars: [
          // S1(11시40분) 별 단독 출현 (증기 없음)
          starStage(S1, 0)!,
        ],
        phaseId: "safeguard-shrink-1",
        phaseName: "1. 5겹 원 생성 & S1 십자별 출현(11시40분)",
      },
      {
        ...baseFrame,
        ...cOff(0, 0),
        delay: 80,
        moveStep: 1,
        shrinkProgress: 0.22,
        circleAlpha: 0.95,
        ghosts: [{ progress: 0.05, alpha: 0.35 }],
        stars: [
          // S1 별 페이드, S2(1시30분) 별 출현 (증기 없음)
          starStage(S1, 1)!,
          starStage(S2, 0)!,
        ],
        phaseId: "safeguard-shrink-2",
        phaseName: "2. 안쪽 축소 & S1 별 페이드 & S2 십자별 출현(1시30분)",
      },
      {
        ...baseFrame,
        ...cOff(0, 0),
        delay: 80,
        moveStep: 1,
        shrinkProgress: 0.42,
        circleAlpha: 1.0,
        ghosts: [
          { progress: 0.22, alpha: 0.40 },
          { progress: 0.05, alpha: 0.18 },
        ],
        stars: [
          // S1 별 소멸 ➔ S1 증기 페이드인 시작!
          starStage(S1, 2)!,
          starStage(S2, 1)!,
          // S3(4시30분) 별 출현
          starStage(S3, 0)!,
        ],
        phaseId: "safeguard-shrink-3",
        phaseName: "3. 축소 진행 & S1 증기 페이드인 & S3 십자별 출현(4시30분)",
      },
      // 링 생기고 3프레임 후: 시전 포켓몬과 링이 함께 흔들림 시작!
      {
        ...baseFrame,
        ...cOff(-4, 0),
        delay: 80,
        moveStep: 1,
        shrinkProgress: 0.62,
        circleAlpha: 1.0,
        ghosts: [
          { progress: 0.42, alpha: 0.40 },
          { progress: 0.22, alpha: 0.18 },
        ],
        stars: [
          starStage(S1, 3)!, // S1 증기 피크
          starStage(S2, 2)!, // S2 별 소멸 ➔ S2 증기 페이드인 시작!
          starStage(S3, 1)!,
          starStage(S4, 0)!, // S4(7시40분) 별 출현
        ],
        phaseId: "safeguard-shrink-4",
        phaseName: "4. 포켓몬 응축(-4px) & S4 십자별 출현 & S2 증기 페이드인",
      },
      {
        ...baseFrame,
        ...cOff(4, 0),
        delay: 80,
        moveStep: 1,
        shrinkProgress: 0.80,
        circleAlpha: 0.95,
        ghosts: [
          { progress: 0.62, alpha: 0.40 },
          { progress: 0.42, alpha: 0.18 },
        ],
        stars: [
          starStage(S1, 4)!, // S1 증기 소산
          starStage(S2, 3)!, // S2 증기 피크
          starStage(S3, 2)!, // S3 별 소멸 ➔ S3 증기 페이드인 시작!
          starStage(S4, 1)!,
          starStage(S5, 0)!, // S5(9시50분) 별 출현
        ],
        phaseId: "safeguard-shrink-5",
        phaseName: "5. 작은 원 수축(+4px) & S5 십자별 출현 & S3 증기 페이드인",
      },
      {
        ...baseFrame,
        ...cOff(-2, 0),
        delay: 85,
        moveStep: 1,
        shrinkProgress: 0.94,
        circleAlpha: 0.80,
        ghosts: [
          { progress: 0.80, alpha: 0.45 },
          { progress: 0.62, alpha: 0.20 },
        ],
        shrunkAfterimage: { radius: 12, alpha: 0.45 },
        stars: [
          starStage(S2, 4)!, // S2 증기 소산
          starStage(S3, 3)!, // S3 증기 피크
          starStage(S4, 2)!, // S4 별 소멸 ➔ S4 증기 페이드인 시작!
          starStage(S5, 1)!,
        ],
        phaseId: "safeguard-shrink-6",
        phaseName: "6. 중심 수렴 직전(-2px) & S4 증기 페이드인",
      },
      {
        ...baseFrame,
        ...cOff(1, 0),
        delay: 90,
        moveStep: 1,
        shrinkProgress: 1.00,
        circleAlpha: 0.0,
        ghosts: [{ progress: 0.80, alpha: 0.25 }],
        shrunkAfterimage: { radius: 11, alpha: 0.65 },
        stars: [
          starStage(S3, 4)!, // S3 증기 소산
          starStage(S4, 3)!, // S4 증기 피크
          starStage(S5, 2)!, // S5 별 소멸 ➔ S5 증기 페이드인 시작!
        ],
        phaseId: "safeguard-afterimage-1",
        phaseName: "7. 잔상(+1px) & S5 증기 페이드인",
      },
      {
        ...baseFrame,
        ...cOff(0, 0),
        delay: 85,
        moveStep: 1,
        shrinkProgress: 1.00,
        circleAlpha: 0.0,
        shrunkAfterimage: { radius: 10, alpha: 0.35 },
        stars: [
          starStage(S4, 4)!, // S4 증기 소산
          starStage(S5, 3)!, // S5 증기 피크
        ],
        phaseId: "safeguard-afterimage-2",
        phaseName: "8. 흰색 잔상 & S5 증기 피크 (원위치)",
      },
      {
        ...baseFrame,
        ...cOff(0, 0),
        delay: 75,
        moveStep: 1,
        shrinkProgress: 1.00,
        circleAlpha: 0.0,
        shrunkAfterimage: { radius: 9, alpha: 0.12 },
        stars: [
          starStage(S5, 4)!, // S5 증기 최종 소산
        ],
        phaseId: "safeguard-afterimage-3",
        phaseName: "9. 잔상 및 S5 증기 최종 소멸",
      },
      {
        ...baseFrame,
        ...cOff(0, 0),
        delay: 60,
        moveStep: 1,
        shrinkProgress: 1.00,
        circleAlpha: 0.0,
        showEffect: false,
        phaseId: "safeguard-end",
        phaseName: "10. 연출 종료",
      },
    ];
  },
};
