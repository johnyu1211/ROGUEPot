// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawEarthquakeEffect } from "../../../renderers/moves/gen1/move089_092.js";

/**
 * 089: 지진 (Earthquake) - 땅 타입 대표 물리 기술 (위력 100)
 *
 * 연출 구성 (유저 피드백 100% 반영 20프레임 기승전결 완비):
 * 1. [유저 요청 핵심] 대지 갈라짐과 바위 튀어오름 동시 발생:
 *    대지가 다 갈라진 후에 바위가 따로 올라오는 어색함을 완전히 제거하고,
 *    진원지에서 대지가 쩍 찢어지는 순간 균열 통과 위치의 바위들이 타이밍에 맞춰 순차적으로 솟구침!
 *    (중심 바위 1차 폭발 -> 좌우 외곽 균열 전개 시 외곽 바위 순차 솟구침 -> 전장 전체 암석 체공 & 강타)
 * 2. 끝이 뾰족한 테이퍼링 균열: 바늘처럼 날카롭게 모아지는 9개 단층선 다각형(Polygon) 렌더링
 * 3. 화면 & 포켓몬 동반 좌우 흔들림: cameraPan 및 pOffset/eOffset 교차 진동 (-12px ~ +12px)
 * 4. 2차 여진 리바운드 & 바닥 그림자: 1차 낙하 후 2차 튀어오름(Rebound Hop) 및 자연스러운 착지
 * 5. 지면 가림 방지: 거대 흙먼지 구름 배제, 첨단 국소 미세 먼지 및 저면 은은한 연무만 유지
 */
