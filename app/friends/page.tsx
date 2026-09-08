import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { CustomerFriends } from "@/components/CustomerFriends";

export default async function FriendsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (!account.roles.includes("CUSTOMER")) redirect("/owner");
  return <CustomerFriends account={{ displayName: account.displayName, username: account.username, avatar: account.avatar }} />;
}
