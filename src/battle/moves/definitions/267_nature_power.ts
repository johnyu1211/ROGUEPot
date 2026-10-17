// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import {
  drawNaturePowerBehindEffect,
  drawNaturePowerEffect,
} from "../../../renderers/moves/gen1/move265_268.js";

/**
 * 🍃 267: 자연의힘 (Nature Power / しぜんのちから)
 *
 * 타입: 노말 (Normal) / 분류: 변화 (Status) ➔ 특수 공격 기술 전환
 * 위력: 80 (트라이어택 변환 시) / 명중: 100 / PP: 20 / 접촉: X
 * 부가효과: 20% 확률로 상대에게 화상, 얼음, 마비 중 하나의 상태이상을 부여한다.
 * 설명: 자연의 힘을 빌려 공격한다. 통신 배틀 표준 규정상 [트라이어택]으로 변환되어 발동된다!
 *
 * [옵션 A: 통신배틀 표준 트라이어택 연계 연출 시퀀스]:
 * 1. [Step 1: 자연의 기운 소집]:
 *    - 시전자 주변 360도에서 에메랄드빛/라임색 자연의 잎새들이 나선형으로 소용돌이치며 시전자에게 수렴
 *    - 시전자 발밑에 펼쳐지는 싱그러운 그린·골드 자연의 파동 오라 링 및 반짝이는 별빛
 * 2. [Step 2: 칠흑 같은 암전 & 트라이어택 3D 삼색 불꽃 공전 가속]:
 *    - 배경에 암전이 서서히 드리우며 삼색 불꽃이 부드럽게 점화되어 3D 궤도 회전
 *    - 삼색 불꽃이 3차원 궤도를 따라 가속 회전하며 점차 길어지는 원소 화염 구축
 * 3. [Step 3: 타겟 클로즈업 & 3원소 탄환 발사 & 3연타 폭발 타격]:
 *    - 빨강(화염 1타) ➔ 노랑(전격 2타) ➔ 파랑(빙결 3타) 순차 투척 및 폭발 강타
 *    - 3타 타격 시 체력 감소 및 3원소 복합 충격파 전개!
 */
