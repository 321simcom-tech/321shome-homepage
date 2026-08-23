# 삼이일심 홈페이지

## 폴더 구성

```
index.html        실제 홈페이지 (레이아웃/구조)
styles.css         디자인(색상, 여백, 폰트 등)
script.js          content.json을 읽어와 화면에 채워 넣는 코드
content.json        페이지에 들어가는 모든 텍스트·이미지 경로 (여기만 바꾸면 화면이 바뀜)
images/            사진 파일들 (지금은 자리표시용 이미지가 들어있음)
admin/             관리자 화면(Decap CMS) 설정
  index.html
  config.yml       관리자 화면에 어떤 입력창을 보여줄지 정의
netlify.toml        배포 설정
```

기존에 있던 `삼이일심 홈페이지.dc.html`, `삼이일심 홈페이지 - 페이퍼톤.dc.html`, `삼이일심 스타일 탐색.dc.html`, `support.js`는 디자인 초안(작업용) 파일이라 실제 배포되는 사이트에는 사용되지 않습니다. 삭제하지 않아도 사이트 동작에는 영향이 없습니다.

---

## 1. 무료 배포 방법 (Netlify + GitHub)

**필요한 것**: GitHub 계정, Netlify 계정 (둘 다 무료로 가입 가능)

### 1) GitHub에 코드 올리기
1. https://github.com 에서 새 저장소(Repository)를 만듭니다. (예: `321shome-homepage`, Private/Public 무관)
2. 이 폴더(`321homepage`)를 그 저장소에 업로드합니다.
   - GitHub Desktop을 쓰면 폴더를 그대로 드래그해서 올릴 수 있어 가장 쉽습니다.
   - 또는 터미널에서:
     ```bash
     cd "321homepage 폴더 경로"
     git init
     git add .
     git commit -m "홈페이지 초기 배포"
     git branch -M main
     git remote add origin https://github.com/내계정/저장소이름.git
     git push -u origin main
     ```

### 2) Netlify에 연결
1. https://app.netlify.com 가입/로그인 (GitHub 계정으로 바로 가입 가능)
2. "Add new site" → "Import an existing project" → GitHub 선택 → 방금 만든 저장소 선택
3. Build command는 비워두고, Publish directory는 `.` (루트) 로 설정 (`netlify.toml`에 이미 지정되어 있어 자동 인식됨)
4. "Deploy site" 클릭 → 1분 내로 `https://아무이름-1234.netlify.app` 같은 무료 주소가 발급됩니다.

이후로는 **GitHub에 새로 올릴 때마다(또는 관리자 화면에서 저장할 때마다) Netlify가 자동으로 사이트를 다시 배포**합니다.

### 3) (선택) 내 도메인 연결
가지고 있는 도메인(예: samiilsim.kr)이 있다면 Netlify의 "Domain settings"에서 무료로 연결할 수 있습니다. (도메인 자체 구매 비용은 별도)

---

## 2. 관리자 화면(비개발자용 편집 화면) 설정

이 사이트는 **Decap CMS**라는 무료 오픈소스 CMS가 `/admin` 경로에 이미 붙어 있습니다. 코드를 몰라도 로그인 후 화면에서 텍스트를 고치고 사진을 올리면, 자동으로 GitHub에 저장되고 Netlify가 사이트를 다시 배포합니다.

로그인은 **GitHub 계정으로 직접 로그인하는 방식**입니다 (Netlify Identity/Git Gateway는 Netlify가 단종시켜서 사용하지 않음). `netlify/functions/auth.js`, `netlify/functions/callback.js`가 로그인 중계 역할을 하는 Netlify Function입니다.

### 활성화 방법 (최초 1회만)

**1) GitHub에 OAuth App 만들기**
1. https://github.com/settings/developers 접속 → **"OAuth Apps"** 탭 → **"New OAuth App"**
2. 입력값:
   - Application name: `삼이일심 관리자` (아무 이름)
   - Homepage URL: `https://내사이트주소.netlify.app`
   - Authorization callback URL: `https://내사이트주소.netlify.app/api/callback`
