// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import {
  drawAuroraBeamEffect,
  drawAuroraBeamBehindEffect,
} from "../../../renderers/moves/gen1/move061_064.js";

/**
 * 062: 오로라빔 (Aurora Beam)
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. "우리 환상빔을 그대로 가져와서 적용해봐":
 *    - 환상빔의 연속 링 빔 + 원뿔형 확장 + 사이키델릭 5색 팔레트 + 에너지 주입 및 충격파 폭발을 기본 베이스로 함
 * 2. "대신 검정색 필터는 오로라빔에 적용":
 *    - 전체 화면 딤 필터(dimAlpha: 0.40 -> 0.65 -> 0.0) 적용
 *    - ⚠️ 상대 시전 시 / 카메라 줌&팬 시 필터 잘림 원천 차단 (초광역 바운드 -10000, -10000, 20000, 20000)
 * 3. "링의 각도만 서로 다르게":
 *    - 각 링마다 다양한 3D 틸트 각도(-42°, +28°, -20°, +52° 등)로 비틀려 입체적으로 날아감
 * 4. "속도는 적에게 가까워질수록 느려지게":
 *    - 시전자 발사 시 고속 사출(0.48) ➔ 중거리 쾌속 비행(0.74, +0.26) ➔ 적 접근 감속(0.88, +0.14) ➔ 적 코앞 감속(0.96, +0.08) ➔ 부드러운 안착(1.00, +0.04)
 *    - 대상에 다가갈수록 확실하게 속도가 감속(Ease-out Deceleration)되는 연출
 */
