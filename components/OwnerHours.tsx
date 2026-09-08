"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

type Hour = { dayOfWeek: number; isClosed: boolean; openTime: string | null; closeTime: string | null };

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const defaults: Hour[] = days.map((_, dayOfWeek) => ({ dayOfWeek, isClosed: false, openTime: "09:00", closeTime: "21:00" }));

export function OwnerHours({ restaurantId, restaurantName, initialHours }: { restaurantId: string; restaurantName: string; initialHours: Hour[] }) {
  const [hours, setHours] = useState<Hour[]>(defaults);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialHours.length) setHours(defaults.map((fallback) => initialHours.find((hour) => hour.dayOfWeek === fallback.dayOfWeek) ?? fallback));
  }, [initialHours]);

  function update(dayOfWeek: number, patch: Partial<Hour>) {
    setHours((current) => current.map((hour) => hour.dayOfWeek === dayOfWeek ? { ...hour, ...patch } : hour));
  }

  async function save() {
    setSaving(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/owner/hours", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurantId, hours }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) setError(data.error ?? "Unable to save business hours.");
      else setMessage("Business hours saved successfully.");
    } catch { setError("We could not save your business hours. Try again."); }
    finally { setSaving(false); }
  }

  return <section className="hours-page">
    <div className="hours-head"><div><span className="hours-eyebrow">RESTAURANT STUDIO</span><h1>Business hours</h1><p>{restaurantName} · Set the hours guests should see on your listing.</p></div><span className="hours-icon"><Clock3 size={22} /></span></div>
    <div className="hours-card">
      <div className="hours-table-head"><span>Day</span><span>Status</span><span>Opening</span><span>Closing</span></div>
      {hours.map((hour) => <div className="hours-row" key={hour.dayOfWeek}>
        <strong>{days[hour.dayOfWeek]}</strong>
        <label className="hours-toggle"><input type="checkbox" checked={!hour.isClosed} onChange={(event) => update(hour.dayOfWeek, { isClosed: !event.target.checked })} /><span>{hour.isClosed ? "Closed" : "Open"}</span></label>
        <input aria-label={`${days[hour.dayOfWeek]} opening time`} type="time" value={hour.openTime ?? "09:00"} disabled={hour.isClosed} onChange={(event) => update(hour.dayOfWeek, { openTime: event.target.value })} />
        <input aria-label={`${days[hour.dayOfWeek]} closing time`} type="time" value={hour.closeTime ?? "21:00"} disabled={hour.isClosed} onChange={(event) => update(hour.dayOfWeek, { closeTime: event.target.value })} />
      </div>)}
    </div>
    <div className="hours-footer"><div>{message && <span className="hours-success">{message}</span>}{error && <span className="hours-error">{error}</span>}</div><button type="button" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save business hours"}</button></div>
    <style jsx>{`.hours-page{max-width:920px;margin:0 auto;padding:8px 0 48px;color:#25332e}.hours-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px}.hours-eyebrow{font-size:11px;letter-spacing:.18em;font-weight:700;color:#64746d}.hours-head h1{font-family:Georgia,serif;font-size:42px;line-height:1.05;margin:8px 0}.hours-head p{color:#6d7a75;margin:0}.hours-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;background:#e9f0e5}.hours-card{border:1px solid #dce2dd;border-radius:18px;background:#fff;overflow:hidden;box-shadow:0 10px 28px rgba(30,45,38,.05)}.hours-table-head,.hours-row{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:16px;align-items:center;padding:16px 20px}.hours-table-head{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#7a8781;background:#f6f8f5;border-bottom:1px solid #e2e7e2}.hours-row{border-bottom:1px solid #edf0ed}.hours-row:last-child{border-bottom:0}.hours-row input[type=time]{width:100%;border:1px solid #d7ded9;border-radius:9px;padding:10px;background:#fff;color:#25332e}.hours-row input:disabled{background:#f3f5f3;color:#a1aaa5}.hours-toggle{display:flex;align-items:center;gap:9px;font-size:14px;color:#596761}.hours-toggle input{width:17px;height:17px}.hours-footer{display:flex;justify-content:space-between;align-items:center;min-height:56px;margin-top:18px}.hours-footer button{border:0;border-radius:10px;background:#263732;color:#fff;padding:12px 18px;font-weight:700;cursor:pointer}.hours-footer button:disabled{opacity:.6;cursor:wait}.hours-success{color:#3d6d45;font-size:14px}.hours-error{color:#b4453c;font-size:14px}@media(max-width:680px){.hours-head h1{font-size:34px}.hours-table-head{display:none}.hours-row{grid-template-columns:1fr 1fr;gap:12px}.hours-row strong{grid-column:1/-1}.hours-footer{align-items:flex-start;gap:12px;flex-direction:column}.hours-footer button{width:100%}}`}</style>
  </section>;
}
