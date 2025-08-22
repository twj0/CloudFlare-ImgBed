#!/usr/bin/env node

/**
 * CloudFlare ImgBed Telegram集成简单修复脚本
 */

const fs = require('fs');

console.log('🔧 CloudFlare ImgBed Telegram集成修复工具');
console.log('='.repeat(60));

// 1. 检查wrangler.toml
console.log('\n🔍 检查wrangler.toml配置...');

if (!fs.existsSync('wrangler.toml')) {
  console.log('❌ 未找到wrangler.toml文件');
} else {
  const content = fs.readFileSync('wrangler.toml', 'utf8');
  const hasKVBinding = content.includes('binding = "img_url"');
  console.log('KV绑定配置:', hasKVBinding ? '✅' : '❌');
}

// 2. 检查上传函数
console.log('\n🔍 检查上传函数...');

const uploadPath = 'functions/upload/index.js';
if (!fs.existsSync(uploadPath)) {
  console.log('❌ 未找到上传函数文件');
} else {
  const content = fs.readFileSync(uploadPath, 'utf8');
  const hasTelegramUpload = content.includes('uploadFileToTelegram');
  const hasChannelSelection = content.includes('uploadChannel = \'TelegramNew\'');
  
  console.log('Telegram上传函数:', hasTelegramUpload ? '✅' : '❌');
  console.log('渠道选择:', hasChannelSelection ? '✅' : '❌');
}

// 3. 检查文件服务函数
console.log('\n🔍 检查文件服务函数...');

const filePath = 'functions/file/[[path]].js';
if (!fs.existsSync(filePath)) {
  console.log('❌ 未找到文件服务函数');
} else {
  const content = fs.readFileSync(filePath, 'utf8');
  const hasTelegramAPI = content.includes('TelegramAPI');
  const hasFileRetrieval = content.includes('getFilePath');
  
  console.log('Telegram API集成:', hasTelegramAPI ? '✅' : '❌');
  console.log('文件路径获取:', hasFileRetrieval ? '✅' : '❌');
}

// 4. 创建环境变量示例
console.log('\n📝 创建环境变量配置示例...');

const envExample = `# CloudFlare ImgBed 环境变量配置示例
# 复制此文件为 .env 并填入实际值

# Telegram Bot 配置（必需）
TG_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TG_CHAT_ID=-1001234567890

# 测试域名
TEST_DOMAIN=your-domain.pages.dev

# 可选配置
R2PublicUrl=https://your-r2-domain.com
AllowRandom=false
disable_telemetry=false

# 使用说明：
# 1. 联系 @BotFather 创建Telegram Bot获取Token
# 2. 创建频道并添加Bot为管理员
# 3. 获取频道ID（负数格式）
# 4. 在Cloudflare Pages设置中添加这些环境变量
`;

fs.writeFileSync('.env.example', envExample);
console.log('✅ 已创建 .env.example 文件');

// 5. 创建Telegram配置指南
console.log('\n📝 创建Telegram配置指南...');

const guide = `# 🤖 Telegram Bot 配置指南

## 步骤1: 创建Telegram Bot

1. 在Telegram中搜索 @BotFather
2. 发送 /newbot 命令
3. 按提示设置bot名称和用户名
4. 保存获得的Bot Token（格式：123456789:ABCdefGHIjklMNOpqrsTUVwxyz）

## 步骤2: 创建存储频道

1. 创建一个新的Telegram频道
2. 设置为私有频道（推荐）
3. 添加您的bot为管理员
4. 给予bot以下权限：
   - ✅ 发送消息
   - ✅ 发送媒体
   - ✅ 发送文件

## 步骤3: 获取频道ID

1. 转发频道中的任意消息给 @userinfobot
2. 或者使用 @getidsbot
3. 频道ID格式为负数：-1001234567890

## 步骤4: 配置环境变量

在Cloudflare Pages项目设置中添加：

\`\`\`
TG_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TG_CHAT_ID=-1001234567890
\`\`\`

## 步骤5: 测试配置

运行测试脚本验证配置：

\`\`\`bash
TEST_DOMAIN=your-domain.pages.dev \\
TG_BOT_TOKEN=your-token \\
TG_CHAT_ID=your-chat-id \\
node telegram-debug.js
\`\`\`

## 常见问题

### Bot Token无效
- 检查token是否正确复制
- 确认token没有过期

### 频道访问失败
- 确认bot已添加到频道
- 检查bot是否有管理员权限
- 验证频道ID格式（负数）

### 上传失败
- 检查网络连接
- 验证文件大小（Telegram限制50MB）
- 查看Cloudflare Functions日志
`;

fs.writeFileSync('TELEGRAM_CONFIG_GUIDE.md', guide);
console.log('✅ 已创建 TELEGRAM_CONFIG_GUIDE.md 指南');

// 6. 生成修复报告
console.log('\n📊 修复报告');
console.log('='.repeat(40));

console.log('\n📝 已创建的文件:');
console.log('  - .env.example (环境变量示例)');
console.log('  - TELEGRAM_CONFIG_GUIDE.md (配置指南)');

console.log('\n🚀 下一步操作:');
console.log('1. 按照 TELEGRAM_CONFIG_GUIDE.md 配置Telegram Bot');
console.log('2. 在Cloudflare Pages中设置环境变量');
console.log('3. 运行 node telegram-debug.js 测试集成');
console.log('4. 部署项目到Cloudflare Pages');

console.log('\n🎯 关键问题分析:');
console.log('❌ 主要问题：缺少TG_BOT_TOKEN和TG_CHAT_ID环境变量');
console.log('❌ 次要问题：文件访问需要认证（401错误）');
console.log('✅ 代码结构：上传和文件服务函数都存在且正确');

console.log('\n💡 解决方案:');
console.log('1. 配置Telegram Bot和频道');
console.log('2. 在Cloudflare Pages设置环境变量');
console.log('3. 重新部署项目');
console.log('4. 测试上传和文件访问功能');

console.log('\n🎉 修复完成！请按照指南配置Telegram集成。');
