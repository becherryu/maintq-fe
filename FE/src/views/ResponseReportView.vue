<template>
  <div class="page">
    <!-- 좌측: 목록 -->
    <div class="list-col">
      <PanelCard :hover="false">
        <CardHeader title="대응 보고서" sub="RAG 참고 문서 목록" accent-color="#ea580c">
          <template #right><span class="badge">{{ reports.length }}건</span></template>
        </CardHeader>
        <div v-if="loading" class="state-msg">로딩 중...</div>
        <div v-else-if="!reports.length" class="state-msg">보고서가 없습니다.</div>
        <div
          v-for="(r, i) in reports"
          :key="r.mongoId"
          class="rr-item"
          :class="{ active: selected?.mongoId === r.mongoId }"
          :style="{ borderBottom: i < reports.length - 1 ? '1px solid #f1f5f9' : 'none' }"
          @click="selected = r"
        >
          <div class="rr-top">
            <span class="rr-machine">{{ r.machine }}</span>
            <span class="rr-id">{{ r.mongoId }}</span>
          </div>
          <div class="rr-comp">{{ r.failureComp }}</div>
          <div class="rr-excerpt">{{ excerpt(r.text) }}</div>
        </div>
      </PanelCard>
    </div>

    <!-- 우측: 전체 내용 -->
    <div class="detail-col">
      <div v-if="selected" class="doc-panel">
        <div class="doc-header">
          <div class="doc-header-left">
            <AppIcon :d="ICONS.fileText" :size="15" color="#dc2626" />
            <span class="doc-title">{{ selected.machine }} · {{ selected.failureComp }}</span>
          </div>
          <button class="btn-download" @click="downloadDoc(selected)">
            <AppIcon :d="ICONS.download" :size="13" color="#fff" />
            {{ shouldShowPdf(selected) ? 'PDF 다운로드' : 'HTML 다운로드' }}
          </button>
        </div>
        <div class="doc-body">
          <iframe
            v-if="shouldShowPdf(selected)"
            class="doc-pdf-frame"
            :src="getPdfUrl(selected)"
            title="reference report pdf"
          />
          <div v-else class="markdown-content" v-html="render(selected.text)" />
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { ICONS } from '../composables/useTokens.js'
import PanelCard  from '../components/PanelCard.vue'
import CardHeader from '../components/CardHeader.vue'
import AppIcon    from '../components/AppIcon.vue'

const route    = useRoute()
const reports  = ref([])
const loading  = ref(false)
const selected = ref(null)

function render(text) {
  return text ? marked.parse(text) : ''
}

