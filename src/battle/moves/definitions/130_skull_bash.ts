// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import {
  drawSkullBashBehindEffect,
  drawSkullBashEffect,
  drawSkullBashChargeBehindEffect,
  drawSkullBashChargeEffect,
} from "../../../renderers/moves/gen1/move129_132.js";

/**
 * 130-Charge: 로켓박치기 1턴 충전 (Skull Bash - Charge, Turn 1)
 *
 * 연출 시퀀스 (유저 첨부 5세대 원작 이미지 media_1790138952888.png 100% 고증):
 * 1. [시전자 포커싱 & 고개 숙이기]: 카메라 시전자 1.30x 포커싱, 몸 낮춤
 * 2. [머리 둘레 암회색 압축 링 & 하단 황금빛 모래먼지 오라]: 원작 이미지 그대로 머리에 압축 링 + 바닥 모래먼지 층 팽창
 * 3. [방어력 상승 스파클 & 충전 완료]: 방어력 +1 랭크 상승 파티클 분출 및 충전 완료 안착
 * 4. [다음 턴 돌진 대기]: 카메라 복귀 및 1턴 종료
 */
export const skullBashChargeMove: BattleMoveAnimation = {
  num: 130,
  key: "skull-bash-charge",
  nameKo: "로켓박치기 (충전)",
  nameEn: "Skull Bash (Charge)",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.3 },
  drawBehindEffect: drawSkullBashChargeBehindEffect,
  drawEffect: drawSkullBashChargeEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    const cTransform = (scaleX: number, scaleY: number, rot: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    return [
      // 1. 시전자 포커싱 & 머리 숙이기 준비 (120ms)
      {
        ...baseFrame,
        delay: 120,
        ...cOff(0, 4),
        ...cTransform(1.08, 0.92, 0),
        cameraZoom: 1.25,
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 0.2,
        moveStep: 1,
        phaseId: "skullbash-tuck-1",
        phaseName: "1. 시전자 포커싱 & 머리 숙이기 준비",
      },
      // 2. 머리를 등껍질/몸 안으로 쏙 넣음 & 모래먼지 오라 팽창 (160ms)
      {
        ...baseFrame,
        delay: 160,
        ...cOff(0, 10),
        ...cTransform(1.18, 0.8, 0),
        cameraZoom: 1.3,
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 0.6,
        moveStep: 1,
        phaseId: "skullbash-tuck-2",
        phaseName: "2. 머리 수납 & 모래먼지 팽창",
      },
      // 3. 단단해진 등껍질 방어 오라 & 방어력 상승 스파클 축적 (180ms)
      {
        ...baseFrame,
        delay: 180,
        ...cOff(0, 8),
        ...cTransform(1.15, 0.85, 0),
        cameraZoom: 1.3,
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 0.95,
        moveStep: 1,
        phaseId: "skullbash-tuck-3",
        phaseName: "3. 방어력 상승 스파클 & 충전 완료",
      },
      // 4. 복귀 및 다음 턴 돌진 대기 (100ms)
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...cTransform(1.0, 1.0, 0),
        cameraZoom: 1.0,
        afterCameraReturn: true,
        showEffect: false,
        showBehindEffect: false,
        moveStep: 1,
        phaseId: "skullbash-tuck-finish",
        phaseName: "4. 충전 완료 (다음 턴 돌진 대기)",
      },
    ];
  },
};

/**
 * 130: 로켓박치기 (Skull Bash) - 노말 타입 물리 공격기 (2턴 발사)
 *
 * 연출 시퀀스 (유저 요구사항 100% 반영 & 아군/상대 시점 완벽 대칭):
 * 1. [시전포켓몬 포커싱]: rush 카메라로 시전자 클로즈업
 * 2. [도움닫기 웅크림]: 시전포켓몬이 뒤로 살짝 당겨지며 도약 탄성 축적
 * 3. [바람 부스터 돔]: 시전포켓몬 머리/전방에 유선형 에어로 부스터 돔과 압축 공기 링 생성
 * 4. [초고속 돌진 & 암전]: 상대방을 향해 26도 대각선으로 번개처럼 쇄도, 배경 검정 암전
 * 5. [격돌 충돌 & 거대 폭발/연기]:
 *    - 첨부 이미지 완벽 고증:
 *      * 좌측 충돌 정면: 초고열 순백-황금 플라즈마 코어 섬광 + 방사형 초승달 충격파 칼날 (Crescent Blades) + 주황빛 스파크 파편
 *      * 우측 충돌 후방: 8개 볼륨 뭉게구름 연기 층 (다층 음영/하이라이트) + 내부 화염 주황빛 글로우 + 지면 먼지
 *      * 상대 시전 시에는 좌우/방향 완벽 대칭 반전
 * 6. [반동 착지 & 전장 복귀]
 */
