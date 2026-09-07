import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { AccountHeader } from "@/components/AccountHeader";
import { ProfileSettings } from "@/components/ProfileSettings";

export default async function SettingsPage() { const account = await getCurrentAccount(); if (!account) redirect("/login?next=/settings"); if (account.roles.includes("RESTAURANT_OWNER") || account.roles.includes("ADMIN")) redirect("/owner"); return <main className="account-page"><AccountHeader active="settings" account={account} /><section className="account-content settings-content"><div className="section-heading"><div><span className="eyebrow">YOUR IDENTITY</span><h1>Account settings</h1><p>Keep your FoodBookPH profile feeling like you.</p></div></div><ProfileSettings account={account} /></section></main>; }
