import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import store from '@/store'

// 管理员认证守卫（开发环境暂时跳过）
const adminAuthGuard = (to, from, next) => {
  if (process.env.NODE_ENV === 'development') {
    next()
    return
  }

  const credentials = store.getters.credentials
  if (credentials && credentials.role === 'admin') {
    next()
  } else {
    ElMessage.error('需要管理员权限')
    next('/login')
  }
}

const routes = [
  {
    path: '/',
    redirect: '/finder'
  },
  {
    path: '/finder',
    name: 'finder',
    component: () => import('../views/FinderHome.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/image-manager',
    name: 'imageManager',
    component: () => import('../views/ImageManager.vue'),
    beforeEnter: adminAuthGuard
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
