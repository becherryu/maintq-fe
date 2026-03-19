<template>
  <div class="page">
    <!-- Tabs -->
    <div class="tabs">
      <button class="tab-card" :class="{ active: activeTab === 'todo' }" @click="activeTab = 'todo'">
        <div class="tab-icon-wrap" :style="{ background: activeTab === 'todo' ? '#fef3ee' : '#f1f5f9' }">
          <AppIcon :d="ICONS.clipboard" :size="18" :color="activeTab === 'todo' ? '#e8431d' : '#94a3b8'" />
        </div>
        <div class="tab-texts">
          <div class="tab-title">Todo</div>
          <div class="tab-sub">점검 항목 체크리스트</div>
        </div>
        <div v-if="activeTab === 'todo'" class="tab-active-bar" />
      </button>
      <button class="tab-card" :class="{ active: activeTab === 'feedback' }" @click="activeTab = 'feedback'">
        <div class="tab-icon-wrap" :style="{ background: activeTab === 'feedback' ? '#fff7ed' : '#f1f5f9' }">
          <AppIcon :d="ICONS.brain" :size="18" :color="activeTab === 'feedback' ? '#f97316' : '#94a3b8'" />
        </div>
        <div class="tab-texts">
          <div class="tab-title">Model Maintenance Check</div>
          <div class="tab-sub">AI 권장 조치 검증 및 보고서 작성</div>
        </div>
        <div v-if="activeTab === 'feedback'" class="tab-active-bar feedback-bar" />
      </button>
    </div>

    <!-- TODO Tab -->
    <div v-if="activeTab === 'todo'" class="todo-grid">
      <PanelCard :hover="false">
        <CardHeader title="Todo" sub="점검 항목 관리" accent-color="#e8431d" />
        <div class="todo-body">
          <div class="todo-input-row">
            <input v-model="newTodo" class="todo-input" placeholder="새 항목 추가..." @keydown.enter="addTodo" />
            <button class="btn-add" @click="addTodo">
              <AppIcon :d="ICONS.plus" :size="14" color="#fff" /> 추가
            </button>
          </div>
          <div class="todo-list">
            <div v-for="t in todos" :key="t.id" class="todo-item"
              :style="{ background: t.done ? '#d0f5e8' : '#eef1f7', border: `1px solid ${t.done ? '#0e9e6e44' : '#e2e8f2'}` }">
              <button class="todo-check" :style="{ border: `2px solid ${t.done ? '#0e9e6e' : '#cdd6e8'}`, background: t.done ? '#0e9e6e' : '#fff' }" @click="toggleTodo(t.id)">
                <AppIcon v-if="t.done" :d="ICONS.check" :size="11" color="#fff" :stroke-width="2.5" />
              </button>
              <span class="todo-label" :style="{ textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.6 : 1 }">{{ t.label }}</span>
              <button class="todo-del" @click="deleteTodo(t.id)">
                <AppIcon :d="ICONS.trash" :size="13" color="#dc2626" />
              </button>
            </div>
            <div v-if="todos.length === 0" class="todo-empty">항목을 추가하세요</div>
          </div>
        </div>
      </PanelCard>

      <PanelCard :hover="false">
        <CardHeader title="진행 현황" sub="체크리스트 완료율" accent-color="#0e9e6e" />
        <div class="progress-body">
          <div class="pct-num">{{ pct }}%</div>
          <div class="pct-sub">{{ doneCnt }} / {{ todos.length }}개 완료</div>
          <div class="progress-bg big"><div class="progress-fill" :style="{ width: pct + '%' }" /></div>
          <div class="memo-box">
            <div class="memo-title">기술자 메모</div>
            <div class="memo-text">체크리스트 완료 후 Model Maintenance Check 탭에서 AI 조치 검증 및 보고서를 생성하세요.</div>
          </div>
        </div>
      </PanelCard>
    </div>

    <!-- Feedback Tab -->
    <div v-if="activeTab === 'feedback'" class="feedback-grid" :class="{ 'with-pdf': submitted }">
      <div class="feedback-form-col">
        <PanelCard :hover="false">
          <CardHeader title="Model Maintenance Check" sub="AI 권장 대응방안 검증 및 현장 보고서 작성" accent-color="#f97316" />
          <div class="feedback-body">
            <!-- Submitted state -->
            <div v-if="submitted" class="submitted-state">
              <div class="submitted-icon">
                <AppIcon :d="ICONS.checkCircle" :size="28" color="#0e9e6e" />
              </div>
              <div class="submitted-title">보고서 제출 완료</div>
              <div class="submitted-sub">AI 모델 개선에 반영됩니다 · PDF가 우측에 생성되었습니다</div>
              <button class="btn-reset" @click="resetFeedback">다시 작성</button>
            </div>

            <div v-else>
              <!-- Report info -->
              <div class="report-info">
                <div class="ri-id">{{ feedbackReport?.id }}</div>
                <div class="ri-type">{{ feedbackReport?.type }}</div>
                <div class="ri-sub">대상 설비: {{ feedbackReport?.machine }} · 신뢰도 {{ feedbackReport?.confidence }}%</div>
              </div>

              <!-- Action review -->
              <div v-for="(act, idx) in feedbackReport?.actionItems" :key="idx" class="review-card">
                <div class="review-hdr">
                  <div class="review-num">{{ idx + 1 }}</div>
                  <span class="review-act">{{ act }}</span>
                </div>
                <div class="review-body">
                  <div class="btn-pair">
                    <button :class="['btn-judge', { selected: answers[idx]?.correct === true }]" @click="setAnswer(idx, 'correct', true)">✓ 일치 — 동일하게 수행했습니다</button>
                    <button :class="['btn-judge', 'alt', { selected: answers[idx]?.correct === false }]" @click="setAnswer(idx, 'correct', false)">⟳ 다름 — 실제 조치로 수정했습니다</button>
                  </div>
                  <div v-if="answers[idx]?.correct === false" class="alt-fields">
                    <div class="form-field">
                      <div class="form-lbl">실제로 적용한 대응 방안 (필수)</div>
                      <input :value="answers[idx]?.altText" @input="e => setAnswer(idx, 'altText', e.target.value)" class="form-input" placeholder="핵심 대응 방안을 한 줄로 요약해 주세요" />
                    </div>
                    <div class="form-field">
                      <div class="form-lbl">상세 설명 (선택)</div>
                      <textarea :value="answers[idx]?.detail" @input="e => setAnswer(idx, 'detail', e.target.value)" rows="2" class="form-textarea" placeholder="측정값, 교체 부품, 조치 순서 등 상세 내용을 기술해 주세요..." />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Photo upload -->
              <div class="photo-section">
                <div class="sec-title gray">현장 사진 첨부</div>
                <input ref="fileInputRef" type="file" accept="image/*" multiple style="display:none" @change="handlePhotoUpload" />
                <button class="btn-photo" @click="fileInputRef.click()">
                  <AppIcon :d="ICONS.plus" :size="14" color="#94a3b8" /> 사진 추가 (여러 장 선택 가능)
                </button>
                <div v-if="photos.length > 0" class="photo-grid">
                  <div v-for="(ph, i) in photos" :key="i" class="photo-item">
                    <img :src="ph.dataUrl" alt="" class="photo-img" />
                    <div class="photo-label-wrap">
                      <input :value="ph.label" @input="e => updatePhotoLabel(i, e.target.value)" class="photo-label-input" />
                    </div>
                    <button class="photo-del" @click="removePhoto(i)">
                      <AppIcon :d="ICONS.x" :size="10" color="#fff" />
                    </button>
                  </div>
                </div>
              </div>

              <button class="btn-submit" :disabled="!canSubmit" :style="{ background: canSubmit ? '#f97316' : '#cbd5e1' }" @click="handleSubmit">
                <AppIcon :d="ICONS.send" :size="15" color="#fff" /> 보고서 제출 및 PDF 자동 생성
              </button>
            </div>
          </div>
        </PanelCard>
      </div>

      <!-- PDF panel -->
      <div class="pdf-col">
        <div v-if="submitted" class="pdf-panel">
          <div class="pdf-header">
            <div class="pdf-header-left">
              <AppIcon :d="ICONS.fileText" :size="15" color="#dc2626" />
              <span class="pdf-header-title">현장 대응 보고서</span>
            </div>
            <button class="btn-download" @click="downloadReport">
              <AppIcon :d="ICONS.download" :size="13" color="#fff" /> 다운로드
            </button>
          </div>
          <div class="pdf-content" ref="pdfContentRef">
            <FeedbackPDFContent :feedback-report="feedbackReport" :answers="answers" :photos="photos" />
          </div>
        </div>
        <div v-else class="empty-panel">
          <AppIcon :d="ICONS.fileText" :size="32" color="#94a3b8" />
          <div class="empty-text">제출 완료 후<br>PDF가 자동 생성됩니다</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import { ICONS, getActionDetail } from '../composables/useTokens.js'
