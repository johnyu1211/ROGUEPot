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
      // 1. [초고속 발사 시작]: 시전자로부터 링 광선 사출 시작 (80ms, tail: 0.0)
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.98, y: 1.02 } : undefined,
        eScale: !isP ? { x: 0.98, y: 1.02 } : undefined,
        showEffect: true,
        moveStep: 1,
        dimAlpha: 0.58,
        auroraSkyAlpha: 0.60,
        leaderT: 0.38,
        tailT: 0.00,
        beamT: 0.38,
        streamPhase: 0,
        phaseId: "aurora-launch-1",
        phaseName: "1. 링 광선 사출 시작 (0.00 ~ 0.38, 80ms)",
      },
      // 2. [지속 발사 전개]: 시전자에서 계속 뿜어져 나오며 전방 확장 (90ms, tail: 0.0 유지!)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        moveStep: 2,
        dimAlpha: 0.74,
        auroraSkyAlpha: 0.85,
        leaderT: 0.65,
        tailT: 0.00,
        beamT: 0.65,
        streamPhase: 1,
        phaseId: "aurora-launch-2",
        phaseName: "2. 링 광선 지속 사출 전개 (0.00 ~ 0.65, 90ms)",
      },
      // 3. [최대 발사 유지]: 시전자에서 지속 사출 유지되며 빔 전체 최장 길이 도달 (100ms, tail: 0.0 유지!)
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 0, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -3 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.97, y: 1.03 } : undefined,
        eScale: !isP ? { x: 0.97, y: 1.03 } : undefined,
        showEffect: true,
        moveStep: 3,
        dimAlpha: 0.82,
        auroraSkyAlpha: 1.00,
        leaderT: 0.85,
        tailT: 0.00,
        beamT: 0.85,
        streamPhase: 2,
        phaseId: "aurora-launch-3",
        phaseName: "3. 링 광선 최대 지속 사출 (0.00 ~ 0.85, 100ms)",
      },
      // 4. [발사 완료 & 분리 비행]: 시전자 사출 종료, 링 패킷이 분리되어 뭉쳐지기 시작 (120ms)
      {
        ...baseFrame,
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 4,
        dimAlpha: 0.82,
        auroraSkyAlpha: 1.00,
        leaderT: 0.95,
        tailT: 0.45,
        beamT: 0.95,
        streamPhase: 3,
        phaseId: "aurora-decel-bunch-1",
        phaseName: "4. 시전자 분리 & 후미 급가속 뭉쳐짐 (0.45 ~ 0.95, 120ms)",
      },
      // 5. [적 도달 극감속 & 링 완전 밀집 클러스터]: 적 앞에서 링 전체가 빽빽하게 뭉침 (140ms)
      {
        ...baseFrame,
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 5,
        dimAlpha: 0.82,
        auroraSkyAlpha: 1.00,
        leaderT: 1.00,
        tailT: 0.88,
        beamT: 1.00,
        streamPhase: 4,
        phaseId: "aurora-max-bunch",
        phaseName: "5. 적 직전 극감속 & 링 완전 뭉쳐짐 (0.88 ~ 1.00, 140ms)",
      },
      // 6. [뭉쳐진 링 클러스터 타격 & 접촉 파열]: 적 몸체에 응축 충돌 (140ms)
      {
        ...baseFrame,
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 2, y: -1 } : { x: -2, y: 1 },
        showEffect: true,
        moveStep: 6,
        dimAlpha: 0.82,
        auroraSkyAlpha: 0.95,
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
        dimAlpha: 0.70,
        auroraSkyAlpha: 0.75,
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
        dimAlpha: 0.48,
        auroraSkyAlpha: 0.45,
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
        dimAlpha: 0.20,
        auroraSkyAlpha: 0.18,
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
