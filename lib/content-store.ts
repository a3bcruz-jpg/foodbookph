import { randomBytes } from "node:crypto";
import { posts as seedPosts, restaurants as seedRestaurants } from "@/lib/data";
import type { Post, Restaurant } from "@/lib/data";

type ContentStore = { posts: Post[]; follows: Set<string>; likes: Set<string>; saves: Set<string>; reviews: Map<string, { id: string; userId: string; restaurantId: string; rating: number; body: string; createdAt: string }[]> };
const globalStore = globalThis as typeof globalThis & { __foodbookContentStore?: ContentStore };
const store = globalStore.__foodbookContentStore ?? { posts: [...seedPosts], follows: new Set<string>(), likes: new Set<string>(), saves: new Set<string>(), reviews: new Map() };
globalStore.__foodbookContentStore = store;

export const localRestaurants = seedRestaurants;
export const localPosts = store.posts;
export const localFollows = store.follows;
export const localLikes = store.likes;
export const localSaves = store.saves;
export function key(userId: string, entityId: string) { return `${userId}:${entityId}`; }
export function toggleSet(collection: Set<string>, value: string, enabled: boolean) { if (enabled) collection.add(value); else collection.delete(value); return enabled; }
export function createLocalPost(input: { authorId: string; caption: string; image: string; restaurantId?: string }) { const post: Post = { id: `p_${randomBytes(8).toString("hex")}`, author: "FoodBook member", handle: "@member", avatar: "FB", time: "just now", caption: input.caption, image: input.image, place: input.restaurantId ?? "Your food diary", likes: 0, comments: 0, liked: false, saved: false }; store.posts.unshift(post); return post; }
export function addLocalReview(restaurantId: string, userId: string, rating: number, body: string) { const reviews = store.reviews.get(restaurantId) ?? []; if (reviews.some((review) => review.userId === userId)) throw new Error("You have already reviewed this restaurant."); const review = { id: `rev_${randomBytes(8).toString("hex")}`, userId, restaurantId, rating, body, createdAt: new Date().toISOString() }; reviews.unshift(review); store.reviews.set(restaurantId, reviews); return review; }
export function localReviewList(restaurantId: string) { return store.reviews.get(restaurantId) ?? []; }
export function localRestaurant(id: string): Restaurant | null { return localRestaurants.find((restaurant) => restaurant.id === id) ?? null; }
export function localPost(id: string) { return store.posts.find((post) => post.id === id) ?? null; }
