import { NextResponse } from "next/server";
import { updateOwnedRestaurant } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

const LIMITS = {
  name: 120,
  cuisine: 80,
  address: 200,
  city: 100,
  description: 1000,
  phone: 40,
  website: 500,
} as const;

function readText(body: Record<string, unknown>, key: string, maxLength: number, required = false) {
  const value = typeof body[key] === "string" ? body[key].trim() : "";
  if (required && !value) return { value: "", error: `${key} is required.` };
  if (value.length > maxLength) return { value: "", error: `${key} must be ${maxLength} characters or fewer.` };
  return { value };
}

function validateWebsite(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id || id.length > 100) return NextResponse.json({ error: "Invalid restaurant." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = readText(body, "name", LIMITS.name, true);
  const cuisine = readText(body, "cuisine", LIMITS.cuisine, true);
  const address = readText(body, "address", LIMITS.address, true);
  const city = readText(body, "city", LIMITS.city, true);
  const description = readText(body, "description", LIMITS.description);
  const phone = readText(body, "phone", LIMITS.phone);
  const website = readText(body, "website", LIMITS.website);

  const fieldError = [name, cuisine, address, city, description, phone, website].find((result) => result.error);
  if (fieldError?.error) return NextResponse.json({ error: fieldError.error }, { status: 400 });
  if (!validateWebsite(website.value)) {
    return NextResponse.json({ error: "Website must be a valid http:// or https:// URL." }, { status: 400 });
  }

  try {
    const restaurant = await updateOwnedRestaurant(account.id, id, {
      name: name.value,
      cuisine: cuisine.value,
      address: address.value,
      city: city.value,
      description: description.value,
      phone: phone.value,
      website: website.value,
    });
    return restaurant
      ? NextResponse.json({ restaurant })
      : NextResponse.json({ error: "Restaurant not found or not managed by you." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Unable to save restaurant changes." }, { status: 500 });
  }
}
