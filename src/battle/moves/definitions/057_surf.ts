// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawSurfEffect, drawSurfBehindEffect } from "../../../renderers/moves/gen1/move057_060.js";

/**
 * 057: 파도타기 (Surf) - 5세대 공식 배틀 연출
 * 
 * Concept (5세대 블랙/화이트 완벽 재현):
 * 1. 시전자 발밑 융기 수면 형성 및 파도타기 도약 (Frames 1~2)
 *    - 발밑에서 솟구치는 오션 블루 수류 마운드 & 순백 포말
 *    - 시전 포켓몬 공중 도약 및 파도 머리 탑승 (pOffset.y: -22px)
 * 2. 전장을 가로지르는 거대한 해일 전진 (Frames 3~5)
 *    - 베지에 곡선 기반의 웅장한 수벽 본체 & 꺾여 말려 들어가는 순백 파도 머리(Curled Breaker Lip)
 *    - 심해 오션 블루 수벽 후면 레이어 및 파도 표면 아쿠아 스트림라인
 *    - 전방으로 뿜어져 나가는 미세 수무와 비산 스프레이
 * 3. 대상 포켓몬 위로 수직 붕괴 직격 낙하 및 전장 침수 (Frames 6~8)
 *    - 톤 단위의 해일이 대상을 완전히 덮쳐 붕괴하는 수직 낙하 대폭포
 *    - 격렬한 카메라 지진 진동(cameraPan) 및 대상 넉백(targetShake), 푸른 피격 틴트
 *    - 사방으로 뿜어져 나가는 24개의 테두리 없는 포물선 비산 수적
 * 4. 바닥 침수 수면 및 잔잔하게 퍼져나가는 동심원 파문 & 착지 복귀 (Frames 9~12)
 *    - 전장 바닥의 넓은 침수 풀과 4중 동심원 수면 파문, 부유 포말
 *    - 시전자 매끄러운 원위치 착지 및 카메라 중립 복귀
 */
