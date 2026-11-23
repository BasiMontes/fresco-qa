import type { PostgrestError, UserProfile } from './profiles.types';

import { z } from 'zod';

export const userProfileSchema = z.looseObject({
  id: z.uuid(),
  num_personas: z.int(),
  adultos: z.int(),
  ninos: z.int(),
  alergenos: z.array(z.string()),
  dieta_vegetariano: z.boolean(),
  dieta_vegano: z.boolean(),
  dieta_sin_gluten: z.boolean(),
  dieta_sin_lactosa: z.boolean(),
  dieta_sin_huevo: z.boolean(),
  dieta_keto: z.boolean(),
  dieta_halal: z.boolean(),
  nombre: z.string().nullable(),
  objetivo: z.string().nullable(),
  presupuesto_semana_euros: z.number().nullable(),
  planning_selection: z.record(z.string(), z.unknown()).nullable(),
  ingredientes_odiados: z.array(z.string()).optional(),
}) satisfies z.ZodType<UserProfile>;

export const postgrestErrorSchema = z.looseObject({
  code: z.string(),
  message: z.string(),
}) satisfies z.ZodType<PostgrestError>;
