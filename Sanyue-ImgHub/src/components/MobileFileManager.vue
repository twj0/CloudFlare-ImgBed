<template>
  <div class="mobile-file-manager">
    <!-- 移动端顶部导航 -->
    <header class="mobile-header">
      <div class="mobile-nav">
        <el-button 
          @click="toggleSidebar" 
          :icon="Menu" 
          circle 
          class="sidebar-toggle"
        />
        <div class="breadcrumb-mobile">
          <span v-if="currentPath">{{ getCurrentFolderName() }}</span>
          <span v-else>根目录</span>
        </div>
        <el-dropdown class="mobile-menu">
          <el-button :icon="MoreFilled" circle />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleUpload">
                <el-icon><Upload /></el-icon> 上传文件
              </el-dropdown-item>
              <el-dropdown-item @click="handleCreateFolder">
                <el-icon><FolderAdd /></el-icon> 新建文件夹
              </el-dropdown-item>
              <el-dropdown-item @click="handleRefresh">
                <el-icon><Refresh /></el-icon> 刷新
              </el-dropdown-item>
              <el-dropdown-item divided @click="toggleViewMode">
                <el-icon><Grid /></el-icon> 切换视图
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <!-- 搜索栏 -->
      <div class="mobile-search" v-if="showSearch">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文件..."
          @input="handleSearch"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #suffix>
            <el-button @click="showSearch = false" text>
              <el-icon><Close /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
      
      <!-- 快速操作栏 -->
      <div class="mobile-actions" v-if="!showSearch">
        <el-button @click="showSearch = true" :icon="Search" circle size="small" />
        <el-button @click="toggleViewMode" :icon="viewMode === 'grid' ? List : Grid" circle size="small" />
        <el-button @click="handleSort" :icon="Sort" circle size="small" />
      </div>
    </header>

    <!-- 侧边栏遮罩 -->
    <div 
      v-if="sidebarVisible" 
      class="sidebar-overlay"
      @click="closeSidebar"
    />

    <!-- 移动端侧边栏 -->
    <aside class="mobile-sidebar" :class="{ 'sidebar-open': sidebarVisible }">
      <div class="sidebar-header">
        <h3>文件管理器</h3>
        <el-button @click="closeSidebar" :icon="Close" text />
      </div>
      
      <!-- 快速访问 -->
      <div class="quick-access">
        <h4>快速访问</h4>
        <ul class="quick-list">
          <li @click="navigateTo('')" :class="{ active: currentPath === '' }">
            <el-icon><House /></el-icon>
            <span>根目录</span>
          </li>
          <li @click="navigateTo('recent')" :class="{ active: currentPath === 'recent' }">
            <el-icon><Clock /></el-icon>
            <span>最近文件</span>
          </li>
          <li @click="navigateTo('favorites')" :class="{ active: currentPath === 'favorites' }">
            <el-icon><Star /></el-icon>
            <span>收藏夹</span>
          </li>
        </ul>
      </div>
      
      <!-- 文件夹树 -->
      <div class="folder-tree">
        <h4>文件夹</h4>
        <DirectoryTree 
          ref="directoryTreeRef" 
          @directory-selected="onDirectorySelected"
          :current-path="currentPath"
          mobile
        />
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="mobile-content">
      <!-- 文件列表 -->
      <div class="file-list-container">
        <MobileFileBrowser 
          ref="fileBrowserRef" 
          :directory="currentPath"
          :view-mode="viewMode"
          :search-query="searchQuery"
          :sort-by="sortField"
          :sort-order="sortOrder"
          @file-selected="onFileSelected"
          @selection-changed="onSelectionChanged"
          @item-double-click="onItemDoubleClick"
        />
      </div>
      
      <!-- 选择状态栏 -->
      <div v-if="selectedFiles.length > 0" class="selection-bar">
        <div class="selection-info">
          <span>已选择 {{ selectedFiles.length }} 个项目</span>
        </div>
        <div class="selection-actions">
          <el-button @click="handleBatchDelete" type="danger" size="small">
            <el-icon><Delete /></el-icon>
          </el-button>
          <el-button @click="handleBatchMove" size="small">
            <el-icon><FolderOpened /></el-icon>
          </el-button>
          <el-button @click="clearSelection" size="small">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </main>

    <!-- 浮动操作按钮 -->
    <div class="fab-container">
      <el-button 
        type="primary" 
        :icon="Plus" 
        circle 
        size="large"
        class="fab-main"
        @click="toggleFabMenu"
      />
      
      <transition-group name="fab" class="fab-menu" v-if="fabMenuOpen">
        <el-button 
          key="upload"
          type="success" 
          :icon="Upload" 
          circle 
          class="fab-item"
          @click="handleUpload"
        />
        <el-button 
          key="folder"
          type="warning" 
          :icon="FolderAdd" 
          circle 
          class="fab-item"
          @click="handleCreateFolder"
        />
      </transition-group>
    </div>

    <!-- 文件详情抽屉 -->
    <el-drawer
      v-model="showFileDetails"
      title="文件详情"
      direction="btt"
      size="60%"
    >
      <FilePropertiesPanel 
        v-if="selectedFile"
        :selected-file="selectedFile"
        :selected-files="selectedFiles"
        @file-action="handleFileAction"
        mobile
      />
    </el-drawer>

    <!-- 对话框 -->
    <FileManagerDialogs 
      v-model:create-folder-visible="createFolderDialogVisible"
      v-model:rename-visible="renameDialogVisible"
      v-model:upload-visible="uploadDialogVisible"
      :current-path="currentPath"
      :rename-target="renameTarget"
      @folder-created="onFolderCreated"
      @file-renamed="onFileRenamed"
      @files-uploaded="onFilesUploaded"
      mobile
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Menu, MoreFilled, Upload, FolderAdd, Refresh, Grid, List, Search, Close,
  House, Clock, Star, Sort, Delete, FolderOpened, Plus
} from '@element-plus/icons-vue';

