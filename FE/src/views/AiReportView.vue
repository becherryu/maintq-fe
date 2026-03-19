<template>
    <div class="page">
        <div class="list-col">
            <PanelCard :hover="false">
                <CardHeader title="AI 리포트" sub="고장 예측 보고서 및 조치 트리거" accent-color="#f97316">
                    <template #right>
                        <div class="list-header-right">
                            <span class="badge-unread" v-if="unreadCount > 0">미읽음 {{ unreadCount }}</span>
                            <span class="badge-purple">{{ store.aiReports.length }}건</span>
                        </div>
                    </template>
                </CardHeader>
                <div
                    v-for="(r, i) in pagedReports"
                    :key="r.id"
                    class="report-item"
                    :class="{ active: selected?.id === r.id, read: r.isRead }"
                    :style="{ borderBottom: i < pagedReports.length - 1 ? '1px solid #f1f5f9' : 'none' }"
                    @click="selectReport(r)"
                >
                    <div class="item-top">
                        <div class="item-meta-line">
                            <span class="item-machine">{{ r.machine }}</span>
                            <span class="sep">|</span>
                            <span class="item-location">{{ r.location }}</span>
                            <span class="sep">|</span>
                            <span class="item-date">{{ r.generated.split(' ')[0] }}</span>
                        </div>
                        <span class="read-flag" :class="{ unread: !r.isRead }">{{ r.isRead ? '읽음' : '미읽음' }}</span>
                    </div>
                    <div class="item-type">{{ r.type }}</div>
                    <div class="item-summary">{{ r.summary }}</div>
                    <div class="item-bottom">
                        <span class="item-time">예측 시간 {{ r.generated }}</span>
                    </div>
                </div>
                <!-- 페이지네이션 -->
                <div v-if="totalPages > 1" class="list-pagination">
                    <button class="pg-btn" :disabled="listPage === 1" @click="listPage--">‹</button>
                    <div class="pg-nums">
                        <button v-if="visiblePages[0] > 1" class="pg-num" @click="listPage = 1">1</button>
                        <span v-if="visiblePages[0] > 2" class="pg-ellipsis">…</span>
                        <button
                            v-for="p in visiblePages"
                            :key="p"
                            class="pg-num"
                            :class="{ active: listPage === p }"
                            @click="listPage = p"
                        >
                            {{ p }}
                        </button>
                        <span v-if="visiblePages[visiblePages.length - 1] < totalPages - 1" class="pg-ellipsis">…</span>
                        <button
                            v-if="visiblePages[visiblePages.length - 1] < totalPages"
                            class="pg-num"
                            @click="listPage = totalPages"
                        >
                            {{ totalPages }}
                        </button>
                    </div>
                    <button class="pg-btn" :disabled="listPage === totalPages" @click="listPage++">›</button>
                </div>
            </PanelCard>
        </div>

        <div class="detail-col">
            <PanelCard v-if="selected" :hover="false" class="h-full detail-panel">
                <CardHeader :title="selected.type" sub="리포트 상세 및 PDF" accent-color="#f97316">
                    <template #right>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <StatusChip :status="selected.status" />
                            <button class="btn-order" @click="openModal(selected)">장비 지시서 생성</button>
                        </div>
                    </template>
                </CardHeader>
                <div
                    ref="splitRef"
                    class="split-wrap"
                    :style="{ gridTemplateColumns: `minmax(320px, 1fr) 8px ${pdfWidth}px` }"
                >
                    <div class="detail-body">
                        <div class="kpi-row">
                            <div v-for="[l, v, c] in detailKpis" :key="l" class="kpi-chip">
                                <div class="kpi-chip-lbl">{{ l }}</div>
                                <div class="kpi-chip-val" :style="{ color: c }">{{ v }}</div>
                            </div>
                        </div>
                        <div class="section">
                            <div class="sec-title yellow">진단 요약</div>
                            <div class="summary-box">{{ selected.summary }}</div>
                        </div>
                        <div class="section">
                            <div class="sec-title blue">권장 조치사항</div>
                            <div v-for="(act, idx) in selected.actionItems" :key="idx" class="action-line">
                                {{ idx + 1 }}. {{ act }}
                            </div>
                        </div>

                        <div class="section">
                            <div class="sec-title purple">참고한 대응 보고서</div>
                            <div class="ref-section in-detail">
                                <div class="ref-header">
                                    <div class="ref-title">참고 대응 보고서 목록</div>
                                    <button class="btn-view-all" @click="openResponseReportPage">전체 문서 보기</button>
                                </div>
                                <div class="ref-list">
                                    <button
                                        v-for="ref in referenceReports"
                                        :key="ref.mongoId"
                                        class="ref-item"
                                        :class="{ active: selectedReferenceId === ref.mongoId }"
                                        @click="selectedReferenceId = ref.mongoId"
                                    >
                                        <span class="ref-id">{{ ref.mongoId }}</span>
                                        <span class="ref-meta">{{ ref.failureComp }}</span>
                                        <span class="ref-meta">{{ ref.machine }}</span>
                                    </button>
                                    <div v-if="!referenceLoading && !referenceReports.length" class="ref-empty">
                                        참고 대응 보고서가 없습니다.
                                    </div>
                                    <div v-if="referenceLoading" class="ref-empty">로딩 중...</div>
                                </div>
                                <div class="ref-text-box">
                                    <span v-if="selectedReferenceText">{{ selectedReferenceText }}</span>
                                    <span v-else class="ref-placeholder">보고서를 선택하면 참고한 텍스트가 표시됩니다.</span>
                                </div>
                                <div v-if="selectedReferencePdfUrl" class="ref-download-row">
                                    <a :href="selectedReferencePdfUrl" target="_blank" class="btn-download">PDF 다운로드</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="splitter" @pointerdown="startResize" />

                    <div class="pdf-panel">
                        <div class="pdf-header">
                            <div class="pdf-header-left">
                                <div class="pdf-title">{{ selected.id }} PDF</div>
                                <div class="pdf-file">{{ currentPdfName }}</div>
                            </div>
                        </div>

                        <iframe v-if="currentPdfUrl" class="pdf-frame" :src="currentPdfUrl" title="AI report pdf" />
                        <div v-else class="pdf-empty">표시할 PDF 파일이 없습니다</div>
                    </div>
                </div>
            </PanelCard>
            <div v-else class="empty-panel">
                <AppIcon :d="ICONS.fileText" :size="32" color="#94a3b8" />
                <div class="empty-text">리포트를 선택하면<br />상세 내용이 표시됩니다</div>
            </div>
        </div>

        <OrderModal
            :open="modalOpen"
            :report="modalReport"
            @close="modalOpen = false"
            @confirm="createOrder"
        />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore.js';
