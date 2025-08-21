const state = {
  // 当前浏览的路径
  currentPath: '/',
  // 视图模式 ('list', 'grid', 'detail')
  viewMode: 'list',
  // 排序字段 ('name', 'date', 'size', 'type')
  sortField: 'name',
  // 排序顺序 ('asc', 'desc')
  sortOrder: 'asc',
  // 搜索查询
  searchQuery: '',
  // 单个选中的文件
  selectedFile: null,
  // 多个选中的文件列表
  selectedItems: [],
  // 导航历史记录
  navigationHistory: ['/'],
  // 当前在历史记录中的索引
  currentHistoryIndex: 0,
  // 展开的文件夹列表
  expandedFolders: ['/'],
  // 当前路径的文件列表
  currentItems: [],
  // 加载状态
  loading: false,
  // 错误信息
  error: null,
  // 剪贴板
  clipboard: {
    items: [],
    operation: null // 'copy' or 'cut'
  },
  // 最近访问的文件
  recentItems: [],
  // 收藏的文件
  favoriteItems: [],
  // 文件夹树缓存
  folderTreeCache: {},
  // 上传进度
  uploadProgress: {
    visible: false,
    files: [],
    completed: 0,
    total: 0
  }
};

const mutations = {
  SET_CURRENT_PATH(state, path) {
    state.currentPath = path;
  },
  SET_VIEW_MODE(state, mode) {
    state.viewMode = mode;
  },
  SET_SORT_FIELD(state, field) {
    state.sortField = field;
  },
  SET_SORT_ORDER(state, order) {
    state.sortOrder = order;
  },
  SET_SEARCH_QUERY(state, query) {
    state.searchQuery = query;
  },
  SET_SELECTED_ITEMS(state, items) {
    state.selectedItems = items;
    state.selectedFile = items.length === 1 ? items[0] : null;
  },
  SET_CURRENT_ITEMS(state, items) {
    state.currentItems = items;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  ADD_TO_HISTORY(state, path) {
    // 如果在历史记录中后退过，先截断未来的历史
    if (state.currentHistoryIndex < state.navigationHistory.length - 1) {
      state.navigationHistory = state.navigationHistory.slice(0, state.currentHistoryIndex + 1);
    }
    state.navigationHistory.push(path);
    state.currentHistoryIndex = state.navigationHistory.length - 1;
  },
  SET_HISTORY_INDEX(state, index) {
    state.currentHistoryIndex = index;
  },
  EXPAND_FOLDER(state, path) {
    if (!state.expandedFolders.includes(path)) {
      state.expandedFolders.push(path);
    }
  },
  COLLAPSE_FOLDER(state, path) {
    const index = state.expandedFolders.indexOf(path);
    if (index > -1) {
      state.expandedFolders.splice(index, 1);
    }
  },
  SET_CLIPBOARD(state, { items, operation }) {
    state.clipboard.items = items;
    state.clipboard.operation = operation;
  },
  CLEAR_CLIPBOARD(state) {
    state.clipboard.items = [];
    state.clipboard.operation = null;
  },
  ADD_RECENT_ITEM(state, item) {
    // 移除已存在的项目
    const existingIndex = state.recentItems.findIndex(i => i.path === item.path);
    if (existingIndex > -1) {
      state.recentItems.splice(existingIndex, 1);
    }
    // 添加到开头
    state.recentItems.unshift({
      ...item,
      lastAccessed: Date.now()
    });
    // 限制最大数量
    if (state.recentItems.length > 20) {
      state.recentItems = state.recentItems.slice(0, 20);
    }
  },
  ADD_FAVORITE_ITEM(state, item) {
    if (!state.favoriteItems.find(i => i.path === item.path)) {
      state.favoriteItems.push(item);
    }
  },
  REMOVE_FAVORITE_ITEM(state, path) {
    const index = state.favoriteItems.findIndex(i => i.path === path);
    if (index > -1) {
      state.favoriteItems.splice(index, 1);
    }
  },
  SET_FOLDER_TREE_CACHE(state, { path, children }) {
    state.folderTreeCache[path] = children;
  },
  SET_UPLOAD_PROGRESS(state, progress) {
    state.uploadProgress = { ...state.uploadProgress, ...progress };
  }
};

const actions = {
  // 初始化文件管理器
  async initialize({ commit, dispatch }, initialPath = '/') {
    commit('SET_CURRENT_PATH', initialPath);
    commit('ADD_TO_HISTORY', initialPath);
    await dispatch('loadItems', initialPath);
  },

  // 导航到一个新路径
  async navigateTo({ commit, dispatch, state }, path) {
    if (path === state.currentPath) return;

    commit('SET_CURRENT_PATH', path);
    commit('ADD_TO_HISTORY', path);
    commit('SET_SELECTED_ITEMS', []);

    await dispatch('loadItems', path);
  },

  // 后退
  async navigateBack({ commit, dispatch, state }) {
    if (state.currentHistoryIndex > 0) {
      const newIndex = state.currentHistoryIndex - 1;
      const path = state.navigationHistory[newIndex];
      commit('SET_HISTORY_INDEX', newIndex);
      commit('SET_CURRENT_PATH', path);
      await dispatch('loadItems', path);
    }
  },

  // 前进
  async navigateForward({ commit, dispatch, state }) {
    if (state.currentHistoryIndex < state.navigationHistory.length - 1) {
      const newIndex = state.currentHistoryIndex + 1;
      const path = state.navigationHistory[newIndex];
      commit('SET_HISTORY_INDEX', newIndex);
      commit('SET_CURRENT_PATH', path);
      await dispatch('loadItems', path);
    }
  },

  // 刷新当前路径
  async refreshCurrentPath({ dispatch, state }) {
    await dispatch('loadItems', state.currentPath);
  },

  // 加载文件列表
  async loadItems({ commit }, path) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      // 这里应该调用实际的API
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const items = await response.json();
      commit('SET_CURRENT_ITEMS', items);
    } catch (error) {
      console.error('Failed to load items:', error);
      commit('SET_ERROR', error.message);
      commit('SET_CURRENT_ITEMS', []);
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // 加载文件夹树
  async loadFolderTree() {
    try {
      const response = await fetch('/api/folders/tree');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tree = await response.json();
      return tree;
    } catch (error) {
      console.error('Failed to load folder tree:', error);
      return [];
    }
  },

  // 加载文件夹子项
  async loadFolderChildren({ commit, state }, path) {
    if (state.folderTreeCache[path]) {
      return state.folderTreeCache[path];
    }

    try {
      const response = await fetch(`/api/folders/children?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const children = await response.json();
      commit('SET_FOLDER_TREE_CACHE', { path, children });
      return children;
    } catch (error) {
      console.error('Failed to load folder children:', error);
      return [];
    }
  },

  // 加载最近访问项目
  async loadRecentItems() {
    try {
      const response = await fetch('/api/files/recent');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const items = await response.json();
      return items;
    } catch (error) {
      console.error('Failed to load recent items:', error);
      return [];
    }
  },

  // 创建文件夹
  async createFolder({ dispatch }, { path, name }) {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path, name })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await dispatch('refreshCurrentPath');
      return true;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  },

  // 删除项目
  async deleteItems({ dispatch }, items) {
    try {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: items.map(item => item.path) })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await dispatch('refreshCurrentPath');
      return true;
    } catch (error) {
      console.error('Failed to delete items:', error);
      throw error;
    }
  },

  // 重命名项目
  async renameItem({ dispatch }, { oldName, newName }) {
    try {
      const response = await fetch('/api/files/rename', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldName, newName })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await dispatch('refreshCurrentPath');
      return true;
    } catch (error) {
      console.error('Failed to rename item:', error);
      throw error;
    }
  },

  // 移动项目
  async moveItems({ dispatch }, { items, targetPath, operation = 'move' }) {
    try {
      const response = await fetch('/api/files/move', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: items.map(item => item.path),
          targetPath,
          operation
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await dispatch('refreshCurrentPath');
      return true;
    } catch (error) {
      console.error('Failed to move items:', error);
      throw error;
    }
  },

  // 上传文件
  async uploadFiles({ commit, dispatch }, { files, path }) {
    commit('SET_UPLOAD_PROGRESS', {
      visible: true,
      files: files.map(f => ({ name: f.name, progress: 0, status: 'pending' })),
      completed: 0,
      total: files.length
    });

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        commit('SET_UPLOAD_PROGRESS', {
          completed: i + 1,
          files: files.map((f, index) => ({
            name: f.name,
            progress: index <= i ? 100 : 0,
            status: index < i ? 'completed' : index === i ? 'completed' : 'pending'
          }))
        });
      }

      await dispatch('refreshCurrentPath');

      setTimeout(() => {
        commit('SET_UPLOAD_PROGRESS', { visible: false });
      }, 2000);

      return true;
    } catch (error) {
      console.error('Failed to upload files:', error);
      commit('SET_UPLOAD_PROGRESS', { visible: false });
      throw error;
    }
  },

  // 复制选中项目
  copySelected({ commit, state }) {
    if (state.selectedItems.length > 0) {
      commit('SET_CLIPBOARD', {
        items: [...state.selectedItems],
        operation: 'copy'
      });
    }
  },

  // 剪切选中项目
  cutSelected({ commit, state }) {
    if (state.selectedItems.length > 0) {
      commit('SET_CLIPBOARD', {
        items: [...state.selectedItems],
        operation: 'cut'
      });
    }
  },

  // 粘贴
  async paste({ commit, dispatch, state }) {
    if (state.clipboard.items.length === 0) return;

    const { items, operation } = state.clipboard;

    try {
      await dispatch('moveItems', {
        items,
        targetPath: state.currentPath,
        operation
      });

      if (operation === 'cut') {
        commit('CLEAR_CLIPBOARD');
      }
    } catch (error) {
      console.error('Failed to paste:', error);
      throw error;
    }
  },

  // 全选
  selectAll({ commit, state }) {
    commit('SET_SELECTED_ITEMS', [...state.currentItems]);
  },

  // 打开文件
  async openFile({ commit }, item) {
    // 添加到最近访问
    commit('ADD_RECENT_ITEM', item);

    // 根据文件类型执行不同操作
    if (item.type === 'image') {
      // 打开图片预览
      window.open(item.url, '_blank');
    } else {
      // 下载文件
      const link = document.createElement('a');
      link.href = item.url;
      link.download = item.name;
      link.click();
    }
  },

  // 执行操作
  async executeAction({ dispatch }, { action, item }) {
    switch (action) {
      case 'open':
        if (item.type === 'folder') {
          await dispatch('navigateTo', item.path);
        } else {
          await dispatch('openFile', item);
        }
        break;
      case 'refresh':
        await dispatch('refreshCurrentPath');
        break;
      case 'upload':
        // 触发文件选择对话框
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = async (e) => {
          const files = Array.from(e.target.files);
          if (files.length > 0) {
            await dispatch('uploadFiles', { files, path: item?.path || '/' });
          }
        };
        input.click();
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }
};

const getters = {
  currentPath: state => state.currentPath,
  viewMode: state => state.viewMode,
  sortField: state => state.sortField,
  sortOrder: state => state.sortOrder,
  searchQuery: state => state.searchQuery,
  selectedFile: state => state.selectedFile,
  selectedItems: state => state.selectedItems,
  currentItems: state => state.currentItems,
  loading: state => state.loading,
  error: state => state.error,
  expandedFolders: state => state.expandedFolders,
  canGoBack: state => state.currentHistoryIndex > 0,
  canGoForward: state => state.currentHistoryIndex < state.navigationHistory.length - 1,
  clipboard: state => state.clipboard,
  recentItems: state => state.recentItems,
  favoriteItems: state => state.favoriteItems,
  uploadProgress: state => state.uploadProgress,

  // 过滤后的项目列表
  filteredItems: (state) => {
    let items = [...state.currentItems];

    // 搜索过滤
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query)
      );
    }

    // 排序
    items.sort((a, b) => {
      let aValue, bValue;

      switch (state.sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'modified':
          aValue = new Date(a.modified || 0);
          bValue = new Date(b.modified || 0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return state.sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return state.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    // 文件夹优先
    return items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return 0;
    });
  },

  // 选择统计
  selectionStats: (state) => {
    const items = state.selectedItems;
    const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
    const folderCount = items.filter(item => item.type === 'folder').length;
    const fileCount = items.length - folderCount;

    return {
      total: items.length,
      files: fileCount,
      folders: folderCount,
      totalSize
    };
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};