import type { Recipe } from './recipes.types';

import { z } from 'zod';

export const recipeDietSchema = z.record(z.string(), z.boolean().optional());

export const recipeSchema = z.looseObject({
  id: z.uuid(),
  nombre: z.string().min(1),
  activo: z.boolean(),
  alergenos: z.array(z.string()),
  dieta: recipeDietSchema,
}) satisfies z.ZodType<Recipe>;
