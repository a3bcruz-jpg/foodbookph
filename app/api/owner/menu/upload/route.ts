import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const isAdmin = account.roles.includes("ADMIN");
  const isOwner = account.roles.includes("RESTAURANT_OWNER");
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) as { restaurantId?: string } : {};
        const restaurantId = typeof payload.restaurantId === "string" ? payload.restaurantId.trim() : "";
        if (!restaurantId) throw new Error("Restaurant is required.");

        const prisma = getPrisma();
        if (!prisma) throw new Error("Database unavailable.");

        const restaurant = await prisma.restaurant.findFirst({
          where: {
            id: restaurantId,
            ...(isAdmin ? {} : {
              memberships: {
                some: { userId: account.id, role: { in: ["OWNER", "MANAGER"] } },
              },
            }),
          },
          select: { id: true },
        });
        if (!restaurant) throw new Error("Restaurant not found or not managed by you.");

        if (!pathname.startsWith(`restaurants/${restaurantId}/menu/`)) {
          throw new Error("Invalid upload path.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ accountId: account.id, restaurantId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.info("FoodBookPH menu image uploaded", {
          pathname: blob.pathname,
          accountId: JSON.parse(tokenPayload).accountId,
        });
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
