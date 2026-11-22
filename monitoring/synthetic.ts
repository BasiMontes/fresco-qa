process.env.TEST_ENV = 'staging';

const TIMEOUT_MS = 10_000;
const LATENCY_BUDGET_MS = 5_000;
const ANON_KEY_VAR = 'STAGING_SUPABASE_ANON_KEY';

interface Result { name: string, path: string, status: number | string, ms: number, ok: boolean, reason: string }

interface Probe { status: number, body: string, ms: number }

async function get(url: string, headers: Record<string, string> = {}): Promise<Probe> {
  const start = performance.now();
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const body = await res.text();
  return { status: res.status, body, ms: Math.round(performance.now() - start) };
}

async function check(
  name: string,
  url: string,
  headers: Record<string, string>,
  assert: (p: Probe) => string | null,
): Promise<Result> {
  const path = new URL(url).pathname;
  const start = performance.now();
  try {
    const p = await get(url, headers);
    const failure = p.status !== 200
      ? `expected 200, got ${p.status}`
      : assert(p)
        ?? (p.ms > LATENCY_BUDGET_MS ? `latency ${p.ms}ms over ${LATENCY_BUDGET_MS}ms budget` : null);
    return { name, path, status: p.status, ms: p.ms, ok: failure === null, reason: failure ?? 'ok' };
  }
  catch (error) {
    const reason = error instanceof Error ? error.name : 'request failed';
    return { name, path, status: 'ERR', ms: Math.round(performance.now() - start), ok: false, reason };
  }
}

async function main(): Promise<number> {
  const { config } = await import('@variables');
  const web = config.baseUrl.replace(/\/$/, '');
  const api = config.apiUrl.replace(/\/$/, '');
  const anonKey = config.auth.supabaseAnonKey;

  if (anonKey === '') {
    console.error(`Missing ${ANON_KEY_VAR}: set it to run the API checks.`);
    return 1;
  }

  const apiHeaders = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

  const results = await Promise.all([
    check('Web home responds', `${web}/`, {}, () => null),
    check('Login page renders form', `${web}/login`, {}, p =>
      p.body.includes('data-testid="email_input"') && p.body.includes('data-testid="password_input"')
        ? null
        : 'email/password inputs missing'),
    check('Supabase Auth health', `${api}/auth/v1/health`, apiHeaders, () => null),
    check('Recipe catalogue readable', `${api}/rest/v1/recipes?select=id,nombre,activo,alergenos,dieta&limit=5`, apiHeaders, (p) => {
      try {
        const rows: unknown = JSON.parse(p.body);
        if (!Array.isArray(rows) || rows.length === 0) { return 'empty or non-list payload'; }
        const first = rows[0] as Record<string, unknown>;
        const missing = ['id', 'nombre', 'alergenos', 'dieta'].filter(k => !(k in first));
        return missing.length > 0 ? `missing fields: ${missing.join(',')}` : null;
      }
      catch {
        return 'invalid JSON';
      }
    }),
  ]);

  console.table(results.map(r => ({ check: r.name, path: r.path, status: r.status, ms: r.ms, result: r.ok ? 'PASS' : 'FAIL', reason: r.reason })));

  const failed = results.filter(r => !r.ok).length;
  console.log(failed === 0 ? 'All checks passed' : `${failed} of ${results.length} checks failed`);
  return failed === 0 ? 0 : 1;
}

main().then(code => process.exit(code), (error: unknown) => {
  console.error(error instanceof Error ? error.message : 'monitoring failed');
  process.exit(1);
});
