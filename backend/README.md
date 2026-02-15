# Provoke Studio Backend

OAuth 인증 및 AI API 프록시 서버

## 설정

### 1. GitHub OAuth App 생성

1. https://github.com/settings/developers 접속
2. "New OAuth App" 클릭
3. 설정:
   - **Application name**: Provoke Studio
   - **Homepage URL**: `http://localhost:1420`
   - **Authorization callback URL**: `http://localhost:3001/auth/github/callback`
4. "Register application" 클릭
5. **Client ID**와 **Client Secret** 복사

### 2. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 값을 입력:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
PORT=3001
JWT_SECRET=랜덤한-긴-문자열-여기-입력

GITHUB_CLIENT_ID=여기에_GitHub_Client_ID_입력
GITHUB_CLIENT_SECRET=여기에_GitHub_Client_Secret_입력
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
```

### 3. 서버 실행

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

서버가 `http://localhost:3001`에서 실행됩니다.

## API 엔드포인트

### 인증

- `GET /auth/github/url` - GitHub OAuth URL 생성
- `GET /auth/github/callback` - GitHub OAuth 콜백
- `POST /auth/exchange` - 코드를 JWT로 교환

### 사용자

- `GET /api/user` - 사용자 프로필 조회 (JWT 필요)
- `POST /api/keys` - API 키 저장 (JWT 필요)

### AI

- `POST /api/ai/request` - AI 요청 (JWT 필요)

## 보안

- API 키는 서버 메모리에 저장 (프로덕션에서는 DB 사용 권장)
- JWT를 통한 사용자 인증
- CORS 설정으로 허가된 origin만 접근 가능
- API 키는 클라이언트로 전송되지 않음

## 프로덕션 배포

프로덕션 환경에서는:

1. **데이터베이스 사용**: Supabase, PostgreSQL 등
2. **JWT_SECRET 변경**: 안전한 랜덤 문자열
3. **HTTPS 사용**: Let's Encrypt 등
4. **환경 변수 보안**: AWS Secrets Manager, Vault 등
