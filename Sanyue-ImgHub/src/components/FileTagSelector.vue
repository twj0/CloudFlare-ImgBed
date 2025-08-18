<template>
  <div class="file-tag-selector">
    <!-- 标签选择器 -->
    <div class="tag-selector-header">
      <h4>文件标签</h4>
      <el-button
        type="text"
        size="small"
        @click="showTagManager = !showTagManager"
        :icon="Setting"
      >
        管理标签
      </el-button>
    </div>

    <!-- 当前文件的标签 -->
    <div class="current-tags" v-if="selectedFileTags.length > 0">
      <div class="tags-label">当前标签：</div>
      <div class="tags-container">
        <el-tag
          v-for="tag in selectedFileTags"
          :key="tag.id"
          :color="tag.color"
          effect="dark"
          closable
          @close="removeTag(tag.id)"
          class="file-tag"
        >
          {{ tag.name }}
        </el-tag>
      </div>
    </div>

    <!-- 添加标签 -->
    <div class="add-tags">
      <div class="tags-label">添加标签：</div>
      <div class="tag-input-container">
        <el-select
          v-model="selectedTagIds"
          multiple
          filterable
          placeholder="选择或搜索标签"
          @change="handleTagChange"
          class="tag-select"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.id"
          >
            <div class="tag-option">
              <el-tag :color="tag.color" effect="plain" size="small">
                {{ tag.name }}
              </el-tag>
              <span class="tag-description">{{ tag.description }}</span>
            </div>
          </el-option>
        </el-select>
        <el-button
          type="primary"
          size="small"
          @click="applyTags"
          :loading="applying"
          :disabled="!hasChanges"
        >
          应用
        </el-button>
      </div>
    </div>

    <!-- 快速标签 -->
    <div class="quick-tags" v-if="quickTags.length > 0">
      <div class="tags-label">快速标签：</div>
      <div class="quick-tags-container">
        <el-tag
          v-for="tag in quickTags"
          :key="tag.id"
          :color="tag.color"
          effect="plain"
          class="quick-tag"
          :class="{ 'selected': isTagSelected(tag.id) }"
          @click="toggleQuickTag(tag.id)"
        >
          {{ tag.name }}
        </el-tag>
      </div>
    </div>

    <!-- 标签统计 -->
    <div class="tag-stats" v-if="showStats">
      <div class="stats-item">
        <span class="stats-label">总标签数：</span>
        <span class="stats-value">{{ allTags.length }}</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">已使用：</span>
        <span class="stats-value">{{ selectedFileTags.length }}</span>
      </div>
    </div>

    <!-- 批量操作 -->
    <div class="batch-operations" v-if="selectedFiles.length > 1">
      <el-divider content-position="left">批量操作</el-divider>
      <div class="batch-actions">
        <el-button
          size="small"
          @click="batchAddTags"
          :loading="batchAdding"
        >
          批量添加标签
        </el-button>
        <el-button
          size="small"
          @click="batchRemoveTags"
          :loading="batchRemoving"
        >
          批量移除标签
        </el-button>
      </div>
    </div>

    <!-- 标签管理面板 -->
    <el-drawer
      v-model="showTagManager"
      title="标签管理"
      size="60%"
      direction="rtl"
    >
      <TagManager ref="tagManagerRef" @tags-updated="loadTags" />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Setting } from '@element-plus/icons-vue';
import { 
  getTags, 
  addFileTags, 
  removeFileTags, 
  batchAddTags as batchAddTagsAPI,
  batchRemoveTags as batchRemoveTagsAPI
} from '@/utils/fileManagerAPI';
import { Tag } from '@/models/fileManagerModels';
import TagManager from './TagManager.vue';

