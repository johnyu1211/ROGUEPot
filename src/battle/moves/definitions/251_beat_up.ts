// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawBeatUpBehindEffect,
  drawBeatUpEffect,
  BEAT_UP_TRACKS,
} from "../../../renderers/moves/gen1/move249_252.js";

/**
 * 🥊 251: 집단구타 (Beat Up / ふくろだたき) - 악 타입 물리 연속 공격 기술
 *
 * 위력: 특수(파티원 각자의 공격력 기반) / 명중: 100 / PP: 10 / 접촉: O
 * 설명: 같은 편 전원이 공격한다. 동료 포켓몬이 많을수록 기술의 공격 횟수가 증가한다.
 *
 * [유저 요구사항 완벽 반영]:
 * 1. [회색과 보라색이 섞인 주먹]:
 *    - 코멧펀치나 펀치류 기술에 사용했던 공식 주먹 스프라이트에
 *      회색(#ADADA5)과 보라색(#A5A5DE)이 조화롭게 섞인 색상을 씌운 전용 주먹
 *    - 하이라이트는 연보라빛 실버, 미드톤은 회보라, 섀도우는 다크 슬레이트 바이올렛
 *    - SVG 폴백 역시 회색-보라 그라데이션 및 실버 림으로 100% 매칭!
 * 2. [타격 이펙트는 따라가때리기 참고]:
 *    - 타격 직격 순간 순백 코어 -> 연보라/회색 섬광 플래시
 *    - 안쪽 선 색상(#A5A5DE) 8각 날카로운 스타버스트
 *    - 사방으로 팍 퍼지는 2톤(회색+연보라) 점 파티클 & 꼬리 트레일
 * 3. [퍼지는 효과]:
 *    - 타격점 중심에서 사방 360도로 2톤 점 파티클이 시원하게 확 퍼져나감
 *    - 피날레 타격 시 파티클 확산 반경과 개수 대폭 증가로 피니시 쾌감 극대화!
 * 4. [주먹의 개수는 보유한 포켓몬에 따라 달라짐]:
 *    - 파티 내 살아있는 포켓몬 수(1~6마리)만큼 주먹이 생성되어 각기 다른 궤적으로 연속 타격!
 *    - 각 포켓몬의 주먹마다 쇄도 각도, 타격 부위(좌상단, 우측, 하단 어퍼컷 등) 다변화
 */
