<template>
  <div class="explorer-sidebar">
    <!-- 快速访问区域 -->
    <div class="sidebar-section">
      <div class="section-header">
        <el-icon><Star /></el-icon>
        <span>快速访问</span>
      </div>
      <div class="section-content">
        <div
          v-for="item in quickAccessItems"
          :key="item.path"
          class="sidebar-item quick-access-item"
          :class="{ 'active': item.path === currentPath }"
          @click="navigateTo(item.path)"
        >
          <el-icon :class="item.iconClass">
            <component :is="item.icon" />
          </el-icon>
          <span class="item-label">{{ item.name }}</span>
        </div>
      </div>
    </div>

    <!-- 文件夹树 -->
    <div class="sidebar-section folder-tree-section">
      <div class="section-header">
        <el-icon><Folder /></el-icon>
        <span>文件夹</span>
      </div>
      <div class="section-content">
        <el-scrollbar height="400px">
          <FolderTreeNode
            v-for="node in rootNodes"
            :key="node.path"
            :node="node"
            :current-path="currentPath"
            :expanded-folders="expandedFolders"
            :level="0"
            @navigate-to="navigateTo"
            @folder-expand="$emit('folder-expand', $event)"
            @folder-collapse="$emit('folder-collapse', $event)"
            @context-menu="$emit('context-menu', $event, node)"
          />
        </el-scrollbar>
      </div>
    </div>

    <!-- 最近访问 -->
    <div class="sidebar-section">
      <div class="section-header">
        <el-icon><Clock /></el-icon>
        <span>最近访问</span>
      </div>
      <div class="section-content">
        <div
          v-for="item in recentItems"
          :key="item.path"
          class="sidebar-item recent-item"
          :class="{ 'active': item.path === currentPath }"
          @click="navigateTo(item.path)"
          :title="item.path"
        >
          <el-icon>
            <component :is="getFileIcon(item)" />
          </el-icon>
          <span class="item-label">{{ item.name }}</span>
          <span class="item-time">{{ formatTime(item.lastAccessed) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import {
  Star,
  Folder,
  Clock,
  FolderOpened,
  Document,
  Picture,
  VideoCamera,
  Headphones,
  Files
} from '@element-plus/icons-vue'
import FolderTreeNode from './FolderTreeNode.vue'

// Props
const props = defineProps({
  currentPath: {
    type: String,
    required: true
  },
  expandedFolders: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'navigate-to',
  'folder-expand',
  'folder-collapse',
  'context-menu'
])

// Vuex store
const store = useStore()

// 响应式数据
const rootNodes = ref([])
const recentItems = ref([])

// 快速访问项目
const quickAccessItems = computed(() => [
  {
    name: '根目录',
    path: '/',
    icon: Folder,
    iconClass: 'folder-icon'
  },
  {
    name: '图片',
    path: '/images',
    icon: Picture,
    iconClass: 'image-icon'
  },
  {
    name: '视频',
    path: '/videos',
    icon: VideoCamera,
    iconClass: 'video-icon'
  },
  {
    name: '音频',
    path: '/audio',
    icon: Headphones,
    iconClass: 'audio-icon'
  },
  {
    name: '文档',
    path: '/documents',
    icon: Document,
    iconClass: 'document-icon'
  }
])

// 导航处理
const navigateTo = (path) => {
  emit('navigate-to', path)
}

// 获取文件图标
const getFileIcon = (item) => {
  if (item.type === 'folder') {
    return Folder
  }
  
  const ext = item.name.split('.').pop()?.toLowerCase()
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
    return Picture
  } else if (['mp4', 'avi', 'mkv', 'mov', 'wmv'].includes(ext)) {
    return VideoCamera
  } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
    return Headphones
  } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
    return Document
  } else {
    return Files
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 604800000) { // 1周内
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 加载文件夹树
const loadFolderTree = async () => {
  try {
    const response = await store.dispatch('fileManager/loadFolderTree')
    rootNodes.value = response || []
  } catch (error) {
    console.error('Failed to load folder tree:', error)
  }
}

// 加载最近访问项目
const loadRecentItems = async () => {
  try {
    const response = await store.dispatch('fileManager/loadRecentItems')
    recentItems.value = response || []
  } catch (error) {
    console.error('Failed to load recent items:', error)
  }
}

// 生命周期
onMounted(() => {
  loadFolderTree()
  loadRecentItems()
})
</script>

<style scoped>
.explorer-sidebar {
  width: 250px;
  background-color: var(--explorer-sidebar-bg, var(--el-bg-color-page));
  border-right: 1px solid var(--explorer-border, var(--el-border-color));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-section {
  margin-bottom: 16px;
}

.sidebar-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  background-color: var(--el-fill-color-extra-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-header .el-icon {
  margin-right: 8px;
  font-size: 14px;
}

.section-content {
  padding: 4px 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;
  position: relative;
}

.sidebar-item:hover {
  background-color: var(--explorer-hover, var(--el-fill-color-light));
  color: var(--el-text-color-primary);
}

.sidebar-item.active {
  background-color: var(--explorer-selected, var(--el-color-primary-light-8));
  color: var(--el-color-primary);
  font-weight: 500;
}

.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--el-color-primary);
}

.sidebar-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
  flex-shrink: 0;
}

.item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-left: 8px;
}

/* 快速访问项目图标颜色 */
.folder-icon {
  color: #ffa500;
}

.image-icon {
  color: #ff6b6b;
}

.video-icon {
  color: #4ecdc4;
}

.audio-icon {
  color: #45b7d1;
}

.document-icon {
  color: #96ceb4;
}

/* 文件夹树区域 */
.folder-tree-section {
  flex: 1;
  overflow: hidden;
}

.folder-tree-section .section-content {
  height: 100%;
  padding: 0;
}

/* 最近访问项目 */
.recent-item {
  padding-right: 8px;
}

.recent-item .item-label {
  margin-right: 8px;
}

/* 滚动条样式 */
:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .explorer-sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--explorer-border, var(--el-border-color));
  }
  
  .sidebar-section {
    margin-bottom: 8px;
  }
  
  .section-content {
    max-height: 120px;
    overflow-y: auto;
  }
}

/* 深色主题适配 */
.dark-theme .section-header {
  background-color: var(--el-fill-color-darker);
}

/* 动画效果 */
.sidebar-item {
  position: relative;
  overflow: hidden;
}

.sidebar-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s;
}

.sidebar-item:hover::after {
  left: 100%;
}

/* 加载状态 */
.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.loading-placeholder .el-icon {
  margin-right: 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
