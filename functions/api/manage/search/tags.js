/**
 * 按标签搜索文件 API
 * 支持按单个或多个标签搜索文件
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

    if (method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        return await searchFilesByTags(kv, url);
    } catch (error) {
        console.error('Search files by tags error:', error);
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
 * 按标签搜索文件
 */
async function searchFilesByTags(kv, url) {
    try {
        const searchParams = url.searchParams;
        const tagsParam = searchParams.get('tags');
        const dir = searchParams.get('dir') || '';
        const start = parseInt(searchParams.get('start') || '0');
        const count = parseInt(searchParams.get('count') || '50');
        const sortBy = searchParams.get('sortBy') || 'name';
        const sortOrder = searchParams.get('sortOrder') || 'asc';

        if (!tagsParam) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Tags parameter is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const tagIds = tagsParam.split(',').map(id => id.trim()).filter(id => id);
        
        if (tagIds.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'At least one tag ID is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 获取匹配的文件列表
        let matchingFiles = [];
        
        if (tagIds.length === 1) {
            // 单个标签搜索
            matchingFiles = await getFilesByTag(kv, tagIds[0]);
        } else {
            // 多个标签搜索（交集）
            matchingFiles = await getFilesByMultipleTags(kv, tagIds);
        }

        // 过滤目录
        if (dir) {
            matchingFiles = matchingFiles.filter(filePath => 
                filePath.startsWith(dir + '/') || filePath === dir
            );
        }

        // 获取文件详细信息
        const filesWithMetadata = [];
        for (const filePath of matchingFiles) {
            try {
                const fileRecord = await kv.getWithMetadata(filePath);
                if (fileRecord && fileRecord.metadata) {
                    const metadata = fileRecord.metadata;
                    
                    // 获取文件标签
                    const fileTagsStr = await kv.get(`manage@file_tags@${filePath}`);
                    const fileTags = fileTagsStr ? JSON.parse(fileTagsStr) : { tags: [] };
                    
                    filesWithMetadata.push({
                        name: filePath,
                        fileName: metadata.FileName || filePath,
                        fileType: metadata.FileType || '',
                        fileSize: metadata.FileSize || '',
                        uploadTime: metadata.TimeStamp || '',
                        directory: metadata.Directory || '',
                        tags: fileTags.tags,
                        metadata: metadata
                    });
                }
            } catch (error) {
                console.error(`Error getting metadata for file ${filePath}:`, error);
            }
        }

        // 排序
        filesWithMetadata.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
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
                case 'type':
                    aValue = a.fileType.toLowerCase();
                    bValue = b.fileType.toLowerCase();
                    break;
                default:
                    aValue = a.fileName.toLowerCase();
                    bValue = b.fileName.toLowerCase();
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
        throw new Error(`Failed to search files by tags: ${error.message}`);
    }
}

/**
 * 获取单个标签的所有文件
 */
async function getFilesByTag(kv, tagId) {
    try {
        const tagFilesStr = await kv.get(`manage@tag_files@${tagId}`);
        const tagFiles = tagFilesStr ? JSON.parse(tagFilesStr) : { files: [] };
        return tagFiles.files;
    } catch (error) {
        console.error(`Error getting files for tag ${tagId}:`, error);
        return [];
    }
}

/**
 * 获取多个标签的交集文件
 */
async function getFilesByMultipleTags(kv, tagIds) {
    try {
        if (tagIds.length === 0) return [];
        
        // 获取第一个标签的文件列表
        let intersectionFiles = await getFilesByTag(kv, tagIds[0]);
        
        // 与其他标签的文件列表求交集
        for (let i = 1; i < tagIds.length; i++) {
            const tagFiles = await getFilesByTag(kv, tagIds[i]);
            intersectionFiles = intersectionFiles.filter(file => tagFiles.includes(file));
            
            // 如果交集为空，提前退出
            if (intersectionFiles.length === 0) break;
        }
        
        return intersectionFiles;
    } catch (error) {
        console.error('Error getting files by multiple tags:', error);
        return [];
    }
}
