import { S3Client, DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { purgeCFCache } from "../../utils/purgeCache";
import { batchRemoveFilesFromIndex, batchMoveFilesInIndex } from "../../utils/indexManager.js";

export async function onRequest(context) {
    const { request, env, waitUntil } = context;

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    
    try {
        const body = await request.json();
        const { action, files, targetPath } = body;

        if (!action || !files || !Array.isArray(files) || files.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid request parameters'
            }), { status: 400 });
        }

        let result;
        switch (action) {
            case 'delete':
                result = await batchDeleteFiles(env, files, url, context, waitUntil);
                break;
            case 'move':
                if (!targetPath) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Target path is required for move operation'
                    }), { status: 400 });
                }
                result = await batchMoveFiles(env, files, targetPath, url, context, waitUntil);
                break;
            case 'copy':
                if (!targetPath) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Target path is required for copy operation'
                    }), { status: 400 });
                }
                result = await batchCopyFiles(env, files, targetPath, url, context, waitUntil);
                break;
            default:
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Unsupported action'
                }), { status: 400 });
        }

        return new Response(JSON.stringify(result));
    } catch (e) {
        console.error('Batch operation error:', e);
        return new Response(JSON.stringify({
            success: false,
            error: e.message
        }), { status: 500 });
    }
}

// 批量删除文件
async function batchDeleteFiles(env, files, url, context, waitUntil) {
    const results = {
        success: true,
        processed: 0,
        failed: 0,
        errors: []
    };

    const deletedFiles = [];

    for (const fileId of files) {
        try {
            const cdnUrl = `https://${url.hostname}/file/${fileId}`;
            const success = await deleteFile(env, fileId, cdnUrl);
            
            if (success) {
                results.processed++;
                deletedFiles.push(fileId);
            } else {
                results.failed++;
                results.errors.push(`Failed to delete ${fileId}`);
            }
        } catch (error) {
            results.failed++;
            results.errors.push(`Error deleting ${fileId}: ${error.message}`);
        }
    }

    // 批量更新索引
    if (deletedFiles.length > 0) {
        waitUntil(batchRemoveFilesFromIndex(context, deletedFiles));
    }

    if (results.failed > 0) {
        results.success = false;
    }

    return results;
}

// 批量移动文件
async function batchMoveFiles(env, files, targetPath, url, context, waitUntil) {
    const results = {
        success: true,
        processed: 0,
        failed: 0,
        errors: [],
        moves: []
    };

    const movedFiles = [];

    for (const fileId of files) {
        try {
            const fileName = fileId.split('/').pop();
            const newFileId = targetPath ? `${targetPath}/${fileName}` : fileName;
            const cdnUrl = `https://${url.hostname}/file/${fileId}`;
            
            const success = await moveFile(env, fileId, newFileId, cdnUrl);
            
            if (success) {
                results.processed++;
                results.moves.push({ from: fileId, to: newFileId });
                movedFiles.push({ oldId: fileId, newId: newFileId });
            } else {
                results.failed++;
                results.errors.push(`Failed to move ${fileId}`);
            }
        } catch (error) {
            results.failed++;
            results.errors.push(`Error moving ${fileId}: ${error.message}`);
        }
    }

    // 批量更新索引
    if (movedFiles.length > 0) {
        waitUntil(batchMoveFilesInIndex(context, movedFiles));
    }

    if (results.failed > 0) {
        results.success = false;
    }

    return results;
}

// 批量复制文件
async function batchCopyFiles(env, files, targetPath, url, context, waitUntil) {
    const results = {
        success: true,
        processed: 0,
        failed: 0,
        errors: [],
        copies: []
    };

    for (const fileId of files) {
        try {
            const fileName = fileId.split('/').pop();
            const newFileId = targetPath ? `${targetPath}/${fileName}` : fileName;
            
            const success = await copyFile(env, fileId, newFileId);
            
            if (success) {
                results.processed++;
                results.copies.push({ from: fileId, to: newFileId });
            } else {
                results.failed++;
                results.errors.push(`Failed to copy ${fileId}`);
            }
        } catch (error) {
            results.failed++;
            results.errors.push(`Error copying ${fileId}: ${error.message}`);
        }
    }

    if (results.failed > 0) {
        results.success = false;
    }

    return results;
}

// 删除单个文件
async function deleteFile(env, fileId, cdnUrl) {
    try {
        const img = await env.img_url.getWithMetadata(fileId);

        // 删除R2中的文件
        if (img.metadata?.Channel === 'CloudflareR2') {
            const R2DataBase = env.img_r2;
            await R2DataBase.delete(fileId);
        }

        // 删除S3中的文件
        if (img.metadata?.Channel === 'S3') {
            await deleteS3File(img);
        }

        // 删除KV存储中的记录
        await env.img_url.delete(fileId);

        // 清除CDN缓存
        await purgeCFCache(env, cdnUrl);

        return true;
    } catch (e) {
        console.error('Delete file failed:', e);
        return false;
    }
}

