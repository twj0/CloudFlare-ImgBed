/**
 * 文件管理器数据模型定义
 * 定义标签系统、收藏夹、版本历史等功能的数据结构
 */

// ==================== 标签系统数据模型 ====================

/**
 * 标签数据模型
 */
export class Tag {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.color = data.color || '#409EFF';
    this.description = data.description || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.fileCount = data.fileCount || 0; // 使用此标签的文件数量
  }

  generateId() {
    return 'tag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      fileCount: this.fileCount
    };
  }

  static fromJSON(data) {
    return new Tag(data);
  }
}

/**
 * 文件标签关联数据模型
 */
export class FileTag {
  constructor(data = {}) {
    this.fileId = data.fileId || '';
    this.tagId = data.tagId || '';
    this.addedAt = data.addedAt || new Date().toISOString();
    this.addedBy = data.addedBy || 'system';
  }

  toJSON() {
    return {
      fileId: this.fileId,
      tagId: this.tagId,
      addedAt: this.addedAt,
      addedBy: this.addedBy
    };
  }

  static fromJSON(data) {
    return new FileTag(data);
  }
}

// ==================== 收藏夹系统数据模型 ====================

/**
 * 收藏夹分组数据模型
 */
export class FavoriteGroup {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.color = data.color || '#67C23A';
    this.icon = data.icon || 'star';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.fileCount = data.fileCount || 0;
    this.isDefault = data.isDefault || false;
  }

  generateId() {
    return 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      color: this.color,
      icon: this.icon,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      fileCount: this.fileCount,
      isDefault: this.isDefault
    };
  }

  static fromJSON(data) {
    return new FavoriteGroup(data);
  }
}

/**
 * 收藏文件数据模型
 */
export class FavoriteFile {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.fileId = data.fileId || '';
    this.groupId = data.groupId || 'default';
    this.addedAt = data.addedAt || new Date().toISOString();
    this.addedBy = data.addedBy || 'system';
    this.note = data.note || ''; // 收藏备注
  }

  generateId() {
    return 'fav_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  toJSON() {
    return {
      id: this.id,
      fileId: this.fileId,
      groupId: this.groupId,
      addedAt: this.addedAt,
      addedBy: this.addedBy,
      note: this.note
    };
  }

  static fromJSON(data) {
    return new FavoriteFile(data);
  }
}

// ==================== 文件版本历史数据模型 ====================

/**
 * 文件版本数据模型
 */
export class FileVersion {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.fileId = data.fileId || '';
    this.versionNumber = data.versionNumber || 1;
    this.fileName = data.fileName || '';
    this.fileSize = data.fileSize || 0;
    this.fileType = data.fileType || '';
    this.checksum = data.checksum || ''; // 文件校验和
    this.storageKey = data.storageKey || ''; // 存储键
    this.createdAt = data.createdAt || new Date().toISOString();
    this.createdBy = data.createdBy || 'system';
    this.changeNote = data.changeNote || ''; // 版本变更说明
    this.isActive = data.isActive || false; // 是否为当前活跃版本
  }

  generateId() {
    return 'ver_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  toJSON() {
    return {
      id: this.id,
      fileId: this.fileId,
      versionNumber: this.versionNumber,
      fileName: this.fileName,
      fileSize: this.fileSize,
      fileType: this.fileType,
      checksum: this.checksum,
      storageKey: this.storageKey,
      createdAt: this.createdAt,
      createdBy: this.createdBy,
      changeNote: this.changeNote,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    return new FileVersion(data);
  }
}

// ==================== 文件统计数据模型 ====================

/**
 * 文件访问记录数据模型
 */
export class FileAccessLog {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.fileId = data.fileId || '';
    this.accessType = data.accessType || 'view'; // view, download, share
    this.accessTime = data.accessTime || new Date().toISOString();
    this.userAgent = data.userAgent || '';
    this.ipAddress = data.ipAddress || '';
    this.referer = data.referer || '';
  }

  generateId() {
    return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  toJSON() {
    return {
      id: this.id,
      fileId: this.fileId,
      accessType: this.accessType,
      accessTime: this.accessTime,
      userAgent: this.userAgent,
      ipAddress: this.ipAddress,
      referer: this.referer
    };
  }

  static fromJSON(data) {
    return new FileAccessLog(data);
  }
}

/**
 * 文件统计数据模型
 */
export class FileStats {
  constructor(data = {}) {
    this.fileId = data.fileId || '';
    this.viewCount = data.viewCount || 0;
    this.downloadCount = data.downloadCount || 0;
    this.shareCount = data.shareCount || 0;
    this.lastAccessed = data.lastAccessed || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  toJSON() {
    return {
      fileId: this.fileId,
      viewCount: this.viewCount,
      downloadCount: this.downloadCount,
      shareCount: this.shareCount,
      lastAccessed: this.lastAccessed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(data) {
    return new FileStats(data);
  }
}

// ==================== 扩展的文件元数据模型 ====================

/**
 * 扩展的文件元数据模型
 * 在原有元数据基础上添加新功能相关字段
 */
export class ExtendedFileMetadata {
  constructor(data = {}) {
    // 原有字段
    this.FileName = data.FileName || '';
    this.FileType = data.FileType || '';
    this.FileSize = data.FileSize || '';
    this.UploadIP = data.UploadIP || '';
    this.UploadAddress = data.UploadAddress || '';
    this.ListType = data.ListType || 'None';
    this.TimeStamp = data.TimeStamp || '';
    this.Label = data.Label || 'None';
    this.Directory = data.Directory || '';
    
    // 新增字段
    this.tags = data.tags || []; // 标签ID数组
    this.isFavorite = data.isFavorite || false;
    this.favoriteGroups = data.favoriteGroups || []; // 收藏分组ID数组
    this.versionCount = data.versionCount || 1;
    this.currentVersion = data.currentVersion || 1;
    this.stats = data.stats || new FileStats({ fileId: this.FileName });
    this.customProperties = data.customProperties || {}; // 自定义属性
  }

  toJSON() {
    return {
      FileName: this.FileName,
      FileType: this.FileType,
      FileSize: this.FileSize,
      UploadIP: this.UploadIP,
      UploadAddress: this.UploadAddress,
      ListType: this.ListType,
      TimeStamp: this.TimeStamp,
      Label: this.Label,
      Directory: this.Directory,
      tags: this.tags,
      isFavorite: this.isFavorite,
      favoriteGroups: this.favoriteGroups,
      versionCount: this.versionCount,
      currentVersion: this.currentVersion,
      stats: this.stats.toJSON ? this.stats.toJSON() : this.stats,
      customProperties: this.customProperties
    };
  }

  static fromJSON(data) {
    const metadata = new ExtendedFileMetadata(data);
    if (data.stats && typeof data.stats === 'object') {
      metadata.stats = FileStats.fromJSON(data.stats);
    }
    return metadata;
  }
}

// ==================== 常量定义 ====================

export const TAG_COLORS = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export const FAVORITE_ICONS = [
  'star', 'heart', 'bookmark', 'flag', 'folder',
  'image', 'video', 'document', 'music', 'archive'
];

export const ACCESS_TYPES = {
  VIEW: 'view',
  DOWNLOAD: 'download',
  SHARE: 'share',
  PREVIEW: 'preview'
};

export const STATS_PERIODS = {
  WEEK: '7d',
  MONTH: '30d',
  QUARTER: '90d',
  YEAR: '1y'
};