export const skullBashMove: BattleMoveAnimation = {
  num: 130,
  key: "skull-bash",
  nameKo: "로켓박치기",
  nameEn: "Skull Bash",
  type: "normal",
  category: "physical",
  camera: { type: "rush", zoom: 1.35 },
  drawBehindEffect: drawSkullBashBehindEffect,
  drawEffect: drawSkullBashEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 시전자 오프셋 (아군: x, y / 적: -x, -y)
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    // 피격자 오프셋 (타격 방향으로 넉백: 아군 공격 시 적 +x, +y / 적 공격 시 아군 -x, -y)
    const cTargetOff = (x: number, y: number) =>
      isP
        ? (isHit ? { eOffset: { x, y } } : { eOffset: { x: 0, y: 0 } })
        : (isHit ? { pOffset: { x: -x, y: -y } } : { pOffset: { x: 0, y: 0 } });

    // 시전자 변형 (스케일 & 틸트 각도)
    const cTransform = (scaleX: number, scaleY: number, rot: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    const isCharging = Boolean(
      (a as any)?.isTurn1Launch ||
      ((a?.damage ?? 0) === 0 && (a as any)?.chargingMove === "skull-bash") ||
      a?.log?.includes("고개를 숙이고") ||
      a?.log?.includes("tucked in its head")
    );

    if (isCharging) {
      return skullBashChargeMove.buildFrames(ctx);
    }

    return [
      // ======================================================================
      // Phase 1: 시전자 포커싱 & 도움닫기 후방 웅크림 (moveStep: 1)
      // ======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-10, 4),
        ...cTargetOff(0, 0),
        ...cTransform(1.08, 0.92, -0.05),
        showEffect: false,
        moveStep: 1,
        phaseId: "skullbash-windup-1",
        phaseName: "1. 시전자 포커싱 & 도움닫기 낮추기",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-20, 8),
        ...cTargetOff(0, 0),
        ...cTransform(1.15, 0.85, -0.09),
        showEffect: false,
        moveStep: 1,
        phaseId: "skullbash-windup-2",
        phaseName: "1. 도움닫기 웅크림 & 힘 응축",
      },

      // ======================================================================
      // Phase 2: 바람 부스터 돔 생성 (moveStep: 1)
      // ======================================================================
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-22, 9),
        ...cTargetOff(0, 0),
        ...cTransform(1.16, 0.84, -0.08),
        showEffect: true,
        showBehindEffect: false,
        effectProgress: 0.25,
        moveStep: 1,
        phaseId: "skullbash-booster-1",
        phaseName: "2. 바람 부스터 돔 형성 시작",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-24, 10),
        ...cTargetOff(0, 0),
        ...cTransform(1.18, 0.82, -0.07),
        showEffect: true,
        showBehindEffect: false,
        effectProgress: 0.65,
        moveStep: 1,
        phaseId: "skullbash-booster-2",
        phaseName: "2. 돔 부스터 공기 압축 & 제트 기류",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-25, 10),
        ...cTargetOff(0, 0),
        ...cTransform(1.20, 0.80, -0.06),
        showEffect: true,
        showBehindEffect: false,
        effectProgress: 0.95,
        moveStep: 1,
        phaseId: "skullbash-booster-3",
        phaseName: "2. 돔 부스터 풀 차지 완료",
      },

      // ======================================================================
      // Phase 3: 초고속 돌진 쇄도 & 배경 암전 진입 (moveStep: 2)
      // ======================================================================
      {
        ...baseFrame,
        delay: 60,
        ...cOff(60, -25),
        ...cTargetOff(0, 0),
        ...cTransform(0.88, 1.15, 0.38),
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 0.35,
        moveStep: 2,
        phaseId: "skullbash-dash-1",
        phaseName: "3. 로켓 급발진 가속 & 암전 진입",
      },
      {
        ...baseFrame,
        delay: 60,
        ...cOff(170, -75),
        ...cTargetOff(0, 0),
        ...cTransform(0.84, 1.20, 0.42),
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 0.85,
        moveStep: 2,
        phaseId: "skullbash-dash-2",
        phaseName: "3. 초고속 돌진 쇄도",
      },

      // ======================================================================
      // Phase 4: 정면 격돌 & 거대 폭발과 연기 (moveStep: 3)
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(185, -80),
        ...cTargetOff(14, -6),
        ...cTransform(1.22, 0.82, 0.15),
        showEffect: isHit,
        showBehindEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.15,
        phaseId: "skullbash-impact-1",
        phaseName: "4. 정면 머리 격돌 직격 & 코어 섬광",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(180, -78),
        ...cTargetOff(26, -10),
        ...cTransform(1.15, 0.86, 0.10),
        showEffect: isHit,
        showBehindEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.45,
        phaseId: "skullbash-impact-2",
        phaseName: "4. 플라즈마 코어 폭발 & 초승달 칼날 분출",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(172, -74),
        ...cTargetOff(30, -12),
        ...cTransform(1.10, 0.90, 0.06),
        showEffect: isHit,
        showBehindEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.75,
        phaseId: "skullbash-impact-3",
        phaseName: "4. 거대 볼륨 뭉게구름 연기 팽창",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(165, -70),
        ...cTargetOff(20, -8),
        ...cTransform(1.05, 0.95, 0.02),
        showEffect: isHit,
        showBehindEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 1.0,
        phaseId: "skullbash-impact-4",
        phaseName: "4. 연기 구름 확산 & 내부 화염 잔향",
      },

      // ======================================================================
      // Phase 5: 반동 착지 및 암전/연기 페이드아웃 복귀 (moveStep: 4)
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(80, -30),
        ...cTargetOff(8, -3),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "skullbash-finish",
        phaseName: "5. 반동 착지 & 암전 페이드아웃",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(20, -8),
        ...cTargetOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.70,
        phaseId: "skullbash-finish",
        phaseName: "5. 원위치 복귀 중",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 1.0,
        phaseId: "skullbash-finish",
        phaseName: "5. 원위치 안착",
      },
    ];
  },
};
