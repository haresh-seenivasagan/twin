# Google OAuth 配置指南

## 问题描述
您遇到的错误 "Shiriai 尚未完成 Google 验证流程" 是因为 Google OAuth 应用处于测试模式。

## 解决方案

### 方案 1：添加测试用户（推荐）

1. **访问 Google Cloud Console**
   - 前往 https://console.cloud.google.com/
   - 选择您的项目

2. **配置 OAuth 同意屏幕**
   - 导航到 "APIs & Services" → "OAuth consent screen"
   - 在 "Test users" 部分，添加测试用户邮箱：
     - `chirsholland6@gmail.com`
     - 其他需要测试的邮箱

3. **配置重定向 URI**
   - 在 "Authorized redirect URIs" 中添加：
     - `http://localhost:3000/api/youtube/callback`
     - `https://yourdomain.com/api/youtube/callback`（生产环境）

### 方案 2：修改 OAuth 请求参数

如果方案 1 不可行，可以修改 OAuth 请求以绕过某些验证：

```typescript
// 在 app/api/youtube/login/route.ts 中修改
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
authUrl.searchParams.set('scope', SCOPES)
authUrl.searchParams.set('access_type', 'offline')
authUrl.searchParams.set('prompt', 'consent')
// 添加以下参数来绕过某些验证
authUrl.searchParams.set('include_granted_scopes', 'true')
```

### 方案 3：使用内部应用类型

1. **更改应用类型**
   - 在 Google Cloud Console 中
   - 将 OAuth 同意屏幕类型改为 "Internal"
   - 这仅适用于 Google Workspace 域内的应用

## 环境变量配置

创建 `.env.local` 文件：

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 验证步骤

1. 确保所有环境变量已正确设置
2. 重启开发服务器：`npm run dev`
3. 访问 `/onboarding/connect` 页面
4. 点击 "Connect YouTube" 按钮
5. 应该能够成功完成 OAuth 流程

## 常见问题

### Q: 仍然看到 "app not verified" 错误
A: 确保已将您的邮箱添加到 Google Cloud Console 的测试用户列表中

### Q: 重定向 URI 不匹配
A: 检查 Google Cloud Console 中的重定向 URI 是否与代码中的完全一致

### Q: 权限不足
A: 确保请求的权限范围合理，避免请求过多敏感权限

## 生产环境部署

当准备部署到生产环境时：

1. 完成 Google 的 OAuth 应用验证流程
2. 更新重定向 URI 为生产域名
3. 确保应用符合 Google 的使用政策
4. 考虑申请应用验证以移除 "未验证应用" 警告

