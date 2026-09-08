import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { publicCustomer, requireCustomer } from "@/lib/customer-social";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const current = await getCurrentAccount();
  try {
    const prisma = await requireCustomer(current);
    const { username } = await params;
    const user = await prisma.user.findFirst({
      where: {
        username: username.replace(/^@/, "").toLowerCase(),
        status: "ACTIVE",
        roles: { some: { role: "CUSTOMER" } },
      },
      include: { privacy: true },
    });
    if (!user) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    const blocked = await prisma.block.findFirst({ where: { OR: [{ blockerId: current!.id, blockedId: user.id }, { blockerId: user.id, blockedId: current!.id }] } });
    if (blocked) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    if (!user.privacy?.discoverable || user.privacy.profileVisibility === "PRIVATE") return NextResponse.json({ error: "This profile is not public." }, { status: 403 });

    const [friendship, sentRequest, receivedRequest, following, followerCount, followingCount, reviewCount, postCount] = await Promise.all([
      prisma.friendship.findFirst({ where: { OR: [{ userAId: current!.id, userBId: user.id }, { userAId: user.id, userBId: current!.id }] } }),
      prisma.friendRequest.findFirst({ where: { senderId: current!.id, receiverId: user.id, status: "PENDING" } }),
      prisma.friendRequest.findFirst({ where: { senderId: user.id, receiverId: current!.id, status: "PENDING" } }),
      prisma.userFollow.findFirst({ where: { followerId: current!.id, followedId: user.id } }),
      prisma.userFollow.count({ where: { followedId: user.id } }),
      prisma.userFollow.count({ where: { followerId: user.id } }),
      prisma.review.count({ where: { userId: user.id } }),
      prisma.post.count({ where: { authorId: user.id } }),
    ]);

    const result: Record<string, unknown> = {
      customer: publicCustomer(user),
      relationship: friendship ? "FRIENDS" : sentRequest ? "REQUEST_SENT" : receivedRequest ? "REQUEST_RECEIVED" : "NONE",
      following: Boolean(following),
      counts: { followers: followerCount, following: followingCount, reviews: reviewCount, posts: postCount },
    };

    if (user.privacy.showActivity && user.privacy.profileVisibility !== "PRIVATE") {
      const [reviews, posts] = await Promise.all([
        prisma.review.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, rating: true, body: true, createdAt: true, restaurant: { select: { id: true, name: true, slug: true } } } }),
        prisma.post.findMany({ where: { authorId: user.id }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, caption: true, createdAt: true, media: { take: 1, select: { url: true, alt: true } }, restaurant: { select: { id: true, name: true } } } }),
      ]);
      result.activity = { reviews, posts };
    }

    return NextResponse.json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "AUTH_REQUIRED" ? 401 : code === "CUSTOMER_ONLY" ? 403 : 503;
    return NextResponse.json({ error: "Unable to load this customer profile." }, { status });
  }
}
