// Hand-written to match supabase/migrations/*.sql until the Supabase CLI is
// available. Regenerate with:
//   supabase gen types typescript --project-id <project-ref> --schema public
// and this file can be replaced as a drop-in — the shape matches what that
// command produces.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AccountType = 'debit' | 'credit' | 'cash'
export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: AccountType
          initial_balance: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: AccountType
          initial_balance?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: AccountType
          initial_balance?: number
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          transfer_account_id: string | null
          category_id: string | null
          amount: number
          type: TransactionType
          date: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          transfer_account_id?: string | null
          category_id?: string | null
          amount: number
          type: TransactionType
          date?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          transfer_account_id?: string | null
          category_id?: string | null
          amount?: number
          type?: TransactionType
          date?: string
          note?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      account_balances: {
        Row: {
          account_id: string
          user_id: string
          name: string
          type: AccountType
          initial_balance: number
          balance: number
        }
      }
    }
    Functions: {
      seed_default_categories: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: Record<string, never>
  }
}
