import { supabase } from '../supabase'
import type { DbCategoryProjectMap } from '../database.types'

export async function fetchCategoryProjectMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('category_project_map')
    .select('category_id, project_id')
  if (error) throw new Error('שגיאה בטעינת שיוכי פרויקט: ' + error.message)
  const out: Record<string, string> = {}
  for (const row of (data as Pick<DbCategoryProjectMap, 'category_id' | 'project_id'>[])) {
    out[row.category_id] = row.project_id
  }
  return out
}

export async function upsertCategoryProjectAssignment(
  categoryId: string,
  projectId: string,
): Promise<void> {
  const { error } = await supabase
    .from('category_project_map')
    .upsert(
      { category_id: categoryId, project_id: projectId },
      { onConflict: 'user_id,category_id' },
    )
  if (error) throw new Error('שגיאה בשמירת שיוך לפרויקט: ' + error.message)
}

export async function bulkUploadCategoryProjectMap(
  map: Record<string, string>,
): Promise<void> {
  const rows = Object.entries(map).map(([category_id, project_id]) => ({
    category_id,
    project_id,
  }))
  if (rows.length === 0) return
  const { error } = await supabase
    .from('category_project_map')
    .upsert(rows, { onConflict: 'user_id,category_id' })
  if (error) throw new Error('שגיאה בהעלאת שיוכי פרויקט: ' + error.message)
}
