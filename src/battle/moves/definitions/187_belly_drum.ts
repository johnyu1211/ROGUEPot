// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawBellyDrumEffect } from "../../../renderers/moves/gen1/move185_188.js";

/**
 * 187: 배북 (Belly Drum) - 노말 타입 변화기
 *
 * 위력: — / 명중: — / PP: 10 / 카테고리: 변화기
 * 설명: 최대 HP의 50%를 깎고 자신의 공격을 최대 랭크(+6)까지 올린다.
 *
 * [유저 지시 엄수]:
 * 1. 시전 포켓몬에게 손바닥이 왼쪽 -> 오른쪽 -> 왼쪽 -> 오른쪽 나타남 (태권당수 손바닥 사용)
 * 2. 시전포켓몬 스프라이트가 쿵쿵쿵쿵 거리며 격렬하게 진동/바운스
 * 3. 난동부리기(Thrash) 할 때 나오던 효과들(8각 골든 코믹 스타버스트, 4각 다이아몬드 별빛)이 아래에서 위로 치솟아오름
 */
export const bellyDrumMove: BattleMoveAnimation = {
  num: 187,
  key: "belly-drum",
  nameKo: "배북",
  nameEn: "Belly Drum",
  type: "normal",
  category: "status",
  customStatParticles: true,
  camera: {
    type: "self",
    zoom: 1.30,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawBellyDrumEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.30,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
      showEffect: true,
    };

    // 시전자 전용 오프셋 (수비자는 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 탄성 스케일
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    return [
      // 1. 배북 자세 잡기 준비 (80ms)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 2),
        ...cScale(1.05, 0.95),
        moveStep: 1,
        risingProgress: 0.0,
        handAlpha: 0,
        phaseId: "belly-drum-prep",
        phaseName: "1. 배북 자세 준비",
      },

      // 2. 1타: 왼손 배북 타격! (쿵!) (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-3, 5),
        ...cScale(1.10, 0.90),
        moveStep: 2,
        drumBeat: 1,
        handSide: "left",
        handAlpha: 1.0,
        impactBurst: true,
        ringProgress: 0.25,
        risingProgress: 0.12,
        phaseId: "belly-drum-hit1",
        phaseName: "2. 1타 - 왼손 배북 (쿵!)",
      },

      // 3. 1타 반동 및 별빛 상승 시작 (75ms)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(1, -2),
        ...cScale(0.98, 1.02),
        moveStep: 2,
        drumBeat: 1,
        handSide: "left",
        handAlpha: 0.35,
        impactBurst: false,
        ringProgress: 0.80,
        risingProgress: 0.22,
        phaseId: "belly-drum-rebound1",
        phaseName: "3. 1타 - 왼손 반동 & 효과 상승",
      },

      // 4. 2타: 오른손 배북 타격! (쿵!) (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(3, 5),
        ...cScale(1.10, 0.90),
        moveStep: 3,
        drumBeat: 2,
        handSide: "right",
        handAlpha: 1.0,
        impactBurst: true,
        ringProgress: 0.25,
        risingProgress: 0.35,
        phaseId: "belly-drum-hit2",
        phaseName: "4. 2타 - 오른손 배북 (쿵!)",
      },

      // 5. 2타 반동 및 별빛 지속 상승 (75ms)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-1, -2),
        ...cScale(0.98, 1.02),
        moveStep: 3,
        drumBeat: 2,
        handSide: "right",
        handAlpha: 0.35,
        impactBurst: false,
        ringProgress: 0.80,
        risingProgress: 0.45,
        phaseId: "belly-drum-rebound2",
        phaseName: "5. 2타 - 오른손 반동 & 효과 상승",
      },

      // 6. 3타: 왼손 배북 타격! (쿵!) (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-4, 6),
        ...cScale(1.12, 0.88),
        moveStep: 4,
        drumBeat: 3,
        handSide: "left",
        handAlpha: 1.0,
        impactBurst: true,
        ringProgress: 0.25,
        risingProgress: 0.58,
        phaseId: "belly-drum-hit3",
        phaseName: "6. 3타 - 왼손 배북 (쿵!)",
      },

      // 7. 3타 반동 및 효과 상승 가속 (75ms)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(1, -3),
        ...cScale(0.97, 1.03),
        moveStep: 4,
        drumBeat: 3,
        handSide: "left",
        handAlpha: 0.35,
        impactBurst: false,
        ringProgress: 0.80,
        risingProgress: 0.68,
        phaseId: "belly-drum-rebound3",
        phaseName: "7. 3타 - 왼손 반동 & 효과 상승",
      },

      // 8. 4타: 오른손 배북 피니시 타격! (쿵!!) & HP 50% 반감 (110ms)
      {
        ...baseFrame,
        delay: 110,
        ...cOff(4, 7),
        ...cScale(1.15, 0.85),
        moveStep: 5,
        drumBeat: 4,
        handSide: "right",
        handAlpha: 1.0,
        impactBurst: true,
        ringProgress: 0.25,
        hitFlash: true,
        playerHp: isP ? (a.playerHpAfter ?? playerHp) : playerHp,
        enemyHp: !isP ? (a.enemyHpAfter ?? enemyHp) : enemyHp,
        risingProgress: 0.80,
        phaseId: "belly-drum-hit4",
        phaseName: "8. 4타 - 오른손 피니시 배북 (쿵!!) & HP 반감",
      },

      // 9. 4타 대반동 및 에너지 대분출 (80ms)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-1, -4),
        ...cScale(0.94, 1.06),
        moveStep: 5,
        drumBeat: 4,
        handSide: "right",
        handAlpha: 0.25,
        impactBurst: false,
        ringProgress: 0.80,
        playerHp: isP ? (a.playerHpAfter ?? playerHp) : playerHp,
        enemyHp: !isP ? (a.enemyHpAfter ?? enemyHp) : enemyHp,
        risingProgress: 0.88,
        phaseId: "belly-drum-rebound4",
        phaseName: "9. 4타 - 대반동 & 분출 시작",
      },

      // 10. 절정: 황금빛 난동 스타버스트 상공 대승천 (110ms)
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, -3),
        ...cScale(1.06, 1.04),
        moveStep: 6,
        drumBeat: 5,
        handSide: "none",
        handAlpha: 0,
        playerHp: isP ? (a.playerHpAfter ?? playerHp) : playerHp,
        enemyHp: !isP ? (a.enemyHpAfter ?? enemyHp) : enemyHp,
        risingProgress: 0.96,
        phaseId: "belly-drum-climax1",
        phaseName: "10. 배북 절정 - 황금빛 난동 효과 상공 승천",
      },

      // 11. 공격력 최대치 달성 (+6) (110ms)
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, -2),
        ...cScale(1.04, 1.02),
        moveStep: 6,
        drumBeat: 5,
        handSide: "none",
        handAlpha: 0,
        playerHp: isP ? (a.playerHpAfter ?? playerHp) : playerHp,
        enemyHp: !isP ? (a.enemyHpAfter ?? enemyHp) : enemyHp,
        risingProgress: 1.02,
        phaseId: "belly-drum-climax2",
        phaseName: "11. 공격력 최대치 (+6) 도달",
      },

      // 12. 안정화 및 복귀 완료 (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        moveStep: 7,
        drumBeat: 0,
        handSide: "none",
        handAlpha: 0,
        playerHp: isP ? (a.playerHpAfter ?? playerHp) : playerHp,
        enemyHp: !isP ? (a.enemyHpAfter ?? enemyHp) : enemyHp,
        risingProgress: 1.08,
        showEffect: false,
        phaseId: "belly-drum-settle",
        phaseName: "12. 안정화 및 복귀 완료",
      },
    ];
  },
};
