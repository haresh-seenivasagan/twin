import { z } from "zod";

export const StyleSchema = z.object({
  formality: z.enum(["formal", "casual", "adaptive"]).default("casual"),
  verbosity: z.enum(["concise", "detailed", "balanced"]).default("balanced"),
  technical_level: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
});

export const PersonaSchema = z.object({
  name: z.string().min(1),
  languages: z.array(z.string()).default(["en"]),
  preferredLanguage: z.string().default("en"),
  style: StyleSchema.default({ formality: "casual", verbosity: "balanced", technical_level: "intermediate" }),
  interests: z.array(z.string()).default([]),
  profession: z.string().optional(),
  currentGoals: z.array(z.string()).default([]),
});

export const LlmPreferencesSchema = z.object({
  default: z.string().default("claude"),
  coding: z.string().default("claude"),
  creative: z.string().default("gemini"),
  analysis: z.string().default("openai"),
  chat: z.string().default("claude"),
});

export const YouTubeSubscriptionSchema = z.object({
  snippet: z.object({
    title: z.string(),
    description: z.string().optional(),
  }).passthrough(),
}).passthrough();

export const YouTubePlaylistSchema = z.object({
  snippet: z.object({
    title: z.string(),
    description: z.string().optional(),
  }).passthrough(),
}).passthrough();

export const YouTubeDataSchema = z.object({
  subscriptions: z.array(YouTubeSubscriptionSchema).default([]),
  playlists: z.array(YouTubePlaylistSchema).default([]),
  liked_videos: z.array(z.any()).default([]),
}).optional();

export const GoogleProfileSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  locale: z.string().optional(),
  picture: z.string().url().optional(),
  youtube: YouTubeDataSchema,
}).passthrough();

export const GitHubRepoSchema = z.object({
  name: z.string(),
  language: z.string().nullable().optional().transform(v => v || ""),
  stars: z.number().int().nonnegative(),
});

export const GitHubStarredSchema = z.object({
  name: z.string(),
  topics: z.array(z.string()).default([]),
});

export const GitHubProfileSchema = z.object({
  login: z.string(),
  name: z.string(),
  bio: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  repos: z.array(GitHubRepoSchema).default([]),
  starred: z.array(GitHubStarredSchema).default([]),
});

export const LinkedInProfileSchema = z.object({
  name: z.string(),
  headline: z.string(),
  industry: z.string().optional(),
  skills: z.array(z.string()).default([]),
});

export const TwitterFollowingSchema = z.object({
  username: z.string(),
  category: z.string().optional(),
});

export const TwitterProfileSchema = z.object({
  username: z.string(),
  name: z.string(),
  bio: z.string().optional(),
  following: z.array(TwitterFollowingSchema).default([]),
});

export const ConnectedAccountsSchema = z.object({
  google: GoogleProfileSchema.optional(),
  github: GitHubProfileSchema.optional(),
  linkedin: LinkedInProfileSchema.optional(),
  twitter: TwitterProfileSchema.optional(),
});

export type Persona = z.infer<typeof PersonaSchema>;
export type LlmPreferences = z.infer<typeof LlmPreferencesSchema>;
export type ConnectedAccounts = z.infer<typeof ConnectedAccountsSchema>;

export const ExportFormatSchema = z.enum(["json", "yaml", "llm_prompt"]).default("json");

export const GenerateFromAccountsInputSchema = z.object({
  accounts: ConnectedAccountsSchema,
});

export const ExportPersonaInputSchema = z.object({
  supabaseId: z.string().optional(),
  personaId: z.string().optional(),
  format: ExportFormatSchema.optional(),
}).refine(v => !!v.supabaseId || !!v.personaId, {
  message: "Provide supabaseId or personaId",
});

export const PersonaRecordSchema = PersonaSchema.extend({
  id: z.string(),
  version: z.number().int().positive().default(1),
  lastModified: z.number().int().nonnegative().default(() => Date.now()),
  llmPreferences: LlmPreferencesSchema.default({
    default: "claude",
    coding: "claude",
    creative: "gemini",
    analysis: "openai",
    chat: "claude",
  }),
  customData: z.any().optional(),
});
