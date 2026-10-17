// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawIronTailBehindEffect,
  drawIronTailEffect,
} from "../../../renderers/moves/gen1/move229_232.js";

/**
 * 231: 아이언테일 (Iron Tail / アイアンテール) - 강철 타입 물리 기술
 *
 * 위력: 100 / 명중: 75 / PP: 15 / 접촉: O
 * 설명: 단단한 꼬리로 상대를 힘껏 쳐서 공격한다. 30% 확률로 상대의 방어를 1랭크 떨어뜨린다.
 *
 * [커스텀 연출 기승전결 시퀀스]:
 * 1. [기(起) - 단단해지기(Harden) 경화 & 강철화 충전]:
 *    - 온몸이 슬레이트 그레이(강철 메탈릭) 필터로 전환 (pGreyTint)
 *    - 시전자 몸체 실루엣에 100% 마스킹된 단색 순백 금속 반사 사선 스트라이프 스위프 (좌상단 -> 우하단)
 *    - 시전자 우측 및 꼬리에 "칭!(Tink!)" 선명한 대칭 순백 십자선 메탈릭 반짝임 (Cross Star Sparkle)
 * 2. [승(承) - 대상 포켓몬 근처 도약 & 스프라이트 수평 3D 회전(앞면/뒷면) & 참격 호선 전개]:
 *    - 대상 포켓몬 바로 앞까지 공중 도약 쇄도
 *    - 공중에서 3D 수평 회전 (등 -> 앞면 usePlayerFront -> 등 교차)
 *    - 등을 돌리는 순간 뻗어나오는 거대한 은빛 초승달 참격 호선 전개 (다각형 꼬리/잡다한 글린트 배제)
 * 3. [전(轉) - 묵직한 강철 꼬리 직격 강타 & 대격돌]:
 *    - 대상 전면에 강철 꼬리 수직/대각 강타
 *    - 은백색 충돌 섬광 (hitFlash) + 대형 스타버스트 충격파 + 대각선 강철 절삭선 + 지면 충격파 링 + 크롬 파편 비산
 *    - 피격자 넉백 및 진동 반응
 * 4. [결(結) - 원위치 복귀 착지 & 방어력 하락 디버프]:
 *    - 반동을 이용해 원위치로 매끄럽게 복귀
 *    - 30% 확률 상대 방어력 1랭크 하락 디버프 파티클 연계
 */