export const surfMove: BattleMoveAnimation = {
  num: 57,
  key: "surf",
  nameKo: "파도타기",
  nameEn: "Surf",
  type: "water",
  category: "special",
  camera: { type: "none" },
  drawBehindEffect: drawSurfBehindEffect,
  drawEffect: drawSurfEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    const dir = isP ? 1 : -1;

    const targetShake = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const attackerPos = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    const attackerScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    const defenderFocal = isP
      ? { x: 348, y: 170 } // 적 포켓몬 중심
      : { x: 140, y: 270 }; // 플레이어 포켓몬 중심

    return [
      // 1. 발밑 웅덩이 발원 & 수면 사선 물 혀 (Frame 0) - [유저 요청]: 물 뿜어져 나올 때부터 화면 흔들림
      {
        ...baseFrame,
        delay: 55,
        ...attackerScale(1.0, 1.0),
        ...attackerPos(0, 0),
        cameraZoom: 1.0,
        cameraFocal: null,
        cameraPan: { x: dir * 1.5, y: -1.2 },
        showEffect: true,
        moveStep: 1,
        waveFrame: 0,
        puddleProgress: 0.20,
        puddleRadius: 30,
        puddleAlpha: 0.45,
        vaporAlpha: 0.35,
        spoutAlpha: 0.90,
        surfTintAlpha: 0.04,
        phaseId: "surf-wave",
        phaseName: "1. 웅덩이 발원 & 수면 사선 물 혀 (Frame 0)",
      },
      // 2. 물 혀 상승 & 융기 (Frame 1) - [유저 요청]: 파도 발생 후 적 포켓몬 포커싱 & 화면 흔들림
      {
        ...baseFrame,
        delay: 55,
        ...attackerScale(1.0, 1.0),
        ...attackerPos(dir * -1.0, 0.5),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: -dir * 2.8, y: 2.2 },
        showEffect: true,
        moveStep: 1,
        waveFrame: 1,
        puddleProgress: 0.35,
        puddleRadius: 42,
        puddleAlpha: 0.55,
        vaporAlpha: 0.40,
        spoutAlpha: 0.95,
        surfTintAlpha: 0.06,
        phaseId: "surf-wave",
        phaseName: "2. 물 혀 상승 & 융기 (Frame 1)",
      },
      // 3. 전방 경사 융기 물기둥 (Frame 2) - 적 포켓몬 포커싱 & 화면 흔들림
      {
        ...baseFrame,
        delay: 60,
        ...attackerScale(1.0, 1.0),
        ...attackerPos(dir * -1.5, 1.0),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: dir * 3.6, y: -3.0 },
        showEffect: true,
        moveStep: 1,
        waveFrame: 2,
        puddleProgress: 0.50,
        puddleRadius: 54,
        puddleAlpha: 0.65,
        vaporAlpha: 0.45,
        spoutAlpha: 1.0,
        surfTintAlpha: 0.08,
        phaseId: "surf-wave",
        phaseName: "3. 전방 경사 융기 물기둥 (Frame 2)",
      },
      // 4. 전방 굴곡 커브 & 순백 포말 맨틀 발현 (Frame 3) - 적 포켓몬 포커싱 & 화면 흔들림
      {
        ...baseFrame,
        delay: 60,
        ...attackerScale(1.0, 1.0),
        ...attackerPos(dir * 1.5, -1.0),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: -dir * 4.2, y: 3.6 },
        showEffect: true,
        moveStep: 1,
        waveFrame: 3,
        puddleProgress: 0.65,
        puddleRadius: 65,
        puddleAlpha: 0.72,
        vaporAlpha: 0.50,
        spoutAlpha: 1.0,
        surfTintAlpha: 0.10,
        phaseId: "surf-wave",
        phaseName: "4. 전방 굴곡 커브 & 순백 포말 맨틀 발현 (Frame 3)",
      },
      // 5. 오목 배럴 페이스 & 포말 갈퀴 드리움 (Frame 4) - 적 포켓몬 포커싱 & 화면 흔들림
      {
        ...baseFrame,
        delay: 65,
        ...attackerScale(1.0, 1.0),
        ...attackerPos(dir * 2.0, -1.5),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: dir * 4.8, y: -4.0 },
        showEffect: true,
        moveStep: 1,
        waveFrame: 4,
        puddleProgress: 0.80,
        puddleRadius: 74,
        puddleAlpha: 0.78,
        vaporAlpha: 0.55,
        spoutAlpha: 1.0,
        surfTintAlpha: 0.12,
        phaseId: "surf-wave",
        phaseName: "5. 오목 배럴 페이스 & 포말 갈퀴 드리움 (Frame 4)",
      },
      // 6. 적 방향 립 급강하 & C-곡선 배럴 (Frame 5) - 적 포켓몬 포커싱 & 화면 흔들림
      {
        ...baseFrame,
        delay: 65,
        ...attackerScale(1.0, 1.0),
        ...attackerPos(dir * -2.0, 1.2),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: -dir * 5.2, y: 4.5 },
        showEffect: true,
        moveStep: 1,
        waveFrame: 5,
        puddleProgress: 0.90,
        puddleRadius: 80,
        puddleAlpha: 0.80,
        vaporAlpha: 0.60,
        spoutAlpha: 1.0,
        surfTintAlpha: 0.14,
        phaseId: "surf-wave",
        phaseName: "6. 적 방향 립 급강하 & C-곡선 배럴 (Frame 5)",
      },
      // 7. 배럴 나선 와류 심화 (Frame 6) - 적 포켓몬 포커싱 & 화면 흔들림
      {
        ...baseFrame,
        delay: 70,
        ...attackerScale(1.0, 1.0),
        ...attackerPos(dir * 2.0, -1.5),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: dir * 5.6, y: -5.0 },
        showEffect: true,
        moveStep: 1,
        waveFrame: 6,
        puddleProgress: 1.0,
        puddleRadius: 80,
        puddleAlpha: 0.80,
        vaporAlpha: 0.60,
        spoutAlpha: 1.0,
        surfTintAlpha: 0.16,
        phaseId: "surf-wave",
        phaseName: "7. 배럴 나선 와류 심화 (Frame 6)",
      },
      // 8. 정점 거대 노틸러스 배럴 대해일 (Frame 7) - 적 포켓몬 포커싱 & 화면 흔들림
      {
        ...baseFrame,
        delay: 75,
        ...attackerScale(1.0, 1.0),
        ...attackerPos(dir * 2.2, -1.8),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: -dir * 6.0, y: 5.5 },
        showEffect: true,
        moveStep: 1,
        waveFrame: 7,
        puddleProgress: 1.0,
        puddleRadius: 80,
        puddleAlpha: 0.80,
        vaporAlpha: 0.60,
        spoutAlpha: 1.0,
        surfTintAlpha: 0.18,
        phaseId: "surf-wave",
        phaseName: "8. 정점 거대 노틸러스 배럴 대해일 (Frame 7)",
      },
      // 9a. 해일 격돌 직격 & 수증기 폭발 초탄 (Step 9a) - [유저 요청]: 화면 흔들림 극대화
      {
        ...baseFrame,
        delay: 65,
        ...attackerPos(0, 0),
        ...(isHit ? targetShake(dir * 6.5, -4.5) : {}),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: dir * 9.5, y: -8.0 },
        showEffect: true,
        moveStep: 9,
        oceanFloodAlpha: 1.0,
        splashGeyserProgress: 0.40,
        dropletsAlpha: 0.60,
        whiteTransitionAlpha: 0.55,
        phaseId: "surf-impact",
        phaseName: "9a. 해일 격돌 직격 & 수증기 폭발 (Step 9a)",
      },
      // 9b. 격돌 반동 리코일 & 화이트아웃 틴트 (Step 9b)
      {
        ...baseFrame,
        delay: 65,
        ...attackerPos(0, 0),
        ...(isHit ? targetShake(-dir * 7.5, 5.0) : {}),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: -dir * 9.0, y: 7.5 },
        showEffect: true,
        moveStep: 9,
        oceanFloodAlpha: 1.0,
        splashGeyserProgress: 0.70,
        dropletsAlpha: 0.85,
        whiteTransitionAlpha: 0.35,
        phaseId: "surf-impact",
        phaseName: "9b. 격돌 반동 리코일 & 화이트아웃 (Step 9b)",
      },
      // 10. 5세대 공식 배틀 연출: 대지 침수 해양 & 최대 분출 물기둥 (Step 10)
      {
        ...baseFrame,
        delay: 80,
        ...attackerPos(0, 0),
        ...(isHit ? targetShake(dir * 8.0, -5.5) : {}),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: dir * 8.5, y: -6.8 },
        showEffect: true,
        moveStep: 10,
        oceanFloodAlpha: 1.0,
        splashGeyserProgress: 1.0,
        dropletsAlpha: 1.0,
        whiteTransitionAlpha: 0.0,
        phaseId: "surf-flood",
        phaseName: "10. 대지 침수 해양 & 최대 분출 물기둥 (Step 10)",
      },
      // 11. 침수 수면 위 피격 타격 진동 & 상공 비산 수적 (Step 11)
      {
        ...baseFrame,
        delay: 85,
        ...attackerPos(0, 0),
        ...(isHit ? targetShake(-dir * 6.8, 4.5) : {}),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: -dir * 7.4, y: 5.8 },
        hitFlash: false,
        targetBlueTint: false,
        showEffect: true,
        moveStep: 11,
        oceanFloodAlpha: 0.98,
        splashGeyserProgress: 0.82,
        dropletsAlpha: 0.90,
        phaseId: "surf-flood",
        phaseName: "11. 침수 수면 위 피격 타격 진동 (Step 11)",
      },
      // 12. 충돌 수증기 비산 확산 & 소용돌이 쇄도 (Step 12)
      {
        ...baseFrame,
        delay: 85,
        ...attackerPos(0, 0),
        ...(isHit ? targetShake(dir * 5.3, -3.3) : {}),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: dir * 5.8, y: -4.4 },
        showEffect: true,
        moveStep: 12,
        oceanFloodAlpha: 0.85,
        splashGeyserProgress: 0.46,
        dropletsAlpha: 0.68,
        phaseId: "surf-flood",
        phaseName: "12. 충돌 수증기 비산 확산 & 쇄도 (Step 12)",
      },
      // 13. 잔잔한 해양 수면 물결 & 지속 지진 여진 (Step 13)
      {
        ...baseFrame,
        delay: 85,
        ...attackerPos(0, 0),
        ...(isHit ? targetShake(-dir * 3.3, 2.0) : {}),
        cameraZoom: 1.25,
        cameraFocal: defenderFocal,
        cameraPan: { x: -dir * 4.0, y: 2.8 },
        showEffect: true,
        moveStep: 13,
        oceanFloodAlpha: 0.58,
        splashGeyserProgress: 0.15,
        dropletsAlpha: 0.32,
        phaseId: "surf-flood",
        phaseName: "13. 해양 수면 물결 & 지속 여진 (Step 13)",
      },
      // 14. 해양 수면 서서히 퇴각 & 감쇄 진동 (Step 14)
      {
        ...baseFrame,
        delay: 80,
        ...attackerPos(0, 0),
        ...(isHit ? targetShake(dir * 1.5, -1.0) : {}),
        cameraZoom: 1.14,
        cameraFocal: defenderFocal,
        cameraPan: { x: dir * 2.2, y: -1.5 },
        showEffect: true,
        moveStep: 14,
        oceanFloodAlpha: 0.20,
        splashGeyserProgress: 0.0,
        dropletsAlpha: 0.0,
        phaseId: "surf-flood",
        phaseName: "14. 해양 수면 퇴각 & 감쇄 진동 (Step 14)",
      },
      // 15. 지면 안정화 미세 여운 (Step 15)
      {
        ...baseFrame,
        delay: 75,
        ...attackerPos(0, 0),
        cameraZoom: 1.05,
        cameraFocal: defenderFocal,
        cameraPan: { x: dir * 1.0, y: -0.6 },
        showEffect: false,
        moveStep: 15,
        oceanFloodAlpha: 0.0,
        phaseId: "surf-settle",
        phaseName: "15. 지면 안정화 미세 여운",
      },
      // 16. 기술 종료 및 기본 스탠스 복귀 (Step 16)
      {
        ...baseFrame,
        delay: 70,
        ...attackerPos(0, 0),
        cameraZoom: 1.0,
        cameraFocal: null,
        cameraPan: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 16,
        oceanFloodAlpha: 0.0,
        phaseId: "surf-finish",
        phaseName: "16. 기술 종료 및 기본 스탠스 복귀",
      },
    ];
  },
};
