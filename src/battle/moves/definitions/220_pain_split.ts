// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawPainSplitEffect } from "../../../renderers/moves/gen1/move217_220.js";

/**
 * 💔 220: 아픔나누기 (Pain Split / いたみわけ) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 20 / 접촉 판정: X
 * 설명: 자신과 상대의 체력을 합쳐서 절반씩 나눈다.
 *
 * [유저 지정 연출 시퀀스]:
 * 1. 서로에게 타격 이펙트 (타격이펙트는 이미지 참조)
 * 2. 5번 (5연속 타격)
 * 3. 타격이미지의 외각 타격은 원래 주황색이었는데 > 주황색 > 반투명갈색화 일어남 > 그 후 페이드아웃
 *    - 외각 타격: 선명한 주황색 ➔ 반투명 갈색화 ➔ 부드러운 페이드아웃
 *    - 내부 링: 순백 12각 톱니 링 (White Toothed Cog Ring)
 *    - 내부 코어: 칠흑 코어 원 + 붉은색 참격 호 (Red Curved Slash)
 * 4. 카메라: wide 중립 뷰 (camera: { type: "none" })로 양측 포켓몬 모두 한 화면에 선명하게 포착
 * 5. 타격 시 양 포켓몬 동시 피격 전율 넉백 및 5타 후 HP 균등 재분배
 */
