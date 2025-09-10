import { NextRequest, NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase";
import { corsHeaders, handleOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleOptions(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400, headers: corsHeaders(origin) });
    }

    // Using createUserClient as we don't need admin rights to log in.
    // The signInWithPassword function does not depend on user-specific RLS.
    const supa = createUserClient();
    const { data, error } = await supa.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401, headers: corsHeaders(origin) });
    }

    if (!data.session) {
        return NextResponse.json({ error: "Login failed, no session" }, { status: 401, headers: corsHeaders(origin) });
    }

    // Login successful, return the session which contains the JWT access_token.
    return NextResponse.json({ session: data.session }, { headers: corsHeaders(origin) });

  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: corsHeaders(origin) });
  }
}
