<template>
  <div class="mobile-file-browser">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <el-icon class="is-loading loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredItems.length === 0" class="empty-state">
      <el-icon class="empty-icon"><FolderOpened /></el-icon>
      <h3>此文件夹为空</h3>
      <p>点击右下角的 + 按钮添加文件</p>
    </div>

    <!-- 文件列表 -->
    <div v-else class="file-browser-content">
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="mobile-grid-view">
        <div class="grid-container">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="mobile-grid-item"
            :class="{ 
              selected: selectedItems.includes(item.id),
              'is-directory': item.type === 'directory'
            }"
            @click="handleItemClick(item, $event)"
            @dblclick="handleDoubleClick(item)"
            @touchstart="handleTouchStart(item, $event)"
            @touchend="handleTouchEnd"
          >
            <div class="grid-item-thumbnail">
              <img 
                v-if="isImage(item)" 
                :src="getThumbnailUrl(item)" 
                :alt="item.name"
                class="thumbnail-image"
                @error="handleImageError"
              />
              <el-icon v-else class="file-icon-large" :class="getFileIconClass(item)">
                <component :is="getFileIcon(item)" />
              </el-icon>
              
              <!-- 选择指示器 -->
              <div v-if="selectedItems.includes(item.id)" class="selection-indicator">
                <el-icon><Check /></el-icon>
              </div>
            </div>
            
            <div class="grid-item-info">
              <span class="grid-item-name" :title="item.name">{{ item.name }}</span>
              <span class="grid-item-meta">
                {{ item.type === 'directory' ? '文件夹' : formatFileSize(item.size) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="mobile-list-view">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="mobile-list-item"
          :class="{ 
            selected: selectedItems.includes(item.id),
            'is-directory': item.type === 'directory'
          }"
          @click="handleItemClick(item, $event)"
          @dblclick="handleDoubleClick(item)"
          @touchstart="handleTouchStart(item, $event)"
          @touchend="handleTouchEnd"
        >
          <div class="list-item-icon">
            <img 
              v-if="isImage(item)" 
              :src="getThumbnailUrl(item)" 
              :alt="item.name"
              class="thumbnail-small"
              @error="handleImageError"
            />
            <el-icon v-else class="file-icon" :class="getFileIconClass(item)">
              <component :is="getFileIcon(item)" />
            </el-icon>
          </div>
          
          <div class="list-item-content">
            <div class="list-item-name">{{ item.name }}</div>
            <div class="list-item-meta">
              <span>{{ item.modifiedDate }}</span>
              <span v-if="item.type !== 'directory'">{{ formatFileSize(item.size) }}</span>
            </div>
          </div>
          
          <div class="list-item-actions">
            <el-button 
              @click.stop="showItemMenu(item, $event)"
              :icon="MoreFilled" 
              text 
              circle 
              size="small"
            />
          </div>
          
          <!-- 选择指示器 -->
          <div v-if="selectedItems.includes(item.id)" class="selection-indicator">
            <el-icon><Check /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 项目操作菜单 -->
    <el-popover
      ref="itemMenuRef"
      :visible="itemMenuVisible"
      placement="bottom-start"
      :width="200"
      trigger="manual"
    >
      <div class="item-menu">
        <div class="menu-item" @click="handlePreview(currentMenuItem)">
          <el-icon><View /></el-icon>
          <span>预览</span>
        </div>
        <div class="menu-item" @click="handleRename(currentMenuItem)">
          <el-icon><Edit /></el-icon>
          <span>重命名</span>
        </div>
        <div class="menu-item" @click="handleMove(currentMenuItem)">
          <el-icon><FolderOpened /></el-icon>
          <span>移动</span>
        </div>
        <div class="menu-item" @click="handleCopyLink(currentMenuItem)">
          <el-icon><Link /></el-icon>
          <span>复制链接</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item danger" @click="handleDelete(currentMenuItem)">
          <el-icon><Delete /></el-icon>
          <span>删除</span>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Loading, FolderOpened, Folder, Document, Picture, VideoPlay,
  Headphone, Check, MoreFilled, View, Edit, FolderOpened as FolderOpenedIcon,
  Link, Delete
} from '@element-plus/icons-vue';
import axios from '@/utils/axios';

