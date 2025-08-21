// Finder状态管理模块

const state = {
  // 当前路径
  currentPath: '/',
  
  // 导航历史
  navigationHistory: ['/'],
  currentHistoryIndex: 0,
  
  // 视图模式 ('grid', 'list', 'column', 'gallery')
  viewMode: 'grid',
  
  // 排序
  sortField: 'name', // 'name', 'size', 'type', 'modified'
  sortOrder: 'asc', // 'asc', 'desc'
  
  // 搜索
  searchQuery: '',
  
  // 当前文件夹内容
  items: [],
  
  // 选中的项目
  selectedItems: [],
  
  // 加载状态
  loading: false,
  error: null,
  
  // 收藏夹
  favorites: [
    { name: '图片', path: '/images', type: 'folder' },
    { name: '最近上传', path: '/recent', type: 'folder' }
  ],
  
  // 最近访问
  recentItems: [],
  
  // 上传状态
  uploadProgress: {
    visible: false,
    files: [],
    totalProgress: 0
  },
  
  // 侧边栏状态
  sidebarVisible: true,
  sidebarWidth: 200,
  
  // 缩放级别
  zoomLevel: 1.0
}

const mutations = {
  SET_CURRENT_PATH(state, path) {
    state.currentPath = path
  },
  
  SET_NAVIGATION_HISTORY(state, { history, index }) {
    state.navigationHistory = history
    state.currentHistoryIndex = index
  },
  
  ADD_TO_HISTORY(state, path) {
    // 如果当前不在历史记录的末尾，截断后面的记录
    if (state.currentHistoryIndex < state.navigationHistory.length - 1) {
      state.navigationHistory = state.navigationHistory.slice(0, state.currentHistoryIndex + 1)
    }
    
    // 添加新路径（如果不是重复的）
    if (state.navigationHistory[state.navigationHistory.length - 1] !== path) {
      state.navigationHistory.push(path)
      state.currentHistoryIndex = state.navigationHistory.length - 1
    }
  },
  
  SET_VIEW_MODE(state, mode) {
    state.viewMode = mode
  },
  
  SET_SORT_FIELD(state, field) {
    state.sortField = field
  },
  
  SET_SORT_ORDER(state, order) {
    state.sortOrder = order
  },
  
  SET_SEARCH_QUERY(state, query) {
    state.searchQuery = query
  },
  
  SET_ITEMS(state, items) {
    state.items = items
  },
  
  SET_SELECTED_ITEMS(state, items) {
    state.selectedItems = items
  },
  
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  
  SET_ERROR(state, error) {
    state.error = error
  },
  
  ADD_FAVORITE(state, item) {
    if (!state.favorites.find(fav => fav.path === item.path)) {
      state.favorites.push(item)
    }
  },
  
  REMOVE_FAVORITE(state, path) {
    const index = state.favorites.findIndex(fav => fav.path === path)
    if (index > -1) {
      state.favorites.splice(index, 1)
    }
  },
  
  ADD_RECENT_ITEM(state, item) {
    // 移除已存在的项目
    const existingIndex = state.recentItems.findIndex(recent => recent.path === item.path)
    if (existingIndex > -1) {
      state.recentItems.splice(existingIndex, 1)
    }
    
    // 添加到开头
    state.recentItems.unshift({
      ...item,
      lastAccessed: Date.now()
    })
    
    // 限制数量
    if (state.recentItems.length > 20) {
      state.recentItems = state.recentItems.slice(0, 20)
    }
  },
  
  SET_UPLOAD_PROGRESS(state, progress) {
    state.uploadProgress = { ...state.uploadProgress, ...progress }
  },
  
  SET_SIDEBAR_VISIBLE(state, visible) {
    state.sidebarVisible = visible
  },
  
  SET_SIDEBAR_WIDTH(state, width) {
    state.sidebarWidth = width
  },
  
  SET_ZOOM_LEVEL(state, level) {
    state.zoomLevel = Math.max(0.5, Math.min(3.0, level))
  }
}

