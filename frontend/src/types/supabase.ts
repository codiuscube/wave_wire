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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alert_schedules: {
        Row: {
          active_days: string[] | null
          check_time: string | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_days?: string[] | null
          check_time?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_days?: string[] | null
          check_time?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_settings: {
        Row: {
          id: string
          user_id: string
          window_mode: 'solar' | 'clock' | 'always'
          window_start_time: string | null
          window_end_time: string | null
          active_days: string[] | null
          forecast_alerts_enabled: boolean | null
          two_day_forecast_enabled: boolean | null
          five_day_forecast_enabled: boolean | null
          live_alerts_enabled: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          window_mode?: 'solar' | 'clock' | 'always'
          window_start_time?: string | null
          window_end_time?: string | null
          active_days?: string[] | null
          forecast_alerts_enabled?: boolean | null
          two_day_forecast_enabled?: boolean | null
          five_day_forecast_enabled?: boolean | null
          live_alerts_enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          window_mode?: 'solar' | 'clock' | 'always'
          window_start_time?: string | null
          window_end_time?: string | null
          active_days?: string[] | null
          forecast_alerts_enabled?: boolean | null
          two_day_forecast_enabled?: boolean | null
          five_day_forecast_enabled?: boolean | null
          live_alerts_enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          home_address: string | null
          id: string
          is_admin: boolean | null
          onboarding_completed: boolean | null
          phone: string | null
          phone_verified: boolean | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          home_address?: string | null
          id: string
          is_admin?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          home_address?: string | null
          id?: string
          is_admin?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiet_hours: {
        Row: {
          enabled: boolean | null
          end_time: string | null
          id: string
          start_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          enabled?: boolean | null
          end_time?: string | null
          id?: string
          start_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          enabled?: boolean | null
          end_time?: string | null
          id?: string
          start_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiet_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiet_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_alerts: {
        Row: {
          alert_type: string | null
          condition_matched: string | null
          created_at: string | null
          delivery_channel: string | null
          delivery_status: string | null
          id: string
          message_content: string | null
          sent_at: string | null
          spot_id: string | null
          trigger_id: string | null
          user_id: string
        }
        Insert: {
          alert_type?: string | null
          condition_matched?: string | null
          created_at?: string | null
          delivery_channel?: string | null
          delivery_status?: string | null
          id?: string
          message_content?: string | null
          sent_at?: string | null
          spot_id?: string | null
          trigger_id?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string | null
          condition_matched?: string | null
          created_at?: string | null
          delivery_channel?: string | null
          delivery_status?: string | null
          id?: string
          message_content?: string | null
          sent_at?: string | null
          spot_id?: string | null
          trigger_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_alerts_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "user_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_alerts_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "triggers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_usage: {
        Row: {
          id: string
          sms_count: number | null
          user_id: string
          year_month: string
        }
        Insert: {
          id?: string
          sms_count?: number | null
          user_id: string
          year_month: string
        }
        Update: {
          id?: string
          sms_count?: number | null
          user_id?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      surf_spots: {
        Row: {
          buoy_id: string | null
          buoy_name: string | null
          country: string | null
          country_group: string
          created_at: string | null
          id: string
          lat: number
          locals_knowledge: Json | null
          lon: number
          name: string
          region: string
          source: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          buoy_id?: string | null
          buoy_name?: string | null
          country?: string | null
          country_group: string
          created_at?: string | null
          id: string
          lat: number
          locals_knowledge?: Json | null
          lon: number
          name: string
          region: string
          source?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          buoy_id?: string | null
          buoy_name?: string | null
          country?: string | null
          country_group?: string
          created_at?: string | null
          id?: string
          lat?: number
          locals_knowledge?: Json | null
          lon?: number
          name?: string
          region?: string
          source?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      triggers: {
        Row: {
          condition: string | null
          created_at: string | null
          emoji: string | null
          id: string
          max_height: number | null
          max_period: number | null
          max_swell_direction: number | null
          max_tide_height: number | null
          max_wind_direction: number | null
          max_wind_speed: number | null
          message_template: string | null
          min_height: number | null
          min_period: number | null
          min_swell_direction: number | null
          min_tide_height: number | null
          min_wind_direction: number | null
          min_wind_speed: number | null
          name: string
          notification_style: string | null
          priority: number | null
          spot_id: string
          tide_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          max_height?: number | null
          max_period?: number | null
          max_swell_direction?: number | null
          max_tide_height?: number | null
          max_wind_direction?: number | null
          max_wind_speed?: number | null
          message_template?: string | null
          min_height?: number | null
          min_period?: number | null
          min_swell_direction?: number | null
          min_tide_height?: number | null
          min_wind_direction?: number | null
          min_wind_speed?: number | null
          name: string
          notification_style?: string | null
          priority?: number | null
          spot_id: string
          tide_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          max_height?: number | null
          max_period?: number | null
          max_swell_direction?: number | null
          max_tide_height?: number | null
          max_wind_direction?: number | null
          max_wind_speed?: number | null
          message_template?: string | null
          min_height?: number | null
          min_period?: number | null
          min_swell_direction?: number | null
          min_tide_height?: number | null
          min_wind_direction?: number | null
          min_wind_speed?: number | null
          name?: string
          notification_style?: string | null
          priority?: number | null
          spot_id?: string
          tide_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "triggers_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "user_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triggers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triggers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          ai_personality: string | null
          id: string
          include_buoy_data: boolean | null
          include_emoji: boolean | null
          include_traffic: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_personality?: string | null
          id?: string
          include_buoy_data?: boolean | null
          include_emoji?: boolean | null
          include_traffic?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_personality?: string | null
          id?: string
          include_buoy_data?: boolean | null
          include_emoji?: boolean | null
          include_traffic?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_spots: {
        Row: {
          buoy_id: string | null
          created_at: string | null
          hidden_on_dashboard: boolean | null
          icon: string | null
          id: string
          latitude: number | null
          longitude: number | null
          master_spot_id: string | null
          name: string
          region: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          buoy_id?: string | null
          created_at?: string | null
          hidden_on_dashboard?: boolean | null
          icon?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          master_spot_id?: string | null
          name: string
          region?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          buoy_id?: string | null
          created_at?: string | null
          hidden_on_dashboard?: boolean | null
          icon?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          master_spot_id?: string | null
          name?: string
          region?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_spots_master_spot_id_fkey"
            columns: ["master_spot_id"]
            isOneToOne: false
            referencedRelation: "surf_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_spots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_spots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_user_stats: {
        Row: {
          alerts_sent: number | null
          created_at: string | null
          email: string | null
          home_address: string | null
          id: string | null
          is_admin: boolean | null
          last_activity: string | null
          onboarding_completed: boolean | null
          phone: string | null
          phone_verified: boolean | null
          spots_count: number | null
          subscription_tier: string | null
          triggers_count: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
