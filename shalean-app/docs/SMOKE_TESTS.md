# Dashboard and booking linkage – smoke tests

Use these steps to verify that the Booking form, Customer dashboard, Cleaner dashboard, and Admin dashboard are linked correctly.

## 1. Customer dashboard: bookings by email

1. As a **guest**, complete a booking using the booking flow. Use an email you can log in with later (e.g. `test@example.com`).
2. Finish payment so the booking is created (use test card if in Paystack test mode).
3. Log in as a **customer** with the **same email** used in the booking.
4. Open **Portal** (customer dashboard).
5. **Expected:** The new booking appears in the Bookings tab (and in Overview recent activity).

## 2. Admin dashboard: filters and list

1. Log in as an **admin** user.
2. Open the **Admin** dashboard and go to the **Bookings** tab.
3. Confirm the list shows bookings (including any created in test 1).
4. Change filters (e.g. status, payment status, service, or date range) and apply.
5. **Expected:** The list updates to match the selected filters.

## 3. Cleaner dashboard: jobs when `cleaner_id` is set

1. Ensure at least one **cleaner** account has `profiles.cleaner_id` set to a form ID (e.g. `'c1'` for Ashley Byrd). See [CLEANER_SETUP.md](./CLEANER_SETUP.md).
2. As a guest or customer, create a booking and select **Ashley Byrd** (or the cleaner that matches that profile).
3. Complete payment so the booking is created.
4. Log in as the **cleaner** whose `profiles.cleaner_id = 'c1'`.
5. Open the cleaner dashboard and go to the **Jobs** tab (and ensure the booking date is today, or check the correct date).
6. **Expected:** The new job appears in Today’s Schedule (or the relevant day).

If the cleaner’s `profiles.cleaner_id` is not set, their Jobs tab will be empty for bookings created via the form (see CLEANER_SETUP.md).