// Props
const props = defineProps({
  selectedFiles: {
    type: Array,
    default: () => []
  },
  currentFile: {
    type: Object,
    default: null
  },
  showStats: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['tags-changed', 'batch-operation-complete']);

// 响应式数据
const allTags = ref([]);
const selectedTagIds = ref([]);
const originalTagIds = ref([]);
const loading = ref(false);
const applying = ref(false);
const batchAdding = ref(false);
const batchRemoving = ref(false);
const showTagManager = ref(false);
const tagManagerRef = ref(null);

// 计算属性
const selectedFileTags = computed(() => {
  if (!props.currentFile || !props.currentFile.tags) return [];
  return allTags.value.filter(tag => props.currentFile.tags.includes(tag.id));
});

const availableTags = computed(() => {
  return allTags.value.filter(tag => !selectedFileTags.value.some(selected => selected.id === tag.id));
});

const quickTags = computed(() => {
  // 返回使用频率最高的前8个标签
  return allTags.value
    .sort((a, b) => (b.fileCount || 0) - (a.fileCount || 0))
    .slice(0, 8);
});

const hasChanges = computed(() => {
  const current = [...(props.currentFile?.tags || []), ...selectedTagIds.value];
  const original = originalTagIds.value;
  return JSON.stringify(current.sort()) !== JSON.stringify(original.sort());
});

// 方法
const loadTags = async () => {
  loading.value = true;
  try {
    const result = await getTags();
    allTags.value = result.map(tagData => Tag.fromJSON(tagData));
  } catch (error) {
    console.error('Load tags failed:', error);
  } finally {
    loading.value = false;
  }
};

const handleTagChange = () => {
  // 标签选择变化时的处理
};

const applyTags = async () => {
  if (!props.currentFile || !hasChanges.value) return;
  
  applying.value = true;
  try {
    const currentTags = props.currentFile.tags || [];
    const newTags = [...currentTags, ...selectedTagIds.value];
    
    if (newTags.length > 0) {
      const success = await addFileTags(props.currentFile.name, newTags);
      if (success) {
        selectedTagIds.value = [];
        originalTagIds.value = [...newTags];
        emit('tags-changed', props.currentFile, newTags);
        ElMessage.success('标签应用成功');
      }
    }
  } catch (error) {
    console.error('Apply tags failed:', error);
    ElMessage.error('标签应用失败');
  } finally {
    applying.value = false;
  }
};

const removeTag = async (tagId) => {
  if (!props.currentFile) return;
  
  try {
    const success = await removeFileTags(props.currentFile.name, [tagId]);
    if (success) {
      const updatedTags = (props.currentFile.tags || []).filter(id => id !== tagId);
      originalTagIds.value = [...updatedTags];
      emit('tags-changed', props.currentFile, updatedTags);
      ElMessage.success('标签移除成功');
    }
  } catch (error) {
    console.error('Remove tag failed:', error);
    ElMessage.error('标签移除失败');
  }
};

const toggleQuickTag = (tagId) => {
  if (isTagSelected(tagId)) {
    // 如果已选中，则移除
    const index = selectedTagIds.value.indexOf(tagId);
    if (index > -1) {
      selectedTagIds.value.splice(index, 1);
    } else {
      // 如果在当前文件标签中，则移除
      removeTag(tagId);
    }
  } else {
    // 如果未选中，则添加
    selectedTagIds.value.push(tagId);
  }
};

const isTagSelected = (tagId) => {
  return selectedTagIds.value.includes(tagId) || 
         (props.currentFile?.tags || []).includes(tagId);
};

const batchAddTags = async () => {
  if (props.selectedFiles.length === 0 || selectedTagIds.value.length === 0) {
    ElMessage.warning('请选择文件和标签');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要为选中的 ${props.selectedFiles.length} 个文件添加 ${selectedTagIds.value.length} 个标签吗？`,
      '批量添加标签',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    );
    
    batchAdding.value = true;
    const fileIds = props.selectedFiles.map(file => file.name);
    const result = await batchAddTagsAPI(fileIds, selectedTagIds.value);
    
    if (result.success) {
      selectedTagIds.value = [];
      emit('batch-operation-complete', 'add-tags', result);
      ElMessage.success(`成功为 ${result.successCount} 个文件添加标签`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch add tags failed:', error);
      ElMessage.error('批量添加标签失败');
    }
  } finally {
    batchAdding.value = false;
  }
};

const batchRemoveTags = async () => {
  if (props.selectedFiles.length === 0) {
    ElMessage.warning('请选择文件');
    return;
  }
  
  // 获取所有选中文件共有的标签
  const commonTags = getCommonTags();
  if (commonTags.length === 0) {
    ElMessage.warning('选中的文件没有共同标签');
    return;
  }
  
  try {
    const { value: selectedTagsToRemove } = await ElMessageBox.prompt(
      '请选择要移除的标签',
      '批量移除标签',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'checkbox',
        inputOptions: commonTags.reduce((options, tag) => {
          options[tag.id] = tag.name;
          return options;
        }, {})
      }
    );
    
    if (!selectedTagsToRemove || selectedTagsToRemove.length === 0) {
      return;
    }
    
    batchRemoving.value = true;
    const fileIds = props.selectedFiles.map(file => file.name);
    const result = await batchRemoveTagsAPI(fileIds, selectedTagsToRemove);
    
    if (result.success) {
      emit('batch-operation-complete', 'remove-tags', result);
      ElMessage.success(`成功为 ${result.successCount} 个文件移除标签`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch remove tags failed:', error);
      ElMessage.error('批量移除标签失败');
    }
  } finally {
    batchRemoving.value = false;
  }
};

const getCommonTags = () => {
  if (props.selectedFiles.length === 0) return [];
  
  const firstFileTags = props.selectedFiles[0].tags || [];
  return allTags.value.filter(tag => {
    return firstFileTags.includes(tag.id) && 
           props.selectedFiles.every(file => (file.tags || []).includes(tag.id));
  });
};

// 监听器
watch(() => props.currentFile, (newFile) => {
  if (newFile) {
    originalTagIds.value = [...(newFile.tags || [])];
    selectedTagIds.value = [];
  }
}, { immediate: true });

// 生命周期
onMounted(() => {
  loadTags();
});

// 暴露给父组件的方法
defineExpose({
  loadTags,
  applyTags,
  selectedTags: computed(() => selectedFileTags.value)
});
</script>

<style scoped>
.file-tag-selector {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #EBEEF5;
}

.tag-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tag-selector-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.current-tags,
.add-tags,
.quick-tags {
  margin-bottom: 16px;
}

.tags-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.tags-container,
.quick-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-tag {
  margin: 0;
}

.tag-input-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tag-select {
  flex: 1;
  min-width: 200px;
}

.tag-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-description {
  color: #909399;
  font-size: 12px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.quick-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-tag.selected {
  border-color: #409EFF;
  background-color: #ECF5FF;
}

.tag-stats {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 4px;
  margin-bottom: 16px;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stats-label {
  color: #909399;
  font-size: 12px;
}

.stats-value {
  color: #303133;
  font-weight: 500;
  font-size: 12px;
}

.batch-operations {
  margin-top: 16px;
}

.batch-actions {
  display: flex;
  gap: 8px;
}
</style>
