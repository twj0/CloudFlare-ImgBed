<template>
  <!-- 移动端版本 -->
  <MobileFileManager
    v-if="isMobile"
    :current-path="currentPath"
    :selected-file="selectedFile"
    :selected-files="selectedFiles"
    @navigate-to="navigateTo"
    @file-selected="onFileSelected"
    @selection-changed="onSelectionChanged"
    @item-double-click="onItemDoubleClick"
    @upload="handleUpload"
    @create-folder="handleCreateFolder"
    @refresh="handleRefresh"
    @file-action="handleFileAction"
  />

  <!-- 桌面端版本 -->
  <div v-else class="modern-file-manager">
    <!-- 顶部工具栏 -->
    <header class="file-manager-toolbar">
      <div class="toolbar-left">
        <!-- 导航按钮 -->
        <el-button-group class="nav-buttons">
          <el-button :disabled="!canGoBack" @click="goBack" :icon="ArrowLeft" />
          <el-button :disabled="!canGoForward" @click="goForward" :icon="ArrowRight" />
          <el-button @click="goUp" :icon="Top" />
        </el-button-group>

        <!-- 操作按钮 -->
        <el-button-group class="action-buttons">
          <el-button type="primary" @click="handleUpload" :icon="Upload">上传</el-button>
          <el-button @click="handleCreateFolder" :icon="FolderAdd">新建文件夹</el-button>
          <el-button @click="handleRefresh" :icon="Refresh">刷新</el-button>
        </el-button-group>
      </div>

      <div class="toolbar-right">
        <!-- 视图切换 -->
        <el-radio-group v-model="viewMode" size="small" class="view-toggle">
          <el-radio-button label="list">
            <el-icon><List /></el-icon>
          </el-radio-button>
          <el-radio-button label="grid">
            <el-icon><Grid /></el-icon>
          </el-radio-button>
          <el-radio-button label="detail">
            <el-icon><Document /></el-icon>
          </el-radio-button>
        </el-radio-group>

        <!-- 排序选项 -->
        <el-dropdown class="sort-dropdown">
          <el-button>
            排序 <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="sortBy('name')">按名称</el-dropdown-item>
              <el-dropdown-item @click="sortBy('date')">按日期</el-dropdown-item>
              <el-dropdown-item @click="sortBy('size')">按大小</el-dropdown-item>
              <el-dropdown-item @click="sortBy('type')">按类型</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 导航栏 -->
    <nav class="navigation-bar">
      <!-- 面包屑导航 -->
      <el-breadcrumb class="breadcrumb" separator="/">
        <el-breadcrumb-item
          v-for="(item, index) in breadcrumbs"
          :key="index"
          @click="navigateTo(item.path)"
          class="breadcrumb-item"
        >
          <el-icon v-if="index === 0"><House /></el-icon>
          {{ item.name }}
        </el-breadcrumb-item>
      </el-breadcrumb>

      <!-- 搜索框 -->
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文件和文件夹..."
          @input="handleSearch"
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="main-layout">
      <!-- 侧边栏 -->
      <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <div class="sidebar-header">
          <h3 v-if="!sidebarCollapsed">文件管理器</h3>
          <el-button
            @click="toggleSidebar"
            :icon="sidebarCollapsed ? Expand : Fold"
            text
            class="sidebar-toggle"
          />
        </div>

        <!-- 快速访问 -->
        <div v-if="!sidebarCollapsed" class="quick-access">
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
        <div v-if="!sidebarCollapsed" class="folder-tree">
          <h4>文件夹</h4>
          <DirectoryTree
            ref="directoryTreeRef"
            @directory-selected="onDirectorySelected"
            :current-path="currentPath"
          />
        </div>
      </aside>

      <!-- 主内容区 -->
      <section class="content-area">
        <ModernFileBrowser
          ref="fileBrowserRef"
          :directory="currentPath"
          :view-mode="viewMode"
          :search-query="searchQuery"
          :sort-by="sortField"
          :sort-order="sortOrder"
          @file-selected="onFileSelected"
          @selection-changed="onSelectionChanged"
        />
      </section>

      <!-- 属性面板 -->
      <aside class="properties-panel" v-if="showPropertiesPanel">
        <FilePropertiesPanel
          :selected-file="selectedFile"
          :selected-files="selectedFiles"
          @file-action="handleFileAction"
        />
      </aside>
    </main>

    <!-- 状态栏 -->
    <footer class="status-bar">
      <div class="status-left">
        <span v-if="selectedFiles.length > 0">
          已选择 {{ selectedFiles.length }} 个项目
        </span>
        <span v-else>
          {{ fileCount }} 个项目
        </span>
      </div>
      <div class="status-right">
        <span v-if="loading">加载中...</span>
        <span v-else-if="lastUpdated">
          最后更新: {{ formatTime(lastUpdated) }}
        </span>
      </div>
    </footer>

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
    />

    <!-- 右键菜单 -->
    <ContextMenu
      ref="contextMenuRef"
      :items="contextMenuItems"
      @item-click="handleContextMenuClick"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft, ArrowRight, Top, Upload, FolderAdd, Refresh,
  List, Grid, Document, ArrowDown, House, Search, Clock, Star,
  Expand, Fold
} from '@element-plus/icons-vue';

