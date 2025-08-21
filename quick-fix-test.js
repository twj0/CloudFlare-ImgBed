#!/usr/bin/env node

/**
 * CloudFlare ImgBed 快速修复测试
 * 验证关键功能是否正常工作
 */

const https = require('https');

// 测试配置
const config = {
  domain: process.env.TEST_DOMAIN || 'your-domain.pages.dev',
  timeout: 10000
};

// HTTP请求工具函数
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
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
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    req.end();
  });
}

// 测试1: 网站基本访问
async function testWebsiteAccess() {
  console.log('🔍 测试网站访问...');
  
  try {
    const options = {
      hostname: config.domain,
      port: 443,
      path: '/',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ 网站可正常访问');
      return true;
    } else {
      console.log(`❌ 网站访问失败，状态码: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 网站访问错误: ${error.message}`);
    return false;
  }
}

// 测试2: 文件列表API
async function testFileListAPI() {
  console.log('🔍 测试文件列表API...');
  
  try {
    const options = {
      hostname: config.domain,
      port: 443,
      path: '/api/manage/list?dir=/&count=10',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    console.log(`   状态码: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ 文件列表API正常响应');
      console.log(`   返回数据类型: ${typeof response.body}`);
      
      if (response.body.files !== undefined) {
        console.log(`   文件数量: ${response.body.files ? response.body.files.length : 0}`);
      }
      if (response.body.directories !== undefined) {
        console.log(`   文件夹数量: ${response.body.directories ? response.body.directories.length : 0}`);
      }
      
      return true;
    } else if (response.statusCode === 401) {
      console.log('⚠️  文件列表API需要认证（这是正常的）');
      return true;
    } else {
      console.log(`❌ 文件列表API异常，状态码: ${response.statusCode}`);
      console.log(`   响应内容: ${JSON.stringify(response.body).substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 文件列表API错误: ${error.message}`);
    return false;
  }
}

// 测试3: 文件夹创建API
async function testFolderCreateAPI() {
  console.log('🔍 测试文件夹创建API...');
  
  try {
    const testData = {
      name: 'test-folder-' + Date.now(),
      path: '/',
      description: 'Test folder'
    };
    
    const options = {
      hostname: config.domain,
      port: 443,
      path: '/api/manage/folders/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, testData);
    
    console.log(`   状态码: ${response.statusCode}`);
    
    if (response.statusCode === 200 && response.body.success) {
      console.log('✅ 文件夹创建API正常工作');
      return true;
    } else if (response.statusCode === 401) {
      console.log('⚠️  文件夹创建API需要认证（这是正常的）');
      return true;
    } else if (response.statusCode === 400) {
      console.log('⚠️  文件夹创建API参数验证正常');
      return true;
    } else {
      console.log(`❌ 文件夹创建API异常，状态码: ${response.statusCode}`);
      console.log(`   响应内容: ${JSON.stringify(response.body).substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 文件夹创建API错误: ${error.message}`);
    return false;
  }
}

// 测试4: CORS配置
async function testCORS() {
  console.log('🔍 测试CORS配置...');
  
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
    
    const response = await makeRequest(options);
    
    const corsHeaders = response.headers['access-control-allow-origin'];
    
    if (corsHeaders) {
      console.log('✅ CORS配置正常');
      console.log(`   允许的源: ${corsHeaders}`);
      return true;
    } else {
      console.log('❌ CORS配置缺失');
      return false;
    }
  } catch (error) {
    console.log(`❌ CORS测试错误: ${error.message}`);
    return false;
  }
}

// 测试5: 前端资源
async function testFrontendResources() {
  console.log('🔍 测试前端资源...');
  
  try {
    const options = {
      hostname: config.domain,
      port: 443,
      path: '/',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const hasJS = response.rawBody.includes('<script') || response.rawBody.includes('.js');
      const hasCSS = response.rawBody.includes('<link') || response.rawBody.includes('.css');
      const hasVue = response.rawBody.includes('id="app"') || response.rawBody.includes('vue');
      
      console.log(`   JavaScript引用: ${hasJS ? '✅' : '❌'}`);
      console.log(`   CSS引用: ${hasCSS ? '✅' : '❌'}`);
      console.log(`   Vue应用容器: ${hasVue ? '✅' : '❌'}`);
      
      return hasJS && hasCSS;
    } else {
      console.log(`❌ 前端资源测试失败，状态码: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 前端资源测试错误: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log(`🚀 开始快速修复测试: https://${config.domain}\n`);
  
  if (config.domain === 'your-domain.pages.dev') {
    console.log('⚠️  请设置正确的测试域名！');
    console.log('   使用: TEST_DOMAIN=your-actual-domain.pages.dev node quick-fix-test.js');
    process.exit(1);
  }
  
  const tests = [
    { name: '网站访问', test: testWebsiteAccess },
    { name: '文件列表API', test: testFileListAPI },
    { name: '文件夹创建API', test: testFolderCreateAPI },
    { name: 'CORS配置', test: testCORS },
    { name: '前端资源', test: testFrontendResources }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const testCase of tests) {
    const result = await testCase.test();
    if (result) passed++;
    console.log(''); // 空行分隔
  }
  
  console.log('📊 测试结果汇总');
  console.log('='.repeat(30));
  console.log(`总测试数: ${total}`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${total - passed}`);
  console.log(`成功率: ${Math.round((passed / total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 所有测试都通过了！');
    console.log('\n📝 现在可以测试的功能:');
    console.log('1. 访问网站，查看文件列表是否显示');
    console.log('2. 右键点击空白处，选择"新建文件夹"');
    console.log('3. 输入文件夹名称并确认创建');
    console.log('4. 检查是否有错误提示显示');
    
    return true;
  } else {
    console.log('\n⚠️  部分测试失败，请检查上面的详细信息');
    console.log('\n🔧 可能的解决方案:');
    console.log('1. 确认域名设置正确');
    console.log('2. 检查Cloudflare Pages部署状态');
    console.log('3. 验证API端点是否正确部署');
    console.log('4. 查看浏览器控制台错误信息');
    
    return false;
  }
}

// 运行测试
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ 测试运行错误:', error.message);
    process.exit(1);
  });
}

module.exports = { runTests };
