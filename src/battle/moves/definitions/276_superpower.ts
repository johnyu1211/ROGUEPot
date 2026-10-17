// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSuperpowerBehindEffect,
  drawSuperpowerEffect,
} from "../../../renderers/moves/gen1/move273_276.js";

/**
 * 💥 276: 엄청난힘 (Superpower / ばかぢから) - 격투 타입 물리 공격 기술
 *
 * 위력: 120 / 명중: 100 / PP: 5 / 접촉: O
 * 설명: 온몸의 엄청난 힘을 짜내어 상대를 공격한다. 자신의 공격과 방어가 1랭크씩 떨어진다.
 *
 * [연출 시퀀스 (5세대 & 포케로그 원작 고증 - 주먹 이펙트 없음)]:
 * 1. [Step 1: 전신 투기 분출 & 상승 에너지 스트리크 (Power Surge & Rising Aura Streaks)]:
 *    - 시전자가 점차 높게 탄성 바운스하며 온몸의 괴력을 끌어올림
 *    - 시전자 몸 주변(전/후면 3D 레이어)으로 치솟아 오르는 붉은빛·주황빛·연노랑 라운드 캡 상승 에너지 선들과 바닥 파동 링
 * 2. [Step 2: 초고속 전신 몸통 돌진 (Full-Body Supersonic Tackle Rush)]:
 *    - 주먹 발사체 없이 시전자 본체가 직접 몸을 낮춰 목표를 향해 폭발적으로 쇄도
 *    - 돌진 궤적을 따라 이어지는 양끝 투명 테이퍼드 스피드 라인과 전방 충격파 웨지
 * 3. [Step 3: 5세대풍 방사형 톱니 충격파 & 2중 스타버스트 대폭발 (Jagged Radial Shockwave & Starburst Impact)]:
 *    - 1프레임 순백 섬광(hitFlash) & 피격자 격렬한 스쿼시&스트레치 넉백
 *    - 대형 16각 수축/확산 톱니 스타버스트 + 8각 순백 코어 스타버스트 + 사방으로 튀는 발광 점파티클 스파크
 * 4. [Step 4: 반동 복귀 & 피로로 인한 능력치 하락 (Rebound & Stat-Drop Exhaustion)]:
 *    - 시전자가 원위치로 복귀하며 공격·방어 1랭크 하락 디버프 파티클(-1) 연출
 */
