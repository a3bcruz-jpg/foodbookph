import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ service: "foodbookph", status: "ok", phase: 1 });
}
