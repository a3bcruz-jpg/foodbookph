import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { requireCustomer } from "@/lib/customer-social";

export async function GET() {
  const current = await getCurrentAccount();
  try {
    const prisma = await requireCustomer(current);
    const privacy = await prisma.userPrivacy.upsert({ where: { userId: current!.id }, create: { userId: current!.id }, update: {} });
    return NextResponse.json({ privacy });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    return NextResponse.json({ error: "Unable to load privacy settings." }, { status: code === "AUTH_REQUIRED" ? 401 : code === "CUSTOMER_ONLY" ? 403 : 503 });
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentAccount();
  try {
    const prisma = await requireCustomer(current);
    const body = await request.json() as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if (["PUBLIC", "CONNECTIONS", "PRIVATE"].includes(String(body.profileVisibility))) data.profileVisibility = body.profileVisibility;
    for (const key of ["discoverable", "showActivity", "allowFriendRequests", "allowFollows"]) {
      if (typeof body[key] === "boolean") data[key] = body[key];
    }
    const privacy = await prisma.userPrivacy.upsert({ where: { userId: current!.id }, create: { userId: current!.id, ...data }, update: data });
    return NextResponse.json({ privacy });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    return NextResponse.json({ error: "Unable to save privacy settings." }, { status: code === "AUTH_REQUIRED" ? 401 : code === "CUSTOMER_ONLY" ? 403 : 500 });
  }
}