3. "Register application" 클릭 → **Client ID**가 발급됨
4. "Generate a new client secret" 클릭 → **Client Secret** 발급 (이 값은 이후 딱 한 번만 보이니 안전한 곳에 잠시 복사해두기)

**2) Netlify에 환경변수로 등록**
1. Netlify 대시보드 → 사이트 선택 → **Project configuration → Environment variables**
2. "Add a variable" → 아래 두 개를 각각 추가
   - `GITHUB_OAUTH_CLIENT_ID` = 위에서 발급받은 Client ID
   - `GITHUB_OAUTH_CLIENT_SECRET` = 위에서 발급받은 Client Secret
3. 저장 후, **Deploys → Trigger deploy → Deploy site**로 한 번 재배포 (환경변수를 인식시키기 위함)

> Client Secret은 절대 `content.json`이나 코드 파일, 채팅, 메모 등에 남기지 마세요. Netlify 환경변수에만 저장합니다.

**3) `admin/config.yml`의 저장소 정보 확인**
`repo:`와 `base_url:` 값이 실제 GitHub 저장소, 실제 Netlify 사이트 주소와 일치하는지 확인합니다. (이미 맞게 설정되어 있다면 그대로 두면 됨)

### 이후 사용법
- `내사이트주소.netlify.app/admin` 접속 → **"Login with GitHub"** 클릭 → GitHub 로그인/승인
- "홈페이지 콘텐츠" → "전체 페이지 콘텐츠" 클릭
- 섹션별(히어로, 일정, 후기, 회사 소개 등)로 텍스트를 수정하거나, 이미지 항목에서 새 사진을 업로드해 교체
- 우측 상단 "Publish"(게시) 클릭 → 몇 초~1분 뒤 실제 사이트에 반영됨

이 저장소에 **Write 권한이 있는 GitHub 계정**만 로그인/편집할 수 있습니다. 편집 담당자를 늘리려면 GitHub 저장소 Settings → Collaborators에서 초대하면 됩니다.

### ⚠️ FAQ 답변은 초안입니다
회의 브리프에는 FAQ **질문만** 있고 답변은 없어서, 기존 사이트 정보를 근거로 임시 답변을 작성해뒀습니다(참가비 등 실제 정보가 없는 항목은 "상담을 통해 안내" 식으로 안전하게 처리). 관리자 화면 → "FAQ" 섹션에서 실제 내용에 맞게 검수·수정해 주세요.

---

## 3. 관리자 화면 없이 직접 파일을 고치는 방법

개발자이거나 코드를 조금 다룰 수 있다면 관리자 화면 없이도 바로 수정할 수 있습니다.

- **텍스트 수정**: `content.json` 파일을 열어 원하는 값을 바꾸고 저장 → GitHub에 push 하면 자동 반영
- **사진 교체**: `images/` 폴더에 새 사진을 넣고, `content.json`에서 해당 항목의 파일 경로(`images/파일명.jpg`)를 새 파일명으로 바꿔주면 됩니다
- 레이아웃/디자인 자체를 바꾸려면 `index.html`(구조), `styles.css`(디자인)를 수정

---

## 4. 지금 채워야 할 자리표시(placeholder) 항목

아직 실제 자료가 없어 임시로 넣어둔 부분들입니다. 관리자 화면 또는 `content.json`에서 실제 값으로 교체해 주세요.

- 모든 사진 (현재는 "[사진 준비 중]" 패턴 이미지로 대체되어 있음)
- 대표자명, 사업자등록번호, 전화번호, 실제 도메인 이메일 주소 (현재 `hello@samiilsim.kr`, `000-0000-0000` 등은 예시)

---

## 5. 향후 고도화 아이디어 (참고용, 지금 당장 필요한 것은 아님)

- 방문자가 많아지고 검색엔진(SEO) 노출이 중요해지면, 지금의 "JS가 콘텐츠를 채워 넣는 방식" 대신 Eleventy/Astro 같은 정적 사이트 생성기로 전환해 완성된 HTML을 미리 만들어두는 방식을 검토할 수 있습니다.
- 문의 폼이 필요해지면 Netlify Forms(무료 티어 제공)를 붙이면 별도 서버 없이 이메일로 문의를 받을 수 있습니다.
