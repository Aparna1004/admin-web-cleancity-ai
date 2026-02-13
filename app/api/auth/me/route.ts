import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../lib/supabaseServer";

export const dynamic = "force-dynamic"; // 🔥 REQUIRED

// GET /api/auth/me
export async function GET(req: Request) {
  try {
    const { user, error } = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: error ?? "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role ?? null,
        user_metadata: user.user_metadata ?? {},
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[auth/me:GET] Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
