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
          action_type: string
          config: Json | null
          created_at: string
          id: string
          next_node_id: string | null
          next_node_type: string | null
          position_x: number | null
          position_y: number | null
          project_id: string
          updated_at: string
        }
        Insert: {
          action_type: string
          config?: Json | null
          created_at?: string
          id?: string
          next_node_id?: string | null
          next_node_type?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          config?: Json | null
          created_at?: string
          id?: string
          next_node_id?: string | null
          next_node_type?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_action_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "bot_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_buttons: {
        Row: {
          actions: Json | null
          button_order: number
          created_at: string
          id: string
          label_position: number | null
          menu_id: string
          row_index: number
          target_action_id: string | null
          target_menu_id: string | null
          text: string
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          button_order?: number
          created_at?: string
          id?: string
          label_position?: number | null
          menu_id: string
          row_index?: number
          target_action_id?: string | null
          target_menu_id?: string | null
          text?: string
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          button_order?: number
          created_at?: string
          id?: string
          label_position?: number | null
          menu_id?: string
          row_index?: number
          target_action_id?: string | null
          target_menu_id?: string | null
          text?: string
          updated_at?: string
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
          description: string | null
          id: string
          keyword_triggers: string[] | null
          menu_order: number | null
          message_text: string
          name: string
          parent_id: string | null
          position_x: number | null
          position_y: number | null
          project_id: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          keyword_triggers?: string[] | null
          menu_order?: number | null
          message_text?: string
          name: string
          parent_id?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          keyword_triggers?: string[] | null
          menu_order?: number | null
          message_text?: string
          name?: string
          parent_id?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_menus_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "bot_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_menus_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "bot_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_projects: {
        Row: {
          created_at: string
          description: string | null
          global_settings: Json | null
          id: string
          name: string
          profile_id: string
          root_menu_id: string | null
          status: string
          telegram_bot_token: string | null
          telegram_bot_username: string | null
          template: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          global_settings?: Json | null
          id?: string
          name: string
          profile_id: string
          root_menu_id?: string | null
          status?: string
          telegram_bot_token?: string | null
          telegram_bot_username?: string | null
          template?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          global_settings?: Json | null
          id?: string
          name?: string
          profile_id?: string
          root_menu_id?: string | null
          status?: string
          telegram_bot_token?: string | null
          telegram_bot_username?: string | null
          template?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_projects_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_user_sessions: {
        Row: {
          cart_data: Json | null
          created_at: string
          current_menu_id: string | null
          id: string
          project_id: string
          session_data: Json | null
          tags: string[] | null
          telegram_user_id: string
          updated_at: string
          user_fields: Json | null
        }
        Insert: {
          cart_data?: Json | null
          created_at?: string
          current_menu_id?: string | null
          id?: string
          project_id: string
          session_data?: Json | null
          tags?: string[] | null
          telegram_user_id: string
          updated_at?: string
          user_fields?: Json | null
        }
        Update: {
          cart_data?: Json | null
          created_at?: string
          current_menu_id?: string | null
          id?: string
          project_id?: string
          session_data?: Json | null
          tags?: string[] | null
          telegram_user_id?: string
          updated_at?: string
          user_fields?: Json | null
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
