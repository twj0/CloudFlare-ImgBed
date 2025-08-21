<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="not-found-content">
        <el-icon class="not-found-icon"><Warning /></el-icon>
        <h1>页面未找到</h1>
        <p>抱歉，您访问的页面不存在</p>
        <el-button type="primary" @click="goHome">
          返回首页
        </el-button>
      </div>
    </div>
  </div>


</template>

<script setup>
import { useRouter } from 'vue-router'
import { Warning } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.not-found-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.not-found-container {
  text-align: center;
  color: white;
}

.not-found-icon {
  font-size: 80px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 24px;
}

.not-found-content h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.not-found-content p {
  font-size: 16px;
  margin: 0 0 32px 0;
  opacity: 0.9;
}

.not-found-content .el-button {
  font-size: 16px;
  padding: 12px 24px;
}

</style>
