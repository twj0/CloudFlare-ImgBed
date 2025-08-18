#!/usr/bin/env node

/**
 * CloudFlare ImgBed 快速修复脚本
 * 自动修复常见的部署问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CloudFlare ImgBed 快速修复开始...\n');

// 修复导航配置
function fixNavigationConfig() {
    console.log('🧭 修复导航配置...');
    
    const dashboardTabsPath = path.join(__dirname, 'src/components/DashboardTabs.vue');
    
    try {
        let content = fs.readFileSync(dashboardTabsPath, 'utf8');
        
        // 检查是否已经有file-management导航项
        if (!content.includes('command="file-management"')) {
            console.log('添加高级管理导航项...');
            
            // 在系统设置后添加新的导航项
            const insertPoint = content.indexOf('</el-dropdown-item>');
            if (insertPoint !== -1) {
                const beforeInsert = content.substring(0, insertPoint + 19);
                const afterInsert = content.substring(insertPoint + 19);
                
                const newNavItems = `
                    <el-dropdown-item command="file-manager" v-if="activeTab !== 'file-manager'">
                        <font-awesome-icon icon="folder-open" style="margin-right: 5px;"></font-awesome-icon>
                        文件管理
                    </el-dropdown-item>
                    <el-dropdown-item command="file-management" v-if="activeTab !== 'file-management'">
                        <font-awesome-icon icon="tasks" style="margin-right: 5px;"></font-awesome-icon>
                        高级管理
                    </el-dropdown-item>`;
                
                content = beforeInsert + newNavItems + afterInsert;
                
                // 更新titleName计算属性
                if (!content.includes("activeTab === 'file-management'")) {
                    content = content.replace(
                        /} else if \(this\.activeTab === 'systemConfig'\) {\s*return '系统设置';/,
                        `} else if (this.activeTab === 'systemConfig') {
                return '系统设置';
            } else if (this.activeTab === 'file-manager') {
                return '文件管理';
            } else if (this.activeTab === 'file-management') {
                return '高级管理';`
                    );
                }
                
                // 更新iconName计算属性
                if (!content.includes("return 'tasks'")) {
                    content = content.replace(
                        /} else if \(this\.activeTab === 'systemConfig'\) {\s*return 'cogs';/,
                        `} else if (this.activeTab === 'systemConfig') {
                return 'cogs';
            } else if (this.activeTab === 'file-manager') {
                return 'folder-open';
            } else if (this.activeTab === 'file-management') {
                return 'tasks';`
                    );
                }
                
                fs.writeFileSync(dashboardTabsPath, content);
                console.log('✅ 导航配置已修复');
                return true;
            }
        } else {
            console.log('✅ 导航配置已存在');
            return true;
        }
    } catch (error) {
        console.log('❌ 修复导航配置失败:', error.message);
        return false;
    }
}

// 修复路由配置
function fixRouterConfig() {
    console.log('\n🛣️  修复路由配置...');
    
    const routerPath = path.join(__dirname, 'src/router/index.js');
    
    try {
        let content = fs.readFileSync(routerPath, 'utf8');
        
        // 检查是否已经有file-management路由
        if (!content.includes('/file-management')) {
            console.log('添加file-management路由...');
            
            // 在file-manager路由后添加新路由
            const insertPoint = content.indexOf('beforeEnter: adminAuthGuard\n  },');
            if (insertPoint !== -1) {
                const beforeInsert = content.substring(0, insertPoint + 30);
                const afterInsert = content.substring(insertPoint + 30);
                
                const newRoute = `
  {
    path: '/file-management',
    name: 'fileManagement',
    component: () => import('../views/FileManagement.vue'),
    beforeEnter: adminAuthGuard
  },`;
                
                content = beforeInsert + newRoute + afterInsert;
                fs.writeFileSync(routerPath, content);
                console.log('✅ 路由配置已修复');
                return true;
            }
        } else {
            console.log('✅ 路由配置已存在');
            return true;
        }
    } catch (error) {
        console.log('❌ 修复路由配置失败:', error.message);
        return false;
    }
}

// 创建缺失的组件文件
function createMissingComponents() {
    console.log('\n📦 检查并创建缺失的组件...');
    
    const components = [
        {
            name: 'FileList.vue',
            path: 'src/components/FileList.vue'
        }
    ];
    
    let created = 0;
    
    components.forEach(component => {
        const fullPath = path.join(__dirname, component.path);
        if (!fs.existsSync(fullPath)) {
            console.log(`创建缺失的组件: ${component.name}`);
            
            // 创建基础组件模板
            const template = `<template>
  <div class="file-list">
    <div v-if="files.length === 0" class="empty-state">
      <el-empty description="暂无文件" />
    </div>
    <div v-else class="file-items">
      <div
        v-for="file in files"
        :key="file.name"
        class="file-item"
        @click="$emit('file-select', file)"
      >
        <div class="file-name">{{ file.name }}</div>
        <div class="file-size">{{ file.size }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  files: {
    type: Array,
    default: () => []
  },
  viewMode: {
    type: String,
    default: 'list'
  },
  selectedFiles: {
    type: Array,
    default: () => []
  }
});

defineEmits(['file-select', 'file-action']);
</script>

<style scoped>
.file-list {
  padding: 16px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.file-item:hover {
  background-color: #f5f5f5;
}
</style>`;
            
            fs.writeFileSync(fullPath, template);
            created++;
        }
    });
    
    if (created > 0) {
        console.log(`✅ 创建了 ${created} 个缺失的组件`);
    } else {
        console.log('✅ 所有组件都存在');
    }
    
    return true;
}

// 修复package.json依赖
function fixPackageDependencies() {
    console.log('\n📦 检查package.json依赖...');
    
    const packagePath = path.join(__dirname, 'package.json');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // 检查必需的依赖
        const requiredDeps = {
            'chart.js': '^4.5.0',
            'vue-chartjs': '^5.3.2'
        };
        
        let needsUpdate = false;
        
        Object.entries(requiredDeps).forEach(([dep, version]) => {
            if (!packageJson.dependencies[dep]) {
                console.log(`添加缺失的依赖: ${dep}@${version}`);
                packageJson.dependencies[dep] = version;
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
            console.log('✅ package.json已更新，请运行 npm install');
        } else {
            console.log('✅ 所有必需的依赖都存在');
        }
        
        return true;
    } catch (error) {
        console.log('❌ 修复package.json失败:', error.message);
        return false;
    }
}

// 创建构建脚本
function createBuildScript() {
    console.log('\n🔨 创建构建脚本...');
    
    const buildScript = `#!/bin/bash

echo "🚀 开始构建 CloudFlare ImgBed..."

# 1. 清理旧的构建文件
echo "🧹 清理旧的构建文件..."
rm -rf dist/

# 2. 安装依赖
echo "📦 安装依赖..."
npm install

# 3. 构建项目
echo "🔨 构建项目..."
npm run build

# 4. 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建文件:"
    ls -la dist/
    
    echo ""
    echo "🚀 下一步操作:"
    echo "1. 部署前端到 Cloudflare Pages:"
    echo "   wrangler pages publish dist"
    echo ""
    echo "2. 部署API到 Cloudflare Workers:"
    echo "   wrangler publish"
    echo ""
    echo "3. 访问新功能:"
    echo "   https://your-domain.com/file-management"
else
    echo "❌ 构建失败！请检查错误信息。"
    exit 1
fi
`;
    
    fs.writeFileSync(path.join(__dirname, 'build.sh'), buildScript);
    
    // 设置执行权限（在Unix系统上）
    if (process.platform !== 'win32') {
        require('child_process').exec('chmod +x build.sh');
    }
    
    console.log('✅ 构建脚本已创建: build.sh');
    return true;
}

// 主修复函数
function runFixes() {
    console.log('开始自动修复...\n');
    
    const fixes = [
        { name: '导航配置', fn: fixNavigationConfig },
        { name: '路由配置', fn: fixRouterConfig },
        { name: '缺失组件', fn: createMissingComponents },
        { name: '依赖包', fn: fixPackageDependencies },
        { name: '构建脚本', fn: createBuildScript }
    ];
    
    const results = [];
    
    fixes.forEach(fix => {
        try {
            const result = fix.fn();
            results.push({ name: fix.name, success: result });
        } catch (error) {
            console.log(`❌ 修复${fix.name}时出错:`, error.message);
            results.push({ name: fix.name, success: false, error: error.message });
        }
    });
    
    console.log('\n📊 修复结果汇总:');
    console.log('==================');
    
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.name}`);
        if (result.error) {
            console.log(`   错误: ${result.error}`);
        }
    });
    
    const allFixed = results.every(result => result.success);
    
    if (allFixed) {
        console.log('\n🎉 所有修复都完成了！');
        console.log('\n📝 下一步操作:');
        console.log('1. 运行 ./build.sh 或 npm run build');
        console.log('2. 部署到 Cloudflare Pages');
        console.log('3. 访问 /file-management 测试新功能');
    } else {
        console.log('\n⚠️  一些修复失败了，请手动检查和修复。');
    }
    
    return allFixed;
}

// 运行修复
if (require.main === module) {
    runFixes();
}

module.exports = { runFixes };
