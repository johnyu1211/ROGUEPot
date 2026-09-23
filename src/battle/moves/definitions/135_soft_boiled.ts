// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSoftBoiledEffect } from "../../../renderers/moves/gen1/move133_136.js";

/**
 * 135: 알낳기 (Soft-Boiled) - 노말 타입 변화기 (최대 HP의 50% 회복)
 *
 * 연출 구성:
 * 1. 시전자 앞 상공으로 부드러운 상아빛 달걀이 통- 통- 도약 출현
 * 2. 공중 정점에서 '톡!' 소리와 함께 알 표면에 지그재그 금(Crack)이 감
 * 3. 알이 위아래로 반으로 쪼개지며 황금빛 노른자 광채 대폭발
 * 4. 쪼개진 알에서 영롱한 에메랄드 힐링 크로스(+)와 따스한 치유 방울들이 위로 뿜어져 나옴
 * 5. 치유 에너지가 시전자 전신으로 쏟아져 들어가며 체표면 발광 및 HP 회복
 * 6. 기쁨의 가벼운 도약 및 안정 착지
 */
export const softBoiledMove: BattleMoveAnimation = {
  num: 135,
  key: "soft-boiled",
  nameKo: "알낳기",
  nameEn: "Soft-Boiled",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.28 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSoftBoiledEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.28,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // 1. 달걀 통! 도약 출현 (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 2),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.65,
        phaseId: "softboiled-spawn",
        phaseName: "1. 달걀 도약 출현",
      },

      // 2. 달걀 좌측 기우뚱 (90ms) - 부화 전 흔들림!
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "softboiled-wobble-1",
        phaseName: "2. 달걀 좌측 흔들림",
      },

      // 3. 달걀 우측 기우뚱 (90ms) - 부화 전 긴장감
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "softboiled-wobble-2",
        phaseName: "3. 달걀 우측 흔들림",
      },

      // 4. 달걀 균열 (Crack) 톡! (110ms)
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.95,
        phaseId: "softboiled-crack",
        phaseName: "4. 달걀 균열 (Crack)",
      },

      // 5. 알 해칭 개시 & 껍질 쪼개짐 (100ms) - 상하 껍질 분리 시작 & 황금 노른자 방출
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, -1),
        pScale: isP ? { x: 0.97, y: 1.03 } : undefined,
        eScale: !isP ? { x: 0.97, y: 1.03 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "softboiled-hatch-1",
        phaseName: "5. 알 해칭 껍질 분리",
      },

      // 6. 알 완전 해칭 & 밝은 범위 광채 폭발 (100ms) - 껍질 활짝 열림
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, -2),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 1.0,
        phaseId: "softboiled-hatch-2",
        phaseName: "6. 알 해칭 & 밝은 범위 광채 방출",
      },

      // 7. 쪼개진 알 껍질 & 광채 페이드아웃 (85ms) - 계란 소멸 시작
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "softboiled-hatch-fade-1",
        phaseName: "7. 쪼개진 알 껍질 페이드아웃 1",
      },

      // 8. 알 껍질 화면에서 완전 소멸 (85ms) - 계란 100% 증발
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.95,
        phaseId: "softboiled-hatch-fade-2",
        phaseName: "8. 알 껍질 화면에서 완전 소멸",
      },

      // 9. 계란 소멸 후: 1번 회복별 발밑 출현 & 시계방향 나선 상승 & HP 회복 반영 (85ms)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        pScale: isP ? { x: 1.04, y: 1.04 } : undefined,
        eScale: !isP ? { x: 1.04, y: 1.04 } : undefined,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.12,
        phaseId: "softboiled-recover-1",
        phaseName: "9. 1번 회복별 발밑 출현 & 나선 상승",
      },

      // 10. 2번 회복별 출현 & 1번 별 나선 선회 (85ms)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.32,
        phaseId: "softboiled-recover-2",
        phaseName: "10. 2번 회복별 출현 & 1번 별 나선 선회",
      },

      // 11. 3번 회복별 출현 & 순차 나선 비상 (85ms)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.52,
        phaseId: "softboiled-recover-3",
        phaseName: "11. 3번 회복별 출현 & 순차 나선 비상",
      },

      // 12. 4번 회복별 출현 & 선행 별 상공 페이드 (85ms)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.72,
        phaseId: "softboiled-recover-4",
        phaseName: "12. 4번 회복별 출현 & 선행 별 상공 페이드",
      },

      // 13. 잔여 회복별들 순차적 승화 소멸 (85ms)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.92,
        phaseId: "softboiled-recover-5",
        phaseName: "13. 잔여 회복별들 순차적 승화 소멸",
      },

      // 14. 기쁨의 가벼운 도약 (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, -5),
        pScale: isP ? { x: 0.94, y: 1.08 } : undefined,
        eScale: !isP ? { x: 0.94, y: 1.08 } : undefined,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.40,
        phaseId: "softboiled-settle-1",
        phaseName: "14. 기쁨의 도약",
      },

      // 15. 안정 착지 및 잔여 치유 스파클 (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "softboiled-settle-2",
        phaseName: "15. 안정 착지",
      },

      // 16. 최종 정위치 복귀 (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: false,
        hitFlash: false,
        moveStep: 9,
        phaseId: "recovery",
        phaseName: "16. 정위치 복귀",
      },
    ];
  },
};
