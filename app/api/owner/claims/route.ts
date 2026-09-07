import { NextResponse } from "next/server";
import { submitRestaurantClaim } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const restaurantId = typeof body.restaurantId === "string" ? body.restaurantId : "";
  const proofNote = typeof body.proofNote === "string" ? body.proofNote.trim() : "";
  if (!restaurantId || proofNote.length < 10) return NextResponse.json({ error: "Choose a restaurant and add a short ownership note." }, { status: 400 });
  const claim = await submitRestaurantClaim(account.id, restaurantId, proofNote);
  return claim ? NextResponse.json({ claim }, { status: 201 }) : NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
}
