/**
 * Realtime sync via Supabase Postgres Changes.
 * Subscribes to all tables and refreshes the relevant entity in the Zustand store.
 * Debounced 300ms per table to avoid UI flicker on rapid changes.
 */

import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { logger } from './logger'
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
    logger.warn('realtime', `refresh failed for ${table}`, err)
    useStore.setState({ syncError: 'הסנכרון נכשל — רענן את הדף ידנית' })
  }
}

function debounceRefresh(table: TableName): void {
  const existing = debounceTimers.get(table)
  if (existing) clearTimeout(existing)
  const timer = setTimeout(() => {
    debounceTimers.delete(table)
    void refreshTable(table)
  }, 300)
  debounceTimers.set(table, timer)
}

let channel: RealtimeChannel | null = null

export function startRealtime(): void {
  if (channel) return

  const ch = supabase.channel('db-changes')

  // supabase-js v2's typing for `on('postgres_changes', ...)` is awkward;
  // we accept the untyped builder but still constrain the payload via TABLES.
  const withPostgresChanges = ch as unknown as {
    on: (
      event: 'postgres_changes',
      filter: { event: '*'; schema: 'public'; table: TableName },
      callback: () => void,
    ) => typeof withPostgresChanges
    subscribe: (cb: (status: string) => void) => RealtimeChannel
  }

  let builder = withPostgresChanges
  for (const table of TABLES) {
    builder = builder.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => debounceRefresh(table),
    )
  }

  channel = builder.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      logger.info('realtime', 'subscribed to all tables')
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      logger.warn('realtime', 'channel status', status)
      useStore.setState({ syncError: 'הסנכרון בזמן אמת נפל — רענן את הדף' })
    }
  })
}

export function stopRealtime(): void {
  if (channel) {
    void supabase.removeChannel(channel)
    channel = null
  }
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer)
  }
  debounceTimers.clear()
}
