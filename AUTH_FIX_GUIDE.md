# 认证问题解决指南

## 问题分析

从终端日志可以看出两个主要问题：

1. **缺少 `profiles` 表**：Supabase 中不存在 `public.profiles` 表
2. **登录凭据无效**：用户注册成功但无法登录

## 解决方案

### 1. 创建 Supabase Profiles 表

在 Supabase SQL 编辑器中运行以下 SQL：

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

### 2. 配置 Supabase 认证设置

在 Supabase Dashboard → Authentication → Settings 中：

1. **禁用邮箱确认**（开发环境）：
   - 将 "Enable email confirmations" 设置为 OFF
   - 这样用户注册后可以直接登录

2. **配置重定向 URL**：
   - 在 "Site URL" 中添加：`http://localhost:3000`
   - 在 "Redirect URLs" 中添加：`http://localhost:3000/auth/callback`

### 3. 测试认证流程

1. **重启开发服务器**：
   ```bash
   # 停止当前服务器
   pkill -f "npm run dev"
   
   # 重新启动
   npm run dev
   ```

2. **测试注册和登录**：
   - 访问 `http://localhost:3000/signup`
   - 创建新账户
   - 访问 `http://localhost:3000/login`
   - 使用相同凭据登录

### 4. 改进的错误处理

已更新的认证函数现在提供更清晰的错误消息：

- 无效凭据：显示具体的错误信息
- 邮箱未确认：提示用户检查邮箱
- 输入验证：检查邮箱格式和密码长度

## 验证步骤

1. ✅ 创建 profiles 表
2. ✅ 配置 Supabase 认证设置
3. ✅ 重启开发服务器
4. ✅ 测试注册流程
5. ✅ 测试登录流程
6. ✅ 验证用户数据保存到 profiles 表

## 如果问题仍然存在

如果按照上述步骤操作后仍有问题，请检查：

1. **环境变量**：确保 `.env.local` 中的 Supabase 配置正确
2. **Supabase 项目状态**：确保项目处于活跃状态
3. **网络连接**：确保可以访问 Supabase 服务
4. **浏览器控制台**：查看是否有 JavaScript 错误

## 下一步

认证问题解决后，可以继续开发：
- 用户仪表板
- 个人资料编辑
- 账户连接功能
- 个性化生成

