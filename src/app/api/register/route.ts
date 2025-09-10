import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
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

    const supa = createAdminClient();
    const { data, error } = await supa.auth.signUp({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders(origin) });
    }

    if (!data.user) {
        return NextResponse.json({ error: "Registration failed" }, { status: 500, headers: corsHeaders(origin) });
    }

    // The user is created, but needs to verify email.
    // Supabase sends a confirmation email automatically if enabled.
    // We do not return a session here. The user must login after verification.
    return NextResponse.json({ message: "Registration successful, please check your email for verification." }, { headers: corsHeaders(origin) });

  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: corsHeaders(origin) });
  }
}
