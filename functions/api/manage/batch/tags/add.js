/**
 * 批量添加标签 API
 * 为多个文件批量添加标签
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

    if (method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        return await batchAddTags(kv, request);
    } catch (error) {
        console.error('Batch add tags API error:', error);
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
 * 批量添加标签
 */
async function batchAddTags(kv, request) {
    try {
        const body = await request.json();
        const { fileIds, tagIds } = body;

        // 验证输入参数
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'File IDs array is required and cannot be empty'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!Array.isArray(tagIds) || tagIds.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Tag IDs array is required and cannot be empty'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 解码文件路径
        const decodedFilePaths = fileIds.map(fileId => 
            decodeURIComponent(fileId.split(',').join('/'))
        );

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

        // 批量处理结果
        const results = {
            successCount: 0,
            failedCount: 0,
            totalFiles: decodedFilePaths.length,
            totalTags: validTagIds.length,
            errors: []
        };

        // 为每个文件添加标签
        for (const filePath of decodedFilePaths) {
            try {
                // 验证文件是否存在
                const fileRecord = await kv.getWithMetadata(filePath);
                if (!fileRecord) {
                    results.failedCount++;
                    results.errors.push({
                        file: filePath,
                        error: 'File not found'
                    });
                    continue;
                }

                // 获取文件现有标签
                const fileTagsStr = await kv.get(`manage@file_tags@${filePath}`);
                const fileTags = fileTagsStr ? JSON.parse(fileTagsStr) : { tags: [] };

                // 添加新标签（避免重复）
                let addedCount = 0;
                for (const tagId of validTagIds) {
                    if (!fileTags.tags.includes(tagId)) {
                        fileTags.tags.push(tagId);
                        addedCount++;
                        
                        // 更新标签的文件关联
                        await addFileToTag(kv, tagId, filePath);
                    }
                }

                // 保存文件标签关联
                if (addedCount > 0) {
                    await kv.put(`manage@file_tags@${filePath}`, JSON.stringify(fileTags));
                }

                results.successCount++;
            } catch (error) {
                results.failedCount++;
                results.errors.push({
                    file: filePath,
                    error: error.message
                });
                console.error(`Failed to add tags to file ${filePath}:`, error);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Batch operation completed: ${results.successCount} files processed successfully`,
            results: results
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to batch add tags: ${error.message}`);
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
