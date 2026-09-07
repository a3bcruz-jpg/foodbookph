import { NextResponse } from "next/server";
import { updateOwnedRestaurant } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json() as Record<string, unknown>;
  const values = {
    name: typeof body.name === "string" ? body.name.trim() : "",
    cuisine: typeof body.cuisine === "string" ? body.cuisine.trim() : "",
    address: typeof body.address === "string" ? body.address.trim() : "",
    city: typeof body.city === "string" ? body.city.trim() : "",
    description: typeof body.description === "string" ? body.description.trim() : undefined,
    phone: typeof body.phone === "string" ? body.phone.trim() : undefined,
    website: typeof body.website === "string" ? body.website.trim() : undefined,
  };
  if (!values.name || !values.cuisine || !values.address || !values.city) return NextResponse.json({ error: "Name, cuisine, address, and city are required." }, { status: 400 });
  try {
    const restaurant = await updateOwnedRestaurant(account.id, id, values);
    return restaurant ? NextResponse.json({ restaurant }) : NextResponse.json({ error: "Restaurant not found or not managed by you." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Unable to save restaurant changes." }, { status: 500 });
  }
}
