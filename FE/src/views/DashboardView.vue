<template>
  <div class="page">
    <!-- KPI Row: 순차 페이드인 + count-up 애니메이션 -->
    <div class="kpi-grid">
      <PanelCard
        v-for="(k, i) in kpiCards"
        :key="k.label"
        class="kpi-card"
        :class="{ 'kpi-visible': kpiVisible[i] }"
        :hover="true"
        :style="{ transitionDelay: i * 60 + 'ms' }"
      >
        <div class="kpi-inner">
          <div class="kpi-top">
            <div class="kpi-icon-wrap" :style="{ background: k.bg }">
              <AppIcon :d="k.icon" :size="18" :color="k.color" />
            </div>
            <!-- [동적] warning/fault/지시서는 pulse halo -->
            <div class="delta-wrap">
              <DeltaBadge :value="k.value" :positive="k.color !== '#dc2626'" />
            </div>
          </div>
          <div class="kpi-label">{{ k.label }}</div>
          <!-- [동적] count-up 숫자 -->
          <div class="kpi-value" :style="{ color: k.color }">{{ displayedKpi[i] }}</div>
          <div class="kpi-sub">{{ k.sub }}</div>
        </div>
      </PanelCard>
    </div>

    <!-- Health + Heatmap -->
    <div class="mid-grid">
      <!-- Health Distribution -->
      <PanelCard :hover="false">
        <CardHeader title="설비 상태 분포" sub="예측·정비·고장 예측·정상·오프라인" accent-color="#0e9e6e">
          <template #right>
            <!-- [동적] 실시간 pulse dot -->
            <span class="live-badge"><span class="live-dot" />실시간</span>
          </template>
        </CardHeader>
        <div class="health-body">
          <!-- [동적] 멀티 링 캔버스 차트: 상태별 독립 원호 -->
          <div class="ring-wrap">
            <canvas ref="ringCanvas" width="200" height="200" />
            <div class="donut-center">
              <div class="donut-total">{{ displayedTotal }}</div>
              <div class="donut-label">TOTAL</div>
            </div>
          </div>
          <div class="health-rows">
            <div v-for="r in healthRows" :key="r.key" class="health-row">
              <span class="health-dot" :style="{ background: r.color }" />
              <span class="health-name">{{ r.label }}</span>
              <span class="health-count" :style="{ color: r.color }">{{ displayedCounts[r.key] }}</span>
              <span class="health-pct" :style="{ color: r.color }">
                {{ Math.round((counts[r.key] / store.machines.length) * 100) }}%
              </span>
            </div>
          </div>
        </div>
      </PanelCard>

      <!-- Factory Heatmap -->
      <PanelCard :hover="false">
        <CardHeader title="공장 설비 상태 맵" sub="경고·정비·고장 예측·정상·오프라인" accent-color="#e8431d">
          <template #right>
            <div class="legend">
              <span v-for="[l,c] in LEGEND" :key="l" class="legend-item">
                <span class="legend-dot" :style="{ background: c }" />{{ l }}
              </span>
            </div>
          </template>
        </CardHeader>
        <div class="heatmap-body">
          <div class="heatmap-grid" :style="{ gridTemplateColumns: '68px repeat(7,1fr)' }">
            <div />
            <div v-for="c in 7" :key="c" class="col-label">R{{ String(c).padStart(2,'0') }}</div>
          </div>
          <div v-for="(_, r) in Array(5)" :key="r" class="heatmap-row" :style="{ gridTemplateColumns: '68px repeat(7,1fr)' }">
            <div class="row-label">{{ ZONES[r] }}</div>
            <template v-for="(_, c) in Array(7)" :key="c">
              <div
                v-if="store.machines[r * 7 + c]"
                class="heatmap-cell"
                :class="[
                  'status-' + store.machines[r * 7 + c].status,
                  { 'cell-flash': flashedCells.has(store.machines[r * 7 + c]?.id) }
                ]"
                :style="getCellStyle(store.machines[r * 7 + c])"
                @mouseenter="showTooltip($event, store.machines[r * 7 + c])"
                @mouseleave="hideTooltip"
              >
                <!-- [동적] 좌측 상단 상태 점: warning/fault만 점멸, 나머지는 정적 -->
                <span
                  class="cell-status-dot"
                  :class="getCellDotClass(store.machines[r * 7 + c].status)"
                  :style="{ background: getStatusColor(store.machines[r * 7 + c].status) }"
                />
                <div class="cell-id">{{ store.machines[r * 7 + c].id.replace('EQ-', '') }}</div>
                <div class="cell-fp">{{ store.machines[r * 7 + c].fp }}%</div>
              </div>
              <div v-else class="heatmap-cell empty" />
            </template>
          </div>
        </div>
        <!-- [동적] 커스텀 tooltip -->
        <Teleport to="body">
          <div
            v-if="tooltip.visible"
            class="custom-tooltip"
            :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
          >
            <div class="tt-header">
              <span class="tt-id">{{ tooltip.machine?.id }}</span>
              <span class="tt-status-dot" :style="{ background: getStatusColor(tooltip.machine?.status) }" />
              <span class="tt-status">{{ getStatusLabel(tooltip.machine?.status) }}</span>
            </div>
            <div class="tt-name">{{ tooltip.machine?.name }}</div>
            <div class="tt-fp">
              <span class="tt-fp-label">Fault Prob.</span>
              <span class="tt-fp-val" :style="{ color: getFpColor(tooltip.machine?.fp) }">{{ tooltip.machine?.fp }}%</span>
            </div>
          </div>
        </Teleport>
      </PanelCard>
    </div>

    <!-- Alert Log + Model Performance -->
    <div class="bot-grid">
      <!-- Alert Event Log: AI 리포트 스트림 느낌 -->
      <PanelCard :hover="false">
        <CardHeader title="알림 / 이벤트 로그" sub="AI 리포트 스트림" accent-color="#d97706">
          <template #right>
            <span class="dim-text">{{ store.aiReports.length }}건</span>
          </template>
        </CardHeader>
        <!-- [동적] TransitionGroup으로 행 슬라이드인 -->
        <TransitionGroup name="alert-slide" tag="div" class="alert-list">
          <div
            v-for="r in pagedReports"
            :key="r.id"
            class="alert-row"
            :class="{ 'alert-new': newReportIds.has(r.id), 'alert-read': r.isRead }"
            :style="{ '--alert-accent': getAlertAccent(r.status) }"
          >
            <!-- [동적] 왼쪽 상태 accent line -->
            <div class="alert-accent-line" :style="{ background: getAlertAccent(r.status) }" />
            <div class="alert-content">
              <div class="alert-top">
                <div class="alert-meta">
                  <span class="alert-id">{{ r.id }}</span>
                  <span class="alert-machine">{{ r.machine }}</span>
                  <StatusChip :status="r.status" />
                  <span class="alert-read-flag" :class="{ unread: !r.isRead }">
                    {{ r.isRead ? '읽음' : '미읽음' }}
                  </span>
                </div>
                <!-- [동적] 운영 대시보드다운 시간 표시 -->
                <span class="alert-time">
                  <span class="alert-time-dot" />{{ r.generated.split(' ')[1] }}
                </span>
              </div>
              <div class="alert-summary">{{ r.summary }}</div>
            </div>
          </div>
        </TransitionGroup>
        <!-- 페이지네이션 -->
        <div v-if="totalPages > 1" class="alert-pagination">
          <button class="page-btn" :disabled="alertPage === 1" @click="alertPage--">‹</button>
          <span class="page-info">{{ alertPage }} / {{ totalPages }}</span>
          <button class="page-btn" :disabled="alertPage === totalPages" @click="alertPage++">›</button>
        </div>
      </PanelCard>

      <!-- Model Performance -->
      <PanelCard :hover="false">
        <CardHeader title="AI 모델 성능 지표" :sub="modelHeaderSub" accent-color="#f97316">
          <template #right>
            <span v-if="modelDegraded" class="model-warn"><span class="model-warn-dot" />성능 저하 감지</span>
            <span v-else class="model-ok"><span class="model-dot" />모델 정상</span>
          </template>
        </CardHeader>
        <!-- 성능 저하 경고 배너 -->
        <div v-if="modelDegraded" class="model-alert-banner">
          <span class="model-alert-icon">⚠</span>
          <div class="model-alert-body">
            <div class="model-alert-title">모델 성능 저하 감지</div>
            <div class="model-alert-desc">
              <span v-if="recallDegraded">고장 재현율 {{ store.modelInfo.failure_recall }}% (기준 85% 미달)</span>
              <span v-if="recallDegraded && farDegraded"> · </span>
              <span v-if="farDegraded">오탐률 {{ store.modelInfo.false_alarm_rate }}% (기준 80% 초과)</span>
            </div>
          </div>
          <span class="model-alert-action">재학습 권장</span>
        </div>
        <div class="model-body">
          <div class="model-metrics">
            <div class="section-label">지표</div>
            <!-- [동적] 진입 시 부드럽게 채워지는 metric bar -->
            <div v-for="m in MODEL_METRICS" :key="m.label" class="metric-row">
              <div class="metric-top">
                <span class="metric-label">{{ m.label }}</span>
                <span class="metric-val" :style="{ color: m.color }">{{ m.value }}%</span>
              </div>
              <div class="progress-bg">
                <div
                  class="progress-fill"
                  :style="{
                    width: modelMetricVisible ? m.value + '%' : '0%',
                    background: m.color,
                    transitionDelay: MODEL_METRICS.indexOf(m) * 80 + 'ms'
                  }"
                />
              </div>
            </div>
          </div>
          <div class="model-chart">
            <div class="section-label">14일 지표 추이</div>
            <div class="chart-container">
              <!-- [동적] chart animation은 Chart.js 옵션으로 처리 -->
              <Line :data="lineData" :options="lineOptions" />
            </div>
          </div>
        </div>
      </PanelCard>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onActivated, watch, reactive } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend
} from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend)