function excerpt(text) {
  if (!text) return ''
  const plain = text.replace(/#{1,6}\s/g, '').replace(/[*_`]/g, '').trim()
  return plain.slice(0, 100) + (plain.length > 100 ? '…' : '')
}

function getReportNumber(mongoId) {
  const m = String(mongoId || '').match(/report_(\d+)/i)
  return m ? Number(m[1]) : NaN
}

function shouldShowPdf(r) {
  return getReportNumber(r?.mongoId) >= 168
}

function getPdfUrl(r) {
  return `http://localhost:8003/pdfs/${r.mongoId}.pdf`
}

async function fetchReports() {
  loading.value = true
  try {
    const mongoId = route.query.mongoId
    const url = mongoId
      ? `http://localhost:8003/ai/reports/${mongoId}/references`
      : `http://localhost:8003/ai/reference-reports`
    const res = await fetch(url, { credentials: 'include' })
    if (res.ok) {
      reports.value = (await res.json()).slice(0, 3)
      const selectId = route.query.selectId
      const target = selectId && reports.value.find(r => r.mongoId === selectId)
      selected.value = target || reports.value[0] || null
    }
  } finally {
    loading.value = false
  }
}

function downloadDoc(r) {
  if (shouldShowPdf(r)) {
    const a = Object.assign(document.createElement('a'), {
      href: getPdfUrl(r),
      download: `${r.mongoId}.pdf`,
      target: '_blank',
      rel: 'noopener',
    })
    a.click()
    return
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${r.machine} 대응 보고서</title>
  <style>body{font-family:sans-serif;max-width:800px;margin:40px auto;color:#0f172a;line-height:1.7}h1,h2,h3{margin-top:1.5em}ul{padding-left:1.5em}</style>
  </head><body>${render(r.text)}</body></html>`
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([html], { type: 'text/html' })),
    download: `${r.mongoId}_report.html`
  })
  a.click()
}

onMounted(fetchReports)
</script>

<style scoped>
.page { padding:22px; display:grid; grid-template-columns:340px 1fr; gap:16px; height:calc(100vh - 60px); min-height:0; box-sizing:border-box; }
.list-col   { overflow-y:auto; }
.detail-col { display:flex; flex-direction:column; min-height:0; }

.badge { font-size:11px; font-weight:700; color:#ea580c; }
.state-msg { padding:24px; text-align:center; font-size:13px; color:#94a3b8; }

.rr-item { padding:14px 20px; cursor:pointer; transition:background .15s; }
.rr-item:hover { background:#f8fafc; }
.rr-item.active { background:#ffedd5; }
.rr-top  { display:flex; justify-content:space-between; gap:8px; margin-bottom:4px; }
.rr-machine { font-size:12px; font-weight:700; color:#e8431d; }
.rr-id      { font-size:10px; color:#94a3b8; }
.rr-comp    { font-size:12px; font-weight:600; color:#0f172a; margin-bottom:4px; }
.rr-excerpt { font-size:11px; color:#64748b; line-height:1.6; }

.doc-panel  { display:flex; flex-direction:column; height:100%; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); overflow:hidden; }
.doc-header { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; background:#eef1f7; border-bottom:1px solid #f1f5f9; flex-shrink:0; }
.doc-header-left { display:flex; align-items:center; gap:8px; }
.doc-title  { font-size:12px; font-weight:700; color:#0f172a; }
.doc-body   { flex:1; overflow-y:auto; padding:28px 32px; }
.doc-pdf-frame { width:100%; height:100%; border:none; min-height:680px; }

.btn-download { display:flex; align-items:center; gap:6px; background:#e8431d; color:#fff; border:none; border-radius:7px; padding:7px 13px; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; }
.btn-download:hover { background:#c0391a; }

.markdown-content :deep(h1) { font-size:18px; font-weight:900; color:#0f172a; border-bottom:2px solid #ea580c; padding-bottom:8px; margin-bottom:16px; margin-top:0; }
.markdown-content :deep(h2) { font-size:14px; font-weight:800; color:#0f172a; border-left:3px solid #ea580c; padding-left:9px; margin-top:24px; margin-bottom:8px; }
.markdown-content :deep(h3) { font-size:13px; font-weight:700; color:#334155; margin-top:16px; margin-bottom:6px; }
.markdown-content :deep(p)  { font-size:13px; color:#334155; line-height:1.8; margin-bottom:8px; }
.markdown-content :deep(ul), .markdown-content :deep(ol) { padding-left:20px; margin-bottom:10px; }
.markdown-content :deep(li) { font-size:13px; color:#334155; line-height:1.8; margin-bottom:3px; }
.markdown-content :deep(strong) { color:#0f172a; font-weight:700; }
.markdown-content :deep(code) { background:#eef1f7; border-radius:4px; padding:1px 5px; font-size:12px; font-family:monospace; }
.markdown-content :deep(hr) { border:none; border-top:1px solid #e2e8f2; margin:18px 0; }
.markdown-content :deep(table) { width:100%; border-collapse:collapse; margin-bottom:12px; font-size:12px; }
.markdown-content :deep(th) { background:#f1f5f9; font-weight:700; padding:7px 10px; text-align:left; border:1px solid #e2e8f2; }
.markdown-content :deep(td) { padding:7px 10px; border:1px solid #e2e8f2; }

.empty-panel { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); gap:12px; }
.empty-text  { font-size:13px; color:#94a3b8; text-align:center; line-height:1.7; }
</style>
