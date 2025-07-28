// Database types for EX_P02
// These types match the Supabase database schema

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  is_starred: boolean
  created_at: string
  updated_at: string
  last_modified: string
}

export interface ProjectWithCounts extends Project {
  notes: { count: number }[]
  links: { count: number }[]
}

export interface Note {
  id: string
  project_id: string
  user_id: string
  title?: string
  encrypted_content: string
  created_at: string
  updated_at: string
  order_index: number
}

export interface Link {
  id: string
  project_id: string
  user_id: string
  url: string
  title?: string
  description?: string
  favicon_url?: string
  preview_image_url?: string
  created_at: string
  updated_at: string
  order_index: number
}

// Form types for creating/updating entities
export interface CreateProjectData {
  name: string
  description?: string
  is_starred?: boolean
}

export interface UpdateProjectData {
  name?: string
  description?: string
  is_starred?: boolean
}

export interface CreateNoteData {
  project_id: string
  title?: string
  encrypted_content?: string
  order_index?: number
}

export interface UpdateNoteData {
  title?: string
  encrypted_content?: string
  order_index?: number
}

export interface CreateLinkData {
  project_id: string
  url: string
  title?: string
  description?: string
  favicon_url?: string
  preview_image_url?: string
  order_index?: number
}

export interface UpdateLinkData {
  url?: string
  title?: string
  description?: string
  favicon_url?: string
  preview_image_url?: string
  order_index?: number
}

// Supabase database schema type
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'last_modified'> & {
          id?: string
          created_at?: string
          updated_at?: string
          last_modified?: string
        }
        Update: Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_modified'>>
      }
      notes: {
        Row: Note
        Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Note, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      links: {
        Row: Link
        Insert: Omit<Link, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Link, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}