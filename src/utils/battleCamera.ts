import { BattleFrame, CameraType, MoveCameraConfig, BattleMoveAnimation } from "../battle/moves/types.js";

export interface CameraFocalPoint {
  x: number;
  y: number;
}

export type CameraHandler = (
  frames: BattleFrame[],
  attackerPos: CameraFocalPoint,
  defenderPos: CameraFocalPoint,
  cfg: MoveCameraConfig,
  isTargetPlayer?: boolean,
  hasNextTarget?: boolean
) => void;

/**
 * Helper to generate high-FPS buttery-smooth camera return frames (Gen 5 smooth dolly-out)
 * Generates intermediate interpolated frames at ~30 FPS (35ms) to eliminate stuttering ("틱틱 끊김" 방지)
 */
function createSmoothCameraReturnFrames(
  lastFrame: BattleFrame,
  startZoom: number,
  focalPoint: CameraFocalPoint,
  neutralX: number,
  neutralY: number,
  frameCount: number = 7,
  frameDelayMs: number = 50
): BattleFrame[] {
  const result: BattleFrame[] = [];
  for (let i = 1; i <= frameCount; i++) {
    const u = i / frameCount;
    // Cubic ease-out: starts decelerating naturally and coasts smoothly to neutral
    const easedProgress = 1 - Math.pow(1 - u, 3);
    const factor = Math.max(0, 1 - easedProgress);

    const isFinal = i === frameCount;
    const isPlayerEvading = (lastFrame.pOffset && lastFrame.pOffset.y <= -500) || lastFrame.hidePlayer;
    const isEnemyEvading = (lastFrame.eOffset && lastFrame.eOffset.y <= -500) || lastFrame.hideEnemy;

    result.push({
      ...lastFrame,
      delay: frameDelayMs,
      pOffset: isPlayerEvading ? lastFrame.pOffset : { x: 0, y: 0 },
      eOffset: isEnemyEvading ? lastFrame.eOffset : { x: 0, y: 0 },
      hidePlayer: isPlayerEvading,
      hideEnemy: isEnemyEvading,
      hidePShadow: isPlayerEvading,
      hideEShadow: isEnemyEvading,
      pAlpha: isPlayerEvading ? 0.0 : (lastFrame.pAlpha ?? 1.0),
      eAlpha: isEnemyEvading ? 0.0 : (lastFrame.eAlpha ?? 1.0),
      showEffect: false,
      hitFlash: false,
      blackoutScreen: false,
      eWhite: false,
      pWhite: false,
      hideUI: false,
      statProgress: undefined,
      afterCameraReturn: true,
      cameraZoom: Number((1.0 + (startZoom - 1.0) * factor).toFixed(4)),
      cameraFocal: factor > 0.001 ? {
        x: Math.round(neutralX + (focalPoint.x - neutralX) * factor),
        y: Math.round(neutralY + (focalPoint.y - neutralY) * factor),
      } : null,
      _gen5Camera: factor > 0.001,
      phaseId: "6-camera-return",
      phaseName: isFinal ? "6. 카메라 복귀 (중립 안착)" : `6. 카메라 복귀 (글라이드 ${i}/${frameCount})`,
    });
  }
  return result;
}

/**
 * 1. Target Camera Handler (Default for Physical/Special attacks)
 * 
 * Strict Chronological Sequencing:
 * 1. Camera Glide: Camera zooms toward target
 * 2. Attacker Motion under Locked Camera
 * 3. Impact Strike & Visual Burst under Locked Camera
 * 4. Recovery & Camera Return (fast if follow-up target exists, slow & cinematic if no next target)
 */
