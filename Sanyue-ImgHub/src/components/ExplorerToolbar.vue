<template>
  <div class="explorer-toolbar">
    <!-- 导航按钮组 -->
    <div class="toolbar-section navigation-buttons">
      <el-button-group>
        <el-button
          :disabled="!canGoBack"
          @click="$emit('navigate-back')"
          :icon="ArrowLeft"
          size="small"
          title="后退"
        />
        <el-button
          :disabled="!canGoForward"
          @click="$emit('navigate-forward')"
          :icon="ArrowRight"
          size="small"
          title="前进"
        />
        <el-button
          @click="$emit('navigate-up')"
          :icon="Top"
          size="small"
          title="向上"
        />
      </el-button-group>
    </div>

    <!-- 地址栏 -->
    <div class="toolbar-section address-bar">
      <AddressBar
        :current-path="currentPath"
        @navigate-to="$emit('navigate-to', $event)"
      />
    </div>

    <!-- 搜索框 -->
    <div class="toolbar-section search-box">
      <el-input
        v-model="searchInput"
        placeholder="搜索文件和文件夹"
        :prefix-icon="Search"
        size="small"
        clearable
        @input="handleSearchInput"
        @clear="handleSearchClear"
        style="width: 200px"
      />
    </div>

    <!-- 视图控制 -->
    <div class="toolbar-section view-controls">
      <el-radio-group
        :model-value="viewMode"
        @update:model-value="$emit('view-mode-change', $event)"
        size="small"
      >
        <el-radio-button label="list" title="列表视图">
          <el-icon><List /></el-icon>
        </el-radio-button>
        <el-radio-button label="grid" title="网格视图">
          <el-icon><Grid /></el-icon>
        </el-radio-button>
        <el-radio-button label="detail" title="详细视图">
          <el-icon><Document /></el-icon>
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 操作按钮 -->
    <div class="toolbar-section action-buttons">
      <el-button-group>
        <el-button
          type="primary"
          @click="handleUpload"
          :icon="Upload"
          size="small"
        >
          上传
        </el-button>
        <el-button
          @click="$emit('create-folder')"
          :icon="FolderAdd"
          size="small"
        >
          新建文件夹
        </el-button>
        <el-button
          @click="$emit('refresh')"
          :icon="Refresh"
          size="small"
        >
          刷新
        </el-button>
      </el-button-group>
    </div>

    <!-- 更多选项 -->
    <div class="toolbar-section more-options">
      <el-dropdown @command="handleMoreCommand">
        <el-button :icon="More" size="small" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="sort">
              <el-icon><Sort /></el-icon>
              排序选项
            </el-dropdown-item>
            <el-dropdown-item command="view-options">
              <el-icon><Setting /></el-icon>
              视图选项
            </el-dropdown-item>
            <el-dropdown-item divided command="properties">
              <el-icon><InfoFilled /></el-icon>
              属性
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 隐藏的文件上传输入 -->
    <input
      ref="fileInput"
      type="file"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { debounce } from 'lodash-es'
import {
  ArrowLeft,
  ArrowRight,
  Top,
  Search,
  List,
  Grid,
  Document,
  Upload,
  FolderAdd,
  Refresh,
  More,
  Sort,
  Setting,
  InfoFilled
} from '@element-plus/icons-vue'
import AddressBar from './AddressBar.vue'

// Props
const props = defineProps({
  currentPath: {
    type: String,
    required: true
  },
  canGoBack: {
    type: Boolean,
    default: false
  },
  canGoForward: {
    type: Boolean,
    default: false
  },
  viewMode: {
    type: String,
    default: 'list'
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits([
  'navigate-back',
  'navigate-forward',
  'navigate-up',
  'navigate-to',
  'view-mode-change',
  'search',
  'refresh',
  'create-folder',
  'upload-files'
])

// 响应式数据
const searchInput = ref(props.searchQuery)
const fileInput = ref(null)

// 监听搜索查询变化
watch(() => props.searchQuery, (newValue) => {
  searchInput.value = newValue
})

// 防抖搜索处理
const handleSearchInput = debounce((value) => {
  emit('search', value)
}, 300)

// 清空搜索
const handleSearchClear = () => {
  emit('search', '')
}

// 文件上传处理
const handleUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    emit('upload-files', files)
  }
  // 清空输入，允许重复选择同一文件
  event.target.value = ''
}

// 更多选项处理
const handleMoreCommand = (command) => {
  switch (command) {
    case 'sort':
      // 触发排序选项对话框
      break
    case 'view-options':
      // 触发视图选项对话框
      break
    case 'properties':
      // 触发属性对话框
      break
  }
}
</script>

<style scoped>
.explorer-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background-color: var(--explorer-toolbar-bg, var(--el-bg-color-page));
  border-bottom: 1px solid var(--explorer-border, var(--el-border-color));
  min-height: 48px;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
}

.navigation-buttons {
  flex-shrink: 0;
}

.address-bar {
  flex: 1;
  min-width: 200px;
  max-width: 500px;
}

.search-box {
  flex-shrink: 0;
}

.view-controls {
  flex-shrink: 0;
}

.action-buttons {
  flex-shrink: 0;
}

.more-options {
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .explorer-toolbar {
    flex-wrap: wrap;
    gap: 8px;
    padding: 6px 12px;
  }
  
  .search-box :deep(.el-input) {
    width: 150px !important;
  }
}

@media (max-width: 768px) {
  .explorer-toolbar {
    justify-content: space-between;
  }
  
  .address-bar {
    order: -1;
    flex-basis: 100%;
    margin-bottom: 8px;
  }
  
  .search-box {
    display: none;
  }
  
  .action-buttons :deep(.el-button span) {
    display: none;
  }
}

/* 按钮样式优化 */
:deep(.el-button-group .el-button) {
  border-radius: 4px;
  margin: 0 1px;
}

:deep(.el-button-group .el-button:first-child) {
  margin-left: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

:deep(.el-button-group .el-button:last-child) {
  margin-right: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

:deep(.el-button-group .el-button:not(:first-child):not(:last-child)) {
  border-radius: 0;
}

/* 视图控制按钮样式 */
:deep(.el-radio-group .el-radio-button__inner) {
  padding: 8px 12px;
  border-radius: 4px;
  margin: 0 1px;
}

/* 搜索框样式 */
:deep(.el-input__wrapper) {
  border-radius: 20px;
}

/* 工具提示样式 */
.el-button[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--el-color-info-dark-2);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
}
</style>
