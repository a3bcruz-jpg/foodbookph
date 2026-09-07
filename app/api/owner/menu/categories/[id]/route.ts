import { NextResponse } from "next/server";
import { deleteMenuCategory, updateMenuCategory } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

async function owner() {
  const account = await getCurrentAccount();
  if (!account) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return { response: NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 }) };
  return { account };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await owner();
  if (auth.response) return auth.response;
  const body = await request.json() as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const sortOrder = typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder) ? body.sortOrder : 0;
  if (!name || name.length > 80 || (description && description.length > 300)) return NextResponse.json({ error: "Category name and description are invalid." }, { status: 400 });
  const { id } = await context.params;
  const category = await updateMenuCategory(auth.account!.id, id, { name, description, sortOrder });
  return category ? NextResponse.json({ category }) : NextResponse.json({ error: "Category not found or not managed by you." }, { status: 404 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await owner();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  const result = await deleteMenuCategory(auth.account!.id, id);
  if (result.hasItems) return NextResponse.json({ error: "This category contains menu items. Move or delete the items before deleting the category." }, { status: 409 });
  return result.deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Category not found or not managed by you." }, { status: 404 });
}
