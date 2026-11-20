export interface MealPlan {
  id: string
  user_id: string
  semana_iso: string
  fecha_inicio: string
  advertencias: string[] | null
  coste_estimado: number | null
}

export interface MealPlanRecipe {
  id: string
  meal_plan_id: string
  recipe_id: string | null
  dia: string | number
  tipo_plato: string
  estado: string | null
  rating: number | null
}

export interface GenerateMealPlanPayload {
  semana_iso: string
  fecha_inicio: string
}

export type GenerateMealPlanResponse = Record<string, unknown> | null;
