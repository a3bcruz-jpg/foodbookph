import { NextResponse } from "next/server";
import { createMenuItem } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const restaurantId = typeof body.restaurantId === "string" ? body.restaurantId : "";
  const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const price = typeof body.price === "number" ? body.price : Number(body.price);
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : undefined;
  const isAvailable = typeof body.isAvailable === "boolean" ? body.isAvailable : true;
  const sortOrder = typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder) ? body.sortOrder : 0;
  if (!restaurantId || !categoryId || !name) return NextResponse.json({ error: "Restaurant, category, and item name are required." }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Price must be a number greater than or equal to zero." }, { status: 400 });
  if (name.length > 120 || (description && description.length > 500)) return NextResponse.json({ error: "Item name or description is too long." }, { status: 400 });
  const item = await createMenuItem(account.id, { restaurantId, categoryId, name, description, price, imageUrl, isAvailable, sortOrder });
  return item ? NextResponse.json({ item: { ...item, price: item.price === null ? null : Number(item.price) } }, { status: 201 }) : NextResponse.json({ error: "Category not found or not managed by you." }, { status: 404 });
}
