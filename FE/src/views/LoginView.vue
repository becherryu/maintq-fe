<template>
    <div class="auth-layout">
        <aside class="left-panel">
            <div class="brand">
                <div class="logo">MQ</div>
                <div>
                    <p class="brand-title">MaintQ</p>
                    <p class="brand-sub">MAINTENANCE QUALITY PLATFORM</p>
                </div>
            </div>

            <div class="headline">
                <h1>정비 품질을 지키는<br />AI 예측 정비 플랫폼</h1>
                <p>
                    MaintQ는 설비 이상을 AI로 조기 감지하고<br />
                    정비 품질을 데이터로 증명합니다.<br />
                    다운타임 없는 생산 현장을 함께 만들어 갑니다.
                </p>
            </div>

            <div class="features">
                <div class="feature-item">
                    <span class="feature-dot" />
                    <span>실시간 센서 이상 감지 · 고장 확률 예측</span>
                </div>
                <div class="feature-item">
                    <span class="feature-dot" />
                    <span>RAG 기반 AI 정비 보고서 자동 생성</span>
                </div>
                <div class="feature-item">
                    <span class="feature-dot" />
                    <span>정비 지시서 → 대응 보고서 워크플로우</span>
                </div>
                <div class="feature-item">
                    <span class="feature-dot" />
                    <span>모델 재학습 · 성능 추이 모니터링</span>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <span>CONNECTED MACHINES</span>
                    <strong>35</strong>
                    <small>Fab A · 반도체 라인</small>
                </div>
                <div class="stat-card">
                    <span>SYSTEM UPTIME</span>
                    <strong>99.94%</strong>
                    <small>Last 30 days</small>
                </div>
                <div class="stat-card">
                    <span>FAULT RECALL</span>
                    <strong>96.2%</strong>
                    <small>AI 고장 감지율</small>
                </div>
                <div class="stat-card">
                    <span>AI MODEL</span>
                    <strong>XGBoost</strong>
                    <small>MaintQ PdM Engine</small>
                </div>
            </div>
        </aside>

        <main class="right-panel">
            <div class="auth-card">
                <div class="auth-brand">
                    <span class="auth-logo">MQ</span>
                    <span class="auth-brand-name">MaintQ</span>
                </div>
                <div class="tab-row">
                    <button :class="['tab', { active: mode === 'login' }]" @click="mode = 'login'">로그인</button>
                    <button :class="['tab', { active: mode === 'signup' }]" @click="mode = 'signup'">회원가입</button>
                </div>

                <!-- 로그인 -->
                <section v-if="mode === 'login'" class="form-wrap">
                    <h2>MaintQ에 오신 것을 환영합니다</h2>
                    <p>설비 예측 정비 플랫폼에 접속하세요.</p>
                    <div class="field-group">
                        <div class="email-wrap" :class="{ 'input-error': loginErrors.email }">
                            <input
                                v-model="loginUser"
                                type="text"
                                placeholder="아이디"
                                @focus="loginErrors.email = ''"
                            />
                            <span class="email-suffix">@maintq.com</span>
                        </div>
                        <p v-if="loginErrors.email" class="error-msg">{{ loginErrors.email }}</p>
                    </div>
                    <div class="field-group">
                        <input
                            v-model="loginPassword"
                            type="password"
                            placeholder="password"
                            :class="{ 'input-error': loginErrors.password }"
                            @focus="loginErrors.password = ''"
                        />
                        <p v-if="loginErrors.password" class="error-msg">{{ loginErrors.password }}</p>
                    </div>
                    <button class="primary" @click="login">MaintQ 접속</button>
                </section>

                <!-- 회원가입 -->
                <section v-else class="form-wrap">
                    <h2>계정 등록</h2>
                    <p>MaintQ 계정을 만들고 등록을 요청하세요.</p>
                    <div class="field-group">
                        <div class="email-wrap" :class="{ 'input-error': signupErrors.email }">
                            <input
                                v-model="signupUser"
                                type="text"
                                placeholder="아이디"
                                @focus="signupErrors.email = ''"
                            />
                            <span class="email-suffix">@maintq.com</span>
                        </div>
                        <p v-if="signupErrors.email" class="error-msg">{{ signupErrors.email }}</p>
                    </div>
                    <div class="field-group">
                        <input
                            v-model="signupPassword"
                            type="password"
                            placeholder="password"
                            :class="{ 'input-error': signupErrors.password }"
                            @focus="signupErrors.password = ''"
                        />
                        <p v-if="signupErrors.password" class="error-msg">{{ signupErrors.password }}</p>
                    </div>
                    <div class="field-group">
                        <input
                            v-model="signupName"
                            placeholder="이름"
                            :class="{ 'input-error': signupErrors.name }"
                            @focus="signupErrors.name = ''"
                        />
                        <p v-if="signupErrors.name" class="error-msg">{{ signupErrors.name }}</p>
                    </div>
                    <div class="field-group">
                        <select
                            v-model="signupRole"
                            :class="{ 'input-error': signupErrors.role }"
                            @focus="signupErrors.role = ''"
                        >
                            <option value="" disabled>직책 선택</option>
                            <option value="equipment_engineer">설비 엔지니어</option>
                            <option value="maintenance_tech">정비 기술자</option>
                            <option value="process_engineer">공정 엔지니어</option>
                            <option value="production_manager">생산 관리자</option>
                        </select>
                        <p v-if="signupErrors.role" class="error-msg">{{ signupErrors.role }}</p>
                    </div>
                    <button class="primary" @click="signup">계정 등록하기</button>
                </section>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';

