import { NextResponse } from "next/server";
import { publicAccount } from "@/lib/account-store";
import { loginAccount, startSession } from "@/lib/account-repository";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const requestedRole = typeof body.role === "string" ? body.role.trim().toUpperCase() : "";
  if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  if (requestedRole && requestedRole !== "CUSTOMER" && requestedRole !== "RESTAURANT_OWNER") return NextResponse.json({ error: "Choose Customer or Restaurant Owner." }, { status: 400 });
  const account = await loginAccount(email, password);
  if (!account) return NextResponse.json({ error: "We could not sign you in with those details." }, { status: 401 });
  if (requestedRole === "RESTAURANT_OWNER" && !account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return NextResponse.json({ error: "This account is not registered as a Restaurant Owner." }, { status: 403 });
  if (requestedRole === "CUSTOMER" && !account.roles.includes("ADMIN") && (!account.roles.includes("CUSTOMER") || account.roles.includes("RESTAURANT_OWNER"))) return NextResponse.json({ error: "This account is not registered as a Customer." }, { status: 403 });
  const response = NextResponse.json({ account: publicAccount(account) });
  response.cookies.set(SESSION_COOKIE, await startSession(account.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return response;
}
