<template>
    <div class="sidebar">
        <!-- Logo -->
        <div class="logo-area">
            <div class="logo-icon">
                <AppIcon :d="ICONS.cpu2" :size="18" color="#fff" />
            </div>
            <div>
                <div class="logo-title">MaintQ</div>
                <div class="logo-sub">SEMI MAINT AI</div>
            </div>
        </div>

        <!-- Nav -->
        <nav class="nav">
            <div v-for="group in visibleNavGroups" :key="group.label" class="nav-group">
                <div class="group-label">{{ group.label }}</div>
                <router-link
                    v-for="item in group.items"
                    :key="item.id"
                    :to="item.path"
                    class="nav-item"
                    :class="{ active: currentId === item.id }"
                >
                    <AppIcon :d="item.icon" :size="15" :color="currentId === item.id ? '#e8431d' : '#64748b'" />
                    <span class="nav-label">{{ item.label }}</span>
                    <span v-if="item.id === 'ai-report' && store.unreadAiReportCount > 0" class="nav-badge">{{
                        store.unreadAiReportCount > 99 ? '99+' : store.unreadAiReportCount
                    }}</span>
                </router-link>
            </div>
        </nav>

        <!-- System Status -->
        <div class="status-panel">
            <div class="status-box">
                <div class="status-header">
                    <span class="pulse-dot" />
                    <span class="status-title">시스템 상태</span>
                </div>
                <div v-for="item in STATUS_ITEMS" :key="item.label" class="status-row">
                    <div class="status-icon-wrap">
                        <AppIcon :d="item.icon" :size="13" color="#e8431d" />
                    </div>
                    <div class="status-text">
                        <div class="status-name">{{ item.label }}</div>
                        <div class="status-detail">{{ item.detail }}</div>
                    </div>
                    <span class="online-dot" />
                </div>
                <div class="status-time">
                    <AppIcon :d="ICONS.clock" :size="11" color="#94a3b8" />
                    <span
                        >마지막 업데이트: <b>{{ time }}</b></span
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from './AppIcon.vue';
import { ICONS } from '../composables/useTokens.js';
import { useAppStore } from '../stores/appStore.js';
import { useAuthStore } from '../stores/authStore';

const store = useAppStore();
const authStore = useAuthStore();
const route = useRoute();
const currentId = computed(() => route.meta?.id || 'dashboard');

const NAV_GROUPS = [
    {
        label: '예방 관리',
        items: [
            { id: 'dashboard', path: '/dashboard', label: '대시보드', icon: ICONS.dashboard },
            { id: 'ai-report', path: '/ai-report', label: 'AI 리포트', icon: ICONS.brain },
            { id: 'work-orders', path: '/work-orders', label: '정비 지시서', icon: ICONS.wrench },
            { id: 'response-report', path: '/response-report', label: '참조 보고서', icon: ICONS.report },
        ],
    },
    {
        label: '기술자',
        items: [
            { id: 'maintenance-check', path: '/maintenance-check', label: 'Todo', icon: ICONS.clipboard },
            { id: 'tech-report', path: '/tech-report', label: '대응 보고서', icon: ICONS.fileText },
        ],
    },
    { label: '모델', items: [{ id: 'model', path: '/model', label: '예측 로그 + 모델 리포트', icon: ICONS.bar2 }] },
    { label: '시스템', items: [{ id: 'settings', path: '/settings', label: '설정', icon: ICONS.settings }] },
];

const TECH_ALLOWED_IDS = new Set(['dashboard', 'maintenance-check', 'tech-report']);
const isAdmin = computed(() => (authStore.user?.role || '').toLowerCase() === 'admin');
const visibleNavGroups = computed(() => {
    if (isAdmin.value) {
        return NAV_GROUPS.filter((group) => group.label !== '기술자');
    }

    return NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => TECH_ALLOWED_IDS.has(item.id)),
    })).filter((group) => group.items.length > 0);
});

const STATUS_ITEMS = [
    { label: '엣지 게이트웨이', icon: ICONS.wifi, detail: '192.168.1.10 · 활성' },
    { label: '데이터 파이프라인', icon: ICONS.database, detail: '지연: 42 ms' },
    { label: 'AI 추론', icon: ICONS.brain, detail: 'Model v3.4 · GPU 활성' },
];

const time = ref(new Date().toLocaleTimeString());
let timer;
onMounted(() => {
    timer = setInterval(() => {
        time.value = new Date().toLocaleTimeString();
    }, 1000);
});
onUnmounted(() => clearInterval(timer));
</script>

<style scoped>
.sidebar {
    width: 236px;
    min-width: 236px;
    background: #fff;
    border-right: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: sticky;
    top: 0;
}
.logo-area {
    padding: 20px 16px 16px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 10px;
}
.logo-icon {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: linear-gradient(135deg, #e8431d, #f97316);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.logo-title {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
}
.logo-sub {
    font-size: 9px;
    color: #94a3b8;
    letter-spacing: 0.1em;
}

.nav {
    flex: 1;
    padding: 12px 8px;
    overflow-y: auto;
}
.nav-group {
    margin-bottom: 6px;
}
.group-label {
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 8px 10px 5px;
}
.nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 10px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    background: transparent;
    color: #64748b;
    font-size: 12.5px;
    font-weight: 400;
    margin-bottom: 1px;
    transition: all 0.13s;
    border-left: 3px solid transparent;
}
.nav-item:hover {
    background: #f8fafc;
}
.nav-item.active {
    background: #fef3ee;
    color: #e8431d;
    font-weight: 700;
}
.nav-label {
    flex: 1;
}
.nav-badge {
    background: #dc2626;
    color: #fff;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 700;
    padding: 1px 6px;
}

.status-panel {
    padding: 0 12px 20px;
}
.status-box {
    background: #f1f5f9;
    border-radius: 12px;
    padding: 16px;
}
.status-header {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 12px;
}
.pulse-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #0e9e6e;
    box-shadow: 0 0 6px #0e9e6e;
    display: block;
}
.status-title {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
}
.status-row {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 9px;
}
.status-icon-wrap {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.status-text {
    flex: 1;
    min-width: 0;
}
.status-name {
    font-size: 11px;
    font-weight: 600;
    color: #0f172a;
}
.status-detail {
    font-size: 9px;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.online-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #0e9e6e;
    display: block;
    flex-shrink: 0;
}
.status-time {
    padding-top: 8px;
    margin-top: 4px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    color: #94a3b8;
}
.status-time b {
    color: #475569;
}
</style>
