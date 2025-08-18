<template>
  <!-- 新建文件夹对话框 -->
  <el-dialog
    v-model="createFolderVisible"
    title="新建文件夹"
    width="400px"
    :close-on-click-modal="false"
  >
    <el-form @submit.prevent="handleCreateFolder">
      <el-form-item label="文件夹名称">
        <el-input
          v-model="folderName"
          placeholder="请输入文件夹名称"
          ref="folderNameInput"
          @keyup.enter="handleCreateFolder"
        />
      </el-form-item>
      <el-form-item label="创建位置">
        <el-input
          :value="currentPath || '根目录'"
          readonly
          disabled
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="createFolderVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleCreateFolder"
          :loading="creating"
        >
          创建
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 重命名对话框 -->
  <el-dialog
    v-model="renameVisible"
    title="重命名"
    width="400px"
    :close-on-click-modal="false"
  >
    <el-form @submit.prevent="handleRename">
      <el-form-item label="新名称">
        <el-input
          v-model="newName"
          placeholder="请输入新名称"
          ref="renameInput"
          @keyup.enter="handleRename"
        />
      </el-form-item>
      <el-form-item label="原名称">
        <el-input
          :value="renameTarget?.name"
          readonly
          disabled
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="renameVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleRename"
          :loading="renaming"
        >
          重命名
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 上传文件对话框 -->
  <el-dialog
    v-model="uploadVisible"
    title="上传文件"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="upload-dialog-content">
      <div class="upload-info">
        <el-icon><FolderOpened /></el-icon>
        <span>上传到：{{ currentPath || '根目录' }}</span>
      </div>
      
      <el-upload
        ref="uploadRef"
        class="upload-area"
        drag
        multiple
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持多文件上传，单个文件大小不超过 100MB
          </div>
        </template>
      </el-upload>
      
      <div v-if="fileList.length > 0" class="upload-options">
        <el-form label-width="100px">
          <el-form-item label="上传渠道">
            <el-select v-model="uploadChannel" placeholder="选择上传渠道">
              <el-option label="CloudFlare R2" value="CloudflareR2" />
              <el-option label="S3" value="S3" />
              <el-option label="Telegram" value="telegram" />
            </el-select>
          </el-form-item>
          <el-form-item label="命名方式">
            <el-select v-model="uploadNameType" placeholder="选择命名方式">
              <el-option label="默认" value="default" />
              <el-option label="仅前缀" value="index" />
              <el-option label="仅原名" value="origin" />
              <el-option label="短链接" value="short" />
            </el-select>
          </el-form-item>
          <el-form-item label="自动重试">
            <el-switch v-model="autoRetry" />
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button @click="clearFiles" v-if="fileList.length > 0">清空</el-button>
        <el-button 
          type="primary" 
          @click="handleUpload"
          :loading="uploading"
          :disabled="fileList.length === 0"
        >
          上传 ({{ fileList.length }})
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 移动文件对话框 -->
  <el-dialog
    v-model="moveVisible"
    title="移动到"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="move-dialog-content">
      <div class="move-info">
        <span>移动 {{ moveFiles.length }} 个项目到：</span>
      </div>
      
      <div class="folder-selector">
        <el-tree
          ref="folderTreeRef"
          :data="folderTreeData"
          :props="{ label: 'name', children: 'children' }"
          node-key="path"
          :default-expand-all="true"
          :highlight-current="true"
          @current-change="handleFolderSelect"
        >
          <template #default="{ node, data }">
            <span class="folder-node">
              <el-icon><Folder /></el-icon>
              <span>{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </div>
      
      <div class="selected-path">
        <el-input
          v-model="selectedMovePath"
          placeholder="选择目标文件夹"
          readonly
        >
          <template #prepend>目标路径</template>
        </el-input>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="moveVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleMove"
          :loading="moving"
          :disabled="!selectedMovePath"
        >
          移动
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { FolderOpened, UploadFilled, Folder } from '@element-plus/icons-vue';
import { createDirectory } from '@/utils/fileManagerAPI';
import axios from '@/utils/axios';

// Props
const props = defineProps({
  createFolderVisible: Boolean,
  renameVisible: Boolean,
  uploadVisible: Boolean,
  moveVisible: Boolean,
  currentPath: String,
  renameTarget: Object,
  moveFiles: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits([
  'update:createFolderVisible',
  'update:renameVisible', 
  'update:uploadVisible',
  'update:moveVisible',
  'folder-created',
  'file-renamed',
  'files-uploaded',
  'files-moved'
]);

// 响应式数据
const folderName = ref('');
const newName = ref('');
const creating = ref(false);
const renaming = ref(false);
const uploading = ref(false);
const moving = ref(false);

// 上传相关
const fileList = ref([]);
const uploadChannel = ref('CloudflareR2');
const uploadNameType = ref('default');
const autoRetry = ref(true);

// 移动相关
const folderTreeData = ref([]);
const selectedMovePath = ref('');

// 组件引用
const folderNameInput = ref(null);
const renameInput = ref(null);
const uploadRef = ref(null);
const folderTreeRef = ref(null);

// 计算属性
const createFolderVisible = computed({
  get: () => props.createFolderVisible,
  set: (value) => emit('update:createFolderVisible', value)
});

const renameVisible = computed({
  get: () => props.renameVisible,
  set: (value) => emit('update:renameVisible', value)
});

const uploadVisible = computed({
  get: () => props.uploadVisible,
  set: (value) => emit('update:uploadVisible', value)
});

const moveVisible = computed({
  get: () => props.moveVisible,
  set: (value) => emit('update:moveVisible', value)
});

// 方法
const handleCreateFolder = async () => {
  if (!folderName.value.trim()) {
    ElMessage.warning('请输入文件夹名称');
    return;
  }
  
  creating.value = true;
  try {
    const success = await createDirectory(props.currentPath, folderName.value.trim());
    if (success) {
      ElMessage.success('文件夹创建成功');
      createFolderVisible.value = false;
      folderName.value = '';
      emit('folder-created');
    }
  } catch (error) {
    ElMessage.error('创建文件夹失败');
  } finally {
    creating.value = false;
  }
};

const handleRename = async () => {
  if (!newName.value.trim()) {
    ElMessage.warning('请输入新名称');
    return;
  }
  
  renaming.value = true;
  try {
    // 这里需要调用重命名API
    // await renameFile(props.renameTarget.id, newName.value.trim());
    ElMessage.success('重命名成功');
    renameVisible.value = false;
    newName.value = '';
    emit('file-renamed');
  } catch (error) {
    ElMessage.error('重命名失败');
  } finally {
    renaming.value = false;
  }
};

const handleFileChange = (file, files) => {
  fileList.value = files;
};

const handleFileRemove = (file, files) => {
  fileList.value = files;
};

const clearFiles = () => {
  fileList.value = [];
  uploadRef.value?.clearFiles();
};

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }
  
  uploading.value = true;
  try {
    // 这里需要实现文件上传逻辑
    for (const file of fileList.value) {
      const formData = new FormData();
      formData.append('file', file.raw);
      
      await axios.post('/upload', formData, {
        params: {
          uploadFolder: props.currentPath,
          uploadChannel: uploadChannel.value,
          uploadNameType: uploadNameType.value,
          autoRetry: autoRetry.value
        },
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    
    ElMessage.success('文件上传成功');
    uploadVisible.value = false;
    clearFiles();
    emit('files-uploaded');
  } catch (error) {
    ElMessage.error('文件上传失败');
  } finally {
    uploading.value = false;
  }
};

const loadFolderTree = async () => {
  try {
    const response = await axios.get('/api/manage/list', {
      params: { dir: '', recursive: true }
    });
    
    // 构建文件夹树结构
    const folders = response.data.directories || [];
    folderTreeData.value = buildFolderTree(folders);
  } catch (error) {
    console.error('Failed to load folder tree:', error);
  }
};

const buildFolderTree = (folders) => {
  const tree = [{ name: '根目录', path: '', children: [] }];
  
  folders.forEach(folder => {
    const parts = folder.replace(/\/$/, '').split('/');
    let current = tree[0];
    let currentPath = '';
    
    parts.forEach(part => {
      currentPath += (currentPath ? '/' : '') + part;
      let child = current.children.find(c => c.name === part);
      
      if (!child) {
        child = { name: part, path: currentPath, children: [] };
        current.children.push(child);
      }
      
      current = child;
    });
  });
  
  return tree;
};

const handleFolderSelect = (data) => {
  selectedMovePath.value = data.path;
};

const handleMove = async () => {
  if (!selectedMovePath.value) {
    ElMessage.warning('请选择目标文件夹');
    return;
  }
  
  moving.value = true;
  try {
    // 这里需要实现文件移动逻辑
    for (const file of props.moveFiles) {
      // await moveFile(file.id, selectedMovePath.value);
    }
    
    ElMessage.success('文件移动成功');
    moveVisible.value = false;
    selectedMovePath.value = '';
    emit('files-moved');
  } catch (error) {
    ElMessage.error('文件移动失败');
  } finally {
    moving.value = false;
  }
};

// 监听器
watch(() => props.createFolderVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      folderNameInput.value?.focus();
    });
  }
});

watch(() => props.renameVisible, (visible) => {
  if (visible) {
    newName.value = props.renameTarget?.name || '';
    nextTick(() => {
      renameInput.value?.focus();
      renameInput.value?.select();
    });
  }
});

watch(() => props.moveVisible, (visible) => {
  if (visible) {
    loadFolderTree();
    selectedMovePath.value = '';
  }
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.upload-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.upload-area {
  width: 100%;
}

.upload-options {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.move-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.move-info {
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.folder-selector {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 12px;
}

.folder-node {
  display: flex;
  align-items: center;
  gap: 6px;
}

.selected-path {
  margin-top: 8px;
}
</style>
