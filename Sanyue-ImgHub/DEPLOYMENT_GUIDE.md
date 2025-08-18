# CloudFlare ImgBed 高级功能部署指南

## 📋 部署概述

本指南将帮助您部署包含高级文件管理功能的 CloudFlare ImgBed 系统。新功能包括标签系统、收藏夹、版本历史、统计分析等。

## 🔧 系统要求

### 前端要求
- Node.js 16+ 
- npm 或 yarn
- Vue 3.x
- Element Plus

### 后端要求
- Cloudflare Workers
- Cloudflare KV (用于数据存储)
- Cloudflare R2 或其他存储服务

## 📦 部署步骤

### 第一步：准备环境

1. **克隆项目**
```bash
git clone https://github.com/your-repo/CloudFlare-ImgBed.git
cd CloudFlare-ImgBed
```

2. **安装前端依赖**
```bash
cd Sanyue-ImgHub
npm install
```

3. **配置环境变量**
创建 `.env.development` 文件：
```env
VUE_APP_BACKEND_URL=http://localhost:8080
VUE_APP_API_BASE_URL=/api
```

创建 `.env.production` 文件：
```env
VUE_APP_BACKEND_URL=https://your-domain.com
VUE_APP_API_BASE_URL=/api
```

### 第二步：配置 Cloudflare KV

1. **创建 KV 命名空间**
```bash
wrangler kv:namespace create "img_url"
wrangler kv:namespace create "img_url" --preview
```

2. **更新 wrangler.toml**
```toml
name = "cloudflare-imgbed"
main = "functions/_worker.js"
compatibility_date = "2023-05-18"

[[kv_namespaces]]
binding = "img_url"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### 第三步：部署后端 API

1. **上传 API 文件**
确保以下 API 文件已正确放置：
```
functions/
├── api/
│   └── manage/
│       ├── tags/
│       │   ├── index.js
│       │   └── [tagId].js
│       ├── favorites/
│       │   ├── groups.js
│       │   ├── index.js
│       │   └── [[path]].js
│       ├── files/
│       │   └── [[path]]/
│       │       └── tags.js
│       ├── search/
│       │   └── tags.js
│       ├── batch/
│       │   ├── tags/
│       │   │   └── add.js
│       │   └── favorites/
│       │       └── add.js
│       └── stats/
│           ├── files.js
│           └── storage.js
```

2. **部署到 Cloudflare Workers**
```bash
wrangler publish
```

### 第四步：构建和部署前端

1. **构建前端项目**
```bash
cd Sanyue-ImgHub
npm run build
```

2. **部署到 Cloudflare Pages**
```bash
# 方法一：使用 Wrangler
wrangler pages publish dist

# 方法二：通过 Cloudflare Dashboard
# 1. 登录 Cloudflare Dashboard
# 2. 进入 Pages 服务
# 3. 创建新项目
# 4. 上传 dist 目录内容
```

### 第五步：配置域名和 DNS

1. **设置自定义域名**
   - 在 Cloudflare Pages 中添加自定义域名
   - 配置 DNS 记录指向 Pages 服务

2. **配置 SSL/TLS**
   - 启用 SSL/TLS 加密
   - 设置 HTTPS 重定向

## 🔧 配置说明

### KV 数据结构初始化

部署完成后，系统会自动初始化以下 KV 数据结构：

```javascript
// 标签索引
manage@tags@index: {"tags": [], "lastUpdated": "..."}

// 收藏夹分组索引  
manage@favorite_groups@index: {"groups": ["default"], "lastUpdated": "..."}

// 默认收藏夹分组
manage@favorite_groups@default: {
  "id": "default",
  "name": "默认收藏夹", 
  "isDefault": true,
  ...
}

// 统计索引
manage@stats@index: {"files": [], "lastUpdated": "..."}