// Props
const props = defineProps({
  directory: String,
  viewMode: {
    type: String,
    default: 'grid',
    validator: (value) => ['list', 'grid'].includes(value)
  },
  searchQuery: String,
  sortBy: String,
  sortOrder: String
});

// Emits
const emit = defineEmits(['file-selected', 'selection-changed', 'item-double-click']);

// 响应式数据
const loading = ref(false);
const items = ref([]);
const selectedItems = ref([]);
const itemMenuVisible = ref(false);
const currentMenuItem = ref(null);
const touchTimer = ref(null);
const longPressTriggered = ref(false);

// 组件引用
const itemMenuRef = ref(null);

// 计算属性
const filteredItems = computed(() => {
  let filtered = items.value;
  
  // 搜索过滤
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase();
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query)
    );
  }
  
  // 排序
  filtered.sort((a, b) => {
    // 文件夹优先
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    
    let aValue = a[props.sortBy || 'name'];
    let bValue = b[props.sortBy || 'name'];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return (props.sortOrder === 'desc') ? -result : result;
  });
  
  return filtered;
});

// 方法
const fetchData = async (dir) => {
  loading.value = true;
  items.value = [];
  selectedItems.value = [];
  
  try {
    const response = await axios.get('/api/manage/list', {
      params: { dir: dir || '' }
    });

    // 处理文件夹
    const directories = (response.data.directories || []).map(d => {
      const name = d.replace(/\/$/, '').split('/').pop();
      return {
        id: d,
        name: name,
        type: 'directory',
        modifiedDate: '-',
        size: '-',
        fileType: '文件夹'
      };
    });

    // 处理文件
    const files = (response.data.files || []).map(f => ({
      id: f.name,
      name: f.metadata.FileName.split('/').pop(),
      type: 'file',
      modifiedDate: new Date(f.metadata.TimeStamp).toLocaleDateString(),
      size: f.metadata.FileSize,
      fileType: f.metadata.FileType,
      url: `/file/${f.name}`,
      metadata: f.metadata
    }));

    items.value = [...directories, ...files];
  } catch (error) {
    console.error('Failed to fetch items:', error);
    ElMessage.error('加载文件列表失败');
  } finally {
    loading.value = false;
  }
};

// 文件类型判断
const isImage = (item) => {
  if (item.type === 'directory') return false;
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const ext = item.name.split('.').pop()?.toLowerCase();
  return imageTypes.includes(ext);
};

const getFileIcon = (item) => {
  if (item.type === 'directory') return Folder;
  if (isImage(item)) return Picture;
  // 其他文件类型判断...
  return Document;
};

const getFileIconClass = (item) => {
  if (item.type === 'directory') return 'folder-icon';
  if (isImage(item)) return 'image-icon';
  return 'file-icon';
};

const getThumbnailUrl = (item) => {
  if (isImage(item)) return item.url;
  return '';
};

