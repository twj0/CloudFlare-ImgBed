<template>
  <div class="modern-file-browser">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <el-icon class="is-loading loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredItems.length === 0" class="empty-state">
      <el-icon class="empty-icon"><FolderOpened /></el-icon>
      <h3>此文件夹为空</h3>
      <p>拖拽文件到此处或点击上传按钮添加文件</p>
    </div>

    <!-- 文件列表 -->
    <div v-else class="file-browser-content">
      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="list-view">
        <el-table
          :data="filteredItems"
          @selection-change="handleSelectionChange"
          @row-dblclick="handleDoubleClick"
          @row-contextmenu="handleContextMenu"
          stripe
          class="file-table"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="名称" min-width="200">
            <template #default="{ row }">
              <div class="file-item">
                <el-icon class="file-icon" :class="getFileIconClass(row)">
                  <component :is="getFileIcon(row)" />
                </el-icon>
                <span class="file-name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="modifiedDate" label="修改日期" width="180" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="size" label="大小" width="100" />
        </el-table>
      </div>

      <!-- 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="grid-view">
        <div class="grid-container">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="grid-item"
            :class="{ selected: selectedItems.includes(item.id) }"
            @click="handleItemClick(item, $event)"
            @dblclick="handleDoubleClick(item)"
            @contextmenu="handleContextMenu($event, item)"
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
            </div>
            <div class="grid-item-info">
              <span class="grid-item-name" :title="item.name">{{ item.name }}</span>
              <span class="grid-item-size">{{ formatFileSize(item.size) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细视图 -->
      <div v-else-if="viewMode === 'detail'" class="detail-view">
        <el-table
          :data="filteredItems"
          @selection-change="handleSelectionChange"
          @row-dblclick="handleDoubleClick"
          @row-contextmenu="handleContextMenu"
          stripe
          class="detail-table"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="名称" min-width="250">
            <template #default="{ row }">
              <div class="file-item">
                <el-icon class="file-icon" :class="getFileIconClass(row)">
                  <component :is="getFileIcon(row)" />
                </el-icon>
                <span class="file-name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="modifiedDate" label="修改日期" width="180" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="size" label="大小" width="100" />
          <el-table-column prop="dimensions" label="尺寸" width="120" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button-group size="small">
                <el-button @click="handlePreview(row)" :icon="View" />
                <el-button @click="handleDownload(row)" :icon="Download" />
                <el-button @click="handleCopyLink(row)" :icon="Link" />
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Loading, FolderOpened, Folder, Document, Picture, VideoPlay,
  Headphone, Files, View, Download, Link
} from '@element-plus/icons-vue';
import axios from '@/utils/axios';

// Props
const props = defineProps({
  directory: {
    type: String,
    default: ''
  },
  viewMode: {
    type: String,
    default: 'list',
    validator: (value) => ['list', 'grid', 'detail'].includes(value)
  },
  searchQuery: {
    type: String,
    default: ''
  },
  sortBy: {
    type: String,
    default: 'name'
  },
  sortOrder: {
    type: String,
    default: 'asc'
  }
});

// Emits
const emit = defineEmits(['file-selected', 'selection-changed', 'item-double-click']);

// 响应式数据
const loading = ref(false);
const items = ref([]);
const selectedItems = ref([]);

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
    let aValue = a[props.sortBy];
    let bValue = b[props.sortBy];
    
    // 文件夹优先
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    
    // 字符串比较
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return props.sortOrder === 'asc' ? result : -result;
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
      modifiedDate: new Date(f.metadata.TimeStamp).toLocaleString(),
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

const isVideo = (item) => {
  if (item.type === 'directory') return false;
  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
  const ext = item.name.split('.').pop()?.toLowerCase();
  return videoTypes.includes(ext);
};

const isAudio = (item) => {
  if (item.type === 'directory') return false;
  const audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
  const ext = item.name.split('.').pop()?.toLowerCase();
  return audioTypes.includes(ext);
};

// 获取文件图标
const getFileIcon = (item) => {
  if (item.type === 'directory') return Folder;
  if (isImage(item)) return Picture;
  if (isVideo(item)) return VideoPlay;
  if (isAudio(item)) return Headphone;
  return Document;
};

const getFileIconClass = (item) => {
  if (item.type === 'directory') return 'folder-icon';
  if (isImage(item)) return 'image-icon';
  if (isVideo(item)) return 'video-icon';
  if (isAudio(item)) return 'audio-icon';
  return 'file-icon';
};

// 获取缩略图URL
const getThumbnailUrl = (item) => {
  if (isImage(item)) {
    return item.url;
  }
  return '';
};

// 格式化文件大小
const formatFileSize = (size) => {
  if (size === '-' || !size) return '-';
  const bytes = parseFloat(size);
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 事件处理
const handleSelectionChange = (selection) => {
  selectedItems.value = selection.map(item => item.id);
  emit('selection-changed', selection);
};

const handleItemClick = (item, event) => {
  if (event.ctrlKey || event.metaKey) {
    // 多选
    const index = selectedItems.value.indexOf(item.id);
    if (index > -1) {
      selectedItems.value.splice(index, 1);
    } else {
      selectedItems.value.push(item.id);
    }
  } else {
    // 单选
    selectedItems.value = [item.id];
    emit('file-selected', item);
  }
};

const handleDoubleClick = (item) => {
  emit('item-double-click', item);
};

const handleContextMenu = (event, item) => {
  event.preventDefault();
  // 右键菜单逻辑
};

const handlePreview = (item) => {
  // 预览逻辑
};

const handleDownload = (item) => {
  window.open(item.url, '_blank');
};

const handleCopyLink = async (item) => {
  try {
    await navigator.clipboard.writeText(item.url);
    ElMessage.success('链接已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制链接失败');
  }
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
};

// 刷新方法
const refresh = () => {
  fetchData(props.directory);
};

// 监听器
watch(() => props.directory, (newDir) => {
  fetchData(newDir);
}, { immediate: true });

// 暴露方法
defineExpose({
  refresh
});
</script>

<style scoped>
.modern-file-browser {
  height: 100%;
  display: flex;
  flex-direction: column;
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
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: var(--el-color-info-light-5);
}

.file-browser-content {
  flex: 1;
  overflow: auto;
}

/* 文件项样式 */
.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.folder-icon {
  color: var(--el-color-warning);
}

.image-icon {
  color: var(--el-color-success);
}

.video-icon {
  color: var(--el-color-danger);
}

.audio-icon {
  color: var(--el-color-info);
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 网格视图样式 */
.grid-view {
  padding: 16px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.grid-item:hover {
  background: var(--el-fill-color-light);
}

.grid-item.selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.grid-item-thumbnail {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.thumbnail-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 4px;
  object-fit: cover;
}

.file-icon-large {
  font-size: 48px;
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
  margin-bottom: 4px;
}

.grid-item-size {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* 表格样式 */
.file-table, .detail-table {
  height: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }
  
  .grid-item {
    padding: 8px;
  }
  
  .grid-item-thumbnail {
    width: 48px;
    height: 48px;
  }
  
  .file-icon-large {
    font-size: 32px;
  }
}
</style>
