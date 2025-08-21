<template>
  <div class="finder-list-view">
    <!-- 列表头部 -->
    <div class="list-header">
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
    
    <!-- 列表内容 -->
    <div class="list-content">
      <div
        v-for="item in items"
        :key="item.path"
        class="list-item"
        :class="{ 'selected': isSelected(item) }"
        @click="handleItemClick(item, $event)"
        @dblclick="handleItemDoubleClick(item)"
        @contextmenu.prevent="handleItemContextMenu(item, $event)"
      >
        <div class="item-column name-column">
          <el-icon class="item-icon">
            <Folder v-if="item.type === 'folder'" />
            <Picture v-else-if="item.type === 'image'" />
            <Document v-else />
          </el-icon>
          <span class="item-name">{{ item.name }}</span>
        </div>
        <div class="item-column size-column">
          {{ formatSize(item.size) }}
        </div>
        <div class="item-column type-column">
          {{ getFileType(item) }}
        </div>
        <div class="item-column date-column">
          {{ formatDate(item.modified) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ArrowUp,
  ArrowDown,
  Folder,
  Picture,
  Document
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
  'item-context-menu',
  'sort-change'
])

// 方法
const isSelected = (item) => {
  return props.selectedItems.some(selected => selected.path === item.path)
}

const handleItemClick = (item, event) => {
  let newSelection = []
  
  if (event.ctrlKey || event.metaKey) {
    if (isSelected(item)) {
      newSelection = props.selectedItems.filter(selected => selected.path !== item.path)
    } else {
      newSelection = [...props.selectedItems, item]
    }
  } else if (event.shiftKey && props.selectedItems.length > 0) {
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

const handleSort = (field) => {
  const order = props.sortField === field && props.sortOrder === 'asc' ? 'desc' : 'asc'
  emit('sort-change', { field, order })
}

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '-'
  
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
  if (!timestamp) return '-'
  
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getFileType = (item) => {
  if (item.type === 'folder') return '文件夹'
  if (item.type === 'image') return '图片'
  return '文件'
}
</script>

<style scoped>
.finder-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--mac-bg-primary);
}

.list-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--mac-bg-secondary);
  border-bottom: 1px solid var(--mac-border-primary);
  font-size: 12px;
  font-weight: 600;
  color: var(--mac-text-secondary);
}

.header-column {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.15s ease-out;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
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

.list-content {
  flex: 1;
  overflow-y: auto;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  border-bottom: 1px solid var(--mac-border-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease-out;
  
  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }
  
  &.selected {
    background: rgba(0, 122, 255, 0.1);
    border-color: rgba(0, 122, 255, 0.2);
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.item-column {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--mac-text-primary);
  
  &.name-column {
    flex: 1;
    min-width: 200px;
    gap: 8px;
  }
  
  &.size-column {
    width: 100px;
    justify-content: flex-end;
    color: var(--mac-text-secondary);
  }
  
  &.type-column {
    width: 120px;
    color: var(--mac-text-secondary);
  }
  
  &.date-column {
    width: 150px;
    color: var(--mac-text-secondary);
  }
}

.item-icon {
  font-size: 16px;
  color: var(--mac-text-secondary);
  flex-shrink: 0;
}

.item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 深色主题适配 */
.dark-theme .list-header {
  background: var(--mac-bg-tertiary);
}

.dark-theme .header-column:hover {
  background: rgba(255, 255, 255, 0.05);
}

.dark-theme .list-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .size-column,
  .type-column {
    display: none;
  }
  
  .date-column {
    width: 100px;
  }
  
  .list-header,
  .list-item {
    padding: 8px 12px;
  }
}
</style>
