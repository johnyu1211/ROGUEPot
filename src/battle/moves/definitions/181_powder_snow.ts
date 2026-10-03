// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawPowderSnowBehindEffect,
  drawPowderSnowEffect,
} from "../../../renderers/moves/gen1/move181_184.js";

/**
 * 181: 눈싸라기 (Powder Snow) - 얼음 타입 특수 공격기 (위력 40 / 명중 100 / PP 25)
 *
 * [유저 수정 반영]:
 * 1. 타겟 이펙트(충격파 링, 폭발, 스타버스트) 완전 제거
 * 2. 독가스처럼 눈 알갱이들이 상대 포켓몬 스프라이트를 투과/관통하여 지나가도록 구현 (Front/Behind 입체 레이어)
 * 3. 발사된 이후 나가는 속도가 너무 빨리 끝나지 않도록 지속 프레임과 비행 거리를 넉넉하게 확장
 * 4. 부드러운 암전 Fade-in & 순백색 알갱이 자체 발광 유지
 */
export const powderSnowMove: BattleMoveAnimation = {
  num: 181,
  key: "powder-snow",
  nameKo: "눈싸라기",
  nameEn: "Powder Snow",
  type: "ice",
  category: "special",
  camera: { type: "target", zoom: 1.34 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawPowderSnowBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawPowderSnowEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.34,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
    };

    // 시전자 전용 오프셋 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(수비자) 전용 관통 피격 리액션 헬퍼 (인위적 튕김 없이 가벼운 한기 오한/전율)
    const targetReact = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    // 피격자 서리 블루 틴트 헬퍼
    const tintBlue = (active: boolean) => ({
      targetBlueTint: active,
      pBlueTint: !isP ? active : false,
      eBlueTint: isP ? active : false,
    });

    return [
      // 1. 시전자 기동 & 타겟 포커싱
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-3, 1),
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        blackFadeAlpha: 0.0,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.0,
        phaseId: "powder-snow-start",
        phaseName: "1. 타겟 포커싱 & 시동",
      },
      // 2. 암전 페이드인 1단계 (35%)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-4, 2),
        blackFadeAlpha: 0.35,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.12,
        phaseId: "powder-snow-fadein-1",
        phaseName: "2. 암전 페이드인 1",
      },
      // 3. 암전 페이드인 2단계 (65%) & 눈 알갱이 연속 사출 시작
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-2, 0),
        blackFadeAlpha: 0.65,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.25,
        phaseId: "powder-snow-fadein-2",
        phaseName: "3. 암전 완성 & 눈 알갱이 사출 개시",
      },
      // 4. 넉넉하고 우아한 눈 알갱이 쇄도 1
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        blackFadeAlpha: 0.65,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.40,
        phaseId: "powder-snow-stream-1",
        phaseName: "4. 눈 알갱이 쇄도 1",
      },
      // 5. 넉넉하고 우아한 눈 알갱이 쇄도 2 (전장 횡단)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        blackFadeAlpha: 0.65,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.55,
        phaseId: "powder-snow-stream-2",
        phaseName: "5. 눈 알갱이 전장 횡단",
      },
      // 6. 상대 포켓몬 스프라이트 진입 & 투과 관통 시작 (가벼운 한기 반응)
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(isHit ? -3 : 0, -1),
        ...cOff(0, 0),
        ...tintBlue(isHit),
        blackFadeAlpha: 0.65,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.70,
        phaseId: "powder-snow-penetrate-1",
        phaseName: "6. 상대 스프라이트 투과 관통 시작",
      },
      // 7. 상대 포켓몬 몸체를 완전히 통과하며 지나가는 눈 알갱이들
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(isHit ? 2 : 0, 1),
        ...cOff(0, 0),
        ...tintBlue(isHit),
        blackFadeAlpha: 0.65,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "powder-snow-penetrate-2",
        phaseName: "7. 상대 스프라이트 본격 관통 통과",
      },
      // 8. 상대를 훌쩍 관통하여 등 뒤로 뻗어나가는 눈 알갱이 스트림
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(isHit ? -2 : 0, 0),
        ...cOff(0, 0),
        ...tintBlue(isHit),
        blackFadeAlpha: 0.65,
        showEffect: true,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "powder-snow-penetrate-3",
        phaseName: "8. 상대 후방으로 지속 관통 비행",
      },
      // 9. 스트림 후미 알갱이들도 상대 관통 통과 완료
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(isHit ? 1 : 0, 0),
        ...cOff(0, 0),
        ...tintBlue(isHit),
        blackFadeAlpha: 0.65,
        showEffect: true,
        moveStep: 3,
        effectProgress: 1.15,
        phaseId: "powder-snow-penetrate-4",
        phaseName: "9. 후미 알갱이 관통 완료",
      },
      // 10. 모든 눈 알갱이가 상대를 완전히 지나쳐 원거리 소산
      {
        ...baseFrame,
        delay: 90,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        ...tintBlue(false),
        blackFadeAlpha: 0.65,
        showEffect: true,
        moveStep: 4,
        effectProgress: 1.30,
        phaseId: "powder-snow-drift-out",
        phaseName: "10. 후방 비행 및 자연 소산",
      },
      // 11. 암전 서서히 페이드아웃 (35%)
      {
        ...baseFrame,
        delay: 85,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        blackFadeAlpha: 0.35,
        showEffect: true,
        moveStep: 4,
        effectProgress: 1.45,
        phaseId: "powder-snow-lift-1",
        phaseName: "11. 암전 서서히 페이드아웃",
      },
      // 12. 암전 완전 해제 및 정상 무대 복귀
      {
        ...baseFrame,
        delay: 80,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        blackFadeAlpha: 0.0,
        showEffect: false,
        moveStep: 5,
        effectProgress: 1.55,
        phaseId: "powder-snow-lift-2",
        phaseName: "12. 암전 완전 해제",
      },
      // 13. 완전 종료 및 정위치 복귀
      {
        ...baseFrame,
        delay: 75,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        blackFadeAlpha: 0.0,
        showEffect: false,
        moveStep: 5,
        effectProgress: 1.65,
        phaseId: "powder-snow-end",
        phaseName: "13. 완전 복귀",
      },
    ];
  },
};
