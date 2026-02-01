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
      clients: {
        Row: {
          address: string | null
          color: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: number
          image: string | null
          last_name: string
          last_order: string | null
          phone: string | null
          total_orders: number | null
          total_spent: number | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          address?: string | null
          color?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: number
          image?: string | null
          last_name: string
          last_order?: string | null
          phone?: string | null
          total_orders?: number | null
          total_spent?: number | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          address?: string | null
          color?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: number
          image?: string | null
          last_name?: string
          last_order?: string | null
          phone?: string | null
          total_orders?: number | null
          total_spent?: number | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      discount_redemptions: {
        Row: {
          applied_at: string | null
          approval_status: string
          client_id: number | null
          discount_id: number | null
          discount_amount_applied: number
          id: number
          order_id: number | null
        }
        Insert: {
          applied_at?: string | null
          approval_status: string
          client_id?: number | null
          discount_id?: number | null
          discount_amount_applied: number
          id?: never
          order_id?: number | null
        }
        Update: {
          applied_at?: string | null
          approval_status?: string
          client_id?: number | null
          discount_id?: number | null
          discount_amount_applied?: number
          id?: never
          order_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          approval_strategy: string
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          duration_type: string
          end_date: string | null
          id: number
          name: string
          start_date: string | null
          status: string
        }
        Insert: {
          approval_strategy: string
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          duration_type: string
          end_date?: string | null
          id?: never
          name: string
          start_date?: string | null
          status: string
        }
        Update: {
          approval_strategy?: string
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          duration_type?: string
          end_date?: string | null
          id?: never
          name?: string
          start_date?: string | null
          status?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          id: number
          image: string | null
          maintenance: number
          name: string
          price: number
          replacement_cost: number
          stock: number
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          id?: number
          image?: string | null
          maintenance?: number
          name: string
          price?: number
          replacement_cost?: number
          stock?: number
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          id?: number
          image?: string | null
          maintenance?: number
          name?: string
          price?: number
          replacement_cost?: number
          stock?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          damaged_qty: number | null
          id: number
          inventory_id: number | null
          lost_qty: number | null
          order_id: number | null
          quantity: number
          returned_qty: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          damaged_qty?: number | null
          id?: number
          inventory_id?: number | null
          lost_qty?: number | null
          order_id?: number | null
          quantity?: number
          returned_qty?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          damaged_qty?: number | null
          id?: number
          inventory_id?: number | null
          lost_qty?: number | null
          order_id?: number | null
          quantity?: number
          returned_qty?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_paid: number | null
          client_id: number | null
          client_name: string | null
          closed_at: string | null
          created_at: string | null
          deposit_paid: boolean | null
          discount_name: string | null
          discount_type: string | null
          discount_value: number | null
          email: string | null
          end_date: string
          id: number
          item_integrity: string | null
          penalty_amount: number | null
          phone: string | null
          return_status: string | null
          start_date: string
          status: string
          total_amount: number
        }
        Insert: {
          amount_paid?: number | null
          client_id?: number | null
          client_name?: string | null
          closed_at?: string | null
          created_at?: string | null
          deposit_paid?: boolean | null
          discount_name?: string | null
          discount_type?: string | null
          discount_value?: number | null
          email?: string | null
          end_date: string
          id?: number
          item_integrity?: string | null
          penalty_amount?: number | null
          phone?: string | null
          return_status?: string | null
          start_date: string
          status?: string
          total_amount?: number
        }
        Update: {
          amount_paid?: number | null
          client_id?: number | null
          client_name?: string | null
          closed_at?: string | null
          created_at?: string | null
          deposit_paid?: boolean | null
          discount_name?: string | null
          discount_type?: string | null
          discount_value?: number | null
          email?: string | null
          end_date?: string
          id?: number
          item_integrity?: string | null
          penalty_amount?: number | null
          phone?: string | null
          return_status?: string | null
          start_date?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id: string
          role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_stock:
        | {
            Args: { check_end: string; check_start: string }
            Returns: {
              active_rentals: number
              available_stock: number
              item_id: number
              total_stock: number
            }[]
          }
        | {
            Args: { check_end: string; check_start: string; item_id: number }
            Returns: number
          }
      get_email_for_login: { Args: { login_input: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      process_order_return:
        | {
            Args: {
              p_amount_paid: number
              p_closed_at: string
              p_item_integrity: string
              p_items: Json
              p_order_id: number
              p_penalty_amount: number
              p_return_status: string
              p_status: string
              p_total_amount: number
            }
            Returns: undefined
          }
        | {
            Args: {
              p_amount_paid: number
              p_closed_at: string
              p_item_integrity: string
              p_items: Json
              p_order_id: number
              p_penalty_amount: number
              p_return_status: string
              p_status: string
              p_total_amount: number
            }
            Returns: undefined
          }
      search_orders: {
        Args: { p_filters?: Json; p_limit?: number; p_search_term?: string }
        Returns: {
          amount_paid: number
          client_id: number
          client_name: string
          closed_at: string
          deposit_paid: boolean
          discount_name: string
          discount_type: string
          discount_value: number
          email: string
          end_date: string
          id: number
          item_integrity: string
          penalty_amount: number
          phone: string
          return_status: string
          start_date: string
          status: string
          total_amount: number
        }[]
      }
      submit_order:
        | {
            Args: {
              p_client_id: number
              p_client_name: string
              p_email: string
              p_end_date: string
              p_items: Json
              p_order_id?: number
              p_phone: string
              p_start_date: string
              p_total_amount: number
            }
            Returns: number
          }
        | {
            Args: {
              p_client_id: number
              p_client_name: string
              p_email: string
              p_end_date: string
              p_items: Json
              p_order_id?: number
              p_phone: string
              p_start_date: string
              p_total_amount: number
            }
            Returns: number
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
