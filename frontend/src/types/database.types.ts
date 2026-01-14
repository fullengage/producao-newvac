// Tipos gerados a partir do schema do Supabase
// Execute: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          razao_social: string | null
          nome_fantasia: string | null
          cnpj: string | null
          cpf: string | null
          email: string | null
          phone: string | null
          cep: string | null
          endereco: string | null
          cidade: string | null
          estado: string | null
          bairro: string | null
          team: string | null
          representatives: string | null
          credit_limit: number | null
          credit_status: string | null
          curve_class: string | null
          is_active: boolean | null
          observations: string | null
          user_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          razao_social?: string | null
          nome_fantasia?: string | null
          cnpj?: string | null
          cpf?: string | null
          email?: string | null
          phone?: string | null
          cep?: string | null
          endereco?: string | null
          cidade?: string | null
          estado?: string | null
          bairro?: string | null
          team?: string | null
          representatives?: string | null
          credit_limit?: number | null
          credit_status?: string | null
          curve_class?: string | null
          is_active?: boolean | null
          observations?: string | null
          user_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          razao_social?: string | null
          nome_fantasia?: string | null
          cnpj?: string | null
          cpf?: string | null
          email?: string | null
          phone?: string | null
          cep?: string | null
          endereco?: string | null
          cidade?: string | null
          estado?: string | null
          bairro?: string | null
          team?: string | null
          representatives?: string | null
          credit_limit?: number | null
          credit_status?: string | null
          curve_class?: string | null
          is_active?: boolean | null
          observations?: string | null
          user_id?: string | null
          created_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          codigo: string
          numero_pedido: string | null
          client_id: string | null
          user_id: string | null
          vendedor: string | null
          data_emissao: string
          data_entrega: string | null
          valor: number | null
          ipi: number | null
          status: string | null
          situacao: string | null
          expedido: boolean | null
          numero_nf: string | null
          bloqueado: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          codigo: string
          numero_pedido?: string | null
          client_id?: string | null
          user_id?: string | null
          vendedor?: string | null
          data_emissao: string
          data_entrega?: string | null
          valor?: number | null
          ipi?: number | null
          status?: string | null
          situacao?: string | null
          expedido?: boolean | null
          numero_nf?: string | null
          bloqueado?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          codigo?: string
          numero_pedido?: string | null
          client_id?: string | null
          user_id?: string | null
          vendedor?: string | null
          data_emissao?: string
          data_entrega?: string | null
          valor?: number | null
          ipi?: number | null
          status?: string | null
          situacao?: string | null
          expedido?: boolean | null
          numero_nf?: string | null
          bloqueado?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          item_numero: number
          codigo_produto: string | null
          codigo_fabricante: string | null
          descricao: string | null
          valor_unitario: number | null
          quantidade: number | null
          unidade: string | null
          desconto: number | null
          valor_total: number | null
          data_entrega: string | null
          situacao: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          item_numero: number
          codigo_produto?: string | null
          codigo_fabricante?: string | null
          descricao?: string | null
          valor_unitario?: number | null
          quantidade?: number | null
          unidade?: string | null
          desconto?: number | null
          valor_total?: number | null
          data_entrega?: string | null
          situacao?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          item_numero?: number
          codigo_produto?: string | null
          codigo_fabricante?: string | null
          descricao?: string | null
          valor_unitario?: number | null
          quantidade?: number | null
          unidade?: string | null
          desconto?: number | null
          valor_total?: number | null
          data_entrega?: string | null
          situacao?: string | null
          created_at?: string | null
        }
      }
      order_workflow: {
        Row: {
          id: string
          order_id: string | null
          email_received_at: string | null
          order_issued_at: string | null
          op_issued_at: string | null
          delivery_date: string | null
          days_to_delivery: number | null
          item_description: string | null
          quantity: number | null
          meters: number | null
          total_weight: number | null
          liliane_approved: boolean | null
          liliane_approved_at: string | null
          liliane_notes: string | null
          biani_approved: boolean | null
          biani_approved_at: string | null
          biani_notes: string | null
          descended_at: string | null
          seller_id: string | null
          seller_name: string | null
          value: number | null
          payment_terms: string | null
          status: string | null
          cancellation_reason: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          email_received_at?: string | null
          order_issued_at?: string | null
          op_issued_at?: string | null
          delivery_date?: string | null
          days_to_delivery?: number | null
          item_description?: string | null
          quantity?: number | null
          meters?: number | null
          total_weight?: number | null
          liliane_approved?: boolean | null
          liliane_approved_at?: string | null
          liliane_notes?: string | null
          biani_approved?: boolean | null
          biani_approved_at?: string | null
          biani_notes?: string | null
          descended_at?: string | null
          seller_id?: string | null
          seller_name?: string | null
          value?: number | null
          payment_terms?: string | null
          status?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          email_received_at?: string | null
          order_issued_at?: string | null
          op_issued_at?: string | null
          delivery_date?: string | null
          days_to_delivery?: number | null
          item_description?: string | null
          quantity?: number | null
          meters?: number | null
          total_weight?: number | null
          liliane_approved?: boolean | null
          liliane_approved_at?: string | null
          liliane_notes?: string | null
          biani_approved?: boolean | null
          biani_approved_at?: string | null
          biani_notes?: string | null
          descended_at?: string | null
          seller_id?: string | null
          seller_name?: string | null
          value?: number | null
          payment_terms?: string | null
          status?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      production_orders: {
        Row: {
          id: string
          order_number: string
          product_name: string
          product_code: string | null
          quantity: number
          unit: string | null
          client_name: string | null
          batch_number: string | null
          priority: string | null
          status: string | null
          planned_start_date: string | null
          planned_end_date: string | null
          actual_start_date: string | null
          actual_end_date: string | null
          due_date: string | null
          completion_date: string | null
          notes: string | null
          user_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_number: string
          product_name: string
          product_code?: string | null
          quantity: number
          unit?: string | null
          client_name?: string | null
          batch_number?: string | null
          priority?: string | null
          status?: string | null
          planned_start_date?: string | null
          planned_end_date?: string | null
          actual_start_date?: string | null
          actual_end_date?: string | null
          due_date?: string | null
          completion_date?: string | null
          notes?: string | null
          user_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_number?: string
          product_name?: string
          product_code?: string | null
          quantity?: number
          unit?: string | null
          client_name?: string | null
          batch_number?: string | null
          priority?: string | null
          status?: string | null
          planned_start_date?: string | null
          planned_end_date?: string | null
          actual_start_date?: string | null
          actual_end_date?: string | null
          due_date?: string | null
          completion_date?: string | null
          notes?: string | null
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          product_line: string | null
          category: string | null
          unit: string
          base_price: number | null
          cost_price: number | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id: string
          code: string
          name: string
          description?: string | null
          product_line?: string | null
          category?: string | null
          unit: string
          base_price?: number | null
          cost_price?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          product_line?: string | null
          category?: string | null
          unit?: string
          base_price?: number | null
          cost_price?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          report_id: string | null
          seller_id: string | null
          nome_equipe: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          report_id?: string | null
          seller_id?: string | null
          nome_equipe?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          report_id?: string | null
          seller_id?: string | null
          nome_equipe?: string | null
          created_at?: string | null
        }
      }
    }
    Views: {
      vw_pedidos_resumo_diario: {
        Row: {
          data: string | null
          total_pedidos: number | null
          valor_total: number | null
          clientes_unicos: number | null
          vendedores_ativos: number | null
          ticket_medio: number | null
        }
      }
      vw_ops_kanban_detalhado: {
        Row: {
          id: string | null
          order_number: string | null
          product_name: string | null
          product_code: string | null
          quantity: number | null
          unit: string | null
          client_name: string | null
          priority: string | null
          status: string | null
          due_date: string | null
          dias_atraso: number | null
          lead_time_dias: number | null
        }
      }
      vw_dashboard_kpis: {
        Row: {
          pedidos_hoje: number | null
          pedidos_mes: number | null
          valor_pedidos_mes: number | null
          pendentes_liliane: number | null
          pendentes_biani: number | null
          ops_planejadas: number | null
          ops_em_producao: number | null
          ops_concluidas_mes: number | null
          clientes_ativos: number | null
          clientes_novos_30d: number | null
        }
      }
    }
    Functions: {
      approve_liliane: {
        Args: {
          p_order_id: string
          p_notes?: string
        }
        Returns: Json
      }
      reject_liliane: {
        Args: {
          p_order_id: string
          p_notes: string
        }
        Returns: Json
      }
      approve_biani: {
        Args: {
          p_order_id: string
          p_notes?: string
        }
        Returns: Json
      }
      reject_biani: {
        Args: {
          p_order_id: string
          p_notes: string
        }
        Returns: Json
      }
      update_op_status: {
        Args: {
          p_op_id: string
          p_new_status: string
          p_notes?: string
        }
        Returns: Json
      }
      create_order_with_items: {
        Args: {
          p_items: Json
          p_order_data: Json
        }
        Returns: Json
      }
      search_orders: {
        Args: {
          p_client_id?: string
          p_seller_id?: string
          p_status?: string
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

// Alias types for convenience
export type Client = Tables<'clients'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type OrderWorkflow = Tables<'order_workflow'>
export type ProductionOrder = Tables<'production_orders'>
export type Product = Tables<'products'>
export type UserRole = Tables<'user_roles'>
