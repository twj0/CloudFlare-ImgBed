import { readIndex } from "../../utils/indexManager.js";

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    
    try {
        // 获取查询参数
        const query = url.searchParams.get('q') || '';
        const type = url.searchParams.get('type') || 'all'; // all, image, video, audio, document
        const dir = url.searchParams.get('dir') || '';
        const start = parseInt(url.searchParams.get('start') || '0');
        const count = parseInt(url.searchParams.get('count') || '50');
        const sortBy = url.searchParams.get('sortBy') || 'name'; // name, date, size, type
        const sortOrder = url.searchParams.get('sortOrder') || 'asc'; // asc, desc
        const channel = url.searchParams.get('channel') || '';
        const listType = url.searchParams.get('listType') || '';
        const recursive = url.searchParams.get('recursive') === 'true';

        if (!query.trim()) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Search query is required'
            }), { status: 400 });
        }

        // 使用索引进行搜索
        const result = await searchFiles(context, {
            query: query.trim(),
            type,
            directory: dir,
            start,
            count,
            sortBy,
            sortOrder,
            channel,
            listType,
            recursive
        });

        if (!result.success) {
            // 如果索引搜索失败，回退到KV搜索
            const kvResult = await searchFilesInKV(env, {
                query: query.trim(),
                type,
                directory: dir,
                start,
                count,
                sortBy,
                sortOrder
            });
            
            return new Response(JSON.stringify({
                ...kvResult,
                isIndexedResponse: false
            }));
        }

        // 转换文件格式以保持兼容性
        const compatibleFiles = result.files.map(file => ({
            name: file.id,
            metadata: file.metadata
        }));

        return new Response(JSON.stringify({
            files: compatibleFiles,
            directories: result.directories || [],
            totalCount: result.totalCount,
            returnedCount: result.returnedCount,
            query: query.trim(),
            type,
            sortBy,
            sortOrder,
            isIndexedResponse: true
        }));

    } catch (error) {
        console.error('Search error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            message: error.message
        }), { status: 500 });
    }
}

// 使用索引进行搜索
async function searchFiles(context, options) {
    const { query, type, directory, start, count, sortBy, sortOrder, channel, listType, recursive } = options;
    
    try {
        // 构建搜索条件
        const searchOptions = {
            search: query,
            directory,
            start,
            count,
            channel,
            listType,
            includeSubdirFiles: recursive
        };

        // 调用索引搜索
        const result = await readIndex(context, searchOptions);
        
        if (!result.success) {
            return { success: false };
        }

        // 按文件类型过滤
        let filteredFiles = result.files;
        if (type !== 'all') {
            filteredFiles = filteredFiles.filter(file => {
                const fileType = getFileType(file.metadata.FileName || file.id);
                return fileType === type;
            });
        }

        // 排序
        filteredFiles = sortFiles(filteredFiles, sortBy, sortOrder);

        return {
            success: true,
            files: filteredFiles,
            directories: result.directories || [],
            totalCount: filteredFiles.length,
            returnedCount: filteredFiles.length
        };
    } catch (error) {
        console.error('Index search failed:', error);
        return { success: false };
    }
}

// 在KV中搜索文件（回退方案）
async function searchFilesInKV(env, options) {
    const { query, type, directory, start, count, sortBy, sortOrder } = options;
    
    try {
        const allFiles = [];
        const directories = new Set();
        let cursor = null;

        // 分页获取所有文件
        while (true) {
            const response = await env.img_url.list({
                prefix: directory,
                limit: 1000,
                cursor: cursor
            });

            cursor = response.cursor;

            for (const item of response.keys) {
                // 跳过管理相关的键
                if (item.name.startsWith('manage@') || item.name.startsWith('chunk_')) {
                    continue;
                }

                // 跳过没有元数据的文件
                if (!item.metadata || !item.metadata.TimeStamp) {
                    continue;
                }

                // 检查是否匹配搜索条件
                const fileName = item.metadata.FileName || item.name;
                if (fileName.toLowerCase().includes(query.toLowerCase())) {
                    // 按文件类型过滤
                    if (type === 'all' || getFileType(fileName) === type) {
                        allFiles.push({
                            name: item.name,
                            metadata: item.metadata
                        });
                    }
                }

                // 收集目录信息
                const pathParts = item.name.split('/');
                if (pathParts.length > 1) {
                    for (let i = 1; i < pathParts.length; i++) {
                        const dirPath = pathParts.slice(0, i).join('/') + '/';
                        directories.add(dirPath);
                    }
                }
            }

            if (!cursor) break;
            
            // 添加协作点
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // 排序
        const sortedFiles = sortFiles(allFiles, sortBy, sortOrder);

        // 分页
        const paginatedFiles = sortedFiles.slice(start, start + count);

        return {
            success: true,
            files: paginatedFiles,
            directories: Array.from(directories),
            totalCount: sortedFiles.length,
            returnedCount: paginatedFiles.length
        };
    } catch (error) {
        console.error('KV search failed:', error);
        return {
            success: false,
            files: [],
            directories: [],
            totalCount: 0,
            returnedCount: 0
        };
    }
}

// 获取文件类型
function getFileType(fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'];
    const audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'];
    const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'];
    
    if (imageTypes.includes(ext)) return 'image';
    if (videoTypes.includes(ext)) return 'video';
    if (audioTypes.includes(ext)) return 'audio';
    if (documentTypes.includes(ext)) return 'document';
    
    return 'other';
}

// 文件排序
function sortFiles(files, sortBy, sortOrder) {
    return files.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'name':
                aValue = (a.metadata.FileName || a.name).toLowerCase();
                bValue = (b.metadata.FileName || b.name).toLowerCase();
                break;
            case 'date':
                aValue = new Date(a.metadata.TimeStamp);
                bValue = new Date(b.metadata.TimeStamp);
                break;
            case 'size':
                aValue = parseFloat(a.metadata.FileSize || 0);
                bValue = parseFloat(b.metadata.FileSize || 0);
                break;
            case 'type':
                aValue = a.metadata.FileType || '';
                bValue = b.metadata.FileType || '';
                break;
            default:
                aValue = (a.metadata.FileName || a.name).toLowerCase();
                bValue = (b.metadata.FileName || b.name).toLowerCase();
        }
        
        let result;
        if (aValue < bValue) result = -1;
        else if (aValue > bValue) result = 1;
        else result = 0;
        
        return sortOrder === 'desc' ? -result : result;
    });
}
