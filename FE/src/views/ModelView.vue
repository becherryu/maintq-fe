<template>
  <div class="page">
    <!-- Model Performance + (optional PDF) -->
    <div class="top-grid" :class="{ 'with-pdf': showPDF }">
      <PanelCard :hover="false">
        <CardHeader title="AI 모델 성능 지표" :sub="modelHeaderSub" accent-color="#f97316">
          <template #right>
            <div class="header-right-row">
              <span v-if="recallWarn || farWarn" class="model-warn">● 성능 저하</span>
              <span v-else class="model-ok">● 모델 정상</span>
              <button class="btn-retrain" :disabled="manualRetrainLoading" @click="openRetrainModal">
                <AppIcon :d="ICONS.brain" :size="12" color="#fff" />
                {{ manualRetrainLoading ? '재학습 실행 중...' : '수동 재학습 실행' }}
              </button>
              <button class="btn-pdf" :class="{ active: showPDF }" @click="showPDF = !showPDF">
                <AppIcon :d="ICONS.fileText" :size="12" :color="showPDF ? '#475569' : '#fff'" />
                {{ showPDF ? 'PDF 닫기' : 'PDF 보기' }}
              </button>
            </div>
          </template>
        </CardHeader>
        <div class="perf-body">
          <div class="perf-metrics">
            <div class="sec-label">지표</div>
            <div v-for="m in MODEL_METRICS" :key="m.label" class="metric-row">
              <div class="metric-top">
                <span class="metric-lbl">{{ m.label }}</span>
                <span class="metric-val" :style="{ color: m.color }">
                  {{ typeof m.value === 'number' ? m.value + '%' : '-' }}
                </span>
              </div>
              <div class="progress-bg">
                <div class="progress-fill" :style="{ width: (typeof m.value === 'number' ? m.value : 0) + '%', background: m.color }" />
              </div>
            </div>
          </div>
          <div class="perf-chart">
            <div class="sec-label">재학습 이력 지표 추이</div>
            <div class="chart-container" style="height:180px">
              <Line :data="lineData" :options="lineOptions" />
            </div>
            <div class="line-legend">
              <span v-for="[l,c] in LINE_LEGEND" :key="l" class="legend-item">
                <span class="legend-dot" :style="{ background: c }" />{{ l }}
              </span>
            </div>
          </div>
        </div>
      </PanelCard>

      <!-- PDF Panel -->
      <div v-if="showPDF" class="pdf-panel">
        <div class="pdf-header">
          <div class="pdf-header-left">
            <AppIcon :d="ICONS.fileText" :size="15" color="#dc2626" />
            <span class="pdf-title-text">예측 로그 & 모델 리포트</span>
          </div>
          <button class="btn-download" @click="downloadPDF">
            <AppIcon :d="ICONS.download" :size="13" color="#fff" /> 다운로드
          </button>
        </div>
        <div class="pdf-content" ref="pdfRef">
          <div class="pdf-hdr-sec">
            <div class="pdf-eyebrow">MaintQ AI 모델 리포트</div>
            <div class="pdf-main-title">예측 로그 및 모델 성능 보고서</div>
            <div class="pdf-chips">
              <span class="pdf-chip">생성: {{ now }}</span>
              <span class="pdf-chip">Fab A · 설비 35대</span>
            </div>
          </div>
          <div class="pdf-section">
            <div class="pdf-sec-lbl purple">모델 정보</div>
            <div class="model-info-grid">
              <div v-for="[l,v,c] in MODEL_INFO" :key="l" class="mi-chip">
                <div class="mi-lbl">{{ l }}</div>
                <div class="mi-val" :style="{ color: c }">{{ v }}</div>
              </div>
            </div>
          </div>
          <div class="pdf-section">
            <div class="pdf-sec-lbl blue">성능 지표</div>
            <div v-for="m in MODEL_METRICS" :key="m.label" class="pdf-metric">
              <div class="pdf-metric-top">
                <span>{{ m.label }}</span>
                <span :style="{ color: m.color, fontWeight:800 }">{{ m.value }}%</span>
              </div>
              <div class="progress-bg"><div class="progress-fill" :style="{ width: m.value + '%', background: m.color }" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 예측 로그 + 모델 KPI -->
    <div class="bot-grid">
      <PanelCard :hover="false">
        <CardHeader title="예측 로그" sub="일별 예측 실행 건수" accent-color="#e8431d" />
        <div class="chart-wrap">
          <div class="chart-container" style="height:220px">
            <Bar :data="barData" :options="barOptions" />
          </div>
        </div>
      </PanelCard>

      <PanelCard :hover="false">
        <CardHeader title="모델 리포트" sub="모델 품질 및 엔진 요약" accent-color="#f97316" />
        <div class="model-kpis">
          <div v-for="[l,v,c] in MODEL_INFO" :key="l" class="model-kpi">
            <div class="model-kpi-lbl">{{ l }}</div>
            <div class="model-kpi-val" :style="{ color: c }">{{ v }}</div>
          </div>
        </div>
      </PanelCard>
    </div>

    <!-- 재학습 이력 + 보고서 뷰어 (2열 레이아웃) -->
    <div class="retrain-grid" :class="{ 'with-detail': selectedRetrain !== null }">
      <!-- 왼쪽: 이력 목록 -->
      <div class="retrain-list-col" :class="{ shrink: selectedRetrain !== null }">
        <div class="retrain-col-header">
          <div class="retrain-col-title">재학습 이력</div>
          <div class="retrain-col-sub">모델 재학습 트리거 및 성능 변화</div>
        </div>
        <div v-if="store.retrainReports.length === 0" class="retrain-empty">재학습 이력이 없습니다.</div>
        <div v-else class="retrain-items">
          <div
            v-for="(r, i) in store.retrainReports" :key="i"
            class="retrain-item"
            :class="{ selected: selectedRetrain === i }"
            @click="openRetrainReport(r, i)"
          >
            <div class="ri-top">
              <span class="version-chip">{{ r.model_version || '-' }}</span>
              <span class="ri-date">{{ r.trained_at ? r.trained_at.slice(0, 10) : (r.created_at ? r.created_at.slice(0, 10) : '-') }}</span>
            </div>
            <div class="ri-trigger">{{ r.trigger_reason || '-' }}</div>
            <div class="ri-badges">
              <span class="ri-badge">
                <span class="ri-badge-lbl">Recall</span>
                <span class="ri-badge-val" :style="{ color: r.recall_before != null ? (r.recall_before >= 85 ? '#0e9e6e' : '#dc2626') : '#94a3b8' }">
                  {{ r.recall_before != null ? r.recall_before + '%' : '-' }}
                </span>
              </span>
              <span class="ri-badge">
                <span class="ri-badge-lbl">FAR</span>
                <span class="ri-badge-val" :style="{ color: r.far_before != null ? (r.far_before <= 80 ? '#0e9e6e' : '#dc2626') : '#94a3b8' }">
                  {{ r.far_before != null ? r.far_before + '%' : '-' }}
                </span>
              </span>
              <span class="ri-badge">
                <span class="ri-badge-lbl">CV PR-AUC</span>
                <span class="ri-badge-val" style="color:#7c3aed">{{ r.cv_pr_auc != null ? r.cv_pr_auc + '%' : '-' }}</span>
              </span>
              <span class="ri-badge">
                <span class="ri-badge-lbl">임계값</span>
                <span class="ri-badge-val">{{ r.new_threshold ?? '-' }}</span>
              </span>
            </div>
            <div class="ri-bottom">
              <div v-if="r.has_report" class="ri-report-hint">{{ selectedRetrain === i ? '▲ 보고서 닫기' : '▶ 보고서 보기' }}</div>
              <div v-else class="ri-report-hint dim">보고서 없음</div>
              <!-- 현재 활성 모델이 아닌 항목에만 롤백 버튼 -->
              <button
                v-if="i > 0"
                class="btn-rollback"
                :disabled="rollbackLoading"
                @click.stop="confirmRollback(r, i)"
              >{{ rollbackLoading && rollbackTarget === i ? '복원 중...' : '↩ 롤백' }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 보고서 뷰어 -->
      <div class="retrain-detail-col" :class="{ visible: selectedRetrain !== null }">
        <!-- 미선택 상태 -->
        <div v-if="selectedRetrain === null" class="retrain-detail-empty">
          <div class="detail-empty-icon">📋</div>
          <div class="detail-empty-txt">재학습 이력을 선택하면<br>보고서가 여기에 표시됩니다.</div>
        </div>

        <!-- 선택된 보고서 -->
        <template v-else>
          <div class="retrain-detail-header">
            <div class="retrain-detail-meta">
              <span class="version-chip">{{ store.retrainReports[selectedRetrain]?.model_version || '' }}</span>
              <span class="ri-date" style="margin-left:8px">{{ store.retrainReports[selectedRetrain]?.trained_at?.slice(0,10) || store.retrainReports[selectedRetrain]?.created_at?.slice(0,10) || '' }}</span>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <span v-if="reportLoading" class="loading-txt">불러오는 중...</span>
              <button v-if="reportHtml" class="btn-dl-report" @click="downloadRetrainPDF">
                <AppIcon :d="ICONS.download" :size="12" color="#fff" /> PDF 다운로드
              </button>
              <button class="btn-close-report" @click="selectedRetrain = null; reportHtml = ''">✕</button>
            </div>
          </div>

          <div v-if="!reportLoading && !reportHtml" class="report-no-content">
            <div>이 재학습에 대한 HTML 보고서가 없습니다.</div>
            <div class="dim" style="margin-top:4px;font-size:11px">다음 재학습부터는 자동 생성됩니다.</div>
          </div>

          <iframe
            v-if="reportHtml"
            ref="reportIframe"
            class="report-iframe"
            :srcdoc="reportHtml"
            sandbox="allow-same-origin"
          />
        </template>
      </div>
    </div>

    <div v-if="retrainModalOpen" class="retrain-modal-backdrop" @click.self="closeRetrainModal">
      <div class="retrain-modal">
        <div class="retrain-modal-header">
          <div class="retrain-modal-title">수동 재학습 실행</div>
          <button class="retrain-modal-close" @click="closeRetrainModal">✕</button>
        </div>

        <!-- Step 1: 현재 성능 확인 -->
        <div v-if="retrainStep === 1" class="retrain-modal-body">
          <div class="retrain-modal-sub">현재 모델 성능을 확인한 후 재학습 여부를 결정하세요.</div>
          <div class="retrain-perf-grid">
            <div class="retrain-perf-item" :class="{ warn: recallWarn }">
              <div class="retrain-perf-lbl">고장 재현율 (Recall)</div>
              <div class="retrain-perf-val" :style="{ color: recallWarn ? '#dc2626' : '#0e9e6e' }">
                {{ store.modelInfo.failure_recall != null ? store.modelInfo.failure_recall + '%' : '-' }}
              </div>
              <div v-if="recallWarn" class="retrain-perf-warn">기준치(85%) 미달</div>
            </div>
            <div class="retrain-perf-item" :class="{ warn: farWarn }">
              <div class="retrain-perf-lbl">오탐률 (FAR)</div>
              <div class="retrain-perf-val" :style="{ color: farWarn ? '#dc2626' : '#0e9e6e' }">
                {{ store.modelInfo.false_alarm_rate != null ? store.modelInfo.false_alarm_rate + '%' : '-' }}
              </div>
              <div v-if="farWarn" class="retrain-perf-warn">기준치(80%) 초과</div>
            </div>
            <div class="retrain-perf-item">
              <div class="retrain-perf-lbl">마지막 학습일</div>
              <div class="retrain-perf-val" style="font-size:13px;color:#0f172a">
                {{ store.modelInfo.trained_at ? store.modelInfo.trained_at.slice(0,10) : '-' }}
              </div>
            </div>
            <div class="retrain-perf-item">
              <div class="retrain-perf-lbl">모델 버전</div>
              <div class="retrain-perf-val" style="font-size:13px;color:#7c3aed">
                {{ store.modelInfo.model_version || '-' }}
              </div>
            </div>
          </div>
          <div v-if="recallWarn || farWarn" class="retrain-alert-box">
            ⚠ 성능 지표가 기준치를 벗어났습니다. 재학습을 권장합니다.
          </div>
          <div v-else class="retrain-ok-box">
            ✓ 현재 모델 성능은 정상 범위입니다. 그래도 재학습하시겠습니까?
          </div>
        </div>

        <!-- Step 2: 사유 선택 -->
        <div v-if="retrainStep === 2" class="retrain-modal-body">
          <div class="retrain-modal-sub">재학습 사유를 선택한 뒤 진행하세요.</div>
          <div class="retrain-reason-list">
            <label
              v-for="reason in RETRAIN_REASON_OPTIONS"
              :key="reason.id"
              class="retrain-reason-item"
              :class="{ selected: selectedRetrainReasonKey === reason.id }"
            >
              <input v-model="selectedRetrainReasonKey" class="reason-radio" type="radio" name="retrainReason" :value="reason.id">
              <span class="reason-dot" />
              <span class="reason-texts">
                <span class="reason-title">{{ reason.label }}</span>
                <span class="reason-desc">{{ reason.desc }}</span>
              </span>
            </label>
          </div>
          <div v-if="selectedRetrainReasonKey === 'other'" class="retrain-custom-wrap">
            <div class="retrain-custom-label">직접 입력</div>
            <textarea
              v-model="customRetrainReason"
              class="retrain-custom-input"
              rows="3"
              maxlength="120"
              placeholder="재학습 사유를 입력하세요 (최대 120자)"
            />
          </div>
        </div>

        <div class="retrain-modal-actions">
          <button class="btn-modal-cancel" :disabled="manualRetrainLoading" @click="closeRetrainModal">취소</button>
          <!-- Step 1 → 2 -->
          <button v-if="retrainStep === 1" class="btn-modal-confirm" @click="retrainStep = 2">
            재학습 진행
          </button>
          <!-- Step 2: 최종 실행 -->
          <template v-if="retrainStep === 2">
            <button class="btn-modal-back" :disabled="manualRetrainLoading" @click="retrainStep = 1">← 이전</button>
            <button class="btn-modal-confirm" :disabled="manualRetrainLoading || !canSubmitRetrain" @click="triggerManualRetrain">
              {{ manualRetrainLoading ? '진행 중...' : '재학습 실행' }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import html2pdf from 'html2pdf.js'
import { Bar, Line } from 'vue-chartjs'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement } from 'chart.js'
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement)

