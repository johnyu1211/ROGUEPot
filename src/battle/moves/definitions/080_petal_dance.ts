// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawPetalDanceEffect } from "../../../renderers/moves/gen1/move077_080.js";

/**
 * 080: 꽃잎댄스 (Petal Dance) - 풀타입 특수 공격
 *
 * 연출:
 * - 시전자만 후면 상태 그대로 와이드한 반경으로 맹렬하게 2회전 댄스 (수비자는 완전 정지)
 * - 회전에 맞춰 발밑에서부터 꽃잎들이 거대한 나선 소용돌이로 솟구쳐 오름
 * - 꽃잎 태풍을 전신에 휘감은 채 전방으로 시원하게 대폭 도약 돌진 (72px)!
 * - 모아진 꽃잎들이 상대를 향해 고속으로 쇄도
 * - 상대 몸체를 나선으로 감싸며 2연속 회오리 난타
 * - 사방으로 벚꽃잎이 만개하며 대폭발 비산 & 핑크/화이트 충격파
 * - 잔여 꽃잎들이 팔랑거리며 지면으로 낙하
 */
export const petalDanceMove: BattleMoveAnimation = {
  num: 80,
  key: "petal-dance",
  nameKo: "꽃잎댄스",
  nameEn: "Petal Dance",
  type: "grass",
  category: "special",
  camera: { type: "target", zoom: 1.34, delayUntilStep: 5 },
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
    };

    // ⚠️ 핵심: 오직 시전자만 이동 (수비자는 항상 0, 0으로 절대 움직이지 않음)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // #1. 과감한 회전 댄스 1: 우하단 와이드 도약 & 발밑 꽃잎 태동
      {
        ...baseFrame,
        delay: 75,
        ...cOff(22, 10),
        pScale: isP ? { x: 1.08, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.08, y: 0.92 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "petal-dance-spin1",
        phaseName: "#1. 과감한 회전 댄스 1 (우하단)",
      },
      // #2. 과감한 회전 댄스 2: 상단 후방 턴 & 1차 나선 꽃잎 솟구침
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, -22),
        pScale: isP ? { x: 0.90, y: 1.16 } : undefined,
        eScale: !isP ? { x: 0.90, y: 1.16 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.45,
        phaseId: "petal-dance-spin2",
        phaseName: "#2. 과감한 회전 댄스 2 (상단 도약)",
      },
      // #3. 과감한 회전 댄스 3: 좌하단 와이드 스텝 & 꽃잎 2중 소용돌이
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-24, 12),
        pScale: isP ? { x: 1.12, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.12, y: 0.90 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "petal-dance-spin3",
        phaseName: "#3. 과감한 회전 댄스 3 (좌하단 스텝)",
      },
      // #4. 과감한 회전 댄스 4: 2회전 진입 우상단 & 전신 꽃잎 태풍 완성
      {
        ...baseFrame,
        delay: 75,
        ...cOff(18, -16),
        pScale: isP ? { x: 0.92, y: 1.14 } : undefined,
        eScale: !isP ? { x: 0.92, y: 1.14 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.50,
        phaseId: "petal-dance-spin4",
        phaseName: "#4. 과감한 회전 댄스 4 (우상단 2회전)",
      },
      // #5. 하단 안착 & 깊은 웅크림 (스프링처럼 힘을 모아 돌진 준비)
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-6, 8),
        pScale: isP ? { x: 0.86, y: 1.14 } : undefined,
        eScale: !isP ? { x: 0.86, y: 1.14 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.90,
        phaseId: "petal-dance-charge",
        phaseName: "#5. 돌진 준비 응축",
      },
      // #6. 전방 강력 도약 돌진: 전방으로 72px 맹렬하게 치고 나감!
      {
        ...baseFrame,
        delay: 100,
        ...cOff(72, -22),
        pScale: isP ? { x: 1.28, y: 0.78 } : undefined,
        eScale: !isP ? { x: 1.28, y: 0.78 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.65,
        phaseId: "petal-dance-dash",
        phaseName: "#6. 전방 강력 도약 돌진 (72px)",
      },
      // #7. 전방에서 꽃잎 폭풍 쇄도: 시전자 ➔ 상대 고속 비행
      {
        ...baseFrame,
        delay: 110,
        ...cOff(52, -16),
        pScale: isP ? { x: 1.10, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.92 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.65,
        phaseId: "petal-dance-rush",
        phaseName: "#7. 꽃잎 폭풍 쇄도",
      },
      // #8. 1차 난무 타격: 상대 감싸며 회오리 & 타격 섬광 (피격자만 피격 흔들림)
      {
        ...baseFrame,
        delay: 120,
        pOffset: isP ? { x: 26, y: -8 } : (isHit ? { x: 8, y: -2 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -26, y: 8 } : (isHit ? { x: -10, y: 2 } : { x: 0, y: 0 }),
        eRot: isHit && isP ? -0.06 : 0,
        pRot: isHit && !isP ? 0.06 : 0,
        showEffect: isHit,
        hitFlash: isHit,
        moveStep: 6,
        effectProgress: 0.55,
        phaseId: "petal-dance-hit1",
        phaseName: "#8. 1차 난무 타격",
      },
      // #9. 2차 폭풍 댄스: 맹렬한 고속 회전 & 2차 맹타 (서서히 복귀)
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 12, y: -4 } : (isHit ? { x: -12, y: 4 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -12, y: 4 } : (isHit ? { x: 12, y: -4 } : { x: 0, y: 0 }),
        eRot: isHit && isP ? 0.08 : 0,
        pRot: isHit && !isP ? -0.08 : 0,
        showEffect: isHit,
        hitFlash: isHit,
        moveStep: 7,
        effectProgress: 0.70,
        phaseId: "petal-dance-hit2",
        phaseName: "#9. 2차 폭풍 댄스",
      },
      // #10. 꽃잎 대폭발: 사방 만개 비산 & 피날레 충격파
      {
        ...baseFrame,
        delay: 140,
        pOffset: isP ? { x: 0, y: 0 } : (isHit ? { x: 6, y: -4 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: 0, y: 0 } : (isHit ? { x: -6, y: 4 } : { x: 0, y: 0 }),
        eRot: 0,
        pRot: 0,
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 8,
        effectProgress: 0.65,
        phaseId: "petal-dance-burst",
        phaseName: "#10. 꽃잎 대폭발",
      },
      // #11. 잔향: 흩어진 꽃잎들 살랑살랑 낙하
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 9,
        effectProgress: 0.75,
        phaseId: "petal-dance-afterglow",
        phaseName: "#11. 꽃잎 낙하 잔향",
      },
      // #12. 피날레 복귀
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 9,
        phaseId: "petal-dance-complete",
        phaseName: "#12. 피날레 복귀",
      },
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawPetalDanceEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
};
