import { getPrisma } from "@/lib/prisma";

type OwnerRestaurantInput = {
  name: string;
  description?: string;
  cuisine: string;
  address: string;
  city: string;
  phone?: string;
  website?: string;
};

function restaurantSlug(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
}

export async function getOwnerDashboard(userId: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const membership = await prisma.restaurantMembership.findFirst({
    where: { userId, role: { in: ["OWNER", "MANAGER"] } },
    orderBy: { id: "asc" },
    include: {
      restaurant: {
        include: {
          _count: { select: { reviews: true, follows: true, posts: true } },
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 6,
            include: { user: { select: { displayName: true } }, response: true },
          },
          posts: { orderBy: { createdAt: "desc" }, take: 4, include: { media: { take: 1 } } },
          photos: { orderBy: { id: "asc" }, take: 12 },
        },
      },
    },
  });
  if (!membership) return null;
  const restaurant = membership.restaurant;
  const averageRating = restaurant.reviews.length
    ? restaurant.reviews.reduce((total, review) => total + review.rating, 0) / restaurant.reviews.length
    : 0;
  return {
    restaurant: {
      ...restaurant,
      averageRating,
      reviews: restaurant.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        body: review.body,
        createdAt: review.createdAt.toISOString(),
        reviewer: review.user.displayName,
        response: review.response ? { body: review.response.body } : null,
      })),
      posts: restaurant.posts.map((post) => ({ id: post.id, caption: post.caption, createdAt: post.createdAt.toISOString(), image: post.media[0]?.url ?? "" })),
      photos: restaurant.photos.map((photo) => ({ id: photo.id, url: photo.url, alt: photo.alt ?? restaurant.name })),
    },
    membershipRole: membership.role,
  };
}

export async function createOwnedRestaurant(userId: string, input: OwnerRestaurantInput) {
  const prisma = getPrisma();
  if (!prisma) return null;
  return prisma.$transaction(async (transaction) => {
    const existingMembership = await transaction.restaurantMembership.findFirst({
      where: { userId, role: "OWNER" },
      select: { restaurantId: true },
    });
    if (existingMembership) throw new Error("You already have a restaurant connected to this account.");
    const restaurant = await transaction.restaurant.create({
      data: {
        name: input.name,
        slug: restaurantSlug(input.name),
        description: input.description,
        cuisine: input.cuisine,
        address: input.address,
        city: input.city,
        phone: input.phone,
        website: input.website,
        isClaimed: true,
      },
    });
    await transaction.restaurantMembership.create({ data: { restaurantId: restaurant.id, userId, role: "OWNER" } });
    return restaurant;
  });
}

export async function updateOwnedRestaurant(userId: string, restaurantId: string, input: OwnerRestaurantInput) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const membership = await prisma.restaurantMembership.findFirst({ where: { userId, restaurantId, role: { in: ["OWNER", "MANAGER"] } } });
  if (!membership) return null;
  return prisma.restaurant.update({ where: { id: restaurantId }, data: input });
}

export async function submitRestaurantClaim(userId: string, restaurantId: string, proofNote: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { id: true } });
  if (!restaurant) return null;
  return prisma.restaurantClaim.upsert({
    where: { id: `${userId}:${restaurantId}` },
    update: { proofNote, status: "PENDING", reviewedAt: null },
    create: { id: `${userId}:${restaurantId}`, userId, restaurantId, proofNote, status: "PENDING" },
  });
}

export async function respondToReview(userId: string, reviewId: string, body: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const review = await prisma.review.findFirst({
    where: { id: reviewId, restaurant: { memberships: { some: { userId, role: { in: ["OWNER", "MANAGER"] } } } } },
    select: { id: true },
  });
  if (!review) return null;
  return prisma.reviewResponse.upsert({ where: { reviewId }, update: { body }, create: { reviewId, ownerId: userId, body } });
}

async function ownedRestaurant(userId: string, restaurantId?: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  return prisma.restaurant.findFirst({ where: { ...(restaurantId ? { id: restaurantId } : {}), memberships: { some: { userId, role: { in: ["OWNER", "MANAGER"] } } } }, select: { id: true } });
}

export async function getOwnerMenu(userId: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const restaurant = await ownedRestaurant(userId);
  if (!restaurant) return null;
  const categories = await prisma.menu.findMany({ where: { restaurantId: restaurant.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } } });
  return { restaurantId: restaurant.id, categories: categories.map((category) => ({ ...category, items: category.items.map((item) => ({ ...item, price: item.price === null ? null : Number(item.price) })) })) };
}

export async function createMenuCategory(userId: string, input: { restaurantId: string; name: string; description?: string; sortOrder?: number }) {
  const prisma = getPrisma();
  if (!prisma || !(await ownedRestaurant(userId, input.restaurantId))) return null;
  return prisma.menu.create({ data: { restaurantId: input.restaurantId, name: input.name, description: input.description, sortOrder: input.sortOrder ?? 0 } });
}

