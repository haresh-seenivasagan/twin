import { Persona, LlmPreferences } from "./schemas";

export interface PersonaRecord extends Persona {
  id: string;
  version: number;
  lastModified: number;
  llmPreferences: LlmPreferences;
  customData?: any;
}

export interface PersonaAdapter {
  ensureUser(params: { supabaseId?: string; email?: string }): Promise<string>;
  getPersonaBySupabaseId(supabaseId: string): Promise<PersonaRecord | null>;
  getPersonaById(personaId: string): Promise<PersonaRecord | null>;
  upsertPersona(params: {
    supabaseId?: string;
    email?: string;
    persona: Persona;
    llmPreferences: LlmPreferences;
    customData?: any;
  }): Promise<{ id: string; version: number; lastModified: number }>;
  updatePersonaField(params: {
    supabaseId?: string;
    personaId?: string;
    fieldPath: string;
    value: any;
  }): Promise<{ success: true; version: number }>;
  getPersonaHistory(params: { supabaseId: string }): Promise<PersonaRecord[]>;
  rollbackPersona(params: { personaId: string; toVersion: number }): Promise<{ success: true; version: number }>;
  getRecentMemories?(params: { supabaseId: string; limit: number }): Promise<Array<{ content: string; category?: string; importance?: number }>>;
}

export class InMemoryAdapter implements PersonaAdapter {
  private users = new Map<string, { supabaseId?: string; email?: string; userId: string }>();
  private personas = new Map<string, PersonaRecord[]>(); // keyed by userId, history list

  async ensureUser(params: { supabaseId?: string; email?: string }): Promise<string> {
    const key = params.supabaseId || params.email || `anon_${Date.now()}`;
    const existing = this.users.get(key);
    if (existing) return existing.userId;
    const userId = `user_${Math.random().toString(36).slice(2)}`;
    this.users.set(key, { supabaseId: params.supabaseId, email: params.email, userId });
    return userId;
  }

  async getPersonaBySupabaseId(supabaseId: string): Promise<PersonaRecord | null> {
    const user = this.users.get(supabaseId);
    if (!user) return null;
    const hist = this.personas.get(user.userId) || [];
    return hist[hist.length - 1] || null;
  }

  async getPersonaById(personaId: string): Promise<PersonaRecord | null> {
    for (const [_userId, hist] of this.personas.entries()) {
      const found = hist.find(p => p.id === personaId);
      if (found) return found;
    }
    return null;
  }

  async upsertPersona(params: { supabaseId?: string; email?: string; persona: Persona; llmPreferences: LlmPreferences; customData?: any; }): Promise<{ id: string; version: number; lastModified: number }> {
    const userId = await this.ensureUser({ supabaseId: params.supabaseId, email: params.email });
    const hist = this.personas.get(userId) || [];
    const prev = hist[hist.length - 1];
    const version = (prev?.version || 0) + 1;
    const record: PersonaRecord = {
      id: prev?.id || `persona_${userId}`,
      version,
      lastModified: Date.now(),
      llmPreferences: params.llmPreferences,
      customData: params.customData,
      ...params.persona,
    };
    hist.push(record);
    this.personas.set(userId, hist);
    return { id: record.id, version: record.version, lastModified: record.lastModified };
  }

  async updatePersonaField(params: { supabaseId?: string; personaId?: string; fieldPath: string; value: any; }): Promise<{ success: true; version: number }> {
    const target = params.supabaseId ? await this.getPersonaBySupabaseId(params.supabaseId) : params.personaId ? await this.getPersonaById(params.personaId) : null;
    if (!target) throw new Error("Persona not found");
    // find userId holding the target
    let userIdFound: string | undefined;
    for (const [userId, hist] of this.personas.entries()) {
      if (hist.some(p => p.id === target.id)) { userIdFound = userId; break; }
    }
    if (!userIdFound) throw new Error("Persona owner not found");
    const hist = this.personas.get(userIdFound)!;
    const prev = hist[hist.length - 1]!;

    const clone: any = JSON.parse(JSON.stringify(prev));
    // apply path update
    const parts = params.fieldPath.split(".");
    let ref = clone as any;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      ref[key] = typeof ref[key] === "object" && ref[key] !== null ? ref[key] : {};
      ref = ref[key];
    }
    ref[parts[parts.length - 1]] = params.value;

    const version = prev.version + 1;
    const updated: PersonaRecord = { ...clone, version, lastModified: Date.now() };
    hist.push(updated);
    this.personas.set(userIdFound, hist);
    return { success: true, version };
  }

  async getPersonaHistory(params: { supabaseId: string }): Promise<PersonaRecord[]> {
    const user = this.users.get(params.supabaseId);
    if (!user) return [];
    return (this.personas.get(user.userId) || []).slice().reverse();
  }

  async rollbackPersona(params: { personaId: string; toVersion: number }): Promise<{ success: true; version: number }> {
    for (const [userId, hist] of this.personas.entries()) {
      const idx = hist.findIndex(p => p.id === params.personaId && p.version === params.toVersion);
      if (idx >= 0) {
        const snapshot = hist[idx];
        const newVersion = hist[hist.length - 1].version + 1;
        const rolled: PersonaRecord = { ...snapshot, version: newVersion, lastModified: Date.now() };
        hist.push(rolled);
        this.personas.set(userId, hist);
        return { success: true, version: newVersion };
      }
    }
    throw new Error("Target version not found");
  }

  async getRecentMemories(): Promise<Array<{ content: string; category?: string; importance?: number }>> {
    return [];
  }
}