import PanelCard  from '../components/PanelCard.vue'
import CardHeader from '../components/CardHeader.vue'
import AppIcon    from '../components/AppIcon.vue'
import FeedbackPDFContent from '../components/FeedbackPDFContent.vue'
import html2pdf from 'html2pdf.js'

const store = useAppStore()

const activeTab = ref('todo')

// Todo
const todos   = ref([
  { id:1, label:'베어링 하우징 이완 여부 점검', done:false },
  { id:2, label:'로터 동적 밸런싱 수행', done:false },
  { id:3, label:'RF 매칭 네트워크 점검', done:false },
])
const newTodo = ref('')
const doneCnt = computed(() => todos.value.filter(t => t.done).length)
const pct     = computed(() => Math.round((doneCnt.value / Math.max(todos.value.length, 1)) * 100))

function addTodo() { if (!newTodo.value.trim()) return; todos.value.push({ id:Date.now(), label:newTodo.value.trim(), done:false }); newTodo.value = '' }
function toggleTodo(id) { const t = todos.value.find(t => t.id === id); if (t) t.done = !t.done }
function deleteTodo(id) { todos.value = todos.value.filter(t => t.id !== id) }

// Feedback
const feedbackReport = store.aiReports[0]
const answers = ref(feedbackReport?.actionItems.map(() => ({ correct: null, altText: '', detail: '' })) || [])
const photos  = ref([])
const submitted = ref(false)
const fileInputRef = ref(null)
const pdfContentRef = ref(null)

