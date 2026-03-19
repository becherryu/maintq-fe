<template>
  <div class="card" :class="{ hover }"><slot /></div>
</template>
<script setup>
defineProps({ hover: { type: Boolean, default: true } })
</script>
<style scoped>
.card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); overflow:hidden; }
.card.hover { transition:box-shadow .2s, transform .2s; }
.card.hover:hover { box-shadow:0 8px 28px rgba(232,67,29,.10); transform:translateY(-1px); }
</style>
