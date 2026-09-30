// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawCurseNormalBehindEffect,
  drawCurseNormalEffect,
  drawCurseGhostBehindEffect,
  drawCurseGhostEffect,
  drawCurseDamageBehindEffect,
  drawCurseDamageEffect,
} from "../../../renderers/moves/gen1/move173_176.js";

/**
 * 174: 저주 (Curse - Normal / Non-Ghost) - 일반 타입(비고스트) 버전
 *
 * 위력: — / 명중: — / PP: 10 / 접촉 판정: X
 * 설명: 시전자의 스피드가 1랭크 떨어지고, 공격과 방어가 1랭크씩 올라간다.
 *
 * [연출 시퀀스]:
 * 1. 살짝 납작해지기 시작하며 수직 침강
 * 2. 좌우로 천천히 흔들리며 수직 이동
 * 3. 원래 자리와 기본 체형으로 복귀
 * 4. 엔진 랭크 다운 애니메이션 재생 (스피드 -1)
 * 5. 엔진 랭크 업 애니메이션 재생 (공격 +1, 방어 +1)
 */
export const curseNormalMove: BattleMoveAnimation = {
  num: 174,
  key: "curse-normal",
  nameKo: "저주 (일반)",
  nameEn: "Curse (Normal)",
  type: "ghost",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawCurseNormalBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawCurseNormalEffect(targetCtx, frame, drawCtx);
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
      rotateFromCenter: true,
      pRotCenter: true,
      eRotCenter: true,
    };

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    const cRot = (rot: number) => ({
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // 1. 살짝 납작해지기 시작하며 수직 침강
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 2),
        ...cScale(1.05, 0.95),
        ...cRot(0),
        ...defOff(0, 0),
        moveStep: 1,
        phaseId: "curse-squash-sink",
        phaseName: "1. 살짝 납작해지며 하강",
      },
      // 2. 납작해진 채 좌측으로 흔들리며 천천히 수직 침강
      {
        ...baseFrame,
        delay: 120,
        ...cOff(-3, 5),
        ...cScale(1.09, 0.90),
        ...cRot(-0.04),
        ...defOff(0, 0),
        moveStep: 2,
        phaseId: "curse-sway-left",
        phaseName: "2. 좌측으로 흔들리며 수직 이동",
      },
      // 3. 최대 수직 침강 지점에서 우측으로 천천히 흔들림
      {
        ...baseFrame,
        delay: 130,
        ...cOff(3, 6),
        ...cScale(1.10, 0.88),
        ...cRot(0.04),
        ...defOff(0, 0),
        moveStep: 2,
        phaseId: "curse-sway-right",
        phaseName: "3. 우측으로 흔들리며 수직 이동",
      },
      // 4. 서서히 위로 상승하며 중심 복귀
      {
        ...baseFrame,
        delay: 120,
        ...cOff(-1, 3),
        ...cScale(1.05, 0.94),
        ...cRot(-0.02),
        ...defOff(0, 0),
        moveStep: 3,
        phaseId: "curse-rise-up",
        phaseName: "4. 천천히 상승하며 중심 복귀",
      },
      // 5. 원래 자리 및 기본 체형 복귀
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        ...cRot(0),
        ...defOff(0, 0),
        moveStep: 4,
        phaseId: "curse-return-neutral",
        phaseName: "5. 원래 자리 및 기본 자세 복귀",
      },
      // 6. 자세 안정화
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        ...cRot(0),
        ...defOff(0, 0),
        moveStep: 4,
        phaseId: "curse-settle",
        phaseName: "6. 자세 안정화",
      },
    ];
  },
};

/**
 * 174: 저주 (Curse - Ghost) - 고스트 타입 전용 버전
 *
 * 위력: — / 명중: — / PP: 10 / 접촉 판정: X
 * 설명: 시전자가 자신의 최대 HP 절반을 깎아 상대에게 저주를 건다. 저주에 걸린 상대는 매 턴 최대 HP의 1/4씩 깎인다.
 *
 * [원작 2~5세대 오컬트 완벽 고증 시퀀스]:
 * 1. Step 1: 칠흑 보랏빛 암전 & 저주의 대못 소환 (220ms)
 *    - 전장이 칠흑의 보랏빛으로 암전되며 시전자 머리/가슴 앞에 날카로운 저주의 대못 출현 및 부유
 * 2. Step 2: 저주의 대못 급강하 관통 & HP 절반 소모 (280ms)
 *    - 대못이 시전자 가슴으로 맹렬히 내리꽂혀 깊숙이 박힘!
 *    - 시전자가 고통스럽게 떨며 붉은 핏빛/보랏빛 영혼 파편을 분출하고 HP 50%를 소모함
 * 3. Step 3: 원혼 그림자 쇄도 & 상대방 가슴에 저주 각인 직격 쾅!! (260ms)
 *    - 카메라가 상대를 향해 글라이드 이동하며 검은 원혼의 그림자가 쇄도
 *    - 상대방 가슴에 거대한 저주의 못이 쾅!! 박히며 강력한 타격 섬광과 충격파 작렬
 * 4. Step 4: 상대 주위를 맴도는 3기 도깨비불 & 저주 상태이상 각인 (255ms)
 *    - 대상 가슴에 저주의 헥사그램 인장이 새겨지고, 3기의 보랏빛 도깨비불이 상대를 공전
 * 5. Step 5: 저주의 불씨가 상대에게 스며들며 페이드아웃 및 카메라 복귀 (170ms)
 */
