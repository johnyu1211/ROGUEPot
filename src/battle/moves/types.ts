/**
 * Battle Move Animation Types
 */

import { TurnActionInfo } from "../../services/battleService.js";

export type CameraType = 
  | "target"   // [Default] Focuses on the defending Pokémon where the effect occurs
  | "self"     // Focuses on caster (self-buffs like Swords Dance, Growl)
  | "sky"      // [Special] High-sky cloud cutscene (Fly, Sky Drop)
  | "none";    // Wide neutral arena

export interface MoveCameraConfig {
  type: CameraType;
  zoom?: number; // Default: 1.35
  customFocal?: (ctx: MoveContext) => { x: number; y: number };
}

export interface MoveContext {
  action: TurnActionInfo;
  isPlayer: boolean;
  isHit: boolean;
  isMiss: boolean;
  enemyHp: number;
  playerHp: number;
  textLineIdx: number;
  usePlayerFront?: boolean;
  useEnemyBack?: boolean;
}

export interface BattleFrame {
  delay: number;
  pOffset?: { x: number; y: number };
  eOffset?: { x: number; y: number };
  pScale?: { x: number; y: number };
  eScale?: { x: number; y: number };
  pRot?: number;
  eRot?: number;
  pAlpha?: number;
  eAlpha?: number;
  targetAlpha?: number;
  hidePlayer?: boolean;
  hideEnemy?: boolean;
  hidePShadow?: boolean;
  hideEShadow?: boolean;
  usePlayerFront?: boolean;
  useEnemyBack?: boolean;
  showEffect?: boolean;
  hitFlash?: boolean;
  moveStep?: number; // Phase: 1 = Windup, 2 = Impact/Strike, 3 = Reaction/Afterglow, 4 = Recovery
  enemyHp?: number;
  playerHp?: number;
  textLineIdx?: number;
  isBlur?: boolean;
  isHighSkyCutscene?: boolean;
  cameraTrackAttacker?: boolean;
  cameraZoom?: number;
  cameraFocal?: { x: number; y: number } | null;
  _gen5Camera?: boolean;
  drawEnemyOnTop?: boolean;
  moveEffect?: any;
  [key: string]: any;
}

export interface BattleMoveAnimation {
  key: string;
  camera?: MoveCameraConfig;
  buildFrames: (ctx: MoveContext) => BattleFrame[];
  drawEffect?: (ctx: any, frame: BattleFrame, drawCtx: any) => void;
}