export const targetCameraHandler: CameraHandler = (
  frames,
  attackerPos,
  defenderPos,
  cfg,
  isTargetPlayer = false,
  hasNextTarget = false
) => {
  const targetZoom = cfg.zoom || 1.35;
  if (frames.length === 0) return;

  // Separate post-camera return frames (e.g. recoil blink after camera returns to neutral)
  const postCameraFrames: BattleFrame[] = [];
  const actionFrames: BattleFrame[] = [];
  for (const f of frames) {
    if (f.afterCameraReturn) {
      postCameraFrames.push(f);
    } else {
      actionFrames.push(f);
    }
  }

  frames.length = 0;
  frames.push(...actionFrames);

  const base = frames[0] || postCameraFrames[0];
  const neutralX = 280;
  const neutralY = 190;

  // 내 포켓몬 확대 시: 화면 정중앙(Dead Center, 280x190)!
  // 적 포켓몬 확대 시: 정중앙이 아니라 기존 확대 방식(0.48 다이내믹 심도)!
  const targetPos = defenderPos;
  const focalPoint: CameraFocalPoint = isTargetPlayer
    ? { x: targetPos.x, y: targetPos.y }
    : {
        x: Math.round(neutralX + (targetPos.x - neutralX) * 0.48),
        y: Math.round(neutralY + (targetPos.y - neutralY) * 0.48),
      };

  // Tag existing action frames with camera lock and phase metadata
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.isBlur || f.delay >= 10000 || f.isHighSkyCutscene) continue;

    f.cameraFocal = focalPoint;
    f.cameraZoom = targetZoom;
    f._gen5Camera = true;

    if (!f.phaseId) {
      if (f.hitFlash || f.showEffect) {
        f.phaseId = "4-target-strike";
        f.phaseName = "4. 타격 & 이펙트";
      } else if ((f.pOffset && (f.pOffset.x !== 0 || f.pOffset.y !== 0)) || (f.eOffset && (f.eOffset.x !== 0 || f.eOffset.y !== 0))) {
        f.phaseId = "3-attacker-motion";
        f.phaseName = "3. 공격자 도약";
      } else {
        f.phaseId = "5-recovery";
        f.phaseName = "5. 착지 / 복귀";
      }
    }
  }

  // 1. Smooth 3-Step Cinematic Glide-In (50ms -> 50ms -> 60ms)
  // Step 1 (t = 0.30)
  const glide1: BattleFrame = {
    ...base,
    delay: 50,
    pOffset: { x: 0, y: 0 },
    eOffset: { x: 0, y: 0 },
    showEffect: false,
    hitFlash: false,
    statProgress: undefined,
    cameraZoom: 1.0 + (targetZoom - 1.0) * 0.25,
    cameraFocal: {
      x: Math.round(neutralX + (focalPoint.x - neutralX) * 0.30),
      y: Math.round(neutralY + (focalPoint.y - neutralY) * 0.30),
    },
    _gen5Camera: true,
    phaseId: "1-camera-zoom",
    phaseName: "1. 카메라 이동 (진입)",
  };

  // Step 2 (t = 0.70)
  const glide2: BattleFrame = {
    ...base,
    delay: 50,
    pOffset: { x: 0, y: 0 },
    eOffset: { x: 0, y: 0 },
    showEffect: false,
    hitFlash: false,
    statProgress: undefined,
    cameraZoom: 1.0 + (targetZoom - 1.0) * 0.65,
    cameraFocal: {
      x: Math.round(neutralX + (focalPoint.x - neutralX) * 0.70),
      y: Math.round(neutralY + (focalPoint.y - neutralY) * 0.70),
    },
    _gen5Camera: true,
    phaseId: "1-camera-zoom",
    phaseName: "1. 카메라 이동 (가속)",
  };

  // Step 3 (t = 1.00)
  const glide3: BattleFrame = {
    ...base,
    delay: 60,
    pOffset: { x: 0, y: 0 },
    eOffset: { x: 0, y: 0 },
    showEffect: false,
    hitFlash: false,
    statProgress: undefined,
    cameraZoom: targetZoom,
    cameraFocal: focalPoint,
    _gen5Camera: true,
    phaseId: "1-camera-zoom",
    phaseName: "1. 카메라 이동 (안착)",
  };

  frames.unshift(glide1, glide2, glide3);

  // 6. Camera Return (Glide-Out)
  const lastFrame = frames[frames.length - 1];

  if (hasNextTarget) {
    // 다음 대상(후속 공격)이 있을 때: 빠르고 경쾌하게 복귀 (3프레임 x 40ms = 120ms)
    frames.push(...createSmoothCameraReturnFrames(lastFrame, targetZoom, focalPoint, neutralX, neutralY, 3, 40));
  } else {
    // 7프레임 x 50ms = 350ms (자연스러운 큐빅 이징 아웃으로 부드러움 유지 & 속도 대폭 개선)
    frames.push(...createSmoothCameraReturnFrames(lastFrame, targetZoom, focalPoint, neutralX, neutralY, 7, 50));
  }

  // 7. Post-Camera Frames (카메라 원상태 복귀 후 재생되는 프레임: 반동 데미지 깜빡임 등)
  if (postCameraFrames.length > 0) {
    for (const pf of postCameraFrames) {
      pf.cameraZoom = 1.0;
      pf.cameraFocal = null;
      pf._gen5Camera = false;
    }
    frames.push(...postCameraFrames);
  }
};

