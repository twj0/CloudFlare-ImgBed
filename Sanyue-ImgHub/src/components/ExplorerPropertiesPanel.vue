<template>
  <div class="explorer-properties-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-title">
        <el-icon><InfoFilled /></el-icon>
        <span>属性</span>
      </div>
      <el-button
        type="text"
        :icon="Close"
        size="small"
        @click="$emit('close')"
      />
    </div>

    <!-- 面板内容 -->
    <div class="panel-content">
      <el-scrollbar>
        <!-- 单个文件/文件夹属性 -->
        <div v-if="selectedItems.length === 1" class="single-item-properties">
          <div class="item-preview">
            <!-- 文件图标或缩略图 -->
            <div class="preview-icon">
              <el-icon v-if="!isImage(selectedItem)" :class="getIconClass(selectedItem)">
                <component :is="getFileIcon(selectedItem)" />
              </el-icon>
              <img
                v-else
                :src="selectedItem.thumbnail || selectedItem.url"
                :alt="selectedItem.name"
                @error="handleImageError"
              />
            </div>
            
            <!-- 文件名 -->
            <div class="item-name" :title="selectedItem.name">
              {{ selectedItem.name }}
            </div>
          </div>

          <!-- 基本信息 -->
          <div class="property-section">
            <div class="section-title">基本信息</div>
            <div class="property-list">
              <div class="property-item">
                <span class="property-label">类型:</span>
                <span class="property-value">{{ getFileType(selectedItem) }}</span>
              </div>
              <div class="property-item">
                <span class="property-label">大小:</span>
                <span class="property-value">{{ formatSize(selectedItem.size) }}</span>
              </div>
              <div class="property-item">
                <span class="property-label">位置:</span>
                <span class="property-value" :title="selectedItem.path">
                  {{ getParentPath(selectedItem.path) }}
                </span>
              </div>
              <div class="property-item">
                <span class="property-label">创建时间:</span>
                <span class="property-value">{{ formatDate(selectedItem.created) }}</span>
              </div>
              <div class="property-item">
                <span class="property-label">修改时间:</span>
                <span class="property-value">{{ formatDate(selectedItem.modified) }}</span>
              </div>
              <div class="property-item">
                <span class="property-label">访问时间:</span>
                <span class="property-value">{{ formatDate(selectedItem.accessed) }}</span>
              </div>
            </div>
          </div>

          <!-- 图片特有属性 -->
          <div v-if="isImage(selectedItem)" class="property-section">
            <div class="section-title">图片信息</div>
            <div class="property-list">
              <div class="property-item">
                <span class="property-label">尺寸:</span>
                <span class="property-value">
                  {{ selectedItem.width }}×{{ selectedItem.height }}
                </span>
              </div>
              <div class="property-item">
                <span class="property-label">格式:</span>
                <span class="property-value">{{ getImageFormat(selectedItem) }}</span>
              </div>
              <div v-if="selectedItem.exif" class="property-item">
                <span class="property-label">相机:</span>
                <span class="property-value">{{ selectedItem.exif.camera }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="property-section">
            <div class="section-title">操作</div>
            <div class="action-buttons">
              <el-button size="small" @click="handleRename">
                <el-icon><Edit /></el-icon>
                重命名
              </el-button>
              <el-button size="small" @click="handleCopy">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
              <el-button size="small" @click="handleMove">
                <el-icon><Scissors /></el-icon>
                移动
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 多个文件属性 -->
        <div v-else class="multiple-items-properties">
          <div class="selection-summary">
            <el-icon class="summary-icon"><Files /></el-icon>
            <div class="summary-text">
              <div class="summary-count">已选择 {{ selectedItems.length }} 个项目</div>
              <div class="summary-size">总大小: {{ formatSize(totalSize) }}</div>
            </div>
          </div>

          <!-- 文件类型统计 -->
          <div class="property-section">
            <div class="section-title">类型统计</div>
            <div class="type-stats">
              <div
                v-for="(count, type) in typeStats"
                :key="type"
                class="type-stat-item"
              >
                <span class="type-name">{{ type }}:</span>
                <span class="type-count">{{ count }} 个</span>
              </div>
            </div>
          </div>

          <!-- 批量操作 -->
          <div class="property-section">
            <div class="section-title">批量操作</div>
            <div class="action-buttons">
              <el-button size="small" @click="handleBatchCopy">
                <el-icon><CopyDocument /></el-icon>
                批量复制
              </el-button>
              <el-button size="small" @click="handleBatchMove">
                <el-icon><Scissors /></el-icon>
                批量移动
              </el-button>
              <el-button size="small" type="danger" @click="handleBatchDelete">
                <el-icon><Delete /></el-icon>
                批量删除
              </el-button>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  InfoFilled,
  Close,
  Edit,
  CopyDocument,
  Scissors,
  Delete,
  Files,
  Folder,
  Document,
  Picture,
  VideoCamera,
  Headphones
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  selectedItems: {
    type: Array,
    required: true
  }
})

