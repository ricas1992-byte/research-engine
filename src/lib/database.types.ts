// Hand-written types matching supabase/migrations/20260412000000_initial_schema.sql exactly.
// Used by the API layer — do NOT leak these into the rest of the app (use camelCase app types instead).

export interface DbCategory {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
}

export interface DbSubCategory {
  id: string
  user_id: string
  category_id: string
  name: string
  description: string | null
  order: number
  created_at: string
  updated_at: string
}

export interface DbSubQuestion {
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
}

export interface DbRawMaterial {
  id: string
  title: string
  url: string
  source: 'gdrive'
  type: 'doc' | 'pdf' | 'audio' | 'image' | 'other'
  addedAt: string
  notes?: string
}

export interface DbInvestigation {
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
}

export interface DbInsight {
  id: string
  user_id: string
  investigation_id: string
  text: string
  status: string
  created_at: string
  updated_at: string
}

export interface DbFinalOutput {
  id: string
  user_id: string
  title: string
  content: string
  format: string
  linked_insights: string[]
  created_at: string
  updated_at: string
}

export interface DbSourceExcerpt {
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
}

// Minimal Database type used by createClient<Database>
export type Database = {
  public: {
    Tables: {
      categories:     { Row: DbCategory;     Insert: Omit<DbCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>;     Update: Partial<Omit<DbCategory, 'id' | 'user_id' | 'created_at'>>     }
      sub_categories: { Row: DbSubCategory;  Insert: Omit<DbSubCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>;  Update: Partial<Omit<DbSubCategory, 'id' | 'user_id' | 'created_at'>>  }
      sub_questions:  { Row: DbSubQuestion;  Insert: Omit<DbSubQuestion, 'id' | 'user_id' | 'created_at' | 'updated_at'>;  Update: Partial<Omit<DbSubQuestion, 'id' | 'user_id' | 'created_at'>>  }
      investigations: { Row: DbInvestigation; Insert: Omit<DbInvestigation, 'id' | 'user_id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<DbInvestigation, 'id' | 'user_id' | 'created_at'>> }
      insights:       { Row: DbInsight;      Insert: Omit<DbInsight, 'id' | 'user_id' | 'created_at' | 'updated_at'>;      Update: Partial<Omit<DbInsight, 'id' | 'user_id' | 'created_at'>>      }
      final_outputs:  { Row: DbFinalOutput;  Insert: Omit<DbFinalOutput, 'id' | 'user_id' | 'created_at' | 'updated_at'>;  Update: Partial<Omit<DbFinalOutput, 'id' | 'user_id' | 'created_at'>>  }
      source_excerpts:{ Row: DbSourceExcerpt; Insert: Omit<DbSourceExcerpt, 'id' | 'user_id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<DbSourceExcerpt, 'id' | 'user_id' | 'created_at'>> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