export const auroraBeamMove: BattleMoveAnimation = {
  num: 62,
  key: "aurora-beam",
  nameKo: "오로라빔",
  nameEn: "Aurora Beam",
  type: "ice",
  category: "special",
  camera: { type: "target", zoom: 1.30 },
  drawBehindEffect: drawAuroraBeamBehindEffect,
  drawEffect: drawAuroraBeamEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    return [
      // 1. [초고속 발사]: 시전자로부터 순간 사출! (65ms, 40% 암전)
      // 선두 0.45까지 번개처럼 전개, 후미 0.0 (시전자에서 발사)
      {
        ...baseFrame,
        delay: 65,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.98, y: 1.02 } : undefined,
        eScale: !isP ? { x: 0.98, y: 1.02 } : undefined,
        showEffect: true,
        moveStep: 1,
        dimAlpha: 0.40,
        leaderT: 0.45,
        tailT: 0.00,
        beamT: 0.45,
        streamPhase: 0,
        phaseId: "aurora-launch",
        phaseName: "1. 링 광선 초고속 발사 (0.45까지 전개, 65ms)",
      },
      // 2. [발사 종료 & 비행 이탈]: 시전자와 분리되어 링 패킷 독립 비행 시작 (100ms)
      // 선두 0.68, 후미 0.28 (시전자 몸체에서 완전히 떨어져 공중 비행)
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        moveStep: 2,
        dimAlpha: 0.60,
        leaderT: 0.68,
        tailT: 0.28,
        beamT: 0.68,
        streamPhase: 1,
        phaseId: "aurora-mid-flight",
        phaseName: "2. 시전자 이탈 및 중거리 비행 (0.28 ~ 0.68, 100ms)",
      },
      // 3. [선두 감속 돌입 & 후미 접근]: 선두가 감속하며 링 간격 축소 시작 (130ms)
      // 선두 0.83 (+0.15 감속), 후미 0.58 (+0.30 접근, 간격 0.40 -> 0.25로 축소!)
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.02, y: 0.98 } : undefined,
        eScale: !isP ? { x: 1.02, y: 0.98 } : undefined,
        showEffect: true,
        moveStep: 3,
        dimAlpha: 0.65,
        leaderT: 0.83,
        tailT: 0.58,
        beamT: 0.83,
        streamPhase: 2,
        phaseId: "aurora-decel-bunch-1",
        phaseName: "3. 선두 감속 & 링 간격 압축 시작 (0.58 ~ 0.83, 130ms)",
      },
      // 4. [적 접근 급감속 & 링 밀집 뭉쳐짐]: 선두가 급감속하며 뒤 링들이 바짝 뭉침 (150ms)
      // 선두 0.94 (+0.11), 후미 0.78 (+0.20, 간격 0.25 -> 0.16으로 초밀집!)
      {
        ...baseFrame,
        delay: 150,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 4,
        dimAlpha: 0.65,
        leaderT: 0.94,
        tailT: 0.78,
        beamT: 0.94,
        streamPhase: 3,
        phaseId: "aurora-decel-bunch-2",
        phaseName: "4. 적 접근 급감속 & 링 밀집 뭉쳐짐 (0.78 ~ 0.94, 150ms)",
      },
      // 5. [적 도달 극감속 크리핑 & 최대 뭉쳐짐]: 링 전체가 하나로 뭉쳐진 고밀도 클러스터 형성 (160ms)
      // 선두 1.00 (+0.06), 후미 0.90 (+0.12, 간격 0.10! 적 앞에서 완벽히 뭉쳐짐)
      {
        ...baseFrame,
        delay: 160,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 5,
        dimAlpha: 0.65,
        leaderT: 1.00,
        tailT: 0.90,
        beamT: 1.00,
        streamPhase: 4,
        phaseId: "aurora-max-bunch",
        phaseName: "5. 적 직전 극감속 & 링 완전 뭉쳐짐 (0.90 ~ 1.00, 160ms)",
      },
      // 6. [뭉쳐진 링 클러스터 타격 & 접촉 파열]: 적 몸체에 응축 충돌 (140ms)
      // 선두 1.00, 후미 0.96 (초고밀도 압축 타격, 1차 폭발 시작)
      {
        ...baseFrame,
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 2, y: -1 } : { x: -2, y: 1 },
        showEffect: true,
        moveStep: 6,
        dimAlpha: 0.65,
        leaderT: 1.00,
        tailT: 0.96,
        beamT: 1.00,
        streamPhase: 5,
        beamAlpha: 0.85,
        psyBurstR: 28,
        burstAlpha: 0.95,
        phaseId: "aurora-impact-hit",
        phaseName: "6. 뭉쳐진 링 클러스터 타격 & 1차 파열 (140ms)",
      },
      // 7. [충격파 대폭발 & 피격 섬광 작렬]: 타격 폭발, hitFlash, 넉백 (90ms)
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -4, y: 2 } : { x: 4, y: -2 },
        hitFlash: isHit,
        targetPurpleLevel: isHit ? 0.85 : 0,
        showEffect: true,
        moveStep: 7,
        dimAlpha: 0.55,
        leaderT: 1.00,
        tailT: 1.00,
        beamT: 1.00,
        streamPhase: 6,
        beamAlpha: 0.30,
        psyBurstR: 62,
        burstAlpha: 0.85,
        phaseId: "aurora-burst",
        phaseName: "7. 오로라 충격파 대폭발 & 피격 섬광 (90ms)",
      },
      // 8. [충격파 확산]: 대형 팽창 파문 (90ms)
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 5, y: -2 } : { x: -5, y: 2 },
        targetPurpleLevel: isHit ? 0.50 : 0,
        showEffect: true,
        moveStep: 8,
        dimAlpha: 0.40,
        leaderT: 1.00,
        tailT: 1.00,
        beamT: 1.00,
        streamPhase: 7,
        beamAlpha: 0.0,
        psyBurstR: 88,
        burstAlpha: 0.50,
        phaseId: "aurora-expand",
        phaseName: "8. 충격파 원 확산 전개 (90ms)",
      },
      // 9. [잔향 소멸 & 암전 해제]: (90ms)
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        targetPurpleLevel: isHit ? 0.20 : 0,
        showEffect: true,
        moveStep: 9,
        dimAlpha: 0.15,
        leaderT: 1.00,
        tailT: 1.00,
        beamT: 1.00,
        streamPhase: 8,
        beamAlpha: 0.0,
        psyBurstR: 110,
        burstAlpha: 0.15,
        phaseId: "aurora-fade",
        phaseName: "9. 오로라 충격파 소멸 및 암전 해제 (90ms)",
      },
      // 10. [기술 종료]: (60ms)
      {
        ...baseFrame,
        delay: 60,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pRot: 0,
        eRot: 0,
        showEffect: false,
        moveStep: 10,
        dimAlpha: 0.0,
        phaseId: "aurora-end",
        phaseName: "10. 기술 종료 및 기본 스탠스 복귀 (60ms)",
      },
    ];
  },
};
