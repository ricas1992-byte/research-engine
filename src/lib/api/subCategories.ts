import { supabase } from '../supabase'
import { audit } from '../auditLog'
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
    .is('deleted_at', null)
    .order('order', { ascending: true })
  if (error) throw new Error('שגיאה בטעינת תת-קטגוריות: ' + error.message)
  return (data as DbSubCategory[]).map(toApp)
}

export async function fetchDeletedSubCategories(): Promise<SubCategory[]> {
  const { data, error } = await supabase
    .from('sub_categories')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת תת-קטגוריות מאורכבות: ' + error.message)
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
  const saved = toApp(row as DbSubCategory)
  void audit('sub_categories', saved.id, 'create', { name: saved.name, categoryId: saved.categoryId })
  return saved
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
  void audit('sub_categories', id, 'update', updates)
  return toApp(row as DbSubCategory)
}

export async function deleteSubCategory(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('sub_categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select('name')
    .single()
  if (error) throw new Error('שגיאה במחיקת תת-קטגוריה: ' + error.message)
  void audit('sub_categories', id, 'soft_delete', { name: data.name })
}

export async function restoreSubCategory(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('sub_categories')
    .update({ deleted_at: null })
    .eq('id', id)
    .select('name')
    .single()
  if (error) throw new Error('שגיאה בשחזור תת-קטגוריה: ' + error.message)
  void audit('sub_categories', id, 'restore', { name: data.name })
}
