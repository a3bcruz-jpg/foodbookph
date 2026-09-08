import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { publicCustomer, requireCustomer } from "@/lib/customer-social";

export async function GET(request: Request) {
  const current = await getCurrentAccount();
  try {
    const prisma = await requireCustomer(current);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const take = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 24), 1), 50);

    const users = await prisma.user.findMany({
      where: {
        id: { not: current!.id },
        status: "ACTIVE",
        roles: { some: { role: "CUSTOMER" } },
        privacy: { is: { discoverable: true, profileVisibility: { not: "PRIVATE" } } },
        ...(q ? { OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { username: { contains: q.replace(/^@/, ""), mode: "insensitive" } },
        ] } : {}),
        NOT: [
          { blocksGiven: { some: { blockedId: current!.id } } },
          { blocksReceived: { some: { blockerId: current!.id } } },
        ],
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
      orderBy: [{ displayName: "asc" }],
      take,
    });

    const ids = users.map((user) => user.id);
    const [requests, friendships, follows] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { OR: [{ senderId: current!.id, receiverId: { in: ids } }, { receiverId: current!.id, senderId: { in: ids } }] },
        select: { id: true, senderId: true, receiverId: true, status: true },
      }),
      prisma.friendship.findMany({
        where: { OR: [{ userAId: current!.id, userBId: { in: ids } }, { userBId: current!.id, userAId: { in: ids } }] },
        select: { userAId: true, userBId: true },
      }),
      prisma.userFollow.findMany({ where: { followerId: current!.id, followedId: { in: ids } }, select: { followedId: true } }),
    ]);

    return NextResponse.json({
      customers: users.map((user) => {
        const request = requests.find((item) => item.senderId === user.id || item.receiverId === user.id);
        const friends = friendships.some((item) => item.userAId === user.id || item.userBId === user.id);
        return {
          ...publicCustomer(user),
          relationship: friends ? "FRIENDS" : request?.status === "PENDING" ? (request.senderId === current!.id ? "REQUEST_SENT" : "REQUEST_RECEIVED") : "NONE",
          following: follows.some((item) => item.followedId === user.id),
        };
      }),
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "AUTH_REQUIRED" ? 401 : code === "CUSTOMER_ONLY" ? 403 : 503;
    return NextResponse.json({ error: code === "DATABASE_REQUIRED" ? "Customer discovery is temporarily unavailable." : "Unable to load customers." }, { status });
  }
}