export const beatUpMove: BattleMoveAnimation = {
  num: 251,
  key: "beat-up",
  nameKo: "집단구타",
  nameEn: "Beat Up",
  type: "dark",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawBeatUpBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawBeatUpEffect(targetCtx, frame, drawCtx);
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

    // 피격자 스쿼시/넉백 헬퍼 (타격 방향에 따른 리액션)
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
        delay: 50,
        ...cOff(12, -2),
        moveStep: 1,
        phaseId: "beat-up-miss-start",
        phaseName: "#1. 집단 공격 선언 (빗나감)",
        effectProgress: 0.0,
        showEffect: false,
        showBehindEffect: true,
      });
      frames.push({
        ...baseFrame,
        delay: 60,
        ...cOff(20, -4),
        moveStep: 2,
        phaseId: "beat-up-miss-punch",
        phaseName: "#2. 헛도는 주먹",
        effectProgress: 0.25,
        punchIndex: 0,
        punchCount: 1,
        showEffect: true,
        showBehindEffect: true,
      } as any);
      frames.push({
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        moveStep: 3,
        phaseId: "beat-up-miss-end",
        phaseName: "#3. 공격 빗나감",
        effectProgress: 1.0,
        showEffect: false,
        showBehindEffect: false,
      });
      return frames;
    }

    // ========================================================================
    // [적중 시퀀스]: 보유 포켓몬 수에 따른 연속 주먹 타격
    // 유저 요구사항: "주먹의 개수는 보유한 포켓몬에 따라 달라지겠지"
    // ========================================================================
    const totalPunches = Math.max(1, Math.min(6, a.hitCount ?? 6));

    // ------------------------------------------------------------------------
    // [Step 1: 동료 포켓몬 집단 총공격 개시 태세] (2프레임, 45ms)
    // ------------------------------------------------------------------------
    frames.push({
      ...baseFrame,
      delay: 45,
      ...cOff(-6, 2),
      moveStep: 1,
      phaseId: "beat-up-ready-1",
      phaseName: "#1. 동료 포켓몬 집단 총공격 태세 (1/2)",
      effectProgress: 0.2,
      showEffect: false,
      showBehindEffect: true,
    });

    frames.push({
      ...baseFrame,
      delay: 45,
      ...cOff(10, -2),
      moveStep: 1,
      phaseId: "beat-up-ready-2",
      phaseName: "#1. 동료 포켓몬 집단 총공격 태세 (2/2)",
      effectProgress: 0.8,
      showEffect: false,
      showBehindEffect: true,
    });

    // ------------------------------------------------------------------------
    // [Step 2: 포켓몬별 주먹 쇄도 & 따라가때리기 타격 폭발 난무]
    // ------------------------------------------------------------------------
    for (let p = 0; p < totalPunches; p++) {
      const isClimax = (p === totalPunches - 1);
      const track = BEAT_UP_TRACKS[p % BEAT_UP_TRACKS.length];

      // 타격 방향에 따른 피격자 반응 계산
      const rx = Math.round(-Math.cos(track.angle) * (isClimax ? 12 : 7));
      const ry = Math.round(-Math.sin(track.angle) * (isClimax ? 8 : 4));
      const sx = isClimax ? 1.15 : (p % 2 === 0 ? 0.94 : 1.06);
      const sy = isClimax ? 0.85 : (p % 2 === 0 ? 1.06 : 0.94);

      // 1) [주먹 쇄도]: 시전자와 동료의 주먹이 목표를 향해 고속 쇄도 (40ms)
      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(p % 2 === 0 ? 6 : -4, p % 2 === 0 ? -2 : 1),
        moveStep: 2,
        phaseId: `beat-up-punch-${p + 1}-approach`,
        phaseName: `#2-${p + 1}. [${p + 1}/${totalPunches}] 회색+보라 주먹 쇄도`,
        effectProgress: 0.20,
        punchIndex: p,
        punchCount: totalPunches,
        showEffect: true,
        showBehindEffect: true,
      } as any);

      // 2) [직격 강타 & 따라가때리기 폭발]: 타격점 꽂힘 & 섬광 + 8각 스타버스트 + 2톤 점 파티클 팍! (45ms)
      frames.push({
        ...baseFrame,
        delay: isClimax ? 60 : 45,
        ...cOff(isClimax ? 14 : 4, 0),
        ...targetReaction(rx, ry, sx, sy),
        hitFlash: false, // [유저 요청 엄수]: 흰색 플래시 완전 제거
        targetPurpleLevel: isClimax ? 0.65 : 0.35, // 흰색 대신 어두운 보라빛 피격 틴트 적용
        moveStep: 2,
        phaseId: `beat-up-punch-${p + 1}-impact`,
        phaseName: `#2-${p + 1}. [${p + 1}/${totalPunches}] 직격 강타 & 보라빛 타격 폭발`,
        effectProgress: 0.58,
        punchIndex: p,
        punchCount: totalPunches,
        showEffect: true,
        showBehindEffect: true,
      } as any);

      // 3) [파티클 사방 비산 & 주먹 페이드아웃]: 2톤 점 파티클 사방 360도 확산 (45ms)
      frames.push({
        ...baseFrame,
        delay: isClimax ? 55 : 45,
        ...cOff(0, 0),
        ...targetReaction(Math.round(rx * 0.4), Math.round(ry * 0.4), 1.0, 1.0),
        moveStep: 2,
        phaseId: `beat-up-punch-${p + 1}-burst`,
        phaseName: `#2-${p + 1}. [${p + 1}/${totalPunches}] 2톤 점 파티클 사방 비산`,
        effectProgress: 0.90,
        punchIndex: p,
        punchCount: totalPunches,
        showEffect: true,
        showBehindEffect: true,
      } as any);
    }

    // ------------------------------------------------------------------------
    // [Step 3: 피날레 여운 & 대상 및 시전자 안정화] (2프레임, 45ms)
    // ------------------------------------------------------------------------
    frames.push({
      ...baseFrame,
      delay: 45,
      ...cOff(0, 0),
      moveStep: 3,
      phaseId: "beat-up-recovery-1",
      phaseName: "#3. 잔여 파티클 소산 및 복귀 (1/2)",
      effectProgress: 0.5,
      showEffect: true,
      showBehindEffect: true,
    });

    frames.push({
      ...baseFrame,
      delay: 45,
      ...cOff(0, 0),
      moveStep: 3,
      phaseId: "beat-up-recovery-2",
      phaseName: "#3. 잔여 파티클 소산 및 복귀 (2/2)",
      effectProgress: 1.0,
      showEffect: false,
      showBehindEffect: false,
    });

    return frames;
  },
};
