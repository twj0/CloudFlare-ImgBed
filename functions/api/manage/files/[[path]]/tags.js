/**
 * 文件标签关联 API
 * 支持为文件添加和移除标签
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
    
    // 处理文件路径
    let filePath = params.path;
    if (Array.isArray(filePath)) {
        filePath = filePath.join('/');
    } else if (typeof filePath === 'string') {
        filePath = filePath.split(',').join('/');
    }
    
    // 解码文件路径
    filePath = decodeURIComponent(filePath);

    if (!filePath) {
        return new Response(JSON.stringify({
            success: false,
            error: 'File path is required'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 验证文件是否存在
        const fileRecord = await kv.getWithMetadata(filePath);
        if (!fileRecord) {
            return new Response(JSON.stringify({
                success: false,
                error: 'File not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        switch (method) {
            case 'GET':
                return await getFileTags(kv, filePath);
            case 'POST':
                return await addFileTags(kv, filePath, request);
            case 'DELETE':
                return await removeFileTags(kv, filePath, request);
            default:
                return new Response('Method not allowed', { status: 405 });
        }
    } catch (error) {
        console.error('File tags API error:', error);
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
 * 获取文件的所有标签
 */
async function getFileTags(kv, filePath) {
    try {
        const fileTagsStr = await kv.get(`manage@file_tags@${filePath}`);
        const fileTags = fileTagsStr ? JSON.parse(fileTagsStr) : { tags: [] };
        
        // 获取标签详细信息
        const tags = [];
        for (const tagId of fileTags.tags) {
            const tagStr = await kv.get(`manage@tags@${tagId}`);
            if (tagStr) {
                tags.push(JSON.parse(tagStr));
            }
        }

        return new Response(JSON.stringify({
            success: true,
            tags: tags
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to get file tags: ${error.message}`);
    }
}

/**
 * 为文件添加标签
 */
async function addFileTags(kv, filePath, request) {
    try {
        const body = await request.json();
        const { tagIds } = body;

        if (!Array.isArray(tagIds) || tagIds.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Tag IDs array is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 验证所有标签是否存在
        const validTagIds = [];
        for (const tagId of tagIds) {
            const tagStr = await kv.get(`manage@tags@${tagId}`);
            if (tagStr) {
                validTagIds.push(tagId);
            }
        }

        if (validTagIds.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No valid tags found'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 获取文件现有标签
        const fileTagsStr = await kv.get(`manage@file_tags@${filePath}`);
        const fileTags = fileTagsStr ? JSON.parse(fileTagsStr) : { tags: [] };

        // 添加新标签（避免重复）
        const addedTags = [];
        for (const tagId of validTagIds) {
            if (!fileTags.tags.includes(tagId)) {
                fileTags.tags.push(tagId);
                addedTags.push(tagId);
                
                // 更新标签的文件关联
                await addFileToTag(kv, tagId, filePath);
            }
        }

        // 保存文件标签关联
        await kv.put(`manage@file_tags@${filePath}`, JSON.stringify(fileTags));

        return new Response(JSON.stringify({
            success: true,
            message: `Added ${addedTags.length} tags to file`,
            addedTags: addedTags
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to add file tags: ${error.message}`);
    }
}

/**
 * 从文件移除标签
 */
async function removeFileTags(kv, filePath, request) {
    try {
        const body = await request.json();
        const { tagIds } = body;

        if (!Array.isArray(tagIds) || tagIds.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Tag IDs array is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 获取文件现有标签
        const fileTagsStr = await kv.get(`manage@file_tags@${filePath}`);
        const fileTags = fileTagsStr ? JSON.parse(fileTagsStr) : { tags: [] };

        // 移除指定标签
        const removedTags = [];
        for (const tagId of tagIds) {
            const index = fileTags.tags.indexOf(tagId);
            if (index > -1) {
                fileTags.tags.splice(index, 1);
                removedTags.push(tagId);
                
                // 更新标签的文件关联
                await removeFileFromTag(kv, tagId, filePath);
            }
        }

        // 保存文件标签关联
        if (fileTags.tags.length > 0) {
            await kv.put(`manage@file_tags@${filePath}`, JSON.stringify(fileTags));
        } else {
            await kv.delete(`manage@file_tags@${filePath}`);
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Removed ${removedTags.length} tags from file`,
            removedTags: removedTags
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to remove file tags: ${error.message}`);
    }
}

/**
 * 将文件添加到标签的文件列表中
 */
async function addFileToTag(kv, tagId, filePath) {
    try {
        const tagFilesStr = await kv.get(`manage@tag_files@${tagId}`);
        const tagFiles = tagFilesStr ? JSON.parse(tagFilesStr) : { files: [] };
        
        if (!tagFiles.files.includes(filePath)) {
            tagFiles.files.push(filePath);
            await kv.put(`manage@tag_files@${tagId}`, JSON.stringify(tagFiles));
        }
    } catch (error) {
        console.error(`Failed to add file ${filePath} to tag ${tagId}:`, error);
    }
}

/**
 * 从标签的文件列表中移除文件
 */
async function removeFileFromTag(kv, tagId, filePath) {
    try {
        const tagFilesStr = await kv.get(`manage@tag_files@${tagId}`);
        const tagFiles = tagFilesStr ? JSON.parse(tagFilesStr) : { files: [] };
        
        const index = tagFiles.files.indexOf(filePath);
        if (index > -1) {
            tagFiles.files.splice(index, 1);
            
            if (tagFiles.files.length > 0) {
                await kv.put(`manage@tag_files@${tagId}`, JSON.stringify(tagFiles));
            } else {
                await kv.put(`manage@tag_files@${tagId}`, JSON.stringify({ files: [] }));
            }
        }
    } catch (error) {
        console.error(`Failed to remove file ${filePath} from tag ${tagId}:`, error);
    }
}
