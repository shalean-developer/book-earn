import { createClient } from "./supabase-server";
import type { PricingBreakdown } from "./types/booking";
import { computeDynamicPricing } from "./pricing-engine";

/**
 * Per-unit prices when `pricing_config` has no `extra:<id>` row (keep aligned with BookingSystem extras).
 */
const EXTRA_PRICE_FALLBACK: Record<string, number> = {
  fridge: 30,
  oven: 30,
  windows: 40,
  cabinets: 30,
  walls: 35,
  extra_cleaner: 350,
  laundry_load: 85,
  ironing: 28,
  linen_refresh: 95,
  guest_supplies: 45,
  delicates: 45,
  stain_treatment: 55,
  equipment: 0,
  balcony: 250,
  carpet_deep: 300,
  ceiling: 300,
  couch: 130,
  garage: 110,
  mattress: 350,
  outside_windows: 125,
};

export interface ServicePricingConfig {
  basePrice?: number;
  /**
   * Map of extra ID -> price override for that extra
   * (e.g. "fridge", "oven", "balcony", etc.).
   */
  extras: Record<string, number>;
  /**
   * Per-unit multipliers for house/apt and office calculations.
   * All fields are optional; when absent, the caller can fall back
   * to a code default if desired.
   */
  bedroomAddPer?: number;
  bathroomAddPer?: number;
  extraRoomAddPer?: number;
  officePrivateAddPer?: number;
  officeMeetingAddPer?: number;
  officeScaleSmall?: number;
  officeScaleMedium?: number;
  officeScaleLarge?: number;
  officeScaleXlarge?: number;
  carpetRoomPer?: number;
  looseRugPer?: number;
  carpetExtraCleanerPer?: number;
  /**
   * Optional recurring frequency discounts, expressed as fractions
   * (e.g. 0.1 for 10% off).
   */
  weeklyDiscount?: number;
  multiWeekDiscount?: number;
  biWeeklyDiscount?: number;
  monthlyDiscount?: number;
  /**
   * Optional per-booking fees.
   */
  serviceFee?: number;
  equipmentCharge?: number;
}

type RawPricingRow = {
  service_type: string | null;
  price_type: string | null;
  item_name: string | null;
  price: number;
  effective_date: string;
  end_date: string | null;
  is_active: boolean;
};

/**
 * Fetch active pricing configuration for a given service from the
 * `pricing_config` table.
 *
 * Conventions:
 * - `service_type` matches the booking `service` (e.g. "standard", "deep").
 * - `price_type = 'base'` is the base service price.
 * - `price_type = 'extra:<extraId>'` is the price for a specific extra
 *   (e.g. 'extra:fridge', 'extra:balcony').
 * - Multipliers use fixed `price_type` keys:
 *   - 'bedroom_add', 'bathroom_add', 'extra_room_add'
 *   - 'office_private_add', 'office_meeting_add'
 *   - 'office_scale_small', 'office_scale_medium',
 *     'office_scale_large', 'office_scale_xlarge'
 *   - 'carpet_room', 'loose_rug', 'carpet_extra_cleaner'
 */
