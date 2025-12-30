import { NextResponse } from "next/server";
import { getSupabaseServiceClient, getUserFromRequest } from "../../../lib/supabaseServer";

type BinRequestPayload = {
  latitude: number;
  longitude: number;
  address: string;
};

// POST /api/bin-requests
// Used by the Expo citizen app. Requires a Supabase access token (Bearer).
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType && !contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 });
    }

    const { user, error: authError } = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: authError ?? "Unauthorized" }, { status: 401 });
    }

    let body: Partial<BinRequestPayload>;
    try {
      body = (await req.json()) as Partial<BinRequestPayload>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { latitude, longitude, address } = body;

    const addressStr = typeof address === "string" ? address.trim() : "";
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !addressStr
    ) {
      return NextResponse.json(
        { error: "Invalid payload. Expected { latitude: number, longitude: number, address: non-empty string }" },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180." }, { status: 400 });
    }

    if (addressStr.length > 512) {
      return NextResponse.json({ error: "Address is too long (max 512 characters)" }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("bin_requests")
      .insert({
        user_id: user.id,
        latitude,
        longitude,
        address: addressStr,
        status: "requested",
      })
      .select()
      .single();

    if (error) {
      console.error("[bin-requests:POST] Supabase error inserting bin request", error);
      return NextResponse.json({ error: "Failed to create bin request" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[bin-requests:POST] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/bin-requests
// Optional query params:
//   scope=all   -> admins see all; others still see just their own
//   limit       -> page size (default 50, max 200)
//   offset      -> offset for pagination (default 0)
export async function GET(req: Request) {
  try {
    const { user, error: authError } = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: authError ?? "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope");
    const role = (user.user_metadata?.role ?? "").toString();

    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    let limit = Number(limitParam ?? "50");
    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    if (limit > 200) limit = 200;

    let offset = Number(offsetParam ?? "0");
    if (!Number.isFinite(offset) || offset < 0) offset = 0;

    let query = supabase.from("bin_requests").select("*").order("created_at", { ascending: false });

    const isAdminOrWorker = role === "admin" || role === "worker";
    if (!(isAdminOrWorker && scope === "all")) {
      query = query.eq("user_id", user.id);
    }

    // Supabase uses inclusive ranges.
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("[bin-requests:GET] Supabase error fetching bin requests", error);
      return NextResponse.json({ error: "Failed to fetch bin requests" }, { status: 500 });
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err) {
    console.error("[bin-requests:GET] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


