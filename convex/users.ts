import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get user by Supabase ID
export const getBySupabaseId = query({
  args: {
    supabaseId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();
  },
});

// Get user by email
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Create or update user
export const upsertUser = mutation({
  args: {
    supabaseId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        lastSync: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      supabaseId: args.supabaseId,
      email: args.email,
      lastSync: Date.now(),
    });
  },
});

// Store Supabase session token
export const storeSession = mutation({
  args: {
    supabaseId: v.string(),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (!user) throw new Error("User not found");

    // Check for existing session
    const existingSession = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existingSession) {
      await ctx.db.patch(existingSession._id, {
        supabaseToken: args.token,
        expiresAt: args.expiresAt,
      });
      return existingSession._id;
    }

    return await ctx.db.insert("sessions", {
      userId: user._id,
      supabaseToken: args.token,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

// Validate session
export const validateSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("supabaseToken", args.token))
      .first();

    if (!session) return { valid: false };

    // Check if expired
    if (session.expiresAt < Date.now()) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: session.userId,
    };
  },
});

// Get user stats
export const getUserStats = query({
  args: {
    supabaseId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.supabaseId))
      .first();

    if (!user) return null;

    const memories = await ctx.db
      .query("memoryRefs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const contextHistory = await ctx.db
      .query("contextHistory")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const persona = await ctx.db
      .query("personas")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    return {
      userId: user._id,
      email: user.email,
      lastSync: user.lastSync,
      totalMemories: memories.length,
      memoriesByCategory: memories.reduce((acc, m) => {
        const cat = m.category || "uncategorized";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalContextGenerations: contextHistory.length,
      lastContextGeneration: contextHistory[0]?.createdAt,
      personaCreated: !!persona,
      personaLastUpdated: persona?.lastModified,
    };
  },
});