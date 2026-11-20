import type { RoleState } from '@data/types';

import { chmodSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { test as setup } from '@TestFixture';
import { roleStatePath } from '@utils/roleState';
import { config, env } from '@variables';

class EnvironmentGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentGuardError';
  }
}

class MissingAnonKeyError extends Error {
  constructor(variable: string) {
    super(`${variable} is empty: set it in .env for the active environment`);
    this.name = 'MissingAnonKeyError';
  }
}

setup('API Setup: authenticate each role via API', async ({ api }) => {
  if (env.current !== 'local') {
    throw new EnvironmentGuardError('menu-safety API tests mutate data and only run against the local stack (TEST_ENV=local)');
  }

  const anonKeyVariable = `${env.current.toUpperCase()}_SUPABASE_ANON_KEY`;
  if (config.auth.supabaseAnonKey === '') {
    throw new MissingAnonKeyError(anonKeyVariable);
  }

  mkdirSync(config.auth.roleStateDir, { recursive: true });
  for (const file of readdirSync(config.auth.roleStateDir)) {
    if (file.endsWith('.json')) {
      rmSync(`${config.auth.roleStateDir}/${file}`, { force: true });
    }
  }

  for (const role of config.auth.roles) {
    const credentials = config.auth.roleCredentials(role);
    const session = await api.auth.signInWithPassword(credentials);

    const state: RoleState = {
      token: session.accessToken,
      tokenType: session.tokenType,
      expiresIn: session.expiresIn,
      refreshToken: session.refreshToken,
      source: 'api-login',
      createdAt: new Date().toISOString(),
      role,
      userId: session.userId,
    };

    writeFileSync(roleStatePath(role), JSON.stringify(state, null, 2), { mode: 0o600 });
    chmodSync(roleStatePath(role), 0o600);
  }
});
