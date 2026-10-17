// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawOutrageBehindEffect,
  drawOutrageEffect,
} from "../../../renderers/moves/gen1/move197_200.js";

/**
 * 200: 역린 (Outrage) - 드래곤 타입 물리 접촉기 (위력 120, 명중 100%, PP 10)
 *
 * 설명: 2-3턴 동안 마구 난동 부려서 공격한다. 난동 부린 뒤에는 혼란에 빠진다.
 *
 * [역린 연출 기승전결 5단계 시퀀스]:
 * 1. [역린의 각성 & 포효 (Awakening & Roar)]:
 *    - 카메라 1.0x 중립 조망 ➔ 시전자 웅크림 및 몸체 격렬한 진동 ➔
 *    - 바닥에서 솟구치는 붉은색/청자색 드래곤 화염 오라 ➔
 *    - 붉은 안광(Eye Glint) 번뜩임 & 사방으로 포효 충격파 링 방출
 * 2. [1타: 벼락같은 1차 사선 드래곤 클로 참격 (1st Diagonal Dragon Slash)]:
 *    - 카메라 1.35x 타겟 다이내믹 줌인 포커싱 ➔ 초고속 전방 쇄도 ➔
 *    - 대상 전면 우상단->좌하단 3중 드래곤 클로 참격호 작렬 ➔
 *    - 백색 섬광(hitFlash) & 스타버스트 폭발 & 피격자 뒤로 넉백
 * 3. [2타: 광란의 2차 역방향 교차 참격 ('X' 폭쇄) (2nd Cross Dragon Slash)]:
 *    - 맹렬한 연속 쇄도 ➔ 좌상단->우하단 역방향 3중 클로 교차 ➔
 *    - 거대한 불타는 'X'자 드래곤 상흔 폭쇄 ➔ 피격자 반대편 넉백
 * 4. [3타: 피니시 대폭쇄 - 용의 파동 분쇄 & 지면 대격변 (Devastating Dragon Crush)]:
 *    - 시전자 상공 고공 도약 ➔ 상대 머리 위로 수직 급강하 강타 분쇄 ➔
 *    - 거대한 지면 크레이터 충격파 링 & 16방향 드래곤 방사 스파크 대폭발 ➔
 *    - 피격자 납작 스쿼시 & 체력 게이지 감소 본격 반영
 * 5. [피날레 복귀 & 잔여 화염 소산 (Cool Down & Recovery)]:
 *    - 시전자 탄성 착지 후 기본 위치 복귀 ➔ 잔여 드래곤 화염 불티 부유 소산 ➔
 *    - 부드러운 카메라 1.0x 글라이드 아웃 복귀
 */
