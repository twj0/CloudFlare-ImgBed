<template>
  <div class="drag-drop-organizer">
    <!-- 拖拽提示覆盖层 -->
    <div
      v-if="isDragging"
      class="drag-overlay"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="drag-hint">
        <el-icon :size="48">
          <component :is="dragHintIcon" />
        </el-icon>
        <h3>{{ dragHintText }}</h3>
        <p>{{ dragHintSubtext }}</p>
      </div>
    </div>

    <!-- 文件夹组织面板 -->
    <div
      v-if="showOrganizePanel"
      class="organize-panel"
      @click.self="closeOrganizePanel"
    >
      <div class="panel-content">
        <div class="panel-header">
          <h3>文件夹组织</h3>
          <el-button
            type="text"
            @click="closeOrganizePanel"
            :icon="Close"
          />
        </div>

        <div class="organize-options">
          <!-- 快速分类 -->
          <div class="quick-sort">
            <h4>快速分类</h4>
            <div class="sort-buttons">
              <el-button
                v-for="category in quickCategories"
                :key="category.key"
                size="small"
                @click="quickSort(category.key)"
              >
                <el-icon><component :is="category.icon" /></el-icon>
                {{ category.label }}
              </el-button>
            </div>
          </div>

          <!-- 自动整理 -->
          <div class="auto-organize">
            <h4>自动整理</h4>
            <el-form :model="organizeForm" label-position="left" label-width="80px">
              <el-form-item label="按类型">
                <el-switch v-model="organizeForm.byType" />
              </el-form-item>
              <el-form-item label="按日期">
                <el-switch v-model="organizeForm.byDate" />
              </el-form-item>
              <el-form-item label="按大小">
                <el-switch v-model="organizeForm.bySize" />
              </el-form-item>
            </el-form>
            <el-button
              type="primary"
              @click="autoOrganize"
              :loading="organizing"
            >
              开始整理
            </el-button>
          </div>

          <!-- 文件夹模板 -->
          <div class="folder-templates">
            <h4>文件夹模板</h4>
            <div class="template-list">
              <div
                v-for="template in folderTemplates"
                :key="template.id"
                class="template-item"
                @click="applyTemplate(template)"
              >
                <el-icon><component :is="template.icon" /></el-icon>
                <span>{{ template.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  FolderAdd, Upload, Picture, Document, VideoPlay,
  Headphone, Calendar, User, Close, Setting
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  currentPath: {
    type: String,
    default: '/'
  },
  selectedItems: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'files-dropped',
  'organize-complete',
  'template-applied'
])

// 响应式数据
const isDragging = ref(false)
const isDragOver = ref(false)
const showOrganizePanel = ref(false)
const organizing = ref(false)

const organizeForm = reactive({
  byType: true,
  byDate: false,
  bySize: false
})

// 快速分类选项
const quickCategories = ref([
  { key: 'images', label: '图片', icon: Picture },
  { key: 'documents', label: '文档', icon: Document },
  { key: 'videos', label: '视频', icon: VideoPlay },
  { key: 'audio', label: '音频', icon: Headphone },
  { key: 'others', label: '其他', icon: Setting }
])

// 文件夹模板
const folderTemplates = ref([
  {
    id: 'project',
    name: '项目结构',
    icon: Document,
    folders: ['文档', '设计', '开发', '测试', '发布']
  },
  {
    id: 'media',
    name: '媒体分类',
    icon: Picture,
    folders: ['图片', '视频', '音频', '文档']
  },
  {
    id: 'date',
    name: '按日期',
    icon: Calendar,
    folders: generateDateFolders()
  },
  {
    id: 'personal',
    name: '个人管理',
    icon: User,
    folders: ['工作', '学习', '生活', '重要']
  }
])

// 计算属性
const dragHintIcon = computed(() => {
  if (isDragOver.value) {
    return FolderAdd
  }
  return Upload
})

const dragHintText = computed(() => {
  if (isDragOver.value) {
    return '释放以创建文件夹'
  }
  return '拖拽文件到此处'
})

const dragHintSubtext = computed(() => {
  if (isDragOver.value) {
    return '将在当前位置创建新文件夹'
  }
  return '支持批量上传和文件夹创建'
})

// 方法
function generateDateFolders() {
  const now = new Date()
  const folders = []
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const folderName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    folders.push(folderName)
  }
  
  return folders
}

const handleDragOver = (event) => {
  event.preventDefault()
  isDragOver.value = true
  
  // 检查拖拽的内容类型
  const items = event.dataTransfer.items
  if (items) {
    for (let item of items) {
      if (item.kind === 'file') {
        // 文件拖拽
        break
      }
    }
  }
}

const handleDragLeave = (event) => {
  // 只有当离开整个拖拽区域时才重置状态
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false
  }
}

