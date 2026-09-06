"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "", username: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const isRegister = mode === "register";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await response.json() as { error?: string };
      if (!response.ok) { setError(data.error ?? "Something went wrong."); return; }
      setSuccess(isRegister ? "Your FoodBookPH account is ready." : "Welcome back.");
      setTimeout(() => router.push("/profile"), 350);
    } catch { setError("We could not reach FoodBookPH. Try again."); } finally { setLoading(false); }
  }
  return <main className="auth-page"><div className="auth-art"><button className="brand auth-brand" onClick={() => router.push("/")}><span className="brand-mark">F</span><span>foodbook<span className="brand-accent">PH</span></span></button><div className="auth-art-copy"><span className="eyebrow">THE LOCAL TABLE</span><h1>Good food finds<br /><em>good company.</em></h1><p>A place for the dishes, places, and people that make the Philippines taste like home.</p></div><span className="auth-art-note">Discover more. Share honestly.</span></div><section className="auth-panel"><div className="auth-form-wrap"><span className="eyebrow">{isRegister ? "JOIN THE COMMUNITY" : "WELCOME BACK"}</span><h2>{isRegister ? "Make yourself at home." : "Pick up where you left off."}</h2><p className="auth-subtitle">{isRegister ? "Create one identity for every food story ahead." : "Sign in to keep your food circle close."}</p><form onSubmit={submit} noValidate>{isRegister && <><label>Display name<input required minLength={2} maxLength={60} value={values.displayName} onChange={(event) => setValues({ ...values, displayName: event.target.value })} placeholder="Alex Cruz" /></label><label>Username<div className="input-prefix"><span>@</span><input required value={values.username} onChange={(event) => setValues({ ...values, username: event.target.value.replace(/^@/, "") })} placeholder="alexcruz" /></div></label></>}<label>Email<input type="email" required value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" /></label><label>Password<input type="password" required minLength={8} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder={isRegister ? "8+ characters, upper, lower, number" : "Your password"} /></label>{error && <div className="form-message error" role="alert">{error}</div>}{success && <div className="form-message success" role="status">{success}</div>}<button className="primary-button auth-submit" disabled={loading}>{loading ? "Working..." : isRegister ? "Create my account" : "Log in"}</button></form><p className="auth-switch">{isRegister ? "Already a member?" : "New to FoodBookPH?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link></p></div></section></main>;
}
