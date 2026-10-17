// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawFollowMeBehindEffect,
  drawFollowMeEffect,
} from "../../../renderers/moves/gen1/move265_268.js";

/**
 * ☝️ 266: 날따름 (Follow Me / このゆびとまれ) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 20 / 우선도: +2 / 대상: 자신 / 접촉: X
 * 설명: 자신에게 주목시켜 상대로부터의 공격을 모두 자신에게 향하게 한다.
 *
 * [유저 요구사항 100% 완벽 반영]:
 * "시전포켓몬이 동그랗게 원을 돌아. (3D로 도는거임.) 원을 그리고는 원위치에서 길어지면서 점프 후 앞뒤로 부드럽게 까딱 움직임."
 *
 * 1. [동그랗게 원을 돌아 (3D)]:
 *    - 3D 지면 타원 궤적(Rx: 38px, Ry: 14px)을 따라 매끄럽게 360도 공전 회전
 *    - 앞쪽일 때 커지고(1.04), 뒤쪽일 때 작아지는(0.84) 입체 원근감
 *    - 코너를 돌 때 안쪽으로 기울어지는 3D 원심 뱅킹 회전각(인워드 틸트)
 * 2. [원위치에서 길어지면서 점프]:
 *    - 원위치 복귀 후 수직 도약(-36px) 및 세로 신장(scaleY: 1.35, scaleX: 0.80)
 *    - 도약 가속선 및 착지 탄성 스쿼시 연계
 * 3. [앞뒤로 부드럽게 까딱 움직임]:
 *    - 2회 연속 부드러운 전후 끄덕임(까딱까딱 틸트 ±0.18rad & 전후 오프셋)
 *    - 시전자 주변 4방향 주목 스타버스트(골드·핑크·화이트) 및 파동 링 연출
 */
