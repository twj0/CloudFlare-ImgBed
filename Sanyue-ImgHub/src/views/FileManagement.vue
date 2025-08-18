<template>
  <div class="file-management">
    <!-- 顶部导航栏 -->
    <div class="management-header">
      <div class="header-left">
        <h1 class="page-title">文件管理</h1>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>
              <el-icon><House /></el-icon>
              首页
            </el-breadcrumb-item>
            <el-breadcrumb-item>文件管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="activeTab !== 'files'">
              {{ getTabName(activeTab) }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
      
      <div class="header-right">
        <el-button-group>
          <el-button
            :type="activeTab === 'files' ? 'primary' : ''"
            @click="activeTab = 'files'"
            :icon="Files"
          >
            文件浏览
          </el-button>
          <el-button
            :type="activeTab === 'tags' ? 'primary' : ''"
            @click="activeTab = 'tags'"
            :icon="PriceTag"
          >
            标签管理
          </el-button>
          <el-button
            :type="activeTab === 'favorites' ? 'primary' : ''"
            @click="activeTab = 'favorites'"
            :icon="Star"
          >
            收藏夹
          </el-button>
          <el-button
            :type="activeTab === 'analytics' ? 'primary' : ''"
            @click="activeTab = 'analytics'"
            :icon="DataAnalysis"
          >
            统计分析
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="management-content">
      <!-- 文件浏览 -->
      <div v-if="activeTab === 'files'" class="tab-content">
        <div class="files-layout">
          <!-- 文件列表区域 -->
          <div class="files-main">
            <div class="files-toolbar">
              <div class="toolbar-left">
                <el-input
                  v-model="searchQuery"
                  placeholder="搜索文件..."
                  :prefix-icon="Search"
                  clearable
                  style="width: 300px;"
                  @input="handleSearch"
                />
                <el-select
                  v-model="viewMode"
                  style="width: 120px; margin-left: 12px;"
                >
                  <el-option label="列表视图" value="list" />
                  <el-option label="网格视图" value="grid" />
                </el-select>
              </div>
              
              <div class="toolbar-right">
                <el-button @click="refreshFiles" :icon="Refresh">
                  刷新
                </el-button>
                <el-upload
                  action="/api/upload"
                  :show-file-list="false"
                  :on-success="handleUploadSuccess"
                  multiple
                >
                  <el-button type="primary" :icon="Upload">
                    上传文件
                  </el-button>
                </el-upload>
              </div>
            </div>
            
            <!-- 文件列表组件 -->
            <div class="files-container">
              <FileList
                :files="filteredFiles"
                :view-mode="viewMode"
                :selected-files="selectedFiles"
                @file-select="handleFileSelect"
                @file-action="handleFileAction"
              />
            </div>
          </div>
          
          <!-- 文件属性面板 -->
          <div class="files-sidebar">
            <FilePropertiesPanel
              :selected-file="selectedFile"
              :selected-files="selectedFiles"
              @file-action="handleFileAction"
            />
          </div>
        </div>
      </div>

      <!-- 标签管理 -->
      <div v-if="activeTab === 'tags'" class="tab-content">
        <TagManager @refresh="refreshFiles" />
      </div>

      <!-- 收藏夹管理 -->
      <div v-if="activeTab === 'favorites'" class="tab-content">
        <div class="favorites-layout">
          <div class="favorites-sidebar">
            <FavoriteManager @group-select="handleGroupSelect" />
          </div>
          <div class="favorites-main">
            <FavoriteFileList
              :group-id="selectedGroupId"
              @file-select="handleFavoriteFileSelect"
              @refresh="refreshFavorites"
            />
          </div>
        </div>
      </div>

      <!-- 统计分析 -->
      <div v-if="activeTab === 'analytics'" class="tab-content">
        <FileStatsAnalytics />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  House, Files, PriceTag, Star, DataAnalysis, Search, Refresh, Upload
} from '@element-plus/icons-vue';

// 导入组件
import FileList from '@/components/FileList.vue';
import FilePropertiesPanel from '@/components/FilePropertiesPanel.vue';
import TagManager from '@/components/TagManager.vue';
import FavoriteManager from '@/components/FavoriteManager.vue';
import FavoriteFileList from '@/components/FavoriteFileList.vue';
import FileStatsAnalytics from '@/components/FileStatsAnalytics.vue';

// 响应式数据
const activeTab = ref('files');
const searchQuery = ref('');
const viewMode = ref('list');
const files = ref([]);
const selectedFile = ref(null);
const selectedFiles = ref([]);
const selectedGroupId = ref('default');

// 计算属性
const filteredFiles = computed(() => {
  if (!searchQuery.value) return files.value;
  
  const query = searchQuery.value.toLowerCase();
  return files.value.filter(file => 
    file.name.toLowerCase().includes(query) ||
    (file.tags && file.tags.some(tag => tag.toLowerCase().includes(query)))
  );
});

// 方法
const getTabName = (tab) => {
  const names = {
    'files': '文件浏览',
    'tags': '标签管理',
    'favorites': '收藏夹',
    'analytics': '统计分析'
  };
  return names[tab] || tab;
};

const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

const refreshFiles = async () => {
  try {
    // 这里应该调用实际的文件列表API
    // const response = await getFileList();
    // files.value = response.files;
    ElMessage.success('文件列表已刷新');
  } catch (error) {
    ElMessage.error('刷新文件列表失败');
  }
};

const handleUploadSuccess = (response) => {
  ElMessage.success('文件上传成功');
  refreshFiles();
};

const handleFileSelect = (file, isMultiple = false) => {
  if (isMultiple) {
    const index = selectedFiles.value.findIndex(f => f.name === file.name);
    if (index > -1) {
      selectedFiles.value.splice(index, 1);
    } else {
      selectedFiles.value.push(file);
    }
  } else {
    selectedFile.value = file;
    selectedFiles.value = [file];
  }
};

const handleFileAction = (action, file, ...args) => {
  switch (action) {
    case 'refresh':
      refreshFiles();
      break;
    case 'clear-selection':
      selectedFile.value = null;
      selectedFiles.value = [];
      break;
    case 'preview':
      // 处理预览
      break;
    case 'download':
      // 处理下载
      break;
    case 'delete':
      // 处理删除
      break;
    default:
      console.log('Unknown file action:', action);
  }
};

const handleGroupSelect = (groupId) => {
  selectedGroupId.value = groupId;
};

const handleFavoriteFileSelect = (file) => {
  selectedFile.value = file;
};

const refreshFavorites = () => {
  // 刷新收藏夹列表
};

// 生命周期
onMounted(() => {
  refreshFiles();
});
</script>

<style scoped>
.file-management {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.breadcrumb {
  font-size: 14px;
}

.management-content {
  flex: 1;
  overflow: hidden;
}

.tab-content {
  height: 100%;
  padding: 20px;
}

.files-layout {
  display: flex;
  height: 100%;
  gap: 20px;
}

.files-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

.files-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.files-container {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.files-sidebar {
  width: 320px;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

.favorites-layout {
  display: flex;
  height: 100%;
  gap: 20px;
}

.favorites-sidebar {
  width: 280px;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

.favorites-main {
  flex: 1;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .files-layout,
  .favorites-layout {
    flex-direction: column;
  }
  
  .files-sidebar,
  .favorites-sidebar {
    width: 100%;
    height: 300px;
  }
  
  .toolbar-left,
  .toolbar-right {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
