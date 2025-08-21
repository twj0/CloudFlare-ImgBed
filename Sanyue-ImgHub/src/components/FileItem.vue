<template>
  <div
    class="file-item"
    :class="{
      'selected': selected,
      'dragging': isDragging,
      [`view-${viewMode}`]: true
    }"
    :draggable="true"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @contextmenu.prevent="handleContextMenu"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- 文件图标 -->
    <div class="file-icon">
      <el-icon :class="iconClass">
        <component :is="fileIcon" />
      </el-icon>
      <div v-if="item.type === 'image'" class="image-preview">
        <img :src="item.thumbnail" :alt="item.name" @error="handleImageError" />
      </div>
    </div>

    <!-- 文件信息 -->
    <div class="file-info">
      <div class="file-name" :title="item.name">
        {{ item.name }}
      </div>
      
      <!-- 详细视图的额外信息 -->
      <template v-if="viewMode === 'detail'">
        <div class="file-size">{{ formatSize(item.size) }}</div>
        <div class="file-type">{{ getFileType(item) }}</div>
        <div class="file-date">{{ formatDate(item.modified) }}</div>
      </template>
      
      <!-- 网格视图的简要信息 -->
      <template v-else-if="viewMode === 'grid'">
        <div class="file-meta">
          <span class="file-size">{{ formatSize(item.size) }}</span>
        </div>
      </template>
    </div>

    <!-- 选择指示器 -->
    <div v-if="selected" class="selection-indicator">
      <el-icon><Check /></el-icon>
    </div>

    <!-- 拖拽指示器 -->
    <div v-if="isDragOver && item.type === 'folder'" class="drop-indicator">
      <el-icon><Upload /></el-icon>
      <span>拖放到此文件夹</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Folder,
  FolderOpened,
  Document,
  Picture,
  VideoCamera,
  Headphones,
  Files,
  Check,
  Upload
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  viewMode: {
    type: String,
    default: 'list'
  },
  selected: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'click',
  'double-click',
  'context-menu',
  'drag-start',
  'drag-end'
])

// 响应式数据
const isDragging = ref(false)
const isDragOver = ref(false)

// 计算属性
const fileIcon = computed(() => {
  if (props.item.type === 'folder') {
    return Folder
  }
  
  const ext = props.item.name.split('.').pop()?.toLowerCase()
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return Picture
  } else if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
    return VideoCamera
  } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
    return Headphones
  } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) {
    return Document
  } else {
    return Files
  }
})

const iconClass = computed(() => {
  const ext = props.item.name.split('.').pop()?.toLowerCase()
  
  if (props.item.type === 'folder') {
    return 'folder-icon'
  } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return 'image-icon'
  } else if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
    return 'video-icon'
  } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
    return 'audio-icon'
  } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) {
    return 'document-icon'
  } else {
    return 'file-icon'
  }
})

// 事件处理
const handleClick = (event) => {
  emit('click', props.item, event)
}

const handleDoubleClick = (event) => {
  emit('double-click', props.item, event)
}

const handleContextMenu = (event) => {
  emit('context-menu', props.item, event)
}

const handleDragStart = (event) => {
  isDragging.value = true
  emit('drag-start', props.item, event)
}

const handleDragEnd = (event) => {
  isDragging.value = false
  emit('drag-end', props.item, event)
}