// 功能配置
manage@config@features: {
  "tagsEnabled": true,
  "favoritesEnabled": true,
  "versionsEnabled": true,
  "statsEnabled": true,
  ...
}
```

### API 端点配置

确保以下 API 端点正常工作：

**标签管理**
- `GET /api/manage/tags` - 获取所有标签
- `POST /api/manage/tags` - 创建标签
- `PUT /api/manage/tags/{tagId}` - 更新标签
- `DELETE /api/manage/tags/{tagId}` - 删除标签

**文件标签**
- `GET /api/manage/files/{path}/tags` - 获取文件标签
- `POST /api/manage/files/{path}/tags` - 添加文件标签
- `DELETE /api/manage/files/{path}/tags` - 移除文件标签

**收藏夹管理**
- `GET /api/manage/favorites/groups` - 获取收藏夹分组
- `POST /api/manage/favorites/groups` - 创建分组
- `GET /api/manage/favorites` - 获取收藏文件
- `POST /api/manage/favorites` - 添加到收藏夹
- `DELETE /api/manage/favorites/{path}` - 从收藏夹移除

**统计分析**
- `GET /api/manage/stats/files` - 获取文件统计
- `GET /api/manage/stats/storage` - 获取存储统计

**批量操作**
- `POST /api/manage/batch/tags/add` - 批量添加标签
- `POST /api/manage/batch/favorites/add` - 批量添加收藏

## 🧪 测试部署

### 功能测试清单

**标签系统测试**
- [ ] 创建标签
- [ ] 编辑标签
- [ ] 删除标签
- [ ] 为文件添加标签
- [ ] 从文件移除标签
- [ ] 按标签搜索文件
- [ ] 批量标签操作

**收藏夹系统测试**
- [ ] 创建收藏夹分组
- [ ] 添加文件到收藏夹
- [ ] 从收藏夹移除文件
- [ ] 查看收藏文件列表
- [ ] 批量收藏操作

**版本历史测试**
- [ ] 查看文件版本历史
- [ ] 预览历史版本
- [ ] 恢复到指定版本
- [ ] 删除历史版本

**统计分析测试**
- [ ] 查看总体统计
- [ ] 查看访问趋势
- [ ] 查看热门文件
- [ ] 导出统计数据

**批量操作测试**
- [ ] 批量重命名
- [ ] 批量压缩
- [ ] 批量权限设置
- [ ] 批量删除

### 性能测试

1. **API 响应时间测试**
```bash
# 测试标签 API
curl -w "@curl-format.txt" -s -o /dev/null https://your-domain.com/api/manage/tags

# 测试文件统计 API  
curl -w "@curl-format.txt" -s -o /dev/null https://your-domain.com/api/manage/stats/files
```

2. **KV 存储性能测试**
   - 测试大量标签的读写性能
   - 测试批量操作的响应时间
   - 测试统计数据的计算性能

## 🔍 故障排除

### 常见问题

**问题 1：API 返回 404 错误**
- 检查 functions 目录结构是否正确
- 确认 wrangler.toml 配置正确
- 重新部署 Workers

**问题 2：KV 数据读写失败**
- 检查 KV 命名空间绑定
- 确认 KV 权限配置
- 查看 Workers 日志

**问题 3：前端组件加载失败**
- 检查组件导入路径
- 确认依赖包安装完整
- 查看浏览器控制台错误

**问题 4：统计数据不准确**
- 检查统计数据收集逻辑
- 确认时间戳格式正确
- 清理缓存数据重新计算

### 调试方法

1. **启用调试日志**
```javascript
// 在 API 文件中添加调试日志
console.log('Debug info:', data);
```

2. **查看 Workers 日志**
```bash
wrangler tail
```

3. **检查 KV 数据**
```bash
wrangler kv:key list --binding=img_url
wrangler kv:key get "manage@tags@index" --binding=img_url
```

## 📊 监控和维护

### 性能监控

1. **设置 Cloudflare Analytics**
   - 监控 API 请求量
   - 跟踪响应时间
   - 监控错误率

2. **KV 使用监控**
   - 监控 KV 读写次数
   - 跟踪存储使用量
   - 设置使用量告警

### 定期维护

1. **数据清理**
   - 定期清理过期的统计数据
   - 清理无用的版本历史
   - 优化 KV 存储结构

2. **性能优化**
   - 优化频繁访问的数据结构
   - 实施缓存策略
   - 优化批量操作性能

3. **备份策略**
   - 定期备份 KV 数据
   - 备份配置文件
   - 制定灾难恢复计划

## 🔄 更新和升级

### 版本更新流程

1. **备份现有数据**
2. **测试新版本兼容性**
3. **更新前端代码**
4. **更新后端 API**
5. **验证功能正常**
6. **监控系统稳定性**

### 数据迁移

如果需要从旧版本迁移数据：

1. **导出现有数据**
2. **转换数据格式**
3. **导入到新的 KV 结构**
4. **验证数据完整性**

---

**部署完成后，您的 CloudFlare ImgBed 将具备完整的高级文件管理功能！**

如有问题，请参考故障排除部分或联系技术支持。
