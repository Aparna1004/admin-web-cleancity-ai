import { NextResponse } from "next/server";

// Frontend-only mode: simply redirect to the requested page.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const redirect = searchParams.get("redirect") || "/dashboard";
  return NextResponse.redirect(new URL(redirect, origin));
}

