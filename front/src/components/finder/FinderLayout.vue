<template>
  <MacWindow
    :title="windowTitle"
    :width="windowWidth"
    :height="windowHeight"
    :min-width="600"
    :min-height="400"
    :show-toolbar="true"
    :show-status-bar="true"
    :toolbar-items="toolbarItems"
    :status-bar-content="statusBarContent"
    @close="handleClose"
    @minimize="handleMinimize"
    @maximize="handleMaximize"
    @toolbar-click="handleToolbarClick"
    @resize="handleResize"
  >
    <div class="finder-layout">
      <!-- 侧边栏 -->
      <FinderSidebar
        v-if="showSidebar"
        :current-path="currentPath"
        :favorites="favorites"
        :recent-items="recentItems"
        @navigate="handleNavigate"
        @toggle-favorite="handleToggleFavorite"
      />
      
      <!-- 分割线 -->
      <div 
        v-if="showSidebar" 
        class="sidebar-splitter"
        @mousedown="startSidebarResize"
      />
      
      <!-- 主内容区 -->
      <div class="finder-content">
        <!-- 简单错误显示 -->
        <div v-if="error" class="error-banner">
          <el-alert
            :title="error"
            type="error"
            :closable="true"
            show-icon
            @close="clearError"
          >
            <template #default>
              <div class="error-actions">
                <el-button size="small" @click="handleRetryLoad">重试</el-button>
              </div>
            </template>
          </el-alert>
        </div>

        <!-- 内容视图 -->
        <FinderContentView
          :current-path="currentPath"
          :view-mode="viewMode"
          :items="items"
          :selected-items="selectedItems"
          :loading="loading"
          :search-query="searchQuery"
          :sort-field="sortField"
          :sort-order="sortOrder"
          @item-select="handleItemSelect"
          @item-double-click="handleItemDoubleClick"
          @item-context-menu="handleItemContextMenu"
          @drag-drop="handleDragDrop"
          @sort-change="handleSortChange"
        />
      </div>
    </div>
    
    <!-- 上下文菜单 -->
    <MacContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
      @item-click="handleContextMenuClick"
      @close="closeContextMenu"
    />
    
    <!-- 图片预览模态框 -->
    <ImagePreviewModal
      v-if="previewModal.visible"
      :image="previewModal.image"
      :images="previewModal.images"
      @close="closePreviewModal"
      @navigate="handlePreviewNavigate"
    />
    
    <!-- 上传进度模态框 -->
    <UploadProgressModal
      v-if="uploadModal.visible"
      :files="uploadModal.files"
      :progress="uploadModal.progress"
      @close="closeUploadModal"
      @cancel="cancelUpload"
    />

    <!-- 新建文件夹对话框 -->
    <NewFolderDialog
      v-model="newFolderDialog.visible"
      :current-path="currentPath"
      :existing-folders="existingFolderNames"
      @create="handleCreateFolder"
      @close="closeNewFolderDialog"
      ref="newFolderDialogRef"
    />

    <!-- 批量创建文件夹对话框 -->
    <BatchFolderDialog
      v-model="batchFolderDialog.visible"
      :current-path="currentPath"
      :existing-folders="existingFolderNames"
      @batch-create="handleBatchCreateFolders"
      @close="closeBatchFolderDialog"
      ref="batchFolderDialogRef"
    />
  </MacWindow>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { createFolder, batchCreateFolders } from '@/utils/folderAPI'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Refresh,
  Upload,
  FolderAdd,
  Grid,
  List,
  Document,
  Picture,
  Share,
  More
} from '@element-plus/icons-vue'

// 组件导入
import MacWindow from '../macOS/MacWindow.vue'
import FinderSidebar from './FinderSidebar.vue'
import FinderContentView from './FinderContentView.vue'
import MacContextMenu from '../ui/MacContextMenu.vue'
import ImagePreviewModal from '../image/ImagePreviewModal.vue'
import UploadProgressModal from '../image/UploadProgressModal.vue'
import NewFolderDialog from './NewFolderDialog.vue'
import BatchFolderDialog from './BatchFolderDialog.vue'

// Props
const props = defineProps({
  initialPath: {
    type: String,
    default: '/'
  }
})

// Store
const store = useStore()

// 响应式数据
const windowWidth = ref(1000)
const windowHeight = ref(700)
const showSidebar = ref(true)
const sidebarWidth = ref(200)
const isResizingSidebar = ref(false)

