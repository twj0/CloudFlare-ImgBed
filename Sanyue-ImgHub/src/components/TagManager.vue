<template>
  <div class="tag-manager">
    <!-- 标签管理头部 -->
    <div class="tag-manager-header">
      <div class="header-left">
        <h3>标签管理</h3>
        <span class="tag-count">共 {{ tags.length }} 个标签</span>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog" :icon="Plus">
          新建标签
        </el-button>
      </div>
    </div>

    <!-- 标签搜索 -->
    <div class="tag-search">
      <el-input
        v-model="searchQuery"
        placeholder="搜索标签..."
        :prefix-icon="Search"
        clearable
        @input="handleSearch"
      />
    </div>

    <!-- 标签列表 -->
    <div class="tag-list" v-loading="loading">
      <div class="tag-grid">
        <div
          v-for="tag in filteredTags"
          :key="tag.id"
          class="tag-card"
          :class="{ 'selected': selectedTags.includes(tag.id) }"
          @click="toggleTagSelection(tag.id)"
        >
          <div class="tag-header">
            <el-tag
              :color="tag.color"
              effect="dark"
              class="tag-preview"
            >
              {{ tag.name }}
            </el-tag>
            <div class="tag-actions">
              <el-button
                type="text"
                size="small"
                @click.stop="editTag(tag)"
                :icon="Edit"
              />
              <el-button
                type="text"
                size="small"
                @click.stop="deleteTag(tag)"
                :icon="Delete"
                class="delete-btn"
              />
            </div>
          </div>
          
          <div class="tag-info">
            <p class="tag-description">{{ tag.description || '暂无描述' }}</p>
            <div class="tag-stats">
              <span class="file-count">{{ tag.fileCount }} 个文件</span>
              <span class="created-date">{{ formatDate(tag.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredTags.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无标签">
          <el-button type="primary" @click="showCreateDialog">创建第一个标签</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedTags.length > 0" class="batch-actions">
      <div class="selected-info">
        已选择 {{ selectedTags.length }} 个标签
      </div>
      <div class="actions">
        <el-button @click="clearSelection">取消选择</el-button>
        <el-button type="danger" @click="batchDeleteTags">批量删除</el-button>
      </div>
    </div>

    <!-- 创建/编辑标签对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑标签' : '创建标签'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="tagFormRef"
        :model="tagForm"
        :rules="tagFormRules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input
            v-model="tagForm.name"
            placeholder="请输入标签名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="标签颜色" prop="color">
          <div class="color-picker-container">
            <el-color-picker v-model="tagForm.color" />
            <div class="preset-colors">
              <div
                v-for="color in presetColors"
                :key="color"
                class="color-option"
                :style="{ backgroundColor: color }"
                :class="{ 'selected': tagForm.color === color }"
                @click="tagForm.color = color"
              />
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="标签描述">
          <el-input
            v-model="tagForm.description"
            type="textarea"
            placeholder="请输入标签描述（可选）"
            :rows="3"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="预览">
          <el-tag :color="tagForm.color" effect="dark">
            {{ tagForm.name || '标签预览' }}
          </el-tag>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="submitForm"
            :loading="submitting"
          >
            {{ isEditing ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue';
import { getTags, createTag, updateTag, deleteTag } from '@/utils/fileManagerAPI';
import { Tag, TAG_COLORS } from '@/models/fileManagerModels';

// 响应式数据
const tags = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedTags = ref([]);
const dialogVisible = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const tagFormRef = ref(null);

// 表单数据
const tagForm = reactive({
  id: '',
  name: '',
  color: '#409EFF',
  description: ''
});

// 表单验证规则
const tagFormRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '标签名称长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择标签颜色', trigger: 'change' }
  ]
};

// 预设颜色
const presetColors = TAG_COLORS;

// 计算属性
const filteredTags = computed(() => {
  if (!searchQuery.value) return tags.value;
  const query = searchQuery.value.toLowerCase();
  return tags.value.filter(tag => 
    tag.name.toLowerCase().includes(query) ||
    tag.description.toLowerCase().includes(query)
  );
});

// 方法
const loadTags = async () => {
  loading.value = true;
  try {
    const result = await getTags();
    tags.value = result.map(tagData => Tag.fromJSON(tagData));
  } catch (error) {
    console.error('Load tags failed:', error);
  } finally {
    loading.value = false;
  }
};

const showCreateDialog = () => {
  isEditing.value = false;
  resetForm();
  dialogVisible.value = true;
};

const editTag = (tag) => {
  isEditing.value = true;
  tagForm.id = tag.id;
  tagForm.name = tag.name;
  tagForm.color = tag.color;
  tagForm.description = tag.description;
  dialogVisible.value = true;
};

const resetForm = () => {
  tagForm.id = '';
  tagForm.name = '';
  tagForm.color = '#409EFF';
  tagForm.description = '';
  if (tagFormRef.value) {
    tagFormRef.value.resetFields();
  }
};

const submitForm = async () => {
  if (!tagFormRef.value) return;
  
  try {
    await tagFormRef.value.validate();
    submitting.value = true;
    
    const tagData = {
      name: tagForm.name,
      color: tagForm.color,
      description: tagForm.description
    };
    
    let success = false;
    if (isEditing.value) {
      success = await updateTag(tagForm.id, tagData);
    } else {
      const newTag = await createTag(tagData);
      success = !!newTag;
    }
    
    if (success) {
      dialogVisible.value = false;
      await loadTags();
    }
  } catch (error) {
    console.error('Submit form failed:', error);
  } finally {
    submitting.value = false;
  }
};

const deleteTag = async (tag) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签 "${tag.name}" 吗？这将移除所有文件上的此标签。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const success = await deleteTag(tag.id);
    if (success) {
      await loadTags();
    }
  } catch {
    // 用户取消
  }
};

const toggleTagSelection = (tagId) => {
  const index = selectedTags.value.indexOf(tagId);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(tagId);
  }
};

const clearSelection = () => {
  selectedTags.value = [];
};

const batchDeleteTags = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTags.value.length} 个标签吗？`,
      '批量删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 批量删除逻辑
    let successCount = 0;
    for (const tagId of selectedTags.value) {
      const success = await deleteTag(tagId);
      if (success) successCount++;
    }
    
    ElMessage.success(`成功删除 ${successCount} 个标签`);
    selectedTags.value = [];
    await loadTags();
  } catch {
    // 用户取消
  }
};

const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

// 生命周期
onMounted(() => {
  loadTags();
});

// 暴露给父组件的方法
defineExpose({
  loadTags,
  selectedTags: computed(() => selectedTags.value)
});
</script>

<style scoped>
.tag-manager {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.tag-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h3 {
  margin: 0;
  color: #303133;
}

.tag-count {
  color: #909399;
  font-size: 14px;
  margin-left: 10px;
}

.tag-search {
  margin-bottom: 20px;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.tag-card {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.tag-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.tag-card.selected {
  border-color: #409EFF;
  background-color: #F0F9FF;
}

.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tag-actions {
  opacity: 0;
  transition: opacity 0.3s;
}

.tag-card:hover .tag-actions {
  opacity: 1;
}

.delete-btn {
  color: #F56C6C;
}

.tag-info {
  font-size: 14px;
}

.tag-description {
  color: #606266;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.tag-stats {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 12px;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 12px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 1000;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.preset-colors {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.color-option:hover,
.color-option.selected {
  border-color: #409EFF;
  transform: scale(1.1);
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}
</style>
