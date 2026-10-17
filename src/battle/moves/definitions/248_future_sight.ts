// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawFutureSightBehindEffect,
  drawFutureSightEffect,
} from "../../../renderers/moves/gen1/move245_248.js";

/**
 * 248: 미래예지 (통합 풀 시퀀스 / Future Sight - Full Sequence)
 *
 * 위력: 120 / 명중: 100 / PP: 10 / 비접촉
 * 설명: 기술을 사용한 2턴 뒤에 상대에게 염동력의 덩어리를 보내어 공격한다.
 *
 * [뷰어 & 영상 추출용 원스톱 풀 시퀀스]:
 * 1. 시전 시: 사용 포켓몬 포커싱, 은은한 반투명 흰색 필터 페이드인 (100% 순백 X),
 *             찌그러짐 없이(scale 1.0 고정) 좌우로 살짝 흔들거리고 안착
 * 2. 전환: 카메라가 대상을 향해 부드럽게 글라이드 이동
 * 3. 대미지 타격: 대상 포켓몬 포커싱, 대상 흰색 필터 살짝 적용,
 *                오직 대상 포켓몬만 4회 리듬감 있게 찌그러뜨림 피격
 * 4. 피날레: 안정화 및 카메라 복귀
 */
export const futureSightMove: BattleMoveAnimation = {
  num: 248,
  key: "future-sight",
  nameKo: "미래예지",
  nameEn: "Future Sight",
  type: "psychic",
  category: "special",
  camera: {
    type: "caster_to_target",
    zoom: 1.34,
    delayUntilStep: 3, // Step 1~2: 시전자 포커싱, Step 3부터 대상 포커싱
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawFutureSightBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawFutureSightEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      showEffect: false,
      showBehindEffect: false,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 오프셋
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일 (시전 포켓몬은 절대 찌그러지지 않고 1.0 고정!)
    const cScale = (x = 1.0, y = 1.0) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 시전자 흰색 필터 (100% 순백이 아닌 은은한 반투명 흰색 필터)
    const cWhite = (val: number) => ({
      whiteFilterAlpha: isP ? val : undefined,
      pWhiteAlpha: isP ? val : undefined,
      eWhiteAlpha: !isP ? val : undefined,
      pWhite: false, // 100% 순백 실루엣 절대 금지!
      eWhite: false,
      pWhiteTint: undefined,
      eWhiteTint: undefined,
    });

    // 피격자(대상) 오프셋
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(대상) 스케일 (오직 대상 포켓몬만 찌그러짐!)
    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    // 피격자(대상) 흰색 필터 ('살짝'만 반투명 적용)
    const defWhite = (val: number) => ({
      pWhiteAlpha: !isP ? val : undefined,
      eWhiteAlpha: isP ? val : undefined,
      pWhite: false,
      eWhite: false,
      pWhiteTint: undefined,
      eWhiteTint: undefined,
    });

    const frames: BattleFrame[] = [];

    // =========================================================================
    // Part 1: 미래예지 시전 (사용 포켓몬 포커싱 + 흰색 필터 페이드인, 최대 55% 반투명, 찌그러짐 없음!)
    // =========================================================================
    const fadeInSteps = [0.15, 0.28, 0.42, 0.55];
    for (let i = 0; i < fadeInSteps.length; i++) {
      const alpha = fadeInSteps[i];
      frames.push({
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cWhite(alpha),
        moveStep: 1,
        phaseId: `future-sight-fadein-${i + 1}`,
        phaseName: `1. 시전자 흰색 필터 페이드 인 (${i + 1}/${fadeInSteps.length})`,
      });
    }

    // =========================================================================
    // Part 2: 은은한 흰색 필터 상태에서 살짝 흔들거리고 끝 (찌그러짐 전혀 없이 순수 위치만 좌우 떨림!)
    // =========================================================================
    const shakeSequence = [
      { off: { x: -4, y: 0 }, white: 0.55, delay: 60 },
      { off: { x: 4, y: 0 }, white: 0.55, delay: 60 },
      { off: { x: -3, y: 0 }, white: 0.55, delay: 60 },
      { off: { x: 3, y: 0 }, white: 0.55, delay: 60 },
      { off: { x: -2, y: 0 }, white: 0.45, delay: 65 },
      { off: { x: 2, y: 0 }, white: 0.35, delay: 65 },
      { off: { x: -1, y: 0 }, white: 0.20, delay: 70 },
      { off: { x: 0, y: 0 }, white: 0.10, delay: 80 },
      { off: { x: 0, y: 0 }, white: 0.0, delay: 100 },
    ];

    for (let i = 0; i < shakeSequence.length; i++) {
      const s = shakeSequence[i];
      frames.push({
        ...baseFrame,
        delay: s.delay,
        ...cOff(s.off.x, s.off.y),
        ...cScale(1.0, 1.0),
        ...cWhite(s.white),
        moveStep: 1,
        phaseId: `future-sight-shake-${i + 1}`,
        phaseName: `2. 시전자 흔들림 (${i + 1}/${shakeSequence.length})`,
      });
    }

    // =========================================================================
    // Part 3: 시전 완료 후 카메라 대상 포커싱 글라이드 전환 (호흡 조절)
    // =========================================================================
    frames.push({
      ...baseFrame,
      delay: 90,
      ...cOff(0, 0),
      ...cScale(1.0, 1.0),
      ...cWhite(0),
      moveStep: 2,
      phaseId: "future-sight-glide",
      phaseName: "3. 대상 포커싱 전환",
    });

    // =========================================================================
    // Part 4: 미래예지 대미지 (대상 포켓몬 흰색 필터 살짝 + 여러 번 찌그러뜨림)
    // =========================================================================
    const distortSequence = [
      // 1타 찌그러짐 (납작 -> 길쭉)
      { scale: { x: 1.35, y: 0.68 }, off: { x: 0, y: 5 }, flash: true, white: 0.35, delay: 55, name: "대미지 왜곡 1타 (납작)" },
      { scale: { x: 0.75, y: 1.30 }, off: { x: 0, y: -5 }, flash: false, white: 0.30, delay: 55, name: "대미지 왜곡 1타 (길쭉)" },
      // 2타 찌그러짐 (납작 -> 길쭉)
      { scale: { x: 1.30, y: 0.72 }, off: { x: 0, y: 4 }, flash: true, white: 0.35, delay: 55, name: "대미지 왜곡 2타 (납작)" },
      { scale: { x: 0.80, y: 1.25 }, off: { x: 0, y: -4 }, flash: false, white: 0.28, delay: 55, name: "대미지 왜곡 2타 (길쭉)" },
      // 3타 찌그러짐 (사선 비틀림 왜곡)
      { scale: { x: 1.22, y: 0.80 }, off: { x: 3, y: 3 }, flash: true, white: 0.30, delay: 55, name: "대미지 왜곡 3타 (납작)" },
      { scale: { x: 0.85, y: 1.18 }, off: { x: -3, y: -3 }, flash: false, white: 0.25, delay: 55, name: "대미지 왜곡 3타 (길쭉)" },
      // 4타 찌그러짐 (잔여 진동 왜곡)
      { scale: { x: 1.12, y: 0.90 }, off: { x: 0, y: 2 }, flash: false, white: 0.20, delay: 55, name: "대미지 왜곡 4타 (납작)" },
      { scale: { x: 0.92, y: 1.10 }, off: { x: 0, y: -2 }, flash: false, white: 0.15, delay: 55, name: "대미지 왜곡 4타 (길쭉)" },
    ];

    for (let i = 0; i < distortSequence.length; i++) {
      const d = distortSequence[i];
      frames.push({
        ...baseFrame,
        delay: d.delay,
        hitFlash: d.flash,
        showEffect: true,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cWhite(0),
        ...defOff(d.off.x, d.off.y),
        ...defScale(d.scale.x, d.scale.y),
        ...defWhite(d.white),
        moveStep: 3,
        phaseId: `future-sight-damage-${i + 1}`,
        phaseName: `4. ${d.name} (${i + 1}/${distortSequence.length})`,
      });
    }

    // =========================================================================
    // Part 5: 타격 후 안정화 & 카메라 복귀 (moveStep: 4 명시)
    // =========================================================================
    frames.push({
      ...baseFrame,
      delay: 70,
      showEffect: false,
      ...cOff(0, 0),
      ...cScale(1.0, 1.0),
      ...cWhite(0),
      ...defOff(0, 1),
      ...defScale(1.04, 0.96),
      ...defWhite(0.08),
      moveStep: 4,
      phaseId: "future-sight-settle-1",
      phaseName: "5. 타격 후 안정화 (1/3)",
    });

    frames.push({
      ...baseFrame,
      delay: 85,
      showEffect: false,
      ...cOff(0, 0),
      ...cScale(1.0, 1.0),
      ...cWhite(0),
      ...defOff(0, 0),
      ...defScale(1.0, 1.0),
      ...defWhite(0.0),
      moveStep: 4,
      phaseId: "future-sight-settle-2",
      phaseName: "5. 타격 후 안정화 (2/3)",
    });

    frames.push({
      ...baseFrame,
      delay: 110,
      showEffect: false,
      ...cOff(0, 0),
      ...cScale(1.0, 1.0),
      ...cWhite(0),
      ...defOff(0, 0),
      ...defScale(1.0, 1.0),
      ...defWhite(0.0),
      moveStep: 4,
      phaseId: "future-sight-settle-3",
      phaseName: "5. 타격 후 안정화 (3/3)",
    });

    return frames;
  },
};

