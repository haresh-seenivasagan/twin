/**
 * Twin MCP Persona Server - Cloudflare Worker
 * Native implementation for Cloudflare Workers (no Smithery build needed)
 */

import { generatePersonaFromAccounts } from './src/generation.js';
import { PersonaSchema } from './src/schemas.js';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'twin-mcp-persona' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // MCP endpoint
    if (url.pathname === '/mcp' && request.method === 'POST') {
      try {
        const body = await request.json();

        // Handle MCP initialize
        if (body.method === 'initialize') {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: 'twin-mcp-persona',
                version: '0.1.0'
              }
            }
          }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Handle tools/list
        if (body.method === 'tools/list') {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              tools: [
                {
                  name: 'persona.generate_mock',
                  description: 'Generate mock persona for testing with optional custom instructions',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      template: {
                        type: 'string',
                        enum: ['developer', 'designer', 'manager', 'student', 'random'],
                        default: 'random'
                      },
                      customInstructions: {
                        type: 'string',
                        description: 'Freeform custom instructions'
                      }
                    }
                  }
                },
                {
                  name: 'persona.generate_from_accounts',
                  description: 'Generate persona from connected accounts',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      accounts: {
                        type: 'object',
                        properties: {
                          google: { type: 'object' },
                          github: { type: 'object' },
                          linkedin: { type: 'object' },
                          twitter: { type: 'object' }
                        }
                      }
                    },
                    required: ['accounts']
                  }
                },
                {
                  name: 'persona.export',
                  description: 'Export persona in different formats',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      personaId: { type: 'string' },
                      format: {
                        type: 'string',
                        enum: ['json', 'yaml', 'llm_prompt'],
                        default: 'json'
                      }
                    }
                  }
                }
              ]
            }
          }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Handle tools/call
        if (body.method === 'tools/call') {
          const { name, arguments: args } = body.params;

          if (name === 'persona.generate_mock') {
            const persona = generateMockPersona(args);
            return new Response(JSON.stringify({
              jsonrpc: '2.0',
              id: body.id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(persona) }]
              }
            }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }

          if (name === 'persona.generate_from_accounts') {
            const persona = generatePersonaFromAccounts(args);
            return new Response(JSON.stringify({
              jsonrpc: '2.0',
              id: body.id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(persona) }]
              }
            }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }

          if (name === 'persona.export') {
            // For now, return a mock response
            return new Response(JSON.stringify({
              jsonrpc: '2.0',
              id: body.id,
              result: {
                content: [{ type: 'text', text: 'Export feature coming soon' }]
              }
            }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        }

        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          error: { code: -32601, message: 'Method not found' }
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32700, message: error.message }
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Default response
    return new Response('Twin MCP Persona Server - Use POST /mcp for MCP protocol', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

function generateMockPersona({ template = 'random', customInstructions }) {
  const templates = {
    developer: {
      name: 'Alex Chen',
      languages: ['en', 'zh'],
      preferredLanguage: 'en',
      style: { formality: 'casual', verbosity: 'concise', technical_level: 'advanced' },
      interests: ['TypeScript', 'React', 'Systems Design', 'AI/ML'],
      profession: 'Senior Full-Stack Developer',
      currentGoals: ['Build scalable microservices', 'Learn Rust', 'Contribute to open source'],
    },
    designer: {
      name: 'Maya Patel',
      languages: ['en'],
      preferredLanguage: 'en',
      style: { formality: 'casual', verbosity: 'balanced', technical_level: 'intermediate' },
      interests: ['UI/UX', 'Figma', 'Design Systems', 'Accessibility'],
      profession: 'Product Designer',
      currentGoals: ['Master design systems', 'Improve accessibility skills', 'Learn motion design'],
    },
    manager: {
      name: 'Jordan Lee',
      languages: ['en', 'ko'],
      preferredLanguage: 'en',
      style: { formality: 'adaptive', verbosity: 'balanced', technical_level: 'intermediate' },
      interests: ['Team Leadership', 'Agile', 'Product Strategy', 'Mentoring'],
      profession: 'Engineering Manager',
      currentGoals: ['Grow engineering team', 'Improve 1:1s', 'Learn data-driven decision making'],
    },
    student: {
      name: 'Sam Wilson',
      languages: ['en'],
      preferredLanguage: 'en',
      style: { formality: 'casual', verbosity: 'detailed', technical_level: 'beginner' },
      interests: ['Web Development', 'Python', 'Data Science', 'Machine Learning'],
      profession: 'Computer Science Student',
      currentGoals: ['Complete CS degree', 'Build portfolio projects', 'Land first internship'],
    },
  };

  const chosenTemplate = template === 'random'
    ? templates[['developer', 'designer', 'manager', 'student'][Math.floor(Math.random() * 4)]]
    : templates[template];

  let persona = JSON.parse(JSON.stringify(chosenTemplate));

  // Apply custom instructions
  if (customInstructions) {
    const lower = customInstructions.toLowerCase();
    if (lower.includes('singapore') || lower.includes('sg')) {
      persona.languages = ['en', 'zh', 'ms'];
    }
    if (lower.includes('senior') || lower.includes('lead')) {
      persona.style.technical_level = 'advanced';
      persona.profession = 'Senior ' + (persona.profession || 'Professional');
    }
    if (lower.includes('junior') || lower.includes('beginner')) {
      persona.style.technical_level = 'beginner';
    }
    if (lower.includes('formal')) {
      persona.style.formality = 'formal';
    }
    if (lower.includes('verbose') || lower.includes('detailed')) {
      persona.style.verbosity = 'detailed';
    }
    if (lower.includes('concise') || lower.includes('brief')) {
      persona.style.verbosity = 'concise';
    }
  }

  return persona;
}
