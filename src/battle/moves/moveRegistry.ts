/**
 * Battle Move Animation Central Registry
 *
 * ⚠️ [개발/작업 지침 - AI 필독]
 * 1. 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
 *    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하여 턴 시간을 낭비하지 말 것!
 *    코드 수정 -> 빌드 -> 뷰어 캐시 갱신 확인 후 즉시 유저에게 보고할 것.
 * 2. [256색 팔레트 최적화(Octree Optimizer) 기준 제작 지침]:
 *    - 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 85) 기반의 256색 팔레트 재사용 표준을 사용함.
 *    - 신규 기술 구현 시 과도한 반투명 그라디언트 난사를 지양하고, 256색 환경에서 선명하게 돋보이는 고채도 단색/네온 색상 체계와 30 FPS 규격 준수.
 *    - 발사 -> 타격 -> 폭발 등 주요 연출 전환 시 phaseId 또는 moveStep을 명확히 지정하여 팔레트 자동 리셋(isVisualStateShift)이 완벽히 동작하도록 구성할 것.
 *
 * Central index that imports individual modular move definitions from `definitions/`.
 * Each move is completely self-contained with its camera rules, frames, and drawEffect.
 */

import { BattleMoveAnimation } from "./types.js";
import { poundMove } from "./definitions/001_pound.js";
import { karateChopMove } from "./definitions/002_karate_chop.js";
import { doubleSlapMove } from "./definitions/003_double_slap.js";
import { cometPunchMove } from "./definitions/004_comet_punch.js";
import { megaPunchMove } from "./definitions/005_mega_punch.js";
import { payDayMove } from "./definitions/006_pay_day.js";
import { firePunchMove } from "./definitions/007_fire_punch.js";
import { icePunchMove } from "./definitions/008_ice_punch.js";
import { thunderPunchMove } from "./definitions/009_thunder_punch.js";
import { scratchMove } from "./definitions/010_scratch.js";
import { viceGripMove } from "./definitions/011_vice_grip.js";
import { guillotineMove } from "./definitions/012_guillotine.js";
import { razorWindMove } from "./definitions/013_razor_wind.js";
import { swordsDanceMove } from "./definitions/014_swords_dance.js";
import { cutMove } from "./definitions/015_cut.js";
import { gustMove } from "./definitions/016_gust.js";
import { wingAttackMove } from "./definitions/017_wing_attack.js";
import { whirlwindMove } from "./definitions/018_whirlwind.js";
import { flyMove } from "./definitions/019_fly.js";
import { bindMove } from "./definitions/020_bind.js";
import { slamMove } from "./definitions/021_slam.js";
import { vineWhipMove } from "./definitions/022_vine_whip.js";
import { stompMove } from "./definitions/023_stomp.js";
import { doubleKickMove } from "./definitions/024_double_kick.js";
import { megaKickMove } from "./definitions/025_mega_kick.js";
import { jumpKickMove } from "./definitions/026_jump_kick.js";
import { rollingKickMove } from "./definitions/027_rolling_kick.js";
import { sandAttackMove } from "./definitions/028_sand_attack.js";
import { headbuttMove } from "./definitions/029_headbutt.js";
import { hornAttackMove } from "./definitions/030_horn_attack.js";
import { furyAttackMove } from "./definitions/031_fury_attack.js";
import { hornDrillMove } from "./definitions/032_horn_drill.js";
import { tackleMove } from "./definitions/033_tackle.js";
import { bodySlamMove } from "./definitions/034_body_slam.js";
import { wrapMove } from "./definitions/035_wrap.js";
import { takeDownMove } from "./definitions/036_take_down.js";
import { thrashMove } from "./definitions/037_thrash.js";
import { doubleEdgeMove } from "./definitions/038_double_edge.js";
import { tailWhipMove } from "./definitions/039_tail_whip.js";
import { poisonStingMove } from "./definitions/040_poison_sting.js";
import { twineedleMove } from "./definitions/041_twineedle.js";
import { pinMissileMove } from "./definitions/042_pin_missile.js";
import { leerMove } from "./definitions/043_leer.js";
import { biteMove } from "./definitions/044_bite.js";
import { growlMove } from "./definitions/045_growl.js";
import { roarMove } from "./definitions/046_roar.js";
import { singMove } from "./definitions/047_sing.js";
import { supersonicMove } from "./definitions/048_supersonic.js";
import { sonicBoomMove } from "./definitions/049_sonic_boom.js";
import { disableMove } from "./definitions/050_disable.js";
import { acidMove } from "./definitions/051_acid.js";
import { emberMove } from "./definitions/052_ember.js";
import { flamethrowerMove } from "./definitions/053_flamethrower.js";
import { mistMove } from "./definitions/054_mist.js";
import { waterGunMove } from "./definitions/055_water_gun.js";
import { hydroPumpMove } from "./definitions/056_hydro_pump.js";
import { surfMove } from "./definitions/057_surf.js";
import { iceBeamMove } from "./definitions/058_ice_beam.js";
import { blizzardMove } from "./definitions/059_blizzard.js";
import { psybeamMove } from "./definitions/060_psybeam.js";
import { bubbleBeamMove } from "./definitions/061_bubble_beam.js";
import { auroraBeamMove } from "./definitions/062_aurora_beam.js";
import { statusMove } from "./definitions/status.js";
import { defaultMove } from "./definitions/default.js";
import { hugMove } from "./definitions/hug.js";

