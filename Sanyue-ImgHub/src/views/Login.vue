<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>macOS Finder 风格图床</h1>
          <p>请输入访问密码</p>
        </div>
        
        <div class="login-form">
          <el-input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            size="large"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
          
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const password = ref('')
const loading = ref(false)

// 方法
const handleLogin = async () => {
  if (!password.value) {
    ElMessage.warning('请输入密码')
    return
  }
  
  loading.value = true
  
  try {
    // 模拟登录验证
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (password.value === 'admin' || password.value === '123456') {
      ElMessage.success('登录成功')
      router.push('/finder')
    } else {
      ElMessage.error('密码错误')
    }
  } catch (error) {
    ElMessage.error('登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.login-header {
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--mac-text-primary);
  margin: 0 0 8px 0;
}

.login-header p {
  font-size: 14px;
  color: var(--mac-text-secondary);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-form .el-button {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

/* 深色主题适配 */
.dark-theme .login-card {
  background: rgba(40, 40, 40, 0.95);
}
</style>
