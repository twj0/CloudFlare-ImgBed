<template>
  <el-dialog
    v-model="visible"
    title="新建文件夹"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    class="new-folder-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="folder-icon">
        <el-icon :size="48" color="#007AFF">
          <FolderAdd />
        </el-icon>
      </div>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="文件夹名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入文件夹名称"
            maxlength="50"
            show-word-limit
            clearable
            @keyup.enter="handleSubmit"
            ref="nameInput"
          />
        </el-form-item>
        
        <el-form-item label="描述（可选）" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="为文件夹添加描述信息"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <!-- 高级选项 -->
        <el-collapse v-model="activeCollapse" class="advanced-options">
          <el-collapse-item title="高级选项" name="advanced">
            <el-form-item label="访问权限">
              <el-radio-group v-model="form.permissions">
                <el-radio label="public">公开访问</el-radio>
                <el-radio label="private">私有访问</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="标签">
              <el-select
                v-model="form.tags"
                multiple
                filterable
                allow-create
                placeholder="添加标签"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in predefinedTags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="loading">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
          :disabled="!form.name.trim()"
        >
          {{ loading ? '创建中...' : '创建文件夹' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { FolderAdd } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentPath: {
    type: String,
    default: '/'
  },
  existingFolders: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'create', 'close'])

// 响应式数据
const formRef = ref(null)
const nameInput = ref(null)
const loading = ref(false)
const activeCollapse = ref([])

const form = reactive({
  name: '',
  description: '',
  permissions: 'public',
  tags: []
})

const predefinedTags = ref([
  '工作', '个人', '项目', '临时', '重要', '归档'
])

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入文件夹名称', trigger: 'blur' },
    { min: 1, max: 50, message: '文件夹名称长度在 1 到 50 个字符', trigger: 'blur' },
    {
      pattern: /^[^<>:"/\\|?*\x00-\x1f]+$/,
      message: '文件夹名称不能包含特殊字符 < > : " / \\ | ? *',
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => {
        if (props.existingFolders.includes(value.trim())) {
          callback(new Error('文件夹名称已存在'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 监听对话框显示状态
watch(visible, (newVal) => {
  if (newVal) {
    // 重置表单
    resetForm()
    // 聚焦到输入框
    nextTick(() => {
      nameInput.value?.focus()
    })
  }
})

// 方法
const resetForm = () => {
  form.name = ''
  form.description = ''
  form.permissions = 'public'
  form.tags = []
  activeCollapse.value = []
  
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const handleClose = () => {
  visible.value = false
  emit('close')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    const folderData = {
      name: form.name.trim(),
      description: form.description.trim(),
      path: props.currentPath,
      permissions: form.permissions,
      tags: form.tags,
      createdAt: new Date().toISOString()
    }
    
    // 发送创建请求
    emit('create', folderData)
    
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleCreateSuccess = () => {
  loading.value = false
  ElMessage.success('文件夹创建成功')
  handleClose()
}

const handleCreateError = (error) => {
  loading.value = false
  ElMessage.error(`创建失败: ${error.message || '未知错误'}`)
}

// 暴露方法给父组件
defineExpose({
  handleCreateSuccess,
  handleCreateError
})
</script>

<style scoped>
.new-folder-dialog {
  --el-dialog-border-radius: 12px;
}

.dialog-content {
  text-align: center;
  padding: 20px 0;
}

.folder-icon {
  margin-bottom: 20px;
}

.el-form {
  text-align: left;
}

.advanced-options {
  margin-top: 16px;
}

.advanced-options :deep(.el-collapse-item__header) {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* macOS 风格的表单样式 */
.el-input :deep(.el-input__inner) {
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  transition: all 0.2s ease;
}

.el-input :deep(.el-input__inner):focus {
  border-color: #007AFF;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.el-textarea :deep(.el-textarea__inner) {
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  transition: all 0.2s ease;
  resize: vertical;
}

.el-textarea :deep(.el-textarea__inner):focus {
  border-color: #007AFF;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.el-button {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.el-button--primary {
  background-color: #007AFF;
  border-color: #007AFF;
}

.el-button--primary:hover {
  background-color: #0056CC;
  border-color: #0056CC;
}
</style>
