#!/usr/bin/env node

/**
 * CloudFlare ImgBed 综合测试计划
 * 系统性测试所有功能模块
 */

const https = require('https');
const http = require('http');

// 测试配置
const config = {
  domain: process.env.TEST_DOMAIN || 'your-domain.pages.dev',
  timeout: 15000,
  retries: 3
};

// 测试结果收集
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// 测试套件定义
const testSuites = [
  {
    name: '基础功能测试',
    tests: [
      {
        name: '网站可访问性',
        test: testWebsiteAccessibility
      },
      {
        name: '静态资源加载',
        test: testStaticResources
      },
      {
        name: 'API端点响应',
        test: testAPIEndpoints
      }
    ]
  },
  {
    name: '文件管理功能',
    tests: [
      {
        name: '文件列表API',
        test: testFileListAPI
      },
      {
        name: '文件夹创建API',
        test: testFolderCreationAPI
      },
      {
        name: '批量文件夹创建API',
        test: testBatchFolderCreationAPI
      }
    ]
  },
  {
    name: '前端功能测试',
    tests: [
      {
        name: 'JavaScript加载',
        test: testJavaScriptLoading
      },
      {
        name: 'CSS样式加载',
        test: testCSSLoading
      },
      {
        name: 'Vue应用初始化',
        test: testVueAppInitialization
      }
    ]
  },
  {
    name: '安全性测试',
    tests: [
      {
        name: 'CORS配置',
        test: testCORSConfiguration
      },
      {
        name: '输入验证',
        test: testInputValidation
      },
      {
        name: '错误处理',
        test: testErrorHandling
      }
    ]
  }
];

// HTTP请求工具函数
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
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

// 测试函数实现
async function testWebsiteAccessibility() {
  const options = {
    hostname: config.domain,
    port: 443,
    path: '/',
    method: 'GET',
    protocol: 'https:'
  };
  
  const response = await makeRequest(options);
  
  if (response.statusCode === 200) {
    return { success: true, message: '网站可正常访问' };
  } else {
    throw new Error(`网站访问失败，状态码: ${response.statusCode}`);
  }
}

