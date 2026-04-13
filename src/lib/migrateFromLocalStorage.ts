/**
 * One-time migration from localStorage (key: musical-thinking-v4) to Supabase.
 *
 * Safety rules:
 * - All 7 entity types must upload successfully before any localStorage key is deleted.
 * - If even one entity type fails, localStorage is left completely untouched.
 * - On success, also clears old auth keys (mt-cred-v2, mt-session, mt-failed, mt-lockout).
 * - A flag stored in Supabase user metadata (migration_completed: true) prevents re-runs.
 */

import { supabase } from './supabase'
import {
  createCategory,
} from './api/categories'
import {
  createSubCategory,
} from './api/subCategories'
import {
  createSubQuestion,
} from './api/subQuestions'
import {
  createInvestigation,
} from './api/investigations'
import {
  createInsight,
} from './api/insights'
import {
  createFinalOutput,
} from './api/finalOutputs'
import {
  createSourceExcerpt,
} from './api/sourceExcerpts'
import type {
  Category, SubCategory, SubQuestion, Investigation, Insight, FinalOutput, SourceExcerpt,
} from '../types/index'

const LS_KEY = 'musical-thinking-v4'
const OLD_AUTH_KEYS = ['mt-cred-v2', 'mt-session', 'mt-failed', 'mt-lockout']

interface LocalData {
  categories?: Category[]
  subCategories?: SubCategory[]
  subQuestions?: SubQuestion[]
  investigations?: Investigation[]
  insights?: Insight[]
  finalOutputs?: FinalOutput[]
  sourceExcerpts?: SourceExcerpt[]
}

