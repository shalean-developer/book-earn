/**
 * Canonical service area names for booking (step 1) and address inference.
 * Sourced from marketing / coverage list; keep spelling aligned with ops.
 */

export const WORKING_AREAS: readonly string[] = [
  "Amandelrug",
  "Athlone",
  "Bantry Bay",
  "Belhar",
  "Bellville",
  "Bellville South",
  "Bergvliet",
  "Bishopscourt",
  "Bloubergrant",
  "Bloubergstrand",
  "Bo-Kaap",
  "Bothasig",
  "Brackenfell",
  "Brooklyn",
  "Camps Bay",
  "Cape Gate",
  "Cape Town",
  "Century City",
  "Chempet",
  "City Bowl",
  "Clareinch",
  "Claremont",
  "Clifton",
  "Clovelly",
  "Constantia",
  "Crawford",
  "D'urbanvale",
  "De Waterkant",
  "Devil's Peak Estate",
  "Diep River",
  "Durbanville",
  "Edgemead",
  "Epping",
  "Faure",
  "Firgrove",
  "Fish Hoek",
  "Foreshore",
  "Fresnaye",
  "Gardens",
  "George",
  "Glencairn",
  "Glosderry",
  "Goodwood",
  "Green Point",
  "Groote Schuur",
  "Harfield Village",
  "Heathfield",
  "Helderberg",
  "Hermanus",
  "Higgovale",
  "Hout Bay",
  "Howard Place",
  "Kalk Bay",
  "Kenilworth",
  "Kensington",
  "Kenwyn",
  "Kirstenhof",
  "Kommetjie",
  "Knysna",
  "Kraaifontein",
  "Kreupelbosch",
  "Kuils River",
  "Langebaan",
  "Lansdowne",
  "Llandudno",
  "Lower Vrede",
  "Macassar",
  "Maitland",
  "Marconi Beam",
  "Meadowridge",
  "Milnerton",
  "Monte Vista",
  "Mossel Bay",
  "Mouille Point",
  "Mowbray",
  "Mutual Park",
  "Newlands",
  "Noordhoek",
  "Observatory",
  "Old Oak",
  "Oranjezicht",
  "Ottery",
  "Oudshoorn",
  "Paarden Island",
  "Paarl",
  "Panorama",
  "Parow",
  "Parow East",
  "Pinelands",
  "Plattekloof",
  "Plettenberg Bay",
  "Plumstead",
  "Ravensmead",
  "Retreat",
  "Rhodes",
  "Rondebosch",
  "Rondebosch East",
  "Salt River",
  "Scarborough",
  "Schotse Kloof",
  "Sea Point",
  "Simon's Town",
  "Southfield",
  "St James",
  "Steenberg",
  "Stellenbosch",
  "Sun Valley",
  "Sunnyside",
  "Sunset Beach",
  "Tableview",
  "Tamboerskloof",
  "Thornton",
  "Three Anchor Bay",
  "Tokai",
  "Tyger Valley",
  "Tygerberg",
  "University Estate",
  "Van Riebeeckshof",
  "Vredehoek",
  "Walmer Estate",
  "Waterfront",
  "Welgemoed",
  "West Beach",
  "Wetton",
  "Wittebome",
  "Woodstock",
  "Worcester",
  "Wynberg",
  "Ysterplaat",
  "Zonnebloem",
].sort((a, b) => a.localeCompare(b, "en-ZA", { sensitivity: "base" }));

const CHUNK = 40;

/** Scrollable groups (alphabetical ranges) so every area appears once. */
export function buildWorkingAreaGroups(
  areas: readonly string[] = WORKING_AREAS
): { label: string; areas: string[] }[] {
  const sorted = [...areas].sort((a, b) =>
    a.localeCompare(b, "en-ZA", { sensitivity: "base" })
  );
  const groups: { label: string; areas: string[] }[] = [];
  for (let i = 0; i < sorted.length; i += CHUNK) {
    const chunk = sorted.slice(i, i + CHUNK);
    const first = chunk[0] ?? "?";
    const last = chunk[chunk.length - 1] ?? "?";
    const a = first.charAt(0).toUpperCase();
    const z = last.charAt(0).toUpperCase();
    groups.push({
      label: a === z ? `${a}` : `${a}–${z}`,
      areas: chunk,
    });
  }
  return groups;
}

export const WORKING_AREA_GROUPS = buildWorkingAreaGroups();

/**
 * Match free-text address to a service area (longest names first).
 * Also matches when suburb is written without spaces (e.g. Tableview vs Table View).
 */
export function inferWorkingAreaFromAddress(address: string): string | undefined {
  const normalizedAddr = address.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalizedAddr) return undefined;
  const compactAddr = normalizedAddr.replace(/\s/g, "");
  const sorted = [...WORKING_AREAS].sort((a, b) => b.length - a.length);
  for (const area of sorted) {
    const lower = area.toLowerCase();
    if (normalizedAddr.includes(lower)) {
      return area;
    }
    const compactArea = lower.replace(/\s/g, "");
    if (compactArea.length >= 4 && compactAddr.includes(compactArea)) {
      return area;
    }
  }
  return undefined;
}