export const curseGhostMove: BattleMoveAnimation = {
  num: 174,
  key: "curse-ghost",
  nameKo: "저주 (고스트)",
  nameEn: "Curse (Ghost)",
  type: "ghost",
  category: "status",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    delayUntilStep: 3, // Step 1~2: 시전자 희생 포커싱, Step 3부터 상대방으로 이동
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawCurseGhostBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawCurseGhostEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pRot: 0,
      eRot: 0,
    };

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    const cRot = (rad: number) => ({
      pRot: isP ? rad : 0,
      eRot: !isP ? -rad : 0,
    });

    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    return [
      // =======================================================================
      // Step 1: 칠흑 보랏빛 암전 & 저주의 대못 소환 (220ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...cScale(0.98, 1.02),
        ...cRot(0.02),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.40,
        phaseId: "curse-ghost-summon-1",
        phaseName: "1. 칠흑 보랏빛 암전 & 대못 소환",
      },
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 1),
        ...cScale(1.0, 1.0),
        ...cRot(-0.02),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.90,
        phaseId: "curse-ghost-summon-2",
        phaseName: "1. 대못 검정 원 안착 & 저주의 기운 응축",
      },

      // =======================================================================
      // Step 2: 쿵 > 쿵 > 쿵 3단계 타격 & HP 절반 희생 (350ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 110,
        hitFlash: true, // 1st 쿵!
        ...cOff(0, 3),
        ...cScale(1.06, 0.94),
        ...cRot(-0.03),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.33,
        phaseId: "curse-ghost-strike-1",
        phaseName: "2. 저주의 못 1타 (쿵!)",
      },
      {
        ...baseFrame,
        delay: 110,
        hitFlash: true, // 2nd 쿵!
        ...cOff(0, 5),
        ...cScale(1.09, 0.91),
        ...cRot(0.04),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.66,
        phaseId: "curse-ghost-strike-2",
        phaseName: "2. 저주의 못 2타 (쿵!)",
      },
      {
        ...baseFrame,
        delay: 130,
        hitFlash: true, // 3rd 쿵!
        ...cOff(0, 6),
        ...cScale(1.12, 0.88),
        ...cRot(-0.04),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "curse-ghost-strike-3",
        phaseName: "2. 저주의 못 3타 (쿵!) & HP 희생",
      },

      // =======================================================================
      // Step 3: 상대방 가슴에 저주의 대못 쿵 > 쿵 > 쿵 직격! (350ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...defOff(0, 3),
        ...defScale(1.06, 0.94),
        hitFlash: true, // 1st 쿵!
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 0.33,
        phaseId: "curse-ghost-impact-1",
        phaseName: "3. 상대방 저주의 못 1타 (쿵!)",
      },
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...defOff(0, 5),
        ...defScale(1.09, 0.91),
        hitFlash: true, // 2nd 쿵!
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 0.66,
        phaseId: "curse-ghost-impact-2",
        phaseName: "3. 상대방 저주의 못 2타 (쿵!)",
      },
      {
        ...baseFrame,
        delay: 130,
        ...cOff(0, 0),
        ...defOff(0, 6),
        ...defScale(1.12, 0.88),
        hitFlash: true, // 3rd 쿵!
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "curse-ghost-impact-3",
        phaseName: "3. 상대방 저주의 못 3타 (쿵!) & 저주 각인",
      },

      // =======================================================================
      // Step 4: 상대 주위를 맴도는 3기 도깨비불 & 저주 상태이상 각인 (255ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(1, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "curse-ghost-afflict-1",
        phaseName: "4. 가슴팍 헥사그램 저주 각인 점등",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(-1, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.70,
        phaseId: "curse-ghost-afflict-2",
        phaseName: "4. 3기 도깨비불 3D 공전 궤도 회전",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "curse-ghost-afflict-3",
        phaseName: "4. 저주 상태이상 완전 구속",
      },

      // =======================================================================
      // Step 5: 저주의 불씨가 상대에게 스며들며 페이드아웃 (170ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        effectProgress: 0.50,
        phaseId: "curse-ghost-fade-1",
        phaseName: "5. 저주의 불씨 체내 침투",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        effectProgress: 0.95,
        fadeEffectOnCameraReturn: true,
        phaseId: "curse-ghost-fade-2",
        phaseName: "5. 암전 해제 및 카메라 복귀",
      },
    ];
  },
};

