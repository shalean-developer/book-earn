import { NextRequest, NextResponse } from "next/server";
import { requestPayout } from "@/app/actions/payout";

export async function POST(request: NextRequest) {
  let body: { amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (Number.isNaN(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const result = await requestPayout(amount);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if ("needsOtp" in result && result.needsOtp) {
    return NextResponse.json({ needsOtp: true, transferCode: result.transferCode });
  }
  return NextResponse.json({ ok: true });
}
