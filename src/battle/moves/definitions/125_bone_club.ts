// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawBoneClubBehindEffect,
  drawBoneClubEffect,
} from "../../../renderers/moves/gen1/move125_128.js";

/**
 * 125: 뼈다귀치기 (Bone Club) - 땅 타입 물리 기술 (위력 65, 명중 85%, 10% 풀죽음)
 *
 * 연출 구성 (유저 100% 반영):
 * 1. [시전자 와인드업] 뼈다귀를 들고 시전자가 투척 자세를 취함
 * 2. [포물선 회전 비행] 뼈다귀가 회전하며 포물선 궤적으로 날아감 & 지면 그림자 추적
 * 3. [톡! 타격 순간] 대상 포켓몬 머리를 톡 침! (피격자 살짝 납작 Squash + 몸통박치기 타격 이펙트)
 * 4. [오른쪽 튕겨나감] 닿은 뼈다귀는 오른쪽으로 튕겨져 나가면서 더 빠른 회전
 * 5. [페이드아웃 소멸] 초고속 회전하며 점차 투명해져 사라짐 & 피격자 탄성 복귀
 */
export const boneClubMove: BattleMoveAnimation = {
  num: 125,
  key: "bone-club",
  nameKo: "뼈다귀치기",
  nameEn: "Bone Club",
  type: "ground",
  category: "physical",
  camera: { type: "target", zoom: 1.25, inlineGlideInFrames: 5 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawBoneClubBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawBoneClubEffect(targetCtx, frame, drawCtx);
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

    // 시전자 전용 오프셋 및 스케일 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(수비자) 전용 납작/탄성 변형 헬퍼 (유저: 칠때 대상포켓몬 살짝 납작)
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
        phaseId: "bone-club-windup",
        phaseName: "1. 뼈다귀 투척 준비 와인드업",
      },
      // 2. 포물선 비행 #1 - 전방 투척 발진 (초기 회전 시작)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(12, -4),
        pScale: isP ? { x: 0.94, y: 1.06 } : undefined,
        eScale: !isP ? { x: 0.94, y: 1.06 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.08,
        phaseId: "bone-club-fly-1",
        phaseName: "2. 투척 발진 (대각선 회전 시작)",
      },
      // 3. 포물선 비행 #2 - 고각 상승 1단계 (세로 수직 회전)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(6, -2),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.22,
        phaseId: "bone-club-fly-2",
        phaseName: "3. 포물선 상승 (세로 수직 회전)",
      },
      // 4. 포물선 비행 #3 - 고각 상승 2단계 (가로 수평 회전)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.38,
        phaseId: "bone-club-fly-3",
        phaseName: "4. 고각 궤적 진입 (가로 수평 회전)",
      },
      // 5. 포물선 비행 #4 - 상공 85px 최고 정점 통과 (세로 수직 회전)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.54,
        phaseId: "bone-club-fly-4",
        phaseName: "5. 상공 85px 정점 통과 (세로 회전)",
      },
      // 6. 포물선 비행 #5 - 상대를 향해 하강 1단계 (가로 수평 회전)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.69,
        phaseId: "bone-club-fly-5",
        phaseName: "6. 상대를 향해 하강 (가로 회전)",
      },
      // 7. 포물선 비행 #6 - 대상을 향해 급강하 쇄도 (대각선 회전)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.84,
        phaseId: "bone-club-fly-6",
        phaseName: "7. 급강하 쇄도 (대각선 회전)",
      },
      // 8. 포물선 비행 #7 - 상대 정면 도달 직전 (반대 대각선 회전 타격 준비)
      {
        ...baseFrame,
        delay: 40,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.98,
        phaseId: "bone-club-fly-7",
        phaseName: "8. 상대 머리 상단 도달 직전 (타격 준비)",
      },
      // 5. 톡! 타격 순간 (대상 머리에 닿아 통 치고 몸통박치기 타격 이펙트 & 대상 납작)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...(isHit ? targetSquash(1.22, 0.76, 4, 8) : targetSquash(1.0, 1.0, 0, 0)),
        showEffect: isHit,
        hitFlash: isHit,
        moveStep: 3,
        effectProgress: 0.15,
        phaseId: "bone-club-hit-tap",
        phaseName: "5. 톡! 타격 직격 & 대상 납작",
      },
      // 6. 오른쪽 튕겨나감 1단계 & 더 빠른 회전 & 대상 탄성 반등
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, 0),
        ...(isHit ? targetSquash(0.92, 1.10, 2, -2) : targetSquash(1.0, 1.0, 0, 0)),
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "bone-club-ricochet-bounce",
        phaseName: "6. 오른쪽 튕겨나감 & 고속 회전",
      },
      // 7. 오른쪽 튕겨나감 2단계 & 초고속 회전 & 서서히 투명화
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, 0),
        ...targetSquash(1.0, 1.0, 0, 0),
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.72,
        phaseId: "bone-club-ricochet-fade",
        phaseName: "7. 우측 비산 및 투명화 진행",
      },
      // 8. 완전 페이드아웃 소멸 및 모션 복귀
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        ...targetSquash(1.0, 1.0, 0, 0),
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 1.0,
        phaseId: "bone-club-complete",
        phaseName: "8. 완전 소멸 및 모션 복귀",
      },
    ];
  },
};
