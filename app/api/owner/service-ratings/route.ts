import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { getRestaurantRatingSummary } from "@/lib/content-repository";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database required." }, { status: 503 });

  const membership = await prisma.restaurantMembership.findFirst({ where: { userId: account.id, role: { in: ["OWNER", "MANAGER"] } }, orderBy: { id: "asc" }, select: { restaurantId: true, restaurant: { select: { id: true, name: true } } } });
  if (!membership) return NextResponse.json({ error: "No restaurant is connected to this account." }, { status: 404 });

  return NextResponse.json({ restaurant: membership.restaurant, ratings: await getRestaurantRatingSummary(membership.restaurantId) });
}
