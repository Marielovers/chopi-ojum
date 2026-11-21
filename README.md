# GitHub Pages 즉시 배포 — 쵸피 게임 v0.1.9

이 ZIP은 **사용자가 수정한 `chopy-game(1).zip`을 기준**으로 만든 전체 소스입니다. `node_modules/` 없이 바로 GitHub에 올릴 수 있습니다. 모델 2종, 텍스처, 사용자가 가진 Cubism Core, Firebase 공개 웹 설정(`.env.production`)이 포함되어 있습니다.

## v0.1.9 수정 사항

- 이전 버전의 `clampFoodX`와 `lastStationaryX` 큐를 제거했습니다. 아무것도 하지 않은 음식은 모델의 앞을 통과하고 왼쪽 화면 밖으로 완전히 이동합니다.
- 먹이기로 밀려간 음식은 이전처럼 캐릭터에게 도착했을 때 점수를 처리하고 사라집니다. 다른 모델·UI·Firebase·GitHub 배포 설정은 그대로 유지합니다.

## GitHub 저장소로 배포 (최초 1회)

1. GitHub에서 **새 저장소**를 만듭니다. 예를 들어 `chopy-game`으로 지정합니다. 시작할 때 GitHub의 README/.gitignore 자동 생성을 체크하지 않습니다.
2. ZIP을 풀어 `package.json`, `index.html`, `.github`가 있는 폴더에서 다음 명령어를 실행합니다. `<계정>`과 `<저장소>`는 실제 이름으로 바꿉니다.

```bash
git init
git add .
git commit -m "Deploy Chopy game"
git branch -M main
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin main
```

3. GitHub 저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions**로 선택합니다.
4. **Actions** 탭에서 `Deploy Chopy game to GitHub Pages`가 성공하면 `https://<계정>.github.io/<저장소>/`로 접속합니다. 첫 push 전에 Pages Source를 지정했다면 자동 실행됩니다. 지정이 늦었다면 Actions에서 **Run workflow**를 한 번 누릅니다.
5. 이후 `main`에 `git push`할 때마다 자동으로 다시 빌드·배포됩니다.

**왜 Firebase가 즉시 연결되나요?** Firebase Web SDK에 사용되는 공개 웹 설정 6개를 `.env.production`에 포함했습니다. 별도의 GitHub Secrets 등록 없이 Actions의 `npm run build`에 적용됩니다. 이 설정값은 클라이언트용으로 공개될 수 있는 값이며, Firestore 보안은 **기존 프로젝트에 추가한 `/chopy_scores` Rules**가 담당합니다. Firebase 서비스 계정 비밀 키/관리자 키는 포함되어 있지 않습니다. Firebase 웹 설정을 다른 프로젝트로 바꾸려면 `.env.production` 값을 수정하세요.

**가로 화면:** 모바일 세로에서는 회전 안내와 일시정지, 모바일 가로에서는 게임 UI가 표시됩니다. Safari 등에서는 기기 강제 회전을 보장하지 않습니다.

## 로컬 실행 / 최종 점검

```bash
npm ci
npm run check:models
npm test
npm run dev
```

`npm run setup:core`는 **이미 포함된 사용자 제공 Core 파일이 있는 경우 필요하지 않습니다.** GitHub Pages 빌드에도 사용하지 않습니다. Core의 공개 배포는 Live2D 라이선스 조건을 확인하세요.

## 배포 시 자주 발생하는 문제

- **Actions 실패:** Actions 로그에서 `npm ci`, `npm test`, `npm run build` 중 실패한 단계 확인
- **404 / 빈 화면:** 저장소 설정에서 Pages Source를 `GitHub Actions`로 선택하고, 주소가 `https://<계정>.github.io/<저장소>/`인지 확인. `vite.config.js`의 `base:'./'`를 유지
- **Live2D 로딩 실패:** `public/vendor/live2dcubismcore.min.js`, `public/assets/models/model1/`, `model2/` 경로가 올라갔는지 확인
- **Firebase 랭킹 저장 실패:** 콘솔의 Firestore Rules, 데이터베이스 활성화, 브라우저 개발자도구 오류 메시지 확인
- **GitHub에 .env 업로드 금지:** `.env` 파일은 `.gitignore`에 의해 제외됩니다. `.env.production`은 공개 웹 설정만 포함합니다.

---