export const followMeMove: BattleMoveAnimation = {
  num: 266,
  key: "follow-me",
  nameKo: "날따름",
  nameEn: "Follow Me",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawFollowMeBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFollowMeEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

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

    // 시전자 변형 헬퍼 (플레이어와 적 양방향 완벽 대칭 대응)
    const dir = isP ? 1 : -1;
    const casterTransform = (x = 0, y = 0, scaleX = 1.0, scaleY = 1.0, rot = 0) => ({
      pOffset: isP ? { x: x * dir, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: x * dir, y } : { x: 0, y: 0 },
      pScale: isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP && rot !== 0 ? rot * dir : undefined,
      eRot: !isP && rot !== 0 ? rot * dir : undefined,
      pRotCenter: true,
      eRotCenter: true,
    });

    const frames: BattleFrame[] = [];

    // ========================================================================
    // [Step 1: 동그랗게 원을 돌아 (3D)]
    // - 16프레임 (36ms): 지면(발판)은 완전히 고정되어 절대 움직이지 않음!
    // - 포켓몬이 발판 위에서 360도 원 주행, Y 오프셋은 위(-Y)로 절대 뜨지 않음 (0 ~ +5px)
    // ========================================================================
    const circleFrameCount = 16;
    for (let i = 0; i < circleFrameCount; i++) {
      const prog = i / (circleFrameCount - 1);
      const theta = prog * Math.PI * 2;

      // X: 0 -> +20 -> 0 -> -20 -> 0 (발판 위 좌우 이동)
      const offX = Math.sin(theta) * 20;
      // Y: 지면에서 카메라 앞쪽(+Y)으로만 살짝 돌며 절대 공중에 뜨지 않음 (0 -> +5 -> 0)
      const offY = (1 - Math.cos(theta)) * 2.5;

      // 3D 원근 스케일: 원 앞쪽일 때 살짝 커짐 (1.00 -> 1.05 -> 1.00)
      const scale = 1.0 + (offY / 5) * 0.05;

      // 3D 뱅킹 각도: 회전 안쪽으로 살짝 기울임
      const bankRot = -Math.sin(theta) * 0.08;

      frames.push({
        ...baseFrame,
        delay: 36,
        ...casterTransform(offX, offY, scale, scale, bankRot),
        moveStep: 1,
        phaseId: `follow-me-circle-${i + 1}`,
        phaseName: `#1. 지면 3D 원형 회전 (${i + 1}/${circleFrameCount})`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // ========================================================================
    // [Step 2: 원을 그리고는 원위치에서 길어지면서 점프]
    // - 7프레임 (38ms): 도약 준비 ➔ 수직 신장 도약 ➔ 체공 정점 ➔ 착지 탄성
    // ========================================================================
    const jumpProfiles = [
      // 0: 도약 전 웅크림 (Anticipation Squash)
      { x: 0, y: 4, scaleX: 1.15, scaleY: 0.86, rot: 0, delay: 40, name: "도약 전 웅크림" },
      // 1: 위로 길어지면서 도약 발진 (Vertical Stretch Launch)
      { x: 0, y: -20, scaleX: 0.82, scaleY: 1.28, rot: 0, delay: 36, name: "길어지며 도약 발진" },
      // 2: 공중 최고점 최대 세로 신장 (Apex Stretch)
      { x: 0, y: -36, scaleX: 0.80, scaleY: 1.35, rot: 0, delay: 38, name: "공중 최고점 최대 신장" },
      // 3: 정점 체공 및 완화 (Apex Float)
      { x: 0, y: -34, scaleX: 0.88, scaleY: 1.22, rot: 0, delay: 38, name: "정점 체공 완화" },
      // 4: 하강 (Descent)
      { x: 0, y: -16, scaleX: 0.94, scaleY: 1.10, rot: 0, delay: 36, name: "하강" },
      // 5: 착지 충격 탄성 스쿼시 (Landing Squash)
      { x: 0, y: 3, scaleX: 1.18, scaleY: 0.86, rot: 0, delay: 40, name: "착지 탄성 흡수" },
      // 6: 원위치 직립 복귀 (Restore)
      { x: 0, y: 0, scaleX: 1.00, scaleY: 1.00, rot: 0, delay: 40, name: "원위치 안착" },
    ];

    for (let i = 0; i < jumpProfiles.length; i++) {
      const jp = jumpProfiles[i];
      const prog = i / (jumpProfiles.length - 1);

      frames.push({
        ...baseFrame,
        delay: jp.delay,
        ...casterTransform(jp.x, jp.y, jp.scaleX, jp.scaleY, jp.rot),
        moveStep: 2,
        phaseId: `follow-me-jump-${i + 1}`,
        phaseName: `#2. ${jp.name} (${i + 1}/${jumpProfiles.length})`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // ========================================================================
    // [Step 3: 앞뒤로 부드럽게 까딱 움직임]
    // - 12프레임 (40ms): 2회 연속 부드러운 전후 끄덕임(까딱까딱 틸트 & 주목 별빛)
    // ========================================================================
    const nodFrameCount = 12;
    for (let i = 0; i < nodFrameCount; i++) {
      const prog = i / (nodFrameCount - 1);
      const isFirstCycle = i < 6;
      const cycleProg = isFirstCycle ? i / 5 : (i - 6) / 5;
      const wave = Math.sin(cycleProg * Math.PI * 2);

      // 사이클 1: 메인 까딱 (+0.18rad 전방 / -0.16rad 후방)
      // 사이클 2: 감쇠 까딱 (+0.13rad 전방 / -0.11rad 후방)
      const maxRot = isFirstCycle ? 0.18 : 0.13 * (1.0 - cycleProg * 0.4);
      const maxX = isFirstCycle ? 6 : 4 * (1.0 - cycleProg * 0.4);
      const maxY = isFirstCycle ? 3 : 2 * (1.0 - cycleProg * 0.4);

      const nodRot = wave * maxRot;
      const nodX = wave * maxX;
      const nodY = -Math.abs(wave) * maxY;
      const scaleX = 1.0 + wave * (isFirstCycle ? 0.04 : 0.02);
      const scaleY = 1.0 - wave * (isFirstCycle ? 0.04 : 0.02);

      const cycleNum = isFirstCycle ? 1 : 2;
      const stepIdxInCycle = (i % 6) + 1;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...casterTransform(nodX, nodY, scaleX, scaleY, nodRot),
        moveStep: 3,
        phaseId: `follow-me-nod-${i + 1}`,
        phaseName: `#3. 앞뒤로 부드럽게 까딱 움직임 (${cycleNum}/2회 - ${stepIdxInCycle}/6)`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
        cycleIdx: cycleNum,
      } as any);
    }

    // ========================================================================
    // [Step 4: 안정화 및 잔여 여운 소산]
    // - 3프레임 (45ms): 정위치 안정화 및 잔여 별빛 상공 승화 소산
    // ========================================================================
    const settleFrameCount = 3;
    for (let i = 0; i < settleFrameCount; i++) {
      const prog = i / (settleFrameCount - 1);

      frames.push({
        ...baseFrame,
        delay: 45,
        ...casterTransform(0, 0, 1.0, 1.0, 0),
        moveStep: 4,
        phaseId: `follow-me-settle-${i + 1}`,
        phaseName: `#4. 안정화 및 잔여 별빛 소산 (${i + 1}/${settleFrameCount})`,
        effectProgress: prog,
        showEffect: i < 2,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