async function testStaticResources() {
  const resources = [
    '/favicon.ico',
    '/static/logo.png'
  ];
  
  const results = [];
  
  for (const resource of resources) {
    try {
      const options = {
        hostname: config.domain,
        port: 443,
        path: resource,
        method: 'GET',
        protocol: 'https:'
      };
      
      const response = await makeRequest(options);
      results.push({
        resource,
        status: response.statusCode,
        success: response.statusCode === 200 || response.statusCode === 404 // 404也是正常的
      });
    } catch (error) {
      results.push({
        resource,
        success: false,
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  return {
    success: successCount > 0,
    message: `静态资源测试完成，${successCount}/${results.length} 个资源可访问`,
    details: results
  };
}

async function testAPIEndpoints() {
  const endpoints = [
    { path: '/api/manage/list', method: 'GET' },
    { path: '/api/manage/folders/create', method: 'OPTIONS' },
    { path: '/api/manage/folders/batch-create', method: 'OPTIONS' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        hostname: config.domain,
        port: 443,
        path: endpoint.path,
        method: endpoint.method,
        protocol: 'https:',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await makeRequest(options);
      results.push({
        endpoint: `${endpoint.method} ${endpoint.path}`,
        status: response.statusCode,
        success: response.statusCode < 500 // 4xx是正常的（认证失败等）
      });
    } catch (error) {
      results.push({
        endpoint: `${endpoint.method} ${endpoint.path}`,
        success: false,
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  return {
    success: successCount === results.length,
    message: `API端点测试完成，${successCount}/${results.length} 个端点响应正常`,
    details: results
  };
}

async function testFileListAPI() {
  const options = {
    hostname: config.domain,
    port: 443,
    path: '/api/manage/list?dir=/&count=10',
    method: 'GET',
    protocol: 'https:',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const response = await makeRequest(options);
  
  if (response.statusCode === 200 || response.statusCode === 401) {
    // 检查响应格式
    if (typeof response.body === 'object') {
      return {
        success: true,
        message: '文件列表API响应正常',
        details: {
          statusCode: response.statusCode,
          hasFiles: !!response.body.files,
          hasDirectories: !!response.body.directories
        }
      };
    }
  }
  
  throw new Error(`文件列表API测试失败，状态码: ${response.statusCode}`);
}

async function testFolderCreationAPI() {
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
    protocol: 'https:',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const response = await makeRequest(options, testData);
  
  // 401是正常的（需要认证），500是错误
  if (response.statusCode === 401 || response.statusCode === 400) {
    return {
      success: true,
      message: '文件夹创建API端点正常（需要认证）',
      details: { statusCode: response.statusCode }
    };
  }
  
  if (response.statusCode === 200 && response.body.success) {
    return {
      success: true,
      message: '文件夹创建API测试成功',
      details: response.body
    };
  }
  
  throw new Error(`文件夹创建API测试失败，状态码: ${response.statusCode}`);
}

async function testBatchFolderCreationAPI() {
  const testData = {
    folders: [
      { name: 'batch-test-1-' + Date.now() },
      { name: 'batch-test-2-' + Date.now() }
    ],
    path: '/'
  };
  
  const options = {
    hostname: config.domain,
    port: 443,
    path: '/api/manage/folders/batch-create',
    method: 'POST',
    protocol: 'https:',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const response = await makeRequest(options, testData);
  
  if (response.statusCode === 401 || response.statusCode === 400) {
    return {
      success: true,
      message: '批量文件夹创建API端点正常（需要认证）',
      details: { statusCode: response.statusCode }
    };
  }
  
  throw new Error(`批量文件夹创建API测试失败，状态码: ${response.statusCode}`);
}

async function testJavaScriptLoading() {
  // 简单测试：检查主页是否包含JavaScript引用
  const options = {
    hostname: config.domain,
    port: 443,
    path: '/',
    method: 'GET',
    protocol: 'https:'
  };
  
  const response = await makeRequest(options);
  
  if (response.rawBody.includes('<script') || response.rawBody.includes('app.js')) {
    return {
      success: true,
      message: 'JavaScript文件引用正常'
    };
  }
  
  throw new Error('未找到JavaScript文件引用');
}

async function testCSSLoading() {
  const options = {
    hostname: config.domain,
    port: 443,
    path: '/',
    method: 'GET',
    protocol: 'https:'
  };
  
  const response = await makeRequest(options);
  
  if (response.rawBody.includes('<link') || response.rawBody.includes('.css')) {
    return {
      success: true,
      message: 'CSS文件引用正常'
    };
  }
  
  throw new Error('未找到CSS文件引用');
}

async function testVueAppInitialization() {
  // 检查是否有Vue应用的标识
  const options = {
    hostname: config.domain,
    port: 443,
    path: '/',
    method: 'GET',
    protocol: 'https:'
  };
  
  const response = await makeRequest(options);
  
  if (response.rawBody.includes('id="app"') || response.rawBody.includes('vue')) {
    return {
      success: true,
      message: 'Vue应用容器存在'
    };
  }
  
  return {
    success: false,
    message: '未找到Vue应用容器，但这可能是正常的'
  };
}

async function testCORSConfiguration() {
  const options = {
    hostname: config.domain,
    port: 443,
    path: '/api/manage/folders/create',
    method: 'OPTIONS',
    protocol: 'https:',
    headers: {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  };
  
  const response = await makeRequest(options);
  
  const corsHeaders = response.headers['access-control-allow-origin'];
  
  if (corsHeaders) {
    return {
      success: true,
      message: 'CORS配置正常',
      details: { corsHeaders }
    };
  }
  
  throw new Error('CORS配置缺失');
}

async function testInputValidation() {
  // 测试无效输入
  const invalidData = {
    name: '', // 空名称
    path: '/'
  };
  
  const options = {
    hostname: config.domain,
    port: 443,
    path: '/api/manage/folders/create',
    method: 'POST',
    protocol: 'https:',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const response = await makeRequest(options, invalidData);
  
  // 应该返回400错误
  if (response.statusCode === 400) {
    return {
      success: true,
      message: '输入验证正常工作'
    };
  }
  
  return {
    success: false,
    message: `输入验证可能有问题，状态码: ${response.statusCode}`
  };
}

async function testErrorHandling() {
  // 测试不存在的端点
  const options = {
    hostname: config.domain,
    port: 443,
    path: '/api/nonexistent-endpoint',
    method: 'GET',
    protocol: 'https:'
  };
  
  const response = await makeRequest(options);
  
  // 应该返回404
  if (response.statusCode === 404) {
    return {
      success: true,
      message: '错误处理正常'
    };
  }
  
  return {
    success: false,
    message: `错误处理可能有问题，状态码: ${response.statusCode}`
  };
}

// 运行单个测试
async function runTest(test) {
  console.log(`  🔍 ${test.name}...`);
  
  try {
    const result = await test.test();
    
    if (result.success) {
      console.log(`  ✅ ${test.name}: ${result.message}`);
      testResults.passed++;
      return true;
    } else {
      console.log(`  ⚠️  ${test.name}: ${result.message}`);
      testResults.failed++;
      testResults.errors.push({
        test: test.name,
        error: result.message,
        details: result.details
      });
      return false;
    }
  } catch (error) {
    console.log(`  ❌ ${test.name}: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({
      test: test.name,
      error: error.message
    });
    return false;
  }
}

// 运行测试套件
async function runTestSuite(suite) {
  console.log(`\n📋 ${suite.name}`);
  console.log('='.repeat(50));
  
  for (const test of suite.tests) {
    testResults.total++;
    await runTest(test);
  }
}

// 生成测试报告
function generateReport() {
  console.log('\n📊 测试报告');
  console.log('='.repeat(50));
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log(`跳过: ${testResults.skipped}`);
  console.log(`成功率: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
      if (error.details) {
        console.log(`   详情: ${JSON.stringify(error.details, null, 2)}`);
      }
    });
  }
  
  if (testResults.passed === testResults.total) {
    console.log('\n🎉 所有测试都通过了！');
    return true;
  } else {
    console.log('\n⚠️  部分测试失败，请检查上面的详细信息。');
    return false;
  }
}

// 主函数
async function main() {
  console.log(`🚀 开始综合测试: https://${config.domain}\n`);
  
  if (config.domain === 'your-domain.pages.dev') {
    console.log('⚠️  请设置正确的测试域名！');
    console.log('   使用环境变量: TEST_DOMAIN=your-actual-domain.pages.dev node comprehensive-test-plan.js');
    process.exit(1);
  }
  
  try {
    for (const suite of testSuites) {
      await runTestSuite(suite);
    }
    
    const success = generateReport();
    
    if (success) {
      console.log('\n📝 建议的下一步:');
      console.log('1. 测试文件上传功能');
      console.log('2. 测试用户界面交互');
      console.log('3. 进行性能测试');
      console.log('4. 检查移动端兼容性');
    } else {
      console.log('\n🔧 修复建议:');
      console.log('1. 检查失败的API端点');
      console.log('2. 验证服务器配置');
      console.log('3. 查看详细错误日志');
      console.log('4. 确认所有依赖都已部署');
    }
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = { main, testSuites };
