// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawPresentBehindEffect,
  drawPresentEffect,
} from "../../../renderers/moves/gen1/move217_220.js";

/**
 * 217: 프레젠트 (Present / 선물) - 노말 타입 물리 공격기
 *
 * 위력: — (40: 40%, 80: 30%, 120: 10%) / 명중: 90 / PP: 15 / 접촉 판정: X
 * 설명: 덫을 설치한 상자를 상대에게 건네어 공격한다. 20% 확률로 상대 최대 HP의 25%를 회복시켜 버릴 때도 있다.
 *
 * [연출 시퀀스]:
 * Step 1: 시전자 도약 투척 & 포물선 별빛 트레일 비행 (Caster to Target 카메라)
 * Step 2: 대상 발밑 착지 탄성 바운스 & 서스펜스 좌우 요동
 * Step 3: [확률 분기 결과]
 *   - 데미지 타격 시: 뚜껑 사출 & '쾅!!' 다이내믹 스타버스트 화염/충격파 폭발 + 사방 16개 오색 축제 콘페티 비산 & 피격
 *   - 체력 회복 시: 뚜껑 개봉 & 부드러운 에메랄드/골드 치유 광선 기둥 + 12개 파스텔 치유 별빛/하트 샤워 & 대상 둥실 부유
 *   - 빗나감 시: 대상을 지나쳐 털썩 넘어진 후 삐질 연기 구름 뿜음
 * Step 4: 잔향 소산 및 원위치 안정화 복귀
 */
