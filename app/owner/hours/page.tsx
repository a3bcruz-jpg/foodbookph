import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getOwnerHours } from "@/lib/owner-hours-repository";
import { OwnerHours } from "@/components/OwnerHours";

export default async function OwnerHoursPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?next=/owner/hours");
  if (!account.roles.includes("RESTAURANT_OWNER") && !account.roles.includes("ADMIN")) redirect("/profile");

  const data = await getOwnerHours(account.id);

  if (!data) {
    return (
      <main style={{ minHeight: "100vh", padding: "48px 28px", background: "#fbfcfa", color: "#25332e" }}>
        <section style={{ maxWidth: 920, margin: "0 auto", border: "1px solid #dce2dd", borderRadius: 18, background: "#fff", padding: "48px", boxShadow: "0 10px 28px rgba(30,45,38,.05)" }}>
          <span style={{ fontSize: 11, letterSpacing: ".18em", fontWeight: 700, color: "#64746d" }}>RESTAURANT STUDIO</span>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 42, lineHeight: 1.08, margin: "10px 0 14px" }}>Connect your restaurant first.</h1>
          <p style={{ maxWidth: 650, color: "#6d7a75", fontSize: 16, lineHeight: 1.6, marginBottom: 28 }}>
            Business hours are attached to a restaurant listing. Add your restaurant or claim an existing listing, then return here to set the hours guests should see.
          </p>
          <Link href="/owner" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "#263732", color: "#fff", padding: "12px 18px", fontWeight: 700, textDecoration: "none" }}>
            Go to restaurant setup
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", padding: "48px 28px", background: "#fbfcfa" }}>
      <OwnerHours
        restaurantId={data.restaurantId}
        restaurantName={data.restaurantName}
        initialHours={data.hours.map((hour) => ({
          dayOfWeek: hour.dayOfWeek,
          isClosed: hour.isClosed,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
        }))}
      />
    </main>
  );
}
