<template>
  <div class="file-list">
    <!-- 列表视图 -->
    <div v-if="viewMode === 'list'" class="list-view">
      <el-table
        :data="files"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="文件名" min-width="200">
          <template #default="{ row }">
            <div class="file-name-cell">
              <el-icon class="file-icon">
                <component :is="getFileIcon(row)" />
              </el-icon>
              <span class="file-name">{{ row.name }}</span>
              <div v-if="row.tags && row.tags.length > 0" class="file-tags">
                <el-tag
                  v-for="tag in row.tags.slice(0, 3)"
                  :key="tag"
                  size="small"
                  class="file-tag"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="row.tags.length > 3" class="more-tags">
                  +{{ row.tags.length - 3 }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="100" sortable>
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="modifiedDate" label="修改时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDate(row.modifiedDate) }}
          </template>
        </el-table-column>
        <el-table-column label="收藏" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.isFavorite" color="#f39c12">
              <StarFilled />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="text"
              size="small"
              @click.stop="$emit('file-action', 'preview', row)"
            >
              预览
            </el-button>
            <el-button
              type="text"
              size="small"
              @click.stop="$emit('file-action', 'download', row)"
            >
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 网格视图 -->
    <div v-else-if="viewMode === 'grid'" class="grid-view">
      <div class="file-grid">
        <div
          v-for="file in files"
          :key="file.name"
          class="file-card"
          :class="{ 'selected': isSelected(file) }"
          @click="handleFileClick(file)"
        >
          <div class="file-card-header">
            <el-checkbox
              :model-value="isSelected(file)"
              @change="handleFileSelect(file)"
              @click.stop
            />
            <el-icon v-if="file.isFavorite" class="favorite-icon" color="#f39c12">
              <StarFilled />
            </el-icon>
          </div>
          
          <div class="file-preview">
            <div v-if="isImageFile(file)" class="image-preview">
              <img :src="file.url" :alt="file.name" @error="handleImageError" />
            </div>
            <div v-else class="file-icon-preview">
              <el-icon :size="48">
                <component :is="getFileIcon(file)" />
              </el-icon>
            </div>
          </div>
          
          <div class="file-info">
            <div class="file-name" :title="file.name">{{ file.name }}</div>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-date">{{ formatDate(file.modifiedDate) }}</span>
            </div>
            <div v-if="file.tags && file.tags.length > 0" class="file-tags">
              <el-tag
                v-for="tag in file.tags.slice(0, 2)"
                :key="tag"
                size="small"
                class="file-tag"
              >
                {{ tag }}
              </el-tag>
              <span v-if="file.tags.length > 2" class="more-tags">
                +{{ file.tags.length - 2 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="files.length === 0" class="empty-state">
      <el-empty description="暂无文件">
        <el-button type="primary" @click="$emit('file-action', 'upload')">
          上传文件
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  Document, Picture, VideoPlay, Headphones, FolderOpened,
  StarFilled, Files
} from '@element-plus/icons-vue';

// Props
const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  viewMode: {
    type: String,
    default: 'list'
  },
  selectedFiles: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['file-select', 'file-action']);

// 方法
const handleSelectionChange = (selection) => {
  emit('file-select', selection, true);
};

const handleRowClick = (row) => {
  emit('file-select', row, false);
};

const handleFileClick = (file) => {
  emit('file-select', file, false);
};

const handleFileSelect = (file) => {
  emit('file-select', file, true);
};

const isSelected = (file) => {
  return props.selectedFiles.some(f => f.name === file.name);
};

const isImageFile = (file) => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  return imageTypes.includes(extension);
};

const getFileIcon = (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
    return Picture;
  }
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
    return VideoPlay;
  }
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
    return Headphones;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return Files;
  }
  if (file.type === 'directory') {
    return FolderOpened;
  }
  
  return Document;
};

const formatFileSize = (size) => {
  if (!size) return '0 B';
  const sizeNum = parseFloat(size);
  if (sizeNum >= 1) return `${sizeNum.toFixed(2)} MB`;
  return `${(sizeNum * 1024).toFixed(0)} KB`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
  event.target.parentNode.innerHTML = `
    <div class="image-error">
      <el-icon size="32"><Picture /></el-icon>
      <span>预览失败</span>
    </div>
  `;
};
</script>

<style scoped>
.file-list {
  height: 100%;
}

.list-view {
  height: 100%;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.file-icon {
  flex-shrink: 0;
  color: var(--el-text-color-regular);
}

.file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-tags {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.file-tag {
  font-size: 10px;
  height: 18px;
  line-height: 16px;
}

.more-tags {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.grid-view {
  height: 100%;
  overflow-y: auto;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
}

.file-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--el-bg-color);
}

.file-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-card.selected {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.file-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.favorite-icon {
  font-size: 16px;
}

.file-preview {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.file-icon-preview {
  color: var(--el-text-color-regular);
}

.file-info {
  text-align: center;
}

.file-name {
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    padding: 12px;
  }
  
  .file-preview {
    height: 80px;
  }
}
</style>
