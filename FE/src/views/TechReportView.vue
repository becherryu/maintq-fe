<template>
  <div class="page">
    <!-- 좌측: 보고서 목록 -->
    <div class="list-col">
      <PanelCard :hover="false">
        <CardHeader title="대응 보고서" sub="팀원 제출 보고서 현황" accent-color="#e8431d">
          <template #right>
            <div class="filter-wrap">
              <select v-model="filterStatus" class="filter-select">
                <option value="">전체</option>
                <option value="submitted">제출 완료</option>
                <option value="approved">승인 완료</option>
                <option value="draft">초안</option>
              </select>
            </div>
          </template>
        </CardHeader>
        <div v-if="!filtered.length" class="empty-list">보고서가 없습니다.</div>
        <div
          v-for="(r, i) in filtered"
          :key="r.id"
          class="report-item"
          :class="{ active: selected?.id === r.id }"
          :style="{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }"
          @click="selected = r"
        >
          <div class="item-top">
            <span class="item-id">{{ r.id }}</span>
            <span class="item-date">{{ r.createdAt }}</span>
          </div>
          <div class="item-wo">지시서: {{ r.workOrderId }} · {{ r.machine }}</div>
          <div class="item-title">{{ r.title }}</div>
          <div class="item-meta">
            <span class="item-author">{{ r.author }}</span>
            <span class="status-chip" :class="r.status">{{ STATUS_LABEL[r.status] }}</span>
          </div>
        </div>
      </PanelCard>
    </div>

    <!-- 우측: 상세 보기 (읽기 전용) -->
    <div class="detail-col">
      <div v-if="selected" class="detail-panel">
        <div class="detail-header">
          <div>
            <div class="detail-id">{{ selected.id }} · {{ selected.workOrderId }}</div>
            <div class="detail-title">{{ selected.title }}</div>
          </div>
          <span class="status-chip lg" :class="selected.status">{{ STATUS_LABEL[selected.status] }}</span>
        </div>
        <div class="detail-body">
          <div class="meta-row">
            <div class="meta-item"><span class="meta-lbl">작성자</span><span class="meta-val">{{ selected.author }}</span></div>
            <div class="meta-item"><span class="meta-lbl">대상 설비</span><span class="meta-val">{{ selected.machine }}</span></div>
            <div class="meta-item"><span class="meta-lbl">작업 완료일</span><span class="meta-val">{{ selected.completedAt }}</span></div>
            <div class="meta-item"><span class="meta-lbl">작성일</span><span class="meta-val">{{ selected.createdAt }}</span></div>
          </div>

          <div class="sec-title">조치 항목 결과</div>
          <div v-for="(item, idx) in selected.actionResults" :key="idx" class="action-row">
            <span class="action-num">{{ idx + 1 }}</span>
            <span class="action-title">{{ item.title }}</span>
            <span class="action-badge" :class="{ done: item.done }">{{ item.done ? '완료' : '미완료' }}</span>
            <span v-if="!item.done && item.note" class="action-note">{{ item.note }}</span>
          </div>

          <div class="sec-title">종합 대응 결과</div>
          <div class="result-box">{{ selected.result }}</div>
        </div>
      </div>
      <div v-else class="empty-panel">
        <AppIcon :d="ICONS.fileText" :size="32" color="#94a3b8" />
        <div class="empty-text">보고서를 선택하면<br />내용이 표시됩니다</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ICONS } from '../composables/useTokens.js'
import PanelCard  from '../components/PanelCard.vue'
import CardHeader from '../components/CardHeader.vue'
import AppIcon    from '../components/AppIcon.vue'

const STATUS_LABEL = { draft: '초안', submitted: '제출 완료', approved: '승인 완료' }

const filterStatus = ref('')

const reports = ref([
  {
    id: 'TR-001', workOrderId: 'WO-4401', machine: 'EQ-003', title: '베어링 교체 및 윤활 보충',
    author: '박태준', createdAt: '2026-03-08', completedAt: '2026-03-08', status: 'approved',
    result: '베어링 하우징 분해 후 마모 확인. 신품 베어링으로 교체하고 윤활유 보충 완료. 이후 진동 수치 정상 범위 복귀.',
    actionResults: [
      { title: '베어링 상태 육안 점검', done: true, note: '' },
      { title: '베어링 교체', done: true, note: '' },
      { title: '윤활유 보충', done: true, note: '' },
    ],
  },
  {
    id: 'TR-002', workOrderId: 'WO-4402', machine: 'EQ-011', title: 'RF 매칭 네트워크 점검',
    author: '이승호', createdAt: '2026-03-09', completedAt: '2026-03-09', status: 'submitted',
    result: 'RF 매칭 박스 세라믹 커패시터 열화 확인. 임시 안정화 처리 완료. 부품 입고 후 추가 교체 예정.',
    actionResults: [
      { title: 'RF 출력 안정성 측정', done: true, note: '' },
      { title: '세라믹 커패시터 교체', done: false, note: '부품 미입고. 다음 주 교체 예정.' },
      { title: '임시 안정화 처리', done: true, note: '' },
    ],
  },
  {
    id: 'TR-003', workOrderId: 'WO-4398', machine: 'EQ-007', title: '냉각 팬 모터 점검 및 필터 교체',
    author: '김민수', createdAt: '2026-03-07', completedAt: '2026-03-07', status: 'approved',
    result: '냉각 팬 필터 막힘 확인 및 교체 완료. 모터 전류값 정상 범위 확인. 이상 없음.',
    actionResults: [
      { title: '팬 필터 오염 확인', done: true, note: '' },
      { title: '필터 교체', done: true, note: '' },
      { title: '모터 전류 측정', done: true, note: '' },
    ],
  },
])