export const earthquakeMove: BattleMoveAnimation = {
  num: 89,
  key: "earthquake",
  nameKo: "지진",
  nameEn: "Earthquake",
  type: "ground",
  category: "physical",
  camera: { type: "target", zoom: 1.25, delayUntilStep: 2 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawEarthquakeEffect(targetCtx, attackerPos, targetPos, step, prog);
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

    return [
      // #1. 시전자 웅크림 및 발구르기 준비 (기 모으기)
      {
        ...baseFrame,
        cameraZoom: 1.0,
        delay: 80,
        pOffset: isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.90 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.10, y: 0.90 } : { x: 1.0, y: 1.0 },
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "earthquake-stomp-prep",
        phaseName: "#1. 시전자 웅크림 (기 모으기)",
      },

      // #2. 시전자 발구르기 대지 강타 (지면 충격파 방출)
      {
        ...baseFrame,
        cameraZoom: 1.0,
        delay: 80,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.94, y: 1.06 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 0.94, y: 1.06 } : { x: 1.0, y: 1.0 },
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "earthquake-stomp-impact",
        phaseName: "#2. 발구르기 대지 강타",
      },

      // #3. [유저 피드백] 대지 격렬한 진동 (전조 떨림 - 아직 균열 없이 흔들림 먼저!)
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: -5, y: 0 },
        eOffset: { x: -6, y: 0 },
        cameraPan: { x: -5, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "earthquake-shake-1",
        phaseName: "#3. 대지 격렬한 진동 (전조 떨림)",
      },

      // #4. [유저 피드백] 지면 진동 격화 & 화면/포켓몬 동반 흔들림 (균열 직전 임계점)
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 6, y: 0 },
        eOffset: { x: 7, y: 0 },
        cameraPan: { x: 6, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "earthquake-shake-2",
        phaseName: "#4. 지면 진동 격화 & 포켓몬 동반 흔들림",
      },

      // #5. [단층 파열 & 바위 솟구침 1] 진원지 중심부 균열 발생 & 대지 진동
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: -6, y: 0 },
        eOffset: { x: -7, y: 0 },
        cameraPan: { x: -6, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.10,
        phaseId: "earthquake-crack-1",
        phaseName: "#5. [단층 파열 1] 중심부 균열 발생 & 대지 진동",
      },

      // #6. [단층 파열 & 바위 솟구침 2] 진원지 쩍 갈라지며 중심 바위 즉각 폭발 분출!
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 7, y: 0 },
        eOffset: { x: 8, y: 0 },
        cameraPan: { x: 7, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.22,
        phaseId: "earthquake-crack-2",
        phaseName: "#6. [단층 파열 2] 중심 균열 개방 & 중심 바위 폭발 분출!",
      },

      // #7. [단층 파열 & 바위 솟구침 3] 주 단층선 좌우 횡단 전개 & 중형 바위들 순차 분출
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: -8, y: 0 },
        eOffset: { x: -9, y: 0 },
        cameraPan: { x: -8, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.35,
        phaseId: "earthquake-crack-3",
        phaseName: "#7. [단층 파열 3] 단층선 전개 & 중형 바위들 순차 분출",
      },

      // #8. [단층 파열 & 바위 솟구침 4] 외곽 지선 분열 & 외곽 바위 분출 & 암반 들썩임
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 9, y: 0 },
        eOffset: { x: 10, y: 0 },
        cameraPan: { x: 9, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.48,
        phaseId: "earthquake-crack-4",
        phaseName: "#8. [단층 파열 4] 외곽 지선 분열 & 외곽 바위 분출 & 암반 융기",
      },

      // #9. [단층 파열 & 바위 솟구침 5] 전장 전체 단층 격자 개방 & 바위들 공중 최고조 체공
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: -10, y: 0 },
        eOffset: { x: -11, y: 0 },
        cameraPan: { x: -10, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.60,
        phaseId: "earthquake-crack-5",
        phaseName: "#9. [단층 파열 5] 전장 균열 개방 & 바위들 공중 최고조 체공",
      },

      // #10. [대지진 본진 / 메인 강타!] 최대 지진 폭발 & 전장 타격 발생!
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 9, y: 0 } : { x: -9, y: 6 },
        eOffset: isP ? { x: 13, y: -4 } : { x: 9, y: 0 },
        pScale: isP ? { x: 1.0, y: 1.0 } : { x: 1.18, y: 0.84 },
        eScale: isP ? { x: 1.18, y: 0.84 } : { x: 1.0, y: 1.0 },
        cameraPan: { x: 12, y: 0 },
        showEffect: true,
        hitFlash: isHit,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 3,
        effectProgress: 0.72,
        phaseId: "earthquake-main-hit",
        phaseName: "#10. [대지진 본진] 최대 지진 폭발 & 타격 발생!",
      },

      // #11. [대지진 1차 착지 1] 피격 반동 & 중심 바위들 지면 1차 격돌 착지
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: -8, y: 0 } : { x: 8, y: -4 },
        eOffset: isP ? { x: -10, y: 2 } : { x: -8, y: 0 },
        pScale: isP ? { x: 1.0, y: 1.0 } : { x: 0.92, y: 1.08 },
        eScale: isP ? { x: 0.92, y: 1.08 } : { x: 1.0, y: 1.0 },
        cameraPan: { x: -10, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 3,
        effectProgress: 0.82,
        phaseId: "earthquake-landing-1",
        phaseName: "#11. [본진 착지 1] 중심 바위들 지면 격돌 착지",
      },

      // #12. [대지진 1차 착지 2] 중형 바위들 지면 격돌 착지 & 국소 착지 먼지
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 8, y: 0 },
        eOffset: { x: 8, y: 0 },
        cameraPan: { x: 8, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 3,
        effectProgress: 0.92,
        phaseId: "earthquake-landing-2",
        phaseName: "#12. [본진 착지 2] 중형 바위들 지면 격돌 착지",
      },

      // #13. [대지진 1차 착지 3] 외곽 바위들 전원 착지 완료 & 단층면 크레스트
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: -7, y: 0 },
        eOffset: { x: -7, y: 0 },
        cameraPan: { x: -7, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "earthquake-landing-3",
        phaseName: "#13. [본진 착지 3] 외곽 바위 전원 착지 완료",
      },

      // #14. [2차 여진 1] 대지 충격 반동으로 바닥 바위들 2차 리바운드 튀어오름
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 6, y: 0 },
        eOffset: { x: 6, y: 0 },
        cameraPan: { x: 6, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        effectProgress: 0.25,
        phaseId: "earthquake-rebound-1",
        phaseName: "#14. [2차 여진 1] 바위들 2차 리바운드 튀어오름",
      },

      // #15. [2차 여진 2] 리바운드 체공 정점 & 단층 슬랩 서서히 가라앉기 시작
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: -5, y: 0 },
        eOffset: { x: -5, y: 0 },
        cameraPan: { x: -5, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        effectProgress: 0.65,
        phaseId: "earthquake-rebound-2",
        phaseName: "#15. [2차 여진 2] 리바운드 체공 정점 & 여진 지속",
      },

      // #16. [2차 여진 3] 리바운드 바위들 지면 2차 최종 착지 & 안착
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 4, y: 0 },
        eOffset: { x: 4, y: 0 },
        cameraPan: { x: 4, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "earthquake-rebound-3",
        phaseName: "#16. [2차 여진 3] 바위들 지면 최종 착지 & 안착",
      },

      // #17. [대지 안정화 1] 여진 감쇠 & 단층 슬랩 침강
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: -3, y: 0 },
        eOffset: { x: -3, y: 0 },
        cameraPan: { x: -3, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 5,
        effectProgress: 0.30,
        phaseId: "earthquake-settle-1",
        phaseName: "#17. [대지 안정화 1] 여진 감쇠 & 단층 슬랩 침강",
      },

      // #18. [대지 안정화 2] 바위 완전 안착 & 균열 서서히 아물기 시작
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 2, y: 0 },
        eOffset: { x: 2, y: 0 },
        cameraPan: { x: 2, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 5,
        effectProgress: 0.65,
        phaseId: "earthquake-settle-2",
        phaseName: "#18. [대지 안정화 2] 바위 완전 안착 & 균열 침강",
      },

      // #19. [대지 안정화 3] 균열 및 저면 연무 페이드아웃 & 고요
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: -1, y: 0 },
        eOffset: { x: -1, y: 0 },
        cameraPan: { x: -1, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 5,
        effectProgress: 0.95,
        phaseId: "earthquake-settle-3",
        phaseName: "#19. [대지 안정화 3] 균열 및 연무 소멸",
      },

      // #20. 지진 완전 종료 및 정상 배틀 복귀
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        cameraPan: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        phaseId: "earthquake-complete",
        phaseName: "#20. 지진 완전 종료 및 복귀",
      },
    ];
  },
};
