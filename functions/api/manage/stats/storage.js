/**
 * 存储使用情况统计 API
 * 提供存储空间使用情况和分析数据
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

    if (method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        return await getStorageUsage(kv, env);
    } catch (error) {
        console.error('Storage stats API error:', error);
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
 * 获取存储使用情况
 */
async function getStorageUsage(kv, env) {
    try {
        // 获取存储统计缓存
        const cacheKey = 'manage@storage_stats@cache';
        const cachedStatsStr = await kv.get(cacheKey);
        let cachedStats = null;
        
        if (cachedStatsStr) {
            cachedStats = JSON.parse(cachedStatsStr);
            const cacheAge = Date.now() - new Date(cachedStats.lastUpdated).getTime();
            
            // 如果缓存时间小于1小时，直接返回缓存数据
            if (cacheAge < 3600000) { // 1小时 = 3600000毫秒
                return new Response(JSON.stringify({
                    success: true,
                    cached: true,
                    ...cachedStats
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 计算实时存储使用情况
        const storageStats = await calculateStorageUsage(kv);
        
        // 缓存结果
        const cacheData = {
            ...storageStats,
            lastUpdated: new Date().toISOString()
        };
        
        // 异步更新缓存，不阻塞响应
        kv.put(cacheKey, JSON.stringify(cacheData));

        return new Response(JSON.stringify({
            success: true,
            cached: false,
            ...storageStats
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to get storage usage: ${error.message}`);
    }
}

/**
 * 计算存储使用情况
 */
async function calculateStorageUsage(kv) {
    const stats = {
        totalSize: 0,
        totalFiles: 0,
        channelStats: {
            'CloudflareR2': { size: 0, count: 0 },
            'S3': { size: 0, count: 0 },
            'Telegram': { size: 0, count: 0 },
            'External': { size: 0, count: 0 },
            'Unknown': { size: 0, count: 0 }
        },
        typeStats: {
            'images': { size: 0, count: 0 },
            'videos': { size: 0, count: 0 },
            'audio': { size: 0, count: 0 },
            'documents': { size: 0, count: 0 },
            'archives': { size: 0, count: 0 },
            'others': { size: 0, count: 0 }
        },
        sizeDistribution: {
            'small': { size: 0, count: 0, range: '< 1MB' },      // < 1MB
            'medium': { size: 0, count: 0, range: '1MB - 10MB' }, // 1MB - 10MB
            'large': { size: 0, count: 0, range: '10MB - 100MB' }, // 10MB - 100MB
            'xlarge': { size: 0, count: 0, range: '> 100MB' }     // > 100MB
        },
        directoryStats: {},
        uploadTrends: []
    };

    try {
        // 获取所有文件的键
        const listResult = await kv.list();
        
        for (const key of listResult.keys) {
            // 跳过管理相关的键
            if (key.name.startsWith('manage@')) continue;
            
            try {
                const fileRecord = await kv.getWithMetadata(key.name);
                if (!fileRecord || !fileRecord.metadata) continue;

                const metadata = fileRecord.metadata;
                const fileSize = parseFloat(metadata.FileSize) || 0;
                const channel = metadata.Channel || 'Unknown';
                const fileType = getFileTypeCategory(metadata.FileType || '');
                const directory = metadata.Directory || 'root';
                const uploadDate = metadata.TimeStamp ? new Date(metadata.TimeStamp) : null;

                // 总计统计
                stats.totalSize += fileSize;
                stats.totalFiles++;

                // 渠道统计
                if (stats.channelStats[channel]) {
                    stats.channelStats[channel].size += fileSize;
                    stats.channelStats[channel].count++;
                }

                // 类型统计
                if (stats.typeStats[fileType]) {
                    stats.typeStats[fileType].size += fileSize;
                    stats.typeStats[fileType].count++;
                }

                // 大小分布统计
                const sizeCategory = getSizeCategory(fileSize);
                if (stats.sizeDistribution[sizeCategory]) {
                    stats.sizeDistribution[sizeCategory].size += fileSize;
                    stats.sizeDistribution[sizeCategory].count++;
                }

                // 目录统计
                if (!stats.directoryStats[directory]) {
                    stats.directoryStats[directory] = { size: 0, count: 0 };
                }
                stats.directoryStats[directory].size += fileSize;
                stats.directoryStats[directory].count++;

                // 上传趋势统计（按月）
                if (uploadDate) {
                    const monthKey = uploadDate.toISOString().substr(0, 7); // YYYY-MM
                    let trendEntry = stats.uploadTrends.find(entry => entry.month === monthKey);
                    if (!trendEntry) {
                        trendEntry = {
                            month: monthKey,
                            size: 0,
                            count: 0
                        };
                        stats.uploadTrends.push(trendEntry);
                    }
                    trendEntry.size += fileSize;
                    trendEntry.count++;
                }
            } catch (error) {
                console.error(`Error processing file ${key.name}:`, error);
            }
        }

        // 排序上传趋势
        stats.uploadTrends.sort((a, b) => a.month.localeCompare(b.month));

        // 计算百分比
        stats.channelPercentages = {};
        stats.typePercentages = {};
        
        for (const [channel, data] of Object.entries(stats.channelStats)) {
            stats.channelPercentages[channel] = stats.totalSize > 0 ? 
                (data.size / stats.totalSize * 100).toFixed(2) : 0;
        }
        
        for (const [type, data] of Object.entries(stats.typeStats)) {
            stats.typePercentages[type] = stats.totalSize > 0 ? 
                (data.size / stats.totalSize * 100).toFixed(2) : 0;
        }

        return stats;
    } catch (error) {
        console.error('Error calculating storage usage:', error);
        throw error;
    }
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
 * 获取文件大小分类
 */
function getSizeCategory(sizeInMB) {
    if (sizeInMB < 1) return 'small';
    if (sizeInMB < 10) return 'medium';
    if (sizeInMB < 100) return 'large';
    return 'xlarge';
}
