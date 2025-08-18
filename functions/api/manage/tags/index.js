/**
 * 标签管理 API
 * 支持标签的 CRUD 操作
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
    const url = new URL(request.url);

    try {
        switch (method) {
            case 'GET':
                return await getTags(kv);
            case 'POST':
                return await createTag(kv, request);
            default:
                return new Response('Method not allowed', { status: 405 });
        }
    } catch (error) {
        console.error('Tags API error:', error);
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
 * 获取所有标签
 */
async function getTags(kv) {
    try {
        // 从 KV 中获取标签索引
        const tagsIndexStr = await kv.get('manage@tags@index');
        const tagsIndex = tagsIndexStr ? JSON.parse(tagsIndexStr) : { tags: [] };
        
        // 获取所有标签详细信息
        const tags = [];
        for (const tagId of tagsIndex.tags) {
            const tagStr = await kv.get(`manage@tags@${tagId}`);
            if (tagStr) {
                const tag = JSON.parse(tagStr);
                // 计算使用此标签的文件数量
                const fileTagsStr = await kv.get(`manage@tag_files@${tagId}`);
                const fileTags = fileTagsStr ? JSON.parse(fileTagsStr) : { files: [] };
                tag.fileCount = fileTags.files.length;
                tags.push(tag);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            tags: tags
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to get tags: ${error.message}`);
    }
}

/**
 * 创建新标签
 */
async function createTag(kv, request) {
    try {
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

        // 检查标签名是否已存在
        const existingTag = await findTagByName(kv, name);
        if (existingTag) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Tag name already exists'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 生成标签ID
        const tagId = generateTagId();
        const now = new Date().toISOString();

        // 创建标签对象
        const tag = {
            id: tagId,
            name: name.trim(),
            color: color,
            description: description?.trim() || '',
            createdAt: now,
            updatedAt: now,
            fileCount: 0
        };

        // 保存标签到 KV
        await kv.put(`manage@tags@${tagId}`, JSON.stringify(tag));

        // 更新标签索引
        const tagsIndexStr = await kv.get('manage@tags@index');
        const tagsIndex = tagsIndexStr ? JSON.parse(tagsIndexStr) : { tags: [] };
        tagsIndex.tags.push(tagId);
        await kv.put('manage@tags@index', JSON.stringify(tagsIndex));

        // 初始化标签文件关联
        await kv.put(`manage@tag_files@${tagId}`, JSON.stringify({ files: [] }));

        return new Response(JSON.stringify({
            success: true,
            tag: tag
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to create tag: ${error.message}`);
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

/**
 * 生成标签ID
 */
function generateTagId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `tag_${timestamp}_${random}`;
}
