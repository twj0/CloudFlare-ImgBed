<template>
  <teleport to="body">
    <div class="image-preview-modal" @click="$emit('close')">
      <div class="modal-backdrop" />
      
      <div class="modal-content" @click.stop>
        <!-- 关闭按钮 -->
        <button class="close-button" @click="$emit('close')">
          <el-icon><Close /></el-icon>
        </button>
        
        <!-- 图片容器 -->
        <div class="image-container">
          <img 
            :src="image.url" 
            :alt="image.name"
            class="preview-image"
            @load="handleImageLoad"
            @error="handleImageError"
          />
        </div>
        
        <!-- 图片信息 -->
        <div class="image-info">
          <h3 class="image-title">{{ image.name }}</h3>
          <div class="image-meta">
            <span v-if="image.size" class="meta-item">
              {{ formatSize(image.size) }}
            </span>
            <span v-if="image.width && image.height" class="meta-item">
              {{ image.width }} × {{ image.height }}
            </span>
            <span v-if="image.created" class="meta-item">
              {{ formatDate(image.created) }}
            </span>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button class="action-button" @click="copyLink">
            <el-icon><Link /></el-icon>
            <span>复制链接</span>
          </button>
          <button class="action-button" @click="download">
            <el-icon><Download /></el-icon>
            <span>下载</span>
          </button>
          <button class="action-button" @click="share">
            <el-icon><Share /></el-icon>
            <span>分享</span>
          </button>
        </div>
        
        <!-- 导航按钮 -->
        <button 
          v-if="hasPrevious"
          class="nav-button prev"
          @click="$emit('navigate', 'prev')"
        >
          <el-icon><ArrowLeft /></el-icon>
        </button>
        
        <button 
          v-if="hasNext"
          class="nav-button next"
          @click="$emit('navigate', 'next')"
        >
          <el-icon><ArrowRight /></el-icon>
        </button>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Close,
  Link,
  Download,
  Share,
  ArrowLeft,
  ArrowRight
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  image: {
    type: Object,
    required: true
  },
  images: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['close', 'navigate'])

// 计算属性
const currentIndex = computed(() => {
  return props.images.findIndex(img => img.path === props.image.path)
})

const hasPrevious = computed(() => {
  return currentIndex.value > 0
})

const hasNext = computed(() => {
  return currentIndex.value < props.images.length - 1
})

// 方法
const formatSize = (bytes) => {
  if (!bytes) return ''
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleImageLoad = () => {
  // 图片加载完成
}

const handleImageError = () => {
  ElMessage.error('图片加载失败')
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(props.image.url)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const download = () => {
  const link = document.createElement('a')
  link.href = props.image.url
  link.download = props.image.name
  link.click()
}

const share = () => {
  if (navigator.share) {
    navigator.share({
      title: props.image.name,
      url: props.image.url
    })
  } else {
    copyLink()
  }
}
</script>

<style scoped>
.image-preview-modal {
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
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: var(--mac-bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-out;
  
  &:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: scale(1.1);
  }
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 400px;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-info {
  padding: 20px;
  border-top: 1px solid var(--mac-border-primary);
  background: var(--mac-bg-secondary);
}

.image-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--mac-text-primary);
  margin-bottom: 8px;
}

.image-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 13px;
  color: var(--mac-text-secondary);
}

.action-buttons {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--mac-border-primary);
  background: var(--mac-bg-secondary);
}

.action-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--mac-border-primary);
  border-radius: 6px;
  background: var(--mac-bg-primary);
  color: var(--mac-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease-out;
  
  &:hover {
    background: var(--mac-accent-color);
    color: white;
    border-color: var(--mac-accent-color);
  }
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-out;
  
  &:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: translateY(-50%) scale(1.1);
  }
  
  &.prev {
    left: 20px;
  }
  
  &.next {
    right: 20px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .image-info {
    padding: 16px;
  }
  
  .action-buttons {
    padding: 12px 16px;
    flex-wrap: wrap;
  }
  
  .nav-button {
    width: 40px;
    height: 40px;
    
    &.prev {
      left: 10px;
    }
    
    &.next {
      right: 10px;
    }
  }
}
</style>
