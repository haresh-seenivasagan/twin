import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Required for Cloudflare Workers deployment
export const runtime = 'edge'

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

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: GeneratePersonaOptions = await request.json()
    const { focusAreas, customInstructions } = body

    // Get YouTube data from Supabase
    const { data: personaData, error: fetchError } = await supabase
      .from('user_personas')
      .select('youtube_data')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !personaData?.youtube_data) {
      return NextResponse.json(
        { error: 'No YouTube data found. Please connect your YouTube account first.' },
        { status: 400 }
      )
    }

    const youtubeData = personaData.youtube_data

    // Call MCP server to generate persona
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

    // Extract persona from MCP response
    // MCP response format: { jsonrpc: "2.0", result: { content: [...] }, id: 1 }
    const personaContent = mcpResult.result?.content?.[0]?.text

    if (!personaContent) {
      throw new Error('Invalid MCP response format')
    }

    // Parse the generated persona (assuming it's JSON)
    let generatedPersona
    try {
      generatedPersona = JSON.parse(personaContent)
    } catch {
      // If not JSON, wrap in a basic structure
      generatedPersona = {
        name: user.email?.split('@')[0] || 'User',
        description: personaContent,
        generatedAt: new Date().toISOString(),
      }
    }

    // Update Supabase with generated persona
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

    return NextResponse.json({
      success: true,
      persona: generatedPersona,
    })
  } catch (error) {
    console.error('Persona generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate persona' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve current persona
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get persona from Supabase
    const { data: personaData, error: fetchError } = await supabase
      .from('user_personas')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'No persona found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      persona: personaData.persona,
      youtubeData: personaData.youtube_data,
      focusAreas: personaData.focus_areas,
      customInstructions: personaData.custom_instructions,
    })
  } catch (error) {
    console.error('Error fetching persona:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch persona' },
      { status: 500 }
    )
  }
}
