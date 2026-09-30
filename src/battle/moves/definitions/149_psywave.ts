// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawPsywaveEffect } from "../../../renderers/moves/gen1/move149_152.js";

/**
 * 149: 사이코웨이브 (Psywave)
 *
 * 타입: 에스퍼 (Psychic)
 * 분류: 특수 (Special)
 * 위력: - (레벨 × 0.5 ~ 1.5 가변 데미지) / 명중: 100 / PP: 15
 *
 * [유저 요구사항 100% 반영]:
 * 1. 시전포켓몬에게서 시작되는 길쭉한 타원형으로 이루어진 색깔 곡선이 상대에게로 이동함
 * 2. > 타격 >
 * 3. 대상포켓몬 스프라이트 잠깐살짝 납작해졌다가 돌아옴 >
 * 4. 링이 여러개 나타남 >
 */
export const psywaveMove: BattleMoveAnimation = {
  num: 149,
  key: "psywave",
  nameKo: "사이코웨이브",
  nameEn: "Psywave",
  type: "psychic",
  category: "special",
  camera: { type: "target", zoom: 1.22, delayUntilStep: 2, focalRatio: 0.50 }, // 가로로 더 넓은 화각의 대상 확대 (1.22x, focalRatio: 0.50)
  drawEffect: drawPsywaveEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 시전자 오프셋 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격 대상 오프셋 헬퍼
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    // 피격 대상 스케일 헬퍼 (납작해짐 및 복귀)
    const tScale = (scaleX: number, scaleY: number) => ({
      pScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: isP ? { x: scaleX, y: scaleY } : undefined,
    });

    // 시전자 스케일 헬퍼
    const cScale = (scaleX: number, scaleY: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
    });

    // -------------------------------------------------------------
    // Miss인 경우 (!isHit):
    // 곡선 발사 -> 상대 회피(물러섬) -> 곡선 허공 관통 소산 -> 원위치
    // -------------------------------------------------------------
    if (!isHit) {
      return [
        // 1. 시전자 기운 축적 & 곡선 시작
        {
          ...baseFrame,
          delay: 70,
          ...cOff(-2, 1),
          ...cScale(1.04, 0.96),
          showEffect: true,
          moveStep: 1,
          waveProgress: 0.25,
          wavePhase: 0.0,
          phaseId: "psywave-miss-start",
          phaseName: "1. 초능력 파동 발사",
        },
        // 2. 색깔 곡선 이동
        {
          ...baseFrame,
          delay: 70,
          ...cOff(-3, 2),
          ...cScale(1.06, 0.94),
          showEffect: true,
          moveStep: 2,
          waveProgress: 0.65,
          wavePhase: 1.5,
          phaseId: "psywave-miss-travel",
          phaseName: "2. 색깔 곡선 이동",
        },
        // 3. 상대 회피 동작 및 빗나감
        {
          ...baseFrame,
          delay: 75,
          ...cOff(0, 0),
          ...tOff(14, -3),
          showEffect: true,
          moveStep: 2,
          waveProgress: 1.0,
          wavePhase: 3.0,
          waveFadeAlpha: 0.70,
          phaseId: "psywave-miss-dodge",
          phaseName: "3. 상대 회피 (빗나감)",
        },
        // 4. 곡선 허공 소산
        {
          ...baseFrame,
          delay: 75,
          ...cOff(0, 0),
          ...tOff(8, -1),
          showEffect: true,
          moveStep: 2,
          waveProgress: 1.0,
          wavePhase: 4.5,
          waveFadeAlpha: 0.20,
          phaseId: "psywave-miss-fade",
          phaseName: "4. 파동 소산",
        },
        // 5. 원위치 복귀
        {
          ...baseFrame,
          delay: 60,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          moveStep: 3,
          phaseId: "psywave-miss-complete",
          phaseName: "5. 복귀 완료",
        },
      ];
    }

    // -------------------------------------------------------------
    // Hit인 경우 (isHit === true):
    // 1. 시전포켓몬에게서 시작되는 길쭉한 타원형으로 이루어진 색깔 곡선이 상대에게로 이동함 (Frames 1~4)
    // 2. > 타격 > (Frame 5)
    // 3. 대상포켓몬 스프라이트 잠깐살짝 납작해졌다가 돌아옴 > (Frames 5~8)
    // 4. 링이 여러개 나타남 > (Frames 6~10)
    // 5. 완료 및 복귀 (Frame 11)
    // -------------------------------------------------------------
    return [
      // Frame 1: 시전자 기운 축적 & 곡선 태동
      // 시전자 몸체에서 길쭉한 타원형들로 구성된 마젠타/보라 곡선이 태동
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-2, 1),
        ...cScale(1.04, 0.96),
        showEffect: true,
        moveStep: 1,
        waveProgress: 0.22,
        wavePhase: 0.0,
        phaseId: "psywave-charge",
        phaseName: "#1. 시전자 초능력 파동 태동",
      },

      // Frame 2: 색깔 곡선 이동 중반부
      // 길쭉한 타원형들이 S자 사인파 궤적을 그리며 배틀필드 중앙으로 굽이쳐 뻗어나감 (대상 확대 진입)
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-3, 2),
        ...cScale(1.07, 0.93),
        showEffect: true,
        moveStep: 2,
        waveProgress: 0.52,
        wavePhase: 1.3,
        phaseId: "psywave-travel-1",
        phaseName: "#2. 색깔 곡선 굽이치며 이동 (전반)",
      },

      // Frame 3: 색깔 곡선 상대 전방 쇄도
      // 파동이 상대를 향해 고속으로 곡선을 그리며 쇄도
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-2, 1),
        ...cScale(1.03, 0.97),
        showEffect: true,
        moveStep: 2,
        waveProgress: 0.82,
        wavePhase: 2.6,
        phaseId: "psywave-travel-2",
        phaseName: "#3. 색깔 곡선 상대 전방 쇄도 (후반)",
      },

      // Frame 4: 상대 도달 및 완전 포위
      // 시전자부터 상대까지 길쭉한 타원형 색깔 곡선이 온전히 연결됨
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        showEffect: true,
        moveStep: 2,
        waveProgress: 1.0,
        wavePhase: 3.8,
        phaseId: "psywave-reach",
        phaseName: "#4. 상대 도달 및 연결",
      },

      // Frame 5: 💥 타격! (Hit Impact)
      // ⚠️ 유저 요구사항: "> 타격 >"
      // 번쩍이는 섬광, 충격파 팽창, 대상이 눌리기 시작
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...tOff(3, 3),
        ...tScale(1.22, 0.78), // 타격 압력에 의해 가로로 넓어지며 눌리기 시작
        hitFlash: true,
        targetPurpleLevel: 0.75,
        showEffect: true,
        moveStep: 3,
        impactProgress: 0.35,
        waveProgress: 1.0,
        wavePhase: 4.8,
        waveFadeAlpha: 0.80,
        phaseId: "psywave-hit",
        phaseName: "#5. 타격 작렬 및 충격파",
      },

      // Frame 6: 🌀 대상포켓몬 스프라이트 잠깐 살짝 납작해짐 (Squash Peak)
      // ⚠️ 유저 요구사항: "> 대상포켓몬 스프라이트 잠깐살짝 납작해졌다가"
      // 세로로 쑥 눌리고 가로로 훨씬 넓게 팽창 (x: 1.45, y: 0.58), 발밑 접지 유지
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...tOff(-2, 7), // 접지면 유지를 위해 살짝 아래로 안착
        ...tScale(1.45, 0.58), // ⚠️ 가로로 확실하게 넓적하고 납작해짐!
        targetPurpleLevel: 0.85,
        showEffect: true,
        moveStep: 3,
        impactProgress: 0.80,
        waveProgress: 1.0,
        wavePhase: 5.5,
        waveFadeAlpha: 0.40,
        ringsProgress: 0.15, // 링이 서서히 실체화 시작
        ringsAlpha: 0.60,
        phaseId: "psywave-squash-peak",
        phaseName: "#6. 대상 스프라이트 납작해짐 (압축)",
      },

      // Frame 7: ⬆️ 대상포켓몬 탄성 튀어오름 & 링 여러 개 본격 전개
      // ⚠️ 유저 요구사항: "돌아옴 > 링이 여러개 나타남 >"
      // 납작해졌던 스프라이트가 탄성으로 통! 튀어오르며, 5단 링이 온몸을 감쌈
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...tOff(1, -2), // 탄성 튀어오름
        ...tScale(0.92, 1.10), // 위로 탄성 복귀
        targetPurpleLevel: 0.70,
        showEffect: true,
        moveStep: 4,
        ringsProgress: 0.40,
        ringsAlpha: 0.95,
        phaseId: "psywave-rings-1",
        phaseName: "#7. 탄성 복귀 & 링 여러 개 출현",
      },

      // Frame 8: 🔄 대상포켓몬 원래 상태 복귀 & 링 여러 개 공명 진동
      // ⚠️ 유저 요구사항: "돌아옴 > 링이 여러개 나타남 >"
      // 대상 스프라이트 완전 원래 크기(1.0, 1.0) 복귀 및 몸체를 감싼 링들의 리드미컬한 파동 진동
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...tOff(0, 0),
        ...tScale(1.0, 1.0), // ⚠️ 완전히 원래 크기로 복귀!
        targetPurpleLevel: 0.50,
        showEffect: true,
        moveStep: 4,
        ringsProgress: 0.65,
        ringsAlpha: 1.0,
        phaseId: "psywave-rings-2",
        phaseName: "#8. 원래 상태 복귀 & 링 파동 공명",
      },

      // Frame 9: 링 여러 개 팽창 및 파동 확산
      // 링들이 바깥쪽으로 팽창하며 초능력 잔광 방출
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...tOff(0, 0),
        ...tScale(1.0, 1.0),
        targetPurpleLevel: 0.30,
        showEffect: true,
        moveStep: 4,
        ringsProgress: 0.85,
        ringsAlpha: 0.80,
        phaseId: "psywave-rings-3",
        phaseName: "#9. 링 팽창 및 에너지 방출",
      },

      // Frame 10: 링 페이드아웃 및 초능력 미세 잔광 소산
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...tOff(0, 0),
        ...tScale(1.0, 1.0),
        targetPurpleLevel: 0.10,
        showEffect: true,
        moveStep: 4,
        ringsProgress: 1.0,
        ringsAlpha: 0.35,
        phaseId: "psywave-rings-fade",
        phaseName: "#10. 링 페이드아웃 및 잔광 소산",
      },

      // Frame 11: 연출 종료 및 전장 복귀
      {
        ...baseFrame,
        delay: 60,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        targetPurpleLevel: 0.0,
        showEffect: false,
        moveStep: 5,
        phaseId: "psywave-complete",
        phaseName: "#11. 연출 종료 및 복귀",
      },
    ];
  },
};
