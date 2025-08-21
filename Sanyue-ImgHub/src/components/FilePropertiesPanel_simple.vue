<template>
  <div class="file-properties-panel">
    <!-- 单文件选择状态 -->
    <div v-if="selectedFile && !isMultipleSelection" class="single-file-panel">
      <div class="file-header">
        <div class="file-icon">
          <el-icon :size="48">
            <component :is="getFileIcon(selectedFile)" />
          </el-icon>
        </div>
        <div class="file-info">
          <h3 class="file-name" :title="selectedFile.name">
            {{ selectedFile.name }}
          </h3>
          <div class="file-meta">
            <span class="file-type">{{ getFileType(selectedFile) }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
        </div>
      </div>

      <!-- 文件操作按钮 -->
      <div class="file-actions">
        <el-button-group>
          <el-button size="small" @click="previewFile" :icon="View">
            预览
          </el-button>
          <el-button size="small" @click="downloadFile" :icon="Download">
            下载
          </el-button>
          <el-button size="small" @click="copyLink" :icon="Link">
            复制链接
          </el-button>
        </el-button-group>
      </div>

      <!-- 收藏夹操作 -->
      <div class="favorite-section">
        <div class="section-header">
          <h4>收藏夹</h4>
        </div>
        <div class="favorite-actions">
          <el-button
            v-if="!selectedFile.isFavorite"
            type="primary"
            size="small"
            @click="addToFavorites"
            :loading="favoriteLoading"
            :icon="Star"
          >
            添加到收藏夹
          </el-button>
          <el-button
            v-else
            type="danger"
            size="small"
            @click="removeFromFavorites"
            :loading="favoriteLoading"
            :icon="StarFilled"
          >
            从收藏夹移除
          </el-button>
        </div>
      </div>

      <!-- 文件详细信息 -->
      <div class="file-details">
        <div class="section-header">
          <h4>文件详情</h4>
        </div>
        <div class="details-list">
          <div class="detail-item">
            <span class="label">文件名:</span>
            <span class="value">{{ selectedFile.name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">大小:</span>
            <span class="value">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">类型:</span>
            <span class="value">{{ getFileType(selectedFile) }}</span>
          </div>
          <div class="detail-item" v-if="selectedFile.lastModified">
            <span class="label">修改时间:</span>
            <span class="value">{{ formatDate(selectedFile.lastModified) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 多文件选择状态 -->
    <div v-else-if="isMultipleSelection" class="multiple-files-panel">
      <div class="selection-header">
        <div class="selection-icon">
          <el-icon :size="48"><Files /></el-icon>
        </div>
        <div class="selection-info">
          <h3>已选择 {{ selectedFiles.length }} 个项目</h3>
          <div class="selection-meta">
            <span>{{ folderCount }} 个文件夹</span>
            <span>{{ fileCount }} 个文件</span>
          </div>
        </div>
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions">
        <div class="section-header">
          <h4>批量操作</h4>
        </div>
        <div class="action-buttons">
          <el-button size="small" @click="batchDownload" :icon="Download">
            批量下载
          </el-button>
          <el-button size="small" @click="batchAddToFavorites" :icon="Star">
            批量收藏
          </el-button>
          <el-button size="small" type="danger" @click="batchDelete" :icon="Delete">
            批量删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 无选择状态 -->
    <div v-else class="no-selection">
      <el-icon class="no-selection-icon" :size="64"><Document /></el-icon>
      <h3>未选择文件</h3>
      <p>选择文件或文件夹以查看详细信息</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Download, Link, View, Files, Document, Folder, Picture, 
  VideoPlay, Headphone, Star, StarFilled, Delete
} from '@element-plus/icons-vue';

// Props
const props = defineProps({
  selectedFile: {
    type: Object,
    default: null
  },
  selectedFiles: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['file-action', 'tags-changed', 'favorites-changed']);

// 响应式数据
const favoriteLoading = ref(false);

// 计算属性
const isMultipleSelection = computed(() => {
  return props.selectedFiles.length > 1;
});

const folderCount = computed(() => {
  return props.selectedFiles.filter(file => file.type === 'directory').length;
});

const fileCount = computed(() => {
  return props.selectedFiles.filter(file => file.type !== 'directory').length;
});

// 方法
const getFileIcon = (file) => {
  if (file.type === 'directory') return Folder;
  if (isImage(file)) return Picture;
  if (isVideo(file)) return VideoPlay;
  if (isAudio(file)) return Headphone;
  return Document;
};

const isImage = (file) => {
  if (!file || file.type === 'directory') return false;
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  return imageTypes.includes(ext);
};

const isVideo = (file) => {
  if (!file || file.type === 'directory') return false;
  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  return videoTypes.includes(ext);
};

const isAudio = (file) => {
  if (!file || file.type === 'directory') return false;
  const audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  return audioTypes.includes(ext);
};

const getFileType = (file) => {
  if (file.type === 'directory') return '文件夹';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext) return '未知类型';
  return ext.toUpperCase() + ' 文件';
};

const formatFileSize = (size) => {
  if (!size || size === 0) return '0 B';
  const sizeNum = parseFloat(size);
  if (sizeNum >= 1024 * 1024 * 1024) {
    return `${(sizeNum / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  } else if (sizeNum >= 1024 * 1024) {
    return `${(sizeNum / (1024 * 1024)).toFixed(2)} MB`;
  } else if (sizeNum >= 1024) {
    return `${(sizeNum / 1024).toFixed(2)} KB`;
  }
  return `${sizeNum} B`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

// 文件操作方法
const previewFile = () => {
  emit('file-action', 'preview', props.selectedFile);
};

const downloadFile = () => {
  emit('file-action', 'download', props.selectedFile);
};

const copyLink = () => {
  emit('file-action', 'copy-link', props.selectedFile);
  ElMessage.success('链接已复制到剪贴板');
};

const addToFavorites = async () => {
  if (!props.selectedFile) return;
  
  favoriteLoading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    props.selectedFile.isFavorite = true;
    emit('favorites-changed', props.selectedFile, true);
    ElMessage.success('已添加到收藏夹');
  } catch (error) {
    ElMessage.error('添加到收藏夹失败');
  } finally {
    favoriteLoading.value = false;
  }
};

const removeFromFavorites = async () => {
  if (!props.selectedFile) return;
  
  favoriteLoading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    props.selectedFile.isFavorite = false;
    emit('favorites-changed', props.selectedFile, false);
    ElMessage.success('已从收藏夹移除');
  } catch (error) {
    ElMessage.error('从收藏夹移除失败');
  } finally {
    favoriteLoading.value = false;
  }
};

// 批量操作方法
const batchDownload = () => {
  emit('file-action', 'batch-download', props.selectedFiles);
  ElMessage.info('开始批量下载...');
};

const batchAddToFavorites = () => {
  emit('file-action', 'batch-add-favorites', props.selectedFiles);
  ElMessage.success('已批量添加到收藏夹');
};

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${props.selectedFiles.length} 个项目吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    emit('file-action', 'batch-delete', props.selectedFiles);
    ElMessage.success('批量删除成功');
  } catch {
    // 用户取消
  }
};
</script>

<style scoped>
.file-properties-panel {
  height: 100%;
  padding: 16px;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-light);
  overflow-y: auto;
}

.file-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.file-icon {
  margin-right: 12px;
  color: var(--el-text-color-regular);
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.file-actions {
  margin-bottom: 24px;
}

.section-header {
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.favorite-section {
  margin-bottom: 24px;
}

.file-details {
  margin-bottom: 24px;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.detail-item .label {
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.detail-item .value {
  color: var(--el-text-color-primary);
  text-align: right;
  word-break: break-all;
}

.selection-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.selection-icon {
  margin-right: 12px;
  color: var(--el-text-color-regular);
}

.selection-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.selection-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.batch-actions {
  margin-bottom: 24px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons .el-button {
  justify-content: flex-start;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--el-text-color-placeholder);
}

.no-selection-icon {
  margin-bottom: 16px;
}

.no-selection h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
}

.no-selection p {
  margin: 0;
  font-size: 14px;
}
</style>
