import { NextResponse } from "next/server";
import { publicAccount } from "@/lib/account-store";
import { registerAccount, startSession } from "@/lib/account-repository";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const username = typeof body.username === "string" ? body.username : "";
    const displayName = typeof body.displayName === "string" ? body.displayName : "";
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) return NextResponse.json({ error: "Password must be at least 8 characters with upper, lower, and a number." }, { status: 400 });
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username.replace(/^@/, ""))) return NextResponse.json({ error: "Username must be 3-24 letters, numbers, or underscores." }, { status: 400 });
    if (displayName.trim().length < 2 || displayName.trim().length > 60) return NextResponse.json({ error: "Display name must be between 2 and 60 characters." }, { status: 400 });
    const account = await registerAccount({ email, password, username, displayName });
    const response = NextResponse.json({ account: publicAccount(account) }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, await startSession(account.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
    return response;
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create your account." }, { status: 409 }); }
}
