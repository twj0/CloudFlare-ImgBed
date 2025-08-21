<template>
  <div v-if="error" class="error-display" :class="errorClass">
    <div class="error-content">
      <el-icon class="error-icon">
        <component :is="errorIcon" />
      </el-icon>
      
      <div class="error-text">
        <h4 class="error-title">{{ errorTitle }}</h4>
        <p class="error-message">{{ errorMessage }}</p>
        
        <div v-if="showDetails && errorDetails" class="error-details">
          <el-collapse>
            <el-collapse-item title="详细信息" name="details">
              <pre class="error-details-content">{{ errorDetails }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
      
      <div class="error-actions">
        <el-button 
          v-if="showRetry" 
          type="primary" 
          size="small"
          @click="handleRetry"
          :loading="retrying"
        >
          重试
        </el-button>
        
        <el-button 
          v-if="showDismiss" 
          size="small"
          @click="handleDismiss"
        >
          关闭
        </el-button>
        
        <el-button 
          v-if="showRefresh" 
          size="small"
          @click="handleRefresh"
        >
          刷新页面
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  Warning, 
  CircleClose, 
  InfoFilled, 
  QuestionFilled 
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  error: {
    type: [String, Error, Object],
    default: null
  },
  type: {
    type: String,
    default: 'error', // 'error', 'warning', 'info'
    validator: (value) => ['error', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  showDetails: {
    type: Boolean,
    default: false
  },
  showRetry: {
    type: Boolean,
    default: true
  },
  showDismiss: {
    type: Boolean,
    default: true
  },
  showRefresh: {
    type: Boolean,
    default: false
  },
  retryable: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['retry', 'dismiss', 'refresh'])

// 响应式数据
const retrying = ref(false)

// 计算属性
const errorClass = computed(() => {
  return `error-display--${props.type}`
})

const errorIcon = computed(() => {
  switch (props.type) {
    case 'warning':
      return Warning
    case 'info':
      return InfoFilled
    case 'error':
    default:
      return CircleClose
  }
})

const errorTitle = computed(() => {
  if (props.title) return props.title
  
  switch (props.type) {
    case 'warning':
      return '警告'
    case 'info':
      return '提示'
    case 'error':
    default:
      return '错误'
  }
})

const errorMessage = computed(() => {
  if (!props.error) return ''
  
  if (typeof props.error === 'string') {
    return props.error
  }
  
  if (props.error instanceof Error) {
    return props.error.message || '未知错误'
  }
  
  if (typeof props.error === 'object') {
    return props.error.message || props.error.error || JSON.stringify(props.error)
  }
  
  return '未知错误'
})

const errorDetails = computed(() => {
  if (!props.error || !props.showDetails) return null
  
  if (props.error instanceof Error) {
    return props.error.stack || props.error.toString()
  }
  
  if (typeof props.error === 'object') {
    return JSON.stringify(props.error, null, 2)
  }
  
  return null
})

// 方法
const handleRetry = async () => {
  if (!props.retryable) return
  
  retrying.value = true
  
  try {
    await emit('retry')
  } finally {
    retrying.value = false
  }
}

const handleDismiss = () => {
  emit('dismiss')
}

const handleRefresh = () => {
  emit('refresh')
  window.location.reload()
}
</script>

<style scoped>
.error-display {
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  border: 1px solid;
  background-color: var(--el-color-error-light-9);
  border-color: var(--el-color-error-light-5);
  color: var(--el-color-error);
}

.error-display--warning {
  background-color: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-5);
  color: var(--el-color-warning);
}

.error-display--info {
  background-color: var(--el-color-info-light-9);
  border-color: var(--el-color-info-light-5);
  color: var(--el-color-info);
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.error-icon {
  font-size: 20px;
  margin-top: 2px;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
  min-width: 0;
}

.error-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.error-message {
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.error-details {
  margin-top: 12px;
}

.error-details-content {
  font-size: 12px;
  line-height: 1.4;
  background: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-display {
    margin: 12px 0;
    padding: 12px;
  }
  
  .error-content {
    flex-direction: column;
    gap: 8px;
  }
  
  .error-actions {
    flex-wrap: wrap;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .error-details-content {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
