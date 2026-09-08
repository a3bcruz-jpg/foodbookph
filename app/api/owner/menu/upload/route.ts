import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Restaurant owner access required." }, { status: 403 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) as { restaurantId?: string } : {};
        const restaurantId = typeof payload.restaurantId === "string" ? payload.restaurantId : "";
        if (!restaurantId) throw new Error("Restaurant is required.");

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ accountId: account.id, restaurantId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // The returned blob URL is persisted to MenuItem.imageUrl by the existing item API.
        // Keeping persistence in the normal menu-item mutation avoids orphaning database records
        // when an owner uploads an image but closes the form before saving the item.
        console.info("FoodBookPH menu image uploaded", {
          pathname: blob.pathname,
          accountId: JSON.parse(tokenPayload).accountId,
        });
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
