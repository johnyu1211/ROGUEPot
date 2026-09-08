import { loadImage, Image } from "@napi-rs/canvas";

export type BallPerkId =
  | "dodge"          // 💨 회피기동
  | "confuse"        // 💫 몸놀림
  | "flinch"         // 💦 압도
  | "crit"           // 💥 집중
  | "taunt"          // 💢 트래시토크
  | "clear_eye"      // 👁️ 맑눈
  | "surveillance"   // 👁️‍🗨️ 감시
  | "acid_dissolve"  // 🫟 용액
  | "attract"        // 💕 매혹
  | "sticky_web"     // 🕸️ 실
  | "rock_solid"     // 🪨 돌멩이
  | "chilly"         // 🧊 춥다
  | "dinosaur"       // 🦕 공룡
  | "heat"           // 🔥 열기
  | "sky_flight"     // 🌨️ 창공
  | "overcharge"     // ⚠️ 과충전
  | "wave"           // 🌊 파도
  | "downfall"       // 🫧 몰락
  | "willpower"      // ❤️🩹 의지
  | "hug";           // 🫂 포옹

export interface BallPerkDefinition {
  id: BallPerkId;
  emoji: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  requiredTypes?: string[]; // undefined = universal, or list of required player Pokemon types
}

export const BALL_PERK_DEFINITIONS: Record<BallPerkId, BallPerkDefinition> = {
  dodge: {
    id: "dodge",
    emoji: "💨",
    nameKo: "회피기동",
    nameEn: "Evasive Maneuver",
    descKo: "공격이 빗나가게 한다 (단 필중기 제외)",
    descEn: "Causes the opponent's attack to miss (except moves that cannot miss).",
  },
  confuse: {
    id: "confuse",
    emoji: "💫",
    nameKo: "몸놀림",
    nameEn: "Agility",
    descKo: "상대를 혼란시킨다",
    descEn: "Confuses the opponent for 3 turns.",
  },
  flinch: {
    id: "flinch",
    emoji: "💦",
    nameKo: "압도",
    nameEn: "Overwhelm",
    descKo: "상대를 풀이 죽게 한다",
    descEn: "Flinches the opponent, preventing them from moving.",
  },
  crit: {
    id: "crit",
    emoji: "💥",
    nameKo: "집중",
    nameEn: "Focus",
    descKo: "급소에 맞게 한다",
    descEn: "Guarantees a critical hit on the next attack.",
  },
  taunt: {
    id: "taunt",
    emoji: "💢",
    nameKo: "트래시토크",
    nameEn: "Trash Talk",
    descKo: "상대를 도발 상태로 만든다",
    descEn: "Taunts the opponent, preventing them from using status moves for 3 turns.",
  },
  clear_eye: {
    id: "clear_eye",
    emoji: "👁️",
    nameKo: "맑눈",
    nameEn: "Clear Eyes",
    descKo: "다음 공격의 명중률이 20 증가한다",
    descEn: "Increases the accuracy of the next attack by 20.",
    requiredTypes: ["normal", "fighting"],
  },
  surveillance: {
    id: "surveillance",
    emoji: "👁️‍🗨️",
    nameKo: "감시",
    nameEn: "Surveillance",
    descKo: "상대방을 교체 불가 상태로 만든다",
    descEn: "Traps the opponent, preventing them from switching out.",
    requiredTypes: ["ghost", "psychic", "dark"],
  },
  acid_dissolve: {
    id: "acid_dissolve",
    emoji: "🫟",
    nameKo: "용액",
    nameEn: "Acid Solution",
    descKo: "상대방의 랭크업을 제거함 (하락 랭크 유지)",
    descEn: "Dissolves and resets all positive stat boosts on the opponent (stat drops remain).",
    requiredTypes: ["poison", "grass"],
  },
  attract: {
    id: "attract",
    emoji: "💕",
    nameKo: "매혹",
    nameEn: "Infatuation",
    descKo: "헤롱헤롱 상태에 빠트린다",
    descEn: "Infatuates the opponent (50% chance to immobilize).",
    requiredTypes: ["normal"],
  },
  sticky_web: {
    id: "sticky_web",
    emoji: "🕸️",
    nameKo: "실",
    nameEn: "Sticky Web",
    descKo: "5턴간 상대 스피드 1랭크 하락(필드), 벌레타입 스피드 1랭크 상승",
    descEn: "Lowers the opponent's Speed by 1 stage for 5 turns (field hazard). Raises Bug-type Pokémon's Speed by 1 stage.",
    requiredTypes: ["bug"],
  },

  // === 신규 타입별 특수효과 (8종) ===
  rock_solid: {
    id: "rock_solid",
    emoji: "🪨",
    nameKo: "돌멩이",
    nameEn: "Pebble",
    descKo: "3턴간 상대의 기술 위력의 50%를 감소한 피해를 받는다",
    descEn: "Reduces damage taken from opponent's attacks by 50% for 3 turns.",
    requiredTypes: ["ground", "rock", "steel"],
  },
  chilly: {
    id: "chilly",
    emoji: "🧊",
    nameKo: "춥다",
    nameEn: "Chilly",
    descKo: "5턴간 얼음타입 제외 포켓몬의 스피드 1랭크 하락(중첩X), 얼음타입은 스피드 1랭크 상승",
    descEn: "For 5 turns, lowers non-Ice Pokemon's Speed by 1 stage, and raises Ice-type Pokemon's Speed by 1 stage.",
    requiredTypes: ["ice"],
  },
  dinosaur: {
    id: "dinosaur",
    emoji: "🦕",
    nameKo: "공룡",
    nameEn: "Dinosaur",
    descKo: "3턴간 드래곤 타입을 제외한 모든 기술들이 약해진다",
    descEn: "Weakens all non-Dragon type moves for 3 turns.",
    requiredTypes: ["dragon"],
  },
  heat: {
    id: "heat",
    emoji: "🔥",
    nameKo: "열기",
    nameEn: "Heat",
    descKo: "2턴간 공격력과 특수공격력이 2랭크 상승한다. 2턴 종료 시 1랭크 하락한다",
    descEn: "Raises Attack and Sp. Atk by 2 stages for 2 turns, then lowers by 1 stage after 2 turns.",
    requiredTypes: ["fire"],
  },
  sky_flight: {
    id: "sky_flight",
    emoji: "🌨️",
    nameKo: "창공",
    nameEn: "Firmament",
    descKo: "비행타입 기술이 반드시 선공하며, 활공(공중) 상태 기술 위력 1.5배 상승",
    descEn: "Flying-type moves always attack first, and moves used during flight gain 1.5x power.",
    requiredTypes: ["flying"],
  },
  overcharge: {
    id: "overcharge",
    emoji: "⚠️",
    nameKo: "과충전",
    nameEn: "Overcharge",
    descKo: "스피드+2, 공격+1, 특공+1 즉시 상승. 1턴 뒤 특공+1, 3턴 뒤 스피드-4",
    descEn: "Instantly raises Speed +2, Atk +1, Sp.Atk +1. After 1 turn Sp.Atk +1, after 3 turns Speed -4.",
    requiredTypes: ["electric"],
  },
  wave: {
    id: "wave",
    emoji: "🌊",
    nameKo: "파도",
    nameEn: "Surging Wave",
    descKo: "물타입 기술 사용 시 입힌 데미지만큼 체력을 흡수 회복한다",
    descEn: "Water-type moves restore HP equal to the damage dealt.",
    requiredTypes: ["water"],
  },
  downfall: {
    id: "downfall",
    emoji: "🫧",
    nameKo: "몰락",
    nameEn: "Downfall",
    descKo: "특공+4, 스피드+2 즉시 상승. 1턴 뒤 스피드-3, 4턴 뒤 특공-6 하락",
    descEn: "Instantly Sp.Atk +4, Speed +2. After 1 turn Speed -3, after 4 turns Sp.Atk -6.",
    requiredTypes: ["fairy"],
  },

  // === 범용 특수효과 (2종) ===
  willpower: {
    id: "willpower",
    emoji: "❤️🩹",
    nameKo: "의지",
    nameEn: "Willpower",
    descKo: "치명적인 피해를 받아도 HP 1로 공격을 견뎌낸다",
    descEn: "Endures a fatal attack with 1 HP.",
  },
  hug: {
    id: "hug",
    emoji: "🫂",
    nameKo: "포옹",
    nameEn: "Embrace",
    descKo: "포옹하고 돌아간다.",
    descEn: "Hugs you and returns.",
  },
};