import { useAppStore } from '../stores/appStore.js'
import { ICONS } from '../composables/useTokens.js'
import PanelCard  from '../components/PanelCard.vue'
import CardHeader from '../components/CardHeader.vue'
import AppIcon    from '../components/AppIcon.vue'
import DeltaBadge from '../components/DeltaBadge.vue'
import StatusChip from '../components/StatusChip.vue'

const store = useAppStore()

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const ZONES  = ['L1','L2','L3','L4','L5']
const LEGEND = [['정상','#0e9e6e'],['경고','#d97706'],['정비중','#1d62e8'],['고장 예측','#dc2626'],['오프라인','#64748b']]

const STATUS_MAP = {
  healthy:     { label: '정상',     color: '#0e9e6e' },
  warning:     { label: '경고',     color: '#d97706' },
  maintenance: { label: '정비중',   color: '#1d62e8' },
  fault:       { label: '고장 예측', color: '#dc2626' },
  offline:     { label: '오프라인', color: '#64748b' },
}

const recallDegraded = computed(() => {
  const v = store.modelInfo.failure_recall
  return v != null && v < 85
})
const farDegraded = computed(() => {
  const v = store.modelInfo.false_alarm_rate
  return v != null && v > 80
})
const modelDegraded = computed(() => recallDegraded.value || farDegraded.value)

