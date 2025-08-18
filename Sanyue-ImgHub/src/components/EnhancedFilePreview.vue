<template>
  <div class="enhanced-file-preview">
    <el-dialog
      v-model="visible"
      :title="file?.name || '文件预览'"
      width="90%"
      top="5vh"
      :before-close="handleClose"
      class="preview-dialog"
    >
      <div class="preview-container" v-loading="loading">
        <!-- 图片预览 -->
        <div v-if="isImage" class="image-preview">
          <div class="image-toolbar">
            <div class="toolbar-left">
              <el-button-group>
                <el-button @click="zoomIn" :icon="ZoomIn" size="small">放大</el-button>
                <el-button @click="zoomOut" :icon="ZoomOut" size="small">缩小</el-button>
                <el-button @click="resetZoom" :icon="Refresh" size="small">重置</el-button>
              </el-button-group>
              <el-button @click="rotateLeft" :icon="RefreshLeft" size="small">左转</el-button>
              <el-button @click="rotateRight" :icon="RefreshRight" size="small">右转</el-button>
            </div>
            <div class="toolbar-right">
              <span class="zoom-info">{{ Math.round(zoomLevel * 100) }}%</span>
            </div>
          </div>
          
          <div class="image-container" ref="imageContainer">
            <img
              ref="previewImage"
              :src="fileUrl"
              :alt="file?.name"
              :style="imageStyle"
              @load="handleImageLoad"
              @error="handleImageError"
              @wheel="handleWheel"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseUp"
            />
          </div>
        </div>
        
        <!-- 视频预览 -->
        <div v-else-if="isVideo" class="video-preview">
          <video
            ref="previewVideo"
            :src="fileUrl"
            controls
            preload="metadata"
            class="preview-video"
            @loadedmetadata="handleVideoLoad"
            @error="handleVideoError"
          >
            您的浏览器不支持视频播放
          </video>
          
          <div class="video-info" v-if="videoMetadata">
            <div class="info-item">
              <span class="label">时长：</span>
              <span class="value">{{ formatDuration(videoMetadata.duration) }}</span>
            </div>
            <div class="info-item">
              <span class="label">分辨率：</span>
              <span class="value">{{ videoMetadata.width }}x{{ videoMetadata.height }}</span>
            </div>
          </div>
        </div>
        
        <!-- 音频预览 -->
        <div v-else-if="isAudio" class="audio-preview">
          <div class="audio-player">
            <audio
              ref="previewAudio"
              :src="fileUrl"
              controls
              preload="metadata"
              class="preview-audio"
              @loadedmetadata="handleAudioLoad"
              @error="handleAudioError"
            >
              您的浏览器不支持音频播放
            </audio>
          </div>
          
          <div class="audio-info" v-if="audioMetadata">
            <div class="info-item">
              <span class="label">时长：</span>
              <span class="value">{{ formatDuration(audioMetadata.duration) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 文本预览 -->
        <div v-else-if="isText" class="text-preview">
          <div class="text-toolbar">
            <el-button-group>
              <el-button @click="decreaseFontSize" :icon="Minus" size="small">缩小字体</el-button>
              <el-button @click="increaseFontSize" :icon="Plus" size="small">放大字体</el-button>
            </el-button-group>
            <el-switch
              v-model="wordWrap"
              active-text="自动换行"
              inactive-text="不换行"
              size="small"
            />
          </div>
          
          <div class="text-container" :style="textStyle">
            <pre v-if="textContent" class="text-content">{{ textContent }}</pre>
            <div v-else class="loading-text">正在加载文本内容...</div>
          </div>
        </div>
        
        <!-- PDF预览 -->
        <div v-else-if="isPDF" class="pdf-preview">
          <div class="pdf-toolbar">
            <el-button-group>
              <el-button @click="prevPage" :disabled="currentPage <= 1" size="small">上一页</el-button>
              <el-button @click="nextPage" :disabled="currentPage >= totalPages" size="small">下一页</el-button>
            </el-button-group>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <el-button-group>
              <el-button @click="zoomIn" size="small">放大</el-button>
              <el-button @click="zoomOut" size="small">缩小</el-button>
            </el-button-group>
          </div>
          
          <div class="pdf-container">
            <iframe
              :src="`${fileUrl}#page=${currentPage}&zoom=${zoomLevel * 100}`"
              class="pdf-iframe"
              @load="handlePDFLoad"
              @error="handlePDFError"
            />
          </div>
        </div>
        
        <!-- 代码预览 -->
        <div v-else-if="isCode" class="code-preview">
          <div class="code-toolbar">
            <span class="language-info">{{ getLanguage() }}</span>
            <el-button @click="copyCode" :icon="CopyDocument" size="small">复制代码</el-button>
          </div>
          
          <div class="code-container">
            <pre v-if="textContent" class="code-content"><code :class="getLanguageClass()">{{ textContent }}</code></pre>
            <div v-else class="loading-text">正在加载代码内容...</div>
          </div>
        </div>
        
        <!-- 不支持的文件类型 -->
        <div v-else class="unsupported-preview">
          <div class="unsupported-content">
            <el-icon :size="64" class="unsupported-icon">
              <Document />
            </el-icon>
            <h3>无法预览此文件类型</h3>
            <p>文件类型：{{ file?.fileType || '未知' }}</p>
            <p>文件大小：{{ formatFileSize(file?.size) }}</p>
            <div class="unsupported-actions">
              <el-button type="primary" @click="downloadFile" :icon="Download">
                下载文件
              </el-button>
              <el-button @click="openInNewTab" :icon="Link" v-if="fileUrl">
                在新标签页中打开
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 预览信息栏 -->
      <div class="preview-info-bar" v-if="file">
        <div class="info-left">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-meta">{{ formatFileSize(file.size) }} • {{ file.fileType }}</span>
        </div>
        <div class="info-right">
          <el-button @click="downloadFile" :icon="Download" size="small">下载</el-button>
          <el-button @click="shareFile" :icon="Share" size="small">分享</el-button>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">关闭</el-button>
          <el-button type="primary" @click="downloadFile" :icon="Download">
            下载文件
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  ZoomIn, ZoomOut, Refresh, RefreshLeft, RefreshRight, 
  Minus, Plus, Download, Link, Share, Document, CopyDocument
} from '@element-plus/icons-vue';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  file: {
    type: Object,
    default: null
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'download', 'share']);

