# 🤖 CloudFlare ImgBed Telegram集成配置指南

## 📋 概述

CloudFlare ImgBed使用Telegram作为图片存储后端。本指南将帮助您完成Telegram集成的完整配置。

## 🚀 快速开始

### **步骤1: 创建Telegram Bot**

1. **联系BotFather**:
   - 在Telegram中搜索 `@BotFather`
   - 发送 `/newbot` 命令
   - 按提示设置bot名称和用户名

2. **获取Bot Token**:
   - BotFather会提供一个token，格式如：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
   - **保存这个token，稍后需要用到**

3. **配置Bot权限**:
   ```
   /setprivacy - 设置为Disabled（允许bot读取群组消息）
   /setjoingroups - 设置为Enable（允许bot加入群组）
   /setcommands - 可选，设置bot命令
   ```

### **步骤2: 创建存储频道**

1. **创建频道**:
   - 在Telegram中创建一个新频道
   - 设置为私有频道（推荐）
   - 记录频道名称

2. **添加Bot为管理员**:
   - 进入频道设置 → 管理员
   - 添加您的bot为管理员
   - 给予以下权限：
     - ✅ 发送消息
     - ✅ 发送媒体
     - ✅ 发送文件
     - ✅ 删除消息（可选）

3. **获取频道ID**:
   - 方法1：转发频道消息给 `@userinfobot`
   - 方法2：使用 `@getidsbot`
   - 频道ID格式：`-1001234567890`（负数）

### **步骤3: 配置环境变量**

#### **在Cloudflare Pages中配置**:

1. 登录Cloudflare Dashboard
2. 进入Pages项目设置
3. 找到"Environment variables"部分
4. 添加以下变量：

```bash
# Telegram Bot配置
TG_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TG_CHAT_ID=-1001234567890

# 可选配置
R2PublicUrl=https://your-r2-domain.com
AllowRandom=false
disable_telemetry=false
```

#### **在wrangler.toml中配置**:

```toml
[env.production.vars]
TG_BOT_TOKEN = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
TG_CHAT_ID = "-1001234567890"

[env.preview.vars]
TG_BOT_TOKEN = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
TG_CHAT_ID = "-1001234567890"
```

### **步骤4: 配置KV命名空间**

1. **创建KV命名空间**:
   ```bash
   npx wrangler kv:namespace create "img_url"
   npx wrangler kv:namespace create "img_url" --preview
   ```

2. **更新wrangler.toml**:
   ```toml
   [[kv_namespaces]]
   binding = "img_url"
   id = "your-kv-namespace-id"
   preview_id = "your-preview-kv-namespace-id"
   ```

## 🧪 测试配置

### **运行集成测试**:

```bash
# 设置环境变量并运行测试
TEST_DOMAIN=your-domain.pages.dev \
TG_BOT_TOKEN=your-bot-token \
TG_CHAT_ID=your-chat-id \
node telegram-integration-test.js
```

### **预期测试结果**:

```
🚀 开始Telegram集成测试: https://your-domain.pages.dev
🤖 Bot Token: 已配置
💬 Chat ID: 已配置

==================================================
🧪 Telegram Bot连接
==================================================
✅ Telegram Bot连接成功
📊 Bot信息: @your_bot (Your Bot Name)

==================================================
🧪 Telegram聊天访问
==================================================
✅ Telegram聊天访问成功
📊 聊天信息: Your Channel (channel)

==================================================
🧪 上传配置检查
==================================================
✅ 上传配置获取成功
📊 Telegram渠道数量: 1
   渠道1: Telegram_env (启用)

==================================================
🧪 文件列表API
==================================================
✅ 文件列表API响应成功
📊 Telegram存储的文件: 0

==================================================
🧪 图片上传测试
==================================================
✅ 图片上传成功

📊 Telegram集成测试报告
============================================================
总测试数: 5
成功: 5
失败: 0
成功率: 100%
```

## 🔧 故障排除

### **常见问题**

#### **1. Bot Token无效**
```
❌ Telegram Bot连接失败: Unauthorized
```
**解决方案**:
- 检查token是否正确复制
- 确认token没有过期
- 重新从BotFather获取token

#### **2. 聊天ID无效**
```
❌ Telegram聊天访问失败: Chat not found
```
**解决方案**:
- 确认频道ID格式正确（负数）
- 检查bot是否已添加到频道
- 确认bot有管理员权限

#### **3. 权限不足**
```
❌ 图片上传失败: Forbidden: bot is not a member of the channel
```
**解决方案**:
- 将bot添加为频道管理员
- 给予bot发送消息和媒体的权限

#### **4. 文件大小限制**
```
❌ 图片上传失败: Request Entity Too Large
```
**解决方案**:
- Telegram Bot API限制单文件50MB
- 大文件会自动分片上传
- 检查网络连接稳定性

### **调试工具**

#### **检查Bot状态**:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
```

#### **检查频道信息**:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getChat" \
     -H "Content-Type: application/json" \
     -d '{"chat_id": "<YOUR_CHAT_ID>"}'
```

#### **发送测试消息**:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
     -H "Content-Type: application/json" \
     -d '{"chat_id": "<YOUR_CHAT_ID>", "text": "Test message"}'
```

## 📊 监控和维护

### **在Web界面中监控**:

1. 访问您的ImgBed网站
2. 如果出现错误，点击"网络诊断"
3. 查看Telegram集成状态
4. 使用"测试上传"功能验证

### **日志监控**:

- 在Cloudflare Dashboard中查看Functions日志
- 关注Telegram API调用的错误信息
- 监控KV存储的使用情况

## 🔒 安全建议

1. **保护Bot Token**:
   - 不要在代码中硬编码token
   - 使用环境变量存储敏感信息
   - 定期轮换token

2. **频道安全**:
   - 使用私有频道存储图片
   - 限制频道成员数量
   - 定期检查频道权限

3. **访问控制**:
   - 配置适当的CORS策略
   - 实施上传频率限制
   - 启用内容审核（如果需要）

## 📞 获取帮助

如果遇到问题：

1. **运行诊断测试**:
   ```bash
   node telegram-integration-test.js
   ```

2. **检查日志**:
   - Cloudflare Functions日志
   - 浏览器开发者工具Console
   - Network请求详情

3. **提供信息**:
   - 测试脚本输出
   - 错误消息截图
   - 配置信息（隐藏敏感数据）

---

**配置完成后，您的CloudFlare ImgBed就可以使用Telegram作为图片存储后端了！** 🎉
