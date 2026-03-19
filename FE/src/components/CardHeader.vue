<template>
  <div class="header">
    <div class="left">
      <span class="bar" :style="{ background: accentColor }" />
      <div>
        <div class="title">{{ title }}</div>
        <div v-if="sub" class="sub">{{ sub }}</div>
      </div>
    </div>
    <div v-if="$slots.right"><slot name="right" /></div>
  </div>
</template>
<script setup>
defineProps({ title: String, sub: String, accentColor: { type: String, default: '#e8431d' } })
</script>
<style scoped>
.header { padding:16px 20px 12px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; }
.left   { display:flex; align-items:center; gap:8px; }
.bar    { width:3px; height:14px; border-radius:2px; display:block; }
.title  { font-size:13px; font-weight:700; color:#0f172a; }
.sub    { font-size:10px; color:#94a3b8; margin-top:1px; }
</style>
