import { NextResponse } from "next/server";
import { publicAccount } from "@/lib/account-store";
import { updatePersistentAccount } from "@/lib/account-repository";
import { getCurrentAccount } from "@/lib/session";

export async function GET() {
  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  return NextResponse.json({ account: current });
}

export async function PATCH(request: Request) {
  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const account = await updatePersistentAccount(current.id, { username: typeof body.username === "string" ? body.username : undefined, displayName: typeof body.displayName === "string" ? body.displayName : undefined, bio: typeof body.bio === "string" ? body.bio : undefined, avatar: typeof body.avatar === "string" ? body.avatar : undefined });
    return NextResponse.json({ account: account ? publicAccount(account) : null });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update your profile." }, { status: 409 }); }
}
