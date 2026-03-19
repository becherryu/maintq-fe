import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const rand = (min, max, dec = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(dec))
const ZONES = ["Bay-A","Bay-B","Bay-C","Bay-D","Bay-E","Bay-F","Bay-G"]
const TYPES = ["CVD","Etcher","Stepper","CMP","Ion Implant","Diffusion","Coater","Inspector","PECVD","ALD"]

const makeMachines = () => Array.from({ length: 35 }, (_, i) => {
  const fp = rand(3, 95, 0)
  let status = 'healthy'
  if (fp >= 82) status = 'fault'
  else if (fp >= 55) status = 'warning'
  else if (fp <= 7) status = 'offline'
  if ([4, 12, 24].includes(i)) status = 'maintenance'
  return {
    id: `EQ-${String(i+1).padStart(3,'0')}`,
    name: `${TYPES[i%TYPES.length]}-${String(i+1).padStart(2,'0')}`,
    zone: ZONES[i%ZONES.length], type: TYPES[i%TYPES.length],
    online: status !== 'offline', status, fp,
    rul: status === 'offline' ? null : rand(7, 180, 0),
    util: status === 'offline' ? 0 : rand(50, 99, 0),
    voltage: rand(216, 244), rotation: rand(1420, 1595, 0),
    pressure: rand(3.7, 5.5), vibration: rand(0.08, 1.55)
  }
})

export const useAppStore = defineStore('app', () => {
  const machines = ref(makeMachines())

  const aiReports = ref([
    { id:'AR-2401', machine:'EQ-003', generated:'2026-03-06 14:35', type:'베어링 진동 예측',
      summary:'로터 불균형 패턴이 감지되었습니다. 지난 4시간 동안 고장 확률이 급격히 증가했습니다.',
      actionItems:['베어링 하우징 이완 여부 점검','로터 동적 밸런싱 수행','마모 임계값 초과 시 커플링 인서트 교체'],
      confidence:91, status:'warning', rul:14, orderCreated:false },
    { id:'AR-2402', machine:'EQ-011', generated:'2026-03-06 14:18', type:'RF 출력 불안정',
      summary:'출력 불안정으로 매칭 네트워크 열화 및 공정 드리프트 가능성이 시사됩니다.',
      actionItems:['안테나 결합 임피던스 확인','RF 매칭 네트워크 점검','발전기 출력 안정성 측정'],
      confidence:88, status:'fault', rul:9, orderCreated:false },
    { id:'AR-2403', machine:'EQ-019', generated:'2026-03-06 13:25', type:'토출 압력 이상',
      summary:'지속적인 압력 상승은 부분 막힘 또는 밸브 응답 저하를 나타냅니다.',
      actionItems:['토출 밸브 개방 상태 점검','PRV 응답 설정값 확인','배관 스케일링 및 오염 검사'],
      confidence:78, status:'warning', rul:28, orderCreated:false },
  ])

  const workOrders = ref([
    { id:'WO-4421', machine:'EQ-003', sourceReportId:'AR-2401', title:'베어링 진동 예방 정비', priority:'high', status:'required', assignee:'박태준', due:'2026-03-08' },
    { id:'WO-4420', machine:'EQ-011', sourceReportId:'AR-2402', title:'RF 출력 불안정 수정 작업', priority:'high', status:'in-progress', assignee:'이승호', due:'2026-03-09' },
    { id:'WO-4419', machine:'EQ-007', sourceReportId:null, title:'단자 점검 및 열화상 스캔', priority:'medium', status:'completed', assignee:'최현우', due:'2026-03-05' },
  ])

  const responseReports = ref([
    { id:'RR-1101', machine:'EQ-011', author:'이승호', created:'2026-03-06 10:24', result:'RF 매칭 네트워크 열화 확인. 임시 안정화 작업 완료.', workOrderId:'WO-4420',
      actionResults:[{correct:true,altText:'',detail:''},{correct:false,altText:'RF 매칭 박스 세라믹 커패시터 교체',detail:'드리프트 허용치 초과 확인'},{correct:true,altText:'',detail:''}] },
    { id:'RR-1102', machine:'EQ-007', author:'최현우', created:'2026-03-05 16:10', result:'단자 토크 재작업 완료. 비정상 과도 현상 더 이상 관찰되지 않음.', workOrderId:'WO-4419',
      actionResults:[{correct:true,altText:'',detail:''}] },
    { id:'RR-1103', machine:'EQ-003', author:'박태준', created:'2026-03-05 11:42', result:'베어링 하우징 점검 수행. 다음 교대 시 밸런스 교정 예정.', workOrderId:'WO-4421',
      actionResults:[{correct:true,altText:'',detail:''},{correct:false,altText:'잠정 안정화 처리 후 재측정 예정',detail:''}] },
  ])

  const predictLogs = ref(Array.from({ length: 14 }, (_, i) => ({
    t: `03-${String(i+1).padStart(2,'0')}`,
    predictions: rand(180, 260, 0),
    warningCases: rand(8, 26, 0),
    faultCases: rand(2, 9, 0),
  })))

  const modelTrend = ref(Array.from({ length: 14 }, (_, i) => ({
    d: `3/${i+1}`, precision: rand(90, 97), recall: rand(87, 95), f1: rand(89, 96),
  })))

  const aiReportCount = computed(() => aiReports.value.length)
  const requiredOrderCount = computed(() => workOrders.value.filter(w => w.status === 'required').length)

  function createOrderFromReport(report, form) {
    const newOrder = {
      id: `WO-${String(4500 + workOrders.value.length + 1)}`,
      machine: report.machine,
      sourceReportId: report.id,
      title: report.type,
      priority: form.priority,
      status: 'required',
      assignee: form.assignee,
      due: form.due,
    }
    workOrders.value.unshift(newOrder)
    const r = aiReports.value.find(r => r.id === report.id)
    if (r) r.orderCreated = true
    return newOrder
  }

  function updateWorkOrderStatus(id, status) {
    const w = workOrders.value.find(w => w.id === id)
    if (w) w.status = status
  }

  return {
    machines, aiReports, workOrders, responseReports,
    predictLogs, modelTrend,
    aiReportCount, requiredOrderCount,
    createOrderFromReport, updateWorkOrderStatus,
  }
})
