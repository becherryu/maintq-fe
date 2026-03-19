<template>
  <div class="card" :class="{ hover: hover }" :style="accentStyle">
    <slot />
  </div>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ hover: { type: Boolean, default: true }, accent: String })
const accentStyle = computed(() => props.accent ? { borderTop: `3px solid ${props.accent}` } : {})
</script>
<style scoped>
.card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); overflow:hidden; transition:box-shadow .2s, transform .2s; }
.card.hover:hover { box-shadow:0 8px 28px rgba(232,67,29,.10), 0 2px 8px rgba(0,0,0,.05); transform:translateY(-1px); }
</style>