const MODEL_METRICS = computed(() => {
  const info = store.modelInfo
  return [
    { label:'고장 재현율 (Recall)', value: info.failure_recall  ?? '-', color:'#e8431d' },
    { label:'오탐률 (FAR)',         value: info.false_alarm_rate ?? '-', color:'#d97706' },
  ]
})

const modelHeaderSub = computed(() => {
  const info = store.modelInfo
  if (!info.model_version) return 'AI 모델 성능'
  const date = info.trained_at ? info.trained_at.slice(0, 10) : ''
  return `${info.model_version} · 재학습: ${date}`
})

const kpiCards = computed(() => {
  const m = store.machines
  const healthy     = m.filter(x => x.status === 'healthy').length
  const warning     = m.filter(x => x.status === 'warning').length
  const maintenance = m.filter(x => x.status === 'maintenance').length
  const fault       = m.filter(x => x.status === 'fault').length
  const offline     = m.filter(x => x.status === 'offline').length
  return [
    { label:'연결 설비',    value:m.length,                  sub:`${m.length-offline}대 온라인 · ${offline}대 오프라인`, accent:'#1d62e8', icon:ICONS.cpu2,        bg:'#ebf1fd', color:'#1d62e8', pulse:false },
    { label:'정상 설비',    value:healthy,                   sub:'정상 운전 중',        accent:'#0e9e6e', icon:ICONS.checkCircle, bg:'#d0f5e8', color:'#0e9e6e', pulse:false },
    { label:'예측 경고',    value:warning,                   sub:'AI 이상 패턴 감지',   accent:'#d97706', icon:ICONS.activity,    bg:'#fef3c7', color:'#d97706', pulse:true  },
    { label:'정비 진행 중', value:maintenance,               sub:'현재 정비 중',        accent:'#1d62e8', icon:ICONS.wrench,      bg:'#ebf1fd', color:'#1d62e8', pulse:false },
    { label:'고장 예측 설비', value:fault,                   sub:'AI 고장 예측 감지',   accent:'#dc2626', icon:ICONS.alert,       bg:'#fee2e2', color:'#dc2626', pulse:true  },
    { label:'담당자 미지정', value:store.aiReports.filter(r => !r.orderCreated).length, sub:'지시서 미생성 AI 리포트', accent:'#f97316', icon:ICONS.brain, bg:'#fff7ed', color:'#f97316', pulse:store.aiReports.filter(r => !r.orderCreated).length > 0 },
  ]
})

// [동적] KPI 카드 순차 페이드인
const kpiVisible = ref(Array(6).fill(false))
// [동적] KPI count-up
const displayedKpi = ref(Array(6).fill(0))