import { ICONS } from '../composables/useTokens.js';
import PanelCard from '../components/PanelCard.vue';
import CardHeader from '../components/CardHeader.vue';
import AppIcon from '../components/AppIcon.vue';
import StatusChip from '../components/StatusChip.vue';
import OrderModal from '../components/OrderModal.vue';

const store = useAppStore();
const router = useRouter();

const reports = computed(() =>
    store.aiReports
        .map((report, index) => ({
            ...report,
            originalIndex: index,
        }))
        .sort((a, b) => {
            if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
            return a.originalIndex - b.originalIndex;
        })
);

const LIST_PER_PAGE = 5;
const listPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(reports.value.length / LIST_PER_PAGE)));
const pagedReports = computed(() => {
    const start = (listPage.value - 1) * LIST_PER_PAGE;
    return reports.value.slice(start, start + LIST_PER_PAGE);
});
const visiblePages = computed(() => {
    const total = totalPages.value;
    const cur = listPage.value;
    const delta = 2;
    const pages = [];
    for (let p = Math.max(1, cur - delta); p <= Math.min(total, cur + delta); p++) pages.push(p);
    return pages;
});
const unreadCount = computed(() => store.aiReports.filter((r) => !r.isRead).length);

// 데이터 갱신되면 1페이지로
watch(
    () => store.aiReports.length,
    () => {
        listPage.value = 1;
    }
);

