/**
 * Seeds three demo accounts (one per role) plus sample tickets, including
 * one with a staff-only internal note -- so the customer/staff visibility
 * boundary is demonstrable on first login without creating anything by
 * hand. Uses the service-role key, so this must only ever run against
 * local/dev Supabase instances.
 *
 * Usage: pnpm seed
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "demo-password-123";

const USERS = [
  { email: "admin@demo.test", fullName: "Ada Admin", role: "admin" as const },
  { email: "agent@demo.test", fullName: "Gabe Agent", role: "agent" as const },
  {
    email: "customer@demo.test",
    fullName: "Cara Customer",
    role: "customer" as const,
  },
  {
    email: "customer2@demo.test",
    fullName: "Owen Other",
    role: "customer" as const,
  },
];

async function upsertUser(u: (typeof USERS)[number]) {
  const { data: created, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.fullName },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already been registered")) {
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((x) => x.email === u.email);
      if (!existing) throw error;
      console.log(`  exists: ${u.email}`);
      return existing.id;
    }
    throw error;
  }

  console.log(`  created: ${u.email}`);
  return created.user.id;
}

async function main() {
  console.log("Seeding demo users...");
  const ids: Record<string, string> = {};
  for (const u of USERS) {
    ids[u.email] = await upsertUser(u);

    // The signup trigger (handle_new_user) always assigns 'customer'.
    // Promote admin/agent explicitly, replacing the default row so each
    // seeded account holds exactly one role.
    if (u.role !== "customer") {
      const { error: delErr } = await admin
        .from("user_roles")
        .delete()
        .eq("user_id", ids[u.email]);
      if (delErr) throw new Error(`role delete (${u.email}): ${delErr.message}`);

      const { error: insErr } = await admin
        .from("user_roles")
        .insert({ user_id: ids[u.email], role: u.role });
      if (insErr) throw new Error(`role insert (${u.email}): ${insErr.message}`);

      console.log(`  role -> ${u.role}: ${u.email}`);
    }
  }

  console.log("Seeding sample tickets...");
  const customerId = ids["customer@demo.test"];
  const agentId = ids["agent@demo.test"];
  const customer2Id = ids["customer2@demo.test"];

  // Idempotent: wipe previously seeded tickets for these demo users before
  // re-inserting, so re-running `pnpm seed` doesn't pile up duplicates.
  const { error: wipeErr } = await admin
    .from("tickets")
    .delete()
    .in("user_id", [customerId, customer2Id]);
  if (wipeErr) throw new Error(`ticket wipe: ${wipeErr.message}`);

  const { data: t1, error: t1Err } = await admin
    .from("tickets")
    .insert({
      user_id: customerId,
      assigned_to: agentId,
      subject: "Can't reset my password",
      body: "I requested a reset link twice but never received the email.",
      status: "pending",
      priority: "high",
    })
    .select()
    .single();
  if (t1Err) throw new Error(`ticket insert (t1): ${t1Err.message}`);

  const { error: repliesErr } = await admin.from("ticket_replies").insert([
    {
      ticket_id: t1.id,
      user_id: customerId,
      body: "Any update on this? It's been a day.",
      is_internal: false,
    },
    {
      ticket_id: t1.id,
      user_id: agentId,
      body: "Checked the mail logs -- SMTP provider flagged the domain, escalating to admin.",
      is_internal: true,
    },
  ]);
  if (repliesErr) throw new Error(`reply insert: ${repliesErr.message}`);

  const { error: restErr } = await admin.from("tickets").insert([
    {
      user_id: customerId,
      subject: "Billing shows the wrong plan",
      body: "Dashboard says I'm on the free plan but I was charged for Pro.",
      status: "open",
      priority: "normal",
    },
    {
      user_id: customerId,
      subject: "Feature request: dark mode",
      body: "Would love a dark theme for the dashboard.",
      status: "resolved",
      priority: "low",
    },
    {
      user_id: customer2Id,
      subject: "API returns 500 on /export",
      body: "Consistently failing for the last hour, no changes on our end.",
      status: "open",
      priority: "urgent",
    },
  ]);
  if (restErr) throw new Error(`ticket insert (rest): ${restErr.message}`);

  console.log(`  4 tickets, 2 replies (1 internal)`);

  console.log("\nDone. Seeded logins (password for all: demo-password-123):");
  for (const u of USERS) console.log(`  ${u.role.padEnd(9)} ${u.email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