/**
 * 2. Self Camera Handler (For self-buffs & status moves like Swords Dance)
 */
export const selfCameraHandler: CameraHandler = (frames, attackerPos, defenderPos, cfg, isTargetPlayer = true, hasNextTarget = false) => {
  const selfZoom = cfg.zoom || 1.20;
  if (frames.length === 0) return;

  const postCameraFrames: BattleFrame[] = [];
  const actionFrames: BattleFrame[] = [];
  for (const f of frames) {
    if (f.afterCameraReturn) {
      postCameraFrames.push(f);
    } else {
      actionFrames.push(f);
    }
  }

  frames.length = 0;
  frames.push(...actionFrames);

  const base = frames[0] || postCameraFrames[0];
  const neutralX = 280;
  const neutralY = 190;
  const targetPos = attackerPos;

  // 내 포켓몬 확대 시: 화면 정중앙 (Dead Center)!
  // 적 포켓몬 확대 시: 기존 확대 방식 (0.48 다이내믹 심도)!
  const focalPoint: CameraFocalPoint = isTargetPlayer
    ? { x: targetPos.x, y: targetPos.y }
    : {
        x: Math.round(neutralX + (targetPos.x - neutralX) * 0.48),
        y: Math.round(neutralY + (targetPos.y - neutralY) * 0.48),
      };

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.isBlur || f.delay >= 10000) continue;

    f.cameraFocal = focalPoint;
    f.cameraZoom = selfZoom;
    f._gen5Camera = true;
    if (!f.phaseId) {
      f.phaseId = "3-caster-effect";
      f.phaseName = "3. 기술 연출 & 버프";
    }
  }

  // Smooth 2-Step Glide-In
  const glide1: BattleFrame = {
    ...base,
    delay: 60,
    pOffset: { x: 0, y: 0 },
    eOffset: { x: 0, y: 0 },
    showEffect: false,
    hitFlash: false,
    statProgress: undefined,
    cameraZoom: 1.0 + (selfZoom - 1.0) * 0.40,
    cameraFocal: {
      x: Math.round(neutralX + (focalPoint.x - neutralX) * 0.40),
      y: Math.round(neutralY + (focalPoint.y - neutralY) * 0.40),
    },
    _gen5Camera: true,
    phaseId: "1-camera-zoom",
    phaseName: "1. 카메라 이동 (진입)",
  };

  const glide2: BattleFrame = {
    ...base,
    delay: 60,
    pOffset: { x: 0, y: 0 },
    eOffset: { x: 0, y: 0 },
    showEffect: false,
    hitFlash: false,
    statProgress: undefined,
    cameraZoom: selfZoom,
    cameraFocal: focalPoint,
    _gen5Camera: true,
    phaseId: "1-camera-zoom",
    phaseName: "1. 카메라 이동 (안착)",
  };

  frames.unshift(glide1, glide2);

  // 6. Camera Return (Glide-Out)
  const lastFrame = frames[frames.length - 1];

  if (hasNextTarget) {
    // 다음 대상(후속 공격)이 있을 때: 빠르고 경쾌하게 복귀 (3프레임 x 40ms = 120ms)
    frames.push(...createSmoothCameraReturnFrames(lastFrame, selfZoom, focalPoint, neutralX, neutralY, 3, 40));
  } else {
    // 7프레임 x 50ms = 350ms (자연스러운 큐빅 이징 아웃으로 부드러움 유지 & 속도 대폭 개선)
    frames.push(...createSmoothCameraReturnFrames(lastFrame, selfZoom, focalPoint, neutralX, neutralY, 7, 50));
  }

  // 7. Post-Camera Frames (카메라 원상태 복귀 후 재생되는 프레임)
  if (postCameraFrames.length > 0) {
    for (const pf of postCameraFrames) {
      pf.cameraZoom = 1.0;
      pf.cameraFocal = null;
      pf._gen5Camera = false;
    }
    frames.push(...postCameraFrames);
  }
};

