import type { ShoppingAisle } from '@schemas/shopping.types';

export interface ScreenRow {
  name: string
  quantity: string
}

export interface ScreenAisle {
  aisle: string
  rows: ScreenRow[]
}

const BASE_UNITS: Record<string, { unit: string, factor: number }> = {
  kg: { unit: 'g', factor: 1000 },
  l: { unit: 'ml', factor: 1000 },
};

const SCREEN_NUMBER = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

export function baseQuantities(aisles: ShoppingAisle[]): Map<string, number> {
  const quantities = new Map<string, number>();
  for (const aisle of aisles) {
    for (const item of aisle.items) {
      const { unit, factor } = BASE_UNITS[item.unidad] ?? { unit: item.unidad, factor: 1 };
      const key = `${aisle.nombre} | ${item.nombre} | ${unit}`;
      if (quantities.has(key)) {
        throw new Error(`Two rows share the same aisle, ingredient and unit: ${key}`);
      }
      quantities.set(key, Math.round(item.cantidad * factor * 1000) / 1000);
    }
  }
  return quantities;
}

// The product rounds each total up once, so qN for N people needs a per-person amount in ((qN - 1) / N, qN / N].
export function rowsOutOfProportion(listsByPeople: Map<number, Map<string, number>>): string[] {
  const keys = new Set([...listsByPeople.values()].flatMap(quantities => [...quantities.keys()]));
  return [...keys].flatMap((key) => {
    const readings = [...listsByPeople].map(([people, quantities]) => ({ people, quantity: quantities.get(key) }));
    const above = Math.max(...readings.map(({ people, quantity }) => ((quantity ?? Number.NaN) - 1) / people));
    const upTo = Math.min(...readings.map(({ people, quantity }) => (quantity ?? Number.NaN) / people));
    const found = readings.map(({ people, quantity }) => `${quantity ?? 'missing'} for ${people}`).join(', ');
    return above < upTo ? [] : [`${key}: ${found}`];
  });
}

// A row of 1 for one person also fits an unscaled list, so only rows of 2 or more can expose one.
export function rowsThatWouldExposeAnUnscaledList(single: Map<string, number>): number {
  return [...single.values()].filter(quantity => quantity >= 2).length;
}

export function expectedScreen(aisles: ShoppingAisle[]): ScreenAisle[] {
  return aisles.map(aisle => ({
    aisle: aisle.nombre,
    rows: aisle.items.map(item => ({
      name: item.nombre.charAt(0).toUpperCase() + item.nombre.slice(1),
      quantity: `${SCREEN_NUMBER.format(item.cantidad)} ${item.cantidad === 1 && item.unidad === 'unidades' ? 'unidad' : item.unidad}`,
    })),
  }));
}
