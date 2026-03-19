<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none"
    :stroke="color" :stroke-width="strokeWidth"
    stroke-linecap="round" stroke-linejoin="round">
    <path v-for="(p, i) in paths" :key="i" :d="p" />
  </svg>
</template>
<script setup>
const props = defineProps({
  d: { type: [String, Array], required: true },
  size: { type: Number, default: 18 },
  color: { type: String, default: 'currentColor' },
  strokeWidth: { type: Number, default: 1.75 },
})
const paths = Array.isArray(props.d) ? props.d : [props.d]
</script>
