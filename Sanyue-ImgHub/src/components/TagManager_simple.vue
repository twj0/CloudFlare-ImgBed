<template>
  <div class="tag-manager">
    <div class="header">
      <h3>标签管理</h3>
      <el-button type="primary" @click="showCreateDialog">
        新建标签
      </el-button>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索标签..."
        clearable
      />
    </div>

    <div class="tag-list" v-loading="loading">
      <div v-if="tags.length === 0" class="empty-state">
        <el-empty description="暂无标签">
          <el-button type="primary" @click="showCreateDialog">
            创建第一个标签
          </el-button>
        </el-empty>
      </div>

      <div v-else class="tag-grid">
        <div
          v-for="tag in filteredTags"
          :key="tag.id"
          class="tag-card"
        >
          <el-tag
            :color="tag.color"
            effect="dark"
            size="large"
          >
            {{ tag.name }}
          </el-tag>
          <div class="tag-info">
            <p class="tag-description">{{ tag.description || '无描述' }}</p>
            <div class="tag-actions">
              <el-button size="small" @click="editTag(tag)">
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="deleteTag(tag)">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑标签' : '创建标签'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称" />
        </el-form-item>
        
        <el-form-item label="标签颜色" prop="color">
          <el-color-picker v-model="form.color" />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入标签描述（可选）"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 响应式数据
const loading = ref(false);
const tags = ref([]);
const searchQuery = ref('');
const dialogVisible = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref(null);

// 表单数据
const form = reactive({
  id: '',
  name: '',
  color: '#409EFF',
  description: ''
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '标签名称长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择标签颜色', trigger: 'change' }
  ]
};

// 计算属性
const filteredTags = computed(() => {
  if (!searchQuery.value) return tags.value;
  const query = searchQuery.value.toLowerCase();
  return tags.value.filter(tag => 
    tag.name.toLowerCase().includes(query) ||
    (tag.description && tag.description.toLowerCase().includes(query))
  );
});

// 方法
const loadTags = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    tags.value = [
      { id: '1', name: '重要', color: '#F56C6C', description: '重要文件标签' },
      { id: '2', name: '工作', color: '#409EFF', description: '工作相关文件' },
      { id: '3', name: '个人', color: '#67C23A', description: '个人文件' }
    ];
  } catch (error) {
    console.error('Load tags failed:', error);
    ElMessage.error('加载标签失败');
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
  form.id = tag.id;
  form.name = tag.name;
  form.color = tag.color;
  form.description = tag.description || '';
  dialogVisible.value = true;
};

const deleteTag = async (tag) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签 "${tag.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 删除逻辑
    ElMessage.success('标签删除成功');
    loadTags();
  } catch {
    // 用户取消
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    submitting.value = true;
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ElMessage.success(isEditing.value ? '标签更新成功' : '标签创建成功');
    dialogVisible.value = false;
    loadTags();
  } catch (error) {
    console.error('Submit failed:', error);
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  form.id = '';
  form.name = '';
  form.color = '#409EFF';
  form.description = '';
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

// 生命周期
onMounted(() => {
  loadTags();
});
</script>

<style scoped>
.tag-manager {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.search-bar {
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.tag-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px;
  background: var(--el-bg-color);
  transition: all 0.3s;
}

.tag-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tag-info {
  margin-top: 12px;
}

.tag-description {
  margin: 8px 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.tag-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