const emit = defineEmits(['login-success']);

const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();

const DOMAIN = '@maintq.com';

const mode = ref('login');

const loginUser = ref('');
const loginPassword = ref('');
const loginErrors = ref({ email: '', password: '' });

const signupUser = ref('');
const signupPassword = ref('');
const signupName = ref('');
const signupRole = ref('');
const signupErrors = ref({ email: '', password: '', name: '', role: '' });

function toEmail(user) {
    const trimmed = user.trim();
    return trimmed.includes('@') ? trimmed : trimmed + DOMAIN;
}

async function login() {
    loginErrors.value.email = '';
    loginErrors.value.password = '';

    if (!loginUser.value.trim()) {
        loginErrors.value.email = '아이디를 입력하세요.';
        return;
    }
    if (!loginPassword.value) {
        loginErrors.value.password = '비밀번호를 입력하세요.';
        return;
    }

    try {
        await authStore.login({ email: toEmail(loginUser.value), password: loginPassword.value });
        appStore.notifySuccess('로그인 성공', `${authStore.user?.name || loginUser.value}님 환영합니다.`);
        emit('login-success');
        router.replace('/dashboard');
    } catch (error) {
        loginErrors.value.password = error?.message || '아이디 또는 비밀번호가 올바르지 않습니다.';
    }
}

async function signup() {
    signupErrors.value = { email: '', password: '', name: '', role: '' };

    if (!signupUser.value.trim()) {
        signupErrors.value.email = '아이디를 입력하세요.';
        return;
    }
    if (!signupPassword.value) {
        signupErrors.value.password = '비밀번호를 입력하세요.';
        return;
    }
    if (!signupName.value) {
        signupErrors.value.name = '이름을 입력하세요.';
        return;
    }
    if (!signupRole.value) {
        signupErrors.value.role = '직책을 선택하세요.';
        return;
    }

    try {
        await authStore.signup({
            email: toEmail(signupUser.value),
            password: signupPassword.value,
            name: signupName.value,
            role: signupRole.value,
        });
        appStore.notifySuccess('회원가입 성공', '로그인 탭에서 로그인해 주세요.');
        mode.value = 'login';
    } catch (error) {
        signupErrors.value.email = error?.message || '회원가입 실패';
    }
}
</script>

<style scoped>
.auth-layout {
    min-height: 100vh;
    display: flex;
    background: #eef1f7;
    color: #0f172a;
    font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Segoe UI', sans-serif;
}

