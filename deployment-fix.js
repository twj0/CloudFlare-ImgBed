#!/usr/bin/env node

/**
 * CloudFlare ImgBed 部署修复脚本
 * 解决导出/导入问题和安全漏洞
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 CloudFlare ImgBed 部署修复开始...\n');

// 1. 检查middleware.js文件
function checkMiddlewareExports() {
    console.log('📋 检查middleware.js导出...');
    
    const middlewarePath = path.join(__dirname, 'functions/utils/middleware.js');
    
    if (!fs.existsSync(middlewarePath)) {
        console.log('❌ middleware.js文件不存在');
        return false;
    }
    
    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    const hasCorsHeaders = content.includes('export const corsHeaders');
    const hasCreateResponse = content.includes('export function createResponse');
    
    if (hasCorsHeaders && hasCreateResponse) {
        console.log('✅ middleware.js导出正确');
        return true;
    } else {
        console.log('❌ middleware.js缺少必要的导出');
        console.log(`   corsHeaders: ${hasCorsHeaders ? '✅' : '❌'}`);
        console.log(`   createResponse: ${hasCreateResponse ? '✅' : '❌'}`);
        return false;
    }
}

// 2. 检查API文件导入
function checkAPIImports() {
    console.log('\n📋 检查API文件导入...');
    
    const apiFiles = [
        'functions/api/manage/folders/create.js',
        'functions/api/manage/folders/batch-create.js'
    ];
    
    let allCorrect = true;
    
    apiFiles.forEach(filePath => {
        const fullPath = path.join(__dirname, filePath);
        
        if (!fs.existsSync(fullPath)) {
            console.log(`❌ ${filePath} 文件不存在`);
            allCorrect = false;
            return;
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasCorrectImport = content.includes("import { corsHeaders, createResponse } from '../../../utils/middleware.js'");
        
        if (hasCorrectImport) {
            console.log(`✅ ${path.basename(filePath)} 导入正确`);
        } else {
            console.log(`❌ ${path.basename(filePath)} 导入有问题`);
            allCorrect = false;
        }
    });
    
    return allCorrect;
}

// 3. 清理构建文件
function cleanBuildFiles() {
    console.log('\n🧹 清理构建文件...');
    
    const buildDirs = ['css', 'js', 'dist', 'front/dist'];
    let cleaned = 0;
    
    buildDirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (fs.existsSync(dirPath)) {
            try {
                fs.rmSync(dirPath, { recursive: true, force: true });
                console.log(`✅ 已清理 ${dir}/`);
                cleaned++;
            } catch (error) {
                console.log(`⚠️  清理 ${dir}/ 时出错: ${error.message}`);
            }
        }
    });
    
    if (cleaned > 0) {
        console.log(`✅ 共清理了 ${cleaned} 个构建目录`);
    } else {
        console.log('ℹ️  没有找到需要清理的构建文件');
    }
}

// 4. 检查npm安全漏洞
function checkNpmSecurity() {
    console.log('\n🔒 检查npm安全漏洞...');
    
    try {
        // 检查根目录
        console.log('检查根目录依赖...');
        execSync('npm audit --audit-level=critical', { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        
        // 检查前端目录
        const frontDir = path.join(__dirname, 'front');
        if (fs.existsSync(frontDir)) {
            console.log('检查前端目录依赖...');
            execSync('npm audit --audit-level=critical', { 
                stdio: 'inherit',
                cwd: frontDir 
            });
        }
        
        console.log('✅ 没有发现严重安全漏洞');
        return true;
    } catch (error) {
        console.log('⚠️  发现安全漏洞，尝试自动修复...');
        
        try {
            // 尝试自动修复
            execSync('npm audit fix --force', { 
                stdio: 'inherit',
                cwd: __dirname 
            });
            
            if (fs.existsSync(path.join(__dirname, 'front'))) {
                execSync('npm audit fix --force', { 
                    stdio: 'inherit',
                    cwd: path.join(__dirname, 'front')
                });
            }
            
            console.log('✅ 安全漏洞已修复');
            return true;
        } catch (fixError) {
            console.log('❌ 自动修复失败，请手动处理');
            return false;
        }
    }
}

// 5. 验证部署准备
function validateDeployment() {
    console.log('\n🚀 验证部署准备...');
    
    const checks = [
        {
            name: 'wrangler.toml配置',
            check: () => fs.existsSync(path.join(__dirname, 'wrangler.toml'))
        },
        {
            name: 'functions目录',
            check: () => fs.existsSync(path.join(__dirname, 'functions'))
        },
        {
            name: 'middleware.js文件',
            check: () => fs.existsSync(path.join(__dirname, 'functions/utils/middleware.js'))
        },
        {
            name: '前端构建配置',
            check: () => fs.existsSync(path.join(__dirname, 'front/package.json'))
        }
    ];
    
    let allPassed = true;
    
    checks.forEach(({ name, check }) => {
        const passed = check();
        console.log(`${passed ? '✅' : '❌'} ${name}`);
        if (!passed) allPassed = false;
    });
    
    return allPassed;
}

// 6. 生成部署命令
function generateDeployCommands() {
    console.log('\n📝 生成部署命令...');
    
    const commands = [
        '# CloudFlare ImgBed 部署命令',
        '',
        '# 1. 构建前端 (如果有前端代码)',
        'cd front',
        'npm install',
        'npm run build',
        'cd ..',
        '',
        '# 2. 部署到Cloudflare Pages',
        'npx wrangler pages deploy front/dist --project-name=cloudflare-imgbed',
        '',
        '# 或者如果使用根目录部署:',
        '# npx wrangler pages deploy . --project-name=cloudflare-imgbed',
        '',
        '# 3. 检查部署状态',
        'npx wrangler pages deployment list',
        '',
        '# 4. 查看实时日志',
        'npx wrangler pages deployment tail'
    ];
    
    fs.writeFileSync(path.join(__dirname, 'deploy-commands.sh'), commands.join('\n'));
    console.log('✅ 部署命令已保存到 deploy-commands.sh');
}

// 主函数
async function main() {
    try {
        const results = {
            middleware: checkMiddlewareExports(),
            imports: checkAPIImports(),
            security: checkNpmSecurity(),
            deployment: validateDeployment()
        };
        
        cleanBuildFiles();
        generateDeployCommands();
        
        console.log('\n📊 修复结果汇总:');
        console.log('==================');
        
        Object.entries(results).forEach(([check, passed]) => {
            const status = passed ? '✅' : '❌';
            const checkName = check.replace(/([A-Z])/g, ' $1').toLowerCase();
            console.log(`${status} ${checkName}`);
        });
        
        const allPassed = Object.values(results).every(result => result);
        
        if (allPassed) {
            console.log('\n🎉 所有检查都通过了！项目已准备好部署。');
            console.log('\n📝 下一步操作:');
            console.log('1. 运行 bash deploy-commands.sh 中的命令');
            console.log('2. 或者直接运行: npx wrangler pages deploy');
            console.log('3. 检查部署日志确认成功');
        } else {
            console.log('\n⚠️  发现一些问题需要手动修复。请查看上面的详细信息。');
        }
        
    } catch (error) {
        console.error('❌ 修复过程中出错:', error.message);
        process.exit(1);
    }
}

// 运行修复
if (require.main === module) {
    main();
}

module.exports = { main };
