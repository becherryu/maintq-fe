<template>
  <Teleport to="body">
    <div v-if="open" class="backdrop" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">정비 지시서 생성</span>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>
        <div class="modal-body" v-if="report">
          <!-- 연결된 AI 리포트 정보 -->
          <div class="info-box">
            <div class="info-id">{{ report.id }}</div>
            <div class="info-type">{{ report.type }}</div>
            <div class="info-machine">{{ report.machine }} · {{ report.location }}</div>
          </div>

          <div class="row-2">
            <!-- 지시자: 로그인 유저, 수정 불가 -->
            <div class="field">
              <label>지시자</label>
              <input :value="form.issuer" disabled class="disabled-input" />
            </div>
            <!-- 작업 분류 -->
            <div class="field">
              <label>작업 분류</label>
              <select v-model="form.work_type">
                <option value="preventive">예방 정비</option>
                <option value="emergency">긴급 정비</option>
                <option value="periodic">정기 점검</option>
              </select>
            </div>
          </div>

          <div class="row-2">
            <!-- 담당자: users 테이블, 본인 제외 -->
            <div class="field">
              <label>담당자</label>
              <select v-model="form.assignee" :disabled="usersLoading">
                <option value="" disabled>{{ usersLoading ? '로딩 중...' : '선택' }}</option>
                <option v-for="u in personnel" :key="u.id" :value="u.name">
                  {{ u.name }} · {{ ROLE_LABEL[u.role] || u.role }}
                </option>
              </select>
            </div>
            <!-- 우선순위 -->
            <div class="field">
              <label>우선순위</label>
              <select v-model="form.priority">
                <option value="high">높음</option>
                <option value="medium">중간</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>

          <!-- 마감일: 오늘 기본값 -->
          <div class="field">
            <label>마감일</label>
            <input type="date" v-model="form.due" />
          </div>

          <!-- 비고 -->
          <div class="field">
            <label>비고 <span class="optional">(선택)</span></label>
            <textarea v-model="form.memo" placeholder="작업 시 유의사항을 입력하세요." rows="2" />
          </div>

          <div class="actions">
            <button class="ghost" @click="$emit('close')">취소</button>
            <button class="primary" @click="submit" :disabled="!form.assignee || !form.due">
              지시서 생성
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'

const ROLE_LABEL = {
  admin:              '공장장',
  equipment_engineer: '설비 엔지니어',
  maintenance_tech:   '정비 기술자',
  process_engineer:   '공정 엔지니어',
  production_manager: '생산 관리자',
  engineer:           '엔지니어',
  manager:            '관리자',
}

const today = new Date().toISOString().split('T')[0]

const props = defineProps({ open: Boolean, report: Object })
const emit  = defineEmits(['close', 'confirm'])

const authStore    = useAuthStore()
const personnel    = ref([])
const usersLoading = ref(false)

const form = reactive({
  issuer:    '',
  assignee:  '',
  due:       today,
  priority:  'high',
  work_type: 'preventive',
  memo:      '',
})

async function loadUsers() {
  form.issuer   = authStore.user?.name || ''
  form.due      = props.report?.generated?.split(' ')[0] || today
  form.assignee = ''
  usersLoading.value = true
  try {
    const res = await fetch('http://localhost:8003/users', { credentials: 'include' })
    if (res.ok) {
      const all = await res.json()
      personnel.value = all.filter(u => u.name !== authStore.user?.name)
      if (personnel.value.length > 0) form.assignee = personnel.value[0].name
    }
  } finally {
    usersLoading.value = false
  }
}

watch(() => props.open, (val) => { if (val) loadUsers() })

function submit() {
  if (!form.assignee || !form.due) return
  emit('confirm', { ...form })
}
</script>

<style scoped>
.backdrop { position:fixed; inset:0; background:rgba(15,23,42,.45); display:grid; place-items:center; z-index:1000; }
.modal { width:460px; max-width:calc(100vw - 40px); background:#fff; border-radius:16px; box-shadow:0 20px 50px rgba(15,23,42,.25); overflow:hidden; }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #f1f5f9; }
.modal-title { font-size:15px; font-weight:800; color:#0f172a; }
.close-btn { border:none; background:#f1f5f9; border-radius:8px; width:28px; height:28px; cursor:pointer; font-size:13px; color:#475569; }
.modal-body { padding:20px; display:flex; flex-direction:column; gap:12px; }

.info-box { background:#eef1f7; border-radius:10px; padding:12px 14px; }
.info-id      { font-size:11px; font-weight:700; color:#e8431d; margin-bottom:2px; }
.info-type    { font-size:13px; font-weight:700; color:#0f172a; margin-bottom:2px; }
.info-machine { font-size:11px; color:#94a3b8; }

.row-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

.field { display:flex; flex-direction:column; gap:5px; }
.field label { font-size:11px; font-weight:600; color:#475569; }
.optional { font-weight:400; color:#94a3b8; }

input, select, textarea {
  border:1.5px solid #e2e8f2; border-radius:8px; padding:9px 12px;
  font-size:13px; outline:none; background:#fff;
  font-family:inherit; color:#0f172a;
  transition: border-color .15s, box-shadow .15s;
}
input:focus, select:focus, textarea:focus {
  border-color:#e8431d; box-shadow:0 0 0 3px rgba(232,67,29,.10);
}
textarea { resize:none; line-height:1.5; }
.disabled-input { background:#f8fafc; color:#94a3b8; cursor:not-allowed; }

.actions { display:flex; justify-content:flex-end; gap:8px; margin-top:4px; }
.ghost   { border:none; background:#f1f5f9; border-radius:8px; padding:10px 16px; font-size:12px; cursor:pointer; color:#475569; font-family:inherit; }
.primary { border:none; background:#e8431d; color:#fff; border-radius:8px; padding:10px 18px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; }
.primary:hover:not(:disabled) { background:#c0391a; }
.primary:disabled { opacity:0.45; cursor:default; }
</style>
