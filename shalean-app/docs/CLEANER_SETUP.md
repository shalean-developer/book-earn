# Cleaner dashboard and booking form alignment

The booking form uses **fixed cleaner/team IDs** when a customer selects a cleaner or team. The Cleaner dashboard shows jobs and earnings for the **signed-in cleaner**, matched by their profile.

For a cleaner account to see the same jobs that were assigned to them via the booking form, their profile must use the **same ID** as the form.

## How it works

- **Booking form** (e.g. `BookingFlowFromUrl`): customers choose from individual cleaners (`c1`, `c2`, `c3`, `c4`) or teams (`t1`, `t2`, `t3`). The chosen `cleaner_id` or `team_id` is stored on the booking.
- **Cleaner dashboard**: jobs and earnings are loaded with `getMyCleanerJobs` / `getCleanerEarningsAndBalance`, which use the signed-in cleaner’s **profile id**. That id is `profiles.cleaner_id` if set, otherwise `profiles.id` (auth UUID).
- **Link:** Bookings store `cleaner_id` in `{"c1","c2","c3","c4"}`. So the signed-in cleaner’s **`profiles.cleaner_id`** must be set to the matching form ID (e.g. `c1` for “Ashley Byrd”) for their dashboard to show those jobs and earnings.

## What you need to do

For each cleaner user who should see jobs created by the booking form:

1. Identify which form “persona” they represent (e.g. Ashley Byrd → `c1`, Nomvula Dlamini → `c2`, Fatima Hartley → `c3`, Thandiwe Mokoena → `c4`).
2. Set **`profiles.cleaner_id`** for that user to that ID (e.g. `'c1'`).

Example (Supabase SQL or dashboard):

```sql
-- Example: set the cleaner who logs in as "Ashley" to form ID c1
UPDATE public.profiles
SET cleaner_id = 'c1'
WHERE email = 'ashley@example.com' AND role = 'cleaner';
```

There is no in-app UI to set `cleaner_id`; use the Supabase dashboard, SQL, or a one-off admin/migration script.

## Form ID reference

| Form ID | Individual cleaner / team name (display) |
|--------|-------------------------------------------|
| c1     | Ashley Byrd                               |
| c2     | Nomvula Dlamini                           |
| c3     | Fatima Hartley                            |
| c4     | Thandiwe Mokoena                          |
| t1     | Team A — Precision Squad                  |
| t2     | Team B — Speed Force                      |
| t3     | Team C — Elite Clean                      |

Team bookings use `team_id` (t1, t2, t3); individual bookings use `cleaner_id` (c1–c4). The Cleaner dashboard matches on `cleaner_id` only, so team assignments (t1/t2/t3) do not show under a single cleaner’s Jobs unless you have a separate mapping (e.g. team lead’s `cleaner_id`).
