export interface RecipeDiet {
  vegano?: boolean
  vegetariano?: boolean
  sin_gluten?: boolean
  sin_lactosa?: boolean
  sin_huevo?: boolean
  keto?: boolean
  halal?: boolean
  [key: string]: boolean | undefined
}

export interface Recipe {
  id: string
  nombre: string
  activo: boolean
  alergenos: string[]
  dieta: RecipeDiet
}

export type { PostgrestError as RpcError } from './profiles.types';