export const outrageMove: BattleMoveAnimation = {
  num: 200,
  key: "outrage",
  nameKo: "역린",
  nameEn: "Outrage",
  type: "dragon",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.35,
    delayUntilStep: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawOutrageBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawOutrageEffect(targetCtx, frame, drawCtx);
  },
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
      hitFlash: false,
    };

    // ⚠️ 핵심 규칙: 시전자만 이동 (수비자는 {0, 0} 완전 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // ⚠️ 수비자(피격 대상) 전용 넉백 및 스쿼시 (시전자 좌표에 절대 영향 없음)
    const tSquash = (scaleX: number, scaleY: number, offX: number, offY: number) => ({
      pScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: isP ? { x: scaleX, y: scaleY } : undefined,
      ...(!isP ? { pOffset: { x: -offX, y: offY } } : {}),
      ...(isP ? { eOffset: { x: offX, y: offY } } : {}),
    });

    // 💥 화면 흔들림 헬퍼 (Screen Shake)
    const shake = (x: number, y: number) => ({
      cameraPan: { x: isP ? x : -x, y },
    });

    // 🔴 피격 대상 포켓몬 붉은 필터 페이드인 / 페이드아웃 (Target Red Tint Fade)
    const targetRed = (lvl: number) => ({
      targetRedTint: isHit && lvl > 0.01,
      eRedLevel: isHit && isP && lvl > 0.01 ? lvl : undefined,
      pRedLevel: isHit && !isP && lvl > 0.01 ? lvl : undefined,
    });

    // =========================================================================
    // 1. Miss (!isHit) 시퀀스
    // =========================================================================
    if (!isHit) {
      return [
        // 1. 1차 주황빛 그을림 태동 & 시전자 좌우 고속 부들거림
        {
          ...baseFrame,
          delay: 50,
          ...cOff(-6, 2),
          ...cScale(1.04, 0.96),
          showBehindEffect: true,
          showEffect: false,
          moveStep: 1,
          effectProgress: 0.15,
          ...shake(-1.5, 1.0),
          phaseId: "outrage-miss-tremble-1",
          phaseName: "1. 1차 분노 좌측 부들거림",
        },
        {
          ...baseFrame,
          delay: 50,
          ...cOff(-2, 1),
          ...cScale(1.05, 0.95),
          showBehindEffect: true,
          showEffect: false,
          moveStep: 1,
          effectProgress: 0.30,
          ...shake(1.5, -0.5),
          phaseId: "outrage-miss-tremble-2",
          phaseName: "2. 1차 분노 우측 부들거림",
        },
        // 2. 2차 주황빛 그을림 피크 & 고속 부들거림
        {
          ...baseFrame,
          delay: 50,
          ...cOff(-10, 3),
          ...cScale(1.10, 0.90),
          showBehindEffect: true,
          showEffect: false,
          moveStep: 1,
          effectProgress: 0.65,
          ...shake(-2.5, 1.5),
          phaseId: "outrage-miss-tremble-3",
          phaseName: "3. 2차 분노 좌측 격렬한 부들거림",
        },
        {
          ...baseFrame,
          delay: 55,
          ...cOff(-3, 2),
          ...cScale(1.12, 0.88),
          showBehindEffect: true,
          showEffect: false,
          moveStep: 1,
          effectProgress: 0.85,
          ...shake(3.0, -2.0),
          phaseId: "outrage-miss-tremble-4",
          phaseName: "4. 2차 분노 우측 격렬한 부들거림",
        },
        // 3. 맹렬한 전방 도약 돌진
        {
          ...baseFrame,
          delay: 75,
          ...cOff(26, -10),
          ...cScale(0.92, 1.10),
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.40,
          ...shake(0, 0),
          phaseId: "outrage-miss-lunge",
          phaseName: "3. 맹렬한 도약 돌진",
        },
        // 4. 허공을 가르는 참격 난무 (빗나감)
        {
          ...baseFrame,
          delay: 85,
          ...cOff(34, -8),
          ...cScale(1.08, 0.92),
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.90,
          phaseId: "outrage-miss-slash",
          phaseName: "4. 허공을 가르는 참격 (빗나감)",
        },
        // 5. 착지 및 분노 진정 복귀
        {
          ...baseFrame,
          delay: 90,
          ...cOff(0, 0),
          showEffect: false,
          moveStep: 5,
          effectProgress: 1.0,
          phaseId: "outrage-miss-recover",
          phaseName: "5. 착지 및 진정 복귀",
        },
      ];
    }

    // =========================================================================
    // 2. Hit (적중) 시퀀스 (3단 맹렬 콤보 + 피니시 대격변)
    // =========================================================================
    return [
      // =======================================================================
      // Phase 1: [배경 주황빛 2회 서서히 그을림 & 시전자 좌우 고속 부들거림 진동] (Step 1)
      // cameraZoom = 1.0 (중립 시점에서 좌우 고속 진동 및 배경 주황빛 조망)
      // =======================================================================
      // [1차 파동: 분노 축적 & 시전자 좌우 고속 부들거림 (Wave 1)]
      // #1. 좌측 떨림 시작
      {
        ...baseFrame,
        delay: 55,
        ...cOff(-6, 2),
        ...cScale(1.04, 0.96),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.05,
        ...shake(-1.0, 0.5),
        phaseId: "outrage-tremble-1",
        phaseName: "#1. 분노 태동 & 좌측 부들거림",
      },
      // #2. 우측 반동 떨림
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-2, 1),
        ...cScale(1.05, 0.95),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.10,
        ...shake(1.5, -0.5),
        phaseId: "outrage-tremble-2",
        phaseName: "#2. 우측 반동 부들거림",
      },
      // #3. 좌측 2차 떨림 (열기 상승)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-7, 2),
        ...cScale(1.06, 0.94),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.16,
        ...shake(-2.0, 1.0),
        phaseId: "outrage-tremble-3",
        phaseName: "#3. 좌측 2차 부들거림",
      },
      // #4. 우측 2차 떨림
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-1, 1),
        ...cScale(1.07, 0.93),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.22,
        ...shake(2.0, -1.0),
        phaseId: "outrage-tremble-4",
        phaseName: "#4. 우측 2차 부들거림",
      },
      // #5. 1차 최대 피크 떨림 (1차 화염 분출!)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(-9, 3),
        ...cScale(1.10, 0.90),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.28,
        ...shake(-3.0, 1.5),
        phaseId: "outrage-tremble-5",
        phaseName: "#5. 1차 화염 분출 피크 부들거림",
      },
      // #6. 우측 감쇠 떨림
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-3, 2),
        ...cScale(1.08, 0.92),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        ...shake(2.5, -1.0),
        phaseId: "outrage-tremble-6",
        phaseName: "#6. 우측 감쇠 부들거림",
      },
      // #7. 좌측 잔여 떨림
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-8, 2),
        ...cScale(1.06, 0.94),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.42,
        ...shake(-1.5, 0.5),
        phaseId: "outrage-tremble-7",
        phaseName: "#7. 좌측 잔여 부들거림",
      },
      // #8. 1차 펄스 수렴 떨림
      {
        ...baseFrame,
        delay: 55,
        ...cOff(-4, 1),
        ...cScale(1.05, 0.95),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.50,
        ...shake(1.0, -0.5),
        phaseId: "outrage-tremble-8",
        phaseName: "#8. 1차 수렴 부들거림",
      },

      // [2차 파동: 극대 분노 폭주 & 좌우 초고속 격렬한 부들거림 (Wave 2)]
      // #9. 2차 좌측 격렬한 떨림 재점화
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-8, 2),
        ...cScale(1.07, 0.93),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.56,
        ...shake(1.5, -0.5),
        phaseId: "outrage-tremble-9",
        phaseName: "#9. 2차 좌측 부들거림 재점화",
      },
      // #10. 2차 우측 고속 떨림
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-2, 2),
        ...cScale(1.09, 0.91),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.62,
        ...shake(-2.0, 1.0),
        phaseId: "outrage-tremble-10",
        phaseName: "#10. 2차 우측 고속 부들거림",
      },
      // #11. 2차 좌측 심화 떨림 (화염 확산)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-10, 3),
        ...cScale(1.11, 0.89),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.68,
        ...shake(2.5, -1.5),
        phaseId: "outrage-tremble-11",
        phaseName: "#11. 2차 좌측 심화 부들거림",
      },
      // #12. 2차 우측 고진폭 반동 떨림
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-3, 2),
        ...cScale(1.13, 0.87),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.74,
        ...shake(-3.0, 2.0),
        phaseId: "outrage-tremble-12",
        phaseName: "#12. 2차 우측 고진폭 부들거림",
      },
      // #13. 2차 최대 절정 폭쇄 피크 떨림 (전신 최대 진동!)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(-13, 4),
        ...cScale(1.16, 0.84),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.80,
        ...shake(4.0, -2.5),
        phaseId: "outrage-tremble-13",
        phaseName: "#13. 2차 최대 절정 전신 진동 피크",
      },
      // #14. 우측 강렬한 반동 떨림
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-4, 3),
        ...cScale(1.14, 0.86),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.85,
        ...shake(-3.5, 2.0),
        phaseId: "outrage-tremble-14",
        phaseName: "#14. 2차 우측 강렬한 반동 부들거림",
      },
      // #15. 좌측 감쇠 떨림
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-12, 3),
        ...cScale(1.12, 0.88),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.90,
        ...shake(2.5, -1.0),
        phaseId: "outrage-tremble-15",
        phaseName: "#15. 2차 좌측 감쇠 부들거림",
      },
      // #16. 우측 최종 미세 떨림
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-5, 2),
        ...cScale(1.10, 0.90),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.95,
        ...shake(-1.5, 0.5),
        phaseId: "outrage-tremble-16",
        phaseName: "#16. 2차 우측 최종 미세 부들거림",
      },
      // #17. 돌진 직전 분노 수렴 및 도약 태세 완료
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-8, 3),
        ...cScale(1.08, 0.92),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        effectProgress: 1.00,
        ...shake(0, 0),
        phaseId: "outrage-tremble-17",
        phaseName: "#17. 돌진 직전 분노 수렴 태세 완료",
      },

      // =======================================================================
      // Phase 2: [1타: 벼락같은 1차 사선 드래곤 클로 참격] (Step 2)
      // 카메라 1.35x 줌인 포커싱 & 상대방을 향해 초고속 쇄도
      // =======================================================================
      // #4. 초고속 돌진 쇄도: 시전자 전방 급습
      {
        ...baseFrame,
        delay: 50,
        ...cOff(32, -10),
        ...cScale(0.92, 1.12),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.35,
        ...shake(0, 0),
        ...targetRed(0.0),
        phaseId: "outrage-rush-1",
        phaseName: "#4. 초고속 돌진 쇄도",
      },
      // #5a. 1타 참격 진입: 드래곤 클로 불꽃 접촉 & 붉은 필터 페이드인 시작
      {
        ...baseFrame,
        delay: 55,
        ...cOff(36, -11),
        ...tSquash(1.10, 0.90, 8, -3),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.55,
        ...shake(-4, 3),
        ...targetRed(0.70),
        phaseId: "outrage-slash-1-cut",
        phaseName: "#5a. 1타: 드래곤 클로 참격 진입 (붉은 필터 인)",
      },
      // #5b. 1타 직격 피크: 우상단 ➔ 좌하단 3중 드래곤 클로 작렬 & 1차 타격 진동 & 최대 붉은 필터!
      {
        ...baseFrame,
        delay: 65,
        ...cOff(40, -13),
        ...tSquash(1.22, 0.78, 16, -6),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.75,
        ...shake(-7, 5), // 1차 참격 진동 (진폭 ~8.6px)
        ...targetRed(1.00),
        phaseId: "outrage-slash-1-hit",
        phaseName: "#5b. 1타: 1차 사선 드래곤 클로 직격 (1차 진동)",
      },
      // #6. 1타 관통 & 스파크 비산: 피격자 뒤로 밀림 & 붉은 필터 페이드아웃
      {
        ...baseFrame,
        delay: 70,
        ...cOff(34, -8),
        ...tSquash(1.06, 0.94, 18, -6),
        showEffect: true,
        moveStep: 2,
        effectProgress: 1.0,
        ...shake(4, -3),
        ...targetRed(0.35),
        phaseId: "outrage-slash-1-follow",
        phaseName: "#6. 1타 관통 & 스파크 비산 (붉은 필터 아웃)",
      },

      // =======================================================================
      // Phase 3: [2타: 광란의 2차 역방향 교차 참격 ('X' 폭쇄)] (Step 3)
      // =======================================================================
      // #7. 연속 회전 쇄도: 반대편 발톱 휘두름 준비 (정상 색상 복원)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(38, -8),
        ...cScale(1.10, 0.92),
        ...tSquash(0.98, 1.02, 8, -2),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.30,
        ...shake(0, 0),
        ...targetRed(0.0),
        phaseId: "outrage-slash-2-prep",
        phaseName: "#7. 2차 연속 회전 쇄도",
      },
      // #8a. 2타 역방향 교차 진입: 불꽃 교차 접촉 & 붉은 필터 페이드인
      {
        ...baseFrame,
        delay: 55,
        ...cOff(42, -7),
        ...tSquash(1.12, 0.88, -6, 3),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.55,
        ...shake(8, -6),
        ...targetRed(0.70),
        phaseId: "outrage-slash-2-cut",
        phaseName: "#8a. 2타: 역방향 참격 교차 진입 (붉은 필터 인)",
      },
      // #8b. 2타 'X' 폭쇄 피크: 좌상단 ➔ 우하단 클로 교차 & 불꽃 'X' 대폭쇄 & 2차 대진동(1차의 약 2배!) & 최대 붉은 필터!
      {
        ...baseFrame,
        delay: 65,
        ...cOff(46, -6),
        ...tSquash(1.24, 0.76, -14, 6),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.75,
        ...shake(14, -11), // 2차 교차 참격 대진동 (진폭 ~17.8px - 1차 대비 대폭 강화)
        ...targetRed(1.00),
        phaseId: "outrage-slash-2-hit",
        phaseName: "#8b. 2타: 역방향 교차 참격 'X' 폭쇄 (2차 대진동)",
      },
      // #9. 2타 교차 상흔 폭발 & 반동: 붉은 필터 페이드아웃
      {
        ...baseFrame,
        delay: 70,
        ...cOff(36, -8),
        ...tSquash(1.05, 0.95, -16, 7),
        showEffect: true,
        moveStep: 3,
        effectProgress: 1.0,
        ...shake(-9, 7),
        ...targetRed(0.35),
        phaseId: "outrage-slash-2-follow",
        phaseName: "#9. 2타 교차 상흔 폭발 & 반동 (붉은 필터 아웃)",
      },

      // =======================================================================
      // Phase 4: [3타: 피니시 대폭쇄 - 용의 파동 분쇄 & 지면 대격변] (Step 4)
      // =======================================================================
      // #10. 상공 고공 도약: 시전자가 용의 화염을 휘감고 고공 점프 (정상 색상 복원)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(26, -26),
        ...cScale(0.88, 1.20),
        ...tSquash(1.0, 1.0, 0, 0),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.20,
        ...shake(0, 0),
        ...targetRed(0.0),
        phaseId: "outrage-leap",
        phaseName: "#10. 상공 고공 도약",
      },
      // #11a. 피니시 급강하 강타 진입: 상대 머리 위 불꽃 수직 강타 & 붉은 필터 페이드인
      {
        ...baseFrame,
        delay: 55,
        ...cOff(44, -10),
        ...cScale(1.15, 0.85),
        ...tSquash(1.15, 0.85, 4, 4),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.45,
        ...shake(-8, 12),
        ...targetRed(0.75),
        phaseId: "outrage-finisher-cut",
        phaseName: "#11a. 3타: 피니시 급강하 강타 진입 (붉은 필터 인)",
      },
      // #11b. 피니시 대폭쇄 지면 대격변 피크: 지면 초토화 & 3차 초대형 대격변 진동(최대치!) & 체력 감소 반영!
      {
        ...baseFrame,
        delay: 85,
        ...cOff(48, -2),
        ...cScale(1.28, 0.72),
        ...tSquash(1.32, 0.68, 6, 8),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showBehindEffect: true,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.65,
        ...shake(20, 24), // 3차 피니시 지면 대격변 진동 (진폭 ~31.2px - 폭발적 최대치!)
        ...targetRed(1.00),
        phaseId: "outrage-finisher-impact",
        phaseName: "#11b. 3타: 피니시 대폭쇄 (지면 대격변 최대 진동)",
      },
      // #12. 충격파 링 확산 & 화염 비산: 여진 진동 & 붉은 필터 감쇠
      {
        ...baseFrame,
        delay: 85,
        ...cOff(42, -4),
        ...cScale(1.15, 0.88),
        ...tSquash(1.16, 0.86, 12, 4),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showBehindEffect: true,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.85,
        ...shake(-15, -14), // 대형 충격파 여진 (진폭 ~20.5px)
        ...targetRed(0.60),
        phaseId: "outrage-finisher-shockwave",
        phaseName: "#12. 충격파 링 확산 & 화염 비산 (여진 대진동)",
      },
      // #13. 파편 비산 & 피격자 감쇠: 잔여 진동 & 붉은 필터 잔향
      {
        ...baseFrame,
        delay: 80,
        ...cOff(28, -6),
        ...cScale(1.05, 0.96),
        ...tSquash(1.05, 0.95, 6, 2),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showBehindEffect: true,
        showEffect: true,
        moveStep: 4,
        effectProgress: 1.0,
        ...shake(8, 6), // 잔여 지면 진동 (진폭 10px)
        ...targetRed(0.20),
        phaseId: "outrage-finisher-debris",
        phaseName: "#13. 파편 비산 & 피격자 감쇠 (잔여 진동)",
      },

      // =======================================================================
      // Phase 5: [피날레: 잔여 드래곤 화염 소산 & 착지 복귀] (Step 5)
      // 카메라 1.0x 중립 뷰로 글라이드 아웃 복귀
      // =======================================================================
      // #14. 탄성 착지 리바운드 & 잔여 화염 부유 (정상 복원)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(12, -2),
        ...cScale(1.08, 0.94),
        ...tSquash(1.0, 1.0, 0, 0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.50,
        ...shake(0, 0),
        ...targetRed(0.0),
        phaseId: "outrage-rebound",
        phaseName: "#14. 탄성 착지 & 잔여 화염 부유",
      },
      // #15. 시전자 안정 정위치 복귀 & 화염 소산 완료
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...tSquash(1.0, 1.0, 0, 0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 5,
        effectProgress: 1.0,
        ...shake(0, 0),
        ...targetRed(0.0),
        phaseId: "outrage-recover",
        phaseName: "#15. 시전자 정위치 복귀 & 피날레",
      },
    ];
  },
};
