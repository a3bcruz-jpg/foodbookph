import { NextResponse } from "next/server";
import { createMenuCategory } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const restaurantId = typeof body.restaurantId === "string" ? body.restaurantId : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const sortOrder = typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder) ? body.sortOrder : 0;
  if (!restaurantId) return NextResponse.json({ error: "Restaurant is required." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  if (name.length > 80 || (description && description.length > 300)) return NextResponse.json({ error: "Category name or description is too long." }, { status: 400 });
  const category = await createMenuCategory(account.id, { restaurantId, name, description, sortOrder });
  return category ? NextResponse.json({ category }, { status: 201 }) : NextResponse.json({ error: "Restaurant not found or not managed by you." }, { status: 404 });
}
