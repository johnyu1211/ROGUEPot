// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawIngrainBehindEffect,
  drawIngrainEffect,
} from "../../../renderers/moves/gen1/move273_276.js";

/**
 * 🌱 275: 뿌리박기 (Ingrain / ねをはる) - 풀 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 20 / 대상: 자신 / 접촉: X
 * 설명: 대지에 깊은 뿌리를 내린다. 매 턴마다 HP를 1/16씩 회복하지만, 뿌리를 내렸으므로 교체할 수 없다.
 *
 * [연출 시퀀스]:
 * 1. [Step 1: 대지 접지 & 뿌리 발아]:
 *    - 시전자가 바닥에 깊숙이 착지하며 뿌리를 내리기 시작 (Squash & Ground Dust)
 *    - 발밑에서 퍼지는 대지 충격 링 및 새싹 뿌리 발아
 * 2. [Step 2: 깊은 뿌리 결속 & 대지 착근]:
 *    - 좌우로 뻗어나가는 굵은 나무뿌리 시스템 & 돋아나는 에메랄드 어린 잎사귀
 *    - 대지와 완벽하게 일체화되는 풀빛 오라 파동 펄스
 * 3. [Step 3: 대지의 양분 흡수 & 생명력 충전]:
 *    - 뿌리에서 몸으로 거슬러 올라오는 빛나는 에메랄드 수액 광택 펄스
 *    - 하늘로 솟아오르는 치유의 십자 스파클과 생명력 오라 완비
 */
export const ingrainMove: BattleMoveAnimation = {
  num: 275,
  key: "ingrain",
  nameKo: "뿌리박기",
  nameEn: "Ingrain",
  type: "grass",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.30,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawIngrainBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawIngrainEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    const casterGroundY = isP ? 280 : 152;

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

    // 시전자 변형 및 하단 클리핑 헬퍼 (y > 0 이면 아군/적군 모두 아래(지면 속)로 내려감)
    const cTransform = (x = 0, y = 0, scaleX = 1.0, scaleY = 1.0, clipBottomY?: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
      pScale: isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      pClipBottomY: isP ? clipBottomY : undefined,
      eClipBottomY: !isP ? clipBottomY : undefined,
    });

    // 싱그러운 생명력 그린 틴트 헬퍼
    const cTint = (alpha: number) => {
      if (alpha <= 0.01) return { pTintColor: null, eTintColor: null };
      const colorStr = `rgba(74, 222, 128, ${alpha.toFixed(2)})`;
      return {
        pTintColor: isP ? colorStr : null,
        eTintColor: !isP ? colorStr : null,
      };
    };

    const frames: BattleFrame[] = [];

    // ========================================================================
    // [Step 1: 포켓몬이 아래로 내려가며 아랫부분이 잘려 땅에 박힘] (9프레임, 55ms)
    // ========================================================================
    const step1Count = 9;
    const maxSinkY = 22;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      // 부드럽게 아래로 침강하며 하단이 그라운드 라인에서 천천히 잘려나감
      const easeProg = Math.sin(prog * (Math.PI / 2));
      const dy = Math.round(easeProg * maxSinkY);
      const clipY = casterGroundY - Math.round(easeProg * 4);

      frames.push({
        ...baseFrame,
        delay: 55,
        ...cTransform(0, dy, 1.0, 1.0, clipY),
        moveStep: 1,
        effectProgress: prog,
        phaseId: `ingrain-sprout-${i + 1}`,
        phaseName: `#1. 대지 침강 & 하단 클리핑 (${i + 1}/${step1Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 2: 땅에 박힌 상태에서 끝이 뾰족한 갈색 뿌리 발아] (11프레임, 48ms)
    // ========================================================================
    const step2Count = 11;
    const embeddedClipY = casterGroundY - 4;
    for (let i = 0; i < step2Count; i++) {
      const prog = i / (step2Count - 1);

      frames.push({
        ...baseFrame,
        delay: 48,
        ...cTransform(0, maxSinkY, 1.0, 1.0, embeddedClipY),
        moveStep: 2,
        effectProgress: prog,
        phaseId: `ingrain-anchor-${i + 1}`,
        phaseName: `#2. 뾰족한 갈색 뿌리 발아 (${i + 1}/${step2Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 3: 대지의 양분 흡수(회복) 및 원위치 복귀] (10프레임, 48ms)
    // ========================================================================
    const step3Count = 10;
    const finalEnemyHp = a?.enemyHpAfter !== undefined ? a.enemyHpAfter : enemyHp;
    const finalPlayerHp = a?.playerHpAfter !== undefined ? a.playerHpAfter : playerHp;
    const enemyHeal = Math.max(0, finalEnemyHp - enemyHp);
    const playerHeal = Math.max(0, finalPlayerHp - playerHp);

    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);
      // 전반부는 박힌 상태 유지하며 회복, 후반부에 자연스럽게 올라오며 복귀
      const riseT = prog < 0.55 ? 0 : (prog - 0.55) / 0.45;
      const easeRise = Math.sin(riseT * (Math.PI / 2));
      const dy = Math.round(maxSinkY * (1.0 - easeRise));
      const clipY = prog < 0.95 ? casterGroundY - Math.round(4 * (1.0 - easeRise)) : undefined;

      // 양분 흡수(회복) 시 체력 게이지가 Step 3 동안 부드럽게 차오름
      const healEase = Math.sin(prog * (Math.PI / 2));
      const curEnemyHp = enemyHeal > 0 ? Math.min(finalEnemyHp, Math.round(enemyHp + enemyHeal * healEase)) : enemyHp;
      const curPlayerHp = playerHeal > 0 ? Math.min(finalPlayerHp, Math.round(playerHp + playerHeal * healEase)) : playerHp;

      frames.push({
        ...baseFrame,
        enemyHp: curEnemyHp,
        playerHp: curPlayerHp,
        delay: 48,
        ...cTransform(0, dy, 1.0, 1.0, clipY),
        ...cTint(Math.sin(prog * Math.PI) * 0.28),
        moveStep: 3,
        effectProgress: prog,
        phaseId: `ingrain-vitality-${i + 1}`,
        phaseName: `#3. 대지의 양분 흡수 (${i + 1}/${step3Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    return frames;
  },
};
