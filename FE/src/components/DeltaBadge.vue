<template>
  <span class="badge" :style="{ background: positive ? '#d0f5e8' : '#fee2e2', color: positive ? '#0e9e6e' : '#dc2626' }">
    {{ positive ? '▲' : '▼' }} {{ value }}
  </span>
</template>
<script setup>
defineProps({ value: [Number, String], positive: Boolean })
</script>
<style scoped>
.badge { display:inline-flex; align-items:center; gap:3px; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; }
</style>
