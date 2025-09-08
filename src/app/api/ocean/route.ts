import { NextRequest, NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase";
import { corsHeaders, handleOptions } from "@/lib/cors";

type Answer = { trait: "O"|"C"|"E"|"A"|"N"; reverse?: boolean; value: 1|2|3|4|5 };

export async function OPTIONS(req: NextRequest) {
  return handleOptions(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;
  const auth = req.headers.get("authorization") || "";
  const jwt = auth.replace(/Bearer\s+/i, "").trim();
  if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders(origin) });

  const supa = createUserClient(jwt);
  const user = await supa.auth.getUser();
  if (!user.data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders(origin) });
  const uid = user.data.user.id;

  const { answers } = (await req.json()) as { answers: Answer[] };
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "answers required" }, { status: 400, headers: corsHeaders(origin) });
  }

  // Score OCEAN
  const score = (rev:boolean|undefined, v:number) => (rev ? 6 - v : v);
  const sum = (t: Answer["trait"]) => answers.filter(a => a.trait === t)
      .reduce((s,a)=> s + score(a.reverse, a.value), 0);

  const O = sum("O"), C = sum("C"), E = sum("E"), A = sum("A"), N = sum("N");

  // Save snapshot
  const ins = await supa.from("bigfive_results").insert({ user_id: uid, o:O,c:C,e:E,a:A,n:N }).select("id").single();
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 400, headers: corsHeaders(origin) });

  // Call your SQL RPC to create the personalized plan (see earlier SQL)
  const rpc = await supa.rpc("create_personalized_plan", { p_user: uid, p_o: O, p_c: C, p_e: E, p_a: A, p_n: N });
  if (rpc.error) return NextResponse.json({ error: rpc.error.message }, { status: 400, headers: corsHeaders(origin) });

  return NextResponse.json({ ok: true, planId: rpc.data }, { headers: corsHeaders(origin) });
}
