<template>
  <div class="windows-explorer-layout" :class="{ 'dark-theme': isDarkMode }">
    <!-- 顶部工具栏 -->
    <ExplorerToolbar
      :current-path="currentPath"
      :can-go-back="canGoBack"
      :can-go-forward="canGoForward"
      :view-mode="viewMode"
      :search-query="searchQuery"
      @navigate-back="handleNavigateBack"
      @navigate-forward="handleNavigateForward"
      @navigate-up="handleNavigateUp"
      @navigate-to="handleNavigateTo"
      @view-mode-change="handleViewModeChange"
      @search="handleSearch"
      @refresh="handleRefresh"
      @create-folder="handleCreateFolder"
      @upload-files="handleUploadFiles"
    />

    <!-- 主内容区域 -->
    <div class="explorer-content">
      <!-- 左侧导航栏 -->
      <ExplorerSidebar
        v-if="showSidebar"
        :current-path="currentPath"
        :expanded-folders="expandedFolders"
        @navigate-to="handleNavigateTo"
        @folder-expand="handleFolderExpand"
        @folder-collapse="handleFolderCollapse"
        @context-menu="handleSidebarContextMenu"
      />

      <!-- 分割线 -->
      <div v-if="showSidebar" class="splitter" @mousedown="startResize"></div>

      <!-- 右侧主视图区域 -->
      <ExplorerMainContent
        :current-path="currentPath"
        :view-mode="viewMode"
        :search-query="searchQuery"
        :selected-items="selectedItems"
        :sort-field="sortField"
        :sort-order="sortOrder"
        @item-select="handleItemSelect"
        @item-double-click="handleItemDoubleClick"
        @context-menu="handleMainContextMenu"
        @sort-change="handleSortChange"
        @drag-drop="handleDragDrop"
      />

      <!-- 右侧属性面板 -->
      <ExplorerPropertiesPanel
        v-if="showPropertiesPanel && selectedItems.length > 0"
        :selected-items="selectedItems"
        @close="showPropertiesPanel = false"
        @item-action="handleItemAction"
      />
    </div>

    <!-- 底部状态栏 -->
    <ExplorerStatusBar
      :current-path="currentPath"
      :selected-count="selectedItems.length"
      :total-count="totalItemCount"
      :loading="loading"
      :last-updated="lastUpdated"
    />

    <!-- 上下文菜单 -->
    <ContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
      @item-click="handleContextMenuClick"
      @close="closeContextMenu"
    />

    <!-- 对话框组件 -->
    <FileManagerDialogs
      :dialogs="dialogs"
      @dialog-confirm="handleDialogConfirm"
      @dialog-cancel="handleDialogCancel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

// 组件导入
import ExplorerToolbar from './ExplorerToolbar.vue'
import ExplorerSidebar from './ExplorerSidebar.vue'
import ExplorerMainContent from './ExplorerMainContent.vue'
import ExplorerPropertiesPanel from './ExplorerPropertiesPanel.vue'
import ExplorerStatusBar from './ExplorerStatusBar.vue'
import ContextMenu from './ContextMenu.vue'
import FileManagerDialogs from './FileManagerDialogs.vue'

// Props
const props = defineProps({
  initialPath: {
    type: String,
    default: '/'
  }
})

// Vuex store
const store = useStore()

// 响应式数据
const showSidebar = ref(true)
const showPropertiesPanel = ref(false)
const sidebarWidth = ref(250)
const isResizing = ref(false)
const loading = ref(false)
const lastUpdated = ref(null)
const totalItemCount = ref(0)

// 上下文菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  items: []
})

// 对话框状态
const dialogs = ref({
  createFolder: { visible: false, name: '' },
  rename: { visible: false, oldName: '', newName: '' },
  delete: { visible: false, items: [] },
  properties: { visible: false, item: null }
})

// 计算属性
const isDarkMode = computed(() => store.getters.useDarkMode)
const currentPath = computed(() => store.getters['fileManager/currentPath'])
const viewMode = computed(() => store.getters['fileManager/viewMode'])
const searchQuery = computed(() => store.getters['fileManager/searchQuery'])
const selectedItems = computed(() => store.getters['fileManager/selectedItems'])
const expandedFolders = computed(() => store.getters['fileManager/expandedFolders'])
const sortField = computed(() => store.getters['fileManager/sortField'])
const sortOrder = computed(() => store.getters['fileManager/sortOrder'])
const canGoBack = computed(() => store.getters['fileManager/canGoBack'])
const canGoForward = computed(() => store.getters['fileManager/canGoForward'])

