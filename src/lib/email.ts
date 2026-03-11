import { resend } from "@/lib/resend";
import type { BookingRecord, PricingBreakdown } from "@/lib/types/booking";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Bookings <no-reply@example.com>";
const ADMIN_EMAIL = process.env.BOOKING_ADMIN_EMAIL;

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
    to: booking.email,
    subject: `Your Shalean booking is confirmed – ${booking.date} at ${booking.time}`,
    html: customerHtml,
  });

  if (ADMIN_EMAIL) {
    await resend.emails.send({
      from: FROM_EMAIL,
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
  return `
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a;">
    <h1 style="font-size: 20px; margin-bottom: 12px;">Thank you for booking with Shalean!</h1>
    <p style="font-size: 14px; margin-bottom: 8px;">
      Hi ${escapeHtml(booking.name)}, your cleaning booking is confirmed.
    </p>
    <p style="font-size: 14px; margin-bottom: 8px;">
      <strong>Reference:</strong> ${escapeHtml(booking.reference)}
    </p>
    <p style="font-size: 14px; margin-bottom: 16px;">
      <strong>Date:</strong> ${escapeHtml(booking.date)}<br/>
      <strong>Time:</strong> ${escapeHtml(booking.time)}<br/>
      <strong>Service:</strong> ${escapeHtml(booking.service)}<br/>
      <strong>Total paid:</strong> ${escapeHtml(booking.currency)} ${pricing.total.toFixed(
        2
      )}
    </p>
    <p style="font-size: 14px; margin-bottom: 16px;">
      <strong>Address:</strong><br/>
      ${escapeHtml(booking.address)}${
    booking.apartment_unit ? "<br/>" + escapeHtml(booking.apartment_unit) : ""
  }
    </p>
    <p style="font-size: 13px; color: #6b7280;">
      If you have any questions or need to make changes, please reply to this email and include your booking reference.
    </p>
  </div>
  `;
}

function buildAdminEmailHtml(
  booking: BookingRecord,
  pricing: PricingBreakdown
): string {
  return `
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a;">
    <h1 style="font-size: 18px; margin-bottom: 12px;">New booking confirmed</h1>
    <p style="font-size: 14px; margin-bottom: 8px;">
      <strong>Reference:</strong> ${escapeHtml(booking.reference)}
    </p>
    <p style="font-size: 14px; margin-bottom: 8px;">
      <strong>Customer:</strong> ${escapeHtml(booking.name)}<br/>
      <strong>Email:</strong> ${escapeHtml(booking.email)}<br/>
      <strong>Phone:</strong> ${escapeHtml(booking.phone)}
    </p>
    <p style="font-size: 14px; margin-bottom: 8px;">
      <strong>Service:</strong> ${escapeHtml(booking.service)}<br/>
      <strong>Date:</strong> ${escapeHtml(booking.date)}<br/>
      <strong>Time:</strong> ${escapeHtml(booking.time)}<br/>
      <strong>Working area:</strong> ${escapeHtml(booking.working_area)}
    </p>
    <p style="font-size: 14px; margin-bottom: 8px;">
      <strong>Property type:</strong> ${escapeHtml(
        booking.property_type
      )}<br/>
      <strong>Bedrooms:</strong> ${booking.bedrooms}<br/>
      <strong>Bathrooms:</strong> ${booking.bathrooms}<br/>
      <strong>Extras:</strong> ${
        booking.extras && booking.extras.length > 0
          ? escapeHtml(booking.extras.join(", "))
          : "None"
      }
    </p>
    <p style="font-size: 14px; margin-bottom: 8px;">
      <strong>Total paid:</strong> ${escapeHtml(
        booking.currency
      )} ${pricing.total.toFixed(2)}<br/>
      <strong>Subtotal:</strong> ${escapeHtml(
        booking.currency
      )} ${pricing.subtotal.toFixed(2)}<br/>
      <strong>Discount:</strong> ${escapeHtml(
        booking.currency
      )} ${pricing.discountAmount.toFixed(2)}<br/>
      <strong>Tip:</strong> ${escapeHtml(
        booking.currency
      )} ${pricing.tipAmount.toFixed(2)}
    </p>
    <p style="font-size: 14px; margin-bottom: 8px;">
      <strong>Instructions:</strong><br/>
      ${
        booking.instructions
          ? escapeHtml(booking.instructions)
          : "No additional instructions."
      }
    </p>
  </div>
  `;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

