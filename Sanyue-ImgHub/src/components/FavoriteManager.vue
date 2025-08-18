<template>
  <div class="favorite-manager">
    <!-- 收藏夹头部 -->
    <div class="favorite-header">
      <div class="header-left">
        <h3>收藏夹管理</h3>
        <span class="group-count">共 {{ favoriteGroups.length }} 个分组</span>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateGroupDialog" :icon="Plus">
          新建分组
        </el-button>
      </div>
    </div>

    <!-- 分组列表 -->
    <div class="groups-container" v-loading="loading">
      <div class="groups-grid">
        <div
          v-for="group in favoriteGroups"
          :key="group.id"
          class="group-card"
          :class="{ 'active': activeGroupId === group.id }"
          @click="selectGroup(group.id)"
        >
          <div class="group-header">
            <div class="group-icon">
              <el-icon :color="group.color" :size="24">
                <component :is="getIconComponent(group.icon)" />
              </el-icon>
            </div>
            <div class="group-info">
              <h4 class="group-name">{{ group.name }}</h4>
              <p class="group-description">{{ group.description || '暂无描述' }}</p>
            </div>
            <div class="group-actions" v-if="!group.isDefault">
              <el-dropdown @command="handleGroupAction">
                <el-button type="text" :icon="MoreFilled" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="`edit:${group.id}`">编辑</el-dropdown-item>
                    <el-dropdown-item :command="`delete:${group.id}`" class="danger">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <div class="group-stats">
            <div class="stat-item">
              <span class="stat-label">文件数量</span>
              <span class="stat-value">{{ group.fileCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">创建时间</span>
              <span class="stat-value">{{ formatDate(group.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="favoriteGroups.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无收藏夹分组">
          <el-button type="primary" @click="showCreateGroupDialog">创建第一个分组</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 收藏文件列表 -->
    <div class="favorite-files" v-if="activeGroupId">
      <div class="files-header">
        <h4>{{ activeGroup?.name }} 中的文件</h4>
        <div class="files-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索收藏的文件..."
            :prefix-icon="Search"
            clearable
            size="small"
            style="width: 200px;"
          />
        </div>
      </div>
      
      <FavoriteFileList
        :group-id="activeGroupId"
        :search-query="searchQuery"
        @file-removed="handleFileRemoved"
        @files-updated="handleFilesUpdated"
      />
    </div>

    <!-- 创建/编辑分组对话框 -->
    <el-dialog
      v-model="groupDialogVisible"
      :title="isEditingGroup ? '编辑分组' : '创建分组'"
      width="500px"
      @close="resetGroupForm"
    >
      <el-form
        ref="groupFormRef"
        :model="groupForm"
        :rules="groupFormRules"
        label-width="80px"
      >
        <el-form-item label="分组名称" prop="name">
          <el-input
            v-model="groupForm.name"
            placeholder="请输入分组名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="分组图标" prop="icon">
          <div class="icon-selector">
            <div
              v-for="icon in availableIcons"
              :key="icon"
              class="icon-option"
              :class="{ 'selected': groupForm.icon === icon }"
              @click="groupForm.icon = icon"
            >
              <el-icon :size="20">
                <component :is="getIconComponent(icon)" />
              </el-icon>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="分组颜色" prop="color">
          <div class="color-picker-container">
            <el-color-picker v-model="groupForm.color" />
            <div class="preset-colors">
              <div
                v-for="color in presetColors"
                :key="color"
                class="color-option"
                :style="{ backgroundColor: color }"
                :class="{ 'selected': groupForm.color === color }"
                @click="groupForm.color = color"
              />
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="分组描述">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            placeholder="请输入分组描述（可选）"
            :rows="3"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="预览">
          <div class="group-preview">
            <el-icon :color="groupForm.color" :size="20">
              <component :is="getIconComponent(groupForm.icon)" />
            </el-icon>
            <span>{{ groupForm.name || '分组预览' }}</span>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="groupDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="submitGroupForm"
            :loading="submitting"
          >
            {{ isEditingGroup ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus, Search, MoreFilled, Star, Heart, Bookmark, Flag, Folder,
  Picture, VideoPlay, Document, Headphones, Box
} from '@element-plus/icons-vue';
import {
  getFavoriteGroups,
  createFavoriteGroup,
  updateFavoriteGroup,
  deleteFavoriteGroup
} from '@/utils/fileManagerAPI';
import { FavoriteGroup, FAVORITE_ICONS, TAG_COLORS } from '@/models/fileManagerModels';
import FavoriteFileList from './FavoriteFileList.vue';

// 响应式数据
const favoriteGroups = ref([]);
const activeGroupId = ref('');
const searchQuery = ref('');
const loading = ref(false);
const groupDialogVisible = ref(false);
const isEditingGroup = ref(false);
const submitting = ref(false);
const groupFormRef = ref(null);

// 表单数据
const groupForm = reactive({
  id: '',
  name: '',
  icon: 'star',
  color: '#67C23A',
  description: ''
});

// 表单验证规则
const groupFormRules = {
  name: [
    { required: true, message: '请输入分组名称', trigger: 'blur' },
    { min: 1, max: 20, message: '分组名称长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择分组图标', trigger: 'change' }
  ],
  color: [
    { required: true, message: '请选择分组颜色', trigger: 'change' }
  ]
};

// 可用图标和颜色
const availableIcons = FAVORITE_ICONS;
const presetColors = TAG_COLORS;

// 图标组件映射
const iconComponents = {
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  folder: Folder,
  image: Picture,
  video: VideoPlay,
  document: Document,
  music: Headphones,
  archive: Box
};

// 计算属性
const activeGroup = computed(() => {
  return favoriteGroups.value.find(group => group.id === activeGroupId.value);
});

// 方法
const loadFavoriteGroups = async () => {
  loading.value = true;
  try {
    const result = await getFavoriteGroups();
    favoriteGroups.value = result.map(groupData => FavoriteGroup.fromJSON(groupData));
    
    // 如果没有选中的分组且有分组存在，选中第一个
    if (!activeGroupId.value && favoriteGroups.value.length > 0) {
      activeGroupId.value = favoriteGroups.value[0].id;
    }
  } catch (error) {
    console.error('Load favorite groups failed:', error);
  } finally {
    loading.value = false;
  }
};

const selectGroup = (groupId) => {
  activeGroupId.value = groupId;
};

const showCreateGroupDialog = () => {
  isEditingGroup.value = false;
  resetGroupForm();
  groupDialogVisible.value = true;
};

const editGroup = (group) => {
  isEditingGroup.value = true;
  groupForm.id = group.id;
  groupForm.name = group.name;
  groupForm.icon = group.icon;
  groupForm.color = group.color;
  groupForm.description = group.description;
  groupDialogVisible.value = true;
};

const resetGroupForm = () => {
  groupForm.id = '';
  groupForm.name = '';
  groupForm.icon = 'star';
  groupForm.color = '#67C23A';
  groupForm.description = '';
  if (groupFormRef.value) {
    groupFormRef.value.resetFields();
  }
};

const submitGroupForm = async () => {
  if (!groupFormRef.value) return;
  
  try {
    await groupFormRef.value.validate();
    submitting.value = true;
    
    const groupData = {
      name: groupForm.name,
      icon: groupForm.icon,
      color: groupForm.color,
      description: groupForm.description
    };
    
    let success = false;
    if (isEditingGroup.value) {
      success = await updateFavoriteGroup(groupForm.id, groupData);
    } else {
      const newGroup = await createFavoriteGroup(groupData);
      success = !!newGroup;
    }
    
    if (success) {
      groupDialogVisible.value = false;
      await loadFavoriteGroups();
    }
  } catch (error) {
    console.error('Submit group form failed:', error);
  } finally {
    submitting.value = false;
  }
};

const handleGroupAction = async (command) => {
  const [action, groupId] = command.split(':');
  const group = favoriteGroups.value.find(g => g.id === groupId);
  
  if (!group) return;
  
  if (action === 'edit') {
    editGroup(group);
  } else if (action === 'delete') {
    await deleteGroup(group);
  }
};

const deleteGroup = async (group) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分组 "${group.name}" 吗？这将移除该分组中的所有收藏文件。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const success = await deleteFavoriteGroup(group.id);
    if (success) {
      if (activeGroupId.value === group.id) {
        activeGroupId.value = '';
      }
      await loadFavoriteGroups();
    }
  } catch {
    // 用户取消
  }
};

const handleFileRemoved = () => {
  // 文件被移除后，重新加载分组信息以更新文件计数
  loadFavoriteGroups();
};

const handleFilesUpdated = () => {
  // 文件列表更新后，重新加载分组信息
  loadFavoriteGroups();
};

const getIconComponent = (iconName) => {
  return iconComponents[iconName] || Star;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

// 生命周期
onMounted(() => {
  loadFavoriteGroups();
});

// 暴露给父组件的方法
defineExpose({
  loadFavoriteGroups,
  activeGroupId: computed(() => activeGroupId.value),
  selectGroup
});
</script>

<style scoped>
.favorite-manager {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.favorite-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h3 {
  margin: 0;
  color: #303133;
}

.group-count {
  color: #909399;
  font-size: 14px;
  margin-left: 10px;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.group-card {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.group-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.group-card.active {
  border-color: #409EFF;
  background-color: #F0F9FF;
}

.group-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.group-info {
  flex: 1;
}

.group-name {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 16px;
}

.group-description {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

.group-stats {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}

.stat-value {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

.favorite-files {
  border-top: 1px solid #EBEEF5;
  padding-top: 20px;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.files-header h4 {
  margin: 0;
  color: #303133;
}

.icon-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.icon-option {
  width: 40px;
  height: 40px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.icon-option:hover,
.icon-option.selected {
  border-color: #409EFF;
  background-color: #F0F9FF;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.preset-colors {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.color-option:hover,
.color-option.selected {
  border-color: #409EFF;
  transform: scale(1.1);
}

.group-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  background: #F5F7FA;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.danger {
  color: #F56C6C;
}
</style>
