/**
 * Supabase database types for bookings table.
 * Keep in sync with supabase/migrations/*_create_bookings.sql
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string;
          booking_ref: string;
          service: string;
          property_type: string;
          office_size: string | null;
          bedrooms: number;
          bathrooms: number;
          extra_rooms: number;
          working_area: string;
          extras: string[];
          date: string;
          time: string;
          cleaner_id: string | null;
          team_id: string | null;
          assign_me: boolean;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          address: string;
          instructions: string | null;
          subtotal: number;
          discount_amount: number;
          tip_amount: number;
          total: number;
          service_fee_amount: number;
          cleaner_earnings: number;
          promo_code: string | null;
          payment_method: string;
          payment_ref: string | null;
          payment_status: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_ref: string;
          service: string;
          property_type: string;
          office_size?: string | null;
          bedrooms: number;
          bathrooms: number;
          extra_rooms: number;
          working_area: string;
          extras?: string[];
          date: string;
          time: string;
          cleaner_id?: string | null;
          team_id?: string | null;
          assign_me?: boolean;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          address: string;
          instructions?: string | null;
          subtotal: number;
          discount_amount: number;
          tip_amount: number;
          total: number;
          service_fee_amount?: number;
          cleaner_earnings?: number;
          promo_code?: string | null;
          payment_method: string;
          payment_ref?: string | null;
          payment_status?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      booking_assignments: {
        Row: {
          id: string;
          booking_id: string;
          cleaner_id: string;
          earnings: number;
        };
        Insert: {
          id?: string;
          booking_id: string;
          cleaner_id: string;
          earnings: number;
        };
        Update: Partial<Database["public"]["Tables"]["booking_assignments"]["Insert"]>;
      };
      pending_payments: {
        Row: {
          booking_ref: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          booking_ref: string;
          payload: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pending_payments"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          role: string;
          name: string | null;
          email: string;
          phone: string | null;
          avatar: string | null;
          cleaner_id: string | null;
          bank_account_number: string | null;
          bank_code: string | null;
          bank_account_name: string | null;
          paystack_recipient_code: string | null;
          verification_status: string;
          verification_notes: string | null;
          verified_at: string | null;
          verification_provider: string | null;
          verification_external_id: string | null;
          verification_result: Json | null;
          verification_requested_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: string;
          name?: string | null;
          phone?: string | null;
          avatar?: string | null;
          cleaner_id?: string | null;
          bank_account_number?: string | null;
          bank_code?: string | null;
          bank_account_name?: string | null;
          paystack_recipient_code?: string | null;
          verification_status?: string;
          verification_notes?: string | null;
          verified_at?: string | null;
          verification_provider?: string | null;
          verification_external_id?: string | null;
          verification_result?: Json | null;
          verification_requested_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      payouts: {
        Row: {
          id: string;
          profile_id: string;
          amount: number;
          currency: string;
          paystack_transfer_code: string | null;
          paystack_reference: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          amount: number;
          currency?: string;
          paystack_transfer_code?: string | null;
          paystack_reference?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payouts"]["Insert"]>;
      };
      quote_requests: {
        Row: {
          id: string;
          service: string;
          property_type: string;
          office_size: string | null;
          bedrooms: number;
          bathrooms: number;
          extra_rooms: number;
          working_area: string;
          extras: string[];
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          address: string | null;
          message: string | null;
          status: string;
          admin_notes: string | null;
          quoted_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service: string;
          property_type: string;
          office_size?: string | null;
          bedrooms: number;
          bathrooms: number;
          extra_rooms?: number;
          working_area: string;
          extras?: string[];
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          address?: string | null;
          message?: string | null;
          status?: string;
          admin_notes?: string | null;
          quoted_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quote_requests"]["Insert"]>;
      };
    };
  };
}

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingAssignmentRow = Database["public"]["Tables"]["booking_assignments"]["Row"];
export type QuoteRequestRow = Database["public"]["Tables"]["quote_requests"]["Row"];
