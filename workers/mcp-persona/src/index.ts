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

  // persona.generate_mock
  server.registerTool(
    "persona.generate_mock",
    {
      title: "Generate mock persona for testing",
      description: "Creates a test persona with optional custom instructions. Perfect for development and testing.",
      inputSchema: z.object({
        customInstructions: z.string().optional().describe("Optional freeform instructions (e.g., 'Make them a senior developer from Singapore')"),
        template: z.enum(["developer", "designer", "manager", "student", "random"]).default("random").describe("Preset persona template"),
      }),
      outputSchema: PersonaSchema,
    },
    async ({ customInstructions, template = "random" }) => {
      const templates = {
        developer: {
          name: "Alex Chen",
          languages: ["en", "zh"],
          preferredLanguage: "en",
          style: { formality: "casual", verbosity: "concise", technical_level: "advanced" },
          interests: ["TypeScript", "React", "Systems Design", "AI/ML"],
          profession: "Senior Full-Stack Developer",
          currentGoals: ["Build scalable microservices", "Learn Rust", "Contribute to open source"],
        },
        designer: {
          name: "Maya Patel",
          languages: ["en"],
          preferredLanguage: "en",
          style: { formality: "casual", verbosity: "balanced", technical_level: "intermediate" },
          interests: ["UI/UX", "Figma", "Design Systems", "Accessibility"],
          profession: "Product Designer",
          currentGoals: ["Master design systems", "Improve accessibility skills", "Learn motion design"],
        },
        manager: {
          name: "Jordan Lee",
          languages: ["en", "ko"],
          preferredLanguage: "en",
          style: { formality: "adaptive", verbosity: "balanced", technical_level: "intermediate" },
          interests: ["Team Leadership", "Agile", "Product Strategy", "Mentoring"],
          profession: "Engineering Manager",
          currentGoals: ["Grow engineering team", "Improve 1:1s", "Learn data-driven decision making"],
        },
        student: {
          name: "Sam Wilson",
          languages: ["en"],
          preferredLanguage: "en",
          style: { formality: "casual", verbosity: "detailed", technical_level: "beginner" },
          interests: ["Web Development", "Python", "Data Science", "Machine Learning"],
          profession: "Computer Science Student",
          currentGoals: ["Complete CS degree", "Build portfolio projects", "Land first internship"],
        },
      };

      let persona = templates[template === "random" ? ["developer", "designer", "manager", "student"][Math.floor(Math.random() * 4)] as keyof typeof templates : template as keyof typeof templates];

      // Apply custom instructions if provided
      if (customInstructions) {
        const lower = customInstructions.toLowerCase();
        if (lower.includes("singapore") || lower.includes("sg")) {
          persona.languages = ["en", "zh", "ms"];
        }
        if (lower.includes("senior") || lower.includes("lead")) {
          persona.style.technical_level = "advanced";
          persona.profession = "Senior " + (persona.profession || "Professional");
        }
        if (lower.includes("junior") || lower.includes("beginner")) {
          persona.style.technical_level = "beginner";
        }
        if (lower.includes("formal")) {
          persona.style.formality = "formal";
        }
        if (lower.includes("verbose") || lower.includes("detailed")) {
          persona.style.verbosity = "detailed";
        }
        if (lower.includes("concise") || lower.includes("brief")) {
          persona.style.verbosity = "concise";
        }
      }

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
