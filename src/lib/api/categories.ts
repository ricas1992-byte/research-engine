import { supabase } from '../supabase'
import { audit } from '../auditLog'
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

function toInsert(data: Omit<Category, 'id' | 'createdAt'>): Omit<DbCategory, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'> {
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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת קטגוריות: ' + error.message)
  return (data as DbCategory[]).map(toApp)
}

export async function fetchDeletedCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת קטגוריות מאורכבות: ' + error.message)
  return (data as DbCategory[]).map(toApp)
}

export async function createCategory(data: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
  const { data: row, error } = await supabase
    .from('categories')
    .insert(toInsert(data))
    .select()
    .single()
  if (error) throw new Error('שגיאה ביצירת קטגוריה: ' + error.message)
  const saved = toApp(row as DbCategory)
  void audit('categories', saved.id, 'create', { name: saved.name })
  return saved
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
  void audit('categories', id, 'update', updates)
  return toApp(row as DbCategory)
}

/** Soft-delete: marks `deleted_at`. Preserves data per CLAUDE.md archive-only rule. */
export async function deleteCategory(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select('name')
    .single()
  if (error) throw new Error('שגיאה במחיקת קטגוריה: ' + error.message)
  void audit('categories', id, 'soft_delete', { name: data.name })
}

export async function restoreCategory(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('categories')
    .update({ deleted_at: null })
    .eq('id', id)
    .select('name')
    .single()
  if (error) throw new Error('שגיאה בשחזור קטגוריה: ' + error.message)
  void audit('categories', id, 'restore', { name: data.name })
}