// 组件导入
import DirectoryTree from './DirectoryTree.vue';
import MobileFileBrowser from './MobileFileBrowser.vue';
import FilePropertiesPanel from './FilePropertiesPanel.vue';
import FileManagerDialogs from './FileManagerDialogs.vue';

// Props
const props = defineProps({
  currentPath: String,
  selectedFile: Object,
  selectedFiles: Array
});

// Emits
const emit = defineEmits([
  'navigate-to', 'file-selected', 'selection-changed', 'item-double-click',
  'upload', 'create-folder', 'refresh', 'file-action'
]);

// 响应式数据
const sidebarVisible = ref(false);
const showSearch = ref(false);
const searchQuery = ref('');
const viewMode = ref('grid');
const sortField = ref('name');
const sortOrder = ref('asc');
const fabMenuOpen = ref(false);
const showFileDetails = ref(false);

// 对话框状态
const createFolderDialogVisible = ref(false);
const renameDialogVisible = ref(false);
const uploadDialogVisible = ref(false);
const renameTarget = ref(null);

// 组件引用
const directoryTreeRef = ref(null);
const fileBrowserRef = ref(null);

// 计算属性
const getCurrentFolderName = () => {
  if (!props.currentPath) return '根目录';
  return props.currentPath.split('/').pop();
};

// 方法
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

const closeSidebar = () => {
  sidebarVisible.value = false;
};

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
};

const toggleFabMenu = () => {
  fabMenuOpen.value = !fabMenuOpen.value;
};

const handleSearch = (query) => {
  // 搜索逻辑
};

const handleSort = () => {
  // 显示排序选项
  ElMessageBox.confirm('选择排序方式', '排序', {
    distinguishCancelAndClose: true,
    confirmButtonText: '按名称',
    cancelButtonText: '按日期',
    type: 'info'
  }).then(() => {
    sortField.value = 'name';
  }).catch((action) => {
    if (action === 'cancel') {
      sortField.value = 'date';
    }
  });
};

