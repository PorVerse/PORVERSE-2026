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
      achievements: {
        Row: {
          category: string
          code: string
          color: string | null
          created_at: string
          description: string
          display_order: number | null
          icon: string
          id: string
          is_active: boolean
          is_hidden: boolean
          name: string
          points: number
          rarity: string
          unlock_criteria: Json
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          color?: string | null
          created_at?: string
          description: string
          display_order?: number | null
          icon: string
          id?: string
          is_active?: boolean
          is_hidden?: boolean
          name: string
          points?: number
          rarity?: string
          unlock_criteria: Json
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          color?: string | null
          created_at?: string
          description?: string
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean
          is_hidden?: boolean
          name?: string
          points?: number
          rarity?: string
          unlock_criteria?: Json
          updated_at?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          ai_provider: string
          conversation_type: string
          created_at: string
          id: string
          model: string
          portal_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_provider: string
          conversation_type: string
          created_at?: string
          id?: string
          model: string
          portal_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_provider?: string
          conversation_type?: string
          created_at?: string
          id?: string
          model?: string
          portal_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_portal_id_fkey"
            columns: ["portal_id"]
            isOneToOne: false
            referencedRelation: "portals"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          token_count: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          token_count?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      astro_calculations: {
        Row: {
          birth_chart: Json | null
          compatibility_data: Json | null
          created_at: string | null
          current_transits: Json | null
          daily_aspects: Json | null
          decision_timing: Json | null
          energy_forecasts: Json | null
          id: string
          last_calculated: string | null
          life_themes: Json | null
          personality_insights: Json | null
          predictive_insights: Json | null
          timing_recommendations: Json | null
          user_id: string
        }
        Insert: {
          birth_chart?: Json | null
          compatibility_data?: Json | null
          created_at?: string | null
          current_transits?: Json | null
          daily_aspects?: Json | null
          decision_timing?: Json | null
          energy_forecasts?: Json | null
          id?: string
          last_calculated?: string | null
          life_themes?: Json | null
          personality_insights?: Json | null
          predictive_insights?: Json | null
          timing_recommendations?: Json | null
          user_id: string
        }
        Update: {
          birth_chart?: Json | null
          compatibility_data?: Json | null
          created_at?: string | null
          current_transits?: Json | null
          daily_aspects?: Json | null
          decision_timing?: Json | null
          energy_forecasts?: Json | null
          id?: string
          last_calculated?: string | null
          life_themes?: Json | null
          personality_insights?: Json | null
          predictive_insights?: Json | null
          timing_recommendations?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "astro_calculations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          stripe_customer_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload: Json
          stripe_customer_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          stripe_customer_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      biometric_scans: {
        Row: {
          analysis_results: Json
          confidence_score: number
          created_at: string
          id: string
          scan_data: Json
          scan_type: string
          user_id: string
        }
        Insert: {
          analysis_results: Json
          confidence_score: number
          created_at?: string
          id?: string
          scan_data: Json
          scan_type: string
          user_id: string
        }
        Update: {
          analysis_results?: Json
          confidence_score?: number
          created_at?: string
          id?: string
          scan_data?: Json
          scan_type?: string
          user_id?: string
        }
        Relationships: []
      }
      device_sync_status: {
        Row: {
          created_at: string | null
          data_usage_mb: number | null
          device_id: string
          device_type: string | null
          id: string
          last_sync_at: string | null
          offline_mode_enabled: boolean | null
          pending_downloads: number | null
          pending_uploads: number | null
          sync_preferences: Json | null
          sync_version: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_usage_mb?: number | null
          device_id: string
          device_type?: string | null
          id?: string
          last_sync_at?: string | null
          offline_mode_enabled?: boolean | null
          pending_downloads?: number | null
          pending_uploads?: number | null
          sync_preferences?: Json | null
          sync_version?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_usage_mb?: number | null
          device_id?: string
          device_type?: string | null
          id?: string
          last_sync_at?: string | null
          offline_mode_enabled?: boolean | null
          pending_downloads?: number | null
          pending_uploads?: number | null
          sync_preferences?: Json | null
          sync_version?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_sync_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      future_self_conversations: {
        Row: {
          action_recommendations: string[] | null
          conversation_data: Json | null
          created_at: string | null
          decision_influences: Json | null
          emotional_impact_score: number | null
          follow_up_conversations: string[] | null
          future_timeline: string | null
          id: string
          key_insights: string[] | null
          life_projections: Json | null
          personality_matrix: Json | null
          quantum_coherence_score: number | null
          user_id: string
        }
        Insert: {
          action_recommendations?: string[] | null
          conversation_data?: Json | null
          created_at?: string | null
          decision_influences?: Json | null
          emotional_impact_score?: number | null
          follow_up_conversations?: string[] | null
          future_timeline?: string | null
          id?: string
          key_insights?: string[] | null
          life_projections?: Json | null
          personality_matrix?: Json | null
          quantum_coherence_score?: number | null
          user_id: string
        }
        Update: {
          action_recommendations?: string[] | null
          conversation_data?: Json | null
          created_at?: string | null
          decision_influences?: Json | null
          emotional_impact_score?: number | null
          follow_up_conversations?: string[] | null
          future_timeline?: string | null
          id?: string
          key_insights?: string[] | null
          life_projections?: Json | null
          personality_matrix?: Json | null
          quantum_coherence_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "future_self_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_simulations: {
        Row: {
          action_plan: Json | null
          comparative_analysis: Json | null
          created_at: string | null
          id: string
          insights_generated: string[] | null
          life_satisfaction_score: number | null
          probability_of_success: number | null
          required_changes: string[] | null
          simulation_accuracy_feedback: number | null
          simulation_parameters: Json | null
          simulation_results: Json | null
          simulation_type: string | null
          timeline_projection: Json | null
          user_id: string
          user_reaction: string | null
        }
        Insert: {
          action_plan?: Json | null
          comparative_analysis?: Json | null
          created_at?: string | null
          id?: string
          insights_generated?: string[] | null
          life_satisfaction_score?: number | null
          probability_of_success?: number | null
          required_changes?: string[] | null
          simulation_accuracy_feedback?: number | null
          simulation_parameters?: Json | null
          simulation_results?: Json | null
          simulation_type?: string | null
          timeline_projection?: Json | null
          user_id: string
          user_reaction?: string | null
        }
        Update: {
          action_plan?: Json | null
          comparative_analysis?: Json | null
          created_at?: string | null
          id?: string
          insights_generated?: string[] | null
          life_satisfaction_score?: number | null
          probability_of_success?: number | null
          required_changes?: string[] | null
          simulation_accuracy_feedback?: number | null
          simulation_parameters?: Json | null
          simulation_results?: Json | null
          simulation_type?: string | null
          timeline_projection?: Json | null
          user_id?: string
          user_reaction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_simulations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_queue: {
        Row: {
          action_type: string
          created_at: string
          id: string
          payload: Json
          retry_count: number
          status: string
          synced_at: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          payload: Json
          retry_count?: number
          status?: string
          synced_at?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          payload?: Json
          retry_count?: number
          status?: string
          synced_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          provider: string
          provider_payment_id: string | null
          status: string
          subscription_tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          provider: string
          provider_payment_id?: string | null
          status?: string
          subscription_tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          provider?: string
          provider_payment_id?: string | null
          status?: string
          subscription_tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portal_flow_data: {
        Row: {
          ai_productivity_plan: Json | null
          automation_opportunities: Json | null
          calendar_optimization: Json | null
          created_at: string | null
          current_systems: Json | null
          distraction_patterns: Json | null
          energy_patterns: Json | null
          focus_sessions: Json | null
          id: string
          meeting_analysis: Json | null
          productivity_goals: Json | null
          task_management_preferences: Json | null
          time_tracking_data: Json | null
          updated_at: string | null
          user_id: string
          workflow_optimization: Json | null
        }
        Insert: {
          ai_productivity_plan?: Json | null
          automation_opportunities?: Json | null
          calendar_optimization?: Json | null
          created_at?: string | null
          current_systems?: Json | null
          distraction_patterns?: Json | null
          energy_patterns?: Json | null
          focus_sessions?: Json | null
          id?: string
          meeting_analysis?: Json | null
          productivity_goals?: Json | null
          task_management_preferences?: Json | null
          time_tracking_data?: Json | null
          updated_at?: string | null
          user_id: string
          workflow_optimization?: Json | null
        }
        Update: {
          ai_productivity_plan?: Json | null
          automation_opportunities?: Json | null
          calendar_optimization?: Json | null
          created_at?: string | null
          current_systems?: Json | null
          distraction_patterns?: Json | null
          energy_patterns?: Json | null
          focus_sessions?: Json | null
          id?: string
          meeting_analysis?: Json | null
          productivity_goals?: Json | null
          task_management_preferences?: Json | null
          time_tracking_data?: Json | null
          updated_at?: string | null
          user_id?: string
          workflow_optimization?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_flow_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_health_data: {
        Row: {
          created_at: string | null
          current_metrics: Json | null
          dietary_preferences: string[] | null
          doctor_recommendations: Json | null
          fitness_goals: Json | null
          food_allergies: string[] | null
          health_conditions: string[] | null
          health_insights: Json | null
          id: string
          meal_plans: Json | null
          medications: string[] | null
          nutrition_goals: Json | null
          progress_photos_urls: string[] | null
          supplement_stack: Json | null
          updated_at: string | null
          user_id: string
          workout_plans: Json | null
          workout_preferences: Json | null
        }
        Insert: {
          created_at?: string | null
          current_metrics?: Json | null
          dietary_preferences?: string[] | null
          doctor_recommendations?: Json | null
          fitness_goals?: Json | null
          food_allergies?: string[] | null
          health_conditions?: string[] | null
          health_insights?: Json | null
          id?: string
          meal_plans?: Json | null
          medications?: string[] | null
          nutrition_goals?: Json | null
          progress_photos_urls?: string[] | null
          supplement_stack?: Json | null
          updated_at?: string | null
          user_id: string
          workout_plans?: Json | null
          workout_preferences?: Json | null
        }
        Update: {
          created_at?: string | null
          current_metrics?: Json | null
          dietary_preferences?: string[] | null
          doctor_recommendations?: Json | null
          fitness_goals?: Json | null
          food_allergies?: string[] | null
          health_conditions?: string[] | null
          health_insights?: Json | null
          id?: string
          meal_plans?: Json | null
          medications?: string[] | null
          nutrition_goals?: Json | null
          progress_photos_urls?: string[] | null
          supplement_stack?: Json | null
          updated_at?: string | null
          user_id?: string
          workout_plans?: Json | null
          workout_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_health_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_mind_data: {
        Row: {
          ai_financial_plan: Json | null
          created_at: string | null
          current_income: number | null
          daily_financial_habits: Json | null
          debt_overview: Json | null
          financial_challenges: string[] | null
          financial_goals: Json | null
          id: string
          investment_portfolio: Json | null
          investment_recommendations: Json | null
          money_mindset_assessment: Json | null
          monthly_expenses: Json | null
          retirement_goals: Json | null
          risk_tolerance: string | null
          savings_rate: number | null
          tax_optimization_strategies: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_financial_plan?: Json | null
          created_at?: string | null
          current_income?: number | null
          daily_financial_habits?: Json | null
          debt_overview?: Json | null
          financial_challenges?: string[] | null
          financial_goals?: Json | null
          id?: string
          investment_portfolio?: Json | null
          investment_recommendations?: Json | null
          money_mindset_assessment?: Json | null
          monthly_expenses?: Json | null
          retirement_goals?: Json | null
          risk_tolerance?: string | null
          savings_rate?: number | null
          tax_optimization_strategies?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_financial_plan?: Json | null
          created_at?: string | null
          current_income?: number | null
          daily_financial_habits?: Json | null
          debt_overview?: Json | null
          financial_challenges?: string[] | null
          financial_goals?: Json | null
          id?: string
          investment_portfolio?: Json | null
          investment_recommendations?: Json | null
          money_mindset_assessment?: Json | null
          monthly_expenses?: Json | null
          retirement_goals?: Json | null
          risk_tolerance?: string | null
          savings_rate?: number | null
          tax_optimization_strategies?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_mind_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_steps: {
        Row: {
          content: Json
          created_at: string
          description: string
          estimated_duration: number
          id: string
          is_active: boolean
          portal_id: string
          step_number: number
          title: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          description: string
          estimated_duration: number
          id?: string
          is_active?: boolean
          portal_id: string
          step_number: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string
          estimated_duration?: number
          id?: string
          is_active?: boolean
          portal_id?: string
          step_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_steps_portal_id_fkey"
            columns: ["portal_id"]
            isOneToOne: false
            referencedRelation: "portals"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_well_data: {
        Row: {
          ai_wellbeing_plan: Json | null
          anxiety_triggers: string[] | null
          coping_mechanisms: string[] | null
          created_at: string | null
          crisis_prevention_plan: Json | null
          current_stress_level: number | null
          emotional_intelligence_assessment: Json | null
          id: string
          meditation_experience: string | null
          mental_health_conditions: string[] | null
          mental_health_goals: Json | null
          mindfulness_practices: Json | null
          mood_tracking_data: Json | null
          professional_referrals: Json | null
          support_system: Json | null
          therapy_history: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_wellbeing_plan?: Json | null
          anxiety_triggers?: string[] | null
          coping_mechanisms?: string[] | null
          created_at?: string | null
          crisis_prevention_plan?: Json | null
          current_stress_level?: number | null
          emotional_intelligence_assessment?: Json | null
          id?: string
          meditation_experience?: string | null
          mental_health_conditions?: string[] | null
          mental_health_goals?: Json | null
          mindfulness_practices?: Json | null
          mood_tracking_data?: Json | null
          professional_referrals?: Json | null
          support_system?: Json | null
          therapy_history?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_wellbeing_plan?: Json | null
          anxiety_triggers?: string[] | null
          coping_mechanisms?: string[] | null
          created_at?: string | null
          crisis_prevention_plan?: Json | null
          current_stress_level?: number | null
          emotional_intelligence_assessment?: Json | null
          id?: string
          meditation_experience?: string | null
          mental_health_conditions?: string[] | null
          mental_health_goals?: Json | null
          mindfulness_practices?: Json | null
          mood_tracking_data?: Json | null
          professional_referrals?: Json | null
          support_system?: Json | null
          therapy_history?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_well_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portals: {
        Row: {
          color_primary: string
          color_secondary: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          order_index: number
          portal_code: string
          title: string
          updated_at: string
        }
        Insert: {
          color_primary: string
          color_secondary: string
          created_at?: string
          description: string
          icon: string
          id?: string
          is_active?: boolean
          order_index: number
          portal_code: string
          title: string
          updated_at?: string
        }
        Update: {
          color_primary?: string
          color_secondary?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          order_index?: number
          portal_code?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          currency: string
          email: string
          full_name: string | null
          i18n_updated_at: string
          id: string
          language: string
          preferred_language: string
          pricing_tier: string
          stripe_current_period_end: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_status: string | null
          stripe_subscription_id: string | null
          stripe_subscription_status: string | null
          subscription_current_period_end: string | null
          subscription_status: string
          subscription_tier: string
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          email: string
          full_name?: string | null
          i18n_updated_at?: string
          id: string
          language?: string
          preferred_language?: string
          pricing_tier?: string
          stripe_current_period_end?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_status?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: string
          subscription_tier?: string
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          email?: string
          full_name?: string | null
          i18n_updated_at?: string
          id?: string
          language?: string
          preferred_language?: string
          pricing_tier?: string
          stripe_current_period_end?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_status?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: string
          subscription_tier?: string
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quantum_memories: {
        Row: {
          content: string
          created_at: string
          emotional_resonance: number
          id: string
          memory_type: string
          quantum_signature: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          emotional_resonance: number
          id?: string
          memory_type: string
          quantum_signature: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          emotional_resonance?: number
          id?: string
          memory_type?: string
          quantum_signature?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quantum_vault_access: {
        Row: {
          access_level: string | null
          ai_personality_matrix: Json | null
          breakthrough_moments: Json | null
          created_at: string | null
          favorite_features: string[] | null
          future_self_conversations: number | null
          id: string
          identity_explorations: number | null
          last_session_at: string | null
          life_optimization_score: number | null
          quantum_coherence_rating: number | null
          quantum_insights_generated: number | null
          session_duration_total_minutes: number | null
          timeline_simulations: number | null
          total_sessions: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          access_level?: string | null
          ai_personality_matrix?: Json | null
          breakthrough_moments?: Json | null
          created_at?: string | null
          favorite_features?: string[] | null
          future_self_conversations?: number | null
          id?: string
          identity_explorations?: number | null
          last_session_at?: string | null
          life_optimization_score?: number | null
          quantum_coherence_rating?: number | null
          quantum_insights_generated?: number | null
          session_duration_total_minutes?: number | null
          timeline_simulations?: number | null
          total_sessions?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          access_level?: string | null
          ai_personality_matrix?: Json | null
          breakthrough_moments?: Json | null
          created_at?: string | null
          favorite_features?: string[] | null
          future_self_conversations?: number | null
          id?: string
          identity_explorations?: number | null
          last_session_at?: string | null
          life_optimization_score?: number | null
          quantum_coherence_rating?: number | null
          quantum_insights_generated?: number | null
          session_duration_total_minutes?: number | null
          timeline_simulations?: number | null
          total_sessions?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quantum_vault_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_sessions: {
        Row: {
          ai_sleep_insights: Json | null
          awake_minutes: number | null
          created_at: string | null
          data_source: string | null
          deep_sleep_minutes: number | null
          factors_analysis: Json | null
          heart_rate_avg: number | null
          heart_rate_variability_avg: number | null
          id: string
          light_sleep_minutes: number | null
          portal_integration: Json | null
          recommendations: Json | null
          rem_sleep_minutes: number | null
          sleep_efficiency: number | null
          sleep_end: string
          sleep_quality_score: number | null
          sleep_start: string
          total_duration_minutes: number | null
          user_id: string
        }
        Insert: {
          ai_sleep_insights?: Json | null
          awake_minutes?: number | null
          created_at?: string | null
          data_source?: string | null
          deep_sleep_minutes?: number | null
          factors_analysis?: Json | null
          heart_rate_avg?: number | null
          heart_rate_variability_avg?: number | null
          id?: string
          light_sleep_minutes?: number | null
          portal_integration?: Json | null
          recommendations?: Json | null
          rem_sleep_minutes?: number | null
          sleep_efficiency?: number | null
          sleep_end: string
          sleep_quality_score?: number | null
          sleep_start: string
          total_duration_minutes?: number | null
          user_id: string
        }
        Update: {
          ai_sleep_insights?: Json | null
          awake_minutes?: number | null
          created_at?: string | null
          data_source?: string | null
          deep_sleep_minutes?: number | null
          factors_analysis?: Json | null
          heart_rate_avg?: number | null
          heart_rate_variability_avg?: number | null
          id?: string
          light_sleep_minutes?: number | null
          portal_integration?: Json | null
          recommendations?: Json | null
          rem_sleep_minutes?: number | null
          sleep_efficiency?: number | null
          sleep_end?: string
          sleep_quality_score?: number | null
          sleep_start?: string
          total_duration_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      step_responses: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          portal_id: string
          responses: Json
          step_id: string
          step_number: number
          time_spent_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          portal_id: string
          responses: Json
          step_id: string
          step_number: number
          time_spent_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          portal_id?: string
          responses?: Json
          step_id?: string
          step_number?: number
          time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_responses_portal_id_fkey"
            columns: ["portal_id"]
            isOneToOne: false
            referencedRelation: "portals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_responses_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "portal_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          received_at: string
          type: string | null
        }
        Insert: {
          id: string
          received_at?: string
          type?: string | null
        }
        Update: {
          id?: string
          received_at?: string
          type?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          price_id: string | null
          product_id: string | null
          status: string | null
          stripe_customer_id: string
          stripe_subscription_id: string
          tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string | null
          stripe_customer_id: string
          stripe_subscription_id: string
          tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string | null
          stripe_customer_id?: string
          stripe_subscription_id?: string
          tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          action_type: string | null
          created_at: string | null
          data: Json | null
          error_message: string | null
          id: string
          max_retries: number | null
          priority: number | null
          processed_at: string | null
          record_id: string | null
          retry_count: number | null
          scheduled_for: string | null
          status: string | null
          table_name: string | null
          user_id: string
        }
        Insert: {
          action_type?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          priority?: number | null
          processed_at?: string | null
          record_id?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string | null
          table_name?: string | null
          user_id: string
        }
        Update: {
          action_type?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          priority?: number | null
          processed_at?: string | null
          record_id?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string | null
          table_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          notified_at: string | null
          progress_data: Json | null
          progress_percentage: number
          unlocked_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          notified_at?: string | null
          progress_data?: Json | null
          progress_percentage?: number
          unlocked_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          notified_at?: string | null
          progress_data?: Json | null
          progress_percentage?: number
          unlocked_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_portal_progress: {
        Row: {
          completed_at: string | null
          completion_percentage: number
          created_at: string
          current_step: number
          id: string
          last_activity_at: string
          portal_id: string
          started_at: string | null
          status: string
          total_steps: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number
          created_at?: string
          current_step?: number
          id?: string
          last_activity_at?: string
          portal_id: string
          started_at?: string | null
          status?: string
          total_steps: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number
          created_at?: string
          current_step?: number
          id?: string
          last_activity_at?: string
          portal_id?: string
          started_at?: string | null
          status?: string
          total_steps?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_portal_progress_portal_id_fkey"
            columns: ["portal_id"]
            isOneToOne: false
            referencedRelation: "portals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          activity_level: string | null
          ai_personality_matrix: Json | null
          allergies: string[] | null
          astrology_profile: Json | null
          avatar_url: string | null
          biometric_baseline: Json | null
          communication_preferences: Json | null
          core_values: string[] | null
          created_at: string | null
          cultural_background: Json | null
          date_of_birth: string | null
          display_name: string | null
          emergency_contacts: Json | null
          first_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          last_name: string | null
          learning_style: string | null
          life_goals: string[] | null
          medical_conditions: string[] | null
          medications: string[] | null
          notification_preferences: Json | null
          personality_type: string | null
          place_of_birth: Json | null
          privacy_settings: Json | null
          sleep_schedule: Json | null
          stress_triggers: string[] | null
          time_of_birth: string | null
          updated_at: string | null
          weight_kg: number | null
          work_schedule: Json | null
        }
        Insert: {
          activity_level?: string | null
          ai_personality_matrix?: Json | null
          allergies?: string[] | null
          astrology_profile?: Json | null
          avatar_url?: string | null
          biometric_baseline?: Json | null
          communication_preferences?: Json | null
          core_values?: string[] | null
          created_at?: string | null
          cultural_background?: Json | null
          date_of_birth?: string | null
          display_name?: string | null
          emergency_contacts?: Json | null
          first_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          last_name?: string | null
          learning_style?: string | null
          life_goals?: string[] | null
          medical_conditions?: string[] | null
          medications?: string[] | null
          notification_preferences?: Json | null
          personality_type?: string | null
          place_of_birth?: Json | null
          privacy_settings?: Json | null
          sleep_schedule?: Json | null
          stress_triggers?: string[] | null
          time_of_birth?: string | null
          updated_at?: string | null
          weight_kg?: number | null
          work_schedule?: Json | null
        }
        Update: {
          activity_level?: string | null
          ai_personality_matrix?: Json | null
          allergies?: string[] | null
          astrology_profile?: Json | null
          avatar_url?: string | null
          biometric_baseline?: Json | null
          communication_preferences?: Json | null
          core_values?: string[] | null
          created_at?: string | null
          cultural_background?: Json | null
          date_of_birth?: string | null
          display_name?: string | null
          emergency_contacts?: Json | null
          first_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          last_name?: string | null
          learning_style?: string | null
          life_goals?: string[] | null
          medical_conditions?: string[] | null
          medications?: string[] | null
          notification_preferences?: Json | null
          personality_type?: string | null
          place_of_birth?: Json | null
          privacy_settings?: Json | null
          sleep_schedule?: Json | null
          stress_triggers?: string[] | null
          time_of_birth?: string | null
          updated_at?: string | null
          weight_kg?: number | null
          work_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          churn_risk_score: number | null
          country_code: string | null
          created_at: string | null
          currency: string | null
          email: string
          id: string
          language: string | null
          last_seen_at: string | null
          lifetime_value: number | null
          onboarding_completed: boolean | null
          paypal_customer_id: string | null
          quantum_vault_locked_price: number | null
          quantum_vault_price_locked: boolean | null
          quantum_vault_unlocked: boolean | null
          referral_code: string | null
          referred_by: string | null
          stripe_customer_id: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          timezone: string | null
          total_portals_completed: number | null
          total_sessions: number | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          churn_risk_score?: number | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          email: string
          id: string
          language?: string | null
          last_seen_at?: string | null
          lifetime_value?: number | null
          onboarding_completed?: boolean | null
          paypal_customer_id?: string | null
          quantum_vault_locked_price?: number | null
          quantum_vault_price_locked?: boolean | null
          quantum_vault_unlocked?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          total_portals_completed?: number | null
          total_sessions?: number | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          churn_risk_score?: number | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string
          id?: string
          language?: string | null
          last_seen_at?: string | null
          lifetime_value?: number | null
          onboarding_completed?: boolean | null
          paypal_customer_id?: string | null
          quantum_vault_locked_price?: number | null
          quantum_vault_price_locked?: boolean | null
          quantum_vault_unlocked?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          total_portals_completed?: number | null
          total_sessions?: number | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wearable_data: {
        Row: {
          anomaly_detected: boolean | null
          created_at: string | null
          data_type: string | null
          device_id: string | null
          device_type: string | null
          id: string
          processed_data: Json | null
          quality_score: number | null
          raw_data: Json | null
          recorded_at: string
          sync_source: string | null
          unit: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          anomaly_detected?: boolean | null
          created_at?: string | null
          data_type?: string | null
          device_id?: string | null
          device_type?: string | null
          id?: string
          processed_data?: Json | null
          quality_score?: number | null
          raw_data?: Json | null
          recorded_at: string
          sync_source?: string | null
          unit?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          anomaly_detected?: boolean | null
          created_at?: string | null
          data_type?: string | null
          device_id?: string | null
          device_type?: string | null
          id?: string
          processed_data?: Json | null
          quality_score?: number | null
          raw_data?: Json | null
          recorded_at?: string
          sync_source?: string | null
          unit?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wearable_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_profile: { Args: never; Returns: undefined }
      get_user_achievement_completion: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_achievement_points: {
        Args: { p_user_id: string }
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
