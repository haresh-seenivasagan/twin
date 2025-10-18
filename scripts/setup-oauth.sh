#!/bin/bash

# Google OAuth 快速设置脚本
echo "🔧 设置 Google OAuth 配置..."

# 检查是否存在 .env.local
if [ ! -f ".env.local" ]; then
    echo "📝 创建 .env.local 文件..."
    cat > .env.local << 'EOF'
# Google OAuth Configuration
# 从 Google Cloud Console 获取这些值
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo "✅ .env.local 文件已创建"
else
    echo "⚠️  .env.local 文件已存在，跳过创建"
fi

echo ""
echo "📋 接下来的步骤："
echo "1. 访问 https://console.cloud.google.com/"
echo "2. 选择您的项目"
echo "3. 导航到 'APIs & Services' → 'OAuth consent screen'"
echo "4. 在 'Test users' 部分添加您的邮箱"
echo "5. 确保重定向 URI 包含: http://localhost:3000/api/youtube/callback"
echo "6. 更新 .env.local 文件中的 Google OAuth 凭据"
echo ""
echo "🔍 调试页面: http://localhost:3000/debug/oauth"
echo "🎯 测试连接: http://localhost:3000/onboarding/connect"

