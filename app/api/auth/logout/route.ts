import { NextResponse } from "next/server";
import { endSession } from "@/lib/account-repository";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const token = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.split("=")[1];
  if (token) await endSession(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" });
  return response;
}