// 响应式数据
const loading = ref(false);
const zoomLevel = ref(1);
const rotation = ref(0);
const fontSize = ref(14);
const wordWrap = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const textContent = ref('');
const videoMetadata = ref(null);
const audioMetadata = ref(null);

// 图片拖拽相关
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const imagePosition = ref({ x: 0, y: 0 });

// 引用
const previewImage = ref(null);
const previewVideo = ref(null);
const previewAudio = ref(null);
const imageContainer = ref(null);

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const fileUrl = computed(() => {
  if (!props.file) return '';
  return props.file.url || `/file/${props.file.name}`;
});

const isImage = computed(() => {
  return props.file?.fileType?.startsWith('image/') || false;
});

const isVideo = computed(() => {
  return props.file?.fileType?.startsWith('video/') || false;
});

const isAudio = computed(() => {
  return props.file?.fileType?.startsWith('audio/') || false;
});

const isText = computed(() => {
  if (!props.file?.fileType) return false;
  return props.file.fileType.startsWith('text/') || 
         ['application/json', 'application/xml'].includes(props.file.fileType);
});

const isPDF = computed(() => {
  return props.file?.fileType === 'application/pdf';
});

const isCode = computed(() => {
  if (!props.file?.name) return false;
  const codeExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'vue', 'html', 'css', 'scss', 'less',
    'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'swift',
    'kt', 'scala', 'sh', 'bat', 'ps1', 'sql', 'yaml', 'yml', 'toml',
    'ini', 'conf', 'cfg', 'env', 'dockerfile', 'makefile'
  ];
  const ext = props.file.name.split('.').pop()?.toLowerCase();
  return codeExtensions.includes(ext);
});

