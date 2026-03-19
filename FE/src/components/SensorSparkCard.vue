<template>
  <div class="spark-card" :style="{ border: isWarn ? `1px solid ${color}` : '1px solid transparent' }">
    <div class="spark-top">
      <span class="spark-label">{{ label }}</span>
      <span class="spark-val" :style="{ color: isWarn ? color : '#0f172a' }">
        {{ lastVal.toFixed(1) }} <span class="spark-unit">{{ unit }}</span>
      </span>
    </div>
    <!-- SVG Sparkline -->
    <svg :width="W" :height="H" style="display:block">
      <defs>
        <linearGradient :id="`grad-${uid}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   :stop-color="color" stop-opacity="0.18" />
          <stop offset="100%" :stop-color="color" stop-opacity="0.01" />
        </linearGradient>
      </defs>
      <path :d="areaD" :fill="`url(#grad-${uid})`" />
      <path :d="lineD" fill="none" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle v-if="isWarn" :cx="lastX.toFixed(1)" :cy="lastY.toFixed(1)" r="3.5" :fill="color" />
    </svg>
    <div class="spark-range">
      <span class="spark-range-text">정상 범위: {{ warnMin }}–{{ warnMax }} {{ unit }}</span>
      <span v-if="isWarn" class="spark-warn-badge" :style="{ color, background: color + '18' }">⚠ 임계 초과</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data:    { type: Array, required: true },
  label:   String,
  unit:    String,
  color:   String,
  warnMin: Number,
  warnMax: Number,
})

const uid = Math.random().toString(36).slice(2, 8)
const W = 260, H = 56, pad = 4

const pts    = computed(() => props.data.slice(-20))
const vals   = computed(() => pts.value.map(p => p.v))
const minV   = computed(() => Math.min(...vals.value))
const maxV   = computed(() => Math.max(...vals.value))
const lastVal= computed(() => vals.value[vals.value.length - 1] ?? 0)
const isWarn = computed(() => lastVal.value < props.warnMin || lastVal.value > props.warnMax)

const sx = i => pad + (i / (pts.value.length - 1)) * (W - pad * 2)
const sy = v => H - pad - ((v - minV.value) / ((maxV.value - minV.value) || 1)) * (H - pad * 2)

const lineD = computed(() => pts.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(p.v).toFixed(1)}`).join(' '))
const areaD = computed(() => {
  const n = pts.value.length - 1
  return lineD.value + ` L${sx(n).toFixed(1)},${H} L${sx(0).toFixed(1)},${H} Z`
})
const lastX = computed(() => sx(pts.value.length - 1))
const lastY = computed(() => sy(lastVal.value))
</script>

<style scoped>
.spark-card   { background:#eef1f7; border-radius:8px; padding:10px 12px; }
.spark-top    { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
.spark-label  { font-size:11px; font-weight:700; color:#475569; }
.spark-val    { font-size:14px; font-weight:800; }
.spark-unit   { font-size:10px; font-weight:400; color:#94a3b8; }
.spark-range  { display:flex; gap:8px; margin-top:4px; }
.spark-range-text { font-size:9px; color:#94a3b8; }
.spark-warn-badge { font-size:9px; font-weight:700; padding:1px 6px; border-radius:4px; }
</style>
