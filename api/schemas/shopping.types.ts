export interface ShoppingItem {
  nombre: string
  cantidad: number
  unidad: string
}

export interface ShoppingAisle {
  nombre: string
  items: ShoppingItem[]
}

export interface ShoppingList {
  id: string
  meal_plan_id: string
  items: ShoppingAisle[]
}