import { useAppStore } from '../stores/appStore.js'
import { ICONS } from '../composables/useTokens.js'
import PanelCard  from '../components/PanelCard.vue'
import CardHeader from '../components/CardHeader.vue'
import AppIcon    from '../components/AppIcon.vue'

const store           = useAppStore()
const showPDF         = ref(false)
const pdfRef          = ref(null)
const now             = new Date().toLocaleString('ko-KR')
const selectedRetrain = ref(null)
const reportHtml      = ref('')
const reportLoading   = ref(false)
const reportIframe    = ref(null)
const manualRetrainLoading = ref(false)
const retrainModalOpen = ref(false)
const retrainStep = ref(1)
const rollbackLoading = ref(false)
const rollbackTarget  = ref(null)

const recallWarn = computed(() => {
  const v = store.modelInfo.failure_recall
  return v != null && v < 85
})
const farWarn = computed(() => {
  const v = store.modelInfo.false_alarm_rate
  return v != null && v > 80
})
const RETRAIN_REASON_OPTIONS = [
  { id: 'performance', label: '성능 지표 저하 대응', desc: '최근 평가 지표 저하를 반영해 즉시 재학습합니다.' },
  { id: 'drift', label: '운영 데이터 분포 변화 반영', desc: '현장 데이터 패턴 변화에 모델을 맞춥니다.' },
  { id: 'policy', label: '모델 임계값/정책 변경 반영', desc: '운영 정책 또는 임계값 변경 사항을 반영합니다.' },
  { id: 'other', label: '기타 (직접 입력)', desc: '사유를 직접 입력해 재학습 이력에 남깁니다.' },
]
const selectedRetrainReasonKey = ref(RETRAIN_REASON_OPTIONS[0].id)
const customRetrainReason = ref('')
const canSubmitRetrain = computed(() => {
  if (selectedRetrainReasonKey.value !== 'other') return true
  return customRetrainReason.value.trim().length > 0
})