export const naturePowerMove: BattleMoveAnimation = {
  num: 267,
  key: "nature-power",
  nameKo: "자연의힘",
  nameEn: "Nature Power",
  type: "normal",
  category: "special", // 배틀 및 뷰어에서 트라이어택 공격으로 전환되어 발동됨
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    delayUntilStep: 3, // Step 1~2 동안은 시전자 조망, Step 3 타격부터 타겟 클로즈업!
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: drawNaturePowerBehindEffect,
  drawEffect: drawNaturePowerEffect,

  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 시전자 오프셋 & 스케일 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 피격자(수비자) 오프셋 & 스케일 헬퍼
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    const frames: BattleFrame[] = [];

    // =======================================================================
    // [Step 1: 자연의 기운 소집] (8프레임, 45ms)
    // 시전자 주변 나선형 나뭇잎 소용돌이 & 자연의 오라 파동 링 수렴
    // =======================================================================
    const step1GatherCount = 8;
    for (let i = 0; i < step1GatherCount; i++) {
      const prog = i / (step1GatherCount - 1);
      // 시전자가 자연의 숨결을 들이쉬듯 천천히 웅크렸다 기운을 얻고 가슴을 폄
      const cy = Math.sin(prog * Math.PI) * -3;
      const sx = 1.0 - Math.sin(prog * Math.PI) * 0.04;
      const sy = 1.0 + Math.sin(prog * Math.PI) * 0.04;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, cy),
        ...cScale(sx, sy),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 1,
        darkAlpha: 0,
        natureGatherProgress: prog,
        phaseId: `nature-gather-${i + 1}`,
        phaseName: `1. 자연의 기운 소집 (${i + 1}/${step1GatherCount})`,
      } as any);
    }

    // =======================================================================
    // [Step 2: 칠흑 같은 암전 & 트라이어택 3D 삼색 불꽃 공전 가속] (12프레임, 55ms)
    // 어색한 중간 구체 모션 없이 자연스럽게 암전 및 3D 불꽃 궤도로 부드럽게 전이
    // =======================================================================
    const step2Configs = [
      { delay: 55, dark: 0.30, theta: 0.00, len: 0.10, alpha: 0.00, cx: -2, cy: 1, sx: 1.02, sy: 0.98, name: "암전 시작 & 공전 궤도 진입 (투명)" },
      { delay: 55, dark: 0.60, theta: 0.35, len: 0.18, alpha: 0.18, cx: -4, cy: 2, sx: 1.04, sy: 0.96, name: "암전 심화 & 회전하며 은은하게 색상 발현" },
      { delay: 55, dark: 0.88, theta: 0.75, len: 0.28, alpha: 0.38, cx: -6, cy: 3, sx: 1.06, sy: 0.94, name: "완전 암전 & 삼원소 불꽃 색상 가시화" },
      { delay: 55, dark: 0.88, theta: 1.25, len: 0.40, alpha: 0.60, cx: -7, cy: 3, sx: 1.08, sy: 0.92, name: "3차원 회전 가속 & 삼색 불꽃 선명화" },
      { delay: 55, dark: 0.88, theta: 1.85, len: 0.52, alpha: 0.80, cx: -8, cy: 4, sx: 1.09, sy: 0.91, name: "3차원 공전 (파랑/노랑/빨강) & 색상 발색" },
      { delay: 55, dark: 0.88, theta: 2.55, len: 0.65, alpha: 0.95, cx: -8, cy: 4, sx: 1.10, sy: 0.90, name: "3차원 공전 & 완전한 원소 색상 발현" },
      { delay: 55, dark: 0.88, theta: 3.35, len: 0.75, alpha: 1.00, cx: -7, cy: 3, sx: 1.09, sy: 0.91, name: "고속 회전 & 불꽃 리본 유기적 확장" },
      { delay: 55, dark: 0.88, theta: 4.25, len: 0.85, alpha: 1.00, cx: -6, cy: 2, sx: 1.07, sy: 0.93, name: "3차원 원소 회오리 구축" },
      { delay: 55, dark: 0.88, theta: 5.25, len: 0.95, alpha: 1.00, cx: -4, cy: 1, sx: 1.05, sy: 0.95, name: "삼원소 불꽃 최대 신장 (Long Trail)" },
      { delay: 55, dark: 0.88, theta: 6.35, len: 1.00, alpha: 1.00, cx: -2, cy: 0, sx: 1.03, sy: 0.97, name: "삼원소 불꽃 에너지 응축" },
      { delay: 55, dark: 0.88, theta: 7.55, len: 1.00, alpha: 1.00, cx: 0, cy: -1, sx: 1.01, sy: 0.99, name: "발사 임계점 도달" },
      { delay: 55, dark: 0.88, theta: 8.80, len: 1.00, alpha: 1.00, cx: 3, cy: -2, sx: 1.00, sy: 1.00, name: "알갱이 변환 및 발사 준비" },
    ];

    for (let i = 0; i < step2Configs.length; i++) {
      const cfg = step2Configs[i];
      frames.push({
        ...baseFrame,
        delay: cfg.delay,
        ...cOff(cfg.cx, cfg.cy),
        ...cScale(cfg.sx, cfg.sy),
        showBehindEffect: true,
        showEffect: true,
        moveStep: 2,
        darkAlpha: cfg.dark,
        orbitTheta: cfg.theta,
        flameLengthFactor: cfg.len,
        flameAlpha: cfg.alpha,
        phaseId: `nature-tri-orbit-${i + 1}`,
        phaseName: `2. ${cfg.name} (${i + 1}/${step2Configs.length})`,
      });
    }

    // =======================================================================
    // [Step 3: 타겟 클로즈업 & 3원소 탄환 발사 & 3연타 폭발 타격]
    // =======================================================================
    interface PelletState {
      elemIdx: number;       // 2: 빨강(화염), 1: 노랑(전격), 0: 파랑(빙결)
      progress: number;      // 0.0 ~ 1.0
      arcHeight?: number;    // 포물선 투척 궤적 높이
      offsetY?: number;      // Y 오프셋
      burstProgress?: number; // 착탄 폭발 진행도 (0.0 ~ 1.0)
    }

    interface Step3FrameDef {
      delay: number;
      dark: number;
      pellets: PelletState[];
      defX: number;
      defY: number;
      defSx: number;
      defSy: number;
      hitFlash: boolean;
      updateHp: boolean;
      name: string;
    }

    const step3Frames: Step3FrameDef[] = [
      // 1. 빨간색 원(화염) 투척 시작 (암전 유지)
      {
        delay: 50, dark: 0.88,
        pellets: [
          { elemIdx: 2, progress: 0.22, arcHeight: 28, offsetY: -8 },
        ],
        defX: 0, defY: 0, defSx: 1.0, defSy: 1.0, hitFlash: false, updateHp: false,
        name: "1차 빨간색 원(화염) 투척 (암전 유지)",
      },
      // 2. 빨간색 원 비행 쇄도 (정점)
      {
        delay: 50, dark: 0.88,
        pellets: [
          { elemIdx: 2, progress: 0.60, arcHeight: 28, offsetY: -8 },
        ],
        defX: 0, defY: 0, defSx: 1.0, defSy: 1.0, hitFlash: false, updateHp: false,
        name: "빨간색 원 비행 쇄도",
      },
      // 3. 빨간색 원 상대방 목전 접근
      {
        delay: 50, dark: 0.88,
        pellets: [
          { elemIdx: 2, progress: 0.88, arcHeight: 28, offsetY: -8 },
        ],
        defX: isHit ? 1 : 0, defY: 0, defSx: 1.0, defSy: 1.0, hitFlash: false, updateHp: false,
        name: "빨간색 원 상대방 목전 접근",
      },
      // 4. 💥 빨간색 원 피격 폭발 (1타) & 2차 노란색 원 투척
      {
        delay: 55, dark: 0.88,
        pellets: [
          { elemIdx: 2, progress: 1.00, burstProgress: 0.30, offsetY: -8 },
          { elemIdx: 1, progress: 0.20, arcHeight: 22, offsetY: 4 },
        ],
        defX: isHit ? 3 : 0, defY: 0, defSx: 0.95, defSy: 1.05, hitFlash: isHit, updateHp: false,
        name: "빨간색 화염 피격 폭발 (1타) & 2차 노란색 원 투척",
      },
      // 5. 빨간색 폭발 전개 & 노란색 원 비행 쇄도
      {
        delay: 50, dark: 0.88,
        pellets: [
          { elemIdx: 2, progress: 1.00, burstProgress: 0.75, offsetY: -8 },
          { elemIdx: 1, progress: 0.60, arcHeight: 22, offsetY: 4 },
        ],
        defX: isHit ? -2 : 0, defY: 0, defSx: 1.03, defSy: 0.97, hitFlash: false, updateHp: false,
        name: "노란색 전격 원 비행 쇄도",
      },
      // 6. 빨간색 잔향 소산 & 노란색 원 상대방 목전 접근
      {
        delay: 50, dark: 0.88,
        pellets: [
          { elemIdx: 2, progress: 1.00, burstProgress: 1.00, offsetY: -8 },
          { elemIdx: 1, progress: 0.88, arcHeight: 22, offsetY: 4 },
        ],
        defX: 0, defY: 0, defSx: 1.0, defSy: 1.0, hitFlash: false, updateHp: false,
        name: "노란색 원 상대방 목전 접근",
      },
      // 7. 💥 노란색 원 피격 방전 (2타) & 3차 파란색 원 투척
      {
        delay: 55, dark: 0.88,
        pellets: [
          { elemIdx: 1, progress: 1.00, burstProgress: 0.30, offsetY: 4 },
          { elemIdx: 0, progress: 0.20, arcHeight: 32, offsetY: -4 },
        ],
        defX: isHit ? -3 : 0, defY: 1, defSx: 1.05, defSy: 0.95, hitFlash: isHit, updateHp: false,
        name: "노란색 전격 피격 방전 (2타) & 3차 파란색 원 투척",
      },
      // 8. 노란색 방전 전개 & 파란색 원 비행 쇄도
      {
        delay: 50, dark: 0.88,
        pellets: [
          { elemIdx: 1, progress: 1.00, burstProgress: 0.75, offsetY: 4 },
          { elemIdx: 0, progress: 0.60, arcHeight: 32, offsetY: -4 },
        ],
        defX: isHit ? 2 : 0, defY: 0, defSx: 0.98, defSy: 1.02, hitFlash: false, updateHp: false,
        name: "파란색 빙결 원 비행 쇄도",
      },
      // 9. 노란색 잔향 소산 & 파란색 원 상대방 목전 접근
      {
        delay: 50, dark: 0.88,
        pellets: [
          { elemIdx: 1, progress: 1.00, burstProgress: 1.00, offsetY: 4 },
          { elemIdx: 0, progress: 0.88, arcHeight: 32, offsetY: -4 },
        ],
        defX: 0, defY: 0, defSx: 1.0, defSy: 1.0, hitFlash: false, updateHp: false,
        name: "파란색 원 상대방 목전 접근",
      },
      // 10. 💥 파란색 원 최종 피격 파쇄 (3타) & 체력 감소 (HP Drain)
      {
        delay: 60, dark: 0.88,
        pellets: [
          { elemIdx: 0, progress: 1.00, burstProgress: 0.20, offsetY: -4 },
        ],
        defX: isHit ? 4 : 0, defY: -2, defSx: 0.92, defSy: 1.08, hitFlash: isHit, updateHp: true,
        name: "파란색 빙결 피격 파쇄 (3타) & 데미지 타격",
      },
      // 11. 💥 삼원소 피격 복합 폭발 전개
      {
        delay: 60, dark: 0.70,
        pellets: [
          { elemIdx: 0, progress: 1.00, burstProgress: 0.60, offsetY: -4 },
        ],
        defX: isHit ? -4 : 0, defY: 3, defSx: 1.10, defSy: 0.90, hitFlash: false, updateHp: true,
        name: "삼원소 복합 충격파 전개 & 얼음 파편 비산",
      },
      // 12. 최종 폭발 잔향 지속 & 피격 탄성 반동
      {
        delay: 60, dark: 0.35,
        pellets: [
          { elemIdx: 0, progress: 1.00, burstProgress: 0.90, offsetY: -4 },
        ],
        defX: isHit ? 2 : 0, defY: -1, defSx: 0.97, defSy: 1.03, hitFlash: false, updateHp: true,
        name: "폭발 잔향 및 피격 탄성 반동",
      },
      // 13. 타겟 피격 복귀 및 안정화
      {
        delay: 65, dark: 0.00,
        pellets: [],
        defX: 0, defY: 0, defSx: 1.0, defSy: 1.0, hitFlash: false, updateHp: true,
        name: "타겟 피격 복귀 및 안정화",
      },
    ];

    // 회피(Miss) 시: 피격자가 옆으로 피하고 알갱이들이 빗나감
    if (!isHit) {
      for (let i = 0; i < step3Frames.length; i++) {
        const sf = step3Frames[i];
        const evadeX = i >= 2 && i <= 8 ? (isP ? 28 : -28) : (i > 8 && i <= 11 ? (isP ? 14 : -14) : 0);
        const evadeY = i >= 2 && i <= 8 ? -16 : (i > 8 && i <= 11 ? -8 : 0);

        const missPellets = sf.pellets.map(p => ({
          ...p,
          offsetY: (p.offsetY ?? 0) + (isP ? -25 : 25),
          burstProgress: undefined,
        }));

        frames.push({
          ...baseFrame,
          delay: sf.delay,
          ...cOff(0, 0),
          ...defOff(evadeX, evadeY),
          showBehindEffect: true,
          showEffect: true,
          moveStep: 3,
          darkAlpha: sf.dark,
          triPellets: missPellets,
          hitFlash: false,
          phaseId: `nature-tri-miss-${i + 1}`,
          phaseName: `3. ${sf.name} (회피 ${i + 1}/${step3Frames.length})`,
        });
      }
    } else {
      // 명중(Hit) 시
      for (let i = 0; i < step3Frames.length; i++) {
        const sf = step3Frames[i];
        frames.push({
          ...baseFrame,
          delay: sf.delay,
          ...cOff(0, 0),
          ...defOff(sf.defX, sf.defY),
          ...defScale(sf.defSx, sf.defSy),
          showBehindEffect: true,
          showEffect: true,
          moveStep: 3,
          darkAlpha: sf.dark,
          triPellets: sf.pellets,
          hitFlash: sf.hitFlash,
          enemyHp: sf.updateHp ? a.enemyHpAfter : enemyHp,
          playerHp: sf.updateHp ? a.playerHpAfter : playerHp,
          phaseId: `nature-tri-hit-${i + 1}`,
          phaseName: `3. ${sf.name} (${i + 1}/${step3Frames.length})`,
        });
      }
    }

    return frames;
  },
};
