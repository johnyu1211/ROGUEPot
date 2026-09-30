# 🔒 ROGUEPot 개인정보처리방침 (Privacy Policy)

**최종 수정일: 2026년 9월 30일 (Last Updated: September 30, 2026)**

본 문서는 한국어(Korean)와 영어(English)로 작성되었습니다.  
This document is provided in both Korean and English.

---

## 🇰🇷 [한국어] 개인정보처리방침

본 개인정보처리방침은 **ROGUEPot** 디스코드 봇(이하 "봇") 및 오픈소스 소프트웨어가 이용자의 데이터를 어떻게 수집, 처리, 보관 및 파기하는지 규정합니다.

### 1. 수집하는 기본 식별 정보
* **Discord User ID (고유 식별자)**:
  * 디스코드 계정별 게임 세이브 슬롯 매핑, 도감 해금 기록, 언어 설정을 연동하기 위해 **유저 고유 ID(숫자 문자열)**만을 수집합니다.
  * **수집하지 않는 정보**: 본 봇은 이용자의 실명, 전화번호, 이메일 주소, 비밀번호, 결제 정보, 음성 데이터 및 개인 채팅 메시지(DM) 내용을 절대 수집하거나 저장하지 않습니다.

### 2. 개인 포켓몬 및 게임 데이터 저장 내역 (Personal Pokémon & Gameplay Data)
원활한 게임플레이와 성장을 위해 로컬 데이터베이스(`roguepot.sqlite`)에 다음과 같은 인게임 게임 데이터가 기록됩니다:

| 구분 | 저장 항목 | 상세 내용 |
| :--- | :--- | :--- |
| **개인 포켓몬 (Party & Stored)** | 포켓몬 인스턴스 정보 | 종(`speciesId`), 사용자 지정 닉네임(`nickname`), 레벨, 체력(HP), 습득 기술 및 PP, 특성/패시브, 개체값(IVs), 성격(Nature), 이로치 여부 및 등급(`isShiny`, `shinyTier` 0~3), 지닌 물건(`heldItems`) |
| **스타팅 포켓몬 데이터** | `starter_data` | 해금된 스타팅 포켓몬 목록, 알 기술 해금 현황, 패시브 해금 여부, 코스트 감소 및 사탕(Candies) 보유량 |
| **도감 데이터** | `dex_data` | 포획 및 조우한 포켓몬 번호, 이로치 형태 등록 기록 |
| **세이브 슬롯** | `game_slots` | 선택한 스타팅, 파티 엔트리, 현재 웨이브 및 바이옴, 보유 아이템, 소지금, 점수 |
| **뽑기(가챠) 및 설정** | `vouchers`, `users` | 알 뽑기 바우처 티켓(일반/플러스/프리미엄/골드) 수량, 선호 언어(`ko`/`en`), 최고 도달 웨이브 |

### 3. 커스텀 스프라이트 및 이미지 렌더링 에셋 처리 방식
1. **실시간 인메모리 생성 (On-the-fly Rendering)**:
   * 배틀 화면, 기술 이펙트 GIF, 가챠 연출, 도감 미리보기 등 모든 그래픽 결과물은 서버 메모리(RAM) 및 임시 캔버스(Node Canvas)에서 실시간으로 렌더링된 후 디스코드 메시지 첨부파일로 직접 전송됩니다.
2. **개인 미디어 미수집**: 이용자의 사적인 사진이나 파일을 수집, 저장, 분석하지 않습니다.
3. **커스텀 에셋 및 스프라이트 캐시**:
   * PokeRogue, SpriteCollab, Showdown 기반의 커스텀 이로치/폼 스프라이트 또는 호스트 로컬 설정 에셋(`custom_player.png` 등)은 게임 연출을 위한 정적 리소스로서만 활용되며, 어떠한 유저 추적 코드도 포함되어 있지 않습니다.
4. **불법·유해 에셋 무관용 및 면책**:
   * 봇은 이용자의 사적 이미지나 불법 미디어를 영구 저장·배포하지 않으며, 호스트나 이용자가 임의로 저작권 침해물, 음란물, 혐오물 등 불법 에셋을 적용할 경우 이에 대한 모든 법적 책임은 해당 행위자 본인에게 있습니다 ([TERMS.md](TERMS.md) 참조).

### 4. 데이터 보관 위치 및 제3자 제공 금지
* **로컬 격리 저장**: 모든 유저 데이터는 해당 봇을 구동하는 호스트 머신의 로컬 SQLite 파일(`data/roguepot.sqlite`)에만 저장됩니다.
* **제3자 제공 일체 없음**: 수집된 데이터는 어떠한 외부 서버나 제3자(광고업체, 분석업체 등)로 전송되거나 판매되지 않습니다.

### 5. 데이터 보유 기간 (Retention Period)
* **결정 주체**: 데이터 보유 기간은 각 봇 인스턴스를 운영하는 **호스트 운영자가 자체적으로 결정**합니다. 본 프로젝트의 원작자는 데이터를 직접 수집·보관하지 않으므로 보유 기간에 관한 책임을 지지 않습니다.
* **권장 기준**: 호스트 운영자는 마지막 활동(게임 플레이 또는 명령어 사용)으로부터 **12개월 이상** 비활성 상태인 계정의 데이터를 정기적으로 삭제할 것을 **권장**합니다.
* **즉시 삭제 요청**: 이용자의 명시적 삭제 요청 시 즉각 파기합니다 (아래 이용자 권리 참조).
* **법적 보존 의무**: 관련 법령에 의해 특정 기간 보관이 의무화된 경우, 해당 기간 동안 최소한의 데이터를 보관할 수 있습니다.

