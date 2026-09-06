import { cookies } from "next/headers";
import { accountFromSession } from "@/lib/account-repository";

export const SESSION_COOKIE = "foodbook_session";
export async function getCurrentAccount() { const token = (await cookies()).get(SESSION_COOKIE)?.value; return accountFromSession(token); }