const MODEL_INFO = computed(() => {
  const info = store.modelInfo
  const date = info.trained_at ? info.trained_at.slice(0, 10) : '-'
  const recall = info.failure_recall != null ? info.failure_recall + '%' : '-'
  const far    = info.false_alarm_rate != null ? info.false_alarm_rate + '%' : '-'
  const trainStart = info.train_period_start ? info.train_period_start.slice(0, 10) : '-'
  const trainEnd   = info.train_period_end   ? info.train_period_end.slice(0, 10)   : '-'
  const latestLog  = store.predictLogs.length ? store.predictLogs[store.predictLogs.length - 1] : null
  const dailyPred  = latestLog ? latestLog.predictions.toLocaleString() : '-'
  return [
    ['모델 버전',     info.model_version || '-',       '#e8431d'],
    ['마지막 평가',   date,                             '#0f172a'],
    ['학습 기간',     `${trainStart} ~ ${trainEnd}`,   '#0f172a'],
    ['일일 예측 건수', dailyPred,                       '#0f172a'],
    ['고장 재현율',   recall,                           '#0e9e6e'],
    ['오탐률',        far,                              '#d97706'],
  ]
})

const MODEL_METRICS = computed(() => {
  const info = store.modelInfo
  return [
    { label:'고장 재현율 (Recall)', value: info.failure_recall  ?? '-', color:'#e8431d' },
    { label:'오탐률 (FAR)',         value: info.false_alarm_rate ?? '-', color:'#d97706' },
  ]
})
const LINE_LEGEND = [['고장 재현율','#e8431d'],['오탐률','#d97706']]

