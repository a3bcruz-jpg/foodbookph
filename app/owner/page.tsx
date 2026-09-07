import { redirect } from "next/navigation";
import { getOwnerDashboard } from "@/lib/owner-repository";
import { listRestaurants } from "@/lib/content-repository";
import { getCurrentAccount } from "@/lib/session";
import { OwnerDashboard } from "@/components/OwnerDashboard";

export default async function OwnerPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?next=/owner");
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) redirect("/profile");
  const dashboard = await getOwnerDashboard(account.id);
  const unclaimedRestaurants = dashboard ? [] : (await listRestaurants()).filter((restaurant) => !restaurant.claimed).map((restaurant) => ({ id: restaurant.id, name: restaurant.name, location: restaurant.location }));
  return <OwnerDashboard account={{ id: account.id, displayName: account.displayName, username: account.username }} dashboard={dashboard} unclaimedRestaurants={unclaimedRestaurants} />;
}