/**
 * 248: 미래예지 (배틀 1턴 시전 전용 / Future Sight - Cast Only)
 * - 실제 배틀에서 1턴째 시전 시 깔끔하게 시전만 재생
 */
export const futureSightCastMove: BattleMoveAnimation = {
  num: 248,
  key: "future-sight-cast",
  nameKo: "미래예지 (시전)",
  nameEn: "Future Sight (Cast)",
  type: "psychic",
  category: "special",
  camera: {
    type: "self",
    zoom: 1.34,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawFutureSightBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawFutureSightEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      showEffect: false,
      showBehindEffect: false,
      cameraZoom: 1.34,
      pRot: 0,
      eRot: 0,
    };

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cWhite = (val: number) => ({
      whiteFilterAlpha: isP ? val : undefined,
      pWhiteAlpha: isP ? val : undefined,
      eWhiteAlpha: !isP ? val : undefined,
      pWhite: false,
      eWhite: false,
      pWhiteTint: undefined,
      eWhiteTint: undefined,
    });

    const frames: BattleFrame[] = [];

    // [1단계: 시전자 포커싱 & 흰색 필터 페이드인]
    const fadeInSteps = [0.15, 0.28, 0.42, 0.55];
    for (let i = 0; i < fadeInSteps.length; i++) {
      const alpha = fadeInSteps[i];
      frames.push({
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        ...cWhite(alpha),
        moveStep: 1,
        phaseId: `future-sight-fadein-${i + 1}`,
        phaseName: `1. 시전자 흰색 필터 페이드 인 (${i + 1}/${fadeInSteps.length})`,
      });
    }

    // [2단계: 은은한 흰색 상태에서 살짝 흔들거리고 끝]
    const shakeSequence = [
      { off: { x: -4, y: 0 }, white: 0.55, delay: 60 },
      { off: { x: 4, y: 0 }, white: 0.55, delay: 60 },
      { off: { x: -3, y: 0 }, white: 0.55, delay: 60 },
      { off: { x: 3, y: 0 }, white: 0.55, delay: 60 },
      { off: { x: -2, y: 0 }, white: 0.45, delay: 65 },
      { off: { x: 2, y: 0 }, white: 0.35, delay: 65 },
      { off: { x: -1, y: 0 }, white: 0.20, delay: 70 },
      { off: { x: 0, y: 0 }, white: 0.10, delay: 80 },
      { off: { x: 0, y: 0 }, white: 0.0, delay: 100 },
    ];

    for (let i = 0; i < shakeSequence.length; i++) {
      const s = shakeSequence[i];
      frames.push({
        ...baseFrame,
        delay: s.delay,
        ...cOff(s.off.x, s.off.y),
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        ...cWhite(s.white),
        moveStep: 1,
        phaseId: `future-sight-shake-${i + 1}`,
        phaseName: `2. 시전자 흔들림 (${i + 1}/${shakeSequence.length})`,
      });
    }

    // [3단계: 시전 완료 안착]
    frames.push({
      ...baseFrame,
      delay: 110,
      ...cOff(0, 0),
      pScale: { x: 1.0, y: 1.0 },
      eScale: { x: 1.0, y: 1.0 },
      ...cWhite(0),
      moveStep: 2,
      phaseId: "future-sight-cast-end",
      phaseName: "3. 시전 완료 안착",
    });

    return frames;
  },
};

