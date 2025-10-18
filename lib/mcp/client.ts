/**
 * MCP Client for Twin Persona Server
 *
 * In production (Cloudflare Workers): Uses Service Binding for direct worker-to-worker calls
 * In development (localhost): Uses HTTP fetch to deployed MCP worker
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';

const MCP_SERVER_URL =
  process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
  'https://twin-mcp-persona.erniesg.workers.dev/mcp';

export interface MCPRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: number | string;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface Persona {
  name: string;
  languages: string[];
  preferredLanguage: string;
  style: {
    formality: 'formal' | 'casual' | 'adaptive';
    verbosity: 'concise' | 'detailed' | 'balanced';
    technical_level: 'beginner' | 'intermediate' | 'advanced';
  };
  interests: string[];
  profession?: string;
  currentGoals: string[];
}

export class MCPClient {
  private async call(request: MCPRequest): Promise<MCPResponse> {
    try {
      let response: Response;
      let transportMethod = 'http';

      // Try to use Service Binding if running in Cloudflare Worker context
      try {
        const context = getCloudflareContext();
        if (context?.env?.MCP_PERSONA) {
          transportMethod = 'service-binding';
          console.log('MCP Request (Service Binding):', {
            method: request.method,
            params: request.params?.name || 'unknown',
            binding: 'MCP_PERSONA',
          });

          // Use service binding for direct worker-to-worker call
          // Path must be /mcp (hostname doesn't matter for service bindings)
          response = await context.env.MCP_PERSONA.fetch('https://fake-host/mcp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
          });
        } else {
          throw new Error('Service binding not available');
        }
      } catch (bindingError) {
        // Fall back to HTTP fetch (local development)
        transportMethod = 'http';
        console.log('MCP Request (HTTP):', {
          url: MCP_SERVER_URL,
          method: request.method,
          params: request.params?.name || 'unknown',
          reason: bindingError instanceof Error ? bindingError.message : 'unknown',
        });

        response = await fetch(MCP_SERVER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MCP HTTP Error:', {
          transport: transportMethod,
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500),
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as MCPResponse;

      if (data.error) {
        console.error('MCP Error Response:', data.error);
        throw new Error(`MCP Error ${data.error.code}: ${data.error.message}`);
      }

      console.log('MCP Success:', {
        transport: transportMethod,
        hasResult: !!data.result,
        resultKeys: data.result ? Object.keys(data.result) : [],
      });

      return data;
    } catch (error) {
      console.error('MCP call failed:', error);
      throw error;
    }
  }

  /**
   * Generate a mock persona for testing/development
   * No OAuth required!
   */
  async generateMockPersona(options: {
    template?: 'developer' | 'designer' | 'manager' | 'student' | 'random';
    customInstructions?: string;
  }): Promise<Persona> {
    const response = await this.call({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'persona.generate_mock',
        arguments: {
          template: options.template || 'random',
          customInstructions: options.customInstructions,
        },
      },
      id: Date.now(),
    });

    // Parse the response
    const content = response.result?.content?.[0]?.text;
    if (!content) {
      throw new Error('No persona data in response');
    }

    return JSON.parse(content);
  }

  /**
   * Generate persona from connected OAuth accounts
   */
  async generateFromAccounts(accounts: {
    google?: any;
    github?: any;
    linkedin?: any;
    twitter?: any;
  }): Promise<Persona> {
    const response = await this.call({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'persona.generate_from_accounts',
        arguments: { accounts },
      },
      id: Date.now(),
    });

    const content = response.result?.content?.[0]?.text;
    if (!content) {
      throw new Error('No persona data in response');
    }

    return JSON.parse(content);
  }

  /**
   * Export persona in different formats
   */
  async exportPersona(options: {
    personaId?: string;
    format?: 'json' | 'yaml' | 'llm_prompt';
  }): Promise<any> {
    const response = await this.call({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'persona.export',
        arguments: {
          personaId: options.personaId,
          format: options.format || 'json',
        },
      },
      id: Date.now(),
    });

    return response.result;
  }

  /**
   * List available tools (for debugging)
   */
  async listTools(): Promise<any[]> {
    const response = await this.call({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: Date.now(),
    });

    return response.result?.tools || [];
  }
}

// Export singleton instance
export const mcpClient = new MCPClient();
