<template>
  <div class="finder-content-view">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="filteredItems.length === 0" class="empty-container">
      <el-icon class="empty-icon"><FolderOpened /></el-icon>
      <h3>此文件夹为空</h3>
      <p>拖拽图片到这里开始上传</p>
    </div>
    
    <!-- 内容视图 -->
    <div
      v-else
      class="content-container"
      :class="`view-${viewMode}`"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <!-- 网格视图 -->
      <FinderIconView
        v-if="viewMode === 'grid'"
        :items="filteredItems"
        :selected-items="selectedItems"
        :zoom-level="zoomLevel"
        @item-select="handleItemSelect"
        @item-double-click="handleItemDoubleClick"
        @item-context-menu="handleItemContextMenu"
      />
      
      <!-- 列表视图 -->
      <FinderListView
        v-else-if="viewMode === 'list'"
        :items="filteredItems"
        :selected-items="selectedItems"
        :sort-field="sortField"
        :sort-order="sortOrder"
        @item-select="handleItemSelect"
        @item-double-click="handleItemDoubleClick"
        @item-context-menu="handleItemContextMenu"
        @sort-change="handleSortChange"
      />
      
      <!-- 分栏视图 -->
      <FinderColumnView
        v-else-if="viewMode === 'column'"
        :items="filteredItems"
        :selected-items="selectedItems"
        :current-path="currentPath"
        @item-select="handleItemSelect"
        @item-double-click="handleItemDoubleClick"
        @item-context-menu="handleItemContextMenu"
        @navigate="handleNavigate"
      />
      
      <!-- 画廊视图 -->
      <FinderGalleryView
        v-else-if="viewMode === 'gallery'"
        :items="filteredItems"
        :selected-items="selectedItems"
        @item-select="handleItemSelect"
        @item-double-click="handleItemDoubleClick"
        @item-context-menu="handleItemContextMenu"
      />
    </div>
    
    <!-- 拖拽覆盖层 -->
    <div v-if="isDragOver" class="drag-overlay">
      <div class="drag-content">
        <el-icon class="drag-icon"><Upload /></el-icon>
        <h3>拖放图片到这里上传</h3>
        <p>支持 JPG、PNG、GIF、WebP 格式</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Loading,
  FolderOpened,
  Upload
} from '@element-plus/icons-vue'

// 导入视图组件（这些组件需要单独创建）
import FinderIconView from './FinderIconView.vue'
import FinderListView from './FinderListView.vue'
import FinderColumnView from './FinderColumnView.vue'
import FinderGalleryView from './FinderGalleryView.vue'

// Props
const props = defineProps({
  currentPath: {
    type: String,
    required: true
  },
  viewMode: {
    type: String,
    default: 'grid'
  },
  items: {
    type: Array,
    default: () => []
  },
  selectedItems: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    default: ''
  },
  sortField: {
    type: String,
    default: 'name'
  },
  sortOrder: {
    type: String,
    default: 'asc'
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
  'item-context-menu',
  'drag-drop',
  'sort-change',
  'navigate'
])

// 响应式数据
const isDragOver = ref(false)

// 计算属性
const filteredItems = computed(() => {
  let items = [...props.items]
  
  // 搜索过滤
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(query)
    )
  }
  
  // 排序
  items.sort((a, b) => {
    let aValue, bValue
    
    switch (props.sortField) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'size':
        aValue = a.size || 0
        bValue = b.size || 0
        break
      case 'type':
        aValue = a.type
        bValue = b.type
        break
      case 'modified':
        aValue = new Date(a.modified || 0)
        bValue = new Date(b.modified || 0)
        break
      default:
        return 0
    }
    
    if (aValue < bValue) {
      return props.sortOrder === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return props.sortOrder === 'asc' ? 1 : -1
    }
    return 0
  })
  
  // 文件夹优先
  return items.sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1
    return 0
  })
})

// 事件处理
const handleItemSelect = (items) => {
  emit('item-select', items)
}

const handleItemDoubleClick = (item) => {
  emit('item-double-click', item)
}

const handleItemContextMenu = (event, item) => {
  emit('item-context-menu', event, item)
}

const handleSortChange = (sortInfo) => {
  emit('sort-change', sortInfo)
}

const handleNavigate = (path) => {
  emit('navigate', path)
}

// 拖拽处理
const handleDragOver = (event) => {
  if (event.dataTransfer.types.includes('Files')) {
    isDragOver.value = true
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleDragLeave = (event) => {
  // 只有当离开整个容器时才隐藏覆盖层
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false
  }
}

const handleDrop = (event) => {
  isDragOver.value = false
  
  const files = Array.from(event.dataTransfer.files)
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length > 0) {
    emit('drag-drop', {
      files: imageFiles,
      targetPath: props.currentPath
    })
  }
}
</script>

<style scoped>
.finder-content-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--mac-bg-primary);
  position: relative;
  overflow: hidden;
}

.loading-container,
.empty-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--mac-text-secondary);
  gap: 16px;
}

.loading-icon,
.empty-icon {
  font-size: 48px;
  color: var(--mac-text-tertiary);
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.empty-container h3 {
  font-size: 18px;
  font-weight: 500;
  color: var(--mac-text-primary);
  margin: 0;
}

.empty-container p {
  font-size: 14px;
  color: var(--mac-text-secondary);
  margin: 0;
}

.content-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 122, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px dashed var(--mac-accent-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: drag-overlay-appear 0.2s ease-out;
}

.drag-content {
  text-align: center;
  color: var(--mac-accent-color);
}

.drag-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.drag-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.drag-content p {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
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

@keyframes drag-overlay-appear {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 视图模式样式 */
.view-grid {
  padding: 16px;
}

.view-list {
  padding: 0;
}

.view-column {
  padding: 0;
}

.view-gallery {
  padding: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .view-grid {
    padding: 12px;
  }
  
  .view-gallery {
    padding: 12px;
  }
  
  .drag-content h3 {
    font-size: 18px;
  }
  
  .drag-icon {
    font-size: 48px;
  }
}
</style>