### 6. 이용자의 데이터 삭제 권리 (User Rights)
* 이용자는 인게임 명령어를 통해 자신의 세이브 슬롯을 삭제할 수 있습니다.
* 봇 호스트 운영자에게 문의하여 자신의 디스코드 User ID에 매핑된 모든 개인 포켓몬, 세이브, 도감 데이터의 영구 파기를 요청할 수 있으며, 요청 시 데이터베이스에서 즉각 완전 삭제됩니다.

### 7. 자가 호스팅(Self-Hosters)에 대한 안내
* 본 프로젝트는 오픈소스이므로, 누구나 코드를 내려받아 독립된 봇 인스턴스를 구축할 수 있습니다.
* 타인이 운영하는 봇 인스턴스를 이용할 경우, 해당 봇의 호스트 운영자가 개인정보 관리 책임자(Data Controller)로서 데이터를 보관·삭제할 책임을 가집니다.

---

## 🇺🇸 [English] Privacy Policy

This Privacy Policy explains how **ROGUEPot** ("Bot", "Software") collects, processes, stores, and deletes user data.

### 1. Primary Identifier Collected
* **Discord User ID**:
  * We collect only your **numeric Discord User ID** for the strict purpose of mapping game save slots, Pokédex completion status, and language preferences.
  * **Information We DO NOT Collect**: We never collect or store real names, email addresses, phone numbers, passwords, billing/payment details, voice streams, or private messages (DMs).

### 2. Personal Pokémon & Gameplay Data Breakdown
To provide roguelike progression and save functionality, the following virtual data is stored in the local SQLite database (`roguepot.sqlite`):

| Category | Database Target | Stored Attributes |
| :--- | :--- | :--- |
| **Personal Pokémon (Party & Boxes)** | `game_slots`, `multiplayer_team` | Species ID, custom nickname, level, current/max HP, learned moves & PP, abilities, passive skills, hidden abilities, IVs (Individual Values), nature, shiny status & shiny tier (Tier 0–3), and held items |
| **Starter Pokémon Registry** | `starter_data` | Unlocked starters, egg moves, passive unlocks, cost reduction upgrades, and candies count |
| **Pokédex Records** | `dex_data` | Caught/seen Pokémon indices, shiny form unlocks |
| **Game Save Slots** | `game_slots` | Current active party, wave number, biome, inventory items, money, and score |
| **Gacha & Preferences** | `vouchers`, `users` | Egg gacha voucher tickets (regular/plus/premium/gold), preferred language (`ko`/`en`), and highest wave achieved |

### 3. Custom Sprites & Image/Asset Rendering
1. **Dynamic In-Memory Generation**:
   * All graphical outputs (battle screen renders, move effect GIFs, gacha animations, Pokédex cards) are generated dynamically in server memory (Node Canvas) and dispatched directly as Discord attachments.
2. **No User Media Scraping**: The Bot never scrapes, persists, or analyzes users' personal images, avatars, or media.
3. **Custom Sprites**:
   * Custom shiny variants (Tier 1–3) and community sprites (from PokéRogue, SpriteCollab, and Showdown) or optional local custom sprites (`custom_player.png`) are treated solely as static rendering assets and contain no tracking telemetry.
4. **Zero Tolerance for Unlawful Material**:
   * The software does not host or distribute unlawful media (e.g., copyright-infringing assets, NSFW, hate symbols, illegal content). Any local deployment of such assets is the sole legal liability of the host/user (see [TERMS.md](TERMS.md)).

### 4. Storage & Zero Third-Party Sharing
* **Local Storage Only**: All user gameplay records are kept exclusively in the local SQLite database (`data/roguepot.sqlite`) on the host machine running the instance.
* **No Selling or Sharing**: We do not sell, rent, or disclose any user data to third parties, advertisers, or analytics brokers.

### 5. Data Retention Period
* **Who Decides**: Data retention periods are determined solely by each **Host Operator** running their own instance. The original Author does not collect or store user data directly and bears no responsibility for retention decisions made by self-hosters.
* **Recommended Practice**: Host Operators are **recommended** to routinely purge data for accounts that have been inactive for **12 months or more** (no gameplay or commands executed), in line with data minimization principles under GDPR and the Korean Personal Information Protection Act.
* **On-Request Deletion**: User data is permanently purged immediately upon an explicit deletion request (see Section 6 below).
* **Legal Retention Obligations**: Where applicable law mandates a minimum retention period, only the minimum required data will be retained for that legally prescribed duration.

### 6. User Data Deletion Rights
* Users can delete or overwrite their save slots at any time via the in-game UI.
* Users may request permanent erasure of all data associated with their Discord User ID by contacting the Host Operator. Upon request, all matching database records are immediately purged.

### 7. Notice for Self-Hosters
* As an open-source project, anyone can host an independent instance of ROGUEPot.
* If you play on an instance hosted by a third party, that Host Operator serves as the independent Data Controller responsible for data retention and handling deletion requests for that specific instance.
