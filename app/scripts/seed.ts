import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ------------------------------------------------------------------------------
// Bulletproof environment loader for .env.local
// ------------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Fatal Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ------------------------------------------------------------------------------
// Batch insert helper with retries and exponential backoff
// ------------------------------------------------------------------------------
async function batchInsert<T = any>(
  tableName: string,
  rows: any[],
  batchSize = 50,
  maxRetries = 3
): Promise<T[]> {
  if (!rows || rows.length === 0) return [];
  const results: T[] = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    let attempt = 0;
    let success = false;

    while (!success && attempt < maxRetries) {
      attempt++;
      try {
        const { data, error } = await supabase.from(tableName).insert(batch).select();
        if (error) {
          const isNetworkError =
            error.message?.includes("fetch failed") ||
            error.message?.includes("timeout") ||
            error.message?.includes("ECONNRESET") ||
            error.message?.includes("socket hang up");

          if (isNetworkError && attempt < maxRetries) {
            console.warn(
              `⚠️ Retrying batch for table [${tableName}] (attempt ${attempt}/${maxRetries}): ${error.message}`
            );
            await new Promise((r) => setTimeout(r, 1000 * attempt));
            continue;
          }

          console.error(`\n❌ SUPABASE ERROR in table [${tableName}] during batch insert:`);
          console.error(`   Message: ${error.message}`);
          console.error(`   Details: ${error.details || "N/A"}`);
          console.error(`   Hint: ${error.hint || "N/A"}`);
          process.exit(1);
        }

        if (data) {
          results.push(...(data as T[]));
        }
        success = true;
      } catch (err: any) {
        const isNetwork =
          err?.message?.includes("fetch failed") ||
          err?.message?.includes("timeout") ||
          err?.code === "ETIMEDOUT" ||
          err?.code === "ECONNRESET";

        if (isNetwork && attempt < maxRetries) {
          console.warn(
            `⚠️ Network exception on table [${tableName}] (attempt ${attempt}/${maxRetries}): ${err.message}`
          );
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }

        console.error(`\n❌ FATAL EXCEPTION in table [${tableName}]:`, err);
        process.exit(1);
      }
    }
  }

  return results;
}

