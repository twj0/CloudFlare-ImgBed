import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { purgeCFCache } from "../../../utils/purgeCache";
import { moveFileInIndex } from "../../../utils/indexManager.js";

export async function onRequest(context) {
    const { request, env, params, waitUntil } = context;

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    
    try {
        // 获取新名称
        const body = await request.json();
        const newName = body.newName;
        
        if (!newName || !newName.trim()) {
            return new Response(JSON.stringify({
                success: false,
                error: 'New name is required'
            }), { status: 400 });
        }

        // 解码params.path
        params.path = decodeURIComponent(params.path);
        const oldFileId = params.path.split(',').join('/');
        
        // 构造新的文件ID
        const pathParts = oldFileId.split('/');
        pathParts[pathParts.length - 1] = newName.trim();
        const newFileId = pathParts.join('/');
        
        // 检查新文件名是否已存在
        const existingFile = await env.img_url.getWithMetadata(newFileId);
        if (existingFile.value !== null) {
            return new Response(JSON.stringify({
                success: false,
                error: 'File with this name already exists'
            }), { status: 409 });
        }

        const cdnUrl = `https://${url.hostname}/file/${oldFileId}`;
        const newCdnUrl = `https://${url.hostname}/file/${newFileId}`;

        const success = await renameFile(env, oldFileId, newFileId, cdnUrl, newCdnUrl);
        if (!success) {
            throw new Error('Rename file failed');
        }

        // 更新索引
        waitUntil(moveFileInIndex(context, oldFileId, newFileId));

        return new Response(JSON.stringify({
            success: true,
            oldFileId: oldFileId,
            newFileId: newFileId,
            newName: newName.trim()
        }));
    } catch (e) {
        console.error('Rename file error:', e);
        return new Response(JSON.stringify({
            success: false,
            error: e.message
        }), { status: 500 });
    }
}

// 重命名文件的核心函数
async function renameFile(env, oldFileId, newFileId, oldCdnUrl, newCdnUrl) {
    try {
        // 读取原文件信息
        const img = await env.img_url.getWithMetadata(oldFileId);
        if (!img.value && !img.metadata) {
            throw new Error('File not found');
        }

        // 如果是R2渠道的文件，需要在R2中重命名
        if (img.metadata?.Channel === 'CloudflareR2') {
            const R2DataBase = env.img_r2;

            // 获取原文件内容
            const object = await R2DataBase.get(oldFileId);
            if (!object) {
                throw new Error('R2 Object Not Found');
            }

            // 复制到新位置
            await R2DataBase.put(newFileId, object.body);

            // 删除旧文件
            await R2DataBase.delete(oldFileId);
        }

        // 如果是S3渠道的文件，需要在S3中重命名
        if (img.metadata?.Channel === 'S3') {
            const s3Result = await renameS3File(img, newFileId);
            if (!s3Result.success) {
                throw new Error(`S3 rename failed: ${s3Result.error}`);
            }
            // 更新S3相关的元数据
            img.metadata.S3FileKey = s3Result.newKey;
        }

        // 更新文件名相关的元数据
        const newFileName = newFileId.split('/').pop();
        img.metadata.FileName = newFileId;
        
        // 如果有原始文件名信息，也要更新
        if (img.metadata.OriginalFileName) {
            const originalExt = img.metadata.OriginalFileName.split('.').pop();
            const newNameWithoutExt = newFileName.includes('.') ? 
                newFileName.substring(0, newFileName.lastIndexOf('.')) : newFileName;
            img.metadata.OriginalFileName = originalExt ? `${newNameWithoutExt}.${originalExt}` : newFileName;
        }

        // 更新KV存储
        await env.img_url.put(newFileId, img.value, { metadata: img.metadata });
        await env.img_url.delete(oldFileId);

        // 清除CDN缓存
        await purgeCFCache(env, oldCdnUrl);
        await purgeCFCache(env, newCdnUrl);

        return true;
    } catch (e) {
        console.error('Rename file failed:', e);
        return false;
    }
}

// 重命名S3文件
async function renameS3File(img, newFileId) {
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
        // 复制文件到新位置
        await s3Client.send(new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `/${bucketName}/${oldKey}`,
            Key: newKey,
        }));

        // 复制成功后，删除旧文件
        await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: oldKey,
        }));

        return { success: true, newKey };
    } catch (error) {
        console.error("S3 Rename Failed:", error);
        return { success: false, error: error.message };
    }
}
