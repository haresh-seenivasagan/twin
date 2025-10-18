# 🔒 Row Level Security (RLS) 修复指南

## 问题说明

您遇到的错误：
```
Failed to store YouTube data: {
  code: '42501',
  message: 'new row violates row-level security policy for table "user_youtube_data"'
}
```

### 原因分析

1. ✅ **Google OAuth 已成功** - 您已成功通过 Google 验证并获取 YouTube 数据
2. ❌ **数据库 RLS 阻止了插入** - Supabase 的行级安全策略阻止了匿名用户插入数据

### 为什么会这样？

在 `supabase/migrations/20251018_enable_rls_youtube_data.sql` 中启用了 RLS，并且**没有为 INSERT 操作创建策略**。这意味着：
- ❌ 使用匿名密钥（ANON_KEY）无法插入数据
- ✅ 只有使用服务角色密钥（SERVICE_ROLE_KEY）才能插入数据

## ✅ 解决方案

### 已完成的修复

1. **创建服务角色客户端** (`lib/supabase/service-role.ts`)
   - 使用 `SUPABASE_SERVICE_ROLE_KEY` 绕过 RLS
   - 只在服务器端 API 路由中使用

2. **更新 YouTube 回调** (`app/api/youtube/callback/route.ts`)
   - 从 `createClient()` 改为 `createServiceRoleClient()`
   - 现在可以在用户注册前插入 YouTube 数据

### 需要您完成的步骤

#### 1. 获取 Supabase Service Role Key

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 点击左侧 ⚙️ **Settings** → **API**
4. 向下滚动找到 **"Project API keys"**
5. 复制 **"service_role"** 密钥（⚠️ 注意：不是 "anon" 密钥）

#### 2. 更新环境变量

编辑或创建 `.env.local` 文件：

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # ← 添加这个！

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 3. 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)

# 重新启动
npm run dev
```

#### 4. 重新测试 YouTube OAuth

1. 访问：http://localhost:3000/onboarding/connect
2. 点击 "Connect YouTube"
3. 完成 Google 授权
4. 现在应该成功存储数据！

## 🔍 验证步骤

### 检查环境变量

```bash
# 在项目根目录运行
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

应该显示类似：
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 检查服务器日志

成功后，您应该看到：
```
YouTube data fetched: {
  subs: 50,
  playlists: 10,
  liked: 10
}
Storing to Supabase...
✓ YouTube data stored successfully
```

## 🛡️ 安全说明

### Service Role Key 的重要性

⚠️ **Service Role Key 拥有完全数据库访问权限！**

- ✅ **只在服务器端使用**（API 路由、服务器组件）
- ❌ **永远不要在客户端代码中使用**
- ❌ **永远不要提交到 Git**（确保 `.env.local` 在 `.gitignore` 中）
- ❌ **永远不要暴露给浏览器**（不要用 `NEXT_PUBLIC_` 前缀）

### 我们如何安全使用

```typescript
// ✅ 正确：在 API 路由中使用
// app/api/youtube/callback/route.ts
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function GET(request: Request) {
  const supabase = createServiceRoleClient()
  // 绕过 RLS 插入数据
}

// ❌ 错误：在客户端组件中使用
'use client'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
// 这会暴露 service role key 给浏览器！
```

## 📊 数据流程

### 修复前
```
用户 → Google OAuth → YouTube API → 获取数据
  → Supabase (anon key) → ❌ RLS 拒绝 INSERT
```

### 修复后
```
用户 → Google OAuth → YouTube API → 获取数据
  → Supabase (service role key) → ✅ 绕过 RLS → 成功插入
  → 用户注册后 → Trigger 自动关联 user_id
```

## 🔄 完整流程

1. **用户连接 YouTube**（未登录）
   - 通过 Google OAuth 获取数据
   - 使用 service role key 存储到 `user_youtube_data` 表
   - 只有 `email` 字段，`user_id` 为 NULL

2. **用户注册账号**
   - 创建 Supabase 认证用户
   - Trigger 自动运行：`link_youtube_data_to_user()`
   - 将 YouTube 数据的 `user_id` 更新为新用户 ID

3. **用户登录后**
   - 可以通过 RLS 策略读取自己的数据
   - 通过 `user_id` 或 `email` 匹配

## ❓ 常见问题

### Q: 为什么不直接禁用 RLS？
A: RLS 是重要的安全机制，防止用户访问他人数据。我们通过 service role 在特定场景绕过，而不是完全禁用。

### Q: Service role key 泄露了怎么办？
A: 立即在 Supabase Dashboard 中重置密钥，并更新所有使用该密钥的环境。

### Q: 能在客户端直接插入数据吗？
A: 不建议。这会要求为匿名用户创建 INSERT 策略，任何人都可以插入假数据。

### Q: 生产环境也这样配置吗？
A: 是的，但要确保：
- Service role key 存储在安全的环境变量中
- 只在 API 路由中使用
- 启用适当的日志和监控

## 🎉 完成后

修复完成后，您的 YouTube OAuth 流程应该完全正常工作：

1. ✅ Google OAuth 验证通过
2. ✅ YouTube 数据成功获取
3. ✅ 数据存储到 Supabase
4. ✅ 用户可以继续生成个性化内容

---

**需要帮助？** 检查服务器日志或访问调试页面：http://localhost:3000/debug/oauth


