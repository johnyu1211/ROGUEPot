// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawPsybeamEffect, drawPsybeamBehindEffect } from "../../../renderers/moves/gen1/move057_060.js";

/**
 * 060: 환상빔 (Psybeam)
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. 초음파(Supersonic, 048)와 동일한 비행/적재/공명 메커니즘을 100% 적용
 * 2. 링 색상을 환상빔 고유의 다채로운 사이키델릭 무지개 팔레트(핑크, 시안, 옐로우, 바이올렛, 민트, 마젠타)로 변경
 * 3. 링들이 대상에 차곡차곡 적재된 후, 중심이 투명하고 외곽이 짙어지는 사이킥 원형 충격파(psyBurstR)가 확산 작렬
 * 4. 공격 특수 기술에 맞추어 피격 섬광(hitFlash), 사이킥 퍼플 틴트(targetPurpleLevel), 넉백 진동 연계
 * 5. 10% 혼란 부가효과를 상징하는 3D 공전 별무리 및 대상 비틀거림 모션
 */
export const psybeamMove: BattleMoveAnimation = {
  num: 60,
  key: "psybeam",
  nameKo: "환상빔",
  nameEn: "Psybeam",
  type: "psychic",
  category: "special",
  camera: { type: "beam", zoom: 1.30 },
  drawBehindEffect: drawPsybeamBehindEffect,
  drawEffect: drawPsybeamEffect,
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
      // 1. 시전자 환상빔 방출 시작: 시전자로부터 끊어지지 않는 링 광선이 30%까지 뻗어나감
      {
        ...baseFrame,
        delay: 75,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.98, y: 1.02 } : undefined,
        eScale: !isP ? { x: 0.98, y: 1.02 } : undefined,
        showEffect: true,
        moveStep: 1,
        beamT: 0.30,
        streamPhase: 0,
        phaseId: "psybeam-extend-1",
        phaseName: "1. 환상빔 광선 방출 시작 (30% 연장)",
      },
      // 2. 광선 연속 연장: 시전자에서부터 촘촘한 링들이 이어지며 62%까지 연장
      {
        ...baseFrame,
        delay: 75,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        moveStep: 2,
        beamT: 0.62,
        streamPhase: 1,
        phaseId: "psybeam-extend-2",
        phaseName: "2. 환상빔 광선 연속 연장 (62% 도달)",
      },
      // 3. 광선 상대방 직전 도달: 88%까지 링 광선 연결 전개
      {
        ...baseFrame,
        delay: 75,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.02, y: 0.98 } : undefined,
        eScale: !isP ? { x: 1.02, y: 0.98 } : undefined,
        showEffect: true,
        moveStep: 3,
        beamT: 0.88,
        streamPhase: 2,
        phaseId: "psybeam-extend-3",
        phaseName: "3. 환상빔 광선 대상 도달 직전 (88%)",
      },
      // 4. [상대방에게 닿음!]: 링 광선이 시전자부터 상대방까지 완전히 이어져 관통 연결
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 4,
        beamT: 1.00,
        streamPhase: 3,
        phaseId: "psybeam-connect-hit",
        phaseName: "4. 링 광선 상대방 완전 접촉 연결",
      },
      // 5. 이어진 링 광선 에너지 주입 1: 시전자~상대방 연결 상태로 무지개 사이킥 에너지 지속 주입
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 1, y: 0 } : { x: -1, y: 0 },
        showEffect: true,
        moveStep: 5,
        beamT: 1.00,
        streamPhase: 4,
        phaseId: "psybeam-sustain-1",
        phaseName: "5. 이어진 링 광선 연속 에너지 주입 1",
      },
      // 6. 이어진 링 광선 에너지 주입 2: 접촉부 에너지 응축
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -2, y: 0 } : { x: 2, y: 0 },
        showEffect: true,
        moveStep: 6,
        beamT: 1.00,
        streamPhase: 5,
        phaseId: "psybeam-sustain-2",
        phaseName: "6. 이어진 링 광선 연속 에너지 주입 2",
      },
      // 7. 이어진 링 광선 에너지 주입 3: 전신 압박
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 2, y: -1 } : { x: -2, y: 1 },
        showEffect: true,
        moveStep: 7,
        beamT: 1.00,
        streamPhase: 6,
        phaseId: "psybeam-sustain-3",
        phaseName: "7. 이어진 링 광선 전신 압박 주입",
      },
      // 8. 링 광선 에너지 임계점 공명 진동
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -3, y: 1 } : { x: 3, y: -1 },
        showEffect: true,
        moveStep: 8,
        beamT: 1.00,
        streamPhase: 7,
        phaseId: "psybeam-resonance",
        phaseName: "8. 링 광선 임계점 공명 진동",
      },
      // 9. [접촉점 사이킥 충격파 폭발 시작]: 광선 접촉부에서 충격파 원 팽창
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -4, y: 2 } : { x: 4, y: -2 },
        showEffect: true,
        moveStep: 9,
        beamT: 1.00,
        streamPhase: 8,
        beamAlpha: 0.60,
        psyBurstR: 35,
        burstAlpha: 0.85,
        phaseId: "psybeam-burst-1",
        phaseName: "9. 접촉점 사이킥 충격파 1차 폭발",
      },
      // 10. [사이킥 충격파 대폭발 & 피격]: 섬광 작렬, 보라색 틴트, 넉백
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 5, y: -2 } : { x: -5, y: 2 },
        hitFlash: isHit,
        targetPurpleLevel: isHit ? 0.85 : 0,
        showEffect: true,
        moveStep: 10,
        beamT: 1.00,
        streamPhase: 9,
        beamAlpha: 0.15,
        psyBurstR: 62,
        burstAlpha: 0.65,
        phaseId: "psybeam-burst-2",
        phaseName: "10. 사이킥 충격파 확산 작렬 & 피격",
      },
      // 11. 사이킥 잔향 페이드아웃 (별무리/흔들림 없음)
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pRot: 0,
        eRot: 0,
        targetPurpleLevel: isHit ? 0.25 : 0,
        showEffect: true,
        moveStep: 11,
        psyBurstR: 82,
        burstAlpha: 0.20,
        phaseId: "psybeam-fade",
        phaseName: "11. 사이킥 충격파 소멸 및 잔향 페이드아웃",
      },
      // 12. 기술 종료 및 기본 스탠스 복귀 (완전 정돈)
      {
        ...baseFrame,
        delay: 60,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pRot: 0,
        eRot: 0,
        showEffect: false,
        moveStep: 12,
        phaseId: "psybeam-end",
        phaseName: "12. 기술 종료 및 기본 스탠스 복귀",
      },
    ];
  },
};
