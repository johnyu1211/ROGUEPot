import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawSeismicTossBehindEffect, drawSeismicTossEffect } from "../../../renderers/moves/gen1/move069_072.js";

/**
 * 069: 지구던지기 (Seismic Toss)
 * 
 * 컨셉 (5세대 공식 배틀 & 애니메이션 리자몽의 시그니처 필살기 완벽 구현):
 * 1. 밀착 붙잡기 & 성층권 수직 도약 (Frames 1~3)
 *    - 시전자가 상대 포켓몬에게 초고속 돌진하여 꽉 붙잡음
 *    - 상대를 붙든 채 하늘 높이 수직으로 급상승 도약
 * 2. 우주 성층권 & 푸른 지구 배경 360도 고속 궤도 선회 (Frames 4~6)
 *    - 화면이 짙은 우주 암전으로 전환되며 웅장한 푸른 지구(Earth Globe) 등장
 *    - 두 포켓몬이 지구 주위를 대기 마찰 불꽃/격투 궤적과 함께 맹렬한 속도로 궤도 선회
 * 3. 대기권 돌입 지상 급강하 투척 (Frame 7)
 *    - 지구를 뒤로하고 대지 플랫폼을 향해 수직 초고속 투척 돌입
 * 4. 대지 크레이터 대격돌 & 지진 대폭발 (Frames 8~10)
 *    - 플랫폼 지면에 쾅! 내리꽂히며 거대 분화구 크랙 균열선 형성
 *    - 2중 팽창 충격파 링, 8개의 사방 비산 암석 파편, 스타버스트 섬광 & 격렬한 지진 화면 진동
 * 5. 공중 덤블링 후 원위치 착지 복귀 (Frames 11~12)
 *    - 시전자 관성 공중 덤블링 회전 후 안정적으로 원위치 착지 복귀
 */
