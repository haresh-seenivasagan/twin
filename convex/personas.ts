import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Get or create user
export const ensureUser = mutation({
  args: {
    supabaseId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (existing) {
      // Update last sync time
      await ctx.db.patch(existing._id, {
        lastSync: Date.now(),
      });
      return existing._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      supabaseId: args.supabaseId,
      email: args.email,
      lastSync: Date.now(),
    });
  },
});

// Create or update persona
export const upsertPersona = mutation({
  args: {
    supabaseId: v.string(),
    email: v.string(),
    persona: v.object({
      name: v.string(),
      languages: v.array(v.string()),
      preferredLanguage: v.string(),
      style: v.object({
        formality: v.union(v.literal("formal"), v.literal("casual"), v.literal("adaptive")),
        verbosity: v.union(v.literal("concise"), v.literal("detailed"), v.literal("balanced")),
        technical_level: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
      }),
      interests: v.array(v.string()),
      profession: v.optional(v.string()),
      currentGoals: v.array(v.string()),
    }),
    llmPreferences: v.object({
      default: v.string(),
      coding: v.string(),
      creative: v.string(),
      analysis: v.string(),
      chat: v.string(),
    }),
    customData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Ensure user exists
    const userId = await ctx.runMutation(api.personas.ensureUser, {
      supabaseId: args.supabaseId,
      email: args.email,
    });

    // Check if persona exists
    const existing = await ctx.db
      .query("personas")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const personaData = {
      userId,
      supabaseId: args.supabaseId,
      ...args.persona,
      llmPreferences: args.llmPreferences,
      customData: args.customData,
      supabaseVersion: existing ? (existing.supabaseVersion + 1) : 1,
      lastModified: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, personaData);

      // Schedule async backup to Supabase
      await ctx.scheduler.runAfter(0, api.personas.syncToSupabase, {
        personaId: existing._id,
        supabaseId: args.supabaseId,
      });

      return existing._id;
    }

    // Create new persona
    const personaId = await ctx.db.insert("personas", personaData);

    // Schedule async backup to Supabase
    await ctx.scheduler.runAfter(0, api.personas.syncToSupabase, {
      personaId,
      supabaseId: args.supabaseId,
    });

    return personaId;
  },
});

// Get persona (reactive query)
export const getPersona = query({
  args: {
    supabaseId: v.optional(v.string()),
    personaId: v.optional(v.id("personas")),
  },
  handler: async (ctx, args) => {
    if (args.personaId) {
      return await ctx.db.get(args.personaId);
    }

    if (!args.supabaseId) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (!user) return null;

    return await ctx.db
      .query("personas")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
  },
});

// Get all personas for user (for history/versions)
export const getPersonaHistory = query({
  args: {
    supabaseId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("personas")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Background sync to Supabase (action)
export const syncToSupabase = action({
  args: {
    personaId: v.id("personas"),
    supabaseId: v.string(),
  },
  handler: async (ctx, args) => {
    const persona = await ctx.runQuery(api.personas.getPersona, {
      personaId: args.personaId,
    });

    if (!persona) return;

    // Get Supabase client (you'll need to set up the client)
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Update profile in Supabase
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: args.supabaseId,
        email: persona.email || "",
        persona: {
          name: persona.name,
          languages: persona.languages,
          preferredLanguage: persona.preferredLanguage,
          style: persona.style,
          interests: persona.interests,
          profession: persona.profession,
          currentGoals: persona.currentGoals,
        },
        llm_preferences: persona.llmPreferences,
        custom_data: persona.customData,
        convex_sync_id: args.personaId,
        last_synced: new Date().toISOString(),
      });

    if (error) {
      console.error("Failed to sync to Supabase:", error);
    }

    return { success: !error };
  },
});

// Update specific persona fields
export const updatePersonaField = mutation({
  args: {
    supabaseId: v.string(),
    field: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (!user) throw new Error("User not found");

    const persona = await ctx.db
      .query("personas")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!persona) throw new Error("Persona not found");

    // Update specific field
    const updates: any = {
      lastModified: Date.now(),
    };

    // Handle nested fields
    if (args.field.includes(".")) {
      const [parent, child] = args.field.split(".");
      updates[parent] = {
        ...persona[parent as keyof typeof persona],
        [child]: args.value,
      };
    } else {
      updates[args.field] = args.value;
    }

    await ctx.db.patch(persona._id, updates);

    // Schedule sync to Supabase
    await ctx.scheduler.runAfter(0, api.personas.syncToSupabase, {
      personaId: persona._id,
      supabaseId: args.supabaseId,
    });

    return { success: true };
  },
});

// Export persona for portability
export const exportPersona = query({
  args: {
    supabaseId: v.string(),
    format: v.optional(v.union(v.literal("json"), v.literal("yaml"), v.literal("llm_prompt"))),
  },
  handler: async (ctx, args) => {
    const persona = await ctx.runQuery(api.personas.getPersona, {
      supabaseId: args.supabaseId,
    });

    if (!persona) return null;

    const format = args.format || "json";

    // Get recent memories for context
    const user = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    const memories = user
      ? await ctx.db
          .query("memoryRefs")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .order("desc")
          .take(10)
      : [];

    const exportData = {
      version: "1.0.0",
      exported: new Date().toISOString(),
      persona: {
        name: persona.name,
        languages: persona.languages,
        preferredLanguage: persona.preferredLanguage,
        style: persona.style,
        interests: persona.interests,
        profession: persona.profession,
        currentGoals: persona.currentGoals,
      },
      llmPreferences: persona.llmPreferences,
      customData: persona.customData,
      recentMemories: memories.map((m) => ({
        content: m.content,
        category: m.category,
        importance: m.importance,
      })),
    };

    if (format === "llm_prompt") {
      // Generate LLM-friendly prompt
      const parts = [];

      if (persona.name) {
        parts.push(`You are assisting ${persona.name}`);
      }

      if (persona.style) {
        parts.push(
          `who prefers ${persona.style.formality}, ${persona.style.verbosity} communication at ${persona.style.technical_level} level`
        );
      }

      if (persona.languages?.length) {
        parts.push(
          `Languages: ${persona.languages.join(", ")} (preferred: ${persona.preferredLanguage})`
        );
      }

      if (persona.currentGoals?.length) {
        parts.push(`Current goals: ${persona.currentGoals.join(", ")}`);
      }

      if (persona.interests?.length) {
        parts.push(`Interests: ${persona.interests.join(", ")}`);
      }

      if (persona.profession) {
        parts.push(`Profession: ${persona.profession}`);
      }

      if (memories.length > 0) {
        const memoryContext = memories.map((m) => m.content).join(". ");
        parts.push(`Recent context: ${memoryContext}`);
      }

      return {
        format: "llm_prompt",
        content: parts.join(". ") + ".",
      };
    }

    return {
      format,
      content: exportData,
    };
  },
});