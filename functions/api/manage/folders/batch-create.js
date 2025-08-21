/**
 * 批量创建文件夹 API
 * POST /api/manage/folders/batch-create
 */

import { corsHeaders, createResponse } from '../../../utils/middleware.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        // CORS 预检请求处理
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // 解析请求体
        const requestData = await request.json();
        const { folders, path = '/' } = requestData;

        // 验证参数
        if (!Array.isArray(folders) || folders.length === 0) {
            return createResponse({
                success: false,
                error: '文件夹列表不能为空'
            }, 400);
        }

        if (folders.length > 50) {
            return createResponse({
                success: false,
                error: '单次最多创建50个文件夹'
            }, 400);
        }

        const results = [];
        const errors = [];
        const folderPath = path.endsWith('/') ? path : path + '/';

        // 验证所有文件夹名称
        const folderNameRegex = /^[^<>:"/\\|?*\x00-\x1f]+$/;
        
        // 批量检查现有文件夹
        const existingChecks = await Promise.all(
            folders.map(async (folder) => {
                if (!folder.name || !folderNameRegex.test(folder.name.trim())) {
                    return { name: folder.name || 'unnamed', exists: false, invalid: true };
                }
                
                const fullPath = folderPath + folder.name.trim();
                const existing = await env.img_url.get(`folder:${fullPath}`);
                return { 
                    name: folder.name, 
                    fullPath, 
                    exists: !!existing, 
                    invalid: false 
                };
            })
        );

        // 处理每个文件夹
        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];
            const check = existingChecks[i];

            if (check.invalid) {
                errors.push({
                    name: check.name,
                    error: '文件夹名称格式不正确'
                });
                continue;
            }

            if (check.exists) {
                errors.push({
                    name: folder.name,
                    error: '文件夹已存在'
                });
                continue;
            }

            // 创建文件夹
            try {
                const folderMetadata = {
                    name: folder.name.trim(),
                    path: folderPath,
                    fullPath: check.fullPath,
                    type: 'folder',
                    description: folder.description || '',
                    permissions: folder.permissions || 'public',
                    tags: Array.isArray(folder.tags) ? folder.tags : [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    size: 0,
                    itemCount: 0
                };

                // 保存文件夹信息
                await env.img_url.put(
                    `folder:${check.fullPath}`,
                    JSON.stringify(folderMetadata),
                    {
                        metadata: {
                            type: 'folder',
                            path: folderPath,
                            name: folder.name.trim(),
                            createdAt: folderMetadata.createdAt
                        }
                    }
                );

                results.push({
                    name: folder.name,
                    path: check.fullPath,
                    success: true,
                    metadata: folderMetadata
                });

            } catch (error) {
                console.error(`Error creating folder ${folder.name}:`, error);
                errors.push({
                    name: folder.name,
                    error: error.message || '创建失败'
                });
            }
        }

        // 如果有成功创建的文件夹，更新父文件夹信息
        if (results.length > 0 && folderPath !== '/') {
            try {
                const parentPath = folderPath.slice(0, -1).split('/').slice(0, -1).join('/') || '/';
                const parentKey = `folder:${parentPath}`;
                const parentFolder = await env.img_url.get(parentKey);
                
                if (parentFolder) {
                    const parentData = JSON.parse(parentFolder);
                    if (!parentData.children) {
                        parentData.children = [];
                    }
                    
                    // 添加新创建的文件夹到父文件夹的子项目列表
                    results.forEach(result => {
                        parentData.children.push({
                            name: result.name,
                            type: 'folder',
                            path: result.path
                        });
                    });
                    
                    parentData.itemCount = (parentData.itemCount || 0) + results.length;
                    parentData.updatedAt = new Date().toISOString();
                    
                    await env.img_url.put(parentKey, JSON.stringify(parentData));
                }
            } catch (error) {
                console.error('Error updating parent folder:', error);
                // 不影响主要操作，只记录错误
            }
        }

        // 记录批量操作日志
        try {
            const logEntry = {
                action: 'folder_batch_create',
                path: folderPath,
                successCount: results.length,
                errorCount: errors.length,
                folders: results.map(r => r.name),
                timestamp: new Date().toISOString(),
                userAgent: request.headers.get('User-Agent') || 'Unknown'
            };

            await env.img_url.put(
                `log:folder_batch_create:${Date.now()}`,
                JSON.stringify(logEntry),
                { expirationTtl: 30 * 24 * 60 * 60 } // 30天过期
            );
        } catch (error) {
            console.error('Error logging batch create:', error);
        }

        // 返回结果
        const response = {
            success: true,
            message: `批量创建完成，成功 ${results.length} 个，失败 ${errors.length} 个`,
            data: {
                results,
                errors,
                summary: {
                    total: folders.length,
                    success: results.length,
                    failed: errors.length,
                    successRate: Math.round((results.length / folders.length) * 100)
                }
            }
        };

        return createResponse(response);

    } catch (error) {
        console.error('Batch create folders error:', error);
        return createResponse({
            success: false,
            error: '批量创建文件夹失败: ' + error.message
        }, 500);
    }
}

// 处理 OPTIONS 请求
export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders });
}
