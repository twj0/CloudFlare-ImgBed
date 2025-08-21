<template>
  <div class="image-manager">
    <FinderLayout :initial-path="'/images'" />
  </div>
</template>

<script setup>
import FinderLayout from '@/components/finder/FinderLayout.vue'
</script>

<style scoped>
.image-manager {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
</style>
