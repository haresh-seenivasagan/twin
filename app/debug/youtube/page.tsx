'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Youtube, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { InfinityIcon } from '@/components/ui/infinity-icon'
import Link from 'next/link'

interface YouTubeData {
  fetched_at: string
  subscriptions: any[]
  liked_videos: any[]
  playlists: any[]
}

export default function YouTubeDebugPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/youtube/debug')
      const result = await response.json() as { error?: string; [key: string]: any }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch YouTube data')
      }

      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      setError(null)

      const response = await fetch('/api/youtube/refresh')
      const result = await response.json() as { error?: string; [key: string]: any }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to refresh YouTube data')
      }

      // Re-fetch debug data
      await fetchData()
      alert('✅ YouTube data refreshed successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      alert('❌ Failed to refresh: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <InfinityIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Twin</span>
            <span className="text-sm text-muted-foreground ml-4">/ YouTube Debug</span>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">YouTube Data Debug</h1>
          <p className="text-muted-foreground">
            View and refresh your collected YouTube data
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{error}</p>
              {error.includes('not authenticated') && (
                <Link href="/login" className="mt-4 inline-block">
                  <Button>Go to Login</Button>
                </Link>
              )}
              {error.includes('No YouTube data') && (
                <Link href="/onboarding/connect" className="mt-4 inline-block">
                  <Button>Connect YouTube</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.user?.email?.split('@')[0] || 'Unknown'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{data.user?.email}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.youtube_data?.subscriptions?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Channels followed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Liked Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.youtube_data?.liked_videos?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Videos liked</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Playlists</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.youtube_data?.playlists?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Playlists created</p>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <Button onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh YouTube Data
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={fetchData}>
                Reload View
              </Button>
            </div>

            {/* Data fetched timestamp */}
            {data.youtube_data?.fetched_at && (
              <Card className="mb-6 bg-muted">
                <CardContent className="pt-6 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    Last fetched: {new Date(data.youtube_data.fetched_at).toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            )}

            {/* Subscriptions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Subscriptions ({data.youtube_data?.subscriptions?.count || 0})</CardTitle>
                <CardDescription>Channels you follow on YouTube</CardDescription>
              </CardHeader>
              <CardContent>
                {data.youtube_data?.subscriptions?.sample?.length > 0 ? (
                  <div className="space-y-3">
                    {data.youtube_data.subscriptions.sample.map((sub: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-semibold">{sub.channelTitle}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {sub.description?.substring(0, 100)}...
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Subscribed: {new Date(sub.publishedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {data.youtube_data.subscriptions.count > 5 && (
                      <p className="text-sm text-muted-foreground">
                        + {data.youtube_data.subscriptions.count - 5} more subscriptions
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No subscriptions found</p>
                )}
              </CardContent>
            </Card>

            {/* Liked Videos */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Liked Videos ({data.youtube_data?.liked_videos?.count || 0})</CardTitle>
                <CardDescription>Videos you've liked on YouTube</CardDescription>
              </CardHeader>
              <CardContent>
                {data.youtube_data?.liked_videos?.sample?.length > 0 ? (
                  <div className="space-y-3">
                    {data.youtube_data.liked_videos.sample.map((video: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-semibold">{video.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Channel: {video.channelTitle}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Published: {new Date(video.publishedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {data.youtube_data.liked_videos.count > 5 && (
                      <p className="text-sm text-muted-foreground">
                        + {data.youtube_data.liked_videos.count - 5} more liked videos
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No liked videos found</p>
                )}
              </CardContent>
            </Card>

            {/* Playlists */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Playlists ({data.youtube_data?.playlists?.count || 0})</CardTitle>
                <CardDescription>Playlists you've created</CardDescription>
              </CardHeader>
              <CardContent>
                {data.youtube_data?.playlists?.sample?.length > 0 ? (
                  <div className="space-y-3">
                    {data.youtube_data.playlists.sample.map((playlist: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-semibold">{playlist.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {playlist.description || 'No description'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {playlist.itemCount} videos
                        </div>
                      </div>
                    ))}
                    {data.youtube_data.playlists.count > 5 && (
                      <p className="text-sm text-muted-foreground">
                        + {data.youtube_data.playlists.count - 5} more playlists
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No playlists found</p>
                )}
              </CardContent>
            </Card>

            {/* Raw JSON */}
            <Card>
              <CardHeader>
                <CardTitle>Raw Data (JSON)</CardTitle>
                <CardDescription>Complete YouTube data structure</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
