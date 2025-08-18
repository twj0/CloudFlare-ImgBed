/**
 * TagManager 组件单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ElMessage, ElMessageBox } from 'element-plus';
import TagManager from '@/components/TagManager.vue';
import * as fileManagerAPI from '@/utils/fileManagerAPI';

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn()
  }
}));

// Mock API
vi.mock('@/utils/fileManagerAPI', () => ({
  getTags: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn()
}));

describe('TagManager', () => {
  let wrapper;
  const mockTags = [
    {
      id: 'tag1',
      name: 'Important',
      color: '#F56C6C',
      description: 'Important files',
      fileCount: 5,
      createdAt: '2023-01-01T00:00:00Z'
    },
    {
      id: 'tag2',
      name: 'Work',
      color: '#409EFF',
      description: 'Work related files',
      fileCount: 10,
      createdAt: '2023-01-02T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    fileManagerAPI.getTags.mockResolvedValue(mockTags);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should render tag manager with tags', async () => {
    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.tag-manager').exists()).toBe(true);
    expect(wrapper.find('.tag-count').text()).toContain('共 2 个标签');
  });

  it('should load tags on mount', async () => {
    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    expect(fileManagerAPI.getTags).toHaveBeenCalled();
    expect(wrapper.vm.tags).toHaveLength(2);
  });

  it('should display tag cards correctly', async () => {
    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    const tagCards = wrapper.findAll('.tag-card');
    expect(tagCards).toHaveLength(2);

    const firstCard = tagCards[0];
    expect(firstCard.find('.tag-preview').text()).toBe('Important');
    expect(firstCard.find('.tag-description').text()).toBe('Important files');
    expect(firstCard.find('.file-count').text()).toBe('5 个文件');
  });

  it('should filter tags based on search query', async () => {
    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    // 设置搜索查询
    await wrapper.setData({ searchQuery: 'work' });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.filteredTags).toHaveLength(1);
    expect(wrapper.vm.filteredTags[0].name).toBe('Work');
  });

  it('should show create dialog when clicking new tag button', async () => {
    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    const createButton = wrapper.find('[data-testid="create-tag-btn"]');
    if (createButton.exists()) {
      await createButton.trigger('click');
      expect(wrapper.vm.dialogVisible).toBe(true);
      expect(wrapper.vm.isEditing).toBe(false);
    }
  });

  it('should show edit dialog when editing a tag', async () => {
    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    const tag = mockTags[0];
    await wrapper.vm.editTag(tag);

    expect(wrapper.vm.dialogVisible).toBe(true);
    expect(wrapper.vm.isEditing).toBe(true);
    expect(wrapper.vm.tagForm.name).toBe(tag.name);
    expect(wrapper.vm.tagForm.color).toBe(tag.color);
    expect(wrapper.vm.tagForm.description).toBe(tag.description);
  });

  it('should create a new tag successfully', async () => {
    const newTag = {
      id: 'tag3',
      name: 'New Tag',
      color: '#67C23A',
      description: 'New tag description'
    };

    fileManagerAPI.createTag.mockResolvedValue(newTag);
    fileManagerAPI.getTags.mockResolvedValue([...mockTags, newTag]);

    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    // 设置表单数据
    wrapper.vm.tagForm.name = 'New Tag';
    wrapper.vm.tagForm.color = '#67C23A';
    wrapper.vm.tagForm.description = 'New tag description';
    wrapper.vm.isEditing = false;

    // 提交表单
    await wrapper.vm.submitForm();

    expect(fileManagerAPI.createTag).toHaveBeenCalledWith({
      name: 'New Tag',
      color: '#67C23A',
      description: 'New tag description'
    });
    expect(fileManagerAPI.getTags).toHaveBeenCalledTimes(2); // 初始加载 + 创建后重新加载
  });

  it('should update an existing tag successfully', async () => {
    fileManagerAPI.updateTag.mockResolvedValue(true);

    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    // 设置编辑模式
    wrapper.vm.isEditing = true;
    wrapper.vm.tagForm.id = 'tag1';
    wrapper.vm.tagForm.name = 'Updated Tag';
    wrapper.vm.tagForm.color = '#E6A23C';
    wrapper.vm.tagForm.description = 'Updated description';

    // 提交表单
    await wrapper.vm.submitForm();

    expect(fileManagerAPI.updateTag).toHaveBeenCalledWith('tag1', {
      name: 'Updated Tag',
      color: '#E6A23C',
      description: 'Updated description'
    });
  });

  it('should delete a tag with confirmation', async () => {
    ElMessageBox.confirm.mockResolvedValue(true);
    fileManagerAPI.deleteTag.mockResolvedValue(true);

    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    const tag = mockTags[0];
    await wrapper.vm.deleteTag(tag);

    expect(ElMessageBox.confirm).toHaveBeenCalledWith(
      `确定要删除标签 "${tag.name}" 吗？这将移除所有文件上的此标签。`,
      '确认删除',
      expect.any(Object)
    );
    expect(fileManagerAPI.deleteTag).toHaveBeenCalledWith(tag.id);
  });

  it('should handle tag selection for batch operations', async () => {
    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    // 选择标签
    await wrapper.vm.toggleTagSelection('tag1');
    expect(wrapper.vm.selectedTags).toContain('tag1');

    // 再次点击取消选择
    await wrapper.vm.toggleTagSelection('tag1');
    expect(wrapper.vm.selectedTags).not.toContain('tag1');
  });

  it('should clear all selections', async () => {
    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    // 选择多个标签
    wrapper.vm.selectedTags = ['tag1', 'tag2'];
    
    // 清除选择
    await wrapper.vm.clearSelection();
    expect(wrapper.vm.selectedTags).toHaveLength(0);
  });

  it('should perform batch delete with confirmation', async () => {
    ElMessageBox.confirm.mockResolvedValue(true);
    fileManagerAPI.deleteTag.mockResolvedValue(true);

    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    // 选择多个标签
    wrapper.vm.selectedTags = ['tag1', 'tag2'];

    // 执行批量删除
    await wrapper.vm.batchDeleteTags();

    expect(ElMessageBox.confirm).toHaveBeenCalledWith(
      '确定要删除选中的 2 个标签吗？',
      '批量删除确认',
      expect.any(Object)
    );
    expect(fileManagerAPI.deleteTag).toHaveBeenCalledTimes(2);
  });

  it('should validate form before submission', async () => {
    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    // 设置无效的表单数据
    wrapper.vm.tagForm.name = '';
    wrapper.vm.tagForm.color = '';

    // 模拟表单验证失败
    const mockFormRef = {
      validate: vi.fn().mockRejectedValue(new Error('Validation failed'))
    };
    wrapper.vm.$refs.tagFormRef = mockFormRef;

    await wrapper.vm.submitForm();

    expect(mockFormRef.validate).toHaveBeenCalled();
    expect(fileManagerAPI.createTag).not.toHaveBeenCalled();
  });

  it('should reset form when dialog is closed', async () => {
    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    // 设置表单数据
    wrapper.vm.tagForm.name = 'Test';
    wrapper.vm.tagForm.color = '#123456';
    wrapper.vm.tagForm.description = 'Test description';

    // 重置表单
    await wrapper.vm.resetForm();

    expect(wrapper.vm.tagForm.name).toBe('');
    expect(wrapper.vm.tagForm.color).toBe('#409EFF');
    expect(wrapper.vm.tagForm.description).toBe('');
  });

  it('should format date correctly', () => {
    wrapper = mount(TagManager);
    
    const dateString = '2023-01-01T12:00:00Z';
    const formatted = wrapper.vm.formatDate(dateString);
    
    expect(formatted).toBe('2023/1/1');
  });

  it('should show empty state when no tags exist', async () => {
    fileManagerAPI.getTags.mockResolvedValue([]);

    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.tag-count').text()).toContain('共 0 个标签');
  });

  it('should handle API errors gracefully', async () => {
    fileManagerAPI.getTags.mockRejectedValue(new Error('API Error'));

    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.tags).toHaveLength(0);
    expect(wrapper.vm.loading).toBe(false);
  });

  it('should expose loadTags method to parent', () => {
    wrapper = mount(TagManager);
    
    const exposed = wrapper.vm.$.exposed;
    expect(exposed).toHaveProperty('loadTags');
    expect(typeof exposed.loadTags).toBe('function');
  });

  it('should handle search input correctly', async () => {
    wrapper = mount(TagManager);
    await wrapper.vm.$nextTick();

    const searchInput = wrapper.find('input[placeholder="搜索标签..."]');
    if (searchInput.exists()) {
      await searchInput.setValue('important');
      await searchInput.trigger('input');

      expect(wrapper.vm.searchQuery).toBe('important');
      expect(wrapper.vm.filteredTags).toHaveLength(1);
    }
  });

  it('should show loading state during operations', async () => {
    wrapper = mount(TagManager);
    
    // 设置加载状态
    await wrapper.setData({ loading: true });
    
    expect(wrapper.find('[v-loading="true"]').exists()).toBe(true);
  });
});
