// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawBonemerangBehindEffect,
  drawBonemerangEffect,
} from "../../../renderers/moves/gen1/move153_156.js";

/**
 * 155: 뼈다귀부메랑 (Bonemerang) - 땅 타입 물리 기술 (위력 50 x 2타 = 100, 명중 90%)
 *
 * 연출 구성 (유저 요청 100% 반영):
 * 1. 뼈다귀치기 에셋(drawCartoonBone)을 활용한 뼈다귀 사용
 * 2. 뼈다귀가 상대 포켓몬 스프라이트를 관통 (통과할 때 몸통박치기 타격 이펙트 직격)
 * 3. 상대 뒤로 갔다가 돌아오면서 몸통박치기 타격 이펙트 한 번 더 직격 (2타 & 체력 감소)
 * 4. 시전 포켓몬에게 뼈가 돌아오면서 자연스럽게 페이드아웃 소멸
 */
export const bonemerangMove: BattleMoveAnimation = {
  num: 155,
  key: "bonemerang",
  nameKo: "뼈다귀부메랑",
  nameEn: "Bonemerang",
  type: "ground",
  category: "physical",
  camera: { type: "target", zoom: 1.25, inlineGlideInFrames: 5 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawBonemerangBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawBonemerangEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 전용 오프셋 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(수비자) 전용 납작/탄성 변형 헬퍼
    const targetSquash = (scaleX: number, scaleY: number, offX: number, offY: number) => ({
      pScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: isP ? { x: scaleX, y: scaleY } : undefined,
      pOffset: !isP ? { x: -offX, y: offY } : { x: 0, y: 0 },
      eOffset: isP ? { x: offX, y: offY } : { x: 0, y: 0 },
    });

    return [
      // 1. 투척 준비 와인드업 (몸을 뒤로 살짝 젖히며 뼈다귀 장전)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-10, 4),
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.0,
        phaseId: "bonemerang-windup",
        phaseName: "1. 뼈다귀부메랑 투척 준비 와인드업",
      },
      // 2. 전방 고속 투척 발진 (초기 가속 35% 비행)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(12, -4),
        pScale: isP ? { x: 0.94, y: 1.06 } : undefined,
        eScale: !isP ? { x: 0.94, y: 1.06 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "bonemerang-throw-1",
        phaseName: "2. 전방 고속 투척 발진 (35% 비행)",
      },
      // 3. 상대방 정면 쇄도 (82% 비행)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(6, -2),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.82,
        phaseId: "bonemerang-throw-2",
        phaseName: "3. 상대방 정면 쇄도 (82% 비행)",
      },
      // 4. 1차 관통 타격 직격! (상대 스프라이트 관통 & 몸통박치기 타격 이펙트)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...(isHit ? targetSquash(1.18, 0.82, 4, 6) : targetSquash(1.0, 1.0, 0, 0)),
        showEffect: isHit,
        hitFlash: isHit,
        moveStep: 3,
        effectProgress: 0.15,
        phaseId: "bonemerang-hit-1",
        phaseName: "4. 1차 관통 타격 & 몸통박치기 이펙트 직격",
      },
      // 5. 상대 관통 및 배후 진입 (상대 등 뒤로 뼈다귀 통과)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...(isHit ? targetSquash(0.94, 1.08, 2, -2) : targetSquash(1.0, 1.0, 0, 0)),
        showEffect: isHit,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.22,
        phaseId: "bonemerang-behind-1",
        phaseName: "5. 상대 관통 및 배후 진입 (22%)",
      },
      // 6. 배후 최고점 부메랑 선회 정점 (등 뒤 오픈 공간에서 180° 선회 루프)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(0, 0),
        ...targetSquash(1.0, 1.0, 0, 0),
        showEffect: isHit,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.55,
        phaseId: "bonemerang-behind-apex",
        phaseName: "6. 배후 최고점 부메랑 선회 정점 (55%)",
      },
      // 7. 배후에서 상대로 복귀 쇄도 (상대 등 뒤에서 전방으로 복귀 접근)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        showEffect: isHit,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.88,
        phaseId: "bonemerang-return-behind",
        phaseName: "7. 배후에서 상대로 복귀 쇄도 (88%)",
      },
      // 8. 2차 관통 복귀 타격 직격! (몸통박치기 타격 이펙트 한 번 더 & 체력 감소)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...(isHit ? targetSquash(1.24, 0.74, 8, 8) : targetSquash(1.0, 1.0, 0, 0)),
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.20,
        phaseId: "bonemerang-hit-2",
        phaseName: "8. 2차 관통 타격 & 몸통박치기 이펙트 직격 (체력 감소)",
      },
      // 9. 시전자로 복귀 비행 1단계 (35% 복귀 & 서서히 투명화 시작)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...(isHit ? targetSquash(0.90, 1.12, 3, -3) : targetSquash(1.0, 1.0, 0, 0)),
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.35,
        phaseId: "bonemerang-return-1",
        phaseName: "9. 시전자로 복귀 비행 1단계 (35%)",
      },
      // 10. 시전자로 복귀 비행 2단계 (70% 복귀 & 페이드아웃 가속)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...targetSquash(1.0, 1.0, 0, 0),
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.70,
        phaseId: "bonemerang-return-2",
        phaseName: "10. 시전자로 복귀 비행 2단계 (70% 페이드아웃)",
      },
      // 11. 시전자 손 도달 & 회수 완료 (완전 페이드아웃 소멸)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(4, -1),
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.98,
        phaseId: "bonemerang-catch",
        phaseName: "11. 시전자 손 도달 & 회수 완료",
      },
      // 12. 모션 복귀 및 안정화
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "bonemerang-settle",
        phaseName: "12. 모션 복귀 및 연출 완료",
      },
    ];
  },
};
