const state = {
  // 当前浏览的路径
  currentPath: '',
  // 视图模式 ('list', 'grid', 'detail')
  viewMode: 'list',
  // 排序字段 ('name', 'date', 'size', 'type')
  sortField: 'name',
  // 排序顺序 ('asc', 'desc')
  sortOrder: 'asc',
  // 单个选中的文件
  selectedFile: null,
  // 多个选中的文件列表
  selectedFiles: [],
  // 导航历史记录
  navigationHistory: [''],
  // 当前在历史记录中的索引
  currentHistoryIndex: 0,
};

const mutations = {
  SET_CURRENT_PATH(state, path) {
    state.currentPath = path;
  },
  SET_VIEW_MODE(state, mode) {
    state.viewMode = mode;
  },
  SET_SORT(state, { field, order }) {
    state.sortField = field;
    state.sortOrder = order;
  },
  SET_SELECTED_FILE(state, file) {
    state.selectedFile = file;
  },
  SET_SELECTED_FILES(state, files) {
    state.selectedFiles = files;
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
};

const actions = {
  // 导航到一个新路径
  navigateTo({ commit, state }, path) {
    if (path === state.currentPath) return;
    commit('SET_CURRENT_PATH', path);
    commit('ADD_TO_HISTORY', path);
    // 清空选择
    commit('SET_SELECTED_FILE', null);
    commit('SET_SELECTED_FILES', []);
  },
  // 后退
  goBack({ commit, state }) {
    if (state.currentHistoryIndex > 0) {
      const newIndex = state.currentHistoryIndex - 1;
      commit('SET_HISTORY_INDEX', newIndex);
      commit('SET_CURRENT_PATH', state.navigationHistory[newIndex]);
    }
  },
  // 前进
  goForward({ commit, state }) {
    if (state.currentHistoryIndex < state.navigationHistory.length - 1) {
      const newIndex = state.currentHistoryIndex + 1;
      commit('SET_HISTORY_INDEX', newIndex);
      commit('SET_CURRENT_PATH', state.navigationHistory[newIndex]);
    }
  },
  // 向上
  goUp({ dispatch, state }) {
    if (state.currentPath) {
      const parentPath = state.currentPath.split('/').slice(0, -1).join('/');
      dispatch('navigateTo', parentPath);
    }
  },
  // 更新排序
  updateSort({ commit, state }, field) {
    let order = 'asc';
    if (state.sortField === field) {
      order = state.sortOrder === 'asc' ? 'desc' : 'asc';
    }
    commit('SET_SORT', { field, order });
  },
  // 更新文件选择
  updateSelection({ commit }, files) {
    commit('SET_SELECTED_FILES', files);
    if (files.length === 1) {
      commit('SET_SELECTED_FILE', files[0]);
    } else {
      commit('SET_SELECTED_FILE', null);
    }
  },
};

const getters = {
  currentPath: state => state.currentPath,
  viewMode: state => state.viewMode,
  sortField: state => state.sortField,
  sortOrder: state => state.sortOrder,
  selectedFile: state => state.selectedFile,
  selectedFiles: state => state.selectedFiles,
  canGoBack: state => state.currentHistoryIndex > 0,
  canGoForward: state => state.currentHistoryIndex < state.navigationHistory.length - 1,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};