// 上下文菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  items: []
})

// 模态框状态
const previewModal = ref({
  visible: false,
  image: null,
  images: []
})

const uploadModal = ref({
  visible: false,
  files: [],
  progress: 0
})

// 新建文件夹对话框状态
const newFolderDialog = ref({
  visible: false
})

const batchFolderDialog = ref({
  visible: false
})

// 组件引用
const newFolderDialogRef = ref(null)
const batchFolderDialogRef = ref(null)

// 计算属性
const windowTitle = computed(() => {
  const pathName = currentPath.value === '/' ? '图床' : currentPath.value.split('/').pop()
  return `${pathName} - 图床管理器`
})

const currentPath = computed(() => store.getters['finder/currentPath'])
const viewMode = computed(() => store.getters['finder/viewMode'])
const items = computed(() => store.getters['finder/items'])
const selectedItems = computed(() => store.getters['finder/selectedItems'])
const loading = computed(() => store.getters['finder/loading'])
const searchQuery = computed(() => store.getters['finder/searchQuery'])
const sortField = computed(() => store.getters['finder/sortField'])
const sortOrder = computed(() => store.getters['finder/sortOrder'])
const favorites = computed(() => store.getters['finder/favorites'])
const recentItems = computed(() => store.getters['finder/recentItems'])
const error = computed(() => store.getters['finder/error'])

// 获取现有文件夹名称列表
const existingFolderNames = computed(() => {
  return items.value
    .filter(item => item.type === 'folder')
    .map(item => item.name)
})

// 获取现有文件夹名称列表
const existingFolderNames = computed(() => {
  return items.value
    .filter(item => item.type === 'folder')
    .map(item => item.name)
})

const statusBarContent = computed(() => {
  const itemCount = items.value.length
  const selectedCount = selectedItems.value.length
  const totalSize = items.value.reduce((sum, item) => sum + (item.size || 0), 0)
  
  return {
    itemCount,
    selectedCount,
    totalSize,
    loading: loading.value,
    viewMode: viewMode.value,
    sortInfo: {
      field: sortField.value,
      order: sortOrder.value
    }
  }
})

// 工具栏配置
const toolbarItems = computed(() => [
  {
    id: 'back',
    icon: ArrowLeft,
    position: 'left',
    disabled: !store.getters['finder/canGoBack'],
    tooltip: '后退'
  },
  {
    id: 'forward',
    icon: ArrowRight,
    position: 'left',
    disabled: !store.getters['finder/canGoForward'],
    tooltip: '前进'
  },
  {
    id: 'up',
    icon: ArrowUp,
    position: 'left',
    disabled: currentPath.value === '/',
    tooltip: '向上'
  },
  {
    type: 'separator',
    position: 'left'
  },
  {
    id: 'refresh',
    icon: Refresh,
    position: 'left',
    tooltip: '刷新'
  },
  {
    id: 'upload',
    icon: Upload,
    label: '上传',
    position: 'right',
    tooltip: '上传图片'
  },
  {
    id: 'new-folder',
    icon: FolderAdd,
    position: 'right',
    tooltip: '新建文件夹'
  },
  {
    type: 'separator',
    position: 'right'
  },
  {
    id: 'view-grid',
    icon: Grid,
    position: 'right',
    active: viewMode.value === 'grid',
    tooltip: '图标视图'
  },
  {
    id: 'view-list',
    icon: List,
    position: 'right',
    active: viewMode.value === 'list',
    tooltip: '列表视图'
  },
  {
    id: 'view-column',
    icon: Document,
    position: 'right',
    active: viewMode.value === 'column',
    tooltip: '分栏视图'
  },
  {
    id: 'view-gallery',
    icon: Picture,
    position: 'right',
    active: viewMode.value === 'gallery',
    tooltip: '画廊视图'
  }
])

// 事件处理
const handleClose = () => {
  // 可以添加确认对话框
  window.close()
}

const handleMinimize = () => {
  // 最小化窗口
}

const handleMaximize = (isFullscreen) => {
  // 处理全屏状态
}

const handleResize = ({ width, height }) => {
  windowWidth.value = width
  windowHeight.value = height
}