export const MOVE_REGISTRY: Record<string, BattleMoveAnimation> = {
  "body-slam": bodySlamMove,
  "bodyslam": bodySlamMove,
  "pound": poundMove,
  "karate-chop": karateChopMove,
  "karatechop": karateChopMove,
  "double-slap": doubleSlapMove,
  "doubleslap": doubleSlapMove,
  "comet-punch": cometPunchMove,
  "cometpunch": cometPunchMove,
  "mega-punch": megaPunchMove,
  "megapunch": megaPunchMove,
  "pay-day": payDayMove,
  "payday": payDayMove,
  "fire-punch": firePunchMove,
  "firepunch": firePunchMove,
  "ice-punch": icePunchMove,
  "icepunch": icePunchMove,
  "thunder-punch": thunderPunchMove,
  "thunderpunch": thunderPunchMove,
  "scratch": scratchMove,
  "vice-grip": viceGripMove,
  "vicegrip": viceGripMove,
  "guillotine": guillotineMove,
  "razor-wind": razorWindMove,
  "razorwind": razorWindMove,
  "swords-dance": swordsDanceMove,
  "swordsdance": swordsDanceMove,
  "cut": cutMove,
  "gust": gustMove,
  "wing-attack": wingAttackMove,
  "wingattack": wingAttackMove,
  "whirlwind": whirlwindMove,
  "fly": flyMove,
  "bind": bindMove,
  "wrap": wrapMove,
  "clamp": bindMove,
  "sand-tomb": bindMove,
  "whirlpool": bindMove,
  "fire-spin": bindMove,
  "infestation": bindMove,
  "snap-trap": bindMove,
  "slam": slamMove,
  "vine-whip": vineWhipMove,
  "vinewhip": vineWhipMove,
  "stomp": stompMove,
  "double-kick": doubleKickMove,
  "doublekick": doubleKickMove,
  "mega-kick": megaKickMove,
  "megakick": megaKickMove,
  "jump-kick": jumpKickMove,
  "jumpkick": jumpKickMove,
  "rolling-kick": rollingKickMove,
  "rollingkick": rollingKickMove,
  "sand-attack": sandAttackMove,
  "sandattack": sandAttackMove,
  "headbutt": headbuttMove,
  "horn-attack": hornAttackMove,
  "hornattack": hornAttackMove,
  "fury-attack": furyAttackMove,
  "furyattack": furyAttackMove,
  "horn-drill": hornDrillMove,
  "horndrill": hornDrillMove,
  "tackle": tackleMove,
  "take-down": takeDownMove,
  "takedown": takeDownMove,
  "thrash": thrashMove,
  "double-edge": doubleEdgeMove,
  "doubleedge": doubleEdgeMove,
  "tail-whip": tailWhipMove,
  "tailwhip": tailWhipMove,
  "poison-sting": poisonStingMove,
  "poisonsting": poisonStingMove,
  "twineedle": twineedleMove,
  "twi-needle": twineedleMove,
  "pin-missile": pinMissileMove,
  "pinmissile": pinMissileMove,
  "needle-missile": pinMissileMove,
  "leer": leerMove,
  "bite": biteMove,
  "growl": growlMove,
  "roar": roarMove,
  "sing": singMove,
  "supersonic": supersonicMove,
  "sonic-boom": sonicBoomMove,
  "sonicboom": sonicBoomMove,
  "disable": disableMove,
  "acid": acidMove,
  "ember": emberMove,
  "flamethrower": flamethrowerMove,
  "mist": mistMove,
  "water-gun": waterGunMove,
  "watergun": waterGunMove,
  "hydro-pump": hydroPumpMove,
  "hydropump": hydroPumpMove,
  "surf": surfMove,
  "057": surfMove,
  "파도타기": surfMove,
  "ice-beam": iceBeamMove,
  "icebeam": iceBeamMove,
  "058": iceBeamMove,
  "냉동빔": iceBeamMove,
  "blizzard": blizzardMove,
  "059": blizzardMove,
  "눈보라": blizzardMove,
  "psybeam": psybeamMove,
  "060": psybeamMove,
  "환상빔": psybeamMove,
  "bubble-beam": bubbleBeamMove,
  "bubblebeam": bubbleBeamMove,
  "061": bubbleBeamMove,
  "거품광선": bubbleBeamMove,
  "aurora-beam": auroraBeamMove,
  "aurorabeam": auroraBeamMove,
  "062": auroraBeamMove,
  "오로라빔": auroraBeamMove,
  "status": statusMove,
  "default": defaultMove,
  "perk-hug": hugMove,
  "hug": hugMove,
};

