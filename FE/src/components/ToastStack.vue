<template>
  <div class="toast-stack">
    <transition-group name="toast">
      <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.type">
        <div class="toast-title">{{ t.title }}</div>
        <div class="toast-sub">{{ t.sub }}</div>
      </div>
    </transition-group>
  </div>
</template>
<script setup>
import { useAppStore } from '../stores/appStore.js'
const store = useAppStore()
</script>
<style scoped>
.toast-stack { position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:8px; }
.toast { background:#0f172a; color:#fff; border-radius:10px; padding:12px 16px; min-width:240px; box-shadow:0 8px 24px rgba(0,0,0,.2); }
.toast.success { border-left:3px solid #0e9e6e; }
.toast.error { border-left:3px solid #dc2626; }
.toast-title { font-size:13px; font-weight:700; margin-bottom:2px; }
.toast-sub   { font-size:11px; color:rgba(255,255,255,.55); }
.toast-enter-active, .toast-leave-active { transition: all .3s; }
.toast-enter-from { opacity:0; transform:translateY(12px); }
.toast-leave-to   { opacity:0; transform:translateX(20px); }
</style>
