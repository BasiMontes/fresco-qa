export function tamperToken(token: string): string | null {
  if (typeof token !== 'string') {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 3 || parts.includes('')) {
    return null;
  }
  const signature = parts[2];
  const first = signature[0] === 'A' ? 'B' : 'A';
  return `${parts[0]}.${parts[1]}.${first}${signature.slice(1)}`;
}

export function tokenSubject(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf-8')) as { sub?: unknown };
    return typeof payload.sub === 'string' && payload.sub !== '' ? payload.sub : null;
  }
  catch {
    return null;
  }
}
