import { MOVES_DATA, MoveData } from "../src/data/movesKo.js";

export interface VerifiedMoveItem {
  num: number;
  id: string;
  nameKo: string;
  nameEn: string;
  type: string;
  category: "physical" | "special" | "status";
  camera: "target" | "self" | "sky" | "none";
  desc: string;
  power?: number | null;
  accuracy?: number | null;
  pp?: number | null;
  description?: string;
  descriptionEn?: string;
  makesContact?: boolean;
  isVerified?: boolean;
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
  "encounter-entry": { num: 0, id: "encounter-entry", nameKo: "야생 포켓몬 조우 (등장)", nameEn: "Wild Encounter Entry", type: "normal", category: "status", camera: "none", desc: "야생 포켓몬 출현 및 '야생의 OO(이)가 나타났다!' 대사 등장", isVerified: true },
  "pound": { num: 1, id: "pound", nameKo: "막치기", nameEn: "Pound", type: "normal", category: "physical", camera: "target", desc: "손이나 꼬리로 상대를 세게 후려쳐 공격", isVerified: true },
  "karate-chop": { num: 2, id: "karate-chop", nameKo: "태권당수", nameEn: "Karate Chop", type: "fighting", category: "physical", camera: "target", desc: "정수리 수직 수도 내려치기", isVerified: true },
  "double-slap": { num: 3, id: "double-slap", nameKo: "연속뺨치기", nameEn: "Double Slap", type: "normal", category: "physical", camera: "target", desc: "좌우 왕복 연속 뺨치기", isVerified: true },
  "comet-punch": { num: 4, id: "comet-punch", nameKo: "연속펀치", nameEn: "Comet Punch", type: "normal", category: "physical", camera: "target", desc: "잔상 혜성 난무 연속 펀치", isVerified: true },
  "mega-punch": { num: 5, id: "mega-punch", nameKo: "메가톤펀치", nameEn: "Mega Punch", type: "normal", category: "physical", camera: "target", desc: "회전 모으기 후 폭발적 메가톤 펀치", isVerified: true },
  "pay-day": { num: 6, id: "pay-day", nameKo: "고양이돈받기", nameEn: "Pay Day", type: "normal", category: "physical", camera: "target", desc: "금화 사출 및 바닥 동전 폭발", isVerified: true },
  "fire-punch": { num: 7, id: "fire-punch", nameKo: "불꽃펀치", nameEn: "Fire Punch", type: "fire", category: "physical", camera: "target", desc: "화염 소용돌이를 두른 불꽃 펀치", isVerified: true },
  "ice-punch": { num: 8, id: "ice-punch", nameKo: "냉동펀치", nameEn: "Ice Punch", type: "ice", category: "physical", camera: "target", desc: "얼음 결정 폭발 냉동 펀치", isVerified: true },
  "thunder-punch": { num: 9, id: "thunder-punch", nameKo: "번개펀치", nameEn: "Thunder Punch", type: "electric", category: "physical", camera: "target", desc: "뇌격 스파크 전기 펀치", isVerified: true },
  "scratch": { num: 10, id: "scratch", nameKo: "할퀴기", nameEn: "Scratch", type: "normal", category: "physical", camera: "target", desc: "3연속 예리한 손톱 베기", isVerified: true },
  "vice-grip": { num: 11, id: "vice-grip", nameKo: "찝기", nameEn: "Vice Grip", type: "normal", category: "physical", camera: "target", desc: "대형 집게 양방향 압착 협공", isVerified: true },
  "guillotine": { num: 12, id: "guillotine", nameKo: "길로틴", nameEn: "Guillotine", type: "normal", category: "physical", camera: "target", desc: "일격필살 대형 집게 참격 & 승리 포즈", isVerified: true },
  "guillotine-enemy": { num: 12, id: "guillotine-enemy", nameKo: "가위자르기 (상대 시전)", nameEn: "Guillotine (Enemy POV)", type: "normal", category: "physical", camera: "target", desc: "상대(적)가 가위자르기 시전 시점 (내 포켓몬 피격 & 처형)", isVerified: true },
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
  "horn-drill-enemy": { num: 32, id: "horn-drill-enemy", nameKo: "뿔드릴 (상대 시전)", nameEn: "Horn Drill (Enemy POV)", type: "normal", category: "physical", camera: "target", desc: "상대(적)가 뿔드릴 시전 시점 (내 포켓몬 피격 & 처형)", isVerified: true },
  "tackle": { num: 33, id: "tackle", nameKo: "몸통박치기", nameEn: "Tackle", type: "normal", category: "physical", camera: "target", desc: "전방 돌진 기본 물리 공격", isVerified: true },
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
  "perk-hug": { num: 999, id: "perk-hug", nameKo: "포옹 (🫂 특수 연출)", nameEn: "Embrace / Hug", type: "normal", category: "status", camera: "self", desc: "내 포켓몬이 전면 상태로 카메라 앞까지 통통 뛰어와 1초간 안아준 뒤 복귀", isVerified: false },
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
      makesContact: false,
    });
  }

  // 2. 1번부터 919번까지 순서대로 정렬하여 등록
  const sortedOfficialMoves = Object.values(MOVES_DATA).sort((a, b) => a.id - b.id);

  for (const m of sortedOfficialMoves) {
    const rawOfficial = MOVES_DATA[m.name];
    const contact = getMoveContact(m.category, m.name);

    if (HANDCRAFTED_MAP[m.name]) {
      const hc = HANDCRAFTED_MAP[m.name];
      result.push({
        ...hc,
        power: rawOfficial?.power ?? null,
        accuracy: rawOfficial?.accuracy ?? null,
        pp: rawOfficial?.pp ?? null,
        description: rawOfficial?.description || hc.desc,
        descriptionEn: rawOfficial?.descriptionEn || "",
        makesContact: getMoveContact(hc.category, m.name),
      });
    } else {
      // 37번 이후 모든 신규 기술은 100% 검수중(isVerified: false)
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
        isVerified: false,
      });
    }

    // 12번 길로틴 바로 뒤에 상대 시전 버전 삽입
    if (m.id === 12 && HANDCRAFTED_MAP["guillotine-enemy"]) {
      const hc = HANDCRAFTED_MAP["guillotine-enemy"];
      result.push({
        ...hc,
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
        power: null, // 일격필살
        accuracy: 30,
        pp: 5,
        description: rawOfficial?.description || hc.desc,
        descriptionEn: rawOfficial?.descriptionEn || "",
        makesContact: true,
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
      makesContact: true,
    });
  }

  return result;
}

export const VERIFIED_MOVES: VerifiedMoveItem[] = buildAllMovesList();