// 移动单个文件
async function moveFile(env, fileId, newFileId, cdnUrl) {
    try {
        const img = await env.img_url.getWithMetadata(fileId);

        // 移动R2中的文件
        if (img.metadata?.Channel === 'CloudflareR2') {
            const R2DataBase = env.img_r2;
            const object = await R2DataBase.get(fileId);
            if (!object) {
                throw new Error('R2 Object Not Found');
            }
            await R2DataBase.put(newFileId, object.body);
            await R2DataBase.delete(fileId);
        }

        // 移动S3中的文件
        if (img.metadata?.Channel === 'S3') {
            const s3Result = await moveS3File(img, newFileId);
            if (!s3Result.success) {
                throw new Error(`S3 move failed: ${s3Result.error}`);
            }
            img.metadata.S3FileKey = s3Result.newKey;
        }

        // 更新元数据
        const folderPath = newFileId.split('/').slice(0, -1).join('/');
        img.metadata.Folder = folderPath;
        img.metadata.FileName = newFileId;

        // 更新KV存储
        await env.img_url.put(newFileId, img.value, { metadata: img.metadata });
        await env.img_url.delete(fileId);

        // 清除CDN缓存
        await purgeCFCache(env, cdnUrl);

        return true;
    } catch (e) {
        console.error('Move file failed:', e);
        return false;
    }
}

// 复制单个文件
async function copyFile(env, fileId, newFileId) {
    try {
        const img = await env.img_url.getWithMetadata(fileId);

        // 复制R2中的文件
        if (img.metadata?.Channel === 'CloudflareR2') {
            const R2DataBase = env.img_r2;
            const object = await R2DataBase.get(fileId);
            if (!object) {
                throw new Error('R2 Object Not Found');
            }
            await R2DataBase.put(newFileId, object.body);
        }

        // 复制S3中的文件
        if (img.metadata?.Channel === 'S3') {
            const s3Result = await copyS3File(img, newFileId);
            if (!s3Result.success) {
                throw new Error(`S3 copy failed: ${s3Result.error}`);
            }
            img.metadata.S3FileKey = s3Result.newKey;
        }

        // 更新元数据
        const folderPath = newFileId.split('/').slice(0, -1).join('/');
        img.metadata.Folder = folderPath;
        img.metadata.FileName = newFileId;

        // 保存到KV存储
        await env.img_url.put(newFileId, img.value, { metadata: img.metadata });

        return true;
    } catch (e) {
        console.error('Copy file failed:', e);
        return false;
    }
}

// S3文件操作辅助函数
async function deleteS3File(img) {
    const s3Config = {
        region: img.metadata?.S3Region || 'auto',
        endpoint: img.metadata?.S3Endpoint,
        credentials: {
            accessKeyId: img.metadata?.S3AccessKeyId,
            secretAccessKey: img.metadata?.S3SecretAccessKey,
        },
    };

    const s3Client = new S3Client(s3Config);
    const bucketName = img.metadata?.S3BucketName;
    const key = img.metadata?.S3FileKey;

    await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
    }));
}

async function moveS3File(img, newFileId) {
    const s3Config = {
        region: img.metadata?.S3Region || 'auto',
        endpoint: img.metadata?.S3Endpoint,
        credentials: {
            accessKeyId: img.metadata?.S3AccessKeyId,
            secretAccessKey: img.metadata?.S3SecretAccessKey,
        },
    };

    const s3Client = new S3Client(s3Config);
    const bucketName = img.metadata?.S3BucketName;
    const oldKey = img.metadata?.S3FileKey;
    const newKey = newFileId;

    try {
        await s3Client.send(new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `/${bucketName}/${oldKey}`,
            Key: newKey,
        }));

        await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: oldKey,
        }));

        return { success: true, newKey };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function copyS3File(img, newFileId) {
    const s3Config = {
        region: img.metadata?.S3Region || 'auto',
        endpoint: img.metadata?.S3Endpoint,
        credentials: {
            accessKeyId: img.metadata?.S3AccessKeyId,
            secretAccessKey: img.metadata?.S3SecretAccessKey,
        },
    };

    const s3Client = new S3Client(s3Config);
    const bucketName = img.metadata?.S3BucketName;
    const oldKey = img.metadata?.S3FileKey;
    const newKey = newFileId;

    try {
        await s3Client.send(new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `/${bucketName}/${oldKey}`,
            Key: newKey,
        }));

        return { success: true, newKey };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
