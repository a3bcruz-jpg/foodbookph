import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type AccountStatus = "ACTIVE" | "SUSPENDED";
export type AccountRole = "CUSTOMER" | "ADMIN" | "RESTAURANT_OWNER" | "RESTAURANT_MANAGER" | "CREATOR";
export type Account = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  status: AccountStatus;
  roles: AccountRole[];
};

type PublicAccount = Omit<Account, "passwordHash">;

type AccountStore = { accounts: Account[]; sessions: Map<string, string> };
const globalStore = globalThis as typeof globalThis & { __foodbookAccountStore?: AccountStore };
const store: AccountStore = globalStore.__foodbookAccountStore ?? { accounts: [], sessions: new Map() };
globalStore.__foodbookAccountStore = store;

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function normalizeUsername(username: string) { return username.trim().toLowerCase().replace(/^@/, ""); }
export function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
export function verifyPassword(password: string, storedHash: string) { const [salt, key] = storedHash.split(":"); if (!salt || !key) return false; const derived = scryptSync(password, salt, 64); const expected = Buffer.from(key, "hex"); return expected.length === derived.length && timingSafeEqual(expected, derived); }
export function publicAccount(account: Account): PublicAccount { const { passwordHash: _passwordHash, ...safeAccount } = account; return safeAccount; }

export function createAccount(input: { email: string; password: string; username: string; displayName: string }) {
  const email = normalizeEmail(input.email);
  const username = normalizeUsername(input.username);
  if (store.accounts.some((account) => account.email === email)) throw new Error("An account with that email already exists.");
  if (store.accounts.some((account) => account.username === username)) throw new Error("That username is already taken.");
  const now = new Date().toISOString();
  const account: Account = { id: `usr_${randomBytes(10).toString("hex")}`, email, username, displayName: input.displayName.trim(), avatar: null, bio: "", passwordHash: hashPassword(input.password), createdAt: now, updatedAt: now, status: "ACTIVE", roles: ["CUSTOMER"] };
  store.accounts.push(account);
  return account;
}

export function authenticate(email: string, password: string) { const account = store.accounts.find((item) => item.email === normalizeEmail(email)); return account && account.status === "ACTIVE" && verifyPassword(password, account.passwordHash) ? account : null; }
export function createSession(accountId: string) { const token = randomBytes(32).toString("base64url"); store.sessions.set(token, accountId); return token; }
export function deleteSession(token: string) { store.sessions.delete(token); }
export function getAccountFromSession(token?: string | null) { const id = token ? store.sessions.get(token) : undefined; return id ? store.accounts.find((account) => account.id === id) ?? null : null; }
export function updateAccount(accountId: string, input: { username?: string; displayName?: string; bio?: string; avatar?: string | null }) {
  const account = store.accounts.find((item) => item.id === accountId);
  if (!account) return null;
  const username = input.username === undefined ? account.username : normalizeUsername(input.username);
  if (store.accounts.some((item) => item.id !== accountId && item.username === username)) throw new Error("That username is already taken.");
  account.username = username; account.displayName = input.displayName?.trim() || account.displayName; account.bio = input.bio?.trim() ?? account.bio; account.avatar = input.avatar === undefined ? account.avatar : input.avatar; account.updatedAt = new Date().toISOString();
  return account;
}

export function updatePassword(accountId: string, currentPassword: string, nextPassword: string) {
  const account = store.accounts.find((item) => item.id === accountId);
  if (!account || !verifyPassword(currentPassword, account.passwordHash)) return false;
  account.passwordHash = hashPassword(nextPassword);
  account.updatedAt = new Date().toISOString();
  return true;
}