const modelHeaderSub = computed(() => {
  const info = store.modelInfo
  if (!info.model_version) return 'AI 모델 성능'
  const date = info.trained_at ? info.trained_at.slice(0, 10) : ''
  return `${info.model_version} · 마지막 평가: ${date}`
})

const barData = computed(() => ({
  labels: store.predictLogs.map(d => d.t),
  datasets: [
    { label:'경고', data: store.predictLogs.map(d => d.warningCases), backgroundColor:'#d97706', borderRadius:4 },
    { label:'고장 예측', data: store.predictLogs.map(d => d.faultCases), backgroundColor:'#dc2626', borderRadius:4 },
  ]
}))
const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color:'#475569', font:{ size:11 } } }, tooltip: { mode:'index', intersect:false } },
  scales: {
    x: { grid:{ display:false }, ticks:{ color:'#94a3b8', font:{ size:10 } } },
    y: { grid:{ color:'#f0f4fa' }, ticks:{ color:'#94a3b8', font:{ size:10 } } },
  },
}

const lineData = computed(() => ({
  labels: store.modelTrend.map(d => d.d),
  datasets: [
    { label:'고장 재현율', data: store.modelTrend.map(d => d.recall), borderColor:'#e8431d', borderWidth:2, pointRadius:3, tension:0.4 },
    { label:'오탐률',     data: store.modelTrend.map(d => d.far),    borderColor:'#d97706', borderWidth:2, pointRadius:3, tension:0.4 },
  ]
}))
const lineOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend:{ display:true, labels:{ color:'#475569', font:{ size:11 } } }, tooltip:{ mode:'index', intersect:false } },
  scales: {
    x: { grid:{ display:false }, ticks:{ color:'#94a3b8', font:{ size:9 }, maxTicksLimit:5 } },
    y: { min:0, max:100, grid:{ color:'#f0f4fa' }, ticks:{ color:'#94a3b8', font:{ size:10 } } },
  },
}

