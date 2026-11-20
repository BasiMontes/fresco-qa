export interface PlanningSelection {
  [key: string]: unknown
}

export interface UserProfile {
  id: string
  num_personas: number
  adultos: number
  ninos: number
  alergenos: string[]
  dieta_vegetariano: boolean
  dieta_vegano: boolean
  dieta_sin_gluten: boolean
  dieta_sin_lactosa: boolean
  dieta_sin_huevo: boolean
  dieta_keto: boolean
  dieta_halal: boolean
  nombre: string | null
  objetivo: string | null
  presupuesto_semana_euros: number | null
  planning_selection: PlanningSelection | null
}

export interface Household {
  num_personas: number
  adultos: number
  ninos: number
}

export interface PostgrestError {
  code?: string
  message?: string
}

export function toHousehold(profile: UserProfile): Household {
  return { num_personas: profile.num_personas, adultos: profile.adultos, ninos: profile.ninos };
}
