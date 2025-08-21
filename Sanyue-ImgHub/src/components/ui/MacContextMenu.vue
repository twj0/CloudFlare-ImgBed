<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="mac-context-menu-overlay"
      @click="$emit('close')"
      @contextmenu.prevent="$emit('close')"
    >
      <div
        class="mac-context-menu"
        :style="menuStyle"
        @click.stop
      >
        <div
          v-for="(item, index) in items"
          :key="index"
          class="menu-item"
          :class="{ 
            'disabled': item.disabled,
            'divider': item.type === 'divider'
          }"
          @click="handleItemClick(item)"
        >
          <div v-if="item.type === 'divider'" class="menu-divider" />
          <template v-else>
            <el-icon v-if="item.icon" class="menu-icon">
              <component :is="item.icon" />
            </el-icon>
            <span class="menu-label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="menu-shortcut">{{ item.shortcut }}</span>
          </template>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  items: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['close', 'item-click'])

// 计算属性
const menuStyle = computed(() => {
  const maxWidth = window.innerWidth
  const maxHeight = window.innerHeight
  const menuWidth = 200
  const menuHeight = props.items.length * 32 + 16
  
  let left = props.x
  let top = props.y
  
  // 防止菜单超出屏幕边界
  if (left + menuWidth > maxWidth) {
    left = maxWidth - menuWidth - 10
  }
  
  if (top + menuHeight > maxHeight) {
    top = maxHeight - menuHeight - 10
  }
  
  return {
    left: `${left}px`,
    top: `${top}px`
  }
})

// 方法
const handleItemClick = (item) => {
  if (item.disabled || item.type === 'divider') return
  
  emit('item-click', item.action, item)
  emit('close')
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.mac-context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: transparent;
}

.mac-context-menu {
  position: absolute;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.95);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  font-size: 13px;
  animation: mac-context-menu-appear 0.15s ease-out;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.1s ease-out;
  
  &:hover:not(.disabled):not(.divider) {
    background: var(--mac-accent-color);
    color: white;
    
    .menu-icon {
      color: white;
    }
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.divider {
    padding: 0;
    cursor: default;
  }
}

.menu-icon {
  margin-right: 8px;
  font-size: 14px;
  color: var(--mac-text-secondary);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-label {
  flex: 1;
  color: var(--mac-text-primary);
}

.menu-shortcut {
  margin-left: 16px;
  font-size: 11px;
  color: var(--mac-text-tertiary);
  font-family: 'SF Mono', Monaco, monospace;
}

.menu-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 4px 0;
}

/* 深色主题适配 */
.dark-theme .mac-context-menu {
  background: rgba(40, 40, 40, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
  
  .menu-divider {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* 动画 */
@keyframes mac-context-menu-appear {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
