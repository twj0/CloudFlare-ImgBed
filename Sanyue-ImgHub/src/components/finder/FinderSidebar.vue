<template>
  <div class="finder-sidebar">
    <!-- 收藏夹 -->
    <div class="sidebar-section">
      <div class="section-header">
        <el-icon><Star /></el-icon>
        <span>收藏夹</span>
      </div>
      <div class="section-content">
        <div
          v-for="item in favorites"
          :key="item.path"
          class="sidebar-item"
          :class="{ 'active': item.path === currentPath }"
          @click="$emit('navigate', item.path)"
        >
          <el-icon class="item-icon">
            <Folder v-if="item.type === 'folder'" />
            <Picture v-else-if="item.type === 'image'" />
            <Document v-else />
          </el-icon>
          <span class="item-label">{{ item.name }}</span>
        </div>
      </div>
    </div>
    
    <!-- 设备 -->
    <div class="sidebar-section">
      <div class="section-header">
        <el-icon><Monitor /></el-icon>
        <span>位置</span>
      </div>
      <div class="section-content">
        <div
          class="sidebar-item"
          :class="{ 'active': currentPath === '/' }"
          @click="$emit('navigate', '/')"
        >
          <el-icon class="item-icon">
            <Folder />
          </el-icon>
          <span class="item-label">图床根目录</span>
        </div>
        <div
          class="sidebar-item"
          :class="{ 'active': currentPath === '/images' }"
          @click="$emit('navigate', '/images')"
        >
          <el-icon class="item-icon">
            <Picture />
          </el-icon>
          <span class="item-label">我的图片</span>
        </div>
        <div
          class="sidebar-item"
          :class="{ 'active': currentPath === '/recent' }"
          @click="$emit('navigate', '/recent')"
        >
          <el-icon class="item-icon">
            <Clock />
          </el-icon>
          <span class="item-label">最近上传</span>
        </div>
      </div>
    </div>
    
    <!-- 标签 -->
    <div class="sidebar-section">
      <div class="section-header">
        <el-icon><PriceTag /></el-icon>
        <span>标签</span>
      </div>
      <div class="section-content">
        <div
          v-for="tag in tags"
          :key="tag.name"
          class="sidebar-item tag-item"
          :style="{ '--tag-color': tag.color }"
          @click="handleTagClick(tag)"
        >
          <div class="tag-dot" />
          <span class="item-label">{{ tag.name }}</span>
          <span class="tag-count">{{ tag.count }}</span>
        </div>
      </div>
    </div>
    
    <!-- 最近访问 -->
    <div v-if="recentItems.length > 0" class="sidebar-section">
      <div class="section-header">
        <el-icon><Clock /></el-icon>
        <span>最近访问</span>
      </div>
      <div class="section-content">
        <div
          v-for="item in recentItems.slice(0, 5)"
          :key="item.path"
          class="sidebar-item recent-item"
          @click="$emit('navigate', item.path)"
        >
          <el-icon class="item-icon">
            <Folder v-if="item.type === 'folder'" />
            <Picture v-else-if="item.type === 'image'" />
            <Document v-else />
          </el-icon>
          <span class="item-label">{{ item.name }}</span>
          <span class="item-time">{{ formatTime(item.lastAccessed) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Star,
  Monitor,
  PriceTag,
  Clock,
  Folder,
  Picture,
  Document
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  currentPath: {
    type: String,
    required: true
  },
  favorites: {
    type: Array,
    default: () => []
  },
  recentItems: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['navigate', 'toggle-favorite'])

// 模拟标签数据
const tags = computed(() => [
  { name: '重要', color: '#ff3b30', count: 12 },
  { name: '工作', color: '#007aff', count: 8 },
  { name: '个人', color: '#34c759', count: 15 },
  { name: '项目', color: '#ff9500', count: 6 }
])

// 方法
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
  } else {
    return date.toLocaleDateString()
  }
}

const handleTagClick = (tag) => {
  // 实现标签筛选功能
  console.log('Tag clicked:', tag)
}
</script>

<style scoped>
.finder-sidebar {
  width: 200px;
  background: rgba(246, 246, 246, 0.8);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--mac-border-primary);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 8px 0;
}

.sidebar-section {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--mac-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  .el-icon {
    font-size: 12px;
  }
}

.section-content {
  padding: 0 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--mac-text-primary);
  transition: all 0.15s ease-out;
  margin-bottom: 1px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  &.active {
    background: var(--mac-accent-color);
    color: white;
    
    .item-icon {
      color: white;
    }
  }
}

.item-icon {
  font-size: 16px;
  color: var(--mac-text-secondary);
  flex-shrink: 0;
}

.item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-item {
  position: relative;
  
  .tag-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--tag-color);
    flex-shrink: 0;
  }
  
  .tag-count {
    font-size: 11px;
    color: var(--mac-text-tertiary);
    background: var(--mac-bg-tertiary);
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
  }
  
  &.active .tag-count {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
}

.recent-item {
  .item-time {
    font-size: 10px;
    color: var(--mac-text-tertiary);
  }
}

/* 深色主题适配 */
.dark-theme .finder-sidebar {
  background: rgba(40, 40, 40, 0.8);
  
  .sidebar-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .tag-item .tag-count {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* 滚动条样式 */
.finder-sidebar::-webkit-scrollbar {
  width: 6px;
}

.finder-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.finder-sidebar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.3);
  }
}

.dark-theme .finder-sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

/* 动画效果 */
.sidebar-item {
  position: relative;
  overflow: hidden;
}

.sidebar-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s;
}

.sidebar-item:hover::before {
  left: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .finder-sidebar {
    width: 100%;
    height: 150px;
    border-right: none;
    border-bottom: 1px solid var(--mac-border-primary);
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 8px;
    
    .sidebar-section {
      min-width: 150px;
      margin-right: 16px;
      margin-bottom: 0;
    }
    
    .section-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
  }
}
</style>
