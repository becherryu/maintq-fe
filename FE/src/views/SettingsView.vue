<template>
  <div class="page">
    <PanelCard :hover="false">
      <CardHeader title="설정" sub="시스템 구성" accent-color="#64748b" />
      <div class="settings-grid">
        <div v-for="[l, v] in SETTINGS" :key="l" class="setting-card">
          <div class="setting-lbl">{{ l }}</div>
          <div class="setting-val">{{ v }}</div>
        </div>
      </div>
    </PanelCard>
  </div>
</template>
<script setup>
import PanelCard  from '../components/PanelCard.vue'
import CardHeader from '../components/CardHeader.vue'

const SETTINGS = [
  ['알림 임계값','경고 확률 55% 초과 시'],
  ['지시서 자동 생성','비활성화'],
  ['모델 갱신 주기','24시간마다'],
  ['대시보드 갱신','2초마다'],
]
</script>
<style scoped>
.page { padding:22px; }
.settings-grid { padding:20px; display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
.setting-card  { background:#eef1f7; border-radius:10px; padding:14px; }
.setting-lbl   { font-size:10px; color:#94a3b8; margin-bottom:4px; }
.setting-val   { font-size:13px; font-weight:700; color:#0f172a; }
</style>
