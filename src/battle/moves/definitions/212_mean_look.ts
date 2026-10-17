// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawMeanLookBehindEffect,
  drawMeanLookEffect,
} from "../../../renderers/moves/gen1/move209_212.js";

/**
 * 212: 검은눈빛 (Mean Look / くろいまなざし) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — (필중) / PP: 5 / 접촉 판정: X
 * 설명: 빨려 들어갈 것 같은 까만 눈빛으로 가만히 응시하여 상대를 배틀에서 도망갈 수 없게 한다.
 *
 * [유저 명시 연출 시퀀스]:
 * 1. 암전 보라색
 *    - 전체 전장을 물들이는 깊고 불길한 와인-바이올렛 대기 암전 및 비네트
 *    - 네 코너에서 대상/눈을 향해 쇄도하는 보라빛/순백 집중선 (Anime Speed Lines)
 *    - 대상 포켓몬 발 밑의 보라빛 그림자 웅덩이
 * 2. 적에게 스프라이트 위에 눈이 나타남 > 3단계에 걸쳐서 작아짐
 *    - 1단계 (대형: scale 1.45): 대상 스프라이트 상공에 나타나 슬릿에서 서서히 개안 (눈이 떠짐)
 *      (외곽 검은 연기 헤이즈 + 황금빛 홍채 + 흑요석 동공 + 10시 방향 순백 유리알 반사광)
 *    - 2단계 (중형: scale 1.02): 쿵! 소리와 함께 1차 수축하며 보라색 충격파 파동 방출, 대상 전율
 *    - 3단계 (소형: scale 0.70): 2차 수축으로 예리하게 조여들며 눈동자 십자 섬광 플래시 + 도망 불가 속박 링 형성
 * 3. 대상포켓몬 z축 중앙 위에서 눈이 떠짐 (이미지 참고 - 대상 포켓몬 머리 위 정중앙 안착)
 * 4. 눈이 검은 안개로 분해되며 대상에게 스며들고 암전 해제 & 전장 정상 복귀
 */