const selectedId = ref(store.aiReports[0]?.id || null);
const modalOpen = ref(false);
const modalReport = ref(null);

// 참고 대응 보고서
const referenceReports  = ref([]);
const referenceLoading  = ref(false);
const selectedReferenceId = ref(null);

const splitRef = ref(null);
const pdfWidth = ref(460);

const selected = computed(() => reports.value.find((report) => report.id === selectedId.value) || null);

const selectedReferenceText = computed(() => {
    const target = referenceReports.value.find((r) => r.mongoId === selectedReferenceId.value);
    if (!target?.text) return '';
    const plain = target.text.replace(/#{1,6}\s/g, '').replace(/[*_`]/g, '').trim();
    return plain.slice(0, 300) + (plain.length > 300 ? '…' : '');
});

const selectedReferencePdfUrl = computed(() => {
    const target = referenceReports.value.find((r) => r.mongoId === selectedReferenceId.value);
    return target?.pdfUrl || '';
});

async function fetchReferences(mongoId) {
    if (!mongoId) { referenceReports.value = []; return; }
    referenceLoading.value = true;
    try {
        const res = await fetch(`http://localhost:8003/ai/reports/${mongoId}/references`, { credentials: 'include' });
        if (res.ok) {
            referenceReports.value = await res.json();
            selectedReferenceId.value = referenceReports.value[0]?.mongoId || null;
        }
    } catch {
        referenceReports.value = [];
    } finally {
        referenceLoading.value = false;
    }
}

const detailKpis = computed(() => {
    if (!selected.value) return [];
    const report = selected.value;
    return [
        ['대상 설비', report.machine, '#e8431d'],
        ['위치', report.location, '#64748b'],
        ['예측 시간', report.generated, '#475569'],
        ['읽음 여부', report.isRead ? '읽음' : '미읽음', report.isRead ? '#0e9e6e' : '#dc2626'],
    ];
});

const currentPdfUrl = computed(() => selected.value?.pdfUrl || '');
const currentPdfName = computed(() => {
    const url = currentPdfUrl.value;
    return url ? url.split('/').pop() : 'N/A';
});

function selectReport(report) {
    selectedId.value = report.id;
    if (!report.isRead) store.markReportRead(report.id);
}

function openModal(report) {
    modalReport.value = report;
    modalOpen.value = true;
}

async function createOrder(formData) {
    const order = await store.createOrderFromReport(modalReport.value, formData);
    if (order) {
        store.notifySuccess('지시서 생성 완료', `${order.id} / ${order.assignee}`);
        modalOpen.value = false;
    }
}

function openResponseReportPage() {
    router.push({
        path: '/response-report',
        query: { mongoId: selected.value?.mongoId, selectId: selectedReferenceId.value }
    });
}

function startResize(event) {
    event.preventDefault();
    window.addEventListener('pointermove', onResize);
    window.addEventListener('pointerup', stopResize);
}

function onResize(event) {
    if (!splitRef.value) return;
    const rect = splitRef.value.getBoundingClientRect();
    const minWidth = 320;
    const maxWidth = Math.max(360, rect.width - 320);
    const nextWidth = rect.right - event.clientX;
    pdfWidth.value = Math.min(maxWidth, Math.max(minWidth, nextWidth));
}

function stopResize() {
    window.removeEventListener('pointermove', onResize);
    window.removeEventListener('pointerup', stopResize);
}

onMounted(() => {});

watch(
    () => selected.value?.mongoId,
    (mongoId) => { fetchReferences(mongoId); },
    { immediate: true }
);

onUnmounted(() => {
    stopResize();
});
</script>

<style scoped>
.page {
    padding: 22px;
    display: grid;
    grid-template-columns: 0.82fr 1.38fr;
    gap: 16px;
    height: calc(100vh - 60px);
    min-height: 0;
    box-sizing: border-box;
}
.list-col {
    min-height: 0;
    overflow-y: auto;
}
.detail-col {
    min-height: 0;
    overflow: hidden;
}
.h-full {
    height: 100%;
}

.list-header-right {
    display: flex;
    align-items: center;
    gap: 6px;
}
.badge-unread {
    font-size: 10px;
    font-weight: 700;
    color: #dc2626;
    background: #fee2e2;
    border-radius: 20px;
    padding: 2px 8px;
}

.list-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border-top: 1px solid #f1f5f9;
}
.pg-btn {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid #e2e8f2;
    background: #fff;
    color: #475569;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.pg-btn:hover:not(:disabled) {
    background: #eef1f7;
    border-color: #c7d2e0;
}
.pg-btn:disabled {
    opacity: 0.35;
    cursor: default;
}
.pg-nums {
    display: flex;
    gap: 3px;
}
.pg-num {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid #e2e8f2;
    background: #fff;
    color: #475569;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.pg-num:hover {
    background: #eef1f7;
}
.pg-num.active {
    background: #f97316;
    color: #fff;
    border-color: #f97316;
}
.pg-ellipsis {
    font-size: 11px;
    color: #94a3b8;
    padding: 0 2px;
    line-height: 26px;
}

