import { resend } from "@/lib/resend";
import type { BookingRecord, PricingBreakdown } from "@/lib/types/booking";
import {
  formatCleaningDays,
  formatExtrasList,
  labelFrequency,
  labelOfficeSize,
  labelPropertyType,
  labelService,
} from "@/lib/booking-display-labels";
import { formatEstimatedDuration } from "@/lib/duration";

/** Matches app marketing palette (see src/index.css :root — primary, bg, brand teal, slate text). */
const EMAIL_THEME = {
  pageBg: "#EFF6FF",
  card: "#ffffff",
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  teal: "#14B8A6",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  subtleFill: "#F0F9FF",
  shadow: "0 4px 20px -4px rgba(15, 23, 42, 0.08)",
} as const;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Bookings <no-reply@example.com>";
const ADMIN_EMAIL = process.env.BOOKING_ADMIN_EMAIL;
const REPLY_TO_EMAIL =
  process.env.BOOKING_REPLY_TO_EMAIL || "bookings@shalean.com";
const BCC_EMAIL = process.env.BOOKING_BCC_EMAIL || "accounts@shalean.com";

interface SendBookingEmailsArgs {
  booking: BookingRecord;
  pricing: PricingBreakdown;
  /** Resolved from `profiles` for the admin confirmation email (optional). */
  cleanerDisplayName?: string | null;
}

/** Customer display name: prefers `name`, falls back to legacy `customer_name`. */
function getCustomerFullName(booking: BookingRecord): string {
  const fromName = booking.name != null ? String(booking.name).trim() : "";
  if (fromName) return fromName;
  const legacy = booking.customer_name != null ? String(booking.customer_name).trim() : "";
  return legacy;
}

export function looksLikeUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id.trim()
  );
}

export async function sendBookingEmails({
  booking,
  pricing,
  cleanerDisplayName,
}: SendBookingEmailsArgs) {
  if (!booking.email) {
    return;
  }

  const customerHtml = buildCustomerEmailHtml(booking, pricing);
  const adminHtml = buildAdminEmailHtml(booking, pricing, cleanerDisplayName);

  await resend.emails.send({
    from: FROM_EMAIL,
    replyTo: REPLY_TO_EMAIL,
    bcc: BCC_EMAIL ? [BCC_EMAIL] : undefined,
    to: booking.email,
    subject: `Your Shalean booking is confirmed – ${booking.date} at ${booking.time}`,
    html: customerHtml,
  });

  if (ADMIN_EMAIL) {
    await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO_EMAIL,
      bcc: BCC_EMAIL ? [BCC_EMAIL] : undefined,
      to: ADMIN_EMAIL,
      subject: `New booking confirmed – ${booking.reference}`,
      html: adminHtml,
    });
  }
}

export interface SendPaymentLinkEmailArgs {
  to: string;
  name: string;
  reference: string;
  date: string;
  time: string;
  totalAmount: number;
  currency: string;
  paymentPageUrl: string;
}

