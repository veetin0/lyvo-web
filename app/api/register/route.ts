import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Täytä kaikki kentät" }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("User")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
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

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Error during registration:", err);
    const errorMessage = err instanceof Error ? err.message : "Rekisteröinti epäonnistui";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}