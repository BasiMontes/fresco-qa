import type { MealPlan } from './menu.types';

import { z } from 'zod';

import { recipeDietSchema } from './recipes.schema';

export const mealPlanSchema = z.looseObject({
  id: z.uuid(),
  user_id: z.uuid(),
  semana_iso: z.string().regex(/^\d{4}-W\d{2}$/),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  advertencias: z.array(z.string()).nullable(),
  coste_estimado: z.number().nullable(),
}) satisfies z.ZodType<MealPlan>;

export const mealPlansSchema = z.array(mealPlanSchema);

export const menuRecipeRowSchema = z.looseObject({
  id: z.uuid(),
  recipe_id: z.uuid().nullable(),
  dia: z.union([z.string(), z.number()]),
  tipo_plato: z.string(),
  estado: z.string().nullable(),
  recipes: z.looseObject({
    nombre: z.string(),
    alergenos: z.array(z.string()),
    dieta: recipeDietSchema,
  }).nullable(),
});

export const menuRecipeRowsSchema = z.array(menuRecipeRowSchema);