export const presentMove: BattleMoveAnimation = {
  num: 217,
  key: "present",
  nameKo: "프레젠트",
  nameEn: "Present",
  type: "normal",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.30,
    focalRatio: 1.0, // 대상 포켓몬 정중앙 100% 록온
    delayUntilStep: 2, // Step 1: 시전자 투척 모션, Step 2부터 적 포커싱 & 서스펜스
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawPresentBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawPresentEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 회복(Heal) 분기 판정:
    // 1. action 객체에 isHeal 플래그가 있거나
    // 2. presentOutcome이 'heal'이거나
    // 3. 수비자의 행동 후 HP가 행동 전 HP보다 증가했거나
    // 4. 로그에 '회복' 또는 'restored'가 포함된 경우
    const enemyHpAfter = a?.enemyHpAfter ?? enemyHp;
    const playerHpAfter = a?.playerHpAfter ?? playerHp;
    const isHeal = Boolean(
      (a as any)?.isHeal ||
      (a as any)?.presentOutcome === "heal" ||
      (isP ? (enemyHpAfter > enemyHp) : (playerHpAfter > playerHp)) ||
      a?.log?.includes("회복") ||
      a?.log?.includes("restored")
    );

    // 시전자 납작(Squash & Stretch) 헬퍼 - 수비자는 완벽하게 { 0, 0 } 고정
    const cSquash = (sx: number, sy: number, oy: number) => ({
      pOffset: isP ? { x: 0, y: oy } : { x: 0, y: 0 },
      eOffset: !isP ? { x: 0, y: -oy } : { x: 0, y: 0 },
      pScale: isP ? { x: sx, y: sy } : { x: 1.0, y: 1.0 },
      eScale: !isP ? { x: sx, y: sy } : { x: 1.0, y: 1.0 },
    });

    // 피격자 데미지 피격 리액션 오프셋 - 시전자는 완벽하게 { 0, 0 } 고정
    const tReact = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 회복 시 대상 부드러운 부유(Float) 오프셋
    const tFloat = (oy: number) => ({
      pOffset: !isP ? { x: 0, y: oy } : { x: 0, y: 0 },
      eOffset: isP ? { x: 0, y: oy } : { x: 0, y: 0 },
    });

    return [
      // ======================================================================
      // Step 1: 시전자 투척 모션 & 포물선 비행 궤적 (Step 1)
      // ======================================================================
      {
        ...baseFrame,
        delay: 75,
        ...cSquash(1.12, 0.90, 2),
        showEffect: false,
        moveStep: 1,
        phaseId: "present-crouch",
        phaseName: "#1. 시전자 선물 상자 조준 웅크림",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cSquash(0.92, 1.10, -3),
        showEffect: true,
        moveStep: 1,
        presentArcProgress: 0.15,
        phaseId: "present-toss-release",
        phaseName: "#1. 선물 상자 공중 투척 시작",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cSquash(1.0, 1.0, 0),
        showEffect: true,
        moveStep: 1,
        presentArcProgress: 0.42,
        phaseId: "present-flight-peak",
        phaseName: "#1. 선물 상자 포물선 최고점 비행",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cSquash(1.0, 1.0, 0),
        showEffect: true,
        moveStep: 1,
        presentArcProgress: 0.72,
        phaseId: "present-flight-descend",
        phaseName: "#1. 선물 상자 상대 진영 급강하 비행",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cSquash(1.0, 1.0, 0),
        showEffect: true,
        moveStep: 1,
        presentArcProgress: 0.96,
        phaseId: "present-flight-approach",
        phaseName: "#1. 선물 상자 대상 전면 도달 직전",
      },

      // ======================================================================
      // Step 2: 대상 발밑 착지 & 서스펜스 좌우 요동 (Step 2 - 카메라 줌인 1.30)
      // ======================================================================
      {
        ...baseFrame,
        delay: 75,
        ...cSquash(1.0, 1.0, 0),
        ...tReact(0, 0),
        showEffect: true,
        moveStep: 2,
        presentBoxScaleX: 1.25,
        presentBoxScaleY: 0.75,
        showDust: true,
        phaseId: "present-landing-squash",
        phaseName: "#2. 선물 상자 착지 및 탄성 바운스",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cSquash(1.0, 1.0, 0),
        showEffect: true,
        moveStep: 2,
        presentBoxScaleX: 0.94,
        presentBoxScaleY: 1.06,
        presentBoxRot: -0.16,
        showSuspenseSparkle: true,
        phaseId: "present-suspense-shake-1",
        phaseName: "#2. 상자 두근두근 좌측 갸우뚱 요동",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cSquash(1.0, 1.0, 0),
        showEffect: true,
        moveStep: 2,
        presentBoxScaleX: 1.04,
        presentBoxScaleY: 0.96,
        presentBoxRot: 0.18,
        presentLidLift: 4,
        showSuspenseSparkle: true,
        phaseId: "present-suspense-shake-2",
        phaseName: "#2. 뚜껑 들썩이며 개봉 카운트다운",
      },

      // ======================================================================
      // Step 3: 확률 분기 결과 공개 (Step 3: 데미지 타격 vs 체력 회복 vs 빗나감)
      // ======================================================================
      ...(isHit && !isHeal
        ? [
            // ----------------------------------------------------------------
            // [분기 A]: 데미지 타격 (폭죽 & 콘페티 스타버스트 대폭발)
            // ----------------------------------------------------------------
            {
              ...baseFrame,
              delay: 65,
              hitFlash: true,
              ...tReact(10, -4),
              showEffect: true,
              moveStep: 3,
              isHeal: false,
              hitProgress: 0.18,
              phaseId: "present-impact-detonate",
              phaseName: "#3. 상자 뚜껑 사출 & 순간 순백 섬광 격발",
            },
            {
              ...baseFrame,
              delay: 70,
              ...tReact(-8, 3),
              showEffect: true,
              moveStep: 3,
              isHeal: false,
              hitProgress: 0.45,
              phaseId: "present-impact-starburst",
              phaseName: "#3. 다이내믹 스타버스트 화염구 & 오색 콘페티 비산",
            },
            {
              ...baseFrame,
              delay: 70,
              ...tReact(4, -2),
              showEffect: true,
              moveStep: 3,
              isHeal: false,
              hitProgress: 0.75,
              phaseId: "present-impact-shockwave",
              phaseName: "#3. 충격파 링 확산 및 색종이 조각 나선 흩날림",
            },
            {
              ...baseFrame,
              delay: 80,
              ...tReact(0, 0),
              showEffect: true,
              moveStep: 3,
              isHeal: false,
              hitProgress: 0.96,
              phaseId: "present-impact-dissipate",
              phaseName: "#3. 폭발 연무 소산 및 타격 정돈",
            },
          ]
        : isHit && isHeal
        ? [
            // ----------------------------------------------------------------
            // [분기 B]: 체력 회복 (에메랄드/골드 치유 링 & 파스텔 별빛 샤워)
            // ----------------------------------------------------------------
            {
              ...baseFrame,
              delay: 80,
              ...tFloat(-1),
              showEffect: true,
              showBehindEffect: true,
              moveStep: 3,
              isHeal: true,
              healProgress: 0.18,
              phaseId: "present-heal-open",
              phaseName: "#3. 상자가 열리며 은은한 치유 광선 방출",
            },
            {
              ...baseFrame,
              delay: 90,
              ...tFloat(-3),
              showEffect: true,
              showBehindEffect: true,
              moveStep: 3,
              isHeal: true,
              healProgress: 0.48,
              phaseId: "present-heal-aura",
              phaseName: "#3. 바닥 치유 링 확산 & 파스텔 별빛/하트 샤워 상승",
            },
            {
              ...baseFrame,
              delay: 90,
              ...tFloat(-5),
              showEffect: true,
              showBehindEffect: true,
              moveStep: 3,
              isHeal: true,
              healProgress: 0.78,
              phaseId: "present-heal-radiance",
              phaseName: "#3. 온몸을 감싸는 포근한 황금빛 치유 광채 만개",
            },
            {
              ...baseFrame,
              delay: 85,
              ...tFloat(-1),
              showEffect: true,
              showBehindEffect: true,
              moveStep: 3,
              isHeal: true,
              healProgress: 0.98,
              phaseId: "present-heal-absorb",
              phaseName: "#3. 치유 기운 체내 흡수 및 상자 평화로운 소멸",
            },
          ]
        : [
            // ----------------------------------------------------------------
            // [분기 C]: 빗나감 (Miss / 털썩 넘어짐 & 삐질 연기)
            // ----------------------------------------------------------------
            {
              ...baseFrame,
              delay: 80,
              ...tReact(0, 0),
              showEffect: true,
              moveStep: 3,
              missProgress: 0.20,
              phaseId: "present-miss-drop",
              phaseName: "#3. 상자가 대상을 지나쳐 털썩 떨어짐",
            },
            {
              ...baseFrame,
              delay: 90,
              ...tReact(0, 0),
              showEffect: true,
              moveStep: 3,
              missProgress: 0.60,
              phaseId: "present-miss-poof",
              phaseName: "#3. 상자가 옆으로 기울며 삐질 연기 발생",
            },
            {
              ...baseFrame,
              delay: 90,
              ...tReact(0, 0),
              showEffect: true,
              moveStep: 3,
              missProgress: 0.95,
              phaseId: "present-miss-dissolve",
              phaseName: "#3. 연기가 허공으로 흩어지며 실패",
            },
          ]),

      // ======================================================================
      // Step 4: 복귀 및 원위치 안정화 (Step 4)
      // ======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cSquash(1.0, 1.0, 0),
        ...tReact(0, 0),
        showEffect: false,
        showBehindEffect: false,
        moveStep: 4,
        phaseId: "present-settle",
        phaseName: "#4. 원위치 복귀 및 배틀 준비 완료",
      },
    ];
  },
};
