import { NextResponse } from "next/server";
import { respondToReview } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const responseBody = typeof body.body === "string" ? body.body.trim() : "";
  if (responseBody.length < 2 || responseBody.length > 2000) return NextResponse.json({ error: "Response must be between 2 and 2000 characters." }, { status: 400 });
  const { id } = await context.params;
  const response = await respondToReview(account.id, id, responseBody);
  return response ? NextResponse.json({ response }) : NextResponse.json({ error: "Review not found or not managed by you." }, { status: 404 });
}