// 导航处理
const handleNavigateBack = () => {
  store.dispatch('fileManager/navigateBack')
}

const handleNavigateForward = () => {
  store.dispatch('fileManager/navigateForward')
}

const handleNavigateUp = () => {
  const parentPath = currentPath.value.split('/').slice(0, -1).join('/') || '/'
  handleNavigateTo(parentPath)
}

const handleNavigateTo = (path) => {
  store.dispatch('fileManager/navigateTo', path)
}

// 视图模式处理
const handleViewModeChange = (mode) => {
  store.commit('fileManager/SET_VIEW_MODE', mode)
}

// 搜索处理
const handleSearch = (query) => {
  store.commit('fileManager/SET_SEARCH_QUERY', query)
}

// 文件夹展开/折叠处理
const handleFolderExpand = (path) => {
  store.commit('fileManager/EXPAND_FOLDER', path)
}

const handleFolderCollapse = (path) => {
  store.commit('fileManager/COLLAPSE_FOLDER', path)
}

// 项目选择处理
const handleItemSelect = (items) => {
  store.commit('fileManager/SET_SELECTED_ITEMS', items)
}

const handleItemDoubleClick = (item) => {
  if (item.type === 'folder') {
    handleNavigateTo(item.path)
  } else {
    // 打开文件预览或下载
    store.dispatch('fileManager/openFile', item)
  }
}

// 排序处理
const handleSortChange = ({ field, order }) => {
  store.commit('fileManager/SET_SORT_FIELD', field)
  store.commit('fileManager/SET_SORT_ORDER', order)
}

// 拖拽处理
const handleDragDrop = ({ items, targetPath, operation }) => {
  store.dispatch('fileManager/moveItems', { items, targetPath, operation })
}

// 刷新处理
const handleRefresh = () => {
  store.dispatch('fileManager/refreshCurrentPath')
}

// 创建文件夹处理
const handleCreateFolder = () => {
  dialogs.value.createFolder.visible = true
  dialogs.value.createFolder.name = '新建文件夹'
}

// 上传文件处理
const handleUploadFiles = (files) => {
  store.dispatch('fileManager/uploadFiles', { files, path: currentPath.value })
}

// 上下文菜单处理
const handleSidebarContextMenu = (event, item) => {
  showContextMenu(event, getSidebarContextMenuItems(item))
}

const handleMainContextMenu = (event, item) => {
  showContextMenu(event, getMainContextMenuItems(item))
}

const showContextMenu = (event, items) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items
  }
}

const closeContextMenu = () => {
  contextMenu.value.visible = false
}

const handleContextMenuClick = (action, item) => {
  closeContextMenu()
  handleItemAction(action, item)
}

// 项目操作处理
const handleItemAction = (action, item) => {
  switch (action) {
    case 'rename':
      dialogs.value.rename.visible = true
      dialogs.value.rename.oldName = item.name
      dialogs.value.rename.newName = item.name
      break
    case 'delete':
      dialogs.value.delete.visible = true
      dialogs.value.delete.items = Array.isArray(item) ? item : [item]
      break
    case 'properties':
      showPropertiesPanel.value = true
      break
    default:
      store.dispatch('fileManager/executeAction', { action, item })
  }
}

// 对话框处理
const handleDialogConfirm = (type, data) => {
  switch (type) {
    case 'createFolder':
      store.dispatch('fileManager/createFolder', {
        path: currentPath.value,
        name: data.name
      })
      break
    case 'rename':
      store.dispatch('fileManager/renameItem', {
        oldName: data.oldName,
        newName: data.newName
      })
      break
    case 'delete':
      store.dispatch('fileManager/deleteItems', data.items)
      break
  }
  dialogs.value[type].visible = false
}

const handleDialogCancel = (type) => {
  dialogs.value[type].visible = false
}

