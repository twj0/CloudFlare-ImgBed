<template>
  <div class="explorer-main-content">
    <!-- 列表头部（仅在详细视图模式下显示） -->
    <div v-if="viewMode === 'detail'" class="list-header">
      <div class="header-column name-column" @click="handleSort('name')">
        <span>名称</span>
        <el-icon v-if="sortField === 'name'" class="sort-icon">
          <component :is="sortOrder === 'asc' ? ArrowUp : ArrowDown" />
        </el-icon>
      </div>
      <div class="header-column size-column" @click="handleSort('size')">
        <span>大小</span>
        <el-icon v-if="sortField === 'size'" class="sort-icon">
          <component :is="sortOrder === 'asc' ? ArrowUp : ArrowDown" />
        </el-icon>
      </div>
      <div class="header-column type-column" @click="handleSort('type')">
        <span>类型</span>
        <el-icon v-if="sortField === 'type'" class="sort-icon">
          <component :is="sortOrder === 'asc' ? ArrowUp : ArrowDown" />
        </el-icon>
      </div>
      <div class="header-column date-column" @click="handleSort('modified')">
        <span>修改时间</span>
        <el-icon v-if="sortField === 'modified'" class="sort-icon">
          <component :is="sortOrder === 'asc' ? ArrowUp : ArrowDown" />
        </el-icon>
      </div>
    </div>

    <!-- 文件列表容器 -->
    <div class="file-list-container" @contextmenu.prevent="handleBackgroundContextMenu">
      <el-scrollbar>
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredItems.length === 0" class="empty-container">
          <el-icon class="empty-icon"><FolderOpened /></el-icon>
          <p>此文件夹为空</p>
          <el-button type="primary" @click="$emit('create-folder')">
            创建新文件夹
          </el-button>
        </div>

        <!-- 文件项目列表 -->
        <div
          v-else
          class="file-items"
          :class="`view-${viewMode}`"
          @dragover.prevent
          @drop="handleDrop"
        >
          <FileItem
            v-for="item in filteredItems"
            :key="item.path"
            :item="item"
            :view-mode="viewMode"
            :selected="isSelected(item)"
            @click="handleItemClick"
            @double-click="handleItemDoubleClick"
            @context-menu="handleItemContextMenu"
            @drag-start="handleDragStart"
            @drag-end="handleDragEnd"
          />
        </div>
      </el-scrollbar>
    </div>

    <!-- 选择框（用于框选） -->
    <div
      v-if="selectionBox.visible"
      class="selection-box"
      :style="selectionBoxStyle"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import {
  ArrowUp,
  ArrowDown,
  Loading,
  FolderOpened
} from '@element-plus/icons-vue'
import FileItem from './FileItem.vue'

// Props
const props = defineProps({
  currentPath: {
    type: String,
    required: true
  },
  viewMode: {
    type: String,
    default: 'list'
  },
  searchQuery: {
    type: String,
    default: ''
  },
  selectedItems: {
    type: Array,
    default: () => []
  },
  sortField: {
    type: String,
    default: 'name'
  },
  sortOrder: {
    type: String,
    default: 'asc'
  }
})

// Emits
const emit = defineEmits([
  'item-select',
  'item-double-click',
  'context-menu',
  'sort-change',
  'drag-drop',
  'create-folder'
])

// Vuex store
const store = useStore()

// 响应式数据
const loading = ref(false)
const items = ref([])
const draggedItems = ref([])
const selectionBox = ref({
  visible: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
})

// 计算属性
const filteredItems = computed(() => {
  let result = [...items.value]
  
  // 搜索过滤
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(query)
    )
  }
  
  // 排序
  result.sort((a, b) => {
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
  return result.sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1
    return 0
  })
})

const selectionBoxStyle = computed(() => {
  const { startX, startY, endX, endY } = selectionBox.value
  const left = Math.min(startX, endX)
  const top = Math.min(startY, endY)
  const width = Math.abs(endX - startX)
  const height = Math.abs(endY - startY)
  
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  }
})

// 检查项目是否被选中
const isSelected = (item) => {
  return props.selectedItems.some(selected => selected.path === item.path)
}

// 处理排序
const handleSort = (field) => {
  const order = props.sortField === field && props.sortOrder === 'asc' ? 'desc' : 'asc'
  emit('sort-change', { field, order })
}

