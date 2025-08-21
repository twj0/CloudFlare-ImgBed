<template>
  <div class="folder-tree-node">
    <!-- 当前节点 -->
    <div
      class="tree-node-content"
      :class="{
        'active': node.path === currentPath,
        'expanded': isExpanded,
        'has-children': hasChildren
      }"
      :style="{ paddingLeft: `${level * 16 + 16}px` }"
      @click="handleNodeClick"
      @contextmenu.prevent="handleContextMenu"
    >
      <!-- 展开/折叠图标 -->
      <div
        v-if="hasChildren"
        class="expand-icon"
        @click.stop="toggleExpand"
      >
        <el-icon :class="{ 'expanded': isExpanded }">
          <ArrowRight />
        </el-icon>
      </div>
      <div v-else class="expand-placeholder"></div>

      <!-- 文件夹图标 -->
      <el-icon class="folder-icon" :class="{ 'open': isExpanded }">
        <component :is="isExpanded ? FolderOpened : Folder" />
      </el-icon>

      <!-- 文件夹名称 -->
      <span class="node-label" :title="node.name">{{ node.name }}</span>

      <!-- 加载指示器 -->
      <el-icon v-if="loading" class="loading-icon">
        <Loading />
      </el-icon>
    </div>

    <!-- 子节点 -->
    <transition name="slide-down">
      <div v-if="isExpanded && children.length > 0" class="tree-children">
        <FolderTreeNode
          v-for="child in children"
          :key="child.path"
          :node="child"
          :current-path="currentPath"
          :expanded-folders="expandedFolders"
          :level="level + 1"
          @navigate-to="$emit('navigate-to', $event)"
          @folder-expand="$emit('folder-expand', $event)"
          @folder-collapse="$emit('folder-collapse', $event)"
          @context-menu="$emit('context-menu', $event, child)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import {
  ArrowRight,
  Folder,
  FolderOpened,
  Loading
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  currentPath: {
    type: String,
    required: true
  },
  expandedFolders: {
    type: Array,
    default: () => []
  },
  level: {
    type: Number,
    default: 0
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
const children = ref([])
const loading = ref(false)

// 计算属性
const isExpanded = computed(() => {
  return props.expandedFolders.includes(props.node.path)
})

const hasChildren = computed(() => {
  return props.node.hasChildren || children.value.length > 0
})

// 监听展开状态变化
watch(isExpanded, async (newValue) => {
  if (newValue && children.value.length === 0) {
    await loadChildren()
  }
})

// 处理节点点击
const handleNodeClick = () => {
  emit('navigate-to', props.node.path)
}

// 处理右键菜单
const handleContextMenu = (event) => {
  emit('context-menu', event, props.node)
}

// 切换展开状态
const toggleExpand = async () => {
  if (isExpanded.value) {
    emit('folder-collapse', props.node.path)
  } else {
    emit('folder-expand', props.node.path)
    if (children.value.length === 0) {
      await loadChildren()
    }
  }
}

// 加载子节点
const loadChildren = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    const response = await store.dispatch('fileManager/loadFolderChildren', props.node.path)
    children.value = response.filter(item => item.type === 'folder') || []
  } catch (error) {
    console.error('Failed to load folder children:', error)
    children.value = []
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.folder-tree-node {
  user-select: none;
}

.tree-node-content {
  display: flex;
  align-items: center;
  padding: 4px 16px 4px 0;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;
  position: relative;
  min-height: 28px;
}

.tree-node-content:hover {
  background-color: var(--explorer-hover, var(--el-fill-color-light));
  color: var(--el-text-color-primary);
}

.tree-node-content.active {
  background-color: var(--explorer-selected, var(--el-color-primary-light-8));
  color: var(--el-color-primary);
  font-weight: 500;
}

.tree-node-content.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--el-color-primary);
}

.expand-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.expand-icon:hover {
  background-color: var(--el-fill-color);
}

.expand-icon .el-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.expand-icon .el-icon.expanded {
  transform: rotate(90deg);
}

.expand-placeholder {
  width: 20px;
  height: 16px;
  flex-shrink: 0;
}

.folder-icon {
  margin-right: 8px;
  font-size: 16px;
  flex-shrink: 0;
  color: #ffa500;
  transition: color 0.2s ease;
}

.folder-icon.open {
  color: #ffb84d;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.loading-icon {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-color-primary);
  animation: spin 1s linear infinite;
}

.tree-children {
  overflow: hidden;
}

/* 动画效果 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  transform-origin: top;
}

.slide-down-enter-from {
  opacity: 0;
  transform: scaleY(0);
}

.slide-down-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

/* 连接线样式 */
.tree-node-content::after {
  content: '';
  position: absolute;
  left: calc(var(--level) * 16px + 8px);
  top: 0;
  bottom: 50%;
  width: 1px;
  background-color: var(--el-border-color-lighter);
  opacity: 0.5;
}

.tree-node-content:last-child::after {
  display: none;
}

/* 水平连接线 */
.tree-node-content::before {
  content: '';
  position: absolute;
  left: calc(var(--level) * 16px + 8px);
  top: 50%;
  width: 8px;
  height: 1px;
  background-color: var(--el-border-color-lighter);
  opacity: 0.5;
}

.tree-node-content[style*="padding-left: 16px"]::before,
.tree-node-content[style*="padding-left: 16px"]::after {
  display: none;
}

/* 旋转动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 深色主题适配 */
.dark-theme .tree-node-content::after,
.dark-theme .tree-node-content::before {
  background-color: var(--el-border-color-dark);
}

/* 焦点状态 */
.tree-node-content:focus {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

/* 拖拽状态 */
.tree-node-content.drag-over {
  background-color: var(--el-color-primary-light-8);
  border: 1px dashed var(--el-color-primary);
}

.tree-node-content.drag-source {
  opacity: 0.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tree-node-content {
    padding: 6px 12px 6px 0;
    min-height: 32px;
  }
  
  .folder-icon {
    font-size: 18px;
  }
  
  .node-label {
    font-size: 14px;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .tree-node-content {
    border: 1px solid transparent;
  }
  
  .tree-node-content:hover {
    border-color: var(--el-text-color-primary);
  }
  
  .tree-node-content.active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary);
    color: white;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .expand-icon .el-icon,
  .slide-down-enter-active,
  .slide-down-leave-active,
  .tree-node-content {
    transition: none;
  }
  
  .loading-icon {
    animation: none;
  }
}
</style>
