<template>
  <div class="mac-toolbar">
    <div class="toolbar-content">
      <!-- 左侧工具组 -->
      <div class="toolbar-section left">
        <div 
          v-for="item in leftItems" 
          :key="item.id"
          class="toolbar-item"
          :class="{ 
            'active': item.active, 
            'disabled': item.disabled,
            'separator': item.type === 'separator'
          }"
          @click="handleItemClick(item)"
        >
          <div v-if="item.type === 'separator'" class="separator-line" />
          <template v-else>
            <el-icon v-if="item.icon" class="toolbar-icon">
              <component :is="item.icon" />
            </el-icon>
            <span v-if="item.label" class="toolbar-label">{{ item.label }}</span>
          </template>
        </div>
      </div>
      
      <!-- 中间搜索区域 -->
      <div class="toolbar-section center">
        <div class="search-container">
          <el-input
            v-model="searchQuery"
            placeholder="搜索"
            size="small"
            clearable
            @input="handleSearch"
            @clear="handleSearchClear"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
      
      <!-- 右侧工具组 -->
      <div class="toolbar-section right">
        <div 
          v-for="item in rightItems" 
          :key="item.id"
          class="toolbar-item"
          :class="{ 
            'active': item.active, 
            'disabled': item.disabled,
            'separator': item.type === 'separator'
          }"
          @click="handleItemClick(item)"
        >
          <div v-if="item.type === 'separator'" class="separator-line" />
          <template v-else>
            <el-icon v-if="item.icon" class="toolbar-icon">
              <component :is="item.icon" />
            </el-icon>
            <span v-if="item.label" class="toolbar-label">{{ item.label }}</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: '搜索'
  }
})

// Emits
const emit = defineEmits(['item-click', 'search', 'search-clear'])

// 响应式数据
const searchQuery = ref('')

// 计算属性
const leftItems = computed(() => {
  return props.items.filter(item => item.position === 'left' || !item.position)
})

const rightItems = computed(() => {
  return props.items.filter(item => item.position === 'right')
})

// 方法
const handleItemClick = (item) => {
  if (item.disabled || item.type === 'separator') return
  emit('item-click', item)
}

const handleSearch = (value) => {
  emit('search', value)
}

const handleSearchClear = () => {
  searchQuery.value = ''
  emit('search-clear')
}
</script>

<style scoped>
.mac-toolbar {
  height: 52px;
  background: linear-gradient(to bottom, 
    rgba(255, 255, 255, 0.9) 0%, 
    rgba(248, 248, 248, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0 16px;
  display: flex;
  align-items: center;
}

.toolbar-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
  
  &.left {
    flex: 0 0 auto;
  }
  
  &.center {
    flex: 1;
    justify-content: center;
    max-width: 300px;
  }
  
  &.right {
    flex: 0 0 auto;
  }
}

.toolbar-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease-out;
  user-select: none;
  position: relative;
  
  &:hover:not(.disabled):not(.separator) {
    background: rgba(0, 0, 0, 0.05);
  }
  
  &:active:not(.disabled):not(.separator) {
    background: rgba(0, 0, 0, 0.1);
    transform: translateY(1px);
  }
  
  &.active {
    background: rgba(0, 122, 255, 0.1);
    color: #007aff;
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.separator {
    padding: 0;
    cursor: default;
  }
}

.toolbar-icon {
  font-size: 16px;
  color: var(--mac-text-secondary);
  transition: color 0.15s ease-out;
  
  .toolbar-item:hover & {
    color: var(--mac-text-primary);
  }
  
  .toolbar-item.active & {
    color: #007aff;
  }
}

.toolbar-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--mac-text-primary);
  white-space: nowrap;
}

.separator-line {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 4px;
}

.search-container {
  width: 100%;
  max-width: 240px;
  
  :deep(.el-input) {
    .el-input__wrapper {
      background: rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 20px;
      box-shadow: none;
      transition: all 0.15s ease-out;
      
      &:hover {
        background: rgba(0, 0, 0, 0.08);
        border-color: rgba(0, 0, 0, 0.15);
      }
      
      &.is-focus {
        background: rgba(255, 255, 255, 0.9);
        border-color: #007aff;
        box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
      }
    }
    
    .el-input__inner {
      font-size: 13px;
      color: var(--mac-text-primary);
      
      &::placeholder {
        color: var(--mac-text-tertiary);
      }
    }
    
    .el-input__prefix {
      color: var(--mac-text-tertiary);
    }
  }
}

/* 深色主题适配 */
.dark-theme .mac-toolbar {
  background: linear-gradient(to bottom, 
    rgba(40, 40, 40, 0.9) 0%, 
    rgba(35, 35, 35, 0.9) 100%);
  border-bottom-color: rgba(255, 255, 255, 0.1);
  
  .toolbar-item:hover:not(.disabled):not(.separator) {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .toolbar-item:active:not(.disabled):not(.separator) {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .separator-line {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .search-container :deep(.el-input) {
    .el-input__wrapper {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
      }
      
      &.is-focus {
        background: rgba(0, 0, 0, 0.3);
        border-color: #5ac8fa;
        box-shadow: 0 0 0 2px rgba(90, 200, 250, 0.2);
      }
    }
  }
}

/* 工具栏按钮动画效果 */
.toolbar-item {
  position: relative;
  overflow: hidden;
}

.toolbar-item::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease-out;
}

.toolbar-item:active::before {
  width: 40px;
  height: 40px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mac-toolbar {
    padding: 0 12px;
    height: 48px;
  }
  
  .toolbar-content {
    gap: 8px;
  }
  
  .toolbar-item {
    padding: 4px 6px;
    
    .toolbar-label {
      display: none;
    }
  }
  
  .search-container {
    max-width: 180px;
  }
  
  .toolbar-section.left,
  .toolbar-section.right {
    .toolbar-item:not(.active) .toolbar-label {
      display: none;
    }
  }
}

@media (max-width: 480px) {
  .toolbar-section.center {
    display: none;
  }
  
  .toolbar-content {
    justify-content: space-between;
  }
}
</style>
