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
  console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in app/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function runSeed() {
  console.log("👑 Seeding THE ROYAL KNOT luxury wedding management platform...");

  // 1. Packages
  console.log("• Seeding Packages...");
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

  const { data: createdPackages, error: pkgErr } = await supabase
    .from("packages")
    .upsert(packagesData, { onConflict: "name" })
    .select();

  if (pkgErr) {
    console.warn("Package insert warning:", pkgErr.message);
  }

  // 2. Team Members
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

  const { data: createdTeam, error: teamErr } = await supabase
    .from("team_members")
    .upsert(teamData, { onConflict: "email" })
    .select();

  if (teamErr) {
    console.warn("Team insert warning:", teamErr.message);
  }

  const leadPlannerId = createdTeam?.[0]?.id || null;

  // 3. 10 Curated Vendors
  console.log("• Seeding 10 Luxury Vendors...");
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

  const { data: createdVendors, error: vendorErr } = await supabase
    .from("vendors")
    .insert(vendorsData)
    .select();

  if (vendorErr) {
    console.warn("Vendors insert error:", vendorErr.message);
  }

  // 4. 7 Enquiries across stages
  console.log("• Seeding 7 Prospective Enquiries across stages...");
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

  const { error: enquiryErr } = await supabase
    .from("enquiries")
    .insert(enquiriesData);

  if (enquiryErr) {
    console.warn("Enquiry insert error:", enquiryErr.message);
  }

  // 5. 8 Palatial Weddings
  console.log("• Seeding 8 Palatial Weddings...");
  const weddingsData = [
    {
      title: "Sharma & Singhania Royal Wedding",
      wedding_date: "2026-11-15",
      wedding_end_date: "2026-11-17",
      city: "Jaipur",
      venue: "Rambagh Palace, Jaipur",
      guest_count: 450,
      total_budget: 7500000,
      status: "Confirmed",
      theme: "Palace Romance & Royal Florals",
      notes: "3-day high society celebration with royal high tea and fireworks display.",
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
      status: "In Progress",
      theme: "Imperial Mewar Durbar",
      notes: "Historical crescent courtyard setup with vintage Rolls Royce bridal entrance.",
      is_demo: true,
    },
  ];

  const { data: createdWeddings, error: weddingErr } = await supabase
    .from("weddings")
    .insert(weddingsData)
    .select();

  if (weddingErr) {
    console.warn("Weddings insert error:", weddingErr.message);
  }

  // 6. Client Payments (Booking, Advance, Final)
  console.log("• Seeding 3-Stage Client Payments...");
  if (createdWeddings && createdWeddings.length > 0) {
    const paymentsToInsert: any[] = [];
    const expensesToInsert: any[] = [];

    createdWeddings.forEach((w, idx) => {
      const budget = Number(w.total_budget);
      const bookingAmount = Math.round(budget * 0.25); // 25% on booking
      const advanceAmount = Math.round(budget * 0.50); // 50% advance (~1 month prior)
      const finalAmount = budget - (bookingAmount + advanceAmount); // 25% final

      // Wedding 0 (Sharma & Singhania): Booking and Advance Paid
      if (idx === 0) {
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
      } else if (idx === 1) {
        // Mewar Lakeside: Booking Paid, Advance Pending
        paymentsToInsert.push(
          {
            wedding_id: w.id,
            milestone: "Booking",
            amount: bookingAmount,
            due_date: "2026-09-01",
            paid_at: "2026-09-02T10:00:00Z",
            payment_method: "NEFT / RTGS",
            transaction_reference: "RTGS-ICIC81920391",
            status: "Paid",
            is_demo: true,
          },
          {
            wedding_id: w.id,
            milestone: "Advance",
            amount: advanceAmount,
            due_date: "2026-10-28",
            status: "Pending",
            is_demo: true,
          },
          {
            wedding_id: w.id,
            milestone: "Final",
            amount: finalAmount,
            due_date: "2026-12-05",
            status: "Pending",
            is_demo: true,
          }
        );
      } else if (idx === 2) {
        // Alsisar Sufi: Booking Paid in October
        paymentsToInsert.push(
          {
            wedding_id: w.id,
            milestone: "Booking",
            amount: bookingAmount,
            due_date: "2026-10-01",
            paid_at: "2026-10-02T16:45:00Z",
            payment_method: "Cheque",
            transaction_reference: "CHQ-0029104",
            status: "Paid",
            is_demo: true,
          },
          {
            wedding_id: w.id,
            milestone: "Advance",
            amount: advanceAmount,
            due_date: "2026-11-05",
            status: "Pending",
            is_demo: true,
          },
          {
            wedding_id: w.id,
            milestone: "Final",
            amount: finalAmount,
            due_date: "2026-12-10",
            status: "Pending",
            is_demo: true,
          }
        );
      } else if (idx === 3) {
        // Jagmandir Island: Booking Paid in September
        paymentsToInsert.push(
          {
            wedding_id: w.id,
            milestone: "Booking",
            amount: bookingAmount,
            due_date: "2026-09-15",
            paid_at: "2026-09-15T09:20:00Z",
            payment_method: "NEFT / RTGS",
            transaction_reference: "RTGS-KOTK77291023",
            status: "Paid",
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
      } else {
        // Others: Booking Paid or Pending
        paymentsToInsert.push(
          {
            wedding_id: w.id,
            milestone: "Booking",
            amount: bookingAmount,
            due_date: "2026-10-20",
            paid_at: idx % 2 === 0 ? "2026-10-21T12:00:00Z" : null,
            status: idx % 2 === 0 ? "Paid" : "Pending",
            is_demo: true,
          },
          {
            wedding_id: w.id,
            milestone: "Advance",
            amount: advanceAmount,
            due_date: "2026-12-15",
            status: "Pending",
            is_demo: true,
          },
          {
            wedding_id: w.id,
            milestone: "Final",
            amount: finalAmount,
            due_date: "2027-01-20",
            status: "Pending",
            is_demo: true,
          }
        );
      }

      // Expenses
      expensesToInsert.push({
        wedding_id: w.id,
        category: "Palace Permits & Heritage Royalties",
        description: "Archeological department sound & light clearance permit fee",
        amount: 85000,
        incurred_date: "2026-10-10",
        is_demo: true,
      });
    });

    const { error: payErr } = await supabase
      .from("client_payments")
      .insert(paymentsToInsert);

    if (payErr) console.warn("Payments insert error:", payErr.message);

    const { error: expErr } = await supabase
      .from("expenses")
      .insert(expensesToInsert);

    if (expErr) console.warn("Expenses insert error:", expErr.message);
  }

  console.log("✅ THE ROYAL KNOT seed complete!");
  console.log("   • 8 Palatial Weddings");
  console.log("   • 10 Luxury Artisan Vendors");
  console.log("   • 7 Prospective Enquiries across stages");
  console.log("   • Multi-stage client payments with demo flags");
}

runSeed().catch((err) => {
  console.error("❌ Seed script failed:", err);
  process.exit(1);
});
