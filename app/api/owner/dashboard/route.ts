import { NextResponse } from "next/server";
import { getOwnerDashboard } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  return NextResponse.json({ dashboard: await getOwnerDashboard(account.id) });
}
