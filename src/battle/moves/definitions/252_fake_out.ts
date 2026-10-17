// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawFakeOutBehindEffect,
  drawFakeOutEffect,
} from "../../../renderers/moves/gen1/move249_252.js";

/**
 * ✋ 252: 속이기 (Fake Out / ねこだまし) - 노말 타입 물리 선제 공격 기술
 *
 * 위력: 40 / 명중: 100 / PP: 10 / 우선도: +3 / 100% 상대 풀죽음 / 접촉: O
 * 설명: 선제공격으로 상대를 풀죽게 한다. 배틀에 나가서 바로 쓰지 않으면 성공할 수 없다.
 *
 * [유저 요구사항 100% 완벽 반영]:
 * 1. [양쪽에 태권당수 손이 90도로 서있는 애들]:
 *    - 태권당수 공식 손바닥 스프라이트(getKarateBlackImg) 사용
 *    - 90도 회전(rotate(Math.PI / 2))으로 손가락이 위를 향해 세로로 우뚝 섬
 *    - 좌측 손: 좌측 외곽에서 엄지가 바깥(왼쪽), 손날이 안쪽(오른쪽)을 향함
 *    - 우측 손: 우측 외곽에서 엄지가 바깥(오른쪽), 손날이 안쪽(왼쪽)을 향함
 * 2. [위 아래로 움직이다가 부드럽게 (2번 (왼쪽이 위면 오른쪽은 아래))]:
 *    - 사인 곡선(Math.sin)을 이용한 부드러운 유선형 교차 상하 운동 (총 2사이클)
 *    - "왼쪽이 위면 오른쪽은 아래":
 *      leftY = cy - wave * amp (wave > 0일 때 위로 이동)
 *      rightY = cy + wave * amp (wave > 0일 때 아래로 이동)
 *    - 3D 틸트 각도 및 부드러운 반투명 잔상 궤적으로 실키한 유체 애니메이션 연출
 * 3. [마지막에 손이 맞닿으면서]:
 *    - 2회 교차 운동 직후, 양손이 중심 타격점을 향해 급가속 쇄도(rush inward)하여
 *      상대 포켓몬의 눈앞 정중앙(cx ± 8px)에서 손바닥이 찰싹 맞닿음(clap)!
 * 4. [파란색 몸통박치기 이펙트 (중간이 투명그라데이션인(투명100%))]:
 *    - 손이 맞닿는 순간 발생하는 파란색 몸통박치기 타격 충돌 폭발:
 *    - ① [중간이 100% 투명한 방사형 섬광 코어 (drawFakeOutBlueFlashCore)]:
 *         중심부(0.0 ~ 0.24 반경)는 100% 완전 투명(rgba(59, 130, 246, 0.0))!
 *         외곽으로 갈수록 진하고 영롱한 로열/일렉트릭 블루가 전개된 후 페이드아웃
 *    - ② [중간이 100% 투명한 8각 만화풍 스타버스트 (drawFakeOutBlueSharpImpact)]:
 *         몸통박치기 고유의 8각 스타버스트 내부 역시 중심부가 100% 투명한 파란색 그라데이션으로 채워짐
 *         외곽은 선명한 하늘빛-순백 림(rgba(191, 219, 254, 0.95))
 *    - ③ [파란색 고속 팽창 타원 충격파 링 (drawFakeOutBlueShockwaveRings)]:
 *         몸통박치기 고유의 팽창 충격파 링이 시원한 로열 블루/하늘색 2중 링으로 퍼져나감
 *    - ④ [사방 비산 4방향 레트로 파란 별빛 스파크 (drawFakeOutBlueRetroStars)]:
 *         몸통박치기 고유의 4방향 레트로 히트 스타들이 사방으로 회전 비산 (#3B82F6, #60A5FA, #93C5FD)
 *    - ⑤ [충돌 관통 모멘텀 파란 스피드 속도선 (drawFakeOutBlueMomentumStreaks)]:
 *         타격점을 수평으로 가로지르는 3줄의 파란색 속도선
 */
