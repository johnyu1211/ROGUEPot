/**
 * Battle Camera Director Module
 * 
 * Manages 5th Generation (Black/White) style cinematic camera tracking for battle animations.
 * Ensures the fundamental principle:
 * 1. Camera Shift First (카메라 선행 이동) -> Pans & zooms towards target defender
 * 2. Attack Execution under Locked Camera (카메라 고정 상태에서 공격 적용) -> Zero camera motion during hits/effects/flickers
 * 3. Camera Return (공격 종료 후 복귀) -> Smooth glide back to neutral arena
 */

export interface CameraFocalPoint {
  x: number;
  y: number;
}

export interface CameraViewportConfig {
  width: number;
  height: number;
  maxZoom?: number;
  focalDepthFull?: number;
  focalDepthHalf?: number;
}

const DEFAULT_CONFIG: CameraViewportConfig = {
  width: 560,
  height: 380,
  maxZoom: 1.35,
  focalDepthFull: 0.48,
  focalDepthHalf: 0.24,
};

/**
 * Calculates camera bounds and clamps the focal point to prevent any arena edge bleeding.
 */
export function clampCameraFocal(
  focal: CameraFocalPoint,
  zoom: number,
  width: number = 560,
  height: number = 380
): CameraFocalPoint {
  if (zoom <= 1.0) {
    return { x: width / 2, y: height / 2 };
  }
  const halfW = width / (2 * zoom);
  const halfH = height / (2 * zoom);
  const minX = halfW;
  const maxX = width - halfW;
  const minY = halfH;
  const maxY = height - halfH;

  return {
    x: Math.max(minX, Math.min(maxX, focal.x)),
    y: Math.max(minY, Math.min(maxY, focal.y)),
  };
}

/**
 * Directs battle camera across animation frames:
 * - Automatically detects action segments
 * - Guarantees lead-in frames so the camera is already stationed at the defender before attack strikes
 * - Keeps camera 100% locked during all strikes, bursts, and effectiveness blinks
 * - Glides back to neutral arena at the end of the action
 */