export async function getServicePricingConfig(
  serviceType: string
): Promise<ServicePricingConfig> {
  const supabase = await createClient();

  // Map internal service IDs to the service_type labels
  // actually stored in the database.
  const normalized = serviceType.toLowerCase();
  let dbServiceType = serviceType;
  if (normalized === "standard") dbServiceType = "Standard";
  if (normalized === "deep") dbServiceType = "Deep";
  if (normalized === "airbnb") dbServiceType = "Airbnb";
  if (normalized === "carpet") dbServiceType = "Carpet";
  if (normalized === "move") dbServiceType = "Move In/Out";
  if (normalized === "laundry") dbServiceType = "Laundry & Ironing";

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await supabase
    .from("pricing_config")
    .select(
      "id, service_type, price_type, item_name, price, effective_date, end_date, is_active"
    )
    .eq("service_type", dbServiceType)
    .eq("is_active", true)
    .lte("effective_date", todayStr)
    .or(`end_date.is.null,end_date.gte.${todayStr}`);

  if (error) {
    console.error(
      "Failed to load pricing_config for service",
      serviceType,
      error
    );
    return { basePrice: undefined, extras: {} };
  }

  const result: ServicePricingConfig = {
    basePrice: undefined,
    extras: {},
  };

  if (!data) {
    return result;
  }

  for (const row of data as RawPricingRow[]) {
    const priceType = (row.price_type ?? "").toLowerCase();
    const service = (row.service_type ?? "").toLowerCase();

    if (priceType === "base") {
      result.basePrice = row.price;
      continue;
    }

    if (priceType.startsWith("extra:")) {
      const extraId = priceType.substring("extra:".length);
      if (extraId) {
        result.extras[extraId] = row.price;
      }
      continue;
    }

    switch (priceType) {
      case "bedroom":
      case "bedroom_add":
        if (service === "carpet") {
          result.carpetRoomPer = row.price;
        } else {
          result.bedroomAddPer = row.price;
        }
        break;
      case "bathroom":
      case "bathroom_add":
        if (service === "carpet") {
          // For carpet service, treat "bathroom" rows as loose rug pricing.
          result.looseRugPer = row.price;
        } else {
          result.bathroomAddPer = row.price;
        }
        break;
      case "extra":
      case "extra_room_add":
        result.extraRoomAddPer = row.price;
        break;
      case "office_private_add":
        result.officePrivateAddPer = row.price;
        break;
      case "office_meeting_add":
        result.officeMeetingAddPer = row.price;
        break;
      case "office_scale_small":
        result.officeScaleSmall = row.price;
        break;
      case "office_scale_medium":
        result.officeScaleMedium = row.price;
        break;
      case "office_scale_large":
        result.officeScaleLarge = row.price;
        break;
      case "office_scale_xlarge":
        result.officeScaleXlarge = row.price;
        break;
      case "carpet_room":
        result.carpetRoomPer = row.price;
        break;
      case "loose_rug":
        result.looseRugPer = row.price;
        break;
      case "carpet_extra_cleaner":
        result.carpetExtraCleanerPer = row.price;
        break;
      case "frequency_discount_weekly":
        result.weeklyDiscount = row.price;
        break;
      case "frequency_discount_multi_week":
      case "frequency_discount_multiweek":
        result.multiWeekDiscount = row.price;
        break;
      case "frequency_discount_bi_weekly":
      case "frequency_discount_biweekly":
        result.biWeeklyDiscount = row.price;
        break;
      case "frequency_discount_monthly":
        result.monthlyDiscount = row.price;
        break;
      case "service_fee":
        result.serviceFee = row.price;
        break;
      case "equipment_charge":
        result.equipmentCharge = row.price;
        break;
      default:
        // Map generic extras by item_name to known extra IDs used by the UI.
        if (priceType === "extra") {
          const name = (row.item_name ?? "").toLowerCase();
          let extraId: string | null = null;
          if (name.includes("fridge")) extraId = "fridge";
          else if (name.includes("oven")) extraId = "oven";
          else if (name.includes("interior windows")) extraId = "windows";
          else if (name.includes("inside cabinets")) extraId = "cabinets";
          else if (name.includes("walls")) extraId = "walls";
          else if (name.includes("extra cleaner")) extraId = "extra_cleaner";
          else if (name.includes("equipment")) extraId = "equipment";
          else if (name.includes("balcony")) extraId = "balcony";
          else if (name.includes("carpet cleaning")) extraId = "carpet_deep";
          else if (name.includes("ceiling")) extraId = "ceiling";
          else if (name.includes("couch")) extraId = "couch";
          else if (name.includes("garage")) extraId = "garage";
          else if (name.includes("mattress")) extraId = "mattress";
          else if (name.includes("outside window") || name.includes("outside windows"))
            extraId = "outside_windows";
          else if (
            name.includes("laundry load") ||
            (name.includes("wash") && name.includes("fold"))
          )
            extraId = "laundry_load";
          else if (name.includes("ironing")) extraId = "ironing";
          else if (name.includes("linen")) extraId = "linen_refresh";
          else if (name.includes("guest") && name.includes("supply")) extraId = "guest_supplies";
          else if (name.includes("delicate")) extraId = "delicates";
          else if (name.includes("stain")) extraId = "stain_treatment";

          if (extraId) {
            result.extras[extraId] = row.price;
          }
        }
        break;
    }
  }

  return result;
}

async function resolvePromoDiscountAmount(args: {
  promoCode: string | undefined;
  serviceType: string;
  applyToAmount: number;
}): Promise<number> {
  const normalized = args.promoCode?.toUpperCase().trim();
  if (!normalized) return 0;

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("promo_codes")
    .select(
      "code, percentage_off, amount_off, is_active, start_date, end_date, service_type"
    )
    .eq("code", normalized)
    .eq("is_active", true)
    .lte("start_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return 0;
  }

  if (
    args.serviceType &&
    data.service_type &&
    data.service_type !== args.serviceType
  ) {
    return 0;
  }

  const base = Math.max(0, args.applyToAmount);
  const percentageOff = Number(data.percentage_off ?? 0);
  const amountOff = Number(data.amount_off ?? 0);

  if (percentageOff > 0) {
    return Math.round(base * percentageOff);
  }
  if (amountOff > 0) {
    return Math.min(base, amountOff);
  }
  return 0;
}

