<template>
  <div class="directory-tree-container">
    <el-tree
      ref="treeRef"
      :props="treeProps"
      :load="loadNode"
      lazy
      @node-click="handleNodeClick"
      highlight-current
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <el-icon><Folder /></el-icon>
          <span class="node-label">{{ node.label }}</span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios'; // 假设项目中已配置好 axios
import { ElMessage } from 'element-plus';
import { Folder } from '@element-plus/icons-vue';

const treeRef = ref(null);
const store = useStore();

// 从 Vuex 获取当前路径
const currentPath = computed(() => store.getters['fileManager/currentPath']);

// el-tree 的配置
const treeProps = {
  label: 'name',
  children: 'zones', // 'zones' 是 el-tree 内部使用的字段名
  isLeaf: 'isLeaf',
};

/**
 * 懒加载节点数据的方法
 * @param {object} node - 当前节点
 * @param {function} resolve - 解析函数，用于返回子节点数据
 */
const loadNode = async (node, resolve) => {
  // 根节点处理
  if (node.level === 0) {
    // 返回一个虚拟的根节点
    return resolve([{ name: '全部文件', path: '', isLeaf: false }]);
  }

  // 获取当前节点的路径
  const currentPath = node.data.path;

  try {
    // 调用后端 API 获取子目录
    const response = await axios.get('/api/manage/list', {
      params: {
        dir: currentPath,
      },
    });

    if (response.data && Array.isArray(response.data.directories)) {
      const subDirectories = response.data.directories.map(dir => {
        const dirParts = dir.replace(/\/$/, '').split('/');
        return {
          name: dirParts[dirParts.length - 1], // 显示最后一级目录名
          path: dir, // 完整路径
          isLeaf: false, // 目录总是不是叶子节点
        };
      });
      return resolve(subDirectories);
    } else {
      // 如果没有子目录，也返回空数组
      return resolve([]);
    }
  } catch (error) {
    console.error('Failed to load directory data:', error);
    ElMessage.error('加载目录失败');
    return resolve([]);
  }
};

/**
 * 节点点击事件处理
 * @param {object} data - 点击节点所代表的数据
 */
const handleNodeClick = (data) => {
  // 直接 dispatch action 来改变路径
  store.dispatch('fileManager/navigateTo', data.path);
};

const refresh = () => {
  // Element Plus Tree 没有直接的 reload 方法，我们通过更新 key 来强制重新渲染
  // 或者更精细地控制，重新加载根节点
  const rootNode = treeRef.value.getNode('');
  if (rootNode) {
    rootNode.loaded = false;
    rootNode.expand();
  }
};

// 监听来自 store 的 currentPath 变化，并更新 tree 的选中状态
watch(currentPath, (newPath) => {
  if (treeRef.value) {
    // el-tree 的 setCurrentKey 需要一个唯一的 key，我们这里用 path
    treeRef.value.setCurrentKey(newPath);
  }
});

// 暴露方法给父组件
defineExpose({
  refresh,
});
</script>

<style scoped>
.directory-tree-container {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  height: 100%;
  overflow-y: auto;
}

.custom-tree-node {
  display: flex;
  align-items: center;
}

.node-label {
  margin-left: 8px;
}
</style>