import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Star, Users } from "lucide-react";
import { getCurrentAccount } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";

export default async function CustomerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (!account.roles.includes("CUSTOMER")) redirect("/owner");
  const prisma = getPrisma();
  if (!prisma) redirect("/friends");
  const { username } = await params;
  const user = await prisma.user.findFirst({ where: { username: username.replace(/^@/, "").toLowerCase(), status: "ACTIVE", roles: { some: { role: "CUSTOMER" } } }, include: { privacy: true } });
  if (!user || !user.privacy?.discoverable || user.privacy.profileVisibility === "PRIVATE") redirect("/friends");
  const friendship = user.id === account.id ? true : Boolean(await prisma.friendship.findFirst({ where: { OR: [{ userAId: account.id, userBId: user.id }, { userAId: user.id, userBId: account.id }] } }));
  if (user.privacy.profileVisibility === "CONNECTIONS" && !friendship) redirect("/friends");
  const [friends, reviews, posts] = await Promise.all([
    prisma.friendship.count({ where: { OR: [{ userAId: user.id }, { userBId: user.id }] } }),
    friendship && user.privacy.showActivity ? prisma.review.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, rating: true, body: true, createdAt: true, restaurant: { select: { name: true } } } }) : [],
    friendship && user.privacy.showActivity ? prisma.post.findMany({ where: { authorId: user.id }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, caption: true, createdAt: true, media: { take: 1, select: { url: true, alt: true } } } }) : [],
  ]);

  return <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
    <Link href="/friends" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#5b7652", fontSize: 13, textDecoration: "none", marginBottom: 30 }}><ArrowLeft size={15} /> Fellow Customers</Link>
    <section style={{ background: "#fff", border: "1px solid #e6eae5", borderRadius: 8, padding: 30 }}>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}><div style={{ width: 82, height: 82, borderRadius: "50%", background: "#d9e9d1", display: "grid", placeItems: "center", color: "#3e5c42", fontWeight: 700, fontSize: 22, overflow: "hidden" }}>{user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.displayName.slice(0, 2).toUpperCase()}</div><div><span style={{ color: "#5b7652", fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>FOODBOOKPH CUSTOMER</span><h1 style={{ fontFamily: "Newsreader, Georgia, serif", fontWeight: 500, fontSize: 38, margin: "8px 0 3px", color: "#23302d" }}>{user.displayName}</h1><p style={{ color: "#77827e", margin: 0 }}>@{user.username}</p>{user.bio ? <p style={{ color: "#53645c", maxWidth: 600, lineHeight: 1.5 }}>{user.bio}</p> : null}</div></div>
      <div style={{ display: "flex", gap: 35, borderTop: "1px solid #e6eae5", borderBottom: "1px solid #e6eae5", padding: "16px 0", margin: "28px 0" }}><strong><Users size={14} style={{ verticalAlign: -2 }} /> {friends} friends</strong><strong><Star size={14} style={{ verticalAlign: -2 }} /> {reviews.length} recent reviews</strong><strong>{posts.length} recent posts</strong></div>
      {!user.privacy.showActivity ? <p style={{ color: "#77827e" }}>This customer has limited their food activity visibility.</p> : !friendship && user.privacy.profileVisibility === "CONNECTIONS" ? <p style={{ color: "#77827e" }}>This customer shares activity with connections only.</p> : <div style={{ display: "grid", gap: 12 }}>{reviews.map((review) => <article key={review.id} style={{ border: "1px solid #e6eae5", borderRadius: 6, padding: 16 }}><strong>{review.restaurant.name}</strong><span style={{ color: "#c98f22", marginLeft: 10 }}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}</span><p style={{ color: "#53645c", lineHeight: 1.5, marginBottom: 0 }}>{review.body}</p></article>)}{posts.map((post) => <article key={post.id} style={{ border: "1px solid #e6eae5", borderRadius: 6, padding: 16 }}><strong>FoodBookPH post</strong><p style={{ color: "#53645c", lineHeight: 1.5, marginBottom: 0 }}>{post.caption}</p></article>)}{!reviews.length && !posts.length ? <p style={{ color: "#77827e" }}>No public food activity yet.</p> : null}</div>}
    </section>
  </main>;
}
