<template>
  <div class="favorite-file-list">
    <!-- 文件列表 -->
    <div class="file-list" v-loading="loading">
      <div v-if="filteredFiles.length > 0" class="files-grid">
        <div
          v-for="file in filteredFiles"
          :key="file.id"
          class="file-card"
          @click="selectFile(file)"
          @contextmenu.prevent="showContextMenu($event, file)"
        >
          <!-- 文件预览 -->
          <div class="file-preview">
            <img
              v-if="isImage(file.fileType)"
              :src="getFileUrl(file.fileId)"
              :alt="file.fileName"
              class="preview-image"
              @error="handleImageError"
            />
            <div v-else class="file-icon">
              <el-icon :size="48">
                <component :is="getFileIcon(file.fileType)" />
              </el-icon>
            </div>
            
            <!-- 收藏标记 -->
            <div class="favorite-badge">
              <el-icon :size="16" color="#F56C6C">
                <Star />
              </el-icon>
            </div>
          </div>
          
          <!-- 文件信息 -->
          <div class="file-info">
            <h4 class="file-name" :title="file.fileName">{{ file.fileName }}</h4>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
              <span class="file-date">{{ formatDate(file.addedAt) }}</span>
            </div>
            <div class="file-note" v-if="file.note">
              <el-icon :size="12"><EditPen /></el-icon>
              <span>{{ file.note }}</span>
            </div>
          </div>
          
          <!-- 文件操作 -->
          <div class="file-actions">
            <el-button
              type="text"
              size="small"
              @click.stop="previewFile(file)"
              :icon="View"
              title="预览"
            />
            <el-button
              type="text"
              size="small"
              @click.stop="downloadFile(file)"
              :icon="Download"
              title="下载"
            />
            <el-button
              type="text"
              size="small"
              @click.stop="editNote(file)"
              :icon="EditPen"
              title="编辑备注"
            />
            <el-button
              type="text"
              size="small"
              @click.stop="removeFromFavorites(file)"
              :icon="Delete"
              class="remove-btn"
              title="移除收藏"
            />
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="!loading" class="empty-state">
        <el-empty description="该分组中暂无收藏文件">
          <el-button type="primary" @click="$emit('add-files')">添加文件到收藏夹</el-button>
        </el-empty>
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 编辑备注对话框 -->
    <el-dialog
      v-model="noteDialogVisible"
      title="编辑收藏备注"
      width="400px"
    >
      <el-form>
        <el-form-item label="文件名">
          <span>{{ currentFile?.fileName }}</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="noteText"
            type="textarea"
            :rows="4"
            placeholder="为这个收藏添加备注..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="noteDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNote" :loading="savingNote">保存</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 文件预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="currentFile?.fileName"
      width="80%"
      top="5vh"
    >
      <div class="file-preview-container">
        <img
          v-if="currentFile && isImage(currentFile.fileType)"
          :src="getFileUrl(currentFile.fileId)"
          :alt="currentFile.fileName"
          class="preview-full-image"
        />
        <div v-else class="unsupported-preview">
          <el-icon :size="64"><Document /></el-icon>
          <p>该文件类型不支持预览</p>
          <el-button type="primary" @click="downloadFile(currentFile)">下载文件</el-button>
        </div>
      </div>
    </el-dialog>
    
    <!-- 右键菜单 -->
    <ContextMenu
      v-model:visible="contextMenuVisible"
      :x="contextMenuX"
      :y="contextMenuY"
      :items="contextMenuItems"
      @item-click="handleContextMenuClick"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Star, View, Download, EditPen, Delete, Document, 
  Picture, VideoPlay, Headphones, Box 
} from '@element-plus/icons-vue';
// import {
//   getFavoriteFiles,
//   removeFromFavorites,
//   updateFavoriteNote
// } from '@/utils/fileManagerAPI';
// import ContextMenu from './ContextMenu.vue';

