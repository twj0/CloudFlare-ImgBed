/**
 * 创建文件夹 API
 * POST /api/manage/folders/create
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
        const { name, path = '/', description = '', permissions = 'public', tags = [] } = requestData;

        // 验证必需参数
        if (!name || typeof name !== 'string') {
            return createResponse({
                success: false,
                error: '文件夹名称不能为空'
            }, 400);
        }

        // 验证文件夹名称格式
        const folderNameRegex = /^[^<>:"/\\|?*\x00-\x1f]+$/;
        if (!folderNameRegex.test(name.trim())) {
            return createResponse({
                success: false,
                error: '文件夹名称包含非法字符'
            }, 400);
        }

        const folderName = name.trim();
        const folderPath = path.endsWith('/') ? path : path + '/';
        const fullPath = folderPath + folderName;

        // 检查文件夹是否已存在
        const existingFolder = await env.img_url.get(`folder:${fullPath}`);
        if (existingFolder) {
            return createResponse({
                success: false,
                error: '文件夹已存在'
            }, 409);
        }

        // 创建文件夹元数据
        const folderMetadata = {
            name: folderName,
            path: folderPath,
            fullPath: fullPath,
            type: 'folder',
            description: description.trim(),
            permissions,
            tags: Array.isArray(tags) ? tags : [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            size: 0,
            itemCount: 0
        };

        // 保存文件夹信息到 KV
        await env.img_url.put(
            `folder:${fullPath}`,
            JSON.stringify(folderMetadata),
            {
                metadata: {
                    type: 'folder',
                    path: folderPath,
                    name: folderName,
                    createdAt: folderMetadata.createdAt
                }
            }
        );

        // 更新父文件夹的子项目列表
        if (folderPath !== '/') {
            const parentPath = folderPath.slice(0, -1).split('/').slice(0, -1).join('/') || '/';
            const parentKey = `folder:${parentPath}`;
            const parentFolder = await env.img_url.get(parentKey);
            
            if (parentFolder) {
                const parentData = JSON.parse(parentFolder);
                if (!parentData.children) {
                    parentData.children = [];
                }
                parentData.children.push({
                    name: folderName,
                    type: 'folder',
                    path: fullPath
                });
                parentData.itemCount = (parentData.itemCount || 0) + 1;
                parentData.updatedAt = new Date().toISOString();
                
                await env.img_url.put(parentKey, JSON.stringify(parentData));
            }
        }

        // 记录操作日志
        const logEntry = {
            action: 'folder_create',
            folderPath: fullPath,
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('User-Agent') || 'Unknown'
        };

        await env.img_url.put(
            `log:folder_create:${Date.now()}`,
            JSON.stringify(logEntry),
            { expirationTtl: 30 * 24 * 60 * 60 } // 30天过期
        );

        return createResponse({
            success: true,
            message: '文件夹创建成功',
            data: {
                folder: folderMetadata
            }
        });

    } catch (error) {
        console.error('Create folder error:', error);
        return createResponse({
            success: false,
            error: '创建文件夹失败: ' + error.message
        }, 500);
    }
}

/**
 * 批量创建文件夹 API
 * POST /api/manage/folders/batch-create
 */
export async function onRequestPost_Batch(context) {
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
        for (const folder of folders) {
            if (!folder.name || !folderNameRegex.test(folder.name.trim())) {
                errors.push({
                    name: folder.name || 'unnamed',
                    error: '文件夹名称格式不正确'
                });
                continue;
            }

            const fullPath = folderPath + folder.name.trim();
            
            // 检查是否已存在
            const existing = await env.img_url.get(`folder:${fullPath}`);
            if (existing) {
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
                    fullPath: fullPath,
                    type: 'folder',
                    description: folder.description || '',
                    permissions: folder.permissions || 'public',
                    tags: folder.tags || [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    size: 0,
                    itemCount: 0
                };

                await env.img_url.put(
                    `folder:${fullPath}`,
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
                    path: fullPath,
                    success: true
                });

            } catch (error) {
                errors.push({
                    name: folder.name,
                    error: error.message
                });
            }
        }

        // 记录批量操作日志
        const logEntry = {
            action: 'folder_batch_create',
            path: folderPath,
            successCount: results.length,
            errorCount: errors.length,
            timestamp: new Date().toISOString()
        };

        await env.img_url.put(
            `log:folder_batch_create:${Date.now()}`,
            JSON.stringify(logEntry),
            { expirationTtl: 30 * 24 * 60 * 60 }
        );

        return createResponse({
            success: true,
            message: `批量创建完成，成功 ${results.length} 个，失败 ${errors.length} 个`,
            data: {
                results,
                errors,
                summary: {
                    total: folders.length,
                    success: results.length,
                    failed: errors.length
                }
            }
        });

    } catch (error) {
        console.error('Batch create folders error:', error);
        return createResponse({
            success: false,
            error: '批量创建文件夹失败: ' + error.message
        }, 500);
    }
}
