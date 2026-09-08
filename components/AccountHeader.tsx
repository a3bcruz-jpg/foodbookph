import Link from "next/link";

export function AccountHeader({ active, account }: { active: "profile" | "settings"; account: { displayName: string; username: string } }) {
  return <header className="account-topbar"><Link className="brand" href="/"><span className="brand-mark">F</span><span>foodbook<span className="brand-accent">PH</span></span></Link><nav><Link className={active === "profile" ? "active" : ""} href="/profile">My profile</Link><Link href="/friends">Fellow Customers</Link><Link className={active === "settings" ? "active" : ""} href="/settings">Settings</Link><Link href="/">Home</Link></nav><span className="account-top-name">@{account.username}</span></header>;
}
