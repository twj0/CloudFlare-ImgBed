/**
 * 文件管理器API单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  addFileTags,
  removeFileTags,
  searchFilesByTags,
  getFavoriteGroups,
  createFavoriteGroup,
  addToFavorites,
  removeFromFavorites,
  getFavoriteFiles,
  getFileVersions,
  restoreFileVersion,
  getFileStats,
  getStorageUsage,
  getPopularFiles,
  batchAddTags,
  batchAddToFavorites
} from '@/utils/fileManagerAPI';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock ElMessage
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}));

describe('Tag API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTags', () => {
    it('should fetch tags successfully', async () => {
      const mockTags = [
        { id: 'tag1', name: 'Important', color: '#F56C6C' },
        { id: 'tag2', name: 'Work', color: '#409EFF' }
      ];

      mockedAxios.get.mockResolvedValue({
        data: { success: true, tags: mockTags }
      });

      const result = await getTags();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/manage/tags');
      expect(result).toEqual(mockTags);
    });

    it('should handle fetch tags failure', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await getTags();
      
      expect(result).toEqual([]);
      expect(ElMessage.error).toHaveBeenCalled();
    });

    it('should return empty array when success is false', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: false, error: 'Server error' }
      });

      const result = await getTags();
      
      expect(result).toEqual([]);
    });
  });

  describe('createTag', () => {
    it('should create tag successfully', async () => {
      const tagData = {
        name: 'New Tag',
        color: '#67C23A',
        description: 'Test tag'
      };

      const mockResponse = {
        success: true,
        tag: { id: 'new-tag', ...tagData }
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await createTag(tagData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/manage/tags', tagData);
      expect(result).toEqual(mockResponse.tag);
      expect(ElMessage.success).toHaveBeenCalledWith('标签创建成功');
    });

    it('should handle create tag failure', async () => {
      const tagData = { name: 'New Tag', color: '#67C23A' };
      
      mockedAxios.post.mockRejectedValue({
        response: { data: { error: 'Tag already exists' } }
      });

      const result = await createTag(tagData);
      
      expect(result).toBeNull();
      expect(ElMessage.error).toHaveBeenCalledWith('创建标签失败: Tag already exists');
    });
  });

  describe('updateTag', () => {
    it('should update tag successfully', async () => {
      const tagId = 'tag1';
      const tagData = { name: 'Updated Tag', color: '#E6A23C' };

      mockedAxios.put.mockResolvedValue({
        data: { success: true }
      });

      const result = await updateTag(tagId, tagData);
      
      expect(mockedAxios.put).toHaveBeenCalledWith(`/api/manage/tags/${tagId}`, tagData);
      expect(result).toBe(true);
      expect(ElMessage.success).toHaveBeenCalledWith('标签更新成功');
    });
  });

  describe('deleteTag', () => {
    it('should delete tag successfully', async () => {
      const tagId = 'tag1';

      mockedAxios.delete.mockResolvedValue({
        data: { success: true }
      });

      const result = await deleteTag(tagId);
      
      expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/manage/tags/${tagId}`);
      expect(result).toBe(true);
      expect(ElMessage.success).toHaveBeenCalledWith('标签删除成功');
    });
  });

  describe('addFileTags', () => {
    it('should add tags to file successfully', async () => {
      const fileId = 'test/file.jpg';
      const tagIds = ['tag1', 'tag2'];

      mockedAxios.post.mockResolvedValue({
        data: { success: true }
      });

      const result = await addFileTags(fileId, tagIds);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/manage/files/test,file.jpg/tags',
        { tagIds }
      );
      expect(result).toBe(true);
      expect(ElMessage.success).toHaveBeenCalledWith('标签添加成功');
    });

    it('should handle special characters in file path', async () => {
      const fileId = 'folder/file with spaces & symbols.jpg';
      const tagIds = ['tag1'];

      mockedAxios.post.mockResolvedValue({
        data: { success: true }
      });

      await addFileTags(fileId, tagIds);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/manage/files/folder,file%20with%20spaces%20%26%20symbols.jpg/tags',
        { tagIds }
      );
    });
  });

  describe('searchFilesByTags', () => {
    it('should search files by tags successfully', async () => {
      const tagIds = ['tag1', 'tag2'];
      const options = {
        dir: 'uploads',
        start: 0,
        count: 20,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const mockResponse = {
        success: true,
        files: [
          { name: 'file1.jpg', tags: ['tag1'] },
          { name: 'file2.pdf', tags: ['tag1', 'tag2'] }
        ],
        total: 2
      };

      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await searchFilesByTags(tagIds, options);
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/manage/search/tags?tags=tag1%2Ctag2&dir=uploads&start=0&count=20&sortBy=name&sortOrder=asc'
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

describe('Favorite API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFavoriteGroups', () => {
    it('should fetch favorite groups successfully', async () => {
      const mockGroups = [
        { id: 'group1', name: 'Work', icon: 'folder' },
        { id: 'group2', name: 'Personal', icon: 'star' }
      ];

      mockedAxios.get.mockResolvedValue({
        data: { success: true, groups: mockGroups }
      });

      const result = await getFavoriteGroups();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/manage/favorites/groups');
      expect(result).toEqual(mockGroups);
    });
  });

  describe('createFavoriteGroup', () => {
    it('should create favorite group successfully', async () => {
      const groupData = {
        name: 'New Group',
        description: 'Test group',
        color: '#67C23A',
        icon: 'star'
      };

      const mockResponse = {
        success: true,
        group: { id: 'new-group', ...groupData }
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await createFavoriteGroup(groupData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/manage/favorites/groups', groupData);
      expect(result).toEqual(mockResponse.group);
      expect(ElMessage.success).toHaveBeenCalledWith('收藏夹分组创建成功');
    });
  });

  describe('addToFavorites', () => {
    it('should add file to favorites successfully', async () => {
      const fileId = 'test/file.jpg';
      const groupId = 'group1';

      mockedAxios.post.mockResolvedValue({
        data: { success: true }
      });

      const result = await addToFavorites(fileId, groupId);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/manage/favorites', {
        fileId: 'test,file.jpg',
        groupId
      });
      expect(result).toBe(true);
      expect(ElMessage.success).toHaveBeenCalledWith('已添加到收藏夹');
    });

    it('should use default group when not specified', async () => {
      const fileId = 'test/file.jpg';

      mockedAxios.post.mockResolvedValue({
        data: { success: true }
      });

      await addToFavorites(fileId);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/manage/favorites', {
        fileId: 'test,file.jpg',
        groupId: 'default'
      });
    });
  });

  describe('getFavoriteFiles', () => {
    it('should fetch favorite files successfully', async () => {
      const groupId = 'group1';
      const options = { start: 0, count: 20 };

      const mockResponse = {
        success: true,
        files: [
          { id: 'fav1', fileId: 'file1.jpg', addedAt: '2023-01-01' },
          { id: 'fav2', fileId: 'file2.pdf', addedAt: '2023-01-02' }
        ],
        total: 2
      };

      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await getFavoriteFiles(groupId, options);
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/manage/favorites?start=0&count=20&sortBy=addedAt&sortOrder=desc&groupId=group1'
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

describe('Version API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFileVersions', () => {
    it('should fetch file versions successfully', async () => {
      const fileId = 'test/document.pdf';
      const mockVersions = [
        { id: 'v1', versionNumber: 1, isActive: false },
        { id: 'v2', versionNumber: 2, isActive: true }
      ];

      mockedAxios.get.mockResolvedValue({
        data: { success: true, versions: mockVersions }
      });

      const result = await getFileVersions(fileId);
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/manage/files/test,document.pdf/versions');
      expect(result).toEqual(mockVersions);
    });
  });

  describe('restoreFileVersion', () => {
    it('should restore file version successfully', async () => {
      const fileId = 'test/document.pdf';
      const versionId = 'v1';

      mockedAxios.post.mockResolvedValue({
        data: { success: true }
      });

      const result = await restoreFileVersion(fileId, versionId);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/api/manage/files/test,document.pdf/versions/${versionId}/restore`
      );
      expect(result).toBe(true);
      expect(ElMessage.success).toHaveBeenCalledWith('文件版本恢复成功');
    });
  });
});

describe('Stats API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFileStats', () => {
    it('should fetch file statistics successfully', async () => {
      const options = { period: '7d', type: 'all', groupBy: 'day' };
      const mockStats = {
        success: true,
        totalFiles: 100,
        totalViews: 1000,
        totalDownloads: 200
      };

      mockedAxios.get.mockResolvedValue({ data: mockStats });

      const result = await getFileStats(options);
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/manage/stats/files?period=7d&type=all&groupBy=day'
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe('getStorageUsage', () => {
    it('should fetch storage usage successfully', async () => {
      const mockUsage = {
        success: true,
        totalSize: 1024,
        usedSize: 512,
        availableSize: 512
      };

      mockedAxios.get.mockResolvedValue({ data: mockUsage });

      const result = await getStorageUsage();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/manage/stats/storage');
      expect(result).toEqual(mockUsage);
    });
  });

  describe('getPopularFiles', () => {
    it('should fetch popular files successfully', async () => {
      const options = { period: '7d', limit: 10, sortBy: 'views' };
      const mockFiles = {
        success: true,
        files: [
          { fileId: 'file1.jpg', viewCount: 100 },
          { fileId: 'file2.pdf', viewCount: 80 }
        ]
      };

      mockedAxios.get.mockResolvedValue({ data: mockFiles });

      const result = await getPopularFiles(options);
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/manage/stats/popular?period=7d&limit=10&sortBy=views'
      );
      expect(result).toEqual(mockFiles);
    });
  });
});

describe('Batch Operations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('batchAddTags', () => {
    it('should add tags to multiple files successfully', async () => {
      const fileIds = ['file1.jpg', 'file2.pdf'];
      const tagIds = ['tag1', 'tag2'];

      const mockResponse = {
        success: true,
        successCount: 2,
        failedCount: 0
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await batchAddTags(fileIds, tagIds);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/manage/batch/tags/add', {
        fileIds: ['file1.jpg', 'file2.pdf'],
        tagIds
      });
      expect(result).toEqual(mockResponse);
      expect(ElMessage.success).toHaveBeenCalledWith('成功为 2 个文件添加标签');
    });

    it('should handle batch operation failure', async () => {
      const fileIds = ['file1.jpg'];
      const tagIds = ['tag1'];

      mockedAxios.post.mockRejectedValue({
        response: { data: { error: 'Batch operation failed' } }
      });

      const result = await batchAddTags(fileIds, tagIds);
      
      expect(result.success).toBe(false);
      expect(ElMessage.error).toHaveBeenCalledWith('批量添加标签失败: Batch operation failed');
    });
  });

  describe('batchAddToFavorites', () => {
    it('should add multiple files to favorites successfully', async () => {
      const fileIds = ['file1.jpg', 'file2.pdf'];
      const groupId = 'group1';

      const mockResponse = {
        success: true,
        successCount: 2,
        failedCount: 0
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await batchAddToFavorites(fileIds, groupId);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/manage/batch/favorites/add', {
        fileIds: ['file1.jpg', 'file2.pdf'],
        groupId
      });
      expect(result).toEqual(mockResponse);
      expect(ElMessage.success).toHaveBeenCalledWith('成功将 2 个文件添加到收藏夹');
    });

    it('should use default group when not specified', async () => {
      const fileIds = ['file1.jpg'];

      mockedAxios.post.mockResolvedValue({
        data: { success: true, successCount: 1 }
      });

      await batchAddToFavorites(fileIds);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/manage/batch/favorites/add', {
        fileIds: ['file1.jpg'],
        groupId: 'default'
      });
    });
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle network errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    const result = await getTags();
    
    expect(result).toEqual([]);
    expect(ElMessage.error).toHaveBeenCalledWith('获取标签失败: Network Error');
  });

  it('should handle server errors with custom messages', async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        data: { error: 'Custom server error' }
      }
    });

    const result = await createTag({ name: 'Test' });
    
    expect(result).toBeNull();
    expect(ElMessage.error).toHaveBeenCalledWith('创建标签失败: Custom server error');
  });

  it('should handle malformed responses', async () => {
    mockedAxios.get.mockResolvedValue({
      data: null
    });

    const result = await getTags();
    
    expect(result).toEqual([]);
  });
});
