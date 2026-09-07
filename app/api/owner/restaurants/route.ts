import { NextResponse } from "next/server";
import { createOwnedRestaurant } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const cuisine = typeof body.cuisine === "string" ? body.cuisine.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  if (!name) return NextResponse.json({ error: "Restaurant name is required." }, { status: 400 });
  if (!cuisine) return NextResponse.json({ error: "Cuisine is required." }, { status: 400 });
  if (!address) return NextResponse.json({ error: "Address is required." }, { status: 400 });
  if (!city) return NextResponse.json({ error: "City is required." }, { status: 400 });
  try {
    const restaurant = await createOwnedRestaurant(account.id, {
      name,
      cuisine,
      address,
      city,
      description: typeof body.description === "string" ? body.description.trim() : undefined,
      phone: typeof body.phone === "string" ? body.phone.trim() : undefined,
      website: typeof body.website === "string" ? body.website.trim() : undefined,
    });
    return restaurant ? NextResponse.json({ restaurant }, { status: 201 }) : NextResponse.json({ error: "Restaurant creation requires a configured database." }, { status: 503 });
  } catch (error) {
    if (error instanceof Error && error.message === "You already have a restaurant connected to this account.") return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ error: "Unable to create your restaurant." }, { status: 409 });
  }
}
