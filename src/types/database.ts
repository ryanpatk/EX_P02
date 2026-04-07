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
  links: { count: number }[]
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface LinkTag {
  id: string
  link_id: string
  tag_id: string
  created_at: string
}

export interface LinkTagWithTag extends LinkTag {
  tag?: Tag
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
  tag_id?: string
  created_at: string
  updated_at: string
  order_index: number
}

export interface LinkWithTag extends Link {
  tag?: Tag
  link_tags?: LinkTagWithTag[]
  tags?: Tag[]
  project?: {
    id: string
    name: string
  }
}

export interface Profile {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface ProfileLink {
  id: string
  profile_id: string
  link_id: string
  order_index: number
  created_at: string
}

export interface ProfileLinkWithLink extends ProfileLink {
  link?: LinkWithTag
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

export interface CreateTagData {
  name: string
  color: string
}

export interface UpdateTagData {
  name?: string
  color?: string
}

export interface CreateProfileData {
  name: string
}

export interface UpdateProfileData {
  name?: string
}

export interface CreateLinkData {
  project_id?: string
  url: string
  title?: string
  description?: string
  favicon_url?: string
  preview_image_url?: string
  tag_id?: string
  order_index?: number
}

export interface UpdateLinkData {
  project_id?: string
  url?: string
  title?: string
  description?: string
  favicon_url?: string
  preview_image_url?: string
  tag_id?: string
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
      tags: {
        Row: Tag
        Insert: Omit<Tag, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Tag, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      link_tags: {
        Row: LinkTag
        Insert: Omit<LinkTag, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<LinkTag, 'id' | 'created_at'>>
      }
      links: {
        Row: Link
        Insert: Omit<Link, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Link, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      profile_links: {
        Row: ProfileLink
        Insert: Omit<ProfileLink, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<ProfileLink, 'id' | 'created_at'>>
      }
    }
  }
}