// 组件导入
import DirectoryTree from '@/components/DirectoryTree.vue';
import ModernFileBrowser from '@/components/ModernFileBrowser.vue';
import FilePropertiesPanel from '@/components/FilePropertiesPanel.vue';
import FileManagerDialogs from '@/components/FileManagerDialogs.vue';
import ContextMenu from '@/components/ContextMenu.vue';
import MobileFileManager from '@/components/MobileFileManager.vue';

// 响应式数据
const currentPath = ref('');
const viewMode = ref('list'); // 'list', 'grid', 'detail'
const searchQuery = ref('');
const sortField = ref('name');
const sortOrder = ref('asc');
const loading = ref(false);
const lastUpdated = ref(null);

// 移动端检测
const isMobile = ref(false);

// 导航相关
const navigationHistory = ref([]);
const currentHistoryIndex = ref(-1);
const breadcrumbs = ref([{ name: '根目录', path: '' }]);

// 侧边栏状态
const sidebarCollapsed = ref(false);
const showPropertiesPanel = ref(true);

// 文件选择相关
const selectedFile = ref(null);
const selectedFiles = ref([]);
const fileCount = ref(0);

// 对话框状态
const createFolderDialogVisible = ref(false);
const renameDialogVisible = ref(false);
const uploadDialogVisible = ref(false);
const renameTarget = ref(null);

// 组件引用
const directoryTreeRef = ref(null);
const fileBrowserRef = ref(null);
const contextMenuRef = ref(null);

// 计算属性
const canGoBack = computed(() => currentHistoryIndex.value > 0);
const canGoForward = computed(() => currentHistoryIndex.value < navigationHistory.value.length - 1);

// 右键菜单项
const contextMenuItems = computed(() => {
  const items = [
    { label: '刷新', icon: 'Refresh', action: 'refresh' },
    { type: 'divider' },
    { label: '新建文件夹', icon: 'FolderAdd', action: 'create-folder' },
    { label: '上传文件', icon: 'Upload', action: 'upload' },
  ];

  if (selectedFiles.value.length > 0) {
    items.push(
      { type: 'divider' },
      { label: '重命名', icon: 'Edit', action: 'rename', disabled: selectedFiles.value.length > 1 },
      { label: '删除', icon: 'Delete', action: 'delete', danger: true },
      { label: '复制链接', icon: 'Link', action: 'copy-link' }
    );
  }

  return items;
});

// 导航方法
const navigateTo = (path) => {
  if (path === currentPath.value) return;

  // 添加到历史记录
  if (currentHistoryIndex.value < navigationHistory.value.length - 1) {
    navigationHistory.value = navigationHistory.value.slice(0, currentHistoryIndex.value + 1);
  }
  navigationHistory.value.push(path);
  currentHistoryIndex.value = navigationHistory.value.length - 1;

  currentPath.value = path;
  updateBreadcrumbs(path);
};

