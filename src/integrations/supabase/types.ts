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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      child_profiles: {
        Row: {
          adult_id: string
          age_range: string
          created_at: string
          difficulty: string
          id: string
          nickname: string
        }
        Insert: {
          adult_id?: string
          age_range: string
          created_at?: string
          difficulty: string
          id?: string
          nickname: string
        }
        Update: {
          adult_id?: string
          age_range?: string
          created_at?: string
          difficulty?: string
          id?: string
          nickname?: string
        }
        Relationships: []
      }
      game_feedback: {
        Row: {
          child_id: string
          difficulty: string
          fun: string
          game_id: string
          hints_used: number
          id: string
          submitted_at: string
          was_replay: boolean
        }
        Insert: {
          child_id: string
          difficulty: string
          fun: string
          game_id: string
          hints_used?: number
          id?: string
          submitted_at?: string
          was_replay?: boolean
        }
        Update: {
          child_id?: string
          difficulty?: string
          fun?: string
          game_id?: string
          hints_used?: number
          id?: string
          submitted_at?: string
          was_replay?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "game_feedback_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_feedback_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_objectives: {
        Row: {
          game_id: string
          objective_code: string
        }
        Insert: {
          game_id: string
          objective_code: string
        }
        Update: {
          game_id?: string
          objective_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_objectives_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_objectives_objective_code_fkey"
            columns: ["objective_code"]
            isOneToOne: false
            referencedRelation: "learning_objectives"
            referencedColumns: ["code"]
          },
        ]
      }
      game_progress: {
        Row: {
          attempts: number
          child_id: string
          completed_at: string | null
          game_id: string
          id: string
          replays: number
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          child_id: string
          completed_at?: string | null
          game_id: string
          id?: string
          replays?: number
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          child_id?: string
          completed_at?: string | null
          game_id?: string
          id?: string
          replays?: number
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_progress_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          adult_guide: Json
          base_difficulty: number
          config: Json
          hints: Json
          id: string
          instructions: string
          kind: string
          level_position: number
          position: number
          title: string
        }
        Insert: {
          adult_guide: Json
          base_difficulty?: number
          config: Json
          hints?: Json
          id: string
          instructions: string
          kind: string
          level_position: number
          position: number
          title: string
        }
        Update: {
          adult_guide?: Json
          base_difficulty?: number
          config?: Json
          hints?: Json
          id?: string
          instructions?: string
          kind?: string
          level_position?: number
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_level_position_fkey"
            columns: ["level_position"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["position"]
          },
        ]
      }
      learning_objectives: {
        Row: {
          code: string
          description: string
          title: string
        }
        Insert: {
          code: string
          description: string
          title: string
        }
        Update: {
          code?: string
          description?: string
          title?: string
        }
        Relationships: []
      }
      levels: {
        Row: {
          accent: string
          concept: string
          description: string
          position: number
          title: string
          upgrade: string
        }
        Insert: {
          accent?: string
          concept: string
          description: string
          position: number
          title: string
          upgrade?: string
        }
        Update: {
          accent?: string
          concept?: string
          description?: string
          position?: number
          title?: string
          upgrade?: string
        }
        Relationships: []
      }
      reward_plans: {
        Row: {
          booster_cents: number
          budget_cents: number
          child_id: string
          confirmed_at: string
          id: string
          per_game_cents: number
          updated_at: string
        }
        Insert: {
          booster_cents: number
          budget_cents: number
          child_id: string
          confirmed_at?: string
          id?: string
          per_game_cents: number
          updated_at?: string
        }
        Update: {
          booster_cents?: number
          budget_cents?: number
          child_id?: string
          confirmed_at?: string
          id?: string
          per_game_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_plans_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          child_id: string
          created_at: string
          id: string
          name: string
          redeem_date: string
          redeemed_at: string | null
          target_cents: number
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          name: string
          redeem_date: string
          redeemed_at?: string | null
          target_cents: number
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          name?: string
          redeem_date?: string
          redeemed_at?: string | null
          target_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount_cents: number
          child_id: string
          created_at: string
          game_id: string | null
          goal_id: string | null
          id: string
          kind: string
          level_position: number | null
          plan_id: string | null
        }
        Insert: {
          amount_cents: number
          child_id: string
          created_at?: string
          game_id?: string | null
          goal_id?: string | null
          id?: string
          kind: string
          level_position?: number | null
          plan_id?: string | null
        }
        Update: {
          amount_cents?: number
          child_id?: string
          created_at?: string
          game_id?: string | null
          goal_id?: string | null
          id?: string
          kind?: string
          level_position?: number | null
          plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_level_position_fkey"
            columns: ["level_position"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["position"]
          },
          {
            foreignKeyName: "wallet_transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reward_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _assert_own_child: { Args: { _child_id: string }; Returns: undefined }
      record_game_attempt: {
        Args: { _child_id: string; _game_id: string; _success: boolean }
        Returns: Json
      }
      redeem_goal: { Args: { _child_id: string }; Returns: Json }
      save_reward_plan: {
        Args: {
          _booster_cents: number
          _budget_cents: number
          _child_id: string
          _goal_name: string
          _goal_target_cents: number
          _per_game_cents: number
          _redeem_date: string
        }
        Returns: Json
      }
      submit_game_feedback: {
        Args: {
          _child_id: string
          _difficulty: string
          _fun: string
          _game_id: string
          _hints_used: number
        }
        Returns: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