const handleToolbarClick = (item) => {
  switch (item.id) {
    case 'back':
      store.dispatch('finder/navigateBack')
      break
    case 'forward':
      store.dispatch('finder/navigateForward')
      break
    case 'up':
      const parentPath = currentPath.value.split('/').slice(0, -1).join('/') || '/'
      handleNavigate(parentPath)
      break
    case 'refresh':
      store.dispatch('finder/refreshCurrentPath')
      break
    case 'upload':
      triggerFileUpload()
      break
    case 'new-folder':
      createNewFolder()
      break
    case 'view-grid':
      store.commit('finder/SET_VIEW_MODE', 'grid')
      break
    case 'view-list':
      store.commit('finder/SET_VIEW_MODE', 'list')
      break
    case 'view-column':
      store.commit('finder/SET_VIEW_MODE', 'column')
      break
    case 'view-gallery':
      store.commit('finder/SET_VIEW_MODE', 'gallery')
      break
  }
}

const handleNavigate = (path) => {
  store.dispatch('finder/navigateTo', path)
}

const handleItemSelect = (items) => {
  store.commit('finder/SET_SELECTED_ITEMS', items)
}

const handleItemDoubleClick = (item) => {
  if (item.type === 'folder') {
    handleNavigate(item.path)
  } else if (item.type === 'image') {
    openImagePreview(item)
  } else {
    // 下载文件
    downloadFile(item)
  }
}

const handleItemContextMenu = (event, item) => {
  showContextMenu(event, getContextMenuItems(item))
}

const handleDragDrop = ({ files, targetPath }) => {
  if (files && files.length > 0) {
    startUpload(files, targetPath)
  }
}

const handleSortChange = ({ field, order }) => {
  store.commit('finder/SET_SORT_FIELD', field)
  store.commit('finder/SET_SORT_ORDER', order)
}

const handleToggleFavorite = (item) => {
  store.dispatch('finder/toggleFavorite', item)
}

// 上下文菜单
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
  executeAction(action, item)
}

const getContextMenuItems = (item) => {
  if (!item) {
    return [
      { label: '上传图片', action: 'upload', icon: Upload },
      { label: '新建文件夹', action: 'new-folder', icon: FolderAdd },
      { label: '批量创建文件夹', action: 'batch-new-folder', icon: FolderAdd },
      { type: 'divider' },
      { label: '刷新', action: 'refresh', icon: Refresh }
    ]
  }

  const items = [
    { label: '打开', action: 'open' },
    { type: 'divider' },
    { label: '复制链接', action: 'copy-link', icon: Share },
    { label: '下载', action: 'download' },
    { type: 'divider' },
    { label: '重命名', action: 'rename' },
    { label: '删除', action: 'delete' }
  ]

  if (item.type === 'image') {
    items.splice(1, 0, { label: '快速查看', action: 'quick-look' })
  }

  return items
}

// 文件操作
const triggerFileUpload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = 'image/*'
  input.onchange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      startUpload(files, currentPath.value)
    }
  }
  input.click()
}

const startUpload = (files, targetPath) => {
  uploadModal.value = {
    visible: true,
    files: files.map(f => ({ name: f.name, progress: 0, status: 'pending' })),
    progress: 0
  }
  
  store.dispatch('finder/uploadFiles', { files, path: targetPath })
    .then(() => {
      ElMessage.success('上传完成')
      closeUploadModal()
    })
    .catch(error => {
      ElMessage.error('上传失败: ' + error.message)
      closeUploadModal()
    })
}

const createNewFolder = () => {
  // 直接使用简单的prompt作为临时解决方案
  const folderName = prompt('请输入文件夹名称:')

  if (folderName && folderName.trim()) {
    handleCreateFolderDirect(folderName.trim())
  }
}

// 直接创建文件夹的方法
const handleCreateFolderDirect = async (folderName) => {
  try {
    const response = await fetch('/api/manage/folders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        path: currentPath.value,
        description: `通过UI创建的文件夹: ${folderName}`,
        permissions: 'public',
        tags: []
      })
    })

    const result = await response.json()

    if (result.success) {
      ElMessage.success('文件夹创建成功')
      // 刷新文件列表
      store.dispatch('finder/refreshCurrentPath')
    } else {
      ElMessage.error(`创建失败: ${result.error}`)
    }
  } catch (error) {
    console.error('Create folder error:', error)
    ElMessage.error(`创建失败: ${error.message}`)
  }
}

const openImagePreview = (image) => {
  const images = items.value.filter(item => item.type === 'image')
  previewModal.value = {
    visible: true,
    image,
    images
  }
}

const closePreviewModal = () => {
  previewModal.value.visible = false
}

const closeUploadModal = () => {
  uploadModal.value.visible = false
}

