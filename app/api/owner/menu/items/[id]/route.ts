import { NextResponse } from "next/server";
import { deleteMenuItem, updateMenuItem } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const price = typeof body.price === "number" ? body.price : Number(body.price);
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : undefined;
  const isAvailable = typeof body.isAvailable === "boolean" ? body.isAvailable : true;
  const sortOrder = typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder) ? body.sortOrder : 0;
  if (!categoryId || !name) return NextResponse.json({ error: "Category and item name are required." }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Price must be a number greater than or equal to zero." }, { status: 400 });
  const { id } = await context.params;
  const item = await updateMenuItem(account.id, id, { categoryId, name, description, price, imageUrl, isAvailable, sortOrder });
  return item ? NextResponse.json({ item: { ...item, price: item.price === null ? null : Number(item.price) } }) : NextResponse.json({ error: "Item not found or not managed by you." }, { status: 404 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  const { id } = await context.params;
  return await deleteMenuItem(account.id, id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Item not found or not managed by you." }, { status: 404 });
}
