export interface PricingBreakdown {
  basePrice: number;
  bedroomAdd: number;
  bathroomAdd: number;
  extraRoomsAdd: number;
  officePrivateAdd: number;
  officeMeetingAdd: number;
  officeScaleAdd: number;
  carpetRoomsAdd: number;
  looseRugsAdd: number;
  carpetExtraCleanerAdd: number;
  extrasTotal: number;
  tipAmount: number;
  discountAmount: number;
   /** Per-booking fees pulled from pricing_config, if configured. */
  serviceFee: number;
  equipmentCharge: number;
  subtotal: number;
  total: number;
}

// Shape of the booking row we insert into the Supabase `bookings` table.
export interface BookingRecord {
  id?: string;
  created_at?: string;

  // Status comes from the database default / enum.
  // We keep it optional so inserts can rely on the DB default.
  status?: "pending" | "confirmed" | "failed" | "cancelled" | string;
  reference: string;

  // Customer contact
  name: string;
  email: string;
  phone: string;
  address: string;

  // Booking details
  service: string;
  bedrooms: number;
  bathrooms: number;
  extra_rooms: number;
  apartment_unit?: string;
  property_type: string;
  office_size: string;
  private_offices: number;
  meeting_rooms: number;
  carpeted_rooms: number;
  loose_rugs: number;
  carpet_extra_cleaners: number;
  extras: string[]; // ids of extras selected
  cleaner_id: string | null;
  team_id: string | null;
  working_area: string;
  cleaning_frequency: string;
  cleaning_days: string[];
  date: string;
  time: string;
  instructions: string;

  // Pricing
  base_amount: number;
  discount_amount: number;
  tip_amount: number;
  subtotal_amount: number;
  total_amount: number;
  currency: string;

  // Payment / Paystack
  paystack_reference: string;
  paystack_transaction_id?: string | null;
  paystack_status?: string | null;
  paystack_raw_response?: unknown;

  // Legacy columns kept in the Supabase schema that are still
  // marked as NOT NULL. We mirror the newer fields into these
  // so inserts don’t fail while the database is using the old names.
  booking_ref?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  subtotal?: number;
  total?: number;

  // Legacy payment method column (e.g. "online")
  payment_method?: string;

  /** Referral: referrer email when booking was made with ?ref= */
  referred_by_email?: string | null;
}

