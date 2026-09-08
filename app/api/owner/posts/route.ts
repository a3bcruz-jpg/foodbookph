import { NextResponse } from "next/server";
import { createOwnerPost, getOwnerPosts } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  }
  const posts = await getOwnerPosts(account.id);
  return posts ? NextResponse.json({ posts }) : NextResponse.json({ error: "No restaurant is connected to this account." }, { status: 404 });
}

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  }

  const body = await request.json() as Record<string, unknown>;
  const restaurantId = typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";
  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";

  if (!restaurantId) return NextResponse.json({ error: "Restaurant is required." }, { status: 400 });
  if (caption.length < 1 || caption.length > 280) return NextResponse.json({ error: "Caption must be 1-280 characters." }, { status: 400 });
  if (image && !/^https:\/\//i.test(image)) return NextResponse.json({ error: "Post image must use a secure https:// URL." }, { status: 400 });

  try {
    const post = await createOwnerPost(account.id, { restaurantId, caption, image });
    return post ? NextResponse.json({ post }, { status: 201 }) : NextResponse.json({ error: "Restaurant not found or not managed by you." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Unable to create post." }, { status: 400 });
  }
}
