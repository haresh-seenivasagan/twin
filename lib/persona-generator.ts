// Persona auto-generation from connected accounts

interface ConnectedAccounts {
  google?: GoogleProfile;
  github?: GitHubProfile;
  linkedin?: LinkedInProfile;
  twitter?: TwitterProfile;
}

interface GoogleProfile {
  email: string;
  name: string;
  locale: string;
  picture?: string;
}

interface GitHubProfile {
  login: string;
  name: string;
  bio?: string;
  company?: string;
  location?: string;
  repos: Array<{
    name: string;
    language: string;
    stars: number;
  }>;
  starred: Array<{
    name: string;
    topics: string[];
  }>;
}

interface LinkedInProfile {
  name: string;
  headline: string;
  industry?: string;
  skills?: string[];
}

interface TwitterProfile {
  username: string;
  name: string;
  bio?: string;
  following: Array<{
    username: string;
    category?: string;
  }>;
}

export async function generatePersonaFromAccounts(accounts: ConnectedAccounts) {
  const persona = {
    name: "",
    languages: [] as string[],
    preferredLanguage: "en",
    style: {
      formality: "casual" as "formal" | "casual" | "mixed",
      verbosity: "balanced" as "concise" | "detailed" | "balanced",
      technical_level: "intermediate" as "basic" | "intermediate" | "advanced",
    },
    interests: [] as string[],
    profession: "",
    currentGoals: [] as string[],
    customData: {} as any,
  };

  // Extract name (priority: LinkedIn > Google > GitHub > Twitter)
  persona.name =
    accounts.linkedin?.name ||
    accounts.google?.name ||
    accounts.github?.name ||
    accounts.twitter?.name ||
    "User";

  // Extract profession
  if (accounts.linkedin?.headline) {
    persona.profession = accounts.linkedin.headline;
  } else if (accounts.github?.bio) {
    persona.profession = extractProfessionFromBio(accounts.github.bio);
  }

  // Detect languages from GitHub repos
  if (accounts.github?.repos) {
    const langCounts = accounts.github.repos.reduce((acc, repo) => {
      if (repo.language) {
        acc[repo.language] = (acc[repo.language] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Add programming languages to interests
    const topLanguages = Object.entries(langCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lang]) => lang);

    persona.interests.push(...topLanguages);

    // Adjust technical level based on GitHub activity
    if (accounts.github.repos.length > 20) {
      persona.style.technical_level = "advanced";
    }
  }

  // Extract interests from GitHub stars
  if (accounts.github?.starred) {
    const topics = accounts.github.starred
      .flatMap(repo => repo.topics || [])
      .filter(Boolean);

    const topicCounts = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic]) => topic);

    persona.interests.push(...topTopics);
  }

  // Extract interests from Twitter follows
  if (accounts.twitter?.following) {
    const categories = accounts.twitter.following
      .map(f => f.category)
      .filter(Boolean) as string[];

    const uniqueCategories = [...new Set(categories)].slice(0, 5);
    persona.interests.push(...uniqueCategories);
  }

  // Set spoken languages based on locale
  if (accounts.google?.locale) {
    const lang = accounts.google.locale.split('-')[0];
    persona.languages = [lang];
    persona.preferredLanguage = lang;
  }

  // Generate initial goals based on activity
  persona.currentGoals = generateGoals(accounts);

  // Store additional data
  persona.customData = {
    connectedAccounts: Object.keys(accounts),
    githubUsername: accounts.github?.login,
    twitterUsername: accounts.twitter?.username,
    location: accounts.github?.location,
  };

  // Remove duplicates from interests
  persona.interests = [...new Set(persona.interests)];

  return persona;
}

function extractProfessionFromBio(bio: string): string {
  // Simple extraction - could be enhanced with NLP
  const professionKeywords = [
    "engineer", "developer", "designer", "manager",
    "researcher", "scientist", "analyst", "consultant",
    "founder", "ceo", "cto", "student"
  ];

  const bioLower = bio.toLowerCase();
  for (const keyword of professionKeywords) {
    if (bioLower.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }

  return "Professional";
}

function generateGoals(accounts: ConnectedAccounts): string[] {
  const goals: string[] = [];

  // Based on GitHub activity
  if (accounts.github?.repos) {
    const recentRepos = accounts.github.repos
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 3);

    if (recentRepos.length > 0) {
      goals.push(`Maintain and improve ${recentRepos[0].name}`);
    }

    const languages = [...new Set(accounts.github.repos.map(r => r.language).filter(Boolean))];
    if (languages.length > 3) {
      goals.push("Master full-stack development");
    }
  }

  // Based on LinkedIn
  if (accounts.linkedin?.skills) {
    if (accounts.linkedin.skills.some(s => s.toLowerCase().includes("lead"))) {
      goals.push("Grow as a technical leader");
    }
  }

  // Default goals if none found
  if (goals.length === 0) {
    goals.push(
      "Build and ship products faster",
      "Learn new technologies",
      "Connect with like-minded professionals"
    );
  }

  return goals.slice(0, 5); // Max 5 goals
}

// Mock function for testing
export function getMockConnectedAccounts(): ConnectedAccounts {
  return {
    google: {
      email: "alex@example.com",
      name: "Alex Chen",
      locale: "en-US",
    },
    github: {
      login: "alexchen",
      name: "Alex Chen",
      bio: "Full-stack engineer building AI products",
      company: "@tech-startup",
      location: "San Francisco, CA",
      repos: [
        { name: "ai-assistant", language: "TypeScript", stars: 150 },
        { name: "data-pipeline", language: "Python", stars: 89 },
        { name: "mobile-app", language: "React Native", stars: 45 },
      ],
      starred: [
        { name: "langchain", topics: ["ai", "llm", "python"] },
        { name: "next.js", topics: ["react", "framework", "typescript"] },
      ],
    },
    linkedin: {
      name: "Alex Chen",
      headline: "Senior Software Engineer at Tech Startup",
      skills: ["TypeScript", "Python", "React", "Node.js", "AWS"],
    },
  };
}