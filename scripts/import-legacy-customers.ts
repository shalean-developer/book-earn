import { createClient } from "@supabase/supabase-js";

type LegacyCustomerRow = {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  address_line1: string | null;
  address_suburb: string | null;
  address_city: string | null;
  role: string | null;
};

type ProfilesInsert = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "customer";
  address_line1?: string | null;
  address_city?: string | null;
  address_region?: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function buildName(first: string | null, last: string | null): string | null {
  const parts = [first ?? "", last ?? ""]
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) return null;
  return parts.join(" ");
}

function randomPassword(): string {
  // Simple strong-ish random password generator for one-off import.
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const length = 16;
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * chars.length);
    out += chars[idx];
  }
  return out;
}

async function getOrCreateAuthUser(email: string, name: string | null) {
  const password = randomPassword();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { name } : undefined,
  });

  if (data?.user) {
    return { user: data.user, created: true as const };
  }

  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (msg.includes("already registered") || msg.includes("duplicate key")) {
      const { data: list, error: listError } =
        await supabase.auth.admin.listUsers();
      if (listError) {
        throw listError;
      }
      const existing =
        list?.users?.find(
          (u: { email?: string | null }) =>
            (u.email ?? "").toLowerCase() === email.toLowerCase(),
        ) ?? null;
      if (!existing) {
        throw new Error(
          `Auth user with email ${email} seems to exist but was not found in listUsers()`,
        );
      }
      return { user: existing, created: false as const };
    }
    throw error;
  }

  throw new Error(`createUser for ${email} returned no user and no error`);
}

function mapToProfile(
  authUserId: string,
  row: LegacyCustomerRow,
): ProfilesInsert {
  const email = (row.email ?? "").trim().toLowerCase() || null;
  const phone = (row.phone ?? "").trim() || null;
  const name = buildName(row.first_name, row.last_name);

  const address_line1 = (row.address_line1 ?? "").trim() || null;
  const city = (row.address_city ?? "").trim() || null;
  const suburb = (row.address_suburb ?? "").trim() || null;

  const profile: ProfilesInsert = {
    id: authUserId,
    name,
    email,
    phone,
    role: "customer",
  };

  if (address_line1) {
    profile.address_line1 = address_line1;
  }
  if (city) {
    profile.address_city = city;
  }
  if (suburb) {
    // Map legacy suburb to address_region if that column exists in profiles.
    profile.address_region = suburb;
  }

  return profile;
}

async function importFromTable(tableName: string) {
  // eslint-disable-next-line no-console
  console.log(`Starting import from ${tableName} ...`);

  const { data, error } = await supabase
    .from(tableName)
    .select<LegacyCustomerRow[]>(
      "id, email, phone, first_name, last_name, address_line1, address_suburb, address_city, role",
    );

  if (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to load rows from ${tableName}:`, error);
    process.exit(1);
  }

  const rows = data ?? [];
  // eslint-disable-next-line no-console
  console.log(`Loaded ${rows.length} legacy customers from ${tableName}.`);

  for (const row of rows) {
    const rawEmail = (row.email ?? "").trim().toLowerCase();
    if (!rawEmail) {
      // eslint-disable-next-line no-console
      console.warn(`Skipping row ${row.id} with empty email`);
      // eslint-disable-next-line no-continue
      continue;
    }

    if (row.role && row.role !== "customer") {
      // eslint-disable-next-line no-console
      console.warn(
        `Skipping row ${row.id} with non-customer role: ${row.role}`,
      );
      // eslint-disable-next-line no-continue
      continue;
    }

    try {
      const { user, created } = await getOrCreateAuthUser(
        rawEmail,
        buildName(row.first_name, row.last_name),
      );

      const profileRow = mapToProfile(user.id as string, row);

      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update(profileRow)
        .eq("id", profileRow.id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        const msg = (updateError.message ?? "").toLowerCase();
        if (
          msg.includes("foreign key") ||
          msg.includes("violates foreign key constraint")
        ) {
          throw updateError;
        }
      }

      if (!updated) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert(profileRow);
        if (insertError) {
          throw insertError;
        }
      }

      // eslint-disable-next-line no-console
      console.log(
        `Imported customer ${rawEmail} (auth ${
          created ? "created" : "existing"
        }, profile id ${profileRow.id})`,
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `Error importing legacy customer ${row.id} (${rawEmail}):`,
        err,
      );
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Finished import from ${tableName}.`);
}

async function main() {
  const tableName =
    process.argv[2] && process.argv[2].trim()
      ? process.argv[2].trim()
      : "legacy_customers";

  await importFromTable(tableName);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

