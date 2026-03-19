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

## Jenkins 파이프라인

`WEB_part/Jenkinsfile` 을 통해 CI/CD 연결

**흐름:** GitHub(`dev` 브랜치) → Docker 이미지 빌드 → 컨테이너 실행

**파이프라인 단계:**

1. `Docker Build` — `FE/Dockerfile` 기반 이미지 빌드
2. `Container Up` — 기존 컨테이너 제거 후 재실행

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
