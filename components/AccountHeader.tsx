import Link from "next/link";
import { Brand } from "./Brand";

type AccountHeaderProps = {
  active: "profile" | "settings";
  account: { displayName: string; username: string };
};

export function AccountHeader({ active, account }: AccountHeaderProps) {
  return (
    <header className="account-topbar">
      <Brand />
      <nav>
        <Link className={active === "profile" ? "active" : ""} href="/profile">My profile</Link>
        <Link href="/friends">Fellow Customers</Link>
        <Link className={active === "settings" ? "active" : ""} href="/settings">Settings</Link>
        <Link href="/">Home</Link>
      </nav>
      <span className="account-top-name">@{account.username}</span>
    </header>
  );
}
