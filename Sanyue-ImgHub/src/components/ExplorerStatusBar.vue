<template>
  <div class="explorer-status-bar">
    <!-- 左侧状态信息 -->
    <div class="status-left">
      <!-- 选择状态 -->
      <div v-if="selectedCount > 0" class="selection-info">
        <el-icon><Check /></el-icon>
        <span>已选择 {{ selectedCount }} 个项目</span>
        <span v-if="selectedSize > 0" class="selected-size">
          ({{ formatSize(selectedSize) }})
        </span>
      </div>
      
      <!-- 总数信息 -->
      <div v-else class="total-info">
        <el-icon><Files /></el-icon>
        <span>{{ totalCount }} 个项目</span>
        <span v-if="totalSize > 0" class="total-size">
          ({{ formatSize(totalSize) }})
        </span>
      </div>
      
      <!-- 当前路径 -->
      <div class="current-path">
        <el-icon><Location /></el-icon>
        <span>{{ currentPath }}</span>
      </div>
    </div>

    <!-- 中间区域 - 进度条 -->
    <div v-if="loading || progress.visible" class="status-center">
      <div class="progress-container">
        <el-progress
          :percentage="progress.percentage"
          :status="progress.status"
          :stroke-width="4"
          :show-text="false"
        />
        <span class="progress-text">{{ progress.text }}</span>
      </div>
    </div>

    <!-- 右侧状态信息 -->
    <div class="status-right">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-info">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      
      <!-- 最后更新时间 -->
      <div v-else-if="lastUpdated" class="update-info">
        <el-icon><Clock /></el-icon>
        <span>{{ formatLastUpdated(lastUpdated) }}</span>
      </div>
      
      <!-- 网络状态 -->
      <div class="network-status" :class="networkStatusClass">
        <el-icon>
          <component :is="networkIcon" />
        </el-icon>
        <span>{{ networkStatusText }}</span>
      </div>
      
      <!-- 视图信息 -->
      <div class="view-info">
        <el-icon><Grid /></el-icon>
        <span>{{ viewModeText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Check,
  Files,
  Location,
  Loading,
  Clock,
  Grid,
  Connection,
  WarningFilled,
  CircleCheckFilled
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  currentPath: {
    type: String,
    default: '/'
  },
  selectedCount: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: [Date, String, Number],
    default: null
  },
  selectedItems: {
    type: Array,
    default: () => []
  },
  allItems: {
    type: Array,
    default: () => []
  },
  viewMode: {
    type: String,
    default: 'list'
  }
})

// 响应式数据
const networkStatus = ref('online') // 'online', 'offline', 'slow'
const progress = ref({
  visible: false,
  percentage: 0,
  status: '',
  text: ''
})

// 计算属性
const selectedSize = computed(() => {
  return props.selectedItems.reduce((total, item) => {
    return total + (item.size || 0)
  }, 0)
})

const totalSize = computed(() => {
  return props.allItems.reduce((total, item) => {
    return total + (item.size || 0)
  }, 0)
})

const networkStatusClass = computed(() => {
  return `network-${networkStatus.value}`
})

const networkIcon = computed(() => {
  switch (networkStatus.value) {
    case 'online':
      return CircleCheckFilled
    case 'offline':
      return WarningFilled
    case 'slow':
      return Connection
    default:
      return Connection
  }
})

const networkStatusText = computed(() => {
  switch (networkStatus.value) {
    case 'online':
      return '在线'
    case 'offline':
      return '离线'
    case 'slow':
      return '网络缓慢'
    default:
      return '未知'
  }
})

const viewModeText = computed(() => {
  switch (props.viewMode) {
    case 'list':
      return '列表视图'
    case 'grid':
      return '网格视图'
    case 'detail':
      return '详细视图'
    default:
      return '未知视图'
  }
})

// 工具函数
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const formatLastUpdated = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚更新'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前更新`
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前更新`
  } else {
    return `${date.toLocaleDateString()} 更新`
  }
}

// 网络状态检测
const checkNetworkStatus = () => {
  if (!navigator.onLine) {
    networkStatus.value = 'offline'
    return
  }
  
  // 简单的网络速度检测
  const startTime = Date.now()
  fetch('/api/ping', { method: 'HEAD' })
    .then(() => {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      if (responseTime > 3000) {
        networkStatus.value = 'slow'
      } else {
        networkStatus.value = 'online'
      }
    })
    .catch(() => {
      networkStatus.value = 'offline'
    })
}

// 显示进度
const showProgress = (text, percentage = 0, status = '') => {
  progress.value = {
    visible: true,
    percentage,
    status,
    text
  }
}

// 隐藏进度
const hideProgress = () => {
  progress.value.visible = false
}

// 更新进度
const updateProgress = (percentage, text, status = '') => {
  if (progress.value.visible) {
    progress.value.percentage = percentage
    progress.value.text = text
    progress.value.status = status
  }
}

// 生命周期
onMounted(() => {
  checkNetworkStatus()
  
  // 监听网络状态变化
  window.addEventListener('online', () => {
    networkStatus.value = 'online'
  })
  
  window.addEventListener('offline', () => {
    networkStatus.value = 'offline'
  })
  
  // 定期检查网络状态
  const networkCheckInterval = setInterval(checkNetworkStatus, 30000)
  
  onUnmounted(() => {
    clearInterval(networkCheckInterval)
    window.removeEventListener('online', () => {})
    window.removeEventListener('offline', () => {})
  })
})

// 暴露方法给父组件
defineExpose({
  showProgress,
  hideProgress,
  updateProgress
})
</script>

<style scoped>
.explorer-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 16px;
  background-color: var(--explorer-toolbar-bg, var(--el-bg-color-page));
  border-top: 1px solid var(--explorer-border, var(--el-border-color));
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-height: 28px;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 300px;
}

.selection-info,
.total-info,
.current-path,
.loading-info,
.update-info,
.network-status,
.view-info {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.selection-info .el-icon {
  color: var(--el-color-primary);
}

.selected-size,
.total-size {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.current-path {
  max-width: 200px;
  overflow: hidden;
}

.current-path span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.progress-container :deep(.el-progress) {
  flex: 1;
}

.progress-text {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.network-status.network-online .el-icon {
  color: var(--el-color-success);
}

.network-status.network-offline .el-icon {
  color: var(--el-color-danger);
}

.network-status.network-slow .el-icon {
  color: var(--el-color-warning);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .explorer-status-bar {
    gap: 8px;
  }
  
  .status-left,
  .status-right {
    gap: 8px;
  }
  
  .current-path {
    display: none;
  }
}

@media (max-width: 768px) {
  .explorer-status-bar {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  .view-info,
  .network-status {
    display: none;
  }
  
  .status-center {
    max-width: 200px;
  }
  
  .selected-size,
  .total-size {
    display: none;
  }
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

/* 深色主题适配 */
.dark-theme .explorer-status-bar {
  background-color: var(--el-bg-color-darker);
  border-top-color: var(--el-border-color-darker);
}

/* 状态指示器动画 */
.selection-info,
.total-info {
  transition: all 0.3s ease;
}

.selection-info {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 进度条样式 */
:deep(.el-progress-bar__outer) {
  background-color: var(--el-fill-color-light);
  border-radius: 2px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 2px;
}

/* 工具提示 */
.network-status,
.view-info,
.update-info {
  cursor: help;
}

.network-status:hover,
.view-info:hover,
.update-info:hover {
  color: var(--el-text-color-primary);
}
</style>
