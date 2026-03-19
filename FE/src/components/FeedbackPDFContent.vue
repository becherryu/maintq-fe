<template>
  <div>
    <div class="pdf-header-sec">
      <div class="pdf-title-row">
        <div class="pdf-icon"><span>📋</span></div>
        <div>
          <div class="pdf-eyebrow">현장 대응 보고서</div>
          <div class="pdf-title">정비 대응 결과 보고서</div>
        </div>
      </div>
      <div class="pdf-chips">
        <span v-for="t in chips" :key="t" class="pdf-chip">{{ t }}</span>
      </div>
    </div>

    <div class="pdf-section">
      <div class="pdf-sec-label red">발생 에러 / 이상 증상</div>
      <div class="error-box">
        <div class="error-type">{{ feedbackReport?.type }}</div>
        <div class="error-summary">{{ feedbackReport?.summary }}</div>
      </div>
    </div>

    <div class="kpi-row">
      <div v-for="[l,v,c] in kpis" :key="l" class="kpi-chip" :style="{ color: c }">
        <div class="kpi-lbl">{{ l }}</div>
        <div class="kpi-val">{{ v }}</div>
      </div>
    </div>

    <div class="pdf-section">
      <div class="pdf-sec-label blue">AI 권장 조치 vs 실제 대응 상세</div>
      <div v-for="(act, idx) in feedbackReport?.actionItems" :key="idx" class="action-review"
        :style="{ border: `1px solid ${answers[idx]?.correct ? '#0e9e6e44' : '#ea580c44'}` }">
        <div class="ar-hdr" :style="{ background: answers[idx]?.correct ? '#d0f5e8' : '#ffedd5' }">
          <div class="ar-num" :style="{ background: answers[idx]?.correct ? '#0e9e6e' : '#ea580c' }">{{ idx+1 }}</div>
          <div class="ar-act-wrap">
            <div class="ar-act">{{ act }}</div>
            <div class="ar-sub">AI 권장 조치</div>
          </div>
          <span class="ar-badge" :style="answers[idx]?.correct ? { color:'#0e9e6e', background:'#fff' } : { color:'#ea580c', background:'#fef3c7' }">
            {{ answers[idx]?.correct ? '✓ 일치' : '⟳ 수정됨' }}
          </span>
        </div>
        <div class="ar-body">
          <div v-if="answers[idx]?.correct">
            <div class="ar-match-lbl">실제 수행 내용 (AI 권장과 동일)</div>
            <div class="ar-match-text">{{ getActionDetail(feedbackReport?.type, idx) }}</div>
          </div>
          <div v-else>
            <div class="ar-alt-lbl">실제 적용한 대응 방안</div>
            <div class="ar-alt-box">{{ answers[idx]?.altText || '(미입력)' }}</div>
            <div v-if="answers[idx]?.detail" class="ar-alt-detail">{{ answers[idx].detail }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="photos.length > 0" class="pdf-section">
      <div class="pdf-sec-label gray">첨부 사진 ({{ photos.length }}장)</div>
      <div class="photo-grid">
        <div v-for="(ph, i) in photos" :key="i" class="photo-card">
          <img :src="ph.dataUrl" :alt="ph.label" class="photo-img" />
          <div class="photo-lbl">{{ ph.label }}</div>
        </div>
      </div>
    </div>

    <div class="pdf-footer">
      <div>
        <div class="footer-title">검토 요약</div>
        <div class="footer-sub">AI 일치율: {{ matchPct }}% · 수정 항목: {{ mismatchCount }}건 · 사진: {{ photos.length }}장</div>
      </div>
      <div class="footer-time">{{ now }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getActionDetail } from '../composables/useTokens.js'

const props = defineProps({ feedbackReport: Object, answers: Array, photos: Array })

const chips = computed(() => [
  props.feedbackReport?.id || 'N/A',
  `설비: ${props.feedbackReport?.machine}`,
  `작성일: ${new Date().toLocaleDateString('ko-KR')}`,
  '작성자: J. Kim',
])
const kpis = computed(() => {
  const mc = props.answers?.filter(a => a.correct).length || 0
  const mm = props.answers?.filter(a => a.correct === false).length || 0
  return [
    ['총 검토 항목', `${props.answers?.length || 0}건`, '#e8431d'],
    ['AI 권장과 일치', `${mc}건`, '#0e9e6e'],
    ['실제 조치로 수정', `${mm}건`, mm > 0 ? '#ea580c' : '#64748b'],
  ]
})
const matchPct     = computed(() => Math.round(((props.answers?.filter(a => a.correct).length || 0) / Math.max(props.answers?.length || 1, 1)) * 100))
const mismatchCount= computed(() => props.answers?.filter(a => a.correct === false).length || 0)
const now = new Date().toLocaleString('ko-KR')
</script>

<style scoped>
.pdf-header-sec { border-bottom:3px solid #f97316; padding-bottom:18px; margin-bottom:22px; }
.pdf-title-row  { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
.pdf-icon       { width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,#f97316,#e8431d); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
.pdf-eyebrow    { font-size:9px; color:#94a3b8; letter-spacing:.12em; text-transform:uppercase; margin-bottom:2px; }
.pdf-title      { font-size:20px; font-weight:900; color:#0f172a; }
.pdf-chips      { display:flex; gap:8px; flex-wrap:wrap; }
.pdf-chip       { font-size:10px; color:#94a3b8; background:#eef1f7; padding:3px 9px; border-radius:20px; }

.pdf-section    { margin-bottom:18px; }
.pdf-sec-label  { font-size:11px; font-weight:700; color:#475569; padding-left:8px; margin-bottom:8px; }
.pdf-sec-label.red    { border-left:3px solid #dc2626; }
.pdf-sec-label.blue   { border-left:3px solid #e8431d; }
.pdf-sec-label.gray   { border-left:3px solid #64748b; }

.error-box      { background:#fee2e2; border:1px solid #dc262633; border-radius:8px; padding:13px 15px; }
.error-type     { font-size:13px; font-weight:700; color:#dc2626; margin-bottom:6px; }
.error-summary  { font-size:12px; color:#475569; line-height:1.8; }

.kpi-row        { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:18px; }
.kpi-chip       { background:#eef1f7; border-radius:8px; padding:11px 13px; text-align:center; }
.kpi-lbl        { font-size:9px; color:#94a3b8; margin-bottom:4px; }
.kpi-val        { font-size:20px; font-weight:900; }

.action-review  { border-radius:10px; overflow:hidden; margin-bottom:12px; }
.ar-hdr         { display:flex; align-items:center; gap:10px; padding:10px 14px; border-bottom:1px solid rgba(0,0,0,.06); }
.ar-num         { width:24px; height:24px; border-radius:50%; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; flex-shrink:0; }
.ar-act-wrap    { flex:1; }
.ar-act         { font-size:12px; font-weight:700; color:#0f172a; }
.ar-sub         { font-size:10px; color:#94a3b8; margin-top:1px; }
.ar-badge       { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; border:1px solid rgba(0,0,0,.1); }
.ar-body        { padding:12px 14px; background:#fff; }
.ar-match-lbl   { font-size:10px; font-weight:700; color:#0e9e6e; margin-bottom:4px; }
.ar-match-text  { font-size:12px; color:#475569; line-height:1.7; }
.ar-alt-lbl     { font-size:10px; font-weight:700; color:#ea580c; margin-bottom:6px; }
.ar-alt-box     { background:#fef3c7; border:1px solid #d9770633; border-radius:6px; padding:10px 12px; font-size:12px; color:#0f172a; line-height:1.7; }
.ar-alt-detail  { font-size:12px; color:#475569; line-height:1.7; margin-top:8px; }

.photo-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.photo-card { border-radius:8px; overflow:hidden; }
.photo-img  { width:100%; height:100px; object-fit:cover; display:block; }
.photo-lbl  { padding:6px 8px; background:#eef1f7; font-size:10px; font-weight:600; color:#475569; }

.pdf-footer { background:#f5f3ff; border-radius:8px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; margin-top:18px; }
.footer-title { font-size:10px; font-weight:700; color:#f97316; margin-bottom:3px; }
.footer-sub   { font-size:11px; color:#475569; }
.footer-time  { font-size:11px; font-weight:700; color:#0f172a; }
</style>
