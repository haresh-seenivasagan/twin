# ⚡ 快速启动指南

## 🎯 当前状态

✅ Google OAuth 配置 - **已完成**  
✅ 代码修复 - **已完成**  
⏳ 环境变量配置 - **需要您完成**

## 🔧 立即完成（5 分钟）

### 1️⃣ 获取 Supabase Service Role Key

```
🔗 https://supabase.com/dashboard
   → 选择项目
   → Settings ⚙️
   → API
   → 复制 "service_role" secret key
```

### 2️⃣ 更新 .env.local

在项目根目录创建或编辑 `.env.local`：

```bash
# Google OAuth (应该已经有了)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback

# Supabase (添加 SERVICE_ROLE_KEY)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ← 添加这个！

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3️⃣ 重启服务器

```bash
# 停止当前服务器 (Ctrl+C)
npm run dev
```

### 4️⃣ 测试

```
http://localhost:3000/onboarding/connect
→ 点击 "Connect YouTube"
→ 授权
→ 应该成功！
```

## ✅ 成功标志

服务器日志显示：
```
YouTube data fetched: { subs: 50, playlists: 10, liked: 10 }
Storing to Supabase...
✓ 数据存储成功
```

浏览器重定向到：
```
/onboarding/connect?youtube=connected&email=...&subs=50&playlists=10
```

## 📚 详细文档

- **RLS_FIX_GUIDE.md** - 完整的 RLS 修复说明
- **GOOGLE_OAUTH_SETUP.md** - OAuth 配置指南
- **QUICK_FIX.md** - Google 验证问题快速修复

## ❓ 常见错误

### 错误 1: "Missing Supabase service role configuration"
**解决**: 确保 `.env.local` 中有 `SUPABASE_SERVICE_ROLE_KEY`

### 错误 2: "RLS policy violation"
**解决**: 重启服务器以加载新的环境变量

### 错误 3: "Google OAuth error"
**解决**: 检查 Google Cloud Console 的测试用户列表

## 🔒 安全检查清单

- [ ] `.env.local` 在 `.gitignore` 中（应该已经有了）
- [ ] Service role key 没有 `NEXT_PUBLIC_` 前缀
- [ ] 只在 API 路由中使用 service role client
- [ ] 永远不要在客户端代码中导入 service-role.ts

---

**准备好了？开始吧！** 🚀


