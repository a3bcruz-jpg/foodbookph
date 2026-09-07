import { getPrisma } from "@/lib/prisma";
import { addLocalReview, createLocalPost, key, localFollows, localLikes, localPost, localRestaurant, localRestaurants, localReviewList, localPosts, localSaves, toggleSet } from "@/lib/content-store";

export async function listRestaurants(query = "") {
  const prisma = getPrisma();
  if (!prisma) return localRestaurants.filter((item) => `${item.name} ${item.cuisine} ${item.location}`.toLowerCase().includes(query.toLowerCase()));
  const rows = await prisma.restaurant.findMany({ where: query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { city: { contains: query, mode: "insensitive" } }, { cuisine: { contains: query, mode: "insensitive" } }] } : undefined, orderBy: { name: "asc" }, include: { _count: { select: { reviews: true } } } });
  return rows.map((restaurant) => ({ id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine, location: `${restaurant.address}, ${restaurant.city}`, rating: 0, reviews: restaurant._count.reviews, image: "", accent: "#e6f0d8", price: "₱₱", tags: [], claimed: restaurant.isClaimed }));
}

export async function getRestaurant(id: string) {
  const prisma = getPrisma();
  if (!prisma) return localRestaurant(id);
  return prisma.restaurant.findUnique({ where: { id }, include: { _count: { select: { reviews: true } } } });
}

export async function createRestaurant(input: { name: string; cuisine: string; address: string; city: string; slug: string }) {
  const prisma = getPrisma();
  if (!prisma) return { id: `r_${Date.now()}`, ...input, isClaimed: false };
  return prisma.restaurant.create({ data: input });
}

export async function updateRestaurant(id: string, input: { name?: string; description?: string; cuisine?: string; address?: string; city?: string; isClaimed?: boolean }) {
  const prisma = getPrisma();
  if (!prisma) return localRestaurant(id);
  return prisma.restaurant.update({ where: { id }, data: input });
}

export async function listPosts(userId?: string) {
  const prisma = getPrisma();
  if (!prisma) return localPosts.map((post) => ({ ...post, liked: userId ? false : post.liked, saved: userId ? false : post.saved }));
  const rows = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: true,
      restaurant: true,
      media: { take: 1 },
      _count: { select: { likes: true, comments: true } },
      ...(userId
        ? {
            likes: { where: { userId }, select: { id: true } },
            saves: { where: { userId }, select: { id: true } },
          }
        : {}),
    },
  });
  return rows.map((post) => ({ id: post.id, author: post.author?.displayName ?? "FoodBook member", handle: post.author ? `@${post.author.username}` : "@foodbookph", avatar: post.author?.displayName.slice(0, 2).toUpperCase() ?? "FB", time: post.createdAt.toISOString(), caption: post.caption, image: post.media[0]?.url ?? "", place: post.restaurant ? `${post.restaurant.name} · ${post.restaurant.city}` : "Your food diary", likes: post._count.likes, comments: post._count.comments, liked: "likes" in post && post.likes.length > 0, saved: "saves" in post && post.saves.length > 0 }));
}

export async function getPost(id: string) { const prisma = getPrisma(); return prisma ? prisma.post.findUnique({ where: { id }, include: { media: true, author: true, restaurant: true } }) : localPost(id); }
export async function createPost(input: { authorId: string; caption: string; image?: string; restaurantId?: string }) { const prisma = getPrisma(); if (!prisma) return createLocalPost({ authorId: input.authorId, caption: input.caption, image: input.image ?? "", restaurantId: input.restaurantId }); return prisma.post.create({ data: { authorId: input.authorId, caption: input.caption, restaurantId: input.restaurantId, media: input.image ? { create: { url: input.image } } : undefined }, include: { media: true } }); }
export async function updatePost(id: string, authorId: string, caption: string) { const prisma = getPrisma(); if (!prisma) { const post = localPost(id); return post && post.author === authorId ? { ...post, caption } : null; } return prisma.post.updateMany({ where: { id, authorId }, data: { caption } }); }
export async function deletePost(id: string, authorId: string) { const prisma = getPrisma(); if (!prisma) return Boolean(localPost(id)); const result = await prisma.post.deleteMany({ where: { id, authorId } }); return result.count > 0; }

export async function setFollow(userId: string, restaurantId: string, enabled: boolean) { const prisma = getPrisma(); if (!prisma) return toggleSet(localFollows, key(userId, restaurantId), enabled); if (enabled) { await prisma.follow.upsert({ where: { userId_restaurantId: { userId, restaurantId } }, update: {}, create: { userId, restaurantId } }); } else await prisma.follow.deleteMany({ where: { userId, restaurantId } }); return enabled; }
export async function setLike(userId: string, postId: string, enabled: boolean) { const prisma = getPrisma(); if (!prisma) return toggleSet(localLikes, key(userId, postId), enabled); if (enabled) await prisma.like.upsert({ where: { userId_postId: { userId, postId } }, update: {}, create: { userId, postId } }); else await prisma.like.deleteMany({ where: { userId, postId } }); return enabled; }
export async function setSave(userId: string, postId: string, enabled: boolean) { const prisma = getPrisma(); if (!prisma) return toggleSet(localSaves, key(userId, postId), enabled); if (enabled) await prisma.savedPost.upsert({ where: { userId_postId: { userId, postId } }, update: {}, create: { userId, postId } }); else await prisma.savedPost.deleteMany({ where: { userId, postId } }); return enabled; }

export async function listReviews(restaurantId: string) { const prisma = getPrisma(); return prisma ? prisma.review.findMany({ where: { restaurantId }, orderBy: { createdAt: "desc" }, include: { user: { select: { displayName: true, username: true, avatarUrl: true } } } }) : localReviewList(restaurantId); }
export async function createReview(input: { userId: string; restaurantId: string; rating: number; body: string }) { const prisma = getPrisma(); if (!prisma) return addLocalReview(input.restaurantId, input.userId, input.rating, input.body); return prisma.review.create({ data: input, include: { user: { select: { displayName: true, username: true } } } }); }
