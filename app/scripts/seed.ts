import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Bulletproof environment loader for .env.local
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

// Helper that executes an operation and immediately terminates with non-zero exit on error
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

async function runSeed() {
  console.log("👑 Initializing idempotent seed for THE ROYAL KNOT...");

  // 1. Idempotency: Clean up demo rows in reverse foreign-key order
  console.log("\n🧹 Cleaning up existing demo data (is_demo = true)...");
  const cleanOrder = [
    "incidents",
    "schedule_items",
    "expenses",
    "vendor_payments",
    "vendor_bills",
    "client_payments",
    "contracts",
    "guests",
    "wedding_tasks",
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
    await execOrDie(
      table,
      "delete demo rows",
      supabase.from(table).delete().eq("is_demo", true)
    );
  }
  console.log("   ✓ Cleaned existing demo rows safely.");

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
  const createdPackages = await execOrDie("packages", "insert packages", supabase.from("packages").insert(packagesData).select());

  // 3. Team Members
  console.log("• Seeding Team Members...");
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
  const createdTeam = await execOrDie("team_members", "insert team_members", supabase.from("team_members").insert(teamData).select());

  // 4. Vendors (10 luxury partners)
  console.log("• Seeding 10 Curated Artisan Vendors...");
  const vendorsData = [
    {
      name: "Rajputana Decor & Floral Crafts",
      category: "Decor & Florals",
      city: "Jaipur",
      rating: 4.9,
      contact_person: "Bhairon Singh",
      phone: "+91 98291 22001",
      email: "info@rajputanadecor.com",
      notes: "Masters of marigold gates, velvet shamianas, and hand-strung lotus garlands.",
      is_demo: true,
    },
    {
      name: "Mewar Shahi Bawarchi & Feasts",
      category: "Catering & Royal Feasts",
      city: "Udaipur",
      rating: 5.0,
      contact_person: "Chef Ranveer Sisodia",
      phone: "+91 98291 22002",
      email: "feasts@mewarbawarchi.in",
      notes: "Authentic Dal Baati Churma, Laal Maas, and multi-course silver thali silver service.",
      is_demo: true,
    },
    {
      name: "Royal Lens Fine Art Cinema",
      category: "Photography & Cinematography",
      city: "Jaipur",
      rating: 4.9,
      contact_person: "Devendra Verma",
      phone: "+91 98291 22003",
      email: "devendra@royallens.com",
      notes: "Drone aerials, Leica portraiture, and cinematic same-day trailers.",
      is_demo: true,
    },
    {
      name: "Desert Symphony Manganiyar Ensemble",
      category: "Entertainment & Folk Artists",
      city: "Udaipur",
      rating: 4.8,
      contact_person: "Ustad Gazi Khan",
      phone: "+91 98291 22004",
      email: "ensemble@desertsymphony.in",
      notes: "World-renowned Khartal players, Sufi qawwali singers, and fire dancers.",
      is_demo: true,
    },
    {
      name: "Vintage Wheels Royal Chariots & Fleet",
      category: "Hospitality & Royal Fleet",
      city: "Jaipur",
      rating: 4.9,
      contact_person: "Vikram Rathore",
      phone: "+91 98291 22005",
      email: "fleet@vintagewheels.com",
      notes: "1938 Rolls Royce Phantoms, golden baggis, and Mercedes Maybach guest convoys.",
      is_demo: true,
    },
    {
      name: "Shringar Bridal Couture & Henna Arts",
      category: "Decor & Florals",
      city: "Jaipur",
      rating: 4.8,
      contact_person: "Suman Joshi",
      phone: "+91 98291 22006",
      email: "suman@shringarbridal.in",
      notes: "Organic Sojat henna artists and royal bridal drape stylists.",
      is_demo: true,
    },
    {
      name: "Jagmandir Sound & Architectural Illumination",
      category: "Entertainment & Folk Artists",
      city: "Udaipur",
      rating: 4.9,
      contact_person: "Kabir Malhotra",
      phone: "+91 98291 22007",
      email: "illumination@jagmandirsound.com",
      notes: "Palace facade mapping, acoustic warm arrays, and floating lake lasers.",
      is_demo: true,
    },
    {
      name: "Amber Royal Baggis & Vintage Coaches",
      category: "Hospitality & Royal Fleet",
      city: "Udaipur",
      rating: 4.7,
      contact_person: "Mahendra Tanwar",
      phone: "+91 98291 22008",
      email: "ambercoaches@luxury.in",
      notes: "Decorated tuskers, vintage open barouche carriages, and luxury coach buses.",
      is_demo: true,
    },
    {
      name: "Maharani Gourmet Mithai & Sweets",
      category: "Catering & Royal Feasts",
      city: "Jaipur",
      rating: 4.8,
      contact_person: "Kailash Halwai",
      phone: "+91 98291 22009",
      email: "orders@maharanimithai.com",
      notes: "Ghewar dipped in 24k edible gold foil, pistachio rasmalai, and mawa kachoris.",
      is_demo: true,
    },
    {
      name: "Palace Memories Film Works",
      category: "Photography & Cinematography",
      city: "Udaipur",
      rating: 4.9,
      contact_person: "Aditi Mathur",
      phone: "+91 98291 22010",
      email: "aditi@palacememories.in",
      notes: "Exclusive documentary coverage of pre-wedding rituals and heritage venue decor.",
      is_demo: true,
    },
  ];
  const createdVendors = await execOrDie("vendors", "insert vendors", supabase.from("vendors").insert(vendorsData).select());

  // 5. 30 Task Templates across 7 phases
  console.log("• Seeding 30 Palatial Task Templates...");
  const templatesData = [
    { title: "Palace Venue Contract & Booking Deposit Confirmation", phase: "Venue", offset_days_from_wedding: -120, default_role: "Lead Planner", package: "All", is_demo: true },
    { title: "Heritage Department Permits & Firecracker Clearances", phase: "Venue", offset_days_from_wedding: -90, default_role: "Head of Logistics", package: "All", is_demo: true },
    { title: "On-site Technical Recce (Generators, Power & Lake Access)", phase: "Venue", offset_days_from_wedding: -60, default_role: "Head of Logistics", package: "All", is_demo: true },

    { title: "Mood Board & Imperial Rajputana Color Palette Finalization", phase: "Design", offset_days_from_wedding: -100, default_role: "Artisan Vendor Director", package: "All", is_demo: true },
    { title: "3D Floral Mandap & Architectural Stage Blueprint Signoff", phase: "Design", offset_days_from_wedding: -75, default_role: "Artisan Vendor Director", package: "All", is_demo: true },
    { title: "Royal Stationery, Gold Leaf Itineraries & Wax Seals Approval", phase: "Design", offset_days_from_wedding: -60, default_role: "Lead Planner", package: "All", is_demo: true },
    { title: "Ambient Illumination & Palace Facade Mapping Layout", phase: "Design", offset_days_from_wedding: -45, default_role: "Head of Logistics", package: "All", is_demo: true },

    { title: "Master Royal Feast Tasting & Silver Thali Menu Signoff", phase: "Vendors", offset_days_from_wedding: -80, default_role: "Lead Planner", package: "All", is_demo: true },
    { title: "Floral Artisan & Velvet Shamiana Vendor Contract Execution", phase: "Vendors", offset_days_from_wedding: -70, default_role: "Artisan Vendor Director", package: "All", is_demo: true },
    { title: "Leica Portraiture & Drone Aerial Cinematography Briefing", phase: "Vendors", offset_days_from_wedding: -60, default_role: "Lead Planner", package: "All", is_demo: true },
    { title: "Bridal Sojat Henna Artists & Poshak Draping Team Lock-in", phase: "Vendors", offset_days_from_wedding: -50, default_role: "Artisan Vendor Director", package: "All", is_demo: true },
    { title: "Manganiyar Folk Ensemble & Sufi Qawwali Stage Technical Rider", phase: "Vendors", offset_days_from_wedding: -40, default_role: "Head of Logistics", package: "All", is_demo: true },
    { title: "Vintage Rolls Royce & Decorated Royal Baggi Reservation", phase: "Vendors", offset_days_from_wedding: -35, default_role: "Head of Logistics", package: "All", is_demo: true },
    { title: "24k Gold Foil Mithai Hampers & Welcome Favors Dispatch Order", phase: "Vendors", offset_days_from_wedding: -30, default_role: "Lead Planner", package: "All", is_demo: true },

    { title: "VVIP Royal Guest List & Protocol Hierarchy Finalization", phase: "Guests", offset_days_from_wedding: -90, default_role: "Lead Planner", package: "All", is_demo: true },
    { title: "Digital Save-The-Dates & Palace Travel Concierge Portal Launch", phase: "Guests", offset_days_from_wedding: -75, default_role: "Lead Planner", package: "All", is_demo: true },
    { title: "Formal Wedding Invocations & Palace Suite Allocations", phase: "Guests", offset_days_from_wedding: -45, default_role: "Lead Planner", package: "All", is_demo: true },
    { title: "Airport Chauffeur Conveyance & Private Jet Manifest Sync", phase: "Guests", offset_days_from_wedding: -20, default_role: "Head of Logistics", package: "All", is_demo: true },
    { title: "Final Dietary Protocols, Jain Catering & RSVP Tally Lock", phase: "Guests", offset_days_from_wedding: -14, default_role: "Lead Planner", package: "All", is_demo: true },

    { title: "Royal High Tea & Mehendi Sundowner Run-Sheet Rehearsal", phase: "Events", offset_days_from_wedding: -10, default_role: "Lead Planner", package: "All", is_demo: true },
    { title: "Sangeet Stage Choreography & Sufi Mehfil Lighting Soundcheck", phase: "Events", offset_days_from_wedding: -7, default_role: "Head of Logistics", package: "All", is_demo: true },
    { title: "Haldi Yellow Blossom Floral Shower Logistics Alignment", phase: "Events", offset_days_from_wedding: -3, default_role: "Artisan Vendor Director", package: "All", is_demo: true },
    { title: "Barat Grand Procession Route, Tuskers & Brass Band Alignment", phase: "Events", offset_days_from_wedding: -2, default_role: "Head of Logistics", package: "All", is_demo: true },
    { title: "Sunset Pheras Sacred Ritual Timing & Pandit Alignment", phase: "Events", offset_days_from_wedding: -1, default_role: "Lead Planner", package: "All", is_demo: true },
    { title: "Grand Reception Royal Durbar Seating & Toast Timetable", phase: "Events", offset_days_from_wedding: 0, default_role: "Lead Planner", package: "All", is_demo: true },

    { title: "Dawn Team Operational Briefing & Radiocomms Check", phase: "Day-of", offset_days_from_wedding: 0, default_role: "Lead Planner", package: "All", is_demo: true },
    { title: "Vendor Influx Check-in & Fire Marshal Compliance Audit", phase: "Day-of", offset_days_from_wedding: 0, default_role: "Head of Logistics", package: "All", is_demo: true },
    { title: "Barat to Mandap Live Queueing & Bride Entry Fire-Torches", phase: "Day-of", offset_days_from_wedding: 0, default_role: "Head of Logistics", package: "All", is_demo: true },

    { title: "Palace Suite Inventory Handover & Chauffeur Luggage Sweep", phase: "Post-event", offset_days_from_wedding: 1, default_role: "Head of Logistics", package: "All", is_demo: true },
    { title: "Artisan Vendor Invoice Reconciliation & Final Settlements", phase: "Post-event", offset_days_from_wedding: 3, default_role: "Lead Planner", package: "All", is_demo: true },
  ];
  await execOrDie("task_templates", "insert task_templates", supabase.from("task_templates").insert(templatesData));

  // 6. 7 Enquiries across stages
  console.log("• Seeding 7 Prospective Enquiries...");
  const enquiriesData = [
    {
      couple_name: "Ranveer Rathore & Deepika Sen",
      phone: "+91 98765 01001",
      email: "ranveer.deepika@luxury.in",
      stage: "New",
      guests: 450,
      budget: 6500000,
      theme: "Palace Romance",
      source: "Instagram",
      package: "Full-Service",
      city: "Jaipur",
      wedding_date: "2026-12-15",
      notes: "Looking for an exclusive booking at Rambagh Palace or Jai Mahal.",
      is_demo: true,
    },
    {
      couple_name: "Siddharth Mehta & Kiara Kapoor",
      phone: "+91 98765 01002",
      email: "siddharth.kiara@mumbai.com",
      stage: "Contacted",
      guests: 550,
      budget: 8500000,
      theme: "Heritage Rajputana",
      source: "Referral",
      package: "Full-Service",
      city: "Udaipur",
      wedding_date: "2027-01-20",
      notes: "Lakefront palace with boat arrival for the groom.",
      is_demo: true,
    },
    {
      couple_name: "Vikramaditya Birla & Sanjana Ruia",
      phone: "+91 98765 01003",
      email: "vikram.sanjana@birla.org",
      stage: "Meeting",
      guests: 380,
      budget: 12000000,
      theme: "Lakeside Sufi",
      source: "Luxury Fair",
      package: "Full-Service",
      city: "Udaipur",
      wedding_date: "2027-02-14",
      notes: "Desire private island banquet at Jagmandir with international jazz/sufi fusion.",
      is_demo: true,
    },
    {
      couple_name: "Aditya Vardhan & Rhea Singhania",
      phone: "+91 98765 01004",
      email: "aditya.rhea@singhania.com",
      stage: "Proposal",
      guests: 420,
      budget: 5000000,
      theme: "Contemporary Royal",
      source: "Website",
      package: "Partial / Day-of",
      city: "Jaipur",
      wedding_date: "2027-03-08",
      notes: "Proposal submitted; awaiting approval from bride's family council.",
      is_demo: true,
    },
    {
      couple_name: "Devendra Chauhan & Avantika Solanki",
      phone: "+91 98765 01005",
      email: "devendra.avantika@heritage.in",
      stage: "Won",
      guests: 600,
      budget: 9500000,
      theme: "Heritage Rajputana",
      source: "Direct",
      package: "Full-Service",
      city: "Jaipur",
      wedding_date: "2026-11-20",
      notes: "Contract signed, booking deposit verified.",
      is_demo: true,
    },
    {
      couple_name: "Raghav Singhal & Tanya Mittal",
      phone: "+91 98765 01006",
      email: "raghav.tanya@mittalgroup.com",
      stage: "Won",
      guests: 350,
      budget: 4500000,
      theme: "Palace Romance",
      source: "Instagram",
      package: "Partial / Day-of",
      city: "Udaipur",
      wedding_date: "2026-12-28",
      notes: "Contract executed for day-of coordination at Fateh Garh.",
      is_demo: true,
    },
    {
      couple_name: "Kabir Oberoi & Natasha Thapar",
      phone: "+91 98765 01007",
      email: "kabir.thapar@delhiclub.com",
      stage: "Lost",
      guests: 300,
      budget: 3500000,
      theme: "Contemporary Royal",
      source: "Website",
      package: "Partial / Day-of",
      city: "Jaipur",
      wedding_date: "2027-04-12",
      notes: "Decided to host in Goa instead of Rajasthan.",
      is_demo: true,
    },
  ];
  await execOrDie("enquiries", "insert enquiries", supabase.from("enquiries").insert(enquiriesData));

  // 7. 8 Palatial Weddings
  console.log("• Seeding 8 Palatial Weddings...");
  const todayDateStr = new Date().toISOString().split("T")[0];
  const weddingsData = [
    {
      title: "Sharma & Singhania Royal Vivah (Today's Live Run-sheet)",
      wedding_date: todayDateStr,
      wedding_end_date: todayDateStr,
      city: "Jaipur",
      venue: "Rambagh Palace, Jaipur",
      guest_count: 450,
      total_budget: 7500000,
      contract_value: 7500000,
      status: "Confirmed",
      theme: "Palace Romance & Royal Florals",
      notes: "3-day high society celebration with royal high tea and fireworks display. Active celebration today!",
      is_demo: true,
    },
    {
      title: "Mewar Lakeside Regal Nuptials",
      wedding_date: "2026-11-28",
      wedding_end_date: "2026-11-30",
      city: "Udaipur",
      venue: "The Oberoi Udaivilas, Udaipur",
      guest_count: 500,
      total_budget: 11000000,
      contract_value: 11000000,
      status: "Planning",
      theme: "Lakeside Sufi & Heritage Rajputana",
      notes: "Overwater pheras structure and private chartered boat transfers across Lake Pichola.",
      is_demo: true,
    },
    {
      title: "Alsisar Courtyard Sufi Wedding",
      wedding_date: "2026-12-05",
      wedding_end_date: "2026-12-07",
      city: "Jaipur",
      venue: "Alsisar Mahal Heritage Haveli",
      guest_count: 380,
      total_budget: 4500000,
      contract_value: 4500000,
      status: "Confirmed",
      theme: "Torchlit Mughal Courtyards",
      notes: "Authentic shekhawati fresco backdrops with candlelit evening mehfils.",
      is_demo: true,
    },
    {
      title: "Jagmandir Island Grand Celebration",
      wedding_date: "2026-12-18",
      wedding_end_date: "2026-12-20",
      city: "Udaipur",
      venue: "Jagmandir Island Palace, Udaipur",
      guest_count: 520,
      total_budget: 14000000,
      contract_value: 14000000,
      status: "Confirmed",
      theme: "Golden Mughal Romance",
      notes: "Full island buyout with grand elephant welcome and floating fireworks show.",
      is_demo: true,
    },
    {
      title: "Amer Heritage Fortress Nuptials",
      wedding_date: "2027-01-10",
      wedding_end_date: "2027-01-12",
      city: "Jaipur",
      venue: "Fairmont Jaipur Palace",
      guest_count: 600,
      total_budget: 8500000,
      contract_value: 8500000,
      status: "Planning",
      theme: "Royal Rajputana Grandeur",
      notes: "Aravalli mountain views, traditional nagada drummers, and 100-dish feast.",
      is_demo: true,
    },
    {
      title: "Lake Pichola Sunset Vows",
      wedding_date: "2027-01-24",
      wedding_end_date: "2027-01-26",
      city: "Udaipur",
      venue: "The Leela Palace, Udaipur",
      guest_count: 400,
      total_budget: 9500000,
      contract_value: 9500000,
      status: "Confirmed",
      theme: "Ivory Lotus & Candlelit Domes",
      notes: "Sunset pheras overlooking the historic City Palace.",
      is_demo: true,
    },
    {
      title: "Samode Haveli Royal Romance",
      wedding_date: "2027-02-12",
      wedding_end_date: "2027-02-14",
      city: "Jaipur",
      venue: "Samode Palace, Jaipur",
      guest_count: 350,
      total_budget: 6000000,
      contract_value: 6000000,
      status: "Planning",
      theme: "Sheesh Mahal Mirror Magic",
      notes: "Intimate heritage gathering in the 475-year-old hall of mirrors.",
      is_demo: true,
    },
    {
      title: "City Palace Royal Durbar Wedding",
      wedding_date: "2027-02-26",
      wedding_end_date: "2027-02-28",
      city: "Udaipur",
      venue: "Shiv Niwas Palace, Udaipur",
      guest_count: 480,
      total_budget: 12500000,
      contract_value: 12500000,
      status: "In Progress",
      theme: "Imperial Mewar Durbar",
      notes: "Historical crescent courtyard setup with vintage Rolls Royce bridal entrance.",
      is_demo: true,
    },
  ];
  const createdWeddings = await execOrDie("weddings", "insert weddings", supabase.from("weddings").insert(weddingsData).select());

  // 8. Client Payments & Expenses
  console.log("• Seeding 3-Stage Client Payments & Wedding Tasks...");
  const paymentsToInsert: any[] = [];
  const expensesToInsert: any[] = [];
  const tasksToInsert: any[] = [];

  const defaultOwnerId = createdTeam[0]?.id;

  createdWeddings.forEach((w: any, idx: number) => {
    const budget = Number(w.total_budget);
    const bookingAmount = Math.round(budget * 0.25);
    const advanceAmount = Math.round(budget * 0.50);
    const finalAmount = budget - (bookingAmount + advanceAmount);

    if (idx === 0) {
      // Sharma & Singhania: Booking + Advance Paid
      paymentsToInsert.push(
        {
          wedding_id: w.id,
          milestone: "Booking",
          amount: bookingAmount,
          due_date: "2026-08-10",
          paid_at: "2026-08-09T14:30:00Z",
          payment_method: "NEFT / RTGS",
          transaction_reference: "RTGS-RBIP90214801",
          status: "Paid",
          is_demo: true,
        },
        {
          wedding_id: w.id,
          milestone: "Advance",
          amount: advanceAmount,
          due_date: "2026-10-15",
          paid_at: "2026-10-14T11:15:00Z",
          payment_method: "NEFT / RTGS",
          transaction_reference: "RTGS-HDFC19481023",
          status: "Paid",
          is_demo: true,
        },
        {
          wedding_id: w.id,
          milestone: "Final",
          amount: finalAmount,
          due_date: "2026-11-20",
          status: "Pending",
          is_demo: true,
        }
      );
    } else {
      paymentsToInsert.push(
        {
          wedding_id: w.id,
          milestone: "Booking",
          amount: bookingAmount,
          due_date: "2026-09-15",
          paid_at: idx % 2 === 0 ? "2026-09-15T09:20:00Z" : null,
          status: idx % 2 === 0 ? "Paid" : "Pending",
          is_demo: true,
        },
        {
          wedding_id: w.id,
          milestone: "Advance",
          amount: advanceAmount,
          due_date: "2026-11-18",
          status: "Pending",
          is_demo: true,
        },
        {
          wedding_id: w.id,
          milestone: "Final",
          amount: finalAmount,
          due_date: "2026-12-25",
          status: "Pending",
          is_demo: true,
        }
      );
    }

    expensesToInsert.push({
      wedding_id: w.id,
      category: "Palace Permits & Heritage Royalties",
      description: "Archeological department sound & light clearance permit fee",
      amount: 85000,
      incurred_date: "2026-10-10",
      is_demo: true,
    });

    // Seed realistic tasks for each wedding across all 4 stages
    tasksToInsert.push(
      {
        wedding_id: w.id,
        title: "Confirm Palace Grand Ballroom Floral Setup",
        phase: "Design",
        stage: "Done",
        due_date: "2026-10-25",
        owner: defaultOwnerId,
        is_demo: true,
      },
      {
        wedding_id: w.id,
        title: "Finalize Royal Vintage Chariot Barat Route",
        phase: "Vendors",
        stage: "In Progress",
        due_date: "2026-11-05",
        owner: defaultOwnerId,
        is_demo: true,
      },
      {
        wedding_id: w.id,
        title: "Heritage Sound & Firecracker Municipal Permit",
        phase: "Venue",
        stage: "Blocked",
        due_date: "2026-10-20", // Overdue demonstration
        owner: defaultOwnerId,
        is_demo: true,
      },
      {
        wedding_id: w.id,
        title: "Dispatch Gold Foil Welcome Itineraries to Palace Suites",
        phase: "Guests",
        stage: "To Plan",
        due_date: "2026-11-12",
        owner: defaultOwnerId,
        is_demo: true,
      }
    );
  });

  await execOrDie("client_payments", "insert client_payments", supabase.from("client_payments").insert(paymentsToInsert));
  await execOrDie("expenses", "insert expenses", supabase.from("expenses").insert(expensesToInsert));
  await execOrDie("wedding_tasks", "insert wedding_tasks", supabase.from("wedding_tasks").insert(tasksToInsert));

  // 9. Day-of Command Center: Schedule Items & Incident for Today's Wedding
  console.log("• Seeding Day-of Command Center (14 Schedule Items & Live Incident)...");
  const todayWedding = createdWeddings[0];

  const vendorDJ = createdVendors.find((v: any) => v.name.includes("Jagmandir Sound")) || createdVendors[6];
  const vendorFlorist = createdVendors.find((v: any) => v.name.includes("Rajputana Decor")) || createdVendors[0];
  const vendorCatering = createdVendors.find((v: any) => v.name.includes("Mewar Shahi Bawarchi")) || createdVendors[1];
  const vendorVintageWheels = createdVendors.find((v: any) => v.name.includes("Vintage Wheels")) || createdVendors[4];
  const vendorDesertSymphony = createdVendors.find((v: any) => v.name.includes("Desert Symphony")) || createdVendors[3];
  const vendorPhotography = createdVendors.find((v: any) => v.name.includes("Royal Lens")) || createdVendors[2];

  const teamGayatri = createdTeam.find((t: any) => t.name.includes("Gayatri")) || createdTeam[0];
  const teamRaghavendra = createdTeam.find((t: any) => t.name.includes("Raghavendra")) || createdTeam[1];
  const teamAnanya = createdTeam.find((t: any) => t.name.includes("Ananya")) || createdTeam[2];

  const nowMs = Date.now();
  const scheduleItemsData = [
    {
      wedding_id: todayWedding.id,
      title: "Royal Vintage Chariot Barat Delivery",
      event_name: "Royal Vintage Chariot Barat Delivery",
      venue_sublocation: "Palace Outer Gate",
      scheduled_time: new Date(nowMs - 50 * 60 * 1000).toISOString(),
      start_time: new Date(nowMs - 50 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorVintageWheels?.id || null,
      responsible_member_id: teamRaghavendra?.id || null,
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
      responsible_member_id: teamAnanya?.id || null,
      status: "Done",
      arrived_at: new Date(nowMs - 40 * 60 * 1000).toISOString(), // Arrived
      is_demo: true,
    },
    {
      wedding_id: todayWedding.id,
      title: "Royal DJ & Sound Array Check-in",
      event_name: "Royal DJ & Sound Array Check-in",
      venue_sublocation: "Grand Courtyard Stage",
      scheduled_time: new Date(nowMs - 20 * 60 * 1000).toISOString(), // 20m in past
      start_time: new Date(nowMs - 20 * 60 * 1000).toISOString(),
      responsible_vendor_id: vendorDJ?.id || null,
      responsible_member_id: teamRaghavendra?.id || null,
      status: "Pending",
      arrived_at: null, // NULL: LATE! 20 mins late
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
      responsible_member_id: teamRaghavendra?.id || null,
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
      responsible_member_id: teamGayatri?.id || null,
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
      responsible_member_id: teamAnanya?.id || null,
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
      responsible_member_id: teamGayatri?.id || null,
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
      responsible_member_id: teamAnanya?.id || null,
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
      responsible_member_id: teamGayatri?.id || null,
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
      responsible_member_id: teamGayatri?.id || null,
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
      responsible_member_id: teamAnanya?.id || null,
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
      responsible_member_id: teamRaghavendra?.id || null,
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
      responsible_member_id: teamRaghavendra?.id || null,
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
      responsible_member_id: teamGayatri?.id || null,
      status: "Pending",
      arrived_at: null,
      is_demo: true,
    },
  ];

  await execOrDie("schedule_items", "insert schedule_items", supabase.from("schedule_items").insert(scheduleItemsData));

  // Incident: Florist needs a generator, severity High
  const incidentData = [
    {
      wedding_id: todayWedding.id,
      title: "Florist needs a generator for mandap lighting",
      severity: "High",
      status: "Open",
      owner_id: teamRaghavendra?.id || createdTeam[0].id,
      reported_by: teamRaghavendra?.id || createdTeam[0].id,
      is_demo: true,
    },
  ];

  await execOrDie("incidents", "insert incidents", supabase.from("incidents").insert(incidentData));

  // 10. Verification & Row Counts Summary
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
    "wedding_tasks",
    "schedule_items",
    "incidents",
    "client_payments",
    "expenses",
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
    console.log(`   • ${table.padEnd(16)} : ${count} demo rows`);
  }

  console.log("=======================================================");
  console.log("✅ Seed completed successfully with 0 errors.\n");
}

runSeed().catch((err) => {
  console.error("\n❌ Unhandled error in seed script:", err);
  process.exit(1);
});