export function directBattleCamera(
  frames: any[],
  isPlayerDefault: boolean,
  em: CameraFocalPoint,
  pm: CameraFocalPoint,
  config: Partial<CameraViewportConfig> = {}
): void {
  if (!frames || frames.length === 0) return;

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const cx = cfg.width / 2;
  const cy = cfg.height / 2;
  const maxZoom = cfg.maxZoom!;

  // 1. Identify continuous action segments (excluding loading blurs & hold frames)
  const actionSegments: Array<{
    start: number;
    end: number;
    strike: number;
    defender: CameraFocalPoint;
  }> = [];

  let currentSegment: {
    start: number;
    end: number;
    strike: number;
    defender: CameraFocalPoint;
  } | null = null;

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.isBlur || f.delay >= 10000 || f.isHighSkyCutscene || f.cameraTrackAttacker) {
      if (currentSegment) {
        actionSegments.push(currentSegment);
        currentSegment = null;
      }
      continue;
    }

    const isAttackerP = f.moveEffect
      ? (f.moveEffect.actor ? f.moveEffect.actor === 'player' : (f.moveEffect.isPlayerAttacking !== false))
      : (f.isAttackerPlayer !== undefined ? f.isAttackerPlayer : isPlayerDefault);
    const defender = isAttackerP ? em : pm;

    const isActionFrame = Boolean(
      f.hitFlash ||
      f.showEffect ||
      f.moveStep ||
      (f.targetAlpha !== undefined) ||
      (f.pOffset && (f.pOffset.x !== 0 || f.pOffset.y !== 0)) ||
      (f.eOffset && (f.eOffset.x !== 0 || f.eOffset.y !== 0))
    );

    if (isActionFrame) {
      if (!currentSegment) {
        currentSegment = { start: i, end: i, strike: i, defender };
      } else {
        currentSegment.end = i;
      }
      if (f.hitFlash || f.showEffect) {
        if (currentSegment.strike === currentSegment.start) {
          currentSegment.strike = i;
        }
      }
    } else {
      if (currentSegment) {
        actionSegments.push(currentSegment);
        currentSegment = null;
      }
    }
  }
  if (currentSegment) {
    actionSegments.push(currentSegment);
  }

  // Reset any default camera settings
  for (let i = 0; i < frames.length; i++) {
    if (!frames[i].isHighSkyCutscene && !frames[i].cameraTrackAttacker && (!frames[i].cameraZoom || frames[i]._gen5Camera)) {
      frames[i].cameraZoom = 1.0;
      frames[i].cameraFocal = null;
    }
  }

  // Process segments in reverse order so frame insertions do not offset indices of earlier segments
  for (let s = actionSegments.length - 1; s >= 0; s--) {
    const seg = actionSegments[s];
    const defender = seg.defender;

    const focalFull = {
      x: cx + (defender.x - cx) * cfg.focalDepthFull!,
      y: cy + (defender.y - cy) * cfg.focalDepthFull!,
    };
    const focalHalf = {
      x: cx + (defender.x - cx) * cfg.focalDepthHalf!,
      y: cy + (defender.y - cy) * cfg.focalDepthHalf!,
    };

    // Find the first hit impact / effect frame
    let strikeIdx = -1;
    for (let i = seg.start; i <= seg.end; i++) {
      if (frames[i].hitFlash || frames[i].showEffect) {
        strikeIdx = i;
        break;
      }
    }
    if (strikeIdx === -1) strikeIdx = seg.start;

    // 1단계: 카메라 선행 이동 (Camera Shift First)
    const leadInCount = strikeIdx - seg.start;
    if (leadInCount === 0) {
      const baseFrame = frames[strikeIdx];
      const lead1 = {
        ...baseFrame,
        delay: 110,
        showEffect: false,
        hitFlash: false,
        cameraZoom: 1.18,
        cameraFocal: focalHalf,
        _gen5Camera: true,
      };
      const lead2 = {
        ...baseFrame,
        delay: 110,
        showEffect: false,
        hitFlash: false,
        cameraZoom: maxZoom,
        cameraFocal: focalFull,
        _gen5Camera: true,
      };
      frames.splice(strikeIdx, 0, lead1, lead2);
      seg.end += 2;
      strikeIdx += 2;
    } else if (leadInCount === 1) {
      frames[seg.start].cameraZoom = 1.18;
      frames[seg.start].cameraFocal = focalHalf;
      frames[seg.start]._gen5Camera = true;
      frames[seg.start].showEffect = false;
      frames[seg.start].hitFlash = false;

      const baseFrame = frames[strikeIdx];
      const lead2 = {
        ...baseFrame,
        delay: 110,
        showEffect: false,
        hitFlash: false,
        cameraZoom: maxZoom,
        cameraFocal: focalFull,
        _gen5Camera: true,
      };
      frames.splice(strikeIdx, 0, lead2);
      seg.end += 1;
      strikeIdx += 1;
    } else {
      frames[seg.start].cameraZoom = 1.18;
      frames[seg.start].cameraFocal = focalHalf;
      frames[seg.start]._gen5Camera = true;
      for (let i = seg.start + 1; i < strikeIdx; i++) {
        frames[i].cameraZoom = maxZoom;
        frames[i].cameraFocal = focalFull;
        frames[i]._gen5Camera = true;
      }
    }

    // 2단계: 카메라 고정 후 공격 적용 (Attack Application under Locked Camera)
    for (let i = strikeIdx; i <= seg.end; i++) {
      frames[i].cameraZoom = maxZoom;
      frames[i].cameraFocal = focalFull;
      frames[i]._gen5Camera = true;
    }

    // 3단계: 공격 종료 후 복귀 (Camera Return)
    if (seg.end < frames.length - 1) {
      frames[seg.end].cameraZoom = 1.18;
      frames[seg.end].cameraFocal = focalHalf;
    }
  }
}
