import { createClient } from "./supabase-server";
import type { PricingBreakdown } from "./types/booking";

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

          if (extraId) {
            result.extras[extraId] = row.price;
          }
        }
        break;
    }
  }

  return result;
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
    const overridePrice = config.extras[id];
    if (overridePrice != null) {
      return sum + overridePrice;
    }
    return sum;
  }, 0);

  const tipAmount = booking.tipAmount ?? 0;

  const serviceFee = config.serviceFee ?? 0;
  const equipmentCharge = config.equipmentCharge ?? 0;

  const subtotal =
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

  // Frequency discount (e.g. weekly / multiple times a week) from pricing_config
  let frequencyDiscountAmount = 0;
  const cleaningFrequency = (booking.cleaningFrequency ?? "").toLowerCase();
  if (cleaningFrequency === "weekly" && config.weeklyDiscount != null) {
    frequencyDiscountAmount = Math.round(subtotal * config.weeklyDiscount);
  } else if (
    cleaningFrequency === "multi_week" &&
    config.multiWeekDiscount != null
  ) {
    frequencyDiscountAmount = Math.round(subtotal * config.multiWeekDiscount);
  }

  let discountAmount = frequencyDiscountAmount;
  const promoCode = booking.promoCode?.toUpperCase().trim();

  const total = Math.max(0, subtotal - discountAmount) + tipAmount;

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
    discountAmount,
    serviceFee,
    equipmentCharge,
    subtotal,
    total,
  };
}

