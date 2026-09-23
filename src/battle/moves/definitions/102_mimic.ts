// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { getMoveAnimation } from "../moveRegistry.js";

/**
 * 102: 흉내쟁이 / 흉내내기 (Mimic / Copycat)
 *
 * 사용자 요구사항:
 * - "흉내쟁이 기본 기술모션은 없어도 될듯"
 * - "(기술로직은 변화기인 상대방 기술 그대로 하는 본가 그거 해줘)"
 *
 * 연출 구성:
 * - 별도의 기본 준비 모션 없이, 상대방이 사용한 기술(예: 몸통박치기, 불꽃세례, 싫은소리 등)의
 *   고유 애니메이션 및 타격 이펙트를 즉시 그대로 시전.
 * - 복사된 기술의 타격, 피격 넉백, HP 바 감소, 랭크 변화 등이 그대로 발동.
 */
export const mimicMove: BattleMoveAnimation = {
  num: 102,
  key: "mimic",
  nameKo: "흉내쟁이",
  nameEn: "Mimic",
  type: "normal",
  category: "status",
  camera: { type: "target" },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    const rawCopiedKey = (frame.copiedMoveKey || frame.moveEffect?.copiedMoveKey || "tackle").toLowerCase().replace(/[\s_]+/g, "-");
    const safeCopiedKey = (rawCopiedKey === "mimic" || rawCopiedKey === "copycat" || rawCopiedKey === "102" || rawCopiedKey === "383")
      ? "tackle"
      : rawCopiedKey;
    const copiedAnim = getMoveAnimation(safeCopiedKey);
    if (copiedAnim?.drawBehindEffect) {
      copiedAnim.drawBehindEffect(targetCtx, frame, drawCtx);
    }
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    const rawCopiedKey = (frame.copiedMoveKey || frame.moveEffect?.copiedMoveKey || "tackle").toLowerCase().replace(/[\s_]+/g, "-");
    const safeCopiedKey = (rawCopiedKey === "mimic" || rawCopiedKey === "copycat" || rawCopiedKey === "102" || rawCopiedKey === "383")
      ? "tackle"
      : rawCopiedKey;
    const copiedAnim = getMoveAnimation(safeCopiedKey);
    if (copiedAnim?.drawEffect) {
      copiedAnim.drawEffect(targetCtx, frame, drawCtx);
    }
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { action: a } = ctx;

    // 상대방이 직전에 사용한 기술 (미지정 시 기본: tackle)
    const rawCopiedKey = (a.copiedMoveKey || "tackle").toLowerCase().replace(/[\s_]+/g, "-");
    const safeCopiedKey = (rawCopiedKey === "mimic" || rawCopiedKey === "copycat" || rawCopiedKey === "102" || rawCopiedKey === "383")
      ? "tackle"
      : rawCopiedKey;

    const copiedAnim = getMoveAnimation(safeCopiedKey);
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
