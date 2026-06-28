import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD ?? "auction2026";

  if (password !== expected) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin-auth", expected, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
