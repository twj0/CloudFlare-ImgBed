#!/usr/bin/env node

/**
 * CloudFlare ImgBed Telegram集成测试工具
 * 测试Telegram Bot配置和上传功能
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 测试配置
const config = {
  domain: process.env.TEST_DOMAIN || 'your-domain.pages.dev',
  botToken: process.env.TG_BOT_TOKEN || '',
  chatId: process.env.TG_CHAT_ID || '',
  timeout: 30000
};

// HTTP请求工具函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const protocol = urlObj.protocol === 'https:' ? https : require('http');
    
    const req = protocol.request(requestOptions, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody,
            rawBody: body
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            rawBody: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// 测试1: Telegram Bot基本连接
async function testTelegramBotConnection() {
  console.log('\n🔍 测试Telegram Bot连接...');
  
  if (!config.botToken) {
    console.log('❌ 缺少TG_BOT_TOKEN环境变量');
    return { success: false, error: 'Missing bot token' };
  }
  
  try {
    const url = `https://api.telegram.org/bot${config.botToken}/getMe`;
    const response = await makeRequest(url);
    
    console.log(`📊 响应状态: ${response.statusCode}`);
    
    if (response.statusCode === 200 && response.body.ok) {
      const botInfo = response.body.result;
      console.log('✅ Telegram Bot连接成功');
      console.log(`📊 Bot信息: @${botInfo.username} (${botInfo.first_name})`);
      return { success: true, botInfo };
    } else {
      console.log(`❌ Telegram Bot连接失败: ${response.body.description || 'Unknown error'}`);
      return { success: false, error: response.body.description };
    }
  } catch (error) {
    console.log(`❌ Telegram Bot连接错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 测试2: 聊天ID验证
async function testTelegramChatAccess() {
  console.log('\n🔍 测试Telegram聊天访问...');
  
  if (!config.chatId) {
    console.log('❌ 缺少TG_CHAT_ID环境变量');
    return { success: false, error: 'Missing chat ID' };
  }
  
  try {
    const url = `https://api.telegram.org/bot${config.botToken}/getChat`;
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: config.chatId
      })
    });
    
    console.log(`📊 响应状态: ${response.statusCode}`);
    
    if (response.statusCode === 200 && response.body.ok) {
      const chatInfo = response.body.result;
      console.log('✅ Telegram聊天访问成功');
      console.log(`📊 聊天信息: ${chatInfo.title || chatInfo.first_name || 'Private Chat'} (${chatInfo.type})`);
      return { success: true, chatInfo };
    } else {
      console.log(`❌ Telegram聊天访问失败: ${response.body.description || 'Unknown error'}`);
      return { success: false, error: response.body.description };
    }
  } catch (error) {
    console.log(`❌ Telegram聊天访问错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 测试3: 上传配置检查
async function testUploadConfiguration() {
  console.log('\n🔍 测试上传配置...');
  
  try {
    const url = `https://${config.domain}/api/manage/sysConfig/upload`;
    const response = await makeRequest(url);
    
    console.log(`📊 响应状态: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const uploadConfig = response.body;
      console.log('✅ 上传配置获取成功');
      
      // 检查Telegram配置
      if (uploadConfig.telegram && uploadConfig.telegram.channels) {
        const tgChannels = uploadConfig.telegram.channels;
        console.log(`📊 Telegram渠道数量: ${tgChannels.length}`);
        
        tgChannels.forEach((channel, index) => {
          console.log(`   渠道${index + 1}: ${channel.name} (${channel.enabled ? '启用' : '禁用'})`);
        });
        
        const enabledChannels = tgChannels.filter(ch => ch.enabled);
        if (enabledChannels.length > 0) {
          console.log('✅ 找到启用的Telegram渠道');
          return { success: true, config: uploadConfig };
        } else {
          console.log('⚠️  没有启用的Telegram渠道');
          return { success: false, error: 'No enabled Telegram channels' };
        }
      } else {
        console.log('❌ 没有找到Telegram配置');
        return { success: false, error: 'No Telegram configuration found' };
      }
    } else if (response.statusCode === 401) {
      console.log('⚠️  上传配置需要认证（这可能是正常的）');
      return { success: true, needsAuth: true };
    } else {
      console.log(`❌ 上传配置获取失败: ${response.statusCode}`);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    console.log(`❌ 上传配置检查错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 测试4: 文件列表API
async function testFileListAPI() {
  console.log('\n🔍 测试文件列表API...');
  
  try {
    const url = `https://${config.domain}/api/manage/list?dir=/&count=10`;
    const response = await makeRequest(url);
    
    console.log(`📊 响应状态: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ 文件列表API响应成功');
      console.log(`📊 响应数据类型: ${typeof response.body}`);
      
      if (response.body.files) {
        console.log(`📊 文件数量: ${response.body.files.length}`);
        
        // 检查是否有Telegram存储的文件
        const telegramFiles = response.body.files.filter(file => 
          file.metadata && file.metadata.Channel === 'TelegramNew'
        );
        
        console.log(`📊 Telegram存储的文件: ${telegramFiles.length}`);
        
        if (telegramFiles.length > 0) {
          console.log('✅ 找到Telegram存储的文件');
          telegramFiles.slice(0, 3).forEach((file, index) => {
            console.log(`   文件${index + 1}: ${file.name} (${file.metadata.FileSize}MB)`);
          });
        } else {
          console.log('⚠️  没有找到Telegram存储的文件');
        }
        
        return { success: true, files: response.body.files, telegramFiles };
      } else {
        console.log('⚠️  响应中没有files字段');
        return { success: true, noFiles: true };
      }
    } else if (response.statusCode === 401) {
      console.log('⚠️  文件列表API需要认证');
      return { success: true, needsAuth: true };
    } else {
      console.log(`❌ 文件列表API失败: ${response.statusCode}`);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    console.log(`❌ 文件列表API错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 测试5: 创建测试图片并上传
async function testImageUpload() {
  console.log('\n🔍 测试图片上传到Telegram...');
  
  try {
    // 创建一个简单的测试图片数据
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, // IEND chunk
      0x60, 0x82
    ]);
    
    // 构建multipart/form-data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test.png"',
      'Content-Type: image/png',
      '',
      testImageData.toString('binary'),
      `--${boundary}--`
    ].join('\r\n');
    
    const url = `https://${config.domain}/upload`;
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(formData)
      },
      body: formData
    });
    
    console.log(`📊 响应状态: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ 图片上传成功');
      console.log(`📊 响应: ${JSON.stringify(response.body).substring(0, 200)}`);
      return { success: true, response: response.body };
    } else {
      console.log(`❌ 图片上传失败: ${response.statusCode}`);
      console.log(`📊 错误信息: ${response.rawBody.substring(0, 200)}`);
      return { success: false, error: response.rawBody };
    }
  } catch (error) {
    console.log(`❌ 图片上传错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function runTelegramIntegrationTests() {
  console.log(`🚀 开始Telegram集成测试: https://${config.domain}`);
  console.log(`🤖 Bot Token: ${config.botToken ? '已配置' : '未配置'}`);
  console.log(`💬 Chat ID: ${config.chatId ? '已配置' : '未配置'}\n`);
  
  if (config.domain === 'your-domain.pages.dev') {
    console.log('⚠️  请设置正确的测试域名！');
    console.log('   使用: TEST_DOMAIN=your-domain.pages.dev TG_BOT_TOKEN=your-token TG_CHAT_ID=your-chat-id node telegram-integration-test.js');
    process.exit(1);
  }
  
  const tests = [
    { name: 'Telegram Bot连接', test: testTelegramBotConnection },
    { name: 'Telegram聊天访问', test: testTelegramChatAccess },
    { name: '上传配置检查', test: testUploadConfiguration },
    { name: '文件列表API', test: testFileListAPI },
    { name: '图片上传测试', test: testImageUpload }
  ];
  
  const results = [];
  
  for (const testCase of tests) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧪 ${testCase.name}`);
    console.log(`${'='.repeat(50)}`);
    
    const result = await testCase.test();
    result.testName = testCase.name;
    results.push(result);
  }
  
  // 生成测试报告
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Telegram集成测试报告');
  console.log(`${'='.repeat(60)}`);
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`总测试数: ${totalCount}`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${totalCount - successCount}`);
  console.log(`成功率: ${Math.round((successCount / totalCount) * 100)}%`);
  
  console.log('\n📋 详细结果:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const message = result.error || result.message || '测试完成';
    console.log(`${index + 1}. ${status} ${result.testName}: ${message}`);
  });
  
  // 诊断建议
  console.log('\n🔧 配置建议:');
  
  if (!config.botToken) {
    console.log('1. 设置TG_BOT_TOKEN环境变量');
    console.log('   - 在Cloudflare Pages设置中添加环境变量');
    console.log('   - 或在wrangler.toml中配置');
  }
  
  if (!config.chatId) {
    console.log('2. 设置TG_CHAT_ID环境变量');
    console.log('   - 可以是频道ID（如：-1001234567890）');
    console.log('   - 或私聊ID（如：123456789）');
  }
  
  const botTest = results.find(r => r.testName === 'Telegram Bot连接');
  const chatTest = results.find(r => r.testName === 'Telegram聊天访问');
  
  if (botTest?.success && chatTest?.success) {
    console.log('3. ✅ Telegram配置正确，可以开始使用');
  } else {
    console.log('3. ❌ 需要修复Telegram配置后重新测试');
  }
  
  return successCount === totalCount;
}

// 运行测试
if (require.main === module) {
  runTelegramIntegrationTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ 测试运行错误:', error.message);
    process.exit(1);
  });
}

module.exports = { runTelegramIntegrationTests };
