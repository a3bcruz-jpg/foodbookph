import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAccount } from "@/lib/session";
import { getOwnerDashboard } from "@/lib/owner-repository";
import { OwnerRestaurantPhotos } from "@/components/OwnerRestaurantPhotos";

export default async function OwnerPhotosPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?next=/owner/photos");
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) redirect("/profile");
  const dashboard = await getOwnerDashboard(account.id);
  if (!dashboard) redirect("/owner");
  return <main className="owner-menu-page"><header className="owner-menu-header"><div><Link href="/owner" className="owner-back-link">← Owner dashboard</Link><span className="eyebrow">RESTAURANT STUDIO</span><h1>Restaurant Photos</h1><p>Manage the photos shown on your restaurant listing.</p></div><div className="owner-menu-user">{account.displayName}</div></header><OwnerRestaurantPhotos restaurantId={dashboard.restaurant.id} initialPhotos={dashboard.restaurant.photos} /></main>;
}
