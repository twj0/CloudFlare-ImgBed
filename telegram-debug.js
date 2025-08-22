#!/usr/bin/env node

/**
 * CloudFlare ImgBed Telegram集成调试工具
 * 专门诊断上传和文件访问问题
 */

const https = require('https');
const fs = require('fs');

// 配置
const config = {
  domain: process.env.TEST_DOMAIN || 'imgbed.ttwwjj.ddns-ip.net',
  botToken: process.env.TG_BOT_TOKEN || '',
  chatId: process.env.TG_CHAT_ID || '',
  timeout: 30000
};

// HTTP请求工具
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

// 测试1: 检查环境变量配置
async function testEnvironmentConfig() {
  console.log('\n🔍 检查环境变量配置...');
  
  const issues = [];
  
  if (!config.botToken) {
    issues.push('TG_BOT_TOKEN 未设置');
  } else {
    console.log(`✅ TG_BOT_TOKEN: ${config.botToken.substring(0, 10)}...`);
  }
  
  if (!config.chatId) {
    issues.push('TG_CHAT_ID 未设置');
  } else {
    console.log(`✅ TG_CHAT_ID: ${config.chatId}`);
  }
  
  if (!config.domain || config.domain === 'your-domain.pages.dev') {
    issues.push('TEST_DOMAIN 未正确设置');
  } else {
    console.log(`✅ TEST_DOMAIN: ${config.domain}`);
  }
  
  if (issues.length > 0) {
    console.log('❌ 环境变量问题:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    return false;
  }
  
  return true;
}

// 测试2: 检查Telegram Bot连接
async function testTelegramBot() {
  console.log('\n🔍 测试Telegram Bot连接...');
  
  if (!config.botToken) {
    console.log('❌ 跳过：缺少Bot Token');
    return false;
  }
  
  try {
    const url = `https://api.telegram.org/bot${config.botToken}/getMe`;
    const response = await makeRequest(url);
    
    if (response.statusCode === 200 && response.body.ok) {
      const botInfo = response.body.result;
      console.log(`✅ Bot连接成功: @${botInfo.username}`);
      return true;
    } else {
      console.log(`❌ Bot连接失败: ${response.body.description || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Bot连接错误: ${error.message}`);
    return false;
  }
}

// 测试3: 检查频道访问
async function testTelegramChannel() {
  console.log('\n🔍 测试Telegram频道访问...');
  
  if (!config.botToken || !config.chatId) {
    console.log('❌ 跳过：缺少Bot Token或Chat ID');
    return false;
  }
  
  try {
    const url = `https://api.telegram.org/bot${config.botToken}/getChat`;
    const response = await makeRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: config.chatId })
    });
    
    if (response.statusCode === 200 && response.body.ok) {
      const chatInfo = response.body.result;
      console.log(`✅ 频道访问成功: ${chatInfo.title || 'Private Chat'}`);
      return true;
    } else {
      console.log(`❌ 频道访问失败: ${response.body.description || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 频道访问错误: ${error.message}`);
    return false;
  }
}