const goBack = () => {
  if (canGoBack.value) {
    currentHistoryIndex.value--;
    currentPath.value = navigationHistory.value[currentHistoryIndex.value];
    updateBreadcrumbs(currentPath.value);
  }
};

const goForward = () => {
  if (canGoForward.value) {
    currentHistoryIndex.value++;
    currentPath.value = navigationHistory.value[currentHistoryIndex.value];
    updateBreadcrumbs(currentPath.value);
  }
};

const goUp = () => {
  if (currentPath.value) {
    const parentPath = currentPath.value.split('/').slice(0, -1).join('/');
    navigateTo(parentPath);
  }
};

const updateBreadcrumbs = (path) => {
  const parts = path ? path.split('/').filter(Boolean) : [];
  breadcrumbs.value = [{ name: '根目录', path: '' }];

  let currentPath = '';
  parts.forEach(part => {
    currentPath += (currentPath ? '/' : '') + part;
    breadcrumbs.value.push({ name: part, path: currentPath });
  });
};

// 事件处理方法
const onDirectorySelected = (path) => {
  navigateTo(path);
};

const onFileSelected = (file) => {
  selectedFile.value = file;
  selectedFiles.value = file ? [file] : [];
};

const onSelectionChanged = (files) => {
  selectedFiles.value = files;
  selectedFile.value = files.length === 1 ? files[0] : null;
};

// 工具栏操作
const handleUpload = () => {
  uploadDialogVisible.value = true;
};

const handleCreateFolder = () => {
  createFolderDialogVisible.value = true;
};

const handleRefresh = () => {
  if (fileBrowserRef.value) {
    fileBrowserRef.value.refresh();
  }
  if (directoryTreeRef.value) {
    directoryTreeRef.value.refresh();
  }
  lastUpdated.value = new Date();
};

// 搜索和排序
const handleSearch = (query) => {
  // 搜索逻辑将在FileBrowser组件中处理
};

const sortBy = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
};

// 侧边栏控制
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// 文件操作
const handleFileAction = (action, file) => {
  switch (action) {
    case 'rename':
      renameTarget.value = file;
      renameDialogVisible.value = true;
      break;
    case 'delete':
      handleDeleteFile(file);
      break;
    case 'download':
      handleDownloadFile(file);
      break;
    case 'copy-link':
      handleCopyLink(file);
      break;
  }
};

const handleDeleteFile = async (file) => {
  try {
    // 删除文件的API调用
    ElMessage.success('文件删除成功');
    handleRefresh();
  } catch (error) {
    ElMessage.error('删除文件失败');
  }
};

const handleDownloadFile = (file) => {
  // 下载文件逻辑
  window.open(file.url, '_blank');
};

const handleCopyLink = async (file) => {
  try {
    await navigator.clipboard.writeText(file.url);
    ElMessage.success('链接已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制链接失败');
  }
};

// 右键菜单
const handleContextMenuClick = (action) => {
  switch (action) {
    case 'refresh':
      handleRefresh();
      break;
    case 'create-folder':
      handleCreateFolder();
      break;
    case 'upload':
      handleUpload();
      break;
    case 'rename':
      if (selectedFiles.value.length === 1) {
        handleFileAction('rename', selectedFiles.value[0]);
      }
      break;
    case 'delete':
      if (selectedFiles.value.length > 0) {
        // 批量删除逻辑
      }
      break;
    case 'copy-link':
      if (selectedFiles.value.length === 1) {
        handleFileAction('copy-link', selectedFiles.value[0]);
      }
      break;
  }
};

// 对话框事件
const onFolderCreated = () => {
  handleRefresh();
};

const onFileRenamed = () => {
  handleRefresh();
};

const onFilesUploaded = () => {
  handleRefresh();
};

// 工具方法
const formatTime = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

