import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server'

// Required for Cloudflare Workers deployment

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://twin-mcp-persona.erniesg.workers.dev/mcp'

interface MCPRequest {
  jsonrpc: string
  method: string
  params?: {
    name: string
    arguments: any
  }
  id: number
}

interface GeneratePersonaOptions {
  focusAreas?: string[]
  customInstructions?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle POST - Generate persona
  if (req.method === 'POST') {
    try {
      const supabase = await createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const body: GeneratePersonaOptions = req.body
      const { focusAreas, customInstructions } = body

      const { data: personaData, error: fetchError } = await supabase
        .from('user_personas')
        .select('youtube_data')
        .eq('user_id', user.id)
        .single()

      if (fetchError || !personaData?.youtube_data) {
        return res.status(400).json({ error: 'No YouTube data found. Please connect your YouTube account first.' })
      }

      const youtubeData = personaData.youtube_data

      const mcpRequest: MCPRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'persona.generate',
          arguments: {
            accounts: {
              youtube: {
                subscriptions: youtubeData.subscriptions,
                likedVideos: youtubeData.likedVideos,
                playlists: youtubeData.playlists,
              },
            },
            focusAreas,
            customInstructions,
          },
        },
        id: 1,
      }

      const mcpResponse = await fetch(MCP_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mcpRequest),
      })

      if (!mcpResponse.ok) {
        throw new Error(`MCP server error: ${mcpResponse.statusText}`)
      }

      const mcpResult = await mcpResponse.json()
      const personaContent = mcpResult.result?.content?.[0]?.text

      if (!personaContent) {
        throw new Error('Invalid MCP response format')
      }

      let generatedPersona
      try {
        generatedPersona = JSON.parse(personaContent)
      } catch {
        generatedPersona = {
          name: user.email?.split('@')[0] || 'User',
          description: personaContent,
          generatedAt: new Date().toISOString(),
        }
      }

      const { error: updateError } = await supabase
        .from('user_personas')
        .update({
          persona: generatedPersona,
          focus_areas: focusAreas || [],
          custom_instructions: customInstructions || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to save persona:', updateError)
        throw new Error('Failed to save generated persona')
      }

      return res.status(200).json({
        success: true,
        persona: generatedPersona,
      })
    } catch (error) {
      console.error('Persona generation error:', error)
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate persona' })
    }
  }

  // Handle GET - Retrieve current persona
  if (req.method === 'GET') {
    try {
      const supabase = await createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const { data: personaData, error: fetchError } = await supabase
        .from('user_personas')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        return res.status(404).json({ error: 'No persona found' })
      }

      return res.status(200).json({
        success: true,
        persona: personaData.persona,
        youtubeData: personaData.youtube_data,
        focusAreas: personaData.focus_areas,
        customInstructions: personaData.custom_instructions,
      })
    } catch (error) {
      console.error('Error fetching persona:', error)
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch persona' })
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' })
}
