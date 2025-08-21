<template>
  <div 
    class="mac-titlebar"
    :class="{ 'focused': isFocused }"
    @dblclick="$emit('double-click')"
  >
    <!-- 交通灯按钮 -->
    <div v-if="showTrafficLights" class="traffic-lights">
      <div 
        class="traffic-light close"
        @click="$emit('close')"
        @mouseenter="showCloseIcon = true"
        @mouseleave="showCloseIcon = false"
      >
        <svg v-if="showCloseIcon" width="6" height="6" viewBox="0 0 6 6">
          <path d="M0 0L6 6M6 0L0 6" stroke="rgba(0,0,0,0.7)" stroke-width="1"/>
        </svg>
      </div>
      
      <div 
        class="traffic-light minimize"
        @click="$emit('minimize')"
        @mouseenter="showMinimizeIcon = true"
        @mouseleave="showMinimizeIcon = false"
      >
        <svg v-if="showMinimizeIcon" width="8" height="1" viewBox="0 0 8 1">
          <rect width="8" height="1" fill="rgba(0,0,0,0.7)"/>
        </svg>
      </div>
      
      <div 
        class="traffic-light maximize"
        @click="$emit('maximize')"
        @mouseenter="showMaximizeIcon = true"
        @mouseleave="showMaximizeIcon = false"
      >
        <svg v-if="showMaximizeIcon" width="6" height="6" viewBox="0 0 6 6">
          <path d="M0 0L6 0L6 6L0 6Z" stroke="rgba(0,0,0,0.7)" stroke-width="1" fill="none"/>
        </svg>
      </div>
    </div>
    
    <!-- 标题 -->
    <div class="title">
      {{ title }}
    </div>
    
    <!-- 右侧控制区域 -->
    <div class="controls">
      <slot name="controls" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  title: {
    type: String,
    default: 'Untitled'
  },
  showTrafficLights: {
    type: Boolean,
    default: true
  },
  isFocused: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['close', 'minimize', 'maximize', 'double-click'])

// 响应式数据
const showCloseIcon = ref(false)
const showMinimizeIcon = ref(false)
const showMaximizeIcon = ref(false)
</script>

<style scoped>
.mac-titlebar {
  height: 28px;
  background: linear-gradient(to bottom, 
    rgba(255, 255, 255, 0.8) 0%, 
    rgba(255, 255, 255, 0.6) 100%);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 0 12px;
  position: relative;
  -webkit-user-select: none;
  user-select: none;
  -webkit-app-region: drag;
  
  &:not(.focused) {
    background: linear-gradient(to bottom, 
      rgba(246, 246, 246, 0.8) 0%, 
      rgba(238, 238, 238, 0.8) 100%);
  }
}

.traffic-lights {
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag;
  
  .traffic-light {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 0.5px solid rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.15s ease-out;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    
    &.close {
      background: linear-gradient(135deg, #ff5f57 0%, #ff4444 100%);
      
      &:hover {
        background: linear-gradient(135deg, #ff6b63 0%, #ff5050 100%);
        transform: scale(1.1);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
    
    &.minimize {
      background: linear-gradient(135deg, #ffbd2e 0%, #ffaa00 100%);
      
      &:hover {
        background: linear-gradient(135deg, #ffc83a 0%, #ffb600 100%);
        transform: scale(1.1);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
    
    &.maximize {
      background: linear-gradient(135deg, #28ca42 0%, #20a034 100%);
      
      &:hover {
        background: linear-gradient(135deg, #34d54e 0%, #2cb03e 100%);
        transform: scale(1.1);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
    
    svg {
      opacity: 0;
      transition: opacity 0.15s ease-out;
    }
    
    &:hover svg {
      opacity: 1;
    }
  }
}

.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  font-weight: 500;
  color: var(--mac-text-primary);
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
  
  .mac-titlebar:not(.focused) & {
    color: var(--mac-text-secondary);
  }
}

.controls {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

/* 深色主题适配 */
.dark-theme .mac-titlebar {
  background: linear-gradient(to bottom, 
    rgba(40, 40, 40, 0.8) 0%, 
    rgba(30, 30, 30, 0.8) 100%);
  border-bottom-color: rgba(255, 255, 255, 0.1);
  
  &:not(.focused) {
    background: linear-gradient(to bottom, 
      rgba(35, 35, 35, 0.8) 0%, 
      rgba(25, 25, 25, 0.8) 100%);
  }
  
  .traffic-lights .traffic-light {
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* 窗口失焦时的交通灯样式 */
.mac-titlebar:not(.focused) .traffic-lights .traffic-light {
  background: #e0e0e0 !important;
  border-color: rgba(0, 0, 0, 0.05);
  
  &:hover {
    background: #d0d0d0 !important;
  }
  
  svg {
    display: none;
  }
}

/* 动画效果 */
.traffic-light {
  position: relative;
  overflow: hidden;
}

.traffic-light::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease-out;
}

.traffic-light:active::before {
  width: 20px;
  height: 20px;
}

/* 标题动画 */
.title {
  transition: color 0.2s ease-out;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .title {
    max-width: 200px;
    font-size: 12px;
  }
  
  .traffic-lights {
    gap: 6px;
    
    .traffic-light {
      width: 10px;
      height: 10px;
    }
  }
}
</style>
