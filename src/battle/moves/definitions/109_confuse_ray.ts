// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawConfuseRayEffect,
  drawConfuseRayBehindEffect,
} from "../../../renderers/moves/gen1/move109_112.js";

/**
 * 109: 이상한빛 (Confuse Ray) - 고스트 타입 변화 기술 (상대 100% 혼란)
 *
 * 연출 구성:
 * #1. 암전 시작 & 시전자 앞 영롱한 노란빛 구체 점화
 * #2. 암전 심화 & 빨간색/초록색 오라 글로우 교차 반짝임 가속
 * #3. 상대방을 향해 쇄도하는 노란빛 비행 (빨강/초록 글로우 펄스 & 잔상)
 * #4. 상대방 정수리/머리 위 도달
 * #5~#8. 상대방 스프라이트 둘레를 3D 입체로 빙글빙글 돌며 머리에서 발끝까지 나선 하강
 *        (스프라이트 뒤편 drawBehindEffect ↔ 앞편 drawEffect 교차 렌더링)
 * #9~#10. 발밑 착란 섬광 파동 & 머리 위 3D 회전 혼란 별무리(★ ★ ★) & 비틀거림, 암전 복귀
 * #11. 완료 및 중립 자세 복귀
 */
export const confuseRayMove: BattleMoveAnimation = {
  num: 109,
  key: "confuse-ray",
  nameKo: "이상한빛",
  nameEn: "Confuse Ray",
  type: "ghost",
  category: "status",
  customStatParticles: true,
  camera: { type: "target", zoom: 1.30 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !(frame.dimAlpha && frame.dimAlpha > 0)) return;
    drawConfuseRayBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawConfuseRayEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.30,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 암전 시작 & 노란빛 점화 (노랑 1/3, 기본 크기)
      {
        ...baseFrame,
        delay: 110,
        dimAlpha: 0.45,
        lightColorIdx: 0, // 노랑
        glowScale: 0.85,
        pOffset: isP ? { x: -3, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 3, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.04, y: 0.96 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.04, y: 0.96 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.25,
        phaseId: "confuse-ray-charge-1",
        phaseName: "#1. 암전 시작 & 노란빛 점화",
      },
      // #2. 암전 심화 & 노란 글로우 팽창 (노랑 2/3, 커짐!)
      {
        ...baseFrame,
        delay: 110,
        dimAlpha: 0.72,
        lightColorIdx: 0, // 노랑
        glowScale: 1.50,
        pOffset: isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -2, y: 1 } : { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.65,
        phaseId: "confuse-ray-charge-2",
        phaseName: "#2. 암전 심화 & 노란 글로우 팽창(커짐)",
      },
      // #3. 암전 완료 & 노란 글로우 응축 (노랑 3/3, 작아짐!)
      {
        ...baseFrame,
        delay: 100,
        dimAlpha: 0.82,
        lightColorIdx: 0, // 노랑
        glowScale: 0.70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "confuse-ray-charge-3",
        phaseName: "#3. 암전 완료 & 노란 글로우 응축(작아짐)",
      },

      // #4. 초록빛 쇄도 1 (초록 1/3, 기본 크기)
      {
        ...baseFrame,
        delay: 100,
        dimAlpha: 0.82,
        lightColorIdx: 1, // 초록
        glowScale: 0.90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.16,
        phaseId: "confuse-ray-fly-1",
        phaseName: "#4. 초록빛 쇄도 1 (상승 파동)",
      },
      // #5. 초록 글로우 팽창 (초록 2/3, 커짐!)
      {
        ...baseFrame,
        delay: 105,
        dimAlpha: 0.82,
        lightColorIdx: 1, // 초록
        glowScale: 1.50,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.33,
        phaseId: "confuse-ray-fly-2",
        phaseName: "#5. 초록 글로우 팽창(커짐)",
      },
      // #6. 초록 글로우 응축 (초록 3/3, 작아짐!)
      {
        ...baseFrame,
        delay: 100,
        dimAlpha: 0.82,
        lightColorIdx: 1, // 초록
        glowScale: 0.70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "confuse-ray-fly-3",
        phaseName: "#6. 초록 글로우 응축(작아짐)",
      },

      // #7. 빨간빛 쇄도 1 (빨강 1/3, 기본 크기)
      {
        ...baseFrame,
        delay: 100,
        dimAlpha: 0.82,
        lightColorIdx: 2, // 빨강
        glowScale: 0.90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.66,
        phaseId: "confuse-ray-fly-4",
        phaseName: "#7. 빨간빛 쇄도 1 (2차 상승 파동)",
      },
      // #8. 빨간 글로우 팽창 (빨강 2/3, 커짐!)
      {
        ...baseFrame,
        delay: 105,
        dimAlpha: 0.82,
        lightColorIdx: 2, // 빨강
        glowScale: 1.50,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.83,
        phaseId: "confuse-ray-fly-5",
        phaseName: "#8. 빨간 글로우 팽창(커짐)",
      },
      // #9. 빨간 글로우 응축 (빨강 3/3, 작아짐! 머리 상공 안착)
      {
        ...baseFrame,
        delay: 100,
        dimAlpha: 0.82,
        lightColorIdx: 2, // 빨강
        glowScale: 0.70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.98,
        phaseId: "confuse-ray-fly-6",
        phaseName: "#9. 머리 상공 안착 & 빨간 글로우 응축(작아짐)",
      },

      // #10. 3D 나선 하강 1 (노랑 1/3, 머리 뒤편 진입)
      {
        ...baseFrame,
        delay: 85,
        dimAlpha: 0.82,
        lightColorIdx: 0, // 노랑
        glowScale: 0.85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.11,
        phaseId: "confuse-ray-spiral-1",
        phaseName: "#10. 3D 나선 하강 1 (노랑, 머리 뒤편 진입)",
      },
      // #11. 3D 나선 하강 2 (노랑 2/3, 우측 어깨 전면, 커짐!)
      {
        ...baseFrame,
        delay: 85,
        dimAlpha: 0.82,
        lightColorIdx: 0, // 노랑
        glowScale: 1.45,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -1, y: 0 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.22,
        phaseId: "confuse-ray-spiral-2",
        phaseName: "#11. 3D 나선 하강 2 (노랑 글로우 커짐)",
      },
      // #12. 3D 나선 하강 3 (노랑 3/3, 가슴 중앙 앞편, 작아짐!)
      {
        ...baseFrame,
        delay: 85,
        dimAlpha: 0.82,
        lightColorIdx: 0, // 노랑
        glowScale: 0.70,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -2, y: 0 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.33,
        phaseId: "confuse-ray-spiral-3",
        phaseName: "#12. 3D 나선 하강 3 (노랑 글로우 작아짐)",
      },

      // #13. 3D 나선 하강 4 (초록 1/3, 좌측 허리 통과)
      {
        ...baseFrame,
        delay: 85,
        dimAlpha: 0.82,
        lightColorIdx: 1, // 초록
        glowScale: 0.85,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -1, y: 0 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.44,
        phaseId: "confuse-ray-spiral-4",
        phaseName: "#13. 3D 나선 하강 4 (초록, 좌측 허리 통과)",
      },
      // #14. 3D 나선 하강 5 (초록 2/3, 등 뒤편 통과, 커짐!)
      {
        ...baseFrame,
        delay: 85,
        dimAlpha: 0.82,
        lightColorIdx: 1, // 초록
        glowScale: 1.45,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 1, y: 0 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.55,
        phaseId: "confuse-ray-spiral-5",
        phaseName: "#14. 3D 나선 하강 5 (초록 글로우 커짐)",
      },
      // #15. 3D 나선 하강 6 (초록 3/3, 우측 골반/허벅지, 작아짐!)
      {
        ...baseFrame,
        delay: 85,
        dimAlpha: 0.82,
        lightColorIdx: 1, // 초록
        glowScale: 0.70,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 2, y: 0 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.66,
        phaseId: "confuse-ray-spiral-6",
        phaseName: "#15. 3D 나선 하강 6 (초록 글로우 작아짐)",
      },

      // #16. 3D 나선 하강 7 (빨강 1/3, 무릎 앞편 통과)
      {
        ...baseFrame,
        delay: 85,
        dimAlpha: 0.82,
        lightColorIdx: 2, // 빨강
        glowScale: 0.85,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 1, y: 0 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.77,
        phaseId: "confuse-ray-spiral-7",
        phaseName: "#16. 3D 나선 하강 7 (빨강, 무릎 앞편 통과)",
      },
      // #17. 3D 나선 하강 8 (빨강 2/3, 좌측 발목 뒤, 커짐!)
      {
        ...baseFrame,
        delay: 85,
        dimAlpha: 0.82,
        lightColorIdx: 2, // 빨강
        glowScale: 1.45,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.88,
        phaseId: "confuse-ray-spiral-8",
        phaseName: "#17. 3D 나선 하강 8 (빨강 글로우 커짐)",
      },
      // #18. 3D 나선 하강 9 (빨강 3/3, 발목 착지 & 흡수, 작아짐!)
      {
        ...baseFrame,
        delay: 85,
        dimAlpha: 0.82,
        lightColorIdx: 2, // 빨강
        glowScale: 0.70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "confuse-ray-spiral-9",
        phaseName: "#18. 3D 나선 하강 9 (빨강 글로우 작아짐 & 착지)",
      },

      // #19. 착란 충격 파동 & 머리 위 혼란 별무리 (노랑 1/3)
      {
        ...baseFrame,
        delay: 130,
        dimAlpha: 0.65,
        lightColorIdx: 0, // 노랑
        glowScale: 1.30,
        pRot: !isP ? -0.07 : 0,
        eRot: isP ? 0.07 : 0,
        pOffset: !isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: isHit,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "confuse-ray-dizzy-1",
        phaseName: "#19. 착란 충격 파동 & 혼란 별무리 (노랑)",
      },
      // #20. 혼란 별무리 3D 회전 (노랑 2/3)
      {
        ...baseFrame,
        delay: 130,
        dimAlpha: 0.40,
        lightColorIdx: 0, // 노랑
        glowScale: 1.00,
        pRot: !isP ? 0.07 : 0,
        eRot: isP ? -0.07 : 0,
        pOffset: !isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
        eOffset: isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        effectProgress: 0.70,
        phaseId: "confuse-ray-dizzy-2",
        phaseName: "#20. 혼란 별무리 3D 회전",
      },
      // #21. 시야 복귀 & 별무리 페이드아웃 (노랑 3/3)
      {
        ...baseFrame,
        delay: 120,
        dimAlpha: 0.15,
        lightColorIdx: 0, // 노랑
        glowScale: 0.70,
        pRot: 0,
        eRot: 0,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "confuse-ray-dizzy-3",
        phaseName: "#21. 시야 복귀 & 별무리 페이드아웃",
      },
      // #22. 완료 및 중립 복귀
      {
        ...baseFrame,
        delay: 80,
        dimAlpha: 0.0,
        lightColorIdx: 0,
        glowScale: 0.5,
        pRot: 0,
        eRot: 0,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "confuse-ray-complete",
        phaseName: "#22. 완료 및 중립 복귀",
      },
    ];
  },
};