const handleDrop = async (event) => {
  event.preventDefault()
  isDragOver.value = false
  isDragging.value = false
  
  const files = Array.from(event.dataTransfer.files)
  const items = Array.from(event.dataTransfer.items)
  
  // 处理文件夹拖拽
  const folderEntries = []
  const fileEntries = []
  
  for (let item of items) {
    if (item.webkitGetAsEntry) {
      const entry = item.webkitGetAsEntry()
      if (entry.isDirectory) {
        folderEntries.push(entry)
      } else {
        fileEntries.push(entry)
      }
    }
  }
  
  // 如果有文件夹，创建对应的文件夹结构
  if (folderEntries.length > 0) {
    await handleFolderDrop(folderEntries)
  }
  
  // 如果有文件，触发文件上传
  if (files.length > 0) {
    emit('files-dropped', {
      files,
      targetPath: props.currentPath
    })
  }
}

const handleFolderDrop = async (folderEntries) => {
  const foldersToCreate = []
  
  for (let entry of folderEntries) {
    foldersToCreate.push({
      name: entry.name,
      path: props.currentPath,
      description: `从 ${entry.name} 拖拽创建`,
      permissions: 'public',
      tags: ['拖拽创建']
    })
  }
  
  if (foldersToCreate.length > 0) {
    try {
      // 这里应该调用批量创建文件夹的API
      emit('organize-complete', {
        action: 'folder-drop',
        folders: foldersToCreate
      })
      
      ElMessage.success(`成功创建 ${foldersToCreate.length} 个文件夹`)
    } catch (error) {
      ElMessage.error(`创建文件夹失败: ${error.message}`)
    }
  }
}

const quickSort = async (category) => {
  organizing.value = true
  
  try {
    // 根据分类创建文件夹并移动文件
    const categoryFolder = quickCategories.value.find(c => c.key === category)
    
    if (categoryFolder) {
      // 创建分类文件夹
      const folderData = {
        name: categoryFolder.label,
        path: props.currentPath,
        description: `${categoryFolder.label}文件分类文件夹`,
        permissions: 'public',
        tags: ['自动分类']
      }
      
      emit('organize-complete', {
        action: 'quick-sort',
        category,
        folder: folderData
      })
      
      ElMessage.success(`${categoryFolder.label}分类完成`)
    }
  } catch (error) {
    ElMessage.error(`分类失败: ${error.message}`)
  } finally {
    organizing.value = false
  }
}

const autoOrganize = async () => {
  organizing.value = true
  
  try {
    const organizeOptions = { ...organizeForm }
    
    emit('organize-complete', {
      action: 'auto-organize',
      options: organizeOptions
    })
    
    ElMessage.success('自动整理完成')
    closeOrganizePanel()
  } catch (error) {
    ElMessage.error(`自动整理失败: ${error.message}`)
  } finally {
    organizing.value = false
  }
}

const applyTemplate = async (template) => {
  try {
    const foldersToCreate = template.folders.map(folderName => ({
      name: folderName,
      path: props.currentPath,
      description: `来自${template.name}模板`,
      permissions: 'public',
      tags: ['模板创建', template.name]
    }))
    
    emit('template-applied', {
      template,
      folders: foldersToCreate
    })
    
    ElMessage.success(`${template.name}模板应用成功`)
    closeOrganizePanel()
  } catch (error) {
    ElMessage.error(`应用模板失败: ${error.message}`)
  }
}

const openOrganizePanel = () => {
  showOrganizePanel.value = true
}

const closeOrganizePanel = () => {
  showOrganizePanel.value = false
}

// 监听全局拖拽事件
const handleGlobalDragEnter = () => {
  isDragging.value = true
}

const handleGlobalDragEnd = () => {
  isDragging.value = false
  isDragOver.value = false
}

// 暴露方法
defineExpose({
  openOrganizePanel,
  closeOrganizePanel
})

// 生命周期
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('dragenter', handleGlobalDragEnter)
  document.addEventListener('dragend', handleGlobalDragEnd)
})

onUnmounted(() => {
  document.removeEventListener('dragenter', handleGlobalDragEnter)
  document.removeEventListener('dragend', handleGlobalDragEnd)
})
</script>

<style scoped>
.drag-drop-organizer {
  position: relative;
}

.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 122, 255, 0.1);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.drag-overlay.drag-over {
  background: rgba(0, 122, 255, 0.2);
}

.drag-hint {
  text-align: center;
  color: #007AFF;
  padding: 40px;
  border: 2px dashed #007AFF;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
}

.drag-hint h3 {
  margin: 16px 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.drag-hint p {
  margin: 0;
  font-size: 16px;
  opacity: 0.8;
}

.organize-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.panel-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.organize-options > div {
  margin-bottom: 32px;
}

.organize-options h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sort-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.template-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.template-item .el-icon {
  margin-bottom: 8px;
  font-size: 24px;
  color: var(--el-color-primary);
}

.template-item span {
  font-size: 14px;
  text-align: center;
}
</style>
