<template>
  <div v-if="!hideShell" class="shell">
    <AppSidebar />
    <div class="main">
      <AppTopbar />
      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
  <router-view v-else />
  <ToastStack />
</template>
<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/authStore'
import { useAppStore } from './stores/appStore'
import AppSidebar from './components/AppSidebar.vue'
import AppTopbar  from './components/AppTopbar.vue'
import ToastStack from './components/ToastStack.vue'

const route     = useRoute()
const authStore = useAuthStore()
const appStore  = useAppStore()

const hideShell = computed(() => route.meta?.hideShell === true)

// 인증 완료 시 AI 서버 데이터 로드
watch(() => authStore.isAuthenticated, (val) => {
  if (val) appStore.init()
}, { immediate: true })

// 30초마다 알람 로그 갱신
let pollTimer = null
watch(() => authStore.isAuthenticated, (val) => {
  if (val) {
    pollTimer = setInterval(() => appStore.refresh(), 30000)
  } else {
    clearInterval(pollTimer)
  }
}, { immediate: true })
onUnmounted(() => clearInterval(pollTimer))
</script>
<style scoped>
.shell   { display:flex; height:100vh; overflow:hidden; }
.main    { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.content { flex:1; overflow-y:auto; }
</style>
