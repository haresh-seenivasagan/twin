/**
 * YouTube Data API v3 client
 * Ported from backend/service/user_data.py
 */

interface YouTubeAPIResponse {
  items?: any[]
  nextPageToken?: string
  pageInfo?: {
    totalResults: number
    resultsPerPage: number
  }
}

export class YouTubeClient {
  private accessToken: string
  private baseUrl = 'https://www.googleapis.com/youtube/v3'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async makeRequest(endpoint: string, params: Record<string, any>): Promise<YouTubeAPIResponse> {
    const url = new URL(`${this.baseUrl}/${endpoint}`)

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`YouTube API request failed (${response.status}): ${error}`)
    }

    return response.json()
  }

  async getPlaylists(maxResults: number = 50): Promise<any[]> {
    const params = {
      part: 'snippet,contentDetails',
      mine: true,
      maxResults: Math.min(maxResults, 50)
    }

    const playlists: any[] = []

    try {
      let pageToken: string | undefined = undefined

      while (true) {
        if (pageToken) {
          params.pageToken = pageToken
        }

        const response = await this.makeRequest('playlists', params)
        playlists.push(...(response.items || []))

        // Check for next page
        if (!response.nextPageToken || playlists.length >= maxResults) {
          break
        }

        pageToken = response.nextPageToken
      }

      return playlists.slice(0, maxResults)
    } catch (error) {
      throw new Error(`Failed to fetch playlists: ${error}`)
    }
  }

  async getPlaylistItems(playlistId: string, maxResults: number = 50): Promise<any[]> {
    const params = {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: Math.min(maxResults, 50)
    }

    const videos: any[] = []

    try {
      let pageToken: string | undefined = undefined

      while (true) {
        if (pageToken) {
          params.pageToken = pageToken
        }

        const response = await this.makeRequest('playlistItems', params)
        videos.push(...(response.items || []))

        // Check for next page
        if (!response.nextPageToken || videos.length >= maxResults) {
          break
        }

        pageToken = response.nextPageToken
      }

      return videos.slice(0, maxResults)
    } catch (error) {
      throw new Error(`Failed to fetch playlist items: ${error}`)
    }
  }

  async getSubscriptions(maxResults: number = 50): Promise<any[]> {
    const params = {
      part: 'snippet',
      mine: true,
      maxResults: Math.min(maxResults, 50)
    }

    const subscriptions: any[] = []

    try {
      let pageToken: string | undefined = undefined

      while (true) {
        if (pageToken) {
          params.pageToken = pageToken
        }

        const response = await this.makeRequest('subscriptions', params)
        subscriptions.push(...(response.items || []))

        // Check for next page
        if (!response.nextPageToken || subscriptions.length >= maxResults) {
          break
        }

        pageToken = response.nextPageToken
      }

      return subscriptions.slice(0, maxResults)
    } catch (error) {
      throw new Error(`Failed to fetch subscriptions: ${error}`)
    }
  }

  async getLikedVideos(maxResults: number = 10): Promise<any[]> {
    try {
      // Get the user's channel ID first
      const channelResponse = await this.makeRequest('channels', {
        part: 'contentDetails',
        mine: true
      })

      if (!channelResponse.items || channelResponse.items.length === 0) {
        throw new Error('Could not find user channel')
      }

      // The liked videos playlist ID format
      const channelId = channelResponse.items[0].id
      const likedPlaylistId = `LL${channelId}`

      // Try to get videos from the liked playlist
      try {
        const params = {
          part: 'snippet,contentDetails',
          playlistId: likedPlaylistId,
          maxResults: Math.min(maxResults, 50)
        }

        const videos: any[] = []
        let pageToken: string | undefined = undefined

        while (true) {
          if (pageToken) {
            params.pageToken = pageToken
          }

          const response = await this.makeRequest('playlistItems', params)
          videos.push(...(response.items || []))

          if (!response.nextPageToken || videos.length >= maxResults) {
            break
          }

          pageToken = response.nextPageToken
        }

        return videos.slice(0, maxResults)
      } catch (playlistError) {
        // Fallback: try using myRating parameter
        const response = await this.makeRequest('videos', {
          part: 'snippet,contentDetails',
          myRating: 'like',
          maxResults
        })

        return response.items || []
      }
    } catch (error) {
      throw new Error(`Failed to fetch liked videos: ${error}`)
    }
  }

  async getChannelVideos(channelTitle: string, maxResults: number = 10): Promise<any[]> {
    try {
      // Step 1: Get channel details to retrieve uploads playlist ID
      const channelResponse = await this.makeRequest('channels', {
        part: 'contentDetails',
        forUsername: channelTitle,
        maxResults: 1
      })

      if (!channelResponse.items || channelResponse.items.length === 0) {
        throw new Error('Channel not found')
      }

      const uploadsPlaylistId = channelResponse.items[0]?.contentDetails?.relatedPlaylists?.uploads

      if (!uploadsPlaylistId) {
        throw new Error('Uploads playlist not found')
      }

      // Step 2: Fetch videos from the uploads playlist
      const params = {
        part: 'snippet,contentDetails',
        maxResults: Math.min(maxResults, 50),
        playlistId: uploadsPlaylistId
      }

      const videos: any[] = []
      let pageToken: string | undefined = undefined

      while (videos.length < maxResults) {
        if (pageToken) {
          params.pageToken = pageToken
        }

        const response = await this.makeRequest('playlistItems', params)
        const newItems = response.items || []

        const remainingSlots = maxResults - videos.length
        videos.push(...newItems.slice(0, remainingSlots))

        if (!response.nextPageToken || videos.length >= maxResults) {
          break
        }

        pageToken = response.nextPageToken
      }

      return videos
    } catch (error) {
      throw new Error(`Failed to fetch channel videos: ${error}`)
    }
  }
}