export async function sendPaymentLinkEmail({
  to,
  name,
  reference,
  date,
  time,
  totalAmount,
  currency,
  paymentPageUrl,
}: SendPaymentLinkEmailArgs) {
  const amountStr =
    currency === "ZAR"
      ? `R${totalAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`
      : `${currency} ${totalAmount.toFixed(2)}`;

  const isPaystackLink = paymentPageUrl.includes("paystack.com");
  const bodyInner = `
    <tr>
      <td style="padding: 24px 24px 12px 24px; text-align: left;">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; line-height: 1.3; color: ${EMAIL_THEME.text}; font-weight: 600;">
          Complete your payment
        </h1>
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: ${EMAIL_THEME.muted};">
          Hi ${escapeHtml(name)}, your Shalean booking is scheduled for ${escapeHtml(date)} at ${escapeHtml(time)}. Click Pay now to complete your payment securely with Paystack.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${EMAIL_THEME.subtleFill}; border-radius: 8px; border: 1px solid #BFDBFE;">
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; color: ${EMAIL_THEME.muted};">Reference</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: ${EMAIL_THEME.text}; text-align: right;">${escapeHtml(reference)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; color: ${EMAIL_THEME.muted};">Amount due</td>
            <td style="padding: 12px 16px; font-size: 16px; font-weight: 700; color: ${EMAIL_THEME.text}; text-align: right;">${escapeHtml(amountStr)}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 8px 24px 24px 24px;">
        <a href="${escapeHtml(paymentPageUrl)}" style="display: inline-block; padding: 14px 28px; background-color: ${EMAIL_THEME.primary}; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
          Pay now${isPaystackLink ? " with Paystack" : ""}
        </a>
      </td>
    </tr>
    ${isPaystackLink ? `<tr><td style="padding: 0 24px 24px 24px; font-size: 12px; color: ${EMAIL_THEME.muted};">You will be taken to Paystack to enter your card details. Payment is secure and your booking will be confirmed as soon as payment succeeds.</td></tr>` : ""}
  `;

  const html = wrapEmailHtml(bodyInner);

  await resend.emails.send({
    from: FROM_EMAIL,
    replyTo: REPLY_TO_EMAIL,
    bcc: BCC_EMAIL ? [BCC_EMAIL] : undefined,
    to,
    subject: `Pay for your Shalean booking – ${reference}`,
    html,
  });
}

