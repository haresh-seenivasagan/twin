import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Add a memory (action that calls mem0)
export const addMemory = action({
  args: {
    supabaseId: v.string(),
    content: v.string(),
    metadata: v.optional(v.object({
      category: v.optional(v.string()),
      confidence: v.optional(v.number()),
      source: v.optional(v.string()),
      importance: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.runQuery(api.users.getBySupabaseId, {
      supabaseId: args.supabaseId,
    });

    if (!user) throw new Error("User not found");

    // Store in mem0
    const response = await fetch("https://api.mem0.ai/v1/memories/", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.MEM0_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: args.content }],
        user_id: args.supabaseId,
        metadata: args.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`mem0 error: ${response.statusText}`);
    }

    const memoryData = await response.json();
    const memoryId = memoryData.id || memoryData.memory_id || memoryData.results?.[0]?.id;

    if (!memoryId) {
      console.error("No memory ID in response:", memoryData);
      throw new Error("Failed to get memory ID from mem0");
    }

    // Cache reference in Convex for reactive updates
    await ctx.runMutation(api.memories.cacheMemoryRef, {
      userId: user._id,
      memoryId,
      content: args.content,
      category: args.metadata?.category,
      importance: args.metadata?.importance,
      confidence: args.metadata?.confidence,
      source: args.metadata?.source,
    });

    // Log to Supabase audit log (async)
    await ctx.scheduler.runAfter(0, api.memories.logToSupabase, {
      supabaseId: args.supabaseId,
      memoryId,
      action: "added",
      content: args.content,
      metadata: args.metadata,
    });

    return {
      success: true,
      memoryId,
      content: args.content,
    };
  },
});

// Cache memory reference in Convex DB
export const cacheMemoryRef = mutation({
  args: {
    userId: v.id("users"),
    memoryId: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
    importance: v.optional(v.number()),
    confidence: v.optional(v.number()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("memoryRefs", {
      userId: args.userId,
      memoryId: args.memoryId,
      content: args.content,
      category: args.category,
      importance: args.importance,
      confidence: args.confidence,
      source: args.source,
      supabaseSynced: false,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    });
  },
});

// Search memories using mem0
export const searchMemories = action({
  args: {
    supabaseId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    filters: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Search in mem0
    const response = await fetch("https://api.mem0.ai/v1/memories/search/", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.MEM0_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: args.query,
        filters: args.filters || { AND: [{ user_id: args.supabaseId }] },
        version: "v2",
        limit: args.limit || 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`mem0 search error: ${response.statusText}`);
    }

    const results = await response.json();

    // Update access time for cached memories
    const user = await ctx.runQuery(api.users.getBySupabaseId, {
      supabaseId: args.supabaseId,
    });

    if (user && results?.length > 0) {
      for (const result of results) {
        if (result.id || result.memory_id) {
          await ctx.runMutation(api.memories.updateAccessTime, {
            userId: user._id,
            memoryId: result.id || result.memory_id,
          });
        }
      }
    }

    return results;
  },
});

// Get all cached memories (reactive)
export const getCachedMemories = query({
  args: {
    supabaseId: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (!user) return [];

    let query = ctx.db
      .query("memoryRefs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id));

    if (args.category) {
      const memories = await query.collect();
      return memories
        .filter((m) => m.category === args.category)
        .slice(0, args.limit || 50);
    }

    return await query
      .order("desc")
      .take(args.limit || 50);
  },
});

// Get memories by importance
export const getImportantMemories = query({
  args: {
    supabaseId: v.string(),
    minImportance: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (!user) return [];

    const memories = await ctx.db
      .query("memoryRefs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return memories
      .filter((m) => m.importance && m.importance >= (args.minImportance || 7))
      .sort((a, b) => (b.importance || 0) - (a.importance || 0))
      .slice(0, args.limit || 10);
  },
});

// Update memory access time
export const updateAccessTime = mutation({
  args: {
    userId: v.id("users"),
    memoryId: v.string(),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db
      .query("memoryRefs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("memoryId"), args.memoryId))
      .first();

    if (memory) {
      await ctx.db.patch(memory._id, {
        lastAccessed: Date.now(),
      });
    }
  },
});

// Delete a memory
export const deleteMemory = action({
  args: {
    supabaseId: v.string(),
    memoryId: v.string(),
  },
  handler: async (ctx, args) => {
    // Delete from mem0
    const response = await fetch(`https://api.mem0.ai/v1/memories/${args.memoryId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Token ${process.env.MEM0_API_KEY}`,
      },
    });

    // Delete from Convex cache
    const user = await ctx.runQuery(api.users.getBySupabaseId, {
      supabaseId: args.supabaseId,
    });

    if (user) {
      await ctx.runMutation(api.memories.removeMemoryRef, {
        userId: user._id,
        memoryId: args.memoryId,
      });
    }

    // Log to Supabase audit log
    await ctx.scheduler.runAfter(0, api.memories.logToSupabase, {
      supabaseId: args.supabaseId,
      memoryId: args.memoryId,
      action: "deleted",
      content: "",
      metadata: {},
    });

    return { success: response.ok };
  },
});

// Remove memory reference from cache
export const removeMemoryRef = mutation({
  args: {
    userId: v.id("users"),
    memoryId: v.string(),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db
      .query("memoryRefs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("memoryId"), args.memoryId))
      .first();

    if (memory) {
      await ctx.db.delete(memory._id);
    }
  },
});

// Log memory actions to Supabase audit log
export const logToSupabase = action({
  args: {
    supabaseId: v.string(),
    memoryId: v.string(),
    action: v.string(),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    await supabase.from("memory_audit_log").insert({
      user_id: args.supabaseId,
      memory_id: args.memoryId,
      action: args.action,
      content: args.content,
      metadata: args.metadata,
    });
  },
});

// Sync all memories from mem0 to cache
export const syncMemoriesFromMem0 = action({
  args: {
    supabaseId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getBySupabaseId, {
      supabaseId: args.supabaseId,
    });

    if (!user) throw new Error("User not found");

    // Get all memories from mem0
    const response = await fetch(`https://api.mem0.ai/v1/memories/?version=v2&page=1&page_size=100`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${process.env.MEM0_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filters: { AND: [{ user_id: args.supabaseId }] },
      }),
    });

    if (!response.ok) {
      throw new Error(`mem0 fetch error: ${response.statusText}`);
    }

    const memories = await response.json();

    if (!Array.isArray(memories)) {
      console.error("Unexpected response from mem0:", memories);
      return { success: false, synced: 0 };
    }

    // Cache all memories
    let synced = 0;
    for (const memory of memories) {
      const memoryId = memory.id || memory.memory_id;
      const content = memory.memory || memory.content || memory.text;

      if (memoryId && content) {
        // Check if already cached
        const existing = await ctx.runQuery(api.memories.getMemoryRef, {
          userId: user._id,
          memoryId,
        });

        if (!existing) {
          await ctx.runMutation(api.memories.cacheMemoryRef, {
            userId: user._id,
            memoryId,
            content,
            category: memory.metadata?.category,
            importance: memory.metadata?.importance,
            confidence: memory.metadata?.confidence || memory.score,
            source: memory.metadata?.source,
          });
          synced++;
        }
      }
    }

    return { success: true, synced };
  },
});

// Get memory reference helper
export const getMemoryRef = query({
  args: {
    userId: v.id("users"),
    memoryId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memoryRefs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("memoryId"), args.memoryId))
      .first();
  },
});