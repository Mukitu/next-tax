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
      officer_activity_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["officer_activity_type"]
          created_at: string
          description: string | null
          id: string
          metadata: Json
          officer_id: string
          target_user_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["officer_activity_type"]
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          officer_id: string
          target_user_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["officer_activity_type"]
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          officer_id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          location: string | null
          office_location: string | null
          office_type: string | null
          officer_id: string | null
          phone: string | null
          tin_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          location?: string | null
          office_location?: string | null
          office_type?: string | null
          officer_id?: string | null
          phone?: string | null
          tin_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          office_location?: string | null
          office_type?: string | null
          officer_id?: string | null
          phone?: string | null
          tin_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tax_calculations: {
        Row: {
          calculated_tax: number
          calculation_data: Json
          created_at: string
          fiscal_year: string
          id: string
          officer_id: string | null
          taxable_income: number
          total_expense: number
          total_income: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_tax?: number
          calculation_data?: Json
          created_at?: string
          fiscal_year: string
          id?: string
          officer_id?: string | null
          taxable_income?: number
          total_expense?: number
          total_income?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_tax?: number
          calculation_data?: Json
          created_at?: string
          fiscal_year?: string
          id?: string
          officer_id?: string | null
          taxable_income?: number
          total_expense?: number
          total_income?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_requests: {
        Row: {
          calculated_tax: number
          calculation_data: Json
          citizen_id: string
          created_at: string
          fiscal_year: string
          id: string
          officer_id: string | null
          officer_note: string | null
          status: Database["public"]["Enums"]["tax_request_status"]
          taxable_income: number
          total_expense: number
          total_income: number
          updated_at: string
        }
        Insert: {
          calculated_tax?: number
          calculation_data?: Json
          citizen_id: string
          created_at?: string
          fiscal_year: string
          id?: string
          officer_id?: string | null
          officer_note?: string | null
          status?: Database["public"]["Enums"]["tax_request_status"]
          taxable_income?: number
          total_expense?: number
          total_income?: number
          updated_at?: string
        }
        Update: {
          calculated_tax?: number
          calculation_data?: Json
          citizen_id?: string
          created_at?: string
          fiscal_year?: string
          id?: string
          officer_id?: string | null
          officer_note?: string | null
          status?: Database["public"]["Enums"]["tax_request_status"]
          taxable_income?: number
          total_expense?: number
          total_income?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_officer_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "citizen" | "officer" | "admin"
      officer_activity_type:
        | "TIN_SEARCH"
        | "OFFICER_CALC_CREATE"
        | "REQUEST_APPROVED"
        | "REQUEST_REJECTED"
      tax_request_status: "draft" | "submitted" | "approved" | "rejected"
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
    Enums: {
      app_role: ["citizen", "officer", "admin"],
      officer_activity_type: [
        "TIN_SEARCH",
        "OFFICER_CALC_CREATE",
        "REQUEST_APPROVED",
        "REQUEST_REJECTED",
      ],
      tax_request_status: ["draft", "submitted", "approved", "rejected"],
    },
  },
} as const
