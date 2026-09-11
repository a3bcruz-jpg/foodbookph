import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { getRestaurant, updateRestaurant } from "@/lib/content-repository";
import { getPrisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const restaurant = await getRestaurant(id);
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  const serialized = "menus" in restaurant ? { ...restaurant, menus: restaurant.menus.map((menu) => ({ ...menu, items: menu.items.map((item) => ({ ...item, price: item.price === null ? null : Number(item.price) })) })) } : restaurant;
  return NextResponse.json({ restaurant: serialized });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  if (!account.roles.includes("ADMIN")) {
    if (!account.roles.includes("RESTAURANT_OWNER")) return NextResponse.json({ error: "Restaurant management permission required." }, { status: 403 });
    const prisma = getPrisma();
    if (!prisma) return NextResponse.json({ error: "Database required." }, { status: 503 });
    const membership = await prisma.restaurantMembership.findFirst({ where: { restaurantId: id, userId: account.id, role: { in: ["OWNER", "MANAGER"] } }, select: { id: true } });
    if (!membership) return NextResponse.json({ error: "You do not manage this restaurant." }, { status: 403 });
  }
  const body = await request.json() as Record<string, unknown>;
  try {
    const restaurant = await updateRestaurant(id, { name: typeof body.name === "string" ? body.name.trim() : undefined, description: typeof body.description === "string" ? body.description.trim() : undefined, cuisine: typeof body.cuisine === "string" ? body.cuisine.trim() : undefined, address: typeof body.address === "string" ? body.address.trim() : undefined, city: typeof body.city === "string" ? body.city.trim() : undefined });
    return restaurant ? NextResponse.json({ restaurant }) : NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Unable to update restaurant." }, { status: 409 });
  }
}
