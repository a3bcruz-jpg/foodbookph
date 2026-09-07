import { redirect } from "next/navigation";
import { getOwnerMenu } from "@/lib/owner-repository";
import { getCurrentAccount } from "@/lib/session";
import { OwnerMenu } from "@/components/OwnerMenu";

export default async function OwnerMenuPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?next=/owner/menu");
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) redirect("/profile");
  const menu = await getOwnerMenu(account.id);
  if (!menu) redirect("/owner");
  return <OwnerMenu accountName={account.displayName} restaurantId={menu.restaurantId} initialCategories={menu.categories} />;
}
