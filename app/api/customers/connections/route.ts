import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { orderedPair, publicCustomer, requireCustomer } from "@/lib/customer-social";

const customerSelect = { id: true, username: true, displayName: true, avatarUrl: true, bio: true } as const;

export async function GET() {
  const current = await getCurrentAccount();
  try {
    const prisma = await requireCustomer(current);
    const [incoming, outgoing, friendships, follows, blocks] = await Promise.all([
      prisma.friendRequest.findMany({ where: { receiverId: current!.id, status: "PENDING" }, orderBy: { createdAt: "desc" }, include: { sender: { select: customerSelect } } }),
      prisma.friendRequest.findMany({ where: { senderId: current!.id, status: "PENDING" }, orderBy: { createdAt: "desc" }, include: { receiver: { select: customerSelect } } }),
      prisma.friendship.findMany({ where: { OR: [{ userAId: current!.id }, { userBId: current!.id }] }, orderBy: { createdAt: "desc" }, include: { userA: { select: customerSelect }, userB: { select: customerSelect } } }),
      prisma.userFollow.findMany({ where: { followerId: current!.id }, orderBy: { createdAt: "desc" }, include: { followed: { select: customerSelect } } }),
      prisma.block.findMany({ where: { blockerId: current!.id }, orderBy: { createdAt: "desc" }, include: { blocked: { select: customerSelect } } }),
    ]);
    return NextResponse.json({
      incoming: incoming.map((request) => ({ id: request.id, createdAt: request.createdAt, customer: publicCustomer(request.sender) })),
      outgoing: outgoing.map((request) => ({ id: request.id, createdAt: request.createdAt, customer: publicCustomer(request.receiver) })),
      friends: friendships.map((friendship) => publicCustomer(friendship.userAId === current!.id ? friendship.userB : friendship.userA)),
      following: follows.map((follow) => publicCustomer(follow.followed)),
      blocked: blocks.map((block) => publicCustomer(block.blocked)),
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    return NextResponse.json({ error: code === "CUSTOMER_ONLY" ? "This area is for customer accounts." : "Unable to load connections." }, { status: code === "AUTH_REQUIRED" ? 401 : code === "CUSTOMER_ONLY" ? 403 : 503 });
  }
}

export async function POST(request: Request) {
  const current = await getCurrentAccount();
  try {
    const prisma = await requireCustomer(current);
    const body = await request.json() as { action?: string; targetUserId?: string; requestId?: string };
    const action = body.action;
    const targetUserId = body.targetUserId?.trim();
    if (!action) return NextResponse.json({ error: "Action is required." }, { status: 400 });
    if (["friend-request", "follow", "block"].includes(action) && (!targetUserId || targetUserId === current!.id)) return NextResponse.json({ error: "A valid customer is required." }, { status: 400 });

    if (action === "friend-request") {
      const target = await prisma.user.findFirst({ where: { id: targetUserId, status: "ACTIVE", roles: { some: { role: "CUSTOMER" } }, privacy: { is: { allowFriendRequests: true, discoverable: true } } }, select: { id: true, displayName: true } });
      if (!target) return NextResponse.json({ error: "This customer is not accepting friend requests." }, { status: 403 });
      const blocked = await prisma.block.findFirst({ where: { OR: [{ blockerId: current!.id, blockedId: target.id }, { blockerId: target.id, blockedId: current!.id }] } });
      if (blocked) return NextResponse.json({ error: "This connection is unavailable." }, { status: 403 });
      const existingFriend = await prisma.friendship.findFirst({ where: { OR: [{ userAId: current!.id, userBId: target.id }, { userAId: target.id, userBId: current!.id }] } });
      if (existingFriend) return NextResponse.json({ error: "You are already connected." }, { status: 409 });
      const reverse = await prisma.friendRequest.findUnique({ where: { senderId_receiverId: { senderId: target.id, receiverId: current!.id } } });
      if (reverse?.status === "PENDING") return NextResponse.json({ error: "This customer already sent you a request. Open Requests to accept it." }, { status: 409 });
      const existing = await prisma.friendRequest.findUnique({ where: { senderId_receiverId: { senderId: current!.id, receiverId: target.id } } });
      const friendRequest = existing ? await prisma.friendRequest.update({ where: { id: existing.id }, data: { status: "PENDING" } }) : await prisma.friendRequest.create({ data: { senderId: current!.id, receiverId: target.id } });
      await prisma.notification.create({ data: { userId: target.id, type: "FRIEND_REQUEST", message: `${current!.displayName} sent you a friend request.` } });
      return NextResponse.json({ ok: true, requestId: friendRequest.id });
    }

    if (action === "accept" || action === "decline") {
      if (!body.requestId) return NextResponse.json({ error: "Request id is required." }, { status: 400 });
      const requestRow = await prisma.friendRequest.findFirst({ where: { id: body.requestId, receiverId: current!.id, status: "PENDING" } });
      if (!requestRow) return NextResponse.json({ error: "Friend request not found." }, { status: 404 });
      if (action === "decline") { await prisma.friendRequest.update({ where: { id: requestRow.id }, data: { status: "DECLINED" } }); return NextResponse.json({ ok: true }); }
      const [userAId, userBId] = orderedPair(requestRow.senderId, requestRow.receiverId);
      await prisma.$transaction([
        prisma.friendRequest.update({ where: { id: requestRow.id }, data: { status: "ACCEPTED" } }),
        prisma.friendship.upsert({ where: { userAId_userBId: { userAId, userBId } }, create: { userAId, userBId }, update: {} }),
        prisma.notification.create({ data: { userId: requestRow.senderId, type: "FRIEND_ACCEPTED", message: `${current!.displayName} accepted your friend request.` } }),
      ]);
      return NextResponse.json({ ok: true });
    }

    if (action === "cancel-request") {
      if (!body.requestId) return NextResponse.json({ error: "Request id is required." }, { status: 400 });
      const requestRow = await prisma.friendRequest.findFirst({ where: { id: body.requestId, senderId: current!.id, status: "PENDING" } });
      if (!requestRow) return NextResponse.json({ error: "Friend request not found." }, { status: 404 });
      await prisma.friendRequest.update({ where: { id: requestRow.id }, data: { status: "CANCELED" } });
      return NextResponse.json({ ok: true });
    }

    if (action === "remove-friend") {
      if (!targetUserId) return NextResponse.json({ error: "Customer id is required." }, { status: 400 });
      await prisma.friendship.deleteMany({ where: { OR: [{ userAId: current!.id, userBId: targetUserId }, { userAId: targetUserId, userBId: current!.id }] } });
      return NextResponse.json({ ok: true });
    }

    if (action === "follow" || action === "unfollow") {
      const target = await prisma.user.findFirst({ where: { id: targetUserId, status: "ACTIVE", roles: { some: { role: "CUSTOMER" } } }, include: { privacy: true } });
      if (!target) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
      if (action === "follow") {
        if (!target.privacy?.allowFollows || !target.privacy.discoverable) return NextResponse.json({ error: "This customer does not accept follows." }, { status: 403 });
        const blocked = await prisma.block.findFirst({ where: { OR: [{ blockerId: current!.id, blockedId: target.id }, { blockerId: target.id, blockedId: current!.id }] } });
        if (blocked) return NextResponse.json({ error: "This connection is unavailable." }, { status: 403 });
        await prisma.$transaction([
          prisma.userFollow.upsert({ where: { followerId_followedId: { followerId: current!.id, followedId: target.id } }, create: { followerId: current!.id, followedId: target.id }, update: {} }),
          prisma.notification.create({ data: { userId: target.id, type: "CUSTOMER_FOLLOW", message: `${current!.displayName} started following you.` } }),
        ]);
      } else await prisma.userFollow.deleteMany({ where: { followerId: current!.id, followedId: target.id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "block") {
      const target = await prisma.user.findFirst({ where: { id: targetUserId, roles: { some: { role: "CUSTOMER" } } }, select: { id: true } });
      if (!target) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
      await prisma.$transaction([
        prisma.block.upsert({ where: { blockerId_blockedId: { blockerId: current!.id, blockedId: target.id } }, create: { blockerId: current!.id, blockedId: target.id }, update: {} }),
        prisma.userFollow.deleteMany({ where: { OR: [{ followerId: current!.id, followedId: target.id }, { followerId: target.id, followedId: current!.id }] } }),
        prisma.friendship.deleteMany({ where: { OR: [{ userAId: current!.id, userBId: target.id }, { userAId: target.id, userBId: current!.id }] } }),
        prisma.friendRequest.deleteMany({ where: { OR: [{ senderId: current!.id, receiverId: target.id }, { senderId: target.id, receiverId: current!.id }] } }),
      ]);
      return NextResponse.json({ ok: true });
    }

    if (action === "unblock") {
      if (!targetUserId) return NextResponse.json({ error: "Customer id is required." }, { status: 400 });
      await prisma.block.deleteMany({ where: { blockerId: current!.id, blockedId: targetUserId } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    return NextResponse.json({ error: code === "AUTH_REQUIRED" ? "You must be signed in." : code === "CUSTOMER_ONLY" ? "This area is for customer accounts." : "Unable to update the connection." }, { status: code === "AUTH_REQUIRED" ? 401 : code === "CUSTOMER_ONLY" ? 403 : 500 });
  }
}
