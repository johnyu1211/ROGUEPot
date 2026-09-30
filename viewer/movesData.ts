import { MOVES_DATA, MoveData } from "../src/data/movesKo.js";

export interface VerifiedMoveItem {
  num: number;
  id: string;
  nameKo: string;
  nameEn: string;
  type: string;
  category: "physical" | "special" | "status";
  camera: "target" | "self" | "sky" | "none" | "custom" | "beam" | "sky_pan_down";
  desc: string;
  power?: number | null;
  accuracy?: number | null;
  pp?: number | null;
  description?: string;
  descriptionEn?: string;
  makesContact?: boolean;
  isVerified?: boolean;
  status?: "complete" | "visual_done" | "testing";
  isSpecialVariant?: boolean; // 특수/충전/출연 분리 연출 플래그
  specialType?: "entry" | "charge" | "variant" | "cutscene"; // 특수 유형 구분
}

function toTitleCase(slug: string): string {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Representative Non-Contact Physical Moves in Official Pokémon
const NON_CONTACT_PHYSICAL_MOVES = new Set([
  "pay-day", "poison-sting", "pin-missile", "rock-throw", "earthquake", "fissure",
  "razor-leaf", "rock-slide", "bone-club", "egg-bomb", "bonemerang",
  "barrage", "skull-bash", "spike-cannon", "aeroblast", "sacred-fire", "magnitude",
  "rock-tomb", "sand-tomb", "icicle-spear", "mud-shot", "rock-blast", "water-shuriken",
  "thousand-arrows", "thousand-waves", "lands-wrath", "core-enforcer", "beak-blast",
  "clanging-scales", "darkest-lariat", "spirit-shackle", "spectral-thief", "sunsteel-strike",
  "splishy-splash", "bouncy-bubble", "buzzy-buzz", "sizzly-slide", "glitzy-glow", "baddy-bad",
  "sappy-seed", "freezy-frost", "sparkly-swirl", "veevee-volley", "double-iron-bash"
]);

// Representative Contact Special Moves in Official Pokémon
const CONTACT_SPECIAL_MOVES = new Set([
  "petal-dance", "draining-kiss", "grass-knot", "infestation", "trump-card", "wring-out"
]);

function getMoveContact(category: string, moveKey: string): boolean {
  const baseKey = moveKey.replace(/-enemy$/, "");
  if (baseKey === "perk-hug") return true;
  if (category === "status") return false;
  if (NON_CONTACT_PHYSICAL_MOVES.has(baseKey)) return false;
  if (CONTACT_SPECIAL_MOVES.has(baseKey)) return true;
  return category === "physical";
}

// Handcrafted verified (1-41) and testing (999) move definitions
const HANDCRAFTED_MAP: Record<string, VerifiedMoveItem> = {
  "encounter-entry": { num: 0, id: "encounter-entry", nameKo: "야생 포켓몬 조우 (등장)", nameEn: "Wild Encounter Entry", type: "normal", category: "status", camera: "none", desc: "야생 포켓몬 출현 및 '야생의 OO(이)가 나타났다!' 대사 등장", isVerified: true, isSpecialVariant: true, specialType: "entry" },
  "pound": { num: 1, id: "pound", nameKo: "막치기", nameEn: "Pound", type: "normal", category: "physical", camera: "target", desc: "손이나 꼬리로 상대를 세게 후려쳐 공격", isVerified: true },
  "karate-chop": { num: 2, id: "karate-chop", nameKo: "태권당수", nameEn: "Karate Chop", type: "fighting", category: "physical", camera: "target", desc: "정수리 수직 수도 내려치기", isVerified: true },
  "double-slap": { num: 3, id: "double-slap", nameKo: "연속뺨치기", nameEn: "Double Slap", type: "normal", category: "physical", camera: "target", desc: "좌우 왕복 연속 뺨치기", isVerified: true },
  "comet-punch": { num: 4, id: "comet-punch", nameKo: "연속펀치", nameEn: "Comet Punch", type: "normal", category: "physical", camera: "target", desc: "잔상 혜성 난무 연속 펀치", isVerified: true },
  "mega-punch": { num: 5, id: "mega-punch", nameKo: "메가톤펀치", nameEn: "Mega Punch", type: "normal", category: "physical", camera: "target", desc: "회전 모으기 후 폭발적 메가톤 펀치", isVerified: true },
  "pay-day": { num: 6, id: "pay-day", nameKo: "고양이돈받기", nameEn: "Pay Day", type: "normal", category: "physical", camera: "target", desc: "금화 사출 및 바닥 동전 폭발", isVerified: true },
  "fire-punch": { num: 7, id: "fire-punch", nameKo: "불꽃펀치", nameEn: "Fire Punch", type: "fire", category: "physical", camera: "target", desc: "화염 소용돌이를 두른 불꽃 펀치", isVerified: true },
  "ice-punch": { num: 8, id: "ice-punch", nameKo: "냉동펀치", nameEn: "Ice Punch", type: "ice", category: "physical", camera: "target", desc: "얼음 결정 폭발 냉동 펀치", isVerified: true },
  "thunder-punch": { num: 9, id: "thunder-punch", nameKo: "번개펀치", nameEn: "Thunder Punch", type: "electric", category: "physical", camera: "target", desc: "뇌격 스파크 전기 펀치", isVerified: true },
  "scratch": { num: 10, id: "scratch", nameKo: "할퀴기", nameEn: "Scratch", type: "normal", category: "physical", camera: "target", desc: "시전자 전방 도약 ➔ 예리한 3단 은백색 곡선 발톱 출현 ➔ 해당 방향 아래로 살짝 슬라이드하며 페이드아웃 ➔ 완전 소멸 후 착지 복귀", isVerified: true, status: "complete" },
  "vice-grip": { num: 11, id: "vice-grip", nameKo: "찝기", nameEn: "Vice Grip", type: "normal", category: "physical", camera: "target", desc: "대형 집게 양방향 압착 협공", isVerified: true },
  "guillotine": { num: 12, id: "guillotine", nameKo: "길로틴", nameEn: "Guillotine", type: "normal", category: "physical", camera: "target", desc: "일격필살 대형 집게 참격 & 승리 포즈", isVerified: true },
  "guillotine-enemy": { num: 12, id: "guillotine-enemy", nameKo: "가위자르기 (상대 시전)", nameEn: "Guillotine (Enemy POV)", type: "normal", category: "physical", camera: "target", desc: "상대(적)가 가위자르기 시전 시점 (내 포켓몬 피격 & 처형)", isVerified: true, isSpecialVariant: true, specialType: "variant" },
  "razor-wind": { num: 13, id: "razor-wind", nameKo: "칼바람", nameEn: "Razor Wind", type: "normal", category: "special", camera: "target", desc: "진공 칼날 회전 난무", isVerified: true },
  "swords-dance": { num: 14, id: "swords-dance", nameKo: "칼춤", nameEn: "Swords Dance", type: "normal", category: "status", camera: "self", desc: "검 3자루 회전 공격력 2랭크 상승", isVerified: true },
  "cut": { num: 15, id: "cut", nameKo: "풀베기", nameEn: "Cut", type: "normal", category: "physical", camera: "target", desc: "사선 크로스 칼날 베기", isVerified: true },
  "gust": { num: 16, id: "gust", nameKo: "바람일으키기", nameEn: "Gust", type: "flying", category: "special", camera: "target", desc: "날개짓 돌풍 바람 공격", isVerified: true },
  "wing-attack": { num: 17, id: "wing-attack", nameKo: "날개치기", nameEn: "Wing Attack", type: "flying", category: "physical", camera: "target", desc: "급강하 관통 돌파 후 회전 복귀", isVerified: true },
  "whirlwind": { num: 18, id: "whirlwind", nameKo: "날려버리기", nameEn: "Whirlwind", type: "normal", category: "status", camera: "target", desc: "거대 회오리 생성 및 적 전장 강제 퇴장", isVerified: true },
  "fly": { num: 19, id: "fly", nameKo: "공중날기", nameEn: "Fly", type: "flying", category: "physical", camera: "sky", desc: "1턴 상공 도약 및 2턴 급강하 일격", isVerified: true },
  "bind": { num: 20, id: "bind", nameKo: "조이기", nameEn: "Bind", type: "normal", category: "physical", camera: "target", desc: "3D 회전 궤적 속박 및 압박", isVerified: true },
  "slam": { num: 21, id: "slam", nameKo: "힘껏치기", nameEn: "Slam", type: "normal", category: "physical", camera: "target", desc: "후퇴 후 전방 급발진 강타", isVerified: true },
  "vine-whip": { num: 22, id: "vine-whip", nameKo: "덩굴채찍", nameEn: "Vine Whip", type: "grass", category: "physical", camera: "target", desc: "좌우 교차 2연속 덩굴 강타", isVerified: true },
  "stomp": { num: 23, id: "stomp", nameKo: "짓밟기", nameEn: "Stomp", type: "normal", category: "physical", camera: "target", desc: "상공 도약 후 체중을 실은 발굽 찍기", isVerified: true },
  "double-kick": { num: 24, id: "double-kick", nameKo: "두번치기", nameEn: "Double Kick", type: "fighting", category: "physical", camera: "target", desc: "2연타 발차기 다단 히트", isVerified: true },
  "mega-kick": { num: 25, id: "mega-kick", nameKo: "메가톤킥", nameEn: "Mega Kick", type: "normal", category: "physical", camera: "target", desc: "정면 정지 후 검은 발바닥 스탬프 강타", isVerified: true },
  "jump-kick": { num: 26, id: "jump-kick", nameKo: "점프킥", nameEn: "Jump Kick", type: "fighting", category: "physical", camera: "target", desc: "공중 도약 가속 관통 및 발바닥 각인", isVerified: true },
  "rolling-kick": { num: 27, id: "rolling-kick", nameKo: "돌려차기", nameEn: "Rolling Kick", type: "fighting", category: "physical", camera: "target", desc: "공중 360도 회전 원심력 킥 & 발바닥 타격", isVerified: true },
  "sand-attack": { num: 28, id: "sand-attack", nameKo: "모래뿌리기", nameEn: "Sand Attack", type: "ground", category: "status", camera: "target", desc: "고르게 퍼지는 황금빛 모래바람 살포", isVerified: true },
  "headbutt": { num: 29, id: "headbutt", nameKo: "박치기", nameEn: "Headbutt", type: "normal", category: "physical", camera: "target", desc: "몸통박치기와 동일한 박력있는 전방 돌진 박치기", isVerified: true },
  "horn-attack": { num: 30, id: "horn-attack", nameKo: "뿔찌르기", nameEn: "Horn Attack", type: "normal", category: "physical", camera: "target", desc: "황금빛 날카로운 뿔 돌진, 정면 일시정지 후 관통 돌파 & 복귀", isVerified: true },
  "fury-attack": { num: 31, id: "fury-attack", nameKo: "마구찌르기", nameEn: "Fury Attack", type: "normal", category: "physical", camera: "target", desc: "전방 스텝 후 3개의 뿔 원뿔이 나란히 연속 비행 관통", isVerified: true },
  "horn-drill": { num: 32, id: "horn-drill", nameKo: "뿔드릴", nameEn: "Horn Drill", type: "normal", category: "physical", camera: "target", desc: "초고속 회전 드릴 관통, 검정 배경 순백 실루엣 & 관통 구멍 연출", isVerified: true },
  "horn-drill-enemy": { num: 32, id: "horn-drill-enemy", nameKo: "뿔드릴 (상대 시전)", nameEn: "Horn Drill (Enemy POV)", type: "normal", category: "physical", camera: "target", desc: "상대(적)가 뿔드릴 시전 시점 (내 포켓몬 피격 & 처형)", isVerified: true, isSpecialVariant: true, specialType: "variant" },
  "tackle": { num: 33, id: "tackle", nameKo: "몸통박치기", nameEn: "Tackle", type: "normal", category: "physical", camera: "target", desc: "도움닫기 웅크림 후 전방 고속 쇄도 & 정면 격돌 순백 충돌 타격 (쌍선 브래킷 호, 다이아몬드 스파크, 충격파 링, 지면 흙먼지 팝)", isVerified: true, status: "complete" },
  "body-slam": { num: 34, id: "body-slam", nameKo: "누르기", nameEn: "Body Slam", type: "normal", category: "physical", camera: "target", desc: "체중을 실어 전신으로 덮쳐 누르기", isVerified: true },
  "wrap": { num: 35, id: "wrap", nameKo: "김밥말이", nameEn: "Wrap", type: "normal", category: "physical", camera: "target", desc: "3D 회전 황금빛 밧줄 궤적 속박 공격", isVerified: true },
  "take-down": { num: 36, id: "take-down", nameKo: "돌진", nameEn: "Take Down", type: "normal", category: "physical", camera: "target", desc: "시전 포켓몬 살짝 후진 후 몸통박치기 (주황색 충격 이펙트 & 반동 데미지)", isVerified: true },
  "thrash": { num: 37, id: "thrash", nameKo: "난동부리기", nameEn: "Thrash", type: "normal", category: "physical", camera: "target", desc: "4타 전신 난타 (왼주먹 복부 ➔ 오른주먹 턱 ➔ 날아차기 ➔ 수직 강하 거대 짓밟기)", isVerified: true },
  "double-edge": { num: 38, id: "double-edge", nameKo: "이판사판태클", nameEn: "Double-Edge", type: "normal", category: "physical", camera: "target", desc: "초고속 돌진 접근 후 황금빛 오라 감싸짐 & 빠른 페이드인 격돌 대폭발 (반동 데미지)", isVerified: true },
  "tail-whip": { num: 39, id: "tail-whip", nameKo: "꼬리흔들기", nameEn: "Tail Whip", type: "normal", category: "status", camera: "none", desc: "시전자 뒤돌아 시선 반전 후 유려한 궤적으로 살랑거리듯 돌기 (이펙트 없음, 상대 방어력 1랭크 하락)", isVerified: true },
  "poison-sting": { num: 40, id: "poison-sting", nameKo: "독침", nameEn: "Poison Sting", type: "poison", category: "physical", camera: "target", desc: "길어진 단일 직선 독침 1발 고속 사출 (투명도 완전 제거 & 100% 솔리드 맹독 색상) ➔ 극소형 핀포인트 찌르기 타격 ➔ 대상 포켓몬 전신 보라색화 진행 & 100% 불투명 맹독 비눗방울 발생", isVerified: true },
  "twineedle": { num: 41, id: "twineedle", nameKo: "더블니들", nameEn: "Twineedle", type: "bug", category: "physical", camera: "target", desc: "슬림해진 황금빛 뿔 2발이 직선 나란히 평행 사출 ➔ 좌우 2중 동시 관통 격돌 (2연타 타격)", isVerified: true },
  "pin-missile": { num: 42, id: "pin-missile", nameKo: "바늘미사일", nameEn: "Pin Missile", type: "bug", category: "physical", camera: "target", desc: "시전 포켓몬이 앞으로 살짝 돌진하며 마구찌르기 뿔 4발을 1발씩 연속 발사 ➔ 순차 관통 타격 (4연타 다단 히트 피니시)", isVerified: true },
  "leer": { num: 43, id: "leer", nameKo: "째려보기", nameEn: "Leer", type: "normal", category: "status", camera: "none", desc: "주변이 먼저 어두워진 후 시전자 눈 앞쪽에 절제된 십자모양 별이 번뜩임 ➔ 상대방 위압 떨림 & 방어력 1랭크 하락", isVerified: true },
  "bite": { num: 44, id: "bite", nameKo: "물기", nameEn: "Bite", type: "dark", category: "physical", camera: "target", desc: "상하 턱의 날카로운 이빨이 가로로 넓고 얇게 전개되어 상대를 강하게 깨묾 (부가 이펙트 없는 순수 물리 교합)", isVerified: true },
  "growl": { num: 45, id: "growl", nameKo: "울음소리", nameEn: "Growl", type: "normal", category: "status", camera: "self", desc: "시전 포켓몬 중심에서 3겹의 붉은 원(중심부 투명, 외곽 선홍빛) 확산 및 5방향 플랫 ⚡ 번개 방사 ➔ 시전자 포커싱 & 상대방 공격력 1랭크 하락", isVerified: true },
  "roar": { num: 46, id: "roar", nameKo: "울부짖기", nameEn: "Roar", type: "normal", category: "status", camera: "target", desc: "시전자 입 앞쪽에서 3D 원근 붉은 원추형 음파 파동과 원형 둘레 5방향 ⚡ 번개 전진 방사 ➔ 대상 포켓몬 거센 풍압으로 화면 밖 넉백 이탈 후 복귀", isVerified: true },
  "sing": { num: 47, id: "sing", nameKo: "노래하기", nameEn: "Sing", type: "normal", category: "status", camera: "target", desc: "서서히 전장이 반투명 연분홍빛 20%로 물들며 4개의 검정 음표(♪ ♫ ♪ ♫)가 유연한 파동을 타며 날아가 스며듦 ➔ 대상 포켓몬 나른하게 잠듦 (Zzz 동시 3개 표출)", isVerified: true },
  "supersonic": { num: 48, id: "supersonic", nameKo: "초음파", nameEn: "Supersonic", type: "normal", category: "status", camera: "target", desc: "25px 3D 황금빛 링 6개가 발사되어 대상에게 도착 후 안쪽(작은 원)에서 바깥쪽(큰 원)으로 커지며 6중 동심원으로 적재 ➔ 고속 공명 진동 및 중심 투명 노란 파장 폭발 ➔ 3D 혼란 별무리 공전", isVerified: true },
  "sonic-boom": { num: 49, id: "sonic-boom", nameKo: "소닉붐", nameEn: "Sonic Boom", type: "normal", category: "special", camera: "target", desc: "두꺼운 흰색 초승달 충격파 6발( ) ) ) ) ) )이 직선 잔상과 함께 적 방향으로 고속 발사 ➔ 타격 지점 중심 투명 순백 충격파 짧은 확산", isVerified: true },
  "disable": { num: 50, id: "disable", nameKo: "사슬묶기", nameEn: "Disable", type: "normal", category: "status", camera: "target", desc: "전장이 확실한 잿빛 회색 차원으로 전환된 후 시전자 앞쪽에 샤프한 파란 십자형별 번쩍임 ➔ 대상 포켓몬 주위를 정면 고리와 수직 관통 고리가 촘촘히 맞물린 보라색 메탈릭 쇠사슬이 앞/뒤 Z축으로 가로 회전하며 포위 및 타이트 압착 구속", isVerified: true },
  "acid": { num: 51, id: "acid", nameKo: "용해액", nameEn: "Acid", type: "poison", category: "special", camera: "target", desc: "포물선 궤적으로 누런 주황빛 용해액(🫟 스플래터)이 잔상을 남기며 날아가 대상에게 부착 ➔ 벽면에 퍼지듯 흘러내리며 부식 거품 발생", isVerified: true },
  "ember": { num: 52, id: "ember", nameKo: "불꽃세례", nameEn: "Ember", type: "fire", category: "special", camera: "target", desc: "시차를 두고 날아가는 3개의 작은 불 알갱이 ➔ 바닥에 스르륵 왼쪽에서 오른쪽으로 나타났다 사라지는 약한 불꽃 & 상대 포켓몬 순간 붉은 필터", isVerified: true },
  "flamethrower": { num: 53, id: "flamethrower", nameKo: "화염방사", nameEn: "Flamethrower", type: "fire", category: "special", camera: "target", desc: "시전자 입가 충전 플레어 ➔ 5개 유기적 화염 로브가 회전하며 뻗어나가는 다엽형 맹화 줄기 ➔ 대상 직격 시 맹렬한 불바다 화염 폭발 & 피격 진동", isVerified: true },
  "mist": { num: 54, id: "mist", nameKo: "흰안개", nameEn: "Mist", type: "ice", category: "status", camera: "none", desc: "시전 포켓몬 앞쪽 필드로 은은하게 피어오르는 순백 안개 구름 장막 & 반짝이는 다이아몬드 얼음 결정 ➔ 전장 전체 서서히 스며들었다 걷히는 푸른 필터", isVerified: true },
  "water-gun": { num: 55, id: "water-gun", nameKo: "물대포", nameEn: "Water Gun", type: "water", category: "special", camera: "target", desc: "시전자 입가 수류 응결 및 버블 발생 ➔ 고속 원통형 제트 수류(하이드로 빔 & 순백 캐비테이션 코어) 사출 ➔ 대상 직격 시 16개 포물선 물방울 비산, 2중 충격 물결 링 & 블루 피격 필터", isVerified: true },
  "hydro-pump": { num: 56, id: "hydro-pump", nameKo: "하이드로펌프", nameEn: "Hydro Pump", type: "water", category: "special", camera: "target", desc: "배경 전체 아쿠아/블루 화면 필터 & 5세대 시그니처 가로 수포 라인 전개 ➔ 시전자 입가 시안 고압 링 및 화염방사 패턴의 11개 롤링 순백 포말/수류 클러스터 제트 사출 ➔ 대상 직격 시 극대 넉백 진동, 바닥 수면 웅덩이 파문 & 20개 포물선 비산 수적", isVerified: true },
  "surf": { num: 57, id: "surf", nameKo: "파도타기", nameEn: "Surf", type: "water", category: "special", camera: "target", desc: "시전자 발밑 소용돌이 수면 융기 및 도약 탑승 ➔ 전장을 집어삼키는 4중 레이어 초거대 대해일(심해 수벽, 코발트 바디, 말려드는 순백 유기적 포말 립, 전방 수무) 쇄도 ➔ 대상 머리 위 수직 대폭포 붕괴 강타, 좌우 솟구치는 거대 분출 물기둥 날개, 카메라 지진 진동, 24개 유선형 비산 수적 & 전장 전면 침수 다중 동심원 파문", isVerified: true },
  "ice-beam": { num: 58, id: "ice-beam", nameKo: "냉동빔", nameEn: "Ice Beam", type: "ice", category: "special", camera: "target", desc: "시전자 냉기 호흡 준비 ➔ 5세대 고유 톱니 다이아몬드 냉동광선(#72FFFB & 순백 레이저 심선) 직선 쇄도 ➔ 대상 직격 시 순백 섬광, 블루 피격 틴트 & 극저온 냉기 수증기 안개 분출 ➔ 반짝이는 다이아몬드 더스트 및 얼음 결정 잔향 페이드아웃", isVerified: true },
  "blizzard": { num: 59, id: "blizzard", nameKo: "눈보라", nameEn: "Blizzard", type: "ice", category: "special", camera: "target", desc: "시전자 냉기 집중 ➔ 맹렬한 세찬 설풍 리본(#72FFFB) & 회전 각면 다이아몬드 우박 쇄도 ➔ 대상 강타 시 순백 섬광 & 대상을 감싸는 3D 나선 회오리 눈보라 소용돌이 폭풍 ➔ 볼텍스 파열, 다이아몬드 결정 비산 & 더스트 잔향", isVerified: true },
  "psybeam": { num: 60, id: "psybeam", nameKo: "환상빔", nameEn: "Psybeam", type: "psychic", category: "special", camera: "beam", desc: "초음파 기반 다채로운 사이키델릭 링 연출 (핑크, 시안, 옐로우, 바이올렛, 민트, 마젠타 3D 링 발사 및 동심원 적재 ➔ 사이킥 충격파 2중 확산 작렬 ➔ 다이내믹 빔 카메라 워크)", isVerified: true },
  "bubble-beam": { num: 61, id: "bubble-beam", nameKo: "거품광선", nameEn: "Bubble Beam", type: "water", category: "special", camera: "target", desc: "독침 기반 선명한 워터 비눗방울 6발 고속 순차 사출 ➔ 뒤쪽으로 갈수록 100% 투명해지는 파란색 빔 잔상 (제트 스트림) ➔ 대상 피격 시 연속 파열 물보라 난타 & 잔여 수면 파문", isVerified: true },
  "aurora-beam": { num: 62, id: "aurora-beam", nameKo: "오로라빔", nameEn: "Aurora Beam", type: "ice", category: "special", camera: "beam", desc: "화면 암전 필터 전개 ➔ 3색 넥서스 차징 후 다각도로 뒤틀린 8발의 오로라 링 사출 ➔ 대상 도달 시 급감속(느려짐)되며 대상을 3D 포위 감싸기 ➔ 2중 오로라 충격파 & 다이아몬드 얼음 결정 대폭발 (10% 공격력 감소)", isVerified: false },
  "string-shot": { num: 81, id: "string-shot", nameKo: "실뿜기", nameEn: "String Shot", type: "bug", category: "status", camera: "target", desc: "암전 페이드 ➔ 독립된 2가닥 예리한 직선 실 발사 ➔ 대상 결박 및 압박 수축/팽창 ➔ 스피드 2랭크 하락 디버프", isVerified: true, status: "complete" },
  "dragon-rage": { num: 82, id: "dragon-rage", nameKo: "용의분노", nameEn: "Dragon Rage", type: "dragon", category: "special", camera: "target", desc: "분노 응축 플레어 ➔ S자 굽이치는 딥 인디고-바이올렛 롤링 화염 스트림 ➔ 적 직격 후 관통 질주 & 대형 팽창 페이드아웃 (고정 40 데미지)", isVerified: true, status: "complete" },
  "fire-spin": { num: 83, id: "fire-spin", nameKo: "회오리불꽃", nameEn: "Fire Spin", type: "fire", category: "special", camera: "target", desc: "중심 구체 & 외곽 3개 공전 불꽃 투사체 ➔ 적 착탄 화염 버스트 ➔ 5세대 B/W 스타일 나팔형 3D 멀티 로브 화염 클러스터 볼텍스 & 상단 크레스트 구속 (4~5턴 바인드)", isVerified: true, status: "complete" },
  "thunder-shock": { num: 84, id: "thunder-shock", nameKo: "전기쇼크", nameEn: "Thunder Shock", type: "electric", category: "special", camera: "target", desc: "10만볼트 기반 경량 뇌격 연출: 은은한 암전 속 정전기 충전 ➔ 슬림 2가닥 전격 사출 ➔ 직격 플라즈마 구체 & 황금빛 대전환 ➔ 6방향 스파크 비산 (10% 확률 마비)", isVerified: true, status: "complete" },
  "thunderbolt": { num: 85, id: "thunderbolt", nameKo: "10만볼트", nameEn: "Thunderbolt", type: "electric", category: "special", camera: "target", desc: "암전 속 전기 충전 ➔ 전방 투명 그라데이션 및 바깥쪽 투명/안쪽 순백 황금 번개가닥 고속 발사 ➔ 직격 시 날카로운 번개 텐드릴, 그라데이션 충격 링 및 황금빛 조명 대전환 페이드아웃", isVerified: true, status: "complete" },
  "thunder-wave": { num: 86, id: "thunder-wave", nameKo: "전기자석파", nameEn: "Thunder Wave", type: "electric", category: "status", camera: "target", desc: "암전 ➔ 적 스프라이트 중심 밖으로 퍼지는 다중 원형 노란 링 (커지면서 투명화 & 고속 전자기 진동) & 원을 따라 회전하는 바깥쪽 뾰족한 곡선 아크 ➔ 암전 자연 페이드아웃 & 마비 상태이상 각인", isVerified: true, status: "complete" },
  "thunder": { num: 87, id: "thunder", nameKo: "번개", nameEn: "Thunder", type: "electric", category: "special", camera: "sky_pan_down", desc: "필드 시점 ➔ 상공 틸트업 & 화면 암전 (하단 회색빛, 상단 검은) & 최상단 백색 반투명 수증기 응축 구름 ➔ 구름에서 강력한 벼락 분출 ➔ 적 머리 위 수직 하강 ➔ 정수리 대격돌 직격 & 5-Pass 극초고압 거대 벼락 기둥 + 지면 반투명 플라즈마 장판 + 대지 크랙 & 12방향 뇌격 대폭발 (30% 확률 마비)", isVerified: true, status: "complete" },
  "rock-throw": { num: 88, id: "rock-throw", nameKo: "돌떨구기", nameEn: "Rock Throw", type: "rock", category: "physical", camera: "target", desc: "시전자 살짝 아래 웅크림 ➔ 위로 도약 (포커싱X) ➔ 상대 머리 위 상공에서 돌 출현 & 급강하 낙하 ➔ 머리 직격 & 모래먼지와 돌 산산조각 파쇄 (동시에 대상 찌그러짐) ➔ 쪼개진 돌들이 바닥으로 뿌려지며 떨어짐 (대상 탄성 펴짐)", isVerified: true, status: "complete" },
  "earthquake": { num: 89, id: "earthquake", nameKo: "지진", nameEn: "Earthquake", type: "ground", category: "physical", camera: "target", desc: "발구르기 ➔ 전장 방사형 단층 균열 전개 ➔ 화면 및 포켓몬 좌우 격렬한 연쇄 흔들림 (-11px~+11px) ➔ 바닥 균열에서 솟구쳐 튀어오르는 9개의 각진 3D 바위들 (공중 도약 & 2차 리바운드) ➔ 16프레임 대지진 대격돌 (구멍파기 잠복 대상 2배 피해 관통)", isVerified: true, status: "complete" },
  "fissure": { num: 90, id: "fissure", nameKo: "땅가르기", nameEn: "Fissure", type: "ground", category: "physical", camera: "target", desc: "전조 저주파 지면 진동 ➔ 대상 발밑 중앙 대지가 좌우로 쩍 갈라지며 심연 나락(Chasm) 개방 & 붉은 마그마 단층광과 파편 낙하 ➔ 나락 최대 개방 & 심연에서 치솟는 결정타 에너지 융기 (순백 섬광 일격필살, 구멍파기 잠복 관통)", isVerified: true, status: "complete" },
  "dig": { num: 91, id: "dig", nameKo: "구멍파기", nameEn: "Dig", type: "ground", category: "physical", camera: "target", desc: "1턴 (잠복): 구덩이 없이 시전자 2회 신장/침강 바운스 + 3회차 땅속 완전 잠복 (지진 기반 3D 돌멩이 분출) / 2턴 (기습 타격): 대상 발밑 지하 진동 ➔ 지반 대폭발 솟구침 & 어퍼컷 강타 ➔ 토사 비산 및 시전자 지면 착지 복귀", isVerified: true, status: "complete" },
  "toxic": { num: 92, id: "toxic", nameKo: "맹독", nameEn: "Toxic", type: "poison", category: "status", camera: "target", desc: "시전자 전면 암자색 대형 맹독 구체 응축 ➔ 대형 맹독 구체 그대로 고속 투척 (반투명 테이퍼드 꼬리 잔상 스트림) ➔ 대상 몸체에 독액 철퍽 스플래터 & 부식 독 웅덩이 착탄 ➔ 피어오르는 맹독 해골 기화 & 맹독 상태이상 각인", isVerified: true, status: "complete" },
  "confusion": { num: 93, id: "confusion", nameKo: "염동력", nameEn: "Confusion", type: "psychic", category: "special", camera: "target", desc: "배경 전용 딥 바이올렛 암전 (대상 비암전) ➔ 지상 원본 스프라이트는 제자리에 고정된 채, 위로 반투명 순백 실루엣이 떠오르며 팽창 및 미세 진동 (4세대 스타일 염동력 결박) ➔ 타격 순간 실루엣 해제 및 2px 피격 림 라이트 섬광 & 넉백 (10% 확률 혼란)", isVerified: true, status: "complete" },
  "psychic": { num: 94, id: "psychic", nameKo: "사이코키네시스", nameEn: "Psychic", type: "psychic", category: "special", camera: "target", desc: "시전자 전방 3D 사이킥 링 군집 발현 (0°, 60°, 120° 3방향 3D 틸트 원반) & 배경 전용 3세대 GBA 스타일 반투명 하향 물결 스트라이프 암전 ➔ 대상 순백 실루엣의 역동적 공중 요동 & 고주파 진동 결박 ➔ 사이킥 타격 (피격 플래시 & 넉백) ➔ 배경 암전/물결 유려한 페이드아웃 복귀", isVerified: true, status: "complete" },
  "hypnosis": { num: 95, id: "hypnosis", nameKo: "최면술", nameEn: "Hypnosis", type: "psychic", category: "status", camera: "target", desc: "몽환적인 딥 슬레이트 전장 톤다운 ➔ 초음파 방식 황금빛 노란색 중공원 링 5중 연속 사출 ➔ 대상 방향으로 날아가며 크기 확장 및 대상 관통 확산 ➔ 대상 졸음 유발 (스프라이트 침강) & 수면 방울 생성 ➔ 공용 Zzz 수면 룬 파티클 부유 상승 ➔ 수면 상태 안착 및 암전 자연 해제", isVerified: true, status: "complete" },
  "meditate": { num: 96, id: "meditate", nameKo: "요가포즈", nameEn: "Meditate", type: "psychic", category: "status", camera: "self", desc: "시전자 줌 ➔ 1번 납작 자세와 함께 딥 바이올렛(#3D007B) 외곽 사이킥 원 발현 ➔ 3프레임 뒤 마젠타(#C507C4) 내부 원 발현 ➔ 원들이 외곽으로 퍼지면서 점진적 투명화 ➔ 2번 세로로 길고 얇은 신장 명상 자세 ➔ 원래 상태 안정적 복귀 & 공격 1랭크 상승 (+1)", isVerified: true, status: "complete" },
  "agility": { num: 97, id: "agility", nameKo: "고속이동", nameEn: "Agility", type: "psychic", category: "status", camera: "self", desc: "가속 도약 시동 ➔ 시전 포켓몬 실물 스프라이트 잔상 좌우 고속 횡이동 (선형 그라데이션 투명도 마스크) ➔ 전장을 가로지르는 고속 돌파 질주 ➔ 안정적 정위치 착지 및 스피드 2랭크 상승 (+2)", isVerified: true, status: "complete" },
  "quick-attack": { num: 98, id: "quick-attack", nameKo: "전광석화", nameEn: "Quick Attack", type: "normal", category: "physical", camera: "target", desc: "도약 발진 (시작선) ➔ 초광속 직진 돌파 (순백 스프라이트 잔상) ➔ 정면 대격돌 충돌 (일반 몸통박치기 타격 & 피격자 넉백) ➔ 스키드 착지 먼지 & 복귀 (우선도 +1 선공)", isVerified: true, status: "complete" },
  "rage": { num: 99, id: "rage", nameKo: "분노", nameEn: "Rage", type: "normal", category: "physical", camera: "target", desc: "시전자 2회 붉어짐 & 모락모락 피어오르는 S자 증기 페이드아웃 ➔ 맹렬한 전방 돌진 ➔ 정면 대격돌 공식 돌진 타격 이펙트 (피격 시 공격 1랭크 상승)", isVerified: true, status: "complete" },
  "teleport": { num: 100, id: "teleport", nameKo: "순간이동", nameEn: "Teleport", type: "psychic", category: "status", camera: "self", desc: "시전자 부유 및 순백 차원 왜곡 오라 ➔ 순백 수직 첨탑 스파이어 빔 & 양 끝단 투명 페이드아웃 수평 스캔라인 ➔ 반투명 순백 소멸 팝 플래시 ➔ 부유하는 반투명 순백 스타더스트 가루 ➔ 재출현 탄성 복귀 (야생 배틀 종료 OR 트레이너전 포켓몬 교체)", isVerified: true, status: "complete" },
  "night-shade": { num: 101, id: "night-shade", nameKo: "나이트헤드", nameEn: "Night Shade", type: "ghost", category: "special", camera: "none", desc: "심연의 배경 암전 페이드인 ➔ 시전자 본체는 지상에 그대로 유지된 채 z축 상단에 반투명+채도/밝기 상승된 시전자 거대 환영 발현 및 점진적 팽창 ➔ 적 포켓몬에 페이드인 검은 필터 잠식 및 공포의 좌우 떨림 ➔ 암흑 잔영 및 거대 환영 페이드아웃 (타격 이펙트 없음, 시전자 레벨만큼의 고정 피해)", isVerified: true, status: "complete" },
  "mimic": { num: 102, id: "mimic", nameKo: "흉내쟁이 (흉내내기)", nameEn: "Mimic / Copycat", type: "normal", category: "status", camera: "target", desc: "상대방이 직전에 사용한 기술(변화기/공격기)을 그대로 복제하여 즉시 시전 (본가 흉내쟁이 메커니즘)", isVerified: true, status: "complete" },
  "screech": { num: 103, id: "screech", nameKo: "싫은소리", nameEn: "Screech", type: "normal", category: "status", camera: "none", desc: "시전자 입가에서 발원한 3D 원근 틸트 자글자글한 3중 굉음 링이 울부짖기처럼 상대를 향해 전진 사출 ➔ 적 직격 강타 & 귀 찢는 고주파 공명 및 노이즈 스파이크 작렬 ➔ 적 고통의 격렬한 좌우 진동 떨림 & 방어력 2랭크 급하락 디버프 (-2)", isVerified: true, status: "complete" },
  "double-team": { num: 104, id: "double-team", nameKo: "그림자분신", nameEn: "Double Team", type: "normal", category: "status", camera: "self", desc: "시전자 고속 진동 ➔ 좌우 6체의 반투명 그림자 잔상 급속 확산 ➔ 잔상 고속 진동 및 교차 셔플 ➔ 중앙 본체로 잔상 깔끔하게 융합 복귀 (회피율 +1)", isVerified: true, status: "complete" },
  "recover": { num: 105, id: "recover", nameKo: "HP회복", nameEn: "Recover", type: "normal", category: "status", camera: "self", desc: "AAFF00 외곽 + DEFF99 안쪽 반투명 치유 구체 8개가 2개씩 순차 생성 & 몸체로 쫀득하게 신장 흡수 및 체표면 발광 ➔ 발밑 1시 방향에서 4개의 회복별이 순차 출현하여 330도 시계방향 나선 궤도로 포켓몬을 감싸며 12시 상공으로 비상 후 투명화 승화 소멸 (최대 HP의 50% 회복)", isVerified: true, status: "complete" },
  "harden": { num: 106, id: "harden", nameKo: "단단해지기", nameEn: "Harden", type: "normal", category: "status", camera: "self", desc: "시전자 슬레이트 그레이 필터 전환 ➔ 포켓몬 실루엣 마스킹 순백 듀얼 사선 스트라이프 3회 스위프 & 우측 외곽 4방향 다이아몬드 별빛 반짝임 ➔ 경화 안정화 복귀 (방어 +1)", isVerified: true, status: "complete" },
  "iron-defense": { num: 334, id: "iron-defense", nameKo: "철벽", nameEn: "Iron Defense", type: "steel", category: "status", camera: "self", desc: "시전자 강철 슬레이트 그레이 필터 전환 ➔ 포켓몬 실루엣 마스킹 순백 듀얼 사선 스트라이프 3회 스위프 & 우측 외곽 4방향 다이아몬드 별빛 반짝임 ➔ 단단해진 몸체 안정화 복귀 (방어 +2)", isVerified: false, status: "testing" },
  "minimize": { num: 107, id: "minimize", nameKo: "작아지기", nameEn: "Minimize", type: "normal", category: "status", camera: "self", desc: "시전 포켓몬이 깔끔하게 2회 연속 제자리에서 소형화(35%) 축소되었다가 원상 복귀하며, 축소 시 뒤편에 5개의 투명한 단계별 잔상(Afterimages)이 순서대로 작아지며 본체로 흡수 (회피율 2랭크 상승)", isVerified: true, status: "complete" },
  "smokescreen": { num: 108, id: "smokescreen", nameKo: "연막", nameEn: "Smokescreen", type: "normal", category: "status", camera: "target", desc: "시전자 입가에서 사출 반동 ➔ 칠흑 연기탄의 유려한 포물곡선(Arc 80px) 비행 & 흐릿한 구체 잔상 ➔ 상대 직격 착탄 후 뭉게연기가 둘셋씩 3단계 순차 피어오름 ➔ 먼저 나타난 연막부터 서서히 먼저 투명해지며 상공 분산 소멸 (명중률 -1)", isVerified: true, status: "complete" },
  "confuse-ray": { num: 109, id: "confuse-ray", nameKo: "이상한빛", nameEn: "Confuse Ray", type: "ghost", category: "status", camera: "target", desc: "전장 암전 ➔ 노랑/초록/빨강 3색이 프레임마다 번갈아 빛나는 도깨비불 ➔ 상대방에게 위아래(2.0주기)로 흔들거리며 쇄도 비행 ➔ 상대방 스프라이트 둘레를 3D 입체로 빙글빙글 돌며 머리에서 발끝까지 나선 하강 ➔ 착란 섬광 및 머리 위 3D 회전 혼란 별무리(★ ★ ★) (상대 혼란 100%)", isVerified: true, status: "complete" },
  "withdraw": { num: 110, id: "withdraw", nameKo: "껍질에숨기", nameEn: "Withdraw", type: "water", category: "status", camera: "self", desc: "시전자 하향 웅크림 ➔ 좌우 양쪽에서 나타난 5세대 공식 바이올렛 조개 껍질(Bivalve Shells)이 안쪽으로 빠르게 닫혀오며 시전자를 감싸고 '딱!' 맞물려 닫힘 ➔ 중앙 어두운 접합선 & 상단 서로 다른 높이의 3개 물방울('보글!') 출현 ➔ 굳건한 껍질 표면 칭!(Tink!) 경질화 글린트 & 거품 위로 상승하며 점진적 투명화 ➔ 껍질 해제 및 시전자 기상 복귀 (방어 1랭크 상승)", isVerified: true, status: "complete" },
  "defense-curl": { num: 111, id: "defense-curl", nameKo: "웅크리기", nameEn: "Defense Curl", type: "normal", category: "status", camera: "self", desc: "시전자 웅크림 수축 & 큰 파란 구체 수축 페이드인 ➔ 구체 응축 및 짙은 파랑 전환 & 2겹 순백 회전선(좌/우 교차) 1바퀴 회전 ➔ 회전선과 구체가 팽창하며 승화 소멸 & 시전자 복귀 (방어 1랭크 상승)", isVerified: true, status: "complete" },
  "barrier": { num: 112, id: "barrier", nameKo: "배리어", nameEn: "Barrier", type: "psychic", category: "status", camera: "self", desc: "시전자 상단 순백 십자별 번쩍임 ➔ 상단 가로선 좌우 확장 ➔ 양 끝단 수직 하강 ➔ 하단 가로선 결합 사각형 형성 ➔ 내부 반투명 채움 및 사선 반사 하이라이트 ➔ 보라/푸른빛 전환 및 꼭짓점 시계방향 순회 반짝임 ➔ 배리어 페이드아웃 (방어 2랭크 상승)", isVerified: true, status: "complete" },
  "light-screen": { num: 113, id: "light-screen", nameKo: "빛의장막", nameEn: "Light Screen", type: "psychic", category: "status", camera: "custom", desc: "전장 3D 360도 연속 선회 아크 샷(0° 아군 뷰 ➔ 90° 측면 대치 ➔ 180° 적 시점 정면 대면) ➔ 적 시점에서 시전 포켓몬 앞 맑고 투명한 5단 3D 크리스탈 유리판 순차 전개 & 결계 공명 ➔ 가던 방향 그대로 360도 연속 선회(180° ➔ 270° 반대편 측면 ➔ 360° 원래 아군 뷰) 및 시전자 전방 5단 일체형 에스퍼 수호 장막 안착 (5턴간 특수공격 데미지 50% 반감)", isVerified: true, status: "complete" },
  "haze": { num: 114, id: "haze", nameKo: "흑안개", nameEn: "Haze", type: "ice", category: "status", camera: "custom", desc: "카메라 줌아웃 와이드 뷰(0.86x) & 반투명 암전 페이드인 ➔ 전장 전역 11개 거점 유기적 가로 흑안개 구름 순차 페이드인 ➔ 전장 전역 완전 포위 잠식 & 부드러운 수평 유동 ➔ 구름 순차 승화 & 암전 해제 ➔ 카메라 중립 복귀 (전원의 랭크 변화 0 리셋)", isVerified: true, status: "complete" },
  "reflect": { num: 115, id: "reflect", nameKo: "리플렉터", nameEn: "Reflect", type: "psychic", category: "status", camera: "custom", desc: "전장 3D 360도 연속 선회 아크 샷(0° 아군 뷰 ➔ 90° 측면 대치 ➔ 180° 적 시점 정면 대면) ➔ 적 시점에서 시전 포켓몬 앞 맑고 견고한 5단 3D 육각형 에메랄드 크리스탈 베리어 순차 전개 & 결계 공명 ➔ 가던 방향 그대로 360도 연속 선회(180° ➔ 270° ➔ 360° 원래 아군 뷰) 및 시전자 전방 일체형 육각 수호 장막 안착 (5턴간 물리공격 데미지 50% 반감)", isVerified: true, status: "complete" },
  "focus-energy": { num: 116, id: "focus-energy", nameKo: "기충전 (기에모으기)", nameEn: "Focus Energy", type: "normal", category: "status", camera: "self", desc: "시전자 정중앙 록온 줌(1.25x) ➔ 시전 포켓몬 둘레를 45° 균등 간격으로 도는 8개의 초소형 백황색 에너지 구체(8-Orb Ki Ring) ➔ 3D 전후 레이어 교차 공전 ➔ 회전 도중 구체들의 연쇄 상공 130px 초장거리 노란빛기둥 분출 및 회전 절정 ➔ 상공 승화 및 공전 안정화 완주 (급소율 2랭크 상승)", isVerified: true, status: "complete" },
  "bide": { num: 117, id: "bide", nameKo: "참기 (공격)", nameEn: "Bide (Attack)", type: "normal", category: "physical", camera: "target", desc: "축적된 에너지를 폭발시키며 상대방에게 정면 대격돌 (몸통박치기 이펙트 & 2배 반격)", isVerified: true, status: "complete" },
  "bide-charge": { num: 117, id: "bide-charge", nameKo: "참기 (참기)", nameEn: "Bide (Biding)", type: "normal", category: "physical", camera: "self", desc: "시전자 정중앙 록온 줌(1.25x) ➔ 붉게 물들며 머리 위로 3개의 하얀 증기 구름을 순차 분출(칙- 칙- 칙-)", isVerified: true, status: "complete", isSpecialVariant: true, specialType: "charge" },
  "metronome": { num: 118, id: "metronome", nameKo: "손가락흔들기", nameEn: "Metronome", type: "normal", category: "status", camera: "self", desc: "시전자 정면 거대 순백 포인팅 핸드가 메트로놈처럼 좌우로 흔들리며 마법 별빛(✦)과 음표(♪)를 뿜은 뒤 랜덤 기술 발동", isVerified: true, status: "complete" },
  "mirror-move": { num: 119, id: "mirror-move", nameKo: "따라하기", nameEn: "Mirror Move", type: "flying", category: "status", camera: "beam", desc: "상대방이 사용한 기술을 흉내 내어 똑같은 기술로 반격 (기본: 에이스번의 화염방사 따라하기)", isVerified: true, status: "complete" },
  "self-destruct": { num: 120, id: "self-destruct", nameKo: "자폭", nameEn: "Self-Destruct", type: "normal", category: "physical", camera: "target", desc: "상대를 향해 달려가다 중간에 멈춰 서서 트레이너를 향해 뒤돌아본 뒤(아군 시전 시) ➔ 다시 돌아서서 상대 코앞까지 쇄도 ➔ 크리퍼 점멸 카운트다운 & 과부하 팽창 ➔ 3D 타원 충격파 링과 폭풍 블러를 동반한 대폭발 (시전자 자폭 기절 & 상대에게 200 위력의 괴멸적 물리 피해)", isVerified: true, status: "complete" },
  "egg-bomb": { num: 121, id: "egg-bomb", nameKo: "알폭탄", nameEn: "Egg Bomb", type: "normal", category: "physical", camera: "none", desc: "줌 아웃 와이드 전장 ➔ 시전자가 알을 힘껏 던져 포물선 비행 (상공 95px 탄도 궤적 & 바닥 그림자) ➔ 상대 직격 껍질 산산조각 파쇄 & 황금 노른자 스플래시 & 100 위력 화염 대폭발", isVerified: true, status: "complete" },
  "lick": { num: 122, id: "lick", nameKo: "핥기", nameEn: "Lick", type: "ghost", category: "physical", camera: "target", desc: "시전자 전방 접근 ➔ 대상 포켓몬 2.30x 초근접 정중앙 줌인 (시전자 화면 밖 완전 격리) ➔ 카메라 바깥에서 거대한 만화풍 혓바닥 쇄도 출현 ➔ 대상을 쓸어올리는 스쿼시 왜곡 강타 & 침 비산 ➔ 피격자 오한/마비 전율 (30% 마비)", isVerified: true, status: "complete" },
  "smog": { num: 123, id: "smog", nameKo: "스모그", nameEn: "Smog", type: "poison", category: "special", camera: "target", desc: "시전자 들이쉬기 & 입가 연무 응축 ➔ 마치 화염방사처럼 입에서 전방으로 점점 굵어지며 쇄도하는 고압 연속 독가스 제트 분사 ➔ 상대 직격 착탄 순간에도 입에서 독가스를 계속해서 뿜어내며 3차 웨이브 유기적 독가스 클러스터 전신 차폐 ➔ 분사 중단 및 스트림 꼬리 쇄도 ➔ 먼저 뿜어진 가스부터 순차 상공 분산 소멸 (40% 독)", isVerified: true, status: "complete" },
  "sludge": { num: 124, id: "sludge", nameKo: "오물공격", nameEn: "Sludge", type: "poison", category: "special", camera: "target", desc: "시전자 웅크림 및 순수 스모그 덩어리 응축 생성 ➔ 포물선 탄도 비행 & 날아가면서 스모그 연무 잔상 방출 & 바닥 그림자 ➔ 상대 정면 직격 시 스모그 덩어리 파열 & 독침 맞았을 때 같은 핀포인트 독기 타격 ➔ 대상 전신 보라색화 진행 & 영롱한 보라색 독 비눗방울 군집 상공 부유 (30% 독)", isVerified: true, status: "complete" },
  "bone-club": { num: 125, id: "bone-club", nameKo: "뼈다귀치기", nameEn: "Bone Club", type: "ground", category: "physical", camera: "target", desc: "시전자 뼈다귀 투척 와인드업 ➔ 상공 85px 포물선 궤적 & 7단계 고속 핑그르르 회전 비행 (단방향 테이퍼드 회전선 & 바닥 그림자) ➔ 대상 머리를 톡 침! (피격자 살짝 납작 Squash + 몸통박치기 타격 이펙트) ➔ 닿은 뼈다귀는 오른쪽으로 튕겨져 나가면서 더 빠른 회전 ➔ 점차 투명해지며 페이드아웃 소멸 (10% 풀죽음)", isVerified: true, status: "complete" },
  "fire-blast": { num: 126, id: "fire-blast", nameKo: "불대문자", nameEn: "Fire Blast", type: "fire", category: "special", camera: "target", desc: "시전 포켓몬 위치에 회전하는 불꽃 소용돌이 발생 ➔ 거대한 초고열 화염구로 응축 ➔ 상대방을 향해 꼬리 잔상을 남기며 6단계 고속 쇄도 비행 ➔ 대상 포켓몬 스프라이트 Z축 위에서 중심 폭발하며 5갈래로 뿜어지는 불잔상 한자 '大' 자 형성 ➔ 대상 전신 화염 연소 & 피격 후 서서히 승화 페이드아웃 (10% 화상)", isVerified: true, status: "complete" },
  "waterfall": { num: 127, id: "waterfall", nameKo: "폭포오르기", nameEn: "Waterfall", type: "water", category: "physical", camera: "target", desc: "시전자 웅크림 및 발밑 소용돌이 수면 파문 ➔ 전신 아쿠아 오라 장전 & 급류 쇄도 돌진 ➔ 대상 발밑에서 상공 끝까지 솟구치는 거대 수직 폭포 기둥 분출 & 폭포수를 거슬러 오르는 상승 넉업 강타 ➔ 폭포 정상 포말 폭발 및 사방 물보라 비산 착지 (20% 풀죽음)", isVerified: true, status: "complete" },
  "clamp": { num: 128, id: "clamp", nameKo: "껍질에끼우기", nameEn: "Clamp", type: "water", category: "physical", camera: "target", desc: "대상 포켓몬 좌우에서 110번 껍질에숨기 공식 보라색 조개 껍질(drawClamValve) 소환 & 개방 포위 ➔ 닫힐 때 3단계 조개 투명 잔상 궤적과 함께 쾅! 맞물림 닫힘 직격 (피격자 가로 스쿼시 & 중심 물빛 타격 섬광) ➔ 닫힌 껍질로 2단 연속 추가 압박 조이기 (틈새 모락모락 화이트-연하늘 물 수증기 & 아쿠아 수포 분출) ➔ 딸깍 개방되며 반짝이는 물방울과 함께 기화 소멸 (4~5턴 바인드 구속)", isVerified: true, status: "complete" },
  "swift": { num: 129, id: "swift", nameKo: "스피드스타", nameEn: "Swift", type: "normal", category: "special", camera: "none", desc: "시전자 주변 밤하늘 암전(Fade-in) & 황금별 6개 반시계 지속 회전 ➔ 별쪽은 반투명 끝쪽은 투명한 스피드라인을 두른 5각 별과 4각 다이아몬드 십자별들의 촘촘한 스타 스트림 대각선 쇄도 ➔ 상대방에게 닿을 때마다 2D 동그란 노란 파동 링이 연속으로 팡! 팡! 팡! 팡! 쾅! 터지며 페이드아웃 복귀 (필중기)", isVerified: true, status: "complete" },
  "skull-bash": { num: 130, id: "skull-bash", nameKo: "로켓박치기", nameEn: "Skull Bash", type: "normal", category: "physical", camera: "target", desc: "시전포켓몬 포커싱 ➔ 도움닫기 후방 웅크림 ➔ 머리 전방 돔 형태의 유선형 바람 부스터 이펙트 생성 ➔ 상대방에게 26도 대각선 초고속 돌진 쇄도 & 배경 검정 암전 ➔ 정면 머리 격돌 직격 & 순백-황금 플라즈마 코어 폭발 & 방사형 초승달 충격파 칼날 & 8개 볼륨 뭉게구름 연기 팽창 ➔ 반동 착지 및 암전 페이드아웃 복귀", isVerified: true, status: "complete" },
  "skull-bash-charge": { num: 130, id: "skull-bash-charge", nameKo: "로켓박치기 (충전)", nameEn: "Skull Bash (Charge)", type: "normal", category: "status", camera: "self", desc: "시전자 고개 푹 숙여 웅크림 ➔ 머리 둘레 암회색 원형 에너지 압축 링(Aura Compression Ring) 형성 ➔ 발밑 하단 몽글몽글 피어오르는 황금빛 모래먼지 구름층(Billowing Sand Dust Aura) ➔ 방어력 1랭크 상승 스파클 분출 (1턴 충전 고증 연출, 방어 +1)", isVerified: true, status: "complete", isSpecialVariant: true, specialType: "charge" },
  "spike-cannon": { num: 131, id: "spike-cannon", nameKo: "가시대포", nameEn: "Spike Cannon", type: "normal", category: "physical", camera: "target", desc: "바늘미사일의 내추럴 아이보리 뿔 콘 바늘 기반 4발 연속 발사 ➔ 바늘 뒷부분 로켓 엔진 추진 제트 화염(Rocket Jet Flame) 분출 ➔ 매 타격마다 핀포인트 찰진 폭발 & 타격점 전용 미니 뭉게구름 연기 솟구침 ➔ 4타 피니시 격돌 시 폭발 후 연기가 대기 중으로 부드럽게 페이드아웃 (2~5회 연속 공격)", isVerified: true, status: "complete" },
  "constrict": { num: 132, id: "constrict", nameKo: "휘감기", nameEn: "Constrict", type: "normal", category: "physical", camera: "target", desc: "시전자가 상대 포켓몬에게 접근하여 전신을 똬리로 돌돌 감기 ➔ 피격자 360도 회전(돌돌 말림) ➔ 강력한 수축 조이기 압박 작렬 (035 김밥말이 연출 100% 계승, 10% 확률 스피드 -1)", isVerified: true, status: "complete" },
  "amnesia": { num: 133, id: "amnesia", nameKo: "망각술", nameEn: "Amnesia", type: "psychic", category: "status", camera: "self", desc: "배경 암전 ➔ 시전자 머리 위 몽실몽실 피어오르는 부드러운 수증기 구름 & 중앙 파란색 물음표(?) ➔ 포켓몬과 함께 귀엽게 갸우뚱~ ➔ 수증기 구름 퐁!(Pop!) 기화 터짐 & 암전 해제 ➔ 특수방어 2랭크 상승 (+2)", isVerified: true, status: "complete" },
  "kinesis": { num: 134, id: "kinesis", nameKo: "숟가락휘기", nameEn: "Kinesis", type: "psychic", category: "status", camera: "target", desc: "약한 보라색 암전 ➔ 은빛 메탈릭 숟가락 소환 ➔ 초능력에 의해 목 부분이 자연스럽게 급절곡 ➔ 꺾인 후 외곽으로 퍼지는 보라색 파장 ➔ 상대 시야 착란 흔들림 & 명중률 1랭크 하락 (-1)", isVerified: true, status: "complete" },
  "soft-boiled": { num: 135, id: "soft-boiled", nameKo: "알낳기", nameEn: "Soft-Boiled", type: "normal", category: "status", camera: "self", desc: "시전자 앞 부드러운 상아빛 달걀 통- 통- 도약 출현 ➔ 공중 정점 '톡!' 지그재그 균열 ➔ 알 위아래 쪼개짐 & 밝은 전방위 광채 ➔ 계란이 완전히 페이드아웃된 후 ➔ HP회복 전용 녹색 치유 에너지 수렴 및 상승 나선 회복별 비상 (최대 HP 50% 회복)", isVerified: true, status: "complete" },
  "high-jump-kick": { num: 136, id: "high-jump-kick", nameKo: "무릎차기", nameEn: "High Jump Kick", type: "fighting", category: "physical", camera: "target", desc: "도약 준비 웅크림 ➔ 상공 초고도 수직 도약 & 후방 주황 실루엣 고스트 잔상 ➔ 무릎 내지른 45도 급강하 마하 돌진 ➔ 상대 무릎 직격 폭쇄 강타 & 100% 외곽 투명 충격파/스파이크 & 사방으로 퍼지며 페이드아웃되는 #FF1D00 고광택 붉은 입체 알갱이 ➔ 타격 반동 공중 백플립 회전 후 지면 착지 복귀 (위력 130)", isVerified: true, status: "complete" },
  "glare": { num: 137, id: "glare", nameKo: "뱀눈초리", nameEn: "Glare", type: "normal", category: "status", camera: "self", desc: "붉은 실선이 떠올라 매서운 뱀눈을 뜨며 상대를 노려본다 (100% 마비)", isVerified: true, status: "complete" },
  "dream-eater": { num: 138, id: "dream-eater", nameKo: "꿈먹기", nameEn: "Dream Eater", type: "psychic", category: "special", camera: "custom", desc: "몽환 암전 ➔ 피격자 몸체에서 꿈의 정기 추출 ➔ 악몽 타격 및 메가드레인 궤적 곡선 아크 흡수 비행 ➔ 시전자 포커싱 전환 및 1프레임 안착 ➔ 보랏빛 나선 상승 회복별 & HP 흡수 회복 (피해 50% 흡수)", isVerified: true, status: "complete" },
  "poison-gas": { num: 139, id: "poison-gas", nameKo: "독가스", nameEn: "Poison Gas", type: "poison", category: "status", camera: "target", desc: "시전자 들이쉬기 ➔ 상대방을 향해 100% 일직선으로 뻗어나가는 고속 독가스 제트 ➔ 상대 스프라이트를 직선으로 관통하여 Z축 뒤로 뿜어나감(뒤로 갈수록 투명화) ➔ 상대 전신 독무 차폐 & 보라색 독 기포 퐁퐁 비산 ➔ 중독 기침 전율 후 소멸 (100% 독 상태이상)", isVerified: true, status: "complete" },
  "barrage": { num: 140, id: "barrage", nameKo: "구슬던지기", nameEn: "Barrage", type: "normal", category: "physical", camera: "target", desc: "흰색 구슬이 상공으로 고각 포물선 상승 ➔ 상대 머리 위 상공 도달 후 수직 급강하 낙하 타격 ➔ 구슬이 머리에 유지된 채로 피격자 & 카메라 진동 셰이크 작렬 ➔ 진동 종료 후 구슬 자연스러운 페이드아웃 & 외곽 투명 그라데이션 바닥 흙먼지 확산 및 소산", isVerified: true, status: "complete" },
  "leech-life": { num: 141, id: "leech-life", nameKo: "흡혈", nameEn: "Leech Life", type: "bug", category: "physical", camera: "none", desc: "시전자 찌르기 모션 ➔ 양끝이 뾰족한 순백색 침 & 끝이 투명해지는 긴 잔상 초고속 관통 사출 ➔ 화면 암전 & 대상 피격 흔들림 ➔ 대상에게서 노란색 발광 흡수 에너지가 바깥쪽 완만한 호를 그리며 시전자에게 쇄도 ➔ 시전자 체내 흡수 & 발밑 골드 펄스 링 및 상승 치유 별빛 전개 (피해 50% HP 회복)", isVerified: true, status: "complete" },
  "lovely-kiss": { num: 142, id: "lovely-kiss", nameKo: "악마의키스", nameEn: "Lovely Kiss", type: "normal", category: "status", camera: "target", desc: "시전자 전방 기울임 ➔ 깔끔한 단색 핫핑크 츄 입술 부드러운 아크 사출 ➔ 대상 얼굴 정면 찰싹 '쪽!' 립스틱 마크 밀착 & 피격자 리액션 ➔ 러블리 핑크 하트 퐁퐁 팝 & 몽롱한 흔들림 ➔ 머리 위 Zzz 수면 방울 상승 & 스르륵 잠듦 (수면 상태이상)", isVerified: true, status: "complete" },
  "sky-attack": { num: 143, id: "sky-attack", nameKo: "불새", nameEn: "Sky Attack", type: "flying", category: "physical", camera: "target", desc: "하늘색 필터 배경 ➔ 전신을 감싸는 ) 형태의 푸른 불새 화염 날개 & 궤적을 수놓는 눈부신 불빛 잔상 ➔ 음속 관통 돌진 (날개치기 스타일 관통 연출) ➔ 상대 위치 6단계 엇박자 볼류메트릭 교차 대폭발 작렬 (폭발 내내 하늘색 배경 필터 완벽 유지) ➔ 날렵한 곡선 회항 및 착지 (위력 140, 급소율 +1, 30% 풀죽음)", isVerified: true, status: "complete" },
  "sky-attack-charge": { num: 143, id: "sky-attack-charge", nameKo: "불새 (충전)", nameEn: "Sky Attack (Charge)", type: "flying", category: "status", camera: "custom", desc: "시전자 포커싱 ➔ 전장 짙은 암전 ➔ 시전자 주변을 감싸며 점진적으로 증식하는 3D 입체 나선 푸른 불꽃 궤도 회전 볼텍스 ➔ 카메라 원위치 복귀 후에도 눈부신 빛의 불꽃을 휘감은 채 돌진 대기 (1턴 충전 연출)", isVerified: true, status: "complete", isSpecialVariant: true, specialType: "charge" },
  "transform": { num: 144, id: "transform", nameKo: "변신", nameEn: "Transform", type: "normal", category: "status", camera: "self", desc: "시전포켓몬이 납작해지며 순백 필터 적용 ➔ 완전 납작 ➔ 흰색 필터가 적용된 대상포켓몬 후면(플레이어 시전 시) 전환 ➔ 펴지면서 원래 상태로 돌아오면서 흰색 필터 서서히 제거 & 변신 완료", isVerified: true, status: "complete" },
  "bubble": { num: 145, id: "bubble", nameKo: "거품", nameEn: "Bubble", type: "water", category: "special", camera: "target", desc: "시전자 들이쉬기 ➔ 꼬리 없이 커졌다 작아졌다 팽창·수축하며 비행하는 영롱한 물 비눗방울 3개 ➔ 대상 도달 후 1번, 2번, 3번 거품 순차 파열 '펑! 펑! 펑!' & 물방울 스플래시 비산 (10% 스피드 -1)", isVerified: true, status: "complete" },
  "dizzy-punch": { num: 146, id: "dizzy-punch", nameKo: "잼잼펀치", nameEn: "Dizzy Punch", type: "normal", category: "physical", camera: "target", desc: "1차 잽 전진 ➔ 메가톤펀치 정면 주먹 타격 (퍽!) & 피격자 리액션 ➔ 1차 혼란 별무리·스파이럴·피요피요 병아리 다각도 3D 포물선 분출 ➔ 리드미컬한 반대손 2차 잽 연타 (퍽!) ➔ 2차 혼란 효과 다각도 3D 포물선 2회 분출 및 상공 체공 (20% 혼란)", isVerified: true, status: "complete" },
  "spore": { num: 147, id: "spore", nameKo: "버섯포자", nameEn: "Spore", type: "grass", category: "status", camera: "target", desc: "시전자 포자 방출 ➔ 대상 머리 위 상공에서 황금빛 포자가 유기적으로 쏟아져 내리는 포자 샤워 (낙하하면서 자연스럽게 페이드아웃) ➔ 전신 포자 침투 & 대상 졸림 반응 ➔ 머리 위 몽환적인 3단 Zzz 수면 방울 비상 & 깊은 잠 안착 (100% 수면 상태이상, 풀 타입 무효)", isVerified: true, status: "complete" },
  "flash": { num: 148, id: "flash", nameKo: "플래시", nameEn: "Flash", type: "normal", category: "status", camera: "none", desc: "전장 짙은 암전 ➔ 시전포켓몬에게서 강렬한 십자 섬광 번쩍 (1프레임) ➔ 화면 전체 눈부신 순백 화이트아웃 ➔ 흰색이 부드럽게 페이드아웃되며 원래 화면 복귀 & 상대 명중률 1랭크 하락", isVerified: true, status: "complete" },
  "psywave": { num: 149, id: "psywave", nameKo: "사이코웨이브", nameEn: "Psywave", type: "psychic", category: "special", camera: "target", desc: "시전포켓몬에게서 시작되는 길쭉한 타원형으로 이루어진 마젠타·보랏빛 색깔 곡선이 상대에게로 이동 ➔ 타격 ➔ 대상포켓몬 스프라이트 잠깐 살짝 납작해졌다가 탄성 복귀 ➔ 몸체를 감싸며 공명하는 3단 보랏빛 링 출현 및 파동 확산", isVerified: true, status: "complete" },
  "splash": { num: 150, id: "splash", nameKo: "튀어오르기", nameEn: "Splash", type: "normal", category: "status", camera: "self", desc: "시전포켓몬 납작 ➔ 세로길쭉(공중 도약) ➔ 납작 ➔ 세로길쭉 ➔ 납작 ➔ 원복 (스쿼시 & 스트레치 극대화 팔딱팔딱 튀어오름)", isVerified: true, status: "complete" },
  "acid-armor": { num: 151, id: "acid-armor", nameKo: "녹기", nameEn: "Acid Armor", type: "poison", category: "status", camera: "self", desc: "시전포켓몬 납작해지며 하단 확장 + 흰색필터 점점강하게 적용 ➔ 동시 페이드아웃 ➔ 빠른 원상복귀 (액화 용해 연출)", isVerified: true, status: "complete" },
  "crabhammer": { num: 152, id: "crabhammer", nameKo: "집게해머", nameEn: "Crabhammer", type: "water", category: "physical", camera: "target", desc: "시전자 도약 & 대상 줌인(1.34x) ➔ 상공에서 벼락같이 내리찍는 유선형 테이퍼드 순백 기둥 ➔ 지면 강타(콰앙!) & 피격자 납작 찌그러짐 4프레임(350ms) 지속 ➔ 지면 물보라 알갱이 버스트(중심부 왼쪽 위 하이라이트) ➔ Z축 최상단에서 별개로 비대칭 팽창·소산하는 반투명 스카이블루 수증기 ➔ 피격자 탄성 반동 튕김 복귀 & 안정화", isVerified: true, status: "complete" },
  "explosion": { num: 153, id: "explosion", nameKo: "대폭발", nameEn: "Explosion", type: "normal", category: "physical", camera: "custom", desc: "시전자 화면 중앙 고정 카메라 줌아웃(0.78x) 360° ORBIT 선회 ➔ 줌인(1.50x) 시전자 초근접 확대 밀착 ➔ 시전포켓몬 튀어오르기(Splash) 1회 팔딱 모션 ➔ 기폭 직전 흑백 고대비·음화 반전 이펙트프레임 ➔ 순백 섬광 플래시 ➔ 화면 전체를 100% 집어삼키는 초대형 초신성 화염 폭풍 & 폭발 속 4차 연쇄 내부 폭발 & 격렬한 지진 셰이크 ➔ 흑연 연막 버섯구름 융기 & 타겟 최대 넉백", isVerified: true, status: "complete" },
  "fury-swipes": { num: 154, id: "fury-swipes", nameKo: "마구할퀴기", nameEn: "Fury Swipes", type: "normal", category: "physical", camera: "target", desc: "시전자 전방 도약 ➔ 010 할퀴기(Scratch) 고유 3단 은백색 곡선 발톱 출현 ➔ 해당 방향 아래로 살짝 슬라이드하며 페이드아웃 ➔ 완전 소멸 후 반대 방향 할퀴기 출현 ➔ 해당 방향 아래로 슬라이드하며 페이드아웃 ➔ 4연속 좌우 교대 연타 피니시 & 착지 복귀 (노란 별/구형 타격 이펙트 완전 배제, 깔끔하고 예리한 순수 참격 연출)", isVerified: true, status: "complete" },
  "bonemerang": { num: 155, id: "bonemerang", nameKo: "뼈다귀부메랑", nameEn: "Bonemerang", type: "ground", category: "physical", camera: "target", desc: "시전자 뼈다귀 투척 와인드업 ➔ 상대방에게 고속 회전 비행 ➔ 상대 포켓몬 스프라이트 관통 직격 (1차 몸통박치기 타격 이펙트) ➔ 상대 뒤로 넘어가 배후 3D 타원 선회 루프 ➔ 배후에서 돌아오면서 상대를 다시 관통 (2차 몸통박치기 타격 이펙트 & 체력 감소) ➔ 시전포켓몬에게 뼈가 돌아오면서 페이드아웃 소멸 (위력 50x2타)", isVerified: true, status: "complete" },
  "rest": { num: 156, id: "rest", nameKo: "잠자기", nameEn: "Rest", type: "psychic", category: "status", camera: "self", desc: "시전자 피로에 웅크리며 잠에 빠져듦 ➔ 머리 위로 순수하게 z ➔ z ➔ Z 글자가 순서대로 부드럽게 상승 ➔ HP 100% 완전 회복 & 수면 상태 돌입 ➔ 편안한 호흡과 함께 깊은 숙면 안착", isVerified: true, status: "complete" },
  "rock-slide": { num: 157, id: "rock-slide", nameKo: "스톤샤워", nameEn: "Rock Slide", type: "rock", category: "physical", camera: "target", desc: "시전자 발구르기 지면 균열 & 자갈 파쇄 분출 ➔ 상대 상공에서 지진 톤 3D 다면체 바위 군집이 단일 속도선과 함께 순차 급강하 ➔ 1·2차 바위 직격 및 잼잼펀치 3D 포물선 탄도학 파편 전방위 비산 ➔ 이전 바위 페이드아웃 & 메인 초대형 바위 수직 직격 쾅!! ➔ 초대형 3D 포물선 파편 대폭쇄 & 지면 안착 잔해 소산 (위력 75, 30% 확률 풀죽음)", isVerified: true, status: "complete" },
  "hyper-fang": { num: 158, id: "hyper-fang", nameKo: "필살앞니", nameEn: "Hyper Fang", type: "normal", category: "physical", camera: "target", desc: "시전자 후방 웅크림 힘 축적 ➔ 상대방 주위 좌상단 2개 & 우하단 2개 유선형 거대 앞니 대각 대치 ➔ 초고속 대각 교합 쇄도 및 회색 치아 헤드가 서서히 주황빛으로 달아오름 ➔ 격돌 순간 우상단 & 좌하단 만화풍 적색 폭발 구름 폭발 (내외각 글로우 & 하이라이트 배제) ➔ 맞물린 앞니에서 비산하며 점차 작아지는 적색 테두리 알갱이 파티클 폭발적 분출 ➔ 외각 투명 그라데이션 흙먼지 연막 팽창 및 소산 (위력 80, 10% 풀죽음, 5세대 원작 완벽 고증)", isVerified: true, status: "complete" },
  "sharpen": { num: 159, id: "sharpen", nameKo: "각지기", nameEn: "Sharpen", type: "normal", category: "status", camera: "self", desc: "시전자 웅크림 힘 축적 ➔ 몸체 주변을 감싸며 등속 회전하는 3D 사각 큐브 와이어프레임 & 상단 순백 하이라이트와 우측하단 그림자 음영 패싯 ➔ 회전하면서 포켓몬 몸체로 점진적으로 작아지며 압축 수축 ➔ 소형화되며 중심부로 소산 & 공격력 1랭크 상승 스탯 부스트 오라 분출 및 탄성 복귀 (공격 1랭크 상승)", isVerified: true, status: "complete" },
  "conversion": { num: 160, id: "conversion", nameKo: "텍스처", nameEn: "Conversion", type: "normal", category: "status", camera: "self", desc: "시전자 가벼운 호버링 & 사이버네틱 코너 브래킷 및 수평 시안 스캔라인 빔 ➔ 6종 네온 타입 UV 텍스처 패싯이 나선형으로 몸체 속에 흡수 래핑 ➔ 변환 완료! 눈부신 순백 다이아몬드 글린트 & 홀로그램 사이버 쇼크웨이브 링 & 8방향 네온 큐브 파편 분출 ➔ 잔여 비트 파티클 승화 및 탄성 복귀 (첫 번째 기술의 타입으로 변환)", isVerified: false, status: "complete" },
  "tri-attack": { num: 161, id: "tri-attack", nameKo: "트라이어택", nameEn: "Tri Attack", type: "normal", category: "special", camera: "target", desc: "전장 암전 ➔ 시전자 주위 3차원 궤도로 파란색·노란색·빨간색 삼원소 불꽃이 짧은 불씨에서 시작해 회전 가속과 함께 점차 길게 신장 ➔ 상대방 클로즈업(1.38x) ➔ 외곽 그라데이션 삼색 에너지 구체(화염·전격·빙결) 순차 발사 ➔ 3연속 직격(1타: 화염 폭발 / 2타: 중심에서 사방으로 뻗는 날카로운 테이퍼드 벼락 방전 / 3타: 3D 다면체 빙석 군집 강타 및 사방 비산 & 체력 감소) ➔ 원복 안정화 (20% 확률 화상·마비·얼음)", isVerified: true, status: "complete" },
  "super-fang": { num: 162, id: "super-fang", nameKo: "분노의앞니", nameEn: "Super Fang", type: "normal", category: "physical", camera: "caster_to_target", desc: "시전 포켓몬 좌우 분노 진동 & 붉게 발열 ➔ 카메라 상대방 글라이드 포커싱 ➔ 필살앞니 기반 붉은 앞니 초고속 교합(무는 것만 빠르게!) ➔ 붉은 만화풍 폭발 구름 & 14방향 붉은 루비 알갱이 분출 & 붉은 연막 구름 팽창 및 소산 (상대 현재 HP 50% 고정 데미지)", isVerified: true, status: "complete" },
  "slash": { num: 163, id: "slash", nameKo: "베어가르기", nameEn: "Slash", type: "normal", category: "physical", camera: "target", desc: "시전자 발도 및 도약 추진 (시전자 발광 배제) ➔ 상대방을 향해 찰나의 초고속 돌진 ➔ 상대 전면에 양 끝단이 0px 바늘 끝으로 예리하게 빠지는 레몬 옐로우 & 순백 코어 거대 일체형 참격호 쇄도 ➔ 중심 순백 & 연분홍 림 타격 스타버스트 폭발 ➔ 라임/골드 스파크 비산 ➔ 피격자 묵직한 넉백 후 탄성 복귀 (원작 레퍼런스 1:1 완벽 고증)", isVerified: true, status: "complete" },
  "substitute": { num: 164, id: "substitute", nameKo: "대타출동", nameEn: "Substitute", type: "normal", category: "status", camera: "self", desc: "시전포켓몬 화면 밖으로 가속 미끄러져 퇴장 (아군은 좌측 밖 / 상대는 우측 밖) ➔ 원래 자리에 펑!! 카툰풍 몽글몽글 연기구름 폭발 & 소환 스파클 ➔ 연기 속에서 대타출동 인형(아군: 뒷모습 인형 / 상대: 앞모습 인형) 쨘! 등장 & 도약 ➔ 지면 쿵 착지 스쿼시 & 통! 탄성 리바운드 안착 (최대 HP 25% 소모하여 분신 생성)", isVerified: true, status: "complete" },
  "struggle": { num: 165, id: "struggle", nameKo: "발버둥", nameEn: "Struggle", type: "normal", category: "physical", camera: "caster_to_target", desc: "시전 포켓몬 좌우 각도 격렬하게 흔들흔들 (발버둥 모션) ➔ 카메라 타겟 포커싱 ➔ 서로 다른 3곳 위치에 순차적으로 몸통박치기 타격 이펙트 직격 (1타: 좌상단 / 2타: 우하단 / 3타: 중앙 피니시 & 반동 피해)", isVerified: true, status: "complete" },
  "sketch": { num: 166, id: "sketch", nameKo: "스케치", nameEn: "Sketch", type: "normal", category: "status", camera: "caster_to_target", desc: "시전 포켓몬 전방 과감한 돌진 ➔ 카메라 타겟 포커싱 ➔ 타겟 앞 우든 이젤 & 캔버스 탄성 팝업 ➔ 브러시의 역동적인 스케치 드로잉 & 컬러 워시 채색 ➔ 피니시 백색 섬광 & 비비드 4색 페인트 스플래시 & 스타버스트 폭발 ➔ 캔버스 페이드아웃 및 안착", isVerified: true, status: "complete" },
  "triple-kick": { num: 167, id: "triple-kick", nameKo: "트리플킥", nameEn: "Triple Kick", type: "fighting", category: "physical", camera: "target", desc: "시전자 후방 웅크림 힘 축적 ➔ 1타 전방 도약 하단 스냅 킥(우상향 아크 & 0.95x 발바닥 스탬프 & 주황 십자 섬광) ➔ 공중 180° 피벗 다리 전환 ➔ 2타 상단 하이스핀 킥(하향 스핀 아크 & 1.30x 발바닥 스탬프 & 1프레임 섬광 & 다이아몬드 버스트) ➔ 공중 360° 서머솔트 회전 힘 응축 ➔ 3타 피니시 급강하 풀파워 드롭 킥 쾅!!(순백 섬광 & 초대형 초승달 아크 & 55° 1.80x 초대형 발바닥 & 8방향 플레어 & 파이팅 스파클 폭발 & 최대 넉백) ➔ 공중제비 착지 및 안정 복귀 (연속 3타, 위력 10➔20➔30)", isVerified: true, status: "complete" },
  "thief": { num: 168, id: "thief", nameKo: "도둑질", nameEn: "Thief", type: "dark", category: "physical", camera: "target", desc: "상대 포커싱 ➔ 대상 포켓몬 스프라이트 위에 좁은 범위의 회색 연막 피어오름 ➔ 대상 포켓몬 회색화(그레이스케일) & 피격 직격 ➔ 좀 더 어두운 회색 연기가 살짝 다각도로 퍼짐 ➔ 대상에게서 작은 순백 구체 생성 및 시전 포켓몬에게로 유려한 포물선 비행 & 쏙 안착 흡수 완료 (상대의 도구를 훔침)", isVerified: true, status: "complete" },
  "spider-web": { num: 169, id: "spider-web", nameKo: "거미집", nameEn: "Spider Web", type: "bug", category: "status", camera: "target", desc: "시전자 웅크림 힘 축적 & 은백색 실크 에너지 응축 ➔ 10% 암전 & 실뿜기 기반 2가닥 투명한 직선 실 초고속 발사 ➔ 상대 전면에 끝단이 바늘처럼 날카로운 8방향 방사선 & 4단 동심 다각형 거미줄 폭발적 전개 ➔ 거미줄의 팽팽한 장력 수축 진동 & 순백 스파클 록다운 결박 ➔ 완전 결박 고정 및 점착 페이드아웃 (도주 및 교체 불가)", isVerified: true, status: "complete" },
  "mind-reader": { num: 170, id: "mind-reader", nameKo: "마음의눈", nameEn: "Mind Reader", type: "normal", category: "status", camera: "target", desc: "전장 암전 ➔ 상대방 포켓몬 타겟 포커싱 ➔ 대상 주변 은은한 반투명 역장 구체 형성 ➔ 마음의 눈 개안(안구 흰자 & 적갈색 홍채 & 칠흑 동공 1:1 고증) ➔ 움직임 완전 간파 및 깔끔한 페이드아웃 (다음 턴 필중)", isVerified: true, status: "complete" },
  "nightmare": { num: 171, id: "nightmare", nameKo: "악몽", nameEn: "Nightmare", type: "ghost", category: "status", camera: "target", desc: "암전(어두움 100%, 대상 포켓몬 제외) ➔ 갑작스럽게 나타나는 사이코키네시스 배경필터(비틀림/소용돌이 왜곡 효과) ➔ 악몽 각인 및 페이드아웃 (수면 중인 적 매턴 최대 HP 1/4 감소)", isVerified: true, status: "complete" },
  "flame-wheel": { num: 172, id: "flame-wheel", nameKo: "화염바퀴", nameEn: "Flame Wheel", type: "fire", category: "physical", camera: "target", desc: "시전자 제자리 반시계 회전(2D 기준) ➔ 회전하면서 화염 잔상 발생 & 3D 화염바퀴(Flame Wheel) 완성 ➔ 회전을 유지하며 상대에게 맹렬히 돌진 (지면 타오르는 궤적 & 후방 제트 화염) ➔ 상대 정면 격돌 직격 & 화염 폭발과 사방 비산 불꽃 파편 (위력 60, 10% 화상)", isVerified: true, status: "complete" },
  "snore": { num: 173, id: "snore", nameKo: "코골기", nameEn: "Snore", type: "normal", category: "special", camera: "caster_to_target", desc: "수면 들숨 & 살짝 파란빛어두운 암전 ➔ 울부짖기 기반 3D 원추형 반투명 파장(네온 로열 블루 외곽 림 + 딥 바이올렛 반투명 몸체) 초고속 전진 사출 ➔ 카메라 타겟 포커싱 & 상대 면전 3D 반투명 파장 관통 ➔ 전방으로 파장 부드러운 소산 및 암전 해제 ➔ 시전자 태평한 단잠 복귀 (잠듦 상태 전용 기술, 위력 50, 특수)", isVerified: true, status: "complete" },
  "curse": { num: 174, id: "curse", nameKo: "저주 (일반)", nameEn: "Curse (Normal)", type: "ghost", category: "status", camera: "self", desc: "시전자 살짝 납작해지며 좌우 수직 이동 후 원래자리 복귀 ➔ 랭크 다운(스피드 -1) ➔ 랭크 업(공격/방어 +1) 순차 재생", isVerified: true, status: "complete" },
  "curse-ghost": { num: 174, id: "curse-ghost", nameKo: "저주 (고스트)", nameEn: "Curse (Ghost)", type: "ghost", category: "status", camera: "caster_to_target", desc: "칠흑 보랏빛 암전 ➔ 저주의 대못 소환 ➔ 대못이 시전자에게 내리꽂혀 최대 HP 50% 희생 ➔ 카메라 타겟 글라이드 ➔ 원혼 그림자 쇄도 & 상대 가슴에 저주의 대못 직격 ➔ 도깨비불 3기 포위 (매턴 상대 최대 HP 1/4 감소)", isVerified: true, status: "complete", isSpecialVariant: true, specialType: "variant" },
  "curse-damage": { num: 174, id: "curse-damage", nameKo: "저주 (데미지)", nameEn: "Curse (Damage)", type: "ghost", category: "status", camera: "target", desc: "턴 종료 시 저주에 걸린 대상이 1/4 최대 HP 피해를 입을 때의 전용 연출: 가슴팍 검정 원 & 대못 출현 ➔ 쿵! 깊숙이 박히며 1/4 체력 감소 & 피격 전율", isVerified: true, status: "complete", isSpecialVariant: true, specialType: "variant" },
  "aeroblast": { num: 177, id: "aeroblast", nameKo: "에어로블라스트", nameEn: "Aeroblast", type: "flying", category: "special", camera: "target", desc: "풍압 집약 & 대기압 왜곡 차징 ➔ 전장을 가로지르는 초고속 3D 나선형 볼텍스 캐논(순백 심선 & 이중 나선 회오리 리본 & 마하 충격파 링) 폭발적 사출 ➔ 상대 직격 착탄 & 상공으로 솟구치는 거대 회오리바람 기둥 분출 & 진공 참격 칼날 난타 ➔ 대기 파열 십자 섬광 & 초고압 대폭발 (급소율 1랭크 증가, 루기아 전용기)", isVerified: true, status: "complete" },
  "perk-hug": { num: 999, id: "perk-hug", nameKo: "포옹 (🫂 특수 연출)", nameEn: "Embrace / Hug", type: "normal", category: "status", camera: "self", desc: "내 포켓몬이 전면 상태로 카메라 앞까지 통통 뛰어와 1초간 안아준 뒤 복귀", isVerified: false, isSpecialVariant: true, specialType: "cutscene" },
};

function buildAllMovesList(): VerifiedMoveItem[] {
  const result: VerifiedMoveItem[] = [];

  // 1. 조우 연출 (num: 0, 검수완료)
  if (HANDCRAFTED_MAP["encounter-entry"]) {
    result.push({
      ...HANDCRAFTED_MAP["encounter-entry"],
      power: null,
      accuracy: null,
      pp: null,
      description: "야생 포켓몬 조우 및 '야생의 OO(이)가 나타났다!' 대사 등장 배틀 컷씬입니다.",
      descriptionEn: "Battle encounter cutscene where a wild Pokémon appears with an encounter message.",
      makesContact: false,
    });
  }

  // 2. 1번부터 919번까지 순서대로 정렬하여 등록
  const sortedOfficialMoves = Object.values(MOVES_DATA).sort((a, b) => a.id - b.id);

  for (const m of sortedOfficialMoves) {
    const rawOfficial = MOVES_DATA[m.name];
    const contact = getMoveContact(m.category, m.name);

    const isCompleted = m.id <= 99;

    if (HANDCRAFTED_MAP[m.name]) {
      const hc = HANDCRAFTED_MAP[m.name];
      const finalVerified = hc.isVerified !== undefined ? hc.isVerified : isCompleted;
      const finalStatus = hc.status || (isCompleted ? "complete" : (finalVerified ? "visual_done" : "testing"));
      result.push({
        ...hc,
        isVerified: finalVerified,
        status: finalStatus,
        power: rawOfficial?.power ?? null,
        accuracy: rawOfficial?.accuracy ?? null,
        pp: rawOfficial?.pp ?? null,
        description: rawOfficial?.description || hc.desc,
        descriptionEn: rawOfficial?.descriptionEn || "",
        makesContact: getMoveContact(hc.category, m.name),
      });
    } else {
      const isStatus = m.category === "status";
      const isDebuff = m.description.includes("떨어") || m.description.includes("낮춘") || m.description.includes("감소");
      const camera = isStatus ? (isDebuff ? "none" : "self") : "target";

      result.push({
        num: m.id,
        id: m.name,
        nameKo: m.nameKo,
        nameEn: toTitleCase(m.name),
        type: m.type,
        category: m.category,
        camera,
        desc: m.description,
        power: rawOfficial?.power ?? null,
        accuracy: rawOfficial?.accuracy ?? null,
        pp: rawOfficial?.pp ?? null,
        description: rawOfficial?.description || m.description,
        descriptionEn: rawOfficial?.descriptionEn || "",
        makesContact: contact,
        isVerified: isCompleted,
        status: isCompleted ? "complete" : "testing",
      });
    }

    // 12번 길로틴 바로 뒤에 상대 시전 버전 삽입
    if (m.id === 12 && HANDCRAFTED_MAP["guillotine-enemy"]) {
      const hc = HANDCRAFTED_MAP["guillotine-enemy"];
      result.push({
        ...hc,
        status: "complete",
        power: null, // 일격필살
        accuracy: 30,
        pp: 5,
        description: rawOfficial?.description || hc.desc,
        descriptionEn: rawOfficial?.descriptionEn || "",
        makesContact: true,
      });
    }
    // 32번 뿔드릴 바로 뒤에 상대 시전 버전 삽입
    if (m.id === 32 && HANDCRAFTED_MAP["horn-drill-enemy"]) {
      const hc = HANDCRAFTED_MAP["horn-drill-enemy"];
      result.push({
        ...hc,
        status: "complete",
        power: null, // 일격필살
        accuracy: 30,
        pp: 5,
        description: rawOfficial?.description || hc.desc,
        descriptionEn: rawOfficial?.descriptionEn || "",
        makesContact: true,
      });
    }
    // 76번 솔라빔 바로 뒤에 1턴 충전 버전 삽입
    if (m.id === 76 && HANDCRAFTED_MAP["solar-beam-charge"]) {
      const hc = HANDCRAFTED_MAP["solar-beam-charge"];
      result.push({
        ...hc,
        status: "complete",
        power: null,
        accuracy: null,
        pp: 10,
        description: "1턴째에 빛을 가득 모아 2턴째에 빛의 다발을 발사하여 공격한다. (1턴 충전 연출)",
        descriptionEn: "Charges sunlight on turn 1 before unleashing the beam on turn 2.",
        makesContact: false,
      });
    }
    // 117번 참기 바로 뒤에 참기 (참기) 버전 삽입
    if (m.id === 117 && HANDCRAFTED_MAP["bide-charge"]) {
      const hc = HANDCRAFTED_MAP["bide-charge"];
      result.push({
        ...hc,
        isVerified: true,
        status: "complete",
        power: null,
        accuracy: null,
        pp: 10,
        description: "공격을 견뎌 입은 데미지를 축적한다. (참기 연출)",
        descriptionEn: "Endures attacks and stores energy.",
        makesContact: false,
      });
    }
    // 130번 로켓박치기 바로 뒤에 1턴 충전 버전 삽입
    if (m.id === 130 && HANDCRAFTED_MAP["skull-bash-charge"]) {
      const hc = HANDCRAFTED_MAP["skull-bash-charge"];
      result.push({
        ...hc,
        isVerified: true,
        status: "complete",
        power: null,
        accuracy: null,
        pp: 10,
        description: "1턴째에 머리를 움츠려 방어를 올린다. 머리 둘레의 압축 링과 황금빛 모래먼지 오라 (1턴 충전 연출, 방어 +1)",
        descriptionEn: "Tucks in its head to raise Defense on turn 1. Compression ring and billowing sand dust aura.",
        makesContact: false,
      });
    }
    // 143번 불새 바로 뒤에 1턴 충전 버전 삽입
    if (m.id === 143 && HANDCRAFTED_MAP["sky-attack-charge"]) {
      const hc = HANDCRAFTED_MAP["sky-attack-charge"];
      result.push({
        ...hc,
        isVerified: false,
        status: "complete",
        power: null,
        accuracy: null,
        pp: 5,
        description: "1턴째에 짙은 암전 속에서 시전자 좌우로 푸른 불꽃들이 날개 형태로 타오른다. (1턴 충전 연출)",
        descriptionEn: "Cloaked in a harsh light on turn 1.",
        makesContact: false,
      });
    }
    // 174번 저주 바로 뒤에 고스트 버전 및 데미지 버전 삽입
    if (m.id === 174 && HANDCRAFTED_MAP["curse-ghost"]) {
      const hc = HANDCRAFTED_MAP["curse-ghost"];
      result.push({
        ...hc,
        isVerified: true,
        status: "complete",
        power: null,
        accuracy: null,
        pp: 10,
        description: "시전자가 고스트 타입일 때: 최대 HP의 50%를 깎아 상대에게 매 턴 최대 HP 1/4을 깎는 저주를 건다.",
        descriptionEn: "Ghost-type variant: Cuts 1/2 max HP to lay a curse on the target.",
        makesContact: false,
      });
    }
    if (m.id === 174 && HANDCRAFTED_MAP["curse-damage"]) {
      const hc = HANDCRAFTED_MAP["curse-damage"];
      result.push({
        ...hc,
        isVerified: true,
        status: "complete",
        power: null,
        accuracy: null,
        pp: 10,
        description: "턴 종료 시 저주에 걸린 대상이 1/4 최대 HP 피해를 입을 때의 전용 연출 (검정 원 + 대못 쿵! 타격 & HP 감소)",
        descriptionEn: "Residual damage trigger at turn end: Opponent takes 1/4 max HP damage from the curse.",
        makesContact: false,
      });
    }
  }

  // 3. 특수 연출 (num: 999 perk-hug, 검수중)
  if (HANDCRAFTED_MAP["perk-hug"]) {
    result.push({
      ...HANDCRAFTED_MAP["perk-hug"],
      power: null,
      accuracy: null,
      pp: null,
      description: "내 포켓몬이 다가와 트레이너를 꼭 안아주는 호감도 특수 연출입니다.",
      descriptionEn: "Special affection cutscene where your Pokémon approaches and gives you a warm hug.",
      makesContact: true,
    });
  }

  return result;
}

export const VERIFIED_MOVES: VerifiedMoveItem[] = buildAllMovesList();
