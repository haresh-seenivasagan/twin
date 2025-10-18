/**
 * Twin MCP Persona Server - Cloudflare Worker
 * Native implementation for Cloudflare Workers (no Smithery build needed)
 */

import { generatePersonaFromAccounts } from './src/generation.js';
import { PersonaSchema } from './src/schemas.js';
import { InMemoryAdapter } from './src/adapter.js';

// Initialize in-memory storage adapter
const adapter = new InMemoryAdapter();

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
                // Only declare capabilities we actually implement
                // Removed: resources, prompts, logging (not implemented yet)
              },
              serverInfo: {
                name: 'twin-mcp-persona',
                version: '0.1.0'
              }
            }
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          });
        }

        // Handle initialized notification (client confirms initialization)
        if (body.method === 'notifications/initialized' || body.method === 'initialized') {
          // This is a notification, no response needed per JSON-RPC spec
          return new Response(null, {
            status: 204,
            headers: { 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Handle tools/list
        if (body.method === 'tools/list') {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              tools: [
                // Generation Tools
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
                  description: 'Generate persona from connected accounts (Google, GitHub, LinkedIn, Twitter)',
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
                // CRUD Operations
                {
                  name: 'persona.save',
                  description: 'Save/update a persona (creates new version)',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      supabaseId: { type: 'string', description: 'User ID from Supabase auth' },
                      persona: { type: 'object', description: 'Persona data to save' },
                      llmPreferences: {
                        type: 'object',
                        properties: {
                          default: { type: 'string' },
                          coding: { type: 'string' },
                          creative: { type: 'string' },
                          analysis: { type: 'string' },
                          chat: { type: 'string' }
                        }
                      }
                    },
                    required: ['supabaseId', 'persona']
                  }
                },
                {
                  name: 'persona.get',
                  description: 'Get persona by user ID or persona ID',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      supabaseId: { type: 'string' },
                      personaId: { type: 'string' }
                    }
                  }
                },
                {
                  name: 'persona.update_field',
                  description: 'Update a specific field in the persona (creates new version)',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      supabaseId: { type: 'string' },
                      personaId: { type: 'string' },
                      fieldPath: { type: 'string', description: 'Dot notation path (e.g., "style.formality")' },
                      value: { description: 'New value for the field' }
                    }
                  }
                },
                {
                  name: 'persona.get_history',
                  description: 'Get version history for a persona',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      supabaseId: { type: 'string', required: true }
                    },
                    required: ['supabaseId']
                  }
                },
                {
                  name: 'persona.rollback',
                  description: 'Rollback persona to a previous version',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      personaId: { type: 'string' },
                      toVersion: { type: 'number', description: 'Version number to rollback to' }
                    },
                    required: ['personaId', 'toVersion']
                  }
                },
                // Export
                {
                  name: 'persona.export',
                  description: 'Export persona in different formats (JSON, YAML, LLM prompt)',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      supabaseId: { type: 'string' },
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

          // CRUD Operations
          if (name === 'persona.save') {
            try {
              const result = await adapter.upsertPersona({
                supabaseId: args.supabaseId,
                persona: args.persona,
                llmPreferences: args.llmPreferences || {
                  default: 'claude',
                  coding: 'claude',
                  creative: 'gemini',
                  analysis: 'openai',
                  chat: 'claude'
                }
              });
              return new Response(JSON.stringify({
                jsonrpc: '2.0',
                id: body.id,
                result: {
                  content: [{ type: 'text', text: JSON.stringify(result) }]
                }
              }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              });
            } catch (error) {
              return new Response(JSON.stringify({
                jsonrpc: '2.0',
                id: body.id,
                error: { code: -32603, message: error.message }
              }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              });
            }
          }

          if (name === 'persona.get') {
            const persona = args.supabaseId
              ? await adapter.getPersonaBySupabaseId(args.supabaseId)
              : args.personaId
              ? await adapter.getPersonaById(args.personaId)
              : null;

            if (!persona) {
              return new Response(JSON.stringify({
                jsonrpc: '2.0',
                id: body.id,
                error: { code: -32602, message: 'Persona not found' }
              }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              });
            }

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

          if (name === 'persona.update_field') {
            try {
              const result = await adapter.updatePersonaField({
                supabaseId: args.supabaseId,
                personaId: args.personaId,
                fieldPath: args.fieldPath,
                value: args.value
              });
              return new Response(JSON.stringify({
                jsonrpc: '2.0',
                id: body.id,
                result: {
                  content: [{ type: 'text', text: JSON.stringify(result) }]
                }
              }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              });
            } catch (error) {
              return new Response(JSON.stringify({
                jsonrpc: '2.0',
                id: body.id,
                error: { code: -32603, message: error.message }
              }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              });
            }
          }

          if (name === 'persona.get_history') {
            const history = await adapter.getPersonaHistory({
              supabaseId: args.supabaseId
            });
            return new Response(JSON.stringify({
              jsonrpc: '2.0',
              id: body.id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(history) }]
              }
            }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }

          if (name === 'persona.rollback') {
            try {
              const result = await adapter.rollbackPersona({
                personaId: args.personaId,
                toVersion: args.toVersion
              });
              return new Response(JSON.stringify({
                jsonrpc: '2.0',
                id: body.id,
                result: {
                  content: [{ type: 'text', text: JSON.stringify(result) }]
                }
              }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              });
            } catch (error) {
              return new Response(JSON.stringify({
                jsonrpc: '2.0',
                id: body.id,
                error: { code: -32603, message: error.message }
              }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
              });
            }
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
