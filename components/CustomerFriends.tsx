"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock3, Lock, Search, Shield, UserPlus, UserRound, UserX, Users, X } from "lucide-react";
import styles from "./CustomerFriends.module.css";

type Customer = { id: string; username: string; displayName: string; avatarUrl: string | null; bio: string | null };
type CardCustomer = Customer & { relationship: "NONE" | "FRIENDS" | "REQUEST_SENT" | "REQUEST_RECEIVED"; following: boolean };
type Account = { displayName: string; username: string; avatar: string | null };

export function CustomerFriends({ account }: { account: Account }) {
  const [tab, setTab] = useState<"discover" | "requests" | "friends" | "privacy">("discover");
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<CardCustomer[]>([]);
  const [incoming, setIncoming] = useState<Array<{ id: string; customer: Customer }>>([]);
  const [outgoing, setOutgoing] = useState<Array<{ id: string; customer: Customer }>>([]);
  const [friends, setFriends] = useState<Customer[]>([]);
  const [privacy, setPrivacy] = useState({ profileVisibility: "PUBLIC", discoverable: true, showActivity: true, allowFriendRequests: true, allowFollows: true });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const loadDiscover = async () => {
    const response = await fetch(`/api/customers?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setCustomers(data.customers ?? []);
  };

  const loadConnections = async () => {
    const response = await fetch("/api/customers/connections", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setIncoming(data.incoming ?? []);
    setOutgoing(data.outgoing ?? []);
    setFriends(data.friends ?? []);
  };

  const loadPrivacy = async () => {
    const response = await fetch("/api/customers/privacy", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    if (data.privacy) setPrivacy(data.privacy);
  };

  useEffect(() => { loadDiscover(); }, [query]);
  useEffect(() => { loadConnections(); loadPrivacy(); }, []);

  const action = async (payload: Record<string, string>) => {
    const key = `${payload.action}:${payload.targetUserId ?? payload.requestId ?? ""}`;
    setBusy(key);
    setMessage("");
    try {
      const response = await fetch("/api/customers/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update connection.");
      setMessage("Updated successfully.");
      await Promise.all([loadDiscover(), loadConnections()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update connection.");
    } finally { setBusy(null); }
  };

  const savePrivacy = async (next: typeof privacy) => {
    setPrivacy(next);
    const response = await fetch("/api/customers/privacy", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
    setMessage(response.ok ? "Privacy settings saved." : "Unable to save privacy settings.");
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/" className={styles.back}><ArrowLeft size={15} /> Back to FoodBookPH</Link>
          <span className={styles.eyebrow}>FOODBOOKPH COMMUNITY</span>
          <h1>Fellow Customers</h1>
          <p>Discover people who share your love of food, restaurants, and local finds.</p>
        </div>
        <div className={styles.me}><span className={styles.avatar}>{account.avatar ? <img src={account.avatar} alt="" /> : account.displayName.slice(0, 2).toUpperCase()}</span><div><strong>{account.displayName}</strong><small>@{account.username}</small></div></div>
      </header>

      <nav className={styles.tabs} aria-label="Customer community">
        <button className={tab === "discover" ? styles.active : ""} onClick={() => setTab("discover")}><Search size={16} /> Find customers</button>
        <button className={tab === "requests" ? styles.active : ""} onClick={() => setTab("requests")}><Clock3 size={16} /> Requests {incoming.length ? <b>{incoming.length}</b> : null}</button>
        <button className={tab === "friends" ? styles.active : ""} onClick={() => setTab("friends")}><Users size={16} /> Friends {friends.length ? <b>{friends.length}</b> : null}</button>
        <button className={tab === "privacy" ? styles.active : ""} onClick={() => setTab("privacy")}><Shield size={16} /> Privacy</button>
      </nav>

      {message && <div className={styles.notice}>{message}</div>}

      {tab === "discover" && <section>
        <div className={styles.search}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or username" aria-label="Search customers" /></div>
        <div className={styles.grid}>
          {customers.map((customer) => <CustomerCard key={customer.id} customer={customer} busy={busy} onAction={action} />)}
          {!customers.length && <div className={styles.empty}><UserRound size={28} /><h2>No customers found</h2><p>Try another name or username.</p></div>}
        </div>
      </section>}

      {tab === "requests" && <section className={styles.stack}>
        <div><h2>Friend requests</h2><p>People who want to connect with you.</p></div>
        {incoming.map((request) => <div className={styles.row} key={request.id}><CustomerIdentity customer={request.customer} /><div className={styles.rowActions}><button className={styles.primary} onClick={() => action({ action: "accept", requestId: request.id })}><Check size={15} /> Accept</button><button className={styles.outline} onClick={() => action({ action: "decline", requestId: request.id })}><X size={15} /> Decline</button></div></div>)}
        {!incoming.length && <div className={styles.empty}><Clock3 size={28} /><h2>No pending requests</h2><p>You are all caught up.</p></div>}
        {!!outgoing.length && <><div className={styles.divider} /><div><h2>Sent requests</h2><p>Requests waiting for a response.</p></div>{outgoing.map((request) => <div className={styles.row} key={request.id}><CustomerIdentity customer={request.customer} /><span className={styles.pending}>Pending</span></div>)}</>}
      </section>}

      {tab === "friends" && <section className={styles.stack}>
        <div><h2>Your food circle</h2><p>Customers you have connected with.</p></div>
        {friends.map((friend) => <div className={styles.row} key={friend.id}><CustomerIdentity customer={friend} /><div className={styles.rowActions}><Link className={styles.outline} href={`/customers/${friend.username}`}>View profile</Link><button className={styles.danger} onClick={() => action({ action: "remove-friend", targetUserId: friend.id })}><UserX size={15} /> Remove</button></div></div>)}
        {!friends.length && <div className={styles.empty}><Users size={28} /><h2>Your food circle is empty</h2><p>Find fellow customers and start building your community.</p><button className={styles.primary} onClick={() => setTab("discover")}><UserPlus size={15} /> Find customers</button></div>}
      </section>}

      {tab === "privacy" && <section className={styles.privacy}>
        <div><h2>Privacy & discovery</h2><p>Control what other customers can discover and what activity they can see.</p></div>
        <PrivacyToggle label="Discoverable in customer search" description="Allow your profile to appear in Find customers." checked={privacy.discoverable} onChange={(value) => savePrivacy({ ...privacy, discoverable: value })} />
        <PrivacyToggle label="Show food activity" description="Allow public profile visitors to see recent reviews and posts." checked={privacy.showActivity} onChange={(value) => savePrivacy({ ...privacy, showActivity: value })} />
        <PrivacyToggle label="Accept friend requests" description="Allow other customers to send you connection requests." checked={privacy.allowFriendRequests} onChange={(value) => savePrivacy({ ...privacy, allowFriendRequests: value })} />
        <PrivacyToggle label="Accept follows" description="Allow other customers to follow your activity." checked={privacy.allowFollows} onChange={(value) => savePrivacy({ ...privacy, allowFollows: value })} />
        <div className={styles.privacyField}><label>Profile visibility</label><select value={privacy.profileVisibility} onChange={(event) => savePrivacy({ ...privacy, profileVisibility: event.target.value })}><option value="PUBLIC">Public</option><option value="CONNECTIONS">Connections only</option><option value="PRIVATE">Private</option></select></div>
        <div className={styles.safety}><Lock size={17} /><div><strong>What we never show</strong><p>Your email address, password, session data, or other private account credentials are never part of the public customer profile.</p></div></div>
      </section>}
    </main>
  );
}

function CustomerIdentity({ customer }: { customer: Customer }) {
  return <div className={styles.identity}><span className={styles.avatar}>{customer.avatarUrl ? <img src={customer.avatarUrl} alt="" /> : customer.displayName.slice(0, 2).toUpperCase()}</span><div><strong>{customer.displayName}</strong><small>@{customer.username}</small>{customer.bio ? <p>{customer.bio}</p> : null}</div></div>;
}

function CustomerCard({ customer, busy, onAction }: { customer: CardCustomer; busy: string | null; onAction: (payload: Record<string, string>) => Promise<void> }) {
  const key = (action: string) => `${action}:${customer.id}`;
  return <article className={styles.card}><CustomerIdentity customer={customer} /><div className={styles.cardActions}>{customer.relationship === "FRIENDS" ? <span className={styles.connected}><Check size={14} /> Friends</span> : customer.relationship === "REQUEST_SENT" ? <span className={styles.pending}><Clock3 size={14} /> Request sent</span> : customer.relationship === "REQUEST_RECEIVED" ? <button className={styles.primary} disabled={busy === key("accept")} onClick={() => onAction({ action: "friend-request", targetUserId: customer.id })}><UserPlus size={15} /> Connect</button> : <button className={styles.primary} disabled={busy === key("friend-request")} onClick={() => onAction({ action: "friend-request", targetUserId: customer.id })}><UserPlus size={15} /> Add friend</button>}<button className={customer.following ? styles.following : styles.outline} disabled={busy === key(customer.following ? "unfollow" : "follow")} onClick={() => onAction({ action: customer.following ? "unfollow" : "follow", targetUserId: customer.id })}>{customer.following ? "Following" : "Follow"}</button><button className={styles.iconDanger} aria-label={`Block ${customer.displayName}`} onClick={() => onAction({ action: "block", targetUserId: customer.id })}><Shield size={14} /></button></div></article>;
}

function PrivacyToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className={styles.toggle}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className={styles.switch} /></label>;
}