const handleDragOver = (event) => {
  if (props.item.type === 'folder') {
    isDragOver.value = true
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event) => {
  isDragOver.value = false
  if (props.item.type === 'folder') {
    // 处理拖放到文件夹
    const data = event.dataTransfer.getData('text/plain')
    try {
      const droppedItems = JSON.parse(data)
      // 触发拖放事件到父组件
      emit('drag-drop', {
        items: droppedItems,
        targetPath: props.item.path,
        operation: event.ctrlKey ? 'copy' : 'move'
      })
    } catch (error) {
      console.error('Failed to handle drop:', error)
    }
  }
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 工具函数
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '-'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 86400000) { // 今天
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else if (diff < 604800000) { // 一周内
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

const getFileType = (item) => {
  if (item.type === 'folder') {
    return '文件夹'
  }
  
  const ext = item.name.split('.').pop()?.toLowerCase()
  
  const typeMap = {
    // 图片
    jpg: 'JPEG 图像', jpeg: 'JPEG 图像', png: 'PNG 图像', gif: 'GIF 图像',
    bmp: 'BMP 图像', webp: 'WebP 图像', svg: 'SVG 图像',
    // 视频
    mp4: 'MP4 视频', avi: 'AVI 视频', mkv: 'MKV 视频', mov: 'MOV 视频',
    wmv: 'WMV 视频', flv: 'FLV 视频', webm: 'WebM 视频',
    // 音频
    mp3: 'MP3 音频', wav: 'WAV 音频', flac: 'FLAC 音频', aac: 'AAC 音频',
    ogg: 'OGG 音频', m4a: 'M4A 音频',
    // 文档
    pdf: 'PDF 文档', doc: 'Word 文档', docx: 'Word 文档', txt: '文本文档',
    rtf: 'RTF 文档', md: 'Markdown 文档',
    // 其他
    zip: 'ZIP 压缩包', rar: 'RAR 压缩包', '7z': '7Z 压缩包'
  }
  
  return typeMap[ext] || `${ext?.toUpperCase() || ''} 文件`
}
</script>

<style scoped>
.file-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  user-select: none;
  border: 1px solid transparent;
}

.file-item:hover {
  background-color: var(--explorer-hover, var(--el-fill-color-light));
}

.file-item.selected {
  background-color: var(--explorer-selected, var(--el-color-primary-light-8));
  border-color: var(--el-color-primary);
}

.file-item.dragging {
  opacity: 0.5;
}

/* 列表视图样式 */
.file-item.view-list {
  min-height: 32px;
}

.file-item.view-list .file-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.file-item.view-list .file-info {
  flex: 1;
  display: flex;
  align-items: center;
}

.file-item.view-list .file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 网格视图样式 */
.file-item.view-grid {
  flex-direction: column;
  padding: 12px;
  text-align: center;
  min-height: 100px;
  width: 100%;
}

.file-item.view-grid .file-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
}

.file-item.view-grid .file-name {
  font-size: 12px;
  line-height: 1.3;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.file-item.view-grid .file-meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* 详细视图样式 */
.file-item.view-detail {
  min-height: 28px;
  padding: 4px 8px;
}

.file-item.view-detail .file-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  flex-shrink: 0;
}

.file-item.view-detail .file-info {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 100px 120px 150px;
  gap: 16px;
  align-items: center;
}

.file-item.view-detail .file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-item.view-detail .file-size,
.file-item.view-detail .file-type,
.file-item.view-detail .file-date {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 文件图标 */
.file-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon .el-icon {
  font-size: inherit;
}

.folder-icon {
  color: #ffa500;
}

.image-icon {
  color: #ff6b6b;
}

.video-icon {
  color: #4ecdc4;
}

.audio-icon {
  color: #45b7d1;
}

.document-icon {
  color: #96ceb4;
}

.file-icon {
  color: var(--el-text-color-secondary);
}

/* 图片预览 */
.image-preview {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 2px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 选择指示器 */
.selection-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background-color: var(--el-color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
}

/* 拖放指示器 */
.drop-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--el-color-primary-light-8);
  border: 2px dashed var(--el-color-primary);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 500;
}

.drop-indicator .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-item.view-detail .file-info {
    grid-template-columns: 1fr 80px;
  }
  
  .file-item.view-detail .file-type,
  .file-item.view-detail .file-date {
    display: none;
  }
  
  .file-item.view-grid {
    min-height: 80px;
  }
  
  .file-item.view-grid .file-icon {
    width: 36px;
    height: 36px;
  }
}

/* 动画效果 */
.file-item {
  position: relative;
  overflow: hidden;
}

.file-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.file-item:hover::before {
  left: 100%;
}

/* 深色主题适配 */
.dark-theme .file-item::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}
</style>
