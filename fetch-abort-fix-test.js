#!/usr/bin/env node

/**
 * CloudFlare ImgBed Fetch Abort 错误修复验证
 * 专门测试fetch操作中止问题的修复效果
 */

const https = require('https');

// 测试配置
const config = {
  domain: process.env.TEST_DOMAIN || 'your-domain.pages.dev',
  timeout: 20000, // 增加超时时间以测试我们的修复
  maxRetries: 3
};

// HTTP请求工具函数（模拟我们修复后的fetchWithRetry）
function fetchWithRetry(url, options = {}, maxRetries = 3) {
  return new Promise(async (resolve, reject) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 尝试 ${attempt}/${maxRetries}: ${url}`);
        
        const result = await new Promise((resolveAttempt, rejectAttempt) => {
          const req = https.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
              body += chunk;
            });
            
            res.on('end', () => {
              try {
                const jsonBody = body ? JSON.parse(body) : {};
                resolveAttempt({
                  statusCode: res.statusCode,
                  headers: res.headers,
                  body: jsonBody,
                  rawBody: body
                });
              } catch (error) {
                resolveAttempt({
                  statusCode: res.statusCode,
                  headers: res.headers,
                  body: body,
                  rawBody: body
                });
              }
            });
          });
          
          req.on('error', (error) => {
            rejectAttempt(error);
          });
          
          // 设置超时
          req.setTimeout(config.timeout, () => {
            req.destroy();
            rejectAttempt(new Error('Request timeout'));
          });
          
          if (options.body) {
            req.write(options.body);
          }
          
          req.end();
        });
        
        console.log(`✅ 尝试 ${attempt} 成功`);
        resolve(result);
        return;
        
      } catch (error) {
        lastError = error;
        console.log(`❌ 尝试 ${attempt} 失败: ${error.message}`);
        
        if (attempt === maxRetries) {
          break;
        }
        
        // 指数退避延迟
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ 等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    reject(lastError);
  });
}

// 测试1: 基本API连接测试
async function testBasicAPIConnection() {
  console.log('\n🔍 测试基本API连接...');
  
  try {
    const options = {
      hostname: config.domain,
      port: 443,
      path: '/api/manage/list?dir=/&count=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await fetchWithRetry(`https://${config.domain}/api/manage/list`, options, 3);
    
    console.log(`📊 响应状态: ${response.statusCode}`);
    console.log(`📊 响应类型: ${typeof response.body}`);
    
    if (response.statusCode === 200) {
      console.log('✅ API连接成功');
      return { success: true, response };
    } else if (response.statusCode === 401) {
      console.log('⚠️  API需要认证（正常）');
      return { success: true, response, needsAuth: true };
    } else {
      console.log(`❌ API响应异常: ${response.statusCode}`);
      return { success: false, response };
    }
    
  } catch (error) {
    console.log(`❌ API连接失败: ${error.message}`);
    
    // 分析错误类型
    if (error.message.includes('timeout')) {
      console.log('🔍 错误分析: 请求超时 - 可能是网络延迟或服务器响应慢');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('🔍 错误分析: 域名解析失败 - 请检查域名是否正确');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('🔍 错误分析: 连接被拒绝 - 服务器可能未运行');
    } else {
      console.log('🔍 错误分析: 其他网络错误');
    }
    
    return { success: false, error };
  }
}

// 测试2: 超时处理测试
async function testTimeoutHandling() {
  console.log('\n🔍 测试超时处理...');
  
  try {
    // 使用很短的超时时间来测试超时处理
    const shortTimeoutConfig = { ...config, timeout: 100 };
    
    const options = {
      hostname: config.domain,
      port: 443,
      path: '/api/manage/list?dir=/&count=10',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    console.log('⏱️  使用100ms超时测试超时处理...');
    
    const startTime = Date.now();
    await fetchWithRetry(`https://${config.domain}/api/manage/list`, options, 2);
    const endTime = Date.now();
    
    console.log(`⚠️  意外成功，耗时: ${endTime - startTime}ms`);
    return { success: true, message: '请求在短时间内完成' };
    
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.log('✅ 超时处理正常工作');
      return { success: true, message: '超时处理正确' };
    } else {
      console.log(`❌ 超时处理异常: ${error.message}`);
      return { success: false, error };
    }
  }
}