/**
 * 174: 저주 (Curse - Damage / Residual) - 매 턴 종료 시 저주 피해 피격 전용 버전
 */
export const curseDamageMove: BattleMoveAnimation = {
  num: 174,
  key: "curse-damage",
  nameKo: "저주 (데미지)",
  nameEn: "Curse (Damage)",
  type: "ghost",
  category: "status",
  camera: {
    type: "target",
    zoom: 1.35,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawCurseDamageBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawCurseDamageEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pRot: 0,
      eRot: 0,
      showEffect: true,
      showBehindEffect: true,
    };

    // 타겟(피격자) 오프셋/스케일/회전
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    const defRot = (rot: number) => ({
      pRot: !isP ? rot : 0,
      eRot: isP ? -rot : 0,
    });

    return [
      // 1. 대기: 검정 원 & 대못 출현 (110ms)
      {
        ...baseFrame,
        delay: 110,
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        ...defRot(0),
        moveStep: 1,
        effectProgress: 0.00,
        phaseId: "curse-damage-wait",
        phaseName: "1. 저주의 대못 출현",
      },
      // 2. 쿵! 타격: 못이 깊숙이 박히며 데미지 작렬 (150ms)
      {
        ...baseFrame,
        delay: 150,
        hitFlash: true,
        ...defOff(0, 5),
        ...defScale(1.12, 0.88),
        ...defRot(0.04),
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "curse-damage-strike",
        phaseName: "2. 저주의 못 타격! (쿵!)",
      },
      // 3. 충격 전율 및 자세 회복 (120ms)
      {
        ...baseFrame,
        delay: 120,
        ...defOff(0, 2),
        ...defScale(1.04, 0.96),
        ...defRot(-0.02),
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "curse-damage-shudder",
        phaseName: "3. 저주 피해 전율",
      },
      // 4. 대못 소산 및 정상 복귀 (120ms)
      {
        ...baseFrame,
        delay: 120,
        ...defOff(0, 0),
        ...defScale(1.00, 1.00),
        ...defRot(0),
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "curse-damage-fade",
        phaseName: "4. 저주 데미지 종료 및 복귀",
      },
      // 5. 기본 화면 복귀 및 UI 노출 (80ms)
      {
        ...baseFrame,
        delay: 80,
        ...defOff(0, 0),
        ...defScale(1.00, 1.00),
        ...defRot(0),
        showEffect: false,
        showBehindEffect: false,
        afterCameraReturn: true,
        hideUI: false,
        phaseId: "curse-damage-return",
        phaseName: "5. 기본 화면 복귀",
      },
    ];
  },
};

/**
 * 174: 저주 (Curse) - 통합 라우팅 정의
 *
 * 시전자의 타입 또는 moveKey에 따라 고스트타입 버전과 일반타입 버전, 피격 데미지 버전으로 자동 분기합니다.
 */
export const curseMove: BattleMoveAnimation = {
  num: 174,
  key: "curse",
  nameKo: "저주",
  nameEn: "Curse",
  type: "ghost",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.phaseId?.startsWith("curse-damage")) {
      drawCurseDamageBehindEffect(targetCtx, frame, drawCtx);
    } else if (frame.phaseId?.startsWith("curse-ghost")) {
      drawCurseGhostBehindEffect(targetCtx, frame, drawCtx);
    } else {
      drawCurseNormalBehindEffect(targetCtx, frame, drawCtx);
    }
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.phaseId?.startsWith("curse-damage")) {
      drawCurseDamageEffect(targetCtx, frame, drawCtx);
    } else if (frame.phaseId?.startsWith("curse-ghost")) {
      drawCurseGhostEffect(targetCtx, frame, drawCtx);
    } else {
      drawCurseNormalEffect(targetCtx, frame, drawCtx);
    }
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const action = ctx.action;
    if (action?.moveKey === "curse-damage" || action?.moveKey === "cursedamage") {
      return curseDamageMove.buildFrames(ctx);
    }

    const isGhost = Boolean(
      action?.moveKey === "curse-ghost" ||
      action?.log?.includes("체력") ||
      action?.log?.includes("cut its own HP") ||
      action?.log?.includes("저주를 걸었다") ||
      action?.log?.includes("laid a curse")
    );

    if (isGhost) {
      return curseGhostMove.buildFrames(ctx);
    }
    return curseNormalMove.buildFrames(ctx);
  },
};
