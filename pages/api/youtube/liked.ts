import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from '@/lib/youtube/token-store'
import { YouTubeClient } from '@/lib/youtube/client'

// Required for Cloudflare Workers deployment

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  // Use req.query for query parameters
  const email = req.query.email as string | undefined
  const maxResults = parseInt((req.query.maxResults as string) || '10')

  if (!email) {
    return res.status(400).json({ error: 'Email parameter required' })
  }

  const tokenData = getToken(email)

  if (!tokenData) {
    return res.status(401).json({ error: 'User not authenticated. Please login first.' })
  }

  try {
    const client = new YouTubeClient(tokenData.access_token)
    const likedVideos = await client.getLikedVideos(maxResults)

    return res.status(200).json({
      email,
      count: likedVideos.length,
      liked_videos: likedVideos,
    })
  } catch (error) {
    console.error('Failed to fetch liked videos:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch liked videos' })
  }
}
