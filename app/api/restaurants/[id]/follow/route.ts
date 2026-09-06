import { NextResponse } from "next/server";
import { getRestaurant, setFollow } from "@/lib/content-repository";
import { getCurrentAccount } from "@/lib/session";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) { const account = await getCurrentAccount(); if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); const { id } = await context.params; if (!(await getRestaurant(id))) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 }); await setFollow(account.id, id, true); return NextResponse.json({ following: true }); }
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) { const account = await getCurrentAccount(); if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); const { id } = await context.params; if (!(await getRestaurant(id))) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 }); await setFollow(account.id, id, false); return NextResponse.json({ following: false }); }