const navigateTo = (path) => {
  emit('navigate-to', path);
  closeSidebar();
};

const onDirectorySelected = (path) => {
  emit('navigate-to', path);
  closeSidebar();
};

const onFileSelected = (file) => {
  emit('file-selected', file);
  if (file) {
    showFileDetails.value = true;
  }
};

const onSelectionChanged = (files) => {
  emit('selection-changed', files);
};

const onItemDoubleClick = (item) => {
  emit('item-double-click', item);
};

const clearSelection = () => {
  emit('selection-changed', []);
};

const handleUpload = () => {
  uploadDialogVisible.value = true;
  fabMenuOpen.value = false;
};

const handleCreateFolder = () => {
  createFolderDialogVisible.value = true;
  fabMenuOpen.value = false;
};

const handleRefresh = () => {
  emit('refresh');
};

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${props.selectedFiles.length} 个项目吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    emit('file-action', 'batch-delete', props.selectedFiles);
  } catch {
    // 用户取消
  }
};

const handleBatchMove = () => {
  emit('file-action', 'batch-move', props.selectedFiles);
};

const handleFileAction = (action, file) => {
  emit('file-action', action, file);
};

const onFolderCreated = () => {
  emit('refresh');
};

const onFileRenamed = () => {
  emit('refresh');
};

const onFilesUploaded = () => {
  emit('refresh');
};

// 处理点击外部关闭FAB菜单
const handleClickOutside = (event) => {
  if (fabMenuOpen.value && !event.target.closest('.fab-container')) {
    fabMenuOpen.value = false;
  }
};

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.mobile-file-manager {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color);
}

/* 移动端头部 */
.mobile-header {
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.mobile-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.breadcrumb-mobile {
  flex: 1;
  text-align: center;
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.mobile-search {
  margin-top: 8px;
}

.mobile-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
}

/* 侧边栏 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
}

.mobile-sidebar {
  position: fixed;
  top: 0;
  left: -300px;
  width: 300px;
  height: 100vh;
  background: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color-light);
  transition: left 0.3s ease;
  z-index: 300;
  overflow-y: auto;
}

.mobile-sidebar.sidebar-open {
  left: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.quick-access, .folder-tree {
  padding: 16px;
}

.quick-access h4, .folder-tree h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.quick-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.quick-list li {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 12px;
}

.quick-list li:hover {
  background: var(--el-fill-color-light);
}

.quick-list li.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 主内容区 */
.mobile-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.file-list-container {
  flex: 1;
  overflow: auto;
}

/* 选择状态栏 */
.selection-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-color-primary-light-9);
  border-top: 1px solid var(--el-color-primary-light-7);
}

.selection-info {
  font-size: 14px;
  color: var(--el-color-primary);
  font-weight: 500;
}

.selection-actions {
  display: flex;
  gap: 8px;
}

/* 浮动操作按钮 */
.fab-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 150;
}

.fab-main {
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.fab-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fab-item {
  width: 48px;
  height: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* FAB动画 */
.fab-enter-active, .fab-leave-active {
  transition: all 0.3s ease;
}

.fab-enter-from, .fab-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.8);
}

/* 响应式调整 */
@media (max-width: 480px) {
  .mobile-sidebar {
    width: 280px;
    left: -280px;
  }
  
  .fab-container {
    bottom: 20px;
    right: 20px;
  }
  
  .fab-main {
    width: 48px;
    height: 48px;
  }
  
  .fab-item {
    width: 40px;
    height: 40px;
  }
}

/* 深色模式适配 */
.dark .mobile-header {
  background: var(--el-bg-color-page);
  border-bottom-color: var(--el-border-color);
}

.dark .mobile-sidebar {
  background: var(--el-bg-color-page);
  border-right-color: var(--el-border-color);
}

.dark .selection-bar {
  background: var(--el-color-primary-dark-2);
  border-top-color: var(--el-color-primary);
}
</style>
