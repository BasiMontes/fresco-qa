import { randomBytes } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface Persona {
  role: 'alergia' | 'vegano' | 'familia'
  profile: Record<string, unknown>
}

const BASE_PROFILE = {
  dieta_vegetariano: false,
  dieta_vegano: false,
  dieta_sin_gluten: false,
  dieta_sin_lactosa: false,
  dieta_sin_huevo: false,
  dieta_keto: false,
  dieta_halal: false,
  alergenos: [] as string[],
  ingredientes_odiados: [] as string[],
  cocinas_favoritas: [] as string[],
  recorrido_visto: true,
  aviso_bienvenida_visto: true,
  aviso_rutas_descartado: true,
};

const PERSONAS: Persona[] = [
  {
    role: 'alergia',
    profile: { ...BASE_PROFILE, alergenos: ['huevo'], num_personas: 2, adultos: 2, ninos: 0 },
  },
  {
    role: 'vegano',
    profile: {
      ...BASE_PROFILE,
      dieta_vegetariano: true,
      dieta_vegano: true,
      dieta_sin_lactosa: true,
      alergenos: ['huevo', 'pescado', 'sulfitos'],
      num_personas: 1,
      adultos: 1,
      ninos: 0,
      objetivo: 'ahorrar_dinero',
      presupuesto_semana_euros: 35,
    },
  },
  {
    role: 'familia',
    profile: { ...BASE_PROFILE, num_personas: 4, adultos: 2, ninos: 2, objetivo: 'reducir_desperdicio' },
  },
];

const CONSENT_KINDS = ['age_14', 'terms', 'privacy', 'health_data'];

class SeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeedError';
  }
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new SeedError(`${name} is not set`);
  }
  return value;
}

function legalTextsVersion(productDir: string): string {
  const source = readFileSync(join(productDir, 'lib/legal/consent.ts'), 'utf8');
  const match = /LEGAL_TEXTS_VERSION\s*=\s*'([^']+)'/.exec(source);
  if (!match) {
    throw new SeedError('LEGAL_TEXTS_VERSION not found in the product source');
  }
  return match[1];
}

async function call<T>(label: string, url: string, headers: Record<string, string>, body: unknown): Promise<T | null> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  if (!response.ok) {
    throw new SeedError(`${label} failed with status ${response.status}: ${await response.text()}`);
  }
  const text = await response.text();
  return text === '' ? null : JSON.parse(text) as T;
}

interface SignupResponse {
  access_token: string
  user: { id: string }
}

async function seed(persona: Persona, ctx: { apiUrl: string, anonKey: string, serviceKey: string, version: string, runId: string }): Promise<{ email: string, password: string }> {
  const email = `qa-${persona.role}-${ctx.runId}@example.test`;
  const password = randomBytes(18).toString('base64url');
  console.log(`::add-mask::${password}`);

  const session = await call<SignupResponse>(`signup ${persona.role}`, `${ctx.apiUrl}/auth/v1/signup`, { apikey: ctx.anonKey }, { email, password });
  if (!session?.access_token) {
    throw new SeedError(`signup ${persona.role} returned no session: email confirmation must be off on the local stack`);
  }

  await call(`consents ${persona.role}`, `${ctx.apiUrl}/rest/v1/rpc/record_consents`, { apikey: ctx.serviceKey, Authorization: `Bearer ${ctx.serviceKey}` }, {
    p_user_id: session.user.id,
    p_kinds: CONSENT_KINDS,
    p_version: ctx.version,
  });

  await call(`profile ${persona.role}`, `${ctx.apiUrl}/rest/v1/user_profiles`, {
    apikey: ctx.anonKey,
    Authorization: `Bearer ${session.access_token}`,
    Prefer: 'resolution=merge-duplicates,return=minimal',
  }, { id: session.user.id, ...persona.profile });

  return { email, password };
}

async function main(): Promise<void> {
  const apiUrl = required('SUPABASE_API_URL').replace(/\/$/, '');
  if (!/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(apiUrl)) {
    throw new SeedError('refusing to seed: SUPABASE_API_URL is not a local address');
  }
  const ctx = {
    apiUrl,
    anonKey: required('SUPABASE_ANON_KEY'),
    serviceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    version: legalTextsVersion(required('PRODUCT_DIR')),
    runId: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_RUN_ID}-${randomBytes(3).toString('hex')}` : randomBytes(6).toString('hex'),
  };
  const githubEnv = process.env.GITHUB_ENV;

  for (const persona of PERSONAS) {
    const { email, password } = await seed(persona, ctx);
    const prefix = `LOCAL_${persona.role.toUpperCase()}`;
    if (githubEnv) {
      appendFileSync(githubEnv, `${prefix}_EMAIL=${email}\n${prefix}_PASSWORD=${password}\n`);
    }
    console.log(`seeded ${persona.role}: ${prefix}_EMAIL and ${prefix}_PASSWORD exported`);
  }
  if (githubEnv) {
    appendFileSync(githubEnv, `LOCAL_SUPABASE_ANON_KEY=${ctx.anonKey}\n`);
  }
}

await main();
