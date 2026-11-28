import type { ShoppingList } from './shopping.types';

import { z } from 'zod';

const shoppingItemSchema = z.looseObject({
  nombre: z.string().min(1),
  cantidad: z.number().positive(),
  unidad: z.string().min(1),
});

const shoppingAisleSchema = z.looseObject({
  nombre: z.string().min(1),
  items: z.array(shoppingItemSchema),
});

export const shoppingListsSchema = z.array(z.looseObject({
  id: z.uuid(),
  meal_plan_id: z.uuid(),
  items: z.array(shoppingAisleSchema),
})) satisfies z.ZodType<ShoppingList[]>;
