#!/usr/bin/env node

/**
 * CloudFlare ImgBed 部署检查和修复脚本
 * 用于检查和修复部署过程中的常见问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CloudFlare ImgBed 部署检查开始...\n');

// 检查项目结构
function checkProjectStructure() {
    console.log('📁 检查项目结构...');
    
    const requiredFiles = [
        'src/components/TagManager.vue',
        'src/components/FileTagSelector.vue',
        'src/components/FavoriteManager.vue',
        'src/components/FavoriteFileList.vue',
        'src/components/EnhancedFilePreview.vue',
        'src/components/FileVersionHistory.vue',
        'src/components/FileStatsAnalytics.vue',
        'src/components/EnhancedBatchOperations.vue',
        'src/views/FileManagement.vue',
        'src/models/fileManagerModels.js',
        'src/utils/fileManagerAPI.js'
    ];
    
    const missingFiles = [];
    
    requiredFiles.forEach(file => {
        if (!fs.existsSync(path.join(__dirname, file))) {
            missingFiles.push(file);
        }
    });
    
    if (missingFiles.length === 0) {
        console.log('✅ 所有必需的前端文件都存在');
    } else {
        console.log('❌ 缺少以下文件:');
        missingFiles.forEach(file => console.log(`   - ${file}`));
    }
    
    return missingFiles.length === 0;
}

// 检查API文件
function checkAPIFiles() {
    console.log('\n🔌 检查API文件...');
    
    const requiredAPIFiles = [
        'functions/api/manage/tags/index.js',
        'functions/api/manage/tags/[tagId].js',
        'functions/api/manage/files/[[path]]/tags.js',
        'functions/api/manage/search/tags.js',
        'functions/api/manage/favorites/groups.js',
        'functions/api/manage/favorites/index.js',
        'functions/api/manage/favorites/[[path]].js',
        'functions/api/manage/batch/tags/add.js',
        'functions/api/manage/batch/favorites/add.js',
        'functions/api/manage/stats/files.js',
        'functions/api/manage/stats/storage.js'
    ];
    
    const missingAPIFiles = [];
    
    requiredAPIFiles.forEach(file => {
        if (!fs.existsSync(path.join(__dirname, '..', file))) {
            missingAPIFiles.push(file);
        }
    });
    
    if (missingAPIFiles.length === 0) {
        console.log('✅ 所有必需的API文件都存在');
    } else {
        console.log('❌ 缺少以下API文件:');
        missingAPIFiles.forEach(file => console.log(`   - ${file}`));
    }
    
    return missingAPIFiles.length === 0;
}

// 检查路由配置
function checkRouterConfig() {
    console.log('\n🛣️  检查路由配置...');
    
    try {
        const routerFile = fs.readFileSync(path.join(__dirname, 'src/router/index.js'), 'utf8');
        
        const hasFileManagementRoute = routerFile.includes('/file-management');
        const hasFileManagementComponent = routerFile.includes('FileManagement.vue');
        
        if (hasFileManagementRoute && hasFileManagementComponent) {
            console.log('✅ 路由配置正确');
            return true;
        } else {
            console.log('❌ 路由配置有问题:');
            if (!hasFileManagementRoute) {
                console.log('   - 缺少 /file-management 路由');
            }
            if (!hasFileManagementComponent) {
                console.log('   - 缺少 FileManagement.vue 组件引用');
            }
            return false;
        }
    } catch (error) {
        console.log('❌ 无法读取路由配置文件:', error.message);
        return false;
    }
}

// 检查导航配置
function checkNavigationConfig() {
    console.log('\n🧭 检查导航配置...');
    
    try {
        const dashboardTabsFile = fs.readFileSync(path.join(__dirname, 'src/components/DashboardTabs.vue'), 'utf8');
        
        const hasFileManagementNav = dashboardTabsFile.includes('file-management');
        const hasAdvancedManagementLabel = dashboardTabsFile.includes('高级管理');
        
        if (hasFileManagementNav && hasAdvancedManagementLabel) {
            console.log('✅ 导航配置正确');
            return true;
        } else {
            console.log('❌ 导航配置有问题:');
            if (!hasFileManagementNav) {
                console.log('   - 缺少 file-management 导航项');
            }
            if (!hasAdvancedManagementLabel) {
                console.log('   - 缺少"高级管理"标签');
            }
            return false;
        }
    } catch (error) {
        console.log('❌ 无法读取导航配置文件:', error.message);
        return false;
    }
}

// 检查组件导入
function checkComponentImports() {
    console.log('\n📦 检查组件导入...');
    
    try {
        const fileManagementFile = fs.readFileSync(path.join(__dirname, 'src/views/FileManagement.vue'), 'utf8');
        
        const requiredImports = [
            'TagManager',
            'FavoriteManager',
            'FavoriteFileList',
            'FileStatsAnalytics',
            'FileList',
            'FilePropertiesPanel'
        ];
        
        const missingImports = [];
        
        requiredImports.forEach(component => {
            if (!fileManagementFile.includes(`import ${component}`)) {
                missingImports.push(component);
            }
        });
        
        if (missingImports.length === 0) {
            console.log('✅ 所有组件导入正确');
            return true;
        } else {
            console.log('❌ 缺少以下组件导入:');
            missingImports.forEach(component => console.log(`   - ${component}`));
            return false;
        }
    } catch (error) {
        console.log('❌ 无法读取FileManagement.vue文件:', error.message);
        return false;
    }
}

// 生成构建命令
function generateBuildCommands() {
    console.log('\n🔨 生成构建和部署命令...');
    
    const commands = [
        '# 1. 安装依赖',
        'npm install',
        '',
        '# 2. 构建项目',
        'npm run build',
        '',
        '# 3. 检查构建结果',
        'ls -la dist/',
        '',
        '# 4. 部署到Cloudflare Pages',
        'wrangler pages publish dist',
        '',
        '# 5. 部署API到Cloudflare Workers',
        'wrangler publish',
        '',
        '# 6. 检查API端点',
        'curl https://your-domain.com/api/manage/tags',
        'curl https://your-domain.com/api/manage/favorites/groups'
    ];
    
    fs.writeFileSync(path.join(__dirname, 'build-commands.sh'), commands.join('\n'));
    console.log('✅ 构建命令已保存到 build-commands.sh');
}

// 生成调试信息
function generateDebugInfo() {
    console.log('\n🐛 生成调试信息...');
    
    const debugInfo = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        projectStructure: {
            hasPackageJson: fs.existsSync(path.join(__dirname, 'package.json')),
            hasVueConfig: fs.existsSync(path.join(__dirname, 'vue.config.js')),
            hasSrcDir: fs.existsSync(path.join(__dirname, 'src')),
            hasDistDir: fs.existsSync(path.join(__dirname, 'dist')),
            hasFunctionsDir: fs.existsSync(path.join(__dirname, '..', 'functions'))
        },
        recommendations: [
            '1. 确保所有新组件文件都已提交到版本控制',
            '2. 运行 npm run build 检查构建是否成功',
            '3. 检查浏览器开发者工具的控制台错误',
            '4. 验证API端点是否正确部署',
            '5. 确认Cloudflare KV命名空间已正确配置'
        ]
    };
    
    fs.writeFileSync(path.join(__dirname, 'debug-info.json'), JSON.stringify(debugInfo, null, 2));
    console.log('✅ 调试信息已保存到 debug-info.json');
}

// 主检查函数
function runChecks() {
    const results = {
        projectStructure: checkProjectStructure(),
        apiFiles: checkAPIFiles(),
        routerConfig: checkRouterConfig(),
        navigationConfig: checkNavigationConfig(),
        componentImports: checkComponentImports()
    };
    
    console.log('\n📊 检查结果汇总:');
    console.log('==================');
    
    Object.entries(results).forEach(([check, passed]) => {
        const status = passed ? '✅' : '❌';
        const checkName = check.replace(/([A-Z])/g, ' $1').toLowerCase();
        console.log(`${status} ${checkName}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
        console.log('\n🎉 所有检查都通过了！项目应该可以正常部署。');
        console.log('\n📝 建议的下一步操作:');
        console.log('1. 运行 npm run build 构建项目');
        console.log('2. 检查 dist 目录是否包含所有文件');
        console.log('3. 部署到 Cloudflare Pages');
        console.log('4. 访问 https://your-domain.com/file-management 测试新功能');
    } else {
        console.log('\n⚠️  发现一些问题需要修复。请查看上面的详细信息。');
    }
    
    generateBuildCommands();
    generateDebugInfo();
    
    return allPassed;
}

// 运行检查
if (require.main === module) {
    runChecks();
}

module.exports = { runChecks };
