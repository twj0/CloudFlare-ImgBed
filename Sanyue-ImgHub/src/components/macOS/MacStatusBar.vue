<template>
  <div class="mac-statusbar">
    <div class="statusbar-content">
      <!-- 左侧状态信息 -->
      <div class="status-left">
        <span v-if="itemCount > 0" class="item-count">
          {{ itemCount }} 个项目
        </span>
        <span v-if="selectedCount > 0" class="selected-count">
          已选择 {{ selectedCount }} 个
        </span>
        <span v-if="totalSize" class="total-size">
          {{ formatSize(totalSize) }}
        </span>
      </div>
      
      <!-- 中间状态信息 -->
      <div class="status-center">
        <div v-if="loading" class="loading-indicator">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>{{ loadingText }}</span>
        </div>
        <div v-else-if="status" class="status-message">
          {{ status }}
        </div>
      </div>
      
      <!-- 右侧控制信息 -->
      <div class="status-right">
        <div v-if="viewMode" class="view-mode">
          <el-icon>
            <Grid v-if="viewMode === 'grid'" />
            <List v-else-if="viewMode === 'list'" />
            <Document v-else-if="viewMode === 'column'" />
            <Picture v-else-if="viewMode === 'gallery'" />
          </el-icon>
          <span>{{ viewModeText }}</span>
        </div>
        
        <div v-if="sortInfo" class="sort-info">
          <span>按{{ sortInfo.field }}排序</span>
          <el-icon>
            <ArrowUp v-if="sortInfo.order === 'asc'" />
            <ArrowDown v-else />
          </el-icon>
        </div>
        
        <div v-if="zoomLevel" class="zoom-level">
          {{ Math.round(zoomLevel * 100) }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  Loading, 
  Grid, 
  List, 
  Document, 
  Picture, 
  ArrowUp, 
  ArrowDown 
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  itemCount: {
    type: Number,
    default: 0
  },
  selectedCount: {
    type: Number,
    default: 0
  },
  totalSize: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: '加载中...'
  },
  status: {
    type: String,
    default: ''
  },
  viewMode: {
    type: String,
    default: ''
  },
  sortInfo: {
    type: Object,
    default: null
  },
  zoomLevel: {
    type: Number,
    default: null
  }
})

// 计算属性
const viewModeText = computed(() => {
  const modes = {
    grid: '图标视图',
    list: '列表视图',
    column: '分栏视图',
    gallery: '画廊视图'
  }
  return modes[props.viewMode] || ''
})

// 方法
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return ''
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}
</script>

<style scoped>
.mac-statusbar {
  height: 22px;
  background: linear-gradient(to bottom, 
    rgba(248, 248, 248, 0.9) 0%, 
    rgba(240, 240, 240, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-size: 11px;
  color: var(--mac-text-secondary);
}

.statusbar-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-left,
.status-center,
.status-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-left {
  flex: 1;
  justify-content: flex-start;
}

.status-center {
  flex: 1;
  justify-content: center;
}

.status-right {
  flex: 1;
  justify-content: flex-end;
}

.item-count,
.selected-count,
.total-size {
  white-space: nowrap;
}

.selected-count {
  color: var(--mac-accent-color);
  font-weight: 500;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--mac-accent-color);
  
  .loading-icon {
    font-size: 12px;
    animation: spin 1s linear infinite;
  }
}

.status-message {
  color: var(--mac-text-primary);
  font-weight: 500;
}

.view-mode,
.sort-info {
  display: flex;
  align-items: center;
  gap: 4px;
  
  .el-icon {
    font-size: 12px;
  }
}

.zoom-level {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-weight: 500;
  color: var(--mac-text-primary);
}

/* 深色主题适配 */
.dark-theme .mac-statusbar {
  background: linear-gradient(to bottom, 
    rgba(35, 35, 35, 0.9) 0%, 
    rgba(30, 30, 30, 0.9) 100%);
  border-top-color: rgba(255, 255, 255, 0.1);
}

/* 动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .status-center {
    display: none;
  }
  
  .statusbar-content {
    justify-content: space-between;
  }
  
  .status-left,
  .status-right {
    flex: none;
  }
}

@media (max-width: 480px) {
  .total-size,
  .view-mode span,
  .sort-info span {
    display: none;
  }
  
  .zoom-level {
    display: none;
  }
}

/* 状态栏项目的悬停效果 */
.view-mode,
.sort-info,
.zoom-level {
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.15s ease-out;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.dark-theme {
  .view-mode:hover,
  .sort-info:hover,
  .zoom-level:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}

/* 分隔符 */
.status-left > *:not(:last-child)::after,
.status-right > *:not(:last-child)::after {
  content: '•';
  margin-left: 8px;
  color: var(--mac-text-tertiary);
}

/* 状态栏文本动画 */
.item-count,
.selected-count,
.total-size,
.status-message {
  transition: all 0.2s ease-out;
}

/* 加载状态的脉冲效果 */
.loading-indicator {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
