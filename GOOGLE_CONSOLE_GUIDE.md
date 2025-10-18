# 📸 Google Cloud Console 详细配置指南

## 🚨 您当前看到的错误

```
Access blocked: Shiriai has not completed the Google verification process
Error 403: access_denied
chirsholland6@gmail.com
```

## ✅ 完整解决步骤

### 步骤 1: 登录 Google Cloud Console

1. 打开浏览器，访问：
   ```
   https://console.cloud.google.com/
   ```

2. 使用您的 Google 账号登录（建议使用项目创建者账号）

3. 在页面顶部，确认您选择了正确的项目
   - 如果不是 "Shiriai" 项目，点击项目名称下拉菜单切换

### 步骤 2: 导航到 OAuth 同意屏幕

1. 在左上角，点击 **☰** (汉堡菜单)

2. 向下滚动找到并点击 **"APIs & Services"** (API 和服务)

3. 在展开的子菜单中，点击 **"OAuth consent screen"** (OAuth 同意屏幕)

### 步骤 3: 添加测试用户

1. 在 OAuth consent screen 页面，您会看到以下信息：
   ```
   Publishing status: Testing
   User type: External
   ```

2. 向下滚动，找到 **"Test users"** 部分

3. 点击 **"+ ADD USERS"** 按钮

4. 在弹出的对话框中输入：
   ```
   chirsholland6@gmail.com
   ```

5. 点击 **"Add"** 或 **"Save"** 按钮

6. 确认您能看到添加的用户：
   ```
   Test users
   ┌─────────────────────────────┐
   │ chirsholland6@gmail.com [x] │
   └─────────────────────────────┘
   ```

### 步骤 4: 验证重定向 URI

1. 在左侧菜单中，点击 **"Credentials"** (凭据)

2. 在 **"OAuth 2.0 Client IDs"** 部分，找到您的客户端 ID
   - 应该有一个类似 "Web client" 的名称

3. 点击客户端 ID 的名称进入编辑页面

4. 在 **"Authorized redirect URIs"** 部分，确认包含：
   ```
   http://localhost:3000/api/youtube/callback
   ```

5. 如果没有，点击 **"+ ADD URI"** 添加：
   - 在输入框中输入：`http://localhost:3000/api/youtube/callback`
   - 点击页面底部的 **"SAVE"** 按钮

### 步骤 5: 重新测试

1. **关闭** 之前打开的 Google 授权页面

2. **清除浏览器缓存**（推荐）或使用无痕模式：
   - Chrome: Ctrl+Shift+N (Windows) 或 Cmd+Shift+N (Mac)
   - 访问：`http://localhost:3000/onboarding/connect`

3. 点击 **"Connect YouTube"** 按钮

4. 现在您应该看到正常的 Google 授权页面，可以选择账号并授权

## 🎯 关键检查点

### ✓ 检查清单

- [ ] 使用正确的 Google 账号登录 Console
- [ ] 选择了正确的项目（Shiriai）
- [ ] OAuth consent screen 显示 "Publishing status: Testing"
- [ ] 测试用户列表中包含 `chirsholland6@gmail.com`
- [ ] 重定向 URI 包含 `http://localhost:3000/api/youtube/callback`
- [ ] 清除了浏览器缓存或使用无痕模式

## 🔍 常见问题

### Q1: 找不到 "APIs & Services" 菜单？
**A**: 点击左上角的 ☰ 菜单图标，在展开的菜单中向下滚动

### Q2: 没有 "+ ADD USERS" 按钮？
**A**: 可能是权限不足，确保您使用的是项目所有者账号

### Q3: 添加用户后还是看到错误？
**A**: 
1. 确认添加的邮箱完全正确（包括拼写）
2. 清除浏览器缓存或使用无痕模式
3. 确保选择的 Google 账号与添加的测试用户一致

### Q4: "Authorized redirect URIs" 保存失败？
**A**: 确保 URI 格式正确，不要有空格或额外字符

## 📱 移动端配置

如果您在移动设备上，建议：
1. 切换到桌面模式访问 Google Cloud Console
2. 或者使用电脑完成配置

## 🌐 直接链接

快速访问相关页面：

- **OAuth 同意屏幕**: https://console.cloud.google.com/apis/credentials/consent
- **凭据页面**: https://console.cloud.google.com/apis/credentials
- **API 库**: https://console.cloud.google.com/apis/library

## ⚡ 快速命令

如果您已经配置好测试用户，可以运行：

```bash
# 启动开发服务器
npm run dev

# 在浏览器中访问
open http://localhost:3000/debug/oauth
```

## 🎉 成功标志

配置成功后，您会看到：

1. **Google 授权页面** 显示：
   - "Shiriai wants to access your Google Account"
   - 不再显示 "Access blocked" 错误

2. **授权完成后** 重定向到：
   ```
   http://localhost:3000/onboarding/connect?youtube=connected&email=...
   ```

3. **页面显示** YouTube 连接成功信息

---

## 💡 记住

**这个错误只需要一次配置！** 添加测试用户后，该账号可以一直访问您的应用，直到您发布应用或移除测试用户。


