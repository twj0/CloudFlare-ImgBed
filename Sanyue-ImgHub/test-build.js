#!/usr/bin/env node

/**
 * 快速构建测试脚本
 * 用于测试构建是否成功
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔨 开始测试构建...\n');

const buildProcess = spawn('npm', ['run', 'build'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ 构建成功！');
    console.log('\n📝 下一步操作:');
    console.log('1. 部署到 Cloudflare Pages: wrangler pages publish dist');
    console.log('2. 访问 /file-management 测试新功能');
  } else {
    console.log('\n❌ 构建失败，退出代码:', code);
    console.log('\n🔧 建议的修复步骤:');
    console.log('1. 检查上面的错误信息');
    console.log('2. 修复语法错误');
    console.log('3. 重新运行构建');
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ 构建过程出错:', error.message);
});