const actions = {
  // 初始化
  async initialize({ commit, dispatch }, initialPath = '/') {
    commit('SET_CURRENT_PATH', initialPath)
    commit('ADD_TO_HISTORY', initialPath)
    await dispatch('loadItems', initialPath)
  },
  
  // 导航到指定路径
  async navigateTo({ commit, dispatch, state }, path) {
    if (path === state.currentPath) return
    
    commit('SET_CURRENT_PATH', path)
    commit('ADD_TO_HISTORY', path)
    commit('SET_SELECTED_ITEMS', [])
    
    await dispatch('loadItems', path)
  },
  
  // 后退
  async navigateBack({ commit, dispatch, state }) {
    if (state.currentHistoryIndex > 0) {
      const newIndex = state.currentHistoryIndex - 1
      const path = state.navigationHistory[newIndex]
      
      commit('SET_CURRENT_PATH', path)
      commit('SET_NAVIGATION_HISTORY', {
        history: state.navigationHistory,
        index: newIndex
      })
      
      await dispatch('loadItems', path)
    }
  },
  
  // 前进
  async navigateForward({ commit, dispatch, state }) {
    if (state.currentHistoryIndex < state.navigationHistory.length - 1) {
      const newIndex = state.currentHistoryIndex + 1
      const path = state.navigationHistory[newIndex]
      
      commit('SET_CURRENT_PATH', path)
      commit('SET_NAVIGATION_HISTORY', {
        history: state.navigationHistory,
        index: newIndex
      })
      
      await dispatch('loadItems', path)
    }
  },
  
  // 刷新当前路径
  async refreshCurrentPath({ dispatch, state }) {
    await dispatch('loadItems', state.currentPath)
  },
  
  // 加载文件列表
  async loadItems({ commit }, path) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      // 模拟API调用
      const response = await mockAPI.getItems(path)
      commit('SET_ITEMS', response)
    } catch (error) {
      console.error('Failed to load items:', error)
      commit('SET_ERROR', error.message)
      commit('SET_ITEMS', [])
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 上传文件
  async uploadFiles({ commit, dispatch }, { files, path }) {
    commit('SET_UPLOAD_PROGRESS', {
      visible: true,
      files: files.map(f => ({
        name: f.name,
        progress: 0,
        status: 'pending'
      })),
      totalProgress: 0
    })
    
    try {
      // 模拟上传过程
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // 更新当前文件状态
        commit('SET_UPLOAD_PROGRESS', {
          files: files.map((f, index) => ({
            name: f.name,
            progress: index < i ? 100 : index === i ? 0 : 0,
            status: index < i ? 'completed' : index === i ? 'uploading' : 'pending'
          }))
        })
        
        // 模拟上传进度
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          
          commit('SET_UPLOAD_PROGRESS', {
            files: files.map((f, index) => ({
              name: f.name,
              progress: index < i ? 100 : index === i ? progress : 0,
              status: index < i ? 'completed' : index === i ? 'uploading' : 'pending'
            })),
            totalProgress: ((i * 100 + progress) / (files.length * 100)) * 100
          })
        }
        
        // 标记当前文件完成
        commit('SET_UPLOAD_PROGRESS', {
          files: files.map((f, index) => ({
            name: f.name,
            progress: index <= i ? 100 : 0,
            status: index <= i ? 'completed' : 'pending'
          }))
        })
      }
      
      // 上传完成后刷新列表
      await dispatch('refreshCurrentPath')
      
      // 延迟关闭进度框
      setTimeout(() => {
        commit('SET_UPLOAD_PROGRESS', { visible: false })
      }, 2000)
      
    } catch (error) {
      console.error('Upload failed:', error)
      commit('SET_UPLOAD_PROGRESS', { visible: false })
      throw error
    }
  },
  
  // 切换收藏状态
  toggleFavorite({ commit, state }, item) {
    const isFavorite = state.favorites.find(fav => fav.path === item.path)
    
    if (isFavorite) {
      commit('REMOVE_FAVORITE', item.path)
    } else {
      commit('ADD_FAVORITE', {
        name: item.name,
        path: item.path,
        type: item.type
      })
    }
  },
  
  // 添加到最近访问
  addToRecent({ commit }, item) {
    commit('ADD_RECENT_ITEM', item)
  }
}

const getters = {
  currentPath: state => state.currentPath,
  viewMode: state => state.viewMode,
  sortField: state => state.sortField,
  sortOrder: state => state.sortOrder,
  searchQuery: state => state.searchQuery,
  items: state => state.items,
  selectedItems: state => state.selectedItems,
  loading: state => state.loading,
  error: state => state.error,
  favorites: state => state.favorites,
  recentItems: state => state.recentItems,
  uploadProgress: state => state.uploadProgress,
  sidebarVisible: state => state.sidebarVisible,
  sidebarWidth: state => state.sidebarWidth,
  zoomLevel: state => state.zoomLevel,
  
  canGoBack: state => state.currentHistoryIndex > 0,
  canGoForward: state => state.currentHistoryIndex < state.navigationHistory.length - 1,
  
  // 过滤和排序后的项目列表
  filteredItems: state => {
    let items = [...state.items]
    
    // 搜索过滤
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      items = items.filter(item =>
        item.name.toLowerCase().includes(query)
      )
    }
    
    // 排序
    items.sort((a, b) => {
      let aValue, bValue
      
      switch (state.sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'size':
          aValue = a.size || 0
          bValue = b.size || 0
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'modified':
          aValue = new Date(a.modified || 0)
          bValue = new Date(b.modified || 0)
          break
        default:
          return 0
      }
      
      if (aValue < bValue) {
        return state.sortOrder === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return state.sortOrder === 'asc' ? 1 : -1
      }
      return 0
    })
    
    // 文件夹优先
    return items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1
      if (a.type !== 'folder' && b.type === 'folder') return 1
      return 0
    })
  }
}

// 模拟API
const mockAPI = {
  async getItems(path) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 模拟数据
    const mockData = {
      '/': [
        {
          name: '我的图片',
          path: '/images',
          type: 'folder',
          size: 0,
          modified: Date.now() - 86400000,
          created: Date.now() - 86400000 * 7
        },
        {
          name: '最近上传',
          path: '/recent',
          type: 'folder',
          size: 0,
          modified: Date.now() - 3600000,
          created: Date.now() - 86400000 * 3
        }
      ],
      '/images': [
        {
          name: 'photo1.jpg',
          path: '/images/photo1.jpg',
          type: 'image',
          size: 2048576,
          modified: Date.now() - 3600000,
          created: Date.now() - 3600000,
          url: '/static/404.png',
          thumbnail: '/static/404.png',
          width: 1920,
          height: 1080
        },
        {
          name: 'photo2.png',
          path: '/images/photo2.png',
          type: 'image',
          size: 1536000,
          modified: Date.now() - 7200000,
          created: Date.now() - 7200000,
          url: '/static/404.png',
          thumbnail: '/static/404.png',
          width: 1280,
          height: 720
        }
      ],
      '/recent': []
    }
    
    return mockData[path] || []
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
