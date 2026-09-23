// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawFireBlastBehindEffect,
  drawFireBlastEffect,
} from "../../../renderers/moves/gen1/move125_128.js";

/**
 * 126: 불대문자 (Fire Blast / だいもんじ) - 불꽃 타입 특수 기술 (위력 110, 명중 85%, 10% 화상)
 *
 * 연출 흐름 (유저 지침 100% 반영):
 * 1. [회전 불꽃 응축] 시전 포켓몬 위치에 회전하는 소용돌이 불꽃 발생 -> 뭉쳐져 거대한 화염구 형성
 * 2. [상대방 쇄도 비행] 뭉쳐진 화염구가 상대방 포켓몬을 향해 꼬리 잔상을 남기며 고속 비행 (프레임 넉넉히 6단계)
 * 3. [5갈래 '大' 분출] 대상 포켓몬 스프라이트 Z축 위에서 중심 폭발하며 5갈래로 뿜어져 나가는 불잔상 한자 큰 대(大) 형성
 * 4. ['大' 자 전신 연소 & 소멸] 대상 전면에서 '大' 자 화염이 강렬히 타오르며 피격 점멸 후 서서히 승화 페이드아웃
 */
export const fireBlastMove: BattleMoveAnimation = {
  num: 126,
  key: "fire-blast",
  nameKo: "불대문자",
  nameEn: "Fire Blast",
  type: "fire",
  category: "special",
  camera: { type: "target", zoom: 1.28, delayUntilStep: 3 },
  drawBehindEffect: drawFireBlastBehindEffect,
  drawEffect: drawFireBlastEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.28,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 전용 오프셋 및 스케일 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(수비자) 전용 넉백 및 스쿼시 헬퍼
    const targetOff = (offX: number, offY: number, scaleX: number = 1.0, scaleY: number = 1.0) => ({
      pOffset: !isP ? { x: -offX, y: offY } : { x: 0, y: 0 },
      eOffset: isP ? { x: offX, y: offY } : { x: 0, y: 0 },
      pScale: !isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      eScale: isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
    });

    return [
      // ======================================================================
      // Phase 1: 화염이 시전 포켓몬을 둥글게 2회전함 (Step 1 - 16단계 2.05바퀴 우아한 공전)
      // - 유저 지침: "2바퀴로 하되 불이 너무 빨리 돈다" -> 딜레이를 65~75ms로 늘려 묵직하고 뚜렷하게 회전
      // ======================================================================
      // --- [1회전] 시전자 둘레 360도 1차 공전 (여유로운 템포) ---
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-3, 1),
        pScale: isP ? { x: 1.03, y: 0.97 } : undefined,
        eScale: !isP ? { x: 1.03, y: 0.97 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.04,
        phaseId: "fire-blast-rot1-1",
        phaseName: "1. 화염 1회전 시작 (점화 & 등 뒤 진입)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-5, 2),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.10,
        phaseId: "fire-blast-rot1-2",
        phaseName: "2. 화염 1회전 (등 뒤로 완만하게 회전)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-6, 2),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.16,
        phaseId: "fire-blast-rot1-3",
        phaseName: "3. 화염 1회전 (등 뒤 통과)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-5, 1),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.22,
        phaseId: "fire-blast-rot1-4",
        phaseName: "4. 화염 1회전 (등 뒤 반대편 통과)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-1, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.28,
        phaseId: "fire-blast-rot1-5",
        phaseName: "5. 화염 1회전 (반대편 극점 통과)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(3, -1),
        pScale: isP ? { x: 0.98, y: 1.02 } : undefined,
        eScale: !isP ? { x: 0.98, y: 1.02 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "fire-blast-rot1-6",
        phaseName: "6. 화염 1회전 (가슴 앞으로 출현)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(6, -2),
        pScale: isP ? { x: 0.97, y: 1.03 } : undefined,
        eScale: !isP ? { x: 0.97, y: 1.03 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.42,
        phaseId: "fire-blast-rot1-7",
        phaseName: "7. 화염 1회전 (가슴 앞 가로지름)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(7, -2),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.49,
        phaseId: "fire-blast-rot1-8",
        phaseName: "8. 화염 1회전 완주! (360° 통과)",
      },

      // --- [2회전] 360도 2차 공전 & 융합 (묵직한 템포) ---
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-3, 1),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.56,
        phaseId: "fire-blast-rot2-1",
        phaseName: "9. 화염 2회전 시작 (등 뒤 재진입)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-6, 2),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.63,
        phaseId: "fire-blast-rot2-2",
        phaseName: "10. 화염 2회전 (등 뒤 통과)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-4, 1),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.70,
        phaseId: "fire-blast-rot2-3",
        phaseName: "11. 화염 2회전 (반대편 궤도 통과)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(1, -1),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.77,
        phaseId: "fire-blast-rot2-4",
        phaseName: "12. 화염 2회전 (가슴 앞 출현)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(5, -2),
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.84,
        phaseId: "fire-blast-rot2-5",
        phaseName: "13. 화염 2회전 (가슴 앞 통과 & 꼬리 잔상)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(8, -3),
        pScale: isP ? { x: 0.95, y: 1.05 } : undefined,
        eScale: !isP ? { x: 0.95, y: 1.05 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.91,
        phaseId: "fire-blast-rot2-6",
        phaseName: "14. 화염 2회전 (가슴 앞 쇄도 & 중심 융합)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(10, -3),
        pScale: isP ? { x: 0.94, y: 1.06 } : undefined,
        eScale: !isP ? { x: 0.94, y: 1.06 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.96,
        phaseId: "fire-blast-rot2-7",
        phaseName: "15. 화염 2회전 완주! (720° 도달)",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(11, -4),
        pScale: isP ? { x: 0.92, y: 1.08 } : undefined,
        eScale: !isP ? { x: 0.92, y: 1.08 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "fire-blast-rot2-8",
        phaseName: "16. 2회전 완료 & 거대 화염구 장전 완료!",
      },

      // ======================================================================
      // Phase 2: 화염구가 상대방 포켓몬으로 쇄도 비행 (Step 2 - 넉넉한 6단계 고FPS)
      // ======================================================================
      // 3. 쇄도 발진 (꼬리 제트 분출)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(4, -1),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.12,
        phaseId: "fire-blast-surge-1",
        phaseName: "3. 화염구 쇄도 발진 (꼬리 제트 분출)",
      },
      // 4. 가속 비행 & 굽이치는 화염 잔상
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.28,
        phaseId: "fire-blast-surge-2",
        phaseName: "4. 가속 비행 & 굽이치는 화염 잔상",
      },
      // 5. 중간 궤적 통과 & 불티 비산
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.48,
        phaseId: "fire-blast-surge-3",
        phaseName: "5. 중간 궤적 도달 & 불티 비산",
      },
      // 6. 상대방 코앞 육박
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.68,
        phaseId: "fire-blast-surge-4",
        phaseName: "6. 상대방 코앞 육박",
      },
      // 7. 대상 전면 돌입 직전
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.86,
        phaseId: "fire-blast-surge-5",
        phaseName: "7. 대상 전면 돌입 직전",
      },
      // 8. 대상 포켓몬 스프라이트 전면 도달 & 충돌 개시
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "fire-blast-surge-6",
        phaseName: "8. 대상 포켓몬 전면 도달 & 충돌",
      },

      // ======================================================================
      // Phase 3: 대상 포켓몬 Z축 위에서 5갈래로 뿜어져 뻗어나가며 한자 '大' 자 형성 (Step 3)
      // - 유저 요청: "큰 대로 뻗어나가는 거" -> 중심 폭발 후 5갈래가 시원하게 바깥으로 뻗어 나가는 모션 체감
      // ======================================================================
      // 9. Z축 위 중심 대폭발 & 5갈래 불꽃 제트 점화 분출
      {
        ...baseFrame,
        delay: 80,
        ...targetOff(4, -1, 1.04, 0.96),
        showEffect: true,
        hitFlash: true,
        moveStep: 3,
        effectProgress: 0.25,
        phaseId: "fire-blast-burst-ignite",
        phaseName: "9. Z축 위 중심 대폭발 & 5갈래 불꽃 점화",
      },
      // 10. 5갈래 불꽃 제트가 바깥으로 힘차게 뿜어져 뻗어나감 (중간 전개)
      {
        ...baseFrame,
        delay: 80,
        ...targetOff(8, -3, 1.06, 0.94),
        showEffect: true,
        hitFlash: true,
        moveStep: 3,
        effectProgress: 0.55,
        phaseId: "fire-blast-burst-extend-1",
        phaseName: "10. 5갈래 불꽃 제트 바깥으로 뻗어나감",
      },
      // 11. 5갈래 불꽃 제트 외곽 쇄도 및 웅장한 '大' 자 윤곽 형성
      {
        ...baseFrame,
        delay: 85,
        ...targetOff(10, -4, 1.02, 0.98),
        showEffect: true,
        hitFlash: true,
        moveStep: 3,
        effectProgress: 0.82,
        phaseId: "fire-blast-burst-extend-2",
        phaseName: "11. 5갈래 불꽃 외곽 쇄도 & '大' 자 윤곽 형성",
      },
      // 12. 5갈래 불꽃이 완전히 전개되어 웅장한 한자 '大' 자 완성! (#24)
      {
        ...baseFrame,
        delay: 110,
        ...targetOff(12, -4, 0.94, 1.06),
        showEffect: true,
        hitFlash: true,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "fire-blast-kanji-complete",
        phaseName: "12. 5갈래 불꽃 전개 한자 '大' 자 완성 (#24)",
      },

      // ======================================================================
      // Phase 4: '大' 자 전신 연소 & 형태 유지 후 안쪽부터 소멸 (Step 4)
      // - 유저 요청:
      //   1) "큰 대인상태로 좀 유지되다가" -> p<=0.50 동안 100% 형태 유지하며 맹렬 연소
      //   2) "안쪽부터 사라지는거 만들어주고" -> 중심 코어와 안쪽 줄기 퍼프가 먼저 소멸, 끝단 5개 화염 머리가 마지막까지 잔류
      // ======================================================================
      // 13. #25: '大' 자 화염이 대상 전신을 뒤덮고 맹렬히 연소 (화상 피격)
      {
        ...baseFrame,
        delay: 115,
        ...targetOff(-4, 2, 1.02, 0.98),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.22,
        phaseId: "fire-blast-burn-peak",
        phaseName: "13. #25: '大' 자 화염 전신 맹렬 연소",
      },
      // 14. #26: '大' 자 형태 완전 유지 연소 (지속 1)
      {
        ...baseFrame,
        delay: 105,
        ...targetOff(3, -1, 1.02, 0.98),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.38,
        phaseId: "fire-blast-burn-hold-1",
        phaseName: "14. #26: '大' 자 형태 유지 연소 (1)",
      },
      // 15. #27: '大' 자 형태 완전 유지 연소 (지속 2 & 고열 맥동)
      {
        ...baseFrame,
        delay: 105,
        ...targetOff(-3, 1, 0.98, 1.02),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.52,
        phaseId: "fire-blast-burn-hold-2",
        phaseName: "15. #27: '大' 자 형태 유지 연소 (2)",
      },
      // 16. #28: 안쪽 코어 및 중심부 줄기부터 서서히 소멸 시작 (5갈래 끝단 머리는 맹렬 유지)
      {
        ...baseFrame,
        delay: 100,
        ...targetOff(2, -1, 1.01, 0.99),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.70,
        phaseId: "fire-blast-burn-inner-fade",
        phaseName: "16. #28: 안쪽 코어 및 중심 줄기부터 소멸 시작",
      },
      // 17. #32: 한자 '中' 자 화염 꼬리 잔상 등장 (#32)
      {
        ...baseFrame,
        delay: 100,
        ...targetOff(-1, 1, 0.99, 1.01),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.88,
        phaseId: "fire-blast-kanji-chuu-1",
        phaseName: "17. #32: 한자 '中' 자 화염 잔상 등장 (1)",
        kanjiChar: "中",
      },
      // 18. #33: 한자 '中' 자 화염 꼬리 잔상 유지 (#33)
      {
        ...baseFrame,
        delay: 105,
        ...targetOff(1, -1, 1.01, 0.99),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.92,
        phaseId: "fire-blast-kanji-chuu-2",
        phaseName: "18. #33: 한자 '中' 자 형태 유지 (2)",
        kanjiChar: "中",
      },
      // 19. #34: 한자 '小' 자 화염 꼬리 잔상 (더 작은 형태)
      {
        ...baseFrame,
        delay: 105,
        ...targetOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.96,
        phaseId: "fire-blast-kanji-shou",
        phaseName: "19. #34: 한자 '小' 자 축소 잔상",
        kanjiChar: "小",
      },
      // 20. #32: 화염 잔향 최종 소멸 & 피격자 안정화 복귀
      {
        ...baseFrame,
        delay: 85,
        ...targetOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "fire-blast-fade-finish",
        phaseName: "20. 화염 잔향 최종 소멸 & 피격자 복귀",
        kanjiChar: "小",
      },
    ];
  },
};