const imageStyle = computed(() => ({
  transform: `scale(${zoomLevel.value}) rotate(${rotation.value}deg) translate(${imagePosition.value.x}px, ${imagePosition.value.y}px)`,
  cursor: isDragging.value ? 'grabbing' : 'grab',
  transition: isDragging.value ? 'none' : 'transform 0.3s ease'
}));

const textStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  whiteSpace: wordWrap.value ? 'pre-wrap' : 'pre'
}));

// 方法
const handleClose = () => {
  visible.value = false;
  resetPreview();
};

const resetPreview = () => {
  zoomLevel.value = 1;
  rotation.value = 0;
  fontSize.value = 14;
  wordWrap.value = true;
  currentPage.value = 1;
  totalPages.value = 1;
  textContent.value = '';
  videoMetadata.value = null;
  audioMetadata.value = null;
  imagePosition.value = { x: 0, y: 0 };
};

// 图片操作方法
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 5);
};

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.1);
};

const resetZoom = () => {
  zoomLevel.value = 1;
  imagePosition.value = { x: 0, y: 0 };
};

const rotateLeft = () => {
  rotation.value -= 90;
};

const rotateRight = () => {
  rotation.value += 90;
};

// 文本操作方法
const increaseFontSize = () => {
  fontSize.value = Math.min(fontSize.value + 2, 24);
};

const decreaseFontSize = () => {
  fontSize.value = Math.max(fontSize.value - 2, 10);
};

// PDF操作方法
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// 事件处理方法
const handleImageLoad = () => {
  loading.value = false;
};

const handleImageError = () => {
  loading.value = false;
  ElMessage.error('图片加载失败');
};

const handleVideoLoad = (event) => {
  loading.value = false;
  const video = event.target;
  videoMetadata.value = {
    duration: video.duration,
    width: video.videoWidth,
    height: video.videoHeight
  };
};

const handleVideoError = () => {
  loading.value = false;
  ElMessage.error('视频加载失败');
};

const handleAudioLoad = (event) => {
  loading.value = false;
  const audio = event.target;
  audioMetadata.value = {
    duration: audio.duration
  };
};

const handleAudioError = () => {
  loading.value = false;
  ElMessage.error('音频加载失败');
};

const handlePDFLoad = () => {
  loading.value = false;
};

const handlePDFError = () => {
  loading.value = false;
  ElMessage.error('PDF加载失败');
};

// 鼠标事件处理
const handleWheel = (event) => {
  if (!isImage.value) return;
  event.preventDefault();
  
  const delta = event.deltaY > 0 ? 0.9 : 1.1;
  zoomLevel.value = Math.max(0.1, Math.min(5, zoomLevel.value * delta));
};

const handleMouseDown = (event) => {
  if (!isImage.value) return;
  isDragging.value = true;
  dragStart.value = { x: event.clientX, y: event.clientY };
};

