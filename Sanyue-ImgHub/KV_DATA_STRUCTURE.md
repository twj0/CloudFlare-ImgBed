# Cloudflare KV 数据存储结构设计

## 概述

本文档定义了 CloudFlare ImgBed 文件资源管理器高级功能在 Cloudflare KV 中的数据存储结构。所有新功能的数据都使用统一的命名空间前缀 `manage@` 来避免与现有数据冲突。

## 1. 标签系统数据结构

### 1.1 标签索引
**键**: `manage@tags@index`
**值**: 
```json
{
  "tags": ["tag_id1", "tag_id2", "tag_id3"],
  "lastUpdated": "2025-01-18T10:00:00.000Z"
}
```

### 1.2 标签详细信息
**键**: `manage@tags@{tagId}`
**值**:
```json
{
  "id": "tag_1737280800_abc123def",
  "name": "重要文件",
  "color": "#F56C6C",
  "description": "标记为重要的文件",
  "createdAt": "2025-01-18T10:00:00.000Z",
  "updatedAt": "2025-01-18T10:00:00.000Z",
  "fileCount": 15
}
```

### 1.3 标签文件关联
**键**: `manage@tag_files@{tagId}`
**值**:
```json
{
  "files": [
    "uploads/image1.jpg",
    "documents/report.pdf",
    "videos/demo.mp4"
  ],
  "lastUpdated": "2025-01-18T10:00:00.000Z"
}
```

### 1.4 文件标签关联
**键**: `manage@file_tags@{filePath}`
**值**:
```json
{
  "tags": [
    "tag_1737280800_abc123def",
    "tag_1737280801_def456ghi"
  ],
  "lastUpdated": "2025-01-18T10:00:00.000Z"
}
```

## 2. 收藏夹系统数据结构

### 2.1 收藏夹分组索引
**键**: `manage@favorite_groups@index`
**值**:
```json
{
  "groups": ["default", "group_1737280800_xyz789", "group_1737280801_uvw456"],
  "lastUpdated": "2025-01-18T10:00:00.000Z"
}
```

### 2.2 收藏夹分组详细信息
**键**: `manage@favorite_groups@{groupId}`
**值**:
```json
{
  "id": "group_1737280800_xyz789",
  "name": "工作文件",
  "description": "工作相关的重要文件",
  "color": "#409EFF",
  "icon": "folder",
  "createdAt": "2025-01-18T10:00:00.000Z",
  "updatedAt": "2025-01-18T10:00:00.000Z",
  "fileCount": 8,
  "isDefault": false
}
```

### 2.3 分组收藏文件列表
**键**: `manage@favorite_files@{groupId}`
**值**:
```json
{
  "files": [
    {
      "id": "fav_1737280800_mno123",
      "fileId": "uploads/important.jpg",
      "groupId": "group_1737280800_xyz789",
      "addedAt": "2025-01-18T10:00:00.000Z",
      "note": "项目封面图"
    },
    {
      "id": "fav_1737280801_pqr456",
      "fileId": "documents/contract.pdf",
      "groupId": "group_1737280800_xyz789",
      "addedAt": "2025-01-18T10:05:00.000Z",
      "note": "重要合同文件"
    }
  ],
  "lastUpdated": "2025-01-18T10:05:00.000Z"
}
```

### 2.4 文件收藏状态
**键**: `manage@file_favorites@{filePath}`
**值**:
```json
{
  "favorites": [
    {
      "id": "fav_1737280800_mno123",
      "groupId": "group_1737280800_xyz789",
      "addedAt": "2025-01-18T10:00:00.000Z",
      "note": "项目封面图"
    },
    {
      "id": "fav_1737280802_stu789",
      "groupId": "default",
      "addedAt": "2025-01-18T10:10:00.000Z",
      "note": ""
    }
  ],
  "lastUpdated": "2025-01-18T10:10:00.000Z"
}
```

## 3. 文件版本历史数据结构

### 3.1 文件版本列表
**键**: `manage@file_versions@{filePath}`
**值**:
```json
{
  "versions": [
    {
      "id": "ver_1737280800_abc123",
      "versionNumber": 1,
      "fileName": "document_v1.pdf",
      "fileSize": "2.5",
      "fileType": "application/pdf",
      "storageKey": "versions/document_v1_1737280800.pdf",
      "createdAt": "2025-01-18T09:00:00.000Z",
      "createdBy": "system",
      "changeNote": "初始版本",
      "isActive": false
    },
    {
      "id": "ver_1737280900_def456",
      "versionNumber": 2,
      "fileName": "document_v2.pdf",
      "fileSize": "2.8",
      "fileType": "application/pdf",
      "storageKey": "versions/document_v2_1737280900.pdf",
      "createdAt": "2025-01-18T10:00:00.000Z",
      "createdBy": "admin",
      "changeNote": "更新内容，添加新章节",
      "isActive": true
    }
  ],
  "currentVersion": 2,
  "lastUpdated": "2025-01-18T10:00:00.000Z"
}
```

