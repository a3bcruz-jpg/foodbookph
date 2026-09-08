import { createHash, randomBytes } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { authenticate, createAccount, createSession, deleteSession, getAccountFromSession, publicAccount, updateAccount, updatePassword, normalizeAccountRole } from "@/lib/account-store";
import type { Account } from "@/lib/account-store";

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const toAccount = (user: { id: string; email: string; username: string; displayName: string; avatarUrl: string | null; bio: string | null; passwordHash: string; status: "ACTIVE" | "SUSPENDED"; createdAt: Date; updatedAt: Date; roles: Array<{ role: string }> }): Account => ({ id: user.id, email: user.email, username: user.username, displayName: user.displayName, avatar: user.avatarUrl, bio: user.bio ?? "", passwordHash: user.passwordHash, status: user.status, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString(), roles: user.roles.map((role) => role.role as Account["roles"][number]) });

export async function registerAccount(input: { email: string; password: string; username: string; displayName: string; role?: "CUSTOMER" | "RESTAURANT_OWNER" }) {
  const prisma = getPrisma();
  if (!prisma) return createAccount(input);
  const existing = await prisma.user.findFirst({ where: { OR: [{ email: input.email.trim().toLowerCase() }, { username: input.username.trim().toLowerCase().replace(/^@/, "") }] } });
  if (existing) throw new Error(existing.email === input.email.trim().toLowerCase() ? "An account with that email already exists." : "That username is already taken.");
  const role = normalizeAccountRole(input.role);
  const user = await prisma.user.create({ data: { email: input.email.trim().toLowerCase(), username: input.username.trim().toLowerCase().replace(/^@/, ""), displayName: input.displayName.trim(), passwordHash: (await import("@/lib/account-store")).hashPassword(input.password), roles: { create: { role } }, ...(role === "CUSTOMER" ? { privacy: { create: {} } } : {}) }, include: { roles: true } });
  return toAccount(user);
}

export async function loginAccount(email: string, password: string) {
  const prisma = getPrisma();
  if (!prisma) return authenticate(email, password);
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, include: { roles: true } });
  if (!user || user.status !== "ACTIVE" || !(await import("@/lib/account-store")).verifyPassword(password, user.passwordHash)) return null;
  return toAccount(user);
}

export async function startSession(accountId: string) {
  const prisma = getPrisma();
  if (!prisma) return createSession(accountId);
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({ data: { userId: accountId, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) } });
  return token;
}

export async function endSession(token: string) {
  const prisma = getPrisma();
  if (!prisma) return deleteSession(token);
  await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
}

export async function accountFromSession(token?: string | null) {
  const prisma = getPrisma();
  if (!prisma) { const account = getAccountFromSession(token); return account ? publicAccount(account) : null; }
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: { include: { roles: true } } } });
  if (!session || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") return null;
  return publicAccount(toAccount(session.user));
}

export async function updatePersistentAccount(accountId: string, input: { username?: string; displayName?: string; bio?: string; avatar?: string | null }) {
  const prisma = getPrisma();
  if (!prisma) return updateAccount(accountId, input);
  const username = input.username?.trim().toLowerCase().replace(/^@/, "");
  if (username) { const duplicate = await prisma.user.findFirst({ where: { username, NOT: { id: accountId } } }); if (duplicate) throw new Error("That username is already taken."); }
  const user = await prisma.user.update({ where: { id: accountId }, data: { ...(username ? { username } : {}), ...(input.displayName !== undefined ? { displayName: input.displayName.trim() } : {}), ...(input.bio !== undefined ? { bio: input.bio.trim() } : {}), ...(input.avatar !== undefined ? { avatarUrl: input.avatar } : {}) }, include: { roles: true } });
  return toAccount(user);
}

export async function updatePersistentPassword(accountId: string, currentPassword: string, nextPassword: string) {
  const prisma = getPrisma();
  if (!prisma) return updatePassword(accountId, currentPassword, nextPassword);
  const user = await prisma.user.findUnique({ where: { id: accountId } });
  if (!user || !(await import("@/lib/account-store")).verifyPassword(currentPassword, user.passwordHash)) return false;
  await prisma.user.update({ where: { id: accountId }, data: { passwordHash: (await import("@/lib/account-store")).hashPassword(nextPassword) } });
  return true;
}
