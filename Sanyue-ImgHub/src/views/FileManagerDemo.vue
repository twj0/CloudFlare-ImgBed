<template>
  <div class="file-manager-demo">
    <div class="demo-header">
      <h1>Windows 文件资源管理器演示</h1>
      <p>这是一个类似Windows文件资源管理器的用户界面演示</p>
      
      <div class="demo-controls">
        <el-button @click="showFeatures = !showFeatures">
          {{ showFeatures ? '隐藏' : '显示' }}功能说明
        </el-button>
        <el-button type="primary" @click="startDemo">
          开始演示
        </el-button>
      </div>
    </div>

    <!-- 功能说明 -->
    <el-collapse v-model="activeFeatures" v-show="showFeatures" class="features-panel">
      <el-collapse-item title="🎯 主要功能特性" name="features">
        <div class="feature-grid">
          <div class="feature-item">
            <el-icon><Folder /></el-icon>
            <h3>文件夹树导航</h3>
            <p>左侧树形结构导航，支持展开/折叠、懒加载</p>
          </div>
          <div class="feature-item">
            <el-icon><Grid /></el-icon>
            <h3>多种视图模式</h3>
            <p>支持列表、网格、详细信息三种视图模式</p>
          </div>
          <div class="feature-item">
            <el-icon><Search /></el-icon>
            <h3>实时搜索</h3>
            <p>支持文件名搜索和高级筛选功能</p>
          </div>
          <div class="feature-item">
            <el-icon><Operation /></el-icon>
            <h3>文件操作</h3>
            <p>创建、删除、重命名、移动、复制等操作</p>
          </div>
          <div class="feature-item">
            <el-icon><Mouse /></el-icon>
            <h3>拖拽支持</h3>
            <p>支持文件和文件夹的拖拽移动操作</p>
          </div>
          <div class="feature-item">
            <el-icon><Menu /></el-icon>
            <h3>右键菜单</h3>
            <p>上下文相关的右键操作菜单</p>
          </div>
        </div>
      </el-collapse-item>
      
      <el-collapse-item title="⌨️ 键盘快捷键" name="shortcuts">
        <div class="shortcuts-grid">
          <div class="shortcut-item">
            <kbd>Ctrl + A</kbd>
            <span>全选</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl + C</kbd>
            <span>复制</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl + X</kbd>
            <span>剪切</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl + V</kbd>
            <span>粘贴</span>
          </div>
          <div class="shortcut-item">
            <kbd>Delete</kbd>
            <span>删除</span>
          </div>
          <div class="shortcut-item">
            <kbd>F2</kbd>
            <span>重命名</span>
          </div>
          <div class="shortcut-item">
            <kbd>F5</kbd>
            <span>刷新</span>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 文件管理器演示区域 -->
    <div v-if="demoStarted" class="demo-container">
      <WindowsExplorerLayout />
    </div>

    <!-- 未开始演示时的占位内容 -->
    <div v-else class="demo-placeholder">
      <el-icon class="placeholder-icon"><FolderOpened /></el-icon>
      <h2>准备开始演示</h2>
      <p>点击"开始演示"按钮来体验Windows风格的文件管理器</p>
      <el-button type="primary" size="large" @click="startDemo">
        <el-icon><Play /></el-icon>
        开始演示
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  Folder,
  Grid,
  Search,
  Operation,
  Mouse,
  Menu,
  FolderOpened,
  Play
} from '@element-plus/icons-vue'
import WindowsExplorerLayout from '@/components/WindowsExplorerLayout.vue'

// 响应式数据
const showFeatures = ref(true)
const activeFeatures = ref(['features'])
const demoStarted = ref(false)

// 方法
const startDemo = () => {
  demoStarted.value = true
  showFeatures.value = false
}
</script>

<style scoped>
.file-manager-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.demo-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.demo-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.demo-header p {
  font-size: 1.2rem;
  margin-bottom: 20px;
  opacity: 0.9;
}

.demo-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.features-panel {
  max-width: 1200px;
  margin: 0 auto 30px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.feature-item {
  text-align: center;
  padding: 20px;
  background: var(--el-fill-color-extra-light);
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.feature-item:hover {
  transform: translateY(-2px);
}

.feature-item .el-icon {
  font-size: 2rem;
  color: var(--el-color-primary);
  margin-bottom: 10px;
}

.feature-item h3 {
  margin: 10px 0;
  color: var(--el-text-color-primary);
}

.feature-item p {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  padding: 20px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background: var(--el-fill-color-extra-light);
  border-radius: 6px;
}

.shortcut-item kbd {
  background: var(--el-color-info-light-8);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 4px 8px;
  font-family: monospace;
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.demo-container {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  height: 80vh;
}

.demo-placeholder {
  text-align: center;
  color: white;
  padding: 60px 20px;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.8;
}

.demo-placeholder h2 {
  font-size: 2rem;
  margin-bottom: 15px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.demo-placeholder p {
  font-size: 1.1rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-manager-demo {
    padding: 10px;
  }
  
  .demo-header h1 {
    font-size: 2rem;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
    padding: 15px;
  }
  
  .shortcuts-grid {
    grid-template-columns: 1fr;
    padding: 15px;
  }
  
  .demo-container {
    height: 70vh;
  }
}

/* 深色主题适配 */
:deep(.el-collapse-item__header) {
  background: transparent;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-collapse-item__content) {
  background: transparent;
}

/* 动画效果 */
.demo-container {
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-item {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
