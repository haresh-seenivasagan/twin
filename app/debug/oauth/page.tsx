'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function OAuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkOAuthConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/env')
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      setDebugInfo({ error: 'Failed to fetch debug info' })
    } finally {
      setLoading(false)
    }
  }

  const testYouTubeLogin = () => {
    window.location.href = '/api/youtube/login'
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">OAuth 调试页面</h1>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">环境配置检查</h2>
          <Button onClick={checkOAuthConfig} disabled={loading} className="mb-4">
            {loading ? '检查中...' : '检查 OAuth 配置'}
          </Button>

          {debugInfo && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">配置信息：</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">YouTube OAuth 测试</h2>
          <p className="text-gray-600 mb-4">
            点击下面的按钮测试 YouTube OAuth 流程。如果配置正确，应该会重定向到 Google 授权页面。
          </p>
          <Button onClick={testYouTubeLogin} className="bg-red-600 hover:bg-red-700">
            测试 YouTube 登录
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">解决 "未验证应用" 错误</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">方案 1：添加测试用户</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>访问 <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600">Google Cloud Console</a></li>
                <li>选择您的项目</li>
                <li>导航到 "APIs & Services" → "OAuth consent screen"</li>
                <li>在 "Test users" 部分添加您的邮箱</li>
                <li>确保重定向 URI 包含：<code className="bg-gray-200 px-1 rounded">http://localhost:3000/api/youtube/callback</code></li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold">方案 2：检查环境变量</h3>
              <p className="text-sm text-gray-600">
                确保 <code className="bg-gray-200 px-1 rounded">.env.local</code> 文件包含正确的 Google OAuth 凭据。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

