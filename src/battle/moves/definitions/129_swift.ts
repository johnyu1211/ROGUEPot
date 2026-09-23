// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import {
  drawSwiftBehindEffect,
  drawSwiftEffect,
} from "../../../renderers/moves/gen1/move129_132.js";

/**
 * 129: 스피드스타 (Swift) - 노말 타입 특수 공격기 (필중기)
 *
 * 연출 (유저 요구사항 100% 반영):
 * 1. [시작부터 별 6개 배치 & 충분한 반시계 회전]
 *    - 시작부터 6개의 황금별이 시전자 둘레 3D 타원 궤도에서 꽉 채워진 채 반시계방향으로 쌩쌩 회전
 * 2. [발사 시간 내내 지속 회전 & 1발씩 순차 사출]
 *    - 별들이 발사되는 시간 내내 시전자 둘레에서는 반시계 회전이 멈추지 않고 계속 유지됨!
 *    - 회전 궤도에서 1번, 2번, 3번, 4번, 5번 별이 차례대로 궤도를 이탈하여 슉! 슉! 슉! 슉! 슉! 사출
 * 3. [상대방 5연속 착탄 타격감 & 피날레 대폭발]
 */
export const swiftMove: BattleMoveAnimation = {
  num: 129,
  key: "swift",
  nameKo: "스피드스타",
  nameEn: "Swift",
  type: "normal",
  category: "special",
  drawBehindEffect: drawSwiftBehindEffect,
  drawEffect: drawSwiftEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 전용 오프셋
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자 전용 흔들림
    const tOff = (x: number, y: number) => ({
      pOffset: !isP && isHit ? { x, y } : (isP ? { x: 0, y: 0 } : undefined),
      eOffset: isP && isHit ? { x: -x, y: -y } : (!isP ? { x: 0, y: 0 } : undefined),
    });

    return [
      // ======================================================================
      // ======================================================================
      // Phase 1: 시작부터 별 6개 꽉 찬 상태로 반시계 회전 (8단계, 각 65ms)
      // ======================================================================
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-2, 1),
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.12,
        phaseId: "swift-spin-1",
        phaseName: "1. 시작부터 별 6개 반시계 회전 시작",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-4, 2),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.25,
        phaseId: "swift-spin-2",
        phaseName: "2. 별 6개 1회전 가속",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-6, 3),
        pScale: isP ? { x: 1.08, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.08, y: 0.92 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.38,
        phaseId: "swift-spin-3",
        phaseName: "3. 3D 타원 궤도 회전",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-8, 4), // 시전자 깊은 웅크림
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "swift-spin-4",
        phaseName: "4. 별 6개 2회전 진입",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-9, 4),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.62,
        phaseId: "swift-spin-5",
        phaseName: "5. 반시계 쾌속 스핀",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-10, 5),
        pScale: isP ? { x: 1.12, y: 0.88 } : undefined,
        eScale: !isP ? { x: 1.12, y: 0.88 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.75,
        phaseId: "swift-spin-6",
        phaseName: "6. 발사 에너지 응축",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-8, 4),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.88,
        phaseId: "swift-spin-7",
        phaseName: "7. 발사 임계점",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-4, 2),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "swift-spin-8",
        phaseName: "8. 회전 유지하며 발사 카운트다운",
      },

      // ======================================================================
      // Phase 2: 발사되는 시간 내내 지속 회전 유지하며 순차 사출 & 착탄 (8단계, 각 65ms)
      // ======================================================================
      {
        ...baseFrame,
        delay: 65,
        ...cOff(12, -5), // 전방 강력 탄성 방출
        pScale: isP ? { x: 0.90, y: 1.12 } : undefined,
        eScale: !isP ? { x: 0.90, y: 1.12 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.14,
        phaseId: "swift-launch-1",
        phaseName: "9. 회전 유지하며 1번 별 고속 사출!",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(14, -6),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.28,
        phaseId: "swift-launch-2",
        phaseName: "10. 2번 별 연속 사출 (주변 지속 회전)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(12, -5),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.42,
        phaseId: "swift-launch-3",
        phaseName: "11. 3번 별 연속 사출 (주변 지속 회전)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(9, -4),
        ...tOff(5, -2), // 1번 별 착탄 파동 링!
        showEffect: true,
        hitFlash: isHit,
        moveStep: 2,
        effectProgress: 0.57,
        phaseId: "swift-launch-4",
        phaseName: "12. 1번 별 착탄 & 노란 파동 링 확산!",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(6, -2),
        ...tOff(-7, 3), // 2번 별 착탄 파동 링!
        showEffect: true,
        hitFlash: isHit,
        moveStep: 2,
        effectProgress: 0.71,
        phaseId: "swift-launch-5",
        phaseName: "13. 2번 별 착탄 & 2차 파동 링!",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(3, -1),
        ...tOff(8, -3), // 3번 별 착탄 파동 링!
        showEffect: true,
        hitFlash: isHit,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "swift-launch-6",
        phaseName: "14. 3번 별 착탄 & 3차 파동 링!",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, 0),
        ...tOff(-10, 4), // 4번 별 착탄 파동 링!
        showEffect: true,
        hitFlash: isHit,
        moveStep: 2,
        effectProgress: 0.88,
        phaseId: "swift-launch-7",
        phaseName: "15. 4번 별 착탄 & 4차 파동 링!",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...tOff(10, -4), // 5번 별 착탄 파동 링! (과도한 대폭발 없이 노란 링으로 깔끔하게 종료)
        showEffect: true,
        hitFlash: isHit,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "swift-launch-8",
        phaseName: "16. 5번 별 착탄 & 5차 파동 링!",
      },

      // ======================================================================
      // Phase 3: 별빛 잔향 페이드아웃 & 자세 복귀 (delay: 110ms)
      // (마지막 거대 타격 폭발 없이 깔끔하게 잔향 소멸 복귀)
      // ======================================================================
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3, // 카메라 복귀 보장
        effectProgress: 1.0,
        phaseId: "swift-finish",
        phaseName: "17. 별빛 승화 & 복귀 완료",
      },
    ];
  },
};
