import { NextRequest, NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase";
import { corsHeaders, handleOptions } from "@/lib/cors";
import OpenAI from "openai";

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

  const { threadId, text, persona } = await req.json() as { threadId: number; text: string; persona?: string };
  if (!threadId || !text) return NextResponse.json({ error: "threadId and text required" }, { status: 400, headers: corsHeaders(origin) });

  // Confirm thread belongs to user (optional safety)
  const th = await supa.from("threads").select("id,user_id").eq("id", threadId).single();
  if (th.error || th.data?.user_id !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders(origin) });
  }

  // Save user message
  const m1 = await supa.from("messages").insert({ thread_id: threadId, role: 'user', text }).select("id").single();
  if (m1.error) return NextResponse.json({ error: m1.error.message }, { status: 400, headers: corsHeaders(origin) });

  // Call LLM (swap to OpenRouter/Gemini if you prefer)
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const system = `You are a kind breakup-recovery ${persona ?? "coach"}. Be concise, practical, compassionate, body-aware. Avoid medical diagnoses.`;
  const resp = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    messages: [
      { role: "system", content: system },
      { role: "user", content: text }
    ],
  });
  const reply = resp.choices[0]?.message?.content?.trim() || "I'm here with you. Try a slow 4-6 breath now.";

  // Save NPC reply
  await supa.from("messages").insert({ thread_id: threadId, role: 'npc', text: reply });

  return NextResponse.json({ ok: true, reply }, { headers: corsHeaders(origin) });
}