// 测试4: 检查上传配置API
async function testUploadConfig() {
  console.log('\n🔍 检查上传配置API...');
  
  try {
    const url = `https://${config.domain}/api/manage/sysConfig/upload`;
    const response = await makeRequest(url);
    
    console.log(`📊 响应状态: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const uploadConfig = response.body;
      
      if (uploadConfig.telegram && uploadConfig.telegram.channels) {
        const tgChannels = uploadConfig.telegram.channels;
        console.log(`✅ 找到 ${tgChannels.length} 个Telegram渠道`);
        
        tgChannels.forEach((channel, index) => {
          console.log(`   渠道${index + 1}: ${channel.name} (${channel.enabled ? '启用' : '禁用'})`);
          if (channel.botToken) {
            console.log(`     Bot Token: ${channel.botToken.substring(0, 10)}...`);
          }
          if (channel.chatId) {
            console.log(`     Chat ID: ${channel.chatId}`);
          }
        });
        
        const enabledChannels = tgChannels.filter(ch => ch.enabled);
        if (enabledChannels.length > 0) {
          console.log('✅ 有启用的Telegram渠道');
          return true;
        } else {
          console.log('❌ 没有启用的Telegram渠道');
          return false;
        }
      } else {
        console.log('❌ 未找到Telegram配置');
        return false;
      }
    } else if (response.statusCode === 401) {
      console.log('⚠️  需要认证，但这可能是正常的');
      return true;
    } else {
      console.log(`❌ 配置API失败: ${response.statusCode}`);
      console.log(`错误内容: ${response.rawBody.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 配置API错误: ${error.message}`);
    return false;
  }
}

// 测试5: 测试图片上传
async function testImageUpload() {
  console.log('\n🔍 测试图片上传...');
  
  try {
    // 创建测试图片数据
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
      0x60, 0x82
    ]);
    
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="debug-test.png"',
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
    
    console.log(`📊 上传响应状态: ${response.statusCode}`);
    console.log(`📊 响应内容: ${response.rawBody.substring(0, 300)}`);
    
    if (response.statusCode === 200) {
      console.log('✅ 图片上传成功');
      
      // 尝试解析响应获取文件URL
      try {
        const result = JSON.parse(response.rawBody);
        if (result && result[0] && result[0].src) {
          const fileUrl = result[0].src;
          console.log(`📊 文件URL: ${fileUrl}`);
          return { success: true, fileUrl };
        }
      } catch (parseError) {
        console.log('⚠️  无法解析上传响应');
      }
      
      return { success: true };
    } else {
      console.log(`❌ 图片上传失败: ${response.statusCode}`);
      return { success: false, error: response.rawBody };
    }
  } catch (error) {
    console.log(`❌ 图片上传错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 测试6: 测试文件访问
async function testFileAccess(uploadResult) {
  console.log('\n🔍 测试文件访问...');
  
  if (!uploadResult || !uploadResult.success) {
    console.log('❌ 跳过：上传失败');
    return false;
  }
  
  try {
    // 首先检查文件列表API
    const listUrl = `https://${config.domain}/api/manage/list?dir=/&count=10`;
    const listResponse = await makeRequest(listUrl);
    
    console.log(`📊 文件列表状态: ${listResponse.statusCode}`);
    
    if (listResponse.statusCode === 200 && listResponse.body.files) {
      const files = listResponse.body.files;
      console.log(`📊 找到 ${files.length} 个文件`);
      
      const telegramFiles = files.filter(file => 
        file.metadata && file.metadata.Channel === 'TelegramNew'
      );
      
      console.log(`📊 Telegram文件: ${telegramFiles.length} 个`);
      
      if (telegramFiles.length > 0) {
        // 测试访问第一个Telegram文件
        const testFile = telegramFiles[0];
        const fileUrl = `https://${config.domain}/file/${testFile.name}`;
        
        console.log(`📊 测试文件访问: ${fileUrl}`);
        
        const fileResponse = await makeRequest(fileUrl);
        console.log(`📊 文件访问状态: ${fileResponse.statusCode}`);
        
        if (fileResponse.statusCode === 200) {
          console.log('✅ 文件访问成功');
          return true;
        } else {
          console.log(`❌ 文件访问失败: ${fileResponse.statusCode}`);
          console.log(`错误内容: ${fileResponse.rawBody.substring(0, 200)}`);
          return false;
        }
      } else {
        console.log('⚠️  没有找到Telegram存储的文件');
        return false;
      }
    } else {
      console.log(`❌ 文件列表API失败: ${listResponse.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 文件访问错误: ${error.message}`);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔧 CloudFlare ImgBed Telegram集成调试工具');
  console.log('='.repeat(60));
  
  const results = {};
  
  // 测试步骤
  results.envConfig = await testEnvironmentConfig();
  results.botConnection = await testTelegramBot();
  results.channelAccess = await testTelegramChannel();
  results.uploadConfig = await testUploadConfig();
  results.imageUpload = await testImageUpload();
  results.fileAccess = await testFileAccess(results.imageUpload);
  
  // 生成诊断报告
  console.log('\n📊 诊断报告');
  console.log('='.repeat(40));
  
  const tests = [
    { name: '环境变量配置', result: results.envConfig },
    { name: 'Telegram Bot连接', result: results.botConnection },
    { name: 'Telegram频道访问', result: results.channelAccess },
    { name: '上传配置API', result: results.uploadConfig },
    { name: '图片上传测试', result: results.imageUpload?.success || false },
    { name: '文件访问测试', result: results.fileAccess }
  ];
  
  let successCount = 0;
  tests.forEach((test, index) => {
    const status = test.result ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.name}`);
    if (test.result) successCount++;
  });
  
  console.log(`\n成功率: ${successCount}/${tests.length} (${Math.round(successCount / tests.length * 100)}%)`);
  
  // 问题分析和建议
  console.log('\n🔧 问题分析:');
  
  if (!results.envConfig) {
    console.log('❌ 环境变量配置问题 - 请设置正确的TG_BOT_TOKEN和TG_CHAT_ID');
  }
  
  if (!results.botConnection) {
    console.log('❌ Telegram Bot连接问题 - 请检查Bot Token是否有效');
  }
  
  if (!results.channelAccess) {
    console.log('❌ Telegram频道访问问题 - 请确认Bot已添加到频道并有管理员权限');
  }
  
  if (!results.uploadConfig) {
    console.log('❌ 上传配置问题 - 请检查Cloudflare环境变量设置');
  }
  
  if (!results.imageUpload?.success) {
    console.log('❌ 图片上传问题 - Telegram集成可能未正确配置');
  }
  
  if (!results.fileAccess) {
    console.log('❌ 文件访问问题 - 文件服务功能可能有问题');
  }
  
  if (successCount === tests.length) {
    console.log('\n🎉 所有测试通过！Telegram集成工作正常。');
  } else {
    console.log('\n⚠️  发现问题，需要修复上述失败的测试项。');
  }
  
  return successCount === tests.length;
}

// 运行诊断
if (require.main === module) {
  main().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ 诊断工具运行错误:', error.message);
    process.exit(1);
  });
}

module.exports = { main };