.left-panel {
    width: 44%;
    min-width: 360px;
    padding: 40px;
    background: linear-gradient(160deg, #0f172a 0%, #3d1a0f 62%, #e8431d 100%);
    color: #fff;
    display: flex;
    flex-direction: column;
    gap: 28px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 12px;
}

.logo {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    font-weight: 800;
    background: linear-gradient(135deg, #e8431d, #f97316);
}

.brand-title {
    font-size: 20px;
    font-weight: 800;
    margin: 0;
}

.brand-sub {
    margin: 0;
    font-size: 10px;
    letter-spacing: 0.12em;
    color: #fbd0b6;
}

.headline h1 {
    margin: 0 0 10px;
    font-size: 30px;
    line-height: 1.2;
}

.headline p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: #fde8d5;
}

.features {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.feature-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #fde8d5;
}
.feature-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fb923c;
    flex-shrink: 0;
}

.stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: auto;
}

.stat-card {
    padding: 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.stat-card span {
    font-size: 10px;
    color: #fbd0b6;
    letter-spacing: 0.06em;
    font-weight: 600;
}

.stat-card strong {
    font-size: 22px;
    line-height: 1;
}

.stat-card small {
    font-size: 10px;
    color: #f8d5ca;
}

.right-panel {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 48px;
}

.auth-card {
    width: 100%;
    max-width: 500px;
    background: #fff;
    border: 1px solid #e2e8f2;
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
}

.auth-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
}
.auth-logo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #e8431d, #f97316);
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 800;
    color: #fff;
}
.auth-brand-name {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
}

.tab-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 22px;
}

.tab {
    border: 1px solid #e2e8f2;
    background: #fff;
    border-radius: 8px;
    padding: 10px 0;
    cursor: pointer;
    font-weight: 700;
    color: #64748b;
}

.tab.active {
    color: #e8431d;
    border-color: #e8431d;
    background: #fef3ee;
}

.form-wrap {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.form-wrap h2 {
    margin: 0;
    font-size: 22px;
}

.form-wrap p {
    margin: 0;
    font-size: 12px;
    color: #64748b;
}

.field-group {
    display: grid;
    gap: 6px;
}

.error-msg {
    font-size: 11px;
    color: #dc2626;
}

/* 이메일 suffix 래퍼 */
.email-wrap {
    display: flex;
    align-items: center;
    border: 1.5px solid #d7dfed;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    transition:
        border-color 0.15s,
        box-shadow 0.15s;
}
.email-wrap:focus-within {
    border-color: #e8431d;
    box-shadow: 0 0 0 3px rgba(232, 67, 29, 0.13);
}
.email-wrap.input-error {
    border-color: #dc2626;
}
.email-wrap input {
    flex: 1;
    border: none;
    border-radius: 0;
    padding: 10px 8px 10px 12px;
    outline: none;
    box-shadow: none;
    min-width: 0;
}
.email-wrap input:focus {
    border: none;
    box-shadow: none;
}
.email-suffix {
    padding: 10px 12px 10px 4px;
    font-size: 13px;
    color: #64748b;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
}

input,
select {
    width: 100%;
    padding: 10px 12px;
    border: 1.5px solid #d7dfed;
    border-radius: 10px;
    font-size: 13px;
    outline: none;
    transition:
        border-color 0.15s,
        box-shadow 0.15s;
    background: #fff;
    color: #0f172a;
    font-family: inherit;
    box-sizing: border-box;
}

input:focus,
select:focus {
    border-color: #e8431d;
    box-shadow: 0 0 0 3px rgba(232, 67, 29, 0.13);
}

input.input-error,
select.input-error {
    border-color: #dc2626;
}

button {
    font-family: inherit;
}

.primary {
    width: 100%;
    height: 42px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #e8431d, #f97316);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
}

.primary:hover {
    opacity: 0.88;
}

@media (max-width: 980px) {
    .auth-layout {
        flex-direction: column;
    }
    .left-panel {
        width: 100%;
        min-width: 0;
    }
    .right-panel {
        padding: 20px 16px 36px;
    }
    .auth-card {
        max-width: none;
    }
}
</style>