/**
 * 248: 미래예지 (배틀 2턴 뒤 턴종료 대미지 전용 / Future Sight - Damage Only)
 * - 실제 배틀에서 2턴 뒤 턴 종료 시 타격만 단독 재생
 */
export const futureSightDamageMove: BattleMoveAnimation = {
  num: 248,
  key: "future-sight-damage",
  nameKo: "미래예지 (대미지)",
  nameEn: "Future Sight (Damage)",
  type: "psychic",
  category: "special",
  camera: {
    type: "target",
    zoom: 1.34,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawFutureSightBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawFutureSightEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      showEffect: false,
      showBehindEffect: false,
      cameraZoom: 1.34,
      pRot: 0,
      eRot: 0,
    };

    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    const defWhite = (val: number) => ({
      pWhiteAlpha: !isP ? val : undefined,
      eWhiteAlpha: isP ? val : undefined,
      pWhite: false,
      eWhite: false,
      pWhiteTint: undefined,
      eWhiteTint: undefined,
    });

    const frames: BattleFrame[] = [];

    frames.push({
      ...baseFrame,
      delay: 70,
      ...defOff(0, 0),
      ...defScale(1.0, 1.0),
      ...defWhite(0),
      moveStep: 1,
      phaseId: "future-sight-dmg-aim",
      phaseName: "1. 대상 포커싱",
    });

    const distortSequence = [
      { scale: { x: 1.35, y: 0.68 }, off: { x: 0, y: 5 }, flash: true, white: 0.35, delay: 55, name: "대미지 왜곡 1타 (납작)" },
      { scale: { x: 0.75, y: 1.30 }, off: { x: 0, y: -5 }, flash: false, white: 0.30, delay: 55, name: "대미지 왜곡 1타 (길쭉)" },
      { scale: { x: 1.30, y: 0.72 }, off: { x: 0, y: 4 }, flash: true, white: 0.35, delay: 55, name: "대미지 왜곡 2타 (납작)" },
      { scale: { x: 0.80, y: 1.25 }, off: { x: 0, y: -4 }, flash: false, white: 0.28, delay: 55, name: "대미지 왜곡 2타 (길쭉)" },
      { scale: { x: 1.22, y: 0.80 }, off: { x: 3, y: 3 }, flash: true, white: 0.30, delay: 55, name: "대미지 왜곡 3타 (납작)" },
      { scale: { x: 0.85, y: 1.18 }, off: { x: -3, y: -3 }, flash: false, white: 0.25, delay: 55, name: "대미지 왜곡 3타 (길쭉)" },
      { scale: { x: 1.12, y: 0.90 }, off: { x: 0, y: 2 }, flash: false, white: 0.20, delay: 55, name: "대미지 왜곡 4타 (납작)" },
      { scale: { x: 0.92, y: 1.10 }, off: { x: 0, y: -2 }, flash: false, white: 0.15, delay: 55, name: "대미지 왜곡 4타 (길쭉)" },
    ];

    for (let i = 0; i < distortSequence.length; i++) {
      const d = distortSequence[i];
      frames.push({
        ...baseFrame,
        delay: d.delay,
        hitFlash: d.flash,
        showEffect: true,
        ...defOff(d.off.x, d.off.y),
        ...defScale(d.scale.x, d.scale.y),
        ...defWhite(d.white),
        moveStep: 3,
        phaseId: `future-sight-damage-${i + 1}`,
        phaseName: `2. ${d.name} (${i + 1}/${distortSequence.length})`,
      });
    }

    frames.push({
      ...baseFrame,
      delay: 70,
      showEffect: false,
      ...defOff(0, 1),
      ...defScale(1.04, 0.96),
      ...defWhite(0.08),
      moveStep: 4,
      phaseId: "future-sight-settle-1",
      phaseName: "3. 타격 후 안정화 (1/3)",
    });

    frames.push({
      ...baseFrame,
      delay: 85,
      showEffect: false,
      ...defOff(0, 0),
      ...defScale(1.0, 1.0),
      ...defWhite(0.0),
      moveStep: 4,
      phaseId: "future-sight-settle-2",
      phaseName: "3. 타격 후 안정화 (2/3)",
    });

    frames.push({
      ...baseFrame,
      delay: 110,
      showEffect: false,
      ...defOff(0, 0),
      ...defScale(1.0, 1.0),
      ...defWhite(0.0),
      moveStep: 4,
      phaseId: "future-sight-settle-3",
      phaseName: "3. 타격 후 안정화 (3/3)",
    });

    return frames;
  },
};
