<template>
  <teleport to="body">
    <div class="upload-progress-modal">
      <div class="modal-backdrop" />
      
      <div class="modal-content">
        <!-- 标题栏 -->
        <div class="modal-header">
          <h3 class="modal-title">上传进度</h3>
          <button class="close-button" @click="$emit('close')">
            <el-icon><Close /></el-icon>
          </button>
        </div>
        
        <!-- 总体进度 -->
        <div class="overall-progress">
          <div class="progress-info">
            <span class="progress-text">
              正在上传 {{ completedCount }} / {{ totalCount }} 个文件
            </span>
            <span class="progress-percentage">
              {{ Math.round(overallProgress) }}%
            </span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: `${overallProgress}%` }"
            />
          </div>
        </div>
        
        <!-- 文件列表 -->
        <div class="file-list">
          <div
            v-for="(file, index) in files"
            :key="index"
            class="file-item"
            :class="file.status"
          >
            <div class="file-icon">
              <el-icon v-if="file.status === 'uploading'">
                <Loading class="spinning" />
              </el-icon>
              <el-icon v-else-if="file.status === 'completed'" class="success">
                <Check />
              </el-icon>
              <el-icon v-else-if="file.status === 'error'" class="error">
                <Close />
              </el-icon>
              <el-icon v-else>
                <Document />
              </el-icon>
            </div>
            
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-progress">
                <div class="progress-bar small">
                  <div 
                    class="progress-fill"
                    :style="{ width: `${file.progress}%` }"
                  />
                </div>
                <span class="progress-text">{{ file.progress }}%</span>
              </div>
            </div>
            
            <div class="file-status">
              <span v-if="file.status === 'pending'" class="status-text">等待中</span>
              <span v-else-if="file.status === 'uploading'" class="status-text">上传中</span>
              <span v-else-if="file.status === 'completed'" class="status-text success">完成</span>
              <span v-else-if="file.status === 'error'" class="status-text error">失败</span>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="modal-actions">
          <button 
            v-if="!isCompleted"
            class="cancel-button"
            @click="$emit('cancel')"
          >
            取消上传
          </button>
          <button 
            v-else
            class="done-button"
            @click="$emit('close')"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'
import {
  Close,
  Loading,
  Check,
  Document
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  progress: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['close', 'cancel'])

// 计算属性
const totalCount = computed(() => props.files.length)

const completedCount = computed(() => {
  return props.files.filter(file => file.status === 'completed').length
})

const overallProgress = computed(() => {
  if (totalCount.value === 0) return 0
  
  const totalProgress = props.files.reduce((sum, file) => sum + file.progress, 0)
  return totalProgress / totalCount.value
})

const isCompleted = computed(() => {
  return completedCount.value === totalCount.value
})
</script>

<style scoped>
.upload-progress-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: modal-appear 0.3s ease-out;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.modal-content {
  position: relative;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  background: var(--mac-bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--mac-border-primary);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--mac-text-primary);
  margin: 0;
}

.close-button {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: var(--mac-bg-secondary);
  color: var(--mac-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-out;
  
  &:hover {
    background: var(--mac-bg-tertiary);
    color: var(--mac-text-primary);
  }
}

.overall-progress {
  padding: 20px;
  border-bottom: 1px solid var(--mac-border-primary);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-text {
  font-size: 14px;
  color: var(--mac-text-primary);
}

.progress-percentage {
  font-size: 14px;
  font-weight: 600;
  color: var(--mac-accent-color);
}

.progress-bar {
  height: 8px;
  background: var(--mac-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  
  &.small {
    height: 4px;
  }
}

.progress-fill {
  height: 100%;
  background: var(--mac-accent-color);
  border-radius: 4px;
  transition: width 0.3s ease-out;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px;
  max-height: 300px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--mac-border-secondary);
  
  &:last-child {
    border-bottom: none;
  }
}

.file-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .el-icon {
    font-size: 18px;
    color: var(--mac-text-secondary);
    
    &.success {
      color: #34c759;
    }
    
    &.error {
      color: #ff3b30;
    }
    
    &.spinning {
      animation: spin 1s linear infinite;
    }
  }
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: var(--mac-text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .progress-bar {
    flex: 1;
  }
  
  .progress-text {
    font-size: 12px;
    color: var(--mac-text-secondary);
    min-width: 35px;
    text-align: right;
  }
}

.file-status {
  min-width: 60px;
  text-align: right;
}

.status-text {
  font-size: 12px;
  color: var(--mac-text-secondary);
  
  &.success {
    color: #34c759;
  }
  
  &.error {
    color: #ff3b30;
  }
}

.modal-actions {
  padding: 20px;
  border-top: 1px solid var(--mac-border-primary);
  display: flex;
  justify-content: flex-end;
}

.cancel-button,
.done-button {
  padding: 8px 16px;
  border: 1px solid var(--mac-border-primary);
  border-radius: 6px;
  background: var(--mac-bg-primary);
  color: var(--mac-text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease-out;
  
  &:hover {
    background: var(--mac-bg-secondary);
  }
}

.done-button {
  background: var(--mac-accent-color);
  color: white;
  border-color: var(--mac-accent-color);
  
  &:hover {
    background: var(--mac-accent-hover);
    border-color: var(--mac-accent-hover);
  }
}

/* 动画 */
@keyframes modal-appear {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

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
  .modal-content {
    width: 95vw;
  }
  
  .modal-header,
  .overall-progress,
  .modal-actions {
    padding: 16px;
  }
  
  .file-list {
    padding: 0 16px;
  }
}
</style>
