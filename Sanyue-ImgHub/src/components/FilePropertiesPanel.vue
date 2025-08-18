<template>
  <div class="properties-panel">
    <!-- 单个文件选中 -->
    <div v-if="selectedFile" class="single-file-properties">
      <!-- 文件预览 -->
      <div class="preview-section">
        <div class="preview-container">
          <img 
            v-if="isImage(selectedFile)" 
            :src="selectedFile.url" 
            :alt="selectedFile.name"
            class="preview-image"
            @error="handleImageError"
          />
          <video 
            v-else-if="isVideo(selectedFile)"
            :src="selectedFile.url"
            class="preview-video"
            controls
            preload="metadata"
          />
          <div v-else class="preview-placeholder">
            <el-icon class="preview-icon" :class="getFileIconClass(selectedFile)">
              <component :is="getFileIcon(selectedFile)" />
            </el-icon>
            <span class="file-type">{{ getFileTypeDisplay(selectedFile) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 文件信息 -->
      <div class="info-section">
        <h3 class="section-title">文件信息</h3>
        <div class="info-list">
          <div class="info-item">
            <label>名称：</label>
            <span class="info-value" :title="selectedFile.name">{{ selectedFile.name }}</span>
          </div>
          <div class="info-item">
            <label>大小：</label>
            <span class="info-value">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
          <div class="info-item">
            <label>类型：</label>
            <span class="info-value">{{ selectedFile.fileType || getFileTypeDisplay(selectedFile) }}</span>
          </div>
          <div class="info-item">
            <label>修改时间：</label>
            <span class="info-value">{{ selectedFile.modifiedDate }}</span>
          </div>
          <div v-if="selectedFile.metadata && selectedFile.metadata.Channel" class="info-item">
            <label>存储渠道：</label>
            <span class="info-value">{{ selectedFile.metadata.Channel }}</span>
          </div>
          <div v-if="getImageDimensions(selectedFile)" class="info-item">
            <label>尺寸：</label>
            <span class="info-value">{{ getImageDimensions(selectedFile) }}</span>
          </div>
        </div>
      </div>

      <!-- 标签和收藏夹 -->
      <div class="tags-favorites-section">
        <FileTagSelector
          :selected-files="[selectedFile]"
          :current-file="selectedFile"
          :show-stats="false"
          @tags-changed="handleTagsChanged"
        />

        <div class="favorite-actions">
          <h4 class="section-subtitle">收藏夹</h4>
          <div class="favorite-buttons">
            <el-button
              v-if="!selectedFile.isFavorite"
              type="success"
              size="small"
              @click="addToFavorites"
              :icon="Star"
              :loading="favoriteLoading"
            >
              添加到收藏夹
            </el-button>
            <el-button
              v-else
              type="warning"
              size="small"
              @click="removeFromFavorites"
              :icon="StarFilled"
              :loading="favoriteLoading"
            >
              已收藏
            </el-button>
            <el-dropdown @command="handleFavoriteGroupAction" v-if="favoriteGroups.length > 1">
              <el-button size="small" :icon="ArrowDown">
                选择分组
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="group in favoriteGroups"
                    :key="group.id"
                    :command="group.id"
                  >
                    <el-icon :color="group.color">
                      <component :is="getIconComponent(group.icon)" />
                    </el-icon>
                    {{ group.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 操作按钮 */
      <div class="actions-section">
        <h3 class="section-title">操作</h3>
        <div class="action-buttons">
          <el-button type="primary" @click="handleDownload" :icon="Download" block>
            下载文件
          </el-button>
          <el-button @click="handleCopyLink" :icon="Link" block>
            复制链接
          </el-button>
          <el-button @click="handleRename" :icon="Edit" block>
            重命名
          </el-button>
          <el-button @click="handlePreview" :icon="View" block v-if="canPreview(selectedFile)">
            预览
          </el-button>
          <el-button type="danger" @click="handleDelete" :icon="Delete" block>
            删除文件
          </el-button>
        </div>
      </div>

      <!-- 版本历史 -->
      <div class="versions-section" v-if="fileVersions.length > 1">
        <h3 class="section-title">版本历史</h3>
        <div class="version-summary">
          <div class="version-info">
            <span class="current-version">当前版本: v{{ currentVersion }}</span>
            <span class="total-versions">共 {{ fileVersions.length }} 个版本</span>
          </div>
          <el-button
            type="text"
            size="small"
            @click="showVersionHistory = true"
            :icon="Clock"
          >
            查看历史
          </el-button>
        </div>
      </div>

      <!-- 文件统计 -->
      <div class="stats-section" v-if="fileStats">
        <h3 class="section-title">访问统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon color="#409EFF"><View /></el-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ fileStats.viewCount || 0 }}</span>
              <span class="stat-label">访问量</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon color="#67C23A"><Download /></el-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ fileStats.downloadCount || 0 }}</span>
              <span class="stat-label">下载量</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon color="#E6A23C"><Share /></el-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ fileStats.shareCount || 0 }}</span>
              <span class="stat-label">分享量</span>
            </div>
          </div>
        </div>
        <div class="last-accessed" v-if="fileStats.lastAccessed">
          <span class="label">最后访问：</span>
          <span class="value">{{ formatDate(fileStats.lastAccessed) }}</span>
        </div>
      </div>

      <!-- 元数据信息 -->
      <div v-if="selectedFile.metadata" class="metadata-section">
        <h3 class="section-title">详细信息</h3>
        <div class="metadata-list">
          <div v-for="(value, key) in filteredMetadata" :key="key" class="metadata-item">
            <label>{{ formatMetadataKey(key) }}：</label>
            <span class="metadata-value">{{ formatMetadataValue(value) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 多个文件选中 -->
    <div v-else-if="selectedFiles && selectedFiles.length > 1" class="multiple-files-properties">
      <div class="selection-info">
        <el-icon class="selection-icon"><Files /></el-icon>
        <h3>已选择 {{ selectedFiles.length }} 个项目</h3>
      </div>
      
      <div class="selection-stats">
        <div class="stat-item">
          <label>文件夹：</label>
          <span>{{ folderCount }} 个</span>
        </div>
        <div class="stat-item">
          <label>文件：</label>
          <span>{{ fileCount }} 个</span>
        </div>
        <div class="stat-item">
          <label>总大小：</label>
          <span>{{ totalSize }}</span>
        </div>
      </div>

      <!-- 批量操作 -->
      <div class="batch-operations">
        <EnhancedBatchOperations
          :selected-files="selectedFiles"
          @clear-selection="$emit('file-action', 'clear-selection')"
          @operation-complete="handleBatchOperationComplete"
          @refresh="$emit('file-action', 'refresh')"
        />
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions">
        <h3 class="section-title">批量操作</h3>
        <div class="action-buttons">
          <el-button @click="handleBatchDownload" :icon="Download" block>
            批量下载
          </el-button>
          <el-button @click="handleBatchMove" :icon="FolderOpened" block>
            移动到...
          </el-button>
          <el-button @click="handleBatchAddToFavorites" :icon="Star" block>
            批量收藏
          </el-button>
          <el-button type="danger" @click="handleBatchDelete" :icon="Delete" block>
            批量删除
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 无选择状态 -->
    <div v-else class="no-selection">
      <el-icon class="no-selection-icon"><Document /></el-icon>
      <h3>未选择文件</h3>
      <p>选择文件或文件夹以查看详细信息</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Download, Link, Edit, Delete, View, Files, FolderOpened, Document,
  Folder, Picture, VideoPlay, Headphone, Star, StarFilled, ArrowDown,
  Clock, Share
} from '@element-plus/icons-vue';
import FileTagSelector from './FileTagSelector.vue';
import FileVersionHistory from './FileVersionHistory.vue';
import EnhancedFilePreview from './EnhancedFilePreview.vue';
import EnhancedBatchOperations from './EnhancedBatchOperations.vue';
import {
  addToFavorites as addToFavoritesAPI,
  removeFromFavorites as removeFromFavoritesAPI,
  getFavoriteGroups,
  batchAddToFavorites,
  getFileVersions,
  getFileStats
} from '@/utils/fileManagerAPI';
import { FAVORITE_ICONS } from '@/models/fileManagerModels';

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
const favoriteGroups = ref([]);
const showVersionHistory = ref(false);
const showEnhancedPreview = ref(false);
const previewFile = ref(null);
const fileVersions = ref([]);
const currentVersion = ref(1);
const fileStats = ref(null);
const fileFavoriteGroups = ref([]);
const isInFavorites = ref(false);

// 计算属性
const folderCount = computed(() => {
  return props.selectedFiles.filter(file => file.type === 'directory').length;
});

const fileCount = computed(() => {
  return props.selectedFiles.filter(file => file.type === 'file').length;
});

const totalSize = computed(() => {
  const total = props.selectedFiles
    .filter(file => file.type === 'file' && file.size !== '-')
    .reduce((sum, file) => sum + parseFloat(file.size || 0), 0);
  return formatFileSize(total);
});

const filteredMetadata = computed(() => {
  if (!props.selectedFile?.metadata) return {};
  
  const metadata = props.selectedFile.metadata;
  const filtered = {};
  
  // 过滤掉一些不需要显示的字段
  const excludeKeys = ['FileName', 'TimeStamp'];
  
  Object.keys(metadata).forEach(key => {
    if (!excludeKeys.includes(key) && metadata[key] !== undefined && metadata[key] !== '') {
      filtered[key] = metadata[key];
    }
  });
  
  return filtered;
});

// 方法
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

const getFileIcon = (file) => {
  if (file.type === 'directory') return Folder;
  if (isImage(file)) return Picture;
  if (isVideo(file)) return VideoPlay;
  if (isAudio(file)) return Headphone;
  return Document;
};

const getFileIconClass = (file) => {
  if (file.type === 'directory') return 'folder-icon';
  if (isImage(file)) return 'image-icon';
  if (isVideo(file)) return 'video-icon';
  if (isAudio(file)) return 'audio-icon';
  return 'file-icon';
};

const getFileTypeDisplay = (file) => {
  if (file.type === 'directory') return '文件夹';
  const ext = file.name.split('.').pop()?.toUpperCase();
  return ext ? `${ext} 文件` : '文件';
};

const getImageDimensions = (file) => {
  // 这里可以从metadata中获取图片尺寸信息
  if (file.metadata && file.metadata.Width && file.metadata.Height) {
    return `${file.metadata.Width} × ${file.metadata.Height}`;
  }
  return null;
};

const canPreview = (file) => {
  return isImage(file) || isVideo(file) || isAudio(file);
};

const formatFileSize = (size) => {
  if (size === '-' || !size || size === 0) return '-';
  const bytes = parseFloat(size);
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatMetadataKey = (key) => {
  const keyMap = {
    'FileSize': '文件大小',
    'FileType': '文件类型',
    'Channel': '存储渠道',
    'ChannelName': '渠道名称',
    'Label': '标签',
    'ListType': '列表类型',
    'Width': '宽度',
    'Height': '高度'
  };
  return keyMap[key] || key;
};

const formatMetadataValue = (value) => {
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return value || '-';
};

// 事件处理
const handleDownload = () => {
  if (props.selectedFile) {
    window.open(props.selectedFile.url, '_blank');
  }
};

const handleCopyLink = async () => {
  if (props.selectedFile) {
    try {
      await navigator.clipboard.writeText(props.selectedFile.url);
      ElMessage.success('链接已复制到剪贴板');
    } catch (error) {
      ElMessage.error('复制链接失败');
    }
  }
};

const handleRename = () => {
  emit('file-action', 'rename', props.selectedFile);
};

const handlePreview = () => {
  if (props.selectedFile) {
    previewFile.value = {
      name: props.selectedFile.name,
      url: props.selectedFile.url,
      fileType: props.selectedFile.fileType || getFileTypeFromName(props.selectedFile.name),
      size: props.selectedFile.size
    };
    showEnhancedPreview.value = true;
  }
};

const handlePreviewDownload = (file) => {
  if (file && file.url) {
    window.open(file.url, '_blank');
  }
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${props.selectedFile.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );
    emit('file-action', 'delete', props.selectedFile);
  } catch {
    // 用户取消删除
  }
};

const handleBatchDownload = () => {
  emit('file-action', 'batch-download', props.selectedFiles);
};

const handleBatchMove = () => {
  emit('file-action', 'batch-move', props.selectedFiles);
};

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${props.selectedFiles.length} 个项目吗？`,
      '确认批量删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );
    emit('file-action', 'batch-delete', props.selectedFiles);
  } catch {
    // 用户取消删除
  }
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
};

// 标签和收藏夹相关方法
const handleTagsChanged = (file, tags) => {
  emit('tags-changed', file, tags);
};

const addToFavorites = async () => {
  if (!props.selectedFile) return;

  favoriteLoading.value = true;
  try {
    const success = await addToFavoritesAPI(props.selectedFile.name);
    if (success) {
      props.selectedFile.isFavorite = true;
      emit('favorites-changed', props.selectedFile, true);
    }
  } catch (error) {
    console.error('Add to favorites failed:', error);
  } finally {
    favoriteLoading.value = false;
  }
};

const removeFromFavorites = async () => {
  if (!props.selectedFile) return;

  favoriteLoading.value = true;
  try {
    const success = await removeFromFavoritesAPI(props.selectedFile.name);
    if (success) {
      props.selectedFile.isFavorite = false;
      emit('favorites-changed', props.selectedFile, false);
    }
  } catch (error) {
    console.error('Remove from favorites failed:', error);
  } finally {
    favoriteLoading.value = false;
  }
};

const handleFavoriteGroupAction = async (groupId) => {
  if (!props.selectedFile) return;

  favoriteLoading.value = true;
  try {
    const success = await addToFavoritesAPI(props.selectedFile.name, groupId);
    if (success) {
      props.selectedFile.isFavorite = true;
      if (!props.selectedFile.favoriteGroups) {
        props.selectedFile.favoriteGroups = [];
      }
      if (!props.selectedFile.favoriteGroups.includes(groupId)) {
        props.selectedFile.favoriteGroups.push(groupId);
      }
      emit('favorites-changed', props.selectedFile, true);
    }
  } catch (error) {
    console.error('Add to favorite group failed:', error);
  } finally {
    favoriteLoading.value = false;
  }
};

const handleBatchAddToFavorites = async () => {
  if (props.selectedFiles.length === 0) return;

  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${props.selectedFiles.length} 个文件添加到收藏夹吗？`,
      '批量收藏确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    );

    const fileIds = props.selectedFiles.map(file => file.name);
    const result = await batchAddToFavorites(fileIds);

    if (result.success) {
      // 更新文件的收藏状态
      props.selectedFiles.forEach(file => {
        file.isFavorite = true;
      });
      emit('favorites-changed', props.selectedFiles, true);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch add to favorites failed:', error);
    }
  }
};