import { getMoveData, MoveData } from "../../data/movesKo.js";
import { MoveContext, BattleFrame, EffectDrawContext } from "./types.js";
import {
  drawFireEffect,
  drawWaterEffect,
  drawElectricEffect,
  drawIceEffect,
  drawGrassEffect,
  drawPsychicEffect,
  drawPoisonEffect,
  drawRockGroundEffect,
  drawFlyingEffect,
  drawGhostDarkEffect,
  drawDragonEffect,
  drawSteelEffect,
  drawFairyEffect,
  drawPhysicalImpactEffect,
  drawSlashEffect,
  drawDrainEffect,
  drawSolarBeamEffect,
  drawHyperBeamEffect,
  drawShadowBallEffect,
  drawBiteEffect,
  drawNeedleBarrageEffect,
  drawSurfWaveEffect,
  drawEarthquakeFissureEffect,
  drawPunchImpactEffect,
  drawKickImpactEffect,
  drawLeerGlareEffect,
  drawSoundWaveEffect,
} from "../../renderers/moves/common/genericTypeEffects.js";
import {
  drawStatBoostEffect,
  drawStatDropEffect,
} from "../../renderers/moves/common/helpers.js";

/**
 * Intelligent Move Archetype Parser that analyzes the official move description,
 * Korean name, and English slug to determine the exact 5th Generation battle staging.
 */
function parseMoveArchetype(moveKey: string, moveData: MoveData) {
  const desc = (moveData.description || "").toLowerCase();
  const nameKo = (moveData.nameKo || "").toLowerCase();
  const nameEn = (moveData.name || "").toLowerCase();
  const cat = moveData.category || "physical";

  const isMultiHit = desc.includes("2회") || desc.includes("연속") || desc.includes("2-5회") || desc.includes("2~5회") || desc.includes("두 번") || desc.includes("여러 번") || nameKo.includes("연속") || nameKo.includes("두번");
  const isDrain = desc.includes("흡수") || desc.includes("빨아") || desc.includes("체력을 회복") || nameKo.includes("드레인") || nameKo.includes("흡수") || nameKo.includes("흡혈");
  const isBeam = (desc.includes("광선") || desc.includes("빔") || desc.includes("레이저") || desc.includes("포를") || desc.includes("파동") || nameKo.includes("빔") || nameKo.includes("광선") || nameKo.includes("캐논") || nameKo.includes("펄스") || nameKo.includes("파동") || nameEn.includes("beam") || nameEn.includes("cannon") || nameEn.includes("pulse")) && !nameKo.includes("물대포");
  const isSlash = desc.includes("벤다") || desc.includes("베어") || desc.includes("가른") || desc.includes("발톱") || desc.includes("손톱") || desc.includes("자른") || nameKo.includes("베기") || nameKo.includes("가르기") || nameKo.includes("클로") || nameKo.includes("슬래시") || nameKo.includes("커터") || nameKo.includes("시저") || nameEn.includes("slash") || nameEn.includes("claw") || nameEn.includes("blade") || nameEn.includes("cutter");
  const isBite = desc.includes("문다") || desc.includes("물어") || desc.includes("깨물") || desc.includes("이빨") || desc.includes("송곳니") || nameKo.includes("엄니") || nameKo.includes("물기") || nameKo.includes("바이트") || nameKo.includes("팽") || nameEn.includes("bite") || nameEn.includes("fang");
  const isPunch = desc.includes("주먹") || desc.includes("펀치") || nameKo.includes("펀치") || nameKo.includes("촙") || nameKo.includes("슬랩") || nameEn.includes("punch");
  const isKick = desc.includes("발로") || desc.includes("발차기") || desc.includes("킥") || desc.includes("짓밟") || nameKo.includes("킥") || nameKo.includes("짓밟기") || nameKo.includes("스톰프") || nameEn.includes("kick") || nameEn.includes("stomp");
  const isBall = desc.includes("구체") || desc.includes("구슬") || desc.includes("폭탄") || desc.includes("탄을") || nameKo.includes("볼") || nameKo.includes("봄") || nameKo.includes("블래스트") || nameKo.includes("스피어") || nameEn.includes("ball") || nameEn.includes("bomb") || nameEn.includes("sphere");
  const isNeedle = desc.includes("침") || desc.includes("바늘") || desc.includes("가시") || desc.includes("씨") || nameKo.includes("니들") || nameKo.includes("스팅") || nameKo.includes("가시") || nameEn.includes("needle") || nameEn.includes("sting") || nameEn.includes("pin");
  const isSurf = desc.includes("파도") || desc.includes("해일") || nameKo.includes("파도") || nameKo.includes("웨이브") || nameEn.includes("surf") || nameEn.includes("wave");
  const isQuake = desc.includes("지진") || desc.includes("대지") || desc.includes("땅을 흔들") || nameKo.includes("지진") || nameEn.includes("earthquake") || nameEn.includes("fissure");
  const isTackle = desc.includes("돌진") || desc.includes("부딪쳐") || desc.includes("몸통") || desc.includes("태클") || desc.includes("박치기") || desc.includes("뿔로") || nameKo.includes("태클") || nameKo.includes("돌진") || nameEn.includes("tackle") || nameEn.includes("rush");
  const isLeer = desc.includes("째려") || desc.includes("눈빛") || nameKo.includes("째려보기") || nameKo.includes("눈빛") || nameKo.includes("뱀눈초리") || nameEn.includes("leer") || nameEn.includes("glare");
  const isSound = desc.includes("소리") || desc.includes("울음") || desc.includes("음파") || desc.includes("노래") || desc.includes("외침") || nameKo.includes("소리") || nameKo.includes("울음") || nameKo.includes("보이스") || nameKo.includes("하이퍼보이스") || nameEn.includes("growl") || nameEn.includes("roar") || nameEn.includes("screech") || nameEn.includes("voice");

  const isDebuff = cat === "status" && (desc.includes("상대의") || desc.includes("상대를") || desc.includes("떨어뜨") || desc.includes("낮춘") || desc.includes("감소") || desc.includes("마비") || desc.includes("독") || desc.includes("잠듦") || desc.includes("혼란") || desc.includes("화상") || desc.includes("얼어"));
  const isBuff = cat === "status" && !isDebuff;

  return {
    isMultiHit,
    isDrain,
    isBeam,
    isSlash,
    isBite,
    isPunch,
    isKick,
    isBall,
    isNeedle,
    isSurf,
    isQuake,
    isTackle,
    isLeer,
    isSound,
    isDebuff,
    isBuff,
  };
}

