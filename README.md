# 🎮 ROGUEPot (PokeRogue on Discord)

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

## ⚖️ License & Disclaimer

### License
This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for details.

### Disclaimer
* **ROGUEPot** is an unofficial, non-profit fan-made project created for educational and community entertainment purposes.
* Pokémon and Pokémon character names, sprites, and audio are trademarks and copyrights of **Nintendo**, **Creatures Inc.**, and **GAME FREAK Inc.**
* This project is not affiliated with, endorsed by, or sponsored by Nintendo or Game Freak.
