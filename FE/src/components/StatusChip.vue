<template>
  <span class="chip" :style="{ background: cfg.bg, color: cfg.color }">
    <span class="dot" :style="{ background: cfg.color }" />
    {{ cfg.label }}
  </span>
</template>
<script setup>
import { computed } from 'vue'

const props = defineProps({ status: String })
const MAP = {
  healthy:      { bg:'#d0f5e8', color:'#0e9e6e', label:'정상'     },
  warning:      { bg:'#fef3c7', color:'#d97706', label:'경고'     },
  maintenance:  { bg:'#ebf1fd', color:'#1d62e8', label:'정비중'   },
  fault:        { bg:'#fee2e2', color:'#dc2626', label:'고장 예측' },
  offline:      { bg:'#f1f5f9', color:'#64748b', label:'오프라인' },
  required:     { bg:'#fee2e2', color:'#dc2626', label:'필요'     },
  'in-progress':{ bg:'#ebf1fd', color:'#1d62e8', label:'진행중'   },
  completed:    { bg:'#d0f5e8', color:'#0e9e6e', label:'완료'     },
}
const cfg = computed(() => MAP[props.status] || { bg:'#f1f5f9', color:'#64748b', label: props.status })
</script>
<style scoped>
.chip { display:inline-flex; align-items:center; gap:5px; border-radius:20px; padding:3px 10px; font-size:11px; font-weight:600; }
.dot  { width:5px; height:5px; border-radius:50%; display:block; }
</style>