const handleBatchOperationComplete = (operation, result) => {
  emit('file-action', `batch-${operation}`, result);
};

const loadFavoriteGroups = async () => {
  try {
    const groups = await getFavoriteGroups();
    favoriteGroups.value = groups;
  } catch (error) {
    console.error('Load favorite groups failed:', error);
  }
};

const getIconComponent = (iconName) => {
  const iconComponents = {
    star: Star,
    heart: StarFilled,
    bookmark: Document,
    flag: FolderOpened,
    folder: Folder,
    image: Picture,
    video: VideoPlay,
    document: Document,
    music: Headphone,
    archive: Files
  };
  return iconComponents[iconName] || Star;
};

// 版本历史相关方法
const loadFileVersions = async (file) => {
  if (!file) return;

  try {
    const versions = await getFileVersions(file.name);
    fileVersions.value = versions;

    // 找到当前版本
    const activeVersion = versions.find(v => v.isActive);
    currentVersion.value = activeVersion ? activeVersion.versionNumber : 1;
  } catch (error) {
    console.error('Load file versions failed:', error);
    fileVersions.value = [];
  }
};

const handleVersionRestored = (version) => {
  ElMessage.success(`已恢复到版本 v${version.versionNumber}`);
  loadFileVersions(props.selectedFile);
  emit('file-action', 'refresh');
};

