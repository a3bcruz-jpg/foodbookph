"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";
import { FileText, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";

type Post = { id: string; caption: string; createdAt: string; image: string };

export function OwnerPosts({ restaurantId, initialPosts }: { restaurantId: string; initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startCreate() {
    setEditingId(null); setCaption(""); setImage(""); setError(""); setOpen(true);
  }

  function startEdit(post: Post) {
    setEditingId(post.id); setCaption(post.caption); setImage(post.image); setError(""); setOpen(true);
  }

  async function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^(image\/jpeg|image\/png|image\/webp)$/i.test(file.type)) { setError("Please choose a JPG, PNG, or WebP image."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Post image must be 8 MB or smaller."); return; }
    setBusy(true); setError("");
    try {
      const blob = await upload(`restaurants/${restaurantId}/posts/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/owner/posts/upload",
        clientPayload: JSON.stringify({ restaurantId }),
      });
      setImage(blob.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally { setBusy(false); }
  }

  async function save() {
    const cleanCaption = caption.trim();
    if (!cleanCaption) { setError("Write something before publishing."); return; }
    if (cleanCaption.length > 280) { setError("Caption must be 280 characters or fewer."); return; }
    if (image && !/^https:\/\//i.test(image)) { setError("Post image must use a secure https:// URL."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(editingId ? `/api/owner/posts/${editingId}` : "/api/owner/posts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, caption: cleanCaption, image }),
      });
      const data = await response.json() as { post?: Post; error?: string };
      if (!response.ok || !data.post) throw new Error(data.error ?? "Unable to save post.");
      const saved = data.post;
      setPosts((current) => editingId ? current.map((post) => post.id === saved.id ? saved : post) : [saved, ...current]);
      setOpen(false); setEditingId(null); setCaption(""); setImage("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save post.");
    } finally { setBusy(false); }
  }

  async function remove(postId: string) {
    if (!window.confirm("Delete this restaurant post?")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/owner/posts/${postId}`, { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to delete post.");
      setPosts((current) => current.filter((post) => post.id !== postId));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to delete post.");
    } finally { setBusy(false); }
  }

  return <div className="owner-posts-view">
    <div className="owner-section-heading"><div><span className="eyebrow">YOUR VOICE</span><h2>Posts</h2><p>Share announcements, new dishes, promos, and updates with the FoodBookPH community.</p></div><span className="owner-pill">{posts.length} posts</span></div>
    <div className="owner-post-toolbar"><button className="primary-button" type="button" onClick={startCreate}><Plus size={15} />Create post</button></div>
    {error && <p className="owner-error" role="alert">{error}</p>}
    {open && <div className="owner-post-composer"><div className="owner-form-heading"><div><span className="eyebrow">{editingId ? "EDIT UPDATE" : "NEW UPDATE"}</span><h3>{editingId ? "Edit post" : "Create a post"}</h3></div><button type="button" aria-label="Close post form" onClick={() => setOpen(false)}><X size={17} /></button></div><label className="owner-field">What&apos;s happening?<textarea rows={5} maxLength={280} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Tell diners what&apos;s new at your restaurant..." /><small>{caption.length}/280</small></label><div className="owner-post-image-actions"><button type="button" className="outline-button" disabled={busy} onClick={() => inputRef.current?.click()}><ImagePlus size={15} />{busy ? "Uploading..." : "Add photo"}</button><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} hidden disabled={busy} />{image && <button type="button" className="text-button danger" disabled={busy} onClick={() => setImage("")}><Trash2 size={14} />Remove photo</button>}</div>{image && <div className="owner-post-image-preview"><img src={image} alt="Post preview" /><span>Photo preview</span></div>}<div className="owner-form-actions"><button type="button" className="outline-button" onClick={() => setOpen(false)}>Cancel</button><button type="button" className="primary-button" disabled={busy} onClick={save}>{busy ? "Saving..." : editingId ? "Save changes" : "Publish post"}</button></div></div>}
    {posts.length ? <div className="owner-post-list">{posts.map((post) => <article key={post.id}><div className="owner-post-card-head"><span className="owner-pill">{new Date(post.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span><div><button className="text-button" type="button" disabled={busy} onClick={() => startEdit(post)}><Pencil size={14} />Edit</button><button className="text-button danger" type="button" disabled={busy} onClick={() => remove(post.id)}><Trash2 size={14} />Delete</button></div></div><p>{post.caption}</p>{post.image && <img className="owner-post-image" src={post.image} alt="Restaurant post" loading="lazy" />}</article>)}</div> : !open && <div className="owner-placeholder"><span className="owner-onboarding-icon"><FileText size={22} /></span><h2>Share what&apos;s new</h2><p>Keep diners informed with restaurant updates, new dishes, events, and special offers.</p><button className="primary-button" type="button" onClick={startCreate}><Plus size={15} />Create your first post</button></div>}
  </div>;
}
