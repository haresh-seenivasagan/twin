import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User sync with Supabase
  users: defineTable({
    supabaseId: v.string(),
    email: v.string(),
    lastSync: v.number(),
  })
    .index("by_supabaseId", ["supabaseId"])
    .index("by_email", ["email"]),

  // Real-time persona data
  personas: defineTable({
    userId: v.id("users"),
    supabaseId: v.string(),

    // Core persona fields
    name: v.string(),
    languages: v.array(v.string()),
    preferredLanguage: v.string(),

    // Communication style
    style: v.object({
      formality: v.union(v.literal("formal"), v.literal("casual"), v.literal("adaptive")),
      verbosity: v.union(v.literal("concise"), v.literal("detailed"), v.literal("balanced")),
      technical_level: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    }),

    // Context
    interests: v.array(v.string()),
    profession: v.optional(v.string()),
    currentGoals: v.array(v.string()),

    // LLM preferences per use case
    llmPreferences: v.object({
      default: v.string(),
      coding: v.string(),
      creative: v.string(),
      analysis: v.string(),
      chat: v.string(),
    }),

    // Custom unstructured data
    customData: v.optional(v.any()),

    // Sync metadata
    supabaseVersion: v.number(),
    lastModified: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_supabaseId", ["supabaseId"]),

  // Memory references (actual memories stored in mem0)
  memoryRefs: defineTable({
    userId: v.id("users"),
    memoryId: v.string(), // mem0 memory ID
    content: v.string(),  // Cached content for quick display
    category: v.optional(v.string()),
    importance: v.optional(v.number()),
    confidence: v.optional(v.number()),
    source: v.optional(v.string()),
    supabaseSynced: v.boolean(),
    createdAt: v.number(),
    lastAccessed: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_category", ["userId", "category"])
    .index("by_importance", ["userId", "importance"]),

  // Context generation history
  contextHistory: defineTable({
    userId: v.id("users"),
    purpose: v.string(),
    llmUsed: v.string(),
    systemPrompt: v.string(),
    tokenCount: v.number(),
    memoriesIncluded: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_purpose", ["userId", "purpose"]),

  // Custom metadata storage
  metadata: defineTable({
    userId: v.id("users"),
    key: v.string(),
    value: v.any(),
    category: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_key", ["userId", "key"])
    .index("by_category", ["userId", "category"]),

  // Session tokens for auth sync
  sessions: defineTable({
    userId: v.id("users"),
    supabaseToken: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_token", ["supabaseToken"]),
});