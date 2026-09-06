import { NextResponse } from "next/server";
import { createPost, listPosts } from "@/lib/content-repository";
import { getCurrentAccount } from "@/lib/session";

export async function GET() { const account = await getCurrentAccount(); return NextResponse.json({ posts: await listPosts(account?.id) }); }
export async function POST(request: Request) { const account = await getCurrentAccount(); if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); const body = await request.json() as Record<string, unknown>; const caption = typeof body.caption === "string" ? body.caption.trim() : ""; const image = typeof body.image === "string" ? body.image : ""; const restaurantId = typeof body.restaurantId === "string" ? body.restaurantId : undefined; if (caption.length < 1 || caption.length > 280) return NextResponse.json({ error: "Caption must be 1-280 characters." }, { status: 400 }); try { return NextResponse.json({ post: await createPost({ authorId: account.id, caption, image, restaurantId }) }, { status: 201 }); } catch { return NextResponse.json({ error: "Unable to create post." }, { status: 400 }); } }
