import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import {
  ConnectedAccountsSchema,
  ExportPersonaInputSchema,
  LlmPreferencesSchema,
  PersonaRecordSchema,
  PersonaSchema,
} from "./schemas";
import { InMemoryAdapter, PersonaAdapter } from "./adapter";
import { generatePersonaFromAccounts } from "./generation";

export const configSchema = z.object({
  "db.adapter": z.enum(["memory", "convex", "supabase"]).default("memory"),
  "convex.url": z.string().optional(),
  "supabase.url": z.string().optional(),
  "supabase.serviceKey": z.string().optional(),
});

function getAdapter(config: z.infer<typeof configSchema>): PersonaAdapter {
  switch (config["db.adapter"]) {
    case "memory":
      return new InMemoryAdapter();
    case "convex":
      // Placeholder: later wire real Convex implementation
      return new InMemoryAdapter();
    case "supabase":
      // Placeholder: later wire real Supabase implementation
      return new InMemoryAdapter();
  }
}

export default function createServer({ config }: { config: z.infer<typeof configSchema> }) {
  const server = new McpServer({ name: "twin-mcp-persona", version: "0.1.0" });
  const adapter = getAdapter(configSchema.parse(config));

  // persona.generate_from_accounts
  server.registerTool(
    "persona.generate_from_accounts",
    {
      title: "Generate persona from connected accounts",
      description: "Creates a normalized persona profile from social/account data",
      inputSchema: { accounts: ConnectedAccountsSchema },
      outputSchema: PersonaSchema,
    },
    async ({ accounts }) => {
      const persona = generatePersonaFromAccounts({ accounts });
      return { content: [{ type: "text", text: JSON.stringify(persona) }], structuredContent: persona };
    }
  );

  // persona.export
  server.registerTool(
    "persona.export",
    {
      title: "Export persona",
      description: "Export persona as JSON, YAML, or LLM prompt",
      inputSchema: ExportPersonaInputSchema,
      outputSchema: z.union([
        z.object({ format: z.literal("llm_prompt"), content: z.string() }),
        z.object({ format: z.literal("json"), content: z.any() }),
        z.object({ format: z.literal("yaml"), content: z.string() }),
      ]),
    },
    async ({ supabaseId, personaId, format = "json" }) => {
      // minimal implementation for now using adapter (memory returns null history)
      const record = supabaseId
        ? await adapter.getPersonaBySupabaseId(supabaseId)
        : personaId
        ? await adapter.getPersonaById(personaId)
        : null;
      if (!record) throw new Error("Persona not found");
      if (format === "llm_prompt") {
        const parts: string[] = [];
        if (record.name) parts.push(`You are assisting ${record.name}`);
        if (record.style)
          parts.push(
            `who prefers ${record.style.formality}, ${record.style.verbosity} communication at ${record.style.technical_level} level`
          );
        if (record.languages?.length)
          parts.push(`Languages: ${record.languages.join(", ")} (preferred: ${record.preferredLanguage})`);
        if (record.currentGoals?.length) parts.push(`Current goals: ${record.currentGoals.join(", ")}`);
        return { content: [{ type: "text", text: parts.join(". ") + "." }], structuredContent: { format: "llm_prompt", content: parts.join(". ") + "." } };
      }
      if (format === "yaml") {
        const yaml = JSON.stringify(record); // placeholder; avoid adding yaml dep now
        return { content: [{ type: "text", text: yaml }], structuredContent: { format: "yaml", content: yaml } };
      }
      return { content: [{ type: "text", text: JSON.stringify(record) }], structuredContent: { format: "json", content: record } };
    }
  );

  // HTTP transport handler for Smithery
  const port = parseInt(process.env.PORT || "3000");
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  // Smithery will call transport per request; here we just return server and let Smithery handle binding
  return server.server;
}