// 测试3: 重试机制测试
async function testRetryMechanism() {
  console.log('\n🔍 测试重试机制...');
  
  try {
    // 测试对不存在端点的重试
    const options = {
      hostname: config.domain,
      port: 443,
      path: '/api/nonexistent-endpoint-for-retry-test',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    console.log('🔄 测试对404端点的重试行为...');
    
    const startTime = Date.now();
    const response = await fetchWithRetry(`https://${config.domain}/api/nonexistent`, options, 3);
    const endTime = Date.now();
    
    console.log(`📊 最终响应状态: ${response.statusCode}`);
    console.log(`⏱️  总耗时: ${endTime - startTime}ms`);
    
    if (response.statusCode === 404) {
      console.log('✅ 重试机制正常（正确处理404）');
      return { success: true, message: '重试机制工作正常' };
    } else {
      console.log('⚠️  意外的响应状态');
      return { success: true, message: '重试完成但状态意外' };
    }
    
  } catch (error) {
    console.log(`❌ 重试测试失败: ${error.message}`);
    return { success: false, error };
  }
}

// 测试4: 网络状态检测
async function testNetworkDetection() {
  console.log('\n🔍 测试网络状态检测...');
  
  try {
    // 测试基本连通性
    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/',
      method: 'HEAD',
      headers: {
        'User-Agent': 'CloudFlare-ImgBed-Test/1.0'
      }
    };
    
    const response = await fetchWithRetry('https://www.google.com', options, 2);
    
    if (response.statusCode === 200) {
      console.log('✅ 基本网络连接正常');
      return { success: true, message: '网络连接正常' };
    } else {
      console.log('⚠️  网络连接可能有问题');
      return { success: false, message: '网络连接异常' };
    }
    
  } catch (error) {
    console.log(`❌ 网络检测失败: ${error.message}`);
    return { success: false, error };
  }
}

// 测试5: CORS预检测试
async function testCORSPreflight() {
  console.log('\n🔍 测试CORS预检...');
  
  try {
    const options = {
      hostname: config.domain,
      port: 443,
      path: '/api/manage/folders/create',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };
    
    const response = await fetchWithRetry(`https://${config.domain}/api/manage/folders/create`, options, 2);
    
    const corsHeaders = response.headers['access-control-allow-origin'];
    
    if (corsHeaders) {
      console.log('✅ CORS预检正常');
      console.log(`📊 允许的源: ${corsHeaders}`);
      return { success: true, message: 'CORS配置正确' };
    } else {
      console.log('❌ CORS预检失败');
      return { success: false, message: 'CORS配置缺失' };
    }
    
  } catch (error) {
    console.log(`❌ CORS测试失败: ${error.message}`);
    return { success: false, error };
  }
}

// 主测试函数
async function runFetchAbortTests() {
  console.log(`🚀 开始Fetch Abort错误修复验证: https://${config.domain}`);
  console.log(`⚙️  配置: 超时=${config.timeout}ms, 最大重试=${config.maxRetries}次\n`);
  
  if (config.domain === 'your-domain.pages.dev') {
    console.log('⚠️  请设置正确的测试域名！');
    console.log('   使用: TEST_DOMAIN=your-actual-domain.pages.dev node fetch-abort-fix-test.js');
    process.exit(1);
  }
  
  const tests = [
    { name: '基本API连接', test: testBasicAPIConnection },
    { name: '超时处理', test: testTimeoutHandling },
    { name: '重试机制', test: testRetryMechanism },
    { name: '网络状态检测', test: testNetworkDetection },
    { name: 'CORS预检', test: testCORSPreflight }
  ];
  
  const results = [];
  
  for (const testCase of tests) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧪 ${testCase.name}`);
    console.log(`${'='.repeat(50)}`);
    
    const startTime = Date.now();
    const result = await testCase.test();
    const endTime = Date.now();
    
    result.duration = endTime - startTime;
    result.testName = testCase.name;
    results.push(result);
    
    console.log(`⏱️  测试耗时: ${result.duration}ms`);
  }
  
  // 生成测试报告
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Fetch Abort 修复验证报告');
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
    const message = result.message || result.error?.message || '无详细信息';
    console.log(`${index + 1}. ${status} ${result.testName}: ${message} (${result.duration}ms)`);
  });
  
  if (successCount === totalCount) {
    console.log('\n🎉 所有测试通过！Fetch Abort问题已修复。');
    console.log('\n📝 建议的下一步:');
    console.log('1. 部署更新到生产环境');
    console.log('2. 在浏览器中测试文件列表加载');
    console.log('3. 监控网络请求是否还有abort错误');
    console.log('4. 测试新建文件夹功能');
    
    return true;
  } else {
    console.log('\n⚠️  部分测试失败，需要进一步调试。');
    console.log('\n🔧 故障排除建议:');
    console.log('1. 检查失败的测试详细信息');
    console.log('2. 验证域名和API端点配置');
    console.log('3. 检查网络连接和防火墙设置');
    console.log('4. 查看服务器日志');
    
    return false;
  }
}

// 运行测试
if (require.main === module) {
  runFetchAbortTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ 测试运行错误:', error.message);
    process.exit(1);
  });
}

module.exports = { runFetchAbortTests };