const formatFileSize = (size) => {
  if (size === '-' || !size) return '-';
  const bytes = parseFloat(size);
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// 事件处理
const handleItemClick = (item, event) => {
  if (event.ctrlKey || event.metaKey || selectedItems.value.length > 0) {
    // 多选模式
    const index = selectedItems.value.indexOf(item.id);
    if (index > -1) {
      selectedItems.value.splice(index, 1);
    } else {
      selectedItems.value.push(item.id);
    }
    emit('selection-changed', getSelectedFiles());
  } else {
    // 单选模式
    selectedItems.value = [];
    emit('file-selected', item);
  }
};

const handleDoubleClick = (item) => {
  emit('item-double-click', item);
};

const handleTouchStart = (item, event) => {
  longPressTriggered.value = false;
  touchTimer.value = setTimeout(() => {
    longPressTriggered.value = true;
    // 长按选择
    if (!selectedItems.value.includes(item.id)) {
      selectedItems.value.push(item.id);
      emit('selection-changed', getSelectedFiles());
    }
    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, 500);
};

const handleTouchEnd = () => {
  if (touchTimer.value) {
    clearTimeout(touchTimer.value);
    touchTimer.value = null;
  }
};

const showItemMenu = (item, event) => {
  currentMenuItem.value = item;
  itemMenuVisible.value = true;
  
  nextTick(() => {
    if (itemMenuRef.value) {
      itemMenuRef.value.referenceRef = event.target;
    }
  });
};

const hideItemMenu = () => {
  itemMenuVisible.value = false;
  currentMenuItem.value = null;
};

const getSelectedFiles = () => {
  return items.value.filter(item => selectedItems.value.includes(item.id));
};

// 文件操作
const handlePreview = (item) => {
  hideItemMenu();
  // 预览逻辑
};

const handleRename = (item) => {
  hideItemMenu();
  // 重命名逻辑
};

const handleMove = (item) => {
  hideItemMenu();
  // 移动逻辑
};

const handleCopyLink = async (item) => {
  hideItemMenu();
  try {
    await navigator.clipboard.writeText(item.url);
    ElMessage.success('链接已复制');
  } catch (error) {
    ElMessage.error('复制失败');
  }
};

const handleDelete = (item) => {
  hideItemMenu();
  // 删除逻辑
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
};

const refresh = () => {
  fetchData(props.directory);
};

// 监听器
watch(() => props.directory, (newDir) => {
  fetchData(newDir);
}, { immediate: true });

// 暴露方法
defineExpose({ refresh });
</script>

<style scoped>
.mobile-file-browser {
  height: 100%;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.loading-icon {
  font-size: 32px;
  margin-bottom: 16px;
  color: var(--el-color-primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: var(--el-color-info-light-5);
}

/* 网格视图 */
.mobile-grid-view {
  padding: 16px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}

.mobile-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  position: relative;
}

.mobile-grid-item:active {
  transform: scale(0.95);
  background: var(--el-fill-color-light);
}

.mobile-grid-item.selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.grid-item-thumbnail {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  position: relative;
}

.thumbnail-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.file-icon-large {
  font-size: 40px;
}

.grid-item-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
}

.grid-item-name {
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  margin-bottom: 2px;
}

.grid-item-meta {
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

/* 列表视图 */
.mobile-list-view {
  padding: 8px 0;
}

.mobile-list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.mobile-list-item:active {
  background: var(--el-fill-color-light);
}

.mobile-list-item.selected {
  background: var(--el-color-primary-light-9);
}

.list-item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.thumbnail-small {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
}

.file-icon {
  font-size: 24px;
}

.list-item-content {
  flex: 1;
  min-width: 0;
}

.list-item-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}

.list-item-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  gap: 8px;
}

.list-item-actions {
  flex-shrink: 0;
}

/* 选择指示器 */
.selection-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: var(--el-color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

/* 项目菜单 */
.item-menu {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 12px;
}

.menu-item:hover {
  background: var(--el-fill-color-light);
}

.menu-item.danger {
  color: var(--el-color-danger);
}

.menu-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 8px 0;
}

/* 图标颜色 */
.folder-icon {
  color: var(--el-color-warning);
}

.image-icon {
  color: var(--el-color-success);
}

.file-icon {
  color: var(--el-text-color-secondary);
}

/* 响应式调整 */
@media (max-width: 480px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 12px;
  }
  
  .mobile-grid-item {
    padding: 8px 4px;
  }
  
  .grid-item-thumbnail {
    width: 48px;
    height: 48px;
  }
  
  .file-icon-large {
    font-size: 32px;
  }
  
  .grid-item-name {
    font-size: 11px;
  }
  
  .grid-item-meta {
    font-size: 9px;
  }
}
</style>
