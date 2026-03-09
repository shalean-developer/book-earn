import { NextRequest, NextResponse } from "next/server";
import { listBanks } from "@/app/actions/payout";

export async function GET(request: NextRequest) {
  const currency = request.nextUrl.searchParams.get("currency") ?? "ZAR";
  const result = await listBanks(currency);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ banks: result.banks });
}