export const painSplitMove: BattleMoveAnimation = {
  num: 220,
  key: "pain-split",
  nameKo: "아픔나누기",
  nameEn: "Pain Split",
  type: "normal",
  category: "status",
  camera: { type: "none" },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawPainSplitEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      showEffect: true,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 5연속 타격의 상대적 좌표 오프셋 (지시사항: 서로에게 5번 타격)
    // 1타: 좌상단, 2타: 우하단, 3타: 좌하단, 4타: 우상단, 5타: 정중앙 결정타 피니시
    const HIT_OFFSETS = [
      { dx: -7, dy: -6 },
      { dx:  8, dy:  6 },
      { dx: -8, dy:  4 },
      { dx:  7, dy: -5 },
      { dx:  0, dy:  0 },
    ];

    return [
      // ----------------------------------------------------------------------
      // [Hit 1]: 1타 직격
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 70,
        moveStep: 1,
        pOffset: { x: -3, y: 1 },
        eOffset: { x: 3, y: -1 },
        activeHits: [
          { hitIdx: 1, dx: HIT_OFFSETS[0].dx, dy: HIT_OFFSETS[0].dy, progress: 0.15 },
        ],
        phaseId: "pain-split-hit1-orange",
        phaseName: "1. 1타: 주황색 타격 직격 (상호 피격)",
      },
      {
        ...baseFrame,
        delay: 70,
        moveStep: 1,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        activeHits: [
          { hitIdx: 1, dx: HIT_OFFSETS[0].dx, dy: HIT_OFFSETS[0].dy, progress: 0.55 },
        ],
        phaseId: "pain-split-hit1-brown",
        phaseName: "2. 1타: 반투명 갈색화 & 확장",
      },

      // ----------------------------------------------------------------------
      // [Hit 2]: 2타 직격 & 1타 페이드아웃
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 70,
        moveStep: 2,
        pOffset: { x: 3, y: 2 },
        eOffset: { x: -3, y: -2 },
        activeHits: [
          { hitIdx: 1, dx: HIT_OFFSETS[0].dx, dy: HIT_OFFSETS[0].dy, progress: 0.90 },
          { hitIdx: 2, dx: HIT_OFFSETS[1].dx, dy: HIT_OFFSETS[1].dy, progress: 0.15 },
        ],
        phaseId: "pain-split-hit2-orange",
        phaseName: "3. 2타: 주황색 타격 직격 & 1타 페이드아웃",
      },
      {
        ...baseFrame,
        delay: 70,
        moveStep: 2,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        activeHits: [
          { hitIdx: 2, dx: HIT_OFFSETS[1].dx, dy: HIT_OFFSETS[1].dy, progress: 0.55 },
        ],
        phaseId: "pain-split-hit2-brown",
        phaseName: "4. 2타: 반투명 갈색화 & 확장",
      },

      // ----------------------------------------------------------------------
      // [Hit 3]: 3타 직격 & 2타 페이드아웃
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 70,
        moveStep: 3,
        pOffset: { x: -4, y: -1 },
        eOffset: { x: 4, y: 1 },
        activeHits: [
          { hitIdx: 2, dx: HIT_OFFSETS[1].dx, dy: HIT_OFFSETS[1].dy, progress: 0.90 },
          { hitIdx: 3, dx: HIT_OFFSETS[2].dx, dy: HIT_OFFSETS[2].dy, progress: 0.15 },
        ],
        phaseId: "pain-split-hit3-orange",
        phaseName: "5. 3타: 주황색 타격 직격 & 2타 페이드아웃",
      },
      {
        ...baseFrame,
        delay: 70,
        moveStep: 3,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        activeHits: [
          { hitIdx: 3, dx: HIT_OFFSETS[2].dx, dy: HIT_OFFSETS[2].dy, progress: 0.55 },
        ],
        phaseId: "pain-split-hit3-brown",
        phaseName: "6. 3타: 반투명 갈색화 & 확장",
      },

      // ----------------------------------------------------------------------
      // [Hit 4]: 4타 직격 & 3타 페이드아웃
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 70,
        moveStep: 4,
        pOffset: { x: 3, y: -2 },
        eOffset: { x: -3, y: 2 },
        activeHits: [
          { hitIdx: 3, dx: HIT_OFFSETS[2].dx, dy: HIT_OFFSETS[2].dy, progress: 0.90 },
          { hitIdx: 4, dx: HIT_OFFSETS[3].dx, dy: HIT_OFFSETS[3].dy, progress: 0.15 },
        ],
        phaseId: "pain-split-hit4-orange",
        phaseName: "7. 4타: 주황색 타격 직격 & 3타 페이드아웃",
      },
      {
        ...baseFrame,
        delay: 70,
        moveStep: 4,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        activeHits: [
          { hitIdx: 4, dx: HIT_OFFSETS[3].dx, dy: HIT_OFFSETS[3].dy, progress: 0.55 },
        ],
        phaseId: "pain-split-hit4-brown",
        phaseName: "8. 4타: 반투명 갈색화 & 확장",
      },

      // ----------------------------------------------------------------------
      // [Hit 5]: 5타 피니시 정중앙 직격 (Climax Hit) & 4타 페이드아웃
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 75,
        moveStep: 5,
        pOffset: { x: -5, y: 2 },
        eOffset: { x: 5, y: -2 },
        activeHits: [
          { hitIdx: 4, dx: HIT_OFFSETS[3].dx, dy: HIT_OFFSETS[3].dy, progress: 0.90 },
          { hitIdx: 5, dx: HIT_OFFSETS[4].dx, dy: HIT_OFFSETS[4].dy, progress: 0.15, isClimax: true },
        ],
        phaseId: "pain-split-hit5-orange",
        phaseName: "9. 5타: 중앙 피니시 직격 (주황색 섬광)",
      },
      {
        ...baseFrame,
        delay: 75,
        moveStep: 5,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        activeHits: [
          { hitIdx: 5, dx: HIT_OFFSETS[4].dx, dy: HIT_OFFSETS[4].dy, progress: 0.55, isClimax: true },
        ],
        phaseId: "pain-split-hit5-brown",
        phaseName: "10. 5타: 반투명 갈색화",
      },
      {
        ...baseFrame,
        delay: 75,
        moveStep: 5,
        playerHp: a.playerHpAfter ?? playerHp,
        enemyHp: a.enemyHpAfter ?? enemyHp,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        activeHits: [
          { hitIdx: 5, dx: HIT_OFFSETS[4].dx, dy: HIT_OFFSETS[4].dy, progress: 0.85, isClimax: true },
        ],
        phaseId: "pain-split-hit5-fadeout",
        phaseName: "11. 5타: 페이드아웃 & HP 균등 분배",
      },
      {
        ...baseFrame,
        delay: 80,
        moveStep: 5,
        playerHp: a.playerHpAfter ?? playerHp,
        enemyHp: a.enemyHpAfter ?? enemyHp,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        activeHits: [
          { hitIdx: 5, dx: HIT_OFFSETS[4].dx, dy: HIT_OFFSETS[4].dy, progress: 0.98, isClimax: true },
        ],
        phaseId: "pain-split-dissipate",
        phaseName: "12. 잔향 소산",
      },
      {
        ...baseFrame,
        delay: 90,
        moveStep: 5,
        playerHp: a.playerHpAfter ?? playerHp,
        enemyHp: a.enemyHpAfter ?? enemyHp,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        activeHits: [],
        phaseId: "pain-split-settle",
        phaseName: "13. 안정 복귀",
      },
    ];
  },
};
