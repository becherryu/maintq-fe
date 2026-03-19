import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const AI_BASE = 'http://localhost:8003'

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${AI_BASE}${path}`, { credentials: 'include', ...options })
    const text = await res.text()
    if (!res.ok) {
      console.error(`[AI API] ${path} failed (${res.status})`, text || '(empty response)')
      return null
    }
    return text ? JSON.parse(text) : null
  } catch (error) {
    console.error(`[AI API] ${path} network/parsing error`, error)
    return null
  }
}

export const useAppStore = defineStore('app', () => {
  const machines     = ref([])
  const aiReports    = ref([])
  const predictLogs  = ref([])
  const modelTrend   = ref([])
  const modelInfo    = ref({})
  const unreadCount  = ref(0)

  const workOrders    = ref([])
  const retrainReports = ref([])

  const responseReports = ref([
    { id:'RR-1101', machine:'EQ-011', author:'이승호', created:'2026-03-06 10:24', result:'RF 매칭 네트워크 열화 확인. 임시 안정화 작업 완료.', workOrderId:'WO-4420',
      actionResults:[{correct:true,altText:'',detail:''},{correct:false,altText:'RF 매칭 박스 세라믹 커패시터 교체',detail:'드리프트 허용치 초과 확인'},{correct:true,altText:'',detail:''}] },
    { id:'RR-1102', machine:'EQ-007', author:'최현우', created:'2026-03-05 16:10', result:'단자 토크 재작업 완료. 비정상 과도 현상 더 이상 관찰되지 않음.', workOrderId:'WO-4419',
      actionResults:[{correct:true,altText:'',detail:''}] },
    { id:'RR-1103', machine:'EQ-003', author:'박태준', created:'2026-03-05 11:42', result:'베어링 하우징 점검 수행. 다음 교대 시 밸런스 교정 예정.', workOrderId:'WO-4421',
      actionResults:[{correct:true,altText:'',detail:''},{correct:false,altText:'잠정 안정화 처리 후 재측정 예정',detail:''}] },
  ])

  // toasts
  const toasts = ref([])
  function notifySuccess(title, sub) {
    const id = Date.now()
    toasts.value.push({ id, title, sub, type: 'success' })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3500)
  }
  function notifyError(title, sub) {
    const id = Date.now()
    toasts.value.push({ id, title, sub, type: 'error' })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 4500)
  }

  // 미읽음 개수 API에서 조회
  async function fetchUnreadCount() {
    const data = await apiFetch('/ai/reports/unread-count')
    if (data !== null) unreadCount.value = data.unread_count ?? 0
  }

  // 정비 지시서 API
  async function fetchWorkOrders() {
    const data = await apiFetch('/work-orders')
    if (data) workOrders.value = data
  }

  async function createWorkOrder(payload) {
    const data = await apiFetch('/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (data) workOrders.value.unshift(data)
    return data
  }

  async function updateWorkOrderStatus(id, status) {
    const order = workOrders.value.find(w => w.id === id)
    if (!order) return
    order.status = status
    await apiFetch(`/work-orders/${order.order_id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    // 대시보드 설비 상태 즉시 갱신 (정비중 반영)
    const machinesData = await apiFetch('/ml/machines')
    if (machinesData) machines.value = machinesData
  }

  // AI 서버에서 데이터 로드
  async function init() {
    const [machinesData, reportsData, logsData, trendData, infoData, ordersData, retrainData] = await Promise.all([
      apiFetch('/ml/machines'),
      apiFetch('/ai/reports'),
      apiFetch('/ml/predict-logs?days=14'),
      apiFetch('/ai/model-trend'),
      apiFetch('/ai/model-info'),
      apiFetch('/work-orders'),
      apiFetch('/ai/retrain-reports'),
    ])
    if (machinesData)  machines.value      = machinesData
    if (reportsData)   aiReports.value     = reportsData
    if (logsData)      predictLogs.value   = logsData
    if (trendData)     modelTrend.value    = trendData
    if (infoData)      modelInfo.value     = infoData
    if (ordersData)    workOrders.value    = ordersData
    if (retrainData)   retrainReports.value = retrainData
    await fetchUnreadCount()
  }

  // 알람 로그 + 리포트만 주기적으로 갱신
  async function refresh() {
    const [machinesData, reportsData, logsData] = await Promise.all([
      apiFetch('/ml/machines'),
      apiFetch('/ai/reports'),
      apiFetch('/ml/predict-logs?days=14'),
    ])
    if (machinesData) machines.value   = machinesData
    if (reportsData)  aiReports.value  = reportsData
    if (logsData)     predictLogs.value = logsData
    await fetchUnreadCount()
  }

  async function triggerManualRetrain(reason) {
    const result = await apiFetch('/ai/retrain/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (!result?.ok) {
      notifyError('수동 재학습 실패', 'AI 서버에서 재학습을 실행하지 못했습니다.')
      return null
    }

    const [trendData, infoData, retrainData] = await Promise.all([
      apiFetch('/ai/model-trend'),
      apiFetch('/ai/model-info'),
      apiFetch('/ai/retrain-reports'),
    ])

    if (trendData) modelTrend.value = trendData
    if (infoData) modelInfo.value = infoData
    if (retrainData) retrainReports.value = retrainData

    notifySuccess(
      '수동 재학습 완료',
      `${result.model_version || '새 모델'} 등록 (registry_id=${result.registry_id ?? '-'})`,
    )
    return result
  }

  // AI 리포트 읽음 처리
  async function markReportRead(reportId) {
    const numericId = parseInt(reportId.replace('AR-', ''))
    if (isNaN(numericId)) return
    const res = await apiFetch(`/ai/reports/${numericId}/read`, { method: 'POST' })
    if (!res?.ok) return
    const idx = aiReports.value.findIndex(r => r.id === reportId)
    if (idx !== -1) aiReports.value[idx].isRead = true
    await fetchUnreadCount()
  }

  // AI 리포트에서 지시서 생성
  async function createOrderFromReport(report, form) {
    const payload = {
      report_id:  parseInt(report.id.replace('AR-', '')),
      machine_id: parseInt(report.machine.replace('EQ-', '')),
      title:      report.type,
      issuer:     form.issuer,
      assignee:   form.assignee,
      due_date:   form.due,
      priority:   form.priority,
      work_type:  form.work_type,
      memo:       form.memo || null,
    }
    const newOrder = await createWorkOrder(payload)
    if (newOrder) {
      const idx = aiReports.value.findIndex(r => r.id === report.id)
      if (idx !== -1) {
        aiReports.value[idx].orderCreated = true
      }
    } else {
      notifyError('지시서 생성 실패', 'AI 서버 인증/연결 또는 DB 저장 상태를 확인하세요.')
    }
    return newOrder
  }

  const requiredOrderCount  = computed(() => workOrders.value.filter(w => w.status === 'required').length)
  const unreadAiReportCount = computed(() => aiReports.value.filter(r => !r.isRead).length)

  return {
    machines, aiReports, workOrders, responseReports, retrainReports, refresh,
    predictLogs, modelTrend, modelInfo, toasts, unreadCount,
    init, notifySuccess, notifyError, createOrderFromReport, createWorkOrder,
    updateWorkOrderStatus, fetchWorkOrders,
    triggerManualRetrain,
    markReportRead, fetchUnreadCount, requiredOrderCount, unreadAiReportCount,
  }
})
