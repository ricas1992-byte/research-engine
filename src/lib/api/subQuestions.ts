import { supabase } from '../supabase'
import type { SubQuestion } from '../../types/index'
import type { DbSubQuestion } from '../database.types'

function toApp(row: DbSubQuestion): SubQuestion {
  return {
    id: row.id,
    text: row.text,
    categoryId: row.category_id,
    subCategoryId: row.sub_category_id,
    number: row.number ?? undefined,
    description: row.description ?? undefined,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchAllSubQuestions(): Promise<SubQuestion[]> {
  const { data, error } = await supabase
    .from('sub_questions')
    .select('*')
    .order('order', { ascending: true })
  if (error) throw new Error('שגיאה בטעינת שאלות: ' + error.message)
  return (data as DbSubQuestion[]).map(toApp)
}

export async function createSubQuestion(
  data: Omit<SubQuestion, 'id' | 'order' | 'createdAt' | 'updatedAt'>
): Promise<SubQuestion> {
  const { data: row, error } = await supabase
    .from('sub_questions')
    .insert({
      category_id: data.categoryId,
      sub_category_id: data.subCategoryId ?? null,
      number: data.number ?? null,
      text: data.text,
      description: data.description ?? null,
      order: 0,
    })
    .select()
    .single()
  if (error) throw new Error('שגיאה ביצירת שאלה: ' + error.message)
  return toApp(row as DbSubQuestion)
}

export async function updateSubQuestion(
  id: string,
  updates: Partial<Omit<SubQuestion, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<SubQuestion> {
  const { data: row, error } = await supabase
    .from('sub_questions')
    .update({
      ...(updates.text !== undefined && { text: updates.text }),
      ...(updates.categoryId !== undefined && { category_id: updates.categoryId }),
      ...(updates.subCategoryId !== undefined && { sub_category_id: updates.subCategoryId ?? null }),
      ...(updates.number !== undefined && { number: updates.number ?? null }),
      ...(updates.description !== undefined && { description: updates.description ?? null }),
      ...(updates.order !== undefined && { order: updates.order }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error('שגיאה בעדכון שאלה: ' + error.message)
  return toApp(row as DbSubQuestion)
}

export async function deleteSubQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('sub_questions').delete().eq('id', id)
  if (error) throw new Error('שגיאה במחיקת שאלה: ' + error.message)
}
