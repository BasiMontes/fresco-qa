import type { ShoppingAisle } from '@schemas/shopping.types';

const AISLE_NAMES = new Set([
  'Frutas y verduras',
  'Carnes y aves',
  'Pescados y mariscos',
  'Charcutería y embutidos',
  'Lácteos y huevos',
  'Pan y bollería',
  'Pasta/arroz/legumbres',
  'Conservas y salsas',
  'Aceites/vinagres/condimentos',
  'Congelados',
  'Bebidas',
  'Higiene y limpieza',
  'Otros',
]);

const COMMON_INGREDIENTS: Record<string, string[]> = {
  'Frutas y verduras': ['ajo', 'brocoli', 'calabacin', 'cebolla', 'espinacas', 'lechuga', 'patata', 'pepino', 'pimiento rojo', 'tomate', 'zanahoria'],
  'Carnes y aves': ['carne picada', 'pechuga de pollo', 'pollo'],
  'Pescados y mariscos': ['merluza', 'salmon'],
  'Lácteos y huevos': ['huevo', 'leche', 'yogur'],
  'Pan y bollería': ['pan'],
  'Pasta/arroz/legumbres': ['arroz', 'pasta'],
  'Aceites/vinagres/condimentos': ['aceite de oliva'],
};

const AISLE_OF_COMMON_INGREDIENT = new Map(
  Object.entries(COMMON_INGREDIENTS).flatMap(([aisle, names]) => names.map(name => [name, aisle] as const)),
);

function plain(name: string): string {
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
}

export function commonIngredientsListed(aisles: ShoppingAisle[]): number {
  return aisles.flatMap(aisle => aisle.items).filter(item => AISLE_OF_COMMON_INGREDIENT.has(plain(item.nombre))).length;
}

export function aisleProblems(aisles: ShoppingAisle[]): string[] {
  const problems: string[] = [];
  const sections = new Set<string>();
  const aisleOfIngredient = new Map<string, string>();
  for (const { nombre, items } of aisles) {
    if (!AISLE_NAMES.has(nombre)) {
      problems.push(`unknown aisle: ${nombre}`);
    }
    if (sections.has(nombre)) {
      problems.push(`aisle listed twice: ${nombre}`);
    }
    sections.add(nombre);
    for (const item of items) {
      const ingredient = plain(item.nombre);
      const earlier = aisleOfIngredient.get(ingredient);
      if (earlier !== undefined && earlier !== nombre) {
        problems.push(`${item.nombre} in two aisles: ${earlier} and ${nombre}`);
      }
      aisleOfIngredient.set(ingredient, nombre);
      const expected = AISLE_OF_COMMON_INGREDIENT.get(ingredient);
      if (expected !== undefined && expected !== nombre) {
        problems.push(`${item.nombre} in ${nombre}, expected ${expected}`);
      }
    }
  }
  return problems;
}
