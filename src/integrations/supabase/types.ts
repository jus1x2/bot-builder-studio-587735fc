export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bot_action_nodes: {
        Row: {
          action_order: number | null
          action_type: string
          config: Json | null
          created_at: string
          id: string
          next_action_id: string | null
          position_x: number | null
          position_y: number | null
          project_id: string
        }
        Insert: {
          action_order?: number | null
          action_type: string
          config?: Json | null
          created_at?: string
          id?: string
          next_action_id?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id: string
        }
        Update: {
          action_order?: number | null
          action_type?: string
          config?: Json | null
          created_at?: string
          id?: string
          next_action_id?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_action_nodes_next_action_id_fkey"
            columns: ["next_action_id"]
            isOneToOne: false
            referencedRelation: "bot_action_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_action_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "bot_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_action_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "bot_projects_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_buttons: {
        Row: {
          actions: Json | null
          button_order: number | null
          created_at: string
          id: string
          label_position: Json | null
          menu_id: string
          row_index: number | null
          target_action_id: string | null
          target_menu_id: string | null
          text: string
        }
        Insert: {
          actions?: Json | null
          button_order?: number | null
          created_at?: string
          id?: string
          label_position?: Json | null
          menu_id: string
          row_index?: number | null
          target_action_id?: string | null
          target_menu_id?: string | null
          text: string
        }
        Update: {
          actions?: Json | null
          button_order?: number | null
          created_at?: string
          id?: string
          label_position?: Json | null
          menu_id?: string
          row_index?: number | null
          target_action_id?: string | null
          target_menu_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_buttons_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "bot_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_buttons_target_menu_id_fkey"
            columns: ["target_menu_id"]
            isOneToOne: false
            referencedRelation: "bot_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_menus: {
        Row: {
          created_at: string
          id: string
          message_text: string | null
          name: string
          position_x: number | null
          position_y: number | null
          project_id: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_text?: string | null
          name: string
          position_x?: number | null
          position_y?: number | null
          project_id: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_text?: string | null
          name?: string
          position_x?: number | null
          position_y?: number | null
          project_id?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_menus_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "bot_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_menus_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "bot_projects_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_projects: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json | null
          telegram_bot_token: string | null
          telegram_bot_username: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json | null
          telegram_bot_token?: string | null
          telegram_bot_username?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json | null
          telegram_bot_token?: string | null
          telegram_bot_username?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_user_sessions: {
        Row: {
          current_menu_id: string | null
          first_visit_at: string
          id: string
          last_activity_at: string
          points: number | null
          project_id: string
          telegram_user_id: string
          variables: Json | null
        }
        Insert: {
          current_menu_id?: string | null
          first_visit_at?: string
          id?: string
          last_activity_at?: string
          points?: number | null
          project_id: string
          telegram_user_id: string
          variables?: Json | null
        }
        Update: {
          current_menu_id?: string | null
          first_visit_at?: string
          id?: string
          last_activity_at?: string
          points?: number | null
          project_id?: string
          telegram_user_id?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_user_sessions_current_menu_id_fkey"
            columns: ["current_menu_id"]
            isOneToOne: false
            referencedRelation: "bot_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_user_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "bot_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_user_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "bot_projects_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          is_premium: boolean | null
          language_code: string | null
          last_activity_at: string
          last_name: string | null
          photo_url: string | null
          telegram_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_premium?: boolean | null
          language_code?: string | null
          last_activity_at?: string
          last_name?: string | null
          photo_url?: string | null
          telegram_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_premium?: boolean | null
          language_code?: string | null
          last_activity_at?: string
          last_name?: string | null
          photo_url?: string | null
          telegram_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      bot_projects_safe: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          settings: Json | null
          telegram_bot_token_masked: string | null
          telegram_bot_username: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          settings?: Json | null
          telegram_bot_token_masked?: never
          telegram_bot_username?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          settings?: Json | null
          telegram_bot_token_masked?: never
          telegram_bot_username?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
