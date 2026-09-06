import { NextResponse } from "next/server";
import { listPosts, listRestaurants } from "@/lib/content-repository";
import { localPosts } from "@/lib/content-store";
import { getCurrentAccount } from "@/lib/session";

export async function GET(request: Request) { const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""; if (query.length < 2) return NextResponse.json({ restaurants: [], posts: [] }); const restaurants = await listRestaurants(query); const posts = (await listPosts((await getCurrentAccount())?.id)).filter((post) => `${post.caption} ${post.place} ${post.author}`.toLowerCase().includes(query.toLowerCase())); return NextResponse.json({ restaurants, posts, localCount: localPosts.length }); }