export const seismicTossMove: BattleMoveAnimation = {
  num: 69,
  key: "seismic-toss",
  nameKo: "지구던지기",
  nameEn: "Seismic Toss",
  type: "fighting",
  category: "physical",
  camera: { type: "none" },
  drawBehindEffect: drawSeismicTossBehindEffect,
  drawEffect: drawSeismicTossEffect,
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

    // PokéRogue 배틀 필드 절대 기준점
    const pm = { x: 150, y: 280 }; // 플레이어 포켓몬 기준 좌표
    const em = { x: 418, y: 152 }; // 적 포켓몬 기준 좌표

    const casterBase = isP ? pm : em;
    const targetBase = isP ? em : pm;

    // 시전자(caster)와 피격대상(target)의 목표 화면 절대좌표를 pOffset / eOffset으로 변환
    const pos = (casterPos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
      if (isP) {
        return {
          pOffset: { x: Math.round(casterPos.x - pm.x), y: Math.round(casterPos.y - pm.y) },
          eOffset: { x: Math.round(targetPos.x - em.x), y: Math.round(targetPos.y - em.y) },
        };
      } else {
        return {
          pOffset: { x: Math.round(targetPos.x - pm.x), y: Math.round(targetPos.y - pm.y) },
          eOffset: { x: Math.round(casterPos.x - em.x), y: Math.round(casterPos.y - em.y) },
        };
      }
    };

    const scl = (casterScale?: { x: number; y: number }, targetScale?: { x: number; y: number }) => ({
      pScale: isP ? casterScale : targetScale,
      eScale: !isP ? casterScale : targetScale,
    });

    const rot = (casterRot?: number, targetRot?: number) => ({
      pRot: isP ? casterRot : targetRot,
      eRot: !isP ? casterRot : targetRot,
    });

    // 빗맞았을 때 (Miss 처리)
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 110,
          ...pos(
            { x: casterBase.x + (targetBase.x - casterBase.x) * 0.45, y: casterBase.y + (targetBase.y - casterBase.y) * 0.45 },
            targetBase
          ),
          ...rot(dir * -0.15, undefined),
          showEffect: false,
          phaseId: "seismic-miss",
          phaseName: "1. 붙잡기 돌진 빗나감 (110ms)",
        },
        {
          ...baseFrame,
          delay: 130,
          ...pos(
            { x: casterBase.x + (targetBase.x - casterBase.x) * 0.65, y: casterBase.y + (targetBase.y - casterBase.y) * 0.65 },
            targetBase
          ),
          ...rot(dir * 0.25, undefined),
          showEffect: false,
          phaseId: "seismic-miss",
          phaseName: "2. 허공 관통 헛손질 (130ms)",
        },
        {
          ...baseFrame,
          delay: 95,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          pRot: 0,
          eRot: 0,
          showEffect: false,
          phaseId: "seismic-miss",
          phaseName: "3. 정위치 복귀 (95ms)",
        },
      ];
    }

    // 명중 시: 13프레임 완벽 구성 (플레이어/적 시전 완벽 대칭 지원)
    return [
      // ----------------------------------------------------------------------
      // Phase 1: 밀착 붙잡기 & 성층권 수직 급상승 (Frames 1~3)
      // ----------------------------------------------------------------------
      // 1. [초고속 돌진 접근]: 시전자가 상대방을 향해 맹렬하게 쇄도 (85ms)
      {
        ...baseFrame,
        delay: 85,
        ...pos(
          { x: casterBase.x + (targetBase.x - casterBase.x) * 0.60, y: casterBase.y + (targetBase.y - casterBase.y) * 0.60 },
          targetBase
        ),
        ...scl({ x: 1.10, y: 0.90 }, undefined),
        ...rot(dir * -0.12, undefined),
        showEffect: false,
        moveStep: 1,
        phaseId: "seismic-grapple",
        phaseName: "1. 상대를 향해 초고속 돌진 (85ms)",
      },

      // 2. [상대 포켓몬 밀착 붙잡음]: 상대 몸체에 결착하여 꽉 붙잡음! (85ms)
      {
        ...baseFrame,
        delay: 85,
        ...pos(
          { x: targetBase.x + (isP ? -22 : 22), y: targetBase.y - 6 },
          { x: targetBase.x + (isP ? 5 : -5), y: targetBase.y - 4 }
        ),
        ...scl({ x: 0.95, y: 1.05 }, { x: 0.95, y: 1.05 }),
        ...rot(dir * -0.05, dir * 0.05),
        showEffect: false,
        moveStep: 1,
        phaseId: "seismic-grapple",
        phaseName: "2. 상대 포켓몬 밀착 붙잡기 (85ms)",
      },

      // 3. [성층권 수직 급상승 도약]: 상대를 붙잡고 하늘 높이 솟구치며 성층권 진입 (95ms)
      {
        ...baseFrame,
        delay: 95,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        ...pos(
          { x: 235 + (isP ? -15 : 15), y: 50 },
          { x: 240, y: 60 }
        ),
        ...scl({ x: 0.95, y: 1.08 }, { x: 0.95, y: 1.08 }),
        ...rot(dir * -0.10, dir * 0.10),
        showEffect: true,
        moveStep: 2,
        spaceAlpha: 0.60,
        phaseId: "seismic-ascent",
        phaseName: "3. 상대를 붙잡고 성층권 수직 급상승 (95ms)",
      },

      // ----------------------------------------------------------------------
      // Phase 2: 우주 성층권 & 푸른 지구 배경 360도 궤도 선회 (Frames 4~6)
      // ----------------------------------------------------------------------
      // 4. [우주 진입 & 개기일식 천체 등장]: 궤도 3시 ➔ 전면 선회 진입 (95ms)
      {
        ...baseFrame,
        delay: 95,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        ...pos(
          { x: 335 + (isP ? -15 : 15), y: 125 },
          { x: 350, y: 115 }
        ),
        ...scl({ x: 1.05, y: 1.05 }, { x: 0.95, y: 0.95 }),
        ...rot(dir * 0.35, dir * -0.25),
        showEffect: true,
        moveStep: 2,
        spaceAlpha: 1.0,
        earthAlpha: 1.0,
        earthRadius: 68,
        earthCenterX: 240,
        earthCenterY: 122,
        earthRot: 0.0,
        crescentProgress: 0.0,
        diamondAlpha: 0.0,
        orbitAlpha: 1.0,
        orbitAngle: 0.35,
        phaseId: "seismic-orbit",
        phaseName: "4. 우주 진입 & 개기일식 천체 궤도 진입 (95ms)",
      },

      // 5. [지구 주위 360도 고속 루프 선회 1]: 천체 하단 통과 & 마찰 불꽃 궤적 (95ms)
      {
        ...baseFrame,
        delay: 95,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        ...pos(
          { x: 250, y: 200 },
          { x: 275, y: 180 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 0.90, y: 0.90 }),
        ...rot(dir * -0.65, dir * 0.50),
        showEffect: true,
        moveStep: 2,
        spaceAlpha: 1.0,
        earthAlpha: 1.0,
        earthRadius: 68,
        earthCenterX: 240,
        earthCenterY: 122,
        earthRot: 0.28,
        crescentProgress: 0.0,
        diamondAlpha: 0.0,
        orbitAlpha: 1.0,
        orbitAngle: 2.10,
        phaseId: "seismic-orbit",
        phaseName: "5. 일식 천체 360도 고속 루프 선회 (95ms)",
      },

      // 6. [지구 주위 360도 고속 루프 선회 2]: 정점 궤도에서 일식 지면 투척 조준! (85ms)
      {
        ...baseFrame,
        delay: 85,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        ...pos(
          { x: 235, y: 70 },
          { x: 245, y: 80 }
        ),
        ...scl({ x: 0.88, y: 0.88 }, { x: 0.82, y: 0.82 }),
        ...rot(dir * 1.15, dir * -1.05),
        showEffect: true,
        moveStep: 2,
        spaceAlpha: 1.0,
        earthAlpha: 1.0,
        earthRadius: 75,
        earthCenterX: 240,
        earthCenterY: 122,
        earthRot: 0.55,
        crescentProgress: 0.0,
        diamondAlpha: 0.0,
        orbitAlpha: 1.0,
        orbitAngle: 4.25,
        phaseId: "seismic-orbit",
        phaseName: "6. 정점 궤도 선회 & 지상 투척 록온 (85ms)",
      },

      // ----------------------------------------------------------------------
      // Phase 3: 우주 성층권 이탈 & 배틀필드 상공 초고속 수직 급강하 (Frames 7~8)
      // ----------------------------------------------------------------------
      // 7. [성층권 이탈 & 상공 고속 급강하 1단계 (페이드아웃 시작)]: 칠흑의 우주가 서서히 페이드아웃되며 배틀필드 상공에서 쏜살같이 수직 강하! (65ms)
      {
        ...baseFrame,
        delay: 65,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        spaceAlpha: 0.70,
        earthAlpha: 0.0,
        ...pos(
          { x: targetBase.x + (isP ? -25 : 25), y: targetBase.y - 120 },
          { x: targetBase.x, y: targetBase.y - 100 }
        ),
        ...scl({ x: 0.85, y: 1.25 }, { x: 0.85, y: 1.25 }),
        ...rot(dir * 0.20, dir * -0.20),
        showEffect: false,
        moveStep: 3,
        phaseId: "seismic-dive",
        phaseName: "7. 성층권 이탈 & 배틀필드 상공 고속 급강하 (65ms)",
      },

      // 8. [지상 플랫폼 근접 음속 쇄도 2단계 (페이드아웃 완료)]: 필드가 선명하게 드러나며 플랫폼 바로 위까지 급가속 쇄도! 직격 직전 (55ms)
      {
        ...baseFrame,
        delay: 55,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        spaceAlpha: 0.25,
        earthAlpha: 0.0,
        ...pos(
          { x: targetBase.x + (isP ? -25 : 25), y: targetBase.y - 65 },
          { x: targetBase.x, y: targetBase.y - 45 }
        ),
        ...scl({ x: 0.85, y: 1.25 }, { x: 0.85, y: 1.25 }),
        ...rot(dir * 0.15, dir * -0.15),
        showEffect: false,
        moveStep: 3,
        phaseId: "seismic-dive",
        phaseName: "8. 지상 플랫폼 근접 음속 쇄도 (55ms)",
      },

      // ----------------------------------------------------------------------
      // Phase 4: 실제 필드 플랫폼 직격 대격돌 & 지진 대폭발 (Frames 9~11)
      // ----------------------------------------------------------------------
      // 9. [실제 필드 대격돌 직격]: 실제 필드 플랫폼 지면에 쾅! 내리꽂히며 100% 섬광 & 지진 진동 (95ms)
      {
        ...baseFrame,
        delay: 95,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        spaceAlpha: 0.0,
        earthAlpha: 0.0,
        ...pos(
          { x: targetBase.x + (isP ? -35 : 35), y: targetBase.y - 8 },
          { x: targetBase.x, y: targetBase.y + 8 }
        ),
        ...scl({ x: 0.90, y: 1.10 }, { x: 1.25, y: 0.70 }),
        ...rot(dir * 0.15, 0.0),
        hitFlash: true,
        cameraPan: { x: dir * 9.0, y: -8.0 },
        showEffect: true,
        moveStep: 4,
        craterProgress: 0.60,
        craterAlpha: 1.0,
        slamProgress: 0.15,
        slamAlpha: 1.0,
        phaseId: "seismic-impact",
        phaseName: "9. 실제 필드 플랫폼 대격돌 직격 & 지진 진동 (95ms)",
      },

      // 10. [충격파 링 팽창 & 암석 파편 비산]: 실제 필드에 거대 쇼크웨이브 링, 파편 분출 & 리코일 진동 (95ms)
      {
        ...baseFrame,
        delay: 95,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        spaceAlpha: 0.0,
        earthAlpha: 0.0,
        ...pos(
          { x: targetBase.x + (isP ? -55 : 55), y: targetBase.y - 25 },
          { x: targetBase.x, y: targetBase.y + 8 }
        ),
        ...scl({ x: 1.05, y: 0.95 }, { x: 0.85, y: 1.15 }),
        ...rot(dir * 0.75, dir * -0.20),
        hitFlash: false,
        cameraPan: { x: -dir * 8.0, y: 6.5 },
        showEffect: true,
        moveStep: 4,
        craterProgress: 1.0,
        craterAlpha: 1.0,
        slamProgress: 0.55,
        slamAlpha: 1.0,
        phaseId: "seismic-impact",
        phaseName: "10. 실제 필드 충격파 링 팽창 & 암석 파편 대분출 (95ms)",
      },

      // 11. [암석 파편 비산 & 시전자 공중 덤블링]: 시전자 관성 공중제비 & 상대 넉백 기절 (85ms)
      {
        ...baseFrame,
        delay: 85,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        spaceAlpha: 0.0,
        earthAlpha: 0.0,
        ...pos(
          { x: casterBase.x + (targetBase.x - casterBase.x) * 0.35, y: casterBase.y - 65 },
          { x: targetBase.x + (isP ? 6 : -6), y: targetBase.y + 4 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
        ...rot(dir * 1.50, 0.0),
        cameraPan: { x: dir * 4.0, y: -3.0 },
        showEffect: true,
        moveStep: 4,
        craterProgress: 1.0,
        craterAlpha: 0.75,
        slamProgress: 0.90,
        slamAlpha: 0.55,
        phaseId: "seismic-impact",
        phaseName: "11. 암석 파편 비산 & 공중 덤블링 (85ms)",
      },

      // ----------------------------------------------------------------------
      // Phase 5: 원위치 착지 복귀 (Frames 12~13)
      // ----------------------------------------------------------------------
      // 12. [원위치 포물선 하강 착지]: 시전자 플랫폼 복귀 하강 (80ms)
      {
        ...baseFrame,
        delay: 80,
        ...pos(
          { x: casterBase.x + (targetBase.x - casterBase.x) * 0.12, y: casterBase.y - 18 },
          targetBase
        ),
        ...rot(dir * 0.35, 0),
        cameraPan: { x: -dir * 1.5, y: 1.0 },
        showEffect: true,
        moveStep: 5,
        craterProgress: 1.0,
        craterAlpha: 0.35,
        slamAlpha: 0.0,
        phaseId: "seismic-settle",
        phaseName: "12. 원위치 포물선 하강 착지 (80ms)",
      },

      // 13. [기술 종료 및 기본 스탠스 복귀]: 완전 정위치 및 카메라 중립 복귀 (75ms)
      {
        ...baseFrame,
        delay: 75,
        ...pos(casterBase, targetBase),
        ...rot(0, 0),
        cameraPan: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 5,
        craterAlpha: 0.0,
        phaseId: "seismic-settle",
        phaseName: "13. 기술 종료 및 기본 스탠스 복귀 (75ms)",
      },
    ];
  },
};
