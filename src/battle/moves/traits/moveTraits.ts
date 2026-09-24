/**
 * Declarative Move Traits and Behaviors
 * Automatically mapped to moves without giant if-else chains.
 */

export interface MoveChargeTrait {
  semiInvulnerable?: "air" | "underground" | "underwater" | "shadow";
  instantUnderWeather?: "sun"; // e.g. Solar Beam in sun
  chargeStatBoost?: { stat: "def" | "spa"; stage: number }; // Skull Bash, Meteor Beam
  chargeTextKo: string;
  chargeTextEn: string;
}

export interface MoveTraitDefinition {
  drainRatio?: number; // e.g. 0.5 (Giga Drain), 0.75 (Oblivion Wing)
  recoilRatio?: number; // e.g. 0.33 (Take Down), 0.5 (Head Smash), 0.25 (Submission)
  critBonus?: boolean; // High critical hit ratio (Slash, Karate Chop, etc.)
  chargeTrait?: MoveChargeTrait;
  fixedMultiHit?: number; // e.g. 2 for Double Kick, 3 for Triple Dive
  randomMultiHit?: boolean; // 2~5 hits standard distribution
  populationBomb?: boolean; // Up to 10 hits at 90% accuracy
  isSelfDestruct?: boolean; // Explosion, Self-Destruct
  rechargeRequired?: boolean; // Hyper Beam, Giga Impact
  trapMove?: boolean; // Bind, Wrap, Fire Spin, Sand Tomb, Whirlpool (4~5 turns)
  priority?: number; // Move priority (-7 to +4)
}