function animateCountUp(refArr, targets, duration = 600) {
  if (prefersReduced) { targets.forEach((t, i) => { refArr.value[i] = t }); return }
  const start = Date.now()
  const startVals = [...refArr.value]
  function step() {
    const elapsed = Date.now() - start
    const t = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - t, 3)
    targets.forEach((target, i) => {
      refArr.value[i] = Math.round(startVals[i] + (target - startVals[i]) * ease)
    })
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// 성능 저하 토스트
function checkDegradeToast() {
  if (modelDegraded.value) {
    const parts = []
    if (recallDegraded.value) parts.push(`Recall ${store.modelInfo.failure_recall}%`)
    if (farDegraded.value)    parts.push(`FAR ${store.modelInfo.false_alarm_rate}%`)
    store.notifyError('모델 성능 저하 감지', `${parts.join(' · ')} — 재학습이 필요합니다.`)
  }
}

// 데이터 갱신으로 저하 → 정상 전환 시
watch(modelDegraded, (val, prev) => {
  if (!val && prev) {
    store.notifySuccess('모델 성능 정상', '재학습 후 성능이 회복되었습니다.')
  }
})

// 진입할 때마다 체크 (keep-alive 캐시 대응)
onActivated(() => { setTimeout(checkDegradeToast, 400) })

onMounted(() => {
  setTimeout(checkDegradeToast, 800)

  // 순차 KPI 진입
  kpiCards.value.forEach((_, i) => {
    setTimeout(() => { kpiVisible.value[i] = true }, prefersReduced ? 0 : i * 80 + 50)
  })
  // count-up
  setTimeout(() => {
    animateCountUp(displayedKpi, kpiCards.value.map(k => k.value), 700)
  }, prefersReduced ? 0 : 200)

  // progress bar 트리거
  setTimeout(() => { progressVisible.value = true }, prefersReduced ? 0 : 150)
  setTimeout(() => { modelMetricVisible.value = true }, prefersReduced ? 0 : 300)

  // 멀티 링 차트 진입 애니메이션
  setTimeout(() => { animateRings() }, prefersReduced ? 0 : 100)
})

// kpi 값 변경 시 count-up 재실행
watch(() => kpiCards.value.map(k => k.value), (next) => {
  animateCountUp(displayedKpi, next, 500)
})

const healthRows = [
  { label:'정상',    key:'healthy',     color:'#0e9e6e' },
  { label:'경고',    key:'warning',     color:'#d97706' },
  { label:'정비중',  key:'maintenance', color:'#1d62e8' },
  { label:'고장 예측', key:'fault',      color:'#dc2626' },
  { label:'오프라인',key:'offline',     color:'#64748b' },
]

const counts = computed(() => {
  const m = store.machines
  return {
    healthy:     m.filter(x => x.status === 'healthy').length,
    warning:     m.filter(x => x.status === 'warning').length,
    maintenance: m.filter(x => x.status === 'maintenance').length,
    fault:       m.filter(x => x.status === 'fault').length,
    offline:     m.filter(x => x.status === 'offline').length,
  }
})

// [동적] health count-up
const displayedCounts = ref({ healthy:0, warning:0, maintenance:0, fault:0, offline:0 })
const displayedTotal  = ref(0)
const progressVisible = ref(false)

watch(counts, (next) => {
  const keys = Object.keys(next)
  const startVals = { ...displayedCounts.value }
  const startTotal = displayedTotal.value
  const targetTotal = store.machines.length
  if (prefersReduced) {
    displayedCounts.value = { ...next }
    displayedTotal.value = targetTotal
    return
  }
  const start = Date.now()
  const dur = 500
  function step() {
    const t = Math.min((Date.now() - start) / dur, 1)
    const ease = 1 - Math.pow(1 - t, 3)
    keys.forEach(k => { displayedCounts.value[k] = Math.round(startVals[k] + (next[k] - startVals[k]) * ease) })
    displayedTotal.value = Math.round(startTotal + (targetTotal - startTotal) * ease)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}, { immediate: true })

const ringCanvas = ref(null)

// 링 설정: 바깥에서 안쪽 순서 (index 0 = 가장 바깥)
const RING_KEYS   = ['healthy', 'warning', 'maintenance', 'fault', 'offline']
const RING_COLORS = ['#0e9e6e', '#d97706', '#1d62e8', '#dc2626', '#94a3b8']

// 애니메이션용 현재 진행률 (0~1)
const ringProgress = ref(RING_KEYS.map(() => 0))

function drawRings(progress) {
  const canvas = ringCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const size = 200

  // HiDPI 대응
  if (canvas.dataset.scaled !== '1') {
    canvas.width  = size * dpr
    canvas.height = size * dpr
    canvas.style.width  = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)
    canvas.dataset.scaled = '1'
  }

  ctx.clearRect(0, 0, size, size)

  const cx = size / 2
  const cy = size / 2
  const total = store.machines.length || 1

  // 링 파라미터: 바깥 링부터 큰 반지름
  const outerR   = 88
  const ringGap  = 13   // 링 간격
  const ringW    = 9    // 링 두께

  RING_KEYS.forEach((key, i) => {
    const r    = outerR - i * ringGap
    const pct  = (counts.value[key] || 0) / total
    const prog = progress[i]        // 0~1 애니메이션 진행률
    const filled = pct * prog       // 실제 채워진 비율

    const startAngle = -Math.PI / 2                          // 12시 방향
    const endAngle   = startAngle + Math.PI * 2 * filled

    // 트랙 (배경 원)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth   = ringW
    ctx.lineCap     = 'round'
    ctx.stroke()

    // 채워진 원호 (값이 0이면 스킵)
    if (filled > 0.002) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, startAngle, endAngle)
      ctx.strokeStyle = RING_COLORS[i]
      ctx.lineWidth   = ringW
      ctx.lineCap     = 'round'
      ctx.stroke()
    }
  })
}

