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

const normalizeEmail = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
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
