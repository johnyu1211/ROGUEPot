// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSpiteBehindEffect,
  drawSpiteEffect,
} from "../../../renderers/moves/gen1/move177_180.js";

/**
 * 180: 원한 (Spite) - 고스트 타입 변화기 (상대 마지막 사용 기술 PP 4 감소)
 *
 * 위력: — / 명중: 100 / PP: 10 / 접촉 판정: X
 * 설명: 상대가 마지막으로 사용한 기술에 원한을 품어 그 기술의 PP를 4만큼 줄인다.
 *
 * [유저 명시 연출 시퀀스]:
 * 1. 원한 (Step 1: 기술 선언)
 * 2. 암전 (Step 2: 전장 암전)
 * 3. 시전포켓몬 필터로 흰색 두번 (Step 2: 암전 속에서 시전 포켓몬이 순백 필터로 2회 번쩍임)
 * 4. 암전 풀림 (Step 3: 암전 해제 및 정상 배경 복귀)
 * 5. 효과발동 (Step 4~5: 상대 포켓몬 타겟 포커싱 ➔ 원한의 사령 얼굴/도깨비불 소환 & PP 잠식 파동 ➔ 소산 및 복귀)
 */
export const spiteMove: BattleMoveAnimation = {
  num: 180,
  key: "spite",
  nameKo: "원한",
  nameEn: "Spite",
  type: "ghost",
  category: "status",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    delayUntilStep: 4, // 1~3단계(시전 포커싱, 암전, 서서히 흰색 변환 2회, 암전 풀림)는 시전자 포커싱, 4단계부터 상대방으로 이동
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawSpiteBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawSpiteEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pRot: 0,
      eRot: 0,
      rotateFromCenter: true,
      pRotCenter: true,
      eRotCenter: true,
      showEffect: false,
      showBehindEffect: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 단독 오프셋 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(상대방) 단독 오프셋 헬퍼
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    // 피격자(상대방) 단독 스케일 헬퍼 (흐믈거리는 스쿼시/스트레치 탄성)
    const defScale = (sx: number, sy: number) => ({
      pScale: !isP ? { x: sx, y: sy } : undefined,
      eScale: isP ? { x: sx, y: sy } : undefined,
    });

    // 피격자(상대방) 단독 회전 헬퍼 (좌우 틸트)
    const defRot = (rot: number) => ({
      pRot: !isP ? rot : 0,
      eRot: isP ? rot : 0,
    });

    // 시전 포켓몬 점진적 순백 필터 헬퍼 (천천히 희게 변했다가 복귀)
    const casterWhiteAlpha = (val: number) => ({
      whiteFilterAlpha: val,
      pWhiteAlpha: isP ? val : 0,
      eWhiteAlpha: !isP ? val : 0,
      casterWhite: val >= 0.99,
      pWhite: val >= 0.99 ? isP : false,
      eWhite: val >= 0.99 ? !isP : false,
    });

    // 피격자(상대방) 제자리 지그재그 흐믈거림 헬퍼 (스프라이트가 위치 이동 없이 제자리에서 좌우 지그재그로 물결치듯 흔들림)
    const targetWobble = (amp: number, phase: number, freq: number = Math.PI * 4) => {
      const wave = amp > 0 ? { amp, freq, phase } : undefined;
      return {
        targetWaveShift: wave,
        pWaveShift: !isP ? wave : undefined,
        eWaveShift: isP ? wave : undefined,
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        ...defRot(0.0),
      };
    };

    return [
      // =======================================================================
      // 1. 원한 (시전 포켓몬 포커싱 & 기술 선언 - 120ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 120,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(0.0),
        blackoutScreen: false,
        moveStep: 1,
        phaseId: "spite-start",
        phaseName: "1. 시전 포켓몬 포커싱 & 원한 시전",
      },

      // =======================================================================
      // 2. 암전 (전장 칠흑 암전 돌입 - 110ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(0.0),
        blackoutScreen: true,
        moveStep: 2,
        phaseId: "spite-blackout-in",
        phaseName: "2. 전장 칠흑 암전",
      },

      // =======================================================================
      // 3. 시전 포켓몬 천천히 희게 변했다가 원상복귀 (1차)
      // =======================================================================
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(0.30),
        blackoutScreen: true,
        moveStep: 2,
        phaseId: "spite-white-fadein-1-1",
        phaseName: "3. 1차 서서히 흰색 변환 (30%)",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(0.70),
        blackoutScreen: true,
        moveStep: 2,
        phaseId: "spite-white-fadein-1-2",
        phaseName: "3. 1차 서서히 흰색 변환 (70%)",
      },
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(1.0),
        blackoutScreen: true,
        moveStep: 2,
        phaseId: "spite-white-peak-1",
        phaseName: "3. 1차 완전 순백 (100%)",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(0.50),
        blackoutScreen: true,
        moveStep: 2,
        phaseId: "spite-white-fadeout-1",
        phaseName: "3. 1차 흰색 감쇠 (50%)",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(0.0),
        blackoutScreen: true,
        moveStep: 2,
        phaseId: "spite-white-off-1",
        phaseName: "3. 1차 원상 복귀",
      },

      // =======================================================================
      // 3. 시전 포켓몬 천천히 희게 변했다가 원상복귀 (2차)
      // =======================================================================
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(0.30),
        blackoutScreen: true,
        moveStep: 2,
        phaseId: "spite-white-fadein-2-1",
        phaseName: "3. 2차 서서히 흰색 변환 (30%)",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(0.70),
        blackoutScreen: true,
        moveStep: 2,
        phaseId: "spite-white-fadein-2-2",
        phaseName: "3. 2차 서서히 흰색 변환 (70%)",
      },
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(1.0),
        blackoutScreen: true,
        moveStep: 2,
        phaseId: "spite-white-peak-2",
        phaseName: "3. 2차 완전 순백 (100%)",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(0.50),
        blackoutScreen: true,
        moveStep: 2,
        phaseId: "spite-white-fadeout-2",
        phaseName: "3. 2차 흰색 감쇠 (50%)",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(0.0),
        blackoutScreen: true,
        moveStep: 2,
        phaseId: "spite-white-off-2",
        phaseName: "3. 2차 원상 복귀",
      },

      // =======================================================================
      // 4. 암전 풀림 (칠흑 암전 해제 및 정상 배경 복귀 - 120ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 120,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...casterWhiteAlpha(0.0),
        blackoutScreen: false,
        moveStep: 3,
        phaseId: "spite-blackout-lift",
        phaseName: "4. 암전 풀림 (전장 복귀)",
      },

      // =======================================================================
      // 5. 효과발동: 상대방 포커싱 & 대상 포켓몬이 제자리에서 좌우 지그재그로 흐믈거림
      // (몸체 전체의 위치 이동 없이, 제자리에서 스프라이트가 수평 지그재그 파동 왜곡)
      // =======================================================================
      // 5-1. 왜곡 시작
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, 0),
        ...targetWobble(4, 0.0),
        moveStep: 4,
        phaseId: "spite-wobble-1",
        phaseName: "5. 지그재그 왜곡 시작",
      },
      // 5-2. 파동 진폭 확대
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...targetWobble(8, 1.3),
        moveStep: 4,
        phaseId: "spite-wobble-2",
        phaseName: "5. 지그재그 파동 확장",
      },
      // 5-3. 1차 원한 왜곡 피크
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...targetWobble(13, 2.6),
        moveStep: 4,
        phaseId: "spite-wobble-3",
        phaseName: "5. 1차 원한 왜곡 피크",
      },
      // 5-4. 최대 왜곡 상태 파동 흐름
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...targetWobble(15, 3.9),
        moveStep: 4,
        phaseId: "spite-wobble-4",
        phaseName: "5. 원한 잠식 최대 파동",
      },
      // 5-5. 최대 왜곡 지속
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...targetWobble(15, 5.2),
        moveStep: 4,
        phaseId: "spite-wobble-5",
        phaseName: "5. 원한 잠식 지속 파동",
      },
      // 5-6. 2차 왜곡 파동
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...targetWobble(12, 6.5),
        moveStep: 4,
        phaseId: "spite-wobble-6",
        phaseName: "5. 2차 왜곡 파동",
      },
      // 5-7. 왜곡 감쇠 1
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...targetWobble(9, 7.8),
        moveStep: 4,
        phaseId: "spite-wobble-7",
        phaseName: "5. 왜곡 감쇠 1단계",
      },
      // 5-8. 왜곡 감쇠 2
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...targetWobble(6, 9.1),
        moveStep: 4,
        phaseId: "spite-wobble-8",
        phaseName: "5. 왜곡 감쇠 2단계",
      },
      // 5-9. 미세 잔향
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, 0),
        ...targetWobble(3, 10.4),
        moveStep: 4,
        phaseId: "spite-wobble-9",
        phaseName: "5. 미세 잔향 흔들림",
      },
      // 5-10. 안정 복귀
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...targetWobble(0, 0),
        moveStep: 5,
        phaseId: "spite-recover-1",
        phaseName: "6. 정위치 안착",
      },
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...targetWobble(0, 0),
        fadeEffectOnCameraReturn: true,
        moveStep: 5,
        phaseId: "spite-recover-2",
        phaseName: "6. 여운 및 카메라 복귀",
      },
    ];
  },
};
