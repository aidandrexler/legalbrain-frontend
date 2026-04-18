export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          attorney_name: string;
          bar_number: string;
          firm_name: string;
          email: string;
          phone: string;
          primary_jurisdiction: string;
          practice_areas: string[];
          anthropic_api_key_encrypted: string;
          openai_api_key_encrypted: string;
          govinfo_api_key: string;
          courtlistener_token: string;
          sandbox_provisioned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          tenant_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          email: string;
          phone: string;
          marital_status: string;
          spouse_first_name: string;
          number_of_children: number;
          estate_size_estimate number;
          net_worth: number;
          annual_income: number;
          homestead_declared: boolean;
          trust_funded: boolean;
          trust_signed_date: string | null;
          entity_type: string;
          is_physician: boolean;
          physician_specialty: string;
          practice_entity_type: string;
          practice_name: string;
          annual_practice_revenue: number;
          top_payer_concentration: number;
          has_malpractice_coverage: boolean;
          malpractice_limit: number;
          has_buy_sell_agreement: boolean;
          buy_sell_funded: boolean;
          goal_tax_efficiency: number;
          goal_risk_reduction: number;
          goal_liquidity: number;
          goal_simplicity: number;
          status: string;
          anticipated_sale_date: string | null;
          anticipated_inheritance_date: string | null;
          anticipated_inheritance_amount: number;
          divorce_risk_flag: boolean;
          health_flag: boolean;
          cpa_name: string;
          financial_advisor_name: string;
          referral_source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      diagnostics: {
        Row: {
          id: string;
          tenant_id: string;
          client_id: string;
          diagnostic_type: string;
          status: string;
          output_text: string;
          drafting_spec: Json | null;
          attorney_reviewed: boolean;
          correction_type: string;
          correction_significance: string;
          correction_notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['diagnostics']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['diagnostics']['Insert']>;
      };
      action_items: {
        Row: {
          id: string;
          tenant_id: string;
          client_id: string;
          diagnostic_id: string | null;
          title: string;
          description: string;
          urgency: string;
          status: string;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['action_items']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['action_items']['Insert']>;
      };
      legal_knowledge: {
        Row: {
          id: string;
          tenant_id: string;
          source: string;
          source_title: string;
          namespace: string;
          confidence_tier: number;
          content: string;
          citation: string;
          is_superseded: boolean;
          ingested_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['legal_knowledge']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['legal_knowledge']['Insert']>;
      };
      extraction_jobs: {
        Row: {
          id: string;
          tenant_id: string;
          job_id: string;
          source_title: string;
          status: string;
          progress: number;
          current_step: string;
          chunks_added: number;
          error_message: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['extraction_jobs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['extraction_jobs']['Insert']>;
      };
      system_improvements: {
        Row: {
          id: string;
          tenant_id: string;
          diagnostic_type: string;
          proposed_rule: string;
          trigger_count: number;
          status: string;
          final_rule: string;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['system_improvements']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['system_improvements']['Insert']>;
      };
      rate_table: {
        Row: {
          id: string;
          tenant_id: string;
          effective_month: string;
          rate_7520: number;
          afr_mid: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rate_table']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['rate_table']['Insert']>;
      };
      oauth_tokens: {
        Row: {
          id: string;
          tenant_id: string;
          provider: string;
          access_token: string;
          refresh_token: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['oauth_tokens']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['oauth_tokens']['Insert']>;
      };
      action_items: {
        Row: {
          id: string;
          tenant_id: string;
          client_id: string;
          window_title: string;
          description: string;
          urgency: string;
          due_date: string | null;
          window_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['action_items']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['action_items']['Insert']>;
      };
    };
  };
}
