"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

type Photo = { id: string; url: string; alt: string | null };

export function OwnerRestaurantPhotos({ restaurantId, initialPhotos }: { restaurantId: string; initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function addPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^(image\/jpeg|image\/png|image\/webp)$/i.test(file.type)) { setError("Please choose a JPG, PNG, or WebP image."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Restaurant photo must be 8 MB or smaller."); return; }
    setBusy(true); setError("");
    try {
      const blob = await upload(`restaurants/${restaurantId}/photos/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/owner/restaurant-photos/upload",
        clientPayload: JSON.stringify({ restaurantId }),
      });
      const response = await fetch("/api/owner/restaurant-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, url: blob.url, alt: alt.trim() }),
      });
      const data = await response.json() as { photo?: Photo; error?: string };
      if (!response.ok || !data.photo) throw new Error(data.error ?? "Unable to save restaurant photo.");
      setPhotos((current) => [...current, data.photo!]);
      setAlt("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Photo upload failed.");
    } finally { setBusy(false); }
  }

  async function removePhoto(photoId: string) {
    if (!window.confirm("Delete this restaurant photo?")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/owner/restaurant-photos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurantId, photoId }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to delete photo.");
      setPhotos((current) => current.filter((photo) => photo.id !== photoId));
    } catch (removeError) { setError(removeError instanceof Error ? removeError.message : "Unable to delete photo."); }
    finally { setBusy(false); }
  }

  return <div className="owner-photos-view">
    <div className="owner-section-heading"><div><span className="eyebrow">RESTAURANT MEDIA</span><h2>Photos</h2><p>Add photos that represent your restaurant, dining space, and food.</p></div><span className="owner-pill">{photos.length} photos</span></div>
    <div className="owner-photo-upload-card">
      <div><ImagePlus size={22} /><strong>Add restaurant photo</strong><span>JPG, PNG, or WebP · maximum 8 MB</span></div>
      <label className="owner-field"><span>Photo description</span><input value={alt} maxLength={160} onChange={(event) => setAlt(event.target.value)} placeholder="e.g. Cozy dining area" /></label>
      <button type="button" className="primary-button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? "Uploading..." : "Upload photo"}</button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={addPhoto} disabled={busy} hidden />
    </div>
    {error && <p className="owner-error" role="alert">{error}</p>}
    {photos.length ? <div className="owner-photo-grid">{photos.map((photo) => <article className="owner-photo-card" key={photo.id}><img src={photo.url} alt={photo.alt ?? "Restaurant photo"} /><div><span>{photo.alt || "Restaurant photo"}</span><button type="button" className="text-button danger" disabled={busy} onClick={() => removePhoto(photo.id)}><Trash2 size={14} />Delete</button></div></article>)}</div> : <div className="owner-placeholder"><ImagePlus size={22} /><h3>No restaurant photos yet</h3><p>Upload your first photo to make the listing more inviting.</p></div>}
  </div>;
}
