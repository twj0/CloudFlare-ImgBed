#!/usr/bin/env node

/**
 * CloudFlare ImgBed 一键部署脚本（包含Telegram集成）
 * 自动化部署和配置验证
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const config = {
  projectName: 'cloudflare-imgbed',
  frontendDir: 'front',
  buildCommand: 'npm run build',
  deployCommand: 'npx wrangler pages deploy dist'
};

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    log(`执行: ${command}`, 'cyan');
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    log(`命令执行失败: ${command}`, 'red');
    throw error;
  }
}

// 检查环境变量
function checkEnvironmentVariables() {
  log('\n🔍 检查环境变量...', 'blue');
  
  const requiredVars = ['TG_BOT_TOKEN', 'TG_CHAT_ID'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      log(`✅ ${varName}: 已配置`, 'green');
    }
  });
  
  if (missingVars.length > 0) {
    log('\n⚠️  缺少必要的环境变量:', 'yellow');
    missingVars.forEach(varName => {
      log(`   - ${varName}`, 'red');
    });
    
    log('\n📝 请设置环境变量后重新运行:', 'yellow');
    log('   export TG_BOT_TOKEN="your-bot-token"', 'cyan');
    log('   export TG_CHAT_ID="your-chat-id"', 'cyan');
    log('   node deploy-with-telegram.js', 'cyan');
    
    return false;
  }
  
  return true;
}

// 检查依赖
function checkDependencies() {
  log('\n🔍 检查依赖...', 'blue');
  
  try {
    // 检查Node.js版本
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`✅ Node.js: ${nodeVersion}`, 'green');
    
    // 检查npm
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`✅ npm: ${npmVersion}`, 'green');
    
    // 检查wrangler
    try {
      const wranglerVersion = execSync('npx wrangler --version', { encoding: 'utf8' }).trim();
      log(`✅ Wrangler: ${wranglerVersion}`, 'green');
    } catch (error) {
      log('⚠️  Wrangler未安装，将自动安装', 'yellow');
    }
    
    return true;
  } catch (error) {
    log('❌ 依赖检查失败', 'red');
    return false;
  }
}

// 安装依赖
function installDependencies() {
  log('\n📦 安装依赖...', 'blue');
  
  try {
    // 安装前端依赖
    if (fs.existsSync(path.join(config.frontendDir, 'package.json'))) {
      log('安装前端依赖...', 'cyan');
      execCommand(`cd ${config.frontendDir} && npm install`);
    }
    
    // 安装根目录依赖（如果有）
    if (fs.existsSync('package.json')) {
      log('安装根目录依赖...', 'cyan');
      execCommand('npm install');
    }
    
    log('✅ 依赖安装完成', 'green');
    return true;
  } catch (error) {
    log('❌ 依赖安装失败', 'red');
    return false;
  }
}

// 构建项目
function buildProject() {
  log('\n🔨 构建项目...', 'blue');
  
  try {
    execCommand(`cd ${config.frontendDir} && ${config.buildCommand}`);
    log('✅ 项目构建完成', 'green');
    return true;
  } catch (error) {
    log('❌ 项目构建失败', 'red');
    return false;
  }
}

// 检查wrangler.toml配置
function checkWranglerConfig() {
  log('\n🔍 检查wrangler.toml配置...', 'blue');
  
  if (!fs.existsSync('wrangler.toml')) {
    log('❌ 未找到wrangler.toml文件', 'red');
    log('请确保项目根目录有wrangler.toml配置文件', 'yellow');
    return false;
  }
  
  const wranglerContent = fs.readFileSync('wrangler.toml', 'utf8');
  
  // 检查必要配置
  const requiredConfigs = [
    'name =',
    'compatibility_date =',
    'kv_namespaces',
    'img_url'
  ];
  
  const missingConfigs = requiredConfigs.filter(config => 
    !wranglerContent.includes(config)
  );
  
  if (missingConfigs.length > 0) {
    log('⚠️  wrangler.toml配置可能不完整:', 'yellow');
    missingConfigs.forEach(config => {
      log(`   - 缺少: ${config}`, 'yellow');
    });
  } else {
    log('✅ wrangler.toml配置检查通过', 'green');
  }
  
  return true;
}

// 部署到Cloudflare Pages
function deployToCloudflare() {
  log('\n🚀 部署到Cloudflare Pages...', 'blue');
  
  try {
    execCommand(`cd ${config.frontendDir} && ${config.deployCommand}`);
    log('✅ 部署完成', 'green');
    return true;
  } catch (error) {
    log('❌ 部署失败', 'red');
    log('请检查Cloudflare认证和项目配置', 'yellow');
    return false;
  }
}

// 运行Telegram集成测试
async function runTelegramTest() {
  log('\n🧪 运行Telegram集成测试...', 'blue');
  
  try {
    // 等待部署生效
    log('等待部署生效...', 'cyan');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 运行测试
    const testDomain = process.env.TEST_DOMAIN || 'your-domain.pages.dev';
    
    if (testDomain === 'your-domain.pages.dev') {
      log('⚠️  请设置TEST_DOMAIN环境变量为您的实际域名', 'yellow');
      return false;
    }
    
    execCommand(`TEST_DOMAIN=${testDomain} TG_BOT_TOKEN=${process.env.TG_BOT_TOKEN} TG_CHAT_ID=${process.env.TG_CHAT_ID} node telegram-integration-test.js`);
    
    log('✅ Telegram集成测试通过', 'green');
    return true;
  } catch (error) {
    log('❌ Telegram集成测试失败', 'red');
    return false;
  }
}

// 生成部署报告
function generateDeploymentReport(results) {
  log('\n📊 部署报告', 'magenta');
  log('='.repeat(50), 'magenta');
  
  const steps = [
    { name: '环境变量检查', result: results.envCheck },
    { name: '依赖检查', result: results.depCheck },
    { name: '依赖安装', result: results.install },
    { name: '项目构建', result: results.build },
    { name: '配置检查', result: results.configCheck },
    { name: '部署', result: results.deploy },
    { name: 'Telegram测试', result: results.telegramTest }
  ];
  
  let successCount = 0;
  
  steps.forEach((step, index) => {
    const status = step.result ? '✅' : '❌';
    const color = step.result ? 'green' : 'red';
    log(`${index + 1}. ${status} ${step.name}`, color);
    if (step.result) successCount++;
  });
  
  log(`\n成功率: ${successCount}/${steps.length} (${Math.round(successCount / steps.length * 100)}%)`, 'cyan');
  
  if (successCount === steps.length) {
    log('\n🎉 部署完全成功！', 'green');
    log('\n📝 下一步:', 'blue');
    log('1. 访问您的网站测试上传功能', 'cyan');
    log('2. 检查Telegram频道中的文件', 'cyan');
    log('3. 配置域名和SSL（如果需要）', 'cyan');
  } else {
    log('\n⚠️  部署过程中遇到问题', 'yellow');
    log('\n🔧 故障排除建议:', 'blue');
    log('1. 检查失败步骤的详细错误信息', 'cyan');
    log('2. 验证环境变量配置', 'cyan');
    log('3. 检查Cloudflare账户权限', 'cyan');
    log('4. 查看TELEGRAM_SETUP_GUIDE.md获取帮助', 'cyan');
  }
}

// 主函数
async function main() {
  log('🚀 CloudFlare ImgBed 一键部署（Telegram集成版）', 'magenta');
  log('='.repeat(60), 'magenta');
  
  const results = {};
  
  try {
    // 步骤1: 检查环境变量
    results.envCheck = checkEnvironmentVariables();
    if (!results.envCheck) {
      process.exit(1);
    }
    
    // 步骤2: 检查依赖
    results.depCheck = checkDependencies();
    if (!results.depCheck) {
      process.exit(1);
    }
    
    // 步骤3: 安装依赖
    results.install = installDependencies();
    if (!results.install) {
      process.exit(1);
    }
    
    // 步骤4: 构建项目
    results.build = buildProject();
    if (!results.build) {
      process.exit(1);
    }
    
    // 步骤5: 检查配置
    results.configCheck = checkWranglerConfig();
    if (!results.configCheck) {
      process.exit(1);
    }
    
    // 步骤6: 部署
    results.deploy = deployToCloudflare();
    
    // 步骤7: Telegram测试（即使部署失败也尝试测试）
    results.telegramTest = await runTelegramTest();
    
    // 生成报告
    generateDeploymentReport(results);
    
    // 退出码
    const allSuccess = Object.values(results).every(result => result);
    process.exit(allSuccess ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ 部署过程中发生错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };
