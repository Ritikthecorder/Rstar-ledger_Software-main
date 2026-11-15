export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      business_members: {
        Row: {
          id: string;
          owner_id: string;
          member_user_id: string | null;
          invited_email: string;
          role: "staff" | "viewer";
          status: "pending" | "active" | "revoked";
          invite_token: string;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          member_user_id?: string | null;
          invited_email: string;
          role?: "staff" | "viewer";
          status?: "pending" | "active" | "revoked";
          invite_token?: string;
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          member_user_id?: string | null;
          invited_email?: string;
          role?: "staff" | "viewer";
          status?: "pending" | "active" | "revoked";
          invite_token?: string;
          created_at?: string;
          accepted_at?: string | null;
        };
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          opening_balance: number;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          opening_balance?: number;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          opening_balance?: number;
          created_at?: string;
          created_by?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string;
          type: "credit" | "debit";
          amount: number;
          description: string | null;
          payment_mode: "cash" | "upi" | "bank" | "card" | null;
          reference_id: string | null;
          date: string;
          created_at: string;
          attachment_url: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_id: string;
          type: "credit" | "debit";
          amount: number;
          description?: string | null;
          payment_mode?: "cash" | "upi" | "bank" | "card" | null;
          reference_id?: string | null;
          date: string;
          created_at?: string;
          attachment_url?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_id?: string;
          type?: "credit" | "debit";
          amount?: number;
          description?: string | null;
          payment_mode?: "cash" | "upi" | "bank" | "card" | null;
          reference_id?: string | null;
          date?: string;
          created_at?: string;
          attachment_url?: string | null;
          created_by?: string | null;
        };
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          currency: string;
          theme: "light" | "dark" | "system";
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name?: string;
          currency?: string;
          theme?: "light" | "dark" | "system";
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          currency?: string;
          theme?: "light" | "dark" | "system";
        };
      };
    };
  };
}

export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type InsertCustomer = Database["public"]["Tables"]["customers"]["Insert"];
export type UpdateCustomer = Database["public"]["Tables"]["customers"]["Update"];

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type InsertTransaction = Database["public"]["Tables"]["transactions"]["Insert"];
export type UpdateTransaction = Database["public"]["Tables"]["transactions"]["Update"];

export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type BusinessMember = Database["public"]["Tables"]["business_members"]["Row"];
export type InsertSettings = Database["public"]["Tables"]["settings"]["Insert"];
export type UpdateSettings = Database["public"]["Tables"]["settings"]["Update"];

export type TransactionWithCustomer = Transaction & {
  customers: Pick<Customer, "id" | "name">;
};

export interface CustomerPortal {
  id: string;
  token: string;
  customer_id: string;
  user_id: string;
  payload: import("@/lib/portal-utils").PortalPayload;
  expires_at: string;
  created_at: string;
}
