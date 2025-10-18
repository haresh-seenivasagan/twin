# 🚨 如何修复 "Access blocked: Shiriai has not completed the Google verification process"

## 问题原因
您的邮箱 `chirsholland6@gmail.com` 没有被添加到 Google Cloud Console 的测试用户列表中。

## ✅ 解决步骤（必须完成）

### 步骤 1: 访问 Google Cloud Console

1. 打开浏览器访问：https://console.cloud.google.com/
2. 使用您的 Google 账号登录
3. 选择您的项目（Shiriai）

### 步骤 2: 配置 OAuth 同意屏幕

1. 在左侧菜单中，点击 **"APIs & Services"**（API 和服务）
2. 点击 **"OAuth consent screen"**（OAuth 同意屏幕）
3. 滚动到 **"Test users"**（测试用户）部分
4. 点击 **"+ ADD USERS"**（添加用户）按钮
5. 输入您的邮箱：`chirsholland6@gmail.com`
6. 点击 **"Save"**（保存）

### 步骤 3: 检查重定向 URI

1. 在左侧菜单中，点击 **"Credentials"**（凭据）
2. 找到您的 OAuth 2.0 客户端 ID 并点击编辑
3. 确保 **"Authorized redirect URIs"** 中包含：
   ```
   http://localhost:3000/api/youtube/callback
   ```
4. 如果没有，点击 **"+ ADD URI"** 添加
5. 点击 **"Save"**

### 步骤 4: 重新测试

1. 关闭之前的 Google 登录页面
2. 清除浏览器缓存（或使用无痕模式）
3. 重新访问您的应用并尝试连接 YouTube

## 🎯 详细图解步骤

### 如何找到 "Test users" 部分：

```
Google Cloud Console
  └── APIs & Services
      └── OAuth consent screen
          └── 滚动到页面下方
              └── Test users (这里可以看到已添加的测试用户列表)
                  └── + ADD USERS (点击这个按钮添加新用户)
```

## ⚠️ 重要提示

1. **必须使用项目所有者账号**登录 Google Cloud Console
2. **必须在同一个项目中**配置（检查页面顶部的项目名称）
3. 添加测试用户后**不需要等待**，立即生效
4. 每个项目最多可以添加 **100 个测试用户**

## 🔍 验证配置

添加测试用户后，您应该能在 OAuth consent screen 页面看到：

```
Test users
┌─────────────────────────────────┐
│ chirsholland6@gmail.com    [x]  │
└─────────────────────────────────┘
```

## 📝 如果还是不行

### 检查项目是否正确
```bash
# 在 Google Cloud Console 顶部栏检查项目名称
# 应该显示: Shiriai 或您的项目名称
```

### 检查 OAuth 应用类型
```
Publishing status: Testing
User type: External
```

### 检查环境变量
确保您的 `.env.local` 包含正确的 `GOOGLE_CLIENT_ID`：
```bash
# 在项目根目录运行
cat .env.local | grep GOOGLE_CLIENT_ID
```

## 🚀 完成后测试

1. 访问：http://localhost:3000/onboarding/connect
2. 点击 "Connect YouTube"
3. 您应该看到 Google 授权页面（不再有错误）
4. 选择您的账号并授权

## 📞 仍然需要帮助？

如果按照上述步骤操作后仍然出现问题，可能的原因：

1. **使用了错误的 Google 账号** - 确保使用 chirsholland6@gmail.com 登录
2. **项目不匹配** - 检查 GOOGLE_CLIENT_ID 是否来自正确的项目
3. **缓存问题** - 尝试无痕模式或清除浏览器缓存
4. **时间延迟** - 极少数情况下需要等待 5-10 分钟

---

**重要**: 这个错误 100% 是因为测试用户列表中没有您的邮箱。添加后问题会立即解决！


