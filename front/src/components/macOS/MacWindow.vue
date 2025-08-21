<template>
  <div 
    class="mac-window"
    :class="{ 
      'focused': isFocused, 
      'fullscreen': isFullscreen,
      'dark-theme': isDarkMode 
    }"
    :style="windowStyle"
    @mousedown="handleFocus"
  >
    <!-- 标题栏 -->
    <MacTitleBar
      :title="title"
      :show-traffic-lights="showTrafficLights"
      :is-focused="isFocused"
      @close="handleClose"
      @minimize="handleMinimize"
      @maximize="handleMaximize"
      @double-click="handleTitleBarDoubleClick"
    />
    
    <!-- 工具栏 -->
    <MacToolbar
      v-if="showToolbar"
      :items="toolbarItems"
      @item-click="handleToolbarClick"
    />
    
    <!-- 主内容区 -->
    <div class="mac-window-content">
      <slot />
    </div>
    
    <!-- 状态栏 -->
    <MacStatusBar
      v-if="showStatusBar"
      :status="statusBarContent"
    />
    
    <!-- 调整大小手柄 -->
    <div 
      v-if="resizable && !isFullscreen"
      class="resize-handle"
      @mousedown="startResize"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import MacTitleBar from './MacTitleBar.vue'
import MacToolbar from './MacToolbar.vue'
import MacStatusBar from './MacStatusBar.vue'

// Props
const props = defineProps({
  title: {
    type: String,
    default: 'Untitled'
  },
  width: {
    type: Number,
    default: 800
  },
  height: {
    type: Number,
    default: 600
  },
  minWidth: {
    type: Number,
    default: 400
  },
  minHeight: {
    type: Number,
    default: 300
  },
  resizable: {
    type: Boolean,
    default: true
  },
  showTrafficLights: {
    type: Boolean,
    default: true
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  showStatusBar: {
    type: Boolean,
    default: true
  },
  toolbarItems: {
    type: Array,
    default: () => []
  },
  statusBarContent: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits([
  'close',
  'minimize',
  'maximize',
  'resize',
  'toolbar-click',
  'focus',
  'blur'
])

// Store
const store = useStore()

// 响应式数据
const isFocused = ref(true)
const isFullscreen = ref(false)
const currentWidth = ref(props.width)
const currentHeight = ref(props.height)
const isResizing = ref(false)
const resizeStartX = ref(0)
const resizeStartY = ref(0)
const resizeStartWidth = ref(0)
const resizeStartHeight = ref(0)

// 计算属性
const isDarkMode = computed(() => store.getters.useDarkMode)

const windowStyle = computed(() => ({
  width: `${currentWidth.value}px`,
  height: `${currentHeight.value}px`,
  minWidth: `${props.minWidth}px`,
  minHeight: `${props.minHeight}px`
}))

// 方法
const handleFocus = () => {
  if (!isFocused.value) {
    isFocused.value = true
    emit('focus')
  }
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}

const handleClose = () => {
  emit('close')
}

const handleMinimize = () => {
  emit('minimize')
}

const handleMaximize = () => {
  isFullscreen.value = !isFullscreen.value
  emit('maximize', isFullscreen.value)
}

const handleTitleBarDoubleClick = () => {
  handleMaximize()
}

const handleToolbarClick = (item) => {
  emit('toolbar-click', item)
}

// 调整大小功能
const startResize = (event) => {
  if (!props.resizable) return
  
  isResizing.value = true
  resizeStartX.value = event.clientX
  resizeStartY.value = event.clientY
  resizeStartWidth.value = currentWidth.value
  resizeStartHeight.value = currentHeight.value
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  
  event.preventDefault()
}

const handleResize = (event) => {
  if (!isResizing.value) return
  
  const deltaX = event.clientX - resizeStartX.value
  const deltaY = event.clientY - resizeStartY.value
  
  const newWidth = Math.max(props.minWidth, resizeStartWidth.value + deltaX)
  const newHeight = Math.max(props.minHeight, resizeStartHeight.value + deltaY)
  
  currentWidth.value = newWidth
  currentHeight.value = newHeight
  
  emit('resize', { width: newWidth, height: newHeight })
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (!isFocused.value) return
  
  // Cmd+W 关闭窗口
  if (event.metaKey && event.key === 'w') {
    event.preventDefault()
    handleClose()
  }
  
  // Cmd+M 最小化窗口
  if (event.metaKey && event.key === 'm') {
    event.preventDefault()
    handleMinimize()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.mac-window')) {
      handleBlur()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.mac-window {
  background-color: var(--mac-bg-primary);
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease-out;
  
  &.focused {
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.2);
  }
  
  &.fullscreen {
    border-radius: 0;
    box-shadow: none;
    width: 100vw !important;
    height: 100vh !important;
  }
  
  &:not(.focused) {
    .mac-titlebar .traffic-lights .traffic-light {
      background: #e0e0e0 !important;
    }
  }
}

.mac-window-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nw-resize;
  background: linear-gradient(
    -45deg,
    transparent 0%,
    transparent 40%,
    rgba(0, 0, 0, 0.1) 40%,
    rgba(0, 0, 0, 0.1) 43%,
    transparent 43%,
    transparent 47%,
    rgba(0, 0, 0, 0.1) 47%,
    rgba(0, 0, 0, 0.1) 50%,
    transparent 50%,
    transparent 54%,
    rgba(0, 0, 0, 0.1) 54%,
    rgba(0, 0, 0, 0.1) 57%,
    transparent 57%,
    transparent 100%
  );
  
  &:hover {
    background: linear-gradient(
      -45deg,
      transparent 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.2) 40%,
      rgba(0, 0, 0, 0.2) 43%,
      transparent 43%,
      transparent 47%,
      rgba(0, 0, 0, 0.2) 47%,
      rgba(0, 0, 0, 0.2) 50%,
      transparent 50%,
      transparent 54%,
      rgba(0, 0, 0, 0.2) 54%,
      rgba(0, 0, 0, 0.2) 57%,
      transparent 57%,
      transparent 100%
    );
  }
}

/* 深色主题适配 */
.dark-theme {
  .resize-handle {
    background: linear-gradient(
      -45deg,
      transparent 0%,
      transparent 40%,
      rgba(255, 255, 255, 0.1) 40%,
      rgba(255, 255, 255, 0.1) 43%,
      transparent 43%,
      transparent 47%,
      rgba(255, 255, 255, 0.1) 47%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 50%,
      transparent 54%,
      rgba(255, 255, 255, 0.1) 54%,
      rgba(255, 255, 255, 0.1) 57%,
      transparent 57%,
      transparent 100%
    );
    
    &:hover {
      background: linear-gradient(
        -45deg,
        transparent 0%,
        transparent 40%,
        rgba(255, 255, 255, 0.2) 40%,
        rgba(255, 255, 255, 0.2) 43%,
        transparent 43%,
        transparent 47%,
        rgba(255, 255, 255, 0.2) 47%,
        rgba(255, 255, 255, 0.2) 50%,
        transparent 50%,
        transparent 54%,
        rgba(255, 255, 255, 0.2) 54%,
        rgba(255, 255, 255, 0.2) 57%,
        transparent 57%,
        transparent 100%
      );
    }
  }
}

/* 动画效果 */
.mac-window {
  animation: mac-window-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes mac-window-appear {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
