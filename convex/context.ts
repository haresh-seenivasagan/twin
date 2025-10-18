import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Generate context for LLM
export const generateContext = action({
  args: {
    supabaseId: v.string(),
    purpose: v.union(
      v.literal("coding"),
      v.literal("creative"),
      v.literal("analysis"),
      v.literal("chat"),
      v.literal("general")
    ),
    llm: v.optional(v.union(
      v.literal("auto"),
      v.literal("claude"),
      v.literal("openai"),
      v.literal("gemini")
    )),
    includeMemories: v.optional(v.boolean()),
    memoryLimit: v.optional(v.number()),
    format: v.optional(v.union(
      v.literal("claude"),
      v.literal("openai"),
      v.literal("gemini"),
      v.literal("universal")
    )),
  },
  handler: async (ctx, args) => {
    // Get persona
    const persona = await ctx.runQuery(api.personas.getPersona, {
      supabaseId: args.supabaseId,
    });

    if (!persona) {
      return {
        systemPrompt: "You are a helpful AI assistant.",
        llmSelected: args.llm || "claude",
        tokenCount: 10,
        memoriesIncluded: 0,
      };
    }

    // Determine which LLM to use
    let selectedLLM = args.llm || "auto";
    if (selectedLLM === "auto") {
      const preferences = persona.llmPreferences;
      selectedLLM = preferences[args.purpose] || preferences.default || "claude";
    }

    // Get relevant memories if requested
    let memories: any[] = [];
    if (args.includeMemories) {
      try {
        const searchQuery = getSearchQueryForPurpose(args.purpose, persona);
        const memResults = await ctx.runAction(api.memories.searchMemories, {
          supabaseId: args.supabaseId,
          query: searchQuery,
          limit: args.memoryLimit || 5,
        });

        if (Array.isArray(memResults)) {
          memories = memResults;
        }
      } catch (error) {
        console.error("Error fetching memories:", error);
        // Continue without memories
      }
    }

    // Build context
    const contextParts: string[] = [];

    // Add persona identity
    if (persona.name) {
      contextParts.push(`You are assisting ${persona.name}`);
    }

    // Add communication style
    if (persona.style) {
      const styleDesc = buildStyleDescription(persona.style);
      if (styleDesc) contextParts.push(styleDesc);
    }

    // Add languages
    if (persona.languages?.length > 0) {
      contextParts.push(
        `Languages: ${persona.languages.join(", ")} (preferred: ${persona.preferredLanguage})`
      );
    }

    // Add professional context
    if (persona.profession) {
      contextParts.push(`Profession: ${persona.profession}`);
    }

    // Add goals and interests based on purpose
    if (args.purpose === "coding" || args.purpose === "analysis") {
      if (persona.currentGoals?.length > 0) {
        contextParts.push(`Current goals: ${persona.currentGoals.join(", ")}`);
      }
    }

    if (persona.interests?.length > 0) {
      contextParts.push(`Interests: ${persona.interests.join(", ")}`);
    }

    // Add memories as context
    if (memories.length > 0) {
      const memoryTexts = memories
        .map((m) => m.memory || m.content || m.text)
        .filter(Boolean);
      if (memoryTexts.length > 0) {
        contextParts.push(`Relevant context from memory: ${memoryTexts.join(". ")}`);
      }
    }

    // Add custom data if relevant
    if (persona.customData && Object.keys(persona.customData).length > 0) {
      const relevantCustomData = filterCustomDataForPurpose(
        persona.customData,
        args.purpose
      );
      if (relevantCustomData) {
        contextParts.push(`Additional preferences: ${JSON.stringify(relevantCustomData)}`);
      }
    }

    // Format based on LLM
    const systemPrompt = formatPromptForLLM(
      contextParts.join(". ") + ".",
      selectedLLM as "claude" | "openai" | "gemini",
      args.format
    );

    // Save to context history
    const user = await ctx.runQuery(api.users.getBySupabaseId, {
      supabaseId: args.supabaseId,
    });

    if (user) {
      await ctx.runMutation(api.context.saveContextHistory, {
        userId: user._id,
        purpose: args.purpose,
        llmUsed: selectedLLM,
        systemPrompt,
        tokenCount: Math.ceil(systemPrompt.length / 4),
        memoriesIncluded: memories.length,
      });
    }

    return {
      systemPrompt,
      llmSelected: selectedLLM,
      tokenCount: Math.ceil(systemPrompt.length / 4),
      memoriesIncluded: memories.length,
    };
  },
});

