import { baseQuantities, expectedScreen, rowsOutOfProportion, rowsThatWouldExposeAnUnscaledList } from '@utils/shoppingScale';
import { describe, expect, test } from 'bun:test';

function aisle(nombre: string, ...items: [string, number, string][]) {
  return { nombre, items: items.map(([item, cantidad, unidad]) => ({ nombre: item, cantidad, unidad })) };
}

describe('baseQuantities', () => {
  test('reads kg and l in g and ml', () => {
    const quantities = baseQuantities([aisle('Despensa', ['arroz', 1.235, 'kg'], ['caldo', 2, 'l'], ['huevo', 3, 'unidades'])]);
    expect([...quantities]).toEqual([
      ['Despensa | arroz | g', 1235],
      ['Despensa | caldo | ml', 2000],
      ['Despensa | huevo | unidades', 3],
    ]);
  });

  test('rejects two rows with the same aisle, ingredient and unit', () => {
    expect(() => baseQuantities([aisle('Despensa', ['arroz', 1, 'kg'], ['arroz', 5, 'g'])])).toThrow('Despensa | arroz | g');
  });
});

describe('rowsOutOfProportion', () => {
  function lists(...readings: [number, number][]) {
    return new Map(readings.map(([people, quantity]) => [people, new Map([['row', quantity]])]));
  }

  test.each([[97, 243], [100, 250]])('accepts %d for 4 and %d for 10 against 25 for 1', (four, ten) => {
    expect(rowsOutOfProportion(lists([1, 25], [4, four], [10, ten]))).toEqual([]);
  });

  test.each([[96], [101], [25]])('rejects %d for 4 people against 25 for 1', (many) => {
    expect(rowsOutOfProportion(lists([1, 25], [4, many]))).toEqual([`row: 25 for 1, ${many} for 4`]);
  });

  test('rejects sizes that each fit one person but share no per-person amount', () => {
    expect(rowsOutOfProportion(lists([1, 2], [4, 8], [10, 11]))).toEqual(['row: 2 for 1, 8 for 4, 11 for 10']);
  });

  test('reports a row missing from one list', () => {
    expect(rowsOutOfProportion(new Map([[1, new Map([['row', 25]])], [4, new Map()]]))).toEqual(['row: 25 for 1, missing for 4']);
  });
});

describe('rowsThatWouldExposeAnUnscaledList', () => {
  test('counts only rows of 2 or more', () => {
    expect(rowsThatWouldExposeAnUnscaledList(new Map([['a', 1], ['b', 2], ['c', 40]]))).toBe(2);
  });
});

describe('expectedScreen', () => {
  test('formats names and quantities as the list screen does', () => {
    expect(expectedScreen([aisle('Frescos', ['arroz', 1.235, 'kg'], ['huevo', 1, 'unidades'], ['ajo', 2, 'dientes'])])).toEqual([{
      aisle: 'Frescos',
      rows: [
        { name: 'Arroz', quantity: '1,24 kg' },
        { name: 'Huevo', quantity: '1 unidad' },
        { name: 'Ajo', quantity: '2 dientes' },
      ],
    }]);
  });
});
