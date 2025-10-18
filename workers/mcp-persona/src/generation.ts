import { ConnectedAccountsSchema, Persona, PersonaSchema } from "./schemas";
import { generatePersonaWithLLM } from "./llm";

export async function generatePersonaFromAccounts(
  raw: unknown,
  options?: { apiKey?: string; useLLM?: boolean }
): Promise<Persona> {
  const { apiKey, useLLM = true } = options || {};

  // Extract accounts and metadata (focusAreas, customInstructions)
  const { accounts } = ConnectedAccountsSchema.transform(a => ({ accounts: a })).safeParse(raw).success
    ? (raw as any)
    : { accounts: raw };

  // Extract focus areas, custom instructions, and userName from the raw payload
  const focusAreas = (raw as any)?.focusAreas;
  const customInstructions = (raw as any)?.customInstructions;
  const userName = (raw as any)?.userName;

  const accParse = ConnectedAccountsSchema.safeParse(accounts);
  if (!accParse.success) {
    throw new Error("Invalid connected accounts payload");
  }
  const acc = accParse.data;

  // Try LLM-powered generation first (if enabled and API key provided)
  if (useLLM && apiKey) {
    try {
      const llmPersona = await generatePersonaWithLLM(acc, { apiKey }, { focusAreas, customInstructions, userName });
      if (llmPersona) {
        console.log("✅ Generated persona using LLM with focus areas:", focusAreas);
        return llmPersona;
      }
    } catch (error) {
      console.warn("⚠️ LLM generation failed, falling back to rule-based:", error);
    }
  }

  // Fallback: Rule-based generation (original implementation)
  console.log("📋 Using rule-based persona generation");
  const ruleBasedPersona = generatePersonaRuleBased(acc);

  // Override name with user's preferred name if provided
  if (userName) {
    ruleBasedPersona.name = userName;
  }

  return ruleBasedPersona;
}

/**
 * Rule-based persona generation (fallback when LLM fails or is disabled)
 */
function generatePersonaRuleBased(acc: any): Persona {

  const base: Persona = {
    name: "User",
    languages: ["en"],
    preferredLanguage: "en",
    style: { formality: "casual", verbosity: "balanced", technical_level: "intermediate" },
    interests: [],
    profession: undefined,
    currentGoals: [],
  };

  // name precedence
  base.name = acc.linkedin?.name || acc.google?.name || acc.github?.name || acc.twitter?.name || base.name;

  // profession
  if (acc.linkedin?.headline) base.profession = acc.linkedin.headline;
  else if (acc.github?.bio) base.profession = extractProfessionFromBio(acc.github.bio);

  // languages from google locale
  if (acc.google?.locale) {
    const lang = acc.google.locale.split("-")[0];
    base.languages = [lang];
    base.preferredLanguage = lang;
  }

  // interests from YouTube subscriptions
  if (acc.google?.youtube?.subscriptions?.length) {
    const channelTitles = acc.google.youtube.subscriptions
      .map(sub => sub.snippet?.title)
      .filter(Boolean)
      .slice(0, 10);
    base.interests.push(...channelTitles);
  }

  // interests from YouTube playlists
  if (acc.google?.youtube?.playlists?.length) {
    const playlistTitles = acc.google.youtube.playlists
      .map(pl => pl.snippet?.title)
      .filter(Boolean)
      .slice(0, 5);
    base.interests.push(...playlistTitles);
  }

  // interests and technical level from github repos
  if (acc.github?.repos?.length) {
    const counts = acc.github.repos.reduce<Record<string, number>>((m, r) => {
      if (r.language) m[r.language] = (m[r.language] || 0) + 1;
      return m;
    }, {});
    const topLangs = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);
    base.interests.push(...topLangs);
    if (acc.github.repos.length > 20) base.style.technical_level = "advanced";
  }

  // starred topics
  if (acc.github?.starred?.length) {
    const topics = acc.github.starred.flatMap(s => s.topics || []);
    const topicCounts = topics.reduce<Record<string, number>>((m, t) => {
      if (t) m[t] = (m[t] || 0) + 1;
      return m;
    }, {});
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k]) => k);
    base.interests.push(...topTopics);
  }

  // twitter categories
  if (acc.twitter?.following?.length) {
    const cats = acc.twitter.following.map(f => f.category).filter(Boolean) as string[];
    base.interests.push(...Array.from(new Set(cats)).slice(0, 5));
  }

  base.interests = Array.from(new Set(base.interests));
  base.currentGoals = generateGoalsRuleBased(acc);

  return PersonaSchema.parse(base);
}

function extractProfessionFromBio(bio: string): string {
  const keywords = [
    "engineer", "developer", "designer", "manager",
    "researcher", "scientist", "analyst", "consultant",
    "founder", "ceo", "cto", "student"
  ];
  const low = bio.toLowerCase();
  for (const k of keywords) if (low.includes(k)) return k.charAt(0).toUpperCase() + k.slice(1);
  return "Professional";
}

function generateGoalsRuleBased(acc: any): string[] {
  const goals: string[] = [];
  if (acc.github?.repos?.length) {
    const repos = [...acc.github.repos].sort((a, b) => b.stars - a.stars).slice(0, 3);
    if (repos[0]) goals.push(`Maintain and improve ${repos[0].name}`);
    const langs = Array.from(new Set(acc.github.repos.map((r: any) => r.language).filter(Boolean)));
    if (langs.length > 3) goals.push("Master full-stack development");
  }
  if (acc.linkedin?.skills?.some((s: string) => s.toLowerCase().includes("lead"))) {
    goals.push("Grow as a technical leader");
  }
  if (goals.length === 0) goals.push("Build and ship products faster", "Learn new technologies", "Connect with like-minded professionals");
  return goals.slice(0, 5);
}
