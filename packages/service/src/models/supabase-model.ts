export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          id: number
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_categories: {
        Row: {
          category_id: number
          historical_event_id: number
        }
        Insert: {
          category_id: number
          historical_event_id: number
        }
        Update: {
          category_id?: number
          historical_event_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_categories_historical_event_id_fkey"
            columns: ["historical_event_id"]
            isOneToOne: false
            referencedRelation: "historical_events"
            referencedColumns: ["id"]
          }
        ]
      }
      event_media: {
        Row: {
          historical_event_id: number
          media_id: number
        }
        Insert: {
          historical_event_id: number
          media_id: number
        }
        Update: {
          historical_event_id?: number
          media_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_media_historical_event_id_fkey"
            columns: ["historical_event_id"]
            isOneToOne: false
            referencedRelation: "historical_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          }
        ]
      }
      historical_events: {
        Row: {
          begin_date: string
          created_at: string | null
          detail: string | null
          end_date: string
          id: number
          importance: number
          location: string | null
          slug: string
          summary: string | null
          timeline_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          begin_date: string
          created_at?: string | null
          detail?: string | null
          end_date: string
          id?: never
          importance: number
          location?: string | null
          slug: string
          summary?: string | null
          timeline_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          begin_date?: string
          created_at?: string | null
          detail?: string | null
          end_date?: string
          id?: never
          importance?: number
          location?: string | null
          slug?: string
          summary?: string | null
          timeline_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historical_events_timeline_id_fkey"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "timelines"
            referencedColumns: ["id"]
          }
        ]
      }
      media: {
        Row: {
          alternativetext: string | null
          caption: string | null
          created_at: string | null
          formats: string | null
          height: number | null
          id: number
          slug: string
          updated_at: string | null
          url: string
          width: number | null
        }
        Insert: {
          alternativetext?: string | null
          caption?: string | null
          created_at?: string | null
          formats?: string | null
          height?: number | null
          id?: never
          slug: string
          updated_at?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alternativetext?: string | null
          caption?: string | null
          created_at?: string | null
          formats?: string | null
          height?: number | null
          id?: never
          slug?: string
          updated_at?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      period_timelines: {
        Row: {
          period_id: number
          timeline_id: number
        }
        Insert: {
          period_id: number
          timeline_id: number
        }
        Update: {
          period_id?: number
          timeline_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "period_timelines_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "period_timelines_timeline_id_fkey"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "timelines"
            referencedColumns: ["id"]
          }
        ]
      }
      periods: {
        Row: {
          begin_date: string
          created_at: string | null
          end_date: string
          id: number
          slug: string
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          begin_date: string
          created_at?: string | null
          end_date: string
          id?: never
          slug: string
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          begin_date?: string
          created_at?: string | null
          end_date?: string
          id?: never
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      timeline_events: {
        Row: {
          historical_event_id: number
          timeline_id: number
        }
        Insert: {
          historical_event_id: number
          timeline_id: number
        }
        Update: {
          historical_event_id?: number
          timeline_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_historical_event_id_fkey"
            columns: ["historical_event_id"]
            isOneToOne: false
            referencedRelation: "historical_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_timeline_id_fkey"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "timelines"
            referencedColumns: ["id"]
          }
        ]
      }
      timelines: {
        Row: {
          begin_date: string
          created_at: string | null
          end_date: string
          id: number
          scale: string | null
          slug: string
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          begin_date: string
          created_at?: string | null
          end_date: string
          id?: never
          scale?: string | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          begin_date?: string
          created_at?: string | null
          end_date?: string
          id?: never
          scale?: string | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

