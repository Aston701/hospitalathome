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
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown | null
          timestamp: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown | null
          timestamp?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_events: {
        Row: {
          created_at: string
          created_by: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          notes: string | null
          timestamp: string
          type: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          notes?: string | null
          timestamp?: string
          type: string
          visit_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          notes?: string | null
          timestamp?: string
          type?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_boxes: {
        Row: {
          assigned_to_user_id: string | null
          components: Json | null
          created_at: string
          id: string
          label: string
          org_id: string
          status: string | null
          tablet_serial: string | null
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          components?: Json | null
          created_at?: string
          id?: string
          label: string
          org_id?: string
          status?: string | null
          tablet_serial?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          components?: Json | null
          created_at?: string
          id?: string
          label?: string
          org_id?: string
          status?: string | null
          tablet_serial?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_boxes_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          allergies: string[] | null
          city: string | null
          conditions: string[] | null
          consent_signed: boolean
          consent_timestamp: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          geo_lat: number | null
          geo_lng: number | null
          id: string
          last_name: string
          medical_aid_number: string | null
          medical_aid_plan: string | null
          medical_aid_provider: string | null
          notes: string | null
          org_id: string
          phone: string
          postal_code: string | null
          privacy_preferences: Json | null
          province: string | null
          sa_id_number: string | null
          suburb: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          city?: string | null
          conditions?: string[] | null
          consent_signed?: boolean
          consent_timestamp?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          last_name: string
          medical_aid_number?: string | null
          medical_aid_plan?: string | null
          medical_aid_provider?: string | null
          notes?: string | null
          org_id?: string
          phone: string
          postal_code?: string | null
          privacy_preferences?: Json | null
          province?: string | null
          sa_id_number?: string | null
          suburb?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          city?: string | null
          conditions?: string[] | null
          consent_signed?: boolean
          consent_timestamp?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          last_name?: string
          medical_aid_number?: string | null
          medical_aid_plan?: string | null
          medical_aid_provider?: string | null
          notes?: string | null
          org_id?: string
          phone?: string
          postal_code?: string | null
          privacy_preferences?: Json | null
          province?: string | null
          sa_id_number?: string | null
          suburb?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          items: Json
          pdf_url: string | null
          signature_ip: string | null
          signature_name: string | null
          signature_timestamp: string | null
          status: Database["public"]["Enums"]["prescription_status"]
          updated_at: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          items?: Json
          pdf_url?: string | null
          signature_ip?: string | null
          signature_name?: string | null
          signature_timestamp?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
          visit_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          items?: Json
          pdf_url?: string | null
          signature_ip?: string | null
          signature_name?: string | null
          signature_timestamp?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          mfa_enabled: boolean
          org_id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          mfa_enabled?: boolean
          org_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          mfa_enabled?: boolean
          org_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          id: string
          linked_patient_id: string | null
          org_id: string
          priority: Database["public"]["Enums"]["priority_level"]
          reason_for_visit: string
          source: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          linked_patient_id?: string | null
          org_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          reason_for_visit: string
          source?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          linked_patient_id?: string | null
          org_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          reason_for_visit?: string
          source?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_linked_patient_id_fkey"
            columns: ["linked_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          org_id: string
          shift_end: string
          shift_start: string
          shift_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          shift_end: string
          shift_start: string
          shift_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          shift_end?: string
          shift_start?: string
          shift_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telehealth_sessions: {
        Row: {
          artifacts: Json | null
          created_at: string
          ended_at: string | null
          id: string
          join_url: string | null
          recording_enabled: boolean
          started_at: string | null
          teams_meeting_id: string | null
          transcription_enabled: boolean
          updated_at: string
          visit_id: string
        }
        Insert: {
          artifacts?: Json | null
          created_at?: string
          ended_at?: string | null
          id?: string
          join_url?: string | null
          recording_enabled?: boolean
          started_at?: string | null
          teams_meeting_id?: string | null
          transcription_enabled?: boolean
          updated_at?: string
          visit_id: string
        }
        Update: {
          artifacts?: Json | null
          created_at?: string
          ended_at?: string | null
          id?: string
          join_url?: string | null
          recording_enabled?: boolean
          started_at?: string | null
          teams_meeting_id?: string | null
          transcription_enabled?: boolean
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telehealth_sessions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_data: Json | null
          event_type: string
          id: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          visit_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          billing_codes: string[] | null
          checklist: Json | null
          created_at: string
          created_by: string | null
          dispatch_reference: string | null
          doctor_id: string | null
          id: string
          location_snapshot: Json | null
          medical_box_id: string | null
          notes: string | null
          nurse_id: string | null
          org_id: string
          outcome: string | null
          patient_id: string
          scheduled_end: string
          scheduled_start: string
          status: Database["public"]["Enums"]["visit_status"]
          teams_meeting_url: string | null
          transcription: string | null
          updated_at: string
        }
        Insert: {
          billing_codes?: string[] | null
          checklist?: Json | null
          created_at?: string
          created_by?: string | null
          dispatch_reference?: string | null
          doctor_id?: string | null
          id?: string
          location_snapshot?: Json | null
          medical_box_id?: string | null
          notes?: string | null
          nurse_id?: string | null
          org_id?: string
          outcome?: string | null
          patient_id: string
          scheduled_end: string
          scheduled_start: string
          status?: Database["public"]["Enums"]["visit_status"]
          teams_meeting_url?: string | null
          transcription?: string | null
          updated_at?: string
        }
        Update: {
          billing_codes?: string[] | null
          checklist?: Json | null
          created_at?: string
          created_by?: string | null
          dispatch_reference?: string | null
          doctor_id?: string | null
          id?: string
          location_snapshot?: Json | null
          medical_box_id?: string | null
          notes?: string | null
          nurse_id?: string | null
          org_id?: string
          outcome?: string | null
          patient_id?: string
          scheduled_end?: string
          scheduled_start?: string
          status?: Database["public"]["Enums"]["visit_status"]
          teams_meeting_url?: string | null
          transcription?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_medical_box_id_fkey"
            columns: ["medical_box_id"]
            isOneToOne: false
            referencedRelation: "medical_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      vitals_readings: {
        Row: {
          captured_by_user_id: string | null
          created_at: string
          id: string
          raw_payload: Json | null
          timestamp: string
          type: string
          unit: string | null
          value_number: number | null
          visit_id: string
        }
        Insert: {
          captured_by_user_id?: string | null
          created_at?: string
          id?: string
          raw_payload?: Json | null
          timestamp?: string
          type: string
          unit?: string | null
          value_number?: number | null
          visit_id: string
        }
        Update: {
          captured_by_user_id?: string | null
          created_at?: string
          id?: string
          raw_payload?: Json | null
          timestamp?: string
          type?: string
          unit?: string | null
          value_number?: number | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vitals_readings_captured_by_user_id_fkey"
            columns: ["captured_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitals_readings_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      app_role: "control_room" | "nurse" | "doctor" | "admin"
      prescription_status:
        | "draft"
        | "signed"
        | "sent_to_patient"
        | "sent_to_pharmacy"
      priority_level: "routine" | "urgent" | "emergency"
      request_status: "new" | "converted" | "cancelled"
      visit_status:
        | "scheduled"
        | "assigned"
        | "en_route"
        | "on_site"
        | "in_telemed"
        | "complete"
        | "cancelled"
        | "no_show"
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
      app_role: ["control_room", "nurse", "doctor", "admin"],
      prescription_status: [
        "draft",
        "signed",
        "sent_to_patient",
        "sent_to_pharmacy",
      ],
      priority_level: ["routine", "urgent", "emergency"],
      request_status: ["new", "converted", "cancelled"],
      visit_status: [
        "scheduled",
        "assigned",
        "en_route",
        "on_site",
        "in_telemed",
        "complete",
        "cancelled",
        "no_show",
      ],
    },
  },
} as const