# v0.1.8 변경 사항 (사용자가 올린 chopy-game(1).zip 기준)

- **먹이기 제한시간: 사용자가 직접 수정한 60초 유지** (index.html의 초기 표시도 60초로 정정).
- **음료 +10, 과자 -30** (기존 과자 -10의 3배 패널티), 3회 음료 콤보 +20 유지.
- **과자 등장 확률 25% → 약 8.33% (1/3)**. 술 총 확률 20% 유지, 일반 음료 확률 증가.
- **먹지 않은 음식은 화면 끝까지 이동**: 캐릭터를 지나 왼쪽 끝까지 멈추지 않고 흘러가며, 이미지 전체가 화면 밖으로 나간 뒤에만 제거됩니다. 손으로 밀어 먹은 음식만 캐릭터 앞에서 사라집니다.
- **히든 power 상승 속도 1/20**: 드래그 거리당 0.0017 → 0.000085.
- **4단계 UI**: 메뉴/게이지/설명/재시작/사운드 버튼을 숨기고 `타이틀로 돌아가기` 버튼만 표시. 모델의 HitArea 조작 기능과 lock 의존관계는 유지.
- **모바일 가로 화면 전용**: 세로 화면(터치 기기)에서 회전 안내를 표시하고 게임 로직·타이머를 일시 정지합니다. 가로로 회전하면 이어서 진행합니다. 모바일 Safari는 화면 방향 API 강제 회전이 제한될 수 있어 안내 방식으로 처리합니다.
- **모바일 가로 배치**: 타이틀, 2단계 HUD/음식, 3단계 조준 패널/결과창 및 랭킹창에 낮은 높이 전용 CSS를 추가했습니다.
- `node_modules`를 ZIP에 넣지 않습니다. `npm install`로 재설치하세요.

원본 모델, Cubism Core 파일, Firebase 설정(.env), 기존 규칙 등 사용자가 제공한 파일을 유지했습니다.

---

# 쵸피 게임 v0.1.7 — 이미지 교체·밸런스·Live2D 파라미터 수정

**v0.1.6을 바탕으로 한 전체 프로젝트.** 원본 model1/model2, Firebase `.env`와 통합 Firestore Rules를 유지했습니다.

## 이번 변경 사항

- 식음료 20종을 새로운 시트에서 다시 분리했습니다. 독립 투명 PNG(256×256)에 가장자리 여백을 통일하고 작은 떠다니는 픽셀을 제거했습니다.
- 등장 주기 0.39초 → 1.10초, 화면 동시 출현 상한 19 → 12개.
- 음료 +1 → +10, 과자 -1 → -10, 3연속 보너스 +2 → +20.
- 손 크기 50% 축소, 스윕 시간 0.62초 → 1.86초(이동속도 1/3).
- 먹기 모션 시 model1 크기를 최대 20% 키웠다가 부드럽게 복귀하도록 변경.
- 히든 스테이지의 침대를 수직 상면도로 교체하고, model1을 회전하지 않고 머리가 위로 향하도록 배치.
- Live2D 파라미터는 Pixi 렌더 완료 후가 아니라 각 내부 모델의 `beforeModelUpdate` 이벤트에서 적용. 실제 `.moc3`의 파라미터 ID와 인덱스를 사용하며, 존재하지 않는 파라미터는 건너뜁니다.
- Idle 모션 파일이 없는 모델도 호흡·미세 머리 움직임·눈 깜박임을 파라미터로 애니메이션합니다.

## 실행

```bash
npm install
npm run setup:core
npm run check:models
npm test
npm run dev
```

만약 `setup:core` 다운로드에 실패하면 공식 Cubism Core 6.0.1 (`live2dcubismcore.min.js`)을 `public/vendor/`에 넣으세요. Core는 ZIP에 재배포하지 않습니다.

**검증 범위:** Node 테스트 및 JS 문법 검사. Live2D 렌더링·파라미터 반영의 브라우저 실기는 사용자 PC에서 확인해야 합니다. Firebase는 기존 `.env`의 연결정보를 사용합니다.

---

# 쵸피의 오줌 멀리 쏘기 대회 — v0.1.5 (분수형 물방울·전체 스윕·Firebase 배포 설정)

