<template>
  <div class="file-stats-analytics">
    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="overview-cards">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon :size="32" color="#409EFF"><Files /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(totalFiles) }}</div>
            <div class="stat-label">总文件数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon :size="32" color="#67C23A"><View /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(totalViews) }}</div>
            <div class="stat-label">总访问量</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon :size="32" color="#E6A23C"><Download /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(totalDownloads) }}</div>
            <div class="stat-label">总下载量</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon :size="32" color="#F56C6C"><Odometer /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatFileSize(totalSize) }}</div>
            <div class="stat-label">总存储量</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间范围选择 -->
    <div class="time-range-selector">
      <el-radio-group v-model="selectedPeriod" @change="handlePeriodChange">
        <el-radio-button label="7d">最近7天</el-radio-button>
        <el-radio-button label="30d">最近30天</el-radio-button>
        <el-radio-button label="90d">最近90天</el-radio-button>
        <el-radio-button label="1y">最近一年</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <div class="chart-row">
        <!-- 访问趋势图 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>访问趋势</h3>
            <el-button @click="refreshChart('access')" :icon="Refresh" size="small" text>
              刷新
            </el-button>
          </div>
          <div class="chart-content" ref="accessTrendChart" v-loading="chartsLoading.access">
            <!-- 这里将集成图表库，如 ECharts -->
            <div class="chart-placeholder">访问趋势图表</div>
          </div>
        </div>
        
        <!-- 文件类型分布 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>文件类型分布</h3>
            <el-button @click="refreshChart('fileType')" :icon="Refresh" size="small" text>
              刷新
            </el-button>
          </div>
          <div class="chart-content" ref="fileTypeChart" v-loading="chartsLoading.fileType">
            <div class="chart-placeholder">文件类型分布图表</div>
          </div>
        </div>
      </div>
      
      <div class="chart-row">
        <!-- 存储使用情况 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>存储使用情况</h3>
            <el-button @click="refreshChart('storage')" :icon="Refresh" size="small" text>
              刷新
            </el-button>
          </div>
          <div class="chart-content" ref="storageChart" v-loading="chartsLoading.storage">
            <div class="chart-placeholder">存储使用情况图表</div>
          </div>
        </div>
        
        <!-- 热门文件排行 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>热门文件排行</h3>
            <el-select
              v-model="popularFilesSort"
              size="small"
              style="width: 100px;"
              @change="loadPopularFiles"
            >
              <el-option label="访问量" value="views" />
              <el-option label="下载量" value="downloads" />
              <el-option label="分享量" value="shares" />
            </el-select>
          </div>
          <div class="chart-content" v-loading="chartsLoading.popular">
            <div class="popular-files-list">
              <div
                v-for="(file, index) in popularFiles"
                :key="file.fileId"
                class="popular-file-item"
                @click="viewFileDetails(file)"
              >
                <div class="file-rank">{{ index + 1 }}</div>
                <div class="file-info">
                  <div class="file-name" :title="file.fileName">{{ file.fileName }}</div>
                  <div class="file-stats">
                    <span class="stat-item">
                      <el-icon><View /></el-icon>
                      {{ formatNumber(file.viewCount) }}
                    </span>
                    <span class="stat-item">
                      <el-icon><Download /></el-icon>
                      {{ formatNumber(file.downloadCount) }}
                    </span>
                  </div>
                </div>
                <div class="file-trend">
                  <el-icon :color="getTrendColor(file.trend)">
                    <component :is="getTrendIcon(file.trend)" />
                  </el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细统计表格 -->
    <div class="detailed-stats">
      <div class="stats-header">
        <h3>详细统计</h3>
        <div class="stats-actions">
          <el-button @click="exportStats" :icon="Download" size="small">
            导出数据
          </el-button>
          <el-button @click="refreshAllStats" :icon="Refresh" size="small">
            刷新全部
          </el-button>
        </div>
      </div>
      
      <el-table
        :data="detailedStats"
        v-loading="tableLoading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="fileName" label="文件名" min-width="200">
          <template #default="{ row }">
            <div class="file-cell">
              <el-icon class="file-icon">
                <component :is="getFileIcon(row.fileType)" />
              </el-icon>
              <span class="file-name" :title="row.fileName">{{ row.fileName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="fileType" label="类型" width="100" />
        <el-table-column prop="fileSize" label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="访问量" width="100" sortable />
        <el-table-column prop="downloadCount" label="下载量" width="100" sortable />
        <el-table-column prop="shareCount" label="分享量" width="100" sortable />
        <el-table-column prop="lastAccessed" label="最后访问" width="150">
          <template #default="{ row }">
            {{ row.lastAccessed ? formatDate(row.lastAccessed) : '从未访问' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="text"
              size="small"
              @click="viewFileDetails(row)"
              :icon="View"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="table-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 文件详情对话框 -->
    <el-dialog
      v-model="fileDetailsVisible"
      :title="selectedFileDetails?.fileName"
      width="600px"
    >
      <div v-if="selectedFileDetails" class="file-details-content">
        <div class="details-section">
          <h4>基本信息</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="label">文件名：</span>
              <span class="value">{{ selectedFileDetails.fileName }}</span>
            </div>
            <div class="detail-item">
              <span class="label">文件类型：</span>
              <span class="value">{{ selectedFileDetails.fileType }}</span>
            </div>
            <div class="detail-item">
              <span class="label">文件大小：</span>
              <span class="value">{{ formatFileSize(selectedFileDetails.fileSize) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">上传时间：</span>
              <span class="value">{{ formatDate(selectedFileDetails.createdAt) }}</span>
            </div>
          </div>
        </div>
        
        <div class="details-section">
          <h4>访问统计</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ formatNumber(selectedFileDetails.viewCount) }}</div>
              <div class="stat-text">总访问量</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ formatNumber(selectedFileDetails.downloadCount) }}</div>
              <div class="stat-text">总下载量</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ formatNumber(selectedFileDetails.shareCount) }}</div>
              <div class="stat-text">总分享量</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ selectedFileDetails.lastAccessed ? formatDate(selectedFileDetails.lastAccessed) : '从未' }}</div>
              <div class="stat-text">最后访问</div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="fileDetailsVisible = false">关闭</el-button>
          <el-button type="primary" @click="downloadFile(selectedFileDetails)">
            下载文件
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Files, View, Download, Odometer, Refresh, TrendCharts,
  ArrowUp, ArrowDown, Minus as MinusIcon,
  Document, Picture, VideoPlay, Headphones
} from '@element-plus/icons-vue';
import { 
  getFileStats, 
  getStorageUsage, 
  getPopularFiles 
} from '@/utils/fileManagerAPI';
import { STATS_PERIODS } from '@/models/fileManagerModels';

