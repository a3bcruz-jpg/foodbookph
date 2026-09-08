import { getPrisma } from "@/lib/prisma";
import { isCustomerAccount } from "@/lib/account-role";

export async function requireCustomer(account: { id: string; roles: string[] } | null) {
  if (!account) throw new Error("AUTH_REQUIRED");
  if (!isCustomerAccount(account.roles)) throw new Error("CUSTOMER_ONLY");
  const prisma = getPrisma();
  if (!prisma) throw new Error("DATABASE_REQUIRED");
  return prisma;
}

export function orderedPair(a: string, b: string) {
  return a < b ? [a, b] as const : [b, a] as const;
}

export function publicCustomer(user: {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
  };
}