.badge-purple {
    font-size: 11px;
    font-weight: 700;
    color: #f97316;
}
.report-item {
    padding: 16px 20px;
    cursor: pointer;
    background: transparent;
    transition: background 0.15s;
}
.report-item:hover {
    background: #f8fafc;
}
.report-item.active {
    background: #fef3ee;
}
.report-item.read:not(.active) {
    opacity: 0.54;
}
.item-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
}
.item-meta-line {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
}
.item-machine {
    font-weight: 700;
    color: #e8431d;
}
.sep,
.item-location {
    color: #64748b;
}
.item-date {
    color: #64748b;
}
.item-type {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
}
.item-summary {
    font-size: 12px;
    color: #475569;
    line-height: 1.7;
    margin-bottom: 8px;
}
.item-time {
    font-size: 10px;
    color: #64748b;
}
.item-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}
.read-flag {
    font-size: 11px;
    font-weight: 700;
    color: #0e9e6e;
    background: #d0f5e8;
    border-radius: 20px;
    padding: 3px 9px;
}
.read-flag.unread {
    color: #dc2626;
    background: #fee2e2;
}
.btn-order {
    background: #e8431d;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 9px 14px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
}
.btn-order:hover {
    background: #c0391a;
}

.detail-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
}
.split-wrap {
    flex: 1;
    display: grid;
    min-height: 0;
}
.detail-body {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: auto;
    min-width: 0;
}
.splitter {
    cursor: col-resize;
    background: #eef1f7;
    border-left: 1px solid #e2e8f2;
    border-right: 1px solid #e2e8f2;
}

.kpi-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}
.kpi-chip {
    background: #eef1f7;
    border-radius: 8px;
    padding: 11px 13px;
}
.kpi-chip-lbl {
    font-size: 9px;
    color: #94a3b8;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
}
.kpi-chip-val {
    font-size: 13px;
    font-weight: 800;
}
.section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.sec-title {
    font-size: 11px;
    font-weight: 700;
    color: #475569;
    padding-left: 8px;
}
.sec-title.yellow {
    border-left: 3px solid #d97706;
}
.sec-title.blue {
    border-left: 3px solid #e8431d;
}
.sec-title.purple {
    border-left: 3px solid #f97316;
}
.summary-box {
    background: #fef3c7;
    border: 1px solid #d9770644;
    border-radius: 8px;
    padding: 13px 15px;
    font-size: 13px;
    color: #0f172a;
    line-height: 1.8;
}
.action-line {
    font-size: 12px;
    color: #0f172a;
    line-height: 1.7;
    background: #f8fafc;
    border-radius: 8px;
    padding: 10px 12px;
}

