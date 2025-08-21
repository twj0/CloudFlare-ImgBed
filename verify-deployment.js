#!/usr/bin/env node

/**
 * CloudFlare ImgBed 部署验证脚本
 * 验证API端点和功能是否正常工作
 */

const https = require('https');
const http = require('http');

// 配置
const config = {
  // 替换为您的实际域名
  domain: 'your-domain.pages.dev',
  timeout: 10000
};

// API端点列表
const apiEndpoints = [
  {
    path: '/api/manage/folders/create',
    method: 'POST',
    description: '创建文件夹API',
    testData: {
      name: 'test-folder',
      path: '/',
      description: 'Test folder'
    }
  },
  {
    path: '/api/manage/folders/batch-create',
    method: 'POST', 
    description: '批量创建文件夹API',
    testData: {
      folders: [
        { name: 'test1', path: '/' },
        { name: 'test2', path: '/' }
      ],
      path: '/'
    }
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
            body: jsonBody
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
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
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 测试CORS预检请求
async function testCORS(endpoint) {
  console.log(`🔍 测试CORS: ${endpoint.path}`);
  
  try {
    const options = {
      hostname: config.domain,
      port: 443,
      path: endpoint.path,
      method: 'OPTIONS',
      protocol: 'https:',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': endpoint.method,
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };
    
    const response = await makeRequest(options);
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    };
    
    if (response.statusCode === 200 && corsHeaders['access-control-allow-origin']) {
      console.log('✅ CORS配置正确');
      return true;
    } else {
      console.log('❌ CORS配置有问题');
      console.log('   状态码:', response.statusCode);
      console.log('   CORS头:', corsHeaders);
      return false;
    }
  } catch (error) {
    console.log('❌ CORS测试失败:', error.message);
    return false;
  }
}

// 测试API端点
async function testEndpoint(endpoint) {
  console.log(`\n🔍 测试API: ${endpoint.description}`);
  console.log(`   路径: ${endpoint.method} ${endpoint.path}`);
  
  try {
    // 首先测试CORS
    const corsOk = await testCORS(endpoint);
    
    // 然后测试实际API
    const options = {
      hostname: config.domain,
      port: 443,
      path: endpoint.path,
      method: endpoint.method,
      protocol: 'https:',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CloudFlare-ImgBed-Deployment-Test/1.0'
      }
    };
    
    const response = await makeRequest(options, endpoint.testData);
    
    console.log(`   状态码: ${response.statusCode}`);
    
    // 检查响应
    if (response.statusCode >= 200 && response.statusCode < 500) {
      console.log('✅ API端点可访问');
      
      // 检查响应格式
      if (typeof response.body === 'object' && response.body !== null) {
        console.log('✅ 返回JSON格式正确');
        
        // 检查是否有错误信息（这是正常的，因为我们没有认证）
        if (response.body.error || response.body.success === false) {
          console.log('ℹ️  API返回错误（预期的，因为缺少认证）');
          console.log(`   错误信息: ${response.body.error || '未知错误'}`);
        }
        
        return { success: true, cors: corsOk };
      } else {
        console.log('⚠️  响应格式不是JSON');
        return { success: false, cors: corsOk };
      }
    } else {
      console.log('❌ API端点不可访问');
      console.log('   响应:', response.body);
      return { success: false, cors: corsOk };
    }
    
  } catch (error) {
    console.log('❌ API测试失败:', error.message);
    return { success: false, cors: false };
  }
}

// 测试静态文件
async function testStaticFiles() {
  console.log('\n🔍 测试静态文件...');
  
  const staticFiles = [
    { path: '/', description: '主页' },
    { path: '/favicon.ico', description: '网站图标' }
  ];
  
  let allOk = true;
  
  for (const file of staticFiles) {
    try {
      const options = {
        hostname: config.domain,
        port: 443,
        path: file.path,
        method: 'GET',
        protocol: 'https:'
      };
      
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        console.log(`✅ ${file.description} 可访问`);
      } else {
        console.log(`⚠️  ${file.description} 状态码: ${response.statusCode}`);
        if (file.path !== '/favicon.ico') { // favicon可能不存在
          allOk = false;
        }
      }
    } catch (error) {
      console.log(`❌ ${file.description} 测试失败:`, error.message);
      allOk = false;
    }
  }
  
  return allOk;
}

// 生成部署报告
function generateReport(results) {
  console.log('\n📊 部署验证报告');
  console.log('==================');
  
  const totalTests = results.api.length + 1; // API测试 + 静态文件测试
  const passedTests = results.api.filter(r => r.success).length + (results.static ? 1 : 0);
  const corsTests = results.api.filter(r => r.cors).length;
  
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过测试: ${passedTests}`);
  console.log(`CORS正确: ${corsTests}/${results.api.length}`);
  console.log(`成功率: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests && corsTests === results.api.length) {
    console.log('\n🎉 部署验证成功！所有功能正常工作。');
    return true;
  } else {
    console.log('\n⚠️  部署验证发现问题，请检查上面的详细信息。');
    return false;
  }
}

// 主函数
async function main() {
  console.log(`🚀 开始验证部署: https://${config.domain}\n`);
  
  // 检查域名配置
  if (config.domain === 'your-domain.pages.dev') {
    console.log('⚠️  请在脚本中设置正确的域名！');
    console.log('   编辑 verify-deployment.js 文件，将 config.domain 设置为您的实际域名');
    process.exit(1);
  }
  
  const results = {
    api: [],
    static: false
  };
  
  try {
    // 测试静态文件
    results.static = await testStaticFiles();
    
    // 测试API端点
    for (const endpoint of apiEndpoints) {
      const result = await testEndpoint(endpoint);
      results.api.push(result);
    }
    
    // 生成报告
    const success = generateReport(results);
    
    if (success) {
      console.log('\n📝 下一步建议:');
      console.log('1. 测试文件上传功能');
      console.log('2. 测试文件夹创建功能');
      console.log('3. 检查管理员面板访问');
      console.log('4. 验证存储配置（R2/KV）');
    } else {
      console.log('\n🔧 故障排除建议:');
      console.log('1. 检查 wrangler.toml 配置');
      console.log('2. 验证环境变量设置');
      console.log('3. 查看 Cloudflare Pages 部署日志');
      console.log('4. 确认 Functions 正确部署');
    }
    
  } catch (error) {
    console.error('❌ 验证过程中出错:', error.message);
    process.exit(1);
  }
}

// 运行验证
if (require.main === module) {
  main();
}

module.exports = { main };
