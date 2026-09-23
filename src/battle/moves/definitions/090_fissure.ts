// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawFissureEffect, drawFissureBehindEffect } from "../../../renderers/moves/gen1/move089_092.js";

/**
 * 090: 땅가르기 (Fissure) - 땅 타입 물리 일격필살기 (OHKO)
 *
 * 연출 구성 (유저 요청 100% 반영 영화급 시네마틱 21프레임 기승전결):
 * 1. 하늘 암전 & 바닥 필드 페이드아웃 투명화 (skyDarkness: 0.0 -> 1.0, platformAlpha: 1.0 -> 0.0)
 * 2. 3D 원근 재배치:
 *    - 시전 포켓몬: 화면 중앙 쪽으로 이동하며 확대 (scale: 1.25x, 카메라 바로 앞 전경 연출)
 *    - 대상 포켓몬: 화면 정중앙으로 이동하며 축소 (scale: 0.68x, 아득한 원경 연출)
 * 3. 공중 도약 & 운석 강하: 시전자가 상공으로 높이 솟구쳐 체공 후 지면을 향해 수직 강하
 * 4. 지면 강타 & "쩌저저적" 3D 원근 대협곡 전개: 전경(폭 68px)에서 대상 발밑까지 관통 분열!
 * 5. 대상 포켓몬의 심연 나락 추락: 지반이 무너지며 대상이 회전/축소되며 틈새 아래로 빨려들어가 소멸
 * 6. 심연 봉합 & 원래 필드로 부드러운 복귀 (skyDarkness -> 0.0, platformAlpha -> 1.0)
 */
