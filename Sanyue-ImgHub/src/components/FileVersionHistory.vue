<template>
  <div class="file-version-history">
    <!-- 版本历史头部 -->
    <div class="version-header">
      <div class="header-left">
        <h3>版本历史</h3>
        <span class="file-name">{{ file?.name }}</span>
      </div>
      <div class="header-right">
        <el-button @click="refreshVersions" :icon="Refresh" :loading="loading">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 版本列表 -->
    <div class="version-list" v-loading="loading">
      <div v-if="versions.length > 0" class="versions-container">
        <div
          v-for="(version, index) in versions"
          :key="version.id"
          class="version-item"
          :class="{ 'active': version.isActive, 'selected': selectedVersion?.id === version.id }"
          @click="selectVersion(version)"
        >
          <!-- 版本信息 -->
          <div class="version-info">
            <div class="version-header-item">
              <div class="version-number">
                <el-tag
                  :type="version.isActive ? 'success' : 'info'"
                  size="small"
                  effect="dark"
                >
                  v{{ version.versionNumber }}
                </el-tag>
                <span v-if="version.isActive" class="current-badge">当前版本</span>
              </div>
              <div class="version-date">
                {{ formatDate(version.createdAt) }}
              </div>
            </div>
            
            <div class="version-details">
              <div class="detail-item">
                <span class="label">文件名：</span>
                <span class="value">{{ version.fileName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">大小：</span>
                <span class="value">{{ formatFileSize(version.fileSize) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">类型：</span>
                <span class="value">{{ version.fileType }}</span>
              </div>
              <div class="detail-item" v-if="version.createdBy">
                <span class="label">创建者：</span>
                <span class="value">{{ version.createdBy }}</span>
              </div>
            </div>
            
            <div class="version-note" v-if="version.changeNote">
              <el-icon><EditPen /></el-icon>
              <span>{{ version.changeNote }}</span>
            </div>
          </div>
          
          <!-- 版本操作 -->
          <div class="version-actions">
            <el-button
              type="text"
              size="small"
              @click.stop="previewVersion(version)"
              :icon="View"
            >
              预览
            </el-button>
            <el-button
              type="text"
              size="small"
              @click.stop="downloadVersion(version)"
              :icon="Download"
            >
              下载
            </el-button>
            <el-button
              v-if="!version.isActive"
              type="text"
              size="small"
              @click.stop="restoreVersion(version)"
              :icon="RefreshRight"
              class="restore-btn"
            >
              恢复
            </el-button>
            <el-button
              v-if="!version.isActive && versions.length > 1"
              type="text"
              size="small"
              @click.stop="deleteVersion(version)"
              :icon="Delete"
              class="delete-btn"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="!loading" class="empty-state">
        <el-empty description="暂无版本历史">
          <p>该文件还没有版本历史记录</p>
        </el-empty>
      </div>
    </div>

    <!-- 版本比较 -->
    <div class="version-compare" v-if="selectedVersion && !selectedVersion.isActive">
      <el-divider content-position="left">版本比较</el-divider>
      <div class="compare-container">
        <div class="compare-item">
          <h4>当前版本</h4>
          <div class="compare-info">
            <div class="info-item">
              <span class="label">版本号：</span>
              <span class="value">v{{ currentVersion?.versionNumber }}</span>
            </div>
            <div class="info-item">
              <span class="label">大小：</span>
              <span class="value">{{ formatFileSize(currentVersion?.fileSize) }}</span>
            </div>
            <div class="info-item">
              <span class="label">修改时间：</span>
              <span class="value">{{ formatDate(currentVersion?.createdAt) }}</span>
            </div>
          </div>
        </div>
        
        <div class="compare-divider">
          <el-icon><Right /></el-icon>
        </div>
        
        <div class="compare-item">
          <h4>选中版本</h4>
          <div class="compare-info">
            <div class="info-item">
              <span class="label">版本号：</span>
              <span class="value">v{{ selectedVersion.versionNumber }}</span>
            </div>
            <div class="info-item">
              <span class="label">大小：</span>
              <span class="value">{{ formatFileSize(selectedVersion.fileSize) }}</span>
            </div>
            <div class="info-item">
              <span class="label">修改时间：</span>
              <span class="value">{{ formatDate(selectedVersion.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="compare-actions">
        <el-button
          type="primary"
          @click="restoreVersion(selectedVersion)"
          :icon="RefreshRight"
          :loading="restoring"
        >
          恢复到此版本
        </el-button>
        <el-button @click="selectedVersion = null">
          取消选择
        </el-button>
      </div>
    </div>

    <!-- 版本预览对话框 -->
    <EnhancedFilePreview
      v-model="previewVisible"
      :file="previewFile"
      @download="handlePreviewDownload"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Refresh, View, Download, RefreshRight, Delete, EditPen, Right 
} from '@element-plus/icons-vue';
import { getFileVersions, restoreFileVersion, deleteFileVersion } from '@/utils/fileManagerAPI';
import { FileVersion } from '@/models/fileManagerModels';
import EnhancedFilePreview from './EnhancedFilePreview.vue';

// Props
const props = defineProps({
  file: {
    type: Object,
    required: true
  }
});

// Emits
const emit = defineEmits(['version-restored', 'version-deleted']);

// 响应式数据
const versions = ref([]);
const loading = ref(false);
const restoring = ref(false);
const selectedVersion = ref(null);
const previewVisible = ref(false);
const previewFile = ref(null);

// 计算属性
const currentVersion = computed(() => {
  return versions.value.find(v => v.isActive);
});

// 方法
const loadVersions = async () => {
  if (!props.file) return;
  
  loading.value = true;
  try {
    const result = await getFileVersions(props.file.name);
    versions.value = result.map(versionData => FileVersion.fromJSON(versionData));
  } catch (error) {
    console.error('Load file versions failed:', error);
  } finally {
    loading.value = false;
  }
};

const refreshVersions = () => {
  selectedVersion.value = null;
  loadVersions();
};

const selectVersion = (version) => {
  if (selectedVersion.value?.id === version.id) {
    selectedVersion.value = null;
  } else {
    selectedVersion.value = version;
  }
};

const previewVersion = (version) => {
  previewFile.value = {
    name: version.fileName,
    fileType: version.fileType,
    size: version.fileSize,
    url: getVersionUrl(version)
  };
  previewVisible.value = true;
};

const downloadVersion = (version) => {
  const url = getVersionUrl(version);
  const link = document.createElement('a');
  link.href = url;
  link.download = version.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const restoreVersion = async (version) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复到版本 v${version.versionNumber} 吗？这将替换当前版本。`,
      '确认恢复版本',
      {
        confirmButtonText: '恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    restoring.value = true;
    const success = await restoreFileVersion(props.file.name, version.id);
    
    if (success) {
      await loadVersions();
      selectedVersion.value = null;
      emit('version-restored', version);
      ElMessage.success(`已恢复到版本 v${version.versionNumber}`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Restore version failed:', error);
    }
  } finally {
    restoring.value = false;
  }
};

const deleteVersion = async (version) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除版本 v${version.versionNumber} 吗？此操作不可撤销。`,
      '确认删除版本',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const success = await deleteFileVersion(props.file.name, version.id);
    
    if (success) {
      await loadVersions();
      if (selectedVersion.value?.id === version.id) {
        selectedVersion.value = null;
      }
      emit('version-deleted', version);
      ElMessage.success(`版本 v${version.versionNumber} 已删除`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete version failed:', error);
    }
  }
};

const handlePreviewDownload = (file) => {
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getVersionUrl = (version) => {
  // 根据实际的版本文件访问URL格式构建
  return `/file/version/${version.storageKey || version.id}`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

const formatFileSize = (size) => {
  if (!size) return '未知';
  const sizeNum = parseFloat(size);
  if (sizeNum < 1) return `${(sizeNum * 1024).toFixed(0)} KB`;
  return `${sizeNum.toFixed(2)} MB`;
};

// 监听器
watch(() => props.file, (newFile) => {
  if (newFile) {
    selectedVersion.value = null;
    loadVersions();
  }
}, { immediate: true });

// 生命周期
onMounted(() => {
  loadVersions();
});

// 暴露给父组件的方法
defineExpose({
  loadVersions,
  refreshVersions
});
</script>

<style scoped>
.file-version-history {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h3 {
  margin: 0 0 4px 0;
  color: #303133;
}

.file-name {
  color: #909399;
  font-size: 14px;
}

.versions-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-item {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.version-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.version-item.active {
  border-color: #67C23A;
  background-color: #F0F9FF;
}

.version-item.selected {
  border-color: #409EFF;
  background-color: #ECF5FF;
}

.version-info {
  margin-bottom: 12px;
}

.version-header-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.version-number {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-badge {
  background: #67C23A;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.version-date {
  color: #909399;
  font-size: 14px;
}

.version-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.detail-item {
  display: flex;
  gap: 4px;
  font-size: 14px;
}

.detail-item .label {
  color: #909399;
  min-width: 60px;
}

.detail-item .value {
  color: #303133;
  font-weight: 500;
}

.version-note {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 14px;
  font-style: italic;
  margin-top: 8px;
}

.version-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.version-item:hover .version-actions {
  opacity: 1;
}

.restore-btn {
  color: #409EFF;
}

.delete-btn {
  color: #F56C6C;
}

.version-compare {
  margin-top: 24px;
  padding: 20px;
  background: #F5F7FA;
  border-radius: 8px;
}

.compare-container {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.compare-item {
  flex: 1;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #EBEEF5;
}

.compare-item h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.compare-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.info-item .label {
  color: #909399;
  min-width: 80px;
}

.info-item .value {
  color: #303133;
  font-weight: 500;
}

.compare-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409EFF;
  font-size: 20px;
}

.compare-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.empty-state p {
  margin: 8px 0 0 0;
  font-size: 14px;
}
</style>
