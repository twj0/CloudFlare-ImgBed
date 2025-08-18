<template>
  <div class="file-browser-container">
    <!-- 工具栏 -->
    <div class="browser-toolbar">
      <el-radio-group v-model="viewMode" size="small">
        <el-radio-button label="list">
          <el-icon><Tickets /></el-icon> 列表
        </el-radio-button>
        <el-radio-button label="grid">
          <el-icon><Grid /></el-icon> 网格
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 列表视图 -->
    <el-table v-if="!loading && viewMode === 'list'" :data="items" style="width: 100%">
      <el-table-column prop="name" label="名称">
        <template #default="{ row }">
          <el-icon v-if="row.type === 'directory'"><Folder /></el-icon>
          <el-icon v-else><Document /></el-icon>
          <span style="margin-left: 10px">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="timestamp" label="修改日期" width="180" />
      <el-table-column prop="fileType" label="类型" width="180" />
      <el-table-column prop="size" label="大小" width="120" />
    </el-table>

    <!-- 网格视图 -->
    <div v-if="!loading && viewMode === 'grid'" class="grid-view">
      <el-card v-for="item in items" :key="item.id" class="grid-item" shadow="hover">
        <div class="grid-item-content">
          <el-icon v-if="item.type === 'directory'" class="grid-icon"><Folder /></el-icon>
          <el-icon v-else class="grid-icon"><Document /></el-icon>
          <span class="grid-item-name">{{ item.name }}</span>
        </div>
      </el-card>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { Folder, Document, Loading, Tickets, Grid } from '@element-plus/icons-vue';

const props = defineProps({
  directory: {
    type: String,
    required: true,
    default: '',
  },
});

const viewMode = ref('list'); // 'list' or 'grid'
const loading = ref(false);
const items = ref([]); // 存储文件和目录

const fetchData = async (dir) => {
  loading.value = true;
  items.value = [];
  try {
    const response = await axios.get('/api/manage/list', {
      params: { dir },
    });

    const directories = response.data.directories.map(d => {
      const name = d.replace(/\/$/, '').split('/').pop();
      return {
        id: d,
        name: name,
        type: 'directory',
        timestamp: '-',
        fileType: '文件夹',
        size: '-',
      };
    });

    const files = response.data.files.map(f => ({
      id: f.name,
      name: f.metadata.FileName.split('/').pop(),
      type: 'file',
      timestamp: new Date(f.metadata.TimeStamp).toLocaleString(),
      fileType: f.metadata.FileType,
      size: `${f.metadata.FileSize} MB`,
    }));

    items.value = [...directories, ...files];
  } catch (error) {
    console.error('Failed to fetch items:', error);
    ElMessage.error('加载文件列表失败');
  } finally {
    loading.value = false;
  }
};

// 监听 directory prop 的变化
watch(() => props.directory, (newDir) => {
  fetchData(newDir);
}, { immediate: true });

const refresh = () => {
  fetchData(props.directory);
};

// 暴露方法给父组件
defineExpose({
  refresh,
});

</script>

<style scoped>
.file-browser-container {
  width: 100%;
  height: 100%;
}
.browser-toolbar {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
}
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #909399;
}
.loading-state .el-icon {
  margin-right: 8px;
}
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}
.grid-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.grid-icon {
  font-size: 48px;
  margin-bottom: 10px;
}
.grid-item-name {
  word-break: break-all;
  font-size: 14px;
}
</style>