// 响应式数据
const selectedPeriod = ref('7d');
const popularFilesSort = ref('views');
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);
const tableLoading = ref(false);
const fileDetailsVisible = ref(false);
const selectedFileDetails = ref(null);

// 统计数据
const totalFiles = ref(0);
const totalViews = ref(0);
const totalDownloads = ref(0);
const totalSize = ref(0);
const popularFiles = ref([]);
const detailedStats = ref([]);

// 图表加载状态
const chartsLoading = reactive({
  access: false,
  fileType: false,
  storage: false,
  popular: false
});

// 方法
const loadOverviewStats = async () => {
  try {
    const [fileStats, storageStats] = await Promise.all([
      getFileStats({ period: selectedPeriod.value }),
      getStorageUsage()
    ]);
    
    if (fileStats.success) {
      totalFiles.value = fileStats.totalFiles || 0;
      totalViews.value = fileStats.totalViews || 0;
      totalDownloads.value = fileStats.totalDownloads || 0;
    }
    
    if (storageStats.success) {
      totalSize.value = storageStats.totalSize || 0;
    }
  } catch (error) {
    console.error('Load overview stats failed:', error);
  }
};

const loadPopularFiles = async () => {
  chartsLoading.popular = true;
  try {
    const result = await getPopularFiles({
      period: selectedPeriod.value,
      sortBy: popularFilesSort.value,
      limit: 10
    });
    
    if (result.success) {
      popularFiles.value = result.files || [];
    }
  } catch (error) {
    console.error('Load popular files failed:', error);
  } finally {
    chartsLoading.popular = false;
  }
};

