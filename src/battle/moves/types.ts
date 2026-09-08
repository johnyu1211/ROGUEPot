/**
 * Battle Move Animation Types
 */

import { TurnActionInfo } from "../../services/battleService.js";

export type CameraType = 
  | "target"   // [Default] Focuses on the defending Pokémon where the effect occurs
  | "self"     // Focuses on caster (self-buffs like Swords Dance, Growl)
  | "sky"      // [Special] High-sky cloud cutscene (Fly, Sky Drop)
  | "rush"     // Focuses on caster during windup, then whips to target on impact
  | "beam"     // Focuses on caster at launch, smoothly glides to target along beam trajectory
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
  hideHud?: boolean;
  hideDialogue?: boolean;
  hideUI?: boolean;
  showEffect?: boolean;
  hitFlash?: boolean;
  moveStep?: number; // Phase: 1 = Windup, 2 = Impact/Strike, 3 = Reaction/Afterglow, 4 = Recovery
  enemyHp?: number;
  playerHp?: number;
  textLineIdx?: number;
  isBlur?: boolean;
  isHighSkyCutscene?: boolean;
  afterCameraReturn?: boolean;
  cameraTrackAttacker?: boolean;
  cameraZoom?: number;
  cameraFocal?: { x: number; y: number } | null;
  cameraPan?: { x: number; y: number };
  fullscreenVaporAlpha?: number;
  bgFilterAlpha?: number;
  leaderT?: number;
  tailT?: number;
  stormProg?: number;
  stormIntensity?: number;
  _gen5Camera?: boolean;
  drawEnemyOnTop?: boolean;
  drawPlayerAboveHud?: boolean;
  casterYellowAura?: boolean;
  pYellowAura?: boolean;
  eYellowAura?: boolean;
  targetPurpleLevel?: number;
  targetRedTint?: boolean;
  pRedTint?: boolean;
  eRedTint?: boolean;
  targetBlueTint?: boolean;
  pBlueTint?: boolean;
  eBlueTint?: boolean;
  phaseId?: string;
  phaseName?: string;
  statProgress?: any;
  moveEffect?: any;
  [key: string]: any;
}

export interface EffectDrawContext {
  targetPos: { x: number; y: number };
  attackerPos: { x: number; y: number };
  casterPos?: { x: number; y: number };
  isPlayer: boolean;
  isHit: boolean;
  width: number;
  height: number;
  em: { x: number; y: number; size: number };
  pm: { x: number; y: number; size: number };
  [key: string]: any;
}

export interface BattleMoveAnimation {
  key: string;
  num?: number;
  nameKo?: string;
  nameEn?: string;
  type?: string;
  category?: "physical" | "special" | "status";
  camera?: MoveCameraConfig;
  buildFrames: (ctx: MoveContext) => BattleFrame[];
  drawEffect?: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => void;
  drawBehindEffect?: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => void;
}