const canSubmit = computed(() => answers.value.every(a => a.correct !== null && (a.correct || a.altText.trim())))

function setAnswer(idx, field, val) { answers.value[idx] = { ...answers.value[idx], [field]: val } }
function handleSubmit() { if (canSubmit.value) submitted.value = true }
function resetFeedback() { submitted.value = false; answers.value = feedbackReport?.actionItems.map(() => ({ correct: null, altText: '', detail: '' })); photos.value = [] }

function handlePhotoUpload(e) {
  Array.from(e.target.files).forEach(file => {
    const r = new FileReader()
    r.onload = ev => photos.value.push({ name: file.name, dataUrl: ev.target.result, label:'현장 사진' })
    r.readAsDataURL(file)
  })
}
function removePhoto(i)          { photos.value.splice(i, 1) }
function updatePhotoLabel(i, v)  { photos.value[i].label = v }

function downloadReport() {
  const el = pdfContentRef.value
  if (!el) return
  html2pdf().set({
    margin: [10, 12],
    filename: 'feedback_report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(el).save()
}
</script>

<style scoped>
.page { padding:22px; display:flex; flex-direction:column; gap:16px; }
.tabs {
  display:flex; background:#fff; border-radius:12px;
  border:1px solid #e2e8f2; overflow:hidden;
  box-shadow:0 1px 4px rgba(0,0,0,.04);
}
.tab-card {
  display:flex; align-items:center; gap:12px; padding:16px 24px;
  flex:1; border:none; background:#fff;
  cursor:pointer; font-family:inherit; text-align:left;
  transition:all .18s; position:relative;
  border-right:1px solid #e2e8f2;
}
.tab-card:last-child { border-right:none; }
.tab-card:hover:not(.active) { background:#f8fafc; }
.tab-card.active { background:#fff; }
.tab-icon-wrap { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background .18s; }
.tab-texts { flex:1; }
.tab-title { font-size:13px; font-weight:700; color:#0f172a; margin-bottom:2px; }
.tab-card:not(.active) .tab-title { color:#94a3b8; font-weight:500; }
.tab-sub { font-size:11px; color:#94a3b8; }
.tab-card:not(.active) .tab-sub { color:#cbd5e1; }
.tab-active-bar { position:absolute; bottom:0; left:0; right:0; height:3px; background:#e8431d; }
.tab-active-bar.feedback-bar { background:#f97316; }

.todo-grid     { display:grid; grid-template-columns:420px 1fr; gap:16px; }
.todo-body     { padding:20px; }
.todo-input-row { display:flex; gap:8px; margin-bottom:16px; }
.todo-input    { flex:1; border:none; border-radius:8px; padding:9px 12px; font-size:12px; outline:none; background:#eef1f7; font-family:inherit; }
.btn-add       { background:#e8431d; color:#fff; border:none; border-radius:8px; padding:9px 14px; cursor:pointer; display:flex; align-items:center; gap:5px; font-size:12px; font-weight:700; font-family:inherit; }
.todo-list     { display:flex; flex-direction:column; gap:8px; }
.todo-item     { display:flex; align-items:center; gap:10px; border-radius:10px; padding:10px 12px; transition:all .15s; }
.todo-check    { width:20px; height:20px; border-radius:6px; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all .15s; }
.todo-label    { flex:1; font-size:12px; color:#0f172a; line-height:1.5; }
.todo-del      { border:none; background:transparent; cursor:pointer; opacity:0.4; padding:2px; }
.todo-empty    { text-align:center; padding:24px; color:#94a3b8; font-size:12px; }

.progress-body { padding:20px; }
.pct-num  { font-size:36px; font-weight:800; color:#0e9e6e; margin-bottom:8px; }
.pct-sub  { font-size:12px; color:#94a3b8; margin-bottom:16px; }
.progress-bg.big { height:10px; background:#e2e8f2; border-radius:999px; overflow:hidden; margin-bottom:20px; }
.progress-fill { height:100%; background:#0e9e6e; border-radius:999px; transition:width .4s; }
.memo-box  { background:#f1f5f9; border-radius:12px; padding:16px; }
.memo-title { font-size:11px; font-weight:700; color:#475569; margin-bottom:8px; }
.memo-text  { font-size:12px; color:#475569; line-height:1.7; }

.feedback-grid { display:grid; grid-template-columns:640px 1fr; gap:16px; }
.feedback-grid.with-pdf { grid-template-columns:1fr 460px; }
.feedback-form-col { overflow-y:auto; }
.feedback-body { padding:20px; }

.submitted-state { text-align:center; padding:30px 20px; }
.submitted-icon  { width:56px; height:56px; border-radius:50%; background:#d0f5e8; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
.submitted-title { font-size:16px; font-weight:800; color:#0f172a; margin-bottom:8px; }
.submitted-sub   { font-size:12px; color:#94a3b8; margin-bottom:20px; }
.btn-reset  { background:#eef1f7; color:#475569; border:none; border-radius:8px; padding:10px 20px; font-size:12px; cursor:pointer; font-family:inherit; }

.report-info { background:#eef1f7; border-radius:10px; padding:12px 14px; margin-bottom:18px; }
.ri-id   { font-size:11px; font-weight:700; color:#e8431d; margin-bottom:2px; }
.ri-type { font-size:13px; font-weight:700; color:#0f172a; margin-bottom:2px; }
.ri-sub  { font-size:11px; color:#94a3b8; }

.review-card { border:1px solid #e2e8f2; border-radius:10px; overflow:hidden; margin-bottom:14px; }
.review-hdr  { display:flex; align-items:center; gap:10px; padding:10px 14px; background:#eef1f7; border-bottom:1px solid #f1f5f9; }
.review-num  { width:24px; height:24px; border-radius:50%; background:#f97316; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; flex-shrink:0; }
.review-act  { font-size:13px; font-weight:700; color:#0f172a; }
.review-body { padding:14px; }
.btn-pair    { display:flex; gap:8px; margin-bottom:0; }
.btn-judge   { flex:1; padding:9px; border-radius:8px; border:2px solid #e2e8f2; background:#fff; color:#475569; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit; }
.btn-judge.selected { border-color:#0e9e6e; background:#d0f5e8; color:#0e9e6e; }
.btn-judge.alt.selected { border-color:#ea580c; background:#fff7ed; color:#ea580c; }
.alt-fields  { margin-top:12px; display:flex; flex-direction:column; gap:8px; }
.form-field  { display:flex; flex-direction:column; gap:5px; }
.form-lbl    { font-size:10px; color:#94a3b8; }
.form-input  { border:none; border-radius:8px; padding:9px 12px; font-size:12px; outline:none; background:#eef1f7; font-family:inherit; }
.form-textarea { border:none; border-radius:8px; padding:9px 12px; font-size:12px; outline:none; background:#eef1f7; font-family:inherit; resize:vertical; }

.photo-section { margin:18px 0; }
.sec-title.gray { font-size:11px; font-weight:700; color:#475569; padding-left:8px; border-left:3px solid #64748b; margin-bottom:10px; }
.btn-photo   { display:flex; align-items:center; gap:7px; background:#eef1f7; border:1px dashed #cdd6e8; border-radius:9px; padding:10px 16px; font-size:12px; color:#475569; cursor:pointer; width:100%; justify-content:center; font-family:inherit; margin-bottom:10px; }
.photo-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.photo-item  { border-radius:8px; overflow:hidden; position:relative; }
.photo-img   { width:100%; height:80px; object-fit:cover; display:block; }
.photo-label-wrap { padding:5px 7px; background:#eef1f7; }
.photo-label-input { width:100%; border:none; background:transparent; font-size:10px; color:#475569; outline:none; font-family:inherit; }
.photo-del   { position:absolute; top:4px; right:4px; width:20px; height:20px; border-radius:50%; background:rgba(0,0,0,.5); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; }

.btn-submit  { width:100%; color:#fff; border:none; border-radius:9px; padding:13px; font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:background .2s; font-family:inherit; margin-top:18px; }

.pdf-col { display:flex; flex-direction:column; min-height:400px; }
.pdf-panel { display:flex; flex-direction:column; height:100%; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); overflow:hidden; }
.pdf-header { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; background:#eef1f7; border-bottom:1px solid #f1f5f9; }
.pdf-header-left { display:flex; align-items:center; gap:8px; }
.pdf-header-title { font-size:12px; font-weight:700; color:#0f172a; }
.pdf-content { flex:1; overflow-y:auto; padding:24px 28px; }
.btn-download { display:flex; align-items:center; gap:6px; background:#e8431d; color:#fff; border:none; border-radius:7px; padding:7px 13px; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; }

.empty-panel { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); gap:12px; min-height:300px; }
.empty-text  { font-size:13px; color:#94a3b8; text-align:center; line-height:1.7; }
</style>