// 侧边栏大小调整
const startResize = (event) => {
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (event) => {
  if (isResizing.value) {
    const newWidth = event.clientX
    if (newWidth >= 200 && newWidth <= 400) {
      sidebarWidth.value = newWidth
    }
  }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// 上下文菜单项目生成
const getSidebarContextMenuItems = (item) => {
  return [
    { label: '打开', action: 'open', icon: 'FolderOpened' },
    { label: '新建文件夹', action: 'createFolder', icon: 'FolderAdd' },
    { type: 'divider' },
    { label: '重命名', action: 'rename', icon: 'Edit' },
    { label: '删除', action: 'delete', icon: 'Delete' },
    { type: 'divider' },
    { label: '属性', action: 'properties', icon: 'InfoFilled' }
  ]
}

const getMainContextMenuItems = (item) => {
  if (!item) {
    return [
      { label: '刷新', action: 'refresh', icon: 'Refresh' },
      { type: 'divider' },
      { label: '新建文件夹', action: 'createFolder', icon: 'FolderAdd' },
      { label: '上传文件', action: 'upload', icon: 'Upload' }
    ]
  }

  return [
    { label: '打开', action: 'open', icon: item.type === 'folder' ? 'FolderOpened' : 'Document' },
    { type: 'divider' },
    { label: '复制', action: 'copy', icon: 'CopyDocument' },
    { label: '剪切', action: 'cut', icon: 'Scissors' },
    { label: '删除', action: 'delete', icon: 'Delete' },
    { label: '重命名', action: 'rename', icon: 'Edit' },
    { type: 'divider' },
    { label: '属性', action: 'properties', icon: 'InfoFilled' }
  ]
}

// 生命周期
onMounted(() => {
  // 初始化文件管理器
  store.dispatch('fileManager/initialize', props.initialPath)

  // 监听键盘事件
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})

// 键盘快捷键处理
const handleKeydown = (event) => {
  if (event.ctrlKey) {
    switch (event.key) {
      case 'a':
        event.preventDefault()
        store.dispatch('fileManager/selectAll')
        break
      case 'c':
        event.preventDefault()
        store.dispatch('fileManager/copySelected')
        break
      case 'x':
        event.preventDefault()
        store.dispatch('fileManager/cutSelected')
        break
      case 'v':
        event.preventDefault()
        store.dispatch('fileManager/paste')
        break
      case 'r':
        event.preventDefault()
        handleRefresh()
        break
    }
  } else {
    switch (event.key) {
      case 'Delete':
        if (selectedItems.value.length > 0) {
          handleItemAction('delete', selectedItems.value)
        }
        break
      case 'F2':
        if (selectedItems.value.length === 1) {
          handleItemAction('rename', selectedItems.value[0])
        }
        break
      case 'F5':
        event.preventDefault()
        handleRefresh()
        break
    }
  }
}
</script>

<style scoped>
.windows-explorer-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.explorer-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.splitter {
  width: 4px;
  background-color: var(--el-border-color);
  cursor: col-resize;
  transition: background-color 0.2s;
}

.splitter:hover {
  background-color: var(--el-color-primary);
}

/* 深色主题样式 */
.dark-theme {
  --explorer-bg: #1e1e1e;
  --explorer-sidebar-bg: #252526;
  --explorer-toolbar-bg: #2d2d30;
  --explorer-border: #3e3e42;
  --explorer-hover: #2a2d2e;
  --explorer-selected: #094771;
  --explorer-text: #cccccc;
  --explorer-text-secondary: #969696;
}

/* 浅色主题样式 */
.windows-explorer-layout:not(.dark-theme) {
  --explorer-bg: #ffffff;
  --explorer-sidebar-bg: #f3f3f3;
  --explorer-toolbar-bg: #f8f8f8;
  --explorer-border: #e1e1e1;
  --explorer-hover: #e8f4fd;
  --explorer-selected: #cce8ff;
  --explorer-text: #323130;
  --explorer-text-secondary: #605e5c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .explorer-content {
    flex-direction: column;
  }

  .splitter {
    display: none;
  }
}

/* 滚动条样式 */
:deep(.el-scrollbar__wrap) {
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color-light) transparent;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-thumb) {
  background-color: var(--el-border-color-light);
  border-radius: 4px;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-thumb:hover) {
  background-color: var(--el-border-color);
}

/* 选择高亮效果 */
.item-selected {
  background-color: var(--explorer-selected) !important;
  color: var(--el-color-white);
}

.item-hover {
  background-color: var(--explorer-hover);
}

/* 拖拽效果 */
.drag-over {
  background-color: var(--el-color-primary-light-8);
  border: 2px dashed var(--el-color-primary);
}

.drag-source {
  opacity: 0.5;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
</style>
