# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up Supabase environment variables.
# Create a .env.local file in the root directory with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=your-project-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Get these from: https://supabase.com/dashboard/project/book-earn/settings/api

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Next.js
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database & Backend)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Supabase Setup

This project uses Supabase for database and backend services. To set up Supabase:

1. **Get your Supabase credentials:**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/book-earn/settings/api)
   - Navigate to Settings > API
   - Copy your Project URL and anon/public key

2. **Create environment variables:**
   - Create a `.env.local` file in the root directory
   - Add the following variables:
     ```env
     # Supabase (existing)
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Use Supabase in your code:**
   - **Client-side:** Import from `@/lib/supabase`
     ```typescript
     import { supabase } from '@/lib/supabase'
     ```
   - **Server-side (Server Components/Actions):** Import from `@/lib/supabase-server`
     ```typescript
     import { createClient } from '@/lib/supabase-server'
     const supabase = await createClient()
     ```

## Payments (Paystack) Setup

This project uses Paystack in **test mode** to securely process booking payments.

1. **Get your Paystack test keys:**
   - Go to your [Paystack Dashboard](https://dashboard.paystack.com/)
   - Navigate to Settings → API Keys & Webhooks
   - Copy your Test Secret Key and Test Public Key

2. **Environment variables:**
   - Add the following to `.env.local`:

     ```env
     # Paystack (test mode)
     PAYSTACK_SECRET_KEY=pk_test_your_secret_key_here
     PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here

     # Base URL of your app (used for Paystack callback URLs)
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     ```

   - Do **not** prefix the secret key with `NEXT_PUBLIC_` – it must remain server-only.

## Email (Resend) Setup

This project uses [Resend](https://resend.com/) to send booking confirmation emails to the customer and admin.

1. **Get your Resend API key:**
   - Go to your [Resend Dashboard](https://resend.com/)
   - Create a new API key with `Full Access` or appropriate permissions

2. **Environment variables:**
   - Add the following to `.env.local`:

     ```env
     # Resend
     RESEND_API_KEY=re_your_resend_api_key_here
     RESEND_FROM_EMAIL=Bookings <bookings@yourdomain.com>

     # Admin notifications
     BOOKING_ADMIN_EMAIL=you@example.com
     ```

3. **Usage in code:**
   - The booking verification API route will call a helper from `@/lib/email` which uses these environment variables to send:
     - A confirmation email to the customer’s address from the booking form.
     - A notification email to `BOOKING_ADMIN_EMAIL` with full booking details.

## Booking & Payments Flow (Overview)

- The `BookingSystem` component collects all booking details and pricing.
- When the customer clicks **“Securely Pay”**, the client calls `/api/booking/initialize`:
  - Inserts a pending booking row into the Supabase `bookings` table.
  - Calls Paystack `transaction/initialize` and returns the hosted payment URL.
- After payment, Paystack redirects back to `/booking/verify`:
  - `/api/booking/verify` calls Paystack `transaction/verify`, updates the booking status to `confirmed`, and sends Resend emails to the customer and admin.

### How to test end-to-end in Paystack test mode

1. Start the dev server:
   ```sh
   npm run dev
   ```
2. Ensure your `.env.local` contains valid **test** keys for Supabase, Paystack, and Resend, and that the `NEXT_PUBLIC_APP_URL` matches where the app is running (e.g. `http://localhost:3000`).
3. Visit `/booking/your-cleaning-plan`, complete all steps, and click **“Securely Pay”**.
4. You should be redirected to the Paystack hosted page. Use Paystack’s test card details to complete the payment.
5. After payment, you’ll be redirected to `/booking/verify?reference=...` where the app will:
   - Verify the transaction with Paystack.
   - Update the corresponding row in the Supabase `bookings` table to `confirmed` or `failed`.
   - Send confirmation emails through Resend (one to the customer, one to `BOOKING_ADMIN_EMAIL`).


