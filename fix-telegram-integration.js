#!/usr/bin/env node

/**
 * CloudFlare ImgBed Telegram集成修复脚本
 * 自动诊断和修复Telegram集成问题
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查wrangler.toml配置
function checkWranglerConfig() {
  log('\n🔍 检查wrangler.toml配置...', 'blue');
  
  if (!fs.existsSync('wrangler.toml')) {
    log('❌ 未找到wrangler.toml文件', 'red');
    return false;
  }
  
  const content = fs.readFileSync('wrangler.toml', 'utf8');
  
  // 检查必要的配置
  const hasKVBinding = content.includes('binding = "img_url"');
  const hasEnvVars = content.includes('[env.production.vars]') || content.includes('TG_BOT_TOKEN');
  
  log(`KV绑定配置: ${hasKVBinding ? '✅' : '❌'}`, hasKVBinding ? 'green' : 'red');
  log(`环境变量配置: ${hasEnvVars ? '✅' : '❌'}`, hasEnvVars ? 'green' : 'red');
  
  return hasKVBinding;
}

// 创建示例环境变量配置
function createEnvExample() {
  log('\n📝 创建环境变量配置示例...', 'blue');
  
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
  log('✅ 已创建 .env.example 文件', 'green');
}

// 更新wrangler.toml配置
function updateWranglerConfig() {
  log('\n🔧 更新wrangler.toml配置...', 'blue');
  
  const wranglerConfig = `# CloudFlare ImgBed with Telegram Integration
name = "cloudflare-imgbed"
compatibility_date = "2024-01-01"
pages_build_output_dir = "front/dist"

# KV Namespace bindings
[[kv_namespaces]]
binding = "img_url"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

# R2 Bucket bindings (optional)
[[r2_buckets]]
binding = "img_r2"
bucket_name = "your-r2-bucket-name"
preview_bucket_name = "your-preview-r2-bucket-name"

# Environment variables for Telegram integration
[env.production.vars]
# 在Cloudflare Pages设置中配置这些变量
# TG_BOT_TOKEN = "your-telegram-bot-token"
# TG_CHAT_ID = "your-telegram-chat-id"

[env.preview.vars]
# 预览环境变量（与生产环境相同）
# TG_BOT_TOKEN = "your-telegram-bot-token"
# TG_CHAT_ID = "your-telegram-chat-id"

# Build configuration
[build]
command = "cd front && npm install && npm run build"
cwd = "."

# Functions configuration
[functions]
compatibility_flags = ["nodejs_compat"]

# Routes configuration for Pages
[[redirects]]
from = "/api/*"
to = "/api/:splat"
status = 200

[[redirects]]
from = "/file/*"
to = "/file/:splat"
status = 200

[[redirects]]
from = "/upload"
to = "/upload"
status = 200

[[redirects]]
from = "/random"
to = "/random"
status = 200

# Headers for CORS
[[headers]]
for = "/api/*"
[headers.values]
Access-Control-Allow-Origin = "*"
Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
Access-Control-Allow-Headers = "Content-Type, Authorization, X-Requested-With"
Access-Control-Max-Age = "86400"

[[headers]]
for = "/upload"
[headers.values]
Access-Control-Allow-Origin = "*"
Access-Control-Allow-Methods = "POST, OPTIONS"
Access-Control-Allow-Headers = "Content-Type, Authorization, X-Requested-With"
Access-Control-Max-Age = "86400"
`;
  
  // 备份原文件
  if (fs.existsSync('wrangler.toml')) {
    fs.copyFileSync('wrangler.toml', 'wrangler.toml.backup');
    log('✅ 已备份原wrangler.toml为wrangler.toml.backup', 'green');
  }
  
  fs.writeFileSync('wrangler.toml', wranglerConfig);
  log('✅ 已更新wrangler.toml配置', 'green');
}

// 检查上传函数的错误处理
function checkUploadFunction() {
  log('\n🔍 检查上传函数...', 'blue');
  
  const uploadPath = 'functions/upload/index.js';
  if (!fs.existsSync(uploadPath)) {
    log('❌ 未找到上传函数文件', 'red');
    return false;
  }
  
  const content = fs.readFileSync(uploadPath, 'utf8');
  
  // 检查关键功能
  const hasTelegramUpload = content.includes('uploadFileToTelegram');
  const hasErrorHandling = content.includes('catch (error)');
  const hasChannelSelection = content.includes('uploadChannel = \'TelegramNew\'');
  
  log(`Telegram上传函数: ${hasTelegramUpload ? '✅' : '❌'}`, hasTelegramUpload ? 'green' : 'red');
  log(`错误处理: ${hasErrorHandling ? '✅' : '❌'}`, hasErrorHandling ? 'green' : 'red');
  log(`渠道选择: ${hasChannelSelection ? '✅' : '❌'}`, hasChannelSelection ? 'green' : 'red');
  
  return hasTelegramUpload && hasErrorHandling;
}

// 检查文件服务函数
function checkFileFunction() {
  log('\n🔍 检查文件服务函数...', 'blue');
  
  const filePath = 'functions/file/[[path]].js';
  if (!fs.existsSync(filePath)) {
    log('❌ 未找到文件服务函数', 'red');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 检查关键功能
  const hasTelegramAPI = content.includes('TelegramAPI');
  const hasFileRetrieval = content.includes('getFilePath');
  const hasErrorHandling = content.includes('catch');
  
  log(`Telegram API集成: ${hasTelegramAPI ? '✅' : '❌'}`, hasTelegramAPI ? 'green' : 'red');
  log(`文件路径获取: ${hasFileRetrieval ? '✅' : '❌'}`, hasFileRetrieval ? 'green' : 'red');
  log(`错误处理: ${hasErrorHandling ? '✅' : '❌'}`, hasErrorHandling ? 'green' : 'red');
  
  return hasTelegramAPI && hasFileRetrieval;
}

// 创建部署前检查脚本
function createPreDeployCheck() {
  log('\n📝 创建部署前检查脚本...', 'blue');
  
  const checkScript = `#!/usr/bin/env node

/**
 * 部署前检查脚本
 * 确保所有必要配置都已完成
 */

