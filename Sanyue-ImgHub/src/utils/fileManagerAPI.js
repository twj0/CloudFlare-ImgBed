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