// 진입 애니메이션
function animateRings() {
  if (prefersReduced) {
    ringProgress.value = RING_KEYS.map(() => 1)
    drawRings(ringProgress.value)
    return
  }
  const duration = 900
  const start    = Date.now()
  function step() {
    const t    = Math.min((Date.now() - start) / duration, 1)
    const ease = 1 - Math.pow(1 - t, 3)
    ringProgress.value = RING_KEYS.map(() => ease)
    drawRings(ringProgress.value)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// 데이터 변경 시 재드로우
watch(counts, () => { drawRings(ringProgress.value) }, { deep: true })

function getCellStyle(m) {
  const colorMap = {
    healthy:     { color:'#0e9e6e' },
    warning:     { color:'#d97706' },
    maintenance: { color:'#1d62e8' },
    fault:       { color:'#dc2626' },
    offline:     { color:'#64748b' },
  }
  return colorMap[m.status] || { color:'#64748b' }
}

// [동적] 상태 점 클래스: warning/fault만 점멸
function getCellDotClass(status) {
  if (status === 'fault')   return 'dot-blink-fault'
  if (status === 'warning') return 'dot-blink-warn'
  return ''
}

// [동적] 상태 변경 시 flash 처리
const flashedCells = ref(new Set())
watch(() => store.machines.map(m => m.status), (next, prev) => {
  if (!prev || prefersReduced) return
  store.machines.forEach((m, i) => {
    if (prev[i] !== next[i]) {
      flashedCells.value.add(m.id)
      setTimeout(() => { flashedCells.value.delete(m.id) }, 1000)
    }
  })
}, { deep: true })

// [동적] 커스텀 tooltip
const tooltip = reactive({ visible: false, x: 0, y: 0, machine: null })

function showTooltip(e, m) {
  tooltip.machine = m
  tooltip.visible = true
  positionTooltip(e)
}
function hideTooltip() { tooltip.visible = false }
function positionTooltip(e) {
  const rect = e.target.getBoundingClientRect()
  tooltip.x = rect.left + rect.width / 2 - 80
  tooltip.y = rect.top - 90 + window.scrollY
}

function getStatusColor(s) { return STATUS_MAP[s]?.color ?? '#64748b' }
function getStatusLabel(s)  { return STATUS_MAP[s]?.label ?? s }
function getFpColor(fp) {
  if (fp >= 70) return '#dc2626'
  if (fp >= 40) return '#d97706'
  return '#0e9e6e'
}

const ALERT_PER_PAGE = 5
const alertPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(store.aiReports.length / ALERT_PER_PAGE)))
const pagedReports = computed(() => {
  const start = (alertPage.value - 1) * ALERT_PER_PAGE
  return store.aiReports.slice(start, start + ALERT_PER_PAGE)
})

// 데이터 새로 로드되면 첫 페이지로
watch(() => store.aiReports.length, () => { alertPage.value = 1 })

const newReportIds = ref(new Set())

watch(() => store.aiReports.map(r => r.id), (next, prev) => {
  if (!prev || prefersReduced) return
  next.forEach(id => {
    if (!prev.includes(id)) {
      newReportIds.value.add(id)
      setTimeout(() => { newReportIds.value.delete(id) }, 2500)
    }
  })
})

function getAlertAccent(status) {
  const map = { fault:'#dc2626', warning:'#d97706', maintenance:'#1d62e8', healthy:'#0e9e6e', offline:'#64748b' }
  return map[status] ?? '#94a3b8'
}

const modelMetricVisible = ref(false)