const filtered = computed(() =>
  filterStatus.value ? reports.value.filter(r => r.status === filterStatus.value) : reports.value
)

const selected = ref(reports.value[0])
</script>

<style scoped>
.page { padding:22px; display:grid; grid-template-columns:340px 1fr; gap:16px; height:calc(100vh - 60px); min-height:0; box-sizing:border-box; }
.list-col  { overflow-y:auto; }
.detail-col { display:flex; flex-direction:column; min-height:0; }

.filter-wrap { display:flex; align-items:center; }
.filter-select { border:1px solid #e2e8f2; border-radius:7px; padding:4px 8px; font-size:11px; font-family:inherit; color:#475569; outline:none; background:#fff; cursor:pointer; }

.report-item { padding:14px 20px; cursor:pointer; transition:background .15s; }
.report-item:hover { background:#f8fafc; }
.report-item.active { background:#fef3ee; }
.item-top  { display:flex; justify-content:space-between; margin-bottom:3px; }
.item-id   { font-size:11px; font-weight:700; color:#e8431d; }
.item-date { font-size:10px; color:#94a3b8; }
.item-wo   { font-size:10px; color:#94a3b8; margin-bottom:3px; }
.item-title { font-size:12px; font-weight:600; color:#0f172a; margin-bottom:6px; }
.item-meta { display:flex; justify-content:space-between; align-items:center; }
.item-author { font-size:11px; color:#64748b; }
.empty-list { padding:24px; text-align:center; font-size:13px; color:#94a3b8; }

.status-chip { font-size:10px; font-weight:700; padding:2px 8px; border-radius:99px; }
.status-chip.lg { font-size:11px; padding:4px 10px; }
.status-chip.draft     { background:#f1f5f9; color:#64748b; }
.status-chip.submitted { background:#fef3ee; color:#e8431d; }
.status-chip.approved  { background:#d0f5e8; color:#0e9e6e; }

.detail-panel { display:flex; flex-direction:column; height:100%; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); overflow:hidden; }
.detail-header { display:flex; justify-content:space-between; align-items:flex-start; padding:16px 20px; border-bottom:1px solid #f1f5f9; background:#eef1f7; flex-shrink:0; }
.detail-id    { font-size:11px; font-weight:700; color:#e8431d; margin-bottom:3px; }
.detail-title { font-size:15px; font-weight:800; color:#0f172a; }
.detail-body  { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:16px; }

.meta-row { display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; background:#f8fafc; border-radius:10px; padding:14px 16px; }
.meta-item { display:flex; flex-direction:column; gap:3px; }
.meta-lbl  { font-size:10px; color:#94a3b8; font-weight:600; }
.meta-val  { font-size:13px; font-weight:700; color:#0f172a; }

.sec-title { font-size:11px; font-weight:700; color:#475569; border-left:3px solid #e8431d; padding-left:8px; }
.action-row { display:flex; align-items:center; gap:8px; padding:9px 12px; background:#f8fafc; border-radius:8px; flex-wrap:wrap; }
.action-num   { font-size:11px; font-weight:700; color:#e8431d; min-width:16px; }
.action-title { flex:1; font-size:12px; color:#0f172a; }
.action-badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:99px; }
.action-badge.done     { background:#d0f5e8; color:#0e9e6e; }
.action-badge:not(.done) { background:#fee2e2; color:#dc2626; }
.action-note  { width:100%; font-size:11px; color:#64748b; padding-left:24px; }
.result-box { background:#fef3ee; border:1px solid #e8431d33; border-radius:8px; padding:13px 15px; font-size:13px; color:#0f172a; line-height:1.8; }

.empty-panel { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); gap:12px; }
.empty-text  { font-size:13px; color:#94a3b8; text-align:center; line-height:1.7; }
</style>
