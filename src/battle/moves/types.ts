/**
 * Battle Move Animation Types
 */

import { TurnActionInfo } from "../../services/battleService.js";

export type CameraType = 
  | "target"   // [Default] Focuses on the defending Pokémon where the effect occurs
  | "self"     // Focuses on caster (self-buffs like Swords Dance, Growl)
  | "sky"      // [Special] High-sky cloud cutscene (Fly, Sky Drop)
  | "sky_pan_down" // [Special] High-sky focus then pans down vertically to target (Thunder)
  | "rush"     // Focuses on caster during windup, then whips to target on impact
  | "beam"     // Focuses on caster at launch, smoothly glides to target along beam trajectory
  | "none"     // Wide neutral arena
  | "custom";  // Custom move-managed camera (frames retain their own cameraZoom and cameraFocal)

export interface MoveCameraConfig {
  type: CameraType;
  zoom?: number; // Default: 1.35
  focalRatio?: number; // Custom target focal ratio (0.0 = neutral, 1.0 = exact dead center on target)
  customFocal?: (ctx: MoveContext) => { x: number; y: number };
  glideInSpeed?: "fast" | "normal" | "slow";
  glideInFrames?: number;
  glideInDelay?: number;
  inlineGlideInFrames?: number;
  delayUntilStep?: number; // 지정 moveStep 이전에는 zoom: 1.0 (포커싱 X), 해당 step부터 타겟 포커싱
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
  pClipBottomY?: number;
  eClipBottomY?: number;
  usePlayerFront?: boolean;
  useEnemyBack?: boolean;
  hideHud?: boolean;
  hideDialogue?: boolean;
  hideUI?: boolean;
  platformAlpha?: number;
  hidePlatform?: boolean;
  pPlatOffset?: { x: number; y: number };
  ePlatOffset?: { x: number; y: number };
  pPlatScale?: number;
  ePlatScale?: number;
  skyDarkness?: number;
  showEffect?: boolean;
  showBehindEffect?: boolean;
  hitFlash?: boolean;
  moveStep?: number; // Phase: 1 = Windup, 2 = Impact/Strike, 3 = Reaction/Afterglow, 4 = Recovery
  effectProgress?: number; // 0.0 ~ 1.0 progress within a step or camera return fadeout
  fadeEffectOnCameraReturn?: boolean; // When true, effect continues fading out across camera return frames
  enemyHp?: number;
  playerHp?: number;
  enemyStatus?: string | null;
  playerStatus?: string | null;
  textLineIdx?: number;
  isBlur?: boolean;
  cameraBlur?: number | boolean;
  isHighSkyCutscene?: boolean;
  afterCameraReturn?: boolean;
  cameraTrackAttacker?: boolean;
  cameraZoom?: number;
  cameraFocal?: { x: number; y: number } | null;
  cameraPan?: { x: number; y: number };
  cameraRoll?: number;
  bgOffsetX?: number;
  skyPanProgress?: number;
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
  targetYellowAura?: boolean;
  targetWhiteAura?: boolean;
  targetWhiteOpacity?: number;
  targetWhiteBorderAlpha?: number;
  pWhiteAura?: boolean;
  eWhiteAura?: boolean;
  targetPurpleLevel?: number;
  targetRedTint?: boolean;
  pRedTint?: boolean;
  eRedTint?: boolean;
  pWhiteTint?: boolean;
  eWhiteTint?: boolean;
  pWhite?: boolean;
  eWhite?: boolean;
  casterWhite?: boolean;
  whiteTintRadius?: number;
  targetBlueTint?: boolean;
  pBlueTint?: boolean;
  eBlueTint?: boolean;
  pGreyTint?: boolean;
  eGreyTint?: boolean;
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
  drawMiddleEffect?: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => void;
  /**
   * true인 경우, battleGifRenderer가 statProgress 기반 기본 랭크업/드롭 파티클을
   * 그리지 않는다. (기술이 drawEffect에서 자체적으로 스탯 변화 연출을 그리는 경우 사용)
   * ⚠️ 배틀 로직(statProgress 값/흐름)에는 전혀 영향 없음 — 순수 렌더링 분기 플래그.
   */
  customStatParticles?: boolean;
}
