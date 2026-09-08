import { NextResponse } from "next/server";
import { deleteOwnerPost, updateOwnerPost } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

async function ownerAccount() {
  const account = await getCurrentAccount();
  if (!account) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) {
    return { response: NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 }) };
  }
  return { account };
}

export async function PATCH(request: Request, context: Context) {
  const auth = await ownerAccount();
  if (!auth.account) return auth.response;
  const { id } = await context.params;
  const body = await request.json() as Record<string, unknown>;
  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  if (caption.length < 1 || caption.length > 280) return NextResponse.json({ error: "Caption must be 1-280 characters." }, { status: 400 });
  if (image && !/^https:\/\//i.test(image)) return NextResponse.json({ error: "Post image must use a secure https:// URL." }, { status: 400 });
  const post = await updateOwnerPost(auth.account.id, id, caption, image);
  return post ? NextResponse.json({ post }) : NextResponse.json({ error: "Post not found or not managed by you." }, { status: 404 });
}

export async function DELETE(_request: Request, context: Context) {
  const auth = await ownerAccount();
  if (!auth.account) return auth.response;
  const { id } = await context.params;
  const deleted = await deleteOwnerPost(auth.account.id, id);
  return deleted ? NextResponse.json({ deleted: true }) : NextResponse.json({ error: "Post not found or not managed by you." }, { status: 404 });
}
