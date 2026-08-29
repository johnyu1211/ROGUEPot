# PokeRogue Discord Bot

[PokeRogue](https://github.com/pagefaultgames/pokerogue) 기반의 디스코드 봇 프로젝트입니다.

---

## 📁 프로젝트 구조

```
PokerogueBot/
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
    ├── services/           # Pokerogue 데이터 및 비즈니스 로직
    ├── types/              # TypeScript 인터페이스 및 타입 정의
    └── utils/              # Embed 생성기 및 유틸리티
```

---

## ⚙️ 사전 설정 (Discord Developer Portal)

1. [Discord Developer Portal](https://discord.com/developers/applications)에 접속하여 로그인합니다.
2. **New Application**을 클릭하여 애플리케이션을 생성합니다.
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

## 📜 License & Disclaimer

### License
This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for details.

### Disclaimer
- This is an unofficial, non-profit fan-made project built with references to [PokeRogue](https://github.com/pagefaultgames/pokerogue).
- Pokémon and Pokémon character names are trademarks of Nintendo, Creatures Inc., and GAME FREAK Inc.
