import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

export interface CredentialsPayload {
  email?: string | null;
  password?: string | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export const adminSupabase = supabase;

export const normalizeEmail = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * The id of our own User row for this address, or null.
 *
 * This is the only identifier the rest of the app should ever see. An OAuth
 * provider's `user.id` is its own subject, which is meaningless here.
 */
export const findUserIdByEmail = async (
  email: string | null | undefined
): Promise<string | null> => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }

  const { data, error } = await supabase
    .from("User")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    console.error("Error resolving user id by email:", error);
    return null;
  }

  return typeof data?.id === "string" ? data.id : null;
};

/**
 * Make sure an OAuth sign-in has a User row, and hand back its id.
 *
 * Returns the existing row's id when there is one, so signing in with Google
 * using the same address as an existing password account resolves to that same
 * account rather than creating a second one.
 */
export const ensureOAuthUser = async (
  email: string | null | undefined,
  name: string | null | undefined
): Promise<string | null> => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }

  const existingId = await findUserIdByEmail(normalized);
  if (existingId) {
    return existingId;
  }

  const { data, error } = await supabase
    .from("User")
    .insert([
      {
        id: crypto.randomUUID(),
        name: typeof name === "string" ? name : "",
        email: normalized,
        // OAuth accounts have no password. authorizeWithSupabase refuses to
        // sign in any row with a blank hash, so this cannot be used to log in
        // with credentials.
        passwordHash: "",
      },
    ])
    .select("id")
    .maybeSingle();

  if (error) {
    // A concurrent sign-in may have inserted the row first; the unique index on
    // email makes that a conflict rather than a duplicate account.
    const conflicted = await findUserIdByEmail(normalized);
    if (conflicted) {
      return conflicted;
    }
    console.error("Error creating OAuth user:", error);
    return null;
  }

  return typeof data?.id === "string" ? data.id : null;
};

export const authorizeWithSupabase = async (
  credentials: CredentialsPayload | null | undefined
) => {
  const email = normalizeEmail(credentials?.email ?? null);
  const password = credentials?.password ?? null;

  if (!email || typeof password !== "string" || password.length === 0) {
    return null;
  }

  try {
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("email", email)
      .single();

    if (!user?.passwordHash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error("Authorization error:", error);
    return null;
  }
};
