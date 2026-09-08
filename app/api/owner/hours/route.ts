import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { getOwnerHours, saveOwnerHours } from "@/lib/owner-hours-repository";

function authorized(account: Awaited<ReturnType<typeof getCurrentAccount>>) {
  return !!account && (account.roles.includes("RESTAURANT_OWNER") || account.roles.includes("ADMIN"));
}

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!authorized(account)) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  const data = await getOwnerHours(account.id);
  return data ? NextResponse.json(data) : NextResponse.json({ error: "No restaurant is connected to this account." }, { status: 404 });
}

export async function PUT(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!authorized(account)) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  try {
    const body = await request.json() as { restaurantId?: string; hours?: unknown };
    if (!body.restaurantId || !Array.isArray(body.hours)) return NextResponse.json({ error: "Restaurant and seven-day hours are required." }, { status: 400 });
    const hours = body.hours as Array<{ dayOfWeek: number; isClosed: boolean; openTime?: string | null; closeTime?: string | null }>;
    const data = await saveOwnerHours(account.id, body.restaurantId, hours);
    return data ? NextResponse.json({ hours: data }) : NextResponse.json({ error: "Restaurant not found or not managed by you." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save business hours." }, { status: 400 });
  }
}
