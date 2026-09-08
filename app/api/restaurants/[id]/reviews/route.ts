import { NextResponse } from "next/server";
import { createReview, getRestaurant, listReviews, SERVICE_RATING_FIELDS, type ServiceRatingsInput } from "@/lib/content-repository";
import { getCurrentAccount } from "@/lib/session";
import { isCustomerAccount } from "@/lib/account-role";

function parseServiceRatings(value: unknown): ServiceRatingsInput | null {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const ratings: ServiceRatingsInput = {};
  for (const field of SERVICE_RATING_FIELDS) {
    const raw = source[field];
    const rating = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
    ratings[field] = rating;
  }
  return ratings;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!(await getRestaurant(id))) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  return NextResponse.json({ reviews: await listReviews(id) });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isCustomerAccount(account.roles)) return NextResponse.json({ error: "Only customer accounts can post restaurant reviews." }, { status: 403 });
  const { id } = await context.params;
  if (!(await getRestaurant(id))) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  const body = await request.json() as Record<string, unknown>;
  const rating = typeof body.rating === "number" ? body.rating : Number(body.rating);
  const reviewBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || reviewBody.length < 10 || reviewBody.length > 2000) {
    return NextResponse.json({ error: "Rating must be 1-5 and review text must be 10-2000 characters." }, { status: 400 });
  }
  const serviceRatings = parseServiceRatings(body.serviceRatings);
  if (serviceRatings === null) return NextResponse.json({ error: "Each service rating must be between 1 and 5." }, { status: 400 });
  try {
    return NextResponse.json({ review: await createReview({ userId: account.id, restaurantId: id, rating, body: reviewBody, serviceRatings: Object.keys(serviceRatings).length ? serviceRatings : undefined }) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create review." }, { status: 409 });
  }
}
