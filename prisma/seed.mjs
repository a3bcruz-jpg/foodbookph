import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const passwordHash = (password) => { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; };
const restaurants = [
  { id: "r1", name: "Kubo Sa Bahay", slug: "kubo-sa-bahay", cuisine: "Filipino · Modern", address: "Poblacion", city: "Makati", isClaimed: true },
  { id: "r2", name: "Sari Sari Supper Club", slug: "sari-sari-supper-club", cuisine: "Filipino · Asian", address: "Kapitolyo", city: "Pasig", isClaimed: true },
  { id: "r3", name: "Lola Nena's", slug: "lola-nenas", cuisine: "Bakery · Filipino", address: "Ortigas Avenue Extension", city: "San Juan", isClaimed: false },
  { id: "r4", name: "Al Dente Manila", slug: "al-dente-manila", cuisine: "Italian", address: "New Manila", city: "Quezon City", isClaimed: true },
];
const posts = [
  { id: "p1", caption: "The kind of lunch that makes you text your friends immediately. Kubo's grilled liempo is unreal.", restaurantId: "r1" },
  { id: "p2", caption: "Found a tiny bakery in San Juan with the best cheese rolls. No gatekeeping today.", restaurantId: "r3" },
];
async function main() {
  const user = await prisma.user.upsert({ where: { email: "seed@foodbook.ph" }, update: {}, create: { id: "u_seed", email: "seed@foodbook.ph", username: "foodbookseed", displayName: "FoodBookPH", passwordHash: passwordHash("SeedPass1"), roles: { create: { role: "CUSTOMER" } } } });
  for (const restaurant of restaurants) await prisma.restaurant.upsert({ where: { id: restaurant.id }, update: restaurant, create: restaurant });
  for (const post of posts) await prisma.post.upsert({ where: { id: post.id }, update: post, create: { ...post, authorId: user.id, media: { create: { url: post.id === "p1" ? "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85" : "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85" } } } });
  console.log(`Seeded ${restaurants.length} restaurants and ${posts.length} posts.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
