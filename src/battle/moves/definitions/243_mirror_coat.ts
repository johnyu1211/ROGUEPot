// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawMirrorCoatBehindEffect,
  drawMirrorCoatEffect,
} from "../../../renderers/moves/gen1/move241_244.js";

/**
 * 243-B: 미러코트 (베리어 생성 1턴 충전 전용 정의)
 *
 * [1단계 연출]:
 * - 시전 포켓몬 정중앙에 분홍빛 베리어 생성(112번 배리어 100% 참조)
 * - 상단 십자별 ➔ 가로선 ➔ 세로선 ➔ 하단 결합 ➔ 분홍빛 채움 & 사선 반사
 * - 베리어 완성 후 꼭짓점 하늘푸른색 십자별 반짝임 상태 유지
 */
export const mirrorCoatBarrierMove: BattleMoveAnimation = {
  num: 243,
  key: "mirror-coat-charge",
  nameKo: "미러코트 (베리어)",
  nameEn: "Mirror Coat (Barrier)",
  type: "psychic",
  category: "status",
  camera: {
    type: "none",
    zoom: 1.18,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawMirrorCoatBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMirrorCoatEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.18,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];

    // 1-1. 상단 하늘푸른색 십자별 번쩍임 (기술배리어 Step 1 참조)
    frames.push({
      ...baseFrame,
      delay: 85,
      ...cOff(1, 0),
      moveStep: 1,
      phaseId: "mirror-coat-star",
      phaseName: "#1. 상단 하늘푸른색 십자별 번쩍임",
      effectProgress: 0.15,
      showEffect: true,
      showBehindEffect: false,
    });

    // 1-2. 가로선 좌우 확장 (양 끝 하늘푸른색 십자별 팁)
    frames.push({
      ...baseFrame,
      delay: 85,
      ...cOff(0, 0),
      moveStep: 1,
      phaseId: "mirror-coat-horiz",
      phaseName: "#2. 가로선 좌우 확장",
      effectProgress: 0.35,
      showEffect: true,
      showBehindEffect: false,
    });

    // 1-3. 좌우 세로선 수직 하강
    frames.push({
      ...baseFrame,
      delay: 85,
      ...cOff(0, 0),
      moveStep: 1,
      phaseId: "mirror-coat-vert",
      phaseName: "#3. 좌우 세로선 수직 하강",
      effectProgress: 0.55,
      showEffect: true,
      showBehindEffect: false,
    });

    // 1-4. 하단선 수렴 & 사각형 완성 결합 번쩍
    frames.push({
      ...baseFrame,
      delay: 90,
      ...cOff(0, 0),
      moveStep: 1,
      phaseId: "mirror-coat-close",
      phaseName: "#4. 하단선 수렴 & 사각형 완성 결합",
      effectProgress: 0.75,
      showEffect: true,
      showBehindEffect: false,
    });

    // 1-5. 사각형 중간 분홍빛 채움 + 사선 반사 하이라이트 번쩍 스위프
    frames.push({
      ...baseFrame,
      delay: 95,
      ...cOff(0, 0),
      moveStep: 1,
      phaseId: "mirror-coat-fill",
      phaseName: "#5. 분홍빛 채움 & 사선 반사 번쩍",
      effectProgress: 0.90,
      showEffect: true,
      showBehindEffect: false,
    });

    // 1-6. 분홍빛 베리어 완성 & 꼭짓점 하늘푸른색 십자별 순회 반짝임 유지 (3프레임 안정 유지)
    for (let i = 0; i < 3; i++) {
      frames.push({
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        moveStep: 1,
        phaseId: `mirror-coat-hold-${i + 1}`,
        phaseName: `#6. 분홍빛 베리어 완성 & 유지 (${i + 1}/3)`,
        effectProgress: 1.0,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};

/**
 * 243: 미러코트 (Mirror Coat / ミラーコート) - 메인 기술 정의
 *
 * 위력: — / 명중: 100 / PP: 20 / 우선도: -5 / 비접촉
 * 설명: 상대에게 받은 특수공격의 데미지를 2배로 만들어 그 상대에게 돌려준다.
 *
 * [2단계 연출: 베리어 깨짐 & 반사 발사]:
 * 1. 베리어 균열 ➔ 와장창 깨짐 (Shatter)
 * 2. 깨진 자리에서 파편인 하늘푸른색 십자별들이 대상을 향해 호를 그리며 쇄도
 * 3. 대상 포켓몬 직격 크리스탈 십자별 타격 & 넉백 & 2배 반사 체력 감소
 * 4. 정위치 복귀
 */
export const mirrorCoatMove: BattleMoveAnimation = {
  num: 243,
  key: "mirror-coat",
  nameKo: "미러코트",
  nameEn: "Mirror Coat",
  type: "psychic",
  category: "special",
  camera: {
    type: "none",
    zoom: 1.18,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawMirrorCoatBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMirrorCoatEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    // [1단계: 베리어 생성 충전 모드 분기]
    const isCharging = Boolean(
      (a as any).isTurn1Launch ||
      (a as any).chargingMove === "mirror-coat" ||
      (ctx as any).flyPhase === "1" ||
      a.log?.includes("둘렀다") ||
      a.log?.includes("몸을 둘렀다")
    );

    if (isCharging) {
      return mirrorCoatBarrierMove.buildFrames(ctx);
    }

    // [2단계: 베리어 깨짐 & 반사 발사 & 타격 모드]
    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.18,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const tKnock = (dist = 0) => ({
      pOffset: !isP ? { x: -dist, y: dist * 0.35 } : { x: 0, y: 0 },
      eOffset: isP ? { x: dist, y: -dist * 0.35 } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];

    // =========================================================================
    // [Step 2: 베리어 균열 ➔ 와장창 깨짐 (Shatter)]
    // =========================================================================

    // 2-1. 베리어 전면에 충격 균열 (Crack) 쩍 갈라짐
    frames.push({
      ...baseFrame,
      delay: 75,
      ...cOff(0, 0),
      moveStep: 2,
      phaseId: "mirror-coat-crack",
      phaseName: "#7. 베리어 충격 균열",
      effectProgress: 0.20,
      showEffect: true,
      showBehindEffect: false,
    });

    // 2-2. 쨍그랑! 미러코트 베리어가 와장창 깨지면서 파편 비산
    frames.push({
      ...baseFrame,
      delay: 85,
      ...cOff(0, 0),
      moveStep: 2,
      phaseId: "mirror-coat-shatter",
      phaseName: "#8. 베리어 와장창 깨짐 (파편 비산)",
      effectProgress: 0.65,
      showEffect: true,
      showBehindEffect: false,
    });

    // =========================================================================
    // [Step 3: 깨진 자리에서 파편인 하늘푸른색 십자별들이 대상을 향해 날아감!]
    // =========================================================================

    // 3-1. 깨진 중심에서 파편 십자별들 발사 시작 (1/3)
    frames.push({
      ...baseFrame,
      delay: 65,
      ...cOff(0, 0),
      moveStep: 3,
      phaseId: "mirror-coat-sparkles-launch",
      phaseName: "#9. 파편 십자별 사출 (1/3)",
      effectProgress: 0.30,
      showEffect: true,
      showBehindEffect: false,
    });

    // 3-2. 하늘푸른색 십자별들이 빛의 궤적을 그리며 쇄도 (2/3)
    frames.push({
      ...baseFrame,
      delay: 65,
      ...cOff(0, 0),
      moveStep: 3,
      phaseId: "mirror-coat-sparkles-fly",
      phaseName: "#10. 파편 십자별 쇄도 (2/3)",
      effectProgress: 0.65,
      showEffect: true,
      showBehindEffect: false,
    });

    // 3-3. 하늘푸른색 십자별들이 대상 포켓몬 면전까지 도달 (3/3)
    frames.push({
      ...baseFrame,
      delay: 65,
      ...cOff(0, 0),
      moveStep: 3,
      phaseId: "mirror-coat-sparkles-reach",
      phaseName: "#11. 대상 포켓몬 도달 (3/3)",
      effectProgress: 0.95,
      showEffect: true,
      showBehindEffect: false,
    });

    // =========================================================================
    // [Step 4: 대상 포켓몬 직격 타격 & 체력 감소]
    // =========================================================================

    // 4-1. 상대 직격! 영롱한 하늘푸른색 십자별 타격 & 상대 넉백 & 체력 2배 반사 감소
    frames.push({
      ...baseFrame,
      delay: 90,
      ...tKnock(14),
      hitFlash: isHit,
      enemyHp: isHit ? (isP ? a.enemyHpAfter : enemyHp) : enemyHp,
      playerHp: isHit ? (!isP ? a.playerHpAfter : playerHp) : playerHp,
      moveStep: 4,
      phaseId: "mirror-coat-counter-hit",
      phaseName: "#12. 반사 타격 직격 & 피격",
      effectProgress: 0.30,
      hitProgress: 0.30,
      showEffect: isHit,
      showBehindEffect: false,
    });

    // 4-2. 하늘푸른색 십자별 흩날림 & 상대방 최대 넉백
    frames.push({
      ...baseFrame,
      delay: 90,
      ...tKnock(20),
      enemyHp: isHit ? (isP ? a.enemyHpAfter : enemyHp) : enemyHp,
      playerHp: isHit ? (!isP ? a.playerHpAfter : playerHp) : playerHp,
      moveStep: 4,
      phaseId: "mirror-coat-counter-burst",
      phaseName: "#13. 크리스탈 십자별 만개",
      effectProgress: 0.70,
      hitProgress: 0.70,
      showEffect: isHit,
      showBehindEffect: false,
    });

    // 4-3. 타격 페이드아웃 및 상대방 넉백 감쇠
    frames.push({
      ...baseFrame,
      delay: 80,
      ...tKnock(6),
      enemyHp: isHit ? (isP ? a.enemyHpAfter : enemyHp) : enemyHp,
      playerHp: isHit ? (!isP ? a.playerHpAfter : playerHp) : playerHp,
      moveStep: 4,
      phaseId: "mirror-coat-counter-fade",
      phaseName: "#14. 타격 페이드아웃",
      effectProgress: 1.0,
      hitProgress: 1.0,
      showEffect: isHit,
      showBehindEffect: false,
    });

    // =========================================================================
    // [Step 5: 정위치 복귀 & 마무리]
    // =========================================================================

    frames.push({
      ...baseFrame,
      delay: 80,
      ...tKnock(0),
      ...cOff(0, 0),
      enemyHp: isHit ? (isP ? a.enemyHpAfter : enemyHp) : enemyHp,
      playerHp: isHit ? (!isP ? a.playerHpAfter : playerHp) : playerHp,
      moveStep: 5,
      phaseId: "mirror-coat-settle-1",
      phaseName: "#15. 정위치 복귀",
      effectProgress: 0.50,
      showEffect: false,
      showBehindEffect: false,
    });

    frames.push({
      ...baseFrame,
      delay: 80,
      ...tKnock(0),
      ...cOff(0, 0),
      enemyHp: isHit ? (isP ? a.enemyHpAfter : enemyHp) : enemyHp,
      playerHp: isHit ? (!isP ? a.playerHpAfter : playerHp) : playerHp,
      moveStep: 5,
      phaseId: "mirror-coat-settle-2",
      phaseName: "#16. 완전 복귀",
      effectProgress: 1.0,
      showEffect: false,
      showBehindEffect: false,
    });

    return frames;
  },
};
