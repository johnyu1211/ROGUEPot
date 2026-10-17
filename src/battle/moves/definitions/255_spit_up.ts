// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSpitUpBehindEffect,
  drawSpitUpEffect,
} from "../../../renderers/moves/gen1/move253_256.js";

/**
 * 💥 255: 토해내기 (Spit Up / はきだす) - 노말 타입 특수 공격 기술
 *
 * 위력: 100 * 비축 카운트 (최대 300) / 명중: 100 / PP: 10 / 대상: 상대 / 접촉: X
 * 설명: 비축된 힘을 상대에게 부딪쳐서 공격한다. 비축된 만큼 위력이 올라간다.
 *
 * [유저 요구사항 100% 반영]:
 * 1. 비축하기 반대로 재생 (비축 구체가 시전 포켓몬 중심에서 시작하여 발포)
 * 2. 꾸불꾸불이 아니라 "직선으로 모였다가 퍼져 나가게"
 *    - 사방에서 시전 포켓몬 중간(중심)으로 직선으로 급속 수렴 응축
 *    - 중심에서 시작하여 전방으로 부채꼴 원뿔형 직선 궤적으로 시원하게 퍼져 나감
 * 3. 시전 포켓몬 모션:
 *    - 발포 전 잠깐 살짝 작아지면서 찌그러짐 (Squash & Shrink)
 *    - 2회 연속 팍! 팍! (2연속 폭발적 발포 팽창 & 묵직한 반동)
 * 4. 비축하기에서 나온 이펙트가 멀어지면서 빨간 색깔(#FF2A2A)로 부드럽게 변환
 * 5. 발포 및 비행 중에는 시전 포켓몬 포커싱 (Step 1: Caster Zoom Focus)
 * 6. 대상 도달 시 대상 포켓몬 포커싱 (Step 2: Target Zoom Focus)
 * 7. 대상 포켓몬에게 빨간 색깔 타격 이펙트 "타다닥" (5연속 쾌속 직격 스타버스트/충격파/스파크 폭쇄)
 */
