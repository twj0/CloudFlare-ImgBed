<template>
  <div class="finder-column-view">
    <div class="column-placeholder">
      <el-icon class="placeholder-icon"><Document /></el-icon>
      <h3>分栏视图</h3>
      <p>分栏视图功能正在开发中</p>
      <p>当前显示 {{ items.length }} 个项目</p>
    </div>
  </div>
</template>

<script setup>
import { Document } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  selectedItems: {
    type: Array,
    default: () => []
  },
  currentPath: {
    type: String,
    default: '/'
  }
})

// Emits
const emit = defineEmits([
  'item-select',
  'item-double-click',
  'item-context-menu',
  'navigate'
])
</script>

<style scoped>
.finder-column-view {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--mac-bg-primary);
}

.column-placeholder {
  text-align: center;
  color: var(--mac-text-secondary);
}

.placeholder-icon {
  font-size: 64px;
  color: var(--mac-text-tertiary);
  margin-bottom: 16px;
}

.column-placeholder h3 {
  font-size: 18px;
  font-weight: 500;
  color: var(--mac-text-primary);
  margin: 0 0 8px 0;
}

.column-placeholder p {
  font-size: 14px;
  margin: 4px 0;
}
</style>
