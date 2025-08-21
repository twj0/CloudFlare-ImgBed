import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

// 引入 Element Plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入 macOS 样式系统
import './styles/main.scss'

// 创建应用实例
const app = createApp(App)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 初始化深色模式
const initDarkMode = () => {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  const htmlElement = document.documentElement

  if (isDarkMode) {
    htmlElement.classList.add('dark-theme')
  } else {
    htmlElement.classList.remove('dark-theme')
  }

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (e.matches) {
      htmlElement.classList.add('dark-theme')
    } else {
      htmlElement.classList.remove('dark-theme')
    }
  })
}

// 设置网站标题和图标
const initSiteInfo = () => {
  document.title = 'macOS Finder 风格图床'

  const link = document.createElement('link')
  link.rel = 'icon'
  link.href = '/logo.png'
  document.head.appendChild(link)
}

// 初始化应用
initDarkMode()
initSiteInfo()

// 挂载应用
app.use(store).use(router).use(ElementPlus).mount('#app')
