<template>
  <el-dialog
    v-model="visible"
    title="批量创建文件夹"
    width="600px"
    :close-on-click-modal="false"
    class="batch-folder-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="header-info">
        <el-icon :size="32" color="#007AFF">
          <FolderAdd />
        </el-icon>
        <div class="info-text">
          <h3>批量创建文件夹</h3>
          <p>每行输入一个文件夹名称，支持文件夹模板</p>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="folder-tabs">
        <!-- 手动输入 -->
        <el-tab-pane label="手动输入" name="manual">
          <el-form :model="form" label-position="top">
            <el-form-item label="文件夹名称（每行一个）">
              <el-input
                v-model="form.folderNames"
                type="textarea"
                placeholder="例如：&#10;项目文档&#10;设计稿&#10;临时文件&#10;归档资料"
                :rows="8"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="命名规则">
              <el-checkbox-group v-model="form.namingOptions">
                <el-checkbox label="addDate">添加日期后缀</el-checkbox>
                <el-checkbox label="addNumber">添加序号</el-checkbox>
                <el-checkbox label="upperCase">转换为大写</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 模板选择 -->
        <el-tab-pane label="使用模板" name="template">
          <div class="template-grid">
            <div
              v-for="template in folderTemplates"
              :key="template.id"
              class="template-card"
              :class="{ active: selectedTemplate === template.id }"
              @click="selectTemplate(template)"
            >
              <div class="template-icon">
                <el-icon :size="24">
                  <component :is="template.icon" />
                </el-icon>
              </div>
              <div class="template-info">
                <h4>{{ template.name }}</h4>
                <p>{{ template.description }}</p>
                <div class="folder-preview">
                  <span v-for="folder in template.folders.slice(0, 3)" :key="folder">
                    {{ folder }}
                  </span>
                  <span v-if="template.folders.length > 3">
                    +{{ template.folders.length - 3 }}个
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 预览结果 -->
        <el-tab-pane label="预览结果" name="preview">
          <div class="preview-container">
            <div class="preview-header">
              <span>将创建 {{ previewFolders.length }} 个文件夹</span>
              <el-button size="small" @click="clearPreview">清空</el-button>
            </div>
            
            <div class="folder-list">
              <div
                v-for="(folder, index) in previewFolders"
                :key="index"
                class="folder-item"
              >
                <el-icon><Folder /></el-icon>
                <span>{{ folder }}</span>
                <el-button
                  size="small"
                  type="danger"
                  text
                  @click="removeFolder(index)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <span v-if="previewFolders.length > 0">
            将创建 {{ previewFolders.length }} 个文件夹
          </span>
        </div>
        <div class="footer-buttons">
          <el-button @click="handleClose" :disabled="loading">
            取消
          </el-button>
          <el-button
            type="primary"
            @click="handleBatchCreate"
            :loading="loading"
            :disabled="previewFolders.length === 0"
          >
            {{ loading ? '创建中...' : `创建 ${previewFolders.length} 个文件夹` }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  FolderAdd, Folder, Close, Document, Picture, 
  VideoPlay, Headphone, Setting, User
} from '@element-plus/icons-vue'

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
const emit = defineEmits(['update:modelValue', 'batch-create', 'close'])

// 响应式数据
const loading = ref(false)
const activeTab = ref('manual')
const selectedTemplate = ref(null)

const form = reactive({
  folderNames: '',
  namingOptions: []
})

// 文件夹模板
const folderTemplates = ref([
  {
    id: 'project',
    name: '项目结构',
    description: '标准项目文件夹结构',
    icon: Document,
    folders: ['文档', '设计稿', '源文件', '测试', '发布', '归档']
  },
  {
    id: 'media',
    name: '媒体分类',
    description: '按媒体类型分类',
    icon: Picture,
    folders: ['图片', '视频', '音频', '文档', '其他']
  },
  {
    id: 'date',
    name: '按日期分类',
    description: '按年月分类文件夹',
    icon: Setting,
    folders: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']
  },
  {
    id: 'personal',
    name: '个人管理',
    description: '个人文件管理结构',
    icon: User,
    folders: ['工作', '学习', '生活', '娱乐', '重要', '临时']
  }
])

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const previewFolders = computed(() => {
  let folders = []
  
  if (activeTab.value === 'manual') {
    folders = form.folderNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0)
  } else if (activeTab.value === 'template' && selectedTemplate.value) {
    const template = folderTemplates.value.find(t => t.id === selectedTemplate.value)
    folders = template ? [...template.folders] : []
  }
  
  // 应用命名规则
  return folders.map((name, index) => {
    let finalName = name
    
    if (form.namingOptions.includes('addNumber')) {
      finalName = `${String(index + 1).padStart(2, '0')}-${finalName}`
    }
    
    if (form.namingOptions.includes('addDate')) {
      const today = new Date().toISOString().split('T')[0]
      finalName = `${finalName}-${today}`
    }
    
    if (form.namingOptions.includes('upperCase')) {
      finalName = finalName.toUpperCase()
    }
    
    return finalName
  }).filter(name => !props.existingFolders.includes(name))
})

// 监听对话框显示状态
watch(visible, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

// 方法
const resetForm = () => {
  form.folderNames = ''
  form.namingOptions = []
  selectedTemplate.value = null
  activeTab.value = 'manual'
}

const selectTemplate = (template) => {
  selectedTemplate.value = template.id
  activeTab.value = 'preview'
}

const removeFolder = (index) => {
  if (activeTab.value === 'manual') {
    const folders = form.folderNames.split('\n').filter(name => name.trim())
    folders.splice(index, 1)
    form.folderNames = folders.join('\n')
  }
}

const clearPreview = () => {
  if (activeTab.value === 'manual') {
    form.folderNames = ''
  } else {
    selectedTemplate.value = null
  }
}

const handleClose = () => {
  visible.value = false
  emit('close')
}

const handleBatchCreate = async () => {
  if (previewFolders.value.length === 0) {
    ElMessage.warning('请至少输入一个文件夹名称')
    return
  }
  
  loading.value = true
  
  try {
    const foldersData = previewFolders.value.map(name => ({
      name,
      path: props.currentPath,
      createdAt: new Date().toISOString()
    }))
    
    emit('batch-create', foldersData)
  } catch (error) {
    loading.value = false
    ElMessage.error(`批量创建失败: ${error.message}`)
  }
}

const handleBatchCreateSuccess = () => {
  loading.value = false
  ElMessage.success(`成功创建 ${previewFolders.value.length} 个文件夹`)
  handleClose()
}

const handleBatchCreateError = (error) => {
  loading.value = false
  ElMessage.error(`批量创建失败: ${error.message || '未知错误'}`)
}

// 暴露方法给父组件
defineExpose({
  handleBatchCreateSuccess,
  handleBatchCreateError
})
</script>

<style scoped>
.batch-folder-dialog {
  --el-dialog-border-radius: 12px;
}

.dialog-content {
  padding: 20px 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 0 4px;
}

.info-text h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.info-text p {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.folder-tabs {
  margin-top: 16px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.template-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.template-card.active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.template-icon {
  margin-bottom: 12px;
  color: var(--el-color-primary);
}

.template-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.template-info p {
  margin: 0 0 12px 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.folder-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.folder-preview span {
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.preview-container {
  max-height: 300px;
  overflow-y: auto;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.folder-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.folder-item span {
  flex: 1;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.footer-buttons {
  display: flex;
  gap: 12px;
}
</style>
