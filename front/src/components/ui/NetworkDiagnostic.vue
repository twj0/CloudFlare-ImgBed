<template>
  <div class="network-diagnostic">
    <el-card class="diagnostic-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="20">
            <component :is="statusIcon" />
          </el-icon>
          <span>网络诊断</span>
        </div>
      </template>
      
      <div class="diagnostic-content">
        <!-- 网络状态 -->
        <div class="status-item">
          <span class="label">网络连接:</span>
          <el-tag :type="isOnline ? 'success' : 'danger'">
            {{ isOnline ? '在线' : '离线' }}
          </el-tag>
        </div>
        
        <!-- API状态 -->
        <div class="status-item">
          <span class="label">API状态:</span>
          <el-tag :type="apiHealthy ? 'success' : 'danger'" v-if="apiStatus">
            {{ apiStatus.message }}
          </el-tag>
          <el-tag type="info" v-else>检测中...</el-tag>
        </div>
        
        <!-- 错误信息 -->
        <div v-if="lastError" class="error-section">
          <h4>最近错误:</h4>
          <el-alert
            :title="lastError.message"
            type="error"
            :closable="false"
            show-icon
          />
        </div>
        
        <!-- 诊断建议 -->
        <div v-if="recommendations.length > 0" class="recommendations">
          <h4>建议解决方案:</h4>
          <ul>
            <li v-for="(rec, index) in recommendations" :key="index">
              {{ rec }}
            </li>
          </ul>
        </div>
        
        <!-- 操作按钮 -->
        <div class="actions">
          <el-button 
            type="primary" 
            @click="runDiagnostic"
            :loading="diagnosing"
            size="small"
          >
            重新诊断
          </el-button>
          
          <el-button 
            @click="testConnection"
            :loading="testing"
            size="small"
          >
            测试连接
          </el-button>
          
          <el-button 
            @click="retryLoad"
            :loading="retrying"
            size="small"
          >
            重试加载
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Wifi, 
  WifiOff, 
  Warning,
  CircleCheck 
} from '@element-plus/icons-vue'
import { 
  isOnline, 
  checkAPIHealth, 
  diagnoseNetworkIssue,
  networkMonitor 
} from '@/utils/networkUtils'

// Props
const props = defineProps({
  lastError: {
    type: Error,
    default: null
  },
  autoCheck: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['retry', 'diagnostic-complete'])

// 响应式数据
const isOnlineRef = ref(navigator.onLine)
const apiStatus = ref(null)
const diagnosing = ref(false)
const testing = ref(false)
const retrying = ref(false)
const recommendations = ref([])

// 计算属性
const statusIcon = computed(() => {
  if (!isOnlineRef.value) return WifiOff
  if (apiHealthy.value) return CircleCheck
  return Warning
})

const apiHealthy = computed(() => {
  return apiStatus.value?.healthy || false
})

// 方法
const runDiagnostic = async () => {
  diagnosing.value = true
  
  try {
    console.log('Running network diagnostic...')
    const diagnosis = await diagnoseNetworkIssue()
    
    console.log('Diagnostic result:', diagnosis)
    
    recommendations.value = diagnosis.recommendations || []
    
    emit('diagnostic-complete', diagnosis)
    
    if (diagnosis.issues.length === 0) {
      ElMessage.success('网络诊断完成，未发现问题')
    } else {
      ElMessage.warning(`发现 ${diagnosis.issues.length} 个问题`)
    }
    
  } catch (error) {
    console.error('Diagnostic failed:', error)
    ElMessage.error(`诊断失败: ${error.message}`)
  } finally {
    diagnosing.value = false
  }
}

const testConnection = async () => {
  testing.value = true
  
  try {
    console.log('Testing API connection...')
    const health = await checkAPIHealth()
    
    apiStatus.value = health
    
    if (health.healthy) {
      ElMessage.success('API连接测试成功')
    } else {
      ElMessage.error(`API连接测试失败: ${health.message}`)
    }
    
  } catch (error) {
    console.error('Connection test failed:', error)
    ElMessage.error(`连接测试失败: ${error.message}`)
  } finally {
    testing.value = false
  }
}

const retryLoad = async () => {
  retrying.value = true
  
  try {
    emit('retry')
    ElMessage.info('正在重试加载...')
  } finally {
    setTimeout(() => {
      retrying.value = false
    }, 2000)
  }
}

const handleNetworkChange = (status, online) => {
  isOnlineRef.value = online
  
  if (online) {
    ElMessage.success('网络连接已恢复')
    // 自动重新检测API状态
    testConnection()
  } else {
    ElMessage.warning('网络连接已断开')
    apiStatus.value = null
  }
}

// 生命周期
onMounted(() => {
  // 监听网络状态变化
  networkMonitor.addListener(handleNetworkChange)
  
  // 自动检查
  if (props.autoCheck) {
    testConnection()
  }
})

onUnmounted(() => {
  networkMonitor.removeListener(handleNetworkChange)
})

// 暴露方法
defineExpose({
  runDiagnostic,
  testConnection,
  retryLoad
})
</script>

<style scoped>
.network-diagnostic {
  margin: 16px 0;
}

.diagnostic-card {
  max-width: 500px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.diagnostic-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.error-section h4,
.recommendations h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.recommendations li {
  margin-bottom: 4px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .diagnostic-card {
    max-width: 100%;
  }
  
  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>
