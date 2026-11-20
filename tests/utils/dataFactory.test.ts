import { DataFactory } from '@data/DataFactory';

import { tamperToken } from '@utils/token';
import { describe, expect, test } from 'bun:test';

describe('DataFactory.futureIsoWeek', () => {
  const cases: Array<[string, number, string, string]> = [
    ['2026-11-19', 0, '2026-W47', '2026-11-16'],
    ['2026-11-19', 1, '2026-W48', '2026-11-23'],
    ['2026-12-28', 0, '2026-W53', '2026-12-28'],
    ['2026-12-28', 1, '2027-W01', '2027-01-04'],
    ['2024-12-30', 0, '2025-W01', '2024-12-30'],
    ['2021-01-03', 0, '2020-W53', '2020-12-28'],
    ['2026-11-22', 0, '2026-W47', '2026-11-16'],
  ];
  for (const [from, offset, week, monday] of cases) {
    test(`${from} +${offset} -> ${week}`, () => {
      const result = DataFactory.futureIsoWeek(offset, new Date(`${from}T12:00:00Z`));
      expect(result).toEqual({ semana_iso: week, fecha_inicio: monday });
    });
  }
});

describe('tamperToken', () => {
  test('changes only the signature', () => {
    const tampered = tamperToken('aaa.bbb.ccc');
    expect(tampered).toBe('aaa.bbb.Acc');
    expect(tamperToken('aaa.bbb.Acc')).toBe('aaa.bbb.Bcc');
  });
  test('returns null on malformed input', () => {
    expect(tamperToken('')).toBeNull();
    expect(tamperToken('a.b')).toBeNull();
    expect(tamperToken('a..c')).toBeNull();
  });
});