// 响应式设计
const handleResize = () => {
  const width = window.innerWidth;

  // 移动端检测
  isMobile.value = width < 768;

  if (width < 768) {
    sidebarCollapsed.value = true;
    showPropertiesPanel.value = false;
  } else if (width < 1200) {
    showPropertiesPanel.value = false;
  } else {
    showPropertiesPanel.value = true;
  }
};

// 移动端特殊处理
const onItemDoubleClick = (item) => {
  if (item.type === 'directory') {
    navigateTo(item.id);
  } else {
    // 文件双击处理
    if (isMobile.value) {
      // 移动端显示文件详情
      selectedFile.value = item;
    } else {
      // 桌面端可能打开预览
      handleFileAction('preview', item);
    }
  }
};

// 生命周期
onMounted(() => {
  // 初始化导航历史
  navigationHistory.value = [''];
  currentHistoryIndex.value = 0;

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
  handleResize();

  // 初始化数据
  lastUpdated.value = new Date();
});

// 监听路径变化
watch(currentPath, (newPath) => {
  updateBreadcrumbs(newPath);
});
</script>

<style scoped>
.modern-file-manager {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  height: 100vh;
  background: var(--el-bg-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 顶部工具栏 */
.file-manager-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-buttons .el-button {
  padding: 8px 12px;
}

.action-buttons .el-button {
  padding: 8px 16px;
}

.view-toggle {
  border-radius: 6px;
}

.sort-dropdown {
  margin-left: 8px;
}

/* 导航栏 */
.navigation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-light);
}

.breadcrumb {
  flex: 1;
}

.breadcrumb-item {
  cursor: pointer;
  transition: color 0.2s;
}

.breadcrumb-item:hover {
  color: var(--el-color-primary);
}

.search-container {
  width: 300px;
}

.search-input {
  border-radius: 20px;
}

/* 主要布局 */
.main-layout {
  display: grid;
  grid-template-columns: auto 1fr auto;
  height: 100%;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  background: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar-collapsed {
  width: 60px;
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
  color: var(--el-text-color-primary);
}

.sidebar-toggle {
  padding: 4px;
}

.quick-access {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.quick-access h4 {
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
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 8px;
}

.quick-list li:hover {
  background: var(--el-fill-color-light);
}

.quick-list li.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.folder-tree {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.folder-tree h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

/* 主内容区 */
.content-area {
  flex: 1;
  background: var(--el-bg-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 属性面板 */
.properties-panel {
  width: 320px;
  background: var(--el-bg-color-page);
  border-left: 1px solid var(--el-border-color-light);
  overflow-y: auto;
}

/* 状态栏 */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-light);
  font-size: 12px;
  color: var(--el-text-color-regular);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: auto 1fr;
  }

  .properties-panel {
    display: none;
  }
}

@media (max-width: 768px) {
  .file-manager-toolbar {
    padding: 8px 12px;
  }

  .toolbar-left {
    gap: 8px;
  }

  .action-buttons .el-button span {
    display: none;
  }

  .navigation-bar {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }

  .search-container {
    width: 100%;
  }

  .main-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s ease;
  }

  .sidebar.open {
    left: 0;
  }

  .sidebar-collapsed {
    left: -60px;
  }
}

@media (max-width: 480px) {
  .nav-buttons {
    display: none;
  }

  .view-toggle .el-radio-button__inner {
    padding: 8px;
  }

  .view-toggle .el-radio-button__inner span {
    display: none;
  }
}

/* 深色模式适配 */
.dark .modern-file-manager {
  background: var(--el-bg-color);
}

.dark .file-manager-toolbar {
  background: var(--el-bg-color-page);
  border-bottom-color: var(--el-border-color);
}

.dark .navigation-bar {
  background: var(--el-fill-color-darker);
  border-bottom-color: var(--el-border-color);
}

.dark .sidebar {
  background: var(--el-bg-color-page);
  border-right-color: var(--el-border-color);
}

.dark .properties-panel {
  background: var(--el-bg-color-page);
  border-left-color: var(--el-border-color);
}

.dark .status-bar {
  background: var(--el-fill-color-darker);
  border-top-color: var(--el-border-color);
}
</style>