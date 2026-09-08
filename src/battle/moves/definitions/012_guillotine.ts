import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawGuillotineEffect } from "../../../renderers/moves/gen1/move009_012.js";

export const guillotineMove: BattleMoveAnimation = {
  num: 12,
  key: "guillotine",
  nameKo: "길로틴",
  nameEn: "Guillotine",
  type: "normal",
  category: "physical",
  camera: { type: "none" },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    const isKO = Boolean(isHit);

    const frames: BattleFrame[] = [
      // 1. 첫 번째 가위날 진입 (-45도) - 공격자 전방 돌진
      {
        delay: 140,
        pOffset: isP ? { x: 18, y: -8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -18, y: 8 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "guillotine-blade-1",
        phaseName: "1. 가위날 1단계",
      },
      // 2. 두 번째 가위날 진입 (+45도) - 첫 번째 가위날과 교차하며 정상 공격 자세 유지
      {
        delay: 140,
        pOffset: isP ? { x: 26, y: -10 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -26, y: 10 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        phaseId: "guillotine-blade-2",
        phaseName: "2. 가위날 2단계 (자연스러운 X 형성)",
      },
      // 3. 가위날이 교차하며 붉은 X자 절단 작렬! - 정상 전방 공격 자세로 타격
      {
        delay: 240,
        pOffset: isP ? { x: 26, y: -10 } : { x: -14, y: 7 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -26, y: 10 },
        showEffect: true,
        hitFlash: true,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        phaseId: "guillotine-x-cut",
        phaseName: "3. 붉은 X자 절단 작렬",
      },
    ];

    // [핵심 연출] 명중 시: X자 나온 후 전체 검정, 적 포켓몬 스프라이트만 흰색으로 표시!
    // 1) 암전 1단계: 암전 속에서 순백색 적 실루엣 먼저 출현 (250ms, 검은 X 없음!)
    // 2) 암전 2단계: 다음 프레임에 검은 X가 나타나 순백색 실루엣을 절단 관통 (650ms, 스프라이트 뒤집힘)
    // 3) 암전 해제: 암전과 함께 검은 X는 완전히 소멸 & 위치 이동(무빙) 전혀 없이 정지!
    if (isHit) {
      frames.push(
        {
          delay: 250,
          blackoutScreen: true,
          eWhite: isP,      // 플레이어 공격 시: 적 포켓몬만 순백색 실루엣
          pWhite: !isP,     // 적 공격 시: 내 포켓몬만 순백색 실루엣
          hidePlayer: isP,  // 공격자 숨김
          hideEnemy: !isP,  // 공격자 숨김
          hidePShadow: true,
          hideEShadow: true,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          usePlayerFront: isP && isKO,
          useEnemyBack: !isP && isKO,
          showEffect: false, // [유저 요구사항] 암전 후 흰색 적 스프라이트 먼저 보임 (검정 X 없음!)
          moveStep: 4,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx,
          moveEffect: a,
          phaseId: "guillotine-ohko-appear",
          phaseName: "4. 암전 순백 실루엣 출현",
        },
        {
          delay: 650,
          blackoutScreen: true,
          eWhite: isP,      // 순백색 실루엣 유지
          pWhite: !isP,
          hidePlayer: isP,
          hideEnemy: !isP,
          hidePShadow: true,
          hideEShadow: true,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          usePlayerFront: isP && isKO,
          useEnemyBack: !isP && isKO,
          showEffect: true, // [유저 요구사항] 다음 프레임에 검정 X 작렬!
          moveStep: 5,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx,
          moveEffect: a,
          phaseId: "guillotine-ohko-cut",
          phaseName: "5. 암전 검정 X 절단선 관통 (스프라이트 뒤집힘)",
        }
      );
    }

    // 이후 애니메이션 진행 (암전이 걷힌 후에는 움직임 전혀 없이 원위치에서 승리 포즈 정지 유지)
    frames.push({
      delay: 350,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      usePlayerFront: isP && isKO,
      useEnemyBack: !isP && isKO,
      showEffect: false, // [유저 요구사항] 암전과 함께 검정 X는 완전히 사라짐!
      hitFlash: false,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      textLineIdx,
      moveEffect: a,
      moveStep: 6,
      phaseId: "guillotine-pose",
      phaseName: "6. 암전 해제 & 승리 포즈 완전 정지 (움직임 없음)",
    });

    return frames;
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (drawCtx.targetPos && (frame.showEffect || (frame.moveStep && frame.moveStep >= 1))) {
      drawGuillotineEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 3, Boolean(frame.blackoutScreen));
    }
  }
};