const handleMouseMove = (event) => {
  if (!isDragging.value || !isImage.value) return;
  
  const deltaX = event.clientX - dragStart.value.x;
  const deltaY = event.clientY - dragStart.value.y;
  
  imagePosition.value = {
    x: imagePosition.value.x + deltaX,
    y: imagePosition.value.y + deltaY
  };
  
  dragStart.value = { x: event.clientX, y: event.clientY };
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// 工具方法
const loadTextContent = async () => {
  if (!isText.value && !isCode.value) return;
  
  loading.value = true;
  try {
    const response = await fetch(fileUrl.value);
    textContent.value = await response.text();
  } catch (error) {
    console.error('Load text content failed:', error);
    ElMessage.error('文本内容加载失败');
  } finally {
    loading.value = false;
  }
};

const getLanguage = () => {
  if (!props.file?.name) return 'text';
  const ext = props.file.name.split('.').pop()?.toLowerCase();
  const languageMap = {
    js: 'JavaScript',
    ts: 'TypeScript',
    jsx: 'React JSX',
    tsx: 'React TSX',
    vue: 'Vue',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    less: 'Less',
    py: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    php: 'PHP',
    rb: 'Ruby',
    go: 'Go',
    rs: 'Rust',
    swift: 'Swift',
    kt: 'Kotlin',
    sql: 'SQL',
    yaml: 'YAML',
    yml: 'YAML',
    json: 'JSON',
    xml: 'XML'
  };
  return languageMap[ext] || ext?.toUpperCase() || 'Text';
};

const getLanguageClass = () => {
  if (!props.file?.name) return '';
  const ext = props.file.name.split('.').pop()?.toLowerCase();
  return `language-${ext}`;
};

const copyCode = async () => {
  if (!textContent.value) return;
  
  try {
    await navigator.clipboard.writeText(textContent.value);
    ElMessage.success('代码已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制失败');
  }
};

const downloadFile = () => {
  emit('download', props.file);
};

const shareFile = () => {
  emit('share', props.file);
};

const openInNewTab = () => {
  if (fileUrl.value) {
    window.open(fileUrl.value, '_blank');
  }
};

const formatFileSize = (size) => {
  if (!size) return '未知';
  const sizeNum = parseFloat(size);
  if (sizeNum < 1) return `${(sizeNum * 1024).toFixed(0)} KB`;
  return `${sizeNum.toFixed(2)} MB`;
};

const formatDuration = (duration) => {
  if (!duration) return '00:00';
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// 监听器
watch(() => props.file, (newFile) => {
  if (newFile && visible.value) {
    resetPreview();
    loading.value = true;
    
    nextTick(() => {
      if (isText.value || isCode.value) {
        loadTextContent();
      } else {
        loading.value = false;
      }
    });
  }
}, { immediate: true });

watch(visible, (newVisible) => {
  if (newVisible && props.file) {
    resetPreview();
    loading.value = true;
    
    nextTick(() => {
      if (isText.value || isCode.value) {
        loadTextContent();
      } else {
        loading.value = false;
      }
    });
  }
});
</script>

<style scoped>
.enhanced-file-preview :deep(.preview-dialog) {
  .el-dialog__body {
    padding: 0;
  }
}

.preview-container {
  min-height: 60vh;
  max-height: 80vh;
  overflow: hidden;
  position: relative;
}

/* 图片预览样式 */
.image-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.image-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-light);
}

.toolbar-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.zoom-info {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.image-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color-page);
  position: relative;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
}

/* 视频预览样式 */
.video-preview {
  padding: 16px;
  text-align: center;
}

.preview-video {
  max-width: 100%;
  max-height: 60vh;
}

.video-info,
.audio-info {
  margin-top: 16px;
  display: flex;
  gap: 24px;
  justify-content: center;
}

.info-item {
  display: flex;
  gap: 4px;
}

.info-item .label {
  color: var(--el-text-color-secondary);
}

.info-item .value {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

/* 音频预览样式 */
.audio-preview {
  padding: 40px 16px;
  text-align: center;
}

.preview-audio {
  width: 100%;
  max-width: 500px;
}

/* 文本预览样式 */
.text-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.text-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-light);
}

.text-container {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background: var(--el-bg-color);
}

.text-content {
  margin: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

/* 代码预览样式 */
.code-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.code-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-light);
}

.language-info {
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 500;
}

.code-container {
  flex: 1;
  overflow: auto;
  background: #f8f8f8;
}

.code-content {
  margin: 0;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.5;
  font-size: 14px;
}

/* PDF预览样式 */
.pdf-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-light);
}

.page-info {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.pdf-container {
  flex: 1;
  overflow: hidden;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 不支持的文件类型样式 */
.unsupported-preview {
  padding: 40px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.unsupported-content {
  max-width: 400px;
  margin: 0 auto;
}

.unsupported-icon {
  color: var(--el-text-color-placeholder);
  margin-bottom: 16px;
}

.unsupported-content h3 {
  margin: 16px 0 8px 0;
  color: var(--el-text-color-primary);
}

.unsupported-content p {
  margin: 4px 0;
  color: var(--el-text-color-regular);
}

.unsupported-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 预览信息栏样式 */
.preview-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color-page);
  border-top: 1px solid var(--el-border-color-light);
}

.info-left {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.info-right {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.loading-text {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 40px;
}
</style>
