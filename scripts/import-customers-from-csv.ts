/**
 * Import customers from a CSV file (e.g. customers_rows.csv) into the app.
 * Creates Supabase Auth users (or reuses existing by email) and upserts profiles.
 *
 * Usage:
 *   npx tsx scripts/import-customers-from-csv.ts [path/to/customers_rows.csv]
 *
 * Default path: ./customers_rows.csv (relative to cwd)
 *
 * Requires .env.local (or env) with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env.local into process.env so Supabase keys are available
function loadEnvLocal() {
  const paths = [
    resolve(process.cwd(), ".env.local"),
    resolve(__dirname, "..", ".env.local"),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      const content = readFileSync(p, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eq = trimmed.indexOf("=");
          if (eq > 0) {
            const key = trimmed.slice(0, eq).trim();
            let val = trimmed.slice(eq + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) process.env[key] = val;
          }
        }
      }
      return;
    }
  }
}

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

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Load .env.local or set env.",
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
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const length = 16;
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
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
    const isDuplicate =
      (error as { code?: string }).code === "email_exists" ||
      msg.includes("already registered") ||
      msg.includes("duplicate key");
    if (isDuplicate) {
      // Paginate through users to find existing by email (listUsers returns 50 per page)
      let page = 1;
      const perPage = 100;
      while (true) {
        const { data: list, error: listError } =
          await supabase.auth.admin.listUsers({ page, perPage });
        if (listError) throw listError;
        const existing =
          list?.users?.find(
            (u: { email?: string | null }) =>
              (u.email ?? "").toLowerCase() === email.toLowerCase(),
          ) ?? null;
        if (existing) return { user: existing, created: false as const };
        if (!list?.users?.length || (list.users.length < perPage)) break;
        page += 1;
      }
      throw new Error(
        `Auth user with email ${email} exists but was not found in listUsers (try again or add manually)`,
      );
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

  if (address_line1) profile.address_line1 = address_line1;
  if (city) profile.address_city = city;
  if (suburb) profile.address_region = suburb;

  return profile;
}

/** Parse CSV with quoted fields (handles commas and newlines inside quotes). */
function parseCsv(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const c = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }

    if (c === ",") {
      current.push(field);
      field = "";
      continue;
    }

    if (c === "\n" || c === "\r") {
      if (c === "\r" && next === "\n") i += 1;
      current.push(field);
      field = "";
      if (current.some((cell) => cell.length > 0)) {
        rows.push(current);
      }
      current = [];
      continue;
    }

    field += c;
  }

  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  const result: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r += 1) {
    const row: Record<string, string> = {};
    const cells = rows[r];
    for (let c = 0; c < headers.length; c += 1) {
      row[headers[c]] = (cells[c] ?? "").trim();
    }
    result.push(row);
  }

  return result;
}

function csvRowToLegacy(row: Record<string, string>): LegacyCustomerRow {
  return {
    id: row.id ?? "",
    email: row.email ?? null,
    phone: row.phone ?? null,
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    address_line1: row.address_line1 ?? null,
    address_suburb: row.address_suburb ?? null,
    address_city: row.address_city ?? null,
    role: row.role ?? null,
  };
}

async function main() {
  const csvPath =
    process.argv[2]?.trim() ||
    resolve(process.cwd(), "customers_rows.csv");

  // eslint-disable-next-line no-console
  console.log(`Reading ${csvPath} ...`);

  let csvText: string;
  try {
    csvText = readFileSync(csvPath, "utf-8");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to read file:", err);
    process.exit(1);
  }

  const rows = parseCsv(csvText);
  // eslint-disable-next-line no-console
  console.log(`Parsed ${rows.length} data rows. Starting import ...`);

  let ok = 0;
  let skip = 0;
  let err = 0;

  for (const row of rows) {
    const legacy = csvRowToLegacy(row);
    const rawEmail = (legacy.email ?? "").trim().toLowerCase();

    if (!rawEmail) {
      skip += 1;
      continue;
    }

    if (legacy.role && legacy.role !== "customer") {
      skip += 1;
      continue;
    }

    try {
      const { user, created } = await getOrCreateAuthUser(
        rawEmail,
        buildName(legacy.first_name, legacy.last_name),
      );

      const profileRow = mapToProfile(user.id as string, legacy);

      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update(profileRow)
        .eq("id", profileRow.id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        const msg = (updateError.message ?? "").toLowerCase();
        if (
          !msg.includes("foreign key") &&
          !msg.includes("violates foreign key constraint")
        ) {
          throw updateError;
        }
      }

      if (!updated) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert(profileRow);
        if (insertError) throw insertError;
      }

      ok += 1;
      // eslint-disable-next-line no-console
      console.log(
        `  [${ok}] ${rawEmail} (auth ${created ? "created" : "existing"})`,
      );
    } catch (e) {
      err += 1;
      // eslint-disable-next-line no-console
      console.error(`  ERROR ${rawEmail}:`, e);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Done. Imported: ${ok}, skipped: ${skip}, errors: ${err}.`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
