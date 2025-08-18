/**
 * 单个标签操作 API
 * 支持标签的更新和删除操作
 */

export async function onRequest(context) {
    const {
        request,
        env,
        params,
        waitUntil,
        next,
        data,
    } = context;

    const kv = env.img_url;
    const method = request.method;
    const tagId = params.tagId;

    if (!tagId) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Tag ID is required'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        switch (method) {
            case 'PUT':
                return await updateTag(kv, tagId, request);
            case 'DELETE':
                return await deleteTag(kv, tagId);
            default:
                return new Response('Method not allowed', { status: 405 });
        }
    } catch (error) {
        console.error('Tag operation error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 更新标签
 */
async function updateTag(kv, tagId, request) {
    try {
        // 获取现有标签
        const existingTagStr = await kv.get(`manage@tags@${tagId}`);
        if (!existingTagStr) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Tag not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const existingTag = JSON.parse(existingTagStr);
        const body = await request.json();
        const { name, color, description } = body;

        // 验证必填字段
        if (!name || !color) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Name and color are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 如果名称发生变化，检查新名称是否已存在
        if (name.toLowerCase() !== existingTag.name.toLowerCase()) {
            const duplicateTag = await findTagByName(kv, name);
            if (duplicateTag && duplicateTag.id !== tagId) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Tag name already exists'
                }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 更新标签对象
        const updatedTag = {
            ...existingTag,
            name: name.trim(),
            color: color,
            description: description?.trim() || '',
            updatedAt: new Date().toISOString()
        };

        // 保存更新后的标签
        await kv.put(`manage@tags@${tagId}`, JSON.stringify(updatedTag));

        return new Response(JSON.stringify({
            success: true,
            tag: updatedTag
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to update tag: ${error.message}`);
    }
}

/**
 * 删除标签
 */
async function deleteTag(kv, tagId) {
    try {
        // 检查标签是否存在
        const existingTagStr = await kv.get(`manage@tags@${tagId}`);
        if (!existingTagStr) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Tag not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 获取使用此标签的文件列表
        const fileTagsStr = await kv.get(`manage@tag_files@${tagId}`);
        const fileTags = fileTagsStr ? JSON.parse(fileTagsStr) : { files: [] };

        // 从所有文件中移除此标签
        for (const fileId of fileTags.files) {
            await removeTagFromFile(kv, fileId, tagId);
        }

        // 删除标签文件关联
        await kv.delete(`manage@tag_files@${tagId}`);

        // 删除标签本身
        await kv.delete(`manage@tags@${tagId}`);

        // 从标签索引中移除
        const tagsIndexStr = await kv.get('manage@tags@index');
        const tagsIndex = tagsIndexStr ? JSON.parse(tagsIndexStr) : { tags: [] };
        tagsIndex.tags = tagsIndex.tags.filter(id => id !== tagId);
        await kv.put('manage@tags@index', JSON.stringify(tagsIndex));

        return new Response(JSON.stringify({
            success: true,
            message: 'Tag deleted successfully'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to delete tag: ${error.message}`);
    }
}

/**
 * 从文件中移除标签
 */
async function removeTagFromFile(kv, fileId, tagId) {
    try {
        const fileTagsStr = await kv.get(`manage@file_tags@${fileId}`);
        const fileTags = fileTagsStr ? JSON.parse(fileTagsStr) : { tags: [] };
        
        fileTags.tags = fileTags.tags.filter(id => id !== tagId);
        
        if (fileTags.tags.length > 0) {
            await kv.put(`manage@file_tags@${fileId}`, JSON.stringify(fileTags));
        } else {
            await kv.delete(`manage@file_tags@${fileId}`);
        }
    } catch (error) {
        console.error(`Failed to remove tag ${tagId} from file ${fileId}:`, error);
    }
}

/**
 * 根据名称查找标签
 */
async function findTagByName(kv, name) {
    const tagsIndexStr = await kv.get('manage@tags@index');
    const tagsIndex = tagsIndexStr ? JSON.parse(tagsIndexStr) : { tags: [] };
    
    for (const tagId of tagsIndex.tags) {
        const tagStr = await kv.get(`manage@tags@${tagId}`);
        if (tagStr) {
            const tag = JSON.parse(tagStr);
            if (tag.name.toLowerCase() === name.toLowerCase()) {
                return tag;
            }
        }
    }
    return null;
}