/**
 * 3. Sky Camera Handler (Fly, Sky Drop)
 */
export const skyCameraHandler: CameraHandler = (frames, attackerPos, defenderPos, cfg, isTargetPlayer = false, hasNextTarget = false) => {
  const neutralX = 280;
  const neutralY = 190;
  const targetPos = defenderPos;
  const focalPoint: CameraFocalPoint = isTargetPlayer
    ? { x: targetPos.x, y: targetPos.y }
    : {
        x: Math.round(neutralX + (targetPos.x - neutralX) * 0.48),
        y: Math.round(neutralY + (targetPos.y - neutralY) * 0.48),
      };

  const skyZoom = cfg.zoom || 1.35;
  if (frames.length === 0) return;

  // Separate post-camera return frames (e.g. recoil blink after camera returns to neutral)
  const postCameraFrames: BattleFrame[] = [];
  const actionFrames: BattleFrame[] = [];
  for (const f of frames) {
    if (f.afterCameraReturn) {
      postCameraFrames.push(f);
    } else {
      actionFrames.push(f);
    }
  }

  frames.length = 0;
  frames.push(...actionFrames);

  let didZoom = false;

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.cameraTrackAttacker) {
      // Preserve dynamic vertical rocket tracking camera during 1턴 liftoff!
      continue;
    }
    if (f.isHighSkyCutscene) {
      f.cameraZoom = 1.0;
      f.cameraFocal = null;
      f._gen5Camera = false;
    } else if (f.showEffect || f.hitFlash) {
      f.cameraZoom = skyZoom;
      f.cameraFocal = focalPoint;
      f._gen5Camera = true;
      didZoom = true;
    } else if (didZoom) {
      // Once impact zoom occurs, keep focus through ground landing until camera glide-out begins!
      f.cameraZoom = skyZoom;
      f.cameraFocal = focalPoint;
      f._gen5Camera = true;
    } else {
      f.cameraZoom = 1.0;
      f.cameraFocal = null;
      f._gen5Camera = false;
    }
  }

  // Camera Return (Glide-Out) - Only if camera actually zoomed in!
  if (frames.length > 0 && didZoom) {
    const lastFrame = frames[frames.length - 1];
    if (hasNextTarget) {
      // 다음 대상(후속 공격)이 있을 때: 빠르고 경쾌하게 복귀 (3프레임 x 40ms = 120ms)
      frames.push(...createSmoothCameraReturnFrames(lastFrame, skyZoom, focalPoint, neutralX, neutralY, 3, 40));
    } else {
      // 7프레임 x 50ms = 350ms (자연스러운 큐빅 이징 아웃으로 부드러움 유지 & 속도 대폭 개선)
      frames.push(...createSmoothCameraReturnFrames(lastFrame, skyZoom, focalPoint, neutralX, neutralY, 7, 50));
    }
  }

  // Post-Camera Frames (e.g. recoil damage blink & HP drain)
  if (postCameraFrames.length > 0) {
    for (const pf of postCameraFrames) {
      pf.cameraZoom = 1.0;
      pf.cameraFocal = null;
      pf._gen5Camera = false;
    }
    frames.push(...postCameraFrames);
  }
};

/**
 * 4. Rush / Charge Camera Handler (Take Down, Double-Edge)
 * 
 * Flow:
 * 1. Zooms onto CASTER (내 포켓몬) during windup / step back
 * 2. Whips to TARGET (타격점) on impact / strike with visual effect
 * 3. Holds on target during recoil recovery, then smoothly glides out to neutral
 */
