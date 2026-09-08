import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawHornDrillEffect } from "../../../renderers/moves/gen1/move029_032.js";

export const hornDrillMove: BattleMoveAnimation = {
  num: 32,
  key: "horn-drill",
  nameKo: "뿔드릴",
  nameEn: "Horn Drill",
  type: "normal",
  category: "physical",
  camera: { type: "none" },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const frames: BattleFrame[] = [
      // 1. 드릴 회전 시동 (1/5)
      {
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "drill-spin-1",
        phaseName: "1. 드릴 회전 시동",
      },
      // 2. 가속 회전 (2/5)
      {
        delay: 70,
        pOffset: isP ? { x: -4, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        phaseId: "drill-spin-2",
        phaseName: "2. 가속 회전 (나선 이동 1)",
      },
      // 3. 고속 회전 (3/5)
      {
        delay: 70,
        pOffset: isP ? { x: -8, y: 3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 8, y: -3 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        phaseId: "drill-spin-3",
        phaseName: "3. 고속 회전 (나선 이동 2)",
      },
      // 4. 초고속 회전 vortex (4/5)
      {
        delay: 70,
        pOffset: isP ? { x: -12, y: 5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 12, y: -5 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
        phaseId: "drill-spin-4",
        phaseName: "4. 초고속 회전 (나선 축소)",
      },
      // 5. 최대 RPM 오버클럭 직전 돌진 준비 (5/5)
      {
        delay: 70,
        pOffset: isP ? { x: -16, y: 7 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 16, y: -7 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 5,
        phaseId: "drill-spin-5",
        phaseName: "5. 최대 RPM 발사 자세 (바닥 재생성)",
      },
      // 6. 이 상태로 상대 포켓몬 뚫기 (초고속 드릴 관통 돌파!)
      {
        delay: 180,
        pOffset: isP ? { x: 280, y: -105 } : (isHit ? { x: -10, y: 5 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -280, y: 105 } : (isHit ? { x: 10, y: -5 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 6,
        phaseId: "drill-pierce-strike",
        phaseName: "6. 드릴 관통 돌파",
      },
    ];

    if (isHit) {
      // 7. [시네마틱 1단계] 검정 암전 상태에서 완전히 흰색인 상대 포켓몬 스프라이트 (검정 점 없음!)
      //    시전 포켓몬은 검정 배경 z축 아래로 완전 숨김
      frames.push({
        delay: 350,
        blackoutScreen: true,
        eWhite: isP,
        pWhite: !isP,
        hidePlayer: isP,  // 시전 포켓몬 검정 배경 뒤로 완전 숨김
        hideEnemy: !isP,  // 시전 포켓몬 검정 배경 뒤로 완전 숨김
        holeInTarget: false, // 아직 점 없음! 완전한 순백 실루엣
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        usePlayerFront: isP,
        useEnemyBack: !isP,
        hidePShadow: true,
        hideEShadow: true,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 7,
        phaseId: "drill-blackout-white-sprite",
        phaseName: "7. 암전 & 완전한 흰색 상대 실루엣 (시전자 숨김)",
      });

      // 8. [시네마틱 2단계] 그 다음 검정 점(관통 구멍)이 상대 가슴/상체에 나타남! (흰 테두리 없음!)
      frames.push({
        delay: 450,
        blackoutScreen: true,
        eWhite: isP,
        pWhite: !isP,
        hidePlayer: isP,  // 시전 포켓몬 검정 배경 뒤로 완전 숨김
        hideEnemy: !isP,  // 시전 포켓몬 검정 배경 뒤로 완전 숨김
        holeInTarget: true, // 검정 점 출현!
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        usePlayerFront: isP,
        useEnemyBack: !isP,
        hidePShadow: true,
        hideEShadow: true,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 8,
        phaseId: "drill-blackout-hole",
        phaseName: "8. 검정 관통 점 출현 (테두리 없음)",
      });

      // 9. 검정색 화면 페이드아웃 (전면 유지!)
      frames.push({
        delay: 200,
        blackFadeAlpha: 0.65,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        usePlayerFront: isP,
        useEnemyBack: !isP,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 9,
        phaseId: "drill-fadeout",
        phaseName: "9. 검정 화면 페이드아웃 (전면 유지)",
      });

      // 10. 배틀 화면 복귀 완료 (애니메이션 종료까지 내 포켓몬은 전면 유지!)
      frames.push({
        delay: 150,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        usePlayerFront: isP,
        useEnemyBack: !isP,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 10,
        phaseId: "drill-finish",
        phaseName: "10. 마무리 (전면 유지)",
      });
    } else {
      // 빗나갔을 때 복귀
      frames.push({
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 11,
      });
    }

    return frames;
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawHornDrillEffect(targetCtx, frame, drawCtx);
  }
};