const fs = require('fs');

function checkEnvironmentVariables() {
  console.log('🔍 检查环境变量...');
  
  const requiredVars = ['TG_BOT_TOKEN', 'TG_CHAT_ID'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      console.log(\`✅ \${varName}: 已设置\`);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('❌ 缺少环境变量:');
    missingVars.forEach(varName => {
      console.log(\`   - \${varName}\`);
    });
    console.log('\\n请在Cloudflare Pages设置中添加这些环境变量');
    return false;
  }
  
  return true;
}

function checkWranglerConfig() {
  console.log('\\n🔍 检查wrangler.toml...');
  
  if (!fs.existsSync('wrangler.toml')) {
    console.log('❌ 未找到wrangler.toml文件');
    return false;
  }
  
  const content = fs.readFileSync('wrangler.toml', 'utf8');
  
  if (!content.includes('binding = "img_url"')) {
    console.log('❌ 缺少KV命名空间绑定');
    return false;
  }
  
  console.log('✅ wrangler.toml配置正确');
  return true;
}

function main() {
  console.log('🚀 CloudFlare ImgBed 部署前检查\\n');
  
  const envCheck = checkEnvironmentVariables();
  const configCheck = checkWranglerConfig();
  
  if (envCheck && configCheck) {
    console.log('\\n🎉 所有检查通过，可以开始部署！');
    process.exit(0);
  } else {
    console.log('\\n❌ 检查失败，请修复上述问题后重新部署');
    process.exit(1);
  }
}

main();
`;
  
  fs.writeFileSync('pre-deploy-check.js', checkScript);
  fs.chmodSync('pre-deploy-check.js', '755');
  log('✅ 已创建 pre-deploy-check.js 脚本', 'green');
}

// 创建Telegram配置指南
function createTelegramGuide() {
  log('\n📝 创建Telegram配置指南...', 'blue');
  
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
  log('✅ 已创建 TELEGRAM_CONFIG_GUIDE.md 指南', 'green');
}

// 主函数
function main() {
  log('🔧 CloudFlare ImgBed Telegram集成修复工具', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // 检查当前配置
  const wranglerOk = checkWranglerConfig();
  const uploadOk = checkUploadFunction();
  const fileOk = checkFileFunction();
  
  // 创建修复文件
  createEnvExample();
  updateWranglerConfig();
  createPreDeployCheck();
  createTelegramGuide();
  
  // 生成修复报告
  log('\\n📊 修复报告', 'cyan');
  log('='.repeat(40), 'cyan');
  
  log(`wrangler.toml配置: ${wranglerOk ? '✅' : '❌'}`, wranglerOk ? 'green' : 'red');
  log(`上传函数检查: ${uploadOk ? '✅' : '❌'}`, uploadOk ? 'green' : 'red');
  log(`文件服务检查: ${fileOk ? '✅' : '❌'}`, fileOk ? 'green' : 'red');
  
  log('\\n📝 已创建的文件:', 'blue');
  log('  - .env.example (环境变量示例)', 'cyan');
  log('  - wrangler.toml (更新的配置)', 'cyan');
  log('  - pre-deploy-check.js (部署前检查)', 'cyan');
  log('  - TELEGRAM_CONFIG_GUIDE.md (配置指南)', 'cyan');
  
  log('\\n🚀 下一步操作:', 'blue');
  log('1. 按照 TELEGRAM_CONFIG_GUIDE.md 配置Telegram Bot', 'cyan');
  log('2. 在Cloudflare Pages中设置环境变量', 'cyan');
  log('3. 运行 node pre-deploy-check.js 检查配置', 'cyan');
  log('4. 运行 node telegram-debug.js 测试集成', 'cyan');
  log('5. 部署项目到Cloudflare Pages', 'cyan');
  
  if (wranglerOk && uploadOk && fileOk) {
    log('\\n🎉 代码检查通过！主要问题是环境变量配置。', 'green');
  } else {
    log('\\n⚠️  发现代码问题，请检查上述失败项。', 'yellow');
  }
}

// 运行修复
if (require.main === module) {
  main();
}

module.exports = { main };
`;
  
  fs.writeFileSync('fix-telegram-integration.js', checkScript);
  fs.chmodSync('fix-telegram-integration.js', '755');
  log('✅ 已创建修复脚本', 'green');
}

// 主函数
function main() {
  log('🔧 CloudFlare ImgBed Telegram集成修复工具', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // 检查当前配置
  const wranglerOk = checkWranglerConfig();
  const uploadOk = checkUploadFunction();
  const fileOk = checkFileFunction();
  
  // 创建修复文件
  createEnvExample();
  updateWranglerConfig();
  createPreDeployCheck();
  createTelegramGuide();
  
  // 生成修复报告
  log('\n📊 修复报告', 'cyan');
  log('='.repeat(40), 'cyan');
  
  log(`wrangler.toml配置: ${wranglerOk ? '✅' : '❌'}`, wranglerOk ? 'green' : 'red');
  log(`上传函数检查: ${uploadOk ? '✅' : '❌'}`, uploadOk ? 'green' : 'red');
  log(`文件服务检查: ${fileOk ? '✅' : '❌'}`, fileOk ? 'green' : 'red');
  
  log('\n📝 已创建的文件:', 'blue');
  log('  - .env.example (环境变量示例)', 'cyan');
  log('  - wrangler.toml (更新的配置)', 'cyan');
  log('  - pre-deploy-check.js (部署前检查)', 'cyan');
  log('  - TELEGRAM_CONFIG_GUIDE.md (配置指南)', 'cyan');
  
  log('\n🚀 下一步操作:', 'blue');
  log('1. 按照 TELEGRAM_CONFIG_GUIDE.md 配置Telegram Bot', 'cyan');
  log('2. 在Cloudflare Pages中设置环境变量', 'cyan');
  log('3. 运行 node pre-deploy-check.js 检查配置', 'cyan');
  log('4. 运行 node telegram-debug.js 测试集成', 'cyan');
  log('5. 部署项目到Cloudflare Pages', 'cyan');
  
  if (wranglerOk && uploadOk && fileOk) {
    log('\n🎉 代码检查通过！主要问题是环境变量配置。', 'green');
  } else {
    log('\n⚠️  发现代码问题，请检查上述失败项。', 'yellow');
  }
}

// 运行修复
if (require.main === module) {
  main();
}

module.exports = { main };
