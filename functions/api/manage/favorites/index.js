/**
 * 收藏夹文件管理 API
 * 支持文件的收藏和取消收藏操作
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
                return await getFavoriteFiles(kv, url);
            case 'POST':
                return await addToFavorites(kv, request);
            default:
                return new Response('Method not allowed', { status: 405 });
        }
    } catch (error) {
        console.error('Favorites API error:', error);
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
 * 获取收藏的文件列表
 */
async function getFavoriteFiles(kv, url) {
    try {
        const searchParams = url.searchParams;
        const groupId = searchParams.get('groupId') || 'default';
        const start = parseInt(searchParams.get('start') || '0');
        const count = parseInt(searchParams.get('count') || '50');
        const sortBy = searchParams.get('sortBy') || 'addedAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // 获取分组的收藏文件列表
        const groupFilesStr = await kv.get(`manage@favorite_files@${groupId}`);
        const groupFiles = groupFilesStr ? JSON.parse(groupFilesStr) : { files: [] };

        // 获取文件详细信息
        const filesWithMetadata = [];
        for (const favoriteEntry of groupFiles.files) {
            try {
                const filePath = favoriteEntry.fileId;
                const fileRecord = await kv.getWithMetadata(filePath);
                
                if (fileRecord && fileRecord.metadata) {
                    const metadata = fileRecord.metadata;
                    
                    filesWithMetadata.push({
                        id: favoriteEntry.id,
                        fileId: filePath,
                        fileName: metadata.FileName || filePath,
                        fileType: metadata.FileType || '',
                        fileSize: metadata.FileSize || '',
                        uploadTime: metadata.TimeStamp || '',
                        directory: metadata.Directory || '',
                        addedAt: favoriteEntry.addedAt,
                        note: favoriteEntry.note || '',
                        metadata: metadata
                    });
                }
            } catch (error) {
                console.error(`Error getting metadata for favorite file ${favoriteEntry.fileId}:`, error);
            }
        }

        // 排序
        filesWithMetadata.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'addedAt':
                    aValue = new Date(a.addedAt).getTime();
                    bValue = new Date(b.addedAt).getTime();
                    break;
                case 'name':
                    aValue = a.fileName.toLowerCase();
                    bValue = b.fileName.toLowerCase();
                    break;
                case 'size':
                    aValue = parseFloat(a.fileSize) || 0;
                    bValue = parseFloat(b.fileSize) || 0;
                    break;
                case 'time':
                    aValue = new Date(a.uploadTime).getTime() || 0;
                    bValue = new Date(b.uploadTime).getTime() || 0;
                    break;
                default:
                    aValue = new Date(a.addedAt).getTime();
                    bValue = new Date(b.addedAt).getTime();
            }
            
            if (sortOrder === 'desc') {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            } else {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            }
        });

        // 分页
        const total = filesWithMetadata.length;
        const paginatedFiles = filesWithMetadata.slice(start, start + count);

        return new Response(JSON.stringify({
            success: true,
            files: paginatedFiles,
            total: total,
            start: start,
            count: paginatedFiles.length,
            hasMore: start + count < total
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to get favorite files: ${error.message}`);
    }
}

/**
 * 添加文件到收藏夹
 */
async function addToFavorites(kv, request) {
    try {
        const body = await request.json();
        const { fileId, groupId = 'default', note = '' } = body;

        if (!fileId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'File ID is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 解码文件路径
        const filePath = decodeURIComponent(fileId.split(',').join('/'));

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

        // 获取分组的收藏文件列表
        const groupFilesStr = await kv.get(`manage@favorite_files@${groupId}`);
        const groupFiles = groupFilesStr ? JSON.parse(groupFilesStr) : { files: [] };

        // 检查文件是否已经在收藏夹中
        const existingFavorite = groupFiles.files.find(f => f.fileId === filePath);
        if (existingFavorite) {
            return new Response(JSON.stringify({
                success: false,
                error: 'File is already in favorites'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 创建收藏记录
        const favoriteId = generateFavoriteId();
        const favoriteEntry = {
            id: favoriteId,
            fileId: filePath,
            groupId: groupId,
            addedAt: new Date().toISOString(),
            note: note.trim()
        };

        // 添加到分组文件列表
        groupFiles.files.push(favoriteEntry);
        await kv.put(`manage@favorite_files@${groupId}`, JSON.stringify(groupFiles));

        // 更新文件的收藏状态
        await addFavoriteToFile(kv, filePath, favoriteEntry);

        return new Response(JSON.stringify({
            success: true,
            favorite: favoriteEntry,
            message: 'File added to favorites successfully'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to add to favorites: ${error.message}`);
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