export const superpowerMove: BattleMoveAnimation = {
  num: 276,
  key: "superpower",
  nameKo: "엄청난힘",
  nameEn: "Superpower",
  type: "fighting",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    delayUntilStep: 2,
    inlineGlideInFrames: 2,
  },
  customStatParticles: true,
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawSuperpowerBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSuperpowerEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 시전자 오프셋 & 변형 헬퍼 (수비자는 완벽하게 {0, 0} 고정!)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number, rot: number = 0) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
      pRot: isP && rot !== 0 ? rot : undefined,
      eRot: !isP && rot !== 0 ? -rot : undefined,
    });

    // 피격자(수비자) 오프셋 & 변형 헬퍼 (시전자는 완벽하게 {0, 0} 고정!)
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    // 붉은 투기 틴트 헬퍼
    const cTint = (alpha: number) => {
      if (alpha <= 0.01) return { pTintColor: null, eTintColor: null };
      const colorStr = `rgba(239, 68, 68, ${alpha.toFixed(2)})`;
      return {
        pTintColor: isP ? colorStr : null,
        eTintColor: !isP ? colorStr : null,
      };
    };

    const frames: BattleFrame[] = [];

    // ========================================================================
    // [Step 1: 전신 투기 분출 & 점진적 파워 바운스] (10프레임, 42ms)
    // - 원작처럼 시전자가 점차 높게 바운스하며 위로 솟구치는 붉은/노란 투기 라인 방출
    // ========================================================================
    const step1Count = 10;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      // 3회에 걸쳐 점점 높게 솟구치는 파워 바운스 & 마지막 프레임 돌진 직전 깊은 웅크림
      let dy = 0;
      let sx = 1.0;
      let sy = 1.0;
      if (i < 8) {
        const bouncePhase = (i / 8) * Math.PI * 3;
        const hop = Math.abs(Math.sin(bouncePhase));
        const amp = 4 + (i / 7) * 12; // -4px -> -10px -> -16px 점진적 상승
        dy = -hop * amp;
        sx = 1.0 - hop * 0.08 + (1.0 - hop) * 0.06;
        sy = 1.0 + hop * 0.10 - (1.0 - hop) * 0.06;
      } else {
        // 돌진 직전 폭발적 도움닫기 웅크림 (Squash)
        const crouchT = (i - 7) / 2;
        dy = crouchT * 5;
        sx = 1.0 + crouchT * 0.16;
        sy = 1.0 - crouchT * 0.15;
      }

      frames.push({
        ...baseFrame,
        delay: 42,
        ...cOff(0, dy),
        ...cScale(sx, sy),
        ...cTint(Math.sin(prog * Math.PI * 0.85) * 0.38),
        moveStep: 1,
        effectProgress: prog,
        phaseId: `superpower-charge-${i + 1}`,
        phaseName: `#1. 전신 투기 분출 & 기 모으기 (${i + 1}/${step1Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 2: 초고속 전신 몸통 돌진 (주먹 이펙트 없음)] (9프레임, 38ms)
    // ========================================================================
    const step2Count = 9;
    for (let i = 0; i < step2Count; i++) {
      const prog = i / (step2Count - 1);
      // 도움닫기 후 목표를 향해 시전자 본체가 전신으로 맹렬히 돌진
      const easeIn = Math.pow(prog, 1.35);
      const rushX = -8 * (1.0 - prog) + easeIn * 74;
      const rushY = -Math.sin(prog * Math.PI) * 12 - easeIn * 14;
      const sx = 1.08 + Math.sin(prog * Math.PI) * 0.18;
      const sy = 0.92 - Math.sin(prog * Math.PI) * 0.12;
      const rot = 0.14 * Math.sin(prog * Math.PI);

      frames.push({
        ...baseFrame,
        delay: 38,
        ...cOff(rushX, rushY),
        ...cScale(sx, sy, rot),
        ...cTint(0.42 * (1.0 - prog * 0.3)),
        moveStep: 2,
        effectProgress: prog,
        phaseId: `superpower-rush-${i + 1}`,
        phaseName: `#2. 초고속 전신 몸통 돌진 (${i + 1}/${step2Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 3: 5세대풍 방사형 톱니 충격파 & 스타버스트 대폭발 타격] (11프레임, 40ms)
    // ========================================================================
    const step3Count = 11;
    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);

      // 피격자 스쿼시 & 스트레치 탄성 리액션 (직격 찌그러짐 ➔ 반동 스트레치 ➔ 감쇠 복귀)
      let defX = 0;
      let defY = 0;
      let defSx = 1.0;
      let defSy = 1.0;

      if (isHit) {
        if (i <= 3) {
          const u = Math.sin((i / 3) * (Math.PI / 2));
          defX = 24 * u;
          defY = -6 * u;
          defSx = 1.0 + 0.28 * u;
          defSy = 1.0 - 0.24 * u;
        } else if (i <= 7) {
          const u = (i - 3) / 4;
          const rebound = Math.sin(u * Math.PI);
          defX = 24 * (1.0 - u * 0.7);
          defY = -6 * (1.0 - u * 0.7);
          defSx = 1.0 - 0.14 * rebound;
          defSy = 1.0 + 0.16 * rebound;
        } else {
          const u = (i - 7) / 3;
          defX = 7 * (1.0 - u);
          defY = -2 * (1.0 - u);
          defSx = 1.0 + 0.04 * (1.0 - u);
          defSy = 1.0 - 0.04 * (1.0 - u);
        }
      }

      // 시전자는 타격 후 반동으로 부드럽게 원위치 복귀
      const easeOutRebound = 1.0 - Math.pow(prog, 0.75);
      const reboundX = 64 * easeOutRebound;
      const reboundY = -12 * easeOutRebound - Math.sin(prog * Math.PI) * 8;

      frames.push({
        ...baseFrame,
        delay: 40,
        hitFlash: i === 0 && isHit, // 1프레임 순백 섬광
        ...cOff(reboundX, reboundY),
        ...cScale(1.0, 1.0),
        ...defOff(defX, defY),
        ...defScale(defSx, defSy),
        moveStep: 3,
        effectProgress: prog,
        phaseId: `superpower-impact-${i + 1}`,
        phaseName: `#3. 방사형 톱니 충격파 & 대폭발 타격 (${i + 1}/${step3Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 4: 반동 복귀 & 피로로 인한 능력치 하락] (7프레임, 50ms)
    // ========================================================================
    const step4Count = 7;
    for (let i = 0; i < step4Count; i++) {
      const prog = i / (step4Count - 1);
      // 카메라 중립 복귀 후 지친 듯 살짝 힘이 빠지며 랭크 하락 파티클 표시
      const dy = Math.sin(prog * Math.PI) * 3;
      const sx = 1.04 - prog * 0.04;
      const sy = 0.96 + prog * 0.04;

      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, dy),
        ...cScale(sx, sy),
        moveStep: 4,
        effectProgress: prog,
        afterCameraReturn: true,
        phaseId: `superpower-rebound-${i + 1}`,
        phaseName: `#4. 피로로 인한 능력치 하락 (${i + 1}/${step4Count})`,
        showEffect: isHit !== false,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};

