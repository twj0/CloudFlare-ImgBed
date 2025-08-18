/**
 * 收藏夹分组管理 API
 * 支持收藏夹分组的 CRUD 操作
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

    try {
        switch (method) {
            case 'GET':
                return await getFavoriteGroups(kv);
            case 'POST':
                return await createFavoriteGroup(kv, request);
            default:
                return new Response('Method not allowed', { status: 405 });
        }
    } catch (error) {
        console.error('Favorite groups API error:', error);
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
 * 获取所有收藏夹分组
 */
async function getFavoriteGroups(kv) {
    try {
        // 从 KV 中获取分组索引
        const groupsIndexStr = await kv.get('manage@favorite_groups@index');
        const groupsIndex = groupsIndexStr ? JSON.parse(groupsIndexStr) : { groups: [] };
        
        // 获取所有分组详细信息
        const groups = [];
        
        // 确保默认分组存在
        if (!groupsIndex.groups.includes('default')) {
            const defaultGroup = await createDefaultGroup(kv);
            groups.push(defaultGroup);
            groupsIndex.groups.unshift('default');
            await kv.put('manage@favorite_groups@index', JSON.stringify(groupsIndex));
        }
        
        for (const groupId of groupsIndex.groups) {
            const groupStr = await kv.get(`manage@favorite_groups@${groupId}`);
            if (groupStr) {
                const group = JSON.parse(groupStr);
                // 计算分组中的文件数量
                const groupFilesStr = await kv.get(`manage@favorite_files@${groupId}`);
                const groupFiles = groupFilesStr ? JSON.parse(groupFilesStr) : { files: [] };
                group.fileCount = groupFiles.files.length;
                groups.push(group);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            groups: groups
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to get favorite groups: ${error.message}`);
    }
}

/**
 * 创建新收藏夹分组
 */
async function createFavoriteGroup(kv, request) {
    try {
        const body = await request.json();
        const { name, description, color, icon } = body;

        // 验证必填字段
        if (!name) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Name is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 检查分组名是否已存在
        const existingGroup = await findGroupByName(kv, name);
        if (existingGroup) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Group name already exists'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 生成分组ID
        const groupId = generateGroupId();
        const now = new Date().toISOString();

        // 创建分组对象
        const group = {
            id: groupId,
            name: name.trim(),
            description: description?.trim() || '',
            color: color || '#67C23A',
            icon: icon || 'star',
            createdAt: now,
            updatedAt: now,
            fileCount: 0,
            isDefault: false
        };

        // 保存分组到 KV
        await kv.put(`manage@favorite_groups@${groupId}`, JSON.stringify(group));

        // 更新分组索引
        const groupsIndexStr = await kv.get('manage@favorite_groups@index');
        const groupsIndex = groupsIndexStr ? JSON.parse(groupsIndexStr) : { groups: [] };
        groupsIndex.groups.push(groupId);
        await kv.put('manage@favorite_groups@index', JSON.stringify(groupsIndex));

        // 初始化分组文件关联
        await kv.put(`manage@favorite_files@${groupId}`, JSON.stringify({ files: [] }));

        return new Response(JSON.stringify({
            success: true,
            group: group
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Failed to create favorite group: ${error.message}`);
    }
}

/**
 * 创建默认收藏夹分组
 */
async function createDefaultGroup(kv) {
    const defaultGroup = {
        id: 'default',
        name: '默认收藏夹',
        description: '默认的收藏夹分组',
        color: '#67C23A',
        icon: 'star',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fileCount: 0,
        isDefault: true
    };

    await kv.put('manage@favorite_groups@default', JSON.stringify(defaultGroup));
    await kv.put('manage@favorite_files@default', JSON.stringify({ files: [] }));
    
    return defaultGroup;
}

/**
 * 根据名称查找分组
 */
async function findGroupByName(kv, name) {
    const groupsIndexStr = await kv.get('manage@favorite_groups@index');
    const groupsIndex = groupsIndexStr ? JSON.parse(groupsIndexStr) : { groups: [] };
    
    for (const groupId of groupsIndex.groups) {
        const groupStr = await kv.get(`manage@favorite_groups@${groupId}`);
        if (groupStr) {
            const group = JSON.parse(groupStr);
            if (group.name.toLowerCase() === name.toLowerCase()) {
                return group;
            }
        }
    }
    return null;
}

/**
 * 生成分组ID
 */
function generateGroupId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `group_${timestamp}_${random}`;
}
