"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Brand } from "@/components/Brand";

type AuthRole = "CUSTOMER" | "RESTAURANT_OWNER";

export function AuthForm({ mode, audience = "customer" }: { mode: "login" | "register"; audience?: "customer" | "owner" }) {
  const router = useRouter();
  const initialRole: AuthRole = audience === "owner" ? "RESTAURANT_OWNER" : "CUSTOMER";
  const [values, setValues] = useState({
    email: "",
    password: "",
    username: "",
    displayName: "",
    role: initialRole,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json() as { error?: string; account?: { roles?: string[] } };
      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSuccess(isRegister ? "Your FoodBookPH account is ready." : "Welcome back.");
      const destination = values.role === "RESTAURANT_OWNER" ? "/owner" : "/profile";
      setTimeout(() => router.push(destination), 350);
    } catch {
      setError("We could not reach FoodBookPH. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-art">
        <button className="auth-brand" onClick={() => router.push("/")} aria-label="FoodBookPH home">
          <Brand href={undefined} />
        </button>
        <div className="auth-art-copy">
          <span className="eyebrow">THE LOCAL TABLE</span>
          <h1>Good food finds<br /><em>good company.</em></h1>
          <p>A place for the dishes, places, and people that make the Philippines taste like home.</p>
        </div>
        <span className="auth-art-note">Discover more. Share honestly.</span>
      </div>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="eyebrow">{isRegister ? "JOIN FOODBOOKPH" : "WELCOME BACK"}</span>
          <h2>{isRegister ? "Make yourself at home." : "Pick up where you left off."}</h2>
          <p className="auth-subtitle">{isRegister ? "Choose the account relationship that matches how you use FoodBookPH." : "Choose how you are signing in so we can take you to the right experience."}</p>

          <form onSubmit={submit} noValidate>
            <div className="role-picker" aria-label="FoodBookPH account type">
              <p className="role-picker-title">I&apos;m using FoodBookPH as a...</p>
              <div className="role-options">
                <label className={values.role === "CUSTOMER" ? "role-option selected" : "role-option"}>
                  <input type="radio" name="role" checked={values.role === "CUSTOMER"} onChange={() => setValues({ ...values, role: "CUSTOMER" })} />
                  <span><strong>Customer</strong><small>Discover food, write reviews, and connect with fellow customers.</small></span>
                </label>
                <label className={values.role === "RESTAURANT_OWNER" ? "role-option selected" : "role-option"}>
                  <input type="radio" name="role" checked={values.role === "RESTAURANT_OWNER"} onChange={() => setValues({ ...values, role: "RESTAURANT_OWNER" })} />
                  <span><strong>Restaurant Owner</strong><small>Manage your restaurant, menu, photos, posts, and reviews.</small></span>
                </label>
              </div>
            </div>

            {isRegister && (
              <>
                <label>
                  Display name
                  <input required minLength={2} maxLength={60} value={values.displayName} onChange={(event) => setValues({ ...values, displayName: event.target.value })} placeholder="Alex Cruz" />
                </label>
                <label>
                  Username
                  <div className="input-prefix">
                    <span>@</span>
                    <input required value={values.username} onChange={(event) => setValues({ ...values, username: event.target.value.replace(/^@/, "") })} placeholder="alexcruz" />
                  </div>
                </label>
              </>
            )}
            <label>
              Email
              <input type="email" required value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" />
            </label>
            <label>
              Password
              <input type="password" required minLength={8} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder={isRegister ? "8+ characters, upper, lower, number" : "Your password"} />
            </label>
            {error && <div className="form-message error" role="alert">{error}</div>}
            {success && <div className="form-message success" role="status">{success}</div>}
            <button className="btn auth-submit" type="submit" disabled={loading}>
              {loading ? (isRegister ? "Creating account..." : "Signing in...") : (isRegister ? "Create account" : "Sign in")}
            </button>
            <p className="inline-link">
              {isRegister ? "Already have an account?" : "Need an account?"}
              <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create one"}</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
