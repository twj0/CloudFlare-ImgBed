<template>
  <div class="address-bar" :class="{ 'edit-mode': isEditMode }">
    <!-- 面包屑导航模式 -->
    <div v-if="!isEditMode" class="breadcrumb-mode" @click="enterEditMode">
      <div class="breadcrumb-container">
        <el-icon class="path-icon"><Folder /></el-icon>
        <div class="breadcrumb-items">
          <span
            v-for="(segment, index) in pathSegments"
            :key="index"
            class="breadcrumb-item"
            :class="{ 'active': index === pathSegments.length - 1 }"
            @click.stop="navigateToSegment(index)"
          >
            {{ segment.name }}
            <el-icon v-if="index < pathSegments.length - 1" class="separator">
              <ArrowRight />
            </el-icon>
          </span>
        </div>
      </div>
      <el-icon class="edit-icon"><Edit /></el-icon>
    </div>

    <!-- 编辑模式 -->
    <div v-else class="edit-mode-container">
      <el-input
        ref="pathInput"
        v-model="editPath"
        @blur="exitEditMode"
        @keydown.enter="confirmPath"
        @keydown.escape="cancelEdit"
        size="small"
        :prefix-icon="Folder"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Folder, ArrowRight, Edit } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  currentPath: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['navigate-to'])

// 响应式数据
const isEditMode = ref(false)
const editPath = ref('')
const pathInput = ref(null)

// 计算属性
const pathSegments = computed(() => {
  const path = props.currentPath || '/'
  if (path === '/') {
    return [{ name: '根目录', path: '/' }]
  }
  
  const segments = path.split('/').filter(Boolean)
  const result = [{ name: '根目录', path: '/' }]
  
  let currentPath = ''
  segments.forEach(segment => {
    currentPath += '/' + segment
    result.push({
      name: segment,
      path: currentPath
    })
  })
  
  return result
})

// 监听路径变化
watch(() => props.currentPath, (newPath) => {
  if (isEditMode.value) {
    editPath.value = newPath
  }
})

// 进入编辑模式
const enterEditMode = async () => {
  isEditMode.value = true
  editPath.value = props.currentPath
  
  await nextTick()
  pathInput.value?.focus()
  pathInput.value?.select()
}

// 退出编辑模式
const exitEditMode = () => {
  isEditMode.value = false
}

// 确认路径
const confirmPath = () => {
  const newPath = editPath.value.trim()
  if (newPath && newPath !== props.currentPath) {
    emit('navigate-to', newPath)
  }
  exitEditMode()
}

// 取消编辑
const cancelEdit = () => {
  editPath.value = props.currentPath
  exitEditMode()
}

// 导航到指定段
const navigateToSegment = (index) => {
  const targetSegment = pathSegments.value[index]
  if (targetSegment && targetSegment.path !== props.currentPath) {
    emit('navigate-to', targetSegment.path)
  }
}
</script>

<style scoped>
.address-bar {
  display: flex;
  align-items: center;
  background-color: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 0;
  min-height: 32px;
  cursor: text;
  transition: all 0.2s ease;
}

.address-bar:hover {
  border-color: var(--el-border-color-hover);
}

.address-bar.edit-mode {
  cursor: default;
}

.breadcrumb-mode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 8px;
}

.breadcrumb-container {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.path-icon {
  color: var(--el-text-color-secondary);
  margin-right: 8px;
  flex-shrink: 0;
}

.breadcrumb-items {
  display: flex;
  align-items: center;
  overflow: hidden;
  flex: 1;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.breadcrumb-item:hover {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.breadcrumb-item.active {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.breadcrumb-item .separator {
  margin: 0 4px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.edit-icon {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  margin-left: 8px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.address-bar:hover .edit-icon {
  opacity: 1;
}

.edit-mode-container {
  width: 100%;
  padding: 2px;
}

.edit-mode-container :deep(.el-input__wrapper) {
  border: none;
  box-shadow: none;
  background: transparent;
}

.edit-mode-container :deep(.el-input__inner) {
  font-size: 13px;
  padding: 4px 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .breadcrumb-item {
    max-width: 80px;
  }
  
  .breadcrumb-items {
    mask-image: linear-gradient(to right, black 0%, black calc(100% - 20px), transparent 100%);
  }
}

/* 深色主题适配 */
.dark-theme .address-bar {
  background-color: var(--el-bg-color-page);
  border-color: var(--el-border-color-darker);
}

.dark-theme .breadcrumb-item:hover {
  background-color: var(--el-fill-color-darker);
}

/* 焦点状态 */
.address-bar:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

/* 动画效果 */
.breadcrumb-item {
  position: relative;
  overflow: hidden;
}

.breadcrumb-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.breadcrumb-item:hover::before {
  left: 100%;
}

/* 工具提示 */
.breadcrumb-item[title] {
  position: relative;
}

.breadcrumb-item[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--el-color-info-dark-2);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
