/**
 * 批量添加到收藏夹 API
 * 将多个文件批量添加到收藏夹
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
        return await batchAddToFavorites(kv, request);
    } catch (error) {
        console.error('Batch add to favorites API error:', error);
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
 * 批量添加到收藏夹
 */
async function batchAddToFavorites(kv, request) {
    try {
        const body = await request.json();
        const { fileIds, groupId = 'default' } = body;

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

        // 验证分组是否存在
        const groupStr = await kv.get(`manage@favorite_groups@${groupId}`);
        if (!groupStr) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Favorite group not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 解码文件路径
        const decodedFilePaths = fileIds.map(fileId => 
            decodeURIComponent(fileId.split(',').join('/'))
        );

        // 获取分组的收藏文件列表
        const groupFilesStr = await kv.get(`manage@favorite_files@${groupId}`);
        const groupFiles = groupFilesStr ? JSON.parse(groupFilesStr) : { files: [] };

        // 批量处理结果
        const results = {
            successCount: 0,
            failedCount: 0,
            skippedCount: 0,
            totalFiles: decodedFilePaths.length,
            errors: []
        };

        // 为每个文件添加到收藏夹
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

                // 检查文件是否已经在收藏夹中
                const existingFavorite = groupFiles.files.find(f => f.fileId === filePath);
                if (existingFavorite) {
                    results.skippedCount++;
                    continue;
                }

                // 创建收藏记录
                const favoriteId = generateFavoriteId();
                const favoriteEntry = {
                    id: favoriteId,
                    fileId: filePath,
                    groupId: groupId,
                    addedAt: new Date().toISOString(),
                    note: ''
                };

                // 添加到分组文件列表
                groupFiles.files.push(favoriteEntry);

                // 更新文件的收藏状态
                await addFavoriteToFile(kv, filePath, favoriteEntry);

                results.successCount++;
            } catch (error) {
                results.failedCount++;
                results.errors.push({
                    file: filePath,
                    error: error.message
                });
                console.error(`Failed to add file ${filePath} to favorites:`, error);
            }
        }

        // 保存更新后的分组文件列表
        await kv.put(`manage@favorite_files@${groupId}`, JSON.stringify(groupFiles));

        return new Response(JSON.stringify({
            success: true,
            message: `Batch operation completed: ${results.successCount} files added to favorites`,
            results: results
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to batch add to favorites: ${error.message}`);
    }
}

/**
 * 更新文件的收藏状态
 */
async function addFavoriteToFile(kv, filePath, favoriteEntry) {
    try {
        const fileFavoritesStr = await kv.get(`manage@file_favorites@${filePath}`);
        const fileFavorites = fileFavoritesStr ? JSON.parse(fileFavoritesStr) : { favorites: [] };
        
        fileFavorites.favorites.push({
            id: favoriteEntry.id,
            groupId: favoriteEntry.groupId,
            addedAt: favoriteEntry.addedAt,
            note: favoriteEntry.note
        });
        
        await kv.put(`manage@file_favorites@${filePath}`, JSON.stringify(fileFavorites));
    } catch (error) {
        console.error(`Failed to update file favorites for ${filePath}:`, error);
    }
}

/**
 * 生成收藏记录ID
 */
function generateFavoriteId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `fav_${timestamp}_${random}`;
}
