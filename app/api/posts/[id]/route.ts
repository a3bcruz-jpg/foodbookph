import { NextResponse } from "next/server";
import { deletePost, getPost, updatePost } from "@/lib/content-repository";
import { getCurrentAccount } from "@/lib/session";
import { isCustomerAccount } from "@/lib/account-role";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const post = await getPost(id);
  return post ? NextResponse.json({ post }) : NextResponse.json({ error: "Post not found." }, { status: 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isCustomerAccount(account.roles)) return NextResponse.json({ error: "Only customer accounts can manage community posts." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json() as Record<string, unknown>;
  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  if (!caption || caption.length > 280) return NextResponse.json({ error: "Caption must be 1-280 characters." }, { status: 400 });
  const result = await updatePost(id, account.id, caption);
  return result ? NextResponse.json({ post: result }) : NextResponse.json({ error: "Post not found or not owned by you." }, { status: 404 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isCustomerAccount(account.roles)) return NextResponse.json({ error: "Only customer accounts can manage community posts." }, { status: 403 });
  const { id } = await context.params;
  return await deletePost(id, account.id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Post not found or not owned by you." }, { status: 404 });
}