.pdf-panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: #fff;
}
.pdf-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid #f1f5f9;
    background: #eef1f7;
    flex-shrink: 0;
}
.pdf-header-left { display: flex; flex-direction: column; gap: 2px; }
.pdf-title {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
}
.pdf-file {
    font-size: 11px;
    color: #64748b;
}
.ref-section {
    padding: 10px 12px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #fff;
}
.ref-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}
.ref-title {
    font-size: 11px;
    font-weight: 700;
    color: #475569;
}
.btn-view-all {
    border: none;
    background: #eef1f7;
    color: #475569;
    border-radius: 7px;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
}
.btn-view-all:hover {
    background: #e2e8f2;
}
.ref-list {
    display: flex;
    gap: 6px;
    overflow: auto;
}
.ref-item {
    border: 1px solid #e2e8f2;
    background: #fff;
    border-radius: 8px;
    padding: 7px 9px;
    min-width: 130px;
    text-align: left;
    cursor: pointer;
}
.ref-item.active {
    border-color: #e8431d;
    background: #fef3ee;
}
.ref-id {
    display: block;
    font-size: 10px;
    font-weight: 700;
    color: #e8431d;
    margin-bottom: 2px;
}
.ref-meta {
    display: block;
    font-size: 10px;
    color: #64748b;
}
.ref-empty {
    font-size: 11px;
    color: #94a3b8;
    padding: 4px 2px;
}
.ref-text-box {
    background: #f8fafc;
    border: 1px solid #e2e8f2;
    border-radius: 8px;
    padding: 9px 10px;
    font-size: 12px;
    color: #334155;
    line-height: 1.65;
    min-height: 68px;
    max-height: 260px;
    overflow-y: auto;
}
.ref-pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: inherit;
    font-size: 12px;
    color: #334155;
    line-height: 1.7;
}
.ref-placeholder { color: #94a3b8; }
.ref-sim {
    display: block;
    font-size: 9px;
    color: #0e9e6e;
    margin-top: 2px;
}
.ref-download-row {
    display: flex;
    justify-content: flex-end;
}
.btn-download {
    font-size: 11px;
    font-weight: 700;
    color: #e8431d;
    background: #fef3ee;
    border: none;
    border-radius: 7px;
    padding: 5px 10px;
    text-decoration: none;
    cursor: pointer;
}
.btn-download:hover { background: #fde8df; }
.ref-section.in-detail {
    border: 1px solid #e2e8f2;
    border-radius: 10px;
}
.pdf-frame {
    width: 100%;
    height: 100%;
    min-height: 460px;
    border: none;
    background: #fff;
}
.pdf-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 12px;
}

.empty-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    gap: 12px;
}
.empty-text {
    font-size: 13px;
    color: #94a3b8;
    text-align: center;
    line-height: 1.7;
}

.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: grid;
    place-items: center;
    z-index: 1000;
}
.modal {
    width: 480px;
    max-width: calc(100vw - 40px);
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
    overflow: hidden;
}
.modal-hdr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
}
.modal-title {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
}
.modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}
.modal-info {
    background: #eef1f7;
    border-radius: 10px;
    padding: 12px 14px;
}
.modal-info-id {
    font-size: 11px;
    font-weight: 700;
    color: #e8431d;
    margin-bottom: 2px;
}
.modal-info-type {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
}
.modal-info-machine {
    font-size: 11px;
    color: #94a3b8;
}
.form-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.form-lbl {
    font-size: 11px;
    font-weight: 600;
    color: #475569;
}
.form-input {
    border: 1px solid #e2e8f2;
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 13px;
    font-family: inherit;
    color: #0f172a;
    outline: none;
}
.form-input:focus {
    border-color: #e8431d;
}
.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
}
.btn-ghost {
    border: none;
    background: #f1f5f9;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
    color: #475569;
}
.btn-primary {
    border: none;
    background: #e8431d;
    color: #fff;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
}
.btn-primary:hover {
    background: #c0391a;
}
</style>
