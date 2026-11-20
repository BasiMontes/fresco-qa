import type { RoleState } from '@data/types';
import type { AuthRole } from '@variables';

import { readFileSync } from 'node:fs';

import { config } from '@variables';

export function roleStatePath(role: AuthRole): string {
  return `${config.auth.roleStateDir}/${role}.json`;
}

export function loadRoleState(role: AuthRole): RoleState | null {
  try {
    const state = JSON.parse(readFileSync(roleStatePath(role), 'utf-8')) as RoleState;
    return typeof state.token === 'string' && state.token !== '' ? state : null;
  }
  catch {
    return null;
  }
}
