"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KOREAN_POKEMON_DICT = exports.ABILITY_DETAILED_DESC_EN = exports.ABILITY_DETAILED_DESC_KO = exports.ABILITY_KO_DICT = void 0;
exports.fetchAbilityKoreanName = fetchAbilityKoreanName;
exports.getAbilityDetail = getAbilityDetail;
exports.getAbilityKoreanName = getAbilityKoreanName;
exports.getPokemonSpeciesInfo = getPokemonSpeciesInfo;
exports.getPokemonByDexNumber = getPokemonByDexNumber;
exports.getPokemonPage = getPokemonPage;
exports.getPokemonByQuery = getPokemonByQuery;
var dexCache = new Map();
var nameCache = new Map();
var abilityKoCache = new Map();
var speciesCache = new Map();
// Comprehensive Pokémon 1~9 Gen Ability English to Korean mapping dictionary
exports.ABILITY_KO_DICT = {
    // Gen 1 ~ 3
    "stench": "악취",
    "drizzle": "잔비",
    "speed-boost": "가속",
    "battle-armor": "전투무장",
    "sturdy": "옹골참",
    "damp": "습기",
    "limber": "유연",
    "sand-veil": "모래숨기",
    "static": "정전기",
    "volt-absorb": "축전",
    "water-absorb": "저수",
    "oblivious": "둔감",
    "cloud-nine": "날씨부정",
    "compound-eyes": "복안",
    "insomnia": "불면",
    "color-change": "변색",
    "immunity": "면역",
    "flash-fire": "타오르는불꽃",
    "shield-dust": "인분",
    "own-tempo": "마이페이스",
    "suction-cups": "흡반",
    "intimidate": "위협",
    "shadow-tag": "그림자밟기",
    "rough-skin": "까칠한피부",
    "wonder-guard": "불가사의부적",
    "levitate": "부유",
    "effect-spore": "포자",
    "synchronize": "동기화",
    "clear-body": "클리어바디",
    "natural-cure": "자연회복",
    "lightning-rod": "피뢰침",
    "serene-grace": "하늘의은총",
    "swift-swim": "쓱쓱",
    "chlorophyll": "엽록소",
    "illuminate": "발광",
    "trace": "트레이스",
    "huge-power": "천하장사",
    "poison-point": "독가시",
    "inner-focus": "정신력",
    "magma-armor": "마그마의무장",
    "water-veil": "수의베일",
    "magnet-pull": "자력",
    "soundproof": "방음",
    "rain-dish": "젖은접시",
    "sand-stream": "모래날림",
    "pressure": "프레셔",
    "thick-fat": "두꺼운지방",
    "early-bird": "일찍일어나기",
    "flame-body": "불꽃몸",
    "run-away": "도주",
    "keen-eye": "날카로운눈",
    "hyper-cutter": "괴력집게",
    "pickup": "픽업",
    "truant": "게으름",
    "hustle": "의욕",
    "cute-charm": "헤롱헤롱바디",
    "plus": "플러스",
    "minus": "마이너스",
    "forecast": "기분파",
    "sticky-hold": "점착",
    "shed-skin": "탈피",
    "guts": "근성",
    "marvel-scale": "이상한비늘",
    "liquid-ooze": "해파리포자",
    "overgrow": "심록",
    "blaze": "맹화",
    "torrent": "급류",
    "swarm": "벌레의알림",
    "rock-head": "돌머리",
    "drought": "가뭄",
    "arena-trap": "개미지옥",
    "vital-spirit": "의기양양",
    "white-smoke": "하얀연기",
    "pure-power": "순수한힘",
    "shell-armor": "조개껍질",
    "air-lock": "에어록",
    // Gen 4 ~ 6
    "tangled-feet": "갈지자걸음",
    "motor-drive": "모터드라이브",
    "rivalry": "투쟁심",
    "steadfast": "불굴의마음",
    "snow-cloak": "눈숨기",
    "gluttony": "먹보",
    "anger-point": "분노의경혈",
    "unburden": "곡예",
    "heatproof": "내열",
    "simple": "단순",
    "dry-skin": "건조피부",
    "download": "다운로드",
    "iron-fist": "철주먹",
    "poison-heal": "포이즌힐",
    "adaptability": "적응력",
    "skill-link": "스킬링크",
    "hydration": "촉촉바디",
    "solar-power": "선파워",
    "quick-feet": "속보",
    "normalize": "노말스킨",
    "sniper": "스나이퍼",
    "magic-guard": "매직가드",
    "no-guard": "노가드",
    "stall": "시간벌기",
    "technician": "테크니션",
    "leaf-guard": "리프가드",
    "klutz": "서투름",
    "mold-breaker": "틀깨기",
    "super-luck": "대운",
    "aftermath": "유언",
    "anticipation": "위험예지",
    "forewarn": "예지몽",
    "unaware": "천진",
    "tinted-lens": "색안경",
    "filter": "필터",
    "slow-start": "슬로스타트",
    "scrappy": "배짱",
    "storm-drain": "마중물",
    "ice-body": "아이스바디",
    "solid-rock": "하드록",
    "snow-warning": "눈퍼뜨리기",
    "honey-gather": "꿀모으기",
    "frisk": "통찰",
    "reckless": "이판사판",
    "multitype": "멀티타입",
    "flower-gift": "플라워기프트",
    "bad-dreams": "나이트메어",
    "pickpocket": "소매치기",
    "sheer-force": "우격다짐",
    "contrary": "심술꾸러기",
    "unnerve": "긴장감",
    "defiant": "오기",
    "defeatist": "무기력",
    "cursed-body": "저주의바디",
    "healer": "치유의마음",
    "friend-guard": "프렌드가드",
    "weak-armor": "깨어진갑옷",
    "heavy-metal": "헤비메탈",
    "light-metal": "라이트메탈",
    "multiscale": "멀티스케일",
    "toxic-boost": "독폭주",
    "flare-boost": "열폭주",
    "harvest": "수확",
    "telepathy": "텔레파시",
    "moody": "변덕쟁이",
    "overcoat": "방진",
    "poison-touch": "독수",
    "regenerator": "재생력",
    "big-pecks": "부풀린가슴",
    "sand-rush": "모래헤치기",
    "wonder-skin": "미라클스킨",
    "analytic": "애널라이즈",
    "illusion": "일루전",
    "imposter": "괴짜",
    "infiltrator": "틈새포착",
    "mummy": "미라",
    "moxie": "자기과신",
    "justified": "정의의마음",
    "rattled": "주눅",
    "magic-bounce": "매직미러",
    "sap-sipper": "초식",
    "prankster": "짓궂은마음",
    "sand-force": "모래의힘",
    "iron-barbs": "철가시",
    "zen-mode": "달마모드",
    "victory-star": "승리의별",
    "turboblaze": "터보블레이즈",
    "teravolt": "테라볼티지",
    "aroma-veil": "아로마베일",
    "sweet-veil": "스위트베일",
    "flower-veil": "플라워베일",
    "cheek-pouch": "볼주머니",
    "protean": "변환자재",
    "fur-coat": "퍼코트",
    "magician": "매지션",
    "bulletproof": "방탄",
    "competitive": "승기",
    "strong-jaw": "옹골찬턱",
    "refrigerate": "프리즈스킨",
    "stance-change": "배틀스위치",
    "gale-wings": "질풍날개",
    "mega-launcher": "메가런처",
    "grass-pelt": "풀모피",
    "symbiosis": "공생",
    "tough-claws": "단단한발톱",
    "pixilate": "페어리스킨",
    "gooey": "미끈미끈",
    "aerilate": "스카이스킨",
    "parental-bond": "부자유친",
    "dark-aura": "다크오라",
    "fairy-aura": "페어리오라",
    "aura-break": "오라브레이크",
    "primordial-sea": "시작의바다",
    "desolate-land": "끝의대지",
    "delta-stream": "델타스트림",
    // Gen 7 ~ 9
    "stamina": "지구력",
    "wimp-out": "도망태세",
    "emergency-exit": "위기회피",
    "water-compaction": "수분응축",
    "merciless": "무자비",
    "shields-down": "리밋실드",
    "stakeout": "잠복",
    "water-bubble": "수포",
    "steelworker": "강철술사",
    "berserk": "발끈",
    "slush-rush": "눈치우기",
    "long-reach": "원격",
    "liquid-voice": "촉촉보이스",
    "triage": "우선치료",
    "galvanize": "일렉트릭스킨",
    "surge-surfer": "서핑비트",
    "schooling": "어군",
    "disguise": "탈",
    "battle-bond": "유대변화",
    "power-construct": "스웜체인지",
    "corrosion": "부식",
    "comatose": "절대수면",
    "queenly-majesty": "여왕의위엄",
    "innards-out": "내용물분출",
    "dancer": "무희",
    "battery": "배터리",
    "fluffy": "폭신폭신",
    "dazzling": "비비드바디",
    "soul-heart": "소울하트",
    "tangling-hair": "컬리헤어",
    "receiver": "리시버",
    "power-of-alchemy": "연금술",
    "beast-boost": "비스트부스트",
    "rks-system": "AR시스템",
    "electric-surge": "일렉트릭메이커",
    "psychic-surge": "사이코메이커",
    "misty-surge": "미스트메이커",
    "grassy-surge": "그래스메이커",
    "full-metal-body": "메탈프로텍트",
    "shadow-shield": "스펙터가드",
    "prism-armor": "프리즘아머",
    "neuroforce": "브레인포스",
    "intrepid-sword": "불요의검",
    "dauntless-shield": "불굴의방패",
    "libero": "리베로",
    "ball-fetch": "볼줍기",
    "cotton-down": "솜털",
    "propeller-tail": "스크루지느러미",
    "mirror-armor": "미러아머",
    "gasping-breath": "깊은숨결",
    "stalwart": "굳은신념",
    "steely-spirit": "강철정신",
    "perish-body": "멸망의바디",
    "wandering-spirit": "헤매는영혼",
    "gorilla-tactics": "고릴라전술",
    "neutralizing-gas": "화학변화가스",
    "pastel-veil": "파스텔베일",
    "hunger-switch": "배고픔스위치",
    "quick-draw": "퀵드로",
    "unseen-fist": "보이지않는주먹",
    "curious-medicine": "기묘한약",
    "transistor": "트랜지스터",
    "dragons-maw": "용의턱",
    "chilling-neigh": "백의울음",
    "grim-neigh": "흑의울음",
    "as-one-glastrier": "인마일체",
    "as-one-spectrier": "인마일체",
    "lingering-aroma": "가시지않는향기",
    "seed-sower": "씨뿌리기",
    "thermal-exchange": "열교환",
    "anger-shell": "분노의껍질",
    "purifying-salt": "정화의소금",
    "well-baked-body": "노릇노릇바디",
    "wind-rider": "바람타기",
    "guard-dog": "파수견",
    "rocky-payload": "바위나르기",
    "wind-power": "풍력발전",
    "mycelium-might": "균사의힘",
    "sharpness": "예리함",
    "supreme-overlord": "총대장",
    "costar": "협력",
    "toxic-debris": "독치장",
    "armor-tail": "테일아머",
    "earth-eater": "흙먹기",
    "opportunist": "찰나의틈",
    "cud-chew": "되새김질",
    "commander": "사령탑",
    "electromorphosis": "전기엔진",
    "protosynthesis": "고대활성",
    "quark-drive": "쿼크차지",
    "good-as-gold": "황금몸",
    "vessel-of-ruin": "재앙의그릇",
    "sword-of-ruin": "재앙의검",
    "tablets-of-ruin": "재앙의목간",
    "beads-of-ruin": "재앙의구슬",
    "orichalcum-pulse": "진홍빛고동",
    "hadron-engine": "하드론엔진",
    "supersweet-syrup": "감미로운꿀",
    "hospitality": "대접",
    "toxic-chain": "독사슬",
    "mind-s-eye": "심안",
    "embody-aspect": "화덕의가면",
    "tera-shift": "테라스텔라",
    "tera-shell": "테라셸",
    "teraform-zero": "제로포밍",
    "poison-puppeteer": "독조종",
};
function fetchAbilityKoreanName(rawName) {
    return __awaiter(this, void 0, void 0, function () {
        var key, res, data, koEntry, _a, formatted;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    key = rawName.toLowerCase().replace(/[\s_]+/g, "-");
                    if (exports.ABILITY_KO_DICT[key])
                        return [2 /*return*/, exports.ABILITY_KO_DICT[key]];
                    if (abilityKoCache.has(key))
                        return [2 /*return*/, abilityKoCache.get(key)];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("https://pokeapi.co/api/v2/ability/".concat(key))];
                case 2:
                    res = _b.sent();
                    if (!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _b.sent();
                    koEntry = (data.names || []).find(function (n) { var _a; return ((_a = n.language) === null || _a === void 0 ? void 0 : _a.name) === "ko"; });
                    if (koEntry && koEntry.name) {
                        abilityKoCache.set(key, koEntry.name);
                        return [2 /*return*/, koEntry.name];
                    }
                    _b.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    _a = _b.sent();
                    return [3 /*break*/, 6];
                case 6:
                    formatted = rawName.split(/[\s_-]+/).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
                    abilityKoCache.set(key, formatted);
                    return [2 /*return*/, formatted];
            }
        });
    });
}
var abilityDetailCache = new Map();
// Enhanced Numerical & Competitive Ability Descriptions (Korean & English)
exports.ABILITY_DETAILED_DESC_KO = {
    "hustle": "공격은 높지만 [1.5배(50%) 상승] 빗나가기 [명중률 20% 하락] 쉽다.",
    "huge-power": "자신의 물리 공격의 위력이 올라간다. [실수치 2.0배(100% 상승)]",
    "pure-power": "자신의 물리 공격의 위력이 올라간다. [실수치 2.0배(100% 상승)]",
    "speed-boost": "매 턴 스피드가 올라간다. [매 턴 종료 시 스피드 +1랭크(1.5배 -> 2.0배...)]",
    "technician": "위력이 낮은 기술의 위력을 높여서 공격한다. [위력 60 이하 기술 1.5배(50%) 상승]",
    "overgrow": "위급할 때 풀타입 기술의 위력이 올라간다. [HP 1/3 이하 시 풀 기술 위력 1.5배]",
    "blaze": "위급할 때 불꽃타입 기술의 위력이 올라간다. [HP 1/3 이하 시 불꽃 기술 위력 1.5배]",
    "torrent": "위급할 때 물타입 기술의 위력이 올라간다. [HP 1/3 이하 시 물 기술 위력 1.5배]",
    "swarm": "위급할 때 벌레타입 기술의 위력이 올라간다. [HP 1/3 이하 시 벌레 기술 위력 1.5배]",
    "adaptability": "타입과 일치하는 기술의 위력이 더욱 올라간다. [자속 보정 1.5배 -> 2.0배]",
    "sheer-force": "추가 효과가 있는 기술을 높은 위력으로 쓴다. [추가 효과 소멸 대신 위력 1.3배(30%) 상승]",
    "tough-claws": "직접 공격하는 기술의 위력이 올라간다. [직접 접촉기 위력 1.3배(30%) 상승]",
    "strong-jaw": "턱을 써서 무는 기술의 위력이 올라간다. [물기 기술 위력 1.5배(50%) 상승]",
    "mega-launcher": "파동 기술의 위력이 올라간다. [파동 및 포 기술 위력 1.5배(50%) 상승]",
    "iron-fist": "펀치 기술의 위력이 올라간다. [펀치 기술 위력 1.2배(20%) 상승]",
    "sharpness": "베기 기술의 위력이 올라간다. [베기 기술 위력 1.5배(50%) 상승]",
    "regenerator": "다른 포켓몬으로 교체하면 HP가 회복된다. [교체 시 최대 HP의 33.3%(1/3) 회복]",
    "multiscale": "HP가 꽉 찼을 때 받는 대미지가 줄어든다. [피해량 50%(반감) 감소]",
    "shadow-shield": "HP가 꽉 찼을 때 받는 대미지가 줄어든다. [피해량 50%(반감) 감소]",
    "fluffy": "직접 공격의 대미지를 반감하지만 불꽃 공격은 2배가 된다. [접촉기 50% 감소 / 불꽃 2.0배]",
    "poison-heal": "독 상태가 되면 대미지 대신 HP가 회복된다. [매 턴 최대 HP의 12.5%(1/8) 회복]",
    "magic-guard": "직접 공격 외의 대미지를 받지 않는다. [날씨/상태이상/스락/반동 피해 무효]",
    "intimidate": "배틀에 나오면 상대의 공격을 떨어뜨린다. [등장 시 상대 공격 -1랭크(2/3배)]",
    "moxie": "상대를 쓰러뜨리면 공격이 올라간다. [상대 격파 시 공격 +1랭크(1.5배)]",
    "beast-boost": "상대를 쓰러뜨릴 때마다 가장 높은 능력이 올라간다. [격파 시 최고 스탯 +1랭크]",
    "chilling-neigh": "상대를 쓰러뜨리면 공격이 올라간다. [상대 격파 시 공격 +1랭크]",
    "grim-neigh": "상대를 쓰러뜨리면 특수공격이 올라간다. [상대 격파 시 특공 +1랭크]",
    "soul-heart": "포켓몬이 쓰러질 때마다 특수공격이 올라간다. [필드 포켓몬 기절 시 특공 +1랭크]",
    "defiant": "상대에 의해 능력치가 떨어지면 공격이 크게 올라간다. [능력치 하락 시 공격 +2랭크(2.0배)]",
    "competitive": "상대에 의해 능력치가 떨어지면 특수공격이 크게 올라간다. [능력치 하락 시 특공 +2랭크(2.0배)]",
    "contrary": "능력 변화의 상승과 하락이 반대로 적용된다. [랭크업 -> 랭크다운 / 랭크다운 -> 랭크업]",
    "prankster": "자신의 변화 기술을 먼저 쓸 수 있다. [변화 기술 우선도 +1 (악타입 대상 무효)]",
    "guts": "상태이상이 되면 공격이 올라가며 화상 페널티를 무시한다. [공격 1.5배(50%) 상승]",
    "marvel-scale": "상태이상이 되면 방어가 올라간다. [방어 1.5배(50%) 상승]",
    "quick-feet": "상태이상이 되면 스피드가 올라가며 마비 페널티를 무시한다. [스피드 1.5배(50%) 상승]",
    "toxic-boost": "독 상태가 되면 물리 공격의 위력이 올라간다. [물리 기술 위력 1.5배(50%) 상승]",
    "flare-boost": "화상 상태가 되면 특수 공격의 위력이 올라간다. [특수 기술 위력 1.5배(50%) 상승]",
    "drizzle": "배틀에 나오면 비를 내리게 한다. [등장 시 5턴간 비 소환 (물 기술 1.5배 / 불꽃 반감)]",
    "drought": "배틀에 나오면 햇살을 강하게 비춘다. [등장 시 5턴간 쾌청 소환 (불꽃 기술 1.5배 / 물 반감)]",
    "sand-stream": "배틀에 나오면 모래바람을 일으킨다. [등장 시 5턴간 모래바람 (바위타입 특방 1.5배)]",
    "snow-warning": "배틀에 나오면 눈을 내리게 한다. [등장 시 5턴간 설경 소환 (얼음타입 방어 1.5배)]",
    "electric-surge": "배틀에 나오면 일렉트릭필드를 깐다. [등장 시 5턴간 전기필드 (전기 기술 1.3배)]",
    "grassy-surge": "배틀에 나오면 그래스필드를 깐다. [등장 시 5턴간 풀필드 (풀 기술 1.3배 / 매턴 HP 1/16 회복)]",
    "psychic-surge": "배틀에 나오면 사이코필드를 깐다. [등장 시 5턴간 사이코필드 (에스퍼 기술 1.3배 / 선공기 무효)]",
    "misty-surge": "배틀에 나오면 미스트필드를 깐다. [등장 시 5턴간 안개필드 (드래곤 피해 반감 / 상태이상 방지)]",
    "supreme-overlord": "쓰러진 아군이 많을수록 기술 위력이 올라간다. [쓰러진 아군 1마리당 위력 +10% (최대 +50%)]",
    "protosynthesis": "쾌청 날씨이거나 부스트에너지를 지니면 가장 높은 능력이 올라간다. [최고 스탯 1.3배 (스피드는 1.5배)]",
    "quark-drive": "일렉트릭필드이거나 부스트에너지를 지니면 가장 높은 능력이 올라간다. [최고 스탯 1.3배 (스피드는 1.5배)]",
    "unaware": "상대의 랭크 변화를 무시하고 공격하거나 방어한다. [상대의 공/방/특공/특방 랭크업 무시]",
    "simple": "자신의 랭크 변화 수치가 2배로 적용된다. [1랭크 상승/하락 ➡️ 2랭크 상승/하락]",
    "analytic": "상대보다 나중에 공격하면 기술의 위력이 올라간다. [후공 시 위력 1.3배(30%) 상승]",
    "infiltrator": "상대의 장막과 대타출동을 통과하여 공격한다. [리플렉터/빛의장막/오로라베일/대타 무시]",
    "levitate": "땅에 떠 있어서 땅타입 공격을 받지 않는다. [땅타입 공격 / 압정로드 / 필드 효과 무효]",
    "water-bubble": "물 기술 위력이 2배가 되고 불꽃 피해를 반감하며 화상에 걸리지 않는다. [물 2.0배 / 불꽃 50%]",
    "fur-coat": "물리 기술로 받는 대미지가 절반이 된다. [물리 방어력 실수치 2.0배(100% 상승)]",
    "ice-scales": "특수 기술로 받는 대미지가 절반이 된다. [특수 대미지 50% 반감]",
    "wonder-guard": "효과가 굉장한 약점 기술 외에는 대미지를 받지 않는다. [2배 이상 약점 외 모든 직접공격 무효]",
    "oblivious": "헤롱헤롱과 도발 상태가 되지 않는다. [유혹 / 도발 / 헤롱헤롱 면역]",
    "own-tempo": "혼란 상태가 되지 않고 위협을 무시한다. [혼란 및 위협 면역]",
    "immunity": "독 상태가 되지 않는다. [독 및 맹독 면역]",
    "limber": "마비 상태가 되지 않는다. [마비 면역]",
    "insomnia": "잠듦 상태가 되지 않는다. [수면 및 하품 면역]",
    "vital-spirit": "잠듦 상태가 되지 않는다. [수면 및 하품 면역]",
    "water-veil": "화상 상태가 되지 않는다. [화상 면역]",
    "magma-armor": "얼음 상태가 되지 않는다. [동빙 면역]",
    "sturdy": "일격필살 기술을 무효화하며 HP가 가득 찼을 때 기절할 공격을 버틴다. [기합의띠 효과]",
    "serene-grace": "기술의 추가 효과가 나타날 확률이 2배가 된다. [풀죽음/상태이상 발동률 2배]",
    "reckless": "반동 대미지를 받는 기술의 위력이 올라간다. [반동 공격기 위력 1.2배(20%) 상승]",
    "rock-head": "공격을 가해도 반동 대미지를 받지 않는다. [반동 피해 완전 무효]",
    "magic-bounce": "자신이 받는 변화 기술을 상대에게 되받아친다. [스락/하품/도발/상태이상 반사]",
    "chlorophyll": "날씨가 맑을 때 스피드가 2배가 된다. [쾌청 시 스피드 2.0배(100% 상승)]",
    "swift-swim": "날씨가 비일 때 스피드가 2배가 된다. [비 시 스피드 2.0배(100% 상승)]",
    "sand-rush": "모래바람일 때 스피드가 2배가 된다. [모래바람 시 스피드 2.0배(100% 상승)]",
    "slush-rush": "눈이나 싸라기눈일 때 스피드가 2배가 된다. [설경 시 스피드 2.0배(100% 상승)]",
    "solar-power": "날씨가 맑을 때 특수공격이 올라가지만 매 턴 HP가 깎인다. [특공 1.5배 / 매턴 HP 1/8 감소]",
    "dry-skin": "비일 때 HP를 회복하고 물을 무효화하지만 불꽃에 약해진다. [물 무효 및 25% 회복 / 불꽃 1.25배]",
    "water-absorb": "물타입 공격을 받으면 대미지 대신 HP가 회복된다. [물 무효 및 최대 HP의 25% 회복]",
    "volt-absorb": "전기타입 공격을 받으면 대미지 대신 HP가 회복된다. [전기 무효 및 최대 HP의 25% 회복]",
    "flash-fire": "불꽃타입 공격을 받으면 무효화하고 불꽃 기술의 위력이 올라간다. [불꽃 무효 및 불꽃 위력 1.5배]",
    "sap-sipper": "풀타입 공격을 받으면 무효화하고 공격이 올라간다. [풀 무효 및 공격 +1랭크]",
    "lightning-rod": "전기타입 공격을 자신에게 끌어당겨 무효화하고 특수공격이 올라간다. [전기 무효 및 특공 +1랭크]",
    "storm-drain": "물타입 공격을 자신에게 끌어당겨 무효화하고 특수공격이 올라간다. [물 무효 및 특공 +1랭크]",
    "motor-drive": "전기타입 공격을 받으면 무효화하고 스피드가 올라간다. [전기 무효 및 스피드 +1랭크]",
};
exports.ABILITY_DETAILED_DESC_EN = {
    "hustle": "Boosts Attack [1.5x (+50%)], but lowers physical move accuracy by 20%.",
    "huge-power": "Doubles the Pokémon's physical Attack stat [2.0x (+100%)].",
    "pure-power": "Doubles the Pokémon's physical Attack stat [2.0x (+100%)].",
    "speed-boost": "Its Speed stat is boosted every turn [+1 stage (1.5x ➡️ 2.0x...)].",
    "technician": "Powers up the Pokémon's weaker moves [Moves with power <= 60 get 1.5x].",
    "overgrow": "Powers up Grass-type moves in a pinch [HP <= 1/3: 1.5x power].",
    "blaze": "Powers up Fire-type moves in a pinch [HP <= 1/3: 1.5x power].",
    "torrent": "Powers up Water-type moves in a pinch [HP <= 1/3: 1.5x power].",
    "swarm": "Powers up Bug-type moves in a pinch [HP <= 1/3: 1.5x power].",
    "adaptability": "Powers up moves of the same type [STAB bonus 1.5x ➡️ 2.0x].",
    "sheer-force": "Removes move secondary effects to boost move power by 1.3x (+30%).",
    "tough-claws": "Powers up moves that make direct contact [1.3x (+30%)].",
    "strong-jaw": "The Pokémon's strong jaw boosts the power of biting moves [1.5x (+50%)].",
    "mega-launcher": "Powers up aura and pulse moves [1.5x (+50%)].",
    "iron-fist": "Powers up punching moves [1.2x (+20%)].",
    "sharpness": "Powers up slicing moves [1.5x (+50%)].",
    "regenerator": "Restores HP when withdrawn from battle [33.3% (1/3) max HP].",
    "multiscale": "Reduces damage taken when HP is full [50% damage reduction].",
    "shadow-shield": "Reduces damage taken when HP is full [50% damage reduction].",
    "fluffy": "Halves damage from contact moves [50%], but doubles Fire move damage [2.0x].",
    "poison-heal": "Restores HP when poisoned [12.5% (1/8) max HP per turn].",
    "magic-guard": "The Pokémon only takes damage from direct attacks.",
    "intimidate": "Lowers opposing Pokémon's Attack stat when entering battle [-1 stage (2/3x)].",
    "moxie": "Boosts Attack after knocking out any Pokémon [+1 stage (1.5x)].",
    "defiant": "Sharply boosts Attack when stats are lowered by opponents [+2 stages (2.0x)].",
    "competitive": "Sharply boosts Sp. Atk when stats are lowered by opponents [+2 stages (2.0x)].",
    "contrary": "Reverses all stat changes.",
    "prankster": "Gives priority to status moves [+1 priority, fails against Dark types].",
    "guts": "Boosts Attack if the Pokémon has a status condition [1.5x (+50%)].",
};
function getAbilityDetail(rawName) {
    return __awaiter(this, void 0, void 0, function () {
        var key, nameKo, descriptionKo, descriptionEn, res, data, koNameEntry, koFlavor, koEffect, enFlavor, enEffect, err_1, formattedEn, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    key = rawName.toLowerCase().replace(/[\s_]+/g, "-");
                    if (abilityDetailCache.has(key))
                        return [2 /*return*/, abilityDetailCache.get(key)];
                    nameKo = exports.ABILITY_KO_DICT[key] || rawName;
                    descriptionKo = exports.ABILITY_DETAILED_DESC_KO[key] || "";
                    descriptionEn = exports.ABILITY_DETAILED_DESC_EN[key] || "";
                    if (!(!descriptionKo || !descriptionEn)) return [3 /*break*/, 6];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("https://pokeapi.co/api/v2/ability/".concat(key))];
                case 2:
                    res = _a.sent();
                    if (!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    koNameEntry = (data.names || []).find(function (n) { var _a; return ((_a = n.language) === null || _a === void 0 ? void 0 : _a.name) === "ko"; });
                    if (koNameEntry === null || koNameEntry === void 0 ? void 0 : koNameEntry.name)
                        nameKo = koNameEntry.name;
                    if (!descriptionKo) {
                        koFlavor = (data.flavor_text_entries || []).find(function (f) { var _a; return ((_a = f.language) === null || _a === void 0 ? void 0 : _a.name) === "ko"; });
                        if (koFlavor === null || koFlavor === void 0 ? void 0 : koFlavor.flavor_text) {
                            descriptionKo = koFlavor.flavor_text.replace(/\n/g, " ");
                        }
                        else {
                            koEffect = (data.effect_entries || []).find(function (e) { var _a; return ((_a = e.language) === null || _a === void 0 ? void 0 : _a.name) === "ko"; });
                            if ((koEffect === null || koEffect === void 0 ? void 0 : koEffect.short_effect) || (koEffect === null || koEffect === void 0 ? void 0 : koEffect.effect)) {
                                descriptionKo = (koEffect.short_effect || koEffect.effect).replace(/\n/g, " ");
                            }
                        }
                    }
                    if (!descriptionEn) {
                        enFlavor = (data.flavor_text_entries || []).find(function (f) { var _a; return ((_a = f.language) === null || _a === void 0 ? void 0 : _a.name) === "en"; });
                        if (enFlavor === null || enFlavor === void 0 ? void 0 : enFlavor.flavor_text) {
                            descriptionEn = enFlavor.flavor_text.replace(/\n/g, " ");
                        }
                        else {
                            enEffect = (data.effect_entries || []).find(function (e) { var _a; return ((_a = e.language) === null || _a === void 0 ? void 0 : _a.name) === "en"; });
                            if ((enEffect === null || enEffect === void 0 ? void 0 : enEffect.short_effect) || (enEffect === null || enEffect === void 0 ? void 0 : enEffect.effect)) {
                                descriptionEn = (enEffect.short_effect || enEffect.effect).replace(/\n/g, " ");
                            }
                        }
                    }
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    console.error("[ABILITY] Error fetching ability details for ".concat(key, ":"), err_1);
                    return [3 /*break*/, 6];
                case 6:
                    formattedEn = rawName.split(/[\s_-]+/).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
                    result = {
                        name: formattedEn,
                        nameKo: nameKo || formattedEn,
                        descriptionKo: descriptionKo || "".concat(nameKo || formattedEn, " \uD2B9\uC131\uC785\uB2C8\uB2E4."),
                        descriptionEn: descriptionEn || "".concat(formattedEn, " ability."),
                    };
                    abilityDetailCache.set(key, result);
                    return [2 /*return*/, result];
            }
        });
    });
}
function getAbilityKoreanName(rawName) {
    var key = rawName.toLowerCase().replace(/[\s_]+/g, "-");
    return exports.ABILITY_KO_DICT[key] || abilityKoCache.get(key) || rawName;
}
function getPokemonSpeciesInfo(dexNo) {
    return __awaiter(this, void 0, void 0, function () {
        var res, data, koGenusEntry, enGenusEntry, koFlavors, lastKoFlavor, enFlavors, lastEnFlavor, cleanKo, cleanEn, result, err_2, fallback;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (speciesCache.has(dexNo))
                        return [2 /*return*/, speciesCache.get(dexNo)];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("https://pokeapi.co/api/v2/pokemon-species/".concat(dexNo))];
                case 2:
                    res = _a.sent();
                    if (!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    koGenusEntry = (data.genera || []).find(function (g) { var _a; return ((_a = g.language) === null || _a === void 0 ? void 0 : _a.name) === "ko"; });
                    enGenusEntry = (data.genera || []).find(function (g) { var _a; return ((_a = g.language) === null || _a === void 0 ? void 0 : _a.name) === "en"; });
                    koFlavors = (data.flavor_text_entries || []).filter(function (f) { var _a; return ((_a = f.language) === null || _a === void 0 ? void 0 : _a.name) === "ko"; });
                    lastKoFlavor = koFlavors.length > 0 ? koFlavors[koFlavors.length - 1].flavor_text : undefined;
                    enFlavors = (data.flavor_text_entries || []).filter(function (f) { var _a; return ((_a = f.language) === null || _a === void 0 ? void 0 : _a.name) === "en"; });
                    lastEnFlavor = enFlavors.length > 0 ? enFlavors[enFlavors.length - 1].flavor_text : undefined;
                    cleanKo = lastKoFlavor ? lastKoFlavor.replace(/[\n\f\r]+/g, " ").replace(/\s{2,}/g, " ").trim() : undefined;
                    cleanEn = lastEnFlavor ? lastEnFlavor.replace(/[\n\f\r]+/g, " ").replace(/\s{2,}/g, " ").trim() : undefined;
                    result = {
                        genusKo: koGenusEntry === null || koGenusEntry === void 0 ? void 0 : koGenusEntry.genus,
                        genusEn: enGenusEntry === null || enGenusEntry === void 0 ? void 0 : enGenusEntry.genus,
                        flavorTextKo: cleanKo,
                        flavorTextEn: cleanEn,
                    };
                    speciesCache.set(dexNo, result);
                    return [2 /*return*/, result];
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_2 = _a.sent();
                    console.error("[SPECIES] Failed to fetch species for #".concat(dexNo, ":"), err_2);
                    return [3 /*break*/, 6];
                case 6:
                    fallback = {
                        genusKo: "포켓몬",
                        genusEn: "Pokémon",
                        flavorTextKo: "포켓몬 도감에 등록된 포켓몬입니다.",
                        flavorTextEn: "A Pokémon registered in the Pokédex.",
                    };
                    speciesCache.set(dexNo, fallback);
                    return [2 /*return*/, fallback];
            }
        });
    });
}
var pokemonNamesKo_js_1 = require("../data/pokemonNamesKo.js");
// Full 1~1025 National Pokédex Korean Name dataset
var DEX_TO_KOREAN_DICT = pokemonNamesKo_js_1.POKEMON_NAMES_KO;
exports.KOREAN_POKEMON_DICT = pokemonNamesKo_js_1.POKEMON_NAME_TO_DEX;
/**
 * Fetches Pokémon data by National Pokédex number (1 ~ 1025)
 */
