# ⚡ 快速修复指南

## 🎯 问题：Error 403: access_denied

**原因**: 您的邮箱不在 Google OAuth 应用的测试用户列表中

## ✅ 3 步解决方案

### 1️⃣ 访问 Google Cloud Console
```
https://console.cloud.google.com/
```

### 2️⃣ 添加测试用户
```
左侧菜单 → APIs & Services → OAuth consent screen 
→ 滚动到 "Test users" 
→ 点击 "+ ADD USERS" 
→ 输入: chirsholland6@gmail.com 
→ 点击 "Save"
```

### 3️⃣ 重新测试
```
关闭 Google 登录页面
重新访问: http://localhost:3000/onboarding/connect
点击 "Connect YouTube"
```

## 🖼️ 视觉指引

您需要在 Google Cloud Console 看到这个：

```
OAuth consent screen
─────────────────────
Publishing status: 🟡 Testing
User type: External

Test users
┌──────────────────────────┐
│ + ADD USERS              │ ← 点击这里
└──────────────────────────┘

添加后：
┌──────────────────────────────┐
│ chirsholland6@gmail.com  [x] │ ← 应该看到这个
└──────────────────────────────┘
```

## ⏱️ 生效时间
**立即生效！** 添加后不需要等待。

## 🔗 直接链接
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)

---

**就这么简单！** 添加测试用户后问题会立即解决。


