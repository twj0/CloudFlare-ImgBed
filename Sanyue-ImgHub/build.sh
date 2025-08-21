#!/bin/bash

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
