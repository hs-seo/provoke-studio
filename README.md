# Provoke Studio

**AI 기반 창작 글쓰기 도구** - Ulysses의 몰입감과 Scrivener의 관리 기능을 하나로

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 특징

### 🎯 몰입형 글쓰기 환경 (Ulysses 스타일)
- **미니멀한 인터페이스**: 글쓰기에만 집중할 수 있는 깔끔한 디자인
- **포커스 모드**: 방해 요소를 제거하고 순수한 글쓰기 경험
- **다크/라이트 모드**: 눈의 피로를 줄이는 테마 옵션
- **마크다운 지원**: 간편한 서식 작성
- **실시간 통계**: 단어 수, 작성 시간 추적

### 📚 창작 관리 시스템 (Scrivener 스타일)
- **캐릭터 관리**: 상세한 프로필, 성격, 배경 스토리, 관계도
- **플롯 구조**: 타임라인 기반 플롯 포인트 관리
- **장면/챕터 조직화**: 체계적인 스토리 구조 설계
- **메모 & 리서치**: 아이디어와 자료 정리

### 🤖 AI 통합 + 🔐 OAuth 인증
- **Claude & OpenAI 지원**: 양대 AI 모델 선택 가능
- **GitHub OAuth 로그인**: 안전한 인증 시스템
- **서버측 API 키 관리**: 브라우저에 민감정보 노출 없음
- **텍스트 개선**: AI가 문장을 자연스럽게 다듬어줌
- **스토리 이어쓰기**: 막힐 때 AI가 영감 제공
- **캐릭터 생성**: AI 기반 캐릭터 프로필 자동 생성
- **플롯 아이디어**: 전제를 바탕으로 플롯 제안
- **커스텀 프롬프트**: 원하는 방식으로 AI 활용

## 🚀 시작하기

### 필수 요구사항

- [Node.js](https://nodejs.org/) (v18 이상)
- [Rust](https://www.rust-lang.org/tools/install) (Tauri 빌드용)
- npm 또는 yarn

### 설치

#### 1. 프론트엔드 설치

```bash
# 프로젝트 루트에서
npm install
```

#### 2. 백엔드 서버 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
```

**`.env` 파일 편집:**

```env
PORT=3001
JWT_SECRET=랜덤한-긴-문자열-여기-입력

GITHUB_CLIENT_ID=여기에_GitHub_Client_ID_입력
GITHUB_CLIENT_SECRET=여기에_GitHub_Client_Secret_입력
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
```

**GitHub OAuth App 만들기:**

1. https://github.com/settings/developers 접속
2. "New OAuth App" 클릭
3. 설정:
   - Application name: Provoke Studio
   - Homepage URL: `http://localhost:1420`
   - Authorization callback URL: `http://localhost:3001/auth/github/callback`
4. Client ID와 Client Secret을 `.env`에 입력

#### 3. 서버 실행

**터미널 1 - 백엔드:**
```bash
cd backend
npm run dev
```

**터미널 2 - 프론트엔드:**
```bash
npm run dev
```

브라우저에서 `http://localhost:1420` 접속

### OAuth 로그인 및 AI 설정

1. **GitHub으로 로그인** - 앱 실행 시 OAuth 로그인 화면
2. **프로젝트 생성** - 프로젝트 이름과 장르 입력
3. **AI API 키 설정**:
   - Claude: [Anthropic Console](https://console.anthropic.com/)
   - OpenAI: [OpenAI Platform](https://platform.openai.com/api-keys)
4. API 키는 백엔드 서버에 안전하게 저장됨

## 🛠️ 기술 스택

### Frontend
- **React 18** + **TypeScript**: 타입 안전성과 최신 React 기능
- **Vite**: 빠른 개발 환경
- **TailwindCSS**: 유틸리티 기반 스타일링
- **Zustand**: 경량 상태 관리
- **React Icons**: 아이콘 라이브러리

### Backend
- **Express.js**: REST API 서버
- **JWT**: 사용자 인증
- **GitHub OAuth**: 로그인 시스템
- **In-memory Storage**: API 키 저장 (프로덕션에서는 DB 권장)

### Desktop
- **Tauri**: Rust 기반 데스크톱 프레임워크 (Electron보다 가볍고 빠름)

### AI Integration
- **Anthropic SDK**: Claude API 클라이언트
- **OpenAI SDK**: GPT API 클라이언트

## 📖 사용 가이드

### 프로젝트 생성
1. 앱 실행 시 프로젝트 생성 화면 표시
2. 프로젝트 이름, 설명, 장르 입력
3. "시작하기" 클릭

### 글쓰기
1. 에디터에서 자유롭게 작성
2. 텍스트 선택 후 AI 도우미 활용:
   - **개선**: 선택한 텍스트를 더 나은 문장으로
   - **이어쓰기**: AI가 자연스럽게 계속 작성
   - **커스텀 프롬프트**: 원하는 작업 지시

### 캐릭터 관리
1. 사이드바에서 "캐릭터" 탭 선택
2. "새 캐릭터" 버튼 클릭
3. 이름, 역할, 성격 등 입력
4. "AI 생성" 버튼으로 상세 프로필 자동 생성

### 플롯 구성
1. 사이드바에서 "플롯" 탭 선택
2. "새 플롯" 버튼 클릭
3. 제목과 설명 입력
4. "AI 아이디어" 버튼으로 플롯 제안 받기
5. 타임라인에 플롯 포인트 추가

## 🗺️ 로드맵

- [x] 기본 에디터 구현
- [x] AI 통합 (Claude & OpenAI)
- [x] 캐릭터 관리
- [x] 플롯 관리
- [ ] SQLite 데이터베이스 통합
- [ ] 파일 내보내기 (PDF, DOCX, Markdown)
- [ ] 버전 관리 / 히스토리
- [ ] 클라우드 동기화
- [ ] 협업 기능
- [ ] 모바일 앱 (React Native)

## 🤝 기여하기

기여를 환영합니다! 이슈를 열거나 PR을 보내주세요.

## 📝 라이선스

MIT License

---

**Made with ❤️ for writers**
