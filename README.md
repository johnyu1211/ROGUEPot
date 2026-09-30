# 🎮 ROGUEPot (PokeRogue on Discord)

> [!WARNING]
> ### ⚠️ 현재 개발 진행 중 안내 (Under Active Development)
> **본 프로젝트는 현재 활발히 개발 중인 단계로, 전체적인 시스템 및 배틀 상태가 완전하지 않습니다.**
> - 일부 기능이 정상 작동하지 않거나 게임플레이 중 예기치 않은 오류가 발생할 수 있습니다.
> - 안정적인 플레이보다는 기능 구현 및 테스트 목적으로 운영되고 있으니 참고 부탁드립니다.

**ROGUEPot**은 [PokeRogue](https://github.com/pagefaultgames/pokerogue) 로그라이크 포켓몬 게임을 디스코드에서 직접 플레이할 수 있도록 제공하는 디스코드 게임 봇입니다.

---

## 📁 프로젝트 구조

```
ROGUEPot/
├── .env.example            # 환경변수 템플릿
├── .env                    # 환경변수 설정 파일
├── LICENSE                 # GNU AGPL v3 라이선스 파일
├── package.json            # Node.js 패키지 정의
├── tsconfig.json           # TypeScript 설정
├── pokerogue-source/       # Pokerogue 원본 소스코드
├── scripts/
│   └── deploy-commands.ts  # 슬래시 커맨드(/) 등록 스크립트
└── src/
    ├── index.ts            # 봇 진입점
    ├── config/             # 환경변수 로더 및 검증
    ├── core/               # Discord Client 인스턴스화 및 핸들러 등록
    ├── commands/           # 슬래시 커맨드 핸들러 목록
    ├── events/             # 디스코드 이벤트 핸들러 (ready, interaction 등)
    ├── services/           # Pokerogue 게임 엔진 & 데이터 서비스
    ├── types/              # TypeScript 인터페이스 및 타입 정의
    └── utils/              # Embed 생성기 및 유틸리티
```

---

## ⚙️ 사전 설정 (Discord Developer Portal)

1. [Discord Developer Portal](https://discord.com/developers/applications)에 접속하여 로그인합니다.
2. **New Application**을 클릭하여 **`ROGUEPot`** 애플리케이션을 생성합니다.
3. 좌측 메뉴 **Bot** 탭:
   - **Reset Token**을 눌러 토큰을 복사하여 `.env` 파일의 `DISCORD_TOKEN`에 입력합니다.
4. 좌측 메뉴 **General Information** 또는 **OAuth2** 탭:
   - **Application ID (Client ID)** 를 복사하여 `.env`의 `CLIENT_ID`에 입력합니다.
5. (선택사항) 개발/테스트용 디스코드 서버 ID를 `.env`의 `GUILD_ID`에 입력하면 커맨드가 즉각 반영됩니다.
6. **OAuth2 -> URL Generator**에서:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Embed Links`, `Use Slash Commands` 등 선택
   - 생성된 URL로 봇을 서버에 초대합니다.

---

## 🚀 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 슬래시 커맨드 등록
```bash
npm run deploy-commands
```

### 3. 봇 실행
- **개발 모드 (Hot-reload)**:
  ```bash
  npm run dev
  ```
- **프로덕션 빌드 & 실행**:
  ```bash
  npm run build
  npm start
  ```

---

---

## 📜 Credits & Acknowledgements

* **Creator & Developer**: **John**
* **[PokéRogue](https://github.com/pagefaultgames/pokerogue)**: The incredible browser-based Pokémon roguelite game developed by PageFaultGames.
* **[Pokémon Showdown](https://pokemonshowdown.com/)**: Gen 5 animated and pixel sprites CDN & Pokémon battle mechanics.
* **[PokéAPI](https://pokeapi.co/)**: Comprehensive RESTful Pokémon data API.
* **[PMD SpriteCollab (SpriteCollab)](https://sprites.pmdcollab.org/)**: Pokémon Mystery Dungeon sprite repository & community portraits, distributed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Special thanks to all contributing pixel artists!
* **[DungGeunMo Font](https://github.com/hurss/dunggeunmo)**: High-quality retro Korean pixel dot font.

---

## ⚖️ License & Legal Policies

* 📄 **[License (GNU AGPL-3.0)](LICENSE)**
* 📜 **[이용약관 (Terms of Service)](TERMS.md)**
* 🔒 **[개인정보처리방침 (Privacy Policy)](PRIVACY.md)**

---

### ⚠️ Disclaimer & Legal Notice (법적 고지 및 면책)

1. **비영리 팬메이드 프로젝트 (Non-Profit Fan Project)**
   * **ROGUEPot**은 순수 교육, 연구 및 비영리 팬 커뮤니티 목적으로 제작된 오픈소스 프로젝트입니다.
   * 본 프로젝트는 일체의 금전적 수익(유료 결제, 광고, 후원 강제 등)을 창출하지 않습니다.

2. **지식재산권 귀속 및 커스텀 에셋 (Intellectual Property & Custom Assets)**
   * 포켓몬(Pokémon) 관련 명칭, 캐릭터, 공식 스프라이트, 사운드 등의 모든 상표권 및 저작권은 **Nintendo**, **Creatures Inc.**, **GAME FREAK Inc.**에 귀속됩니다.
   * 커스텀 이로치 및 도트 그래픽은 [PMD SpriteCollab](https://sprites.pmdcollab.org/) (CC BY-NC 4.0), PokéRogue 커뮤니티 및 기여 아티스트들의 저작물이며, 비영리 목적으로 인용됩니다.
   * 본 프로젝트는 Nintendo, Creatures, 또는 GAME FREAK과 공식적인 제휴, 후원, 승인 관계가 없는 비공식 2차 창작물이며, 원저작권자의 요청 시 즉각 중단 또는 삭제될 수 있습니다.

3. **오픈소스 코드베이스 및 자가 호스팅 면책 (Open Source & Self-Hosting Liability)**
   * 본 리포지토리는 개발자 개인의 오픈소스 연구 및 코드 공유 목적으로만 관리되며, 제작자가 공식 봇 서비스를 직접 운영·제공하지 않습니다.
   * 본 코드를 직접 호스팅(Self-Host)하여 운영하는 사용자가 해당 인스턴스의 데이터 관리(SQLite), 서비스 안정성, 디스코드 개발자 정책 준수에 대한 **모든 법적·운영적 책임을 전적으로 부담**합니다.

> **English Summary**: ROGUEPot is an open-source, non-commercial fan-made project developed for educational purposes. Pokémon trademarks and copyrights belong to Nintendo, Creatures Inc., and GAME FREAK Inc. Custom sprites are credited to the community (PMD SpriteCollab CC BY-NC 4.0, PokéRogue, Showdown). The developer does not operate an official public bot service; self-hosters assume all liability for their own instances. Please refer to **[TERMS.md](TERMS.md)** and **[PRIVACY.md](PRIVACY.md)** for detailed policies.


