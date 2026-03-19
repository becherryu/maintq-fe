<template>
  <div class="page">
    <PanelCard :hover="false">
      <CardHeader title="정비 지시서" sub="필요·진행중·완료" accent-color="#e8431d">
        <template #right>
          <div class="filter-bar">
            <button
              v-for="f in FILTERS" :key="f.key"
              class="filter-btn" :class="{ active: activeFilter === f.key }"
              @click="activeFilter = f.key"
            >
              {{ f.label }}
              <span class="filter-count">{{
                f.key === 'all' ? store.workOrders.length
                : store.workOrders.filter(w => w.status === f.key).length
              }}</span>
            </button>
          </div>
        </template>
      </CardHeader>
      <div class="table-wrap">
        <div class="table-head">
          <div>지시서 / 설비</div>
          <div>작업 분류</div>
          <div>지시자</div>
          <div>담당자</div>
          <div>우선순위</div>
          <div>마감일</div>
          <div>상태</div>
        </div>
        <div v-for="w in filtered" :key="w.id" class="table-row">
          <div class="col-title">
            <div class="wo-id">{{ w.id }}</div>
            <div class="wo-title">{{ w.title }}</div>
            <div class="wo-machine">{{ w.machine }}</div>
            <div v-if="w.memo" class="wo-memo">📝 {{ w.memo }}</div>
          </div>
          <div class="col-sm">
            <span class="work-type-chip" :class="w.work_type">{{ WORK_TYPE[w.work_type] || w.work_type }}</span>
          </div>
          <div class="col-sm"><div class="val">{{ w.issuer || '-' }}</div></div>
          <div class="col-sm"><div class="val">{{ w.assignee }}</div></div>
          <div class="col-sm"><div class="val" :style="{ color: PRIORITY_COLOR[w.priority] }">{{ PRIORITY[w.priority] }}</div></div>
          <div class="col-sm"><div class="val">{{ w.due }}</div></div>
          <div class="col-status">
            <StatusChip :status="w.status" />
            <select :value="w.status" class="status-select" @change="e => updateStatus(w.id, e.target.value)">
              <option value="required">필요</option>
              <option value="in-progress">진행중</option>
              <option value="completed">완료</option>
            </select>
          </div>
        </div>
        <div v-if="filtered.length === 0" class="empty">정비 지시서가 없습니다.</div>
      </div>
    </PanelCard>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import PanelCard  from '../components/PanelCard.vue'
import CardHeader from '../components/CardHeader.vue'
import StatusChip from '../components/StatusChip.vue'

const store = useAppStore()
const PRIORITY       = { high:'높음', medium:'중간', low:'낮음' }
const PRIORITY_COLOR = { high:'#dc2626', medium:'#d97706', low:'#64748b' }
const WORK_TYPE      = { preventive:'예방 정비', emergency:'긴급 정비', periodic:'정기 점검' }

const FILTERS = [
  { key: 'all',         label: '전체' },
  { key: 'required',    label: '필요' },
  { key: 'in-progress', label: '진행중' },
  { key: 'completed',   label: '완료' },
]
const activeFilter = ref('all')

const filtered = computed(() =>
  activeFilter.value === 'all'
    ? store.workOrders
    : store.workOrders.filter(w => w.status === activeFilter.value)
)

function updateStatus(id, status) {
  store.updateWorkOrderStatus(id, status)
}
</script>

<style scoped>
.page { padding:22px; }
.dim  { font-size:10px; color:#94a3b8; }

.filter-bar { display:flex; gap:4px; }
.filter-btn {
  display:flex; align-items:center; gap:5px;
  padding:5px 11px; border-radius:7px; border:1px solid #e2e8f2;
  background:#fff; color:#64748b; font-size:11px; font-weight:600;
  cursor:pointer; font-family:inherit; transition:all .15s;
}
.filter-btn:hover { background:#f8fafc; border-color:#cbd5e1; }
.filter-btn.active { background:#fef3ee; border-color:#e8431d; color:#e8431d; }
.filter-count { font-size:10px; font-weight:700; background:#f1f5f9; color:#64748b; padding:1px 5px; border-radius:10px; }
.filter-btn.active .filter-count { background:#fee2d5; color:#e8431d; }

.table-wrap { overflow-x:auto; }
.table-head {
  display:grid; grid-template-columns:1.6fr 110px 90px 100px 80px 110px 180px;
  gap:12px; padding:8px 20px;
  font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase;
  border-bottom:2px solid #f1f5f9;
}
.table-row {
  display:grid; grid-template-columns:1.6fr 110px 90px 100px 80px 110px 180px;
  gap:12px; align-items:center; padding:13px 20px;
  border-bottom:1px solid #f1f5f9; transition:background .15s;
}
.table-row:last-child { border-bottom:none; }
.table-row:hover { background:#fafafa; }

.col-title {}
.wo-id     { font-size:11px; font-weight:700; color:#e8431d; }
.wo-title  { font-size:12px; color:#0f172a; margin-top:2px; }
.wo-machine{ font-size:10px; color:#94a3b8; margin-top:2px; }
.wo-memo   { font-size:10px; color:#64748b; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:220px; }

.col-sm .val { font-size:12px; color:#0f172a; }

.work-type-chip {
  display:inline-block; font-size:10px; font-weight:700;
  padding:3px 8px; border-radius:99px;
}
.work-type-chip.preventive { background:#fef3ee; color:#e8431d; }
.work-type-chip.emergency  { background:#fee2e2; color:#dc2626; }
.work-type-chip.periodic   { background:#d0f5e8; color:#0e9e6e; }

.col-status { display:flex; align-items:center; gap:8px; }

.empty { padding:24px 20px; font-size:13px; color:#94a3b8; text-align:center; }
</style>
