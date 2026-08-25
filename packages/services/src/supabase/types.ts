export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          parent_category_id: string | null;
          slug: string;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          parent_category_id?: string | null;
          slug: string;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          parent_category_id?: string | null;
          slug?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_same_owner_fkey";
            columns: ["user_id", "parent_category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["user_id", "id"];
          },
        ];
      };
      character_media: {
        Row: {
          character_id: string;
          is_primary: boolean | null;
          media_id: string;
        };
        Insert: {
          character_id: string;
          is_primary?: boolean | null;
          media_id: string;
        };
        Update: {
          character_id?: string;
          is_primary?: boolean | null;
          media_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "character_media_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "character_media_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["related_id"];
          },
          {
            foreignKeyName: "character_media_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "character_media_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "character_media_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      character_relationships: {
        Row: {
          character_id: string;
          created_at: string | null;
          description: string | null;
          end_temporal: Json | null;
          id: string;
          metadata: Json | null;
          related_character_id: string;
          relationship_role: string | null;
          relationship_type: string;
          start_temporal: Json | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          character_id: string;
          created_at?: string | null;
          description?: string | null;
          end_temporal?: Json | null;
          id?: string;
          metadata?: Json | null;
          related_character_id: string;
          relationship_role?: string | null;
          relationship_type: string;
          start_temporal?: Json | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          character_id?: string;
          created_at?: string | null;
          description?: string | null;
          end_temporal?: Json | null;
          id?: string;
          metadata?: Json | null;
          related_character_id?: string;
          relationship_role?: string | null;
          relationship_type?: string;
          start_temporal?: Json | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "character_relationships_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "character_relationships_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["related_id"];
          },
          {
            foreignKeyName: "character_relationships_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "character_relationships_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "character_relationships_related_character_id_fkey";
            columns: ["related_character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "character_relationships_related_character_id_fkey";
            columns: ["related_character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["related_id"];
          },
          {
            foreignKeyName: "character_relationships_related_character_id_fkey";
            columns: ["related_character_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "character_relationships_related_character_id_fkey";
            columns: ["related_character_id"];
            isOneToOne: false;
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "character_relationships_relationship_type_fkey";
            columns: ["relationship_type"];
            isOneToOne: false;
            referencedRelation: "relationship_types";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "character_relationships_role_fkey";
            columns: ["relationship_type", "relationship_role"];
            isOneToOne: false;
            referencedRelation: "relationship_roles";
            referencedColumns: ["type_key", "key"];
          },
        ];
      };
      characters: {
        Row: {
          aliases: string[] | null;
          biography: string | null;
          birth_temporal: Json | null;
          breed: string | null;
          character_type: string;
          created_at: string | null;
          cultural_context: string[] | null;
          death_temporal: Json | null;
          domain: string | null;
          id: string;
          metadata: Json | null;
          name: string;
          physical_description: string | null;
          profile_data: Json | null;
          published: boolean | null;
          published_at: string | null;
          search_vector: unknown;
          significance: string | null;
          slug: string;
          sort_order_years: number | null;
          species: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          aliases?: string[] | null;
          biography?: string | null;
          birth_temporal?: Json | null;
          breed?: string | null;
          character_type: string;
          created_at?: string | null;
          cultural_context?: string[] | null;
          death_temporal?: Json | null;
          domain?: string | null;
          id?: string;
          metadata?: Json | null;
          name: string;
          physical_description?: string | null;
          profile_data?: Json | null;
          published?: boolean | null;
          published_at?: string | null;
          search_vector?: unknown;
          significance?: string | null;
          slug: string;
          sort_order_years?: number | null;
          species?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          aliases?: string[] | null;
          biography?: string | null;
          birth_temporal?: Json | null;
          breed?: string | null;
          character_type?: string;
          created_at?: string | null;
          cultural_context?: string[] | null;
          death_temporal?: Json | null;
          domain?: string | null;
          id?: string;
          metadata?: Json | null;
          name?: string;
          physical_description?: string | null;
          profile_data?: Json | null;
          published?: boolean | null;
          published_at?: string | null;
          search_vector?: unknown;
          significance?: string | null;
          slug?: string;
          sort_order_years?: number | null;
          species?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      content_reports: {
        Row: {
          admin_notes: string | null;
          created_at: string | null;
          description: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          reason: string;
          reporter_id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          created_at?: string | null;
          description?: string | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          reason: string;
          reporter_id: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          created_at?: string | null;
          description?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          reason?: string;
          reporter_id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
      event_categories: {
        Row: {
          category_id: string;
          event_id: string;
        };
        Insert: {
          category_id: string;
          event_id: string;
        };
        Update: {
          category_id?: string;
          event_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_categories_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "event_categories_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "event_participants_view";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "event_categories_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_characters: {
        Row: {
          character_id: string;
          description: string | null;
          event_id: string;
          role: string;
          significance: string;
        };
        Insert: {
          character_id: string;
          description?: string | null;
          event_id: string;
          role?: string;
          significance?: string;
        };
        Update: {
          character_id?: string;
          description?: string | null;
          event_id?: string;
          role?: string;
          significance?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_characters_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "event_characters_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["related_id"];
          },
          {
            foreignKeyName: "event_characters_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "event_characters_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_characters_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "event_characters_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "event_participants_view";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "event_characters_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_media: {
        Row: {
          event_id: string;
          media_id: string;
          sort_order: number | null;
        };
        Insert: {
          event_id: string;
          media_id: string;
          sort_order?: number | null;
        };
        Update: {
          event_id?: string;
          media_id?: string;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_media_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "event_media_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "event_participants_view";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "event_media_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_media_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          computed_end_date: string | null;
          computed_start_date: string | null;
          created_at: string | null;
          detail: string | null;
          detail_timeline_id: string | null;
          end_temporal_data: Json | null;
          event_type: string | null;
          id: string;
          importance: number | null;
          location: string | null;
          metadata: Json | null;
          published: boolean | null;
          published_at: string | null;
          search_vector: unknown;
          slug: string;
          sort_order_end: number | null;
          sort_order_years: number | null;
          spatial_data: Json | null;
          summary: string | null;
          temporal_data: Json;
          timeline_id: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          computed_end_date?: string | null;
          computed_start_date?: string | null;
          created_at?: string | null;
          detail?: string | null;
          detail_timeline_id?: string | null;
          end_temporal_data?: Json | null;
          event_type?: string | null;
          id?: string;
          importance?: number | null;
          location?: string | null;
          metadata?: Json | null;
          published?: boolean | null;
          published_at?: string | null;
          search_vector?: unknown;
          slug: string;
          sort_order_end?: number | null;
          sort_order_years?: number | null;
          spatial_data?: Json | null;
          summary?: string | null;
          temporal_data?: Json;
          timeline_id?: string | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          computed_end_date?: string | null;
          computed_start_date?: string | null;
          created_at?: string | null;
          detail?: string | null;
          detail_timeline_id?: string | null;
          end_temporal_data?: Json | null;
          event_type?: string | null;
          id?: string;
          importance?: number | null;
          location?: string | null;
          metadata?: Json | null;
          published?: boolean | null;
          published_at?: string | null;
          search_vector?: unknown;
          slug?: string;
          sort_order_end?: number | null;
          sort_order_years?: number | null;
          spatial_data?: Json | null;
          summary?: string | null;
          temporal_data?: Json;
          timeline_id?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_detail_timeline_id_fkey";
            columns: ["detail_timeline_id"];
            isOneToOne: false;
            referencedRelation: "timelines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_timeline_id_fkey";
            columns: ["timeline_id"];
            isOneToOne: false;
            referencedRelation: "timelines";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          alt_text: string | null;
          caption: string | null;
          created_at: string | null;
          file_size_bytes: number | null;
          height: number | null;
          id: string;
          media_type: string | null;
          metadata: Json | null;
          mime_type: string | null;
          slug: string;
          source: string;
          storage_path: string | null;
          updated_at: string | null;
          url: string;
          user_id: string;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          file_size_bytes?: number | null;
          height?: number | null;
          id?: string;
          media_type?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          slug: string;
          source?: string;
          storage_path?: string | null;
          updated_at?: string | null;
          url: string;
          user_id: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          file_size_bytes?: number | null;
          height?: number | null;
          id?: string;
          media_type?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          slug?: string;
          source?: string;
          storage_path?: string | null;
          updated_at?: string | null;
          url?: string;
          user_id?: string;
          width?: number | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          read: boolean | null;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          read?: boolean | null;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          read?: boolean | null;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      period_timelines: {
        Row: {
          period_id: string;
          timeline_id: string;
        };
        Insert: {
          period_id: string;
          timeline_id: string;
        };
        Update: {
          period_id?: string;
          timeline_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "period_timelines_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "period_timelines_timeline_id_fkey";
            columns: ["timeline_id"];
            isOneToOne: false;
            referencedRelation: "timelines";
            referencedColumns: ["id"];
          },
        ];
      };
      periods: {
        Row: {
          characteristics: string[] | null;
          created_at: string | null;
          detail: string | null;
          end_temporal_data: Json | null;
          id: string;
          parent_period_id: string | null;
          published: boolean | null;
          published_at: string | null;
          significance: string | null;
          slug: string;
          sort_order_end: number | null;
          sort_order_start: number | null;
          summary: string | null;
          temporal_data: Json;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          characteristics?: string[] | null;
          created_at?: string | null;
          detail?: string | null;
          end_temporal_data?: Json | null;
          id?: string;
          parent_period_id?: string | null;
          published?: boolean | null;
          published_at?: string | null;
          significance?: string | null;
          slug: string;
          sort_order_end?: number | null;
          sort_order_start?: number | null;
          summary?: string | null;
          temporal_data?: Json;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          characteristics?: string[] | null;
          created_at?: string | null;
          detail?: string | null;
          end_temporal_data?: Json | null;
          id?: string;
          parent_period_id?: string | null;
          published?: boolean | null;
          published_at?: string | null;
          significance?: string | null;
          slug?: string;
          sort_order_end?: number | null;
          sort_order_start?: number | null;
          summary?: string | null;
          temporal_data?: Json;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "periods_parent_same_owner_fkey";
            columns: ["user_id", "parent_period_id"];
            isOneToOne: false;
            referencedRelation: "periods";
            referencedColumns: ["user_id", "id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          first_name: string;
          id: string;
          last_name: string;
          role: string | null;
          social_links: Json | null;
          updated_at: string | null;
          username: string | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          first_name: string;
          id: string;
          last_name: string;
          role?: string | null;
          social_links?: Json | null;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          role?: string | null;
          social_links?: Json | null;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      relationship_categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          is_active: boolean;
          key: string;
          label: string;
          sort_order: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          is_active?: boolean;
          key: string;
          label: string;
          sort_order?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          is_active?: boolean;
          key?: string;
          label?: string;
          sort_order?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      relationship_roles: {
        Row: {
          inverse_key: string | null;
          is_active: boolean;
          key: string;
          label: string;
          sort_order: number;
          type_key: string;
        };
        Insert: {
          inverse_key?: string | null;
          is_active?: boolean;
          key: string;
          label: string;
          sort_order?: number;
          type_key: string;
        };
        Update: {
          inverse_key?: string | null;
          is_active?: boolean;
          key?: string;
          label?: string;
          sort_order?: number;
          type_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "relationship_roles_inverse_key_fkey";
            columns: ["type_key", "inverse_key"];
            isOneToOne: false;
            referencedRelation: "relationship_roles";
            referencedColumns: ["type_key", "key"];
          },
          {
            foreignKeyName: "relationship_roles_type_key_fkey";
            columns: ["type_key"];
            isOneToOne: false;
            referencedRelation: "relationship_types";
            referencedColumns: ["key"];
          },
        ];
      };
      relationship_types: {
        Row: {
          category_key: string;
          created_at: string | null;
          description: string | null;
          direction_verb: string | null;
          inverse_key: string | null;
          is_active: boolean;
          is_symmetric: boolean;
          key: string;
          label: string;
          sort_order: number;
          symmetric_noun: string | null;
          updated_at: string | null;
        };
        Insert: {
          category_key: string;
          created_at?: string | null;
          description?: string | null;
          direction_verb?: string | null;
          inverse_key?: string | null;
          is_active?: boolean;
          is_symmetric?: boolean;
          key: string;
          label: string;
          sort_order?: number;
          symmetric_noun?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category_key?: string;
          created_at?: string | null;
          description?: string | null;
          direction_verb?: string | null;
          inverse_key?: string | null;
          is_active?: boolean;
          is_symmetric?: boolean;
          key?: string;
          label?: string;
          sort_order?: number;
          symmetric_noun?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "relationship_types_category_key_fkey";
            columns: ["category_key"];
            isOneToOne: false;
            referencedRelation: "relationship_categories";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "relationship_types_inverse_key_fkey";
            columns: ["inverse_key"];
            isOneToOne: false;
            referencedRelation: "relationship_types";
            referencedColumns: ["key"];
          },
        ];
      };
      stories: {
        Row: {
          created_at: string | null;
          detail: string | null;
          id: string;
          narrator_type: string | null;
          perspective_character_id: string | null;
          published: boolean | null;
          published_at: string | null;
          search_vector: unknown;
          slug: string;
          sub_title: string | null;
          summary: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          detail?: string | null;
          id?: string;
          narrator_type?: string | null;
          perspective_character_id?: string | null;
          published?: boolean | null;
          published_at?: string | null;
          search_vector?: unknown;
          slug: string;
          sub_title?: string | null;
          summary?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          detail?: string | null;
          id?: string;
          narrator_type?: string | null;
          perspective_character_id?: string | null;
          published?: boolean | null;
          published_at?: string | null;
          search_vector?: unknown;
          slug?: string;
          sub_title?: string | null;
          summary?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stories_perspective_character_id_fkey";
            columns: ["perspective_character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "stories_perspective_character_id_fkey";
            columns: ["perspective_character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["related_id"];
          },
          {
            foreignKeyName: "stories_perspective_character_id_fkey";
            columns: ["perspective_character_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "stories_perspective_character_id_fkey";
            columns: ["perspective_character_id"];
            isOneToOne: false;
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
        ];
      };
      story_characters: {
        Row: {
          character_id: string;
          role_in_story: string | null;
          story_id: string;
        };
        Insert: {
          character_id: string;
          role_in_story?: string | null;
          story_id: string;
        };
        Update: {
          character_id?: string;
          role_in_story?: string | null;
          story_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_characters_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "story_characters_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["related_id"];
          },
          {
            foreignKeyName: "story_characters_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "story_characters_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_characters_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      story_events: {
        Row: {
          event_id: string;
          sort_order: number | null;
          story_id: string;
        };
        Insert: {
          event_id: string;
          sort_order?: number | null;
          story_id: string;
        };
        Update: {
          event_id?: string;
          sort_order?: number | null;
          story_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_events_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "story_events_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "event_participants_view";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "story_events_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_events_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      story_periods: {
        Row: {
          period_id: string;
          story_id: string;
        };
        Insert: {
          period_id: string;
          story_id: string;
        };
        Update: {
          period_id?: string;
          story_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_periods_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_periods_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      timeline_collaborators: {
        Row: {
          created_at: string | null;
          role: string | null;
          timeline_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          role?: string | null;
          timeline_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          role?: string | null;
          timeline_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "timeline_collaborators_timeline_id_fkey";
            columns: ["timeline_id"];
            isOneToOne: false;
            referencedRelation: "timelines";
            referencedColumns: ["id"];
          },
        ];
      };
      timeline_events: {
        Row: {
          event_id: string;
          sort_order: number | null;
          timeline_id: string;
        };
        Insert: {
          event_id: string;
          sort_order?: number | null;
          timeline_id: string;
        };
        Update: {
          event_id?: string;
          sort_order?: number | null;
          timeline_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "timeline_events_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "timeline_events_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "event_participants_view";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "timeline_events_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timeline_events_timeline_id_fkey";
            columns: ["timeline_id"];
            isOneToOne: false;
            referencedRelation: "timelines";
            referencedColumns: ["id"];
          },
        ];
      };
      timeline_media: {
        Row: {
          media_id: string;
          sort_order: number | null;
          timeline_id: string;
        };
        Insert: {
          media_id: string;
          sort_order?: number | null;
          timeline_id: string;
        };
        Update: {
          media_id?: string;
          sort_order?: number | null;
          timeline_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "timeline_media_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timeline_media_timeline_id_fkey";
            columns: ["timeline_id"];
            isOneToOne: false;
            referencedRelation: "timelines";
            referencedColumns: ["id"];
          },
        ];
      };
      timelines: {
        Row: {
          created_at: string | null;
          detail: string | null;
          end_temporal_data: Json | null;
          fractal_depth: number | null;
          id: string;
          metadata: Json | null;
          published: boolean | null;
          published_at: string | null;
          scale: string | null;
          search_vector: unknown;
          slug: string;
          sort_order_end: number | null;
          sort_order_start: number | null;
          subject_character_id: string | null;
          summary: string | null;
          temporal_data: Json;
          timeline_type: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
          visibility: string | null;
        };
        Insert: {
          created_at?: string | null;
          detail?: string | null;
          end_temporal_data?: Json | null;
          fractal_depth?: number | null;
          id?: string;
          metadata?: Json | null;
          published?: boolean | null;
          published_at?: string | null;
          scale?: string | null;
          search_vector?: unknown;
          slug: string;
          sort_order_end?: number | null;
          sort_order_start?: number | null;
          subject_character_id?: string | null;
          summary?: string | null;
          temporal_data?: Json;
          timeline_type?: string | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
          visibility?: string | null;
        };
        Update: {
          created_at?: string | null;
          detail?: string | null;
          end_temporal_data?: Json | null;
          fractal_depth?: number | null;
          id?: string;
          metadata?: Json | null;
          published?: boolean | null;
          published_at?: string | null;
          scale?: string | null;
          search_vector?: unknown;
          slug?: string;
          sort_order_end?: number | null;
          sort_order_start?: number | null;
          subject_character_id?: string | null;
          summary?: string | null;
          temporal_data?: Json;
          timeline_type?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
          visibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "timelines_subject_character_id_fkey";
            columns: ["subject_character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "timelines_subject_character_id_fkey";
            columns: ["subject_character_id"];
            isOneToOne: false;
            referencedRelation: "character_network_view";
            referencedColumns: ["related_id"];
          },
          {
            foreignKeyName: "timelines_subject_character_id_fkey";
            columns: ["subject_character_id"];
            isOneToOne: false;
            referencedRelation: "character_timeline_view";
            referencedColumns: ["character_id"];
          },
          {
            foreignKeyName: "timelines_subject_character_id_fkey";
            columns: ["subject_character_id"];
            isOneToOne: false;
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      character_network_view: {
        Row: {
          character_id: string | null;
          character_name: string | null;
          description: string | null;
          end_temporal: Json | null;
          related_id: string | null;
          related_name: string | null;
          relationship_id: string | null;
          relationship_role: string | null;
          relationship_type: string | null;
          start_temporal: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "character_relationships_relationship_type_fkey";
            columns: ["relationship_type"];
            isOneToOne: false;
            referencedRelation: "relationship_types";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "character_relationships_role_fkey";
            columns: ["relationship_type", "relationship_role"];
            isOneToOne: false;
            referencedRelation: "relationship_roles";
            referencedColumns: ["type_key", "key"];
          },
        ];
      };
      character_timeline_view: {
        Row: {
          character_id: string | null;
          character_name: string | null;
          event_id: string | null;
          event_title: string | null;
          role: string | null;
          significance: string | null;
          sort_order_years: number | null;
          temporal_data: Json | null;
          timeline_title: string | null;
        };
        Relationships: [];
      };
      event_participants_view: {
        Row: {
          event_id: string | null;
          participant_count: number | null;
          participants: Json | null;
          sort_order_years: number | null;
          title: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      character_network: {
        Args: { p_character_id: string; p_depth?: number };
        Returns: {
          depth: number;
          rel_type: string;
          source_id: string;
          source_name: string;
          target_id: string;
          target_name: string;
        }[];
      };
      create_relationship_role: {
        Args: {
          p_inverse_key: string;
          p_is_active: boolean;
          p_key: string;
          p_label: string;
          p_sort_order: number;
          p_type_key: string;
        };
        Returns: {
          inverse_key: string | null;
          is_active: boolean;
          key: string;
          label: string;
          sort_order: number;
          type_key: string;
        };
        SetofOptions: {
          from: "*";
          to: "relationship_roles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_relationship_type: {
        Args: {
          p_category_key: string;
          p_description: string;
          p_direction_verb: string;
          p_inverse_key: string;
          p_is_active: boolean;
          p_is_symmetric: boolean;
          p_key: string;
          p_label: string;
          p_sort_order: number;
          p_symmetric_noun: string;
        };
        Returns: {
          category_key: string;
          created_at: string | null;
          description: string | null;
          direction_verb: string | null;
          inverse_key: string | null;
          is_active: boolean;
          is_symmetric: boolean;
          key: string;
          label: string;
          sort_order: number;
          symmetric_noun: string | null;
          updated_at: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "relationship_types";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      delete_category_reparenting_children: {
        Args: { p_category_id: string };
        Returns: undefined;
      };
      events_in_temporal_range: {
        Args: {
          p_end_years: number;
          p_start_years: number;
          p_timeline_id?: string;
        };
        Returns: {
          computed_end_date: string | null;
          computed_start_date: string | null;
          created_at: string | null;
          detail: string | null;
          detail_timeline_id: string | null;
          end_temporal_data: Json | null;
          event_type: string | null;
          id: string;
          importance: number | null;
          location: string | null;
          metadata: Json | null;
          published: boolean | null;
          published_at: string | null;
          search_vector: unknown;
          slug: string;
          sort_order_end: number | null;
          sort_order_years: number | null;
          spatial_data: Json | null;
          summary: string | null;
          temporal_data: Json;
          timeline_id: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "events";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      events_shared_by_characters: {
        Args: { p_character_ids: string[] };
        Returns: {
          computed_end_date: string | null;
          computed_start_date: string | null;
          created_at: string | null;
          detail: string | null;
          detail_timeline_id: string | null;
          end_temporal_data: Json | null;
          event_type: string | null;
          id: string;
          importance: number | null;
          location: string | null;
          metadata: Json | null;
          published: boolean | null;
          published_at: string | null;
          search_vector: unknown;
          slug: string;
          sort_order_end: number | null;
          sort_order_years: number | null;
          spatial_data: Json | null;
          summary: string | null;
          temporal_data: Json;
          timeline_id: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "events";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_user_metrics: {
        Args: { p_user_id: string };
        Returns: {
          count: number;
          entity_type: string;
        }[];
      };
      get_user_recent_counts: {
        Args: { p_user_id: string; p_window_days?: number };
        Returns: {
          count: number;
          entity_type: string;
        }[];
      };
      immutable_array_to_string: {
        Args: { arr: string[]; sep: string };
        Returns: string;
      };
      is_admin: { Args: never; Returns: boolean };
      is_story_readable: { Args: { s_id: string }; Returns: boolean };
      is_timeline_collab_editor: { Args: { t_id: string }; Returns: boolean };
      is_timeline_collaborator: { Args: { t_id: string }; Returns: boolean };
      is_timeline_owner: { Args: { t_id: string }; Returns: boolean };
      pair_relationship_role_inverse: {
        Args: { p_inverse_key: string; p_key: string; p_type_key: string };
        Returns: undefined;
      };
      pair_relationship_type_inverse: {
        Args: { p_inverse_key: string; p_key: string };
        Returns: undefined;
      };
      set_relationship_role: {
        Args: {
          p_inverse_key?: string;
          p_is_active?: boolean;
          p_key: string;
          p_label?: string;
          p_set_inverse_key?: boolean;
          p_sort_order?: number;
          p_type_key: string;
        };
        Returns: {
          inverse_key: string | null;
          is_active: boolean;
          key: string;
          label: string;
          sort_order: number;
          type_key: string;
        };
        SetofOptions: {
          from: "*";
          to: "relationship_roles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_relationship_type: {
        Args: {
          p_category_key?: string;
          p_description?: string;
          p_direction_verb?: string;
          p_inverse_key?: string;
          p_is_active?: boolean;
          p_is_symmetric?: boolean;
          p_key: string;
          p_label?: string;
          p_set_description?: boolean;
          p_set_symmetry?: boolean;
          p_sort_order?: number;
          p_symmetric_noun?: string;
        };
        Returns: {
          category_key: string;
          created_at: string | null;
          description: string | null;
          direction_verb: string | null;
          inverse_key: string | null;
          is_active: boolean;
          is_symmetric: boolean;
          key: string;
          label: string;
          sort_order: number;
          symmetric_noun: string | null;
          updated_at: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "relationship_types";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      story_has_collaborating_event: {
        Args: { s_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
