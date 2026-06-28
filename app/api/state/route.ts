import { NextRequest, NextResponse } from "next/server";
import { getServerState, setServerState } from "@/lib/server-store";

export async function GET() {
  return NextResponse.json(getServerState());
}

export async function POST(req: NextRequest) {
  const state = await req.json();
  setServerState(state);
  return NextResponse.json({ ok: true });
}