export const fakeOutMove: BattleMoveAnimation = {
  num: 252,
  key: "fake-out",
  nameKo: "속이기",
  nameEn: "Fake Out",
  type: "normal",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawFakeOutBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFakeOutEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.25,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 오프셋 헬퍼
    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    // 피격자 반응 헬퍼 (스쿼시/스트레치 및 흔들림)
    const targetReaction = (offX = 0, offY = 0, scaleX = 1.0, scaleY = 1.0) => ({
      pOffset: !isP ? { x: -offX, y: offY } : { x: 0, y: 0 },
      eOffset: isP ? { x: offX, y: offY } : { x: 0, y: 0 },
      pScale: !isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      eScale: isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
    });

    const frames: BattleFrame[] = [];

    // [미스 연출: !isHit]
    if (!isHit) {
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(8, 0),
        moveStep: 1,
        phaseId: "fake-out-miss-wave-1",
        phaseName: "#1. 속이기 태세 (빗나감)",
        effectProgress: 0.25,
        showEffect: true,
        showBehindEffect: false,
      });
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(12, 0),
        moveStep: 1,
        phaseId: "fake-out-miss-wave-2",
        phaseName: "#1. 속이기 교차 모션 (빗나감)",
        effectProgress: 0.65,
        showEffect: true,
        showBehindEffect: false,
      });
      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(15, 0),
        ...targetReaction(18, 0), // 대상이 뒤로 쓱 물러나 회피
        moveStep: 2,
        phaseId: "fake-out-miss-clap",
        phaseName: "#2. 헛도는 박수 타격 (회피됨)",
        effectProgress: 1.0,
        showEffect: true,
        showBehindEffect: false,
      });
      frames.push({
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        moveStep: 4,
        phaseId: "fake-out-miss-end",
        phaseName: "#3. 공격 빗나감",
        effectProgress: 1.0,
        showEffect: false,
        showBehindEffect: false,
      });
      return frames;
    }

    // ========================================================================
    // [적중 시퀀스]: 2회 유선형 상하 교차 운동 ➔ 박수 맞닿음 ➔ 파란 몸통박치기 타격
    // ========================================================================

    // ------------------------------------------------------------------------
    // [Step 1: 양쪽에 태권당수 손 3D 앵글 서있음 + 부드러운 2회 교차 상하 운동]
    // 12프레임 (사이클당 6프레임 x 2사이클, 36ms)
    // ------------------------------------------------------------------------
    const waveFrameCount = 12;
    for (let i = 0; i < waveFrameCount; i++) {
      const prog = i / (waveFrameCount - 1);
      const cycleNum = Math.min(2, Math.floor(i / 6) + 1);

      frames.push({
        ...baseFrame,
        delay: 36,
        ...cOff(Math.min(10, i * 0.9), 0),
        moveStep: 1,
        phaseId: `fake-out-wave-${i + 1}`,
        phaseName: `#1. 양손 당수 3D 교차 상하 모션 (${cycleNum}/2회 - ${i + 1}/${waveFrameCount})`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // ------------------------------------------------------------------------
    // [Step 2: 마지막에 손이 맞닿으면서 - 정면 고속 쇄도 및 박수 맞닿음]
    // 3프레임 (30ms)
    // ------------------------------------------------------------------------
    const clapFrameCount = 3;
    for (let i = 0; i < clapFrameCount; i++) {
      const prog = (i + 1) / clapFrameCount;

      frames.push({
        ...baseFrame,
        delay: 30,
        ...cOff(12, 0),
        moveStep: 2,
        phaseId: `fake-out-clap-${i + 1}`,
        phaseName: `#2. 양손 정면 박수 타격 쇄도 및 맞닿음 (${i + 1}/${clapFrameCount})`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // ------------------------------------------------------------------------
    // [Step 3: 손이 맞닿은 직격 순간 & 파란색 몸통박치기 타격 폭발]
    // 8프레임 (첫 프레임 50ms 섬광 플래시 + 후속 38ms)
    // ------------------------------------------------------------------------
    const impactFrameCount = 8;
    for (let i = 0; i < impactFrameCount; i++) {
      const prog = i / (impactFrameCount - 1);
      const isImpactFirst = i === 0;

      // 대상 피격 스쿼시/스트레치 및 좌우 진동
      const shakeX = (i % 2 === 0 ? 1 : -1) * Math.max(0, 7 - i * 0.9);
      const scaleX = isImpactFirst ? 1.15 : (i === 1 ? 0.92 : 1.0);
      const scaleY = isImpactFirst ? 0.85 : (i === 1 ? 1.08 : 1.0);

      frames.push({
        ...baseFrame,
        delay: isImpactFirst ? 50 : 38,
        ...cOff(Math.max(0, 10 - i * 1.4), 0),
        ...targetReaction(shakeX, 0, scaleX, scaleY),
        hitFlash: isImpactFirst,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        phaseId: `fake-out-impact-${i + 1}`,
        phaseName: `#3. 파란색 몸통박치기 타격 폭발 (${i + 1}/${impactFrameCount})`,
        effectProgress: prog,
        hitProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ------------------------------------------------------------------------
    // [Step 4: 충격파 소산 및 풀죽음 여운 복귀]
    // 3프레임 (45ms)
    // ------------------------------------------------------------------------
    const settleFrameCount = 3;
    for (let i = 0; i < settleFrameCount; i++) {
      const prog = i / (settleFrameCount - 1);

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        phaseId: `fake-out-settle-${i + 1}`,
        phaseName: `#4. 충격파 소산 및 풀죽음 여운 (${i + 1}/${settleFrameCount})`,
        effectProgress: prog,
        showEffect: i < 2,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
