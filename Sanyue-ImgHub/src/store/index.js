import { createStore } from 'vuex'
import axios from '@/utils/axios';
import createPersistedState from 'vuex-persistedstate';
import finder from './modules/finder';

export default createStore({
  state: {
    // 基础配置
    userConfig: null,
    credentials: null,

    // 主题配置
    useDarkMode: null,
    cusDarkMode: false,

    // 上传配置（保留用于兼容性）
    uploadMethod: 'default',
    uploadFolder: '',
  },
  getters: {
    userConfig: state => state.userConfig,
    credentials: state => state.credentials,
    useDarkMode: state => state.useDarkMode,
    cusDarkMode: state => state.cusDarkMode,
    storeUploadMethod: state => state.uploadMethod,
    storeUploadFolder: (state) => {
      return state.uploadFolder || localStorage.getItem('uploadFolder') || ''
    },
  },
  mutations: {
    setUserConfig(state, userConfig) {
      state.userConfig = userConfig;
    },
    setCredentials(state, credentials) {
      state.credentials = credentials;
    },
    setUseDarkMode(state, useDarkMode) {
      state.useDarkMode = useDarkMode;
    },
    setCusDarkMode(state, cusDarkMode) {
      state.cusDarkMode = cusDarkMode;
    },
    setUploadMethod(state, uploadMethod) {
      state.uploadMethod = uploadMethod;
    },
    setStoreUploadFolder(state, folder) {
      state.uploadFolder = folder
      localStorage.setItem('uploadFolder', folder)
    }
  },
  actions: {
    async fetchUserConfig({ commit }) {
      try {
        const response = await axios.get('/api/userConfig');
        commit('setUserConfig', response.data);
      } catch (error) {
        console.log('Failed to fetch user config:', error);
        // 设置默认配置
        commit('setUserConfig', {
          siteTitle: 'macOS Finder Style Image Bed',
          siteIcon: '/logo.png'
        });
      }
    }
  },
  modules: {
    finder,
  },
  plugins: [createPersistedState()]
})