function getPokemonByDexNumber(dexNo) {
    return __awaiter(this, void 0, void 0, function () {
        var res, data_1, speciesId, formattedName, basePart, types, regularAbilities, regularAbilitiesKo, hiddenAbility, hiddenAbilityKo, _i, _a, a, rawName, formatted, koName, primaryAbility, getStat, hp, attack, defense, spAttack, spDefense, speed, info, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (dexNo < 1 || dexNo > 1025)
                        return [2 /*return*/, null];
                    if (dexCache.has(dexNo))
                        return [2 /*return*/, dexCache.get(dexNo)];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("https://pokeapi.co/api/v2/pokemon/".concat(dexNo))];
                case 2:
                    res = _b.sent();
                    if (!res.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data_1 = _b.sent();
                    speciesId = data_1.name.toLowerCase();
                    formattedName = data_1.name.charAt(0).toUpperCase() + data_1.name.slice(1);
                    if (speciesId === "nidoran-f")
                        formattedName = "Nidoran ♀";
                    else if (speciesId === "nidoran-m")
                        formattedName = "Nidoran ♂";
                    else if (speciesId === "mr-mime")
                        formattedName = "Mr. Mime";
                    else if (speciesId === "mime-jr")
                        formattedName = "Mime Jr.";
                    else if (speciesId === "mr-rime")
                        formattedName = "Mr. Rime";
                    else if (speciesId === "ho-oh")
                        formattedName = "Ho-Oh";
                    else if (speciesId === "porygon-z")
                        formattedName = "Porygon-Z";
                    else if (speciesId === "type-null")
                        formattedName = "Type: Null";
                    else if (speciesId === "aegislash-shield" || speciesId === "aegislash-blade")
                        formattedName = "Aegislash";
                    else if (speciesId === "meowstic-male" || speciesId === "meowstic-female")
                        formattedName = "Meowstic";
                    else if (speciesId === "pumpkaboo-average")
                        formattedName = "Pumpkaboo";
                    else if (speciesId === "gourgeist-average")
                        formattedName = "Gourgeist";
                    else if (speciesId === "zygarde-50")
                        formattedName = "Zygarde";
                    else if (speciesId.startsWith("tapu-"))
                        formattedName = "Tapu " + speciesId.split("-")[1].charAt(0).toUpperCase() + speciesId.split("-")[1].slice(1);
                    else if (speciesId.includes("-")) {
                        basePart = speciesId.split("-")[0];
                        formattedName = basePart.charAt(0).toUpperCase() + basePart.slice(1);
                    }
                    types = data_1.types.map(function (t) { return t.type.name; });
                    regularAbilities = [];
                    regularAbilitiesKo = [];
                    hiddenAbility = void 0;
                    hiddenAbilityKo = void 0;
                    for (_i = 0, _a = data_1.abilities || []; _i < _a.length; _i++) {
                        a = _a[_i];
                        rawName = a.ability.name;
                        formatted = rawName.split(/[\s_-]+/).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
                        koName = getAbilityKoreanName(rawName);
                        if (a.is_hidden) {
                            hiddenAbility = formatted;
                            hiddenAbilityKo = koName;
                        }
                        else {
                            regularAbilities.push(formatted);
                            regularAbilitiesKo.push(koName);
                        }
                    }
                    primaryAbility = regularAbilities.join(" / ") || "None";
                    getStat = function (name) { var _a; return ((_a = data_1.stats.find(function (s) { return s.stat.name === name; })) === null || _a === void 0 ? void 0 : _a.base_stat) || 50; };
                    hp = getStat("hp");
                    attack = getStat("attack");
                    defense = getStat("defense");
                    spAttack = getStat("special-attack");
                    spDefense = getStat("special-defense");
                    speed = getStat("speed");
                    info = {
                        dexNumber: dexNo,
                        speciesId: speciesId,
                        name: formattedName,
                        koreanName: DEX_TO_KOREAN_DICT[dexNo],
                        types: types,
                        abilities: (data_1.abilities || []).map(function (a) { return a.ability.name; }),
                        regularAbilities: regularAbilities,
                        regularAbilitiesKo: regularAbilitiesKo,
                        primaryAbility: primaryAbility,
                        hiddenAbility: hiddenAbility,
                        hiddenAbilityKo: hiddenAbilityKo,
                        hp: hp,
                        attack: attack,
                        defense: defense,
                        spAttack: spAttack,
                        spDefense: spDefense,
                        speed: speed,
                    };
                    dexCache.set(dexNo, info);
                    return [2 /*return*/, info];
                case 4:
                    error_1 = _b.sent();
                    console.error("[POKEAPI] Failed to fetch Pokemon for Dex #".concat(dexNo, ":"), error_1);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Fetches a list of Pokémon for a Pokédex page (e.g. 8 per page)
 */
function getPokemonPage() {
    return __awaiter(this, arguments, void 0, function (page, pageSize) {
        var total, totalPages, validPage, startDex, endDex, promises, i, results, items;
        if (page === void 0) { page = 1; }
        if (pageSize === void 0) { pageSize = 8; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    total = 1025;
                    totalPages = Math.ceil(total / pageSize);
                    validPage = Math.max(1, Math.min(totalPages, page));
                    startDex = (validPage - 1) * pageSize + 1;
                    endDex = Math.min(total, startDex + pageSize - 1);
                    promises = [];
                    for (i = startDex; i <= endDex; i++) {
                        promises.push(getPokemonByDexNumber(i));
                    }
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    results = _a.sent();
                    items = results.filter(function (p) { return p !== null; });
                    return [2 /*return*/, { total: total, totalPages: totalPages, items: items }];
            }
        });
    });
}
/**
 * Resolves Pokémon by query: Dex Number (e.g. 134), Korean Name (e.g. 샤미드), or English Name (e.g. Vaporeon)
 */
function getPokemonByQuery(query) {
    return __awaiter(this, void 0, void 0, function () {
        var clean, num, original, res, data, info, _a, speciesRes, spData, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    clean = query.trim().toLowerCase();
                    if (!clean)
                        return [2 /*return*/, null];
                    num = parseInt(clean, 10);
                    if (!(!isNaN(num) && String(num) === clean)) return [3 /*break*/, 2];
                    return [4 /*yield*/, getPokemonByDexNumber(num)];
                case 1: return [2 /*return*/, _c.sent()];
                case 2:
                    original = query.trim();
                    if (!exports.KOREAN_POKEMON_DICT[original]) return [3 /*break*/, 4];
                    return [4 /*yield*/, getPokemonByDexNumber(exports.KOREAN_POKEMON_DICT[original])];
                case 3: return [2 /*return*/, _c.sent()];
                case 4:
                    // 3. Check memory cache for English Name
                    if (nameCache.has(clean)) {
                        return [2 /*return*/, nameCache.get(clean)];
                    }
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 10, , 11]);
                    return [4 /*yield*/, fetch("https://pokeapi.co/api/v2/pokemon/".concat(clean))];
                case 6:
                    res = _c.sent();
                    if (!res.ok) return [3 /*break*/, 9];
                    return [4 /*yield*/, res.json()];
                case 7:
                    data = _c.sent();
                    return [4 /*yield*/, getPokemonByDexNumber(data.id)];
                case 8:
                    info = _c.sent();
                    if (info) {
                        nameCache.set(clean, info);
                        return [2 /*return*/, info];
                    }
                    _c.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    _a = _c.sent();
                    return [3 /*break*/, 11];
                case 11:
                    _c.trys.push([11, 16, , 17]);
                    return [4 /*yield*/, fetch("https://pokeapi.co/api/v2/pokemon-species/".concat(encodeURIComponent(clean)))];
                case 12:
                    speciesRes = _c.sent();
                    if (!speciesRes.ok) return [3 /*break*/, 15];
                    return [4 /*yield*/, speciesRes.json()];
                case 13:
                    spData = _c.sent();
                    return [4 /*yield*/, getPokemonByDexNumber(spData.id)];
                case 14: return [2 /*return*/, _c.sent()];
                case 15: return [3 /*break*/, 17];
                case 16:
                    _b = _c.sent();
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/, null];
            }
        });
    });
}
