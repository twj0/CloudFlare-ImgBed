import axios from 'axios';
import { ElMessage } from 'element-plus';

/**
 * 创建一个新目录
 * @param {string} currentPath - 当前所在的路径
 * @param {string} newDirName - 新目录的名称
 * @returns {Promise<boolean>} - 是否创建成功
 */
export async function createDirectory(currentPath, newDirName) {
  if (!newDirName) {
    ElMessage.warning('文件夹名称不能为空');
    return false;
  }

  // 构造新目录的完整路径
  const fullPath = currentPath ? `${currentPath}/${newDirName}` : newDirName;

  // 创建一个空的占位符文件
  const placeholder = new Blob([''], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', placeholder, '.placeholder');

  try {
    const response = await axios.post(`/api/upload?uploadFolder=${encodeURIComponent(fullPath)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 200) {
      ElMessage.success(`文件夹 "${newDirName}" 创建成功`);
      return true;
    } else {
      throw new Error(response.data.error || '创建失败');
    }
  } catch (error) {
    console.error('Create directory failed:', error);
    ElMessage.error(`创建文件夹失败: ${error.message}`);
    return false;
  }
}

/**
 * 重命名文件或文件夹
 * @param {string} fileId - 文件ID
 * @param {string} newName - 新名称
 * @returns {Promise<boolean>} - 是否重命名成功
 */
export async function renameFile(fileId, newName) {
  if (!newName || !newName.trim()) {
    ElMessage.error('新名称不能为空');
    return false;
  }

  try {
    const encodedPath = fileId.split('/').map(part => encodeURIComponent(part)).join(',');
    const response = await axios.post(`/api/manage/rename/${encodedPath}`, {
      newName: newName.trim()
    });

    if (response.data.success) {
      ElMessage.success('重命名成功');
      return true;
    } else {
      throw new Error(response.data.error || '重命名失败');
    }
  } catch (error) {
    console.error('Rename file failed:', error);
    ElMessage.error(`重命名失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * 删除文件
 * @param {string} fileId - 文件ID
 * @returns {Promise<boolean>} - 是否删除成功
 */
export async function deleteFile(fileId) {
  try {
    const encodedPath = fileId.split('/').map(part => encodeURIComponent(part)).join(',');
    const response = await axios.delete(`/api/manage/delete/${encodedPath}`);

    if (response.data.success) {
      ElMessage.success('文件删除成功');
      return true;
    } else {
      throw new Error(response.data.error || '删除失败');
    }
  } catch (error) {
    console.error('Delete file failed:', error);
    ElMessage.error(`删除文件失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * 移动文件
 * @param {string} fileId - 文件ID
 * @param {string} targetPath - 目标路径
 * @returns {Promise<boolean>} - 是否移动成功
 */
export async function moveFile(fileId, targetPath) {
  try {
    const encodedPath = fileId.split('/').map(part => encodeURIComponent(part)).join(',');
    const response = await axios.post(`/api/manage/move/${encodedPath}?dist=${encodeURIComponent(targetPath)}`);

    if (response.data.success) {
      ElMessage.success('文件移动成功');
      return true;
    } else {
      throw new Error(response.data.error || '移动失败');
    }
  } catch (error) {
    console.error('Move file failed:', error);
    ElMessage.error(`移动文件失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * 批量操作文件
 * @param {string} action - 操作类型 ('delete', 'move', 'copy')
 * @param {Array} files - 文件ID数组
 * @param {string} targetPath - 目标路径（移动和复制操作需要）
 * @returns {Promise<Object>} - 操作结果
 */
export async function batchOperation(action, files, targetPath = null) {
  if (!files || files.length === 0) {
    ElMessage.error('请选择要操作的文件');
    return { success: false };
  }

  try {
    const response = await axios.post('/api/manage/batch', {
      action,
      files,
      targetPath
    });

    const result = response.data;

    if (result.success) {
      ElMessage.success(`批量${getActionName(action)}成功，处理了 ${result.processed} 个文件`);
    } else {
      ElMessage.error(`批量${getActionName(action)}失败，成功 ${result.processed} 个，失败 ${result.failed} 个`);
    }

    return result;
  } catch (error) {
    console.error('Batch operation failed:', error);
    ElMessage.error(`批量${getActionName(action)}失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 搜索文件
 * @param {Object} options - 搜索选项
 * @returns {Promise<Object>} - 搜索结果
 */
export async function searchFiles(options = {}) {
  const {
    query = '',
    type = 'all',
    dir = '',
    start = 0,
    count = 50,
    sortBy = 'name',
    sortOrder = 'asc',
    channel = '',
    listType = '',
    recursive = false
  } = options;

  if (!query.trim()) {
    ElMessage.error('请输入搜索关键词');
    return { success: false };
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      type,
      dir,
      start: start.toString(),
      count: count.toString(),
      sortBy,
      sortOrder,
      channel,
      listType,
      recursive: recursive.toString()
    });

    const response = await axios.get(`/api/manage/search?${params}`);
    return response.data;
  } catch (error) {
    console.error('Search failed:', error);
    ElMessage.error(`搜索失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

// 辅助函数
function getActionName(action) {
  const actionNames = {
    'delete': '删除',
    'move': '移动',
    'copy': '复制'
  };
  return actionNames[action] || action;
}

// ==================== 标签系统 API ====================

/**
 * 获取所有标签
 * @returns {Promise<Array>} 标签列表
 */
export async function getTags() {
  try {
    const response = await axios.get('/api/manage/tags');
    return response.data.success ? response.data.tags : [];
  } catch (error) {
    console.error('Get tags failed:', error);
    ElMessage.error(`获取标签失败: ${error.response?.data?.error || error.message}`);
    return [];
  }
}

/**
 * 创建新标签
 * @param {Object} tagData - 标签数据
 * @param {string} tagData.name - 标签名称
 * @param {string} tagData.color - 标签颜色
 * @param {string} tagData.description - 标签描述
 * @returns {Promise<Object|null>} 创建的标签对象或null
 */
export async function createTag(tagData) {
  try {
    const response = await axios.post('/api/manage/tags', tagData);
    if (response.data.success) {
      ElMessage.success('标签创建成功');
      return response.data.tag;
    } else {
      throw new Error(response.data.error || '创建失败');
    }
  } catch (error) {
    console.error('Create tag failed:', error);
    ElMessage.error(`创建标签失败: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

/**
 * 更新标签
 * @param {string} tagId - 标签ID
 * @param {Object} tagData - 更新的标签数据
 * @returns {Promise<boolean>} 是否更新成功
 */
export async function updateTag(tagId, tagData) {
  try {
    const response = await axios.put(`/api/manage/tags/${tagId}`, tagData);
    if (response.data.success) {
      ElMessage.success('标签更新成功');
      return true;
    } else {
      throw new Error(response.data.error || '更新失败');
    }
  } catch (error) {
    console.error('Update tag failed:', error);
    ElMessage.error(`更新标签失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * 删除标签
 * @param {string} tagId - 标签ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteTag(tagId) {
  try {
    const response = await axios.delete(`/api/manage/tags/${tagId}`);
    if (response.data.success) {
      ElMessage.success('标签删除成功');
      return true;
    } else {
      throw new Error(response.data.error || '删除失败');
    }
  } catch (error) {
    console.error('Delete tag failed:', error);
    ElMessage.error(`删除标签失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * 为文件添加标签
 * @param {string} fileId - 文件ID
 * @param {Array<string>} tagIds - 标签ID数组
 * @returns {Promise<boolean>} 是否添加成功
 */
export async function addFileTags(fileId, tagIds) {
  try {
    const encodedPath = fileId.split('/').map(part => encodeURIComponent(part)).join(',');
    const response = await axios.post(`/api/manage/files/${encodedPath}/tags`, { tagIds });
    if (response.data.success) {
      ElMessage.success('标签添加成功');
      return true;
    } else {
      throw new Error(response.data.error || '添加失败');
    }
  } catch (error) {
    console.error('Add file tags failed:', error);
    ElMessage.error(`添加标签失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * 移除文件标签
 * @param {string} fileId - 文件ID
 * @param {Array<string>} tagIds - 标签ID数组
 * @returns {Promise<boolean>} 是否移除成功
 */
export async function removeFileTags(fileId, tagIds) {
  try {
    const encodedPath = fileId.split('/').map(part => encodeURIComponent(part)).join(',');
    const response = await axios.delete(`/api/manage/files/${encodedPath}/tags`, { data: { tagIds } });
    if (response.data.success) {
      ElMessage.success('标签移除成功');
      return true;
    } else {
      throw new Error(response.data.error || '移除失败');
    }
  } catch (error) {
    console.error('Remove file tags failed:', error);
    ElMessage.error(`移除标签失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * 按标签搜索文件
 * @param {Array<string>} tagIds - 标签ID数组
 * @param {Object} options - 搜索选项
 * @returns {Promise<Object>} 搜索结果
 */
export async function searchFilesByTags(tagIds, options = {}) {
  try {
    const params = new URLSearchParams({
      tags: tagIds.join(','),
      dir: options.dir || '',
      start: (options.start || 0).toString(),
      count: (options.count || 50).toString(),
      sortBy: options.sortBy || 'name',
      sortOrder: options.sortOrder || 'asc'
    });

    const response = await axios.get(`/api/manage/search/tags?${params}`);
    return response.data;
  } catch (error) {
    console.error('Search files by tags failed:', error);
    ElMessage.error(`按标签搜索失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

// ==================== 收藏夹系统 API ====================

/**
 * 获取收藏夹列表
 * @returns {Promise<Array>} 收藏夹列表
 */
export async function getFavoriteGroups() {
  try {
    const response = await axios.get('/api/manage/favorites/groups');
    return response.data.success ? response.data.groups : [];
  } catch (error) {
    console.error('Get favorite groups failed:', error);
    ElMessage.error(`获取收藏夹失败: ${error.response?.data?.error || error.message}`);
    return [];
  }
}

/**
 * 创建收藏夹分组
 * @param {Object} groupData - 分组数据
 * @param {string} groupData.name - 分组名称
 * @param {string} groupData.description - 分组描述
 * @param {string} groupData.color - 分组颜色
 * @returns {Promise<Object|null>} 创建的分组对象或null
 */
export async function createFavoriteGroup(groupData) {
  try {
    const response = await axios.post('/api/manage/favorites/groups', groupData);
    if (response.data.success) {
      ElMessage.success('收藏夹分组创建成功');
      return response.data.group;
    } else {
      throw new Error(response.data.error || '创建失败');
    }
  } catch (error) {
    console.error('Create favorite group failed:', error);
    ElMessage.error(`创建收藏夹分组失败: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

/**
 * 添加文件到收藏夹
 * @param {string} fileId - 文件ID
 * @param {string} groupId - 分组ID（可选，默认为"default"）
 * @returns {Promise<boolean>} 是否添加成功
 */
export async function addToFavorites(fileId, groupId = 'default') {
  try {
    const encodedPath = fileId.split('/').map(part => encodeURIComponent(part)).join(',');
    const response = await axios.post(`/api/manage/favorites`, {
      fileId: encodedPath,
      groupId
    });
    if (response.data.success) {
      ElMessage.success('已添加到收藏夹');
      return true;
    } else {
      throw new Error(response.data.error || '添加失败');
    }
  } catch (error) {
    console.error('Add to favorites failed:', error);
    ElMessage.error(`添加到收藏夹失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * 从收藏夹移除文件
 * @param {string} fileId - 文件ID
 * @param {string} groupId - 分组ID（可选）
 * @returns {Promise<boolean>} 是否移除成功
 */
export async function removeFromFavorites(fileId, groupId = null) {
  try {
    const encodedPath = fileId.split('/').map(part => encodeURIComponent(part)).join(',');
    const params = groupId ? `?groupId=${groupId}` : '';
    const response = await axios.delete(`/api/manage/favorites/${encodedPath}${params}`);
    if (response.data.success) {
      ElMessage.success('已从收藏夹移除');
      return true;
    } else {
      throw new Error(response.data.error || '移除失败');
    }
  } catch (error) {
    console.error('Remove from favorites failed:', error);
    ElMessage.error(`从收藏夹移除失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * 获取收藏的文件列表
 * @param {string} groupId - 分组ID（可选）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 收藏文件列表
 */
export async function getFavoriteFiles(groupId = null, options = {}) {
  try {
    const params = new URLSearchParams({
      start: (options.start || 0).toString(),
      count: (options.count || 50).toString(),
      sortBy: options.sortBy || 'addedAt',
      sortOrder: options.sortOrder || 'desc'
    });

    if (groupId) {
      params.append('groupId', groupId);
    }

    const response = await axios.get(`/api/manage/favorites?${params}`);
    return response.data;
  } catch (error) {
    console.error('Get favorite files failed:', error);
    ElMessage.error(`获取收藏文件失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

// ==================== 文件版本历史 API ====================

/**
 * 获取文件版本历史
 * @param {string} fileId - 文件ID
 * @returns {Promise<Array>} 版本历史列表
 */
export async function getFileVersions(fileId) {
  try {
    const encodedPath = fileId.split('/').map(part => encodeURIComponent(part)).join(',');
    const response = await axios.get(`/api/manage/files/${encodedPath}/versions`);
    return response.data.success ? response.data.versions : [];
  } catch (error) {
    console.error('Get file versions failed:', error);
    ElMessage.error(`获取版本历史失败: ${error.response?.data?.error || error.message}`);
    return [];
  }
}

/**
 * 恢复文件到指定版本
 * @param {string} fileId - 文件ID
 * @param {string} versionId - 版本ID
 * @returns {Promise<boolean>} 是否恢复成功
 */
export async function restoreFileVersion(fileId, versionId) {
  try {
    const encodedPath = fileId.split('/').map(part => encodeURIComponent(part)).join(',');
    const response = await axios.post(`/api/manage/files/${encodedPath}/versions/${versionId}/restore`);
    if (response.data.success) {
      ElMessage.success('文件版本恢复成功');
      return true;
    } else {
      throw new Error(response.data.error || '恢复失败');
    }
  } catch (error) {
    console.error('Restore file version failed:', error);
    ElMessage.error(`恢复文件版本失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// ==================== 文件统计分析 API ====================

/**
 * 获取文件使用统计
 * @param {Object} options - 统计选项
 * @returns {Promise<Object>} 统计数据
 */
export async function getFileStats(options = {}) {
  try {
    const params = new URLSearchParams({
      period: options.period || '7d', // 7d, 30d, 90d, 1y
      type: options.type || 'all', // all, images, documents, videos, etc.
      groupBy: options.groupBy || 'day' // day, week, month
    });

    const response = await axios.get(`/api/manage/stats/files?${params}`);
    return response.data;
  } catch (error) {
    console.error('Get file stats failed:', error);
    ElMessage.error(`获取文件统计失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 获取存储使用情况
 * @returns {Promise<Object>} 存储使用情况
 */
export async function getStorageUsage() {
  try {
    const response = await axios.get('/api/manage/stats/storage');
    return response.data;
  } catch (error) {
    console.error('Get storage usage failed:', error);
    ElMessage.error(`获取存储使用情况失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 获取热门文件排行
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 热门文件列表
 */
export async function getPopularFiles(options = {}) {
  try {
    const params = new URLSearchParams({
      period: options.period || '7d',
      limit: (options.limit || 20).toString(),
      sortBy: options.sortBy || 'views' // views, downloads, shares
    });

    const response = await axios.get(`/api/manage/stats/popular?${params}`);
    return response.data;
  } catch (error) {
    console.error('Get popular files failed:', error);
    ElMessage.error(`获取热门文件失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

// ==================== 批量操作增强 API ====================

/**
 * 批量添加标签
 * @param {Array<string>} fileIds - 文件ID数组
 * @param {Array<string>} tagIds - 标签ID数组
 * @returns {Promise<Object>} 操作结果
 */
export async function batchAddTags(fileIds, tagIds) {
  try {
    const encodedPaths = fileIds.map(id =>
      id.split('/').map(part => encodeURIComponent(part)).join(',')
    );
    const response = await axios.post('/api/manage/batch/tags/add', {
      fileIds: encodedPaths,
      tagIds
    });

    if (response.data.success) {
      ElMessage.success(`成功为 ${response.data.successCount} 个文件添加标签`);
      return response.data;
    } else {
      throw new Error(response.data.error || '批量添加标签失败');
    }
  } catch (error) {
    console.error('Batch add tags failed:', error);
    ElMessage.error(`批量添加标签失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 批量添加到收藏夹
 * @param {Array<string>} fileIds - 文件ID数组
 * @param {string} groupId - 分组ID
 * @returns {Promise<Object>} 操作结果
 */
export async function batchAddToFavorites(fileIds, groupId = 'default') {
  try {
    const encodedPaths = fileIds.map(id =>
      id.split('/').map(part => encodeURIComponent(part)).join(',')
    );
    const response = await axios.post('/api/manage/batch/favorites/add', {
      fileIds: encodedPaths,
      groupId
    });

    if (response.data.success) {
      ElMessage.success(`成功将 ${response.data.successCount} 个文件添加到收藏夹`);
      return response.data;
    } else {
      throw new Error(response.data.error || '批量添加到收藏夹失败');
    }
  } catch (error) {
    console.error('Batch add to favorites failed:', error);
    ElMessage.error(`批量添加到收藏夹失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 批量移除标签
 * @param {Array<string>} fileIds - 文件ID数组
 * @param {Array<string>} tagIds - 标签ID数组
 * @returns {Promise<Object>} 操作结果
 */
export async function batchRemoveTags(fileIds, tagIds) {
  try {
    const encodedPaths = fileIds.map(id =>
      id.split('/').map(part => encodeURIComponent(part)).join(',')
    );
    const response = await axios.post('/api/manage/batch/tags/remove', {
      fileIds: encodedPaths,
      tagIds
    });

    if (response.data.success) {
      ElMessage.success(`成功为 ${response.data.successCount} 个文件移除标签`);
      return response.data;
    } else {
      throw new Error(response.data.error || '批量移除标签失败');
    }
  } catch (error) {
    console.error('Batch remove tags failed:', error);
    ElMessage.error(`批量移除标签失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 批量从收藏夹移除
 * @param {Array<string>} fileIds - 文件ID数组
 * @param {string} groupId - 分组ID（可选）
 * @returns {Promise<Object>} 操作结果
 */
export async function batchRemoveFromFavorites(fileIds, groupId = null) {
  try {
    const encodedPaths = fileIds.map(id =>
      id.split('/').map(part => encodeURIComponent(part)).join(',')
    );
    const data = { fileIds: encodedPaths };
    if (groupId) data.groupId = groupId;

    const response = await axios.post('/api/manage/batch/favorites/remove', data);

    if (response.data.success) {
      ElMessage.success(`成功将 ${response.data.successCount} 个文件从收藏夹移除`);
      return response.data;
    } else {
      throw new Error(response.data.error || '批量移除收藏失败');
    }
  } catch (error) {
    console.error('Batch remove from favorites failed:', error);
    ElMessage.error(`批量移除收藏失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 批量复制文件
 * @param {Array<string>} fileIds - 文件ID数组
 * @param {string} targetPath - 目标路径
 * @returns {Promise<Object>} 操作结果
 */
export async function batchCopyFiles(fileIds, targetPath) {
  try {
    const encodedPaths = fileIds.map(id =>
      id.split('/').map(part => encodeURIComponent(part)).join(',')
    );
    const response = await axios.post('/api/manage/batch/copy', {
      fileIds: encodedPaths,
      targetPath: encodeURIComponent(targetPath)
    });

    if (response.data.success) {
      ElMessage.success(`成功复制 ${response.data.successCount} 个文件`);
      return response.data;
    } else {
      throw new Error(response.data.error || '批量复制失败');
    }
  } catch (error) {
    console.error('Batch copy files failed:', error);
    ElMessage.error(`批量复制失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 批量重命名文件
 * @param {Array<Object>} renameList - 重命名列表 [{fileId, newName}, ...]
 * @returns {Promise<Object>} 操作结果
 */
export async function batchRenameFiles(renameList) {
  try {
    const encodedList = renameList.map(item => ({
      fileId: item.fileId.split('/').map(part => encodeURIComponent(part)).join(','),
      newName: item.newName
    }));

    const response = await axios.post('/api/manage/batch/rename', {
      renameList: encodedList
    });

    if (response.data.success) {
      ElMessage.success(`成功重命名 ${response.data.successCount} 个文件`);
      return response.data;
    } else {
      throw new Error(response.data.error || '批量重命名失败');
    }
  } catch (error) {
    console.error('Batch rename files failed:', error);
    ElMessage.error(`批量重命名失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 批量设置文件权限
 * @param {Array<string>} fileIds - 文件ID数组
 * @param {string} permission - 权限设置 ('public', 'private', 'protected')
 * @returns {Promise<Object>} 操作结果
 */
export async function batchSetPermissions(fileIds, permission) {
  try {
    const encodedPaths = fileIds.map(id =>
      id.split('/').map(part => encodeURIComponent(part)).join(',')
    );
    const response = await axios.post('/api/manage/batch/permissions', {
      fileIds: encodedPaths,
      permission
    });

    if (response.data.success) {
      ElMessage.success(`成功设置 ${response.data.successCount} 个文件的权限`);
      return response.data;
    } else {
      throw new Error(response.data.error || '批量设置权限失败');
    }
  } catch (error) {
    console.error('Batch set permissions failed:', error);
    ElMessage.error(`批量设置权限失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 批量压缩文件
 * @param {Array<string>} fileIds - 文件ID数组
 * @param {string} archiveName - 压缩包名称
 * @param {string} format - 压缩格式 ('zip', 'tar', 'tar.gz')
 * @returns {Promise<Object>} 操作结果
 */
export async function batchCompressFiles(fileIds, archiveName, format = 'zip') {
  try {
    const encodedPaths = fileIds.map(id =>
      id.split('/').map(part => encodeURIComponent(part)).join(',')
    );
    const response = await axios.post('/api/manage/batch/compress', {
      fileIds: encodedPaths,
      archiveName,
      format
    });

    if (response.data.success) {
      ElMessage.success(`压缩包创建成功: ${archiveName}`);
      return response.data;
    } else {
      throw new Error(response.data.error || '批量压缩失败');
    }
  } catch (error) {
    console.error('Batch compress files failed:', error);
    ElMessage.error(`批量压缩失败: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}