import { BattleFrame, BattleMoveAnimation, MoveContext } from "../types.js";
import {
  drawSkyAttackChargeBehindEffect,
  drawSkyAttackChargeEffect,
  drawSkyAttackBehindEffect,
  drawSkyAttackEffect,
} from "../../../renderers/moves/gen1/move141_144.js";

/**
 * 143-Charge: 불새 1턴 충전 (Sky Attack - Charge, Turn 1)
 *
 * 연출 시퀀스 (본가 2턴 충전기 완벽 고증):
 * 1. [시전자 포커싱 & 빛의 수렴]: 카메라 시전자 1.30x 포커싱, 전방위에서 눈부신 빛의 광선 수렴
 * 2. [발밑 펄스 & 광휘 플레어 팽창]: 발밑 충전 링 + 전신을 감싸는 황금-주황빛 Sunburst 플레어 폭발
 * 3. [눈부신 빛의 오라 완성]: "눈부신 빛에 휩싸였다!" 충전 완료 안착
 * 4. [다음 턴 돌진 대기]: 카메라 복귀 및 1턴 종료
 */
export const skyAttackChargeMove: BattleMoveAnimation = {
  num: 143,
  key: "sky-attack-charge",
  nameKo: "불새 (충전)",
  nameEn: "Sky Attack (Charge)",
  type: "flying",
  category: "status",
  camera: { type: "custom" },
  drawBehindEffect: drawSkyAttackChargeBehindEffect,
  drawEffect: drawSkyAttackChargeEffect,

  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1, y: 1 },
      eScale: { x: 1, y: 1 },
      pRot: 0,
      eRot: 0,
      showEffect: true,
      showBehindEffect: true,
    };

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScl = (sx: number, sy: number) => ({
      pScale: isP ? { x: sx, y: sy } : undefined,
      eScale: !isP ? { x: sx, y: sy } : undefined,
    });

    // 5세대 카메라 줌인/줌아웃 보간 헬퍼 (Dead Center on Caster)
    const neutralX = 280;
    const neutralY = 190;
    const casterFocal = isP
      ? { x: 142, y: 254 }
      : {
          x: Math.round(neutralX + (418 - neutralX) * 0.48),
          y: Math.round(neutralY + (116 - neutralY) * 0.48),
        };

    const getCam = (factor: number) => ({
      cameraZoom: Number((1.0 + 0.30 * factor).toFixed(4)),
      cameraFocal: factor > 0.001 ? {
        x: Math.round(neutralX + (casterFocal.x - neutralX) * factor),
        y: Math.round(neutralY + (casterFocal.y - neutralY) * factor),
      } : null,
      _gen5Camera: factor > 0.001,
    });

    return [
      // 1. 카메라 줌인 시작 & 푸른 불꽃 2줄기 점화 (70ms)
      {
        ...baseFrame,
        ...getCam(0.30),
        delay: 70,
        moveStep: 1,
        ...cOff(0, 2),
        ...cScl(1.02, 0.98),
        dimAlpha: 0.45,
        chargeProgress: 0.15,
        chargeAlpha: 0.60,
        flameIndex: 1,
        orbitAngle: 0.0,
        radiusScale: 0.90,
        phaseId: "sky-attack-charge-ignite-2",
        phaseName: "1. 전장 급속 암전 & 푸른 불꽃 2줄기 점화 (70ms)",
      },

      // 2. 3번째 불꽃 가세 & 3D 궤도 회전 가속 (70ms)
      {
        ...baseFrame,
        ...getCam(0.60),
        delay: 70,
        moveStep: 1,
        ...cOff(0, 1),
        ...cScl(1.01, 0.99),
        dimAlpha: 0.68,
        chargeProgress: 0.35,
        chargeAlpha: 0.85,
        flameIndex: 2,
        orbitAngle: 1.6,
        radiusScale: 1.00,
        phaseId: "sky-attack-charge-ignite-3",
        phaseName: "2. 3번째 불꽃 가세 & 3D 궤도 회전 가속 (70ms)",
      },

      // 3. 4번째 불꽃 가세 & 전신 3D 감싸기 (75ms)
      {
        ...baseFrame,
        ...getCam(0.85),
        delay: 75,
        moveStep: 1,
        ...cOff(0, -1),
        ...cScl(1.03, 1.01),
        dimAlpha: 0.75,
        chargeProgress: 0.55,
        chargeAlpha: 1.0,
        flameIndex: 3,
        orbitAngle: 3.3,
        radiusScale: 1.10,
        phaseId: "sky-attack-charge-ignite-4",
        phaseName: "3. 4번째 불꽃 가세 & 전신 3D 감싸기 (75ms)",
      },

      // 4. 5번째 불꽃 가세 & 상공 확장 (75ms)
      {
        ...baseFrame,
        ...getCam(1.00),
        delay: 75,
        moveStep: 1,
        ...cOff(0, -2),
        ...cScl(1.05, 1.03),
        dimAlpha: 0.75,
        chargeProgress: 0.72,
        chargeAlpha: 1.0,
        flameIndex: 4,
        orbitAngle: 5.0,
        radiusScale: 1.20,
        phaseId: "sky-attack-charge-ignite-5",
        phaseName: "4. 5번째 불꽃 가세 & 상공 확장 (75ms)",
      },

      // 5. 6줄기 푸른 불꽃 볼텍스 완성 (80ms)
      {
        ...baseFrame,
        ...getCam(1.00),
        delay: 80,
        moveStep: 1,
        ...cOff(0, -3),
        ...cScl(1.07, 1.04),
        dimAlpha: 0.75,
        chargeProgress: 0.90,
        chargeAlpha: 1.0,
        flameIndex: 5,
        orbitAngle: 6.7,
        radiusScale: 1.30,
        phaseId: "sky-attack-charge-vortex-6",
        phaseName: "5. 6줄기 푸른 불꽃 볼텍스 완성 (80ms)",
      },

      // 6. 6줄기 화염 볼텍스 최고조 회전 A (80ms)
      {
        ...baseFrame,
        ...getCam(1.00),
        delay: 80,
        moveStep: 1,
        ...cOff(0, -3),
        ...cScl(1.08, 1.05),
        dimAlpha: 0.75,
        chargeProgress: 1.0,
        chargeAlpha: 1.0,
        flameIndex: 6,
        orbitAngle: 8.4,
        radiusScale: 1.35,
        phaseId: "sky-attack-charge-peak-1",
        phaseName: "6. 6줄기 화염 볼텍스 최고조 회전 A (80ms)",
      },

      // 7. 6줄기 화염 볼텍스 최고조 회전 B (80ms)
      {
        ...baseFrame,
        ...getCam(1.00),
        delay: 80,
        moveStep: 1,
        ...cOff(0, -3),
        ...cScl(1.08, 1.05),
        dimAlpha: 0.75,
        chargeProgress: 1.0,
        chargeAlpha: 1.0,
        flameIndex: 7,
        orbitAngle: 10.1,
        radiusScale: 1.35,
        phaseId: "sky-attack-charge-peak-2",
        phaseName: "7. 6줄기 화염 볼텍스 최고조 회전 B (80ms)",
      },

      // 8. 카메라 부드러운 줌아웃 1 (80% 줌, 불꽃 반경 축소 & 흡수 시작, 70ms)
      {
        ...baseFrame,
        ...getCam(0.80),
        delay: 70,
        moveStep: 1,
        ...cOff(0, -2),
        ...cScl(1.06, 1.03),
        dimAlpha: 0.68,
        chargeProgress: 1.0,
        chargeAlpha: 0.90,
        flameIndex: 8,
        orbitAngle: 11.8,
        radiusScale: 1.05,
        phaseId: "sky-attack-charge-zoomout-1",
        phaseName: "8. 카메라 부드러운 줌아웃 1 & 불꽃 반경 축소 (70ms)",
      },

      // 9. 카메라 부드러운 줌아웃 2 (60% 줌, 불꽃 반경 수축 & 서서히 페이드아웃, 70ms)
      {
        ...baseFrame,
        ...getCam(0.60),
        delay: 70,
        moveStep: 1,
        ...cOff(0, -2),
        ...cScl(1.04, 1.02),
        dimAlpha: 0.55,
        chargeProgress: 1.0,
        chargeAlpha: 0.75,
        flameIndex: 9,
        orbitAngle: 13.5,
        radiusScale: 0.75,
        phaseId: "sky-attack-charge-zoomout-2",
        phaseName: "9. 카메라 부드러운 줌아웃 2 & 불꽃 반경 수축 페이드아웃 (70ms)",
      },

      // 10. 카메라 부드러운 줌아웃 3 (40% 줌, 몸체로 나선 흡수 진행, 70ms)
      {
        ...baseFrame,
        ...getCam(0.40),
        delay: 70,
        moveStep: 1,
        ...cOff(0, -1),
        ...cScl(1.02, 1.01),
        dimAlpha: 0.40,
        chargeProgress: 1.0,
        chargeAlpha: 0.55,
        flameIndex: 10,
        orbitAngle: 15.2,
        radiusScale: 0.50,
        phaseId: "sky-attack-charge-zoomout-3",
        phaseName: "10. 카메라 부드러운 줌아웃 3 & 나선 흡수 진행 (70ms)",
      },

      // 11. 카메라 부드러운 줌아웃 4 (20% 줌, 코어로 깊은 흡수 & 페이드, 70ms)
      {
        ...baseFrame,
        ...getCam(0.20),
        delay: 70,
        moveStep: 1,
        ...cOff(0, -1),
        ...cScl(1.01, 1.00),
        dimAlpha: 0.25,
        chargeProgress: 1.0,
        chargeAlpha: 0.35,
        flameIndex: 11,
        orbitAngle: 16.9,
        radiusScale: 0.30,
        absorptionGlow: 0.35,
        phaseId: "sky-attack-charge-zoomout-4",
        phaseName: "11. 카메라 부드러운 줌아웃 4 & 코어 흡수 페이드 (70ms)",
      },

      // 12. 카메라 원위치 복귀 & 코어 최종 흡수 페이드아웃 (75ms)
      {
        ...baseFrame,
        ...getCam(0.00),
        delay: 75,
        moveStep: 1,
        ...cOff(0, 0),
        ...cScl(1.0, 1.0),
        dimAlpha: 0.10,
        chargeProgress: 1.0,
        chargeAlpha: 0.15,
        flameIndex: 12,
        orbitAngle: 18.6,
        radiusScale: 0.15,
        absorptionGlow: 0.70,
        phaseId: "sky-attack-charge-return",
        phaseName: "12. 카메라 원위치 복귀 & 코어 최종 흡수 페이드아웃 (75ms)",
      },

      // 13. 전신 흡수 완결 & 눈부신 순백 광채 안착 (80ms)
      {
        ...baseFrame,
        ...getCam(0.00),
        delay: 80,
        moveStep: 1,
        ...cOff(0, 0),
        ...cScl(1.0, 1.0),
        dimAlpha: 0.00,
        chargeProgress: 0.0,
        chargeAlpha: 0.00,
        flameIndex: 13,
        orbitAngle: 20.3,
        radiusScale: 0.05,
        absorptionGlow: 0.85,
        phaseId: "sky-attack-charge-absorbed",
        phaseName: "13. 전신 흡수 완결 & 눈부신 순백 광채 (80ms)",
      },

      // 14. 1턴 충전 완료 (빛을 머금은 채 돌진 대기 태세, 120ms)
      {
        ...baseFrame,
        ...getCam(0.00),
        delay: 120,
        moveStep: 1,
        ...cOff(0, 0),
        ...cScl(1.0, 1.0),
        dimAlpha: 0.00,
        chargeProgress: 0.0,
        chargeAlpha: 0.00,
        flameIndex: 14,
        orbitAngle: 22.0,
        radiusScale: 0.00,
        absorptionGlow: 0.00,
        phaseId: "sky-attack-charge-wait",
        phaseName: "14. 1턴 충전 완료 (빛을 머금은 채 돌진 대기, 120ms)",
      },
    ];
  },
};