function buildCustomerEmailHtml(
  booking: BookingRecord,
  pricing: PricingBreakdown
): string {
  const hasDiscount = pricing.discountAmount && pricing.discountAmount > 0;
  const hasTip = pricing.tipAmount && pricing.tipAmount > 0;

  const currency = escapeHtml(booking.currency);

  const addressBlock = `${escapeHtml(booking.address)}${
    booking.apartment_unit ? "<br/>" + escapeHtml(booking.apartment_unit) : ""
  }`;

  const serviceLower = (booking.service || "").toLowerCase();
  const propertyTypeLower = (booking.property_type || "").toLowerCase();
  const isOfficeBooking =
    serviceLower.includes("office") ||
    propertyTypeLower.includes("office") ||
    propertyTypeLower.includes("commercial");
  const isCarpetService = serviceLower === "carpet";

  const detailRows: string[] = [];

  detailRows.push(buildKeyValueRow("Reference", escapeHtml(booking.reference)));

  const whenDuration =
    booking.estimated_duration_minutes != null
      ? `${escapeHtml(booking.date)} · ${escapeHtml(booking.time)} · ${formatEstimatedDuration(
          Number(booking.estimated_duration_minutes)
        )}`
      : `${escapeHtml(booking.date)} · ${escapeHtml(booking.time)}`;
  detailRows.push(buildKeyValueRow("When", whenDuration));

  if (booking.phone?.trim()) {
    detailRows.push(
      buildKeyValueRow("Phone", escapeHtml(booking.phone.trim()))
    );
  }

  detailRows.push(
    buildKeyValueRow("Service", escapeHtml(labelService(booking.service)))
  );

  if (booking.cleaning_frequency) {
    detailRows.push(
      buildKeyValueRow(
        "Frequency",
        escapeHtml(labelFrequency(booking.cleaning_frequency))
      )
    );
  }

  if (booking.working_area?.trim()) {
    detailRows.push(
      buildKeyValueRow("Service area", escapeHtml(booking.working_area.trim()))
    );
  }

  const daysStr = formatCleaningDays(booking.cleaning_days);
  if (daysStr) {
    detailRows.push(
      buildKeyValueRow("Preferred days", escapeHtml(daysStr))
    );
  }

  detailRows.push(buildKeyValueRow("Address", addressBlock, "left"));

  detailRows.push(
    buildKeyValueRow(
      "Property type",
      escapeHtml(labelPropertyType(booking.property_type))
    )
  );

  if (isOfficeBooking) {
    if (booking.office_size) {
      detailRows.push(
        buildKeyValueRow(
          "Office size",
          escapeHtml(labelOfficeSize(booking.office_size))
        )
      );
    }
    if (booking.private_offices && booking.private_offices > 0) {
      detailRows.push(
        buildKeyValueRow("Private offices", String(booking.private_offices))
      );
    }
    if (booking.meeting_rooms && booking.meeting_rooms > 0) {
      detailRows.push(
        buildKeyValueRow("Meeting rooms", String(booking.meeting_rooms))
      );
    }
    if (booking.carpeted_rooms && booking.carpeted_rooms > 0) {
      detailRows.push(
        buildKeyValueRow("Carpeted rooms", String(booking.carpeted_rooms))
      );
    }
    if (booking.loose_rugs && booking.loose_rugs > 0) {
      detailRows.push(
        buildKeyValueRow("Loose rugs", String(booking.loose_rugs))
      );
    }
    if (booking.carpet_extra_cleaners && booking.carpet_extra_cleaners > 0) {
      detailRows.push(
        buildKeyValueRow(
          "Extra carpet cleaners",
          String(booking.carpet_extra_cleaners)
        )
      );
    }
  } else if (isCarpetService) {
    detailRows.push(
      buildKeyValueRow("Carpeted areas", String(booking.carpeted_rooms))
    );
    detailRows.push(
      buildKeyValueRow("Loose rugs", String(booking.loose_rugs ?? 0))
    );
    detailRows.push(
      buildKeyValueRow(
        "Extra carpet cleaners",
        String(booking.carpet_extra_cleaners ?? 0)
      )
    );
  } else {
    detailRows.push(
      buildKeyValueRow("Bedrooms", String(booking.bedrooms))
    );
    detailRows.push(
      buildKeyValueRow("Bathrooms", String(booking.bathrooms))
    );
    if (booking.extra_rooms && booking.extra_rooms > 0) {
      detailRows.push(
        buildKeyValueRow("Extra rooms", String(booking.extra_rooms))
      );
    }
  }

  const extrasFormatted = formatExtrasList(booking.extras);
  detailRows.push(
    buildKeyValueRow(
      "Extras",
      extrasFormatted ? escapeHtml(extrasFormatted) : "None"
    )
  );

  const pricingRows: string[] = [
    buildKeyValueRow("Total", `${currency} ${pricing.total.toFixed(2)}`),
  ];
  if (hasDiscount) {
    pricingRows.push(
      buildKeyValueRow(
        "Discount",
        `${currency} -${pricing.discountAmount.toFixed(2)}`
      )
    );
  }
  if (hasTip) {
    pricingRows.push(
      buildKeyValueRow("Tip", `${currency} ${pricing.tipAmount.toFixed(2)}`)
    );
  }

  const bodyInner = `
    <tr>
      <td style="padding: 20px 24px 6px 24px; text-align: left;">
        <h1 style="margin: 0 0 6px 0; font-size: 20px; line-height: 1.3; color: ${EMAIL_THEME.text}; font-weight: 600;">
          Booking confirmed
        </h1>
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: ${EMAIL_THEME.muted};">
          Hi ${escapeHtml(getCustomerFullName(booking) || "there")} — you're all set. Here are your booking details.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 12px 24px 20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tbody>
            ${detailRows.join("")}
            ${pricingRows.join("")}
          </tbody>
        </table>
      </td>
    </tr>
    ${
      booking.instructions
        ? `<tr>
      <td style="padding: 0 24px 12px 24px;">
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${EMAIL_THEME.muted};">
          <strong style="color: ${EMAIL_THEME.text};">Your note:</strong> ${escapeHtml(booking.instructions)}
        </p>
      </td>
    </tr>`
        : ""
    }
    ${buildCustomerContactBlock(booking.reference)}
  `;

  return wrapEmailHtml(bodyInner);
}

