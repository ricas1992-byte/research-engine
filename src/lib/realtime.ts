/**
 * Realtime sync via Supabase Postgres Changes.
 * Subscribes to all tables and refreshes the relevant entity in the Zustand store.
 * Debounced 300ms per table to avoid UI flicker on rapid changes.
 */

import { supabase } from './supabase'
import { fetchAllCategories } from './api/categories'
import { fetchAllSubCategories } from './api/subCategories'
import { fetchAllSubQuestions } from './api/subQuestions'
import { fetchAllInvestigations } from './api/investigations'
import { fetchAllInsights } from './api/insights'
import { fetchAllFinalOutputs } from './api/finalOutputs'
import { fetchAllSourceExcerpts } from './api/sourceExcerpts'
import { useStore } from '../data/store'

type TableName =
  | 'categories'
  | 'sub_categories'
  | 'sub_questions'
  | 'investigations'
  | 'insights'
  | 'final_outputs'
  | 'source_excerpts'

const TABLES: TableName[] = [
  'categories',
  'sub_categories',
  'sub_questions',
  'investigations',
  'insights',
  'final_outputs',
  'source_excerpts',
]

const debounceTimers = new Map<TableName, ReturnType<typeof setTimeout>>()

async function refreshTable(table: TableName): Promise<void> {
  const store = useStore.getState()
  try {
    switch (table) {
      case 'categories': {
        const categories = await fetchAllCategories()
        useStore.setState({ categories })
        break
      }
      case 'sub_categories': {
        const subCategories = await fetchAllSubCategories()
        useStore.setState({ subCategories })
        break
      }
      case 'sub_questions': {
        const subQuestions = await fetchAllSubQuestions()
        useStore.setState({ subQuestions })
        break
      }
      case 'investigations': {
        const investigations = await fetchAllInvestigations()
        useStore.setState({ investigations })
        break
      }
      case 'insights': {
        const insights = await fetchAllInsights()
        useStore.setState({ insights })
        break
      }
      case 'final_outputs': {
        const finalOutputs = await fetchAllFinalOutputs()
        useStore.setState({ finalOutputs })
        break
      }
      case 'source_excerpts': {
        const sourceExcerpts = await fetchAllSourceExcerpts()
        useStore.setState({ sourceExcerpts })
        break
      }
    }
  } catch (err) {
    // Silently ignore realtime refresh errors (user's own mutations handle their own errors)
    void store
    console.warn('[Realtime] Refresh failed for', table, err)
  }
}

function debounceRefresh(table: TableName): void {
  const existing = debounceTimers.get(table)
  if (existing) clearTimeout(existing)
  const timer = setTimeout(() => {
    debounceTimers.delete(table)
    refreshTable(table)
  }, 300)
  debounceTimers.set(table, timer)
}

let channel: ReturnType<typeof supabase.channel> | null = null

export function startRealtime(): void {
  if (channel) return // already started

  channel = supabase.channel('db-changes')

  for (const table of TABLES) {
    channel.on(
      // @ts-expect-error supabase typing for postgres_changes requires literal event strings
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => debounceRefresh(table)
    )
  }

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('[Realtime] Subscribed to all tables')
    }
  })
}

export function stopRealtime(): void {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer)
  }
  debounceTimers.clear()
}
