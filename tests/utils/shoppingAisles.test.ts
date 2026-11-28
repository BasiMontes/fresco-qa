import { aisleProblems, commonIngredientsListed } from '@utils/shoppingAisles';
import { describe, expect, test } from 'bun:test';

function aisle(nombre: string, ...names: string[]) {
  return { nombre, items: names.map(item => ({ nombre: item, cantidad: 1, unidad: 'g' })) };
}

describe('aisleProblems', () => {
  test('accepts common ingredients in their aisle, whatever their accents or case', () => {
    expect(aisleProblems([aisle('Frutas y verduras', 'Brócoli', 'tomate'), aisle('Pescados y mariscos', 'salmón')])).toEqual([]);
  });

  test('reports a common ingredient in the wrong aisle', () => {
    expect(aisleProblems([aisle('Bebidas', 'tomate')])).toEqual(['tomate in Bebidas, expected Frutas y verduras']);
  });

  test('reports an unknown aisle and a repeated one', () => {
    expect(aisleProblems([aisle('Varios', 'sal'), aisle('Otros', 'miel'), aisle('Otros', 'tahini')])).toEqual([
      'unknown aisle: Varios',
      'aisle listed twice: Otros',
    ]);
  });

  test('reports an ingredient listed in two aisles', () => {
    expect(aisleProblems([aisle('Otros', 'miel'), aisle('Bebidas', 'Miel')])).toEqual(['Miel in two aisles: Otros and Bebidas']);
  });
});

describe('commonIngredientsListed', () => {
  test('counts only the ingredients whose aisle is known to the test', () => {
    expect(commonIngredientsListed([aisle('Otros', 'miel', 'Calabacín', 'arroz')])).toBe(2);
  });
});
