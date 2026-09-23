// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";

function getSubAnim(key: string): BattleMoveAnimation | undefined {
  if (typeof (globalThis as any).__getMoveAnimation === "function") {
    return (globalThis as any).__getMoveAnimation(key);
  }
  return undefined;
}

/**
 * 119: 따라하기 (Mirror Move / オウムがえし)
 *
 * 사용자 요구사항:
 * - "따라하기는 특수한 고유 모션 없이 바로 상대방 기술 따라하도록 해줘"
 * - "(상대방 에이스번은 화염방사)"
 *
 * 연출 구성:
 * - 별도의 고유 선행 모션 없이, 상대방이 직전에 사용한 기술(예: 화염방사, 10만볼트 등)의
 *   고유 애니메이션 및 타격 이펙트를 즉시 그대로 시전.
 * - 복사된 기술의 카메라(화염방사의 beam 궤적, 10만볼트의 target 줌인 등), 타격, 피격 넉백,
 *   HP 감소 연출이 그대로 발동.
 */
export const mirrorMove: BattleMoveAnimation = {
  num: 119,
  key: "mirror-move",
  nameKo: "따라하기",
  nameEn: "Mirror Move",
  type: "flying",
  category: "status",
  camera: { type: "target" },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    const rawCopiedKey = (frame.copiedMoveKey || frame.moveEffect?.copiedMoveKey || "flamethrower").toLowerCase().replace(/[\s_]+/g, "-");
    const safeCopiedKey = (rawCopiedKey === "mirror-move" || rawCopiedKey === "mirrormove" || rawCopiedKey === "119")
      ? "flamethrower"
      : rawCopiedKey;
    const copiedAnim = getSubAnim(safeCopiedKey);
    if (copiedAnim?.drawBehindEffect) {
      copiedAnim.drawBehindEffect(targetCtx, frame, drawCtx);
    }
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    const rawCopiedKey = (frame.copiedMoveKey || frame.moveEffect?.copiedMoveKey || "flamethrower").toLowerCase().replace(/[\s_]+/g, "-");
    const safeCopiedKey = (rawCopiedKey === "mirror-move" || rawCopiedKey === "mirrormove" || rawCopiedKey === "119")
      ? "flamethrower"
      : rawCopiedKey;
    const copiedAnim = getSubAnim(safeCopiedKey);
    if (copiedAnim?.drawEffect) {
      copiedAnim.drawEffect(targetCtx, frame, drawCtx);
    }
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { action: a } = ctx;

    // 상대방이 직전에 사용한 기술 (미지정 시 기본: flamethrower)
    const rawCopiedKey = (a.copiedMoveKey || (a as any).subMoveKey || "flamethrower").toLowerCase().replace(/[\s_]+/g, "-");
    const safeCopiedKey = (rawCopiedKey === "mirror-move" || rawCopiedKey === "mirrormove" || rawCopiedKey === "119")
      ? "flamethrower"
      : rawCopiedKey;

    const copiedAnim = getSubAnim(safeCopiedKey);
    const copiedAction = {
      ...a,
      moveKey: safeCopiedKey,
      moveName: copiedAnim?.nameKo || safeCopiedKey,
    };
    const copiedCtx: MoveContext = {
      ...ctx,
      action: copiedAction,
    };

    const copiedRawFrames = copiedAnim ? copiedAnim.buildFrames(copiedCtx) : [];
    return copiedRawFrames.map((cf) => ({
      ...cf,
      moveEffect: copiedAction,
      copiedMoveKey: safeCopiedKey,
    }));
  },
};
