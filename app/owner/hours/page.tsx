import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getOwnerHours } from "@/lib/owner-hours-repository";
import { OwnerHours } from "@/components/OwnerHours";

export default async function OwnerHoursPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?next=/owner/hours");
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) redirect("/profile");
  const data = await getOwnerHours(account.id);
  if (!data) redirect("/owner");
  return <main style={{ minHeight: "100vh", padding: "48px 28px", background: "#fbfcfa" }}><OwnerHours restaurantId={data.restaurantId} restaurantName={data.restaurantName} initialHours={data.hours.map((hour) => ({ dayOfWeek: hour.dayOfWeek, isClosed: hour.isClosed, openTime: hour.openTime, closeTime: hour.closeTime }))} /></main>;
}
