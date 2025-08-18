<template>
  <div class="enhanced-batch-operations">
    <!-- 批量操作工具栏 -->
    <div class="batch-toolbar" v-if="selectedFiles.length > 0">
      <div class="toolbar-left">
        <span class="selection-count">
          已选择 {{ selectedFiles.length }} 个项目
        </span>
        <el-button @click="clearSelection" size="small" text>
          取消选择
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <el-button-group>
          <!-- 基础操作 -->
          <el-dropdown @command="handleBasicOperation" trigger="click">
            <el-button size="small" :icon="Operation">
              基础操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="download">
                  <el-icon><Download /></el-icon>
                  批量下载
                </el-dropdown-item>
                <el-dropdown-item command="copy">
                  <el-icon><CopyDocument /></el-icon>
                  批量复制
                </el-dropdown-item>
                <el-dropdown-item command="move">
                  <el-icon><FolderOpened /></el-icon>
                  批量移动
                </el-dropdown-item>
                <el-dropdown-item command="rename" divided>
                  <el-icon><Edit /></el-icon>
                  批量重命名
                </el-dropdown-item>
                <el-dropdown-item command="delete" class="danger">
                  <el-icon><Delete /></el-icon>
                  批量删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <!-- 标签操作 -->
          <el-dropdown @command="handleTagOperation" trigger="click">
            <el-button size="small" :icon="PriceTag">
              标签操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="add-tags">
                  <el-icon><Plus /></el-icon>
                  添加标签
                </el-dropdown-item>
                <el-dropdown-item command="remove-tags">
                  <el-icon><Minus /></el-icon>
                  移除标签
                </el-dropdown-item>
                <el-dropdown-item command="replace-tags">
                  <el-icon><Refresh /></el-icon>
                  替换标签
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <!-- 收藏操作 -->
          <el-dropdown @command="handleFavoriteOperation" trigger="click">
            <el-button size="small" :icon="Star">
              收藏操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="add-favorites">
                  <el-icon><Star /></el-icon>
                  添加到收藏夹
                </el-dropdown-item>
                <el-dropdown-item command="remove-favorites">
                  <el-icon><StarFilled /></el-icon>
                  从收藏夹移除
                </el-dropdown-item>
                <el-dropdown-item command="move-favorites">
                  <el-icon><FolderOpened /></el-icon>
                  移动收藏分组
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <!-- 高级操作 -->
          <el-dropdown @command="handleAdvancedOperation" trigger="click">
            <el-button size="small" :icon="Setting">
              高级操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="compress">
                  <el-icon><Box /></el-icon>
                  压缩文件
                </el-dropdown-item>
                <el-dropdown-item command="permissions">
                  <el-icon><Lock /></el-icon>
                  设置权限
                </el-dropdown-item>
                <el-dropdown-item command="metadata">
                  <el-icon><InfoFilled /></el-icon>
                  编辑元数据
                </el-dropdown-item>
                <el-dropdown-item command="export">
                  <el-icon><Upload /></el-icon>
                  导出列表
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-button-group>
      </div>
    </div>

    <!-- 批量重命名对话框 -->
    <el-dialog
      v-model="renameDialogVisible"
      title="批量重命名"
      width="600px"
      @close="resetRenameDialog"
    >
      <div class="rename-content">
        <div class="rename-options">
          <el-radio-group v-model="renameMode">
            <el-radio label="pattern">使用模式重命名</el-radio>
            <el-radio label="sequence">序号重命名</el-radio>
            <el-radio label="replace">查找替换</el-radio>
          </el-radio-group>
        </div>
        
        <!-- 模式重命名 -->
        <div v-if="renameMode === 'pattern'" class="rename-pattern">
          <el-form-item label="命名模式">
            <el-input
              v-model="renamePattern"
              placeholder="例如: 文件_{index}_{date}"
            />
            <div class="pattern-help">
              可用变量: {index} - 序号, {date} - 日期, {time} - 时间, {original} - 原文件名
            </div>
          </el-form-item>
        </div>
        
        <!-- 序号重命名 -->
        <div v-if="renameMode === 'sequence'" class="rename-sequence">
          <el-form-item label="基础名称">
            <el-input v-model="sequenceBaseName" placeholder="例如: 图片" />
          </el-form-item>
          <el-form-item label="起始序号">
            <el-input-number v-model="sequenceStart" :min="1" />
          </el-form-item>
          <el-form-item label="序号位数">
            <el-input-number v-model="sequenceDigits" :min="1" :max="6" />
          </el-form-item>
        </div>
        
        <!-- 查找替换 -->
        <div v-if="renameMode === 'replace'" class="rename-replace">
          <el-form-item label="查找内容">
            <el-input v-model="replaceFind" placeholder="要替换的文本" />
          </el-form-item>
          <el-form-item label="替换为">
            <el-input v-model="replaceWith" placeholder="替换后的文本" />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="replaceRegex">使用正则表达式</el-checkbox>
            <el-checkbox v-model="replaceCaseSensitive">区分大小写</el-checkbox>
          </el-form-item>
        </div>
        
        <!-- 预览 -->
        <div class="rename-preview">
          <h4>重命名预览</h4>
          <div class="preview-list">
            <div
              v-for="(preview, index) in renamePreview"
              :key="index"
              class="preview-item"
            >
              <span class="original-name">{{ preview.original }}</span>
              <el-icon class="arrow"><Right /></el-icon>
              <span class="new-name">{{ preview.new }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="renameDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="executeBatchRename"
            :loading="renaming"
            :disabled="!isRenameValid"
          >
            执行重命名
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量压缩对话框 -->
    <el-dialog
      v-model="compressDialogVisible"
      title="批量压缩"
      width="500px"
    >
      <el-form :model="compressForm" label-width="100px">
        <el-form-item label="压缩包名称">
          <el-input
            v-model="compressForm.name"
            placeholder="请输入压缩包名称"
            :suffix-icon="compressForm.format === 'zip' ? '.zip' : compressForm.format === 'tar' ? '.tar' : '.tar.gz'"
          />
        </el-form-item>
        <el-form-item label="压缩格式">
          <el-radio-group v-model="compressForm.format">
            <el-radio label="zip">ZIP</el-radio>
            <el-radio label="tar">TAR</el-radio>
            <el-radio label="tar.gz">TAR.GZ</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="压缩级别">
          <el-slider
            v-model="compressForm.level"
            :min="1"
            :max="9"
            :marks="{ 1: '最快', 5: '平衡', 9: '最小' }"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="compressDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="executeBatchCompress"
            :loading="compressing"
          >
            开始压缩
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 权限设置对话框 -->
    <el-dialog
      v-model="permissionsDialogVisible"
      title="批量设置权限"
      width="400px"
    >
      <div class="permissions-content">
        <el-radio-group v-model="selectedPermission">
          <div class="permission-option">
            <el-radio label="public">
              <div class="permission-info">
                <div class="permission-title">公开</div>
                <div class="permission-desc">所有人都可以访问</div>
              </div>
            </el-radio>
          </div>
          <div class="permission-option">
            <el-radio label="protected">
              <div class="permission-info">
                <div class="permission-title">受保护</div>
                <div class="permission-desc">需要密码才能访问</div>
              </div>
            </el-radio>
          </div>
          <div class="permission-option">
            <el-radio label="private">
              <div class="permission-info">
                <div class="permission-title">私有</div>
                <div class="permission-desc">仅管理员可以访问</div>
              </div>
            </el-radio>
          </div>
        </el-radio-group>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionsDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="executeBatchPermissions"
            :loading="settingPermissions"
          >
            应用权限
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 操作进度对话框 -->
    <el-dialog
      v-model="progressDialogVisible"
      :title="progressTitle"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="progress-content">
        <el-progress
          :percentage="progressPercentage"
          :status="progressStatus"
          :stroke-width="8"
        />
        <div class="progress-info">
          <div class="progress-text">{{ progressText }}</div>
          <div class="progress-details">
            {{ progressCurrent }} / {{ progressTotal }}
          </div>
        </div>
        
        <!-- 错误列表 -->
        <div v-if="progressErrors.length > 0" class="progress-errors">
          <el-collapse>
            <el-collapse-item title="查看错误详情" name="errors">
              <div
                v-for="(error, index) in progressErrors"
                :key="index"
                class="error-item"
              >
                <span class="error-file">{{ error.file }}</span>
                <span class="error-message">{{ error.message }}</span>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button
            v-if="progressStatus === 'success' || progressStatus === 'exception'"
            @click="progressDialogVisible = false"
          >
            关闭
          </el-button>
          <el-button
            v-else
            @click="cancelOperation"
            type="danger"
          >
            取消操作
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Operation, ArrowDown, Download, CopyDocument, FolderOpened, Edit, Delete,
  PriceTag, Plus, Minus, Refresh, Star, StarFilled, Setting, Box, Lock,
  InfoFilled, Upload, Right
} from '@element-plus/icons-vue';
import {
  batchAddTags,
  batchRemoveTags,
  batchAddToFavorites,
  batchRemoveFromFavorites,
  batchCopyFiles,
  batchRenameFiles,
  batchSetPermissions,
  batchCompressFiles
} from '@/utils/fileManagerAPI';

