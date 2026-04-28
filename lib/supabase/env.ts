function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.length > 0);
}

export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabasePublishableKey(): string | undefined {
  return firstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