export const spitUpMove: BattleMoveAnimation = {
  num: 255,
  key: "spit-up",
  nameKo: "토해내기",
  nameEn: "Spit Up",
  type: "normal",
  category: "special",
  camera: {
    type: "caster_to_target",
    zoom: 1.30,
    delayUntilStep: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawSpitUpBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSpitUpEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const dir = isP ? 1 : -1;

    // 시전자 오프셋
    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일
    const cScale = (scaleX: number, scaleY: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
    });

    // 대상자(피격자) 오프셋
    const defOff = (x = 0, y = 0) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];

    // =========================================================================
    // [Step 1: 시전 포켓몬 포커싱 구간]
    // 1) 직선으로 모이기 ➔ 살짝 작아지며 찌그러짐
    // 2) 1차 팍! (발포 & 반동)
    // 3) 2차 팍! (발포 & 반동)
    // 4) 발포된 비축 이펙트가 멀어지며 빨간 색깔로 변환
    // =========================================================================

    // 1-1. 직선으로 모이기 시작
    frames.push({
      ...baseFrame,
      delay: 60,
      ...cOff(0, 0),
      ...cScale(0.96, 0.96),
      moveStep: 1,
      effectProgress: 0.05,
      showEffect: true,
      showBehindEffect: true,
      phaseId: "spit-up-gather-start",
      phaseName: "#1. 사방에서 중심으로 직선 에너지 수렴",
    });

    // 1-2. "잠깐 살짝 작아지면서 찌그러졌다가" (Squash & Shrink)
    frames.push({
      ...baseFrame,
      delay: 75,
      ...cOff(0, 3),
      ...cScale(1.08, 0.82), // 납작하게 찌그러지며 작아짐
      moveStep: 1,
      effectProgress: 0.14,
      showEffect: true,
      showBehindEffect: true,
      phaseId: "spit-up-squash",
      phaseName: "#1. 살짝 작아지면서 찌그러짐 (압축 충전)",
    });

    // 1-3. 1차 "팍." (Pop 1 격발 & 반동!)
    frames.push({
      ...baseFrame,
      delay: 55,
      ...cOff(-dir * 7, -2),
      ...cScale(0.88, 1.18), // 수직 팽창 팝
      moveStep: 1,
      effectProgress: 0.24,
      showEffect: true,
      showBehindEffect: true,
      phaseId: "spit-up-pop-1",
      phaseName: "#1. 팍! (1차 격발 발포)",
    });

    // 1-4. 1차 반동 리바운드
    frames.push({
      ...baseFrame,
      delay: 50,
      ...cOff(-dir * 4, 1),
      ...cScale(1.06, 0.94),
      moveStep: 1,
      effectProgress: 0.34,
      showEffect: true,
      showBehindEffect: true,
      phaseId: "spit-up-recoil-1",
      phaseName: "#1. 1차 발포 반동 수습",
    });

    // 1-5. 2차 "팍." (Pop 2 격발 & 강력한 반동!)
    frames.push({
      ...baseFrame,
      delay: 55,
      ...cOff(-dir * 10, -3),
      ...cScale(0.84, 1.22), // 대형 수직 팽창 팝
      moveStep: 1,
      effectProgress: 0.46,
      showEffect: true,
      showBehindEffect: true,
      phaseId: "spit-up-pop-2",
      phaseName: "#1. 팍! (2차 격발 대량 발포)",
    });

    // 1-6. 멀어지며 주황 ➔ 빨간색으로 변환 시작
    frames.push({
      ...baseFrame,
      delay: 60,
      ...cOff(-dir * 5, -1),
      ...cScale(0.96, 1.04),
      moveStep: 1,
      effectProgress: 0.62,
      showEffect: true,
      showBehindEffect: true,
      phaseId: "spit-up-flight-orange-red",
      phaseName: "#1. 멀어지며 빨간 색깔로 변환 시작",
    });

    // 1-7. 원거리 비행 & 완전한 빨간색 전환
    frames.push({
      ...baseFrame,
      delay: 65,
      ...cOff(-dir * 2, 0),
      ...cScale(1.00, 1.00),
      moveStep: 1,
      effectProgress: 0.82,
      showEffect: true,
      showBehindEffect: true,
      phaseId: "spit-up-flight-red",
      phaseName: "#1. 비축 이펙트 완전한 빨간색으로 전환",
    });

    // 1-8. 대상 진영 도달 직전
    frames.push({
      ...baseFrame,
      delay: 65,
      ...cOff(0, 0),
      ...cScale(1.00, 1.00),
      moveStep: 1,
      effectProgress: 1.00,
      showEffect: true,
      showBehindEffect: true,
      phaseId: "spit-up-reach",
      phaseName: "#1. 대상 진영 쇄도 도달",
    });

    // =========================================================================
    // [Step 2: 대상 포켓몬 포커싱 & 빨간 색깔 타격 이펙트 타다닥!]
    // (delayUntilStep: 2 에 의해 엔진이 부드러운 카메라 글라이드 자동 수행)
    // =========================================================================

    // 2-1. "타" (1타 직격: 좌상단)
    frames.push({
      ...baseFrame,
      delay: 50,
      ...cOff(0, 0),
      ...defOff(dir * 4, -2),
      hitFlash: true,
      moveStep: 2,
      effectProgress: 0.12,
      showEffect: true,
      phaseId: "spit-up-hit-1",
      phaseName: "#2. 타! (1타 빨간 타격)",
    });

    // 2-2. "다" (2타 직격: 우측)
    frames.push({
      ...baseFrame,
      delay: 50,
      ...cOff(0, 0),
      ...defOff(-dir * 5, 2),
      hitFlash: false,
      moveStep: 2,
      effectProgress: 0.28,
      showEffect: true,
      phaseId: "spit-up-hit-2",
      phaseName: "#2. 다! (2타 빨간 타격)",
    });

    // 2-3. "닥" (3타 직격: 하단)
    frames.push({
      ...baseFrame,
      delay: 50,
      ...cOff(0, 0),
      ...defOff(dir * 5, 1),
      hitFlash: true,
      moveStep: 2,
      effectProgress: 0.44,
      showEffect: true,
      phaseId: "spit-up-hit-3",
      phaseName: "#2. 닥! (3타 빨간 타격)",
    });

    // 2-4. "타" (4타 직격: 우상단)
    frames.push({
      ...baseFrame,
      delay: 50,
      ...cOff(0, 0),
      ...defOff(-dir * 4, -2),
      hitFlash: false,
      moveStep: 2,
      effectProgress: 0.60,
      showEffect: true,
      phaseId: "spit-up-hit-4",
      phaseName: "#2. 타! (4타 빨간 타격)",
    });

    // 2-5. "닥" (5타 피날레 결정타 직격 대폭쇄)
    frames.push({
      ...baseFrame,
      delay: 75,
      ...cOff(0, 0),
      ...defOff(-dir * 8, -4),
      hitFlash: true,
      cameraBlur: 2.0,
      moveStep: 2,
      effectProgress: 0.78,
      showEffect: true,
      phaseId: "spit-up-hit-finale",
      phaseName: "#2. 닥! (5타 피날레 빨간 대폭발)",
    });

    // 2-6. 잔향 소산
    frames.push({
      ...baseFrame,
      delay: 60,
      ...cOff(0, 0),
      ...defOff(-dir * 2, 0),
      moveStep: 2,
      effectProgress: 0.92,
      showEffect: true,
      phaseId: "spit-up-hit-fade",
      phaseName: "#2. 충격파 소산 및 안정화",
    });

    // 2-7. 정위치 복귀
    frames.push({
      ...baseFrame,
      delay: 90,
      ...cOff(0, 0),
      ...defOff(0, 0),
      moveStep: 2,
      effectProgress: 1.00,
      showEffect: false,
      phaseId: "spit-up-complete",
      phaseName: "#2. 토해내기 완료",
    });

    return frames;
  },
};
