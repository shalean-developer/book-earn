import { NextRequest, NextResponse } from "next/server";
import { getServicePricingConfig } from "@/lib/pricing";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const serviceType = req.nextUrl.searchParams.get("service_type");

    if (!serviceType) {
      return NextResponse.json(
        { error: "Missing service_type parameter" },
        { status: 400 }
      );
    }

    const config = await getServicePricingConfig(serviceType);

    return NextResponse.json(
      {
        serviceType,
        basePrice: config.basePrice ?? null,
        extras: config.extras,
        multipliers: {
          bedroomAddPer: config.bedroomAddPer ?? null,
          bathroomAddPer: config.bathroomAddPer ?? null,
          extraRoomAddPer: config.extraRoomAddPer ?? null,
          officePrivateAddPer: config.officePrivateAddPer ?? null,
          officeMeetingAddPer: config.officeMeetingAddPer ?? null,
          officeScaleSmall: config.officeScaleSmall ?? null,
          officeScaleMedium: config.officeScaleMedium ?? null,
          officeScaleLarge: config.officeScaleLarge ?? null,
          officeScaleXlarge: config.officeScaleXlarge ?? null,
          carpetRoomPer: config.carpetRoomPer ?? null,
          looseRugPer: config.looseRugPer ?? null,
          carpetExtraCleanerPer: config.carpetExtraCleanerPer ?? null,
          weeklyDiscount: config.weeklyDiscount ?? null,
          multiWeekDiscount: config.multiWeekDiscount ?? null,
          serviceFee: config.serviceFee ?? null,
          equipmentCharge: config.equipmentCharge ?? null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/pricing/config", error);
    return NextResponse.json(
      { error: "Failed to load pricing configuration" },
      { status: 500 }
    );
  }
}