// Save context generation history
export const saveContextHistory = mutation({
  args: {
    userId: v.id("users"),
    purpose: v.string(),
    llmUsed: v.string(),
    systemPrompt: v.string(),
    tokenCount: v.number(),
    memoriesIncluded: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contextHistory", {
      userId: args.userId,
      purpose: args.purpose,
      llmUsed: args.llmUsed,
      systemPrompt: args.systemPrompt,
      tokenCount: args.tokenCount,
      memoriesIncluded: args.memoriesIncluded,
      createdAt: Date.now(),
    });
  },
});

// Get context history
export const getContextHistory = query({
  args: {
    supabaseId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("contextHistory")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 10);
  },
});

// Get most recent context by purpose
export const getRecentContextByPurpose = query({
  args: {
    supabaseId: v.string(),
    purpose: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (!user) return null;

    return await ctx.db
      .query("contextHistory")
      .withIndex("by_purpose", (q) =>
        q.eq("userId", user._id).eq("purpose", args.purpose)
      )
      .order("desc")
      .first();
  },
});

// Helper functions
function buildStyleDescription(style: any): string {
  const parts = [];

  if (style.formality && style.verbosity && style.technical_level) {
    parts.push(
      `who prefers ${style.formality}, ${style.verbosity} communication at ${style.technical_level} technical level`
    );
  }

  return parts.join(" ");
}

function getSearchQueryForPurpose(purpose: string, persona: any): string {
  switch (purpose) {
    case "coding":
      return "programming languages frameworks tools development";
    case "creative":
      return "creative writing ideas preferences style";
    case "analysis":
      return "analysis data insights research methods";
    case "chat":
    case "general":
    default:
      return persona.interests?.join(" ") || "general conversation";
  }
}

function filterCustomDataForPurpose(customData: any, purpose: string): any {
  if (!customData) return null;

  const relevantKeys: Record<string, string[]> = {
    coding: ["preferred_ide", "coding_style", "git_workflow", "testing_approach"],
    creative: ["writing_style", "tone", "themes", "inspiration"],
    analysis: ["data_tools", "visualization_preferences", "reporting_style"],
    chat: ["conversation_topics", "humor_style", "formality"],
    general: [],
  };

  const keys = relevantKeys[purpose] || relevantKeys.general;
  if (keys.length === 0) return customData;

  const filtered: any = {};
  for (const key of keys) {
    if (customData[key]) {
      filtered[key] = customData[key];
    }
  }

  return Object.keys(filtered).length > 0 ? filtered : null;
}

function formatPromptForLLM(
  basePrompt: string,
  llm: "claude" | "openai" | "gemini",
  format?: string
): string {
  // If specific format requested, use it
  if (format && format !== "universal") {
    llm = format as "claude" | "openai" | "gemini";
  }

  switch (llm) {
    case "claude":
      return `${basePrompt}\n\nPlease provide helpful, accurate, and thoughtful responses while maintaining the communication style preferences described above.`;

    case "openai":
      return `${basePrompt}\n\nYou are a helpful assistant. Please maintain consistency with the user's preferences and context provided above.`;

    case "gemini":
      return `${basePrompt}\n\nBased on this context, provide assistance that aligns with the user's preferences and background.`;

    default:
      return basePrompt;
  }
}

// Generate quick context (cached version)
export const getQuickContext = query({
  args: {
    supabaseId: v.string(),
  },
  handler: async (ctx, args) => {
    const persona = await ctx.db
      .query("personas")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (!persona) return null;

    const parts = [];

    if (persona.name) parts.push(`User: ${persona.name}`);
    if (persona.profession) parts.push(`Role: ${persona.profession}`);
    if (persona.preferredLanguage) parts.push(`Language: ${persona.preferredLanguage}`);

    return parts.join(", ");
  },
});