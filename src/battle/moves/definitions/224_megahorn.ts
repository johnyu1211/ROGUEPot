// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawMegahornBehindEffect,
  drawMegahornEffect,
} from "../../../renderers/moves/gen1/move221_224.js";

/**
 * 224: 메가혼 (Megahorn / メガホーン) - 벌레 타입 물리 기술
 *
 * 위력: 120 / 명중: 85 / PP: 10 / 접촉: O
 * 설명: 단단하고 훌륭한 뿔로 마음껏 상대를 꿰찔러서 공격한다. (헤라크로스 상징기)
 */
export const megahornMove: BattleMoveAnimation = {
  num: 224,
  key: "megahorn",
  nameKo: "메가혼",
  nameEn: "Megahorn",
  type: "bug",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    focalRatio: 1.0,
    delayUntilStep: 2,
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawMegahornBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMegahornEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 전용 오프셋 (아군: +X, +Y / 적군: -X, -Y)
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    // 피격자 전용 오프셋 (피격 방향 넉백: 아군 공격 시 적군 +x, +y / 적군 공격 시 아군 -x, -y)
    const cTargetOff = (x: number, y: number) =>
      isP ? { eOffset: { x, y } } : { pOffset: { x: -x, y: -y } };

    // 시전자 스케일 및 틸트 각도 변형
    const cTransform = (scaleX: number, scaleY: number, rot: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    const frames: BattleFrame[] = [];

    // =========================================================================
    // [Step 1: 기(起) - 박치기 도움닫기 웅크림 (도약 탄성 축적, 뿔 준비 없음!)]
    // - 5프레임 (45ms): 자세를 깊게 낮추며 뒤로 당겨 도약 힘을 축적함
    // =========================================================================
    const step1Count = 5;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      const ease = Math.sin(prog * Math.PI * 0.5);
      const crouchX = -ease * 18;
      const crouchY = ease * 7;
      const scaleX = 1.0 + ease * 0.14;
      const scaleY = 1.0 - ease * 0.14;
      const rot = -ease * 0.09;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(crouchX, crouchY),
        ...cTargetOff(0, 0),
        ...cTransform(scaleX, scaleY, rot),
        moveStep: 1,
        effectProgress: prog,
        showEffect: true, // 발밑 지면 마찰 먼지만 표현 (뿔 없음!)
        showBehindEffect: false,
        phaseId: "megahorn-windup",
        phaseName: "#1. 박치기 도움닫기 웅크림 (뿔 준비 없음)",
      });
    }

    // =========================================================================
    // [Step 2: 승(承) - 박치기 초고속 쇄도 & 거대 에메랄드 메가혼 출현!]
    // - 4프레임 (35ms): 상대 진영을 향해 벼락같이 쇄도할 때 이마에 거대 뿔이 나타남!
    // =========================================================================
    const step2Count = 4;
    for (let i = 0; i < step2Count; i++) {
      const prog = (i + 1) / step2Count;
      const thrustX = 30 + prog * 62;
      const thrustY = -11 - prog * 23;
      const scaleX = 0.86;
      const scaleY = 1.18;
      const rot = 0.24;

      frames.push({
        ...baseFrame,
        delay: 35,
        ...cOff(thrustX, thrustY),
        ...cTargetOff(0, 0),
        ...cTransform(scaleX, scaleY, rot),
        moveStep: 2,
        effectProgress: prog,
        showEffect: true, // [유저 요청] 박치기 돌진 시 거대 뿔 출현!
        showBehindEffect: false, // 타격 전에는 후면 필터/암전 없음
        phaseId: "megahorn-rush",
        phaseName: "#2. 박치기 돌진 쇄도 & 거대 뿔 출현",
      });
    }

    // =========================================================================
    // [Step 3: 전(轉) - 정면 머리 격돌 & 뿔 꿰찌르기 직격 + 거대 초승달 참격 폭발!]
    // - 10프레임 (42ms): 정면 충돌 순간 뿔이 상대 면전에 꽂히며 초대형 참격과 파편 폭쇄
    // =========================================================================
    const step3Count = 10;
    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);
      const hitFlash = isHit && (i === 0 || i === 2);

      let casterX = 92;
      let casterY = -34;
      let scaleX = 1.25;
      let scaleY = 0.80;
      let rot = 0.08;
      let targetX = 0;
      let targetY = 0;

      if (i < 3) {
        targetX = isHit ? (18 + i * 4) : 0;
        targetY = isHit ? (-7 - i * 1.5) : 0;
      } else {
        const recoilP = (i - 2) / 7;
        casterX = 92 - recoilP * 55;
        casterY = -34 + recoilP * 20;
        scaleX = 1.25 - recoilP * 0.25;
        scaleY = 0.80 + recoilP * 0.20;
        rot = 0.08 - recoilP * 0.08;

        const targetEase = 1.0 - Math.pow(recoilP, 1.5);
        targetX = isHit ? (26 * targetEase) : 0;
        targetY = isHit ? (-10 * targetEase) : 0;
      }

      // [유저 요청] 타격 직후 대상 포켓몬 부들부들 고주파 떨림 (Shudder)
      if (isHit && i < 7) {
        const shudderDecay = 1.0 - i / 7;
        const shudderX = (i % 2 === 0 ? 1 : -1) * (5.5 * shudderDecay);
        const shudderY = (i % 3 === 0 ? -1 : 1) * (3.5 * shudderDecay);
        targetX += shudderX;
        targetY += shudderY;
      }

      // [유저 요청] 카메라 살짝 흔들림 (Camera shake on impact)
      let cameraPan: { x: number; y: number } | undefined = undefined;
      if (isHit && i < 6) {
        const shakeP = 1.0 - i / 6;
        const shakeMag = 4.5 * shakeP;
        cameraPan = {
          x: (i % 2 === 0 ? shakeMag : -shakeMag) * 1.1,
          y: ((i + 1) % 2 === 0 ? -shakeMag : shakeMag) * 0.7,
        };
      }

      frames.push({
        ...baseFrame,
        delay: 42,
        ...cOff(casterX, casterY),
        ...cTargetOff(targetX, targetY),
        ...cTransform(scaleX, scaleY, rot),
        cameraPan,
        hitFlash,
        targetRedTint: isHit && i < 4,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 3,
        effectProgress: prog,
        showEffect: true, // 격돌 초기 뿔 꽂힘 + 초승달 참격 + 키틴질 파편 폭쇄 + 링 팽창
        showBehindEffect: true, // [유저 요청] 이미 암전된 화면에서 서서히 암전 풀림
        phaseId: "megahorn-impact",
        phaseName: "#3. 정면 박치기 격돌 & 뿔 꿰찌르기 작렬",
      });
    }

    // =========================================================================
    // [Step 4: 결(結) - 충돌 반동 마무리 & 제자리 복귀]
    // - 5프레임 (45ms): 반동 수습 후 자연스러운 기본 자세 안착
    // =========================================================================
    const step4Count = 5;
    for (let i = 0; i < step4Count; i++) {
      const prog = i / (step4Count - 1);
      const returnEase = 1.0 - prog;
      const casterX = 37 * returnEase;
      const casterY = -14 * returnEase;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(casterX, casterY),
        ...cTargetOff(0, 0),
        ...cTransform(1.0, 1.0, 0),
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        effectProgress: prog,
        showEffect: true, // 잔여 에메랄드 스파클 소산
        showBehindEffect: false,
        phaseId: "megahorn-return",
        phaseName: "#4. 안정 착지 및 제자리 복귀",
      });
    }

    return frames;
  },
};