// Emits
const emit = defineEmits([
  'close',
  'item-action'
])

// 计算属性
const selectedItem = computed(() => {
  return props.selectedItems[0] || null
})

const totalSize = computed(() => {
  return props.selectedItems.reduce((total, item) => {
    return total + (item.size || 0)
  }, 0)
})

const typeStats = computed(() => {
  const stats = {}
  props.selectedItems.forEach(item => {
    const type = getFileType(item)
    stats[type] = (stats[type] || 0) + 1
  })
  return stats
})

// 工具函数
const isImage = (item) => {
  if (!item || item.type === 'folder') return false
  const ext = item.name.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)
}

const getFileIcon = (item) => {
  if (item.type === 'folder') {
    return Folder
  }
  
  const ext = item.name.split('.').pop()?.toLowerCase()
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return Picture
  } else if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
    return VideoCamera
  } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
    return Headphones
  } else {
    return Document
  }
}

const getIconClass = (item) => {
  if (item.type === 'folder') {
    return 'folder-icon'
  }
  
  const ext = item.name.split('.').pop()?.toLowerCase()
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return 'image-icon'
  } else if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
    return 'video-icon'
  } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
    return 'audio-icon'
  } else {
    return 'document-icon'
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
    rtf: 'RTF 文档', md: 'Markdown 文档'
  }
  
  return typeMap[ext] || `${ext?.toUpperCase() || ''} 文件`
}

const getImageFormat = (item) => {
  const ext = item.name.split('.').pop()?.toUpperCase()
  return ext || '未知格式'
}

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

const formatDate = (timestamp) => {
  if (!timestamp) return '未知'
  
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

const getParentPath = (path) => {
  const parts = path.split('/')
  parts.pop() // 移除文件名
  return parts.join('/') || '/'
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 操作处理函数
const handleRename = () => {
  emit('item-action', 'rename', selectedItem.value)
}

const handleCopy = () => {
  emit('item-action', 'copy', selectedItem.value)
}

const handleMove = () => {
  emit('item-action', 'move', selectedItem.value)
}

const handleDelete = () => {
  emit('item-action', 'delete', selectedItem.value)
}

const handleBatchCopy = () => {
  emit('item-action', 'batch-copy', props.selectedItems)
}

const handleBatchMove = () => {
  emit('item-action', 'batch-move', props.selectedItems)
}

const handleBatchDelete = () => {
  emit('item-action', 'batch-delete', props.selectedItems)
}
</script>

<style scoped>
.explorer-properties-panel {
  width: 300px;
  background-color: var(--explorer-sidebar-bg, var(--el-bg-color-page));
  border-left: 1px solid var(--explorer-border, var(--el-border-color));
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-fill-color-extra-light);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.panel-content {
  flex: 1;
  overflow: hidden;
}

.single-item-properties,
.multiple-items-properties {
  padding: 16px;
}

.item-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background-color: var(--el-fill-color-extra-light);
  border-radius: 8px;
}

.preview-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-icon .el-icon {
  font-size: 48px;
}

.preview-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-name {
  font-weight: 500;
  text-align: center;
  word-break: break-word;
  line-height: 1.4;
}

.property-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.property-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.property-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.4;
}

.property-label {
  color: var(--el-text-color-secondary);
  min-width: 80px;
  flex-shrink: 0;
}

.property-value {
  color: var(--el-text-color-primary);
  text-align: right;
  word-break: break-word;
  flex: 1;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons .el-button {
  justify-content: flex-start;
}

.selection-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: var(--el-fill-color-extra-light);
  border-radius: 8px;
  margin-bottom: 24px;
}

.summary-icon {
  font-size: 32px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.summary-text {
  flex: 1;
}

.summary-count {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.summary-size {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.type-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.type-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.type-name {
  color: var(--el-text-color-secondary);
}

.type-count {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

/* 图标颜色 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .explorer-properties-panel {
    width: 100%;
    height: 300px;
    border-left: none;
    border-top: 1px solid var(--explorer-border, var(--el-border-color));
  }
  
  .property-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .property-label {
    min-width: auto;
  }
  
  .property-value {
    text-align: left;
  }
}

/* 深色主题适配 */
.dark-theme .item-preview,
.dark-theme .selection-summary {
  background-color: var(--el-fill-color-darker);
}

/* 滚动条样式 */
:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

/* 动画效果 */
.property-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
