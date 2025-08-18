/**
 * 文件统计分析 API
 * 提供文件访问、下载、分享等统计数据
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
        return await getFileStats(kv, url);
    } catch (error) {
        console.error('File stats API error:', error);
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
 * 获取文件统计数据
 */
async function getFileStats(kv, url) {
    try {
        const searchParams = url.searchParams;
        const period = searchParams.get('period') || '7d';
        const type = searchParams.get('type') || 'all';
        const groupBy = searchParams.get('groupBy') || 'day';
        const detailed = searchParams.get('detailed') === 'true';
        const start = parseInt(searchParams.get('start') || '0');
        const count = parseInt(searchParams.get('count') || '50');

        // 计算时间范围
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(endDate.getDate() - 7);
        }

        // 获取统计索引
        const statsIndexStr = await kv.get('manage@stats@index');
        const statsIndex = statsIndexStr ? JSON.parse(statsIndexStr) : { files: [] };

        // 收集统计数据
        const stats = {
            totalFiles: 0,
            totalViews: 0,
            totalDownloads: 0,
            totalShares: 0,
            fileTypeStats: {},
            timeSeriesData: [],
            files: []
        };

        // 如果需要详细数据，获取文件列表
        if (detailed) {
            const allFiles = await getAllFilesWithStats(kv, statsIndex.files, startDate, endDate, type);
            
            // 排序和分页
            allFiles.sort((a, b) => (b.totalAccess || 0) - (a.totalAccess || 0));
            const paginatedFiles = allFiles.slice(start, start + count);
            
            stats.files = paginatedFiles;
            stats.total = allFiles.length;
        }

        // 计算汇总统计
        for (const fileId of statsIndex.files) {
            try {
                const fileStatsStr = await kv.get(`manage@file_stats@${fileId}`);
                if (!fileStatsStr) continue;

                const fileStats = JSON.parse(fileStatsStr);
                
                // 过滤时间范围内的访问记录
                const filteredLogs = (fileStats.accessLogs || []).filter(log => {
                    const logDate = new Date(log.accessTime);
                    return logDate >= startDate && logDate <= endDate;
                });

                if (filteredLogs.length === 0) continue;

                // 获取文件元数据
                const fileRecord = await kv.getWithMetadata(fileId);
                if (!fileRecord || !fileRecord.metadata) continue;

                const metadata = fileRecord.metadata;
                
                // 文件类型过滤
                if (type !== 'all') {
                    const fileType = metadata.FileType || '';
                    if (!fileType.startsWith(type + '/')) continue;
                }

                stats.totalFiles++;

                // 统计访问类型
                const viewCount = filteredLogs.filter(log => log.accessType === 'view').length;
                const downloadCount = filteredLogs.filter(log => log.accessType === 'download').length;
                const shareCount = filteredLogs.filter(log => log.accessType === 'share').length;

                stats.totalViews += viewCount;
                stats.totalDownloads += downloadCount;
                stats.totalShares += shareCount;

                // 文件类型统计
                const fileType = getFileTypeCategory(metadata.FileType || '');
                if (!stats.fileTypeStats[fileType]) {
                    stats.fileTypeStats[fileType] = {
                        count: 0,
                        views: 0,
                        downloads: 0,
                        shares: 0
                    };
                }
                stats.fileTypeStats[fileType].count++;
                stats.fileTypeStats[fileType].views += viewCount;
                stats.fileTypeStats[fileType].downloads += downloadCount;
                stats.fileTypeStats[fileType].shares += shareCount;

                // 时间序列数据
                for (const log of filteredLogs) {
                    const logDate = new Date(log.accessTime);
                    const timeKey = formatTimeKey(logDate, groupBy);
                    
                    let timeEntry = stats.timeSeriesData.find(entry => entry.time === timeKey);
                    if (!timeEntry) {
                        timeEntry = {
                            time: timeKey,
                            views: 0,
                            downloads: 0,
                            shares: 0
                        };
                        stats.timeSeriesData.push(timeEntry);
                    }
                    
                    timeEntry[log.accessType + 's']++;
                }
            } catch (error) {
                console.error(`Error processing stats for file ${fileId}:`, error);
            }
        }

        // 排序时间序列数据
        stats.timeSeriesData.sort((a, b) => new Date(a.time) - new Date(b.time));

        return new Response(JSON.stringify({
            success: true,
            period: period,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            ...stats
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to get file stats: ${error.message}`);
    }
}

/**
 * 获取所有文件的详细统计信息
 */
async function getAllFilesWithStats(kv, fileIds, startDate, endDate, type) {
    const files = [];
    
    for (const fileId of fileIds) {
        try {
            const fileStatsStr = await kv.get(`manage@file_stats@${fileId}`);
            if (!fileStatsStr) continue;

            const fileStats = JSON.parse(fileStatsStr);
            const fileRecord = await kv.getWithMetadata(fileId);
            if (!fileRecord || !fileRecord.metadata) continue;

            const metadata = fileRecord.metadata;
            
            // 文件类型过滤
            if (type !== 'all') {
                const fileType = metadata.FileType || '';
                if (!fileType.startsWith(type + '/')) continue;
            }

            // 过滤时间范围内的访问记录
            const filteredLogs = (fileStats.accessLogs || []).filter(log => {
                const logDate = new Date(log.accessTime);
                return logDate >= startDate && logDate <= endDate;
            });

            const viewCount = filteredLogs.filter(log => log.accessType === 'view').length;
            const downloadCount = filteredLogs.filter(log => log.accessType === 'download').length;
            const shareCount = filteredLogs.filter(log => log.accessType === 'share').length;
            const totalAccess = viewCount + downloadCount + shareCount;

            if (totalAccess > 0) {
                files.push({
                    fileId: fileId,
                    fileName: metadata.FileName || fileId,
                    fileType: metadata.FileType || '',
                    fileSize: metadata.FileSize || '',
                    uploadTime: metadata.TimeStamp || '',
                    viewCount: viewCount,
                    downloadCount: downloadCount,
                    shareCount: shareCount,
                    totalAccess: totalAccess,
                    lastAccessed: filteredLogs.length > 0 ? 
                        Math.max(...filteredLogs.map(log => new Date(log.accessTime).getTime())) : null
                });
            }
        } catch (error) {
            console.error(`Error processing file ${fileId}:`, error);
        }
    }
    
    return files;
}

/**
 * 获取文件类型分类
 */
function getFileTypeCategory(mimeType) {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('text/') || mimeType.includes('document') || mimeType.includes('pdf')) return 'documents';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archives';
    return 'others';
}

/**
 * 格式化时间键
 */
function formatTimeKey(date, groupBy) {
    switch (groupBy) {
        case 'hour':
            return date.toISOString().substr(0, 13) + ':00:00.000Z';
        case 'day':
            return date.toISOString().substr(0, 10) + 'T00:00:00.000Z';
        case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            return weekStart.toISOString().substr(0, 10) + 'T00:00:00.000Z';
        case 'month':
            return date.toISOString().substr(0, 7) + '-01T00:00:00.000Z';
        default:
            return date.toISOString().substr(0, 10) + 'T00:00:00.000Z';
    }
}