function mapServiceForPromo(service: string): string {
  const s = service.toLowerCase();
  if (s === "standard") return "standard";
  if (s === "deep") return "deep";
  if (s === "airbnb") return "airbnb";
  if (s === "carpet") return "carpet";
  if (s === "move") return "move";
  if (s === "laundry") return "laundry";
  return service;
}

/**
 * Compute a full PricingBreakdown for a booking payload on the server
 * using the same business rules as the client, but with all numeric
 * values (base, extras, multipliers) sourced from pricing_config.
 *
 * The `booking` shape matches the payload sent from the BookingSystem UI.
 */
export async function computePricingForBooking(booking: {
  service: string;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  propertyType: string;
  officeSize: string;
  privateOffices: number;
  meetingRooms: number;
  carpetedRooms: number;
  looseRugs: number;
  carpetExtraCleaners: number;
  extras: string[];
  tipAmount?: number;
  promoCode?: string;
  cleaningFrequency?: string;
  /** YYYY-MM-DD — used for weekend surcharge */
  date?: string;
  /** HH:mm — used for peak surcharge */
  time?: string;
  /** Suburb / working area — area multiplier */
  workingArea?: string;
  /** When "customer", per-booking equipment fee from config is not applied */
  equipmentMode?: "shalean" | "customer";
}): Promise<PricingBreakdown> {
  const config = await getServicePricingConfig(booking.service);

  if (config.basePrice == null) {
    throw new Error(
      `Missing 'base' pricing_config row for service_type='${booking.service}'`
    );
  }

  const basePrice = config.basePrice;

  // House / apartment vs carpet / office multipliers
  let bedroomAdd = 0;
  let bathroomAdd = 0;
  let extraRoomsAdd = 0;
  let officePrivateAdd = 0;
  let officeMeetingAdd = 0;
  let officeScaleAdd = 0;
  let carpetRoomsAdd = 0;
  let looseRugsAdd = 0;
  let carpetExtraCleanerAdd = 0;

  if (booking.service === "carpet") {
    if (config.carpetRoomPer == null) {
      throw new Error(
        "Missing 'carpet_room' pricing_config row for service_type='Carpet'"
      );
    }
    if (config.looseRugPer == null) {
      throw new Error(
        "Missing 'loose_rug' pricing_config row for service_type='Carpet'"
      );
    }
    if (config.carpetExtraCleanerPer == null) {
      throw new Error(
        "Missing 'carpet_extra_cleaner' pricing_config row for service_type='Carpet'"
      );
    }

    const carpetPer = config.carpetRoomPer;
    const rugPer = config.looseRugPer;
    const extraCleanerPer = config.carpetExtraCleanerPer;

    carpetRoomsAdd = booking.carpetedRooms * carpetPer;
    looseRugsAdd = booking.looseRugs * rugPer;
    carpetExtraCleanerAdd = booking.carpetExtraCleaners * extraCleanerPer;
  } else {
    if (config.bedroomAddPer == null) {
      throw new Error(
        `Missing 'bedroom_add' pricing_config row for service_type='${booking.service}'`
      );
    }
    if (config.bathroomAddPer == null) {
      throw new Error(
        `Missing 'bathroom_add' pricing_config row for service_type='${booking.service}'`
      );
    }
    if (config.extraRoomAddPer == null) {
      throw new Error(
        `Missing 'extra_room_add' pricing_config row for service_type='${booking.service}'`
      );
    }

    const bedroomPer = config.bedroomAddPer;
    const bathroomPer = config.bathroomAddPer;
    const extraRoomPer = config.extraRoomAddPer;

    bedroomAdd = Math.max(0, booking.bedrooms - 1) * bedroomPer;
    bathroomAdd = Math.max(0, booking.bathrooms - 1) * bathroomPer;
    extraRoomsAdd = Math.max(0, booking.extraRooms) * extraRoomPer;

    if (booking.propertyType === "office") {
      if (config.officePrivateAddPer == null) {
        throw new Error(
          `Missing 'office_private_add' pricing_config row for service_type='${booking.service}'`
        );
      }
      if (config.officeMeetingAddPer == null) {
        throw new Error(
          `Missing 'office_meeting_add' pricing_config row for service_type='${booking.service}'`
        );
      }

      const privatePer = config.officePrivateAddPer;
      const meetingPer = config.officeMeetingAddPer;

      officePrivateAdd = Math.max(0, booking.privateOffices) * privatePer;
      officeMeetingAdd = Math.max(0, booking.meetingRooms) * meetingPer;

      if (booking.officeSize === "small") {
        if (config.officeScaleSmall == null) {
          throw new Error(
            `Missing 'office_scale_small' pricing_config row for service_type='${booking.service}'`
          );
        }
        officeScaleAdd = config.officeScaleSmall;
      } else if (booking.officeSize === "medium") {
        if (config.officeScaleMedium == null) {
          throw new Error(
            `Missing 'office_scale_medium' pricing_config row for service_type='${booking.service}'`
          );
        }
        officeScaleAdd = config.officeScaleMedium;
      } else if (booking.officeSize === "large") {
        if (config.officeScaleLarge == null) {
          throw new Error(
            `Missing 'office_scale_large' pricing_config row for service_type='${booking.service}'`
          );
        }
        officeScaleAdd = config.officeScaleLarge;
      } else if (booking.officeSize === "xlarge") {
        if (config.officeScaleXlarge == null) {
          throw new Error(
            `Missing 'office_scale_xlarge' pricing_config row for service_type='${booking.service}'`
          );
        }
        officeScaleAdd = config.officeScaleXlarge;
      }
    }
  }

  const extrasTotal = booking.extras.reduce((sum, id) => {
    const fromConfig = config.extras[id];
    const unit =
      fromConfig != null ? fromConfig : EXTRA_PRICE_FALLBACK[id];
    if (unit == null) {
      return sum;
    }
    return sum + unit;
  }, 0);

  const tipAmount = booking.tipAmount ?? 0;

  const serviceFee = config.serviceFee ?? 0;
  const equipmentCharge =
    booking.equipmentMode === "customer"
      ? 0
      : config.equipmentCharge ?? 0;

  const lineSubtotal =
    basePrice +
    bedroomAdd +
    bathroomAdd +
    extraRoomsAdd +
    officePrivateAdd +
    officeMeetingAdd +
    officeScaleAdd +
    carpetRoomsAdd +
    looseRugsAdd +
    carpetExtraCleanerAdd +
    extrasTotal +
    serviceFee +
    equipmentCharge;

  const draft = computeDynamicPricing({
    lineSubtotal,
    cleaningFrequency: booking.cleaningFrequency ?? "once",
    weeklyDiscount: config.weeklyDiscount,
    multiWeekDiscount: config.multiWeekDiscount,
    biWeeklyDiscount: config.biWeeklyDiscount,
    monthlyDiscount: config.monthlyDiscount,
    date: booking.date,
    time: booking.time,
    workingArea: booking.workingArea,
    promoDiscountAmount: 0,
    tipAmount,
  });

  const promoDiscountAmount = await resolvePromoDiscountAmount({
    promoCode: booking.promoCode,
    serviceType: mapServiceForPromo(booking.service),
    applyToAmount: draft.afterAreaSubtotal,
  });

  const final = computeDynamicPricing({
    lineSubtotal,
    cleaningFrequency: booking.cleaningFrequency ?? "once",
    weeklyDiscount: config.weeklyDiscount,
    multiWeekDiscount: config.multiWeekDiscount,
    biWeeklyDiscount: config.biWeeklyDiscount,
    monthlyDiscount: config.monthlyDiscount,
    date: booking.date,
    time: booking.time,
    workingArea: booking.workingArea,
    promoDiscountAmount,
    tipAmount,
  });

  return {
    basePrice,
    bedroomAdd,
    bathroomAdd,
    extraRoomsAdd,
    officePrivateAdd,
    officeMeetingAdd,
    officeScaleAdd,
    carpetRoomsAdd,
    looseRugsAdd,
    carpetExtraCleanerAdd,
    extrasTotal,
    tipAmount,
    discountAmount: final.discountAmount,
    serviceFee,
    equipmentCharge,
    subtotal: lineSubtotal,
    peakCharge: final.peakCharge,
    weekendCharge: final.weekendCharge,
    areaMultiplier: final.areaMultiplier,
    afterAreaSubtotal: final.afterAreaSubtotal,
    total: final.total,
  };
}