export const rushCameraHandler: CameraHandler = (
  frames,
  attackerPos,
  defenderPos,
  cfg,
  isTargetPlayer = false,
  hasNextTarget = false
) => {
  const targetZoom = cfg.zoom || 1.35;
  if (frames.length === 0) return;

  const postCameraFrames: BattleFrame[] = [];
  const actionFrames: BattleFrame[] = [];
  for (const f of frames) {
    if (f.afterCameraReturn) {
      postCameraFrames.push(f);
    } else {
      actionFrames.push(f);
    }
  }

  frames.length = 0;
  frames.push(...actionFrames);

  const base = frames[0] || postCameraFrames[0];
  const neutralX = 280;
  const neutralY = 190;

  // 1. Attacker Focal Point (내 포켓몬 시전 시 정중앙 Dead Center, 적 시전 시 0.48 다이내믹 심도)
  const isAttackerPlayer = !isTargetPlayer;
  const attackerFocal: CameraFocalPoint = isAttackerPlayer
    ? { x: attackerPos.x, y: attackerPos.y }
    : {
        x: Math.round(neutralX + (attackerPos.x - neutralX) * 0.48),
        y: Math.round(neutralY + (attackerPos.y - neutralY) * 0.48),
      };

  // 2. Defender Focal Point (타격점 포커싱)
  const defenderFocal: CameraFocalPoint = isTargetPlayer
    ? { x: defenderPos.x, y: defenderPos.y }
    : {
        x: Math.round(neutralX + (defenderPos.x - neutralX) * 0.48),
        y: Math.round(neutralY + (defenderPos.y - neutralY) * 0.48),
      };

  // 3. Midpoint between Attacker and Defender (돌진 중간 지점 궤적)
  const midFocal: CameraFocalPoint = {
    x: Math.round((attackerFocal.x + defenderFocal.x) / 2),
    y: Math.round((attackerFocal.y + defenderFocal.y) / 2),
  };

  // Assign camera parameters per frame based on moveStep / impact
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.isBlur || f.delay >= 10000) continue;

    f._gen5Camera = true;

    if (f.moveStep === 1) {
      // Step 1: Windup (시전자 후진) -> Focus on ATTACKER
      f.cameraFocal = attackerFocal;
      f.cameraZoom = targetZoom;
      if (!f.phaseId) {
        f.phaseId = "2-attacker-windup";
        f.phaseName = "2. 시전자 후진 (힘 모으기)";
      }
    } else if (f.moveStep === 2 && !f.showEffect && !f.hitFlash) {
      // Step 2: Mid-Rush Dash (전방 급발진 가속) -> Smooth Midpoint tracking (화면 점프 방지!)
      f.cameraFocal = midFocal;
      f.cameraZoom = 1.0 + (targetZoom - 1.0) * 0.60;
      if (!f.phaseId) {
        f.phaseId = "3-rush-dash";
        f.phaseName = "3. 전방 가속 돌진";
      }
    } else {
      // Step 3+: Impact & Recoil & Settle -> Focus on TARGET (타격점)
      f.cameraFocal = defenderFocal;
      f.cameraZoom = targetZoom;
      if (!f.phaseId) {
        if (f.hitFlash || f.showEffect) {
          f.phaseId = "4-target-strike";
          f.phaseName = "4. 돌진 타격 (주황 이펙트)";
        } else {
          f.phaseId = "5-recovery";
          f.phaseName = "5. 반동 복귀";
        }
      }
    }
  }

  // Glide-in to ATTACKER at start (내 포켓몬으로 카메라 진입!)
  const glide1: BattleFrame = {
    ...base,
    delay: 50,
    pOffset: { x: 0, y: 0 },
    eOffset: { x: 0, y: 0 },
    showEffect: false,
    hitFlash: false,
    statProgress: undefined,
    cameraZoom: 1.0 + (targetZoom - 1.0) * 0.40,
    cameraFocal: {
      x: Math.round(neutralX + (attackerFocal.x - neutralX) * 0.40),
      y: Math.round(neutralY + (attackerFocal.y - neutralY) * 0.40),
    },
    _gen5Camera: true,
    phaseId: "1-camera-zoom",
    phaseName: "1. 카메라 이동 (시전자 진입)",
  };

  const glide2: BattleFrame = {
    ...base,
    delay: 50,
    pOffset: { x: 0, y: 0 },
    eOffset: { x: 0, y: 0 },
    showEffect: false,
    hitFlash: false,
    statProgress: undefined,
    cameraZoom: targetZoom,
    cameraFocal: attackerFocal,
    _gen5Camera: true,
    phaseId: "1-camera-zoom",
    phaseName: "1. 카메라 이동 (시전자 안착)",
  };

  frames.unshift(glide1, glide2);

  // Camera Return (Glide-Out) from DEFENDER to neutral arena
  const lastFrame = frames[frames.length - 1];
  if (hasNextTarget) {
    // 다음 대상(후속 공격)이 있을 때: 빠르고 경쾌하게 복귀 (3프레임 x 40ms = 120ms)
    frames.push(...createSmoothCameraReturnFrames(lastFrame, targetZoom, defenderFocal, neutralX, neutralY, 3, 40));
  } else {
    // 7프레임 x 50ms = 350ms (자연스러운 큐빅 이징 아웃으로 부드러움 유지 & 속도 대폭 개선)
    frames.push(...createSmoothCameraReturnFrames(lastFrame, targetZoom, defenderFocal, neutralX, neutralY, 7, 50));
  }

  // Post-Camera Frames (e.g. recoil damage blink & HP drain)
  if (postCameraFrames.length > 0) {
    for (const pf of postCameraFrames) {
      pf.cameraZoom = 1.0;
      pf.cameraFocal = null;
      pf._gen5Camera = false;
    }
    frames.push(...postCameraFrames);
  }
};