## 4. 文件统计数据结构

### 4.1 统计数据索引
**键**: `manage@stats@index`
**值**:
```json
{
  "files": [
    "uploads/image1.jpg",
    "documents/report.pdf",
    "videos/demo.mp4"
  ],
  "lastUpdated": "2025-01-18T10:00:00.000Z"
}
```

### 4.2 文件访问统计
**键**: `manage@file_stats@{filePath}`
**值**:
```json
{
  "fileId": "uploads/image1.jpg",
  "viewCount": 150,
  "downloadCount": 25,
  "shareCount": 8,
  "firstAccessed": "2025-01-15T08:00:00.000Z",
  "lastAccessed": "2025-01-18T09:45:00.000Z",
  "accessLogs": [
    {
      "accessTime": "2025-01-18T09:45:00.000Z",
      "accessType": "view",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.100",
      "referer": "https://example.com"
    },
    {
      "accessTime": "2025-01-18T09:30:00.000Z",
      "accessType": "download",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.101",
      "referer": ""
    }
  ],
  "dailyStats": {
    "2025-01-18": { "views": 12, "downloads": 3, "shares": 1 },
    "2025-01-17": { "views": 8, "downloads": 2, "shares": 0 }
  },
  "lastUpdated": "2025-01-18T09:45:00.000Z"
}
```

### 4.3 存储使用统计缓存
**键**: `manage@storage_stats@cache`
**值**:
```json
{
  "totalSize": 1024.5,
  "totalFiles": 500,
  "channelStats": {
    "CloudflareR2": { "size": 512.3, "count": 200 },
    "S3": { "size": 256.1, "count": 150 },
    "Telegram": { "size": 128.0, "count": 100 },
    "External": { "size": 64.0, "count": 30 },
    "Unknown": { "size": 64.1, "count": 20 }
  },
  "typeStats": {
    "images": { "size": 400.0, "count": 250 },
    "videos": { "size": 300.0, "count": 50 },
    "documents": { "size": 200.0, "count": 150 },
    "audio": { "size": 80.0, "count": 30 },
    "archives": { "size": 30.0, "count": 15 },
    "others": { "size": 14.5, "count": 5 }
  },
  "lastUpdated": "2025-01-18T10:00:00.000Z"
}
```

## 5. 系统配置数据结构

### 5.1 功能开关配置
**键**: `manage@config@features`
**值**:
```json
{
  "tagsEnabled": true,
  "favoritesEnabled": true,
  "versionsEnabled": true,
  "statsEnabled": true,
  "batchOperationsEnabled": true,
  "maxTagsPerFile": 10,
  "maxFavoriteGroups": 20,
  "maxVersionsPerFile": 10,
  "statsRetentionDays": 90,
  "lastUpdated": "2025-01-18T10:00:00.000Z"
}
```

## 6. 数据维护和清理

### 6.1 清理任务配置
**键**: `manage@cleanup@config`
**值**:
```json
{
  "enabled": true,
  "schedules": {
    "statsCleanup": {
      "enabled": true,
      "retentionDays": 90,
      "lastRun": "2025-01-18T02:00:00.000Z"
    },
    "versionCleanup": {
      "enabled": true,
      "maxVersionsPerFile": 10,
      "lastRun": "2025-01-18T02:00:00.000Z"
    },
    "cacheRefresh": {
      "enabled": true,
      "intervalHours": 1,
      "lastRun": "2025-01-18T10:00:00.000Z"
    }
  },
  "lastUpdated": "2025-01-18T10:00:00.000Z"
}
```

## 7. 数据一致性和完整性

### 7.1 数据关系约束
- 删除标签时，必须同时清理所有相关的文件标签关联
- 删除收藏夹分组时，必须处理其中的收藏文件
- 删除文件时，必须清理所有相关的标签、收藏、版本、统计数据

### 7.2 数据同步策略
- 使用事务性操作确保数据一致性
- 关键操作使用乐观锁机制
- 定期运行数据完整性检查任务

### 7.3 性能优化
- 使用索引键减少遍历操作
- 缓存频繁访问的统计数据
- 批量操作减少KV访问次数
- 异步更新非关键数据

## 8. 备份和恢复

### 8.1 数据导出格式
所有管理数据可以导出为JSON格式，包含完整的关系信息和元数据。

### 8.2 数据导入验证
导入数据时需要验证：
- 数据格式正确性
- 引用关系完整性
- 业务逻辑一致性

---

**注意事项**:
1. 所有时间戳使用 ISO 8601 格式 (UTC)
2. 文件路径使用 URL 编码处理特殊字符
3. ID 生成使用时间戳 + 随机字符串确保唯一性
4. 所有数据结构都包含 `lastUpdated` 字段用于缓存和同步
5. 大型数据集使用分页机制避免单次操作过大
