/**
 * 🗄️ PorVerse V2 - Database Types
 * Auto-generated TypeScript types from Supabase schema
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description DO NOT EDIT MANUALLY - Generated from Supabase
 * 
 * ============================================================================
 * GENERATION INSTRUCTIONS:
 * ============================================================================
 * 
 * This file should be auto-generated from your Supabase schema using the
 * Supabase CLI. To generate or update this file:
 * 
 * 1. Install Supabase CLI (if not installed):
 *    npm install -g supabase
 * 
 * 2. Login to Supabase:
 *    supabase login
 * 
 * 3. Link your project:
 *    supabase link --project-ref YOUR_PROJECT_REF
 * 
 * 4. Generate TypeScript types:
 *    supabase gen types typescript --linked > types/database.types.ts
 * 
 *    OR using project ID directly:
 *    supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
 * 
 *    OR using npm script:
 *    npm run db:generate
 * 
 * 5. The generated file will include:
 *    - All table definitions
 *    - Column types
 *    - Relationship types
 *    - Enum types
 *    - Function return types
 * 
 * ============================================================================
 * EXAMPLE GENERATED STRUCTURE:
 * ============================================================================
 * 
 * export type Json =
 *   | string
 *   | number
 *   | boolean
 *   | null
 *   | { [key: string]: Json | undefined }
 *   | Json[]
 * 
 * export interface Database {
 *   public: {
 *     Tables: {
 *       portals: {
 *         Row: {
 *           id: string
 *           name: string
 *           description: string
 *           // ... all other columns
 *         }
 *         Insert: {
 *           id?: string
 *           name: string
 *           // ... required columns for insert
 *         }
 *         Update: {
 *           id?: string
 *           name?: string
 *           // ... all columns optional for update
 *         }
 *       }
 *       // ... all other tables
 *     }
 *     Views: {
 *       // ... any database views
 *     }
 *     Functions: {
 *       // ... any database functions
 *     }
 *     Enums: {
 *       // ... any enum types
 *     }
 *   }
 * }
 * 
 * ============================================================================
 * USAGE IN CODE:
 * ============================================================================
 * 
 * import type { Database } from './types/database.types'
 * import { createClient } from '@supabase/supabase-js'
 * 
 * const supabase = createClient<Database>(
 *   process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 * )
 * 
 * // Now you get full type safety:
 * const { data: portals, error } = await supabase
 *   .from('portals')
 *   .select('*')
 * 
 * // TypeScript knows the exact shape of 'portals'
 * 
 * ============================================================================
 * AUTOMATION:
 * ============================================================================
 * 
 * Add to package.json scripts:
 * 
 * "scripts": {
 *   "db:generate": "supabase gen types typescript --project-id $NEXT_PUBLIC_SUPABASE_PROJECT_REF > types/database.types.ts",
 *   "db:generate:local": "supabase gen types typescript --local > types/database.types.ts"
 * }
 * 
 * Then run:
 * npm run db:generate
 * 
 * ============================================================================
 * IMPORTANT NOTES:
 * ============================================================================
 * 
 * 1. Re-generate this file whenever you modify your database schema
 * 2. Commit the generated file to version control
 * 3. Run generation as part of your CI/CD pipeline
 * 4. Never edit this file manually - changes will be overwritten
 * 5. If you see type errors after schema changes, regenerate this file
 * 
 * ============================================================================
 */

// Placeholder type until generated
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
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, any>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, any>
        Returns: any
      }
    }
    Enums: {
      [key: string]: string
    }
  }
}

/**
 * Helper type to extract table row type
 * 
 * Usage:
 * type Portal = Tables<'portals'>
 */
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

/**
 * Helper type to extract insert type
 * 
 * Usage:
 * type PortalInsert = TablesInsert<'portals'>
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

/**
 * Helper type to extract update type
 * 
 * Usage:
 * type PortalUpdate = TablesUpdate<'portals'>
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

/**
 * Helper type to extract enum values
 * 
 * Usage:
 * type PortalStatus = Enums<'portal_status'>
 */
export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T]

// Re-export for convenience
export type { Database as SupabaseDatabase }