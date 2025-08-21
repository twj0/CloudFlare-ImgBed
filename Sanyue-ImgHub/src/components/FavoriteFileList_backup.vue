<template>
  <div class="favorite-file-list">
    <div class="list-header">
      <h3>收藏文件列表</h3>
      <div class="header-actions">
        <el-button @click="refreshList" :icon="Refresh" size="small">
          刷新
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="files.length === 0" class="empty-state">
      <el-empty description="暂无收藏文件">
        <el-button type="primary" @click="$emit('add-files')">
          添加收藏
        </el-button>
      </el-empty>
    </div>

    <div v-else class="file-list">
      <div
        v-for="file in files"
        :key="file.id"
        class="file-item"
        @click="selectFile(file)"
        @contextmenu.prevent="showContextMenu($event, file)"
      >
        <div class="file-preview">
          <img
            v-if="isImageFile(file)"
            :src="file.url"
            :alt="file.fileName"
            class="file-thumbnail"
            @error="handleImageError"
          />
          <div v-else class="file-icon">
            <el-icon :size="32">
              <Document />
            </el-icon>
          </div>
        </div>

        <div class="file-info">
          <div class="file-name" :title="file.fileName">
            {{ file.fileName }}
          </div>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
            <span class="added-date">{{ formatDate(file.addedAt) }}</span>
          </div>
          <div v-if="file.note" class="file-note">
            {{ file.note }}
          </div>
        </div>

        <div class="file-actions">
          <el-button
            type="text"
            size="small"
            @click.stop="previewFile(file)"
            :icon="View"
          >
            预览
          </el-button>
          <el-button
            type="text"
            size="small"
            @click.stop="removeFromFavorites(file)"
            :icon="Delete"
          >
            移除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Refresh, View, Delete, Document
} from '@element-plus/icons-vue';

// Props
const props = defineProps({
  groupId: {
    type: String,
    default: 'default'
  }
});

// Emits
const emit = defineEmits(['file-select', 'refresh', 'add-files']);

// 响应式数据
const loading = ref(false);
const files = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

// 计算属性
const paginatedFiles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return files.value.slice(start, end);
});

// 方法
const loadFiles = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    files.value = [];
    total.value = 0;
  } catch (error) {
    console.error('Load files failed:', error);
    ElMessage.error('加载文件失败');
  } finally {
    loading.value = false;
  }
};

const refreshList = () => {
  loadFiles();
  emit('refresh');
};

const selectFile = (file) => {
  emit('file-select', file);
};

const previewFile = (file) => {
  // 预览文件逻辑
  console.log('Preview file:', file);
};

const removeFromFavorites = async (file) => {
  try {
    await ElMessageBox.confirm(
      `确定要从收藏夹中移除 "${file.fileName}" 吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 移除逻辑
    ElMessage.success('已从收藏夹移除');
    loadFiles();
  } catch {
    // 用户取消
  }
};

const showContextMenu = (event, file) => {
  // 右键菜单逻辑
  console.log('Context menu for:', file);
};

const isImageFile = (file) => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const extension = file.fileName.split('.').pop()?.toLowerCase();
  return imageTypes.includes(extension);
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
  return date.toLocaleDateString('zh-CN');
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
};

const handleSizeChange = (newSize) => {
  pageSize.value = newSize;
  currentPage.value = 1;
  loadFiles();
};

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage;
  loadFiles();
};

// 监听器
watch(() => props.groupId, () => {
  loadFiles();
}, { immediate: true });

// 生命周期
onMounted(() => {
  loadFiles();
});
</script>

<style scoped>
.favorite-file-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.loading-container {
  padding: 20px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.file-item:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-preview {
  width: 48px;
  height: 48px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
}

.file-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.file-icon {
  color: var(--el-text-color-regular);
}

.file-info {
  flex: 1;
  min-width: 0;
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
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
}

.file-note {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.pagination {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: center;
}
</style>