export const MOVE_TRAITS_REGISTRY: Record<string, MoveTraitDefinition> = {
  // --- High Critical Ratio Moves ---
  "karate-chop": { critBonus: true },
  "razor-wind": {
    critBonus: true,
    chargeTrait: {
      chargeTextKo: "칼바람을 일으켰다!",
      chargeTextEn: "whipped up a whirlwind!",
    },
  },
  "slash": { critBonus: true },
  "razor-leaf": { critBonus: true },
  "crabhammer": { critBonus: true },
  "cross-poison": { critBonus: true },
  "shadow-claw": { critBonus: true },
  "night-slash": { critBonus: true },
  "stone-edge": { critBonus: true },
  "air-cutter": { critBonus: true },
  "psycho-cut": { critBonus: true },
  "drill-run": { critBonus: true },
  "blaze-kick": { critBonus: true },

  // --- Multi-Hit Moves ---
  "double-slap": { randomMultiHit: true },
  "comet-punch": { randomMultiHit: true },
  "double-kick": { fixedMultiHit: 2 },
  "fury-attack": { randomMultiHit: true },
  "twineedle": { fixedMultiHit: 2 },
  "pin-missile": { randomMultiHit: true },
  "fury-swipes": { randomMultiHit: true },
  "spike-cannon": { randomMultiHit: true },
  "barrage": { randomMultiHit: true },
  "bone-rush": { randomMultiHit: true },
  "arm-thrust": { randomMultiHit: true },
  "bullet-seed": { randomMultiHit: true },
  "icicle-spear": { randomMultiHit: true },
  "rock-blast": { randomMultiHit: true },
  "tail-slap": { randomMultiHit: true },
  "scale-shot": { randomMultiHit: true },
  "water-shuriken": { randomMultiHit: true, priority: 1 },
  "double-hit": { fixedMultiHit: 2 },
  "dual-wingbeat": { fixedMultiHit: 2 },
  "twin-beam": { fixedMultiHit: 2 },
  "dragon-darts": { fixedMultiHit: 2 },
  "surging-strikes": { fixedMultiHit: 3 },
  "triple-dive": { fixedMultiHit: 3 },
  "population-bomb": { populationBomb: true },

  // --- Two-Turn Charging Moves ---
  "fly": {
    chargeTrait: {
      semiInvulnerable: "air",
      chargeTextKo: "하늘 높이 날아올랐다!",
      chargeTextEn: "flew up high!",
    },
  },
  "bounce": {
    chargeTrait: {
      semiInvulnerable: "air",
      chargeTextKo: "높이 튀어올랐다!",
      chargeTextEn: "bounced up high!",
    },
  },
  "dig": {
    chargeTrait: {
      semiInvulnerable: "underground",
      chargeTextKo: "땅속으로 파고들었다!",
      chargeTextEn: "burrowed underground!",
    },
  },
  "dive": {
    chargeTrait: {
      semiInvulnerable: "underground",
      chargeTextKo: "물속으로 잠수했다!",
      chargeTextEn: "hid underwater!",
    },
  },
  "shadow-force": {
    chargeTrait: {
      semiInvulnerable: "shadow",
      chargeTextKo: "그림자 속으로 모습을 감췄다!",
      chargeTextEn: "vanished into the shadows!",
    },
  },
  "phantom-force": {
    chargeTrait: {
      semiInvulnerable: "shadow",
      chargeTextKo: "그림자 속으로 모습을 감췄다!",
      chargeTextEn: "vanished into the shadows!",
    },
  },
  "solar-beam": {
    chargeTrait: {
      instantUnderWeather: "sun",
      chargeTextKo: "빛을 흡수하고 있다!",
      chargeTextEn: "took in sunlight!",
    },
  },
  "solar-blade": {
    chargeTrait: {
      instantUnderWeather: "sun",
      chargeTextKo: "빛을 흡수하고 있다!",
      chargeTextEn: "took in sunlight!",
    },
  },
  "skull-bash": {
    chargeTrait: {
      chargeStatBoost: { stat: "def", stage: 1 },
      chargeTextKo: "고개를 숙이고 방어를 올렸다! (+1)",
      chargeTextEn: "tucked in its head and its Defense rose! (+1)",
    },
  },
  "meteor-beam": {
    chargeTrait: {
      chargeStatBoost: { stat: "spa", stage: 1 },
      chargeTextKo: "우주의 힘을 모으고 특수공격을 올렸다! (+1)",
      chargeTextEn: "gathered space power and its Sp. Atk rose! (+1)",
    },
  },
  "sky-attack": {
    chargeTrait: {
      chargeTextKo: "눈부신 빛에 휩싸였다!",
      chargeTextEn: "became cloaked in a harsh light!",
    },
  },
  "bide": {
    chargeTrait: {
      chargeTextKo: "참기를 시작했다! 데미지를 축적하고 있다!",
      chargeTextEn: "began biding its time!",
    },
  },

  // --- Recoil Moves ---
  "take-down": { recoilRatio: 0.25 },
  "double-edge": { recoilRatio: 0.33 },
  "submission": { recoilRatio: 0.25 },
  "brave-bird": { recoilRatio: 0.33 },
  "flare-blitz": { recoilRatio: 0.33 },
  "wood-hammer": { recoilRatio: 0.33 },
  "wave-crash": { recoilRatio: 0.33 },
  "head-smash": { recoilRatio: 0.5 },

  // --- Draining Moves ---
  "absorb": { drainRatio: 0.5 },
  "mega-drain": { drainRatio: 0.5 },
  "giga-drain": { drainRatio: 0.5 },
  "dream-eater": { drainRatio: 0.5 },
  "drain-punch": { drainRatio: 0.5 },
  "horn-leech": { drainRatio: 0.5 },
  "draining-kiss": { drainRatio: 0.75 },
  "bitter-blade": { drainRatio: 0.5 },
  "oblivion-wing": { drainRatio: 0.75 },

  // --- Self-Destruct Moves ---
  "self-destruct": { isSelfDestruct: true },
  "explosion": { isSelfDestruct: true },
  "misty-explosion": { isSelfDestruct: true },

  // --- Recharge Required Moves ---
  "hyper-beam": { rechargeRequired: true },
  "giga-impact": { rechargeRequired: true },
  "frenzy-plant": { rechargeRequired: true },
  "blast-burn": { rechargeRequired: true },
  "hydro-cannon": { rechargeRequired: true },
  "rock-wrecker": { rechargeRequired: true },
  "roar-of-time": { rechargeRequired: true },

  // --- Trap Moves ---
  "bind": { trapMove: true },
  "wrap": { trapMove: true },
  "fire-spin": { trapMove: true },
  "clamp": { trapMove: true },
  "whirlpool": { trapMove: true },
  "sand-tomb": { trapMove: true },
  "magma-storm": { trapMove: true },
  "infestation": { trapMove: true },
  "snap-trap": { trapMove: true },
  "thunder-cage": { trapMove: true },

  // --- Priority Moves ---
  "protect": { priority: 4 },
  "detect": { priority: 4 },
  "spiky-shield": { priority: 4 },
  "burning-bulwark": { priority: 4 },
  "fake-out": { priority: 3 },
  "quick-guard": { priority: 3 },
  "extreme-speed": { priority: 2 },
  "feint": { priority: 2 },
  "quick-attack": { priority: 1 },
  "aqua-jet": { priority: 1 },
  "bullet-punch": { priority: 1 },
  "ice-shard": { priority: 1 },
  "mach-punch": { priority: 1 },
  "shadow-sneak": { priority: 1 },
  "sucker-punch": { priority: 1 },
  "vacuum-wave": { priority: 1 },
  "jet-punch": { priority: 1 },
  "thunderclap": { priority: 1 },
  "accelerock": { priority: 1 },
  "counter": { priority: -5 },
  "mirror-coat": { priority: -5 },
  "roar": { priority: -6 },
  "whirlwind": { priority: -6 },
  "dragon-tail": { priority: -6 },
  "circle-throw": { priority: -6 },
  "teleport": { priority: -6 },
  "trick-room": { priority: -7 },
};

/**
 * Helper to get trait definition of a move
 */
export function getMoveTrait(moveKey: string): MoveTraitDefinition | undefined {
  const cleanKey = moveKey.toLowerCase().replace(/[\s_]+/g, "-");
  return MOVE_TRAITS_REGISTRY[cleanKey];
}

/**
 * Rolls multi-hit count based on move traits
 */
export function calculateMultiHitCount(moveKey: string): number {
  const trait = getMoveTrait(moveKey);
  if (!trait) return 1;

  if (trait.fixedMultiHit) {
    return trait.fixedMultiHit;
  }

  if (trait.randomMultiHit) {
    // Official 2~5 hit probability distribution
    const rolls = [2, 2, 3, 3, 4, 5];
    return rolls[Math.floor(Math.random() * rolls.length)];
  }

  if (trait.populationBomb) {
    let hits = 0;
    for (let i = 0; i < 10; i++) {
      if (Math.random() < 0.9) hits++;
      else break;
    }
    return Math.max(1, hits);
  }

  return 1;
}
