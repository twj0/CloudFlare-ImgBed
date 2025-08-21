<template>
  <div class="windows-file-manager">
    <WindowsExplorerLayout :initial-path="initialPath" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import WindowsExplorerLayout from '@/components/WindowsExplorerLayout.vue'

// Props
const props = defineProps({
  initialPath: {
    type: String,
    default: '/'
  }
})

// 响应式数据
const initialPath = ref(props.initialPath)
</script>

<style scoped>
.windows-file-manager {
  height: 100vh;
  overflow: hidden;
}
</style>
