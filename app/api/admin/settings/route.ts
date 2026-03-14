import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type AdminSettings = {
  companyName: string;
  defaultCity: string;
  workingHours: string;
  sameDayBookings: boolean;
  smsNotifications: boolean;
  assignmentMode: string;
};

const DEFAULT_SETTINGS: AdminSettings = {
  companyName: "Shalean Cleaning Services",
  defaultCity: "Cape Town",
  workingHours: "08:00 - 18:00",
  sameDayBookings: false,
  smsNotifications: true,
  assignmentMode: "smart",
};

const SETTINGS_KEY = "admin_settings_v1";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("key_value_store")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    if (error) {
      console.error("Error loading admin settings:", error);
      return NextResponse.json(
        { error: "Failed to load admin settings" },
        { status: 500 }
      );
    }

    if (!data || !data.value) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    let parsed: unknown = null;
    try {
      parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    } catch (parseErr) {
      console.error("Error parsing admin settings value:", parseErr);
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      ...(parsed as Partial<AdminSettings>),
    };

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("Unexpected error in admin settings GET:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading admin settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      settings?: Partial<AdminSettings>;
    };

    if (!body || typeof body !== "object" || !body.settings) {
      return NextResponse.json(
        { error: "Invalid settings payload" },
        { status: 400 }
      );
    }

    const incoming = body.settings;

    const normalised: AdminSettings = {
      companyName:
        typeof incoming.companyName === "string" && incoming.companyName.trim()
          ? incoming.companyName.trim()
          : DEFAULT_SETTINGS.companyName,
      defaultCity:
        typeof incoming.defaultCity === "string" && incoming.defaultCity.trim()
          ? incoming.defaultCity.trim()
          : DEFAULT_SETTINGS.defaultCity,
      workingHours:
        typeof incoming.workingHours === "string" && incoming.workingHours.trim()
          ? incoming.workingHours.trim()
          : DEFAULT_SETTINGS.workingHours,
      sameDayBookings:
        typeof incoming.sameDayBookings === "boolean"
          ? incoming.sameDayBookings
          : DEFAULT_SETTINGS.sameDayBookings,
      smsNotifications:
        typeof incoming.smsNotifications === "boolean"
          ? incoming.smsNotifications
          : DEFAULT_SETTINGS.smsNotifications,
      assignmentMode:
        typeof incoming.assignmentMode === "string" && incoming.assignmentMode.trim()
          ? incoming.assignmentMode.trim()
          : DEFAULT_SETTINGS.assignmentMode,
    };

    const supabase = await createClient();

    const { error } = await supabase
      .from("key_value_store")
      .upsert(
        {
          key: SETTINGS_KEY,
          value: normalised,
        },
        { onConflict: "key" }
      );

    if (error) {
      console.error("Error saving admin settings:", error);
      return NextResponse.json(
        { error: "Failed to save admin settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: normalised });
  } catch (err) {
    console.error("Unexpected error in admin settings PUT:", err);
    return NextResponse.json(
      { error: "Unexpected server error saving admin settings" },
      { status: 500 }
    );
  }
}

