# MaintQ FE

Vue 3 기반 Maintq 반도체 예지보전 프론트엔드 서비스입니다.

---

## 기술 스택

| 기술       | 버전 |
| ---------- | ---- |
| Vue 3      | 3.5  |
| Vite       | 6.2  |
| Pinia      | 3.0  |
| Vue Router | 4.5  |

---

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:8001` 접속하기

---

## Docker 실행

```bash
docker build -t maintq-fe:latest .
docker run -d --name maintq_fe -p 8001:8001 maintq-fe:latest
```

---

## CI/CD 파이프라인

GitHub Actions를 통해 `main` 브랜치 push 시 자동으로 빌드 → Harbor push → Kubernetes 배포까지 수행합니다.

### 흐름

```
main 브랜치 push
  │
  ▼
[CI] .github/workflows/ci.yml
  1. Node.js 의존성 설치 및 빌드 (npm ci && npm run build)
  2. Docker 이미지 빌드
  3. Harbor 레지스트리에 push
     - 태그: {branch}, {short-sha}, latest(main 한정)
  │
  ▼  (CI 성공 시 자동 트리거)
[CD] .github/workflows/cd.yml
  4. kubectl로 Kubernetes Deployment 이미지 업데이트
     - Deployment: sk3024-maintq-fe
     - Namespace: skala3-ai1
  5. rollout 완료 대기 (최대 120초)
```

### 워크플로우 파일

| 파일 | 역할 | 트리거 |
|---|---|---|
| `.github/workflows/ci.yml` | 빌드 + Harbor push | `main`, `dev` push / PR |
| `.github/workflows/cd.yml` | Kubernetes 배포 | CI 성공 후 자동 (`main` 한정) |

### 필요한 GitHub Secrets

| Secret | 설명 |
|---|---|
| `HARBOR_REGISTRY` | Harbor 레지스트리 주소 |
| `HARBOR_PROJECT` | Harbor 프로젝트명 |
| `HARBOR_USERNAME` | Harbor 로그인 계정 |
| `HARBOR_PASSWORD` | Harbor 로그인 비밀번호 |
| `KUBE_CONFIG` | `~/.kube/config` base64 인코딩 값 |

---

## 주요 화면

| 경로                 | 설명                |
| -------------------- | ------------------- |
| `/dashboard`         | 설비 현황 대시보드  |
| `/ai-report`         | AI 고장 예측 보고서 |
| `/work-orders`       | 작업 지시서         |
| `/maintenance-check` | 정비 점검           |
| `/tech-report`       | 기술 보고서         |
| `/model`             | ML 모델 모니터링    |
| `/settings`          | 설정                |
