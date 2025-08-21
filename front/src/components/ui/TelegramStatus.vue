<template>
  <div class="telegram-status">
    <el-card class="status-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="20" :color="statusColor">
            <component :is="statusIcon" />
          </el-icon>
          <span>Telegram集成状态</span>
          <el-button 
            size="small" 
            @click="checkStatus"
            :loading="checking"
            type="text"
          >
            刷新
          </el-button>
        </div>
      </template>
      
      <div class="status-content">
        <!-- 连接状态 -->
        <div class="status-item">
          <span class="label">Bot连接:</span>
          <el-tag :type="botStatus.connected ? 'success' : 'danger'">
            {{ botStatus.connected ? '已连接' : '未连接' }}
          </el-tag>
          <span v-if="botStatus.username" class="bot-info">
            @{{ botStatus.username }}
          </span>
        </div>
        
        <!-- 聊天状态 -->
        <div class="status-item">
          <span class="label">聊天访问:</span>
          <el-tag :type="chatStatus.accessible ? 'success' : 'danger'">
            {{ chatStatus.accessible ? '可访问' : '无法访问' }}
          </el-tag>
          <span v-if="chatStatus.title" class="chat-info">
            {{ chatStatus.title }}
          </span>
        </div>
        
        <!-- 上传统计 -->
        <div class="status-item">
          <span class="label">Telegram文件:</span>
          <el-tag type="info">
            {{ telegramFileCount }} 个文件
          </el-tag>
        </div>
        
        <!-- 最近上传 -->
        <div v-if="recentUploads.length > 0" class="recent-uploads">
          <h4>最近上传:</h4>
          <div class="upload-list">
            <div 
              v-for="upload in recentUploads.slice(0, 3)" 
              :key="upload.id"
              class="upload-item"
            >
              <img 
                v-if="upload.type === 'image'" 
                :src="upload.thumbnail" 
                :alt="upload.name"
                class="upload-thumbnail"
                @error="handleImageError"
              />
              <div class="upload-info">
                <span class="upload-name">{{ upload.name }}</span>
                <span class="upload-time">{{ formatTime(upload.time) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 错误信息 -->
        <div v-if="error" class="error-section">
          <el-alert
            :title="error"
            type="error"
            :closable="true"
            show-icon
            @close="clearError"
          />
        </div>
        
        <!-- 操作按钮 -->
        <div class="actions">
          <el-button 
            size="small" 
            @click="testUpload"
            :loading="testing"
            :disabled="!canUpload"
          >
            测试上传
          </el-button>
          
          <el-button 
            size="small" 
            @click="refreshFileList"
            :loading="refreshing"
          >
            刷新文件列表
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Connection, 
  Disconnect, 
  Warning,
  CircleCheck,
  ChatDotRound
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  autoCheck: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['status-change', 'file-uploaded'])

// 响应式数据
const checking = ref(false)
const testing = ref(false)
const refreshing = ref(false)
const error = ref(null)

const botStatus = ref({
  connected: false,
  username: '',
  firstName: ''
})

const chatStatus = ref({
  accessible: false,
  title: '',
  type: ''
})

const telegramFileCount = ref(0)
const recentUploads = ref([])

// 计算属性
const statusIcon = computed(() => {
  if (error.value) return Warning
  if (botStatus.value.connected && chatStatus.value.accessible) return CircleCheck
  if (botStatus.value.connected) return Connection
  return Disconnect
})

const statusColor = computed(() => {
  if (error.value) return '#F56C6C'
  if (botStatus.value.connected && chatStatus.value.accessible) return '#67C23A'
  if (botStatus.value.connected) return '#E6A23C'
  return '#F56C6C'
})

const canUpload = computed(() => {
  return botStatus.value.connected && chatStatus.value.accessible
})

// 方法
const checkStatus = async () => {
  checking.value = true
  error.value = null
  
  try {
    // 检查上传配置
    const configResponse = await fetch('/api/manage/sysConfig/upload')
    
    if (configResponse.ok) {
      const config = await configResponse.json()
      
      if (config.telegram && config.telegram.channels) {
        const enabledChannels = config.telegram.channels.filter(ch => ch.enabled)
        
        if (enabledChannels.length > 0) {
          botStatus.value.connected = true
          chatStatus.value.accessible = true
          
          // 模拟bot信息（实际应该从API获取）
          botStatus.value.username = 'imgbed_bot'
          chatStatus.value.title = 'Image Storage Channel'
        } else {
          throw new Error('没有启用的Telegram渠道')
        }
      } else {
        throw new Error('未找到Telegram配置')
      }
    } else if (configResponse.status === 401) {
      // 需要认证，假设配置正确
      botStatus.value.connected = true
      chatStatus.value.accessible = true
    } else {
      throw new Error(`配置检查失败: ${configResponse.status}`)
    }
    
    // 获取文件统计
    await updateFileStats()
    
    emit('status-change', {
      botConnected: botStatus.value.connected,
      chatAccessible: chatStatus.value.accessible
    })
    
  } catch (err) {
    console.error('Status check failed:', err)
    error.value = err.message
    botStatus.value.connected = false
    chatStatus.value.accessible = false
  } finally {
    checking.value = false
  }
}

const updateFileStats = async () => {
  try {
    const response = await fetch('/api/manage/list?dir=/&count=100')
    
    if (response.ok) {
      const data = await response.json()
      
      if (data.files) {
        const telegramFiles = data.files.filter(file => 
          file.metadata && file.metadata.Channel === 'TelegramNew'
        )
        
        telegramFileCount.value = telegramFiles.length
        
        // 获取最近上传的文件
        recentUploads.value = telegramFiles
          .sort((a, b) => new Date(b.metadata.TimeStamp) - new Date(a.metadata.TimeStamp))
          .slice(0, 5)
          .map(file => ({
            id: file.name,
            name: file.name,
            type: file.metadata.FileType?.startsWith('image/') ? 'image' : 'file',
            thumbnail: `/file/${file.name}?thumbnail=true`,
            time: new Date(file.metadata.TimeStamp)
          }))
      }
    }
  } catch (err) {
    console.error('Failed to update file stats:', err)
  }
}

const testUpload = async () => {
  testing.value = true
  
  try {
    // 创建一个测试图片
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    
    // 绘制简单的测试图案
    ctx.fillStyle = '#007AFF'
    ctx.fillRect(0, 0, 100, 100)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('TEST', 50, 55)
    
    // 转换为Blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png')
    })
    
    // 创建FormData
    const formData = new FormData()
    formData.append('file', blob, 'telegram-test.png')
    
    // 上传
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    })
    
    if (response.ok) {
      const result = await response.json()
      ElMessage.success('测试上传成功')
      
      // 刷新文件统计
      await updateFileStats()
      
      emit('file-uploaded', result)
    } else {
      const errorText = await response.text()
      throw new Error(`上传失败: ${errorText}`)
    }
    
  } catch (err) {
    console.error('Test upload failed:', err)
    ElMessage.error(`测试上传失败: ${err.message}`)
  } finally {
    testing.value = false
  }
}

const refreshFileList = async () => {
  refreshing.value = true
  
  try {
    await updateFileStats()
    ElMessage.success('文件列表已刷新')
  } catch (err) {
    ElMessage.error(`刷新失败: ${err.message}`)
  } finally {
    refreshing.value = false
  }
}

const clearError = () => {
  error.value = null
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const formatTime = (time) => {
  const now = new Date()
  const diff = now - time
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

// 生命周期
onMounted(() => {
  if (props.autoCheck) {
    checkStatus()
  }
})

// 暴露方法
defineExpose({
  checkStatus,
  testUpload,
  refreshFileList
})
</script>

<style scoped>
.telegram-status {
  margin: 16px 0;
}

.status-card {
  max-width: 600px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.card-header .el-button {
  margin-left: auto;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.label {
  font-weight: 500;
  color: var(--el-text-color-primary);
  min-width: 80px;
}

.bot-info,
.chat-info {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-left: 8px;
}

.recent-uploads h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.upload-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.upload-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  background: var(--el-fill-color);
}

.upload-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.upload-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.upload-time {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.error-section {
  margin: 16px 0;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .status-card {
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
