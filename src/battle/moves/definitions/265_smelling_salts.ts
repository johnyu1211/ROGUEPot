// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSmellingSaltsBehindEffect,
  drawSmellingSaltsEffect,
} from "../../../renderers/moves/gen1/move265_268.js";

/**
 * 🧂 265: 정신차리기 (Smelling Salts / きつけ) - 노말 타입 물리 공격 기술
 *
 * 위력: 70 (마비 시 140) / 명중: 100 / PP: 10 / 접촉: O
 * 설명: 마비 상태의 상대에게는 위력이 2배가 되지만 대신 상대의 마비가 풀린다.
 *
 * [유저 요구사항 100% 완벽 반영]:
 * "정신차리기의 경우에는 속이기 기술 그대로 사용하되 이펙트 노랑에 점파티클 주황"
 *
 * 1. [속이기 모션 100% 계승]:
 *    - Step 1: 양손 90도 직립 태권당수 손(흰색 손바닥) 2회 유선형 교차 상하 운동
 *    - Step 2: 위에서 아래로 내려치며 정면 박수 맞닿음 (5개 슬라이스 분리 및 안쪽부터 얇아짐)
 * 2. [이펙트 노랑]:
 *    - Step 3: 중심 100% 완전 투명한 8각 만화풍 노란색 스타버스트 + 노란색 모멘텀 속도선
 * 3. [점파티클 주황]:
 *    - Step 3 & 4: 타격 지점에서 사방으로 폭발적으로 비산하는 주황색 발광 구체 알갱이들
 */
export const smellingSaltsMove: BattleMoveAnimation = {
  num: 265,
  key: "smelling-salts",
  nameKo: "정신차리기",
  nameEn: "Smelling Salts",
  type: "normal",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawSmellingSaltsBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSmellingSaltsEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.25,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 오프셋 헬퍼
    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    // 피격자 반응 헬퍼 (스쿼시/스트레치 및 흔들림)
    const targetReaction = (offX = 0, offY = 0, scaleX = 1.0, scaleY = 1.0) => ({
      pOffset: !isP ? { x: -offX, y: offY } : { x: 0, y: 0 },
      eOffset: isP ? { x: offX, y: offY } : { x: 0, y: 0 },
      pScale: !isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      eScale: isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
    });

    const frames: BattleFrame[] = [];

    // [미스 연출: !isHit]
    if (!isHit) {
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(8, 0),
        moveStep: 1,
        phaseId: "smelling-salts-miss-wave-1",
        phaseName: "#1. 정신차리기 태세 (빗나감)",
        effectProgress: 0.25,
        showEffect: true,
        showBehindEffect: false,
      });
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(12, 0),
        moveStep: 1,
        phaseId: "smelling-salts-miss-wave-2",
        phaseName: "#1. 정신차리기 교차 모션 (빗나감)",
        effectProgress: 0.65,
        showEffect: true,
        showBehindEffect: false,
      });
      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(15, 0),
        ...targetReaction(18, 0), // 대상이 뒤로 물러나 회피
        moveStep: 2,
        phaseId: "smelling-salts-miss-clap",
        phaseName: "#2. 헛도는 박수 타격 (회피됨)",
        effectProgress: 1.0,
        showEffect: true,
        showBehindEffect: false,
      });
      frames.push({
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        moveStep: 4,
        phaseId: "smelling-salts-miss-end",
        phaseName: "#3. 공격 빗나감",
        effectProgress: 1.0,
        showEffect: false,
        showBehindEffect: false,
      });
      return frames;
    }

    // ========================================================================
    // [적중 시퀀스]: 2회 유선형 상하 교차 운동 ➔ 박수 맞닿음 ➔ 노란 타격 & 주황 점파티클
    // ========================================================================

    // ------------------------------------------------------------------------
    // [Step 1: 양쪽에 태권당수 손 90도 직립 + 부드러운 2회 교차 상하 운동]
    // 12프레임 (사이클당 6프레임 x 2사이클, 36ms)
    // ------------------------------------------------------------------------
    const waveFrameCount = 12;
    for (let i = 0; i < waveFrameCount; i++) {
      const prog = i / (waveFrameCount - 1);
      const cycleNum = Math.min(2, Math.floor(i / 6) + 1);

      frames.push({
        ...baseFrame,
        delay: 36,
        ...cOff(Math.min(10, i * 0.9), 0),
        moveStep: 1,
        phaseId: `smelling-salts-wave-${i + 1}`,
        phaseName: `#1. 양손 당수 교차 상하 모션 (${cycleNum}/2회 - ${i + 1}/${waveFrameCount})`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // ------------------------------------------------------------------------
    // [Step 2: 마지막에 손이 맞닿으면서 - 정면 고속 쇄도 및 박수 맞닿음]
    // 3프레임 (30ms)
    // ------------------------------------------------------------------------
    const clapFrameCount = 3;
    for (let i = 0; i < clapFrameCount; i++) {
      const prog = (i + 1) / clapFrameCount;

      frames.push({
        ...baseFrame,
        delay: 30,
        ...cOff(12, 0),
        moveStep: 2,
        phaseId: `smelling-salts-clap-${i + 1}`,
        phaseName: `#2. 양손 정면 박수 타격 쇄도 및 맞닿음 (${i + 1}/${clapFrameCount})`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // ------------------------------------------------------------------------
    // [Step 3: 손이 맞닿은 직격 순간 & 노란색 타격 스타버스트 & 주황색 점파티클 폭발]
    // 8프레임 (첫 프레임 50ms 섬광 플래시 + 후속 38ms)
    // ------------------------------------------------------------------------
    const impactFrameCount = 8;
    for (let i = 0; i < impactFrameCount; i++) {
      const prog = i / (impactFrameCount - 1);
      const isImpactFirst = i === 0;

      // 피격자 스쿼시/스트레치 및 좌우 진동
      const shakeX = (i % 2 === 0 ? 1 : -1) * Math.max(0, 7 - i * 0.9);
      const scaleX = isImpactFirst ? 1.15 : (i === 1 ? 0.92 : 1.0);
      const scaleY = isImpactFirst ? 0.85 : (i === 1 ? 1.08 : 1.0);

      frames.push({
        ...baseFrame,
        delay: isImpactFirst ? 50 : 38,
        ...cOff(Math.max(0, 10 - i * 1.4), 0),
        ...targetReaction(shakeX, 0, scaleX, scaleY),
        hitFlash: isImpactFirst,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        phaseId: `smelling-salts-impact-${i + 1}`,
        phaseName: `#3. 노란색 타격 스타버스트 및 주황색 점파티클 폭발 (${i + 1}/${impactFrameCount})`,
        effectProgress: prog,
        hitProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ------------------------------------------------------------------------
    // [Step 4: 주황색 점파티클 소산 및 안정화]
    // 3프레임 (45ms)
    // ------------------------------------------------------------------------
    const settleFrameCount = 3;
    for (let i = 0; i < settleFrameCount; i++) {
      const prog = i / (settleFrameCount - 1);

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        phaseId: `smelling-salts-settle-${i + 1}`,
        phaseName: `#4. 주황색 점파티클 소산 및 안정화 (${i + 1}/${settleFrameCount})`,
        effectProgress: prog,
        showEffect: i < 2,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