export const ironTailMove: BattleMoveAnimation = {
  num: 231,
  key: "iron-tail",
  nameKo: "아이언테일",
  nameEn: "Iron Tail",
  type: "steel",
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
    drawIronTailBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawIronTailEffect(targetCtx, frame, drawCtx);
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
      drawEnemyOnTop: !isP, // 적 시전 시 아군보다 전경에 렌더링, 아군 시전 시 아군이 전경
    };

    const targetDistX = isP ? 195 : -195;
    const targetDistY = isP ? -85 : 68;

    const battlerOffsets = (
      casterX: number,
      casterY: number,
      targetX: number = 0,
      targetY: number = 0
    ) => ({
      pOffset: isP ? { x: casterX, y: casterY } : { x: targetX, y: targetY },
      eOffset: isP ? { x: targetX, y: targetY } : { x: casterX, y: casterY },
    });

    /**
     * 🌪️ 3D 수평 회전 (Horizontal / Yaw Spin) 헬퍼
     * 
     * 각도(angle in radians)에 따라 가로 너비(scaleX = |cos(angle)|)를 수축/팽창하며,
     * cos(angle) < 0 인 반구에서는 스프라이트를 전면/후면 전환:
     * - 아군(Player): 기본 후면(등) -> 전면(usePlayerFront: true)으로 전환
     * - 적군(Enemy):  기본 전면(앞) -> 후면(useEnemyBack: true)으로 전환
     */
    const cSpin = (angle: number) => {
      const cosVal = Math.cos(angle);
      const inOppositeHemisphere = cosVal < 0;
      const scaleX = Math.max(0.15, Math.abs(cosVal));
      const scaleY = 1.0 - (1.0 - scaleX) * 0.05;

      return {
        pScale: isP ? { x: scaleX, y: scaleY } : undefined,
        eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
        usePlayerFront: isP ? inOppositeHemisphere : false,
        useEnemyBack: !isP ? inOppositeHemisphere : false,
      };
    };

    const frames: BattleFrame[] = [];

    // =========================================================================
    // [Step 1: 기(起) - 단단해지기(Harden) 경화 & 강철화 충전] (6프레임, 45ms)
    // =========================================================================
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      const crouchY = prog * 4;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...battlerOffsets(0, crouchY),
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        pGreyTint: isP,
        eGreyTint: !isP,
        usePlayerFront: false,
        useEnemyBack: false,
        moveStep: 1,
        phaseId: `iron-tail-harden-${i + 1}`,
        phaseName: "#1. 단단해지기(Harden) 경화 및 사선 금속 광택 스위프",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // =========================================================================
    // [Step 2: 승(承) - 대상 포켓몬 근처 도약 & 한 바퀴 360도 회전 & 과감한 48도 오버턴 장전] (8프레임, 38ms)
    // =========================================================================
    // 대상 바로 앞(접촉 범위)까지 공중 포물선 도약
    // 1) i = 0 ~ 5: 한 바퀴 360도 수평 회전 (등/앞 교차)
    // 2) i = 6 ~ 7: 복귀 후 뒤쪽으로 과감하게 48도 더 돌아간 상태로 꼬리를 치켜들어 내려치기 장전
    const step2Scales = [0.90, 0.40, 0.85, 0.95, 0.40, 0.85, 0.96, 1.00];
    const isFrontSeq = [false, false, true, true, false, false, false, false];
    const boldLeftTilt = (48 * Math.PI) / 180; // 과감한 48도 틸트 (약 0.838 rad)

    for (let i = 0; i < 8; i++) {
      const prog = i / 7;
      const leapY = -Math.sin(prog * Math.PI) * 26; // 공중 도약 (항상 상향 음수 Y)
      const curDistX = prog * targetDistX;
      const curDistY = prog * targetDistY + leapY;

      const scaleX = step2Scales[i];
      const isFront = isFrontSeq[i];
      const angle = Math.acos(isFront ? -scaleX : scaleX);

      // 한 바퀴 돌고 돌아올 때(i >= 5) 꼬리를 치켜드는 틸트 적용 (아군 음수 회전, 적군 양수 회전)
      const tiltDir = isP ? -1 : 1;
      let tilt = 0;
      if (i === 5) {
        tilt = tiltDir * boldLeftTilt * 0.45;
      } else if (i === 6) {
        tilt = tiltDir * boldLeftTilt * 0.90;
      } else if (i === 7) {
        tilt = tiltDir * boldLeftTilt;
      }

      frames.push({
        ...baseFrame,
        delay: 38,
        ...battlerOffsets(curDistX, curDistY),
        ...cSpin(angle),
        pRot: isP ? tilt : undefined,
        eRot: !isP ? tilt : undefined,
        pGreyTint: isP,
        eGreyTint: !isP,
        moveStep: 2,
        phaseId: `iron-tail-spin-leap-${i + 1}`,
        phaseName: "#2. 대상 근처 도약 & 한 바퀴 회전 후 과감한 48도 오버턴 장전",
        effectProgress: prog,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    // =========================================================================
    // [Step 3: 전(轉) - 묵직한 강철 꼬리 직격 강타 (앞으로 확 회전하며 내려침)] (6프레임, 48ms)
    // =========================================================================
    const tiltDir = isP ? -1 : 1;
    const slamTilts = [
      tiltDir * boldLeftTilt * 0.75, // i=0: 타격 순간
      tiltDir * boldLeftTilt * 0.28, // i=1: 강타 풀 임팩트
      0,                             // i=2: 지면 파열 & 앞으로 완전히 돌아옴
      -tiltDir * boldLeftTilt * 0.12,// i=3: 반동으로 살짝 반대쪽 미세 오버슈트
      0,                             // i=4: 안정화
      0,                             // i=5: 정렬
    ];

    // 앞으로 돌아가는 회전감 (Yaw 스케일)
    const slamScaleXs = [0.90, 0.75, 0.96, 1.00, 1.00, 1.00];

    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      const hitFlash = isHit && i === 0;
      const knockbackX = isHit ? Math.sin((1.0 - prog) * Math.PI) * 22 * (isP ? 1 : -1) : 0;
      const shakeY = isHit && i < 4 ? ((i % 2 === 0 ? 1 : -1) * 6 * (1.0 - i / 4)) : 0;

      // 접촉 위치 미세 충격 반동
      const wobbleX = (i % 2 === 0 ? 2 : -2) * (isP ? 1 : -1);
      const wobbleY = (i % 2 === 0 ? -1 : 1);

      const rot = slamTilts[i];
      const scaleX = slamScaleXs[i];

      frames.push({
        ...baseFrame,
        delay: 48,
        ...battlerOffsets(targetDistX + wobbleX, targetDistY + wobbleY, knockbackX, shakeY),
        pScale: isP ? { x: scaleX, y: 1.0 } : undefined,
        eScale: !isP ? { x: scaleX, y: 1.0 } : undefined,
        pRot: isP ? rot : undefined,
        eRot: !isP ? rot : undefined,
        usePlayerFront: isP && i < 2,
        useEnemyBack: !isP && i < 2,
        pGreyTint: isP,
        eGreyTint: !isP,
        hitFlash,
        moveStep: 3,
        phaseId: `iron-tail-slam-${i + 1}`,
        phaseName: i < 2
          ? "#3. 묵직한 강철 꼬리 직격 강타 (뒤로 회전 타격 2프레임)"
          : "#3. 묵직한 강철 꼬리 직격 강타 (정면 복귀 및 지면 파열)",
        effectProgress: prog,
        hitProgress: prog,
        showEffect: isHit,
        showBehindEffect: false,
      });
    }

    // =========================================================================
    // [Step 4: 결(結) - 원위치 복귀 착지 & 방어력 하락 디버프] (5프레임, 42ms)
    // =========================================================================
    for (let i = 0; i < 5; i++) {
      const prog = i / 4;
      const returnProg = 1.0 - prog;
      const easeReturn = Math.pow(returnProg, 1.2);
      const curDistX = easeReturn * targetDistX;
      const curDistY = easeReturn * targetDistY;

      frames.push({
        ...baseFrame,
        delay: 42,
        ...battlerOffsets(curDistX, curDistY),
        pScale: undefined,
        eScale: undefined,
        pRot: 0,
        eRot: 0,
        pGreyTint: false,
        eGreyTint: false,
        usePlayerFront: false,
        useEnemyBack: false,
        moveStep: 4,
        phaseId: `iron-tail-recover-${i + 1}`,
        phaseName: "#4. 원위치 복귀 착지 및 방어력 하락 디버프",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