const loadDetailedStats = async () => {
  tableLoading.value = true;
  try {
    const result = await getFileStats({
      period: selectedPeriod.value,
      start: (currentPage.value - 1) * pageSize.value,
      count: pageSize.value,
      detailed: true
    });
    
    if (result.success) {
      detailedStats.value = result.files || [];
      totalCount.value = result.total || 0;
    }
  } catch (error) {
    console.error('Load detailed stats failed:', error);
  } finally {
    tableLoading.value = false;
  }
};

const handlePeriodChange = () => {
  loadOverviewStats();
  loadPopularFiles();
  loadDetailedStats();
  refreshAllCharts();
};

const refreshChart = (chartType) => {
  chartsLoading[chartType] = true;
  // 这里将实现具体的图表刷新逻辑
  setTimeout(() => {
    chartsLoading[chartType] = false;
  }, 1000);
};

const refreshAllCharts = () => {
  Object.keys(chartsLoading).forEach(key => {
    refreshChart(key);
  });
};

const refreshAllStats = () => {
  loadOverviewStats();
  loadPopularFiles();
  loadDetailedStats();
  refreshAllCharts();
};

const exportStats = () => {
  // 实现数据导出功能
  ElMessage.info('数据导出功能开发中...');
};

const viewFileDetails = (file) => {
  selectedFileDetails.value = file;
  fileDetailsVisible.value = true;
};

const downloadFile = (file) => {
  const url = `/file/${file.fileId || file.fileName}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = file.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadDetailedStats();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  loadDetailedStats();
};

// 工具方法
const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatFileSize = (size) => {
  if (!size) return '0 B';
  const sizeNum = parseFloat(size);
  if (sizeNum >= 1024) return `${sizeNum.toFixed(2)} MB`;
  return `${(sizeNum * 1024).toFixed(0)} KB`;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

const getFileIcon = (fileType) => {
  if (!fileType) return Document;
  if (fileType.startsWith('image/')) return Picture;
  if (fileType.startsWith('video/')) return VideoPlay;
  if (fileType.startsWith('audio/')) return Headphones;
  return Document;
};

const getTrendIcon = (trend) => {
  if (trend > 0) return ArrowUp;
  if (trend < 0) return ArrowDown;
  return MinusIcon;
};

const getTrendColor = (trend) => {
  if (trend > 0) return '#67C23A';
  if (trend < 0) return '#F56C6C';
  return '#909399';
};

// 生命周期
onMounted(() => {
  loadOverviewStats();
  loadPopularFiles();
  loadDetailedStats();
});
</script>

<style scoped>
.file-stats-analytics {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.stats-overview {
  margin-bottom: 24px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.time-range-selector {
  margin-bottom: 24px;
  text-align: center;
}

.charts-container {
  margin-bottom: 32px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #F5F7FA;
  border-bottom: 1px solid #EBEEF5;
}

.chart-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.chart-content {
  padding: 20px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  color: #909399;
  font-size: 14px;
}

.popular-files-list {
  width: 100%;
}

.popular-file-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.popular-file-item:hover {
  background-color: #F5F7FA;
}

.popular-file-item:last-child {
  border-bottom: none;
}

.file-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.file-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.file-trend {
  margin-left: 8px;
}

.detailed-stats {
  margin-top: 32px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stats-header h3 {
  margin: 0;
  color: #303133;
}

.stats-actions {
  display: flex;
  gap: 8px;
}

.file-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #909399;
}

.file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.file-details-content {
  padding: 16px 0;
}

.details-section {
  margin-bottom: 24px;
}

.details-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  gap: 8px;
}

.detail-item .label {
  color: #909399;
  min-width: 80px;
}

.detail-item .value {
  color: #303133;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #F5F7FA;
  border-radius: 8px;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-text {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
