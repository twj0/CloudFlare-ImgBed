// 模拟文件系统数据
const mockFileSystem = {
  '/': {
    type: 'folder',
    name: '根目录',
    path: '/',
    children: [
      {
        type: 'folder',
        name: '图片',
        path: '/images',
        size: 0,
        created: Date.now() - 86400000 * 7,
        modified: Date.now() - 86400000 * 2,
        hasChildren: true
      },
      {
        type: 'folder',
        name: '文档',
        path: '/documents',
        size: 0,
        created: Date.now() - 86400000 * 10,
        modified: Date.now() - 86400000 * 1,
        hasChildren: true
      },
      {
        type: 'folder',
        name: '视频',
        path: '/videos',
        size: 0,
        created: Date.now() - 86400000 * 5,
        modified: Date.now() - 86400000 * 3,
        hasChildren: true
      },
      {
        type: 'file',
        name: 'README.md',
        path: '/README.md',
        size: 1024,
        created: Date.now() - 86400000 * 1,
        modified: Date.now() - 86400000 * 1,
        url: '/static/readme/README.md'
      }
    ]
  },
  '/images': {
    type: 'folder',
    name: '图片',
    path: '/images',
    children: [
      {
        type: 'file',
        name: 'photo1.jpg',
        path: '/images/photo1.jpg',
        size: 2048576,
        created: Date.now() - 86400000 * 3,
        modified: Date.now() - 86400000 * 3,
        url: '/static/404.png',
        thumbnail: '/static/404.png',
        width: 1920,
        height: 1080
      },
      {
        type: 'file',
        name: 'photo2.png',
        path: '/images/photo2.png',
        size: 1536000,
        created: Date.now() - 86400000 * 2,
        modified: Date.now() - 86400000 * 2,
        url: '/static/404.png',
        thumbnail: '/static/404.png',
        width: 1280,
        height: 720
      },
      {
        type: 'folder',
        name: '相册',
        path: '/images/albums',
        size: 0,
        created: Date.now() - 86400000 * 5,
        modified: Date.now() - 86400000 * 1,
        hasChildren: true
      }
    ]
  },
  '/images/albums': {
    type: 'folder',
    name: '相册',
    path: '/images/albums',
    children: [
      {
        type: 'file',
        name: 'vacation.jpg',
        path: '/images/albums/vacation.jpg',
        size: 3145728,
        created: Date.now() - 86400000 * 1,
        modified: Date.now() - 86400000 * 1,
        url: '/static/404.png',
        thumbnail: '/static/404.png',
        width: 2560,
        height: 1440
      }
    ]
  },
  '/documents': {
    type: 'folder',
    name: '文档',
    path: '/documents',
    children: [
      {
        type: 'file',
        name: 'report.pdf',
        path: '/documents/report.pdf',
        size: 512000,
        created: Date.now() - 86400000 * 2,
        modified: Date.now() - 86400000 * 1,
        url: '#'
      },
      {
        type: 'file',
        name: 'notes.txt',
        path: '/documents/notes.txt',
        size: 2048,
        created: Date.now() - 86400000 * 1,
        modified: Date.now() - 86400000 * 1,
        url: '#'
      }
    ]
  },
  '/videos': {
    type: 'folder',
    name: '视频',
    path: '/videos',
    children: [
      {
        type: 'file',
        name: 'demo.mp4',
        path: '/videos/demo.mp4',
        size: 104857600,
        created: Date.now() - 86400000 * 3,
        modified: Date.now() - 86400000 * 3,
        url: '#'
      }
    ]
  }
}

