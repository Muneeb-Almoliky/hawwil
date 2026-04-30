import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

interface SeedUser {
  email: string;
  password: string;
  fullName: string;
  country: string;
  role: "sender" | "ops_admin";
  balanceSar: number;
}

interface AuthUser {
  id: string;
  email?: string;
}

type SupabaseAdminClient = ReturnType<typeof createClient> & {
  from: (table: string) => {
    upsert: (
      values: Record<string, unknown>,
      options: { onConflict: string }
    ) => Promise<{ error: Error | null }>;
  };
};

const DEFAULT_SEED_PASSWORD = "HawwilDemo123!";

const SEED_USERS: SeedUser[] = [
  {
    email: "ops@hawwil.demo",
    password: DEFAULT_SEED_PASSWORD,
    fullName: "Hawwil Ops",
    country: "Saudi Arabia",
    role: "ops_admin",
    balanceSar: 50_000,
  },
  {
    email: "muneeb@hawwil.demo",
    password: DEFAULT_SEED_PASSWORD,
    fullName: "Muneeb Almoliky",
    country: "Saudi Arabia",
    role: "sender",
    balanceSar: 10_000,
  },
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function findUserByEmail(
  supabaseAdmin: SupabaseAdminClient,
  email: string
): Promise<AuthUser | null> {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      return { id: user.id, email: user.email };
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function createOrLoadUser(
  supabaseAdmin: SupabaseAdminClient,
  seedUser: SeedUser
): Promise<AuthUser> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: seedUser.email,
    password: seedUser.password,
    email_confirm: true,
    user_metadata: { full_name: seedUser.fullName },
  });

  if (!error && data.user) {
    return { id: data.user.id, email: data.user.email };
  }

  const alreadyExists =
    error?.message.toLowerCase().includes("already") ||
    error?.message.toLowerCase().includes("exists");

  if (!alreadyExists) {
    throw error;
  }

  const existingUser = await findUserByEmail(supabaseAdmin, seedUser.email);
  if (!existingUser) {
    throw new Error(`User exists but could not be loaded: ${seedUser.email}`);
  }

  await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
    password: seedUser.password,
    user_metadata: { full_name: seedUser.fullName },
  });

  return existingUser;
}

async function upsertProfile(
  supabaseAdmin: SupabaseAdminClient,
  userId: string,
  seedUser: SeedUser
): Promise<void> {
  const profileTable = (
    supabaseAdmin as unknown as {
      from: (table: string) => {
        upsert: (
          values: Record<string, unknown>,
          options: { onConflict: string }
        ) => Promise<{ error: Error | null }>;
      };
    }
  ).from("profiles");

  const { error } = await profileTable.upsert(
    {
      id: userId,
      full_name: seedUser.fullName,
      country: seedUser.country,
      currency: "SAR",
      verified: true,
      role: seedUser.role,
      balance_sar: seedUser.balanceSar,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}

async function seedUsers(): Promise<void> {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceRoleKey
  ) as SupabaseAdminClient;

  for (const seedUser of SEED_USERS) {
    const authUser = await createOrLoadUser(supabaseAdmin, seedUser);
    await upsertProfile(supabaseAdmin, authUser.id, seedUser);
    console.log(`Seeded ${seedUser.role}: ${seedUser.email}`);
  }
}

seedUsers()
  .then(() => {
    console.log("Seed users completed.");
  })
  .catch((error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "PGRST205"
    ) {
      console.error(
        "Database schema is missing. Run supabase/migrations/202604290020_phase2_core.sql first, then rerun pnpm seed:users."
      );
      process.exitCode = 1;
      return;
    }

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unknown seed error", error);
    }
    process.exitCode = 1;
  });
