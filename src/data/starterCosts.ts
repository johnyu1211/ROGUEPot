/**
 * PokéRogue Official Starter Cost, Passives, Hidden Abilities & Generation Database
 */

export interface StarterEntry {
  dexNumber: number;
  name: string;
  nameKo: string;
  speciesId: string;
  gen: number;
  cost: number;
  reducedCost: number;
  ability: string;
  abilityKo: string;
  hiddenAbility?: string;
  hiddenAbilityKo?: string;
  passiveAbility: string;
  passiveAbilityKo: string;
  starterMoves: string[];
}

export const STARTER_DATABASE: StarterEntry[] = [
  // Generation 1 (Kanto)
  {
    dexNumber: 1, name: "Bulbasaur", nameKo: "이상해씨", speciesId: "bulbasaur", gen: 1, cost: 3, reducedCost: 2,
    ability: "Overgrow", abilityKo: "심록", hiddenAbility: "Chlorophyll", hiddenAbilityKo: "엽록소",
    passiveAbility: "Corrosion", passiveAbilityKo: "부식", starterMoves: ["Tackle", "Growl", "Vine Whip"]
  },
  {
    dexNumber: 4, name: "Charmander", nameKo: "파이리", speciesId: "charmander", gen: 1, cost: 3, reducedCost: 2,
    ability: "Blaze", abilityKo: "맹화", hiddenAbility: "Solar Power", hiddenAbilityKo: "선파워",
    passiveAbility: "Drought", passiveAbilityKo: "가뭄", starterMoves: ["Scratch", "Growl", "Ember"]
  },
  {
    dexNumber: 7, name: "Squirtle", nameKo: "꼬부기", speciesId: "squirtle", gen: 1, cost: 3, reducedCost: 2,
    ability: "Torrent", abilityKo: "급류", hiddenAbility: "Rain Dish", hiddenAbilityKo: "젖은접시",
    passiveAbility: "Drizzle", passiveAbilityKo: "잔비", starterMoves: ["Tackle", "Tail Whip", "Water Gun"]
  },
  {
    dexNumber: 25, name: "Pikachu", nameKo: "피카츄", speciesId: "pikachu", gen: 1, cost: 3, reducedCost: 2,
    ability: "Static", abilityKo: "정전기", hiddenAbility: "Lightning Rod", hiddenAbilityKo: "피뢰침",
    passiveAbility: "Electric Surge", passiveAbilityKo: "일렉트릭필드", starterMoves: ["Thunder Shock", "Growl", "Quick Attack"]
  },
  {
    dexNumber: 133, name: "Eevee", nameKo: "이브이", speciesId: "eevee", gen: 1, cost: 3, reducedCost: 2,
    ability: "Run Away", abilityKo: "도주", hiddenAbility: "Anticipation", hiddenAbilityKo: "위험예지",
    passiveAbility: "Adaptability", passiveAbilityKo: "적응력", starterMoves: ["Tackle", "Tail Whip", "Bite"]
  },
  {
    dexNumber: 10, name: "Caterpie", nameKo: "캐터피", speciesId: "caterpie", gen: 1, cost: 1, reducedCost: 1,
    ability: "Shield Dust", abilityKo: "인분", hiddenAbility: "Run Away", hiddenAbilityKo: "도주",
    passiveAbility: "Tinted Lens", passiveAbilityKo: "색안경", starterMoves: ["Tackle", "String Shot", "Bug Bite"]
  },
  {
    dexNumber: 13, name: "Weedle", nameKo: "뿔충이", speciesId: "weedle", gen: 1, cost: 1, reducedCost: 1,
    ability: "Shield Dust", abilityKo: "인분", hiddenAbility: "Run Away", hiddenAbilityKo: "도주",
    passiveAbility: "Sniper", passiveAbilityKo: "스나이퍼", starterMoves: ["Poison Sting", "String Shot", "Bug Bite"]
  },
  {
    dexNumber: 16, name: "Pidgey", nameKo: "구구", speciesId: "pidgey", gen: 1, cost: 1, reducedCost: 1,
    ability: "Keen Eye", abilityKo: "날카로운눈", hiddenAbility: "Big Pecks", hiddenAbilityKo: "부풀린가슴",
    passiveAbility: "Aerilate", passiveAbilityKo: "스카이스킨", starterMoves: ["Tackle", "Sand Attack", "Gust"]
  },
  {
    dexNumber: 19, name: "Rattata", nameKo: "꼬렛", speciesId: "rattata", gen: 1, cost: 1, reducedCost: 1,
    ability: "Run Away", abilityKo: "도주", hiddenAbility: "Hustle", hiddenAbilityKo: "의욕",
    passiveAbility: "Guts", passiveAbilityKo: "근성", starterMoves: ["Tackle", "Tail Whip", "Quick Attack"]
  },

  // Generation 2 (Johto)
  {
    dexNumber: 152, name: "Chikorita", nameKo: "치코리타", speciesId: "chikorita", gen: 2, cost: 3, reducedCost: 2,
    ability: "Overgrow", abilityKo: "심록", hiddenAbility: "Leaf Guard", hiddenAbilityKo: "리프가드",
    passiveAbility: "Grassy Surge", passiveAbilityKo: "그래스필드", starterMoves: ["Tackle", "Growl", "Razor Leaf"]
  },
  {
    dexNumber: 155, name: "Cyndaquil", nameKo: "브케인", speciesId: "cyndaquil", gen: 2, cost: 3, reducedCost: 2,
    ability: "Blaze", abilityKo: "맹화", hiddenAbility: "Flash Fire", hiddenAbilityKo: "타오르는불꽃",
    passiveAbility: "White Smoke", passiveAbilityKo: "하얀연기", starterMoves: ["Tackle", "Leer", "Ember"]
  },
  {
    dexNumber: 158, name: "Totodile", nameKo: "리아코", speciesId: "totodile", gen: 2, cost: 3, reducedCost: 2,
    ability: "Torrent", abilityKo: "급류", hiddenAbility: "Sheer Force", hiddenAbilityKo: "우격다짐",
    passiveAbility: "Strong Jaw", passiveAbilityKo: "옹골찬턱", starterMoves: ["Scratch", "Leer", "Water Gun"]
  },
  {
    dexNumber: 161, name: "Sentret", nameKo: "꼬리선", speciesId: "sentret", gen: 2, cost: 1, reducedCost: 1,
    ability: "Run Away", abilityKo: "도주", hiddenAbility: "Frisk", hiddenAbilityKo: "통찰",
    passiveAbility: "Huge Power", passiveAbilityKo: "천하장사", starterMoves: ["Scratch", "Defense Curl", "Quick Attack"]
  },
  {
    dexNumber: 163, name: "Hoothoot", nameKo: "부우부", speciesId: "hoothoot", gen: 2, cost: 1, reducedCost: 1,
    ability: "Insomnia", abilityKo: "불면", hiddenAbility: "Tinted Lens", hiddenAbilityKo: "색안경",
    passiveAbility: "Competitive", passiveAbilityKo: "승기", starterMoves: ["Tackle", "Growl", "Peck"]
  },
  {
    dexNumber: 165, name: "Ledyba", nameKo: "레디바", speciesId: "ledyba", gen: 2, cost: 1, reducedCost: 1,
    ability: "Swarm", abilityKo: "벌레의알림", hiddenAbility: "Rattled", hiddenAbilityKo: "주눅",
    passiveAbility: "Iron Fist", passiveAbilityKo: "철주먹", starterMoves: ["Tackle", "Supersonic", "Swift"]
  },
  {
    dexNumber: 167, name: "Spinarak", nameKo: "페이검", speciesId: "spinarak", gen: 2, cost: 1, reducedCost: 1,
    ability: "Swarm", abilityKo: "벌레의알림", hiddenAbility: "Sniper", hiddenAbilityKo: "스나이퍼",
    passiveAbility: "Merciless", passiveAbilityKo: "무자비", starterMoves: ["Poison Sting", "String Shot", "Constrict"]
  },

  // Generation 3 (Hoenn)
  {
    dexNumber: 252, name: "Treecko", nameKo: "나무지기", speciesId: "treecko", gen: 3, cost: 3, reducedCost: 2,
    ability: "Overgrow", abilityKo: "심록", hiddenAbility: "Unburden", hiddenAbilityKo: "곡예",
    passiveAbility: "Tinted Lens", passiveAbilityKo: "색안경", starterMoves: ["Pound", "Leer", "Mega Drain"]
  },
  {
    dexNumber: 255, name: "Torchic", nameKo: "아차모", speciesId: "torchic", gen: 3, cost: 3, reducedCost: 2,
    ability: "Blaze", abilityKo: "맹화", hiddenAbility: "Speed Boost", hiddenAbilityKo: "가속",
    passiveAbility: "Moxie", passiveAbilityKo: "자기과시", starterMoves: ["Scratch", "Growl", "Ember"]
  },
  {
    dexNumber: 258, name: "Mudkip", nameKo: "물짱이", speciesId: "mudkip", gen: 3, cost: 3, reducedCost: 2,
    ability: "Torrent", abilityKo: "급류", hiddenAbility: "Damp", hiddenAbilityKo: "습기",
    passiveAbility: "Sap Sipper", passiveAbilityKo: "초식", starterMoves: ["Tackle", "Growl", "Water Gun"]
  },
  {
    dexNumber: 263, name: "Zigzagoon", nameKo: "지그제구리", speciesId: "zigzagoon", gen: 3, cost: 1, reducedCost: 1,
    ability: "Pickup", abilityKo: "픽업", hiddenAbility: "Quick Feet", hiddenAbilityKo: "속보",
    passiveAbility: "Belly Drum", passiveAbilityKo: "배북", starterMoves: ["Tackle", "Growl", "Headbutt"]
  },
  {
    dexNumber: 265, name: "Wurmple", nameKo: "개무소", speciesId: "wurmple", gen: 3, cost: 1, reducedCost: 1,
    ability: "Shield Dust", abilityKo: "인분", hiddenAbility: "Run Away", hiddenAbilityKo: "도주",
    passiveAbility: "Compound Eyes", passiveAbilityKo: "복안", starterMoves: ["Tackle", "String Shot", "Poison Sting"]
  },
  {
    dexNumber: 276, name: "Taillow", nameKo: "테일로", speciesId: "taillow", gen: 3, cost: 1, reducedCost: 1,
    ability: "Guts", abilityKo: "근성", hiddenAbility: "Scrappy", hiddenAbilityKo: "배짱",
    passiveAbility: "Gale Wings", passiveAbilityKo: "질풍날개", starterMoves: ["Peck", "Growl", "Quick Attack"]
  },
  {
    dexNumber: 280, name: "Ralts", nameKo: "랄토스", speciesId: "ralts", gen: 3, cost: 3, reducedCost: 2,
    ability: "Synchronize", abilityKo: "동기화", hiddenAbility: "Telepathy", hiddenAbilityKo: "텔레파시",
    passiveAbility: "Trace", passiveAbilityKo: "트레이스", starterMoves: ["Growl", "Disarming Voice", "Confusion"]
  },

  // Generation 4 (Sinnoh)
  {
    dexNumber: 387, name: "Turtwig", nameKo: "모부기", speciesId: "turtwig", gen: 4, cost: 3, reducedCost: 2,
    ability: "Overgrow", abilityKo: "심록", hiddenAbility: "Shell Armor", hiddenAbilityKo: "조가비갑옷",
    passiveAbility: "Stamina", passiveAbilityKo: "지구력", starterMoves: ["Tackle", "Withdraw", "Razor Leaf"]
  },
  {
    dexNumber: 390, name: "Chimchar", nameKo: "불꽃숭이", speciesId: "chimchar", gen: 4, cost: 3, reducedCost: 2,
    ability: "Blaze", abilityKo: "맹화", hiddenAbility: "Iron Fist", hiddenAbilityKo: "철주먹",
    passiveAbility: "Adaptability", passiveAbilityKo: "적응력", starterMoves: ["Scratch", "Leer", "Ember"]
  },
  {
    dexNumber: 393, name: "Piplup", nameKo: "팽도리", speciesId: "piplup", gen: 4, cost: 3, reducedCost: 2,
    ability: "Torrent", abilityKo: "급류", hiddenAbility: "Defiant", hiddenAbilityKo: "오기",
    passiveAbility: "Competitive", passiveAbilityKo: "승기", starterMoves: ["Pound", "Growl", "Water Gun"]
  },
  {
    dexNumber: 396, name: "Starly", nameKo: "찌르꼬", speciesId: "starly", gen: 4, cost: 2, reducedCost: 1,
    ability: "Keen Eye", abilityKo: "날카로운눈", hiddenAbility: "Reckless", hiddenAbilityKo: "이판사판",
    passiveAbility: "Intimidate", passiveAbilityKo: "위협", starterMoves: ["Tackle", "Growl", "Quick Attack"]
  },
  {
    dexNumber: 399, name: "Bidoof", nameKo: "비버니", speciesId: "bidoof", gen: 4, cost: 1, reducedCost: 1,
    ability: "Simple", abilityKo: "단순", hiddenAbility: "Moody", hiddenAbilityKo: "변덕쟁이",
    passiveAbility: "Unaware", passiveAbilityKo: "천진", starterMoves: ["Tackle", "Growl", "Defense Curl"]
  },
  {
    dexNumber: 401, name: "Kricketot", nameKo: "귀뚤뚜기", speciesId: "kricketot", gen: 4, cost: 1, reducedCost: 1,
    ability: "Swarm", abilityKo: "벌레의알림", hiddenAbility: "Run Away", hiddenAbilityKo: "도주",
    passiveAbility: "Technician", passiveAbilityKo: "테크니션", starterMoves: ["Growl", "Pound", "Bug Bite"]
  },
  {
    dexNumber: 403, name: "Shinx", nameKo: "꼬링크", speciesId: "shinx", gen: 4, cost: 2, reducedCost: 1,
    ability: "Rivalry", abilityKo: "투쟁심", hiddenAbility: "Guts", hiddenAbilityKo: "근성",
    passiveAbility: "Strong Jaw", passiveAbilityKo: "옹골찬턱", starterMoves: ["Tackle", "Leer", "Spark"]
  },

  // Generation 5 (Unova)
  {
    dexNumber: 495, name: "Snivy", nameKo: "주리비얀", speciesId: "snivy", gen: 5, cost: 3, reducedCost: 2,
    ability: "Overgrow", abilityKo: "심록", hiddenAbility: "Contrary", hiddenAbilityKo: "심술꾸러기",
    passiveAbility: "Simple", passiveAbilityKo: "단순", starterMoves: ["Tackle", "Leer", "Vine Whip"]
  },
  {
    dexNumber: 498, name: "Tepig", nameKo: "뚜꾸리", speciesId: "tepig", gen: 5, cost: 3, reducedCost: 2,
    ability: "Blaze", abilityKo: "맹화", hiddenAbility: "Thick Fat", hiddenAbilityKo: "두꺼운지방",
    passiveAbility: "Rock Head", passiveAbilityKo: "돌머리", starterMoves: ["Tackle", "Tail Whip", "Ember"]
  },
  {
    dexNumber: 501, name: "Oshawott", nameKo: "수댕이", speciesId: "oshawott", gen: 5, cost: 3, reducedCost: 2,
    ability: "Torrent", abilityKo: "급류", hiddenAbility: "Shell Armor", hiddenAbilityKo: "조가비갑옷",
    passiveAbility: "Sharpness", passiveAbilityKo: "예리함", starterMoves: ["Tackle", "Tail Whip", "Water Gun"]
  },
  {
    dexNumber: 504, name: "Patrat", nameKo: "보르쥐", speciesId: "patrat", gen: 5, cost: 1, reducedCost: 1,
    ability: "Run Away", abilityKo: "도주", hiddenAbility: "Analytic", hiddenAbilityKo: "애널라이즈",
    passiveAbility: "No Guard", passiveAbilityKo: "노가드", starterMoves: ["Tackle", "Leer", "Bite"]
  },
  {
    dexNumber: 506, name: "Lillipup", nameKo: "요테리", speciesId: "lillipup", gen: 5, cost: 1, reducedCost: 1,
    ability: "Vital Spirit", abilityKo: "의기양양", hiddenAbility: "Scrappy", hiddenAbilityKo: "배짱",
    passiveAbility: "Fur Coat", passiveAbilityKo: "퍼코트", starterMoves: ["Tackle", "Leer", "Bite"]
  },
  {
    dexNumber: 509, name: "Purrloin", nameKo: "쌔비냥", speciesId: "purrloin", gen: 5, cost: 1, reducedCost: 1,
    ability: "Limber", abilityKo: "유연", hiddenAbility: "Prankster", hiddenAbilityKo: "짓궂은마음",
    passiveAbility: "Stakeout", passiveAbilityKo: "잠복", starterMoves: ["Scratch", "Growl", "Sand Attack"]
  },

  // Generation 6 (Kalos)
  {
    dexNumber: 650, name: "Chespin", nameKo: "도치마론", speciesId: "chespin", gen: 6, cost: 3, reducedCost: 2,
    ability: "Overgrow", abilityKo: "심록", hiddenAbility: "Bulletproof", hiddenAbilityKo: "방탄",
    passiveAbility: "Iron Barbs", passiveAbilityKo: "철가시", starterMoves: ["Tackle", "Growl", "Vine Whip"]
  },
  {
    dexNumber: 653, name: "Fennekin", nameKo: "푸호꼬", speciesId: "fennekin", gen: 6, cost: 3, reducedCost: 2,
    ability: "Blaze", abilityKo: "맹화", hiddenAbility: "Magician", hiddenAbilityKo: "매지션",
    passiveAbility: "Psychic Surge", passiveAbilityKo: "사이코필드", starterMoves: ["Scratch", "Tail Whip", "Ember"]
  },
  {
    dexNumber: 656, name: "Froakie", nameKo: "개구마르", speciesId: "froakie", gen: 6, cost: 3, reducedCost: 2,
    ability: "Torrent", abilityKo: "급류", hiddenAbility: "Protean", hiddenAbilityKo: "변환자재",
    passiveAbility: "Battle Bond", passiveAbilityKo: "유대변화", starterMoves: ["Pound", "Growl", "Water Gun"]
  },
  {
    dexNumber: 659, name: "Bunnelby", nameKo: "파르빗", speciesId: "bunnelby", gen: 6, cost: 1, reducedCost: 1,
    ability: "Pickup", abilityKo: "픽업", hiddenAbility: "Huge Power", hiddenAbilityKo: "천하장사",
    passiveAbility: "Tough Claws", passiveAbilityKo: "단단한발톱", starterMoves: ["Tackle", "Agility", "Leer"]
  },
  {
    dexNumber: 661, name: "Fletchling", nameKo: "화살꼬빈", speciesId: "fletchling", gen: 6, cost: 2, reducedCost: 1,
    ability: "Big Pecks", abilityKo: "부풀린가슴", hiddenAbility: "Gale Wings", hiddenAbilityKo: "질풍날개",
    passiveAbility: "Flame Body", passiveAbilityKo: "불꽃몸", starterMoves: ["Tackle", "Growl", "Quick Attack"]
  },

  // Generation 7 (Alola)
  {
    dexNumber: 722, name: "Rowlet", nameKo: "나몰빼미", speciesId: "rowlet", gen: 7, cost: 3, reducedCost: 2,
    ability: "Overgrow", abilityKo: "심록", hiddenAbility: "Long Reach", hiddenAbilityKo: "원격",
    passiveAbility: "Tinted Lens", passiveAbilityKo: "색안경", starterMoves: ["Tackle", "Growl", "Leafage"]
  },
  {
    dexNumber: 725, name: "Litten", nameKo: "냐오불", speciesId: "litten", gen: 7, cost: 3, reducedCost: 2,
    ability: "Blaze", abilityKo: "맹화", hiddenAbility: "Intimidate", hiddenAbilityKo: "위협",
    passiveAbility: "Tough Claws", passiveAbilityKo: "단단한발톱", starterMoves: ["Scratch", "Growl", "Ember"]
  },
  {
    dexNumber: 728, name: "Popplio", nameKo: "누리공", speciesId: "popplio", gen: 7, cost: 3, reducedCost: 2,
    ability: "Torrent", abilityKo: "급류", hiddenAbility: "Liquid Voice", hiddenAbilityKo: "촉촉보이스",
    passiveAbility: "Punk Rock", passiveAbilityKo: "펑크록", starterMoves: ["Pound", "Growl", "Water Gun"]
  },
  {
    dexNumber: 731, name: "Pikipek", nameKo: "콕코구리", speciesId: "pikipek", gen: 7, cost: 2, reducedCost: 1,
    ability: "Keen Eye", abilityKo: "날카로운눈", hiddenAbility: "Pickup", hiddenAbilityKo: "픽업",
    passiveAbility: "Skill Link", passiveAbilityKo: "스킬링크", starterMoves: ["Peck", "Growl", "Echoed Voice"]
  },
  {
    dexNumber: 734, name: "Yungoos", nameKo: "영구스", speciesId: "yungoos", gen: 7, cost: 1, reducedCost: 1,
    ability: "Stakeout", abilityKo: "잠복", hiddenAbility: "Adaptability", hiddenAbilityKo: "적응력",
    passiveAbility: "Strong Jaw", passiveAbilityKo: "옹골찬턱", starterMoves: ["Tackle", "Leer", "Pursuit"]
  },

  // Generation 8 (Galar)
  {
    dexNumber: 810, name: "Grookey", nameKo: "흥나숭", speciesId: "grookey", gen: 8, cost: 3, reducedCost: 2,
    ability: "Overgrow", abilityKo: "심록", hiddenAbility: "Grassy Surge", hiddenAbilityKo: "그래스필드",
    passiveAbility: "Gorilla Tactics", passiveAbilityKo: "무아지경", starterMoves: ["Scratch", "Growl", "Branch Poke"]
  },
  {
    dexNumber: 813, name: "Scorbunny", nameKo: "염버니", speciesId: "scorbunny", gen: 8, cost: 3, reducedCost: 2,
    ability: "Blaze", abilityKo: "맹화", hiddenAbility: "Libero", hiddenAbilityKo: "리베로",
    passiveAbility: "Super Luck", passiveAbilityKo: "대운", starterMoves: ["Tackle", "Growl", "Ember"]
  },
  {
    dexNumber: 816, name: "Sobble", nameKo: "울머기", speciesId: "sobble", gen: 8, cost: 3, reducedCost: 2,
    ability: "Torrent", abilityKo: "급류", hiddenAbility: "Sniper", hiddenAbilityKo: "스나이퍼",
    passiveAbility: "Protean", passiveAbilityKo: "변환자재", starterMoves: ["Pound", "Growl", "Water Gun"]
  },
  {
    dexNumber: 819, name: "Skwovet", nameKo: "탐리스", speciesId: "skwovet", gen: 8, cost: 1, reducedCost: 1,
    ability: "Cheek Pouch", abilityKo: "볼주머니", hiddenAbility: "Gluttony", hiddenAbilityKo: "대식가",
    passiveAbility: "Ripen", passiveAbilityKo: "숙성", starterMoves: ["Tackle", "Tail Whip", "Bite"]
  },
  {
    dexNumber: 821, name: "Rookidee", nameKo: "파라꼬", speciesId: "rookidee", gen: 8, cost: 2, reducedCost: 1,
    ability: "Keen Eye", abilityKo: "날카로운눈", hiddenAbility: "Big Pecks", hiddenAbilityKo: "부풀린가슴",
    passiveAbility: "Mirror Armor", passiveAbilityKo: "미러아머", starterMoves: ["Peck", "Leer", "Power Trip"]
  },

  // Generation 9 (Paldea)
  {
    dexNumber: 906, name: "Sprigatito", nameKo: "나오하", speciesId: "sprigatito", gen: 9, cost: 3, reducedCost: 2,
    ability: "Overgrow", abilityKo: "심록", hiddenAbility: "Protean", hiddenAbilityKo: "변환자재",
    passiveAbility: "Magic Guard", passiveAbilityKo: "매직가드", starterMoves: ["Scratch", "Tail Whip", "Leafage"]
  },
  {
    dexNumber: 909, name: "Fuecoco", nameKo: "뜨아거", speciesId: "fuecoco", gen: 9, cost: 3, reducedCost: 2,
    ability: "Blaze", abilityKo: "맹화", hiddenAbility: "Unaware", hiddenAbilityKo: "천진",
    passiveAbility: "Punk Rock", passiveAbilityKo: "펑크록", starterMoves: ["Tackle", "Leer", "Ember"]
  },
  {
    dexNumber: 912, name: "Quaxly", nameKo: "꾸왁스", speciesId: "quaxly", gen: 9, cost: 3, reducedCost: 2,
    ability: "Torrent", abilityKo: "급류", hiddenAbility: "Moxie", hiddenAbilityKo: "자기과시",
    passiveAbility: "Dancer", passiveAbilityKo: "무용수", starterMoves: ["Pound", "Growl", "Water Gun"]
  },
  {
    dexNumber: 915, name: "Lechonk", nameKo: "맛보돈", speciesId: "lechonk", gen: 9, cost: 1, reducedCost: 1,
    ability: "Aroma Veil", abilityKo: "아로마베일", hiddenAbility: "Thick Fat", hiddenAbilityKo: "두꺼운지방",
    passiveAbility: "Gluttony", passiveAbilityKo: "대식가", starterMoves: ["Tackle", "Tail Whip", "Disarming Voice"]
  },
  {
    dexNumber: 921, name: "Pawmi", nameKo: "빠모", speciesId: "pawmi", gen: 9, cost: 2, reducedCost: 1,
    ability: "Static", abilityKo: "정전기", hiddenAbility: "Iron Fist", hiddenAbilityKo: "철주먹",
    passiveAbility: "Volt Absorb", passiveAbilityKo: "축전", starterMoves: ["Scratch", "Growl", "Thunder Shock"]
  },
];

export const DEFAULT_MAX_COST = 10;

/**
 * Get starter entries for a specific generation (1 ~ 9)
 */
export function getStartersByGen(gen: number): StarterEntry[] {
  return STARTER_DATABASE.filter((s) => s.gen === gen);
}

/**
 * Get starter entry by Dex Number
 */
export function getStarterByDexNumber(dexNo: number): StarterEntry | undefined {
  return STARTER_DATABASE.find((s) => s.dexNumber === dexNo);
}
