import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  }

  const body = await request.json() as { restaurantId?: string; url?: string; alt?: string };
  const restaurantId = typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const alt = typeof body.alt === "string" ? body.alt.trim() : "";
  if (!restaurantId || !url) return NextResponse.json({ error: "Restaurant and photo URL are required." }, { status: 400 });
  if (!/^https:\/\//i.test(url)) return NextResponse.json({ error: "Photo URL must use HTTPS." }, { status: 400 });

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurantId,
      ...(account.roles.includes("ADMIN") ? {} : { memberships: { some: { userId: account.id, role: { in: ["OWNER", "MANAGER"] } } } }),
    },
    select: { id: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found or not managed by you." }, { status: 404 });

  const photo = await prisma.restaurantPhoto.create({ data: { restaurantId, url, alt: alt || null } });
  return NextResponse.json({ photo }, { status: 201 });
}

export async function DELETE(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  }
  const body = await request.json() as { restaurantId?: string; photoId?: string };
  const restaurantId = typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";
  const photoId = typeof body.photoId === "string" ? body.photoId.trim() : "";
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const result = await prisma.restaurantPhoto.deleteMany({
    where: {
      id: photoId,
      restaurantId,
      ...(account.roles.includes("ADMIN") ? {} : { restaurant: { memberships: { some: { userId: account.id, role: { in: ["OWNER", "MANAGER"] } } } } }),
    },
  });
  return result.count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Photo not found or not managed by you." }, { status: 404 });
}