// 处理项目点击
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
    const startIndex = filteredItems.value.findIndex(i => i.path === lastSelected.path)
    const endIndex = filteredItems.value.findIndex(i => i.path === item.path)
    
    if (startIndex !== -1 && endIndex !== -1) {
      const start = Math.min(startIndex, endIndex)
      const end = Math.max(startIndex, endIndex)
      newSelection = filteredItems.value.slice(start, end + 1)
    } else {
      newSelection = [item]
    }
  } else {
    // 普通点击：单选
    newSelection = [item]
  }
  
  emit('item-select', newSelection)
}

// 处理项目双击
const handleItemDoubleClick = (item) => {
  emit('item-double-click', item)
}

// 处理项目右键菜单
const handleItemContextMenu = (item, event) => {
  if (!isSelected(item)) {
    emit('item-select', [item])
  }
  emit('context-menu', event, item)
}

// 处理背景右键菜单
const handleBackgroundContextMenu = (event) => {
  emit('item-select', [])
  emit('context-menu', event, null)
}

// 处理拖拽开始
const handleDragStart = (item, event) => {
  if (!isSelected(item)) {
    emit('item-select', [item])
  }
  draggedItems.value = props.selectedItems
  
  // 设置拖拽数据
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', JSON.stringify(draggedItems.value))
}

// 处理拖拽结束
const handleDragEnd = () => {
  draggedItems.value = []
}

// 处理拖放
const handleDrop = (event) => {
  event.preventDefault()
  
  try {
    const data = event.dataTransfer.getData('text/plain')
    const droppedItems = JSON.parse(data)
    
    if (droppedItems && droppedItems.length > 0) {
      emit('drag-drop', {
        items: droppedItems,
        targetPath: props.currentPath,
        operation: event.ctrlKey ? 'copy' : 'move'
      })
    }
  } catch (error) {
    console.error('Failed to handle drop:', error)
  }
}

// 加载文件列表
const loadItems = async () => {
  loading.value = true
  try {
    const response = await store.dispatch('fileManager/loadItems', props.currentPath)
    items.value = response || []
  } catch (error) {
    console.error('Failed to load items:', error)
    items.value = []
  } finally {
    loading.value = false
  }
}

// 框选处理
const startSelection = (event) => {
  if (event.target.closest('.file-item')) return
  
  selectionBox.value = {
    visible: true,
    startX: event.clientX,
    startY: event.clientY,
    endX: event.clientX,
    endY: event.clientY
  }
  
  document.addEventListener('mousemove', updateSelection)
  document.addEventListener('mouseup', endSelection)
}

const updateSelection = (event) => {
  selectionBox.value.endX = event.clientX
  selectionBox.value.endY = event.clientY
}

const endSelection = () => {
  selectionBox.value.visible = false
  document.removeEventListener('mousemove', updateSelection)
  document.removeEventListener('mouseup', endSelection)
  
  // TODO: 实现框选逻辑
}

// 生命周期
onMounted(() => {
  loadItems()
  document.addEventListener('mousedown', startSelection)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', startSelection)
  document.removeEventListener('mousemove', updateSelection)
  document.removeEventListener('mouseup', endSelection)
})

// 监听路径变化
watch(() => props.currentPath, () => {
  loadItems()
})
</script>

<style scoped>
.explorer-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--explorer-bg, var(--el-bg-color));
  position: relative;
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--el-fill-color-extra-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-column {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.header-column:hover {
  background-color: var(--el-fill-color-light);
}

.name-column {
  flex: 1;
  min-width: 200px;
}

.size-column {
  width: 100px;
}

.type-column {
  width: 120px;
}

.date-column {
  width: 150px;
}

.sort-icon {
  margin-left: 4px;
  font-size: 12px;
}

.file-list-container {
  flex: 1;
  overflow: hidden;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--el-text-color-secondary);
}

.loading-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--el-text-color-placeholder);
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.file-items {
  padding: 8px;
}

.file-items.view-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-items.view-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  padding: 16px;
}

.file-items.view-detail {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.selection-box {
  position: absolute;
  border: 1px dashed var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  pointer-events: none;
  z-index: 100;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .list-header {
    display: none;
  }
  
  .file-items.view-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
    padding: 12px;
  }
  
  .size-column,
  .type-column {
    display: none;
  }
  
  .date-column {
    width: 100px;
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
.dark-theme .list-header {
  background-color: var(--el-fill-color-darker);
}

/* 拖拽状态 */
.drag-over {
  background-color: var(--el-color-primary-light-8);
  border: 2px dashed var(--el-color-primary);
}
</style>