const lineData = computed(() => {
  const trend = store.modelTrend
  const labels = trend.map(d => d.d)

  // 더미 구간 점선 처리: segment 콜백으로 is_dummy 여부 구분
  const dummyCount = trend.filter(d => d.is_dummy).length

  const segmentStyle = (ctx, prop) => {
    // 더미 → 실제 데이터 경계 이전 구간은 점선
    return ctx.p0DataIndex < dummyCount ? (prop === 'borderDash' ? [4, 4] : 0.4) : undefined
  }

  return {
    labels,
    datasets: [
      {
        label: '고장 재현율',
        data: trend.map(d => d.recall),
        borderColor: '#e8431d',
        borderWidth: 2,
        pointRadius: trend.map(d => d.is_dummy ? 2 : 3),
        pointBackgroundColor: trend.map(d => d.is_dummy ? '#fca5a5' : '#e8431d'),
        tension: 0.4,
        fill: false,
        segment: {
          borderDash: ctx => segmentStyle(ctx, 'borderDash'),
          borderColor: ctx => ctx.p0DataIndex < dummyCount ? '#fca5a5' : '#e8431d',
        },
      },
      {
        label: '오탐률',
        data: trend.map(d => d.far),
        borderColor: '#d97706',
        borderWidth: 2,
        pointRadius: trend.map(d => d.is_dummy ? 2 : 3),
        pointBackgroundColor: trend.map(d => d.is_dummy ? '#fde68a' : '#d97706'),
        tension: 0.4,
        fill: false,
        segment: {
          borderDash: ctx => segmentStyle(ctx, 'borderDash'),
          borderColor: ctx => ctx.p0DataIndex < dummyCount ? '#fde68a' : '#d97706',
        },
      },
    ]
  }
})

const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: prefersReduced ? false : { duration: 800, easing: 'easeOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title(items) {
          const idx = items[0]?.dataIndex
          const item = store.modelTrend[idx]
          return item?.is_dummy ? `${items[0].label} (추정)` : (items[0]?.label ?? '')
        },
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color:'#94a3b8', font:{ size:9 }, maxTicksLimit: 5 } },
    y: { min:0, max:100, grid: { color:'#f0f4fa' }, ticks: { color:'#94a3b8', font:{ size:10 } } },
  },
}))
</script>

<style scoped>
/* ── prefers-reduced-motion ───────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── 페이지 ───────────────────────────────────────────────────────────────── */
.page { padding: 22px; display: flex; flex-direction: column; gap: 18px; }

/* ══ KPI Grid ════════════════════════════════════════════════════════════════ */
.kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }

