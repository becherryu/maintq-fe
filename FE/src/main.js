import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import { useAuthStore } from './stores/authStore';

import DashboardView from './views/DashboardView.vue';
import AiReportView from './views/AiReportView.vue';
import WorkOrdersView from './views/WorkOrdersView.vue';
import MaintenanceView from './views/MaintenanceView.vue';
import ResponseReportView from './views/ResponseReportView.vue';
import TechReportView from './views/TechReportView.vue';
import ModelView from './views/ModelView.vue';
import SettingsView from './views/SettingsView.vue';
import LoginView from './views/LoginView.vue';

import './assets/global.css';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', redirect: '/dashboard' },
        { path: '/login', component: LoginView, meta: { id: 'login', public: true, hideShell: true } },
        { path: '/dashboard', component: DashboardView, meta: { id: 'dashboard' } },
        { path: '/ai-report', component: AiReportView, meta: { id: 'ai-report' } },
        { path: '/work-orders', component: WorkOrdersView, meta: { id: 'work-orders' } },
        { path: '/maintenance-check', component: MaintenanceView, meta: { id: 'maintenance-check' } },
        { path: '/response-report', component: ResponseReportView, meta: { id: 'response-report' } },
        { path: '/tech-report', component: TechReportView, meta: { id: 'tech-report' } },
        { path: '/model', component: ModelView, meta: { id: 'model' } },
        { path: '/settings', component: SettingsView, meta: { id: 'settings' } },
    ],
});

const pinia = createPinia();

router.beforeEach(async (to) => {
    const authStore = useAuthStore(pinia);

    if (!authStore.checked) {
        try {
            await authStore.checkAuth();
        } catch {
            authStore.checked = true;
        }
    }

    if (to.meta.public) {
        if (authStore.isAuthenticated && to.path === '/login') {
            return '/dashboard';
        }
        return true;
    }

    if (!authStore.isAuthenticated) {
        return '/login';
    }

    const role = (authStore.user?.role || '').toLowerCase();
    const adminHiddenIds = new Set(['maintenance-check', 'tech-report']);
    const techAllowedIds = new Set(['dashboard', 'maintenance-check', 'tech-report']);
    const routeId = to.meta?.id;

    if (role === 'admin' && adminHiddenIds.has(routeId)) {
        return '/dashboard';
    }

    if (role !== 'admin' && !to.meta?.public && routeId && !techAllowedIds.has(routeId)) {
        return '/dashboard';
    }

    return true;
});

const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount('#app');
