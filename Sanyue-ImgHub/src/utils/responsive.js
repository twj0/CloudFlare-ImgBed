import { ref, onMounted, onUnmounted } from 'vue';

// 响应式断点定义
export const BREAKPOINTS = {
  xs: 480,    // 超小屏幕
  sm: 768,    // 小屏幕
  md: 1024,   // 中等屏幕
  lg: 1200,   // 大屏幕
  xl: 1920    // 超大屏幕
};

// 设备类型
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
};

/**
 * 响应式断点检测 Hook
 * @returns {Object} 包含各种屏幕尺寸检测结果的响应式对象
 */
export function useBreakpoints() {
  const windowWidth = ref(window.innerWidth);
  const windowHeight = ref(window.innerHeight);

  // 断点检测
  const isXs = ref(false);
  const isSm = ref(false);
  const isMd = ref(false);
  const isLg = ref(false);
  const isXl = ref(false);

  // 设备类型检测
  const isMobile = ref(false);
  const isTablet = ref(false);
  const isDesktop = ref(false);

  // 方向检测
  const isPortrait = ref(false);
  const isLandscape = ref(false);

  // 触摸设备检测
  const isTouchDevice = ref(false);

  const updateBreakpoints = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    windowWidth.value = width;
    windowHeight.value = height;

    // 更新断点状态
    isXs.value = width < BREAKPOINTS.xs;
    isSm.value = width >= BREAKPOINTS.xs && width < BREAKPOINTS.sm;
    isMd.value = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
    isLg.value = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
    isXl.value = width >= BREAKPOINTS.lg;

    // 更新设备类型
    isMobile.value = width < BREAKPOINTS.sm;
    isTablet.value = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
    isDesktop.value = width >= BREAKPOINTS.md;

    // 更新方向
    isPortrait.value = height > width;
    isLandscape.value = width > height;

    // 检测触摸设备
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  const handleResize = () => {
    updateBreakpoints();
  };

  onMounted(() => {
    updateBreakpoints();
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  return {
    // 窗口尺寸
    windowWidth,
    windowHeight,
    
    // 断点检测
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    
    // 设备类型
    isMobile,
    isTablet,
    isDesktop,
    
    // 方向
    isPortrait,
    isLandscape,
    
    // 触摸设备
    isTouchDevice,
    
    // 工具方法
    updateBreakpoints
  };
}

/**
 * 获取当前设备类型
 * @returns {string} 设备类型
 */
export function getDeviceType() {
  const width = window.innerWidth;
  
  if (width < BREAKPOINTS.sm) {
    return DEVICE_TYPES.MOBILE;
  } else if (width < BREAKPOINTS.md) {
    return DEVICE_TYPES.TABLET;
  } else {
    return DEVICE_TYPES.DESKTOP;
  }
}

/**
 * 检查是否为移动设备
 * @returns {boolean}
 */
export function isMobileDevice() {
  return window.innerWidth < BREAKPOINTS.sm;
}

/**
 * 检查是否为触摸设备
 * @returns {boolean}
 */
export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * 获取适合当前屏幕的网格列数
 * @param {Object} options 配置选项
 * @returns {number} 列数
 */
export function getGridColumns(options = {}) {
  const {
    xs = 2,
    sm = 3,
    md = 4,
    lg = 5,
    xl = 6
  } = options;

  const width = window.innerWidth;

  if (width < BREAKPOINTS.xs) return xs;
  if (width < BREAKPOINTS.sm) return sm;
  if (width < BREAKPOINTS.md) return md;
  if (width < BREAKPOINTS.lg) return lg;
  return xl;
}

/**
 * 获取适合当前屏幕的容器内边距
 * @returns {string} CSS padding 值
 */
export function getContainerPadding() {
  const width = window.innerWidth;

  if (width < BREAKPOINTS.sm) return '12px';
  if (width < BREAKPOINTS.md) return '16px';
  if (width < BREAKPOINTS.lg) return '20px';
  return '24px';
}

/**
 * 获取适合当前屏幕的字体大小
 * @param {string} size 基础大小 ('small', 'medium', 'large')
 * @returns {string} CSS font-size 值
 */
export function getFontSize(size = 'medium') {
  const width = window.innerWidth;
  const isMobile = width < BREAKPOINTS.sm;

  const sizes = {
    small: isMobile ? '12px' : '14px',
    medium: isMobile ? '14px' : '16px',
    large: isMobile ? '16px' : '18px'
  };

  return sizes[size] || sizes.medium;
}

/**
 * 响应式样式生成器
 * @param {Object} styles 不同断点的样式配置
 * @returns {Object} 当前断点对应的样式
 */
export function getResponsiveStyles(styles) {
  const width = window.innerWidth;
  
  if (width < BREAKPOINTS.xs && styles.xs) return styles.xs;
  if (width < BREAKPOINTS.sm && styles.sm) return styles.sm;
  if (width < BREAKPOINTS.md && styles.md) return styles.md;
  if (width < BREAKPOINTS.lg && styles.lg) return styles.lg;
  if (styles.xl) return styles.xl;
  
  // 返回默认样式或最大断点样式
  return styles.default || styles.lg || styles.md || styles.sm || styles.xs || {};
}

/**
 * 移动端手势检测 Hook
 * @param {Object} element DOM 元素引用
 * @returns {Object} 手势事件处理器
 */
export function useGestures(element) {
  const startX = ref(0);
  const startY = ref(0);
  const endX = ref(0);
  const endY = ref(0);
  const isSwipe = ref(false);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    startX.value = touch.clientX;
    startY.value = touch.clientY;
    isSwipe.value = false;
  };

  const handleTouchMove = (event) => {
    if (!isSwipe.value) {
      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - startX.value);
      const deltaY = Math.abs(touch.clientY - startY.value);
      
      // 判断是否为滑动手势
      if (deltaX > 10 || deltaY > 10) {
        isSwipe.value = true;
      }
    }
  };

  const handleTouchEnd = (event) => {
    const touch = event.changedTouches[0];
    endX.value = touch.clientX;
    endY.value = touch.clientY;
  };

  const getSwipeDirection = () => {
    const deltaX = endX.value - startX.value;
    const deltaY = endY.value - startY.value;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  };

  const bindGestures = () => {
    if (element.value) {
      element.value.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.value.addEventListener('touchmove', handleTouchMove, { passive: true });
      element.value.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
  };

  const unbindGestures = () => {
    if (element.value) {
      element.value.removeEventListener('touchstart', handleTouchStart);
      element.value.removeEventListener('touchmove', handleTouchMove);
      element.value.removeEventListener('touchend', handleTouchEnd);
    }
  };

  onMounted(() => {
    bindGestures();
  });

  onUnmounted(() => {
    unbindGestures();
  });

  return {
    isSwipe,
    getSwipeDirection,
    bindGestures,
    unbindGestures
  };
}
