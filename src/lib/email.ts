import { resend } from "@/lib/resend";
import type { BookingRecord, PricingBreakdown } from "@/lib/types/booking";
import { formatEstimatedDuration } from "@/lib/duration";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Bookings <no-reply@example.com>";
const ADMIN_EMAIL = process.env.BOOKING_ADMIN_EMAIL;
const REPLY_TO_EMAIL =
  process.env.BOOKING_REPLY_TO_EMAIL || "bookings@shalean.com";
const BCC_EMAIL = process.env.BOOKING_BCC_EMAIL || "accounts@shalean.com";

interface SendBookingEmailsArgs {
  booking: BookingRecord;
  pricing: PricingBreakdown;
}

export async function sendBookingEmails({
  booking,
  pricing,
}: SendBookingEmailsArgs) {
  if (!booking.email) {
    return;
  }

  const customerHtml = buildCustomerEmailHtml(booking, pricing);
  const adminHtml = buildAdminEmailHtml(booking, pricing);

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

function buildCustomerEmailHtml(
  booking: BookingRecord,
  pricing: PricingBreakdown
): string {
  const cleaningFrequency = booking.cleaning_frequency
    ? escapeHtml(booking.cleaning_frequency)
    : null;

  const workingArea = booking.working_area
    ? escapeHtml(booking.working_area)
    : null;

  const hasDiscount = pricing.discountAmount && pricing.discountAmount > 0;
  const hasTip = pricing.tipAmount && pricing.tipAmount > 0;

  const currency = escapeHtml(booking.currency);

  const propertyDetailsRows: string[] = [];
  propertyDetailsRows.push(
    buildKeyValueRow("Property type", escapeHtml(booking.property_type))
  );
  propertyDetailsRows.push(
    buildKeyValueRow("Bedrooms", String(booking.bedrooms))
  );
  propertyDetailsRows.push(
    buildKeyValueRow("Bathrooms", String(booking.bathrooms))
  );

  if (booking.extra_rooms && booking.extra_rooms > 0) {
    propertyDetailsRows.push(
      buildKeyValueRow("Extra rooms", String(booking.extra_rooms))
    );
  }

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

  const headerTitle = "Your Shalean booking is confirmed";
  const headerSubtitle = `${escapeHtml(booking.date)} at ${escapeHtml(
    booking.time
  )}`;

  const bodyInner = `
    <tr>
      <td style="padding: 24px 24px 8px 24px; text-align: left;">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; line-height: 1.3; color: #0f172a; font-weight: 600;">
          ${headerTitle}
        </h1>
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #4b5563;">
          ${headerSubtitle}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 8px 24px 16px 24px; text-align: left;">
        <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; color: #111827;">
          Hi ${escapeHtml(
            booking.name
          )}, thank you for booking your cleaning with Shalean.
        </p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #111827;">
          Your booking is confirmed and we’ve reserved a cleaning slot for you.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 8px 24px 0 24px;">
        ${buildSectionHeading("Booking summary")}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 16px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tbody>
            ${buildKeyValueRow("Reference", escapeHtml(booking.reference))}
            ${buildKeyValueRow("Service", escapeHtml(booking.service))}
            ${
              cleaningFrequency
                ? buildKeyValueRow("Frequency", cleaningFrequency)
                : ""
            }
            ${
              workingArea
                ? buildKeyValueRow("Working area", workingArea)
                : ""
            }
            ${buildKeyValueRow("Date", escapeHtml(booking.date))}
            ${buildKeyValueRow("Time", escapeHtml(booking.time))}
            ${
              booking.estimated_duration_minutes != null
                ? buildKeyValueRow(
                    "Estimated duration",
                    formatEstimatedDuration(Number(booking.estimated_duration_minutes))
                  )
                : ""
            }
          </tbody>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 24px;">
        ${buildSectionHeading("Address & property")}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 16px 24px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; color: #111827;">
          ${escapeHtml(booking.address)}${
    booking.apartment_unit
      ? "<br/>" + escapeHtml(booking.apartment_unit)
      : ""
  }
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tbody>
            ${propertyDetailsRows.join("")}
          </tbody>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 24px;">
        ${buildSectionHeading("Pricing")}
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
        ${buildSectionHeading("Before we arrive")}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 16px 24px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.7; color: #4b5563;">
          Please ensure we have easy access to your property at the scheduled time. If your building requires access codes, tags, or special instructions, reply to this email so we can share them with your cleaning team.
        </p>
        ${
          booking.instructions
            ? `<p style="margin: 0; font-size: 13px; line-height: 1.7; color: #4b5563;">
                 <strong>Special instructions you provided:</strong><br/>
                 ${escapeHtml(booking.instructions)}
               </p>`
            : ""
        }
      </td>
    </tr>

    <tr>
      <td style="padding: 0 24px;">
        ${buildSectionHeading("Change or cancel your booking")}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 16px 24px;">
        <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #4b5563;">
          If you need to make any changes or cancel your booking, simply reply to this email and include your booking reference <strong>${escapeHtml(
            booking.reference
          )}</strong>. Our team will assist you as soon as possible.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 24px;">
        ${buildSectionHeading("Thank you for choosing Shalean")}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 24px 24px 24px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.7; color: #4b5563;">
          We’re looking forward to taking care of your space. If you have any questions at all, just hit reply and we’ll be happy to help.
        </p>
        <p style="margin: 0; font-size: 12px; line-height: 1.7; color: #9ca3af;">
          Shalean • Professional cleaning services
        </p>
      </td>
    </tr>
  `;

  return wrapEmailHtml(bodyInner);
}

function buildAdminEmailHtml(
  booking: BookingRecord,
  pricing: PricingBreakdown
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
    buildKeyValueRow("Name", escapeHtml(booking.name || ""))
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
  if (booking.cleaner_id) {
    internalRows.push(
      buildKeyValueRow("Cleaner ID", escapeHtml(booking.cleaner_id))
    );
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
        <h1 style="margin: 0 0 4px 0; font-size: 20px; line-height: 1.3; color: #0f172a; font-weight: 600;">
          ${headerTitle}
        </h1>
        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #4b5563;">
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
        <p style="margin: 4px 0 0 0; font-size: 13px; line-height: 1.6; color: #111827;">
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
        <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.7; color: #111827;">
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
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f3f4f6; padding: 24px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08); font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a;">
              <tr>
                <td style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb; background-color: #0f172a;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="text-align: left;">
                        <span style="display: inline-block; font-size: 16px; font-weight: 600; color: #f9fafb;">
                          Shalean
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <span style="display: inline-block; padding: 4px 10px; border-radius: 999px; background-color: #22c55e; color: #052e16; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">
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
    <h2 style="margin: 0; font-size: 13px; line-height: 1.5; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">
      ${escapeHtml(label)}
    </h2>
  `;
}

function buildKeyValueRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 4px 0; font-size: 13px; line-height: 1.6; color: #6b7280; width: 45%; vertical-align: top;">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 4px 0; font-size: 13px; line-height: 1.6; color: #111827; width: 55%; text-align: right; vertical-align: top;">
        ${value}
      </td>
    </tr>
  `;
}

