import { NextRequest, NextResponse } from "next/server";
import { finalizePayout } from "@/app/actions/payout";

export async function POST(request: NextRequest) {
  let body: { transferCode?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const transferCode = String(body.transferCode ?? "").trim();
  const otp = String(body.otp ?? "").trim();
  if (!transferCode || !otp) {
    return NextResponse.json({ error: "transferCode and otp required" }, { status: 400 });
  }
  const result = await finalizePayout(transferCode, otp);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
