import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
const UPPERCASE_REGEX = /[A-ZÅÄÖ]/;
const LOWERCASE_REGEX = /[a-zåäö]/;
const DIGIT_REGEX = /\d/;
const SYMBOL_REGEX = /[^A-Za-z0-9]/;

const sanitizeName = (value: string) => value.replace(/\s+/g, " ").trim();

const isStrongPassword = (value: string) => {
  if (value.length < MIN_PASSWORD_LENGTH || value.length > MAX_PASSWORD_LENGTH) {
    return false;
  }
  return (
    UPPERCASE_REGEX.test(value) &&
    LOWERCASE_REGEX.test(value) &&
    DIGIT_REGEX.test(value) &&
    SYMBOL_REGEX.test(value)
  );
};

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const rawName = typeof payload?.name === "string" ? payload.name : "";
    const rawEmail = typeof payload?.email === "string" ? payload.email : "";
    const rawPassword = typeof payload?.password === "string" ? payload.password : "";

    const name = sanitizeName(rawName);
    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword.trim();

    if (!name) {
      return NextResponse.json({ error: "Nimi on pakollinen" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Anna kelvollinen sähköpostiosoite" }, { status: 400 });
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          error:
            "Salasanan on oltava 12-128 merkkiä ja sisällettävä iso ja pieni kirjain, numero ja erikoismerkki.",
        },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Täytä kaikki kentät" }, { status: 400 });
    }

    // Check if user already exists
    const candidateEmails = Array.from(new Set([email, rawEmail.trim()])).filter(Boolean);

    const { data: existingUsers, error: existingUsersError } = await supabase
      .from("User")
      .select("id")
      .in("email", candidateEmails);

    if (existingUsersError) {
      throw existingUsersError;
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: "Sähköposti on jo käytössä" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create new user
    const { data: user, error } = await supabase
      .from("User")
      .insert([{ id: userId, name, email, passwordHash }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("Error during registration:", err);
    const errorMessage = err instanceof Error ? err.message : "Rekisteröinti epäonnistui";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}