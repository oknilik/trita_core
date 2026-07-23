import { NextResponse } from "next/server";

// P5 — egységesítés: a lead-logika a közös /api/features/interest végpontra
// került (mode:"lead"). Ez az út csak 308-as átirányítás, hogy a régebbi
// kliens-bundle-ök POST-jai (mode nélkül, ?legacy=lead jelölővel) ne törjenek.
// A 308 megtartja a metódust és a body-t.

export async function POST(req: Request) {
  return NextResponse.redirect(new URL("/api/features/interest?legacy=lead", req.url), 308);
}
