/**
 * 文件管理器数据模型单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Tag,
  FileTag,
  FavoriteGroup,
  FavoriteFile,
  FileVersion,
  FileAccessLog,
  FileStats,
  ExtendedFileMetadata
} from '@/models/fileManagerModels';

describe('Tag Model', () => {
  let tag;

  beforeEach(() => {
    tag = new Tag({
      name: 'Test Tag',
      color: '#409EFF',
      description: 'Test description'
    });
  });

  it('should create a tag with default values', () => {
    const defaultTag = new Tag();
    expect(defaultTag.id).toBeDefined();
    expect(defaultTag.name).toBe('');
    expect(defaultTag.color).toBe('#409EFF');
    expect(defaultTag.fileCount).toBe(0);
  });

  it('should create a tag with provided values', () => {
    expect(tag.name).toBe('Test Tag');
    expect(tag.color).toBe('#409EFF');
    expect(tag.description).toBe('Test description');
  });

  it('should generate unique IDs', () => {
    const tag1 = new Tag();
    const tag2 = new Tag();
    expect(tag1.id).not.toBe(tag2.id);
  });

  it('should serialize to JSON correctly', () => {
    const json = tag.toJSON();
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('name', 'Test Tag');
    expect(json).toHaveProperty('color', '#409EFF');
    expect(json).toHaveProperty('description', 'Test description');
  });

  it('should deserialize from JSON correctly', () => {
    const json = {
      id: 'test-id',
      name: 'JSON Tag',
      color: '#67C23A',
      description: 'From JSON'
    };
    const fromJson = Tag.fromJSON(json);
    expect(fromJson.id).toBe('test-id');
    expect(fromJson.name).toBe('JSON Tag');
    expect(fromJson.color).toBe('#67C23A');
  });
});

describe('FileTag Model', () => {
  it('should create a file tag association', () => {
    const fileTag = new FileTag({
      fileId: 'file123',
      tagId: 'tag456'
    });
    
    expect(fileTag.fileId).toBe('file123');
    expect(fileTag.tagId).toBe('tag456');
    expect(fileTag.addedAt).toBeDefined();
    expect(fileTag.addedBy).toBe('system');
  });

  it('should serialize and deserialize correctly', () => {
    const fileTag = new FileTag({
      fileId: 'file123',
      tagId: 'tag456',
      addedBy: 'user123'
    });
    
    const json = fileTag.toJSON();
    const fromJson = FileTag.fromJSON(json);
    
    expect(fromJson.fileId).toBe(fileTag.fileId);
    expect(fromJson.tagId).toBe(fileTag.tagId);
    expect(fromJson.addedBy).toBe(fileTag.addedBy);
  });
});

describe('FavoriteGroup Model', () => {
  let group;

  beforeEach(() => {
    group = new FavoriteGroup({
      name: 'My Favorites',
      description: 'Personal favorite files',
      color: '#67C23A',
      icon: 'star'
    });
  });

  it('should create a favorite group with default values', () => {
    const defaultGroup = new FavoriteGroup();
    expect(defaultGroup.id).toBeDefined();
    expect(defaultGroup.name).toBe('');
    expect(defaultGroup.color).toBe('#67C23A');
    expect(defaultGroup.icon).toBe('star');
    expect(defaultGroup.fileCount).toBe(0);
    expect(defaultGroup.isDefault).toBe(false);
  });

  it('should create a favorite group with provided values', () => {
    expect(group.name).toBe('My Favorites');
    expect(group.description).toBe('Personal favorite files');
    expect(group.color).toBe('#67C23A');
    expect(group.icon).toBe('star');
  });

  it('should generate unique IDs', () => {
    const group1 = new FavoriteGroup();
    const group2 = new FavoriteGroup();
    expect(group1.id).not.toBe(group2.id);
  });

  it('should serialize to JSON correctly', () => {
    const json = group.toJSON();
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('name', 'My Favorites');
    expect(json).toHaveProperty('icon', 'star');
    expect(json).toHaveProperty('isDefault', false);
  });
});

describe('FavoriteFile Model', () => {
  it('should create a favorite file entry', () => {
    const favoriteFile = new FavoriteFile({
      fileId: 'file123',
      groupId: 'group456',
      note: 'Important file'
    });
    
    expect(favoriteFile.fileId).toBe('file123');
    expect(favoriteFile.groupId).toBe('group456');
    expect(favoriteFile.note).toBe('Important file');
    expect(favoriteFile.addedAt).toBeDefined();
  });

  it('should use default group if not specified', () => {
    const favoriteFile = new FavoriteFile({
      fileId: 'file123'
    });
    
    expect(favoriteFile.groupId).toBe('default');
  });
});

describe('FileVersion Model', () => {
  let version;

  beforeEach(() => {
    version = new FileVersion({
      fileId: 'file123',
      versionNumber: 2,
      fileName: 'document_v2.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      changeNote: 'Updated content'
    });
  });

  it('should create a file version with default values', () => {
    const defaultVersion = new FileVersion();
    expect(defaultVersion.id).toBeDefined();
    expect(defaultVersion.versionNumber).toBe(1);
    expect(defaultVersion.isActive).toBe(false);
  });

  it('should create a file version with provided values', () => {
    expect(version.fileId).toBe('file123');
    expect(version.versionNumber).toBe(2);
    expect(version.fileName).toBe('document_v2.pdf');
    expect(version.changeNote).toBe('Updated content');
  });

  it('should generate unique IDs', () => {
    const version1 = new FileVersion();
    const version2 = new FileVersion();
    expect(version1.id).not.toBe(version2.id);
  });
});

describe('FileAccessLog Model', () => {
  it('should create an access log entry', () => {
    const log = new FileAccessLog({
      fileId: 'file123',
      accessType: 'download',
      userAgent: 'Mozilla/5.0',
      ipAddress: '192.168.1.1'
    });
    
    expect(log.fileId).toBe('file123');
    expect(log.accessType).toBe('download');
    expect(log.userAgent).toBe('Mozilla/5.0');
    expect(log.ipAddress).toBe('192.168.1.1');
    expect(log.accessTime).toBeDefined();
  });

  it('should use default access type', () => {
    const log = new FileAccessLog({
      fileId: 'file123'
    });
    
    expect(log.accessType).toBe('view');
  });
});

describe('FileStats Model', () => {
  it('should create file statistics', () => {
    const stats = new FileStats({
      fileId: 'file123',
      viewCount: 100,
      downloadCount: 25,
      shareCount: 5
    });
    
    expect(stats.fileId).toBe('file123');
    expect(stats.viewCount).toBe(100);
    expect(stats.downloadCount).toBe(25);
    expect(stats.shareCount).toBe(5);
  });

  it('should initialize with zero counts', () => {
    const stats = new FileStats({
      fileId: 'file123'
    });
    
    expect(stats.viewCount).toBe(0);
    expect(stats.downloadCount).toBe(0);
    expect(stats.shareCount).toBe(0);
  });

  it('should serialize and deserialize correctly', () => {
    const stats = new FileStats({
      fileId: 'file123',
      viewCount: 50,
      downloadCount: 10
    });
    
    const json = stats.toJSON();
    const fromJson = FileStats.fromJSON(json);
    
    expect(fromJson.fileId).toBe(stats.fileId);
    expect(fromJson.viewCount).toBe(stats.viewCount);
    expect(fromJson.downloadCount).toBe(stats.downloadCount);
  });
});

describe('ExtendedFileMetadata Model', () => {
  let metadata;

  beforeEach(() => {
    metadata = new ExtendedFileMetadata({
      FileName: 'test.jpg',
      FileType: 'image/jpeg',
      FileSize: '2.5',
      tags: ['tag1', 'tag2'],
      isFavorite: true,
      favoriteGroups: ['group1']
    });
  });

  it('should create extended metadata with original fields', () => {
    expect(metadata.FileName).toBe('test.jpg');
    expect(metadata.FileType).toBe('image/jpeg');
    expect(metadata.FileSize).toBe('2.5');
  });

  it('should create extended metadata with new fields', () => {
    expect(metadata.tags).toEqual(['tag1', 'tag2']);
    expect(metadata.isFavorite).toBe(true);
    expect(metadata.favoriteGroups).toEqual(['group1']);
    expect(metadata.versionCount).toBe(1);
    expect(metadata.currentVersion).toBe(1);
  });

  it('should initialize with default values', () => {
    const defaultMetadata = new ExtendedFileMetadata();
    expect(defaultMetadata.tags).toEqual([]);
    expect(defaultMetadata.isFavorite).toBe(false);
    expect(defaultMetadata.favoriteGroups).toEqual([]);
    expect(defaultMetadata.customProperties).toEqual({});
  });

  it('should include FileStats object', () => {
    expect(metadata.stats).toBeDefined();
    expect(metadata.stats.fileId).toBe('test.jpg');
  });

  it('should serialize to JSON correctly', () => {
    const json = metadata.toJSON();
    expect(json).toHaveProperty('FileName', 'test.jpg');
    expect(json).toHaveProperty('tags', ['tag1', 'tag2']);
    expect(json).toHaveProperty('isFavorite', true);
    expect(json).toHaveProperty('stats');
  });

  it('should deserialize from JSON correctly', () => {
    const json = {
      FileName: 'document.pdf',
      FileType: 'application/pdf',
      tags: ['important', 'work'],
      isFavorite: false,
      stats: {
        fileId: 'document.pdf',
        viewCount: 10,
        downloadCount: 2
      }
    };
    
    const fromJson = ExtendedFileMetadata.fromJSON(json);
    expect(fromJson.FileName).toBe('document.pdf');
    expect(fromJson.tags).toEqual(['important', 'work']);
    expect(fromJson.isFavorite).toBe(false);
    expect(fromJson.stats).toBeInstanceOf(FileStats);
    expect(fromJson.stats.viewCount).toBe(10);
  });
});

describe('Model Integration', () => {
  it('should work together in a complete workflow', () => {
    // 创建标签
    const tag = new Tag({
      name: 'Important',
      color: '#F56C6C'
    });

    // 创建收藏夹分组
    const group = new FavoriteGroup({
      name: 'Work Files',
      icon: 'folder'
    });

    // 创建扩展文件元数据
    const metadata = new ExtendedFileMetadata({
      FileName: 'report.pdf',
      FileType: 'application/pdf',
      FileSize: '5.2',
      tags: [tag.id],
      isFavorite: true,
      favoriteGroups: [group.id]
    });

    // 创建文件标签关联
    const fileTag = new FileTag({
      fileId: metadata.FileName,
      tagId: tag.id
    });

    // 创建收藏文件
    const favoriteFile = new FavoriteFile({
      fileId: metadata.FileName,
      groupId: group.id,
      note: 'Important work document'
    });

    // 验证关联关系
    expect(metadata.tags).toContain(tag.id);
    expect(metadata.favoriteGroups).toContain(group.id);
    expect(fileTag.fileId).toBe(metadata.FileName);
    expect(favoriteFile.fileId).toBe(metadata.FileName);
  });
});
