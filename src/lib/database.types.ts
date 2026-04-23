// Hand-written types matching supabase/migrations/*.sql.
// Used by the API layer — do NOT leak these into the rest of the app (use camelCase app types instead).

export type DbCategory = {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type DbSubCategory = {
  id: string
  user_id: string
  category_id: string
  name: string
  description: string | null
  order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type DbSubQuestion = {
  id: string
  user_id: string
  category_id: string
  sub_category_id: string | null
  number: string | null
  text: string
  description: string | null
  order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type DbRawMaterial = {
  id: string
  title: string
  url: string
  source: 'gdrive'
  type: 'doc' | 'pdf' | 'audio' | 'image' | 'other'
  addedAt: string
  notes?: string
}

export type DbInvestigation = {
  id: string
  user_id: string
  sub_question_id: string
  title: string
  content: string
  findings: string | null
  status: string
  raw_materials: DbRawMaterial[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type DbInsight = {
  id: string
  user_id: string
  investigation_id: string
  text: string
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type DbFinalOutput = {
  id: string
  user_id: string
  title: string
  content: string
  format: string
  linked_insights: string[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type DbSourceExcerpt = {
  id: string
  user_id: string
  quoted_text: string
  material_id: string
  material_title: string
  investigation_id: string
  investigation_title: string
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type DbCategoryProjectMap = {
  user_id: string
  category_id: string
  project_id: string
  updated_at: string
}

export type DbAuditLog = {
  id: string
  user_id: string
  entity: string
  entity_id: string
  action: string
  payload: unknown
  created_at: string
}

// Minimal Database type used by createClient<Database>
export type Database = {
  public: {
    Tables: {
      categories: {
        Row: DbCategory
        Insert: Omit<DbCategory, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<DbCategory, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      sub_categories: {
        Row: DbSubCategory
        Insert: Omit<DbSubCategory, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<DbSubCategory, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      sub_questions: {
        Row: DbSubQuestion
        Insert: Omit<DbSubQuestion, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<DbSubQuestion, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      investigations: {
        Row: DbInvestigation
        Insert: Omit<DbInvestigation, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<DbInvestigation, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      insights: {
        Row: DbInsight
        Insert: Omit<DbInsight, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<DbInsight, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      final_outputs: {
        Row: DbFinalOutput
        Insert: Omit<DbFinalOutput, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<DbFinalOutput, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      source_excerpts: {
        Row: DbSourceExcerpt
        Insert: Omit<DbSourceExcerpt, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<DbSourceExcerpt, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      category_project_map: {
        Row: DbCategoryProjectMap
        Insert: Omit<DbCategoryProjectMap, 'user_id' | 'updated_at'>
        Update: Partial<Omit<DbCategoryProjectMap, 'user_id'>>
        Relationships: []
      }
      audit_log: {
        Row: DbAuditLog
        Insert: Omit<DbAuditLog, 'id' | 'user_id' | 'created_at'>
        Update: Partial<Omit<DbAuditLog, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