// 模拟API延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟文件API
export const mockFileAPI = {
  // 获取文件列表
  async getFiles(path = '/') {
    await delay(300) // 模拟网络延迟
    
    const folder = mockFileSystem[path]
    if (!folder) {
      throw new Error(`Path not found: ${path}`)
    }
    
    return folder.children || []
  },

  // 获取文件夹树
  async getFolderTree() {
    await delay(200)
    
    const buildTree = (path) => {
      const folder = mockFileSystem[path]
      if (!folder || folder.type !== 'folder') return null
      
      return {
        ...folder,
        children: Object.keys(mockFileSystem)
          .filter(p => p.startsWith(path) && p !== path && p.split('/').length === path.split('/').length + 1)
          .map(buildTree)
          .filter(Boolean)
      }
    }
    
    return [buildTree('/')]
  },

  // 获取文件夹子项
  async getFolderChildren(path) {
    await delay(200)
    
    const children = Object.keys(mockFileSystem)
      .filter(p => {
        if (p === path) return false
        const parentPath = p.split('/').slice(0, -1).join('/') || '/'
        return parentPath === path
      })
      .map(p => {
        const item = mockFileSystem[p]
        return {
          type: 'folder',
          name: item.name,
          path: p,
          hasChildren: Object.keys(mockFileSystem).some(cp => cp.startsWith(p + '/'))
        }
      })
      .filter(item => item.type === 'folder')
    
    return children
  },

  // 获取最近访问的文件
  async getRecentItems() {
    await delay(100)
    
    // 从所有文件中随机选择一些作为最近访问
    const allFiles = []
    Object.values(mockFileSystem).forEach(folder => {
      if (folder.children) {
        folder.children.forEach(item => {
          if (item.type === 'file') {
            allFiles.push({
              ...item,
              lastAccessed: Date.now() - Math.random() * 86400000 * 7
            })
          }
        })
      }
    })
    
    return allFiles
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .slice(0, 10)
  },

  // 创建文件夹
  async createFolder(path, name) {
    await delay(500)
    
    const newPath = `${path}/${name}`.replace('//', '/')
    
    // 检查是否已存在
    if (mockFileSystem[newPath]) {
      throw new Error('文件夹已存在')
    }
    
    // 添加到模拟文件系统
    mockFileSystem[newPath] = {
      type: 'folder',
      name,
      path: newPath,
      children: [],
      created: Date.now(),
      modified: Date.now()
    }
    
    // 添加到父文件夹
    const parent = mockFileSystem[path]
    if (parent && parent.children) {
      parent.children.push({
        type: 'folder',
        name,
        path: newPath,
        size: 0,
        created: Date.now(),
        modified: Date.now(),
        hasChildren: false
      })
    }
    
    return true
  },

  // 删除项目
  async deleteItems(paths) {
    await delay(800)
    
    paths.forEach(path => {
      // 从模拟文件系统中删除
      delete mockFileSystem[path]
      
      // 从父文件夹中删除
      const parentPath = path.split('/').slice(0, -1).join('/') || '/'
      const parent = mockFileSystem[parentPath]
      if (parent && parent.children) {
        parent.children = parent.children.filter(item => item.path !== path)
      }
    })
    
    return true
  },

  // 重命名项目
  async renameItem(oldPath, newName) {
    await delay(600)
    
    const item = mockFileSystem[oldPath]
    if (!item) {
      throw new Error('文件不存在')
    }
    
    const parentPath = oldPath.split('/').slice(0, -1).join('/') || '/'
    const newPath = `${parentPath}/${newName}`.replace('//', '/')
    
    // 更新模拟文件系统
    mockFileSystem[newPath] = {
      ...item,
      name: newName,
      path: newPath,
      modified: Date.now()
    }
    delete mockFileSystem[oldPath]
    
    // 更新父文件夹
    const parent = mockFileSystem[parentPath]
    if (parent && parent.children) {
      const itemIndex = parent.children.findIndex(child => child.path === oldPath)
      if (itemIndex > -1) {
        parent.children[itemIndex] = {
          ...parent.children[itemIndex],
          name: newName,
          path: newPath,
          modified: Date.now()
        }
      }
    }
    
    return true
  }
}

// 拦截fetch请求并返回模拟数据
const originalFetch = window.fetch
window.fetch = function(url, options) {
  // 只拦截文件管理相关的API
  if (typeof url === 'string' && url.startsWith('/api/files')) {
    const urlObj = new URL(url, window.location.origin)
    const path = urlObj.searchParams.get('path') || '/'
    
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => mockFileAPI.getFiles(path)
    })
  }
  
  if (typeof url === 'string' && url.startsWith('/api/folders/tree')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => mockFileAPI.getFolderTree()
    })
  }
  
  if (typeof url === 'string' && url.startsWith('/api/folders/children')) {
    const urlObj = new URL(url, window.location.origin)
    const path = urlObj.searchParams.get('path') || '/'
    
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => mockFileAPI.getFolderChildren(path)
    })
  }
  
  if (typeof url === 'string' && url.startsWith('/api/files/recent')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => mockFileAPI.getRecentItems()
    })
  }
  
  // 对于其他请求，使用原始fetch
  return originalFetch.apply(this, arguments)
}