export const fissureMove: BattleMoveAnimation = {
  num: 90,
  key: "fissure",
  nameKo: "땅가르기",
  nameEn: "Fissure",
  type: "ground",
  category: "physical",
  camera: { type: "none" }, // 전경 시전자와 원경 대상을 모두 담는 와이드 중립 시야
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawFissureEffect(targetCtx, attackerPos, targetPos, step, prog, { ...drawCtx, frame });
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawFissureBehindEffect(targetCtx, frame, drawCtx);
  },
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
      hidePShadow: true,
      hideEShadow: true,
    };

    // 진영별 3D 원근 기준 오프셋 계산 (유저 요청: 시전자 좌측, 상대 우측 추가 이동 반영)
    // Player 시전: Player(150, 280) -> 전경 좌하단(195, 305) / Enemy(418, 152) -> 원경 우측(350, 174)
    // Enemy 시전: Enemy(418, 152) -> 전경 좌하단(293, 234) / Player(150, 280) -> 원경 좌측(230, 182)
    const casterForeX = isP ? 45 : -125;
    const casterForeY = isP ? 25 : 82;
    const targetCenterX = isP ? -68 : 80;
    const targetCenterY = isP ? 22 : -98;

    const setPositions = (
      cOffX: number,
      cOffY: number,
      cScaleX: number,
      cScaleY: number,
      tOffX: number,
      tOffY: number,
      tScaleX: number,
      tScaleY: number,
      tRot: number = 0,
      cRot: number = 0
    ) => {
      return {
        pOffset: isP ? { x: cOffX, y: cOffY } : { x: tOffX, y: tOffY },
        eOffset: isP ? { x: tOffX, y: tOffY } : { x: cOffX, y: cOffY },
        pScale: isP ? { x: cScaleX, y: cScaleY } : { x: tScaleX, y: tScaleY },
        eScale: isP ? { x: tScaleX, y: tScaleY } : { x: cScaleX, y: cScaleY },
        pRot: isP ? cRot : tRot,
        eRot: isP ? tRot : cRot,
      };
    };

    return [
      // =========================================================================
      // Phase 1: 하늘 암전 & 바닥 필드 투명화 & 3D 원근 재배치 (#1 ~ #3)
      // =========================================================================
      // #1. 하늘 암전 & 전장 차원 변환 시작 (포켓몬 서서히 원근 이동 시작)
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(
          Math.round(casterForeX * 0.35), Math.round(casterForeY * 0.35), 1.15, 1.15,
          Math.round(targetCenterX * 0.35), Math.round(targetCenterY * 0.35), 0.85, 0.85
        ),
        skyDarkness: 0.35,
        platformAlpha: 0.65,
        showEffect: false, // 점프 전에는 어떠한 공격 이펙트도 출력하지 않음!
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.30,
        phaseId: "fissure-dim-1",
        phaseName: "#1. 하늘 암전 & 전장 변환 시작",
      },

      // #2. 필드 페이드아웃 & 원근감 전개 (시전자 확대 / 대상 축소 이동)
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(
          Math.round(casterForeX * 0.75), Math.round(casterForeY * 0.75), 1.35, 1.35,
          Math.round(targetCenterX * 0.75), Math.round(targetCenterY * 0.75), 0.70, 0.70
        ),
        skyDarkness: 0.75,
        platformAlpha: 0.25,
        showEffect: false, // 점프 전에는 어떠한 공격 이펙트도 출력하지 않음!
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.70,
        phaseId: "fissure-dim-2",
        phaseName: "#2. 필드 페이드아웃 & 원근감 전개",
      },

      // #3. 암흑 전장 완성 (플랫폼 완전 투명화 & 시전자 전경 / 대상 원경 중앙 배치 완료)
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(
          casterForeX, casterForeY, 1.55, 1.55,
          targetCenterX, targetCenterY, 0.56, 0.56
        ),
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: false, // 점프 전에는 어떠한 공격 이펙트도 출력하지 않음!
        hitFlash: false,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "fissure-stage-ready",
        phaseName: "#3. 암흑 전장 완성 (시전자 전경 1.55배 / 대상 원경 중앙)",
      },

      // =========================================================================
      // Phase 2: 시전자 공중 도약 & 운석 강하 (#4 ~ #7)
      // =========================================================================
      // #4. 시전자 지면 압축 (기 모으기 / 도약 준비 - 스프링 압축)
      {
        ...baseFrame,
        delay: 80,
        ...setPositions(
          casterForeX, casterForeY + 8, 1.72, 1.28,
          targetCenterX, targetCenterY, 0.56, 0.56
        ),
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: false, // 도약 전 웅크림 단계: 이펙트 없음
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.00,
        phaseId: "fissure-jump-prep",
        phaseName: "#4. 시전자 지면 압축 (도약 준비)",
      },

      // #5. 시전자 상공으로 급상승 도약 (가로 얇고 세로 길게 쫀득한 고탄력 스트레치)
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(
          casterForeX, casterForeY - 110, 1.12, 2.15,
          targetCenterX, targetCenterY, 0.56, 0.56
        ),
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: true, // 도약 순간부터 발밑 추진 폭풍 시작!
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "fissure-jump-ascent",
        phaseName: "#5. 시전자 상공으로 급상승 도약 (쫀득한 고탄력 스트레치)",
      },

      // #6. 암흑 상공 정점 체공 (Apex - 유저 요청: 링 및 점 이펙트 제거)
      {
        ...baseFrame,
        delay: 95,
        ...setPositions(
          casterForeX, casterForeY - 180, 1.55, 1.55,
          targetCenterX, targetCenterY, 0.56, 0.56
        ),
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: false,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.65,
        phaseId: "fissure-jump-apex",
        phaseName: "#6. 암흑 상공 정점 체공",
      },

      // #7. 지면을 향한 맹렬한 수직 급강하 (유저 요청: 가로 얇고 세로 길게 쫀득한 고탄력 스트레치 강하)
      {
        ...baseFrame,
        delay: 75,
        ...setPositions(
          casterForeX, casterForeY - 40, 1.08, 2.22,
          targetCenterX, targetCenterY, 0.56, 0.56
        ),
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.95,
        phaseId: "fissure-dive-slam",
        phaseName: "#7. 지면을 향한 맹렬한 수직 강하 (쫀득한 고탄력 스트레치)",
      },

      // =========================================================================
      // Phase 3: 지면 강타 & "쩌저저적" 3D 원근 대균열 전개 (#8 ~ #12)
      // =========================================================================
      // #8. 지면 격돌 강타 (초대형 폭발 충격파 링 & 지면 압축 스쿼시)
      {
        ...baseFrame,
        delay: 90,
        ...setPositions(
          casterForeX, casterForeY + 10, 1.88, 1.08,
          targetCenterX, targetCenterY, 0.56, 0.56
        ),
        cameraPan: { x: 0, y: 16 },
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.15,
        phaseId: "fissure-ground-impact",
        phaseName: "#8. 지면 격돌 강타 (충격파 폭발)",
      },

      // #9. [균열 1단계 '쩌-'] 전경 거대 단층 폭발
      {
        ...baseFrame,
        delay: 80,
        ...setPositions(
          casterForeX, casterForeY + 2, 1.55, 1.55,
          targetCenterX, targetCenterY, 0.56, 0.56
        ),
        cameraPan: { x: -6, y: 4 },
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.35,
        phaseId: "fissure-crack-1",
        phaseName: "#9. [균열 1단계 '쩌-'] 전경 거대 단층 폭발",
      },

      // #10. [균열 2단계 '-저-'] 중심부 대지 분열 & 암석 비산
      {
        ...baseFrame,
        delay: 80,
        ...setPositions(
          casterForeX, casterForeY, 1.55, 1.55,
          targetCenterX, targetCenterY, 0.56, 0.56
        ),
        cameraPan: { x: 7, y: -3 },
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "fissure-crack-2",
        phaseName: "#10. [균열 2단계 '-저-'] 중심부 대지 분열 & 암석 비산",
      },

      // #11. [균열 3단계 '-저-'] 대상 발밑 지면 관통 & 균형 상실
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(
          casterForeX, casterForeY, 1.55, 1.55,
          targetCenterX, targetCenterY, 0.54, 0.58,
          0.18 // 대상 포켓몬 흔들림 (rot)
        ),
        cameraPan: { x: -7, y: 5 },
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "fissure-crack-3",
        phaseName: "#11. [균열 3단계 '-저-'] 대상 발밑 지면 관통 & 균형 상실",
      },

      // #12. [균열 4단계 '-적!!'] 대협곡 나락 완전 개방 & 일격필살 강타!
      {
        ...baseFrame,
        delay: 95,
        ...setPositions(
          casterForeX, casterForeY, 1.55, 1.55,
          targetCenterX, targetCenterY, 0.58, 0.53,
          -0.22
        ),
        cameraPan: { x: 10, y: -6 },
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "fissure-crack-4",
        phaseName: "#12. [균열 4단계 '-적!!'] 대협곡 나락 완전 개방 (일격필살 강타)",
      },

      // =========================================================================
      // Phase 4: 대상 포켓몬의 심연 나락 추락 (#13 ~ #16)
      // =========================================================================
      // #13 in code / Frame #14 in viewer: 지반 붕괴 & 대상 허공 추락 시작 (반투명화 진행)
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(
          casterForeX, casterForeY, 1.55, 1.55,
          targetCenterX, targetCenterY + 30, 0.44, 0.44,
          -0.28
        ),
        targetAlpha: 0.50,
        cameraPan: { x: -5, y: 3 },
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        effectProgress: 0.25,
        phaseId: "fissure-fall-1",
        phaseName: "#13. 지반 붕괴 & 대상 추락 (반투명화)",
      },

      // #14 in code / Frame #15 in viewer: [유저 요청] 투명도 100% (완전 투명 소멸)
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(
          casterForeX, casterForeY, 1.55, 1.55,
          targetCenterX, targetCenterY + 70, 0.30, 0.30,
          0.35
        ),
        targetAlpha: 0.00,
        cameraPan: { x: 4, y: -2 },
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        effectProgress: 0.55,
        phaseId: "fissure-fall-2",
        phaseName: "#14. 나락 심연 속 완전 소멸 (투명도 100%)",
      },

      // #15. 심연의 어둠 속으로 완전 침강 & 흑연기 분출 ([유저 요청] #14 이후 바로 완전 투명화)
      {
        ...baseFrame,
        delay: 90,
        ...setPositions(
          casterForeX, casterForeY, 1.55, 1.55,
          targetCenterX, targetCenterY + 120, 0.18, 0.18,
          -0.50
        ),
        targetAlpha: 0.00,
        cameraPan: { x: -2, y: 1 },
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        effectProgress: 0.85,
        phaseId: "fissure-fall-3",
        phaseName: "#15. 심연의 어둠 속으로 완전 침강 & 흑연기 분출 (투명화 완료)",
      },

      // #16. 대상 나락 완전 소멸 & 지열 잔향
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(
          casterForeX, casterForeY, 1.55, 1.55,
          targetCenterX, targetCenterY + 180, 0.06, 0.06,
          0.80
        ),
        targetAlpha: 0.00,
        cameraPan: { x: 0, y: 0 },
        skyDarkness: 1.00,
        platformAlpha: 0.00,
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "fissure-fall-4",
        phaseName: "#16. 대상 나락 완전 소멸 & 지열 잔향",
      },

      // =========================================================================
      // Phase 5: 심연 봉합 & 원래 필드로 부드러운 복귀 (#17 ~ #21)
      // =========================================================================
      // #17. 대지 심연 봉합 & 필드 복귀 시작
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(
          Math.round(casterForeX * 0.70), Math.round(casterForeY * 0.70), 1.40, 1.40,
          0, 0, 1.0, 1.0
        ),
        targetAlpha: isHit ? 0.00 : 0.40,
        skyDarkness: 0.75,
        platformAlpha: 0.25,
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 5,
        effectProgress: 0.25,
        phaseId: "fissure-restore-1",
        phaseName: "#17. 대지 심연 봉합 & 필드 복귀 시작",
      },

      // #18. 하늘 채광 회복 & 플랫폼 페이드인
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(
          Math.round(casterForeX * 0.40), Math.round(casterForeY * 0.40), 1.25, 1.25,
          0, 0, 1.0, 1.0
        ),
        targetAlpha: isHit ? 0.00 : 0.75,
        skyDarkness: 0.45,
        platformAlpha: 0.55,
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 5,
        effectProgress: 0.55,
        phaseId: "fissure-restore-2",
        phaseName: "#18. 하늘 채광 회복 & 플랫폼 페이드인",
      },

      // #19. 플랫폼 안착 & 연무 소멸
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(
          Math.round(casterForeX * 0.15), Math.round(casterForeY * 0.15), 1.12, 1.12,
          0, 0, 1.0, 1.0
        ),
        targetAlpha: isHit ? 0.00 : 0.95,
        skyDarkness: 0.15,
        platformAlpha: 0.85,
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 5,
        effectProgress: 0.85,
        phaseId: "fissure-restore-3",
        phaseName: "#19. 플랫폼 안착 & 연무 소멸",
      },

      // #20. 원래 필드 복귀 완료 (배틀 정상 자세 복귀)
      {
        ...baseFrame,
        delay: 85,
        ...setPositions(0, 0, 1.0, 1.0, 0, 0, 1.0, 1.0),
        targetAlpha: isHit ? 0.00 : 1.00,
        usePlayerFront: false,
        useEnemyBack: false,
        skyDarkness: 0.00,
        platformAlpha: 1.00,
        showEffect: false,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 5,
        effectProgress: 1.00,
        hidePShadow: !isP && isHit,
        hideEShadow: isP && isHit,
        hidePlayer: !isP && isHit,
        hideEnemy: isP && isHit,
        phaseId: "fissure-restore-4",
        phaseName: "#20. 원래 필드 복귀 완료",
      },

      // #21. [유저 요청] 필드로 돌아온 후 1프레임 뒤 시전포켓몬 뒤로돌기
      {
        ...baseFrame,
        delay: 350,
        ...setPositions(0, 0, 1.0, 1.0, 0, 0, 1.0, 1.0),
        targetAlpha: isHit ? 0.00 : 1.00,
        usePlayerFront: isP && isHit,
        useEnemyBack: !isP && isHit,
        skyDarkness: 0.00,
        platformAlpha: 1.00,
        showEffect: false,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        hidePShadow: !isP && isHit,
        hideEShadow: isP && isHit,
        hidePlayer: !isP && isHit,
        hideEnemy: isP && isHit,
        phaseId: "fissure-turn-around",
        phaseName: "#21. 필드 복귀 후 시전포켓몬 뒤로돌기",
      },
    ];
  },
};
