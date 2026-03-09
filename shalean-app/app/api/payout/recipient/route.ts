import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateCleanerRecipient } from "@/app/actions/payout";

export async function POST(request: NextRequest) {
  let body: { bankCode?: string; accountNumber?: string; accountName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const result = await createOrUpdateCleanerRecipient({
    bankCode: String(body.bankCode ?? ""),
    accountNumber: String(body.accountNumber ?? ""),
    accountName: String(body.accountName ?? ""),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ recipientCode: result.recipientCode });
}
