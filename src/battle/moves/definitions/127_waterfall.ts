// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import {
  drawWaterfallBehindEffect,
  drawWaterfallEffect,
} from "../../../renderers/moves/gen1/move125_128.js";

/**
 * 127: 폭포오르기 (Waterfall / たきのぼ리) - 물 타입 물리 기술 (위력 80, 명중 100%, 20% 풀죽음)
 *
 * 연출 흐름 (유저 지침 100% 반영):
 * 1. [기술 발동 & 기합] 발사직전/발사 이펙트 배제, 시전자 제자리 가벼운 기합 동작
 * 2. [대상 발밑 수직 거대 폭포 용솟음 & 넉업 타격] 대상 위치에서만 거대한 수직 폭포수가 상공 끝까지 솟구치며
 *    피격자를 공중 높이 쳐올려 넉업 강타!
 * 3. [폭포 정상 쇄파 포말 대폭발 & 비산 수적 & 착지] 폭포 정상에서 톤 단위의 포말이 사방으로 파열되며
 *    유선형 물방울 비산, 피격자 안정적 지면 착지 & 동심원 수면 파문
 */
export const waterfallMove: BattleMoveAnimation = {
  num: 127,
  key: "waterfall",
  nameKo: "폭포오르기",
  nameEn: "Waterfall",
  type: "water",
  category: "physical",
  camera: { type: "target", zoom: 1.22, delayUntilStep: 2 },
  drawBehindEffect: drawWaterfallBehindEffect,
  drawEffect: drawWaterfallEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.22,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 오프셋 & 스케일 헬퍼
    const cOff = (x: number, y: number, sx: number = 1.0, sy: number = 1.0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
      pScale: isP && (sx !== 1.0 || sy !== 1.0) ? { x: sx, y: sy } : undefined,
      eScale: !isP && (sx !== 1.0 || sy !== 1.0) ? { x: sx, y: sy } : undefined,
    });

    // 피격자 오프셋 & 스케일 헬퍼 (넉업 및 스쿼시)
    const targetOff = (offX: number, offY: number, sx: number = 1.0, sy: number = 1.0) => ({
      pOffset: !isP ? { x: -offX, y: offY } : { x: 0, y: 0 },
      eOffset: isP ? { x: offX, y: offY } : { x: 0, y: 0 },
      pScale: !isP && (sx !== 1.0 || sy !== 1.0) ? { x: sx, y: sy } : undefined,
      eScale: isP && (sx !== 1.0 || sy !== 1.0) ? { x: sx, y: sy } : undefined,
    });

    return [
      // ======================================================================
      // Phase 1: 시전자 기술 선언 및 기합 (2프레임 - 시전자 이펙트 일체 없음)
      // - 유저 요청: "발사직전 이펙트같은거 제거, 발사 이펙트 제거"
      // - 시전자는 제자리에서 가벼운 기합 동작만 취하고 어떤 이펙트도 발생하지 않음
      // ======================================================================
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 2, 1.02, 0.98),
        showEffect: false,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.0,
        phaseId: "waterfall-cast-1",
        phaseName: "1. 시전자 기술 발동 기합",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, -2, 0.98, 1.02),
        showEffect: false,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.0,
        phaseId: "waterfall-cast-2",
        phaseName: "2. 시전자 기술 집중",
      },

      // ======================================================================
      // Phase 2: 상대방 발밑에서 거대한 수직 폭포 용솟음 & 공중 넉업 강타 (Step 2 - 10프레임 웅장한 물줄기 지속)
      // - [유저 요구 100% 반영]: "지속시간 조금만 더 늘려보자"
      // - 폭포수가 상공 끝까지 솟구쳐 공중 넉업 체공 및 격류 맹타를 장시간 묵직하게 유지
      // ======================================================================
      // 3. 상대 발밑 지면 수압 응축 분출 개시
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...targetOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.10,
        phaseId: "waterfall-erupt-1",
        phaseName: "3. 상대 발밑 거대 수직 폭포 분출 개시!",
      },
      // 4. 폭포가 수직으로 맹렬히 솟구침 & 1차 넉업 타격
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...targetOff(0, -18, 0.96, 1.04),
        showEffect: true,
        hitFlash: true,
        moveStep: 2,
        effectProgress: 0.22,
        phaseId: "waterfall-erupt-2",
        phaseName: "4. 수직 폭포 상승 강타 & 공중 넉업!",
      },
      // 5. 폭포가 상공 끝까지 완전히 뚫고 치솟으며 상공 넉업 체공
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...targetOff(0, -38, 0.94, 1.08),
        showEffect: true,
        hitFlash: true,
        moveStep: 2,
        effectProgress: 0.38,
        phaseId: "waterfall-erupt-3",
        phaseName: "5. 상공 최고점 폭포수 관통 (공중 체공)",
      },
      // 6. 상공 최고점에서 수류의 강력한 소용돌이 타격 1
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...targetOff(0, -42, 0.94, 1.08),
        showEffect: true,
        hitFlash: true,
        moveStep: 2,
        effectProgress: 0.52,
        phaseId: "waterfall-erupt-4",
        phaseName: "6. 최고점 격류 소용돌이 타격 (1)",
      },
      // 7. 상공 최고점 격류 맹타 유지 (물줄기 지속감 극대화 1)
      {
        ...baseFrame,
        delay: 105,
        ...cOff(0, 0),
        ...targetOff(1, -44, 0.93, 1.09),
        showEffect: true,
        hitFlash: true,
        moveStep: 2,
        effectProgress: 0.65,
        phaseId: "waterfall-erupt-4-sustain-1",
        phaseName: "7. 상공 최고점 고압 폭포수 유지 & 격류 맹타 (2)",
      },
      // 8. 상공 최고점 격류 맹타 유지 (물줄기 지속감 극대화 2)
      {
        ...baseFrame,
        delay: 105,
        ...cOff(0, 0),
        ...targetOff(-1, -45, 0.94, 1.08),
        showEffect: true,
        hitFlash: true,
        moveStep: 2,
        effectProgress: 0.76,
        phaseId: "waterfall-erupt-4-sustain-2",
        phaseName: "8. 상공 최고점 초고압 폭포수 관통 유지 (3)",
      },
      // 9. 상공 최고점 최대 수압 소용돌이 맹타
      {
        ...baseFrame,
        delay: 105,
        ...cOff(0, 0),
        ...targetOff(2, -43, 0.93, 1.09),
        showEffect: true,
        hitFlash: true,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "waterfall-erupt-4-sustain-3",
        phaseName: "9. 초고압 격류 소용돌이 맹타 (4)",
      },
      // 10. 폭포 정상 초고압 소용돌이 & 피격자 진동
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...targetOff(-2, -40, 0.95, 1.06),
        showEffect: true,
        hitFlash: true,
        moveStep: 2,
        effectProgress: 0.92,
        phaseId: "waterfall-erupt-5-peak",
        phaseName: "10. 초고압 폭포수 피크 & 피격자 맹타",
      },
      // 11. 폭포 정상 쇄파 개시 & 피격자 풀죽음 흔들림
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...targetOff(-2, -34, 1.02, 0.98),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.97,
        phaseId: "waterfall-erupt-5",
        phaseName: "11. 폭포 정상 쇄파 개시 & 피격자 풀죽음 흔들림",
      },
      // 12. 정상 포말 폭발 개시 & 하강 전환
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...targetOff(1, -22, 1.04, 0.96),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "waterfall-erupt-6",
        phaseName: "12. 정상 포말 대폭발 & 하강 전환",
      },

      // ======================================================================
      // Phase 3: 정상 포말 대폭발 & 비산 수적 & 피격자 지면 착지 (Step 3 - 7프레임)
      // ======================================================================
      // 13. 상공 백색 포말 사방 파열 & 비산 물방울 쇄도
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...targetOff(0, -12, 1.02, 0.98),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.18,
        phaseId: "waterfall-splash-1",
        phaseName: "13. 상공 백색 포말 파열 & 비산 물방울",
      },
      // 14. 피격자 지면 하강 & 스쿼시 충격
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...targetOff(0, 4, 1.08, 0.92),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.36,
        phaseId: "waterfall-splash-2",
        phaseName: "14. 피격자 지면 착지 & 충격 흡수",
      },
      // 15. 바닥 거대 수면 파문 확산 & 포말 비산
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...targetOff(0, 1, 1.03, 0.97),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.54,
        phaseId: "waterfall-splash-3",
        phaseName: "15. 바닥 거대 수면 파문 확산",
      },
      // 16. 거대 파문 확산 & 쏟아지는 물줄기 잔향
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...targetOff(0, 0, 1.01, 0.99),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.72,
        phaseId: "waterfall-splash-3-sustain",
        phaseName: "16. 침수 수면 파문 확산 & 잔류 폭포수",
      },
      // 17. 물방울 비산 낙하 & 수면 안착
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...targetOff(0, 0, 1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.88,
        phaseId: "waterfall-splash-4",
        phaseName: "17. 물방울 비산 낙하 & 안착",
      },
      // 18. 잔잔한 수면 파문 & 수증기 기화 소멸
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...targetOff(0, 0, 1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.96,
        phaseId: "waterfall-splash-5",
        phaseName: "18. 잔잔한 수면 파문 & 물방울 소멸",
      },
      // 19. 복귀 완료 & 안정화
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0, 1.00, 1.00),
        ...targetOff(0, 0, 1.00, 1.00),
        showEffect: false,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "waterfall-recover",
        phaseName: "19. 배틀 안정화 복귀",
      },
    ];
  },
};
