import { NextResponse } from "next/server";
import { updatePersistentPassword } from "@/lib/account-repository";
import { getCurrentAccount } from "@/lib/session";

export async function PATCH(request: Request) {
  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const nextPassword = typeof body.nextPassword === "string" ? body.nextPassword : "";
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(nextPassword)) return NextResponse.json({ error: "New password must be at least 8 characters with upper, lower, and a number." }, { status: 400 });
  if (!(await updatePersistentPassword(current.id, currentPassword, nextPassword))) return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