export const meanLookMove: BattleMoveAnimation = {
  num: 212,
  key: "mean-look",
  nameKo: "검은눈빛",
  nameEn: "Mean Look",
  type: "normal",
  category: "status",
  camera: {
    type: "target",
    zoom: 1.34,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawMeanLookBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMeanLookEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.34,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 오프셋 & 스케일 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(대상 포켓몬) 오프셋 & 스케일 헬퍼
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    // -------------------------------------------------------------
    // Miss (!isHit) 시퀀스: 암전 속에서 눈이 깜빡이다 수축 실패 소산
    // -------------------------------------------------------------
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 85,
          ...cOff(-1, 0),
          showEffect: true,
          showBehindEffect: true,
          dimAlpha: 0.40,
          moveStep: 1,
          effectProgress: 0.2,
          eyeScale: 0.87,
          eyelidOpen: 0.25,
          speedLinesAlpha: 0.35,
          phaseId: "mean-look-miss-dim",
          phaseName: "1. 전장 보라빛 암전 & 눈빛 출현 시동",
        },
        {
          ...baseFrame,
          delay: 95,
          ...cOff(0, 0),
          showEffect: true,
          showBehindEffect: true,
          dimAlpha: 0.70,
          moveStep: 1,
          effectProgress: 0.5,
          eyeScale: 0.87,
          eyelidOpen: 0.70,
          speedLinesAlpha: 0.60,
          phaseId: "mean-look-miss-open",
          phaseName: "2. 눈이 떠지려다 불안정 깜빡임",
        },
        {
          ...baseFrame,
          delay: 110,
          ...cOff(0, 0),
          showEffect: true,
          showBehindEffect: true,
          dimAlpha: 0.50,
          moveStep: 4,
          effectProgress: 0.6,
          eyeScale: 0.81,
          eyelidOpen: 0.30,
          eyeAlpha: 0.45,
          speedLinesAlpha: 0.20,
          phaseId: "mean-look-miss-flicker",
          phaseName: "3. 수축 실패 & 안개로 해체 소산",
        },
        {
          ...baseFrame,
          delay: 90,
          ...cOff(0, 0),
          showEffect: true,
          showBehindEffect: true,
          dimAlpha: 0.20,
          moveStep: 4,
          effectProgress: 0.9,
          eyeAlpha: 0.10,
          phaseId: "mean-look-miss-fade",
          phaseName: "4. 보라빛 암전 해제",
        },
        {
          ...baseFrame,
          delay: 80,
          ...cOff(0, 0),
          ...defOff(0, 0),
          showEffect: false,
          showBehindEffect: false,
          dimAlpha: 0.0,
          phaseId: "mean-look-miss-finish",
          phaseName: "5. 자세 정돈 복귀",
        },
      ];
    }

    // -------------------------------------------------------------
    // Hit (isHit) 메인 시퀀스 (유저 지정 규격 1:1 완벽 구현)
    // -------------------------------------------------------------
    return [
      // ======================================================================
      // 1. Step 1: [암전 보라색 & 1단계 대형 눈빛 출현 및 개안]
      // ======================================================================
      // 1-1. 전장 보라빛 암전 시작 & 눈빛 슬릿 출현
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-1, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.45,
        moveStep: 1,
        effectProgress: 0.15,
        eyeScale: 0.87,
        eyelidOpen: 0.05,
        speedLinesAlpha: 0.30,
        phaseId: "mean-look-stage1-start",
        phaseName: "1. 전장 보라빛 암전 시작 & 눈빛 슬릿 출현",
      },
      // 1-2. 눈이 서서히 떠짐 (35% 개안, 황금빛 홍채 비침)
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.72,
        moveStep: 1,
        effectProgress: 0.40,
        eyeScale: 0.87,
        eyelidOpen: 0.40,
        speedLinesAlpha: 0.55,
        phaseId: "mean-look-stage1-slit",
        phaseName: "2. 검은 눈빛 서서히 개안 (40%)",
      },
      // 1-3. 1단계 대형 검은 눈빛 완전 개안 (이미지 1:1 고증 완성도)
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.85,
        moveStep: 1,
        effectProgress: 0.80,
        eyeScale: 0.87,
        eyelidOpen: 1.0,
        speedLinesAlpha: 0.85,
        phaseId: "mean-look-stage1-open-full",
        phaseName: "3. 1단계 대형 검은 눈빛 완전 개안 (이미지)",
      },
      // 1-4. 1단계 대형 눈빛 대상 압도적 응시 유지
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.85,
        moveStep: 1,
        effectProgress: 1.0,
        eyeScale: 0.87,
        eyelidOpen: 1.0,
        speedLinesAlpha: 0.75,
        phaseId: "mean-look-stage1-hold",
        phaseName: "4. 1단계 대형 눈빛 대상 응시",
      },

      // ======================================================================
      // 2. Step 2: [2단계 1차 수축 (중형 축소)]
      // ======================================================================
      // 2-1. 눈이 쿵! 하고 중간 크기로 급격히 축소 (2단계 중형: 0.87 -> 0.61)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.85,
        moveStep: 2,
        effectProgress: 0.25,
        eyeScale: 0.61,
        eyelidOpen: 1.0,
        speedLinesAlpha: 0.95,
        phaseId: "mean-look-stage2-shrink",
        phaseName: "5. 2단계 1차 수축 (중형 축소)",
      },
      // 2-2. 2단계 중형 눈빛의 묵직한 응시 유지
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.85,
        moveStep: 2,
        effectProgress: 0.65,
        eyeScale: 0.61,
        eyelidOpen: 1.0,
        speedLinesAlpha: 0.75,
        phaseId: "mean-look-stage2-pulse",
        phaseName: "6. 2단계 중형 눈빛 대상 응시",
      },
      // 2-3. 2단계 중형 눈빛 안정
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.85,
        moveStep: 2,
        effectProgress: 1.0,
        eyeScale: 0.61,
        eyelidOpen: 1.0,
        speedLinesAlpha: 0.65,
        phaseId: "mean-look-stage2-hold",
        phaseName: "7. 2단계 중형 눈빛 안정",
      },

      // ======================================================================
      // 3. Step 3: [3단계 2차 수축 & 완벽한 록온 (소형 축소)]
      // ======================================================================
      // 3-1. 눈이 작고 날카롭게 2차 수축 (3단계 소형: 0.61 -> 0.42)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.85,
        moveStep: 3,
        effectProgress: 0.20,
        eyeScale: 0.42,
        eyelidOpen: 1.0,
        speedLinesAlpha: 1.0,
        phaseId: "mean-look-stage3-shrink",
        phaseName: "8. 3단계 2차 수축 (소형 축소 & 록온)",
      },
      // 3-2. 3단계 소형 눈빛 강렬한 록온 응시
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.85,
        moveStep: 3,
        effectProgress: 0.60,
        eyeScale: 0.42,
        eyelidOpen: 1.0,
        speedLinesAlpha: 0.60,
        phaseId: "mean-look-stage3-lock1",
        phaseName: "9. 3단계 소형 눈빛 강렬한 록온 응시",
      },
      // 3-3. 3단계 소형 눈빛 록온 완료 (교체/도망 봉쇄)
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.80,
        moveStep: 3,
        effectProgress: 1.0,
        eyeScale: 0.42,
        eyelidOpen: 1.0,
        speedLinesAlpha: 0.40,
        phaseId: "mean-look-stage3-lock2",
        phaseName: "10. 3단계 소형 눈빛 록온 완료 (교체/도망 봉쇄)",
      },

      // ======================================================================
      // 4. Step 4: [소산 및 정상 복귀 (안개 침투 & 암전 해제)]
      // ======================================================================
      // 4-1. 눈빛이 검은 안개로 분해되며 대상에게 스며듦
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.50,
        moveStep: 4,
        effectProgress: 0.40,
        eyeAlpha: 0.55,
        eyeScale: 0.41,
        speedLinesAlpha: 0.15,
        phaseId: "mean-look-dissipate-1",
        phaseName: "11. 눈빛이 검은 안개로 분해되며 대상에 침투",
      },
      // 4-2. 보라빛 암전 해제 & 전장 광원 회복
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.20,
        moveStep: 4,
        effectProgress: 0.80,
        eyeAlpha: 0.15,
        eyeScale: 0.40,
        phaseId: "mean-look-dissipate-2",
        phaseName: "12. 보라빛 암전 해제 & 전장 광원 회복",
      },
      // 4-3. 검은눈빛 완료 & 전장 정상 복귀
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: false,
        showBehindEffect: false,
        dimAlpha: 0.0,
        moveStep: 4,
        effectProgress: 1.0,
        phaseId: "mean-look-finish",
        phaseName: "13. 검은눈빛 완료 & 전장 정상 복귀",
      },
    ];
  },
};