const handlePreviewNavigate = (direction) => {
  // 实现预览导航逻辑
}

const cancelUpload = () => {
  // 实现取消上传逻辑
  closeUploadModal()
}

// 文件夹创建相关方法
const closeNewFolderDialog = () => {
  newFolderDialog.value.visible = false
}

const closeBatchFolderDialog = () => {
  batchFolderDialog.value.visible = false
}

const handleCreateFolder = async (folderData) => {
  try {
    // 使用Vuex action创建文件夹
    const result = await store.dispatch('finder/createFolder', folderData)

    if (result.success) {
      newFolderDialogRef.value?.handleCreateSuccess()
      ElMessage.success('文件夹创建成功')
    } else {
      newFolderDialogRef.value?.handleCreateError(new Error(result.message))
    }
  } catch (error) {
    console.error('Create folder error:', error)
    newFolderDialogRef.value?.handleCreateError(error)
    ElMessage.error(`创建文件夹失败: ${error.message}`)
  }
}

const handleBatchCreateFolders = async (foldersData) => {
  try {
    // 使用Vuex action批量创建文件夹
    const result = await store.dispatch('finder/batchCreateFolders', {
      folders: foldersData,
      path: currentPath.value
    })

    if (result.success) {
      batchFolderDialogRef.value?.handleBatchCreateSuccess()

      // 显示详细结果
      if (result.data.errors && result.data.errors.length > 0) {
        ElMessage.warning(`部分文件夹创建失败，成功 ${result.data.summary.success} 个，失败 ${result.data.summary.failed} 个`)
      } else {
        ElMessage.success(`成功创建 ${foldersData.length} 个文件夹`)
      }
    } else {
      batchFolderDialogRef.value?.handleBatchCreateError(new Error(result.message))
    }
  } catch (error) {
    console.error('Batch create folders error:', error)
    batchFolderDialogRef.value?.handleBatchCreateError(error)
    ElMessage.error(`批量创建失败: ${error.message}`)
  }
}

const downloadFile = (item) => {
  const link = document.createElement('a')
  link.href = item.url
  link.download = item.name
  link.click()
}

const executeAction = (action, item) => {
  switch (action) {
    case 'open':
      handleItemDoubleClick(item)
      break
    case 'quick-look':
      openImagePreview(item)
      break
    case 'copy-link':
      navigator.clipboard.writeText(item.url)
      ElMessage.success('链接已复制')
      break
    case 'download':
      downloadFile(item)
      break
    case 'upload':
      triggerFileUpload()
      break
    case 'new-folder':
      createNewFolder()
      break
    case 'batch-new-folder':
      batchFolderDialog.value.visible = true
      break
    case 'refresh':
      store.dispatch('finder/refreshCurrentPath')
      break
    default:
      ElMessage.info(`${action} 功能开发中`)
  }
}

// 侧边栏调整大小
const startSidebarResize = (event) => {
  isResizingSidebar.value = true
  document.addEventListener('mousemove', handleSidebarResize)
  document.addEventListener('mouseup', stopSidebarResize)
  event.preventDefault()
}

const handleSidebarResize = (event) => {
  if (isResizingSidebar.value) {
    const newWidth = event.clientX
    if (newWidth >= 150 && newWidth <= 400) {
      sidebarWidth.value = newWidth
    }
  }
}

const stopSidebarResize = () => {
  isResizingSidebar.value = false
  document.removeEventListener('mousemove', handleSidebarResize)
  document.removeEventListener('mouseup', stopSidebarResize)
}

// 错误处理方法
const handleRetryLoad = async () => {
  try {
    await store.dispatch('finder/refreshCurrentPath')
  } catch (error) {
    console.error('Retry load failed:', error)
  }
}

const clearError = () => {
  store.commit('finder/SET_ERROR', null)
}

// 生命周期
onMounted(() => {
  store.dispatch('finder/initialize', props.initialPath)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleSidebarResize)
  document.removeEventListener('mouseup', stopSidebarResize)
})
</script>

<style scoped>
.finder-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.sidebar-splitter {
  width: 1px;
  background: var(--mac-border-primary);
  cursor: col-resize;
  transition: background-color 0.15s ease-out;
  
  &:hover {
    background: var(--mac-accent-color);
  }
}

.finder-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.error-banner {
  margin: 12px;
  z-index: 10;
}

.error-actions {
  margin-top: 8px;
}
</style>