> **버전 0.1.6 주요 변경**: 제공받은 Firebase 설정 연결, MOC3 v6 호환 렌더러 적용, 기존 Firestore 규칙 5개(기존 4개 + 쵸피 신규 1개) 유지.
> **원본 Live2D 모델은 ZIP에 포함**하지만, 별도 라이선스의 Cubism Core 6.0.1을 설치해야 화면에 보입니다.


**네가 올린 원본 모델은 제거되지 않았습니다.** 아래 두 폴더에 `.moc3`와 텍스처가 들어 있습니다.
- `public/assets/models/model1/` (연회장 / 히든)
- `public/assets/models/model2/` (발사)

이전 버전은 MOC3 버전 6 모델에 구형 Cubism 4 렌더러를 사용한 점이 문제였습니다. Cubism 5.3 호환 렌더러로 교체했으며 원본 모델은 변경하지 않았습니다. Core 로딩 실패 시에는 오류를 표시합니다. 원본 모델을 렌더링할 수 없으면 이유가 화면에 표시됩니다.

**우선 권장 순서:** `npm install` → `npm run setup:core` → `npm run dev`.
`npm run setup:core`는 공식 Live2D Core 파일을 사용자의 PC로 직접 다운로드하는 선택적 명령입니다. Live2D 공식 라이선스를 검토해 사용하세요. 다운로드 실패 시에는 [공식 Cubism SDK for Web](https://www.live2d.com/ko/sdk/download/web/)에서 `live2dcubismcore.min.js`를 받아 `public/vendor/`에 배치하세요.

`npm run dev`만 실행해도 공식 Core 주소에서 자동 로딩을 시도합니다. 단, 서버가 응답하지 않는다면 로컬 Core 설치가 필요합니다. **모델 바이너리가 실제로 MOC3 버전 6임을 확인했으며, 구형 PixiJS 6 + pixi-live2d-display 대신 PixiJS 8 + @laplace.live/pixijs-live2d 0.6.1로 교체했습니다. 실제 브라우저 표시를 완료했다고 주장하지 않습니다.**

---

## 실행하기

Windows PowerShell 또는 명령 프롬프트에서:

```bash
cd chopy-game
npm install
npm run dev
```

브라우저에서 **http://127.0.0.1:5173/** 를 엽니다. 개발 서버는 휴대폰에서도 열 수 있도록 `0.0.0.0`으로 바인딩되어 있습니다. PC와 같은 Wi-Fi에 연결된 스마트폰에서는 `http://PC의_사설IP:5173/`를 사용합니다. Windows 방화벽 허용이 필요할 수 있습니다.

검증용 로직·파일구조 테스트: `npm test`; GitHub Pages용 정적 빌드: `npm run build` (`dist` 폴더 출력). `vite.config.js`에서 상대 경로 `base: './'`을 사용합니다.

브라우저 화면이나 실제 Live2D 모델 렌더링까지 통합 검증한 파일은 아닙니다. 제작 환경에서 npm 레지스트리에 연결할 수 없어 `npm run build` 전체 검증은 수행하지 못했고, CSS 문법 및 JavaScript 문법과 자체 테스트를 확인했습니다.

## Live2D Cubism Core — 중요

업로드하신 `model1.zip`과 `model2.zip`은 실제 `.moc3`를 포함합니다. 정상 표시를 위해 Cubism Core가 **별도로** 필요합니다. Cubism Core는 Live2D 고유 라이선스가 적용되는 코드이므로 이 ZIP에 복사·재배포하지 않았습니다.

1. 기본적으로 게임은 `/public/vendor/live2dcubismcore.min.js`를 먼저 찾습니다.
2. 해당 파일이 없으면 **Live2D 공식 Core 호스팅 주소**로부터 온라인 로딩을 시도합니다 (`https://cubism.live2d.com/sdk-web/core/06/live2dcubismcore.min.js`, 이후 기존 경로). 이 서비스의 가용성은 보장할 수 없습니다.
3. 외부 요청 없이 실행하려면 [Live2D 공식 Cubism SDK for Web](https://www.live2d.com/ko/sdk/download/web/)을 직접 다운로드하여 그 안의 `Core/live2dcubismcore.min.js`를 `public/vendor/live2dcubismcore.min.js`로 복사해 주세요. 사용과 배포는 Live2D의 해당 라이선스를 확인해야 합니다.
4. Core를 사용할 수 없거나 모델 렌더링에 실패하면 **원본과 다른 가짜 캐릭터를 표시하지 않고**, 화면에 실패 원인과 Core 설치 안내를 표시합니다. 게임 로직은 진행되더라도 실제 Live2D 모션·HitArea 판정은 동작하지 않습니다.

참고: [Live2D Core 공식 설명](https://docs.live2d.com/ko/cubism-sdk-manual/cubism-core/), [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display).

## 게임 설명

- **타이틀**: 참가 버튼 / 기록 확인.
- **2단계 연회장**: 30초 동안 진행됩니다. 음식 하나씩 클릭하는 방식이 아니라, **화면의 오른쪽을 터치/클릭하면 소매 없는 남성의 팔이 맨 아래에서 위로 올라가며 지나간 여러 줄의 음식들을 **한꺼번에** 캐릭터 쪽으로 밀어줍니다.** 음료는 +10, 간식은 -10 (최소 0), **간식 없이 음료만 3개 연속**이면 추가 +20 보너스를 얻습니다. 포도주·맥주 획득 시 술 누적에 따라 `ParamCheek +0.1`, 세 잔부터 `rmhighlight = 1`, 여섯 잔부터 `eyewhite = 1`. 10잔을 먹으면 사운드와 함께 쓰러지고 히든 단계로 이동합니다.
- **3단계 숲**: `cloth`를 0→1로 준비한 뒤 움직이는 각도 조절계에서 클릭하여 각도를 고정합니다. 그 다음 `angle`이 0→1로 올라가고 왼쪽으로 발사합니다. 연출은 **레이저 한 줄이 아니라 1초 이상 계속 발사되는 물방울 100~260개가 좌우로 퍼지면서 날아가고, 지면에 닿으면 튀는 분수형 방식**이며, 거리 실시간 표시, 멀리 날아가면 반전된 숲 배경을 이어 보여줍니다. 발사 속도는 앞 단계 점수로 결정됩니다.
- **4단계 히든**: 침대 이미지 위 Live2D 모델에서 눈을 감게 하고 HitArea를 드래그해 파라미터를 조작합니다. `HitArea2` 완료 전 `HitArea5/7` 사용은 잠깁니다. 스프링형 드래그는 놓으면 탄성으로 복귀하고, 고정형 드래그는 놓은 값이 유지됩니다. 시작/나가기 버튼이 있습니다.

### 4단계의 실제 HitArea 매핑

| HitArea | 파라미터 | 동작 |
|---|---|---|
| HitArea10 | power | 드래그 길이로 증가 |
| HitArea11 | ParamAngleX/ParamAngleY | 좌표 드래그 후 탄성 복귀 |
| HitArea12 | BX/BY | 좌표 드래그 후 탄성 복귀 |
| HitArea2 | lock2 | 위로 드래그하면 1, 놓으면 2로 보간 |
| HitArea7 | lock8 | 위아래 드래그, 놓은 값 유지 (lock2=2 필요) |
| HitArea6 | lock7 | 아래로 드래그하면 1, 놓으면 2 |
| HitArea5 | lock6 | 위아래 드래그, 놓은 값 유지 (lock2=2 필요) |
| HitArea4 | lock5 | 아래로 드래그하면 1, 놓으면 2 |
| HitArea9 | BXR/BYR | 빠르고 탄성 있게 복귀 |
| HitArea8 | BXL/BYL | 빠르고 탄성 있게 복귀 |
| HitArea1 | lock1 | 위로 드래그하면 1, 놓으면 2 |
| HitArea3 | lock4 | 위아래 드래그, 값 유지 |
| HitArea | lock3 | 위아래 드래그, 값 유지 |

**주의**: 사용자가 등록한 `HitArea` 항목은 `model3.json`에서 확인했습니다. 실제 클릭 위치가 해당 `.moc3` Drawable에 존재하는지는 Cubism Core를 이용한 현장 테스트가 추가로 필요합니다. 직접 터치 판정이 빗나가면 '부위 선택' 버튼을 사용해 해당 파라미터를 테스트할 수 있습니다.

## 이미 연결된 Firebase

사용자가 제공한 `exit-bol` 프로젝트의 웹 앱 설정값을 `.env`에 입력해 두었습니다. `.env`는 `.gitignore`에 포함되어 GitHub에 자동 업로드되지 않습니다. `firestore.rules`에는 **기존 캐릭터 통계/엔딩 통계/dualcore 랭킹을 유지한 통합 규칙**을 넣었습니다. 콘솔에는 이미 해당 규칙을 적용했다고 했으므로 **이 파일을 다시 게시할 필요는 없습니다**.

- 로컬: ZIP의 `.env` 설정이 사용됩니다. `npm run dev` 시 온라인 랭킹을 시도합니다.
- GitHub Pages: GitHub **Settings → Secrets and variables → Actions**에 동일한 `VITE_FIREBASE_*` 네 필수 값을 설정해야 합니다. 빈 값이면 로컬 랭킹으로 전환됩니다.
- Firestore 데이터베이스 존재 여부, 등록 성공 여부는 실제 온라인 연결로 테스트해야 합니다.
- 이 Firebase 웹 API 키는 공개 앱 식별자로 설계됐고 서비스 계정 인증 키가 아닙니다. Firestore 접근 제어는 규칙과 App Check를 사용하세요.

## Live2D 화면이 안 뜨는 경우

1. `npm run check:models` → `model1: ... 버전 6`과 `model2: ... 버전 6` 확인.
2. `npm run setup:core` 실행을 시도하세요. 안 된다면 [공식 SDK 다운로드 페이지](https://www.live2d.com/ko/sdk/download/web/)에서 **Cubism 5 SDK for Web R5**의 `Core/live2dcubismcore.min.js`를 직접 받아 `public/vendor/live2dcubismcore.min.js`에 넣으세요. **오래된 Core 05는 MOC3 v6에 맞지 않습니다.**
3. `npm run dev` 실행 후 Ctrl+Shift+R로 새로고침하세요.
4. 계속 실패하면 F12 → Console에서 `[쵸피] 실제 Live2D 모델 표시 실패` 메시지를 확인하세요. 이 메시지가 정확한 원인 진단에 필요합니다.
5. 구형 `node_modules`가 남았으면 Windows에서 개발 서버 종료 후 `rmdir /s /q node_modules` 및 `del package-lock.json` 실행, `npm install`로 새 의존성을 설치하세요.

**중요:** Cubism Core는 Live2D 독점 라이선스 파일이므로 ZIP에 넣어 배포하지 않습니다. Core를 직접 설치하기 전에는 게임이 원본 모델을 화면에 표시할 수 없습니다. GitHub Pages로 배포하려면 라이선스에 따라 Core 파일의 배포 권한을 확인한 후 빌드된 사이트에서도 Core를 제공해야 합니다.

## npm 취약점 경고

기존 패키지의 `inflight`, `glob` 구형 의존성은 구형 렌더러/빌드 툴 체인에서 발생할 수 있습니다. 이 버전에서 구형 PixiJS 6/`pixi-live2d-display` 패키지를 제거했지만, **npm audit 취약점이 0개인지는 여기서 검증되지 않았습니다**. 변경 후 `npm audit --omit=dev`와 `npm audit`로 실제 목록을 확인하세요. `npm audit fix --force`는 호환성을 깨뜨릴 수 있으므로 자동 실행하지 마세요.

## Firebase 온라인 랭킹 연결

현재 기본 상태는 **로컬 랭킹**입니다. 온라인 랭킹을 쓰려면 Firebase 프로젝트를 직접 연결해야 합니다.

### 1) Firebase 프로젝트 만들기
1. [Firebase 콘솔](https://console.firebase.google.com/)에 접속합니다.
2. **프로젝트 추가**를 눌러 새 프로젝트를 만듭니다.
3. 프로젝트 홈에서 **</> 웹 앱 추가**를 눌러 웹 앱을 등록합니다. 앱 이름은 예를 들어 `chopy-game`으로 해도 됩니다.
4. 등록이 끝나면 `firebaseConfig` 객체가 보입니다. 여기서 아래 값을 복사해 둡니다.
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`

### 2) Firestore 켜기
1. 왼쪽 메뉴에서 **Build → Firestore Database**로 이동합니다.
2. **데이터베이스 만들기**를 누릅니다.
3. 처음에는 테스트 모드로 시작해도 되지만, 공개 배포 전에는 규칙을 꼭 조정하세요.
4. 지역은 가까운 리전을 고릅니다.

### 3) 이 프로젝트에 `.env` 넣기
프로젝트 루트(`package.json`이 있는 폴더)에 `.env` 파일을 만듭니다. 가장 쉬운 방법은 `.env.example`을 복사하는 것입니다.

```bash
copy .env.example .env
```

그 다음 `.env` 내용을 아래처럼 채워 넣습니다.

```env
VITE_FIREBASE_API_KEY=여기에_apiKey
VITE_FIREBASE_AUTH_DOMAIN=여기에_authDomain
VITE_FIREBASE_PROJECT_ID=여기에_projectId
VITE_FIREBASE_APP_ID=여기에_appId
```

예시:

```env
VITE_FIREBASE_API_KEY=AIzaSyExample123
VITE_FIREBASE_AUTH_DOMAIN=chopy-game.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chopy-game
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

### 4) Firestore Rules 적용하기
프로젝트 안에 `firestore.rules` 파일이 들어 있습니다. Firebase CLI를 쓸 줄 안다면 그 파일을 배포하면 됩니다. CLI를 쓰지 않는다면 Firebase 콘솔의 **Firestore Database → 규칙(Rules)** 탭에 내용을 붙여 넣고 게시하세요.

### 5) 다시 실행하기
`.env`를 저장했다면 개발 서버를 껐다가 다시 켜야 합니다.

```bash
npm run dev
```

게임에서 기록을 저장하면 `chopy_scores` 컬렉션에 들어가고, 랭킹 보기에서 온라인 기록을 불러옵니다.

### 6) GitHub Pages에 올릴 때
GitHub Actions로 빌드한다면 저장소의 **Settings → Secrets and variables → Actions → Repository secrets**에 아래 이름 그대로 시크릿을 추가해야 합니다. 이번 버전의 `.github/workflows/deploy.yml`에 해당 빌드 환경변수 전달 코드가 반영돼 있습니다.
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

### 주의
- 이 방식은 브라우저에서 직접 점수를 저장하므로 **점수 위조 방지**가 완전하지 않습니다.
- 진짜 경쟁용 랭킹이면 Cloud Functions 또는 자체 서버에서 기록을 검증하는 구조가 더 안전합니다.
- **서비스 계정 비밀 키**는 절대 프론트엔드 코드나 `.env`에 넣으면 안 됩니다.

## 프로젝트 소스

- `src/main.js` 게임 상태·전환·물리·상호작용
- `src/game-logic.mjs` 점수, 음식 확률, 히든 규칙, 발사 계산 (테스트 포함)
- `src/live2d.js` 모델 표시·파라미터·HitArea 터치 판정
- `src/ranking.js` Firestore 또는 로컬 랭킹
- `src/sfx.js` Web Audio 합성 효과음 (쿠당탕 포함)
- `public/assets/` 배경·손·침대·음료/과자 20개·모델 원본 파일
- `public/vendor/` 본인이 획득한 Cubism Core용 폴더

모든 이미지와 모델은 업로드/생성된 프로젝트 파일을 사용합니다. 폰트는 웹폰트를 사용하되 실패 시 로컬 시스템 폰트로 대체됩니다.

## GitHub Pages 자동 배포

`.github/workflows/deploy.yml`도 넣었습니다. 저장소 기본 브랜치를 `main`으로 두고 GitHub **Settings → Pages → Build and deployment → Source: GitHub Actions**로 설정하면, `main` 브랜치에 푸시할 때 Node 24에서 자동으로 빌드·배포합니다. Firebase 환경변수를 사용할 경우 GitHub Actions 빌드에도 `VITE_FIREBASE_*` 환경변수/시크릿 전달 설정을 추가해야 합니다. 또한 Live2D Core는 라이선스에 따라 별도 관리해야 합니다.


## v0.1.10 — 왼쪽 손·음식 획득 수정

- 먹지 않은 음식은 모델 앞에서도 사라지지 않고 왼쪽 화면 밖까지 계속 이동합니다.
- 화면의 **어느 가로 위치든** 클릭/터치하면 손을 올릴 수 있습니다(왼쪽 5% 제한 제거).
- 왼쪽 클릭에서는 손 이미지를 수평 반전해 **팔이 화면 안쪽에 보이게** 합니다.
- 왼쪽 끝에서 일부만 보이는 음식도 해당 위치에서 손을 올려 먹일 수 있습니다.
- v0.1.9의 사용자 설정(60초, 과자 -30, 등장 확률 1/12, 모바일 가로 전용, Firebase, Live2D)을 그대로 유지했습니다.
