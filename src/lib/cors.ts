const ALLOWED = (process.env.ALLOWED_ORIGINS || "*").split(",");

export function corsHeaders(origin?: string) {
  const allow = ALLOWED.includes("*") ? "*" :
    (origin && ALLOWED.includes(origin) ? origin : ALLOWED[0] || "*");
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function handleOptions(origin?: string) {
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
