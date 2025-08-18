<template>
  <teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="context-menu"
      :style="menuStyle"
      @contextmenu.prevent
    >
      <div class="context-menu-content">
        <template v-for="(item, index) in items" :key="index">
          <div
            v-if="item.type === 'divider'"
            class="context-menu-divider"
          />
          <div
            v-else
            class="context-menu-item"
            :class="{
              'context-menu-item--disabled': item.disabled,
              'context-menu-item--danger': item.danger
            }"
            @click="handleItemClick(item)"
          >
            <el-icon v-if="item.icon" class="context-menu-icon">
              <component :is="getIcon(item.icon)" />
            </el-icon>
            <span class="context-menu-label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="context-menu-shortcut">
              {{ item.shortcut }}
            </span>
          </div>
        </template>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  Refresh, FolderAdd, Upload, Edit, Delete, Link, Copy, Cut, 
  Download, View, Star, Share, Setting
} from '@element-plus/icons-vue';

// Props
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['item-click']);

// 响应式数据
const visible = ref(false);
const position = ref({ x: 0, y: 0 });
const menuRef = ref(null);

// 图标映射
const iconMap = {
  'Refresh': Refresh,
  'FolderAdd': FolderAdd,
  'Upload': Upload,
  'Edit': Edit,
  'Delete': Delete,
  'Link': Link,
  'Copy': Copy,
  'Cut': Cut,
  'Download': Download,
  'View': View,
  'Star': Star,
  'Share': Share,
  'Setting': Setting
};

// 计算属性
const menuStyle = computed(() => {
  return {
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    zIndex: 9999
  };
});

// 方法
const show = (event, items = []) => {
  event.preventDefault();
  event.stopPropagation();
  
  position.value = { x: event.clientX, y: event.clientY };
  visible.value = true;
  
  nextTick(() => {
    adjustPosition();
  });
};

const hide = () => {
  visible.value = false;
};

const adjustPosition = () => {
  if (!menuRef.value) return;
  
  const menu = menuRef.value;
  const rect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let { x, y } = position.value;
  
  // 调整水平位置
  if (x + rect.width > viewportWidth) {
    x = viewportWidth - rect.width - 10;
  }
  if (x < 0) {
    x = 10;
  }
  
  // 调整垂直位置
  if (y + rect.height > viewportHeight) {
    y = viewportHeight - rect.height - 10;
  }
  if (y < 0) {
    y = 10;
  }
  
  position.value = { x, y };
};

const getIcon = (iconName) => {
  return iconMap[iconName] || null;
};

const handleItemClick = (item) => {
  if (item.disabled) return;
  
  emit('item-click', item.action, item);
  hide();
};

const handleClickOutside = (event) => {
  if (visible.value && menuRef.value && !menuRef.value.contains(event.target)) {
    hide();
  }
};

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    hide();
  }
};

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('contextmenu', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', hide);
  window.addEventListener('scroll', hide);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('contextmenu', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', hide);
  window.removeEventListener('scroll', hide);
});

// 暴露方法
defineExpose({
  show,
  hide
});
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  backdrop-filter: blur(10px);
  min-width: 160px;
  max-width: 240px;
  user-select: none;
  z-index: 9999;
}

.context-menu-content {
  padding: 6px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  color: var(--el-text-color-primary);
  gap: 8px;
}

.context-menu-item:hover {
  background: var(--el-fill-color-light);
}

.context-menu-item--disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}

.context-menu-item--disabled:hover {
  background: transparent;
}

.context-menu-item--danger {
  color: var(--el-color-danger);
}

.context-menu-item--danger:hover {
  background: var(--el-color-danger-light-9);
}

.context-menu-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.context-menu-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.context-menu-shortcut {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

.context-menu-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 6px 0;
}

/* 深色模式适配 */
.dark .context-menu {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
}

.dark .context-menu-item {
  color: var(--el-text-color-primary);
}

.dark .context-menu-item:hover {
  background: var(--el-fill-color-dark);
}

.dark .context-menu-item--danger:hover {
  background: var(--el-color-danger-dark-2);
}

.dark .context-menu-divider {
  background: var(--el-border-color);
}

/* 动画效果 */
.context-menu {
  animation: contextMenuFadeIn 0.15s ease-out;
  transform-origin: top left;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