export async function runMigration(): Promise<void> {
  // ── 1. Check if already migrated ────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const metadata = user.user_metadata as Record<string, unknown>
  if (metadata?.migration_completed === true) {
    return
  }

  // ── 2. Read localStorage data ────────────────────────────────────────────────
  let raw: string | null = null
  try {
    raw = localStorage.getItem(LS_KEY)
  } catch {
    return
  }

  if (!raw) {
    // No local data — mark as complete immediately
    await supabase.auth.updateUser({ data: { migration_completed: true } })
    return
  }

  let localData: LocalData
  try {
    localData = JSON.parse(raw) as LocalData
  } catch {
    console.error('[Migration] Failed to parse localStorage data — leaving untouched')
    return
  }

  const categories   = localData.categories   ?? []
  const subCategories = localData.subCategories ?? []
  const subQuestions  = localData.subQuestions  ?? []
  const investigations = localData.investigations ?? []
  const insights      = localData.insights      ?? []
  const finalOutputs  = localData.finalOutputs  ?? []
  const sourceExcerpts = localData.sourceExcerpts ?? []

  if (
    categories.length === 0 &&
    subCategories.length === 0 &&
    subQuestions.length === 0 &&
    investigations.length === 0 &&
    insights.length === 0 &&
    finalOutputs.length === 0 &&
    sourceExcerpts.length === 0
  ) {
    await supabase.auth.updateUser({ data: { migration_completed: true } })
    return
  }

  console.log(`[Migration] Starting: ${categories.length} categories, ${subCategories.length} sub-categories, ${subQuestions.length} sub-questions, ${investigations.length} investigations, ${insights.length} insights, ${finalOutputs.length} final outputs, ${sourceExcerpts.length} source excerpts`)

  // ── 3. Build ID remap tables (old UUID → new UUID from Supabase) ─────────────
  const categoryIdMap    = new Map<string, string>()
  const subCategoryIdMap = new Map<string, string>()
  const subQuestionIdMap = new Map<string, string>()
  const investigationIdMap = new Map<string, string>()
  const insightIdMap     = new Map<string, string>()

  // ── 4. Upload all entities in dependency order ───────────────────────────────
  // Wrap everything in a try/catch. If anything throws, we bail out completely.
  try {
    // Categories
    for (const cat of categories) {
      const saved = await createCategory({ name: cat.name, description: cat.description, color: cat.color })
      categoryIdMap.set(cat.id, saved.id)
    }

    // SubCategories
    for (const sc of subCategories) {
      const newCategoryId = categoryIdMap.get(sc.categoryId)
      if (!newCategoryId) {
        throw new Error(`תת-קטגוריה "${sc.name}" מפנה לקטגוריה שלא נמצאה: ${sc.categoryId}`)
      }
      const saved = await createSubCategory({ categoryId: newCategoryId, name: sc.name, description: sc.description })
      subCategoryIdMap.set(sc.id, saved.id)
    }

    // SubQuestions
    for (const sq of subQuestions) {
      const newCategoryId = categoryIdMap.get(sq.categoryId)
      if (!newCategoryId) {
        throw new Error(`שאלה "${sq.text}" מפנה לקטגוריה שלא נמצאה: ${sq.categoryId}`)
      }
      const newSubCategoryId = sq.subCategoryId ? (subCategoryIdMap.get(sq.subCategoryId) ?? null) : null
      const saved = await createSubQuestion({
        text: sq.text,
        categoryId: newCategoryId,
        subCategoryId: newSubCategoryId,
        number: sq.number,
        description: sq.description,
      })
      subQuestionIdMap.set(sq.id, saved.id)
    }

    // Investigations
    for (const inv of investigations) {
      const newSubQuestionId = subQuestionIdMap.get(inv.subQuestionId)
      if (!newSubQuestionId) {
        throw new Error(`חקירה "${inv.title}" מפנה לשאלה שלא נמצאה: ${inv.subQuestionId}`)
      }
      const saved = await createInvestigation({
        subQuestionId: newSubQuestionId,
        title: inv.title,
        content: inv.content,
        findings: inv.findings,
        status: inv.status,
        rawMaterials: inv.rawMaterials ?? [],
      })
      investigationIdMap.set(inv.id, saved.id)
    }

    // Insights
    for (const ins of insights) {
      const newInvestigationId = investigationIdMap.get(ins.investigationId)
      if (!newInvestigationId) {
        throw new Error(`תובנה "${ins.text.slice(0, 30)}" מפנה לחקירה שלא נמצאה: ${ins.investigationId}`)
      }
      const saved = await createInsight({
        investigationId: newInvestigationId,
        text: ins.text,
        status: ins.status,
      })
      insightIdMap.set(ins.id, saved.id)
    }

    // FinalOutputs
    for (const fo of finalOutputs) {
      const newLinkedInsights = fo.linkedInsights.map((oldId) => insightIdMap.get(oldId) ?? oldId)
      await createFinalOutput({
        title: fo.title,
        content: fo.content,
        format: fo.format,
        linkedInsights: newLinkedInsights,
      })
    }

    // SourceExcerpts
    for (const se of sourceExcerpts) {
      const newInvestigationId = investigationIdMap.get(se.investigationId) ?? se.investigationId
      await createSourceExcerpt({
        quotedText: se.quotedText,
        materialId: se.materialId,
        materialTitle: se.materialTitle,
        investigationId: newInvestigationId,
        investigationTitle: se.investigationTitle,
        notes: se.notes,
      })
    }

  } catch (err) {
    // ── Partial failure: leave localStorage completely untouched ─────────────
    console.error('[Migration] FAILED — localStorage preserved, Supabase may have partial data. Error:', err)
    return
  }

  // ── 5. Full success — clear localStorage ────────────────────────────────────
  try {
    localStorage.removeItem(LS_KEY)
    for (const key of OLD_AUTH_KEYS) {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    }
  } catch {
    // Non-fatal — data is in Supabase regardless
  }

  // ── 6. Mark migration complete in user metadata ──────────────────────────────
  await supabase.auth.updateUser({ data: { migration_completed: true } })

  console.log('[Migration] Success — all data uploaded to Supabase, localStorage cleared.')
}
