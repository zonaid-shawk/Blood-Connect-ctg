require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seed() {
  const donorRows = [
    {
      id: 1,
      donor_id: "DON-1",
      full_name: "Rahul Ahmed",
      email: "rahul@example.com",
      phone: "01711111111",
      blood_group: "A+",
      age: 25,
      gender: "Male",
      city: "Dhaka",
      address: "Mirpur, Dhaka",
      last_donation: "2026-01-15",
      is_available: true,
      status: "approved",
      registered_at: "2026-01-01T10:00:00.000Z",
      total_donations: 3,
    },
    {
      id: 2,
      donor_id: "DON-2",
      full_name: "Sumi Akter",
      email: "sumi@example.com",
      phone: "01722222222",
      blood_group: "O+",
      age: 22,
      gender: "Female",
      city: "Chittagong",
      address: "Agrabad, Chittagong",
      last_donation: "2026-02-01",
      is_available: true,
      status: "approved",
      registered_at: "2026-01-15T14:30:00.000Z",
      total_donations: 2,
    },
    {
      id: 3,
      donor_id: "DON-3",
      full_name: "Kamal Hasan",
      email: "kamal@example.com",
      phone: "01733333333",
      blood_group: "B+",
      age: 30,
      gender: "Male",
      city: "Dhaka",
      address: "Gulshan, Dhaka",
      last_donation: "2025-12-10",
      is_available: true,
      status: "pending",
      registered_at: "2025-12-01T09:00:00.000Z",
      total_donations: 5,
    },
  ];

  const requestRows = [
    {
      id: 101,
      request_id: "REQ-001",
      patient_name: "Fatima Begum",
      email: "fatima@example.com",
      blood_group: "A+",
      hospital: "Dhaka Medical College",
      city: "Dhaka",
      contact: "01755555555",
      urgency: "Critical",
      units: 2,
      notes: "Emergency surgery needed",
      status: "Pending",
      date: "2026-02-10T08:00:00.000Z",
    },
    {
      id: 102,
      request_id: "REQ-002",
      patient_name: "Md. Karim",
      email: "karim@example.com",
      blood_group: "O-",
      hospital: "Chittagong Medical",
      city: "Chittagong",
      contact: "01766666666",
      urgency: "Urgent",
      units: 1,
      notes: "",
      status: "Pending",
      date: "2026-02-12T10:30:00.000Z",
    },
  ];

  const stockRows = [
    { id: "A+", blood_group: "A+", units: 10 },
    { id: "A-", blood_group: "A-", units: 5 },
    { id: "B+", blood_group: "B+", units: 8 },
    { id: "B-", blood_group: "B-", units: 3 },
    { id: "AB+", blood_group: "AB+", units: 4 },
    { id: "AB-", blood_group: "AB-", units: 2 },
    { id: "O+", blood_group: "O+", units: 15 },
    { id: "O-", blood_group: "O-", units: 7 },
  ];

  for (const tableName of ["blood_donors", "blood_requests", "blood_stock"]) {
    console.log(`Ensuring ${tableName} exists...`);
  }

  const { error: donorError } = await supabase
    .from("blood_donors")
    .upsert(donorRows, { onConflict: "id" });

  if (donorError) throw donorError;

  const { error: requestError } = await supabase
    .from("blood_requests")
    .upsert(requestRows, { onConflict: "id" });

  if (requestError) throw requestError;

  const { error: stockError } = await supabase
    .from("blood_stock")
    .upsert(stockRows, { onConflict: "id" });

  if (stockError) throw stockError;

  console.log(
    "Supabase seed complete: donors, requests, and stock inserted successfully.",
  );
}

seed().catch((err) => {
  console.error("Supabase seed failed:", err.message || err);
  process.exit(1);
});