/**
 * 6. Beam / Projectile Camera Handler
 * - 시전자(공격자)에서 광선 방출 시 시전자를 포커싱
 * - 광선이 전장을 가로질러 날아가는 동안 카메라가 궤적을 따라 상대방(피격자)으로 부드럽게 글라이드 이동
 * - 상대방에 닿는 순간부터 타격/폭발/여운은 상대방에 클로즈업 고정
 * - 기술 종료 후 중립 시점으로 부드럽게 복귀
 */
export const beamCameraHandler: CameraHandler = (
  frames,
  attackerPos,
  defenderPos,
  cfg,
  isTargetPlayer = false,
  hasNextTarget = false
) => {
  const targetZoom = cfg.zoom || 1.30;
  if (frames.length === 0) return;

  const postCameraFrames: BattleFrame[] = [];
  const actionFrames: BattleFrame[] = [];
  for (const f of frames) {
    if (f.afterCameraReturn) {
      postCameraFrames.push(f);
    } else {
      actionFrames.push(f);
    }
  }

  frames.length = 0;
  frames.push(...actionFrames);

  const base = frames[0] || postCameraFrames[0];
  const neutralX = 280;
  const neutralY = 190;

  // 1. Attacker Focal Point (시전자 포커싱: 0.52 다이내믹 심도로 전방 시야 확보)
  const isAttackerPlayer = !isTargetPlayer;
  const attackerFocal: CameraFocalPoint = {
    x: Math.round(neutralX + (attackerPos.x - neutralX) * 0.52),
    y: Math.round(neutralY + (attackerPos.y - neutralY) * 0.52),
  };

  // 2. Defender Focal Point (상대방 피격 포커싱: 0.52 다이내믹 심도)
  const defenderFocal: CameraFocalPoint = {
    x: Math.round(neutralX + (defenderPos.x - neutralX) * 0.52),
    y: Math.round(neutralY + (defenderPos.y - neutralY) * 0.52),
  };

  // First, find the first impact/hit frame index
  let firstHitIndex = -1;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.hitFlash || (f.beamT !== undefined && f.beamT >= 1.0) || (f.streamHead !== undefined && f.streamHead >= 1.0) || (f.moveStep !== undefined && f.moveStep >= 4)) {
      firstHitIndex = i;
      break;
    }
  }
  if (firstHitIndex === -1) {
    firstHitIndex = Math.max(1, Math.floor(frames.length * 0.4));
  }

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.isBlur || f.delay >= 10000 || f.isHighSkyCutscene) continue;

    f._gen5Camera = true;
    f.cameraZoom = targetZoom;

    let panT = 0;
    if (f.beamT !== undefined) {
      if (f.beamT < 1.0) {
        // beamT 기반 정밀 보간 (0.20에서 시작하여 0.95에서 도달)
        panT = Math.max(0, Math.min(1.0, (f.beamT - 0.20) / 0.75));
      } else {
        panT = 1.0;
      }
    } else if (f.streamHead !== undefined) {
      panT = Math.max(0, Math.min(1.0, (f.streamHead - 0.20) / 0.80));
    } else if (i < firstHitIndex) {
      panT = Math.max(0, Math.min(1.0, i / firstHitIndex));
    } else {
      panT = 1.0;
    }

    // Smooth ease-in-out cubic interpolation
    const easedPanT = panT < 0.5
      ? 2 * panT * panT
      : 1 - Math.pow(-2 * panT + 2, 2) / 2;

    f.cameraFocal = {
      x: Math.round(attackerFocal.x + (defenderFocal.x - attackerFocal.x) * easedPanT),
      y: Math.round(attackerFocal.y + (defenderFocal.y - attackerFocal.y) * easedPanT),
    };
  }

  // Glide-in to CASTER at start (시전 포켓몬으로 부드럽게 줌인 진입!)
  const glide1: BattleFrame = {
    ...base,
    delay: 50,
    pOffset: { x: 0, y: 0 },
    eOffset: { x: 0, y: 0 },
    showEffect: false,
    hitFlash: false,
    statProgress: undefined,
    cameraZoom: 1.0 + (targetZoom - 1.0) * 0.45,
    cameraFocal: {
      x: Math.round(neutralX + (attackerFocal.x - neutralX) * 0.45),
      y: Math.round(neutralY + (attackerFocal.y - neutralY) * 0.45),
    },
    _gen5Camera: true,
    phaseId: "1-camera-zoom",
    phaseName: "1. 카메라 이동 (시전자 진입)",
  };

  const glide2: BattleFrame = {
    ...base,
    delay: 50,
    pOffset: { x: 0, y: 0 },
    eOffset: { x: 0, y: 0 },
    showEffect: false,
    hitFlash: false,
    statProgress: undefined,
    cameraZoom: targetZoom,
    cameraFocal: attackerFocal,
    _gen5Camera: true,
    phaseId: "1-camera-zoom",
    phaseName: "1. 카메라 이동 (시전자 안착)",
  };

  frames.unshift(glide1, glide2);

  // Camera Return (Glide-Out) from DEFENDER to neutral arena
  const lastFrame = frames[frames.length - 1];
  if (hasNextTarget) {
    frames.push(...createSmoothCameraReturnFrames(lastFrame, targetZoom, defenderFocal, neutralX, neutralY, 3, 40));
  } else {
    frames.push(...createSmoothCameraReturnFrames(lastFrame, targetZoom, defenderFocal, neutralX, neutralY, 7, 50));
  }

  // Post-Camera Frames (e.g. recoil damage blink & HP drain)
  if (postCameraFrames.length > 0) {
    for (const pf of postCameraFrames) {
      pf.cameraZoom = 1.0;
      pf.cameraFocal = null;
      pf._gen5Camera = false;
    }
    frames.push(...postCameraFrames);
  }
};