export async function updateMenuCategory(userId: string, categoryId: string, input: { name: string; description?: string; sortOrder?: number }) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const category = await prisma.menu.findFirst({ where: { id: categoryId, restaurant: { memberships: { some: { userId, role: { in: ["OWNER", "MANAGER"] } } } } } });
  if (!category) return null;
  return prisma.menu.update({ where: { id: categoryId }, data: input });
}

export async function deleteMenuCategory(userId: string, categoryId: string) {
  const prisma = getPrisma();
  if (!prisma) return { deleted: false, hasItems: false };
  const category = await prisma.menu.findFirst({ where: { id: categoryId, restaurant: { memberships: { some: { userId, role: { in: ["OWNER", "MANAGER"] } } } } }, select: { id: true, _count: { select: { items: true } } } });
  if (!category) return { deleted: false, hasItems: false };
  if (category._count.items > 0) return { deleted: false, hasItems: true };
  await prisma.menu.delete({ where: { id: categoryId } });
  return { deleted: true, hasItems: false };
}

export async function createMenuItem(userId: string, input: { restaurantId: string; categoryId: string; name: string; description?: string; price: number; imageUrl?: string; isAvailable?: boolean; sortOrder?: number }) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const category = await prisma.menu.findFirst({ where: { id: input.categoryId, restaurantId: input.restaurantId, restaurant: { memberships: { some: { userId, role: { in: ["OWNER", "MANAGER"] } } } } }, select: { id: true } });
  if (!category) return null;
  return prisma.menuItem.create({ data: { restaurantId: input.restaurantId, menuId: input.categoryId, name: input.name, description: input.description, price: input.price, imageUrl: input.imageUrl, isAvailable: input.isAvailable ?? true, sortOrder: input.sortOrder ?? 0 } });
}

export async function updateMenuItem(userId: string, itemId: string, input: { categoryId: string; name: string; description?: string; price: number; imageUrl?: string; isAvailable?: boolean; sortOrder?: number }) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurant: { memberships: { some: { userId, role: { in: ["OWNER", "MANAGER"] } } } } }, select: { restaurantId: true } });
  if (!item) return null;
  const category = await prisma.menu.findFirst({ where: { id: input.categoryId, restaurantId: item.restaurantId }, select: { id: true } });
  if (!category) return null;
  return prisma.menuItem.update({ where: { id: itemId }, data: { menuId: input.categoryId, name: input.name, description: input.description, price: input.price, imageUrl: input.imageUrl, isAvailable: input.isAvailable, sortOrder: input.sortOrder } });
}

export async function deleteMenuItem(userId: string, itemId: string) {
  const prisma = getPrisma();
  if (!prisma) return false;
  const result = await prisma.menuItem.deleteMany({ where: { id: itemId, restaurant: { memberships: { some: { userId, role: { in: ["OWNER", "MANAGER"] } } } } } });
  return result.count > 0;
}

export async function getOwnerPosts(userId: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const restaurant = await ownedRestaurant(userId);
  if (!restaurant) return null;
  const posts = await prisma.post.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { media: { take: 1 } },
  });
  return posts.map((post) => ({ id: post.id, caption: post.caption, createdAt: post.createdAt.toISOString(), image: post.media[0]?.url ?? "" }));
}

export async function createOwnerPost(userId: string, input: { restaurantId: string; caption: string; image?: string }) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const restaurant = await ownedRestaurant(userId, input.restaurantId);
  if (!restaurant) return null;
  return prisma.post.create({
    data: {
      authorId: userId,
      restaurantId: restaurant.id,
      caption: input.caption,
      media: input.image ? { create: { url: input.image } } : undefined,
    },
    include: { media: { take: 1 } },
  });
}

export async function updateOwnerPost(userId: string, postId: string, caption: string, image: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const post = await prisma.post.findFirst({
    where: { id: postId, restaurant: { memberships: { some: { userId, role: { in: ["OWNER", "MANAGER"] } } } } },
    select: { id: true },
  });
  if (!post) return null;
  return prisma.$transaction(async (transaction) => {
    await transaction.postMedia.deleteMany({ where: { postId } });
    return transaction.post.update({
      where: { id: postId },
      data: { caption, media: image ? { create: { url: image } } : undefined },
      include: { media: { take: 1 } },
    });
  });
}

export async function deleteOwnerPost(userId: string, postId: string) {
  const prisma = getPrisma();
  if (!prisma) return false;
  const result = await prisma.post.deleteMany({ where: { id: postId, restaurant: { memberships: { some: { userId, role: { in: ["OWNER", "MANAGER"] } } } } } });
  return result.count > 0;
}