function buildCustomerContactBlock(reference: string): string {
  const ref = escapeHtml(reference);
  return `
    <tr>
      <td style="padding: 0 24px 22px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${EMAIL_THEME.subtleFill}; border: 1px solid #BFDBFE; border-radius: 8px;">
          <tr>
            <td style="padding: 14px 16px 16px 16px;">
              <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${EMAIL_THEME.primary};">
                Contact &amp; next steps
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding: 0 12px 10px 0; font-size: 12px; font-weight: 600; color: ${EMAIL_THEME.text}; width: 84px; vertical-align: top;">
                    Access
                  </td>
                  <td style="padding: 0 0 10px 0; font-size: 12px; line-height: 1.55; color: ${EMAIL_THEME.muted}; vertical-align: top;">
                    Make sure we can get in on time. If your building needs codes or special entry instructions, reply to this email so we can share them with your cleaning team.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 12px 10px 0; font-size: 12px; font-weight: 600; color: ${EMAIL_THEME.text}; vertical-align: top;">
                    Changes
                  </td>
                  <td style="padding: 0 0 10px 0; font-size: 12px; line-height: 1.55; color: ${EMAIL_THEME.muted}; vertical-align: top;">
                    To reschedule or cancel, reply to this message and include your reference <strong style="color: ${EMAIL_THEME.text}; font-weight: 600;">${ref}</strong>.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 12px 0 0; font-size: 12px; font-weight: 600; color: ${EMAIL_THEME.text}; vertical-align: top;">
                    Help
                  </td>
                  <td style="padding: 0; font-size: 12px; line-height: 1.55; color: ${EMAIL_THEME.muted}; vertical-align: top;">
                    Questions? Reply to this email &mdash; we read every message.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function buildAdminEmailHtml(
  booking: BookingRecord,
  pricing: PricingBreakdown,
  cleanerDisplayName?: string | null
): string {
  const currency = escapeHtml(booking.currency);

  const hasDiscount = pricing.discountAmount && pricing.discountAmount > 0;
  const hasTip = pricing.tipAmount && pricing.tipAmount > 0;
  const hasServiceFee = pricing.serviceFee && pricing.serviceFee > 0;
  const hasEquipmentCharge =
    pricing.equipmentCharge && pricing.equipmentCharge > 0;

  const extrasLabel =
    booking.extras && booking.extras.length > 0
      ? escapeHtml(booking.extras.join(", "))
      : "None";

  const headerTitle = "New booking confirmed";

  const overviewRows: string[] = [];
  overviewRows.push(
    buildKeyValueRow("Reference", escapeHtml(booking.reference))
  );
  if (booking.status) {
    overviewRows.push(
      buildKeyValueRow("Status", escapeHtml(String(booking.status)))
    );
  }
  if (booking.created_at) {
    overviewRows.push(
      buildKeyValueRow("Created at", escapeHtml(booking.created_at))
    );
  }

  const customerRows: string[] = [];
  customerRows.push(
    buildKeyValueRow("Name", escapeHtml(getCustomerFullName(booking) || "—"))
  );
  customerRows.push(
    buildKeyValueRow("Email", escapeHtml(booking.email || ""))
  );
  customerRows.push(
    buildKeyValueRow("Phone", escapeHtml(booking.phone || ""))
  );

  const scheduleRows: string[] = [];
  scheduleRows.push(
    buildKeyValueRow("Service", escapeHtml(booking.service || ""))
  );
  if (booking.cleaning_frequency) {
    scheduleRows.push(
      buildKeyValueRow(
        "Frequency",
        escapeHtml(booking.cleaning_frequency || "")
      )
    );
  }
  if (booking.working_area) {
    scheduleRows.push(
      buildKeyValueRow("Working area", escapeHtml(booking.working_area || ""))
    );
  }
  scheduleRows.push(
    buildKeyValueRow("Date", escapeHtml(booking.date || ""))
  );
  scheduleRows.push(
    buildKeyValueRow("Time", escapeHtml(booking.time || ""))
  );
  if (booking.estimated_duration_minutes != null) {
    scheduleRows.push(
      buildKeyValueRow(
        "Estimated duration",
        formatEstimatedDuration(Number(booking.estimated_duration_minutes))
      )
    );
  }

  const propertyRows: string[] = [];
  const serviceLower = (booking.service || "").toLowerCase();
  const propertyTypeLower = (booking.property_type || "").toLowerCase();
  const isOfficeBooking =
    serviceLower.includes("office") ||
    propertyTypeLower.includes("office") ||
    propertyTypeLower.includes("commercial");

  propertyRows.push(
    buildKeyValueRow("Property type", escapeHtml(booking.property_type || ""))
  );

  if (isOfficeBooking) {
    if (booking.office_size) {
      propertyRows.push(
        buildKeyValueRow("Office size", escapeHtml(booking.office_size || ""))
      );
    }
    if (booking.private_offices && booking.private_offices > 0) {
      propertyRows.push(
        buildKeyValueRow("Private offices", String(booking.private_offices))
      );
    }
    if (booking.meeting_rooms && booking.meeting_rooms > 0) {
      propertyRows.push(
        buildKeyValueRow("Meeting rooms", String(booking.meeting_rooms))
      );
    }
    if (booking.carpeted_rooms && booking.carpeted_rooms > 0) {
      propertyRows.push(
        buildKeyValueRow("Carpeted rooms", String(booking.carpeted_rooms))
      );
    }
    if (booking.loose_rugs && booking.loose_rugs > 0) {
      propertyRows.push(
        buildKeyValueRow("Loose rugs", String(booking.loose_rugs))
      );
    }
    if (booking.carpet_extra_cleaners && booking.carpet_extra_cleaners > 0) {
      propertyRows.push(
        buildKeyValueRow(
          "Extra carpet cleaners",
          String(booking.carpet_extra_cleaners)
        )
      );
    }
  } else {
    propertyRows.push(
      buildKeyValueRow("Bedrooms", String(booking.bedrooms))
    );
    propertyRows.push(
      buildKeyValueRow("Bathrooms", String(booking.bathrooms))
    );
    if (booking.extra_rooms && booking.extra_rooms > 0) {
      propertyRows.push(
        buildKeyValueRow("Extra rooms", String(booking.extra_rooms))
      );
    }
  }

  propertyRows.push(buildKeyValueRow("Extras", extrasLabel));

  const pricingRows: string[] = [];
  pricingRows.push(
    buildKeyValueRow("Total paid", `${currency} ${pricing.total.toFixed(2)}`)
  );
  pricingRows.push(
    buildKeyValueRow("Subtotal", `${currency} ${pricing.subtotal.toFixed(2)}`)
  );
  if (hasDiscount) {
    pricingRows.push(
      buildKeyValueRow(
        "Discount",
        `${currency} -${pricing.discountAmount.toFixed(2)}`
      )
    );
  }
  if (hasTip) {
    pricingRows.push(
      buildKeyValueRow(
        "Tip",
        `${currency} ${pricing.tipAmount.toFixed(2)}`
      )
    );
  }
  if (hasServiceFee) {
    pricingRows.push(
      buildKeyValueRow(
        "Service fee",
        `${currency} ${pricing.serviceFee.toFixed(2)}`
      )
    );
  }
  if (hasEquipmentCharge) {
    pricingRows.push(
      buildKeyValueRow(
        "Equipment charge",
        `${currency} ${pricing.equipmentCharge.toFixed(2)}`
      )
    );
  }

  const internalRows: string[] = [];
  const cleanerIdRaw = booking.cleaner_id != null ? String(booking.cleaner_id).trim() : "";
  if (cleanerDisplayName && cleanerDisplayName.trim()) {
    internalRows.push(
      buildKeyValueRow("Assigned cleaner", escapeHtml(cleanerDisplayName.trim()))
    );
  } else if (cleanerIdRaw && looksLikeUuid(cleanerIdRaw)) {
    internalRows.push(
      buildKeyValueRow("Cleaner ID", escapeHtml(cleanerIdRaw))
    );
  } else if (cleanerIdRaw) {
    const label =
      cleanerIdRaw.toLowerCase() === "any" ? "To be assigned" : cleanerIdRaw;
    internalRows.push(buildKeyValueRow("Assigned cleaner", escapeHtml(label)));
  }
  if (booking.team_id) {
    internalRows.push(
      buildKeyValueRow("Team ID", escapeHtml(booking.team_id))
    );
  }
  if (booking.paystack_reference) {
    internalRows.push(
      buildKeyValueRow(
        "Paystack reference",
        escapeHtml(booking.paystack_reference)
      )
    );
  }
  if (booking.paystack_status) {
    internalRows.push(
      buildKeyValueRow("Paystack status", escapeHtml(booking.paystack_status))
    );
  }

  const bodyInner = `
    <tr>
      <td style="padding: 24px 24px 12px 24px; text-align: left;">
        <h1 style="margin: 0 0 4px 0; font-size: 20px; line-height: 1.3; color: ${EMAIL_THEME.text}; font-weight: 600;">
          ${headerTitle}
        </h1>
        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: ${EMAIL_THEME.muted};">
          A new booking has been confirmed and paid.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 8px 24px 0 24px;">
        ${buildSectionHeading("Overview")}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 16px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tbody>
            ${overviewRows.join("")}
          </tbody>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 24px;">
        ${buildSectionHeading("Customer")}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 16px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tbody>
            ${customerRows.join("")}
          </tbody>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 24px;">
        ${buildSectionHeading("Schedule & location")}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 8px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tbody>
            ${scheduleRows.join("")}
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 24px 16px 24px;">
        <p style="margin: 4px 0 0 0; font-size: 13px; line-height: 1.6; color: ${EMAIL_THEME.text};">
          ${escapeHtml(booking.address)}${
    booking.apartment_unit
      ? "<br/>" + escapeHtml(booking.apartment_unit)
      : ""
  }
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 24px;">
        ${buildSectionHeading("Property & job details")}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 16px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tbody>
            ${propertyRows.join("")}
          </tbody>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 24px;">
        ${buildSectionHeading("Pricing breakdown")}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 16px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tbody>
            ${pricingRows.join("")}
          </tbody>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 24px;">
        ${buildSectionHeading("Instructions & internal notes")}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 8px 24px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.7; color: ${EMAIL_THEME.text};">
          ${
            booking.instructions
              ? escapeHtml(booking.instructions)
              : "No additional instructions provided."
          }
        </p>
      </td>
    </tr>
    ${
      internalRows.length > 0
        ? `<tr>
             <td style="padding: 0 24px 24px 24px;">
               <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                 <tbody>
                   ${internalRows.join("")}
                 </tbody>
               </table>
             </td>
           </tr>`
        : ""
    }
  `;

  return wrapEmailHtml(bodyInner);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function wrapEmailHtml(innerRows: string): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Booking confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${EMAIL_THEME.pageBg};">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${EMAIL_THEME.pageBg}; padding: 24px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background-color: ${EMAIL_THEME.card}; border-radius: 12px; overflow: hidden; box-shadow: ${EMAIL_THEME.shadow}; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${EMAIL_THEME.text};">
              <tr>
                <td style="padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.2); background-color: ${EMAIL_THEME.primary}; background-image: linear-gradient(135deg, ${EMAIL_THEME.primary} 0%, ${EMAIL_THEME.primaryHover} 100%);">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="text-align: left;">
                        <span style="display: inline-block; font-size: 16px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">
                          Shalean
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <span style="display: inline-block; padding: 4px 10px; border-radius: 999px; background-color: ${EMAIL_THEME.teal}; color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">
                          Booking confirmed
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${innerRows}
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

function buildSectionHeading(label: string): string {
  return `
    <h2 style="margin: 0; font-size: 13px; line-height: 1.5; color: ${EMAIL_THEME.primary}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">
      ${escapeHtml(label)}
    </h2>
  `;
}

function buildKeyValueRow(
  label: string,
  value: string,
  valueAlign: "left" | "right" = "right"
): string {
  const align = valueAlign === "left" ? "left" : "right";
  return `
    <tr>
      <td style="padding: 4px 0; font-size: 13px; line-height: 1.6; color: ${EMAIL_THEME.muted}; width: 45%; vertical-align: top;">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 4px 0; font-size: 13px; line-height: 1.6; color: ${EMAIL_THEME.text}; width: 55%; text-align: ${align}; vertical-align: top;">
        ${value}
      </td>
    </tr>
  `;
}

