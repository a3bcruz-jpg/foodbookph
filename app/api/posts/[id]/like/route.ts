import { NextResponse } from "next/server";
import { getPost, setLike } from "@/lib/content-repository";
import { getCurrentAccount } from "@/lib/session";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) { const account = await getCurrentAccount(); if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); const { id } = await context.params; if (!(await getPost(id))) return NextResponse.json({ error: "Post not found." }, { status: 404 }); await setLike(account.id, id, true); return NextResponse.json({ liked: true }); }
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) { const account = await getCurrentAccount(); if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); const { id } = await context.params; if (!(await getPost(id))) return NextResponse.json({ error: "Post not found." }, { status: 404 }); await setLike(account.id, id, false); return NextResponse.json({ liked: false }); }
