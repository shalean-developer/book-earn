import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const MAX_ROWS = 20000;
const PAGE_SIZE = 1000;

export type DuplicateGroup = {
  key: string;
  count: number;
  bookingIds: string[];
  sample?: string;
};

export type DuplicatesResponse = {
  byReference: DuplicateGroup[];
  byCustomerSlot: DuplicateGroup[];
  totalRowsScanned: number;
  truncated: boolean;
  summary: { referenceGroups: number; customerSlotGroups: number };
};

export async function GET() {
  try {
    const supabase = await createClient();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const rows: { id: string; reference: string | null; email: string | null; date: string | null; time: string | null; name?: string | null; customer_name?: string | null }[] = [];
    let offset = 0;
    let truncated = false;

    while (offset < MAX_ROWS) {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, reference, email, date, time, name, customer_name")
        .gte("date", tomorrowStr)
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error("Error fetching bookings for duplicate check:", error);
        return NextResponse.json(
          { error: "Failed to load bookings for duplicate check" },
          { status: 500 }
        );
      }
      const chunk = (data ?? []) as { id: string; reference: string | null; email: string | null; date: string | null; time: string | null; name?: string | null; customer_name?: string | null }[];
      rows.push(...chunk);
      if (chunk.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
      if (offset >= MAX_ROWS) truncated = true;
    }

    const byRef = new Map<string, string[]>();
    const bySlot = new Map<string, { ids: string[]; customerName: string }>();

    for (const row of rows) {
      const id = String(row.id ?? "");
      const customerName = (row.name ?? row.customer_name ?? "").toString().trim() || "Unknown";
      if (row.reference != null && String(row.reference).trim() !== "") {
        const ref = String(row.reference).trim();
        if (!byRef.has(ref)) byRef.set(ref, []);
        byRef.get(ref)!.push(id);
      }
      if (
        row.email != null &&
        String(row.email).trim() !== "" &&
        row.date != null &&
        row.time != null
      ) {
        const slot = `${String(row.email).trim()}|${row.date}|${row.time}`;
        if (!bySlot.has(slot)) bySlot.set(slot, { ids: [], customerName });
        bySlot.get(slot)!.ids.push(id);
      }
    }

    const byReference: DuplicateGroup[] = [];
    byRef.forEach((ids, key) => {
      if (ids.length > 1) {
        byReference.push({
          key,
          count: ids.length,
          bookingIds: ids,
          sample: key,
        });
      }
    });

    const byCustomerSlot: DuplicateGroup[] = [];
    bySlot.forEach(({ ids, customerName }, key) => {
      if (ids.length > 1) {
        const [email, date, time] = key.split("|");
        byCustomerSlot.push({
          key: `${email} · ${date} ${time}`,
          count: ids.length,
          bookingIds: ids,
          sample: `${customerName} (${email} · ${date} ${time})`,
        });
      }
    });

    const summary = {
      referenceGroups: byReference.length,
      customerSlotGroups: byCustomerSlot.length,
    };

    return NextResponse.json({
      byReference,
      byCustomerSlot,
      totalRowsScanned: rows.length,
      truncated,
      summary,
    } satisfies DuplicatesResponse);
  } catch (err) {
    console.error("Unexpected error in admin bookings duplicates route:", err);
    return NextResponse.json(
      { error: "Unexpected server error checking duplicates" },
      { status: 500 }
    );
  }
}
