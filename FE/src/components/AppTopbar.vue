<template>
  <div class="topbar">
    <div class="title-area">
      <div class="page-title">{{ pageLabel }}</div>
      <div class="page-sub">Fab A · 반도체 · 설비 35대 · {{ today }}</div>
    </div>
    <div class="search-box">
      <AppIcon :d="ICONS.search" :size="14" color="#94a3b8" />
      <span class="search-placeholder">설비, 보고서 검색…</span>
    </div>
    <div class="clock">{{ time }}</div>
    <button class="icon-btn bell-btn" @click="goToReports">
      <AppIcon :d="ICONS.bell" :size="16" color="#475569" />
      <span v-if="appStore.unreadAiReportCount > 0" class="bell-badge">
        {{ appStore.unreadAiReportCount > 99 ? '99+' : appStore.unreadAiReportCount }}
      </span>
    </button>
    <div class="user-area" @click="toggleDropdown" ref="userAreaRef">
      <div class="avatar">{{ avatarInitial }}</div>
      <div>
        <div class="user-name">{{ userName }}</div>
        <div class="user-role">{{ userRole }}</div>
      </div>
      <AppIcon :d="ICONS.chevronDown" :size="13" color="#94a3b8" />
      <div v-if="dropdownOpen" class="user-dropdown">
        <div class="dropdown-info">
          <div class="dropdown-name">{{ userName }}</div>
          <div class="dropdown-email">{{ userEmail }}</div>
        </div>
        <div class="dropdown-divider" />
        <button class="dropdown-item logout-item" @click.stop="handleLogout">
          <AppIcon :d="ICONS.logout" :size="14" color="#dc2626" />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { ICONS } from '../composables/useTokens.js'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

function goToReports() { router.push('/ai-report') }

// dropdown
const dropdownOpen = ref(false)
const userAreaRef = ref(null)

function toggleDropdown() { dropdownOpen.value = !dropdownOpen.value }

function handleClickOutside(e) {
  if (userAreaRef.value && !userAreaRef.value.contains(e.target)) {
    dropdownOpen.value = false
  }
}

async function handleLogout() {
  dropdownOpen.value = false
  await authStore.logout()
  router.push('/login')
}

const PAGE_LABELS = {
  dashboard:'대시보드', 'ai-report':'AI 리포트',
  'work-orders':'정비 지시서', 'maintenance-check':'Todo',
  'response-report':'참조 보고서', 'tech-report':'대응 보고서', model:'예측 로그 + 모델 리포트', settings:'설정',
}
const pageLabel   = computed(() => PAGE_LABELS[route.meta?.id] || '대시보드')
const ROLE_LABEL = {
  admin: '공장장',
  equipment_engineer: '설비 엔지니어',
  maintenance_tech: '정비 기술자',
  process_engineer: '공정 엔지니어',
  production_manager: '생산 관리자',
  engineer: '엔지니어',
  manager: '관리자',
}
const userName    = computed(() => authStore.user?.name || 'J. Kim')
const userRole    = computed(() => ROLE_LABEL[authStore.user?.role] || authStore.user?.role || '플랜트 엔지니어')
const userEmail   = computed(() => authStore.user?.email || '')
const avatarInitial = computed(() => (authStore.user?.name || 'J').charAt(0).toUpperCase())

const today = new Date().toLocaleDateString('ko-KR', { weekday:'short', year:'numeric', month:'short', day:'numeric' })
const time  = ref(new Date().toLocaleTimeString())
let timer
onMounted(() => {
  timer = setInterval(() => { time.value = new Date().toLocaleTimeString() }, 1000)
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  clearInterval(timer)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.topbar {
  height:60px; background:#fff; border-bottom:1px solid #f1f5f9;
  display:flex; align-items:center; padding:0 24px; gap:14px;
  position:sticky; top:0; z-index:50; box-shadow:0 1px 4px rgba(0,0,0,.04);
  flex-shrink:0;
}
.title-area { flex:1; }
.page-title { font-size:17px; font-weight:800; color:#0f172a; }
.page-sub   { font-size:11px; color:#94a3b8; }
.search-box { display:flex; align-items:center; gap:8px; background:#eef1f7; border-radius:9px; padding:7px 13px; }
.search-placeholder { font-size:12px; color:#94a3b8; }
.clock { font-size:12px; color:#475569; font-variant-numeric:tabular-nums; min-width:68px; }
.icon-btn { width:38px; height:38px; border-radius:9px; background:#eef1f7; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.bell-btn { position:relative; }
.bell-badge { position:absolute; top:4px; right:4px; min-width:16px; height:16px; background:#dc2626; color:#fff; font-size:9px; font-weight:700; border-radius:99px; padding:0 4px; display:flex; align-items:center; justify-content:center; pointer-events:none; }
.user-area { display:flex; align-items:center; gap:9px; cursor:pointer; padding:6px 10px; border-radius:9px; position:relative; user-select:none; }
.user-area:hover { background:#f8fafc; }
.avatar { width:30px; height:30px; border-radius:8px; background:linear-gradient(135deg,#e8431d,#f97316); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; }
.user-name { font-size:12px; font-weight:700; color:#0f172a; }
.user-role { font-size:10px; color:#94a3b8; }

/* dropdown */
.user-dropdown {
  position:absolute; top:calc(100% + 6px); right:0;
  background:#fff; border:1px solid #e2e8f0; border-radius:10px;
  box-shadow:0 8px 24px rgba(0,0,0,.10); min-width:200px; z-index:200;
  overflow:hidden;
}
.dropdown-info { padding:12px 14px; }
.dropdown-name  { font-size:13px; font-weight:700; color:#0f172a; }
.dropdown-email { font-size:11px; color:#94a3b8; margin-top:2px; }
.dropdown-divider { height:1px; background:#f1f5f9; }
.dropdown-item {
  display:flex; align-items:center; gap:8px;
  width:100%; padding:10px 14px; background:none; border:none;
  cursor:pointer; font-size:13px; color:#334155; text-align:left;
}
.dropdown-item:hover { background:#f8fafc; }
.logout-item { color:#dc2626; }
.logout-item:hover { background:#fef2f2; }
</style>