/**
 * Creates authentic 5th Generation (Black/White) battle animations compliant with memoforme.txt rules
 * and tailored to each move's official description.
 */
function createDynamicMoveAnimation(moveKey: string, moveData: MoveData): BattleMoveAnimation {
  const type = moveData.type || "normal";
  const category = moveData.category || "physical";
  const arch = parseMoveArchetype(moveKey, moveData);

  // Determine Gen 5 Camera based on archetype
  let camera: any = { type: "target", zoom: 1.35 };
  if (arch.isBuff) {
    camera = { type: "self", zoom: 1.24 };
  } else if (arch.isDebuff || category === "status") {
    camera = { type: "none" };
  } else if (arch.isTackle || arch.isPunch || arch.isKick || arch.isMultiHit) {
    camera = { type: "rush", zoom: 1.38 };
  } else if (arch.isBeam) {
    camera = { type: "target", zoom: 1.34 };
  } else if (arch.isSurf || arch.isQuake) {
    camera = { type: "target", zoom: 1.26 };
  } else if (category === "special") {
    camera = { type: "target", zoom: 1.32 };
  } else {
    camera = { type: "rush", zoom: 1.36 };
  }

  return {
    key: moveKey,
    num: moveData.id,
    nameKo: moveData.nameKo,
    nameEn: moveData.name,
    type: moveData.type,
    category: moveData.category,
    camera,
    buildFrames: (ctx: MoveContext): BattleFrame[] => {
      const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

      // 1. BUFF (자신 능력치 상승 / 회복)
      if (arch.isBuff) {
        return [
          {
            delay: 100,
            pOffset: isP ? { x: 0, y: -6 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: -6 } : { x: 0, y: 0 },
            pScale: isP ? { x: 0.90, y: 1.12 } : undefined,
            eScale: !isP ? { x: 0.90, y: 1.12 } : undefined,
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            phaseId: "gen5-buff-inhale",
            phaseName: "1. 5세대 호흡 축적",
          },
          {
            delay: 120,
            pOffset: isP ? { x: 0, y: 4 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: 4 } : { x: 0, y: 0 },
            pScale: isP ? { x: 1.18, y: 0.84 } : undefined,
            eScale: !isP ? { x: 1.18, y: 0.84 } : undefined,
            showEffect: true,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 1,
            statProgress: 0.35,
            phaseId: "gen5-buff-pulse1",
            phaseName: "2. 1차 에너지 파동",
          },
          {
            delay: 160,
            pOffset: isP ? { x: 0, y: -8 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: -8 } : { x: 0, y: 0 },
            pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
            eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
            showEffect: true,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 2,
            statProgress: 0.75,
            phaseId: "gen5-buff-pulse2",
            phaseName: "3. 2차 오라 정점 방출",
          },
          {
            delay: 120,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            showEffect: true,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            statProgress: 1.0,
            phaseId: "gen5-buff-radiate",
            phaseName: "4. 전신 잔향 광채",
          },
          {
            delay: 80,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            phaseId: "gen5-buff-finish",
            phaseName: "5. 자세 복귀",
          },
        ];
      }

      // 2. DEBUFF / STATUS (상대 능력치 하락 / 상태이상)
      if (arch.isDebuff || category === "status") {
        return [
          {
            delay: 100,
            pScale: isP ? { x: 1.14, y: 0.88 } : undefined,
            eScale: !isP ? { x: 1.14, y: 0.88 } : undefined,
            pOffset: isP ? { x: 8, y: -2 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: -8, y: 2 } : { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            phaseId: "gen5-debuff-stare",
            phaseName: "1. 5세대 눈빛/기운 방출",
          },
          {
            delay: 120,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            showEffect: true,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            statProgress: 0.35,
            phaseId: "gen5-debuff-wave",
            phaseName: "2. 디버프 파동 접근",
          },
          {
            delay: 160,
            eOffset: isHit ? (isP ? { x: 0, y: 6 } : { x: 0, y: -6 }) : { x: 0, y: 0 },
            pOffset: { x: 0, y: 0 },
            showEffect: true,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            statProgress: 0.75,
            phaseId: "gen5-debuff-inflict",
            phaseName: "3. 랭크 하락/상태이상 침투",
          },
          {
            delay: 120,
            eOffset: isHit ? (isP ? { x: 0, y: 2 } : { x: 0, y: -2 }) : { x: 0, y: 0 },
            pOffset: { x: 0, y: 0 },
            showEffect: true,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            statProgress: 1.0,
            phaseId: "gen5-debuff-radiate",
            phaseName: "4. 디버프 잔향",
          },
          {
            delay: 80,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            phaseId: "gen5-debuff-finish",
            phaseName: "5. 자세 정돈",
          },
        ];
      }

      // 3. MULTI-HIT MOVES (2회 연속, 2-5회 등)
      if (arch.isMultiHit) {
        return [
          {
            delay: 90,
            pOffset: isP ? { x: 22, y: -8 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: -22, y: 8 } : { x: 0, y: 0 },
            pScale: isP ? { x: 0.90, y: 1.15 } : undefined,
            eScale: !isP ? { x: 0.90, y: 1.15 } : undefined,
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 1,
            phaseId: "gen5-multi-dash",
            phaseName: "1. 5세대 전방 가속 대시",
          },
          {
            delay: 120,
            pOffset: isP ? { x: 38, y: -14 } : (isHit ? { x: -10, y: 4 } : { x: 0, y: 0 }),
            eOffset: !isP ? { x: -38, y: 14 } : (isHit ? { x: 12, y: -5 } : { x: 0, y: 0 }),
            showEffect: isHit,
            hitFlash: isHit,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 1,
            phaseId: "gen5-multi-hit1",
            phaseName: "2. 1타 적중 & 1차 넉백",
          },
          {
            delay: 80,
            pOffset: isP ? { x: 16, y: -4 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: -16, y: 4 } : { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 2,
            phaseId: "gen5-multi-pivot",
            phaseName: "3. 2타 전환",
          },
          {
            delay: 150,
            pOffset: isP ? { x: 44, y: -16 } : (isHit ? { x: -14, y: 6 } : { x: 0, y: 0 }),
            eOffset: !isP ? { x: -44, y: 16 } : (isHit ? { x: 18, y: -7 } : { x: 0, y: 0 }),
            showEffect: isHit,
            hitFlash: isHit,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 2,
            phaseId: "gen5-multi-hit2",
            phaseName: "4. 2타 피니시 격돌 & 2차 넉백",
          },
          {
            delay: 100,
            pOffset: isP ? { x: 16, y: -5 } : { x: 0, y: 0 },
            eOffset: isHit ? (!isP ? { x: 6, y: -2 } : { x: -6, y: 2 }) : { x: 0, y: 0 },
            showEffect: isHit,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 3,
            phaseId: "gen5-multi-flinch",
            phaseName: "5. 피격자 진동 셰이크",
          },
          {
            delay: 80,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            phaseId: "gen5-multi-finish",
            phaseName: "6. 복귀 완료",
          },
        ];
      }

      // 4. BEAM / RAY / CANNON (광선 / 빔 / 레이저)
      if (arch.isBeam) {
        return [
          {
            delay: 110,
            pOffset: isP ? { x: -12, y: 5 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 12, y: -5 } : { x: 0, y: 0 },
            pScale: isP ? { x: 1.18, y: 0.82 } : undefined,
            eScale: !isP ? { x: 1.18, y: 0.82 } : undefined,
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 1,
            phaseId: "gen5-beam-gather",
            phaseName: "1. 5세대 초고에너지 응축",
          },
          {
            delay: 130,
            pOffset: isP ? { x: 18, y: -7 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: -18, y: 7 } : { x: 0, y: 0 },
            pScale: isP ? { x: 0.88, y: 1.16 } : undefined,
            eScale: !isP ? { x: 0.88, y: 1.16 } : undefined,
            showEffect: true,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 2,
            effectProgress: 0.60,
            phaseId: "gen5-beam-fire",
            phaseName: "2. 광선 빔 일제 발사",
          },
          {
            delay: 180,
            pOffset: { x: 0, y: 0 },
            eOffset: isHit ? (!isP ? { x: -18, y: 7 } : { x: 18, y: -7 }) : { x: 0, y: 0 },
            showEffect: isHit,
            hitFlash: isHit,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 3,
            effectProgress: 1.0,
            phaseId: "gen5-beam-impact",
            phaseName: "3. 관통 직격 대폭발 & 넉백",
          },
          {
            delay: 110,
            pOffset: { x: 0, y: 0 },
            eOffset: isHit ? (!isP ? { x: 8, y: -3 } : { x: -8, y: 3 }) : { x: 0, y: 0 },
            showEffect: isHit,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 3,
            effectProgress: 1.0,
            phaseId: "gen5-beam-aftershock",
            phaseName: "4. 빔 압박 진동 셰이크",
          },
          {
            delay: 80,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            phaseId: "gen5-beam-finish",
            phaseName: "5. 복귀 완료",
          },
        ];
      }

      // 5. PROJECTILE / NEEDLE / BALL (투사체 / 침 / 바늘 / 탄 / 구슬)
      if (arch.isNeedle || arch.isBall || (category === "special" && !arch.isSurf && !arch.isQuake)) {
        return [
          {
            delay: 100,
            pOffset: isP ? { x: -10, y: 4 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 10, y: -4 } : { x: 0, y: 0 },
            pScale: isP ? { x: 1.14, y: 0.86 } : undefined,
            eScale: !isP ? { x: 1.14, y: 0.86 } : undefined,
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 1,
            phaseId: "gen5-proj-aim",
            phaseName: "1. 5세대 투사체 조준/장전",
          },
          {
            delay: 90,
            pOffset: isP ? { x: 20, y: -8 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: -20, y: 8 } : { x: 0, y: 0 },
            pScale: isP ? { x: 0.90, y: 1.12 } : undefined,
            eScale: !isP ? { x: 0.90, y: 1.12 } : undefined,
            showEffect: true,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 2,
            effectProgress: 0.35,
            phaseId: "gen5-proj-fly1",
            phaseName: "2. 투사체 고속 사출 (초기)",
          },
          {
            delay: 90,
            pOffset: isP ? { x: 8, y: -3 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: -8, y: 3 } : { x: 0, y: 0 },
            showEffect: true,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 2,
            effectProgress: 0.75,
            phaseId: "gen5-proj-fly2",
            phaseName: "3. 상대방 앞 고속 쇄도",
          },
          {
            delay: 160,
            pOffset: { x: 0, y: 0 },
            eOffset: isHit ? (!isP ? { x: -16, y: 6 } : { x: 16, y: -6 }) : { x: 0, y: 0 },
            showEffect: isHit,
            hitFlash: isHit,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 3,
            effectProgress: 1.0,
            phaseId: "gen5-proj-impact",
            phaseName: "4. 착탄 관통 대폭발 & 넉백",
          },
          {
            delay: 110,
            pOffset: { x: 0, y: 0 },
            eOffset: isHit ? (!isP ? { x: 6, y: -2 } : { x: -6, y: 2 }) : { x: 0, y: 0 },
            showEffect: isHit,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 3,
            effectProgress: 1.0,
            phaseId: "gen5-proj-flinch",
            phaseName: "5. 피격 진동 & 파편 잔향",
          },
          {
            delay: 80,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            phaseId: "gen5-proj-finish",
            phaseName: "6. 복귀 완료",
          },
        ];
      }

      // 6. SURF / QUAKE (광역 환경 격변)
      if (arch.isSurf || arch.isQuake) {
        return [
          {
            delay: 110,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            pScale: isP ? { x: 1.20, y: 0.80 } : undefined,
            eScale: !isP ? { x: 1.20, y: 0.80 } : undefined,
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            phaseId: "gen5-env-charge",
            phaseName: "1. 5세대 전장 격변 각성",
          },
          {
            delay: 130,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            showEffect: true,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            effectProgress: 0.40,
            phaseId: "gen5-env-surge",
            phaseName: "2. 파도/지진 전장 쇄도",
          },
          {
            delay: 190,
            pOffset: { x: 0, y: 0 },
            eOffset: isHit ? (!isP ? { x: -16, y: 8 } : { x: 16, y: -8 }) : { x: 0, y: 0 },
            showEffect: isHit,
            hitFlash: isHit,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            effectProgress: 1.0,
            phaseId: "gen5-env-cataclysm",
            phaseName: "3. 전장 대격변 강타 & 넉백",
          },
          {
            delay: 110,
            pOffset: { x: 0, y: 0 },
            eOffset: isHit ? (!isP ? { x: 8, y: -4 } : { x: -8, y: 4 }) : { x: 0, y: 0 },
            showEffect: isHit,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            effectProgress: 1.0,
            phaseId: "gen5-env-aftershock",
            phaseName: "4. 전신 진동 셰이크",
          },
          {
            delay: 80,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            phaseId: "gen5-env-finish",
            phaseName: "5. 전장 정돈",
          },
        ];
      }

      // 7. SLASH / CLAW (참격 / 베기 / 발톱)
      if (arch.isSlash) {
        return [
          {
            delay: 90,
            pOffset: isP ? { x: -14, y: 5 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 14, y: -5 } : { x: 0, y: 0 },
            pScale: isP ? { x: 1.14, y: 0.86 } : undefined,
            eScale: !isP ? { x: 1.14, y: 0.86 } : undefined,
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 1,
            phaseId: "gen5-slash-draw",
            phaseName: "1. 5세대 발도/도약 준비",
          },
          {
            delay: 90,
            pOffset: isP ? { x: 28, y: -10 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: -28, y: 10 } : { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 1,
            phaseId: "gen5-slash-approach",
            phaseName: "2. 순간 돌파 접근",
          },
          {
            delay: 160,
            pOffset: isP ? { x: 38, y: -14 } : (isHit ? { x: -12, y: 5 } : { x: 0, y: 0 }),
            eOffset: !isP ? { x: -38, y: 14 } : (isHit ? { x: 16, y: -6 } : { x: 0, y: 0 }),
            showEffect: isHit,
            hitFlash: isHit,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 2,
            phaseId: "gen5-slash-strike",
            phaseName: "3. 속성 참격 작렬 & 넉백",
          },
          {
            delay: 110,
            pOffset: isP ? { x: 16, y: -5 } : { x: 0, y: 0 },
            eOffset: isHit ? (!isP ? { x: 8, y: -3 } : { x: -8, y: 3 }) : { x: 0, y: 0 },
            showEffect: isHit,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            moveStep: 3,
            phaseId: "gen5-slash-flinch",
            phaseName: "4. 피격자 진동 & 참격 잔향",
          },
          {
            delay: 80,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp,
            playerHp,
            textLineIdx,
            moveEffect: a,
            phaseId: "gen5-slash-finish",
            phaseName: "5. 복귀 완료",
          },
        ];
      }

      // 8. GENERAL MELEE PHYSICAL (돌진 / 태클 / 펀치 / 킥 / 물기 / 일반 물리)
      return [
        {
          delay: 100,
          pOffset: isP ? { x: -18, y: 7 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 18, y: -7 } : { x: 0, y: 0 },
          pScale: isP ? { x: 1.16, y: 0.84 } : undefined,
          eScale: !isP ? { x: 1.16, y: 0.84 } : undefined,
          showEffect: false,
          hitFlash: false,
          enemyHp,
          playerHp,
          textLineIdx,
          moveEffect: a,
          moveStep: 1,
          phaseId: "gen5-phys-crouch",
          phaseName: "1. 5세대 도움닫기 웅크림",
        },
        {
          delay: 90,
          pOffset: isP ? { x: 20, y: -9 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -20, y: 9 } : { x: 0, y: 0 },
          pScale: isP ? { x: 0.88, y: 1.18 } : undefined,
          eScale: !isP ? { x: 0.88, y: 1.18 } : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp,
          playerHp,
          textLineIdx,
          moveEffect: a,
          moveStep: 2,
          effectProgress: 0.35,
          phaseId: "gen5-phys-leap",
          phaseName: "2. 초고속 탄성 도약 & 이펙트 전개",
        },
        {
          delay: 160,
          pOffset: isP ? { x: 42, y: -16 } : (isHit ? { x: -14, y: 6 } : { x: 0, y: 0 }),
          eOffset: !isP ? { x: -42, y: 16 } : (isHit ? { x: 18, y: -7 } : { x: 0, y: 0 }),
          showEffect: isHit,
          hitFlash: isHit,
          enemyHp,
          playerHp,
          textLineIdx,
          moveEffect: a,
          moveStep: 3,
          effectProgress: 0.80,
          phaseId: "gen5-phys-impact",
          phaseName: "3. 5세대 격돌 타격 & 넉백",
        },
        {
          delay: 110,
          pOffset: isP ? { x: 20, y: -6 } : { x: 0, y: 0 },
          eOffset: isHit ? (!isP ? { x: 8, y: -3 } : { x: -8, y: 3 }) : { x: 0, y: 0 },
          showEffect: isHit,
          hitFlash: false,
          enemyHp,
          playerHp,
          textLineIdx,
          moveEffect: a,
          moveStep: 4,
          effectProgress: 1.0,
          phaseId: "gen5-phys-flinch1",
          phaseName: "4. 피격자 넉백 진동 & 이펙트 비산",
        },
        {
          delay: 80,
          pOffset: isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
          eOffset: isHit ? (!isP ? { x: -4, y: 2 } : { x: 4, y: -2 }) : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp,
          playerHp,
          textLineIdx,
          moveEffect: a,
          moveStep: 4,
          phaseId: "gen5-phys-flinch2",
          phaseName: "5. 피격자 진동 셰이크 2",
        },
        {
          delay: 80,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp,
          playerHp,
          textLineIdx,
          moveEffect: a,
          phaseId: "gen5-phys-finish",
          phaseName: "6. 착지 및 복귀 완료",
        },
      ];
    },
    drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
      if (!frame.showEffect) return;
      const { attackerPos, targetPos } = drawCtx;

      // Dynamic progress calculation (0.0 to 1.0)
      const progress = frame.effectProgress ?? (frame.statProgress ?? (frame.moveStep ? frame.moveStep / 4 : 0.8));

      // Status Moves
      if (arch.isBuff) {
        drawStatBoostEffect(targetCtx, attackerPos, progress);
        return;
      }
      if (arch.isLeer) {
        drawLeerGlareEffect(targetCtx, attackerPos, targetPos, progress);
        return;
      }
      if (arch.isSound) {
        drawSoundWaveEffect(targetCtx, attackerPos, targetPos, progress);
        return;
      }
      if (arch.isDebuff || category === "status") {
        drawStatDropEffect(targetCtx, targetPos, progress);
        return;
      }

      // Archetype Specific Visuals based on description keywords
      if (arch.isDrain) {
        drawDrainEffect(targetCtx, attackerPos, targetPos, type, progress);
        return;
      }

      if (arch.isBite) {
        drawBiteEffect(targetCtx, targetPos, type, progress);
        return;
      }

      if (arch.isPunch) {
        drawPunchImpactEffect(targetCtx, targetPos, type, progress);
        return;
      }

      if (arch.isKick) {
        drawKickImpactEffect(targetCtx, targetPos, type, progress);
        return;
      }

      if (arch.isSlash) {
        drawSlashEffect(targetCtx, targetPos, type, progress);
        return;
      }

      if (arch.isNeedle) {
        drawNeedleBarrageEffect(
          targetCtx,
          attackerPos,
          targetPos,
          progress,
          type === "poison" ? "#A855F7" : (type === "grass" ? "#4ADE80" : "#FACC15")
        );
        return;
      }

      if (arch.isSurf) {
        drawSurfWaveEffect(targetCtx, targetPos, progress);
        return;
      }

      if (arch.isQuake) {
        drawEarthquakeFissureEffect(targetCtx, targetPos, progress);
        return;
      }

      if (arch.isBeam) {
        const dx = targetPos.x - attackerPos.x;
        const dy = targetPos.y - attackerPos.y;
        const angle = Math.atan2(dy, dx);
        if (moveKey === "solar-beam" || type === "grass") {
          drawSolarBeamEffect(targetCtx, attackerPos, targetPos, angle, dx, dy, progress);
        } else {
          drawHyperBeamEffect(targetCtx, attackerPos, targetPos, angle, dx, dy, progress);
        }
        return;
      }

      if (arch.isBall) {
        const dx = targetPos.x - attackerPos.x;
        const dy = targetPos.y - attackerPos.y;
        const angle = Math.atan2(dy, dx);
        drawShadowBallEffect(targetCtx, attackerPos, targetPos, angle, progress);
        return;
      }

      // Elemental Type Effects
      switch (type) {
        case "fire":
          drawFireEffect(targetCtx, attackerPos, targetPos, category === "special", progress);
          break;
        case "water":
          drawWaterEffect(targetCtx, attackerPos, targetPos, category === "special", progress);
          break;
        case "electric":
          drawElectricEffect(targetCtx, attackerPos, targetPos, category === "special", progress);
          break;
        case "ice":
          drawIceEffect(targetCtx, attackerPos, targetPos, category === "special", progress);
          break;
        case "grass":
          drawGrassEffect(targetCtx, attackerPos, targetPos, progress);
          break;
        case "psychic":
          drawPsychicEffect(targetCtx, targetPos, progress);
          break;
        case "poison":
          drawPoisonEffect(targetCtx, attackerPos, targetPos, progress);
          break;
        case "ground":
        case "rock":
          drawRockGroundEffect(targetCtx, targetPos, progress);
          break;
        case "flying":
          drawFlyingEffect(targetCtx, targetPos, progress);
          break;
        case "ghost":
        case "dark":
          drawGhostDarkEffect(targetCtx, targetPos, progress);
          break;
        case "dragon":
          drawDragonEffect(targetCtx, attackerPos, targetPos, progress);
          break;
        case "steel":
          drawSteelEffect(targetCtx, targetPos, progress);
          break;
        case "fairy":
          drawFairyEffect(targetCtx, targetPos, progress);
          break;
        default:
          drawPhysicalImpactEffect(targetCtx, targetPos, progress);
          break;
      }
    },
  };
}

export function getMoveAnimation(moveKey: string, isStatus: boolean = false): BattleMoveAnimation {
  const key = (moveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
  if (MOVE_REGISTRY[key]) return MOVE_REGISTRY[key];

  const moveData = getMoveData(key);
  if (moveData) {
    const dynamicAnim = createDynamicMoveAnimation(key, moveData);
    MOVE_REGISTRY[key] = dynamicAnim;
    return dynamicAnim;
  }

  if (isStatus) return statusMove;
  return defaultMove;
}

