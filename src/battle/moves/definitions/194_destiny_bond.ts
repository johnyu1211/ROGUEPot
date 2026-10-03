// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawDestinyBondBehindEffect,
  drawDestinyBondEffect,
} from "../../../renderers/moves/gen1/move193_196.js";

/**
 * 194: 길동무 (Destiny Bond) - 고스트 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 5 / 접촉 판정: X
 * 설명: 시전 후 다음 행동 전까지 상대의 공격으로 쓰러졌을 때, 상대도 함께 기절시킨다.
 *
 * [유저 지정 연출]:
 * 1. 암전 반투명검정
 * 2. 시전 포켓몬 위치에 흰색 구체+흰색글로우효과 좀 크게 나타남
 * 3. 이 빛은 페이드아웃
 * 4. 시전 포켓몬 아래에 흰색 타원 (구체이나 각도로 입체적으로보이게 하기 위해 타원)
 * 5. 이게 상대포켓몬 바닥으로 이동
 * 6. 완전히 이동하면 시전포켓몬과 대상포켓몬 모두 흰색으로 점차 페이드인 > 페이드아웃(흰색필터)
 */
export const destinyBondMove: BattleMoveAnimation = {
  num: 194,
  key: "destiny-bond",
  nameKo: "길동무",
  nameEn: "Destiny Bond",
  type: "ghost",
  category: "status",
  camera: {
    type: "none",
    zoom: 1.0,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawDestinyBondBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawDestinyBondEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
      showEffect: true,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전 포켓몬과 대상 포켓몬 모두 흰색 필터 적용 헬퍼
    const bothWhiteAlpha = (val: number) => ({
      whiteFilterAlpha: val,
      pWhiteAlpha: val,
      eWhiteAlpha: val,
      pWhite: val >= 0.99,
      eWhite: val >= 0.99,
    });

    return [
      // ======================================================================
      // 1. Step 1: [암전 반투명검정 & 시전 포켓몬 위치에 흰색 구체 + 글로우 출현]
      // ======================================================================
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.0),
        blackFadeAlpha: 0.65,
        moveStep: 1,
        effectProgress: 0.25,
        phaseId: "destiny-sphere-in-1",
        phaseName: "1. 전장 반투명 암전 & 백색 구체 발현",
      },
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.0),
        blackFadeAlpha: 0.65,
        moveStep: 1,
        effectProgress: 0.70,
        phaseId: "destiny-sphere-in-2",
        phaseName: "2. 백색 구체 및 대형 글로우 확산",
      },
      {
        ...baseFrame,
        delay: 120,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.0),
        blackFadeAlpha: 0.65,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "destiny-sphere-peak",
        phaseName: "3. 백색 구체 최대 발광 피크",
      },

      // ======================================================================
      // 2. Step 2: [이 빛은 페이드아웃]
      // ======================================================================
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.0),
        blackFadeAlpha: 0.65,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "destiny-sphere-fade-1",
        phaseName: "4. 백색 구체 빛 서서히 감쇠",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.0),
        blackFadeAlpha: 0.65,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "destiny-sphere-fade-2",
        phaseName: "5. 백색 구체 완전 페이드아웃",
      },

      // ======================================================================
      // 3. Step 3: [시전 포켓몬 아래 흰색 타원 출현 & 상대 포켓몬 바닥으로 이동]
      // ======================================================================
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.0),
        blackFadeAlpha: 0.65,
        moveStep: 3,
        effectProgress: 0.05,
        phaseId: "destiny-oval-appear",
        phaseName: "6. 시전 포켓몬 발 밑 흰색 타원 출현",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.0),
        blackFadeAlpha: 0.65,
        moveStep: 3,
        effectProgress: 0.30,
        phaseId: "destiny-oval-move-1",
        phaseName: "7. 흰색 타원 상대 바닥 향해 이동 시작",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.0),
        blackFadeAlpha: 0.65,
        moveStep: 3,
        effectProgress: 0.60,
        phaseId: "destiny-oval-move-2",
        phaseName: "8. 전장 가로지르며 상대 바닥 접근",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.0),
        blackFadeAlpha: 0.65,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "destiny-oval-move-3",
        phaseName: "9. 상대 포켓몬 발 밑 근접",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.0),
        blackFadeAlpha: 0.65,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "destiny-oval-arrived",
        phaseName: "10. 상대 포켓몬 바닥에 완전 안착",
      },

      // ======================================================================
      // 4. Step 4: [시전 포켓몬과 대상 포켓몬 모두 흰색으로 점차 페이드인 > 페이드아웃]
      // ======================================================================
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.35),
        blackFadeAlpha: 0.65,
        moveStep: 4,
        effectProgress: 0.20,
        phaseId: "destiny-both-white-in-1",
        phaseName: "11. 시전자/대상 동시 흰색 필터 페이드인 (35%)",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.75),
        blackFadeAlpha: 0.65,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "destiny-both-white-in-2",
        phaseName: "12. 양 포켓몬 백색 필터 심화 (75%)",
      },
      {
        ...baseFrame,
        delay: 130,
        ...cOff(0, 0),
        ...bothWhiteAlpha(1.0),
        blackFadeAlpha: 0.65,
        moveStep: 4,
        effectProgress: 0.75,
        phaseId: "destiny-both-white-peak",
        phaseName: "13. 시전자와 대상 완전 순백 필터 피크 (100%)",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.50),
        blackFadeAlpha: 0.65,
        moveStep: 4,
        effectProgress: 0.90,
        phaseId: "destiny-both-white-out-1",
        phaseName: "14. 양 포켓몬 백색 필터 페이드아웃 (50%)",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.15),
        blackFadeAlpha: 0.65,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "destiny-both-white-out-2",
        phaseName: "15. 백색 필터 서서히 소산 (15%)",
      },

      // ======================================================================
      // 5. Step 5: [암전 해제 및 정상 안정 복귀]
      // ======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...bothWhiteAlpha(0.0),
        blackFadeAlpha: 0.0,
        moveStep: 5,
        effectProgress: 0.50,
        phaseId: "destiny-settle",
        phaseName: "16. 길동무 완료 및 정상 전장 복귀",
      },
    ];
  },
};
