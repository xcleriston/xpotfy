import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      markets: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          image_url: string
          end_date: string
          status: 'active' | 'ended' | 'pending'
          total_volume: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          image_url: string
          end_date: string
          status?: 'active' | 'ended' | 'pending'
          total_volume?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          image_url?: string
          end_date?: string
          status?: 'active' | 'ended' | 'pending'
          total_volume?: number
          updated_at?: string
        }
      }
      outcomes: {
        Row: {
          id: string
          market_id: string
          title: string
          probability: number
          volume: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          market_id: string
          title: string
          probability?: number
          volume?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          market_id?: string
          title?: string
          probability?: number
          volume?: number
          updated_at?: string
        }
      }
      bets: {
        Row: {
          id: string
          user_id: string
          market_id: string
          outcome_id: string
          amount: number
          odds: number
          potential_win: number
          status: 'pending' | 'won' | 'lost'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          market_id: string
          outcome_id: string
          amount: number
          odds: number
          potential_win: number
          status?: 'pending' | 'won' | 'lost'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          market_id?: string
          outcome_id?: string
          amount?: number
          odds?: number
          potential_win?: number
          status?: 'pending' | 'won' | 'lost'
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url?: string
          balance: number
          total_winnings: number
          total_bets: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          avatar_url?: string
          balance?: number
          total_winnings?: number
          total_bets?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string
          balance?: number
          total_winnings?: number
          total_bets?: number
          updated_at?: string
        }
      }
    }
  }
}