/**
 * High-definition crisp SVG strings (viewBox 0 0 24 24)
 */
export const PERK_SVG_STRINGS: Record<BallPerkId, string> = {
  // 💨 1. 회피기동 (Dodge / Dash Swoosh)
  dodge: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 14C8 14 11 11 12 8C13 11 16 14 20 14" stroke="#38BDF8" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 17C6 17 9 14.5 10 12" stroke="#BAE6FD" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M14 12C15 14.5 18 17 22 17" stroke="#BAE6FD" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M8 8C10 5 14 5 16 8" stroke="#E0F2FE" stroke-width="2.2" stroke-linecap="round"/>
    </svg>
  `.trim(),

  // 💫 2. 몸놀림 (Confuse / Dizzy Stars Spiral)
  confuse: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 4L13.5 8.5L18 10L13.5 11.5L12 16L10.5 11.5L6 10L10.5 8.5L12 4Z" fill="#FBBF24" stroke="#D97706" stroke-width="1.2"/>
      <circle cx="18" cy="6" r="2" fill="#FDE68A" stroke="#F59E0B" stroke-width="0.8"/>
      <circle cx="6" cy="16" r="2.5" fill="#FDE68A" stroke="#F59E0B" stroke-width="0.8"/>
      <path d="M5 6C9 3 17 5 19 12C20 16 16 20 12 20C8 20 5 18 6 13" stroke="#F59E0B" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2 3"/>
    </svg>
  `.trim(),

  // 💦 3. 압도 (Flinch / Overwhelming Impact Splash)
  flinch: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C12 3 7 9 7 13C7 15.76 9.24 18 12 18C14.76 18 17 15.76 17 13C17 9 12 3 12 3Z" fill="#0284C7" stroke="#38BDF8" stroke-width="1.5"/>
      <path d="M5 19C7 17 9 17 12 19C15 17 17 17 19 19" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="5" cy="11" r="1.5" fill="#38BDF8"/>
      <circle cx="19" cy="11" r="1.5" fill="#38BDF8"/>
    </svg>
  `.trim(),

  // 💥 4. 집중 (Critical Focus Burst)
  crit: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.5 7.5L20 5.5L17.5 11L22 13.5L16.5 15L17 21L12 17.5L7 21L7.5 15L2 13.5L6.5 11L4 5.5L9.5 7.5L12 2Z" fill="#EF4444" stroke="#DC2626" stroke-width="1.4"/>
      <polygon points="12,6 14,10 18,11 15,14 15.5,18 12,16 8.5,18 9,14 6,11 10,10" fill="#FEF08A"/>
    </svg>
  `.trim(),

  // 💢 5. 트래시토크 (Taunt / Anger Mark)
  taunt: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 7L10 11M18 7L14 11M6 17L10 13M18 17L14 13" stroke="#DC2626" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M10 5V19M14 5V19M5 10H19M5 14H19" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `.trim(),

  // 👁️ 6. 맑눈 (Clear Eye / Accuracy Boost)
  clear_eye: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M2 12C5 6 19 6 22 12C19 18 5 18 2 12Z" fill="#F0F9FF" stroke="#0284C7" stroke-width="2"/>
      <circle cx="12" cy="12" r="4.5" fill="#0284C7"/>
      <circle cx="12" cy="12" r="2.2" fill="#0C4A6E"/>
      <circle cx="10.5" cy="10.5" r="1.2" fill="#FFFFFF"/>
    </svg>
  `.trim(),

  // 👁️‍🗨️ 7. 감시 (Surveillance / Anti-Switch Lock)
  surveillance: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 12C6 7 18 7 21 12C18 17 6 17 3 12Z" fill="#3B0764" stroke="#A855F7" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="#C084FC"/>
      <path d="M12 9V15M9 12H15" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="15" y="15" width="7" height="6" rx="1.5" fill="#7E22CE" stroke="#E9D5FF" stroke-width="1.2"/>
    </svg>
  `.trim(),

  // 🫟 8. 용액 (Acid Dissolve / Clear Positive Buffs)
  acid_dissolve: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 8 7 8 10.5C8 12.7 9.8 14.5 12 14.5C14.2 14.5 16 12.7 16 10.5C16 7 12 2 12 2Z" fill="#10B981" stroke="#059669" stroke-width="1.5"/>
      <path d="M4 18C6 16 9 16 12 18C15 16 18 16 20 18C21 19 21 21 19 21C14 21 10 21 5 21C3 21 3 19 4 18Z" fill="#34D399" stroke="#047857" stroke-width="1.2"/>
      <circle cx="7" cy="12" r="1.5" fill="#A7F3D0"/>
      <circle cx="17" cy="13" r="1.8" fill="#A7F3D0"/>
    </svg>
  `.trim(),

  // 💕 9. 매혹 (Attract / Infatuation Hearts)
  attract: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9.5 5C7 5 5 7 5 9.5C5 13 9.5 17 9.5 17C9.5 17 14 13 14 9.5C14 7 12 5 9.5 5Z" fill="#EC4899" stroke="#BE185D" stroke-width="1.2"/>
      <path d="M16 9C14.5 9 13.5 10.2 13.5 11.5C13.5 13.5 16 16 16 16C16 16 18.5 13.5 18.5 11.5C18.5 10.2 17.5 9 16 9Z" fill="#F472B6" stroke="#DB2777" stroke-width="1"/>
      <circle cx="18" cy="5" r="1.2" fill="#FDF2F8"/>
    </svg>
  `.trim(),

  // 🕸️ 10. 실 (Sticky Web / Speed Drop Field)
  sticky_web: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2V22M2 12H22M5 5L19 19M5 19L19 5" stroke="#CBD5E1" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M12 6L16.5 7.5L18 12L16.5 16.5L12 18L7.5 16.5L6 12L7.5 7.5L12 6Z" fill="none" stroke="#E2E8F0" stroke-width="1.4"/>
      <path d="M12 9L14.5 10L15 12L14.5 14L12 15L9.5 14L9 12L9.5 10L12 9Z" fill="none" stroke="#F1F5F9" stroke-width="1.2"/>
      <circle cx="12" cy="12" r="2" fill="#94A3B8"/>
    </svg>
  `.trim(),

  // 🪨 11. 돌멩이 (Rock Solid / Sturdy Boulder)
  rock_solid: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <polygon points="12,3 19,7 21,15 15,21 7,20 3,13 6,6" fill="#78716C" stroke="#44403C" stroke-width="1.6"/>
      <polygon points="12,3 19,7 15,13 10,10 6,6" fill="#A8A29E"/>
      <polygon points="10,10 15,13 15,21 7,20" fill="#57534E"/>
      <line x1="10" y1="10" x2="3" y2="13" stroke="#44403C" stroke-width="1.2"/>
    </svg>
  `.trim(),

  // 🧊 12. 춥다 (Chilly / Ice Cube & Frost)
  chilly: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 20,6.5 20,16.5 12,21 4,16.5 4,6.5" fill="#38BDF8" stroke="#0284C7" stroke-width="1.5"/>
      <polygon points="12,2 20,6.5 12,11.5 4,6.5" fill="#BAE6FD"/>
      <polygon points="4,6.5 12,11.5 12,21 4,16.5" fill="#0EA5E9"/>
      <line x1="12" y1="11.5" x2="20" y2="16.5" stroke="#0284C7" stroke-width="1.4"/>
      <circle cx="12" cy="6.5" r="1.5" fill="#FFFFFF"/>
    </svg>
  `.trim(),

  // 🦕 13. 공룡 (Dinosaur / Ancient Dragon Silhouette)
  dinosaur: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M19 4C19 4 21 6 21 8C21 10 18 10 16 11L14 14C14 14 17 15 18 17C19 19 18 21 18 21L15 21L13 18L10 18L9 21L6 21C6 21 6 18 7 16C5 17 3 17 2 16C1.5 15.5 2 14.5 3 14C5 13 8 13 9 12L12 7C13 5 15 4 19 4Z" fill="#10B981" stroke="#047857" stroke-width="1.4"/>
      <circle cx="18" cy="7" r="1" fill="#FEF08A"/>
    </svg>
  `.trim(),

  // 🔥 14. 열기 (Heat / Blazing Flame)
  heat: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 15 6 15 9C15 10 16 11 17 11C19 11 20 13 20 15.5C20 18.5 16.5 22 12 22C7.5 22 4 18.5 4 15.5C4 12 7 9 8 8C9 7 9 5 12 2Z" fill="#EF4444" stroke="#DC2626" stroke-width="1.2"/>
      <path d="M12 9C12 9 14 12 14 14C14 15 14.5 15.5 15 15.5C16 15.5 16.5 16.5 16.5 17.5C16.5 19 14.5 21 12 21C9.5 21 7.5 19 7.5 17.5C7.5 15.5 9.5 13.5 10 13C10.5 12.5 10.5 11 12 9Z" fill="#FBBF24"/>
      <ellipse cx="12" cy="18" rx="2" ry="2.5" fill="#FEF08A"/>
    </svg>
  `.trim(),

  // 🌨️ 15. 창공 (Firmament / Soaring Sky Wings & Cloud)
  sky_flight: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 13C3 13 7 7 14 8C19 8.5 21 12 21 12C21 12 17 16 11 15C6 14 3 13 3 13Z" fill="#60A5FA" stroke="#2563EB" stroke-width="1.4"/>
      <path d="M8 10C10 6 17 4 22 6C20 9 16 12 12 11" stroke="#BFDBFE" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="6" cy="17" r="1.5" fill="#93C5FD"/>
      <circle cx="11" cy="19" r="1.5" fill="#93C5FD"/>
      <circle cx="16" cy="17" r="1.5" fill="#93C5FD"/>
    </svg>
  `.trim(),

  // ⚠️ 16. 과충전 (Overcharge / Hazard Lightning)
  overcharge: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 22,20 2,20" fill="#FACC15" stroke="#CA8A04" stroke-width="1.6" stroke-linejoin="round"/>
      <polygon points="12.5,7 9,13 12,13 11.5,17 15,11 12,11" fill="#18181B"/>
    </svg>
  `.trim(),

  // 🌊 17. 파도 (Surging Wave / Ocean Crest)
  wave: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M2 19C5 19 7 17 9 15C11 13 13 9 16 9C19 9 20 12 20 12C20 12 18.5 12 17.5 13C16.5 14 15 16 13 17C10 18.5 6 19 2 19Z" fill="#0284C7" stroke="#0369A1" stroke-width="1.4"/>
      <path d="M2 15C6 15 9 12 12 8C14 5 18 4 21 6C22 7 21 8 20 8C17 8 15 10 13 13C10 16 6 17 2 15Z" fill="#38BDF8"/>
      <circle cx="18" cy="5" r="1.2" fill="#FFFFFF"/>
      <circle cx="21" cy="8" r="1.2" fill="#BAE6FD"/>
    </svg>
  `.trim(),

  // 🫧 18. 몰락 (Downfall / Mystic Bursting Bubble)
  downfall: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="13" r="8" fill="#F472B6" stroke="#DB2777" stroke-width="1.5" fill-opacity="0.75"/>
      <path d="M7 9C8 7 11 7 13 8" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="18" cy="6" r="3" fill="#C084FC" stroke="#9333EA" stroke-width="1.2" fill-opacity="0.7"/>
      <circle cx="6" cy="18" r="2" fill="#E879F9" stroke="#C026D3" stroke-width="1" fill-opacity="0.7"/>
    </svg>
  `.trim(),

  // ❤️🩹 19. 의지 (Willpower / Bandaged Resilient Heart)
  willpower: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 3 14 3 8.5C3 5.5 5.5 3 8.5 3C10.5 3 11.5 4 12 5C12.5 4 13.5 3 15.5 3C18.5 3 21 5.5 21 8.5C21 14 12 21 12 21Z" fill="#EF4444" stroke="#DC2626" stroke-width="1.4"/>
      <line x1="7" y1="14" x2="17" y2="8" stroke="#FEF08A" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="10" y1="8" x2="14" y2="14" stroke="#FDE047" stroke-width="2.6" stroke-linecap="round"/>
    </svg>
  `.trim(),

  // 🫂 20. 포옹 (Embrace / Warm Hug)
  hug: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="6" r="3" fill="#F43F5E"/>
      <circle cx="15" cy="6" r="3" fill="#FB7185"/>
      <path d="M5 20C5 15 8 12 12 12C16 12 19 15 19 20" fill="#FDA4AF" stroke="#E11D48" stroke-width="1.5"/>
      <path d="M8 15C10 17 14 17 16 15" stroke="#BE123C" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 3L13 4.5L12 6L11 4.5Z" fill="#FFE4E6"/>
    </svg>
  `.trim(),
};

const perkImageCache = new Map<BallPerkId, Image>();

/**
 * Loads and returns the Image for a given perk SVG
 */
export async function getPerkSvgImage(perkId: BallPerkId): Promise<Image | null> {
  if (perkImageCache.has(perkId)) {
    return perkImageCache.get(perkId)!;
  }

  const svgStr = PERK_SVG_STRINGS[perkId];
  if (!svgStr) return null;

  try {
    const buf = Buffer.from(svgStr);
    const img = await loadImage(buf);
    perkImageCache.set(perkId, img);
    return img;
  } catch (err) {
    console.error(`[PERK SVG ERROR] Failed to load SVG for perk: ${perkId}`, err);
    return null;
  }
}

/**
 * Synchronously retrieves cached Image (preloaded on startup)
 */
export function getPerkSvgImageSync(perkId: BallPerkId): Image | null {
  return perkImageCache.get(perkId) || null;
}

/**
 * Preload all perk SVG images into memory
 */
export async function preloadPerkSvgImages(): Promise<void> {
  const ids = Object.keys(PERK_SVG_STRINGS) as BallPerkId[];
  await Promise.all(ids.map(id => getPerkSvgImage(id)));
}

// Background preload
preloadPerkSvgImages().catch(() => null);

/**
 * Filter available perks according to player's active Pokémon types
 */
export function getAvailablePerksForTypes(types: string[]): BallPerkDefinition[] {
  const normTypes = (types || []).map(t => t.toLowerCase());
  return Object.values(BALL_PERK_DEFINITIONS).filter(perk => {
    if (!perk.requiredTypes || perk.requiredTypes.length === 0) {
      return true; // Universal perk
    }
    // Type-conditional: at least one required type must match
    return perk.requiredTypes.some(req => normTypes.includes(req.toLowerCase()));
  });
}

/**
 * Normalizes emoji string by stripping variation selectors and whitespaces
 */
export function normalizeEmoji(str?: string | null): string {
  if (!str) return "";
  return str.replace(/[\uFE0E\uFE0F]/g, "").trim();
}

/**
 * Finds perk definition by matching emoji string
 */
export function findPerkByEmoji(emojiName?: string | null): BallPerkDefinition | null {
  if (!emojiName) return null;
  const norm = normalizeEmoji(emojiName);
  for (const perk of Object.values(BALL_PERK_DEFINITIONS)) {
    if (normalizeEmoji(perk.emoji) === norm) {
      return perk;
    }
  }
  return null;
}