const handleVersionDeleted = (version) => {
  ElMessage.success(`版本 v${version.versionNumber} 已删除`);
  loadFileVersions(props.selectedFile);
};

// 统计数据相关方法
const loadFileStats = async (file) => {
  if (!file) return;

  try {
    const stats = await getFileStats({ fileId: file.name });
    fileStats.value = stats;
  } catch (error) {
    console.error('Load file stats failed:', error);
    fileStats.value = null;
  }
};

// 工具方法
const getFileTypeFromName = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const typeMap = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'avi': 'video/avi',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return typeMap[ext] || 'application/octet-stream';
};

const formatDate = (dateString) => {
  if (!dateString) return '从未';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

// 监听器
watch(() => props.selectedFile, (newFile) => {
  if (newFile && newFile.type === 'file') {
    loadFileVersions(newFile);
    loadFileStats(newFile);

    // 检查收藏状态
    isInFavorites.value = newFile.isFavorite || false;
    fileFavoriteGroups.value = newFile.favoriteGroups || [];
  } else {
    fileVersions.value = [];
    fileStats.value = null;
    isInFavorites.value = false;
    fileFavoriteGroups.value = [];
  }
}, { immediate: true });

// 批量操作处理
const handleBatchOperationComplete = (operation, result) => {
  const operationNames = {
    'tags': '标签',
    'favorites': '收藏夹',
    'rename': '重命名',
    'compress': '压缩',
    'permissions': '权限设置',
    'delete': '删除'
  };

  const operationName = operationNames[operation] || operation;
  ElMessage.success(`批量${operationName}操作完成`);
  emit('file-action', 'refresh');
};

const handleTagsChanged = () => {
  // 标签变化后刷新文件列表
  emit('file-action', 'refresh');
};

// 生命周期
onMounted(() => {
  loadFavoriteGroups();
});
</script>

<style scoped>
.properties-panel {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  background: var(--el-bg-color-page);
}

/* 预览区域 */
.preview-section {
  margin-bottom: 24px;
}

.preview-container {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.preview-video {
  max-width: 100%;
  max-height: 100%;
  border-radius: 4px;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--el-text-color-secondary);
}

.preview-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.file-type {
  font-size: 14px;
}

/* 信息区域 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 8px;
}

.info-section {
  margin-bottom: 24px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

/* 操作按钮 */
.actions-section {
  margin-bottom: 24px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 元数据 */
.metadata-section {
  margin-bottom: 24px;
}

.metadata-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.metadata-item label {
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.metadata-value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

/* 多选状态 */
.multiple-files-properties {
  text-align: center;
}

.selection-info {
  margin-bottom: 24px;
}

.selection-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-bottom: 12px;
}

.selection-stats {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.batch-actions {
  text-align: left;
}

/* 无选择状态 */
.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--el-text-color-secondary);
}

.no-selection-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--el-color-info-light-5);
}

/* 图标颜色 */
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

.file-icon {
  color: var(--el-text-color-secondary);
}

/* 标签和收藏夹区域 */
.tags-favorites-section {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
}

.section-subtitle {
  margin: 16px 0 8px 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 500;
}

.favorite-actions {
  margin-top: 16px;
}

.favorite-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.batch-operations {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
}

.versions-section {
  margin-bottom: 20px;
}

.version-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.current-version {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.total-versions {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.stats-section {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.stat-icon {
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 2px;
}

.last-accessed {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  font-size: 12px;
}

.last-accessed .label {
  color: var(--el-text-color-regular);
}

.last-accessed .value {
  color: var(--el-text-color-primary);
  font-weight: 500;
}
</style>
