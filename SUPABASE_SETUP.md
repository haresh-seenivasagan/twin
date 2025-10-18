# Supabase 配置解决指南

## 🚨 当前问题

从终端日志可以看到两个关键问题：

1. **`profiles` 表不存在**：
   ```
   Profile creation error: {
     code: 'PGRST205',
     message: "Could not find the table 'public.profiles' in the schema cache"
   }
   ```

2. **登录凭据无效**：
   ```
   [AUTH] Login failed: {
     message: 'Invalid login credentials',
     status: 400,
     code: 'invalid_credentials'
   }
   ```

## ✅ 解决步骤

### 步骤 1: 创建 Profiles 表

1. **打开 Supabase Dashboard**：
   - 访问 [supabase.com](https://supabase.com)
   - 登录你的账户
   - 选择你的项目

2. **进入 SQL 编辑器**：
   - 点击左侧菜单的 "SQL Editor"
   - 点击 "New query"

3. **运行以下 SQL 脚本**：
   ```sql
   -- 创建 profiles 表
   CREATE TABLE profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     email TEXT UNIQUE NOT NULL,
     persona JSONB DEFAULT '{}',
     llm_preferences JSONB DEFAULT '{}',
     custom_data JSONB DEFAULT '{}',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- 启用行级安全
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- 创建安全策略
   CREATE POLICY "Users can manage own profile" ON profiles
     FOR ALL USING (auth.uid() = id);
   ```

4. **点击 "Run" 执行脚本**

### 步骤 2: 配置认证设置

1. **进入认证设置**：
   - 点击左侧菜单的 "Authentication"
   - 点击 "Settings"

2. **禁用邮箱确认**（开发环境）：
   - 找到 "Enable email confirmations" 开关
   - **关闭** 这个开关
   - 点击 "Save"

3. **配置重定向 URL**：
   - 在 "Site URL" 字段输入：`http://localhost:3000`
   - 在 "Redirect URLs" 字段添加：`http://localhost:3000/auth/callback`
   - 点击 "Save"

### 步骤 3: 重启开发服务器

```bash
# 停止当前服务器
pkill -f "npm run dev"

# 重新启动
npm run dev
```

### 步骤 4: 测试认证流程

1. **测试注册**：
   - 访问 `http://localhost:3000/signup`
   - 使用新邮箱注册
   - 应该看到 "Signup successful" 日志

2. **测试登录**：
   - 访问 `http://localhost:3000/login`
   - 使用相同凭据登录
   - 应该成功跳转到仪表板

## 🔍 验证成功

如果配置正确，你应该看到：

1. **注册时**：
   ```
   [AUTH] Signup successful for user: [user-id]
   Profile created successfully for user: [user-id]
   ```

2. **登录时**：
   ```
   [AUTH] Login successful for user: [user-id]
   ```

## 🚨 如果仍有问题

### 检查环境变量

确保 `.env.local` 文件包含正确的 Supabase 配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 检查 Supabase 项目状态

- 确保项目处于活跃状态
- 检查是否有 API 限制
- 验证项目 URL 和密钥是否正确

### 检查网络连接

- 确保可以访问 Supabase 服务
- 检查防火墙设置
- 尝试在浏览器中直接访问 Supabase URL

## 📞 需要帮助？

如果按照上述步骤操作后仍有问题，请提供：

1. Supabase Dashboard 截图
2. 终端完整错误日志
3. 浏览器控制台错误信息

这样我可以提供更具体的解决方案。

