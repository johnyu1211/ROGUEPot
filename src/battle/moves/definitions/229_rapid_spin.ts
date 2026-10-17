// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawRapidSpinBehindEffect,
  drawRapidSpinEffect,
} from "../../../renderers/moves/gen1/move229_232.js";

/**
 * 229: 고속스핀 (Rapid Spin / こうそくスピン) - 노말 타입 물리 기술
 *
 * 위력: 50 / 명중: 100 / PP: 40 / 접촉: O
 * 설명: 고속으로 회전하여 상대를 공격한다. 조이기, 씨뿌리기, 압정뿌리기 등을 날려버린다.
 * 부가 효과: 100% 확률로 자신의 스피드가 1랭크 상승.
 */
export const rapidSpinMove: BattleMoveAnimation = {
  num: 229,
  key: "rapid-spin",
  nameKo: "고속스핀",
  nameEn: "Rapid Spin",
  type: "normal",
  category: "physical",
  camera: {
    type: "rush",
    zoom: 1.30,
  },
  drawBehindEffect: () => {
    // 이펙트 임시 비활성화 (순수 스프라이트 회전 확인용)
  },
  drawEffect: () => {
    // 이펙트 임시 비활성화 (순수 스프라이트 회전 확인용)
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
      drawEnemyOnTop: false, // 내 포켓몬(Player) 시전 및 상대 시전 모두 내 포켓몬이 항상 z축 위(전경)에 렌더링
    };

    const battlerOffsets = (
      casterX: number,
      casterY: number,
      targetX: number = 0,
      targetY: number = 0
    ) => ({
      pOffset: isP ? { x: casterX, y: casterY } : { x: targetX, y: targetY },
      eOffset: isP ? { x: targetX, y: targetY } : { x: -casterX, y: -casterY },
    });

    /**
     * 🌪️ 3D 수평 회전 (Horizontal / Yaw Spin) 헬퍼
     * 
     * 각도(angle in radians)에 따라 가로 너비(scaleX = |cos(angle)|)를 수축/팽창하며,
     * cos(angle) < 0 인 반구(반바퀴 회전 시점)에서는 스프라이트를 전면/후면 전환:
     * - 아군(Player): 기본 후면(등) -> 전면(usePlayerFront: true)으로 전환
     * - 적군(Enemy):  기본 전면(앞) -> 후면(useEnemyBack: true)으로 전환
     * Z축 덤블링 롤링(pRot)이 아닌 팽이/블레이드 형태의 진정한 3D 수평 고속 회전을 완벽 구현
     */
    const cSpin = (angle: number) => {
      const cosVal = Math.cos(angle);
      const inOppositeHemisphere = cosVal < 0;
      const scaleX = Math.max(0.12, Math.abs(cosVal));
      const scaleY = 1.0 - (1.0 - scaleX) * 0.05;

      return {
        pScale: isP ? { x: scaleX, y: scaleY } : undefined,
        eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
        pRot: 0,
        eRot: 0,
        usePlayerFront: isP ? inOppositeHemisphere : false,
        useEnemyBack: !isP ? inOppositeHemisphere : false,
      };
    };

    const frames: BattleFrame[] = [];

    // [Step 1: 기(起) - 제자리 고속 수평 회전 가속 및 회전력 축적] (6프레임, 45ms)
    // 매 프레임마다 엄격하게 [등 -> 앞 -> 등 -> 앞 -> 등 -> 앞]으로 교차 반전 (동일 방향 2연속 유지 방지)
    // 가속함에 따라 가로 너비(scaleX)가 점진적으로 압축/수축
    const step1Scales = [1.00, 0.60, 0.80, 0.40, 0.70, 0.28];
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      const scaleX = step1Scales[i];
      const isFront = (i % 2 === 1);
      // Math.acos(isFront ? -scaleX : scaleX)로 cos의 부호와 크기를 정밀 제어
      const angle = Math.acos(isFront ? -scaleX : scaleX);

      frames.push({
        ...baseFrame,
        delay: 45,
        ...battlerOffsets(0, 0),
        ...cSpin(angle),
        moveStep: 1,
        phaseId: `rapid-spin-charge-${i + 1}`,
        phaseName: "#1. 고속 수평 회전 가속 및 팽이 준비",
        effectProgress: prog,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    // [Step 2: 승(承) - 초고속 수평 회전 돌진 (적에게 닿을 때까지 회전)] (7프레임, 38ms)
    // Step 1의 마지막(앞)에 이어 [등 -> 앞 -> 등 -> 앞 -> 등 -> 앞 -> 등]으로 완벽 교차
    // 팽이처럼 최고속 수평 회전을 유지하다가, 적에게 닿는 순간(마지막 프레임) scaleX = 1.00(등)으로 정상 안착
    const dashTargetDistX = 205;
    const dashTargetDistY = -98;
    const step2Scales = [0.65, 0.22, 0.75, 0.22, 0.65, 0.35, 1.00];
    for (let i = 0; i < 7; i++) {
      const prog = i / 6;
      const curDistX = prog * dashTargetDistX;
      const curDistY = prog * dashTargetDistY;
      const scaleX = step2Scales[i];
      const isFront = (i % 2 === 1);
      const angle = Math.acos(isFront ? -scaleX : scaleX);

      frames.push({
        ...baseFrame,
        delay: 38,
        ...battlerOffsets(curDistX, curDistY),
        ...cSpin(angle),
        moveStep: 2,
        phaseId: `rapid-spin-dash-${i + 1}`,
        phaseName: "#2. 초고속 수평 회전 돌진 (적 접촉까지)",
        effectProgress: prog,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    // [Step 3: 전(轉) - 적 접촉 직격 타격 & 피격 반응] (5프레임, 45ms)
    // 적에게 닿았으므로 회전을 멈추고 타격 전달 (시전자는 접촉 위치 유지, 피격자 넉백)
    for (let i = 0; i < 5; i++) {
      const prog = i / 4;
      const knockbackX = isHit ? Math.sin((1.0 - prog) * Math.PI) * 16 * (isP ? 1 : -1) : 0;
      const shakeY = isHit && i < 4 ? ((i % 2 === 0 ? 1 : -1) * 4) : 0;

      // 타격 접촉부 미세 진동
      const wobbleX = (i % 2 === 0 ? 2 : -2);
      const wobbleY = (i % 2 === 0 ? -1 : 1);

      frames.push({
        ...baseFrame,
        delay: 45,
        ...battlerOffsets(dashTargetDistX + wobbleX, dashTargetDistY + wobbleY, knockbackX, shakeY),
        pScale: undefined,
        eScale: undefined,
        pRot: 0,
        eRot: 0,
        usePlayerFront: false,
        useEnemyBack: false,
        hitFlash: false,
        moveStep: 3,
        phaseId: `rapid-spin-impact-${i + 1}`,
        phaseName: "#3. 적 접촉 직격 타격 (회전 멈춤)",
        effectProgress: prog,
        hitProgress: prog,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    // [Step 4: 결(結) - 원위치 복귀 (회전 없이 정상 자세로 복귀)] (5프레임, 40ms)
    // 회전하지 않고 원래 기본 자세(정상 스프라이트)로 접촉 위치에서 원래 위치로 매끄럽게 복귀
    for (let i = 0; i < 5; i++) {
      const prog = i / 4;
      const returnProg = 1.0 - prog;
      const easeReturn = Math.pow(returnProg, 1.2);
      const curDistX = easeReturn * dashTargetDistX;
      const curDistY = easeReturn * dashTargetDistY;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...battlerOffsets(curDistX, curDistY),
        pScale: undefined,
        eScale: undefined,
        pRot: 0,
        eRot: 0,
        usePlayerFront: false,
        useEnemyBack: false,
        moveStep: 4,
        phaseId: `rapid-spin-return-${i + 1}`,
        phaseName: "#4. 제자리로 원위치 복귀 (회전 없음)",
        effectProgress: prog,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
