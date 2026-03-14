# Referral flow – end-to-end verification

This doc confirms how the referral and R100 reward flow works and when both customers get their reward.

## Flow summary

1. **Referrer** shares a link that includes `?ref=<base64(referrer_email)>` (e.g. from Customer dashboard → Refer a Friend → Copy / Email / WhatsApp).
2. **Referee** uses that link to **sign up** and/or **book**.
3. When the referee’s **first booking is marked "completed"** (clean done), **R100 is granted to both** referrer and referee (if the referee has a customer account).

## Step-by-step

| Step | What happens | Where |
|------|----------------|------|
| 1 | Referrer opens “Refer a Friend” and gets link with `?ref=base64(their email)`. | `CustomerDashboard.tsx` (share sheet) |
| 2a | Referee signs up with `?ref=` in URL → ref sent in body. | `app/signup/page.tsx` → `POST /api/auth/signup` |
| 2b | Signup API decodes ref, sets `profiles.referred_by`, inserts `referrals` (pending). | `app/api/auth/signup/route.ts`, `lib/referral.ts` (decodeRefParam) |
| 3a | Referee books (with ref in URL or from localStorage) → ref sent in body. | `BookingSystem.tsx` → `POST /api/booking/initialize` |
| 3b | Initialize API decodes ref, stores `bookings.referred_by_email`. | `app/api/booking/initialize/route.ts`, `mapToBookingRecord` |
| 4 | Referee pays → booking status becomes `confirmed`. | Paystack → `POST /api/booking/verify` |
| 5 | Admin (or process) sets booking status to **`completed`**. | `PATCH /api/admin/bookings/[id]` with `{ "status": "completed" }` |
| 6 | `processReferralCompletion` runs: grants R100 to referrer and (if they have a profile) to referee. | `lib/referral.ts`, `app/api/admin/bookings/[id]/route.ts` |

## When the reward is granted

- **Trigger:** When the referee’s **booking status is set to `"completed"`** (first clean done), not on signup or payment.
- **Referrer:** Always gets R100 when that first completed booking is referred (valid referrer email and no duplicate referral for this referee).
- **Referee:** Gets R100 only if they have a **customer profile** (signed up) at the time the booking is marked completed. Guest-only bookers do not get a wallet credit (they have no profile to credit).

## Requirements for “both get reward”

- Referee **signs up** (with ref in URL so `referrals` has a row and `profiles.referred_by` is set).
- Referee **books** using the referral link (so `bookings.referred_by_email` is set).
- Referee uses the **same email** for signup and booking (so the referee profile is found by `customer_email` when completing).
- Someone with admin rights **marks that booking as `completed`** (e.g. via admin PATCH).

## Database

- Run `sql/referral_and_wallet.sql` in your Supabase project so that:
  - `profiles`: `referral_code`, `referred_by`
  - `referrals`: referrer/referee and status
  - `customer_wallet_credits`: R100 entries
  - `bookings.referred_by_email`: referrer attribution

## Quick checks

- **Signup with ref:** Request body includes `ref: "<base64 referrer email>"` when user landed with `?ref=...`.
- **Booking with ref:** Request body to `/api/booking/initialize` includes `ref` when user had ref in URL or in localStorage.
- **Credits:** After marking the referee’s first referred booking as `completed`, both referrer and referee (if they have a profile) should see R100 in Customer dashboard → Wallet (from `GET /api/customer/wallet`).