// Props
const props = defineProps({
  selectedFiles: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['clear-selection', 'operation-complete', 'refresh']);

// 响应式数据
const renameDialogVisible = ref(false);
const compressDialogVisible = ref(false);
const permissionsDialogVisible = ref(false);
const progressDialogVisible = ref(false);

// 重命名相关
const renameMode = ref('pattern');
const renamePattern = ref('');
const sequenceBaseName = ref('');
const sequenceStart = ref(1);
const sequenceDigits = ref(3);
const replaceFind = ref('');
const replaceWith = ref('');
const replaceRegex = ref(false);
const replaceCaseSensitive = ref(false);
const renaming = ref(false);

// 压缩相关
const compressForm = reactive({
  name: '',
  format: 'zip',
  level: 5
});
const compressing = ref(false);

// 权限相关
const selectedPermission = ref('public');
const settingPermissions = ref(false);

// 进度相关
const progressTitle = ref('');
const progressPercentage = ref(0);
const progressStatus = ref('');
const progressText = ref('');
const progressCurrent = ref(0);
const progressTotal = ref(0);
const progressErrors = ref([]);
const operationCancelled = ref(false);

// 计算属性
const renamePreview = computed(() => {
  if (!props.selectedFiles.length) return [];
  
  return props.selectedFiles.slice(0, 5).map((file, index) => {
    let newName = '';
    
    switch (renameMode.value) {
      case 'pattern':
        newName = generatePatternName(file.name, index);
        break;
      case 'sequence':
        newName = generateSequenceName(file.name, index);
        break;
      case 'replace':
        newName = generateReplaceName(file.name);
        break;
    }
    
    return {
      original: file.name,
      new: newName
    };
  });
});

const isRenameValid = computed(() => {
  switch (renameMode.value) {
    case 'pattern':
      return renamePattern.value.trim() !== '';
    case 'sequence':
      return sequenceBaseName.value.trim() !== '';
    case 'replace':
      return replaceFind.value.trim() !== '';
    default:
      return false;
  }
});

// 方法
const clearSelection = () => {
  emit('clear-selection');
};

const handleBasicOperation = (command) => {
  switch (command) {
    case 'download':
      handleBatchDownload();
      break;
    case 'copy':
      handleBatchCopy();
      break;
    case 'move':
      handleBatchMove();
      break;
    case 'rename':
      showRenameDialog();
      break;
    case 'delete':
      handleBatchDelete();
      break;
  }
};

const handleTagOperation = (command) => {
  switch (command) {
    case 'add-tags':
      handleBatchAddTags();
      break;
    case 'remove-tags':
      handleBatchRemoveTags();
      break;
    case 'replace-tags':
      handleBatchReplaceTags();
      break;
  }
};

const handleFavoriteOperation = (command) => {
  switch (command) {
    case 'add-favorites':
      handleBatchAddFavorites();
      break;
    case 'remove-favorites':
      handleBatchRemoveFavorites();
      break;
    case 'move-favorites':
      handleBatchMoveFavorites();
      break;
  }
};

const handleAdvancedOperation = (command) => {
  switch (command) {
    case 'compress':
      showCompressDialog();
      break;
    case 'permissions':
      showPermissionsDialog();
      break;
    case 'metadata':
      handleBatchMetadata();
      break;
    case 'export':
      handleExportList();
      break;
  }
};

// 具体操作方法
const handleBatchDownload = () => {
  // 实现批量下载逻辑
  ElMessage.info('批量下载功能开发中...');
};

const handleBatchCopy = () => {
  // 实现批量复制逻辑
  ElMessage.info('批量复制功能开发中...');
};

const handleBatchMove = () => {
  // 实现批量移动逻辑
  ElMessage.info('批量移动功能开发中...');
};

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${props.selectedFiles.length} 个项目吗？此操作不可撤销。`,
      '确认批量删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 实现批量删除逻辑
    ElMessage.info('批量删除功能开发中...');
  } catch {
    // 用户取消
  }
};

const showRenameDialog = () => {
  renameDialogVisible.value = true;
  // 设置默认压缩包名称
  if (props.selectedFiles.length > 0) {
    const firstFile = props.selectedFiles[0];
    const baseName = firstFile.name.split('.')[0];
    sequenceBaseName.value = baseName;
  }
};

const showCompressDialog = () => {
  compressDialogVisible.value = true;
  // 设置默认压缩包名称
  const date = new Date().toISOString().split('T')[0];
  compressForm.name = `批量文件_${date}`;
};

const showPermissionsDialog = () => {
  permissionsDialogVisible.value = true;
};

const resetRenameDialog = () => {
  renameMode.value = 'pattern';
  renamePattern.value = '';
  sequenceBaseName.value = '';
  sequenceStart.value = 1;
  sequenceDigits.value = 3;
  replaceFind.value = '';
  replaceWith.value = '';
  replaceRegex.value = false;
  replaceCaseSensitive.value = false;
};

// 重命名相关方法
const generatePatternName = (originalName, index) => {
  const ext = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(`.${ext}`, '');
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  
  return renamePattern.value
    .replace('{index}', (index + 1).toString().padStart(sequenceDigits.value, '0'))
    .replace('{date}', date)
    .replace('{time}', time)
    .replace('{original}', nameWithoutExt) + `.${ext}`;
};

const generateSequenceName = (originalName, index) => {
  const ext = originalName.split('.').pop();
  const number = (sequenceStart.value + index).toString().padStart(sequenceDigits.value, '0');
  return `${sequenceBaseName.value}_${number}.${ext}`;
};

const generateReplaceName = (originalName) => {
  if (!replaceFind.value) return originalName;
  
  let flags = 'g';
  if (!replaceCaseSensitive.value) flags += 'i';
  
  if (replaceRegex.value) {
    try {
      const regex = new RegExp(replaceFind.value, flags);
      return originalName.replace(regex, replaceWith.value);
    } catch {
      return originalName;
    }
  } else {
    const regex = new RegExp(replaceFind.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    return originalName.replace(regex, replaceWith.value);
  }
};

const executeBatchRename = async () => {
  if (!isRenameValid.value) return;
  
  renaming.value = true;
  try {
    const renameList = props.selectedFiles.map((file, index) => ({
      fileId: file.name,
      newName: renameMode.value === 'pattern' 
        ? generatePatternName(file.name, index)
        : renameMode.value === 'sequence'
        ? generateSequenceName(file.name, index)
        : generateReplaceName(file.name)
    }));
    
    const result = await batchRenameFiles(renameList);
    if (result.success) {
      renameDialogVisible.value = false;
      emit('operation-complete', 'rename', result);
      emit('refresh');
    }
  } catch (error) {
    console.error('Batch rename failed:', error);
  } finally {
    renaming.value = false;
  }
};

const executeBatchCompress = async () => {
  if (!compressForm.name.trim()) {
    ElMessage.warning('请输入压缩包名称');
    return;
  }
  
  compressing.value = true;
  try {
    const fileIds = props.selectedFiles.map(file => file.name);
    const result = await batchCompressFiles(fileIds, compressForm.name, compressForm.format);
    
    if (result.success) {
      compressDialogVisible.value = false;
      emit('operation-complete', 'compress', result);
    }
  } catch (error) {
    console.error('Batch compress failed:', error);
  } finally {
    compressing.value = false;
  }
};

const executeBatchPermissions = async () => {
  settingPermissions.value = true;
  try {
    const fileIds = props.selectedFiles.map(file => file.name);
    const result = await batchSetPermissions(fileIds, selectedPermission.value);
    
    if (result.success) {
      permissionsDialogVisible.value = false;
      emit('operation-complete', 'permissions', result);
      emit('refresh');
    }
  } catch (error) {
    console.error('Batch set permissions failed:', error);
  } finally {
    settingPermissions.value = false;
  }
};

// 其他批量操作的占位方法
const handleBatchAddTags = () => {
  ElMessage.info('批量添加标签功能请使用标签选择器');
};

const handleBatchRemoveTags = () => {
  ElMessage.info('批量移除标签功能请使用标签选择器');
};

const handleBatchReplaceTags = () => {
  ElMessage.info('批量替换标签功能开发中...');
};

const handleBatchAddFavorites = () => {
  ElMessage.info('批量添加收藏功能请使用收藏夹操作');
};

const handleBatchRemoveFavorites = () => {
  ElMessage.info('批量移除收藏功能请使用收藏夹操作');
};

const handleBatchMoveFavorites = () => {
  ElMessage.info('批量移动收藏分组功能开发中...');
};

const handleBatchMetadata = () => {
  ElMessage.info('批量编辑元数据功能开发中...');
};

const handleExportList = () => {
  // 导出选中文件列表
  const fileList = props.selectedFiles.map(file => ({
    name: file.name,
    size: file.size,
    type: file.fileType,
    modifiedDate: file.modifiedDate
  }));
  
  const dataStr = JSON.stringify(fileList, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `文件列表_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  ElMessage.success('文件列表已导出');
};

