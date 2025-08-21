/**
 * 文件夹管理 API 工具类
 */

import axios from './axios'
import { ElMessage } from 'element-plus'

/**
 * 创建单个文件夹
 * @param {Object} folderData - 文件夹数据
 * @param {string} folderData.name - 文件夹名称
 * @param {string} folderData.path - 父路径
 * @param {string} folderData.description - 描述
 * @param {string} folderData.permissions - 权限
 * @param {Array} folderData.tags - 标签
 * @returns {Promise<Object>} 创建结果
 */
export async function createFolder(folderData) {
  try {
    const response = await axios.post('/manage/folders/create', folderData, {
      withAuthCode: true
    })
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } else {
      throw new Error(response.data.error || '创建文件夹失败')
    }
  } catch (error) {
    console.error('Create folder error:', error)
    const errorMessage = error.response?.data?.error || error.message || '创建文件夹失败'
    throw new Error(errorMessage)
  }
}

/**
 * 批量创建文件夹
 * @param {Array} folders - 文件夹列表
 * @param {string} path - 父路径
 * @returns {Promise<Object>} 批量创建结果
 */
export async function batchCreateFolders(folders, path = '/') {
  try {
    const response = await axios.post('/manage/folders/batch-create', {
      folders,
      path
    }, {
      withAuthCode: true
    })
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } else {
      throw new Error(response.data.error || '批量创建文件夹失败')
    }
  } catch (error) {
    console.error('Batch create folders error:', error)
    const errorMessage = error.response?.data?.error || error.message || '批量创建文件夹失败'
    throw new Error(errorMessage)
  }
}

/**
 * 获取文件夹信息
 * @param {string} folderPath - 文件夹路径
 * @returns {Promise<Object>} 文件夹信息
 */
export async function getFolderInfo(folderPath) {
  try {
    const response = await axios.get(`/manage/folders/info?path=${encodeURIComponent(folderPath)}`, {
      withAuthCode: true
    })
    
    if (response.data.success) {
      return response.data.data
    } else {
      throw new Error(response.data.error || '获取文件夹信息失败')
    }
  } catch (error) {
    console.error('Get folder info error:', error)
    throw new Error(error.response?.data?.error || error.message || '获取文件夹信息失败')
  }
}

/**
 * 重命名文件夹
 * @param {string} oldPath - 原路径
 * @param {string} newName - 新名称
 * @returns {Promise<Object>} 重命名结果
 */
export async function renameFolder(oldPath, newName) {
  try {
    const response = await axios.put('/manage/folders/rename', {
      oldPath,
      newName
    }, {
      withAuthCode: true
    })
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } else {
      throw new Error(response.data.error || '重命名文件夹失败')
    }
  } catch (error) {
    console.error('Rename folder error:', error)
    throw new Error(error.response?.data?.error || error.message || '重命名文件夹失败')
  }
}

/**
 * 删除文件夹
 * @param {string} folderPath - 文件夹路径
 * @param {boolean} recursive - 是否递归删除
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteFolder(folderPath, recursive = false) {
  try {
    const response = await axios.delete('/manage/folders/delete', {
      data: {
        path: folderPath,
        recursive
      },
      withAuthCode: true
    })
    
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message
      }
    } else {
      throw new Error(response.data.error || '删除文件夹失败')
    }
  } catch (error) {
    console.error('Delete folder error:', error)
    throw new Error(error.response?.data?.error || error.message || '删除文件夹失败')
  }
}

/**
 * 移动文件夹
 * @param {string} sourcePath - 源路径
 * @param {string} targetPath - 目标路径
 * @returns {Promise<Object>} 移动结果
 */
export async function moveFolder(sourcePath, targetPath) {
  try {
    const response = await axios.put('/manage/folders/move', {
      sourcePath,
      targetPath
    }, {
      withAuthCode: true
    })
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } else {
      throw new Error(response.data.error || '移动文件夹失败')
    }
  } catch (error) {
    console.error('Move folder error:', error)
    throw new Error(error.response?.data?.error || error.message || '移动文件夹失败')
  }
}

/**
 * 获取文件夹列表
 * @param {string} path - 路径
 * @param {Object} options - 选项
 * @returns {Promise<Array>} 文件夹列表
 */
export async function listFolders(path = '/', options = {}) {
  try {
    const params = new URLSearchParams({
      path,
      ...options
    })
    
    const response = await axios.get(`/manage/folders/list?${params}`, {
      withAuthCode: true
    })
    
    if (response.data.success) {
      return response.data.data
    } else {
      throw new Error(response.data.error || '获取文件夹列表失败')
    }
  } catch (error) {
    console.error('List folders error:', error)
    throw new Error(error.response?.data?.error || error.message || '获取文件夹列表失败')
  }
}

/**
 * 设置文件夹权限
 * @param {string} folderPath - 文件夹路径
 * @param {string} permissions - 权限设置
 * @returns {Promise<Object>} 设置结果
 */
export async function setFolderPermissions(folderPath, permissions) {
  try {
    const response = await axios.put('/manage/folders/permissions', {
      path: folderPath,
      permissions
    }, {
      withAuthCode: true
    })
    
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message
      }
    } else {
      throw new Error(response.data.error || '设置文件夹权限失败')
    }
  } catch (error) {
    console.error('Set folder permissions error:', error)
    throw new Error(error.response?.data?.error || error.message || '设置文件夹权限失败')
  }
}

/**
 * 文件夹操作工具类
 */
export class FolderManager {
  /**
   * 验证文件夹名称
   * @param {string} name - 文件夹名称
   * @returns {Object} 验证结果
   */
  static validateFolderName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: '文件夹名称不能为空' }
    }
    
    const trimmedName = name.trim()
    
    if (trimmedName.length === 0) {
      return { valid: false, error: '文件夹名称不能为空' }
    }
    
    if (trimmedName.length > 50) {
      return { valid: false, error: '文件夹名称不能超过50个字符' }
    }
    
    // 检查非法字符
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
    if (invalidChars.test(trimmedName)) {
      return { valid: false, error: '文件夹名称包含非法字符' }
    }
    
    // 检查保留名称
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
    if (reservedNames.includes(trimmedName.toUpperCase())) {
      return { valid: false, error: '文件夹名称不能使用系统保留名称' }
    }
    
    return { valid: true, name: trimmedName }
  }
  
  /**
   * 生成唯一文件夹名称
   * @param {string} baseName - 基础名称
   * @param {Array} existingNames - 现有名称列表
   * @returns {string} 唯一名称
   */
  static generateUniqueName(baseName, existingNames) {
    let uniqueName = baseName
    let counter = 1
    
    while (existingNames.includes(uniqueName)) {
      uniqueName = `${baseName} (${counter})`
      counter++
    }
    
    return uniqueName
  }
  
  /**
   * 格式化文件夹路径
   * @param {string} path - 路径
   * @returns {string} 格式化后的路径
   */
  static formatPath(path) {
    if (!path) return '/'
    
    // 确保路径以 / 开头
    if (!path.startsWith('/')) {
      path = '/' + path
    }
    
    // 移除重复的斜杠
    path = path.replace(/\/+/g, '/')
    
    // 移除末尾的斜杠（除非是根路径）
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1)
    }
    
    return path
  }
}
