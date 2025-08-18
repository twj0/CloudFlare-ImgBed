/**
 * 收藏夹文件移除 API
 * 支持从收藏夹中移除指定文件
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
        switch (method) {
            case 'DELETE':
                return await removeFromFavorites(kv, filePath, url);
            default:
                return new Response('Method not allowed', { status: 405 });
        }
    } catch (error) {
        console.error('Remove from favorites API error:', error);
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
 * 从收藏夹移除文件
 */
async function removeFromFavorites(kv, filePath, url) {
    try {
        const searchParams = url.searchParams;
        const groupId = searchParams.get('groupId');

        // 获取文件的收藏信息
        const fileFavoritesStr = await kv.get(`manage@file_favorites@${filePath}`);
        const fileFavorites = fileFavoritesStr ? JSON.parse(fileFavoritesStr) : { favorites: [] };

        if (fileFavorites.favorites.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'File is not in any favorites'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let removedCount = 0;
        const removedGroups = [];

        if (groupId) {
            // 从指定分组移除
            const favoriteIndex = fileFavorites.favorites.findIndex(f => f.groupId === groupId);
            if (favoriteIndex === -1) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'File is not in the specified favorite group'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const favorite = fileFavorites.favorites[favoriteIndex];
            
            // 从分组文件列表中移除
            await removeFileFromGroup(kv, groupId, filePath, favorite.id);
            
            // 从文件收藏列表中移除
            fileFavorites.favorites.splice(favoriteIndex, 1);
            removedCount = 1;
            removedGroups.push(groupId);
        } else {
            // 从所有分组移除
            for (const favorite of fileFavorites.favorites) {
                await removeFileFromGroup(kv, favorite.groupId, filePath, favorite.id);
                removedGroups.push(favorite.groupId);
            }
            removedCount = fileFavorites.favorites.length;
            fileFavorites.favorites = [];
        }

        // 更新文件收藏状态
        if (fileFavorites.favorites.length > 0) {
            await kv.put(`manage@file_favorites@${filePath}`, JSON.stringify(fileFavorites));
        } else {
            await kv.delete(`manage@file_favorites@${filePath}`);
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Removed file from ${removedCount} favorite group(s)`,
            removedCount: removedCount,
            removedGroups: removedGroups
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to remove from favorites: ${error.message}`);
    }
}

/**
 * 从分组文件列表中移除文件
 */
async function removeFileFromGroup(kv, groupId, filePath, favoriteId) {
    try {
        const groupFilesStr = await kv.get(`manage@favorite_files@${groupId}`);
        const groupFiles = groupFilesStr ? JSON.parse(groupFilesStr) : { files: [] };
        
        // 找到并移除对应的收藏记录
        const fileIndex = groupFiles.files.findIndex(f => f.fileId === filePath && f.id === favoriteId);
        if (fileIndex > -1) {
            groupFiles.files.splice(fileIndex, 1);
            await kv.put(`manage@favorite_files@${groupId}`, JSON.stringify(groupFiles));
        }
    } catch (error) {
        console.error(`Failed to remove file ${filePath} from group ${groupId}:`, error);
    }
}
