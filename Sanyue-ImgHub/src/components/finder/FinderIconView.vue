<template>
  <div class="finder-icon-view" :style="{ '--zoom-level': zoomLevel }">
    <div
      v-for="item in items"
      :key="item.path"
      class="icon-item"
      :class="{ 
        'selected': isSelected(item),
        'image': item.type === 'image',
        'folder': item.type === 'folder'
      }"
      @click="handleItemClick(item, $event)"
      @dblclick="handleItemDoubleClick(item)"
      @contextmenu.prevent="handleItemContextMenu(item, $event)"
    >
      <!-- 图标容器 -->
      <div class="icon-container">
        <!-- 文件夹图标 -->
        <div v-if="item.type === 'folder'" class="folder-icon">
          <el-icon><Folder /></el-icon>
        </div>
        
        <!-- 图片缩略图 -->
        <div v-else-if="item.type === 'image'" class="image-thumbnail">
          <img 
            :src="item.thumbnail || item.url" 
            :alt="item.name"
            @error="handleImageError"
            @load="handleImageLoad"
          />
          <div class="image-overlay">
            <el-icon><Picture /></el-icon>
          </div>
        </div>
        
        <!-- 其他文件图标 -->
        <div v-else class="file-icon">
          <el-icon><Document /></el-icon>
        </div>
        
        <!-- 选择指示器 -->
        <div v-if="isSelected(item)" class="selection-indicator">
          <el-icon><Check /></el-icon>
        </div>
      </div>
      
      <!-- 文件名 -->
      <div class="item-name">
        <span :title="item.name">{{ item.name }}</span>
      </div>
      
      <!-- 文件信息 -->
      <div v-if="item.type === 'image'" class="item-info">
        <span v-if="item.width && item.height" class="dimensions">
          {{ item.width }}×{{ item.height }}
        </span>
        <span v-if="item.size" class="file-size">
          {{ formatSize(item.size) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Folder,
  Picture,
  Document,
  Check
} from '@element-plus/icons-vue'

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
  zoomLevel: {
    type: Number,
    default: 1.0
  }
})

// Emits
const emit = defineEmits([
  'item-select',
  'item-double-click',
  'item-context-menu'
])

// 方法
const isSelected = (item) => {
  return props.selectedItems.some(selected => selected.path === item.path)
}

const handleItemClick = (item, event) => {
  let newSelection = []
  
  if (event.ctrlKey || event.metaKey) {
    // Ctrl/Cmd + 点击：切换选择
    if (isSelected(item)) {
      newSelection = props.selectedItems.filter(selected => selected.path !== item.path)
    } else {
      newSelection = [...props.selectedItems, item]
    }
  } else if (event.shiftKey && props.selectedItems.length > 0) {
    // Shift + 点击：范围选择
    const lastSelected = props.selectedItems[props.selectedItems.length - 1]
    const startIndex = props.items.findIndex(i => i.path === lastSelected.path)
    const endIndex = props.items.findIndex(i => i.path === item.path)
    
    if (startIndex !== -1 && endIndex !== -1) {
      const start = Math.min(startIndex, endIndex)
      const end = Math.max(startIndex, endIndex)
      newSelection = props.items.slice(start, end + 1)
    } else {
      newSelection = [item]
    }
  } else {
    // 普通点击：单选
    newSelection = [item]
  }
  
  emit('item-select', newSelection)
}

const handleItemDoubleClick = (item) => {
  emit('item-double-click', item)
}

const handleItemContextMenu = (item, event) => {
  if (!isSelected(item)) {
    emit('item-select', [item])
  }
  emit('item-context-menu', event, item)
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const handleImageLoad = (event) => {
  event.target.style.opacity = '1'
}

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
</script>

<style scoped>
.finder-icon-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(80px * var(--zoom-level)), 1fr));
  gap: calc(16px * var(--zoom-level));
  padding: 16px;
  overflow-y: auto;
  height: 100%;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-out;
  user-select: none;
  position: relative;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  &.selected {
    background: rgba(0, 122, 255, 0.1);
    
    .icon-container {
      transform: scale(0.95);
    }
  }
}

.icon-container {
  position: relative;
  width: calc(64px * var(--zoom-level));
  height: calc(64px * var(--zoom-level));
  margin-bottom: 8px;
  transition: transform 0.2s ease-out;
}

.folder-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .el-icon {
    font-size: calc(48px * var(--zoom-level));
    color: #007aff;
  }
}

.image-thumbnail {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  background: var(--mac-bg-secondary);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.3s ease-out;
  }
  
  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--mac-bg-secondary);
    
    .el-icon {
      font-size: calc(24px * var(--zoom-level));
      color: var(--mac-text-tertiary);
    }
  }
  
  img + .image-overlay {
    display: none;
  }
}

.file-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .el-icon {
    font-size: calc(48px * var(--zoom-level));
    color: var(--mac-text-secondary);
  }
}

.selection-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: var(--mac-accent-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  .el-icon {
    font-size: 12px;
    color: white;
  }
}

.item-name {
  text-align: center;
  font-size: calc(12px * var(--zoom-level));
  color: var(--mac-text-primary);
  line-height: 1.3;
  max-width: 100%;
  
  span {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
  }
}

.item-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
  font-size: calc(10px * var(--zoom-level));
  color: var(--mac-text-secondary);
  
  .dimensions,
  .file-size {
    line-height: 1;
  }
}

/* 深色主题适配 */
.dark-theme .icon-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* 拖拽状态 */
.icon-item.dragging {
  opacity: 0.7;
  transform: rotate(5deg) scale(0.95);
  z-index: 100;
}

.icon-item.drag-over {
  background: rgba(0, 122, 255, 0.2);
  border: 2px dashed var(--mac-accent-color);
}

/* 动画效果 */
.icon-item {
  animation: item-appear 0.3s ease-out;
}

@keyframes item-appear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .finder-icon-view {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 12px;
    padding: 12px;
  }
  
  .icon-container {
    width: 48px;
    height: 48px;
  }
  
  .folder-icon .el-icon,
  .file-icon .el-icon {
    font-size: 36px;
  }
  
  .item-name {
    font-size: 11px;
  }
  
  .item-info {
    font-size: 9px;
  }
}

/* 缩放级别适配 */
@media (max-width: 480px) {
  .finder-icon-view {
    --zoom-level: 0.8;
  }
}

/* 高缩放级别时的网格调整 */
.finder-icon-view[style*="--zoom-level: 1.5"],
.finder-icon-view[style*="--zoom-level: 2"] {
  grid-template-columns: repeat(auto-fill, minmax(calc(120px * var(--zoom-level)), 1fr));
}

.finder-icon-view[style*="--zoom-level: 0.5"],
.finder-icon-view[style*="--zoom-level: 0.75"] {
  grid-template-columns: repeat(auto-fill, minmax(calc(60px * var(--zoom-level)), 1fr));
}
</style>
