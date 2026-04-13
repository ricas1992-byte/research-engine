import { supabase } from '../supabase'
import type { Category } from '../../types/index'
import type { DbCategory } from '../database.types'

function toApp(row: DbCategory): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    color: row.color,
    createdAt: row.created_at,
  }
}

function toInsert(data: Omit<Category, 'id' | 'createdAt'>): Omit<DbCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  return {
    name: data.name,
    description: data.description ?? null,
    color: data.color,
  }
}

export async function fetchAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת קטגוריות: ' + error.message)
  return (data as DbCategory[]).map(toApp)
}

export async function createCategory(data: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
  const { data: row, error } = await supabase
    .from('categories')
    .insert(toInsert(data))
    .select()
    .single()
  if (error) throw new Error('שגיאה ביצירת קטגוריה: ' + error.message)
  return toApp(row as DbCategory)
}

export async function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<Category> {
  const { data: row, error } = await supabase
    .from('categories')
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description ?? null }),
      ...(updates.color !== undefined && { color: updates.color }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error('שגיאה בעדכון קטגוריה: ' + error.message)
  return toApp(row as DbCategory)
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error('שגיאה במחיקת קטגוריה: ' + error.message)
}