.kpi-card {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.35s ease, transform 0.35s ease, box-shadow 0.22s ease;
}
.kpi-card.kpi-visible { opacity: 1; transform: translateY(0); }
.kpi-card:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05);
  transform: translateY(-2px) !important;
}
.delta-wrap { position: relative; }
.kpi-inner     { padding: 20px; }
.kpi-top       { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.kpi-icon-wrap { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
.kpi-label     { font-size: 11px; color: #475569; margin-bottom: 3px; }
.kpi-value     { font-size: 30px; font-weight: 800; line-height: 1; margin-bottom: 4px; font-variant-numeric: tabular-nums; }
.kpi-sub       { font-size: 10px; color: #94a3b8; }

/* ══ Mid Grid ════════════════════════════════════════════════════════════════ */
.mid-grid { display: grid; grid-template-columns: 360px 1fr; gap: 16px; }

/* ══ Health Distribution ═════════════════════════════════════════════════════ */
.health-body { padding: 16px 20px 20px; display: flex; gap: 20px; align-items: center; }

.ring-wrap { position: relative; flex-shrink: 0; width: 200px; height: 200px; }
.donut-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none;
}
.donut-total {
  font-size: 28px; font-weight: 800; color: #0f172a;
  line-height: 1; font-variant-numeric: tabular-nums;
}
.donut-label { font-size: 10px; color: #94a3b8; letter-spacing: .1em; margin-top: 3px; text-transform: uppercase; }

.live-badge { display: flex; align-items: center; gap: 5px; font-size: 10px; color: #0e9e6e; font-weight: 700; }
.live-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #0e9e6e; display: block;
  animation: live-pulse 1.8s ease-in-out infinite;
}
@keyframes live-pulse {
  0%, 100% { box-shadow: 0 0 0 0 #0e9e6e55; opacity: 1; }
  50%       { box-shadow: 0 0 0 5px #0e9e6e00; opacity: 0.85; }
}

.health-rows { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.health-row  { display: grid; grid-template-columns: 8px 1fr auto auto; align-items: center; gap: 8px; }
.health-dot   { width: 8px; height: 8px; border-radius: 50%; display: block; flex-shrink: 0; }
.health-name  { font-size: 12px; color: #475569; }
.health-count { font-size: 14px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums; text-align: right; }
.health-pct   { font-size: 11px; font-weight: 600; min-width: 36px; text-align: right; opacity: 0.7; }

/* ══ Heatmap ═════════════════════════════════════════════════════════════════ */
.heatmap-body { padding: 14px 20px 16px; }
.heatmap-grid { display: grid; gap: 4px; margin-bottom: 6px; }
.col-label    { font-size: 9px; color: #94a3b8; text-align: center; }
.heatmap-row  { display: grid; gap: 4px; margin-bottom: 4px; }
.row-label    { display: flex; align-items: center; font-size: 9px; color: #94a3b8; font-weight: 600; }

.heatmap-cell {
  height: 46px; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
  border: 1px solid transparent;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.heatmap-cell.status-healthy     { background: #d0f5e8; border-color: #a7e8ce; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
.heatmap-cell.status-warning     { background: #fef3c7; border-color: #fcd780; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
.heatmap-cell.status-maintenance { background: #ebf1fd; border-color: #93b8f7; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
.heatmap-cell.status-fault       { background: #fee2e2; border-color: #f8a8a8; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
.heatmap-cell.status-offline     { background: #f1f5f9; border-color: #cbd5e1; }

.heatmap-cell:hover { transform: scale(1.07); z-index: 2; }
.heatmap-cell.status-healthy:hover     { border-color: #6dd4ac; box-shadow: 0 4px 12px rgba(14,158,110,0.15); }
.heatmap-cell.status-warning:hover     { border-color: #f5b935; box-shadow: 0 4px 12px rgba(217,119,6,0.15); }
.heatmap-cell.status-maintenance:hover { border-color: #5a94ef; box-shadow: 0 4px 12px rgba(29,98,232,0.15); }
.heatmap-cell.status-fault:hover       { border-color: #f07070; box-shadow: 0 4px 12px rgba(220,38,38,0.15); }
.heatmap-cell.status-offline:hover     { border-color: #94a3b8; box-shadow: 0 4px 10px rgba(0,0,0,0.08); }

.heatmap-cell.empty { background: #f1f5f9; border: 1px solid #e2e8f0; cursor: default; }
.heatmap-cell.empty:hover { transform: none; box-shadow: none; }

.cell-status-dot {
  position: absolute; top: 6px; left: 7px;
  width: 6px; height: 6px; border-radius: 50%;
  box-shadow: 0 0 4px 1px rgba(15,23,42,0.25);
}
.dot-blink-warn  { animation: dot-blink-warn  2s ease-in-out infinite; }
@keyframes dot-blink-warn {
  0%, 100% { opacity: 1;    box-shadow: 0 0 6px 2px #d9770660; }
  50%       { opacity: 0.2; box-shadow: 0 0 0   0   #d9770600; }
}
.dot-blink-fault { animation: dot-blink-fault 1.2s ease-in-out infinite; }
@keyframes dot-blink-fault {
  0%, 100% { opacity: 1;    box-shadow: 0 0 8px 3px #dc262675; }
  50%       { opacity: 0.12; box-shadow: 0 0 0   0   #dc262600; }
}

.cell-flash { animation: cell-flash 0.9s ease forwards; }
@keyframes cell-flash {
  0%   { filter: brightness(1.5); }
  100% { filter: brightness(1); }
}

.cell-id { font-size: 9px; font-weight: 700; line-height: 1; }
.cell-fp { font-size: 8px; color: #94a3b8; line-height: 1; margin-top: 2px; }

.heatmap-cell.status-healthy     .cell-id { color: #0e9e6e; }
.heatmap-cell.status-warning     .cell-id { color: #d97706; }
.heatmap-cell.status-maintenance .cell-id { color: #1d62e8; }
.heatmap-cell.status-fault       .cell-id { color: #dc2626; }
.heatmap-cell.status-offline     .cell-id { color: #94a3b8; }

.legend      { display: flex; gap: 12px; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 10px; color: #475569; }
.legend-dot  { width: 8px; height: 8px; border-radius: 2px; display: block; }

/* ══ 커스텀 Tooltip ══════════════════════════════════════════════════════════ */
.custom-tooltip {
  position: absolute; z-index: 9999;
  background: #0f172a; color: #f8fafc;
  border-radius: 10px; padding: 10px 14px; min-width: 165px;
  pointer-events: none; box-shadow: 0 8px 28px rgba(0,0,0,0.22);
  animation: tt-in 0.15s ease;
}
@keyframes tt-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tt-header     { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
.tt-id         { font-size: 11px; font-weight: 700; color: #e2e8f0; font-family: monospace; }
.tt-status-dot { width: 7px; height: 7px; border-radius: 50%; display: block; flex-shrink: 0; }
.tt-status     { font-size: 10px; color: #94a3b8; }
.tt-name       { font-size: 11px; color: #cbd5e1; margin-bottom: 6px; }
.tt-fp         { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #1e293b; padding-top: 6px; }
.tt-fp-label   { font-size: 10px; color: #64748b; }
.tt-fp-val     { font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; }

/* ══ Bot Grid ════════════════════════════════════════════════════════════════ */
.bot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* ══ Alert Log ═══════════════════════════════════════════════════════════════ */
.alert-slide-enter-active { transition: all 0.35s cubic-bezier(0.22,1,0.36,1); }
.alert-slide-enter-from   { opacity: 0; transform: translateY(-8px); }
.alert-slide-leave-active { transition: all 0.25s ease; }
.alert-slide-leave-to     { opacity: 0; transform: translateX(-10px); }

.alert-list { display: flex; flex-direction: column; gap: 6px; padding: 8px 12px; }

.alert-row {
  display: flex; align-items: stretch; position: relative;
  background: #fff; border: 1px solid #f1f5f9; border-radius: 10px;
  overflow: hidden; transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.alert-row:hover { border-color: #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.alert-row.alert-read { opacity: 0.78; }

.alert-row.alert-new { animation: alert-highlight 2.5s ease forwards; }
@keyframes alert-highlight {
  0%   { background: #fff8f0; border-color: #fcd9b6; }
  100% { background: #fff; border-color: #f1f5f9; }
}
.alert-accent-line { width: 4px; flex-shrink: 0; transition: background 0.3s; }
.alert-content  { flex: 1; padding: 10px 14px; }
.alert-top      { display: flex; justify-content: space-between; gap: 14px; margin-bottom: 6px; }
.alert-meta     { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.alert-id       { font-size: 12px; font-weight: 700; color: #e8431d; }
.alert-machine  { font-size: 11px; color: #475569; }
.alert-time     { display: flex; align-items: center; gap: 5px; font-size: 10px; color: #94a3b8; font-family: monospace; white-space: nowrap; }
.alert-time-dot { width: 5px; height: 5px; border-radius: 50%; background: #94a3b8; display: block; }
.alert-summary  { font-size: 11px; color: #0f172a; line-height: 1.6; }
.alert-read .alert-summary { color: #64748b; }
.alert-read-flag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #64748b;
}
.alert-read-flag.unread {
  background: #fee2e2;
  color: #dc2626;
}
.dim-text       { font-size: 10px; color: #94a3b8; }

.alert-pagination { display:flex; align-items:center; justify-content:center; gap:10px; padding:10px 16px; border-top:1px solid #f1f5f9; }
.page-btn  { width:26px; height:26px; border-radius:6px; border:1px solid #e2e8f2; background:#fff; color:#475569; font-size:15px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; line-height:1; }
.page-btn:hover:not(:disabled)  { background:#eef1f7; border-color:#c7d2e0; }
.page-btn:disabled { opacity:0.35; cursor:default; }
.page-info { font-size:11px; color:#94a3b8; font-variant-numeric:tabular-nums; min-width:36px; text-align:center; }

/* ══ Model Performance ═══════════════════════════════════════════════════════ */
.model-body      { display: grid; grid-template-columns: 260px 1fr; }
.model-metrics   { padding: 16px 18px; border-right: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 12px; }
.model-chart     { padding: 16px 12px 10px; display: flex; flex-direction: column; min-width: 0; }
.chart-container { position: relative; height: 180px; width: 100%; }

.model-ok   { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #0e9e6e; }
.model-dot  { width: 7px; height: 7px; border-radius: 50%; background: #0e9e6e; display: block; animation: live-pulse 2.2s ease-in-out infinite; }
.model-warn { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #dc2626; }
.model-warn-dot { width: 7px; height: 7px; border-radius: 50%; background: #dc2626; display: block; animation: live-pulse 1.2s ease-in-out infinite; }

.model-alert-banner {
  display: flex; align-items: center; gap: 12px;
  background: #fff5f5; border-top: 1px solid #fecaca; border-bottom: 1px solid #fecaca;
  padding: 10px 16px;
}
.model-alert-icon  { font-size: 16px; flex-shrink: 0; }
.model-alert-body  { flex: 1; min-width: 0; }
.model-alert-title { font-size: 12px; font-weight: 800; color: #dc2626; margin-bottom: 2px; }
.model-alert-desc  { font-size: 11px; color: #ef4444; }
.model-alert-action {
  font-size: 10px; font-weight: 700; color: #dc2626;
  background: #fee2e2; border: 1px solid #fca5a5;
  border-radius: 20px; padding: 3px 10px; white-space: nowrap; flex-shrink: 0;
}

.progress-bg   { height: 5px; background: #e2e8f2; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.7s cubic-bezier(0.22,1,0.36,1); }

.section-label { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 10px; }
.metric-row    { display: flex; flex-direction: column; gap: 5px; }
.metric-top    { display: flex; justify-content: space-between; }
.metric-label  { font-size: 12px; color: #475569; }
.metric-val    { font-size: 13px; font-weight: 800; }
</style>