/**
 * 5. Wide Neutral Arena Handler
 */
export const wideCameraHandler: CameraHandler = (frames) => {
  for (const f of frames) {
    f.cameraZoom = 1.0;
    f.cameraFocal = null;
    f._gen5Camera = false;
    if (!f.phaseId) f.phaseId = "neutral";
    if (!f.phaseName) f.phaseName = "중립 전장";
  }
};

export const CAMERA_HANDLERS: Record<CameraType, CameraHandler> = {
  target: targetCameraHandler,
  self: selfCameraHandler,
  sky: skyCameraHandler,
  rush: rushCameraHandler,
  beam: beamCameraHandler,
  none: wideCameraHandler,
};

export function applyMoveCameraToFrames(
  frames: BattleFrame[],
  moveAnim: BattleMoveAnimation | undefined,
  isPlayerAttacking: boolean,
  em: CameraFocalPoint,
  pm: CameraFocalPoint,
  hasNextTarget: boolean = false
): void {
  const cfg: MoveCameraConfig = moveAnim?.camera || { type: "target", zoom: 1.35 };
  const handler = CAMERA_HANDLERS[cfg.type] || targetCameraHandler;
  const attackerPos = isPlayerAttacking ? pm : em;
  const defenderPos = isPlayerAttacking ? em : pm;
  const isTargetPlayer = cfg.type === "self" ? isPlayerAttacking : !isPlayerAttacking;

  handler(frames, attackerPos, defenderPos, cfg, isTargetPlayer, hasNextTarget);
}
