<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

onMounted(() => {
  // 初始化应用
  console.log('macOS Finder Style Image Bed initialized')

  // 设置网站图标
  setSiteIcon()
})

const setSiteIcon = () => {
  const link = document.createElement('link')
  link.rel = 'icon'
  link.href = '/logo.png'
  document.head.appendChild(link)
}
</script>

<style>
/* 全局样式已移至 styles/main.scss */
</style>