function downloadPDF() {
  const source = pdfRef.value
  if (!source) return

  const wrapper = document.createElement('div')
  wrapper.style.background = '#ffffff'
  wrapper.style.padding = '20px'
  wrapper.innerHTML = source.innerHTML
  document.body.appendChild(wrapper)

  html2pdf().set({
    margin: [8, 8, 8, 8],
    filename: `model_report_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  }).from(wrapper).save().finally(() => {
    wrapper.remove()
  })
}

async function openRetrainReport(r, i) {
  if (selectedRetrain.value === i) {
    selectedRetrain.value = null
    reportHtml.value = ''
    return
  }
  selectedRetrain.value = i
  reportHtml.value = ''
  if (!r.has_report) return

  reportLoading.value = true
  try {
    const res = await fetch(`http://localhost:8003/ai/retrain-reports/${r.id}/html`, {
      credentials: 'include'
    })
    if (res.ok) {
      const data = await res.json()
      reportHtml.value = data.html || ''
    }
  } catch (e) {
    console.error('[retrain report]', e)
  } finally {
    reportLoading.value = false
  }
}

function downloadRetrainPDF() {
  if (!reportHtml.value) return
  const wrapper = document.createElement('div')
  wrapper.style.background = '#ffffff'
  wrapper.style.padding = '20px'
  wrapper.innerHTML = reportHtml.value
  document.body.appendChild(wrapper)

  html2pdf().set({
    margin: [8, 8, 8, 8],
    filename: `retrain_report_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  }).from(wrapper).save().finally(() => {
    wrapper.remove()
  })
}

async function triggerManualRetrain() {
  if (manualRetrainLoading.value) return
  if (!canSubmitRetrain.value) return
  manualRetrainLoading.value = true
  try {
    const selected = RETRAIN_REASON_OPTIONS.find((item) => item.id === selectedRetrainReasonKey.value)
    const reason = selectedRetrainReasonKey.value === 'other'
      ? customRetrainReason.value.trim()
      : (selected?.label || '수동 재학습')

    const result = await store.triggerManualRetrain(reason)
    if (result?.ok) {
      retrainModalOpen.value = false
      customRetrainReason.value = ''
    }
  } finally {
    manualRetrainLoading.value = false
  }
}

function openRetrainModal() {
  if (manualRetrainLoading.value) return
  selectedRetrainReasonKey.value = RETRAIN_REASON_OPTIONS[0].id
  customRetrainReason.value = ''
  retrainStep.value = 1
  retrainModalOpen.value = true
}

async function confirmRollback(r, i) {
  const ver = r.model_version || '이전 버전'
  if (!confirm(`${ver} 모델로 롤백하시겠습니까?\n현재 활성 모델이 교체됩니다.`)) return
  rollbackLoading.value = true
  rollbackTarget.value  = i
  try {
    const res = await fetch('http://localhost:8003/ai/retrain/rollback', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    if (res.ok) {
      store.notifySuccess('롤백 완료', `${data.restored_version} 모델로 복원되었습니다.`)
      await store.init()
    } else {
      store.notifyError('롤백 실패', data.detail || '오류가 발생했습니다.')
    }
  } catch (e) {
    store.notifyError('롤백 실패', '서버 연결 오류')
  } finally {
    rollbackLoading.value = false
    rollbackTarget.value  = null
  }
}

function closeRetrainModal() {
  if (manualRetrainLoading.value) return
  selectedRetrainReasonKey.value = RETRAIN_REASON_OPTIONS[0].id
  customRetrainReason.value = ''
  retrainStep.value = 1
  retrainModalOpen.value = false
}
</script>

<style scoped>
.page { padding:22px; display:flex; flex-direction:column; gap:16px; }
.top-grid { display:grid; grid-template-columns:1fr; gap:16px; }
.top-grid.with-pdf { grid-template-columns:1fr 420px; }
.bot-grid { display:grid; grid-template-columns:1.1fr 1fr; gap:16px; }
.chart-wrap { padding:14px 4px 10px; }
.chart-container { position:relative; width:100%; }
.model-kpis { padding:20px; display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
.model-kpi  { background:#eef1f7; border-radius:10px; padding:14px 12px; }
.model-kpi-lbl { font-size:10px; color:#94a3b8; margin-bottom:4px; }
.model-kpi-val { font-size:16px; font-weight:800; }
.header-right-row { display:flex; align-items:center; gap:10px; }
.btn-retrain {
  display:flex;
  align-items:center;
  gap:6px;
  background:#0f766e;
  color:#fff;
  border:1px solid #0f766e;
  border-radius:7px;
  padding:6px 12px;
  font-size:11px;
  font-weight:700;
  cursor:pointer;
  font-family:inherit;
}
.btn-retrain:disabled { opacity:0.65; cursor:not-allowed; }
.btn-retrain:hover:not(:disabled) { background:#0d665f; border-color:#0d665f; }
.btn-pdf { display:flex; align-items:center; gap:6px; background:#e8431d; color:#fff; border:1px solid #e8431d; border-radius:7px; padding:6px 12px; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; }
.btn-pdf.active { background:#eef1f7; color:#475569; border-color:#e2e8f2; }

.perf-body { display:grid; grid-template-columns:260px 1fr; }
.perf-metrics { padding:16px 18px; border-right:1px solid #f1f5f9; display:flex; flex-direction:column; gap:12px; }
.perf-chart   { padding:16px 12px 10px; display:flex; flex-direction:column; min-width:0; }
.sec-label    { font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:.1em; text-transform:uppercase; margin-bottom:10px; }
.metric-row   { display:flex; flex-direction:column; gap:5px; }
.metric-top   { display:flex; justify-content:space-between; }
.metric-lbl   { font-size:12px; color:#475569; }
.metric-val   { font-size:13px; font-weight:800; }
.model-ok     { font-size:11px; font-weight:700; color:#0e9e6e; }
.model-warn   { font-size:11px; font-weight:700; color:#dc2626; }
.line-legend  { display:flex; gap:16px; padding-top:10px; justify-content:center; }
.legend-item  { display:flex; align-items:center; gap:5px; font-size:11px; color:#475569; }
.legend-dot   { width:12px; height:3px; border-radius:2px; display:block; }
.progress-bg  { height:6px; background:#e2e8f2; border-radius:3px; overflow:hidden; }
.progress-fill { height:100%; border-radius:3px; transition:width .4s; }

.pdf-panel  { display:flex; flex-direction:column; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); overflow:hidden; }
.pdf-header { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; background:#eef1f7; border-bottom:1px solid #f1f5f9; }
.pdf-header-left { display:flex; align-items:center; gap:8px; }
.pdf-title-text  { font-size:12px; font-weight:700; color:#0f172a; }
.pdf-content { flex:1; overflow-y:auto; padding:24px 28px; }
.btn-download { display:flex; align-items:center; gap:6px; background:#e8431d; color:#fff; border:none; border-radius:7px; padding:7px 13px; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; }

.pdf-hdr-sec { margin-bottom:22px; border-bottom:3px solid #f97316; padding-bottom:18px; }
.pdf-eyebrow  { font-size:9px; color:#94a3b8; letter-spacing:.12em; text-transform:uppercase; margin-bottom:2px; }
.pdf-main-title { font-size:20px; font-weight:900; color:#0f172a; margin-bottom:10px; }
.pdf-chips  { display:flex; gap:8px; flex-wrap:wrap; }
.pdf-chip   { font-size:10px; color:#94a3b8; background:#eef1f7; padding:3px 9px; border-radius:20px; }
.pdf-section { margin-bottom:18px; }
.pdf-sec-lbl { font-size:11px; font-weight:700; color:#475569; padding-left:8px; margin-bottom:8px; }
.pdf-sec-lbl.purple { border-left:3px solid #f97316; }
.pdf-sec-lbl.blue   { border-left:3px solid #e8431d; }
.model-info-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
.mi-chip    { background:#eef1f7; border-radius:8px; padding:11px 13px; }
.mi-lbl     { font-size:9px; color:#94a3b8; margin-bottom:4px; }
.mi-val     { font-size:14px; font-weight:800; }
.pdf-metric { margin-bottom:10px; }
.pdf-metric-top { display:flex; justify-content:space-between; margin-bottom:5px; font-size:12px; }

/* ── 재학습 2열 레이아웃 ── */
.retrain-grid {
  display:grid;
  grid-template-columns: 1fr 0fr;
  gap:0;
  height:600px;
  background:#fff;
  border-radius:14px;
  box-shadow:0 2px 8px rgba(0,0,0,.06);
  overflow:hidden;
  transition: grid-template-columns .25s ease;
}
.retrain-grid.with-detail {
  grid-template-columns: 0.75fr 1.25fr;
}

.retrain-list-col {
  display:flex; flex-direction:column;
  border-right:1px solid #f1f5f9;
  min-height:0; overflow:hidden;
  transition: all .25s ease;
}
.retrain-list-col.shrink { /* no extra style needed — grid handles sizing */ }

.retrain-col-header {
  padding:14px 18px 12px;
  border-bottom:1px solid #f1f5f9;
  flex-shrink:0;
}
.retrain-col-title { font-size:13px; font-weight:800; color:#0f172a; }
.retrain-col-sub   { font-size:10px; color:#94a3b8; margin-top:2px; }

.retrain-empty { padding:24px 18px; font-size:13px; color:#94a3b8; text-align:center; }

.retrain-items { flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:6px; }

.retrain-item {
  padding:12px 14px;
  border-radius:10px;
  border:1px solid #f1f5f9;
  cursor:pointer;
  transition:background .12s, border-color .12s;
}
.retrain-item:hover { background:#fafafa; }
.retrain-item.selected { background:#faf5ff; border-color:#d8b4fe; }

.ri-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; }
.ri-date { font-size:10px; color:#94a3b8; }
.ri-trigger { font-size:11px; color:#475569; margin-bottom:7px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ri-badges { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:6px; }
.ri-badge { background:#f1f5f9; border-radius:6px; padding:3px 7px; display:flex; align-items:center; gap:4px; }
.ri-badge-lbl { font-size:9px; color:#94a3b8; font-weight:600; }
.ri-badge-val { font-size:11px; font-weight:700; color:#0f172a; }
.ri-bottom { display:flex; align-items:center; justify-content:space-between; }
.ri-report-hint { font-size:10px; color:#7c3aed; font-weight:700; }
.ri-report-hint.dim { color:#94a3b8; font-weight:400; }
.btn-rollback {
  font-size:10px; font-weight:700; color:#dc2626;
  background:#fff5f5; border:1px solid #fca5a5;
  border-radius:6px; padding:3px 8px; cursor:pointer;
  font-family:inherit;
}
.btn-rollback:hover:not(:disabled) { background:#fee2e2; }
.btn-rollback:disabled { opacity:.55; cursor:not-allowed; }

/* 오른쪽 상세 열 */
.retrain-detail-col {
  display:flex; flex-direction:column;
  min-height:0; overflow:hidden;
  width:0; opacity:0; pointer-events:none;
  transition: opacity .2s ease;
}
.retrain-detail-col.visible {
  width:auto; opacity:1; pointer-events:auto;
}

.retrain-detail-empty {
  flex:1; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:10px;
  color:#94a3b8;
}
.detail-empty-icon { font-size:32px; }
.detail-empty-txt  { font-size:12px; text-align:center; line-height:1.6; }

.retrain-detail-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px; border-bottom:1px solid #f1f5f9; flex-shrink:0;
}
.retrain-detail-meta { display:flex; align-items:center; }

.report-no-content { padding:32px; text-align:center; font-size:13px; color:#475569; }

.report-iframe {
  flex:1; width:100%; border:none; display:block; min-height:0;
}

.version-chip { background:#f3e8ff; color:#7c3aed; border-radius:99px; padding:3px 9px; font-size:10px; font-weight:700; }
.dim { color:#94a3b8; font-size:11px; }

.btn-dl-report {
  display:flex; align-items:center; gap:6px; background:#7c3aed; color:#fff;
  border:none; border-radius:7px; padding:6px 12px; font-size:11px; font-weight:700;
  cursor:pointer; font-family:inherit;
}
.btn-close-report {
  background:#eef1f7; color:#475569; border:1px solid #e2e8f2;
  border-radius:7px; padding:6px 10px; font-size:11px; font-weight:600;
  cursor:pointer; font-family:inherit;
}
.loading-txt { font-size:11px; color:#7c3aed; font-weight:600; }

.retrain-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 18px;
}
.retrain-modal {
  width: 460px;
  max-width: calc(100vw - 24px);
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 50px rgba(15,23,42,.28);
  overflow: hidden;
}
.retrain-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #eef2f7;
}
.retrain-modal-title { font-size: 14px; font-weight: 800; color: #0f172a; }
.retrain-modal-close {
  border: 1px solid #e2e8f2;
  background: #fff;
  color: #475569;
  border-radius: 7px;
  padding: 4px 9px;
  cursor: pointer;
}
.retrain-modal-body { padding: 14px 16px 4px; }
.retrain-modal-sub { font-size: 12px; color: #64748b; margin-bottom: 10px; }
.retrain-reason-list { display: flex; flex-direction: column; gap: 8px; }
.retrain-reason-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid #e2e8f2;
  border-radius: 10px;
  color: #0f172a;
  cursor: pointer;
  transition: border-color .12s, background .12s;
}
.retrain-reason-item.selected {
  border-color: #0f766e;
  background: #f0fdfa;
}
.reason-radio { display: none; }
.reason-dot {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid #cbd5e1;
  background: #fff;
  flex-shrink: 0;
}
.retrain-reason-item.selected .reason-dot {
  border-color: #0f766e;
  background: radial-gradient(circle, #0f766e 0 4px, #fff 5px);
}
.reason-texts { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.reason-title { font-size: 12px; font-weight: 700; color: #0f172a; }
.reason-desc { font-size: 11px; color: #64748b; line-height: 1.35; }
.retrain-custom-wrap { margin-top: 10px; }
.retrain-custom-label { font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; }
.retrain-custom-input {
  width: 100%;
  resize: vertical;
  min-height: 74px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  padding: 9px 10px;
  font-size: 12px;
  color: #0f172a;
  font-family: inherit;
  line-height: 1.45;
}
.retrain-custom-input:focus {
  outline: none;
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
}
.retrain-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 16px 16px;
}
.btn-modal-cancel {
  border: 1px solid #dbe4ef;
  background: #fff;
  color: #475569;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.btn-modal-confirm {
  border: 1px solid #0f766e;
  background: #0f766e;
  color: #fff;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.btn-modal-confirm:disabled,
.btn-modal-cancel:disabled { opacity: .65; cursor: not-allowed; }
.btn-modal-back {
  border: 1px solid #dbe4ef;
  background: #fff;
  color: #475569;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.btn-modal-back:disabled { opacity: .65; cursor: not-allowed; }

.retrain-perf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 12px 0;
}
.retrain-perf-item {
  background: #f8fafc;
  border: 1px solid #e2e8f2;
  border-radius: 10px;
  padding: 12px 14px;
}
.retrain-perf-item.warn {
  background: #fff5f5;
  border-color: #fca5a5;
}
.retrain-perf-lbl { font-size: 10px; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
.retrain-perf-val { font-size: 18px; font-weight: 800; }
.retrain-perf-warn { font-size: 10px; color: #dc2626; margin-top: 3px; font-weight: 600; }
.retrain-alert-box {
  background: #fff5f5;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
  margin-top: 4px;
}
.retrain-ok-box {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12px;
  color: #16a34a;
  font-weight: 600;
  margin-top: 4px;
}
</style>