/**
 * 143: 불새 (Sky Attack) - 2턴 발사 공격기
 *
 * 위력: 140 / 명중: 90 / PP: 5
 * 부가효과: 급소율 1랭크 증가, 30% 풀죽음
 *
 * [연출 시퀀스]:
 * 1. [상공 비상]: 시전자가 하늘 높이 힘차게 날아오름
 * 2. [불새 형상 변신]: 거대하고 눈부신 황금-주황 불새(Phoenix) 화염체로 전신 변환
 * 3. [음속 급강하]: 상대방을 향해 궤적을 그리며 번개처럼 급강하 쇄도
 * 4. [직격 대폭발]: 대상 정면 격돌, 화염 충격파 칼날 & 초고열 플라즈마 대폭발
 * 5. [착지 & 복귀]: 지면 착지 후 안정적인 기본 스탠스 복귀
 */
export const skyAttackMove: BattleMoveAnimation = {
  num: 143,
  key: "sky-attack",
  nameKo: "불새",
  nameEn: "Sky Attack",
  type: "flying",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawBehindEffect: drawSkyAttackBehindEffect,
  drawEffect: drawSkyAttackEffect,

  buildFrames: (context: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = context;

    // 1턴 충전 상태 감지 시 chargeMove 프레임 반환
    const isCharging = Boolean(
      (a as any)?.isTurn1Launch ||
      ((a?.damage ?? 0) === 0 && (a as any)?.chargingMove === "sky-attack") ||
      a?.log?.includes("눈부신 빛에 휩싸였다") ||
      a?.log?.includes("harsh light")
    );

    if (isCharging) {
      return skyAttackChargeMove.buildFrames(context);
    }

    const cOff = (x: number, y: number) => (isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } });
    const tOff = (x: number, y: number) => (isP ? { eOffset: { x: -x, y: -y } } : { pOffset: { x, y } });

    const scl = (casterScale?: { x: number; y: number }, targetScale?: { x: number; y: number }) => ({
      pScale: isP ? casterScale : targetScale,
      eScale: !isP ? casterScale : targetScale,
    });

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1, y: 1 },
      eScale: { x: 1, y: 1 },
      pRot: 0,
      eRot: 0,
      hidePShadow: false,
      hideEShadow: false,
      showEffect: true,
      pRedTint: false,
      eRedTint: false,
    };

    // 빗맞았을 때 (Miss 처리)
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 70,
          moveStep: 1,
          ...cOff(-22, 14),
          ...scl({ x: 0.95, y: 1.05 }, { x: 1.0, y: 1.0 }),
          pRot: isP ? 0.08 : -0.08,
          skyFilterAlpha: 0.35,
          birdAlpha: 0.40,
          birdScale: 0.85,
          birdStep: 1,
          phaseId: "sky-attack-miss-prep",
          phaseName: "1. 도약 웅크림 & 빗나감 준비 (70ms)",
        },
        {
          ...baseFrame,
          delay: 70,
          moveStep: 2,
          ...cOff(150, -75),
          ...tOff(0, -26), // 대상 회피 점프!
          ...scl({ x: 1.35, y: 0.52 }, { x: 0.95, y: 1.10 }),
          pRot: isP ? -0.22 : 0.22,
          skyFilterAlpha: 0.45,
          birdAlpha: 1.0,
          birdScale: 1.15,
          birdStep: 2,
          phaseId: "sky-attack-miss-rush",
          phaseName: "2. 급강하 돌진 & 대상 회피 (70ms)",
        },
        {
          ...baseFrame,
          delay: 70,
          moveStep: 3,
          ...cOff(290, -145), // 대상 위를 스쳐 지나감
          ...tOff(0, -15),
          ...scl({ x: 1.40, y: 0.48 }, { x: 1.0, y: 1.0 }),
          pRot: isP ? -0.25 : 0.25,
          skyFilterAlpha: 0.45,
          birdAlpha: 1.0,
          birdScale: 1.15,
          birdStep: 3,
          phaseId: "sky-attack-miss-pass",
          phaseName: "3. 대상 상공 통과 (70ms)",
        },
        {
          ...baseFrame,
          delay: 75,
          moveStep: 4,
          ...cOff(390, -195), // 우측 상단으로 쾌속 비행 1
          ...tOff(0, -6),
          ...scl({ x: 1.38, y: 0.52 }, { x: 1.0, y: 1.0 }),
          pRot: isP ? -0.25 : 0.25,
          skyFilterAlpha: 0.38,
          birdAlpha: 0.90,
          birdScale: 1.10,
          birdStep: 4,
          phaseId: "sky-attack-miss-fly1",
          phaseName: "4. 우측 상단 쾌속 비행 1 (75ms)",
        },
        {
          ...baseFrame,
          delay: 75,
          moveStep: 4,
          ...cOff(490, -245), // 우측 상단으로 쾌속 비행 2
          ...tOff(0, 0),
          ...scl({ x: 1.35, y: 0.55 }, { x: 1.0, y: 1.0 }),
          pRot: isP ? -0.25 : 0.25,
          skyFilterAlpha: 0.30,
          birdAlpha: 0.65,
          birdScale: 1.00,
          birdStep: 5,
          phaseId: "sky-attack-miss-fly2",
          phaseName: "5. 우측 상단 쾌속 비행 2 (75ms)",
        },
        {
          ...baseFrame,
          delay: 80,
          moveStep: 4,
          ...cOff(600, -300), // 화면 밖 고공 이탈
          ...tOff(0, 0),
          skyFilterAlpha: 0.22,
          birdAlpha: 0.0,
          phaseId: "sky-attack-miss-offscreen",
          phaseName: "6. 화면 밖 고공 이탈 (80ms)",
        },
        {
          ...baseFrame,
          delay: 75,
          moveStep: 5,
          ...cOff(-140, 110), // 좌측 하단 화면 밖에서 상승 시작
          ...tOff(0, 0),
          ...scl({ x: 1.20, y: 0.70 }, { x: 1.0, y: 1.0 }),
          pRot: isP ? -0.22 : 0.22,
          skyFilterAlpha: 0.15,
          birdAlpha: 0.0,
          phaseId: "sky-attack-miss-bottomleft1",
          phaseName: "7. 좌측 하단 상승 진입 시작 (75ms)",
        },
        {
          ...baseFrame,
          delay: 75,
          moveStep: 5,
          ...cOff(-85, 65),  // 좌측 하단 대각선 상승 활공
          ...tOff(0, 0),
          ...scl({ x: 1.15, y: 0.78 }, { x: 1.0, y: 1.0 }),
          pRot: isP ? -0.16 : 0.16,
          skyFilterAlpha: 0.08,
          phaseId: "sky-attack-miss-bottomleft2",
          phaseName: "8. 좌측 하단 대각선 활공 (75ms)",
        },
        {
          ...baseFrame,
          delay: 70,
          moveStep: 5,
          ...cOff(-35, 25),  // 플랫폼 진입 감속
          ...tOff(0, 0),
          ...scl({ x: 1.08, y: 0.90 }, { x: 1.0, y: 1.0 }),
          pRot: isP ? -0.08 : 0.08,
          skyFilterAlpha: 0.02,
          phaseId: "sky-attack-miss-platform",
          phaseName: "9. 플랫폼 진입 감속 (70ms)",
        },
        {
          ...baseFrame,
          delay: 80,
          moveStep: 5,
          ...cOff(0, 0),
          ...tOff(0, 0),
          ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
          skyFilterAlpha: 0.0,
          phaseId: "sky-attack-miss-finish",
          phaseName: "10. 착지 복귀 (80ms)",
        },
      ];
    }

    // 명중 시 정규 애니메이션 (날아가는 프레임 강화: 상공 비행 4프레임 + 좌하단 상승 안착 5프레임)
    return [
      // 1. [하늘색 필터 점등 & 도약 웅크림 준비] (70ms)
      {
        ...baseFrame,
        delay: 70,
        moveStep: 1,
        ...cOff(-22, 14),
        ...scl({ x: 0.95, y: 1.05 }, { x: 1.0, y: 1.0 }),
        pRot: isP ? 0.08 : -0.08,
        skyFilterAlpha: 0.35,
        birdAlpha: 0.40,
        birdScale: 0.85,
        birdStep: 1,
        drawEnemyOnTop: !isP,
        phaseId: "sky-attack-prep",
        phaseName: "1. 하늘색 필터 점등 & 도약 웅크림 (70ms)",
      },

      // 2. [초고속 음속 돌진 쇄도: 적을 향해 발진] (70ms)
      {
        ...baseFrame,
        delay: 70,
        moveStep: 2,
        ...cOff(120, -57), // 돌진 전반부 (플레이어와 적 사이 중간 쇄도)
        ...scl({ x: 1.35, y: 0.52 }, { x: 1.0, y: 1.0 }),
        pRot: isP ? -0.22 : 0.22,
        skyFilterAlpha: 0.50,
        birdAlpha: 1.0,
        birdScale: 1.10,
        birdStep: 2,
        phaseId: "sky-attack-rush",
        phaseName: "2. 푸른 화염새 초고속 돌진 쇄도 (70ms)",
      },

      // 3. [적 전면 돌입: 부리가 적 스프라이트 전면을 꿰뚫으며 돌입] (70ms)
      {
        ...baseFrame,
        delay: 70,
        moveStep: 3,
        ...cOff(205, -98), // 적 전면 타격 & 부리가 적 내부로 파고듦
        ...tOff(10, -5),    // 상대 피격 움찔
        ...scl({ x: 1.38, y: 0.50 }, { x: 1.08, y: 0.92 }),
        pRot: isP ? -0.22 : 0.22,
        skyFilterAlpha: 0.50,
        birdAlpha: 1.0,
        birdScale: 1.20,
        birdStep: 3,
        phaseId: "sky-attack-impale",
        phaseName: "3. 적 스프라이트 전면 화염 돌입 (70ms)",
      },

      // 4. [적 스프라이트 정면 관통 돌파! (몸통이 적의 중심을 꿰뚫고 머리는 통과)] (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 3,
        ...cOff(295, -141), // 적 중심부 관통! 불새 머리는 적 뒤로 완전히 빠져나오고 몸통이 관통 중
        ...tOff(20, -10),   // 상대 강한 피격 넉백
        ...scl({ x: 1.40, y: 0.48 }, { x: 1.15, y: 0.80 }),
        pRot: isP ? -0.22 : 0.22,
        hitFlash: true,
        skyFilterAlpha: 0.50,
        birdAlpha: 1.0,
        birdScale: 1.25,
        birdStep: 4,
        phaseId: "sky-attack-pierce",
        phaseName: "4. 적 스프라이트 정면 관통 돌파 (75ms)",
      },

      // 5. [완전 관통 통과 & 전방 상공 출현 ➔ 등 뒤 상대 위치 1차 푸른 폭발 점화!] (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 4,
        ...cOff(380, -181), // 적을 완전히 뚫고 전방 상공으로 선명하게 출현 완료!
        ...tOff(-12, 6),    // 상대 피격 반동
        ...scl({ x: 1.35, y: 0.52 }, { x: 0.94, y: 1.08 }),
        pRot: isP ? -0.25 : 0.25,
        skyFilterAlpha: 0.50,
        birdAlpha: 1.0,
        birdScale: 1.15,
        birdStep: 5,
        chainExplosionStep: 1, // 1단계: 직격 중심 & 좌하단 1차 쾅!
        chainExplosionAlpha: 1.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "sky-attack-fly1-pop1",
        phaseName: "5. 적 통과 후 전방 출현 ➔ 1차 폭발 (중심/좌하단, 75ms)",
      },

      // 6. [상공 비행 2: 우측 상단 고고도 질주 & 2차 우상단/상단 교차 폭발!] (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 4,
        ...cOff(465, -222), // 우측 상단 고고도 질주
        ...tOff(-6, 3),     // 상대 피격 진동
        ...scl({ x: 1.30, y: 0.55 }, { x: 0.96, y: 1.06 }),
        pRot: isP ? -0.25 : 0.25,
        skyFilterAlpha: 0.50, // 폭발 진행 중 배경 필터 완전 유지
        birdAlpha: 0.90,
        birdScale: 1.05,
        birdStep: 6,
        chainExplosionStep: 2, // 2단계: 1차 폭발 페이드아웃 시작 ➔ 2차 우상단/상단 콰쾅 교차 폭발!
        chainExplosionAlpha: 1.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "sky-attack-fly2-peak",
        phaseName: "6. 상공 비행 ➔ 2차 교차 폭발 (우상단/상단, 75ms)",
      },

      // 7. [상공 비행 3: 화면 우측 상단 끝자락 통과 & 3차 좌우 교차 폭발!] (80ms)
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...cOff(550, -263), // 화면 우측 상단 경계 통과
        ...tOff(8, -4),     // 상대 2차 피격 전율
        ...scl({ x: 1.25, y: 0.60 }, { x: 0.98, y: 1.04 }),
        pRot: isP ? -0.25 : 0.25,
        skyFilterAlpha: 0.50, // 폭발 진행 중 배경 필터 완전 유지
        birdAlpha: 0.65,
        birdScale: 0.95,
        birdStep: 7,
        chainExplosionStep: 3, // 3단계: 2차 폭발 감쇄 ➔ 3차 좌우 양옆 교차 폭발!
        chainExplosionAlpha: 1.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "sky-attack-fly3-pop2",
        phaseName: "7. 상공 비행 ➔ 3차 교차 폭발 (좌우 양옆, 80ms)",
      },

      // 8. [상공 비행 4: 화면 밖 완전 이탈 & 4차 상공 중심 피날레 대폭발!] (80ms)
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...cOff(710, -339), // 화면 밖 고공 완전 이탈
        ...tOff(4, -2),     // 잔여 진동
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
        skyFilterAlpha: 0.50, // 4차 피날레 폭발 끝날 때까지 배경 필터 100% 유지!
        birdAlpha: 0.0,
        chainExplosionStep: 4, // 4단계: 3차 폭발 감쇄 ➔ 상공 중심 피날레 대폭발 작렬!
        chainExplosionAlpha: 0.95,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "sky-attack-offscreen",
        phaseName: "8. 화면 밖 고공 완전 이탈 ➔ 4차 상공 피날레 폭발 (80ms)",
      },

      // 8. [상승 비행 1: 좌측 하단 화면 밖에서 초고속 상승 진입 시작 & 5단계 연막 확산] (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 5,
        ...cOff(-150, 120), // 화면 좌측 하단 극단 진입!
        ...tOff(0, 0),
        ...scl({ x: 1.25, y: 0.65 }, { x: 1.0, y: 1.0 }),
        pRot: isP ? -0.24 : 0.24,
        skyFilterAlpha: 0.38, // 폭발 끝나고 연막 흩어지며 부드러운 페이드아웃 시작
        birdAlpha: 0.0,
        chainExplosionStep: 5, // 5단계: 폭발구 연막화 및 상공 확산 소산
        chainExplosionAlpha: 0.65,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "sky-attack-reentry1",
        phaseName: "8. 좌측 하단 상승 진입 시작 ➔ 5단계 연막 확산 (75ms)",
      },

      // 9. [상승 비행 2: 좌측 하단 대각선 고속 활공 상승 & 6단계 최종 페이드아웃] (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 5,
        ...cOff(-95, 75),   // 좌측 하단 선명한 대각선 활공 비행!
        ...tOff(0, 0),
        ...scl({ x: 1.20, y: 0.72 }, { x: 1.0, y: 1.0 }),
        pRot: isP ? -0.20 : 0.20,
        skyFilterAlpha: 0.22,
        birdAlpha: 0.0,
        chainExplosionStep: 6, // 6단계: 부드러운 완전 소멸 페이드아웃
        chainExplosionAlpha: 0.30,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "sky-attack-reentry2",
        phaseName: "9. 좌측 하단 대각선 고속 활공 ➔ 6단계 최종 소멸 (75ms)",
      },

      // 10. [상승 비행 3: 플랫폼 진입 감속 활공] (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 5,
        ...cOff(-45, 35),   // 플랫폼 좌하단 근접 비행
        ...tOff(0, 0),
        ...scl({ x: 1.12, y: 0.82 }, { x: 1.0, y: 1.0 }),
        pRot: isP ? -0.12 : 0.12,
        skyFilterAlpha: 0.10,
        birdAlpha: 0.0,
        chainExplosionAlpha: 0.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "sky-attack-reentry3",
        phaseName: "10. 플랫폼 진입 감속 활공 (75ms)",
      },

      // 11. [플랫폼 착지 직전 감속 터치다운 준비] (70ms)
      {
        ...baseFrame,
        delay: 70,
        moveStep: 5,
        ...cOff(-12, 10),   // 발밑 착지 직전
        ...tOff(0, 0),
        ...scl({ x: 1.05, y: 0.95 }, { x: 1.0, y: 1.0 }),
        pRot: isP ? -0.05 : 0.05,
        skyFilterAlpha: 0.05,
        birdAlpha: 0.0,
        chainExplosionAlpha: 0.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "sky-attack-flare",
        phaseName: "11. 플랫폼 착지 직전 감속 (70ms)",
      },

      // 12. [지면 감속 터치다운 착지 & 리바운드] (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 5,
        ...cOff(4, 2),
        ...tOff(0, 0),
        ...scl({ x: 1.08, y: 0.92 }, { x: 1.0, y: 1.0 }),
        pRot: 0,
        skyFilterAlpha: 0.02,
        birdAlpha: 0.0,
        chainExplosionAlpha: 0.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "sky-attack-touchdown",
        phaseName: "12. 지면 감속 터치다운 착지 (75ms)",
      },

      // 13. [평상 스탠스 완전 복귀] (80ms)
      {
        ...baseFrame,
        delay: 80,
        moveStep: 5,
        ...cOff(0, 0),
        ...tOff(0, 0),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
        pRot: 0,
        skyFilterAlpha: 0.0,
        birdAlpha: 0.0,
        chainExplosionAlpha: 0.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "sky-attack-finish",
        phaseName: "13. 평상 스탠스 복귀 (80ms)",
      },
    ];
  },
};
