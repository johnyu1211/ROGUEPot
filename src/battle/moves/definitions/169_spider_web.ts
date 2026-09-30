// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSpiderWebEffect } from "../../../renderers/moves/gen1/move169_172.js";

/**
 * 169: 거미집 (Spider Web) - 벌레 타입 변화기 (도주 및 교체 불가 상태이상)
 *
 * 위력: — / 명중: — (필중) / PP: 10 / 접촉 판정: X
 * 설명: 끈끈하고 질긴 실을 칭칭 휘감아 상대를 결박하여 도망치거나 교체할 수 없게 만든다.
 *
 * [연출 기승전결 시퀀스]:
 * 1. Step 1: 시전자 웅크림 힘 축적 & 입가 은백색 실크 에너지 응축 (Windup - 160ms)
 * 2. Step 2: 시전자에서 상대를 향해 3가닥 유려한 실크 탄환 초고속 발사 (Launch - 170ms)
 * 3. Step 3: 상대 전면에 8방향 방사선 & 4단 동심 다각형 거미줄 폭발적 전개 (Burst - 240ms)
 * 4. Step 4: 거미줄의 팽팽한 장력 수축 진동 & 대상 몸통 이중 결박 밴드 속박 (Ensnare - 270ms)
 * 5. Step 5: 대상 포켓몬 완전 결박 고정 (cannotEscape) & 은은한 점착 페이드아웃 (Lockdown - 170ms)
 */
export const spiderWebMove: BattleMoveAnimation = {
  num: 169,
  key: "spider-web",
  nameKo: "거미집",
  nameEn: "Spider Web",
  type: "bug",
  category: "status",
  camera: {
    type: "target",
    zoom: 1.30,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawSpiderWebEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 오프셋 (시전자만 정확히 이동, 수비자는 완벽하게 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 수비자(피격자) 오프셋
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // =======================================================================
      // Step 1: 시전자 웅크림 힘 축적 & 은백색 실크 에너지 응축 (160ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-4, 2),
        ...cScale(0.96, 1.04),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "spider-web-gather-1",
        phaseName: "1. 시전자 웅크림 힘 축적",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-6, 3),
        ...cScale(0.92, 1.08),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "spider-web-gather-2",
        phaseName: "1. 입가 은백색 실크 에너지 응축",
      },

      // =======================================================================
      // Step 2: 시전자에서 상대를 향해 3가닥 실크 탄환 사출 (170ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(4, -1),
        ...cScale(1.06, 0.94),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.40,
        phaseId: "spider-web-shoot-1",
        phaseName: "2. 2가닥 투명한 직선 실 고속 발사",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(2, 0),
        ...cScale(1.02, 0.98),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "spider-web-shoot-2",
        phaseName: "2. 2가닥 직선 실 표적 쇄도",
      },

      // =======================================================================
      // Step 3: 상대 전면에 8방향 방사선 & 4단 거미줄 폭발적 전개 (240ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(4, -1),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.35,
        phaseId: "spider-web-burst-1",
        phaseName: "3. 거미줄 8방향 방사선 확산 전개",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(-2, 1),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.70,
        phaseId: "spider-web-burst-2",
        phaseName: "3. 동심 나선형 웹 링 직조 및 착탄",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(1, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "spider-web-burst-3",
        phaseName: "3. 4단 거미줄 완전 전개 완료",
      },

      // =======================================================================
      // Step 4: 거미줄 장력 수축 진동 & 몸통 결박 밴드 속박 (270ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(-2, 1),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.30,
        phaseId: "spider-web-ensnare-1",
        phaseName: "4. 거미줄 탄성 수축 & 1차 결박 밴드 작렬",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(2, -1),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.65,
        phaseId: "spider-web-ensnare-2",
        phaseName: "4. 장력 고주파 진동 & 대상 이중 속박",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "spider-web-ensnare-3",
        phaseName: "4. 결박 록다운 스파클 글린트",
      },

      // =======================================================================
      // Step 5: 대상 포켓몬 완전 결박 고정 & 점착 페이드아웃 (170ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.40,
        phaseId: "spider-web-lockdown-1",
        phaseName: "5. 대상 포켓몬 도주 불가 결박 완료",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.90,
        fadeEffectOnCameraReturn: true,
        phaseId: "spider-web-lockdown-2",
        phaseName: "5. 점착 페이드아웃 & 정위치 복귀",
      },
    ];
  },
};
