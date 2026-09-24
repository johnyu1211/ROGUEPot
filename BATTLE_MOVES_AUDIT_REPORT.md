# 📋 ROGUEPot 배틀 기술 로직 종합 검수 및 진단 보고서

> **문서 목적**: `/open` 명령어 기반 실전 게임 플레이 시, 현재 구현된 기술(No.001 ~ No.140) 및 전체 배틀 엔진 파이프라인의 로직 이상 유무를 전수 조사하고 정리한 기술 감사 보고서입니다.  
> ⚠️ **본 문서는 사용자 요청에 따라 코드 수정을 일절 진행하지 않고, 순수 로직 분석 및 이상 현상 진단 결과만을 수록하였습니다.**

---

## 📌 목차
1. [검수 개요 및 점검 범위](#1-검수-개요-및-점검-범위)
2. [🚨 중대 결함 및 버그 발견 사항 (상세 분석)](#2--중대-결함-및-버그-발견-사항-상세-분석)
   - [결함 1: 빛의장막 & 리플렉터 데미지 반감 효과 미작동 (더미 텍스트)](#결함-1-빛의장막-113--리플렉터-115-데미지-반감-효과-미작동-더미-텍스트)
   - [결함 2: 참기(Bide) 2턴째 데미지 초기화 선반영 버그 (항상 1 데미지)](#결함-2-참기-117-bide-2턴째-데미지-초기화-선반영-버그-항상-1-데미지)
   - [결함 3: 날려버리기 & 울부짖기 적 시전 시 플레이어 포켓몬 미갱신 (Desync)](#결함-3-날려버리기-018--울부짖기-046-적-시전-시-플레이어-포켓몬-미갱신-desync)
   - [결함 4: 고양이돈받기(Pay Day) 인게임 소지금(Money) 미지급](#결함-4-고양이돈받기-006-pay-day-인게임-소지금money-미지급)
3. [⚠️ 본가 고증 누락 및 밸런스 이슈](#3-️-본가-고증-누락-및-밸런스-이슈)
   - [이슈 1: 점프킥 & 무릎차기 빗나감 충돌 피해(Crash Damage) 미구현](#이슈-1-점프킥-026--무릎차기-136-빗나감-충돌-피해crash-damage-미구현)
   - [이슈 2: 짓밟기 & 돌려차기 30% 풀죽음(Flinch) 부가효과 누락](#이슈-2-짓밟기-023--돌려차기-027-30-풀죽음flinch-부가효과-누락)
   - [이슈 3: 난동부리기 & 꽃잎댄스 다턴 강제 지속 및 피로 혼란 미구현](#이슈-3-난동부리기-037--꽃잎댄스-080-다턴-강제-지속-및-피로-혼란-미구현)
4. [✅ 정상 작동 확인 및 우수 구현 기술 분류별 현황표](#4--정상-작동-확인-및-우수-구현-기술-분류별-현황표)
5. [🎮 `/open` 환경 UI / PP / 인터랙션 연동 검증](#5--open-환경-ui--pp--인터랙션-연동-검증)
6. [🛠️ 향후 개선 및 수정 권장 로드맵 (코드 가이드)](#6-️-향후-개선-및-수정-권장-로드맵-코드-가이드)

---

## 1. 검수 개요 및 점검 범위

- **검수 일시**: 2026-09-23
- **대상 명령어**: `/open` (포켓로그 디스코드 세션 기반 배틀)
- **대상 기술군**: No.001 (막치기) ~ No.140 (구슬던지기) 전수 검사 및 Gen 1~9 전체 배틀 엔진 파이프라인
- **점검 소스코드**:
  - `src/battle/engine/BattleEngine.ts` (턴 오케스트레이터, 우선도, 속도, PP, 행동 순서)
  - `src/battle/engine/TurnActionExecutor.ts` (단일 행동 실행 파이프라인)
  - `src/battle/engine/TurnEndProcessor.ts` (턴 종료 상태이상, 날씨, 트랩, 랭크 카운트다운)
  - `src/battle/mechanics/damageCalculator.ts` (Gen 8/9 정규 데미지 공식, 급소, 상성, 보정)
  - `src/battle/mechanics/accuracyEngine.ts` (명중률/회피율, 필중기, 날씨 보정)
  - `src/battle/mechanics/actionValidator.ts` (수면, 마비, 얼음, 풀죽음, 혼란자해, 도발, 사슬묶기)
  - `src/battle/mechanics/secondaryEffects.ts` (흡수, 반동, 스탯다운, 상태이상 부여, 풀죽음)
  - `src/battle/mechanics/vulnerabilityRules.ts` (공중날기, 구멍파기 등 세미무적 취약점)
  - `src/battle/moves/traits/specialDamageRegistry.ts` (일격필살, 고정피해, 카운터, 참기 등)
  - `src/battle/moves/traits/specialStatusRegistry.ts` (변화기 전수 핸들러)
  - `src/events/interactionCreate.ts` (버튼 생성, PP 검증, 충전기 잠금, 프리로드 연동)

---

## 2. 🚨 중대 결함 및 버그 발견 사항 (상세 분석)

### 결함 1: 빛의장막 (113) & 리플렉터 (115) 데미지 반감 효과 미작동 (더미 텍스트)
- **위험도**: 🔴 **High (기능 상실)**
- **관련 파일**:
  - `src/battle/moves/traits/specialStatusRegistry.ts` (L499~500)
  - `src/battle/mechanics/damageCalculator.ts`
  - `src/battle/engine/TurnEndProcessor.ts`
- **원인 분석**:
  1. `specialStatusRegistry.ts`에서 기술 시전 시 단순히 안내 텍스트(`빛의장막으로 특수공격에 강해졌다! (5턴)`)만 반환하고, 정작 포켓몬이나 배틀 객체에 지속 턴 플래그(`actor.lightScreenTurns = 5`, `actor.reflectTurns = 5`)를 설정하지 않습니다.
  2. `damageCalculator.ts`에서 수비자(`target`)의 `lightScreenTurns`나 `reflectTurns`를 체크하여 특수/물리 피해를 0.5배(50%)로 경감시키는 계산식이 완전히 누락되어 있습니다.
  3. `TurnEndProcessor.ts`에서도 턴이 지날 때마다 지속 턴을 1씩 차감하고 5턴 뒤 해제하는 카운트다운 로직이 없습니다.
- **결과**: 플레이어나 적이 빛의장막/리플렉터를 사용해도 **실제 데미지가 전혀 줄어들지 않고 PP만 소모되는 완전한 더미 기술**로 작동합니다.

---

### 결함 2: 참기 (117, Bide) 2턴째 데미지 초기화 선반영 버그 (항상 1 데미지)
- **위험도**: 🔴 **High (로직 실행 순서 오류)**
- **관련 파일**:
  - `src/battle/engine/TurnActionExecutor.ts` (L251~255)
  - `src/battle/moves/traits/specialDamageRegistry.ts` (L226)
- **원인 분석**:
  1. 1턴째에 참기를 쓰면 `actor.chargingMove = "bide"`가 되고, 상대에게 공격을 받으면 `target.bideDamageTaken += damage`로 피해가 정상 축적됩니다.
  2. 그러나 2턴째에 축적된 데미지를 방출할 때, `TurnActionExecutor.ts`에서:
     ```typescript
     // Turn 2: Unleash attack
     actor.chargingMove = null;
     actor.isSemiInvulnerable = false;
     actor.semiInvulnerableState = null;
     actor.bideDamageTaken = 0; // ⚠️ calculateDamage 호출 전에 0으로 지워버림!
     ```
  3. 직후 `calculateDamage` -> `specialDamageRegistry.ts`가 호출되면:
     ```typescript
     const damage = Math.max(1, (actor.bideDamageTaken ?? 25) * 2);
     ```
     `actor.bideDamageTaken`이 이미 `0`이므로 `(0 ?? 25) * 2 = 0`이 되고, `Math.max(1, 0)`에 의해 **상대에게 무조건 고정 1 데미지만 주게 됩니다.**
- **결과**: 참기를 사용하는 포켓몬이 아무리 큰 데미지를 축적해도 상대에게 항상 1 데미지만 반사합니다.

---

### 결함 3: 날려버리기 (018) & 울부짖기 (046) 적 시전 시 플레이어 포켓몬 미갱신 (Desync)
- **위험도**: 🔴 **High (객체 불일치 및 게임 진행 오류)**
- **관련 파일**:
  - `src/battle/moves/traits/specialStatusRegistry.ts` (L208~215)
- **원인 분석**:
  적 야생/보스 포켓몬이 플레이어에게 날려버리기/울부짖기를 사용했을 때:
  ```typescript
  if (aliveIndices.length > 0) {
    const randomPick = aliveIndices[Math.floor(Math.random() * aliveIndices.length)];
    battle.playerParty[battle.playerActiveIndex].hp = target.hp; // ⚠️ 인덱스 변경 전 잘못된 대입
    battle.playerActiveIndex = randomPick.idx;
    // Re-create battle mon through external caller or factory (미구현 방치!)
    return isKo ? `${targetName}(은)는 돌풍에 날아가 볼로 돌아갔다!` : ...;
  }
  ```
  1. `teleport`(순간이동, L263)에서는 교체 시 `battle.playerBattleMon = createPlayerBattleMon(...)`을 호출하여 활성 포켓몬 객체를 즉시 새로 생성하지만, 날려버리기/울부짖기에서는 주석만 남겨두고 생성을 누락했습니다.
  2. 그 결과 `battle.playerActiveIndex`는 바뀌었는데 필드의 `battle.playerBattleMon`은 교체 전 이전 포켓몬 객체 그대로 남아있습니다.
- **결과**: 적이 날려버리기를 쓰면 파티 인덱스는 변경되지만, 전투 화면과 다음 턴 배틀 로직에서는 이전 포켓몬이 그대로 싸우거나 HP가 꼬이는 중대한 상태 불일치가 발생합니다.

---

### 결함 4: 고양이돈받기 (006, Pay Day) 인게임 소지금(Money) 미지급
- **위험도**: 🟡 **Medium (인게임 경제 보상 미반영)**
- **관련 파일**:
  - `src/battle/mechanics/secondaryEffects.ts` (L35~38)
  - `src/battle/engine/TurnActionExecutor.ts` (L424)
- **원인 분석**:
  `secondaryEffects.ts`의 `applySecondaryAttackEffects` 함수에 `battle` 객체가 인자로 전달되지 않습니다.
  ```typescript
  if (mName === "pay-day" || mName === "payday") {
    const coinGain = actor.level * 5;
    log += isKo ? `\n동전을 마구 주워 +P ${coinGain.toLocaleString()}을 획득했다!` : ...;
  }
  ```
  텍스트 로그는 정상적으로 출력되지만, `battle.money += coinGain`을 수행하는 코드가 전혀 존재하지 않습니다.
- **결과**: 고양이돈받기를 사용해도 실제 플레이어의 소지금은 1원도 증가하지 않는 시각적 표기 버그입니다.

---

## 3. ⚠️ 본가 고증 누락 및 밸런스 이슈

### 이슈 1: 점프킥 (026) & 무릎차기 (136) 빗나감 충돌 피해(Crash Damage) 미구현
- **관련 파일**: `src/battle/engine/TurnActionExecutor.ts` (L300~323)
- **상세 내용**:
  - 포켓몬 본가 배틀의 핵심 규칙: 점프킥과 무릎차기(하이점프킥)는 기술이 빗나가거나, 상대가 방어하거나, 고스트 타입에 무효화되었을 때 **시전자가 최대 HP의 절반(50%)을 충돌 피해로 자해**해야 합니다.
  - 현재 ROGUEPot 엔진에서는 빗나감/방어 시 오직 `isSelfDestruct`(자폭) 여부만 체크하며, 점프킥 계열의 충돌 피해(Crash Damage)가 전혀 구현되어 있지 않아 일반 빗나감으로 끝납니다.
  - **영향**: 위력 100/130의 고위력 기술을 아무런 리스크 없이 난사할 수 있어 밸런스상 결함이 존재합니다.

### 이슈 2: 짓밟기 (023) & 돌려차기 (027) 30% 풀죽음(Flinch) 부가효과 누락
- **관련 파일**: `src/battle/mechanics/secondaryEffects.ts` (L51~64)
- **상세 내용**:
  - 본가에서 짓밟기(stomp)와 돌려차기(rolling-kick)는 30% 확률로 상대를 풀죽게 만드는 대표적인 풀죽음 기술입니다.
  - `secondaryEffects.ts`의 풀죽음 목록(`["bite", "rock-slide", "iron-head", "air-slash", "headbutt"]`)에 `stomp`와 `rolling-kick`이 누락되어 있어 부가효과가 발생하지 않습니다.

### 이슈 3: 난동부리기 (037) & 꽃잎댄스 (080) 다턴 강제 지속 및 피로 혼란 미구현
- **관련 파일**: `src/battle/engine/TurnActionExecutor.ts`, `src/battle/moves/traits/moveTraits.ts`
- **상세 내용**:
  - 본가에서 난동부리기와 꽃잎댄스는 2~3턴 동안 기술이 강제 지속된 후, 종료 시 **피로로 인해 시전자가 혼란(Confused)**에 걸리는 고유 메커니즘을 가집니다.
  - 현재 ROGUEPot에서는 이 메커니즘이 구현되어 있지 않아, 페널티 없는 단발 120위력 고위력기로 동작합니다.

---

## 4. ✅ 정상 작동 확인 및 우수 구현 기술 분류별 현황표

1~140번 기술의 대다수 핵심 메커니즘은 고증에 맞추어 정교하게 구현되어 있으며, 배틀 턴 시뮬레이션에서도 정상 동작을 확인했습니다.

| 분류 | 대상 기술 (번호 / 기술명) | 구현 상태 및 검증 결과 |
|---|---|---|
| **일격필살기** | 012 가위자르기, 032 뿔드릴, 090 땅가르기 | ✅ **완벽 구현**: 레벨 차이 기반 명중 공식(`30 + (Lv차)`), 시전자 레벨이 낮을 시 실패, 옹골참(Sturdy) 특성 무효화, 방어 및 타입 상성 무효화 정상. |
| **고정 데미지기** | 049 소닉붐(20), 069 지구던지기(Lv), 082 용의분노(40), 101 나이트헤드(Lv) | ✅ **완벽 구현**: 스탯/방어 무시 고정 수치 반영, 고스트/노말/페어리 상성 무효(0배) 처리 정상. |
| **반사기** | 068 카운터 (Counter) | ✅ **완벽 구현**: 우선도 -5, 턴 중 받은 물리 피해 2배 반사, 특수 공격 및 미피격 시 실패, 고스트 무효 정상. |
| **조건부 흡수기** | 138 꿈먹기 (Dream Eater) | ✅ **완벽 구현**: 상대가 수면(`slp`) 상태가 아니면 실패, 적중 시 위력 100 피해의 50% HP 흡수 완벽 연계. |
| **자폭기** | 120 자폭 (Self-Destruct) | ✅ **완벽 구현**: 위력 200, 습기(Damp) 특성 시 시전 차단 및 폭발 방지, 빗나가거나 방어당해도 시전자 기절 정상. |
| **반동 행동불능** | 063 파괴광선 (Hyper Beam) | ✅ **완벽 구현**: 위력 150 특수기, 적중 후 다음 턴 반동으로 행동 불가(`mustRecharge`) 정상. |
| **지속 턴 봉인/방어**| 050 사슬묶기 (Disable), 054 흰안개 (Mist) | ✅ **완벽 구현**: 사슬묶기 4턴간 사용 차단, 흰안개 5턴간 상대 디버프 완전 차단 및 턴 종료 시 해제 메시지 정상. |
| **급소 특화 & 버프** | 002 태권당수, 013 칼바람, 075 잎날가르기 + 116 기충전 | ✅ **완벽 구현**: 기충전 단독 50% 급소, 급소 기술 25%, 기충전+급소 기술 병용 시 100% 확정 크리티컬 공식 적용. |
| **랜덤 / 복사기** | 118 손가락흔들기, 102 흉내쟁이, 119 따라하기 | ✅ **완벽 구현**: 손가락흔들기는 전체 기술 풀 무작위 발동 및 애니메이션 연계, 흉내쟁이/따라하기는 상대 기술 복사 후 즉시 실행. |
| **구속 / 트랩기** | 020 바인드, 035 김밥말이, 083 회오리불꽃, 128 껍질끼우기 | ✅ **완벽 구현**: 4~5턴 구속 상태 부여, 매 턴 종료 시 1/8 도트 데미지, 구속 종료 시 해제 메시지 정상. |
| **2턴 충전기** | 019 공중날기, 076 솔라빔, 091 구멍파기, 130 로케트박치기 | ✅ **완벽 구현**: 공중/땅속 세미무적, 지진/바람일으키기 취약점 연계(2배 피해), 쾌청 시 솔라빔 즉발 및 비/모래바람 시 50% 위력 감소, 로케트박치기 충전 턴 방어 +1 정상. |
| **다타 공격기** | 003 연속뺨치기, 004 연속펀치, 024 두번차기, 031 마구찌르기, 041 더블니들, 042 바늘미사일, 131 가시대포, 140 구슬던지기 | ✅ **완벽 구현**: 2~5회 확률 분포(가중치) 및 2회 고정 타수 반영, 더블니들 20% 독 부가효과 정상. |
| **흡수 & 반동** | 071 흡수, 072 메가드레인, 036 돌진, 038 이판사판태클, 066 지옥의바퀴 | ✅ **완벽 구현**: 데미지의 50% 회복, 25%~33% 반동 데미지 정상 적용. |
| **상태이상기** | 047 노래하기, 077 독가루, 078 저리가루, 079 수면가루, 086 전기자석파, 092 맹독, 095 최면술, 109 이상한빛, 137 뱀눈초리, 139 독가스 | ✅ **완벽 구현**: 독/강철 타입 독 면역, 전기 타입 마비 면역, 뱀눈초리(노말)의 땅 타입 마비 성공, 맹독의 턴당 n/16 점증 피해, 수면 2~3턴 보장 및 턴 종료 기상 정상. |
| **스탯 랭크기** | 014 칼춤, 028 모래뿌리기, 039 꼬리흔들기, 043 째려보기, 045 울음소리, 074 성장, 081 실뿜기, 096 요가포즈, 097 고속이동, 103 싫은소리, 104 그림자분신, 106 단단해지기, 107 작아지기, 108 연막, 110 껍질에숨기, 111 웅크리기, 112 배리어, 114 흑안개, 133 망각술, 134 숟가락구부리기 | ✅ **완벽 구현**: ±1 ~ ±6 랭크 배율 공식 정확 반영, 흑안개 시 양측 모든 랭크 0으로 초기화 정상. |
| **회복기** | 105 HP회복, 135 알낳기 | ✅ **완벽 구현**: 최대 체력의 50% 회복, 풀피 시 "HP가 이미 가득 차 있다" 실패 처리 정상. |

---

## 5. 🎮 `/open` 환경 UI / PP / 인터랙션 연동 검증

디스코드 상호작용(`interactionCreate.ts`) 및 배틀 세션 관리 관점에서의 검증 결과입니다:

1. **PP 소모 및 차감**:
   - 기술 사용 시 `playerMon.movePps`가 정상적으로 1씩 차감되며, 활성 슬롯 파티 데이터에 즉시 동기화됩니다.
   - PP가 0인 기술은 버튼이 `disabled` 상태로 비활성화되어 부정 사용을 원천 차단합니다.
2. **2턴 충전기 UI 안전장치**:
   - 솔라빔, 공중날기, 구멍파기, 로케트박치기 등 충전 중인 턴에는 **충전 중인 기술만 활성화**되고 라벨이 `⚔️ [기술명] 공격!`으로 변경되며, 뒤로가기 버튼이 숨겨져 기술 취소나 턴 꼬임이 발생하지 않도록 훌륭히 방어되어 있습니다.
   - 1턴째(충전 턴)에만 PP가 1 소모되고, 2턴째(방출 턴)에는 PP가 중복 소모되지 않습니다.
3. **사전 프리로드(Preload) 캐싱 연동**:
   - 유력한 기술을 미리 예측하여 백그라운드에서 GIF를 렌더링해 두는 `battlePreloadService`가 작동하여, 버튼 클릭 시 지연 없이 부드러운 화면 전환을 보장합니다.
4. **자동 복구 핸들러**:
   - 배틀 도중 예외가 발생하더라도 `catch (moveErr)`에서 세션을 초기화하지 않고 현재 상태(MAIN/SWITCH/VICTORY)를 유지한 채 안전하게 화면을 재렌더링하는 복구 루틴이 마련되어 있습니다.

---

## 6. 🛠️ 향후 개선 및 수정 권장 로드맵 (코드 가이드)

> 💡 **알림**: 사용자의 요청에 따라 현재는 코드를 수정하지 않았습니다. 차후 사용자가 수정을 승인하거나 지시할 때 바로 적용할 수 있도록 파일별 권장 수정안을 정리해 두었습니다.

### 1) 빛의장막 & 리플렉터 구현 가이드
- **`src/battle/moves/traits/specialStatusRegistry.ts`**:
  ```typescript
  if (mName === "light-screen") {
    actor.lightScreenTurns = 5;
    return isKo ? `빛의장막으로 특수공격에 강해졌다! (5턴)` : `Light Screen raised special defense! (5 turns)`;
  }
  if (mName === "reflect") {
    actor.reflectTurns = 5;
    return isKo ? `리플렉터로 물리공격에 강해졌다! (5턴)` : `Reflect raised physical defense! (5 turns)`;
  }
  ```
- **`src/battle/mechanics/damageCalculator.ts`**:
  ```typescript
  // 데미지 계산식 후반부에 수비자의 장막 체크
  if (isSpecial && target.lightScreenTurns && target.lightScreenTurns > 0) {
    singleHitDamage = Math.floor(singleHitDamage * 0.5);
  } else if (!isSpecial && target.reflectTurns && target.reflectTurns > 0) {
    singleHitDamage = Math.floor(singleHitDamage * 0.5);
  }
  ```
- **`src/battle/engine/TurnEndProcessor.ts`**:
  `mistTurns`처럼 매 턴 1씩 차감하고 0이 되었을 때 "빛의장막/리플렉터가 사라졌다" 로그 출력.

### 2) 참기(Bide) 데미지 초기화 순서 수정 가이드
- **`src/battle/engine/TurnActionExecutor.ts`**:
  L254의 `actor.bideDamageTaken = 0;`을 데미지 계산(`calculateDamage`)이 완료된 후인 **L415 이후**로 이동:
  ```typescript
  // Turn 2 방출 시점 (L254)에서는 0으로 리셋하지 않음!
  // 데미지 계산 및 피해 전달이 완료된 L415 이후에서 초기화:
  if (activeMoveKey === "bide" || activeMoveKey === "bide-charge") {
    actor.bideDamageTaken = 0;
  }
  ```

### 3) 날려버리기 & 울부짖기 활성 포켓몬 갱신 가이드
- **`src/battle/moves/traits/specialStatusRegistry.ts`**:
  ```typescript
  if (aliveIndices.length > 0) {
    const randomPick = aliveIndices[Math.floor(Math.random() * aliveIndices.length)];
    battle.playerParty[battle.playerActiveIndex].hp = target.hp;
    battle.playerActiveIndex = randomPick.idx;
    // ✅ 누락된 활성 포켓몬 재생성 추가
    battle.playerBattleMon = createPlayerBattleMon(battle.playerParty[randomPick.idx], battle.playerParty);
    return isKo
      ? `${targetName}(은)는 돌풍에 날아가 볼로 돌아갔다!\n가랏, ${battle.playerBattleMon.name}!`
      : `${targetName} was blown away!\nGo, ${battle.playerBattleMon.name}!`;
  }
  ```

### 4) 고양이돈받기 소지금 반영 가이드
- **`src/battle/engine/TurnActionExecutor.ts`**:
  `applySecondaryAttackEffects`에 `battle` 객체를 전달하거나, L35의 `pay-day` 처리 시 `if (battle && isActorPlayer) battle.money += coinGain;` 추가.

### 5) 점프킥 & 무릎차기 크래시 데미지 추가 가이드
- `TurnActionExecutor.ts`의 빗나감(L300) 및 방어(L313) 블록에서 해당 기술일 경우 `actor.hp = Math.max(0, actor.hp - Math.floor(actor.maxHp * 0.5))` 차감 및 자해 로그 추가.

---

## 7. 결론 요약
- No.001 ~ No.140까지 구현된 모든 기술은 **TypeScript 컴파일 에러가 없으며, 런타임 크래시 없이 안정적으로 턴이 교환**됩니다.
- 그러나 실제 배틀 로직의 세부 메커니즘을 심층 분석한 결과, **[빛의장막/리플렉터의 효과 미적용]**, **[참기 데미지 1 고정 버그]**, **[날려버리기 시 적 대상 활성 포켓몬 미갱신]**, **[고양이돈받기 실제 소지금 미지급]** 등 4가지 명백한 로직 결함이 확인되었습니다.
- 본 보고서를 바탕으로 유저의 확인 및 지시 후 순차적으로 로직을 보완하면 배틀 시스템의 완성도를 한층 더 높일 수 있습니다.