// Props
const props = defineProps({
  groupId: {
    type: String,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['file-removed', 'files-updated', 'add-files']);

// 响应式数据
const files = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const currentFile = ref(null);
const noteDialogVisible = ref(false);
const previewDialogVisible = ref(false);
const noteText = ref('');
const savingNote = ref(false);

// 右键菜单
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuItems = ref([
  { key: 'preview', label: '预览', icon: 'View' },
  { key: 'download', label: '下载', icon: 'Download' },
  { key: 'edit-note', label: '编辑备注', icon: 'EditPen' },
  { key: 'remove', label: '移除收藏', icon: 'Delete', danger: true }
]);

// 计算属性
const filteredFiles = computed(() => {
  if (!props.searchQuery) return files.value;
  const query = props.searchQuery.toLowerCase();
  return files.value.filter(file => 
    file.fileName.toLowerCase().includes(query) ||
    (file.note && file.note.toLowerCase().includes(query))
  );
});

// 方法
const loadFiles = async () => {
  if (!props.groupId) return;
  
  loading.value = true;
  try {
    const result = await getFavoriteFiles(props.groupId, {
      start: (currentPage.value - 1) * pageSize.value,
      count: pageSize.value
    });
    
    if (result.success) {
      files.value = result.files || [];
      total.value = result.total || 0;
    }
  } catch (error) {
    console.error('Load favorite files failed:', error);
  } finally {
    loading.value = false;
  }
};

const selectFile = (file) => {
  currentFile.value = file;
};

const previewFile = (file) => {
  currentFile.value = file;
  previewDialogVisible.value = true;
};

const downloadFile = (file) => {
  const url = getFileUrl(file.fileId);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const editNote = (file) => {
  currentFile.value = file;
  noteText.value = file.note || '';
  noteDialogVisible.value = true;
};

const saveNote = async () => {
  if (!currentFile.value) return;
  
  savingNote.value = true;
  try {
    const success = await updateFavoriteNote(currentFile.value.id, noteText.value);
    if (success) {
      currentFile.value.note = noteText.value;
      noteDialogVisible.value = false;
      ElMessage.success('备注保存成功');
      emit('files-updated');
    }
  } catch (error) {
    console.error('Save note failed:', error);
    ElMessage.error('备注保存失败');
  } finally {
    savingNote.value = false;
  }
};

const removeFromFavorites = async (file) => {
  try {
    await ElMessageBox.confirm(
      `确定要将 "${file.fileName}" 从收藏夹中移除吗？`,
      '确认移除',
      {
        confirmButtonText: '移除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const success = await removeFromFavorites(file.fileId, props.groupId);
    if (success) {
      await loadFiles();
      emit('file-removed', file);
    }
  } catch {
    // 用户取消
  }
};

const showContextMenu = (event, file) => {
  currentFile.value = file;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const handleContextMenuClick = (key) => {
  if (!currentFile.value) return;
  
  switch (key) {
    case 'preview':
      previewFile(currentFile.value);
      break;
    case 'download':
      downloadFile(currentFile.value);
      break;
    case 'edit-note':
      editNote(currentFile.value);
      break;
    case 'remove':
      removeFromFavorites(currentFile.value);
      break;
  }
  contextMenuVisible.value = false;
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadFiles();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  loadFiles();
};

const isImage = (fileType) => {
  return fileType && fileType.startsWith('image/');
};

const getFileIcon = (fileType) => {
  if (!fileType) return Document;
  
  if (fileType.startsWith('image/')) return Picture;
  if (fileType.startsWith('video/')) return VideoPlay;
  if (fileType.startsWith('audio/')) return Headphones;
  if (fileType.includes('zip') || fileType.includes('rar')) return Box;
  
  return Document;
};

const getFileUrl = (fileId) => {
  // 根据实际的文件访问URL格式构建
  return `/file/${fileId}`;
};

const formatFileSize = (size) => {
  if (!size) return '未知';
  const sizeNum = parseFloat(size);
  if (sizeNum < 1) return `${(sizeNum * 1024).toFixed(0)} KB`;
  return `${sizeNum.toFixed(2)} MB`;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
  event.target.nextElementSibling.style.display = 'flex';
};

// 监听器
watch(() => props.groupId, () => {
  currentPage.value = 1;
  loadFiles();
}, { immediate: true });

watch(() => props.searchQuery, () => {
  // 搜索逻辑已在计算属性中处理
});

// 生命周期
onMounted(() => {
  loadFiles();
});

// 暴露给父组件的方法
defineExpose({
  loadFiles,
  refresh: loadFiles
});
</script>

<style scoped>
.favorite-file-list {
  min-height: 400px;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.file-card {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.file-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.file-card:hover .file-actions {
  opacity: 1;
}

.file-preview {
  position: relative;
  height: 150px;
  background: #F5F7FA;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  color: #909399;
}

.favorite-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-info {
  padding: 12px;
}

.file-name {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}

.file-note {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 12px;
  font-style: italic;
}

.file-actions {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.file-actions .el-button {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  padding: 4px;
  min-height: auto;
}

.remove-btn {
  color: #F56C6C;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.file-preview-container {
  text-align: center;
}

.preview-full-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.unsupported-preview {
  padding: 40px;
  color: #909399;
}

.unsupported-preview p {
  margin: 16px 0;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 9999;
  min-width: 120px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: background-color 0.3s;
}

.context-menu-item:hover {
  background-color: #f5f7fa;
}

.context-menu-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}
</style>
