/**
 * 网络连接工具类
 * 用于检测和处理网络相关问题
 */

// 检测网络连接状态
export function isOnline() {
  return navigator.onLine
}

// 检测API端点是否可达
export async function checkAPIHealth(baseURL = '') {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${baseURL}/api/manage/list?dir=/&count=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    return {
      healthy: response.status < 500,
      status: response.status,
      message: response.status < 500 ? 'API可用' : 'API服务器错误'
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        healthy: false,
        status: 0,
        message: 'API响应超时'
      }
    } else {
      return {
        healthy: false,
        status: 0,
        message: `API连接失败: ${error.message}`
      }
    }
  }
}

// 创建带有重试和超时控制的fetch函数
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const {
    timeout = 15000,
    retryDelay = 1000,
    ...fetchOptions
  } = options
  
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetch attempt ${attempt}/${maxRetries}: ${url}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log(`Request timeout after ${timeout}ms`)
        controller.abort()
      }, timeout)
      
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      console.log(`Fetch successful on attempt ${attempt}`)
      return response
      
    } catch (error) {
      lastError = error
      console.error(`Fetch attempt ${attempt} failed:`, error.message)
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        break
      }
      
      // 如果是致命错误（如CORS），不要重试
      if (error.name === 'TypeError' && error.message.includes('CORS')) {
        console.log('CORS error detected, not retrying')
        break
      }
      
      // 等待后重试
      const delay = retryDelay * Math.pow(2, attempt - 1) // 指数退避
      console.log(`Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// 网络状态监听器
export class NetworkMonitor {
  constructor() {
    this.listeners = []
    this.isOnline = navigator.onLine
    
    // 监听网络状态变化
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }
  
  handleOnline() {
    console.log('Network connection restored')
    this.isOnline = true
    this.notifyListeners('online')
  }
  
  handleOffline() {
    console.log('Network connection lost')
    this.isOnline = false
    this.notifyListeners('offline')
  }
  
  addListener(callback) {
    this.listeners.push(callback)
  }
  
  removeListener(callback) {
    const index = this.listeners.indexOf(callback)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }
  
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status, this.isOnline)
      } catch (error) {
        console.error('Error in network status listener:', error)
      }
    })
  }
  
  destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    this.listeners = []
  }
}

// 创建全局网络监听器实例
export const networkMonitor = new NetworkMonitor()

// 诊断网络问题的工具函数
export async function diagnoseNetworkIssue(apiURL = '') {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    browserOnline: navigator.onLine,
    userAgent: navigator.userAgent,
    issues: [],
    recommendations: []
  }
  
  // 检查基本网络连接
  if (!navigator.onLine) {
    diagnosis.issues.push('浏览器检测到网络离线')
    diagnosis.recommendations.push('请检查网络连接')
    return diagnosis
  }
  
  // 检查API健康状态
  try {
    const healthCheck = await checkAPIHealth(apiURL)
    diagnosis.apiHealth = healthCheck
    
    if (!healthCheck.healthy) {
      diagnosis.issues.push(`API不可用: ${healthCheck.message}`)
      diagnosis.recommendations.push('请检查服务器状态或稍后重试')
    }
  } catch (error) {
    diagnosis.issues.push(`API健康检查失败: ${error.message}`)
    diagnosis.recommendations.push('请检查API端点配置')
  }
  
  // 检查CORS问题
  try {
    await fetch(`${apiURL}/api/manage/list`, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin
      }
    })
  } catch (error) {
    if (error.message.includes('CORS')) {
      diagnosis.issues.push('CORS配置问题')
      diagnosis.recommendations.push('请检查服务器CORS设置')
    }
  }
  
  return diagnosis
}

// 导出便捷函数
export default {
  isOnline,
  checkAPIHealth,
  fetchWithRetry,
  NetworkMonitor,
  networkMonitor,
  diagnoseNetworkIssue
}
