// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawChargeBehindEffect,
  drawChargeEffect,
} from "../../../renderers/moves/gen1/move265_268.js";

/**
 * ⚡ 268: 충전 (Charge / じゅうでん) - 전기 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 20 / 대상: 자신 / 접촉: X
 * 설명: 전력을 모아 충전한다. 다음 턴에 쓸 전기타입 기술의 위력을 2배로 올리고, 자신의 특수방어도 1랭크 올린다.
 *
 * [연출 시퀀스]:
 * 1. [Step 1: 전자기 에너지 수렴 및 집적 (Converging Influx)]:
 *    - 시전자가 힘을 모으듯 몸을 낮추어 웅크림 (Squash: sx 1.08, sy 0.92) & 미세한 전자기 진동
 *    - 사방 360도에서 시전자 중심을 향해 나선형으로 쇄도하는 노란색/황금색 지그재그 스파크 및 일렉트릭 파티클
 *    - 발밑에 맥동하는 황금빛 전자기장 오라 링 & 은은한 노란빛 틴트 페이드인
 * 2. [Step 2: 전격 대방전 폭발 & 특수방어 상승 버프 (Supercharged Burst & Sp.Def Buff)]:
 *    - 화면 전체를 순간적으로 밝히는 눈부신 전자기 섬광 (Flicker Flash)
 *    - 시전자가 전력을 터뜨리며 가슴을 펴고 솟구침 (Apex Stretch: sx 0.88, sy 1.18, dy -6)
 *    - 발밑에서 사방으로 급격히 팽창하는 2중 고전압 전격 방전 링
 *    - 시전자 둘레와 배후에서 뻗어나가는 강력한 방사형 지그재그 번개 아크 & 8각 골든 스타버스트 코어
 *    - 머리 위로 솟아오르는 특수방어 상승 상징 청록/민트빛 및 황금빛 상승 화살표 & 반짝이는 별무리
 * 3. [Step 3: 잔류 전류 및 안정화 (Residual Crackle)]:
 *    - 포켓몬이 원위치로 부드럽게 복귀하며 몸 표면에 파직- 파직- 튀는 잔류 정전기 스파크
 *    - 노란빛 틴트와 발밑 잔광이 서서히 소산되며 충전 완료 태세 확립
 */
export const chargeMove: BattleMoveAnimation = {
  num: 268,
  key: "charge",
  nameKo: "충전",
  nameEn: "Charge",
  type: "electric",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.30,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawChargeBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawChargeEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.30,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 변형 헬퍼
    const cTransform = (x = 0, y = 0, scaleX = 1.0, scaleY = 1.0, rot = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
      pScale: isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP && rot !== 0 ? rot : undefined,
      eRot: !isP && rot !== 0 ? -rot : undefined,
    });

    // 노란빛 전자기 틴트 헬퍼
    const cTint = (alpha: number, isWhiteFlash = false) => {
      if (alpha <= 0.01) return { pTintColor: null, eTintColor: null };
      const colorStr = isWhiteFlash
        ? `rgba(255, 255, 255, ${alpha.toFixed(2)})`
        : `rgba(254, 240, 138, ${alpha.toFixed(2)})`;
      return {
        pTintColor: isP ? colorStr : null,
        eTintColor: !isP ? colorStr : null,
      };
    };

    const frames: BattleFrame[] = [];

    // ========================================================================
    // [Step 1: 전자기 에너지 수렴 및 집적] (10프레임, 44ms)
    // 웅크림(Squash) & 전자기 진동 & 사방에서 스파크 수렴 & 틴트 페이드인
    // ========================================================================
    const step1Count = 10;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      // 부드러운 웅크림 (sy 1.0 -> 0.92, sx 1.0 -> 1.08, dy 0 -> +3)
      const squashEase = Math.sin(prog * (Math.PI / 2));
      const sx = 1.0 + squashEase * 0.08;
      const sy = 1.0 - squashEase * 0.08;
      const dy = squashEase * 3;

      // 후반부 충전 전력 진동 (Jitter)
      const jitterX = prog > 0.4 ? (Math.sin(i * 3.8) * 1.5 * (prog - 0.4)) : 0;
      const tintAlpha = prog * 0.40;

      frames.push({
        ...baseFrame,
        delay: 44,
        ...cTransform(jitterX, dy, sx, sy),
        ...cTint(tintAlpha),
        moveStep: 1,
        effectProgress: prog,
        phaseId: `charge-influx-${i + 1}`,
        phaseName: `#1. 전자기 에너지 수렴 (${i + 1}/${step1Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 2: 전격 대방전 폭발 & 특수방어 상승 버프] (12프레임, 40ms)
    // 번쩍!(섬광) & 솟구침(Stretch) & 방사형 번개 아크 & 특방 상승 화살표
    // ========================================================================
    const step2Count = 12;
    for (let i = 0; i < step2Count; i++) {
      const prog = i / (step2Count - 1);

      // 도약 솟구침 커브 (빠른 상승 후 안착)
      let dy = 0;
      let sx = 1.0;
      let sy = 1.0;
      if (prog < 0.4) {
        const upProg = prog / 0.4;
        dy = 3 - upProg * 9; // +3 -> -6
        sx = 1.08 - upProg * 0.20; // 1.08 -> 0.88
        sy = 0.92 + upProg * 0.26; // 0.92 -> 1.18
      } else if (prog < 0.75) {
        const holdProg = (prog - 0.4) / 0.35;
        dy = -6 + holdProg * 4; // -6 -> -2
        sx = 0.88 + holdProg * 0.10; // 0.88 -> 0.98
        sy = 1.18 - holdProg * 0.14; // 1.18 -> 1.04
      } else {
        const settleProg = (prog - 0.75) / 0.25;
        dy = -2 + settleProg * 2; // -2 -> 0
        sx = 0.98 + settleProg * 0.02; // 0.98 -> 1.0
        sy = 1.04 - settleProg * 0.04; // 1.04 -> 1.0
      }

      // 초기 프레임 강력한 백색 섬광 틴트 ➔ 골든 틴트
      const isWhiteFlash = prog < 0.25;
      const tintAlpha = isWhiteFlash ? 0.65 : Math.max(0, 0.45 * (1.0 - prog));

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cTransform(0, dy, sx, sy),
        ...cTint(tintAlpha, isWhiteFlash),
        moveStep: 2,
        effectProgress: prog,
        phaseId: `charge-burst-${i + 1}`,
        phaseName: `#2. 고전압 방전 및 특수방어 상승 (${i + 1}/${step2Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 3: 잔류 전류 및 안정화] (6프레임, 48ms)
    // 원위치 복귀 & 표면 파직거리는 잔류 스파크 & 틴트 소산
    // ========================================================================
    const step3Count = 6;
    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);
      const tintAlpha = (1.0 - prog) * 0.20;

      frames.push({
        ...baseFrame,
        delay: 48,
        ...cTransform(0, 0, 1.0, 1.0),
        ...cTint(tintAlpha),
        moveStep: 3,
        effectProgress: prog,
        phaseId: `charge-settle-${i + 1}`,
        phaseName: `#3. 충전 전력 잔류 및 안정화 (${i + 1}/${step3Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    return frames;
  },
};
