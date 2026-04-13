import { supabase } from '../supabase'
import type { SubCategory } from '../../types/index'
import type { DbSubCategory } from '../database.types'

function toApp(row: DbSubCategory): SubCategory {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description ?? undefined,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchAllSubCategories(): Promise<SubCategory[]> {
  const { data, error } = await supabase
    .from('sub_categories')
    .select('*')
    .order('order', { ascending: true })
  if (error) throw new Error('שגיאה בטעינת תת-קטגוריות: ' + error.message)
  return (data as DbSubCategory[]).map(toApp)
}

export async function createSubCategory(
  data: Omit<SubCategory, 'id' | 'order' | 'createdAt' | 'updatedAt'>
): Promise<SubCategory> {
  const { data: row, error } = await supabase
    .from('sub_categories')
    .insert({
      category_id: data.categoryId,
      name: data.name,
      description: data.description ?? null,
      order: 0,
    })
    .select()
    .single()
  if (error) throw new Error('שגיאה ביצירת תת-קטגוריה: ' + error.message)
  return toApp(row as DbSubCategory)
}

export async function updateSubCategory(
  id: string,
  updates: Partial<Omit<SubCategory, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>>
): Promise<SubCategory> {
  const { data: row, error } = await supabase
    .from('sub_categories')
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description ?? null }),
      ...(updates.order !== undefined && { order: updates.order }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error('שגיאה בעדכון תת-קטגוריה: ' + error.message)
  return toApp(row as DbSubCategory)
}

export async function deleteSubCategory(id: string): Promise<void> {
  const { error } = await supabase.from('sub_categories').delete().eq('id', id)
  if (error) throw new Error('שגיאה במחיקת תת-קטגוריה: ' + error.message)
}