const cancelOperation = () => {
  operationCancelled.value = true;
  progressDialogVisible.value = false;
};

// 暴露给父组件的方法
defineExpose({
  selectedFiles: computed(() => props.selectedFiles)
});
</script>

<style scoped>
.enhanced-batch-operations {
  position: relative;
}

.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #F0F9FF;
  border: 1px solid #409EFF;
  border-radius: 8px;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selection-count {
  color: #409EFF;
  font-weight: 500;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.danger {
  color: #F56C6C;
}

.rename-content {
  padding: 16px 0;
}

.rename-options {
  margin-bottom: 20px;
}

.pattern-help {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.rename-preview {
  margin-top: 20px;
  padding: 16px;
  background: #F5F7FA;
  border-radius: 8px;
}

.rename-preview h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.preview-list {
  max-height: 200px;
  overflow-y: auto;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 14px;
}

.original-name {
  color: #909399;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  color: #409EFF;
}

.new-name {
  color: #303133;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.permissions-content {
  padding: 16px 0;
}

.permission-option {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  transition: all 0.3s;
}

.permission-option:hover {
  border-color: #409EFF;
  background-color: #F0F9FF;
}

.permission-info {
  margin-left: 24px;
}

.permission-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.permission-desc {
  font-size: 12px;
  color: #909399;
}

.progress-content {
  padding: 16px 0;
}

.progress-info {
  margin-top: 16px;
  text-align: center;
}

.progress-text {
  color: #303133;
  margin-bottom: 4px;
}

.progress-details {
  color: #909399;
  font-size: 14px;
}

.progress-errors {
  margin-top: 16px;
}

.error-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #F0F0F0;
}

.error-file {
  color: #303133;
  font-weight: 500;
}

.error-message {
  color: #F56C6C;
  font-size: 12px;
}
</style>
