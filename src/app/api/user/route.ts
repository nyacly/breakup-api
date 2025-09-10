import { NextRequest, NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase";
import { corsHeaders, handleOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleOptions(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;
  const auth = req.headers.get("authorization") || "";
  const jwt = auth.replace(/Bearer\s+/i, "").trim();
  if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders(origin) });

  const supa = createUserClient(jwt);
  const { data, error } = await supa.auth.getUser();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401, headers: corsHeaders(origin) });
  }

  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders(origin) });
  }

  return NextResponse.json({ user: data.user }, { headers: corsHeaders(origin) });
}