// ------------------------------------------------------------------------------
// Single-call helper for small non-batch operations
// ------------------------------------------------------------------------------
async function execOrDie<T = any>(tableName: string, operationDesc: string, promise: any): Promise<T> {
  const { data, error } = await promise;
  if (error) {
    console.error(`\n❌ SUPABASE ERROR in table [${tableName}] during [${operationDesc}]:`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Details: ${error.details || "N/A"}`);
    console.error(`   Hint: ${error.hint || "N/A"}`);
    process.exit(1);
  }
  return data as T;
}

// ------------------------------------------------------------------------------
// Main Seed Function
// ------------------------------------------------------------------------------
async function runSeed() {
  console.log("👑 Initializing deterministic idempotent seed for THE ROYAL KNOT...");

  // 1. Clean up demo rows in reverse foreign-key dependency order
  console.log("\n🧹 Cleaning up existing demo data in dependency order (is_demo = true)...");
  const cleanOrder = [
    "guest_passports",
    "wedding_itineraries",
    "share_tokens",
    "vendor_payments",
    "vendor_bills",
    "extra_charges",
    "time_logs",
    "incidents",
    "schedule_items",
    "client_payments",
    "expenses",
    "wedding_tasks",
    "guests",
    "contracts",
    "wedding_vendors",
    "vendor_quotes",
    "quote_requests",
    "weddings",
    "enquiries",
    "couples",
    "task_templates",
    "vendors",
    "team_members",
    "packages",
  ];

  for (const table of cleanOrder) {
    if (table === "guest_passports" || table === "wedding_itineraries") {
      const { error } = await supabase.from(table).delete().eq("is_demo", true);
      if (error && !error.message?.includes("schema cache")) {
        console.warn(`   ⚠️ Warning cleaning demo ${table}:`, error.message);
      }
      continue;
    }
    await execOrDie(
      table,
      "delete demo rows",
      supabase.from(table).delete().eq("is_demo", true)
    );
  }
  console.log("   ✓ Demo rows cleaned safely.");

  // 2. Packages
  console.log("\n• Seeding Packages...");
  const packagesData = [
    {
      name: "Full-Service Royal Wedding",
      tier: "Full-Service",
      description: "End-to-end palatial curation: vendor tenders, decor architecture, royal hospitality, 3-day run-sheet management.",
      starting_price: 1500000,
      is_demo: true,
    },
    {
      name: "Partial / Day-of Management",
      tier: "Partial / Day-of",
      description: "30-day countdown takeover, vendor alignment, and day-of command center execution across venues.",
      starting_price: 650000,
      is_demo: true,
    },
  ];
  const createdPackages = await batchInsert("packages", packagesData);

  // 3. Team Members (3 Partners)
  console.log("• Seeding Core Royal Partner Team...");
  const teamData = [
    {
      name: "Gayatri Devi",
      email: "gayatri@theroyalknot.in",
      role: "Lead Royal Partner & Concierge",
      phone: "+91 98290 11001",
      is_demo: true,
    },
    {
      name: "Raghavendra Singh",
      email: "raghavendra@theroyalknot.in",
      role: "Head of Logistics & Palace Protocol",
      phone: "+91 98290 11002",
      is_demo: true,
    },
    {
      name: "Ananya Rathore",
      email: "ananya@theroyalknot.in",
      role: "Artisan Vendor Director",
      phone: "+91 98290 11003",
      is_demo: true,
    },
  ];
  const createdTeam = await batchInsert("team_members", teamData);

  // 4. Vendors: 60 Luxury Artisan Vendors across 11 Categories
  console.log("• Seeding 110 Curated Artisan Vendors (Exactly 10 across 11 Palatial Categories)...");
  const vendorsPoolData = [
    // 1. Catering (10 vendors)
    { name: "Mewar Shahi Bawarchi", category: "Catering", city: "Udaipur", rating: 4.9, contact_person: "Chef Ranveer Singh", phone: "+91 98291 00001", email: "bawarchi@mewarshahi.in", is_demo: true },
    { name: "Rajputana Royal Banquets", category: "Catering", city: "Jaipur", rating: 4.8, contact_person: "Vikram Rathore", phone: "+91 98291 00002", email: "banquets@rajputanaroyal.in", is_demo: true },
    { name: "Lakeview Gourmet Feasts", category: "Catering", city: "Udaipur", rating: 4.7, contact_person: "Pooja Chundawat", phone: "+91 98291 00003", email: "feasts@lakeviewgourmet.in", is_demo: true },
    { name: "Amber Dastarkhwan Heritage", category: "Catering", city: "Jaipur", rating: 4.9, contact_person: "Mirza Zafar Ali", phone: "+91 98291 00004", email: "dastarkhwan@amberheritage.in", is_demo: true },
    { name: "Marwar Palace Caterers", category: "Catering", city: "Jaipur", rating: 4.6, contact_person: "Suraj Bhanot", phone: "+91 98291 00005", email: "info@marwarcaterers.in", is_demo: true },
    { name: "Pichola Royal Degs", category: "Catering", city: "Udaipur", rating: 4.8, contact_person: "Himmat Menaria", phone: "+91 98291 00006", email: "contact@picholadegs.in", is_demo: true },
    { name: "Jaipur Heritage Rasoi", category: "Catering", city: "Jaipur", rating: 4.5, contact_person: "Kailash Sharma", phone: "+91 98291 00007", email: "rasoi@jaipurheritage.in", is_demo: true },
    { name: "Fateh Sagar Silver Dining", category: "Catering", city: "Udaipur", rating: 4.9, contact_person: "Devendra Jhala", phone: "+91 98291 00008", email: "silver@fatehsagardining.in", is_demo: true },
    { name: "Chokhi Dhani Royal Rasoda", category: "Catering", city: "Jaipur", rating: 4.8, contact_person: "Bhairon Singh", phone: "+91 98291 00061", email: "rasoda@chokhidhani.in", is_demo: true },
    { name: "Shiv Niwas Imperial Feasts", category: "Catering", city: "Udaipur", rating: 5.0, contact_person: "Chef Arvind Sisodia", phone: "+91 98291 00062", email: "feasts@shivniwas.in", is_demo: true },

    // 2. Decor & Florals (10 vendors)
    { name: "Rajputana Decor & Florals", category: "Decor & Florals", city: "Jaipur", rating: 5.0, contact_person: "Divya Shekhawat", phone: "+91 98291 00009", email: "divya@rajputanadecor.in", is_demo: true },
    { name: "Udaipur Lotus Floral Arts", category: "Decor & Florals", city: "Udaipur", rating: 4.9, contact_person: "Manish Soni", phone: "+91 98291 00010", email: "manish@lotusfloral.in", is_demo: true },
    { name: "Rambagh Royal Pavilions", category: "Decor & Florals", city: "Jaipur", rating: 4.8, contact_person: "Sneha Bhati", phone: "+91 98291 00011", email: "sneha@rambaghpavilions.in", is_demo: true },
    { name: "Jagmandir Floral Mandap Arts", category: "Decor & Florals", city: "Udaipur", rating: 4.7, contact_person: "Kunal Shrimali", phone: "+91 98291 00012", email: "kunal@jagmandirmandap.in", is_demo: true },
    { name: "Sheesh Mahal Mirrored Backdrops", category: "Decor & Florals", city: "Jaipur", rating: 4.9, contact_person: "Ananya Goyal", phone: "+91 98291 00013", email: "ananya@sheeshdecor.in", is_demo: true },
    { name: "City Palace Botanical Guild", category: "Decor & Florals", city: "Udaipur", rating: 4.6, contact_person: "Bhupendra Vyas", phone: "+91 98291 00014", email: "guild@botanicaludaipur.in", is_demo: true },
    { name: "Gulab Bagh Marigold Crafts", category: "Decor & Florals", city: "Jaipur", rating: 4.7, contact_person: "Rajesh Saini", phone: "+91 98291 00015", email: "rajesh@gulabbaghcrafts.in", is_demo: true },
    { name: "Aravalli Canopy Architectures", category: "Decor & Florals", city: "Udaipur", rating: 4.8, contact_person: "Harish Parihar", phone: "+91 98291 00016", email: "info@aravallicanopy.in", is_demo: true },
    { name: "Samode Velvet & Jasmine Guild", category: "Decor & Florals", city: "Jaipur", rating: 4.9, contact_person: "Kritika Chandel", phone: "+91 98291 00063", email: "jasmine@samodedecor.in", is_demo: true },
    { name: "Mewar Royal Rajwada Mandaps", category: "Decor & Florals", city: "Udaipur", rating: 4.8, contact_person: "Surendra Dabi", phone: "+91 98291 00064", email: "rajwada@mewarmandaps.in", is_demo: true },

    // 3. Music and DJ (10 vendors)
    { name: "Jaipur Royal Beats DJ", category: "Music and DJ", city: "Jaipur", rating: 4.8, contact_person: "DJ Kabir Roy", phone: "+91 98291 00017", email: "dj@jaipurroyalbeats.in", is_demo: true },
    { name: "Desert Symphony & Manganiyar Troupe", category: "Music and DJ", city: "Jaipur", rating: 5.0, contact_person: "Ustad Gazi Khan", phone: "+91 98291 00018", email: "contact@desertsymphony.in", is_demo: true },
    { name: "Udaipur Lake Beats Fusion DJ", category: "Music and DJ", city: "Udaipur", rating: 4.7, contact_person: "DJ Samar Sen", phone: "+91 98291 00019", email: "samar@lakebeats.in", is_demo: true },
    { name: "Mewar Shehnai & Nagada Ensemble", category: "Music and DJ", city: "Udaipur", rating: 4.9, contact_person: "Pandit Ramswaroop", phone: "+91 98291 00020", email: "mewar@nagadaensemble.in", is_demo: true },
    { name: "Pink City Brass & Dhol Symphony", category: "Music and DJ", city: "Jaipur", rating: 4.6, contact_person: "Mohit Kumawat", phone: "+91 98291 00021", email: "brass@pinkcitydhol.in", is_demo: true },
    { name: "Royal Sitar & Santoor Mehfil", category: "Music and DJ", city: "Udaipur", rating: 4.8, contact_person: "Vidushi Meera Joshi", phone: "+91 98291 00022", email: "meera@sitarsantoormehfil.in", is_demo: true },
    { name: "Thar Folk Rhythms & Kalbelia Troupe", category: "Music and DJ", city: "Jaipur", rating: 4.9, contact_person: "Kishan Khan", phone: "+91 98291 00065", email: "thar@folkrhythms.in", is_demo: true },
    { name: "Lake Pichola Acoustic Strings", category: "Music and DJ", city: "Udaipur", rating: 4.8, contact_person: "Aniruddh Bose", phone: "+91 98291 00066", email: "strings@picholaacoustic.in", is_demo: true },
    { name: "Amber Palace Sufi & Qawwali Ensemble", category: "Music and DJ", city: "Jaipur", rating: 5.0, contact_person: "Ustad Sabir Nizami", phone: "+91 98291 00067", email: "sufi@amberqawwals.in", is_demo: true },
    { name: "DJ Rohit Lake City Royal Sets", category: "Music and DJ", city: "Udaipur", rating: 4.7, contact_person: "Rohit Menaria", phone: "+91 98291 00068", email: "rohit@lakecitysets.in", is_demo: true },

    // 4. Photography (10 vendors)
    { name: "Royal Lens Heritage Photography", category: "Photography", city: "Jaipur", rating: 4.9, contact_person: "Aditya Chopra", phone: "+91 98291 00023", email: "contact@royallens.in", is_demo: true },
    { name: "Udaipur Pichola Cinematics", category: "Photography", city: "Udaipur", rating: 4.9, contact_person: "Rohan Varma", phone: "+91 98291 00024", email: "rohan@picholacinematics.in", is_demo: true },
    { name: "Rajputana Candid Moments", category: "Photography", city: "Jaipur", rating: 4.7, contact_person: "Tanvi Mathur", phone: "+91 98291 00025", email: "tanvi@candidrajputana.in", is_demo: true },
    { name: "Fateh Garh Drone & Vista Arts", category: "Photography", city: "Udaipur", rating: 4.8, contact_person: "Karan Deora", phone: "+91 98291 00026", email: "karan@fatehgarhdrone.in", is_demo: true },
    { name: "Hawa Mahal Vintage Portraits", category: "Photography", city: "Jaipur", rating: 4.6, contact_person: "Vipin Agarwal", phone: "+91 98291 00027", email: "vipin@hawamahalportraits.in", is_demo: true },
    { name: "Monsoon Palace Film Works", category: "Photography", city: "Udaipur", rating: 4.8, contact_person: "Shruti Bagchi", phone: "+91 98291 00028", email: "shruti@monsoonpalacefilms.in", is_demo: true },
    { name: "Stories by Royal Heritage", category: "Photography", city: "Jaipur", rating: 5.0, contact_person: "Prateek Rawal", phone: "+91 98291 00069", email: "stories@royalheritagefilms.in", is_demo: true },
    { name: "Lake City Cinematic Stories", category: "Photography", city: "Udaipur", rating: 4.9, contact_person: "Varun Mehta", phone: "+91 98291 00070", email: "varun@lakecitystories.in", is_demo: true },
    { name: "The Regal Frame Weddings", category: "Photography", city: "Jaipur", rating: 4.8, contact_person: "Pooja Singhal", phone: "+91 98291 00071", email: "pooja@theregalframe.in", is_demo: true },
    { name: "Mewar Memories Visual Studio", category: "Photography", city: "Udaipur", rating: 4.7, contact_person: "Deepak Chundawat", phone: "+91 98291 00072", email: "deepak@mewarmemories.in", is_demo: true },

    // 5. Makeup (10 vendors)
    { name: "Roop Shringar Bridal Art", category: "Makeup", city: "Jaipur", rating: 4.9, contact_person: "Kavita Rathore", phone: "+91 98291 00029", email: "kavita@roopshringar.in", is_demo: true },
    { name: "Lake City Royal Makeovers", category: "Makeup", city: "Udaipur", rating: 4.8, contact_person: "Natasha Kothari", phone: "+91 98291 00030", email: "natasha@lakecitymakeovers.in", is_demo: true },
    { name: "Maharani Glow Luxury Studio", category: "Makeup", city: "Jaipur", rating: 4.9, contact_person: "Simran Kaur", phone: "+91 98291 00031", email: "simran@maharaniglow.in", is_demo: true },
    { name: "Zenana Courtyard Bridal Glow", category: "Makeup", city: "Udaipur", rating: 4.7, contact_person: "Preeti Bhatt", phone: "+91 98291 00032", email: "preeti@zenanaglow.in", is_demo: true },
    { name: "Amber Velvet Salon & Spa", category: "Makeup", city: "Jaipur", rating: 4.6, contact_person: "Shreya Saxena", phone: "+91 98291 00033", email: "shreya@ambervelvet.in", is_demo: true },
    { name: "Gulab Bagh Bridal Atelier", category: "Makeup", city: "Udaipur", rating: 4.8, contact_person: "Meenakshi Vyas", phone: "+91 98291 00073", email: "atelier@gulabbaghbridal.in", is_demo: true },
    { name: "Royal Rajputana Shringar", category: "Makeup", city: "Jaipur", rating: 4.9, contact_person: "Rukmani Kanwar", phone: "+91 98291 00074", email: "rukmani@rajputanashringar.in", is_demo: true },
    { name: "Udaipur Bridal Couture Glam", category: "Makeup", city: "Udaipur", rating: 4.8, contact_person: "Barkha Porwal", phone: "+91 98291 00075", email: "barkha@coutureglam.in", is_demo: true },
    { name: "Sheesh Mahal Bridal Lounge", category: "Makeup", city: "Jaipur", rating: 5.0, contact_person: "Tina Harchandani", phone: "+91 98291 00076", email: "tina@sheeshlounge.in", is_demo: true },
    { name: "Pichola Aura Bridal Styling", category: "Makeup", city: "Udaipur", rating: 4.7, contact_person: "Suman Ranawat", phone: "+91 98291 00077", email: "suman@picholaaura.in", is_demo: true },

    // 6. Transport (10 vendors)
    { name: "Vintage Wheels of Rajputana", category: "Transport", city: "Jaipur", rating: 4.9, contact_person: "Major Hanut Singh", phone: "+91 98291 00034", email: "vintage@rajputanawheels.in", is_demo: true },
    { name: "Udaipur Royal Chariot & Boat Fleet", category: "Transport", city: "Udaipur", rating: 4.8, contact_person: "Gajendra Sisodia", phone: "+91 98291 00035", email: "fleet@udaipurchariots.in", is_demo: true },
    { name: "Maharaja Rolls & Limousine Fleet", category: "Transport", city: "Jaipur", rating: 4.9, contact_person: "Amanjot Gill", phone: "+91 98291 00036", email: "aman@maharajarolls.in", is_demo: true },
    { name: "Pichola Royal Shikara Transfers", category: "Transport", city: "Udaipur", rating: 4.7, contact_person: "Bhanu Pratap", phone: "+91 98291 00037", email: "transfers@picholashikara.in", is_demo: true },
    { name: "Aravalli Luxury Coaches & Sedans", category: "Transport", city: "Jaipur", rating: 4.5, contact_person: "Nitin Jain", phone: "+91 98291 00038", email: "nitin@aravalliluxury.in", is_demo: true },
    { name: "Desert Royal Horse & Elephant Protocol", category: "Transport", city: "Jaipur", rating: 4.8, contact_person: "Raghavendra Bhati", phone: "+91 98291 00078", email: "protocol@deserthorse.in", is_demo: true },
    { name: "Lake Palace Private Yacht Service", category: "Transport", city: "Udaipur", rating: 5.0, contact_person: "Capt. Mahendra Singh", phone: "+91 98291 00079", email: "yacht@lakepalacetransfers.in", is_demo: true },
    { name: "Rajputana Heritage Carriages", category: "Transport", city: "Jaipur", rating: 4.7, contact_person: "Devraj Panwar", phone: "+91 98291 00080", email: "carriages@heritagecarriages.in", is_demo: true },
    { name: "City Palace Royal Buggy Fleet", category: "Transport", city: "Udaipur", rating: 4.9, contact_person: "Fateh Singh", phone: "+91 98291 00081", email: "buggy@citypalacefleet.in", is_demo: true },
    { name: "Amber Grand Logistics & Convoy", category: "Transport", city: "Jaipur", rating: 4.6, contact_person: "Sandeep Yadav", phone: "+91 98291 00082", email: "convoy@amberlogistics.in", is_demo: true },

    // 7. Lighting (10 vendors)
    { name: "Surya Roshni Palace Lighting", category: "Lighting", city: "Jaipur", rating: 4.8, contact_person: "Dinesh Pareek", phone: "+91 98291 00039", email: "dinesh@suryaroshni.in", is_demo: true },
    { name: "Jagmandir Lake Illuminations", category: "Lighting", city: "Udaipur", rating: 4.9, contact_person: "Sanjay Gehlot", phone: "+91 98291 00040", email: "sanjay@jagmandirlighting.in", is_demo: true },
    { name: "Amber Fort Torch & Fairy Lights", category: "Lighting", city: "Jaipur", rating: 4.7, contact_person: "Lokesh Rawat", phone: "+91 98291 00041", email: "lokesh@amberlights.in", is_demo: true },
    { name: "Fateh Sagar Architectural Lumens", category: "Lighting", city: "Udaipur", rating: 4.8, contact_person: "Arvind Solanki", phone: "+91 98291 00042", email: "arvind@fatehsagarlumens.in", is_demo: true },
    { name: "Shekhawati Diya & Chandelier Guild", category: "Lighting", city: "Jaipur", rating: 4.6, contact_person: "Pradeep Joshi", phone: "+91 98291 00043", email: "pradeep@diyaguild.in", is_demo: true },
    { name: "Royal Heritage Laser & Façade Projection", category: "Lighting", city: "Jaipur", rating: 5.0, contact_person: "Gaurav Sen", phone: "+91 98291 00083", email: "laser@royalfacades.in", is_demo: true },
    { name: "Pichola Midnight Floating Lanterns", category: "Lighting", city: "Udaipur", rating: 4.9, contact_person: "Manoj Kumawat", phone: "+91 98291 00084", email: "lanterns@picholamildnight.in", is_demo: true },
    { name: "Samode Palace Candlelight Guild", category: "Lighting", city: "Jaipur", rating: 4.8, contact_person: "Ravi Shankar Soni", phone: "+91 98291 00085", email: "candlelight@samodeguild.in", is_demo: true },
    { name: "Aravalli Sky Beams & Grand Pyros", category: "Lighting", city: "Jaipur", rating: 4.7, contact_person: "Alok Mathur", phone: "+91 98291 00086", email: "pyro@aravallisky.in", is_demo: true },
    { name: "Mewar Durbar Crystal Chandeliers", category: "Lighting", city: "Udaipur", rating: 4.8, contact_person: "Hemant Jhala", phone: "+91 98291 00087", email: "chandeliers@mewardurbar.in", is_demo: true },

    // 8. Mehendi (10 vendors)
    { name: "Rang Mehendi Royal Arts", category: "Mehendi", city: "Jaipur", rating: 4.9, contact_person: "Geeta Maru", phone: "+91 98291 00044", email: "geeta@rangmehendi.in", is_demo: true },
    { name: "Udaipur Marwar Henna Studio", category: "Mehendi", city: "Udaipur", rating: 4.8, contact_person: "Sunita Kumawat", phone: "+91 98291 00045", email: "sunita@marwarhenna.in", is_demo: true },
    { name: "Soojat Pure Herbal Mehendi", category: "Mehendi", city: "Jaipur", rating: 5.0, contact_person: "Rekha Mali", phone: "+91 98291 00046", email: "rekha@soojathenna.in", is_demo: true },
    { name: "Pichola Henna Heritage", category: "Mehendi", city: "Udaipur", rating: 4.7, contact_person: "Mamta Sharma", phone: "+91 98291 00047", email: "mamta@picholahenna.in", is_demo: true },
    { name: "Johari Bazaar Royal Mehendi", category: "Mehendi", city: "Jaipur", rating: 4.6, contact_person: "Pooja Vaishnav", phone: "+91 98291 00048", email: "pooja@joharimehendi.in", is_demo: true },
    { name: "Bridal Henna by Geeta Shahi", category: "Mehendi", city: "Jaipur", rating: 4.9, contact_person: "Geeta Verma", phone: "+91 98291 00088", email: "geeta@geetashahi.in", is_demo: true },
    { name: "Lake City Organic Henna Artisans", category: "Mehendi", city: "Udaipur", rating: 4.8, contact_person: "Priyanka Soni", phone: "+91 98291 00089", email: "organic@lakecityhenna.in", is_demo: true },
    { name: "Rajputana Shahi Mehendi Lounge", category: "Mehendi", city: "Jaipur", rating: 4.8, contact_person: "Sarita Rathore", phone: "+91 98291 00090", email: "lounge@shahimehendi.in", is_demo: true },
    { name: "Mewar Bridal Henna Connoisseurs", category: "Mehendi", city: "Udaipur", rating: 4.7, contact_person: "Anju Menaria", phone: "+91 98291 00091", email: "connoisseurs@mewarhenna.in", is_demo: true },
    { name: "Amber Marwar Bridal Arts", category: "Mehendi", city: "Jaipur", rating: 4.9, contact_person: "Chanda Mali", phone: "+91 98291 00092", email: "chanda@ambermarwar.in", is_demo: true },

    // 9. Pandit (10 vendors)
    { name: "Acharya Vidyadhar Shastri (Vedic Pheras)", category: "Pandit", city: "Jaipur", rating: 5.0, contact_person: "Acharya Vidyadhar", phone: "+91 98291 00049", email: "shastri@vedicpheras.in", is_demo: true },
    { name: "Mewar Rajpurohit Sansthan", category: "Pandit", city: "Udaipur", rating: 4.9, contact_person: "Pandit Govind Dev", phone: "+91 98291 00050", email: "rajpurohit@mewarsansthan.in", is_demo: true },
    { name: "Kashi-Varanasi Vedic Acharyas", category: "Pandit", city: "Jaipur", rating: 4.8, contact_person: "Pandit Harishankar", phone: "+91 98291 00051", email: "harishankar@kashivedic.in", is_demo: true },
    { name: "Nathdwara Haveli Pundit Sabha", category: "Pandit", city: "Udaipur", rating: 4.8, contact_person: "Pandit Damodar Das", phone: "+91 98291 00052", email: "damodar@nathdwarapundits.in", is_demo: true },
    { name: "Pandit Raghunath Ji Phera Gurukul", category: "Pandit", city: "Jaipur", rating: 4.9, contact_person: "Pandit Raghunath", phone: "+91 98291 00093", email: "gurukul@raghunathji.in", is_demo: true },
    { name: "Acharya Devendra Joshi Shahi Purohits", category: "Pandit", city: "Udaipur", rating: 5.0, contact_person: "Acharya Devendra", phone: "+91 98291 00094", email: "purohits@devendrajoshi.in", is_demo: true },
    { name: "Haridwar Vedic Vivah Sanskar Sabha", category: "Pandit", city: "Jaipur", rating: 4.8, contact_person: "Pandit Brijesh Shastri", phone: "+91 98291 00095", email: "sanskar@haridwarvedic.in", is_demo: true },
    { name: "Somnath Sanskriti Acharya Parishad", category: "Pandit", city: "Udaipur", rating: 4.7, contact_person: "Pandit Girish Dave", phone: "+91 98291 00096", email: "parishad@somnathsanskriti.in", is_demo: true },
    { name: "Pandit Jagdish Sharma Vivah Vidhi", category: "Pandit", city: "Jaipur", rating: 4.9, contact_person: "Pandit Jagdish", phone: "+91 98291 00097", email: "vidhi@jagdishsharma.in", is_demo: true },
    { name: "Mewar Royal Sanskrit Sanstha", category: "Pandit", city: "Udaipur", rating: 4.8, contact_person: "Pandit Narayan Shastri", phone: "+91 98291 00098", email: "sanstha@mewarsanskrit.in", is_demo: true },

    // 10. Sound (10 vendors)
    { name: "Swaranjali Line-Array Concert Systems", category: "Sound", city: "Jaipur", rating: 4.9, contact_person: "Tariq Mahmood", phone: "+91 98291 00053", email: "tariq@swaranjalisound.in", is_demo: true },
    { name: "Jagmandir Lake Acoustic Sound", category: "Sound", city: "Udaipur", rating: 4.8, contact_person: "Ashwin Doshi", phone: "+91 98291 00054", email: "ashwin@jagmandirsound.in", is_demo: true },
    { name: "Amber Fort Amphitheatre Acoustics", category: "Sound", city: "Jaipur", rating: 4.7, contact_person: "Naveen Mathur", phone: "+91 98291 00055", email: "naveen@amberfortsound.in", is_demo: true },
    { name: "Pichola Sound Reinforcement Lab", category: "Sound", city: "Udaipur", rating: 4.8, contact_person: "Sidharth Roy", phone: "+91 98291 00056", email: "sidharth@picholasound.in", is_demo: true },
    { name: "JBL Pro Royal Concert Audio", category: "Sound", city: "Jaipur", rating: 5.0, contact_person: "Farhan Qureshi", phone: "+91 98291 00099", email: "pro@jblroyalaudio.in", is_demo: true },
    { name: "Lake City Acoustic Array Labs", category: "Sound", city: "Udaipur", rating: 4.9, contact_person: "Sunil Jain", phone: "+91 98291 00100", email: "array@lakecitysound.in", is_demo: true },
    { name: "Desert Arena Surround Sound Guild", category: "Sound", city: "Jaipur", rating: 4.7, contact_person: "Sameer Sheikh", phone: "+91 98291 00101", email: "guild@desertarenasound.in", is_demo: true },
    { name: "Mewar Shahi Audio Engineering", category: "Sound", city: "Udaipur", rating: 4.8, contact_person: "Pramod Shrimali", phone: "+91 98291 00102", email: "audio@mewaraudio.in", is_demo: true },
    { name: "Pink City High-Decibel Sound Systems", category: "Sound", city: "Jaipur", rating: 4.6, contact_person: "Kishore Kumar", phone: "+91 98291 00103", email: "decibel@pinkcitysound.in", is_demo: true },
    { name: "Royal Courtyard Wireless Audio Labs", category: "Sound", city: "Jaipur", rating: 4.8, contact_person: "Anand Verma", phone: "+91 98291 00104", email: "wireless@courtyardaudio.in", is_demo: true },

    // 11. Valet (10 vendors)
    { name: "Shahi Valet & Royal Hospitality Guard", category: "Valet", city: "Jaipur", rating: 4.8, contact_person: "Balwant Singh", phone: "+91 98291 00057", email: "balwant@shahivalet.in", is_demo: true },
    { name: "Udaipur Palace Valet Services", category: "Valet", city: "Udaipur", rating: 4.7, contact_person: "Chetan Panwar", phone: "+91 98291 00058", email: "chetan@udaipurvalet.in", is_demo: true },
    { name: "Pink City Elite Concierge & Valet", category: "Valet", city: "Jaipur", rating: 4.9, contact_person: "Dharmendra Rathore", phone: "+91 98291 00059", email: "dharmendra@pinkcityvalet.in", is_demo: true },
    { name: "Mewar Gate Protocol Valet", category: "Valet", city: "Udaipur", rating: 4.7, contact_person: "Rajendra Bhati", phone: "+91 98291 00060", email: "rajendra@mewargatevalet.in", is_demo: true },
    { name: "Maharaja Chauffeur & Valet Corps", category: "Valet", city: "Jaipur", rating: 5.0, contact_person: "Hoshiyar Singh", phone: "+91 98291 00105", email: "corps@maharajavalet.in", is_demo: true },
    { name: "Royal Rajasthan Guest Parking Command", category: "Valet", city: "Jaipur", rating: 4.8, contact_person: "Kailash Gehlot", phone: "+91 98291 00106", email: "parking@royalparking.in", is_demo: true },
    { name: "Lakefront Chariot & Car Chaperones", category: "Valet", city: "Udaipur", rating: 4.8, contact_person: "Dilip Dangi", phone: "+91 98291 00107", email: "chaperones@lakefrontvalet.in", is_demo: true },
    { name: "Amber Fort Gatekeeping & Valet Guild", category: "Valet", city: "Jaipur", rating: 4.6, contact_person: "Madan Rawat", phone: "+91 98291 00108", email: "amber@gatekeepingvalet.in", is_demo: true },
    { name: "Fateh Sagar Dignitary Valet Corp", category: "Valet", city: "Udaipur", rating: 4.9, contact_person: "Sohan Singh", phone: "+91 98291 00109", email: "dignitary@fatehsagarvalet.in", is_demo: true },
    { name: "Heritage Palace Valet Escorts", category: "Valet", city: "Jaipur", rating: 4.7, contact_person: "Pratap Rathore", phone: "+91 98291 00110", email: "escorts@heritagevalet.in", is_demo: true },
  ];
  const createdVendors = await batchInsert("vendors", vendorsPoolData);

  // 5. Task Templates
  console.log("• Seeding Task Templates...");
  const templatesData = [
    { title: "Initial Venue Walkthrough & Courtyard Layout Approval", phase: "Planning", offset_days_from_wedding: -120, default_role: "Lead Royal Partner & Concierge", package: "Full-Service", is_demo: true },
    { title: "Catering Menu Tasting & Royal Silverware Selection", phase: "Planning", offset_days_from_wedding: -90, default_role: "Artisan Vendor Director", package: "Full-Service", is_demo: true },
    { title: "Grand Decor Blueprint & 3D Lotus Floral Rendering", phase: "Planning", offset_days_from_wedding: -75, default_role: "Artisan Vendor Director", package: "Full-Service", is_demo: true },
    { title: "Sound & Acoustic Echo Calibration across Lake Pichola", phase: "Planning", offset_days_from_wedding: -45, default_role: "Head of Logistics & Palace Protocol", package: "Full-Service", is_demo: true },
    { title: "Palace Protocol & VIP Security Clearances", phase: "Planning", offset_days_from_wedding: -30, default_role: "Head of Logistics & Palace Protocol", package: "All", is_demo: true },
    { title: "Artisan Vendor Briefing & Arrival Timetable Sign-off", phase: "Countdown", offset_days_from_wedding: -14, default_role: "Artisan Vendor Director", package: "All", is_demo: true },
    { title: "Vintage Chariot & Horse Barat Logistics Drill", phase: "Countdown", offset_days_from_wedding: -7, default_role: "Head of Logistics & Palace Protocol", package: "All", is_demo: true },
    { title: "Bridal Suite High-Tea & Jewellery Vault Setup", phase: "Countdown", offset_days_from_wedding: -2, default_role: "Lead Royal Partner & Concierge", package: "All", is_demo: true },
    { title: "Day-of Command Center Activation & Vendor Rollcall", phase: "Day-of", offset_days_from_wedding: 0, default_role: "Head of Logistics & Palace Protocol", package: "All", is_demo: true },
    { title: "Baraat Procession & Nagada Drummers Coordination", phase: "Day-of", offset_days_from_wedding: 0, default_role: "Head of Logistics & Palace Protocol", package: "All", is_demo: true },
    { title: "Varmala Stage Lotus Mechanism & Floral Shower", phase: "Day-of", offset_days_from_wedding: 0, default_role: "Artisan Vendor Director", package: "All", is_demo: true },
    { title: "Vedic Pheras Sacred Fire & Pandit Assistance", phase: "Day-of", offset_days_from_wedding: 0, default_role: "Lead Royal Partner & Concierge", package: "All", is_demo: true },
    { title: "Royal Banquet Service & Silver Thali Supervision", phase: "Day-of", offset_days_from_wedding: 0, default_role: "Artisan Vendor Director", package: "All", is_demo: true },
    { title: "Fireworks Skyline Clearance & Grand Finale Launch", phase: "Day-of", offset_days_from_wedding: 0, default_role: "Head of Logistics & Palace Protocol", package: "All", is_demo: true },
    { title: "Final Vendor Bill Reconciliation & Security Deposit Release", phase: "Post-event", offset_days_from_wedding: 7, default_role: "Lead Royal Partner & Concierge", package: "All", is_demo: true },
  ];
  await batchInsert("task_templates", templatesData);

  // 6. 14 Curated Enquiries across all stages + HERO ENQUIRY
  console.log("• Seeding 14 Enquiries across All Stages (including Hero Enquiry)...");
  const enquiriesData = [
    // HERO ENQUIRY
    {
      couple_name: "Aanya and Veer Rathore",
      phone: "+91 98290 99001",
      email: "aanya.veer@rathore-palace.in",
      stage: "New",
      guests: 400,
      budget: 32000000, // Rs 3.2 Crore
      theme: "Imperial Rajputana & Sufi Lake Serenade",
      source: "Royal Referral",
      package: "Full-Service",
      city: "Udaipur",
      wedding_date: "2027-02-18",
      notes: "Palatial 3-day island wedding at Jagmandir Palace with international jazz & Rajasthani royal folk artists.",
      is_demo: true,
    },
    {
      couple_name: "Devendra Chauhan & Avantika Solanki",
      phone: "+91 98290 99002",
      email: "devendra.avantika@heritage.in",
      stage: "New",
      guests: 450,
      budget: 8500000,
      theme: "Amber Fort Heritage Durbar",
      source: "Instagram",
      package: "Full-Service",
      city: "Jaipur",
      wedding_date: "2026-12-20",
      notes: "Desire traditional candlelit ramparts banquet with Shehnai ensemble.",
      is_demo: true,
    },
    {
      couple_name: "Ranveer Singhania & Deepika Sen",
      phone: "+91 98290 99003",
      email: "ranveer.deepika@luxury.in",
      stage: "New",
      guests: 500,
      budget: 11000000,
      theme: "Lakeside Rajputana Grandeur",
      source: "Luxury Fair",
      package: "Full-Service",
      city: "Udaipur",
      wedding_date: "2027-01-15",
      notes: "Looking for complete island buyout with private boat fleet transfers.",
      is_demo: true,
    },
    {
      couple_name: "Siddharth Mehta & Kiara Kapoor",
      phone: "+91 98290 99004",
      email: "siddharth.kiara@mumbai.com",
      stage: "Contacted",
      guests: 420,
      budget: 7500000,
      theme: "Palace Romance & French Florals",
      source: "Referral",
      package: "Full-Service",
      city: "Jaipur",
      wedding_date: "2026-11-25",
      notes: "Initial consultation completed over video call; interested in Rambagh Palace grounds.",
      is_demo: true,
    },
    {
      couple_name: "Aditya Vardhan & Rhea Singhal",
      phone: "+91 98290 99005",
      email: "aditya.rhea@singhalgroup.com",
      stage: "Contacted",
      guests: 380,
      budget: 6500000,
      theme: "Contemporary Royal Lotus",
      source: "Website",
      package: "Partial / Day-of",
      city: "Jaipur",
      wedding_date: "2026-12-10",
      notes: "Family already booked venue; requires end-to-end 30-day logistics & day-of execution.",
      is_demo: true,
    },
    {
      couple_name: "Vikramaditya Birla & Sanjana Ruia",
      phone: "+91 98290 99006",
      email: "vikram.sanjana@birla.org",
      stage: "Contacted",
      guests: 550,
      budget: 14000000,
      theme: "Imperial Mewar Durbar",
      source: "Direct",
      package: "Full-Service",
      city: "Udaipur",
      wedding_date: "2027-03-08",
      notes: "Requested bespoke silver thali tasting presentation.",
      is_demo: true,
    },
    {
      couple_name: "Raghav Singhal & Tanya Mittal",
      phone: "+91 98290 99007",
      email: "raghav.tanya@mittalgroup.com",
      stage: "Meeting",
      guests: 480,
      budget: 9500000,
      theme: "Torchlit Mughal Courtyards",
      source: "Instagram",
      package: "Full-Service",
      city: "Jaipur",
      wedding_date: "2027-01-22",
      notes: "In-person palace walkthrough scheduled at Jai Mahal Palace.",
      is_demo: true,
    },
    {
      couple_name: "Kabir Oberoi & Natasha Thapar",
      phone: "+91 98290 99008",
      email: "kabir.natasha@delhiclub.com",
      stage: "Meeting",
      guests: 350,
      budget: 6000000,
      theme: "Ivory & Champagne Elegance",
      source: "Referral",
      package: "Partial / Day-of",
      city: "Udaipur",
      wedding_date: "2026-12-05",
      notes: "Reviewing vendor tender packets with bride's family.",
      is_demo: true,
    },
    {
      couple_name: "Harshvardhan Goenka & Ishani Bajaj",
      phone: "+91 98290 99009",
      email: "harsh.ishani@bajajcorp.in",
      stage: "Proposal",
      guests: 520,
      budget: 13500000,
      theme: "Royal Rajputana Grandeur",
      source: "Luxury Fair",
      package: "Full-Service",
      city: "Udaipur",
      wedding_date: "2027-02-28",
      notes: "Detailed budget breakdown and vendor tenders submitted; council review pending.",
      is_demo: true,
    },
    {
      couple_name: "Manish Somani & Radhika Kothari",
      phone: "+91 98290 99010",
      email: "manish.radhika@kotharis.in",
      stage: "Proposal",
      guests: 400,
      budget: 7000000,
      theme: "Sheesh Mahal Mirror Magic",
      source: "Website",
      package: "Partial / Day-of",
      city: "Jaipur",
      wedding_date: "2026-11-30",
      notes: "Sent proposal for 3-day day-of command center with 12 coordinators.",
      is_demo: true,
    },
    {
      couple_name: "Arjun Shekhawat & Meera Chundawat",
      phone: "+91 98290 99011",
      email: "arjun.meera@chundawat.in",
      stage: "Won",
      guests: 600,
      budget: 12500000,
      theme: "Historic Rajputana Heritage",
      source: "Royal Referral",
      package: "Full-Service",
      city: "Udaipur",
      wedding_date: "2026-12-18",
      notes: "Agreement signed, booking deposit verified. Transitioning to active planning.",
      is_demo: true,
    },
    {
      couple_name: "Prithvi Raj Bhati & Rohini Sisodia",
      phone: "+91 98290 99012",
      email: "prithvi.rohini@sisodia.in",
      stage: "Won",
      guests: 450,
      budget: 8000000,
      theme: "Mughal Garden Pavilions",
      source: "Direct",
      package: "Full-Service",
      city: "Jaipur",
      wedding_date: "2027-01-08",
      notes: "Contract signed, deposit cleared.",
      is_demo: true,
    },
    {
      couple_name: "Gaurav Agarwal & Sonali Bansal",
      phone: "+91 98290 99013",
      email: "gaurav.sonali@delhienterprise.in",
      stage: "Lost",
      guests: 300,
      budget: 4500000,
      theme: "Minimalist Pastel Heritage",
      source: "Website",
      package: "Partial / Day-of",
      city: "Jaipur",
      wedding_date: "2027-03-14",
      notes: "Couple decided to celebrate in Goa instead of Rajasthan.",
      is_demo: true,
    },
    {
      couple_name: "Rishi Jindal & Ananya Singhania",
      phone: "+91 98290 99014",
      email: "rishi.ananya@jindal.com",
      stage: "Lost",
      guests: 500,
      budget: 15000000,
      theme: "Ultra Luxury Lake Buyout",
      source: "Referral",
      package: "Full-Service",
      city: "Udaipur",
      wedding_date: "2026-11-12",
      notes: "Opted for destination wedding in Lake Como, Italy.",
      is_demo: true,
    },
  ];
  await batchInsert("enquiries", enquiriesData);

  // 7. 25 Weddings: 15 Completed, 5 In Progress (1 Today), 5 Upcoming
  console.log("• Seeding 25 Destination Weddings across Jaipur & Udaipur Palaces...");
  const todayStr = new Date().toISOString().split("T")[0];

  // Helper date generators
  const datePast = (daysAgo: number) => {
    const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  };
  const dateFuture = (daysAhead: number) => {
    const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  };

  const weddingsRawData = [
    // --- 15 COMPLETED WEDDINGS ---
    // [0] LOSS WEDDING 1: Vendor Overrun
    {
      title: "Royal Rajvilas Winter Vivah",
      wedding_date: datePast(150),
      city: "Jaipur",
      venue: "The Oberoi Rajvilas, Jaipur",
      guest_count: 500,
      contract_value: 8500000,
      total_budget: 8500000,
      status: "Completed",
      theme: "Palace Romance & Royal Florals",
      packageTier: "Full-Service",
    },
    // [1] LOSS WEDDING 2: Heavy Absorbed Extras
    {
      title: "Lake Palace Monsoon Nuptials",
      wedding_date: datePast(120),
      city: "Udaipur",
      venue: "Taj Lake Palace, Udaipur",
      guest_count: 450,
      contract_value: 9000000,
      total_budget: 9000000,
      status: "Completed",
      theme: "Monsoon Lotus & Candlelit Domes",
      packageTier: "Full-Service",
    },
    // [2] LOSS WEDDING 3: Excessive Team Hours (High Protocol)
    {
      title: "Amber Fort Heritage Durbar Wedding",
      wedding_date: datePast(95),
      city: "Jaipur",
      venue: "Amber Fort Ramparts & Courtyard",
      guest_count: 420,
      contract_value: 6500000,
      total_budget: 6500000,
      status: "Completed",
      theme: "Rajputana Martial & Folk Heritage",
      packageTier: "Full-Service",
    },
    // [3] LOSS WEDDING 4: Combination (Overrun + Absorbed Extras)
    {
      title: "Fateh Garh Sunset Regal Union",
      wedding_date: datePast(75),
      city: "Udaipur",
      venue: "Fateh Garh Heritage Palace, Udaipur",
      guest_count: 480,
      contract_value: 8000000,
      total_budget: 8000000,
      status: "Completed",
      theme: "Torchlit Courtyard & Sufi Night",
      packageTier: "Full-Service",
    },
    // [4-14] Profitable Completed Weddings
    {
      title: "Rambagh Palace Grand Maharaja Wedding",
      wedding_date: datePast(240),
      city: "Jaipur",
      venue: "Rambagh Palace, Jaipur",
      guest_count: 550,
      contract_value: 15000000,
      total_budget: 15000000,
      status: "Completed",
      theme: "Imperial Heritage Rajputana",
      packageTier: "Full-Service",
    },
    {
      title: "Udaivilas Pichola Regal Celebration",
      wedding_date: datePast(210),
      city: "Udaipur",
      venue: "The Oberoi Udaivilas, Udaipur",
      guest_count: 520,
      contract_value: 16000000,
      total_budget: 16000000,
      status: "Completed",
      theme: "Lakeside Sufi Grandeur",
      packageTier: "Full-Service",
    },
    {
      title: "Samode Haveli Courtyard Celebration",
      wedding_date: datePast(180),
      city: "Jaipur",
      venue: "Samode Palace, Jaipur",
      guest_count: 400,
      contract_value: 7000000,
      total_budget: 7000000,
      status: "Completed",
      theme: "Sheesh Mahal Mirror Magic",
      packageTier: "Partial / Day-of",
    },
    {
      title: "Jagmandir Island Sovereign Nuptials",
      wedding_date: datePast(165),
      city: "Udaipur",
      venue: "Jagmandir Island Palace, Udaipur",
      guest_count: 490,
      contract_value: 13500000,
      total_budget: 13500000,
      status: "Completed",
      theme: "Golden Mughal Romance",
      packageTier: "Full-Service",
    },
    {
      title: "Jai Mahal Palace Mughal Garden Vivah",
      wedding_date: datePast(140),
      city: "Jaipur",
      venue: "Jai Mahal Palace, Jaipur",
      guest_count: 460,
      contract_value: 9500000,
      total_budget: 9500000,
      status: "Completed",
      theme: "Mughal Floral Symphony",
      packageTier: "Full-Service",
    },
    {
      title: "Leela Palace Sunset Water Terrace",
      wedding_date: datePast(110),
      city: "Udaipur",
      venue: "The Leela Palace, Udaipur",
      guest_count: 430,
      contract_value: 11500000,
      total_budget: 11500000,
      status: "Completed",
      theme: "Ivory Lotus & Candlelit Pavilions",
      packageTier: "Full-Service",
    },
    {
      title: "Alsisar Mahal Haveli Heritage Vivah",
      wedding_date: datePast(90),
      city: "Jaipur",
      venue: "Alsisar Mahal Heritage Haveli",
      guest_count: 410,
      contract_value: 6200000,
      total_budget: 6200000,
      status: "Completed",
      theme: "Frescoes & Shekhawati Lore",
      packageTier: "Partial / Day-of",
    },
    {
      title: "Shiv Niwas Palace Crescent Courtyard",
      wedding_date: datePast(70),
      city: "Udaipur",
      venue: "Shiv Niwas Palace, Udaipur",
      guest_count: 470,
      contract_value: 10500000,
      total_budget: 10500000,
      status: "Completed",
      theme: "Imperial Mewar Durbar",
      packageTier: "Full-Service",
    },
    {
      title: "Fairmont Jaipur Aravalli Fortress",
      wedding_date: datePast(55),
      city: "Jaipur",
      venue: "Fairmont Jaipur",
      guest_count: 530,
      contract_value: 12000000,
      total_budget: 12000000,
      status: "Completed",
      theme: "Fortress Gold & Nagada Drummers",
      packageTier: "Full-Service",
    },
    {
      title: "Fateh Prakash Palace Durbar Hall",
      wedding_date: datePast(45),
      city: "Udaipur",
      venue: "Fateh Prakash Palace, Udaipur",
      guest_count: 440,
      contract_value: 8800000,
      total_budget: 8800000,
      status: "Completed",
      theme: "Crystal Gallery Grandeur",
      packageTier: "Full-Service",
    },
    {
      title: "Chomu Palace Heritage Nuptials",
      wedding_date: datePast(35),
      city: "Jaipur",
      venue: "Chomu Palace, Jaipur",
      guest_count: 400,
      contract_value: 6000000,
      total_budget: 6000000,
      status: "Completed",
      theme: "300-Year Palace Courtyard",
      packageTier: "Partial / Day-of",
    },

    // --- 5 IN PROGRESS WEDDINGS (Within 30 Days, including Today) ---
    // [15] TODAY'S WEDDING: Day-of Run-sheet
    {
      title: "Sharma & Singhania Royal Vivah (Today's Live Run-sheet)",
      wedding_date: todayStr,
      city: "Jaipur",
      venue: "Rambagh Palace, Jaipur",
      guest_count: 450,
      contract_value: 7500000,
      total_budget: 7500000,
      status: "In Progress",
      theme: "Palace Romance & Royal Florals",
      packageTier: "Full-Service",
    },
    // [16] In Progress (3 days ago / ongoing multi-day)
    {
      title: "Udaivilas Lakefront 3-Day Gala",
      wedding_date: datePast(3),
      city: "Udaipur",
      venue: "The Oberoi Udaivilas, Udaipur",
      guest_count: 480,
      contract_value: 13000000,
      total_budget: 13000000,
      status: "In Progress",
      theme: "Lakeside Sufi Grandeur",
      packageTier: "Full-Service",
    },
    // [17] In Progress (in 7 days)
    {
      title: "Jai Mahal Palace Winter Garden Nuptials",
      wedding_date: dateFuture(7),
      city: "Jaipur",
      venue: "Jai Mahal Palace, Jaipur",
      guest_count: 510,
      contract_value: 10000000,
      total_budget: 10000000,
      status: "In Progress",
      theme: "Mughal Floral Pavilion",
      packageTier: "Full-Service",
    },
    // [18] In Progress (in 14 days)
    {
      title: "Jagmandir Island Sunset Pheras",
      wedding_date: dateFuture(14),
      city: "Udaipur",
      venue: "Jagmandir Island Palace, Udaipur",
      guest_count: 430,
      contract_value: 11000000,
      total_budget: 11000000,
      status: "In Progress",
      theme: "Golden Lotus Overwater Mandap",
      packageTier: "Full-Service",
    },
    // [19] In Progress (in 24 days)
    {
      title: "Samode Palace Heritage Extravaganza",
      wedding_date: dateFuture(24),
      city: "Jaipur",
      venue: "Samode Palace, Jaipur",
      guest_count: 420,
      contract_value: 8200000,
      total_budget: 8200000,
      status: "In Progress",
      theme: "Sheesh Mahal & Candlelit Courtyards",
      packageTier: "Partial / Day-of",
    },

    // --- 5 UPCOMING WEDDINGS (Future) ---
    // [20] Upcoming
    {
      title: "The Leela Palace Spring Vivah",
      wedding_date: dateFuture(45),
      city: "Udaipur",
      venue: "The Leela Palace, Udaipur",
      guest_count: 460,
      contract_value: 12500000,
      total_budget: 12500000,
      status: "Planning",
      theme: "Ivory & Champagne Lake Pavilion",
      packageTier: "Full-Service",
    },
    // [21] Upcoming
    {
      title: "Fairmont Jaipur Grand Royal Wedding",
      wedding_date: dateFuture(60),
      city: "Jaipur",
      venue: "Fairmont Jaipur",
      guest_count: 550,
      contract_value: 14000000,
      total_budget: 14000000,
      status: "Planning",
      theme: "Fortress Gold & Sitar Melodies",
      packageTier: "Full-Service",
    },
    // [22] Upcoming
    {
      title: "Fateh Prakash Durbar Nuptials",
      wedding_date: dateFuture(80),
      city: "Udaipur",
      venue: "Fateh Prakash Palace, Udaipur",
      guest_count: 450,
      contract_value: 9500000,
      total_budget: 9500000,
      status: "Planning",
      theme: "Imperial Mewar Durbar",
      packageTier: "Full-Service",
    },
    // [23] Upcoming
    {
      title: "Alsisar Haveli Romantic Heritage Nuptials",
      wedding_date: dateFuture(100),
      city: "Jaipur",
      venue: "Alsisar Mahal Heritage Haveli",
      guest_count: 400,
      contract_value: 6800000,
      total_budget: 6800000,
      status: "Planning",
      theme: "Torchlit Shekhawati Frescoes",
      packageTier: "Partial / Day-of",
    },
    // [24] Upcoming
    {
      title: "Rambagh Palace Emerald Pavilion Vivah",
      wedding_date: dateFuture(120),
      city: "Jaipur",
      venue: "Rambagh Palace, Jaipur",
      guest_count: 540,
      contract_value: 15500000,
      total_budget: 15500000,
      status: "Planning",
      theme: "Mughal Emerald & Lotus Canopy",
      packageTier: "Full-Service",
    },
  ];

  const fullPackage = createdPackages.find((p: any) => p.tier === "Full-Service") || createdPackages[0];
  const partialPackage = createdPackages.find((p: any) => p.tier === "Partial / Day-of") || createdPackages[1];

  const weddingsInsertData = weddingsRawData.map((w, idx) => ({
    title: w.title,
    wedding_date: w.wedding_date,
    wedding_end_date: w.wedding_date,
    city: w.city,
    venue: w.venue,
    guest_count: w.guest_count,
    total_budget: w.total_budget,
    contract_value: w.contract_value,
    status: w.status,
    theme: w.theme,
    package_id: w.packageTier === "Full-Service" ? fullPackage.id : partialPackage.id,
    lead_planner_id: createdTeam[idx % createdTeam.length].id,
    notes: `Palatial celebration in ${w.city}. Managed by The Royal Knot.`,
    is_demo: true,
  }));

  const createdWeddings = await batchInsert("weddings", weddingsInsertData);

  // 8. Attach Vendors (14-18 for Full-Service, 6-8 for Partial), Bills & Payments
  console.log("• Attaching 14-18 Vendors per Full Wedding & 6-8 per Partial (with agreed amounts & bills)...");

  const weddingVendorsToInsert: any[] = [];
  const vendorBillsToInsert: any[] = [];
  const vendorPaymentsToInsert: any[] = [];
  const clientPaymentsToInsert: any[] = [];
  const extraChargesToInsert: any[] = [];
  const timeLogsToInsert: any[] = [];

  // Group created vendors by category for structured assignment
  const vendorsByCategory: Record<string, any[]> = {};
  for (const v of createdVendors) {
    if (!vendorsByCategory[v.category]) vendorsByCategory[v.category] = [];
    vendorsByCategory[v.category].push(v);
  }
  const categoriesList = Object.keys(vendorsByCategory);

  // Pre-generate wedding_vendors
  for (let wIdx = 0; wIdx < createdWeddings.length; wIdx++) {
    const wedding = createdWeddings[wIdx];
    const isFull = weddingsRawData[wIdx].packageTier === "Full-Service";
    const vendorCount = isFull ? 16 : 8;
    const contractVal = wedding.contract_value || 8000000;

    // Normal agreed budget target: 65% of contract value
    const targetAgreedTotal = Math.round(contractVal * 0.65);
    const avgAgreedPerVendor = Math.round(targetAgreedTotal / vendorCount);

    // Pick unique vendors across categories
    const selectedVendors: any[] = [];
    let catIdx = 0;
    while (selectedVendors.length < vendorCount) {
      const cat = categoriesList[catIdx % categoriesList.length];
      const catVendors = vendorsByCategory[cat] || createdVendors;
      const v = catVendors[(wIdx + selectedVendors.length) % catVendors.length];
      if (!selectedVendors.some((sv) => sv.id === v.id)) {
        selectedVendors.push(v);
      }
      catIdx++;
      if (catIdx > 50) break; // Safeguard
    }

    for (let vIdx = 0; vIdx < selectedVendors.length; vIdx++) {
      const vendor = selectedVendors[vIdx];
      // Vary slightly around average for realism
      const varianceFactor = 0.7 + ((vIdx * 7) % 7) * 0.1; // 0.7 to 1.3
      const agreedAmount = Math.round(avgAgreedPerVendor * varianceFactor);
      const advancePaid = Math.round(agreedAmount * 0.3);

      weddingVendorsToInsert.push({
        wedding_id: wedding.id,
        vendor_id: vendor.id,
        category: vendor.category,
        role_description: `Principal ${vendor.category} provider for palatial festivities`,
        agreed_amount: agreedAmount,
        advance_paid: advancePaid,
        arrival_status: "Pending",
        status: "Confirmed",
        is_demo: true,
      });
    }
  }

  const createdWeddingVendors = await batchInsert("wedding_vendors", weddingVendorsToInsert);

  // Index created wedding_vendors by wedding_id
  const wvByWedding: Record<string, any[]> = {};
  for (const wv of createdWeddingVendors) {
    if (!wvByWedding[wv.wedding_id]) wvByWedding[wv.wedding_id] = [];
    wvByWedding[wv.wedding_id].push(wv);
  }

  // 9. Generate Bills, Payments, Extra Charges, Time Logs, and Client Payments
  console.log("• Constructing Financial Ecosystem: Bills, Payments, Absorbed Extras & 4 Target Loss Weddings...");

  for (let wIdx = 0; wIdx < createdWeddings.length; wIdx++) {
    const wedding = createdWeddings[wIdx];
    const wRaw = weddingsRawData[wIdx];
    const attachedVendors = wvByWedding[wedding.id] || [];
    const isCompleted = wRaw.status === "Completed";
    const isInProgress = wRaw.status === "In Progress";
    const contractVal = wedding.contract_value || 8000000;

    // --- Client Payments (3 Milestones) ---
    const bookingAmt = Math.round(contractVal * 0.25);
    const advanceAmt = Math.round(contractVal * 0.50);
    const finalAmt = contractVal - bookingAmt - advanceAmt;

    const wDate = new Date(wedding.wedding_date);
    const bookingDue = new Date(wDate.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const advanceDue = new Date(wDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const finalDue = new Date(wDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    if (isCompleted) {
      // Completed: all 3 paid
      clientPaymentsToInsert.push(
        { wedding_id: wedding.id, milestone: "Booking", amount: bookingAmt, due_date: bookingDue, paid_at: new Date(bookingDue).toISOString(), status: "Paid", payment_method: "Bank Transfer (NEFT)", is_demo: true },
        { wedding_id: wedding.id, milestone: "Advance", amount: advanceAmt, due_date: advanceDue, paid_at: new Date(advanceDue).toISOString(), status: "Paid", payment_method: "Bank Transfer (RTGS)", is_demo: true },
        { wedding_id: wedding.id, milestone: "Final", amount: finalAmt, due_date: finalDue, paid_at: new Date(finalDue).toISOString(), status: "Paid", payment_method: "Bank Transfer (RTGS)", is_demo: true }
      );
    } else if (isInProgress) {
      // In Progress: booking & advance paid; final pending
      clientPaymentsToInsert.push(
        { wedding_id: wedding.id, milestone: "Booking", amount: bookingAmt, due_date: bookingDue, paid_at: new Date(bookingDue).toISOString(), status: "Paid", payment_method: "Bank Transfer (RTGS)", is_demo: true },
        { wedding_id: wedding.id, milestone: "Advance", amount: advanceAmt, due_date: advanceDue, paid_at: new Date(advanceDue).toISOString(), status: "Paid", payment_method: "Bank Transfer (RTGS)", is_demo: true },
        { wedding_id: wedding.id, milestone: "Final", amount: finalAmt, due_date: finalDue, paid_at: null, status: "Pending", payment_method: "Bank Transfer (RTGS)", is_demo: true }
      );
    } else {
      // Upcoming: booking paid; advance & final pending
      clientPaymentsToInsert.push(
        { wedding_id: wedding.id, milestone: "Booking", amount: bookingAmt, due_date: bookingDue, paid_at: new Date(bookingDue).toISOString(), status: "Paid", payment_method: "Bank Transfer (NEFT)", is_demo: true },
        { wedding_id: wedding.id, milestone: "Advance", amount: advanceAmt, due_date: advanceDue, paid_at: null, status: "Pending", payment_method: "Bank Transfer (RTGS)", is_demo: true },
        { wedding_id: wedding.id, milestone: "Final", amount: finalAmt, due_date: finalDue, paid_at: null, status: "Pending", payment_method: "Bank Transfer (RTGS)", is_demo: true }
      );
    }

    // --- Standard Time Logs for Every Wedding ---
    // Gayatri (2500/hr), Raghavendra (2000/hr), Ananya (1800/hr)
    let gayatriHours = 35;
    let raghavHours = 45;
    let ananyaHours = 30;

    // --- 4 SPECIFIC LOSS-MAKING WEDDINGS & BILLING LOGIC ---
    if (wIdx === 0) {
      // LOSS 1: "Royal Rajvilas Winter Vivah" -> Driver: Vendor Overrun
      // contract_value = 8,500,000.
      // Total vendor bills = 9,800,000 (Overrun = ~4.2M over agreed ~5.5M).
      // Team cost = 231,500. Absorbed extras = 0.
      // Total costs = 9,800,000 + 231,500 = 10,031,500. Profit = -1,531,500. Loss reason: 'Vendor overrun'.
      const perVendorOverrunBill = Math.round(9800000 / (attachedVendors.length || 1));
      for (const wv of attachedVendors) {
        vendorBillsToInsert.push({
          wedding_vendor_id: wv.id,
          amount: perVendorOverrunBill,
          note: "Includes emergency scope expansion, structural rigging, and holiday overtime",
          is_demo: true,
        });
      }
    } else if (wIdx === 1) {
      // LOSS 2: "Lake Palace Monsoon Nuptials" -> Driver: Absorbed Extras
      // contract_value = 9,000,000.
      // Vendor bills match agreed (~4.1M).
      // Absorbed extras (client_billable = false) = 5,500,000!
      // Total cost = ~4.1M + 5.5M + 0.231M = ~9.83M. Profit = -830,000. Loss reason: 'Absorbed extras'.
      for (const wv of attachedVendors) {
        vendorBillsToInsert.push({
          wedding_vendor_id: wv.id,
          amount: wv.agreed_amount,
          note: "Final invoice matching contract quotation",
          is_demo: true,
        });
      }
      extraChargesToInsert.push(
        {
          wedding_id: wedding.id,
          description: "Unplanned Waterproof Glass Courtyard Canopy & Structural Monsoon Gale Trussing (Absorbed by Agency)",
          qty: 1,
          unit_price: 3500000,
          client_billable: false,
          is_demo: true,
        },
        {
          wedding_id: wedding.id,
          description: "Emergency Acoustic Baffle Replacements & High-Capacity Flood Water Pumps (Absorbed by Agency)",
          qty: 1,
          unit_price: 2000000,
          client_billable: false,
          is_demo: true,
        }
      );
    } else if (wIdx === 2) {
      // LOSS 3: "Amber Fort Heritage Durbar Wedding" -> Driver: Excessive Team Hours
      // contract_value = 6,500,000.
      // Vendor bills match agreed (~2.95M).
      // Absorbed extras = 0.
      // Team logs 1,900 hours across team = 4,000,000 in team costs!
      // Total cost = 2.95M + 4.0M = 6.95M. Profit = -450,000. Loss reason: 'Team hours'.
      for (const wv of attachedVendors) {
        vendorBillsToInsert.push({
          wedding_vendor_id: wv.id,
          amount: wv.agreed_amount,
          note: "Heritage tender settled as agreed",
          is_demo: true,
        });
      }
      gayatriHours = 600; // 600 * 2500 = 1,500,000
      raghavHours = 800;  // 800 * 2000 = 1,600,000
      ananyaHours = 500;  // 500 * 1800 = 900,000
      // Total team cost = 4,000,000!
    } else if (wIdx === 3) {
      // LOSS 4: "Fateh Garh Sunset Regal Union" -> Driver: Combination (Overrun + Absorbed Extras)
      // contract_value = 8,000,000.
      // Total vendor bills = 7,600,000 (Overrun = ~2.8M over agreed 4.8M).
      // Absorbed extras = 1,800,000.
      // Team cost = 231,500.
      // Total cost = 7.6M + 1.8M + 0.231M = 9,631,500. Profit = -1,631,500. Loss reason: 'Vendor overrun'.
      const perVendorOverrunBill = Math.round(7600000 / (attachedVendors.length || 1));
      for (const wv of attachedVendors) {
        vendorBillsToInsert.push({
          wedding_vendor_id: wv.id,
          amount: perVendorOverrunBill,
          note: "Hilltop freight surcharge and equipment replacement fees",
          is_demo: true,
        });
      }
      extraChargesToInsert.push({
        wedding_id: wedding.id,
        description: "Emergency Mountain Road Landslide Clearing & Private Backup Generator Airlift (Absorbed by Agency)",
        qty: 1,
        unit_price: 1800000,
        client_billable: false,
        is_demo: true,
      });
    } else if (isCompleted) {
      // ALL OTHER 11 COMPLETED WEDDINGS: Highly Profitable (+25% to +35% margin)
      for (const wv of attachedVendors) {
        vendorBillsToInsert.push({
          wedding_vendor_id: wv.id,
          amount: wv.agreed_amount,
          note: "Full palatial service delivery completed without discrepancies",
          is_demo: true,
        });
      }
      // Occasional client-billable extra (adds to revenue!)
      if (wIdx % 3 === 0) {
        extraChargesToInsert.push({
          wedding_id: wedding.id,
          description: "40 Additional VIP Silver Thali Banquets & Late Night Champagne Tower",
          qty: 40,
          unit_price: 3500,
          client_billable: true,
          is_demo: true,
        });
      }
    } else if (isInProgress) {
      // IN PROGRESS: Partial billing (first 50% of vendors billed)
      for (let vI = 0; vI < attachedVendors.length; vI++) {
        if (vI % 2 === 0) {
          const wv = attachedVendors[vI];
          vendorBillsToInsert.push({
            wedding_vendor_id: wv.id,
            amount: Math.round(wv.agreed_amount * 0.7),
            note: "First milestone & procurement invoice",
            is_demo: true,
          });
        }
      }
    }

    // Insert Time Logs
    timeLogsToInsert.push(
      { wedding_id: wedding.id, member_id: createdTeam[0].id, hours: gayatriHours, hourly_cost: 2500, is_demo: true },
      { wedding_id: wedding.id, member_id: createdTeam[1].id, hours: raghavHours, hourly_cost: 2000, is_demo: true },
      { wedding_id: wedding.id, member_id: createdTeam[2].id, hours: ananyaHours, hourly_cost: 1800, is_demo: true }
    );
  }

  // Insert generated records
  await batchInsert("client_payments", clientPaymentsToInsert);
  await batchInsert("extra_charges", extraChargesToInsert);
  await batchInsert("time_logs", timeLogsToInsert);

  const createdBills = await batchInsert("vendor_bills", vendorBillsToInsert);

  // Seed vendor payments for bills
  console.log("• Authorizing Realistic Vendor Payments against Bills...");
  for (let bIdx = 0; bIdx < createdBills.length; bIdx++) {
    const bill = createdBills[bIdx];
    // Settle 85% of bills for completed weddings, 60% for in-progress
    if (bIdx % 6 !== 0) {
      const payAmount = Math.round(bill.amount * 0.85);
      vendorPaymentsToInsert.push({
        vendor_bill_id: bill.id,
        amount: payAmount,
        idempotency_key: `pmt-demo-${bill.id.slice(0, 8)}-${bIdx}`,
        is_demo: true,
      });
    }
  }
  await batchInsert("vendor_payments", vendorPaymentsToInsert);

  // 10. Generate Wedding Tasks from Templates for each Wedding
  console.log("• Instantiating Wedding Tasks from Templates...");
  const tasksToInsert: any[] = [];
  for (let wIdx = 0; wIdx < createdWeddings.length; wIdx++) {
    const wedding = createdWeddings[wIdx];
    const isCompleted = weddingsRawData[wIdx].status === "Completed";
    const wDate = new Date(wedding.wedding_date);

    for (let tIdx = 0; tIdx < templatesData.length; tIdx++) {
      const tmpl = templatesData[tIdx];
      const taskDueDate = new Date(wDate.getTime() + tmpl.offset_days_from_wedding * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      let stage = "To Plan";
      let completedAt = null;
      if (isCompleted) {
        stage = "Done";
        completedAt = new Date(taskDueDate).toISOString();
      } else if (tmpl.offset_days_from_wedding < 0) {
        stage = (wIdx + tIdx) % 3 === 0 ? "Done" : "In Progress";
        if (stage === "Done") completedAt = new Date().toISOString();
      }

      tasksToInsert.push({
        wedding_id: wedding.id,
        title: tmpl.title,
        phase: tmpl.phase,
        stage: stage,
        owner: createdTeam[tIdx % createdTeam.length].id,
        due_date: taskDueDate,
        completed_at: completedAt,
        notes: `Operational mandate assigned to ${tmpl.default_role}`,
        is_demo: true,
      });
    }
  }
  await batchInsert("wedding_tasks", tasksToInsert);

  // 10B. Seed Realistic Palace Guests for Weddings
  console.log("• Provisioning Realistic Guest Roster & RSVPs across Weddings...");
  const guestRosterTemplates = [
    { name: "Maharaja Gaj Singh II", email: "gajsingh@heritagepalaces.in", phone: "+91 98290 11001", rsvp: "Attending", is_vip: true, room: "Maharaja Royal Suite 101", table: "T-01 (Head Royal)", diet: "Jain Pure Vegetarian" },
    { name: "Princess Diya Kumari", email: "diya@jaipurroyal.in", phone: "+91 98290 11002", rsvp: "Attending", is_vip: true, room: "Zenana Palace Villa 01", table: "T-01 (Head Royal)", diet: "Pure Vegetarian" },
    { name: "Kumar Lakshyaraj Singh", email: "lakshyaraj@mewarpalace.in", phone: "+91 98290 11003", rsvp: "Attending", is_vip: true, room: "Mewar Sovereign Suite", table: "T-01 (Head Royal)", diet: "Traditional Rajput Feast" },
    { name: "Ambassador Emmanuel Lenain", email: "e.lenain@diplomatie.gouv.fr", phone: "+91 98100 22004", rsvp: "Attending", is_vip: true, room: "Lakefront Pavilion Suite 202", table: "T-02 (Diplomatic Envoy)", diet: "Halal / French Culinary Protocol" },
    { name: "Vikramaditya & Gayatri Birla", email: "v.birla@adityabirla.com", phone: "+91 98200 33005", rsvp: "Attending", is_vip: true, room: "Aravalli Presidential Villa", table: "T-03 (Family Dignitaries)", diet: "Pure Vegetarian / Low Sodium" },
    { name: "Sunita & Arvind Singhania", email: "arvind@singhania.in", phone: "+91 98200 44006", rsvp: "Attending", is_vip: true, room: "Haveli Deluxe Suite 14", table: "T-03 (Family Dignitaries)", diet: "Jain Dedicated Kitchen" },
    { name: "Rohan & Meera Kapoor", email: "rohan.kapoor@capital.in", phone: "+91 98111 55007", rsvp: "Attending", is_vip: false, room: "Courtyard Deluxe Room 204", table: "T-05", diet: "None" },
    { name: "Col. Jaideep Rathore (Retd)", email: "jaideep.rathore@indianarmy.nic.in", phone: "+91 98291 66008", rsvp: "Attending", is_vip: false, room: "Fort Bastion Guest Wing 04", table: "T-04", diet: "Gluten-Free" },
    { name: "Dr. Ayesha Al-Qasimi", email: "ayesha@al-qasimi.ae", phone: "+971 50 123 4567", rsvp: "Attending", is_vip: true, room: "Durbar Luxury Suite 08", table: "T-02 (Diplomatic Envoy)", diet: "Strict Halal" },
    { name: "Nikhil & Tanya Merchant", email: "tanya@merchantfin.com", phone: "+91 98210 77009", rsvp: "Pending", is_vip: false, room: "Terrace Garden Suite 21", table: "T-06", diet: "Vegan" },
    { name: "Aditya & Priya Mittal", email: "aditya.mittal@mittalholdings.com", phone: "+91 98201 88010", rsvp: "Attending", is_vip: true, room: "Grand Heritage Suite 10", table: "T-03 (Family Dignitaries)", diet: "Pure Vegetarian" },
    { name: "Siddharth Oberoi", email: "siddharth@oberoiventures.com", phone: "+91 98102 99011", rsvp: "Declined", is_vip: false, room: "Deluxe Wing 402", table: "T-08", diet: "None" },
    { name: "Kavita & Rajesh Jhunjhunwala", email: "rajesh@rareenterprises.in", phone: "+91 98202 11012", rsvp: "Attending", is_vip: true, room: "Royal Lakeside Pavilions 03", table: "T-01 (Head Royal)", diet: "Jain Dedicated Kitchen" },
    { name: "Manish Malhotra", email: "manish@manishmalhotra.in", phone: "+91 98203 22013", rsvp: "Attending", is_vip: true, room: "Designer Imperial Suite 01", table: "T-02 (Diplomatic Envoy)", diet: "Organic Farm-to-Table" },
    { name: "Gaurav & Shweta Goenka", email: "g.goenka@goenkagroup.com", phone: "+91 98300 33014", rsvp: "Attending", is_vip: false, room: "Heritage Suite 108", table: "T-04", diet: "Low Sugar" },
    { name: "Devendra & Malini Scindia", email: "devendra@scindiaestates.in", phone: "+91 98260 44015", rsvp: "Attending", is_vip: true, room: "Palace Durbar Suite", table: "T-01 (Head Royal)", diet: "Traditional Rajput Feast" },
    { name: "Varun & Kriti Sanon Party", email: "mgmt@sanon.in", phone: "+91 98204 55016", rsvp: "Attending", is_vip: true, room: "Luxury Safari Tents 05", table: "T-07 (Celebrity Delegation)", diet: "High Protein" },
    { name: "Harsh & Radhika Piramal", email: "harsh@piramal.com", phone: "+91 98205 66017", rsvp: "Attending", is_vip: true, room: "Mewar Royal Wing 12", table: "T-03 (Family Dignitaries)", diet: "Pure Vegetarian" },
    { name: "Aarav Somani", email: "aarav@somani.in", phone: "+91 98103 77018", rsvp: "Pending", is_vip: false, room: "Courtyard Room 102", table: "T-05", diet: "None" },
    { name: "Zoya & Farhan Akhtar", email: "zoya@tigerbaby.in", phone: "+91 98206 88019", rsvp: "Attending", is_vip: true, room: "Royal Sunset Suite 04", table: "T-07 (Celebrity Delegation)", diet: "Vegan / Dairy-Free" },
  ];

  const guestsToInsert: any[] = [];
  // Determine which side the guest belongs to (alternating bride/groom sides)
  const sides = ["Bride", "Groom", "Both", "Bride", "Groom"];
  for (let wIdx = 0; wIdx < createdWeddings.length; wIdx++) {
    const wedding = createdWeddings[wIdx];
    const countForWedding = wIdx === 0 || wIdx === 15 ? guestRosterTemplates.length : 12;
    for (let gIdx = 0; gIdx < countForWedding; gIdx++) {
      const tmpl = guestRosterTemplates[gIdx % guestRosterTemplates.length];
      guestsToInsert.push({
        wedding_id: wedding.id,
        name: tmpl.name,
        party_size: tmpl.is_vip ? 2 : 1,
        rsvp_status: tmpl.rsvp,
        side: sides[gIdx % sides.length],
        dietary_notes: tmpl.diet,
        hotel_assigned: wedding.venue ? wedding.venue.split(",")[0] : "Rambagh Palace",
        room_number: tmpl.room,
        is_demo: true,
      });
    }
  }
  await batchInsert("guests", guestsToInsert);

  // 10B-2. Seed Royal Guest Concierge: Multi-day Itineraries & Digital Passports
  console.log("• Provisioning 3-Day Wedding Itineraries and Royal Concierge Passports...");
  const itinerariesToInsert: any[] = [];
  const itinerariesTemplate = [
    {
      day_number: 1,
      day_title: "Day 1: Imperial Mehendi & Sufi Serenade",
      event_name: "Palace Welcome & Sufi Mehfil",
      start_time: "04:30 PM",
      end_time: "08:30 PM",
      sublocation: "Kesar Kyari Courtyard",
      dress_code: "Royal Emeralds & Heritage Leheriya",
      description: "Traditional henna application followed by live Sufi musical ensemble under the palace stars.",
    },
    {
      day_number: 2,
      day_title: "Day 2: Royal Sangeet & Shahi Banquet",
      event_name: "Grand Sangeet & Folk Dancers",
      start_time: "07:00 PM",
      end_time: "11:30 PM",
      sublocation: "Durbar Dining Hall & Gardens",
      dress_code: "Imperial Velvets, Tuxedos & Heavy Zari",
      description: "Cocktail reception, choreographed family dance performances, and 108-dish royal silver thali banquet.",
    },
    {
      day_number: 3,
      day_title: "Day 3: Shahi Vivah & Vidai Reception",
      event_name: "Vedic Pheras & Royal Reception",
      start_time: "05:00 PM",
      end_time: "10:30 PM",
      sublocation: "Lake Pavilion Mandap",
      dress_code: "Traditional Shahi Safa & Crimson Silks",
      description: "Solemn wedding vows around the holy fire, terrace fireworks, and dinner honoring the newly wed couple.",
    },
  ];

  for (const wedding of createdWeddings) {
    for (const item of itinerariesTemplate) {
      itinerariesToInsert.push({
        wedding_id: wedding.id,
        day_number: item.day_number,
        day_title: item.day_title,
        event_name: item.event_name,
        start_time: item.start_time,
        end_time: item.end_time,
        venue_sublocation: item.sublocation,
        dress_code: item.dress_code,
        description: item.description,
        location_map_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.venue || "Jaipur")}`,
        sort_order: item.day_number,
        is_demo: true,
      });
    }
  }

  const { error: testItinErr } = await supabase.from("wedding_itineraries").select("id").limit(1);
  if (!testItinErr) {
    await batchInsert("wedding_itineraries", itinerariesToInsert);
  } else {
    console.log("   (wedding_itineraries table not yet migrated in Supabase; skipped seed insertion)");
  }

  // Provision Guest Passports for seeded demo guests
  const { data: dbGuests } = await supabase
    .from("guests")
    .select("id, wedding_id, name, is_demo")
    .eq("is_demo", true);

  if (dbGuests && dbGuests.length > 0) {
    const passportsToInsert: any[] = [];
    const mealOptions = [
      "Royal Rajputana Thali",
      "Pure Vegetarian Satvik",
      "Jain Specialty (No Root Vegetables)",
      "Continental Gourmet",
    ];
    const drivers = [
      { name: "Mukesh Sharma", phone: "+91 98290 88221", vehicle: "Toyota Crysta (RJ-14 TC 2026)" },
      { name: "Surendra Singh", phone: "+91 98290 77112", vehicle: "Mercedes E-Class (RJ-14 DE 1100)" },
      { name: "Ratan Lal Rathore", phone: "+91 98290 66334", vehicle: "Toyota Fortuner (RJ-14 AB 9988)" },
    ];
    const flights = ["AI-491 (Landing 02:30 PM)", "6E-204 (Landing 11:15 AM)", "UK-955 (Landing 04:45 PM)"];

    for (let i = 0; i < dbGuests.length; i++) {
      const g = dbGuests[i];
      // Cryptographically random bearer token (never fixed or predictable)
      const rawToken = crypto.randomBytes(24).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const hasPickup = i % 3 === 0;
      const driver = drivers[i % drivers.length];
      const flight = flights[i % flights.length];

      passportsToInsert.push({
        guest_id: g.id,
        wedding_id: g.wedding_id,
        token_hash: tokenHash,
        welcome_message: `We are deeply honored to welcome you to the royal wedding celebration. Your presence graces our palace.`,
        airport_pickup_required: hasPickup,
        arrival_flight_train: hasPickup ? flight : null,
        pickup_location: hasPickup ? "Jaipur International Airport (JAI)" : null,
        transport_status: hasPickup ? "Driver Assigned" : "Not Required",
        assigned_driver_name: hasPickup ? driver.name : null,
        assigned_driver_phone: hasPickup ? driver.phone : null,
        vehicle_details: hasPickup ? driver.vehicle : null,
        meal_preference: mealOptions[i % mealOptions.length],
        special_assistance: i % 7 === 0 ? "Wheelchair escort assistance at palace entrance" : null,
        revoked: false,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        is_demo: true,
      });
    }

    const { error: testPassErr } = await supabase.from("guest_passports").select("id").limit(1);
    if (!testPassErr) {
      await batchInsert("guest_passports", passportsToInsert);
    } else {
      console.log("   (guest_passports table not yet migrated in Supabase; skipped seed insertion)");
    }
  }

  // 10C. Seed Digital Contracts Vault across Weddings
  console.log("• Provisioning Digital Contracts & Legal Agreements Vault...");
  const contractsToInsert: any[] = [];
  for (let wIdx = 0; wIdx < createdWeddings.length; wIdx++) {
    const wedding = createdWeddings[wIdx];
    const isCompleted = weddingsRawData[wIdx].status === "Completed";
    const isInProgress = weddingsRawData[wIdx].status === "In Progress";
    const cVal = wedding.contract_value || 8000000;

    // 1. Client Service Master Agreement
    contractsToInsert.push({
      wedding_id: wedding.id,
      title: `Palatial Wedding Service Master Agreement — ${wedding.title}`,
      total_value: cVal,
      status: isCompleted || isInProgress ? "Signed" : "Sent",
      signed_at: isCompleted || isInProgress ? datePast(90) : null,
      terms: "Standard luxury heritage event terms: 25% non-refundable retainer, balance in 2 milestones.",
      couple_name: wedding.title,
      is_demo: true,
    });

    // 2. Palace Venue Booking Lease
    contractsToInsert.push({
      wedding_id: wedding.id,
      title: `Exclusive Palace Estate Lease & Durbar Agreement — ${wedding.venue}`,
      total_value: Math.round(cVal * 0.40),
      status: "Signed",
      signed_at: datePast(120),
      terms: "Includes exclusive access to courtyards, banquet terraces, and bridal suites.",
      couple_name: wedding.title,
      is_demo: true,
    });

    // 3. Vendor Master Catering SLA
    contractsToInsert.push({
      wedding_id: wedding.id,
      title: `Artisan Shahi Feast & Banqueting Master SLA — ${wedding.title}`,
      total_value: Math.round(cVal * 0.25),
      status: isCompleted ? "Signed" : isInProgress ? "Signed" : "Draft",
      signed_at: isCompleted || isInProgress ? datePast(60) : null,
      terms: "Silver thali banquet service with certified food safety and overtime compensation rates.",
      couple_name: wedding.title,
      is_demo: true,
    });
  }
  await batchInsert("contracts", contractsToInsert);

  // 11. Day-of Command Center: Schedule Items & Incidents for Weddings
  console.log("• Seeding Day-of Command Center Run-sheets...");
  const commandCenterWeddings = createdWeddings;
  const todayWedding = createdWeddings[15]; // wedding_date = today

  const vendorDJ = createdVendors.find((v: any) => v.category === "Music and DJ") || createdVendors[16];
  const vendorFlorist = createdVendors.find((v: any) => v.category === "Decor & Florals") || createdVendors[8];
  const vendorCatering = createdVendors.find((v: any) => v.category === "Catering") || createdVendors[0];
  const vendorVintageWheels = createdVendors.find((v: any) => v.category === "Transport") || createdVendors[33];
  const vendorDesertSymphony = createdVendors.find((v: any) => v.name.includes("Desert Symphony")) || createdVendors[17];
  const vendorPhotography = createdVendors.find((v: any) => v.category === "Photography") || createdVendors[22];

  const nowMs = Date.now();
  const scheduleItemTemplates = [
    {
      wedding_id: todayWedding.id,
      title: "Royal Vintage Chariot Barat Delivery",
      event_name: "Royal Vintage Chariot Barat Delivery",
      venue_sublocation: "Palace Outer Gate",
      scheduled_time: new Date(nowMs - 50 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs - 50 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorVintageWheels?.id || null,
      responsible_member_id: createdTeam[1].id,
      status: "Done",
      arrived_at: new Date(nowMs - 55 * 60 * 1000).toISOString(), // Arrived early
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Shehnai & Nagada Folk Troupe Welcoming",
      event_name: "Shehnai & Nagada Folk Troupe Welcoming",
      venue_sublocation: "Toran Gateway Arch",
      scheduled_time: new Date(nowMs - 35 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs - 35 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorDesertSymphony?.id || null,
      responsible_member_id: createdTeam[2].id,
      status: "Done",
      arrived_at: new Date(nowMs - 40 * 60 * 1000).toISOString(), // Arrived
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Royal DJ & Sound Array Check-in",
      event_name: "Royal DJ & Sound Array Check-in",
      venue_sublocation: "Grand Courtyard Stage",
      scheduled_time: new Date(nowMs - 20 * 60 * 1000).toISOString(), // 20 mins in past
      start_time: new Date(nowMs - 20 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorDJ?.id || null,
      responsible_member_id: createdTeam[1].id,
      status: "Pending",
      arrived_at: null, // NULL: LATE! Demonstrates Command Center alert
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Groom Grand Baraat Procession",
      event_name: "Groom Grand Baraat Procession",
      venue_sublocation: "Elephant Ramp to Palace Porch",
      scheduled_time: new Date(nowMs + 15 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs + 15 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorVintageWheels?.id || null,
      responsible_member_id: createdTeam[1].id,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Toran Gate Welcome & Royal Milni Ceremony",
      event_name: "Toran Gate Welcome & Royal Milni Ceremony",
      venue_sublocation: "Zenana Courtyard Entrance",
      scheduled_time: new Date(nowMs + 40 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs + 40 * 60 * 1000).toISOString(),
      responsible_vendor_id: null,
      responsible_member_id: createdTeam[0].id,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Bridal Entry under Lotus Chhatri",
      event_name: "Bridal Entry under Lotus Chhatri",
      venue_sublocation: "Marble Corridor",
      scheduled_time: new Date(nowMs + 65 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs + 65 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorFlorist?.id || null,
      responsible_member_id: createdTeam[2].id,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Varmala & Garland Exchange Ceremony",
      event_name: "Varmala & Garland Exchange Ceremony",
      venue_sublocation: "Central Lotus Pond Stage",
      scheduled_time: new Date(nowMs + 90 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs + 90 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorFlorist?.id || null,
      responsible_member_id: createdTeam[0].id,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "High Tea & Shahi Refreshments",
      event_name: "High Tea & Shahi Refreshments",
      venue_sublocation: "Mughal Garden Pavilions",
      scheduled_time: new Date(nowMs + 120 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs + 120 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorCatering?.id || null,
      responsible_member_id: createdTeam[2].id,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Sunset Vedic Pheras & Sacred Fire Rites",
      event_name: "Sunset Vedic Pheras & Sacred Fire Rites",
      venue_sublocation: "Mandapam on Lake Terrace",
      scheduled_time: new Date(nowMs + 160 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs + 160 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorFlorist?.id || null,
      responsible_member_id: createdTeam[0].id,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Sindoor Khela & Mangalsutra Bandhan",
      event_name: "Sindoor Khela & Mangalsutra Bandhan",
      venue_sublocation: "Heritage Mandap",
      scheduled_time: new Date(nowMs + 200 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs + 200 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorPhotography?.id || null,
      responsible_member_id: createdTeam[0].id,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Grand Shahi Buffet Service Inauguration",
      event_name: "Grand Shahi Buffet Service Inauguration",
      venue_sublocation: "Durbar Dining Hall",
      scheduled_time: new Date(nowMs + 240 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs + 240 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorCatering?.id || null,
      responsible_member_id: createdTeam[2].id,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Folk Artists & Sufi Mehfil Performance",
      event_name: "Folk Artists & Sufi Mehfil Performance",
      venue_sublocation: "Courtyard Amphitheatre",
      scheduled_time: new Date(nowMs + 280 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs + 280 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorDesertSymphony?.id || null,
      responsible_member_id: createdTeam[1].id,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Palace Terrace Fireworks Spectacular",
      event_name: "Palace Terrace Fireworks Spectacular",
      venue_sublocation: "Upper Bastion Skyline",
      scheduled_time: new Date(nowMs + 320 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs + 320 * 60 * 1000).toISOString(),
      responsible_vendor_id: null,
      responsible_member_id: createdTeam[1].id,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Vidaai Farewell & Vintage Rolls Royce Escort",
      event_name: "Vidaai Farewell & Vintage Rolls Royce Escort",
      venue_sublocation: "Grand Portico",
      scheduled_time: new Date(nowMs + 360 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs + 360 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorVintageWheels?.id || null,
      responsible_member_id: createdTeam[0].id,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
  ];

  const scheduleItemsData: any[] = [];
  const incidentData: any[] = [];

  for (const wed of commandCenterWeddings) {
    if (!wed) continue;
    for (const tmpl of scheduleItemTemplates) {
      scheduleItemsData.push({
        ...tmpl,
        wedding_id: wed.id,
      });
    }

    incidentData.push(
      {
        wedding_id: wed.id,
        title: "Florist needs a generator for mandap lighting",
        severity: "High",
        status: "Open",
        owner_id: createdTeam[1].id,
        resolution: null,
        is_demo: true,
      },
      {
        wedding_id: wed.id,
        title: "VIP Courtyard High Tea Ice Sculptures Delayed in Transit",
        severity: "Medium",
        status: "Resolved",
        owner_id: createdTeam[2].id,
        resolution: "Cold storage transport van escorted with palace police clearance",
        is_demo: true,
      }
    );
  }

  await batchInsert("schedule_items", scheduleItemsData);
  await batchInsert("incidents", incidentData);

  // 12. Quote Requests & Vendor Quotes (1 Open with 3 Caterer Quotes, 1 Closed with Awarded Quote)
  console.log("• Seeding Quote Requests & Competing Vendor Quotes...");
  const cateringVendors = createdVendors.filter((v: any) => v.category === "Catering");

  // Open Catering RFP on Today's Wedding
  const openRfpData = [
    {
      wedding_id: todayWedding.id,
      category: "Catering",
      scope_description: "Royal 3-day silver thali banquet for 450 guests including live chaat counters and midnight snack bar.",
      guest_count: 450,
      requested_deadline: dateFuture(7),
      status: "Open",
      is_demo: true,
    },
  ];
  const [createdOpenRfp] = await batchInsert("quote_requests", openRfpData);

  if (createdOpenRfp && cateringVendors.length >= 3) {
    const quotesData = [
      {
        quote_request_id: createdOpenRfp.id,
        vendor_id: cateringVendors[0].id,
        price_per_plate: 3200,
        extra_hour_rate: 25000,
        inclusions: ["Silver Thali Service", "Royal Welcome Drinks", "Live Chaat Counter", "Jain Dedicated Kitchen", "Midnight Snack Bar"],
        total: 3200 * 450,
        status: "Submitted",
        notes: "Full traditional Mewar feast with 42 royal recipes cooked in copper degs.",
        is_demo: true,
      },
      {
        quote_request_id: createdOpenRfp.id,
        vendor_id: cateringVendors[1].id,
        price_per_plate: 3800,
        extra_hour_rate: 35000,
        inclusions: ["Silver Thali Service", "Royal Welcome Drinks", "Live Chaat Counter", "24k Gold Foil Sweets", "Artisan Mocktail Bar", "Midnight Snack Bar"],
        total: 3800 * 450,
        status: "Submitted",
        notes: "Gourmet royal feast with handcrafted 24k gold leaf mithai hampers and mixologist beverage program.",
        is_demo: true,
      },
      {
        quote_request_id: createdOpenRfp.id,
        vendor_id: cateringVendors[2].id,
        price_per_plate: 2950,
        extra_hour_rate: 20000,
        inclusions: ["Silver Thali Service", "Royal Welcome Drinks", "Live Chaat Counter", "Jain Dedicated Kitchen"],
        total: 2950 * 450,
        status: "Submitted",
        notes: "Heritage Rajasthani menu with woodfire clay ovens and traditional dal baati stations.",
        is_demo: true,
      },
    ];
    await batchInsert("vendor_quotes", quotesData);
  }

  // Closed Decor RFP on a Past Wedding with Awarded Quote
  const decorVendor = createdVendors.find((v: any) => v.category === "Decor & Florals") || createdVendors[8];
  const closedRfpData = [
    {
      wedding_id: createdWeddings[4].id,
      category: "Decor & Florals",
      scope_description: "Palatial lotus floral architecture, imported tuberose mandap, and velvet courtyard draping.",
      guest_count: 550,
      requested_deadline: datePast(250),
      status: "Closed",
      is_demo: true,
    },
  ];
  const [createdClosedRfp] = await batchInsert("quote_requests", closedRfpData);

  if (createdClosedRfp && decorVendor) {
    const closedQuoteData = [
      {
        quote_request_id: createdClosedRfp.id,
        vendor_id: decorVendor.id,
        price_per_plate: 0,
        extra_hour_rate: 50000,
        inclusions: ["Lotus Mandap Structure", "Palace Facade Fairy Lights", "Marigold Gateways", "Bridal Entry Torches"],
        total: 1850000,
        status: "Awarded",
        notes: "Tender won for premier heritage decor and botanical styling.",
        is_demo: true,
      },
    ];
    const [awardedQuote] = await batchInsert("vendor_quotes", closedQuoteData);
    if (awardedQuote) {
      await supabase
        .from("quote_requests")
        .update({ awarded_quote_id: awardedQuote.id })
        .eq("id", createdClosedRfp.id);
    }
  }

  // 13. Demo Share Token
  console.log("• Provisioning Demo Executive Board Share Token...");
  const shareTokensData = [
    {
      token: "demo-executive-board",
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      revoked: false,
      is_demo: true,
    },
  ];
  await batchInsert("share_tokens", shareTokensData);

  // 14. Verification & Table Counts Summary
  console.log("\n=======================================================");
  console.log("📊 THE ROYAL KNOT - SEED VERIFICATION SUMMARY");
  console.log("=======================================================");

  const summaryTables = [
    "packages",
    "team_members",
    "vendors",
    "task_templates",
    "enquiries",
    "weddings",
    "wedding_vendors",
    "vendor_bills",
    "vendor_payments",
    "client_payments",
    "extra_charges",
    "time_logs",
    "wedding_tasks",
    "schedule_items",
    "incidents",
    "quote_requests",
    "vendor_quotes",
    "share_tokens",
  ];

  for (const table of summaryTables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("is_demo", true);

    if (error) {
      console.error(`❌ Verification failed on [${table}]: ${error.message}`);
      process.exit(1);
    }
    console.log(`   • ${table.padEnd(18)} : ${count} demo rows`);
  }

  // 15. Verify wedding_profit view and confirm EXACTLY 4 loss-making weddings
  console.log("\n=======================================================");
  console.log("📈 FOUNDER ANALYTICS P&L VERIFICATION (wedding_profit view)");
  console.log("=======================================================");

  const { data: profitRows, error: profitError } = await supabase
    .from("wedding_profit")
    .select("*")
    .eq("is_demo", true)
    .order("profit", { ascending: true });

  if (profitError) {
    console.error(`❌ Error querying wedding_profit view: ${profitError.message}`);
    process.exit(1);
  }

  console.log("\nProfit-per-wedding Table (sorted lowest to highest):");
  console.log(
    "| Wedding Title                                      | Revenue (₹) | Total Costs (₹) | Profit (₹)   | Margin % | Loss Reason     |"
  );
  console.log(
    "|----------------------------------------------------|-------------|-----------------|--------------|----------|-----------------|"
  );

  let lossCount = 0;
  for (const row of profitRows || []) {
    const isLoss = Number(row.profit) < 0;
    if (isLoss) lossCount++;

    const title = (row.wedding_title || "Untitled").padEnd(50).slice(0, 50);
    const rev = Number(row.revenue_total || 0).toLocaleString("en-IN").padStart(11);
    const totalCosts = (
      Number(row.vendor_cost || 0) +
      Number(row.absorbed_extras || 0) +
      Number(row.team_cost || 0)
    ).toLocaleString("en-IN").padStart(15);
    const profit = Number(row.profit || 0).toLocaleString("en-IN").padStart(12);
    const margin = `${Number(row.margin_pct || 0).toFixed(1)}%`.padStart(8);
    const reason = (row.loss_reason || "Profitable").padEnd(15);

    const flag = isLoss ? "🔻" : "🟢";
    console.log(`| ${flag} ${title.slice(2)} | ${rev} | ${totalCosts} | ${profit} | ${margin} | ${reason} |`);
  }

  console.log("=======================================================");
  console.log(`🔍 Total Weddings Checked: ${(profitRows || []).length}`);
  console.log(`🔍 Loss-making Weddings Count (profit < 0): ${lossCount} (Expected: 4)`);

  if (lossCount !== 4) {
    console.error(`\n❌ ERROR: Expected exactly 4 loss-making weddings, but found ${lossCount}. Exiting.`);
    process.exit(1);
  }

  console.log("✅ Verified: Exactly 4 completed weddings have profit < 0 with realistic business loss drivers!");
  console.log("👑 Royal Knot database seed finished successfully with 0 errors.\n");
}

runSeed().catch((err) => {
  console.error("\n❌ Unhandled error in seed script:", err);
  process.exit(1);
});
